// VueSalle, l'écran de séance : la carte de l'exercice (la cible en gros, série légère comprise, l'effort, le tempo, la fiche ouverte la première
// fois, le menu « … », les séries d'approche, le tableau des séries, le chrono du gainage). Le reste de l'écran : 63b-seance.js.

Object.assign(VueSalle.prototype, {
  // ── La carte de l'exercice : la cible en gros, l'effort, les approches, le tableau des séries, le menu « … » ──
  carteExercice(r, sc, exo, maj) {
    const p = this.plugin, i = sc.courant;
    if (exo.saute) { r.appendChild(this.carteSaute(sc, exo)); return; }
    const c = ECRAN_SEANCE.cibles(exo, p.etat.seances, sc.legere);
    const cible = c.cible, k = exo.faites.length;
    if (!this.saisie || this.saisie.pour !== i) this.saisie = { pour: i, c: cible.charge != null ? cible.charge : null, v: cible.valeur };
    this.ouvrirAidePremiereFois(sc, exo, c.der);
    // La fiche « Comment faire » ouverte dit déjà le réglage du guide, « Tu dois sentir » et le tempo : la carte ne les
    // redit pas. Le réglage n'est plus sur la carte (2.14.3) : il est dans l'aide.
    const ficheGuide = (p.etat.guide || {})[L.norm(exo.nom)] || null;
    const lignesGuide = ficheGuide && Array.isArray(ficheGuide.lignes) ? ficheGuide.lignes : [];
    const fiche = this.aide ? ficheGuide : null;
    const lignesFiche = fiche ? lignesGuide : [];
    const j = ECRAN_SEANCE.partenaire(sc, i);
    const tour = ECRAN_SEANCE.tour(sc, i);

    const texte = h('div', { cls: 'salle-exo-texte' },
      h('h3', { text: exo.nom }),
      j >= 0 ? h('div', { cls: 'salle-superserie salle-badge salle-etat-maintenant', icone: 'superserie', text: `Supersérie avec ${sc.exos[j].nom}${tour ? ` · tour ${tour.n} sur ${tour.sur}` : ''}` }) : null);
    const anim = animation(p, exo.nom);   // l'image, petite à droite du titre ; un toucher l'ouvre en grand
    if (anim) anim.classList.add('salle-anim-mini');
    // 2.38.14 (demande : la carte entière à l'écran, coins compris) : « Aide » dans l'en-tête, à côté de « … » ; l'aide
    // s'ouvre juste dessous (comme le menu).
    // 2.38.84 : plus de bouton « Vidéo » ici : l'image à droite du titre est la vignette de la vidéo (animation).
    const teteBoutons = h('div', { cls: 'salle-exo-tete-boutons' }, this.boutonActions());
    const tete = h('div', { cls: 'salle-exo-tete' }, this.rangExo(sc, i, exo), teteBoutons);
    // 2.38.23 (demande : le menu « … » et l'aide comme les autres panneaux, fermés d'un toucher à côté) : ils ne s'ouvrent plus
    // dans la carte mais par-dessus (fin de carteExercice).
    const carte = h('div', { cls: 'salle-carte salle-exo' + (j >= 0 ? ' salle-exo-groupe' : '') },
      tete,
      anim ? h('div', { cls: 'salle-exo-haut' }, texte, anim) : texte);

    // La cible en gros ; l'explication en petit, sur une ligne (un toucher l'ouvre en entier) ; l'effort de cette série.
    // La première fois, l'explication dit déjà « arrête la série quand il t'en reste 2 » : la ligne d'effort
    // ne le redit pas juste dessous (règle du plan : pas de texte répété).
    // Un exercice fini (la dernière série de la séance, ou touché dans la liste) : ni cible en gros, ni
    // explication, ni effort pour une série qui n'est pas prévue (ça poussait à en faire une de plus). Le tableau reste.
    const fini = L.fini(exo);
    const effort = L.effort(c.exo, k, c.der);   // la fois d'avant, pour « première fois »
    const redit = /t'en reste 2\b/.test(cible.texte || '') && /t'en reste 2\b/.test(effort);
    // Une série légère à faire : c'est elle, la cible du moment (même place, mêmes gros chiffres qu'une série).
    const legere = fini ? null : L.legereAFaire(exo, c.premiere ? c.premiere.charge : null);
    this.explicationAide = null;   // l'explication de la cible, pour la feuille de l'aide (posée juste dessous si elle existe)
    if (legere) {
      carte.appendChild(h('div', { cls: 'salle-exo-cible salle-exo-cible-legere' },
        h('div', { cls: 'salle-exo-etape', text: `Série légère ${legere.n} sur ${legere.sur}` }),
        this.cibleGros(legere.gros),
        // 2.38.44 (demande : « Pour t'échauffer, sans forcer » est inutile, il sait que c'est pour s'échauffer) : retiré.
        this.pastilles(this.ligneDisques(exo, legere.c)),
        this.ligneReglage(exo)));
    } else if (!fini) {
      const change = ECRAN_SEANCE.changement(c.exo, cible, c.der);   // 2.38.59
      const expl = decouper(cible.texte);   // 2.5.1 : la phrase sur une ligne, le « Comment » ou le « Pourquoi » replié
      carte.appendChild(h('div', { cls: 'salle-exo-cible' },
        // L'étape en petit au-dessus de la cible : « Série 1 sur 2 » (2.11.1 : la carte se lit de haut en bas, dans l'ordre).
        // La première séance d'un exercice qui vient de gagner une série (L.progressionSeries) : dit une fois, à la série 1.
        h('div', { cls: 'salle-exo-etape', text: `Série ${k + 1} sur ${exo.series}${exo.seriePlus && !k ? ' · 1 de plus qu\'avant' : ''}` }),
        this.cibleGros(cible.gros, change),
        // 2.38.11 (demande : épurer l'écran des séries) : l'explication de la cible (« la dernière fois 21. Gagne une
        // répétition », « Et après ») seulement dans l'aide (2.38.23 : la feuille de l'aide, plus bas).
        // 2.38.59 : en tête des pastilles, ce qui change (« Plus lourd : 7,5 → 10 kg »), en vert.
        this.pastilles(this.pastilleChangement(change), this.ligneDisques(exo, cible.charge), redit ? null : h('p', { cls: 'salle-effort', text: effort, icone: 'terminer' })),
        this.ligneReglage(exo)));
      if (cible.texte) this.explicationAide = [h('p', {
        cls: 'salle-explication' + (this.expl ? ' salle-explication-ouverte' : ''), text: expl.tete, 'aria-expanded': this.expl ? 'true' : 'false',
        onclick: () => { this.expl = !this.expl; this.rendre(); },
      }), replis(cible.texte)];
    } else {
      carte.appendChild(h('p', { cls: 'salle-effort', text: `Fait : ${exo.faites.length} série${exo.faites.length > 1 ? 's' : ''}.`, icone: 'valider' }));
    }
    // Le point clé du geste (« Tu dois sentir… ») passe sous la cible (retiré de l'image) ; pas si la fiche ouverte le dit.
    const cle = anim && typeof anim.querySelector === 'function' ? anim.querySelector('.salle-anim-cle') : null;
    if (cle && cle.parentNode) cle.parentNode.removeChild(cle);
    // Le geste, dans un bloc à part sous la cible : le tempo et la respiration (L.ligneTempo : la respiration seule si la
    // fiche ouverte dessous dit déjà le tempo, « en 1 seconde »), jusqu'où aller (L.amplitude ; la fiche ouverte le dit
    // déjà), la fin de la dernière série (L.pourFinir), ce qu'il faut sentir, puis le bouton « Aide ».
    // 2.38.25 : l'aide ne redit plus le geste : la ligne de la respiration reste entière.
    const tempo = fini ? '' : L.ligneTempo(exo, p.etat.seances, false);
    const amplitude = fini || fiche ? '' : L.amplitude(lignesGuide);
    const pourFinir = fini || legere ? '' : L.pourFinir(c.exo, k, c.der, lignesGuide);
    // Le bouton « Aide », juste sous « Tu dois sentir » (2.12.0, il l'a demandé pour tous les exercices) : il ouvre la fiche
    // du guide ; ouverte, c'est « Fermer l'aide », en bas de la fiche, qui la referme.
    // 2.14.3 (demande : ranger le réglage dans l'aide) : plus d'étiquette « Réglage » sous le titre.
    // 2.14.4 (garder la puce du réglage dans l'aide) : l'étiquette (la pastille avec son icône) ouvre l'aide, avec le
    // même texte qu'avant sur la carte (L.texteReglage : le réglage du programme, « banc à 30° », sinon la première phrase du
    // « Réglage » du guide). Venue du guide, la fiche dessous ne redit pas cette phrase : elle garde la suite.
    // 2.36.3 (l'angle du banc compte autant que la charge) : le réglage du programme et le sien sont sur la carte, en gros,
    // sous la charge (ligneReglage) ; l'aide ne les redit pas. Sans eux, l'aide garde son étiquette : la première phrase du
    // « Réglage » du guide, ou de sa « Position » quand il n'y a pas d'appareil à régler.
    const surCarte = this.reglagesCarte(exo);
    const etiquette = surCarte.length ? '' : L.texteReglage(exo, p.etat.guide);
    // 2.38.55 (demande : l'aide plutôt dans « Comment faire », dans les trois petits points) : plus de bouton « Aide » dans
    // l'en-tête de la carte ; « Comment faire » du menu « … » ouvre la même feuille (menuActions).
    // L'aide ouverte prend la place de son bouton, dans le bloc du geste (2.13.3, demande : l'aide s'ouvre là où est son bouton). « Fermer l'aide » la referme, en bas de la fiche.
    // Dans la séance, l'aide dit seulement comment faire : ni les muscles, ni « Tu dois sentir » (juste au-dessus), ni le remplaçant.
    // 2.38.28 (demande : l'aide doit détailler plus que le repos, sans le texte en trop d'avant) : le réglage en étiquette,
    // son champ, la fiche entière par rubriques (muscles, geste, à retenir, à éviter, charge notée, dernière série), puis la
    // sécurité en deux lignes ; ni la bulle verte (réserve, « pour le passer », règles de la salle), ni le coach.
    const aideOuverte = !this.aide ? null : h('div', { cls: 'salle-exo-aide' },
      etiquette ? h('div', { cls: 'salle-reglage', text: etiquette, icone: 'reglage' }) : null,
      this.champReglage(exo),
      // 2.38.68 : la ligne « Vidéo » de la fiche → un bouton ; 2.38.81 (demande : « ce qui manque, c'est comment bien faire le
      // geste ») : en tête de l'aide, avant le texte de la fiche.
      // 2.38.84 : la vidéo lue dans l'aide même, en tête (sans vidéo : rien, la fiche suit).
      L.videoDeFiche(lignesFiche) ? lecteurVideo(p, L.videoDeFiche(lignesFiche)) : null,
      fiche ? ficheExercice(lignesFiche, false, /^(Tu dois sentir|Si c'est pris|Vidéo)$/i, etiquette ? /^(Réglage|Position)$/i : null)
        : h('p', { cls: 'salle-petit', text: 'Pas de fiche : demande à un coach de te montrer.' }),
      h('ul', { cls: 'salle-aide-liste' }, ECRAN_SEANCE.SECURITE_AIDE.map((t) => h('li', { cls: 'salle-repere salle-aide-danger', icone: 'info' },
        h('span', { cls: 'salle-repere-texte' }, enGras(t))))),
      h('button', { cls: 'salle-bouton salle-mini', text: 'Fermer l\'aide', icone: 'annuler', onclick: () => { this.aide = false; this.rendre(); this.allerCarte(); } }));   // 2.38.15 : retour à la carte en haut de l'écran
    // Le bloc du geste se lit entre deux traits (2.14.1, demande : remettre le deuxième trait) :
    // un au-dessus du tempo, un sous « Aide » (ou sous la fiche ouverte), avant la bulle verte.
    // 2.38.9 (demande : pendant la série, pas le temps de lire) : jusqu'où aller et la fin de série sont au repos et dans
    // l'aide ouverte. 2.38.12 (demande : « le truc de respiration c'est utile, de même que le tu dois sentir ») : ces deux
    // lignes restent sur la carte, sous l'effort. 2.38.14 : le bouton « Aide » est dans l'en-tête, l'aide ouverte juste dessous.
    // 2.38.23 : la carte garde la respiration et « Tu dois sentir », aide ouverte ou non ; l'aide est une feuille par-dessus.
    const geste = [tempo ? texteCourt(tempo, 'salle-tempo') : null, cle || null].filter(Boolean);
    // 2.38.11 : sous la cible, sans les deux traits du bloc.
    if (geste.length) carte.appendChild(h('div', { cls: 'salle-exo-geste salle-exo-geste-seul' }, geste));
    // 2.38.42 (demande : ces conseils, c'est au repos qu'il faut les mettre) : plus sur la carte ; voir reperesRepos.
    // La feuille de l'aide (2.38.23, demande : l'aide intuitive, comme les autres panneaux) : l'explication de la cible, le
    // geste en entier (respiration, jusqu'où aller, la fin de la dernière série), la fiche, la bulle verte, « Fermer l'aide ».
    const feuilleAide = !aideOuverte ? null : [...(this.explicationAide || []), aideOuverte];

    // La bulle verte, sous le geste et l'aide : les consignes de cet exercice, toujours là (2.13.1, demande : les consignes utiles restent affichées). La série légère ou la réserve, la supersérie, la douleur, le malaise.
    // 2.38.9 : la bulle passe au repos (boiteRepos) ; sur la carte, seulement l'aide ouverte, avec (2.38.10) la douleur, le
    // malaise et les règles de la salle ; 2.38.14 : dans l'aide, juste avant « Fermer l'aide ».
    // 2.38.25 : la bulle verte n'est plus dans l'aide (la sécurité y est en deux lignes ; la réserve est dite au repos).
    carte.appendChild(this.tableauSeries(sc, exo, c, maj || []));
    r.appendChild(carte);
    if (feuilleAide) r.appendChild(this.feuille(feuilleAide, () => { this.aide = false; this.rendre(); }, 'salle-feuille-aide', 'Aide'));
    if (this.menu) r.appendChild(this.bulle(this.menuActions(sc, exo), () => { this.menu = null; this.rendre(); }));
  },
  // La première fois sur un exercice (jamais noté, aucune série aujourd'hui) : sa fiche « Comment faire » s'ouvre d'elle-même,
  // une fois par exercice de la séance (this.fichesOuvertes) ; « Fermer l'aide » la referme pour de bon, même après un
  // passage par un autre exercice. Sans fiche dans le guide : rien.
  ouvrirAidePremiereFois(sc, exo, der) {
    if (der !== null || exo.faites.length || !(this.plugin.etat.guide || {})[L.norm(exo.nom)]) return;
    const cle = `${sc.debut}|${L.norm(exo.nom)}`;
    if (!this.fichesOuvertes) this.fichesOuvertes = new Set();
    if (this.fichesOuvertes.has(cle)) return;
    this.fichesOuvertes.add(cle);
    this.aide = true;
  },
  // « Exercice 2 sur 8 » puis l'étage en étiquette arrondie (« Étage 1 ») ; le « · » d'avant reste dans le texte
  // (lecteur d'écran), caché à l'écran : l'étiquette sépare déjà.
  rangExo(sc, i, exo) {
    const etage = L.estEtage(exo.etage) ? L.nomEtage(exo.etage) : '';
    // 2.38.19 : « Exercice 5 sur 8 » ouvre le panneau « La séance » (la liste des exercices), par-dessus la carte.
    return h('span', { cls: 'salle-petit salle-exo-rang' },
      h('button', { cls: 'salle-lien salle-ouvrir-liste', type: 'button', text: ECRAN_SEANCE.rang(sc, i), icone: 'programme', 'aria-label': 'Voir la séance',
        onclick: () => { this.liste = true; this.menu = null; this.rendre(); } }),
      etage ? h('span', { cls: 'salle-exo-sep', text: '·' }) : null,
      etage ? h('span', { cls: 'salle-badge salle-exo-etage', text: etage }) : null);
  },
  // La cible en gros (« 20 kg × 12 ») : les nombres très gros, les unités plus petites (ECRAN_SEANCE.morceauxCible).
  // 2.38.7 (demande : pendant l'effort la vue baisse) : les chiffres prennent toute la largeur ; trop longs pour être très
  // gros sur une ligne (« 100 kg × 10+ ») : le poids sur une ligne, les répétitions sur la suivante.
  // 2.38.59 : change (ECRAN_SEANCE.changement) : le nombre qui change (le poids, les répétitions) en couleur.
  cibleGros(texte, change) {
    const morceaux = ECRAN_SEANCE.morceauxCible(texte);
    const marques = ECRAN_SEANCE.nombresChanges(morceaux, change);
    const nombres = morceaux.filter((m) => m.nombre).map((m) => ECRAN_SEANCE.largeurCible(m.texte));
    const total = nombres.reduce((a, b) => a + b, 0);
    const deux = nombres.length === 2 && total > 6.5;   // 2.38.12 : une ligne presque toujours (moins haut)
    const n = Math.max(2, deux ? Math.max(...nombres) : total);
    const enfants = [];
    morceaux.forEach((m, j) => {
      if (deux && m.texte === '×') enfants.push(h('span', { cls: 'salle-cible-saut', 'aria-hidden': 'true' }));
      enfants.push(h('span', { cls: (m.nombre ? 'salle-cible-chiffre' : 'salle-cible-unite') + (marques.has(j) ? ' salle-change' : ''), text: m.texte }));
    });
    return h('div', { cls: 'salle-cible-gros salle-nombre' + (deux ? ' salle-cible-deux' : ''), style: `--n: ${Math.round(n * 10) / 10}` }, enfants);
  },
  // Passé aujourd'hui ; on peut le refaire tant que la séance n'est pas finie.
  carteSaute(sc, exo) {
    const p = this.plugin;
    const t = L.RAISONS.find((x) => x[0] === exo.saute.raison);
    const apres = exo.faites.length ? `, après ${exo.faites.length} série${exo.faites.length > 1 ? 's' : ''}` : '';
    return h('div', { cls: 'salle-carte salle-exo' },
      h('div', { cls: 'salle-petit', text: ECRAN_SEANCE.rang(sc, sc.courant) }),
      h('h3', { text: exo.nom }),
      texteCourt(`Pas fait aujourd'hui${t ? ' (' + t[1].toLowerCase() + ')' : ''}${apres}.\nÇa ne compte pas contre toi : le prochain conseil reste le même.`, 'salle-explication salle-explication-ouverte'),
      h('button', { cls: 'salle-bouton salle-mini', text: 'Le refaire', icone: 'defaire', onclick: async () => { delete exo.saute; this.saisie = null; await p.sauver(); this.rendre(); } }));
  },
  // Les réglages à avoir avant la série : celui du programme (« banc à 30° »), puis le sien, noté dans l'aide (« siège 4 »,
  // lu dans les réglages : juste aussi pour un remplaçant choisi en séance). [] s'il n'y en a pas.
  reglagesCarte(exo) {
    const r = this.plugin.donnees.reglages;
    const mien = r && exo && !exo.echauffement ? (r.machines || {})[L.norm(exo.nom)] : '';
    return L.reglages(mien ? Object.assign({}, exo, { monReglage: mien }) : exo);
  },
  // 2.37.0 : les disques à mettre de chaque côté, juste sous la charge (« Par côté : 10 + 2,5 ») : les plus gros d'abord, ce
  // sont les plus faciles à trouver. Seulement sur un appareil à disques (L.aDisques).
  ligneDisques(exo, charge) {
    const t = L.texteParCote(exo, charge);
    return t ? h('p', { cls: 'salle-cible-disques', text: t, icone: 'disques' }) : null;
  },
  // 2.38.43 (demande : « Par côté » et « Arrête-toi quand il t'en reste 2 » sont utiles, mais mal affichés) : deux pastilles
  // côte à côte sous la charge, chacune avec son icône (les disques, le drapeau de fin), au lieu de deux lignes de texte.
  // 2.38.59 : la pastille du changement (poids ou répétitions), ou null.
  pastilleChangement(change) {
    const t = ECRAN_SEANCE.texteChangement(change);
    return t ? h('p', { cls: 'salle-cible-change', text: t.texte, icone: t.monte ? 'monter' : 'descendre' }) : null;
  },
  pastilles(...els) {
    const l = els.filter(Boolean);
    return l.length ? h('div', { cls: 'salle-cible-infos' }, l) : null;
  },
  // 2.36.3 (l'angle du banc compte autant que la charge) : ces réglages toujours affichés, en gros, juste sous la charge.
  ligneReglage(exo) {
    let lignes = this.reglagesCarte(exo);
    // 2.38.50 (demande : il n'y a plus les réglages, alors que pour certains exercices c'est utile) : sans réglage du
    // programme ni le sien, celui de sa fiche (une machine à régler : « Réglage », pas « Position »), sans l'étiquette, tant
    // que la première série n'est pas faite (le moment où on règle la machine). Il reste aussi dans l'aide.
    if (!lignes.length && exo && !(exo.faites || []).length) {
      const t = L.texteReglage(exo, this.plugin.etat.guide);
      if (/^Réglage : /.test(t)) lignes = [t.replace(/^Réglage : /, '')];
    }
    if (!lignes.length) return null;
    return h('div', { cls: 'salle-cible-reglage', icone: 'reglage' },
      h('div', { cls: 'salle-cible-reglage-texte' }, lignes.map((t) => h('div', { text: t.charAt(0).toUpperCase() + t.slice(1) }))));
  },
  // Ton réglage sur cette machine (2.34.0, demande : « si un réglage est nécessaire, écris ce réglage quelque part ») : un champ
  // dans l'aide. Ce qu'on y écrit (« siège 4 ») est gardé dans les réglages (dossier des données) et redit à chaque séance, sur la carte, à
  // côté de celui du programme (2.36.3 : il ne le remplace plus).
  champReglage(exo) {
    const p = this.plugin, cle = L.norm(exo.nom);
    if (!p.donnees.reglages || exo.echauffement) return null;
    // 2.36.3 : rien à régler debout avec une barre ou au sol (sa fiche dit « Position », pas « Réglage ») : pas de champ.
    const fiche = (p.etat.guide || {})[cle];
    if (fiche && L.champFiche(fiche.lignes, 'Position')) return null;
    const ancien = (p.donnees.reglages.machines || {})[cle] || '';
    const champ = h('input', { type: 'text', cls: 'salle-champ salle-champ-texte', placeholder: 'siège 4, dossier 2…', 'aria-label': 'Ton réglage sur cette machine', maxlength: '60', value: ancien || null });
    champ.addEventListener('change', async () => {
      const t = String(champ.value || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const m = Object.assign({}, p.donnees.reglages.machines || {});
      if (t) m[cle] = t; else delete m[cle];
      p.donnees.reglages.machines = m;
      if (t) exo.monReglage = t; else delete exo.monReglage;
      await p.sauver();
      this.rendre();
    });
    return h('div', { cls: 'salle-mon-reglage' }, h('div', { cls: 'salle-petit', text: 'Ton réglage sur cette machine :' }), champ);
  },
  // Le bouton « … » : les actions rares (comment faire, remplacer, ne pas le faire, corriger ou annuler la dernière série,
  // noter une série en plus).
  boutonActions() {
    return h('button', {
      cls: 'salle-bouton salle-mini salle-exo-plus', icone: 'actions', 'aria-label': 'Plus d\'actions', 'aria-expanded': this.menu ? 'true' : 'false',
      onclick: () => { this.menu = this.menu ? null : 'principal'; this.rendre(); },
    }, h('span', { cls: 'salle-repli', text: '…' }));
  },
  // Le menu « … » : this.menu = null (fermé), 'principal', 'remplacer' ou 'passer' (ses deux sous-menus).
  menuActions(sc, exo) {
    const p = this.plugin;
    let pris = false;   // (check-up 2.38.64) un double toucher dans le menu ne fait qu'une action (avant : deux séries annulées)
    const choisir = async (faire) => {
      if (pris) return;
      pris = true;
      faire();
      this.fermerCarte();
      await p.sauver();
      this.transition(() => { this.rendre(); this.allerCarte(); });
    };
    const panneau = h('div', { cls: 'salle-actions', role: 'menu' });
    const dejaLa = sc.exos.map((x) => x.nom);
    if (this.menu === 'remplacer') return this.menuRemplacer(panneau, sc, exo, choisir, dejaLa);
    if (this.menu === 'passer') return this.menuPasser(panneau, sc, exo, choisir);
    const ligne = (texte, ic, faire) => h('button', { cls: 'salle-bouton salle-actions-ligne', role: 'menuitem', text: texte, icone: ic, onclick: faire });
    // 2.38.55 (demande : l'aide dans « Comment faire », dans les trois petits points ; le bouton « Aide » est retiré) : en tête
    // du menu, il ouvre la feuille de l'aide, même sur un exercice fini.
    panneau.appendChild(ligne('Comment faire', 'guide', () => { this.aide = true; this.menu = null; this.rendre(); this.allerCarte(); }));
    // 2.38.37 (demande : « Machine prise » est inutile, il change lui-même d'exercice) : retiré ; « La séance » (sa liste) sert
    // à ça, et sa consigne le dit.
    if (!exo.faites.length && L.remplacants(exo, p.etat.programme, dejaLa).length) {
      panneau.appendChild(ligne('Remplacer par un autre exercice', 'remplacer', () => { this.menu = 'remplacer'; this.rendre(); }));
    }
    panneau.appendChild(ligne('Ne pas le faire aujourd\'hui', 'annuler', () => { this.menu = 'passer'; this.rendre(); }));
    if (exo.faites.length) {
      // 2.38.16 : « Corriger » quitte le dessous de la série (la carte entière à l'écran) pour le menu.
      panneau.appendChild(ligne('Corriger la dernière série', 'modifier', () => {
        const m = exo.faites.length - 1, f = exo.faites[m];
        this.corrige = { exo: sc.courant, m, c: f.c > 0 ? f.c : null, v: f.s != null ? f.s : f.r };
        this.menu = null;
        this.rendre();
      }));
      panneau.appendChild(ligne('Annuler la dernière série', 'defaire', () => choisir(() => {
        exo.faites.pop();
        sc.reposFin = 0;
        sc.reposTotal = 0;
        if (sc.question === sc.courant) sc.question = null;
        this.annonce = null;
        this.eclat = null;
      })));
      // 2.38.1 (demande : pouvoir noter une série faite en plus de celles prévues) : une ligne « Maintenant » de plus, la charge
      // de la dernière série déjà remplie ; seulement pour cette séance, le programme ne change pas.
      if (!exo.echauffement && exo.unite !== 's') {
        panneau.appendChild(ligne('Noter une série en plus', 'plus', () => choisir(() => {
          exo.series = Math.max(+exo.series || 0, exo.faites.length) + 1;
          this.saisie = null;
        })));
      }
    }
    // 2.38.38 (demande : le réglage affiché vient des études, il n'a pas à le changer) : plus de « Changer le réglage de la
    // machine (programme) » ; ses propres chiffres (siège, dossier) se notent dans l'Aide (champReglage).
    return panneau;
  },
  // Le bouton « Retour » des deux sous-menus : revient au menu principal.
  retourMenu() {
    return h('button', { cls: 'salle-bouton salle-mini', text: 'Retour', icone: 'retour', onclick: () => { this.menu = 'principal'; this.rendre(); } });
  },
  // Sous-menu « Remplacer par » : les remplaçants du programme (4 au plus).
  menuRemplacer(panneau, sc, exo, choisir, dejaLa) {
    const p = this.plugin;
    const remp = L.remplacants(exo, p.etat.programme, dejaLa);
    panneau.appendChild(h('strong', { text: 'Remplacer par :', icone: 'remplacer' }));
    panneau.appendChild(h('div', { cls: 'salle-choix' }, remp.slice(0, 4).map((a) => h('button', {
      cls: 'salle-bouton salle-mini', text: a.nom, icone: 'remplacer',
      onclick: () => choisir(() => { sc.exos[sc.courant] = L.remplacer(exo, a, p.etat.programme, p.etat.seances, p.donnees.reglages ? p.donnees.reglages.poids : null); }),
    }))));
    panneau.appendChild(this.retourMenu());
    return panneau;
  },
  // Sous-menu « Ne pas le faire aujourd'hui » : la raison, puis l'exercice suivant pas fini. Pas de « Fatigue » ici (règle du
  // carnet) : c'était une excuse toute prête ; une nuit courte se dit dans le bilan d'avant (pas de record ce jour-là). Restent
  // la douleur, le temps, et « Autre » (une machine prise jusqu'au bout). L.RAISONS garde « fatigue » : les notes déjà écrites
  // se relisent.
  menuPasser(panneau, sc, exo, choisir) {
    panneau.appendChild(h('strong', { text: 'Ne pas le faire aujourd\'hui, parce que :', icone: 'passer' }));
    panneau.appendChild(h('div', { cls: 'salle-choix' }, L.RAISONS.filter(([cle]) => cle !== 'fatigue').map(([cle, t]) => h('button', {
      cls: 'salle-bouton salle-mini', text: t,
      onclick: () => choisir(() => {
        exo.saute = { raison: cle };
        if (sc.question === sc.courant) sc.question = null;
        if (exo.unite === 's') sc.chronoDebut = 0;
        const j = L.suivantPasFini(sc.exos, sc.courant);
        if (j >= 0) sc.courant = j;
      }),
    }))));
    panneau.appendChild(this.retourMenu());
    return panneau;
  },
  // Le tableau : une ligne par série. Faites : en vert, avec « +1 », « = » ou « nouvelle charge » (le record en or, avec le
  // trophée) ; en cours : la grande ligne avec − / + (ou le chrono) ; à venir : pâles, avec la cible.
  tableauSeries(sc, exo, c, maj) {
    const p = this.plugin, i = sc.courant, der = c.der, n = exo.series, k = exo.faites.length;
    const enCours = k < n;   // un exercice fini : jamais de série en plus
    const t = h('div', { cls: 'salle-series' + (der ? '' : ' salle-series-sans-avant'), role: 'table', 'aria-label': `Séries de ${exo.nom}` });
    t.appendChild(h('div', { cls: 'salle-serie salle-series-tete', role: 'row' },
      h('span', { cls: 'salle-serie-n', text: 'N°' }),
      h('span', { cls: 'salle-serie-avant', text: der ? `Le ${L.dateCourte(der.date)}` : '' }),
      h('span', { cls: 'salle-serie-val', text: 'Aujourd\'hui' }),
      h('span', { cls: 'salle-serie-etat' })));
    // Les séries légères d'abord, des lignes comme les autres : faite, maintenant, à venir. Une fois la série 1 faite, seules
    // celles qui ont été faites restent.
    const legere = L.legereAFaire(exo, c.premiere ? c.premiere.charge : null);
    L.chargesApproches(exo, c.premiere ? c.premiere.charge : null).forEach((a, q) => {
      if (k > 0 && !a.faite) return;
      const ici = !!legere && legere.n === q + 1;
      t.appendChild(h('div', { cls: 'salle-serie salle-serie-legere ' + (a.faite ? 'salle-serie-faite salle-etat-fait' : ici ? 'salle-serie-courante salle-etat-maintenant' : 'salle-serie-avenir salle-etat-pale'),
        role: 'row', 'aria-current': ici ? 'step' : null },
      h('span', { cls: 'salle-serie-n', icone: 'echauffement' }),
      h('span', { cls: 'salle-serie-avant', text: 'léger' }),
      h('span', { cls: 'salle-serie-val salle-nombre', text: ici ? 'Maintenant' : a.c > 0 ? `${L.fmt(a.c)} kg × ${a.r}` : a.texte }),
      h('span', { cls: 'salle-serie-etat' }, a.faite ? (icone('valider') || h('span', { cls: 'salle-serie-coche-faite', text: '✓' })) : null)));
    });
    const lignes = Math.max(n, k);
    for (let m = 0; m < lignes; m++) {
      const d = der && Array.isArray(der.series) ? der.series[m] : null;
      // Une série que la fois d'avant n'avait pas (2.38.6, demande : que veut dire le tiret ?) : « nouvelle », pas « — ».
      const avant = h('span', { cls: 'salle-serie-avant salle-nombre', text: d ? ECRAN_SEANCE.court(d) : der ? 'nouvelle' : '' });
      const num = h('span', { cls: 'salle-serie-n salle-nombre', text: String(m + 1) });
      if (m < k && m === k - 1 && this.corrige && this.corrige.exo === i && this.corrige.m === m) {
        // La dernière série notée, en cours de correction : ses chiffres avec − / +, puis « Enregistrer » ou « Annuler ».
        t.appendChild(this.ligneCorrection(exo, num, avant));
      } else if (m < k) {
        const f = exo.faites[m];
        const ec = ECRAN_SEANCE.ecart(f, d);
        // La pastille (« Record », « +1 », « nouvelle charge ») suit les chiffres ; sur un écran étroit, elle passe dessous.
        t.appendChild(h('div', { cls: 'salle-serie salle-serie-faite ' + (f.record ? 'salle-serie-record salle-etat-record' : 'salle-etat-fait') + (this.eclat === `${i}-${m}` ? ' salle-serie-eclat' : ''), role: 'row' },
          num, avant,
          h('span', { cls: 'salle-serie-val salle-nombre' },
            h('span', { cls: 'salle-serie-chiffres', text: L.ecrireSerie(f) }),
            f.record ? h('span', { cls: 'salle-badge salle-etat-record', text: 'Record', icone: 'record' }) : ec ? h('span', { cls: 'salle-badge', text: ec }) : null),
          // 2.38.60 (demande : un logo pour modifier, accessible près de la série) : sur la dernière série notée, un crayon à la
          // place de la coche ; il ouvre sa correction (comme « Corriger la dernière série » du menu « … », qui reste).
          h('span', { cls: 'salle-serie-etat' + (m === k - 1 ? ' salle-etat-crayon' : '') }, m === k - 1
            ? h('button', { cls: 'salle-serie-modifier', type: 'button', icone: 'modifier', 'aria-label': `Corriger la série ${m + 1}`,
              onclick: () => { this.corrige = { exo: i, m, c: f.c > 0 ? f.c : null, v: f.s != null ? f.s : f.r }; this.menu = null; this.rendre(); } },
            h('span', { cls: 'salle-repli', text: '✎' }))
            : f.record ? icone('record') : (icone('valider') || h('span', { cls: 'salle-serie-coche-faite', text: '✓' }))),
          // 2.38.11 : plus la ligne « Record : 23 répétitions à 4 kg, avant 22 » sous la série (le repos l'a annoncé) ; le
          // badge et la coupe restent. 2.38.16 : « Corriger » est dans le menu « … » (« Corriger la dernière série »).
          null));
      } else if (m === k && enCours && !legere && !(this.corrige && this.corrige.exo === i)) {
        // 2.38.61 (demande : pendant qu'il en corrige une, l'autre n'a pas besoin de s'afficher) : pendant une correction, la
        // série en cours n'a pas sa saisie : une ligne à venir comme les autres (ci-dessous).
        t.appendChild(h('div', { cls: 'salle-serie salle-serie-courante salle-etat-maintenant', role: 'row', 'aria-current': 'step' },
          num, avant,
          h('span', { cls: 'salle-serie-val', text: 'Maintenant' }),
          h('span', { cls: 'salle-serie-etat' }),
          h('div', { cls: 'salle-serie-saisie' }, exo.unite === 's' ? this.chronoGainage(sc, exo, c.cible, maj) : this.saisieSerie(exo)),
          null));   // 2.38.11 : plus « Ta meilleure : … » sous la saisie (épurer ; et ne pas annoncer un record avant)
      } else {
        // 2.38.24 (demande : voir les 4 séries pour savoir ce qu'il y a à faire) : une ligne par série à venir (plus de ligne
        // « Séries 2 à 4 : … » regroupée).
        t.appendChild(h('div', { cls: 'salle-serie salle-serie-avenir salle-etat-pale', role: 'row' },
          num, avant, h('span', { cls: 'salle-serie-val salle-nombre', text: c.cible.gros }), h('span', { cls: 'salle-serie-etat' })));
      }
    }
    return t;
  },
  // La ligne d'une série en cours de correction (this.corrige) : comme la ligne « Maintenant », avec ses propres chiffres.
  ligneCorrection(exo, num, avant) {
    const k = this.corrige;
    return h('div', { cls: 'salle-serie salle-serie-courante salle-serie-correction salle-etat-maintenant', role: 'row' },
      num, avant,
      h('span', { cls: 'salle-serie-val', text: 'Correction' }),
      h('span', { cls: 'salle-serie-etat' }),
      h('div', { cls: 'salle-serie-saisie' }, h('div', null,
        exo.unite === 's' ? this.compteur(k.v, 5, 's', false, (v) => { k.v = v; }) : null,
        exo.unite !== 's' && !(exo.corps && !(k.c > 0)) ? this.compteur(k.c, exo.pas, 'kg', true, (v) => { k.c = v; }) : null,
        exo.unite !== 's' ? this.compteur(k.v, 1, 'rép.', false, (v) => { k.v = v; }) : null)),
      h('div', { cls: 'salle-serie-detail salle-choix' },
        h('button', { cls: 'salle-bouton salle-mini salle-principal', type: 'button', text: 'Enregistrer', icone: 'valider', onclick: () => this.enregistrerCorrection() }),
        h('button', { cls: 'salle-bouton salle-mini', type: 'button', text: 'Annuler', icone: 'annuler', onclick: () => { this.corrige = null; this.rendre(); } })));
  },
  // La saisie de la série en cours : la charge (sauf au poids du corps) et les répétitions, avec − / +.
  saisieSerie(exo) {
    const s = this.saisie;
    return h('div', null,
      exo.corps && !(s.c > 0) ? null : this.compteur(s.c, exo.pas, 'kg', true, (v) => { s.c = v; }),
      this.compteur(s.v, 1, 'rép.', false, (v) => { s.v = v; }));
  },
  // Le chrono du gainage : 3 s pour se mettre en place, puis un grand chiffre qui monte, une jauge avec un repère à la
  // cible, un bip à la cible ; « Fait » (en bas) note le temps. Sans chrono : on note les secondes à la main.
  chronoGainage(sc, exo, cible, maj) {
    const p = this.plugin, s = this.saisie, but = cible.valeur > 0 ? cible.valeur : exo.min;
    const actif = sc.chronoDebut > 0;
    const temps = h('span', { cls: 'salle-chrono-temps salle-nombre', text: actif ? '0:00' : L.fmtDuree(but) });
    const plein = h('div', { cls: 'salle-chrono-plein' });
    const boite = h('div', { cls: 'salle-chrono' + (actif ? ' salle-chrono-actif' : ''), role: 'timer' },
      h('div', { cls: 'salle-chrono-haut' }, temps, h('span', { cls: 'salle-petit', text: `cible : ${but} s`, icone: 'chrono' })),
      h('div', { cls: 'salle-chrono-jauge' }, plein, h('span', { cls: 'salle-chrono-repere', title: `${but} s` })));
    if (!actif) {
      boite.appendChild(this.compteur(s.v, 5, 's', false, (v) => { s.v = v; }));
      boite.appendChild(h('button', { cls: 'salle-bouton salle-mini', text: 'Noter sans chrono', icone: 'valider', onclick: () => this.validerSerie() }));
      return boite;
    }
    boite.appendChild(h('button', { cls: 'salle-bouton salle-mini', text: 'Arrêter sans noter', icone: 'annuler', onclick: async () => { sc.chronoDebut = 0; await p.sauver(); this.rendre(); } }));
    (maj || []).push(() => {
      if (!(sc.chronoDebut > 0)) return;
      const e = (Date.now() - sc.chronoDebut) / 1000;
      if (e < 0) { temps.textContent = String(Math.ceil(-e)); plein.style.transform = 'scaleX(0)'; return; }
      temps.textContent = L.fmtDuree(e);
      plein.style.transform = `scaleX(${Math.min(1, e / (but * 1.25)).toFixed(4)})`;   // le repère est à 80 % : la cible
      if (e >= but) {
        if (boite.className.indexOf('salle-chrono-atteint') < 0) boite.className = 'salle-chrono salle-chrono-actif salle-chrono-atteint';
        if (this.sonneChrono !== sc.chronoDebut) { this.sonneChrono = sc.chronoDebut; if (typeof p.bip === 'function') p.bip(1); }
      }
    });
    return boite;
  },
});
