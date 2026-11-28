// Les exercices (2.29.0, demande : ranger ensemble ce qui va ensemble) : tout ce qui décrit un exercice est dans SON dossier,
// commun/exercices/« 01 Nom »/ : fiche.txt (comment faire), depart.jpg et arrivee.jpg (ses 2 photos), exercice.json (sa charge
// de départ, ses anciens noms). atelier/construire.py en tire les tables ci-dessous, indexées par le nom normalisé (L.norm).
// Ajouter un exercice = ajouter un dossier. Photos : free-exercise-db (github.com/yuhonas/free-exercise-db), domaine public.

// Le nom d'un exercice (ou un de ses anciens noms, pour les séances déjà notées) → la clé de ses photos.
const IMAGES = IMAGES_DU_DOSSIER();
// ── Les charges de départ ──
// Celles proposées la première fois : une part du poids du corps (pour des haltères : un seul). Le poids vient des réglages :
// rien de personnel ici. Des estimations prudentes (un avis, pas une étude), calées sur un débutant déjà entraîné au poids
// du corps. Dès qu'une séance est notée, c'est la vraie charge qui sert. Machines à disques et barres : les disques seuls.
// Le calcul : L.chargeDepart (36-conseil.js).
const DEPARTS_PAR_KG = DEPARTS_DU_DOSSIER();

// Les photos elles-mêmes : « clé-0 » (départ) et « clé-1 » (arrivée) → la photo en base64. main.js porte tout : pas de
// dossier d'images dans le plugin installé.
const PHOTOS = PHOTOS_DU_DOSSIER();
