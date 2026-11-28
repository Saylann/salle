'use strict';
/*
 * Plugin Obsidian « Salle » : le carnet de musculation de l'utilisateur (Mac et iPhone).
 *
 * Principes (voir README.md, « Règles » et « Comment le code est écrit ») :
 *  - tout ce qui compte est dans des notes lisibles : le programme, chaque séance, les mesures, le guide ;
 *  - le plugin reconnaît ses notes à la ligne « salle: … » de leur en-tête, jamais à leur nom ni à leur dossier :
 *    renommer ou déplacer une note, ou renommer le coffre, ne casse rien ;
 *  - si la note du programme manque ou devient illisible, le programme d'origine prend le relais ;
 *  - la logique pure est dans L (jsc tests/lancer.js), l'écran dans VueSalle (jsc tests/rendu.js), le plugin dans SallePlugin.
 * Sources : src/*.js, assemblés dans l'ordre des noms par construire.py en un seul main.js (sans npm, sans compilation).
 * Après une modification : sh installer.sh (il fabrique main.js et styles.css, lance les tests, puis installe).
 *
 * Versions (une ligne chacune ; le détail : ~/Desktop/CLAUDE/Salle-travail/DECISIONS.md, hors du coffre) :
 *  1.11.0  icônes Lucide, variables CSS d'Obsidian, gros chiffres, minuteur de repos.
 *  1.12.0  l'échauffement en premier, la séance et le jour décidés par le plugin.
 *  1.13.0  le bilan « Avant de commencer », le carnet Forme, « Il t'en restait combien ? ».
 *  1.14.0  l'étage et le réglage de chaque exercice.
 *  1.15.0  « Passer » un exercice, le niveau du vélo, le record en direct.
 *  2.0.0   (14/11/2026) la refonte : sources dans src/, la séance calée sur la recherche « La bonne séance ».
 *  2.0.1   (15/11/2026) « À battre aujourd'hui » avant la séance.
 *  2.1.0   (15/11/2026) le style « sportif et net », le niveau et ses XP.
 *  2.1.1   (15/11/2026) sur iPhone, l'écran ne glisse plus.
 *  2.1.2   (15/11/2026) « Avant de commencer » en 3 questions, d'après les études.
 *  2.2.0   (15/11/2026) les paliers par séances faites, mesures et photo.
 *  2.3.0   (15/11/2026) les règles alignées sur les études.
 *  2.3.1   (15/11/2026) une note dans un dossier d'archives n'est jamais lue.
 *  2.4.0   (15/11/2026) « Le physique qui plaît » : élévations, tour de taille, mètre ruban.
 *  2.4.1   (15/11/2026) code réorganisé, comportement identique.
 *  2.5.0   (15/11/2026) le programme réparti selon « Ce qui plaît » : élévations à 4 séries en B aussi, curl sans « option »,
 *          planche en « option » ; les sources de chaque choix en commentaire caché dans Programme.md.
 *  2.5.1   (15/11/2026) des textes courts : 2 lignes au plus à 375 px, le « Pourquoi » replié (texteCourt, tests t99, r99).
 *  2.6.0   (15/11/2026) le coffre ne garde que le projet : recherches, archives, décisions et sources du programme
 *          sortis dans ~/Desktop/CLAUDE/Salle-travail/ ; plus de commentaire caché dans Programme.md.
 *  2.7.0   (15/11/2026) son physique (mince) : une pesée par semaine, la tendance face à +0,18 à 0,35 kg par semaine
 *          (Mesures, une ligne sur l'accueil), le conseil de collation ; « Manger simple » pour prendre du muscle.
 *  2.8.0   (15/11/2026) plus de note « Débuter » : tempo, fiche, douleur, repos et « malade » dits au moment de l'exercice.
 *  2.9.0   (15/11/2026) fiches en champs (nom petit, texte gros) ; questionnaire de 6 questions et « Réinitialiser » ; Programme et Ma salle à l'essentiel.
 *  2.10.0  (15/11/2026) les paliers s'atteignent par les XP ; une carte « Cette semaine » ; « Commencer » commence.
 *  2.11.0  (15/11/2026) les XP suivent les études de l'arrêt (rien avant 3 semaines) ; séries légères en étapes obligatoires ; repos en plein écran.
 *  2.11.1  (15/11/2026) repos sans bouton (ni −15 s, ni +15 s, ni Passer) [17] ; carte d'exercice rangée : étape, cible, geste, tableau, consignes.
 *  2.12.0  (15/11/2026) repos après les séries légères [8] ; repères du geste et question dans le repos ; consignes jusqu'à « Compris » ; bouton « Aide ».
 *  2.13.0  (15/11/2026) la passe « études ↔ séance » : amplitude, eau, attention, ventre serré, étirements, sommeil ; 1 série de plus sur un exercice bloqué (avis).
 *  2.13.1  (15/11/2026) les consignes vertes sont toujours affichées : plus de « vue une fois », plus de bouton « Compris ».
 *  2.13.2  (15/11/2026) la bulle retirée en 2.12.0 revient : la série légère (ex « b-approches »), à la place de la réserve.
 *  2.13.3  (15/11/2026) ce qui s'ouvre s'ouvre sous son bouton : l'aide sous « Aide » (avant la bulle verte), le menu « … » sous l'en-tête.
 *  2.14.0  (15/11/2026) le repos se lit à bout de souffle : 2 à 5 mots par ligne, ✓ à faire, ✕ à éviter (champ « À retenir » du guide) ; « ventre dur comme une canette pleine ».
 *  2.14.1  (16/11/2026) le bloc du geste entre deux traits : le deuxième trait sous « Aide » ; la fiche d'aide s'ouvre dedans.
 *  2.14.2  (16/11/2026) plus de record annoncé avant la séance ; au bilan, « Bravo ! » et les succès de la séance (L.succesSeance).
 *  2.14.3  (16/11/2026) le réglage quitte la carte de l'exercice : il est dans l'aide.
 *  2.14.4  (16/11/2026) dans l'aide, le réglage garde sa forme d'étiquette (la pastille « Réglage : … »), en premier.
 *  2.14.5  (16/11/2026) une séance annulée : les questions d'avant (douleur, courbatures, nuit) se reposent au prochain départ.
 *  2.15.0  (16/11/2026) l'accueil : la carte « Manger » sous la semaine (les 2 points les plus solides des études), à la place de la tuile.
 *  2.15.1  (16/11/2026) « Manger » s'ouvre sur l'objectif de protéines et les aliments qui les apportent (œufs, thon, poulet…).
 *  2.16.0  (16/11/2026) l'accueil : la carte « Manger » montre les repas de chaque jour (« Ta journée » de la note), avec leurs « ou ».
 *  2.17.0  (16/11/2026) « Les courses de la semaine » : une vraie liste, un produit par ligne, qu'on coche d'un toucher.
 *  2.18.0  (16/11/2026) « Manger » : un onglet par repas (Matin, Midi, Goûter, Soir), ses plats, la recette au toucher ; les courses en bas.
 *  2.18.1  (16/11/2026) courses : alignées à gauche sur l'iPhone, « Tout décocher » toujours visible, en haut.
 *  2.18.2  (16/11/2026) à l'ouverture d'Obsidian : toujours l'accueil (ou la séance en cours), plus l'écran gardé d'une autre fois.
 *  2.19.0  (16/11/2026) l'accueil : la carte « Manger » montre le repas du moment, d'après l'heure (matin, midi, goûter, soir).
 *  2.20.0  (16/11/2026) l'accueil : la carte « Manger » dit aussi quand boire (un grand verre d'eau avec le repas du moment).
 *  2.21.0  (16/11/2026) le repos avant un nouvel exercice montre sa petite animation, sous « Ensuite : … ».
 *  2.22.0  (16/11/2026) rien de personnel dans le code : charges de départ d'après le poids, salle et étages demandés par le questionnaire ; « Corriger » la dernière série.
 *  2.22.1  (17/11/2026) plus aucun prénom dans le dossier du plugin (commentaires, tests, fiche) ; contrôle tests/perso.py ; note « Démarrer ici » retirée.
 *  2.23.0  (17/11/2026) le guide des exercices et « Manger » sont dans le plugin : le coffre ne garde que les données (programme, mesures, forme, salle, séances).
 *  2.24.0  (17/11/2026) un seul dossier pour ce qui dépend de l'utilisateur (« Données ») : toute nouvelle note, séance ou photo y va.
 *  2.25.0  (17/11/2026) les réponses au questionnaire sont une note « Réglages » de ce dossier ; data.json ne garde que le brouillon (séance en cours, bilan).
 *  2.26.0  (17/11/2026) le fichier d'état pour le widget iPhone (etat-iphone.json) et les renvois à la note « Connexions iPhone » sont retirés : jamais installés.
 *  2.27.0  (17/11/2026) plus de doublons : les photos sont dans main.js, rien de fabriqué ne reste dans l'atelier (dossier rangé : src, modeles, images, tests, outils).
 *  2.28.0  (17/11/2026) « Réinitialiser » efface le dossier des données (corbeille) et le questionnaire le recrée en entier ; objectifs/esthetique/ : les textes de l'objectif.
 *  2.29.0  (17/11/2026) rangement de l'intérieur : src en familles, un dossier par exercice (commun/exercices), paliers et progression dans objectif.json.
 *  2.30.0  (17/11/2026) le brouillon (séance en cours, bilan du jour) est dans le dossier des données (Brouillon.json) ; le dosage dans objectif.json.
 *  2.31.0  (17/11/2026) bras et avant-bras travaillés dans les deux séances ; le rapport épaules sur taille affiché ; les mesures pilotent le programme.
 *  2.32.0  (17/11/2026) fessiers (hip thrust à la barre) et abdos chargés (crunch à la poulie haute) dans les deux séances ; la planche en option part.
 *  2.33.0  (17/11/2026) l'onglet Programme montre la petite animation de chaque exercice.
 *  2.34.0  (17/11/2026) le niveau du vélo redit à la fin ; son réglage de chaque machine noté dans l'aide et gardé dans ses données.
 *  2.34.1  (17/11/2026) une note « Réglages » illisible un instant n'efface plus la séance en cours (faute de la 2.30.0).
 *  2.35.0  (17/11/2026) la durée annoncée suit le vrai rythme (borne 2,5) ; dans un étage, les machines ensemble et les
 *                       haltères ensemble ; hip thrust retiré du programme livré, crunch à 3 séries ; la presse compte
 *                       à moitié pour les fessiers ; « Charge notée » sur les machines à disques.
 *  2.35.1  (17/11/2026) programme livré : curl à la barre en Z en A aussi (les haltères en remplaçant) ; crunch revenu à 2 séries.
 *  2.36.0  (17/11/2026) l'ordre de la séance suit l'ordre du programme (les priorités d'abord), étage par étage et salle
 *                       par salle ; un exercice des bras n'attend la fin que s'il gênerait un gros exercice ; la presse
 *                       compte en plein pour les fessiers ; les fiches disent les muscles qui aident.
 *  2.36.1  (17/11/2026) programme livré : celui validé le 17/11 (A 24 séries, B 27, écrit par priorités) ; un exercice
 *                       écrit dans plusieurs séances gagne sa série en plus dans une seule.
 *  2.36.2  (17/11/2026) accueil et « Ta séance d'aujourd'hui » : la durée estimée seule ; la ligne « Ça dépasse ton temps
 *                       du jour » est retirée.
 *  2.36.3  (17/11/2026) fin du repos : « GO » en très gros, repères lisibles sur le fond lime ; le réglage du banc sous la
 *                       charge, en gros ; sans appareil à régler : « Position », et plus de champ de réglage.
 *  2.37.0  (17/11/2026) la charge de la séance suivante se règle sur ce qu'il a fait et sur sa réserve, avec les charges qui
 *                       existent sur l'appareil (35-charge.js) : jamais hors du cran, fourchette allongée quand le cran
 *                       est gros, plusieurs crans quand c'est trop léger ; dernière série ouverte (« 12+ ») ; jamais
 *                       fait : la série 1 sert de test ; même appareil, autre prise : sa charge ; disques par côté.
 *  2.38.0  (18/11/2026) noms de fichiers aux conventions (minuscules, sans accent ni espace) : « donnees/reglages.md »,
 *                       « donnees/seances/2026-11-16-seance-a.md », « donnees/brouillon.json » ; les noms d'avant sont
 *                       renommés tout seuls au démarrage (95-noms.js), jamais pendant une séance ni par-dessus un fichier.
 *  2.38.1  (19/11/2026) repos avant un nouvel exercice : sa charge et ses séries en gros (« 8 kg × 13 · 2 séries »).
 *  2.38.2  (19/11/2026) menu « … » d'un exercice commencé : « Noter une série en plus ».
 *  2.38.3  (19/11/2026) pendant une séance, la barre d'Obsidian remise par un toucher ou un retour dans l'appli repart aussitôt.
 *  2.38.4  (19/11/2026) la séance libre compte dans les 4 séances de mise en route.
 *  2.38.5  (20/11/2026) pendant une séance, plus de bande noire en haut : la vue monte jusque sous l'encoche.
 *  2.38.6  (20/11/2026) tableau des séries : « nouvelle » au lieu de « — » pour une série que la fois d'avant n'avait pas.
 *  2.38.7  (20/11/2026) la cible en gros : les chiffres prennent toute la largeur (jusqu'à 112 px), « 12+ » en gros aussi.
 *  2.38.8  (20/11/2026) l'animation de l'exercice à chaque repos ; « Pense au muscle » garde la majuscule de « Aide ».
 *  2.38.9  (20/11/2026) pendant la série, la carte ne garde que la cible, le réglage, l'effort et « Aide » ; le tempo, jusqu'où
 *                       aller, « Tu dois sentir » et la bulle verte passent au repos (et dans l'aide ouverte).
 *  2.38.10 (20/11/2026) repos épuré, comme les applis de musculation : le temps, ce qui vient, 3 repères au plus, la
 *                       consigne de la série qui vient ; la douleur, le malaise et les règles de la salle dans l'aide.
 *  2.38.11 (20/11/2026) écran des séries épuré : l'explication de la cible dans l'aide, « Aide » sans traits, plus de ligne
 *                       « Record : … » sous une série ni de « Ta meilleure ».
 *  2.38.12 (20/11/2026) la séance s'ouvre sur la carte (l'en-tête au-dessus) ; la respiration et « Tu dois sentir » de
 *                       retour sur la carte ; chiffres jusqu'à 88 px, titre à 26 px.
 *  2.38.13 (20/11/2026) la séance descend du haut par-dessus l'écran d'avant, qui se floute (comme le centre de
 *                       notifications d'Apple) ; elle remonte quand on la quitte.
 *  2.38.14 (20/11/2026) la carte tient à l'écran : « Aide » dans l'en-tête (l'aide s'ouvre dessous), tableau et saisie
 *                       plus serrés, chiffres jusqu'à 80 px.
 *  2.38.15 (20/11/2026) l'aide s'ouvre sous la séance (la cible au-dessus) ; « Fermer l'aide » remet la carte en haut ;
 *                       en-tête, image, saisie et gros bouton encore un peu plus serrés.
 *  2.38.16 (20/11/2026) les séries à venir sur une ligne (« Séries 3 et 4 : 4 kg × 22 ») ; « Corriger la dernière série »
 *                       dans le menu « … ».
 *  2.38.17 (20/11/2026) sur téléphone, la carte de l'exercice prend tout l'écran ; le tableau des séries en bas, près du pouce.
 *  2.38.18 (20/11/2026) (retiré en 2.38.19 : mal compris) la séance en verre sur l'accueil flou.
 *  2.38.19 (20/11/2026) « La séance » (la liste des exercices) : un panneau en verre qui monte par-dessus la carte, floue
 *                       derrière, comme le centre de contrôle d'Apple ; « Exercice … sur … » ou le nom de la séance l'ouvrent.
 *  2.38.20 (20/11/2026) sur téléphone, la page de séance ne défile plus : l'en-tête en haut, la carte au milieu, le gros
 *                       bouton en bas ; une croix ferme le panneau « La séance ».
 *  2.38.21 (20/11/2026) sur téléphone, l'en-tête de séance est caché : une poignée le fait descendre par-dessus la carte.
 *  2.38.22 (20/11/2026) l'en-tête descendu : sans croix, un toucher sur le reste de l'écran le referme.
 *  2.38.23 (20/11/2026) glisser vers le haut : « La séance » ; vers le bas : l'en-tête ; l'aide en feuille par-dessus la carte,
 *                       le menu « … » en bulle ; tous se ferment d'un toucher à côté.
 *  2.38.24 (20/11/2026) les séries à venir de nouveau une par ligne (plus « Séries 2 à 4 : … »).
 *  2.38.25 (20/11/2026) l'aide en lignes courtes avec icônes : réglage, repères, à éviter, charge à noter, sécurité.
 *  2.38.26 (20/11/2026) la carte de séance ne défile plus : elle se réduit juste assez pour tenir (70 % au moins).
 *  2.38.27 (20/11/2026) les panneaux se tirent (ils suivent le doigt) et partent en glissant au lieu de disparaître d'un coup.
 *  2.38.28 (20/11/2026) l'aide de nouveau détaillée (la fiche par rubriques, la sécurité) ; la carte de séance sans arrondis :
 *                       c'est la page.
 *  2.38.29 (20/11/2026) « La séance » et l'aide : tirées vers le haut, elles montent jusqu'en haut de l'écran en suivant le doigt.
 *                       Plus de poignée en haut (l'en-tête descend en glissant) ; le bouton du bas posé sur la page, sans filet.
 *  2.38.30 (20/11/2026) La saisie du poids et des rép. grandit avec la place libre au-dessus du tableau.
 *  2.38.31 (20/11/2026) « Annuler la séance » : au premier toucher, le bouton change sur place ; le panneau ne revient plus en haut.
 *  2.38.32 (20/11/2026) De l'espace au-dessus de la ligne en cours (cadre jaune).
 *  2.38.33 (20/11/2026) Le bloc de saisie aéré : espace intérieur, lignes écartées, détaché en dessous.
 *  2.38.34 (20/11/2026) Glisser plus fluide : « La séance » suit le doigt dès le début ; les feuilles se tirent sans changer de hauteur.
 *  2.38.35 (20/11/2026) Échauffement : la phrase en entier, plus de vide sous le titre ; niveau et minuteur en bas.
 *  2.38.36 (20/11/2026) Le menu « … » naît de son bouton et grandit (comme un capteur photo) ; il y rentre en se fermant.
 *  2.38.37 (20/11/2026) « Machine prise : j'y reviens après » retiré du menu « … » (il change d'exercice dans « La séance »).
 *  2.38.38 (20/11/2026) « Changer le réglage de la machine (programme) » retiré du menu « … ».
 *  2.38.39 (20/11/2026) Défilement de « La séance » fluide : écouteurs non bloquants, pas de flou en grand, lignes fixes sous le doigt.
 *  2.38.40 (20/11/2026) Pendant la séance, la carte commence juste sous l'encoche (environ 26 px de gagnés).
 *  2.38.41 (20/11/2026) Sur la carte, sous le geste : les « à retenir » et « à éviter » de la fiche, tant qu'il y a la place.
 *  2.38.42 (20/11/2026) Ces conseils passent au repos, avec l'effort de la série qui vient ; le repos commence sous l'encoche.
 *  2.38.43 (20/11/2026) « Par côté » et l'effort en deux pastilles avec icône sous la charge.
 *  2.38.44 (20/11/2026) Série légère : plus de « Pour t'échauffer, sans forcer » sous la charge.
 *  2.38.45 (20/11/2026) L'en-tête descend avec le doigt (comme « La séance ») ; glisser vers le haut (en haut de l'écran) le referme.
 *  2.38.46 (20/11/2026) Les boutons du haut de la carte de nouveau touchables (barre d'Obsidian retirée) ; l'image moins collée.
 *  2.38.47 (20/11/2026) Le « GO » de fin de repos reste 1,5 s au lieu de 5 s.
 *  2.38.48 (20/11/2026) Pastilles à la taille d'avant ; l'aide s'ouvre en grand et défile tout de suite ; « Comment faire » retiré du menu.
 *  2.38.49 (20/11/2026) Repos avant un nouvel exercice : la charge, puis les séries sur une 2e ligne ; le réglage sans « Réglage : ».
 *  2.38.50 (20/11/2026) Le réglage de la machine (sa fiche) revient sur la carte, sous la charge, jusqu'à la 1re série faite.
 *  2.38.51 (20/11/2026) Glissements jamais bloqués : liste défilée à mi-hauteur, geste repris par l'iPhone.
 *  2.38.52 (20/11/2026) Un peu plus d'espace sous la saisie, dans le cadre jaune.
 *  2.38.53 (20/11/2026) Repos : « Ensuite : série 2 sur 3 », puis la charge en gros sur sa ligne.
 *  2.38.54 (20/11/2026) « Pense à tes triceps, l'arrière du bras » au lieu de « Pense au muscle : les triceps… ».
 *  2.38.55 (20/11/2026) L'aide passe dans « … » (« Comment faire ») ; plus de bouton « Aide » dans l'en-tête de la carte.
 *  2.38.56 (20/11/2026) Feuilles plus sûres au doigt : animation finie au toucher suivant, vitesse du dernier instant, liste puis feuille.
 *  2.38.57 (20/11/2026) La barre d'Obsidian cachée de base sur tous les écrans du plugin ; elle revient en remontant la page.
 *  2.38.58 (20/11/2026) Plein écran dès l'arrivée dans le plugin (sans la bande du haut) ; plus de bouton « Plein écran ».
 *  2.38.59 (20/11/2026) Un changement de poids ou de répétitions en vert, avec sa pastille (carte et repos).
 *  2.38.60 (20/11/2026) Un crayon sur la dernière série notée pour la corriger (le menu « … » le garde aussi).
 *  2.38.61 (20/11/2026) Pendant une correction, la série en cours n'affiche pas sa saisie.
 *  2.38.62 (20/11/2026) Plus de badge « = » sur une série faite pareil que la fois d'avant.
 *  2.38.63 (20/11/2026) De l'espace au-dessus du « GO » ; le changement lisible sur son fond vert.
 *  2.38.64 (20/11/2026) Check-up : 14 bugs corrigés (correction et gros bouton, double toucher, sauvegarde, réglages, couleurs du
 *                       repos…) ; la pastille des rép. dit le progrès depuis la fois d'avant.
 *  2.38.65 (20/11/2026) Glissement : plus de fondu pendant le geste, pas de défilement natif sous la carte, plus de bande morte.
 *  2.38.66 (20/11/2026) Accueil : un bouton rond en haut à gauche ouvre le volet des fichiers d'Obsidian (téléphone).
 *  2.38.67 (20/11/2026) Programme (son accord) : en B, élévations latérales à la machine au lieu du développé épaules (resté en
 *                       remplaçant ; photo libre CC BY-SA 4.0, Aliva Sahoo, Wikimedia Commons) ; curl à la barre en Z au pupitre (debout si c'est pris).
 *  2.38.68 (20/11/2026) Aide : « Voir le mouvement en vidéo » quand la fiche a une ligne « Vidéo » (élévations à la machine).
 *  2.38.69 (24/11/2026) Ordre (son accord) : les muscles alternent ; après des élévations latérales viennent les jambes, jamais
 *                       les bras ni le développé. Dans un étage, le moteur suit l'ordre écrit du programme (plus de regroupement par
 *                       salle) ; entre deux étages, un étage se finit toujours avant l'autre. La série de plus du 1 h 15 va aux
 *                       exercices marqués « priorité » dans le programme : aucune série ne change.
 *  2.38.70 (24/11/2026) Curl à la barre en Z : les photos montrent le curl au pupitre, comme la fiche (avant : le curl debout ;
 *                       photos de free-exercise-db, domaine public).
 *  2.38.71 (24/11/2026) Ordre (son accord, études) : l'extension triceps juste après les tirages (A et B) ; un exercice des bras
 *                       n'attend la fin que si son gros exercice vient juste après. « La séance » : l'exercice choisi (machine
 *                       prise) passe devant ; sur téléphone, la liste trop longue s'ouvre en grand et le geste décide après 8 px.
 *  2.38.72 (24/11/2026) « La séance » : toucher ne change plus l'ordre ; un exercice fait passe en bas, barré ; l'exercice suivant
 *                       est le premier pas fini (on revient à celui laissé) ; ouverte en grand, elle part d'un geste vers le bas ;
 *                       pendant la séance, Obsidian ignore les gestes de l'écran (data-ignore-swipe) : défilement plus fluide.
 *  2.38.73 (24/11/2026) « La séance » en grand : un geste commencé liste défilée reste un défilement jusqu'au bout (plus d'à-coup
 *                       quand la liste arrive en haut) ; on la ferme d'un nouveau geste depuis le haut.
 *  2.38.74 (24/11/2026) « La séance » et l'aide comme sur le Mac : le téléphone les fait défiler seul, le code ne suit plus le
 *                       doigt dedans ; fermer : la croix (ou « Fermer l'aide ») ou un toucher à côté.
 *  2.38.75 (24/11/2026) « La séance » et l'aide : glisser vers le bas, liste tout en haut, les ferme de nouveau ; le code écoute
 *                       sans bloquer et ne bouge la feuille que si la liste ne peut pas défiler (défilement intact).
 *  2.38.76 (24/11/2026) Ordre de A (son accord) : à l'étage 2, les élévations d'abord (salle des haltères), puis presse,
 *                       développé incliné, curl, leg curl (salle des machines) : un seul changement de salle au lieu de deux.
 *  2.38.77 (24/11/2026) La barre du bas d'Obsidian bloquée sur tous les écrans du plugin : elle ne revient plus en remontant
 *                       ni en glissant (pour sortir : le bouton du volet, en haut à gauche de l'accueil).
 *  2.38.78 (24/11/2026) Ordre de A (son accord ; sa règle : pouvoir faire le mouvement de l'exercice d'après) : l'extension
 *                       triceps entre les deux tirages, qui ne s'enchaînent plus (dos, biceps et avant-bras en commun).
 *  2.38.79 (24/11/2026) Sa salle (le pupitre du curl est avec les haltères ; presse, leg curl, développé à la machine dans
 *                       l'autre salle) : en A, le curl en dernier, après le leg curl : 2 changements de salle au lieu de 3.
 *  2.38.80 (24/11/2026) Le programme de chaque utilisateur suit le programme livré à chaque nouvelle version : mêmes exercices,
 *                       ses lignes dans le nouvel ordre (son contenu gardé) ; d'autres exercices, le programme livré (l'ancien
 *                       gardé dans le dossier du plugin). Jamais dans le coffre où le plugin est fabriqué.
 *  2.38.81 (25/11/2026) Une vidéo du geste pour chacun des 24 exercices (ligne « Vidéo » de chaque fiche) : le bouton
 *                       « Voir le mouvement en vidéo » en tête de l'aide de la séance, et dans le guide.
 *  2.38.82 (25/11/2026) La vidéo aussi pendant la séance : un bouton « Vidéo » dans l'en-tête de la carte, à côté de « … ».
 *  2.38.83 (25/11/2026) La vidéo lue dans l'app (le lecteur d'Obsidian pour YouTube), à la forme de son image, avec
 *                       « Ouvrir dans YouTube » en secours : feuille de la vidéo pendant la séance, lecteur sous le bouton du guide.
 *  2.38.84 (25/11/2026) La vidéo remplace les photos : vignette de la vidéo (▶) sur la carte, au repos et dans Programme, lue en
 *                       grand dans l'app ; la vidéo directement dans l'aide et le guide. Sans vidéo ou sans réseau : les photos.
 *  2.38.85 (25/11/2026) À côté de la date de l'accueil : « · À jour », ou « · Mettre à jour » (la version publiée, lue sur
 *                       GitHub au démarrage puis toutes les 6 h ; un toucher ouvre BRAT).
 *  2.38.86 (25/11/2026) La vidéo démarre sans le son ; en grand (ouverte d'un toucher), elle démarre tout de suite.
 *  2.38.87 (25/11/2026) Sans le son, la vidéo tourne en boucle sans boutons et garde les touchers (le son ne se rallume plus) ;
 *                       « Avec le son » la relance avec le son.
 *  2.38.88 (25/11/2026) « À jour » juste : la version lue dans la dernière publication (le manifeste du dépôt restait 5 min en
 *                       cache) ; relue au retour dans l'appli et toutes les heures.
 *  2.38.89 (25/11/2026) Sur Android, le son reste coupé : le plugin commande le lecteur YouTube (« coupe le son » chaque demi-seconde).
 *  2.38.90 (25/11/2026) « À jour » revérifié à chaque arrivée sur l'accueil (une minute d'écart au moins).
 *  2.38.91 (25/11/2026) « Ton temps aujourd'hui ? » dans « Avant de commencer » : « Peu de temps » = la version 45 min
 *                       (superséries, toutes les séries gardées, pas de cardio de fin) ; une supersérie ne réunit plus deux
 *                       exercices qui partagent un muscle, ni un développé avec des élévations.
 *  2.39.0  (25/11/2026) « Manger » : « Calories d'un plat » : une photo du plat → ses calories et ses protéines, estimées par
 *                       l'API Gemini de Google (offre gratuite, clé de l'utilisateur dans data.json, Réglages → Appli).
 *  2.39.1  (25/11/2026) Accueil : sur la carte « Manger », « 📷 kcal » à la place du › : il ouvre l'appareil photo, puis
 *                       « Manger » sur « Calories d'un plat ».
 *  2.39.2  (25/11/2026) La clé de « Calories d'un plat » se met seulement dans Réglages → Appli ; sans clé, « Manger » et
 *                       « kcal » y mènent par un lien.
 *  2.39.3  (25/11/2026) « Calories d'un plat » : ce qu'il manque au repas du moment, en calories (besoins du jour en prise
 *                       de masse : Mifflin-St Jeor × 1,55, +15 %) et en protéines (0,4 g par kg et par repas), avec quoi
 *                       ajouter ; Réglages → Appli : « Calories du jour » (taille, âge, sexe).
 *  2.39.4  (25/11/2026) « Calories d'un plat » : la clé Groq (gratuite, sans pièce d'identité ni selfie : Google en demande
 *                       maintenant pour AI Studio), reconnue à son début « gsk_ » ; une clé Google marche encore.
 *  2.39.5  (25/11/2026) « Calories d'un plat » marche sans clé : la photo passe par le relais de Salle (Cloudflare,
 *                       plugin-salle/relais/worker.js) ; une clé à soi passe avant.
 *  2.39.6  (25/11/2026) Calories plus justes : l'IA donne les aliments pesés et leurs valeurs pour 100 g, le plugin fait le
 *                       calcul ; le relais utilise l'IA de Cloudflare (Gemma 4), protégé : seulement une photo, le plugin,
 *                       5 photos par minute, et rien d'autre que des aliments chiffrés en retour.
 *  2.39.7  (25/11/2026) « kcal » dans la ligne du titre de la carte « Manger » (sur l'iPhone, il tombait sous la carte).
 *  2.40.0  (25/11/2026) « Manger » : « Calories d'un plat » en haut ; s'il manque des calories, quoi ajouter ; « Noter ce repas »
 *                       → le journal des repas (note donnees/repas.md) et le total du jour, dans « Manger » et sur l'accueil.
 *  2.40.1  (25/11/2026) Le suivi du jour présenté pour de vrai : une carte « Aujourd'hui » (jauges calories et protéines,
 *                       repas notés, « Validée ») en haut de « Manger », les mêmes jauges sur l'accueil ; les repas de « Manger »
 *                       rangés selon l'heure (le repas du moment d'abord). La semaine de l'accueil retrouve ses ronds (en
 *                       2.40.0, un style du suivi des repas mettait chaque jour dans une case grise).
 *  2.40.2  (25/11/2026) La carte « Manger » de l'accueil comme « Tes progrès » : « Aujourd'hui » et ce qu'il reste, les jauges,
 *                       l'échelle des repas du jour (cochés avec leurs kcal) ; puis le repas à viser, l'eau et les jours validés
 *                       de la semaine, en lignes à pastille.
 *  2.40.3  (25/11/2026) Plus de part par repas (il saute parfois le goûter ou le matin) : seul le total du jour compte. L'accueil
 *                       liste les repas en photo (plus de cases Matin-Midi-Goûter-Soir) ; « Manger » dit ce qu'il reste pour
 *                       la journée, plus « il manque à ce repas » ; Réglages : les kcal du jour, plus « par repas ».
 *  2.40.4  (25/11/2026) L'attendu de chaque repas qui reste : le reste du jour partagé entre eux (goûter : un demi-repas), le
 *                       dernier prend tout ; un repas sauté se rattrape sur les suivants. Sur l'accueil, le prochain repas et son
 *                       attendu ; dans « Manger », l'attendu de chaque repas qui reste, sous les repas en photo.
 *  2.40.5  (25/11/2026) Tout en kcal : les attendus et ce qu'il reste sont en kcal (les protéines restent dans leur barre).
 *                       Sans taille ni âge, l'accueil propose « Ta taille et ton âge » ; la journée se valide sur les kcal.
 *  2.40.6  (25/11/2026) Taille, âge ou sexe manquants : une feuille « Tes calories du jour » par-dessus l'accueil, qu'on ne
 *                       ferme qu'en répondant ; elle dit qu'on peut les modifier dans Réglages → Appli → Calories du jour.
 *                       Un repas en photo trop petit (un biscuit à 18 h) ne compte plus pour tout le repas : il reste attendu
 *                       (« encore 2 900 kcal »).
 *  2.40.7  (26/11/2026) Séance : après un exercice, le suivant ne travaille pas le même muscle s'il y en a un autre au même
 *                       étage (machine prise : plus deux élévations de suite). « Remplacer » propose le même muscle (plus un
 *                       développé pour des élévations), jamais un geste déjà fait ce jour-là.
 *  2.40.8  (26/11/2026) En B, si la machine d'élévations est prise : « Élévations latérales à la poulie » (même muscle) à la
 *                       place du développé épaules ; sa fiche « Comment faire » ; à la poulie, le cran des poulies (2,5 kg).
 *  2.40.9  (26/11/2026) Simulations (90 000 touchers au hasard, 50 000 journées de repas, 5 000 séances) : un seul défaut, un
 *                       conseil de séance trop long pour 2 lignes (« Garde 10 kg (…). Refais 15 à la 1re série… ») passe à la ligne.
 *                       Aussi : courbatures à 4 ou 5 endroits (les endroits dans « Pourquoi ») ; un record d'un exercice au nom
 *                       long (le nom court : « Extension triceps au-dessus : Record… »).
 *  2.41.0  (26/11/2026) Manger : « Ou écris-le » sous la photo : un plat tapé (« pain au chocolat ») passe au relais, qui donne
 *                       ses kcal ; le moment se choisit (Matin, Midi, Goûter, Soir) pour un repas oublié. La journée des repas
 *                       commence à 4 h : un repas pris en photo à 1 h 36 compte pour la veille (« Ce soir »). Fiche des
 *                       élévations latérales à la machine : la charge notée, ce sont les disques ajoutés, sans la machine.
 *                       Fiches : le réglage de 11 machines précisé (boudins, dossier, siège, coussin, axe en face du genou,
 *                       distance à la pile), chacun avec un repère du corps ; le plus important en première phrase (la carte).
 *  2.41.1  (27/11/2026) Manger : « Depuis la galerie » sous l'appareil photo (une photo déjà prise) ; le moment choisi dessous
 *                       range un repas d'avant à son heure, comme un plat écrit.
 *  2.41.2  (27/11/2026) Moins d'erreurs sur les photos : ce qu'il écrit de l'assiette part avec la photo (l'indice) ; la
 *                       consigne compte les sauces à la noix, les féculents à l'assiette, les aliments mélangés un par un ;
 *                       « Ce qui a été vu » ouvert d'office, et « Il manque quelque chose ? » ajoute au même repas.
 *  2.41.3  (27/11/2026) Manger : × sur chaque repas noté du jour, puis « Retirer » ou « Garder » (une photo mal comptée).
 *  2.41.4  (27/11/2026) Manger redessiné (maquette validée) : ajouter un repas en une ligne (le moment, puis Photo · Galerie ·
 *                       Écrire), le résultat dessous, puis les repas du jour ; l'idée pour le prochain repas ; « Toutes les
 *                       recettes » repliée ; les courses en bas.
 *  2.41.5  (27/11/2026) Manger : « Photo » sans le fond vert (comme Galerie et Écrire) ; le moment (Matin, Midi…) n'est en
 *                       couleur qu'une fois touché (sans choix : celui de l'heure).
 *  2.41.6  (27/11/2026) Manger : le moment de l'heure (Midi à midi…) est de nouveau en couleur d'avance ; Photo reste sans vert.
 *  2.41.7  (27/11/2026) Manger : « Toutes les recettes » se replie en quittant l'écran ; la liste des aliments a sa ligne, repliée.
 *  2.41.8  (27/11/2026) Manger : l'analyse se voit (un bloc qui tourne) ; le résultat se lit dans l'ordre : « Ajouté à ton
 *                       midi », le plat, les kcal et les protéines en grand, ce qui a été vu aliment par aliment.
 *  2.41.9  (27/11/2026) Fiche du leg curl assis : « À éviter : le confondre avec le leg extension (on y monte les jambes) ».
 *  2.41.10 (27/11/2026) Le « Leg curl assis » des séances d'avant le 27/11 était le leg extension (l'ancienne animation se
 *                       lisait à l'envers) : il devient « Leg extension », tout seul, une fois, avec une notice ; le vrai leg
 *                       curl repart de zéro.
 *  2.41.11 (27/11/2026) Vidéo : « Avec le son » (et « Sans le son ») reprend là où elle en était, au lieu de repartir du
 *                       début (la durée de chaque vidéo dans sa fiche).
 *  2.41.12 (27/11/2026) Vitesse mesurée (chaque écran en 2 à 6 ms sur le Mac, le code lu en 10 ms) ; un test la garde :
 *                       chaque écran en moins de 60 ms, le plugin sous 5 Mo.
 *  2.41.13 (27/11/2026) Les anciennes photos (départ, arrivée) retirées : les vidéos les remplacent ; le plugin passe de 3,9
 *                       à environ 0,8 Mo. Sans réseau, la vignette dit « la vidéo se verra plus tard ».
 *  2.41.14 (27/11/2026) Repos : sous la charge qui suit, les disques de chaque côté (« Par côté : 2 × 20 + 10 »).
 *  2.41.15 (28/11/2026) Le programme remplacé par le programme livré garde le matériel de sa salle (cran des haltères,
 *                       disques, étage) ; une note déjà remplacée le reprend de programme-avant.md (le pote : élévations
 *                       de 1 en 1 kg). Repos refait : le temps dans un anneau, la série qui vient dans une carte, un disque
 *                       dessiné par disque de chaque côté, « Dans chaque main » aux haltères.
 *  2.41.16 (28/11/2026) « Comment faire » rangé par muscle : un titre par muscle, les exercices qui le travaillent
 *                       dessous (ceux du programme d'abord, « Au programme »).
 */
const obsidian = require('obsidian');

// ── Dates et vue ──
const VUE = 'salle-vue';
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MS_MINUTE = 60000;
const MS_JOUR = 86400000;

// ── Notes livrées : le texte de objectifs/<objectif>/ ou de commun/, inséré ici par construire.py (le même que les notes livrées, vérifié par les tests) ──
// Le programme d'origine (comme la note « Programme »), et le carnet Forme, créé par le plugin s'il manque.
// L'objectif (2.28.0, demande : préparer le coffre pour d'autres objectifs (prise de masse, puissance…), avec une vraie organisation) : tout ce qui change d'un objectif à l'autre est dans objectifs/<objectif>/ : ses règles
// (objectif.json, inséré ici), son programme et ses repas (Programme.txt, Manger simple.txt). Ce qui vaut pour tous les
// objectifs est dans commun/ (guide des exercices, carnet Forme, Ma salle). Un seul objectif est livré aujourd'hui.
const OBJECTIF = OBJECTIF_DU_DOSSIER();
const PROGRAMME_DEFAUT = MODELE('Programme.txt');
const FORME_DEFAUT = MODELE('Forme.txt');
// 2.23.0 : le guide des exercices et « Manger » vivent dans le plugin (ce sont des textes, pas des données) : plus besoin
// de leurs notes dans le coffre. Une note du coffre avec le même en-tête passe avant (L.assemblerEtat).
const GUIDE_DEFAUT = GUIDE_DU_DOSSIER();   // assemblé depuis commun/exercices/ : une fiche par exercice
// 2.24.0 (demande : un seul dossier pour ce qui dépend de l'utilisateur, à part de l'application) : le dossier où le plugin
// crée ses notes dans un coffre neuf. Dans un coffre qui a déjà ses notes, il écrit à côté d'elles (plugin.dossierDonnees).
const DOSSIER_DONNEES = 'donnees';
// Le brouillon du plugin (séance en cours, bilan du jour), à côté de la note « Réglages » : rien de l'utilisateur hors de ce dossier.
const FICHIER_BROUILLON = 'brouillon.json';
// 2.38.0 (demande : des noms de fichiers aux conventions des développeurs, et rien à refaire à la main là où le dossier a
// déjà été copié) : les noms que le plugin donne à ce qu'il crée dans ce dossier, en minuscules, sans accent ni espace. Ce
// qu'il avait nommé autrement (« Données », « Réglages.md », « Séances », « Brouillon.json ») est renommé au démarrage
// (95-noms.js). Les notes se reconnaissent toujours à leur en-tête « salle: … », jamais à leur nom.
// 2.38.80 : l'empreinte du dernier programme livré suivi sur cet appareil (SallePlugin.suivreProgrammeLivre).
const CLE_PROGRAMME_LIVRE = 'salle-programme-livre';
// 2.41.15 : l'empreinte de l'ancienne note du programme dont le matériel a été repris (SallePlugin.reprendreCransAvant).
const CLE_CRANS_REPRIS = 'salle-crans-repris';
const NOMS_FICHIERS = { programme: 'programme', mesures: 'mesures', forme: 'forme', club: 'ma-salle', reglages: 'reglages', seances: 'seances', photos: 'photos', repas: 'repas' };
const ANCIEN_BROUILLON = 'Brouillon.json';   // le nom d'avant la 2.38.0, lu et écrit tant qu'il n'est pas renommé
const MANGER_DEFAUT = MODELE('Manger simple.txt');
const SALLE_DEFAUT = MODELE('Ma salle.txt');   // la note « Ma salle » d'un coffre neuf (le sac ; le reste vient des réglages)

// ── Écrans, lien, appareil ──
// Les écrans qu'Obsidian garde quand on revient sur la vue (getState).
const ECRANS = ['accueil', 'progres', 'mesures', 'guide', 'seance', 'seances', 'diagnostic'];
// Le lien obsidian://salle (registerObsidianProtocolHandler). ?ecran=seance reprend ou commence la séance du jour ;
// les écrans de ECRANS_LIEN s'ouvrent directement ; tout autre écran donne l'accueil.
const ACTION_LIEN = 'salle';
const ECRANS_LIEN = ['progres', 'mesures', 'guide', 'seances', 'diagnostic'];
// Ce que « Tester cet appareil » vérifie (gardé dans data.json, par appareil : reglages.appareils.mobile ou .bureau).
const TESTS_APPAREIL = ['ecran', 'son', 'vibration', 'obsidian', 'shortcuts'];
// « Modifier la note » ouvre l'édition pendant ce temps, malgré la lecture seule (Réglages → Appli).
const EDITION_PERMISE_MIN = 15;

// ── Icônes des boutons : noms Lucide, tous vérifiés dans la table d'icônes d'Obsidian 1.15 (test « chaque icône demandée ») ──
// Clé inconnue : pas d'icône, le texte reste.
const ICONES = {
  accueil: 'home', salle: 'dumbbell', progres: 'trending-up', guide: 'book-open', mesures: 'ruler', programme: 'clipboard-list',
  club: 'map-pin', manger: 'utensils', reglages: 'settings', retour: 'chevron-left', annuler: 'x',
  defaire: 'undo-2', repos: 'timer', valider: 'check', plus: 'plus', moins: 'minus', commencer: 'play', passer: 'skip-forward',
  remplacer: 'repeat', jours: 'calendar', seances: 'history', modifier: 'pencil', note: 'file-text', supprimer: 'trash-2',
  plein: 'maximize-2', reduire: 'minimize-2', terminer: 'flag', cardio: 'bike', echauffement: 'flame', recreer: 'rotate-ccw',
  sombre: 'moon', clair: 'sun', verrou: 'lock', libre: 'unlock', record: 'trophy', info: 'info',
  reglage: 'sliders-horizontal', monter: 'arrow-up', descendre: 'arrow-down',
  actions: 'more-horizontal', pause: 'pause', son: 'volume-2', vibration: 'smartphone', diagnostic: 'test-tube',
  superserie: 'link-2', semaine: 'calendar-days', volume: 'bar-chart-2', bonretour: 'heart-handshake', fait: 'circle-check',
  chrono: 'timer', lien: 'link', ouvrir: 'chevron-right', photo: 'camera', sentir: 'target', eau: 'droplet', disques: 'disc', volet: 'panel-left',
  video: 'play-circle', muet: 'volume-x',
};

// ── Le bilan ──
// Le bilan. (Le plan de la salle n'est plus ici : les étages viennent des réglages, L.etagesLus, 2.22.0.)
// Les zones du bilan. Douleur : [dans les notes, « ton coude », « au coude », bouton]. Courbatures : [notes, « aux bras », bouton, lecture].
const ZONES_DOULEUR = {
  epaule: ['épaule', 'ton épaule', 'à l\'épaule', 'Épaule'], coude: ['coude', 'ton coude', 'au coude', 'Coude'],
  poignet: ['poignet', 'ton poignet', 'au poignet', 'Poignet'], 'bas du dos': ['bas du dos', 'le bas de ton dos', 'au bas du dos', 'Bas du dos'],
  genou: ['genou', 'ton genou', 'au genou', 'Genou'], autre: ['autre', 'cette zone', '', 'Autre'],
};
const ZONES_COURB = {
  bras: ['bras', 'aux bras', 'Bras', /bras|biceps|triceps/], epaules: ['épaules', 'aux épaules', 'Épaules', /epaule/],
  pectoraux: ['pectoraux', 'aux pectoraux', 'Pectoraux', /pector|pecs/], dos: ['dos', 'au dos', 'Dos', /\bdos\b/],
  jambes: ['jambes', 'aux jambes', 'Jambes', /jambe|cuisse|mollet|fessier/],
};
// Les réponses à « Il t'en restait combien ? ».
const RESERVES = [['0', '0 : j\'étais à fond'], ['1-2', '1 ou 2'], ['3+', '3 ou plus']];
const VELO_MIN = 5;               // les minutes de vélo de l'échauffement
const RACCOURCI = 'Repos salle';   // le raccourci iPhone qui lance le minuteur du système (écran verrouillé)

// ───────────────────────── Logique pure ─────────────────────────
// L est rempli par src/02-reglages.js à 42-niveau.js, un Object.assign(L, { … }) par fichier ou par partie.
const L = {};
