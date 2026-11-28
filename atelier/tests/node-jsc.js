// Lance un lanceur de tests écrit pour jsc (tests/lancer.js, tests/rendu.js) avec node, là où jsc n'existe pas (GitHub,
// Linux). Les mêmes fonctions que jsc : load, readFile, print, checkSyntax, quit, drainMicrotasks (un contexte vm dont les
// tâches async s'exécutent à la fin de chaque évaluation).
//   node atelier/tests/node-jsc.js atelier/tests/lancer.js -- <données> <dossier fabriqué> <dossier des tests>
// Différence connue avec jsc : l'ordre de certaines tâches async ; un test de t90 (« kcal ») échoue sous node seulement.
const fs = require('fs'), vm = require('vm');
const a = process.argv.slice(2), script = a[0], i = a.indexOf('--'), reste = i >= 0 ? a.slice(i + 1) : [];
const g = { console };
const ctx = vm.createContext(g, { microtaskMode: 'afterEvaluate' });
Object.assign(g, {
  arguments: reste,
  print: (...x) => console.log(x.join(' ')),
  readFile: (f) => fs.readFileSync(f, 'utf8'),
  load: (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }),
  checkSyntax: (f) => { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); },
  quit: (c) => process.exit(c),
  drainMicrotasks: () => vm.runInContext('0', ctx),
  setTimeout, clearTimeout, setInterval, clearInterval,
});
try { g.load(script); } catch (e) { console.log('EXCEPTION', e && e.message); process.exit(3); }
