// Ce que les deux lanceurs (tests/lancer.js, tests/rendu.js) ont en commun : vérifier que main.js est là, lancer un fichier
// isolé dans un bloc, dire où une erreur est née, puis le bilan. Chargé par les lanceurs (ne pas lancer seul).

// Les arguments du lanceur, donnés par installer.sh : jsc tests/lancer.js -- <dossier des données> <dossier fabriqué>.
// jsc les lit octet par octet : un accent (« Données ») arrive abîmé, on le remet en UTF-8.
const ARGS_TESTS = (typeof arguments === 'object' && arguments ? Array.prototype.slice.call(arguments) : [])
  .map((a) => { try { return decodeURIComponent(escape(a)); } catch (e) { return a; } });
const FABRIQUE = ARGS_TESTS[1] || '.';   // où outils/construire.py a écrit main.js et styles.css

// main.js et l'aide du lanceur doivent exister : sinon, la consigne pour les fabriquer.
function verifierPresents(fichiers) {
  for (const f of fichiers) {
    try { readFile(f); } catch (e) {
      throw new Error(`${f} introuvable : lance « sh atelier/installer.sh » (il fabrique main.js dans un dossier temporaire, puis lance les tests).`);
    }
  }
}

// Où une erreur est née : la ligne du fichier de test, ou le fichier de src/ si elle vient de main.js.
let lignesMain = null;
function ouErreur(e, chemin) {
  if (!e || !e.line) return '';
  if (!e.sourceURL) return ` (${chemin}, ligne ${e.line})`;
  if (/(^|\/)main\.js$/.test(e.sourceURL)) {
    lignesMain = lignesMain || readFile(FABRIQUE + '/main.js').split('\n');
    for (let n = e.line - 1; n >= 0; n--) {
      const m = /^\/\/ ── (src\/\S+) ──$/.exec(lignesMain[n]);
      if (m) return ` (main.js, ligne ${e.line} : ${m[1]}, ligne ${e.line - n - 1})`;
    }
  }
  return ` (${e.sourceURL}, ligne ${e.line})`;
}

// Le fichier, dans un bloc { … } : ses const, let et class restent chez lui. Les numéros de ligne restent ceux du fichier.
function executerFichier(chemin) {
  let texte;
  try { texte = readFile(chemin); } catch (e) { throw { message: 'fichier absent' }; }
  try { checkSyntax(chemin); } catch (e) { throw { message: `faute de syntaxe, ligne ${e.line} : ${e.message}` }; }
  (0, eval)('{' + texte + '\n}');
}

// Le bilan : une ligne par fichier, le total. Un échec : une exception (dans ce jsc, quit(3) sort avec 0 : seule une exception
// non rattrapée donne un code de sortie non nul).
function bilanFinal(detail, reussis, quoi, enEchec) {
  if (detail.length > 1) print(detail.join(' · '));
  print(`${total - echecs}/${total} ${reussis}`);
  if (echecs) throw new Error(`${echecs} ${quoi}${echecs > 1 ? 's' : ''} ${enEchec} (code de sortie 3)`);
}
