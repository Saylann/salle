// Les rendus des premières questions et des réglages (src/67-reglages.js). Aides : tests/aides-ecrans.js.

// ───────────────────────── Réglages ─────────────────────────

rendu('réglages : deux jours de salle qui se suivent : la ligne des 48 h', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, jours: [1, 2, 4] } } }), 'questions');
  // 2.5.1 : texte raccourci (la consigne visible, le pourquoi replié dessous).
  egal(parClasse(o, 'salle-attention').map((e) => e.textContent), ['Garde au moins un jour entre deux séances.'],
    'réglages : deux jours de salle qui se suivent : la ligne des 48 h');
});

rendu('réglages : le bip et la vibration se coupent d\'un toucher', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC();
  const o = vueC(p, 'questions');
  await cliquer(o, 'Appli');   // 2.0 (relecture du 14/11) : le bip et la vibration sont dans l'onglet Appli
  const ligne = (mot) => parClasse(o, 'salle-reglage-ligne').find((e) => e.textContent.indexOf(mot) >= 0);
  for (const mot of ['Bip à la fin du repos', 'Vibration à « Série faite »']) for (const f of ligne(mot).tous((e) => e.tagName === 'button')[0].ev.click) await f();
  egal([p.donnees.reglages.son, p.donnees.reglages.vibration, ligne('Bip').textContent.indexOf('Coupé') >= 0], [false, false, true], 'réglages : le bip et la vibration se coupent d\'un toucher');
});

// 2.22.0 : 2 questions de plus (la salle, ses étages) : plus rien de la salle de l'utilisateur n'est écrit dans le code.
rendu('premières questions : 8 questions, des réglages complets, dont les tableaux ne sont jamais ceux de REGLAGES_DEFAUT', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { reglages: null } });
  const o = vueC(p, 'questions');
  const vus = [];
  const suivre = () => vus.push((o.r().tous((e) => e.tagName === 'h3')[0] || {}).textContent);
  suivre(); await cliquer(o, 'Jamais');
  suivre(); await cliquer(o, 'Valider');            // les jours : lundi, mercredi, vendredi au départ
  suivre(); await cliquer(o, '1 h');
  suivre(); await cliquer(o, 'De 2 en 2 kg');
  suivre(); await cliquer(o, 'Pas d\'examens prévus');
  suivre();                                         // la salle : son nom, son adresse, le trajet
  const texteSalle = o.r().tous((e) => e.tagName === 'input');
  texteSalle[0].value = '  Ma Salle  '; texteSalle[1].value = '1 rue du Test, Ville'; texteSalle[2].value = 'à pied';
  await cliquer(o, 'Valider');
  suivre();                                         // les étages : machines au 1er, haltères au 2e
  const rangs = parClasse(o, 'salle-etages-rang');
  for (const f of rangs[0].tous((e) => e.tagName === 'button' && e.textContent.trim() === '1')[0].ev.click) await f();
  for (const f of parClasse(o, 'salle-etages-rang')[1].tous((e) => e.tagName === 'button' && e.textContent.trim() === '2')[0].ev.click) await f();
  await cliquer(o, 'Valider');
  suivre();
  ok(p.donnees.reglages === null, 'rien n\'est écrit avant la dernière réponse');
  await cliquer(o, 'Valider');
  const r = p.donnees.reglages;
  egal([vus.length, o.v.ecran, r.niveau, r.jours, r.parSemaine, r.duree, r.pasHalteres, r.semainesLegeres, r.son, Array.isArray(r.pauses) && r.pauses !== REGLAGES_DEFAUT.pauses, r.semainesLegeres !== REGLAGES_DEFAUT.semainesLegeres],
    [8, 'accueil', 'jamais', [1, 3, 5], 3, 60, 2, [], true, true, true], 'premières questions : 8 questions, des réglages complets, dont les tableaux ne sont jamais ceux de REGLAGES_DEFAUT');
  egal([vus[5], vus[6], r.salle, r.etages], ['Ta salle ?', 'Ta salle a plusieurs étages ?', { nom: 'Ma Salle', adresse: '1 rue du Test, Ville', trajet: 'à pied' }, { machines: 1, halteres: 2 }],
    'la salle et ses étages : demandés par le questionnaire, gardés dans les réglages');
});

rendu('réinitialiser : les questions partent de tes réponses actuelles, garde l\'onglet Appli, efface le reste', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, jours: [1, 3, 6], son: false, pauses: ['2026-12-21'], semainesLegeres: ['2027-01-18'] } } });
  const o = vueC(p, 'questions');
  await cliquer(o, 'Changer mes réponses');
  const plein = () => o.boutons().filter((b) => /salle-principal/.test(b.className) && b.attrs['aria-pressed'] === 'true').map((b) => b.textContent.trim());
  const q1 = plein();
  await cliquer(o, 'Quelques fois');
  const q2 = plein();
  await cliquer(o, 'Valider');
  const q3 = plein();
  await cliquer(o, '1 h 15');
  await cliquer(o, 'De 1 en 1 kg');
  const semaine = o.r().tous((e) => e.tagName === 'select')[0];
  const choisie = semaine.childNodes.filter((x) => x.attrs.selected != null).map((x) => x.attrs.value);
  await cliquer(o, 'Valider');
  await cliquer(o, 'Valider');          // la salle : laissée vide
  await cliquer(o, 'Un seul étage');    // les étages
  ok(p.donnees.reglages.pauses.length === 1, 'avant la dernière réponse, rien ne change');
  await cliquer(o, 'Valider');
  const r = p.donnees.reglages;
  egal([q1, q2, q3, choisie, r.jours, r.duree, r.pasHalteres, r.semainesLegeres, r.son, r.pauses, o.v.ecran],
    [['Quelques fois'], ['Lun', 'Mer', 'Sam'], ['1 h 15'], ['2027-01-18'], [1, 3, 6], 75, 1, ['2027-01-18'], false, [], 'accueil'],
    'réinitialiser : les questions partent de tes réponses actuelles, garde l\'onglet Appli, efface le reste');
});

rendu('réinitialiser : quitter en route ne change rien', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, jours: [1, 3, 6] } } });
  const o = vueC(p, 'questions');
  await cliquer(o, 'Changer mes réponses');
  await cliquer(o, 'Jamais');
  await cliquer(o, 'Accueil');
  await cliquer(o, 'Réglages');
  egal([p.donnees.reglages.niveau, cartesReglages(o).indexOf('Mes jours de salle') >= 0], ['un peu', true], 'réinitialiser : quitter en route ne change rien');
});

// ── Réglages en deux onglets : Salle (l'entraînement), Appli (le technique) ──
const cartesReglages = (o) => parClasse(o, 'salle-carte').map((c) => { const t = c.tous((e) => e.tagName === 'strong' || e.tagName === 'h3')[0]; return t ? t.textContent.trim() : ''; });

rendu('réglages : deux onglets, Salle par défaut : jours, semaines sans salle, semaines légères, Réinitialiser', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'questions');
  const onglets = parClasse(o, 'salle-onglet');
  egal([onglets.map((b) => [b.textContent.trim(), b.attrs['aria-selected']]), cartesReglages(o), /Bip|Minuteur|Apparence|lecture seule/.test(texte(o))],
    [[['Salle', 'true'], ['Appli', 'false']], ['Mes jours de salle', 'Semaines sans salle', 'Semaines légères', 'Changer mes réponses', 'Réinitialiser'], false],
    'réglages : deux onglets, Salle par défaut : jours, semaines sans salle, semaines légères, Réinitialiser');
});

rendu('réglages : l\'onglet Appli garde le technique, sans rien de l\'entraînement', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ etat: { fichiers: { programme: { path: 'Programme.md' } } } });
  p.copier = async (t, m) => { p.appels.push(['copier', t, m]); return true; };
  p.nomCoffre = () => 'MonCarnet';
  const o = vueC(p, 'questions');
  await cliquer(o, 'Appli');
  await cliquer(o, 'Copier le lien');
  egal([cartesReglages(o), ['Minuteur de l\'iPhone', 'Bip à la fin du repos', 'Vibration à « Série faite »', 'Tester cet appareil'].every((t) => texte(o).indexOf(t) >= 0) && texte(o).indexOf('Connexions iPhone') < 0,
    /Mes jours de salle|Semaines sans salle|Question 1/.test(texte(o)), p.appels.filter((x) => x[0] === 'copier').map((x) => x[1])],
  // 2.39.0 : la clé de « Calories d'un plat » (technique, rien de l'entraînement).
  [['Pendant la séance', 'Lien de la séance', 'Calories d\'un plat : ta clé (facultatif)', 'Calories du jour', 'Apparence : mode clair', 'Notes en lecture seule', 'Séances notées', 'Note du programme'], true, false, ['obsidian://salle?vault=MonCarnet&ecran=seance']],
  'réglages : l\'onglet Appli garde le technique, sans rien de l\'entraînement');
});

rendu('réglages : l\'onglet choisi reste celui de la vue (retour par « Tester cet appareil » ou l\'accueil)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC(), 'questions');
  await cliquer(o, 'Appli');
  o.v.aller('accueil');
  await cliquer(o, 'Réglages');
  const apres = parClasse(o, 'salle-onglet').map((b) => b.attrs['aria-selected']);
  await cliquer(o, 'Salle');
  egal([apres, parClasse(o, 'salle-onglet').map((b) => b.attrs['aria-selected']), o.v.ecran], [['false', 'true'], ['true', 'false'], 'questions'],
    'réglages : l\'onglet choisi reste celui de la vue (retour par « Tester cet appareil » ou l\'accueil)');
});

rendu('réglages : la note du programme : « Recréer » seulement quand elle manque', async () => {
  simulerDate('2026-11-16T18:00:00');
  const bonne = vueC(pluginC({ etat: { fichiers: { programme: { path: 'Programme.md' } } } }), 'questions');
  await cliquer(bonne, 'Appli');
  const sans = vueC(pluginC({ etat: { programmeSecours: true, fichiers: {} } }), 'questions');
  await cliquer(sans, 'Appli');
  egal([!!bonne.bouton('Recréer la note du programme'), texte(bonne).indexOf('« Programme.md » est lisible') >= 0, !!sans.bouton('Recréer la note du programme')], [false, true, true],
    'réglages : la note du programme : « Recréer » seulement quand elle manque');
});

rendu('premières questions : 2 ou 3 jours conseillés, la ligne des 48 h si deux jours se suivent, « Question d\'avant »', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ donnees: { reglages: null } }), 'questions');
  await cliquer(o, 'Jamais');
  const nombre = () => parClasse(o, 'salle-jours-nombre').map((e) => e.textContent.replace(/\s+/g, ' ').trim());
  const trois = nombre();
  await cliquer(o, 'Mar');
  const quatre = nombre();
  const attention = parClasse(o, 'salle-attention').map((e) => e.textContent);
  await cliquer(o, 'Mar');
  await cliquer(o, 'Ven');
  const deux = nombre();
  await cliquer(o, 'Question d\'avant');
  egal([attention, (o.r().tous((e) => e.tagName === 'h3')[0] || {}).textContent], [['Garde au moins un jour entre deux séances.'], 'Tu as déjà fait de la musculation en salle ?'],
    'premières questions : la ligne des 48 h, et « Question d\'avant »');
  // 2.10.0 : la question dit combien de séances par semaine ça fait.
  egal([trois, quatre, deux], [['3 séances par semaine'], ['3 séances par semaine (3 au plus)'], ['2 séances par semaine']], 'premières questions : le nombre de séances par semaine');
});

rendu('premières questions : pas d\'onglets, rien de plein (la réponse n\'est pas connue)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ donnees: { reglages: null } }), 'questions');
  egal([parClasse(o, 'salle-onglets').length, o.boutons().filter((b) => /salle-principal/.test(b.className)).length, !!o.bouton('Jamais')], [0, 0, true],
    'premières questions : pas d\'onglets, rien de plein (la réponse n\'est pas connue)');
});

// ── « Semaines sans salle » (Réglages → Salle) : l'ancienne pause de l'accueil, prévue à l'avance ──
rendu('semaines sans salle : la liste des semaines prévues (« Semaine du 18 janvier »), « Retirer » d\'un toucher', async () => {
  simulerDate('2026-11-18T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: ['2026-11-02', '2026-11-16', '2027-01-18'] } } });
  const o = vueC(p, 'questions');
  const carte = parClasse(o, 'salle-sans-salle')[0];
  const lignes = () => parClasse({ r: () => parClasse(o, 'salle-sans-salle')[0] }, 'salle-reglage-ligne').map((e) => e.childNodes[0].textContent);
  const avant = lignes();
  await cliquer({ bouton: () => carte.tous((e) => e.tagName === 'button' && e.attrs['aria-label'] === 'Retirer : semaine du 18 janvier')[0] }, '');
  egal([carte.childNodes[1].textContent, avant, p.appels.filter((x) => x[0] === 'basculerPause'), lignes(), p.donnees.reglages.pauses],
    ['Vacances  : prévois-la ici. Partiels  : plutôt 2 séances, avec 1 série de plus au dos, aux épaules et aux pecs.', ['Cette semaine', 'Semaine du 18 janvier'], [['basculerPause', '2027-01-18']], ['Cette semaine'], ['2026-11-02', '2026-11-16']],
    'semaines sans salle : la liste des semaines prévues (« Semaine du 18 janvier »), « Retirer » d\'un toucher'); // 2.3.0 : la phrase dit les partiels (2 séances, 1 série de plus [11, 45]) ; 2.5.1 : texte raccourci (2 puces) ;
  // 2.8.0 : « malade » a ses lignes au-dessus du choix « Cette semaine (malade) » (pas montrées ici : la semaine est déjà prévue)
});

rendu('semaines sans salle : le choix des 12 semaines qui viennent, puis « Cette semaine (malade) » en dernier', async () => {
  simulerDate('2026-11-18T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: ['2026-12-21'] } } });
  const o = vueC(p, 'questions');
  const menu = o.r().tous((e) => e.tagName === 'select')[0];
  const options = menu.childNodes.map((x) => [x.attrs.value, x.textContent]);
  menu.value = '2027-01-18';
  for (const f of menu.ev.change) await f();
  egal([options[0], options[1], options.length, options.slice(-2), options.some((x) => x[0] === '2026-12-21'), p.appels.filter((x) => x[0] === 'basculerPause'), p.donnees.reglages.pauses],
    [['', 'Ajouter une semaine…'], ['2026-11-23', 'Semaine du 23 novembre'], 13, [['2027-02-08', 'Semaine du 8 février'], ['2026-11-16', 'Cette semaine (malade)']], false, [['basculerPause', '2027-01-18']], ['2026-12-21', '2027-01-18']],
    'semaines sans salle : le choix des 12 semaines qui viennent, puis « Cette semaine (malade) » en dernier');
});

rendu('semaines sans salle : la semaine en cours mise en pause le dit sur l\'accueil, et Progrès la compte', async () => {
  simulerDate('2026-11-18T18:00:00');
  const p = pluginC({ etat: { seances: [seanceDuProgramme('2026-11-09', 0)] } });
  const o = vueC(p, 'questions');
  const menu = o.r().tous((e) => e.tagName === 'select')[0];
  menu.value = '2026-11-16';
  for (const f of menu.ev.change) await f();
  const reg = L.regularite(p.etat.seances, '2026-11-18', 3, p.donnees.reglages.pauses);
  const a = vueC(p, 'accueil');
  egal([p.donnees.reglages.pauses, p.appels.filter((x) => x[0] === 'basculerPause'), reg.semaines[11].etat, texte(a).indexOf('Semaine sans salle : ta série ne casse pas.') >= 0, texte(a).indexOf('Semaine sans salle : repos.') >= 0],
    [['2026-11-16'], [['basculerPause', '2026-11-16', true]], 'pause', true, true],
    'semaines sans salle : la semaine en cours mise en pause (malade) le dit sur l\'accueil, repos, et Progrès la compte'); // 2.3.0 : marquée malade (L.apresMaladie) ; « Semaine sans salle : repos. » (avant : « séance » après 4 jours)
});

rendu('réglages, onglet Appli : aucune erreur, et chaque bouton a une action', async () => {
  simulerDate('2026-11-18T20:00:00');
  const p = pluginC({ etat: { seances: [S13, S18], fichiers: { connexions: { path: 'C.md' }, programme: { path: 'Programme.md' } } } });
  p.copier = async () => true;
  const o = vueC(p, 'questions', (v) => { v.ongletReglages = 'appli'; });
  egal([o.erreur(), o.boutons().every((b) => (b.ev.click || []).length), o.boutons().length > 8], [false, true, true], 'réglages, onglet Appli : aucune erreur, et chaque bouton a une action');
});

// 2.8.0 : « malade » (l'ancienne note « Débuter à la salle ») juste au-dessus du choix « Cette semaine (malade) » [126].
// Relecture 2.8.0 (changement voulu) : ce qu'il fait (« choisis… »), et les deux signes de [126] qui manquaient (respirer,
// poitrine) ; plus « Ta reprise : le plugin la fera… » (ce que fait le plugin, dit dans « Avant de commencer »).
rendu('semaines sans salle : quand choisir « Cette semaine (malade) », juste au-dessus du choix', async () => {
  simulerDate('2026-11-18T18:00:00');
  const o = vueC(pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: [] } } }), 'questions');
  const carte = parClasse(o, 'salle-sans-salle')[0];
  const n = carte.childNodes.length;
  const malade = carte.childNodes[n - 2];
  egal([/salle-malade/.test(malade.className), malade.textContent.replace(/\s+/g, ' ').trim(), carte.childNodes[n - 1].tagName],
    [true, 'Fièvre, frissons, courbatures partout : choisis « Cette semaine (malade) ». Mal à respirer, douleur dans la poitrine : pas de séance, va voir un médecin.', 'select'],
    'semaines sans salle : les signes, puis le choix');
  const deja = vueC(pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: ['2026-11-16'] } } }), 'questions');
  egal(parClasse(deja, 'salle-malade').length, 0, 'semaine en cours déjà prévue : pas de ligne « malade »');
  const accueil = vueC(pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, pauses: [] } } }), 'accueil');
  ok(texte(accueil).indexOf('Fièvre') < 0, 'pas sur l\'accueil');
});

// 2.9.0 : « Ton corps aujourd'hui » (demande : « mets dans le questionnaire la taille et tout ») : pré-rempli avec les
// dernières valeurs ; seules les valeurs changées vont dans Mesures ; la taille va dans les réglages.
rendu('premières questions : ton corps aujourd\'hui, pré-rempli, seules les valeurs changées vont dans Mesures', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, jours: [1, 3, 5], poids: 70 } },
    etat: { mesures: [{ date: '2026-11-10', poids: 70 }, { date: '2026-11-15', epaules: 107, bras: 34, taille: 75 }] } });
  const o = vueC(p, 'questions');
  for (const t of ['Changer mes réponses', 'Quelques fois', 'Valider', '1 h 15', 'De 2 en 2 kg', 'Valider', 'Valider', 'Un seul étage']) await cliquer(o, t);
  const champs = o.r().tous((e) => e.tagName === 'input');
  const valeurs = champs.map((c) => c.attrs.value || '');
  champs[0].value = '185'; champs[1].value = '70.5'; champs[2].value = '75'; champs[3].value = '107'; champs[4].value = '34';
  await cliquer(o, 'Valider');
  egal([valeurs, p.donnees.reglages.hauteur, p.donnees.reglages.poids, p.appels.filter((x) => x[0] === 'ajouterMesure').map((x) => x[1])],
    [['', '70', '75', '107', '34'], 185, 70.5, [{ date: '2026-11-16', poids: 70.5 }]],
    'premières questions : ton corps aujourd\'hui, pré-rempli, seules les valeurs changées vont dans Mesures');
});

// 2.28.0 (demande : « quand on veut réinitialiser, ça supprime tout le dossier Données, et le plugin, à partir du questionnaire,
// recrée totalement le dossier ») : deux touchers, la corbeille dite au moment d'effacer, puis le questionnaire d'un coffre neuf.
rendu('réglages : « Réinitialiser » efface tout en deux touchers, puis repose les questions', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, jours: [1, 3, 5] } } });
  p.effacerDonnees = async () => { p.appels.push(['effacerDonnees']); p.donnees.reglages = null; return true; };
  const o = vueC(p, 'questions');
  const avant = [texte(o).indexOf('corbeille') >= 0, texte(o).indexOf('Toucher encore') >= 0];
  await cliquer(o, 'Réinitialiser');
  const milieu = [texte(o).indexOf('corbeille') >= 0, p.appels.filter((x) => x[0] === 'effacerDonnees').length];
  await cliquer(o, 'Annuler');
  const annule = [texte(o).indexOf('Toucher encore') >= 0, p.appels.filter((x) => x[0] === 'effacerDonnees').length];
  await cliquer(o, 'Réinitialiser');
  await cliquer(o, 'Toucher encore : tout effacer');
  egal([avant, milieu, annule, p.appels.filter((x) => x[0] === 'effacerDonnees').length, texte(o).indexOf('Bienvenue') >= 0, texte(o).indexOf('Question 1 sur') >= 0],
    [[false, false], [true, 0], [false, 0], 1, true, true], 'réglages : « Réinitialiser » efface tout en deux touchers, puis repose les questions');
});

// 2.39.3 : Réglages → Appli, « Calories du jour » : la taille, l'âge (avec son jour) et le sexe, puis les calories du jour.
rendu('réglages : « Calories du jour » : taille, âge, sexe, puis les kcal du jour en prise de masse', async () => {
  simulerDate('2026-11-25T13:00:00');
  const p = pluginC({ donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [1, 3, 5] } } });
  const o = vueC(p, 'questions');
  await cliquer(o, 'Appli');
  const carte = () => parClasse(o, 'salle-besoins-carte')[0];
  const avant = /ta taille, ton âge et ton sexe/.test(carte().textContent);
  await cliquer(o, 'Homme');
  const champs = carte().tous((e) => e.tagName === 'input');
  champs[0].value = '175'; champs[1].value = '20';
  for (const f of carte().tous((e) => e.tagName === 'button' && /Enregistrer/.test(e.textContent))[0].ev.click) await f();
  const r = p.donnees.reglages;
  egal([avant, champs.length, r.hauteur, r.age, r.ageLe, r.sexe, (/environ 3050 kcal par jour ?\./.test(carte().textContent.replace(/\s+/g, ' ')) && !/par repas/.test(carte().textContent))],
    [true, 2, 175, 20, '2026-11-25', 'h', true], 'réglages : « Calories du jour » garde taille, âge et sexe, puis donne les kcal du jour (2.40.3 : plus par repas)');
});

