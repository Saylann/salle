// Les tests de la logique de séance (L de src/10-outils.js, 20-notes.js, 30-seance-choix.js à 36-conseil.js).
// Une règle = un test. Les exemples chiffrés sont ceux de ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-contrat-2.0.md, sur le programme 1.15.0 figé
// (PROGRAMME_115, tests/programme-115.js) : ils ne bougent pas quand Programme.md change.
// Lancé par tests/lancer.js (egal, vrai, avertir, lireNote viennent de tests/commun.js ; ce fichier est isolé dans un bloc).
const P115 = L.lireProgramme(PROGRAMME_115);
const A115 = P115[0].exos, B115 = P115[1].exos;
const exo = (nom) => A115.concat(B115).find((e) => e.nom === nom);
const noms = (l) => l.map((e) => e.nom);
const REGULIER = { niveau: 'regulier', parSemaine: 3, duree: 60 };
// La séance d'un jour, préparée, sans séance notée (réglage « regulier » : pas de mise en route).
// 2.1.2 : temps = la durée des réglages (avant : le temps du jour donné par le bilan).
const prepa = (i, temps, reg) => {
  const r = Object.assign({}, REGULIER, reg || {}, temps ? { duree: temps } : {});
  return L.preparerSeance(L.seanceDuJour(P115, [], r, '2026-11-16', i), { seances: [], programme: P115, reglages: r });
};
const groupes = (l) => l.map((e) => (e.groupe ? `${e.groupe}:${e.nom}` : e.nom));
// La vraie note du 13/11 (copie de Séances/2026-11-13 Séance B.md) : 80 min pour 60 prévues.
const NOTE_13 = '---\nsalle: seance\ndate: 2026-11-13\nnom: Séance B\nduree_min: 80\ncardio_min: 10\nforme: normale\ndouleur: aucune\ncourbatures: legeres, bras\ntemps_min: 60\nressenti: bien\n---\n# Séance B · vendredi 13 novembre 2026\n\nÉchauffement : 5 min\n\nPas fait : Face pull à la poulie\n\n## Développé épaules aux haltères\n- 8 kg × 12\n- 8 kg × 12\n\nRéserve : 0 (à fond)\n\n## Tractions\n- 12 rép.\n- 9 rép.\n\n## Développé incliné aux haltères\n- 10 kg × 8\n- 10 kg × 8\n\nRéserve : 1 ou 2\n\n## Presse à cuisses\n- 60 kg × 10\n- 60 kg × 10\n\n## Leg curl assis\n- 25 kg × 10\n- 25 kg × 10\n\nRéserve : 0 (à fond)\n\n## Élévations latérales aux haltères\n- 4 kg × 20\n- 4 kg × 15\n';
const note13 = L.lireSeance(NOTE_13);

// ── Outils ──
egal([L.estEtage(0), L.estEtage(2), L.estEtage(null), L.estEtage(undefined), L.estEtage('1'), L.estEtage(-1)], [true, true, false, false, false, false], 'estEtage : null n\'est pas un étage (null >= 0 est vrai en JavaScript)');
egal([L.mediane([3, 1, 2]), L.mediane([1.25, 1.667]), L.mediane([]), L.mediane(null)], [2, 1.4585, null, null], 'mediane : impair, pair, vide');

// ── Ordre : bras et gainage en dernier ──
egal(['Curl aux haltères', 'Curl à la barre en Z', 'Extension triceps à la poulie', 'Extension triceps au-dessus de la tête à la poulie', 'Leg curl assis', 'Gainage planche', 'Face pull à la poulie', 'Dips'].map(L.estFin),
  [true, true, true, true, false, true, false, false], 'estFin : bras et gainage (contrat)');
egal(['Leg curl assis', 'Dips', 'Développé incliné aux haltères', 'Barre au front', 'Curl marteau', 'Tirage vertical prise large'].map(L.estBras), [false, false, false, true, true, false], 'estBras : la famille d\'abord (leg curl = jambes), ni dips ni développés');
const oA = L.ordonnerParEtage(A115), oB = L.ordonnerParEtage(B115);
egal([noms(oA.exos), oA.changements, oA.etageEchauffement], [['Tirage vertical prise large', 'Développé assis à la machine', 'Presse à cuisses', 'Tirage horizontal à la poulie', 'Leg curl assis', 'Élévations latérales aux haltères', 'Curl aux haltères', 'Gainage planche'], 2, 1], 'ordre A : étage 1 puis 2, puis la fin (curl à l\'étage 2, gainage à l\'étage 1)');
egal([noms(oB.exos), oB.changements, oB.etageEchauffement], [['Tirage vertical prise neutre', 'Presse à cuisses', 'Leg curl assis', 'Face pull à la poulie', 'Développé épaules aux haltères', 'Développé incliné aux haltères', 'Élévations latérales aux haltères', 'Extension triceps à la poulie'], 2, 1], 'ordre B : l\'extension triceps attend les développés ; le reste dans l\'ordre du programme, étage par étage (2.36.0)'); // Relecture 2.0 (E7) : le leg curl et le face pull descendent avec l'extension triceps, sans changement d'étage en plus
// 2.36.0 : un programme écrit par priorités (dos et épaules, puis pecs et bras, les jambes après) garde cet ordre ; seule
// l'extension triceps, à l'étage 1, attend la fin (elle gênerait les développés).
{
  const M = (nom, etage) => ({ nom, etage });
  const a = L.ordonnerParEtage([M('Tirage vertical prise large', 1), M('Tirage horizontal à la poulie', 1), M('Élévations latérales aux haltères', 2), M('Curl à la barre en Z', 2),
    M('Développé incliné à la machine', 2), M('Presse à cuisses', 2), M('Leg curl assis', 2), M('Extension triceps au-dessus de la tête à la poulie', 1)], [1]);
  const b = L.ordonnerParEtage([M('Tirage vertical prise neutre', 1), M('Élévations latérales aux haltères', 2), M('Développé incliné aux haltères', 2), M('Curl à la barre en Z', 2),
    M('Développé épaules aux haltères', 2), M('Presse à cuisses', 2), M('Leg curl assis', 2), M('Extension triceps au-dessus de la tête à la poulie', 1)], [1]);
  // 2.38.71 : l'extension triceps, à l'étage 1, se fait avec les tirages : un exercice au moins la sépare du développé
  // (O2 ne joue plus que pour deux exercices qui s'enchaînent) ; une seule montée, plus de descente à la fin.
  egal([noms(a.exos), a.changements, noms(b.exos), b.changements],
    [['Tirage vertical prise large', 'Tirage horizontal à la poulie', 'Extension triceps au-dessus de la tête à la poulie', 'Élévations latérales aux haltères', 'Curl à la barre en Z', 'Développé incliné à la machine', 'Presse à cuisses', 'Leg curl assis'], 1,
      ['Tirage vertical prise neutre', 'Extension triceps au-dessus de la tête à la poulie', 'Élévations latérales aux haltères', 'Développé incliné aux haltères', 'Curl à la barre en Z', 'Développé épaules aux haltères', 'Presse à cuisses', 'Leg curl assis'], 1],
    'ordre : un programme écrit avec le triceps en dernier (étage 1) : le triceps passe avec les tirages, une seule montée (2.38.71)');
}
// 2.36.0 (O2) : un exercice des bras garde sa place, sauf s'il reste après lui un gros exercice de sa famille.
{
  const o1 = L.ordonnerParEtage([{ nom: 'Tirage', etage: 1 }, { nom: 'Leg curl', etage: 1 }, { nom: 'Développé couché', etage: 2 }, { nom: 'Curl', etage: 1 }]);
  const o2 = L.ordonnerParEtage([{ nom: 'Curl', etage: 1 }, { nom: 'Tirage', etage: 1 }, { nom: 'Développé couché', etage: 2 }]);
  const o3 = L.ordonnerParEtage([{ nom: 'Tirage', etage: 1 }, { nom: 'Extension triceps', etage: 1 }, { nom: 'Développé couché', etage: 2 }, { nom: 'Curl', etage: 2 }]);
  egal([noms(o1.exos), o1.changements, noms(o2.exos), noms(o3.exos), o3.changements],
    [['Tirage', 'Leg curl', 'Curl', 'Développé couché'], 1, ['Tirage', 'Développé couché', 'Curl'], ['Tirage', 'Développé couché', 'Curl', 'Extension triceps'], 2],
    'ordre O2 : le curl reste à son étage quand aucun tirage ne vient après ; il attend la fin s\'il est écrit avant un tirage ; l\'extension triceps attend les développés');
}
// 2.38.71 : O2 ne joue que pour deux exercices qui s'enchaînent (les études qui mesurent une perte les enchaînent).
{
  const o4 = L.ordonnerParEtage([{ nom: 'Tirage', etage: 1 }, { nom: 'Extension triceps', etage: 1 }, { nom: 'Leg curl', etage: 1 }, { nom: 'Développé couché', etage: 2 }]);
  const o5 = L.ordonnerParEtage([{ nom: 'Curl', etage: 1 }, { nom: 'Presse', etage: 1 }, { nom: 'Tirage', etage: 1 }]);
  egal([noms(o4.exos), o4.changements, noms(o5.exos)], [['Tirage', 'Extension triceps', 'Leg curl', 'Développé couché'], 1, ['Curl', 'Presse', 'Tirage']],
    'ordre O2 (2.38.71) : un exercice entre le triceps et le développé (ou entre le curl et le tirage) : chacun garde sa place');
}
{
  const o = L.ordonnerParEtage([{ nom: 'Curl' }, { nom: 'Développé couché' }, { nom: 'Gainage' }]);
  egal([noms(o.exos), o.etageEchauffement, o.changements], [['Curl', 'Développé couché', 'Gainage'], null, 0], 'ordre sans aucun étage : l\'ordre du programme, le gainage en dernier');
}
egal(noms(L.ordonnerParEtage([{ nom: 'Tirage', etage: 1 }, { nom: 'Curl' }, { nom: 'Élévations', etage: 2 }, { nom: 'Gainage' }]).exos), ['Tirage', 'Curl', 'Élévations', 'Gainage'], 'ordre : le curl reste à l\'étage du tirage, le gainage en dernier');
egal(noms(L.ordonnerParEtage([{ nom: 'Gainage planche', etage: 1 }, { nom: 'Curl', etage: 1 }, { nom: 'Presse', etage: 1 }]).exos), ['Curl', 'Presse', 'Gainage planche'], 'ordre : dans un étage, l\'ordre du programme, le gainage en dernier');
egal([noms(L.ordonnerParEtage([{ nom: 'Gainage planche', etage: 1 }, { nom: 'Planche latérale', etage: 2 }]).exos), noms(L.ordonnerParEtage([{ nom: 'Gainage planche', etage: 1 }, { nom: 'Curl', etage: 2 }]).exos)],
  [['Gainage planche', 'Planche latérale'], ['Curl', 'Gainage planche']], 'ordre : rien que la fin, sans erreur (départ à l\'étage du cardio) ; un curl seul passe avant le gainage (2.36.0)');
egal(noms(L.ordonnerParEtage([{ nom: 'Curl', etage: 2 }, L.exoEchauffement(), { nom: 'Presse', etage: 1 }]).exos), ['Échauffement', 'Presse', 'Curl'], 'ordre : l\'échauffement toujours en premier');
egal([A115.length, oA.exos.length, B115.length, oB.exos.length, A115[0].nom], [8, 8, 8, 8, 'Tirage vertical prise large'], 'ordre : aucun exercice perdu, le programme n\'est pas modifié');

// ── Dose : 45 min ne coupe plus les séries ──
egal([L.adapter(A115, { niveau: 'un peu', duree: 45 }, 9).exos.map((e) => e.series), L.adapter(B115, { niveau: 'un peu', duree: 45 }, 9).exos.map((e) => e.series)], [[3, 3, 3, 3, 3, 2, 2], [3, 3, 3, 3, 3, 3, 2]], 'adapter 45 min : sans les options, mais toutes les séries');
egal([L.adapter(A115, { duree: 45 }, 9).superseries, L.adapter(A115, { duree: 60 }, 9).superseries, L.adapter(A115, null, 9).superseries], [true, false, false], 'adapter : superseries à 45 min ou moins');

// ── Superséries ──
egal([L.scorePaire(exo('Tirage vertical prise large'), exo('Développé assis à la machine')), L.scorePaire(exo('Presse à cuisses'), exo('Leg curl assis')), L.scorePaire(exo('Presse à cuisses'), exo('Tirage horizontal à la poulie'))], [2, 2, 1], 'scorePaire : tirer + pousser et avant + arrière des cuisses valent 2, sinon 1');
egal([L.scorePaire(exo('Développé épaules aux haltères'), exo('Développé incliné aux haltères')), L.scorePaire(exo('Tirage vertical prise large'), exo('Tirage horizontal à la poulie'))], [0, 0], 'scorePaire : jamais deux gros de la même famille, ni le même muscle');
egal([L.scorePaire(exo('Leg curl assis'), exo('Gainage planche')), L.scorePaire(L.exoEchauffement(), exo('Presse à cuisses')), L.scorePaire(exo('Tirage horizontal à la poulie'), exo('Élévations latérales aux haltères'))], [0, 0, 0], 'scorePaire : ni au temps, ni l\'échauffement, ni deux étages différents');
egal([L.scorePaire(exo('Tirage horizontal à la poulie'), Object.assign({}, exo('Curl aux haltères'), { etage: 1 })), L.scorePaire({ nom: 'Pompes', unite: 'reps' }, { nom: 'Rowing', unite: 'reps' })], [0, 2], 'scorePaire : un bras reste avec la fin ; deux étages inconnus = même étage');
// 2.38.91 (ses règles de l'ordre, 24/11) : jamais deux exercices qui partagent un muscle, ni un développé avec des élévations.
{
  const X = (nom) => ({ nom, unite: 'reps', etage: 2 });
  egal([L.scorePaire(X('Développé incliné aux haltères'), X('Élévations latérales aux haltères')), L.scorePaire(X('Tirage vertical prise neutre'), X('Face pull à la poulie')), L.scorePaire(X('Tirage vertical prise neutre'), X('Élévations latérales à la machine'))],
    [0, 0, 2], 'scorePaire : un développé et des élévations, ou un muscle en commun (le dos) : jamais ; tirage + élévations : oui');
}
egal(L.resumeBilan({ douleur: null, courb: { niveau: 'aucune', zones: [] }, temps: 45 }), 'Pas de douleur, pas de courbatures fortes, nuit de 6 h ou plus, peu de temps.', 'resumeBilan : « peu de temps » quand il l\'a choisi (2.38.91)');
egal(L.scorePaire(exo('Développé épaules aux haltères'), exo('Élévations latérales aux haltères')), 0, 'scorePaire : développé épaules et élévations travaillent le même muscle (L.musclePrincipal, lot A-progrès)');
{
  const A45 = L.ordonnerParEtage(L.adapter(A115, { niveau: 'regulier', duree: 45 }, 9).exos).exos;
  const B45 = L.ordonnerParEtage(L.adapter(B115, { niveau: 'regulier', duree: 45 }, 9).exos).exos;
  egal(groupes(L.grouperSuperseries(A45)), ['g1:Tirage vertical prise large', 'g1:Développé assis à la machine', 'g2:Presse à cuisses', 'g2:Leg curl assis', 'Tirage horizontal à la poulie', 'Élévations latérales aux haltères', 'Gainage planche'], 'superséries A (45 min) : tirage + développé, presse + leg curl, le reste seul');
  egal(groupes(L.grouperSuperseries(B45)), ['Tirage vertical prise neutre', 'g1:Presse à cuisses', 'g1:Leg curl assis', 'Face pull à la poulie', 'Développé épaules aux haltères', 'Développé incliné aux haltères', 'Élévations latérales aux haltères'], 'superséries B (45 min) : presse + leg curl (muscles opposés) d\'abord ; le développé épaules seul (jamais avec l\'autre développé ni les élévations)'); // Relecture 2.0 : deux passes, les paires à 2 d'abord (avant : tirage + presse, puis leg curl + face pull)
  egal([A45.some((e) => e.groupe), L.grouperSuperseries([]), L.grouperSuperseries(null)], [false, [], []], 'grouperSuperseries : des copies (l\'entrée n\'est pas touchée), liste vide sans erreur');
}

// ── Bilan : la nuit (2.1.2 : plus de forme ni de repas) ──
{
  const BL = (x) => Object.assign({ date: '2026-11-16', douleur: null, courb: { niveau: 'aucune', zones: [] } }, x);
  const sjS = L.seanceDuJour(P115, [], REGULIER, '2026-11-16', 0, BL({ sommeil: 'court' }));
  egal([sjS.exos.map((e) => e.series), sjS.exos.every((e) => e.sansMontee), sjS.changements], [[3, 3, 3, 3, 3, 2, 2, 2], true, ['Nuit de moins de 6 h : mêmes charges que la dernière fois, sans chercher de record.']], 'bilan 4 : nuit de moins de 6 h = mêmes charges, toutes les séries'); // Relecture 2.0 : « La bonne séance » dit seulement « fais ta séance sans chercher de record » (avant : une série de moins, comme fatigué)
  const ancien = L.seanceDuJour(P115, [], REGULIER, '2026-11-16', 0, BL({ forme: 'fatigue', repas: 'loin', temps: 45 }));
  egal([ancien.exos.map((e) => e.series), ancien.exos.some((e) => e.sansMontee), ancien.changements], [[3, 3, 3, 3, 3, 2, 2, 2], false, []], 'bilan d\'avant la 2.1.2 : la forme, le repas et le temps ne changent plus la séance'); // 2.1.2 : aucune étude de « La bonne séance » ne justifie leurs effets ; la durée des réglages fait foi (avant : fatigué = une série de moins, repas = un conseil, temps = la durée du jour)
  egal([L.toutVaBien(BL()), L.toutVaBien(BL({ sommeil: 'court' })), L.toutVaBien(BL({ sommeil: 'ok' }))], [true, false, true], 'toutVaBien : une nuit courte, ce n\'est plus « tout va bien » (« ok » compte comme rien)'); // 2.1.2 : plus de repas ni de temps
  egal([L.resumeBilan(BL()), L.resumeBilan(BL({ sommeil: 'court', courb: { niveau: 'fortes', zones: ['bras'] } }))], ['Pas de douleur, pas de courbatures fortes, nuit de 6 h ou plus.', 'Pas de douleur, courbatures fortes aux bras, nuit de moins de 6 h.'], 'resumeBilan : une partie par question'); // 2.1.2 : les 3 questions (avant : la forme, le repas, le temps)
  egal(L.bilanParDefaut([], '2026-11-16'), { date: '2026-11-16', douleur: null, courb: { niveau: 'aucune', zones: [] }, depuis: null }, 'bilanParDefaut : rien à signaler, nuit de 6 h ou plus'); // 2.1.2 : ni forme ni temps
}

// ── Conseil de charge ──
{
  // 2.22.0 : la charge de départ vient du poids des réglages (L.chargeDepart), posée sur l'exercice par L.preparerSeance.
  const tirage = Object.assign({}, exo('Tirage vertical prise large'), { depart: L.chargeDepart(exo('Tirage vertical prise large'), 70) }), D = (series, reserve) => (reserve ? { date: 'x', series, reserve } : { date: 'x', series });
  const s3 = (a, b, c) => [{ c: 40, r: a }, { c: 40, r: b }, { c: 40, r: c }];
  egal([L.conseil(tirage, null).texte, L.conseil({ nom: 'Exercice inconnu', series: 3, min: 8, max: 12, unite: 'reps', pas: 2.5 }, null).texte],
    ['Première fois : essaie 40 kg (une estimation), ajuste avec − et +.', 'Première fois : prends léger, puis ajuste avec − et +.'], 'conseil : première fois, « arrête quand il t\'en reste 2 »');
  egal(L.conseil(exo('Tirage vertical prise large'), null).texte, 'Première fois : prends léger, puis ajuste avec − et +.', 'conseil : sans charge de départ (poids inconnu), « prends léger »'); // 2.5.1 : texte raccourci (« arrête quand il t'en reste 2 » : la ligne d'effort, L.effort)
  vrai([L.conseil(tirage, null), L.conseil({ nom: 'Exercice inconnu', series: 3, min: 8, max: 12, unite: 'reps', pas: 2.5 }, null), L.conseil({ nom: 'Tractions', corps: true, series: 3, min: 8, max: 12, unite: 'reps', pas: 2.5 }, null)].every((c) => c.texte.indexOf('encore 2 ou 3') < 0), 'conseil : plus jamais « encore 2 ou 3 »');
  const mont = L.conseil(tirage, D([{ c: 35, r: 12 }, { c: 35, r: 12 }, { c: 35, r: 12 }]));
  egal([mont.charge, mont.valeur, mont.monte, mont.texte], [37.5, 8, true, '12 répétitions partout à 35 kg : monte à 37,5 kg.\nComment : le plus de répétitions propres, au moins 8 (avis).'], 'conseil : après une montée, le plus de répétitions propres (avis)'); // 2.5.1 : texte raccourci
  egal(L.conseil(tirage, D(s3(12, 10, 9), '3+')).texte, '12 à la 1re série, 3 ou plus en réserve : monte à 42,5 kg.\nComment : le plus de répétitions propres, au moins 8 (avis).', 'conseil R1 : le texte de la montée'); // 2.5.1 : texte raccourci
  const r1b = L.conseil(tirage, D(s3(10, 9, 8), '3+')), r1c = L.conseil(tirage, D(s3(11, 10, 9), '3+'));
  egal([r1b.charge, r1b.valeur, r1b.texte, r1c.charge, r1c.valeur], [40, 12, 'Il t\'en restait 3 ou plus : garde 40 kg et vise 12 (2 de plus).', 40, 12], 'conseil R1 bis : 3 ou plus en réserve → 2 répétitions de plus (plafond : le haut de la fourchette)');
  egal([L.conseil(tirage, D(s3(10, 9, 8), '1-2')).valeur, L.conseil(tirage, D(s3(10, 9, 8))).valeur], [11, 11], 'conseil R1 bis : seulement avec « 3 ou plus »');
  const elev = L.conseil(exo('Élévations latérales aux haltères'), D([{ c: 4, r: 20 }, { c: 4, r: 15 }]));
  egal([elev.charge, elev.valeur, elev.texte], [4, 20, 'Garde 4 kg (la dernière fois : 20, 15). Refais 20 à la 1re série, gagne sur les suivantes.'], 'conseil : déjà au haut de la fourchette à la 1re série, le texte ne promet pas une répétition de plus (cas réel du 13/11)');
// 2.40.9 (simulations) : avec 3 séries à deux chiffres, la phrase dépasse 2 lignes : la fin passe à la ligne.
{
  const ex = { nom: 'Extension triceps au-dessus de la tête à la poulie', min: 10, max: 15, pas: 2.5, series: 3 };   // son cas vu le 26/11
  const c = L.conseil(ex, { date: '2026-11-25', series: [{ c: 10, r: 15 }, { c: 10, r: 12 }, { c: 10, r: 12 }] });
  egal([c.texte.split('\n'), c.texte.split('\n').every((l) => l.length <= L.LIGNE_MAX)], [['Garde 10 kg (la dernière fois : 15, 12, 12).', 'Refais 15 à la 1re série, gagne sur les suivantes.'], true],
    'conseil : une phrase trop longue pour 2 lignes passe à la ligne');
}
  const leg = L.conseil(Object.assign({}, tirage, { legere: true }), D([{ c: 40, r: 11 }, { c: 40, r: 10 }, { c: 40, r: 12 }]));
  egal(leg, { charge: 40, valeur: 11, plafond: 12, legere: true, texte: 'Semaine légère : même charge et mêmes répétitions que la dernière fois. Le corps récupère.' }, 'conseil semaine légère : même charge, mêmes répétitions');
  egal([L.conseil(Object.assign({}, tirage, { legere: true }), null).charge, L.conseil(Object.assign({}, exo('Gainage planche'), { legere: true }), { date: 'x', series: [{ s: 40 }] }).valeur], [40, 45], 'conseil semaine légère : sans fois d\'avant ou au temps, le conseil normal');
  egal(L.conseil(Object.assign({}, tirage, { legere: true, sansMontee: true }), D(s3(12, 12, 12))).charge, 40, 'conseil : la semaine légère passe avant « fatigué » (pas de montée)');
}

// ── Effort ──
{
  const devIncl4 = Object.assign({}, exo('Développé incliné aux haltères'), { series: 4 });
  egal([L.effort(exo('Développé assis à la machine'), 0), L.effort(devIncl4, 3), L.effort(exo('Élévations latérales aux haltères'), 2), L.effort({ nom: 'Tractions', corps: true, series: 3, unite: 'reps' }, 2)],
    ['Arrête-toi quand il t\'en reste 2.', 'Dernière série : garde 1 ou 2 en réserve, jamais l\'échec.', 'Dernière série : va jusqu\'à 1, ou 0.', 'Dernière série : va jusqu\'à 1.'], 'effort : séries 1 et 2, puis la dernière (contrat)');
  egal([L.effort(exo('Gainage planche'), 0), L.effort(Object.assign({}, exo('Presse à cuisses'), { courb: true }), 2), L.effort(Object.assign({}, exo('Presse à cuisses'), { legere: true }), 0), L.effort(exo('Presse à cuisses'), 2)],
    ['Tiens le corps bien droit ; arrête quand il ne l\'est plus.', 'Sans aller au bout : garde 2 ou 3 en réserve.', 'Sans aller au bout : garde 2 ou 3 en réserve.', 'Dernière série : va jusqu\'à 1, ou 0.'], 'effort : au temps, exercice léger, presse');
  egal(['Développé assis à la machine', 'Développé épaules aux haltères', 'Curl aux haltères', 'Face pull à la poulie', 'Tractions', 'Leg curl assis', 'Pompes'].map(L.zeroPermis), [true, false, true, true, false, true, false], 'zeroPermis : machines, poulies, élévations, curls ; jamais les développés aux haltères');
  // 2.13.1 : une puce de la bulle verte de l'exercice, le mot clé en gras.
  egal(L.AVERTISSEMENT_RESERVE, '**Ta réserve** : quand tu crois qu\'il t\'en reste 2, il t\'en reste souvent 4 ou 5.', 'AVERTISSEMENT_RESERVE : le texte (une puce de la bulle verte)');
}

// ── Cible en direct ──
{
  const dev = exo('Développé assis à la machine'), der = { date: 'x', series: [{ c: 17.5, r: 10 }, { c: 17.5, r: 9 }, { c: 17.5, r: 9 }] };
  const cs = L.conseil(dev, der);
  const C = (faites) => { const x = L.cibleSerie(dev, cs, der, faites); return { charge: x.charge, valeur: x.valeur, gros: x.gros, direct: x.direct }; };
  egal([cs.charge, cs.valeur], [17.5, 11], 'cibleSerie : le conseil de départ (17,5 kg, 11)');
  egal(C([]), { charge: 17.5, valeur: 11, gros: '17,5 kg × 11', direct: false }, 'cibleSerie : série 1 = le conseil');
  egal(L.cibleSerie(dev, cs, der, [{ c: 20, r: 11 }]), { charge: 20, valeur: 11, gros: '20 kg × 11', texte: 'Garde 20 kg et refais 11, ou plus si c\'est propre.', direct: true }, 'cibleSerie : après une série à 20 kg, la cible dit 20 kg (le défaut « Garde 17 kg » corrigé)');
  egal([C([{ c: 17.5, r: 11 }]), L.cibleSerie(dev, cs, der, [{ c: 17.5, r: 11 }]).texte], [{ charge: 17.5, valeur: 10, gros: '17,5 kg × 10', direct: true }, 'Série 2 : 17,5 kg, la dernière fois 9. Gagne une répétition.'], 'cibleSerie : la charge du conseil → la même série de la fois d\'avant, plus une');
  egal([C([{ c: 22.5, r: 5 }]), L.cibleSerie(dev, cs, der, [{ c: 22.5, r: 5 }]).texte], [{ charge: 20, valeur: 8, gros: '20 kg × 8', direct: true }, '5 répétitions, c\'est sous 8 : baisse à 20 kg.'], 'cibleSerie : nettement sous le bas de la fourchette → un pas de moins');
  egal(L.cibleSerie(dev, cs, der, [{ c: 22.5, r: 6 }]).texte, 'Garde 22,5 kg et refais 8, ou plus si c\'est propre.', 'cibleSerie : un peu sous le bas (6 pour 8) → la charge est gardée (2.37.0 : L.plancher, pas d\'allers-retours)');
  const tr = { nom: 'Tractions', corps: true, series: 3, min: 6, max: 12, unite: 'reps', pas: 2.5 }, derT = { date: 'x', series: [{ c: 0, r: 12 }, { c: 0, r: 9 }] };
  const ct = L.cibleSerie(tr, L.conseil(tr, derT), derT, [{ c: 0, r: 12 }]);
  egal([ct.valeur, ct.gros, ct.texte], [10, '10 rép.', 'Série 2 : vise 10 répétitions.'], 'cibleSerie : poids du corps → la série de la fois d\'avant, plus une');
  const pl = exo('Gainage planche'), cp = L.conseil(pl, { date: 'x', series: [{ s: 40 }, { s: 35 }] });
  egal([L.cibleSerie(pl, cp, null, []).gros, L.cibleSerie(pl, cp, null, [{ s: 45 }]).texte], ['45 s', 'Série 2 : tiens 45 s.'], 'cibleSerie : au temps');
  egal(L.cibleSerie(Object.assign({}, dev, { legere: true }), L.conseil(Object.assign({}, dev, { legere: true }), der), der, [{ c: 17.5, r: 10 }]).valeur, 10, 'cibleSerie : semaine légère, pas de répétition en plus');
}

// ── Séries d'approche ──
{
  const pA = L.planApproches(oA.exos, false), pB = L.planApproches(oB.exos, false);
  egal(pA.map((p) => (p ? p.length : 0)), [2, 1, 1, 0, 0, 0, 0, 0], 'approches A : 2 sur le tirage, 1 avant le développé, 1 avant la presse');
  egal([pA[0], pA[1]], [[{ pct: 50, r: 8 }, { pct: 75, r: 4 }], [{ pct: 50, r: 8 }]], 'approches : 8 à 50 % puis 4 à 75 %, et 8 à 50 %');
  egal(pB.map((p) => (p ? p.length : 0)), [2, 1, 0, 0, 1, 0, 0, 0], 'approches B : tirage 2, presse 1, développé épaules 1'); // 2.36.0 : l'ordre du programme dans l'étage 1, le développé épaules est maintenant 5e
  egal(L.planApproches(L.grouperSuperseries(oA.exos), true).map((p) => (p ? p.length : 0)).reduce((a, b) => a + b, 0), 1, 'approches en superséries : une seule, sur le premier exercice');
  egal(L.planApproches([exo('Gainage planche'), { nom: 'Tractions', corps: true, unite: 'reps' }, exo('Presse à cuisses')], false), [null, null, [{ pct: 50, r: 8 }, { pct: 75, r: 4 }]], 'approches : ni le gainage ni le poids du corps'); // 2.3.0 : plus d'approche très légère en plus (la douleur qui tire n'ajoute rien, aucune étude)
  const app = (e, a) => Object.assign({}, e, { approches: a });
  egal(L.chargesApproches(app(exo('Développé assis à la machine'), [{ pct: 50, r: 8, faite: false }, { pct: 75, r: 4, faite: false }]), 40).map((x) => x.texte), ['8 × 20 kg', '4 × 30 kg'], 'chargesApproches : développé assis, 40 kg');
  egal(L.chargesApproches(app(exo('Développé épaules aux haltères'), [{ pct: 50, r: 8 }, { pct: 75, r: 4 }]), 8).map((x) => x.texte), ['8 × 4 kg', '4 × 6 kg'], 'chargesApproches : haltères au pas de 2 kg');
  egal(L.chargesApproches(app(exo('Presse à cuisses'), [{ pct: 50, r: 8 }]), 60).map((x) => x.texte), ['8 × 30 kg'], 'chargesApproches : presse au pas de 5 kg');
  egal(L.chargesApproches(app(exo('Presse à cuisses'), [{ pct: 30, r: 10, plus: true }, { pct: 50, r: 8 }]), null).map((x) => [x.texte, x.c, !!x.plus]), [['10 répétitions très légères', null, true], ['8 répétitions très légères', null, false]], 'chargesApproches : charge inconnue');
  egal(L.chargesApproches(app(exo('Presse à cuisses'), [{ pct: 50, r: 8, faite: true, c: 35 }]), 60)[0], { pct: 50, r: 8, c: 35, faite: true, texte: '8 × 35 kg' }, 'chargesApproches : cochée, la charge notée reste');
  egal([L.arrondiPas(13, 2.5), L.arrondiPas(1, 2.5), L.arrondiPas(4.4, 2), L.arrondiPas(7, 0)], [12.5, 2.5, 4, 7], 'arrondiPas : au pas, jamais sous un pas');
}

// ── Durée : le modèle, son rythme, le cardio ──
{
  egal([L.dureeModele(oB.exos, { approches: 4, etageEchauffement: 1 }), L.dureeModele(oA.exos, { approches: 4, etageEchauffement: 1 })], [64, 61], 'dureeModele : B 64 min, A 61 min (1 h, 4 approches)');
  const ss = [{ nom: 'A', series: 3, repos: 120, groupe: 'g1' }, { nom: 'B', series: 3, repos: 120, groupe: 'g1' }, { nom: 'C', series: 3, repos: 90, groupe: 'g2' }, { nom: 'D', series: 3, repos: 90, groupe: 'g2' }];
  egal(L.dureeModele(ss, { velo: 0 }), 21, 'dureeModele : une supersérie de 3 tours = 9 min, plus 1 min 30 pour s\'installer (2 × 10 min 30)');
  egal(L.dureeModele([{ nom: 'X', series: 2, repos: 60, etage: 1 }, { nom: 'Y', series: [{}, {}], repos: 60, etage: 2 }], { velo: 0, etageEchauffement: 2 }), 10, 'dureeModele : séries en nombre ou en liste, 1 min par changement d\'étage (échauffement compris)');
  egal([L.reposDe('Tractions', P115), L.reposDe('Élévations latérales aux haltères', P115), L.reposDe('Planche latérale', P115), L.reposDe('Squat', []), L.reposDe('Pec deck', null)], [{ repos: 120, etage: 1 }, { repos: 90, etage: 2 }, { repos: 60 }, { repos: 120 }, { repos: 90 }], 'reposDe : le programme, le remplaçant, sinon 1 min, 2 min ou 1 min 30');
  egal([note13.echauffement, L.dureeNote(note13, P115)], [{ min: 5, nbApproches: 0 }, 48], 'dureeNote : la note du 13/11 aurait dû prendre 48 min (elle en a pris 80)');
  const sP = { dureeMin: 10, exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 10 }, { c: 60, r: 10 }, { c: 60, r: 10 }] }] };
  egal(L.dureeNote(sP, P115), 8, 'dureeNote : sans ligne d\'échauffement, ni vélo ni approche');
  egal([L.rythme([note13], P115), L.rythme([note13, sP], P115), L.rythme([], P115), L.rythme(null, null)], [1.67, 1.46, 1, 1], 'rythme : une mesure suffit (1,667 → 1,67, plus bornée à 1,5 depuis la 2.35.0) ; la médiane (1,25 et 1,667 → 1,46)'); // Relecture 2.0 : une seule mesure compte (avant : 1). Sa seule séance chronométrée dit 1,67 : lundi s'annonce « à ton rythme »
  // Relecture 2.0 : le cardio de fin se décide quand tout est fait, d'après le temps vraiment passé et le temps du jour.
  const fin = (temps, passe, x) => L.cardioAuBout(Object.assign({ date: '2026-11-16', debut: 1e12, cardio: 15, tempsJour: temps }, x || {}), 60, 1e12 + passe * 60000, '2026-11-16');
  egal([fin(75, 44), fin(75, 66), fin(75, 80), fin(45, 44), fin(60, 30), fin(null, 50, { bilan: { temps: 45 } }), fin(60, 30, { date: '2026-11-15' }), fin(60, 30, { debut: 0, cardio: null })],
    [15, 5, 5, 0, 15, 0, 15, 5], 'cardioAuBout : d\'après le temps passé (80 min sur 1 h 15 → 5) ; 45 min sans marge → 0 ; un autre jour ou sans début → le cardio prévu');
  const lent = { dureeMin: 30, exos: sP.exos };
  egal([L.rythme([lent, lent, lent], P115), L.rythme([sP, { dureeMin: 4, exos: sP.exos }, { dureeMin: 4, exos: sP.exos }], P115)], [2.5, 0.8], 'rythme : borné entre 0,8 et 2,5 (2.35.0)');
  egal(L.rythme([lent, lent, lent, lent, lent, { dureeMin: 0, exos: sP.exos }, { dureeMin: 8, exos: sP.exos }, { dureeMin: 8, exos: sP.exos }, { dureeMin: 8, exos: sP.exos }, { dureeMin: 8, exos: [] }], P115), 1, 'rythme : les 5 dernières séances chronométrées avec des exercices');
  egal([L.cardioFin(60, 52), L.cardioFin(75, 58), L.cardioFin(60, 49), L.cardioFin(45, 44), L.cardioFin(60, 64)], [5, 15, 10, 0, 5], 'cardioFin : 5 min par défaut, plus s\'il reste du temps, rien à 45 min sans marge');
  const reelle = lireNote('../../Séances/2026-11-13 Séance B.md');
  avertir(reelle === null || L.dureeNote(L.lireSeance(reelle), P115) === 48, 'Séances/2026-11-13 Séance B.md ne donne plus 48 min au modèle (note modifiée ?).');
}

// ── La séance préparée ──
{
  const b60 = prepa(1, 0);
  egal([noms(b60.exos), b60.approches, b60.superseries, b60.etageEchauffement], [noms(oB.exos), 4, false, 1], 'preparerSeance B 1 h : l\'ordre, 4 approches, pas de supersérie');
  egal(b60.duree, { modele: 64, rythme: 1, prevue: 64, cardio: 5, totale: 69, temps: 60, depasse: 9, texte: 'environ 1 h 10' }, 'preparerSeance B 1 h : la durée (dépasse de 9 min : une ligne le dit)'); // 2.1.2 : plus de version 45 min
  const a45 = prepa(0, 45);
  egal([groupes(a45.exos).slice(0, 4), a45.approches, a45.superseries], [['g1:Tirage vertical prise large', 'g1:Développé assis à la machine', 'g2:Presse à cuisses', 'g2:Leg curl assis'], 1, true], 'preparerSeance A 45 min : superséries, une approche');
  egal(a45.duree, { modele: 47, rythme: 1, prevue: 47, cardio: 0, totale: 47, temps: 45, depasse: 2, texte: 'environ 45 min' }, 'preparerSeance A 45 min : la durée, sans cardio');
  vrai(a45.lignes.indexOf('45 min : des superséries, toutes les séries gardées.\nComment : 2 exercices enchaînés, 1 min 30 de repos après le tour.') >= 0, 'preparerSeance 45 min : la ligne qui le dit'); // 2.5.1 : texte raccourci
  const b45 = prepa(1, 45);
  // 2.38.91 : moins de paires (plus de muscle en commun ni de développé avec des élévations) : la séance B dépasse un peu 45 min.
  egal([b45.duree.modele, b45.duree.cardio, b45.duree.depasse], [52, 0, 7], 'preparerSeance B 45 min : sans cardio, 52 min (moins de paires, 2.38.91)');
  const a75 = prepa(0, 0, { duree: 75 });
  egal([a75.exos.map((e) => e.series), a75.duree.modele, a75.duree.cardio, a75.duree.totale], [[4, 4, 4, 3, 2, 3, 2, 2], 69, 5, 74], 'preparerSeance A 1 h 15 : une série de plus sur les 3 premiers, 69 + 5 min');
  const sj = L.seanceDuJour(P115, [], REGULIER, '2026-11-16', 0), avant = JSON.stringify(sj);
  const pr = L.preparerSeance(sj, { seances: [note13, { date: '2026-11-14', nom: 'X', dureeMin: 10, exos: [{ nom: 'Presse à cuisses', series: [{}, {}, {}] }] }], programme: P115, reglages: REGULIER });
  egal([JSON.stringify(sj) === avant, pr.duree.rythme, pr.duree.prevue, pr.duree.texte], [true, 1.46, 77, 'environ 1 h 20 à ton rythme'], 'preparerSeance : sj n\'est pas modifié ; la durée calée sur son rythme et dite « à ton rythme »'); // Relecture 2.0 : les 3 exercices jamais faits passent à 2 séries (avant : 89 min, 1 h 35)
  // Relecture 2.0 : un exercice jamais fait (alors qu'il y a des séances notées) : 2 séries, une ligne, et « première fois » à
  // chaque série, la dernière comprise (« La bonne séance » : « la première fois en 2 séries, sans aller au bout »).
  egal([pr.exos.map((e) => e.series), pr.lignes], [[2, 2, 3, 2, 2, 3, 2, 2], ['3 exercices : première fois, 2 séries sans aller au bout.\nLesquels : Tirage vertical, développé assis, tirage horizontal.']], 'preparerSeance : un exercice jamais fait part à 2 séries, et la ligne le dit'); // 2.5.1 : texte raccourci (les noms repliés : la phrase passait 2 lignes)
  egal(prepa(0, 0).exos.map((e) => e.series), [3, 3, 3, 3, 2, 3, 2, 2], 'preparerSeance : sans aucune séance notée, rien n\'est « jamais fait » (la mise en route s\'en charge)');
  const devA = { nom: 'Développé assis à la machine', series: 3, min: 8, max: 12, pas: 2.5, unite: 'reps' };
  egal([L.effort(devA, 0, null), L.effort(devA, 2, null), L.effort(devA, 2), L.effort(devA, 2, { date: 'x', series: [{ c: 20, r: 10 }] })],
    ['Première fois : arrête-toi quand il t\'en reste 2, même à la dernière série.', 'Première fois : arrête-toi quand il t\'en reste 2, même à la dernière série.', 'Dernière série : va jusqu\'à 1, ou 0.', 'Dernière série : va jusqu\'à 1, ou 0.'],
    'effort : la première fois (der null), il t\'en reste 2 jusqu\'à la dernière série ; sans 3e argument, comme avant');
  egal(L.cibleSerie(devA, L.conseil(devA, null), null, [{ c: 25, r: 9 }]).texte, 'Garde 25 kg et refais 9.', 'cibleSerie : la première fois, pas de « ou plus si c\'est propre »');
  const incl = { nom: 'Développé incliné aux haltères', series: 4, faites: [] }, machine = { nom: 'Développé incliné à la machine', corps: false };
  egal([L.remplacer(incl, machine, P115, [note13]).series, L.remplacer(incl, machine, P115).series], [2, 4], 'remplacer : un remplaçant jamais fait part à 2 séries (avec les séances) ; sans elles, comme avant');
  egal([L.preparerSeance(null, {}), L.preparerSeance(Object.assign({}, sj, { exos: [] }), {}).duree.modele], [null, 5], 'preparerSeance : rien à préparer, sans erreur');
}

// ── La séance en cours ──
{
  const sjP = prepa(0, 45), sc = L.nouvelleSeance(sjP, '2026-11-16', 1000);
  egal(Object.keys(sc), ['version', 'nom', 'date', 'debut', 'decouverte', 'legere', 'superseries', 'courant', 'reposFin', 'reposTotal', 'echauffeFin', 'chronoDebut', 'cardio', 'dureePrevue', 'tempsJour', 'exos'], 'nouvelleSeance : la forme 2.0 (contrat, partie 2)'); // Relecture 2.0 : tempsJour (le temps du jour), pour décider du cardio à la fin
  egal([sc.tempsJour, L.nouvelleSeance(L.seanceDuJour(P115, [], REGULIER, '2026-11-16', 1), '2026-11-16', 0).tempsJour], [45, null], 'nouvelleSeance : tempsJour = le temps du jour de la séance préparée ; séance brute : null');
  egal([sc.version, sc.superseries, sc.cardio, sc.dureePrevue, sc.exos[0].nom, sc.exos[0].etage, sc.exos[1].approches, sc.exos[1].groupe, sc.exos[2].groupe, sc.exos.filter((e) => e.approches).length], [2, true, 0, 47, 'Échauffement', 1, [{ pct: 50, r: 8, faite: false }], 'g1', 'g1', 1], 'nouvelleSeance : préparée, avec groupes, approches et durée');
  const brute = L.nouvelleSeance(L.seanceDuJour(P115, [], REGULIER, '2026-11-16', 1), '2026-11-16', 0);
  egal([brute.superseries, brute.cardio, brute.dureePrevue, brute.exos.some((e) => e.groupe || e.echauffeSerie), brute.exos.map((e) => (e.approches ? e.approches.length : 0))], [false, null, null, false, [0, 2, 0, 0, 1, 0, 0, 0, 0]], 'nouvelleSeance : une séance brute (1.x, ordre du programme), sans groupe ; le premier développé est le premier exercice : pas d\'approche en plus');
  const leg = L.nouvelleSeance(Object.assign({}, L.seanceDuJour(P115, [], REGULIER, '2026-11-16', 0), { legere: true }), '2026-11-16', 0);
  egal([leg.legere, leg.exos.slice(1).every((e) => e.legere)], [true, true], 'nouvelleSeance : la semaine légère suit sur chaque exercice (pour L.conseil)');
  vrai(SallePlugin.verifierEnCours(sc) === sc, 'nouvelleSeance : la séance 2.0 est acceptée par verifierEnCours (la 1.15.0 l\'accepte aussi)');
}

// ── Reprise d'une séance de la 1.14.0 ou 1.15.0 ──
{
  const en113 = { nom: 'Séance B', date: '2026-11-13', debut: 0, decouverte: false, legere: false, courant: 3, reposFin: 0, echauffeFin: 0, question: null,
    bilan: { date: '2026-11-13', douleur: null, courb: { niveau: 'aucune', zones: [] }, forme: 'normale', temps: 60 },
    exos: [Object.assign(L.exoEchauffement(), { faites: [{ fait: true }] }), { nom: 'Développé épaules aux haltères', series: 3, min: 8, max: 12, unite: 'reps', repos: 120, pas: 2, option: false, corps: false, alternatives: [{ nom: 'Développé épaules à la machine', corps: false }], echauffeSerie: { faite: true, c: 8, r: 10 }, faites: [{ c: 16, r: 10 }, { c: 16, r: 9 }, { c: 16, r: 8 }], reserve: '1-2' },
      { nom: 'Tirage vertical prise neutre', series: 3, min: 8, max: 12, unite: 'reps', repos: 120, pas: 2.5, option: false, corps: false, faites: [{ c: 40, r: 10 }] },
      { nom: 'Presse à cuisses', series: 3, min: 10, max: 15, unite: 'reps', repos: 120, pas: 5, option: false, corps: false, faites: [] }] };
  const avant = JSON.stringify(en113);
  const m = L.migrerEnCours(en113);
  egal([m.exos[1].approches, 'echauffeSerie' in m.exos[1], m.courant, noms(m.exos), m.version, m.superseries, m.exos[1].faites, m.bilan], [[{ pct: 50, r: 10, faite: true, c: 8 }], false, 3, noms(en113.exos), 2, false, en113.exos[1].faites, en113.bilan], 'migrerEnCours : la série d\'échauffement 1.x devient une approche, le reste est gardé');
  egal(JSON.stringify(en113), avant, 'migrerEnCours : l\'original n\'est pas modifié (copie profonde)');
  const m2 = L.migrerEnCours({ nom: 'A', date: '2026-11-14', debut: 0, courant: 0, exos: [L.exoEchauffement(), { nom: 'Tirage', series: 3, faites: [], echauffeSerie: { faite: false }, echauffePlus: 'courbatures aux bras' }, { nom: 'Presse', series: 3, faites: [{ c: 60, r: 10 }], echauffePlus: 'douleur qui tire au genou' }] });
  egal([m2.exos[1].approches, m2.exos[2].approches, m2.exos[0].approches], [[{ pct: 30, r: 10, plus: true, faite: false }, { pct: 50, r: 10, faite: false }], undefined, undefined], 'migrerEnCours : pas faite → approche à faire ; une très légère en plus seulement si rien n\'est fait');
  const v2 = L.nouvelleSeance(prepa(1, 0), '2026-11-16', 0), c2 = L.migrerEnCours(v2);
  egal([c2 !== v2, JSON.stringify(c2) === JSON.stringify(v2)], [true, true], 'migrerEnCours : une séance 2.0 → une copie identique');
  egal([L.migrerEnCours(null), L.migrerEnCours(undefined), L.migrerEnCours('abîmé'), L.migrerEnCours({ nom: 'X' }).version], [null, null, 'abîmé', 2], 'migrerEnCours : null, ou abîmée, sans erreur');
}

// ── Après une série : la suite ──
{
  const ex = (nom, series, faites, extra) => Object.assign({ nom, series, min: 8, max: 12, unite: 'reps', repos: 120, pas: 2.5, faites: Array.from({ length: faites }, () => ({ c: 10, r: 10 })) }, extra || {});
  const S = (exos, courant) => ({ courant, cardio: 5, exos: [Object.assign(L.exoEchauffement(), { faites: [{ fait: true }] })].concat(exos) });
  egal(L.apresSerie(S([ex('Presse à cuisses', 3, 1)], 1)), { courant: 1, repos: 120, fin: false }, 'apresSerie : exercice seul pas fini → lui-même, son repos');
  egal(L.apresSerie(S([ex('Presse à cuisses', 3, 3), ex('Leg curl assis', 2, 0, { repos: 90 })], 1)), { courant: 2, repos: 120, fin: false }, 'apresSerie : exercice seul fini → le suivant, le repos de celui qui finit');
  const g = (a, b, c) => S([ex('Tirage', 3, a, { groupe: 'g1' }), ex('Développé', 3, b, { groupe: 'g1' }), ex('Presse', 3, c)], 0);
  { const s = g(1, 0, 0); s.courant = 1; egal(L.apresSerie(s), { courant: 2, repos: 0, fin: false }, 'apresSerie : supersérie, après le tirage 1 → le développé, sans repos'); }
  { const s = g(1, 1, 0); s.courant = 2; egal(L.apresSerie(s), { courant: 1, repos: 90, fin: false }, 'apresSerie : supersérie, après le développé 1 → le tirage, 1 min 30 (fin du tour)'); }
  { const s = g(3, 3, 0); s.courant = 2; egal(L.apresSerie(s), { courant: 3, repos: 120, fin: false }, 'apresSerie : supersérie finie → l\'exercice suivant, avec son repos'); }
  { const s = S([ex('Presse', 3, 2, { groupe: 'g2' }), ex('Leg curl', 2, 2, { groupe: 'g2', repos: 90 })], 2); egal(L.apresSerie(s), { courant: 1, repos: 90, fin: false }, 'apresSerie : groupe inégal (presse 3, leg curl 2) → la presse, 1 min 30'); }
  egal(L.apresSerie(S([ex('Presse', 2, 2), ex('Curl', 2, 0, { saute: { raison: 'temps' } })], 1)), { courant: 1, repos: 0, fin: true }, 'apresSerie : tout fait (ou passé) → fin');
  const presse = Object.assign({}, exo('Presse à cuisses'), { faites: [{ c: 60, r: 10 }] });
  const hist = [{ date: '2026-11-13', nom: 'Séance B', exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 10 }, { c: 60, r: 10 }, { c: 60, r: 9 }] }] }];
  const sc1 = S([presse], 1);
  egal(L.suite(sc1, hist, {}), { index: 1, texte: 'Ensuite : série 2 sur 3', cible: '60 kg × 11' }, 'suite : même exercice, la série (sur combien) et, à part, la cible de la série suivante (contrat ; 2.38.53)');
  const lc = Object.assign({}, exo('Leg curl assis'), { faites: [], groupe: 'g2' });
  const hist2 = hist.concat([{ date: '2026-11-14', nom: 'X', exos: [{ nom: 'Leg curl assis', series: [{ c: 25, r: 10 }] }] }]);
  egal(L.suite(S([Object.assign({}, presse, { groupe: 'g2' }), lc], 2), hist2, {}), { index: 2, texte: 'Ensuite : Leg curl assis (supersérie)', cible: '25 kg × 11' }, 'suite : partenaire de supersérie');
  egal(L.suite(S([Object.assign({}, presse, { groupe: 'g2', faites: [{ c: 60, r: 10 }] }), Object.assign({}, lc, { faites: [{ c: 25, r: 10 }] })], 1), hist2, {}), { index: 1, texte: 'Ensuite : Presse à cuisses (supersérie)', cible: '60 kg × 11' }, 'suite : retour au premier du groupe après le tour');
  egal(L.suite(S([Object.assign({}, presse, { faites: [{}, {}, {}] }), Object.assign({}, exo('Développé incliné aux haltères'), { faites: [] })], 2), hist, {}).texte, 'Ensuite : Développé incliné aux haltères · Étage 2 · banc à 30° (2e ou 3e cran)', 'suite : autre exercice, son étage et son réglage');
  egal(L.suite(S([Object.assign({}, presse, { faites: [{}, {}, {}] }), Object.assign({}, exo('Développé incliné aux haltères'), { faites: [] })], 2), hist, {}, 1).texte, 'Ensuite : Développé incliné aux haltères · Étage 2 · banc à 30° (2e ou 3e cran)', 'suite : avec l\'index de l\'exercice qui vient d\'être fait (facultatif)');
  // 2.38.1 (demande : voir la charge et le nombre de séries pendant le repos) : avant un nouvel exercice, sa cible et ses séries, à part.
  egal(L.suite(S([Object.assign({}, presse, { faites: [{}, {}, {}] }), Object.assign({}, exo('Développé incliné aux haltères'), { faites: [] })], 2), hist, {}).cible, '8 rép. · 3 séries', 'suite : un nouvel exercice → sa cible et son nombre de séries, à part');
  const fini = S([Object.assign({}, presse, { faites: [{}, {}, {}] })], 1);
  egal([L.suite(fini, hist, {}).texte, L.suite(Object.assign({}, fini, { cardio: 0 }), hist, {}).texte], ['Ensuite : cardio tranquille, puis c\'est fini.', 'Ensuite : c\'est fini.'], 'suite : tout fait → le cardio, puis fini (rien sans cardio)');
}

// ── Remplacer (machine prise) ──
{
  const di = Object.assign({}, exo('Développé incliné aux haltères'), { faites: [], groupe: 'g3', courb: true, approches: [{ pct: 50, r: 8, faite: true, c: 8 }] });
  const r = L.remplacer(di, { nom: 'Développé incliné à la machine', corps: false }, P115);
  egal([r.nom, 'reglage' in r, r.alternatives, r.etage, r.groupe, r.courb, r.approches, r.min, r.pas], ['Développé incliné à la machine', false, [{ nom: 'Développé incliné aux haltères', corps: false, reglage: 'banc 30° (2e ou 3e cran)' }], 2, 'g3', true, [{ pct: 50, r: 8, faite: false }], 8, 2], 'remplacer : le réglage du banc part, l\'ancien rejoint les remplaçants, groupe, étage et bilan gardés, approches décochées');
  egal([di.nom, di.reglage, di.approches[0].faite], ['Développé incliné aux haltères', 'banc 30° (2e ou 3e cran)', true], 'remplacer : l\'exercice d\'origine n\'est pas modifié');
  const retour = L.remplacer(r, r.alternatives[0], P115);
  egal([retour.nom, retour.reglage, retour.alternatives.map((a) => a.nom)], ['Développé incliné aux haltères', 'banc 30° (2e ou 3e cran)', ['Développé incliné à la machine']], 'remplacer : revenir à l\'exercice d\'origine reprend son réglage');
  const tl = L.remplacer(Object.assign({}, exo('Tirage vertical prise large'), { faites: [] }), { nom: 'Tirage vertical prise neutre', corps: false, programme: exo('Tirage vertical prise neutre') }, P115);
  egal([tl.nom, tl.repos, tl.pas, tl.alternatives.map((a) => a.nom)], ['Tirage vertical prise neutre', 120, 2.5, ['Tractions', 'Tirage vertical prise large']], 'remplacer : un exercice du programme apporte sa fourchette, son repos et son pas');
}

// ── Notes : la ligne d'échauffement ──
{
  const e2 = { min: 5, approches: [{ nom: 'Tirage vertical prise neutre', series: [{ c: 20, r: 8 }, { c: 30, r: 4 }] }, { nom: 'Presse à cuisses', series: [{ c: 30, r: 8 }] }, { nom: 'Développé épaules aux haltères', series: [{ c: 4, r: 8 }] }] };
  const ligne = L.ligneEchauffement(e2);
  egal(ligne, 'Échauffement : 5 min, puis approches : Tirage vertical prise neutre 8 × 20 kg, 4 × 30 kg ; Presse à cuisses 8 × 30 kg ; Développé épaules aux haltères 8 × 4 kg', 'ligneEchauffement 2.0 : le vélo puis les approches, en une ligne');
  egal([L.ligneEchauffement({ min: 0, approches: [{ nom: 'Presse à cuisses', series: [{ c: null, r: 8 }] }] }), L.ligneEchauffement({ min: 5, approches: [] }), L.ligneEchauffement({ min: 0, approches: [] }), L.ligneEchauffement({ min: 5, serie: { c: 17.5, r: 10 } })],
    ['Échauffement : approches : Presse à cuisses 8 répétitions très légères', 'Échauffement : 5 min', '', 'Échauffement : 5 min, puis 10 × 17,5 kg'], 'ligneEchauffement : sans vélo, sans approche, rien, et la forme 1.12');
  egal([L.lireEchauffement('Échauffement : 5 min, puis 10 × 17,5 kg'), L.lireEchauffement(ligne), L.lireEchauffement('- Échauffement : 10 min de vélo, niveau 10.'), L.lireEchauffement('Échauffement : approches : Presse à cuisses 8 répétitions très légères')],
    [{ min: 5, nbApproches: 1 }, { min: 5, nbApproches: 4 }, { min: 10, nbApproches: 0 }, { min: 0, nbApproches: 1 }], 'lireEchauffement : les formes 1.12, 2.0 et à la main');
  egal([L.lireEchauffement('Pas fait : Curl'), L.lireEchauffement('## Échauffement'), L.lireEchauffement(''), L.lireEchauffement(null)], [null, null, null, null], 'lireEchauffement : une autre ligne → null');
  egal([L.lireSerie('8 × 20 kg'), L.lireSerie('8 x 20 kg'), L.lireSerie('Échauffement : 5 min, puis approches : Presse 8 × 30 kg')], [null, null, null], 'lireSerie refuse « 8 × 20 kg » (répétitions d\'abord) : même en puce, ce n\'est jamais une série (la 1.15.0 non plus)');
  const note = '---\nsalle: seance\ndate: 2026-11-16\nnom: Séance A\n---\n# Séance A\n\n' + ligne + '\n\n## Presse à cuisses\n- 60 kg × 12\n- Échauffement : 10 min de vélo\n' + '- ' + ligne + '\n\n## Curl aux haltères\nÉchauffement : 2 min\n- 8 kg × 12\n';
  const lu = L.lireSeance(note);
  egal([lu.exos, lu.echauffement], [[{ nom: 'Presse à cuisses', series: [{ c: 60, r: 12 }] }, { nom: 'Curl aux haltères', series: [{ c: 8, r: 12 }] }], { min: 5, nbApproches: 4 }], 'lireSeance : une ligne d\'échauffement (avec ou sans puce, avant ou après un « ## ») n\'ajoute ni exercice ni série ; la première compte');
  egal([L.records(lu, [{ date: '2026-11-13', exos: [{ nom: 'Tirage vertical prise neutre', series: [{ c: 10, r: 8 }] }] }])], [[]], 'les records ne voient jamais l\'échauffement');
  const ecrite = L.ecrireSeance({ nom: 'Séance B', date: '2026-11-18', echauffement: e2, exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 11 }] }] });
  vrai(ecrite.indexOf('# Séance B · mercredi 18 novembre 2026\n\n' + ligne + '\n\n## Presse à cuisses\n- 60 kg × 11\n') > 0, 'ecrireSeance : la ligne 2.0 sous le titre, jamais un « ## »');
  egal([L.lireSeance(ecrite).exos, L.lireSeance(ecrite).echauffement], [[{ nom: 'Presse à cuisses', series: [{ c: 60, r: 11 }] }], { min: 5, nbApproches: 4 }], 'ecrireSeance puis lireSeance : relue');
  egal('echauffement' in L.lireSeance('---\nsalle: seance\ndate: 2026-11-10\nnom: A\n---\n## Presse\n- 60 kg × 12\n'), false, 'lireSeance : pas de ligne, pas de champ (anciennes notes inchangées)');
}

// ── Notes : le bilan dans l'en-tête et le carnet Forme (2.1.2 : plus de forme, de repas ni de temps) ──
{
  const b = { date: '2026-11-16', douleur: null, courb: { niveau: 'aucune', zones: [] }, sommeil: 'court' };
  egal(L.clesBilan(b), [['douleur', 'aucune'], ['courbatures', 'aucune'], ['sommeil', 'moins de 6 h']], 'clesBilan : douleur, courbatures, puis la nuit si elle a été courte');
  egal(L.clesBilan(Object.assign({}, b, { sommeil: 'ok' })).map((k) => k[0]), ['douleur', 'courbatures'], 'clesBilan : « ok » ou absent → rien d\'écrit');
  const note = L.ecrireSeance({ nom: 'Séance A', date: '2026-11-16', dureeMin: 58, bilan: b, exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 12 }] }] });
  vrai(note.indexOf('\ndouleur: aucune\ncourbatures: aucune\nsommeil: moins de 6 h\n---') > 0, 'note de séance : le bilan dans l\'en-tête');
  egal(L.lireSeance(note).bilan, b, 'note de séance : le bilan relu');
  egal(L.lireBilanCles({ forme: 'fatigue', douleur: 'aucune', courbatures: 'legeres, bras', temps_min: '45', sommeil: 'court', repas: 'loin' }, '2026-11-16'),
    { date: '2026-11-16', douleur: null, courb: { niveau: 'legeres', zones: ['bras'] }, temps: 45, sommeil: 'court' }, 'lireBilanCles : une note d\'avant la 2.1.2 se lit (forme et repas ignorés, temps_min gardé pour L.niveau)');
  const lf = L.ligneForme(b);
  egal(lf, '- 2026-11-16 · courbatures : aucune · douleur : aucune · sommeil : moins de 6 h', 'carnet Forme : la nuit courte à la fin de la ligne');
  egal([L.lireForme(lf)[0].sommeil, 'sommeil' in L.lireForme('- 2026-11-16 · courbatures : aucune · douleur : aucune')[0]], ['court', false], 'carnet Forme : relue ; une ligne sans la nuit n\'a pas ce champ');
  egal(L.ligneForme({ date: '2026-11-16', douleur: null, courb: { niveau: 'aucune', zones: [] } }), '- 2026-11-16 · courbatures : aucune · douleur : aucune', 'carnet Forme : nuit de 6 h ou plus, rien de plus');
  egal(L.lireForme('- 2026-11-12 · forme normale · courbatures légères : bras · douleur : aucune · sommeil : moins de 6 h · repas : plus de 4 h · 45 min\n- 2026-11-14 · fatigué\n'),
    [{ date: '2026-11-12', douleur: null, courb: { niveau: 'legeres', zones: ['bras'] }, sommeil: 'court' }, { date: '2026-11-14', douleur: null, courb: { niveau: 'aucune', zones: [] } }], 'carnet Forme : les lignes d\'avant la 2.1.2 se lisent (forme, repas et temps ignorés)');
  const exemple = '---\nsalle: seance\ndate: 2026-11-16\nnom: Séance A\nduree_min: 58\ncardio_min: 5\nvelo_niveau: 9\nforme: normale\ndouleur: aucune\ncourbatures: aucune\ntemps_min: 60\nsommeil: moins de 6 h\n---\n# Séance A · lundi 16 novembre 2026\n\nÉchauffement : 5 min, puis approches : Tirage vertical prise large 8 × 20 kg, 4 × 30 kg ; Développé assis à la machine 8 × 10 kg ; Presse à cuisses 8 × 30 kg\n\n## Tirage vertical prise large\n- 40 kg × 12\n';
  const ex = L.lireSeance(exemple);
  egal([ex.dureeMin, ex.cardioMin, ex.veloNiveau, ex.bilan.sommeil, ex.bilan.repas, ex.echauffement, ex.exos], [58, 5, 9, 'court', undefined, { min: 5, nbApproches: 4 }, [{ nom: 'Tirage vertical prise large', series: [{ c: 40, r: 12 }] }]], 'la note d\'exemple du contrat (partie 4.2) se relit');
}

// ───────────────────────── Les règles alignées sur les études (audit du 15/11) ─────────────────────────
// ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-audit-etudes.md, « À changer » : le numéro du changement de l'audit en tête du nom. Source : « La bonne
// séance » (ses numéros [n]). Dans un bloc : ses noms (P, A, B, S…) ne gênent pas le reste du fichier.
{
const P = L.lireProgramme(PROGRAMME_115);
const A = P[0].exos, B = P[1].exos;
const B20 = L.lireProgramme(PROGRAMME_DEFAUT)[1].exos;   // le programme livré : le développé incliné à 4 séries
const S = (date, nom, exos) => ({ date, nom, exos: exos || [] });
const X = (nom, series, reserve) => (reserve ? { nom, series, reserve } : { nom, series });
const k = (c, r) => ({ c, r });
const fois = (n, x) => Array.from({ length: n }, () => Object.assign({}, x));
const REG = { niveau: 'regulier', parSemaine: 3, duree: 60 };
const exo = (nom) => A.concat(B).find((e) => e.nom === nom);
const series = (a) => a.exos.map((e) => e.series);
const TIRAGE = 'Tirage vertical prise large', tirage = exo(TIRAGE);
const PAUSE = { repos: true, texte: 'Semaine sans salle : repos.' };

// 1. Semaine sans salle (malade comprise) : repos, avant la branche « 4 jours ou plus sans séance » [126 ; 123, 124].
egal([L.conseilDuJour([S('2026-11-09', 'Séance A')], '2026-11-16', [1, 3, 5], 0), L.conseilDuJour([], '2026-11-16', [1, 3, 5], 0), L.conseilDuJour([S('2026-11-09', 'Séance A')], '2026-11-16', [1, 3, 5], 3).repos],
  [PAUSE, PAUSE, false], '1. semaine sans salle : repos, même après 7 jours sans séance ; une semaine normale : séance');

// 2. 48 h entre deux séances : 3 séances par semaine au plus [26, 47].
egal([L.fusionReglages({ parSemaine: 4 }).parSemaine, L.fusionReglages({ parSemaine: 2 }).parSemaine, L.fusionReglages({ parSemaine: 3 }).parSemaine], [3, 2, 3],
  '2. réglages : 3 séances par semaine au plus (un ancien « 4 » devient 3)');

// 3. Bloqué 3 séances : le texte le dit (« regarde d'abord ton sommeil, ce que tu manges et ta réserve »), la cible reste la
// normale (+1 répétition).
{
  const pareil = [k(40, 10), k(40, 9), k(40, 8)];
  const ss = ['2026-11-09', '2026-11-11', '2026-11-13'].map((d) => S(d, 'Séance A', [X(TIRAGE, pareil, '0')]));
  const cs = (liste) => L.conseil(tirage, L.derniere(liste, TIRAGE), L.avantDerniere(liste, TIRAGE));
  const gagne = [ss[0], S('2026-11-11', 'Séance A', [X(TIRAGE, [k(40, 11), k(40, 9), k(40, 8)])]), ss[2]];
  const FIN = 'Bloqué depuis 3 séances : regarde ton sommeil, ce que tu manges et ta réserve.';
  egal([cs(ss).charge, cs(ss).valeur, cs(ss).texte.slice(-FIN.length), /Bloqué/.test(cs(ss.slice(1)).texte), /Bloqué/.test(cs(gagne).texte)], [40, 11, FIN, false, false],
    '3. bloqué 3 séances de suite : même charge, +1 répétition, et le texte dit quoi regarder ; 2 séances, ou un gain entre : rien');
}

// 6. Après une montée de charge, la cible en gros dit « × 8+ » (le plus de répétitions propres, avis) [61, 15].
{
  const der = { date: 'x', series: fois(3, k(40, 12)) };
  const mo = L.conseil(tirage, der);
  egal([mo.monte, L.cibleSerie(tirage, mo, der, []).gros, L.cibleSerie(tirage, mo, der, [k(42.5, 10)]).gros, L.cibleSerie(tirage, L.conseil(tirage, { date: 'x', series: fois(3, k(40, 10)) }), der, []).gros],
    [true, '42,5 kg × 8+', '42,5 kg × 10', '40 kg × 11'], '6. après une montée : « 42,5 kg × 8+ » à la série 1, puis la série d\'avant ; sans montée, pas de « + »');
}

// 7. Deux séances par semaine (partiels) : +1 série au dos, aux épaules et aux pecs, 4 au plus, au plus 8 directes par muscle
// dans la séance [11, 12, 28 ; 11, 45].
{
  const PART = { niveau: 'regulier', parSemaine: 2, duree: 60 };
  const a = L.adapter(B, PART, 9);
  egal([series(a), a.partiels, series(L.adapter(B, REG, 9))], [[4, 4, 4, 3, 3, 4, 2, 3], true, [3, 3, 3, 3, 3, 3, 2, 2]],
    '7. 2 séances par semaine : une série de plus aux développés, au tirage, aux élévations, au triceps (2.31.0 : les bras comptent) ; ni presse, leg curl, face pull');
  const dos = (nom, n) => ({ nom, series: n, min: 8, max: 12, unite: 'reps', option: false });
  egal([series(L.adapter([dos('Tirage vertical prise large', 3), dos('Tirage horizontal à la poulie', 3), dos('Rowing à la machine à disques', 1)], PART, 9)),
    series(L.adapter([dos('Tirage vertical prise large', 3), dos('Tirage horizontal à la poulie', 3), dos('Rowing à la machine à disques', 2)], PART, 9))],
  [[4, 3, 1], [3, 3, 2]], '7. 2 séances par semaine : jamais plus de 8 séries directes pour le dos dans la séance');
  egal([L.adapter(B, PART, 9, true).partiels, L.adapter(B, Object.assign({}, PART, { niveau: 'jamais' }), 0).partiels, L.seanceDuJour(P, [], PART, '2026-11-16', 1).lignes],
    [false, false, ['2 séances par semaine : 1 série de plus au dos, aux épaules et aux pecs.']], '7. 2 séances par semaine : ni en semaine légère ni pendant la mise en route ; la ligne le dit');
}

// 8. Reprise après plus de 8 semaines sans salle : 2 séances à 2 séries, puis la normale (avis) [110, 111] ; « Bon retour »
// dit « tu n'as rien perdu » jusqu'à 8 semaines [123, 124].
{
  const v = S('2026-09-01', 'Séance A');
  egal([L.repriseLongue([v], '2026-11-16'), L.repriseLongue([v, S('2026-11-16', 'Séance B')], '2026-11-18'), L.repriseLongue([v, S('2026-11-16', 'Séance B'), S('2026-11-18', 'Séance A')], '2026-11-20'),
    L.repriseLongue([S('2026-09-21', 'Séance A')], '2026-11-16'), L.repriseLongue([], '2026-11-16')],
  [{ numero: 1 }, { numero: 2 }, null, null, null], '8. reprise : les 2 séances après un trou de plus de 56 jours (56 tout juste : non ; aucune séance : la mise en route)');
  const r = L.adapter(A, REG, 9, false, { reprise: true });
  egal([series(r), r.reprise, L.seanceDuJour(P, [v], REG, '2026-11-16').lignes[0]],
    [[2, 2, 2, 2, 2, 2, 2], true, 'Reprise après plus de 8 semaines sans salle : séance 1 sur 2 à 2 séries par exercice.'], '8. reprise : 2 séries, sans les options, comme la mise en route ; la ligne le dit');
  egal([L.bonRetour([S('2026-10-17', 'A')], '2026-12-12').texte, L.bonRetour([S('2026-10-17', 'A')], '2026-12-13').texte],
    // 2.5.1 : texte raccourci ; au-delà de 56 jours, la carte du jour dit déjà « Reprise … à 2 séries » : ici, le pourquoi replié.
    ['Bon retour ! Dernière séance il y a 56 jours. Rien de perdu : garde tes charges d\'avant.', 'Bon retour ! Dernière séance il y a 57 jours.\nPourquoi : après 8 semaines sans salle, tes 2 prochaines séances à 2 séries évitent les grosses courbatures.'],
    '8. bon retour : « rien perdu » jusqu\'à 56 jours, puis les 2 séances à 2 séries');
}

// 9. Après une semaine malade : une séance à moitié des séries, mêmes charges, puis la normale (avis, à partir du CIO) [126].
{
  const malade = { malade: ['2026-11-09'] };
  egal([L.apresMaladie([S('2026-11-04', 'A')], '2026-11-16', malade), L.apresMaladie([S('2026-11-04', 'A')], '2026-11-11', malade), L.apresMaladie([S('2026-11-04', 'A'), S('2026-11-13', 'B')], '2026-11-16', malade),
    L.apresMaladie([S('2026-11-04', 'A')], '2026-11-16', { malade: ['2026-11-23'] }), L.apresMaladie([S('2026-11-04', 'A')], '2026-11-16', {})],
  [true, true, false, false, false], '9. malade : la première séance depuis le lundi de la semaine malade, pas après, ni pour une semaine à venir');
  const m = L.adapter(A, REG, 9, false, { malade: true });
  egal([series(m), m.exos.every((e) => e.sansMontee), m.malade, L.adapter(A, REG, 9, true, { malade: true }).malade],
    [[2, 2, 2, 2, 2, 1, 1, 1], true, true, false], '9. malade : séries divisées par deux, mêmes charges (sans montée) ; la semaine légère suffit si elle tombe en même temps');
  egal(L.seanceDuJour(P, [S('2026-11-04', 'Séance A')], Object.assign({}, REG, malade), '2026-11-16').lignes,
    ['Après ta semaine malade : moitié des séries, mêmes charges.\nEt après : la suivante sera normale si tu n\'as rien eu pendant l\'effort ni dans les 24 h.'], '9. malade : la ligne le dit'); // 2.5.1 : texte raccourci
  const reg = { pauses: [], malade: [] };
  const faux = { donnees: { reglages: reg }, sauver: () => Promise.resolve(), vues: () => [] };
  SallePlugin.prototype.basculerPause.call(faux, '2026-11-18', true);
  const marque = [reg.pauses.slice(), reg.malade.slice()];
  SallePlugin.prototype.basculerPause.call(faux, '2026-11-16');
  egal([marque, [reg.pauses, reg.malade]], [[['2026-11-16'], ['2026-11-16']], [[], []]], '9. « Cette semaine (malade) » marque la semaine ; la retirer retire aussi la marque');
}

// 10. 1 h 15 : une série de plus aux 3 premiers, 4 au plus, dès la fin de la mise en route [11, 12].
egal([L.adapter(B20, { niveau: 'regulier', duree: 75 }, 0).exos.filter((e) => e.priorite).map((e) => e.series), L.adapter(A, { niveau: 'un peu', duree: 75 }, 4).exos.slice(0, 3).map((e) => e.series), 'rodage' in L.adapter(A, REG, 5)],
  [[4, 4, 4], [4, 4, 4], false], '10. 1 h 15 : le développé incliné reste à 4 (pas 5) ; dès la 5e séance ; plus de « rodage »');
// 2.38.69 : l'ordre de la séance alterne les muscles, il ne dit plus ce qui compte le plus. La série de plus du 1 h 15 va aux
// exercices marqués « priorité » dans le programme (les 3 premiers marqués) ; sans aucune marque, aux 3 premiers écrits.
{
  const lu = L.lireExercice('Tirage vertical · 3 × 8-12 · repos 2 min · priorité · pas 5 kg');
  egal([lu.priorite, lu.series, lu.pas, 'priorite' in L.lireExercice('Curl · 3 × 10-15'), L.lireExercice('Curl · 3 × 10-15 · Priorite').priorite], [true, 3, 5, false, true], 'lireExercice : « priorité » est lu, rien n\'est ajouté sans la marque');
  egal(['prioritaire en été', 'priorité haute', 'ou Priorité aux haltères', 'priorités', '**Priorité**'].map((m) => !!L.lireExercice('Curl · 3 × 10-15 · ' + m).priorite), [false, false, false, true, false],
    'lireExercice : seul le mot « priorité » marque l\'exercice, pas une note qui commence pareil ni un remplaçant');
  const X = (nom, series, priorite) => Object.assign({ nom, series, min: 8, max: 12, unite: 'reps', repos: 90, pas: 2.5, option: false, corps: false }, priorite ? { priorite: true } : {});
  const R75 = { niveau: 'regulier', parSemaine: 3, duree: 75 }, R60 = { niveau: 'regulier', parSemaine: 3, duree: 60 };
  const marquee = [X('Tirage', 3, true), X('Curl', 3), X('Presse', 3), X('Élévations', 4, true), X('Développé', 3, true), X('Rowing', 3, true)];
  const sans = marquee.map((e) => X(e.nom, e.series));
  egal([series(L.adapter(marquee, R75, 0)), series(L.adapter(sans, R75, 0)), series(L.adapter(marquee, R60, 0))], [[4, 3, 3, 4, 4, 3], [4, 4, 4, 4, 3, 3], [3, 3, 3, 4, 3, 3]],
    'adapter 1 h 15 : avec des marques, la série de plus va aux 3 premiers exercices marqués (jamais au curl ni à la presse) ; sans marque, aux 3 premiers écrits ; en 1 h, à personne');
  // Le programme livré : en 1 h 15, exactement les séries d'avant le nouvel ordre (A : les deux tirages à 4 ; B : rien ne bouge).
  const PD = L.lireProgramme(PROGRAMME_DEFAUT);
  egal(PD.map((s) => L.adapter(s.exos, R75, 0).exos.map((e) => `${e.nom.split(' ').slice(0, 2).join(' ')} ${e.series}`)),
    [['Tirage vertical 4', 'Extension triceps 3', 'Tirage horizontal 4', 'Élévations latérales 4', 'Presse à 3', 'Développé incliné 3', 'Leg curl 2', 'Curl à 3'],
      ['Tirage vertical 4', 'Extension triceps 3', 'Élévations latérales 3', 'Presse à 3', 'Développé incliné 4', 'Curl à 3', 'Élévations latérales 4', 'Leg curl 3']],
    'adapter 1 h 15, programme livré (2.38.71) : ni le triceps, ni le curl, ni la presse ne gagnent de série avec le nouvel ordre');
}

// 11. Tractions au haut de la fourchette partout : passer au tirage vertical, qui se charge [61, 31].
{
  const tr = { nom: 'Tractions', corps: true, series: 3, min: 8, max: 12, unite: 'reps', pas: 2.5 };
  egal([L.conseil(tr, { date: 'x', series: fois(3, k(0, 12)) }), L.conseil(tr, { date: 'x', series: [k(0, 10), k(0, 9)] }).valeur],
    [{ charge: 0, valeur: 12, texte: '12 répétitions partout : passe au tirage vertical à la machine.\nPourquoi : tu pourras monter de 2,5 kg.' }, 11], // 2.5.1 : texte raccourci
    '11. tractions : 12 partout → passer au tirage vertical ; pas encore partout → une répétition de plus');
}

// 2.3.1 (15/11) : une note dans un dossier d'archives n'est jamais lue (la séance du 13/11 archivée comptait deux fois).
egal([L.estArchive('Outils/plugin-salle/archives/2026-11-14-avant-1.15.0/2026-11-13 Séance B.md'), L.estArchive('Outils/.archives/x.md'), L.estArchive('Séances/2026-11-13 Séance B.md'), L.estArchive('Archives de cours.md'), L.estArchive('')],
  [true, true, false, false, false], 'estArchive : les dossiers « archives » et « .archives », pas un nom de note');
}

// ───────────────────────── Les petits outils partagés (10-outils.js, 02-reglages.js) ─────────────────────────
egal([L.pluriel(1, 'série'), L.pluriel(3, 'série'), L.pluriel(0, 'record'), L.s(1), L.s(2)], ['1 série', '3 séries', '0 record', '', 's'],
  'pluriel : « 1 série », « 3 séries » ; L.s seul pour un accord');
egal([L.arrondi2(17.504), L.chargeMax([{ c: 20, r: 10 }, { c: 22.5, r: 8 }, { r: 12 }]), L.pasDe({ pas: 2.5 }), L.pasDe({}), L.arrondiPas(13.4, 2.5)], [17.5, 22.5, 2.5, 1, 12.5],
  'arrondi2, chargeMax, pasDe (1 kg sans pas), arrondiPas au pas le plus proche');
egal([L.nbSeries({ series: [{ c: 1, r: 1 }, { c: 1, r: 2 }] }), L.nbSeries({ series: 3 }), L.nbSeries({ series: -1 }), L.minutesDepuis(0, 90000)], [2, 3, 0, 1.5],
  'nbSeries : la liste notée ou le nombre prévu ; minutesDepuis sans arrondi');
egal([L.objectifSemaine({ parSemaine: 2 }), L.objectifSemaine({}), L.objectifSemaine(null), L.lundisDe(['2026-11-18', 'abîmé'])], [2, 3, 3, ['2026-11-16']],
  'objectifSemaine : celui des réglages, sinon 3 ; lundisDe ignore une date illisible');
egal([L.norm('  Élévations  LATÉRALES '), L.norm('  Élévations  LATÉRALES '), L.norm(null)], ['elevations laterales', 'elevations laterales', ''],
  'norm : le même résultat la deuxième fois (mémoire)');
{
  // La mémoire d'un dessin : un calcul gardé pour la même liste, refait si la liste change ; rien hors d'un dessin.
  const liste = [{ a: 1 }];
  let n = 0;
  const calcul = () => ++n;
  const dedans = L.pendantDessin(() => [L.memoListe(liste, 'x', calcul), L.memoListe(liste, 'x', calcul), (liste.push({ a: 2 }), L.memoListe(liste, 'x', calcul))]);
  egal([dedans, L.memoListe(liste, 'x', calcul), L.memoListe(liste, 'x', calcul)], [[1, 1, 2], 3, 4], 'memoListe : gardé pendant un dessin, refait si la liste grandit ; hors dessin, refait à chaque fois');
}

// ── 2.8.0 : le tempo sur la carte (l'ancienne note « Débuter à la salle ») [18, 75] ──
{
  const fait = (d, nom) => ({ date: d, nom: 'Séance A', exos: [{ nom, series: [{ c: 40, r: 10 }] }] });
  const tirage = { nom: 'Tirage horizontal à la poulie', unite: 'r' };
  const trois = [fait('2026-11-09', 'Tirage horizontal à la poulie'), fait('2026-11-11', 'tirage horizontal a la poulie'), fait('2026-11-13', 'Tirage horizontal à la poulie')];
  const TIRE = '**Tire en 1 s** en expirant, **reviens en 2 s** en inspirant.';
  egal([L.ligneTempo(tirage, []), L.ligneTempo(tirage, trois.slice(0, 2)), L.ligneTempo(tirage, trois), L.ligneTempo(tirage, [fait('2026-11-09', 'Presse à cuisses')]),
    L.ligneTempo({ nom: 'Gainage planche', unite: 's' }, []), L.ligneTempo({ nom: 'Vélo', echauffement: true }, []), L.ligneTempo(null, [])],
  [TIRE, TIRE, TIRE, TIRE, '', '', ''], 'ligneTempo : à chaque fois (2.12.0 : plus de limite de 3 séances) ; jamais au temps ni à l\'échauffement');
  egal([L.ligneTempo(tirage, [], true), L.ligneTempo(tirage, trois, true)], ['**Expire** quand tu tires, **inspire** au retour.', '**Expire** quand tu tires, **inspire** au retour.'], 'ligneTempo : fiche ouverte (son « Geste » dit le tempo) : le souffle seul');
  // 2.10.0 (demande : « sois plus clair : je pousse ou je tire ? ») : le verbe de l'exercice, d'après son nom.
  egal(['Tirage vertical prise large', 'Tractions', 'Face pull à la poulie', 'Rowing à la machine à disques', 'Développé incliné aux haltères', 'Presse à cuisses',
    'Extension triceps au-dessus de la tête à la poulie', 'Leg curl assis', 'Leg curl allongé', 'Curl aux haltères', 'Curl à la barre en Z', 'Élévations latérales aux haltères', 'Mobilité'].map((n) => L.effortDe(n).ordre),
  ['Tire', 'Tire', 'Tire', 'Tire', 'Pousse', 'Pousse', 'Pousse', 'Plie les jambes', 'Plie les jambes', 'Monte', 'Monte', 'Monte', 'Pousse ou tire'], 'effortDe : tire, pousse, monte ou plie les jambes ; nom inconnu : « Pousse ou tire »');
  egal([L.ligneTempo({ nom: 'Curl aux haltères', unite: 'r' }, []), L.ligneTempo({ nom: 'Presse à cuisses', unite: 'r' }, []), L.ligneTempo({ nom: 'Leg curl assis', unite: 'r' }, [], true)],
    ['**Monte en 1 s** en expirant, **redescends en 2 s** en inspirant.', '**Pousse en 1 s** en expirant, **reviens en 2 s** en inspirant.', '**Expire** quand tu plies les jambes, **inspire** au retour.'], 'ligneTempo : l\'effort en 1 s, le retour en 2 s, avec le verbe de l\'exercice');
  // Relecture 2.8.0 : « Monte en 1 s, descends en 2 s » était faux au tirage vertical et au leg curl assis (l'effort descend).
  const duProgramme = [];
  L.lireProgramme(PROGRAMME_DEFAUT).forEach((s) => s.exos.forEach((e) => [e.nom].concat((e.alternatives || []).map((a) => a.nom)).forEach((n) => { if (e.unite !== 's' && duProgramme.indexOf(n) < 0) duProgramme.push(n); })));
  egal([duProgramme.filter((n) => L.effortDe(n).ordre === 'Pousse ou tire'), duProgramme.filter((n) => /tirage|leg curl/i.test(n) && /monte|descends/i.test(L.ligneTempo({ nom: n, unite: 'r' }, [])))], [[], []],
    'ligneTempo : chaque exercice du programme a son verbe ; jamais « monte » au tirage ni au leg curl');
}

// 2.9.0 : les haltères de sa salle (premières questions) : de 2 en 2 kg, aucun exercice aux haltères ne monte de moins de 2 kg ;
// les machines gardent leur pas ; sans réponse, le pas du programme.
{
  const exos = [{ nom: 'Élévations latérales aux haltères', pas: 1 }, { nom: 'Développé incliné aux haltères', pas: 2 }, { nom: 'Tirage vertical prise large', pas: 2.5 }];
  const pas = (reg) => L.adapter(exos, Object.assign({ niveau: 'regulier' }, reg), 10).exos.map((e) => e.pas);
  egal([pas({ pasHalteres: 2 }), pas({ pasHalteres: 1 }), pas({})], [[2, 2, 2.5], [1, 2, 2.5], [1, 2, 2.5]], 'adapter : le pas des haltères de sa salle');
  const r = L.reglagesDesReponses({ son: false, pauses: ['2026-12-21'], niveau: 'un peu' }, { jours: [5, 1, 3], pasHalteres: 0, semainesLegeres: [] }, null);
  egal([r.son, r.pauses, r.niveau, r.jours, r.parSemaine, r.pasHalteres, r.semainesLegeres], [false, [], 'un peu', [1, 3, 5], 3, null, []], 'reglagesDesReponses : garde Appli, efface le reste, « je ne sais pas » = le pas du programme');
}

// 2.10.0 : l'étage où commencer (demande : « dis-moi déjà à quel étage aller au début »).
const ET = { machines: 1, halteres: 2 };   // 2.22.0 : les étages viennent des réglages
egal([L.departEtage([{ nom: 'Échauffement', echauffement: true, etage: 1 }, { nom: 'Curl', etage: 2 }], ET), L.departEtage([{ nom: 'Vélo', etage: 0 }], ET), L.departEtage([{ nom: 'Sans étage' }, { nom: 'Curl', etage: 2 }], ET),
  L.departEtage([{ nom: 'Passé', etage: 1, saute: { raison: 'temps' } }, { nom: 'Curl aux haltères', etage: 2 }], ET), L.departEtage(null, ET)],
['Commence à l\'étage 1 : machines et poulies', 'Commence au RDC', '', 'Commence à l\'étage 2 : haltères et bancs', ''],
'departEtage : l\'étage du premier exercice à faire ; étage inconnu : rien');
// 2.35.0 : ce qu'on trouve à l'étage n'est dit que si l'exercice s'y fait (une machine rangée à l'étage des haltères : rien).
egal([L.libelleEtage(2, ET, 'Presse à cuisses'), L.libelleEtage(2, ET, 'Curl aux haltères'), L.libelleEtage(1, ET, 'Presse à cuisses'), L.repereEtage(1, 2, ET, 'Presse à cuisses'), L.repereEtage(1, 2, ET, 'Curl aux haltères'), L.departEtage([{ nom: 'Presse à cuisses', etage: 2 }], ET)],
  ['', 'haltères et bancs', 'machines et poulies', 'Monte à l\'étage 2', 'Monte à l\'étage 2 : haltères et bancs', 'Commence à l\'étage 2'], 'repères : « haltères et bancs » seulement pour un exercice aux haltères');
// 2.38.69 : dans un étage, l'ordre écrit du programme (avant, 2.35.0 : les haltères ensemble, puis les machines). Le programme
// peut donc glisser les jambes entre deux exercices du haut du corps, sans changement d'étage en plus.
egal(L.ordonnerParEtage([{ nom: 'Tirage vertical', etage: 1 }, { nom: 'Développé épaules aux haltères', etage: 2 }, { nom: 'Développé incliné aux haltères', etage: 2 }, { nom: 'Presse à cuisses', etage: 2 },
  { nom: 'Leg curl assis', etage: 2 }, { nom: 'Élévations latérales aux haltères', etage: 2 }, { nom: 'Curl aux haltères', etage: 2 }], [1]).exos.map((e) => e.nom),
['Tirage vertical', 'Développé épaules aux haltères', 'Développé incliné aux haltères', 'Presse à cuisses', 'Leg curl assis', 'Élévations latérales aux haltères', 'Curl aux haltères'], 'ordre : dans un étage, l\'ordre écrit, les machines et les haltères mêlés');
{
  const M = (nom, etage) => ({ nom, etage });
  // Les deux séances du programme livré, avec les étages d'une salle à deux niveaux (les élévations à la machine à l'étage 1, puis 2).
  // 2.38.71 : l'extension triceps juste après les tirages, à l'étage 1 (une seule montée, plus de descente).
  // 2.38.76 : en A, les élévations d'abord à l'étage 2 (salle des haltères), puis tout le reste dans la salle des machines.
  // 2.38.78 : l'extension triceps entre les deux tirages (sa règle : pouvoir faire le mouvement de l'exercice d'après).
  const A = [M('Tirage vertical prise large', 1), M('Extension triceps au-dessus de la tête à la poulie', 1), M('Tirage horizontal à la poulie', 1), M('Élévations latérales aux haltères', 2),
    M('Presse à cuisses', 2), M('Développé incliné à la machine', 2), M('Leg curl assis', 2), M('Curl à la barre en Z', 2)];   // 2.38.79 : le curl (salle des haltères) en dernier
  const B = (etageMachine) => [M('Tirage vertical prise neutre', 1), M('Extension triceps au-dessus de la tête à la poulie', 1), M('Élévations latérales à la machine', etageMachine), M('Presse à cuisses', 2),
    M('Développé incliné aux haltères', 2), M('Curl à la barre en Z', 2), M('Élévations latérales aux haltères', 2), M('Leg curl assis', 2)];
  const a = L.ordonnerParEtage(A, [1]), b1 = L.ordonnerParEtage(B(1), [1]), b2 = L.ordonnerParEtage(B(2), [1]);
  egal([noms(a.exos), a.changements], [noms(A), 1], 'ordre A (2.38.71) : l\'ordre écrit, le triceps avec les tirages, la presse entre les élévations et le développé');
  egal([noms(b1.exos), b1.changements, noms(b2.exos), b2.changements], [noms(B(1)), 1, noms(B(2)), 1], 'ordre B (2.38.71) : le même ordre que la machine des élévations soit à l\'étage 1 ou 2, une seule montée');
  // Après des élévations latérales : les jambes, jamais les bras ni un développé (demande : les épaules ne tiennent plus les bras).
  const apres = (l) => l.map((e, i) => (/^Élévations/.test(e.nom) ? l[i + 1].nom : null)).filter(Boolean);
  egal([apres(a.exos), apres(b1.exos)], [['Presse à cuisses'], ['Presse à cuisses', 'Leg curl assis']], 'ordre (2.38.69) : après des élévations latérales viennent les jambes');
  // La limite connue : la règle vaut dans un même étage. Programme livré (aucun étage écrit) et réglages à deux étages : un
  // étage se finit avant l'autre (O5), les machines d'abord (le leg curl avec la presse) ; les élévations aux haltères finissent.
  const PL = L.lireProgramme(PROGRAMME_DEFAUT), E2 = { machines: 1, halteres: 2 };
  const deux = L.ordonnerParEtage(L.situer(PL[1].exos, E2), [1]), un = L.ordonnerParEtage(L.situer(PL[1].exos, { machines: 1, halteres: 1 }), [1]);
  egal([noms(deux.exos).map((n) => n.split(' ').slice(0, 2).join(' ')), deux.changements, noms(un.exos), un.changements],
    [['Tirage vertical', 'Extension triceps', 'Élévations latérales', 'Presse à', 'Leg curl', 'Développé incliné', 'Curl à', 'Élévations latérales'], 1, noms(PL[1].exos), 0],
    'ordre B du programme livré : à deux étages, un étage se finit avant l\'autre (les jambes avec les machines) ; à un seul étage, l\'ordre écrit');
}

// 2.38.78 (sa règle : pouvoir faire le mouvement de l'exercice d'après) : dans le programme livré, deux exercices qui se
// suivent ne partagent aucun muscle (L.musclesExo), en A comme en B.
egal(L.lireProgramme(PROGRAMME_DEFAUT).map((s) => s.exos.slice(1).filter((e, k) => { const a = L.musclesExo(s.exos[k].nom), b = L.musclesExo(e.nom); return Object.keys(a).some((m) => b[m]); }).map((e) => e.nom)),
  [[], []], 'ordre (2.38.78) : aucun enchaînement de deux exercices qui partagent un muscle');
// 2.38.72 : l'exercice suivant est le premier pas fini de la séance (on revient à celui laissé, machine prise).
{
  const F = (faites, o) => Object.assign({ nom: 'x', series: 3, faites: Array.from({ length: faites }, () => ({ r: 10 })) }, o || {});
  const exos = [F(0, { echauffement: true, series: 1 }), F(3), F(0), F(0), F(3)];   // B (2) laissé, C (3) fait à la place
  egal([L.suivantPasFini(exos, 3), L.suivantPasFini(exos, 2), L.apresSerie({ courant: 3, exos: [exos[0], exos[1], exos[2], F(3), exos[4]] }).courant],
    [2, 3, 2], 'suivantPasFini : le premier pas fini depuis le début (le laissé revient), jamais l\'échauffement ni celui en cours ; après l\'exercice fait à la place, on revient au laissé');
}
// 2.40.7 (demande : choisir l'exercice suivant d'après celui qu'on vient de faire ; machine prise, deux élévations de suite) :
// après les élévations aux haltères faites à la place de la machine, le suivant n'est pas la machine (même muscle) mais le
// premier pas fini qui ne partage aucun muscle, au même étage ; sinon le premier pas fini ; rien fait : le premier pas fini.
{
  const E = (nom, faites, etage, o) => Object.assign({ nom, series: 3, etage, faites: Array.from({ length: faites }, () => ({ r: 10 })) }, o || {});
  const B = [E('Échauffement', 0, 1, { echauffement: true, series: 1 }), E('Tirage vertical prise neutre', 4, 1, { series: 4 }), E('Élévations latérales à la machine', 0, 1),
    E('Presse à cuisses', 0, 2), E('Développé incliné aux haltères', 0, 2), E('Élévations latérales aux haltères', 4, 1, { series: 4 })];
  const seul = [E('Élévations latérales aux haltères', 4, 1, { series: 4 }), E('Élévations latérales à la machine', 0, 1)];
  const memeEtage = [E('Élévations latérales aux haltères', 4, 1, { series: 4 }), E('Élévations latérales à la machine', 0, 1), E('Curl à la barre en Z', 0, 1)];
  const rienFait = B.map((x, k) => (k === 5 ? E('Élévations latérales aux haltères', 0, 1, { series: 4 }) : x));
  // Les élévations aux haltères faites à l'étage 2 (la machine, à l'étage 1, prise) : il reste à l'étage 2, sur la presse.
  const etage2 = [E('Élévations latérales à la machine', 0, 1), E('Presse à cuisses', 0, 2), E('Élévations latérales aux haltères', 4, 2, { series: 4 })];
  // Le premier pas fini ne partage rien : on y va, même s'il est laissé plus haut (2.38.72).
  const laisse = [E('Tirage vertical prise neutre', 0, 1), E('Presse à cuisses', 0, 2), E('Élévations latérales aux haltères', 4, 2, { series: 4 })];
  egal([L.suivantPasFini(B, 5), L.suivantPasFini(seul, 0), L.suivantPasFini(memeEtage, 0), L.suivantPasFini(rienFait, 5), L.suivantPasFini(etage2, 2), L.suivantPasFini(laisse, 2)], [3, 1, 2, 2, 1, 0],
    'suivantPasFini : après un muscle, pas le même muscle (à son étage d\'abord) ; sinon le premier pas fini ; sans série faite, le premier pas fini');
}
// 2.40.7 : les remplaçants travaillent le même muscle, jamais un geste déjà dans la séance du jour.
{
  const progr = L.lireProgramme(['## Séance A', '', '- Développé incliné à la machine · 3 × 8-12 · étage 2', '- Élévations latérales aux haltères · 4 × 12-20', '- Tirage horizontal à la poulie · 3 × 8-12',
    '', '## Séance B', '', '- Élévations latérales à la machine · 3 × 12-20 · ou Développé épaules aux haltères', '- Développé incliné aux haltères · 4 × 8-12', '- Tirage vertical prise neutre · 4 × 8-12'].join('\n'));
  const machine = progr[1].exos[0];
  const jourB = progr[1].exos.map((x) => x.nom);
  // Sa séance B a aussi les élévations aux haltères : elles ne remplacent pas la machine (déjà du jour) ; un jour sans elles, si.
  egal([L.remplacants(machine, progr, jourB.concat(['Élévations latérales aux haltères'])).map((a) => a.nom), L.remplacants(machine, progr, jourB).map((a) => a.nom),
    L.remplacants(progr[1].exos[2], progr, jourB).map((a) => a.nom), [L.geste('Développé incliné à la machine'), L.geste('Tractions (poids du corps)'), L.geste('Élévations latérales aux haltères')]],
  [['Développé épaules aux haltères'], ['Développé épaules aux haltères', 'Élévations latérales aux haltères'], ['Tirage horizontal à la poulie'], ['developpe incline', 'tractions', 'elevations laterales']],
  'remplaçants : la variante, puis le même muscle (pas un développé pour des élévations) ; jamais un geste déjà fait ce jour-là');
}
// 2.40.8 (« ou Élévations latérales à la poulie » en B) : un remplaçant à la poulie prend le plus petit pas des poulies du
// programme (2,5 kg, l'extension triceps), pas les 5 kg de la machine remplacée.
{
  const progr = L.lireProgramme(['## Séance A', '', '- Extension triceps au-dessus de la tête à la poulie · 3 × 10-15 · pas 2,5 kg', '- Tirage horizontal à la poulie · 3 × 8-12 · pas 5 kg',
    '', '## Séance B', '', '- Élévations latérales à la machine · 3 × 12-20 · pas 5 kg · ou Élévations latérales à la poulie'].join('\n'));
  const machine = Object.assign({}, progr[1].exos[0], { faites: [] });
  const n = L.remplacer(machine, machine.alternatives[0], progr, [], 70);
  egal([n.nom, n.pas, n.alternatives.map((a) => a.nom)], ['Élévations latérales à la poulie', 2.5, ['Élévations latérales à la machine']],
    'remplacer : à la poulie, le pas des poulies du programme (le plus petit), et la machine reste en remplaçant pour revenir');
}

// 2.11.0 : la série légère à faire maintenant (une étape comme une autre, avant la série 1).
{
  const exo = { nom: 'Tirage vertical prise large', pas: 2.5, faites: [], approches: [{ pct: 50, r: 8 }, null, { pct: 75, r: 4 }] };
  const un = L.legereAFaire(exo, 40);
  exo.approches[0].faite = true;
  const deux = L.legereAFaire(exo, 40);
  exo.approches[2].faite = true;
  egal([un, deux, L.legereAFaire(exo, 40), L.legereAFaire({ nom: 'X', faites: [{ c: 40, r: 8 }], approches: [{ pct: 50, r: 8 }] }, 40), L.legereAFaire({ nom: 'X', faites: [] }, 40), L.legereAFaire(null)],
    [{ n: 1, sur: 2, r: 8, c: 20, gros: '20 kg × 8', index: 0 }, { n: 2, sur: 2, r: 4, c: 30, gros: '30 kg × 4', index: 2 }, null, null, null, null],
    'legereAFaire : la première pas encore faite, dans l\'ordre ; plus rien quand tout est fait ou dès la série 1');
  egal(L.legereAFaire({ nom: 'X', pas: 2.5, faites: [], approches: [{ pct: 50, r: 8 }] }, null).gros, '8 rép. légères', 'legereAFaire : charge de travail inconnue, « 8 rép. légères »');
}

// 2.13.0 : les repères du geste lus dans la fiche du guide (« La bonne séance », Amplitude, Attention, Gainage du tronc).
{
  const FICHE = ['**Muscles :** les biceps.', '**Réglage :** debout, coudes collés au corps.',
    '**Geste :** monte les haltères en 1 seconde. Redescends en 2 secondes, bras tendus.', '**Tu dois sentir :** l\'avant du bras.',
    '**Dernière série :** quand tu bloques, ajoute 3 demi-répétitions.', '**Dernière série à la poulie :** autre chose.'];
  egal([L.champFiche(FICHE, 'Muscles'), L.champFiche(FICHE, 'Dernière série'), L.champFiche(FICHE, 'Absent'), L.champFiche(null, 'Muscles')],
    ['les biceps.', 'quand tu bloques, ajoute 3 demi-répétitions.', '', ''], 'champFiche : le texte du champ, par son nom exact');
  egal([L.amplitude(FICHE), L.amplitude(['**Geste :** descends en 2 secondes aussi bas que possible, fesses collées au siège. Repousse en 1 seconde.']),
    L.amplitude(['**Geste :** monte en 1 seconde. Redescends en 2 secondes.']), L.amplitude(['**Geste :** tiens.']), L.amplitude(null)],
  ['**Va au bout** : bras tendus.', '**Va au bout** : aussi bas que possible, fesses collées au siège.', '', '', ''],
  'amplitude : ce qui suit « en 2 secondes » dans le geste ; rien à dire : rien');
  const leg = { nom: 'Leg curl assis', series: 3, unite: 'r' }, der = { date: '2026-11-13', series: [{ c: 25, r: 10 }] };
  egal([L.pourFinir(leg, 2, der, FICHE), L.pourFinir(leg, 1, der, FICHE), L.pourFinir(leg, 2, null, FICHE), L.pourFinir(Object.assign({ courb: true }, leg), 2, der, FICHE),
    L.pourFinir(Object.assign({ legere: true }, leg), 2, der, FICHE), L.pourFinir({ nom: 'Développé incliné aux haltères', series: 3 }, 2, der, FICHE), L.pourFinir(leg, 2, der, [])],
  ['**Pour finir** : quand tu bloques, ajoute 3 demi-répétitions.', '', '', '', '', '', ''],
  'pourFinir : à la dernière série seulement, quand elle va au bout ; jamais la première fois, un jour allégé, ni aux haltères');
  const PD = L.lireProgramme(PROGRAMME_DEFAUT);
  const tous = [];
  PD.forEach((s) => s.exos.forEach((e) => { if (tous.indexOf(e.nom) < 0) tous.push(e.nom); (e.alternatives || []).forEach((a) => { if (tous.indexOf(a.nom) < 0) tous.push(a.nom); }); }));
  egal(tous.filter((n) => L.penseAuMuscle(n)), ['Extension triceps au-dessus de la tête à la poulie', 'Élévations latérales aux haltères', 'Curl à la barre en Z', 'Curl aux haltères', 'Élévations latérales à la machine', 'Élévations latérales à la poulie'],
    'penseAuMuscle : les petits exercices du haut du corps, jamais le leg curl ni un gros exercice');
  egal(tous.filter((n) => L.estDebout(n)), tous.filter((n) => L.penseAuMuscle(n) && !/machine/.test(n)), 'estDebout : dans son programme, les mêmes, sauf la machine (assis)');
  egal([L.estDebout('Curl au pupitre'), L.estDebout('Élévations latérales à la machine'), L.estDebout('Leg curl assis'), L.estDebout('Développé épaules aux haltères')], [false, false, false, false],
    'estDebout : ni assis, ni sur une machine, ni un exercice de jambes');
}

// 2.13.0 : la progression des séries (avis) : 1 série de plus sur un exercice du dos, des épaules ou des pecs bloqué 3 semaines,
// à partir de 12 semaines ; 4 par exercice, 20 par semaine et par muscle, +20 % par muscle sur 4 semaines.
{
  const PD = L.lireProgramme(PROGRAMME_DEFAUT);
  const S = (date, nom, exos) => ({ date, nom, exos }), X = (nom, series) => ({ nom, series }), k = (c, r) => ({ c, r });
  const fois = (n, x) => Array.from({ length: n }, () => Object.assign({}, x));
  const R60 = { niveau: 'regulier', parSemaine: 3, duree: 60 };
  const TH = 'Tirage horizontal à la poulie', TL = 'Tirage vertical prise large', TN = 'Tirage vertical prise neutre';
  const cle = (n) => L.norm(n);
  const une = (date, nom, r) => S(date, 'Séance A', [X(nom, fois(3, k(40, r)))]);
  // Première séance le 03/08 ; un progrès le 19/10 ; puis 3 lundis sans rien gagner : le 26/10, le 02/11 et le 09/11.
  const bloque = (nom) => [une('2026-08-03', nom, 10), une('2026-10-19', nom, 11), une('2026-10-26', nom, 11), une('2026-11-02', nom, 11), une('2026-11-09', nom, 11)];
  const h = bloque(TH);
  egal([L.progressionSeries(PD, h, R60, '2026-11-08'), L.progressionSeries(PD, h, R60, '2026-11-10')],
    [{}, { [cle(TH)]: { plus: 1, depuis: '2026-11-09' } }], 'progressionSeries : 3 semaines sans rien gagner (21 jours, 3 semaines d\'essais) : 1 série de plus, pas avant');
  // Avant 12 semaines : rien, même bloqué. Première séance le 07/09 : le 09/11, c'est le 63e jour.
  egal(L.progressionSeries(PD, [une('2026-09-07', TH, 11)].concat(h.slice(2)), R60, '2026-11-10'), {}, 'progressionSeries : rien avant 12 semaines');
  // Deux semaines d'essais seulement (une semaine sans salle au milieu) : pas encore bloqué.
  egal(L.progressionSeries(PD, [h[0], h[1], h[2], h[4]], R60, '2026-11-10'), {}, 'progressionSeries : une semaine sans salle ne compte pas comme une semaine bloquée');
  // Un jour plus léger puis le retour à la même charge n'est pas un progrès : on compare à sa meilleure fois.
  const leger = [h[0], h[1], S('2026-10-26', 'Séance A', [X(TH, fois(3, k(30, 12)))]), h[3], h[4]];
  egal(L.progressionSeries(PD, leger, R60, '2026-11-10')[cle(TH)], { plus: 1, depuis: '2026-11-09' }, 'progressionSeries : comparé à sa meilleure fois, pas à la dernière');
  // La série gagnée reste quand l'exercice reprogresse ; jamais plus de 4 séries (3 + 1).
  const suite = h.concat([une('2026-11-16', TH, 12), une('2026-11-23', TH, 12), une('2026-11-30', TH, 12), une('2026-12-07', TH, 12), une('2026-12-14', TH, 12)]);
  egal(L.progressionSeries(PD, suite, R60, '2026-12-15'), { [cle(TH)]: { plus: 1, depuis: '2026-11-09' } }, 'progressionSeries : la série gagnée reste, 4 séries au plus par exercice');
  // Les jambes : jamais. Les bras : oui depuis la 2.31.0 (demande : un trait qui plaît se travaille ; ils sont prioritaires dans objectif.json).
  // 2.35.1 : le curl à la barre en Z est en A et en B. Une série de plus compterait dans les deux séances : plus de 20 % d'un coup, refusé.
  const PDA = PD.map((s, i) => (i === 1 ? Object.assign({}, s, { exos: s.exos.filter((e) => e.nom !== 'Curl à la barre en Z') }) : s));   // le curl en A seulement
  egal([L.progressionSeries(PD, bloque('Presse à cuisses'), R60, '2026-11-10'), L.progressionSeries(PDA, bloque('Curl à la barre en Z'), R60, '2026-11-10'), L.progressionSeries(PD, bloque('Curl à la barre en Z'), R60, '2026-11-10')],
    [{}, { [cle('Curl à la barre en Z')]: { plus: 1, depuis: '2026-11-09' } }, { [cle('Curl à la barre en Z')]: { plus: 1, depuis: '2026-11-09', seance: 0 } }],
    'progressionSeries : jamais les jambes ; les bras oui ; un exercice écrit en A et en B gagne sa série dans la première séance seulement (2.36.1)');
  // 2.36.1 : la série gagnée n'est posée que dans la séance désignée (sans rang donné : partout, comme avant).
  {
    const g = { [cle('Curl à la barre en Z')]: { plus: 1, depuis: '2026-11-09', seance: 0 } };
    const pose = (i) => { const a = { exos: [{ nom: 'Curl à la barre en Z', series: 3 }] }; L.appliquerProgression(a, g, [], i); return a.exos[0].series; };
    egal([pose(0), pose(1), pose(undefined)], [4, 3, 4], 'appliquerProgression : la série en plus seulement dans la séance qui la reçoit');
  }
  // +20 % par muscle sur 4 semaines : le dos fait 15 séries par semaine à 1 h ; 2 tirages bloqués le même jour passent
  // (16,5 puis 18), le 3e non (19,5).
  const trois = [0, 1, 2, 3, 4].map((j) => S(h[j].date, 'Séance A', [TL, TH, TN].map((n) => X(n, fois(3, k(40, j ? 11 : 10))))));
  egal(Object.keys(L.progressionSeries(PD, trois, R60, '2026-11-10')), [cle(TL), cle(TH)], 'progressionSeries : au plus +20 % de séries par muscle sur 4 semaines');
  // 20 séries par semaine au plus : un programme où le dos en fait déjà 18 (2 tirages à 3 séries, 3 fois par semaine).
  const PETIT = [{ nom: 'Séance A', exos: PD[0].exos.filter((e) => e.nom === TL || e.nom === TH) }];
  egal(L.progressionSeries(PETIT, h, R60, '2026-11-10'), {}, 'progressionSeries : jamais plus de 20 séries par semaine pour un muscle');
  // À 1 h 15, les 3 premiers exercices de A sont déjà à 4 séries (tirage vertical, tirage horizontal, élévations) : aucun ne gagne.
  const R75 = Object.assign({}, R60, { duree: 75 });
  egal([L.progressionSeries(PD, bloque(TL), R75, '2026-11-10'), Object.keys(L.progressionSeries(PD, h, R75, '2026-11-10'))], [{}, []], 'progressionSeries : à 1 h 15, un exercice déjà à 4 séries ne gagne rien');
  egal([L.progressionSeries([], h, R60, '2026-11-10'), L.progressionSeries(PD, [], R60, '2026-11-10'), L.progressionSeries(PD, null, R60, 'pas une date')], [{}, {}, {}], 'progressionSeries : sans programme, sans séance ou sans date, rien');
  // La séance du jour : 4 séries, dit une fois ; plus rien à dire dès que l'exercice a été refait ; jamais en semaine légère.
  const sj = L.seanceDuJour(PD, h, R60, '2026-11-11', 0);
  const th = (x) => x.exos.find((e) => e.nom === TH);
  egal([th(sj).series, th(sj).seriePlus, sj.lignes], [4, true, ['Tirage horizontal : 1 série de plus à partir d\'aujourd\'hui.']], 'seanceDuJour : la série gagnée est dans la séance, une ligne le dit');
  const apres = L.seanceDuJour(PD, h.concat([S('2026-11-11', 'Séance A', [X(TH, fois(4, k(40, 11)))])]), R60, '2026-11-13', 0);
  egal([th(apres).series, !!th(apres).seriePlus, apres.lignes], [4, false, []], 'seanceDuJour : la fois suivante, 4 séries sans le redire');
  const legere = L.seanceDuJour(PD, h, Object.assign({}, R60, { semainesLegeres: ['2026-11-09'] }), '2026-11-11', 0);
  egal([legere.legere, th(legere).series, !!th(legere).seriePlus], [true, 2, false], 'seanceDuJour : en semaine légère, pas de série de plus');
}

// ── 2.22.0 : les charges de départ viennent du poids des réglages (demande : « si 70 est marqué en dur, non ») ──
{
  const tv = exo('Tirage vertical prise large'), el = exo('Élévations latérales aux haltères'), presse = exo('Presse à cuisses');
  egal([L.chargeDepart(tv, 70), L.chargeDepart(el, 70), L.chargeDepart(presse, 70), L.chargeDepart(tv, 90), L.chargeDepart(presse, 55), L.chargeDepart(el, 55)], [40, 4, 60, 52.5, 45, 3],
    'chargeDepart : une part du poids du corps, arrondie au pas de l\'exercice (70 kg : les charges d\'avant ; plus lourd ou plus léger : en proportion)');
  egal([L.chargeDepart(tv, null), L.chargeDepart(tv, 0), L.chargeDepart({ nom: 'Exercice inconnu', pas: 2.5 }, 70), L.chargeDepart(Object.assign({}, tv, { corps: true }), 70), L.chargeDepart(null, 70)], [null, null, null, null, null],
    'chargeDepart : poids inconnu, exercice sans repère ou au poids du corps : rien');
  const prete = (poids) => L.preparerSeance({ nom: 'Séance A', exos: [Object.assign({}, tv), Object.assign({}, exo('Gainage planche'))], lignes: [] }, { seances: [], programme: [], reglages: poids ? { poids } : {} }).exos;
  egal([prete(70).map((x) => x.depart), prete(90).map((x) => x.depart), prete(null).map((x) => x.depart)], [[40, undefined], [52.5, undefined], [undefined, undefined]],
    'preparerSeance : chaque exercice reçoit sa charge de départ d\'après le poids des réglages ; sans poids, aucune');
  const rempl = L.remplacer(Object.assign({}, tv, { depart: 40, alternatives: [{ nom: 'Tractions', corps: true }] }), { nom: 'Tractions', corps: true }, [], [], 70);
  egal([rempl.nom, rempl.depart], ['Tractions', undefined], 'remplacer : la charge de départ suit le nouveau nom (au poids du corps : aucune)');
}

// ── 2.31.0 : les mesures pilotent le programme (avis) : un tour qui ne monte pas en 12 semaines ajoute une série ──
{
  const prog = L.lireProgramme(PROGRAMME_DEFAUT);
  const faites = Array.from({ length: 28 }, (_, k) => ({ date: L.plusJours('2026-11-16', 3 * k), nom: 'Séance A', exos: [] }));   // régulier : 28 séances en 12 semaines
  const m0 = { date: '2026-11-15', bras: 34, epaules: 107, taille: 75 };
  const BRAS = ['curl a la barre en z', 'extension triceps au-dessus de la tete a la poulie'];   // 2.35.1 : plus de curl aux haltères dans le programme livré
  const stagne = L.seriesParMesures(prog, faites, [m0, { date: '2027-02-07', bras: 34.2, epaules: 108.5 }], '2027-02-08');
  egal([Object.keys(stagne).sort(), stagne['curl a la barre en z']], [BRAS, { plus: 1, depuis: '2027-02-07', mesure: 'bras' }],
    'seriesParMesures : le tour de bras n\'a pas pris 0,5 cm en 12 semaines → une série de plus aux curls et au triceps ; les épaules (+1,5 cm) ne changent rien');
  egal([L.seriesParMesures(prog, faites, [m0, { date: '2027-02-07', bras: 34.6, epaules: 108.5 }], '2027-02-08'),
    L.seriesParMesures(prog, faites.slice(0, 10), [m0, { date: '2027-02-07', bras: 34, epaules: 108.5 }], '2027-02-08'),
    L.seriesParMesures(prog, faites, [m0, { date: '2027-01-10', bras: 34, epaules: 107 }], '2027-01-11'),
    L.seriesParMesures(prog, faites, [m0], '2027-02-08'), L.seriesParMesures(prog, faites, null, '2027-02-08')], [{}, {}, {}, {}, {}],
    'seriesParMesures : rien si le tour a gagné son seuil, si les séances manquent, avant 12 semaines, ou sans deux mesures');
  egal(Object.keys(L.seriesParMesures(prog, faites, [m0, { date: '2027-02-07', bras: 35, epaules: 107.5 }], '2027-02-08')).sort(), ['elevations laterales a la machine', 'elevations laterales aux halteres'],
    'seriesParMesures : les épaules n\'ont pas pris 1 cm → leurs exercices');
  const a = L.adapter(prog[0].exos, L.fusionReglages({ niveau: 'regulier', parSemaine: 3, duree: 60, jours: [1, 3, 5] }), 30);
  const avant = a.exos.find((e) => e.nom === 'Curl à la barre en Z').series;
  L.appliquerProgression(a, stagne, faites);
  egal([avant, a.exos.find((e) => e.nom === 'Curl à la barre en Z').series], [3, 4], 'seriesParMesures : la série gagnée arrive dans la séance (3 → 4 au curl)');
  egal(L.controlesMesures([m0, { date: '2026-12-06', poids: 71 }], '2026-11-17'), [`**Bras** : contrôle le ${L.dateCourte('2027-02-07')}. Sans 0,5 cm de plus, tes bras gagnent une série (avis).`,
    `**Épaules** : contrôle le ${L.dateCourte('2027-02-07')}. Sans 1 cm de plus, tes épaules gagnent une série (avis).`], 'controlesMesures : une ligne par tour suivi, 12 semaines après la première mesure');
  egal(L.controlesMesures([{ date: '2026-11-10', poids: 70 }], '2026-11-17'), [], 'controlesMesures : sans tour mesuré, rien');
}

// ── 2.34.0 : son réglage de chaque machine (demande : « si un réglage est nécessaire, écris ce réglage quelque part ») ──
{
  const reg = L.fusionReglages({ niveau: 'regulier', parSemaine: 3, duree: 60, machines: { 'presse a cuisses': '  siège   4 ', 'curl aux halteres': '', autre: 12 } });
  egal(reg.machines, { 'presse a cuisses': 'siège 4' }, 'réglages : les réglages de machine sont gardés propres (texte court, rien de vide)');
  const prog = L.lireProgramme(PROGRAMME_DEFAUT);
  const sj = L.preparerSeance({ nom: 'Séance A', exos: prog[0].exos.map((e) => Object.assign({}, e)) }, { seances: [], programme: prog, reglages: reg });
  const presse = sj.exos.find((e) => e.nom === 'Presse à cuisses'), tirage = sj.exos.find((e) => e.nom === 'Tirage vertical prise large');
  egal([presse.monReglage, presse.reglage, L.texteReglage(presse, {}), tirage.monReglage], ['siège 4', undefined, 'Réglage : siège à 4', undefined], 'séance : son réglage de la machine est redit (« Réglage : siège à 4 »), seulement là où il en a noté un');
  // 2.36.3 : il ne remplace plus le réglage du programme (l'angle du banc reste dit) : les deux, dans l'ordre.
  const banc = { nom: 'Développé incliné aux haltères', reglage: 'banc 30° (2e ou 3e cran)', monReglage: 'cran 3' };
  egal([L.reglages(banc), L.texteReglage(banc, {}), L.reglages({ nom: 'x', reglage: 'siège 4', monReglage: 'Siège 4' }), L.reglages({ nom: 'x' }), L.reglages({ nom: 'x', echauffement: true, reglage: 'a' })],
    [['banc à 30° (2e ou 3e cran)', 'cran 3'], 'Réglage : banc à 30° (2e ou 3e cran) · cran 3', ['siège à 4'], [], []], 'réglages : celui du programme puis le sien, sans redite ; rien à l\'échauffement');
  egal(L.reglagesDesReponses(reg, { niveau: 'un peu' }, 70).machines, { 'presse a cuisses': 'siège 4' }, 'réglages : « Changer mes réponses » garde ses réglages de machine');
}

// ── 2.37.0 : les charges qui existent sur l'appareil, la charge suivante réglée sur ce qu'il a fait et sur sa réserve (35-charge.js) ──
{
  const X = (o) => Object.assign({ nom: 'Exercice', series: 2, min: 8, max: 12, unite: 'reps', pas: 2.5 }, o);
  const D = (charge, reps, reserve) => Object.assign({ date: 'x', series: reps.map((r) => ({ c: charge, r })) }, reserve ? { reserve } : {});
  egal([L.cranDessous(X({ pas: 5 }), 42.5), L.cranDessous(X({ pas: 2.5 }), 42.5), L.cranDessous(X({ pas: 5 }), 3), L.cranDessous(X({ pas: 2 }), 9)], [40, 42.5, 5, 8],
    'cran : une charge hors de la grille revient au cran du dessous, jamais sous un cran');
  egal([L.capacite([8, 12], '1-2'), L.capacite([12, 12], '0'), L.capacite([20], '3+'), L.capacite([25], '3+'), L.capacite([12, 10]), L.capacite(null, '3+')], [13, 12, 23, 26, 10, 3],
    'capacité : la dernière série plus la réserve (0, 1 ou 3), 26 au plus ; sans réponse : les répétitions seules');
  egal([L.aVide(X({ nom: 'Curl à la barre en Z' })), L.aVide(X({ nom: 'Curl à la barre en Z', vide: 12 })), L.aVide(X({ nom: 'Hip thrust à la barre' })), L.aVide(X({ nom: 'Tirage vertical prise large' })), L.aVide(X({ nom: 'Tractions à la barre fixe' })), L.aVide(null)],
    [10, 12, 20, 0, 0, 0], 'à vide : la barre compte (10 kg en Z, 20 kg droite), ou ce que dit le programme ; rien pour une machine');
  egal([L.repsPrevues(X({ pas: 5 }), 40, 13, 45), L.repsPrevues(X({ pas: 2 }), 8, 12, 10), +L.repsPrevues(X({ nom: 'Curl à la barre en Z' }), 5, 12, 7.5).toFixed(2)], [8.375, 2.5, 5.67],
    'répétitions prévues : 50 − (nouvelle / ancienne) × (50 − capacité), la barre comptée');
  egal([L.passage(X({ pas: 5 }), 40, 45), L.passage(X({ pas: 2 }), 8, 10), L.passage(X({ pas: 1 }), 8, 9), L.passage(X({ nom: 'Curl à la barre en Z', min: 10, max: 15 }), 5, 7.5), L.passage(X({ min: 12, max: 20, pas: 2 }), 4, 6)],
    [14, 18, 14, 17, 26], 'passage : la capacité à atteindre avant le cran du dessus (pile de 5 en 5 à 40 kg : 14 ; haltères de 8 à 10 kg : 18)');
  egal([L.chargeMontee(X({ min: 10, max: 15, pas: 5 }), 30, 21), L.chargeMontee(X({ min: 10, max: 15, pas: 2.5 }), 30, 21), L.chargeMontee(X({ min: 10, max: 15, pas: 10 }), 80, 16), L.chargeMontee(X({ min: 12, max: 20, pas: 1 }), 4, 21),
    L.chargeMontee(X({ min: 12, max: 20, pas: 2 }), 4, 21), L.chargeMontee(X({ pas: 2 }), 8, 12), L.chargeMontee(X({ pas: 5 }), 42.5, 13)],
    [35, 35, 90, 5, 4, 8, 45], 'monter : le cran du dessus s\'il y fera le bas de la fourchette ; plus loin tant qu\'il y ferait le milieu, 20 % au plus');
  egal([L.chargeBaissee(X({}), 40, 7), L.chargeBaissee(X({}), 40, 5), L.chargeBaissee(X({ pas: 2 }), 10, 3), L.chargeBaissee(X({ pas: 5 }), 42.5, 7), L.chargeBaissee(X({ pas: 5 }), 5, 2)], [37.5, 35, 8, 40, 5],
    'baisser : le cran du dessous, un de plus si le calcul le dit ; jamais sous un cran');
  const hist = [{ date: '2026-11-16', nom: 'Séance A', exos: [{ nom: 'Tirage vertical prise large', series: [{ c: 40, r: 8 }, { c: 40, r: 12 }], reserve: '1-2' }, { nom: 'Presse à cuisses', series: [{ c: 80, r: 12 }] }] }];
  egal([L.chargeJumeau(hist, 'Tirage vertical prise neutre'), L.chargeJumeau(hist, 'Tirage vertical prise large'), L.chargeJumeau(hist, 'Presse à cuisses'), L.chargeJumeau(null, 'Tirage vertical prise neutre')], [40, 0, 0, 0],
    'jumeau : le même appareil avec une autre prise, déjà fait');
  const neutre = X({ nom: 'Tirage vertical prise neutre', pas: 5 });
  egal([L.chargeDepart(neutre, 70, hist), L.chargeDepart(neutre, 70, [{ date: 'x', exos: [{ nom: 'Tirage vertical prise large', series: [{ c: 42.5, r: 8 }] }] }]), L.chargeDepart(neutre, 70, []), L.chargeDepart(neutre, 0, hist)], [40, 40, 40, 40],
    'départ : la charge du même appareil avec l\'autre prise, au cran du dessous (même sans poids connu) ; sinon la part du poids du corps');
  egal([L.parCote(25), L.parCote(40), L.parCote(80), L.parCote(27.5), L.parCote(26), L.parCote(5)], [[10, 2.5], [20], [20, 20], [10, 2.5, 1.25], [], [2.5]],
    'disques par côté : les plus gros d\'abord ; une charge impossible : rien');
  egal([L.texteParCote(X({ nom: 'Rowing à la machine à disques' }), 80), L.texteParCote(X({ nom: 'Curl à la barre en Z' }), 5), L.texteParCote(X({ nom: 'Presse à cuisses', disques: true }), 90), L.texteParCote(X({ nom: 'Presse à cuisses' }), 90),
    L.texteParCote(X({ nom: 'Tractions à la barre fixe' }), 10), L.texteParCote(X({ nom: 'Curl à la barre en Z' }), 0)],
    ['Par côté : 2 × 20', 'Par côté : 2,5', 'Par côté : 2 × 20 + 5', '', '', ''], 'par côté : seulement sur un appareil à disques (écrit dans le programme, ou dit par son nom)');
  const lu = L.lireExercice('Presse à cuisses · 3 × 10-15 · repos 2 min · pas 10 kg · disques'), lu2 = L.lireExercice('Curl à la barre en Z · 3 × 10-15 · pas 2,5 kg · à vide 12 kg');
  egal([lu.disques, lu.pas, lu2.vide, L.aVide(lu2), L.lireExercice('Leg curl assis · 3 × 10-15').disques], [true, 10, 12, 12, undefined], 'programme : « disques » et « à vide 12 kg » se lisent sur la ligne de l\'exercice');
  // Ses séances du 13 et du 16/11, avec les crans de sa salle.
  const C = (exo, der) => { const c = L.conseil(exo, der); return [c.charge, c.valeur, !!c.monte, c.texte]; };
  egal(C(X({ nom: 'Développé épaules aux haltères', pas: 2 }), D(8, [12, 12], '0')), [8, 13, false, 'Garde 8 kg (la dernière fois : 12, 12). Gagne une répétition.\nEt après : 10 kg quand tu en fais environ 18.'],
    'conseil : haltères de 8 à 10 kg (+25 %) : on reste, la fourchette s\'allonge');
  egal(C(X({ nom: 'Tirage vertical prise large', pas: 5 }), D(40, [8, 12], '1-2')), [40, 12, false, 'Garde 40 kg (la dernière fois : 8, 12). Vise 12 dès la 1re série.'],
    'conseil : pile de 5 en 5 : jamais 42,5 ; au moins autant que sa meilleure série');
  egal([C(X({ nom: 'Tirage vertical prise large', pas: 5 }), D(42.5, [8, 9], '1-2')).slice(0, 2), C(X({ nom: 'Tirage vertical prise large', pas: 5 }), D(42.5, [12, 12], '1-2')).slice(0, 3)], [[40, 9], [45, 8, true]],
    'conseil : une charge notée hors de la grille : on reste au cran du dessous, on monte au cran du dessus');
  egal(C(X({ nom: 'Leg curl assis', min: 10, max: 15, pas: 5 }), D(30, [16, 20], '1-2')), [35, 10, true, '15 répétitions partout à 30 kg : monte à 35 kg.\nComment : le plus de répétitions propres, au moins 10 (avis).'],
    'conseil : trop léger (20 répétitions pour 10-15) : on monte');
  egal(C(X({ nom: 'Presse à cuisses', min: 10, max: 15, pas: 10 }), D(80, [12, 15], '1-2')), [90, 10, true, '12, 15 répétitions à 80 kg, 1 ou 2 en réserve : monte à 90 kg.\nComment : le plus de répétitions propres, au moins 10 (avis).'],
    'conseil : la capacité dépasse le haut de la fourchette : on monte sans attendre « partout »');
  egal(C(X({ nom: 'Élévations latérales aux haltères', min: 12, max: 20, pas: 2 }), D(4, [20, 20], '1-2')), [4, 21, false, 'Garde 4 kg (la dernière fois : 20, 20). Gagne une répétition.\nEt après : 6 kg quand tu en fais environ 26.'],
    'conseil : haltères de 2 en 2 : de 4 à 6 kg, il faut d\'abord en faire 26');
  egal(C(X({ nom: 'Extension triceps à la poulie', min: 10, max: 15, pas: 5 }), D(5, [15, 15], '0'))[3], 'Garde 5 kg (la dernière fois : 15, 15). Gagne une répétition.\nEt après : 10 kg est trop haut pour l\'instant. Cherche un cran plus fin sur l\'appareil.',
    'conseil : un cran qui double la charge : dit clairement, sans promettre un nombre de répétitions');
  // La série test d'un exercice jamais fait, et la dernière série, toujours ouverte.
  const neuf = Object.assign({}, neutre, { depart: 40 }), cn = L.conseil(neuf, null);
  egal([L.cibleSerie(neuf, cn, null, []).gros, L.cibleSerie(neuf, cn, null, [{ c: 40, r: 12 }]).gros, L.cibleSerie(neuf, cn, null, [{ c: 40, r: 12 }]).texte, L.cibleSerie(neuf, cn, null, [{ c: 40, r: 10 }]).gros, L.cibleSerie(neuf, cn, null, [{ c: 40, r: 3 }]).gros],
    ['40 kg × 8+', '45 kg × 8+', '12 répétitions : trop léger. Monte à 45 kg.', '40 kg × 10+', '30 kg × 8+'], 'jamais fait : chaque série est un test, ouverte ; le haut de la fourchette atteint → un cran de plus tout de suite ; très loin du bas → deux crans de moins');
  const epaules = X({ nom: 'Développé épaules aux haltères', pas: 2 }), de = D(8, [12, 12], '0'), ce = L.conseil(epaules, de);
  egal([L.cibleSerie(epaules, ce, de, []).gros, L.cibleSerie(epaules, ce, de, [{ c: 8, r: 13 }]).gros, L.cibleSerie(epaules, ce, de, [{ c: 8, r: 13 }]).valeur, L.cibleSerie(Object.assign({}, epaules, { legere: true }), L.conseil(Object.assign({}, epaules, { legere: true }), de), de, [{ c: 8, r: 12 }]).gros],
    ['8 kg × 13', '8 kg × 13+', 13, '8 kg × 12'], 'la dernière série est ouverte (« 13+ »), les autres non ; la fourchette allongée laisse viser 13 ; jamais en semaine légère');
}

// ── 2.37.0, après la relecture indépendante du calcul ──
{
  const X = (o) => Object.assign({ nom: 'Exercice', series: 3, min: 10, max: 15, unite: 'reps', pas: 5 }, o);
  const melange = { date: 'x', series: [{ c: 35, r: 15 }, { c: 30, r: 15 }, { c: 30, r: 15 }], reserve: '1-2' };
  const cm = L.conseil(X({ nom: 'Leg curl assis' }), melange);
  egal([cm.charge, !!cm.monte, cm.texte], [35, false, 'Garde 35 kg (la dernière fois : 15). Refais 15 à la 1re série, gagne sur les suivantes.'],
    'charges mélangées : une seule série à 35 kg ne fait pas monter ; le texte et la réserve ne comptent que les séries à cette charge');
  const petit = X({ pas: 1, min: 12, max: 20 }), mini = L.conseil(petit, { date: 'x', series: [{ c: 1, r: 4 }, { c: 1, r: 16 }] });
  egal([mini.charge, /redescends/.test(mini.texte), /baisse/.test(L.cibleSerie(petit, mini, { date: 'x', series: [{ c: 1, r: 4 }] }, [{ c: 1, r: 4 }]).texte)], [1, false, false],
    'plus petite charge de l\'appareil : jamais « redescends à 1 kg », on garde et on regagne des répétitions');
  const longue = { date: 'x', series: [{ c: 4, r: 24 }, { c: 4, r: 23 }] }, elev = X({ nom: 'Élévations latérales aux haltères', series: 2, min: 12, max: 20, pas: 2, legere: true });
  const cl = L.conseil(elev, longue);
  egal([cl.charge, cl.valeur, L.cibleSerie(elev, cl, longue, [{ c: 4, r: 24 }]).valeur, L.conseil(X({ legere: true }), { date: 'x', series: [{ c: 42.5, r: 12 }] }).charge], [4, 24, 24, 40],
    'semaine légère : les répétitions au-delà du haut de la fourchette ne sont pas rabotées ; une charge hors de la grille revient au cran du dessous');
  const nuit = L.conseil(X({ nom: 'Élévations latérales aux haltères', series: 2, min: 12, max: 20, pas: 1, sansMontee: true }), { date: 'x', series: [{ c: 4, r: 22 }, { c: 4, r: 22 }], reserve: '1-2' });
  egal([nuit.charge, nuit.valeur, nuit.plafond], [4, 22, 22], 'nuit courte : pas de montée, et les répétitions déjà faites restent la cible');
  const prog = [{ nom: 'Séance A', exos: [L.lireExercice('Curl à la barre en Z · 3 × 10-15 · pas 2,5 kg · disques · à vide 12 kg · ou Curl aux haltères'), L.lireExercice('Développé incliné aux haltères · 3 × 8-12 · pas 2 kg')] }];
  const remplace = L.remplacer(Object.assign({}, prog[0].exos[0], { faites: [] }), { nom: 'Curl aux haltères' }, prog, [], 70);
  egal([remplace.nom, remplace.vide, remplace.disques, remplace.pas, L.texteParCote(remplace, 10)], ['Curl aux haltères', undefined, undefined, 2, ''],
    'remplacer : ni « disques » ni « à vide » de l\'exercice remplacé ; un remplaçant aux haltères prend le pas des haltères du programme');
  const a = { exos: [{ nom: 'Développé incliné à la machine', series: 3 }] };
  const g = { [L.norm('Développé incliné à la machine')]: { plus: 1, depuis: '2027-01-25', seance: 0 } };
  const ss = [{ date: '2027-01-25', nom: 'Séance A', exos: [{ nom: 'Développé incliné à la machine', series: [{ c: 30, r: 8 }] }] }, { date: '2027-01-27', nom: 'Séance B', exos: [{ nom: 'Développé incliné à la machine', series: [{ c: 30, r: 8 }] }] }];
  egal([L.appliquerProgression(a, g, ss, 0, 'Séance A').length, a.exos[0].series, a.exos[0].seriePlus], [1, 4, true], 'série gagnée dans une seule séance : annoncée même si l\'autre séance est passée entre-temps');
  const ordre = L.ordonnerParEtage([{ nom: 'Tirage vertical prise large', etage: 1 }, { nom: 'Gainage planche', etage: 0 }, { nom: 'Extension triceps à la poulie', etage: 1 }, { nom: 'Développé incliné aux haltères', etage: 2 }, { nom: 'Curl aux haltères', etage: 2 }], [1]).exos.map((x) => x.nom);
  egal([ordre.length, ordre[ordre.length - 1]], [5, 'Gainage planche'], 'ordre : le gainage en tout dernier, même à un autre étage que les exercices qui attendent la fin');
}
