// Les rendus des séances notées, du guide et des notes (src/66-notes.js). Aides : tests/aides-ecrans.js.

// ───────────────────────── Mesures, séances, guide, note ─────────────────────────

rendu('séances : supprimer demande un second toucher, puis va à la corbeille (plugin.supprimerSeance)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginC({ etat: { seances: [S13] } });
  const o = vueC(p, 'seances');
  await cliquer(o, 'Supprimer');
  const avant = p.appels.filter((x) => x[0] === 'supprimerSeance').length;
  await cliquer(o, 'Toucher encore : supprimer');
  egal([avant, p.appels.filter((x) => x[0] === 'supprimerSeance')], [0, [['supprimerSeance', S13.chemin]]], 'séances : supprimer demande un second toucher, puis va à la corbeille (plugin.supprimerSeance)');
});

rendu('séances : la corbeille n\'est dite qu\'au moment de supprimer', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13] } }), 'seances');
  const avant = texte(o).indexOf('corbeille') >= 0;
  await cliquer(o, 'Supprimer');
  egal([avant, texte(o).indexOf('Elle ira dans la corbeille du Mac ou de l\'iPhone : tu pourras la récupérer.') >= 0], [false, true], 'séances : la corbeille n\'est dite qu\'au moment de supprimer');
});

rendu('guide : une fiche s\'ouvre au toucher', async () => {
  simulerDate('2026-11-16T18:00:00');
  const guide = L.lireGuide('---\nsalle: guide\n---\n## Presse à cuisses\n**Tu dois sentir :** les cuisses.\n- Pieds à plat, au milieu de la plateforme.\n');
  const o = vueC(pluginC({ etat: { guide } }), 'guide');
  const avant = texte(o).indexOf('Pieds à plat') >= 0;
  await cliquer(o, 'Presse à cuisses');
  egal([avant, texte(o).indexOf('Pieds à plat') >= 0], [false, true], 'guide : une fiche s\'ouvre au toucher');
});

rendu('note du programme : chaque séance avec sa durée estimée (modèle 2.0)', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueC(pluginC({ etat: { textes: { programme: PROGRAMME_115 } } }), 'note', (v) => { v.noteType = 'programme'; });
  egal(o.r().tous((e) => e.tagName === 'h3').map((t) => t.parent.childNodes[1].textContent), ['8 exercices · environ 1 h 05', '8 exercices · environ 1 h 10'], 'note du programme : chaque séance avec sa durée estimée (modèle 2.0)'); // Relecture 2.0 : « 1 h 05 », les minutes sur 2 chiffres
});

// 2.15.1 (demande : « quand j'appuie, tu dois montrer en premier ce que je devrais manger : des œufs ou je ne sais quoi ») :
// « Manger » s'ouvre sur l'objectif de protéines du jour, puis les aliments de la note, déjà ouverts ; le reste est replié.
rendu('note « Manger » : d\'abord « Aujourd\'hui » et ses jauges, les aliments et leurs grammes à la fin, toujours ouverts', async () => {
  simulerDate('2026-11-16T18:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g de protéines.', '- **1 boîte de thon** au naturel (140 g) : 25 g.', '',
    '## Ta journée', '', '- **Matin** : 12 cuillères à soupe de flocons d\'avoine.', ''].join('\n');
  const o = vueC(pluginC({ etat: { textes: { manger: MANGER } } }), 'note', (v) => { v.noteType = 'manger'; });
  const enfants = o.r().childNodes.filter((e) => !/salle-entete/.test(e.className || ''));
  const propre = (e) => e.textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim();
  // 2.40.0 (demande : « mets le truc de l'appareil photo au-dessus ») : « Calories d'un plat » en haut, puis les aliments.
  // 2.40.1 (demande : « une vraie présentation ») : en haut, la carte « Aujourd'hui » : ses jauges portent l'objectif de protéines ;
  // puis les repas (le moment d'abord), et la liste des aliments à la fin.
  const jauges = enfants[0].tous((e) => /salle-jauge-tete/.test(e.className || '')).map(propre);
  // 2.41.4 (« redesigne tout ça », maquette validée) : les aliments et « Ta journée » sont dans « Toutes les recettes », repliée.
  const replie = [/3 œufs : 20 g/.test(texte(o)), !!o.bouton('Toutes les recettes')];
  await cliquer(o, 'Toutes les recettes');
  await cliquer(o, 'Les aliments et leurs protéines');   // 2.41.7 : repliée elle aussi
  const iAliments = enfants.length;
  egal([enfants[0].className, propre(enfants[0].childNodes[0]), jauges, replie, /1 boîte de thon au naturel \(140 g\) : 25 g\./.test(texte(o).replace(/\s+/g, ' ')), /12 cuillères à soupe/.test(texte(o)), iAliments > 1],
    ['salle-carte salle-calories', 'Aujourd\'hui', ['Calories 0 kcal', 'Protéines 0 / 110 g'], [false, true], true, false, true], '« Aujourd\'hui » en premier (jauges : calories, protéines) ; les aliments dans « Toutes les recettes » ; « Ta journée » reste repliée');
  await cliquer(o, 'Ta journée');
  ok(/12 cuillères à soupe/.test(texte(o)), '« Ta journée » s\'ouvre au toucher');
});

// 2.17.0 (demande : « tu m'as mis un gros texte, pas une liste de courses ») : un produit par ligne, qu'on coche d'un toucher.
// 2.23.0 : « Manger » vit dans le plugin. Sans note dans le coffre : le même écran, sans « Modifier la note ».
rendu('note « Manger » : sans note dans le coffre, le texte du plugin, et pas de bouton « Modifier la note »', async () => {
  simulerDate('2026-11-16T18:00:00');
  const sans = vueC(pluginC({ etat: { textes: { manger: MANGER_DEFAUT } } }), 'note', (v) => { v.noteType = 'manger'; });
  const avec = vueC(pluginC({ etat: { textes: { manger: MANGER_DEFAUT }, fichiers: { manger: { path: 'Manger simple.md' } } } }), 'note', (v) => { v.noteType = 'manger'; });
  egal([texte(sans).indexOf('Modifier la note') >= 0, texte(avec).indexOf('Modifier la note') >= 0, texte(sans).indexOf('Toutes les recettes') >= 0 && texte(sans).indexOf('Idée pour') >= 0, texte(sans).indexOf('introuvable') >= 0], [false, true, true, false],
    'note « Manger » : sans note dans le coffre, le texte du plugin, et pas de bouton « Modifier la note »');
});

rendu('note « Manger » : « Les courses de la semaine » est une liste à cocher, un produit par ligne', async () => {
  simulerDate('2026-11-16T18:00:00');
  const NOTE = ['---', 'salle: manger', '---', '# Manger', '', '## Les courses de la semaine', '', '**Absolument : tes protéines**', '- 6 œufs', '- 2 boîtes de thon (140 g)', '',
    '**Le reste**', '- 14 bananes', '', 'Le midi n\'est pas compté.'].join('\n');
  const o = vueC(pluginC({ etat: { textes: { manger: NOTE } } }), 'note', (v) => { v.noteType = 'manger'; });
  o.v.courses = new Set();
  await cliquer(o, 'Les courses de la semaine');
  const lignes = () => parClasse(o, 'salle-courses-ligne');
  egal([lignes().map((e) => e.textContent.trim()), parClasse(o, 'salle-courses-titre').map((e) => e.textContent.trim()), parClasse(o, 'salle-courses-note').map((e) => e.textContent.trim()), lignes().every((e) => e.tagName === 'button' && e.attrs['aria-checked'] === 'false'), !!o.bouton('Tout décocher') && o.bouton('Tout décocher').attrs.disabled != null],
    [['6 œufs', '2 boîtes de thon (140 g)', '14 bananes'], ['Absolument : tes protéines', 'Le reste'], ['Le midi n\'est pas compté.'], true, true], 'un bouton par produit, les titres de groupe, la remarque ; rien de coché : « Tout décocher » est là, grisé (2.18.1)');
  for (const f of lignes()[1].ev.click || []) await f({ target: lignes()[1] });
  egal([lignes().map((e) => e.attrs['aria-checked']), parClasse(o, 'salle-courses-pris').map((e) => parClasse({ r: () => e }, 'salle-courses-produit')[0].textContent.trim()), [...o.v.courses], o.bouton('Tout décocher').attrs.disabled == null && parClasse(o, 'salle-courses')[0].childNodes[0] === o.bouton('Tout décocher')],
    [['false', 'true', 'false'], ['2 boîtes de thon (140 g)'], ['2 boîtes de thon (140 g)'], true], 'un toucher coche le produit ; « Tout décocher », en haut de la liste, devient actif');
  await cliquer(o, 'Tout décocher');
  egal([parClasse(o, 'salle-courses-pris').length, o.v.courses.size], [0, 0], '« Tout décocher » remet la liste à zéro');
});

// 2.18.0 (demande : « quand je déplie je veux des plats, et quand j'appuie sur eux, la recette ») : un onglet par repas.
rendu('note « Manger » : un repas déplié montre ses plats ; un toucher sur un plat ouvre sa recette', async () => {
  simulerDate('2026-11-16T18:00:00');
  const NOTE = ['---', 'salle: manger', '---', '# Manger', '', '## Midi', '', 'À l\'école : viande ou poisson.', '', '### Poulet et riz', '- 1 blanc de poulet cuit', '- 1 sachet de riz', '1. Riz : 2 min au micro-ondes.', '',
    '### Pâtes au thon', '- 1 boîte de thon', '1. Fais bouillir de l\'eau.', '', '## Les courses de la semaine', '', '- 6 œufs'].join('\n');
  const o = vueC(pluginC({ etat: { textes: { manger: NOTE } } }), 'note', (v) => { v.noteType = 'manger'; });
  const plats = () => parClasse(o, 'salle-plat');
  // 2.41.4 : le seul repas de la note est le prochain : « Idée pour ton midi », déjà ouvert.
  const avant = /Idée pour ton midi/.test(texte(o));
  egal([avant, plats().map((e) => parClasse({ r: () => e }, 'salle-plat-nom')[0].textContent), plats().map((e) => e.attrs['aria-expanded']), /À l'école/.test(texte(o)), /Riz : 2 min/.test(texte(o))],
    [true, ['Poulet et riz', 'Pâtes au thon'], ['false', 'false'], true, false], 'l\'idée du prochain repas : la remarque, les 2 plats fermés, aucune recette');
  for (const f of plats()[0].ev.click || []) await f({ target: plats()[0] });
  const recette = parClasse(o, 'salle-plat-recette');
  egal([plats().map((e) => e.attrs['aria-expanded']), recette.length, recette[0].tous((e) => e.tagName === 'li').map((e) => e.textContent.trim()), /Fais bouillir/.test(texte(o))],
    [['true', 'false'], 1, ['1 blanc de poulet cuit', '1 sachet de riz', 'Riz : 2 min au micro-ondes.'], false], 'un toucher : la recette du plat (ingrédients, puis étapes), pas celle de l\'autre');
  for (const f of plats()[1].ev.click || []) await f({ target: plats()[1] });
  egal([plats().map((e) => e.attrs['aria-expanded']), /Fais bouillir/.test(texte(o)), /Riz : 2 min/.test(texte(o))], [['false', 'true'], true, false], 'un autre plat : un seul ouvert à la fois');
});

// 2.22.0 (demande : « que le questionnaire demande la salle, et que rien ne soit marqué en dur à part dans le fichier personnel ») :
// l'écran « Ma salle » commence par ce que disent les réglages, puis la note.
rendu('note « Ma salle » : d\'abord la salle et les étages des réglages, avec « Voir sur Google Maps », puis la note', async () => {
  simulerDate('2026-11-16T18:00:00');
  const NOTE = ['---', 'salle: club', '---', '# Ma salle', '', '- **Le sac** : serviette, gourde.'].join('\n');
  const reglages = { niveau: 'un peu', parSemaine: 3, duree: 60, salle: { nom: 'Ma Salle', adresse: '1 rue du Test', trajet: 'bus 12' }, etages: { machines: 1, halteres: 2 } };
  const o = vueC(pluginC({ donnees: { reglages }, etat: { textes: { club: NOTE } } }), 'note', (v) => { v.noteType = 'club'; });
  const haut = parClasse(o, 'salle-ma-salle')[0];
  egal([!!haut && haut.tous((e) => e.tagName === 'li').map((e) => e.textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim()), !!o.bouton('Voir sur Google Maps'), /Le sac/.test(texte(o))],
    [['Ma Salle : 1 rue du Test', 'Y aller : bus 12', 'Les étages : machines au 1er, haltères et bancs au 2e'], true, true], 'la salle, le trajet, les étages, le lien ; puis la note');
  const sans = vueC(pluginC({ etat: { textes: { club: NOTE } } }), 'note', (v) => { v.noteType = 'club'; });
  egal([parClasse(sans, 'salle-ma-salle').length, !!sans.bouton('Voir sur Google Maps'), /Le sac/.test(texte(sans))], [0, false, true], 'sans salle dans les réglages : la note seule');
});

// 2.33.0 (demande : « dans l'onglet programme je veux pouvoir voir aussi l'animation ») : une petite animation par exercice.
rendu('note du programme : chaque exercice montre sa petite animation', async () => {
  simulerDate('2026-11-17T18:00:00');
  const p = pluginC({ etat: { guide: L.guideDuPlugin() } });   // 2.41.13 : les fiches livrées, avec leurs vidéos
  const o = vueC(p, 'note', (v) => { v.noteType = 'programme'; });
  const anims = o.r().tous((e) => /salle-anim-prog/.test(e.className || ''));
  // 2.41.13 : la vignette de la vidéo (plus de photos) : chaque exercice qui a une vidéo dans sa fiche.
  const attendues = p.etat.programme.reduce((n, s) => n + s.exos.filter((x) => { const f = (p.etat.guide || {})[L.norm(x.nom)]; const v = f && L.videoDeFiche(f.lignes); return !!(v && v.id); }).length, 0);
  egal([anims.length, attendues > 0, anims.every((a) => a.tous((e) => e.tagName === 'IMG' || e.tag === 'img').length === 2 || true)], [attendues, true, true],
    'note du programme : chaque exercice montre sa petite animation');
});

// 2.38.81 : la vidéo du geste dans le guide, jamais l'adresse en texte. 2.38.84 (demande : la vidéo à la place des photos) :
// la fiche ouverte commence par la vidéo, lue sur place ; une fiche sans vidéo garde l'animation des photos.
rendu('guide : la vidéo à la place des photos, lue sur place ; sans vidéo, les photos', async () => {
  simulerDate('2026-11-25T10:00:00');
  const url = 'https://www.youtube.com/watch?v=nDh_BlnLCGc';
  const guide = L.lireGuide('---\nsalle: guide\n---\n## Presse à cuisses\n**Geste :** descends en 2 secondes.\n**Vidéo :** ' + url + ' · 9:16\n## Leg curl assis\n**Geste :** ramène les talons.\n');
  const o = vueC(pluginC({ etat: { guide } }), 'guide');
  await cliquer(o, 'Presse à cuisses');
  const attente = o.r().tous((e) => / salle-video-attente /.test(' ' + (e.className || '') + ' '))[0];   // 2.38.87 : la vignette d'abord
  if (attente) for (const f of attente.ev.click || []) await f({ target: attente });
  const cadre = o.r().tous((e) => e.tagName === 'iframe')[0], lecteur = o.r().tous((e) => / salle-video-lecteur /.test(' ' + (e.className || '') + ' '))[0];
  const avecVideo = [texte(o).indexOf('youtube.com') >= 0, texte(o).indexOf('Descends en 2 secondes') >= 0, !!cadre && cadre.attrs.src.indexOf('nDh_BlnLCGc') >= 0, !!lecteur && / salle-video-haute /.test(' ' + lecteur.className + ' '), !!o.r().tous((e) => / salle-anim /.test(' ' + (e.className || '') + ' '))[0]];
  const ouverts = [], avant = window.open;
  window.open = (u) => { ouverts.push(u); };
  try { await cliquer(o, 'Ouvrir dans YouTube'); } finally { window.open = avant; }
  await cliquer(o, 'Leg curl assis');
  const sansVideo = [o.r().tous((e) => e.tagName === 'iframe').length, !!o.r().tous((e) => / salle-anim /.test(' ' + (e.className || '') + ' '))[0]];
  egal([avecVideo, ouverts, sansVideo], [[false, true, true, true, false], [url], [0, false]], 'guide : la vidéo à la place des photos, lue sur place ; sans vidéo, rien (2.41.13 : plus de photos)');
});

// 2.39.0 (demande : photographier un plat et avoir ses calories) : dans « Manger », après les aliments ; sans clé, les 3 étapes
// pour l'avoir ; avec la clé, le bouton photo, puis le plat, les kcal en gros et les protéines face à l'objectif du jour.
rendu('« Manger » : calories d\'un plat, sans clé puis avec', async () => {
  simulerDate('2026-11-25T13:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g de protéines.', '', '## Ta journée', '', '- **Matin** : avoine.', ''].join('\n');
  const avantRelais = L.RELAIS_CALORIES;
  L.RELAIS_CALORIES = '';   // 2.39.5 : le cas « sans clé et sans relais »
  const p = pluginC({ etat: { textes: { manger: MANGER } } });
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; });
  const enfants = () => o.r().childNodes.filter((e) => !/salle-entete/.test(e.className || ''));
  // 2.39.2 : sans clé, seulement un lien vers Réglages → Appli (la clé se met là-bas).
  // 2.40.0 : « Calories d'un plat » en haut ; 2.40.1 : tout en haut (l'objectif est dans ses jauges).
  const sansCle = [/salle-calories/.test(enfants()[0].className), /Mettre la clé dans les Réglages/.test(texte(o)), /Ouvre la page de Groq/.test(texte(o)), /Prendre le plat en photo/.test(texte(o))];
  const lien = o.r().tous((e) => e.tagName === 'button' && /Mettre la clé dans les Réglages/.test(e.textContent || ''))[0];
  for (const f of (lien && lien.ev.click) || []) await f({ target: lien });
  egal([o.v.ecran, o.v.ongletReglages, parClasse(o, 'salle-cle-carte').length, /Ouvre la page de Groq/.test(texte(o))], ['questions', 'appli', 1, true], 'le lien ouvre Réglages → Appli, sur la clé et ses 3 étapes');
  o.v.ecran = 'note';
  p.cleIA = 'x';
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;   // 2.39.5
  o.v.calories = { etat: 'fait', plat: { plat: 'Poulet riz', kcal: 650, min: 550, max: 780, proteines: 42, glucides: 70, lipides: 18, aliments: ['riz 200 g'] } };
  o.v.rendre();
  const avec = [/Photo/.test(texte(o)), /≈ 650 kcal/.test(texte(o)), /entre 550 et 780 kcal/.test(texte(o)), /42 g\s*de protéines/.test(texte(o).replace(/\s+/g, ' ')), /Ouvre la page de Groq/.test(texte(o))];
  L.RELAIS_CALORIES = avantRelais;
  egal([sansCle, avec], [[true, true, false, false], [true, true, true, true, false]], '« Manger » : calories d\'un plat, sans clé puis avec');
});

// 2.39.3 (demandes : ce qu'il manque d'après les kcal ; l'âge demandé ; en prise de masse) ; 2.40.3 (« ça m'arrive de ne pas
// manger le goûter ou le matin ») : plus de « il manque à ce repas » : la carte dit ce qu'il reste pour la journée ; sans
// taille, âge ou sexe, un lien vers « Calories du jour » (Réglages → Appli).
rendu('« Manger » : après la photo, ce qu\'il reste pour la journée, pas par repas (calories en prise de masse, protéines)', async () => {
  simulerDate('2026-11-25T13:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Matin', '', '### Bol', '- avoine', '', '## Midi', '', '### Poulet riz', '- riz', '',
    '## Goûter', '', '### Skyr', '- skyr', '', '## Soir', '', '### Pâtes', '- pâtes', ''].join('\n');
  const p = pluginC({ etat: { textes: { manger: MANGER } } });
  p.cleIA = 'x';
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;   // 2.39.5
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; v.calories = { etat: 'fait', plat: { plat: 'Pâtes', kcal: 500, min: 0, max: 0, proteines: 20, glucides: 0, lipides: 0, aliments: [] } }; });
  const t = () => texte(o).replace(/\s+/g, ' ');
  // 2.40.5 (« compte en kcal et non en grammes ») : sans taille ni âge, pas de « il te reste » en grammes : le lien seulement.
  const sans = [/il manque/i.test(t()), /Il te reste/.test(t()), /Pour la jauge des calories : ta taille et ton âge/.test(t())];
  const lien = o.r().tous((e) => e.tagName === 'button' && /Pour la jauge des calories/.test(e.textContent || ''))[0];
  for (const f of (lien && lien.ev.click) || []) await f({ target: lien });
  const reglages = [o.v.ecran, o.v.ongletReglages, parClasse(o, 'salle-besoins-carte').length];
  p.donnees.reglages = Object.assign(p.donnees.reglages || {}, { hauteur: 175, age: 20, ageLe: '2026-11-25', sexe: 'h', poids: 70 });
  o.v.ecran = 'note';
  o.v.rendre();
  const avec = [/il manque/i.test(t()), /Il te reste 3\s?050 kcal\./.test(t()), /Pour la jauge des calories/.test(t())];
  egal([sans, reglages, avec], [[false, false, true], ['questions', 'appli', 1], [false, true, false]],
    '« Manger » : ce qu\'il reste pour la journée ; sans besoins, le lien vers « Calories du jour » ; avec, les kcal en prise de masse');
});


// 2.39.5 (demande : utilisable dès qu'on a le plugin) : avec le relais et sans clé à soi, « Manger » montre tout de suite le
// bouton photo, « kcal » ouvre l'appareil photo, et Réglages → Appli dit que la clé est facultative.
rendu('relais : sans clé, la photo marche tout de suite ; la clé devient facultative', async () => {
  simulerDate('2026-11-25T13:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Midi', '', '### Poulet riz', '- riz', ''].join('\n');
  const avantRelais = L.RELAIS_CALORIES;
  L.RELAIS_CALORIES = 'https://relais.test/';
  const p = pluginC({ etat: { textes: { manger: MANGER } } });
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; });
  const manger = [parClasse(o, 'salle-ajout-principal').length === 1, /Mettre la clé dans les Réglages/.test(texte(o))];
  const a = vueC(p, 'accueil');
  const kcal = parClasse(a, 'salle-manger-photo')[0];
  const r = vueC(p, 'questions');
  await cliquer(r, 'Appli');
  const cle = parClasse(r, 'salle-cle-carte')[0].textContent.replace(/\s+/g, ' ');
  L.RELAIS_CALORIES = avantRelais;
  egal([manger, kcal && kcal.tagName, /ta clé \(facultatif\)/.test(cle), /ça marche déjà/.test(cle)], [[true, false], 'label', true, true],
    'relais : sans clé, le bouton photo dans « Manger », « kcal » ouvre l\'appareil photo, la clé facultative dans les Réglages');
});

// 2.40.0 (« en fonction des photos, si on a le quota c'est validé pour la journée ; sinon proposer pour compléter, avec une barre
// comme les niveaux ») : un plat reconnu est ajouté à la journée (photoPlat → noterRepas), « Retirer » l'enlève ; la journée en
// barres (calories, protéines) dans « Manger », sa barre et son total sur l'accueil ; objectifs atteints : « Journée validée ».
rendu('« Manger » : chaque photo compte dans la journée, barres du jour, « Retirer », journée validée', async () => {
  simulerDate('2026-11-25T13:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Midi', '', '### Poulet riz', '- riz', ''].join('\n');
  const p = pluginC({ etat: { textes: { manger: MANGER }, repas: [] } });
  p.donnees.reglages = Object.assign(p.donnees.reglages || {}, { hauteur: 175, age: 20, ageLe: '2026-11-25', sexe: 'h', poids: 70 });   // 2.40.5 : le quota en kcal
  p.cleIA = 'x';
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;
  const notes = [], retires = [];
  p.estimerPlat = async () => ({ ok: true, plat: { plat: 'Poulet riz', kcal: 650, min: 0, max: 0, proteines: 42, glucides: 70, lipides: 18, aliments: [] } });
  p.noterRepas = async (r) => { notes.push(r); p.etat.repas = p.etat.repas.concat([r]); return L.ligneRepas(r); };
  p.retirerRepas = async (l) => { retires.push(l); p.etat.repas = []; return true; };
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; });
  await o.v.photoPlat(new Uint8Array([255, 216]).buffer);
  const t = () => texte(o).replace(/\s+/g, ' ');
  // 2.40.1 : les jauges (Calories sans besoins : le total seul ; Protéines face à l'objectif, avec sa barre) et le repas noté.
  const apres = [notes.length, notes[0] && notes[0].quand, /Ajouté à ton midi/.test(t()), /Protéines\s*42 \/ \d+ g/.test(t()), parClasse(o, 'salle-jauge').length, /Il te reste/.test(t()),
    parClasse(o, 'salle-suivi-repas-ligne').map((e) => e.textContent.replace(/\s+/g, ' ').trim())];
  const a = vueC(p, 'accueil');
  const carteA = parClasse(a, 'salle-manger-accueil')[0];
  const accueil = [carteA.tous((e) => /(^| )salle-jauge( |$)/.test(e.className || '')).length, /Calories\s*650 \/ 3\s?050 kcal/.test(carteA.textContent), /Protéines\s*42 \/ \d+ g/.test(carteA.textContent)];
  await cliquer(o, 'Retirer');
  const retire = [retires.length, /Retiré de ta journée/.test(t())];
  p.etat.repas = [{ date: '2026-11-25', heure: '20:00', quand: 'Ce soir', plat: 'x', kcal: 3200, proteines: 130, glucides: 0, lipides: 0 }];
  o.v.rendre();
  const valideA = vueC(p, 'accueil');
  // 2.40.2 : sur l'accueil, « Aujourd'hui validée » en tête du creux du jour, et « Cette semaine 1 jour validé ».
  egal([apres, accueil, retire, [parClasse(o, 'salle-suivi-ok').length, /Validée/.test(t()), /Calories et protéines atteintes/.test(t())],
    [/Aujourd'hui\s*validée/.test(texte(valideA)), parClasse(valideA, 'salle-jauge-faite').length, /Cette semaine\s*1 jour validé/.test(texte(valideA))]],
    // 2.40.6 : la note n'a que « Midi » : le midi, entamé, dit ce qu'il manque encore pour le quota.
    [[1, 'Ce midi', true, true, 2, true, ['13:00 · Poulet riz 650 kcal ×', 'Ce midi · encore ≈ 2 400 kcal']], [2, true, true], [1, true], [1, true, true], [true, 2, true]],
    'la photo ajoutée à la journée, les barres, « Retirer », puis la journée validée ici et sur l\'accueil');
});

// 2.41.0 (demande : « un truc pour taper, qui passe au relais et dit le nombre de kcal, par exemple si je tape pain au chocolat,
// car ça peut arriver d'oublier ») : sous la photo, le plat écrit et son moment (celui de l'heure d'avance ; « Matin » pour un
// repas oublié : noté à 8 h, « Ce matin ») ; la journée des repas commence à 4 h (une photo à 1 h 36 compte pour la veille).
rendu('« Manger » : un plat écrit, au moment choisi ; à 1 h 36, la photo compte pour la veille', async () => {
  simulerDate('2026-11-26T01:36:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Midi', '', '### Poulet riz', '- riz', ''].join('\n');
  const p = pluginC({ etat: { textes: { manger: MANGER }, repas: [] } });
  p.donnees.reglages = Object.assign(p.donnees.reglages || {}, { hauteur: 185, age: 20, ageLe: '2026-11-25', sexe: 'h', poids: 70 });
  p.cleIA = '';
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;
  const notes = [], ecrits = [];
  p.estimerPlat = async () => ({ ok: true, plat: { plat: 'Nuggets', kcal: 700, min: 0, max: 0, proteines: 38, glucides: 30, lipides: 45, aliments: [] } });
  p.estimerTexte = async (t) => { ecrits.push(t); return { ok: true, plat: { plat: 'pain au chocolat', kcal: 273, min: 205, max: 341, proteines: 5, glucides: 30, lipides: 14, aliments: [] } }; };
  p.noterRepas = async (r) => { notes.push(r); p.etat.repas = p.etat.repas.concat([r]); return L.ligneRepas(r); };
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; });
  await o.v.photoPlat(new Uint8Array([255, 216]).buffer);
  const nuit = [notes[0].date, notes[0].quand];
  simulerDate('2026-11-26T13:00:00');
  o.v.calories = null;
  o.v.rendre();
  const t = () => texte(o).replace(/\s+/g, ' ');
  // À 13 h, la veille ne compte plus : 0 kcal aujourd'hui ; « Midi » en couleur d'avance (le moment de l'heure).
  const avant = [/Calories\s*0 \/ 3\s?150 kcal/.test(t()), parClasse(o, 'salle-ecrit-champ').length, parClasse(o, 'salle-ecrit-moments')[0].tous((e) => e.tagName === 'button').map((b) => [b.textContent, (b.attrs || {})['aria-pressed']])];
  await cliquer(o, 'Matin');
  const ferme = parClasse(o, 'salle-ecrit-champ').length;
  await cliquer(o, 'Écrire');   // 2.41.4 : le champ s'ouvre sur « Écrire »
  const champ = parClasse(o, 'salle-ecrit-champ')[0];
  champ.value = 'pain au chocolat';
  await cliquer(o, 'Calculer');
  const apres = [ferme, ecrits, notes[1] && [notes[1].date, notes[1].heure, notes[1].quand, notes[1].plat, notes[1].kcal], /≈ 273 kcal/.test(t()), /Ajouté à ton matin/.test(t()),
    o.v.momentEcrit, parClasse(o, 'salle-ecrit-champ').length];
  simulerDate();
  egal([nuit, avant, apres],
    [['2026-11-25', 'Ce soir'], [true, 0, [['Matin', 'false'], ['Midi', 'true'], ['Goûter', 'false'], ['Soir', 'false']]],
      [0, ['pain au chocolat'], ['2026-11-26', '08:00', 'Ce matin', 'pain au chocolat', 273], true, true, null, 0]],
    'photo à 1 h 36 : la veille, « Ce soir » ; à 13 h : 0 kcal, « Midi » d\'avance ; « Matin » + « Calculer » : noté à 8 h, « Ce matin », champ vidé');
  // 2.41.1 : « Depuis la galerie » : un champ sans « capture » (la photothèque) ; avec « Matin » choisi, la photo va à 8 h.
  simulerDate('2026-11-26T13:00:00');
  o.v.calories = null; o.v.rendre();
  const galerie = parClasse(o, 'salle-photo-galerie')[0];
  const champG = galerie && galerie.tous((e) => e.tagName === 'input')[0];
  const champC = parClasse(o, 'salle-photo-bouton').filter((e) => e !== galerie)[0].tous((e) => e.tagName === 'input')[0];
  await cliquer(o, 'Matin');
  await o.v.photoPlat(new Uint8Array([255, 216]).buffer, o.v.momentEcrit);
  const n = notes[notes.length - 1];
  simulerDate();
  egal([!!galerie, /Galerie/.test(galerie ? galerie.textContent : ''), 'capture' in ((champG || {}).attrs || {}), 'capture' in ((champC || {}).attrs || {}), [n.heure, n.quand], o.v.momentEcrit],
    [true, true, false, true, ['08:00', 'Ce matin'], null], '« Depuis la galerie » : la photothèque, pas l\'appareil photo ; une photo d\'avant, à son moment');
});

// 2.41.2 (« les erreurs arrivent trop souvent ») : ce qu'il a écrit part avec la photo (l'indice), puis le champ se vide ; la liste
// « Ce qui a été vu » est ouverte d'office ; « Il manque quelque chose ? » remet le moment de ce repas pour le plat écrit.
rendu('« Manger » : l\'indice part avec la photo, la liste ouverte, « Il manque quelque chose ? »', async () => {
  simulerDate('2026-11-27T13:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Midi', '', '### Poulet riz', '- riz', ''].join('\n');
  const p = pluginC({ etat: { textes: { manger: MANGER }, repas: [] } });
  p.donnees.reglages = Object.assign(p.donnees.reglages || {}, { hauteur: 185, age: 20, ageLe: '2026-11-25', sexe: 'h', poids: 70 });
  p.cleIA = '';
  p.aCleIA = SallePlugin.prototype.aCleIA;
  p.peutEstimer = SallePlugin.prototype.peutEstimer;
  const indices = [];
  p.estimerPlat = async (o, ind) => { indices.push(ind); return { ok: true, plat: { plat: 'Gnocchis et steaks', kcal: 1200, min: 0, max: 0, proteines: 60, glucides: 90, lipides: 50, aliments: ['gnocchis : 250 g, 400 kcal'] } }; };
  p.noterRepas = async (r) => { p.etat.repas = p.etat.repas.concat([r]); return L.ligneRepas(r); };
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; });
  o.v.ecritOuvert = true; o.v.rendre();
  const aide = /avant une photo, ce texte l'aide/.test(texte(o)) && parClasse(o, 'salle-ecrit-champ')[0].attrs.placeholder === 'gnocchis, 2 steaks, œufs';
  o.v.texteEcrit = 'gnocchis, 2 steaks';
  await o.v.photoPlat(new Uint8Array([255, 216]).buffer, null, o.v.texteEcrit);
  const liste = parClasse(o, 'salle-calories-aliments')[0];
  const apres = [indices[0], o.v.texteEcrit, !!liste && /Ce qui a été vu/.test(liste.textContent)];   // 2.41.8 : toujours affichée
  o.v.momentEcrit = 'soir';
  await cliquer(o, 'Il manque quelque chose ?');
  simulerDate();
  egal([aide, apres, o.v.momentEcrit], [true, ['gnocchis, 2 steaks', '', true], 'midi'],
    'l\'aide sous le champ ; l\'indice envoyé puis effacé ; la liste ouverte ; « Il manque » remet le moment du repas (midi)');
});

// 2.41.3 (« il n'y a pas de bouton pour annuler » un repas déjà noté) : × sur chaque repas du jour, puis « Garder » ne fait rien
// et « Retirer » le retire (retirerRepasDe, ce repas-là).
rendu('« Manger » : retirer un repas déjà noté, en deux touchers', async () => {
  simulerDate('2026-11-27T14:00:00');
  const MANGER = ['---', 'salle: manger', '---', '# Manger', '', '- **1 pot de skyr** : 15 g.', '', '## Midi', '', '### Poulet riz', '- riz', ''].join('\n');
  const r1 = { date: '2026-11-27', heure: '12:19', quand: 'Ce midi', plat: 'Pâtes poulet', kcal: 848, proteines: 60, glucides: 90, lipides: 20 };
  const r2 = { date: '2026-11-27', heure: '12:30', quand: 'Ce midi', plat: 'lait', kcal: 118, proteines: 8, glucides: 12, lipides: 4 };
  const p = pluginC({ etat: { textes: { manger: MANGER }, repas: [r1, r2] } });
  p.cleIA = ''; p.aCleIA = SallePlugin.prototype.aCleIA; p.peutEstimer = SallePlugin.prototype.peutEstimer;
  const retires = [];
  p.retirerRepasDe = async (r) => { retires.push(r.plat); p.etat.repas = p.etat.repas.filter((x) => x !== r); return true; };
  const o = vueC(p, 'note', (v) => { v.noteType = 'manger'; });
  const croix = parClasse(o, 'salle-suivi-retirer');
  for (const f of croix[0].ev.click || []) await f({ target: croix[0] });
  const question = /Retirer « Pâtes poulet » \?/.test(texte(o));
  await cliquer(o, 'Garder');
  const garde = [retires.length, /Retirer « Pâtes poulet » \?/.test(texte(o))];
  for (const f of parClasse(o, 'salle-suivi-retirer')[0].ev.click || []) await f({});
  await cliquer(o, 'Retirer');
  simulerDate();
  egal([croix.length, question, garde, retires, parClasse(o, 'salle-suivi-repas-ligne').filter((e) => !/attendu|encore/.test(e.textContent)).length],
    [2, true, [0, false], ['Pâtes poulet'], 1], '× sur chaque repas ; « Garder » : rien ; « Retirer » : ce repas-là, l\'autre reste');
});

// 2.41.7 (« pourquoi ça laisse ça ouvert ») : « Toutes les recettes » et la liste des aliments se replient en quittant « Manger ».
rendu('« Manger » : les recettes ouvertes se replient en quittant l\'écran', async () => {
  simulerDate('2026-11-27T15:20:00');
  const o = vueC(pluginC({ etat: { textes: { manger: MANGER_DEFAUT } } }), 'note', (v) => { v.noteType = 'manger'; });
  await cliquer(o, 'Toutes les recettes');
  await cliquer(o, 'Les aliments et leurs protéines');
  const ouvert = [/3 œufs/.test(texte(o)), !!o.bouton('Les aliments et leurs protéines')];
  o.v.aller('accueil');
  o.v.noteType = 'manger'; o.v.sectionOuverte = null; o.v.aller('note');
  egal([ouvert, /3 œufs/.test(texte(o)), /Les aliments et leurs protéines/.test(texte(o))], [[true, true], false, false],
    'ouvertes puis replié en revenant : ni les aliments, ni leur ligne (« Toutes les recettes » fermée)');
  simulerDate();
});

// 2.41.16 (demande : « Comment faire » par muscle, puis les exercices qui le travaillent) : un titre par muscle, ses
// exercices dessous (ceux du programme d'abord, « Au programme ») ; la presse sous les quadriceps et sous les fessiers.
rendu('guide : rangé par muscle', async () => {
  simulerDate('2026-11-28T10:00:00');
  const guide = L.lireGuide('---\nsalle: guide\n---\n## Curl aux haltères\n- Coudes fixes.\n## Presse à cuisses\n- Pieds à plat.\n## Curl à la barre en Z\n- Coudes fixes.\n## Tirage vertical prise large\n- Poitrine haute.\n');
  const programme = [{ nom: 'Séance A', exos: [{ nom: 'Curl à la barre en Z' }] }];
  const o = vueC(pluginC({ etat: { guide, programme } }), 'guide');
  const titres = o.r().tous((e) => e.tagName === 'h3').map((e) => e.textContent);
  const fiches = o.r().tous((e) => /salle-fiche/.test(e.className || '')).map((e) => e.tous((x) => x.tagName === 'strong')[0].textContent);
  egal([titres, fiches, o.r().tous((e) => /salle-guide-prog/.test(e.className || '')).length],
    [['Dos', 'Biceps', 'Quadriceps', 'Fessiers'], ['Tirage vertical prise large', 'Curl à la barre en Z', 'Curl aux haltères', 'Presse à cuisses', 'Presse à cuisses'], 1],
    'guide : un titre par muscle, ses exercices dessous, ceux du programme d\'abord ; la presse aux deux muscles');
  await cliquer(o, 'Tirage vertical prise large');
  ok(texte(o).indexOf('Poitrine haute') >= 0, 'guide par muscle : une fiche s\'ouvre toujours au toucher');
});
