// SallePlugin : le chargement, data.json (partagé par le Mac et l'iPhone), la vue, les commandes et le lien obsidian://salle,
// ce qui est déjà vu sur cet appareil, les réglages de la semaine. La suite : 92-appareil.js, 94-notes-io.js, 96-onglet.js.

// ───────────────────────── Le plugin ─────────────────────────
// La lecture seule des notes est revérifiée à ce rythme (une note passée en édition repasse en lecture).
const LECTURE_SEULE_MS = 1500;

class SallePlugin extends obsidian.Plugin {
  // ── Chargement et data.json (partagé par le Mac et l'iPhone) ──
  async onload() {
    // Cette ouverture d'Obsidian : l'écran qu'Obsidian a gardé ne compte que s'il vient d'elle (VueSalle.setState).
    this.session = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    this.donnees = L.lireDonnees(await this.lireStock(), SallePlugin.verifierEnCours);
    this.base = L.empreinteDonnees(this.donnees);   // ce que dit data.json au départ (voir sauver et onExternalSettingsChange)
    this.etat = { programme: L.lireProgramme(PROGRAMME_DEFAUT), programmeSecours: false, seances: [], guide: {}, mesures: [], forme: [], fichiers: {}, textes: {} };
    this.index = new Map();   // chemin → { mtime, size, texte, a } : une note n'est relue que si elle a changé
    this.vus = new Set();     // repli de dejaVu quand le stockage de l'appareil manque
    this.pret = new Promise((ok) => { this.signalerPret = ok; });
    this.registerView(VUE, (leaf) => new VueSalle(leaf, this));
    this.addRibbonIcon(ICONES.salle, 'Salle', () => this.ouvrir());
    this.commandes();
    // obsidian://salle (bouton de l'écran verrouillé, retours de test).
    if (typeof this.registerObsidianProtocolHandler === 'function') this.registerObsidianProtocolHandler(ACTION_LIEN, (params) => this.surLien(params));
    // Au retour dans Obsidian (Raccourcis, Deezer, écran verrouillé), redemander l'écran allumé pendant une séance.
    if (typeof document !== 'undefined' && typeof this.registerDomEvent === 'function') this.registerDomEvent(document, 'visibilitychange', () => this.surVisibilite());
    this.ongletReglages();
    this.app.workspace.onLayoutReady(async () => {
      try {
        await this.recharger();
        await this.suivreReglages();
        await this.rangerNoms();   // les noms d'avant la 2.38.0 (« Données », « Réglages.md »…) : renommés ici, avant d'écouter le coffre
        await this.suivreProgrammeLivre();   // 2.38.80 : le programme suit le programme livré (une fois par nouvelle version)
        await this.reprendreCransAvant();   // 2.41.15 : le matériel de sa salle, perdu par un ancien remplacement, repris
        this.ecouter();
        // 2.38.85 : la dernière version publiée, pour l'accueil (« · À jour » à côté de la date), sans attendre le réseau.
        this.verifierVersion();
        this.registerInterval(window.setInterval(() => this.verifierVersion(), VERSION_REVOIR_MS));
        await this.appliquerLecture();
        this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => this.ongletVide(leaf)));
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => window.setTimeout(() => this.majBarre(), 60)));
        this.pleinEcranDesNotes();
        this.registerEvent(this.app.workspace.on('layout-change', () => { this.boutonsAccueil(); this.fermerPanneauDroit(); this.sansGlissement(); }));
        this.sansGlissement();
        this.registerInterval(window.setInterval(() => { this.lectureSeule(); this.garderBarre(); }, LECTURE_SEULE_MS));
        // Après l'écouteur d'Obsidian qui remet sa barre à chaque toucher : pendant une séance, elle repart aussitôt.
        if (typeof this.registerDomEvent === 'function') this.registerDomEvent(window, 'mousedown', (ev) => this.garderBarre(ev));
        this.fermerPanneauDroit();
        this.boutonsAccueil();
        await this.ouvrir();
        this.vues().forEach((v) => v.rendre());
      } finally {
        this.signalerPret();   // un lien reçu au démarrage attend ce moment
      }
    });
  }
  onunload() {
    this.cacherBarre(false);
    try { if (this.audio && typeof this.audio.close === 'function') this.audio.close(); } catch (e) { /* rien */ }
    this.audio = null;
  }
  // Une séance en cours abîmée ou d'une autre version est abandonnée plutôt que de bloquer l'écran. Vérifie, ne modifie rien.
  static verifierEnCours(x) {
    const ok = x && typeof x.nom === 'string' && typeof x.date === 'string' && Array.isArray(x.exos) && x.exos.length &&
      x.exos.every((e) => e && typeof e.nom === 'string' && e.series > 0 && Array.isArray(e.faites));
    return ok ? x : null;
  }

  static saitVibrer() {
    try { return typeof HTMLInputElement !== 'undefined' && 'switch' in HTMLInputElement.prototype; } catch (e) { return false; }
  }

  // ── Où vivent les données (2.25.0) ──
  // Les réponses au questionnaire : la note « Réglages » du dossier des données (salle: reglages). data.json, dans le dossier
  // du plugin, ne garde que le brouillon (séance en cours, bilan du jour) et le chemin de cette note (noteReglages), pour la
  // lire au démarrage avant que le coffre soit prêt (2.30.0 : même le brouillon est dans le dossier des données, voir
  // lireStock). Pour le reste du code rien ne change : lireStock rend le même objet
  // qu'un data.json d'avant ({ reglages, enCours, bilan }), ecrireStock le range aux deux endroits.
  // Un data.json d'avant la 2.25.0 (réglages dedans, pas de note) se lit tel quel ; la note est créée dès que le coffre est prêt.
  async lireStock(strict) {
    const d = await this.loadData();
    // La clé de l'API des calories (93-calories.js) : seulement dans data.json. Changée ici et pas encore écrite : on la garde.
    if (!this.cleIAModifiee) this.cleIA = d && typeof d.cleIA === 'string' ? d.cleIA : '';
    const f = this.etat && this.etat.fichiers ? this.etat.fichiers.reglages : null;
    const chemin = (f && f.path) || (d && typeof d.noteReglages === 'string' ? d.noteReglages : null);
    if (!chemin) return d;
    this.cheminReglages = chemin;
    let texte = null;
    try { texte = await this.app.vault.adapter.read(chemin); } catch (e) { texte = null; }
    const reg = L.lireNoteReglages(texte);
    // Note absente ou illisible. En lecture stricte (pendant l'utilisation), on ne conclut rien : sinon data.json, qui ne
    // contient plus que le chemin de la note, ferait croire que la séance en cours a disparu (2.34.1). Au démarrage : ce que
    // dit data.json (souvent rien).
    if (!reg) {
      if (strict) throw new Error('Réglages illisibles');
      return d;
    }
    this.texteReglages = texte;
    const lu = Object.assign({}, d || {}, { reglages: reg });
    // Le brouillon (2.30.0) : la séance en cours et le bilan du jour sont dans le dossier des données, à côté de la note
    // « Réglages » (brouillon.json). Absent : ce que dit encore data.json (avant la 2.30.0), et il sera créé. Là mais illisible
    // (iCloud en pleine copie) : en lecture stricte on ne conclut rien (reprendreDisque garde la mémoire) ; au démarrage on
    // attend, sans jamais écrire par-dessus.
    this.cheminBrouillon = this.cheminBrouillonDe(chemin);
    let b = await this.lireBrouillon(this.cheminBrouillon);
    // Un dossier d'avant la 2.38.0 : le brouillon porte encore son ancien nom, tant que rangerNoms ne l'a pas renommé.
    if (b.etat === 'absent') {
      const ancien = this.cheminBrouillonDe(chemin, ANCIEN_BROUILLON), b2 = await this.lireBrouillon(ancien);
      if (b2.etat !== 'absent') { b = b2; this.cheminBrouillon = ancien; }
    }
    if (b.etat === 'lu') {
      lu.enCours = b.valeur.enCours || null;
      lu.bilan = b.valeur.bilan || null;
      this.texteBrouillon = b.texte;
      this.brouillonIllisible = false;
      this.brouillonAMigrer = false;
      this.echecsBrouillon = 0;
    } else if (b.etat === 'illisible') {
      this.echecsBrouillon = (this.echecsBrouillon || 0) + 1;
      // Pendant l'utilisation : la mémoire fait foi, elle sera réécrite (comme data.json avant). Au démarrage : on ne sait
      // pas encore ce qu'il contient, on n'écrit pas dessus tant qu'il n'a pas été relu (3 essais au plus).
      if (strict) { this.texteBrouillon = null; throw new Error('Brouillon illisible'); }
      this.brouillonIllisible = true;
    } else {
      this.brouillonIllisible = false;
      this.brouillonAMigrer = true;
    }
    return lu;
  }
  // Le brouillon est à côté de la note « Réglages » : « donnees/reglages.md » → « donnees/brouillon.json » (nom : un autre
  // nom de fichier, pour le brouillon d'avant la 2.38.0).
  cheminBrouillonDe(cheminReglages, nom) {
    const i = cheminReglages.lastIndexOf('/');
    return (i >= 0 ? cheminReglages.slice(0, i + 1) : '') + (nom || FICHIER_BROUILLON);
  }
  // → { etat: 'lu', valeur, texte } | { etat: 'absent' } | { etat: 'illisible' } (le fichier est là, mais pas lisible en entier).
  async lireBrouillon(chemin) {
    const a = this.app.vault.adapter;
    let texte;
    try {
      texte = await a.read(chemin);
    } catch (e) {
      let la = false;
      try { la = typeof a.exists === 'function' ? !!(await a.exists(chemin)) : false; } catch (e2) { la = false; }
      return { etat: la ? 'illisible' : 'absent' };
    }
    try {
      const v = JSON.parse(texte);
      if (v && typeof v === 'object' && !Array.isArray(v)) return { etat: 'lu', valeur: v, texte };
    } catch (e) { /* à moitié écrit */ }
    return { etat: 'illisible' };
  }
  // Avec une note « Réglages » : les réglages dans la note, le brouillon dans brouillon.json à côté d'elle, et data.json ne
  // garde que le chemin de la note. Sans note possible (coffre pas encore prêt) : tout dans data.json, comme avant.
  // Rien n'est réécrit quand rien n'a changé.
  async ecrireStock(copie) {
    const stock = {};
    let chemin = null;
    this.brouillonSaute = false;
    if (copie.reglages) {
      try { chemin = await this.noterReglages(copie.reglages); } catch (e) { if (typeof console !== 'undefined') console.error('Salle :', e); }
    }
    if (chemin) {
      stock.noteReglages = chemin;
      // (check-up 2.38.64) brouillon sauté (illisible, iCloud le copie encore) : noté, pour que sauver ne croie pas la séance écrite.
      this.brouillonSaute = !!(this.brouillonIllisible && (this.echecsBrouillon || 0) < 3);
      if (!this.brouillonSaute) {
        this.brouillonIllisible = false;
        // L'ancien nom tant qu'il n'est pas renommé (rangerNoms) : jamais deux brouillons côte à côte.
        const ancien = this.cheminBrouillonDe(chemin, ANCIEN_BROUILLON);
        const cb = this.cheminBrouillon === ancien ? ancien : this.cheminBrouillonDe(chemin), tb = JSON.stringify({ enCours: copie.enCours, bilan: copie.bilan }, null, 1) + '\n';
        if (tb !== this.texteBrouillon || cb !== this.cheminBrouillon) {
          await this.app.vault.adapter.write(cb, tb);
          this.texteBrouillon = tb;
        }
        this.cheminBrouillon = cb;
        this.brouillonAMigrer = false;
      }
    } else {
      stock.enCours = copie.enCours;
      stock.bilan = copie.bilan;
      if (copie.reglages) stock.reglages = copie.reglages;
    }
    if (this.cleIA) stock.cleIA = this.cleIA;
    const ts = JSON.stringify(stock);
    if (ts !== this.stockEcrit) {
      await this.saveData(stock);
      this.stockEcrit = ts;
    }
    this.cleIAModifiee = false;
  }
  // Écrit la note « Réglages » si son texte a changé ; la crée dans le dossier des données quand le coffre est prêt.
  // → son chemin, ou null (coffre pas encore prêt et pas de note connue : les réglages restent dans data.json d'ici là).
  async noterReglages(reglages) {
    const v = this.app && this.app.vault, texte = L.ecrireNoteReglages(reglages);
    if (!v) return null;
    const f = this.etat && this.etat.fichiers ? this.etat.fichiers.reglages : null;
    if (f && f.path) {
      if (texte !== this.texteReglages) { await v.modify(f, texte); this.texteReglages = texte; }
      return (this.cheminReglages = f.path);
    }
    if (!this.coffrePret) {
      if (!this.cheminReglages) return null;
      if (texte !== this.texteReglages) { await v.adapter.write(this.cheminReglages, texte); this.texteReglages = texte; }
      return this.cheminReglages;
    }
    const neuf = await v.create(this.cheminLibre(await this.dansDonnees(NOMS_FICHIERS.reglages)), texte);
    this.texteReglages = texte;
    if (neuf && neuf.path) { this.etat.fichiers.reglages = neuf; this.etat.textes.reglages = texte; }
    return (this.cheminReglages = neuf && neuf.path ? neuf.path : null);
  }
  // Après chaque lecture des notes : suivre la note « Réglages ». Changée ailleurs (l'autre appareil, par iCloud) : même
  // fusion que pour data.json. Pas encore de note : elle est créée (un data.json d'avant la 2.25.0). Un écran resté sur le
  // questionnaire parce que la note n'était pas encore lue revient à l'accueil.
  async suivreReglages() {
    this.coffrePret = true;
    const avant = !!(this.donnees && this.donnees.reglages);
    const t = this.etat && this.etat.textes ? this.etat.textes.reglages : null;
    try {
      if (t != null) { if (t !== this.texteReglages) await this.onExternalSettingsChange(); }
      // (check-up 2.38.64) seulement si aucune note n'a jamais été connue (un data.json d'avant la 2.25.0) : sinon la note vient
      // d'être effacée (« Réinitialiser » sur l'autre appareil) et la recréer défaisait la remise à zéro.
      else if (avant && !this.cheminReglages) await this.sauver();
      // Un brouillon encore dans data.json (avant la 2.30.0) : il passe dans le dossier des données dès maintenant.
      if (this.brouillonAMigrer && this.etat && this.etat.fichiers && this.etat.fichiers.reglages) await this.sauver();
    } catch (e) { if (typeof console !== 'undefined') console.error('Salle :', e); }
    if (!avant && this.donnees && this.donnees.reglages) {
      this.vues().forEach((v) => { if (v.ecran === 'questions') { v.ecran = this.donnees.enCours ? 'seance' : 'accueil'; v.rendre(); } });
    }
  }

  // Les écritures de data.json, une à la fois (deux touchers rapides ne se marchent pas dessus).
  // Le Mac et l'iPhone partagent ce data.json par iCloud. Juste avant d'écrire, on le relit : ce que l'autre appareil y a
  // mis depuis, et que cet appareil n'a pas changé, est gardé (L.fusionDonnees) : un toucher sur le Mac resté ouvert
  // n'efface ni les tests de l'iPhone, ni ses semaines en pause, ni sa 5e case, ni sa séance en cours.
  // On écrit une copie : l'empreinte (this.base) est exactement ce qui est parti sur le disque.
  async sauver() {
    const ecrire = async () => {
      const repris = await this.reprendreDisque();
      const copie = JSON.parse(JSON.stringify(this.donnees));
      await this.ecrireStock(copie);
      // (check-up 2.38.64) brouillon pas écrit : l'empreinte garde l'ancienne séance, sinon la relecture du brouillon (devenu
      // lisible) effaçait la séance commencée entre-temps.
      if (this.base) { const e = L.empreinteDonnees(copie); if (this.brouillonSaute) { e.enCours = this.base.enCours; e.bilan = this.base.bilan; } this.base = e; }
      if (repris) this.apresReprise(repris);
    };
    const suite = (this.ecriture || Promise.resolve()).then(ecrire, ecrire);
    this.ecriture = suite.catch(() => {});
    try {
      await suite;
    } catch (e) {
      console.error('Salle :', e);
      new obsidian.Notice('Impossible d\'enregistrer les réglages du plugin. Ta séance reste à l\'écran.');
    }
  }
  // Obsidian (1.5.7 et plus récent) appelle ceci quand data.json change sur le disque, par exemple quand
  // iCloud apporte ce que l'autre appareil a écrit. Même fusion que sauver, dans la même file que les écritures.
  async onExternalSettingsChange() {
    const lire = async () => { const r = await this.reprendreDisque(); if (r) this.apresReprise(r); };
    const suite = (this.ecriture || Promise.resolve()).then(lire, lire);
    this.ecriture = suite.catch(() => {});
    try { await suite; } catch (e) { console.error('Salle :', e); }
  }
  // Relit data.json et y reprend ce que l'autre appareil a changé (this.donnees est modifié en place). Rend ce qui a été repris,
  // ou null. Sans empreinte de départ (onload pas passé), sans loadData, ou data.json illisible (iCloud en pleine copie) :
  // rien, on garde ce qu'on a.
  async reprendreDisque() {
    if (!this.base || typeof this.loadData !== 'function') return null;
    let lu;
    try { lu = await this.lireStock(true); } catch (e) { return null; }
    if (!lu || typeof lu !== 'object') return null;
    const disque = L.lireDonnees(lu, SallePlugin.verifierEnCours);
    const r = L.fusionDonnees(this.donnees, this.base, disque);
    this.base = L.empreinteDonnees(disque);
    return r.change ? r : null;
  }
  // Après une reprise : la séance venue de l'autre appareil se redessine (saisie remise à sa cible) ; les autres écrans comme
  // après un changement de note (pas ceux où il est en train de remplir quelque chose).
  apresReprise(r) {
    for (const v of this.vues()) {
      if (r.enCours && v.ecran === 'seance') { v.saisie = null; v.rendre(); }
      else if (typeof v.donneesChangees === 'function') v.donneesChangees();
    }
  }
  mobile() {
    return !!(obsidian.Platform && obsidian.Platform.isMobile);
  }
  nomCoffre() {
    try { return this.app.vault.getName(); } catch (e) { return ''; }
  }
  // L'adresse d'une photo d'exercice : elle est dans main.js (PHOTOS), pas dans un fichier à côté. '' si elle manque.
  image(id, k) {
    const d = PHOTOS[`${id}-${k}`];
    return d ? `data:image/jpeg;base64,${d}` : '';
  }

  // ── La vue ──
  vues() {
    return this.app.workspace.getLeavesOfType(VUE).map((l) => l.view).filter((v) => v instanceof VueSalle);
  }
  async ouvrir() {
    const ws = this.app.workspace;
    let leaf = ws.getLeavesOfType(VUE)[0];
    if (!leaf) {
      const actif = ws.getMostRecentLeaf ? ws.getMostRecentLeaf() : null;
      leaf = actif && actif.view && actif.view.getViewType && actif.view.getViewType() === 'empty' ? actif : ws.getLeaf(this.mobile() ? false : 'tab');
      await leaf.setViewState({ type: VUE, active: true });
    }
    ws.revealLeaf(leaf);
    ws.setActiveLeaf(leaf, { focus: true });
  }
  // Un onglet vide devient le tableau de bord (un peu plus tard, s'il est toujours vide : « ouvrir dans un nouvel onglet » passe par un onglet vide).
  ongletVide(leaf) {
    if (!leaf || !leaf.view || leaf.view.getViewType() !== 'empty') return;
    window.setTimeout(() => {
      if (leaf.view && leaf.view.getViewType() === 'empty' && this.app.workspace.activeLeaf === leaf) leaf.setViewState({ type: VUE, active: true });
    }, 80);
  }
  // Sur iPhone, le panneau de droite d'Obsidian (liens, plan) ne sert à rien ici et s'ouvre d'un glissement du doigt : on le referme.
  // Ses modules (Backlinks, Outgoing links, Tags, Outline, Properties) sont aussi coupés dans .obsidian/core-plugins.json du coffre.
  fermerPanneauDroit() {
    try {
      const d = this.app.workspace.rightSplit;
      if (this.mobile() && d && d.collapsed === false && typeof d.collapse === 'function') d.collapse();
    } catch (e) {
      console.error('Salle :', e);
    }
  }

  // ── Commandes et lien obsidian://salle ──
  commandes() {
    this.addCommand({ id: 'ouvrir', name: 'Ouvrir la salle', callback: () => this.ouvrir() });
    this.addCommand({ id: 'commencer', name: 'Commencer la séance du jour', callback: () => this.seanceDuJour() });
    // Ces deux-là n'apparaissent que pendant une séance, sur son écran.
    this.addCommand({ id: 'serie-faite', name: 'Série faite', checkCallback: (verif) => this.commandeSeance('serie', verif) });
    this.addCommand({ id: 'lancer-repos', name: 'Lancer le repos', checkCallback: (verif) => this.commandeSeance('repos', verif) });
    this.addCommand({ id: 'tester-appareil', name: 'Tester cet appareil', callback: () => this.ouvrirEcran('diagnostic') });
  }
  // La vue de séance qui peut recevoir « Série faite » ou « Lancer le repos », ou null.
  vueSeance() {
    if (!this.donnees.enCours) return null;
    return this.vues().find((v) => v.ecran === 'seance') || null;
  }
  commandeSeance(quoi, verif) {
    const v = this.vueSeance();
    const ok = !!v && (quoi === 'serie' ? !!v.saisie && typeof v.validerSerie === 'function' : typeof v.lancerRepos === 'function');
    if (!ok || verif) return ok;
    this.preparerSon();   // une commande est un geste : le bip de fin de repos pourra sonner
    if (quoi === 'serie') v.validerSerie();
    else v.lancerRepos();
    return true;
  }
  // La séance du jour : la reprendre s'il y en a une, sinon le bilan d'avant (ou le résumé s'il est déjà fait).
  async seanceDuJour() {
    await this.ouvrir();
    const v = this.vues()[0];
    if (!v || !this.donnees.reglages) return;
    if (typeof v.ouvrirSeanceDuJour === 'function') v.ouvrirSeanceDuJour();
    else v.aller(this.donnees.enCours ? 'seance' : 'accueil');
  }
  async ouvrirEcran(ecran) {
    await this.ouvrir();
    const v = this.vues()[0];
    if (v && this.donnees.reglages) v.aller(ecran);
  }
  // obsidian://salle?vault=…&ecran=seance|progres|mesures|guide|seances|diagnostic (et &test=… pour « Tester cet appareil »).
  async surLien(params) {
    const route = L.routeLien(params, !!this.donnees.reglages);
    if (route.test) await this.retourTest(route.test);
    await this.pret;
    if (route.faire === 'seance') return this.seanceDuJour();
    if (route.faire === 'aller') return this.ouvrirEcran(route.ecran);
    return this.ouvrir();
  }

  // ── Déjà vu sur cet appareil ──
  // Sert à la demande de mesures d'un palier (« Plus tard », clé « palier-N », 65-progres.js). Les consignes vertes ne s'en
  // servent plus : elles sont toujours affichées (2.13.1). Le préfixe « salle-vu2- » ne change pas.
  dejaVu(cle) {
    if (this.vus && this.vus.has(cle)) return true;
    try { return !!window.localStorage.getItem('salle-vu2-' + cle); } catch (e) { return false; }
  }
  marquerVu(cle) {
    if (!this.vus) this.vus = new Set();
    this.vus.add(cle);
    try { window.localStorage.setItem('salle-vu2-' + cle, '1'); } catch (e) { /* repli en mémoire */ }
  }

  // ── Réglages de la semaine (régularité, semaine légère, 5e case) ──
  // Les tableaux ne sont jamais modifiés en place : on les remplace.
  // malade : la semaine ajoutée est aussi marquée « malade » (L.apresMaladie) ; une semaine retirée perd sa marque.
  async basculerPause(lundi, malade) {
    const reg = this.donnees.reglages;
    if (!reg || !L.deISO(lundi)) return;
    const l = L.lundi(lundi);
    reg.pauses = L.basculerDate(reg.pauses, l);
    reg.malade = L.basculerDate(reg.malade, l, reg.pauses.indexOf(l) >= 0 && !!malade);
    await this.sauver();
    this.vues().forEach((v) => v.donneesChangees());
  }
  async choisirSemaineLegere(lundi, oui) {
    const reg = this.donnees.reglages;
    if (!reg || !L.deISO(lundi)) return;
    const l = L.lundi(lundi);
    if (oui) reg.semainesLegeres = L.basculerDate(reg.semainesLegeres, l, true);
    else reg.legereRefus = l;
    await this.sauver();
    this.vues().forEach((v) => v.donneesChangees());
  }
  async cocherRecup(lundi, oui) {
    const reg = this.donnees.reglages;
    if (!reg || !L.deISO(lundi)) return;
    reg.recup = L.basculerDate(reg.recup, L.lundi(lundi), !!oui);
    await this.sauver();
  }

}
