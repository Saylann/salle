// VueSalle : les progrès et les mesures.
// Progrès, de haut en bas : la carte du niveau (carte héros, même sans séance notée : le niveau et son titre, les XP, la
// barre, la phrase de L.conseilNiveau, l'échelle des paliers avec ce que les mesures ont changé à chaque palier et les
// photos du départ et de la dernière), puis dans l'ordre de « La bonne séance » (partie 4, ce qui compte le plus) : la
// semaine en XP (ce qu'elle a rapporté et coûté, une ligne par chose qui compte), les séries par muscle
// (barres, zone 10-15), la régularité (une colonne par semaine, un rond par séance), puis chaque exercice : ses records par
// type et sa courbe (la charge de la meilleure série : elle ne baisse pas le jour où tu montes de charge).
// Mesures : la carte du palier (un palier atteint sans mesure ou sans photo depuis, une fois par palier ; les mêmes
// conditions à chaque fois, « Prendre la photo »), la saisie (poids, épaules, bras, poitrine, taille), la tendance du poids, les
// courbes, les dernières mesures.
{
  // ── Les cartes de l'écran Progrès ──
  // « en 4 jours », « en 1 semaine », « en 5 semaines ».
  const duree = (jours) => (jours < 7 ? `en ${pluriel(jours, 'jour')}` : `en ${pluriel(Math.round(jours / 7), 'semaine')}`);
  // La phrase au-dessus d'une courbe : « 35 → 40 kg en 5 semaines », « 35 kg, comme au début ».
  const phraseCourbe = (pts) => {
    const a = pts[0], z = pts[pts.length - 1];
    const u = (v) => `${L.fmt(v)} ${z.unite || ''}`.trim();
    if (z.y === a.y) return `${u(z.y)}, comme au début (${pluriel(pts.length, 'séance')})`;
    return `${L.fmt(a.y)} → ${u(z.y)} ${duree(Math.max(0, L.joursEntre(a.date, z.date)))}`;
  };
  // Les états de la grille de régularité, en mots (lecteur d'écran) : la couleur n'est jamais seule.
  const ETATS = { ok: 'objectif atteint', rattrapee: 'rattrapée la semaine d\'après', pause: 'semaine sans salle', 'en cours': 'en cours', 'en attente': 'peut encore être rattrapée', manque: 'en dessous de l\'objectif', avant: 'avant tes débuts' };
  // Un élément avec quelques règles de style (la largeur d'une barre) : h() n'écrit que des attributs.
  const avecStyle = (el, st) => { Object.assign(el.style, st); return el; };
  // Le repère de protéines pour un poids : 1,6 à 2,2 g par kg et par jour [29], 110 g au moins (« 110 à 150 g par jour »).
  const proteinesJour = (poids) => `${Math.max(OBJECTIF.proteines.minimum, L.proteines(poids) || 0)} à ${Math.max(OBJECTIF.proteines.minimumHaut, Math.floor((poids * OBJECTIF.proteines.parKgHaut) / 5) * 5)} g`;

  // 1. La semaine (L.lignesSemaine) : ce qu'elle a rapporté et coûté en XP, une ligne par chose qui compte, cochée toute
  // seule ; « Protéines et sommeil » se coche d'un toucher sur sa ligne (2.10.0 : plus de gros bouton « Cocher », et plus de
  // tableau « Ce qui rapporte des XP » : chaque ligne dit ce qu'elle vaut).
  const carteSemaine = (vue, niv, reglages, lundi) => {
    const p = vue.plugin;
    const lignes = L.lignesSemaine(niv, reglages);
    const total = niv.semaine ? niv.semaine.total : 0;
    const contenu = (c) => [
      h('span', { cls: 'salle-case-marque ' + (c.fait ? 'salle-etat-fait' : 'salle-etat-pale'), 'aria-hidden': 'true' }, c.fait ? (icone('fait') || '✓') : ''),
      h('span', { cls: 'salle-case-texte' }, h('span', { cls: 'salle-case-titre', text: c.titre }), c.detail ? h('span', { cls: 'salle-petit', text: c.detail }) : null),
      h('span', { cls: 'salle-case-gain salle-nombre', text: c.gain })];
    return h('div', { cls: 'salle-carte salle-cases' },
      h('div', { cls: 'salle-ligne salle-entre' }, h('strong', { cls: 'salle-titre-carte', text: 'Cette semaine', icone: 'fait' }),
        h('span', { cls: 'salle-nombre salle-pastille salle-pastille-accent', text: `${total < 0 ? '−' : '+'}${L.fmtMilliers(Math.abs(total))} XP` })),
      lignes.map((c) => {
        const cls = 'salle-case' + (c.fait ? ' salle-case-faite' : '') + (c.alerte ? ' salle-case-alerte' : '') + (c.perte ? ' salle-case-perte' : '');
        const label = `${c.titre} : ${c.fait ? 'fait' : 'pas encore'}, ${c.gain} XP`;
        if (!c.manuel || typeof p.cocherRecup !== 'function') return h('div', { cls, 'aria-label': label }, contenu(c));
        return h('button', {
          cls: cls + ' salle-case-bouton', 'aria-pressed': c.fait ? 'true' : 'false', 'aria-label': label,
          onclick: async () => { await p.cocherRecup(lundi, !c.fait); vue.rendre(); },
        }, contenu(c));
      }),
      lignes.some((c) => c.alerte || c.perte) ? null : h('p', { cls: 'salle-petit salle-case-regle', text: 'Plus de 3 semaines sans séance : tu perds des XP.' }));
  };

  // L'échelle des paliers : echellePaliers (50-ui.js, partagée avec l'accueil). Dessous : ce que les mesures ont changé à
  // chaque palier atteint (jamais en rouge), puis le palier suivant et sa phrase (un objectif clair), puis les photos.
  const corpsPaliers = (corps) => h('ul', { cls: 'salle-corps-liste', 'aria-label': 'Ton corps à chaque palier' }, corps.filter((c) => c.etat !== 'avenir').map((c) => h('li', { cls: 'salle-corps-ligne' + (c.ecarts && L.texteCorps(c.ecarts) ? ' salle-corps-change' : '') },
    h('span', { cls: 'salle-corps-titre', text: c.titre }),
    h('span', { cls: 'salle-corps-texte salle-nombre', text: decouper(c.texte).tete }),
    replis(c.texte))));
  const prochainPalier = (n) => {
    const s = n.palier && n.palier.prochain;
    if (!s) return null;
    const P = L.PALIERS.find((x) => x.titre === s.titre);
    // Le palier en titre (les XP qui manquent), puis « environ 18 séances bien faites », puis sa phrase : une ligne chacun.
    return h('div', { cls: 'salle-palier-suivant' },
      h('strong', { cls: 'salle-palier-suivant-titre', text: `${s.titre} : encore ${L.fmtMilliers(s.reste)} XP` }),
      h('p', { text: `Environ ${pluriel(s.seances, 'séance')} bien ${s.seances > 1 ? 'faites' : 'faite'}.` }),
      P ? texteCourt(P.phrase) : null);
  };
  // Les photos du départ et de la dernière, côte à côte (L.photosCorps ; plugin.urlPhoto donne l'adresse du fichier). Une
  // photo introuvable (renommée, pas encore arrivée par iCloud) : sa place dit seulement la date.
  const photos = (vue, mesures) => {
    const ph = L.photosCorps(mesures), p = vue.plugin;
    if (!ph.depart || typeof p.urlPhoto !== 'function') return null;
    const cadre = (x, nom) => {
      const url = p.urlPhoto(x.photo);
      return h('figure', { cls: 'salle-photo' },
        url ? h('img', { src: url, alt: `${nom}, ${L.dateCourte(x.date)}`, loading: 'lazy' }) : h('span', { cls: 'salle-photo-vide', text: 'photo introuvable' }),
        h('figcaption', { cls: 'salle-petit salle-nombre', text: `${nom} · ${L.dateCourte(x.date)}` }));
    };
    return h('div', { cls: 'salle-photos' + (ph.derniere ? '' : ' salle-photos-une') }, cadre(ph.depart, 'Départ'), ph.derniere ? cadre(ph.derniere, 'Dernière') : null);
  };
  const carteNiveau = (vue, n, phrase) => {
    const e = vue.plugin.etat;
    let corps = null;
    try { corps = L.paliersCorps(n, e.mesures); } catch (err) { corps = null; }
    return h('div', { cls: 'salle-carte salle-heros salle-niveau-carte' },
      h('div', { cls: 'salle-niveau-entete' },
        h('span', { cls: 'salle-niveau-grand salle-nombre', 'aria-hidden': 'true', text: String(n.niveau) }),
        h('div', { cls: 'salle-niveau-quoi' },
          h('span', { cls: 'salle-niveau-surtitre', text: `Niveau ${n.niveau}` }),
          h('strong', { cls: 'salle-niveau-titre', text: n.titre })),
        h('span', { cls: 'salle-pastille salle-pastille-accent salle-nombre', text: `${L.fmtMilliers(n.xp)} XP` })),
      barreNiveau(n.part, { label: `Niveau ${n.niveau} : ${L.fmtMilliers(n.xp - n.xpNiveau)} XP sur ${L.fmtMilliers(n.xpSuivant - n.xpNiveau)}` }),
      h('div', { cls: 'salle-niveau-bornes salle-nombre' },
        h('span', { text: `${L.fmtMilliers(n.xp - n.xpNiveau)} / ${L.fmtMilliers(n.xpSuivant - n.xpNiveau)} XP` }),
        h('span', { text: `encore ${L.fmtMilliers(n.reste)} XP` })),
      phrase ? h('p', { cls: 'salle-niveau-phrase', text: phrase }) : null,
      corps ? echellePaliers(corps) : null,
      prochainPalier(n),
      corps ? corpsPaliers(corps) : null,
      photos(vue, e.mesures));
  };

  // 2. Les séries par muscle de la semaine (L.volumeSemaine) : une barre par muscle, la zone 10-15 pour dos, épaules, pecs.
  const carteVolume = (vue, vol) => {
    const R = L.REPERES_VOLUME || { zone: [10, 15], max: 20, parSeance: 8 };
    const echelle = Math.max(R.max, ...vol.map((m) => m.series)) + 2;
    const pc = (v) => `${Math.round((v / echelle) * 1000) / 10}%`;
    const trop = vol.filter((m) => m.maxSeance > R.parSeance);
    return h('div', { cls: 'salle-carte salle-volume-carte' },
      h('strong', { cls: 'salle-titre-carte', text: 'Séries par muscle cette semaine', icone: 'volume' }),
      // « dont haut des pecs » sur sa propre petite ligne, sous la barre des pecs, pas à côté du nombre :
      // la colonne des nombres garde sa largeur, et les barres (et leur zone 10-15) restent alignées d'une ligne à l'autre.
      h('div', { cls: 'salle-muscles' }, vol.flatMap((m) => [h('div', { cls: `salle-muscle salle-muscle-${m.etat}`, 'aria-label': `${m.nom} : ${L.fmt(m.series)} séries${m.dont ? `, dont ${L.fmt(m.dont)} pour le haut` : ''}${m.zone ? `, repère ${m.zone[0]} à ${m.zone[1]}` : ''}` },
        h('span', { cls: 'salle-muscle-nom', text: m.nom }),
        h('span', { cls: 'salle-muscle-barre', 'aria-hidden': 'true' },
          m.zone ? avecStyle(h('span', { cls: 'salle-zone' }), { left: pc(m.zone[0]), width: pc(m.zone[1] - m.zone[0]) }) : null,
          avecStyle(h('span', { cls: 'salle-muscle-plein' }), { width: pc(Math.min(m.series, echelle)) })),
        h('span', { cls: 'salle-muscle-nb salle-nombre', text: L.fmt(m.series) })),
        m.dont ? h('div', { cls: 'salle-muscle-dont salle-nombre', text: `dont ${L.fmt(m.dont)} pour le haut des pecs` }) : null])),
      h('p', { cls: 'salle-petit salle-legende' }, h('span', { cls: 'salle-zone-legende', 'aria-hidden': 'true' }), ` ${R.zone[0]} à ${R.zone[1]} séries par semaine : le repère ; au plus ${R.max}.`),
      trop.length ? texteCourt(`${trop.map((m) => m.nom).join(', ')} : plus de ${R.parSeance} séries dans une même séance.\nPourquoi : au-delà, une série de plus ne rapporte presque rien (preuve faible).`, 'salle-petit') : null,
      // Comment lire la carte, toujours là. La ligne « Pourquoi » reste dans le code, pas à l'écran (2.9.0, decouper dans 50-ui.js).
      consigneVerte(vue, [
        '**1 série** pour le muscle principal, **½** pour celui qui aide (le biceps dans un tirage).',
        '**Dos, côté des épaules, pecs** : vise 10 à 15 séries par semaine chacun.',
        'Pourquoi : ils font tes proportions. Des épaules larges par rapport à la taille, c\'est ce qui plaît le plus dans les études.',
      ]));
  };

  // 3. La régularité (L.regularite : une semaine ratée se rattrape, une pause ne casse rien). Une colonne par semaine depuis
  // tes débuts (12 au plus), un rond par séance face à l'objectif.
  const carteRegularite = (vue, reg, objectif) => {
    const depuis = reg.semaines.filter((s) => s.etat !== 'avant');
    const semaines = depuis.length ? depuis : reg.semaines.slice(-1);
    const colonne = (s) => {
      const ronds = [];
      for (let k = 0; k < Math.max(s.objectif || objectif, s.faites); k++) ronds.push(h('span', { cls: 'salle-grille-rond' + (k < s.faites ? ' salle-plein' : '') }));
      return h('div', {
        cls: `salle-grille-semaine salle-grille-${s.etat.replace(' ', '-')}`, role: 'listitem',
        'aria-label': `Semaine du ${L.dateCourte(s.lundi)} : ${pluriel(s.faites, 'séance')}, ${ETATS[s.etat] || s.etat}`,
      }, h('span', { cls: 'salle-grille-ronds' }, ronds), h('span', { cls: 'salle-grille-date salle-nombre', text: String(L.deISO(s.lundi).getDate()) }));
    };
    return h('div', { cls: 'salle-carte salle-regularite-carte' },
      h('div', { cls: 'salle-ligne salle-entre' }, h('strong', { cls: 'salle-titre-carte', text: 'Régularité', icone: 'jours' }), h('span', { cls: 'salle-nombre salle-pastille salle-pastille-accent', text: reg.texte })),
      h('div', { cls: 'salle-grille', role: 'list', 'aria-label': `Tes semaines depuis le ${L.dateCourte(semaines[0].lundi)}` }, semaines.map(colonne)),
      h('p', { cls: 'salle-petit', text: `Objectif : ${pluriel(objectif, 'séance')} par semaine.` }),
      consigneVerte(vue, [
        '**Une colonne** par semaine (le lundi dessous), **un rond** par séance.',
        '**Sous l\'objectif** : rien de cassé si la semaine suivante en a plus.',
        '**Semaine sans salle** (examens, vacances, malade) : prévois-la dans Réglages → Salle.',
      ]));
  };

  // 4. Un exercice : ses records par type (« Plus lourd », « Le plus de répétitions », « Le plus long ») et sa courbe.
  const carteExercice = (nom, pts, rec) => {
    const lignes = [];
    if (rec.charge) lignes.push(['Plus lourd', `${L.fmt(rec.charge.c)} kg × ${rec.charge.r}`, rec.charge.date]);
    if (rec.reps && !(rec.charge && rec.reps.c === rec.charge.c && rec.reps.r === rec.charge.r)) {
      lignes.push(['Le plus de répétitions', rec.reps.c > 0 ? `${L.fmt(rec.reps.c)} kg × ${rec.reps.r}` : `${rec.reps.r} rép.`, rec.reps.date]);
    }
    if (rec.temps) lignes.push(['Le plus long', `${rec.temps.s} s`, rec.temps.date]);
    const z = pts[pts.length - 1];
    const phrase = pts.length > 1 ? phraseCourbe(pts) : '';
    return h('div', { cls: 'salle-carte salle-prog-carte' },
      h('div', { cls: 'salle-ligne salle-entre' }, h('strong', { cls: 'salle-titre-carte', text: nom }), z.record ? h('span', { cls: 'salle-badge salle-etat-record', text: 'Record', icone: 'record' }) : null),
      phrase ? h('p', { cls: 'salle-petit salle-courbe-phrase', text: phrase }) : null,
      phrase ? courbe(pts, { unite: z.unite, label: `${nom} : ${phrase}` }) : h('p', { cls: 'salle-petit', text: 'Fait une fois : la courbe arrive à la prochaine séance.' }),
      lignes.length ? h('div', { cls: 'salle-records-exo' }, lignes.map(([titre, valeur, date]) => h('div', { cls: 'salle-ligne salle-entre' },
        h('span', { cls: 'salle-petit', text: titre }), h('span', { cls: 'salle-nombre', text: `${valeur} · ${L.dateCourte(date)}` })))) : null);
  };

  // ── La carte du palier dans Mesures ──
  // Mêmes conditions à chaque fois, sinon la comparaison ne veut rien dire (« La bonne séance » : tours au plus large, bras le
  // long du corps ; poids le matin).
  const CONDITIONS = ['**Mêmes conditions** : le matin, à jeun, même lumière, même endroit.', '**Photo** de face et de profil, détendu.'];
  // « Prendre la photo » : champPhoto (50-ui.js) ; ici, la photo est enregistrée tout de suite (plugin.ajouterPhoto).
  const boutonPhoto = (vue, fait) => champPhoto(fait ? 'Reprendre la photo' : 'Prendre la photo', !fait, async (octets) => {
    const chemin = await vue.plugin.ajouterPhoto(octets, vue.aujourdhui());
    if (chemin) new obsidian.Notice('Photo enregistrée.');
    vue.rendre();
  });
  // La carte : « Palier Régulier atteint : mesure-toi » (ou « il manque la photo »), la phrase des études, les conditions, la
  // photo. aMesurer = L.palierAMesurer(…) ; photoOk : l'appareil sait (plugin.peutPhoto) ; sinon une ligne le dit.
  const cartePalierMesures = (vue, aMesurer, photoOk) => {
    const p = vue.plugin, a = aMesurer;
    const quoi = a.rang === 0 ? 'Point de départ' : `Palier ${a.titre} atteint`;
    const titre = !a.mesure ? `${quoi} : mesure-toi` : `${quoi} : il manque la photo`;
    return h('div', { cls: 'salle-carte salle-palier-mesures', role: 'status' },
      h('strong', { cls: 'salle-titre-carte', text: titre, icone: 'mesures' }),
      texteCourt(a.phrase, 'salle-palier-phrase-mesures'),
      puces(CONDITIONS, 'salle-petit'),
      !a.mesure ? h('p', { cls: 'salle-petit', text: 'Épaules, taille, bras et poids : dans « Nouvelle mesure », juste en dessous.' }) : null,
      photoOk ? boutonPhoto(vue, a.photo) : h('p', { cls: 'salle-petit salle-photo-impossible', text: 'Photo impossible sur cet appareil : la mesure suffit.' }),
      typeof p.marquerVu === 'function' ? h('button', {
        cls: 'salle-lien', text: 'Plus tard',
        onclick: () => { p.marquerVu(`palier-${a.rang}`); vue.modePalier = null; vue.rendre(); },
      }) : null);
  };

  Object.assign(VueSalle.prototype, {
    // ── Les progrès ──
    ecranProgres(r) {
      const p = this.plugin, e = p.etat, auj = this.aujourdhui();
      const reglages = reglagesVue(p);
      this.entete(r, 'Progrès', true, 'progres');
      // Le niveau en haut, même sans séance (« Ta première séance lance ton niveau. »). Un calcul qui échoue : pas de
      // carte, le reste de l'écran s'affiche.
      let n = null;
      try { n = L.niveau(e.seances, e.programme, reglages, auj); } catch (err) {
        n = null;
        signalerErreur(err);
      }
      if (n && n.niveau >= 1) {
        let sj = null;
        try { sj = p.donnees.enCours ? null : this.seancePreparee(null, this.bilanJour()); } catch (err) { sj = null; }
        let phrase = '';
        try { phrase = L.conseilNiveau(n, sj) || ''; } catch (err) { phrase = ''; }
        partieSure(r, () => carteNiveau(this, n, phrase));
      }
      if (!e.seances.length) {
        r.appendChild(h('div', { cls: 'salle-carte' }, h('p', { text: 'Pas encore de séance notée. Tes progrès apparaissent ici dès ta première séance.' })));
        return;
      }
      // Chaque partie à part : si l'une échoue, les autres s'affichent quand même (rien ne bloque).
      if (n) partieSure(r, () => carteSemaine(this, n, reglages, L.lundi(auj)));
      partieSure(r, () => carteVolume(this, L.volumeSemaine(e.seances, auj)));
      partieSure(r, () => carteRegularite(this, L.regularite(e.seances, auj, reglages.parSemaine, reglages.pauses), reglages.parSemaine));

      // Chaque exercice : ceux du programme d'abord (dans son ordre), puis ceux des séances (libres, remplaçants).
      const vus = new Set(), noms = [];
      const ajouter = (n) => { const k = L.norm(n); if (k && !vus.has(k)) { vus.add(k); noms.push(n); } };
      e.programme.forEach((s) => s.exos.forEach((x) => ajouter(x.nom)));
      e.seances.forEach((s) => (s.exos || []).forEach((x) => ajouter(x.nom)));
      const pasFaits = [];
      r.appendChild(h('div', { cls: 'salle-titre-section salle-petit salle-section', text: 'Exercice par exercice' }));
      for (const nom of noms) {
        partieSure(r, () => {
          const pts = L.pointsCourbe(e.seances, nom);
          if (!pts.length) { pasFaits.push(nom); return null; }
          const rec = L.recordsExo(e.seances, nom);
          return carteExercice(nom, pts, rec);
        });
      }
      // 2.5.1 : une longue liste se replie (« Pas encore faits : 12 exercices », la liste en dessous d'un toucher).
      const pasFaitsTexte = 'Pas encore faits : ' + pasFaits.join(', ') + '.';
      if (pasFaits.length) r.appendChild(h('div', { cls: 'salle-carte' }, pasFaitsTexte.length <= L.LIGNE_MAX ? h('div', { cls: 'salle-petit', text: pasFaitsTexte })
        : pourquoi(pasFaits.join(', ') + '.', `Pas encore faits : ${pluriel(pasFaits.length, 'exercice')}`)));
    },

    // ── Les mesures ──
    ecranMesures(r) {
      const p = this.plugin, e = p.etat, auj = this.aujourdhui();
      this.entete(r, 'Mesures', true, 'mesures');
      // La carte du palier : un palier atteint sans mesure ou sans photo depuis ; une fois par palier (« Plus tard » ou
      // tout fait), sauf quand le bilan de fin l'ouvre (this.modePalier). Un calcul qui échoue : pas de carte.
      const photoOk = typeof p.ajouterPhoto === 'function' && typeof p.peutPhoto === 'function' && !!p.peutPhoto();
      let aMesurer = null;
      try {
        // Ouvert depuis le bilan, la séance notée n'est peut-être pas encore relue par l'index : elle compte quand même (un
        // double est écarté par L.niveau).
        const b = this.bilan && this.bilan.seance;
        const seances = b && !(e.seances || []).some((s) => s === b || (!!this.bilan.chemin && s.chemin === this.bilan.chemin)) ? (e.seances || []).concat([b]) : e.seances;
        const n = L.niveau(seances, e.programme, reglagesVue(p), auj);
        aMesurer = n ? L.palierAMesurer(n, e.mesures) : null;
      } catch (err) { aMesurer = null; }
      if (aMesurer && aMesurer.mesure && (aMesurer.photo || !photoOk)) aMesurer = null;   // sans photo possible, la mesure suffit
      const vu = aMesurer && typeof p.dejaVu === 'function' && p.dejaVu(`palier-${aMesurer.rang}`);
      if (aMesurer && (!vu || this.modePalier === aMesurer.rang)) partieSure(r, () => cartePalierMesures(this, aMesurer, photoOk));
      // (check-up 2.38.64) ce qui est tapé reste quand l'écran est redessiné (la photo du palier) ; vidé après « Enregistrer ».
      const saisie = this.saisieMesures || (this.saisieMesures = {});
      const champ = (cle, nom, unite) => h('label', { cls: 'salle-ligne salle-entre salle-mesure-ligne' }, h('span', { text: nom }),
        h('span', { cls: 'salle-ligne' }, h('input', { type: 'number', inputmode: 'decimal', step: 'any', min: '0', cls: 'salle-champ salle-nombre', value: saisie[cle] != null ? String(saisie[cle]) : null, oninput: (ev) => { saisie[cle] = L.nombre(ev.target.value); } }), h('span', { cls: 'salle-unite', text: unite })));
      const CHAMPS = [['poids', 'Poids', 'kg'], ['epaules', 'Tour d\'épaules', 'cm'], ['bras', 'Tour de bras', 'cm'], ['poitrine', 'Tour de poitrine', 'cm'], ['taille', 'Tour de taille (nombril)', 'cm']];
      r.appendChild(h('div', { cls: 'salle-carte salle-mesures-saisie' },
        h('strong', { cls: 'salle-titre-carte', text: 'Nouvelle mesure', icone: 'mesures' }),
        CHAMPS.map(([cle, nom, unite]) => champ(cle, nom, unite)),
        h('button', {
          cls: 'salle-bouton salle-principal salle-grand', text: 'Enregistrer', icone: 'valider',
          onclick: async () => {
            const m = { date: this.aujourdhui() };
            for (const [k] of CHAMPS) if (saisie[k] > 0) m[k] = saisie[k];
            if (Object.keys(m).length < 2) { new obsidian.Notice('Remplis au moins une case.'); return; }
            await p.ajouterMesure(m);
            this.saisieMesures = null;
            new obsidian.Notice('Mesure enregistrée.');
            this.rendre();
          },
        }),
        // La pesée (L.suiviPoids) : une fois par semaine, le dimanche matin à jeun. « Le physique qui plaît », changement 2 :
        // le mètre ruban le 1er dimanche du mois, taille et épaules. Toujours affiché.
        consigneVerte(this, [
          '**Poids** : une fois par semaine, le dimanche matin, à jeun.',
          '**Mètre ruban** : le 1er dimanche du mois.',
          '**Où** : taille au nombril, épaules au plus large, bras le long du corps.',
        ])));
      // 2.31.0 : le repère de l'objectif (épaules ÷ taille), puis ce que les mesures changeront au programme.
      const rapport = L.rapportV(e.mesures);
      if (rapport) {
        r.appendChild(h('div', { cls: 'salle-carte salle-mesures-rapport' },
          h('strong', { cls: 'salle-titre-carte', text: 'Ta forme en V', icone: 'mesures' }),
          h('p', { cls: 'salle-nombre salle-tendance', text: `Épaules ÷ taille : ${L.fmt(rapport.valeur)}` }),
          h('p', { cls: 'salle-petit', text: rapport.debut ? `Au départ : ${L.fmt(rapport.debut.valeur)}. Ce chiffre doit monter.` : 'C\'est ton repère : ce chiffre doit monter.' })));
      }
      const controles = L.controlesMesures(e.mesures, auj);
      if (controles.length) {
        r.appendChild(h('div', { cls: 'salle-carte salle-mesures-controles' },
          h('strong', { cls: 'salle-titre-carte', text: 'Tes mesures règlent ton programme', icone: 'mesures' }),
          controles.map((ligne) => h('p', { cls: 'salle-petit' }, enGras(ligne)))));
      }
      const poids = e.mesures.filter((m) => m.poids != null);
      const dernierPoids = poids[poids.length - 1];
      if (dernierPoids) {
        // La tendance sur 2 à 4 semaines face à la cible [30], et le conseil (avis) ; un calcul qui échoue : pas de tendance.
        let suivi = null;
        try { suivi = L.suiviPoids(poids, auj); } catch (err) { suivi = null; }
        r.appendChild(h('div', { cls: 'salle-carte salle-mesures-tendance' },
          h('strong', { cls: 'salle-titre-carte', text: 'Ton poids', icone: 'mesures' }),
          suivi ? h('p', { cls: 'salle-nombre salle-tendance', text: suivi.tendance }) : h('p', { cls: 'salle-petit', text: 'Ta tendance s\'affiche après 3 semaines de pesées.' }),
          suivi ? texteCourt(suivi.conseil, 'salle-petit') : null,
          texteCourt(`**Protéines** : ${proteinesJour(dernierPoids.poids)} par jour. Des repas simples : note « Manger ».`)));
      }
      // L'avis de la taille (L.avisTaille), dit comme un avis, avec la note « Manger simple ».
      partieSure(r, () => {
        const avis = L.avisTaille(e.mesures, auj);
        return avis ? h('div', { cls: 'salle-carte salle-avis-taille', role: 'status' }, texteCourt(avis.texte),
          h('button', { cls: 'salle-lien', text: 'Voir « Manger simple »', onclick: () => { this.noteType = 'manger'; this.sectionOuverte = null; this.aller('note'); } })) : null;
      });
      for (const [cle, nom, unite] of CHAMPS) {
        const pts = e.mesures.filter((m) => m[cle] != null);
        if (pts.length < 2) continue;
        r.appendChild(h('div', { cls: 'salle-carte salle-mesure-courbe' }, h('strong', { cls: 'salle-titre-carte', text: nom }),
          courbe(pts.map((m) => ({ date: m.date, y: m[cle] })), { unite, label: `${nom} : ${L.fmt(pts[0][cle])} → ${L.fmt(pts[pts.length - 1][cle])} ${unite}` })));
      }
      if (e.mesures.length) {
        r.appendChild(h('div', { cls: 'salle-carte' }, h('strong', { cls: 'salle-titre-carte', text: 'Dernières mesures' }),
          h('ul', { cls: 'salle-liste salle-liste-mesures' }, e.mesures.slice(-8).reverse().map((m) => h('li', { cls: 'salle-nombre', text: L.ligneMesure(Object.assign({}, m, { date: L.dateCourte(m.date), photo: null })).slice(2) + (m.photo ? ' · photo' : '') })))));
      }
    },
  });
}
