// Les tests de la logique des progrès (src/40-progres.js). Une règle = un test. Lancés par tests/lancer.js, après
// tests/commun.js (egal, vrai). Les exemples chiffrés sont ceux du contrat (~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-contrat-2.0.md,
// partie 1.2), calculés sur le programme 1.15.0 figé (PROGRAMME_115, tests/programme-115.js).

const prog = L.lireProgramme(PROGRAMME_115);
const A = prog[0], B = prog[1];
const S = (date, nom, exos, plus) => Object.assign({ date, nom, exos: exos || [] }, plus || {});
const X = (nom, series, reserve) => (reserve ? { nom, series, reserve } : { nom, series });
const k = (c, r) => ({ c, r });
const fois = (n, x) => Array.from({ length: n }, () => Object.assign({}, x));
// Une séance du programme notée : toutes les séries prévues à 10 kg × 10 (30 s au temps), avec des retouches par nom.
const faite = (date, sea, retouches) => S(date, sea.nom, sea.exos.map((e) => {
  const r = (retouches || {})[e.nom] || {};
  return X(e.nom, r.series || fois(e.series, e.unite === 's' ? { s: 30 } : k(10, 10)), r.reserve);
}));
const auProg = (date, sea) => Object.assign({}, sea, { date });   // une séance du programme (series = nombre) à une date

// ── Muscles : séries directes 1, indirectes ½ (« La bonne séance », partie 3, Volume) ──
egal(['Tirage vertical prise large', 'Tirage horizontal à la poulie', 'Tractions', 'Développé assis à la machine', 'Développé incliné aux haltères', 'Développé épaules aux haltères',
  'Élévations latérales aux haltères', 'Face pull à la poulie', 'Presse à cuisses', 'Curl aux haltères', 'Extension triceps à la poulie', 'Extension triceps au-dessus de la tête à la poulie', 'Gainage planche'].map(L.musclesExo),
[{ dos: 1, biceps: 0.5, avant_bras: 0.5 }, { dos: 1, biceps: 0.5, avant_bras: 0.5 }, { dos: 1, biceps: 0.5, avant_bras: 0.5 }, { pecs: 1, triceps: 0.5 }, { pecs: 1, haut_pecs: 1, triceps: 0.5 }, { epaules: 0.5, triceps: 0.5 },
  { epaules: 1 }, { arriere_epaules: 1, dos: 0.5 }, { quadriceps: 1, fessiers: 1 }, { biceps: 1, avant_bras: 0.5 }, { triceps: 1 }, { triceps: 1 }, { abdos: 1 }], 'musclesExo : la table des exercices du programme et de leurs remplaçants');
egal(['Leg curl assis', 'Leg curl allongé', 'Curl à la barre en Z'].map(L.musclesExo), [{ ischios: 1 }, { ischios: 1 }, { biceps: 1, avant_bras: 0.5 }], 'musclesExo : le leg curl est l\'arrière des cuisses, pas un biceps');
egal(['Pull-over à la poulie', 'Mollets debout', 'Étirements', ''].map(L.musclesExo), [{ dos: 1, biceps: 0.5 }, { quadriceps: 1 }, {}, {}], 'musclesExo : exercice inconnu → d\'après sa famille, sinon rien');
const m1 = L.musclesExo('Curl aux haltères'); m1.biceps = 99;
egal(L.musclesExo('Curl aux haltères'), { biceps: 1, avant_bras: 0.5 }, 'musclesExo : rend une copie (la table ne change pas)');
egal(['Développé incliné aux haltères', 'Développé épaules aux haltères', 'Tirage vertical prise large', 'Face pull à la poulie', 'Leg curl assis', 'Étirements'].map(L.musclePrincipal),
  ['pecs', 'epaules', 'dos', 'arriere_epaules', 'ischios', null], 'musclePrincipal : le plus gros coefficient, le haut des pecs ignoré');
egal(Object.keys(L.NOMS_MUSCLES), ['dos', 'epaules', 'arriere_epaules', 'pecs', 'quadriceps', 'ischios', 'fessiers', 'biceps', 'avant_bras', 'triceps', 'abdos'], 'NOMS_MUSCLES : les 11 muscles, dans l\'ordre de l\'écran');

// ── Volume par muscle ──
egal(L.volume([A, B]), { dos: 10, epaules: 7.5, arriere_epaules: 2, pecs: 6, haut_pecs: 3, quadriceps: 6, ischios: 5, fessiers: 6, biceps: 6.5, avant_bras: 5.5, triceps: 6.5, abdos: 2 }, 'volume : A + B du programme (séries = nombre)');
egal(L.volume([A, B, A]), { dos: 16, epaules: 10.5, arriere_epaules: 2, pecs: 9, haut_pecs: 3, quadriceps: 9, ischios: 7, fessiers: 9, biceps: 11.5, avant_bras: 9.5, triceps: 8, abdos: 4 }, 'volume : semaine A, B, A');
egal(L.volume([B, A, B]), { dos: 14, epaules: 12, arriere_epaules: 4, pecs: 9, haut_pecs: 6, quadriceps: 9, ischios: 8, fessiers: 9, biceps: 8, avant_bras: 7, triceps: 11.5, abdos: 2 }, 'volume : semaine B, A, B');
egal(L.volume([S('2026-11-16', 'Séance A', [{ nom: 'Échauffement', echauffement: true, series: [{ min: 5 }] }, X('Tirage vertical prise large', [k(40, 10), k(40, 9)])])]),
  { dos: 2, epaules: 0, arriere_epaules: 0, pecs: 0, haut_pecs: 0, quadriceps: 0, ischios: 0, fessiers: 0, biceps: 1, avant_bras: 1, triceps: 0, abdos: 0 }, 'volume : séance notée (series = liste), l\'échauffement ne compte pas');
egal(L.volumeSemaine([faite('2026-11-13', B), auProg('2026-11-16', A), auProg('2026-11-18', B), auProg('2026-11-20', A)], '2026-11-20'), [
  { cle: 'dos', nom: 'Dos', series: 16, zone: [10, 15], etat: 'plus', maxSeance: 6 },
  { cle: 'epaules', nom: 'Côté des épaules', series: 10.5, zone: [10, 15], etat: 'dans', maxSeance: 3 },
  { cle: 'arriere_epaules', nom: 'Arrière des épaules', series: 2, zone: null, etat: 'sous', maxSeance: 2 },
  { cle: 'pecs', nom: 'Pecs', series: 9, dont: 3, zone: [10, 15], etat: 'sous', maxSeance: 3 },
  { cle: 'quadriceps', nom: 'Quadriceps', series: 9, zone: null, etat: 'sous', maxSeance: 3 },
  { cle: 'ischios', nom: 'Arrière des cuisses', series: 7, zone: null, etat: 'sous', maxSeance: 3 },
  { cle: 'fessiers', nom: 'Fessiers', series: 9, zone: null, etat: 'sous', maxSeance: 3 },
  { cle: 'biceps', nom: 'Biceps', series: 11.5, zone: [10, 15], etat: 'dans', maxSeance: 2 },
  { cle: 'avant_bras', nom: 'Avant-bras', series: 9.5, zone: [10, 15], etat: 'sous', maxSeance: 0 },
  { cle: 'triceps', nom: 'Triceps', series: 8, zone: [10, 15], etat: 'sous', maxSeance: 2 },
  { cle: 'abdos', nom: 'Abdos', series: 4, zone: null, etat: 'sous', maxSeance: 2 },
], 'volumeSemaine : du lundi à aujourd\'hui (le 13/11 n\'y est pas), zone 10-15, état, séries directes par séance');
const vTrop = L.volumeSemaine([S('2026-11-16', 'Libre', [X('Tirage vertical prise large', fois(21, k(40, 10))), X('Élévations latérales aux haltères', fois(12, k(6, 12)))])], '2026-11-17');
egal([vTrop[0].etat, vTrop[0].maxSeance, vTrop[1].etat, vTrop[7].series, vTrop[7].etat], ['trop', 21, 'dans', 10.5, 'dans'], 'volumeSemaine : plus de 20 = trop ; sans zone, 10 ou plus = dans ; 21 directes dans une séance');

// ── Records par type ──
egal([L.meilleureSerie([k(35, 12), k(37.5, 8), k(37.5, 9), k(30, 15)]), L.meilleureSerie([{ s: 40 }, { s: 45 }, { s: 30 }]), L.meilleureSerie([k(0, 12), k(0, 13)]), L.meilleureSerie([]), L.meilleureSerie(null)],
  [k(37.5, 9), { s: 45 }, k(0, 13), null, null], 'meilleureSerie : la plus lourde, puis le plus de répétitions ; au temps, la plus longue');
const presse = [S('2026-11-13', 'Séance B', [X('Presse à cuisses', [k(60, 10), k(60, 10)])])];
egal(L.recordSerie(presse, 'Presse à cuisses', k(65, 8), []), { type: 'charge', avant: { c: 60 }, apres: { c: 65, r: 8 }, texte: 'Nouvelle charge : 65 kg, avant 60' }, 'recordSerie : plus lourd que jamais = record de charge');
egal(L.recordSerie(presse, 'presse A CUISSES', k(60, 11), []), { type: 'reps', avant: { c: 60, r: 10 }, apres: { c: 60, r: 11 }, texte: 'Record : 11 répétitions à 60 kg, avant 10' }, 'recordSerie : plus de répétitions à une charge déjà faite (nom sans accents ni majuscules)');
egal([L.recordSerie(presse, 'Presse à cuisses', k(55, 11), []), L.recordSerie(presse, 'Presse à cuisses', k(60, 10), []), L.recordSerie(presse, 'Squat', k(20, 5), []), L.recordSerie(presse, 'Presse à cuisses', k(70, 0), [])],
  [null, null, null, null], 'recordSerie : rien à une charge jamais notée plus basse, à égalité, au premier essai, ni pour une série vide');
egal([L.recordSerie(presse, 'Presse à cuisses', k(65, 8), [{ c: 65, r: 8, record: 'charge' }]), L.recordSerie(presse, 'Presse à cuisses', k(60, 11), [k(65, 12)]), L.recordSerie(presse, 'Presse à cuisses', k(60, 12), [{ c: 60, r: 11, record: 'reps' }]), L.recordSerie(presse, 'Presse à cuisses', k(65, 8), [k(60, 9)]).type],
  [null, null, null, 'charge'], 'recordSerie : un seul record par exercice et par séance ; pas de record sous une série plus forte du jour');
const tirage3 = [S('2026-11-13', 'Séance A', [X('Tirage vertical prise large', fois(3, k(35, 12)))])];
egal([L.recordSerie(tirage3, 'Tirage vertical prise large', k(37.5, 8), []).texte, L.valeur(k(37.5, 8)) < L.valeur(k(35, 12))], ['Nouvelle charge : 37,5 kg, avant 35', true],
  'recordSerie : le défaut de la 1.15.0 corrigé (37,5 × 8 après 3 × 12 à 35 kg est un record, même si Epley baisse)');
const planche = [S('2026-11-16', 'Séance A', [X('Gainage planche', [{ s: 40 }, { s: 35 }])])];
egal([L.recordSerie(planche, 'Gainage planche', { s: 45 }, []), L.recordSerie(planche, 'Gainage planche', { s: 40 }, []), L.recordSerie(presse, 'Presse à cuisses', { s: 45 }, [])],
  [{ type: 'temps', avant: { s: 40 }, apres: { s: 45 }, texte: 'Record : 45 s, avant 40 s' }, null, null], 'recordSerie : au temps, plus long (et rien si aucun temps n\'est noté)');
const tractions = [L.lireSeance('---\nsalle: seance\ndate: 2026-11-09\nnom: Séance libre\n---\n## Tractions\n- 12 rép.\n- 12 rép.\n- 3 rép.\n')];
egal(L.recordSerie(tractions, 'Tractions', k(0, 13), []), { type: 'reps', avant: { c: 0, r: 12 }, apres: { c: 0, r: 13 }, texte: 'Record : 13 répétitions, avant 12' }, 'recordSerie : au poids du corps, plus de répétitions');
const avant13 = [S('2026-11-13', 'Séance B', [X('Développé épaules aux haltères', [k(8, 12), k(8, 12)]), X('Presse à cuisses', [k(60, 10), k(60, 10)]), X('Élévations latérales aux haltères', [k(4, 20), k(4, 15)])], { dureeMin: 80 })];
const seance18 = S('2026-11-18', 'Séance B', [X('Développé épaules aux haltères', [k(10, 9), k(10, 8)]), X('Presse à cuisses', [k(60, 11), k(60, 10)]), X('Élévations latérales aux haltères', [k(4, 18), k(4, 15)]), X('Leg curl assis', [k(25, 10)])], { dureeMin: 64 });
egal(L.recordsDetail(seance18, avant13), [
  { nom: 'Développé épaules aux haltères', type: 'charge', avant: { c: 8 }, apres: { c: 10, r: 9 }, texte: 'Nouvelle charge : 10 kg, avant 8' },
  { nom: 'Presse à cuisses', type: 'reps', avant: { c: 60, r: 10 }, apres: { c: 60, r: 11 }, texte: 'Record : 11 répétitions à 60 kg, avant 10' },
], 'recordsDetail : un record par exercice, avec son type, avant et après');
const presse2 = [S('2026-11-13', 'Séance B', [X('Presse à cuisses', [k(60, 10), k(65, 8)])])];
egal([L.recordsDetail(S('2026-11-18', 'B', [X('Presse à cuisses', [k(65, 8), k(60, 11)])]), presse2).map((x) => x.type), L.recordsDetail(S('2026-11-18', 'B', [X('Presse à cuisses', [k(60, 11), k(60, 12)])]), presse2).map((x) => x.texte)],
  [['reps'], ['Record : 12 répétitions à 60 kg, avant 10']], 'recordsDetail : comme en direct, une série plus légère peut battre son record ; la meilleure série d\'abord');
const hist = [
  S('2026-11-16', 'Séance A', [X('Tirage vertical prise large', [k(35, 12), k(35, 10), k(35, 9)]), X('Gainage planche', [{ s: 40 }, { s: 35 }])]),
  S('2026-11-18', 'Séance B', [X('Leg curl assis', [k(20, 15), k(20, 15), k(20, 15)])]),
  S('2026-11-20', 'Séance A', [X('TIRAGE vertical prise large', [k(35, 12), k(35, 12), k(35, 11)])]),
];
egal(L.records(S('x', 'x', [X('Tirage vertical prise large', [k(37.5, 10)]), X('Leg curl assis', [k(20, 14)]), X('Nouveau', [k(10, 10)])]), hist), ['Tirage vertical prise large'], 'records : les noms, mieux qu\'avant seulement, pas le premier essai');
egal(L.recordsExo([S('2026-11-16', 'A', [X('Tirage vertical prise large', [k(35, 12), k(35, 10)])]), S('2026-11-20', 'A', [X('Tirage vertical prise large', [k(37.5, 9), k(37.5, 8)])])], 'Tirage vertical prise large'),
  { charge: { c: 37.5, r: 9, date: '2026-11-20' }, reps: { c: 35, r: 12, date: '2026-11-16' }, temps: null }, 'recordsExo : la plus lourde et le plus de répétitions');
egal([L.recordsExo(hist, 'Gainage planche'), L.recordsExo(tractions, 'Tractions'), L.recordsExo([S('2026-11-16', 'A', [X('Presse à cuisses', [k(60, 10)])]), S('2026-11-18', 'B', [X('Presse à cuisses', [k(60, 10)])])], 'Presse à cuisses').charge.date],
  [{ charge: null, reps: null, temps: { s: 40, date: '2026-11-16' } }, { charge: null, reps: { c: 0, r: 12, date: '2026-11-09' }, temps: null }, '2026-11-18'], 'recordsExo : au temps, au poids du corps ; à égalité, la plus récente');
const courbe = L.pointsCourbe(hist.concat([S('2026-11-23', 'Séance A', [X('Tirage vertical prise large', [k(37.5, 9)])])]), 'Tirage vertical prise large');
egal([courbe.map((p) => p.date), courbe.map((p) => p.y), courbe.map((p) => p.unite), courbe.map((p) => p.record), courbe[2].serie], [['2026-11-16', '2026-11-20', '2026-11-23'], [35, 35, 37.5], ['kg', 'kg', 'kg'], [false, false, true], k(37.5, 9)],
  'pointsCourbe : la charge de la meilleure série, la courbe ne baisse plus le jour d\'une montée de charge');
egal([L.pointsCourbe(hist, 'Gainage planche').map((p) => [p.y, p.unite, p.record]), L.pointsCourbe(tractions, 'Tractions').map((p) => [p.y, p.unite])], [[[40, 's', false]], [[12, 'rép.']]], 'pointsCourbe : au temps en secondes, au poids du corps en répétitions');

// ── Régularité qui pardonne ──
// n séances dans la semaine du lundi l (lundi, mercredi, vendredi, samedi).
const semaine = (l, n) => [0, 2, 4, 5].slice(0, n).map((j) => S(L.plusJours(l, j), 'Séance'));
const R = (sem, auj, pauses) => L.regularite([].concat(...sem), auj, 3, pauses);
const r1 = R([semaine('2026-11-02', 2), semaine('2026-11-09', 3), semaine('2026-11-16', 3)], '2026-11-20');
egal([r1.serie, r1.semaines.slice(-3).map((x) => x.etat), r1.texte], [2, ['manque', 'ok', 'ok'], '2 semaines de suite'], 'regularite : une semaine manquée arrête la série, sans la « casser »');
const r2 = R([semaine('2026-11-02', 2), semaine('2026-11-09', 4), semaine('2026-11-16', 1)], '2026-11-18');
egal([r2.serie, r2.semaines.slice(-3).map((x) => x.etat)], [2, ['rattrapee', 'ok', 'en cours']], 'regularite : une semaine sous l\'objectif est rattrapée si la suivante en a plus');
const r3 = R([semaine('2027-01-04', 3), semaine('2027-01-11', 3), semaine('2027-01-25', 3)], '2027-01-29', ['2027-01-18']);
egal([r3.serie, r3.semaines.slice(-4).map((x) => x.etat), r3.semaines.slice(-5)[0].etat], [3, ['ok', 'ok', 'pause', 'ok'], 'avant'], 'regularite : une semaine en pause ne casse rien');
const r4 = R([semaine('2026-11-09', 2), semaine('2026-11-16', 1)], '2026-11-17');
egal([r4.serie, r4.texte, r4.semaines.slice(-2).map((x) => x.etat)], [0, 'Nouvelle série : semaine 1', ['en attente', 'en cours']], 'regularite : le cas réel du 17/11 (la semaine d\'avant peut encore être rattrapée)');
egal([r4.semaines.length, r4.semaines[0].lundi, r4.semaines[11].lundi, r4.semaines[10].faites, r4.semaines[10].objectif, r4.semaines[0].etat], [12, '2026-08-31', '2026-11-16', 2, 3, 'avant'], 'regularite : 12 semaines, de la plus ancienne à l\'actuelle');
const r5 = R([semaine('2026-11-09', 3)], '2026-11-17');
egal([r5.serie, r5.texte, R([semaine('2026-11-09', 3)], '2026-11-17', ['2026-11-09']).semaines[10].etat], [1, '1 semaine de suite', 'ok'], 'regularite : « 1 semaine de suite » ; une semaine en pause qui atteint l\'objectif compte');
const r6 = R([semaine('2026-11-09', 2), semaine('2026-11-16', 4)], '2026-11-21');
egal([r6.serie, r6.semaines.slice(-2).map((x) => x.etat)], [2, ['rattrapee', 'ok']], 'regularite : la semaine actuelle peut rattraper celle d\'avant');
const textes = [r1, r2, r3, r4, r5, r6, L.regularite([], '2026-11-17', 3, [])].map((x) => x.texte);
vrai(textes.every((t) => !/cass|perdu|rat[eé]/i.test(t)) && L.regularite([], '2026-11-17', 3, []).texte === 'Nouvelle série : semaine 1', 'regularite : jamais « série cassée », même sans aucune séance');
egal(L.regularite(semaine('2026-11-09', 2), '2026-11-18').semaines[11].objectif, 3, 'regularite : objectif absent → 3 séances');

// ── Semaine légère ──
const RL = { semainesLegeres: ['2027-01-18'] };
egal(['2027-01-18', '2027-01-20', '2027-01-24', '2027-01-17', '2027-01-25'].map((d) => L.semaineLegere([], d, RL)), [true, true, true, false, false], 'semaineLegere : la semaine du lundi du réglage, du lundi au dimanche');
egal([L.semaineLegere([], '2027-01-19', { semainesLegeres: ['2027-01-20'] }), L.semaineLegere([], '2026-12-30', RL), L.semaineLegere([], 'abc', RL)], [true, false, false], 'semaineLegere : une date du réglage hors lundi vaut sa semaine ; plus de règle des 8 semaines');
egal(L.semaineLegere([], '2027-01-20', { niveau: 'regulier' }), L.semaineLegere([], '2027-01-20'), 'semaineLegere : un réglage sans la clé prend celle d\'origine (REGLAGES_DEFAUT)');
const debut = [S('2026-11-09', 'Séance libre')];
// 2.3.0 : après 8 semaines, pas 10 (les entraîneurs experts placent une décharge toutes les 4 à 8 semaines [34], avis).
const texte8 = '8 semaines sans semaine légère : en faire une cette semaine ?\nComment : séries divisées par deux, mêmes charges. C\'est un avis, pas une obligation.'; // 2.5.1 : texte raccourci
egal([L.proposerSemaineLegere(debut, '2027-01-11', RL), L.proposerSemaineLegere(debut, '2027-03-15', RL), L.proposerSemaineLegere(debut, '2027-03-22', RL), L.proposerSemaineLegere(debut, '2027-01-04', { semainesLegeres: [] }), L.proposerSemaineLegere(debut, '2027-04-07', { semainesLegeres: ['2027-01-18'], legereRefus: '2027-04-05' })],
  [null, null, { lundi: '2027-03-22', texte: texte8 }, { lundi: '2027-01-04', texte: texte8 }, null], 'proposerSemaineLegere : après 8 semaines sans, jamais avant 3 semaines d\'une prévue, 4 semaines de calme après un non');
const refus = { semainesLegeres: ['2027-01-18'], legereRefus: '2027-04-05' };
egal([L.proposerSemaineLegere([], '2027-04-05', RL), L.proposerSemaineLegere(debut, '2027-04-12', RL).texte.slice(0, 13), L.proposerSemaineLegere(debut, '2027-04-26', refus), L.proposerSemaineLegere(debut, '2027-05-03', refus)],
  [null, '11 semaines s', null, { lundi: '2027-05-03', texte: texte8.replace('8', '14') }], 'proposerSemaineLegere : rien sans séance ; le nombre de semaines est calculé ; de nouveau proposée 4 semaines après un non');
vrai(!/plus fort/.test(texte8) && /avis/.test(texte8), 'proposerSemaineLegere : un avis, sans « tu repars plus fort »');

// ── Bilan de fin comparé ──
egal([L.ecart(64, 80), L.ecart(7, 6), L.ecart(1812, 1532), L.ecart(5, 5), L.ecart(5, 0), L.ecart(5, null), L.ecart(null, 5)],
  [{ ecart: '−20 %', sens: 'moins' }, { ecart: '+17 %', sens: 'plus' }, { ecart: '+18 %', sens: 'plus' }, { ecart: '=', sens: 'egal' }, { ecart: null, sens: null }, { ecart: null, sens: null }, { ecart: null, sens: null }], 'ecart : en %, « = » à égalité, rien sans référence');
const der = (series) => ({ date: 'x', series });
egal([L.compareExo([k(10, 9)], null), L.compareExo([k(10, 9), k(10, 8)], der([k(8, 12), k(8, 12)])), L.compareExo([k(20, 12)], der([k(25, 8)])), L.compareExo([k(60, 11), k(60, 10)], der([k(60, 10), k(60, 10)])),
  L.compareExo([k(60, 12), k(60, 11)], der([k(60, 10), k(60, 10)])), L.compareExo([k(60, 10)], der([k(60, 10)])), L.compareExo([k(4, 18), k(4, 15)], der([k(4, 20), k(4, 15)])), L.compareExo([{ s: 45 }, { s: 40 }], der([{ s: 40 }, { s: 40 }]))],
[{ signe: 'nouveau', texte: 'Première fois' }, { signe: 'charge', texte: 'Nouvelle charge : 10 kg, avant 8' }, { signe: 'moins', texte: 'Plus léger : 20 kg, avant 25' }, { signe: 'plus', texte: '+1 répétition' },
  { signe: 'plus', texte: '+3 répétitions' }, { signe: 'egal', texte: 'Comme la dernière fois' }, { signe: 'moins', texte: '2 répétitions de moins' }, { signe: 'plus', texte: '+5 s en tout' }], 'compareExo : nouvelle charge, plus léger, répétitions en plus ou en moins, au temps');
egal([L.compareExo(fois(3, k(25, 10)), der(fois(2, k(25, 10)))).signe, L.compareExo(fois(2, k(25, 10)), der(fois(3, k(25, 10)))).signe, L.compareExo([k(25, 11), k(25, 10), k(25, 10)], der(fois(2, k(25, 10)))).texte],
  ['egal', 'egal', '+1 répétition'], 'compareExo : série par série, sur les séries faites les deux fois (leg curl à 3 séries après 2)');
egal(L.bilanCompare(seance18, avant13), {
  reference: { date: '2026-11-13', nom: 'Séance B' },
  tuiles: [{ cle: 'duree', titre: 'Durée', valeur: 64, texte: '64 min', ecart: '−20 %', sens: 'moins' }, { cle: 'series', titre: 'Séries', valeur: 7, texte: '7', ecart: '+17 %', sens: 'plus' }, { cle: 'charge', titre: 'Charge totale', valeur: 1812, texte: '1 812 kg', ecart: '+18 %', sens: 'plus' }],
  exos: [{ nom: 'Développé épaules aux haltères', signe: 'charge', texte: 'Nouvelle charge : 10 kg, avant 8', record: 'charge' }, { nom: 'Presse à cuisses', signe: 'plus', texte: '+1 répétition', record: 'reps' },
    { nom: 'Élévations latérales aux haltères', signe: 'moins', texte: '2 répétitions de moins', record: null }, { nom: 'Leg curl assis', signe: 'nouveau', texte: 'Première fois', record: null }],
  resume: '2 en hausse',
  records: L.recordsDetail(seance18, avant13),
}, 'bilanCompare : l\'exemple du 18/11 (tuiles, une ligne par exercice, résumé, records)');
const avec16 = avant13.concat([S('2026-11-16', 'Séance A', [X('Presse à cuisses', [k(60, 12), k(60, 12)]), X('Élévations latérales aux haltères', [k(4, 18), k(4, 15)])], { dureeMin: 70 })]);
const b16 = L.bilanCompare(seance18, avec16);
egal([b16.reference.date, b16.tuiles[0].ecart, b16.exos.map((x) => x.signe), b16.resume], ['2026-11-13', '−20 %', ['charge', 'moins', 'egal', 'nouveau'], '1 en hausse, 1 comme la dernière fois'],
  'bilanCompare : les tuiles face à la dernière séance du même nom, chaque exercice face à la dernière fois qu\'il a été fait');
const b0 = L.bilanCompare(S('2026-11-16', 'Séance A', [X('Presse à cuisses', [k(60, 10)])]), avant13);
egal([b0.reference, b0.tuiles.map((t) => [t.texte, t.ecart, t.sens]), b0.exos[0].signe, b0.resume], [null, [['—', null, null], ['1', null, null], ['600 kg', null, null]], 'egal', '1 comme la dernière fois'],
  'bilanCompare : première séance de ce nom, sans durée notée');

// ── La semaine en lignes (la carte « Cette semaine ») ──
const semA = [
  faite('2026-11-16', A, { 'Gainage planche': { reserve: '1-2' } }),
  faite('2026-11-18', B, { 'Extension triceps à la poulie': { reserve: '0' } }),
  faite('2026-11-20', A, { 'Tirage vertical prise large': { series: [k(10, 11), k(10, 10), k(10, 10)] } }),
];
const REG3 = { niveau: 'regulier', parSemaine: 3, duree: 60, recup: [] };
const nivSem = L.niveau(semA, prog, REG3, '2026-11-20');
const lignesA = L.lignesSemaine(nivSem, REG3);
egal(lignesA.map((c) => [c.cle, c.titre, c.detail, c.gain, c.fait]), [
  ['seances', 'Séances', '3 sur 3 · +100 par séance, +5 par série', '+620', true],                       // 3 séances faites (+300) et leurs 64 séries (+320)
  ['dures', 'Séries dures', '2 exercices · +10 chacun', '+20', true],
  ['progres', 'Exercices en progrès', '1 exercice · +25 chacun', '+25', true],
  ['records', 'Records', '1 record · +40 chacun', '+40', true],
  ['semaine', 'Les 3 séances de la semaine', 'Fait.', '+150', true],
  ['recup', 'Protéines et sommeil', '110 g de protéines par jour, 7 h 30 de sommeil', '+50', false],
], 'lignesSemaine : l\'exemple du 20/11, chaque ligne dit ce qu\'elle a rapporté');
egal([nivSem.semaine.total, lignesA.filter((c) => c.manuel).map((c) => c.cle)], [855, ['recup']], 'lignesSemaine : le total de la semaine ; seule « Protéines et sommeil » se coche à la main');
// Cochée : +50 pour la semaine, une seule fois, et seulement depuis la première séance.
const REG3C = Object.assign({}, REG3, { recup: ['2026-11-16', '2026-11-18', '2026-11-02'], poids: 85 });
const nivCoche = L.niveau(semA, prog, REG3C, '2026-11-20');
egal([nivCoche.xp - nivSem.xp, nivCoche.semaine.total, L.lignesSemaine(nivCoche, REG3C)[5].fait, L.lignesSemaine(nivCoche, REG3C)[5].detail], [50, 905, true, '135 g de protéines par jour, 7 h 30 de sommeil'],
  'lignesSemaine : « Protéines et sommeil » cochée rapporte 50 XP (protéines d\'après le poids, 110 g au moins)');
// Une semaine sans séance : chaque ligne dit ce qu'elle vaudra et quoi faire.
const vide = L.lignesSemaine(L.niveau([], prog, REG3, '2026-11-18'), REG3);
egal([vide.map((c) => c.gain), vide.map((c) => c.fait), vide[0].detail, vide[4].detail], [['+100 chacune', '+10 chacun', '+25 chacun', '+40 chacun', '+150', '+50'], [false, false, false, false, false, false], '0 sur 3 · +100 par séance, +5 par série', 'Encore 3 séances.'],
  'lignesSemaine : rien de fait, ce que chaque ligne vaut');
// Un long arrêt (2.11.0) : prévenu à partir de 2 semaines sans séance ; la perte de la 4e semaine se dit, sans reproche.
const libreLe = (d) => S(d, 'Séance libre', [X('Presse à cuisses', fois(10, k(60, 10)))]);
const vieux = ['2026-10-05', '2026-10-07', '2026-10-09'].map(libreLe);   // 570 XP, puis plus rien : 1/17 = 34 XP par semaine
const nivArret = L.niveau(vieux, prog, REG3, '2026-10-27'), nivPerte = L.niveau(vieux, prog, REG3, '2026-11-06');
egal([L.lignesSemaine(nivArret, REG3).slice(6), L.lignesSemaine(nivPerte, REG3).slice(6)].map((l) => l.map((c) => [c.cle, c.titre, c.detail, c.gain, !!c.alerte, !!c.perte])), [
  [['arret', 'Dernière séance il y a 18 jours', 'Plus de 3 semaines sans séance : tu perds des XP.', '−34 par semaine', true, false]],
  [['perte', '4 semaines sans séance', 'Tes prochaines séances te les rendent.', '−34', false, true]],
], 'lignesSemaine : l\'arrêt qui approche, puis la perte de la semaine');
egal([nivArret.xp, nivPerte.xp, nivPerte.semaine.total, L.niveau(vieux, prog, REG3, '2026-10-22').semaine.arret], [570, 536, -34, null], 'niveau : rien de perdu avant la 4e semaine ; le total de la semaine peut être négatif');
egal(L.lignesSemaine(null, null).length, 6, 'lignesSemaine : sans niveau ni réglages, les 6 lignes de base');
// ── Bon retour ──
const le13 = [S('2026-11-09', 'Séance libre'), S('2026-11-13', 'Séance B')];
egal([L.bonRetour(le13, '2026-11-17'), L.bonRetour(le13, '2026-11-18'), L.bonRetour([], '2026-11-18')],
  [null, { jours: 5, texte: 'Bon retour ! Dernière séance il y a 5 jours.' }, null], 'bonRetour : plus de 4 jours sans séance, sans reproche'); // 2.1.2 : plus de version 45 min (« si je vais à ma salle, c'est que j'ai le temps »)
const retour10 = L.bonRetour(le13, '2026-11-23');
egal([retour10.jours, retour10.texte], [10, 'Bon retour ! Dernière séance il y a 10 jours. Rien de perdu : garde tes charges d\'avant.'], 'bonRetour : après une semaine ou plus, « tu n\'as rien perdu »'); // 2.1.2 : sans la question des 45 min

// ── Jours de salle : au moins 48 h entre deux séances ──
egal([[1, 3, 5], [1, 2, 4, 5], [6, 0], [3], [], null].map(L.joursSeSuivent), [false, true, true, false, false, false], 'joursSeSuivent : deux jours choisis qui se suivent (samedi puis dimanche compris)');
egal([L.plan(prog, [S('2026-11-16', 'Séance A')], '2026-11-17', [1, 3, 5], 3).map((x) => x.date), L.plan(prog, [S('2026-11-16', 'Séance A')], '2026-11-17', [1, 2, 4, 5], 2).map((x) => x.date)],
  [['2026-11-18', '2026-11-20', '2026-11-23'], ['2026-11-19', '2026-11-23']], 'plan : jamais le lendemain d\'une séance, même si les jours choisis se suivent'); // 2.3.0 : 48 h dans tous les cas [26, 54]
egal([L.conseilDuJour([S('2026-11-16', 'Séance A')], '2026-11-17', [1, 3, 5]).repos, L.conseilDuJour([S('2026-11-16', 'Séance A')], '2026-11-18', [1, 3, 5]).repos], [true, false], 'conseilDuJour : repos le lendemain, séance 48 h après');

// ── Pas de repos proposé quand la semaine est en retard (règle de l'utilisateur) ──
// Le cas réel : séance libre le lundi 09/11, B le vendredi 13/11 ; jours lundi, mercredi, vendredi ; 3 par semaine.
const reel = [S('2026-11-09', 'Séance libre'), S('2026-11-13', 'Séance B')];
egal([L.retardSemaine(reel, '2026-11-15', [1, 3, 5], 3), L.retardSemaine(reel, '2026-11-14', [1, 3, 5], 3), L.retardSemaine([S('2026-11-16', 'A')], '2026-11-19', [1, 3, 5], 3),
  L.retardSemaine([S('2026-11-16', 'A')], '2026-11-17', [1, 3, 5], 3), L.retardSemaine([S('2026-11-13', 'B')], '2026-11-16', [1, 3, 5], 3), L.retardSemaine(reel, '2026-11-15', [1, 3, 5], 0), L.retardSemaine(reel, '2026-11-15', [1, 3, 5])],
[1, 1, 1, 0, 1, 0, 0], 'retardSemaine : ce qui manquerait dimanche soir sans séance aujourd\'hui (48 h entre deux séances) ; sans objectif, 0');
egal([L.retardSemaine([S('2026-11-16', 'A')], '2026-11-17', [1, 2, 4, 5], 3), L.retardSemaine([S('2026-11-16', 'A'), S('2026-11-17', 'B')], '2026-11-18', [1, 2, 4, 5], 3)], [1, 0],
  'retardSemaine : jours qui se suivent, toujours 48 h (lundi fait : seulement jeudi, il en manque 1 sur 3 ; lundi et mardi faits : jeudi, 0)'); // 2.3.0 : plus de 24 h quand les jours se suivent, et 3 séances au plus
egal(L.conseilDuJour(reel, '2026-11-15', [1, 3, 5], 3), { repos: false, retard: true, texte: 'Aujourd\'hui : séance. Il t\'en manque 1 pour faire tes 3 de la semaine.' },
  'conseilDuJour : dimanche hors jour de salle, semaine à 2 sur 3 : séance (le repos servait d\'excuse)');
egal([L.conseilDuJour(reel, '2026-11-15', [1, 3, 5]).texte, L.conseilDuJour(reel, '2026-11-14', [1, 3, 5], 3).repos, L.conseilDuJour([S('2026-11-16', 'A')], '2026-11-19', [1, 3, 5], 3).texte,
  L.conseilDuJour([S('2026-11-16', 'A'), S('2026-11-18', 'B'), S('2026-11-20', 'A')], '2026-11-22', [1, 3, 5], 3).repos],
['Aujourd\'hui : repos (pas un de tes jours de salle). Prochaine : demain.', true, 'Aujourd\'hui : séance. Il t\'en manque 2 pour faire tes 3 de la semaine.', true],
'conseilDuJour : sans objectif, la règle 1.12.0 ; le lendemain d\'une séance reste un repos ; objectif tenu : repos');

// ── La carte « Tes progrès » de l'accueil : seulement du vrai, au plus 4 lignes ──
// Séance A le lundi 16/11, puis le vendredi 20/11 : le tirage monte de charge, les élévations gagnent des répétitions à
// charge égale, le développé assis baisse (jamais montré), la presse monte (pas un exercice de la carrure). On est le 22/11.
const PA1 = S('2026-11-16', 'Séance A', [X('Tirage vertical prise large', [k(35, 12), k(35, 10)]), X('Développé assis à la machine', [k(20, 10)]), X('Élévations latérales aux haltères', [k(4, 15), k(4, 14)]), X('Presse à cuisses', [k(60, 10)])]);
const PA2 = S('2026-11-20', 'Séance A', [X('Tirage vertical prise large', [k(42.5, 8), k(40, 8)]), X('Développé assis à la machine', [k(17.5, 10)]), X('Élévations latérales aux haltères', [k(4, 20), k(4, 16)]), X('Presse à cuisses', [k(80, 10)])]);
egal(L.progresAccueil([PA1, PA2], prog, [], '2026-11-22', { parSemaine: 3 }), { lignes: [
  { texte: 'Élévations latérales : 4 kg × 15 → 4 kg × 20', type: 'exercice' },
  { texte: 'Tirage vertical : 35 → 42,5 kg', type: 'exercice' },
  { texte: 'Vendredi : 3 records', type: 'records' },
], vide: false }, 'progresAccueil : l\'exemple du 22/11 (charge, répétitions à charge égale, records de vendredi ; ni baisse, ni presse)');
egal(L.progresAccueil([PA1, PA2], prog, [{ date: '2026-08-24', epaules: 112 }, { date: '2026-11-16', epaules: 113, poids: 70 }], '2026-11-22', { parSemaine: 3 }).lignes.map((l) => l.texte).slice(-1),
  ['Épaules : 112 → 113 cm'], 'progresAccueil : le tour d\'épaules, s\'il a grandi en 84 jours ou plus');
// 2.3.0 : « Juge tes progrès sur 12 semaines, pas sur 2 » : les premières séances font gonfler le muscle d'eau [108, 109].
egal(L.progresAccueil([PA1, PA2], prog, [{ date: '2026-08-25', epaules: 112 }, { date: '2026-11-16', epaules: 113 }], '2026-11-22', { parSemaine: 3 }).lignes.some((l) => l.type === 'mesure'), false,
  'progresAccueil : le tour d\'épaules, pas avant 84 jours entre la première et la dernière mesure');
egal([[{ date: '2026-11-02', epaules: 113 }, { date: '2026-11-16', epaules: 112 }], [{ date: '2026-11-16', epaules: 113 }], [{ date: '2026-11-02', poids: 70 }, { date: '2026-11-16', poids: 71 }]]
  .map((m) => L.progresAccueil([PA1, PA2], prog, m, '2026-11-22', {}).lignes.some((l) => l.type === 'mesure')), [false, false, false],
'progresAccueil : épaules en baisse, une seule mesure, ou seulement le poids : rien');
// Au temps (un exercice de la carrure inventé pour le test) et au poids du corps (les tractions, remplaçant du tirage).
const progTemps = L.lireProgramme('---\nsalle: programme\n---\n## Séance T\n- Élévations latérales tenues · 3 × 30-60 s · repos 1 min\n- Tirage vertical prise large · 3 × 8-12 · ou Tractions (poids du corps)\n');
egal(L.progresAccueil([S('2026-11-16', 'T', [X('Élévations latérales tenues', [{ s: 30 }, { s: 25 }]), X('Tractions', [k(0, 12), k(0, 9)])]), S('2026-11-20', 'T', [X('Élévations latérales tenues', [{ s: 45 }]), X('Tractions', [k(0, 15)])])], progTemps, [], '2026-11-20', {}).lignes.filter((l) => l.type === 'exercice').map((l) => l.texte),
  ['Élévations latérales tenues : 30 s → 45 s', 'Tractions : 12 → 15 rép.'], 'progresAccueil : au temps (« 30 s → 45 s ») et au poids du corps (« 12 → 15 rép. »), remplaçants compris');
// Trois exercices au plus ; au moins deux quand d'autres lignes arrivent ; 4 lignes au plus (la régularité part en dernier).
const charge = (c) => [k(c, 10), k(c, 10)];
const quatre = (date, c) => S(date, 'Séance A', ['Tirage vertical prise large', 'Développé assis à la machine', 'Tirage horizontal à la poulie', 'Élévations latérales aux haltères'].map((n) => X(n, charge(c))));
const trois = L.progresAccueil([quatre('2026-11-16', 20), quatre('2026-11-18', 25), quatre('2026-11-20', 25)], prog, [], '2026-11-20', { parSemaine: 3 });
egal([trois.lignes.map((l) => l.type), trois.lignes.map((l) => l.texte.split(' : ')[0])], [['exercice', 'exercice', 'exercice'], ['Tirage vertical', 'Développé assis', 'Tirage horizontal']],
  'progresAccueil : 3 exercices au plus (à hausse égale, l\'ordre du programme)');
const semaines = (lundis, c) => lundis.flatMap((l, n) => [0, 2, 4].map((j) => quatre(L.plusJours(l, j), c + n * 6 + j)));
const plein = L.progresAccueil(semaines(['2026-11-02', '2026-11-09'], 20), prog, [{ date: '2026-08-23', epaules: 110 }, { date: '2026-11-15', epaules: 111 }], '2026-11-16', { parSemaine: 3 }); // 2.3.0 : 84 jours entre les mesures
egal(plein.lignes.map((l) => l.type), ['exercice', 'exercice', 'records', 'mesure'], 'progresAccueil : 4 lignes au plus : 2 exercices, les records, les épaules (la régularité attend)');
egal(L.progresAccueil(semaines(['2026-11-02', '2026-11-09'], 20), prog, [], '2026-11-16', { parSemaine: 3 }).lignes.map((l) => l.texte).slice(-1),
  ['2 semaines de suite à 3 séances'], 'progresAccueil : la régularité, à partir de 2 semaines de suite (L.regularite)');
const rattrapage = [S('2026-11-02', 'A'), S('2026-11-04', 'B'), S('2026-11-09', 'A'), S('2026-11-10', 'B'), S('2026-11-12', 'A'), S('2026-11-13', 'B')];
egal([L.progresAccueil(rattrapage, prog, [], '2026-11-17', { parSemaine: 3 }).lignes, L.progresAccueil(semaines(['2026-11-09'], 20), prog, [], '2026-11-16', { parSemaine: 3 }).lignes.some((l) => l.type === 'regularite')],
  [[{ texte: '2 semaines de suite', type: 'regularite' }], false], 'progresAccueil : une semaine rattrapée compte, sans dire « à 3 séances » ; une seule semaine : rien');
// Deux exercices au même nom court gardent leur nom entier.
const vert = (date, c) => S(date, 'X', [X('Tirage vertical prise large', charge(c)), X('Tirage vertical prise neutre', charge(c))]);
egal(L.progresAccueil([vert('2026-11-16', 30), vert('2026-11-20', 35)], prog, [], '2026-11-20', {}).lignes.filter((l) => l.type === 'exercice').map((l) => l.texte),
  ['Tirage vertical prise large : 30 → 35 kg', 'Tirage vertical prise neutre : 30 → 35 kg'], 'progresAccueil : deux « Tirage vertical » gardent leur nom entier');
// Rien à montrer : une seule phrase, vide = true. Une séance datée après aujourd'hui ne compte pas.
egal([L.progresAccueil([], prog, [], '2026-11-16', {}), L.progresAccueil([PA1], prog, [], '2026-11-16', {}), L.progresAccueil([PA1, PA1], prog, [], '2026-11-22', {}), L.progresAccueil([PA1, PA2], prog, [], '2026-11-17', {}).lignes[0].type],
  [{ lignes: [{ texte: 'Ta prochaine séance sera ton point de départ.', type: 'depart' }], vide: true },
    { lignes: [{ texte: 'Encore une séance et tu verras tes premiers progrès.', type: 'bientot' }], vide: true },
    { lignes: [{ texte: 'À ta prochaine séance : 1 répétition ou 1 cran de plus. Tu le verras ici.', type: 'prochaine' }], vide: true }, 'bientot'],
  'progresAccueil : rien encore, une seule séance, pas encore de hausse ; une séance à venir ne compte pas');
egal([L.progresAccueil(null, null, null, null, null).vide, L.progresAccueil([null, { date: 'x' }, S('2026-11-16', 'A', [null, X('Tirage vertical prise large', [null])])], [null, { exos: [null] }], [null, { date: 'x' }], '2026-11-18', null).vide],
  [true, true], 'progresAccueil : rien ne plante (entrées absentes ou abîmées)');

// ── Rien ne plante ──
egal([L.regularite([{ date: 'abc' }, null, S('2026-11-16', 'A')], '2026-11-18', 3, ['x', null]).semaines[11].etat, L.regularite([], 'abc', 3).texte, L.volumeSemaine([{}, null], '2026-11-18').length, L.bonRetour([{ date: 'x' }, null], '2026-11-18'),
  L.tonnage({}), L.recordSerie([{ date: '2026-11-13' }, null], 'Presse à cuisses', k(60, 10)), L.lignesSemaine(null, null).length, L.pointsCourbe(null, 'Presse'), L.proposerSemaineLegere([{ date: 'x' }], '2027-04-05', null), L.meilleureSerie([null, k(10, 10)]), L.bilanCompare(null, null).tuiles.length, L.compareExo(null, null).signe],
['en cours', 'Nouvelle série : semaine 1', 11, null, 0, null, 6, [], null, k(10, 10), 3, 'nouveau'], 'robustesse : dates illisibles, séances vides, réglages absents');

// ── « Pour te lancer », la carte d'avant la séance (L.boostAvant) ──
// Seulement du vrai, au plus 3 lignes : la hausse depuis le début, la semaine, la première fois. 2.14.2 (changement voulu,
// demande : « 2 records à portée : au contraire, c'est mieux quand il arrive, à la fin ») : plus aucun record annoncé d'avance.
// Un habitué (pas de mise en route), 1 h, 3 séances par semaine.
const REG = { niveau: 'regulier', parSemaine: 3, duree: 60 };
const prete = (seances, auj, i, bilan, reg) => L.preparerSeance(L.seanceDuJour(prog, seances, reg || REG, auj, i, bilan),
  { seances, programme: prog, reglages: reg || REG }); // 2.1.2 : la durée des réglages (plus de temps dans le bilan)
const boost = (seances, auj, i, bilan, reg) => L.boostAvant(prete(seances, auj, i, bilan, reg), seances, prog, auj, reg || REG, bilan);
const BILAN = (plus) => Object.assign({ date: '2026-11-18', douleur: null, courb: { niveau: 'aucune', zones: [] } }, plus || {}); // 2.1.2 : ni forme ni temps

// Séance B le mercredi 18/11. Le 13/11 : développé épaules 8 × 12 partout (la cible monte à 10 kg : plus lourd que jamais),
// développé incliné 10 × 8 (cible 10 × 9 : plus de répétitions à 10 kg), presse et leg curl aussi en hausse (pas la carrure,
// donc après), élévations 4 × 20 (cible 4 × 20 : pas un record). Le 11/11, les élévations étaient à 4 × 15.
const B11 = S('2026-11-11', 'Séance A', [X('Élévations latérales aux haltères', [k(4, 15), k(4, 14)])]);
const B13 = S('2026-11-13', 'Séance B', [X('Développé épaules aux haltères', [k(8, 12), k(8, 12)], '0'), X('Développé incliné aux haltères', [k(10, 8), k(10, 8)], '1-2'),
  X('Presse à cuisses', [k(60, 10), k(60, 10)]), X('Leg curl assis', [k(25, 10), k(25, 10)]), X('Élévations latérales aux haltères', [k(4, 20), k(4, 15)])]);
egal(boost([B11, B13], '2026-11-18', 1), { titre: 'Pour te lancer', lignes: [
  { texte: 'Depuis le 11/11 : élévations latérales 4 kg × 15 → 4 kg × 20', type: 'progres' },
  // 2.5.1 : texte raccourci (la phrase avec les 3 noms passait 2 lignes : le nombre, les noms et le pourquoi repliés).
  { texte: 'Première fois pour 3 exercices : 2 séries, sans aller au bout.\nLesquels : tirage vertical prise neutre, face pull et extension triceps.\nPourquoi : ce que tu notes aujourd\'hui sera ton point de départ.', type: 'depart' },
] }, 'boostAvant : la plus forte hausse depuis le début, puis la première fois ; aucun record annoncé (développé épaules et incliné étaient « à portée »)');
// Les exercices jamais faits : leur point de départ. Le tirage vertical prise neutre garde son nom entier : la prise large est
// déjà notée (« première fois » doit être vrai pour tout l'historique).
const L09 = S('2026-11-09', 'Séance libre', [X('Tirage vertical prise large', fois(3, k(40, 12)))]);
egal(boost([L09, B13], '2026-11-18', 1).lignes, [{ texte: 'Première fois pour 3 exercices : 2 séries, sans aller au bout.\nLesquels : tirage vertical prise neutre, face pull et extension triceps.\nPourquoi : ce que tu notes aujourd\'hui sera ton point de départ.', type: 'depart' }],
  'boostAvant : les exercices jamais faits, leur point de départ (nom entier quand le nom court est déjà pris)'); // 2.3.0 : « la première fois en 2 séries, sans aller au bout » (avis) [110]
// Rien de connu : la séance entière est un point de départ.
egal(boost([], '2026-11-16', 0), { titre: 'Pour te lancer', lignes: [{ texte: 'Première fois pour « Séance A » : ce que tu notes aujourd\'hui sera ton point de départ.', type: 'depart' }] },
  'boostAvant : rien de connu (première séance du programme) : une seule ligne, le point de départ');
// La 2e séance de la semaine, puis la première fois (6 exercices : le nombre, les noms repliés).
const A16 = S('2026-11-16', 'Séance A', [X('Presse à cuisses', [k(60, 10)]), X('Gainage planche', [{ s: 30 }, { s: 30 }])]);
egal(boost([A16], '2026-11-18', 0), { titre: 'Pour te lancer', lignes: [
  { texte: '2e séance de la semaine (2 sur 3)', type: 'semaine' },
  { texte: 'Première fois pour 6 exercices : 2 séries, sans aller au bout.\nLesquels : tirage vertical prise large, développé assis, tirage horizontal, leg curl assis, élévations latérales et curl aux haltères.\nPourquoi : ce que tu notes aujourd\'hui sera ton point de départ.', type: 'depart' },
] }, 'boostAvant : la 2e séance de la semaine, la première fois ; ni la presse ni le gainage annoncés comme records');
// La hausse (développé assis : 20 → 25 kg), la semaine complétée, la première fois ; jamais de baisse.
const L09b = S('2026-11-09', 'Séance libre', [X('Développé assis à la machine', [k(20, 8)])]);
const A16b = S('2026-11-16', 'Séance A', [X('Tirage vertical prise large', fois(3, k(35, 12))), X('Développé assis à la machine', [k(25, 7)]), X('Presse à cuisses', fois(3, k(60, 10))), X('Élévations latérales aux haltères', [k(4, 15)])]);
const B18b = S('2026-11-18', 'Séance B', [X('Élévations latérales aux haltères', [k(4, 18)])]);
egal(boost([L09b, A16b, B18b], '2026-11-20', 0), { titre: 'Pour te lancer', lignes: [
  { texte: 'Depuis le 09/11 : développé assis 20 → 25 kg', type: 'progres' },
  { texte: 'Cette séance complète ta semaine (3 sur 3)', type: 'semaine' },
  { texte: 'Première fois pour 4 exercices : 2 séries, sans aller au bout.\nLesquels : tirage horizontal, leg curl assis, curl aux haltères et gainage planche.\nPourquoi : ce que tu notes aujourd\'hui sera ton point de départ.', type: 'depart' },
] }, 'boostAvant : la hausse, la semaine complétée, la première fois, dans cet ordre');
const baisse = S('2026-11-16', 'Séance A', [X('Développé assis à la machine', [k(17.5, 10)])]);
egal(boost([L09b, baisse], '2026-11-18', 0).lignes.filter((l) => l.type === 'progres'), [], 'boostAvant : jamais de baisse (développé assis 20 → 17,5 kg : pas de ligne)');
// La semaine : rien pour la 1re séance, au-delà de l'objectif, ni pendant une semaine sans salle.
const quatre4 = [S('2026-11-16', 'Séance A'), S('2026-11-18', 'Séance B'), S('2026-11-20', 'Séance A')];
egal([boost([B13], '2026-11-16', 1).lignes.some((l) => l.type === 'semaine'), boost(quatre4, '2026-11-21', 1).lignes.some((l) => l.type === 'semaine'),
  boost([A16], '2026-11-18', 0, null, Object.assign({}, REG, { pauses: ['2026-11-16'] })).lignes.some((l) => l.type === 'semaine'),
  boost([A16], '2026-11-18', 0, null, Object.assign({}, REG, { parSemaine: 2 })).lignes.map((l) => l.texte).filter((t) => /semaine/.test(t))],
[false, false, false, ['Cette séance complète ta semaine (2 sur 2)']], 'boostAvant : la semaine, seulement quand c\'est vrai et motivant');
// Jour allégé : une seule ligne calme.
const CALME = { titre: 'Pour te lancer', lignes: [{ texte: 'Aujourd\'hui, on garde tes charges : ça compte aussi.', type: 'calme' }] };
egal([boost([B11, B13], '2026-11-18', 1, null, Object.assign({}, REG, { semainesLegeres: ['2026-11-16'] })),
  boost([B11, B13], '2026-11-18', 1, BILAN({ sommeil: 'court' }))], [CALME, CALME], 'boostAvant : semaine légère, nuit courte : une seule ligne calme'); // 2.1.2 : plus de « fatigué »
// Courbatures fortes sur tous les exercices : la ligne calme.
const sjC = prete([B11, B13], '2026-11-18', 1);
sjC.exos = sjC.exos.map((x) => Object.assign({}, x, { courb: true }));
egal(L.boostAvant(sjC, [B11, B13], prog, '2026-11-18', REG), { titre: 'Pour te lancer', lignes: [{ texte: 'Aujourd\'hui, plus léger là où tu as des courbatures : ça compte aussi.', type: 'calme' }] },
  'boostAvant : courbatures fortes sur tous les exercices : la ligne calme');
egal(L.boostAvant(prete([B11, B13], '2026-11-18', 1, BILAN({ sommeil: 'court' })), [B11, B13], prog, '2026-11-18', REG), CALME,
  'boostAvant : sans le bilan, la séance allégée suffit (exercices sans montée)'); // 2.1.2 : la nuit courte à la place de « fatigué »
// 2.14.2 : jamais de ligne « record », quel que soit l'historique ou le bilan.
const A16c = S('2026-11-16', 'Séance A', [X('Tirage vertical prise large', fois(3, k(35, 12))), X('Presse à cuisses', fois(3, k(60, 10)))]);
egal([boost([B11, B13], '2026-11-18', 1), boost([A16], '2026-11-18', 0), boost([A16c], '2026-11-18', 0), boost([A16c], '2026-11-18', 0, BILAN({ douleur: { zone: 'coude', type: 'tire' } }))]
  .map((b) => b.lignes.some((l) => l.type === 'record') || b.titre === 'À battre aujourd\'hui'), [false, false, false, false], 'boostAvant : plus aucun record annoncé avant la séance');
// Rien ne plante : entrées absentes ou abîmées (une donnée abîmée retire sa ligne, jamais la carte).
const abime = L.boostAvant({ nom: 'A', exos: [null, { nom: 'Presse à cuisses', series: 3, min: 10, max: 15, pas: 5 }] }, [null, { date: 'x' }, S('2026-11-16', 'A', [null, X('Presse à cuisses', null)])], null, '2026-11-18', null);
egal([L.boostAvant(null, null, null, null, null), L.boostAvant({ exos: [] }, [], [], '2026-11-18', {}), abime], [{ titre: '', lignes: [] }, { titre: '', lignes: [] },
  { titre: 'Pour te lancer', lignes: [{ texte: '2e séance de la semaine (2 sur 3)', type: 'semaine' }] }], 'boostAvant : rien ne plante (séance absente, vide, note abîmée)');

// ───────────────────────── Le physique qui plaît ─────────────────────────
// La recherche « Le physique qui plaît » (~/Desktop/CLAUDE/Salle-travail/recherche/La bonne séance.md, sources 160-188). Dans un bloc, comme ci-dessus.
{
const PD = L.lireProgramme(PROGRAMME_DEFAUT);
const elev = (s) => s.exos.find((e) => /elevations laterales aux halteres/.test(L.norm(e.nom)));
const M = (date, o) => Object.assign({ date }, o);

// 1. Élévations latérales : 4 séries en A, 3 en B (le côté des épaules à 10,5 séries directes par semaine) [88, 161, 37].
// 2.5.0 (« Ce qui plaît ») : 4 aussi en B, le côté des épaules à 12 séries directes par semaine ; B passe à 24 séries.
egal([elev(PD[0]).series, elev(PD[1]).series, PD[0].exos.reduce((t, e) => t + e.series, 0), PD[1].exos.reduce((t, e) => t + e.series, 0)], [4, 4, 24, 27],
  '1. programme livré : élévations latérales 4 séries en A et en B ; A 24 séries, B 27 (2.36.1 : le programme validé le 17/11)');

// 2. Le tour de taille se lit (« taille 82 », « tour de taille : 82,5 ») et s'écrit, et la ligne se relit.
egal([L.lireMesures('- 2026-12-06 · poids 71 kg · épaules 113 cm · taille 82 cm\n- 2026-12-07 · tour de taille : 82,5'),
  L.ligneMesure({ date: '2026-12-06', epaules: 113, taille: 82 }),
  L.lireMesures(L.ligneMesure({ date: '2026-12-06', poids: 71, taille: 81.5 }))],
[[{ date: '2026-12-06', poids: 71, epaules: 113, taille: 82 }, { date: '2026-12-07', taille: 82.5 }],
  '- 2026-12-06 · épaules 113 cm · taille 82 cm', [{ date: '2026-12-06', poids: 71, taille: 81.5 }]],
'2. mesures : le tour de taille se lit, s\'écrit et se relit');

// 3. Le rappel du mètre ruban : seulement le 1er dimanche du mois (06/12/2026), tant que la taille n'est pas mesurée ce mois-ci.
egal([L.rappelRuban([], '2026-12-06'), L.rappelRuban([], '2026-12-13'), L.rappelRuban([], '2026-12-07'),
  L.rappelRuban([M('2026-12-01', { taille: 82 })], '2026-12-06'), L.rappelRuban([M('2026-11-29', { taille: 82 }), M('2026-12-02', { poids: 70 })], '2026-12-06')],
[true, false, false, false, true], '3. rappel du mètre ruban : le 1er dimanche du mois, sauf si la taille est déjà mesurée ce mois-ci');

// 4. L'avis : la taille monte 2 mois de suite et les épaules ne bougent pas → enlever la collation (dit comme un avis) [30, 161].
{
  const monte = [M('2026-12-06', { taille: 80, epaules: 112 }), M('2027-01-03', { taille: 81 }), M('2027-02-07', { taille: 82, epaules: 112.5 })];
  const a = L.avisTaille(monte, '2027-02-07');
  egal([!!a && /^Avis : /.test(a.texte) && /collation/.test(a.texte),
    L.avisTaille(monte.map((m) => (m.epaules ? Object.assign({}, m, { epaules: m.date === '2027-02-07' ? 113.5 : 112 }) : m)), '2027-02-07'),
    L.avisTaille([monte[0], M('2027-01-03', { taille: 80.2 }), monte[2]], '2027-02-07'),
    L.avisTaille([monte[0], monte[2]], '2027-02-07'),
    L.avisTaille(monte, '2027-05-02')],
  [true, null, null, null, null],
  '4. avis taille : 2 mois de hausse sans épaules → enlever la collation ; pas si les épaules grandissent, si la taille stagne, s\'il manque un mois, ni des mois après');
}
}

// ───────────────────────── La balance (2.7.0) ─────────────────────────
// « La bonne séance », Calories et poids : un mince qui débute, léger surplus, +0,25 à 0,5 % du poids par semaine [30] ;
// une pesée par semaine, la tendance sur 2 à 4 semaines, le conseil (avis). Dans un bloc, comme ci-dessus.
{
const P = (date, poids) => ({ date, poids });
// 1. La cible : 70 kg → +0,18 à 0,35 kg par semaine (le chiffre de la recherche) ; 80 kg → 0,2 à 0,4.
egal([L.cibleParSemaine(70), L.cibleParSemaine(80), L.cibleParSemaine(0)], [{ min: 0.18, max: 0.35 }, { min: 0.2, max: 0.4 }, null],
  'balance 1. cible : +0,25 à 0,5 % du poids par semaine (70 kg : 0,18 à 0,35)');
// 2. La pente des moyennes de semaine : 70 → 70,2 → 70,5 en 2 semaines = +0,25 kg par semaine, dans la cible.
const s2 = L.suiviPoids([P('2026-11-15', 70), P('2026-11-22', 70.2), P('2026-11-29', 70.5)], '2026-11-29');
egal([s2.pente, s2.semaines, s2.etat, s2.tendance], [0.25, 3, 'dans', '+0,25 kg par semaine (3 semaines).'], 'balance 2. tendance : +0,25 kg par semaine sur 3 semaines, dans la cible');
// 3. Plat : sous la cible, ajouter une collation (avis) ; trop vite : l'enlever si la taille monte vite (avis).
const s3 = L.suiviPoids([P('2026-11-15', 70), P('2026-11-22', 70), P('2026-11-29', 70)], '2026-11-29');
const s4 = L.suiviPoids([P('2026-11-15', 70), P('2026-11-22', 70.6), P('2026-11-29', 71.2)], '2026-11-29');
egal([s3.etat, /ajoute une collation \(avis\)/.test(s3.conseil), s4.etat, /enlève la collation si ta taille monte vite \(avis\)/.test(s4.conseil)],
  ['sous', true, 'au-dessus', true], 'balance 3. plat → ajoute une collation ; +0,6 kg par semaine → enlève-la si la taille monte vite');
// 4. Plusieurs pesées dans une semaine : leur moyenne ; les semaines de plus de 4 semaines ne comptent pas.
const s5 = L.suiviPoids([P('2026-10-04', 60), P('2026-11-15', 69.8), P('2026-11-17', 70.2), P('2026-11-22', 70.2), P('2026-11-29', 70.5)], '2026-11-29');
egal([s5.semaines, s5.etat], [3, 'dans'], 'balance 4. deux pesées dans une semaine : leur moyenne ; une pesée d\'il y a 8 semaines ne compte pas');
// 5. Pas assez : 2 semaines, ou 3 pesées trop proches → null ; rien ne plante.
egal([L.suiviPoids([P('2026-11-22', 70), P('2026-11-29', 70.5)], '2026-11-29'), L.suiviPoids([P('2026-11-22', 70), P('2026-11-24', 70), P('2026-11-30', 70.5)], '2026-11-30'),
  L.suiviPoids(null, '2026-11-29'), L.suiviPoids([null, { date: 'x', poids: 70 }, P('2026-11-29', 'a')], '2026-11-29'), L.suiviPoids([], 'x')],
[null, null, null, null, null], 'balance 5. pas assez de pesées, ou trop proches : pas de tendance ; rien ne plante');
// 6. La ligne de l'accueil : le jour de la pesée, la tendance ; sinon le dimanche, le rappel (pas le 1er : mètre ruban).
const plat = [P('2026-11-15', 70), P('2026-11-22', 70), P('2026-11-29', 70)];
egal([L.lignePesee(plat, '2026-11-29').bouton, L.lignePesee(plat.slice(0, 2), '2026-11-29'), L.lignePesee(plat.slice(0, 2), '2026-11-28'),
  L.lignePesee([], '2026-12-06'), L.lignePesee([P('2026-11-25', 70)], '2026-11-25').texte],
[false, { texte: '**Pesée** ce matin, à jeun, après les toilettes.', bouton: true }, null, null, '**Pesée notée** : ta tendance s\'affiche après 3 semaines de pesées.'],
'balance 6. accueil : tendance le jour de la pesée ; rappel le dimanche sans pesée ; rien un autre jour ni le 1er dimanche');
}

// ── 2.14.2 : les succès de la séance, pour féliciter à la fin (L.succesSeance) ──
{
  const faite = { exos: [{ nom: 'Tirage vertical prise large', series: [{ c: 42.5, r: 8 }] }, { nom: 'Presse à cuisses', series: [{ c: 60, r: 11 }] }, { nom: 'Leg curl assis', series: [{ c: 25, r: 10 }] }] };
  const cmp = { records: [{ nom: 'Tirage vertical prise large', texte: 'Nouvelle charge' }, { nom: 'Presse à cuisses', texte: 'Record' }], exos: [{ signe: 'charge' }, { signe: 'plus' }, { signe: 'egal' }] };
  egal(L.succesSeance(faite, cmp, 3, 3), [
    { cle: 'seance', titre: 'Séance complète', detail: '3 exercices' },
    { cle: 'records', titre: '2 records', detail: 'Tirage vertical, presse' },
    { cle: 'progres', titre: '2 exercices en progrès', detail: 'Une charge ou une répétition de plus' },
    { cle: 'semaine', titre: 'Semaine complète', detail: '3 séances sur 3' },
  ], 'succesSeance : séance complète, records, progrès, semaine complète');
  egal(L.succesSeance(Object.assign({}, faite, { pasFait: [{ nom: 'Gainage planche' }] }), { records: [], exos: [{ signe: 'egal' }] }, 1, 3), [{ cle: 'seance', titre: 'Séance faite', detail: '3 exercices sur 4' }],
    'succesSeance : un exercice passé : « Séance faite », rien d\'autre sans record, ni progrès, ni semaine complète');
  egal([L.succesSeance(faite, null, 1, 3, { prevus: 8, complete: false })[0], L.succesSeance(faite, null, 1, 3, { prevus: 3, complete: true })[0]],
    [{ cle: 'seance', titre: 'Séance faite', detail: '3 exercices sur 8' }, { cle: 'seance', titre: 'Séance complète', detail: '3 exercices' }], 'succesSeance : avec le plan de la séance, « complète » seulement si tout ce qui était prévu est fini');
  egal([L.succesSeance(null, null, 0, 3), L.succesSeance({ exos: [] }, null, 3, 3).map((x) => x.cle), L.succesSeance(faite, null, 2, 0).map((x) => x.cle)], [[], ['semaine'], ['seance']], 'succesSeance : rien ne plante (séance absente, vide, sans comparaison)');
}

// ── 2.15.0 : l'essentiel pour manger, sur l'accueil (L.mangerEssentiel) ──
egal([L.mangerEssentiel({ poids: 70 }), L.mangerEssentiel({ poids: 90 })[0], L.mangerEssentiel(null)[0], L.mangerEssentiel({}).length],
  [['**Protéines** : 110 g par jour, au moins.', '**Assez manger** : ton poids doit monter de 0,8 à 1,5 kg par mois.'], '**Protéines** : 145 g par jour, au moins.', '**Protéines** : 110 g par jour, au moins.', 2],
  'mangerEssentiel : 1,6 g de protéines par kg (110 g au moins), et le poids qui doit monter ; 2 lignes, même sans poids');
egal([L.mangerEssentiel({ poids: 90 })[1], L.mangerEssentiel(null)[1]], ['**Assez manger** : ton poids doit monter de 1 à 1,9 kg par mois.', '**Assez manger** : ton poids doit monter un peu chaque mois.'],
  'mangerEssentiel : la prise de poids visée suit le poids des réglages (0,25 à 0,5 % par semaine) ; sans poids, pas de chiffre');

// ── 2.16.0 : les repas de chaque jour, lus dans « Ta journée » de la note « Manger » (L.repasDuJour) ──
{
  const NOTE = ['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g de protéines.', '', '## Ta journée', '',
    '- **Matin** : flocons d\'avoine, lait, banane. Dans un grand bol, 12 cuillères à soupe.', '- **Midi** : viande ou poisson, avec riz, pâtes ou pommes de terre. Une assiette pleine.',
    '- **Soir** : pâtes au thon, ou omelette, ou poulet et lentilles. Les recettes sont dans « Plats du soir ».', '- **Avant de dormir** : un verre de lait. 25 cl.',
    '- **Collation, quand le plugin te le dit** : lait, banane. 25 cl de lait.', 'une ligne sans puce', '', '## Plats du soir', '', '- **Thon et pâtes** : ¼ de paquet.'].join('\n');
  egal(L.repasDuJour(NOTE), [{ repas: 'Matin', quoi: 'flocons d\'avoine, lait, banane' }, { repas: 'Midi', quoi: 'viande ou poisson, avec riz, pâtes ou pommes de terre' },
    { repas: 'Soir', quoi: 'pâtes au thon, ou omelette, ou poulet et lentilles' }, { repas: 'Avant de dormir', quoi: 'un verre de lait' }],
  'repasDuJour : une ligne par repas de « Ta journée », sa première phrase (avec ses « ou »), sans la collation ni les autres sections');
  egal([L.repasDuJour(null), L.repasDuJour(''), L.repasDuJour('# Manger\n\n- **Matin** : avoine.\n'), L.repasDuJour('## Ta journée\n\nrien de lisible\n')], [[], [], [], []], 'repasDuJour : note absente, sans section « Ta journée », ou sans puce lisible : rien');
}

// ── 2.18.0 : la note « Manger » par repas : les plats d'une partie (L.plats), et les repas de l'accueil qui en viennent ──
{
  const NOTE = ['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g.', '', '## Matin', '', '### Bol d\'avoine', '- 12 cuillères à soupe de flocons', '1. Micro-ondes : 1 min.', '',
    '## Midi', '', 'À l\'école : viande ou poisson.', '', '### Poulet et riz', '- 1 blanc de poulet cuit', '1. Riz : 2 min.', '', '### Pâtes au thon', '- 1 boîte de thon', '',
    '## Goûter', '', '### Skyr, banane, amandes', '- 1 pot de skyr', '', '### Collation en plus', '- 25 cl de lait', '', '## Les courses de la semaine', '', '- 6 œufs'].join('\n');
  const midi = L.sections(NOTE).find((s) => s.titre === 'Midi');
  egal(L.plats(midi.lignes), { avant: ['', 'À l\'école : viande ou poisson.', ''], plats: [{ nom: 'Poulet et riz', lignes: ['- 1 blanc de poulet cuit', '1. Riz : 2 min.', ''] }, { nom: 'Pâtes au thon', lignes: ['- 1 boîte de thon', ''] }] },
    'plats : ce qui précède le premier plat, puis chaque plat avec sa recette');
  egal([L.plats(['- une puce', 'du texte']).plats, L.plats(null)], [[], { avant: [], plats: [] }], 'plats : sans « ### », aucun plat');
  egal(L.repasDuJour(NOTE), [{ repas: 'Matin', quoi: 'bol d\'avoine' }, { repas: 'Midi', quoi: 'poulet et riz, ou pâtes au thon' }, { repas: 'Goûter', quoi: 'skyr, banane, amandes' }],
    'repasDuJour : une ligne par repas qui a des plats, reliés par « ou » ; ni la collation, ni les courses');
}

// ── 2.19.0 : le repas du moment, d'après l'heure (L.repasDuMoment) ──
{
  const R = [{ repas: 'Matin', quoi: 'bol d\'avoine' }, { repas: 'Midi', quoi: 'poulet et riz, ou pâtes au thon' }, { repas: 'Goûter', quoi: 'skyr, banane, amandes' }, { repas: 'Soir', quoi: 'poulet et lentilles, ou saumon' }];
  const quand = (h) => { const m = L.repasDuMoment(R, h); return m ? `${m.quand} : ${m.repas}` : null; };
  egal([4, 10, 11, 14, 15, 17, 18, 23, 0, 3].map(quand), ['Ce matin : Matin', 'Ce matin : Matin', 'Ce midi : Midi', 'Ce midi : Midi', 'Au goûter : Goûter', 'Au goûter : Goûter', 'Ce soir : Soir', 'Ce soir : Soir', 'Ce soir : Soir', 'Ce soir : Soir'],
    'repasDuMoment : le matin de 4 h à 11 h, le midi de 11 h à 15 h, le goûter de 15 h à 18 h, le soir de 18 h à 4 h');
  egal([L.repasDuMoment(R, 12), L.repasDuMoment(R.filter((x) => x.repas !== 'Midi'), 12), L.repasDuMoment(null, 12), L.repasDuMoment(R, NaN)],
    [{ repas: 'Midi', quoi: 'poulet et riz, ou pâtes au thon', quand: 'Ce midi' }, null, null, null], 'repasDuMoment : le repas de la note ; sans ce repas, sans note ou sans heure : rien');
}

// ── 2.20.0 : quand boire, sur la carte « Manger » de l'accueil (L.boireRepas) ──
egal([L.boireRepas(true), L.boireRepas(false), L.boireRepas()], ['**Bois** : un grand verre d\'eau avec ce repas.', '**Bois** : un grand verre d\'eau à chaque repas.', '**Bois** : un grand verre d\'eau à chaque repas.'],
  'boireRepas : avec le repas du moment ; sans repas du moment, « à chaque repas »');

// ── 2.31.0 : le rapport épaules ÷ taille, le repère de l'objectif (demande : les mesures servent à atteindre l'objectif) ──
{
  const m0 = { date: '2026-11-15', epaules: 107, bras: 34, taille: 75 };
  egal([L.rapportV([m0]), L.rapportV([{ date: '2027-02-07', epaules: 110, taille: 75 }, m0, { date: '2026-12-06', poids: 71 }]), L.rapportV([{ date: '2026-11-15', epaules: 107 }]), L.rapportV(null)],
    [{ valeur: 1.43, date: '2026-11-15', debut: null }, { valeur: 1.47, date: '2027-02-07', debut: { valeur: 1.43, date: '2026-11-15' } }, null, null],
    'rapportV : épaules ÷ taille de la dernière mesure qui a les deux, le départ pour comparer ; sans les deux tours : rien');
}
