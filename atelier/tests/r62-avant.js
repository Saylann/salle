// Les rendus d'« Avant de commencer », de « Ta séance d'aujourd'hui » et de « Pour te lancer » (src/62-avant.js).
// Une règle = un test. Aides : tests/aides-ecrans.js.

// ───────────────────────── Avant de commencer ─────────────────────────

// 2.1.2 (15/11, « base-toi uniquement sur les études ») : seulement ce que « La bonne séance » justifie : la douleur, les
// courbatures fortes [112, 113], la nuit [120]. Plus de forme, de repas ni de temps.
rendu('avant : les 3 questions des études et le temps du jour (2.38.91), réglées sur « tout va bien » et « Normal » : un seul toucher commence, rien d\'écrit en trop', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC();
  const o = vueC(p, 'avant');
  const questions = parClasse(o, 'salle-question').map((e) => e.textContent);
  const uneFois = o.boutons().filter((b) => b.textContent.indexOf('Tout va bien, commencer') >= 0).length;
  await cliquer(o, 'Tout va bien, commencer');
  egal([questions, uneFois, o.v.ecran, Object.keys(p.donnees.bilan).join()],
    [['Une douleur quelque part ?', 'Des courbatures fortes ? (tu ne tends pas le bras à fond)', 'Ta nuit ?', 'Ton temps aujourd\'hui ?'], 1, 'seance', 'date,douleur,courb'], 'avant : les 3 questions des études et le temps du jour (2.38.91), réglées sur « tout va bien » et « Normal » : un seul toucher commence, rien d\'écrit en trop');
});

// 2.38.91 (demande : « un bouton au même moment que pour les courbatures, pour si on a le temps ») : « Peu de temps » =
// la version 45 min (superséries, toutes les séries gardées, pas de cardio) ; chaque choix dit sa durée ; gardé dans le
// bilan du jour (pas dans le carnet Forme) ; « Tout va bien, commencer » lance la séance raccourcie ; réglages à 45 min : pas de question.
rendu('avant : « Ton temps aujourd\'hui ? » : Peu de temps = superséries, toutes les séries, pas de cardio', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 75 } } });
  const o = vueC(p, 'avant');
  const libelles = o.boutons().map((b) => b.textContent.trim()).filter((t) => /^(Normal|Peu de temps)/.test(t));
  const normale = o.v.seancePreparee(null, null);
  await cliquer(o, libelles[1]);
  const peu = o.v.seancePreparee(null, o.v.formeSaisie);
  const lignes = peu.lignes.join(' ');
  await cliquer(o, 'Tout va bien, commencer');   // la santé va bien : un seul toucher lance la séance raccourcie
  const series = (sj) => sj.exos.filter((x) => !x.echauffement).reduce((t, x) => t + x.series, 0);
  egal([libelles.length, libelles.every((t) => /· \d/.test(t)), peu.superseries, peu.exos.some((x) => x.groupe), peu.duree.cardio, series(peu) <= series(normale),
    lignes.indexOf('Peu de temps : des superséries') >= 0, p.donnees.bilan.temps, o.v.ecran, p.donnees.enCours.bilan.temps, p.donnees.enCours.exos.some((x) => x.groupe)],
  [2, true, true, true, 0, true, true, 45, 'seance', 45, true], 'avant : « Ton temps aujourd\'hui ? » : Peu de temps = superséries, toutes les séries, pas de cardio');
  const p45 = pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 45 } } });
  egal(parClasse(vueC(p45, 'avant'), 'salle-question').map((e) => e.textContent).indexOf('Ton temps aujourd\'hui ?'), -1, 'avant : réglages à 45 min : pas de question du temps');
});

rendu('avant : courbatures fortes : Oui, puis la zone ; Non les retire', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC();
  const o = vueC(p, 'avant');
  const oui = o.boutons().filter((b) => b.textContent === 'Oui')[1];   // le second « Oui » : celui des courbatures
  for (const f of oui.ev.click || []) await f({ target: oui });
  const zones = !!o.bouton('Épaules') && texte(o).indexOf('Où ? Plusieurs choix possibles.') >= 0;
  await cliquer(o, 'Épaules');
  const avecZone = JSON.stringify(o.v.formeSaisie.courb);
  const non = o.boutons().filter((b) => b.textContent === 'Non')[1];
  for (const f of non.ev.click || []) await f({ target: non });
  egal([zones, avecZone, o.v.formeSaisie.courb, texte(o).indexOf('Où ?') < 0, !!o.bouton('Tout va bien, commencer') && o.bouton('Tout va bien, commencer').className.indexOf('salle-principal') >= 0],
    [true, '{"niveau":"fortes","zones":["epaules"]}', { niveau: 'aucune', zones: [] }, true, true], 'avant : courbatures fortes : Oui, puis la zone ; Non les retire');
});

rendu('avant : une nuit de moins de 6 h : pas de record ce jour-là, et le carnet Forme la note', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC();
  const o = vueC(p, 'avant');
  await cliquer(o, 'Moins de 6 h');
  await cliquer(o, 'Valider');
  egal([o.v.ecran, p.donnees.bilan.sommeil, /sommeil : moins de 6 h/.test(p.ecrit[0]), texte(o).indexOf('Nuit de moins de 6 h : mêmes charges que la dernière fois') >= 0],
    ['resume', 'court', true, true], 'avant : une nuit de moins de 6 h : pas de record ce jour-là, et le carnet Forme la note'); // 2.1.2 : la nuit est sa propre question (avant : elle comptait comme « fatigué »)
});

rendu('avant : courbatures fortes d\'hier préremplies d\'après le carnet Forme ; légères : rien de prérempli', async () => {
  simulerDate('2026-11-16T18:00:00');
  const fortes = vueC(pluginC({ etat: { forme: L.lireForme('- 2026-11-15 · courbatures fortes : bras · douleur : aucune\n') } }), 'avant');
  const legeres = vueC(pluginC({ etat: { forme: L.lireForme('- 2026-11-15 · forme normale · courbatures légères : bras · douleur : aucune\n') } }), 'avant');
  egal([fortes.v.formeSaisie.courb, texte(fortes).indexOf('Prérempli d\'après ton carnet Forme') >= 0, legeres.v.formeSaisie.courb, texte(legeres).indexOf('Prérempli') >= 0, !!legeres.bouton('Tout va bien, commencer') && legeres.bouton('Tout va bien, commencer').className.indexOf('salle-principal') >= 0],
    [{ niveau: 'fortes', zones: ['bras'] }, true, { niveau: 'aucune', zones: [] }, false, true], 'avant : courbatures fortes d\'hier préremplies d\'après le carnet Forme ; légères : rien de prérempli'); // 2.1.2 : une ancienne ligne « légères » se lit, sans effet
});

// ───────────────────────── Ta séance d'aujourd'hui ─────────────────────────

rendu('résumé : la durée estimée (modèle 2.0) et les séries légères d\'avant la série 1', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ donnees: { bilan: BILAN_OK('2026-11-16') } }), 'resume', (v) => { v.iPrevu = 1; });
  const li = o.r().tous((e) => e.tagName === 'li');
  egal([parClasse(o, 'salle-meta')[0].textContent, li[0].textContent.trim(), li.filter((e) => /séries? légères? avant/.test(e.textContent)).length, li[li.length - 1].textContent.trim()],
    ['environ 1 h 10 · 8 exercices', 'Échauffement · 5 min de vélo, puis 4 séries légères', 3, 'Cardio tranquille · 5 min de vélo'], 'résumé : la durée estimée (modèle 2.0) et les séries légères (2.10.0 : plus « d\'approche »)');
});

rendu('résumé : à 45 min, les superséries groupées par deux, toutes les séries gardées', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 45 }, bilan: BILAN_OK('2026-11-16') } }), 'resume', (v) => { v.iPrevu = 0; }); // 2.1.2 : 45 min vient des réglages (avant : du bilan)
  const ss = parClasse(o, 'salle-li-superserie');
  const noms = (li) => li.tous((e) => e.className === 'salle-li-texte').map((e) => e.childNodes[0].textContent);
  egal([ss.length, noms(ss[0]), noms(ss[1]), texte(o).indexOf('toutes les séries gardées') >= 0],
    [2, ['Tirage vertical prise large · 3 séries', 'Développé assis à la machine · 3 séries'], ['Presse à cuisses · 3 séries', 'Leg curl assis · 2 séries'], true],
    'résumé : à 45 min, les superséries groupées par deux, toutes les séries gardées');
});

rendu('résumé : chaque changement du bilan en une ligne', async () => {
  simulerDate('2026-11-16T18:00:00');
  const b = Object.assign(BILAN_OK('2026-11-16'), { sommeil: 'court', courb: { niveau: 'fortes', zones: ['bras'] } }); // 2.1.2 : la nuit et les courbatures (avant : « fatigué »)
  const o = vueC(pluginC({ donnees: { bilan: b } }), 'resume');
  const sj = o.v.seancePreparee(null, b);
  const doses = parClasse(o, 'salle-dose').map((e) => e.textContent);
  egal([sj.changements.length > 0, sj.changements.every((t) => doses.filter((d) => d === t).length === 1), doses.indexOf('Rien à changer : la séance prévue.')],
    [true, true, -1], 'résumé : chaque changement du bilan en une ligne');
});

rendu('ouvrirSeanceDuJour : séance en cours → séance ; bilan du jour → résumé ; sinon → avant de commencer', async () => {
  simulerDate('2026-11-16T18:00:00');
  const ecranApres = (p) => { const v = nouvelleVue(p); v.ecran = 'accueil'; v.ouvrirSeanceDuJour(); return v.ecran; };
  const enCours = pluginC();
  enCours.donnees.enCours = L.nouvelleSeance(L.seanceDuJour(P115, [], enCours.donnees.reglages, '2026-11-16'), '2026-11-16', Date.now());
  egal([ecranApres(enCours), ecranApres(pluginC({ donnees: { bilan: BILAN_OK('2026-11-16') } })), ecranApres(pluginC())], ['seance', 'resume', 'avant'],
    'ouvrirSeanceDuJour : séance en cours → séance ; bilan du jour → résumé ; sinon → avant de commencer');
});

rendu('commencer : un toucher réveille le son (plugin.preparerSon), la séance garde le bilan', async () => {
  simulerDate('2026-11-16T18:00:00');
  const b = BILAN_OK('2026-11-16');
  const p = pluginC({ donnees: { bilan: b } });
  const o = vueC(p, 'resume');
  await cliquer(o, 'Commencer');
  egal([p.appels.filter((x) => x[0] === 'preparerSon').length, p.donnees.enCours.bilan === b, o.v.ecran], [1, true, 'seance'],
    'commencer : un toucher réveille le son (plugin.preparerSon), la séance garde le bilan');
});

// ───────────────────────── « Pour te lancer » ─────────────────────────
// 2.14.2 (changement voulu) : plus de record annoncé d'avance, donc plus de titre « À battre aujourd'hui » ni de ligne en or.

const lignesBoost = (o) => parClasse(o, 'salle-boost-ligne').map((e) => e.textContent.trim());
// 2.5.1 : la partie visible d'une ligne de L.boostAvant (avant « \n » ; « Lesquels » et « Pourquoi » sont repliés dessous).
const visible = (t) => t.split('\n')[0];

rendu('résumé : « Pour te lancer » juste avant « Commencer », les lignes de L.boostAvant', async () => {
  simulerDate('2026-11-18T18:00:00');
  const p = pluginC({ etat: { seances: [S13] }, donnees: { bilan: BILAN_OK('2026-11-18') } });
  const o = vueC(p, 'resume', (v) => { v.iPrevu = 1; });
  const carte = boostDe(o);
  const parent = carte && carte.parent;
  const iCarte = parent ? parent.childNodes.indexOf(carte) : -1;
  const suivant = parent ? parent.childNodes[iCarte + 1] : null;
  const attendu = L.boostAvant(o.v.seancePreparee(1, p.donnees.bilan), p.etat.seances, p.etat.programme, '2026-11-18', reglagesVue(p), p.donnees.bilan);
  egal([!!carte, suivant && suivant.tagName === 'button' && suivant.textContent.indexOf('Commencer') >= 0, parClasse(o, 'salle-boost-titre').map((e) => e.textContent), lignesBoost(o)],
    [true, true, ['Pour te lancer'], attendu.lignes.map((l) => visible(l.texte))], 'résumé : « Pour te lancer » juste avant « Commencer », les lignes de L.boostAvant');
  egal([lignesBoost(o), parClasse(o, 'salle-boost-record').length, parClasse(o, 'salle-boost-avec-record').length, /À battre|ta charge la plus lourde|ton record/.test(texte(o))], [[
    'Première fois pour 5 exercices : 2 séries, sans aller au bout.',   // 2.3.0 [110] ; 2.5.1 : texte raccourci (le point de départ replié)
  ], 0, 0, false], 'résumé : l\'exemple du 18/11 : la première fois seulement ; aucun record annoncé (développé épaules et presse étaient « à portée »)');
});

rendu('résumé : nuit courte : une seule ligne calme, sans rien « à battre »', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13] }, donnees: { bilan: Object.assign(BILAN_OK('2026-11-18'), { sommeil: 'court' }) } }), 'resume', (v) => { v.iPrevu = 1; }); // 2.1.2 : la nuit courte (avant : « fatigué »)
  egal([parClasse(o, 'salle-boost-titre').map((e) => e.textContent), lignesBoost(o), parClasse(o, 'salle-boost-record').length, texte(o).indexOf('À battre') >= 0],
    [['Pour te lancer'], ['Aujourd\'hui, on garde tes charges : ça compte aussi.'], 0, false], 'résumé : nuit courte : une seule ligne calme, sans rien « à battre »');
});

rendu('résumé : un calcul de « Pour te lancer » qui échoue : pas de carte, « Commencer » reste', async () => {
  simulerDate('2026-11-18T18:00:00');
  const vraie = L.boostAvant;
  L.boostAvant = () => { throw new Error('donnée inattendue'); };
  let o;
  try { o = vueC(pluginC({ etat: { seances: [S13] }, donnees: { bilan: BILAN_OK('2026-11-18') } }), 'resume', (v) => { v.iPrevu = 1; }); } finally { L.boostAvant = vraie; }
  egal([o.erreur(), !!boostDe(o), parClasse(o, 'salle-alerte').length, !!o.bouton('Commencer'), parClasse(o, 'salle-li-exo').length > 0], [false, false, 0, true, true],
    'résumé : un calcul de « Pour te lancer » qui échoue : pas de carte, « Commencer » reste');
});

// ───────────────────────── Tous ces écrans ─────────────────────────

// 2.0.1 (15/11, vu dans l'aperçu) : « Tout va bien, commencer » lance la séance sans passer par « Ta séance d'aujourd'hui » :
// la carte « Pour te lancer » est donc aussi sur « Avant de commencer », juste au-dessus du grand bouton.
rendu('avant de commencer : « Pour te lancer » juste au-dessus du grand bouton, sans record annoncé', async () => {
  simulerDate('2026-11-18T18:00:00');
  const p = pluginC({ etat: { seances: [S13] } });
  const o = vueC(p, 'avant', (v) => { v.iPrevu = 1; });
  const carte = boostDe(o);
  const parent = carte && carte.parent;
  const suivant = parent ? parent.childNodes[parent.childNodes.indexOf(carte) + 1] : null;
  egal([!!carte, !!suivant && suivant.tagName === 'button' && /commencer/i.test(suivant.textContent), lignesBoost(o).some((t) => /Première fois/.test(t)), lignesBoost(o).some((t) => /Développé épaules : 10 kg/.test(t))],
    [true, true, true, false], 'avant de commencer : « Pour te lancer » juste au-dessus du grand bouton, sans record annoncé');
});

// ── 2.14.5 : après une séance annulée, les questions d'avant se reposent ──
rendu('séance annulée : le bilan du jour ne compte plus, « Avant de commencer » revient ; le remplir le remet', async () => {
  simulerDate('2026-11-18T18:00:00');
  const ligneDuJour = Object.assign(BILAN_OK('2026-11-18'));
  const fait = vueC(pluginC({ etat: { seances: [S13], forme: [ligneDuJour] }, donnees: { bilan: BILAN_OK('2026-11-18') } }), 'accueil');
  fait.v.ouvrirSeanceDuJour();
  const p = pluginC({ etat: { seances: [S13], forme: [ligneDuJour] }, donnees: { bilan: { date: '2026-11-18', aRefaire: true } } });
  const o = vueC(p, 'accueil');
  o.v.ouvrirSeanceDuJour();
  egal([!!fait.v.bilanJour(), fait.v.ecran, o.v.bilanJour(), o.v.ecran], [true, 'resume', null, 'avant'], 'bilan fait : « Ta séance d\'aujourd\'hui » ; à refaire (même avec la ligne du jour dans Forme) : « Avant de commencer »');
  const hier = vueC(pluginC({ etat: { seances: [S13], forme: [ligneDuJour] }, donnees: { bilan: { date: '2026-11-17', aRefaire: true } } }), 'accueil');
  ok(!!hier.v.bilanJour(), 'une annulation de la veille ne compte pas aujourd\'hui');
});
