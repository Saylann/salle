# Salle

Plugin Obsidian de musculation : la séance du jour à ton rythme, la cible de chaque série, le repos qui annonce la suite, les progrès par muscle, les mesures et « Manger ». Installé avec BRAT (`Saylann/salle`).

## Le dépôt

- `plugin-salle/` : le produit. `src/` (le moteur, assemblé dans un seul `main.js`), `commun/` (un dossier par exercice, les modèles de notes), `objectifs/` (ce qui change d'un objectif à l'autre, et les études sur lesquelles le programme repose).
- `atelier/` : ce qui fabrique et teste le plugin (`construire.py`, `installer.sh`, `tests/`, `apercu/`). Rien de l'atelier ne va dans le plugin.
- `manifest.json` (racine) : la dernière version publiée, lue par BRAT. Les fichiers installés (main.js, manifest.json, styles.css) sont dans chaque release.

## Fabriquer et tester

- Sur le Mac : `sh atelier/installer.sh` (fabrique, teste avec jsc, installe dans le coffre).
- Ailleurs (et sur GitHub à chaque envoi) : `sh atelier/tests/ci.sh` (fabrique, teste avec node).

Les données de l'utilisateur (`donnees/`, `data.json`) ne sont jamais dans ce dépôt.
