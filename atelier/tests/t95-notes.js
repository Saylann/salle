// Les notes livrées (modeles/*.txt, et leur copie dans le coffre) et les images. Une règle = un test.
// Lancé par tests/lancer.js (dans un bloc isolé), après tests/commun.js : egal, vrai, avertir, lireNote, L, PROGRAMME_DEFAUT,
// FORME_DEFAUT, IMAGES, DEPARTS_PAR_KG. Les sources des règles : « La bonne séance », partie 5 (changements 1 à 11, erreurs corrigées).

// Les séances du programme 1.15.0 figé (copie des lignes de ~/Desktop/CLAUDE/Salle-travail/archives/2026-11-14-avant-2.0.0/modeles/Programme.txt), pour comparer.
const SEANCES_115 = `## Séance A

- Tirage vertical prise large · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Tractions (poids du corps)
- Développé assis à la machine · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Développé couché aux haltères
- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg · étage 1
- Tirage horizontal à la poulie · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Rowing à la machine à disques
- Élévations latérales aux haltères · 3 × 12-20 · repos 1 min 30 · pas 1 kg · étage 2
- Leg curl assis · 2 × 10-15 · repos 1 min 30 · pas 2,5 kg · étage 1 · ou Leg curl allongé
- Curl aux haltères · 2 × 10-15 · repos 1 min 30 · pas 1 kg · étage 2 · option · ou Curl à la barre en Z
- Gainage planche · 2 × 30-60 s · repos 1 min · étage 1

## Séance B

- Développé épaules aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg · étage 2 · dossier presque droit, 80 à 90° · ou Développé épaules à la machine
- Tirage vertical prise neutre · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Tractions (poids du corps)
- Développé incliné aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg · étage 2 · banc 30° (2e ou 3e cran) · ou Développé incliné à la machine
- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg · étage 1
- Leg curl assis · 3 × 10-15 · repos 1 min 30 · pas 2,5 kg · étage 1 · ou Leg curl allongé
- Élévations latérales aux haltères · 3 × 12-20 · repos 1 min 30 · pas 1 kg · étage 2
- Face pull à la poulie · 2 × 12-15 · repos 1 min 30 · pas 2,5 kg · étage 1
- Extension triceps à la poulie · 2 × 10-15 · repos 1 min 30 · pas 2,5 kg · étage 1 · option
`;

// ── Outils du fichier ──
// Un texte livré : celui de l'objectif (objectifs/esthetique/) s'il existe, sinon le texte commun (modeles/).
const DE_L_OBJECTIF = ['Programme', 'Manger simple'];
// Le guide n'est plus un fichier : il est assemblé depuis commun/exercices/ (une fiche par exercice) → GUIDE_DEFAUT.
const modele = (nom) => (nom === 'Guide des exercices' ? GUIDE_DEFAUT : lireNote((DE_L_OBJECTIF.indexOf(nom) >= 0 ? 'objectifs/esthetique/' : 'commun/') + nom + '.txt'));
const contient = (texte, morceaux) => morceaux.every((m) => String(texte).indexOf(m) >= 0);
const aucun = (texte, morceaux) => morceaux.every((m) => String(texte).indexOf(m) < 0);
const p20 = L.lireProgramme(PROGRAMME_DEFAUT), p115 = L.lireProgramme(SEANCES_115);
const seance = (p, nom) => p.find((s) => s.nom === nom) || { exos: [] };
const exoDe = (p, s, nom) => seance(p, s).exos.find((e) => e.nom === nom);
const INCLINE = 'Développé incliné aux haltères', ANCIEN_TRICEPS = 'Extension triceps à la poulie';
const TRICEPS = 'Extension triceps au-dessus de la tête à la poulie';
const intro = PROGRAMME_DEFAUT.split('\n## ')[0];   // tout ce qui est avant « ## Séance A »
const guideTexte = modele('Guide des exercices') || '';
const guide = L.lireGuide(guideTexte);
const fiche = (nom) => { const f = guide[L.norm(nom)]; return f ? f.lignes.join('\n') : ''; };
// Les exercices du programme livré et leurs remplaçants, chacun une fois.
const tousNoms = [];
p20.forEach((s) => s.exos.forEach((e) => [e.nom].concat((e.alternatives || []).map((a) => a.nom)).forEach((n) => { if (tousNoms.indexOf(n) < 0) tousNoms.push(n); })));

// ── Programme (modeles/Programme.txt = Programme.md) ──
egal(PROGRAMME_DEFAUT, modele('Programme'), 'Programme : PROGRAMME_DEFAUT est le texte de modeles/Programme.txt');
egal(p20.map((s) => [s.nom, s.exos.length]), [['Séance A', 8], ['Séance B', 8]], 'Programme : A 8 exercices, B 8, aucune puce lue hors des séances');
// 2.4.0 (« Le physique qui plaît », changement 1) : les élévations latérales de A passent de 3 à 4 séries.
// 2.5.0 (« Ce qui plaît », classement du 15/11) : le curl n'est plus « option », le gainage planche le devient ; rien d'autre.
// 2.22.0 : le programme livré n'écrit plus d'étage (ils viennent des réglages) ; l'ancien programme figé (p115) en avait.
// 2.36.1 : le programme livré est celui validé le 17/11/2026, écrit par priorités (dos et épaules, pecs et bras, jambes).
// Les comparaisons ligne à ligne avec l'ancien programme figé (p115) n'ont plus d'objet : le contenu est dit en clair.
const ELEV = 'Élévations latérales aux haltères', CURL_Z = 'Curl à la barre en Z';
const series = (s) => seance(p20, s).exos.map((e) => `${e.nom} ${e.series}`);
// 2.38.69 : l'ordre alterne les muscles (après des élévations latérales, les jambes ; jamais les bras ni le développé).
egal(series('Séance A'), ['Tirage vertical prise large 3', TRICEPS + ' 3', 'Tirage horizontal à la poulie 3', ELEV + ' 4', 'Presse à cuisses 3', 'Développé incliné à la machine 3', 'Leg curl assis 2', CURL_Z + ' 3'], 'Programme : la séance A, dans l\'ordre qui alterne les muscles (2.38.79 : sa salle, le curl avec les haltères, en dernier)');
egal(series('Séance B'), ['Tirage vertical prise neutre 4', TRICEPS + ' 3', 'Élévations latérales à la machine 3', 'Presse à cuisses 3', INCLINE + ' 4', CURL_Z + ' 3', ELEV + ' 4', 'Leg curl assis 3'], 'Programme : la séance B, dans l\'ordre qui alterne les muscles (2.38.71 : le triceps après le tirage) ; les deux élévations séparées');
egal(p20.map((s) => s.exos.filter((e) => e.priorite).map((e) => e.nom)), [['Tirage vertical prise large', 'Tirage horizontal à la poulie', ELEV], ['Tirage vertical prise neutre', INCLINE, ELEV]], 'Programme : les exercices marqués « priorité » (2.38.69) sont ceux qui passaient en premier avant le nouvel ordre');
egal(exoDe(p20, 'Séance A', TRICEPS), exoDe(p20, 'Séance B', TRICEPS), 'Programme : la même extension triceps en A et en B');
egal(exoDe(p20, 'Séance B', TRICEPS), { nom: TRICEPS, series: 3, min: 10, max: 15, unite: 'reps', repos: 90, pas: 2.5, option: false, corps: false }, 'Programme : la ligne de l\'extension triceps au-dessus de la tête');
egal(exoDe(p20, 'Séance A', CURL_Z), exoDe(p20, 'Séance B', CURL_Z), 'Programme : le même curl à la barre en Z en A et en B, les haltères en remplaçant');
vrai(p20.every((s) => s.exos.every((e) => !e.option && e.etage == null)), 'Programme : aucun exercice en option, aucun étage écrit (ils viennent des réglages)');
// Le nouveau nom est bien reconnu par la logique (contrat, partie 1.4).
const ZD = ['epaule', 'coude', 'poignet', 'bas du dos', 'genou', 'bras', 'epaules', 'pectoraux', 'dos', 'jambes'];
egal([L.famille(TRICEPS), typeof L.estBras === 'function' && L.estBras(TRICEPS), typeof L.musclesExo === 'function' && L.musclesExo(TRICEPS), L.gros(TRICEPS), ZD.filter((z) => L.zoneTouche(z, TRICEPS))],
  ['pousser', true, { triceps: 1 }, false, ['coude', 'poignet', 'bras', 'pectoraux']], 'Programme : l\'extension au-dessus de la tête est un exercice de bras qui pousse, triceps seul, petit, et ménage coude, poignet, bras, pecs');
// Changement 5 : l'en-tête juste. 15/11 : la justification (« aussi bien qu'un autre découpage ») est sortie du coffre,
// dans ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-pourquoi-des-notes.md.
vrai(aucun(intro, ['ce qui marche le mieux']), 'Programme : plus « ce qui marche le mieux »');
// Changement 6 : les séries par semaine comptées à ½, et justes : la moyenne de A-B-A et B-A-B, comme l'écran Progrès.
{
  const A = seance(p20, 'Séance A'), B = seance(p20, 'Séance B');
  const sansOption = (s) => ({ nom: s.nom, exos: s.exos.filter((e) => !e.option) });
  const moyenne = (a, b) => { if (typeof L.volume !== 'function') return {}; const x = L.volume([a, b, a]), y = L.volume([b, a, b]); const m = {}; Object.keys(x).forEach((k) => { m[k] = (x[k] + y[k]) / 2; }); return m; };
  const v = moyenne(A, B), vs = moyenne(sansOption(A), sansOption(B));
  const pres = (x, cible) => Math.abs(x - cible) <= 0.5;
  // 2.5.0 (« Ce qui plaît ») : côté des épaules 12 en direct (environ 14), le biceps garde environ 10 sans les « option » (le curl
  // n'en est plus une), le triceps 7,5 sans l'extension.
  egal([v.dos, v.epaules, v.pecs, v.haut_pecs, v.quadriceps, v.ischios, v.fessiers, v.biceps, v.triceps, v.arriere_epaules, vs.biceps],
    [15, 16.5, 10.5, 10.5, 9, 7.5, 9, 16.5, 14.25, 0, 16.5], 'Programme : les séries par semaine (2.38.67, 3 séances) : dos 15, côté des épaules 16,5 (élévations à la machine en B), pecs 10,5 tous en incliné, fessiers 9 par la presse, bras 16,5');
  // 15/11 : l'encadré « Tes séries par semaine » (une explication) est sorti du coffre ; les chiffres restent vérifiés ci-dessus.
  vrai(aucun(intro, ['16 séries', 'les épaules 13', 'Bras : 3', '10,5 en direct', 'environ 7 sans']), 'Programme : plus les anciens chiffres de séries');
  // En 1 h 15 (L.adapter, D4 : +1 série aux 3 exercices marqués « priorité », après la mise en route), les chiffres de l'en-tête sont justes,
  // et aucun muscle ne dépasse 8 séries directes dans une séance [28] ni 20 par semaine [27].
  const reg75 = { niveau: 'un peu', parSemaine: 3, duree: 75 };
  const a75 = { nom: A.nom, exos: L.adapter(A.exos, reg75, 4).exos }, b75 = { nom: B.nom, exos: L.adapter(B.exos, reg75, 4).exos };
  const v75 = moyenne(a75, b75);
  const directesMax = Math.max.apply(null, [a75, b75].map((s) => { const d = {}; s.exos.forEach((e) => { const m = L.musclesExo(e.nom); Object.keys(m).forEach((k) => { if (m[k] === 1) d[k] = (d[k] || 0) + e.series; }); }); return Math.max.apply(null, Object.keys(d).map((k) => d[k])); }));
  egal([v75.dos, v75.epaules, v75.pecs, v75.quadriceps, Object.keys(v75).every((k) => v75[k] <= 20), directesMax <= 8], [18, 16.5, 10.5, 9, true, true], 'Programme : en 1 h 15, dos 18, côté des épaules 16,5, pecs 10,5, quadriceps 9 ; 20 au plus par semaine, 8 directes au plus par séance');
}
// 2.8.0 : l'en-tête du programme ne garde que « Modifier le programme » ; l'effort, la semaine, le vélo et la semaine
// légère sont dits par le plugin au bon moment (demande du 15/11 : « reste vraiment sur l'essentiel »).
vrai(contient(intro, ['Modifier le programme', 'Une ligne = un exercice', 'son historique repart de zéro']) && aucun(intro, ['Ta semaine', 'L\'effort, à chaque série', '18/01/2027']),
  'Programme : en tête, seulement comment le modifier');
// Changement 8 et cardio de fin : pas de cardio soutenu avant ; 5 min après, plus seulement s'il reste du temps.
// Changement 10 : la semaine légère sur les finaux, sans promesse.
// Syntaxe 1.15.0 : le test qui relisait le programme avec le main.js 1.15.0 des archives est retiré en 2.6.0 : les archives
// sont sorties du coffre (~/Desktop/CLAUDE/Salle-travail/archives/) et les tests ne lisent rien hors du coffre ; la 2.x est
// installée sur l'iPhone et le Mac depuis le 14/11. La syntaxe reste celle de la 1.15.0 (README, règle 4).

// 2.6.0 : plus de commentaire caché (%% … %%) dans le programme : les sources de chaque choix sont sorties du coffre,
// dans ~/Desktop/CLAUDE/Salle-travail/sources-du-programme.md (avant, 2.5.0 : un seul commentaire après les séances).
vrai(PROGRAMME_DEFAUT.indexOf('%%') < 0, 'Programme : aucun commentaire caché, les sources sont hors du coffre');

// ── Guide des exercices (modeles/Guide des exercices.txt = Guide des exercices.md) ──
// Ce que le plugin lit dans une fiche : « Réglage » (sous le titre de la carte), « Tu dois sentir » (sous l'animation), « Geste ».
vrai(tousNoms.length === 16 && tousNoms.every((n) => /\*\*(Réglage|Position) :\*\*/.test(fiche(n)) && /\*\*Geste :\*\*/.test(fiche(n)) && /^\*\*Tu dois sentir/m.test(fiche(n))),
  'Guide : chaque exercice du programme et chaque remplaçant a sa fiche, avec Réglage (ou Position, sans appareil à régler), Geste et Tu dois sentir');
// 2.8.0 : plus de règles en tête du guide (le tempo est dans chaque geste et sur la carte) ; les fiches disent quoi faire,
// sans raison ni « priorité » (demande du 15/11 : « ce sont des infos pour toi »).
// 2.14.0 : chaque fiche a sa ligne « À retenir », lue pendant le repos, à bout de souffle : 2 ou 3 repères de 5 mots au plus ;
// 2 seulement pour un exercice debout (le « ventre dur » fait le troisième, L.estDebout).
{
  const retenir = Object.keys(guide).map((k) => ({ titre: guide[k].titre, reperes: L.champFiche(guide[k].lignes, 'À retenir').split('·').map((x) => x.trim()).filter(Boolean) }));
  const mots = (x) => x.split(/[\s']+/).filter(Boolean).length;
  const longs = retenir.filter((r) => r.reperes.some((x) => mots(x) > 6 || x.length > 40 || /[.:]/.test(x)));
  const nombre = retenir.filter((r) => r.reperes.length !== (L.estDebout(r.titre) ? 2 : 3));
  egal([retenir.length, longs.map((r) => r.titre), nombre.map((r) => r.titre)], [25, [], []], 'guide : chaque fiche a « À retenir », 3 repères courts (2 debout), sans phrase');
  egal(ECRAN_SEANCE.reperes(guide[L.norm('Tirage vertical prise large')].lignes, { nom: 'Tirage vertical prise large' }, false).map((l) => l.texte),
    ['**Sens** : les côtés du dos, sous les aisselles', 'Cuisses bloquées', 'Mains larges', 'Coudes vers le bas', 'Tirer derrière la nuque', 'Te balancer en arrière'], 'guide : le repos du tirage vertical, en 6 lignes courtes');
}
vrai(aucun(guideTexte, ['priorité', 'Pourquoi', 'Trois règles', 'Ne saute jamais', 'C\'est là que le muscle']) && /^# Comment faire$/m.test(guideTexte),
  'Guide : ni règles en tête, ni « priorité », ni raison');
egal(tousNoms.filter((n) => !/^\*\*Muscles :\*\*/m.test(fiche(n))), [], 'Guide : chaque fiche commence par le muscle travaillé');
const geste = (n) => (fiche(n).match(/\*\*Geste :\*\*.*/) || [''])[0];
egal(tousNoms.filter((n) => n !== 'Gainage planche' && !(/en 1 seconde/.test(geste(n)) && /en 2 secondes/.test(geste(n)))), [], 'Guide : chaque geste dit 1 seconde dans un sens, 2 secondes dans l\'autre (sauf la planche, tenue)');
// Changement 11 : la presse aussi bas que possible. 2.13.0 : phrase raccourcie (elle s'affiche sur la carte, « Va au bout : … »).
vrai(contient(fiche('Presse à cuisses'), ['aussi bas que possible, fesses et bas du dos collés au siège']) && aucun(fiche('Presse à cuisses'), ['angle droit']), 'Guide : presse aussi bas que possible, fesses et bas du dos collés au siège');
// 2.13.0 : « Va au bout » (L.amplitude) se lit dans le geste de chaque fiche, en 2 lignes au plus ; les élévations (rien à
// étirer en bas) et la planche (tenue) n'en ont pas. Les deux leg curls disent les demi-répétitions de la dernière série.
{
  const lignes = (n) => fiche(n).split('\n');
  egal(tousNoms.filter((n) => !L.amplitude(lignes(n))), ['Élévations latérales aux haltères'], 'Guide : chaque geste dit jusqu\'où aller (sauf les élévations)');
  egal(tousNoms.filter((n) => L.amplitude(lignes(n)).replace(/\*\*/g, '').length > L.LIGNE_MAX), [], 'Guide : « Va au bout » tient en 2 lignes');
  egal(tousNoms.filter((n) => L.champFiche(lignes(n), 'Dernière série')), ['Leg curl assis', 'Leg curl allongé'], 'Guide : les demi-répétitions de la dernière série, aux deux leg curls');
  egal(tousNoms.filter((n) => L.penseAuMuscle(n) && !L.champFiche(lignes(n), 'Muscles')), [], 'Guide : chaque petit exercice dit le muscle auquel penser');
}
// Changement 1 : la fiche de l'extension au-dessus de la tête ; l'ancienne reste pour quand la poulie basse est prise.
vrai(contient(fiche(TRICEPS), ['poulie en position basse', 'étirement', 'Si c\'est pris']) && fiche(ANCIEN_TRICEPS).length > 100, 'Guide : la fiche de l\'extension au-dessus de la tête, et l\'ancienne fiche gardée');
// Le réglage écrit sur la carte reste le même que celui du programme.
egal([L.texteReglage({ nom: INCLINE }, guide), L.texteReglage({ nom: 'Développé épaules aux haltères' }, guide)], ['Réglage : banc incliné à environ 30° (2e ou 3e cran)', 'Réglage : banc avec dossier presque droit'], 'Guide : réglages du banc pareils au programme');
// 2.41.0 (demande : « vérifie les exos, que les paramètres soient bien précisés, genre réglage ») : la carte dit la première
// phrase du réglage (le plus important : boudins, dossier, siège, poignée) ; chaque machine de son programme (et leurs
// remplaçants) a au moins 3 repères ; chaque phrase tient en 2 lignes (88 signes, « Réglage : » compris pour la première).
egal(L.texteReglage({ nom: 'Tirage vertical prise large' }, guide), 'Réglage : boudins serrés sur le haut des cuisses, pieds à plat', 'Guide : la première phrase du réglage, sur la carte');
{
  const machines = ['Tirage vertical prise large', 'Tirage vertical prise neutre', 'Tirage horizontal à la poulie', 'Presse à cuisses', 'Leg curl assis', 'Leg curl allongé',
    'Développé incliné à la machine', 'Curl à la barre en Z', 'Élévations latérales à la machine', 'Élévations latérales à la poulie', 'Rowing à la machine à disques', 'Extension triceps au-dessus de la tête à la poulie'];
  const reglage = (n) => (((guide[L.norm(n)] || {}).lignes || []).find((l) => /^\*\*Réglage/.test(l)) || '').replace(/^\*\*Réglage :\*\*\s*/, '');
  const courts = machines.filter((n) => reglage(n).split(/[,.]/).filter((x) => x.trim()).length < 3);
  const longues = machines.filter((n) => reglage(n).split(/\.\s+/).some((ph, i) => (i ? ph : 'Réglage : ' + ph).length > 88));
  egal([courts, longues], [[], []], 'Guide : chaque machine du programme a un réglage précis (au moins 3 repères), chaque phrase en 2 lignes');
}
// 2.36.3 : un exercice sans appareil à régler dit sa position, pas un réglage.
egal([L.texteReglage({ nom: 'Curl à la barre en Z' }, guide), L.texteReglage({ nom: 'Élévations latérales aux haltères' }, guide)],
  ['Réglage : siège du pupitre réglé pour avoir le haut de l\'appui sous tes aisselles', 'Position : debout, un haltère léger dans chaque main'], 'Guide : le curl au pupitre a un réglage (2.38.67) ; sans appareil à régler, la fiche dit la position');

// ── Images et charges de départ (src/05-exercices.js) ──
egal(L.chargeDepart({ nom: TRICEPS, pas: 2.5 }, 70), 7.5, 'Exercices : l\'extension au-dessus de la tête, 7,5 kg au départ (2.37.0 : sous le poids estimé, par prudence)');
const CLES_115 = ['tirage vertical prise large', 'tirage vertical prise neutre', 'tirage horizontal a la poulie', 'developpe assis a la machine', 'developpe couche a la machine', 'developpe incline aux halteres', 'developpe epaules aux halteres', 'elevations laterales aux halteres', 'face pull a la poulie', 'curl aux halteres', 'extension triceps a la poulie', 'presse a cuisses', 'leg curl assis', 'gainage planche', 'rowing a la machine a disques', 'tractions', 'developpe couche aux halteres', 'developpe incline a la machine', 'developpe epaules a la machine', 'leg curl allonge', 'curl a la barre en z'];
vrai(CLES_115.filter((k) => k !== 'gainage planche' && k !== 'tractions' && k !== 'developpe couche a la machine').every((k) => DEPARTS_PAR_KG[k] > 0), 'Exercices : les clés de la 1.15.0 gardent leur charge de départ (séances déjà notées)');
egal(tousNoms.filter((n) => { const f = L.guideDuPlugin()[L.norm(n)]; const v = f && L.videoDeFiche(f.lignes); return !(v && v.id); }), [], 'Exercices : chaque exercice du programme livré et chaque remplaçant a sa vidéo (2.41.13 : plus de photos)');

// ── Les autres notes ──
// Erreur corrigée (La bonne séance, partie 5) : « plus de 2 kg par mois, enlève la collation » était trop haut.
// 2.7.0 (changement voulu) : la cible par semaine, pour un mince qui prend du muscle [30], une pesée par semaine ;
// plus de « +0,7 à 1,5 kg par mois » ni de « 3 fois par semaine ».
// 2.7.1 : l'onglet Manger dit seulement quoi manger (le pourquoi est sorti du coffre) ; il a un four.
// 2.18.0 (demande : « midi et soir, quand je déplie je veux des plats, et quand j'appuie, la recette ; un onglet pour le matin ; tout
// en bas, les courses : tout est lié ») : la note est rangée par repas ; chaque plat a ses ingrédients (puces) et ses étapes.
{
  const m = modele('Manger simple');
  const parties = L.sections(m).filter((s) => s.titre);
  const repas = L.repasDuJour(m);
  const plats = parties.flatMap((s) => L.plats(s.lignes).plats);
  const courses = parties.find((s) => s.titre === 'Les courses de la semaine').lignes.filter((l) => /^- /.test(l));
  vrai(contient(m, ['**3 œufs** : 20 g de protéines.', '**1 boîte de thon**', '**1 pot de skyr** : 15 g.', 'au four', 'quand le plugin te le dit', '30 cl de lait entier'])
    && m.indexOf('**3 œufs**') < m.indexOf('## Matin') && aucun(m, ['Pourquoi', 'pas de four', 'Les trois règles', 'créatine', 'balance de cuisine', '[!note]', '## Ta journée', '## Plats du soir']),
  'Manger : d\'abord les aliments et leurs protéines, puis les repas ; ni pourquoi, ni règles, ni compléments');
  egal([parties.map((s) => s.titre), repas.map((x) => x.repas), repas.every((x) => `${x.repas} : ${x.quoi}.`.length <= L.LIGNE_MAX), / ou /.test(repas[1].quoi) && / ou /.test(repas[3].quoi), repas.some((x) => /collation/i.test(x.quoi))],
    [['Matin', 'Midi', 'Goûter', 'Soir', 'Les courses de la semaine'], ['Matin', 'Midi', 'Goûter', 'Soir'], true, true, false],
    'Manger : un onglet par repas, les courses tout en bas ; l\'accueil en tire une ligne courte par repas, avec des « ou » le midi et le soir, sans la collation');
  egal([plats.length, plats.filter((x) => !x.lignes.some((l) => /^- /.test(l))).map((x) => x.nom), plats.filter((x) => /^(Poulet|Pâtes|Omelette|Saumon|Bol)/.test(x.nom) && !x.lignes.some((l) => /^1\. /.test(l))).map((x) => x.nom)],
    [9, [], []], 'Manger : 9 plats, chacun avec ses ingrédients ; chaque plat à cuisiner a ses étapes numérotées');
  // 2.17.0 : les courses sont une liste, pas un texte : un produit par puce (47 signes au plus, sans virgule), au moins 15 produits.
  vrai(courses.length >= 15 && courses.every((l) => l.length <= 47 && l.indexOf(',') < 0), 'Manger : les courses, un produit par ligne');
  // « Tout est lié » (demande : « tu as mis certaines choses dans les courses, mais elles ne sont pas dans les recettes ») : chaque
  // produit des courses est un ingrédient d'au moins une recette, et chaque ingrédient d'une recette est dans les courses.
  // [le mot dans les courses, le mot dans les ingrédients] ; le plus long d'abord (« beurre de cacahuète » avant « beurre »).
  const LIENS = [['beurre de cacahuète', 'beurre de cacahuète'], ['blancs de poulet', 'blanc de poulet'], ['cuisses de poulet', 'cuisse de poulet'], ['pommes de terre', 'pommes de terre'], ['fromage râpé', 'fromage râpé'],
    ['sauce tomate', 'sauce tomate'], ['huile d\'olive', 'huile d\'olive'], ['lentilles', 'lentilles'], ['baguette', 'baguette'], ['flocons', 'flocons'], ['amandes', 'amandes'], ['bananes', 'banane'], ['saumon', 'saumon'],
    ['beurre', 'noisette de beurre'], ['pâtes', 'pâtes'], ['œufs', 'œufs'], ['thon', 'thon'], ['skyr', 'skyr'], ['lait', 'lait'], ['riz', 'riz'], ['sel', 'sel']];
  const lienDe = (texte, col) => LIENS.find((x) => texte.toLowerCase().indexOf(x[col]) >= 0);
  const ingredients = plats.flatMap((x) => x.lignes.filter((l) => /^- /.test(l)).map((l) => l.slice(2)));
  const sansRecette = courses.map((l) => l.slice(2)).filter((c) => { const x = lienDe(c, 0); return !x || !ingredients.some((i) => i.toLowerCase().indexOf(x[1]) >= 0); });
  const sansCourses = ingredients.filter((i) => { const x = lienDe(i, 1); return !x || !courses.some((c) => c.toLowerCase().indexOf(x[0]) >= 0); });
  egal([sansRecette, sansCourses], [[], []], 'Manger : tout est lié : aucun produit des courses sans recette, aucun ingrédient d\'une recette hors des courses');
}
// 2.22.0 (demande : « rien n'est marqué en dur à part dans le fichier personnel ») : les notes livrées n'écrivent plus d'étage ;
// l'écran « Ma salle » lit la salle dans les réglages (L.lignesSalle). Les mots propres à une personne (son nom, sa salle) ne
// sont pas écrits ici non plus : tests/perso.py les lit sur la machine et contrôle tout le dossier du plugin.
vrai(contient(modele('Ma salle'), ['Le sac']) && ['Programme', 'Guide des exercices', 'Manger simple', 'Ma salle', 'Forme'].every((n) => aucun(modele(n) || '', ['étage 1', 'étage 2'])),
  'Notes livrées : aucun étage écrit (ils viennent des réglages)');
// Le carnet Forme : FORME_DEFAUT vient de modeles/Forme.txt, ne contient aucune ligne datée, et une ligne ajoutée se relit.
egal([FORME_DEFAUT === modele('Forme'), L.lireForme(FORME_DEFAUT), /\n\n$/.test(FORME_DEFAUT)], [true, [], true], 'Forme : le modèle est FORME_DEFAUT, sans ligne datée, fini par une ligne vide');
vrai(contient(FORME_DEFAUT, ['sommeil : moins de 6 h', 'Urines foncées', 'Douleur dans la poitrine']) && aucun(FORME_DEFAUT, ['repas', 'ta forme']), 'Forme : le carnet dit la nuit courte, et quand consulter'); // 2.1.2 : plus de forme ni de repas
// 2.3.0 : les notes alignées sur les études (~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-audit-etudes.md, changements 9, 12, 15, 19, 20).
vrai(contient(FORME_DEFAUT, ['Le bilan pose 3 questions', '**Une douleur ?**', '**Des courbatures fortes ?**', '**Ta nuit ?**', 'un tiers plus légers']), 'Forme : l\'en-tête explique les 3 questions du bilan');
vrai(contient(fiche('Leg curl assis'), ['**Dernière série :**', '3 à 5 demi-répétitions, jambes presque tendues']) && contient(fiche('Élévations latérales aux haltères'), ['**Dernière série à la poulie :**', '3 à 5 demi-répétitions, bras en bas']),
  'Guide : dernière série du leg curl et des élévations à la poulie, 3 à 5 demi-répétitions étirées [81]');
// 2.22.1 : la note « Démarrer ici » est retirée (une notice d'installation périmée, que le plugin n'a jamais lue).
// Pour toutes les notes livrées : leur en-tête, rien à compléter, pas d'émoji (les boutons du plugin n'en ont plus).
const NOTES = { Programme: 'programme', 'Guide des exercices': 'guide', 'Manger simple': 'manger', 'Ma salle': 'club', Forme: 'forme' };
egal(Object.keys(NOTES).filter((n) => { const t = modele(n); return t === null || L.lireEntete(t).cles.salle !== NOTES[n]; }), [], 'Modèles : chaque note livrée a son en-tête « salle: … »');
egal(Object.keys(NOTES).filter((n) => /COMPL[ÉE]TER/i.test(modele(n) || '')), [], 'Modèles : aucun « À COMPLÉTER »');
// 15/11 (demande : « le pourquoi c'est pour les dev ») : les notes ne disent que quoi faire. Le pourquoi retiré est
// dans ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-pourquoi-des-notes.md.
// Forme n'en fait pas partie : son en-tête explique les 3 questions du bilan (testé plus haut), pas touché ce jour-là.
egal(Object.keys(NOTES).filter((n) => /pourquoi|\[!note\]-/i.test(modele(n) || '')), [], 'Modèles : aucun « Pourquoi », aucun bloc replié d\'explication');
egal(Object.keys(NOTES).filter((n) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{25B6}\u{25C0}]/u.test(modele(n) || '')), [], 'Modèles : aucun émoji');

// ── Les notes du coffre (à demande : un écart est signalé, sans faire échouer les tests) ──
// 2.23.0 : plus rien à comparer ici. « Programme » et « Ma salle » sont ses notes à lui (le pas de ses machines, ses
// horaires) ; le guide et « Manger » ne sont plus des notes du coffre : le plugin porte leur texte (GUIDE_DEFAUT, MANGER_DEFAUT).
egal([GUIDE_DEFAUT.indexOf('---\nsalle: guide\n---\n# Comment faire\n\n## Tirage vertical prise large\n\n**Muscles :**') === 0, Object.keys(L.lireGuide(GUIDE_DEFAUT)).length, /\n$/.test(GUIDE_DEFAUT) && !/\n\n$/.test(GUIDE_DEFAUT), MANGER_DEFAUT === modele('Manger simple')],
  [true, 25, true, true], 'Le guide du plugin est assemblé depuis commun/exercices (25 fiches, dans l\'ordre des dossiers) ; « Manger » est le texte de l\'objectif');
egal([Object.keys(IMAGES).length, Object.keys(DEPARTS_PAR_KG).length, DEPARTS_PAR_KG['presse a cuisses'], DEPARTS_PAR_KG['gainage planche']], [0, 23, 0.857, undefined], 'Exercices : plus de photos (2.41.13) ; les charges de départ viennent de chaque exercice.json');
{
  const forme = lireNote('../../Forme.md');
  avertir(forme === null || forme.indexOf(FORME_DEFAUT.trim()) === 0, 'Forme.md ne commence plus par le modèle (en-tête modifié à la main ?).');
}
// Chaque lien [[…]] des notes livrées mène à une note du coffre.
{
  const liens = [];
  Object.keys(NOTES).forEach((n) => ((modele(n) || '').match(/\[\[[^\]|]+/g) || []).forEach((l) => { const x = l.slice(2).trim(); if (liens.indexOf(x) < 0) liens.push(x); }));
  const existe = (x) => lireNote('../../' + x + '.md') !== null;
  const manquent = liens.filter((x) => !existe(x));
  avertir(!manquent.length, 'Liens sans note dans le coffre : ' + manquent.join(', ') + '.');
}

// 2.41.13 (« oui, retire-les ») : plus de photos dans main.js ; plugin.image ne rend plus rien.
egal([Object.keys(PHOTOS).length, SallePlugin.prototype.image('tirage vertical prise large', 0)], [0, ''], 'Photos : plus aucune photo dans main.js ; plugin.image : rien');

// 2.28.0 : les règles de l'objectif viennent de objectifs/esthetique/objectif.json, pas du code.
{
  const o = JSON.parse(lireNote('objectifs/esthetique/objectif.json'));
  egal(OBJECTIF, o, 'Objectif : le plugin porte objectifs/esthetique/objectif.json tel quel');
  egal([L.PALIERS.map((x) => [x.titre, x.seances, x.xp]), L.PROGRESSION], [[['Débutant', 0, 0], ['Régulier', 18, 10000], ['Solide', 36, 20000], ['Costaud', 72, 40000], ['Confirmé', 144, 80000]], { apresJours: 84, bloqueJours: 21, bloqueSemaines: 3, parExo: 4, blocJours: 28, partBloc: 0.2 }],
    'Objectif : les paliers et la progression des séries viennent de objectif.json (mêmes valeurs qu\'avant)');
  egal(OBJECTIF.dose, { seriesMaxParExercice: 4, seancesDeDecouverte: 4, seriesEnDecouverte: 2, dureeCourte: 45, dureeLongue: 75, exercicesRenforces: 3 }, 'Objectif : les nombres du dosage (L.adapter) sont dans objectif.json');
  egal([L.MUSCLES_CARRURE, L.REPERES_VOLUME, L.POIDS_CIBLE_PCT, L.proteines(70), L.mangerEssentiel({ poids: 70 })[0], L.cibleParSemaine(70)],
    [['dos', 'epaules', 'pecs', 'biceps', 'triceps', 'avant_bras'], { zone: [10, 15], max: 20, parSeance: 8, avecZone: ['dos', 'epaules', 'pecs', 'biceps', 'triceps', 'avant_bras'] }, { min: 0.25, max: 0.5 }, 110, '**Protéines** : 110 g par jour, au moins.', { min: 0.18, max: 0.35 }],
    'Objectif : muscles prioritaires, séries par semaine, protéines et prise de poids lus dans objectif.json (mêmes valeurs qu\'avant)');
}

// 2.38.80 (demande : « si je change l'ordre des exercices chez moi, ça doit aussi le faire chez lui ») : la note du programme
// suit le programme livré (L.suivreProgrammeLivre).
{
  const PL = PROGRAMME_DEFAUT;
  // Une note du même programme, ses lignes remises dans un autre ordre et sans marques (comme le livré d'une version d'avant).
  const autreOrdre = (texte, titre, ordre) => {
    const l = texte.split('\n');
    const i = l.findIndex((x) => x.trim() === '## ' + titre);
    const puces = [];
    for (let k = i + 1; k < l.length && !/^##?\s/.test(l[k]); k++) if (/^- /.test(l[k])) puces.push(k);
    const lignes = puces.map((k) => l[k].replace(' · priorité', ''));
    const neuves = ordre.map((d) => lignes.find((x) => x.slice(2).startsWith(d)));
    puces.forEach((k, n) => { l[k] = neuves[n]; });
    return l.join('\n');
  };
  let ancien = autreOrdre(PL, 'Séance A', ['Tirage vertical', 'Tirage horizontal', 'Élévations latérales', 'Curl', 'Développé incliné', 'Presse', 'Leg curl', 'Extension triceps']);
  ancien = autreOrdre(ancien, 'Séance B', ['Tirage vertical', 'Élévations latérales aux', 'Développé incliné', 'Curl', 'Élévations latérales à la machine', 'Presse', 'Leg curl', 'Extension triceps']);
  ancien = ancien.replace('- Tirage horizontal à la poulie · 3 × 8-12', '- Tirage horizontal à la poulie · 4 × 8-12').replace('\n## Séance B', '\n## Séance C\n\n- Gainage planche · 2 × 30-60 s · repos 1 min\n\n## Séance B');
  const r = L.suivreProgrammeLivre(ancien, PL);
  const seq = (texte) => L.lireProgramme(texte).map((s) => s.nom + ' : ' + s.exos.map((e) => e.nom + (e.priorite ? ' *' : '')).join(', '));
  const voulu = seq(PL);
  const obtenu = seq(r.texte);
  egal([r.quoi, obtenu.filter((x) => !/^Séance C/.test(x)), obtenu.some((x) => /^Séance C : Gainage planche/.test(x)), /Tirage horizontal à la poulie · 4 × 8-12/.test(r.texte), L.suivreProgrammeLivre(r.texte, PL).quoi],
    ['ordre', voulu, true, true, 'rien'], 'suivreProgrammeLivre : mêmes exercices, autre ordre : remis dans l\'ordre livré, marques « priorité » comprises ; ses séries et sa séance à lui gardées ; une seconde fois : rien');
  // Sa note à lui (l'auteur) : le même ordre, des étages, d'autres pas, des disques : rien ne bouge.
  const auteur = PL.replace('- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg', '- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 10 kg · disques · étage 2');
  // Un programme livré d'avant (17/11) : d'autres exercices : la note devient le programme livré.
  const vieux = "---\nsalle: programme\n---\n# Programme\n\n> [!info] Modifier le programme\n> - **Une ligne = un exercice** : `- Nom · séries × répétitions · repos · pas`. Le plugin relit tout seul.\n> - **ou …** : le remplaçant si la machine est prise. **option** : retiré des séances de 45 min.\n> - **Renommer un exercice** : son historique repart de zéro.\n\n## Séance A\n\n- Tirage vertical prise large · 3 × 8-12 · repos 2 min · pas 2,5 kg · ou Tractions (poids du corps)\n- Développé assis à la machine · 3 × 8-12 · repos 2 min · pas 2,5 kg · ou Développé couché aux haltères\n- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg\n- Tirage horizontal à la poulie · 3 × 8-12 · repos 2 min · pas 2,5 kg · ou Rowing à la machine à disques\n- Élévations latérales aux haltères · 4 × 12-20 · repos 1 min 30 · pas 1 kg\n- Leg curl assis · 2 × 10-15 · repos 1 min 30 · pas 2,5 kg · ou Leg curl allongé\n- Curl aux haltères · 2 × 10-15 · repos 1 min 30 · pas 1 kg · ou Curl à la barre en Z\n- Gainage planche · 2 × 30-60 s · repos 1 min · option\n\n## Séance B\n\n- Développé épaules aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg · dossier presque droit, 80 à 90° · ou Développé épaules à la machine\n- Tirage vertical prise neutre · 3 × 8-12 · repos 2 min · pas 2,5 kg · ou Tractions (poids du corps)\n- Développé incliné aux haltères · 4 × 8-12 · repos 2 min · pas 2 kg · banc 30° (2e ou 3e cran) · ou Développé incliné à la machine\n- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg\n- Leg curl assis · 3 × 10-15 · repos 1 min 30 · pas 2,5 kg · ou Leg curl allongé\n- Élévations latérales aux haltères · 4 × 12-20 · repos 1 min 30 · pas 1 kg\n- Face pull à la poulie · 2 × 12-15 · repos 1 min 30 · pas 2,5 kg\n- Extension triceps au-dessus de la tête à la poulie · 2 × 10-15 · repos 1 min 30 · pas 2,5 kg · option\n";
  const rv = L.suivreProgrammeLivre(vieux, PL);
  egal([L.suivreProgrammeLivre(auteur, PL).quoi, L.suivreProgrammeLivre(auteur, PL).texte === auteur, rv.quoi, rv.texte === PL, L.suivreProgrammeLivre(PL, '').quoi],
    ['rien', true, 'remplace', true, 'rien'], 'suivreProgrammeLivre : sa note (étages, pas, disques) ne bouge pas ; un programme d\'une version d\'avant est remplacé ; sans livré, rien');
  // 2.41.15 (son pote : les élévations aux haltères montaient de 1 en 1 kg) : sa note copiée le 18/11 avait le matériel de
  // leur salle ; remplacée par le programme livré, elle le perdait. Il est repris : cran plus gros, disques, étage ; un cran
  // plus petit d'une vieille note (2,5 kg, l'ancien défaut) ne remplace pas celui du livré ; une seconde fois : rien.
  const pote = vieux.replace(/Élévations latérales aux haltères · 4 × 12-20 · repos 1 min 30 · pas 1 kg/g, 'Élévations latérales aux haltères · 4 × 12-20 · repos 1 min 30 · pas 2 kg')
    .replace(/- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg/g, '- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 10 kg · disques · étage 2');
  const rp = L.suivreProgrammeLivre(pote, PL);
  const exoDe = (texte, seance, nom) => L.lireProgramme(texte).find((x) => x.nom === seance).exos.find((e) => e.nom === nom);
  const el = exoDe(rp.texte, 'Séance A', 'Élévations latérales aux haltères'), pr = exoDe(rp.texte, 'Séance B', 'Presse à cuisses'), lc = exoDe(rp.texte, 'Séance A', 'Leg curl assis');
  egal([rp.quoi, el.pas, el.priorite, pr.pas, pr.disques, pr.etage, lc.pas, L.reprendreCrans(rp.texte, pote, PL) === rp.texte, L.lireProgramme(rp.texte).map((x) => x.exos.length)],
    ['remplace', 2, true, 10, true, 2, 5, true, L.lireProgramme(PL).map((x) => x.exos.length)],
    'reprendreCrans : le programme livré, avec le matériel de sa salle (haltères de 2 en 2, presse à disques de 10 en 10 à l\'étage 2) ; l\'ancien 2,5 kg du leg curl ne revient pas ; une seconde fois : rien');
  // Une note déjà remplacée (avant la 2.41.15) : reprise depuis programme-avant.md ; un cran changé à la main depuis reste.
  const main = PL.replace(/Élévations latérales aux haltères · 4 × 12-20 · repos 1 min 30 · priorité · pas 1 kg/, 'Élévations latérales aux haltères · 4 × 12-20 · repos 1 min 30 · priorité · pas 4 kg');
  const rm = L.reprendreCrans(main, pote, PL);
  egal([exoDe(rm, 'Séance A', 'Élévations latérales aux haltères').pas, exoDe(rm, 'Séance B', 'Élévations latérales aux haltères').pas, exoDe(rm, 'Séance A', 'Presse à cuisses').disques, L.reprendreCrans(PL, '', PL) === PL],
    [4, 2, true, true], 'reprendreCrans : un cran changé à la main reste ; l\'autre ligne reprend le cran de sa salle ; sans ancienne note, rien');
  egal([L.empreinteTexte('a') === L.empreinteTexte('a'), L.empreinteTexte('a') === L.empreinteTexte('b'), typeof L.empreinteTexte(null)], [true, false, 'string'], 'empreinteTexte : la même pour le même texte');
}


// 2.39.3 (demandes : « en fonction du nombre de kcal, qu'il dise ce qu'il manque pour le midi » ; « l'âge, il suffit de le
// demander » ; « en adéquation avec la prise de masse ») : besoins du jour (Mifflin-St Jeor × 1,55, + OBJECTIF.surplusCalories),
// et (2.40.3) plus de part par repas : seul le total du jour compte.
{
  const reg = { hauteur: 175, age: 20, ageLe: '2026-11-25', sexe: 'h' };
  const b = L.besoinsJour(reg, 70, '2026-11-25');
  egal([b, L.besoinsJour(Object.assign({}, reg, { sexe: null }), 70, '2026-11-25'), L.besoinsJour(Object.assign({}, reg, { hauteur: null }), 70, '2026-11-25'),
    L.besoinsJour(reg, null, '2026-11-25'), L.ageAujourdhui(reg, '2027-11-26'), OBJECTIF.surplusCalories],
    [{ maintien: 2650, cible: 3050 }, null, null, null, 21, 0.15],
    'besoins du jour : Mifflin-St Jeor × 1,55 puis +15 % (prise de masse) ; rien sans taille, âge, sexe ou poids ; l\'âge avance');
  const aliments = L.alimentsProteines(['---', 'salle: manger', '---', '# Manger', '', '- **3 œufs** : 20 g de protéines.', '- **1 boîte de thon** au naturel (140 g) : 25 g.',
    '- **1 pot de skyr** : 15 g.', '- **À peu près** : le chiffre exact est sur l\'étiquette.', '', '## Midi', ''].join('\n'));
  // 2.40.3 (« ça m'arrive de ne pas manger le goûter ou le matin ») : plus de part par repas ; le moment range seulement la photo.
  egal([aliments, [8, 13, 16, 20, 1].map(L.momentRepas)],
    [[{ nom: '3 œufs', g: 20 }, { nom: '1 boîte de thon', g: 25 }, { nom: '1 pot de skyr', g: 15 }], ['Ce matin', 'Ce midi', 'Au goûter', 'Ce soir', 'Ce soir']],
    'la liste des aliments de « Manger » ; le moment d\'une photo d\'après l\'heure (à 1 h, encore le soir)');
  egal([L.fusionReglages({ age: 5, ageLe: 'hier', sexe: 'x' }), L.fusionReglages({ age: 20, ageLe: '2026-11-25', sexe: 'f' })].map((r) => [r.age, r.ageLe, r.sexe]),
    [[null, null, null], [20, '2026-11-25', 'f']], 'réglages : l\'âge, son jour et le sexe gardés seulement s\'ils sont valables');
}

// 2.40.0 (demande : « un suivi, pour être à jour sur ce qu'on mange, comme un coach personnel ») : le journal des repas, une
// ligne par repas (note « salle: repas »), relu pour le total du jour ; une ligne abîmée est ignorée.
{
  const r = { date: '2026-11-25', heure: '13:05', quand: 'Ce midi', plat: 'Poulet · riz', kcal: 650.4, proteines: 42, glucides: 70, lipides: 0 };
  const ligne = L.ligneRepas(r);
  const note = ['---', 'salle: repas', '---', '# Repas', '', ligne, '- 2026-11-25 19:40 · Ce soir · Pâtes · 720 kcal · protéines 25 g', '- 2026-11-24 12:00 · Ce midi · Salade · 300 kcal',
    '- pas une date · 100 kcal', '- 2026-11-25 20:00 · Ce soir · Rien'].join('\n');
  const lus = L.lireRepas(note), jour = L.totalJour(lus, '2026-11-25');
  egal([ligne, lus.length, lus[0], jour, L.totalJour(lus, '2026-11-23'), L.analyserNote(note).repas.length, L.assemblerEtat([], PROGRAMME_DEFAUT).repas],
    ['- 2026-11-25 13:05 · Ce midi · Poulet , riz · 650 kcal · protéines 42 g · glucides 70 g', 3,
      { date: '2026-11-25', heure: '13:05', quand: 'Ce midi', plat: 'Poulet , riz', kcal: 650, proteines: 42, glucides: 70, lipides: 0 },
      { kcal: 1370, proteines: 67, n: 2 }, { kcal: 0, proteines: 0, n: 0 }, 3, []],
    'journal des repas : une ligne par repas, relue ; le total du jour ; une ligne abîmée ignorée');
  egal([L.complementKcal(50), L.complementKcal(100).nom, L.complementKcal(100, '1 banane').nom, L.complementKcal(900).nom],
    [null, '1 cuillère de beurre de cacahuète', '1 cuillère de beurre de cacahuète', 'la « Collation en plus »'],
    'compléments en calories : le plus proche de ce qu\'il manque, sans répéter l\'aliment des protéines ; rien sous 80 kcal');
}

// 2.40.0 : la journée face à ses objectifs : validée, ou ce qu'il reste ; quoi ajouter seulement en fin de journée (20 h) ou
// quand il reste peu (450 kcal et 30 g au plus).
{
  const al = [{ nom: '1 pot de skyr', g: 15 }, { nom: '3 œufs', g: 20 }];
  const b1 = L.bilanJour({ kcal: 1400, proteines: 60 }, 3050, 110, al, 13);
  const b2 = L.bilanJour({ kcal: 2700, proteines: 95 }, 3050, 110, al, 21);
  const b3 = L.bilanJour({ kcal: 3100, proteines: 112 }, 3050, 110, al, 21);
  const b4 = L.bilanJour({ kcal: 900, proteines: 120 }, null, 110, al, 12);
  egal([[b1.valide, b1.resteKcal, b1.resteProt, b1.proposer], L.phraseJour(b1), L.phraseJour(b2), L.phraseJour(b3), b4.valide],
    [[false, 1650, 50, false], [`**Il te reste** ${L.fmtMilliers(1650)} kcal.`],
      ['**Il te reste** 350 kcal.', 'Pour valider la journée : 1 pot de skyr et 1 poignée d\'amandes.'],
      ['**Journée validée** : calories et protéines atteintes.'], false],
    'journée : ce qu\'il reste, en kcal (2.40.5) ; en fin de journée, quoi ajouter (protéines puis calories) ; validée ; sans besoins, jamais validée');
  // 2.40.2 (« faire pareil que Tes progrès ») : les jours validés de la semaine.
  const r = (date, quand, kcal, proteines) => ({ date, quand, kcal, proteines });
  const sem = [r('2026-11-23', 'Ce soir', 3100, 120), r('2026-11-24', 'Ce midi', 800, 40), r('2026-11-22', 'Ce soir', 3100, 120), r('2026-11-25', 'Ce midi', 3100, 115)];
  egal([L.joursValides(sem, '2026-11-25', 3050, 110), L.joursValides(sem, '2026-11-25', null, 110), L.joursValides([], '2026-11-25', 3050, 110)], [2, 0, 0],
    'joursValides : du lundi à aujourd\'hui (pas le dimanche d\'avant), calories et protéines atteintes ; sans besoins, aucun');
  // 2.40.4 (« si le matin je n'ai pas mangé, il doit faire un attendu pour le midi, et de même pour le soir, pour être au quota ») :
  // le reste du jour partagé entre les repas qui restent (goûter : un demi-repas) ; le dernier prend tout le reste.
  const tous = ['matin', 'midi', 'gouter', 'soir'];
  const court = (l) => l.map((a) => `${a.cle} ${a.kcal}`);
  // 2.40.5 (« compte en kcal et non en grammes ») : les attendus sont en kcal ; sans besoins, aucun.
  egal([court(L.attendus({ repas: [], heure: 8, cible: 3050, noms: tous })),
    court(L.attendus({ repas: [], heure: 12, cible: 3050, noms: tous })),
    court(L.attendus({ repas: [r('2026-11-25', 'Ce midi', 1220, 52)], heure: 13, cible: 3050, noms: tous })),
    court(L.attendus({ repas: [r('2026-11-25', 'Ce midi', 1220, 52)], heure: 16, cible: 3050, noms: tous })),
    court(L.attendus({ repas: [], heure: 12, cible: 3050, noms: ['matin', 'midi', 'soir'] })),
    L.attendus({ repas: [], heure: 12, cible: null, noms: tous }),
    court(L.attendus({ repas: [r('2026-11-25', 'Ce soir', 900, 40)], heure: 21, cible: 3050, noms: tous })),
    L.attendus({ repas: [r('2026-11-25', 'Ce midi', 3100, 115)], heure: 13, cible: 3050, noms: tous }),
    [{ kcal: 1200 }, { kcal: 0 }, null, { kcal: 500, entame: true }].map(L.texteAttendu),
    // 2.40.6 : un biscuit de 168 kcal à 18 h 40 ne fait pas le dîner ; un midi trop petit dit ce qu'il lui manque.
    court(L.attendus({ repas: [r('2026-11-25', 'Ce soir', 168, 2)], heure: 18, cible: 3050, noms: tous })).concat(L.attendus({ repas: [r('2026-11-25', 'Ce soir', 168, 2)], heure: 18, cible: 3050, noms: tous }).map((a) => a.entame)),
    court(L.attendus({ repas: [r('2026-11-25', 'Ce midi', 700, 30)], heure: 13, cible: 3050, noms: tous }))],
    // Le soir en photo (900 kcal) à 21 h : le soir, dernier repas, dit ce qui manque encore pour le quota.
    [['matin 850', 'midi 900', 'gouter 450', 'soir 850'], ['midi 1200', 'gouter 600', 'soir 1250'], ['gouter 600', 'soir 1250'], ['gouter 600', 'soir 1250'],
      ['midi 1550', 'soir 1500'], [], ['soir 2150'], [], [`≈ ${L.fmtMilliers(1200)} kcal`, '', '', 'encore 500 kcal'], ['soir 2900', true], ['midi 500', 'gouter 600', 'soir 1250']],
    'attendus : matin sauté, le midi et le soir prennent sa part ; goûter, demi-repas ; le soir, tout le reste ; un repas en photo trop petit reste attendu ; rien une fois le quota atteint');
}
