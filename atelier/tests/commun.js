// Outils communs des tests de logique, chargés par tests/lancer.js avant les fichiers t*.js (ne pas lancer seul).
// Ici : un faux Obsidian minimal, puis tests/base.js (main.js, PROGRAMME_115, les compteurs, egal, vrai), avertir et lireNote.
var module = { exports: {} };
var window = {};
function require() { return { Plugin: class {}, ItemView: class {}, Notice: class {} }; }
load(DOSSIER_TESTS + '/base.js');   // main.js, PROGRAMME_115, total, echecs, ok, egal, vrai
// Les notes du coffre sont à demande : il peut les modifier. Un écart est signalé, sans faire échouer les tests.
function avertir(ok, message) { if (!ok) print('⚠︎ ' + message); }
// Une note du coffre (chemin depuis le dossier du plugin), ou null si elle n'existe pas.
// Les notes de l'utilisateur : le chemin de son dossier de données arrive en argument (jsc tests/lancer.js -- <coffre>,
// donné par installer.sh : python3 commun.py --donnees). « ../../X » = une note de ce dossier.
// Sans argument : ces notes sont introuvables (null), les modèles et le code se lisent quand même.
const COFFRE_TESTS = ARGS_TESTS[0] || null;   // ARGS_TESTS : tests/executer.js
function lireNote(chemin) {
  let c = chemin;
  if (/^\.\.\/\.\.\//.test(c)) {
    if (!COFFRE_TESTS) return null;
    c = c.replace(/^\.\.\/\.\.\//, COFFRE_TESTS + '/');
  }
  try { return readFile(c); } catch (e) { return null; }
}
