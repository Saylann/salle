// Le faux DOM des tests d'écran (pas de navigateur), chargé par tests/rendu.js avant les fichiers r*.js (ne pas lancer seul).
// Ici : un DOM minimal (El, document, window, navigator), un faux Obsidian, tests/base.js (main.js, PROGRAMME_115, les
// compteurs), et les aides :
//   ok(x, nom), vrai(x, nom), egal(obtenu, attendu, nom)   une vérification
//   rendu(nom, async () => { … })                          un test d'écran, lancé par tests/rendu.js juste après son fichier
//   simulerDate('2026-11-16T18:00:00') / simulerDate(null) l'heure du test (rendu.js remet la vraie après chaque fichier)
//   fauxPlugin({ etat, donnees }), nouvelleVue(plugin)      un plugin et une vue VueSalle prêts à rendre
//   outilsEcran(v) → { r, boutons, bouton, toucher, erreur } toucher('texte') clique le premier bouton qui contient ce texte
var module = { exports: {} };
class El {
  constructor(tag) { this.tagName = tag; this.childNodes = []; this.attrs = {}; this.ev = {}; this.style = {}; this.className = ''; this._t = ''; this.scrollTop = 0;
    const self = this; this.classList = { add(c) { self.className += ' ' + c; }, contains(c) { return self.className.split(' ').indexOf(c) >= 0; }, remove(c) { self.className = self.className.split(' ').filter((x) => x && x !== c).join(' '); } }; }
  set textContent(t) { this._t = String(t); this.childNodes = []; }
  get textContent() { return this._t + this.childNodes.map((c) => c.textContent).filter((x) => x !== '').join(' '); }   // un élément vide n'ajoute rien
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get nextSibling() { const p = this.parent; if (!p) return null; const i = p.childNodes.indexOf(this); return i >= 0 ? p.childNodes[i + 1] || null : null; }
  // Comme un vrai navigateur : seul un nœud s'ajoute (2.10.0 : un tableau passé par erreur plantait dans Obsidian, pas ici).
  appendChild(c) { if (!c || typeof c !== 'object' || Array.isArray(c)) throw new TypeError('appendChild : ce n\'est pas un nœud'); c.parent = this; this.childNodes.push(c); return c; }
  insertBefore(c, ref) { const i = this.childNodes.indexOf(ref); if (c.parent) c.parent.removeChild(c); c.parent = this; this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, c); return c; }
  removeChild(c) { const i = this.childNodes.indexOf(c); if (i >= 0) this.childNodes.splice(i, 1); return c; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, f) { (this.ev[k] = this.ev[k] || []).push(f); }
  querySelector() { return null; }
  tous(f, out) { out = out || []; if (f(this)) out.push(this); this.childNodes.forEach((c) => c.tous && c.tous(f, out)); return out; }
}
var document = { createElement: (t) => new El(t), createTextNode: (t) => ({ textContent: t }), body: new El('body') };
var window = { setInterval: () => 1, clearInterval: () => {} };
var navigator = {};
var avis = [];
function require() { return { Plugin: class {}, ItemView: class { constructor() { this.contentEl = new El('div'); } async setState() {} }, Notice: class { constructor(t) { avis.push(t); } } }; }
load(DOSSIER_TESTS + '/base.js');   // main.js, PROGRAMME_115, total, echecs, ok, egal, vrai
var SP = module.exports;

// Les tests d'écran d'un fichier : rendu.js les lance dans l'ordre, après le chargement du fichier, puis vide la liste.
var RENDUS = [];
function rendu(nom, fn) { RENDUS.push({ nom, fn }); }

// L'heure du test : sans elle, un test qui dépend du jour (séance ou repos) change selon le jour où on le lance.
var DateVraie = Date;
function simulerDate(iso) {
  if (!iso) { Date = DateVraie; return; }
  const decalage = new DateVraie(iso).getTime() - DateVraie.now();
  function DateSimulee(...a) { return a.length ? new DateVraie(...a) : new DateVraie(DateVraie.now() + decalage); }
  DateSimulee.prototype = DateVraie.prototype;
  DateSimulee.now = () => DateVraie.now() + decalage;
  DateSimulee.UTC = DateVraie.UTC;
  DateSimulee.parse = DateVraie.parse;
  Date = DateSimulee;
}

// Un plugin minimal : le programme d'origine, aucune séance, les réglages d'un débutant. ecrit = les notes « écrites ».
function fauxPlugin(o) {
  o = o || {};
  const ecrit = [];
  return {
    ecrit,
    etat: Object.assign({ programme: L.lireProgramme(SP.PROGRAMME_DEFAUT), seances: [], forme: [], guide: {}, fichiers: {}, mesures: [] }, o.etat || {}),
    donnees: Object.assign({ reglages: { niveau: 'un peu', parSemaine: 3, duree: 60 }, enCours: null }, o.donnees || {}),
    async sauver() {},
    async noterForme(b) { ecrit.push(L.ligneForme(b)); this.etat.forme = this.etat.forme.concat(L.lireForme(L.ligneForme(b))); },
    async enregistrerSeance(s) { ecrit.push(L.ecrireSeance(s)); return { path: 'x.md' }; },
    async recharger() {}, async ouvrirNote() {}, async ouvrirChemin() {}, async supprimerSeance() {}, async recreerProgramme() {},
    async noterRessenti() {}, async ajouterMesure() {},
    majBarre() {}, cacherBarre() {}, mobile() { return true; }, image() { return ''; }, chronoIphone() {},
    // 2.0.0 (assemblage) : ce que le vrai SallePlugin fournit aux écrans (lot D), en version d'un appareil neuf, sans son
    // ni vibration (comme un Mac) : pas encore testé (peut → null), aucune consigne déjà vue. r63 et aides-ecrans.js les remplacent
    // par leurs propres versions quand ils veulent compter les appels.
    vus: new Set(),
    peut() { return null; }, dejaVu(cle) { return this.vus.has(cle); }, marquerVu(cle) { this.vus.add(cle); },
    preparerSon() {}, bip() { return false; }, vibreur() { return null; },
    async basculerPause(lundi, malade) { const r = this.donnees.reglages; r.pauses = L.basculerDate(r.pauses || [], lundi); r.malade = L.basculerDate(r.malade || [], lundi, r.pauses.indexOf(lundi) >= 0 && !!malade); },
    async choisirSemaineLegere(lundi, oui) { const r = this.donnees.reglages; if (oui) r.semainesLegeres = (r.semainesLegeres || []).concat([lundi]); else r.legereRefus = lundi; },
    async cocherRecup(lundi, oui) { const r = this.donnees.reglages, l = (r.recup || []).filter((x) => x !== lundi); r.recup = oui ? l.concat([lundi]) : l; },
  };
}
function nouvelleVue(plugin) { const v = new VueSalle(null, plugin); v.plugin = plugin; return v; }
function outilsEcran(v) {
  const r = () => v.contentEl;
  const boutons = () => r().tous((e) => e.tagName === 'button');
  const bouton = (t) => boutons().find((b) => b.textContent.indexOf(t) >= 0);
  const toucher = async (t) => { const b = bouton(t); ok(b, 'bouton « ' + t + ' » présent'); if (b) for (const f of b.ev.click || []) await f(); };
  const erreur = () => r().textContent.indexOf('Le plugin a rencontré une erreur') >= 0;
  return { r, boutons, bouton, toucher, erreur };
}
