#!/usr/bin/env python3
"""Contrôle : rien de personnel dans le dossier du plugin ni dans l'atelier (code, textes, tests, README, fichiers fabriqués).

  python3 atelier/tests/perso.py [dossier fabriqué]      (installer.sh donne le dossier temporaire où sont main.js et styles.css)

Les mots interdits ne sont écrits nulle part : ils sont lus sur la machine.
  - le nom du compte du Mac (souvent le prénom), sans tenir compte des majuscules ;
  - les noms propres et les numéros de la salle des réglages (data.json du plugin installé : nom, adresse, trajet).
Sans data.json, seul le nom du compte est contrôlé. Code de sortie 1 dès qu'un mot est trouvé : rien n'est installé.
"""
import getpass
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))   # atelier/
from coffre import ATELIER, PLUGIN, lire, reglages_installes   # noqa: E402

TEXTES = (".js", ".css", ".py", ".sh", ".json", ".txt", ".md", ".html")
HORS_CONTROLE = {"images"}   # des photos : pas de texte


def mots_interdits():
    """[(expression, d'où vient le mot)] : le nom du compte, puis chaque nom propre (5 lettres ou plus) et chaque numéro
    (3 chiffres ou plus) de la salle des réglages."""
    mots, vus = [], set()
    compte = getpass.getuser()
    if len(compte) >= 4:
        mots.append((re.compile(re.escape(compte), re.I), "le nom du compte"))
    salle = (reglages_installes() or {}).get("salle")
    for valeur in (salle.values() if isinstance(salle, dict) else []):
        if isinstance(valeur, str):
            for mot in re.findall(r"[A-ZÀ-Ý][a-zà-ÿ]{4,}|\b\d{3,}\b", valeur):
                if mot in vus:
                    continue
                vus.add(mot)
                mots.append((re.compile(r"(?<![\w.,])" + re.escape(mot) + r"(?![\w.,]\w)"), "la salle des réglages"))
    return mots


def fichiers():
    for depart in [PLUGIN, ATELIER] + [a for a in sys.argv[1:] if os.path.isdir(a)]:
        for dossier, sous, noms in os.walk(depart):
            sous[:] = sorted(s for s in sous if not s.startswith(".") and s not in HORS_CONTROLE and s != "__pycache__")
            for nom in sorted(noms):
                if nom.endswith(TEXTES):
                    yield os.path.join(dossier, nom)


def main():
    mots, trouves, vus = mots_interdits(), [], 0
    for chemin in fichiers():
        vus += 1
        for no, ligne in enumerate(lire(chemin).split("\n"), 1):
            for expression, source in mots:
                # Dans les notes d'études (recherche/), un mot isolé de la salle est un faux ami (le nom d'une enquête, d'une île) :
                # seul le nom du compte y est cherché.
                if source != "le nom du compte" and (os.sep + "recherche" + os.sep) in chemin:
                    continue
                m = expression.search(ligne)
                if m:
                    trouves.append(f"{os.path.relpath(chemin, os.path.dirname(ATELIER))}:{no} : « {m.group(0)} » ({source})")
    if trouves:
        print("\n".join(trouves[:40]))
        print(f"{len(trouves)} mot(s) personnel(s) dans le plugin : à retirer (ils vont dans les réglages, pas dans le code).")
        return 1
    print(f"Rien de personnel : {vus} fichiers contrôlés, {len(mots)} mots cherchés.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
