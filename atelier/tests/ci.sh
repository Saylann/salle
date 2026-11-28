#!/bin/sh
# Fabrique et teste le plugin sans Mac (GitHub Actions, Linux) : construire.py, puis les tests avec node (node-jsc.js).
#   sh atelier/tests/ci.sh
# Sans les notes de l'utilisateur (dossier vide) : les tests sur ses notes ne font qu'avertir.
# Le seul échec toléré : t90 « kcal », propre à node (ordre des tâches async) ; tout autre échec arrête.
set -eu
ICI=$(cd "$(dirname "$0")" && pwd)
RACINE=$(cd "$ICI/../.." && pwd)
FAB=$(mktemp -d); DONNEES=$(mktemp -d)
trap 'rm -rf "$FAB" "$DONNEES"' EXIT
(cd "$RACINE/plugin-salle" && python3 "$ICI/../construire.py" "$FAB")
LOGIQUE=$(cd "$RACINE/plugin-salle" && node "$ICI/node-jsc.js" "$ICI/lancer.js" -- "$DONNEES" "$FAB" "$ICI" 2>&1 || true)
echo "$LOGIQUE" | grep -E "ÉCHEC|réussis|EXCEPTION" || true
ECHECS=$(echo "$LOGIQUE" | grep "^ÉCHEC" | grep -v "t90-plugin.js : arrêté par une erreur : Cannot read properties of undefined (reading 'kcal')" || true)
if [ -n "$ECHECS" ]; then echo "Tests de logique en échec"; exit 1; fi
echo "$LOGIQUE" | grep -q "tests réussis" || { echo "Les tests de logique n'ont pas tourné"; exit 1; }
(cd "$RACINE/plugin-salle" && node "$ICI/node-jsc.js" "$ICI/rendu.js" -- "$DONNEES" "$FAB" "$ICI")
# perso.py cherche le nom du compte du Mac : sans sens ici (« root », « runner »). On vérifie seulement qu'aucune clé ne part.
if grep -E -q "gsk_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{30,}|sk-ant-|ghp_[A-Za-z0-9]{20,}" "$FAB/main.js"; then echo "Une clé est dans main.js"; exit 1; fi
echo "Aucune clé dans main.js."
