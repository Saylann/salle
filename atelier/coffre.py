"""Ce que partagent les outils de l'atelier (installer.sh, construire.py, apercu/apercu.py, tests/perso.py) : où sont le
dossier du plugin (le produit, à côté de l'atelier), le coffre, le dossier des données et le plugin installé ; lire un
fichier ; lire les réglages. Rien n'est écrit en dur : tout est retrouvé. `python3 atelier/coffre.py` affiche le coffre
(--produit : le dossier du plugin ; --donnees : les données ; --installe : le plugin installé)."""
import json
import os
import re
import sys

ATELIER = os.path.dirname(os.path.abspath(__file__))   # ce dossier : ce qui sert à fabriquer et à vérifier


def trouver_produit():
    """Le dossier du plugin (le produit : src/, commun/, objectifs/) : à côté de l'atelier, celui qui contient
    src/manifest.json. Reconnu par son contenu, pas par son nom. SALLE_PLUGIN (variable d'environnement) passe avant."""
    force = os.environ.get("SALLE_PLUGIN")
    if force and os.path.isdir(force):
        return force
    parent = os.path.dirname(ATELIER)
    for d in sorted(os.listdir(parent)):
        if not d.startswith(".") and os.path.isfile(os.path.join(parent, d, "src", "manifest.json")):
            return os.path.join(parent, d)
    sys.exit("Dossier du plugin introuvable à côté de l'atelier (celui qui contient src/manifest.json).")


PLUGIN = trouver_produit()


def lire(*chemin):
    with open(os.path.join(*chemin), encoding="utf-8") as fh:
        return fh.read()


def identifiant():
    """L'identifiant du plugin (src/manifest.json) : le nom de son dossier une fois installé."""
    return json.loads(lire(PLUGIN, "src", "manifest.json")).get("id", "salle")


def trouver_coffre():
    """Le coffre où le plugin est installé : parmi les coffres qu'Obsidian connaît (son registre obsidian.json), celui qui a
    plugins/<id>/ dans un dossier caché. La variable d'environnement SALLE_COFFRE passe avant. None si aucun."""
    force = os.environ.get("SALLE_COFFRE")
    if force and os.path.isdir(force):
        return force
    try:
        ident = identifiant()
        registre = json.loads(lire(os.path.expanduser("~/Library/Application Support/obsidian/obsidian.json")))
        for coffre in registre.get("vaults", {}).values():
            chemin = coffre.get("path") or ""
            if os.path.isdir(chemin) and any(d.startswith(".") and os.path.isdir(os.path.join(chemin, d, "plugins", ident))
                                             for d in os.listdir(chemin)):
                return chemin
    except (OSError, ValueError):
        pass
    return None


COFFRE = trouver_coffre()


def hors_atelier(dossier, sous):
    """Pour os.walk dans le coffre : les sous-dossiers à visiter, sans les dossiers cachés, le dossier du plugin ni l'atelier."""
    return sorted(s for s in sous if not s.startswith(".") and os.path.join(dossier, s) not in (PLUGIN, ATELIER))


def trouver_donnees():
    """Le dossier des données de l'utilisateur dans le coffre : celui qui contient sa note « salle: programme » (hors des
    dossiers cachés et de ce dossier-ci). À défaut : le coffre lui-même. None sans coffre."""
    if not COFFRE:
        return None
    for dossier, sous, noms in os.walk(COFFRE):
        sous[:] = hors_atelier(dossier, sous)
        for nom in sorted(noms):
            if nom.endswith(".md"):
                try:
                    if "\nsalle: programme\n" in lire(dossier, nom)[:200]:
                        return dossier
                except (OSError, ValueError):
                    pass
    return COFFRE


def dossier_installe():
    """Le dossier du plugin installé dans le coffre (<dossier caché>/plugins/<id>), ou None : la seule copie de main.js."""
    if not COFFRE:
        return None
    try:
        for d in sorted(os.listdir(COFFRE)):
            chemin = os.path.join(COFFRE, d, "plugins", identifiant())
            if d.startswith(".") and os.path.isdir(chemin):
                return chemin
    except (OSError, ValueError):
        pass
    return None


def reglages_installes():
    """Les réglages de l'utilisateur, ou None : la note « salle: reglages » de son dossier de données (2.25.0) ; à défaut, la clé
    « reglages » du data.json du plugin installé (avant la 2.25.0). Rien n'est supposé sur les noms : en-tête et dossier caché."""
    if not COFFRE:
        return None
    try:
        for dossier, sous, noms in os.walk(COFFRE):
            sous[:] = hors_atelier(dossier, sous)
            for nom in sorted(noms):
                if nom.endswith(".md"):
                    texte = lire(dossier, nom)
                    if "\nsalle: reglages\n" in texte[:200]:
                        bloc = re.search(r"```json[ \t]*\n(.*?)\n```", texte, re.S)
                        reg = json.loads(bloc.group(1)) if bloc else None
                        if isinstance(reg, dict):
                            return reg
        ident = identifiant()
        for d in sorted(os.listdir(COFFRE)):
            chemin = os.path.join(COFFRE, d, "plugins", ident, "data.json")
            if d.startswith(".") and os.path.isfile(chemin):
                reg = json.loads(lire(chemin)).get("reglages")
                return reg if isinstance(reg, dict) else None
    except (OSError, ValueError):
        pass
    return None


if __name__ == "__main__":
    quoi = (trouver_donnees() if "--donnees" in sys.argv else dossier_installe() if "--installe" in sys.argv
            else PLUGIN if "--produit" in sys.argv else COFFRE)
    print(quoi or "")
    sys.exit(0 if quoi else 1)
