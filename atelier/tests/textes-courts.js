// 2.5.1 : des textes courts (l'utilisateur lit sur iPhone, 375 px : « tu continues à me faire des longs paragraphes »).
// Chargé par tests/rendu.js après tests/aides-ecrans.js (ne pas lancer seul). Chaque dessin d'un écran (VueSalle.rendre,
// consigne) est relu ici : un bloc de texte visible de plus de LIGNES_MAX caractères (environ 2 lignes à 375 px) qui n'est
// pas dans un détail repliable (<details>, « Pourquoi ») est noté dans TEXTES_LONGS. r99-textes-courts.js échoue s'il y en a.
// Hors compte : le texte des notes de l'utilisateur (guide, programme : classe salle-texte, ligne « Tu dois sentir » de sa fiche).
// Le même contrôle sur les sources : t99-textes-courts.js (tests/lancer.js).

const LIGNES_MAX = 90;
// Les éléments qui commencent une ligne à l'écran ; les autres (strong, span, code, a…) sont dans la ligne de leur parent.
const BLOCS_TEXTE = ['p', 'div', 'li', 'ul', 'ol', 'button', 'label', 'summary', 'details', 'h1', 'h2', 'h3', 'h4', 'td', 'th', 'section', 'select', 'option'];
// Les classes que styles.css montre en bloc (display: block, flex ou grid, sur le dernier élément du sélecteur) : un span de
// cette classe est sa propre ligne.
const CLASSES_BLOC = (function () {
  const css = readFile(FABRIQUE + '/styles.css').replace(/\/\*[\s\S]*?\*\//g, ''), out = [];
  const regle = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = regle.exec(css))) {
    if (!/(^|;)\s*display\s*:\s*(block|flex|grid|list-item)\b/.test(m[2])) continue;
    for (const sel of m[1].split(',')) {
      const dernier = sel.trim().split(/[\s>+~]+/).pop() || '';
      for (const c of dernier.match(/\.[\w-]+/g) || []) if (out.indexOf(c.slice(1)) < 0) out.push(c.slice(1));
    }
  }
  return out;
})();
const TEXTES_LONGS = [];

function estBlocTexte(el) {
  if (BLOCS_TEXTE.indexOf(el.tagName) >= 0) return true;
  const c = ' ' + (el.className || '') + ' ';
  return CLASSES_BLOC.some((k) => c.indexOf(' ' + k + ' ') >= 0);
}
// Le texte de la ligne d'un bloc : le sien et celui de ses enfants en ligne (pas celui de ses blocs enfants).
function texteDeLigne(el) {
  let t = el._t || '';
  for (const c of el.childNodes) {
    if (!c.tagName) t += c.textContent;
    else if (!estBlocTexte(c)) t += texteDeLigne(c);
  }
  return t;
}
function horsCompte(el) {
  for (let e = el; e; e = e.parent) {
    if (e.tagName === 'details') return true;
    const c = ' ' + (e.className || '') + ' ';
    if (c.indexOf(' salle-texte ') >= 0 || c.indexOf(' salle-anim-cle ') >= 0) return true;
  }
  return false;
}
// Les blocs trop longs sous racine : [texte, …] (le texte, espaces resserrés).
function textesTropLongs(racine) {
  if (!racine || !racine.tous) return [];
  return racine.tous((el) => estBlocTexte(el) && !horsCompte(el))
    .map((el) => texteDeLigne(el).replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > LIGNES_MAX);
}
function noterTextesLongs(racine, ou) {
  for (const t of textesTropLongs(racine)) {
    if (!TEXTES_LONGS.some((x) => x.texte === t)) TEXTES_LONGS.push({ texte: t, ou });
  }
}

(function () {
  const rendre = VueSalle.prototype.rendre;
  VueSalle.prototype.rendre = function () {
    const x = rendre.apply(this, arguments);
    try { noterTextesLongs(this.contentEl, 'écran ' + this.ecran); } catch (e) { /* le contrôle ne casse jamais un test */ }
    return x;
  };
  const consigne = VueSalle.prototype.consigne;
  VueSalle.prototype.consigne = function () {
    const carte = consigne.apply(this, arguments);
    try { noterTextesLongs(carte, 'consigne'); } catch (e) { /* idem */ }
    return carte;
  };
})();
