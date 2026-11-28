#!/bin/sh
# Fabrique, teste et installe (ou met à jour) le plugin Obsidian « Salle » dans le coffre où il est déjà installé.
#   sh atelier/installer.sh              fabrique, teste, installe
# Publier (seulement quand c'est demandé) : les 3 fichiers installés (main.js, manifest.json, styles.css ; jamais data.json)
# partent tels quels dans une « release » de GitHub, étiquette = la version. Aucun dossier intermédiaire.
# Rien de fabriqué ne reste dans ce dossier : main.js, styles.css et manifest.json sont fabriqués dans un dossier temporaire,
# testés là, puis copiés dans le dossier du plugin installé (la seule copie). Un plugin cassé, ou qui contient un nom ou une
# salle (atelier/tests/perso.py), ne part pas sur l'iPhone.
# Pas de chemin en dur : atelier/coffre.py retrouve le coffre dans le registre d'Obsidian (il peut être renommé ou déplacé).
set -eu

ICI=$(cd "$(dirname "$0")" && pwd)   # atelier/ : ce qui sert à fabriquer et à vérifier
RACINE=$(python3 "$ICI/coffre.py" --produit)   # le dossier du plugin (le produit), à côté de l'atelier : src/, commun/, objectifs/
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
COFFRE=$(python3 "$ICI/coffre.py") || { echo "Coffre introuvable. Ouvre-le une fois dans Obsidian, ou : SALLE_COFFRE=/chemin/du/coffre sh atelier/installer.sh"; exit 1; }
DONNEES=$(python3 "$ICI/coffre.py" --donnees)
CIBLE=$(python3 "$ICI/coffre.py" --installe) || CIBLE="$COFFRE/.obsidian/plugins/salle"
FABRIQUE=$(mktemp -d)
trap 'rm -rf "$FABRIQUE"' EXIT

# Chaque étape s'arrête sur un échec (code de sortie non nul) : rien n'est copié.
(cd "$RACINE" && python3 "$ICI/construire.py" "$FABRIQUE" && "$JSC" "$ICI/tests/lancer.js" -- "$DONNEES" "$FABRIQUE" "$ICI/tests" && "$JSC" "$ICI/tests/rendu.js" -- "$DONNEES" "$FABRIQUE" "$ICI/tests" && python3 "$ICI/tests/perso.py" "$FABRIQUE")

mkdir -p "$CIBLE"
for f in main.js manifest.json styles.css; do
  cp "$FABRIQUE/$f" "$CIBLE/$f.tmp"
  mv "$CIBLE/$f.tmp" "$CIBLE/$f"
done
# Les photos sont dans main.js (2.27.0) : l'ancienne copie du dossier images/ n'a plus sa place dans le plugin installé.
rm -rf "$CIBLE/images"

python3 - "$(dirname "$(dirname "$CIBLE")")/community-plugins.json" <<'PY'
import json, os, sys
chemin = sys.argv[1]
try:
    with open(chemin, encoding="utf-8-sig") as fh:
        actifs = json.load(fh)
except FileNotFoundError:
    actifs = []
except json.JSONDecodeError:
    actifs = None
if not isinstance(actifs, list):
    # Ne jamais écraser la liste des autres plugins : on laisse l'utilisateur activer celui-ci à la main.
    sys.exit("community-plugins.json illisible : rien n'est modifié. Active « Salle » dans Settings → Community plugins.")
if "salle" not in actifs:
    actifs.append("salle")
    with open(chemin + ".tmp", "w", encoding="utf-8") as fh:
        json.dump(actifs, fh, indent=2)
    os.replace(chemin + ".tmp", chemin)
PY

echo "Plugin « Salle » $(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['version'])" "$CIBLE/manifest.json") installé dans le coffre « $(basename "$COFFRE") »."

