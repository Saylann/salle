# Audit du plugin face aux études

15/11/2026. Source unique : [[La bonne séance]] (les numéros [n] sont ses sources). Tout le plugin et les notes du coffre, pas seulement le questionnaire « Avant de commencer » (traité à part, pas ici).

## En bref

- 3 agents ont audité 194 règles (beaucoup en double : le même calcul vu dans le code et dans les notes).
- 122 sont conformes aux études de la note, 23 sont sans étude mais pratiques, 15 ne sont pas couvertes par la note.
- 34 étaient signalées « à corriger » ou « à retirer » ; après revérification dans la note, 3 sont écartées, les 31 autres donnent 21 changements.
- Les plus importants : jamais « séance » pendant une semaine où il est malade ; toujours 48 h entre deux séances ; retirer 3 règles qui allègent la séance sans étude.
- Rien n'est modifié : ce fichier est la liste à appliquer.

Les numéros de ligne sont ceux du 15/11 ; ils bougent, le nom de la fonction fait foi.

## À changer

Classés par importance pour sa progression (et sa santé d'abord).

1. **Malade, la carte dit quand même « séance »**
   - Où : `src/40-progres.js:167` (`conseilDuJour`), appelé par `src/61-accueil.js:322`.
   - Aujourd'hui : pendant une semaine sans salle (« Cette semaine (malade) » comprise), l'objectif passe à 0, mais la branche « 4 jours ou plus sans séance » passe avant et affiche « Aujourd'hui : séance ».
   - Études : pas de séance avec fièvre, frissons, courbatures partout, gêne pour respirer ou douleur dans la poitrine [126] ; une semaine sans salle ne fait rien perdre [123, 124].
   - Changement : si l'objectif est 0 (semaine sans salle), renvoyer avant la branche `j >= 4` : `{ repos: true, texte: 'Semaine sans salle : repos.' }`.

2. **Toujours 48 h entre deux séances**
   - Où : `src/40-progres.js:108` (modèle `4: [1, 2, 4, 5]`), `:111` (`joursSeSuivent`), `:120` (`plan`), `:142` (`retardSemaine`), `:164-166` (`conseilDuJour`, `seSuivent`) ; `src/61-accueil.js:182` (`reg.parSemaine = neuf.length`).
   - Aujourd'hui : le modèle à 4 séances met lundi-mardi et jeudi-vendredi ; si deux jours choisis se suivent, l'écart passe à 1 jour et le plan propose une séance le lendemain d'une autre ; cocher 5, 6 ou 7 jours fixe l'objectif à 5, 6 ou 7.
   - Études : 3 séances, au moins 48 h entre deux [26] ; A et B travaillent toutes les deux le dos, les épaules et les cuisses, et des séries dures ralentissent la récupération de 24 à 48 h [26, 54] ; 2 ou 3 séances donnent le même résultat [47], 1, 2 ou 3 fois le même muscle à séries égales [11, 45]. Avec 48 h d'écart, une semaine qui se répète ne tient pas plus de 3 séances.
   - Changement : retirer le cas 4 du modèle (ou le ramener à `[1, 3, 5]`) ; écart de 2 jours dans tous les cas (supprimer l'usage de `joursSeSuivent` pour l'écart, garder l'avertissement des réglages, `61-accueil.js:191-193`) ; plafonner `parSemaine` à 3 même si plus de jours sont cochés. Le bouton « Y aller quand même » reste (son choix). Le choix « 4 » du questionnaire est traité par l'autre agent.

3. **Retirer le « −1 répétition » après deux séances à fond**
   - Où : `src/30-seance.js:937-944` (dans `conseil`, la branche `der.reserve === '0' && avant.reserve === '0'`).
   - Aujourd'hui : 0 en réserve deux fois de suite à la même charge sans gagner de répétition → même charge, une répétition de moins visée.
   - Études : aucune étude pour ce −1. La note dit : « Un exercice bloqué 3 séances : regarde d'abord ton sommeil, ce que tu manges et ta réserve. » 0 en réserve est permis à la dernière série sur machine et poulie [13, 14] ; sans progression, on grossit environ deux fois moins [31].
   - Changement : supprimer la branche (la cible redevient la normale, +1 répétition). Après 3 séances de suite sans gain sur un exercice, ajouter au texte : « Bloqué depuis 3 séances : regarde ton sommeil, ce que tu manges et ta réserve. »

4. **Retirer la « famille fatiguée » (« Reste léger »)**
   - Où : `src/30-seance.js:211-219` (`familleFatiguee`), `:242-252` (son appel et sa ligne), `:880` et `:952-957` (`conseilLeger`), le marquage `exo.fatigue` / `legere` qu'elle pose ; `src/40-progres.js:651` et `:668` (le boost qui l'écoute).
   - Aujourd'hui : si la dernière séance date de 3 jours ou moins, était libre ou ressentie « dure », et a beaucoup fait travailler une famille, ses exercices passent à 2 séries, bas de la fourchette, pas plus lourd, « sans aller au bout ».
   - Études : la note n'allège que pour les courbatures fortes : ce muscle à 2 séries, un tiers plus léger [113] ; courbatures légères : séance normale ; refaire un muscle courbaturé n'aggrave pas [112] ; régler la séance au ressenti ne fait pas mieux qu'une progression notée [69] ; l'écart utile est 48 h [26], déjà réglé par le changement 2. Rien sur « 3 jours » ni sur un ressenti « dur ».
   - Changement : supprimer `familleFatiguee` et `conseilLeger`. Les courbatures fortes restent gérées par le bilan (`conseilCourbature`, conforme).

5. **Retirer le choix de séance « qui recoupe le moins »**
   - Où : `src/30-seance.js:162-209` (`tresSollicitee`, `choisirSeance`, `parFamille`).
   - Aujourd'hui : si la dernière séance date de 4 jours ou moins et qu'elle était libre ou « très déséquilibrée » (une famille ≥ 60 % des séries pondérées et ≥ 6 séries, les 2 premiers exercices comptés 1,5), le plugin prend une autre séance que l'alternance A/B.
   - Études : aucune pour ces seuils. À séries égales, la fréquence ne change rien [11, 45] ; tout le corps A/B 3 fois par semaine est le plus pratique [11, 46].
   - Changement : `choisirSeance` = la séance qui suit la dernière séance du programme, sans autre test (une séance libre ne compte pas, comme aujourd'hui). Si `tresSollicitee` ne sert plus qu'ici et au changement 4, la supprimer.

6. **Après une montée de charge, ne pas afficher le bas de la fourchette seul**
   - Où : `src/30-seance.js:912-915` et `:928` (`apresMontee`, `valeur: exo.min`), et l'affichage de la cible en gros.
   - Aujourd'hui : la cible en gros dit « 45 kg × 8 », le texte dit « le plus de répétitions propres, au moins 8 ».
   - Études : après une montée, viser le maximum de répétitions propres plutôt que « repars de 8 » (avis, preuve faible) [61] ; les débutants s'arrêtent bien trop tôt (15,4 annoncées, 23,9 faites) [15].
   - Changement : quand `monte: true`, afficher « 45 kg × 8+ » (ou « au moins 8, le plus possible »).

7. **Semaine à 2 séances : 1 série de plus au dos, aux épaules et aux pecs**
   - Où : `src/30-seance.js:418-430` (`adapter`) ; texte `src/61-accueil.js:237`.
   - Aujourd'hui : avec 2 séances par semaine, les séries ne changent pas, donc le volume par semaine baisse d'un tiers. Et le texte des semaines sans salle dit « Examens, vacances, malade : prévois-la ici ».
   - Études : « Semaine de partiels : 2 séances, avec 1 série de plus aux exercices de dos, d'épaules et de pecs » ; à séries égales, 1, 2 ou 3 fois par semaine donnent le même muscle [11, 45] ; au plus 8 séries directes pour un même muscle dans une séance [28]. Une semaine sans salle ne fait rien perdre [123] : la pause reste permise, mais la note préfère 2 séances en partiels.
   - Changement : dans `adapter`, si `parSemaine === 2`, +1 série aux exercices dont `L.musclePrincipal` est le dos, le côté ou l'avant des épaules ou les pecs, sans dépasser 8 séries directes par muscle dans la séance (pas pendant la mise en route ni la semaine légère). Texte : « Vacances, malade : prévois-la ici. Partiels : plutôt 2 séances, avec 1 série de plus au dos, aux épaules et aux pecs. »

8. **Reprise après plus de 8 semaines sans salle**
   - Où : `src/30-seance.js:418-430` (`adapter` : la mise en route ne compte que les 4 premières séances de toute la vie) ; `src/40-progres.js:404-413` (`bonRetour` : rien au-delà de 21 jours).
   - Études : « Plus de 8 semaines sans salle : refais 2 à 4 séances à 2 séries » (avis) ; la protection d'une séance légère est partielle à 9 semaines et a disparu à 12 [110, 111]. Une semaine sans salle ne fait rien perdre, 10 semaines d'arrêt sont vite rattrapées [123, 124].
   - Changement : si la dernière séance date de plus de 56 jours, 2 séances à 2 séries (mêmes règles que `decouverte`), puis la normale. `bonRetour` : garder « Tu n'as rien perdu : garde tes charges d'avant » de 7 à 56 jours (au lieu de 21) ; au-delà : « Après 8 semaines sans salle : tes 2 prochaines séances à 2 séries, pour éviter les grosses courbatures. »

9. **Reprise après une maladie**
   - Où : absent (`src/30-seance.js` `adapter`, `src/02-reglages.js` pauses) ; et `Débuter à la salle.md`, « Pendant la séance ».
   - Études : « Après une maladie : une séance à moitié des séries, puis la normale si tu n'as rien eu pendant l'effort ni dans les 24 h » (avis, à partir du CIO [126]).
   - Changement : la première séance après une semaine sans salle marquée « malade » : séries divisées par deux (comme la semaine légère, mêmes charges), puis la normale. Ajouter à `Débuter à la salle.md` : « Malade (fièvre, frissons, courbatures partout, gêne pour respirer) : pas de séance. Pour reprendre, une séance à moitié des séries, puis la normale si tu n'as rien eu pendant l'effort ni dans les 24 h. »

10. **Séance d'1 h 15 : 4 séries au plus, sans « rodage »**
    - Où : `src/30-seance.js:423` (`rodage`), `:426` (`e.series += 1`), `:247` (sa ligne).
    - Aujourd'hui : à 1 h 15, +1 série sur les 3 premiers exercices du programme ; en B, le développé incliné passe de 4 à 5. Et rien de plus aux séances 5 à 8 (« la série en plus viendra après la 8e »).
    - Études : partie 2, 1 h 15 : « les 3 premiers exercices à 4 séries, le 4e à 3 » (avis) ; 4 à 6 séries par exercice ne font pas nettement mieux que 2 ou 3 [11, 12] ; au plus 8 séries directes par muscle et par séance [28]. Aucune étude pour « 8 séances » ; la seule limite citée : au plus 20 % de séries en plus par bloc d'environ 4 semaines (avis) [32], et 21 → 24 séries font +14 %.
    - Changement : `e.series = Math.min(4, e.series + 1)` ; supprimer `rodage` (la règle 1 h 15 vaut dès la fin de la mise en route). La note dit aussi qu'1 h 15 n'est pas utile avant février 2027 : c'est un conseil pour lui, pas un blocage du plugin.

11. **Tractions : progresser après le haut de la fourchette**
    - Où : `src/30-seance.js` (`conseil`, branche `exo.corps`, vers `:909`).
    - Aujourd'hui : +1 répétition par séance jusqu'au haut, puis la cible reste au haut, sans rien de plus.
    - Études : sans progression, la réserve dérive de 1,5 à 4,1 répétitions et les séries deviennent trop faciles [61] ; sans progression, on grossit environ deux fois moins [31].
    - Changement : au haut de la fourchette à toutes les séries, dire « Passe au tirage vertical, à la machine : tu pourras monter de 2,5 kg » (ou proposer un lest).

12. **Semaine légère proposée après 8 semaines, pas 10**
    - Où : `src/40-progres.js:397` (`jours < 70`) et son commentaire `:383` ; textes `Programme.md:30` et `src/61-accueil.js:207`.
    - Études : les entraîneurs experts placent une décharge toutes les 4 à 8 semaines, environ 7 jours [34] (avis d'experts ; aucun bénéfice prouvé, un peu moins de force aux jambes dans le seul essai [35]). 10 semaines sort de leur fourchette.
    - Changement : 70 → 56 jours ; « Après 8 semaines sans semaine légère, le plugin t'en propose une. » Toujours proposée, jamais imposée. La semaine du 18/01/2027 (finaux) reste la semaine prévue.

13. **Séance de 45 min : les élévations à la poulie de l'étage 1**
    - Où : `Programme.md` (élévations A et B : pas de variante poulie) ; `src/30-seance.js:458-503` (paires).
    - Aujourd'hui : les élévations aux haltères sont à l'étage 2 ; à 45 min, elles ne peuvent pas faire la paire tirage horizontal + élévations de la partie 2.
    - Études : partie 2 (avis) : A tout à l'étage 1, tirage horizontal + élévations à la poulie ; haltères ou poulie : même croissance [88].
    - Changement : ajouter « ou Élévations latérales à la poulie · étage 1 » aux deux lignes d'élévations, et à 45 min prendre ce remplaçant. Vigilance : la note dit « toujours le même outil pour un exercice » ; garder la poulie pour toutes les séances à 45 min. Pour B, le développé épaules et l'incliné à la machine de la partie 2 sont « à vérifier sur place ».

14. **Courbatures : ne calmer que les exercices touchés**
    - Où : `src/40-progres.js:650-652` (`boostAvant`).
    - Aujourd'hui : un seul exercice marqué courbatures (`x.courb`), ou un seul exercice allégé, et toute la carte passe en « calme » : aucun record poussé, même sur les muscles sans courbatures.
    - Études : courbatures fortes : seulement ce muscle à 2 séries, un tiers plus léger [113] ; refaire un muscle courbaturé n'aggrave pas [112] ; les autres muscles font une séance normale.
    - Changement : traiter `x.courb` comme `x.fatigue` (ligne 668) : écarter ces exercices des records, ligne « calme » seulement si tous les exercices sont touchés.

15. **Demi-répétitions étirées en fin de dernière série**
    - Où : `Guide des exercices.md`, fiches Leg curl assis et Élévations (version poulie).
    - Études : la note, « Ce que tu fais » (Amplitude) : dernière série du leg curl ou des élévations à la poulie, 3 à 5 demi-répétitions dans la moitié étirée quand la complète ne passe plus [81] ; la moitié étirée fait grossir autant que le mouvement complet [77-79].
    - Changement : ajouter « Dernière série : quand tu ne peux plus faire de répétition complète, ajoute 3 à 5 demi-répétitions du côté étiré. »

16. **XP des séries : pas au-delà des séries prévues**
    - Où : `src/42-niveau.js:101-102` (+5 par série, sans plafond).
    - Études : au-delà d'environ 8 séries directes pour un même muscle dans une séance, une de plus ne rapporte rien de mesurable [28] (prépublication, preuve faible) ; pas plus de 20 par semaine la première année [11, 27].
    - Changement : compter au plus les séries prévues de la séance (simple), ou au plus 8 directes par muscle (`L.REPERES_VOLUME.parSeance`).

17. **« Première fois » : dire 2 séries**
    - Où : `src/40-progres.js:713-727` (`boostAvant`, type `depart`).
    - Études : « Exercice nouveau : la première fois en 2 séries, sans aller au bout » (avis) [110].
    - Changement : finir la phrase par « 2 séries, sans aller au bout. »

18. **Tour d'épaules : ne montrer la hausse qu'après 12 semaines**
    - Où : `src/40-progres.js:577-583`.
    - Aujourd'hui : la ligne « Épaules : a → z cm » s'affiche dès 2 mesures, même à 2 semaines d'écart.
    - Études : « Juge tes progrès sur 12 semaines (charges, tour d'épaules, photos), pas sur 2 » ; les premières séances font gonfler le muscle (de l'eau), la vraie prise se voit vers 18 séances [108, 109].
    - Changement : afficher la ligne seulement si la première et la dernière mesure sont espacées d'au moins 84 jours.

19. **Créatine : pas « le seul » complément**
    - Où : `Manger simple.md:48`.
    - Études : la créatine est « le complément le mieux prouvé » [148-151] ; la caféine aide un peu aussi à 3 à 6 mg/kg [154, 155], mais abîme le sommeil [5].
    - Changement : « La créatine est le complément le mieux prouvé ; elle reste facultative (3 à 5 g par jour). La caféine aide un peu aussi, mais pas pour tes séances du soir : elle abîme le sommeil. »

20. **Tennis**
    - Où : absent ; `Débuter à la salle.md`, « Ce qui compte en dehors de la salle ».
    - Études : aucune sur le tennis ; la note conclut à partir de la course et du fractionné [83, 127-129] : « un jour sans salle, ou au moins 3 h après ta séance ; pas de grosse séance de jambes juste avant un match ».
    - Changement : ajouter cette ligne.

21. **Une erreur dans la note elle-même**
    - Où : `La bonne séance.md:216`.
    - Aujourd'hui : « talons sous le siège au leg curl » pour « le côté étiré ». C'est le côté contracté ; le Guide a raison (« jambes presque tendues »).
    - Études : le leg curl assis fait mieux parce que l'arrière des cuisses travaille étiré, jambes tendues [91].
    - Changement : « jambes presque tendues au leg curl ». Ne pas toucher au Guide.

Petit texte en plus : la case 2 du dimanche dit « 0 à 3 en réserve » mais échoue sur « 3 ou plus ». La logique est juste (un « 3 » ressenti vaut souvent 5 [15]) ; titre plus clair : « Séries dures : 2 ou moins en réserve à la dernière série ».

### Écartés après revérification

- « Bon retour… une version de 45 min ? » à retirer : déjà fait, `bonRetour` ne contient plus cette phrase.
- « Même courte, elle compte » (`40-progres.js:167`) : pas contraire à la note ; la séance de 45 min garde toutes les séries [20]. Garder.
- `Débuter à la salle.md:39` « commence trop léger » : une première séance légère protège les suivantes [110]. Le vrai risque (charges trop légères ensuite [51]) n'a pas de règle dans la note : voir « Pas couvert ».

## Sans étude, gardé parce que pratique

Ton avis sur chacun :
- Semaine légère : pas de nouvelle proposition dans les 4 semaines après un « non », ni si une est prévue dans les 3 semaines.
- Ordre de départ : l'étage qui a du cardio, puis du plus proche au plus loin ; un exercice sans étage suit le précédent.
- Classement des exercices (gros, bras, gainage ; tirer, pousser, jambes) : sert à l'ordre, aux paires, au repos par défaut.
- Charges de départ estimées (tirage vertical 40 kg, presse 60, élévations 4, curl 7…). Le curl à 7 kg n'existe pas si les haltères vont de 2 en 2 : vérifie sur place, sinon 6 kg (`05-images.js:47`).
- Charge d'approche arrondie au pas ; une seule approche en superséries (proche de « 1 série légère de tirage », partie 2).
- Vélo d'échauffement au niveau 8 au départ.
- Durée estimée : 1 min par changement d'étage et 45 s par approche ; ton rythme réel (médiane des 5 dernières séances, entre 0,8 et 1,5).
- « Passer » un exercice (douleur, fatigue, pas le temps).
- Carte « Bon retour » dès 5 jours sans séance, et +50 XP.
- XP « séance faite » : 100 si 70 % des séries prévues ou 10 séries, sinon 50.
- Comparaison avec la fois d'avant, série par série (pour les 5 cases et les XP).
- Pas de record poussé sur la zone d'une douleur « qui tire ».
- « Y aller quand même » le lendemain d'une séance (va contre les 48 h, le choix reste à toi).
- Tour d'épaules toutes les 2 semaines ; préparer le sac la veille.

## Pas couvert par la note

La note ne dit rien ; ton avis :
- Planche : +5 s par séance, version plus dure (un pied levé) à 60 s partout.
- « 3 ou plus » en réserve sous le haut de la fourchette : +2 répétitions visées (le sens va avec [15]).
- Charge de départ bien trop légère : rien pour monter de plusieurs pas d'un coup ; aujourd'hui, un pas par séance au plus.
- Semaine légère : un exercice à 2 séries passe à 1 (la note dit « divisées par deux », et ailleurs « jamais 1 »).
- Régularité : une semaine sous l'objectif est « rattrapée » si la suivante en a 4 (et +100 XP). La note dit de rattraper « dans la même semaine » ; 4 séances en 7 jours ne laissent pas 48 h partout.
- Ligne de régularité dès 2 semaines de suite dans « Tes progrès ».
- XP : records +40, bonus de semaine +150, niveaux et titres, estimation des séances avant le niveau suivant. Les études sur les récompenses sont dans `recherche/2026-11-14-interfaces.md`, pas dans « La bonne séance ».
- Formule d'Epley pour trier les hausses (jamais affichée).
- Écarté, butterfly, pec deck comptés ½ triceps (aucun dans ton programme aujourd'hui).
- Guide : « prise neutre = un peu plus de biceps » ; « le face pull équilibre la poussée et garde les épaules en arrière ».

## Conforme (résumé)

- **Semaine** : 3 séances, lundi-mercredi-vendredi (2 : lundi-jeudi) [26] ; A/B tout le corps [11, 46] ; pas de séance le lendemain d'une autre par défaut ; séance ratée rattrapée dans la semaine ; une pause ne casse rien [123, 124] ; « Tu n'as rien perdu » de 7 à 21 jours.
- **Séance** : 1 h par défaut, 21-22 séries ; ordre carrure d'abord, bras et planche en dernier [10, 82] ; 45 min = sans les « option », superséries tirer + pousser ou avant + arrière des cuisses, aucune série coupée, 1 min 30 après le tour [20, 36] ; jamais de séries coupées pour tenir le temps.
- **Échauffement** : 5 min de vélo facile [6], approches 8 × 50 % et 4 × 75 % [7, 8], pas d'étirements [9].
- **Séries et repos** : 3 sur les gros, 2 sur les petits [11, 12] ; fourchettes 8-12, 10-15, 12-20 [11] ; repos 2 min, 1 min 30, 1 min [16, 17] ; tempo 1 s / 2 s [18, 75] ; amplitude complète [19, 76].
- **Effort** : 2 en réserve, dernière série 1 ou 0 sur machine et poulie, jamais d'échec aux développés aux haltères [11, 13, 14] ; « il t'en reste souvent 4 ou 5 » [15] ; première fois : arrête à 2.
- **Progression** : double progression, +1 répétition puis un pas [31, 62, 63] ; « 12 à la 1re série et 3 ou plus : monte » ; sous le bas : un pas de moins [11] ; pas : 2,5 kg machine, 5 kg presse, 1-2 kg haltères [64].
- **Mise en route et cas spéciaux** : 4 séances à 2 séries sans les « option » [110] ; exercice nouveau : 2 séries ; courbatures fortes : un tiers plus léger [113] ; nuit courte ou fatigué : pas de record [120] ; semaine légère aux finaux (18/01/2027), séries divisées par deux, mêmes charges [34, 35].
- **Volume et suivi** : comptage 1 et ½ [37] ; repère 10 à 15 par muscle, 20 au plus, 8 directes par séance [11, 27, 28] ; les 5 cases du dimanche (partie 4) ; protéines max(110 g, 1,6 g/kg) [29] ; sommeil 7 h 30 [1] ; poids +0,7 à 1,5 kg par mois, pesée 3 fois par semaine [30] ; seules les hausses affichées.
- **Programme et Guide** : chaque exercice, ses séries, repos et réglages (prise 1,5 fois les épaules [85], banc à 30° [89], leg curl assis [91], triceps au-dessus de la tête [92], élévations à chaque séance [87, 88]).
- **Repas et soir** : goûter si le déjeuner date de plus de 4 h [3, 4] ; 30 à 40 g de protéines au dîner, pas de fenêtre de 30 min [21] ; pas de bain froid, d'ibuprofène ni d'alcool [22, 23, 24] ; finir 1 h avant le coucher [25] ; gourde de 50 cl [146, 147].
