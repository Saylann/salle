// VueSalle : les notes lues dans l'app, la liste des séances, le guide des exercices.
// Une note s'affiche en cartes, une par partie, qui s'ouvrent au toucher (jamais un mur de texte). La note reste la vérité :
// « Modifier la note » l'ouvre dans Obsidian.
{
  const TITRES = { programme: 'Programme', club: 'Ma salle', manger: 'Manger' };
  // 2.33.0 (demande : voir aussi l'animation dans l'onglet Programme) : la petite animation d'un exercice (ses 2 photos qui
  // alternent, « Tu dois sentir » dessous ; un toucher l'agrandit). Sans photo pour cet exercice : rien.
  const animProg = (plugin, nom) => {
    let a = null;
    try { a = animation(plugin, nom); } catch (e) { a = null; }
    if (!a) return null;
    a.classList.add('salle-anim-mini');
    a.classList.add('salle-anim-prog');
    return a;
  };
  const ICONE_NOTE = { programme: 'programme', club: 'club', manger: 'manger' };
  const fmtRepos = (s) => (s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`);

  // ── La liste de courses (note « Manger », section « Les courses de la semaine ») ──
  // 2.17.0 (demande : une vraie liste de courses, pas un bloc de texte) : un produit par ligne, qu'on coche d'un toucher
  // en faisant ses courses. Dans la note : une puce par produit ; une ligne tout en gras est un titre de groupe ; une autre
  // ligne est une remarque. Ce qui est coché est gardé sur l'appareil (pas dans la note), jusqu'à « Tout décocher » (en haut).
  const CLE_COURSES = 'salle-courses';
  const estCourses = (titre) => L.norm(titre || '') === 'les courses de la semaine';
  // 2.41.4 : « Idée pour ton goûter » : le prochain repas, dit simplement.
  const IDEE_POUR = { matin: 'ton matin', midi: 'ton midi', gouter: 'ton goûter', soir: 'ce soir' };
  const lireCoches = () => {
    try { const l = JSON.parse(window.localStorage.getItem(CLE_COURSES) || '[]'); return new Set(Array.isArray(l) ? l.map(String) : []); } catch (e) { return new Set(); }
  };
  const garderCoches = (coches) => { try { window.localStorage.setItem(CLE_COURSES, JSON.stringify([...coches])); } catch (e) { /* gardé en mémoire, le temps de l'écran */ } };
  const listeCourses = (vue, lignes) => {
    if (!vue.courses) vue.courses = lireCoches();
    const changer = (faire) => { faire(vue.courses); garderCoches(vue.courses); vue.rendre(); };
    const boite = h('div', { cls: 'salle-courses' });
    // « Tout décocher », toujours là, en haut de la liste (2.18.1, il l'a demandé) : grisé tant que rien n'est coché.
    boite.appendChild(h('button', { cls: 'salle-bouton salle-mini salle-courses-vider', text: 'Tout décocher', icone: 'defaire', disabled: !vue.courses.size, onclick: () => changer((c) => c.clear()) }));
    for (const brute of lignes || []) {
      const l = String(brute).trim();
      if (!l) continue;
      const puce = /^[-*+]\s+(.+)$/.exec(l);
      if (!puce) { boite.appendChild(h('p', { cls: /^\*\*[^*]+\*\*$/.test(l) ? 'salle-courses-titre' : 'salle-petit salle-courses-note' }, enGras(l))); continue; }
      const produit = puce[1].replace(/\*\*/g, '').trim(), pris = vue.courses.has(produit);
      boite.appendChild(h('button', {
        cls: 'salle-courses-ligne' + (pris ? ' salle-courses-pris' : ''), type: 'button', role: 'checkbox', 'aria-checked': pris ? 'true' : 'false',
        onclick: () => changer((c) => { if (pris) c.delete(produit); else c.add(produit); }),
      }, h('span', { cls: 'salle-courses-case', 'aria-hidden': 'true' }, pris ? (icone('valider') || '✓') : ''), h('span', { cls: 'salle-courses-produit', text: produit })));
    }
    return boite;
  };

  // ── Les plats d'un repas (note « Manger », « ## Midi » puis « ### Poulet et riz ») ──
  // 2.18.0 (demande : des plats par repas, la recette au toucher, un onglet pour le matin, les courses en bas, le tout lié) : une ligne par plat (L.plats) ; un toucher ouvre sa
  // recette (ses ingrédients en puces, ses étapes numérotées), un autre la referme. Un seul plat ouvert à la fois.
  const listePlats = (vue, sec, k) => {
    const { avant, plats } = L.plats(sec.lignes);
    const boite = h('div', { cls: 'salle-plats' });
    if (avant.some((l) => String(l).trim())) boite.appendChild(texteRiche(avant));
    plats.forEach((plat, n) => {
      const cle = `${k}:${n}`, ouvert = vue.platOuvert === cle;
      boite.appendChild(h('button', {
        cls: 'salle-plat' + (ouvert ? ' salle-plat-ouvert' : ''), type: 'button', 'aria-expanded': ouvert ? 'true' : 'false',
        onclick: () => { vue.platOuvert = ouvert ? null : cle; vue.rendre(); },
      }, h('span', { cls: 'salle-plat-nom', text: plat.nom }), h('span', { cls: 'salle-plat-signe', 'aria-hidden': 'true', text: ouvert ? '▾' : '▸' })));
      if (ouvert) boite.appendChild(h('div', { cls: 'salle-plat-recette' }, texteRiche(plat.lignes)));
    });
    return boite;
  };
  // Ce qu'une partie de note montre une fois dépliée : dans « Manger », la liste de courses à cocher, les plats d'un repas ;
  // sinon, et partout ailleurs, son texte.
  const corpsSection = (vue, type, sec, k) => {
    if (type !== 'manger') return texteRiche(sec.lignes);
    if (estCourses(sec.titre)) return listeCourses(vue, sec.lignes);
    return L.plats(sec.lignes).plats.length ? listePlats(vue, sec, k) : texteRiche(sec.lignes);
  };

  Object.assign(VueSalle.prototype, {
    // ── Les notes lues dans l'app ──
    ecranNote(r) {
      const p = this.plugin, e = p.etat, type = this.noteType;
      this.entete(r, TITRES[type] || 'Note', true, ICONE_NOTE[type] || 'note');
      const texte = (e.textes || {})[type];
      if (type === 'programme') {
        // La durée de chaque séance du programme, avec le modèle de durée (ordre, approches, ton rythme, cardio de fin).
        const reglages = reglagesVue(p);
        for (const s of e.programme) {
          let duree = '';
          try {
            const sj = L.preparerSeance({ nom: s.nom, exos: s.exos.map((x) => Object.assign({}, x)), lignes: [] },
              { seances: e.seances, programme: e.programme, reglages, temps: Math.max(60, reglages.duree) });
            duree = sj.duree.texte;
          } catch (err) {
            duree = `environ ${L.dureeEstimee(s.exos)} min`;
          }
          r.appendChild(h('div', { cls: 'salle-carte salle-prog-seance' },
            h('h3', { text: s.nom }),
            h('div', { cls: 'salle-petit salle-nombre', text: `${s.exos.length} exercices · ${duree}` }),
            s.exos.map((x, i) => h('div', { cls: 'salle-prog-exo' },
              h('strong', { cls: 'salle-prog-exo-nom', text: `${i + 1}. ${x.nom}` }),
              h('div', { cls: 'salle-infos' },
                h('span', { cls: 'salle-info salle-nombre', text: `${x.series} × ${x.min === x.max ? x.min : `${x.min}-${x.max}`}${x.unite === 's' ? ' s' : ''}` }),
                h('span', { cls: 'salle-info', icone: 'repos', text: fmtRepos(x.repos) }),
                L.estEtage && L.estEtage(x.etage) ? h('span', { cls: 'salle-info', text: L.nomEtage(x.etage) }) : null,
                x.option ? h('span', { cls: 'salle-info', text: 'retiré en 45 min' }) : null),
              animProg(p, x.nom),
              (x.reglage || (reglages.machines || {})[L.norm(x.nom)]) ? h('div', { cls: 'salle-petit', text: L.texteReglage((reglages.machines || {})[L.norm(x.nom)] ? Object.assign({}, x, { monReglage: reglages.machines[L.norm(x.nom)] }) : x, e.guide) }) : null,
              Array.isArray(x.alternatives) && x.alternatives.length ? h('div', { cls: 'salle-petit', text: 'Si c\'est pris : ' + x.alternatives.map((a) => a.nom).join(', ') }) : null))));
        }
      }
      // « Manger » : 2.40.1, l'objectif de protéines du jour est dans les jauges de la carte « Aujourd'hui » (66b-calories.js),
      // plus en ligne à part.
      // « Ma salle » : d'abord ce que disent les réglages (le nom, l'adresse, le trajet, les étages : L.lignesSalle), avec le
      // lien « Voir sur Google Maps » ; puis la note, pour le reste (horaires, sac…). Rien de la salle n'est écrit dans le code.
      if (type === 'club') {
        const reg = reglagesVue(p), lignes = L.lignesSalle(reg), url = L.urlCarte(reg.salle);
        if (lignes.length) r.appendChild(h('div', { cls: 'salle-carte salle-lecture salle-ma-salle' }, texteListe(lignes),
          url ? h('button', { cls: 'salle-lien', type: 'button', text: 'Voir sur Google Maps', icone: 'club', onclick: () => { try { window.open(url); } catch (e) { console.error('Salle :', e); } } }) : null));
      }
      if (texte == null) {
        if (type !== 'programme') r.appendChild(h('div', { cls: 'salle-carte salle-alerte' }, h('p', { text: 'Cette note est introuvable dans le coffre. Le reste marche sans elle.' })));
        return;
      }
      if (type === 'manger') {
        this.ecranManger(r, texte);
        if (e.fichiers && e.fichiers.manger) r.appendChild(h('div', { cls: 'salle-bas' }, h('button', { cls: 'salle-bouton salle-mini', text: 'Modifier la note', icone: 'modifier', onclick: () => p.ouvrirNote('manger') })));
        return;
      }
      // « Manger » : « Calories d'un plat » (66b-calories.js). 2.40.0 (demande : « mets le truc de l'appareil photo au-dessus ») :
      // tout en haut, avant la liste des aliments.
      let calories = type !== 'manger';
      const mettreCalories = () => { if (!calories) { calories = true; partieSure(r, () => this.carteCalories()); } };
      mettreCalories();
      // 2.40.1 (demande : « réordonne en fonction de la journée ») : dans « Manger », le repas du moment d'abord, puis les suivants,
      // puis ceux déjà passés ; les autres parties (courses…) ensuite ; la liste des aliments (le début de la note) à la fin.
      // Chaque partie garde son rang dans la note (k) : « ouvrir sur le repas du moment » (accueil) reste juste.
      let parties = L.sections(texte).map((sec, k) => ({ sec, k }));
      if (type === 'manger') {
        const noms = L.MOMENTS_REPAS.map((m) => m[0]), ici = noms.length - L.repasRestants(new Date().getHours());
        const place = (x) => { const n = x.sec.titre ? noms.indexOf(L.norm(x.sec.titre)) : -1; return n < 0 ? -1 : (n - ici + noms.length) % noms.length; };
        parties = parties.filter((x) => place(x) >= 0).sort((a, b) => place(a) - place(b))
          .concat(parties.filter((x) => x.sec.titre && place(x) < 0), parties.filter((x) => !x.sec.titre));
      }
      parties.forEach(({ sec, k }) => {
        if (type === 'programme' && sec.titre) return;   // les séances sont déjà affichées au-dessus
        if (sec.titre) mettreCalories();
        if (!sec.titre && type !== 'programme') {
          r.appendChild(h('div', { cls: 'salle-carte salle-lecture' }, texteRiche(sec.lignes)));
          return;
        }
        const ouvert = this.sectionOuverte === k;
        const carte = h('div', { cls: 'salle-carte salle-lecture' },
          h('button', { cls: 'salle-rang', 'aria-expanded': ouvert ? 'true' : 'false', onclick: () => { this.sectionOuverte = ouvert ? null : k; this.rendre(); } },
            h('strong', { text: sec.titre || 'L\'effort, ta semaine, modifier le programme', icone: sec.titre ? null : 'info' }), h('span', { text: ouvert ? '▾' : '▸' })));
        if (ouvert) carte.appendChild(corpsSection(this, type, sec, k));
        r.appendChild(carte);
      });
      mettreCalories();
      // « Modifier la note » : seulement s'il y a une note (le guide et « Manger » sont dans le plugin depuis la 2.23.0).
      if (e.fichiers && e.fichiers[type]) r.appendChild(h('div', { cls: 'salle-bas' }, h('button', { cls: 'salle-bouton salle-mini', text: 'Modifier la note', icone: 'modifier', onclick: () => p.ouvrirNote(type) })));
    },

    // 2.41.4 (demande : « redesigne tout ça, que ce soit plus opti, plus beau » ; maquette validée le 27/11) : « Manger » en
    // quatre blocs : la carte « Aujourd'hui » (66b-calories.js), l'idée pour le prochain repas (ses plats, à déplier), « Toutes
    // les recettes » repliée (les autres repas, puis la liste des aliments du début de la note), et « Les courses de la semaine ».
    // Le prochain repas suit l'heure (L.repasRestants, comme en 2.40.1) ; « ouvrir sur un repas » (sectionOuverte, depuis
    // l'accueil) déplie « Toutes les recettes » s'il y est.
    ecranManger(r, texte) {
      partieSure(r, () => this.carteCalories());
      const noms = L.MOMENTS_REPAS.map((m) => m[0]), ici = noms.length - L.repasRestants(new Date().getHours());
      const tout = L.sections(texte).map((sec, k) => ({ sec, k }));
      const place = (x) => { const n = x.sec.titre ? noms.indexOf(L.norm(x.sec.titre)) : -1; return n < 0 ? -1 : (n - ici + noms.length) % noms.length; };
      const repas = tout.filter((x) => place(x) >= 0).sort((a, b) => place(a) - place(b));
      const courses = tout.filter((x) => x.sec.titre && estCourses(x.sec.titre));
      const autres = repas.slice(1).concat(tout.filter((x) => x.sec.titre && place(x) < 0 && !estCourses(x.sec.titre)));
      const debut = tout.filter((x) => !x.sec.titre);
      const rang = ({ sec, k }) => {
        const ouvert = this.sectionOuverte === k;
        const bloc = h('div', { cls: 'salle-recettes-repas' },
          h('button', { cls: 'salle-rang', 'aria-expanded': ouvert ? 'true' : 'false', onclick: () => { this.sectionOuverte = ouvert ? null : k; this.rendre(); } },
            h('strong', { text: sec.titre }), h('span', { text: ouvert ? '▾' : '▸' })));
        if (ouvert) bloc.appendChild(corpsSection(this, 'manger', sec, k));
        return bloc;
      };
      const prochain = repas[0];
      if (prochain) r.appendChild(h('div', { cls: 'salle-carte salle-lecture salle-idee' },
        h('div', { cls: 'salle-petit salle-idee-titre', text: `Idée pour ${IDEE_POUR[L.norm(prochain.sec.titre)] || prochain.sec.titre}` }),
        corpsSection(this, 'manger', prochain.sec, prochain.k)));
      if (autres.length || debut.length) {
        const ouvertes = !!this.recettesOuvertes || autres.some((x) => x.k === this.sectionOuverte);
        const carte = h('div', { cls: 'salle-carte salle-lecture salle-recettes' },
          h('button', { cls: 'salle-rang', 'aria-expanded': ouvertes ? 'true' : 'false', onclick: () => { this.recettesOuvertes = !ouvertes; if (ouvertes) this.sectionOuverte = null; this.rendre(); } },
            h('strong', { text: 'Toutes les recettes' }), h('span', { text: ouvertes ? '▾' : '▸' })));
        if (ouvertes) {
          autres.forEach((x) => carte.appendChild(rang(x)));
          // 2.41.7 : la liste des aliments, repliée elle aussi.
          if (debut.length) {
            const al = !!this.alimentsOuverts;
            const bloc = h('div', { cls: 'salle-recettes-repas' },
              h('button', { cls: 'salle-rang', 'aria-expanded': al ? 'true' : 'false', onclick: () => { this.alimentsOuverts = !al; this.rendre(); } },
                h('strong', { text: 'Les aliments et leurs protéines' }), h('span', { text: al ? '▾' : '▸' })));
            if (al) debut.forEach(({ sec }) => bloc.appendChild(h('div', { cls: 'salle-recettes-aliments' }, texteRiche(sec.lignes))));
            carte.appendChild(bloc);
          }
        }
        r.appendChild(carte);
      }
      courses.forEach(({ sec, k }) => {
        const ouvert = this.sectionOuverte === k;
        const carte = h('div', { cls: 'salle-carte salle-lecture' },
          h('button', { cls: 'salle-rang', 'aria-expanded': ouvert ? 'true' : 'false', onclick: () => { this.sectionOuverte = ouvert ? null : k; this.rendre(); } },
            h('strong', { text: sec.titre }), h('span', { text: ouvert ? '▾' : '▸' })));
        if (ouvert) carte.appendChild(corpsSection(this, 'manger', sec, k));
        r.appendChild(carte);
      });
    },

    // ── Les séances notées : les relire, les supprimer ──
    ecranSeances(r) {
      const p = this.plugin, e = p.etat;
      this.entete(r, 'Séances', { texte: 'Réglages', faire: () => this.ouvrirReglages() }, 'seances');
      if (!e.seances.length) {
        r.appendChild(h('div', { cls: 'salle-carte' }, h('p', { text: 'Aucune séance notée pour l\'instant.' })));
        return;
      }
      for (const s of e.seances.slice().reverse()) {
        const nb = s.exos.reduce((t, x) => t + x.series.length, 0);
        const sur = this.aSupprimer === s.chemin && confirmeRecent(this.aSupprimerLe);
        r.appendChild(h('div', { cls: 'salle-carte salle-seance-notee' },
          h('div', { cls: 'salle-ligne salle-entre' }, h('strong', { cls: 'salle-titre-carte', text: s.nom }), h('span', { cls: 'salle-petit salle-pastille', text: L.dateLongue(s.date).replace(/ \d{4}$/, '') })),
          ligneOuListe(`${nb} série${nb > 1 ? 's' : ''}${s.dureeMin ? ` · ${s.dureeMin} min` : ''}${s.cardioMin ? ` · cardio ${s.cardioMin} min` : ''} · `, s.exos.map((x) => x.nom)),
          Array.isArray(s.pasFait) && s.pasFait.length ? ligneOuListe('Pas fait : ', s.pasFait.map((x) => x.nom)) : null,
          h('div', { cls: 'salle-choix' },
            h('button', { cls: 'salle-bouton salle-mini', text: 'Ouvrir la note', icone: 'note', onclick: () => p.ouvrirChemin(s.chemin) }),
            h('button', {
              cls: 'salle-bouton salle-mini' + (sur ? ' salle-danger' : ''), text: sur ? 'Toucher encore : supprimer' : 'Supprimer', icone: 'supprimer',
              onclick: async () => {
                if (!sur) { this.aSupprimer = s.chemin; this.aSupprimerLe = Date.now(); this.rendre(); return; }
                this.aSupprimer = null;
                await p.supprimerSeance(s.chemin);
                this.rendre();
              },
            })),
          // Dit seulement au moment de supprimer (pas sous chaque séance, à chaque fois).
          sur ? h('p', { cls: 'salle-petit', text: 'Elle ira dans la corbeille du Mac ou de l\'iPhone : tu pourras la récupérer.' }) : null));
      }
    },

    // ── Le guide des exercices ──
    ecranGuide(r) {
      const p = this.plugin, g = p.etat.guide;
      this.entete(r, 'Comment faire', true, 'guide');
      const cles = Object.keys(g);
      if (!cles.length) {
        r.appendChild(h('div', { cls: 'salle-carte salle-alerte' }, h('p', { text: 'La note du guide est introuvable (en-tête « salle: guide »). Le reste marche sans elle.' })));
        return;
      }
      // 2.41.16 (demande : « Comment faire » par muscle, puis les exercices qui le travaillent) : un titre par muscle (L.MUSCLES,
      // le même lien exercice → muscle que « Tes progrès »), dessous les exercices qui le travaillent en direct, ceux de son
      // programme d'abord (marqués « Au programme ») ; pas ceux qui ne font que l'aider (texte trop long). Un exercice peut
      // venir sous deux muscles (la presse : quadriceps et fessiers) : la même fiche s'ouvre aux deux endroits.
      const auProgramme = new Set();
      (p.etat.programme || []).forEach((sea) => (sea && Array.isArray(sea.exos) ? sea.exos : []).forEach((e) => auProgramme.add(L.norm(e.nom))));
      const groupes = L.guideParMuscle(cles.map((k) => g[k].titre), auProgramme);
      for (const gr of groupes) {
        r.appendChild(h('div', { cls: 'salle-guide-muscle' },
          h('h3', { text: gr.nom }),
          h('span', { cls: 'salle-petit', text: L.pluriel(gr.directs.length, 'exercice') })));
        for (const titre of gr.directs) {
          const k = cles.find((c) => g[c].titre === titre);
          r.appendChild(this.ficheGuide(p, g, k, auProgramme.has(L.norm(titre))));
        }
      }
    },
    // Une fiche du guide : son nom (et « Au programme ») ; ouverte, sa vidéo puis le geste.
    ficheGuide(p, g, k, programme) {
      const ouvert = this.guideOuvert === k;
      const carte = h('div', { cls: 'salle-carte salle-fiche' + (ouvert ? ' salle-fiche-ouverte' : '') },
        h('button', { cls: 'salle-rang', 'aria-expanded': ouvert ? 'true' : 'false', onclick: () => { this.guideOuvert = ouvert ? null : k; this.rendre(); } },
          h('strong', { text: g[k].titre }),
          programme ? h('span', { cls: 'salle-guide-prog', text: 'Au programme' }) : null,
          h('span', { text: ouvert ? '▾' : '▸' })));
      // 2.38.84 (demande : la vidéo à la place des photos) : la fiche ouverte commence par sa vidéo, lue sur place ; sans
      // vidéo, l'animation des photos comme avant. La ligne « Vidéo » n'est jamais montrée en texte.
      if (ouvert) {
        const video = L.videoDeFiche(g[k].lignes), a = video && video.id ? null : animation(p, g[k].titre);
        if (video && video.id) carte.appendChild(lecteurVideo(p, video));
        if (a) carte.appendChild(a);
        carte.appendChild(ficheExercice(g[k].lignes, !!a, /^Vidéo$/i));
      }
      return carte;
    },
  });
}
