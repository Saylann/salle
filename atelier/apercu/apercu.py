#!/usr/bin/env python3
"""Fabrique un aperçu du plugin « Salle » pour un navigateur : une seule page, sans serveur.

  python3 atelier/apercu/apercu.py <sortie.html>

La page contient le plugin INSTALLÉ (main.js et styles.css du dossier du plugin dans le coffre : lance d'abord
« sh atelier/installer.sh »), un faux Obsidian et une copie des notes du coffre (en mémoire : rien n'est écrit).
À ouvrir avec :  ?cas=neuf      premier lancement (les questions)
                 ?cas=vide      premier lancement dans un coffre sans aucune note (comme chez quelqu'un d'autre)
                 ?cas=habitue   6 séances déjà notées
                 ?cas=encours   une séance en cours
                 ?cas=bilan     « Avant de commencer » (carnet Forme : courbatures hier) ; &resume=1 : « Ta séance d'aujourd'hui »
                 ?cas=diagnostic « Tester cet appareil » (comme habitue, puis l'écran de test)
                 ?cas=paliers   20 séances (palier Régulier), mesures du départ et du palier avec photos (2.2.0)
                 ?cas=palier    17 séances, puis le bilan de la 18e : « Palier : Régulier ! » (2.2.0)
                 ?cas=reel      seulement les vraies notes du coffre, avec les vrais réglages (ceux du data.json du plugin
                                installé, lus à la fabrication : rien de personnel n'est écrit ici) : l'accueil comme sur l'iPhone
Ajouter &mobile=1 (classe is-mobile, et le plugin se croit sur iPhone), &sombre=1 (thème sombre : body.theme-dark, sinon theme-light),
&maintenant=2026-11-16T18:00 (date simulée), &lien=obsidian://salle?ecran=seance (un lien reçu, après le chargement).
Dans la console du navigateur : ouvrirLien('obsidian://salle?ecran=progres') essaie un lien.
Les icônes sont les vraies icônes Lucide (chargées depuis unpkg.com dans la page, lucide@0.460.0) ; sans réseau, un rond
marque la place de chaque icône.
"""
import json
import os
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(ICI))
from coffre import COFFRE, PLUGIN, dossier_installe, hors_atelier, lire, reglages_installes   # noqa: E402


def notes():
    out = {}
    for dossier, sous, fichiers in os.walk(COFFRE):
        sous[:] = hors_atelier(dossier, sous)
        for f in fichiers:
            if f.endswith(".md"):
                chemin = os.path.join(dossier, f)
                out[os.path.relpath(chemin, COFFRE)] = lire(chemin)
    return out


PAGE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aperçu Salle</title>
<style>
:root { --background-primary:#fff; --background-secondary:#f2f3f5; --background-modifier-border:#e0e0e0; --background-modifier-hover:rgba(0,0,0,.06);
  --text-normal:#222; --text-muted:#6b6b6b; --text-on-accent:#fff; --interactive-accent:#7b6cd9; --color-red:#e93147; --color-orange:#ec7500;
  --color-orange-rgb:236,117,0; --color-green:#08b94e; --color-yellow:#e0ac00; --text-faint:#ababab; --text-accent:#7b6cd9;
  --radius-m:8px; --radius-l:12px; --font-ui-small:13px; --font-ui-smaller:12px; --font-ui-medium:15px; --font-ui-large:20px; }
:root[data-theme="dark"] { --background-primary:#1e1e1e; --background-secondary:#262626; --background-modifier-border:#363636;
  --background-modifier-hover:rgba(255,255,255,.07); --text-normal:#dadada; --text-muted:#a3a3a3; --text-faint:#666; --interactive-accent:#8a5cf5; --text-accent:#a68af9; }
body { margin:0; background:var(--background-primary); color:var(--text-normal); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.view-content { height:100vh; overflow:auto; box-sizing:border-box; }
button { font:inherit; padding:6px 12px; border-radius:6px; border:1px solid var(--background-modifier-border); background:var(--background-primary); color:var(--text-normal); }
input { font:inherit; border:1px solid var(--background-modifier-border); background:var(--background-primary); color:var(--text-normal); }
#notices { position:fixed; bottom:8px; left:8px; right:8px; background:#333; color:#fff; padding:6px 10px; border-radius:6px; font-size:13px; z-index:9; }
#notices:empty { display:none; }
__STYLES__
</style></head><body>
<div id="obsidian" class="view-content"></div><div id="notices"></div>
<script>
(function () {
  const m = /[?&]maintenant=([^&]+)/.exec(location.search);
  if (!m) return;
  const decalage = new Date(decodeURIComponent(m[1])).getTime() - Date.now();
  const Vraie = Date;
  function Fausse(...a) { return a.length ? new Vraie(...a) : new Vraie(Vraie.now() + decalage); }
  Fausse.prototype = Vraie.prototype; Fausse.now = () => Vraie.now() + decalage; Fausse.UTC = Vraie.UTC; Fausse.parse = Vraie.parse;
  window.Date = Fausse;
})();
</script>
<!-- 2.1.0 : les vraies icônes Lucide, dans l'aperçu seulement (le plugin garde setIcon d'Obsidian). Sans réseau : des ronds. -->
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<script>__FACTICE__</script>
<script>
if (/sombre=1/.test(location.search)) document.documentElement.dataset.theme = 'dark';
// 2.1.0 : comme Obsidian, la classe du thème sur body (theme-dark ou theme-light) : les couleurs du plugin en dépendent.
document.body.classList.add(/sombre=1/.test(location.search) ? 'theme-dark' : 'theme-light');
if (/mobile=1/.test(location.search)) document.body.classList.add('is-mobile');
var module = { exports: {} };
function require() { return window.obsidianFactice.module; }
</script>
<script>__MAIN__</script>
<script>
(async () => {
  const L = module.exports.L;
  const cas = (/[?&]cas=(\\w+)/.exec(location.search) || [0, 'neuf'])[1];
  const coffre = { notes: __NOTES__, donnees: null };
  // Les notes se reconnaissent à leur en-tête « salle: … », pas à leur nom (donnees/programme.md, l'ancien Programme.md…).
  const cheminEnTete = (t) => Object.keys(coffre.notes).find((k) => /^---/.test(coffre.notes[k]) && coffre.notes[k].split(String.fromCharCode(10)).slice(1, 8).some((l) => l.trim() === 'salle: ' + t)) || null;
  const noteEnTete = (t) => { const k = cheminEnTete(t); return k ? coffre.notes[k] : ''; };
  // Les cas inventés (tout sauf « reel ») rangent leurs notes à la racine et ont leurs propres réglages : le dossier des
  // données du vrai coffre est retiré des chemins, et sa note « Réglages » n'est pas reprise.
  if (cas === 'vide') coffre.notes = {};   // un coffre sans aucune note, comme chez quelqu'un qui installe le plugin
  if (cas !== 'reel') {
    const type = (t) => (/^---\\nsalle: (\\w+)\\n/.exec(t) || [])[1];
    const prog = Object.keys(coffre.notes).find((k) => type(coffre.notes[k]) === 'programme');
    const dossier = prog && prog.indexOf('/') >= 0 ? prog.slice(0, prog.lastIndexOf('/') + 1) : '';
    coffre.notes = Object.fromEntries(Object.entries(coffre.notes).filter(([, t]) => type(t) !== 'reglages')
      .map(([k, t]) => [dossier && k.indexOf(dossier) === 0 ? k.slice(dossier.length) : k, t]));
  }
  if (cas === 'libre' || cas === 'echauffement' || cas === 'bilan') {
    // 1.12.0 : la vraie situation du 13/11 (une séance libre de tirage 4 jours avant), puis la séance qui commence.
    const auj = L.dateISO(new Date());
    const t = (n) => Array.from({ length: 3 }, () => ({ c: n, r: 12 }));
    coffre.notes['Séances/libre.md'] = L.ecrireSeance({ nom: 'Séance libre', date: L.plusJours(auj, -4), exos: [{ nom: 'Tractions', series: [{ c: 0, r: 12 }, { c: 0, r: 12 }, { c: 0, r: 3 }] }, { nom: 'Tirage vertical prise large', series: t(40) }, { nom: 'Rowing à la machine à disques', series: t(40) }, { nom: 'Curl à la barre en Z', series: t(5) }] });
    coffre.donnees = { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [0, 1, 2, 3, 4, 5, 6] }, enCours: null };
    if (cas === 'bilan') {
      const hier = L.plusJours(L.dateISO(new Date()), -1);
      coffre.notes['Forme.md'] = module.exports.FORME_DEFAUT + `- ${hier} · courbatures fortes : bras · douleur qui tire : coude\n`;
      if (/resume=1/.test(location.search)) coffre.donnees.bilan = { date: L.dateISO(new Date()), douleur: { zone: 'coude', type: 'tire' }, courb: { niveau: 'fortes', zones: ['bras'] }, sommeil: 'court' };
    }
    if (cas === 'echauffement') {
      const prog = L.lireProgramme(noteEnTete('programme'));
      const seances = [L.lireSeance(coffre.notes['Séances/libre.md'])];
      // 2.0.0 : comme « Commencer » (lot C) : la séance préparée (ordre, approches, durée, cardio), puis la séance en cours.
      const sj0 = L.seanceDuJour(prog, seances, coffre.donnees.reglages, auj);
      const sj = typeof L.preparerSeance === 'function' ? L.preparerSeance(sj0, { seances, programme: prog, reglages: coffre.donnees.reglages, temps: coffre.donnees.reglages.duree }) : sj0;
      coffre.donnees.enCours = L.nouvelleSeance(sj, auj, Date.now() - 2 * 60000);
      if (/serie=1/.test(location.search)) { coffre.donnees.enCours.exos[0].faites = [{ min: 5 }]; coffre.donnees.enCours.courant = 1; }
      else coffre.donnees.enCours.echauffeFin = Date.now() + 200000;
    }
  } else if (cas === 'paliers' || cas === 'palier') {
    // 2.2.0 : une séance libre tous les 2 jours (20 ou 17), puis, pour « palier », le bilan de la 18e aujourd'hui.
    const auj = L.dateISO(new Date());
    const n = cas === 'palier' ? 17 : 20;
    const libre = (date, k) => ({ nom: 'Séance libre', date, dureeMin: 55, exos: [{ nom: 'Tirage vertical prise large', series: [1, 2, 3].map(() => ({ c: 35 + 2.5 * Math.floor(k / 4), r: 10 })) },
      { nom: 'Presse à cuisses', series: [1, 2, 3].map(() => ({ c: 60 + 5 * Math.floor(k / 4), r: 12 })) }, { nom: 'Élévations latérales aux haltères', series: [1, 2, 3, 4].map(() => ({ c: 4, r: 15 })) }] });
    const debut = L.plusJours(auj, -2 * n - 1);
    Object.keys(coffre.notes).filter((k) => k.indexOf('Séances/') === 0).forEach((k) => { delete coffre.notes[k]; });   // seulement ces séances
    for (let k = 0; k < n; k++) {
      const date = L.plusJours(debut, 2 * k);
      coffre.notes['Séances/' + L.nomFichier(date, 'Séance libre') + '.md'] = L.ecrireSeance(libre(date, k));
    }
    if (cas === 'paliers') {
      const dep = L.plusJours(debut, 1), pal = L.plusJours(debut, 2 * 17 + 1);
      coffre.notes['Mesures.md'] = '---\\nsalle: mesures\\n---\\n# Mesures\\n\\n' + L.ligneMesure({ date: dep, poids: 70, epaules: 110, bras: 30, photo: `Photos/${dep}-palier.jpg` }) + '\\n'
        + L.ligneMesure({ date: pal, poids: 71.2, epaules: 111.5, bras: 31, photo: `Photos/${pal}-palier.jpg` }) + '\\n';
      // Des « photos » pour voir la mise en page : deux images d'exercice du plugin.
      coffre.binaires = { [`Photos/${dep}-palier.jpg`]: 'data:image/jpeg;base64,' + PHOTOS['developpe couche aux halteres-0'], [`Photos/${pal}-palier.jpg`]: 'data:image/jpeg;base64,' + PHOTOS['developpe couche aux halteres-1'] };
    } else {
      coffre.notes['Mesures.md'] = '---\\nsalle: mesures\\n---\\n# Mesures\\n\\n' + L.ligneMesure({ date: L.plusJours(debut, 1), poids: 70, epaules: 110 }) + '\\n';
    }
    coffre.donnees = { reglages: { niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [0, 1, 2, 3, 4, 5, 6] }, enCours: null };
    window.seanceDuBilan = cas === 'palier' ? Object.assign(L.lireSeance(L.ecrireSeance(libre(auj, 17))), { chemin: 'Séances/' + L.nomFichier(auj, 'Séance libre') + '.md' }) : null;
  } else if (cas === 'reel') {
    coffre.donnees = { reglages: __REGLAGES__ || { niveau: 'un peu', parSemaine: 3, duree: 75, poids: 70, jours: [1, 3, 5] }, enCours: null };
  } else if (cas !== 'neuf' && cas !== 'vide') {   // habitue, encours, diagnostic
    const auj = L.dateISO(new Date());
    const prog = L.lireProgramme(noteEnTete('programme'));
    [14, 12, 10, 7, 5, 3].forEach((j, k) => {
      const s = prog[k % 2];
      const exos = s.exos.map((e, n) => ({ nom: e.nom, series: Array.from({ length: e.series }, (_, i) => e.unite === 's'
        ? { s: 30 + 5 * Math.floor(k / 2) - 5 * i }
        : { c: (n % 3 === 0 ? 30 : n % 3 === 1 ? 12 : 6) + e.pas * Math.floor(k / 2), r: Math.max(e.min, e.max - i - (k % 2)) }) }));
      const date = L.plusJours(auj, -j);
      coffre.notes['Séances/' + L.nomFichier(date, s.nom) + '.md'] = L.ecrireSeance({ nom: s.nom, date, dureeMin: 50 + k, exos });
    });
    coffre.notes[cheminEnTete('mesures') || 'Mesures.md'] = (noteEnTete('mesures') || '---\\nsalle: mesures\\n---\\n# Mesures\\n\\n') + L.ligneMesure({ date: L.plusJours(auj, -14), poids: 67.5, epaules: 111 }) + '\\n' + L.ligneMesure({ date: auj, poids: 68.5, epaules: 112 }) + '\\n';
    coffre.donnees = { reglages: { niveau: 'un peu', parSemaine: 3, duree: 60, poids: 68.5 }, enCours: null };
    if (cas === 'encours') {
      const a = L.adapter(prog[0].exos, coffre.donnees.reglages, 6);
      coffre.donnees.enCours = { nom: prog[0].nom, date: auj, debut: Date.now() - 14 * 60000, decouverte: false, courant: 1, reposFin: Date.now() + 75000, echauffe: true,
        exos: a.exos.map((x, i) => Object.assign({}, x, { faites: i === 0 ? [{ c: 37.5, r: 10 }, { c: 37.5, r: 9 }, { c: 37.5, r: 8 }] : i === 1 ? [{ c: 20, r: 11 }] : [] })) };
    }
  }
  const app = window.obsidianFactice.fabriquerApp(coffre, document.getElementById('obsidian'));
  const plugin = new module.exports(app, { id: 'salle', dir: '.obsidian/plugins/salle' });
  await plugin.onload();
  if (plugin.pret) await plugin.pret;   // 2.0.0 : la vue est ouverte (onLayoutReady), on peut changer d'écran
  window.plugin = plugin;
  if (cas === 'bilan') plugin.vues().forEach((v) => v.aller(/resume=1/.test(location.search) ? 'resume' : 'avant'));
  if (cas === 'diagnostic') plugin.vues().forEach((v) => v.aller('diagnostic'));
  if (cas === 'palier' && window.seanceDuBilan) {
    const s = window.seanceDuBilan;
    plugin.vues().forEach((v) => { v.bilan = { seance: s, records: [], compare: L.bilanCompare(s, plugin.etat.seances), premiere: false, chemin: s.chemin, series: 10, ressenti: '' }; v.aller('bilan'); });
  }
  const lien = new URLSearchParams(location.search).get('lien');   // un seul paramètre dans le lien, ou le lien encodé
  if (lien) window.ouvrirLien(lien);
})().catch((e) => { document.body.textContent = 'Erreur : ' + e.stack; });
</script></body></html>
"""


def main(argv):
    if len(argv) != 1:
        print(__doc__)
        return 2
    installe = dossier_installe()
    if not installe:
        print("Plugin pas encore installé dans le coffre : lance « sh atelier/installer.sh ».")
        return 2
    page = (PAGE.replace("__STYLES__", lire(installe, "styles.css"))
            .replace("__FACTICE__", lire(ICI, "obsidian-factice.js"))
            .replace("__MAIN__", lire(installe, "main.js").replace("</script>", "<\\/script>"))
            .replace("__NOTES__", json.dumps(notes(), ensure_ascii=False).replace("</", "<\\/"))
            .replace("__REGLAGES__", json.dumps(reglages_installes(), ensure_ascii=False).replace("</", "<\\/")))
    with open(argv[0], "w", encoding="utf-8") as fh:
        fh.write(page)
    print(f"aperçu écrit : {argv[0]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
