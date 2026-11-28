// 2.5.1 : aucun texte visible de plus de 2 lignes à 375 px hors d'un détail repliable (« tu continues à me faire des longs
// paragraphes, j'aime pas ça »). tests/textes-courts.js relit chaque écran dessiné par tous les tests d'écran (VueSalle.rendre,
// consigne) ; ce fichier, le dernier, dessine en plus les écrans que les autres ne montrent pas dans tous leurs états
// (« Tester cet appareil » quand tout marche ou rien, Réglages → Appli), puis fait le compte.

// Un plugin pour « Tester cet appareil » : chaque test dit v (true : Marche, false : Ne marche pas).
const pluginDiag = (v) => {
  const p = pluginC({ etat: { fichiers: { connexions: { path: 'Outils/connexions/Connexions iPhone.md' } } } });
  return Object.assign(p, {
    peut: () => v, mobile: () => true, nomCoffre: () => 'Salle', creerVibreur: () => h('input', { type: 'checkbox' }),
    testerAppareil: async () => {}, noterAppareil: async () => {}, jouerBip: () => false, lancerTestLien: () => {}, copier: () => {},
  });
};

rendu('textes courts : « Tester cet appareil », tout marche puis rien ne marche', async () => {
  for (const v of [true, false, null]) {
    const o = vueC(pluginDiag(v), 'diagnostic');
    ok(o.r().textContent.indexOf('Le plugin a rencontré une erreur') < 0, `diagnostic dessiné (${v})`);
  }
});

rendu('textes courts : Réglages, onglets Salle et Appli', async () => {
  simulerDate('2026-11-16T18:00:00');
  for (const onglet of ['salle', 'appli']) {
    const o = vueC(pluginC({ donnees: { reglages: { niveau: 'regulier', parSemaine: 3, duree: 60, jours: [1, 2, 4], chronoIphone: true } } }), 'questions', (v) => { v.ongletReglages = onglet; });
    ok(o.r().textContent.indexOf('Le plugin a rencontré une erreur') < 0, `réglages ${onglet} dessinés`);
  }
});

rendu('textes courts : un détail repliable compte à part, un long texte hors détail est vu', async () => {
  const boite = h('div', null, texteCourt('Court.\nComment : ' + 'une explication longue '.repeat(6)), h('p', { text: 'x '.repeat(50) }));
  egal(textesTropLongs(boite).length, 1, 'le long paragraphe est vu, pas le « Comment »');
  const d = boite.tous((e) => e.tagName === 'details')[0];
  egal([!!d, d && d.childNodes[0].tagName, d && d.childNodes[0].textContent], [true, 'summary', 'Comment'], 'le « Comment » : un <details> fermé, son <summary>');
  // 2.9.0 : un « Pourquoi » ne s'affiche plus (« le pourquoi, c'est pour les dev »).
  const sans = texteCourt('Court.\nPourquoi : une raison.');
  egal([sans.tagName, sans.textContent], ['p', 'Court.'], 'le « Pourquoi » n\'est plus affiché');
});

rendu('textes courts : tous les écrans dessinés par les tests', async () => {
  for (const x of TEXTES_LONGS) print(`  [${x.texte.length}] ${x.ou} : ${x.texte}`);
  egal(TEXTES_LONGS.length, 0, 'aucun texte de plus de 2 lignes hors « Pourquoi »');
  const notices = avis.filter((t) => String(t).length > LIGNES_MAX);
  notices.forEach((t) => print(`  [${String(t).length}] message : ${t}`));
  egal(notices.length, 0, 'aucun message (Notice) de plus de 2 lignes');
});
