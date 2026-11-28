// Un faux Obsidian, juste assez pour faire tourner le plugin « Salle » dans un navigateur (aperçu, apercu/apercu.py).
// Le coffre est en mémoire : rien n'est écrit dans les vraies notes.
// 2.0.0 : le lien obsidian://salle (registerObsidianProtocolHandler, et window.ouvrirLien('obsidian://salle?ecran=…') pour
// l'essayer), registerDomEvent sur document, addSettingTab, l'adaptateur (write : le fichier d'état pour l'iPhone, gardé en
// mémoire et visible dans window.ecritsAdaptateur), la date de modification des notes (index), Platform.isMobile (&mobile=1).
// 2.2.0 : les photos des paliers : vault.createBinary (gardée en mémoire, affichée par une adresse blob:), getResourcePath,
// et coffre.binaires (chemin → adresse d'une image) pour des photos déjà là.
window.obsidianFactice = (function () {
  class Notice {
    constructor(message) {
      const n = document.getElementById('notices');
      if (!n) return;
      n.textContent = message;
      setTimeout(() => { if (n.textContent === message) n.textContent = ''; }, 4000);
    }
  }
  class Plugin {
    constructor(app, manifest) { this.app = app; this.manifest = manifest; }
    async loadData() { return this.app._donnees; }
    async saveData(d) { this.app._donnees = JSON.parse(JSON.stringify(d)); }
    registerView(type, fabrique) { this.app._fabriques[type] = fabrique; }
    addRibbonIcon() {}
    addCommand(c) { this.app._commandes.push(c); }
    addSettingTab() {}
    registerEvent() {}
    registerInterval(id) { return id; }
    registerDomEvent(el, type, cb, opts) { el.addEventListener(type, cb, opts); }
    registerObsidianProtocolHandler(action, cb) { this.app._liens[action] = cb; }
  }
  class ItemView {
    constructor(leaf) { this.leaf = leaf; this.app = leaf.app; this.containerEl = leaf.el; this.contentEl = leaf.el; }
  }
  const Platform = { isMobile: /mobile=1/.test(location.search), isDesktop: !/mobile=1/.test(location.search) };
  function fabriquerApp(coffre, racine) {
    const fichiers = {}, dossiers = new Set(), ecouteurs = {}, ecrits = {};
    let horloge = Date.now();
    const emettre = (evt, f, ancien) => (ecouteurs[evt] || []).forEach((cb) => cb(f, ancien));
    const ajouter = (path, texte) => {
      const name = path.split('/').pop();
      fichiers[path] = { path, name, basename: name.replace(/\.md$/, ''), stat: { mtime: ++horloge, size: texte.length }, _texte: texte };
      return fichiers[path];
    };
    Object.keys(coffre.notes).forEach((p) => ajouter(p, coffre.notes[p]));
    const ajouterBinaire = (path, url) => { fichiers[path] = { path, name: path.split('/').pop(), stat: { mtime: ++horloge, size: 0 }, _url: url }; return fichiers[path]; };
    Object.keys(coffre.binaires || {}).forEach((p) => ajouterBinaire(p, coffre.binaires[p]));
    const app = { _donnees: coffre.donnees || null, _fabriques: {}, _feuilles: [], _fichiers: fichiers, _commandes: [], _liens: {}, _ecrits: ecrits };
    app.vault = {
      getMarkdownFiles: () => Object.values(fichiers).filter((f) => /\.md$/.test(f.path)),
      cachedRead: async (f) => f._texte,
      read: async (f) => f._texte,
      getAbstractFileByPath: (p) => fichiers[p] || (dossiers.has(p) ? { path: p } : null),
      create: async (p, t) => { if (fichiers[p]) throw new Error('existe déjà : ' + p); const f = ajouter(p, t); emettre('create', f); return f; },
      modify: async (f, t) => { f._texte = t; f.stat = { mtime: ++horloge, size: t.length }; emettre('modify', f); },
      createFolder: async (p) => { dossiers.add(p); },
      createBinary: async (p, d) => {
        if (fichiers[p]) throw new Error('existe déjà : ' + p);
        let url = '';
        try { url = URL.createObjectURL(new Blob([d], { type: 'image/jpeg' })); } catch (e) { url = ''; }
        const f = ajouterBinaire(p, url);
        emettre('create', f);
        return f;
      },
      getResourcePath: (f) => (f && f._url) || '',
      trash: async (f) => { delete fichiers[f.path]; emettre('delete', f); },
      getName: () => 'Coffre Aperçu',
      on: (evt, cb) => { (ecouteurs[evt] = ecouteurs[evt] || []).push(cb); return {}; },
      // Comme le vrai adaptateur : lire et savoir si un fichier existe (le plugin relit sa note « Réglages » et son brouillon).
      adapter: {
        write: async (p, t) => { ecrits[p] = t; },
        read: async (p) => { if (ecrits[p] != null) return ecrits[p]; if (!fichiers[p]) throw new Error('absent'); return fichiers[p]._texte; },
        exists: async (p) => ecrits[p] != null || !!fichiers[p],
      },
    };
    app.workspace = {
      onLayoutReady: (cb) => setTimeout(cb, 0),
      getLeavesOfType: (t) => app._feuilles.filter((l) => l.view && l.view.getViewType() === t),
      getMostRecentLeaf: () => null,
      getLeaf: () => {
        const leaf = {
          app, el: racine, view: null, getViewState: () => ({ type: leaf.view ? leaf.view.getViewType() : 'empty', state: {} }),
          setViewState: async ({ type }) => { leaf.view = app._fabriques[type](leaf); app._feuilles.push(leaf); await leaf.view.onOpen(); },
          openFile: async (f) => { new Notice('Dans Obsidian, ça ouvre la note : ' + f.path); },
        };
        return leaf;
      },
      revealLeaf: () => {},
      setActiveLeaf: () => {},
      on: () => ({}),
      activeLeaf: null,
    };
    // Essayer un lien comme si iOS l'ouvrait : window.ouvrirLien('obsidian://salle?ecran=seance').
    window.ouvrirLien = (url) => {
      const m = /^obsidian:\/\/([^?]+)\??(.*)$/.exec(url);
      if (!m || !app._liens[m[1]]) { new Notice('Lien inconnu : ' + url); return; }
      const params = { action: m[1] };
      new URLSearchParams(m[2]).forEach((v, k) => { params[k] = v; });
      app._liens[m[1]](params);
    };
    window.ecritsAdaptateur = ecrits;
    return app;
  }
  // Comme obsidian.setIcon : un <svg> dans l'élément. 2.1.0 : la vraie icône Lucide si la page a chargé lucide (aperçu,
  // window.lucide) ; sinon (pas de réseau) un cercle, pour voir la place de l'icône.
  // Les anciens noms qu'Obsidian accepte encore, et leur nom dans lucide 0.460.
  const ANCIENS = { 'more-horizontal': 'ellipsis', 'bar-chart-2': 'chart-no-axes-column', 'test-tube': 'test-tube-diagonal', 'circle-check': 'circle-check' };
  const pascal = (id) => String(id).split('-').map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join('');
  function lucideSvg(iconId) {
    const lu = typeof window !== 'undefined' ? window.lucide : null;
    if (!lu || !lu.icons || typeof lu.createElement !== 'function') return null;
    const noeud = lu.icons[pascal(iconId)] || lu.icons[pascal(ANCIENS[iconId] || '')];
    if (!noeud) return null;
    try {
      const svg = lu.createElement(noeud);
      svg.setAttribute('class', 'svg-icon lucide-' + iconId);
      return svg;
    } catch (e) { return null; }
  }
  function setIcon(parent, iconId) {
    const vraie = lucideSvg(iconId);
    if (vraie) {
      while (parent.firstChild) parent.removeChild(parent.firstChild);
      parent.appendChild(vraie);
      return;
    }
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'svg-icon lucide-' + iconId);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    const rond = document.createElementNS(ns, 'circle');
    rond.setAttribute('cx', '12'); rond.setAttribute('cy', '12'); rond.setAttribute('r', '8');
    svg.appendChild(rond);
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    parent.appendChild(svg);
  }
  return { module: { Plugin, ItemView, Notice, setIcon, Platform }, fabriquerApp };
})();
