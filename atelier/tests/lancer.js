// Lance tous les tests de logique du plugin « Salle ». Depuis le dossier du plugin, après « python3 construire.py » :
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/lancer.js
// Charge tests/commun.js (main.js, egal, vrai, avertir, lireNote, les compteurs) et tests/executer.js, puis chaque fichier de
// la liste, chacun isolé dans un bloc : un nom déclaré dans un fichier (const prog…) ne gêne pas les autres. Un fichier vide
// ne compte rien ; un fichier qui plante compte un échec, et les suivants tournent quand même.
// Affiche « N/N tests réussis ». S'il y a un échec, le code de sortie est 3. Un fichier = le fichier de src/ de même numéro.
// Lancé depuis le dossier du plugin (les chemins « src/ », « commun/ », « objectifs/ » en partent). Le dossier des tests
// lui-même arrive en 3e argument (atelier/installer.sh) : l'atelier est à côté du plugin, pas dedans.
const DOSSIER_TESTS = (typeof arguments === 'object' && arguments && arguments[2]) || 'atelier/tests';
load(DOSSIER_TESTS + '/executer.js');
(function () {
  const FICHIERS = ['t00-divers.js', 't30-seance.js', 't35-charge.js', 't40-progres.js', 't42-niveau.js', 't90-plugin.js', 't95-notes.js', 't96-noms.js', 't99-textes-courts.js'];
  verifierPresents([FABRIQUE + '/main.js', DOSSIER_TESTS + '/commun.js']);
  load(DOSSIER_TESTS + '/commun.js');

  const detail = [];
  for (const nom of FICHIERS) {
    const chemin = DOSSIER_TESTS + '/' + nom, avant = total, ratesAvant = echecs;
    try {
      executerFichier(chemin);
    } catch (e) {
      total++; echecs++;
      print(`ÉCHEC ${chemin} : arrêté par une erreur${ouErreur(e, chemin)} : ${e && e.message ? e.message : e}`);
    }
    const n = total - avant, rates = echecs - ratesAvant;
    if (n) detail.push(`${nom} ${n - rates}/${n}`);
  }
  bilanFinal(detail, 'tests réussis', 'test', 'en échec');
})();
