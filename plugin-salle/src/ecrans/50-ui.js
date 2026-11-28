// ───────────────────────── Petits outils d'écran ─────────────────────────
// Des fonctions, pas des méthodes : tous les écrans (61 à 68) et le plugin s'en servent.

// ── La base de tous les écrans : un élément, une icône, vider, du texte de note ──
function h(tag, props, ...enfants) {
  const el = document.createElement(tag);
  const p = props || {};
  for (const k of Object.keys(p)) {
    if (k === 'icone') continue;
    if (k === 'cls') el.className = p[k];
    else if (k === 'text') el.textContent = p[k];
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), p[k]);
    else if (p[k] != null && p[k] !== false) el.setAttribute(k, p[k] === true ? '' : p[k]);
  }
  for (const e of enfants.flat(Infinity)) {   // des listes dans des listes (un .map de .map) : tout à plat, jamais un tableau en enfant
    if (e == null || e === false) continue;
    el.appendChild(typeof e === 'string' ? document.createTextNode(e) : e);
  }
  if (p.icone) {
    const ic = icone(p.icone);
    if (ic) { el.insertBefore(ic, el.firstChild); el.classList.add('salle-a-ic'); }
  }
  return el;
}
// Une icône d'Obsidian (Lucide) dans un <span>. Sans setIcon (ancienne version, aperçu) ou nom inconnu : null, le texte suffit.
function icone(cle) {
  const nom = L.icone(cle);
  if (!nom || typeof obsidian.setIcon !== 'function') return null;
  const el = document.createElement('span');
  el.className = 'salle-ic';
  el.setAttribute('aria-hidden', 'true');
  try { obsidian.setIcon(el, nom); } catch (e) { return null; }
  return el.firstChild ? el : null;
}
function vider(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
// Du texte simple de note (gras, puces) → des éléments.
function texteRiche(lignes) {
  const boite = h('div', { cls: 'salle-texte' });
  let liste = null;
  const morceaux = (t) => t.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (x, a, b) => b || a).split(/(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/).filter(Boolean).map((m) => {
    if (/^\*\*.+\*\*$/.test(m)) return h('strong', { text: m.slice(2, -2) });
    if (/^`[^`]+`$/.test(m)) return h('code', { text: m.slice(1, -1) });
    const lien = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(m);
    if (lien) return h('a', { href: lien[2], cls: 'external-link', target: '_blank', rel: 'noopener', text: lien[1] });
    return m;
  });
  let genre = null;
  for (const brute of lignes || []) {
    const l = String(brute).trim().replace(/^>\s?/, '').trim();   // les encadrés « > » se lisent comme du texte
    if (!l) { liste = null; continue; }
    const puce = /^[-*+]\s+(.+)$/.exec(l), numero = /^\d+[.)]\s+(.+)$/.exec(l);
    const titre = /^#{3,6}\s+(.+)$/.exec(l) || /^\[![a-z]+\][-+]?\s*(.*)$/i.exec(l);
    if (puce || numero) {
      const g = puce ? 'ul' : 'ol';
      if (!liste || genre !== g) { liste = h(g); genre = g; boite.appendChild(liste); }
      liste.appendChild(h('li', null, morceaux((puce || numero)[1])));
    } else if (titre) {
      liste = null;
      if (titre[1]) boite.appendChild(h('p', { cls: 'salle-sous-titre' }, morceaux(titre[1])));
    } else {
      liste = null;
      boite.appendChild(h('p', null, morceaux(l)));
    }
  }
  return boite;
}
// « Ouvrir dans YouTube » : le secours sous chaque lecteur (2.38.83).
function ouvrirYoutube(url) {
  try { window.open(url); } catch (e) { signalerErreur(e); }
}
// L'adresse du lecteur intégré, comme Obsidian le fait pour ses notes (1.15) : dans l'app (adresse app:// ou capacitor://),
// sa page releases.obsidian.md/youtube, qui fait marcher YouTube sur le Mac et l'iPhone et passe ses réglages à YouTube ;
// ailleurs (l'aperçu), YouTube. 2.38.86 (demande : « quand elle se lance, par défaut coupe le son ») ; 2.38.87 (demande :
// « le son commence coupé, mais quand la vidéo se lance il se réactive » : sur téléphone, le premier toucher sur une vidéo
// muette de YouTube rallume le son) : sans le son, elle démarre seule et tourne en boucle, sans boutons (comme l'animation
// d'avant) ; avecSon : elle repart du début avec le son et ses boutons.
// 2.38.89 (demande : « lui, il n'a pas le bloqueur de son » : son téléphone est un Android) : sur Android (adresse https://,
// comme la règle d'Obsidian), YouTube est chargé directement ; enablejsapi=1 laisse le plugin le commander (sonCoupe).
function lecteurParObsidian() {
  return typeof location !== 'undefined' && location.protocol !== 'https:' && typeof navigator !== 'undefined' && /obsidian/i.test(navigator.userAgent || '');
}
// 2.41.11 : debut (secondes) : là où la vidéo reprend.
function adresseLecteur(id, avecSon, debut) {
  const reglages = `autoplay=1&playsinline=1&rel=0&loop=1&playlist=${id}&mute=${avecSon ? 0 : 1}&controls=${avecSon ? 1 : 0}${debut > 0 ? `&start=${Math.floor(debut)}` : ''}`;
  return lecteurParObsidian() ? `https://releases.obsidian.md/youtube?v=${id}&${reglages}` : `https://www.youtube-nocookie.com/embed/${id}?${reglages}&enablejsapi=1`;
}
// Sans le son, chargé directement (Android, l'aperçu) : « coupe le son » envoyé au lecteur YouTube toutes les demi-secondes
// tant que le cadre est à l'écran, au cas où YouTube le rallume (un toucher, ou mute=1 ignoré). Le cadre retiré (Fermer,
// « Avec le son », un autre écran) : ça s'arrête. Par la page d'Obsidian (iPhone, Mac), le lecteur n'est pas joignable :
// mute=1 et la vitre suffisent.
const SON_COUPE_MS = 500;
function sonCoupe(cadre) {
  if (lecteurParObsidian() || typeof window === 'undefined' || typeof window.setInterval !== 'function') return null;
  const ordre = JSON.stringify({ event: 'command', func: 'mute', args: [] });
  const minuteur = window.setInterval(() => {
    if (cadre.isConnected === false) { window.clearInterval(minuteur); return; }
    try { if (cadre.contentWindow) cadre.contentWindow.postMessage(ordre, '*'); } catch (e) { window.clearInterval(minuteur); }
  }, SON_COUPE_MS);
  return minuteur;
}
// 2.38.83 (demande : « mets-la dans l'app ») : la vidéo lue sur place, à la forme de son image (9:16, 1:1, 16:9), et
// « Ouvrir dans YouTube » dessous si le lecteur ne marche pas. Fermer retire le cadre : la vidéo s'arrête. Le cadre est fait
// ici, à la même adresse qu'Obsidian (adresseLecteur) : son lecteur des notes ne laisse pas couper le son (2.38.86).
// 2.38.87 : lance (la vidéo en grand, ouverte d'un toucher) : elle tourne tout de suite ; sinon (l'aide, le guide) sa vignette,
// et un toucher la lance à sa place. Sans le son, une vitre sur la vidéo garde les touchers (le son ne se rallume pas) ;
// « Avec le son » la relance avec le son et ses boutons, « Sans le son » revient comme avant.
// Ce que le cadre du lecteur permet : les mêmes droits que le cadre YouTube d'Obsidian.
const PERMIS_LECTEUR = ['accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'gyroscope', 'picture-in-picture', 'web-share'];
function lecteurVideo(plugin, v, lance) {
  const [l, ht] = v.format.split(':').map(Number);
  const cadre = h('div', { cls: 'salle-video-lecteur salle-video-' + (l < ht ? 'haute' : l === ht ? 'carree' : 'large') });
  cadre.style.aspectRatio = `${l} / ${ht}`;
  const boutons = h('div', { cls: 'salle-video-boutons' });
  const vider = (el) => { while (el.childNodes && el.childNodes.length) el.removeChild(el.childNodes[0]); };
  // 2.41.11 (demande : « quand j'appuie sur le bouton pour activer le son, toute la vidéo se relance, j'aime pas ça » ; « il ne
  // faut pas que l'application devienne lente ») : le lecteur d'Obsidian ne se laisse pas commander, donc le son se rallume en
  // rechargeant la vidéo ; elle reprend là où elle en était : l'heure de départ, sa durée (la fiche, « · 31 s ») et la boucle
  // donnent la seconde (rien ne tourne en fond : un calcul au toucher).
  let partie = 0, depuis = 0;
  const ici = () => (partie && v.duree ? (depuis + (Date.now() - partie) / 1000) % v.duree : 0);
  const jouer = (avecSon) => {
    const debut = ici();
    vider(cadre); vider(boutons);
    if (!v.id) return;
    depuis = debut; partie = Date.now();
    const iframe = h('iframe', { src: adresseLecteur(v.id, avecSon, debut), title: 'Vidéo du mouvement', frameborder: '0', allowfullscreen: '',
      allow: PERMIS_LECTEUR.join('; '), referrerpolicy: 'strict-origin-when-cross-origin' });
    cadre.appendChild(iframe);
    if (!avecSon) { cadre.appendChild(h('div', { cls: 'salle-video-vitre', 'aria-hidden': 'true' })); sonCoupe(iframe); }
    boutons.appendChild(h('button', { cls: 'salle-lien salle-video-son', type: 'button', text: avecSon ? 'Sans le son' : 'Avec le son', icone: avecSon ? 'muet' : 'son', onclick: () => jouer(!avecSon) }));
    boutons.appendChild(h('button', { cls: 'salle-lien salle-video-secours', type: 'button', text: 'Ouvrir dans YouTube', icone: 'ouvrir', onclick: () => ouvrirYoutube(v.url) }));
  };
  if (lance || !v.id) jouer(false);
  else {
    // La vignette d'abord (rien ne se charge de YouTube avant le toucher) ; un toucher la lance, sans le son.
    cadre.appendChild(h('button', { cls: 'salle-video-attente', type: 'button', 'aria-label': 'Lancer la vidéo', onclick: () => jouer(false) },
      h('img', { src: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, alt: '', loading: 'lazy' }), h('span', { cls: 'salle-anim-lecture' }, icone('video') || '▶')));
    boutons.appendChild(h('button', { cls: 'salle-lien salle-video-secours', type: 'button', text: 'Ouvrir dans YouTube', icone: 'ouvrir', onclick: () => ouvrirYoutube(v.url) }));
  }
  return h('div', { cls: 'salle-video-boite' }, cadre, boutons);
}
// Une fiche du guide → des champs : le nom en petit (« Muscles », « Réglage »…), puis le texte en gros et ses puces.
// sansSentir : l'image au-dessus montre déjà « Tu dois sentir ». sans (facultatif) : un motif des noms de champs à ne pas montrer.
// sansDebut (facultatif) : un motif des champs dont la première phrase est déjà dite au-dessus (l'étiquette « Réglage » de
// l'aide) : ni leur nom, ni cette phrase ; la suite du texte et les puces restent, en premier (juste sous cette étiquette).
function ficheExercice(lignes, sansSentir, sans, sansDebut) {
  const groupes = [];
  let cur = { nom: '', texte: '', suite: [] };
  for (const brute of lignes || []) {
    const champ = /^\*\*(.+?)\s*:\s*\*\*\s*(.*)$/.exec(String(brute).trim());
    if (champ) { groupes.push(cur); cur = { nom: champ[1].trim(), texte: champ[2], suite: [] }; }
    else cur.suite.push(brute);
  }
  groupes.push(cur);
  const boite = h('div', { cls: 'salle-fiche-champs' });
  const enOrdre = sansDebut ? groupes.filter((g) => sansDebut.test(g.nom)).concat(groupes.filter((g) => !sansDebut.test(g.nom))) : groupes;
  for (const g of enOrdre) {
    // « Tu dois sentir » déjà sous l'image : le champ part, ses puces éventuelles restent.
    if (sans && sans.test(g.nom)) continue;   // les champs que cet écran ne montre pas
    if (/^À retenir$/i.test(g.nom)) continue;  // la version courte de la fiche : seulement pendant le repos (ECRAN_SEANCE.reperes)
    const cache = sansSentir && /^Tu dois sentir/i.test(g.nom);
    const debut = !!sansDebut && sansDebut.test(g.nom);
    const nom = cache || debut ? '' : g.nom;
    const brut = debut ? g.texte.replace(/^.*?[.!?](?:\s+|$)/, '') : g.texte;   // la même première phrase que L.texteReglage
    const texte = brut.charAt(0).toUpperCase() + brut.slice(1);   // seul sous son nom : il commence la phrase
    const lignesG = (texte && !cache ? [texte] : []).concat(g.suite);
    if (!nom && !lignesG.some((l) => String(l).trim())) continue;
    boite.appendChild(h('div', { cls: 'salle-fiche-champ' }, nom ? h('div', { cls: 'salle-fiche-nom', text: nom }) : null, texteRiche(lignesG)));
  }
  return boite;
}

// ── Des textes courts (2.5.1 : l'utilisateur lit sur iPhone, 375 px : un texte long ne donne pas envie de lire) ──
// Un texte d'écran tient en 2 lignes à 375 px (L.LIGNE_MAX signes ; tests/textes-courts.js le vérifie sur chaque écran).
// L'explication va dans un détail repliable, fermé : « Pourquoi » (ou « Lesquels », « Comment », « Conseil », « Détail », « Et après »).
// Convention des textes de L : « Phrase courte.\nPourquoi : l'explication. » ; sans titre après « \n » : « Pourquoi ».
const TITRES_REPLIABLES = ['Pourquoi', 'Lesquels', 'Comment', 'Conseil', 'Détail', 'Et après'];
// Du texte avec du gras : « **Mot clé** : la suite » → des nœuds.
function enGras(t) {
  return String(t == null ? '' : t).split(/(\*\*.+?\*\*)/).filter(Boolean)
    .map((m) => (/^\*\*.+\*\*$/.test(m) ? h('strong', { text: m.slice(2, -2) }) : m));
}
// Le détail repliable : <details><summary>Pourquoi</summary> un paragraphe par ligne </details>.
function pourquoi(texte, titre) {
  const lignes = [].concat(texte == null ? [] : texte).map(String).filter((l) => l.trim());
  if (!lignes.length) return null;
  const maj = (l) => l.charAt(0).toUpperCase() + l.slice(1);   // « Pourquoi : c'est… » → sous « Pourquoi », « C'est… »
  return h('details', { cls: 'salle-pourquoi' }, h('summary', { text: titre || 'Pourquoi' }), lignes.map((l) => h('p', null, enGras(maj(l.trim())))));
}
// La partie visible d'un texte de L (avant le premier « \n ») et ses détails, un par « \n » :
// { tete, plis: [{ titre, suite }] } (un détail sans titre connu s'appelle « Pourquoi »).
function decouper(t) {
  const [tete, ...reste] = String(t == null ? '' : t).split('\n');
  const titre = new RegExp(`^(${TITRES_REPLIABLES.join('|')})\\s*:\\s*`);
  const plis = reste.map((x) => x.trim()).filter(Boolean).map((x) => {
    const m = titre.exec(x);
    return m ? { titre: m[1], suite: x.slice(m[0].length) } : { titre: 'Pourquoi', suite: x };
  });
  // 2.9.0 (demande du 15/11 : le pourquoi n'a pas à être affiché) : un « Pourquoi » ne s'affiche plus ; il reste dans le code.
  return { tete, plis: plis.filter((x) => x.titre !== 'Pourquoi') };
}
// Les détails repliables d'un texte de L (rien s'il n'en a pas).
function replis(t) {
  return decouper(t).plis.map((x) => pourquoi(x.suite, x.titre));
}
// Un texte de L à l'écran : la première ligne dans <tag class=cls>, les détails repliés dessous (alors dans un <div>).
// o.icone : l'icône de la ligne visible.
function texteCourt(t, cls, tag, o) {
  const d = decouper(t);
  const props = {};
  if (cls) props.cls = cls;
  if (o && o.icone) props.icone = o.icone;
  const ligne = h(tag || 'p', props, enGras(d.tete));
  if (!d.plis.length) return ligne;
  return h('div', { cls: 'salle-court' }, ligne, replis(t));
}
// « 2 séries légères », « 1 série légère » : les séries d'échauffement d'avant la série 1 (les « approches » du code).
function seriesLegeres(n) {
  return n > 1 ? `${n} séries légères` : '1 série légère';
}
// 2 ou 3 puces d'une ligne, le mot clé en gras (« **Poids** : le dimanche matin, à jeun »).
function puces(lignes, cls) {
  return h('ul', { cls: 'salle-puces' + (cls ? ' ' + cls : '') }, [].concat(lignes).filter(Boolean).map((l) => h('li', null, enGras(l))));
}
// Une ligne « début + noms » (« 6 séries · 80 min · Presse à cuisses, … ») ; trop longue : « début + 3 exercices », et les
// noms repliés dessous (« Lesquels »).
function ligneOuListe(debut, noms) {
  const t = debut + noms.join(', ');
  if (t.length <= L.LIGNE_MAX || noms.length < 2) return h('p', { cls: 'salle-petit', text: t });
  return h('div', { cls: 'salle-court salle-petit' }, h('p', { text: debut + pluriel(noms.length, 'exercice') }), pourquoi(noms.join(', ') + '.', 'Lesquels'));
}
// « Ton bilan : … » (L.resumeBilan) en une ligne ; plus long (douleur et courbatures), replié sous « Ton bilan ».
function ligneBilan(b, cls) {
  const t = L.resumeBilan(b), c = 'salle-petit' + (cls ? ' ' + cls : '');
  return ('Ton bilan : ' + t).length <= L.LIGNE_MAX ? h('p', { cls: c, text: 'Ton bilan : ' + t }) : h('div', { cls: c }, pourquoi(t, 'Ton bilan'));
}
// Des puces, puis les lignes « Pourquoi : … » (ou « Comment : … ») repliées dessous. Une seule puce : un paragraphe.
function texteListe(lignes) {
  const l = [].concat(lignes).filter(Boolean).map(String);
  const plis = l.filter((x) => new RegExp(`^(${TITRES_REPLIABLES.join('|')})\\s*:`).test(x));
  const vues = l.filter((x) => plis.indexOf(x) < 0);
  return h('div', { cls: 'salle-court' }, vues.length === 1 ? h('p', null, enGras(vues[0])) : puces(vues), plis.flatMap((x) => replis('\n' + x)));
}

// ── Les paliers et la photo (Progrès, l'accueil, Mesures, les premières questions) ──
// L'échelle des paliers (L.paliersCorps) : un point par palier (coche = fait, rond plein = ici, cercle = à venir), le titre,
// puis « fait », « tu es ici » ou les XP où il commence (« 10 000 XP »). enLigne : que des <span> (dans le bouton de l'accueil).
function echellePaliers(corps, enLigne) {
  const [liste, point] = enLigne ? ['span', 'span'] : ['ol', 'li'];
  return h(liste, { cls: 'salle-echelle', 'aria-label': 'Les paliers' }, corps.map((c) => {
    const etat = c.etat === 'fait' ? 'passe' : c.etat;
    const quand = c.etat === 'avenir' ? `${L.fmtMilliers(c.a)} XP` : etat === 'ici' ? 'tu es ici' : 'fait';
    return h(point, { cls: 'salle-echelle-palier salle-echelle-' + etat, 'aria-current': etat === 'ici' ? 'step' : null,
      'aria-label': `${c.titre}, ${c.a ? `à ${L.fmtMilliers(c.a)} XP` : 'au départ'}${etat === 'ici' ? ' : tu es ici' : etat === 'passe' ? ' : atteint' : ` : encore ${L.fmtMilliers(c.reste)} XP`}` },
    h('span', { cls: 'salle-echelle-point', 'aria-hidden': 'true' }, etat === 'passe' ? (icone('valider') || '✓') : ''),
    h('span', { cls: 'salle-echelle-titre', text: c.titre }),
    h('span', { cls: 'salle-echelle-niv salle-nombre', text: quand }));
  }));
}
// La photo choisie (un File) → un ArrayBuffer en JPEG, réduite à 1 600 px de côté (moins lourde pour iCloud) ; sans canvas
// ou si l'image ne se lit pas : le fichier tel quel s'il est déjà en JPEG, sinon null.
function lireOctets(f) {
  return typeof f.arrayBuffer === 'function' ? f.arrayBuffer() : new Promise((ok, ko) => {
    const lecteur = new FileReader();
    lecteur.onload = () => ok(lecteur.result);
    lecteur.onerror = ko;
    lecteur.readAsArrayBuffer(f);
  });
}
async function photoEnJpeg(f) {
  try {
    const url = URL.createObjectURL(f);
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    try { URL.revokeObjectURL(url); } catch (e) { /* rien */ }
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
    if (blob) return await lireOctets(blob);
  } catch (e) { /* le fichier tel quel ci-dessous */ }
  return /jpe?g/i.test(f.type || '') ? lireOctets(f) : null;
}
// Le bouton photo : un <label> qui porte le champ fichier (sur iPhone, il ouvre l'appareil photo). quandOctets(octets) reçoit
// la photo en JPEG ; une photo illisible : un message, rien d'autre.
function champPhoto(texte, principal, quandOctets) {   // l'appareil photo
  return h('label', { cls: 'salle-bouton salle-grand salle-photo-bouton' + (principal ? ' salle-principal' : ''), role: 'button', icone: 'photo' }, h('span', { text: texte }), entreePhoto(quandOctets, 'Cette photo ne se lit pas. Réessaie, ou garde seulement la mesure.'));
}
// Le champ invisible qui ouvre l'appareil photo, puis rend la photo en JPEG à quandOctets ; illisible : le message.
// Il se pose dans un <label> qui fait le bouton (champPhoto, et l'appareil photo de « Manger » sur l'accueil, 2.39.1).
// 2.41.1 : galerie : sans « capture », le téléphone propose ses photos (la photothèque) au lieu d'ouvrir l'appareil photo.
function entreePhoto(quandOctets, message, galerie) {
  return h('input', {
    type: 'file', accept: 'image/*', capture: galerie ? null : true, cls: 'salle-photo-champ',
    onchange: async (ev) => {
      const f = ev && ev.target && ev.target.files && ev.target.files[0];
      if (!f) return;
      let octets = null;
      try { octets = await photoEnJpeg(f); } catch (e) { octets = null; }
      if (!octets) { new obsidian.Notice(message); return; }
      await quandOctets(octets);
    },
  });
}

// ── Les deux images d'un exercice ──
// L'animation d'un exercice (départ et arrivée qui alternent), et en dessous la ligne « Tu dois sentir » de sa fiche.
// Sous « Réduire les animations », l'image reste sur le départ (styles.css).
// 2.38.84 (demande : « remplace carrément, ces nouvelles vidéos sont plus explicites ; garde les anciennes s'il n'y a pas
// de vidéo ») : un exercice qui a une vidéo montre sa vignette (l'image de la vidéo, ▶ dessus) ; un toucher la lit en grand,
// dans l'app (agrandirVideo). Sans vidéo, ou si la vignette ne charge pas (pas de réseau) : ses 2 photos, comme avant.
function animation(plugin, nom) {
  const fiche = plugin.etat.guide[L.norm(nom)];
  const video = fiche ? L.videoDeFiche(fiche.lignes) : null;
  return video && video.id ? vignetteVideo(plugin, nom, video, cleFiche(fiche)) : animationPhotos(plugin, nom);
}
// « Tu dois sentir : … » d'une fiche, sans le gras (sous l'image ou la vidéo), ou ''.
function cleFiche(fiche) {
  const l = fiche && Array.isArray(fiche.lignes) ? fiche.lignes.find((x) => /^\*\*Tu dois sentir/.test(String(x).trim())) : null;
  return l ? l.replace(/\*\*/g, '').trim() : '';
}
function vignetteVideo(plugin, nom, video, cle) {
  const boite = h('div', { cls: 'salle-anim salle-anim-video' });
  // L'image de YouTube est en 4:3 : une vidéo carrée ou haute y a des bandes noires sur les côtés, retirées par un zoom (CSS).
  const [l, ht] = video.format.split(':').map(Number);
  const forme = l < ht ? ' salle-vignette-haute' : l === ht ? ' salle-vignette-carree' : '';
  const img = h('img', { src: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`, alt: 'Vidéo du mouvement', loading: 'lazy', cls: 'salle-anim-vignette' + forme });
  const cadre = h('button', { cls: 'salle-anim-cadre', type: 'button', 'aria-label': 'Voir le mouvement en vidéo' }, img, h('span', { cls: 'salle-anim-lecture' }, icone('video') || '▶'));
  // Pas de réseau : la vignette ne vient pas ; les photos d'avant prennent sa place (mêmes classes, sans « Tu dois sentir »
  // si l'écran l'avait retiré).
  img.addEventListener('error', () => {
    const photos = animationPhotos(plugin, nom);
    // 2.41.13 : plus de photos de secours : sans réseau, une ligne le dit à la place de l'image.
    if (!photos) { img.remove(); cadre.appendChild(h('span', { cls: 'salle-petit salle-anim-sans', text: 'Sans réseau : la vidéo se verra plus tard.' })); return; }
    if (!boite.parentNode || typeof boite.parentNode.replaceChild !== 'function') return;
    photos.className = String(boite.className).replace(/\s*salle-anim-video\b/, '');
    if (typeof boite.querySelector === 'function' && !boite.querySelector('.salle-anim-cle')) { const c = photos.querySelector('.salle-anim-cle'); if (c) c.remove(); }
    boite.parentNode.replaceChild(photos, boite);
  });
  boite.appendChild(cadre);
  if (cle) boite.appendChild(h('div', { cls: 'salle-anim-cle', text: cle }));
  cadre.addEventListener('click', (ev) => { if (ev) { ev.preventDefault(); ev.stopPropagation(); } agrandirVideo(plugin, nom, video, cle); });
  return boite;
}
// La vidéo en grand, par-dessus tout l'écran, lue dans l'app ; « Fermer » ou un toucher à côté la ferme (la vidéo s'arrête).
function agrandirVideo(plugin, nom, video, cle) {
  let voile = null;
  const lieu = document.body;
  const fermer = () => { try { lieu.removeChild(voile); } catch (e) { /* déjà fermée */ } };
  voile = h('div', { cls: 'salle-zoom salle-zoom-video', role: 'dialog', 'aria-label': nom },
    h('div', { cls: 'salle-zoom-boite' },
      h('strong', { text: nom }),
      lecteurVideo(plugin, video, true),   // ouverte d'un toucher : elle démarre tout de suite, sans le son
      cle ? h('div', { cls: 'salle-anim-cle', text: cle }) : null,
      h('button', { cls: 'salle-bouton salle-mini salle-zoom-fermer', type: 'button', text: 'Fermer', icone: 'annuler', onclick: fermer })));
  voile.addEventListener('click', (ev) => { if (!ev || ev.target === voile) fermer(); });
  lieu.appendChild(voile);
}
// Les 2 photos de l'exercice qui alternent (départ, arrivée), « Tu dois sentir » dessous ; un toucher l'agrandit.
function animationPhotos(plugin, nom) {
  const id = IMAGES[L.norm(nom)];
  if (!id) return null;
  const boite = h('div', { cls: 'salle-anim' });
  // Un vrai bouton : sur iPhone, un toucher sur une simple image n'est pas toujours pris en compte.
  const cadre = h('button', { cls: 'salle-anim-cadre', type: 'button', 'aria-label': 'Agrandir l\'image' }, h('span', { cls: 'salle-anim-loupe' }, icone('plein') || '⤢'));
  for (const k of [0, 1]) {
    const img = h('img', { src: plugin.image(id, k), alt: k ? 'Arrivée du mouvement' : 'Départ du mouvement', loading: 'lazy', cls: k ? 'salle-anim-2' : 'salle-anim-1' });
    img.addEventListener('error', () => { boite.style.display = 'none'; });
    cadre.appendChild(img);
  }
  boite.appendChild(cadre);
  const fiche = plugin.etat.guide[L.norm(nom)];
  const cle = fiche && fiche.lignes.find((l) => /^\*\*Tu dois sentir/.test(l.trim()));
  const texteCle = cle ? cle.replace(/\*\*/g, '').trim() : '';
  if (cle) boite.appendChild(h('div', { cls: 'salle-anim-cle', text: texteCle }));
  cadre.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); agrandir(plugin, id, nom, texteCle); });
  return boite;
}
// L'animation en grand, par-dessus tout l'écran. Un toucher n'importe où la referme.
function agrandir(plugin, id, nom, cle) {
  const voile = h('div', { cls: 'salle-zoom', role: 'dialog', 'aria-label': nom },
    h('div', { cls: 'salle-zoom-boite' },
      h('strong', { text: nom }),
      h('div', { cls: 'salle-anim-cadre' }, [0, 1].map((k) => h('img', { src: plugin.image(id, k), alt: '', cls: k ? 'salle-anim-2' : 'salle-anim-1' }))),
      cle ? h('div', { cls: 'salle-anim-cle', text: cle }) : null,
      h('div', { cls: 'salle-petit', text: 'Toucher pour fermer' })));
  voile.addEventListener('click', () => { if (voile.parentNode) voile.parentNode.removeChild(voile); });
  document.body.appendChild(voile);
}

// ── La courbe ──
// points : des nombres, ou des { date, y, record? } (L.pointsCourbe, les mesures). opts = { unite: 'kg' | 'rép.' | 's' | 'cm', label }.
// Rend une boîte : le dessin (role="img", aria-label) et, dessous, la première valeur, le maximum et la dernière, avec
// leur date. Moins de 2 points : null (l'écran dit « la courbe arrive à la prochaine séance »).
// Lisible (recherche « interfaces », Des courbes lisibles) : l'axe suit les vraies dates (un trou de 2 semaines se voit) ;
// la hauteur couvre au moins 20 % de la plus grande valeur, donc 49 → 47,5 ne ressemble pas à une chute ; un point par
// séance, en or les jours de record ; un trait épais, un dégradé dessous.
let courbesDessinees = 0;   // un identifiant unique par dégradé : plusieurs courbes sur le même écran
function courbe(points, opts) {
  const o = opts || {};
  const pts = (Array.isArray(points) ? points : [])
    .map((p) => (typeof p === 'number' ? { y: p } : Object.assign({}, p)))
    .filter((p) => typeof p.y === 'number' && isFinite(p.y));
  if (pts.length < 2) return null;
  const unite = o.unite || pts[pts.length - 1].unite || '';
  const val = (y) => L.fmt(y) + (unite ? ' ' + unite : '');
  const datees = pts.every((p) => L.deISO(p.date));
  const jours = datees ? L.joursEntre(pts[0].date, pts[pts.length - 1].date) : 0;
  const ys = pts.map((p) => p.y);
  const mn = Math.min(...ys), mx = Math.max(...ys);
  const plage = Math.max(mx - mn, Math.abs(mx) * 0.2, 1);
  const centre = (mn + mx) / 2, bas = centre - plage * 0.6, haut = centre + plage * 0.6;
  const W = 300, H = 90, MX = 8, MY = 12;
  const xDe = (p, k) => MX + (W - 2 * MX) * (jours > 0 ? L.joursEntre(pts[0].date, p.date) / jours : k / (pts.length - 1));
  const yDe = (y) => MY + (H - 2 * MY) * (1 - (y - bas) / (haut - bas));
  const premier = pts[0], dernier = pts[pts.length - 1];
  const quand = (p) => (datees ? ' · ' + L.dateCourte(p.date) : '');
  const label = o.label || `${val(premier.y)}${quand(premier)} → ${val(dernier.y)}${quand(dernier)}, ${pts.length} points`;
  const boite = h('div', { cls: 'salle-courbe-boite' });
  if (typeof document.createElementNS === 'function') {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = (tag, attrs) => { const el = document.createElementNS(ns, tag); Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k])); return el; };
    const dessin = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'salle-courbe', role: 'img', 'aria-label': label });
    const xy = pts.map((p, k) => [xDe(p, k), yDe(p.y)]);
    const trace = xy.map((c) => c.map((v) => v.toFixed(1)).join(','));
    const id = `salle-degrade-${++courbesDessinees}`;
    const defs = svg('defs', {}), degrade = svg('linearGradient', { id, x1: '0', y1: '0', x2: '0', y2: '1' });
    degrade.appendChild(svg('stop', { offset: '0', class: 'salle-courbe-degrade-haut' }));
    degrade.appendChild(svg('stop', { offset: '1', class: 'salle-courbe-degrade-bas' }));
    defs.appendChild(degrade);
    dessin.appendChild(defs);
    dessin.appendChild(svg('path', { d: `M${xy[0][0].toFixed(1)},${H} L${trace.join(' L')} L${xy[xy.length - 1][0].toFixed(1)},${H} Z`, fill: `url(#${id})`, class: 'salle-courbe-aire' }));
    dessin.appendChild(svg('line', { x1: MX, x2: W - MX, y1: yDe(mx).toFixed(1), y2: yDe(mx).toFixed(1), class: 'salle-courbe-repere' }));
    dessin.appendChild(svg('polyline', { points: trace.join(' '), class: 'salle-courbe-ligne' }));
    pts.forEach((p, k) => {
      const cls = 'salle-courbe-point' + (p.record ? ' salle-courbe-record' : '') + (k === pts.length - 1 ? ' salle-courbe-fin' : '');
      dessin.appendChild(svg('circle', { cx: xy[k][0].toFixed(1), cy: xy[k][1].toFixed(1), r: k === pts.length - 1 ? 5.5 : p.record ? 4.5 : 3.5, class: cls }));
    });
    boite.appendChild(dessin);
  }
  // Sous le dessin : la première valeur, le plus bas et le plus haut s'ils sont ailleurs qu'aux deux bouts, la dernière.
  const borne = (cls, texte) => h('span', { cls, text: texte });
  boite.appendChild(h('div', { cls: 'salle-courbe-bornes salle-petit' },
    borne('salle-courbe-premiere', `${val(premier.y)}${quand(premier)}`),
    mn < premier.y && mn < dernier.y ? borne('salle-courbe-min', `min ${val(mn)}`) : null,
    mx > premier.y && mx > dernier.y ? borne('salle-courbe-max', `max ${val(mx)}`) : null,
    borne('salle-courbe-derniere salle-nombre', `${val(dernier.y)}${quand(dernier)}`)));
  return boite;
}

// ── La barre du niveau (accueil, bilan de fin, Progrès) ──
// Ronde et lime (L.niveau). part : 0 à 1 dans le niveau.
// o.depart : la part d'où elle part, pour la voir avancer (bilan de fin ; la transition CSS fait le mouvement, rien si
// l'appareil demande moins de mouvement) ; sans requestAnimationFrame (tests) : directement à sa place. o.muette : sans
// rôle (dans un bouton, le texte à côté dit déjà tout) ; sinon role="progressbar" avec o.label.
function barreNiveau(part, o) {
  o = o || {};
  const borne = (v) => Math.min(1, Math.max(0, typeof v === 'number' && isFinite(v) ? v : 0));
  const pc = (v) => `${Math.round(borne(v) * 1000) / 10}%`;
  const plein = h('span', { cls: 'salle-niveau-plein' });
  const barre = h('span', o.muette ? { cls: 'salle-niveau-barre', 'aria-hidden': 'true' }
    : { cls: 'salle-niveau-barre', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(borne(part) * 100)), 'aria-label': o.label || 'Niveau' }, plein);
  const bouge = o.depart != null && borne(o.depart) !== borne(part) && typeof requestAnimationFrame === 'function';
  plein.style.width = pc(bouge ? o.depart : part);
  if (bouge) {
    try { requestAnimationFrame(() => requestAnimationFrame(() => { plein.style.width = pc(part); })); } catch (e) { plein.style.width = pc(part); }
  }
  return barre;
}

// ── Partagés par plusieurs écrans ──
// Les réglages complets (valeurs d'origine pour les clés absentes ; les tableaux ne sont pas ceux du défaut).
// Les réglages pour la séance du jour : ceux de l'utilisateur, avec la durée du bilan quand il a répondu « Peu de temps »
// (2.38.91 : la séance passe à sa version 45 min : superséries, toutes les séries gardées, pas de cardio de fin [20, 36]).
function reglagesDuJour(plugin, bilan) {
  const r = reglagesVue(plugin);
  return bilan && bilan.temps > 0 && bilan.temps < r.duree ? Object.assign({}, r, { duree: bilan.temps }) : r;
}
function reglagesVue(plugin) {
  const lu = (plugin && plugin.donnees && plugin.donnees.reglages) || {};
  return L.fusionReglages(lu) || Object.assign({}, REGLAGES_DEFAUT);
  return Object.assign({}, REGLAGES_DEFAUT, lu);
}
// ●●○ : les séances de la semaine face à l'objectif, avec « 2 sur 3 » écrit (la couleur n'est jamais seule).
// sansRonds : le texte seul (l'accueil a déjà la bande des 7 jours).
function rondsSemaine(faites, objectif, sansRonds) {
  const ronds = [];
  if (!sansRonds) for (let i = 0; i < Math.max(objectif, faites); i++) ronds.push(h('span', { cls: 'salle-rond' + (i < faites ? ' salle-plein' : '') }));
  return h('div', { cls: 'salle-ronds', 'aria-label': `${faites} séance${faites > 1 ? 's' : ''} sur ${objectif} cette semaine` }, ronds, h('span', { cls: 'salle-nombre', text: `${faites} sur ${objectif}` }));
}
// La lettre d'une séance pour la bande de la semaine : « Séance A » → « A » ; sinon la première lettre.
function lettreSeance(nom) {
  const mots = String(nom || '').trim().split(/\s+/);
  const fin = mots[mots.length - 1] || '';
  return fin.length <= 2 ? fin.toUpperCase() : (mots[0] || '?').charAt(0).toUpperCase();
}
// Une erreur dans la console d'Obsidian (« Salle : … ») ; sans console (tests), rien.
function signalerErreur(e) {
  try { console.error('Salle :', e); } catch (x) { /* pas de console (tests) */ }
}
// « Recréer la note du programme » (accueil, Réglages → Appli) : quand la note manque ou est illisible.
function boutonRecreerProgramme(plugin) {
  return h('button', { cls: 'salle-bouton', text: 'Recréer la note du programme', icone: 'recreer', onclick: () => plugin.recreerProgramme() });
}
// « Toucher encore pour confirmer » : le second toucher compte pendant ce délai.
const DELAI_CONFIRMER_MS = 6000;
// Vrai si le premier toucher (son horodatage t, en ms ; 0 ou absent : pas de toucher) date de moins de DELAI_CONFIRMER_MS.
function confirmeRecent(t) {
  return !!t && Date.now() - t < DELAI_CONFIRMER_MS;
}
// « 1 exercice », « 3 exercices » (L.pluriel, sous un nom court pour les écrans).
function pluriel(n, mot) {
  return L.pluriel(n, mot);
}

// ── Rien ne bloque : une consigne verte, une partie d'écran sûre, un appel prudent, plus tard ──
// Une consigne verte, toujours affichée (VueSalle.consigne), ou rien si la vue ne sait pas le faire.
function consigneVerte(vue, texte) {
  return vue && typeof vue.consigne === 'function' ? vue.consigne(texte) : null;
}
// Une partie d'écran qui ne doit rien bloquer : si son calcul échoue (note abîmée, donnée inattendue), une petite carte le
// dit et le reste de l'écran s'affiche quand même. fabriquer() rend un élément, ou null pour ne rien ajouter.
function partieSure(r, fabriquer) {
  try {
    const el = fabriquer();
    if (el) r.appendChild(el);
  } catch (e) {
    r.appendChild(h('div', { cls: 'salle-carte salle-alerte' }, h('p', { text: 'Cette partie n\'a pas pu s\'afficher : ' + String((e && e.message) || e) })));
    signalerErreur(e);
  }
}
// Appelle une méthode du plugin seulement si elle existe : un plugin plus ancien, ou les tests, ne cassent rien.
// L'appel est direct (pas de await ici) : preparerSon doit tourner pendant le toucher, sinon iOS refuse le son.
function appelPlugin(plugin, nom, ...args) {
  if (!plugin || typeof plugin[nom] !== 'function') return undefined;
  return plugin[nom](...args);
}
// Plus tard, si l'appareil a un minuteur ; sinon tout de suite (tests).
function plusTard(fn, ms) {
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') return window.setTimeout(fn, ms);
  fn();
  return 0;
}
