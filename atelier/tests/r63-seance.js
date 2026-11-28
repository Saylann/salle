// Les rendus de l'écran de séance (src/63a-seance-calculs.js, 63b-seance.js, 63c-seance-carte.js, src/css/63-seance.css). Une règle = un test.
// Aides : rendu, ok, egal, fauxPlugin, nouvelleVue, simulerDate (tests/dom-factice.js). Le programme est celui de la 1.15.0,
// figé (PROGRAMME_115, tests/programme-115.js ; contrat, règle 0.6) : le programme livré peut changer sans changer ces tests.
simulerDate('2026-11-16T18:00:00');

const P115 = L.lireProgramme(PROGRAMME_115);
const AUJ = '2026-11-16';
const REG = { niveau: 'un peu', parSemaine: 3, duree: 60, jours: [0, 1, 2, 3, 4, 5, 6], poids: 70 };   // 2.22.0 : le poids donne les charges de départ

// Une séance notée : note('2026-11-13', 'Séance A', [['Presse à cuisses', [[60, 10], [60, 9]], '1-2']]) ; [ 's', 40 ] = 40 s.
const note = (date, nom, exos) => ({
  date, nom,
  exos: exos.map(([n, series, reserve]) => Object.assign({ nom: n, series: series.map(([c, r]) => (c === 's' ? { s: r } : { c, r })) }, reserve ? { reserve } : {})),
});
// La séance en cours, préparée comme par « Commencer » (lot C) : A = 0, B = 1 ; temps 45 → superséries. Commencée il y a 23 min.
function seanceEnCours(i, o) {
  o = o || {};
  const seances = o.seances || [];
  const sj = L.preparerSeance({ nom: P115[i].nom, exos: P115[i].exos.map((x) => Object.assign({}, x)), lignes: [] },
    { seances, programme: P115, reglages: REG, temps: o.temps || 60 });
  return L.nouvelleSeance(sj, AUJ, Date.now() - 23 * 60000);
}
const indice = (sc, nom) => sc.exos.findIndex((x) => x.nom === nom);

// Le plugin des tests : celui de dom-factice, plus ce que le vrai plugin fournit (bip, vibreur, son, déjà vu sur l'appareil,
// fichier d'état), avec un journal pour l'ordre des appels (« Repos salle » avant l'enregistrement).
function monPlugin(o) {
  o = o || {};
  const p = fauxPlugin({
    etat: { programme: P115, seances: o.seances || [], guide: o.guide || {}, fichiers: o.fichiers || {} },
    donnees: { reglages: Object.assign({}, REG), enCours: o.enCours || null },
  });
  p.journal = [];
  p.bips = [];
  p.vus = new Set(o.vus || []);
  p.sauver = async () => { p.journal.push('sauver'); };
  p.chronoIphone = (s) => { p.journal.push('chrono:' + s); return true; };
  p.bip = (n) => { p.bips.push(n); return true; };
  p.preparerSon = () => { p.journal.push('son'); return true; };
  p.vibreur = () => h('input', { type: 'checkbox', switch: true, cls: 'salle-vibre', tabindex: '-1', 'aria-hidden': 'true' });
  p.dejaVu = (k) => p.vus.has(k);
  p.marquerVu = (k) => { p.vus.add(k); };
  p.recharger = async () => { p.journal.push('recharger'); };
  return p;
}
// L'horloge de l'écran (toutes les 500 ms) : gardée ici pour la faire battre à la main.
let tic = () => {};
const setIntervalVrai = window.setInterval;
window.setInterval = (f) => { tic = f; return 1; };

// Un écran de séance prêt : { p, v, sc, o }. o = les outils : boutons (y compris le <label role="button">), toucher, classe…
// o.legeres : garder les séries légères d'avant la série 1 (2.11.0 : elles passent d'abord, par le gros bouton) ; sans lui,
// la séance commence à la série 1 : les tests des séries ne dépendent pas d'elles.
function ecran(sc, o) {
  o = o || {};
  if (!o.legeres) sc.exos.forEach((x) => { delete x.approches; });
  const p = monPlugin(Object.assign({}, o, { enCours: sc }));
  if (o.courant != null) sc.courant = typeof o.courant === 'string' ? indice(sc, o.courant) : o.courant;
  const v = nouvelleVue(p);
  v.ecran = 'seance';
  v.rendre();
  return { p, v, sc, o: outils(v) };
}
function outils(v) {
  const r = () => v.contentEl;
  const tous = (f) => r().tous(f);
  const aClasse = (e, c) => typeof e.className === 'string' && e.className.split(/\s+/).indexOf(c) >= 0;
  const classe = (c, dans) => (dans || r()).tous((e) => aClasse(e, c));
  const une = (c, dans) => classe(c, dans)[0] || null;
  const boutons = () => tous((e) => e.tagName === 'button' || (e.tagName === 'label' && e.attrs.role === 'button'));
  const bouton = (t) => boutons().find((b) => b.attrs['aria-label'] === t || b.textContent.indexOf(t) >= 0) || null;
  const cliquer = async (b, ev) => { for (const f of (b && b.ev.click) || []) await f(ev); };
  const toucher = async (t, ev) => cliquer(bouton(t), ev);
  const texte = () => r().textContent;
  const erreur = () => texte().indexOf('Le plugin a rencontré une erreur') >= 0;
  const barre = () => une('salle-barre-action');
  const lignes = () => { const t = une('salle-series'); return t ? t.childNodes.filter((e) => aClasse(e, 'salle-serie')) : []; };
  return { r, tous, aClasse, classe, une, boutons, bouton, cliquer, toucher, texte, erreur, barre, lignes };
}
const HIST_DEV = [note('2026-11-13', 'Séance A', [['Développé assis à la machine', [[17.5, 10], [17.5, 9], [17.5, 9]]]])];

// ── La cible en gros ──
rendu('cible en gros : « 17,5 kg × 11 » sous le nom, l\'explication en petit, l\'effort de la série', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  const gros = o.une('salle-cible-gros'), h3 = o.tous((e) => e.tagName === 'h3')[0];
  const ordre = o.tous(() => true);
  ok(!o.erreur() && gros && gros.textContent === '17,5 kg × 11', 'la cible en gros : « 17,5 kg × 11 »');
  ok(h3 && h3.textContent.indexOf('Développé assis à la machine') >= 0 && ordre.indexOf(h3) < ordre.indexOf(gros), 'la cible est sous le nom de l\'exercice');
  ok(!o.une('salle-explication'), 'aide fermée : pas d\'explication sous la cible (2.38.11 : écran des séries épuré)');
  v.aide = true; v.rendre();
  const ex = o.une('salle-explication');
  ok(ex && /^Garde 17,5 kg \(la dernière fois : 10, 9, 9\)/.test(ex.textContent) && !o.aClasse(ex, 'salle-explication-ouverte'), 'aide ouverte : l\'explication, en petit, repliée sur une ligne');
  egal(o.une('salle-effort').textContent, 'Arrête-toi quand il t\'en reste 2.', 'l\'effort de la série 1');
  egal(v.saisie, { pour: sc.courant, c: 17.5, v: 11 }, 'la saisie part de la cible');
});
// 2.38.81 (demande : « ce qui manque, c'est comment bien faire le geste ») : dans l'aide, la vidéo du geste vient en tête,
// avant le texte de la fiche. 2.38.84 : la vidéo y est lue sur place (le lecteur), plus de bouton.
rendu('aide ouverte : la vidéo du geste en tête, lue sur place, avant le texte de la fiche', async () => {
  const { v, o } = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine', guide: L.guideDuPlugin() });
  v.aide = true; v.rendre();
  const tous = o.tous(() => true), lecteur = o.une('salle-video-boite'), champs = o.une('salle-fiche-champs');
  // 2.38.87 : dans l'aide, sa vignette d'abord (rien de YouTube ne se charge) ; un toucher la lance, sans le son, en boucle.
  const avant = lecteur && lecteur.tous((e) => e.tagName === 'iframe').length;
  const attente = lecteur && lecteur.tous((e) => / salle-video-attente /.test(' ' + (e.className || '') + ' '))[0];
  if (attente) for (const f of attente.ev.click || []) await f({ target: attente });
  const cadre = lecteur && lecteur.tous((e) => e.tagName === 'iframe')[0];
  ok(!!lecteur && !!champs && tous.indexOf(lecteur) < tous.indexOf(champs) && avant === 0 && !!cadre && /youtube/.test(cadre.attrs.src) && texte(o).indexOf('youtube.com') < 0
    && /[?&]mute=1\b/.test(cadre.attrs.src) && /[?&]autoplay=1\b/.test(cadre.attrs.src) && /[?&]loop=1\b/.test(cadre.attrs.src),
    'aide ouverte : la vidéo du geste en tête, lue sur place, avant le texte de la fiche');
});
// 2.38.84 (demande : « remplace carrément, ces nouvelles vidéos sont plus explicites ; garde les anciennes s'il n'y a pas de
// vidéo ») : l'image à droite du titre est la vignette de la vidéo ; un toucher la lit en grand, dans l'app ; « Fermer » la
// ferme. Plus de bouton « Vidéo » dans l'en-tête. Sans vidéo dans la fiche : les 2 photos, comme avant.
rendu('carte de séance : la vignette de la vidéo remplace les photos, un toucher la lit en grand', async () => {
  const { o } = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine', guide: L.guideDuPlugin() });
  const vid = L.videoDeFiche(L.guideDuPlugin()[L.norm('Développé assis à la machine')].lignes);
  const anim = o.une('salle-anim-mini'), img = anim && anim.tous((e) => e.tagName === 'img')[0], cadre = anim && anim.tous((e) => e.tagName === 'button')[0];
  const enTete = o.une('salle-exo-tete-boutons').tous((e) => e.tagName === 'button').map((b) => b.textContent.trim());
  const avant = document.body.childNodes.length;
  if (cadre) for (const f of cadre.ev.click || []) await f({ target: cadre, preventDefault() {}, stopPropagation() {} });
  const grand = document.body.childNodes[document.body.childNodes.length - 1];
  const lecteur = grand && grand.tous((e) => e.tagName === 'iframe')[0];
  // 2.38.87 : sans le son, une vitre garde les touchers ; « Avec le son » la relance avec le son, sans vitre.
  const vitre = !!grand && grand.tous((e) => / salle-video-vitre /.test(' ' + (e.className || '') + ' ')).length === 1;
  const son = grand && grand.tous((e) => e.tagName === 'button' && e.textContent.indexOf('Avec le son') >= 0)[0];
  if (son) for (const f of son.ev.click || []) await f({ target: son });
  const avecSon = grand && grand.tous((e) => e.tagName === 'iframe')[0];
  const sonOk = vitre && !!avecSon && /[?&]mute=0\b/.test(avecSon.attrs.src) && /[?&]controls=1\b/.test(avecSon.attrs.src)
    && grand.tous((e) => / salle-video-vitre /.test(' ' + (e.className || '') + ' ')).length === 0 && grand.tous((e) => e.tagName === 'button' && e.textContent.indexOf('Sans le son') >= 0).length === 1;
  const fermer = grand && grand.tous((e) => e.tagName === 'button' && e.textContent.indexOf('Fermer') >= 0)[0];
  if (fermer) for (const f of fermer.ev.click || []) await f({ target: fermer });
  // 2.38.86 (demande : « quand elle se lance, par défaut coupe le son ») : sans le son, et en grand elle démarre tout de suite.
  egal([!!img && img.attrs.src === `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`, enTete.indexOf('Vidéo') >= 0, document.body.childNodes.length - avant, !!lecteur && lecteur.attrs.src.indexOf(vid.id) >= 0,
    !!lecteur && /[?&]mute=1\b/.test(lecteur.attrs.src) && /[?&]autoplay=1\b/.test(lecteur.attrs.src) && /[?&]controls=0\b/.test(lecteur.attrs.src), sonOk],
    [true, false, 0, true, true, true], 'carte de séance : la vignette de la vidéo remplace les photos, un toucher la lit en grand');
  const sans = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine' }).o.une('salle-anim-mini');
  egal(!sans, true, 'carte de séance : sans vidéo dans la fiche, pas d\'image (2.41.13 : plus de photos)');
});
rendu('cible en direct : après une série à 20 kg, la cible et la saisie disent 20 kg (plus « Garde 17,5 kg »)', async () => {
  const sc = seanceEnCours(0);
  sc.exos[indice(sc, 'Développé assis à la machine')].faites = [{ c: 20, r: 11 }];
  const { v, o } = ecran(sc, { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  egal(o.une('salle-cible-gros').textContent, '20 kg × 11', 'la cible suit la série du jour');
  v.aide = true; v.rendre();
  egal(o.une('salle-explication').textContent, 'Garde 20 kg et refais 11, ou plus si c\'est propre.', 'l\'explication aussi');
  ok(v.saisie.c === 20 && v.saisie.v === 11, 'la saisie de la série 2 : 20 kg, 11');
});
// 2.1.0 : la cible découpée pour l'affichage (nombres très gros, unités plus petites), le texte reste mot pour mot.
rendu('2.1.0 : la cible en gros, nombres et unités à part, même texte', async () => {
  egal(ECRAN_SEANCE.morceauxCible('17,5 kg × 11'), [{ texte: '17,5', nombre: true }, { texte: 'kg', nombre: false }, { texte: '×', nombre: false }, { texte: '11', nombre: true }], '« 17,5 kg × 11 »');
  egal(ECRAN_SEANCE.morceauxCible('45 s').map((m) => m.nombre), [true, false], '« 45 s »');
  // 2.38.7 : « 12+ » en gros ; la largeur des chiffres règle leur taille.
  egal([ECRAN_SEANCE.morceauxCible('40 kg × 12+').map((m) => m.nombre), ECRAN_SEANCE.largeurCible('4 kg × 23'), ECRAN_SEANCE.largeurCible('17,5 kg × 12+')], [[true, false, false, true], 3, 6.4], '« 12+ » est un nombre ; largeurs 3 et 6,4');
  const { o } = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  const gros = o.une('salle-cible-gros');
  ok(o.classe('salle-cible-chiffre').map((e) => e.textContent).join('|') === '17,5|11' && o.classe('salle-cible-unite').length === 2 && gros.textContent === '17,5 kg × 11', 'deux nombres, deux unités, le même texte');
});
// 2.1.0 : l'étage en étiquette à côté du rang. 2.36.3 (changement voulu : l'angle du banc compte autant que la charge) : le
// réglage du programme est sur la carte, en gros, juste sous la charge ; l'aide ne le redit pas.
rendu('l\'étage en étiquette ; le réglage du programme est sur la carte, sous la charge', async () => {
  const { v, o } = ecran(seanceEnCours(1, { seances: [note('2026-11-13', 'Séance B', [['Développé incliné aux haltères', [[10, 8], [10, 8]]]])] }),
    { courant: 'Développé incliné aux haltères', seances: [note('2026-11-13', 'Séance B', [['Développé incliné aux haltères', [[10, 8], [10, 8]]]])] });
  const etage = o.une('salle-exo-etage');
  ok(etage && /^Étage \d$/.test(etage.textContent) && o.aClasse(etage, 'salle-badge'), 'l\'étage : une pastille');
  egal([o.classe('salle-cible-reglage', o.une('salle-exo-cible')).map((e) => e.textContent.trim()), o.classe('salle-reglage').length, o.classe('salle-aide-bouton').length],
    [['Banc à 30° (2e ou 3e cran)'], 0, 0], 'aide fermée : le réglage du programme sous la charge, en gros ; plus de bouton « Aide » (2.38.55 : « Comment faire » dans « … »)');
  await o.toucher('Plus d\'actions');
  await o.toucher('Comment faire');
  egal([o.classe('salle-reglage').length, o.classe('salle-cible-reglage').length], [0, 1], 'aide ouverte : aucune étiquette ne redit le réglage, il reste sous la charge');
});
rendu('explication : un toucher l\'ouvre en entier, un second la replie', async () => {
  const { v, o } = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  v.aide = true; v.rendre();   // 2.38.11 : l'explication est dans l'aide ouverte
  await o.cliquer(o.une('salle-explication'));
  ok(o.aClasse(o.une('salle-explication'), 'salle-explication-ouverte'), 'ouverte');
  await o.cliquer(o.une('salle-explication'));
  ok(!o.aClasse(o.une('salle-explication'), 'salle-explication-ouverte'), 'repliée');
});
rendu('effort : la première fois, la consigne n\'est pas redite sous l\'explication (qui la dit déjà)', async () => {   // assemblage 2.0
  const { v, o } = ecran(seanceEnCours(0), { seances: [], courant: 'Développé assis à la machine' });
  v.aide = true; v.rendre();   // 2.38.11 : l'explication est dans l'aide ouverte
  const ex = o.une('salle-explication');
  // 2.5.1 : texte raccourci ; l'explication ne le dit plus, la ligne d'effort le dit (une seule fois quand même).
  ok(ex && !/t'en reste 2/.test(ex.textContent) && o.une('salle-effort') && /t'en reste 2/.test(o.une('salle-effort').textContent), 'une seule fois « il t\'en reste 2 »');
});
rendu('effort : la dernière série sur machine dit « va jusqu\'à 1, ou 0 »', async () => {
  const sc = seanceEnCours(0);
  sc.exos[indice(sc, 'Développé assis à la machine')].faites = [{ c: 17.5, r: 11 }, { c: 17.5, r: 10 }];
  const { o } = ecran(sc, { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  egal(o.une('salle-effort').textContent, 'Dernière série : va jusqu\'à 1, ou 0.', 'dernière série');
});

// ── Le menu « … » ──
rendu('les actions rares sont dans « … » : fermé, aucune ; ouvert, toutes', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 'Développé assis à la machine' });
  const rares = ['Comment faire', 'Remplacer par un autre exercice', 'Ne pas le faire aujourd\'hui'];   // 2.38.55 : « Comment faire » revient (l'aide)
  ok(rares.every((t) => !o.bouton(t)), 'menu fermé : aucune action rare à l\'écran');
  const plus = o.bouton('Plus d\'actions');
  ok(plus && plus.textContent.indexOf('…') >= 0 && plus.attrs['aria-expanded'] === 'false', 'le bouton « … »');
  await o.cliquer(plus);
  ok(rares.every((t) => o.bouton(t)) && o.bouton('Plus d\'actions').attrs['aria-expanded'] === 'true', 'menu ouvert : comment faire, remplacer, ne pas le faire');
});
// 2.38.38 (demande : le réglage affiché vient des études, il n'a pas à le changer) : le menu n'ouvre plus la note du programme.
rendu('menu « … » : plus de « Changer le réglage de la machine »', async () => {
  const { p, o } = ecran(seanceEnCours(0), { courant: 1, fichiers: { programme: { path: 'Programme.md' } } });
  let ouverte = null;
  p.ouvrirNote = async (t) => { ouverte = t; };
  await o.toucher('Plus d\'actions');
  egal([!o.bouton('Changer le réglage de la machine'), ouverte], [true, null], 'pas de bouton, rien d\'ouvert');
});

// ── Le tableau des séries ──
rendu('tableau : une ligne par série, la dernière fois en gris, la série en cours avec − / +, les suivantes pâles', async () => {
  const { o } = ecran(seanceEnCours(0), { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  const l = o.lignes();
  egal(l.length, 4, 'l\'en-tête et 3 séries, une ligne chacune (2.38.24)');
  ok(l[0].textContent.indexOf('Le 13/11') >= 0, 'la colonne de la fois d\'avant, datée');
  ok(o.aClasse(l[1], 'salle-serie-courante') && o.une('salle-serie-avant', l[1]).textContent === '17,5 × 10' && o.classe('salle-compteur', l[1]).length === 2,
    'série 1 : la grande ligne, « 17,5 × 10 » en gris, les compteurs kg et rép.');
  ok([l[2], l[3]].every((x) => o.aClasse(x, 'salle-serie-avenir') && o.aClasse(x, 'salle-etat-pale') && o.une('salle-serie-val', x).textContent === '17,5 kg × 11'),
    'séries 2 et 3 : pâles, avec la cible');
});
rendu('tableau : première fois, pas de colonne « la dernière fois »', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 'Développé assis à la machine' });
  ok(o.aClasse(o.une('salle-series'), 'salle-series-sans-avant'), 'sans colonne vide');
});
rendu('séries faites : en vert avec « +1 », « = » ou « nouvelle charge », jamais de rouge', async () => {
  const sc = seanceEnCours(0);
  sc.exos[indice(sc, 'Développé assis à la machine')].faites = [{ c: 17.5, r: 11 }, { c: 17.5, r: 9 }];
  const { o } = ecran(sc, { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  const l = o.lignes();
  ok(o.aClasse(l[1], 'salle-serie-faite') && o.aClasse(l[1], 'salle-etat-fait') && o.une('salle-badge', l[1]).textContent === '+1', 'série 1 : verte, « +1 »');
  ok(o.aClasse(l[2], 'salle-etat-fait') && !o.une('salle-badge', l[2]), 'série 2 : verte, sans badge (pareil qu\'avant : 2.38.62, plus de « = »)');
  egal([ECRAN_SEANCE.ecart({ c: 20, r: 9 }, { c: 17.5, r: 10 }), ECRAN_SEANCE.ecart({ c: 17.5, r: 8 }, { c: 17.5, r: 10 }), ECRAN_SEANCE.ecart({ s: 45 }, { s: 40 })],
    ['nouvelle charge', '', '+5 s'], 'plus lourd : « nouvelle charge » ; moins bien : rien ; au temps : « +5 s »');
  ok(!o.classe('salle-danger').length, 'aucun rouge sur l\'écran de séance');
});

// ── Les séries légères d'avant la série 1 ──
// 2.11.0 (demande : « si l'échauffement est nécessaire, il se fait comme tout le reste ; le programme doit être catégorique ») :
// des étapes comme les autres, dans l'ordre : la cible en gros, le tableau et le gros bouton commencent par elles.
const sansBlancs = (e) => e.textContent.replace(/\s+/g, '');
rendu('séries légères : la cible, le tableau et le gros bouton commencent par elles, dans l\'ordre', async () => {
  const { sc, o } = ecran(seanceEnCours(0), { courant: 'Tirage vertical prise large', legeres: true });
  const x = sc.exos[sc.courant];
  const lignes = () => o.classe('salle-serie-legere');
  egal([sansBlancs(o.une('salle-cible-gros')), o.une('salle-exo-etape').textContent, o.classe('salle-effort').length, o.barre().textContent.trim(), lignes().map((l) => o.une('salle-serie-val', l).textContent),
    o.aClasse(lignes()[0], 'salle-serie-courante'), o.classe('salle-serie-saisie').length, lignes().every((l) => l.tagName === 'div')],
  ['20kg×8', 'Série légère 1 sur 2', 0, 'Série légère 1 sur 2 faite', ['Maintenant', '30 kg × 4'], true, 0, true],
  'la série légère 1 (8 à 50 % de 40 kg) : en gros, sans « Pour t\'échauffer » (2.38.44), « Maintenant » dans le tableau, sur le bouton ; rien à choisir');
  await o.cliquer(o.barre());
  egal([x.approches[0], x.faites.length, sc.reposTotal, o.une('salle-suite').textContent, sansBlancs(o.une('salle-cible-gros')), o.barre().textContent.trim(), o.aClasse(lignes()[0], 'salle-serie-faite')],
    [{ pct: 50, r: 8, faite: true, c: 20 }, 0, 60, 'Ensuite : série légère 2 sur 2', '30kg×4', 'Série légère 2 sur 2 faite', true], 'faite : sa charge gardée, pas de série comptée, 1 min de repos [8] ; la suivante (4 à 75 %)');
  await o.cliquer(o.barre());
  egal([sc.reposTotal, o.une('salle-suite').textContent.indexOf('Ensuite : série 1 sur ')], [x.repos, 0], 'après la dernière série légère : le repos de l\'exercice, puis la série 1');
  egal([o.barre().textContent.trim(), o.une('salle-exo-etape').textContent, o.classe('salle-serie-saisie').length, lignes().length, lignes().every((l) => o.aClasse(l, 'salle-serie-faite'))], ['Série 1 sur 3 faite', 'Série 1 sur 3', 1, 2, true],
    'puis la série 1, avec ses compteurs ; les deux séries légères restent, faites');
  await o.cliquer(o.barre());
  ok(x.faites.length === 1 && lignes().length === 2 && sc.reposFin > 0, 'la série 1 notée, le repos lancé');
});
rendu('superséries : une seule série légère (8 à 50 %) sur le premier exercice', async () => {
  const { o } = ecran(seanceEnCours(0, { temps: 45 }), { courant: 'Tirage vertical prise large', legeres: true });
  egal([o.classe('salle-serie-legere').length, o.barre().textContent.trim(), sansBlancs(o.une('salle-cible-gros'))], [1, 'Série légère 1 sur 1 faite', '20kg×8'], 'une série légère');
});

// ── Le gros bouton du bas ──
rendu('le gros bouton : un <label role="button"> collé en bas, qui contient l\'interrupteur qui vibre', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 'Développé assis à la machine' });
  const b = o.barre();
  ok(b && b.tagName === 'label' && b.attrs.role === 'button' && b.attrs.tabindex === '0' && o.aClasse(b.parent, 'salle-barre-bas'), 'un label role="button" dans .salle-barre-bas');
  ok(b.tous((e) => e.tagName === 'input' && o.aClasse(e, 'salle-vibre') && e.attrs.switch === '').length === 1, 'l\'interrupteur iOS 18 caché dedans');
  egal(b.textContent.trim(), 'Série 1 sur 3 faite', '« Série 1 sur 3 faite »');
});
rendu('le gros bouton ne bouge plus : dernier élément de l\'écran, quel que soit l\'état', async () => {
  const dernier = (o) => { const n = o.r().childNodes; return n[n.length - 2]; };   // le dernier est .salle-fin (lot D)
  const fini = seanceEnCours(0);
  fini.exos.forEach((x) => { x.faites = x.echauffement ? [{ min: 5 }] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
  const etats = [[seanceEnCours(0), 0, 'Fait'], [seanceEnCours(0), 2, 'Série 1 sur 3 faite'], [seanceEnCours(0), 'Gainage planche', 'Lancer le chrono'], [fini, 2, 'Terminer et enregistrer']];
  for (const [sc, c, t] of etats) {
    const { o } = ecran(sc, { courant: c });
    ok(!o.erreur() && o.aClasse(dernier(o), 'salle-barre-bas') && o.aClasse(o.r().childNodes[o.r().childNodes.length - 1], 'salle-fin') && o.barre().textContent.trim() === t,
      `« ${t} » : le gros bouton est le dernier élément`);
  }
});
rendu('vibration : le clic transmis à l\'interrupteur est ignoré (une seule série par toucher)', async () => {
  const { sc, o } = ecran(seanceEnCours(0), { courant: 'Développé assis à la machine' });
  const x = sc.exos[sc.courant];
  await o.cliquer(o.barre(), { target: { tagName: 'INPUT' } });
  egal(x.faites.length, 0, 'le second clic (celui de l\'interrupteur) ne fait rien');
  await o.cliquer(o.barre(), { target: { tagName: 'LABEL' } });
  egal(x.faites.length, 1, 'le toucher du bouton note la série');
});
rendu('vibration coupée (pas d\'interrupteur) : le gros bouton marche pareil', async () => {
  const sc = seanceEnCours(0);
  const p = monPlugin({ enCours: sc });
  p.vibreur = () => null;
  sc.exos.forEach((x) => { delete x.approches; });   // comme ecran() : la séance commence à la série 1
  sc.courant = 2;
  const v = nouvelleVue(p); v.ecran = 'seance'; v.rendre();
  const o = outils(v);
  ok(!o.barre().tous((e) => e.tagName === 'input').length, 'pas d\'interrupteur');
  await o.cliquer(o.barre());
  egal(sc.exos[2].faites.length, 1, 'la série est notée');
});
rendu('son : le toucher du gros bouton prépare le son, avant tout le reste', async () => {
  const { p, o } = ecran(seanceEnCours(0), { courant: 'Développé assis à la machine' });
  await o.cliquer(o.barre());
  ok(p.journal[0] === 'son', 'preparerSon d\'abord (dans le toucher, iOS laisse ensuite sonner le bip)');
});
rendu('commande « Série faite » : validerSerie() sans argument lit la saisie', async () => {
  const { v, sc } = ecran(seanceEnCours(0), { courant: 'Développé assis à la machine' });
  v.saisie = { pour: sc.courant, c: 22.5, v: 9 };
  await v.validerSerie();
  egal(sc.exos[2].faites, [{ c: 22.5, r: 9 }], 'la série notée');
});

// ── Le record ──
const HIST_TIRAGE = [note('2026-11-13', 'Séance A', [['Tirage vertical prise large', [[35, 12], [35, 12], [35, 12]]]])];
rendu('record : la ligne devient dorée, avec le trophée et « Nouvelle charge : 37,5 kg, avant 35 »', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { seances: HIST_TIRAGE, courant: 'Tirage vertical prise large' });
  avis.length = 0;
  v.saisie = { pour: sc.courant, c: 37.5, v: 8 };
  await v.validerSerie();
  const x = sc.exos[indice(sc, 'Tirage vertical prise large')];
  egal(x.faites[0], { c: 37.5, r: 8, record: 'charge' }, 'la série porte son record');
  const l = o.lignes()[1];
  ok(o.aClasse(l, 'salle-serie-record') && o.aClasse(l, 'salle-etat-record') && o.une('salle-badge', l).textContent.indexOf('Record') >= 0, 'la ligne en or, « Record »');
  ok(!/Nouvelle charge/.test(l.textContent), 'plus de ligne « Nouvelle charge » sous la série (2.38.11 : le repos l\'annonce)');
  ok(o.une('salle-repos-record').textContent.indexOf('Tirage vertical prise large : Nouvelle charge : 37,5 kg, avant 35') >= 0 && !avis.some((t) => t.indexOf('Nouvelle charge') >= 0),
    'le message dans le repos, près de la ligne, pas dans une alerte qui disparaît');
});
rendu('record : jamais au premier essai, un seul par exercice et par séance', async () => {
  const s1 = ecran(seanceEnCours(0), { courant: 'Tirage vertical prise large' });
  s1.v.saisie = { pour: s1.sc.courant, c: 50, v: 12 };
  await s1.v.validerSerie();
  ok(!s1.sc.exos[1].faites[0].record && !s1.o.classe('salle-serie-record').length, 'premier essai : pas de record');
  const s2 = ecran(seanceEnCours(0), { seances: HIST_TIRAGE, courant: 'Tirage vertical prise large' });
  for (const c of [37.5, 40]) { s2.v.saisie = { pour: 1, c, v: 8 }; await s2.v.validerSerie(); }
  egal(s2.sc.exos[1].faites.map((f) => f.record || null), ['charge', null], 'le second record du même exercice n\'est pas refêté');
});

// ── Le repos ──
const HIST_PRESSE = [note('2026-11-13', 'Séance A', [['Presse à cuisses', [[60, 10], [60, 10], [60, 9]]]])];
rendu('repos : la suite annoncée, « Ensuite : série 2 sur 3 », puis « 60 kg × 11 » en gros (2.38.53)', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { seances: HIST_PRESSE, courant: 'Presse à cuisses' });
  v.saisie = { pour: sc.courant, c: 60, v: 10 };
  await v.validerSerie();
  ok(sc.reposTotal === 120 && Math.abs(sc.reposFin - Date.now() - 120000) < 2000, 'le repos de la presse : 2 min');
  egal([o.une('salle-suite').textContent, o.une('salle-suite-charge').textContent.replace(/\s+/g, ' ').trim(), o.classe('salle-suite-series').length], ['Ensuite : série 2 sur 3', '60 kg × 11', 0], 'la suite : la série, puis la charge en gros, seule');
});
rendu('repos : un autre exercice ensuite, avec son étage', async () => {
  const sc = seanceEnCours(0);
  sc.exos[1].faites = Array.from({ length: sc.exos[1].series }, () => ({ c: 30, r: 10 }));   // 2.38.72 : le suivant est le premier pas fini
  sc.exos[2].faites = [{ c: 20, r: 10 }, { c: 20, r: 10 }];
  const { v, o } = ecran(sc, { courant: 2 });
  v.saisie = { pour: 2, c: 20, v: 10 };
  await v.validerSerie();
  ok(sc.courant === 3 && o.une('salle-suite').textContent === 'Ensuite : Presse à cuisses · Étage 1', '« Ensuite : Presse à cuisses · Étage 1 »');
  ok(/^\d/.test((o.une('salle-suite-charge') || {}).textContent || '') && /^\d séries?$/.test((o.une('salle-suite-series') || {}).textContent || ''),
    'repos avant un nouvel exercice : sa charge en gros, ses séries sur la ligne dessous (2.38.49 : « 90 kg × 10 » / « 3 séries »)');
});
// 2.11.1 (demande : « tu dis Passer ou +15 : tu n'écoutes pas ») : le repos n'a aucun bouton, il se fait en entier.
rendu('repos : ni −15 s, ni +15 s, ni « Passer »', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 'Presse à cuisses' });
  await v.validerSerie();
  // 2.38.8 : l'animation de l'exercice (un toucher l'agrandit) est là à chaque repos ; aucun autre bouton (ni temps, ni « Passer »).
  const image = o.une('salle-repos').tous((e) => /salle-anim-suivant/.test(e.className || ''));
  const dansImage = (b) => image.some((i) => i === b || i.tous((e) => e === b).length);
  egal([sc.reposFin > 0, o.une('salle-repos').tous((e) => e.tagName === 'button' && !dansImage(e)).length, typeof v.finirRepos, typeof v.changerRepos], [true, 0, 'undefined', 'undefined'], 'aucun bouton dans le repos (hors l\'animation)');
});
rendu('repos : les 10 dernières secondes, une seule couleur change (sans clignoter)', async () => {
  const sc = seanceEnCours(0);
  sc.reposFin = Date.now() + 30000; sc.reposTotal = 120;
  const { o } = ecran(sc, { courant: 2 });
  tic();
  egal(o.une('salle-repos').className, 'salle-repos', 'à 30 s : la couleur habituelle');
  sc.reposFin = Date.now() + 8000;
  tic();
  egal(o.une('salle-repos').className, 'salle-repos salle-repos-bientot', 'à 8 s : la couleur change');
});
rendu('fin du repos : 3 bips, « C\'est reparti » en vert 5 s, puis le bandeau part', async () => {
  const sc = seanceEnCours(0);
  sc.reposFin = Date.now() - 1000; sc.reposTotal = 120;
  const { p, o } = ecran(sc, { courant: 2 });
  tic();
  const boite = o.une('salle-repos');
  ok(o.aClasse(boite, 'salle-repos-fini') && boite.textContent.indexOf('C\'est reparti') >= 0 && o.une('salle-repos-temps').textContent === 'GO' && boite.style.display === '', '« C\'est reparti » et « GO » en très gros, en vert');
  tic();
  egal(p.bips, [3], 'trois bips, une seule fois');
  sc.reposFin = Date.now() - 6000;
  tic();
  ok(sc.reposFin === 0 && boite.style.display === 'none', 'après 5 s, le bandeau part');
});
rendu('repos : « Repos salle » (le minuteur de l\'iPhone) part avant l\'enregistrement', async () => {
  const { v, p, sc } = ecran(seanceEnCours(0), { courant: 'Presse à cuisses' });
  await v.validerSerie();
  const c = p.journal.indexOf('chrono:120'), s = p.journal.indexOf('sauver');
  ok(c >= 0 && s > c && sc.reposFin > 0, 'chronoIphone(120) avant sauver (sinon iOS refuse le raccourci)');
});
rendu('lancerRepos() (commande « Lancer le repos ») : le repos de l\'exercice affiché, ou les secondes données', async () => {
  const { v, p, sc } = ecran(seanceEnCours(0), { courant: 'Élévations latérales aux haltères' });
  await v.lancerRepos();
  ok(sc.reposTotal === 90 && p.journal.indexOf('chrono:90') >= 0 && p.journal.indexOf('chrono:90') < p.journal.indexOf('sauver'), 'les 1 min 30 des élévations, « Repos salle » d\'abord');
  await v.lancerRepos(45);
  ok(sc.reposTotal === 45 && Math.abs(sc.reposFin - Date.now() - 45000) < 2000, '45 s demandées');
});

// ── Les superséries ──
rendu('superséries : la carte dit « Supersérie avec … », A1 puis B1 sans repos, 1 min 30 après le tour', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0, { temps: 45 }), { courant: 'Tirage vertical prise large' });
  const a = indice(sc, 'Tirage vertical prise large'), b = indice(sc, 'Développé assis à la machine');
  ok(sc.exos[a].groupe && sc.exos[a].groupe === sc.exos[b].groupe && o.une('salle-superserie').textContent.indexOf('Supersérie avec Développé assis à la machine · tour 1 sur 3') >= 0,
    'A1 : « Supersérie avec Développé assis à la machine · tour 1 sur 3 »');
  await v.validerSerie();
  ok(sc.courant === b && sc.reposFin === 0 && o.une('salle-superserie').textContent.indexOf('Supersérie avec Tirage vertical prise large · tour 1 sur 3') >= 0, 'B1 tout de suite, sans repos');
  await v.validerSerie();
  ok(sc.courant === a && sc.reposTotal === 90 && o.une('salle-superserie').textContent.indexOf('tour 2 sur 3') >= 0, 'fin du tour : 1 min 30, puis A2');
});
rendu('superséries : les deux exercices reliés dans la liste', async () => {
  const { o } = ecran(seanceEnCours(0, { temps: 45 }), { courant: 1 });
  await o.cliquer(o.une('salle-ouvrir-liste'));   // 2.38.19 : la liste est dans le panneau « La séance »
  egal(o.classe('salle-superserie-rang').length, 4, 'deux superséries, quatre lignes reliées');
});

// ── Le chrono du gainage ──
rendu('chrono du gainage : « Lancer le chrono », départ dans 3 s, un chiffre qui monte, un repère à la cible', async () => {
  const { sc, o } = ecran(seanceEnCours(0), { courant: 'Gainage planche' });
  egal(o.barre().textContent.trim(), 'Lancer le chrono', 'le gros bouton lance le chrono');
  await o.cliquer(o.barre());
  ok(Math.abs(sc.chronoDebut - Date.now() - 3000) < 1000 && o.une('salle-chrono-repere') && o.une('salle-chrono').textContent.indexOf('cible : 30 s') >= 0, 'départ dans 3 s, repère à la cible (30 s)');
  tic();
  egal(o.barre().textContent.trim(), 'Départ dans 3 s', '3, 2, 1…');
  sc.chronoDebut = Date.now() - 10000;
  tic();
  ok(o.une('salle-chrono-temps').textContent === '0:10' && o.barre().textContent.trim() === 'Fait · 0:10', 'le chiffre monte : 0:10');
});
rendu('chrono du gainage : un bip à la cible, une seule fois', async () => {
  const sc = seanceEnCours(0);
  sc.chronoDebut = Date.now() - 31000;
  const { p, o } = ecran(sc, { courant: 'Gainage planche' });
  tic(); tic();
  ok(p.bips.length === 1 && p.bips[0] === 1 && o.aClasse(o.une('salle-chrono'), 'salle-chrono-atteint'), 'un bip, la jauge passe au vert');
});
rendu('chrono du gainage : « Fait » note le temps tenu', async () => {
  const sc = seanceEnCours(0);
  sc.chronoDebut = Date.now() - 42000;
  const { o } = ecran(sc, { courant: 'Gainage planche' });
  await o.cliquer(o.barre());
  const x = sc.exos[indice(sc, 'Gainage planche')];
  ok(x.faites.length === 1 && x.faites[0].s === 42 && sc.chronoDebut === 0, '42 s notées, le chrono s\'arrête');
});
rendu('gainage sans chrono : « Noter sans chrono » note les secondes du compteur', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 'Gainage planche' });
  v.saisie.v = 35;
  await o.toucher('Noter sans chrono');
  egal(sc.exos[indice(sc, 'Gainage planche')].faites, [{ s: 35 }], '35 s');
});

// ── Une consigne une fois ──
// 2.8.0 (changement voulu) : la douleur après la réserve, et les règles de la salle pendant un repos, en dernier.

// ── Chiffres et couleurs ──
rendu('chiffres : la cible, la saisie, le repos et le temps en police de chiffres (.salle-nombre)', async () => {
  const sc = seanceEnCours(0);
  sc.reposFin = Date.now() + 60000; sc.reposTotal = 120;
  const { o } = ecran(sc, { seances: HIST_DEV, courant: 'Développé assis à la machine' });
  ok(['salle-cible-gros', 'salle-champ', 'salle-repos-temps'].every((c) => o.aClasse(o.une(c), 'salle-nombre')) && o.aClasse(o.une('salle-serie-avant', o.lignes()[1]), 'salle-nombre'), 'cible, champs, repos, la fois d\'avant');
  ok(o.aClasse(o.une('salle-titre-seance').childNodes[1], 'salle-nombre') && /^23 min/.test(o.une('salle-titre-seance').childNodes[1].textContent), 'le temps de la séance');
});
rendu('une couleur, un sens : maintenant (accent), fait (vert), record (or), à venir (pâle)', async () => {
  const sc = seanceEnCours(0, { seances: HIST_TIRAGE });
  sc.exos[1].faites = [{ c: 37.5, r: 8, record: 'charge' }];
  const { o } = ecran(sc, { seances: HIST_TIRAGE, courant: 1 });
  const l = o.lignes();
  ok(o.aClasse(l[1], 'salle-etat-record') && o.aClasse(l[2], 'salle-etat-maintenant') && o.aClasse(l[3], 'salle-etat-pale'), 'record, maintenant, à venir');
  const s2 = ecran(seanceEnCours(0), { courant: 1 });
});

// ── Exercice fini, en plus, tout fait ──
// Relecture 2.0 : le cardio se décide quand tout est fait, d'après le temps vraiment passé (L.cardioAuBout), plus d'après
// l'estimation du départ ; « vélo plutôt que tapis » (La bonne séance).
const toutFaire = (sc) => sc.exos.forEach((x) => { x.faites = x.echauffement ? [{ min: 5 }] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
// Relecture 2.0 : un exercice fini n'affiche plus de cible en gros pour une série qui n'est pas prévue.
// Relecture 2.0 : le rang ne compte pas l'échauffement (« Ta séance d'aujourd'hui » annonce 8 exercices pour A).
rendu('rang : « Exercice 1 sur 8 » pour le premier vrai exercice, « Pour commencer » sur l\'échauffement', async () => {
  const sc = seanceEnCours(0);
  const { o } = ecran(sc, { courant: 1 });
  ok(o.texte().indexOf('Exercice 1 sur 8 · Étage 1') >= 0 && o.texte().indexOf('sur 9') < 0, 'le premier exercice : 1 sur 8');
  const e = ecran(seanceEnCours(0), { courant: 0 });
  ok(e.o.texte().indexOf('Pour commencer · Étage 1') >= 0 && e.o.texte().indexOf('Exercice 1 sur') < 0, 'l\'échauffement : « Pour commencer »');
});
// Relecture 2.0 : un exercice jamais fait, « sans aller au bout » jusqu'à la dernière série (« La bonne séance »).
rendu('première fois : la dernière série dit encore « il t\'en reste 2 », plus « va jusqu\'à 1, ou 0 »', async () => {
  const sc = seanceEnCours(0, { seances: HIST_DEV });
  const i = indice(sc, 'Tirage vertical prise large');
  sc.exos[i].faites = sc.exos[i].faites.concat(Array.from({ length: sc.exos[i].series - 1 }, () => ({ c: 40, r: 9 })));
  const { o } = ecran(sc, { seances: HIST_DEV, courant: i });
  ok(sc.exos[i].series === 2 && o.une('salle-effort').textContent === 'Première fois : arrête-toi quand il t\'en reste 2, même à la dernière série.' && o.texte().indexOf('va jusqu\'à 1') < 0, 'jamais fait : 2 séries, et sans aller au bout à la dernière');
});
rendu('tout est fait : « Terminer et enregistrer » en bas, 5 min de vélo quand le temps est passé', async () => {
  const sc = seanceEnCours(0);
  toutFaire(sc);
  sc.debut = Date.now() - 64 * 60000;   // 64 min sur 1 h : plus de marge
  sc.cardio = 15;                        // ce que le départ avait prévu
  const { o } = ecran(sc, { courant: 1 });
  ok(sc.cardio === 5 && sc.cardioFixe === true && o.texte().indexOf('Pour finir : 5 min de vélo tranquille') >= 0 && o.texte().indexOf('tapis') < 0 && o.barre().textContent.trim() === 'Terminer et enregistrer', 'cardio 5 min, « Terminer et enregistrer »');
});
rendu('tout est fait vite : il reste du temps, le cardio monte (15 min)', async () => {
  const sc = seanceEnCours(0);
  toutFaire(sc);
  sc.cardio = 5;   // 23 min sur 1 h : il reste 37 min
  const { o, v } = ecran(sc, { courant: 1 });
  ok(sc.cardio === 15 && o.texte().indexOf('Pour finir : 15 min de vélo tranquille') >= 0, '15 min');
  sc.cardio = 10;   // changé à la main : il ne bouge plus
  v.rendre();
  ok(sc.cardio === 10, 'changé à la main, gardé');
});
rendu('tout est fait, séance de 45 min sans marge : pas de cardio', async () => {
  const sc = seanceEnCours(0, { temps: 45 });
  toutFaire(sc);
  sc.debut = Date.now() - 44 * 60000;
  const { o } = ecran(sc, { courant: 1 });
  ok(sc.cardio === 0 && o.texte().indexOf('Pas de cardio prévu') >= 0 && o.texte().indexOf('Cardio tranquille') < 0, 'pas de cardio, et rien dans la liste');
});
rendu('réserve : « il t\'en restait combien ? » après la dernière série, la réponse la range', async () => {
  const sc = seanceEnCours(0);
  sc.exos[2].faites = [{ c: 20, r: 10 }, { c: 20, r: 10 }];
  const { v, o } = ecran(sc, { courant: 2 });
  await v.validerSerie();
  ok(sc.question === 2 && o.texte().indexOf('il t\'en restait combien ?') >= 0, 'la question');
  await o.toucher('1 ou 2');
  ok(sc.exos[2].reserve === '1-2' && sc.question === null && o.texte().indexOf('il t\'en restait combien ?') < 0, 'notée, la question part');
});

// ── Terminer ──
function seanceFaite(o) {
  const sc = seanceEnCours(0);
  sc.exos[0].faites = [{ min: 5 }];
  sc.veloNiveau = 9;
  sc.exos[1].approches[0] = { pct: 50, r: 8, faite: true, c: 20 };
  sc.exos[1].approches[1] = { pct: 75, r: 4, faite: true, c: 30 };
  sc.exos[1].faites = [{ c: 37.5, r: 8, record: 'charge' }, { c: 37.5, r: 8 }];
  sc.exos[2].faites = [{ c: 20, r: 10 }];
  return ecran(sc, Object.assign({ seances: HIST_TIRAGE, courant: 2, legeres: true }, o || {}));
}
rendu('terminer : la note garde le vélo et les approches cochées en une seule ligne', async () => {
  const { v, p } = seanceFaite();
  await v.terminer();
  const t = p.ecrit[p.ecrit.length - 1];
  ok(t.indexOf('Échauffement : 5 min, puis approches : Tirage vertical prise large 8 × 20 kg, 4 × 30 kg') >= 0 && t.indexOf('## Échauffement') < 0, 'une seule ligne, jamais un « ## »');
  const relue = L.lireSeance(t);
  egal(relue.exos.map((x) => x.nom), ['Tirage vertical prise large', 'Développé assis à la machine'], 'les approches ne deviennent ni un exercice ni une série');
});
rendu('terminer : le champ « record » ne va pas dans la note', async () => {
  const { v, p } = seanceFaite();
  await v.terminer();
  const t = p.ecrit[p.ecrit.length - 1];
  egal(L.lireSeance(t).exos[0].series, [{ c: 37.5, r: 8 }, { c: 37.5, r: 8 }], 'les séries seules');
  ok(v.bilan.seance.exos[0].series.every((s) => !('record' in s)), 'ni dans la séance donnée au bilan');
});
rendu('terminer : le bilan de fin reçoit records, comparaison, chemin et nombre de séries', async () => {
  const { v, p } = seanceFaite();
  await v.terminer();
  const b = v.bilan;
  ok(v.ecran === 'bilan' && b && b.series === 3 && b.chemin === 'x.md' && b.premiere === false && b.ressenti === '', 'l\'écran du bilan, 3 séries');
  egal(b.records, ['Tirage vertical prise large'], 'le record du tirage');
  ok(typeof L.bilanCompare !== 'function' || (b.compare && Array.isArray(b.compare.tuiles)), 'la comparaison à la fois d\'avant (L.bilanCompare)');
  ok(p.journal.indexOf('recharger') >= 0 && p.donnees.enCours === null, 'la séance en cours est finie, les notes sont relues');
});
rendu('terminer : le cardio n\'est plus écrit dans les réglages (cardioMin)', async () => {
  const { v, p } = seanceFaite();
  // Assemblage 2.0 : tous les exercices faits (la carte du cardio a été montrée), sinon le cardio prévu ne compte pas (test suivant).
  p.donnees.enCours.exos.forEach((x) => { if (!x.echauffement && !L.fini(x)) x.faites = Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
  p.donnees.enCours.cardio = 10;
  await v.terminer();
  ok(!('cardioMin' in p.donnees.reglages) && /cardio_min: 10/.test(p.ecrit[p.ecrit.length - 1]), 'dans la note seulement');
});
rendu('terminer avant la fin : le cardio prévu au départ n\'est pas écrit (il n\'a pas eu lieu)', async () => {   // assemblage 2.0
  const { v, p } = seanceFaite();
  p.donnees.enCours.cardio = 15;   // nouvelleSeance le remplit dès le départ (sj.duree.cardio)
  await v.terminer();
  const t = p.ecrit[p.ecrit.length - 1];
  ok(!/cardio_min/.test(t) && v.bilan && !v.bilan.seance.cardioMin, 'ni dans la note, ni dans le bilan de fin');
});
rendu('terminer sans aucune série : la séance est annulée, rien n\'est écrit', async () => {
  const { v, p } = ecran(seanceEnCours(0), { courant: 1 });
  await v.terminer();
  ok(p.donnees.enCours === null && !p.ecrit.length && v.ecran === 'accueil', 'annulée');
});
rendu('terminer : la note ne s\'écrit pas → la séance reste en cours', async () => {
  const { v, p } = seanceFaite();
  p.enregistrerSeance = async () => { throw new Error('disque plein'); };
  avis.length = 0;
  await v.terminer();
  ok(p.donnees.enCours && avis.some((t) => t.indexOf('Rien n\'est perdu') >= 0), 'rien n\'est perdu');
});

// ── Entrer, reprendre ──
rendu('entrer dans la séance : rien de fait → l\'échauffement ; déjà commencé → là où on en était', async () => {
  const sc = seanceEnCours(0);
  const p = monPlugin({ enCours: sc });
  const v = nouvelleVue(p);
  sc.courant = 3;
  v.ecran = 'accueil'; v.aller('seance');
  egal(sc.courant, 0, 'rien de fait : l\'échauffement');
  sc.exos[2].faites = [{ c: 20, r: 10 }]; sc.courant = 2;
  v.ecran = 'accueil'; v.aller('seance');
  egal(sc.courant, 2, 'déjà commencé : on reste');
});
rendu('séance en cours de la 1.15.0 (série d\'échauffement) : affichée en 2.0, l\'approche reprise', async () => {
  const vieille = seanceEnCours(0);
  delete vieille.version;
  vieille.exos.forEach((x) => { delete x.approches; });
  vieille.exos[1].echauffeSerie = { faite: true, c: 8, r: 10 };
  const { p, o } = ecran(vieille, { courant: 1, legeres: true });
  const sc = p.donnees.enCours;
  ok(!o.erreur() && sc.version === 2 && !('echauffeSerie' in sc.exos[1]), 'remise à la forme 2.0');
  egal(sc.exos[1].approches, [{ pct: 50, r: 10, faite: true, c: 8 }], 'la série d\'échauffement devient une approche cochée');
  ok(o.classe('salle-serie-legere').length === 1 && o.aClasse(o.classe('salle-serie-legere')[0], 'salle-serie-faite'), 'et s\'affiche, faite');
});

// ── Passer, remplacer, annuler ──
rendu('remplacer (menu « … ») : le nom change, le réglage du banc part, la cible suit le nouveau nom', async () => {
  const hist = [note('2026-11-13', 'Séance B', [['Développé incliné à la machine', [[30, 10], [30, 10], [30, 9]]]])];
  const { sc, o } = ecran(seanceEnCours(1), { seances: hist, courant: 'Développé incliné aux haltères' });
  ok(sc.exos[sc.courant].reglage === 'banc 30° (2e ou 3e cran)', 'avant : l\'exercice a son réglage du banc');
  await o.toucher('Plus d\'actions');
  await o.toucher('Remplacer par un autre exercice');
  await o.toucher('Développé incliné à la machine');
  const x = sc.exos[sc.courant];
  ok(x.nom === 'Développé incliné à la machine' && !x.reglage && o.texte().indexOf('banc à 30°') < 0, 'le nom change, le réglage du banc part');
  egal(o.une('salle-cible-gros').textContent, '30 kg × 11', 'la cible vient de l\'historique du nouveau nom');
});
// 2.22.0 (l'utilisateur, après sa première vraie séance : « j'oublie de mettre à jour le poids ou une série que je viens de faire, du
// coup je validais une mauvaise ; juste la précédente ») : la dernière série notée de l'exercice se corrige.
rendu('« Corriger » : la dernière série notée se corrige (charge, répétitions), son record est recalculé ; rien d\'autre ne bouge', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0, { seances: HIST_TIRAGE }), { seances: HIST_TIRAGE, courant: 1 });
  const x = sc.exos[1];
  ok(!o.bouton('Corriger'), 'aucune série notée : pas de « Corriger »');
  await v.validerSerie();   // la cible telle quelle : 37,5 kg, plus lourd que jamais (un record), alors qu'il avait fait moins
  const fin = sc.reposFin, total = sc.reposTotal;
  await o.toucher('Plus d\'actions');
  egal([x.faites.length, x.faites[0].record, !!o.bouton('Corriger la dernière série')], [1, 'charge', true], 'une série notée (un record par erreur) : « Corriger la dernière série » dans le menu « … » (2.38.16)');
  await o.toucher('Corriger la dernière série');
  egal([v.corrige && v.corrige.m, v.corrige && v.corrige.c, o.classe('salle-serie-correction').length, !!o.bouton('Enregistrer'), !!o.bouton('Annuler')], [0, x.faites[0].c, 1, true, true], 'la ligne passe en correction, avec ses chiffres');
  v.corrige.c = 35; v.corrige.v = 10;
  await o.toucher('Enregistrer');
  egal([x.faites, v.corrige, sc.reposFin === fin && sc.reposTotal === total, sc.courant, o.classe('salle-serie-correction').length], [[{ c: 35, r: 10 }], null, true, 1, 0],
    'corrigée : 35 kg × 10, plus de record ; le repos et l\'exercice en cours ne bougent pas');
  await o.toucher('Plus d\'actions');
  await o.toucher('Corriger la dernière série');
  await o.toucher('Annuler');
  egal([x.faites, v.corrige], [[{ c: 35, r: 10 }], null], '« Annuler » : rien ne change');
  sc.reposFin = 0;
  await v.validerSerie();
  await o.toucher('Plus d\'actions');
  await o.toucher('Corriger la dernière série');
  egal([x.faites.length, v.corrige && v.corrige.m], [2, 1], 'deux séries notées : « Corriger » prend la dernière');
});
// 2.38.37 (demande : « Machine prise » inutile, il change lui-même d'exercice dans « La séance ») : plus dans le menu.
rendu('le menu « … » n\'a plus « Machine prise » ; « La séance » le dit et sert à changer d\'exercice', async () => {
  const { sc, o } = ecran(seanceEnCours(0), { courant: 2 });
  await o.toucher('Plus d\'actions');
  ok(!o.bouton('Machine prise : j\'y reviens après'), 'plus dans le menu');
  await o.cliquer(o.une('salle-ouvrir-liste'));
  await o.cliquer(o.classe('salle-rang')[3]);
  ok(sc.courant === 3 && !L.fini(sc.exos[2]), 'changé par la liste ; le développé reste à faire');
});
rendu('« Ne pas le faire aujourd\'hui » : passé, compté comme fait, « Le refaire » possible', async () => {
  const s0 = seanceEnCours(0);
  s0.exos[1].faites = Array.from({ length: s0.exos[1].series }, () => ({ c: 30, r: 10 }));   // 2.38.72 : le suivant est le premier pas fini
  const { sc, o } = ecran(s0, { courant: 2 });
  await o.toucher('Plus d\'actions');
  await o.toucher('Ne pas le faire aujourd\'hui');
  await o.toucher('Pas le temps');
  ok(sc.exos[2].saute && sc.exos[2].saute.raison === 'temps' && sc.courant === 3, 'passé, on va au suivant');
  await o.cliquer(o.une('salle-ouvrir-liste'));   // 2.38.19 : la liste est dans le panneau « La séance »
  await o.cliquer(o.classe('salle-rang').find((e) => e.textContent.indexOf(sc.exos[2].nom) >= 0));   // 2.38.72 : passé, il est en bas
  ok(o.texte().indexOf('Pas fait aujourd\'hui (pas le temps)') >= 0 && o.barre().textContent.trim() === 'Exercice suivant', 'sa carte le dit ; le gros bouton mène au suivant');
  await o.toucher('Le refaire');
  ok(!sc.exos[2].saute, 'refait');
});
// 2.0 (relecture du 14/11, règle de l'utilisateur) : « Fatigue » n'est plus une raison de passer un exercice (une excuse toute prête ;
// la fatigue se dit dans le bilan d'avant, qui allège déjà la séance). Une note qui dit « (fatigue) » se relit toujours.
rendu('« Ne pas le faire aujourd\'hui » : douleur, pas le temps, autre ; plus « Fatigue »', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 2 });
  await o.toucher('Plus d\'actions');
  await o.toucher('Ne pas le faire aujourd\'hui');
  const choix = o.classe('salle-actions')[0].tous((e) => e.tagName === 'button').map((b) => b.textContent.trim()).filter((t) => t !== 'Retour');
  egal([choix, L.lirePasFait('Pas fait : Face pull à la poulie (fatigue)')], [['Douleur', 'Pas le temps', 'Autre'], [{ nom: 'Face pull à la poulie', raison: 'fatigue' }]],
    '« Ne pas le faire aujourd\'hui » : douleur, pas le temps, autre ; plus « Fatigue »');
});
// 2.38.1 (demande : pouvoir noter une série faite en plus de celles prévues) : « Noter une série en plus » dans le menu « … ».
rendu('« Noter une série en plus » : une ligne Maintenant de plus, la charge de la dernière série', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 2 });
  const x = sc.exos[2], n = x.series;
  for (let k = 0; k < n; k++) { if (k) sc.reposFin = 0; await v.validerSerie(); }
  sc.courant = 2; sc.reposFin = 0;
  v.rendre();
  ok(L.fini(x) && !o.classe('salle-serie-courante').length, 'exercice fini : plus de ligne Maintenant');
  await o.toucher('Plus d\'actions');
  await o.toucher('Noter une série en plus');
  ok(x.series === n + 1 && !L.fini(x) && o.classe('salle-serie-courante').length === 1 && v.saisie.c === x.faites[n - 1].c, 'une ligne Maintenant de plus, la charge de la dernière série remplie');
  await v.validerSerie();
  ok(x.faites.length === n + 1 && L.fini(x), 'la série en plus est notée, l\'exercice est fini');
});
rendu('« Annuler la dernière série » : retirée, le repos s\'arrête', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 2 });
  await v.validerSerie();
  ok(sc.exos[2].faites.length === 1 && sc.reposFin > 0, 'une série, un repos');
  await o.toucher('Plus d\'actions');
  await o.toucher('Annuler la dernière série');
  ok(!sc.exos[2].faites.length && sc.reposFin === 0, 'retirée, plus de repos');
});

// ── L'échauffement ──
rendu('échauffement : « Fait » en bas note le vélo et passe au premier exercice', async () => {
  const { sc, o } = ecran(seanceEnCours(0), { courant: 0 });
  egal(o.une('salle-cible-gros').textContent, '5 min de vélo', 'la cible : 5 min de vélo');
  await o.cliquer(o.barre());
  ok(sc.exos[0].faites.length === 1 && sc.exos[0].faites[0].min === 5 && sc.courant === 1, 'fait, puis le tirage');
});
rendu('échauffement : le minuteur de 5 min se lance d\'un toucher et prépare le son', async () => {
  const { p, sc, o } = ecran(seanceEnCours(0), { courant: 0 });
  await o.toucher('Lancer le minuteur de 5 minutes');
  ok(Math.abs(sc.echauffeFin - Date.now() - 300000) < 2000 && p.journal[0] === 'son', '5 min, le son prêt');
});
rendu('échauffement : à la fin des 5 min, un bip et un message', async () => {
  const sc = seanceEnCours(0);
  sc.echauffeFin = Date.now() - 1000;
  avis.length = 0;
  const { p } = ecran(sc, { courant: 0 });
  tic(); tic();
  ok(p.bips.length === 1 && avis.some((t) => t.indexOf('Échauffement terminé') >= 0), 'un bip, un message, une fois');
});

// ── L'en-tête, la liste, annuler ──
rendu('le temps de la séance : « 23 min sur environ 1 h 10 », ou « commencée le 13/11 »', async () => {
  const m = Date.now();
  egal([ECRAN_SEANCE.temps({ date: AUJ, debut: m - 23 * 60000, dureePrevue: 69 }, AUJ, m), ECRAN_SEANCE.temps({ date: AUJ, debut: m - 5 * 60000 }, AUJ, m), ECRAN_SEANCE.temps({ date: '2026-11-13', debut: 0 }, AUJ, m)],
    ['23 min sur environ 1 h 10', '5 min', 'commencée le 13/11'], 'le temps');
});
rendu('la dernière fois en court : « 35 × 10 », « 12 rép. », « 40 s », « — »', async () => {
  egal([{ c: 35, r: 10 }, { c: 0, r: 12 }, { s: 40 }, null, { c: 17.5, r: 9 }].map(ECRAN_SEANCE.court), ['35 × 10', '12 rép.', '40 s', '—', '17,5 × 9'], 'court');
});
// 2.38.11 (demande : épurer l'écran des séries) : plus de « Ta meilleure : … » sous la série en cours.
rendu('en-tête : « Terminer » demande un second toucher tant que tout n\'est pas fait', async () => {
  const { sc, p, o } = ecran(seanceEnCours(0), { courant: 2 });
  sc.exos[2].faites = [{ c: 20, r: 10 }];
  await o.toucher('Terminer');
  ok(p.donnees.enCours && o.bouton('Confirmer : terminer'), 'premier toucher : « Confirmer : terminer »');
  await o.toucher('Confirmer : terminer');
  ok(p.donnees.enCours === null && p.ecrit.length === 1, 'second toucher : enregistrée');
});
rendu('« Annuler la séance » : deux touchers, rien n\'est enregistré', async () => {
  const { v, p, o } = ecran(seanceEnCours(0), { courant: 2 });
  await o.cliquer(o.une('salle-ouvrir-liste'));   // 2.38.19 : « Annuler la séance » est dans le panneau « La séance »
  const panneau = o.une('salle-panneau');
  await o.toucher('Annuler la séance');
  ok(p.donnees.enCours && o.bouton('Toucher encore : annuler (0 série perdue)'), 'premier toucher : il redemande');
  ok(o.une('salle-panneau') === panneau, 'premier toucher : le même panneau reste (pas redessiné, il ne revient pas en haut) — 2.38.31');
  await o.toucher('Toucher encore');
  ok(p.donnees.enCours === null && !p.ecrit.length && v.ecran === 'accueil', 'annulée');
  // 2.14.5 (demande : « quand j'annule la séance, après il ne repose plus les questions ») : le bilan du jour est à refaire.
  egal([p.donnees.bilan, v.bilanJour()], [{ date: v.aujourdhui(), aRefaire: true }, null], 'annulée : le bilan du jour est marqué « à refaire », il ne compte plus');
});
rendu('« Terminer » sans aucune série : comme une annulation, le bilan du jour est à refaire', async () => {
  const { v, p } = ecran(seanceEnCours(0), { courant: 2 });
  await v.terminer();
  egal([p.donnees.enCours, p.donnees.bilan, v.ecran], [null, { date: v.aujourdhui(), aRefaire: true }, 'accueil'], 'rien de fait : annulée, bilan à refaire');
});
rendu('la liste : un toucher change d\'exercice, un chrono lancé ailleurs s\'arrête', async () => {
  const sc = seanceEnCours(0);
  sc.chronoDebut = Date.now() - 5000;
  const { o } = ecran(sc, { courant: 'Gainage planche' });
  await o.cliquer(o.une('salle-ouvrir-liste'));   // 2.38.19 : la liste est dans le panneau « La séance »
  await o.cliquer(o.classe('salle-rang')[3]);
  const ferme = o.classe('salle-panneau').length === 0;
  await o.cliquer(o.une('salle-ouvrir-liste'));
  ok(sc.courant === 3 && sc.chronoDebut === 0 && ferme && o.aClasse(o.classe('salle-rang')[3], 'salle-courant'), 'la presse, le chrono arrêté, le panneau refermé');
});

// ── Sans erreur, sans émoji, sans les fonctions du plugin ──
rendu('aucune erreur d\'écran : échauffement, exercice, gainage, passé, repos, supersérie, tout fait', async () => {
  const etats = [];
  etats.push([seanceEnCours(0), 0]);
  etats.push([seanceEnCours(1), 'Développé incliné aux haltères']);
  etats.push([seanceEnCours(0), 'Gainage planche']);
  const saute = seanceEnCours(0); saute.exos[3].saute = { raison: 'douleur' }; etats.push([saute, 3]);
  const repos = seanceEnCours(0); repos.reposFin = Date.now() + 40000; etats.push([repos, 2]);
  etats.push([seanceEnCours(1, { temps: 45 }), 1]);
  const fini = seanceEnCours(0); fini.exos.forEach((x) => { x.faites = x.echauffement ? [] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); }); etats.push([fini, 0]);
  for (const [sc, c] of etats) {
    const { o } = ecran(sc, { seances: HIST_DEV.concat(HIST_PRESSE), courant: c });
    tic();
    ok(!o.erreur() && o.barre(), `sans erreur (${sc.nom}, ${typeof c === 'string' ? c : 'exercice ' + c})`);
  }
});
rendu('pas d\'émoji dans les boutons de la séance', async () => {
  const sc = seanceEnCours(0);
  sc.exos[2].faites = [{ c: 20, r: 10 }];
  const { o } = ecran(sc, { courant: 2 });
  await o.toucher('Plus d\'actions');
  ok(o.boutons().every((b) => !/\p{Extended_Pictographic}/u.test(b.textContent)), 'des icônes Lucide et des mots');
});
rendu('sans les fonctions du lot D (bip, vibreur, son, consignes, fichier d\'état) : rien ne casse', async () => {
  const sc = seanceEnCours(0);
  const p = monPlugin({ enCours: sc });
  ['bip', 'vibreur', 'preparerSon', 'dejaVu', 'marquerVu', 'chronoIphone'].forEach((k) => { delete p[k]; });
  sc.exos.forEach((x) => { delete x.approches; });   // comme ecran() : la séance commence à la série 1
  sc.courant = 2;
  const v = nouvelleVue(p); v.ecran = 'seance'; v.rendre();
  const o = outils(v);
  await o.cliquer(o.barre());
  sc.reposFin = Date.now() - 1000;
  v.rendre(); tic();
  await v.terminer();
  ok(!o.erreur() && v.ecran === 'bilan' && p.ecrit.length === 1, 'la séance se fait et s\'enregistre');
});

// ── Les styles (src/css/63-seance.css) ──
const CSS = (() => { try { return readFile('src/ecrans/63-seance.css'); } catch (e) { return ''; } })();
const regle = (sel) => { const i = CSS.indexOf(sel + ' {'); return i < 0 ? '' : CSS.slice(i, CSS.indexOf('}', i)); };
rendu('styles : le gros bouton collé en bas (sticky), toute la largeur, au-dessus de la zone sûre', async () => {
  const b = regle('.salle .salle-barre-bas');
  ok(/position: sticky/.test(b) && /bottom: 0/.test(b) && /padding: [^;]*calc\(var\(--size-4-2, 8px\) \+ var\(--salle-zone-sure\)\)/.test(b), 'sticky, bottom 0, la zone sûre de l\'iPhone sous le bouton');
  ok(/width: 100%/.test(regle('.salle .salle-barre-bas .salle-barre-action')) && /min-height: 56px/.test(regle('.salle .salle-barre-bas .salle-barre-action')), 'toute la largeur, 56 px de haut');
});
rendu('styles : le gros bouton ne cache jamais la fin de l\'écran (dans le flux, sans place vide dessous)', async () => {
  ok(!/position: fixed/.test(regle('.salle .salle-barre-bas')), 'pas en position fixe : le dernier élément reste au-dessus du bouton');
  ok(/height: 0/.test(regle('.salle .salle-barre-bas ~ .salle-fin')) && /padding-bottom: 0/.test(regle('body .salle:has(> .salle-barre-bas)')), 'pas de trou sous le bouton au bout de la page');
});
rendu('styles : jamais de rouge pour un résultat sur l\'écran de séance', async () => {
  ok(CSS.length > 0 && !/\bred\b|--text-error|--color-red/.test(CSS), 'ni rouge ni couleur d\'erreur');
});
rendu('styles : « Réduire les animations » coupe l\'éclat du record et les transitions', async () => {
  const m = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
  ok(/\.salle-serie-eclat \{ animation: none; \}/.test(m) && /transition: none/.test(m), 'rien ne bouge');
});
rendu('styles : les chiffres en police arrondie, à chasse fixe', async () => {
  const g = regle('.salle-cible-gros');
  ok(/font-family: var\(--salle-chiffres\)/.test(g) && /tabular-nums/.test(g), 'la cible en gros');
});

rendu('(fin du fichier : l\'horloge des tests est rendue)', async () => { window.setInterval = setIntervalVrai; });

// ── 2.8.0 : les consignes de l'ancienne note « Débuter à la salle », au moment de l'exercice ──
// Sans gras ni espaces : le faux DOM met un espace entre un morceau en gras et la suite (« 2 s . »).
const sansEspaces = (t) => String(t).replace(/\*\*/g, '').replace(/\s+/g, '');
const TEMPO_VU = sansEspaces('Tire en 1 s en expirant, reviens en 2 s en inspirant.');   // 2.10.0 : le verbe de l'exercice (un tirage)
const fois = (n) => [1, 2, 3, 4].slice(0, n).map((d) => note(`2026-11-0${d + 4}`, 'Séance A', [['Tirage horizontal à la poulie', [[40, 10], [40, 10]]]]));
// 2.38.25 : les lignes de l'aide ouverte (lignes courtes avec icône), en texte.
const lignesAide = (o) => o.classe('salle-repere', o.une('salle-exo-aide')).map((e) => e.textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim());
const aTempo = (o) => o.classe('salle-tempo').length >= 1 && sansEspaces(o.une('salle-tempo').textContent).indexOf(TEMPO_VU) >= 0;
rendu('a. le tempo : jamais pour un exercice au temps (gainage)', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 'Gainage planche' });
  ok(!o.erreur() && o.classe('salle-tempo').length === 0, 'gainage : pas de tempo');
});
// Une fiche du guide comme celles de « Guide des exercices » : un réglage, un geste qui dit le tempo, « Tu dois sentir ».
const FICHE_TIRAGE = { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: [
  '**Réglage :** assis, pieds sur les cale-pieds.', '- **Départ** : dos droit, bras tendus.',
  '**Geste :** tire la poignée en 1 seconde vers le nombril. Reviens en 2 secondes.', '**Tu dois sentir :** entre les omoplates.'] } };
rendu('b. la première fois : la fiche « Comment faire » ouverte avant la 1re série, « Fermer l\'aide » la ferme pour de bon', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie', guide: FICHE_TIRAGE });
  const fiche = () => !!o.une('salle-feuille-aide');   // 2.38.23 : l'aide dans une feuille ; 2.38.25 : en lignes courtes
  ok(fiche() && !!o.bouton('Fermer l\'aide'), 'jamais fait : la fiche est ouverte, avec « Fermer l\'aide »');
  ok(aTempo(o), 'aide ouverte : la ligne de la respiration reste entière (2.38.25 : l\'aide ne redit plus le geste)');
  await o.toucher('Fermer l\'aide');
  v.rendre();
  ok(!fiche() && aTempo(o), 'fermée : elle ne revient pas au dessin suivant ; la ligne du tempo entière revient (2.38.12 : la respiration reste sur la carte)');
  await v.allerA(indice(v.plugin.donnees.enCours, 'Presse à cuisses'));
  await v.allerA(indice(v.plugin.donnees.enCours, 'Tirage horizontal à la poulie'));
  ok(!fiche(), 'fermée, puis un autre exercice et retour : toujours fermée');
  await v.validerSerie();
  ok(!fiche(), 'après la 1re série : fermée');
});
// Correction de la relecture 2.8.0 : la fiche ouverte dit déjà le réglage du guide et le tempo ; la carte ne les redit pas.
rendu('b. fiche ouverte : le réglage dans la fiche, pas de tempo en double ; un coach si le geste est flou', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie', guide: FICHE_TIRAGE });
  egal([o.classe('salle-reglage', o.une('salle-exo-aide')).map((e) => e.textContent.trim()), o.classe('salle-fiche-nom', o.une('salle-exo-aide')).map((e) => e.textContent).indexOf('Réglage'), lignesAide(o), o.classe('salle-coach').length],
    [['Réglage : assis, pieds sur les cale-pieds'], -1, ['Douleur vive : arrête l\'exercice', 'Poitrine, malaise : arrête et consulte'], 0],
    'ouverte (2.38.28) : le réglage en étiquette, pas redit dans la fiche ; la sécurité en deux lignes ; plus de ligne « coach »');
  await o.toucher('Fermer l\'aide');
  v.rendre();
  egal([o.classe('salle-reglage').length, o.classe('salle-cible-reglage').map((e) => e.textContent.trim()), o.classe('salle-coach').length], [0, ['Assis, pieds sur les cale-pieds'], 0],
    'fermée : le réglage de la fiche sous la charge, sans étiquette, avant la 1re série (2.38.50 ; avant : seulement dans l\'aide)');
  const sansTempo = { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: ['- **Départ** : dos droit, bras tendus.'] } };
  const autre = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie', guide: sansTempo });
  ok(!!autre.o.bouton('Fermer l\'aide') && aTempo(autre.o), 'fiche ouverte qui ne dit pas le tempo : la ligne entière reste');
});
rendu('b. la fiche ne s\'ouvre pas seule pour un exercice déjà fait', async () => {
  const guide = { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: ['- **Départ** : dos droit, bras tendus.'] } };
  const { o } = ecran(seanceEnCours(0, { seances: fois(1) }), { courant: 'Tirage horizontal à la poulie', guide, seances: fois(1) });
  ok(o.texte().indexOf('dos droit, bras tendus') < 0 && !o.bouton('Fermer l\'aide'), 'déjà fait : fiche fermée');
});
rendu('b. la première fois : la cible dit déjà « prends léger » ou une charge de départ (pas de ligne de charge en plus)', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie' });
  v.aide = true; v.rendre();   // 2.38.11 : l'explication est dans l'aide ouverte
  ok(/Première fois : (prends léger|essaie .* kg)/.test(o.texte()) && o.texte().indexOf('Ta charge') < 0, 'la cible suffit');
});

// 2.10.0 : la liste dit d'abord l'étage où commencer, avant le premier exercice.
rendu('la liste : « Commence à l\'étage … » avant le premier exercice', async () => {
  const { sc, o } = ecran(seanceEnCours(0), { courant: 0 });
  await o.cliquer(o.une('salle-ouvrir-liste'));   // 2.38.19 : la liste est dans le panneau « La séance »
  const liste = o.une('salle-exo-liste');
  const depart = o.classe('salle-repere-depart', liste);
  const tout = liste.tous(() => true);
  egal([depart.map((e) => e.textContent.trim()), /^Commence à l'étage \d/.test(L.departEtage(sc.exos)), depart.length && tout.indexOf(depart[0]) < tout.indexOf(o.classe('salle-rang', liste)[0])],
    [[L.departEtage(sc.exos)], true, true], 'le repère du départ, avant le premier exercice');
});

// ── 2.12.0 : le repos sert à relire le geste et à répondre ──
// ── 2.13.1 (changement voulu, demande : « arrête de les faire disparaître, ce sont des infos utiles ») : les consignes vertes
// sont toujours là, dans une seule bulle sur la carte de l'exercice, sans bouton « Compris ».
const puces = (bulle) => bulle.tous((e) => e.tagName === 'li').map((e) => e.textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim());
// 2.38.9 (demande : pendant la série, pas le temps de lire) : la bulle passe de la carte au repos ; sur la carte, seulement
// l'aide ouverte.
rendu('la bulle verte : au repos, la réserve, la douleur, le malaise, puis les règles de la salle ; pas sur la carte pendant la série', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie' });
  v.aide = false; v.rendre();
  egal(o.classe('salle-consigne', o.une('salle-exo')).length, 0, 'pendant la série, aide fermée : pas de bulle sur la carte');
  await v.validerSerie();
  // 2.38.10 (demande : plus épuré) : au repos, la seule consigne de la série qui vient ; la douleur, le malaise et les règles
  // de la salle sont dans l'aide ouverte.
  const bulle = o.classe('salle-consigne', o.une('salle-repos'))[0];
  const texte = bulle.textContent.replace(/\s+/g, ' ');
  egal([/Ta réserve/.test(texte), /Douleur|malaise|Quelqu'un attend/.test(texte)], [true, false], 'au repos : la réserve seulement');
  ok(bulle.tous((e) => e.tagName === 'button').length === 0 && !o.bouton('Compris'), 'aucun bouton dans la bulle');
  v.aide = true; v.rendre();
  const aide = lignesAide(o);
  egal([aide.slice(-2), aide.some((t) => /Quelqu'un attend|Ta réserve|Pour le passer/.test(t))], [['Douleur vive : arrête l\'exercice', 'Poitrine, malaise : arrête et consulte'], false],
    'l\'aide ouverte (2.38.25) : la sécurité en deux lignes ; ni la réserve (dite au repos), ni « pour le passer », ni les règles de la salle');
});
rendu('les consignes de la carte : pas de réserve au gainage, la supersérie en plus, rien quand l\'exercice est fini', async () => {
  const C = ECRAN_SEANCE.CONSIGNES;
  egal(ECRAN_SEANCE.consignesCarte({ unite: 's' }, false, false), [...C.douleur, C.malaise], 'un exercice au temps : pas de réserve');
  egal(ECRAN_SEANCE.consignesCarte({}, false, true), [L.AVERTISSEMENT_RESERVE, C.superserie, ...C.douleur, C.malaise], 'une supersérie : sa ligne après la réserve');
  egal([ECRAN_SEANCE.consignesCarte({}, true, false), ECRAN_SEANCE.consignesCarte({}, true, true)], [[], [C.superserie]], 'exercice fini : plus rien, sauf la supersérie');
  egal(ECRAN_SEANCE.consignesCarte({}, false, false, true), [C.legere, ...C.douleur, C.malaise], 'une série légère : sa ligne à la place de la réserve');
});
// 2.13.2 (demande : « refais apparaître tous ceux qui étaient là ») : la bulle des séries légères revient (ex « b-approches »).
rendu('la bulle du repos : avant une série légère, à quoi elle sert ; avant la série 1, la réserve', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 'Tirage vertical prise large', legeres: true });
  const premiere = () => o.classe('salle-consigne', o.une('salle-repos'))[0].textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :').trim();
  await o.cliquer(o.barre());
  const avantLegere2 = premiere();
  await o.cliquer(o.barre());
  egal([avantLegere2, /^Ta réserve/.test(premiere())], ['Série légère : elle prépare la charge, elle ne compte pas dans tes séries.', true], 'avant la série légère 2 : « elle prépare la charge » ; avant la série 1 : la réserve');
});
// 2.13.3 (demande : « pourquoi le bouton Aide est au-dessus du bloc vert et l'aide s'ouvre en dessous ? ») : ce qui s'ouvre
// s'ouvre juste sous son bouton.
rendu('l\'aide s\'ouvre sous son bouton, avant la bulle verte ; le menu « … » s\'ouvre sous l\'en-tête', async () => {
  const { v, o } = ecran(seanceEnCours(0, { seances: fois(3) }), { courant: 'Tirage horizontal à la poulie', guide: FICHE_TIRAGE, seances: fois(3) });
  const rang = (c) => o.une('salle-exo').childNodes.findIndex((e) => (' ' + (e.className || '') + ' ').indexOf(' ' + c + ' ') >= 0);
  const rangBouton = (t) => o.une('salle-exo').childNodes.findIndex((e) => e.tagName === 'button' && e.textContent.indexOf(t) >= 0);
  ok(rang('salle-exo-geste') >= 0 && rang('salle-consigne') < 0 && !o.bouton('Fermer l\'aide'), 'aide fermée : le bouton « Aide » seul, pas de bulle (2.38.9 : au repos)');
  ok(o.classe('salle-aide-bouton', o.une('salle-exo-tete')).length === 0, 'plus de « Aide » dans l\'en-tête (2.38.55) : « Comment faire » dans « … »');
  await o.toucher('Plus d\'actions');
  await o.toucher('Comment faire');
  // 2.38.23 (demande : l'aide intuitive, comme les autres panneaux) : une feuille par-dessus la carte ; la fiche, la bulle
  // verte, « Fermer l'aide » dedans ; rien de tout ça dans la carte.
  const feuille = o.une('salle-feuille-aide'), aide = o.une('salle-exo-aide');
  ok(!!feuille && rang('salle-exo-aide') < 0 && o.classe('salle-exo-aide', feuille).length === 1 && o.classe('salle-aide-liste', aide).length === 1
    && aide.tous((e) => e.tagName === 'button' && /Fermer l'aide/.test(e.textContent)).length === 1 && rangBouton('Fermer l\'aide') < 0, 'aide ouverte : une feuille par-dessus la carte, la fiche, la bulle verte, « Fermer l\'aide »');
  for (const f of o.une('salle-panneau-fond').ev.click || []) await f({ target: o.une('salle-panneau-fond') });
  ok(!o.une('salle-feuille-aide') && !v.aide, 'un toucher à côté la referme');
  v.menu = 'principal'; v.rendre();
  egal([rang('salle-actions'), o.classe('salle-actions', o.une('salle-bulle')).length], [-1, 1], 'le menu « … » : une bulle par-dessus la carte (2.38.23)');
  for (const f of o.une('salle-bulle-fond').ev.click || []) await f({ target: o.une('salle-bulle-fond') });
  ok(!o.une('salle-bulle') && v.menu === null, 'un toucher à côté la referme');
});
rendu('la liste des exercices et le repos gardent leur bulle verte', async () => {
  const sc = seanceEnCours(0);
  sc.reposFin = Date.now() + 60000; sc.reposTotal = 120;
  const { v, o } = ecran(sc, { courant: 'Tirage horizontal à la poulie' });
  v.liste = true; v.rendre();   // 2.38.19 : la liste est dans le panneau « La séance »
  const dans = (c) => o.classe('salle-consigne', o.une(c)).map((b) => b.textContent.replace(/\s+/g, ' '));
  ok(dans('salle-exo-liste').length === 1 && /Machine prise/.test(dans('salle-exo-liste')[0]), 'la liste : « Machine prise »');
  ok(dans('salle-repos').length === 1 && !/Quelqu'un attend/.test(dans('salle-repos')[0]), 'le repos : une seule bulle, sans les règles de la salle (2.38.10 : dans l\'aide)');
});
rendu('un exercice fini : plus de bouton « Ajouter une série » (le programme donne le nombre de séries)', async () => {
  const sc = seanceEnCours(0);
  const i = indice(sc, 'Tirage horizontal à la poulie');
  sc.exos[i].faites = Array.from({ length: sc.exos[i].series }, () => ({ c: 40, r: 10 }));
  const { o } = ecran(sc, { courant: i });
  ok(!o.bouton('Ajouter une série') && o.barre().textContent.trim() === 'Exercice suivant', 'fini : « Exercice suivant », rien d\'autre');
});
const FICHE_REPOS = { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: [
  '**Muscles :** le milieu du dos.', '**Réglage :** pieds sur les cale-pieds, poignée en V.', '**Geste :** tire en 1 seconde. Reviens en 2 secondes.',
  '**À éviter :**', '- Ramer avec le buste.', '- Écarter les coudes.', '- Hausser les épaules.', '', '**Tu dois sentir :** entre les omoplates.'] } };
rendu('pendant le repos : les repères du geste de la série qui vient, et la question de la réserve', async () => {
  // 2.14.0 (changement voulu, demande : « réécris mieux le texte, quand je vais lire je serai à bout de souffle ») : des lignes
  // de 2 à 5 mots, { type, texte } ; sans champ « À retenir », le réglage entier ; 2 erreurs à éviter, sans point.
  const R = (type, texte) => ({ type, texte });
  egal(ECRAN_SEANCE.reperes(FICHE_REPOS[L.norm('Tirage horizontal à la poulie')].lignes),
    [R('sentir', '**Sens** : entre les omoplates'), R('fais', 'Pieds sur les cale-pieds, poignée en V'), R('evite', 'Ramer avec le buste'), R('evite', 'Écarter les coudes')], 'reperes : ce qu\'il faut sentir, la position, 2 erreurs à éviter');
  egal(ECRAN_SEANCE.reperes(['**Réglage :** long réglage. Deuxième phrase.', '**À retenir :** cuisses bloquées · mains larges · coudes vers le bas · un quatrième', '**À éviter :**', '- Te balancer en arrière : c\'est trop lourd.']),
    [R('fais', 'Cuisses bloquées'), R('fais', 'Mains larges'), R('fais', 'Coudes vers le bas'), R('evite', 'Te balancer en arrière')], 'reperes : « À retenir » remplace le réglage (3 au plus) ; l\'erreur sans son explication');
  egal([ECRAN_SEANCE.reperes(null), ECRAN_SEANCE.reperes(['- sans champ'])], [[], []], 'reperes : sans fiche, rien');
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie', guide: FICHE_REPOS });
  await v.validerSerie();
  const repos = o.une('salle-repos');
  egal([o.classe('salle-repos-reperes', repos).length, o.classe('salle-repos-reperes', repos)[0].tous((e) => e.tagName === 'li').length, /il t'en restait combien/.test(repos.textContent), o.classe('salle-repos-reperes', repos)[0].tous((e) => e.tagName === 'li')[0].textContent.replace(/\s+/g, ' ').trim()],
    [1, 6, false, 'Première fois : arrête-toi quand il t\'en reste 2, même à la dernière série'],
    'après la série 1 : tous les repères au repos, l\'effort de la série qui vient en tête (2.38.42), pas encore de question');
  while (sc.exos[sc.courant].nom === 'Tirage horizontal à la poulie' && sc.question == null) await v.validerSerie();
  ok(/il t'en restait combien/.test(o.une('salle-repos').textContent), 'après la dernière série : la question de la réserve, dans le repos');
});

// 2.12.0 : le tempo et la respiration à chaque série ; le bouton « Aide » juste sous « Tu dois sentir ».
rendu('le tempo reste à chaque série ; « Aide » ouvre la fiche, sans les muscles ni le remplaçant', async () => {
  const guide = { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: ['**Muscles :** le dos.', '**Réglage :** pieds calés.', '**Geste :** tire.', '**Tu dois sentir :** le dos.', '**Si c\'est pris :** rowing.'] } };
  const { v, o } = ecran(seanceEnCours(0, { seances: fois(3) }), { courant: 'Tirage horizontal à la poulie', guide, seances: fois(3) });
  ok(aTempo(o), 'déjà fait 3 fois : la respiration est sur la carte (2.38.12)');
  await v.validerSerie();
  ok(sansEspaces(o.une('salle-repos').textContent).indexOf(TEMPO_VU) >= 0, 'après la série 1 : le tempo est au repos');
  await o.toucher('Plus d\'actions');
  const aide = o.bouton('Comment faire');   // 2.38.55 : dans le menu « … »
  await o.cliquer(aide);
  const champs = o.classe('salle-fiche-nom', o.une('salle-exo-aide')).map((e) => e.textContent);
  egal([!!aide, o.classe('salle-reglage', o.une('salle-exo-aide')).map((e) => e.textContent.trim()), champs, o.classe('salle-aide-bouton').length, !!o.bouton('Fermer l\'aide')],
    [true, ['Réglage : pieds calés'], ['Muscles', 'Geste'], 0, true], '« Comment faire » dans « … » ; l\'aide (2.38.28) : le réglage en étiquette, puis la fiche (muscles, geste), ni « sentir » ni le remplaçant');
  // La suite du réglage (après sa première phrase) vient juste sous l'étiquette, avant les autres champs de la fiche.
  const suite = ficheExercice(['**Machine :** une machine.', '**Réglage :** siège réglé. Dos collé au dossier.', '**Geste :** pousse.'], false, null, /^Réglage$/i);
  egal([suite.childNodes.map((c) => c.textContent.replace(/\s+/g, ' ').trim()), ficheExercice(['**Réglage :** siège réglé.', '**Geste :** pousse.'], false, null, /^Réglage$/i).childNodes.length],
    [['Dos collé au dossier.', 'Machine Une machine.', 'Geste Pousse.'], 1], 'fiche : la suite du réglage en premier, sans son nom ; rien s\'il n\'y a qu\'une phrase');
});
// 2.36.3 : un exercice sans appareil à régler (debout avec une barre) : sa fiche dit « Position » ; le champ du réglage n'a pas lieu d'être.
rendu('sans appareil à régler : « Position » dans l\'aide, pas de champ de réglage', async () => {
  const fiche = (champ) => ({ [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: [champ, '**Geste :** tire.', '**Tu dois sentir :** le dos.'] } });
  const ouvrir = async (champ) => {
    const { o } = ecran(seanceEnCours(0, { seances: fois(3) }), { courant: 'Tirage horizontal à la poulie', guide: fiche(champ), seances: fois(3) });
    await o.toucher('Plus d\'actions');
    await o.toucher('Comment faire');
    return [o.classe('salle-reglage', o.une('salle-exo-aide')).map((e) => e.textContent.trim()), o.classe('salle-mon-reglage').length, o.classe('salle-cible-reglage').length];
  };
  egal([await ouvrir('**Réglage :** pieds calés. Dos droit.'), await ouvrir('**Position :** debout, coudes collés au corps. Dos droit.')],
    [[['Réglage : pieds calés'], 1, 1], [['Position : debout, coudes collés au corps'], 0, 0]], 'avec un appareil : « Réglage » et son champ, et (2.38.50) le réglage sous la charge ; sans : « Position », aucun champ, rien sous la charge');
});


// ── 2.13.0 : la passe « études ↔ séance » : chaque consigne des études, dite au bon moment ──
const FICHE_CURL = { [L.norm('Curl aux haltères')]: { titre: 'Curl aux haltères', lignes: [
  '**Muscles :** les biceps.', '**Réglage :** debout, coudes collés au corps.', '**Geste :** monte en 1 seconde. Redescends en 2 secondes, bras tendus.',
  '**À éviter :**', '- Balancer le buste.', '- Avancer les coudes.', '', '**Tu dois sentir :** l\'avant du bras.', '**Vidéo :** https://www.youtube.com/watch?v=6DeLZ6cbgWQ · 9:16 · 28 s'] } };
rendu('les repères du repos : boire avant un nouvel exercice, penser au muscle et serrer le ventre sur un petit exercice debout', async () => {
  const curl = FICHE_CURL[L.norm('Curl aux haltères')].lignes, tirage = FICHE_REPOS[L.norm('Tirage horizontal à la poulie')].lignes;
  egal(ECRAN_SEANCE.reperes(curl, { nom: 'Curl aux haltères' }, true),
    [{ type: 'boire', texte: 'Bois un peu d\'eau' }, { type: 'sentir', texte: '**Pense à tes biceps**' }, { type: 'fais', texte: 'Debout, coudes collés au corps' },
      { type: 'fais', texte: 'Ventre dur, comme une canette pleine' }, { type: 'evite', texte: 'Balancer le buste' }, { type: 'evite', texte: 'Avancer les coudes' }],
    'curl, nouvel exercice : boire, le muscle auquel penser, la position, le ventre, 2 erreurs');
  egal(ECRAN_SEANCE.reperes(curl, { nom: 'Curl aux haltères' }, false).slice(0, 2).map((l) => l.type), ['sentir', 'fais'], 'même exercice : on ne redit pas de boire');
  ok(ECRAN_SEANCE.reperes(['**Tu dois sentir :** a.', '**À retenir :** b · c · d', '**À éviter :**', '- e.', '- f.', '- g.'], { nom: 'Curl aux haltères' }, true).length === ECRAN_SEANCE.REPERES_MAX, '7 lignes au plus');
  egal(ECRAN_SEANCE.reperes(tirage, { nom: 'Tirage horizontal à la poulie' }, false), ECRAN_SEANCE.reperes(tirage), 'un gros exercice : ni « pense au muscle » ni le ventre');
  egal(ECRAN_SEANCE.reperes(null, { nom: 'Presse à cuisses' }, true), [{ type: 'boire', texte: 'Bois un peu d\'eau' }], 'sans fiche, avant un nouvel exercice : boire');
  // À l'écran : après la série 1, pas de « Bois » ; après la dernière, le repos annonce l'exercice suivant et dit de boire.
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie', guide: FICHE_REPOS });
  await v.validerSerie();
  const meme = o.une('salle-repos').textContent;
  while (sc.exos[sc.courant].nom === 'Tirage horizontal à la poulie') await v.validerSerie();
  egal([/Bois/.test(meme), /Bois un peu d'eau/.test(o.une('salle-repos').textContent.replace(/\s+/g, ' '))], [false, true], 'le repos : « Bois » seulement avant un nouvel exercice');
});
rendu('le repos avant un nouvel exercice : la position n\'est pas redite quand « Ensuite : … » dit déjà tout le réglage', async () => {
  const sc = seanceEnCours(0);
  const i = indice(sc, 'Curl aux haltères');
  sc.exos.forEach((x, j) => { if (j < i) x.faites = x.echauffement ? [{ min: 5 }] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
  Object.assign(sc, { courant: i, reposFin: Date.now() + 90000, reposTotal: 90 });
  const { o } = ecran(sc, { guide: FICHE_CURL });
  const lignes = o.classe('salle-repos-reperes', o.une('salle-repos'))[0].tous((e) => e.tagName === 'li').map((e) => e.textContent.replace(/\s+/g, ' ').trim());
  egal([/Position : debout|Réglage : debout/.test(o.une('salle-suite').textContent) === false && /debout, coudes collés au corps/.test(o.une('salle-suite').textContent), lignes.slice(0, 4), lignes.some((l) => /coudes collés au corps/.test(l))],
    [true, ['Bois un peu d\'eau', 'Première fois : arrête-toi quand il t\'en reste 2, même à la dernière série', 'Pense à tes biceps', 'Monte en 1 s en expirant, redescends en 2 s en inspirant.'], false],
    'boire, l\'effort, le muscle, le tempo en tête (2.38.42) ; pas de position en double');
  egal(o.classe('salle-repos-reperes', o.une('salle-repos'))[0].tous((e) => e.tagName === 'li').map((e) => e.className.replace('salle-repere ', '').replace(' salle-a-ic', '')).slice(0, 4),
    ['salle-repere-boire', 'salle-repere-effort', 'salle-repere-sentir', 'salle-repere-fais'], 'chaque ligne a sa sorte : boire, effort, sentir, à faire');
});
// 2.21.0 (demande : « quand on a fini un exo, pour passer au suivant, qu'on n'ait pas seulement le nom mais aussi la petite
// animation ») : le repos qui précède un nouvel exercice montre son image, sous « Ensuite : … ».
rendu('le repos avant un nouvel exercice montre sa petite animation ; pas au milieu d\'un exercice', async () => {
  const sc = seanceEnCours(0);
  const i = indice(sc, 'Curl aux haltères');
  sc.exos.forEach((x, j) => { if (j < i) x.faites = x.echauffement ? [{ min: 5 }] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
  Object.assign(sc, { courant: i, reposFin: Date.now() + 90000, reposTotal: 90 });
  const { o } = ecran(sc, { guide: FICHE_CURL });
  const repos = o.une('salle-repos');
  const enfants = repos.childNodes.map((e) => e.className || '');
  const image = o.classe('salle-anim-suivant', repos);
  egal([image.length, image.length ? /salle-anim-mini/.test(image[0].className) && image[0].tous((e) => e.tagName === 'img').length : 0, enfants.findIndex((c) => /salle-anim-suivant/.test(c)) === enfants.findIndex((c) => /salle-suite /.test(c + ' ')) + 2, enfants.findIndex((c) => /salle-suite-cible/.test(c)) === enfants.findIndex((c) => /salle-suite /.test(c + ' ')) + 1],
    [1, 1, true, true], 'nouvel exercice : « Ensuite : … », sa charge et ses séries en gros, puis la vignette de sa vidéo en petit (2.41.13)');
  egal([ECRAN_SEANCE.pasCommence({ faites: [] }), ECRAN_SEANCE.pasCommence({ faites: [{ c: 20, r: 10 }] }), ECRAN_SEANCE.pasCommence({ faites: [], approches: [{ faite: true }] }), ECRAN_SEANCE.pasCommence(null)], [true, false, false, false],
    'pasCommence : ni série, ni série légère faite');
  const milieu = seanceEnCours(0);
  const k = indice(milieu, 'Curl aux haltères');
  milieu.exos[k].faites = [{ c: 8, r: 12 }];
  Object.assign(milieu, { courant: k, reposFin: Date.now() + 90000, reposTotal: 90 });
  const autre = ecran(milieu, { guide: FICHE_CURL });
  egal(autre.o.classe('salle-anim-suivant', autre.o.une('salle-repos')).length, 1, 'entre deux séries du même exercice : son image aussi (2.38.8)');
});
// 2.38.9 (demande : ces infos pendant le repos, pas pendant la série) : « Va au bout » et « Pour finir » sont au repos.
rendu('le repos : « Va au bout » ; avant la dernière série du leg curl, les demi-répétitions ; plus sur la carte', async () => {
  const { v, o } = ecran(seanceEnCours(0, { seances: fois(3) }), { courant: 'Tirage horizontal à la poulie', seances: fois(3),
    guide: { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: ['**Geste :** tire en 1 seconde. Reviens en 2 secondes, bras presque tendus.', '**Tu dois sentir :** le dos.'] } } });
  const texteRepos = (x) => (x.une('salle-repos') ? x.une('salle-repos').textContent.replace(/\s+/g, ' ').replace(/ :/g, ' :') : '');
  egal(o.classe('salle-amplitude').length, 0, 'pendant la série : pas de « Va au bout » sur la carte');
  await v.validerSerie();
  ok(/Va au bout : bras presque tendus/.test(texteRepos(o)), 'au repos : « Va au bout »');
  const GUIDE_LEG = { [L.norm('Leg curl assis')]: { titre: 'Leg curl assis', lignes: ['**Geste :** ramène les talons en 1 seconde. Reviens en 2 secondes, jambes presque tendues.',
    '**Dernière série :** quand tu bloques, ajoute 3 à 5 demi-répétitions, jambes presque tendues.'] } };
  const hist = [note('2026-11-13', 'Séance A', [['Leg curl assis', [[25, 10], [25, 10]]]])];
  const leg = ecran(seanceEnCours(0, { seances: hist }), { courant: 'Leg curl assis', seances: hist, guide: GUIDE_LEG });
  await leg.v.validerSerie();
  egal([leg.o.classe('salle-pour-finir').length, /Pour finir : quand tu bloques, ajoute 3 à 5 demi-répétitions/.test(texteRepos(leg.o))], [0, true], 'les demi-répétitions : au repos avant la dernière série, pas sur la carte');
  const neuf = ecran(seanceEnCours(0), { courant: 'Leg curl assis', guide: GUIDE_LEG });
  await neuf.o.toucher('Fermer l\'aide');
  await neuf.v.validerSerie();
  egal(/Pour finir/.test(texteRepos(neuf.o)), false, 'jamais la première fois (sans aller au bout)');
});
rendu('l\'échauffement : la gourde, la musique, pas d\'étirement long ; plus rien une fois fait', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 0 });
  const puces = () => o.classe('salle-ech-preparer').flatMap((u) => u.tous((e) => e.tagName === 'li').map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  const avant = puces();
  await v.faireEchauffement();
  sc.courant = 0;
  v.rendre();
  egal([avant, puces()], [['Avant de pédaler : remplis ta gourde, mets ta musique.', 'Pas d\'étirement de plus de 30 s avant tes séries.'], []], 'deux puces avant le vélo, rien après');
});
rendu('la consigne « malaise » : dans l\'aide ouverte, après la douleur', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 'Tirage horizontal à la poulie' });
  v.aide = true; v.rendre();
  ok(lignesAide(o).indexOf('Poitrine, malaise : arrête et consulte') >= 0, 'dans l\'aide (2.38.25) : « Poitrine, malaise : arrête et consulte »');
});
rendu('une série gagnée : « 1 de plus qu\'avant » à la série 1 ; le gros bouton ne propose jamais de série en plus', async () => {
  const sc = seanceEnCours(0);
  const i = indice(sc, 'Tirage horizontal à la poulie');
  Object.assign(sc.exos[i], { series: 4, seriePlus: true });
  const { v, o } = ecran(sc, { courant: i });
  const etape = () => o.une('salle-exo-etape').textContent.trim();
  const un = [etape(), o.barre().textContent.trim()];
  await v.validerSerie();
  egal([un, etape()], [['Série 1 sur 4 · 1 de plus qu\'avant', 'Série 1 sur 4 faite'], 'Série 2 sur 4'], 'dit une fois, à la série 1');
  // Une séance en cours qui a plus de séries faites que prévu (ancienne version) : « Exercice suivant », pas de série en plus.
  const trop = seanceEnCours(0), j = indice(trop, 'Tirage horizontal à la poulie');
  trop.exos[j].faites = Array.from({ length: trop.exos[j].series + 1 }, () => ({ c: 40, r: 10 }));
  egal([ECRAN_SEANCE.barre(trop, j, Date.now()).quoi, ECRAN_SEANCE.barre(seanceEnCours(0), j, Date.now()).texte], ['suivant', `Série 1 sur ${trop.exos[j].series} faite`], 'barre : jamais « en plus »');
  const t = ecran(trop, { courant: j });
  ok(!t.o.erreur() && t.o.lignes().length === trop.exos[j].series + 2 && t.o.texte().indexOf('En plus') < 0, 'le tableau montre les séries faites, sans ligne « En plus »');
});

// 2.37.0 : sur un appareil à disques, les disques à mettre de chaque côté, juste sous la charge ; la dernière série est ouverte.
rendu('les disques par côté sous la charge ; la dernière série se lit « 12+ »', async () => {
  const sc = seanceEnCours(0, { seances: fois(3) });
  const k = indice(sc, 'Tirage horizontal à la poulie');
  sc.exos[k].disques = true;
  const { v, o } = ecran(sc, { courant: k, seances: fois(3) });
  const disques = () => o.classe('salle-cible-disques').map((e) => e.textContent.trim());
  const gros = () => o.une('salle-cible-gros').textContent;
  egal([/^Par côté : [\d, ×+]+$/.test(disques()[0] || ''), /\+$/.test(gros())], [true, false], 'série 1 : les disques par côté ; la cible est fermée');
  for (let i = 1; i < sc.exos[k].series; i++) await v.validerSerie();
  ok(/\+$/.test(gros()), 'dernière série : ouverte');
  delete sc.exos[k].disques;
  v.rendre();
  egal(disques(), [], 'pas un appareil à disques : rien sous la charge');
});

// 2.38.5 (demande : une bande noire en haut pendant la séance) : la vue porte « salle-sans-barre » pendant une séance, plus après.
rendu('séance : la vue sans l\'espace de l\'en-tête d\'Obsidian, puis rendu après', async () => {
  const { v } = ecran(seanceEnCours(0), { courant: 2 });
  v.containerEl = document.createElement('div');
  v.rendre();
  const pendant = v.containerEl.classList.contains('salle-sans-barre');
  v.ecran = 'accueil';
  v.rendre();
  egal([pendant, v.containerEl.classList.contains('salle-sans-barre')], [true, true], 'salle-sans-barre : pendant la séance, et partout ailleurs aussi (2.38.58 : plein écran dès l\'arrivée)');
});

// 2.38.6 (demande : que veut dire le tiret ?) : une série que la fois d'avant n'avait pas dit « nouvelle ».
rendu('tableau des séries : « nouvelle » quand la fois d\'avant avait moins de séries', async () => {
  const { o } = ecran(seanceEnCours(0), { courant: 2 });
  const avant = o.classe('salle-serie-avant').map((e) => e.textContent).filter((x) => x && !/^Le /.test(x));
  ok(avant.indexOf('—') < 0, 'plus de tiret dans la colonne de la fois d\'avant (' + avant.join(', ') + ')');
});

// 2.38.12 (demande : « le truc de respiration c'est utile, de même que le tu dois sentir ») : sur la carte pendant la série.
rendu('la carte : la respiration et « Tu dois sentir » sous l\'effort, l\'aide fermée', async () => {
  const guide = { [L.norm('Tirage horizontal à la poulie')]: { titre: 'Tirage horizontal à la poulie', lignes: ['**Geste :** tire.', '**Tu dois sentir :** entre les omoplates.'] } };
  const { v, o } = ecran(seanceEnCours(0, { seances: fois(3) }), { courant: 'Tirage horizontal à la poulie', guide, seances: fois(3) });
  v.aide = false; v.rendre();
  const geste = o.une('salle-exo-geste');
  // « Tu dois sentir » vient de l'animation de l'exercice (ses photos), absente du faux affichage : vu dans l'aperçu.
  egal([o.classe('salle-tempo', geste).length, o.classe('salle-aide-bouton', o.une('salle-exo-tete')).length], [1, 0], 'la respiration sur la carte ; plus de « Aide » dans l\'en-tête (2.38.55)');
});

// 2.38.19 (demande : « La séance » monte par-dessus la carte, la carte floue derrière, comme le centre de contrôle d'Apple).
rendu('« La séance » : un panneau par-dessus la carte, ouvert par « Exercice … sur … » ou le nom de la séance ; fermé à côté', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  const panneau = () => o.classe('salle-panneau');
  egal([panneau().length, o.classe('salle-exo-liste').length], [0, 0], 'fermé : ni panneau, ni liste sous la carte');
  await o.cliquer(o.une('salle-ouvrir-liste', o.une('salle-exo-tete')));
  egal([panneau().length, o.classe('salle-exo-liste', panneau()[0]).length, !!o.bouton('Annuler la séance'), o.classe('salle-panneau-croix', panneau()[0]).length], [1, 1, true, 1], 'ouvert : la croix (2.38.20), la liste, « Annuler la séance »');
  const fond = o.une('salle-panneau-fond');
  for (const f of fond.ev.click || []) await f({ target: panneau()[0] });
  egal(panneau().length, 1, 'un toucher dans le panneau : il reste');
  for (const f of fond.ev.click || []) await f({ target: fond });
  egal(panneau().length, 0, 'un toucher à côté : il se ferme');
  await o.cliquer(o.une('salle-ouvrir-liste', o.une('salle-titre-seance')));
  await o.toucher('Fermer');
  egal(panneau().length, 0, 'le nom de la séance l\'ouvre aussi ; la croix (« Fermer ») le ferme');
});

// 2.38.20 (demande : le bloc des séries immobile, la barre du haut aussi) : pendant une séance, la page porte salle-seance-fixe.
rendu('séance : la page fixe (salle-seance-fixe) pendant une séance, plus après', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  const fixe = () => v.contentEl.classList.contains('salle-seance-fixe');
  const pendant = fixe();
  v.ecran = 'accueil';
  v.rendre();
  egal([pendant, fixe(), !!o.une('salle-entete')], [true, false, true], 'fixe pendant la séance, plus à l\'accueil');
});

// 2.38.21 (demande : l'en-tête ne doit pas être visible de base) : replié ; ouvert, il descend par-dessus la carte.
// 2.38.29 (demande : le trait en haut ne sert à rien) : plus de poignée ; on le fait descendre en glissant depuis le haut.
rendu('séance : l\'en-tête replié, sans poignée ; glissé vers le bas, par-dessus la carte, refermé d\'un toucher à côté', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  const ouvert = () => o.classe('salle-haut-ouvert').length === 1;
  const descendre = () => { v.debutGlisse({ touches: [{ clientX: 100, clientY: 120 }] }); v.finGlisse({ changedTouches: [{ clientX: 100, clientY: 330 }] }); };
  egal([ouvert(), o.classe('salle-poignee-haut').length, !!o.bouton('Terminer')], [false, 0, true], 'replié : pas de poignée ; l\'en-tête reste dans la page (caché sur téléphone)');
  descendre();
  egal([ouvert(), o.classe('salle-haut-voile').length, o.classe('salle-haut-croix').length], [true, 1, 0], 'ouvert : par-dessus la carte, un voile, pas de croix (2.38.22)');
  for (const f of o.une('salle-haut-voile').ev.click || []) await f({});
  egal(ouvert(), false, 'un toucher à côté le referme');
  descendre();
  await o.cliquer(o.une('salle-ouvrir-liste', o.une('salle-haut')));
  egal([ouvert(), o.classe('salle-panneau').length], [false, 1], 'le nom de la séance : le haut se replie, « La séance » s\'ouvre');
});

// 2.38.23 (demande : glisser du bas vers le haut fait monter « La séance », du haut vers le bas l'en-tête ; intuitif).
rendu('glisser : vers le haut depuis le bas, « La séance » ; vers le bas depuis le haut, l\'en-tête ; le geste inverse referme', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 2 });
  const glisse = (y1, y2, x2) => { v.debutGlisse({ touches: [{ clientX: 100, clientY: y1 }] }); v.finGlisse({ changedTouches: [{ clientX: x2 != null ? x2 : 100, clientY: y2 }] }); };
  // 2.38.27 : un panneau ouvert se tire lui-même (il suit le doigt, puis part) ; le glissement de la page ne le ferme plus.
  const tirer = (el, y1, y2) => { for (const f of el.ev.touchstart || []) f({ touches: [{ clientY: y1 }] }); for (const f of el.ev.touchmove || []) f({ touches: [{ clientY: y2 }] }); for (const f of el.ev.touchend || []) f({}); };
  glisse(700, 500);
  const liste = !!v.liste;
  await o.cliquer(o.une('salle-panneau-croix'));   // 2.38.74 : comme sur le Mac, elle se ferme par la croix
  const listeFermee = !v.liste;
  glisse(120, 330);
  const haut = !!v.haut;
  tirer(o.une('salle-haut'), 300, 150);
  const hautFerme = !v.haut;
  glisse(700, 670);
  glisse(700, 500, 400);
  const rien = !v.liste && !v.haut;
  sc.reposFin = Date.now() + 60000;
  glisse(700, 500);
  egal([liste, listeFermee, haut, hautFerme, rien, !!v.liste], [true, true, true, true, true, false],
    'du bas vers le haut : « La séance », refermée par la croix ; du haut vers le bas : l\'en-tête, refermé en le tirant vers le haut ; trop court ou de travers : rien ; pendant le repos : rien');
});

// 2.38.74 (demande : aussi fluide que sur le Mac) et 2.38.75 (demande : glisser pour la faire disparaître doit marcher) :
// le code n'agit que sur un geste qui commence liste tout en haut et part vers le bas ; sinon le téléphone défile seul.
rendu('« La séance » et l\'aide : tirées vers le bas tout en haut, elles partent ; un défilement n\'est jamais touché', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  const geste = (el, ys, fin) => { for (const f of el.ev.touchstart || []) f({ touches: [{ clientY: ys[0] }] }); for (const y of ys.slice(1)) for (const f of el.ev.touchmove || []) f({ touches: [{ clientY: y }] }); for (const f of el.ev[fin || 'touchend'] || []) f({}); };
  v.liste = true; v.rendre();
  let pn = o.une('salle-panneau');
  pn.scrollTop = 80;
  geste(pn, [300, 320, 500]);   // liste défilée au début : un défilement
  const defileLibre = !!v.liste && !pn.style.transform;
  pn.scrollTop = 0;
  geste(pn, [300, 290, 200, 400]);   // part vers le haut : un défilement, même s'il redescend
  const hautLibre = !!v.liste && !pn.style.transform;
  for (const f of pn.ev.touchstart || []) f({ touches: [{ clientY: 300 }] });
  for (const f of pn.ev.touchmove || []) f({ touches: [{ clientY: 330 }] });
  const suit = pn.style.transform === 'translateY(22px)' && pn.style.overflowY !== 'hidden';
  for (const f of pn.ev.touchend || []) f({});
  const revenue = !!v.liste && !pn.style.transform;   // 22 px : pas assez, elle remonte
  geste(pn, [300, 310, 450]);
  const partie = !v.liste;
  await o.cliquer(o.une('salle-ouvrir-liste'));
  pn = o.une('salle-panneau');
  geste(pn, [300, 320, 450], 'touchcancel');
  const repriseOuverte = !!v.liste && !pn.style.transform;
  await o.cliquer(o.une('salle-panneau-croix'));
  const parCroix = !v.liste;
  v.aide = true; v.rendre();
  const aide = o.une('salle-feuille-aide');
  geste(aide, [300, 310, 450]);
  egal([defileLibre, hautLibre, suit, revenue, partie, repriseOuverte, parCroix, !!v.aide], [true, true, true, true, true, true, true, false],
    'liste défilée ou geste vers le haut : rien ; tout en haut vers le bas : elle suit le doigt (sans figer la liste), remonte si c\'est court, part si c\'est long ; geste repris par l\'iPhone : en place ; la croix ; l\'aide aussi');
});

// 2.38.34 (demande : glisser n'est pas fluide) : « La séance » suit le doigt dès le début du geste ; lâchée assez haut, elle
// reste ; à peine montée, elle redescend et se ferme.
rendu('glisser du bas : « La séance » suit le doigt ; lâchée assez haut, elle reste ; trop bas, elle se referme', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  v.debutGlisse({ touches: [{ clientX: 100, clientY: 700 }] });
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 690 }] });
  const pasEncore = o.classe('salle-panneau').length === 0;
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 600 }] });
  const suit = o.classe('salle-panneau').length === 1 && /translateY\(\d+px\)/.test(o.une('salle-panneau').style.transform);
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 300 }] });
  v.finGlisse({ changedTouches: [{ clientX: 100, clientY: 300 }] });
  const reste = !!v.liste && o.classe('salle-panneau').length === 1 && !o.une('salle-panneau').style.transform;
  v.liste = false; v.rendre();
  v.debutGlisse({ touches: [{ clientX: 100, clientY: 700 }] });
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 660 }] });
  v.finGlisse({ changedTouches: [{ clientX: 100, clientY: 660 }] });
  egal([pasEncore, suit, reste, !!v.liste, o.classe('salle-panneau').length], [true, true, true, false, 0],
    'moins de 20 px : rien ; ensuite il suit le doigt ; lâché haut : ouvert ; à peine monté : refermé');
});

// 2.38.45 (demande : le glissement doit marcher pareil pour l'en-tête) : il descend avec le doigt ; lâché assez bas, il reste ;
// tiré vers le haut depuis son voile, il remonte et se ferme.
rendu('glisser du haut : l\'en-tête suit le doigt ; lâché assez bas, il reste ; tiré vers le haut près du haut de l\'écran, il se ferme', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  v.debutGlisse({ touches: [{ clientX: 100, clientY: 60 }] });
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 100 }] });
  const suit = o.classe('salle-haut-ouvert').length === 1 && /translateY\(-\d+px\)/.test(o.une('salle-haut').style.transform);
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 300 }] });
  v.finGlisse({ changedTouches: [{ clientX: 100, clientY: 300 }] });
  const reste = !!v.haut && o.classe('salle-haut-ouvert').length === 1 && !o.une('salle-haut').style.transform && o.classe('salle-haut-voile').length === 1;
  const tirer = (el, y1, y2) => { for (const f of el.ev.touchstart || []) f({ touches: [{ clientY: y1 }] }); for (const f of el.ev.touchmove || []) f({ touches: [{ clientY: y2 }] }); for (const f of el.ev.touchend || []) f({}); };
  tirer(o.une('salle-haut-voile'), 600, 450);
  const basRienFait = !!v.haut;   // demande : pas n'importe où, seulement vers le haut de l'écran
  tirer(o.une('salle-haut-voile'), 300, 150);
  egal([suit, reste, basRienFait, !!v.haut, o.classe('salle-haut-ouvert').length], [true, true, true, false, 0],
    'il suit le doigt ; ouvert ; tiré vers le haut du bas de l\'écran : rien ; du haut de l\'écran : fermé');
});

// 2.38.51 : une ouverture au doigt reprise par l'iPhone (le geste de l'accueil, touchcancel) referme la feuille qui montait.
rendu('« La séance » : une ouverture au doigt reprise par l\'iPhone se referme', async () => {
  const { v, o } = ecran(seanceEnCours(0), { courant: 2 });
  v.debutGlisse({ touches: [{ clientX: 100, clientY: 700 }] });
  v.suiteGlisse({ touches: [{ clientX: 100, clientY: 500 }] });
  v.annulerGlisse();
  egal([!!v.liste, o.classe('salle-panneau').length], [false, 0], 'ouverture reprise : refermée');
});

// 2.38.72 (demande : l'ordre ne bouge pas au toucher ; un exercice fait passe en bas, barré).
rendu('« La séance » : toucher ne change pas l\'ordre ; un exercice fait passe en bas, barré, sous le cardio', async () => {
  const { v, sc, o } = ecran(seanceEnCours(0), { courant: 2 });
  const avant = sc.exos.map((e) => e.nom).join('|');
  await v.allerA(4);
  const memeOrdre = sc.exos.map((e) => e.nom).join('|') === avant && sc.courant === 4;
  const fini = sc.exos[1];
  fini.faites = Array.from({ length: fini.series }, () => ({ c: 20, r: 10 }));
  v.liste = true; v.rendre();
  const lignes = o.classe('salle-rang').map((e) => ({ t: e.textContent, barre: e.classList.contains('salle-barre') }));
  const iFini = lignes.findIndex((l) => l.t.indexOf(fini.nom) >= 0), iCardio = lignes.findIndex((l) => l.t.indexOf('Cardio tranquille') >= 0);
  egal([memeOrdre, iFini > iCardio, lignes[iFini].barre, lignes.filter((l) => l.barre).length, o.classe('salle-repere-depart').length],
    [true, true, true, 1, 0], 'même ordre après un toucher ; l\'exercice fait en bas, barré, sous le cardio ; plus de « Commence à l\'étage » une fois commencé');
});

// 2.38.54 (demande : « Pense au muscle : les triceps » plus naturel, « pense à tes triceps ») : la phrase selon l'article.
rendu('repos : « Pense à tes triceps », « Pense au côté des épaules », « Pense à l\'arrière des épaules »', async () => {
  const fiche = (m) => ['**Muscles :** ' + m];
  const dit = (nom, m) => (ECRAN_SEANCE.reperes(fiche(m), { nom }).find((l) => l.type === 'sentir') || {}).texte;
  egal([dit('Extension triceps à la poulie', 'les triceps, l\'arrière du bras.'), dit('Élévations latérales aux haltères', 'le côté des épaules. Aide : l\'arrière des épaules.'),
    dit('Face pull à la poulie', 'l\'arrière des épaules, le haut du dos.'), dit('Curl aux haltères', 'les biceps.')],
  ['**Pense à tes triceps**, l\'arrière du bras', '**Pense au côté des épaules**', '**Pense à l\'arrière des épaules**, le haut du dos', '**Pense à tes biceps**'],
  'triceps, côté des épaules, arrière des épaules, biceps');
});

// 2.38.77 (demande : la barre du bas a tendance à revenir, la bloquer) : hors séance, ni un glissement ni une remontée de
// la page ne la font revenir ; la vue reste en plein écran.
rendu('hors séance : la barre d\'Obsidian reste cachée (glisser vers le bas, remonter la page)', async () => {
  const { v, p } = ecran(seanceEnCours(0), { courant: 2 });
  const appels = [];
  p.cacherBarre = (oui) => appels.push(oui);
  v.containerEl = document.createElement('div');
  v.ecran = 'accueil'; p.donnees.enCours = null; v.rendre();
  v.debutGlisse({ touches: [{ clientX: 100, clientY: 200 }] });
  v.finGlisse({ changedTouches: [{ clientX: 100, clientY: 320 }] });
  v.contentEl.scrollTop = 300; v.surDefilement();
  v.contentEl.scrollTop = 100; v.surDefilement();
  egal([appels.indexOf(false), v.containerEl.classList.contains('salle-sans-barre')], [-1, true],
    'jamais montrée : ni en glissant vers le bas, ni en remontant ; la vue en plein écran');
});

// 2.38.59 (demande : mettre en valeur un changement de poids ou de répétitions) : par rapport à la série d'avant (aujourd'hui)
// ou, à la 1re série, à la même série la fois d'avant ; le nombre qui change en vert, et sa pastille.
rendu('changement de poids ou de répétitions : calcul, nombre en vert, pastille', async () => {
  const E = ECRAN_SEANCE;
  egal([E.changement({ faites: [{ c: 7.5, r: 14 }] }, { charge: 10, valeur: 14 }, null), E.changement({ faites: [] }, { charge: 10, valeur: 15 }, { series: [{ c: 7.5, r: 14 }] }),
    E.changement({ faites: [{ c: 10, r: 15 }] }, { charge: 10, valeur: 15 }, null), E.changement({ faites: [], unite: 's' }, { valeur: 45 }, { series: [{ s: 30 }] })],
  [{ poids: { avant: 7.5, apres: 10 }, reps: null, fois: null }, { poids: { avant: 7.5, apres: 10 }, reps: { avant: 14, apres: 15 }, fois: null }, null, null],
  'la série d\'avant ; la fois d\'avant à la 1re série ; rien qui change : null ; au temps : null');
  egal([E.texteChangement({ poids: { avant: 7.5, apres: 10 }, reps: { avant: 14, apres: 15 } }).texte, E.texteChangement({ poids: null, reps: { avant: 15, apres: 14 } }).texte],
    ['Plus lourd : 7,5 → 10 kg · 14 → 15 rép.', 'Moins de rép. : 15 → 14 rép.'], 'la pastille');
  // 2.38.64 : 23 à la série 1, 22 visé à la série 2 alors que le 19/11 c'était 21 : le progrès, pas une baisse.
  const ch = E.changement({ faites: [{ c: 4, r: 23 }] }, { charge: 4, valeur: 22 }, { date: '2026-11-19', series: [{ c: 4, r: 22 }, { c: 4, r: 21 }] });
  egal([ch.fois, E.texteChangement(ch).texte, E.texteChangement(ch).monte], [{ r: 21, date: '2026-11-19' }, '22 rép. : +1 depuis le 19/11', true], 'la pastille dit le progrès depuis la fois d\'avant');
  const sc = seanceEnCours(0);
  const i = indice(sc, 'Presse à cuisses');
  sc.exos[i].faites = [{ c: 60, r: 10 }];
  const { o } = ecran(sc, { seances: HIST_PRESSE, courant: 'Presse à cuisses' });
  const vert = o.classe('salle-change', o.une('salle-cible-gros')).map((e) => e.textContent);
  egal([vert.length > 0, !!o.une('salle-cible-change')], [true, true], 'sur la carte : le nombre qui change en vert, la pastille en tête');
});

// 2.38.60 (demande : un logo pour modifier, laissé accessible près de la série) : un crayon sur la dernière série notée ouvre sa
// correction ; « Corriger la dernière série » reste dans le menu « … ».
rendu('le crayon de la dernière série notée ouvre sa correction', async () => {
  const sc = seanceEnCours(0);
  const i = indice(sc, 'Presse à cuisses');
  sc.exos[i].faites = [{ c: 60, r: 10 }, { c: 60, r: 9 }];
  const { v, o } = ecran(sc, { seances: HIST_PRESSE, courant: 'Presse à cuisses' });
  const crayons = o.classe('salle-serie-modifier');
  await o.cliquer(crayons[0]);
  egal([crayons.length, v.corrige && v.corrige.m, v.corrige && v.corrige.c, v.corrige && v.corrige.v, o.classe('salle-serie-correction').length, o.classe('salle-serie-saisie').length], [1, 1, 60, 9, 1, 1],
    'un seul crayon (la dernière série) ; il ouvre sa correction avec ses chiffres ; une seule saisie à l\'écran (2.38.61 : pas celle de la série en cours)');
});


// 2.38.89 (demande : « lui, il n'a pas le bloqueur de son » : un Android) : chargé directement (Android, l'aperçu), le
// lecteur reçoit « coupe le son » toutes les demi-secondes tant qu'il est à l'écran ; retiré, ça s'arrête.
rendu('vidéo sans le son, chargée directement : « coupe le son » envoyé au lecteur tant qu\'il est à l\'écran', async () => {
  const minuteurs = [], arretes = [], recus = [];
  const avant = { si: window.setInterval, ci: window.clearInterval };
  window.setInterval = (f, ms) => { minuteurs.push({ f, ms }); return minuteurs.length; };
  window.clearInterval = (n) => { arretes.push(n); };
  try {
    const cadre = { contentWindow: { postMessage: (m, o) => recus.push([JSON.parse(m), o]) }, isConnected: true };
    const n = sonCoupe(cadre);
    minuteurs[0].f(); minuteurs[0].f();
    cadre.isConnected = false;
    minuteurs[0].f();
    egal([n, minuteurs[0].ms, recus.length, recus[0], arretes], [1, 500, 2, [{ event: 'command', func: 'mute', args: [] }, '*'], [1]],
      'vidéo sans le son, chargée directement : « coupe le son » envoyé au lecteur tant qu\'il est à l\'écran');
    egal(/[?&]enablejsapi=1\b/.test(adresseLecteur('nDh_BlnLCGc', false)), true, 'chargée directement, la vidéo se laisse commander (enablejsapi=1)');
  } finally { window.setInterval = avant.si; window.clearInterval = avant.ci; }
});

// 2.41.14 (« sur cet écran, on ne voit pas le nombre de poids par côté ») : au repos, sous la charge qui suit, les disques de
// chaque côté sur un appareil à disques (la presse), rien sur une machine à pile.
rendu('repos : les disques de chaque côté de la charge qui suit', async () => {
  const sc = seanceEnCours(0);
  const i = sc.exos.findIndex((x) => !x.echauffement && x.unite !== 's');
  sc.exos[i].disques = true;   // un appareil à disques (comme la presse du programme)
  sc.exos.forEach((x, j) => { if (j < i) x.faites = x.echauffement ? [{ min: 5 }] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
  sc.exos[i].faites = [{ c: 120, r: 10 }];
  Object.assign(sc, { courant: i, reposFin: Date.now() + 90000, reposTotal: 90 });
  const { o } = ecran(sc, {});
  const repos = o.une('salle-repos');
  const disques = o.classe('salle-suite-disques', repos).map((e) => e.textContent.trim());
  egal([disques.length, /^Par côté : /.test(disques[0] || '')], [1, true], 'au repos, « Par côté : … » sous la charge de la presse');
  // 2.41.15 (repos refait) : un disque dessiné par disque (120 kg : 3 × 20 de chaque côté), et le total d'un côté.
  egal([o.classe('salle-disque', repos).map((e) => e.textContent), (o.une('salle-disques-total', repos) || {}).textContent, o.classe('salle-repos-anneau', repos).length, o.classe('salle-repos-jauge', repos).length],
    [['20', '20', '20'], '60 kg', 1, 0], 'au repos : les disques dessinés, le total d\'un côté, l\'anneau à la place de la jauge');
});
rendu('repos : aux haltères, le poids dans chaque main (2.41.15)', async () => {
  const sc = seanceEnCours(0);
  const i = sc.exos.findIndex((x) => /halt[eè]res/i.test(x.nom) && !x.echauffement && x.unite !== 's');
  sc.exos.forEach((x, j) => { if (j < i) x.faites = x.echauffement ? [{ min: 5 }] : Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 30 } : { c: 20, r: 10 })); });
  sc.exos[i].faites = [{ c: 8, r: 12 }];
  Object.assign(sc, { courant: i, reposFin: Date.now() + 90000, reposTotal: 90 });
  const { o } = ecran(sc, {});
  const repos = o.une('salle-repos');
  egal([o.classe('salle-suite-disques', repos).length, /^Dans chaque main : \d/.test((o.une('salle-suite-main', repos) || {}).textContent || '')], [0, true], 'aux haltères : « Dans chaque main : … kg », pas de disques');
});
