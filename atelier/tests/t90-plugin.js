// Les tests du plugin (réglages, données lues au démarrage, appareil, fichier d'état, lien obsidian://salle, index des
// notes, bip, déjà vu sur l'appareil, réglages de la semaine, tests par lien).
// Lancés par tests/lancer.js (après tests/commun.js : main.js, egal, vrai, avertir, lireNote), isolés dans un bloc.
// Une règle = un test. Les exemples chiffrés sont ceux du contrat (~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-contrat-2.0.md, parties 1.3, 3 et 5.2).

// Le programme 1.15.0 figé (PROGRAMME_115, tests/programme-115.js) et les deux vraies séances
// du 09/11 et du 13/11 (copies du 14/11) : les exemples du contrat ne bougent pas quand les notes de l'utilisateur changent.
const NOTE_0911 = `---
salle: seance
date: 2026-11-09
nom: Séance libre
---
# Séance libre · lundi 9 novembre 2026, avec un ami

Séance faite avant le programme, notée de mémoire le lendemain.

- Échauffement : 10 min de vélo, niveau 10.
- Tirage vertical : barre un peu moins large que la prise large du programme, charge de 40 kg donnée par l'ami. Rangé sous « Tirage vertical prise large ».
- Machines à disques (rowing) et barre en Z : la charge notée = les disques seuls, sans le poids de la machine ni de la barre. Garde la même règle à chaque séance pour que la progression reste juste.

## Tractions
- 12 rép.
- 12 rép.
- 3 rép.

## Tirage vertical prise large
- 40 kg × 12
- 40 kg × 12
- 40 kg × 12

## Rowing à la machine à disques
- 40 kg × 12
- 40 kg × 12
- 40 kg × 12

## Curl à la barre en Z
- 5 kg × 12
- 5 kg × 12
- 5 kg × 12
`;
const NOTE_1311 = `---
salle: seance
date: 2026-11-13
nom: Séance B
duree_min: 80
cardio_min: 10
forme: normale
douleur: aucune
courbatures: legeres, bras
temps_min: 60
ressenti: bien
---
# Séance B · vendredi 13 novembre 2026

Échauffement : 5 min

Pas fait : Face pull à la poulie

## Développé épaules aux haltères
- 8 kg × 12
- 8 kg × 12

Réserve : 0 (à fond)

## Tractions
- 12 rép.
- 9 rép.

## Développé incliné aux haltères
- 10 kg × 8
- 10 kg × 8

Réserve : 1 ou 2

## Presse à cuisses
- 60 kg × 10
- 60 kg × 10

## Leg curl assis
- 25 kg × 10
- 25 kg × 10

Réserve : 0 (à fond)

## Élévations latérales aux haltères
- 4 kg × 20
- 4 kg × 15
`;
const prog115 = L.lireProgramme(PROGRAMME_115);
const reelles = [L.lireSeance(NOTE_0911), L.lireSeance(NOTE_1311)];

// Une promesse, attendue tout de suite (les tests de logique sont synchrones ; aucun minuteur n'est lancé ici).
function attendre(promesse) {
  let valeur, erreur, fini = false;
  Promise.resolve(promesse).then((v) => { valeur = v; fini = true; }, (e) => { erreur = e; fini = true; });
  drainMicrotasks();
  if (!fini) throw new Error('promesse jamais résolue');
  if (erreur) throw erreur;
  return valeur;
}
// Pose des globales le temps d'une fonction (window.*, navigator, HTMLInputElement…), puis remet ce qu'il y avait.
function avec(globales, fn) {
  const avant = {};
  for (const k of Object.keys(globales)) { avant[k] = Object.getOwnPropertyDescriptor(globalThis, k); globalThis[k] = globales[k]; }
  try { return fn(); } finally {
    for (const k of Object.keys(globales)) { if (avant[k]) Object.defineProperty(globalThis, k, avant[k]); else delete globalThis[k]; }
  }
}
function avecWindow(props, fn) {
  const avant = {};
  for (const k of Object.keys(props)) { avant[k] = window[k]; window[k] = props[k]; }
  try { return fn(); } finally { for (const k of Object.keys(props)) { if (avant[k] === undefined) delete window[k]; else window[k] = avant[k]; } }
}

// ── Réglages ──
const DATA_14_11 = { niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [1, 3, 5], cardioMin: 10 };
egal(L.fusionReglages(DATA_14_11),
  { niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, chronoIphone: false, pasHalteres: null, hauteur: null, age: null, ageLe: null, sexe: null, salle: null, etages: null, son: true, vibration: true, pauses: [], malade: [], semainesLegeres: ['2027-01-18'], legereRefus: null, recup: [], appareils: {}, machines: {}, jours: [1, 3, 5], cardioMin: 10 },
  'fusionReglages : le data.json réel du 14/11 reçoit les clés 2.0, dans l\'ordre du contrat'); // 2.3.0 : la liste malade (L.apresMaladie) ; 2.39.3 : âge et sexe
egal([null, undefined, 'abc', 3, [1, 2]].map((x) => L.fusionReglages(x)), [null, null, null, null, null], 'fusionReglages : pas un objet → null (premières questions)');
const fus = L.fusionReglages({});
vrai(fus.semainesLegeres !== REGLAGES_DEFAUT.semainesLegeres && fus.pauses !== REGLAGES_DEFAUT.pauses && fus.recup !== REGLAGES_DEFAUT.recup && fus.appareils !== REGLAGES_DEFAUT.appareils,
  'fusionReglages : les tableaux sont des copies, jamais ceux du défaut');
fus.pauses.push('2026-11-16');
egal(REGLAGES_DEFAUT.pauses, [], 'fusionReglages : modifier les réglages ne touche pas au défaut');
egal((({ pauses, recup, semainesLegeres, legereRefus, son, vibration, chronoIphone, appareils }) => ({ pauses, recup, semainesLegeres, legereRefus, son, vibration, chronoIphone, appareils }))(
  L.fusionReglages({ pauses: 'x', recup: ['2026-11-16', 3, 'bof'], semainesLegeres: null, legereRefus: 'jamais', son: 'oui', vibration: 1, chronoIphone: true, appareils: [] })),
{ pauses: [], recup: ['2026-11-16'], semainesLegeres: ['2027-01-18'], legereRefus: null, son: true, vibration: true, chronoIphone: true, appareils: {} },
'fusionReglages : une valeur abîmée reprend la valeur d\'origine, une date illisible est ignorée');
egal((({ jours, lectureSeule, cardioMin }) => ({ jours, lectureSeule, cardioMin }))(L.fusionReglages({ jours: null, lectureSeule: false, cardioMin: 15 })),
  { jours: null, lectureSeule: false, cardioMin: 15 }, 'fusionReglages : les clés 1.x hors défaut sont gardées');
const appIn = { mobile: { ecran: true, son: false }, bureau: 'abîmé' };
const fusApp = L.fusionReglages({ appareils: appIn });
vrai(JSON.stringify(fusApp.appareils) === '{"mobile":{"ecran":true,"son":false}}' && fusApp.appareils.mobile !== appIn.mobile, 'fusionReglages : appareils copiés, une entrée abîmée ignorée');

// ── Données lues au démarrage ──
const en115 = { nom: 'Séance B', date: '2026-11-13', debut: 1, courant: 1, reposFin: 0, exos: [
  { nom: 'Échauffement', series: 1, unite: 'min', echauffement: true, faites: [{ min: 5 }] },
  { nom: 'Développé épaules aux haltères', series: 3, min: 8, max: 12, unite: 'reps', faites: [{ c: 8, r: 12 }], echauffeSerie: { faite: true, c: 4, r: 10 } }] };
const lu115 = { reglages: DATA_14_11, enCours: en115, bilan: { date: '2026-11-13', forme: 'normale', temps: 60 } };
const avantLu = JSON.stringify(lu115);
const don = L.lireDonnees(lu115, SallePlugin.verifierEnCours);
vrai(don.reglages.son === true && don.reglages.duree === 75 && don.bilan.temps === 60 && don.enCours && don.enCours.nom === 'Séance B' && don.enCours.exos.length === 2,
  'lireDonnees : réglages complétés, séance en cours reprise, bilan du jour gardé (la 1.15.0 l\'oubliait)');
egal(JSON.stringify(lu115), avantLu, 'lireDonnees : le data.json lu n\'est pas modifié (la migration travaille sur une copie)');
vrai(typeof L.migrerEnCours !== 'function' || (don.enCours.version === 2 && !don.enCours.exos[1].echauffeSerie), 'lireDonnees : la séance 1.15.0 passe en forme 2.0 (L.migrerEnCours, lot A-séance)');
egal(L.lireDonnees(null, SallePlugin.verifierEnCours), { reglages: null, enCours: null, bilan: null }, 'lireDonnees : data.json absent → premières questions, rien en cours');
egal([L.lireDonnees({ reglages: DATA_14_11, enCours: { nom: 'x' }, bilan: { temps: 60 } }, SallePlugin.verifierEnCours)].map((d) => [d.enCours, d.bilan]), [[null, null]],
  'lireDonnees : séance en cours abîmée abandonnée, bilan sans date ignoré');

// ── Appareil (Tester cet appareil) ──
egal([L.cleAppareil(true), L.cleAppareil(false)], ['mobile', 'bureau'], 'cleAppareil : le data.json est partagé par l\'iPhone et le Mac');
const regApp = { appareils: { mobile: { ecran: true, son: false, vibration: null } } };
egal(['ecran', 'son', 'vibration', 'obsidian'].map((k) => L.resultatAppareil(regApp, 'mobile', k)).concat([L.resultatAppareil(regApp, 'bureau', 'ecran'), L.resultatAppareil(null, 'mobile', 'ecran')]),
  [true, false, null, null, null, null], 'resultatAppareil : true, false, ou null (pas testé)');
const regApp2 = L.avecAppareil({ duree: 60, appareils: { bureau: { ecran: false } } }, 'mobile', { son: true, bidon: 3 }, '2026-11-14');
egal(regApp2.appareils, { bureau: { ecran: false }, mobile: { ecran: null, son: true, vibration: null, obsidian: null, shortcuts: null, date: '2026-11-14' } },
  'avecAppareil : la forme du contrat, une clé inconnue ignorée, l\'autre appareil gardé');
const regApp3 = L.avecAppareil(regApp2, 'mobile', { ecran: true }, '2026-11-15');
vrai(regApp3.appareils.mobile.son === true && regApp3.appareils.mobile.ecran === true && regApp2.appareils.mobile.ecran === null, 'avecAppareil : un test de plus garde les autres, sans modifier l\'ancien objet');
egal([L.basculerDate(['2026-11-23'], '2026-11-16'), L.basculerDate(['2026-11-16', '2026-11-23'], '2026-11-16'), L.basculerDate(['2026-11-16'], '2026-11-16', true), L.basculerDate(['2026-11-16'], '2026-11-30', false), L.basculerDate('abîmé', '2026-11-16')],
  [['2026-11-16', '2026-11-23'], ['2026-11-23'], ['2026-11-16'], ['2026-11-16'], ['2026-11-16']], 'basculerDate : met ou retire, triée, sans doublon, toujours une nouvelle liste');

// (2.26.0 : le fichier d'état pour le widget iPhone est retiré, ses tests aussi.)

// ── Le lien obsidian://salle ──
egal([L.lienSalle('Mon Coffre é', 'seance'), L.lienSalle(''), L.lienSalle('C', 'diagnostic', { test: 'obsidian' })],
  ['obsidian://salle?vault=Mon%20Coffre%20%C3%A9&ecran=seance', 'obsidian://salle', 'obsidian://salle?vault=C&ecran=diagnostic&test=obsidian'], 'lienSalle : le coffre d\'abord, tout encodé');
egal([{}, { ecran: 'seance' }, { ecran: 'Progres' }, { ecran: 'mesures' }, { ecran: 'guide' }, { ecran: 'seances' }, { ecran: 'diagnostic' }, { ecran: 'bilan' }, { ecran: 'avant' }].map((p) => L.routeLien(p, true)),
  [{ faire: 'ouvrir', test: null }, { faire: 'seance', test: null }, { faire: 'aller', ecran: 'progres', test: null }, { faire: 'aller', ecran: 'mesures', test: null }, { faire: 'aller', ecran: 'guide', test: null },
    { faire: 'aller', ecran: 'seances', test: null }, { faire: 'aller', ecran: 'diagnostic', test: null }, { faire: 'aller', ecran: 'accueil', test: null }, { faire: 'aller', ecran: 'accueil', test: null }],
  'routeLien : seance reprend ou commence, les écrans connus s\'ouvrent, un autre écran donne l\'accueil');
egal([L.routeLien({ ecran: 'progres' }, false), L.routeLien({ test: 'obsidian' }, true), L.routeLien({ test: 'raccourci-ok', ecran: 'progres' }, true), L.routeLien({ test: 'pirate' }, true)],
  [{ faire: 'ouvrir', test: null }, { faire: 'aller', ecran: 'diagnostic', test: 'obsidian' }, { faire: 'aller', ecran: 'diagnostic', test: 'raccourci-ok' }, { faire: 'ouvrir', test: null }],
  'routeLien : sans réglages, les premières questions ; un retour de test mène au test ; un test inconnu est ignoré');
const urlTest = L.urlTestRaccourci('Mon Coffre');
vrai(urlTest.indexOf('shortcuts://x-callback-url/run-shortcut?name=Repos%20salle&input=text&text=3&x-success=') === 0 &&
  decodeURIComponent(/x-success=([^&]+)/.exec(urlTest)[1]) === 'obsidian://salle?vault=Mon%20Coffre&ecran=diagnostic&test=raccourci-ok' &&
  decodeURIComponent(/x-error=([^&]+)/.exec(urlTest)[1]) === 'obsidian://salle?vault=Mon%20Coffre&ecran=diagnostic&test=raccourci-erreur' &&
  /x-cancel=[^&]*raccourci-erreur/.test(urlTest), 'urlTestRaccourci : 3 s de minuteur, le retour dit si « Repos salle » a marché');

// ── L'index des notes ──
const NOTE_GUIDE = '---\nsalle: guide\n---\n# Guide\n\n## Presse à cuisses\n**Tu dois sentir** les cuisses.\n';
const NOTE_FORME = '---\nsalle: forme\n---\n# Forme\n\n- 2026-11-13 · forme normale · courbatures : aucune · douleur : aucune\n';
egal([L.analyserNote('# Une note à moi\nSans en-tête.'), L.analyserNote('---\ntags: x\n---\n# Autre'), L.analyserNote('---\nsalle: connexions\n---\n# Connexions')],
  [null, null, { type: 'connexions' }], 'analyserNote : seules les notes « salle: … » comptent ; un type inconnu est gardé tel quel');
const anaProg = L.analyserNote(PROGRAMME_115), anaS = L.analyserNote(NOTE_1311);
vrai(anaProg.type === 'programme' && anaProg.programme.length === 2 && anaS.type === 'seance' && anaS.seance.nom === 'Séance B' && !anaS.abime, 'analyserNote : programme et séance analysés');
const fichier = (path) => ({ path });
const ent = [
  { f: fichier('Vieux programme.md'), texte: '---\nsalle: programme\n---\n# Vide', a: L.analyserNote('---\nsalle: programme\n---\n# Vide') },
  { f: fichier('Séances/2026-11-13 Séance B.md'), texte: NOTE_1311, a: anaS },
  { f: fichier('Programme.md'), texte: PROGRAMME_115, a: anaProg },
  { f: fichier('Séances/2026-11-09 Séance libre.md'), texte: NOTE_0911, a: L.analyserNote(NOTE_0911) },
  { f: fichier('Guide.md'), texte: NOTE_GUIDE, a: L.analyserNote(NOTE_GUIDE) },
  { f: fichier('Guide 2.md'), texte: NOTE_GUIDE, a: L.analyserNote(NOTE_GUIDE) },
  { f: fichier('Forme.md'), texte: NOTE_FORME, a: L.analyserNote(NOTE_FORME) },
];
const assemble = L.assemblerEtat(ent, PROGRAMME_115);
vrai(assemble.programme.length === 2 && !assemble.programmeSecours && assemble.fichiers.programme.path === 'Programme.md' && assemble.textes.programme === PROGRAMME_115,
  'assemblerEtat : le premier programme lisible gagne (comme en 1.15.0)');
egal(assemble.seances.map((s) => [s.date, s.chemin]), [['2026-11-09', 'Séances/2026-11-09 Séance libre.md'], ['2026-11-13', 'Séances/2026-11-13 Séance B.md']], 'assemblerEtat : séances triées, avec leur chemin');
vrai(anaS.seance.chemin === undefined, 'assemblerEtat : l\'analyse gardée dans l\'index n\'est pas modifiée (le chemin va dans une copie)');
vrai(assemble.fichiers.guide.path === 'Guide.md' && Object.keys(assemble.guide).length >= 1 && assemble.forme.length === 1, 'assemblerEtat : la première note de chaque type gagne');
const vide = L.assemblerEtat([], PROGRAMME_115);
// 2.23.0 (demande : « pourquoi y a autant de notes ») : sans note « guide » ni « manger » dans le coffre, le plugin sert les siens ;
// une note du coffre avec le même en-tête passe avant (un coffre d'avant la 2.23.0).
egal([Object.keys(vide.guide).length, vide.guide === L.guideDuPlugin(), vide.textes.manger === MANGER_DEFAUT, vide.textes.guide === GUIDE_DEFAUT, !!vide.fichiers.guide, !!vide.fichiers.manger],
  [Object.keys(L.lireGuide(GUIDE_DEFAUT)).length, true, true, true, false, false], 'assemblerEtat : sans note, le guide et « Manger » du plugin');
{
  const noteGuide = '---\nsalle: guide\n---\n# Guide\n\n## Presse à cuisses\n\nPousse.\n', noteManger = '---\nsalle: manger\n---\n# Manger\n\nÀ moi.\n';
  const avec = L.assemblerEtat([{ f: { path: 'G.md' }, a: L.analyserNote(noteGuide), texte: noteGuide }, { f: { path: 'M.md' }, a: L.analyserNote(noteManger), texte: noteManger }], PROGRAMME_115);
  egal([Object.keys(avec.guide), avec.textes.manger, avec.fichiers.guide.path], [Object.keys(L.lireGuide(noteGuide)), noteManger, 'G.md'], 'assemblerEtat : une note du coffre passe avant le texte du plugin');
}
vrai(vide.programmeSecours && vide.programme.length === 2 && vide.seances.length === 0, 'assemblerEtat : sans note, le programme d\'origine prend le relais');

// Un faux coffre (en mémoire) et un vrai SallePlugin, pour l'index, le fichier d'état et les réglages de la semaine.
function fauxCoffre(notes) {
  const fichiers = {}, ecouteurs = {}, ecrits = {}, lus = [];
  let horloge = 1000;
  const ajouter = (path, t) => { fichiers[path] = { path, name: path.split('/').pop(), stat: { mtime: ++horloge, size: t.length }, _t: t }; return fichiers[path]; };
  Object.keys(notes).forEach((p) => ajouter(p, notes[p]));
  const emettre = (evt, ...x) => (ecouteurs[evt] || []).forEach((cb) => cb(...x));
  const vault = {
    getMarkdownFiles: () => Object.values(fichiers).filter((f) => /\.md$/.test(f.path)),
    cachedRead: async (f) => { lus.push(f.path); return f._t; },
    read: async (f) => f._t,
    modify: async (f, t) => { f._t = t; f.stat = { mtime: ++horloge, size: t.length }; emettre('modify', f); },
    create: async (p, t) => { const f = ajouter(p, t); emettre('create', f); return f; },
    getAbstractFileByPath: (p) => fichiers[p] || null,
    getName: () => 'Coffre Test',
    on: (evt, cb) => { (ecouteurs[evt] = ecouteurs[evt] || []).push(cb); return {}; },
    adapter: { write: async (p, t) => { ecrits[p] = t; } },
  };
  return {
    vault, fichiers, ecrits, lus,
    changer(p, t) { const f = fichiers[p]; f._t = t; f.stat = { mtime: ++horloge, size: t.length }; },
    supprimer(p) { const f = fichiers[p]; delete fichiers[p]; emettre('delete', f); },
    renommer(p, q) { const f = fichiers[p]; delete fichiers[p]; f.path = q; fichiers[q] = f; emettre('rename', f, p); },
  };
}
function pluginTest(coffre, donnees, vues) {
  const p = new SallePlugin();
  const feuilles = (vues || []).map((v) => ({ view: v }));
  p.app = { vault: coffre.vault, workspace: { getLeavesOfType: () => feuilles } };
  p.manifest = { dir: '.obsidian/plugins/salle' };
  p.donnees = Object.assign({ reglages: L.fusionReglages({ parSemaine: 3, duree: 60 }), enCours: null, bilan: null }, donnees || {});
  p.etat = { programme: prog115, seances: [], fichiers: {}, textes: {} };
  p.index = new Map();
  p.vus = new Set();
  p.sauves = [];
  p.saveData = async (d) => { p.sauves.push(JSON.parse(JSON.stringify(d))); };
  return p;
}
const NOTES = {
  'Programme.md': PROGRAMME_115, 'Séances/2026-11-09 Séance libre.md': NOTE_0911, 'Séances/2026-11-13 Séance B.md': NOTE_1311,
  'Forme.md': NOTE_FORME, 'Ma salle.md': '---\nsalle: club\n---\n# Ma salle', 'Mes idées.md': '# Pas une note du plugin',
  'Outils/connexions/Connexions iPhone.md': '---\nsalle: connexions\n---\n# Connexions iPhone',
};
const cf = fauxCoffre(NOTES), pi = pluginTest(cf);
attendre(pi.recharger());
egal([pi.lues, pi.etat.seances.length, pi.etat.programme.length, !!pi.etat.fichiers.forme, !!pi.etat.fichiers.connexions], [7, 2, 2, true, true], 'recharger : la première fois, chaque note est lue une fois');
attendre(pi.recharger());
egal(pi.lues, 0, 'recharger : rien n\'a changé → aucune note relue (index en mémoire)');
cf.changer('Séances/2026-11-13 Séance B.md', NOTE_1311.replace('ressenti: bien', 'ressenti: dur'));
attendre(pi.recharger());
egal([pi.lues, cf.lus[cf.lus.length - 1]], [1, 'Séances/2026-11-13 Séance B.md'], 'recharger : une note modifiée → seulement elle est relue');
cf.supprimer('Séances/2026-11-09 Séance libre.md');
attendre(pi.recharger());
egal([pi.lues, pi.etat.seances.map((s) => s.date), pi.index.has('Séances/2026-11-09 Séance libre.md')], [0, ['2026-11-13'], false], 'recharger : une note supprimée sort de l\'index et de l\'état');
cf.renommer('Forme.md', 'Carnets/Forme.md');
attendre(pi.recharger());
egal([pi.lues, pi.etat.fichiers.forme.path], [1, 'Carnets/Forme.md'], 'recharger : une note déplacée est retrouvée à son contenu, pas à son nom');
const deux = [pi.recharger(), pi.recharger()];
attendre(Promise.all(deux));
vrai(pi.etat.seances.length === 1 && pi.lues === 0, 'recharger : deux appels de suite s\'enchaînent, l\'état est à jour quand la promesse se résout');
const sansStat = fauxCoffre({ 'Programme.md': PROGRAMME_115 });
delete sansStat.fichiers['Programme.md'].stat;
const ps = pluginTest(sansStat);
attendre(ps.recharger()); attendre(ps.recharger());
egal(ps.lues, 1, 'recharger : sans date de modification connue, la note est relue (jamais un état périmé)');
// L'écoute du coffre : un changement retire la note de l'index (la date seule pourrait ne pas suffire), puis recharge, groupé.
const minuteurs = [];
const pe = pluginTest(fauxCoffre(NOTES));
pe.registerEvent = () => {};
attendre(pe.recharger());
avecWindow({ setTimeout: (f, ms) => { minuteurs.push({ f, ms }); return minuteurs.length; }, clearTimeout: () => {} }, () => {
  pe.ecouter();
  pe.app.vault.modify(pe.app.vault.getAbstractFileByPath('Forme.md'), NOTE_FORME + '- 2026-11-14 · fatigué\n');
  pe.app.vault.modify(pe.app.vault.getAbstractFileByPath('Programme.md'), PROGRAMME_115);
  drainMicrotasks();
});
vrai(minuteurs.length === 2 && minuteurs.every((m) => m.ms === 250) && !pe.index.has('Forme.md') && !pe.index.has('Programme.md') && pe.index.has('Ma salle.md'),
  'ecouter : chaque changement retire sa note de l\'index ; le rechargement attend 250 ms pour regrouper');
attendre(minuteurs[minuteurs.length - 1].f());
egal(pe.lues, 2, 'ecouter : après le délai, seules les 2 notes changées sont relues');

// ── Appareil, consignes, réglages de la semaine ──
const pa = pluginTest(fauxCoffre({}), { reglages: L.fusionReglages({ appareils: { bureau: { ecran: true, son: false } } }) });
egal([pa.peut('ecran'), pa.peut('son'), pa.peut('vibration')], [true, false, null], 'peut : le résultat du test de cet appareil (ici le Mac), null si pas testé');
pa.mobile = () => true;
egal(pa.peut('ecran'), null, 'peut : l\'iPhone a ses propres résultats');
const stock = {};
avecWindow({ localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } } }, () => {
  const avant = pa.dejaVu('c-essai');
  pa.marquerVu('c-essai');
  vrai(!avant && pa.dejaVu('c-essai') && stock['salle-vu2-c-essai'] === '1', 'dejaVu : une consigne vue est gardée sur l\'appareil (salle-vu2-…)');
});
avecWindow({ localStorage: { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } } }, () => {
  const pm = pluginTest(fauxCoffre({}));
  const avant = pm.dejaVu('b-reserve');
  pm.marquerVu('b-reserve');
  vrai(!avant && pm.dejaVu('b-reserve'), 'dejaVu : sans stockage, repli en mémoire, sans erreur');
});
const pp = pluginTest(fauxCoffre({}));
const vuePause = new VueSalle(null, pp);
let redessins = 0;
vuePause.ecran = 'accueil';
vuePause.rendre = () => { redessins++; };
pp.app.workspace.getLeavesOfType = () => [{ view: vuePause }];
const pausesAvant = pp.donnees.reglages.pauses;
attendre(pp.basculerPause('2026-11-18'));
vrai(JSON.stringify(pp.donnees.reglages.pauses) === '["2026-11-16"]' && pp.donnees.reglages.pauses !== pausesAvant && pausesAvant.length === 0 && pp.sauves.length === 1 && redessins === 1,
  'basculerPause : le lundi de la semaine, un nouveau tableau, sauvé, l\'écran redessiné');
attendre(pp.basculerPause('2026-11-16'));
egal(pp.donnees.reglages.pauses, [], 'basculerPause : un second toucher retire la pause');
attendre(pp.choisirSemaineLegere('2027-04-05', true));
attendre(pp.choisirSemaineLegere('2027-06-07', false));
egal([pp.donnees.reglages.semainesLegeres, pp.donnees.reglages.legereRefus], [['2027-01-18', '2027-04-05'], '2027-06-07'], 'choisirSemaineLegere : oui l\'ajoute, non note le refus');
attendre(pp.cocherRecup('2026-11-16', true)); attendre(pp.cocherRecup('2026-11-23', true)); attendre(pp.cocherRecup('2026-11-16', false));
egal(pp.donnees.reglages.recup, ['2026-11-23'], 'cocherRecup : met ou retire le lundi de la 5e case');
const pAvant = pp.sauves.length;
attendre(pp.basculerPause('pas une date'));
egal(pp.sauves.length, pAvant, 'basculerPause : une date illisible ne change rien');

// ── Le bip ──
const oscillateurs = [];
class FauxAudio {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
  createOscillator() { const o = { frequency: {}, connect() {}, start() {}, stop() {} }; oscillateurs.push(o); return o; }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createBuffer() { return {}; }
  createBufferSource() { return { connect() {}, start() {} }; }
  resume() { return Promise.resolve(); }
}
const pb = pluginTest(fauxCoffre({}));
egal(pb.bip(3), false, 'bip : sans Web Audio, rien et pas d\'erreur');
avecWindow({ AudioContext: FauxAudio }, () => {
  vrai(pb.preparerSon() && pb.bip(3) && oscillateurs.length === 3 && oscillateurs[2].frequency.value === 1320 && oscillateurs[0].frequency.value === 880, 'bip : 3 bips, le dernier plus aigu');
  pb.donnees.reglages.son = false;
  oscillateurs.length = 0;
  vrai(!pb.bip(1) && !pb.preparerSon() && oscillateurs.length === 0, 'bip : rien si le son est coupé dans les réglages');
  pb.donnees.reglages.son = true;
  pb.donnees.reglages.appareils = { bureau: { son: false } };
  vrai(!pb.bip(1) && pb.jouerBip(1), 'bip : rien si le test a dit non ; le test lui-même peut toujours jouer');
});
class AudioEnPause extends FauxAudio { constructor() { super(); this.state = 'suspended'; } resume() { return Promise.resolve(); } }
const session = { type: 'auto' };
avec({ navigator: { audioSession: session } }, () => avecWindow({ AudioContext: AudioEnPause }, () => {
  const pz = pluginTest(fauxCoffre({}));
  oscillateurs.length = 0;
  vrai(!pz.bip(3) && oscillateurs.length === 0 && session.type === 'ambient', 'bip : contexte en pause sans toucher récent → rien de programmé (pas de bip en retard) ; la musique continue (ambient)');
  vrai(pz.preparerSon() && pz.bip(3) && oscillateurs.length === 3, 'bip : juste après preparerSon (le toucher), la reprise est en route → les bips partent');
}));
egal([pluginTest(fauxCoffre({})).vibreur()], [null], 'vibreur : sans page (tests de logique), null et pas d\'erreur');

// ── Tester cet appareil : la partie calculable ──
const pt = pluginTest(fauxCoffre({}));
let demandes = 0, relaches = 0;
const resT = avec({ navigator: { wakeLock: { request: async () => { demandes++; return { release: async () => { relaches++; } }; } } } }, () => attendre(pt.testerAppareil()));
vrai(resT.ecran === true && resT.son === false && resT.vibration === false && resT.obsidian === null && demandes === 1 && relaches === 1 && /^\d{4}-\d{2}-\d{2}$/.test(resT.date) && pt.sauves.length === 1,
  'testerAppareil : écran allumé demandé puis relâché ; pas de Web Audio ni d\'interrupteur → non ; gardé dans data.json');
const pt2 = pluginTest(fauxCoffre({}));
const resT2 = avec({ navigator: { wakeLock: { request: async () => { throw new Error('NotAllowedError'); } } }, HTMLInputElement: Object.assign(function () {}, { prototype: { switch: false } }) },
  () => avecWindow({ AudioContext: FauxAudio }, () => attendre(pt2.testerAppareil())));
vrai(resT2.ecran === false && resT2.son === null && resT2.vibration === null, 'testerAppareil : écran refusé → non ; Web Audio et interrupteur présents → on garde la réponse à demander');

// ── Les tests par lien (obsidian:// et Repos salle) ──
const ouverts = [], attentes = [];
const pl = pluginTest(fauxCoffre({}));
pl.app.workspace.getLeavesOfType = () => [];
pl.mobile = () => true;   // les résultats vont dans reglages.appareils.mobile
avecWindow({ open: (u) => { ouverts.push(u); }, setTimeout: (f, ms) => { attentes.push({ f, ms }); return 1; } }, () => {
  pl.lancerTestLien('obsidian');
  attendre(pl.retourTest('obsidian'));
});
vrai(ouverts[0] === 'obsidian://salle?vault=Coffre%20Test&ecran=diagnostic&test=obsidian' && pl.peut('obsidian') === true && pl.testEnCours === null, 'test du lien : obsidian://salle reçu → ça marche');
attendre(pl.retourTest('raccourci-ok'));
egal(pl.peut('shortcuts'), null, 'test du lien : un retour sans test en cours est ignoré (vieux lien)');
avecWindow({ open: (u) => { ouverts.push(u); }, setTimeout: (f, ms) => { attentes.push({ f, ms }); return 1; } }, () => {
  pl.lancerTestLien('obsidian');
  attendre(attentes[attentes.length - 1].f());
});
egal([attentes[attentes.length - 1].ms, pl.peut('obsidian')], [5000, false], 'test du lien : rien reçu en 5 s → ne marche pas');
avecWindow({ open: (u) => { ouverts.push(u); }, setTimeout: (f, ms) => { attentes.push({ f, ms }); return 1; } }, () => {
  pl.lancerTestLien('shortcuts');
  pl.surVisibilite.call(pl);   // visible, sans être parti : rien
  attendre(pl.retourTest('raccourci-ok'));
});
vrai(/^shortcuts:\/\/x-callback-url\/run-shortcut\?name=Repos%20salle/.test(ouverts[ouverts.length - 1]) && pl.peut('shortcuts') === true, 'test du raccourci : « Repos salle » revient par x-success → ça marche');
avecWindow({ open: () => {}, setTimeout: (f, ms) => { attentes.push({ f, ms }); return 1; } }, () => {
  pl.lancerTestLien('shortcuts');
  attendre(pl.retourTest('raccourci-erreur'));
});
egal(pl.peut('shortcuts'), false, 'test du raccourci : x-error (raccourci absent) → ne marche pas');
pl.donnees.reglages.chronoIphone = true;
egal(pl.chronoIphone(90), false, 'chronoIphone : pas de minuteur si le test du raccourci a dit non (seulement sur l\'appareil testé)');

// ── Commandes, lien reçu, retour dans l'app ──
const cmds = [];
const pc = pluginTest(fauxCoffre({}));
pc.addCommand = (c) => cmds.push(c);
pc.commandes();
egal(cmds.map((c) => [c.id, c.name]), [['ouvrir', 'Ouvrir la salle'], ['commencer', 'Commencer la séance du jour'], ['serie-faite', 'Série faite'], ['lancer-repos', 'Lancer le repos'], ['tester-appareil', 'Tester cet appareil']],
  'commandes : les 4 du plan, plus « Tester cet appareil »');
const vueC = new VueSalle(null, pc);
let valides = 0, reposLances = 0;
vueC.validerSerie = () => { valides++; };
vueC.lancerRepos = () => { reposLances++; };
pc.app.workspace.getLeavesOfType = () => [{ view: vueC }];
vueC.ecran = 'seance';
egal([cmds[2].checkCallback(true), cmds[3].checkCallback(true)], [false, false], 'commandes : « Série faite » et « Lancer le repos » cachées sans séance en cours');
pc.donnees.enCours = { nom: 'Séance A', date: '2026-11-16', exos: [] };
vueC.saisie = { pour: 1, c: 40, v: 12 };
vrai(cmds[2].checkCallback(true) && cmds[2].checkCallback(false) && valides === 1 && cmds[3].checkCallback(false) && reposLances === 1, 'commandes : pendant la séance, « Série faite » valide la saisie, « Lancer le repos » lance le repos');
vueC.saisie = null;
egal(cmds[2].checkCallback(true), false, 'commandes : « Série faite » sans saisie en cours → cachée');
const allumes = [];
vueC.garderAllume = (oui) => { allumes.push(oui); };
vueC.verrou = { released: true };
pc.surVisibilite();
vrai(vueC.verrou === null && allumes.join() === 'true', 'retour dans Obsidian : pendant une séance, l\'écran allumé est redemandé');
const pr = pluginTest(fauxCoffre({}));
const faits = [];
pr.pret = Promise.resolve();
pr.ouvrir = async () => { faits.push('ouvrir'); };
pr.seanceDuJour = async () => { faits.push('seance'); };
pr.ouvrirEcran = async (e) => { faits.push('aller ' + e); };
['', 'seance', 'progres', 'bilan'].forEach((e) => attendre(pr.surLien({ action: 'salle', ecran: e || undefined })));
egal(faits, ['ouvrir', 'seance', 'aller progres', 'aller accueil'], 'surLien : obsidian://salle ouvre, ?ecran=seance reprend ou commence, un écran connu s\'ouvre, un autre donne l\'accueil');

// (17/11/2026 : le dossier Outils/connexions et son script Scriptable sont retirés du coffre, jamais installés sur l'iPhone ;
// leurs tests sont partis avec. Copie : ~/Desktop/CLAUDE/Salle-travail/archives/2026-11-17-connexions.)

// ── Deux appareils, un seul data.json (iCloud) ──
// Le Mac reste ouvert ; l'iPhone teste l'appareil, met une semaine en pause, coche la 5e case ; puis un toucher sur le Mac.
// Avant : le Mac réécrivait tout ce qu'il avait en mémoire et effaçait ce que l'iPhone avait écrit.
{
  let disque = { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, jours: [1, 3, 5] }, enCours: null, bilan: null };
  const appareil = (mobile) => {
    const p = pluginTest(fauxCoffre({}));
    p.loadData = async () => (disque ? JSON.parse(JSON.stringify(disque)) : null);
    p.saveData = async (d) => { disque = JSON.parse(JSON.stringify(d)); };
    p.donnees = L.lireDonnees(JSON.parse(JSON.stringify(disque)), SallePlugin.verifierEnCours);
    p.base = L.empreinteDonnees(p.donnees);   // comme onload
    p.mobile = () => mobile;
    return p;
  };
  const mac = appareil(false), iphone = appareil(true);
  attendre(iphone.noterAppareil({ ecran: true, son: false, vibration: true }));
  attendre(iphone.basculerPause('2026-11-16'));
  attendre(iphone.cocherRecup('2026-11-16', true));
  attendre(mac.cocherRecup('2026-11-23', true));
  egal([Object.keys(disque.reglages.appareils), disque.reglages.pauses, disque.reglages.recup, disque.reglages.jours],
    [['mobile'], ['2026-11-16'], ['2026-11-16', '2026-11-23'], [1, 3, 5]], 'deux appareils : un toucher sur le Mac garde ce que l\'iPhone a écrit (tests, pause, 5e case des deux)');
  egal([Object.keys(mac.donnees.reglages.appareils), mac.donnees.reglages.pauses], [['mobile'], ['2026-11-16']], 'deux appareils : le Mac a repris en mémoire ce que l\'iPhone a écrit');
  // La séance en cours : faite sur l'iPhone, le Mac la reçoit (onExternalSettingsChange) et la redessine.
  let redessins = 0, saisie = 'vieille';
  const vueMac = { ecran: 'seance', set saisie(x) { saisie = x; }, rendre() { redessins++; }, donneesChangees() {} };
  mac.app.workspace.getLeavesOfType = () => [{ view: vueMac }];
  mac.vues = () => [vueMac];
  const sc = L.nouvelleSeance({ nom: 'Séance A', exos: [{ nom: 'Presse à cuisses', series: 3, min: 10, max: 15, repos: 120, pas: 5, faites: [] }] }, '2026-11-16', 1000);
  iphone.donnees.enCours = sc;
  attendre(iphone.sauver());
  attendre(mac.onExternalSettingsChange());
  egal([!!mac.donnees.enCours, mac.donnees.enCours && mac.donnees.enCours.debut, redessins, saisie], [true, 1000, 1, null], 'onExternalSettingsChange : la séance commencée sur l\'iPhone arrive sur le Mac, qui la redessine');
  iphone.donnees.enCours.exos[1].faites.push({ c: 60, r: 12 });
  attendre(iphone.sauver());
  mac.donnees.enCours.reposFin = 99;   // le Mac écrit aussi (un minuteur), sans avoir reçu la série de l'iPhone
  attendre(mac.sauver());
  egal(disque.enCours.exos[1].faites, [{ c: 60, r: 12 }], 'deux appareils : la même séance changée des deux côtés → celle qui a le plus avancé gagne');
  iphone.donnees.enCours = null;   // finie sur l'iPhone (la note est écrite)
  attendre(iphone.sauver());
  mac.donnees.enCours.reposFin = 5;
  attendre(mac.sauver());
  egal([disque.enCours, mac.donnees.enCours], [null, null], 'deux appareils : finie sur l\'iPhone, elle ne revient pas par le Mac');
  egal(attendre(mac.onExternalSettingsChange()), undefined, 'onExternalSettingsChange : rien de neuf → rien à faire, sans erreur');
  disque = null;
  attendre(mac.cocherRecup('2026-11-30', true));
  vrai(disque && disque.reglages.recup.indexOf('2026-11-30') >= 0, 'deux appareils : data.json absent ou illisible → on écrit ce qu\'on a, sans erreur');
}
// La fusion à trois, pure.
{
  const base = L.empreinteDonnees({ reglages: { son: true, pauses: ['2026-11-09'], appareils: { bureau: { son: true } } }, enCours: null, bilan: null });
  const ici = { reglages: { son: false, pauses: ['2026-11-09', '2026-11-23'], appareils: { bureau: { son: true } } }, enCours: null, bilan: null };
  const disque = { reglages: { son: true, pauses: ['2026-11-16'], appareils: { bureau: { son: true }, mobile: { son: false } } }, enCours: null, bilan: { date: '2026-11-16' } };
  const r = L.fusionDonnees(ici, base, disque);
  egal([ici.reglages.son, ici.reglages.pauses, Object.keys(ici.reglages.appareils), ici.bilan, r.reglages, r.bilan, r.change],
    [false, ['2026-11-16', '2026-11-23'], ['bureau', 'mobile'], { date: '2026-11-16' }, ['pauses', 'appareils'], true, true],
    'fusionDonnees : changé ici gardé ; listes de lundis : ajouts et retraits des deux côtés ; appareils un par un ; bilan repris');
  const rien = { reglages: { son: true, pauses: ['2026-11-09'], appareils: { bureau: { son: true } } }, enCours: null, bilan: null };
  egal(L.fusionDonnees(rien, base, JSON.parse(JSON.stringify(rien))).change, false, 'fusionDonnees : rien de neuf sur le disque → rien ne change');
  const neuf = { reglages: null, enCours: null, bilan: null };
  L.fusionDonnees(neuf, L.empreinteDonnees(neuf), { reglages: { duree: 60 }, enCours: null, bilan: null });
  egal(neuf.reglages, { duree: 60 }, 'fusionDonnees : l\'autre appareil a répondu aux premières questions → réglages repris');
  const s = (debut, n) => ({ nom: 'A', date: '2026-11-16', debut, exos: [{ nom: 'Presse', faites: new Array(n).fill({ c: 60, r: 10 }) }] });
  egal([L.seanceGagnante(s(1, 1), s(1, 2), JSON.stringify(s(1, 0))), L.seanceGagnante(s(1, 2), s(1, 2), JSON.stringify(s(1, 0))), L.seanceGagnante(s(2, 0), s(1, 3), JSON.stringify(s(1, 0))),
    L.seanceGagnante(null, s(1, 3), JSON.stringify(s(1, 0))), L.seanceGagnante(null, s(3, 0), JSON.stringify(s(1, 0))), L.seanceGagnante(s(1, 1), null, JSON.stringify(s(1, 0))), L.seanceGagnante(s(4, 0), null, JSON.stringify(s(1, 0)))],
    ['disque', 'ici', 'ici', 'ici', 'disque', 'disque', 'ici'], 'seanceGagnante : la plus avancée ; finie ici le reste ; une nouvelle séance gagne ; finie là-bas l\'est ici');
}

// ── Le redessin après un changement du coffre : seulement si une note du plugin a changé ──
{
  const minut = [];
  const vue = Object.assign(Object.create(VueSalle.prototype), { n: 0, donneesChangees() { this.n++; } });   // vues() garde les VueSalle
  const pr = pluginTest(fauxCoffre(NOTES), null, [vue]);
  pr.registerEvent = () => {};
  attendre(pr.recharger());
  pr.notesChangees = false;
  avecWindow({ setTimeout: (f, ms) => { minut.push(f); return minut.length; }, clearTimeout: () => {} }, () => {
    pr.ecouter();
    pr.app.vault.modify(pr.app.vault.getAbstractFileByPath('Mes idées.md'), '# Pas une note du plugin, modifiée');
    drainMicrotasks();
  });
  attendre(minut[minut.length - 1]());
  const apresAutre = vue.n;
  avecWindow({ setTimeout: (f, ms) => { minut.push(f); return minut.length; }, clearTimeout: () => {} }, () => {
    pr.app.vault.modify(pr.app.vault.getAbstractFileByPath('Forme.md'), NOTE_FORME + '- 2026-11-14 · fatigué\n');
    drainMicrotasks();
  });
  attendre(minut[minut.length - 1]());
  egal([apresAutre, vue.n], [0, 1], 'ecouter : une autre note modifiée ne redessine rien ; une note du plugin, si');
}

// ── 2.22.0 : la salle et ses étages, dans les réglages (plus rien de personnel dans le code) ──
{
  const S = { nom: ' Ma  Salle ', adresse: '1 rue du Test, Ville', trajet: 'bus 12' };
  egal([L.salleLue(S), L.salleLue({ nom: '', adresse: 'x' }), L.salleLue(null), L.salleLue('texte')], [{ nom: 'Ma Salle', adresse: '1 rue du Test, Ville', trajet: 'bus 12' }, null, null, null], 'salleLue : des textes propres ; sans nom : pas de salle');
  egal([L.etagesLus({ machines: 1, halteres: 2 }), L.etagesLus({ machines: 0, halteres: 1 }), L.etagesLus({ machines: 1, halteres: 1 }), L.etagesLus({ machines: 1 }), L.etagesLus({ machines: 'a', halteres: 2 }), L.etagesLus(null)],
    [{ machines: 1, halteres: 2 }, { machines: 0, halteres: 1 }, null, null, null, null], 'etagesLus : deux étages différents (0 = RDC) ; sinon un seul étage (null)');
  egal(['Curl aux haltères', 'Développé incliné aux haltères', 'Curl à la barre en Z', 'Presse à cuisses', 'Tirage horizontal à la poulie', 'Gainage planche', 'Leg curl assis'].map(L.lieuExercice),
    ['halteres', 'halteres', 'halteres', 'machines', 'machines', 'machines', 'machines'], 'lieuExercice : haltères, barres et bancs d\'un côté ; machines, poulies et le reste de l\'autre');
  const E = { machines: 1, halteres: 2 };
  egal([L.etageExercice({ nom: 'Curl aux haltères' }, E), L.etageExercice({ nom: 'Presse à cuisses' }, E), L.etageExercice({ nom: 'Curl aux haltères', etage: 3 }, E), L.etageExercice({ nom: 'Presse à cuisses' }, null)], [2, 1, 3, null],
    'etageExercice : l\'étage écrit sur la ligne du programme d\'abord, sinon celui du lieu dans les réglages ; sans réglage : aucun');
  egal(L.situer([{ nom: 'Échauffement', echauffement: true }, { nom: 'Presse à cuisses' }, { nom: 'Curl aux haltères', etage: 0 }], E).map((x) => x.etage), [undefined, 1, 0], 'situer : chaque exercice sans étage reçoit celui des réglages');
  egal([L.libelleEtage(1, E), L.libelleEtage(2, E), L.libelleEtage(0, E), L.libelleEtage(1, null)], ['machines et poulies', 'haltères et bancs', '', ''], 'libelleEtage : ce qu\'on trouve à chaque étage, d\'après les réglages');
  egal(L.lignesSalle({ salle: S, etages: { machines: 0, halteres: 1 } }), ['**Ma Salle** : 1 rue du Test, Ville', '**Y aller** : bus 12', '**Les étages** : machines au RDC, haltères et bancs au 1er'], 'lignesSalle : le nom et l\'adresse, le trajet, les étages');
  egal([L.lignesSalle({}), L.lignesSalle({ etages: E }), L.urlCarte(S), L.urlCarte(null)], [[], ['**Les étages** : machines au 1er, haltères et bancs au 2e'], 'https://www.google.com/maps/search/?api=1&query=Ma%20Salle%201%20rue%20du%20Test%2C%20Ville', ''],
    'lignesSalle sans salle ; urlCarte : une recherche Google Maps du nom et de l\'adresse');
  const reg = L.reglagesDesReponses({ salle: S, etages: E, son: false }, { niveau: 'un peu' }, 70);
  egal([reg.salle, reg.etages, L.reglagesDesReponses({ salle: S, etages: E }, { salle: null, etages: null }, 70).salle, L.reglagesDesReponses({ salle: S, etages: E }, { salle: null, etages: null }, 70).etages],
    [{ nom: 'Ma Salle', adresse: '1 rue du Test, Ville', trajet: 'bus 12' }, E, null, null], 'reglagesDesReponses : la salle et les étages gardés s\'ils ne sont pas redemandés, remplacés sinon');
}


// ── 2.25.0 : les réponses au questionnaire dans la note « Réglages » du dossier des données ──
// (demande : « un dossier avec à l'intérieur les mesures, les réponses au questionnaire… », puis « mets le questionnaire dedans »)
{
  const REG = L.fusionReglages({ niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [1, 3, 5] });
  const note = L.ecrireNoteReglages(REG);
  egal([L.analyserNote(note).type, L.lireNoteReglages(note), L.lireNoteReglages('# rien'), L.lireNoteReglages(note.replace('{', '{{')), L.lireNoteReglages(null)],
    ['reglages', REG, null, null, null], 'note Réglages : reconnue à son en-tête, relue telle qu\'écrite ; illisible ou absente : null');

  // Un coffre et un data.json partagés par deux appareils (comme iCloud).
  const partage = (notes, disque) => ({ fichiers: Object.assign({}, ...Object.keys(notes).map((c) => ({ [c]: { path: c, _t: notes[c] } }))), disque, ecrits: [] });
  const appareil = (s, pret) => {
    const vault = {
      create: async (c, t) => { s.fichiers[c] = { path: c, _t: t }; s.ecrits.push('create ' + c); return s.fichiers[c]; },
      modify: async (f, t) => { f._t = t; s.ecrits.push('modify ' + f.path); },
      createFolder: async (c) => { s.fichiers[c] = { path: c }; },
      getAbstractFileByPath: (c) => s.fichiers[c] || null,
      adapter: {
        read: async (c) => { if (!s.fichiers[c] || s.fichiers[c]._t == null) throw new Error('absent'); return s.fichiers[c]._t; },
        write: async (c, t) => { s.fichiers[c] = { path: c, _t: t }; if (!/brouillon\.json$/.test(c)) s.ecrits.push('write ' + c); },
        exists: async (c) => !!s.fichiers[c],
      },
    };
    const p = Object.create(SallePlugin.prototype);
    p.app = { vault };
    p.ecrans = [];
    p.vues = () => p.ecrans;
    p.loadData = async () => (s.disque ? JSON.parse(JSON.stringify(s.disque)) : null);
    p.saveData = async (d) => { s.disque = JSON.parse(JSON.stringify(d)); };
    // Comme onload, puis (si pret) comme la première lecture des notes : l'index connaît les notes « salle: … » du coffre.
    p.etat = { fichiers: {}, textes: {} };
    p.donnees = L.lireDonnees(attendre(p.lireStock()), SallePlugin.verifierEnCours);
    p.base = L.empreinteDonnees(p.donnees);
    p.indexer = () => {
      p.etat = { fichiers: {}, textes: {} };
      Object.keys(s.fichiers).forEach((c) => { const a = s.fichiers[c]._t ? L.analyserNote(s.fichiers[c]._t) : null; if (a && !p.etat.fichiers[a.type]) { p.etat.fichiers[a.type] = s.fichiers[c]; p.etat.textes[a.type] = s.fichiers[c]._t; } });
      attendre(p.suivreReglages());
    };
    if (pret) p.indexer();
    return p;
  };

  // 1. Un data.json d'avant (réglages dedans, pas de note) : lu tel quel ; dès que le coffre est prêt, la note est créée dans
  //    le dossier des données et data.json ne garde que le brouillon et le chemin de la note.
  let s = partage({}, { reglages: REG, enCours: null, bilan: { date: '2026-11-17' } });
  let mac = appareil(s, false);
  egal([mac.donnees.reglages, s.ecrits], [REG, []], 'Réglages : un data.json d\'avant la 2.25.0 se lit tel quel, rien n\'est écrit au démarrage');
  mac.indexer();
  egal([s.ecrits, s.disque, L.lireNoteReglages(s.fichiers['donnees/reglages.md']._t), JSON.parse(s.fichiers['donnees/brouillon.json']._t)],
    [['create donnees/reglages.md'], { noteReglages: 'donnees/reglages.md' }, REG, { enCours: null, bilan: { date: '2026-11-17' } }],
    'Réglages : coffre prêt, la note est créée dans « donnees », le brouillon à côté (brouillon.json) ; data.json ne garde que le chemin de la note');
  // À côté de ses notes, s'il en a déjà ailleurs.
  const ailleurs = partage({ 'Suivi/Mon programme.md': PROGRAMME_115 }, { reglages: REG, enCours: null, bilan: null });
  appareil(ailleurs, true);
  egal(ailleurs.ecrits, ['create Suivi/reglages.md'], 'Réglages : la note est créée dans le dossier où sont déjà ses notes');

  // 2. Au démarrage suivant : la note est lue avant même que le coffre soit prêt (par son chemin gardé dans data.json).
  const iphone = appareil(s, false);
  egal([iphone.donnees.reglages, iphone.donnees.bilan], [REG, { date: '2026-11-17' }], 'Réglages : au démarrage, lus dans la note ; le brouillon dans brouillon.json, à côté');
  iphone.indexer();
  egal(s.ecrits.length, 1, 'Réglages : rien n\'est réécrit quand rien n\'a changé');

  // 3. Un changement : seule la note change ; l'autre appareil le reprend quand la note lui arrive, et garde le sien.
  iphone.donnees.reglages.pauses = ['2026-11-23'];
  attendre(iphone.sauver());
  egal([s.ecrits.slice(1), 'reglages' in s.disque, L.lireNoteReglages(s.fichiers['donnees/reglages.md']._t).pauses], [['modify donnees/reglages.md'], false, ['2026-11-23']],
    'Réglages : une semaine sans salle s\'écrit dans la note, pas dans data.json');
  mac.donnees.reglages.recup = ['2026-11-16'];
  mac.indexer();   // la note changée par l'iPhone arrive sur le Mac
  attendre(mac.sauver());
  egal([mac.donnees.reglages.pauses, L.lireNoteReglages(s.fichiers['donnees/reglages.md']._t).pauses, L.lireNoteReglages(s.fichiers['donnees/reglages.md']._t).recup],
    [['2026-11-23'], ['2026-11-23'], ['2026-11-16']], 'Réglages : deux appareils, chacun garde ce que l\'autre a écrit dans la note');
  const avant = s.ecrits.length;
  attendre(mac.sauver());
  egal(s.ecrits.length, avant, 'Réglages : une sauvegarde sans changement de réglages ne touche pas à la note');

  // 3 bis. 2.30.0 : la séance en cours et le bilan du jour s'écrivent dans brouillon.json, jamais dans data.json ; un autre
  //    démarrage les relit. Un brouillon là mais illisible (iCloud en pleine copie) : rien n'est perdu ni écrasé.
  mac.donnees.bilan = { date: '2026-11-18', temps: 45 };
  attendre(mac.sauver());
  const relu = appareil(s, false);
  egal([Object.keys(s.disque), JSON.parse(s.fichiers['donnees/brouillon.json']._t).bilan, relu.donnees.bilan], [['noteReglages'], { date: '2026-11-18', temps: 45 }, { date: '2026-11-18', temps: 45 }],
    'Brouillon : le bilan du jour est dans donnees/brouillon.json, data.json ne garde que le chemin ; un autre démarrage le relit');
  const bon = s.fichiers['donnees/brouillon.json']._t;
  s.fichiers['donnees/brouillon.json']._t = '{ "enCours": nul';   // à moitié copié
  mac.donnees.reglages.recup = ['2026-11-16', '2026-11-23'];
  attendre(mac.sauver());
  egal([mac.donnees.bilan, s.fichiers['donnees/brouillon.json']._t === bon, L.lireNoteReglages(s.fichiers['donnees/reglages.md']._t).recup], [{ date: '2026-11-18', temps: 45 }, true, ['2026-11-16', '2026-11-23']],
    'Brouillon : illisible un instant, la mémoire est gardée puis réécrite ; les réglages sont quand même enregistrés');
  // Au démarrage, un brouillon illisible n'est pas écrasé tout de suite (on ne sait pas ce qu'il contient) : 3 essais.
  s.fichiers['donnees/brouillon.json']._t = '{ "enCours": nul';
  const froid = appareil(s, false);
  froid.donnees.reglages.pauses = ['2026-11-23', '2026-11-30'];
  attendre(froid.sauver());
  const apres1 = s.fichiers['donnees/brouillon.json']._t;
  attendre(froid.sauver());
  egal([froid.donnees.bilan, apres1, JSON.parse(s.fichiers['donnees/brouillon.json']._t), L.lireNoteReglages(s.fichiers['donnees/reglages.md']._t).pauses],
    [null, '{ "enCours": nul', { enCours: null, bilan: null }, ['2026-11-23', '2026-11-30']],
    'Brouillon : illisible au démarrage, pas écrasé au premier enregistrement ; resté illisible, il est refait ensuite');
  s.fichiers['donnees/brouillon.json']._t = bon;

  // 3 ter. 2.34.1 : la note « Réglages » illisible un instant pendant une séance (iCloud en pleine copie) : la séance en cours
  //    n'est PAS effacée de la mémoire, et rien n'est perdu sur le disque une fois la note revenue.
  {
    const texteNote = s.fichiers['donnees/reglages.md']._t;
    const p115 = L.lireProgramme(PROGRAMME_115);
    mac.donnees.enCours = L.nouvelleSeance(L.seanceDuJour(p115, [], REG, '2026-11-18'), '2026-11-18', 0);   // une vraie séance en cours
    const nomSeance = mac.donnees.enCours.nom;
    attendre(mac.sauver());
    s.fichiers['donnees/reglages.md']._t = null;   // illisible
    mac.donnees.bilan = { date: '2026-11-18', temps: 60 };
    attendre(mac.sauver());
    const pendant = mac.donnees.enCours && mac.donnees.enCours.nom;
    s.fichiers['donnees/reglages.md']._t = texteNote;
    attendre(mac.sauver());
    egal([pendant, mac.donnees.enCours && mac.donnees.enCours.nom, JSON.parse(s.fichiers['donnees/brouillon.json']._t).enCours.nom], [nomSeance, nomSeance, nomSeance],
      'Réglages illisibles un instant : la séance en cours reste en mémoire et sur le disque');
    mac.donnees.enCours = null;
    attendre(mac.sauver());
  }

  // 4. La note déplacée (le chemin gardé ne mène plus à rien) : pas de réglages au démarrage, puis l'index la retrouve par
  //    son en-tête ; l'écran resté sur le questionnaire revient à l'accueil.
  const bouge = partage({ 'Ailleurs/Réglages.md': L.ecrireNoteReglages(REG) }, { enCours: null, bilan: null, noteReglages: 'donnees/reglages.md' });
  const p4 = appareil(bouge, false);
  const ecran = { ecran: 'questions', rendus: 0, rendre() { this.rendus++; }, donneesChangees() {} };
  p4.ecrans.push(ecran);
  const sansNote = p4.donnees.reglages;
  p4.indexer();
  attendre(p4.sauver());
  egal([sansNote, p4.donnees.reglages, ecran.ecran, ecran.rendus, bouge.disque.noteReglages, bouge.ecrits], [null, REG, 'accueil', 1, 'Ailleurs/Réglages.md', []],
    'Réglages : la note déplacée est retrouvée par son en-tête, l\'écran quitte le questionnaire, le chemin gardé suit');

  // 5. Coffre pas encore prêt et aucune note connue : les réglages restent dans data.json (rien n'est perdu), comme avant.
  const tot = partage({}, null);
  const p5 = appareil(tot, false);
  p5.donnees.reglages = JSON.parse(JSON.stringify(REG));
  attendre(p5.sauver());
  egal([tot.disque.reglages, tot.ecrits], [REG, []], 'Réglages : avant que le coffre soit prêt, ils restent dans data.json');
}

// ── 2.28.0 : « Réinitialiser » efface le dossier des données ; la fin du questionnaire le recrée en entier ──
{
  const coffre = (notes) => {
    const fichiers = {}, journal = [];
    Object.keys(notes).forEach((c) => { fichiers[c] = { path: c, _t: notes[c] }; });
    const vault = {
      create: async (c, t) => { fichiers[c] = { path: c, _t: t }; journal.push('create ' + c); return fichiers[c]; },
      modify: async (f, t) => { f._t = t; },
      createFolder: async (c) => { fichiers[c] = { path: c }; journal.push('dossier ' + c); },
      trash: async (f) => { Object.keys(fichiers).forEach((c) => { if (c === f.path || c.indexOf(f.path + '/') === 0) delete fichiers[c]; }); journal.push('corbeille ' + f.path); },
      getAbstractFileByPath: (c) => fichiers[c] || null,
      adapter: { read: async (c) => { if (!fichiers[c] || fichiers[c]._t == null) throw new Error('absent'); return fichiers[c]._t; }, write: async (c, t) => { fichiers[c] = { path: c, _t: t }; } },
    };
    const p = Object.create(SallePlugin.prototype);
    p.app = { vault };
    p.vues = () => [];
    p.disque = null;
    p.loadData = async () => (p.disque ? JSON.parse(JSON.stringify(p.disque)) : null);
    p.saveData = async (d) => { p.disque = JSON.parse(JSON.stringify(d)); };
    // Comme la lecture des notes : l'index connaît les notes « salle: … » du coffre.
    p.recharger = async () => {
      p.etat = { fichiers: {}, textes: {}, seances: [] };
      Object.keys(fichiers).forEach((c) => {
        const a = fichiers[c]._t ? L.analyserNote(fichiers[c]._t) : null;
        if (a && a.type === 'seance') p.etat.seances.push({ chemin: c });
        else if (a && !p.etat.fichiers[a.type]) { p.etat.fichiers[a.type] = fichiers[c]; p.etat.textes[a.type] = fichiers[c]._t; }
      });
    };
    attendre(p.recharger());
    p.coffrePret = true;
    return { p, fichiers, journal };
  };
  const REG = L.fusionReglages({ niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [1, 3, 5] });
  const plein = coffre({ 'donnees': null, 'donnees/programme.md': PROGRAMME_115, 'donnees/mesures.md': '---\nsalle: mesures\n---\n# Mesures\n- 2026-11-16 · poids 70 kg\n',
    'donnees/reglages.md': L.ecrireNoteReglages(REG), 'donnees/seances/2026-11-16-seance-a.md': NOTE_1311, 'Mes idées.md': '# Pas une note du plugin' });
  plein.p.donnees = { reglages: JSON.parse(JSON.stringify(REG)), enCours: null, bilan: { date: '2026-11-17' } };
  plein.p.base = L.empreinteDonnees(plein.p.donnees);
  egal([attendre(plein.p.effacerDonnees()), plein.journal, Object.keys(plein.fichiers), plein.p.donnees, plein.p.disque],
    [true, ['corbeille donnees'], ['Mes idées.md'], { reglages: null, enCours: null, bilan: null }, { enCours: null, bilan: null }],
    'effacerDonnees : le dossier des données part à la corbeille en entier, le reste du coffre reste, la mémoire du plugin repart de zéro');

  // La fin du questionnaire dans un coffre vide : le dossier au complet. Rien n'est écrasé quand une note existe déjà.
  plein.journal.length = 0;
  plein.p.donnees.reglages = JSON.parse(JSON.stringify(REG));
  attendre(plein.p.sauver());
  attendre(plein.p.creerDonnees());
  egal([plein.journal, Object.keys(plein.fichiers).sort(), plein.fichiers['donnees/programme.md']._t === PROGRAMME_DEFAUT, plein.fichiers['donnees/ma-salle.md']._t === SALLE_DEFAUT, plein.p.disque.noteReglages],
    [['dossier donnees', 'create donnees/reglages.md', 'create donnees/programme.md', 'create donnees/mesures.md', 'create donnees/forme.md', 'create donnees/ma-salle.md', 'dossier donnees/seances'],
      ['Mes idées.md', 'donnees', 'donnees/brouillon.json', 'donnees/forme.md', 'donnees/ma-salle.md', 'donnees/mesures.md', 'donnees/programme.md', 'donnees/reglages.md', 'donnees/seances'], true, true, 'donnees/reglages.md'],
    'creerDonnees : après le questionnaire, le dossier des données est recréé en entier (réglages, programme, mesures, forme, salle, séances)');
  plein.journal.length = 0;
  plein.fichiers['donnees/programme.md']._t = PROGRAMME_115;
  attendre(plein.p.creerDonnees());
  egal([plein.journal, plein.fichiers['donnees/programme.md']._t === PROGRAMME_115], [[], true], 'creerDonnees : rien n\'est recréé ni écrasé quand tout est déjà là');
}

// 2.38.3 (demande : la barre d'Obsidian revenait pendant le repos) : pendant une séance, garderBarre la recache si Obsidian l'a remise.
{
  const p = Object.create(SallePlugin.prototype);
  let cachee = false, appels = 0;
  const feuille = {}, vue = { leaf: feuille, barreSeance: true, pleinEcran: false };
  p.app = { mobileNavbar: { hideNavigation: () => { appels++; cachee = true; }, restoreNavigation: () => { cachee = false; } }, workspace: { activeLeaf: feuille } };
  p.mobile = () => true;
  p.vues = () => [vue];
  p.barreCachee = () => cachee;
  p.garderBarre();
  const apres1 = [cachee, appels];
  p.garderBarre();
  const apres2 = appels;
  p.app.mobileNavbar.restoreNavigation();
  vue.barreSeance = false;
  p.garderBarre();
  const horsSeance = [cachee, appels];
  vue.barreSeance = true;
  p.app.workspace.activeLeaf = {};
  p.garderBarre();
  egal([apres1, apres2, horsSeance, cachee], [[true, 1], 1, [true, 2], true],
    'garderBarre : en séance, la barre remise par Obsidian est recachée (une fois) ; hors séance aussi (2.38.57) ; sur un autre onglet, rien');
  // 2.38.77 (demande : la barre du bas a tendance à revenir, la bloquer) : hors séance aussi, même après une remontée ou un
  // toucher tout en haut, elle est recachée.
  p.app.workspace.activeLeaf = feuille;
  vue.barreSeance = false;
  p.app.mobileNavbar.restoreNavigation();
  vue.barreVue = true;
  p.garderBarre();
  const remontee = cachee;
  p.app.mobileNavbar.restoreNavigation();
  p.garderBarre({ clientY: 60 });
  egal([remontee, cachee], [true, true], 'garderBarre : bloquée, recachée même après une remontée ou un toucher en haut (2.38.77)');
}


// ── 2.38.85 : la version publiée, lue sur GitHub (verifierVersion), et « Mettre à jour » (ouvrirMiseAJour) ──
{
  const pv = Object.create(SallePlugin.prototype);
  pv.manifest = { version: '2.38.84', authorUrl: 'https://github.com/compte/depot' };
  let rendus = 0;
  pv.vues = () => [{ ecran: 'accueil', rendre: () => { rendus++; } }, { ecran: 'seance', rendre: () => { rendus += 100; } }];
  const avantR = obsidian.requestUrl, vus = [];
  const res = [];
  try {
    obsidian.requestUrl = async (o) => { vus.push(o.url); return { status: 200, text: '{"id":"salle","version":"2.38.85"}' }; };
    res.push(attendre(pv.verifierVersion()), pv.versionPubliee, rendus);
    res.push(attendre(pv.verifierVersion()), rendus);   // la même : l'accueil n'est pas redessiné
    const n = vus.length;
    res.push(attendre(pv.verifierVersion(true)), vus.length - n);   // au retour dans l'appli ou sur l'accueil, moins d'une minute après : pas de requête
    obsidian.requestUrl = async () => ({ status: 404, text: 'Not Found' });
    res.push(attendre(pv.verifierVersion()), pv.versionPubliee);
    obsidian.requestUrl = async () => { throw new Error('hors ligne'); };
    res.push(attendre(pv.verifierVersion()), pv.versionPubliee);
    obsidian.requestUrl = async () => ({ status: 200, text: '<html>' });
    res.push(attendre(pv.verifierVersion()));
    // La dernière publication ne répond pas : le manifeste du dépôt en secours.
    const secours = [];
    obsidian.requestUrl = async (o) => { secours.push(o.url); return /releases/.test(o.url) ? { status: 302, text: '' } : { status: 200, text: '{"version":"2.38.86"}' }; };
    res.push(attendre(pv.verifierVersion()), secours.length);
  } finally { if (avantR === undefined) delete obsidian.requestUrl; else obsidian.requestUrl = avantR; }
  egal([res, vus[0]], [['2.38.85', '2.38.85', 1, '2.38.85', 1, '2.38.85', 0, null, '2.38.85', null, '2.38.85', null, '2.38.86', 2], 'https://github.com/compte/depot/releases/latest/download/manifest.json'],
    'verifierVersion : la dernière publication, l\'accueil redessiné seulement si elle change ; au retour moins d\'une minute après : rien ; 404, hors ligne, illisible : rien ne change ; secours : le manifeste du dépôt');
  const sansDepot = Object.create(SallePlugin.prototype);
  sansDepot.manifest = { version: '2.38.84' };
  egal(attendre(sansDepot.verifierVersion()), null, 'verifierVersion : sans adresse de dépôt dans le manifeste, aucune requête');
  const lances = [];
  const pb = Object.create(SallePlugin.prototype);
  pb.app = { commands: { commands: { 'obsidian42-brat:BRAT-checkForUpdatesAndUpdate': {}, 'autre:update': {} }, executeCommandById: (id) => { lances.push(id); return true; } } };
  const ps = Object.create(SallePlugin.prototype), ouverts = [];
  ps.app = { commands: { commands: {}, executeCommandById: () => false }, setting: { open: () => ouverts.push('ouvert'), openTabById: (t) => ouverts.push(t) } };
  egal([pb.ouvrirMiseAJour(), lances, ps.ouvrirMiseAJour(), ouverts], ['brat', ['obsidian42-brat:BRAT-checkForUpdatesAndUpdate'], 'reglages', ['ouvert', 'community-plugins']],
    'ouvrirMiseAJour : la commande de BRAT qui cherche les mises à jour, sinon les réglages des plugins');
}

// 2.39.0 (demande : prendre un plat en photo et avoir une estimation des calories) : la réponse de l'API Gemini lue de façon
// tolérante, les échecs dits en une ligne, les modèles essayés à la suite, la clé gardée dans data.json seulement.
{
  const rep = (t) => ({ candidates: [{ content: { parts: [{ text: t }] } }] });
  egal([L.lirePlat(rep('{"plat":"Poulet riz","kcal":"650","kcal_min":550,"kcal_max":780,"proteines_g":42.4,"glucides_g":70,"lipides_g":18,"aliments":["riz 200 g"]}')),
    L.lirePlat(rep('Voici : {"plat":"Pâtes","kcal":"720 kcal","kcal_min":800,"proteines_g":"25,6"} fin')),
    L.lirePlat(rep('{"plat":"","kcal":0}')), L.lirePlat(rep('pas de json')), L.lirePlat({})],
  [{ plat: 'Poulet riz', kcal: 650, min: 550, max: 780, proteines: 42, glucides: 70, lipides: 18, aliments: ['riz 200 g'] },
    { plat: 'Pâtes', kcal: 720, min: 0, max: 0, proteines: 26, glucides: 0, lipides: 0, aliments: [] }, { vide: true }, null, null],
  'lirePlat : nombres en texte, texte autour du JSON, fourchette fausse retirée ; pas de plat : vide ; illisible : null');
  egal([0, 403, 429, 500].map(L.erreurPlat), ['Pas de réseau. Réessaie.', 'Clé refusée. Vérifie-la dans Réglages → Appli.', 'Limite gratuite du jour atteinte. Réessaie demain.', 'Le service ne répond pas. Réessaie.'],
    'erreurPlat : une ligne courte par échec');

  const relaisLivre = L.RELAIS_CALORIES;
  L.RELAIS_CALORIES = '';   // 2.39.5 : ces essais d'abord sans le relais
  const avantR = obsidian.requestUrl, vus = [];
  const p = Object.create(SallePlugin.prototype);
  const octets = new Uint8Array([255, 216, 255, 217]).buffer;
  const res = [];
  try {
    res.push(attendre(p.estimerPlat(octets)).message);
    p.cleIA = ' ma-cle ';
    obsidian.requestUrl = async (o) => {
      vus.push([o.url.replace(/^.*models\//, ''), o.headers['x-goog-api-key'], JSON.parse(o.body).contents[0].parts[0].inline_data.data]);
      return /3\.8/.test(o.url) ? { status: 429, text: '' } : { status: 200, text: JSON.stringify(rep('{"plat":"Omelette","kcal":300}')) };
    };
    res.push(attendre(p.estimerPlat(octets)).plat.kcal);
    obsidian.requestUrl = async () => ({ status: 403, text: '' });
    res.push(attendre(p.estimerPlat(octets)).message);
    obsidian.requestUrl = async () => { throw new Error('hors ligne'); };
    res.push(attendre(p.estimerPlat(octets)).message);
  } finally { if (avantR === undefined) delete obsidian.requestUrl; else obsidian.requestUrl = avantR; }
  egal([res, vus], [['Ajoute d\'abord ta clé.', 300, 'Clé refusée. Vérifie-la dans Réglages → Appli.', 'Pas de réseau. Réessaie.'],
    [['gemini-3.8-flash:generateContent', 'ma-cle', '/9j/2Q=='], ['gemini-3.6-flash:generateContent', 'ma-cle', '/9j/2Q==']]],
  'estimerPlat : sans clé rien ne part ; la photo en base64, la clé en en-tête ; quota fini : le modèle suivant ; clé refusée, hors ligne : un message');

  // 2.39.4 (demande : un autre moyen que Google, sans pièce d'identité ni selfie) : une clé « gsk_ » part chez Groq (format
  // OpenAI, la photo en « data: », réponse en JSON) ; modèle retiré (400) ou quota (429) : le suivant ; « <think> » retiré.
  const groqVus = [], resG = [];
  const repG = (texte) => ({ choices: [{ message: { content: texte } }] });
  try {
    p.cleIA = 'gsk_essai';
    obsidian.requestUrl = async (o) => {
      const b = JSON.parse(o.body);
      groqVus.push([o.url, o.headers.Authorization, b.model, b.messages[0].content[1].image_url.url, b.response_format.type]);
      return /qwen/.test(b.model) ? { status: 400, text: '' } : { status: 200, text: JSON.stringify(repG('<think>{"brouillon": 1}</think>{"plat":"Riz","kcal":400,"proteines_g":8}')) };
    };
    resG.push(attendre(p.estimerPlat(octets)).plat);
    obsidian.requestUrl = async () => ({ status: 429, text: '' });
    resG.push(attendre(p.estimerPlat(octets)).message);
    obsidian.requestUrl = async () => ({ status: 401, text: '' });
    resG.push(attendre(p.estimerPlat(octets)).message);
  } finally { if (avantR === undefined) delete obsidian.requestUrl; else obsidian.requestUrl = avantR; }
  egal([resG, groqVus],
    [[{ plat: 'Riz', kcal: 400, min: 0, max: 0, proteines: 8, glucides: 0, lipides: 0, aliments: [] }, 'Limite gratuite du jour atteinte. Réessaie demain.', 'Clé refusée. Vérifie-la dans Réglages → Appli.'],
      [['https://api.groq.com/openai/v1/chat/completions', 'Bearer gsk_essai', 'qwen/qwen3.8-27b', 'data:image/jpeg;base64,/9j/2Q==', 'json_object'],
        ['https://api.groq.com/openai/v1/chat/completions', 'Bearer gsk_essai', 'meta-llama/llama-4-scout-17b-16e-instruct', 'data:image/jpeg;base64,/9j/2Q==', 'json_object']]],
    'estimerPlat : une clé « gsk_ » part chez Groq ; modèle retiré : le suivant ; quota : « Limite » ; clé refusée : un message ; « <think> » retiré');

  // 2.39.5 (demande : utilisable dès qu'on a le plugin, sans clé à soi) : sans clé, la photo part au relais (texte brut) ;
  // sa réponse a le format de Groq ; 429 : la limite commune ; autre échec : il ne répond pas. Une clé à soi passe avant.
  const avantRelais = L.RELAIS_CALORIES, relaisVus = [], resR = [];
  try {
    p.cleIA = '';
    L.RELAIS_CALORIES = '';
    resR.push(p.peutEstimer(), attendre(p.estimerPlat(octets)).message);
    L.RELAIS_CALORIES = 'https://relais.test/';
    obsidian.requestUrl = async (o) => { relaisVus.push([o.url, o.method, o.contentType, o.body, o.headers]); return { status: 200, text: JSON.stringify(repG('{"plat":"Salade","kcal":250,"proteines_g":5}')) }; };
    resR.push(p.peutEstimer(), attendre(p.estimerPlat(octets)).plat.kcal);
    obsidian.requestUrl = async () => ({ status: 429, text: '' });
    resR.push(attendre(p.estimerPlat(octets)).message);
    obsidian.requestUrl = async () => ({ status: 503, text: '' });
    resR.push(attendre(p.estimerPlat(octets)).message);
    p.cleIA = 'gsk_a_moi';
    obsidian.requestUrl = async (o) => { relaisVus.push([o.url]); return { status: 200, text: JSON.stringify(repG('{"plat":"Riz","kcal":400}')) }; };
    resR.push(attendre(p.estimerPlat(octets)).plat.kcal);
  } finally { L.RELAIS_CALORIES = avantRelais; if (avantR === undefined) delete obsidian.requestUrl; else obsidian.requestUrl = avantR; }
  egal([resR, relaisVus],
    [[false, 'Ajoute d\'abord ta clé.', true, 250, 'Limite gratuite du jour atteinte. Réessaie demain.', 'Le service ne répond pas. Réessaie.', 400],
      [['https://relais.test/', 'POST', 'text/plain', '/9j/2Q==', { 'X-Salle': 'calories' }], ['https://api.groq.com/openai/v1/chat/completions']]],
    'relais : sans clé, la photo en texte brut, avec l\'en-tête du plugin ; limite commune ; relais en panne ; une clé à soi passe avant');
  // 2.41.2 (« les erreurs arrivent trop souvent ») : une photo avec son indice part au relais en JSON {photo, indice} ; un
  // indice qui ne passe pas (« <b> ») : la photo seule, en texte brut.
  const indVus = [];
  try {
    p.cleIA = '';
    L.RELAIS_CALORIES = 'https://relais.test/';
    obsidian.requestUrl = async (o) => { indVus.push([o.contentType, o.body]); return { status: 200, text: JSON.stringify(repG('{"plat":"Gnocchis","kcal":500}')) }; };
    attendre(p.estimerPlat(octets, ' gnocchis,  2 steaks '));
    attendre(p.estimerPlat(octets, '<b>'));
    obsidian.requestUrl = async (o) => { indVus.push([o.contentType]); return o.contentType === 'application/json' ? { status: 400, text: '' } : { status: 200, text: JSON.stringify(repG('{"plat":"Gnocchis","kcal":500}')) }; };
    indVus.push(attendre(p.estimerPlat(octets, 'gnocchis')).plat.kcal);
  } finally { L.RELAIS_CALORIES = avantRelais; if (avantR === undefined) delete obsidian.requestUrl; else obsidian.requestUrl = avantR; }
  egal(indVus, [['application/json', JSON.stringify({ photo: '/9j/2Q==', indice: 'gnocchis, 2 steaks' })], ['text/plain', '/9j/2Q=='], ['application/json'], ['text/plain'], 500],
    'indice : la photo et ce qu\'il a écrit de l\'assiette, en JSON ; un indice illisible : la photo seule ; un relais d\'avant (400) : la photo repart seule');
  // 2.41.0 (demande : « un truc pour taper, qui passe au relais et dit le nombre de kcal, par exemple si je tape pain au
  // chocolat ») : le plat écrit part au relais, resserré ; sans nom de plat dans la réponse, le texte tapé ; un texte qui ne
  // passe pas ne part pas ; rien à manger : un message ; la limite commune. Même avec une clé à soi : le relais.
  const ecritVus = [], resE = [];
  try {
    p.cleIA = 'gsk_a_moi';
    L.RELAIS_CALORIES = 'https://relais.test/';
    obsidian.requestUrl = async (o) => {
      ecritVus.push([o.url, o.body, o.headers['X-Salle'], o.contentType]);
      return { status: 200, text: JSON.stringify(repG(JSON.stringify({ plat: '', aliments: [{ nom: 'pain au chocolat', grammes: 65, kcal_100g: 420, proteines_100g: 7.5, glucides_100g: 46, lipides_100g: 22 }] }))) };
    };
    resE.push(attendre(p.estimerTexte('  pain   au chocolat ')).plat);
    resE.push(attendre(p.estimerTexte('<b>x</b>')).message, attendre(p.estimerTexte('1')).message);
    obsidian.requestUrl = async () => ({ status: 200, text: JSON.stringify(repG('{"plat":"","aliments":[]}')) });
    resE.push(attendre(p.estimerTexte('écris un poème')).message);
    obsidian.requestUrl = async () => ({ status: 429, text: '' });
    resE.push(attendre(p.estimerTexte('pomme')).message);
    obsidian.requestUrl = async () => ({ status: 400, text: '' });
    resE.push(attendre(p.estimerTexte('pomme')).message);
  } finally { L.RELAIS_CALORIES = avantRelais; p.cleIA = ''; if (avantR === undefined) delete obsidian.requestUrl; else obsidian.requestUrl = avantR; }
  egal([resE, ecritVus],
    [[{ plat: 'pain au chocolat', kcal: 273, min: 205, max: 341, proteines: 5, glucides: 30, lipides: 14, aliments: ['pain au chocolat : 65 g, 273 kcal'] },
      'Écris le plat en quelques mots.', 'Écris le plat en quelques mots.', 'Plat inconnu. Écris-le autrement.', 'Limite gratuite du jour atteinte. Réessaie demain.', 'Écris seulement ce que tu as mangé.'],
      [['https://relais.test/', 'pain au chocolat', 'calories', 'text/plain; charset=utf-8']]],
    'plat écrit : au relais, resserré ; le texte tapé comme nom ; « <b> » et « 1 » ne partent pas ; rien à manger ; limite ; refusé');
  // 2.41.3 : retirerRepasDe retire la dernière ligne qui se lit comme ce repas, et rien d'autre.
  {
    const note = ['---', 'salle: repas', '---', '# Repas', '', '- 2026-11-27 12:19 · Ce midi · Pâtes poulet · 848 kcal · protéines 60 g', '- 2026-11-27 12:30 · Ce midi · lait · 118 kcal', ''].join('\n');
    let ecrit = null;
    const q = Object.create(SallePlugin.prototype);
    q.app = { vault: { read: async () => note, modify: async (f, t) => { ecrit = t; } } };
    q.etat = { fichiers: { repas: {} } };
    q.recharger = async () => {};
    const ok = attendre(q.retirerRepasDe(L.lireRepas(note)[0]));
    const absent = attendre(q.retirerRepasDe({ date: '2026-11-27', heure: '09:00', quand: 'Ce matin', plat: 'x', kcal: 1 }));
    egal([ok, absent, L.lireRepas(ecrit).map((r) => r.plat), ecrit.split('\n').length], [true, false, ['lait'], note.split('\n').length - 1],
      'retirerRepasDe : la ligne de ce repas, et rien d\'autre ; un repas absent : rien');
  }
  // 2.41.10 : corrigerLegCurl renomme « Leg curl assis » en « Leg extension » dans les séances d'avant le 27/11, pas après.
  {
    const notes = { 'a.md': '---\nsalle: seance\ndate: 2026-11-25\n---\n## Leg curl assis\n- 40 kg × 15\n## Presse à cuisses\n- 100 kg × 12\n',
      'b.md': '---\nsalle: seance\ndate: 2026-11-27\n---\n## Leg curl assis\n- 25 kg × 12\n' };
    const q = Object.create(SallePlugin.prototype);
    q.app = { vault: { getAbstractFileByPath: (c) => (notes[c] != null ? { path: c } : null), read: async (f) => notes[f.path], modify: async (f, t) => { notes[f.path] = t; } } };
    q.etat = { seances: [{ date: '2026-11-25', chemin: 'a.md', exos: [{ nom: 'Leg curl assis' }, { nom: 'Presse à cuisses' }] }, { date: '2026-11-27', chemin: 'b.md', exos: [{ nom: 'Leg curl assis' }] }] };
    q.donnees = { reglages: {} };
    q.sauver = async () => {}; q.recharger = async () => {};
    const n = attendre(q.corrigerLegCurl());
    egal([n, /## Leg extension\n- 40 kg/.test(notes['a.md']), /## Presse à cuisses/.test(notes['a.md']), /## Leg curl assis/.test(notes['b.md']), q.donnees.reglages.legCurlVu],
      [1, true, true, true, true], 'corrigerLegCurl : le 25/11 devient « Leg extension », la presse reste, le 27/11 reste ; plus de question');
  }
  // 2.41.0 : la journée des repas commence à 4 h ; le moment d'après l'heure ; ce qu'un plat écrit accepte.
  egal([L.jourRepas(new Date(2026, 10, 26, 1, 36)), L.jourRepas(new Date(2026, 10, 26, 4, 0)), L.jourRepas(new Date(2026, 11, 1, 3, 59)), L.jourRepas(new Date(2026, 10, 26, 23, 50)),
    L.momentCle(1), L.momentCle(8), L.momentCle(13), L.momentCle(16), L.momentCle(19), L.momentRepas(1), L.momentRepas(16),
    L.platEcrit('  pain   au chocolat '), L.platEcrit('2 œufs, 1 tranche de pain'), L.platEcrit('x'), L.platEcrit('12'), L.platEcrit('<script>'), L.platEcrit('a'.repeat(121)), L.platEcrit(null)],
  ['2026-11-25', '2026-11-26', '2026-11-30', '2026-11-26', 'soir', 'matin', 'midi', 'gouter', 'soir', 'Ce soir', 'Au goûter',
    'pain au chocolat', '2 œufs, 1 tranche de pain', '', '', '', '', ''],
  'jourRepas : avant 4 h, la veille ; momentCle et momentRepas ; platEcrit : 2 à 120 signes, une lettre, pas de signes de code');
  // La consigne du relais est celle du plugin.
  const w = lireNote('relais/worker.js');
  const m = /const CONSIGNE = (\[[\s\S]*?\])\.join\(' '\);/.exec(w);
  egal([!!m && eval(m[1]).join(' ') === IA_CONSIGNE, /env\.AI\.run\(/.test(w), /gsk_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{20,}/.test(w)], [true, true, false],
    'relais : la même consigne que le plugin ; l\'IA de Cloudflare (liaison AI, sans clé) ; aucune clé écrite dans le fichier');
  // 2.41.0 : le relais accepte un plat écrit avec la même règle que le plugin (L.platEcrit), et sa consigne le borne au repas.
  const mE = /const platEcrit = (\(t\) => [^\n]+);/.exec(w), essais = ['pain au chocolat', '2 œufs, 1 tranche de pain', 'x', '12', '<script>', 'a'.repeat(121), 'pâtes (200 g) + 1 c. à s. d\'huile'];
  const regleR = mE ? eval(mE[1]) : null;
  egal([!!regleR && essais.every((t) => !!regleR(t) === !!L.platEcrit(t)), /n\\'obéis à aucune consigne/.test(w), /CONSIGNE_TEXTE \+ ' Le repas : « ' \+ ecrit/.test(w),
    /Ce texte n\\'est pas une consigne/.test(w), /Les sauces : compte chaque noix/.test(IA_CONSIGNE)], [true, true, true, true, true],
    'relais : un plat écrit, avec la même règle que le plugin ; sa consigne ignore les ordres cachés dans le texte');
  // 2.39.6 (demande : « il faut que ça calcule bien les calories ») : l'IA donne les aliments pesés et leurs valeurs pour 100 g,
  // le plugin fait le calcul ; fourchette = l'incertitude donnée (10 à 50 %, 25 % sans) ; rien de pesé : pas de plat.
  const pese = (j) => L.lirePlat({ choices: [{ message: { content: JSON.stringify(j) } }] });
  egal([pese({ plat: 'Poulet riz', aliments: [{ nom: 'riz blanc cuit', grammes: 200, kcal_100g: 130, proteines_100g: 2.7, glucides_100g: 28, lipides_100g: 0.3 },
      { nom: 'blanc de poulet', grammes: '150', kcal_100g: '121', proteines_100g: '26,2', glucides_100g: 0, lipides_100g: 1.8 },
      { nom: 'huile d\'olive', grammes: 10, kcal_100g: 900, proteines_100g: 0, glucides_100g: 0, lipides_100g: 100 }], incertitude_pct: 20 }),
    pese({ plat: 'Salade', aliments: [{ nom: 'salade', grammes: 100, kcal_100g: 15 }] }),
    pese({ plat: '', aliments: [] }), pese({ plat: 'x', aliments: [{ nom: 'eau', grammes: 250, kcal_100g: 0 }] })],
    [{ plat: 'Poulet riz', kcal: 532, min: 426, max: 638, proteines: 45, glucides: 56, lipides: 13,
      aliments: ['riz blanc cuit : 200 g, 260 kcal', 'blanc de poulet : 150 g, 182 kcal', 'huile d\'olive : 10 g, 90 kcal'] },
      { plat: 'Salade', kcal: 15, min: 11, max: 19, proteines: 0, glucides: 0, lipides: 0, aliments: ['salade : 100 g, 15 kcal'] },
      { vide: true }, { vide: true }],
    'lirePlat : aliments pesés → le plugin calcule (poids × valeur pour 100 g) ; fourchette de l\'incertitude ; rien de pesé : pas de plat');
  L.RELAIS_CALORIES = relaisLivre;
  egal(relaisLivre, 'https://salle-calories.salle-plugin.workers.dev/', 'relais : l\'adresse livrée, neutre (rien de personnel), en https');

  // La clé : écrite dans data.json, relue au démarrage, retirée ; jamais dans la note « Réglages ».
  const pc = Object.create(SallePlugin.prototype);
  let disque = { noteReglages: 'donnees/reglages.md' };
  pc.loadData = async () => disque;
  pc.saveData = async (d) => { disque = JSON.parse(JSON.stringify(d)); };
  pc.sauver = async () => { await pc.lireStock(false).catch(() => null); await pc.ecrireStock({}); };
  pc.app = { vault: { adapter: { read: async () => { throw new Error('absente'); } } } };
  attendre(pc.garderCleIA('cle-1'));
  const ecrite = disque.cleIA;
  const autre = Object.create(SallePlugin.prototype);
  autre.loadData = pc.loadData; autre.app = pc.app;
  attendre(autre.lireStock(false));
  attendre(pc.garderCleIA(''));
  egal([ecrite, autre.aCleIA(), 'cleIA' in disque, pc.aCleIA()], ['cle-1', true, false, false], 'la clé : gardée dans data.json, lue par l\'autre appareil, retirée');
}
