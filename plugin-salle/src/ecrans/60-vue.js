// VueSalle, la base : cycle de vie, aller d'un écran à l'autre (transition douce), rendre, écran allumé, en-tête, compteur,
// consigne verte. Les écrans s'ajoutent ensuite à VueSalle.prototype, un fichier par écran (61 à 68).

// ───────────────────────── L'écran ─────────────────────────
class VueSalle extends obsidian.ItemView {
  // ── Cycle de vie (Obsidian) ──
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.ecran = 'accueil';
    this.horloge = null;
    this.saisie = null;
    this.aide = false;
    this.confirmerLe = 0;        // l'heure du premier toucher sur « Terminer » (un second toucher confirme)
    this.question = 0;
    this.reponses = {};
    this.bilan = null;
    this.guideOuvert = null;
    this.verrou = null;          // le Wake Lock en cours (écran allumé)
    this.allumeVoulu = false;    // ce que la vue veut : utile si la demande se termine après la fin de la séance
  }
  getViewType() { return VUE; }
  getDisplayText() { return 'Salle'; }
  getIcon() { return ICONES.salle; }
  async onOpen() {
    this.contentEl.classList.add('salle');
    // Dans l'app, un glissement du doigt n'ouvre plus les panneaux d'Obsidian (à gauche comme à droite) : les touchers
    // restent dans cet écran. Le défilement et les boutons marchent comme avant.
    if (!this.contentEl.salleSansGlisser) {
      this.contentEl.salleSansGlisser = true;
      // La barre d'Obsidian (en bas) et son en-tête : cachés pendant une séance, en plein écran, et quand on descend dans la page.
      this.contentEl.addEventListener('scroll', () => this.surDefilement(), { passive: true });
      // Obsidian remet sa barre à chaque toucher : pas pendant une séance ni en plein écran.
      // 2.38.58 : partout dans le plugin (plein écran dès l'arrivée), sauf quand on vient de la faire revenir en remontant.
      this.contentEl.addEventListener('mousedown', (ev) => { if (this.barreSeance || !this.barreVue) ev.stopPropagation(); });
      this.contentEl.addEventListener('focusout', () => window.setTimeout(() => this.plugin.majBarre(), 400));
      for (const evt of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
        this.contentEl.addEventListener(evt, (ev) => ev.stopPropagation(), { passive: true });
      }
      // 2.38.23 (demande : glisser du bas vers le haut fait monter « La séance », du haut vers le bas descendre l'en-tête).
      this.contentEl.addEventListener('touchstart', (ev) => this.debutGlisse(ev), { passive: true });
      this.contentEl.addEventListener('touchmove', (ev) => this.suiteGlisse(ev), { passive: true });   // 2.38.34 : suit le doigt
      this.contentEl.addEventListener('touchend', (ev) => this.finGlisse(ev), { passive: true });
      this.contentEl.addEventListener('touchcancel', () => this.annulerGlisse(), { passive: true });   // 2.38.51
    }
    this.ecran = this.plugin.donnees.reglages ? (this.plugin.donnees.enCours ? 'seance' : 'accueil') : 'questions';
    this.rendre();
  }
  async onClose() { this.arreterHorloge(); this.garderAllume(false); this.barreSeance = false; this.plugin.majBarre(); }
  // L'écran en cours, gardé par Obsidian : sur iPhone, une note ouverte d'ici remplace la vue, et « Retour » revient au même écran.
  // 2.18.2 (demande : à la réouverture sur le téléphone, l'accueil et non l'écran Progrès) : Obsidian
  // garde cet état dans son espace de travail et le redonnait à chaque démarrage (« progres », resté depuis des jours).
  // L'état porte donc la session du plugin (SallePlugin.session) : il ne compte que pendant la même ouverture d'Obsidian.
  // Au démarrage suivant, il est ignoré : l'accueil, ou la séance en cours (onOpen).
  getState() {
    return { ecran: ECRANS.indexOf(this.ecran) >= 0 ? this.ecran : 'accueil', session: this.plugin.session };
  }
  async setState(etat, resultat) {
    await super.setState(etat, resultat);
    const e = etat && etat.ecran;
    if (etat && etat.session === this.plugin.session && this.plugin.donnees.reglages && ECRANS.indexOf(e) >= 0 && (e !== 'seance' || this.plugin.donnees.enCours)) {
      this.ecran = e;
      this.rendre();
    }
  }
  arreterHorloge() {
    if (this.horloge) { window.clearInterval(this.horloge); this.horloge = null; }
  }

  // ── Aller d'un écran à l'autre, dessiner ──
  // Changer d'écran. L'état change tout de suite ; le dessin passe par une transition douce si l'appareil sait la faire.
  aller(ecran) {
    this.passer = false;
    this.barreVue = false;   // 2.38.57 : la barre d'Obsidian cachée de base sur chaque écran
    // Quitter le questionnaire l'annule : rien n'est écrit avant la dernière réponse.
    if (ecran !== 'questions') { this.questionnaire = false; this.question = 0; this.reponses = {}; }
    this.aide = false;
    // 2.41.7 (demande : « pourquoi ça laisse ça ouvert ») : « Toutes les recettes » et la liste des aliments de « Manger »
    // se replient en quittant l'écran.
    this.recettesOuvertes = false;
    this.alimentsOuverts = false;
    this.haut = false;   // 2.38.21 : l'en-tête de séance replié
    this.liste = false;
    this.confirmerLe = 0;
    this.annulerLe = 0;
    this.effacer = false;   // (check-up 2.38.64) « Réinitialiser » désarmé en quittant l'écran
    this.saisieMesures = null;   // (check-up 2.38.64) la saisie des mesures ne survit pas à un changement d'écran
    // 2.38.90 (demande : vérifier si on est à jour à chaque fois qu'on est sur l'accueil) : la version publiée est relue en
    // arrivant sur l'accueil (une petite demande ; une minute d'écart au moins, SallePlugin.verifierVersion).
    if (ecran === 'accueil' && this.plugin && typeof this.plugin.verifierVersion === 'function') this.plugin.verifierVersion(true);
    // En entrant dans la séance (pas en y restant) : l'écran de séance décide où reprendre (l'échauffement pas fait, par exemple).
    if (ecran === 'seance' && this.ecran !== 'seance') {
      if (typeof this.entrerSeance === 'function') this.entrerSeance();
      else this.reprendreEchauffement();
    }
    // 2.38.13 : la séance descend du haut en y entrant, remonte en la quittant.
    const sens = ecran === 'seance' && this.ecran !== 'seance' ? 'descend' : this.ecran === 'seance' && ecran !== 'seance' ? 'remonte' : null;
    this.ecran = ecran;
    this.transition(() => {
      this.rendre();
      this.allerCarte();   // en haut de l'écran ; en séance, la carte de l'exercice (2.38.12)
    }, sens);
  }
  // Repli si l'écran de séance n'a pas d'entrerSeance (gardé, testé) : on reprend à l'échauffement pas fait.
  reprendreEchauffement() {
    const sc = this.plugin.donnees.enCours;
    if (!sc || !Array.isArray(sc.exos)) return;
    const k = sc.exos.findIndex((x) => x && x.echauffement && Array.isArray(x.faites) && !x.faites.length);
    if (k >= 0) { sc.courant = k; this.saisie = null; }
  }
  // View Transitions (iOS 18, Chrome 111) : un fondu de 180 ms (styles.css). Rien si l'API manque, si l'appareil demande
  // moins de mouvement, ou si la page est cachée : le dessin se fait alors tout de suite.
  transitionPermise() {
    try {
      const d = typeof document !== 'undefined' ? document : null;
      if (!d || typeof d.startViewTransition !== 'function' || d.visibilityState === 'hidden') return false;
      const moins = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return !moins;
    } catch (e) {
      return false;
    }
  }
  // sens (2.38.13, demande : la séance apparaît comme le centre de notifications d'Apple, avec un flou derrière) : 'descend'
  // (la séance arrive du haut, l'écran d'avant se floute) ou 'remonte' (elle repart vers le haut) ; une classe sur <html>
  // le temps de la transition choisit l'animation (10-base.css). Sans sens : le fondu habituel.
  transition(dessiner, sens) {
    if (!this.transitionPermise()) { dessiner(); return; }
    const html = typeof document !== 'undefined' ? document.documentElement : null;
    const classe = sens && html && html.classList ? 'salle-vt-' + sens : '';
    if (classe) html.classList.add(classe);
    const fin = () => { if (classe) html.classList.remove(classe); };
    let fait = false;
    const une = () => { if (!fait) { fait = true; dessiner(); } };
    try {
      const t = document.startViewTransition(une);
      // Deux changements d'écran rapides : la première transition est sautée (le dessin se fait quand même) et ses promesses
      // échouent. Rien à signaler : on les rattrape.
      for (const k of ['ready', 'updateCallbackDone']) if (t && t[k] && typeof t[k].catch === 'function') t[k].catch(() => {});
      if (t && t.finished && typeof t.finished.then === 'function') t.finished.then(fin, fin);
      else fin();
    } catch (e) {
      une();
      fin();
    }
  }
  donneesChangees() {
    if (['seance', 'questions', 'mesures', 'avant', 'diagnostic'].indexOf(this.ecran) < 0) this.rendre();
  }
  aujourdhui() { return L.dateISO(new Date()); }
  rendre() {
    this.arreterHorloge();
    const r = this.contentEl;
    vider(r);
    const d = this.plugin.donnees;
    try {
      // Les calculs sur les séances sont gardés le temps de ce dessin (L.pendantDessin) : les notes ne changent pas pendant.
      L.pendantDessin(() => this.dessinerEcran(r, d));
    } catch (e) {
      // Une erreur d'affichage ne doit jamais laisser un écran blanc.
      vider(r);
      r.appendChild(h('div', { cls: 'salle-carte salle-alerte' }, h('strong', { text: 'Le plugin a rencontré une erreur.' }),
        h('p', { text: String((e && e.message) || e) }),
        h('button', { cls: 'salle-bouton', text: 'Revenir à l\'accueil', icone: 'accueil', onclick: () => { this.ecran = 'accueil'; this.rendre(); } })));
      signalerErreur(e);
    }
    r.appendChild(h('div', { cls: 'salle-fin' }));   // sur iPhone : de la place sous le dernier bouton, pour passer au-dessus de la barre d'Obsidian
    this.barreSeance = this.ecran === 'seance' && !!d.enCours;
    // 2.38.5 (demande : une bande noire en haut pendant la séance) : la barre d'Obsidian cachée, son en-tête l'est aussi, mais
    // Obsidian garde sa place au-dessus de la vue (--view-top-spacing). Pendant une séance ou en plein écran : plus que la
    // place de l'encoche (63-seance.css, .salle-sans-barre).
    const cont = this.containerEl;
    // 2.38.58 (demande : dès l'arrivée dans le plugin, être en plein écran) : sur tous les écrans, plus seulement en séance.
    if (cont && cont.classList) cont.classList.add('salle-sans-barre');
    // 2.38.20 (demande : le bloc des séries immobile, la barre du haut aussi) : pendant une séance, la page ne défile plus.
    if (r.classList) r.classList[this.barreSeance ? 'add' : 'remove']('salle-seance-fixe');
    // 2.38.72 (demande : le défilement est moins fluide sur le téléphone que sur le Mac, et glisser vers le bas tarde) : sur
    // téléphone, Obsidian examine chaque toucher pour ses propres gestes (volets, tirer vers le bas) : à chaque début de geste
    // il mesure tous les blocs autour du doigt et, tant qu'il n'a pas décidé, le téléphone attend avant de faire défiler.
    // Pendant la séance (« La séance », l'aide, l'en-tête : les gestes sont ceux du plugin), il ignore l'écran
    // (data-ignore-swipe, la marque qu'Obsidian 1.15 lit lui-même). Ailleurs, ses gestes restent (le volet des fichiers).
    if (r.dataset) { if (this.barreSeance) r.dataset.ignoreSwipe = 'true'; else delete r.dataset.ignoreSwipe; }
    this.dernierY = this.contentEl.scrollTop;
    this.plugin.majBarre();
    this.garderAllume(this.ecran === 'seance' && !!d.enCours);
    if (typeof this.ajusterCarte === 'function') this.ajusterCarte();   // 2.38.26 : la carte de séance tient à l'écran, sans défiler
  }

  // L'écran demandé, dans r (vidé). Un écran inconnu, ou sans ce qu'il lui faut, donne l'accueil.
  dessinerEcran(r, d) {
    if (this.ecran === 'questions') this.ecranQuestions(r);
    else if (this.ecran === 'avant') this.ecranAvant(r);
    else if (this.ecran === 'resume') this.ecranResume(r);
    else if (this.ecran === 'seance' && d.enCours) this.ecranSeance(r);
    else if (this.ecran === 'bilan' && this.bilan) this.ecranBilan(r);
    else if (this.ecran === 'progres') this.ecranProgres(r);
    else if (this.ecran === 'mesures') this.ecranMesures(r);
    else if (this.ecran === 'guide') this.ecranGuide(r);
    else if (this.ecran === 'seances') this.ecranSeances(r);
    else if (this.ecran === 'note' && this.noteType) this.ecranNote(r);
    else if (this.ecran === 'diagnostic' && d.reglages) this.ecranDiagnostic(r);
    else { this.ecran = 'accueil'; this.ecranAccueil(r); }
  }

  // ── Écran allumé, barre d'Obsidian, plein écran ──
  // Pendant une séance, l'écran ne se met pas en veille (le chrono du repos reste visible). Sans effet si l'appareil ne sait
  // pas faire, ou si « Tester cet appareil » a dit que ça ne marche pas. iOS relâche le verrou dès que la page est cachée
  // (Raccourcis, Deezer, écran verrouillé) : le plugin le redemande au retour (visibilitychange, SallePlugin.surVisibilite).
  async garderAllume(oui) {
    this.allumeVoulu = !!oui;
    try {
      if (oui) {
        const p = this.plugin;
        const refuse = p && typeof p.peut === 'function' && p.peut('ecran') === false;
        const cache = typeof document !== 'undefined' && document.visibilityState === 'hidden';
        const wl = typeof navigator !== 'undefined' && navigator.wakeLock;
        if (this.verrou || this.demandeVerrou || refuse || cache || !wl || typeof wl.request !== 'function') return;
        this.demandeVerrou = true;
        let v = null;
        try { v = await wl.request('screen'); } finally { this.demandeVerrou = false; }
        if (!v) return;
        if (!this.allumeVoulu) { try { await v.release(); } catch (e) { /* déjà relâché */ } return; }   // la séance a fini pendant la demande
        if (typeof v.addEventListener === 'function') v.addEventListener('release', () => { if (this.verrou === v) this.verrou = null; });
        this.verrou = v;
      } else if (this.verrou) {
        const v = this.verrou;
        this.verrou = null;
        await v.release();
      }
    } catch (e) {
      this.verrou = null;
    }
  }
  // 2.38.77 (demande : la barre du bas a tendance à revenir, la bloquer) : elle ne revient plus en remontant ; défiler la
  // garde cachée (pour sortir du plugin : le bouton du volet, en haut à gauche de l'accueil).
  surDefilement() {
    const y = this.contentEl.scrollTop, d = y - (this.dernierY || 0);
    if (Math.abs(d) < 10) return;
    this.dernierY = y;
    if (!this.plugin.barreCachee || !this.plugin.barreCachee()) this.plugin.cacherBarre(true);
  }
  // 2.38.58 : plus de bouton « Plein écran » : le plugin l'est dès l'arrivée (2.38.77 : la barre ne revient plus du tout).
  // 2.38.66 : le volet de gauche d'Obsidian (les fichiers), ouvert ou fermé ; sans lui, la commande d'Obsidian.
  ouvrirVolet() {
    try {
      const app = this.app || (this.plugin && this.plugin.app);
      const g = app && app.workspace ? app.workspace.leftSplit : null;
      if (g && typeof g.toggle === 'function') { g.toggle(); return; }
      if (g && typeof g.expand === 'function') { g.expand(); return; }
      if (app && app.commands && typeof app.commands.executeCommandById === 'function') app.commands.executeCommandById('app:toggle-left-sidebar');
    } catch (e) { console.error('Salle :', e); }
  }

  // Les réglages, au premier onglet et sans réponse en cours (accueil, Séances, Tester cet appareil).
  ouvrirReglages() {
    this.question = 0;
    this.reponses = {};
    this.aller('questions');
  }

  // ── Morceaux partagés par les écrans ──
  // L'en-tête d'un écran. retour : true = bouton « Accueil » ; ou { texte, faire } pour un autre retour (« Réglages »).
  entete(r, titre, retour, ic) {
    const bouton = !retour ? null : retour === true
      ? h('button', { cls: 'salle-retour', text: 'Accueil', icone: 'retour', onclick: () => this.aller('accueil') })
      : h('button', { cls: 'salle-retour', text: retour.texte || 'Retour', icone: 'retour', onclick: () => retour.faire() });
    r.appendChild(h('div', { cls: 'salle-entete' }, bouton, h('h2', { text: titre, icone: ic })));
  }
  // Le compteur − / + d'un nombre (charge, répétitions, minutes, niveau du vélo), utilisé par plusieurs écrans.
  compteur(valeur, pas, unite, decimal, surChange) {
    const champ = h('input', { type: 'number', inputmode: decimal ? 'decimal' : 'numeric', step: 'any', min: '0', cls: 'salle-champ salle-nombre', value: valeur == null ? '' : String(valeur) });
    champ.addEventListener('input', () => surChange(L.nombre(champ.value)));
    const bouger = (sens) => {
      const v = Math.max(0, Math.round(((L.nombre(champ.value) || 0) + sens * pas) * 100) / 100);
      champ.value = String(v);
      surChange(v);
    };
    return h('div', { cls: 'salle-compteur' },
      h('button', { cls: 'salle-bouton salle-pm', icone: 'moins', 'aria-label': 'moins', onclick: () => bouger(-1) }, h('span', { cls: 'salle-repli', text: '−' })),
      champ, h('span', { cls: 'salle-unite', text: unite }),
      h('button', { cls: 'salle-bouton salle-pm', icone: 'plus', 'aria-label': 'plus', onclick: () => bouger(1) }, h('span', { cls: 'salle-repli', text: '+' })));
  }
  // Une consigne verte : une information utile dans sa bulle, toujours affichée. 2.13.1 (demande : les consignes utiles restent affichées, la bulle ne gêne pas) : plus de « vue une fois », plus de bouton « Compris ».
  // texte = une phrase courte (texteCourt), ou des puces d'une ligne, le mot clé en gras (un tableau).
  consigne(texte) {
    return h('div', { cls: 'salle-carte salle-consigne' }, Array.isArray(texte) ? texteListe(texte) : texteCourt(texte));
  }

}
