// Les noms des fichiers de données (2.38.0) : minuscules, sans accent ni espace (L.nomSimple), et les noms d'avant renommés
// tout seuls au démarrage (95-noms.js). Ce qu'on vérifie : rien n'est créé, copié ni écrasé ; un nom choisi par
// l'utilisateur reste ; jamais pendant une séance ; deux démarrages de suite donnent le même coffre.

// Un faux coffre avec des dossiers (parent, children), un renommage qui déplace tout le contenu, une corbeille et un journal.
// sansCasse : un disque qui ne distingue pas les majuscules (Mac) ; refusCasse : Obsidian y refuse en plus un renommage qui
// ne change que les majuscules (le plugin passe alors par un nom relais). Une valeur [texte, date] : un fichier daté.
function coffreNoms(arbre, options) {
  const o = options || {};
  const racine = { path: '/', name: '', children: [], parent: null };
  const journal = [];
  let horloge = 1000;
  const tous = () => { const out = []; const voir = (d) => d.children.forEach((x) => { out.push(x); if (x.children) voir(x); }); voir(racine); return out; };
  const trouver = (c) => tous().find((x) => x.path === c) || null;
  const meme = (a, b) => (o.sansCasse ? a.toLowerCase() === b.toLowerCase() : a === b);
  const surDisque = (c) => tous().find((x) => meme(x.path, c)) || null;
  const dossier = (c) => {
    if (!c) return racine;
    const deja = trouver(c);
    if (deja) return deja;
    const i = c.lastIndexOf('/'), parent = dossier(i >= 0 ? c.slice(0, i) : '');
    const d = { path: c, name: c.slice(i + 1), children: [], parent };
    parent.children.push(d);
    return d;
  };
  const fichier = (c, t, mtime) => {
    const i = c.lastIndexOf('/'), parent = dossier(i >= 0 ? c.slice(0, i) : '');
    const f = { path: c, name: c.slice(i + 1), parent, stat: { mtime: mtime || ++horloge, size: String(t).length }, _t: t };
    parent.children.push(f);
    return f;
  };
  Object.keys(arbre).forEach((c) => (arbre[c] == null ? dossier(c) : Array.isArray(arbre[c]) ? fichier(c, arbre[c][0], arbre[c][1]) : fichier(c, arbre[c])));
  const rechemin = (x) => { x.path = (x.parent === racine ? '' : x.parent.path + '/') + x.name; if (x.children) x.children.forEach(rechemin); };
  const vault = {
    getRoot: () => racine,
    getMarkdownFiles: () => tous().filter((x) => !x.children && /\.md$/i.test(x.path)),
    getAbstractFileByPath: (c) => trouver(c),
    getResourcePath: (f) => 'app://' + f.path,
    cachedRead: async (f) => f._t,
    read: async (f) => f._t,
    modify: async (f, t) => { f._t = t; f.stat = { mtime: ++horloge, size: t.length }; },
    create: async (c, t) => { if (surDisque(c)) throw new Error('File already exists.'); journal.push('create ' + c); return fichier(c, t); },
    createFolder: async (c) => { if (surDisque(c)) throw new Error('Folder already exists.'); journal.push('dossier ' + c); dossier(c); },
    rename: async (f, c) => {
      const autre = surDisque(c);
      if (autre && (autre !== f || o.refusCasse)) throw new Error('Destination file already exists!');
      const i = c.lastIndexOf('/'), parent = dossier(i >= 0 ? c.slice(0, i) : '');
      journal.push(`rename ${f.path} → ${c}`);
      f.parent.children.splice(f.parent.children.indexOf(f), 1);
      f.parent = parent;
      f.name = c.slice(i + 1);
      parent.children.push(f);
      rechemin(f);
    },
    trash: async (f) => { journal.push('corbeille ' + f.path); f.parent.children.splice(f.parent.children.indexOf(f), 1); },
    on: () => ({}),
    adapter: {
      read: async (c) => { const f = surDisque(c); if (!f || f.children || f._t == null) throw new Error('absent'); return f._t; },
      write: async (c, t) => { const f = surDisque(c); if (f) { f._t = t; f.stat = { mtime: ++horloge, size: t.length }; } else { journal.push('write ' + c); fichier(c, t); } },
      exists: async (c) => !!surDisque(c),
    },
  };
  return { vault, journal, chemins: () => tous().map((x) => x.path + (x.children ? '/' : '')).sort(), lire: (c) => { const f = trouver(c); return f ? f._t : null; } };
}
// Un vrai SallePlugin sur ce coffre, démarré comme dans Obsidian : onload (le fichier d'état), puis, le coffre prêt, la
// lecture des notes, les réglages, et les noms rangés. sansRanger : s'arrête juste avant.
function demarrerNoms(c, disque, sansRanger) {
  const p = Object.create(SallePlugin.prototype);
  p.app = { vault: c.vault };
  p.vues = () => [];
  p.disque = disque || null;
  p.loadData = async () => (p.disque ? JSON.parse(JSON.stringify(p.disque)) : null);
  p.saveData = async (d) => { p.disque = JSON.parse(JSON.stringify(d)); };
  p.etat = { fichiers: {}, textes: {} };
  p.donnees = L.lireDonnees(attendre(p.lireStock()), SallePlugin.verifierEnCours);
  p.base = L.empreinteDonnees(p.donnees);
  attendre(p.recharger());
  attendre(p.suivreReglages());
  p.renommes = sansRanger ? null : attendre(p.rangerNoms());
  return p;
}

{
  const nfd = (t) => t.normalize('NFD');
  egal(['Séance A', 'Ma salle (2)', nfd('Données'), '  Œuvre & cœur  ', 'DÉJÀ_vu.v2', '', null].map((n) => L.nomSimple(n)),
    ['seance-a', 'ma-salle-2', 'donnees', 'oeuvre-coeur', 'deja-vu-v2', '', ''],
    'nomSimple : minuscules, sans accent (écrit en une lettre ou en deux), des tirets à la place du reste');
  egal([L.nomFichier('2026-11-16', 'Séance A'), L.nomFichier('2026-11-16', nfd('Séance B')), L.nomFichier('2026-11-16', '///')],
    ['2026-11-16-seance-a', '2026-11-16-seance-b', '2026-11-16-seance'], 'nomFichier : la date, un tiret, le nom simplifié');

  const REG = L.fusionReglages({ niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [1, 3, 5] });
  const seance = (date, nom) => L.ecrireSeance({ nom, date, exos: [{ nom: 'Tractions', series: [{ c: 0, r: 12 }, { c: 0, r: 10 }] }] });
  const brouillon = (jour, enCours) => JSON.stringify({ enCours: enCours || null, bilan: { date: jour } }, null, 1) + '\n';
  const MESURES = '---\nsalle: mesures\n---\n# Mesures\n- 2026-11-16 · poids 70 kg\n';
  // Le coffre d'avant la 2.38.0, tel qu'il est sur un iPhone : une séance au nom écrit en deux lettres par accent (NFD).
  const ancien = (plus) => Object.assign({
    'Données/Réglages.md': L.ecrireNoteReglages(REG), 'Données/Programme.md': PROGRAMME_DEFAUT, 'Données/Mesures.md': MESURES,
    'Données/Forme.md': FORME_DEFAUT, 'Données/Ma salle.md': SALLE_DEFAUT, 'Données/Brouillon.json': brouillon('2026-11-18'),
    ['Données/Séances/' + nfd('2026-11-13 Séance B') + '.md']: seance('2026-11-13', 'Séance B'),
    'Données/Séances/2026-11-16 Séance A.md': seance('2026-11-16', 'Séance A'),
    'Mes idées.md': '# Pas une note du plugin',
  }, plus || {});
  const DISQUE = { noteReglages: 'Données/Réglages.md' };
  const RANGE = ['Mes idées.md', 'donnees/', 'donnees/brouillon.json', 'donnees/forme.md', 'donnees/ma-salle.md', 'donnees/mesures.md', 'donnees/programme.md',
    'donnees/reglages.md', 'donnees/seances/', 'donnees/seances/2026-11-13-seance-b.md', 'donnees/seances/2026-11-16-seance-a.md'];

  // 1. Un disque qui distingue les majuscules (iPhone, la plupart des Android).
  let c = coffreNoms(ancien());
  let p = demarrerNoms(c, DISQUE);
  egal([p.renommes, c.chemins(), c.journal.filter((l) => l.indexOf('rename ') !== 0)], [10, RANGE, []],
    'rangerNoms : le dossier, les 5 notes, les 2 séances, leur dossier et le brouillon reçoivent leur nom ; rien n\'est créé, copié ni jeté');
  egal([p.disque.noteReglages, p.cheminBrouillon, p.etat.fichiers.reglages.path, p.etat.seances.map((s) => s.chemin), p.donnees.reglages, p.donnees.bilan, c.lire('donnees/brouillon.json') === brouillon('2026-11-18'), c.lire('donnees/programme.md') === PROGRAMME_DEFAUT],
    ['donnees/reglages.md', 'donnees/brouillon.json', 'donnees/reglages.md', ['donnees/seances/2026-11-13-seance-b.md', 'donnees/seances/2026-11-16-seance-a.md'], REG, { date: '2026-11-18' }, true, true],
    'rangerNoms : après, le plugin suit ses fichiers à leur nouveau nom (réglages, brouillon, séances), contenu intact');
  const avant = c.journal.length;
  egal([demarrerNoms(c, p.disque).renommes, c.journal.length - avant, c.chemins()], [0, 0, RANGE], 'rangerNoms : au démarrage suivant, plus rien à faire');

  // 2. Un disque qui ne distingue pas les majuscules (Mac) : « Programme.md » → « programme.md » se fait quand même, par un nom
  //    relais si Obsidian refuse le renommage direct.
  c = coffreNoms(ancien(), { sansCasse: true });
  p = demarrerNoms(c, DISQUE);
  egal([p.renommes, c.chemins()], [10, RANGE], 'rangerNoms : sur un disque sans majuscules distinctes, le même résultat');
  c = coffreNoms(ancien(), { sansCasse: true, refusCasse: true });
  p = demarrerNoms(c, DISQUE);
  egal([c.chemins(), c.journal.filter((l) => /renommage-/.test(l)).length > 0, p.donnees.reglages], [RANGE, true, REG],
    'rangerNoms : un renommage de majuscules refusé passe par un nom relais, sans rien perdre');

  // 3. Des noms déjà corrigés à la main (sans accent, mais avec majuscules et espaces) : rangés aussi.
  c = coffreNoms({ 'Donnees/Reglages.md': L.ecrireNoteReglages(REG), 'Donnees/Programme.md': PROGRAMME_DEFAUT, 'Donnees/Mesures.md': MESURES, 'Donnees/Forme.md': FORME_DEFAUT,
    'Donnees/Ma salle.md': SALLE_DEFAUT, 'Donnees/Brouillon.json': brouillon('2026-11-18'), 'Donnees/Seances/2026-11-13 Seance B.md': seance('2026-11-13', 'Séance B'),
    'Donnees/Seances/2026-11-16 Seance A.md': seance('2026-11-16', 'Séance A'), 'Mes idées.md': '# Pas une note du plugin' });
  p = demarrerNoms(c, null);
  egal([c.chemins(), p.donnees.reglages, p.disque.noteReglages], [RANGE, REG, 'donnees/reglages.md'], 'rangerNoms : des noms corrigés à la main sont rangés pareil, sans fichier d\'état au départ');

  // 4. Ce que l'utilisateur a nommé à sa façon garde son nom ; ce que le plugin avait nommé à côté est rangé.
  c = coffreNoms({ 'Sport/Mon programme.md': PROGRAMME_DEFAUT, 'Sport/Réglages.md': L.ecrireNoteReglages(REG), 'Sport/Brouillon.json': brouillon('2026-11-18'),
    'Sport/Mes séances/2026-11-16 Jambes.md': seance('2026-11-16', 'Séance A') });
  p = demarrerNoms(c, null);
  egal(c.chemins(), ['Sport/', 'Sport/Mes séances/', 'Sport/Mes séances/2026-11-16 Jambes.md', 'Sport/Mon programme.md', 'Sport/brouillon.json', 'Sport/reglages.md'],
    'rangerNoms : un dossier, une note ou une séance nommés par l\'utilisateur gardent leur nom');

  // 5. Jamais par-dessus un autre fichier.
  c = coffreNoms(ancien({ 'Données/programme.md': '# un autre fichier' }));
  p = demarrerNoms(c, DISQUE);
  egal([c.lire('donnees/Programme.md') === PROGRAMME_DEFAUT, c.lire('donnees/programme.md'), c.chemins().length], [true, '# un autre fichier', RANGE.length + 1],
    'rangerNoms : le nom est pris par un autre fichier → la note garde le sien, rien n\'est écrasé');

  // 6. Jamais pendant une séance : rien ne bouge, et le brouillon continue de s'écrire sous son ancien nom (pas de 2e fichier).
  const EN_COURS = { nom: 'Séance A', date: '2026-11-18', exos: [{ nom: 'Tractions', series: 3, faites: [] }] };
  c = coffreNoms(ancien({ 'Données/Brouillon.json': brouillon('2026-11-18', EN_COURS) }));
  const depart = c.chemins();
  p = demarrerNoms(c, DISQUE);
  p.donnees.enCours.exos[0].faites.push({ c: 0, r: 9 });
  attendre(p.sauver());
  egal([p.renommes, c.chemins(), JSON.parse(c.lire('Données/Brouillon.json')).enCours.exos[0].faites], [0, depart, [{ c: 0, r: 9 }]],
    'rangerNoms : une séance en cours → rien n\'est renommé, et la série s\'écrit dans le brouillon d\'avant');
  // … et la séance finie, le démarrage suivant range tout.
  p.donnees.enCours = null;
  attendre(p.sauver());
  egal([demarrerNoms(c, p.disque).renommes, c.chemins()], [10, RANGE], 'rangerNoms : la séance finie, le démarrage suivant range tout');

  // 7. Deux brouillons (un appareil resté sur une version d'avant a réécrit l'ancien nom) : le plus récent est gardé.
  c = coffreNoms(ancien({ 'Données/Brouillon.json': [brouillon('2026-11-18'), 5000], 'Données/brouillon.json': [brouillon('2026-11-17'), 4000] }));
  p = demarrerNoms(c, DISQUE);
  egal([c.journal.filter((l) => /rouillon/.test(l)), c.chemins(), p.donnees.bilan], [['corbeille Données/brouillon.json', 'rename Données/Brouillon.json → Données/brouillon.json'], RANGE, { date: '2026-11-18' }],
    'rangerNoms : deux brouillons → le plus récent prend le nom, l\'autre part à la corbeille, et c\'est lui qui est relu');
  c = coffreNoms(ancien({ 'Données/Brouillon.json': [brouillon('2026-11-17'), 4000], 'Données/brouillon.json': [brouillon('2026-11-18'), 5000] }));
  p = demarrerNoms(c, DISQUE);
  egal([c.journal.filter((l) => /rouillon/.test(l)), c.chemins(), p.donnees.bilan], [['corbeille Données/Brouillon.json'], RANGE, { date: '2026-11-18' }],
    'rangerNoms : le brouillon au bon nom est le plus récent → l\'ancien part à la corbeille');

  // 8. Une photo de palier : son dossier est rangé, et le lien écrit avant dans la note Mesures la retrouve.
  c = coffreNoms(ancien({ 'Données/Photos/2026-11-16-palier.jpg': 'jpeg', 'Données/Mesures.md': MESURES.replace('poids 70 kg', 'poids 70 kg · ![[Données/Photos/2026-11-16-palier.jpg]]') }));
  p = demarrerNoms(c, DISQUE);
  egal([c.chemins().filter((x) => /hoto/.test(x)), p.urlPhoto('Données/Photos/2026-11-16-palier.jpg'), p.urlPhoto('Données/Photos/absente.jpg')],
    [['donnees/photos/', 'donnees/photos/2026-11-16-palier.jpg'], 'app://donnees/photos/2026-11-16-palier.jpg', null],
    'rangerNoms : le dossier des photos est rangé, et un lien d\'avant retrouve sa photo');

  // 9. Un coffre neuf : tout est créé aux bons noms, une 2e séance du même nom reçoit « -2 ».
  c = coffreNoms({ 'Mes idées.md': '# Pas une note du plugin' });
  p = demarrerNoms(c, null);
  p.donnees.reglages = JSON.parse(JSON.stringify(REG));
  attendre(p.sauver());
  attendre(p.creerDonnees());
  const S = { nom: 'Séance B', date: '2026-11-18', exos: [{ nom: 'Tractions', series: [{ c: 0, r: 12 }] }] };
  attendre(p.enregistrerSeance(S));
  attendre(p.recharger());
  attendre(p.enregistrerSeance(S));
  egal(c.chemins(), ['Mes idées.md', 'donnees/', 'donnees/brouillon.json', 'donnees/forme.md', 'donnees/ma-salle.md', 'donnees/mesures.md', 'donnees/programme.md', 'donnees/reglages.md',
    'donnees/seances/', 'donnees/seances/2026-11-18-seance-b-2.md', 'donnees/seances/2026-11-18-seance-b.md'],
  'coffre neuf : le dossier, les notes, le brouillon et les séances naissent avec leur nom aux conventions');
  egal([demarrerNoms(c, p.disque).renommes, c.chemins().every((x) => x === 'Mes idées.md' || !/[^a-z0-9./-]/.test(x))], [0, true], 'coffre neuf : rien à ranger, et aucun nom du plugin hors des lettres simples, chiffres, tirets et points');

  // 10. Avant d'être rangé (séance en cours au démarrage), une séance notée va dans le dossier qui existe, pas dans un 2e.
  c = coffreNoms({ 'Données/Réglages.md': L.ecrireNoteReglages(REG), 'Données/Programme.md': PROGRAMME_DEFAUT, 'Données/Séances': null });
  p = demarrerNoms(c, null, true);
  attendre(p.enregistrerSeance(S));
  egal(c.chemins().filter((x) => /ances/.test(x)), ['Données/Séances/', 'Données/Séances/2026-11-18-seance-b.md'], 'enregistrerSeance : le dossier des séances d\'avant sert tant qu\'il n\'est pas renommé (pas de 2e dossier)');

  // 11. Des notes à la racine du coffre (avant la 2.24.0) : un dossier « Photos » ou « Séances » qui n'est pas celui du plugin
  //     (ni photo de palier, ni séance dedans) garde son nom ; un dossier « Séances » vide, dans le dossier des données, est rangé.
  c = coffreNoms({ 'Réglages.md': L.ecrireNoteReglages(REG), 'Programme.md': PROGRAMME_DEFAUT, 'Mesures.md': MESURES, 'Photos/vacances.jpg': 'jpeg', 'Séances/cinéma.md': '# Pas une note du plugin' });
  p = demarrerNoms(c, null);
  egal(c.chemins(), ['Photos/', 'Photos/vacances.jpg', 'Séances/', 'Séances/cinéma.md', 'brouillon.json', 'mesures.md', 'programme.md', 'reglages.md'],
    'rangerNoms : à la racine, les notes sont rangées ; un dossier « Photos » ou « Séances » de l\'utilisateur garde son nom');
  c = coffreNoms({ 'Données/Réglages.md': L.ecrireNoteReglages(REG), 'Données/Programme.md': PROGRAMME_DEFAUT, 'Données/Séances': null });
  p = demarrerNoms(c, null);
  egal(c.chemins(), ['donnees/', 'donnees/brouillon.json', 'donnees/programme.md', 'donnees/reglages.md', 'donnees/seances/'], 'rangerNoms : le dossier des séances encore vide est rangé avec le reste');
}

// 2.38.80 : au démarrage, la note du programme suit le programme livré, une fois par version ; jamais dans le coffre de
// l'atelier ; sans mémoire possible, rien.
{
  const vieux = PROGRAMME_DEFAUT.replace(' · priorité', '').replace(/(- Tirage horizontal[^\n]*)\n(- Extension triceps[^\n]*)/, '$2\n$1');
  const avecStock = (stock, fn) => {
    const avant = window.localStorage;
    window.localStorage = stock === 'bloqué' ? { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } }
      : { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } };
    try { return fn(); } finally { if (avant === undefined) delete window.localStorage; else window.localStorage = avant; }
  };
  const lancer = (arbre, stock) => {
    const c = coffreNoms(arbre);
    const p = Object.create(SallePlugin.prototype);
    p.app = { vault: c.vault };
    p.vues = () => [];
    p.manifest = { dir: '.obsidian/plugins/salle' };
    p.etat = { fichiers: { programme: c.vault.getAbstractFileByPath('donnees/programme.md') } };
    p.recharger = async () => {};
    const quoi = avecStock(stock, () => attendre(p.suivreProgrammeLivre()));
    return { quoi, note: c.lire('donnees/programme.md'), avant: c.lire('.obsidian/plugins/salle/programme-avant.md') };
  };
  const stock = {};
  const un = lancer({ 'donnees/programme.md': vieux }, stock);
  const deux = lancer({ 'donnees/programme.md': vieux }, stock);   // même version déjà suivie : la note changée à la main reste
  const atelier = lancer({ 'donnees/programme.md': vieux, 'atelier/construire.py': '#' }, {});
  const bloque = lancer({ 'donnees/programme.md': vieux }, 'bloqué');
  const remplace = lancer({ 'donnees/programme.md': '---\nsalle: programme\n---\n## Séance A\n\n- Gainage planche · 2 × 30-60 s\n' }, {});
  egal([un.quoi, un.note === PROGRAMME_DEFAUT, deux.quoi, deux.note === vieux, atelier.quoi, atelier.note === vieux, bloque.quoi, remplace.quoi, remplace.note === PROGRAMME_DEFAUT, !!remplace.avant && /Gainage planche/.test(remplace.avant), un.avant],
    ['ordre', true, 'rien', true, 'rien', true, 'rien', 'remplace', true, true, null],
    'suivreProgrammeLivre (plugin) : remis dans l\'ordre livré une fois par version ; pas dans le coffre de l\'atelier ; sans mémoire, rien ; un autre programme est remplacé, l\'ancien gardé dans le dossier du plugin');
}

