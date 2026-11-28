// VueSalle : l'écran de séance (la carte de l'exercice : 63c-seance-carte.js ; les petits calculs : 63a-seance-calculs.js).
// De haut en bas :
//  - l'en-tête (Accueil, le nom et « 23 min sur environ 1 h 10 », Terminer) et la barre d'avancement ;
//  - le repos, en plein écran, sans bouton : le temps qui reste, « Ensuite : série 2 · 60 kg × 11 », les repères du geste de
//    la série qui vient ; dans les 10 dernières secondes une seule couleur change ; à 0, 3 bips (si l'appareil sait) et 5 s
//    « C'est reparti » en vert ;
//  - « Il t'en restait combien ? » après la dernière série d'un exercice avec charge ;
//  - la carte de l'exercice : la cible en gros (« 20 kg × 12 »), l'explication sur une ligne (un toucher l'ouvre), l'effort de
//    cette série, le menu « … » (les actions rares), les séries d'approche (orange), le tableau des séries (lime et
//    coche = fait, or et trophée = record, bord lime = maintenant, pâle = à venir), le chrono du gainage, « Supersérie avec … » ;
//  - la liste des exercices (toucher pour changer), « Annuler la séance » ;
//  - le gros bouton, collé en bas au-dessus de la zone sûre de l'iPhone : un <label> qui contient l'interrupteur iOS 18 caché
//    (un toucher le bascule et l'iPhone vibre). Il reste au même endroit, quoi qu'il y ait au-dessus.
// Les calculs viennent de L (L.cibleSerie, L.effort, L.chargesApproches, L.apresSerie, L.suite, L.remplacer,
// L.recordSerie, L.bilanCompare…). Le bip et la vibration viennent du plugin : chaque appel
// vérifie d'abord que la fonction existe (rien ne casse sur un appareil qui ne sait pas, ni avec un plugin plus ancien).

{
// L'anneau du repos : la part du temps qui reste (1 → 0), posée en variable CSS (--salle-part) ; sans setProperty (vieux
// moteur, faux DOM des tests), rien.
const partAnneau = (anneau, part) => {
  if (anneau && anneau.style && typeof anneau.style.setProperty === 'function') anneau.style.setProperty('--salle-part', Math.max(0, Math.min(1, part)).toFixed(4));
};

Object.assign(VueSalle.prototype, {
  // ── Entrer dans la séance (appelé par aller('seance')) ──
  // Rien n'est encore fait : on commence par l'échauffement s'il n'est pas fait. Sinon on reprend là où on en était.
  entrerSeance() {
    this.fermerCarte(['aide']);
    const sc = this.plugin.donnees.enCours;
    if (!sc || !Array.isArray(sc.exos) || !sc.exos.length) return;
    const rien = sc.exos.every((x) => !x || x.echauffement || !Array.isArray(x.faites) || !x.faites.length);
    const k = sc.exos.findIndex((x) => x && x.echauffement && Array.isArray(x.faites) && !x.faites.length);
    if (rien && k >= 0) sc.courant = k;
  },

  // L'état de la carte de l'exercice remis à zéro : la saisie (repart de la cible), l'aide, le menu « … », l'explication,
  // la correction d'une série. sauf : les champs à garder tels quels (par exemple ['aide']).
  fermerCarte(sauf) {
    const garder = Array.isArray(sauf) ? sauf : [];
    const RIEN = { saisie: null, aide: false, menu: null, expl: false, corrige: null };
    Object.keys(RIEN).forEach((k) => { if (garder.indexOf(k) < 0) this[k] = RIEN[k]; });
  },

  // ── L'écran ──
  ecranSeance(r) {
    const p = this.plugin;
    let sc = p.donnees.enCours;
    // Une séance en cours écrite par la 1.x (data.json venu d'un autre appareil) : remise à la forme actuelle (copie).
    if (sc.version !== 2) {
      const m = L.migrerEnCours(sc);
      if (m && Array.isArray(m.exos) && m.exos.length) p.donnees.enCours = sc = m;
    }
    // L'état de l'écran appartient à une séance : une nouvelle séance repart de zéro.
    if (this.seanceVue !== sc.debut) {
      if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') window.setTimeout(() => this.allerCarte(), 0);   // 2.38.12
      this.seanceVue = sc.debut;
      this.fermerCarte(['aide']);
      this.depuis = null; this.annonce = null; this.eclat = null;
      this.sonneRepos = 0; this.sonneChrono = 0; this.sonneEch = 0;
    }
    sc.courant = Math.min(Math.max(0, Math.round(sc.courant) || 0), sc.exos.length - 1);
    const maj = [];   // ce que l'horloge met à jour toutes les 500 ms
    const toutFait = L.toutFait(sc.exos);   // l'échauffement ne bloque pas la fin ; un exercice passé compte comme fini

    // 2.38.21 (demande : l'en-tête ne doit pas être visible de base, trouve-lui un affichage ; la carte, elle, est fixe) : sur
    // téléphone, l'en-tête (Accueil, le nom et le temps, Terminer, l'avancement) est caché ; glisser vers le bas depuis le haut le
    // fait descendre par-dessus la carte (2.38.29 : plus de poignée, demande : ce trait en haut ne sert à rien), comme le panneau « La séance » monte du bas. Sur Mac, il reste à sa place (63-seance.css).
    const haut = h('div', { cls: 'salle-haut' });
    this.enteteSeance(haut, sc, maj);
    r.appendChild(haut);
    if (this.haut) this.ouvrirHaut(r, haut);
    r.appendChild(this.boiteRepos(sc, maj));
    const q = this.carteQuestion(sc);
    if (q) r.appendChild(q);
    if (toutFait) r.appendChild(this.carteFin(sc));

    const exo = sc.exos[sc.courant];
    this.minuteurEch = null;
    if (exo.echauffement) r.appendChild(this.carteEchauffement(sc, exo, maj));
    else this.carteExercice(r, sc, exo, maj);

    // 2.38.19 (demande : « La séance » monte par-dessus la carte, juste au-dessus, la carte floue derrière, comme le centre de
    // contrôle d'Apple) : la liste n'est plus sous la carte ; « Exercice 5 sur 8 » (en haut de la carte) ou le nom de la
    // séance (en-tête) l'ouvrent (panneauSeance).
    if (this.liste) {
      const fond = this.panneauSeance(sc);
      r.appendChild(fond);
      this.ouvrirEnGrand(fond.childNodes && fond.childNodes[0]);
    }
    // Le gros bouton, dernier élément de l'écran : collé en bas, au-dessus de la zone sûre (styles : .salle-barre-bas).
    r.appendChild(this.barreBas(sc, maj));

    const battre = () => maj.forEach((f) => { try { f(); } catch (e) { /* une ligne qui ne se met pas à jour ne bloque rien */ } });
    battre();
    this.horloge = window.setInterval(battre, ECRAN_SEANCE.HORLOGE_MS);
  },
  // L'en-tête : « Accueil », le nom et le temps, « Terminer » (deux touchers tant que tout n'est pas fait) ; l'avancement.
  enteteSeance(r, sc, maj) {
    const chrono = h('span', { cls: 'salle-petit salle-nombre' });
    const toutFait = L.toutFait(sc.exos);
    const confirmer = confirmeRecent(this.confirmerLe);
    r.appendChild(h('div', { cls: 'salle-entete salle-entre' },
      h('button', { cls: 'salle-retour', text: 'Accueil', icone: 'retour', title: 'La séance reste en cours : tu la reprends quand tu veux.', onclick: () => this.aller('accueil') }),
      h('div', { cls: 'salle-titre-seance' }, h('button', { cls: 'salle-lien salle-ouvrir-liste', type: 'button', 'aria-label': 'Voir la séance', onclick: () => { this.liste = true; this.haut = false; this.menu = null; this.rendre(); } }, h('h2', { text: sc.nom })), chrono),
      h('button', {
        cls: 'salle-bouton salle-mini' + (confirmer ? ' salle-principal' : ''), text: confirmer ? 'Confirmer : terminer' : 'Terminer', icone: 'terminer',
        onclick: () => {
          // (check-up 2.38.64) relu au moment du toucher : un bouton resté « Confirmer » des minutes après ne termine plus d'un coup.
          if (toutFait || confirmeRecent(this.confirmerLe)) { this.terminer(); return; }
          this.confirmerLe = Date.now();
          this.rendre();
        },
      })));
    const total = sc.exos.reduce((t, x) => t + L.seriesPrevues(x), 0);
    const avance = sc.exos.reduce((t, x) => t + Math.min(L.seriesPrevues(x), x.faites.length), 0);
    r.appendChild(h('div', { cls: 'salle-barre', role: 'progressbar', 'aria-label': 'Séries faites', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(avance) },
      h('div', { cls: 'salle-barre-pleine', style: `width:${total ? Math.round((100 * avance) / total) : 0}%` })));
    (maj || []).push(() => { chrono.textContent = ECRAN_SEANCE.temps(sc, this.aujourdhui(), Date.now()); });
  },

  // ── Le repos : en plein écran, la suite annoncée ; à la fin, un bip et 5 s « C'est reparti ». Aucun bouton (2.11.1, demande :
  // pas de bouton pour passer ou rallonger le repos ; le programme est catégorique : le repos se fait en entier). Un repos fixe d'environ 2 min donne les
  // mêmes gains qu'un repos au ressenti, en séance plus courte [17] ; 60 à 120 s suffisent à un débutant [71] ──
  boiteRepos(sc, maj) {
    const p = this.plugin;
    const temps = h('span', { cls: 'salle-repos-temps salle-nombre' });
    const mot = h('span', { text: 'Repos' });
    const suite = sc.reposFin ? L.suite(sc, p.etat.seances, p.etat.guide, this.depuis) : null;
    // 2.41.15 (demande : refaire l'écran du repos) : le temps dans un anneau qui se vide (il remplace la jauge du bas), puis
    // la série qui vient dans une carte (« Ensuite : … », la charge en gros, le poids par côté ou dans chaque main).
    const anneau = h('div', { cls: 'salle-repos-anneau', 'aria-hidden': 'true' });
    const boite = h('div', { cls: 'salle-repos', role: 'timer', 'aria-live': 'off' },
      h('div', { cls: 'salle-repos-haut' }, anneau,
        h('div', { cls: 'salle-repos-gauche' }, h('span', { cls: 'salle-repos-titre', icone: 'repos' }, mot), temps)),
      suite ? h('div', { cls: 'salle-suite' + (suite.cible ? ' salle-suite-avec' : ''), text: suite.texte }) : null,
      // Un nouvel exercice : sa charge en gros et, dessous (2.38.49, demande : sur deux lignes, c'était pas beau), ses séries.
      // 2.38.59 : le nombre qui change en vert, et la pastille du changement dessous.
      suite && suite.cible ? this.cibleSuite(sc, suite) : null,
      suite && sc.reposFin ? this.imageSuivant(sc.exos[suite.index]) : null,
      // Le repos sert à quelque chose : la question en attente (« il t'en restait combien ? »), puis les repères du geste de
      // la série qui vient (ECRAN_SEANCE.reperes).
      sc.reposFin ? this.carteQuestion(sc) : null,
      suite && sc.reposFin && sc.exos[suite.index] ? this.reperesRepos(sc.exos[suite.index], suite.texte) : null,
      this.annonce ? h('div', { cls: 'salle-repos-record', text: this.annonce, icone: 'record' }) : null,
      sc.reposFin && this.consignesRepos(sc, suite).length ? this.consigne(this.consignesRepos(sc, suite)) : null);   // la consigne de la série qui vient
    boite.style.display = 'none';
    const classe = (c) => { if (boite.className !== c) boite.className = c; };
    (maj || []).push(() => {
      const now = Date.now();
      if (!sc.reposFin) { boite.style.display = 'none'; return; }
      const reste = (sc.reposFin - now) / 1000;
      if (reste > 0) {
        boite.style.display = '';
        classe('salle-repos' + (reste <= ECRAN_SEANCE.BIENTOT ? ' salle-repos-bientot' : ''));
        mot.textContent = 'Repos';
        temps.textContent = L.fmtDuree(reste);
        // La durée totale (la jauge) : posée au lancement ; sinon (Obsidian relancé, séance 1.x) ce qui reste.
        if (!(sc.reposTotal >= reste - 1)) sc.reposTotal = Math.ceil(reste);
        partAnneau(anneau, L.fractionRepos(reste, sc.reposTotal));
      } else if (now - sc.reposFin < ECRAN_SEANCE.VERT_MS) {
        // Fini : 1,5 s en vert (VERT_MS), « C'est reparti » et « GO » en très gros, 3 bips (si le son est permis et l'app devant), l'écran remonte à la suite.
        boite.style.display = '';
        classe('salle-repos salle-repos-fini');
        mot.textContent = 'C\'est reparti';
        temps.textContent = 'GO';   // 2.36.3 : le signal du départ en très gros, à la place d'un « 0:00 » qui ne dit rien
        partAnneau(anneau, 0);
        if (this.sonneRepos !== sc.reposFin) {
          this.sonneRepos = sc.reposFin;
          if (typeof p.bip === 'function') p.bip(3);
          if (!this.aide && !this.menu && this.contentEl) this.allerCarte();
        }
      } else {
        sc.reposFin = 0;
        sc.reposTotal = 0;
        this.annonce = null;
        boite.style.display = 'none';
        p.sauver();
      }
    });
    return boite;
  },
  // La charge de la série qui vient, au repos (2.38.49 : sur deux lignes, les séries dessous) ; 2.38.59 : ce qui change par
  // rapport à ce qu'il vient de faire en vert, et sa pastille.
  cibleSuite(sc, suite) {
    const x = sc.exos[suite.index];
    let change = null;
    if (x) {
      const c = ECRAN_SEANCE.cibles(x, this.plugin.etat.seances, sc.legere);
      if (!L.legereAFaire(x, c.premiere ? c.premiere.charge : null)) change = ECRAN_SEANCE.changement(c.exo, c.cible, c.der);
    }
    const lignes = suite.cible.split(' · ');
    const morceaux = ECRAN_SEANCE.morceauxCible(lignes[0]);
    const marques = ECRAN_SEANCE.nombresChanges(morceaux, change);
    const charge = h('div', { cls: 'salle-suite-charge' });
    morceaux.forEach((m, j) => {
      if (j) charge.appendChild(document.createTextNode(' '));
      charge.appendChild(h('span', { cls: marques.has(j) ? 'salle-change' : '', text: m.texte }));
    });
    const t = ECRAN_SEANCE.texteChangement(change);
    // 2.41.14 (demande : « sur cet écran, on ne voit pas le nombre de poids par côté ») : au repos aussi, les disques de
    // chaque côté de la charge qui suit (« Par côté : 2 × 20 + 10 »), sur un appareil à disques.
    const kg = /(\d+(?:[.,]\d+)?)\s*kg/.exec(lignes[0] || '');
    const total = kg ? Number(kg[1].replace(',', '.')) : 0;
    return h('div', { cls: 'salle-suite-cible salle-nombre' }, charge,
      lignes.slice(1).map((l) => h('div', { cls: 'salle-suite-series', text: l })),
      t ? h('div', { cls: 'salle-suite-change', text: t.texte, icone: t.monte ? 'monter' : 'descendre' }) : null,
      x && total ? this.disquesRepos(x, total) : null);
  },
  // 2.41.15 (demande : au repos, le poids par côté) : sur un appareil à disques, « Par côté : » et un disque dessiné par disque
  // à mettre (les plus gros d'abord), et le total d'un côté ; aux haltères, le poids de l'haltère de chaque main. Sinon rien
  // (une pile : la charge suffit).
  disquesRepos(x, total) {
    const texte = L.texteParCote(x, total);
    if (texte) {
      const disques = L.parCote(total);
      const cote = disques.reduce((t, d) => t + d, 0);
      return h('div', { cls: 'salle-suite-disques', 'aria-label': texte },
        h('span', { cls: 'salle-disques-titre', text: 'Par côté : ' }),
        h('span', { cls: 'salle-disques-total', text: `${L.fmt(cote)} kg` }),
        h('span', { cls: 'salle-disques-pile' }, disques.map((d) => h('span', { cls: 'salle-disque salle-disque-' + String(d).replace('.', '-'), text: L.fmt(d) }))));
    }
    const main = L.texteParMain(x, total);
    return main ? h('div', { cls: 'salle-suite-main', text: main, icone: 'salle' }) : null;
  },
  // 2.38.12 (demande : que la carte remplisse l'écran dès le départ, comme quand on a fait défiler) : en séance, l'écran se
  // place sur la carte de l'exercice ; l'en-tête (Accueil, Terminer, le temps) reste juste au-dessus, à un glissement du doigt.
  // Ailleurs : tout en haut.
  allerCarte() {
    const c = this.contentEl;
    if (!c) return;
    // 2.38.20 : la page de séance ne défile plus ; la carte, si elle déborde, défile seule : on la remet en haut.
    const carteFixe = this.ecran === 'seance' && typeof c.querySelector === 'function' ? c.querySelector('.salle-exo') : null;
    if (carteFixe) carteFixe.scrollTop = 0;
    let y = 0;
    // 2.39.1 : hors séance, l'écran s'ouvre sur la carte demandée une fois (enVue) : « Calories d'un plat » après la photo de
    // l'accueil, la clé dans Réglages → Appli (2.39.2).
    const cible = this.ecran === 'seance' ? '.salle-exo' : this.enVue || null;
    this.enVue = null;
    try {
      const carte = cible && typeof c.querySelector === 'function' ? c.querySelector(cible) : null;
      if (carte && typeof carte.getBoundingClientRect === 'function' && typeof c.getBoundingClientRect === 'function') {
        y = Math.max(0, Math.round(carte.getBoundingClientRect().top - c.getBoundingClientRect().top + (c.scrollTop || 0) - 8));
      }
    } catch (e) { y = 0; }
    c.scrollTop = y;
    this.dernierY = c.scrollTop || 0;   // (check-up 2.38.64) pas une remontée du doigt : la barre d'Obsidian reste cachée
  },
  // Pose le repos dans la séance et lance « Repos salle » (le minuteur de l'iPhone) : à appeler avant tout await.
  poserRepos(sc, secondes) {
    this.sonneRepos = 0;
    if (secondes > 0) {
      sc.reposFin = Date.now() + secondes * 1000;
      sc.reposTotal = secondes;
      if (typeof this.plugin.chronoIphone === 'function') this.plugin.chronoIphone(secondes);   // sinon iOS refuse le raccourci
    } else {
      sc.reposFin = 0;
      sc.reposTotal = 0;
    }
  },
  // La commande « Lancer le repos » : le repos de l'exercice affiché, ou secondes.
  async lancerRepos(secondes) {
    const p = this.plugin, sc = p.donnees.enCours;
    if (!sc || !Array.isArray(sc.exos)) return;
    const x = sc.exos[sc.courant];
    const s = secondes > 0 ? Math.round(secondes) : x && !x.echauffement && x.repos > 0 ? x.repos : L.DUREE.tour;
    this.poserRepos(sc, s);
    await p.sauver();
    this.rendre();
  },

  // ── Après la dernière série d'un exercice avec charge : « Il t'en restait combien ? » (facultatif) ──
  carteQuestion(sc) {
    const p = this.plugin;
    const q = sc.question != null ? sc.exos[sc.question] : null;
    if (!q || q.reserve || !q.faites.length) return null;
    return h('div', { cls: 'salle-carte salle-reserve' },
      h('strong', { text: `${L.noms([q])} : il t'en restait combien ?` }),
      h('div', { cls: 'salle-choix' }, RESERVES.map(([v, t]) => h('button', {
        cls: 'salle-bouton salle-mini', text: t,
        onclick: async () => { q.reserve = v; sc.question = null; await p.sauver(); this.rendre(); },
      }))));
  },
  // ── Tout est fait : le cardio de fin, puis « Terminer » en bas ──
  // Le cardio se décide ici, la première fois que tout est fait, d'après le temps vraiment passé
  // (L.cardioAuBout) : 5 min par défaut, plus s'il reste du temps, rien à 45 min sans marge. Ensuite il ne bouge plus
  // (sc.cardioFixe), sauf s'il le change avec − et +. « Vélo plutôt que tapis » (« La bonne séance », Cardio).
  carteFin(sc) {
    const p = this.plugin;
    if (!sc.cardioFixe) {
      const reg = p.donnees && p.donnees.reglages;
      sc.cardio = L.cardioAuBout(sc, reg && reg.duree, Date.now(), this.aujourdhui());
      sc.cardioFixe = true;
      if (typeof p.sauver === 'function') p.sauver();
    }
    const prevu = sc.cardio > 0;
    // 2.34.0 (demande : « à la fin tu dis vélo, mais dis le niveau que je dois mettre ») : le niveau noté à l'échauffement.
    const niveau = sc.veloNiveau > 0 ? sc.veloNiveau : L.niveauVelo(p.etat.seances);
    return h('div', { cls: 'salle-carte salle-vedette salle-exo-fin' },
      h('h3', { text: 'Toutes les séries sont faites', icone: 'valider' }),
      h('strong', { text: prevu ? `Pour finir : ${sc.cardio} min de vélo tranquille` : 'Pas de cardio prévu : ton temps est compté', icone: 'cardio' }),
      h('p', { cls: 'salle-petit', text: !prevu ? 'Si tu en fais quand même, note les minutes.' : niveau > 0 ? `Niveau ${niveau}, comme à l'échauffement : tu dois pouvoir parler. Note les minutes faites.` : 'À un rythme où tu peux parler. Note les minutes faites.' }),
      this.compteur(sc.cardio, 5, 'min', false, (v) => { sc.cardio = v || 0; p.sauver(); }));
  },

  // ── L'échauffement, premier exercice. 5 min de vélo (minuteur basé sur l'heure : il survit à un changement
  // d'app), le niveau du vélo (repris la prochaine fois), « Fait » en bas. ──
  carteEchauffement(sc, exo, maj) {
    const p = this.plugin, fait = exo.faites.length > 0;
    const temps = h('span', { cls: 'salle-repos-temps salle-nombre', text: L.fmtDuree(VELO_MIN * 60) });
    const jauge = h('div', { cls: 'salle-repos-jauge-pleine' });
    const lancer = async () => {
      if (typeof p.preparerSon === 'function') p.preparerSon();   // un toucher : le bip de fin pourra sonner
      if (!sc.echauffeFin) { sc.echauffeFin = Date.now() + ECRAN_SEANCE.VELO_MS; await p.sauver(); this.rendre(); }
    };
    const minuteur = h('button', { cls: 'salle-repos salle-ech-minuteur', role: 'timer', 'aria-label': `Lancer le minuteur de ${VELO_MIN} minutes`, onclick: lancer },
      h('div', { cls: 'salle-repos-haut' },
        h('div', { cls: 'salle-repos-gauche' }, h('span', { cls: 'salle-repos-titre', text: sc.echauffeFin ? 'Vélo' : 'Toucher pour lancer', icone: 'echauffement' }), temps)),
      h('div', { cls: 'salle-repos-jauge' }, jauge));
    if (!fait) {
      this.minuteurEch = { temps, jauge };
      (maj || []).push(() => {
        if (!sc.echauffeFin) return;
        const reste = Math.max(0, (sc.echauffeFin - Date.now()) / 1000);
        temps.textContent = reste > 0 ? L.fmtDuree(reste) : '0:00';
        jauge.style.transform = `scaleX(${L.fractionRepos(reste, ECRAN_SEANCE.VELO_MS / 1000).toFixed(4)})`;
        if (reste <= 0 && this.sonneEch !== sc.echauffeFin) {
          this.sonneEch = sc.echauffeFin;
          if (Date.now() - sc.echauffeFin < ECRAN_SEANCE.VERT_MS) {
            new obsidian.Notice('Échauffement terminé : touche « Fait ».');
            if (typeof p.bip === 'function') p.bip(1);
          }
        }
      });
    }
    return h('div', { cls: 'salle-carte salle-exo salle-ech' },
      h('div', { cls: 'salle-exo-tete' }, this.rangExo(sc, sc.courant, exo)),
      h('h3', { text: 'Échauffement', icone: 'echauffement' }),
      h('div', { cls: 'salle-exo-cible' },
        this.cibleGros(`${VELO_MIN} min de vélo`),
        // 2.38.35 (sa capture : la phrase coupée par « … ») : en entier, la carte a la place ; plus rien à toucher pour la lire.
        h('p', {
          cls: 'salle-explication salle-explication-ouverte',
          text: 'Facile : tu dois pouvoir parler. Trop facile : monte d\'un niveau ; essoufflé : descends.',   // pas de « 70 à 80 tours » : sans source
        })),
      fait ? null : puces(ECRAN_SEANCE.PREPARER, 'salle-ech-preparer'),
      h('div', { cls: 'salle-petit', text: 'Niveau du vélo (repris la prochaine fois) :' }),
      this.compteur(sc.veloNiveau > 0 ? sc.veloNiveau : (sc.veloNiveau = L.niveauVelo(p.etat.seances)), 1, 'niv.', false, (v) => { sc.veloNiveau = v > 0 ? Math.round(v) : 0; p.sauver(); }),
      fait ? h('p', { cls: 'salle-effort', text: 'Fait. Les séries légères t\'attendent sur le premier exercice.', icone: 'valider' }) : minuteur,
      fait ? h('button', { cls: 'salle-bouton salle-mini', text: 'Remettre à faire', icone: 'defaire', onclick: async () => { exo.faites = []; sc.echauffeFin = 0; await p.sauver(); this.rendre(); } }) : null);
  },

  // ── Tous les exercices : toucher pour changer (machine prise → fais-en un autre et reviens) ──
  listeExercices(sc) {
    const carte = h('div', { cls: 'salle-carte salle-exo-liste' }, h('div', { cls: 'salle-exo-liste-titre', text: 'La séance' }));
    carte.appendChild(this.consigne(ECRAN_SEANCE.CONSIGNES.ordre));
    const etages = reglagesVue(this.plugin).etages;   // ce qu'on trouve à chaque étage (réglages)
    // 2.38.72 (demande : quand un exercice est fait, qu'il passe en bas, barré ; pas au toucher) : en haut, ce qui reste à
    // faire, dans l'ordre de la séance, avec les repères d'étage ; puis le cardio ; en bas, ce qui est fait ou passé, barré.
    // Toucher un exercice ne change pas l'ordre ; c'est le faire qui le fait descendre. La séance elle-même garde son ordre.
    const fait = (x) => (x.echauffement ? x.faites.length > 0 : L.fini(x));
    const reste = [], faits = [];
    sc.exos.forEach((x, i) => (fait(x) ? faits : reste).push(i));
    const depart = faits.length ? '' : L.departEtage(sc.exos, etages);   // l'étage du début, tant que rien n'est fait
    if (depart) carte.appendChild(h('div', { cls: 'salle-repere salle-repere-depart', text: depart, icone: 'club' }));
    const ligne = (i, barre) => {
      const x = sc.exos[i];
      const detail = (L.estEtage(x.etage) ? L.nomEtage(x.etage) + ' · ' : '') +
        (x.echauffement ? (x.faites.length ? 'fait' : 'à faire') : x.saute ? 'passé' : `${x.faites.length} / ${x.series}`) +
        (x.faites.some((f) => f && f.record) ? ' · record' : '');
      return h('button', {
        cls: 'salle-rang' + (i === sc.courant ? ' salle-courant' : '') + (L.fini(x) ? ' salle-fini' : '') + (barre ? ' salle-barre' : '') + (x.groupe ? ' salle-superserie-rang' : ''),
        'aria-current': i === sc.courant ? 'true' : null,
        onclick: () => this.allerA(i),
      }, h('span', { text: `${ECRAN_SEANCE.signe(x)} ${x.nom}`, icone: x.groupe ? 'superserie' : null }), h('span', { cls: 'salle-petit', text: detail }));
    };
    reste.forEach((i, k) => {
      const x = sc.exos[i], avant = k > 0 ? sc.exos[reste[k - 1]] : null;
      const repere = avant && L.estEtage(avant.etage) && L.estEtage(x.etage) ? L.repereEtage(avant.etage, x.etage, etages, x.nom) : '';
      if (repere) carte.appendChild(h('div', { cls: 'salle-repere', text: repere, icone: x.etage > avant.etage ? 'monter' : 'descendre' }));
      carte.appendChild(ligne(i, false));
    });
    if (sc.cardio !== 0) carte.appendChild(h('div', { cls: 'salle-rang salle-fini' }, h('span', { text: 'Cardio tranquille', icone: 'cardio' }), h('span', { cls: 'salle-petit', text: 'à la fin' })));
    faits.forEach((i) => carte.appendChild(ligne(i, true)));
    return carte;
  },
  // Aller à un exercice (la liste) : la saisie repart de sa cible ; un chrono lancé sur un autre exercice s'arrête.
  async allerA(i) {
    const p = this.plugin, sc = p.donnees.enCours;
    if (!sc || !sc.exos[i]) return;
    if (i !== sc.courant) sc.chronoDebut = 0;
    sc.courant = i;
    this.liste = false;   // 2.38.19 : choisir un exercice ferme le panneau « La séance »
    this.fermerCarte();
    await p.sauver();
    this.transition(() => { this.rendre(); this.allerCarte(); });
  },
  // « Annuler la séance » (deux touchers), sous la liste.
  // ── Glisser (2.38.23, demande : que ce soit intuitif) : pendant une séance (hors repos), glisser vers le haut depuis le bas
  // de l'écran fait monter « La séance » ; vers le bas depuis le haut, descendre l'en-tête ; le geste inverse les referme.
  // Une carte qui déborde défile d'abord. Le geste : 60 px au moins, plutôt vertical, en moins d'une seconde.
  debutGlisse(ev) {
    const t = ev && ev.touches && ev.touches[0];
    // (check-up 2.38.64) ouvert : un panneau était ouvert au début du geste (fermé pendant, sans animation, il n'ouvre pas l'en-tête).
    this.glisse = t ? { x: t.clientX, y: t.clientY, quand: Date.now(), s: (this.contentEl && this.contentEl.scrollTop) || 0, ouvert: !!(this.liste || this.haut || this.aide || this.menu) } : null;
  },
  finGlisse(ev) {
    const g = this.glisse, t = ev && ev.changedTouches && ev.changedTouches[0];
    this.glisse = null;
    // 2.38.34 : « La séance » montée avec le doigt (suiteGlisse) : lâchée assez haut (30 %) ou d'un geste vif, elle finit de
    // monter ; sinon elle redescend et se ferme. 2.38.45 : l'en-tête pareil, vers le bas.
    if (g && g.pn) {
      const avance = g.avance || 0, vite = avance / Math.max(1, Date.now() - g.quand) > 0.5;
      if (avance > g.h * 0.3 || (avance > 40 && vite)) {
        const anime = typeof window !== 'undefined' && typeof window.setTimeout === 'function' && typeof window.requestAnimationFrame === 'function';
        g.pn.style.transition = anime ? 'transform 280ms cubic-bezier(0.2, 0.9, 0.25, 1)' : 'none';
        g.fond.style.transition = anime ? 'opacity 200ms ease' : 'none';
        g.pn.style.transform = '';
        g.fond.style.opacity = '';
        if (anime) window.setTimeout(() => { g.pn.style.transition = ''; g.fond.style.transition = ''; }, 300);
      } else {
        const partir = g.sens > 0 ? this.partirListe : this.partirHaut;
        if (partir) partir();
      }
      return;
    }
    // Hors séance, un glissement ne fait rien de plus (2.38.77, demande : bloquer la barre du bas : elle ne revient plus en
    // glissant vers le bas, 2.38.58).
    if (g && t && !this.barreSeance) return;
    const sc = this.plugin.donnees.enCours;
    if (!g || !t || this.ecran !== 'seance' || !sc || (sc.reposFin && sc.reposFin > Date.now())) return;
    const dx = t.clientX - g.x, dy = t.clientY - g.y;
    if (Math.abs(dy) < 60 || Math.abs(dx) > Math.abs(dy) * 0.7 || Date.now() - g.quand > 1000) return;
    const H = (typeof window !== 'undefined' && window.innerHeight) || 800;
    const ouvre = (cle) => { this.liste = cle === 'liste'; this.haut = cle === 'haut'; this.menu = null; this.aide = false; this.rendre(); };
    // Un panneau ouvert se tire lui-même (rendreTirable) : la page ne fait rien de plus.
    if (this.liste || this.haut || g.ouvert) return;
    if (this.aide || this.menu) return;
    const carte = this.contentEl && typeof this.contentEl.querySelector === 'function' ? this.contentEl.querySelector('.salle-exo') : null;
    const deborde = carte && carte.scrollHeight > carte.clientHeight + 2;
    if (dy < 0 && g.y > H * 0.4) {   // 2.38.65 : plus de bande morte entre 40 et 50 % de l'écran
      if (deborde && carte.scrollTop + carte.clientHeight < carte.scrollHeight - 2) return;
      ouvre('liste');
    } else if (dy > 0 && g.y < H * 0.4) {
      if (deborde && carte.scrollTop > 0) return;
      ouvre('haut');
    }
  },
  // L'en-tête ouvert (2.38.21) : par-dessus la carte, un voile derrière ; un toucher sur le voile le referme (2.38.22 : pas de
  // croix, c'est moche), le tirer vers le haut aussi. 2.38.45 : une fonction, pour rendre et pour le glissement (suiteGlisse).
  ouvrirHaut(r, haut) {
    haut.classList.add('salle-haut-ouvert');
    const voile = h('div', { cls: 'salle-haut-voile' });
    const fermerHaut = () => { this.haut = false; this.rendre(); };
    const partir = () => this.fermerAnime(haut, voile, -1, fermerHaut);   // 2.38.27 : il remonte
    voile.addEventListener('click', partir);
    this.rendreTirable(haut, voile, -1, fermerHaut);
    this.partirHaut = partir;
    r.insertBefore(voile, haut);
    return voile;
  },
  // 2.38.34 (demande : glisser n'est pas fluide) : du bas vers le haut, « La séance » monte avec le doigt dès que le geste
  // part (20 px), comme le centre de contrôle, au lieu d'apparaître une fois le doigt levé. Seul son déplacement change
  // pendant le geste ; le reste de l'écran n'est pas redessiné.
  // 2.38.45 (demande : le glissement doit marcher pareil pour l'en-tête, sinon ce n'est pas intuitif) : du haut vers le bas,
  // l'en-tête descend avec le doigt de la même façon.
  suiteGlisse(ev) {
    const g = this.glisse, t = ev && ev.touches && ev.touches[0];
    if (!g || !t) return;
    const H = (typeof window !== 'undefined' && window.innerHeight) || 800;
    const dy = t.clientY - g.y, dx = t.clientX - g.x;
    if (!g.pn) {
      const sc = this.plugin.donnees.enCours;
      if (this.ecran !== 'seance' || !sc || (sc.reposFin && sc.reposFin > Date.now())) return;
      if (this.liste || this.haut || this.aide || this.menu || Math.abs(dy) < 20 || Math.abs(dx) > Math.abs(dy) * 0.7) return;
      if (dy < 0 && g.y > H * 0.4) {   // 2.38.65 : plus de bande morte entre 40 et 50 % de l'écran
        const fond = this.panneauSeance(sc);
        const pn = fond && fond.childNodes && fond.childNodes[0];
        if (!pn || !pn.style || !fond.style) return;
        this.liste = true;
        this.contentEl.appendChild(fond);
        this.ouvrirEnGrand(pn);
        Object.assign(g, { fond, pn, sens: 1 });
      } else if (dy > 0 && g.y < H * 0.4) {
        const haut = Array.from(this.contentEl.childNodes || []).find((e) => e && e.classList && e.classList.contains('salle-haut'));
        if (!haut || !haut.style) return;
        this.haut = true;
        this.menu = null;
        Object.assign(g, { fond: this.ouvrirHaut(this.contentEl, haut), pn: haut, sens: -1 });
      } else return;
      g.pn.style.animation = 'none';
      g.pn.style.transition = 'none';
      g.fond.style.animation = 'none';
      g.h = (typeof g.pn.getBoundingClientRect === 'function' && g.pn.getBoundingClientRect().height) || (g.sens > 0 ? H * 0.78 : 160);
    }
    g.avance = Math.max(0, Math.min(g.h, Math.abs(dy) - 20));
    g.pn.style.transform = `translateY(${g.sens * Math.round(g.h - g.avance)}px)`;
    // 2.38.65 (demande : le glissement bugue encore) : plus de fondu pendant le geste ; le panneau est dans son fond, qui le
    // rendait à moitié transparent (la carte se voyait à travers) et recalculait le flou à chaque mouvement.
  },
  // 2.38.51 : un geste repris par l'iPhone (le bord du bas : le geste de l'accueil) : un panneau qui suivait le doigt repart.
  annulerGlisse() {
    const g = this.glisse;
    this.glisse = null;
    if (!g || !g.pn) return;
    const partir = g.sens > 0 ? this.partirListe : this.partirHaut;
    if (partir) partir();
  },
  // 2.38.26 (demande : que la carte ne glisse jamais, sinon le défilement se confond avec les glissements ; ajuster la taille) :
  // sur téléphone, si la carte de l'exercice dépasse sa place, tout son contenu est réduit (zoom) juste assez pour tenir ;
  // jamais sous 70 %. Elle ne défile plus (63-seance.css).
  ajusterCarte() {
    const r = this.contentEl;
    const c = r && typeof r.querySelector === 'function' ? r.querySelector('.salle-seance-fixe > .salle-exo') : null;
    if (!c || !c.style) return;
    c.style.zoom = '';
    const ajuster = (n) => {
      const H = c.clientHeight, C = c.scrollHeight;
      if (!(H > 0) || C <= H + 1) return;
      const z = (parseFloat(c.style.zoom) || 1) * (H / C);
      c.style.zoom = String(Math.max(0.7, Math.floor(z * 1000) / 1000));
      if (n > 0 && z > 0.7) ajuster(n - 1);   // une seconde passe si le texte, plus étroit, a changé de lignes
    };
    // 2.38.30 (demande : le bloc du poids et des rép. un peu plus gros, il reste de la place au-dessus du tableau) : quand la
    // carte tient sans être réduite, la place libre au-dessus du tableau des séries agrandit les deux lignes de saisie
    // (jusqu'à 12 px chacune) ; le tableau reste en bas, rien ne déborde.
    const grossir = () => {
      if (c.style.zoom || typeof c.style.setProperty !== 'function' || typeof c.querySelector !== 'function') return;
      const t = c.querySelector('.salle-exo > .salle-series');
      const avant = t && t.previousElementSibling;
      if (!avant || typeof t.getBoundingClientRect !== 'function' || typeof avant.getBoundingClientRect !== 'function') return;
      const libre = t.getBoundingClientRect().top - avant.getBoundingClientRect().bottom - 6;
      if (libre >= 4) c.style.setProperty('--salle-saisie-plus', Math.min(12, Math.floor(libre / 2)) + 'px');
    };
    const tout = () => { ajuster(2); grossir(); };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(tout);
    else tout();
  },
  // 2.38.27 (demande : le panneau se tire, il doit descendre, pas disparaître d'un coup) : fermer un panneau en le faisant
  // partir (vers le bas, ou vers le haut pour l'en-tête) et pâlir son voile, puis seulement le retirer (fermer). Sans
  // animation possible (moins de mouvement demandé, ou les tests) : tout de suite.
  fermerAnime(panneau, voile, sens, fermer) {
    let fait = false;
    const fin = () => { if (!fait) { fait = true; fermer(); } };
    const anime = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function' && typeof window.setTimeout === 'function'
      && !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!anime || !panneau || !panneau.style) { fin(); return; }
    panneau.style.animation = 'none';
    panneau.style.transition = 'transform 240ms cubic-bezier(0.4, 0, 1, 1)';
    panneau.style.transform = `translateY(${sens < 0 ? '-100%' : '100%'})`;
    if (voile && voile.style && voile !== panneau) { voile.style.animation = 'none'; voile.style.transition = 'opacity 240ms ease'; voile.style.opacity = '0'; }
    window.setTimeout(fin, 230);
  },
  // 2.38.75 (demande : c'est fluide, mais glisser pour faire disparaître la page ne marche plus) : une feuille du bas (« La
  // séance », l'aide) se ferme en la tirant vers le bas, sans rien enlever au défilement (2.38.74). Le code écoute sans jamais
  // bloquer (passive) et ne fige jamais la liste. Il ne bouge la feuille que pour un geste qui commence liste tout en haut et
  // part vers le bas (8 px pour décider) : là, la liste ne peut pas défiler, rien ne se mêle. Un geste qui part vers le haut,
  // ou qui commence liste défilée, est un défilement jusqu'au bout : le code n'y touche pas. Lâchée assez bas (90 px) ou
  // d'un geste vif, la feuille part ; sinon elle remonte à sa place.
  glisserPourFermer(panneau, voile, fermer) {
    if (!panneau || typeof panneau.addEventListener !== 'function') return;
    let y0 = null, dy = 0, mode = null, pistes = [];
    const vitesse = () => {
      const n = Date.now(), r = pistes.filter((p) => n - p.t <= 100);
      return r.length < 2 ? 0 : Math.abs(r[r.length - 1].y - r[0].y) / Math.max(1, r[r.length - 1].t - r[0].t);
    };
    panneau.addEventListener('touchstart', (ev) => {
      const t = ev && ev.touches && ev.touches[0];
      mode = null; dy = 0;
      y0 = t && !((panneau.scrollTop || 0) > 0) ? t.clientY : null;
      pistes = t ? [{ y: t.clientY, t: Date.now() }] : [];
    }, { passive: true });
    panneau.addEventListener('touchmove', (ev) => {
      const t = ev && ev.touches && ev.touches[0];
      if (y0 == null || !t || mode === 'defiler') return;
      dy = t.clientY - y0;
      if (mode == null) {
        if (Math.abs(dy) < 8) return;
        if (dy < 0 || (panneau.scrollTop || 0) > 0) { mode = 'defiler'; return; }
        mode = 'tirer';
        y0 += 8;
        dy = t.clientY - y0;
        panneau.style.animation = 'none';
        panneau.style.transition = 'none';
      }
      pistes.push({ y: t.clientY, t: Date.now() });
      if (pistes.length > 12) pistes.shift();
      panneau.style.transform = dy > 0 ? `translateY(${Math.round(dy)}px)` : '';
    }, { passive: true });
    const lacher = (annule) => {
      const tirait = mode === 'tirer';
      y0 = null; mode = null;
      if (!tirait) return;
      if (!annule && (dy > 90 || (dy > 30 && vitesse() > 0.5))) { this.fermerAnime(panneau, voile, 1, fermer); return; }
      const anime = typeof window !== 'undefined' && typeof window.setTimeout === 'function' && typeof window.requestAnimationFrame === 'function';
      panneau.style.transition = anime ? 'transform 220ms cubic-bezier(0.2, 0.9, 0.25, 1)' : 'none';
      panneau.style.transform = '';
      if (anime) window.setTimeout(() => { panneau.style.transition = ''; }, 240);
      else panneau.style.transition = '';
    };
    panneau.addEventListener('touchend', () => lacher(false), { passive: true });
    panneau.addEventListener('touchcancel', () => lacher(true), { passive: true });
  },
  // Tirer un panneau pour le fermer (sens 1 : vers le bas, la feuille du bas ; -1 : vers le haut, l'en-tête) : il suit le
  // doigt ; lâché assez loin (90 px) ou vite, il part ; sinon il revient. Tant que sa liste n'est pas en haut, le doigt la
  // fait défiler.
  // 2.38.29 (demande : tiré vers le haut, le panneau du bas monte jusqu'en haut de l'écran, en suivant le doigt) : une feuille
  // du bas a deux hauteurs, comme sur iPhone : moyenne (à l'ouverture) et grande (tout l'écran). Tirée vers le haut, elle
  // grandit avec le doigt, puis se cale en grand (ou revient) ; tirée vers le bas, en grand elle redevient moyenne, en
  // moyenne elle part.
  rendreTirable(panneau, voile, sens, fermer, uneHauteur) {
    if (!panneau || typeof panneau.addEventListener !== 'function') return;
    let y0 = null, dy = 0, mode = null, ecart = 0, attente = null, pistes = [], defile = false;
    const grand = () => !!(panneau.classList && panneau.classList.contains('salle-panneau-grand'));
    const hauteur = () => (typeof panneau.getBoundingClientRect === 'function' ? panneau.getBoundingClientRect().height : 0) || 0;
    const H = () => (typeof window !== 'undefined' && window.innerHeight) || 800;
    // 2.38.34 (demande : glisser n'est pas fluide) : pendant le geste, seul le déplacement (transform) change, jamais la
    // hauteur : le téléphone n'a rien à recalculer. Pour grandir, la feuille prend d'un coup sa grande hauteur, décalée
    // vers le bas d'autant (ecart), puis remonte avec le doigt ; pour redevenir moyenne, elle descend puis reprend sa hauteur.
    const placer = (y) => { panneau.style.transform = y ? `translateY(${Math.round(y)}px)` : ''; };
    const anime = () => typeof window !== 'undefined' && typeof window.setTimeout === 'function' && typeof window.requestAnimationFrame === 'function';
    // 2.38.56 (demande : le glissement bugue encore un peu) : une animation en cours finit tout de suite quand le doigt revient
    // (avant, sa fin tombait au milieu du geste suivant et la feuille sautait).
    const finirAttente = () => {
      if (!attente) return;
      const a = attente;
      attente = null;
      if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function') window.clearTimeout(a.id);
      panneau.style.transition = 'none';
      a.fin();
    };
    const glisser = (y, fin) => {
      const oui = anime();
      panneau.style.transition = oui ? 'transform 260ms cubic-bezier(0.2, 0.9, 0.25, 1)' : 'none';
      placer(y);
      if (voile && voile.style && voile !== panneau) voile.style.opacity = '';
      const apres = () => { panneau.style.transition = ''; if (fin) fin(); };
      if (oui) attente = { fin: apres, id: window.setTimeout(() => { attente = null; apres(); }, 270) };
      else apres();
    };
    // 2.38.51 : revenue à mi-hauteur, sa liste repart du haut (à mi-hauteur elle ne défile pas : une liste restée défilée
    // bloquait tout geste).
    const moyenne = () => { panneau.style.transition = 'none'; panneau.classList.remove('salle-panneau-grand'); placer(0); panneau.scrollTop = 0; };
    // 2.38.56 : la vitesse du doigt sur ses 100 dernières ms (un coup sec à la fin d'un geste lent compte comme rapide).
    const vitesse = () => {
      const n = Date.now(), r = pistes.filter((p) => n - p.t <= 100);
      if (r.length < 2) return 0;
      return Math.abs(r[r.length - 1].y - r[0].y) / Math.max(1, r[r.length - 1].t - r[0].t);
    };
    // Pendant qu'on tire la feuille (« tirer »), sa liste ne défile pas en même temps (sinon les deux bougent).
    const figer = (oui) => { if (sens > 0) panneau.style.overflowY = oui ? 'hidden' : ''; };
    // 2.38.45 : l'en-tête (sens -1) se tire aussi depuis son voile, mais seulement près du haut de l'écran (40 %, comme pour
    // l'ouvrir ; demande : pas n'importe où, quand on est vers le haut de l'écran).
    const zones = sens < 0 && voile && voile !== panneau && typeof voile.addEventListener === 'function' ? [panneau, voile] : [panneau];
    for (const zone of zones) {
      zone.addEventListener('touchstart', (ev) => {
        const t = ev && ev.touches && ev.touches[0];
        finirAttente();
        const horsZone = zone !== panneau && t && t.clientY > H() * 0.4;
        y0 = t && !horsZone ? t.clientY : null;
        dy = 0; mode = null; ecart = 0; pistes = t ? [{ y: t.clientY, t: Date.now() }] : [];
        defile = (panneau.scrollTop || 0) > 0;   // 2.38.73 : la liste n'était pas tout en haut au début du geste
      }, { passive: true });
      zone.addEventListener('touchmove', (ev) => {
        const t = ev && ev.touches && ev.touches[0];
        if (y0 == null || !t) return;
        pistes.push({ y: t.clientY, t: Date.now() });
        if (pistes.length > 12) pistes.shift();
        // 2.38.73 (demande : « ça bugue juste un tout petit peu encore ») : en grand, un geste commencé avec la liste défilée
        // appartient à la liste jusqu'au bout : le téléphone la fait défiler seul, avec son élan, et elle s'arrête en haut ;
        // pour fermer, un nouveau geste depuis le haut. Avant (2.38.56), arrivée en haut, la feuille se mettait à suivre le
        // doigt au milieu du même geste : le défilement du téléphone et le déplacement par le code se mêlaient, et la liste
        // était figée en plein défilement : un à-coup.
        if (mode === 'defiler') return;
        if (sens > 0 && mode == null && grand() && (defile || panneau.scrollTop > 0)) { mode = 'defiler'; return; }
        dy = t.clientY - y0;
        // 2.38.71 (demande : sur le téléphone, le défilement de « La séance » bugue, pas sur le Mac) : le geste ne décide
        // qu'après 8 px, et repart de là (pas de saut). Avant, 1 px vers le bas au début d'un défilement suffisait à tirer la
        // feuille et à figer sa liste pour tout le geste. En grand, un geste vers le haut appartient à la liste : elle défile
        // seule (le téléphone s'en charge, avec son élan), la feuille ne bouge pas.
        if (mode == null) {
          if (Math.abs(dy) < 8) return;
          y0 += dy > 0 ? 8 : -8;
          dy = t.clientY - y0;
          if (sens > 0 && dy < 0 && grand()) { mode = 'defiler'; return; }
        }
        // Vers le haut, une feuille du bas pas encore en grand : elle grandit avec le doigt.
        if (mode == null && sens > 0 && dy < 0 && !grand()) {
          mode = 'grandir';
          const h0 = hauteur();
          panneau.style.animation = 'none';
          panneau.style.transition = 'none';
          panneau.classList.add('salle-panneau-grand');
          ecart = Math.max(0, hauteur() - h0);
        }
        if (mode === 'grandir') {
          placer(Math.min(ecart, Math.max(0, ecart + dy)));
          return;
        }
        if (dy * sens <= 0) { if (mode === 'tirer') placer(0); return; }
        if (mode !== 'tirer') {
          mode = 'tirer';
          figer(true);
          panneau.style.animation = 'none';
          panneau.style.transition = 'none';
        }
        placer(dy);
      }, { passive: true });   // 2.38.39 : jamais bloquant (le défilement n'attend plus ce code) ; le CSS (touch-action) empêche
                               // le défilement là où le doigt tire la feuille
      const lacher = (annule) => {
        if (y0 == null) return;
        y0 = null;
        figer(false);
        const vite = !annule && vitesse() > 0.5;
        if (mode === 'grandir') {
          if (!annule && (-dy > 60 || (-dy > 20 && vite))) glisser(0);
          else glisser(ecart, moyenne);
          return;
        }
        if (mode === 'tirer' && !annule && (dy * sens > 90 || (dy * sens > 30 && vite))) {
          if (sens > 0 && grand() && !uneHauteur) {
            // En grand, tirée vers le bas : elle descend jusqu'à sa hauteur moyenne (mesurée), puis la reprend. (L'aide, une
            // seule hauteur : elle part.)
            const hg = hauteur();
            panneau.style.transition = 'none';
            panneau.classList.remove('salle-panneau-grand');
            const hm = hauteur();
            panneau.classList.add('salle-panneau-grand');
            glisser(Math.max(0, hg - hm), moyenne);
            return;
          }
          this.fermerAnime(panneau, voile, sens, fermer);
          return;
        }
        if (mode === 'tirer') glisser(0);
      };
      zone.addEventListener('touchend', () => lacher(false), { passive: true });
      // 2.38.51 (demande : à un moment ça a bugué, je ne pouvais plus glisser vers le haut) : un geste que l'iPhone reprend
      // (glisser depuis le bord du bas : le geste de l'accueil) n'a pas de fin normale : la feuille revient à sa place.
      zone.addEventListener('touchcancel', () => lacher(true), { passive: true });
    }
  },
  // 2.38.23 : une feuille qui monte du bas par-dessus la carte (floue derrière) ; un toucher à côté la ferme (fermer).
  // 2.38.48 (demande : le défilement de l'aide bugue) : l'aide s'ouvre tout de suite en grand et défile dès le premier geste
  // (à mi-hauteur, le premier glissement la faisait grandir au lieu de défiler) ; tirée vers le bas tout en haut, elle part.
  feuille(contenu, fermer, cls, nom) {
    let partir = fermer;
    // 2.38.74 : plus de geste pour la fermer (comme sur le Mac) : une croix en haut, comme « La séance ».
    const panneau = h('div', { cls: 'salle-panneau salle-panneau-grand' + (cls ? ' ' + cls : ''), role: 'dialog', 'aria-label': nom || '' },
      h('div', { cls: 'salle-panneau-poignee' }),
      h('button', { cls: 'salle-bouton salle-panneau-croix', type: 'button', icone: 'annuler', 'aria-label': 'Fermer', onclick: () => partir() }, h('span', { cls: 'salle-repli', text: '×' })),
      contenu);
    const fond = h('div', { cls: 'salle-panneau-fond' }, panneau);
    partir = () => this.fermerAnime(panneau, fond, 1, fermer);   // 2.38.27 : elle descend
    fond.addEventListener('click', (ev) => { if (ev && ev.target === fond) partir(); });
    // 2.38.74 (demande : pas aussi fluide que sur le Mac) : le téléphone la fait défiler seul ; 2.38.75 : glisser vers le bas,
    // tout en haut, la ferme (glisserPourFermer).
    this.glisserPourFermer(panneau, fond, fermer);
    this.partirFeuille = partir;
    return fond;
  },
  // 2.38.23 : le menu « … » dans une bulle sous son bouton, par-dessus la carte ; un toucher à côté la ferme.
  // 2.38.36 (demande : qu'il s'ouvre comme un capteur photo, petit puis il grossit) : la bulle naît du bouton « … » et
  // grandit avec un léger rebond (63-seance.css) ; un toucher à côté la fait rentrer dans le bouton, puis la ferme.
  bulle(contenu, fermer) {
    const b = h('div', { cls: 'salle-bulle' }, contenu);
    const fond = h('div', { cls: 'salle-bulle-fond' }, b);
    let part = false;
    fond.addEventListener('click', (ev) => {
      if (!ev || ev.target !== fond || part) return;
      part = true;
      const anime = typeof window !== 'undefined' && typeof window.setTimeout === 'function' && typeof window.requestAnimationFrame === 'function'
        && !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (!anime) { fermer(); return; }
      b.classList.add('salle-bulle-ferme');
      fond.classList.add('salle-bulle-ferme');
      window.setTimeout(fermer, 190);
    });
    return fond;
  },
  // 2.38.71 (demande : le défilement de « La séance » est fluide sur le Mac, il bugue sur le téléphone) : à mi-hauteur, la
  // feuille ne défile pas (le doigt la tire) ; sur le téléphone, une liste plus longue que la mi-hauteur s'ouvre donc tout de
  // suite en grand et défile dès le premier geste, comme l'aide (2.38.48). Sur le Mac (molette), rien ne change.
  ouvrirEnGrand(pn) {
    if (!pn || !pn.classList || !this.plugin.mobile()) return;
    if (pn.scrollHeight > pn.clientHeight + 2) pn.classList.add('salle-panneau-grand');
  },
  // Le panneau « La séance » : il monte du bas par-dessus la carte (floue derrière, en verre) ; la liste des exercices, « Annuler
  // la séance », « Fermer ». Un toucher à côté le ferme aussi ; choisir un exercice le ferme (allerA).
  panneauSeance(sc) {
    const fermer = () => { this.liste = false; this.rendre(); };
    let partir = fermer;
    // 2.38.20 (demande : une croix en haut du panneau, utile si ça bloque) : à la place du bouton « Fermer » du bas.
    const panneau = h('div', { cls: 'salle-panneau', role: 'dialog', 'aria-label': 'La séance' },
      h('div', { cls: 'salle-panneau-poignee' }),
      h('button', { cls: 'salle-bouton salle-panneau-croix', type: 'button', icone: 'annuler', 'aria-label': 'Fermer', onclick: () => partir() }, h('span', { cls: 'salle-repli', text: '×' })),
      this.listeExercices(sc),
      this.basSeance(sc));
    const fond = h('div', { cls: 'salle-panneau-fond' }, panneau);
    partir = () => this.fermerAnime(panneau, fond, 1, fermer);   // 2.38.27 : il descend
    fond.addEventListener('click', (ev) => { if (ev && ev.target === fond) partir(); });
    // 2.38.74 (demande : pas aussi fluide que sur le Mac, refaire ce qui est fait sur le Mac) : sur le Mac, la liste défile
    // à la molette, sans code ; sur le téléphone, le code suivait chaque mouvement du doigt pour tirer la feuille (grandir,
    // redescendre, partir) et le défilement passait après lui. Comme sur le Mac : le téléphone la fait défiler seul, avec son
    // élan ; on la ferme par la croix ou en touchant à côté. Glisser vers le haut depuis la carte l'ouvre toujours.
    // 2.38.75 (demande : c'est fluide, mais glisser pour la faire disparaître ne marche plus) : glisser vers le bas, tout en
    // haut de la liste, la ferme (glisserPourFermer), sans toucher au défilement.
    this.glisserPourFermer(panneau, fond, fermer);
    this.partirListe = partir;
    return fond;
  },
  // 2.38.31 (demande : au premier toucher d'« Annuler la séance », le panneau revenait en haut au lieu de laisser toucher une
  // seconde fois) : le bouton change sur place, sans redessiner l'écran (le panneau garde sa hauteur et sa liste, sa
  // position) ; passé le délai, il redevient « Annuler la séance ».
  basSeance(sc) {
    const p = this.plugin;
    const nb = ECRAN_SEANCE.seriesFaites(sc);
    const bas = h('div', { cls: 'salle-bas' });
    const poser = () => {
      const annuler = confirmeRecent(this.annulerLe);
      for (const n of Array.from(bas.childNodes)) bas.removeChild(n);
      bas.appendChild(h('button', {
        cls: 'salle-bouton salle-mini' + (annuler ? ' salle-danger' : ''),
        text: annuler ? `Toucher encore : annuler (${L.pluriel(nb, 'série')} perdue${L.s(nb)})` : 'Annuler la séance', icone: 'annuler',
        onclick: async () => {
          if (!confirmeRecent(this.annulerLe)) {
            this.annulerLe = Date.now();
            poser();
            if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') window.setTimeout(() => { if (!confirmeRecent(this.annulerLe)) poser(); }, DELAI_CONFIRMER_MS + 100);
            return;
          }
          this.annulerLe = 0;
          p.donnees.enCours = null;
          p.donnees.bilan = ECRAN_SEANCE.bilanARefaire(this.aujourdhui());   // les questions d'avant se reposeront
          await p.sauver();
          new obsidian.Notice('Séance annulée : rien n\'est enregistré.');
          this.aller('accueil');
        },
      }));
    };
    poser();
    return bas;
  },

  // ── Le gros bouton du bas et ce qu'il fait ──
  // Le gros bouton du bas : un <label role="button"> qui contient l'interrupteur caché (plugin.vibreur) ; un toucher
  // le bascule et l'iPhone vibre (iOS 18). Le clic arrive deux fois (le label, puis l'interrupteur) : le second est ignoré.
  // Ce qu'il fait est relu au moment du toucher (le chrono a pu partir, le repos finir).
  barreBas(sc, maj) {
    const p = this.plugin;
    // (check-up 2.38.64) pendant une correction, le gros bouton l'enregistre (avant : il notait la série cachée et perdait la
    // correction).
    const etat = () => {
      if (this.corrige) return { texte: 'Enregistrer la correction', icone: 'valider', quoi: 'corriger' };
      const s = p.donnees.enCours || sc;
      return ECRAN_SEANCE.barre(s, s.courant, Date.now());
    };
    const b = etat();
    let occupe = false;   // (check-up 2.38.64) un double toucher rapide ne fait qu'une action (avant : une série fantôme)
    const vibre = typeof p.vibreur === 'function' ? p.vibreur() : null;
    const mot = h('span', { cls: 'salle-barre-texte', text: b.texte });
    const agir = (ev) => {
      if (ev && ev.target && String(ev.target.tagName || '').toUpperCase() === 'INPUT') return undefined;
      if (typeof p.preparerSon === 'function') p.preparerSon();   // dans le toucher : iOS laisse ensuite sonner le bip
      if (!p.donnees.enCours || occupe) return undefined;
      occupe = true;
      return Promise.resolve().then(() => this.actionBarre(etat().quoi)).finally(() => { occupe = false; });
    };
    const bouton = h('label', { cls: 'salle-bouton salle-principal salle-grand salle-barre-action', role: 'button', tabindex: '0', icone: b.icone }, vibre, mot);
    bouton.addEventListener('click', agir);
    bouton.addEventListener('keydown', (ev) => { if (ev && (ev.key === 'Enter' || ev.key === ' ')) { if (ev.preventDefault) ev.preventDefault(); agir(); } });
    (maj || []).push(() => { const t = etat().texte; if (mot.textContent !== t) mot.textContent = t; });
    this.barreTexte = mot;
    return h('div', { cls: 'salle-barre-bas' }, bouton);
  },
  actionBarre(quoi) {
    if (quoi === 'corriger') return this.enregistrerCorrection();
    if (quoi === 'terminer') return this.terminer();
    if (quoi === 'echauffement') return this.faireEchauffement();
    if (quoi === 'legere') return this.validerLegere();
    if (quoi === 'suivant') return this.exerciceSuivant();
    if (quoi === 'chrono') return this.lancerChrono();
    return this.validerSerie();
  },
  async faireEchauffement() {
    const p = this.plugin, sc = p.donnees.enCours;
    const exo = sc && sc.exos[sc.courant];
    if (!exo || !exo.echauffement) return;
    exo.faites = [{ min: VELO_MIN }];
    sc.echauffeFin = 0;
    const j = L.suivantPasFini(sc.exos, sc.courant);
    if (j >= 0) sc.courant = j;
    this.fermerCarte(['aide', 'menu']);
    await p.sauver();
    this.transition(() => { this.rendre(); this.allerCarte(); });
  },
  async exerciceSuivant() {
    const p = this.plugin, sc = p.donnees.enCours;
    if (!sc) return;
    const j = L.suivantPasFini(sc.exos, sc.courant);
    if (j >= 0) sc.courant = j;
    this.fermerCarte(['aide', 'menu']);
    await p.sauver();
    this.transition(() => { this.rendre(); this.allerCarte(); });
  },
  // Le chrono du gainage part dans 3 s (le temps de se mettre en place).
  async lancerChrono() {
    const p = this.plugin, sc = p.donnees.enCours;
    if (!sc) return;
    sc.chronoDebut = Date.now() + ECRAN_SEANCE.DEPART_MS;
    this.sonneChrono = 0;
    await p.sauver();
    this.rendre();
  },

  // ── L'image de l'exercice qui vient, les repères du repos, une série légère faite ──
  // 2.21.0 (demande : au passage à l'exercice suivant, montrer aussi sa petite animation, pas seulement son nom) : pendant le repos qui précède un nouvel exercice (ECRAN_SEANCE.pasCommence), sa petite animation sous
  // « Ensuite : … » ; un toucher l'agrandit. 2.38.8 (demande : l'animation manquait au repos entre deux séries) : à chaque
  // repos, aussi entre deux séries du même exercice. Pas avant l'échauffement ; sans image : rien.
  imageSuivant(exo) {
    if (!exo || exo.echauffement) return null;
    const image = animation(this.plugin, exo.nom);
    if (!image) return null;
    image.classList.add('salle-anim-mini');
    image.classList.add('salle-anim-suivant');
    // « Tu dois sentir » est déjà dans les repères du repos, juste dessous.
    const cle = typeof image.querySelector === 'function' ? image.querySelector('.salle-anim-cle') : null;
    if (cle && cle.parentNode) cle.parentNode.removeChild(cle);
    return image;
  },
  // Les repères d'un exercice, pour le repos : une ligne très courte chacun, avec son icône (une goutte, une cible, ✓ à
  // faire, ✕ à éviter) ; rien s'il n'y a rien à dire. Un exercice pas encore commencé (ni série, ni série légère) : c'est
  // un nouvel exercice, on boit avant (ECRAN_SEANCE.reperes).
  // suite (facultatif) : la ligne « Ensuite : … » juste au-dessus ; un repère « à faire » qu'elle dit déjà n'est pas redit.
  // La bulle du repos : la consigne de la série qui vient, seulement (série légère, ou la réserve ; la supersérie). 2.38.10
  // (demande : plus épuré, comme les applis de musculation : au repos, le temps, ce qui vient, très peu de texte) : la
  // douleur, le malaise et les règles de la salle sont dans l'aide (carteExercice).
  consignesRepos(sc, suite) {
    const x = suite && sc.exos ? sc.exos[suite.index] : null;
    if (!x || x.echauffement || L.fini(x)) return [];
    const C = ECRAN_SEANCE.CONSIGNES, lignes = [];
    if (L.legereAFaire(x)) lignes.push(C.legere);
    else if (x.unite !== 's') lignes.push(L.AVERTISSEMENT_RESERVE);
    if (ECRAN_SEANCE.partenaire(sc, suite.index) >= 0) lignes.push(C.superserie);
    return lignes;
  },
  reperesRepos(exo, suite) {
    const p = this.plugin;
    const fiche = (p.etat.guide || {})[L.norm(exo.nom)];
    const nouveau = ECRAN_SEANCE.pasCommence(exo);
    const dit = String(suite || '').toLowerCase();
    // 2.38.9 (demande : ces infos pendant le repos, pas pendant la série) : le tempo, jusqu'où aller et la fin de la dernière
    // série (pour la série qui vient) passent de la carte au repos, en tête des repères « à faire ».
    // 2.38.10 (demande : plus épuré) : REPOS_MAX lignes au plus, les plus utiles d'abord : boire (nouvel exercice), sentir, la
    // fin de la dernière série, le tempo, jusqu'où aller, puis la fiche. Tout le reste est dans l'aide.
    const lf = fiche && Array.isArray(fiche.lignes) ? fiche.lignes : [];
    const legere = !!L.legereAFaire(exo);
    const fais = (t) => (t ? [{ type: 'fais', texte: t }] : []);
    const finir = exo.echauffement || legere ? '' : L.pourFinir(exo, exo.faites.length, L.derniere(p.etat.seances, exo.nom), lf);
    // 2.38.42 (demande : remettre au repos « quand il t'en reste 1 » et tous ces repères, c'est là qu'il faut les mettre) :
    // l'effort de la série qui vient (comme sur la carte), puis tout : sentir, la fin de la dernière série, le tempo, jusqu'où
    // aller, les « à retenir » de la fiche (sauf ceux que « Va au bout » dit déjà) et les « à éviter ».
    const sc = p.donnees.enCours;
    const c = exo.echauffement || legere ? null : ECRAN_SEANCE.cibles(exo, p.etat.seances, sc && sc.legere);
    const effort = c ? L.effort(c.exo, exo.faites.length, c.der) : '';
    const fort = (t) => { const m = /^([^:;]+?) : (.*)$/.exec(t); return m ? `**${m[1]}** : ${m[2]}` : `**${t}**`; };
    const amplitude = L.amplitude(lf);
    const geste = exo.echauffement ? [] : [...fais(finir), ...fais(L.ligneTempo(exo, p.etat.seances, false)), ...fais(amplitude)];
    const base = ECRAN_SEANCE.reperes(lf, exo, nouveau);
    const avant = base.filter((l) => l.type === 'boire' || l.type === 'sentir');
    const dejaDit = (texte) => {   // un « à retenir » dont « Va au bout » dit déjà presque tous les mots
      const mots = L.norm(texte).split(/[^a-z]+/).filter((m) => m.length >= 4);
      const a = L.norm(amplitude);
      return mots.length > 0 && mots.filter((m) => a.indexOf(m) >= 0).length / mots.length >= 0.6;
    };
    const lignes = avant.filter((l) => l.type === 'boire')
      .concat(effort ? [{ type: 'effort', texte: fort(effort.replace(/\.$/, '')) }] : [], avant.filter((l) => l.type === 'sentir'), geste,
        base.filter((l) => !(l.type === 'boire' || l.type === 'sentir')).map((l) => (l.type === 'fais' || l.type === 'evite' ? Object.assign({}, l, { petit: true }) : l)))
      .filter((l) => !(l.type === 'fais' && (dit.indexOf(l.texte.toLowerCase()) >= 0 || (l.petit && dejaDit(l.texte))))).slice(0, ECRAN_SEANCE.REPOS_MAX);
    if (!lignes.length) return null;
    return h('ul', { cls: 'salle-repos-reperes' }, lignes.map((l) => h('li', { cls: 'salle-repere salle-repere-' + l.type + (l.petit ? ' salle-repere-petit' : ''), icone: ECRAN_SEANCE.ICONE_REPERE[l.type] },
      h('span', { cls: 'salle-repere-texte' }, enGras(l.type === 'evite' ? '**Évite** : ' + minuscule(l.texte) : l.texte)))));
  },
  // Une série légère faite : sa charge est gardée pour la note ; elle ne compte dans aucun total. Puis le repos (L.REPOS_LEGERE
  // entre deux séries légères, le repos de l'exercice après la dernière).
  async validerLegere() {
    const p = this.plugin, sc = p.donnees.enCours;
    const exo = sc && Array.isArray(sc.exos) ? sc.exos[sc.courant] : null;
    if (!exo) return;
    const c = ECRAN_SEANCE.cibles(exo, p.etat.seances, sc.legere);
    const legere = L.legereAFaire(exo, c.premiere ? c.premiere.charge : null);
    if (!legere) return;
    Object.assign(exo.approches[legere.index], { faite: true, c: legere.c });
    this.depuis = sc.courant;
    this.poserRepos(sc, L.legereAFaire(exo) ? L.REPOS_LEGERE : (exo.repos > 0 ? exo.repos : L.REPOS_LEGERE));
    await p.sauver();
    this.rendre();
  },
  // ── Corriger la dernière série notée d'un exercice ──
  // 2.22.0 (l'utilisateur, après sa première vraie séance : pouvoir corriger la série précédente quand le poids ou les répétitions notés sont faux) : la dernière série faite de l'exercice affiché se corrige
  // (this.corrige = { exo, m, c, v }) ; ses chiffres remplacent les anciens, le record est recalculé. Le repos, la suite et
  // la question de la réserve ne bougent pas : rien n'est refait, seule la note sera juste.
  async enregistrerCorrection() {
    const p = this.plugin, sc = p.donnees.enCours, k = this.corrige;
    const exo = sc && k && Array.isArray(sc.exos) ? sc.exos[k.exo] : null;
    if (!exo || !Array.isArray(exo.faites) || k.m !== exo.faites.length - 1) { this.corrige = null; this.rendre(); return; }
    let serie;
    if (exo.unite === 's') {
      if (!(k.v >= 1)) { new obsidian.Notice('Indique le temps tenu, en secondes.'); return; }
      serie = { s: Math.round(k.v) };
    } else {
      if (!(k.v > 0)) { new obsidian.Notice('Indique le nombre de répétitions.'); return; }
      if (!exo.corps && !(k.c > 0)) { new obsidian.Notice('Indique la charge en kg (pour des haltères : le poids d\'un seul).'); return; }
      serie = { c: k.c > 0 ? k.c : 0, r: Math.round(k.v) };
    }
    let rec = null;
    try { rec = L.recordSerie(p.etat.seances, exo.nom, serie, exo.faites.slice(0, k.m)); } catch (e) { rec = null; }
    if (rec) serie.record = rec.type;
    exo.faites[k.m] = serie;
    this.corrige = null;
    this.annonce = null;
    this.eclat = null;
    await p.sauver();
    this.rendre();
  },

  // ── Valider la série en cours (le gros bouton, ou la commande « Série faite ») ──
  // L'ordre (~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-contrat-2.0.md, 5.1) : le record (avant l'ajout), l'ajout, la question de la réserve,
  // la suite (L.apresSerie), le repos et « Repos salle » avant tout await, puis enregistrer et redessiner.
  async validerSerie() {
    const p = this.plugin, sc = p.donnees.enCours;
    if (!sc || !Array.isArray(sc.exos)) return;
    const i = sc.courant, exo = sc.exos[i];
    if (!exo || exo.echauffement || exo.saute) return;
    let s = this.saisie;
    if (!s || s.pour !== i) {
      const c = ECRAN_SEANCE.cibles(exo, p.etat.seances, sc.legere).cible;
      s = this.saisie = { pour: i, c: c.charge != null ? c.charge : null, v: c.valeur };
    }
    let serie;
    if (exo.unite === 's') {
      const v = sc.chronoDebut > 0 ? (Date.now() - sc.chronoDebut) / 1000 : s.v;
      if (!(v >= 1)) { new obsidian.Notice(sc.chronoDebut > 0 ? 'Le chrono vient de partir : touche « Fait » à la fin de ta série.' : 'Indique le temps tenu, en secondes.'); return; }
      serie = { s: Math.round(v) };
    } else {
      if (!(s.v > 0)) { new obsidian.Notice('Indique le nombre de répétitions.'); return; }
      if (!exo.corps && !(s.c > 0)) { new obsidian.Notice('Indique la charge en kg (pour des haltères : le poids d\'un seul).'); return; }
      serie = { c: s.c > 0 ? s.c : 0, r: Math.round(s.v) };
    }
    let rec = null;
    try { rec = L.recordSerie(p.etat.seances, exo.nom, serie, exo.faites); } catch (e) { rec = null; }
    if (rec) serie.record = rec.type;
    exo.faites.push(serie);
    if (exo.unite === 's') sc.chronoDebut = 0;
    if (exo.faites.length === exo.series && exo.unite !== 's' && !exo.corps) sc.question = i;   // la réserve
    const a = L.apresSerie(sc);
    this.poserRepos(sc, a.fin ? 0 : a.repos);
    sc.courant = a.courant;
    this.depuis = i;
    this.annonce = rec ? L.nomEtTexte(exo.nom, rec.texte) : null;
    this.eclat = rec ? `${i}-${exo.faites.length - 1}` : null;
    this.fermerCarte();
    this.confirmerLe = 0;
    // Les consignes vues sur cet écran ne reviennent plus : elles ont été lues pendant cette série.
    // Le record se voit sur sa ligne (en or) et dans le repos, pas dans une alerte qui disparaît.
    await p.sauver();
    if (a.courant !== i) this.transition(() => { this.rendre(); this.allerCarte(); });
    else { this.rendre(); this.allerCarte(); }
  },

  // ── Terminer : la note de la séance, puis le bilan de fin ──
  async terminer() {
    const p = this.plugin, sc = p.donnees.enCours;
    if (!sc) { this.aller('accueil'); return; }
    const nb = ECRAN_SEANCE.seriesFaites(sc);
    if (!nb) {
      p.donnees.enCours = null;
      p.donnees.bilan = ECRAN_SEANCE.bilanARefaire(this.aujourdhui());   // rien de fait : comme une annulation
      await p.sauver();
      new obsidian.Notice('Séance annulée : aucune série notée.');
      this.aller('accueil');
      return;
    }
    const seance = ECRAN_SEANCE.seanceNote(sc, this.aujourdhui(), Date.now());
    // Pour féliciter au bilan (L.succesSeance) : les exercices prévus, et s'ils sont tous finis (aucun passé, aucun laissé).
    const prevus = sc.exos.filter((x) => !x.echauffement);
    const plan = { prevus: prevus.length, complete: prevus.every((x) => L.fini(x) && !x.saute) };
    const avant = p.etat.seances.slice();
    let fichier;
    try {
      fichier = await p.enregistrerSeance(seance);
    } catch (err) {
      signalerErreur(err);
      new obsidian.Notice('Note de la séance pas écrite. Rien n\'est perdu : la séance reste en cours, réessaie.');
      return;
    }
    p.donnees.enCours = null;
    await p.sauver();
    await p.recharger();
    let compare = null;
    try { compare = L.bilanCompare(seance, avant); } catch (e) { compare = null; }
    this.bilan = { seance, records: L.records(seance, avant), compare, premiere: !avant.length, chemin: fichier && fichier.path, series: nb, ressenti: '', plan };
    this.depuis = null; this.annonce = null; this.eclat = null; this.menu = null;
    this.aller('bilan');
  },
});
}
