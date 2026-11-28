// Les rendus 1.x (ancien tests/rendu_bilan.js, ~/Desktop/CLAUDE/Salle-travail/archives/2026-11-14-avant-2.0.0/tests/) : les écrans du bilan, du résumé et de la
// séance, rendus avec le faux DOM de tests/dom-factice.js ; chaque bouton de ces écrans est touché.
// Deux corrections de l'ancien fichier, sans changer ce qu'il vérifie (toujours 40 vérifications) :
//  - l'heure est fixée (lundi 16/11/2026, 18 h, jour de séance) : avant, le test échouait les jours de repos (pas de bouton
//    « Commencer » à l'accueil), donc selon le jour où on le lançait ;
//  - le remplaçant : depuis la 1.15.0, il se choisit dans « Passer cet exercice » (bouton au nom du remplaçant), plus par un bouton
//    « Faire à la place : … » ; l'ancien fichier n'avait pas suivi (3 échecs avec main.js 1.15.0).
// 2.1.2 : le bilan n'a plus que 3 questions (douleur, courbatures fortes, nuit) : les touchers de la forme et du temps sont
// remplacés par ceux de la nuit et des courbatures (38 vérifications au lieu de 40).
simulerDate('2026-11-16T18:00:00');

const prog = L.lireProgramme(SP.PROGRAMME_DEFAUT);
const auj = L.dateISO(new Date());
const libre = L.lireSeance(L.ecrireSeance({ nom: 'Séance libre', date: L.plusJours(auj, -2), exos: [{ nom: 'Tractions', series: [{ c: 0, r: 12 }, { c: 0, r: 10 }] }, { nom: 'Tirage vertical prise large', series: [{ c: 40, r: 12 }, { c: 40, r: 12 }, { c: 40, r: 12 }] }, { nom: 'Rowing à la machine à disques', series: [{ c: 40, r: 12 }, { c: 40, r: 12 }] }] }));
const carnet = L.lireForme(SP.FORME_DEFAUT + `- ${L.plusJours(auj, -1)} · courbatures fortes : bras · douleur qui tire : coude\n`);
const ecrit = [];
const plugin = {
  etat: { programme: prog, seances: [libre], forme: carnet, guide: {}, fichiers: {}, mesures: [] },
  donnees: { reglages: { niveau: 'un peu', parSemaine: 3, duree: 60, etages: { machines: 1, halteres: 2 } }, enCours: null },   // 2.22.0 : les étages viennent des réglages
  async sauver() {}, async noterForme(b) { ecrit.push(L.ligneForme(b)); this.etat.forme = this.etat.forme.concat(L.lireForme(L.ligneForme(b))); },
  majBarre() {}, mobile() { return true; }, image() { return ''; }, chronoIphone() {}, async enregistrerSeance(s) { ecrit.push(L.ecrireSeance(s)); return { path: 'x.md' }; }, async recharger() {},
};
const v = new VueSalle(null, plugin);
v.plugin = plugin;
const r = () => v.contentEl;
const boutons = () => r().tous((e) => e.tagName === 'button' || (e.tagName === 'label' && e.attrs.role === 'button'));   // 2.0 (lot B) : le gros bouton du bas est un <label role="button"> (vibration iOS 18) ; « Fait » de l'échauffement y est
const bouton = (t) => boutons().find((b) => b.textContent.indexOf(t) >= 0);
const toucher = async (t) => { const b = bouton(t); ok(b, 'bouton « ' + t + ' » présent'); if (b) for (const f of b.ev.click || []) await f(); };
const erreur = () => r().textContent.indexOf('Le plugin a rencontré une erreur') >= 0;

rendu('1.13.0 à 1.15.0 : bilan, résumé, séance, étages, remplaçant', async () => {
  v.ecran = 'accueil'; v.rendre();
  ok(!erreur(), 'accueil sans erreur');
  await toucher('Commencer');
  ok(v.ecran === 'avant' && !erreur(), 'Commencer → Avant de commencer');
  ok(r().textContent.indexOf('Prérempli d\'après ton carnet Forme') >= 0, 'avant : prérempli d\'après le carnet');
  ok(boutons().every((b) => (b.ev.click || []).length), 'avant : chaque bouton a une action');
  ok(boutons().filter((b) => b.textContent.indexOf('Tout va bien, commencer') >= 0).length === 1, 'avant : « Tout va bien, commencer » une seule fois');
  await toucher('Douleur vive'); await toucher('Épaules'); await toucher('Moins de 6 h'); // 2.1.2 : la nuit à la place de la forme et du temps
  ok(!erreur() && v.formeSaisie.courb.zones.join() === 'bras,epaules' && v.formeSaisie.douleur.type === 'vive' && v.formeSaisie.sommeil === 'court', 'avant : les choix se cochent');
  await toucher('Valider');
  ok(v.ecran === 'resume' && !erreur(), 'Valider → Ta séance d\'aujourd\'hui');
  ok(ecrit[0] && /· courbatures fortes : bras, épaules · douleur vive : coude · sommeil : moins de 6 h$/.test(ecrit[0]), 'le carnet Forme reçoit la ligne'); // 2.1.2 : plus de forme, la nuit courte à la fin
  ok(r().textContent.indexOf('médecin ou kiné') >= 0 && r().textContent.indexOf('médecin le jour même') >= 0, 'résumé : les renvois médecin');
  ok(boutons().every((b) => (b.ev.click || []).length), 'résumé : chaque bouton a une action');
  const tropVide = r().textContent.indexOf('Il ne reste que') >= 0;
  if (tropVide && bouton('Faire « ')) { await toucher('Faire « '); ok(!erreur(), 'résumé : l\'autre séance'); }
  await toucher('Refaire le bilan');
  ok(v.ecran === 'avant' && v.formeSaisie.sommeil === 'court', 'Refaire le bilan : les réponses reprises'); // 2.1.2 : la nuit (avant : la forme)
  await toucher('Non'); // la douleur
  const nonCourb = boutons().filter((b) => b.textContent === 'Non')[1]; // 2.1.2 : le second « Non », celui des courbatures fortes (avant : « Aucune »)
  ok(nonCourb, 'bouton « Non » des courbatures présent'); if (nonCourb) for (const f of nonCourb.ev.click || []) await f();
  await toucher('6 h ou plus'); // 2.1.2 : la nuit (avant : « Normale » et « 1 h »)
  await toucher('Tout va bien, commencer');
  ok(v.ecran === 'seance' && plugin.donnees.enCours && plugin.donnees.enCours.bilan && !erreur(), 'Tout va bien, commencer → la séance, avec le bilan');
  const sc = plugin.donnees.enCours;
  await toucher('Fait');
  // On fait toutes les séries du premier exercice avec charge
  const exo = sc.exos[sc.courant];
  for (let k = 0; k < exo.series; k++) { v.saisie = { pour: sc.courant, c: 30, v: 10 }; await v.validerSerie(); }
  ok(sc.question != null && r().textContent.indexOf('il t\'en restait combien') >= 0, 'réserve : la question après la dernière série');
  await toucher('1 ou 2');
  ok(exo.reserve === '1-2' && r().textContent.indexOf('il t\'en restait combien') < 0 && !erreur(), 'réserve : notée, la question part');
  await v.terminer();
  const note = ecrit[ecrit.length - 1];
  ok(/\ndouleur: aucune\ncourbatures: aucune\n---/.test(note) && /Réserve : 1 ou 2/.test(note), 'note de séance : bilan et réserve écrits'); // 2.1.2 : ni forme ni temps_min
  // Une séance en cours de la 1.12.0 (sans bilan ni question) se reprend
  plugin.donnees.enCours = L.nouvelleSeance(L.seanceDuJour(prog, [libre], plugin.donnees.reglages, auj), auj, Date.now());
  v.ecran = 'seance'; v.rendre();
  ok(!erreur(), 'séance en cours 1.12.0 : affichée sans erreur');
  // Résumé avec un bilan qui vide la séance
  plugin.donnees.enCours = null; plugin.etat.forme = []; plugin.donnees.bilan = { date: auj, douleur: { zone: 'epaule', type: 'vive' }, courb: { niveau: 'fortes', zones: ['jambes', 'bras'] } }; // 2.1.2 : l'option part avec les courbatures fortes aux bras (avant : avec un temps de 45 min)
  // 2.31.0 : les bras sont dans les deux séances et ne sont plus en option ; pour voir l'écran « trop vidée », ce cas se joue sans eux.
  plugin.etat.programme = prog.map((s) => Object.assign({}, s, { exos: s.exos.filter((e) => !/^Curl|triceps|Hip thrust|Crunch/i.test(e.nom)) }));
  v.iPrevu = 1; v.ecran = 'resume'; v.rendre();
  ok(!erreur() && r().textContent.indexOf('Il ne reste que') >= 0 && bouton('Repos aujourd\'hui'), 'séance trop vidée : le dire, proposer l\'autre ou le repos');
  await toucher('Repos aujourd\'hui');
  ok(v.ecran === 'accueil' && !erreur(), 'Repos aujourd\'hui → accueil');
  // 1.14.0 : la séance B dans l'ordre des étages, le réglage du banc, le repère, le remplaçant
  plugin.donnees.bilan = null; plugin.etat.forme = carnet;
  plugin.etat.guide = L.lireGuide('---\nsalle: guide\n---\n## Développé incliné à la machine\n**Réglage :** règle le siège pour que les poignées soient à la hauteur du haut de la poitrine. Dos collé.\n');
  plugin.etat.programme = prog;
  const sjB = L.seanceDuJour(prog, [libre], plugin.donnees.reglages, auj, 1);   // 2.22.0 : les étages viennent des réglages (L.situer)
  const scB = L.nouvelleSeance(L.ordonnerSeance(Object.assign({}, sjB, { exos: L.situer(sjB.exos, plugin.donnees.reglages.etages) }), [1]), auj, Date.now());
  scB.courant = scB.exos.findIndex((x) => x.nom === 'Développé incliné aux haltères');
  plugin.donnees.enCours = scB; v.saisie = null; v.ecran = 'seance'; v.liste = true; v.rendre();   // 2.38.19 : la liste dans le panneau « La séance », ouvert
  const txt = r().textContent;
  // 2.36.3 : le réglage du banc est sur la carte, sous la charge (il compte autant qu'elle) ; la ligne du repos l'annonce aussi.
  ok(!erreur() && scB.courant > 0 && txt.indexOf('Banc à 30° (2e ou 3e cran)') >= 0 && L.reglageProgramme(scB.exos[scB.courant]) === 'banc à 30° (2e ou 3e cran)', 'le réglage du banc : sur la carte, sous la charge (2.36.3)');
  ok(txt.split('Monte à l\'étage 2 : haltères et bancs').length === 2 && txt.split('Descends').length === 1, 'liste : un repère pour monter à l\'étage 2 ; plus de descente, le triceps se fait avec le tirage (2.38.71)');
  ok(txt.indexOf('Étage 2 · ') >= 0 && txt.indexOf('Étage 1 · ') >= 0, 'liste : l\'étage en petit');
  for (const t of ['Plus d\'actions', 'Remplacer par']) { const b = boutons().find((x) => x.attrs['aria-label'] === t || x.textContent.indexOf(t) >= 0); if (b) for (const f of b.ev.click || []) await f(); }   // 2.0 (lot B) : le remplaçant est dans le menu « … », ligne « Remplacer par » (mêmes vérifications)
  await toucher('Développé incliné à la machine');
  // Relecture 2.8.0 : jamais fait, sa fiche s'ouvre d'elle-même et dit le réglage. 2.14.4 : en étiquette dans l'aide (« Réglage :
  // règle le siège… », la première phrase), la suite (« Dos collé. ») dans la fiche dessous, sans redite.
  const vu = () => r().textContent.replace(/\s+/g, ' ');
  ok(!erreur() && scB.exos[scB.courant].nom === 'Développé incliné à la machine' && vu().indexOf('banc à 30°') < 0 && vu().indexOf('Réglage : règle le siège pour que les poignées soient à la hauteur du haut de la poitrine') >= 0
    && vu().split('règle le siège').length === 2 && vu().indexOf('Dos collé.') >= 0, 'remplaçant : le réglage du banc part, celui de la machine vient du guide (étiquette, puis la suite)');
  ok(bouton('Développé incliné à la machine') && boutons().filter((b) => /salle-rang/.test(b.className || '')).length === scB.exos.length, 'liste : toucher un autre exercice reste possible');
  // Une séance en cours de la 1.13.0 (ni étage ni réglage) se reprend
  const en113 = L.nouvelleSeance(L.seanceDuJour(prog, [libre], plugin.donnees.reglages, auj, 1), auj, Date.now());
  en113.exos.forEach((x) => { delete x.etage; delete x.reglage; }); en113.courant = 3; en113.bilan = { date: auj, douleur: null, courb: { niveau: 'aucune', zones: [] }, forme: 'normale', temps: 60 };
  plugin.donnees.enCours = SP.SallePlugin ? SP.SallePlugin.verifierEnCours(en113) : en113; v.saisie = null; v.rendre();
  // 2.8.0 : la ligne du tempo n'est pas un repère d'étage : retirée avant de chercher « Monte » (elle ne le dit plus, mais
  // ce test ne doit pas dépendre de son texte).
  const tempo = r().tous((e) => / salle-tempo /.test(' ' + (e.className || '') + ' ')).map((e) => e.textContent.replace(/\s+/g, ' '));
  const sansTempo = tempo.reduce((t, x) => t.split(x).join(''), r().textContent.replace(/\s+/g, ' '));
  ok(!erreur() && sansTempo.indexOf('Monte') < 0 && sansTempo.indexOf('Étage') < 0 && sansTempo.indexOf('Commence') < 0, 'séance en cours 1.13.0 : affichée sans erreur, sans étage');
});
