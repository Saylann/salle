// Les rendus de l'accueil (src/61-accueil.js). Une règle = un test. Aides : tests/aides-ecrans.js.

// ───────────────────────── Accueil ─────────────────────────

rendu('accueil : la séance du jour en grande carte, sa durée et son nombre d\'exercices', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'accueil', (v) => { v.apercu = 1; });
  const carte = parClasse(o, 'salle-du-jour')[0];
  egal([carte && carte.tous((e) => e.tagName === 'h3')[0].textContent, parClasse(o, 'salle-meta')[0].textContent, !!o.bouton('Commencer')],
    ['Séance B', 'environ 1 h 10 · 8 exercices', true], 'accueil : la séance du jour en grande carte, sa durée et son nombre d\'exercices');
  // 2.10.0 : l'étage où commencer, juste avant « Commencer ».
  const depart = L.departEtage(o.v.seancePreparee(null, o.v.bilanJour()).exos);
  egal([/^Commence à l'étage \d/.test(depart), parClasse(o, 'salle-depart').map((e) => e.textContent.trim())], [true, [depart + '.']], 'accueil : l\'étage où commencer');
});

rendu('accueil : plus long que le temps du jour : la durée estimée seule', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'accueil', (v) => { v.apercu = 1; });
  egal([parClasse(o, 'salle-depasse').length, /dépasse/.test(texte(o)), parClasse(o, 'salle-meta').some((e) => /^environ /.test(e.textContent.trim()))],
    [0, false, true], 'accueil : plus long que le temps du jour : la durée estimée seule, aucune phrase en plus'); // 2.36.2 : la ligne « Ça dépasse ton temps du jour » est retirée : la durée est déjà dite, et la séance se fait en entier
});

rendu('accueil, « Ta séance d\'aujourd\'hui » et la séance qui commence : la même séance préparée', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { bilan: BILAN_OK('2026-11-16') } });
  const a = vueC(p, 'accueil', (v) => { v.apercu = 1; });
  const metaAccueil = parClasse(a, 'salle-meta')[0].textContent;
  const r = vueC(p, 'resume', (v) => { v.iPrevu = 1; });
  const metaResume = parClasse(r, 'salle-meta')[0].textContent;
  const sj = r.v.seancePreparee(1, p.donnees.bilan);
  await cliquer(r, 'Commencer');
  const sc = p.donnees.enCours;
  egal([metaAccueil === metaResume, sc.exos.slice(1).map((x) => x.nom).join() === sj.exos.map((x) => x.nom).join(), sc.dureePrevue, sc.version],
    [true, true, sj.duree.totale, 2], 'accueil, « Ta séance d\'aujourd\'hui » et la séance qui commence : la même séance préparée');
});

// 2.10.0 (demande : « quand j'appuie sur Commencer, c'est pour commencer ») : le bilan déjà fait et rien à décider : la séance
// commence tout de suite ; pas de bilan : « Avant de commencer » ; un bilan qui change la séance : « Ta séance d'aujourd'hui ».
rendu('accueil : « Commencer » lance la séance tout de suite quand le bilan du jour est fait et ne change rien', async () => {
  simulerDate('2026-11-16T18:00:00');
  const fait = pluginC({ donnees: { bilan: BILAN_OK('2026-11-16') } });
  const a = vueC(fait, 'accueil');
  await cliquer(a, 'Commencer');
  const sans = vueC(pluginC(), 'accueil');
  await cliquer(sans, 'Commencer');
  const douleur = pluginC({ donnees: { bilan: Object.assign(BILAN_OK('2026-11-16'), { douleur: { zone: 'epaule', type: 'vive' } }) } });
  const d = vueC(douleur, 'accueil');
  const change = d.v.seancePreparee(null, douleur.donnees.bilan).changements.length > 0;
  await cliquer(d, 'Commencer');
  egal([a.v.ecran, !!fait.donnees.enCours, sans.v.ecran, !!sans.v.plugin.donnees.enCours, change, d.v.ecran, !!douleur.donnees.enCours], ['seance', true, 'avant', false, true, 'resume', false],
    'accueil : « Commencer » : la séance, « Avant de commencer », ou « Ta séance d\'aujourd\'hui » si le bilan change quelque chose');
});

rendu('accueil : la semaine en 7 jours (fait, prévu, repos, aujourd\'hui)', async () => {
  simulerDate('2026-11-18T18:00:00');
  const p = pluginC({ etat: { seances: [seanceDuProgramme('2026-11-16', 0)] }, donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, jours: [1, 3, 5] } } });
  const o = vueC(p, 'accueil');
  const jours = parClasse(o, 'salle-jour');
  egal([jours.map((j) => j.className.replace('salle-jour salle-jour-', '').replace(' salle-jour-auj', '')), jours.map((j) => j.className.indexOf('salle-jour-auj') >= 0).indexOf(true), parClasse(o, 'salle-jour-marque').map((m) => m.textContent.trim())],
    [['fait', 'repos', 'prevu', 'repos', 'prevu', 'repos', 'repos'], 2, ['✓', '', 'B', '', 'A', '', '']], 'accueil : la semaine en 7 jours (fait, prévu, repos, aujourd\'hui)');
});

rendu('accueil : « Bon retour » après plus de 4 jours : le mot gentil, sans question ni bouton', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil');
  const carte = parClasse(o, 'salle-bon-retour')[0];
  egal([carte && carte.textContent.trim(), !!carte && carte.tous((e) => e.tagName === 'button').length, parClasse(o, 'salle-decision').length],
    ['Bon retour ! Dernière séance il y a 5 jours.', 0, 0], 'accueil : « Bon retour » après plus de 4 jours : le mot gentil, sans question ni bouton'); // 2.1.2 : plus de « Version 45 min » (avant : un bouton dans la carte ; le test « déjà à 45 min » n'a plus d'objet)
});

rendu('accueil : pas de « Bon retour » à 4 jours', async () => {
  simulerDate('2026-11-17T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil');
  egal([parClasse(o, 'salle-bon-retour').length, texte(o).indexOf('Bon retour') < 0], [0, true], 'accueil : pas de « Bon retour » à 4 jours');
});

// 2.0 (relecture du 14/11, règle de l'utilisateur) : « Pause cette semaine » servait d'excuse pour ne pas y aller. Le bouton et sa
// consigne quittent l'accueil ; la semaine sans salle se prévoit dans Réglages → Salle (même stockage : reglages.pauses).
rendu('accueil : plus de « Pause cette semaine » ni de « Reprendre cette semaine »', async () => {
  simulerDate('2026-11-18T18:00:00');
  const sans = vueC(pluginC({ etat: { seances: [seanceDuProgramme('2026-11-16', 0)] } }), 'accueil');
  const avec = vueC(pluginC({ etat: { seances: [seanceDuProgramme('2026-11-16', 0)] }, donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: ['2026-11-16'] } } }), 'accueil');
  egal([sans, avec].map((o) => [!!o.bouton('Pause'), !!o.bouton('Reprendre cette semaine'), /garde ta série de semaines/.test(texte(o))]), [[false, false, false], [false, false, false]],
    'accueil : plus de « Pause cette semaine » ni de « Reprendre cette semaine »');
});

rendu('accueil : une semaine sans salle prévue se dit en une ligne discrète, sans bouton', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [seanceDuProgramme('2026-11-16', 0)] }, donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: ['2026-11-16'] } } }), 'accueil');
  const sem = parClasse(o, 'salle-carte-semaine')[0];
  egal([parClasse(o, 'salle-pause-ligne').map((e) => e.textContent), sem.tous((e) => e.tagName === 'button').length],
    [['Semaine sans salle : ta série ne casse pas.'], 0], 'accueil : une semaine sans salle prévue se dit en une ligne discrète, sans bouton');
});

// 2.0 (relecture du 14/11) : la série de semaines n'est plus sous la bande des 7 jours (elle aurait été dite deux fois) : elle
// est dans « Tes progrès », à partir de 2 semaines. Sous 2, l'accueil n'en dit rien (ni « cassée », ni « semaine 1 »).
rendu('accueil : la régularité pardonne : jamais « cassée » ; la série dans « Tes progrès » à partir de 2 semaines', async () => {
  simulerDate('2026-11-17T18:00:00');
  const seances = [seanceDuProgramme('2026-11-09', 0), seanceDuProgramme('2026-11-11', 1), seanceDuProgramme('2026-11-16', 0)];
  const o = vueC(pluginC({ etat: { seances } }), 'accueil');
  const ok3 = [0, 2, 4].map((j) => seanceDuProgramme(L.plusJours('2026-11-02', j), j % 4 ? 1 : 0)).concat([0, 2, 4].map((j) => seanceDuProgramme(L.plusJours('2026-11-09', j), j % 4 ? 0 : 1)));
  const o2 = vueC(pluginC({ etat: { seances: ok3 } }), 'accueil');
  const progres = (x) => parClasse(x, 'salle-progres-accueil')[0].textContent;
  egal([/cass/i.test(texte(o)), texte(o).indexOf('Nouvelle série') >= 0, /semaines de suite/.test(progres(o)), progres(o2).indexOf('2 semaines de suite à 3 séances') >= 0, /cass/i.test(texte(o2))],
    [false, false, false, true, false], 'accueil : la régularité pardonne : jamais « cassée » ; la série dans « Tes progrès » à partir de 2 semaines');
});

// 2.0 (relecture du 14/11) : la consigne de la pause part avec son bouton : l'accueil n'a plus de consigne à lire.
rendu('accueil : plus de consigne de la pause (ni carte « Compris »)', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC(), 'accueil');
  egal([parClasse(o, 'salle-consigne').length, !!o.bouton('Compris')], [0, false], 'accueil : plus de consigne de la pause (ni carte « Compris »)');
});

rendu('accueil : la semaine légère proposée, oui d\'un toucher (plugin.choisirSemaineLegere)', async () => {
  simulerDate('2027-04-05T18:00:00');
  const p = pluginC({ etat: { seances: [seanceDuProgramme('2026-11-09', 0)] } });
  const o = vueC(p, 'accueil');
  const propose = texte(o).indexOf('semaines sans semaine légère') >= 0;
  await cliquer(o, 'Oui, cette semaine');
  egal([propose, p.appels.filter((x) => x[0] === 'choisirSemaineLegere')], [true, [['choisirSemaineLegere', '2027-04-05', true]]],
    'accueil : la semaine légère proposée, oui d\'un toucher (plugin.choisirSemaineLegere)');
});

rendu('accueil : une séance en cours se reprend (« Reprendre la séance », pas « Commencer »)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC();
  p.donnees.enCours = L.nouvelleSeance(L.seanceDuJour(P115, [], p.donnees.reglages, '2026-11-16'), '2026-11-16', Date.now());
  const o = vueC(p, 'accueil');
  egal([!!o.bouton('Reprendre la séance'), o.boutons().some((b) => b.textContent.trim() === 'Commencer')], [true, false],
    'accueil : une séance en cours se reprend (« Reprendre la séance », pas « Commencer »)');
});

rendu('accueil : rien ne bloque (réglages vides, séance vide, plugin sans les méthodes 2.0)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = fauxPlugin({ etat: { programme: P115, seances: [{ date: '2026-11-10', nom: 'Séance libre', exos: [] }] }, donnees: { reglages: {} } });
  const o = vueC(p, 'accueil');
  egal([o.erreur(), !!o.bouton('Commencer') || !!o.bouton('Y aller quand même')], [false, true], 'accueil : rien ne bloque (réglages vides, séance vide, plugin sans les méthodes 2.0)');
});

// 2.0 (relecture du 14/11) : la partie qui échoue est maintenant « Tes progrès » (L.regularite n'est plus appelée par la bande
// de la semaine) ; la tuile « Progrès » est devenue cette carte. Même règle : le reste de l'écran s'affiche.
rendu('accueil : une partie qui échoue n\'empêche pas le reste (une petite carte le dit)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const vraie = L.progresAccueil;
  L.progresAccueil = () => { throw new Error('donnée inattendue'); };
  let o;
  try { o = vueC(pluginC(), 'accueil'); } finally { L.progresAccueil = vraie; }
  egal([o.erreur(), !!o.bouton('Commencer'), parClasse(o, 'salle-carte-semaine').length, !!o.bouton('Réglages'), parClasse(o, 'salle-alerte').map((e) => e.textContent)],
    [false, true, 1, true, ['Cette partie n\'a pas pu s\'afficher : donnée inattendue']], 'accueil : une partie qui échoue n\'empêche pas le reste (une petite carte le dit)');
});

rendu('accueil : une ligne de « Tes progrès » qui échoue retire sa ligne, pas la carte', async () => {
  simulerDate('2026-11-16T18:00:00');
  const vraie = L.regularite;
  L.regularite = () => { throw new Error('donnée inattendue'); };
  let o;
  try { o = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil'); } finally { L.regularite = vraie; }
  egal([o.erreur(), parClasse(o, 'salle-alerte').length, parClasse(o, 'salle-progres-accueil').length, !!o.bouton('Commencer')], [false, 0, 1, true],
    'accueil : une ligne de « Tes progrès » qui échoue retire sa ligne, pas la carte');
});

rendu('accueil : la note du programme introuvable : le programme d\'origine, et un bouton pour la recréer', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ etat: { programmeSecours: true, fichiers: {} } }), 'accueil');
  egal([texte(o).indexOf('La note du programme est introuvable.') >= 0, !!o.bouton('Recréer la note du programme'), o.erreur()], [true, true, false],
    'accueil : la note du programme introuvable : le programme d\'origine, et un bouton pour la recréer');
});

// ── « Tes progrès » ──
// Deux séances A (16/11 et 20/11) : le tirage monte de charge, les élévations gagnent des répétitions à charge égale, le
// développé assis baisse (pas montré). On est le 20/11.
const SEANCES_PROGRES = () => [
  seanceNotee('2026-11-16', 'Séance A', [['Tirage vertical prise large', '35×12, 35×10'], ['Développé assis à la machine', '20×10'], ['Élévations latérales aux haltères', '4×15, 4×14']]),
  seanceNotee('2026-11-20', 'Séance A', [['Tirage vertical prise large', '37.5×9, 37.5×8'], ['Développé assis à la machine', '17.5×10'], ['Élévations latérales aux haltères', '4×18, 4×16']]),
];

rendu('accueil : « Tes progrès » juste sous la séance du jour, au-dessus de la semaine', async () => {
  simulerDate('2026-11-20T20:00:00');
  const o = vueC(pluginC({ etat: { seances: SEANCES_PROGRES() } }), 'accueil');
  const cartes = o.r().childNodes.map((e) => e.className || '');
  const iJour = cartes.findIndex((c) => /salle-du-jour/.test(c)), iProg = cartes.findIndex((c) => /salle-progres-accueil/.test(c)), iSem = cartes.findIndex((c) => /salle-carte-semaine/.test(c));
  egal([iJour >= 0, iProg === iJour + 1, iSem === iProg + 1], [true, true, true], 'accueil : « Tes progrès » juste sous la séance du jour, au-dessus de la semaine');
});

rendu('accueil : « Tes progrès » montre ce que calcule L.progresAccueil, jamais une baisse', async () => {
  simulerDate('2026-11-20T20:00:00');
  const p = pluginC({ etat: { seances: SEANCES_PROGRES() } });
  const o = vueC(p, 'accueil');
  const lignes = parClasse(o, 'salle-progres-ligne').map((e) => e.textContent.trim());
  const attendu = L.progresAccueil(p.etat.seances, p.etat.programme, [], '2026-11-20', reglagesVue(p)).lignes.map((l) => l.texte);
  egal([lignes, lignes.length <= 4, lignes.some((t) => /Développé assis/.test(t))],
    [attendu, true, false], 'accueil : « Tes progrès » montre ce que calcule L.progresAccueil, jamais une baisse');
  egal(lignes.slice(0, 2), ['Élévations latérales : 4 kg × 15 → 4 kg × 18', 'Tirage vertical : 35 → 37,5 kg'], 'accueil : « Tes progrès » : les exemples (charge, répétitions à charge égale)');
});

rendu('accueil : un toucher sur « Tes progrès » ouvre l\'écran Progrès', async () => {
  simulerDate('2026-11-20T20:00:00');
  const o = vueC(pluginC({ etat: { seances: SEANCES_PROGRES() } }), 'accueil');
  await cliquer(o, 'Tes progrès');
  egal([o.v.ecran, o.erreur()], ['progres', false], 'accueil : un toucher sur « Tes progrès » ouvre l\'écran Progrès');
});

rendu('accueil : « Tes progrès » sans séance, puis après une seule : une phrase, en gris', async () => {
  simulerDate('2026-11-16T18:00:00');
  const zero = vueC(pluginC(), 'accueil'), une = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil');
  const lire = (o) => [parClasse(o, 'salle-progres-ligne').map((e) => e.textContent.trim()), parClasse(o, 'salle-progres-vide').length];
  egal([lire(zero), lire(une)], [[['Ta prochaine séance sera ton point de départ.'], 1], [['Encore une séance et tu verras tes premiers progrès.'], 1]],
    'accueil : « Tes progrès » sans séance, puis après une seule : une phrase, en gris');
});

rendu('accueil : une séance en cours garde « Tes progrès » dessous', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ etat: { seances: [S13] } });
  p.donnees.enCours = L.nouvelleSeance(L.seanceDuJour(P115, [S13], p.donnees.reglages, '2026-11-16'), '2026-11-16', Date.now());
  const o = vueC(p, 'accueil');
  const cartes = o.r().childNodes.map((e) => e.className || '');
  egal([cartes.findIndex((c) => /salle-vedette/.test(c)) + 1 === cartes.findIndex((c) => /salle-progres-accueil/.test(c)), o.erreur()], [true, false],
    'accueil : une séance en cours garde « Tes progrès » dessous');
});

// ── Pas de repos proposé quand la semaine est en retard (règle de l'utilisateur) ──
// Le cas réel : lundi 09/11 (séance libre) et vendredi 13/11 (B), jours lundi, mercredi, vendredi, 3 par semaine. Dimanche
// 15/11 n'est pas un jour de salle, mais sans séance aujourd'hui la semaine finit à 2 sur 3.
const LIBRE_09 = seanceNotee('2026-11-09', 'Séance libre', [['Tirage vertical prise large', '40×12, 40×12, 40×12']]);

rendu('accueil : semaine en retard un jour de repos : « Aujourd\'hui : séance », « Commencer » en avant, le jour prévu dans la bande', async () => {
  simulerDate('2026-11-15T11:00:00');
  const o = vueC(pluginC({ etat: { seances: [LIBRE_09, S13] }, donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 60, jours: [1, 3, 5] } } }), 'accueil');
  const commencer = o.bouton('Commencer');
  const jours = parClasse(o, 'salle-jour');
  egal([parClasse(o, 'salle-decision').map((e) => e.textContent.trim()), !!commencer && /salle-principal/.test(commencer.className), !o.bouton('Y aller quand même'), /salle-jour-prevu/.test(jours[6].className)],
    [['Aujourd\'hui : séance. Il t\'en manque 1 pour faire tes 3 de la semaine.'], true, true, true],
    'accueil : semaine en retard un jour de repos : « Aujourd\'hui : séance », « Commencer » en avant, le jour prévu dans la bande');
});

rendu('accueil : semaine sans salle prévue, ou objectif tenu : le repos reste un repos', async () => {
  simulerDate('2026-11-15T11:00:00');
  const reg = (plus) => Object.assign({ niveau: 'un peu', parSemaine: 3, duree: 60, jours: [1, 3, 5] }, plus || {});
  const pause = vueC(pluginC({ etat: { seances: [LIBRE_09, S13] }, donnees: { reglages: reg({ pauses: ['2026-11-09'] }) } }), 'accueil');
  const tenu = vueC(pluginC({ etat: { seances: [LIBRE_09, seanceNotee('2026-11-11', 'Séance A', [['Presse à cuisses', '60×10']]), S13] }, donnees: { reglages: reg() } }), 'accueil');
  egal([pause, tenu].map((o) => [!!o.bouton('Y aller quand même'), /Il t'en manque/.test(texte(o))]), [[true, false], [true, false]],
    'accueil : semaine sans salle prévue, ou objectif tenu : le repos reste un repos');
});

// 2.8.0 (changement voulu) : plus de tuile « Débuter » ; ses consignes sont dans la séance, au moment de l'exercice.
rendu('accueil : 5 tuiles, sans « Progrès » (la carte « Tes progrès »), « Manger » (sa carte) ni « Débuter »', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'accueil');
  egal(parClasse(o, 'salle-tuile').map((t) => t.textContent.trim()), ['Comment faire', 'Mesures', 'Programme', 'Ma salle', 'Réglages'],
    'accueil : 5 tuiles, sans « Progrès » (la carte « Tes progrès »), « Manger » (sa carte) ni « Débuter »');
});

// ───────────────────────── Plus de record annoncé avant la séance ─────────────────────────
// 2.14.2 (changement voulu, demande : « 2 records à portée : au contraire, c'est mieux quand il arrive, à la fin de la séance,
// féliciter quand quelque chose a été complété ») : l'accueil n'annonce plus rien ; les succès se disent au bilan.
rendu('accueil : plus d\'annonce « records à portée », même avec des records possibles aujourd\'hui', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil', (v) => { v.apercu = 1; });
  egal([parClasse(o, 'salle-accroche').length, /à portée|À battre/.test(texte(o)), !!boostDe(o), texte(o).indexOf('ta charge la plus lourde') >= 0, parClasse(o, 'salle-du-jour').length, !!o.bouton('Commencer'), o.erreur()],
    [0, false, false, false, 1, true, false], 'accueil : ni « records à portée », ni « À battre », la carte du jour et « Commencer » sont là');
});

// ───────────────────────── Le niveau ─────────────────────────

const blocNiveauDe = (o) => parClasse(o, 'salle-niveau-accueil')[0] || null;
// 2.40.1 : les jauges de « Manger » ont aussi une barre ; ici, seulement celle du niveau.
const pleinsNiveau = (o) => { const b = blocNiveauDe(o); return b ? b.tous((e) => /salle-niveau-plein/.test(e.className || '')).map((e) => e.style.width) : []; };

rendu('accueil : le niveau en tête de « Tes progrès » : « Niveau 1 · Débutant », la barre à n.part, « encore N XP », la phrase', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ etat: { seances: [S13] } });
  const o = vueC(p, 'accueil');
  const n = L.niveau(p.etat.seances, p.etat.programme, reglagesVue(p), '2026-11-16');
  const phrase = L.conseilNiveau(n, o.v.seancePreparee(null, o.v.bilanJour()));
  const bloc = blocNiveauDe(o);
  const carte = parClasse(o, 'salle-progres-accueil')[0];
  egal([!!bloc && bloc.parent === carte, carte && carte.childNodes.indexOf(bloc), parClasse(o, 'salle-niveau-nom').map((e) => e.textContent), parClasse(o, 'salle-niveau-reste').map((e) => e.textContent),
    pleinsNiveau(o), parClasse(o, 'salle-niveau-phrase').map((e) => e.textContent)],
  [true, 1, [`Niveau ${n.niveau} · ${n.titre}`], [`encore ${L.fmtMilliers(n.reste)} XP`], [pcNiveau(n.part)], [phrase]],
  'accueil : le niveau en tête de « Tes progrès » : « Niveau 1 · Débutant », la barre à n.part, « encore N XP », la phrase');
  egal([n.niveau, n.titre, phrase.length > 0, /tu passes niveau 2/.test(phrase), /tu dois|retard/i.test(phrase)], [1, 'Débutant', true, true, false], 'accueil : le niveau : un débutant, une phrase vraie, sans reproche');
});

rendu('accueil : sans séance : Niveau 1, encore 600 XP, barre vide, et combien de séances complètes', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'accueil');
  const sj = o.v.seancePreparee(null, o.v.bilanJour());
  egal([parClasse(o, 'salle-niveau-nom').map((e) => e.textContent), parClasse(o, 'salle-niveau-reste').map((e) => e.textContent), pleinsNiveau(o), parClasse(o, 'salle-niveau-phrase').map((e) => e.textContent)],
    [['Niveau 1 · Débutant'], ['encore 600 XP'], ['0%'], [L.conseilNiveau(L.niveau([], P115, reglagesVue(o.v.plugin), '2026-11-16'), sj)]],
    'accueil : sans séance : Niveau 1, encore 600 XP, barre vide, et combien de séances complètes');
  vrai(/^\d+ séances? complètes? et tu passes niveau 2\.$/.test(parClasse(o, 'salle-niveau-phrase')[0].textContent), 'accueil : sans séance : « N séances complètes et tu passes niveau 2. »');
});

rendu('accueil : le niveau garde la séance du jour en haut et « Tes progrès » juste dessous ; un toucher sur le niveau ouvre Progrès', async () => {
  simulerDate('2026-11-20T20:00:00');
  const o = vueC(pluginC({ etat: { seances: SEANCES_PROGRES() } }), 'accueil');
  const cartes = o.r().childNodes.map((e) => e.className || '');
  const iJour = cartes.findIndex((c) => /salle-du-jour/.test(c));
  egal([iJour >= 0, /salle-progres-accueil/.test(cartes[iJour + 1]), cartes.filter((c) => /salle-niveau/.test(c)).length], [true, true, 0], 'accueil : le niveau est dans « Tes progrès », sous la séance du jour (pas une carte de plus)');
  await cliquer(o, 'Niveau 1');
  egal([o.v.ecran, o.erreur()], ['progres', false], 'accueil : un toucher sur le niveau ouvre Progrès');
});

rendu('accueil : un calcul du niveau qui échoue : pas de niveau, « Tes progrès » et le reste s\'affichent', async () => {
  simulerDate('2026-11-16T18:00:00');
  const vraie = L.niveau, vraieC = L.conseilNiveau;
  L.niveau = () => { throw new Error('donnée inattendue'); };
  let o, o2;
  try { o = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil'); } finally { L.niveau = vraie; }
  L.conseilNiveau = () => { throw new Error('donnée inattendue'); };
  try { o2 = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil'); } finally { L.conseilNiveau = vraieC; }
  egal([o.erreur(), !!blocNiveauDe(o), parClasse(o, 'salle-progres-accueil').length, parClasse(o, 'salle-alerte').length, !!o.bouton('Commencer'), !!o.bouton('Réglages')],
    [false, false, 1, 0, true, true], 'accueil : un calcul du niveau qui échoue : pas de niveau, « Tes progrès » et le reste s\'affichent');
  egal([o2.erreur(), !!blocNiveauDe(o2), parClasse(o2, 'salle-niveau-phrase').length, parClasse(o2, 'salle-alerte').length], [false, true, 0, 0], 'accueil : une phrase du niveau qui échoue : le niveau sans phrase');
});

// 2.4.0 (« Le physique qui plaît », ~/Desktop/CLAUDE/Salle-travail/recherche/La bonne séance.md) : le mètre ruban sur l'accueil, seulement le 1er dimanche
// du mois tant que la taille n'est pas mesurée ce mois-ci ; « Mesurer » ouvre Mesures.
rendu('accueil : le rappel du mètre ruban, le 1er dimanche du mois seulement', async () => {
  simulerDate('2026-12-06T09:00:00');
  const o = vueC(pluginC());
  const ici = parClasse(o, 'salle-rappel-ruban').length;
  await cliquer(o, 'Mesurer');
  const mesure = parClasse(vueC(pluginC({ etat: { mesures: [{ date: '2026-12-01', taille: 82 }] } })), 'salle-rappel-ruban').length;
  simulerDate('2026-12-13T09:00:00');
  egal([ici, o.v.ecran, mesure, parClasse(vueC(pluginC()), 'salle-rappel-ruban').length], [1, 'mesures', 0, 0],
    'accueil : mètre ruban le 06/12 (1er dimanche), pas si la taille est mesurée ce mois-ci, pas le 13/12');
});

// 2.7.0 : la pesée sur l'accueil, en une ligne : le jour où il s'est pesé, la tendance et le conseil ; le dimanche sans
// pesée cette semaine, le rappel et « Peser » (pas le 1er dimanche : la carte du mètre ruban le dit) ; rien les autres jours.
rendu('accueil : la ligne de la pesée, le jour de la pesée seulement', async () => {
  const lignes = (o) => parClasse(o, 'salle-ligne-pesee');
  simulerDate('2026-11-29T09:00:00');
  const plat = [{ date: '2026-11-15', poids: 70 }, { date: '2026-11-22', poids: 70 }, { date: '2026-11-29', poids: 70 }];
  const pese = vueC(pluginC({ etat: { mesures: plat } }));
  const rappel = vueC(pluginC({ etat: { mesures: plat.slice(0, 2) } }));
  const ilYa = lignes(rappel).length;
  await cliquer(rappel, 'Peser');
  const dejaPese = lignes(vueC(pluginC({ etat: { mesures: plat.slice(0, 2).concat([{ date: '2026-11-24', poids: 70 }]) } }))).length;
  simulerDate('2026-11-30T09:00:00');
  const lundi = lignes(vueC(pluginC({ etat: { mesures: plat } }))).length;
  simulerDate('2026-12-06T09:00:00');
  const premierDimanche = [lignes(vueC(pluginC())).length, parClasse(vueC(pluginC()), 'salle-rappel-ruban').length];
  egal([lignes(pese).length, texte(pese).indexOf('sous la cible : ajoute une collation (avis)') >= 0, ilYa, rappel.v.ecran, dejaPese, lundi, premierDimanche],
    [1, true, 1, 'mesures', 0, 0, [0, 1]],
    'accueil : pesée le 29/11 → tendance et collation ; dimanche sans pesée → « Peser » ; déjà pesé, lundi, 1er dimanche (mètre ruban) → rien');
});

// ── 2.15.0 : « Manger » sur l'accueil (demande : « la nourriture est importante : mets le manger sous la semaine, avec les trucs
// les plus importants d'après les études, et qu'on puisse appuyer pour voir plus ») ──
// 2.40.1 (capture : « le truc des jours est devenu moche ») : en 2.40.0, une règle .salle-jour du suivi des repas donnait à
// chaque jour de la semaine une case grise. Les jours de la semaine n'ont qu'une règle à eux, sans fond.
rendu('accueil : la semaine : une seule règle vise .salle-jour, et aucune ne lui donne de fond ni de marge intérieure', async () => {
  const css = readFile(FABRIQUE + '/styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const regles = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) if (m[1].split(',').some((s) => /\.salle-jour(?![\w-])/.test(s))) regles.push(m[2]);
  egal([regles.length, regles.some((d) => /background|padding\s*:/.test(d))], [1, false], 'la semaine : une seule règle .salle-jour, sans fond ni marge intérieure');
});

rendu('accueil : la carte « Manger » sous la semaine, 2 lignes des études, un toucher ouvre la note', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil');
  const carte = parClasse(o, 'salle-manger-accueil')[0];
  const enfants = o.r().childNodes.map((e) => e.className || '');
  const iCarte = enfants.findIndex((c) => /salle-manger-accueil/.test(c));
  const jauges = carte ? carte.tous((e) => /salle-jauge-tete/.test(e.className || '')).map((e) => e.textContent.replace(/\s+/g, ' ').trim()) : [];
  const propre = (e) => e.textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim();
  const dans = (c) => carte ? carte.tous((e) => (' ' + (e.className || '') + ' ').indexOf(' ' + c + ' ') >= 0).map(propre) : [];
  egal([!!carte && carte.tagName, dans('salle-repas-haut'), jauges, dans('salle-echelle-palier').length, dans('salle-repas-ligne'), /salle-tuiles/.test(enfants[iCarte + 1])],
    // 2.20.0 : la dernière ligne dit quand boire (sans repas lisible dans la note : « à chaque repas »).
    // 2.39.7 : un bloc qui se touche (rôle « button »), pour porter « kcal » dans sa ligne de titre.
    // 2.40.1 : les jauges du jour à la place de la ligne des protéines.
    // 2.40.2 (demande : « faire pareil que Tes progrès ») : le creux « Aujourd'hui » (ce qu'il reste, les jauges), puis les
    // lignes à pastille. 2.40.3 : plus d'échelle des 4 repas (il saute parfois le goûter ou le matin).
    // 2.40.5 (« compte en kcal et non en grammes ») : sans taille ni âge, pas de kcal à viser : à droite, le lien « Ta taille et
    // ton âge » ; pas d'attendu en grammes.
    ['div', ['Aujourd\'hui Ta taille et ton âge'], ['Calories 0 kcal', 'Protéines 0 / 110 g'], 0,
      L.mangerEssentiel(reglagesVue(o.v.plugin)).slice(1).map((l) => l.replace(/\*\*/g, '')).concat(['Bois 1 grand verre par repas']), true],
    'la carte : un bloc qui se touche, « Aujourd\'hui » (jauges), le prochain repas et son attendu, puis l\'eau, au-dessus des tuiles');
  // Le lien « Ta taille et ton âge » : Réglages → Appli, sur « Calories du jour » ; il n'ouvre pas aussi la carte.
  const lien = carte.tous((e) => /salle-repas-besoins/.test(e.className || ''))[0];
  let arrete = false;
  for (const f of (lien && lien.ev.click) || []) await f({ target: lien, stopPropagation: () => { arrete = true; } });
  egal([o.v.ecran, o.v.ongletReglages, arrete], ['questions', 'appli', true], 'sans taille ni âge : le lien ouvre Réglages → Appli, sans ouvrir « Manger »');
  const o2 = vueC(pluginC({ etat: { seances: [S13] } }), 'accueil');
  const carte2 = parClasse(o2, 'salle-manger-accueil')[0];
  for (const f of carte2.ev.click || []) await f({ target: carte2 });
  egal([o2.v.ecran, o2.v.noteType], ['note', 'manger'], 'un toucher ouvre la note « Manger »');
});

// ── 2.39.1 (demande : « à la place de la flèche, un truc qui lance directement pour avoir le nombre de kcal ») : « 📷 kcal » ──
rendu('accueil : « kcal » à la place du › de « Manger » ; avec la clé, il ouvre l\'appareil photo, sans clé, les réglages de la clé', async () => {
  simulerDate('2026-11-18T18:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g de protéines.', '', '## Ta journée', '', '- **Matin** : avoine.', ''].join('\n');
  const p = pluginC({ etat: { seances: [S13], textes: { manger: MANGER } } });
  const avantRelais = L.RELAIS_CALORIES;
  L.RELAIS_CALORIES = '';   // 2.39.5 : le cas « sans clé et sans relais »
  const o = vueC(p, 'accueil');
  // 2.39.7 : « kcal » dans la ligne du titre de la carte ; son toucher n'ouvre pas aussi la carte (arrêté).
  const tete = parClasse(o, 'salle-manger-accueil')[0].tous((e) => /salle-progres-tete/.test(e.className || ''))[0];
  const bouton = parClasse(o, 'salle-manger-photo')[0];
  const sansCle = [!!tete && tete.tous((e) => /salle-manger-photo/.test(e.className || '')).length, parClasse(o, 'salle-manger-accueil')[0].tous((e) => /salle-progres-ouvrir/.test(e.className || '')).length,
    bouton && bouton.tagName, bouton && bouton.textContent.trim()];
  let arrete = false;
  for (const f of (bouton && bouton.ev.click) || []) await f({ target: bouton, stopPropagation: () => { arrete = true; } });
  // 2.39.2 : sans clé, Réglages → Appli, sur la clé (la demande de défilement est consommée par allerCarte).
  const apres = [o.v.ecran, o.v.ongletReglages, parClasse(o, 'salle-cle-carte').length, o.v.enVue, arrete];
  // Avec la clé : un <label> qui porte le champ de l'appareil photo (capture : l'appareil photo, pas la photothèque).
  p.cleIA = 'x';
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;   // 2.39.5
  const o2 = vueC(p, 'accueil');
  const b2 = parClasse(o2, 'salle-manger-photo')[0];
  const champ = b2 ? b2.tous((e) => e.tagName === 'input')[0] : null;
  const avecCle = [b2 && b2.tagName, !!champ && champ.attrs.type, !!champ && champ.attrs.accept, !!champ && 'capture' in champ.attrs, !!champ && (champ.ev.click || []).length > 0];
  L.RELAIS_CALORIES = avantRelais;
  egal([sansCle, apres, avecCle],
    [[1, 0, 'button', 'kcal'], ['questions', 'appli', 1, null, true], ['label', 'file', 'image/*', true, true]],
    '« kcal » sur la carte, plus de › ; sans clé : Réglages → Appli, sur la clé ; avec la clé : l\'appareil photo');
});

// ── 2.16.0 : les repas de chaque jour sur l'accueil (demande : « ce qu'on doit manger tous les jours, mets-le sur la page
// d'accueil, et si tu as plusieurs choix, mets des "ou" ») ──
rendu('accueil : la carte « Manger » montre les jauges du jour puis le repas du moment, d\'après l\'heure', async () => {
  // 2.19.0 (demande : « en fonction de l'heure de la journée, tu devrais présenter soit le matin, soit le midi, soit le soir »).
  const NOTE = ['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g.', '', '## Matin', '', '### Bol d\'avoine', '- 12 cuillères à soupe de flocons', '',
    '## Soir', '', '### Pâtes au thon', '- 1 boîte de thon', '', '### Omelette', '- 3 œufs', '', '### Collation en plus', '- 25 cl de lait'].join('\n');
  const lignesA = (iso) => {
    simulerDate(iso);
    const o = vueC(pluginC({ etat: { seances: [S13], textes: { manger: NOTE } } }), 'accueil');
    return { o, lignes: parClasse(o, 'salle-repas-ligne').map((e) => e.textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim()) };
  };
  const soir = lignesA('2026-11-18T19:30:00'), matin = lignesA('2026-11-18T08:00:00'), midi = lignesA('2026-11-18T12:30:00'), nuit = lignesA('2026-11-18T01:00:00');
  const BOIS = 'Bois 1 grand verre d\'eau';   // 2.40.2 : une ligne à pastille, « Bois » puis la quantité
  egal([soir.lignes, matin.lignes, nuit.lignes, parClasse(soir.o, 'salle-jauges').length, /Protéines\s*0 \/ 110 g/.test(texte(soir.o).replace(/\s+/g, ' '))],
    // 2.20.0 (demande : « rappeler quand boire : sur l'accueil, le manger ») : la dernière ligne, l'eau avec ce repas.
    // 2.40.1 : l'objectif de protéines est dans la jauge du jour, plus en ligne.
    // 2.40.5 : sans taille ni âge, pas d'attendu (il est en kcal) : le repas du moment et ses plats.
    [['Ce soir Pâtes au thon, ou omelette.', BOIS], ['Ce matin Bol d\'avoine.', BOIS], ['Ce soir Pâtes au thon, ou omelette.', BOIS], 1, true],
    'les jauges du jour, puis le seul repas du moment (ses plats reliés par « ou », sans la collation), puis l\'eau ; à 1 h du matin, encore le soir');
  egal(midi.lignes, ['Matin Bol d\'avoine.', 'Soir Pâtes au thon, ou omelette.', 'Bois 1 grand verre par repas'], 'à midi, sans « Midi » dans la note (et sans taille ni âge) : tous les repas, et l\'eau « à chaque repas »');
  const carte = parClasse(soir.o, 'salle-manger-accueil')[0];
  simulerDate('2026-11-18T19:30:00');
  for (const f of carte.ev.click || []) await f({ target: carte });
  egal([soir.o.v.ecran, soir.o.v.noteType, parClasse(soir.o, 'salle-plat').map((e) => e.textContent.replace(/[▸▾]/g, '').trim()), /12 cuillères/.test(texte(soir.o))],
    ['note', 'manger', ['Pâtes au thon', 'Omelette', 'Collation en plus'], false], 'un toucher ouvre « Manger » sur le repas du moment, déjà déplié : ses plats, fermés');
});

// 2.40.2 (demande : « tu vois comment on a poussé Tes progrès ; manger est tout aussi important, il faut faire pareil ») :
// « Cette semaine : N jours validés » dès le premier jour validé (jamais « 0 »).
// 2.40.3 (« ça m'arrive de ne pas manger le goûter ou le matin ») : rien ne suppose 4 repas : les repas en photo, chacun avec
// ses kcal ; le repas du moment (d'après l'heure) tant qu'il n'est pas en photo ; le matin sauté n'apparaît nulle part.
rendu('accueil : « Manger » comme « Tes progrès » : les repas en photo, le repas du moment, les jours validés', async () => {
  const NOTE = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Matin', '', '### Bol d\'avoine', '- avoine', '',
    '## Midi', '', '### Poulet riz', '- riz', '', '## Goûter', '', '### Skyr et banane', '- skyr', '', '## Soir', '', '### Pâtes au thon', '- thon'].join('\n');
  const repas = (date, heure, quand, plat, kcal, proteines) => ({ date, heure, quand, plat, kcal, proteines, glucides: 0, lipides: 0 });
  const propre = (e) => e.textContent.replace(/\s+/g, ' ').trim();
  // 2.40.5 : avec taille, âge et sexe (les attendus sont en kcal).
  const REG = { hauteur: 175, age: 20, ageLe: '2026-11-25', sexe: 'h', poids: 65 };
  let cible = null;
  const lignesA = (iso, liste) => {
    simulerDate(iso);
    const p = pluginC({ etat: { seances: [S13], textes: { manger: NOTE }, repas: liste } });
    p.donnees.reglages = Object.assign(p.donnees.reglages || {}, REG);
    const reg = reglagesVue(p);
    cible = L.besoinsJour(reg, L.dernieresMesures(p.etat.mesures, reg).poids || reg.poids, '2026-11-25').cible;
    const o = vueC(p, 'accueil');
    return { o, lignes: parClasse(o, 'salle-repas-ligne').map(propre), haut: parClasse(o, 'salle-repas-haut').map(propre), echelle: parClasse(parClasse(o, 'salle-manger-accueil')[0] ? { r: () => parClasse(o, 'salle-manger-accueil')[0] } : o, 'salle-echelle-palier').length };
  };
  // Midi en photo, le matin sauté : à 13 h 30, le poulet riz et ses kcal, rien sur le matin ni sur le goûter.
  const midi = lignesA('2026-11-25T13:30:00', [repas('2026-11-25', '12:40', 'Ce midi', 'Poulet riz', 1220, 46)]);
  // À 13 h, avant la photo : le repas du moment.
  const avant = lignesA('2026-11-25T13:00:00', []);
  // Une journée validée lundi : « Cette semaine 1 jour validé ».
  const semaine = lignesA('2026-11-25T13:30:00', [repas('2026-11-23', '20:00', 'Ce soir', 'x', 3600, 120)]);
  const kc = (v) => `${L.fmtMilliers(v)} kcal`;
  const tous = ['matin', 'midi', 'gouter', 'soir'];
  const attMidi = L.attendus({ repas: [repas('2026-11-25', '12:40', 'Ce midi', 'Poulet riz', 1220, 46)], heure: 13, cible, noms: tous });
  const attAvant = L.attendus({ repas: [], heure: 13, cible, noms: tous });
  egal([midi.haut, midi.lignes, midi.echelle, avant.lignes, semaine.lignes[semaine.lignes.length - 1], attMidi.map((a) => a.cle), attAvant.map((a) => a.cle)],
    // 2.40.4 : le prochain repas (le goûter, un demi-repas) et son attendu ; 2.40.5 : en kcal.
    [[`Aujourd'hui encore ${kc(Math.round((cible - 1220) / 50) * 50)}`], [`Au goûter ≈ ${kc(attMidi[0].kcal)} Skyr et banane.`, 'Poulet riz 1 220 kcal', 'Bois 1 grand verre d\'eau'], 0,
      [`Ce midi ≈ ${kc(attAvant[0].kcal)} Poulet riz.`, 'Bois 1 grand verre d\'eau'], 'Cette semaine 1 jour validé', ['gouter', 'soir'], ['midi', 'gouter', 'soir']],
    'midi en photo, matin sauté : la photo et ses kcal, pas de case vide ; avant la photo : le repas du moment ; un jour validé dans la semaine');
  for (const f of parClasse(avant.o, 'salle-manger-accueil')[0].ev.click || []) await f({ target: parClasse(avant.o, 'salle-manger-accueil')[0] });
  egal([avant.o.v.noteType, avant.o.v.sectionOuverte], ['manger', L.sections(NOTE).findIndex((s) => s.titre === 'Midi')], 'un toucher ouvre « Manger » sur le repas du moment');
});

// 2.40.6 (demande : « si les infos manquent, il faut un pop-up pour forcer à répondre, et dire que c'est modifiable dans les
// réglages ») : sans taille, âge ou sexe, une feuille par-dessus l'accueil, sans croix ; un toucher à côté ne la ferme pas ; un
// champ manquant la garde ouverte ; une fois tout enregistré, elle part. Pas pendant une séance.
rendu('accueil : sans taille, âge ou sexe, la feuille « Tes calories du jour » force la réponse, puis part', async () => {
  simulerDate('2026-11-25T13:00:00');
  const p = pluginC({ etat: { seances: [S13] }, donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, poids: 70 } } });
  p.sauver = async () => { p.appels.push(['sauver']); };
  const o = vueC(p, 'accueil');
  const feuille = () => parClasse(o, 'salle-besoins-fenetre')[0];
  const f0 = feuille();
  const fond = parClasse(o, 'salle-besoins-fond')[0];
  for (const f of (fond && fond.ev.click) || []) await f({ target: fond });
  const debut = [!!f0, f0 && f0.attrs.role, !!f0 && f0.tous((e) => /salle-panneau-croix/.test(e.className || '')).length, /Réglages → Appli → Calories du jour/.test(f0 ? f0.textContent : ''), !!feuille()];
  const champs = f0.tous((e) => e.tagName === 'input');
  champs[0].value = '175'; champs[1].value = '20';
  const enregistrer = () => feuille().tous((e) => e.tagName === 'button' && /Enregistrer/.test(e.textContent))[0];
  for (const f of enregistrer().ev.click) await f();
  const sansSexe = [!!feuille(), p.donnees.reglages.hauteur == null];
  const homme = feuille().tous((e) => e.tagName === 'button' && e.textContent.trim() === 'Homme')[0];
  for (const f of homme.ev.click) await f();
  for (const f of enregistrer().ev.click) await f();
  const r = p.donnees.reglages;
  const enCours = pluginC({ etat: { seances: [S13] }, donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60 }, enCours: { nom: 'Séance A', debut: '2026-11-25T12:00:00' } } });
  egal([debut, champs.length, sansSexe, [r.hauteur, r.age, r.ageLe, r.sexe], !!feuille(), /encore [\d\s]+ kcal/.test(texte(o)), parClasse(vueC(enCours, 'accueil'), 'salle-besoins-fenetre').length],
    [[true, 'dialog', 0, true, true], 2, [true, true], [175, 20, '2026-11-25', 'h'], false, true, 0],
    'la feuille : sans croix, un toucher à côté ne la ferme pas, Homme ou Femme obligatoire ; enregistrée, elle part et les kcal s\'affichent ; pas pendant une séance');
});

// 2.38.66 (demande : un bouton en haut à gauche pour ouvrir le volet des fichiers) : sur téléphone, il ouvre le volet de gauche.
rendu('accueil : le bouton du volet (téléphone) ouvre le volet de gauche d\'Obsidian', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'accueil');
  let ouvert = 0;
  o.v.app = { workspace: { leftSplit: { toggle: () => { ouvert++; } } } };
  const b = parClasse(o, 'salle-bouton-volet')[0];
  if (b) for (const f of b.ev.click || []) await f({});
  egal([!!b, ouvert], [true, 1], 'le bouton est là et ouvre le volet');
});


// 2.38.85 (demande : à côté de la date, un point et un « ok » pour dire si on est à jour) : « · À jour », « · Mise à jour
// dispo » (un toucher ouvre la mise à jour), rien tant que la version publiée n'est pas connue.
rendu('accueil : à côté de la date, « À jour » ou « Mettre à jour »', async () => {
  simulerDate('2026-11-25T10:00:00');
  const ligne = (manifest, publiee) => {
    const p = pluginC();
    p.manifest = manifest; p.versionPubliee = publiee;
    p.ouvrirMiseAJour = () => { p.appels.push(['ouvrirMiseAJour']); return 'brat'; };
    const o = vueC(p, 'accueil');
    return { p, o, texte: parClasse(o, 'salle-date-ligne')[0].textContent };
  };
  const aJour = ligne({ version: '2.38.85' }, '2.38.85'), retard = ligne({ version: '2.38.84' }, '2.38.85'), inconnu = ligne({ version: '2.38.85' }, null);
  await cliquer(retard.o, 'Mettre à jour');
  egal([aJour.texte.replace(/\s+/g, ' ').trim().slice(-8), retard.texte.replace(/\s+/g, ' ').trim().slice(-15), retard.p.appels.filter((x) => x[0] === 'ouvrirMiseAJour').length, inconnu.texte.indexOf('·') < 0],
    ['· À jour', '6 Mettre à jour', 1, true], 'accueil : à côté de la date, « À jour » ou « Mettre à jour »');
});

// 2.38.90 (demande : vérifier si on est à jour à chaque fois qu'on est sur l'accueil) : arriver sur l'accueil relit la
// version publiée (le plugin garde une minute d'écart) ; aller ailleurs, non.
rendu('accueil : y arriver relit la version publiée', async () => {
  simulerDate('2026-11-25T10:00:00');
  const p = pluginC();
  const appels = [];
  p.verifierVersion = (sansAttendre) => { appels.push(sansAttendre); return Promise.resolve(null); };
  const o = vueC(p, 'questions');
  o.v.aller('accueil'); o.v.aller('progres'); o.v.aller('accueil');
  egal(appels, [true, true], 'accueil : y arriver relit la version publiée');
});

// 2.41.10 (« pour mon pote aussi, il faut changer ça » ; « c'est oui ») : avec un « Leg curl assis » noté avant le 27/11, la
// correction se fait toute seule, une fois, sans carte ; pas avec un leg curl du 27/11, ni une fois corrigé.
rendu('accueil : le leg curl d\'avant le 27/11 corrigé tout seul, une fois', async () => {
  simulerDate('2026-11-27T16:00:00');
  const seance = (date) => ({ date, nom: 'Séance A', chemin: date + '.md', exos: [{ nom: 'Leg curl assis', series: [{ charge: 40, reps: 12 }] }] });
  const essai = async (date, vu) => {
    const p = pluginC({ etat: { seances: [seance(date)] } });
    if (vu) p.donnees.reglages.legCurlVu = true;
    let appel = 0;
    p.corrigerLegCurl = async () => { appel++; p.donnees.reglages.legCurlVu = true; return 1; };
    const o = vueC(p, 'accueil');
    for (let k = 0; k < 6; k++) await Promise.resolve();   // la correction lancée par l'accueil finit
    o.v.rendre();
    return [appel, /leg curl assis/i.test(texte(o)) && /montant les jambes/.test(texte(o))];
  };
  const r = [await essai('2026-11-25', false), await essai('2026-11-27', false), await essai('2026-11-25', true)];
  simulerDate();
  egal(r, [[1, false], [0, false], [0, false]], 'un leg curl du 25/11 : corrigé une fois, sans carte ; du 27/11 : rien ; déjà corrigé : rien');
});
