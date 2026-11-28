// Les tests 1.x de la logique pure (L), repris tels quels de l'ancien tests/test_logique.js (~/Desktop/CLAUDE/Salle-travail/archives/2026-11-14-avant-2.0.0/tests/).
// Lancés par tests/lancer.js, après tests/commun.js (main.js, PROGRAMME_115, egal, vrai, avertir, lireNote). Un test ne
// change que pour un changement voulu, avec un commentaire à côté (« 2.0 (lot …) : raison »).
// 2.0 (lot E) : le programme 1.15.0 figé (PROGRAMME_115, tests/programme-115.js). Les suites qui calculent sur prog,
// progReel et progBReel gardent leurs valeurs ; les tests du programme LIVRÉ utilisent progOrigine (2.0).
const DEFAUT = PROGRAMME_115; // 2.0 (lot E) : programme 1.15.0 figé, avant : module.exports.PROGRAMME_DEFAUT
const progOrigine = L.lireProgramme(module.exports.PROGRAMME_DEFAUT); // 2.0 (lot E) : le programme livré (2.0)

// ── Outils ──
egal(L.norm('  Élévations   LATÉRALES aux haltères '), 'elevations laterales aux halteres', 'norm : accents, majuscules, espaces');
egal([L.nombre('22,5'), L.nombre('7'), L.nombre(''), L.nombre('abc')], [22.5, 7, null, null], 'nombre');
egal([L.fmt(22.5), L.fmt(20), L.fmt(1.25)], ['22,5', '20', '1,25'], 'fmt');
egal(L.dateLongue('2026-11-16'), 'lundi 16 novembre 2026', 'dateLongue');
egal(L.dateLongue('2026-12-01'), 'mardi 1er décembre 2026', 'dateLongue : 1er');
egal([L.joursEntre('2026-11-14', '2026-11-16'), L.joursEntre('2026-10-24', '2026-10-26'), L.joursEntre('2026-12-31', '2027-01-01')], [2, 2, 1], 'joursEntre (changement d\'heure, nouvel an)');
egal([L.lundi('2026-11-16'), L.lundi('2026-11-22'), L.lundi('2026-11-10')], ['2026-11-16', '2026-11-16', '2026-11-09'], 'lundi');
egal([L.fmtDuree(90), L.fmtDuree(5.4), L.fmtDuree(-3)], ['1:30', '0:05', '0:00'], 'fmtDuree');

// ── En-tête ──
egal(L.lireEntete('---\nsalle: programme\nNom: "Séance A"\n---\n# T\n'), { cles: { salle: 'programme', nom: 'Séance A' }, corps: '# T\n' }, 'lireEntete');
egal(L.lireEntete('# pas d\'en-tête'), { cles: {}, corps: '# pas d\'en-tête' }, 'lireEntete : absente');
egal(L.lireEntete('---\r\nsalle: guide\r\n---\r\ntexte').cles.salle, 'guide', 'lireEntete : fins de ligne Windows');
egal(L.poserCle('---\nsalle: seance\ndate: 2026-11-16\n---\n# T\n', 'ressenti', 'bien'), '---\nsalle: seance\ndate: 2026-11-16\nressenti: bien\n---\n# T\n', 'poserCle : ajoute');
egal(L.poserCle('---\nsalle: seance\nressenti: dur\n---\n# T\n', 'ressenti', 'bien'), '---\nsalle: seance\nressenti: bien\n---\n# T\n', 'poserCle : remplace');
egal(L.poserCle('# T', 'ressenti', 'bien'), '# T', 'poserCle : sans en-tête, rien');

// ── Programme ──
const prog = L.lireProgramme(DEFAUT);
egal(prog.map((s) => [s.nom, s.exos.length]), [['Séance A', 8], ['Séance B', 8]], 'programme d\'origine : 2 séances de 8 exercices');
const exoDe = (i, nom) => prog[i].exos.find((e) => e.nom === nom);
egal(prog[0].exos[0], { nom: 'Tirage vertical prise large', series: 3, min: 8, max: 12, unite: 'reps', repos: 120, pas: 2.5, option: false, corps: false, etage: 1, alternatives: [{ nom: 'Tractions', corps: true }] }, 'exercice complet, avec son étage (1.14.0) et son remplaçant');
egal(exoDe(0, 'Élévations latérales aux haltères'), { nom: 'Élévations latérales aux haltères', series: 3, min: 12, max: 20, unite: 'reps', repos: 90, pas: 1, option: false, corps: false, etage: 2 }, 'repos 1 min 30, pas 1 kg, étage 2');
egal([exoDe(0, 'Curl aux haltères').option, exoDe(0, 'Curl aux haltères').series], [true, 2], 'option');
egal([exoDe(0, 'Gainage planche').unite, exoDe(0, 'Gainage planche').min, exoDe(0, 'Gainage planche').max, exoDe(0, 'Gainage planche').repos], ['s', 30, 60, 60], 'exercice au temps');
// Les notes du coffre sont à demande : il peut les modifier. Un écart est signalé, sans faire échouer les tests.
const noteProgramme = lireNote('../../Programme.md');
avertir(noteProgramme !== null, 'Programme.md introuvable à la racine du coffre (déplacée ou renommée : le plugin la retrouve par son en-tête).');
avertir(noteProgramme === null || L.lireProgramme(noteProgramme).length > 0, 'Programme.md ne contient aucune séance lisible : le plugin utilisera le programme d\'origine.');
// Ce que l'utilisateur peut écrire à la main
egal(L.lireExercice('Squat'), { nom: 'Squat', series: 3, min: 8, max: 12, unite: 'reps', repos: 90, pas: 2.5, option: false, corps: false }, 'un nom seul : valeurs par défaut');
egal(L.lireExercice('**Squat** | 4x10 | Repos 90 s | n\'importe quoi'), { nom: 'Squat', series: 4, min: 10, max: 10, unite: 'reps', repos: 90, pas: 2.5, option: false, corps: false }, 'barres, x, texte libre ignoré');
egal(L.lireExercice('Pompes · 3 × 8 à 15 · poids du corps').corps, true, 'poids du corps, « à »');
egal(L.lireExercice('Pompes · 3 × 8 à 15 · poids du corps').max, 15, '8 à 15');
egal(L.lireExercice('  ·  '), null, 'ligne vide');
egal(L.lireProgramme('# Programme\n\n- hors séance\n\n## Jambes\n- [ ] Presse · 3 × 10\n* Leg curl\n\n## Vide\n\ntexte\n').map((s) => [s.nom, s.exos.map((e) => e.nom)]), [['Jambes', ['Presse', 'Leg curl']]], 'titres, cases à cocher, séance vide retirée');
egal(L.lireProgramme(''), [], 'note vide');
egal(L.lireProgramme('n\'importe quoi\n## \n- \n'), [], 'note illisible');

// ── Séances ──
const s1 = { nom: 'Séance A', date: '2026-11-16', dureeMin: 52, exos: [
  { nom: 'Tirage vertical prise large', series: [{ c: 35, r: 12 }, { c: 35, r: 10 }, { c: 35, r: 9 }] },
  { nom: 'Élévations latérales aux haltères', series: [{ c: 4.5, r: 15 }] },
  { nom: 'Gainage planche', series: [{ s: 40 }, { s: 35 }] },
  { nom: 'Pompes', series: [{ c: 0, r: 12 }] },
  { nom: 'Rien', series: [] }] };
const texte1 = L.ecrireSeance(s1);
egal(texte1, '---\nsalle: seance\ndate: 2026-11-16\nnom: Séance A\nduree_min: 52\n---\n# Séance A · lundi 16 novembre 2026\n\n## Tirage vertical prise large\n- 35 kg × 12\n- 35 kg × 10\n- 35 kg × 9\n\n## Élévations latérales aux haltères\n- 4,5 kg × 15\n\n## Gainage planche\n- 40 s\n- 35 s\n\n## Pompes\n- 12 rép.\n', 'ecrireSeance');
egal(L.lireSeance(texte1), { date: '2026-11-16', nom: 'Séance A', dureeMin: 52, ressenti: '', exos: s1.exos.slice(0, 4) }, 'lireSeance relit ecrireSeance');
egal(L.lireSeance(L.poserCle(texte1, 'ressenti', 'dur')).ressenti, 'dur', 'ressenti relu');
egal(L.lireSeance('---\nsalle: programme\n---\n'), null, 'pas une séance');
egal(L.lireSeance('---\nsalle: seance\ndate: bientôt\n---\n'), null, 'date illisible');
egal(L.lireSeance('---\nSalle: Séance\ndate: 2026-11-18\n---\n## Curl\n- 8kg x 12\n- 8,5 KG × 11 (dur)\n- pas une série\n- 10\n').exos, [{ nom: 'Curl', series: [{ c: 8, r: 12 }, { c: 8.5, r: 11 }, { c: 0, r: 10 }] }], 'séries écrites à la main');
egal([L.lireSerie('45 s'), L.lireSerie('45 sec'), L.lireSerie('12 rép.'), L.lireSerie('12 reps'), L.lireSerie('')], [{ s: 45 }, { s: 45 }, { c: 0, r: 12 }, { c: 0, r: 12 }, null], 'lireSerie');
egal(L.nomFichier('2026-11-16', 'Séance A / haut #1'), '2026-11-16-seance-a-haut-1', 'nomFichier : ni accent, ni espace, ni caractère interdit');

// ── Enchaînement ──
const S = (date, nom, exos) => ({ date, nom, exos: exos || [] });
egal([L.prochaine(prog, []), L.prochaine(prog, [S('2026-11-16', 'Séance A')]), L.prochaine(prog, [S('2026-11-16', 'séance b')]), L.prochaine(prog, [S('2026-11-16', 'Autre')]), L.prochaine([], [])], [0, 1, 0, 0, -1], 'prochaine : A, B, A… et les cas limites');
egal(L.trier([S('2026-11-18', 'B'), S('2026-11-16', 'A')]).map((s) => s.nom), ['A', 'B'], 'trier');
const hist = [
  S('2026-11-16', 'Séance A', [{ nom: 'Tirage vertical prise large', series: [{ c: 35, r: 12 }, { c: 35, r: 10 }, { c: 35, r: 9 }] }, { nom: 'Gainage planche', series: [{ s: 40 }, { s: 35 }] }]),
  S('2026-11-18', 'Séance B', [{ nom: 'Leg curl assis', series: [{ c: 20, r: 15 }, { c: 20, r: 15 }, { c: 20, r: 15 }] }]),
  S('2026-11-20', 'Séance A', [{ nom: 'TIRAGE vertical prise large', series: [{ c: 35, r: 12 }, { c: 35, r: 12 }, { c: 35, r: 11 }] }]),
];
egal(L.derniere(hist, 'Tirage vertical prise large').date, '2026-11-20', 'derniere : la plus récente, sans tenir compte des majuscules');
egal(L.derniere(hist, 'Inconnu'), null, 'derniere : jamais fait');

// ── Conseil (double progression) ──
const tirage = prog[0].exos[0], curlJ = exoDe(1, 'Leg curl assis'), planche = exoDe(0, 'Gainage planche');
egal([L.conseil(Object.assign({}, tirage, { depart: L.chargeDepart(tirage, 70) }), null).charge, L.conseil(tirage, null).valeur, L.conseil({ nom: 'Exercice inconnu', series: 3, min: 8, max: 12, unite: 'reps', pas: 2.5 }, null).charge, L.conseil({ nom: 'Tirage vertical prise large', corps: true, series: 3, min: 8, max: 12, unite: 'reps', pas: 2.5 }, null).charge],
  [40, 8, null, null], 'conseil : première fois, une charge de départ proposée si on en connaît une');
vrai(progOrigine.every((s) => s.exos.every((e) => e.unite === 's' || L.chargeDepart(e, 70) > 0)) && progOrigine.every((s) => s.exos.every((e) => (e.alternatives || []).every((x) => x.corps || DEPARTS_PAR_KG[L.norm(x.nom)] > 0))), 'chaque exercice chargé du programme d\'origine, et chaque remplaçant, a sa charge de départ'); // 2.0 (lot E) : programme livré (progOrigine)
egal([L.conseil(tirage, L.derniere(hist, tirage.nom)).charge, L.conseil(tirage, L.derniere(hist, tirage.nom)).valeur], [35, 12], 'conseil : fourchette pas finie → même charge, une répétition de plus (plafonnée)');
// 2.37.0 : on ne monte que si, d'après le calcul, il fera encore le bas de la fourchette au cran du dessus (35-charge.js).
egal([L.conseil(curlJ, L.derniere(hist, curlJ.nom)).charge, L.conseil(curlJ, L.derniere(hist, curlJ.nom)).valeur, !!L.conseil(curlJ, L.derniere(hist, curlJ.nom)).monte], [20, 16, false], 'conseil : 15 partout, mais le cran du dessus est gros (+12,5 %) → même charge, une répétition de plus');
const der40 = { date: 'x', series: [{ c: 40, r: 15 }, { c: 40, r: 15 }, { c: 40, r: 15 }] };
egal([L.conseil(curlJ, der40).charge, L.conseil(curlJ, der40).valeur, L.conseil(curlJ, der40).monte], [42.5, 10, true], 'conseil : 15 partout et un cran de 6 % → on monte d\'un pas et on repart du bas');
egal([L.conseil(tirage, { date: 'x', series: [{ c: 40, r: 7 }, { c: 40, r: 6 }] }).charge, L.conseil(tirage, { date: 'x', series: [{ c: 40, r: 5 }, { c: 40, r: 4 }] }).charge], [40, 35],
  'conseil : un peu sous le bas de la fourchette (7 pour 8) → la charge est gardée ; nettement dessous (5) → on redescend, de deux crans si le calcul le dit (2.37.0)');
egal(L.conseil(tirage, { date: 'x', series: [{ c: 2.5, r: 3 }] }).charge, 2.5, 'conseil : jamais sous un pas');
egal(L.conseil(tirage, { date: 'x', series: [{ c: 30, r: 12 }, { c: 35, r: 12 }, { c: 35, r: 12 }] }).charge, 37.5, 'conseil : on regarde la charge la plus lourde');
egal(L.conseil(tirage, { date: 'x', series: [{ c: 35, r: 12 }] }).charge, 35, 'conseil : une seule série au maximum ne suffit pas pour monter');
egal(L.conseil(planche, null).valeur, 30, 'conseil au temps : première fois');
egal(L.conseil(planche, L.derniere(hist, planche.nom)).valeur, 45, 'conseil au temps : +5 s');
egal(L.conseil(planche, { date: 'x', series: [{ s: 60 }, { s: 60 }, { s: 60 }] }).valeur, 60, 'conseil au temps : plafonné au maximum');
egal(L.conseil({ nom: 'Pompes', series: 3, min: 8, max: 15, unite: 'reps', repos: 60, pas: 2.5, corps: true }, { date: 'x', series: [{ c: 0, r: 10 }, { c: 0, r: 9 }] }).valeur, 11, 'conseil au poids du corps : une répétition de plus');

// ── Séance adaptée ──
const A = prog[0].exos;
// 13/11, demandé par demande : la mise en route retire aussi les options (le curl, option, disparaît : 7 exercices au lieu de 8).
egal(L.adapter(A, { niveau: 'jamais', parSemaine: 3, duree: 60 }, 0).exos.map((e) => e.series), [2, 2, 2, 2, 2, 2, 2], 'découverte : 2 séries partout, sans les options');
// 13/11, demandé par demande : « Quelques fois » a aussi ses 4 séances de mise en route (avant : false pour 'un peu').
egal([L.adapter(A, { niveau: 'jamais', duree: 60 }, 0).decouverte, L.adapter(A, { niveau: 'jamais', duree: 60 }, 4).decouverte, L.adapter(A, { niveau: 'un peu', duree: 60 }, 0).decouverte, L.adapter(A, { niveau: 'regulier', duree: 60 }, 0).decouverte], [true, false, true, false], 'découverte : les 4 premières séances, sauf « Régulièrement »');
egal(L.adapter(A, { niveau: 'un peu', duree: 45 }, 9).exos.map((e) => e.nom).indexOf('Curl aux haltères'), -1, '45 min : sans les options');
egal(L.adapter(A, { niveau: 'un peu', duree: 75 }, 9).exos.map((e) => e.series), [4, 4, 4, 3, 3, 2, 2, 2], '1 h 15 : une série de plus sur les 3 premiers');
egal(L.adapter(A, null, 9).exos.length, 8, 'sans réglages : le programme tel quel');
egal(A[0].series, 3, 'adapter ne modifie pas le programme');
// 13/11, demandé par demande : la mise en route sans le curl (option) dure 40 min au lieu de 45.
egal([L.dureeEstimee(L.adapter(A, { niveau: 'un peu', duree: 60 }, 9).exos), L.dureeEstimee(L.adapter(A, { niveau: 'jamais', duree: 60 }, 0).exos)], [55, 40], 'durée estimée');

// ── Semaine légère ──
egal([L.semaineLegere([], '2027-01-20'), L.semaineLegere([], '2027-01-17'), L.semaineLegere([], '2027-01-24'), L.semaineLegere([], '2027-01-25'), L.semaineLegere([], '2027-01-20', { semainesLegeres: [] })],
  [true, false, true, false, false], 'semaineLegere : les semaines du réglage (finaux du 18/01/2027)'); // 2.0 (lot A-progrès) : plus de règle des 8 semaines (la 8e tombait en vacances), les semaines légères viennent du réglage
egal(L.adapter(A, { niveau: 'un peu', duree: 60 }, 9, true).exos.map((e) => e.series), A.map((e) => Math.max(1, Math.ceil(e.series / 2))), 'semaine légère : séries divisées par deux');
egal([L.adapter(A, { niveau: 'jamais', duree: 60 }, 0, true).legere, L.adapter(A, { niveau: 'un peu', duree: 60 }, 9, true).legere, L.adapter(A, { niveau: 'un peu', duree: 60 }, 9).legere], [false, true, false], 'semaine légère : jamais pendant la découverte');

// ── Progrès ──
egal(L.valeur({ c: 30, r: 10 }), 40, 'valeur : Epley');
egal(L.records({ exos: [{ nom: 'Tirage vertical prise large', series: [{ c: 37.5, r: 10 }] }, { nom: 'Leg curl assis', series: [{ c: 20, r: 14 }] }, { nom: 'Nouveau', series: [{ c: 10, r: 10 }] }] }, hist), ['Tirage vertical prise large'], 'records : mieux qu\'avant seulement, pas le premier essai');

// ── Régularité ──
const sem = [S('2026-11-02', 'A'), S('2026-11-04', 'B'), S('2026-11-09', 'A'), S('2026-11-12', 'B'), S('2026-11-14', 'A'), S('2026-11-16', 'B')];
egal([L.cetteSemaine(sem, '2026-11-15'), L.cetteSemaine(sem, '2026-11-17'), L.cetteSemaine(sem, '2026-11-25')], [3, 1, 0], 'cetteSemaine');
// 13/11, demandé par demande : une décision (« Aujourd'hui : séance / repos »), plus une suggestion.
const CJ = (ss, d, js) => { const x = L.conseilDuJour(ss, d, js); return (x.repos ? 'R ' : 'S ') + x.texte.split(/[.(]/)[0].trim(); };
egal([CJ([], '2026-11-16'), CJ(sem, '2026-11-16'), CJ(sem, '2026-11-17'), CJ(sem, '2026-11-18'), CJ(sem, '2026-11-23')],
  ['S Aujourd\'hui : séance', 'R Aujourd\'hui : séance faite', 'R Aujourd\'hui : repos', 'S Aujourd\'hui : séance', 'S Aujourd\'hui : séance'], 'conseilDuJour : la décision');
egal([CJ(sem, '2026-11-19', [1, 3, 5]), CJ(sem, '2026-11-20', [1, 3, 5]), CJ(sem, '2026-11-17', [1, 2, 4, 5]), CJ([S('2026-11-09', 'Séance libre')], '2026-11-13', [1, 3, 5])],
  ['R Aujourd\'hui : repos', 'S Aujourd\'hui : séance', 'R Aujourd\'hui : repos', 'S Aujourd\'hui : séance'], 'conseilDuJour : jours de salle (jeudi : repos ; vendredi : séance ; jours qui se suivent : repos le lendemain quand même ; 13/11 réel)'); // 2.3.0 : toujours 48 h entre deux séances [26, 54] (avant : le lendemain permis si deux jours choisis se suivent)
vrai(/Prochaine : demain/.test(L.conseilDuJour(sem, '2026-11-19', [1, 3, 5]).texte) && /Prochaine : mercredi/.test(L.conseilDuJour([S('2026-11-13', 'A')], '2026-11-15', [3]).texte), 'conseilDuJour : un jour de repos dit le prochain jour de salle');

// ── Mesures ──
const mes = '---\nsalle: mesures\n---\n# Mesures\n\n- 2026-11-30 · poids 68,5 kg · épaules 113 cm\n- 2026-11-16 · poids 68 kg\ntexte\n- 2026-12-14 poids: 69 · Epaules : 114,5 cm · poitrine 96\n';
egal(L.lireMesures(mes), [{ date: '2026-11-16', poids: 68 }, { date: '2026-11-30', poids: 68.5, epaules: 113 }, { date: '2026-12-14', poids: 69, epaules: 114.5, poitrine: 96 }], 'lireMesures : triées, écrites à la main');
egal(L.ligneMesure({ date: '2026-11-30', poids: 68.5, epaules: 113 }), '- 2026-11-30 · poids 68,5 kg · épaules 113 cm', 'ligneMesure');
egal(L.lireMesures(L.ligneMesure({ date: '2026-11-30', poids: 68.5, epaules: 113, poitrine: 95 })), [{ date: '2026-11-30', poids: 68.5, epaules: 113, poitrine: 95 }], 'ligneMesure relue');
egal([L.proteines(68), L.proteines(null)], [110, null], 'proteines : 1,6 g par kg, arrondi à 5');

// ── Guide ──
const g = L.lireGuide('---\nsalle: guide\n---\n# Guide\nintro\n## Tirage vertical prise large\n**Geste :** tire la barre.\n- coudes vers le bas\n## Gainage planche\ntexte\n');
egal(Object.keys(g), ['tirage vertical prise large', 'gainage planche'], 'lireGuide : une section par exercice');
egal(g['tirage vertical prise large'].lignes, ['**Geste :** tire la barre.', '- coudes vers le bas'], 'lireGuide : lignes');
// 2.23.0 : le guide est dans le plugin (plus de note dans le coffre) : son programme à lui doit y trouver toutes ses fiches.
{
  const fiches = L.guideDuPlugin();
  const programmeActuel = noteProgramme && L.lireProgramme(noteProgramme).length ? L.lireProgramme(noteProgramme) : prog;
  const sans = [];
  programmeActuel.forEach((s) => s.exos.forEach((e) => { if (!fiches[L.norm(e.nom)] && sans.indexOf(e.nom) < 0) sans.push(e.nom); }));
  avertir(!sans.length, 'Exercices du programme sans fiche dans le guide du plugin : ' + sans.join(', ') + '.');
}
// Le guide livré avec le plugin couvre tout le programme d'origine.
const guideOrigine = GUIDE_DEFAUT;   // 2.29.0 : assemblé depuis commun/exercices/
vrai(guideOrigine !== null && progOrigine.every((s) => s.exos.every((e) => { const f = L.lireGuide(guideOrigine)[L.norm(e.nom)]; return f && f.lignes.join('').length > 100; })),
  'chaque exercice du programme d\'origine a sa fiche dans modeles/Guide des exercices.txt'); // 2.0 (lot E) : programme livré (progOrigine)

// 2.38.81 (demande : « ce qui manque, c'est comment bien faire le geste ») : chaque fiche du guide livré a sa vidéo YouTube.
{
  const fiches = L.guideDuPlugin(), sans = Object.keys(fiches).filter((k) => { const v = L.videoDeFiche(fiches[k].lignes); return !v || !v.id || ['9:16', '1:1', '16:9'].indexOf(v.format) < 0 || !/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(v.url); });
  egal([Object.keys(fiches).length >= 24, sans], [true, []], 'chaque fiche du guide livré a une ligne « Vidéo » vers une vidéo YouTube précise (pas une recherche), avec la forme de son image');
}
// 2.38.83 : la ligne « Vidéo » lue pour le lecteur de l'app : l'adresse, l'identifiant, la forme (16:9 sans forme écrite).
egal([L.videoDeFiche(['**Vidéo :** https://www.youtube.com/watch?v=nDh_BlnLCGc · 9:16']), L.videoDeFiche(['**Vidéo :** https://youtu.be/nDh_BlnLCGc']),
  L.videoDeFiche(['**Vidéo :** https://www.youtube.com/results?search_query=presse']), L.videoDeFiche(['**Vidéo :** pas une adresse']), L.videoDeFiche([])],
[{ url: 'https://www.youtube.com/watch?v=nDh_BlnLCGc', id: 'nDh_BlnLCGc', format: '9:16', duree: 0 }, { url: 'https://youtu.be/nDh_BlnLCGc', id: 'nDh_BlnLCGc', format: '16:9', duree: 0 },
  { url: 'https://www.youtube.com/results?search_query=presse', id: null, format: '16:9', duree: 0 }, null, null],
'videoDeFiche : l\'adresse, l\'identifiant YouTube et la forme de l\'image ; une recherche n\'a pas d\'identifiant ; pas d\'adresse : null');
// 2.41.11 : la durée (« · 58 s ») ; chaque vidéo du guide livré a la sienne ; l'adresse reprend à la seconde donnée.
{
  const fiches = L.guideDuPlugin(), sansDuree = Object.keys(fiches).filter((k) => { const v = L.videoDeFiche(fiches[k].lignes); return !v || !(v.duree > 0); });
  egal([L.videoDeFiche(['**Vidéo :** https://www.youtube.com/watch?v=nDh_BlnLCGc · 9:16 · 58 s']).duree, sansDuree, /[?&]start=12\b/.test(adresseLecteur('nDh_BlnLCGc', true, 12.7)), /start=/.test(adresseLecteur('nDh_BlnLCGc', false, 0))],
    [58, [], true, false], 'videoDeFiche : la durée ; chaque vidéo du guide l\'a ; « Avec le son » reprend à la seconde (start=12), du début sans rien');
}

// 2.41.13 (demande : « oui, retire-les ») : plus de photos dans le plugin ; chaque exercice du programme d'origine a sa vidéo.
vrai(progOrigine.every((x) => x.exos.every((e) => { const f = L.guideDuPlugin()[L.norm(e.nom)]; const v = f && L.videoDeFiche(f.lignes); return !!(v && v.id); })) && !Object.keys(PHOTOS).length && !Object.keys(IMAGES).length,
  'chaque exercice du programme a sa vidéo ; plus aucune photo dans le plugin');

// ── Jours de salle et prochaines séances ──
egal([L.joursConseilles({ parSemaine: 2 }), L.joursConseilles({ parSemaine: 3 }), L.joursConseilles({ parSemaine: 4 }), L.joursConseilles(null), L.joursConseilles({ parSemaine: 3, jours: [6, 2] }), L.joursConseilles({ parSemaine: 3, jours: [] })],
  [[1, 4], [1, 3, 5], [1, 3, 5], [1, 3, 5], [2, 6], [1, 3, 5]], 'joursConseilles : modèle selon le nombre, ou les jours choisis'); // 2.3.0 : plus de modèle à 4 (lundi-mardi, jeudi-vendredi) : 48 h entre deux séances [26]
const jourCourt = (iso) => { const d = L.deISO(iso); return `${['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][d.getDay()]} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
const P2 = (d, js, ss) => L.plan(prog, ss, d, js, 3).map((x) => jourCourt(x.date) + ' ' + prog[x.i].nom.slice(-1));
egal(P2('2026-11-10', [1, 3, 5], [S('2026-11-09', 'Séance libre')]), ['mer. 11/11 A', 'ven. 13/11 B', 'lun. 16/11 A'], 'plan : séance lundi, on est mardi → mercredi, vendredi, lundi');
egal(P2('2026-11-11', [1, 3, 5], [S('2026-11-11', 'Séance A')]), ['ven. 13/11 B', 'lun. 16/11 A', 'mer. 18/11 B'], 'plan : séance faite aujourd\'hui → la suivante vendredi');
egal(P2('2026-11-11', [1, 3, 5], [S('2026-11-10', 'Séance A')]), ['ven. 13/11 B', 'lun. 16/11 A', 'mer. 18/11 B'], 'plan : séance hier → repos aujourd\'hui');
egal(P2('2026-11-10', [1, 2, 4, 5], [S('2026-11-09', 'Séance A')]), ['jeu. 12/11 B', 'lun. 16/11 A', 'jeu. 19/11 B'], 'plan : 4 jours qui se suivent → jamais le lendemain d\'une séance, faite ou prévue'); // 2.3.0 : 48 h dans tous les cas [26, 54] (avant : le lendemain permis)
egal([P2('2026-11-11', [1, 3, 5], []), L.plan([], [], '2026-11-11', [1], 3), L.plan(prog, [], '2026-11-11', [], 3)], [['mer. 11/11 A', 'ven. 13/11 B', 'lun. 16/11 A'], [], []], 'plan : aucune séance encore ; pas de programme ; pas de jour');

egal([L.tonnage(s1), L.tonnage({ exos: [] }), L.fmtMilliers(1147), L.fmtMilliers(12500), L.fmtMilliers(950)], [35 * 31 + 67.5, 0, '1 147', '12 500', '950'].map((x) => (typeof x === 'number' ? Math.round(x) : x)), 'tonnage : charge × répétitions ; milliers avec une espace');
egal(L.sections('---\nsalle: club\n---\n# Titre\n\nintro\n\n## Y aller\n- RER A\n\n## Le sac\ntexte\n').map((x) => [x.titre, x.lignes.filter((l) => l.trim())]), [[null, ['intro']], ['Y aller', ['- RER A']], ['Le sac', ['texte']]], 'sections : introduction puis une partie par titre');
egal(L.sections('# Titre\n\n## Seule\nx').map((x) => x.titre), ['Seule'], 'sections : pas d\'introduction vide');
// ── Cardio de fin de séance ──
const avecCardio = L.ecrireSeance({ nom: 'Séance A', date: '2026-11-16', dureeMin: 70, cardioMin: 12.4, exos: [{ nom: 'Curl', series: [{ c: 8, r: 12 }] }] });
vrai(avecCardio.indexOf('\ncardio_min: 12\n---') > 0, 'ecrireSeance : cardio_min dans l\'en-tête');
egal([L.lireSeance(avecCardio).cardioMin, L.lireSeance(texte1).cardioMin, L.ecrireSeance({ nom: 'A', date: '2026-11-16', cardioMin: 0, exos: [] }).indexOf('cardio')], [12, undefined, -1], 'cardio relu ; absent ou 0 : rien');

// ── Remplaçants, machine prise, chrono de l'iPhone ──
egal(L.lireExercice('Tirage · 3 × 10 · ou **Rowing à la machine** / Tractions (Poids du corps) /  ').alternatives, [{ nom: 'Rowing à la machine', corps: false }, { nom: 'Tractions', corps: true }], 'ou X / Y (poids du corps)');
egal([L.lireExercice('Squat · ou ').alternatives, L.lireExercice('Squat · 3 × 10').alternatives, L.lireExercice('Ouverture des hanches · 3 × 10').nom], [undefined, undefined, 'Ouverture des hanches'], 'pas de remplaçant : rien ; un nom qui commence par « ou » reste un nom');
vrai(progOrigine.every((s) => s.exos.every((e) => (e.alternatives || []).every((a) => L.lireGuide(guideOrigine)[L.norm(a.nom)]))), 'chaque remplaçant du programme d\'origine a sa fiche'); // 2.0 (lot E) ; 2.41.13 : plus d'image
const F = (n, k) => ({ series: n, faites: Array.from({ length: k }, () => ({ c: 1, r: 1 })) });
egal([L.suivantPasFini([F(3, 0), F(3, 0), F(3, 0)], 0), L.suivantPasFini([F(3, 0), F(3, 3), F(3, 0)], 0), L.suivantPasFini([F(3, 1), F(3, 3), F(3, 0)], 2), L.suivantPasFini([F(3, 0), F(3, 3), F(3, 3)], 0), L.suivantPasFini([F(3, 0)], 0)],
  [1, 2, 0, -1, -1], 'suivantPasFini : le prochain pas fini, en repartant du début ; jamais celui en cours');
egal(L.urlChrono(119.6, 'Mon Coffre é'), 'shortcuts://x-callback-url/run-shortcut?name=Repos%20salle&input=text&text=120&x-success=obsidian%3A%2F%2Fopen%3Fvault%3DMon%2520Coffre%2520%25C3%25A9&x-cancel=obsidian%3A%2F%2Fopen%3Fvault%3DMon%2520Coffre%2520%25C3%25A9&x-error=obsidian%3A%2F%2Fopen%3Fvault%3DMon%2520Coffre%2520%25C3%25A9', 'urlChrono : le raccourci, les secondes, le retour dans le coffre');

// ── 1.11.0 : icônes et jauge du repos ──
egal([L.icone('accueil'), L.icone('valider'), L.icone('repos'), L.icone('plus'), L.icone('inconnue'), L.icone(''), L.icone(null), L.icone('toString')], ['home', 'check', 'timer', 'plus', '', '', '', ''], 'icone : le nom Lucide, ou rien pour une clé inconnue');
const sourceMain = readFile(FABRIQUE + '/main.js');
const clesUtilisees = [];
(sourceMain.match(/icone(?:\(|: )[^,)}]*/g) || []).forEach((m) => (m.match(/'([a-z]+)'/g) || []).forEach((q) => clesUtilisees.push(q.slice(1, -1))));
vrai(clesUtilisees.length >= 30 && clesUtilisees.every((k) => L.icone(k)), 'chaque icône demandée dans main.js existe dans ICONES');
vrai(['progres', 'guide', 'mesures', 'programme', 'club', 'manger', 'reglages', 'retour', 'annuler', 'repos', 'valider', 'plus', 'moins', 'commencer'].every((k) => /^[a-z0-9-]+$/.test(L.icone(k))), 'les icônes des tuiles et des boutons principaux');
egal([L.fractionRepos(60, 120), L.fractionRepos(120, 120), L.fractionRepos(150, 120), L.fractionRepos(0, 120), L.fractionRepos(-5, 120), L.fractionRepos(30, 0), L.fractionRepos(30, null)], [0.5, 1, 1, 0, 0, 0, 0], 'fractionRepos : entre 0 et 1, jamais d\'erreur');

// ── 1.12.0 (13/11) : familles, séance décidée, dose, échauffement ──
egal(['Tractions', 'Tirage vertical prise large', 'ROWING à la machine', 'Curl à la barre en Z', 'Face pull à la poulie', 'Développé épaules aux haltères', 'Pompes', 'Dips', 'Extension triceps à la poulie', 'Élévations latérales aux haltères',
  'Presse à cuisses', 'Squat', 'Leg curl assis', 'Fentes', 'Mollets debout', 'Gainage planche', 'Étirements'].map(L.famille),
  ['tirer', 'tirer', 'tirer', 'tirer', 'tirer', 'pousser', 'pousser', 'pousser', 'pousser', 'pousser', 'jambes', 'jambes', 'jambes', 'jambes', 'jambes', 'gainage', 'autre'], 'famille : d\'après le nom, accents et majuscules compris ; leg curl = jambes');
egal(progOrigine.map((s) => s.exos.map((e) => L.famille(e.nom)).indexOf('autre')), [-1, -1], 'famille : chaque exercice du programme d\'origine a une vraie famille'); // 2.0 (lot E) : programme livré (progOrigine)
// La vraie séance du 09/11 (copie de la note) : tout en tirage.
const libre0911 = L.lireSeance('---\nsalle: seance\ndate: 2026-11-09\nnom: Séance libre\n---\n# Séance libre · lundi 9 novembre 2026, avec un ami\n\n- Échauffement : 10 min de vélo, niveau 10.\n\n## Tractions\n- 12 rép.\n- 12 rép.\n- 3 rép.\n\n## Tirage vertical prise large\n- 40 kg × 12\n- 40 kg × 12\n- 40 kg × 12\n\n## Rowing à la machine à disques\n- 40 kg × 12\n- 40 kg × 12\n- 40 kg × 12\n\n## Curl à la barre en Z\n- 5 kg × 12\n- 5 kg × 12\n- 5 kg × 12\n');
const progReel = prog; // 2.0 (lot E) : le programme 1.15.0 figé, plus la note du coffre (avant : Programme.md si lisible, sinon prog)
const ch = L.choisirSeance(progReel, [libre0911], '2026-11-13');
// 2.3.0 : toujours l'alternance, une séance libre ne compte pas (avant : après une séance libre récente ou déséquilibrée, la
// séance qui recoupe le moins ; aucune étude pour ces seuils, et à séries égales la fréquence ne change rien [11, 45]).
egal([progReel[ch.i].nom, ch.raison], ['Séance A', 'Première séance du programme : on commence par le début.'], 'choisirSeance : 13/11, après la séance libre de tirage du 09/11 → l\'alternance (Séance A)');
const sA = S('2026-11-11', 'Séance A', prog[0].exos.map((e) => ({ nom: e.nom, series: [{ c: 10, r: 10 }, { c: 10, r: 10 }] })));
egal([L.choisirSeance(prog, [sA], '2026-11-13').i, L.choisirSeance(prog, [sA], '2026-11-13').raison], [1, 'Elle suit « Séance A », faite mercredi.'], 'choisirSeance : alternance simple');
egal(L.choisirSeance(prog, [sA, libre0911].map((x) => x === libre0911 ? Object.assign({}, x, { date: '2026-11-12' }) : x), '2026-11-13').i, 1, 'choisirSeance : séance libre de tirage hier après A → B (l\'alternance)');
egal(L.choisirSeance(prog, [S('2026-11-11', 'Séance B'), Object.assign({}, libre0911, { date: '2026-11-12' })], '2026-11-13').i, 0, 'choisirSeance : après B puis tirage libre → A, l\'alternance'); // 2.3.0 : avant, B encore (elle tirait moins)
egal([L.choisirSeance(prog, [libre0911], '2026-11-14').i, L.choisirSeance(prog, [libre0911], '2026-11-14').raison], [0, 'Première séance du programme : on commence par le début.'], 'choisirSeance : séance libre vieille de plus de 4 jours → l\'alternance');
egal(L.choisirSeance([prog[0]], [libre0911], '2026-11-13'), { i: 0, raison: 'Ton programme a une seule séance.' }, 'choisirSeance : programme à une seule séance');
egal([L.choisirSeance(prog, [], '2026-11-13').i, L.choisirSeance([], [], '2026-11-13').i], [0, -1], 'choisirSeance : aucun historique ; pas de programme');
egal(L.choisirSeance(prog, [S('2026-11-12', 'Séance libre', [{ nom: 'Pompes', series: [{ c: 0, r: 10 }] }, { nom: 'Tractions', series: [{ c: 0, r: 8 }] }, { nom: 'Squat', series: [{ c: 0, r: 10 }] }])], '2026-11-13').i, 0, 'choisirSeance : séance libre équilibrée → égalité → l\'alternance');
egal(L.prochaine(prog, [S('2026-11-09', 'Séance A'), libre0911]), 1, 'prochaine : une séance libre ne casse pas l\'alternance');
egal(L.dansProgramme(prog, libre0911), false, 'une séance libre n\'est pas une séance du programme');
// 2.38.4 (demande : la séance libre compte comme une séance) : elle compte pour les 4 séances de mise en route.
egal([[libre0911, sA, S('2026-11-13', 'Séance B')], [libre0911, sA, S('2026-11-13', 'Séance B'), S('2026-11-16', 'Séance A')]].map((ss) => L.seanceDuJour(prog, ss, { niveau: 'un peu', parSemaine: 3, duree: 60 }, '2026-11-20').decouverte),
  [true, false], 'mise en route : la séance libre compte ; après 4 séances, le programme écrit');
// Dose : montée progressive (13/11, demandé par l'utilisateur)
const R = { niveau: 'un peu', parSemaine: 3, duree: 75 };
egal([0, 3].map((n) => L.adapter(A, R, n).exos.map((e) => e.series)), [[2, 2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2, 2]], 'montée : séances 1 à 4, 2 séries, sans option ni série en plus (1 h 15, « Quelques fois »)');
egal([4, 7].map((n) => L.adapter(A, R, n).exos.map((e) => e.series)), [[4, 4, 4, 3, 3, 2, 2, 2], [4, 4, 4, 3, 3, 2, 2, 2]], 'montée : dès la 5e séance, les réglages (1 h 15 : une série de plus aux 3 premiers)'); // 2.3.0 : plus de « rodage » des séances 5 à 8 (aucune étude)
egal(L.adapter(A, R, 8).exos.map((e) => e.series), [4, 4, 4, 3, 3, 2, 2, 2], 'montée : à partir de la 9e, les réglages (1 h 15 : une série en plus)');
egal(L.adapter(A, { niveau: 'regulier', duree: 75 }, 0).exos.map((e) => e.series), [4, 4, 4, 3, 3, 2, 2, 2], 'montée : « Régulièrement » n\'en a pas');
const sjB = L.seanceDuJour(progReel, [libre0911], R, '2026-11-13');
egal([sjB.nom, sjB.numero, sjB.exos.every((e) => e.series <= 2), sjB.lignes[0]], ['Séance A', 2, true, 'Séance 2 sur 4 de mise en route : 2 séries par exercice.'], 'seanceDuJour : le 13/11, Séance A (l\'alternance), 2e de mise en route (la séance libre du 09/11 compte, 2.38.4)'); // 2.3.0 : l'alternance seule (avant : Séance B)
egal(L.seanceDuJour(prog, [libre0911], R, '2026-11-13', 1).nom, 'Séance B', 'seanceDuJour : « Changer de séance » choisit une autre');
// 2.3.0 : plus de « famille fatiguée » (« Reste léger » après une séance libre ou « dure » de 3 jours ou moins) : aucune
// étude ; seules les courbatures fortes allègent [113], et refaire un muscle courbaturé n'aggrave pas [112].
egal([typeof L.familleFatiguee, typeof L.conseilLeger, L.seanceDuJour(prog, [libre0911], Object.assign({}, R, { niveau: 'regulier' }), '2026-11-12').exos.map((e) => e.series), L.seanceDuJour(prog, [libre0911], Object.assign({}, R, { niveau: 'regulier' }), '2026-11-12').lignes],
  ['undefined', 'undefined', [4, 4, 4, 3, 3, 2, 2, 2], []], 'seanceDuJour : la séance libre de tirage de lundi ne change rien mercredi');
// Échauffement
const nv = L.nouvelleSeance(sjB, '2026-11-13', 0);
egal([nv.exos.length, nv.exos[0].nom, nv.exos[0].echauffement, nv.courant, nv.exos.findIndex((e) => e.approches && e.approches.length)], [sjB.exos.length + 1, 'Échauffement', true, 0, 1], 'nouvelleSeance : l\'échauffement en premier, la série d\'échauffement sur le premier exercice avec charge'); // 2.0 (lot A-séance) : la série d'échauffement devient les séries d'approche (exo.approches)
egal(L.nouvelleSeance({ nom: 'X', exos: [planche, { nom: 'Pompes', corps: true, series: 3, unite: 'reps' }, tirage] }, '2026-11-13', 0).exos.findIndex((e) => e.approches && e.approches.length), 3, 'nouvelleSeance : ni le gainage ni le poids du corps n\'ont la série d\'échauffement'); // 2.0 (lot A-séance) : echauffeSerie → approches
egal(L.suivantPasFini([Object.assign(L.exoEchauffement(), {}), F(3, 3), F(3, 0)], 2), -1, 'suivantPasFini : l\'échauffement n\'est jamais choisi tout seul');
const avecEch = L.ecrireSeance({ nom: 'Séance B', date: '2026-11-13', exos: [{ nom: 'Développé épaules aux haltères', series: [{ c: 8, r: 10 }] }], echauffement: { min: 5, serie: { c: 17.5, r: 10 } } });
vrai(avecEch.indexOf('# Séance B · vendredi 13 novembre 2026\n\nÉchauffement : 5 min, puis 10 × 17,5 kg\n\n## Développé') > 0, 'ecrireSeance : l\'échauffement en une ligne sous le titre');
egal(L.lireSeance(avecEch).exos, [{ nom: 'Développé épaules aux haltères', series: [{ c: 8, r: 10 }] }], 'lireSeance : l\'échauffement n\'est pas un exercice en plus');
egal([L.records(L.lireSeance(avecEch), [S('2026-11-11', 'Séance B', [{ nom: 'Développé épaules aux haltères', series: [{ c: 8, r: 10 }] }])])], [[]], 'records : l\'échauffement n\'y est pas');
egal([L.ligneEchauffement({ min: 5, serie: null }), L.ligneEchauffement({ min: 0, serie: { c: null, r: 10 } }), L.ligneEchauffement(null)], ['Échauffement : 5 min', 'Échauffement : 10 répétitions très légères', ''], 'ligneEchauffement');
// Séance en cours enregistrée par la 1.11.0 (sans l'échauffement en exercice) : reprise telle quelle.
const ancien = { nom: 'Séance A', date: '2026-11-12', debut: 1, decouverte: false, legere: false, courant: 1, reposFin: 0, echauffe: true, exos: L.adapter(A, R, 9).exos.map((x, i) => Object.assign({}, x, { faites: i === 0 ? [{ c: 35, r: 10 }] : [] })) };
vrai(SallePlugin.verifierEnCours(ancien) === ancien && SallePlugin.verifierEnCours(nv) === nv, 'verifierEnCours : une séance en cours de la 1.11.0 et une de la 1.12.0 sont acceptées');

// ── 1.13.0 : le bilan avant la séance ──
const ZD = ['epaule', 'coude', 'poignet', 'bas du dos', 'genou', 'bras', 'epaules', 'pectoraux', 'dos', 'jambes'];
const zonesDe = (nom) => ZD.filter((z) => L.zoneTouche(z, nom));
const tousNoms = [];
progOrigine.forEach((s) => s.exos.forEach((e) => [e.nom].concat((e.alternatives || []).map((x) => x.nom)).forEach((n) => { if (tousNoms.indexOf(n) < 0) tousNoms.push(n); }))); // 2.0 (lot E) : programme livré (progOrigine)
const TABLE = {
  'Tirage vertical prise large': ['epaule', 'coude', 'epaules', 'bras', 'dos'], 'Tractions': ['epaule', 'coude', 'epaules', 'bras', 'dos'],
  'Développé assis à la machine': ['epaule', 'epaules', 'pectoraux'], 'Développé couché aux haltères': ['epaule', 'poignet', 'epaules', 'pectoraux'],
  'Presse à cuisses': ['bas du dos', 'genou', 'jambes'], 'Tirage horizontal à la poulie': ['coude', 'bas du dos', 'bras', 'dos'],
  'Rowing à la machine à disques': ['coude', 'bas du dos', 'bras', 'dos'], 'Élévations latérales aux haltères': ['epaule', 'epaules', 'pectoraux'],
  'Leg curl assis': ['genou', 'jambes'], 'Leg curl allongé': ['genou', 'jambes'], 'Curl aux haltères': ['coude', 'poignet', 'bras', 'dos'],
  'Curl à la barre en Z': ['coude', 'poignet', 'bras', 'dos'], 'Gainage planche': ['bas du dos'],
  'Développé épaules aux haltères': ['epaule', 'poignet', 'epaules', 'pectoraux'], 'Développé épaules à la machine': ['epaule', 'epaules', 'pectoraux'],
  'Tirage vertical prise neutre': ['epaule', 'coude', 'epaules', 'bras', 'dos'], 'Développé incliné aux haltères': ['epaule', 'poignet', 'epaules', 'pectoraux'],
  'Développé incliné à la machine': ['epaule', 'epaules', 'pectoraux'], 'Face pull à la poulie': ['epaule', 'coude', 'epaules', 'bras', 'dos'],
  'Extension triceps à la poulie': ['coude', 'poignet', 'bras', 'pectoraux'],
  'Extension triceps au-dessus de la tête à la poulie': ['coude', 'poignet', 'bras', 'pectoraux'], // 2.0 (lot E) : le nouvel exercice de B
  'Hip thrust à la barre': ['bas du dos', 'jambes'], 'Crunch à la poulie haute': ['bas du dos'],   // 2.32.0
  'Élévations latérales à la machine': ['epaule', 'epaules', 'pectoraux'],   // 2.38.67
  'Élévations latérales à la poulie': ['epaule', 'epaules', 'pectoraux'],   // 2.40.8 : le remplaçant de la machine en B
};
egal(tousNoms.length, 16, 'zones : les 11 exercices du programme et leurs 5 remplaçants');
tousNoms.forEach((n) => egal(zonesDe(n), (TABLE[n] || []).filter((z) => true).sort((x, y) => ZD.indexOf(x) - ZD.indexOf(y)), 'zones : ' + n));
egal(ZD.map((z) => L.zoneTouche(z, 'Truc inconnu')).concat([L.zoneTouche('autre', 'Curl aux haltères')]).some(Boolean), false, 'zones : exercice inconnu ou zone « autre » → rien');

const REG = { niveau: 'regulier', parSemaine: 3, duree: 60 };
const BL = (x) => Object.assign({ date: '2026-11-13', douleur: null, courb: { niveau: 'aucune', zones: [] } }, x); // 2.1.2 : le bilan n'a plus de forme
const sjX = (i, b, reg, seances, date) => L.seanceDuJour(prog, seances || [], reg || REG, date || '2026-11-13', i, b);
const noms = (sj) => sj.exos.map((e) => e.nom);
const series = (sj) => sj.exos.map((e) => e.series);
// Sans bilan, ou bilan « tout va bien » : la séance de la 1.12.0
egal([noms(sjX(1, BL())), series(sjX(1, BL())), sjX(1, BL()).changements, sjX(1, BL()).alertes], [noms(sjX(1)), series(sjX(1)), [], []], 'bilan tout va bien : rien ne change');
// Règle 1 : douleur vive
const vc = sjX(1, BL({ douleur: { zone: 'coude', type: 'vive' } }));
egal([noms(vc), vc.changements, vc.alertes], [['Développé épaules aux haltères', 'Développé incliné aux haltères', 'Presse à cuisses', 'Leg curl assis', 'Élévations latérales aux haltères'],
  ['Tirage vertical, face pull, extension triceps : retirés, douleur vive au coude.'], ['Pas d\'exercice qui charge ton coude aujourd\'hui.', 'Si ça dure plus d\'une semaine ou empire : médecin ou kiné.']], 'douleur vive au coude : exercices retirés, renvoi médecin ou kiné'); // 2.5.1 : texte raccourci (le renvoi au médecin sur sa ligne)
const vp = sjX(0, BL({ douleur: { zone: 'poignet', type: 'vive' } }));
egal([noms(vp).indexOf('Curl aux haltères'), vp.exos.find((e) => e.nom === 'Développé assis à la machine').alternatives], [-1, undefined], 'douleur vive au poignet : curl retiré, et le remplaçant aux haltères du développé aussi');
egal([noms(sjX(0, BL({ douleur: { zone: 'autre', type: 'vive' } }))), sjX(0, BL({ douleur: { zone: 'autre', type: 'vive' } })).alertes.length], [noms(sjX(0)), 2], 'douleur vive « autre » : rien retiré, le conseil reste'); // 2.5.1 : texte raccourci (le conseil, puis le renvoi au médecin)
// Règle 2 : courbatures fortes
const fb = sjX(1, BL({ courb: { niveau: 'fortes', zones: ['bras'] } }));
egal([series(fb), fb.exos.filter((e) => e.courb).map((e) => e.nom), fb.changements, fb.alertes],
  [[3, 2, 3, 3, 3, 3, 2], ['Tirage vertical prise neutre', 'Face pull à la poulie'], ['Tirage vertical, face pull : 2 séries, léger : courbatures aux bras.', 'Extension triceps : retiré (en option).'],
    ['Urine foncée, ou muscle gonflé et dur : médecin le jour même.']], 'courbatures fortes aux bras : 2 séries, léger, option retirée, alerte une fois'); // 2.1.2 : plus de « repos aujourd'hui » si les bras ne se tendent pas à fond (c'est la définition de « fortes » : 2 séries, un tiers plus léger, « La bonne séance », Courbatures)
// 2.40.9 (simulations) : courbatures à 5 endroits sur 8 exercices : la ligne tiendrait sur plus de 2 lignes ; les endroits passent
// dans « Pourquoi ».
{
  const prog = L.lireProgramme(PROGRAMME_DEFAUT);
  const sj = { exos: prog[1].exos.map((x) => Object.assign({}, x)), changements: [], alertes: [] };
  L.appliquerBilan(sj, { courb: { niveau: 'fortes', zones: ['bras', 'epaules', 'pectoraux', 'dos', 'jambes'] } });
  const l = sj.changements.find((x) => /courbatures/.test(x)) || '';
  // Les lignes « Lesquels » et « Pourquoi » sont repliées (TITRES_REPLIABLES) : seule la première se lit d'office.
  egal([l.split('\n')[0].length <= L.LIGNE_MAX, /\nPourquoi : courbatures aux bras/.test(l)], [true, true], 'bilan : courbatures partout, la ligne visible tient en 2 lignes, les endroits dans « Pourquoi »');
}
egal(sjX(0, BL({ courb: { niveau: 'fortes', zones: ['jambes', 'dos'] } })).alertes, ['Urine foncée, ou muscle gonflé et dur : médecin le jour même.'], 'courbatures fortes sur deux zones : l\'alerte une seule fois');
const tn = fb.exos[1];
egal([L.conseil(tn, { date: 'x', series: [{ c: 40, r: 12 }, { c: 40, r: 12 }] }).charge, L.conseil(tn, { date: 'x', series: [{ c: 40, r: 12 }] }).valeur, L.conseil(Object.assign({}, tn, { depart: L.chargeDepart(tn, 70) }), null).charge, L.conseil(tn, { date: 'x', series: [{ c: 40, r: 12 }] }).monte],
  [27.5, 8, 27.5, undefined], 'courbatures fortes : un tiers de moins arrondi au pas (40 → 27,5), le bas de la fourchette, pas de montée');
// Règle 3 : douleur qui tire ; courbatures légères
const dt = sjX(1, BL({ douleur: { zone: 'coude', type: 'tire' } }));
egal([series(dt), dt.exos.some((e) => e.echauffePlus), dt.changements, dt.alertes], [series(sjX(1)), false, [], []], 'douleur qui tire : séance normale, rien en plus'); // 2.3.0 : plus d'approche très légère en plus (aucune étude ; la note ne fait arrêter que pour une douleur dans une articulation ou qui pique, la douleur vive)
const lb = sjX(1, BL({ courb: { niveau: 'legeres', zones: ['bras'] } }));
egal([series(lb), lb.exos.some((e) => e.echauffePlus), lb.changements, lb.alertes], [series(sjX(1)), false, [], []], 'courbatures légères (ancienne ligne du carnet) : séance normale, rien en plus'); // 2.1.2 : « Courbatures légères : séance normale » (La bonne séance, Courbatures) ; avant : une approche très légère en plus
// Règle 4 : nuit de moins de 6 h (pas de montée : exo.sansMontee)
const curlF = Object.assign({}, curlJ, { sansMontee: true });
const der15 = { date: 'x', series: [{ c: 40, r: 15 }, { c: 40, r: 15 }, { c: 40, r: 15 }] };   // 2.37.0 : à 40 kg, le cran du dessus (6 %) se prend
egal([L.conseil(curlF, der15).charge, L.conseil(curlJ, der15).charge, L.conseil(curlF, { date: 'x', series: [{ c: 20, r: 12 }] }).charge], [40, 42.5, 20], 'sans montée : la charge gardée, sinon le conseil habituel'); // 2.1.2 : exo.sansMontee ne vient plus que de la nuit courte (avant : « fatigué »)
// Cumul (et montée progressive de la 1.12.0)
const cu = sjX(1, BL({ courb: { niveau: 'fortes', zones: ['bras'] }, douleur: { zone: 'coude', type: 'tire' }, sommeil: 'court' }));
egal([noms(cu).length, series(cu), cu.changements.length], [7, [3, 2, 3, 3, 3, 3, 2], 3], 'cumul : courbatures fortes aux bras + qui tire au coude + nuit courte'); // 2.3.0 : la douleur qui tire n'ajoute jamais rien // 2.1.2 : plus de temps ni de « fatigué » dans le bilan ; la nuit courte garde toutes les séries, l'option part avec les courbatures fortes aux bras ; la douleur qui tire n'ajoute rien sur un exercice déjà léger
const cuM = sjX(1, BL({ courb: { niveau: 'fortes', zones: ['bras'] }, sommeil: 'court' }), { niveau: 'un peu', duree: 60 }); // 2.1.2 : nuit courte à la place de « fatigué »
egal([cuM.decouverte, series(cuM).every((n) => n >= 1 && n <= 2)], [true, true], 'cumul avec la mise en route : jamais sous 1 série');
// Trop vidé : l'autre séance, ou le repos
const bVide = BL({ douleur: { zone: 'epaule', type: 'vive' }, courb: { niveau: 'fortes', zones: ['bras'] } }); // 2.1.2 : l'option part avec les courbatures fortes aux bras (avant : avec un temps de 45 min)
const vide = sjX(1, bVide);
egal([noms(vide), vide.tropVide, L.autreSeance(prog, [], REG, '2026-11-13', bVide, 1)], [['Presse à cuisses', 'Leg curl assis'], true, 0], 'séance trop vidée (moins de 3 exercices) : proposer l\'autre');
egal([sjX(0).tropVide, L.autreSeance([prog[1]], [], REG, '2026-11-13', bVide, 0)], [undefined, -1], 'pas de bilan : pas de drapeau ; aucune autre séance → le repos');
// Choix de la séance selon les zones
const apresB = [S('2026-11-11', 'Séance B', prog[1].exos.map((e) => ({ nom: e.nom, series: [{ c: 10, r: 10 }] })))];
egal([L.seanceDuJour(prog, apresB, REG, '2026-11-13').nom, L.seanceDuJour(prog, apresB, REG, '2026-11-13', null, BL({ courb: { niveau: 'fortes', zones: ['bras'] } })).nom, L.seanceDuJour(prog, apresB, REG, '2026-11-13', null, BL({ courb: { niveau: 'fortes', zones: ['bras'] } })).raison],
  ['Séance A', 'Séance B', 'Courbatures fortes aux bras : « Séance B » les charge le moins.'], 'choix : la séance qui charge le moins la zone, et la raison le dit');
egal([L.seanceDuJour(prog, apresB, REG, '2026-11-13', null, BL({ courb: { niveau: 'legeres', zones: ['bras'] } })).nom, L.seanceDuJour(prog, apresB, REG, '2026-11-13', 0, BL({ courb: { niveau: 'fortes', zones: ['bras'] } })).nom, L.seanceDuJour(prog, apresB, REG, '2026-11-13', null, BL({ courb: { niveau: 'fortes', zones: ['jambes'] } })).nom],
  ['Séance A', 'Séance A', 'Séance A'], 'choix : courbatures légères → l\'alternance ; séance choisie à la main → gardée ; écart trop petit → l\'alternance');

// Le cas réel : le carnet Forme livré, puis « courbatures légères : bras » le 13/11
const carnetTexte = module.exports.FORME_DEFAUT + 'Séance libre du 09/11 avec un ami, tout en tirage.\n\n- 2026-11-10 · courbatures fortes : bras · douleur qui tire : coude\n- 2026-11-11 · courbatures fortes : bras · douleur qui tire : coude\n- 2026-11-12 · courbatures légères : bras · douleur qui tire : coude\n';
const carnet = L.lireForme(carnetTexte);
egal(carnet.map((x) => [x.date, x.courb.niveau, x.courb.zones, x.douleur]), [['2026-11-10', 'fortes', ['bras'], { zone: 'coude', type: 'tire' }], ['2026-11-11', 'fortes', ['bras'], { zone: 'coude', type: 'tire' }], ['2026-11-12', 'legeres', ['bras'], { zone: 'coude', type: 'tire' }]], 'carnet Forme : l\'historique de l\'épisode est lu, le texte libre ignoré');
const def13 = L.bilanParDefaut(carnet, '2026-11-13');
egal([def13.courb, def13.douleur, def13.depuis], [{ niveau: 'aucune', zones: [] }, { zone: 'coude', type: 'tire' }, '2026-11-12'], 'valeurs par défaut : la dernière ligne du carnet (3 jours ou moins)'); // 2.1.2 : les courbatures légères ne sont plus proposées (plus de question), ni la forme ni le temps
egal([L.bilanParDefaut(carnet, '2026-11-16').courb.niveau, L.bilanParDefaut(carnet.slice(0, 1), '2026-11-11').courb.niveau, L.bilanParDefaut(carnet.slice(0, 1), '2026-11-12').courb.niveau, L.bilanParDefaut([], '2026-11-13').depuis],
  ['aucune', 'fortes', 'aucune', null], 'valeurs par défaut : plus de 3 jours → rien ; fortes hier → fortes ; fortes il y a 2 jours → rien ; carnet vide → rien'); // 2.1.2 : fortes il y a 2 jours → rien (avant : légères ; « alléger 1 à 2 jours » [113])
const reel = L.seanceDuJour(progReel, [libre0911], R, '2026-11-13', null, BL({ courb: { niveau: 'legeres', zones: ['bras'] } }));
egal([reel.nom, reel.decouverte, reel.exos.every((e) => e.series === 2), reel.changements, reel.alertes], ['Séance A', true, true, [], []], 'cas réel du 13/11 : Séance A, mise en route à 2 séries, rien de plus'); // 2.1.2 : courbatures légères, séance normale (avant : une approche très légère en plus au tirage). 2.3.0 : l'alternance seule (avant : Séance B, qui tirait moins)
const reel11 = L.seanceDuJour(progReel, [libre0911], R, '2026-11-11', null, BL({ date: '2026-11-11', courb: { niveau: 'fortes', zones: ['bras'] }, douleur: { zone: 'coude', type: 'tire' } }));
egal([reel11.nom, reel11.exos.filter((e) => e.courb).map((e) => e.nom), noms(reel11).indexOf('Extension triceps à la poulie')], ['Séance B', ['Tirage vertical prise neutre', 'Face pull à la poulie'], -1], 'cas réel du 11/11 : Séance B, tirage et face pull légers, extension triceps retirée');

// Écriture et relecture
const b13 = BL({ courb: { niveau: 'fortes', zones: ['bras'] } });
egal(L.ligneForme(b13), '- 2026-11-13 · courbatures fortes : bras · douleur : aucune', 'carnet : la ligne écrite'); // 2.1.2 : plus de forme, et seulement des courbatures fortes
const bComplet = BL({ sommeil: 'court', courb: { niveau: 'fortes', zones: ['bras', 'epaules'] }, douleur: { zone: 'bas du dos', type: 'vive' } });
egal(L.lireForme(L.ligneForme(bComplet))[0], { date: '2026-11-13', douleur: { zone: 'bas du dos', type: 'vive' }, courb: { niveau: 'fortes', zones: ['bras', 'epaules'] }, sommeil: 'court' }, 'carnet : écrire puis relire'); // 2.1.2 : la nuit à la place de la forme
egal([L.lireForme(''), L.lireForme('n\'importe quoi\n- pas de date\n- 2026-13-45 · forme normale\n- 2026-11-13 juste une note'), L.lireForme(null)], [[], [], []], 'carnet absent, vide ou abîmé : rien, sans erreur');
egal([L.bilanDuJour(carnet, '2026-11-12').courb.niveau, L.bilanDuJour(carnet, '2026-11-13')], ['legeres', null], 'bilan déjà rempli aujourd\'hui : repris');
egal([L.toutVaBien(BL()), L.toutVaBien(b13), L.toutVaBien(BL({ courb: { niveau: 'legeres', zones: ['bras'] } }))], [true, false, true], 'toutVaBien : les courbatures fortes comptent, les légères non'); // 2.1.2 : plus de temps ; courbatures légères = séance normale
const noteB = L.ecrireSeance({ nom: 'Séance B', date: '2026-11-13', bilan: bComplet, exos: [{ nom: 'Développé épaules aux haltères', series: [{ c: 8, r: 10 }, { c: 8, r: 9 }], reserve: '1-2' }, { nom: 'Presse à cuisses', series: [{ c: 60, r: 12 }] }] });
vrai(noteB.indexOf('\ndouleur: vive, bas du dos\ncourbatures: fortes, bras, epaules\nsommeil: moins de 6 h\n---') > 0 && noteB.indexOf('- 8 kg × 9\n\nRéserve : 1 ou 2\n\n## Presse') > 0, 'note de séance : le bilan dans l\'en-tête, la réserve sous les séries'); // 2.1.2 : ni forme ni temps_min, la nuit courte
const lu = L.lireSeance(noteB);
egal([lu.bilan, lu.exos.map((e) => [e.series.length, e.reserve])], [bComplet, [[2, '1-2'], [1, undefined]]], 'note de séance : relue (bilan, réserve)'); // 2.1.2 : le bilan sans forme ni temps
egal([L.lireSeance('---\nsalle: seance\ndate: 2026-11-10\nnom: Séance A\n---\n## Presse à cuisses\n- 60 kg × 12\n').bilan, L.lireSeance('---\nsalle: seance\ndate: 2026-11-10\nnom: Séance A\n---\n## Presse à cuisses\n- 60 kg × 12\n').exos[0]], [undefined, { nom: 'Presse à cuisses', series: [{ c: 60, r: 12 }] }], 'anciennes notes : ni bilan ni réserve');

// La réserve
egal(['Réserve : 0 (à fond)', 'Réserve : 1 ou 2', 'reserve: 3 ou plus', 'Réserve : ?'].map(L.lireReserve), ['0', '1-2', '3+', null], 'réserve : lecture');
egal(RESERVES.map(([v]) => L.lireReserve(L.ecrireReserve(v))), ['0', '1-2', '3+'], 'réserve : écrire puis relire');
const D = (series, reserve) => (reserve ? { date: 'x', series, reserve } : { date: 'x', series });
const s3 = (a, b, c) => [{ c: 40, r: a }, { c: 40, r: b }, { c: 40, r: c }];
egal([L.conseil(tirage, D(s3(12, 10, 9), '3+')).charge, L.conseil(tirage, D(s3(12, 10, 9), '3+')).monte, L.conseil(tirage, D(s3(12, 10, 9))).charge, L.conseil(tirage, D(s3(12, 10, 9), '1-2')).charge],
  [42.5, true, 40, 40], 'réserve R1 : « 3 ou plus » et le haut de la fourchette à la 1re série → on monte ; sans réponse ou « 1 ou 2 » → comme avant');
egal(L.conseil(tirage, D(s3(11, 10, 9), '3+')).charge, 40, 'réserve R1 : haut de la fourchette pas atteint → comme avant');
// 2.3.0 : plus de R2 (« à fond deux fois sans gagner → une répétition de moins », aucune étude) : 0 en réserve est permis à la
// dernière série sur machine et poulie [13, 14] ; la cible reste la normale, une répétition de plus.
egal([L.conseil(tirage, D(s3(10, 9, 8), '0'), D(s3(10, 10, 9), '0')).charge, L.conseil(tirage, D(s3(10, 9, 8), '0'), D(s3(10, 10, 9), '0')).valeur], [40, 11], 'réserve 0 deux fois sans gagner : même charge, une répétition de plus, comme d\'habitude');
egal([L.conseil(tirage, D(s3(7, 6, 6), '0'), D(s3(7, 7, 6), '0')).charge, L.conseil(tirage, D(s3(5, 5, 4), '0'), D(s3(7, 7, 6), '0')).charge], [40, 35], 'réserve 0 : un peu sous le bas, la charge est gardée ; nettement dessous, on redescend (2.37.0 : L.plancher)');
const hR = [S('2026-11-09', 'A', [{ nom: 'Tirage vertical prise large', series: [{ c: 40, r: 10 }], reserve: '0' }]), S('2026-11-11', 'B', [{ nom: 'Presse', series: [{ c: 60, r: 10 }] }]), S('2026-11-13', 'A', [{ nom: 'Tirage vertical prise large', series: [{ c: 40, r: 9 }], reserve: '0' }])];
egal([L.derniere(hR, 'Tirage vertical prise large').reserve, L.avantDerniere(hR, 'Tirage vertical prise large').series, L.avantDerniere(hR, 'Presse'), L.avantDerniere([], 'X')], ['0', [{ c: 40, r: 10 }], null, null], 'derniere et avantDerniere : la réserve suit');

// Séance en cours enregistrée par la 1.12.0 (sans bilan ni réserve) : reprise, et conseils inchangés
const en112 = JSON.parse(JSON.stringify(nv));
vrai(SallePlugin.verifierEnCours(en112) === en112 && en112.bilan === undefined && en112.question === undefined, 'séance en cours de la 1.12.0 : acceptée telle quelle');
egal(L.conseil(en112.exos[1], { date: 'x', series: s3(12, 12, 12) }), L.conseil(sjB.exos[0], { date: 'x', series: s3(12, 12, 12) }), 'séance en cours de la 1.12.0 : même conseil qu\'avant');
const nvB = L.nouvelleSeance(fb, '2026-11-13', 0);
vrai(SallePlugin.verifierEnCours(nvB) === nvB && nvB.exos.filter((e) => e.courb).map((e) => e.nom).join(', ') === 'Tirage vertical prise neutre, Face pull à la poulie', 'nouvelleSeance : les consignes du bilan suivent dans la séance en cours'); // 2.3.0 : les courbatures fortes (la douleur qui tire n'ajoute plus rien)
// ── 1.14.0 : où se fait chaque exercice (étage), le réglage du banc, l'ordre qui évite les allers-retours ──
egal(['étage 1', 'Etage 2', 'ÉTAGE 3', '2e étage', '1er étage', 'RDC', 'rdc', 'rez-de-chaussée', 'niveau 1', 'étage', 'étagère', 'repos 2 min'].map((s) => L.lireEtage(s)),
  [1, 2, 3, 2, 1, 0, 0, 0, 1, null, null, null], 'lireEtage : tolérant (accents, majuscules, 2e étage, RDC), rien sinon');
egal(L.lireExercice('Curl · 2 × 10-15 · etage 2').etage, 2, 'champ étage : « etage 2 » sans accent');
egal(L.lireExercice('Gainage planche · 2 × 30-60 s · RDC').etage, 0, 'champ étage : RDC = 0');
egal(L.lireExercice('Presse · 3 × 10').etage, undefined, 'champ étage : facultatif');
const incl = L.lireExercice('Développé incliné aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg · étage 2 · banc 30° (2e ou 3e cran) · ou Développé incliné à la machine');
egal([incl.etage, incl.reglage, incl.pas, incl.repos, incl.alternatives], [2, 'banc 30° (2e ou 3e cran)', 2, 120, [{ nom: 'Développé incliné à la machine', corps: false }]], 'champ banc : relu, les autres champs inchangés');
egal(L.lireExercice('Développé épaules · 3 × 8-12 · dossier presque droit, 80 à 90°').reglage, 'dossier presque droit, 80 à 90°', 'champ dossier : la virgule reste dans le champ');
egal(L.lireExercice('Presse · 3 × 10').reglage, undefined, 'champ banc : facultatif');
const progB = prog.find((s) => s.nom === 'Séance B'), progA = prog.find((s) => s.nom === 'Séance A');
const progBOrigine = progOrigine.find((s) => s.nom === 'Séance B'); // 2.0 (lot E) : programme livré (progOrigine)
egal(progBOrigine.exos.find((e) => /incliné/.test(e.nom)).reglage, 'banc 30° (2e ou 3e cran)', 'PROGRAMME : le réglage du banc incliné (2.38.67 : plus de développé épaules en B, en remplaçant)');
// 2.22.0 : le programme livré n'écrit plus d'étage (c'était ceux de la salle de l'utilisateur) : ils viennent des réglages (L.situer).
vrai(progOrigine.every((s) => s.exos.every((e) => e.etage === undefined)) && progOrigine.every((s) => L.situer(s.exos, { machines: 1, halteres: 2 }).every((e) => e.etage === 1 || e.etage === 2)), 'PROGRAMME_DEFAUT : aucun étage écrit ; les réglages en donnent un à chaque exercice (1 ou 2)'); // 2.0 (lot E) : programme livré
// La ligne de réglage de la carte
const guideTest = L.lireGuide('---\nsalle: guide\n---\n## Presse à cuisses\n**Réglage :** dos et fesses bien collés au siège. Pieds au milieu du plateau.\n## Curl\n**Geste :** plie.\n');
egal(L.texteReglage(incl, guideTest), 'Réglage : banc à 30° (2e ou 3e cran)', 'texteReglage : le champ du programme, « banc à 30° »');
egal(L.texteReglage({ nom: 'Développé épaules', reglage: 'dossier presque droit, 80 à 90°' }, {}), 'Réglage : dossier presque droit, 80 à 90°', 'texteReglage : dossier');
egal(L.texteReglage({ nom: 'Presse à cuisses' }, guideTest), 'Réglage : dos et fesses bien collés au siège', 'texteReglage : sans champ, la première phrase de la fiche du guide');
egal([L.texteReglage({ nom: 'Curl' }, guideTest), L.texteReglage({ nom: 'Inconnu' }, guideTest), L.texteReglage({ nom: 'Presse à cuisses' }, null), L.texteReglage(L.exoEchauffement(), guideTest)], ['', '', '', ''], 'texteReglage : rien sans fiche, sans ligne Réglage, ni pour l\'échauffement');
{
  const fiches = L.guideDuPlugin();   // 2.23.0 : le guide est dans le plugin
  egal(L.texteReglage({ nom: 'Développé incliné aux haltères' }, fiches), 'Réglage : banc incliné à environ 30° (2e ou 3e cran)', 'Guide des exercices.md : la fiche du développé incliné dit aussi 30° (2e ou 3e cran)');
  vrai(/dossier presque droit/.test(L.texteReglage({ nom: 'Développé épaules aux haltères' }, fiches)), 'Guide des exercices.md : la fiche du développé épaules dit aussi dossier presque droit');
}
// Les repères
egal([L.nomEtage(0), L.nomEtage(2), L.nomEtage(undefined)], ['RDC', 'Étage 2', ''], 'nomEtage');
// 2.22.0 : ce qu'on trouve à chaque étage vient des réglages ({ machines, halteres }) ; sans eux, le repère dit seulement l'étage.
const ETAGES_T = { machines: 1, halteres: 2 };
egal([L.repereEtage(1, 2, ETAGES_T), L.repereEtage(2, 1, ETAGES_T), L.repereEtage(1, 0, ETAGES_T), L.repereEtage(1, 1, ETAGES_T), L.repereEtage(undefined, 2, ETAGES_T), L.repereEtage(2, undefined, ETAGES_T), L.repereEtage(1, 2)],
  ['Monte à l\'étage 2 : haltères et bancs', 'Descends à l\'étage 1 : machines et poulies', 'Descends au RDC', '', '', '', 'Monte à l\'étage 2'], 'repereEtage : monter, descendre, rien si même étage ou inconnu');
// L'ordre : la séance B réelle (Programme.md si lisible, sinon le programme d'origine)
const nomsDe = (l) => l.map((e) => e.nom);
const changementsDe = (l) => l.reduce((t, e, i) => t + (i > 0 && l[i - 1].etage !== e.etage ? 1 : 0), 0);
const progBReel = progReel.find((s) => s.nom === 'Séance B') || progB;
const oB = L.ordonnerParEtage(progBReel.exos);
egal(nomsDe(oB.exos), ['Tirage vertical prise neutre', 'Presse à cuisses', 'Leg curl assis', 'Face pull à la poulie', 'Développé épaules aux haltères', 'Développé incliné aux haltères', 'Élévations latérales aux haltères', 'Extension triceps à la poulie'], 'ordre séance B : l\'étage 1 dans l\'ordre du programme, puis l\'étage 2, puis l\'extension triceps qui attend les développés (2.36.0)'); // 2.0 (lot A-séance) : bras et gainage toujours en dernier (l'extension triceps après les développés). Relecture 2.0 (E7) : on redescend à l'étage 1 pour l'extension triceps ; le leg curl et le face pull y vont aussi, les développés passent avant eux
egal([oB.etageEchauffement, oB.changements, changementsDe(oB.exos)], [1, 2, 2], 'ordre séance B : échauffement à l\'étage 1, une seule montée'); // 2.0 (lot A-séance) : l'extension triceps redescend à l'étage 1, en dernier
egal([progBReel.exos.length, oB.exos.length], [progBReel.exos.length, progBReel.exos.length], 'ordre séance B : aucun exercice perdu');
const oA = L.ordonnerParEtage(progA.exos);
egal([nomsDe(oA.exos).slice(-2), oA.changements], [['Curl aux haltères', 'Gainage planche'], 2], 'ordre séance A : les haltères à la fin, une seule montée'); // 2.0 (lot A-séance) : le curl puis le gainage en dernier (redescente à l'étage 1)
// Avec l'échauffement dans la liste, et la séance en cours qui en sort
const nvO = L.nouvelleSeance(L.ordonnerSeance(L.seanceDuJour(progReel, [libre0911], R, '2026-11-13', progReel.indexOf(progBReel))), '2026-11-13', 0);
egal([nvO.exos[0].nom, nvO.exos[0].etage, nvO.exos[1].nom, nvO.exos.findIndex((e) => e.approches && e.approches.length), changementsDe(nvO.exos)], ['Échauffement', 1, 'Tirage vertical prise neutre', 1, 1], 'séance en cours ordonnée : échauffement en premier à l\'étage 1, série d\'échauffement sur le premier exercice fait, une seule montée'); // 2.0 (lot A-séance) : echauffeSerie → approches
egal(L.ordonnerParEtage([{ nom: 'Curl', etage: 2 }, L.exoEchauffement(), { nom: 'Presse', etage: 1 }]).exos.map((e) => e.nom), ['Échauffement', 'Presse', 'Curl'], 'ordonnerParEtage : l\'échauffement toujours en premier');
// Sans étage : l'ordre ne change pas ; un seul étage : gros puis petits ; sans cardio : le plus proche
const sansEtage = [{ nom: 'Curl' }, { nom: 'Développé couché' }, { nom: 'Gainage' }];
egal([nomsDe(L.ordonnerParEtage(sansEtage).exos), L.ordonnerParEtage(sansEtage).etageEchauffement, L.ordonnerParEtage(sansEtage).changements], [['Curl', 'Développé couché', 'Gainage'], null, 0], 'ordre sans étage : l\'ordre du programme, le gainage en dernier (un curl ne gêne pas un développé : il garde sa place, 2.36.0)'); // 2.0 (lot A-séance) : sans étage aussi, bras et gainage en dernier
egal(nomsDe(L.ordonnerSeance({ nom: 'X', exos: sansEtage }).exos), ['Curl', 'Développé couché', 'Gainage'], 'ordonnerSeance sans étage : l\'ordre du programme, le gainage en dernier'); // 2.0 (lot A-séance) : bras et gainage en dernier
egal(L.ordonnerSeance(null), null, 'ordonnerSeance : null → null');
const unSeul = L.ordonnerParEtage([{ nom: 'Élévations latérales', etage: 2 }, { nom: 'Développé épaules', etage: 2 }, { nom: 'Curl', etage: 2 }, { nom: 'Développé incliné', etage: 2 }], [1]);   // le cardio est à l'étage 1 (réglages)
egal([nomsDe(unSeul.exos), unSeul.etageEchauffement, unSeul.changements], [['Élévations latérales', 'Développé épaules', 'Curl', 'Développé incliné'], 1, 1], 'ordre un seul étage (sans cardio) : l\'ordre du programme (2.36.0), échauffement au cardio le plus proche');
egal(nomsDe(L.ordonnerParEtage([{ nom: 'Tirage', etage: 1 }, { nom: 'Curl' }, { nom: 'Élévations', etage: 2 }, { nom: 'Gainage' }]).exos), ['Tirage', 'Curl', 'Élévations', 'Gainage'], 'ordre : un exercice sans étage suit celui d\'avant'); // 2.0 (lot A-séance) : le curl (étage 1 du tirage) et le gainage (étage 2) passent en fin, en partant de l'étage 2
egal(L.ordonnerParEtage([{ nom: 'A', etage: 3 }, { nom: 'B', etage: 2 }], [0]).etageEchauffement, 0, 'ordre : échauffement au seul cardio connu');
// Séance en cours enregistrée par la 1.13.0 (ni étage ni réglage) : reprise sans erreur
const en113 = { nom: 'Séance B', date: '2026-11-13', debut: 0, decouverte: false, legere: false, courant: 3, reposFin: 0, echauffeFin: 0, question: null,
  bilan: { date: '2026-11-13', douleur: null, courb: { niveau: 'aucune', zones: [] }, forme: 'normale', temps: 60 },
  exos: [Object.assign(L.exoEchauffement(), { faites: [{ fait: true }] }), { nom: 'Développé épaules aux haltères', series: 3, min: 8, max: 12, unite: 'reps', repos: 120, pas: 2, option: false, corps: false, alternatives: [{ nom: 'Développé épaules à la machine', corps: false }], echauffeSerie: { faite: true, c: 8, r: 10 }, faites: [{ c: 16, r: 10 }, { c: 16, r: 9 }, { c: 16, r: 8 }], reserve: '1-2' },
    { nom: 'Tirage vertical prise neutre', series: 3, min: 8, max: 12, unite: 'reps', repos: 120, pas: 2.5, option: false, corps: false, faites: [{ c: 40, r: 10 }] },
    { nom: 'Presse à cuisses', series: 3, min: 10, max: 15, unite: 'reps', repos: 120, pas: 5, option: false, corps: false, faites: [] }] };
const en113c = JSON.parse(JSON.stringify(en113));
vrai(SallePlugin.verifierEnCours(en113c) === en113c, 'séance en cours de la 1.13.0 : acceptée telle quelle');
egal(en113c, en113, 'séance en cours de la 1.13.0 : rien n\'est modifié à la reprise (ordre et séries gardés)');
egal(en113c.exos.map((x, i) => i > 0 ? L.repereEtage(en113c.exos[i - 1].etage, x.etage) : '').join(''), '', 'séance en cours de la 1.13.0 : aucun repère d\'étage');
egal([L.texteReglage(en113c.exos[1], guideTest), L.texteReglage(en113c.exos[3], guideTest)], ['', 'Réglage : dos et fesses bien collés au siège'], 'séance en cours de la 1.13.0 : réglage tiré du guide quand il existe');

// ── 1.15.0 (14/11, demandé par l'utilisateur) : bouton « Passer », vélo, record en direct, séries de la semaine ──
{
  const ex = (nom, series, faites, extra) => Object.assign({ nom, series, faites: faites || [], min: 8, max: 12, unite: 'reps', repos: 120, pas: 2.5 }, extra || {});
  const sc = [L.exoEchauffement(), ex('Presse à cuisses', 2), ex('Face pull à la poulie', 2), ex('Leg curl assis', 2, [{ c: 25, r: 10 }, { c: 25, r: 10 }])];
  sc[0].faites = [{ min: 5 }];
  egal([L.fini(sc[1]), L.toutFait(sc)], [false, false], 'passer : un exercice pas fait n\'est pas fini');
  sc[2].saute = { raison: 'temps' };
  egal([L.fini(sc[2]), L.seriesPrevues(sc[2]), L.suivantPasFini(sc, 3)], [true, 0, 1], 'passer : l\'exercice passé compte comme fini, sans série, et n\'est plus proposé');
  sc[1].faites = [{ c: 60, r: 10 }, { c: 60, r: 10 }];
  egal(L.toutFait(sc), true, 'passer : la séance peut se terminer avec un exercice passé');
  delete sc[2].saute;
  egal([L.toutFait(sc), L.suivantPasFini(sc, 1)], [false, 2], 'passer : « Le refaire » le remet à faire');
  egal(L.lignePasFait([{ nom: 'Face pull à la poulie', raison: 'temps' }, { nom: 'Curl aux haltères' }]), 'Pas fait : Face pull à la poulie (pas le temps), Curl aux haltères', 'ligne « Pas fait »');
  egal(L.lirePasFait('Pas fait : Face pull à la poulie (pas le temps), Curl aux haltères'), [{ nom: 'Face pull à la poulie', raison: 'temps' }, { nom: 'Curl aux haltères' }], 'ligne « Pas fait » relue');
  egal(L.lirePasFait('Face pull : pas fait.'), null, 'une autre phrase n\'est pas une ligne « Pas fait »');
  const note = L.ecrireSeance({ nom: 'Séance B', date: '2026-11-14', veloNiveau: 9, pasFait: [{ nom: 'Face pull à la poulie', raison: 'temps' }], exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 10 }] }] });
  const relue = L.lireSeance(note);
  egal([relue.exos.map((e) => e.nom), relue.pasFait, relue.veloNiveau], [['Presse à cuisses'], [{ nom: 'Face pull à la poulie', raison: 'temps' }], 9], 'note de séance : « Pas fait » et velo_niveau relus, sans exercice en plus');
  egal([L.niveauVelo([]), L.niveauVelo([{ veloNiveau: 0 }, relue, { date: 'x', exos: [] }])], [8, 9], 'niveau du vélo : 8 par défaut, sinon le dernier noté');
  const histo = [{ date: '2026-11-13', nom: 'B', exos: [{ nom: 'Presse à cuisses', series: [{ c: 60, r: 10 }] }] }];
  const prog = L.lireProgramme(PROGRAMME_DEFAUT);
  const fp = prog[1].exos.find((x) => x.nom === 'Face pull à la poulie') || ex('Face pull à la poulie', 2, [], { etage: 1 });
  const r1 = L.remplacants(Object.assign({}, fp, { alternatives: [{ nom: 'Oiseau aux haltères' }] }), prog, ['Échauffement', 'Face pull à la poulie', 'Tirage vertical prise neutre']);
  vrai(r1.length && r1[0].nom === 'Oiseau aux haltères' && r1.every((a) => L.famille(a.nom) === 'tirer' || a.nom === 'Oiseau aux haltères') && !r1.some((a) => a.nom === 'Tirage vertical prise neutre'), 'remplaçants : la variante d\'abord, puis la même famille, sans ce qui est déjà dans la séance');
  egal(L.remplacants(ex('Gainage planche', 2), [], []), [], 'remplaçants : rien à proposer → liste vide');
  const ancienne = { nom: 'Séance B', date: '2026-11-14', exos: [L.exoEchauffement(), ex('Presse à cuisses', 2)] };
  vrai(!!module.exports.verifierEnCours(ancienne) && L.toutFait(ancienne.exos) === false, 'une séance en cours de la 1.14.0 se reprend');
}

// ── 2.38.85 (demande : à côté de la date, dire si la version est à jour) : la version publiée ──
// 2.38.88 (demande : « ça affichait à jour mais il n'était pas à jour ») : la dernière publication d'abord, le manifeste du
// dépôt en secours (5 min de cache).
egal([L.adressesManifestePublie('https://github.com/compte/depot'), L.adressesManifestePublie('https://github.com/compte/depot/'), L.adressesManifestePublie('https://gitlab.com/compte/depot'), L.adressesManifestePublie(undefined)],
  [['https://github.com/compte/depot/releases/latest/download/manifest.json', 'https://raw.githubusercontent.com/compte/depot/HEAD/manifest.json'],
    ['https://github.com/compte/depot/releases/latest/download/manifest.json', 'https://raw.githubusercontent.com/compte/depot/HEAD/manifest.json'], [], []],
  'adressesManifestePublie : la dernière publication, puis le manifeste du dépôt ; autre chose qu\'un dépôt GitHub : rien');
egal([L.comparerVersions('2.38.84', '2.38.85'), L.comparerVersions('2.38.85', '2.38.85'), L.comparerVersions('2.39.0', '2.38.85'), L.comparerVersions('2.38.9', '2.38.10'), L.comparerVersions('2.38', '2.38.0'), L.comparerVersions('2.x', '2.38.85'), L.comparerVersions(null, '1')],
  [-1, 0, 1, -1, 0, null, null], 'comparerVersions : chiffre par chiffre (2.38.9 avant 2.38.10) ; illisible : null');
egal([L.etatVersion('2.38.84', '2.38.85'), L.etatVersion('2.38.85', '2.38.85'), L.etatVersion('2.38.86', '2.38.85'), L.etatVersion('2.38.85', null)],
  ['en-retard', 'a-jour', 'a-jour', null], 'etatVersion : plus ancienne = en retard ; la même ou plus récente (le coffre de l\'atelier) = à jour ; pas su : null');

// 2.40.9 (simulations) : « Nom : record » trop long pour 2 lignes : le nom court.
egal([L.nomEtTexte('Extension triceps au-dessus de la tête à la poulie', 'Record : 15 répétitions à 7,5 kg, avant 14'), L.nomEtTexte('Curl à la barre en Z', 'Record : 12 répétitions'),
  L.nomPour('Extension triceps au-dessus de la tête à la poulie', 'Record : 19 répétitions à 7,5 kg, avant 14')],
  ['Extension triceps au-dessus : Record : 15 répétitions à 7,5 kg, avant 14', 'Curl à la barre en Z : Record : 12 répétitions', 'Extension triceps au-dessus'],
  'nomEtTexte, nomPour : le nom entier s\'il tient en 2 lignes, sinon le nom court');

