// Les rendus de Progrès, de la courbe et de Mesures (src/65-progres.js, la courbe : src/50-ui.js). Aides : tests/aides-ecrans.js.

// ───────────────────────── Progrès ─────────────────────────

// La semaine de l'exemple du contrat : A le 16/11 (réserve 1 ou 2), B le 18/11 (réserve 0), A le 20/11 avec une répétition
// de plus au tirage ; on est le 20/11.
const semaineCases = () => [
  seanceDuProgramme('2026-11-16', 0, (s) => { s.exos[0].reserve = '1-2'; }),
  seanceDuProgramme('2026-11-18', 1, (s) => { s.exos[0].reserve = '0'; }),
  seanceDuProgramme('2026-11-20', 0, (s) => { s.exos[0].series[0].r += 1; }),
];

// 2.10.0 : une seule carte « Cette semaine » (L.lignesSemaine) à la place des 5 cases et du tableau « Ce qui rapporte des XP ».
rendu('progrès : « Cette semaine », une ligne par chose qui compte, cochée toute seule, avec ses XP', async () => {
  simulerDate('2026-11-20T20:00:00');
  const p = pluginC({ etat: { seances: semaineCases() } });
  const o = vueC(p, 'progres');
  const n = L.niveau(p.etat.seances, P115, reglagesVue(p), '2026-11-20');
  const attendu = L.lignesSemaine(n, reglagesVue(p));
  const carte = parClasse(o, 'salle-cases')[0];
  egal([parClasse(o, 'salle-case').map((c) => c.className.indexOf('salle-case-faite') >= 0), parClasse(o, 'salle-case-titre').map((e) => e.textContent), parClasse(o, 'salle-case-gain').map((e) => e.textContent)],
    [attendu.map((c) => c.fait), attendu.map((c) => c.titre), attendu.map((c) => c.gain)], 'progrès : les lignes de la semaine, telles que L.lignesSemaine les calcule');
  egal([carte.childNodes[0].textContent.replace(/\s+/g, ' ').trim(), attendu.length, attendu.filter((c) => c.fait).length >= 4, parClasse(o, 'salle-case-regle').map((e) => e.textContent), texte(o).indexOf('Ce qui rapporte') < 0],
    [`Cette semaine +${L.fmtMilliers(n.semaine.total)} XP`, 6, true, ['Plus de 3 semaines sans séance : tu perds des XP.'], true], 'progrès : le titre et le total de la semaine ; la règle de l\'arrêt ; plus de tableau des XP');
});

rendu('progrès : « Protéines et sommeil » se coche d\'un toucher sur sa ligne (plugin.cocherRecup), sans bouton « Cocher »', async () => {
  simulerDate('2026-11-20T20:00:00');
  const p = pluginC({ etat: { seances: semaineCases() } });
  const o = vueC(p, 'progres');
  const ligne = parClasse(o, 'salle-case-bouton')[0];
  for (const f of ligne.ev.click || []) await f();
  egal([ligne.tagName, ligne.attrs['aria-pressed'], !!o.bouton('Cocher'), p.appels.filter((x) => x[0] === 'cocherRecup')], ['button', 'false', false, [['cocherRecup', '2026-11-16', true]]],
    'progrès : la ligne « Protéines et sommeil » est le bouton');
});

// 2.11.0 : un long arrêt (plus de 3 semaines sans séance) coûte des XP, comme dans les études ; une séance manquée, rien.
rendu('progrès : un arrêt qui approche, puis sa perte, se disent dans la carte, en orange, sans reproche', async () => {
  const p = pluginC({ etat: { seances: semaineCases() } });   // dernière séance le 20/11
  simulerDate('2026-12-08T18:00:00');   // 18 jours après
  const o = vueC(p, 'progres');
  const pas = Math.round(L.niveau(p.etat.seances, P115, reglagesVue(p), '2026-12-08').xp / 17);
  simulerDate('2026-12-18T18:00:00');   // 28 jours après : la 4e semaine
  const q = vueC(p, 'progres');
  const dit = (v, c) => parClasse(v, c).map((e) => e.textContent.replace(/\s+/g, ' ').trim());
  egal([dit(o, 'salle-case-alerte'), dit(o, 'salle-case-perte'), dit(q, 'salle-case-perte'), parClasse(q, 'salle-case-regle').length, o.erreur() || q.erreur()],
    [[`Dernière séance il y a 18 jours Plus de 3 semaines sans séance : tu perds des XP. −${L.fmtMilliers(pas)} par semaine`], [], [`4 semaines sans séance Tes prochaines séances te les rendent. −${L.fmtMilliers(pas)}`], 0, false],
    'progrès : l\'arrêt qui approche, puis la perte de la semaine');
});

rendu('progrès : une barre par muscle ; la zone 10-15 seulement pour le dos, le côté des épaules et les pecs', async () => {
  simulerDate('2026-11-20T20:00:00');
  const o = vueC(pluginC({ etat: { seances: semaineCases() } }), 'progres');
  const muscles = parClasse(o, 'salle-muscle');
  egal([muscles.map((m) => m.childNodes[0].textContent), muscles.filter((m) => m.tous((e) => e.className === 'salle-zone').length).map((m) => m.childNodes[0].textContent)],
    [Object.values(L.NOMS_MUSCLES), ['Dos', 'Côté des épaules', 'Pecs', 'Biceps', 'Avant-bras', 'Triceps']], 'progrès : une barre par muscle ; la zone 10-15 pour les muscles prioritaires de l\'objectif (2.31.0 : les bras et les avant-bras aussi)');
});

// 2.10.0 : plus de consigne « c-niveau » (le tableau des XP) : la carte « Cette semaine » dit ce que chaque ligne vaut.
// 2.13.1 (changement voulu, demande : « arrête de les faire disparaître ») : les deux consignes sont toujours là, sans bouton
// « Compris ».
rendu('progrès : les consignes du volume et de la régularité, toujours là, sans « Compris »', async () => {
  simulerDate('2026-11-20T20:00:00');
  const consignes = (o) => parClasse(o, 'salle-consigne').map((c) => c.textContent.slice(0, 20));
  const a = vueC(pluginC({ etat: { seances: semaineCases() } }), 'progres');
  const b = vueC(pluginC({ etat: { seances: semaineCases() }, vus: ['c-volume', 'c-regularite'] }), 'progres');
  egal([consignes(a), consignes(b)], [['1 série  pour le mus', 'Une colonne  par sem'], ['1 série  pour le mus', 'Une colonne  par sem']], 'progrès : les deux consignes, même déjà vues');
  // Le « Pourquoi » de « Séries par muscle » reste dans le code, pas à l'écran (2.9.0 : « le pourquoi, c'est pour les dev »).
  egal([!!a.bouton('Compris'), texte(a).indexOf('Pourquoi') >= 0], [false, false], 'progrès : ni « Compris », ni « Pourquoi »');
});

rendu('progrès : la régularité, une colonne par semaine depuis les débuts, un rond par séance', async () => {
  simulerDate('2026-11-17T20:00:00');
  const seances = [seanceDuProgramme('2026-11-09', 0), seanceDuProgramme('2026-11-11', 1), seanceDuProgramme('2026-11-16', 0)];
  const o = vueC(pluginC({ etat: { seances } }), 'progres');
  const cols = parClasse(o, 'salle-grille-semaine');
  egal([cols.length, cols.map((c) => c.className.replace('salle-grille-semaine salle-grille-', '')), cols.map((c) => parClasse({ r: () => c }, 'salle-plein').length + '/' + c.tous((e) => /salle-grille-rond( |$)/.test(e.className)).length)],
    [2, ['en-attente', 'en-cours'], ['2/3', '1/3']], 'progrès : la régularité, une colonne par semaine depuis les débuts, un rond par séance');
});

rendu('progrès : chaque exercice, ses records par type, sa phrase et son badge de record', async () => {
  simulerDate('2026-11-20T20:00:00');
  const seances = [seanceNotee('2026-11-16', 'Séance A', [['Tirage vertical prise large', '35×12, 35×10']]), seanceNotee('2026-11-20', 'Séance A', [['Tirage vertical prise large', '37.5×9, 37.5×8']])];
  const o = vueC(pluginC({ etat: { seances } }), 'progres');
  const carte = parClasse(o, 'salle-prog-carte').find((c) => c.textContent.indexOf('Tirage vertical prise large') >= 0);
  const lignes = carte.tous((e) => e.className === 'salle-ligne salle-entre' && e.parent && e.parent.className === 'salle-records-exo').map((e) => e.textContent);
  egal([lignes, parClasse({ r: () => carte }, 'salle-courbe-phrase')[0].textContent, !!parClasse({ r: () => carte }, 'salle-badge').length],
    [['Plus lourd 37,5 kg × 9 · 20/11', 'Le plus de répétitions 35 kg × 12 · 16/11'], '35 → 37,5 kg en 4 jours', true], 'progrès : chaque exercice, ses records par type, sa phrase et son badge de record');
});

// 2.1.0 (le niveau) : sans séance, la carte du niveau reste en haut (« Ta première séance lance ton niveau. » ou le nombre de
// séances complètes) : 2 cartes, le niveau puis le message.
rendu('progrès : sans séance, un seul message', async () => {
  simulerDate('2026-11-20T20:00:00');
  const o = vueC(pluginC({ vus: ['c-niveau'] }), 'progres');
  egal([parClasse(o, 'salle-carte').map((c) => /salle-niveau-carte/.test(c.className)), texte(o).indexOf('Pas encore de séance notée') >= 0], [[true, false], true], 'progrès : sans séance, un seul message');
});

// ───────────────────────── La courbe ─────────────────────────

// Le faux DOM n'a pas createElementNS : on le prête le temps de ces tests, pour voir le dessin.
const avecSvg = (fn) => { document.createElementNS = (ns, t) => new El(t); try { return fn(); } finally { delete document.createElementNS; } };

rendu('courbe : moins de 2 points, rien (l\'écran le dit en mots)', async () => {
  egal([courbe([]), courbe([{ date: '2026-11-16', y: 40 }]), courbe(null)], [null, null, null], 'courbe : moins de 2 points, rien (l\'écran le dit en mots)');
});

rendu('courbe : un dessin lisible (role="img", aria-label), le premier, le max s\'il est au milieu, le dernier', async () => {
  const b = avecSvg(() => courbe([{ date: '2026-11-02', y: 40 }, { date: '2026-11-09', y: 45 }, { date: '2026-11-16', y: 42.5 }], { unite: 'kg' }));
  const svg = b.childNodes[0];
  egal([svg.attrs.role, svg.attrs['aria-label'], b.childNodes[1].childNodes.map((e) => e.textContent)],
    ['img', '40 kg · 02/11 → 42,5 kg · 16/11, 3 points', ['40 kg · 02/11', 'max 45 kg', '42,5 kg · 16/11']], 'courbe : un dessin lisible (role="img", aria-label), le premier, le max s\'il est au milieu, le dernier');
});

rendu('courbe : l\'axe suit les vraies dates (un trou de 2 semaines se voit)', async () => {
  const b = avecSvg(() => courbe([{ date: '2026-11-02', y: 40 }, { date: '2026-11-04', y: 41 }, { date: '2026-11-30', y: 42 }]));
  const cx = b.childNodes[0].childNodes.filter((e) => e.tagName === 'circle').map((c) => Number(c.attrs.cx));
  egal([cx.length, cx[1] - cx[0] < (cx[2] - cx[1]) / 5], [3, true], 'courbe : l\'axe suit les vraies dates (un trou de 2 semaines se voit)');
});

rendu('courbe : 49 → 47,5 ne ressemble pas à une chute (hauteur d\'au moins 20 % de la valeur)', async () => {
  const b = avecSvg(() => courbe([{ date: '2026-11-02', y: 49 }, { date: '2026-11-09', y: 47.5 }]));
  const cy = b.childNodes[0].childNodes.filter((e) => e.tagName === 'circle').map((c) => Number(c.attrs.cy));
  egal(Math.abs(cy[1] - cy[0]) < 20, true, 'courbe : 49 → 47,5 ne ressemble pas à une chute (hauteur d\'au moins 20 % de la valeur)');
});

rendu('courbe : les jours de record en or', async () => {
  const b = avecSvg(() => courbe([{ date: '2026-11-02', y: 35 }, { date: '2026-11-09', y: 37.5, record: true }]));
  egal(b.childNodes[0].childNodes.filter((e) => e.tagName === 'circle').map((c) => /salle-courbe-record/.test(c.attrs.class)), [false, true], 'courbe : les jours de record en or');
});

// ───────────────────────── Mesures, séances, guide, note ─────────────────────────

rendu('mesures : « Enregistrer » envoie la mesure (plugin.ajouterMesure), virgule comprise', async () => {
  simulerDate('2026-11-16T08:00:00');
  const p = pluginC();
  const o = vueC(p, 'mesures');
  const champ = o.r().tous((e) => e.tagName === 'input')[0];
  for (const f of champ.ev.input) f({ target: { value: '71,5' } });
  await cliquer(o, 'Enregistrer');
  egal(p.appels.filter((x) => x[0] === 'ajouterMesure'), [['ajouterMesure', { date: '2026-11-16', poids: 71.5 }]], 'mesures : « Enregistrer » envoie la mesure (plugin.ajouterMesure), virgule comprise');
});

// 2.7.0 (changement voulu) : une pesée par semaine, le dimanche matin à jeun, plus « 3 fois par semaine ».
// 2.13.1 (changement voulu) : le conseil de pesée est toujours là.
rendu('mesures : le conseil de pesée est toujours affiché', async () => {
  simulerDate('2026-11-16T08:00:00');
  const dit = (o) => texte(o).indexOf('une fois par semaine, le dimanche matin, à jeun') >= 0;
  egal([dit(vueC(pluginC(), 'mesures')), dit(vueC(pluginC({ vus: ['c-mesures-2'] }), 'mesures')), texte(vueC(pluginC(), 'mesures')).indexOf('3 fois par semaine') >= 0],
    [true, true, false], 'mesures : le conseil de pesée (une fois par semaine), toujours affiché');
});

// 2.7.0 : la tendance du poids sur 2 à 4 semaines face à la cible [30], le conseil (avis), les protéines 110 à 150 g [29].
rendu('mesures : la tendance du poids par semaine, la cible et le conseil', async () => {
  simulerDate('2026-11-29T08:00:00');
  const monte = [{ date: '2026-11-15', poids: 70 }, { date: '2026-11-22', poids: 70.2 }, { date: '2026-11-29', poids: 70.5 }];
  const plat = [{ date: '2026-11-15', poids: 70 }, { date: '2026-11-22', poids: 70 }, { date: '2026-11-29', poids: 70 }];
  const tm = texte(vueC(pluginC({ etat: { mesures: monte } }), 'mesures'));
  const tp = texte(vueC(pluginC({ etat: { mesures: plat } }), 'mesures'));
  const t1 = texte(vueC(pluginC({ etat: { mesures: [{ date: '2026-11-29', poids: 70 }] } }), 'mesures'));
  egal([tm.indexOf('+0,25 kg par semaine (3 semaines)') >= 0, tm.indexOf('Dans la cible (+0,18 à 0,35 kg)') >= 0, tp.indexOf('ajoute une collation (avis)') >= 0,
    t1.indexOf('après 3 semaines de pesées') >= 0, t1.indexOf('110 à 150 g par jour') >= 0, tm.indexOf('par mois') >= 0],
  [true, true, true, true, true, false], 'mesures : +0,25 kg par semaine dans la cible ; plat : collation ; une pesée : la tendance plus tard ; protéines 110 à 150 g');
});

rendu('progrès : une courbe qui échoue n\'empêche pas les autres exercices', async () => {
  simulerDate('2026-11-20T20:00:00');
  const seances = [seanceNotee('2026-11-16', 'Séance A', [['Tirage vertical prise large', '35×12'], ['Presse à cuisses', '60×10']])];
  const vraie = L.pointsCourbe;
  L.pointsCourbe = (ss, nom) => { if (/presse/i.test(nom)) throw new Error('courbe abîmée'); return vraie(ss, nom); };
  let o;
  try { o = vueC(pluginC({ etat: { seances } }), 'progres'); } finally { L.pointsCourbe = vraie; }
  egal([o.erreur(), parClasse(o, 'salle-prog-carte').map((c) => c.childNodes[0].childNodes[0].textContent), parClasse(o, 'salle-alerte').length],
    [false, ['Tirage vertical prise large'], 1], 'progrès : une courbe qui échoue n\'empêche pas les autres exercices');
});

// ───────────────────────── Le niveau ─────────────────────────

// 2.10.0 : l'échelle des paliers dit « tu es ici », puis les XP où commence chaque palier (« 10 000 XP »).
rendu('progrès : la carte du niveau en haut : niveau, titre, XP, barre, phrase, l\'échelle des paliers', async () => {
  simulerDate('2026-11-20T20:00:00');
  const p = pluginC({ etat: { seances: semaineCases() } });
  const o = vueC(p, 'progres');
  const n = L.niveau(p.etat.seances, P115, reglagesVue(p), '2026-11-20');
  const cartes = o.r().childNodes.map((e) => e.className || '');
  const paliers = parClasse(o, 'salle-echelle-palier');
  egal([cartes.findIndex((c) => /salle-niveau-carte/.test(c)), parClasse(o, 'salle-niveau-surtitre').map((e) => e.textContent), parClasse(o, 'salle-niveau-titre').map((e) => e.textContent),
    parClasse(o, 'salle-niveau-plein').map((e) => e.style.width), parClasse(o, 'salle-niveau-phrase').map((e) => e.textContent),
    paliers.map((e) => e.childNodes[1].textContent + ' ' + e.childNodes[2].textContent), paliers.map((e) => e.className.replace('salle-echelle-palier salle-echelle-', '')), paliers.map((e) => e.attrs['aria-current'] || '')],
  [1, [`Niveau ${n.niveau}`], [n.titre], [pcNiveau(n.part)], [L.conseilNiveau(n, o.v.seancePreparee(null, o.v.bilanJour()))],
    L.PALIERS.map((x) => `${x.titre} ${x.xp ? `${L.fmtMilliers(x.xp)} XP` : 'tu es ici'}`), ['ici', 'avenir', 'avenir', 'avenir', 'avenir'], ['step', '', '', '', '']],
  'progrès : la carte du niveau en haut : niveau, titre, XP, barre, phrase, l\'échelle des paliers');
  vrai(texte(o).indexOf(`${L.fmtMilliers(n.xp)} XP`) >= 0 && texte(o).indexOf(`encore ${L.fmtMilliers(n.reste)} XP`) >= 0, 'progrès : les XP et ce qui reste');
});

rendu('progrès : l\'échelle des titres : les paliers passés cochés, la position actuelle marquée', async () => {
  simulerDate('2026-11-20T20:00:00');
  const vraie = L.niveau;
  // 21 000 XP (Solide) : le palier vient des XP.
  const dates = ['2026-09-01', '2026-10-01', '2026-11-01', null, null];
  L.niveau = () => ({ niveau: 12, titre: 'Solide', xp: 21000, xpNiveau: 20200, xpSuivant: 22900, reste: 1900, part: 0.3, prochainTitre: 'Costaud', prochainPalier: 40000, seances: 40, moyenne: 400, derniere: null,
    faites: 40, palier: L.palier(21000), objectif: 3, pertes: [], semaine: { lundi: '2026-11-16', total: 0, lignes: {}, recup: false, perte: null, aRattraper: null },
    paliers: L.PALIERS.map((x, rang) => ({ rang, titre: x.titre, a: x.xp, date: dates[rang] })) });
  let o;
  try { o = vueC(pluginC({ etat: { seances: semaineCases() } }), 'progres'); } finally { L.niveau = vraie; }
  egal([parClasse(o, 'salle-echelle-palier').map((e) => e.className.replace('salle-echelle-palier salle-echelle-', '')), parClasse(o, 'salle-echelle-passe').map((e) => e.tous((x) => /salle-echelle-point/.test(x.className))[0].textContent), o.erreur()],
    [['passe', 'passe', 'ici', 'avenir', 'avenir'], ['✓', '✓'], false], 'progrès : l\'échelle des titres : les paliers passés cochés, la position actuelle marquée');
});

rendu('progrès : un calcul du niveau qui échoue : pas de carte du niveau, le reste s\'affiche', async () => {
  simulerDate('2026-11-20T20:00:00');
  const vraie = L.niveau;
  L.niveau = () => { throw new Error('donnée inattendue'); };
  let o;
  try { o = vueC(pluginC({ etat: { seances: semaineCases() } }), 'progres'); } finally { L.niveau = vraie; }
  // 2.10.0 : la carte « Cette semaine » vient du niveau : elle part avec lui ; les muscles, la régularité et les exercices restent.
  egal([o.erreur(), parClasse(o, 'salle-niveau-carte').length, parClasse(o, 'salle-alerte').length, parClasse(o, 'salle-cases').length, parClasse(o, 'salle-muscle').length > 0, parClasse(o, 'salle-prog-carte').length > 0],
    [false, 0, 0, 0, true, true], 'progrès : un calcul du niveau qui échoue : ni carte du niveau ni carte de la semaine, le reste s\'affiche');
});

// 2.4.0 : l'avis de la taille dans Mesures, dit comme un avis, avec le lien vers « Manger simple ».
rendu('mesures : l\'avis de la taille, avec « Manger simple »', async () => {
  simulerDate('2027-02-07T09:00:00');
  const ms = [{ date: '2026-12-06', taille: 80, epaules: 112 }, { date: '2027-01-03', taille: 81 }, { date: '2027-02-07', taille: 82, epaules: 112 }];
  const o = vueC(pluginC({ etat: { mesures: ms } }), 'mesures');
  const carte = parClasse(o, 'salle-avis-taille');
  await cliquer(o, 'Voir « Manger simple »');
  egal([carte.length, carte.length && /^Avis : /.test(carte[0].textContent), o.v.ecran, o.v.noteType], [1, true, 'note', 'manger'],
    'mesures : l\'avis de la taille s\'affiche, commence par « Avis », et ouvre « Manger simple »');
});

// 2.31.0 : l'écran Mesures montre le repère de l'objectif (épaules ÷ taille) et ce que les mesures changeront au programme.
rendu('mesures : la forme en V (épaules ÷ taille) et les contrôles à 12 semaines', async () => {
  simulerDate('2026-11-17T18:00:00');
  const avec = texte(vueC(pluginC({ etat: { mesures: [{ date: '2026-11-10', poids: 70 }, { date: '2026-11-15', epaules: 107, bras: 34, taille: 75 }] } }), 'mesures'));
  const sans = texte(vueC(pluginC({ etat: { mesures: [{ date: '2026-11-10', poids: 70 }] } }), 'mesures'));
  egal([['Ta forme en V', 'Épaules ÷ taille : 1,43', 'ce chiffre doit monter', 'Tes mesures règlent ton programme', 'Sans 0,5 cm de plus, tes bras gagnent une série (avis).'].map((t) => avec.indexOf(t) >= 0),
    sans.indexOf('Ta forme en V') >= 0, sans.indexOf('règlent ton programme') >= 0], [[true, true, true, true, true], false, false],
    'mesures : la forme en V (épaules ÷ taille) et les contrôles à 12 semaines');
});
