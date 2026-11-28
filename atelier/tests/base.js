// La base des deux séries de tests, chargée par tests/commun.js et tests/dom-factice.js (ne pas lancer seule), après leur
// faux Obsidian (require, module, window) : main.js, PROGRAMME_115, les compteurs et les vérifications.
load(FABRIQUE + '/main.js');
// load() met L, PROGRAMME_DEFAUT, IMAGES, DEPARTS_PAR_KG, RESERVES, SallePlugin… de main.js à portée directement.
load(DOSSIER_TESTS + '/programme-115.js');   // PROGRAMME_115 : le programme 1.15.0 figé, commun aux tests

var total = 0, echecs = 0;
// Une vérification : vraie, ou un échec signalé par son nom.
function ok(x, nom) { total++; if (!x) { echecs++; print('ÉCHEC ' + nom); } }
// obtenu et attendu comparés en JSON (l'ordre des clés compte).
function egal(obtenu, attendu, nom) {
  const a = JSON.stringify(obtenu), b = JSON.stringify(attendu);
  ok(a === b, a === b ? nom : `${nom}\n  obtenu  : ${a}\n  attendu : ${b}`);
}
function vrai(x, nom) { egal(!!x, true, nom); }
