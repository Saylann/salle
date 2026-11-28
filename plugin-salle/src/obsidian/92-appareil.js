// SallePlugin, l'appareil : l'écran allumé, le bip, la vibration, le minuteur de l'iPhone, Obsidian autour de la vue (barre du
// bas, plein écran, lecture seule, glissements, thème), « Tester cet appareil ».

// La dernière version publiée est relue à ce rythme tant qu'Obsidian reste ouvert (2.38.85 : 6 h ; 2.38.88 : 1 h), et au
// retour dans l'appli ou en arrivant sur l'accueil (2.38.90), pas plus souvent que VERSION_ECART_MS (10 min, puis 1 min).
const VERSION_REVOIR_MS = 60 * MS_MINUTE;
const VERSION_ECART_MS = MS_MINUTE;
// Un lien de « Tester cet appareil » qui revient après ce délai est un vieux lien : il est ignoré.
const TEST_LIEN_MS = 10 * MS_MINUTE;

Object.assign(SallePlugin.prototype, {
  // ── Écran allumé, bip, vibration, minuteur de l'iPhone ──
  // Au retour dans Obsidian : le verrou de l'écran a été relâché par iOS, on le redemande pendant une séance.
  surVisibilite() {
    const visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    const t = this.testEnCours;
    if (!visible) {
      if (t) t.parti = true;   // le lien a bien ouvert une autre app (Raccourcis)
      return;
    }
    // 2.38.88 : au retour dans l'appli (l'iPhone ne relance pas le plugin), la version publiée est relue (1 min d'écart au moins).
    if (typeof this.verifierVersion === 'function') this.verifierVersion(true);
    // Au retour dans l'appli, Obsidian a pu remettre sa barre.
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') window.setTimeout(() => this.garderBarre(), 300);
    for (const v of this.vues()) {
      if (v.verrou && v.verrou.released) v.verrou = null;
      v.garderAllume(v.ecran === 'seance' && !!this.donnees.enCours);
    }
    // Le test du raccourci : revenu dans Obsidian sans réponse du raccourci → il n'a pas marché.
    if (t && t.cle === 'shortcuts' && t.parti) plusTard(() => { if (this.testEnCours === t) this.retourTest('raccourci-erreur'); }, 2500);
  },
  // Le résultat de « Tester cet appareil » sur cet appareil : true, false ou null (pas testé).
  peut(cle) {
    return L.resultatAppareil(this.donnees && this.donnees.reglages, L.cleAppareil(this.mobile()), cle);
  },

  // Le contexte Web Audio, créé une fois. Avant lui, la session audio passe en « ambient » (iOS 17+) : le bip se mélange à la
  // musique (Deezer continue) et se tait en mode silencieux.
  contexteAudio() {
    if (this.audio && this.audio.state !== 'closed') return this.audio;
    const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (typeof AC !== 'function') return null;
    const s = typeof navigator !== 'undefined' ? navigator.audioSession : null;
    if (s && s.type !== 'ambient') { try { s.type = 'ambient'; } catch (e) { /* ancien iOS */ } }
    try { this.audio = new AC(); } catch (e) { this.audio = null; }
    return this.audio;
  },
  // À appeler dans le gestionnaire d'un toucher : iOS ne laisse sonner Web Audio qu'après un geste.
  // force : pour le test, même si le son est coupé.
  preparerSon(force) {
    try {
      const reg = this.donnees.reglages;
      if (!force && ((reg && reg.son === false) || this.peut('son') === false)) return false;
      const ctx = this.contexteAudio();
      if (!ctx) return false;
      if (ctx.state !== 'running' && typeof ctx.resume === 'function') { this.repriseAudio = Date.now(); ctx.resume().catch(() => {}); }
      if (!this.audioDebloque && typeof ctx.createBuffer === 'function') {
        const src = ctx.createBufferSource();   // un son vide joué pendant le toucher : iOS débloque le contexte
        src.buffer = ctx.createBuffer(1, 1, 22050);
        src.connect(ctx.destination);
        src.start(0);
        this.audioDebloque = true;
      }
      return true;
    } catch (e) {
      return false;
    }
  },
  // n bips courts (le dernier plus aigu). Rien si le son est coupé dans les réglages, si le test a dit non, si l'app est cachée
  // ou si Web Audio manque. Rend true si les bips sont partis.
  bip(n = 1) {
    const reg = this.donnees.reglages;
    if ((reg && reg.son === false) || this.peut('son') === false) return false;
    return this.jouerBip(n);
  },
  jouerBip(n = 1) {
    try {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
      const ctx = this.contexteAudio();
      if (!ctx || typeof ctx.createOscillator !== 'function') return false;
      // Contexte en pause (pas de toucher récent, ou iOS l'a interrompu) : on ne programme rien, sinon le bip sonnerait en
      // retard, au toucher suivant. Juste après preparerSon (dans le même toucher), la reprise est en route : on joue.
      if (ctx.state !== 'running' && !(this.repriseAudio && Date.now() - this.repriseAudio < 1500)) {
        if (typeof ctx.resume === 'function') ctx.resume().catch(() => {});
        return false;
      }
      const fois = Math.max(1, Math.min(5, Math.round(n) || 1)), t0 = ctx.currentTime + 0.03;
      for (let k = 0; k < fois; k++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + k * 0.28;
        o.type = 'sine';
        o.frequency.value = k === fois - 1 && fois > 1 ? 1320 : 880;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.18);
      }
      return true;
    } catch (e) {
      return false;
    }
  },
  // L'interrupteur iOS 18 caché : basculé par un vrai toucher sur son <label>, il fait vibrer l'iPhone. Ailleurs : sans effet.
  vibreur() {
    const reg = this.donnees.reglages;
    if ((reg && reg.vibration === false) || this.peut('vibration') === false) return null;
    return this.creerVibreur();
  },
  creerVibreur() {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
    return h('input', { type: 'checkbox', switch: true, cls: 'salle-vibre', tabindex: '-1', 'aria-hidden': 'true' });
  },
  // Lance le minuteur de l'iPhone par le raccourci « Repos salle », puis revient dans Obsidian. iPhone seulement, si activé,
  // et pas si « Tester cet appareil » a vu que le raccourci ne répond pas. Appelée avant tout await (sinon iOS refuse).
  chronoIphone(secondes) {
    const reg = this.donnees.reglages;
    if (!reg || !reg.chronoIphone || !this.mobile() || !(secondes > 0) || this.peut('shortcuts') === false) return false;
    try { window.open(L.urlChrono(secondes, this.app.vault.getName())); } catch (e) { console.error('Salle :', e); return false; }
    return true;
  },

  // ── Obsidian autour de la vue : barre du bas, plein écran, lecture seule, glissements, thème ──
  // Cache ou remet la barre du bas et l'en-tête d'Obsidian sur iPhone, par la fonction d'Obsidian lui-même
  // (app.mobileNavbar.hideNavigation / restoreNavigation, classe « is-hidden-nav »). Sans effet sur Mac.
  cacherBarre(oui) {
    try {
      if (!this.mobile()) return;
      const nav = this.app.mobileNavbar;
      if (oui) {
        if (nav && typeof nav.hideNavigation === 'function') nav.hideNavigation();
        else document.body.classList.add('is-hidden-nav');
      } else if (nav && typeof nav.restoreNavigation === 'function') nav.restoreNavigation(true);
      else document.body.classList.remove('is-hidden-nav');
    } catch (e) {
      try { document.body.classList.remove('is-hidden-nav'); } catch (f) { /* rien */ }
    }
  },
  // 2.38.3 (demande : la barre d'Obsidian revenait pendant le repos, en pleine séance) : Obsidian remet sa barre au moindre
  // toucher hors de la vue (son écouteur « mousedown » sur la fenêtre), à l'ouverture d'un panneau, au retour dans l'appli.
  // Pendant une séance ou en plein écran, elle est recachée juste après ce toucher (même écouteur, enregistré après le sien),
  // au retour dans l'appli, et vérifiée à chaque tour de l'horloge (LECTURE_SEULE_MS).
  // 2.38.57 (demande : la barre du bas ne doit pas être là en permanence, seulement quand je remonte) : sur tous les écrans du
  // plugin, elle est recachée, sauf si on vient de la faire revenir (en remontant la page : barreVue) ; un toucher tout en
  // haut de l'écran (là où Obsidian la fait revenir) la laisse revenir aussi, hors séance.
  garderBarre(ev) {
    try {
      if (!this.mobile()) return;
      const actif = this.app.workspace.activeLeaf;
      const v = this.vues().find((x) => x.leaf === actif);
      if (!v) return;
      // 2.38.77 (demande : la barre du bas a tendance à revenir, la bloquer) : sur tous les écrans du plugin, toujours recachée
      // (plus d'exception en remontant, ni pour un toucher tout en haut).
      if (this.barreCachee()) return;
      this.cacherBarre(true);
    } catch (e) { /* rien : au pire la barre reste */ }
  },
  // La barre est-elle cachée ? (la classe qu'Obsidian pose lui-même, hideNavigation)
  barreCachee() {
    try { return document.body.classList.contains('is-hidden-nav'); } catch (e) { return false; }
  },
  // La barre est cachée si l'écran du plugin est devant ET qu'une séance est ouverte ou (2.38.57) qu'on ne vient pas de la
  // faire revenir en remontant la page.
  majBarre() {
    try {
      if (!this.mobile()) return;
      const actif = this.app.workspace.activeLeaf;
      const v = this.vues().find((x) => x.leaf === actif);
      this.cacherBarre(!!v);   // 2.38.77 : cachée dès que l'écran du plugin est devant
    } catch (e) {
      console.error('Salle :', e);
    }
  },
  // Dans les notes aussi, la barre se cache quand on descend : c'est le réglage « plein écran automatique » d'Obsidian,
  // posé une fois par appareil (l'utilisateur peut le recouper dans les réglages d'Obsidian).
  pleinEcranDesNotes() {
    try {
      const v = this.app.vault;
      if (!this.mobile() || typeof v.setConfig !== 'function' || window.localStorage.getItem('salle-plein-ecran')) return;
      v.setConfig('autoFullScreen', true);
      window.localStorage.setItem('salle-plein-ecran', '1');
    } catch (e) {
      console.error('Salle :', e);
    }
  },
  // Une fois par appareil (comme le coffre de révision) : les notes s'ouvrent en lecture, sans titre en double
  // ni bloc « Properties » (la ligne « salle: … » reste cachée). Réglages d'Obsidian, posés par setConfig.
  async appliquerLecture() {
    const v = this.app.vault;
    let deja = false;
    try { deja = !!window.localStorage.getItem('salle-lecture'); } catch (e) { deja = false; }
    if (deja || typeof v.setConfig !== 'function') return;
    try {
      v.setConfig('defaultViewMode', 'preview');
      v.setConfig('showInlineTitle', false);
      v.setConfig('propertiesInDocument', 'hidden');
      for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
        const e = leaf.getViewState();
        if (e && e.state && e.state.mode !== 'preview') { e.state.mode = 'preview'; await leaf.setViewState(e); }
      }
      window.localStorage.setItem('salle-lecture', '1');
    } catch (e) {
      console.error('Salle : mode lecture', e);
    }
  },
  // Lecture seule (réglage, allumé par défaut) : une note qui passe en édition repasse en lecture dans la seconde.
  // Les cases à cocher marchent toujours. Exception : EDITION_PERMISE_MIN minutes après « Modifier la note ».
  lectureSeule() {
    try {
      const reg = this.donnees.reglages;
      if ((reg && reg.lectureSeule === false) || (this.editionPermise && Date.now() < this.editionPermise)) return;
      for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
        const etat = leaf.getViewState();
        if (etat && etat.state && etat.state.mode === 'source') {
          etat.state.mode = 'preview';
          leaf.setViewState(etat);
        }
      }
    } catch (e) {
      console.error('Salle :', e);
    }
  },
  // Sur iPhone, dans toute la zone principale (l'app ET les notes ouvertes), un glissement du doigt n'ouvre plus les panneaux
  // d'Obsidian. Posé sur la zone elle-même, pas sur un écran : ça tient quand un écran est recréé. Revérifié à chaque
  // changement de disposition, au cas où Obsidian reconstruit la zone.
  sansGlissement() {
    try {
      const racine = this.app.workspace.rootSplit;
      const zone = this.mobile() && racine && racine.containerEl;
      if (!zone || this.zoneSansGlisser === zone) return;
      this.zoneSansGlisser = zone;
      for (const evt of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
        this.registerDomEvent(zone, evt, (ev) => ev.stopPropagation(), { passive: true });
      }
    } catch (e) {
      console.error('Salle :', e);
    }
  },
  // Chaque note ouverte reçoit, dans son en-tête, un bouton haltère qui ramène à l'accueil du plugin.
  boutonsAccueil() {
    try {
      for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
        const v = leaf.view;
        if (v && !v.salleAccueil && typeof v.addAction === 'function') v.salleAccueil = v.addAction(ICONES.salle, 'Accueil Salle', () => this.ouvrir());
      }
    } catch (e) {
      console.error('Salle :', e);
    }
  },
  // Mode sombre ou clair d'Obsidian : par ses propres commandes, sinon par ses réglages.
  basculerTheme(sombre) {
    const a = this.app;
    try {
      if (a.commands && a.commands.executeCommandById && a.commands.executeCommandById(sombre ? 'theme:use-dark' : 'theme:use-light')) return true;
      if (typeof a.setTheme === 'function') a.setTheme(sombre ? 'obsidian' : 'moonstone');
      if (a.vault && typeof a.vault.setConfig === 'function') a.vault.setConfig('theme', sombre ? 'obsidian' : 'moonstone');
      return true;
    } catch (e) {
      console.error('Salle :', e);
      new obsidian.Notice('Impossible de changer le mode ici : Settings → Appearance → Base color scheme.');
      return false;
    }
  },

  // ── Tester cet appareil ──
  // La partie calculable : l'écran allumé (une vraie demande), et ce qui manque à coup sûr (pas de Web Audio, pas
  // d'interrupteur qui vibre, pas de Raccourcis sur le Mac). Le reste se teste d'un toucher sur l'écran « Tester cet appareil ».
  async testerAppareil() {
    const r = {};
    r.ecran = await this.testerEcran();
    if (!this.contexteAudio()) r.son = false;
    if (!SallePlugin.saitVibrer()) r.vibration = false;
    await this.noterAppareil(r);
    return Object.assign({}, this.donnees.reglages ? this.donnees.reglages.appareils[L.cleAppareil(this.mobile())] : r);
  },
  async testerEcran() {
    if (this.vues().some((v) => v.verrou)) return true;   // une séance le tient déjà
    const wl = typeof navigator !== 'undefined' ? navigator.wakeLock : null;
    if (!wl || typeof wl.request !== 'function') return false;
    try {
      const v = await wl.request('screen');
      try { await v.release(); } catch (e) { /* déjà relâché */ }
      return true;
    } catch (e) {
      return false;
    }
  },
  // Enregistre des résultats de test pour cet appareil (reglages.appareils.mobile ou .bureau), avec la date du jour.
  async noterAppareil(resultats) {
    const reg = this.donnees.reglages;
    if (!reg) return;
    reg.appareils = L.avecAppareil(reg, L.cleAppareil(this.mobile()), resultats, L.dateISO(new Date())).appareils;
    await this.sauver();
  },
  // Les tests par lien : obsidian:// (le plugin s'ouvre lui-même) et le raccourci « Repos salle ». La réponse arrive par
  // surLien (…&test=obsidian, raccourci-ok, raccourci-erreur). Sans réponse : « ne marche pas ».
  lancerTestLien(cle) {
    const coffre = this.nomCoffre();
    const url = cle === 'shortcuts' ? L.urlTestRaccourci(coffre) : L.lienSalle(coffre, 'diagnostic', { test: 'obsidian' });
    const t = { cle, depuis: Date.now() };
    this.testEnCours = t;
    try {
      window.open(url);   // tout de suite, dans le toucher : sinon iOS refuse d'ouvrir le lien
    } catch (e) {
      this.testEnCours = null;
      this.noterAppareil({ [cle]: false }).then(() => this.redessinerDiagnostic());
      return false;
    }
    // Le lien obsidian:// revient en moins d'une seconde. Pour le raccourci, on attend le retour dans Obsidian (surVisibilite) ;
    // si Raccourcis ne s'est même pas ouvert (Obsidian resté devant), c'est non.
    plusTard(() => {
      if (this.testEnCours !== t) return;
      if (cle === 'obsidian') this.retourTest('obsidian-rien');
      else if (!t.parti) this.retourTest('raccourci-erreur');
    }, cle === 'obsidian' ? 5000 : 6000);
    return true;
  },
  async retourTest(code) {
    const t = this.testEnCours;
    const cle = /^raccourci/.test(code) ? 'shortcuts' : 'obsidian';
    // Un vieux lien de test touché plus tard (pas de test en cours, ou trop ancien) : ignoré.
    if (!t || t.cle !== cle || Date.now() - t.depuis > TEST_LIEN_MS) return;
    this.testEnCours = null;
    await this.noterAppareil({ [cle]: code === 'obsidian' || code === 'raccourci-ok' });
    this.redessinerDiagnostic();
  },
  redessinerDiagnostic() {
    this.vues().forEach((v) => { if (v.ecran === 'diagnostic') v.rendre(); });
  },
  // ── La dernière version publiée (2.38.85, demande : à côté de la date, dire si on est à jour) ──
  // Le manifeste publié (L.adressesManifestePublie) → this.versionPubliee, puis l'accueil se redessine s'il a changé.
  // Hors ligne, sans dépôt ou réponse illisible : rien ne change (l'accueil ne dit rien). Jamais d'erreur levée.
  // 2.38.88 : la dernière publication d'abord, le manifeste du dépôt en secours (L.adressesManifestePublie) ; sansAttendre :
  // au retour dans l'appli ou sur l'accueil, rien si la dernière lecture date de moins d'une minute (VERSION_ECART_MS).
  async verifierVersion(sansAttendre) {
    const maint = Date.now();
    if (sansAttendre && this.versionLueA && maint - this.versionLueA < VERSION_ECART_MS) return this.versionPubliee || null;
    const urls = L.adressesManifestePublie(this.manifest && this.manifest.authorUrl);
    const f = typeof obsidian !== 'undefined' ? obsidian.requestUrl : null;
    if (!urls.length || typeof f !== 'function') return null;
    let v = null;
    for (const url of urls) {
      try {
        const rep = await f({ url, throw: false });
        const j = rep && rep.status === 200 ? JSON.parse(rep.text) : null;
        v = j && typeof j.version === 'string' && L.comparerVersions(j.version, j.version) != null ? j.version.trim() : null;
      } catch (e) { v = null; }
      if (v) break;
    }
    if (!v) return null;
    this.versionLueA = maint;
    if (v !== this.versionPubliee) {
      this.versionPubliee = v;
      this.vues().forEach((x) => { if (x.ecran === 'accueil') x.rendre(); });
    }
    return v;
  },
  // « Mettre à jour » touché : la commande de BRAT qui cherche les mises à jour (le plugin s'installe par BRAT), sinon
  // les réglages des plugins d'Obsidian.
  ouvrirMiseAJour() {
    try {
      const cmds = (this.app.commands && this.app.commands.commands) || {};
      const id = Object.keys(cmds).find((k) => /^obsidian42-brat:/.test(k) && /update/i.test(k) && /check/i.test(k));
      if (id && this.app.commands.executeCommandById(id)) return 'brat';
      if (this.app.setting) { this.app.setting.open(); this.app.setting.openTabById('community-plugins'); return 'reglages'; }
    } catch (e) { signalerErreur(e); }
    new obsidian.Notice('Mets à jour Salle dans BRAT, puis redémarre Obsidian.');
    return 'message';
  },
  // Copier un texte (le lien de la séance, pour un raccourci). Sans presse-papiers : le texte reste affiché à l'écran.
  async copier(texte, message) {
    try {
      await navigator.clipboard.writeText(texte);
      new obsidian.Notice(message || 'Copié.');
      return true;
    } catch (e) {
      new obsidian.Notice('Impossible de copier ici : recopie le lien affiché sous le bouton.');
      return false;
    }
  },
});
