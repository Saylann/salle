// Le programme 1.15.0 figé, partagé par les tests : copie exacte de ~/Desktop/CLAUDE/Salle-travail/archives/2026-11-14-avant-2.0.0/modeles/Programme.txt.
// Les exemples chiffrés du contrat (~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-contrat-2.0.md) se calculent dessus : ils ne bougent pas quand
// Programme.md ou le programme livré changent. Chargé par tests/commun.js (logique) et tests/dom-factice.js (écrans).
const PROGRAMME_115 = `---
salle: programme
---
# Programme

> [!info] Cette note pilote le plugin
> Une ligne = un exercice : \`- Nom · séries × répétitions · repos · pas\`.
> Tu peux changer un chiffre, un nom, l'ordre, ajouter ou enlever une ligne : le plugin relit la note tout seul.
> « pas » = le plus petit ajout de charge possible sur la machine ou les haltères. « option » = retiré des séances de 45 min.
> « ou … » = l'exercice de remplacement quand la machine est prise. Le plugin te le propose pendant la séance. Plusieurs : \`ou X / Y\`.
> Si tu renommes un exercice, son historique repart de zéro.
>
> Pourquoi ce programme : tout le corps à chaque séance, 3 fois par semaine en alternant A et B, c'est ce qui marche le mieux pour débuter. Avec 3 séances, le dos reçoit environ 16 séries par semaine et les épaules 13 : c'est la priorité, pour la carrure. Pectoraux et cuisses : environ 9. Arrière des cuisses : 7. Bras : 3 en direct, plus tout le travail des tirages et des développés.
>
> Toutes les 8 semaines, une semaine légère : le plugin divise les séries par deux, tu gardes tes charges. Le corps récupère, puis tu repars plus fort.
>
> En fin de séance : 10 à 15 minutes de cardio tranquille (vélo, tapis incliné ou rameur), à un rythme où tu peux encore parler. Après la musculation, jamais avant : tu gardes ta force pour les charges. Le plugin te le propose quand toutes les séries sont faites.

## Séance A

- Tirage vertical prise large · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Tractions (poids du corps)
- Développé assis à la machine · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Développé couché aux haltères
- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg · étage 1
- Tirage horizontal à la poulie · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Rowing à la machine à disques
- Élévations latérales aux haltères · 3 × 12-20 · repos 1 min 30 · pas 1 kg · étage 2
- Leg curl assis · 2 × 10-15 · repos 1 min 30 · pas 2,5 kg · étage 1 · ou Leg curl allongé
- Curl aux haltères · 2 × 10-15 · repos 1 min 30 · pas 1 kg · étage 2 · option · ou Curl à la barre en Z
- Gainage planche · 2 × 30-60 s · repos 1 min · étage 1

## Séance B

- Développé épaules aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg · étage 2 · dossier presque droit, 80 à 90° · ou Développé épaules à la machine
- Tirage vertical prise neutre · 3 × 8-12 · repos 2 min · pas 2,5 kg · étage 1 · ou Tractions (poids du corps)
- Développé incliné aux haltères · 3 × 8-12 · repos 2 min · pas 2 kg · étage 2 · banc 30° (2e ou 3e cran) · ou Développé incliné à la machine
- Presse à cuisses · 3 × 10-15 · repos 2 min · pas 5 kg · étage 1
- Leg curl assis · 3 × 10-15 · repos 1 min 30 · pas 2,5 kg · étage 1 · ou Leg curl allongé
- Élévations latérales aux haltères · 3 × 12-20 · repos 1 min 30 · pas 1 kg · étage 2
- Face pull à la poulie · 2 × 12-15 · repos 1 min 30 · pas 2,5 kg · étage 1
- Extension triceps à la poulie · 2 × 10-15 · repos 1 min 30 · pas 2,5 kg · étage 1 · option
`;
