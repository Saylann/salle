// Les rendus des paliers (2.2.0, src/42-niveau.js : L.palier, L.paliersCorps, L.palierAMesurer ; 2.10.0 : atteints par les
// XP) : l'accueil (l'échelle des paliers), le bilan de fin qui passe un palier, la carte du niveau de Progrès (l'échelle, le
// corps à chaque palier, les photos), l'écran Mesures (carte du palier, une fois, photo possible ou non), et la photo
// enregistrée par le vrai SallePlugin.ajouterPhoto dans un petit coffre en mémoire. Une règle = une vérification.
// Aides : rendu, ok, egal, vrai, fauxPlugin, nouvelleVue, outilsEcran, simulerDate (tests/dom-factice.js).
const P115 = L.lireProgramme(PROGRAMME_115);

// ── Aides du fichier ──
// Des séances bien faites, relues comme de vraies notes : 5 exercices à 3 séries, une charge de plus à chaque fois (des
// progrès, des records), 2 ou moins en réserve partout ; lundi, mercredi, vendredi. La n-ième (à partir de 1) : le jourBon.
const EXOS_BONS = ['Tirage vertical prise large', 'Développé assis à la machine', 'Presse à cuisses', 'Élévations latérales aux haltères', 'Curl aux haltères'];
const seanceBonne = (date, n) => Object.assign(L.lireSeance(L.ecrireSeance({ date, nom: 'Séance libre',
  exos: EXOS_BONS.map((nom) => ({ nom, series: Array.from({ length: 3 }, () => ({ c: 20 + 2.5 * n, r: 10 })), reserve: '1-2' })) })), { chemin: `Séances/${date} Séance libre.md` });
const jourBon = (debut, n) => L.plusJours(debut, 7 * Math.floor((n - 1) / 3) + [0, 2, 4][(n - 1) % 3]);
const serieBonne = (debut, n) => Array.from({ length: n }, (_, i) => seanceBonne(jourBon(debut, i + 1), i + 1));
// NR : la séance qui fait passer Régulier (10 000 XP), environ la 18e. Les tests se passent le lundi 16/11/2026 : le lundi de
// départ est choisi pour que la séance NR + 2 (N2) tombe dans la semaine du 09/11 (rien de perdu le 16/11).
const NR = (() => {
  for (let n = 1; n < 40; n++) if (L.niveau(serieBonne('2026-06-01', n), P115, { niveau: 'un peu', parSemaine: 3, duree: 75 }, jourBon('2026-06-01', n)).palier.rang >= 1) return n;
  return 40;
})();
const N2 = NR + 2;
const DEBUT = L.plusJours('2026-11-09', -7 * Math.floor((N2 - 1) / 3));
const seances = (n) => serieBonne(DEBUT, n);
const jourDe = (n) => jourBon(DEBUT, n);
// Un plugin pour ces écrans : les appels notés ; photo possible ou non (peutPhoto) ; urlPhoto rend « url:chemin ».
function pluginP(o) {
  o = o || {};
  const p = fauxPlugin({ etat: Object.assign({ programme: P115 }, o.etat || {}), donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75 }, enCours: null } });
  p.appels = [];
  const vus = new Set(o.vus || []);
  p.dejaVu = (cle) => vus.has(cle);
  p.marquerVu = (cle) => { vus.add(cle); p.appels.push(['marquerVu', cle]); };
  p.ajouterMesure = async (m) => { p.appels.push(['ajouterMesure', m]); };
  p.peutPhoto = () => o.photo !== false;
  p.ajouterPhoto = async (octets, date) => { p.appels.push(['ajouterPhoto', octets && octets.byteLength, date]); return `Photos/${date}-palier.jpg`; };
  p.urlPhoto = (lien) => `url:${lien}`;
  return p;
}
function vueP(p, ecran, avant) {
  const v = nouvelleVue(p);
  v.ecran = ecran || 'accueil';
  if (avant) avant(v);
  v.rendre();
  return Object.assign({ v }, outilsEcran(v));
}
const parClasse = (o, c) => o.r().tous((e) => (' ' + (e.className || '') + ' ').indexOf(' ' + c + ' ') >= 0);
// Le texte d'un élément, les blancs du faux DOM (un espace entre deux enfants) ramenés à un seul.
const textes = (o, c) => parClasse(o, c).map((e) => e.textContent.trim().replace(/\s+/g, ' '));
// 2.40.2 : la carte « Manger » a aussi une échelle (les repas du jour) : ici, seulement celle du niveau (« Tes progrès »).
const textesNiveau = (o, c) => { const b = parClasse(o, 'salle-niveau-accueil')[0]; return b ? b.tous((e) => (' ' + (e.className || '') + ' ').indexOf(' ' + c + ' ') >= 0).map((e) => e.textContent.trim().replace(/\s+/g, ' ')) : []; };
async function cliquer(o, t) {
  const b = o.bouton(t);
  if (!b) throw new Error(`bouton « ${t} » absent`);
  for (const f of b.ev.click || []) await f({ target: b });
}
// Le bilan de la séance qui vient d'être notée (pas encore relue par l'index).
const bilanDe = (s, avant) => ({ seance: s, records: [], compare: L.bilanCompare(s, avant), premiere: false, chemin: s.chemin, series: 10, ressenti: '' });

// ── Accueil ──
// 2.9.0 : l'échelle des 5 paliers sous le niveau (l'utilisateur ne voyait pas la ligne « Prochain palier »), en <span> (dans un bouton).
rendu('accueil : « Niveau 1 · Débutant » et l\'échelle des paliers, Régulier à 10 000 XP', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueP(pluginP({ etat: { seances: seances(2) } }), 'accueil');
  const n = L.niveau(seances(2), P115, reglagesVue(o.v.plugin), '2026-11-16');
  const ech = parClasse(o, 'salle-echelle')[0];
  egal([textes(o, 'salle-niveau-nom'), textesNiveau(o, 'salle-echelle-titre'), textesNiveau(o, 'salle-echelle-niv').slice(0, 2), ech && ech.tagName, o.erreur()],
    [[`Niveau ${n.niveau} · Débutant`], ['Débutant', 'Régulier', 'Solide', 'Costaud', 'Confirmé'], ['tu es ici', '10 000 XP'], 'span', false],
    'accueil : le titre du palier et l\'échelle des paliers (Régulier à 10 000 XP)');
});
rendu('accueil : au dernier palier, toute l\'échelle est faite', async () => {
  simulerDate('2026-11-16T18:00:00');
  const vraie = L.niveau;
  L.niveau = (...a) => Object.assign(vraie(...a), { titre: 'Confirmé', palier: L.palier(90000) });
  let o;
  try { o = vueP(pluginP({ etat: { seances: seances(2) } }), 'accueil'); } finally { L.niveau = vraie; }
  egal([textesNiveau(o, 'salle-echelle-niv'), /Confirmé/.test(textes(o, 'salle-niveau-nom')[0]), o.erreur()], [['fait', 'fait', 'fait', 'fait', 'tu es ici'], true, false], 'accueil : Confirmé, pas de palier suivant');
});

// ── Bilan de fin ──
rendu('bilan : la séance qui fait passer 10 000 XP : « Palier : Régulier ! », la phrase des études, le bouton', async () => {
  simulerDate(`${jourDe(NR)}T20:00:00`);
  const avant = seances(NR - 1), s18 = seanceBonne(jourDe(NR), NR);
  const o = vueP(pluginP({ etat: { seances: avant } }), 'bilan', (v) => { v.bilan = bilanDe(s18, avant); });
  const carte = parClasse(o, 'salle-palier-fete')[0];
  const ordre = o.r().childNodes.map((e) => e.className || '');
  egal([textes(o, 'salle-palier-titre'), textes(o, 'salle-palier-phrase'), textes(o, 'salle-palier-surtitre'), !!carte && /salle-palier-anime/.test(carte.className),
    ordre.findIndex((c) => /salle-palier-fete/.test(c)) < ordre.findIndex((c) => /salle-xp-bilan/.test(c)), o.erreur()],
  [['Palier : Régulier !'], [L.PALIERS[1].phrase], ['10 000 XP'], true, true, false], 'bilan : la carte du palier, avant celle des XP, animée la première fois');
  await cliquer(o, 'Me mesurer et prendre la photo');
  egal([o.v.ecran, o.v.modePalier], ['mesures', 1], 'bilan : « Me mesurer et prendre la photo » ouvre Mesures en mode palier');
  o.v.rendre();
  egal(textes(o, 'salle-palier-mesures').map((t) => t.slice(0, 36)), ['Palier Régulier atteint : mesure-toi'],
    'bilan → Mesures : la carte du palier, même avant que l\'index relise la séance');
});
rendu('bilan : un nouveau dessin (le ressenti) ne rejoue pas l\'animation du palier', async () => {
  simulerDate(`${jourDe(NR)}T20:00:00`);
  const avant = seances(NR - 1), s18 = seanceBonne(jourDe(NR), NR);
  const o = vueP(pluginP({ etat: { seances: avant } }), 'bilan', (v) => { v.bilan = bilanDe(s18, avant); });
  await cliquer(o, 'Bien');
  egal([textes(o, 'salle-palier-titre'), parClasse(o, 'salle-palier-anime').length], [['Palier : Régulier !'], 0], 'bilan : le palier reste, sans animation');
});
rendu('bilan : une séance qui ne passe pas de palier : pas de carte du palier', async () => {
  simulerDate(`${jourDe(NR + 1)}T20:00:00`);
  const avant = seances(NR), s19 = seanceBonne(jourDe(NR + 1), NR + 1);
  const o = vueP(pluginP({ etat: { seances: avant } }), 'bilan', (v) => { v.bilan = bilanDe(s19, avant); });
  egal([parClasse(o, 'salle-palier-fete').length, parClasse(o, 'salle-xp-bilan').length, o.erreur()], [0, 1, false], 'bilan : la séance d\'après, seulement les XP');
});

// ── Progrès : l'échelle des paliers et le corps ──
// La mesure du départ (le lendemain de la 1re séance) et celle du palier Régulier (le lendemain de la séance NR), avec photo.
const D0 = L.plusJours(jourDe(1), 1), D1 = L.plusJours(jourDe(NR), 1);
const MESURES = [{ date: D0, poids: 70, epaules: 110, bras: 30, photo: `Photos/${D0}-palier.jpg` },
  { date: D1, poids: 71.2, epaules: 111.5, bras: 31, photo: `Photos/${D1}-palier.jpg` }];
rendu('progrès : l\'échelle des paliers, ce que les mesures ont changé, les photos côte à côte', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueP(pluginP({ etat: { seances: seances(N2), mesures: MESURES } }), 'progres');   // Régulier à la séance NR
  const paliers = parClasse(o, 'salle-echelle-palier');
  egal(paliers.map((e) => e.className.replace('salle-echelle-palier salle-echelle-', '') + ' ' + e.childNodes[1].textContent + ' ' + e.childNodes[2].textContent),
    ['passe Débutant fait', 'ici Régulier tu es ici', 'avenir Solide 20 000 XP', 'avenir Costaud 40 000 XP', 'avenir Confirmé 80 000 XP'], 'progrès : l\'échelle des 5 paliers, fait / ici / à venir');
  // 2.3.0 : Régulier, moins de 84 jours après la mesure de départ : la mesure et la photo sont gardées, sans écart (on compare à
  // 12 semaines : l'eau des premières séances fausse la mesure [108, 109]).
  egal([parClasse(o, 'salle-corps-ligne').map((e) => e.textContent.trim().replace(/\s+/g, ' ')), parClasse(o, 'salle-corps-change').length],
    [[`Débutant ton point de départ (${L.dateCourte(D0)})`, 'Régulier Mesure gardée : tu compareras à 12 semaines.'], 0], 'progrès : avant 84 jours, la mesure gardée, sans écart ni lime'); // 2.9.0 : le pourquoi n'est plus affiché
  const tot = L.plusJours(D1, -86);
  const loin = vueP(pluginP({ etat: { seances: seances(N2), mesures: [Object.assign({}, MESURES[0], { date: tot }), MESURES[1]] } }), 'progres');
  egal(parClasse(loin, 'salle-corps-ligne').map((e) => e.textContent.trim().replace(/\s+/g, ' ')),
    [`Débutant ton point de départ (${L.dateCourte(tot)})`, 'Régulier Épaules +1,5 cm · Bras +1 cm · Poids +1,2 kg'], 'progrès : à 84 jours ou plus, ce que les mesures ont changé depuis le départ');
  egal(parClasse(loin, 'salle-corps-change').length, 1, 'progrès : en lime seulement ce qui a bougé (jamais de rouge)');
  const suite = L.niveau(seances(N2), P115, reglagesVue(o.v.plugin), '2026-11-16').palier.prochain;
  egal([textes(o, 'salle-palier-suivant'), parClasse(o, 'salle-photo').map((f) => f.tous((e) => e.tagName === 'img')[0].attrs.src)],
    // 2.10.0 : le palier en titre (les XP qui manquent), « environ N séances bien faites », puis sa phrase.
    [[`Solide : encore ${L.fmtMilliers(suite.reste)} XP Environ ${suite.seances} séances bien faites. Environ 12 semaines : compare tes photos, tes épaules et ta taille.`], [`url:Photos/${D0}-palier.jpg`, `url:Photos/${D1}-palier.jpg`]],
    'progrès : le palier suivant et sa phrase ; les photos du départ et de la dernière');
});
rendu('progrès : sans mesure, « pas de mesure à ce palier » ; sans différence, une phrase calme', async () => {
  simulerDate('2026-11-16T18:00:00');
  const sans = vueP(pluginP({ etat: { seances: seances(N2), mesures: [] } }), 'progres');
  const pareil = vueP(pluginP({ etat: { seances: seances(N2), mesures: [{ date: L.plusJours(D1, -88), poids: 70 }, { date: D1, poids: 70 }] } }), 'progres');   // 2.3.0 : 88 jours d'écart
  egal([textes(sans, 'salle-corps-texte'), textes(pareil, 'salle-corps-texte'), parClasse(sans, 'salle-photos').length],
    [['pas de mesure à ce palier', 'pas de mesure à ce palier'], [`ton point de départ (${L.dateCourte(L.plusJours(D1, -88))})`, 'pas encore de différence mesurable : normal, ça se voit surtout plus tard'], 0],
    'progrès : aucune mesure, ou rien de mesurable : le dire sans reproche ; pas de photo, pas de cadre');
});
rendu('progrès : une photo introuvable garde sa place avec la date', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginP({ etat: { seances: seances(N2), mesures: MESURES } });
  p.urlPhoto = () => null;
  const o = vueP(p, 'progres');
  egal([textes(o, 'salle-photo-vide'), o.erreur()], [['photo introuvable', 'photo introuvable'], false], 'progrès : photo introuvable, rien ne casse');
});

// ── Mesures : la carte du palier ──
rendu('mesures : Régulier atteint sans mesure : la carte en haut, les conditions, « Prendre la photo »', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueP(pluginP({ etat: { seances: seances(N2), mesures: [MESURES[0]] } }), 'mesures');
  const carte = parClasse(o, 'salle-palier-mesures')[0];
  const champ = carte && carte.tous((e) => e.tagName === 'input')[0];
  egal([o.r().childNodes.findIndex((e) => /salle-palier-mesures/.test(e.className || '')) >= 0 && o.r().childNodes.findIndex((e) => /salle-palier-mesures/.test(e.className || '')) < o.r().childNodes.findIndex((e) => /salle-mesures-saisie/.test(e.className || '')),
    carte && carte.childNodes[0].textContent.trim(), /le matin, à jeun, même lumière, même endroit/.test(carte.textContent) && /de face et de profil, détendu/.test(carte.textContent),
    champ && [champ.attrs.type, champ.attrs.accept, champ.attrs.capture], textes(o, 'salle-photo-bouton')],
  [true, 'Palier Régulier atteint : mesure-toi', true, ['file', 'image/*', ''], ['Prendre la photo']], 'mesures : la carte du palier, avant la saisie');
});
rendu('mesures : la photo choisie part dans plugin.ajouterPhoto (JPEG), puis l\'écran se redessine', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginP({ etat: { seances: seances(N2), mesures: [] } });
  const o = vueP(p, 'mesures');
  const champ = parClasse(o, 'salle-photo-champ')[0];
  const octets = new ArrayBuffer(12);
  for (const f of champ.ev.change || []) await f({ target: { files: [{ type: 'image/jpeg', arrayBuffer: async () => octets }] } });
  egal(p.appels.filter((x) => x[0] === 'ajouterPhoto'), [['ajouterPhoto', 12, '2026-11-16']], 'mesures : la photo enregistrée à la date du jour');
  for (const f of champ.ev.change || []) await f({ target: { files: [] } });
  for (const f of champ.ev.change || []) await f({ target: { files: [{ type: 'image/heic' }] } });
  egal([p.appels.filter((x) => x[0] === 'ajouterPhoto').length, avis[avis.length - 1]], [1, 'Cette photo ne se lit pas. Réessaie, ou garde seulement la mesure.'],
    'mesures : rien de choisi, ou une image illisible : rien n\'est écrit, un message le dit');
});
rendu('mesures : le tour de bras se saisit et part avec la mesure', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginP({ etat: { seances: seances(N2), mesures: [] } });
  const o = vueP(p, 'mesures');
  const champs = o.r().tous((e) => e.tagName === 'label' && /salle-mesure-ligne/.test(e.className));
  egal(champs.map((c) => c.childNodes[0].textContent), ['Poids', 'Tour d\'épaules', 'Tour de bras', 'Tour de poitrine', 'Tour de taille (nombril)'], 'mesures : poids, épaules, bras, poitrine, taille (2.4.0)');
  const saisir = (k, v) => { const i = champs[k].tous((e) => e.tagName === 'input')[0]; for (const f of i.ev.input || []) f({ target: { value: v } }); };
  saisir(1, '111,5'); saisir(2, '31');
  await cliquer(o, 'Enregistrer');
  egal(p.appels.filter((x) => x[0] === 'ajouterMesure'), [['ajouterMesure', { date: '2026-11-16', epaules: 111.5, bras: 31 }]], 'mesures : épaules et bras enregistrés');
});
rendu('mesures : une seule fois par palier : « Plus tard », ou déjà vu, et la carte ne revient plus', async () => {
  simulerDate('2026-11-16T18:00:00');
  const p = pluginP({ etat: { seances: seances(N2), mesures: [] } });
  const o = vueP(p, 'mesures');
  await cliquer(o, 'Plus tard');
  egal([p.appels.filter((x) => x[0] === 'marquerVu'), parClasse(o, 'salle-palier-mesures').length], [[['marquerVu', 'palier-1']], 0], 'mesures : « Plus tard » : vue une fois');
  egal(parClasse(vueP(p, 'mesures'), 'salle-palier-mesures').length, 0, 'mesures : la carte ne revient pas');
  egal(parClasse(vueP(p, 'mesures', (v) => { v.modePalier = 1; }), 'salle-palier-mesures').length, 1, 'mesures : ouverte par le bilan (mode palier), elle se montre quand même');
});
rendu('mesures : mesuré depuis le palier : « il manque la photo » ; mesure et photo faites : plus de carte', async () => {
  simulerDate('2026-11-16T18:00:00');
  const mesure = vueP(pluginP({ etat: { seances: seances(N2), mesures: [{ date: D1, poids: 71 }] } }), 'mesures');
  const tout = vueP(pluginP({ etat: { seances: seances(N2), mesures: [{ date: D1, poids: 71, photo: 'Photos/x.jpg' }] } }), 'mesures');
  egal([parClasse(mesure, 'salle-palier-mesures').map((c) => c.childNodes[0].textContent.trim()), parClasse(tout, 'salle-palier-mesures').length],
    [['Palier Régulier atteint : il manque la photo'], 0], 'mesures : ce qui manque, puis plus rien');
});
rendu('mesures : photo impossible sur l\'appareil : une ligne, la mesure suffit', async () => {
  simulerDate('2026-11-16T18:00:00');
  const sans = vueP(pluginP({ photo: false, etat: { seances: seances(N2), mesures: [] } }), 'mesures');
  const mesure = vueP(pluginP({ photo: false, etat: { seances: seances(N2), mesures: [{ date: D1, poids: 71 }] } }), 'mesures');
  egal([textes(sans, 'salle-photo-impossible'), parClasse(sans, 'salle-photo-champ').length, parClasse(mesure, 'salle-palier-mesures').length, sans.erreur()],
    [['Photo impossible sur cet appareil : la mesure suffit.'], 0, 0, false], 'mesures : sans photo, le dire en une ligne ; mesuré, plus de carte');
});
rendu('mesures : le départ sans aucune mesure le demande aussi', async () => {
  simulerDate('2026-11-16T18:00:00');
  const o = vueP(pluginP({ etat: { seances: seances(2), mesures: [] } }), 'mesures');
  egal(parClasse(o, 'salle-palier-mesures').map((c) => c.childNodes[0].textContent.trim()), ['Point de départ : mesure-toi'], 'mesures : point de départ');
});
rendu('mesures : un calcul du palier qui échoue : pas de carte, la saisie reste', async () => {
  simulerDate('2026-11-16T18:00:00');
  const vraie = L.palierAMesurer;
  L.palierAMesurer = () => { throw new Error('donnée inattendue'); };
  let o;
  try { o = vueP(pluginP({ etat: { seances: seances(N2), mesures: [] } }), 'mesures'); } finally { L.palierAMesurer = vraie; }
  egal([parClasse(o, 'salle-palier-mesures').length, parClasse(o, 'salle-mesures-saisie').length, o.erreur()], [0, 1, false], 'mesures : rien ne bloque');
});

// ── La photo dans le coffre : le vrai SallePlugin.ajouterPhoto ──
// Un petit coffre : la note Mesures (reconnue par son en-tête) dans « Suivi/ », ou pas de note.
function coffrePhoto(avecNote, sansBinaire) {
  const fichiers = {}, binaires = {}, dossiers = [];
  const ajouter = (path, t) => { const parts = path.split('/'); fichiers[path] = { path, name: parts.pop(), parent: { path: parts.join('/') || '/' }, _t: t }; return fichiers[path]; };
  if (avecNote) ajouter('Suivi/Mes mesures.md', '---\nsalle: mesures\n---\n# Mesures\n- 2026-11-10 · poids 70 kg\n- 2026-11-16 · poids 70,5 kg\n');
  const vault = {
    read: async (f) => f._t, modify: async (f, t) => { f._t = t; },
    create: async (p, t) => ajouter(p, t),
    createFolder: async (p) => { dossiers.push(p); fichiers[p] = { path: p }; },
    getAbstractFileByPath: (p) => fichiers[p] || binaires[p] || null,
  };
  if (!sansBinaire) vault.createBinary = async (p, d) => { binaires[p] = { path: p, octets: d.byteLength }; return binaires[p]; };
  const p = Object.create(SallePlugin.prototype);
  p.app = { vault };
  p.etat = { fichiers: { mesures: avecNote ? fichiers['Suivi/Mes mesures.md'] : null } };
  p.recharger = async () => { p.recharge = (p.recharge || 0) + 1; };
  return { p, fichiers, binaires, dossiers };
}
rendu('photo : enregistrée dans « photos » à côté de la note Mesures, liée à la ligne du jour', async () => {
  const c = coffrePhoto(true);
  const chemin = await c.p.ajouterPhoto(new ArrayBuffer(8), '2026-11-16');
  egal([chemin, c.dossiers, c.binaires[chemin] && c.binaires[chemin].octets, c.fichiers['Suivi/Mes mesures.md']._t.split('\n').slice(-2), c.p.recharge],
    ['Suivi/photos/2026-11-16-palier.jpg', ['Suivi/photos'], 8, ['- 2026-11-16 · poids 70,5 kg · ![[Suivi/photos/2026-11-16-palier.jpg]]', ''], 1],
    'photo : le sous-dossier créé, le fichier écrit, le lien sur la ligne du jour');
  egal(L.lireMesures(c.fichiers['Suivi/Mes mesures.md']._t)[1], { date: '2026-11-16', poids: 70.5, photo: 'Suivi/photos/2026-11-16-palier.jpg' }, 'photo : la note se relit');
  const deux = await c.p.ajouterPhoto(new ArrayBuffer(8), '2026-11-16');
  egal([deux, c.dossiers.length], ['Suivi/photos/2026-11-16-palier-2.jpg', 1], 'photo : une 2e photo le même jour n\'écrase rien');
});
// 2.24.0 : dans un coffre sans aucune note, tout ce qui dépend de l'utilisateur va dans « donnees » (DOSSIER_DONNEES).
rendu('photo : pas de note Mesures : elle est créée dans « donnees », la photo à côté', async () => {
  const c = coffrePhoto(false);
  const chemin = await c.p.ajouterPhoto(new ArrayBuffer(8), '2026-11-16');
  egal([chemin, c.fichiers['donnees/mesures.md'] && c.fichiers['donnees/mesures.md']._t, c.dossiers], ['donnees/photos/2026-11-16-palier.jpg', '---\nsalle: mesures\n---\n# Mesures\n- 2026-11-16 · ![[donnees/photos/2026-11-16-palier.jpg]]\n', ['donnees', 'donnees/photos']],
    'photo : la note Mesures créée avec la ligne du jour');
});
rendu('photo : un coffre qui ne sait pas écrire d\'image : null et un message, rien d\'écrit', async () => {
  const c = coffrePhoto(true, true);
  const n = avis.length;
  const chemin = await c.p.ajouterPhoto(new ArrayBuffer(8), '2026-11-16');
  egal([chemin, avis.slice(n), c.dossiers, /!\[\[/.test(c.fichiers['Suivi/Mes mesures.md']._t), c.p.peutPhoto()], [null, ['Photo impossible sur cet appareil : la mesure suffit.'], [], false, false],
    'photo : impossible, dit en une ligne ; peutPhoto répond non');
});
