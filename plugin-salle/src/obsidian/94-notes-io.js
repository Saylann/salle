// SallePlugin, les notes : l'index des notes en mémoire, ouvrir, écrire et supprimer des
// notes, la photo d'un palier.

Object.assign(SallePlugin.prototype, {
  // ── Les notes : un index en mémoire ──
  // Un changement dans le coffre retire la note de l'index ; peu après (250 ms, pour regrouper une rafale de changements),
  // recharger relit seulement ce qui a changé, puis les écrans se redessinent, seulement si une note du plugin a changé
  // (this.notesChangees, posé par oublierNote et lireNotes) : taper dans une autre note ne redessine rien.
  ecouter() {
    let minuteur = null;
    const changement = (f, ancien) => {
      // Le brouillon changé sur le disque (l'autre appareil, par iCloud) : la même reprise que pour data.json.
      if (f && f.path && this.cheminBrouillon && f.path.toLowerCase() === this.cheminBrouillon.toLowerCase()) { this.onExternalSettingsChange(); return; }
      if (f && f.path && !/\.md$/i.test(f.path)) return;
      if (f && f.path) this.oublierNote(f.path);
      if (typeof ancien === 'string') this.oublierNote(ancien);   // rename : (fichier, ancien chemin)
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(async () => {
        await this.recharger();
        await this.suivreReglages();
        if (this.notesChangees === false) return;
        this.notesChangees = false;
        this.vues().forEach((v) => v.donneesChangees());
      }, 250);
    };
    for (const evt of ['modify', 'create', 'delete', 'rename']) this.registerEvent(this.app.vault.on(evt, changement));
  },
  // Retire une note de l'index (elle sera relue) ; si c'était une note du plugin, les écrans auront à se redessiner.
  oublierNote(chemin) {
    const x = this.index.get(chemin);
    if (x && x.a) this.notesChangees = true;
    this.index.delete(chemin);
  },
  // Lit les notes du coffre et garde celles qui portent « salle: … » dans leur en-tête. Une note déjà dans l'index, avec la
  // même date de modification et la même taille, n'est ni relue ni réanalysée. Deux appels à la suite s'enchaînent : quand la
  // promesse se résout, plugin.etat est à jour.
  recharger() {
    const lire = () => this.lireNotes();
    const suite = (this.chargement || Promise.resolve()).then(lire, lire);
    this.chargement = suite.catch(() => {});
    return suite;
  },
  async lireNotes() {
    const v = this.app.vault;
    if (!this.index) this.index = new Map();
    const vus = new Set(), entrees = [];
    let lues = 0;
    for (const f of v.getMarkdownFiles()) {
      // Une note rangée dans un dossier d'archives (« archives », « .archives ») n'est jamais lue : une vieille copie de
      // séance ou de programme ne doit ni compter deux fois ni remplacer la vraie (15/11 : la séance du 13/11 comptait double).
      if (L.estArchive(f.path)) continue;
      vus.add(f.path);
      const st = f.stat;
      let x = this.index.get(f.path);
      if (!(x && st && x.mtime === st.mtime && x.size === st.size)) {
        let texte;
        try { texte = await v.cachedRead(f); } catch (err) { this.oublierNote(f.path); continue; }
        const a = L.analyserNote(texte);
        if (a || (x && x.a)) this.notesChangees = true;
        x = { mtime: st ? st.mtime : null, size: st ? st.size : null, texte: a ? texte : null, a };   // le texte d'une autre note n'est pas gardé
        this.index.set(f.path, x);
        lues++;
      }
      if (x.a) entrees.push({ f, texte: x.texte, a: x.a });
    }
    for (const chemin of Array.from(this.index.keys())) if (!vus.has(chemin)) this.oublierNote(chemin);
    this.etat = L.assemblerEtat(entrees, PROGRAMME_DEFAUT);
    this.lues = lues;   // combien de notes ont vraiment été relues (tests)
    return this.etat;
  },

  // ── Ouvrir, écrire, supprimer des notes ──
  async ouvrirNote(type) {
    const f = this.etat.fichiers[type];
    if (!f) { new obsidian.Notice(`Note introuvable (celle dont l'en-tête dit « salle: ${type} »).`); return; }
    // « Modifier la note » : la note s'ouvre en édition, permise pendant EDITION_PERMISE_MIN minutes malgré la lecture seule.
    this.editionPermise = Date.now() + EDITION_PERMISE_MIN * MS_MINUTE;
    await this.app.workspace.getLeaf(this.mobile() ? false : 'tab').openFile(f, { active: true, state: { mode: 'source' } });
  },
  async ouvrirChemin(chemin) {
    const f = this.app.vault.getAbstractFileByPath(chemin);
    if (!f) { new obsidian.Notice('Note introuvable.'); return; }
    await this.app.workspace.getLeaf(this.mobile() ? false : 'tab').openFile(f, { active: true, state: { mode: 'preview' } });
  },
  // Le dossier des données de l'utilisateur : celui où est déjà une de ses notes (mesures, programme, forme, salle) ; dans un
  // coffre neuf, DOSSIER_DONNEES. '' = la racine du coffre (un coffre d'avant la 2.24.0, notes à la racine).
  dossierDonnees() {
    const f = (this.etat && this.etat.fichiers) || {};
    for (const type of ['mesures', 'programme', 'forme', 'club']) {
      const x = f[type];
      if (x && typeof x.path === 'string') { const i = x.path.lastIndexOf('/'); return i >= 0 ? x.path.slice(0, i) : ''; }
    }
    return DOSSIER_DONNEES;
  },
  // « mesures » → « donnees/mesures » : le nom d'une nouvelle note dans ce dossier (créé s'il manque).
  async dansDonnees(nom) {
    const v = this.app.vault, d = this.dossierDonnees();
    if (d && !v.getAbstractFileByPath(d)) {
      try { await v.createFolder(d); } catch (e) { /* il existe déjà */ }
    }
    return (d ? d + '/' : '') + nom;
  },
  // Le dossier qui existe déjà à cet endroit sous ce nom écrit autrement (« Séances » pour « seances », tant que 95-noms.js
  // ne l'a pas renommé), sinon le chemin tel quel : jamais deux dossiers pour la même chose.
  memeDossier(chemin) {
    const v = this.app.vault, i = chemin.lastIndexOf('/'), nom = chemin.slice(i + 1);
    const parent = i >= 0 ? v.getAbstractFileByPath(chemin.slice(0, i)) : (typeof v.getRoot === 'function' ? v.getRoot() : null);
    const deja = parent && Array.isArray(parent.children) ? parent.children.find((x) => Array.isArray(x.children) && L.nomSimple(x.name || '') === nom) : null;
    return deja ? deja.path : chemin;
  },
  // « Réinitialiser » (2.28.0, demande : effacer tout le dossier des données, puis le recréer en entier à partir du questionnaire) : tout ce qui dépend de l'utilisateur part à la corbeille (jamais de suppression définitive), la
  // mémoire du plugin repart de zéro. Un coffre d'avant la 2.24.0 (notes à la racine) : ses notes une à une. → true si tout est parti.
  async effacerDonnees() {
    const v = this.app.vault, d = this.dossierDonnees(), cibles = [];
    const dossier = d ? v.getAbstractFileByPath(d) : null;
    if (dossier) cibles.push(dossier);
    else {
      const f = this.etat.fichiers || {};
      ['programme', 'mesures', 'forme', 'club', 'reglages'].forEach((type) => { if (f[type]) cibles.push(f[type]); });
      (this.etat.seances || []).forEach((s) => { const x = s.chemin ? v.getAbstractFileByPath(s.chemin) : null; if (x) cibles.push(x); });
    }
    try {
      for (const f of cibles) await v.trash(f, true);
    } catch (e) {
      if (typeof console !== 'undefined') console.error('Salle :', e);
      new obsidian.Notice('Impossible de tout effacer. Rien d\'autre n\'est changé.');
      await this.recharger();
      return false;
    }
    this.donnees.reglages = null;
    this.donnees.enCours = null;
    this.donnees.bilan = null;
    this.texteReglages = null;
    this.cheminReglages = null;
    this.texteBrouillon = null;
    this.cheminBrouillon = null;
    this.brouillonAMigrer = false;
    this.brouillonIllisible = false;
    this.etat.fichiers = {};
    this.etat.textes = {};
    await this.sauver();
    await this.recharger();
    return true;
  },
  // Le dossier des données au complet, à la fin du questionnaire : ce qui manque est créé, rien n'est jamais écrasé.
  // (La note « Réglages » : plugin.sauver ; la ligne du jour de « Mesures » : ajouterMesure, juste avant.)
  async creerDonnees() {
    const v = this.app.vault;
    try {
      await this.recharger();
      const f = this.etat.fichiers || {};
      const creer = async (type, nom, texte) => { if (!f[type]) await v.create(this.cheminLibre(await this.dansDonnees(nom)), texte); };
      await creer('programme', NOMS_FICHIERS.programme, PROGRAMME_DEFAUT);
      await creer('mesures', NOMS_FICHIERS.mesures, '---\nsalle: mesures\n---\n# Mesures\n');
      await creer('forme', NOMS_FICHIERS.forme, FORME_DEFAUT);
      await creer('club', NOMS_FICHIERS.club, SALLE_DEFAUT);
      const seances = this.memeDossier(await this.dansDonnees(NOMS_FICHIERS.seances));
      if (!(this.etat.seances || []).length && !v.getAbstractFileByPath(seances)) await v.createFolder(seances);
    } catch (e) {
      if (typeof console !== 'undefined') console.error('Salle :', e);
    }
    await this.recharger();
  },
  cheminLibre(base) {
    const v = this.app.vault;
    let chemin = `${base}.md`;
    for (let n = 2; v.getAbstractFileByPath(chemin) && n < 100; n++) chemin = `${base}-${n}.md`;
    return chemin;
  },
  // 2.38.80 (demande : « si je change l'ordre des exercices chez moi, ça doit aussi le faire chez lui ») : au démarrage, si
  // le programme livré a changé depuis la dernière fois sur cet appareil (son empreinte, gardée dans le navigateur
  // d'Obsidian), la note du programme le suit (L.suivreProgrammeLivre) : mêmes exercices, ses lignes dans le nouvel ordre ;
  // d'autres exercices (un programme d'une version d'avant), le programme livré, l'ancien gardé dans le dossier du plugin
  // (programme-avant.md). Une seule fois par version : un ordre changé ensuite à la main reste jusqu'à la suivante.
  // Jamais dans le coffre où le plugin est fabriqué (atelier/construire.py) : là, c'est la note qui fait le programme livré.
  // Sans mémoire possible (stockage bloqué), rien : sinon ce serait à chaque démarrage. → 'rien' | 'ordre' | 'remplace'.
  async suivreProgrammeLivre() {
    try {
      const v = this.app && this.app.vault;
      const f = this.etat && this.etat.fichiers ? this.etat.fichiers.programme : null;
      if (!v || !f || typeof v.read !== 'function' || typeof v.modify !== 'function') return 'rien';
      if (v.adapter && typeof v.adapter.exists === 'function' && await v.adapter.exists('atelier/construire.py')) return 'rien';
      const empreinte = L.empreinteTexte(PROGRAMME_DEFAUT);
      let deja;
      try { deja = window.localStorage.getItem(CLE_PROGRAMME_LIVRE); } catch (e) { return 'rien'; }
      if (deja === empreinte) return 'rien';
      const texte = await v.read(f);
      const r = L.suivreProgrammeLivre(texte, PROGRAMME_DEFAUT);
      if (r.quoi === 'remplace' && v.adapter && typeof v.adapter.write === 'function') {
        await v.adapter.write(((this.manifest && this.manifest.dir) || '.obsidian/plugins/salle') + '/programme-avant.md', texte);
      }
      if (r.quoi !== 'rien') {
        await v.modify(f, r.texte);
        await this.recharger();
        new obsidian.Notice(r.quoi === 'remplace' ? 'Ton programme suit le nouveau programme (l\'ancien est gardé).' : 'Ton programme suit le nouvel ordre des exercices.');
      }
      try { window.localStorage.setItem(CLE_PROGRAMME_LIVRE, empreinte); } catch (e) { /* rien */ }
      return r.quoi;
    } catch (e) {
      if (typeof console !== 'undefined') console.error('Salle :', e);
      return 'rien';
    }
  },
  // 2.41.15 : une note déjà remplacée par le programme livré avant la 2.41.15 avait perdu le matériel de sa salle (cran des
  // haltères, disques, étage…) : il est repris une fois de l'ancienne note gardée dans le dossier du plugin (programme-avant.md),
  // seulement là où la note dit encore ce que dit le programme livré (L.reprendreCrans). Une fois par ancienne note sur cet
  // appareil (son empreinte). → true si la note a changé.
  async reprendreCransAvant() {
    try {
      const v = this.app && this.app.vault;
      const f = this.etat && this.etat.fichiers ? this.etat.fichiers.programme : null;
      if (!v || !f || !v.adapter || typeof v.adapter.exists !== 'function' || typeof v.adapter.read !== 'function' || typeof v.modify !== 'function') return false;
      if (await v.adapter.exists('atelier/construire.py')) return false;
      const chemin = ((this.manifest && this.manifest.dir) || '.obsidian/plugins/salle') + '/programme-avant.md';
      if (!(await v.adapter.exists(chemin))) return false;
      const avant = await v.adapter.read(chemin);
      const empreinte = L.empreinteTexte(avant);
      let deja;
      try { deja = window.localStorage.getItem(CLE_CRANS_REPRIS); } catch (e) { return false; }
      if (deja === empreinte) return false;
      const texte = await v.read(f);
      const neuf = L.reprendreCrans(texte, avant, PROGRAMME_DEFAUT);
      if (neuf !== texte) {
        await v.modify(f, neuf);
        await this.recharger();
        new obsidian.Notice('Ton programme a repris le matériel de ta salle (crans des haltères, disques, étages).');
      }
      try { window.localStorage.setItem(CLE_CRANS_REPRIS, empreinte); } catch (e) { /* rien */ }
      return neuf !== texte;
    } catch (e) {
      if (typeof console !== 'undefined') console.error('Salle :', e);
      return false;
    }
  },
  async recreerProgramme() {
    const f = await this.app.vault.create(this.cheminLibre(await this.dansDonnees(NOMS_FICHIERS.programme)), PROGRAMME_DEFAUT);
    await this.recharger();
    this.vues().forEach((v) => v.rendre());
    new obsidian.Notice(`Programme recréé : « ${f.path} ».`);
  },
  async enregistrerSeance(s) {
    const v = this.app.vault;
    const der = this.etat.seances[this.etat.seances.length - 1];
    let dossier = this.memeDossier(await this.dansDonnees(NOMS_FICHIERS.seances));   // les nouvelles séances vont à côté de la dernière : si l'utilisateur les déplace, on le suit
    if (der && der.chemin) { const i = der.chemin.lastIndexOf('/'); dossier = i >= 0 ? der.chemin.slice(0, i) : ''; }
    if (dossier && !v.getAbstractFileByPath(dossier)) {
      try { await v.createFolder(dossier); } catch (e) { /* il existe déjà */ }
    }
    return v.create(this.cheminLibre((dossier ? dossier + '/' : '') + L.nomFichier(s.date, s.nom)), L.ecrireSeance(s));
  },
  async noterRessenti(chemin, valeur) {
    const v = this.app.vault, f = v.getAbstractFileByPath(chemin);
    if (!f) return;
    try { await v.modify(f, L.poserCle(await v.read(f), 'ressenti', valeur)); } catch (e) { console.error('Salle :', e); }
  },
  // Une ligne par bilan dans le carnet Forme (créé s'il manque). Refaire le bilan remplace la ligne du jour écrite par le plugin :
  // celle qui commence par « courbatures » juste après la date, ou par la forme (avant).
  async noterForme(b) {
    const v = this.app.vault, f = this.etat.fichiers.forme, ligne = L.ligneForme(b);
    const duPlugin = new RegExp(`^- ${b.date} · (courbatures|forme normale|fatigué|en forme)`);
    try {
      if (f) {
        const garde = (await v.read(f)).split(/\r?\n/).filter((l) => !duPlugin.test(l.trim()));
        await v.modify(f, garde.join('\n').replace(/\s*$/, '') + '\n' + ligne + '\n');
      } else {
        await v.create(this.cheminLibre(await this.dansDonnees(NOMS_FICHIERS.forme)), FORME_DEFAUT + ligne + '\n');
      }
    } catch (e) {
      console.error('Salle :', e);
      new obsidian.Notice('Impossible d\'écrire dans le carnet Forme. Ton bilan est gardé pour aujourd\'hui.');
    }
    await this.recharger();
  },
  async ajouterMesure(m) {
    const v = this.app.vault, f = this.etat.fichiers.mesures;
    try {
      if (f) await v.modify(f, (await v.read(f)).replace(/\s*$/, '') + '\n' + L.ligneMesure(m) + '\n');
      else await v.create(this.cheminLibre(await this.dansDonnees(NOMS_FICHIERS.mesures)), `---\nsalle: mesures\n---\n# Mesures\n\n${L.ligneMesure(m)}\n`);
    } catch (e) {
      console.error('Salle :', e);
      new obsidian.Notice('Impossible d\'écrire la mesure.');
    }
    await this.recharger();
  },
  // ── La photo d'un palier ──
  // L'appareil peut-il prendre et garder une photo ? Un champ « fichier » dans la page et l'écriture d'un fichier binaire dans
  // le coffre (vault.createBinary). Sinon l'écran Mesures le dit en une ligne : la mesure suffit.
  peutPhoto() {
    try {
      if (typeof this.app.vault.createBinary !== 'function' || typeof document === 'undefined') return false;
      const i = document.createElement('input');
      i.setAttribute('type', 'file');
      return i.type === 'file' && !i.disabled;
    } catch (e) { return false; }
  },
  // Enregistre la photo (ArrayBuffer, en JPEG) dans le sous-dossier « photos » de la note « salle: mesures » (créé s'il
  // manque ; la note aussi, comme ajouterMesure), sous « AAAA-MM-JJ-palier.jpg » (« -2 », « -3 »… si le nom est pris : rien
  // n'est écrasé), puis lie la photo à la ligne du jour de la note (L.lierPhotoMesure). → le chemin, ou null (un message dit
  // pourquoi ; rien d'autre ne casse).
  async ajouterPhoto(donnees, date) {
    const v = this.app.vault;
    const jour = L.deISO(date) ? date : L.dateISO(new Date());
    if (!donnees || typeof v.createBinary !== 'function') {
      new obsidian.Notice('Photo impossible sur cet appareil : la mesure suffit.');
      return null;
    }
    let chemin = null;
    try {
      let f = this.etat.fichiers.mesures;
      if (!f) f = await v.create(this.cheminLibre(await this.dansDonnees(NOMS_FICHIERS.mesures)), '---\nsalle: mesures\n---\n# Mesures\n');
      const parent = f.parent && typeof f.parent.path === 'string' ? f.parent.path : String(f.path).split('/').slice(0, -1).join('/');
      const dossier = this.memeDossier((parent && parent !== '/' ? parent + '/' : '') + NOMS_FICHIERS.photos);
      if (!v.getAbstractFileByPath(dossier)) await v.createFolder(dossier);
      chemin = `${dossier}/${jour}-palier.jpg`;
      for (let n = 2; v.getAbstractFileByPath(chemin) && n < 100; n++) chemin = `${dossier}/${jour}-palier-${n}.jpg`;
      await v.createBinary(chemin, donnees);
      await v.modify(f, L.lierPhotoMesure(await v.read(f), jour, chemin));
    } catch (e) {
      console.error('Salle :', e);
      new obsidian.Notice(chemin && v.getAbstractFileByPath(chemin) ? `Photo enregistrée (${chemin}), mais pas liée à la note Mesures.` : 'Impossible d\'enregistrer la photo. La mesure suffit.');
      chemin = null;
    }
    await this.recharger();
    return chemin;
  },
  // L'adresse d'une photo de la note Mesures pour une <img> : le lien tel qu'il est écrit (chemin complet, ou nom seul si
  // l'utilisateur l'a écrit à la main) → l'adresse du fichier, ou null s'il n'existe pas.
  urlPhoto(lien) {
    try {
      const v = this.app.vault, note = this.etat.fichiers.mesures;
      let f = v.getAbstractFileByPath(lien);
      const mc = this.app.metadataCache;
      if (!f && mc && typeof mc.getFirstLinkpathDest === 'function') f = mc.getFirstLinkpathDest(lien, note ? note.path : '');
      // Un lien écrit avant que le dossier change de nom (2.38.0) : la photo du même nom, dans le dossier des photos d'aujourd'hui.
      if (!f && note) {
        const i = note.path.lastIndexOf('/');
        f = v.getAbstractFileByPath(this.memeDossier((i >= 0 ? note.path.slice(0, i + 1) : '') + NOMS_FICHIERS.photos) + '/' + String(lien).split('/').pop());
      }
      return f && typeof v.getResourcePath === 'function' ? v.getResourcePath(f) : null;
    } catch (e) { return null; }
  },
  // Jamais de suppression définitive : la note part dans la corbeille du système (ou .trash du coffre).
  async supprimerSeance(chemin) {
    const v = this.app.vault, f = v.getAbstractFileByPath(chemin);
    if (!f) return;
    try {
      await v.trash(f, true);
      new obsidian.Notice('Séance mise à la corbeille.');
    } catch (e) {
      console.error('Salle :', e);
      new obsidian.Notice('Impossible de supprimer cette séance.');
    }
    await this.recharger();
  },
});
