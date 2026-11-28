#!/usr/bin/env python3
"""Fabrique le plugin « Salle » à partir des sources (Python 3, sans dépendance, sans npm).

  python3 atelier/construire.py <dossier de sortie>      (appelé par atelier/installer.sh, avec un dossier temporaire)

Écrit dans le dossier de sortie les trois fichiers d'un plugin Obsidian :
- main.js        = les .js de src/ et de ses sous-dossiers, dans l'ordre des noms (00-entete.js, 02-…, 99-exports.js), un repère
                   « // ── src/… ── » avant chacun.
                   Chaque MODELE('Nom.txt') du code est remplacé par le texte de objectifs/<objectif>/Nom.txt (ce qui dépend de
                   l'objectif : programme, repas) ou, à défaut, de commun/Nom.txt (ce qui vaut pour tous). Le catalogue des
                   exercices (commun/exercices/, un dossier par exercice) donne GUIDE_DU_DOSSIER(), IMAGES_DU_DOSSIER(),
                   DEPARTS_DU_DOSSIER() et PHOTOS_DU_DOSSIER() : le plugin tient dans un seul fichier, photos comprises.
- styles.css     = les .css de src/ et de ses sous-dossiers, dans l'ordre des noms.
- manifest.json  = src/manifest.json, tel quel.
Rien de fabriqué ne reste dans le dossier du plugin : la seule copie est celle du plugin installé.
Avant d'écrire, le JavaScript est relu par jsc (s'il existe sur ce Mac) : une faute de syntaxe est signalée avec son fichier
de src/ et sa ligne. Codes de sortie : 0 tout va bien, 2 fichier manquant ou source fautive.
"""
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from coffre import PLUGIN as RACINE   # noqa: E402   le dossier du plugin (le produit) : src/, commun/, objectifs/
SRC = os.path.join(RACINE, 'src')
MODELES = os.path.join(RACINE, 'commun')   # les textes qui valent pour tous les objectifs
EXERCICES = os.path.join(MODELES, 'exercices')   # le catalogue : un dossier par exercice (fiche, photos, charge de départ)
ENTETE_GUIDE = '---\nsalle: guide\n---\n# Comment faire\n\n'
# L'objectif livré (le seul aujourd'hui). Ses règles et ses textes sont dans objectifs/<objectif>/ ; ce qui vaut pour tous, dans commun/.
OBJECTIF = 'esthetique'
OBJECTIFS = os.path.join(RACINE, 'objectifs')
JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc'

BANNIERE_JS = ('// main.js est FABRIQUÉ par atelier/construire.py à partir de src/*.js, de objectifs/ et de commun/ (textes et photos) : ne pas le modifier ici.\n'
               '// Modifier les sources, puis « sh atelier/installer.sh » (fabrique, teste et installe).\n')
BANNIERE_CSS = ('/* styles.css est FABRIQUÉ par atelier/construire.py à partir des .css de src/ : ne pas le modifier ici.\n'
                '   Modifier src/, puis « sh atelier/installer.sh ». */\n')
REPERES_EXERCICES = {'GUIDE_DU_DOSSIER()': 'guide', 'IMAGES_DU_DOSSIER()': 'images', 'DEPARTS_DU_DOSSIER()': 'departs', 'PHOTOS_DU_DOSSIER()': 'photos'}
REPERE_OBJECTIF = 'OBJECTIF_DU_DOSSIER()'
CLES_OBJECTIF = ('id', 'nom', 'musclesPrioritaires', 'seriesParSemaine', 'proteines', 'priseDePoidsParSemaine', 'progressionDesSeries', 'paliers', 'dose')
REPERE_MODELE = re.compile(r"""MODELE\(\s*(['"])([^'"\\/]+)\1\s*\)""")
# Ce qu'un main.js complet contient forcément : s'il en manque un, un fichier de src/ a disparu ou a été vidé par erreur.
ESSENTIELS = [("'use strict'", 'src/base/00-entete.js'), ('const L = {}', 'src/base/00-entete.js'), ('class VueSalle', 'src/ecrans/60-vue.js'),
              ('class SallePlugin', 'src/obsidian/90-plugin.js'), ('module.exports = SallePlugin', 'src/obsidian/99-exports.js')]


class Erreur(Exception):
    pass


def rel(chemin):
    return os.path.relpath(chemin, RACINE)


def lire(chemin):
    """Texte UTF-8, sans BOM, fins de ligne \\n (comme un gabarit JavaScript les aurait lues)."""
    try:
        with open(chemin, 'rb') as fh:
            brut = fh.read()
    except FileNotFoundError:
        raise Erreur(f'Fichier introuvable : {rel(chemin)}')
    try:
        texte = brut.decode('utf-8-sig')
    except UnicodeDecodeError as e:
        raise Erreur(f'{rel(chemin)} n\'est pas en UTF-8 (octet {e.start}) : réenregistre-le en UTF-8.')
    return texte.replace('\r\n', '\n').replace('\r', '\n')


def sources(extension):
    """Les fichiers sources de src/ et de ses sous-dossiers, dans l'ordre de leur nom (00-…, 02-…, 99-…) quel que soit le
    sous-dossier : le numéro donne l'ordre d'assemblage, le sous-dossier range par famille (base, notes, seance, progres,
    ecrans, obsidian ; le style d'un écran est à côté de son code). Un fichier encore dans iCloud (pas téléchargé) : erreur claire."""
    if not os.path.isdir(SRC):
        raise Erreur('Dossier introuvable : src/ (les sources du plugin). Restaure-le depuis ~/Desktop/CLAUDE/Salle-travail/archives/ ou iCloud.')
    fichiers, absents = [], []
    for dossier, sous, noms in os.walk(SRC):
        sous[:] = sorted(x for x in sous if not x.startswith('.'))
        for n in noms:
            if n.startswith('.') and n.endswith(extension + '.icloud'):
                absents.append(os.path.join(dossier, n[1:-len('.icloud')]))
            elif n.endswith(extension) and not n.startswith('.'):
                fichiers.append(os.path.join(dossier, n))
    if absents:
        raise Erreur('Pas encore téléchargé d\'iCloud : ' + ', '.join(rel(c) for c in sorted(absents))
                     + '. Ouvre le dossier dans le Finder (ou « brctl download <dossier> »), puis relance.')
    if not fichiers:
        raise Erreur(f'Aucun fichier {extension} dans src/.')
    return sorted(fichiers, key=lambda c: (os.path.basename(c), c))


def objectif():
    """Les règles de l'objectif livré : objectifs/<objectif>/objectif.json, relu et contrôlé (les clés attendues)."""
    chemin = os.path.join(OBJECTIFS, OBJECTIF, 'objectif.json')
    try:
        o = json.loads(lire(chemin))
    except ValueError:
        raise Erreur(f'{rel(chemin)} n\'est pas du JSON lisible.')
    manquent = [c for c in CLES_OBJECTIF if not isinstance(o, dict) or c not in o]
    if manquent:
        raise Erreur(f'{rel(chemin)} : il manque ' + ', '.join(manquent) + '.')
    return o


def norm(texte):
    """La même règle que L.norm (src/base/10-outils.js) : sans accents ni majuscules, les espaces réduits."""
    t = unicodedata.normalize('NFD', texte)
    t = ''.join(c for c in t if not ('\u0300' <= c <= '\u036f'))
    return re.sub(r'\s+', ' ', t.lower()).strip()


CATALOGUE = None


def exercices():
    """Le catalogue des exercices : un dossier par exercice dans commun/exercices/ (« 01 Nom », le numéro donne l'ordre du
    guide), avec fiche.txt (comment faire), depart.jpg et arrivee.jpg (les 2 photos) et, s'il en faut, exercice.json
    ({ departParKg : la charge de départ en part du poids du corps ; anciensNoms : les noms d'avant, pour les séances déjà notées }).
    → { guide : le texte du guide ; images : nom normalisé → clé des photos ; departs : nom normalisé → part du poids ;
        photos : « clé-0 » et « clé-1 » → la photo en base64 }. Tout ce qui décrit un exercice est dans son dossier."""
    global CATALOGUE
    if CATALOGUE:
        return CATALOGUE
    if not os.path.isdir(EXERCICES):
        raise Erreur('Dossier introuvable : commun/exercices/ (un dossier par exercice).')
    # 2.41.13 (demande : « oui, retire-les ») : plus de photos dans le plugin : les vidéos les ont remplacées, et elles faisaient
    # 3 Mo sur 3,9 (archivées dans Salle-travail/archives/photos-exercices-2026-11-27/). images et photos restent vides.
    guide, images, departs, photos, vus = [], {}, {}, {}, set()
    for dossier in sorted(n for n in os.listdir(EXERCICES) if not n.startswith('.') and os.path.isdir(os.path.join(EXERCICES, n))):
        chemin = os.path.join(EXERCICES, dossier)
        nom = re.sub(r'^\d+\s+', '', dossier)
        cle = norm(nom)
        if not cle or cle in vus:
            raise Erreur(f'{rel(chemin)} : nom vide ou déjà pris par un autre exercice.')
        vus.add(cle)
        if any(n.startswith('.') and n.endswith('.icloud') for n in os.listdir(chemin)):
            raise Erreur(f'{rel(chemin)} : pas encore téléchargé d\'iCloud. Ouvre le dossier dans le Finder, puis relance.')
        guide.append(f'## {nom}\n\n' + lire(os.path.join(chemin, 'fiche.txt')).strip('\n') + '\n')
        infos = os.path.join(chemin, 'exercice.json')
        if os.path.isfile(infos):
            try:
                info = json.loads(lire(infos))
            except ValueError:
                raise Erreur(f'{rel(infos)} n\'est pas du JSON lisible.')
            if isinstance(info.get('departParKg'), (int, float)):
                departs[cle] = info['departParKg']
            for ancien in info.get('anciensNoms') or []:
                if norm(ancien) in vus:
                    raise Erreur(f'{rel(infos)} : « {ancien} » est déjà le nom d\'un exercice.')
    if not guide:
        raise Erreur('Aucun exercice dans commun/exercices/.')
    CATALOGUE = {'guide': ENTETE_GUIDE + '\n'.join(guide), 'images': images, 'departs': departs, 'photos': photos}
    return CATALOGUE


def avec_modeles(texte, chemin):
    def remplacer(m):
        modele = os.path.join(OBJECTIFS, OBJECTIF, m.group(2))   # d'abord le texte de l'objectif, sinon le texte commun
        if not os.path.isfile(modele):
            modele = os.path.join(MODELES, m.group(2))
        if not os.path.isfile(modele):
            raise Erreur(f'Modèle introuvable : {rel(modele)} (demandé par {rel(chemin)}). Restaure-le depuis ~/Desktop/CLAUDE/Salle-travail/archives/.')
        chaine = json.dumps(lire(modele), ensure_ascii=False)
        return chaine.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    texte = REPERE_MODELE.sub(remplacer, texte)
    if REPERE_OBJECTIF in texte:
        texte = texte.replace(REPERE_OBJECTIF, json.dumps(objectif(), ensure_ascii=False))
    for repere, quoi in REPERES_EXERCICES.items():
        if repere in texte:
            js = json.dumps(exercices()[quoi], ensure_ascii=False, separators=(',', ':'))
            texte = texte.replace(repere, js.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029'))
    return texte


def assembler(fichiers, banniere, repere, transformer=None):
    """Le texte complet, et la table (première ligne dans le fichier fabriqué, fichier source) pour retrouver une ligne."""
    morceaux, table, ligne = [banniere], [], banniere.count('\n') + 1
    for chemin in fichiers:
        texte = lire(chemin)
        if transformer:
            texte = transformer(texte, chemin)
        if texte and not texte.endswith('\n'):
            texte += '\n'
        entete = repere(rel(chemin)) + '\n'
        morceaux.append(entete)
        ligne += 1
        table.append((ligne, chemin))
        morceaux.append(texte)
        ligne += texte.count('\n')
    return ''.join(morceaux), table


def fabriquer_js():
    texte, table = assembler(sources('.js'), BANNIERE_JS, lambda n: f'// ── {n} ──', avec_modeles)
    restes = [m.group(0) for m in re.finditer(r'MODELE\([^)]*\)', texte)]
    if restes:
        raise Erreur('Repère de modèle mal écrit : ' + ', '.join(restes) + " (forme attendue : MODELE('Nom.txt')).")
    manquent = [f'« {quoi} » (d\'habitude dans {ou})' for quoi, ou in ESSENTIELS if quoi not in texte]
    if manquent:
        raise Erreur('main.js serait incomplet, il y manque : ' + ' ; '.join(manquent)
                     + '. Un fichier de src/ a disparu ou a été vidé : restaure-le depuis ~/Desktop/CLAUDE/Salle-travail/archives/ ou iCloud.')
    return texte, table


def fabriquer_css():
    texte, _ = assembler(sources('.css'), BANNIERE_CSS, lambda n: f'/* ── {n} ── */')
    return texte


def ou_est(table, n):
    """Ligne n de main.js → (fichier de src/, ligne dans ce fichier)."""
    for debut, chemin in reversed(table):
        if n >= debut:
            return rel(chemin), n - debut + 1
    return 'main.js', n


def verifier_syntaxe(texte, table):
    """Relit le JavaScript avec jsc, s'il est là. Une faute : Erreur avec le fichier de src/ et la ligne."""
    jsc = JSC if os.path.exists(JSC) else shutil.which('jsc')
    if not jsc:
        return
    with tempfile.TemporaryDirectory() as dossier:
        cible, script = os.path.join(dossier, 'main.js'), os.path.join(dossier, 'relire.js')
        with open(cible, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(texte)
        with open(script, 'w', encoding='utf-8') as fh:
            fh.write('try { checkSyntax(%s); print("OK"); } catch (e) { print("FAUTE " + e.line + " " + e.message); }\n'
                     % json.dumps(cible))
        try:
            sortie = subprocess.run([jsc, script], capture_output=True, text=True, timeout=60).stdout.strip()
        except (OSError, subprocess.SubprocessError):
            return
    m = re.match(r'FAUTE (\d+) (.*)', sortie.splitlines()[-1] if sortie else '')
    if m:
        fichier, ligne = ou_est(table, int(m.group(1)))
        raise Erreur(f'Faute de syntaxe dans {fichier}, ligne {ligne} : {m.group(2)}. main.js n\'est pas modifié.')


def ecrire(chemin, texte):
    """Écriture atomique ; rien n'est écrit si le contenu est déjà le même. Rend True si le fichier a changé."""
    try:
        with open(chemin, encoding='utf-8', newline='') as fh:
            if fh.read() == texte:
                return False
    except (FileNotFoundError, UnicodeDecodeError):
        pass
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(chemin), prefix='.' + os.path.basename(chemin) + '.', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(texte)
        os.chmod(tmp, 0o644)
        os.replace(tmp, chemin)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise
    return True


def main(args):
    if len(args) != 1 or args[0].startswith('-'):
        print(__doc__)
        return 2
    sortie = os.path.abspath(args[0])
    try:
        if not os.path.isdir(sortie):
            raise Erreur(f'Dossier de sortie introuvable : {sortie}')
        js, table = fabriquer_js()
        css = fabriquer_css()
        manifeste = lire(os.path.join(SRC, 'manifest.json'))
        try:
            version = json.loads(manifeste)['version']
        except (ValueError, KeyError, TypeError):
            raise Erreur('src/manifest.json est illisible (du JSON, avec une clé « version »).')
        verifier_syntaxe(js, table)
        for nom, texte in (('main.js', js), ('styles.css', css), ('manifest.json', manifeste)):
            ecrire(os.path.join(sortie, nom), texte)
    except Erreur as e:
        print('construire.py : ' + str(e), file=sys.stderr)
        return 2
    print(f'Plugin {version} fabriqué : main.js ({len(table)} fichiers de src/, {len(js.encode("utf-8")) // 1024} Ko), '
          f'styles.css ({css.count(chr(10))} lignes), manifest.json.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
