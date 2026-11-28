// Les rendus communs à tous les écrans (src/60-vue.js) : aucune erreur, chaque bouton a une action, pas de jargon.

// ───────────────────────── Tous ces écrans ─────────────────────────

// Chaque écran de ce fichier, rendu dans un cas ordinaire (le 18/11, deux séances notées, le bilan du jour fait).
const tousLesEcrans = () => {
  simulerDate('2026-11-18T20:00:00');
  const etat = { seances: [S13, S18], textes: { programme: PROGRAMME_115, club: '---\nsalle: club\n---\n# Ma salle\n## Étages\nRDC : accueil.\n' }, guide: L.lireGuide('---\nsalle: guide\n---\n## Presse à cuisses\nPieds à plat.\n') };
  const cas = [['accueil'], ['questions'], ['avant'], ['resume', { bilan: BILAN_OK('2026-11-18') }], ['bilan'], ['progres'], ['mesures'], ['seances'], ['guide'], ['note']];
  return cas.map(([ecran, donnees]) => vueC(pluginC({ etat, donnees }), ecran, (v) => { v.bilan = bilanDu18(); v.noteType = 'club'; }));
};

rendu('écrans du lot C : aucune erreur, et chaque bouton a une action', async () => {
  const vues = tousLesEcrans();
  egal(vues.map((o) => o.v.ecran + ':' + (!o.erreur() && o.boutons().every((b) => (b.ev.click || []).length))), vues.map((o) => o.v.ecran + ':true'), 'écrans du lot C : aucune erreur, et chaque bouton a une action');
});

rendu('écrans du lot C : ni « [À COMPLÉTER », ni jargon (RIR, 1RM), ni émoji dans les boutons', async () => {
  const vues = tousLesEcrans();
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  egal(vues.filter((o) => /À COMPLÉTER|\bRIR\b|\b1RM\b/i.test(texte(o)) || o.boutons().some((b) => emoji.test(b.textContent))).map((o) => o.v.ecran), [],
    'écrans du lot C : ni « [À COMPLÉTER », ni jargon (RIR, 1RM), ni émoji dans les boutons');
});

// 2.41.12 (demande : « l'application doit être optimisée pour ne pas être lente, dans tout ») : chaque écran se dessine vite
// (au milieu de 5 dessins, moins de 60 ms ici, dans le faux écran des tests ; mesuré à 2 à 6 ms dans l'aperçu sur le Mac), et
// le fichier du plugin reste léger (moins de 5 Mo). Un écran qui ralentit, ou un plugin qui enfle, fait échouer ce test.
rendu('vitesse : chaque écran se dessine vite, le plugin reste léger', async () => {
  const lents = [];
  for (const o of tousLesEcrans().concat([vueC(pluginC({ etat: { textes: { manger: MANGER_DEFAUT }, repas: [] } }), 'note', (v) => { v.noteType = 'manger'; })])) {
    const t = [];
    for (let i = 0; i < 5; i++) { const a = Date.now(); o.v.rendre(); t.push(Date.now() - a); }
    t.sort((x, y) => x - y);
    if (t[2] > 60) lents.push(`${o.v.ecran}${o.v.noteType ? ':' + o.v.noteType : ''} ${t[2]} ms`);
  }
  simulerDate();
  const poids = readFile(FABRIQUE + '/main.js').length;
  egal([lents, poids < 5 * 1024 * 1024], [[], true], 'chaque écran en moins de 60 ms, le plugin sous 5 Mo');
});
