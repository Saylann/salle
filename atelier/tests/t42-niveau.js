// Les tests du niveau (src/42-niveau.js, 2.1.0 ; ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-niveaux-contrat.md ; 2.2.0 : les paliers et le
// corps à chaque palier, en fin de fichier ; 2.10.0 : une séance manquée coûte des XP, les paliers s'atteignent par les XP). Une règle = un test. Lancés par tests/lancer.js, après
// tests/commun.js (egal, vrai). Données propres à ce fichier : un petit programme à deux séances, des séances en mars 2026
// (le lundi 02/03/2026 ouvre la semaine 1 ; aucune semaine légère par défaut ne tombe dedans).
const PROG_NIV = `---
salle: programme
---
## Séance C
- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg
- Tirage vertical prise large · 3 × 8-12 · repos 2 min · pas 2,5 kg
- Développé couché aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg
## Séance D
- Leg curl assis · 3 × 10-15 · repos 1 min 30 · pas 2,5 kg
- Élévations latérales aux haltères · 3 × 12-20 · repos 1 min 30 · pas 1 kg
- Gainage planche · 2 × 30-60 s · repos 1 min
`;
const progN = L.lireProgramme(PROG_NIV);
const REG = { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: [] };
const kr = (c, r) => ({ c, r });
const nfois = (n, x) => Array.from({ length: n }, () => Object.assign({}, x));
const SE = (date, nom, exos, plus) => Object.assign({ date, nom, exos }, plus || {});
const EX = (nom, series, reserve) => (reserve ? { nom, series, reserve } : { nom, series });
// Une séance libre de n séries, toujours pareille (ni progrès ni record d'une fois sur l'autre). 2.3.0 : partagées entre le
// dos (rowing) et les cuisses (presse), pour rester sous les 8 séries par muscle que comptent les XP [28].
const libre = (date, n, plus) => {
  const k = n == null ? 10 : n, a = Math.ceil(k / 2);
  return SE(date, 'Séance libre', [EX('Rowing à la machine à disques', nfois(a, kr(40, 10))), EX('Presse à cuisses', nfois(k - a, kr(40, 10)))].filter((e) => e.series.length), plus);
};
const cles = (x) => x.lignes.map((l) => [l.cle, l.xp]);
const xp = (s, avant, reg) => L.xpSeance(s, avant || [], progN, reg || REG);

// ── Les règles de XP (contrat : les chiffres de la demande) ──
egal(L.XP_NIVEAU, { faite: 100, courte: 50, part: 0.7, seriesMin: 10, serie: 5, progres: 25, maxProgres: 6, record: 40, maxRecords: 4, dure: 10, semaine: 150, rattrapee: 100, retour: 50,
  recup: 50, type: 550 },
  'niveau : les XP de chaque action');
egal(L.ARRET, { sans: 21, fin: 140 }, 'niveau : un arrêt ne coûte rien jusqu\'à 3 semaines, tout à 20 semaines [123, 125]');

// ── Les seuils et les paliers ──
// Base 600 (et pas 250) : avec 250, sur son programme, niveau 10 en 4 semaines (voir le commentaire de L.COURBE_NIVEAU).
egal([1, 2, 3, 4, 5, 6, 10, 15, 20].map(L.seuilNiveau), [0, 600, 1700, 3100, 4800, 6700, 16200, 31450, 49700], 'niveau : seuils, 600 × (n − 1)^1,5 arrondi à 50');
vrai(Array.from({ length: 60 }, (_, i) => i + 1).every((n) => L.seuilNiveau(n + 1) > L.seuilNiveau(n) && L.seuilNiveau(n) % 50 === 0), 'niveau : seuils croissants, multiples de 50');
egal([0, 599, 600, 1699, 1700, 16199, 16200, 49700, -5, NaN, 'x'].map(L.niveauDe), [1, 1, 2, 2, 3, 9, 10, 20, 1, 1, 1], 'niveau : le niveau d\'un total d\'XP');

// ── Séance faite : +100 (70 % des séries prévues ou 10 séries), sinon +50 ──
egal(xp(libre('2026-03-02', 10)), { total: 150, lignes: [{ texte: 'Séance faite', xp: 100, cle: 'seance', n: 1 }, { texte: '10 séries', xp: 50, cle: 'series', n: 10 }] },
  'niveau : séance libre de 10 séries, +100 et +5 par série');
egal(cles(xp(libre('2026-03-02', 6))), [['seance', 50], ['series', 30]], 'niveau : séance libre de 6 séries, +50 (rien de prévu à comparer)');
const seanceC = (date, n) => {   // les n premières séries de la séance C, dans l'ordre du programme (3 par exercice)
  const exos = [];
  progN[0].exos.forEach((e, i) => { const m = Math.max(0, Math.min(3, n - 3 * i)); if (m) exos.push(EX(e.nom, nfois(m, kr(20, 10)))); });
  return SE(date, 'Séance C', exos);
};
egal(cles(xp(seanceC('2026-03-02', 7))), [['seance', 100], ['series', 35]], 'niveau : 7 séries sur 9 prévues (78 %), +100');
egal(cles(xp(seanceC('2026-03-02', 6))), [['seance', 50], ['series', 30]], 'niveau : 6 séries sur 9 prévues (67 %), +50');
// Les séries prévues sont celles que le plugin a proposées ce jour-là : mise en route (2 séries par exercice) …
egal(cles(xp(seanceC('2026-03-02', 5), [], { niveau: 'jamais', parSemaine: 3, duree: 60 })), [['seance', 100], ['series', 25]],
  'niveau : mise en route, 5 séries sur 6 prévues, +100');
egal(cles(xp(seanceC('2026-03-02', 5))), [['seance', 50], ['series', 25]], 'niveau : même séance sans mise en route, 5 sur 9, +50');
// … et la première fois d'un exercice en 2 séries (L.preparerSeance), quand d'autres séances sont déjà notées.
egal(xp(seanceC('2026-03-04', 5), [libre('2026-03-02', 10)]).lignes[0].xp, 100, 'niveau : exercices jamais faits en 2 séries, 5 sur 6, +100');
egal(cles(xp(SE('2026-03-02', 'Cardio', [], { cardioMin: 20 }))), [['seance', 50]], 'niveau : séance de cardio seule, +50');

// ── Séries : +5 chacune, sans l'échauffement, les approches ni les séries vides ──
egal(cles(xp(SE('2026-03-02', 'Séance libre', [
  { nom: 'Échauffement', echauffement: true, series: [kr(0, 10)] },
  EX('Rowing à la machine à disques', [kr(40, 10), kr(40, 0), { s: 0 }, null, 'x']),
], { echauffement: { min: 5, nbApproches: 3 } }))), [['seance', 50], ['series', 5]], 'niveau : seules les vraies séries comptent');
egal(xp(libre('2026-03-02', 1)).lignes[1].texte, '1 série', 'niveau : « 1 série » au singulier');

// ── Progrès (+25 par exercice en hausse face à la fois d'avant) et records (+40, L.recordsDetail) ──
const avantP = [SE('2026-03-02', 'Séance libre', [EX('Presse à cuisses', [kr(60, 10), kr(60, 10)]), EX('Tirage vertical prise large', [kr(40, 10), kr(40, 10)]),
  EX('Leg curl assis', [kr(25, 10), kr(25, 10)]), EX('Curl aux haltères', [kr(8, 10), kr(8, 10)])])];
const apresP = SE('2026-03-04', 'Séance libre', [EX('Presse à cuisses', [kr(60, 11), kr(60, 10)]), EX('Tirage vertical prise large', [kr(42.5, 8), kr(42.5, 8)]),
  EX('Leg curl assis', [kr(25, 10), kr(25, 10)]), EX('Curl aux haltères', [kr(6, 12), kr(6, 12)])]);
egal(xp(apresP, avantP), { total: 220, lignes: [{ texte: 'Séance faite', xp: 50, cle: 'seance', n: 1 }, { texte: '8 séries', xp: 40, cle: 'series', n: 8 },
  { texte: '2 progrès', xp: 50, cle: 'progres', n: 2 }, { texte: '2 records', xp: 80, cle: 'records', n: 2 }] },
'niveau : +1 répétition et une charge plus lourde = 2 progrès ; pareil ou plus léger : rien ; 2 records');
egal(L.recordsDetail(apresP, avantP).length, 2, 'niveau : les records sont ceux de L.recordsDetail');
const huit = (c, r) => Array.from({ length: 8 }, (_, i) => EX(`Exercice ${i + 1}`, [kr(c, r)]));
egal(cles(xp(SE('2026-03-04', 'Séance libre', huit(20, 11)), [SE('2026-03-02', 'Séance libre', huit(20, 10))])),
  [['seance', 50], ['series', 40], ['progres', 150], ['records', 160]], 'niveau : au plus 6 progrès et 4 records comptés');
egal(cles(xp(libre('2026-03-04'), [libre('2026-03-02')])), [['seance', 100], ['series', 50]], 'niveau : la même séance qu\'avant, ni progrès ni record');
egal(xp(SE('2026-03-04', 'Séance libre', [EX('Presse à cuisses', [kr(60, 11), kr(60, 11)]), EX('Presse à cuisses', [kr(60, 12)])]), avantP).lignes.filter((l) => l.cle !== 'seance' && l.cle !== 'series'),
  [{ texte: '1 progrès', xp: 25, cle: 'progres', n: 1 }, { texte: '1 record', xp: 40, cle: 'records', n: 1 }], 'niveau : un exercice noté deux fois, un seul progrès et un seul record');
egal(xp(SE('2026-03-04', 'Séance libre', [EX('Presse à cuisses', [kr(70, 10)])]), avantP).lignes.map((l) => l.texte), ['Séance faite', '1 série', '1 progrès', '1 record'],
  'niveau : « 1 progrès », « 1 record »');

// ── Séries dures : réserve « 0 » ou « 1 ou 2 », +10 par exercice ──
egal(cles(xp(SE('2026-03-02', 'Séance libre', [EX('Presse à cuisses', [kr(60, 10)], '0'), EX('Leg curl assis', [kr(25, 10)], '1-2'),
  EX('Curl aux haltères', [kr(8, 10)], '3+'), EX('Tirage vertical prise large', [kr(40, 10)]), EX('Presse à cuisses', [kr(60, 8)], '1-2')]))),
[['seance', 50], ['series', 25], ['dures', 20]], 'niveau : 2 exercices à 2 ou moins en réserve, pas « 3 ou plus », un nom compté une fois');
egal(xp(SE('2026-03-02', 'Séance libre', [EX('Presse à cuisses', [kr(60, 10)], '0')])).lignes[2], { texte: '1 série dure', xp: 10, cle: 'dures', n: 1 }, 'niveau : « 1 série dure »');

// ── Bon retour : plus de 4 jours sans séance, +50 ──
egal(cles(xp(libre('2026-03-07'), [libre('2026-03-02')])), [['seance', 100], ['series', 50], ['retour', 50]], 'niveau : 5 jours après, « Bon retour » +50');
egal(cles(xp(libre('2026-03-06'), [libre('2026-03-02')])), [['seance', 100], ['series', 50]], 'niveau : 4 jours après, pas de bonus de retour');
egal(xp(libre('2026-03-07'), [libre('2026-03-02')]).lignes[2].texte, 'Bon retour', 'niveau : le texte « Bon retour »');

// ── La semaine : +150 à l'objectif (une fois), +100 rattrapée ; une semaine prévue sans salle ne coûte rien ──
const semaine1 = [libre('2026-03-02'), libre('2026-03-04'), libre('2026-03-06'), libre('2026-03-08')];
const parSeance = (liste, reg) => L.trier(liste).map((s, i, t) => L.xpSeance(s, t.slice(0, i), progN, reg || REG));
egal(parSeance(semaine1).map((x) => x.total), [150, 150, 300, 150], 'niveau : la 3e séance de la semaine rapporte +150, une seule fois');
egal(parSeance(semaine1)[2].lignes[2], { texte: 'Semaine à l\'objectif', xp: 150, cle: 'semaine', n: 1 }, 'niveau : le texte « Semaine à l\'objectif »');
egal(parSeance(semaine1, Object.assign({}, REG, { parSemaine: 2 })).map((x) => x.total), [150, 300, 150, 150], 'niveau : objectif à 2 : la 2e séance');
egal(parSeance(semaine1, null).map((x) => x.total), [150, 150, 300, 150], 'niveau : sans réglages, l\'objectif est 3');
// Semaine 1 : 2 séances ; semaine 2 : 4 séances. La 3e de la semaine 2 : l'objectif ; la 4e : la semaine 1 rattrapée.
const rattrapage = [libre('2026-03-02'), libre('2026-03-05'), libre('2026-03-09'), libre('2026-03-11'), libre('2026-03-13'), libre('2026-03-15')];
egal(parSeance(rattrapage).map((x) => x.total), [150, 150, 150, 150, 300, 250], 'niveau : semaine rattrapée, +100 sur la séance qui la rattrape');
egal(parSeance(rattrapage)[5].lignes[2], { texte: 'Semaine rattrapée', xp: 100, cle: 'rattrapee', n: 1 }, 'niveau : le texte « Semaine rattrapée »');
const avecPause = Object.assign({}, REG, { pauses: ['2026-03-02'] });
egal(L.niveau(rattrapage, progN, avecPause, '2026-03-31').xp, L.niveau(rattrapage, progN, REG, '2026-03-31').xp, 'niveau : prévoir une pause ne coûte jamais d\'XP');
// Une semaine en pause sans séance : 0, rien de perdu ; la semaine d'après rapporte comme d'habitude (et « Bon retour »).
// 2.11.0 : prévue ou non, une semaine sans séance ne coûte rien (le corps ne fait pas la différence ; rien de perdu avant 3 semaines [123]).
const autourPause = [libre('2026-02-23'), libre('2026-02-25'), libre('2026-02-27'), libre('2026-03-09'), libre('2026-03-11'), libre('2026-03-13')];
const pause2 = Object.assign({}, REG, { pauses: ['2026-03-02'] });
egal(parSeance(autourPause, pause2).map((x) => x.total), [150, 150, 300, 200, 150, 300], 'niveau : semaine en pause, 0 et sans perte');
egal([L.niveau(autourPause, progN, pause2, '2026-03-31').xp, L.niveau(autourPause, progN, REG, '2026-03-31').pertes], [L.niveau(autourPause, progN, REG, '2026-03-31').xp, []], 'niveau : avec ou sans pause prévue, le même total, rien de perdu');

// ── L.niveau : la forme, le passage de niveau ──
// 2.10.0 : prochainPalier = les XP où commence le palier suivant (10 000) ; objectif, pertes, aRegagner et semaine en plus.
const PALIERS_VIDES = [['Débutant', 0], ['Régulier', 10000], ['Solide', 20000], ['Costaud', 40000], ['Confirmé', 80000]].map(([titre, a], rang) => ({ rang, titre, a, date: null }));
egal(L.niveau([], progN, REG, '2026-03-31'), { niveau: 1, titre: 'Débutant', xp: 0, xpNiveau: 0, xpSuivant: 600, reste: 600, part: 0, prochainTitre: 'Régulier', prochainPalier: 10000,
  seances: 0, moyenne: 0, derniere: null, faites: 0, palier: L.palier(0), objectif: 3, pertes: [], aRegagner: 0,
  semaine: { lundi: '2026-03-30', total: 0, lignes: {}, recup: false, perte: null, arret: null }, paliers: PALIERS_VIDES }, 'niveau : aucune séance');
const trois = [libre('2026-03-02'), libre('2026-03-04'), libre('2026-03-06')];
const n3 = L.niveau(trois, progN, REG, '2026-03-06');
egal(n3, { niveau: 2, titre: 'Débutant', xp: 600, xpNiveau: 600, xpSuivant: 1700, reste: 1100, part: 0, prochainTitre: 'Régulier', prochainPalier: 10000, seances: 3, moyenne: 200,
  derniere: { date: '2026-03-06', nom: 'Séance libre', xp: 300, lignes: parSeance(trois)[2].lignes, monte: true, ancienNiveau: 1, nouveauPalier: false, ancienPalier: 0 },
  faites: 3, palier: L.palier(600), objectif: 3, pertes: [], aRegagner: 0,
  semaine: { lundi: '2026-03-02', total: 600, lignes: { seance: { n: 3, xp: 300 }, series: { n: 30, xp: 150 }, semaine: { n: 1, xp: 150 } }, recup: false, perte: null, arret: null },
  paliers: PALIERS_VIDES.map((p, k) => (k ? p : Object.assign({}, p, { date: '2026-03-02' }))) }, 'niveau : la séance qui fait passer le niveau 2');
egal(L.niveau(trois.slice(0, 2), progN, REG, '2026-03-31').derniere.monte, false, 'niveau : une séance qui ne fait pas passer de niveau');
const n4 = L.niveau(trois.concat([libre('2026-03-08')]), progN, REG, '2026-03-08');
egal([n4.xp, n4.niveau, n4.part, n4.derniere.monte], [750, 2, 150 / 1100, false], 'niveau : la part dans le niveau');
const loin = L.niveau([SE('2026-03-02', 'Séance libre', [EX('Rowing', nfois(40, kr(40, 10)))])], progN, REG, '2026-03-31');
egal([loin.niveau, loin.titre, loin.derniere.monte, loin.derniere.ancienNiveau], [1, 'Débutant', false, 1], 'niveau : 300 XP, encore niveau 1');
const haut = L.niveau([SE('2026-03-02', 'Séance libre', [EX('Rowing', nfois(10000, kr(40, 10)))])], progN, REG, '2026-03-08');
// Le titre vient des paliers : une seule séance énorme reste « Débutant ». 2.3.0 : au plus 8
// séries par muscle comptées dans une séance [28] (avant : 10 000 séries donnaient le niveau 20).
egal([haut.xp, haut.niveau, haut.titre, haut.prochainTitre, haut.prochainPalier], [140, 1, 'Débutant', 'Régulier', 10000], 'niveau : 10 000 séries de rowing en une séance : 8 comptées, niveau 1, Débutant');
egal(cles(xp(SE('2026-03-02', 'Séance libre', [EX('Rowing à la machine à disques', nfois(10, kr(40, 10))), EX('Tirage vertical prise large', nfois(2, kr(40, 10))), EX('Presse à cuisses', nfois(4, kr(60, 10))), EX('Mobilité', nfois(9, kr(0, 10)))]))),
  [['seance', 100], ['series', 100]], 'niveau : au plus 8 séries par muscle et par séance (dos 12 → 8, presse 4, un exercice inconnu 9 → 8) : 20 séries comptées'); // 2.3.0 [28]

// ── Une histoire de 4 semaines : cohérence, ordre indifférent, rien de perdu (aucun arrêt de plus de 3 semaines) ──
const histoire = [];
['2026-03-02', '2026-03-04', '2026-03-06', '2026-03-09', '2026-03-11', '2026-03-16', '2026-03-23', '2026-03-25', '2026-03-27', '2026-03-29'].forEach((d, i) => {
  const c = 20 + 2.5 * Math.floor(i / 2), r = 8 + (i % 3);
  histoire.push(SE(d, i % 2 ? 'Séance D' : 'Séance C', [EX('Presse à cuisses', [kr(c * 2, r), kr(c * 2, r)], '1-2'), EX('Tirage vertical prise large', [kr(c, r), kr(c, r - 1)], i % 3 ? '0' : '3+'),
    EX('Gainage planche', [{ s: 30 + 5 * i }, { s: 30 }])], { chemin: `Séances/${d}.md` }));
});
const somme = parSeance(histoire).reduce((t, x) => t + x.total, 0);
const nHistoire = L.niveau(histoire, progN, REG, '2026-03-31');
egal([nHistoire.xp, nHistoire.pertes], [somme, []], 'niveau : le total = la somme des L.xpSeance, séance après séance (une séance manquée ne retire rien)');
const melange = [histoire[7], histoire[2], histoire[9], histoire[0], histoire[5], histoire[1], histoire[8], histoire[3], histoire[6], histoire[4]];
egal(JSON.stringify(L.niveau(melange, progN, REG, '2026-03-31')), JSON.stringify(L.niveau(histoire, progN, REG, '2026-03-31')), 'niveau : l\'ordre des notes ne change rien');
const sansChemin = histoire.map((s) => { const o = Object.assign({}, s); delete o.chemin; return o; });
egal(JSON.stringify(L.niveau(sansChemin.slice().reverse(), progN, REG, '2026-03-31')), JSON.stringify(L.niveau(sansChemin, progN, REG, '2026-03-31')), 'niveau : l\'ordre ne change rien, même sans chemin');
const totaux = histoire.map((s, i) => L.niveau(histoire.slice(0, i + 1), progN, REG, s.date).xp);
vrai(totaux.every((v, i) => i === 0 || v > totaux[i - 1]), 'niveau : chaque séance ajoutée fait monter le total');
const moinsBien = SE('2026-03-30', 'Séance C', [EX('Presse à cuisses', [kr(20, 6)]), EX('Tirage vertical prise large', [kr(10, 6)])]);
vrai(L.niveau(histoire.concat([moinsBien]), progN, REG, '2026-03-31').xp >= somme + 50, 'niveau : une séance plus légère rapporte quand même, sans rien retirer');
vrai(parSeance(histoire).every((x) => x.lignes.every((l) => l.xp > 0) && x.total > 0), 'niveau : aucune ligne à 0 ni négative');
egal(L.niveau(histoire, progN, REG, '2026-03-31').moyenne, Math.round(parSeance(histoire).slice(-6).reduce((t, x) => t + x.total, 0) / 6), 'niveau : la moyenne des 6 dernières séances');
// Le même résultat par L.niveau (records par nom) et par L.xpSeance (toute l'histoire), séance par séance.
vrai(histoire.every((_, i) => L.niveau(histoire.slice(0, i + 1), progN, REG, '2026-03-31').derniere.xp === parSeance(histoire)[i].total), 'niveau : L.niveau et L.xpSeance disent la même chose');

// ── Lecture tolérante : séances abîmées, sans date, en double, en cours, à venir ──
const abimees = [null, 'x', 42, {}, { date: '2026-03-02' }, SE('2026-02-30', 'Date impossible', [EX('Rowing', [kr(40, 10)])]), { nom: 'Sans date', exos: [EX('Rowing', [kr(40, 10)])] },
  { date: '2026-03-02', exos: 'pas une liste' }, SE('2026-03-03', 'Ok', [null, { nom: '' }, { nom: 'Rowing', series: 'x' }, { series: [kr(10, 10)] },
    EX('Rowing', [null, 'x', { r: -1 }, { c: 'x', r: 5 }, { s: NaN }, kr(40, 10)])])];
const nab = L.niveau(abimees, progN, REG, '2026-03-08');
egal([nab.xp, nab.seances, nab.derniere.nom], [55, 1, 'Ok'], 'niveau : seule la séance lisible compte, avec sa seule série lisible');
egal(L.xpSeance(null, null, null, null), { total: 0, lignes: [] }, 'niveau : séance illisible, 0');
egal(L.xpSeance(SE('2026-03-02', 'Vide', [EX('Rowing', [])]), [], progN, REG), { total: 0, lignes: [] }, 'niveau : note sans série ni cardio, 0');
egal(L.niveau([SE('2026-03-02', 'Vide', [])], progN, REG, '2026-03-31').seances, 0, 'niveau : une note vide ne compte pas');
vrai([null, 'x', [null, { nom: 'Séance C' }], [{ nom: 'Séance libre', exos: 'x' }]].every((p) => L.niveau([libre('2026-03-02'), seanceC('2026-03-04', 5)], p, null, 'x').xp > 0),
  'niveau : programme, réglages ou date abîmés, rien ne casse');
egal(L.niveau([libre('2026-03-02'), libre('2026-03-02', 10, { chemin: 'Séances/2026-03-02 Séance libre 2.md' })], progN, REG, '2026-03-31').seances, 1, 'niveau : une séance notée deux fois compte une fois');
egal(L.niveau([libre('2026-03-02', 12), libre('2026-03-02', 10)], progN, REG, '2026-03-08').xp, 160, 'niveau : en double, la plus complète est gardée');
// Deux doubles aussi complets, aux charges différentes : le même gardé, quel que soit l'ordre des notes.
const d40 = libre('2026-03-02'), d45 = SE('2026-03-02', 'Séance libre', [EX('Rowing à la machine à disques', nfois(10, kr(45, 10)))]);
const ensuite = SE('2026-03-04', 'Séance libre', [EX('Rowing à la machine à disques', nfois(10, kr(42.5, 10)))]);
egal(JSON.stringify(L.niveau([d45, d40, ensuite], progN, REG, '2026-03-31')), JSON.stringify(L.niveau([d40, ensuite, d45], progN, REG, '2026-03-31')), 'niveau : doubles à égalité, l\'ordre ne change rien');
egal(L.xpSeance(libre('2026-03-04'), [libre('2026-03-04'), libre('2026-03-02')], progN, REG), L.xpSeance(libre('2026-03-04'), [libre('2026-03-02')], progN, REG),
  'niveau : la séance (ou son double) dans « avant » est écartée');
const enCours = { version: 2, nom: 'Séance C', date: '2026-03-04', courant: 0, debut: 1, exos: [{ nom: 'Presse à cuisses', series: 3, faites: [kr(60, 10)] }] };
egal(L.niveau([libre('2026-03-02'), enCours], progN, REG, '2026-03-31').seances, 1, 'niveau : la séance en cours ne compte pas');
egal(L.niveau([libre('2026-03-02'), libre('2026-04-02')], progN, REG, '2026-03-31').seances, 1, 'niveau : une séance après aujourd\'hui ne compte pas');
egal(L.xpSeance(libre('2026-03-04'), [libre('2026-03-02'), libre('2026-03-09')], progN, REG).total, 150, 'niveau : les séances d\'après ne changent pas une séance');
// La séance telle que le plugin va l'écrire (seanceNote : séries nettoyées, réserve, pas fait, bilan) se lit aussi.
const note = { nom: 'Séance C', date: '2026-03-04', dureeMin: 50, cardioMin: 5, exos: [{ nom: 'Presse à cuisses', series: [kr(60, 11), kr(60, 10)], reserve: '0' }],
  pasFait: [{ nom: 'Développé couché aux haltères', raison: 'temps' }], bilan: { date: '2026-03-04', douleur: null, courb: { niveau: 'aucune', zones: [] }, forme: 'normale', temps: 45 } };
egal(cles(L.xpSeance(note, avantP, progN, REG)), [['seance', 50], ['series', 10], ['progres', 25], ['records', 40], ['dures', 10]], 'niveau : la séance de fin, avant d\'être relue');

// ── L.conseilNiveau : une phrase vraie, jamais de reproche ──
const sj14 = { nom: 'Séance C', exos: nfois(7, { nom: 'X', series: 2 }) };
egal(L.conseilNiveau(L.niveau([], progN, REG, '2026-03-31')), 'Ta première séance lance ton niveau.', 'niveau : conseil sans séance');
egal(L.conseilNiveau(L.niveau([], progN, REG, '2026-03-31'), sj14), '4 séances complètes et tu passes niveau 2.', 'niveau : conseil sans séance, avec la séance du jour (170 XP sûrs)');
// 2.2.0 : plus de titre dans la phrase du niveau : les titres viennent des paliers.
egal(L.conseilNiveau({ niveau: 4, titre: 'Débutant', reste: 150, seances: 10, moyenne: 500 }, sj14), 'Ta prochaine séance complète te fait passer niveau 5.',
  'niveau : conseil, la prochaine séance suffit (sans titre)');
egal(L.conseilNiveau({ niveau: 2, titre: 'Débutant', reste: 170, seances: 4, moyenne: 300 }, sj14), 'Ta prochaine séance complète te fait passer niveau 3.', 'niveau : conseil, même titre');
egal(L.conseilNiveau({ niveau: 6, titre: 'Régulier', reste: 400, seances: 5, moyenne: 500 }, sj14), 'Une séance comme tes dernières et tu passes niveau 7.', 'niveau : conseil, une séance d\'habitude');
egal(L.conseilNiveau({ niveau: 6, titre: 'Régulier', reste: 900, seances: 5, moyenne: 500 }, sj14), 'Encore 2 séances et tu passes niveau 7.', 'niveau : conseil, 2 séances à sa moyenne');
egal(L.conseilNiveau({ niveau: 9, titre: 'Régulier', reste: 900, seances: 20, moyenne: 500 }), 'Encore 2 séances et tu passes niveau 10.', 'niveau : conseil, niveau 10 sans titre (2.2.0)');
egal(L.conseilNiveau({ niveau: 6, titre: 'Régulier', reste: 2900, seances: 5, moyenne: 500 }), 'Encore environ 6 séances et tu passes niveau 7.', 'niveau : conseil, plus de 3 séances : « environ »');
egal([L.conseilNiveau(null), L.conseilNiveau({})], ['', ''], 'niveau : conseil sans niveau, rien');
const sjVrai = L.preparerSeance(L.seanceDuJour(progN, L.trier(histoire), REG, '2026-03-31'), { seances: L.trier(histoire), programme: progN, reglages: REG });
const phrases = [L.conseilNiveau(L.niveau(histoire, progN, REG, '2026-03-31'), sjVrai), L.conseilNiveau(n3), L.conseilNiveau(nab)];
vrai(phrases.every((t) => t && !/(dois|faut|retard|rat[ée]|cass[ée]|manqu|perdu)/i.test(t)), 'niveau : conseil toujours dit, jamais de reproche');

// ───────── Les paliers, calés sur les études (« La bonne séance » [108, 109], [65], [66]) ; 2.10.0 : atteints par les XP ─────────
// Une séance libre par jour, à partir du lundi 02/03/2026 (150 XP, plus 150 à la 3e de chaque semaine) : la n-ième le jour(n).
const serieDe = (n) => Array.from({ length: n }, (_, i) => libre(L.plusJours('2026-03-02', i)));
const jour = (n) => L.plusJours('2026-03-02', n - 1);
const nivA = (n) => L.niveau(serieDe(n), progN, REG, jour(n));
egal(L.PALIERS.map((p) => [p.titre, p.seances, p.xp]), [['Débutant', 0, 0], ['Régulier', 18, 10000], ['Solide', 36, 20000], ['Costaud', 72, 40000], ['Confirmé', 144, 80000]],
  'paliers : 18 séances bien faites (≈ 6 semaines) = 10 000 XP, 36 (≈ 12 semaines) = 20 000, 72 (≈ 6 mois) = 40 000, 144 (≈ 1 an) = 80 000');
vrai(L.PALIERS.every((p) => Math.abs(p.xp - p.seances * L.XP_NIVEAU.type) <= 1000), 'paliers : les XP d\'un palier = ses séances × une séance bien faite (550 XP), arrondi');
egal([0, 9999, 10000, 19999, 20000, 39999, 40000, 79999, 80000, 500000].map((x) => L.palier(x).titre),
  ['Débutant', 'Débutant', 'Régulier', 'Régulier', 'Solide', 'Solide', 'Costaud', 'Costaud', 'Confirmé', 'Confirmé'], 'paliers : les seuils exacts, en XP');
egal(L.palier(345), { rang: 0, titre: 'Débutant', xp: 0, seances: 0, prochain: { titre: 'Régulier', a: 10000, reste: 9655, seances: 18 }, phrase: L.PALIERS[0].phrase },
  'paliers : 345 XP, « Régulier : encore 9 655 XP », environ 18 séances bien faites');
egal([L.palier(80000).prochain, L.palier(20000).prochain], [null, { titre: 'Costaud', a: 40000, reste: 20000, seances: 37 }], 'paliers : rien après Confirmé ; le suivant et ce qui manque');
egal([-3, NaN, 'x', null, 9999.9].map((n) => L.palier(n).rang), [0, 0, 0, 0, 0], 'paliers : un nombre abîmé vaut 0, pas d\'arrondi vers le haut');
// 2.5.1 : texte raccourci ; la partie visible (avant « \n ») tient en 2 lignes à 375 px, le pourquoi n'est plus affiché.
vrai(L.PALIERS.every((p) => p.phrase && p.phrase.split('\n')[0].length <= L.LIGNE_MAX && !/\d+(,\d+)?\s*kg/.test(p.phrase) && !/(dois|faut)/i.test(p.phrase)),
  'paliers : une phrase courte par palier, sans promesse de kilos de muscle ni injonction');
vrai(/prise de muscle/.test(L.PALIERS[1].phrase), 'paliers : Régulier, « la vraie prise de muscle commence à se voir »');

// L.niveau : le titre et le palier suivent les XP. Les jours où Régulier et Solide sont atteints, lus sur une longue série.
const longue = nivA(130);
const dR = longue.paliers[1].date, dS = longue.paliers[2].date;
const NR = L.joursEntre('2026-03-02', dR) + 1, NS = L.joursEntre('2026-03-02', dS) + 1;
const avantR = nivA(NR - 1), aR = nivA(NR);
egal([avantR.titre, avantR.xp < 10000, avantR.prochainTitre, avantR.prochainPalier, avantR.palier.prochain.reste, avantR.derniere.nouveauPalier], ['Débutant', true, 'Régulier', 10000, 10000 - avantR.xp, false],
  'paliers : sous 10 000 XP, encore Débutant');
egal([aR.titre, aR.xp >= 10000, aR.palier.rang, aR.derniere.nouveauPalier, aR.derniere.ancienPalier, aR.paliers[1].date, aR.paliers[0].date], ['Régulier', true, 1, true, 0, jour(NR), '2026-03-02'],
  'paliers : la séance qui fait passer 10 000 XP fait passer Régulier, daté de ce jour-là');
egal(aR.niveau, L.niveauDe(aR.xp), 'paliers : le numéro de niveau vient toujours des XP');
egal(nivA(NS).titre, 'Solide', 'paliers : 20 000 XP, Solide');
egal(nivA(NR + 1).derniere.nouveauPalier, false, 'paliers : la séance d\'après ne repasse pas de palier');
// Un long arrêt (2.11.0, d'après [123, 124, 125]) : rien de perdu jusqu'à 3 semaines ; de la 4e à la 20e semaine, 1/17 des XP
// de la dernière séance par semaine ; le palier suit les XP ; au retour, une séance rend autant d'XP perdus qu'elle en gagne.
const apres = (j) => L.niveau(serieDe(NR), progN, REG, L.plusJours(jour(NR), j));
const pas = Math.round(aR.xp / 17);
egal([apres(21).xp, apres(27).xp, apres(27).pertes, apres(28).xp, apres(60).xp, apres(60).pertes.map((x) => x.semaines), apres(60).aRegagner, apres(60).titre],
  [aR.xp, aR.xp, [], aR.xp - pas, aR.xp - 5 * pas, [4, 5, 6, 7, 8], 5 * pas, 'Débutant'], 'arrêt : rien avant la 4e semaine, puis 1/17 par semaine ; le palier redescend avec les XP');
egal([apres(140).xp < 17, apres(300).xp === apres(140).xp, apres(300).pertes.length], [true, true, 17], 'arrêt : à 20 semaines tout est perdu [125], et rien de plus ensuite');
egal([apres(10).semaine.arret, apres(15).semaine.arret, apres(28).semaine.arret, apres(28).semaine.perte], [null, { jours: 15, perte: pas }, null, { semaines: 4, xp: pas }],
  'arrêt : prévenu à partir de 2 semaines sans séance ; la perte de la semaine');
const dRetour = L.plusJours(jour(NR), 60);
const retour = L.niveau(serieDe(NR).concat([libre(dRetour)]), progN, REG, dRetour);
const rendu = retour.derniere.lignes[retour.derniere.lignes.length - 1];
egal([rendu.cle, rendu.texte, retour.derniere.xp === 2 * rendu.xp, retour.aRegagner === 5 * pas - rendu.xp, retour.xp === apres(60).xp + 2 * rendu.xp], ['memoire', 'Muscle retrouvé', true, true, true],
  'arrêt : au retour, la séance rend autant d\'XP perdus qu\'elle en gagne [124]');
// Une séance vide ou abîmée ne compte pas ; une séance en double non plus.
egal(L.niveau(serieDe(17).concat([SE('2026-03-25', 'Vide', []), libre('2026-03-18', 10, { chemin: 'copie.md' })]), progN, REG, '2026-12-31').faites, 17,
  'paliers : ni la note vide ni le double ne comptent');
// Compatibilité : les anciens appels marchent toujours.
egal(typeof L.conseilNiveau(aR), 'string', 'paliers : L.conseilNiveau rend une phrase');

// ── Le corps : L.corpsDepuis, L.texteCorps ──
// 2.3.0 : la dernière mesure 84 jours après la première (avant : le 20/04, 50 jours) : on ne compare qu'à 12 semaines [108, 109].
const MES = [{ date: '2026-03-01', poids: 70, epaules: 110, bras: 30 }, { date: '2026-03-10', poids: 70.4 }, { date: '2026-05-24', poids: 71.2, epaules: 111.5, bras: 31 }];
egal(L.corpsDepuis(MES, '2026-03-02'), { epaules: 1.5, bras: 1, poids: 1.2 }, 'corps : les différences depuis la mesure de départ');
egal(L.texteCorps(L.corpsDepuis(MES, '2026-03-02')), 'Épaules +1,5 cm · Bras +1 cm · Poids +1,2 kg', 'corps : « Épaules +1,5 cm · Bras +1 cm · Poids +1,2 kg »');
egal(L.corpsDepuis(MES, '2026-03-02', '2026-05-23'), { epaules: null, bras: null, poids: null }, 'corps : jusqu\'à une date ; moins de 84 jours entre deux mesures, rien à comparer'); // 2.3.0 : avant, le poids à 9 jours (+0,4 kg)
egal(L.corpsDepuis([{ date: '2026-03-05', poids: 70 }, { date: '2026-05-28', poids: 70 }], '2026-03-02'), { epaules: null, bras: null, poids: 0 },
  'corps : départ mesuré après la première séance ; pareil = 0');
egal(L.texteCorps({ epaules: 0, bras: null, poids: -0.5 }), 'Poids −0,5 kg', 'corps : 0 n\'est pas dit, une baisse est dite sans reproche');
egal([L.corpsDepuis(null), L.corpsDepuis([null, 'x', { date: 'x', poids: 70 }, { date: '2026-03-01', poids: 'x' }])], [{ epaules: null, bras: null, poids: null }, { epaules: null, bras: null, poids: null }],
  'corps : mesures absentes ou abîmées, rien ne casse');

// ── Le corps à chaque palier : L.paliersCorps ──
const vingt = nivA(NR + 2);   // Régulier atteint le jour dR, deux séances plus tôt
const corpsDe = (mesures, n) => L.paliersCorps(n || vingt, mesures).map((c) => [c.titre, c.etat, c.texte]);
egal(corpsDe([]), [['Débutant', 'fait', 'pas de mesure à ce palier'], ['Régulier', 'ici', 'pas de mesure à ce palier'], ['Solide', 'avenir', ''], ['Costaud', 'avenir', ''], ['Confirmé', 'avenir', '']],
  'corps aux paliers : aucune mesure');
// 2.3.0 : avant 84 jours depuis la première mesure, pas d'écart : la mesure et la photo sont gardées (l'eau des premières
// séances fausse la mesure [108, 109]).
egal(corpsDe([{ date: '2026-03-03', poids: 70, epaules: 110 }, { date: L.plusJours(dR, 2), poids: 71.2, epaules: 111.5, photo: 'Photos/palier.jpg' }]).slice(0, 2),
  [['Débutant', 'fait', 'ton point de départ (03/03)'], ['Régulier', 'ici', 'Mesure gardée : tu compareras à 12 semaines.\nPourquoi : avant, l\'eau dans le muscle fausse la mesure.']], // 2.5.1 : texte raccourci
  'corps aux paliers : moins de 84 jours, la mesure gardée sans écart');
egal(corpsDe([{ date: '2026-03-03', poids: 70, epaules: 110 }, { date: '2026-05-26', poids: 70, epaules: 110 }]).slice(0, 2),
  [['Débutant', 'fait', 'ton point de départ (03/03)'], ['Régulier', 'ici', 'pas encore de différence mesurable : normal, ça se voit surtout plus tard']],
  'corps aux paliers : pas de différence, une phrase calme');
egal(corpsDe([{ date: '2026-03-03', poids: 70, epaules: 110, bras: 30 }, { date: '2026-05-26', poids: 71.2, epaules: 111.5, bras: 31, photo: 'Photos/2026-05-26-palier.jpg' }])[1],
  ['Régulier', 'ici', 'Épaules +1,5 cm · Bras +1 cm · Poids +1,2 kg'], 'corps aux paliers : ce que les mesures ont changé depuis le départ, à 84 jours ou plus');
egal(L.paliersCorps(vingt, [{ date: L.plusJours(dR, 2), poids: 70, photo: 'Photos/a.jpg' }])[1].photo, 'Photos/a.jpg', 'corps aux paliers : la photo du palier');
egal(L.paliersCorps(vingt, []).map((c) => c.reste), [0, 0, 20000 - vingt.xp, 40000 - vingt.xp, 80000 - vingt.xp], 'corps aux paliers : les XP qui manquent pour ceux à venir');
egal(corpsDe([{ date: '2026-03-03', poids: 70 }], L.niveau([], progN, REG, '2026-12-31'))[0], ['Débutant', 'ici', 'ton point de départ (03/03)'], 'corps aux paliers : sans séance, le départ');
// Une mesure du palier d'avant ne compte pas pour le suivant.
const n40 = nivA(NS + 2);   // Solide atteint le jour dS
egal(corpsDe([{ date: '2026-03-03', epaules: 110 }, { date: L.plusJours(dR, 2), epaules: 111 }], n40).slice(0, 3).map((c) => c[2]),
  ['ton point de départ (03/03)', L.TEXTE_ATTENDRE, 'pas de mesure à ce palier'], 'corps aux paliers : chaque palier ses mesures'); // 2.3.0 : la mesure du palier Régulier (moins de 84 jours) est gardée, sans écart

// ── Se mesurer à un palier : L.palierAMesurer ; les photos : L.photosCorps ──
egal(L.palierAMesurer(L.niveau([], progN, REG, '2026-12-31'), []), { rang: 0, titre: 'Débutant', phrase: L.PALIERS[0].phrase, date: null, mesure: false, photo: false },
  'mesurer : aucune mesure, le départ le demande');
egal(L.palierAMesurer(L.niveau(serieDe(2), progN, REG, '2026-03-03'), [{ date: '2026-03-01', poids: 70, photo: 'a.jpg' }]), null, 'mesurer : départ mesuré et photographié, rien à demander');
egal(L.palierAMesurer(vingt, [{ date: '2026-03-01', poids: 70, photo: 'a.jpg' }]), { rang: 1, titre: 'Régulier', phrase: L.PALIERS[1].phrase, date: dR, mesure: false, photo: false },
  'mesurer : Régulier atteint sans mesure depuis');
egal(['mesure', 'photo'].map((k) => L.palierAMesurer(vingt, [{ date: dR, poids: 70 }])[k]), [true, false], 'mesurer : mesuré le jour du palier, il manque la photo');
egal(L.palierAMesurer(vingt, [{ date: L.plusJours(dR, 1), poids: 70 }, { date: L.plusJours(dR, 1), photo: 'b.jpg' }]), null, 'mesurer : mesure et photo depuis le palier, rien à demander');
egal(L.photosCorps([{ date: '2026-03-01', photo: 'a.jpg' }, { date: '2026-03-10', poids: 70 }, { date: '2026-04-20', photo: 'c.jpg' }, { date: '2026-03-21', photo: 'b.jpg' }]),
  { depart: { date: '2026-03-01', photo: 'a.jpg' }, derniere: { date: '2026-04-20', photo: 'c.jpg' } }, 'photos : celle du départ et la dernière, par date');
egal([L.photosCorps([{ date: '2026-03-01', photo: 'a.jpg' }]).derniere, L.photosCorps(null).depart], [null, null], 'photos : une seule, ou aucune');

// ── La note Mesures : le tour de bras et la photo, format tolérant ──
const NOTE_M = '---\nsalle: mesures\n---\n# Mesures\n- 2026-11-10 · poids 70 kg\n- 2026-11-16 · poids 70,4 kg · épaules 112 cm · bras 31,5 cm · ![[Photos/2026-11-16-palier.jpg]]\n';
egal(L.lireMesures(NOTE_M), [{ date: '2026-11-10', poids: 70 }, { date: '2026-11-16', poids: 70.4, epaules: 112, bras: 31.5, photo: 'Photos/2026-11-16-palier.jpg' }],
  'mesures : le tour de bras et la photo se lisent');
egal(L.lireMesures('- 2026-11-16 · ![[Poids 2026/2026-11-16-palier.jpg|photo]]'), [{ date: '2026-11-16', photo: 'Poids 2026/2026-11-16-palier.jpg' }],
  'mesures : un lien de photo n\'est jamais lu comme une mesure');
egal(L.ligneMesure({ date: '2026-11-16', poids: 70.4, epaules: 112, bras: 31.5, photo: 'Photos/x.jpg' }), '- 2026-11-16 · poids 70,4 kg · épaules 112 cm · bras 31,5 cm · ![[Photos/x.jpg]]',
  'mesures : la ligne écrite');
egal(L.lierPhotoMesure(NOTE_M.replace(/\n- 2026-11-16.*\n/, '\n'), '2026-11-10', 'Photos/p.jpg').split('\n').slice(-2), ['- 2026-11-10 · poids 70 kg · ![[Photos/p.jpg]]', ''],
  'mesures : la photo liée à la ligne du jour');
egal(L.lierPhotoMesure('---\nsalle: mesures\n---\n# Mesures\n- 2026-11-10 · poids 70 kg\n', '2026-11-16', 'Photos/p.jpg'), '---\nsalle: mesures\n---\n# Mesures\n- 2026-11-10 · poids 70 kg\n- 2026-11-16 · ![[Photos/p.jpg]]\n',
  'mesures : pas de ligne ce jour-là, une nouvelle ligne, le reste intact');
// L'ancien lecteur (1.15.0 et 2.1.x, figé ici) lit encore la ligne : les mêmes nombres, la photo ignorée.
const ancienLecteur = (texte) => texte.split('\n').map((l) => /^[-*+]\s*(\d{4}-\d{2}-\d{2})\b(.*)$/.exec(l.trim())).filter(Boolean).map((m) => {
  const reste = L.norm(m[2]), o = { date: m[1] };
  for (const k of ['poids', 'epaules', 'poitrine']) { const r = new RegExp(k + '\\s*:?\\s*(\\d+(?:[.,]\\d+)?)').exec(reste); if (r) o[k] = L.nombre(r[1]); }
  return o;
});
egal(ancienLecteur(NOTE_M), [{ date: '2026-11-10', poids: 70 }, { date: '2026-11-16', poids: 70.4, epaules: 112 }], 'mesures : l\'ancien lecteur lit toujours la note');

// ── La mémoire de L.niveau : le même résultat, une copie à chaque fois ──
{
  const ss = [{ date: '2026-11-09', nom: 'Séance A', exos: [{ nom: 'Tirage vertical prise large', series: [{ c: 40, r: 12 }, { c: 40, r: 10 }] }] }];
  const reg = { parSemaine: 3, duree: 60 };
  const prog = progN;
  const a = L.niveau(ss, prog, reg, '2026-11-16'), b = L.niveau(ss, prog, reg, '2026-11-16');
  b.xp = -1; if (b.derniere) b.derniere.lignes.push('abîmé');
  const c = L.niveau(ss, prog, reg, '2026-11-16');
  egal([JSON.stringify(a) === JSON.stringify(L.calculerNiveau(ss, prog, reg, '2026-11-16')), c.xp === a.xp, JSON.stringify(c.derniere) === JSON.stringify(a.derniere)], [true, true, true],
    'niveau : la mémoire redonne le calcul exact, et une copie (modifier le résultat ne touche pas la mémoire)');
  const d = L.niveau(ss.concat([{ date: '2026-11-11', nom: 'Séance B', exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 12 }] }] }]), prog, reg, '2026-11-16');
  vrai(d.xp > a.xp, 'niveau : une séance de plus refait le calcul');
}
