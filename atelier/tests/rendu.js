// Lance tous les tests d'écran du plugin « Salle » (faux DOM, pas de navigateur). Depuis le dossier du plugin, après « python3 construire.py » :
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/rendu.js
// Charge tests/dom-factice.js (DOM, main.js, ok, egal, rendu, simulerDate, fauxPlugin, outilsEcran), tests/aides-ecrans.js
// et tests/executer.js, puis chaque fichier de la liste, isolé dans un bloc ; juste après un fichier, ses tests
// rendu(nom, async () => …) tournent dans l'ordre, puis l'heure vraie revient. Un fichier vide ne compte rien ; un fichier
// ou un test qui plante compte un échec, les suivants tournent.
// Affiche « N/N vérifications d'écran réussies » ; code de sortie 3 s'il y a un échec.
// Lancé depuis le dossier du plugin (les chemins « src/ », « commun/ », « objectifs/ » en partent). Le dossier des tests
// lui-même arrive en 3e argument (atelier/installer.sh) : l'atelier est à côté du plugin, pas dedans.
const DOSSIER_TESTS = (typeof arguments === 'object' && arguments && arguments[2]) || 'atelier/tests';
load(DOSSIER_TESTS + '/executer.js');
(function () {
  const FICHIERS = ['r00-divers.js', 'r42-paliers.js', 'r60-ecrans.js', 'r61-accueil.js', 'r62-avant.js', 'r63-seance.js',
    'r64-bilan.js', 'r65-progres.js', 'r66-notes.js', 'r67-reglages.js', 'r90-plugin.js', 'r99-textes-courts.js'];
  verifierPresents([FABRIQUE + '/main.js', DOSSIER_TESTS + '/dom-factice.js']);
  load(DOSSIER_TESTS + '/dom-factice.js');
  load(DOSSIER_TESTS + '/aides-ecrans.js');
  load(DOSSIER_TESTS + '/textes-courts.js');

  const planter = (chemin, quoi, e) => {
    total++; echecs++;
    print(`ÉCHEC ${chemin}${quoi} : arrêté par une erreur${ouErreur(e, chemin)} : ${e && e.message ? e.message : e}`);
  };
  const detail = [];
  for (const nom of FICHIERS) {
    const chemin = DOSSIER_TESTS + '/' + nom, avant = total, ratesAvant = echecs;
    RENDUS.length = 0;
    try { executerFichier(chemin); } catch (e) { planter(chemin, '', e); }
    const aFaire = RENDUS.splice(0);
    let fini = false;
    (async () => {
      for (const t of aFaire) {
        try { await t.fn(); } catch (e) { planter(chemin, ` « ${t.nom} »`, e); }
      }
      fini = true;
    })();
    drainMicrotasks();
    if (!fini) { total++; echecs++; print(`ÉCHEC ${chemin} : un test attend quelque chose qui n'arrive jamais (une promesse jamais résolue).`); }
    simulerDate(null);
    const n = total - avant, rates = echecs - ratesAvant;
    if (n) detail.push(`${nom} ${n - rates}/${n}`);
  }
  bilanFinal(detail, 'vérifications d\'écran réussies', 'vérification', 'd\'écran en échec');
})();
