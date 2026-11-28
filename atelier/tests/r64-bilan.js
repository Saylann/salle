// Les rendus du bilan de fin (src/64-bilan.js) : la séance, les records, les XP, le niveau qui monte. Aides : tests/aides-ecrans.js.

// ───────────────────────── Bilan de fin ─────────────────────────

rendu('bilan : trois tuiles comparées à la dernière « Séance B » (−20 %, +17 %, +18 %), la charge totale en 3e et discrète', async () => {
  simulerDate('2026-11-18T20:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = bilanDu18(); });
  const tuiles = parClasse(o, 'salle-tuile-bilan');
  egal([tuiles.map((t) => t.childNodes[0].textContent), tuiles.map((t) => t.childNodes[1].textContent), tuiles.map((t) => (t.childNodes[2] ? t.childNodes[2].textContent : '')), tuiles.map((t) => t.className.indexOf('salle-tuile-discrete') >= 0)],
    [['Durée', 'Séries', 'Charge totale'], ['64 min', '7', '1 812 kg'], ['−20 %', '+17 %', '+18 %'], [false, false, true]],
    'bilan : trois tuiles comparées à la dernière « Séance B » (−20 %, +17 %, +18 %), la charge totale en 3e et discrète');
});

rendu('bilan : jamais de rouge : une baisse est grise, sans flèche', async () => {
  simulerDate('2026-11-18T20:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = bilanDu18(); });
  const moins = parClasse(o, 'salle-ecart-moins').map((e) => e.textContent);
  egal([moins, parClasse(o, 'salle-danger').length + parClasse(o, 'salle-alerte').length], [['−20 %', '2 répétitions de moins'], 0], 'bilan : jamais de rouge : une baisse est grise, sans flèche');
});

rendu('bilan : les records en or, avant → après', async () => {
  simulerDate('2026-11-18T20:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = bilanDu18(); });
  const carte = parClasse(o, 'salle-records')[0];
  egal([!!carte && carte.className.indexOf('salle-etat-record') >= 0, carte && carte.tous((e) => e.tagName === 'li').map((li) => li.textContent)],
    [true, ['Développé épaules aux haltères Nouvelle charge : 10 kg, avant 8', 'Presse à cuisses Record : 11 répétitions à 60 kg, avant 10']], 'bilan : les records en or, avant → après');
});

rendu('bilan : une ligne par exercice (↑, =, nouvelle charge) et « 2 en hausse »', async () => {
  simulerDate('2026-11-18T20:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = bilanDu18(); });
  egal([parClasse(o, 'salle-bilan-exo').map((e) => e.childNodes[1].textContent), texte(o).indexOf('2 en hausse') >= 0, parClasse(o, 'salle-bilan-exo-record').length],
    [['↑ Nouvelle charge : 10 kg, avant 8', '↑ +1 répétition', '2 répétitions de moins', 'Première fois'], true, 2], 'bilan : une ligne par exercice (↑, =, nouvelle charge) et « 2 en hausse »');
});

// 2.13.1 (changement voulu) : la bulle verte sous « Ce soir » est toujours là, sans bouton « Compris ».
rendu('bilan : « Ce soir » en une ligne ; sa bulle verte toujours là', async () => {
  simulerDate('2026-11-18T20:00:00');
  const neuf = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = bilanDu18(); });
  const vu = vueC(pluginC({ etat: { seances: [S13, S18] }, vus: ['c-apres'] }), 'bilan', (v) => { v.bilan = bilanDu18(); });
  // 2.13.0 : « Ce soir » dit aussi le sommeil (7 à 9 h) ; les puces disent quoi faire des courbatures du lendemain.
  egal([parClasse(vu, 'salle-apres').map((e) => e.textContent), texte(neuf).indexOf('Pas besoin de shaker') >= 0, texte(vu).indexOf('Pas besoin de shaker') >= 0],
    [['Ce soir : 30 à 40 g de protéines au dîner et 8 h de sommeil. Ni bain froid ni ibuprofène.'], true, true], 'bilan : « Ce soir » en une ligne ; sa bulle verte toujours là, même déjà vue');
  ok(/Courbatures demain\s*: marche ou vélo léger 10 à 20 min, masse le muscle 1 à 2 min\./.test(texte(neuf).replace(/\s+/g, ' ')) && texte(vu).indexOf('Courbatures demain') >= 0 && !neuf.bouton('Compris'), 'bilan : les courbatures du lendemain, toujours dites, sans « Compris »');
});

rendu('bilan : sans comparaison posée par la séance, l\'écran la calcule', async () => {
  simulerDate('2026-11-18T20:00:00');
  const o = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = Object.assign(bilanDu18(), { compare: undefined }); });
  egal([parClasse(o, 'salle-tuile-bilan').length, o.erreur()], [3, false], 'bilan : sans comparaison posée par la séance, l\'écran la calcule');
});

rendu('bilan : le ressenti est noté dans la note (plugin.noterRessenti)', async () => {
  simulerDate('2026-11-18T20:00:00');
  const p = pluginC({ etat: { seances: [S13, S18] } });
  const o = vueC(p, 'bilan', (v) => { v.bilan = bilanDu18(); });
  await cliquer(o, 'Bien');
  egal([p.appels.filter((x) => x[0] === 'noterRessenti'), o.bouton('Bien').attrs['aria-pressed']], [[['noterRessenti', S18.chemin, 'bien']], 'true'],
    'bilan : le ressenti est noté dans la note (plugin.noterRessenti)');
});

// ───────────────────────── Le niveau ─────────────────────────

// Des séances complètes du programme 1.15.0, en alternant A et B, un jour sur deux à partir du 02/11 : la première qui fait
// passer le niveau 2 (les XP de chacune viennent de L.niveau ; le test le vérifie avant de s'en servir).
const MONTEE = () => {
  const liste = [];
  for (let k = 0; k < 12; k++) liste.push(seanceDuProgramme(L.plusJours('2026-11-02', 2 * k), k % 2));
  const reg = reglagesVue(pluginC());
  const k = liste.findIndex((s, i) => L.niveau(liste.slice(0, i + 1), P115, reg, s.date).niveau >= 2);
  return { avant: liste.slice(0, k), seance: liste[k] };
};

const bilanDe = (seance, avant) => ({ seance, records: L.records(seance, avant), compare: L.bilanCompare(seance, avant), premiere: !avant.length, chemin: seance.chemin, series: seance.exos.reduce((t, x) => t + x.series.length, 0), ressenti: '' });

// 2.14.2 (demande : « c'est mieux quand il arrive, à la fin de la séance : féliciter quand quelque chose a été complété, genre
// un accomplissement de succès ») : la carte « Bravo ! », juste sous la séance, une ligne par succès (L.succesSeance).
rendu('bilan : « Bravo ! » et les succès de la séance, juste sous la carte de la séance', async () => {
  simulerDate('2026-11-18T20:00:00');
  const p = pluginC({ etat: { seances: [S13, S18] } });
  const b = bilanDu18();
  const o = vueC(p, 'bilan', (v) => { v.bilan = b; });
  const carte = parClasse(o, 'salle-succes')[0];
  const attendu = L.succesSeance(b.seance, b.compare, L.cetteSemaine([S13, S18], '2026-11-18'), L.objectifSemaine(reglagesVue(p)));
  const lignes = carte ? parClasse(o, 'salle-succes-ligne').map((e) => e.className.replace(' salle-a-ic', '').split(' ').pop()) : [];
  egal([!!carte && carte.attrs.role, parClasse(o, 'salle-succes-titre').map((e) => e.textContent), lignes, parClasse(o, 'salle-succes-texte').map((e) => e.childNodes[0].textContent)],
    ['status', ['Bravo !'], attendu.map((x) => 'salle-succes-' + x.cle), attendu.map((x) => x.titre)], 'bilan : « Bravo ! », une ligne par succès de L.succesSeance');
  ok(attendu.length >= 2 && attendu[0].cle === 'seance' && attendu.some((x) => x.cle === 'records'), 'bilan : l\'exemple du 18/11 : la séance, puis ses records');
});

rendu('bilan : « +N XP » en gros, les lignes de L.xpSeance, la barre du niveau qui avance', async () => {
  simulerDate('2026-11-18T20:00:00');
  const p = pluginC({ etat: { seances: [S13, S18] } });
  const o = vueC(p, 'bilan', (v) => { v.bilan = bilanDu18(); });
  const x = L.xpSeance(S18, [S13], P115, reglagesVue(p));
  const n = L.niveau([S13, S18], P115, reglagesVue(p), '2026-11-18');
  const carte = parClasse(o, 'salle-xp-bilan')[0];
  const cartes = o.r().childNodes.map((e) => e.className || '');
  egal([parClasse(o, 'salle-xp-total').map((e) => e.textContent), parClasse(o, 'salle-xp-ligne').map((e) => e.childNodes.map((c) => c.textContent)),
    parClasse(o, 'salle-xp-niveau').map((e) => e.textContent), parClasse(o, 'salle-niveau-plein').map((e) => e.style.width), parClasse(o, 'salle-xp-montee').length,
    /salle-succes/.test(cartes[cartes.findIndex((c) => /salle-xp-bilan/.test(c)) - 1]), /salle-heros-bilan/.test(cartes[cartes.findIndex((c) => /salle-succes/.test(c)) - 1])],
  [[`+${x.total} XP`], x.lignes.map((l) => [l.texte, `+${l.xp}`]), [`Niveau ${n.niveau} · ${n.titre}`], [pcNiveau(n.part)], 0, true, true],
  'bilan : « +N XP » en gros, les lignes de L.xpSeance, la barre du niveau qui avance');
  egal([x.total > 0, x.lignes[0].texte, !!carte && carte.tous((e) => e.attrs.role === 'progressbar').length], [true, 'Séance faite', 1], 'bilan : les XP de la séance : « Séance faite » d\'abord, une barre lisible (progressbar)');
});

rendu('bilan : la séance qui fait passer un niveau : « Niveau 2 ! » et le titre, l\'animation au premier dessin seulement', async () => {
  const m = MONTEE();
  simulerDate(`${m.seance.date}T20:00:00`);   // le soir de cette séance (2.10.0 : des semaines plus tard, les séances manquées auraient coûté des XP)
  egal([m.avant.length > 0, L.niveau(m.avant, P115, reglagesVue(pluginC()), m.seance.date).niveau, L.niveau(m.avant.concat([m.seance]), P115, reglagesVue(pluginC()), m.seance.date).niveau], [true, 1, 2], 'bilan : le cas de la montée existe (niveau 1 avant, 2 après)');
  // Avant que l'index relise la note (la séance n'est pas encore dans p.etat.seances), puis après (elle y est, avec son chemin).
  const p = pluginC({ etat: { seances: m.avant.slice() } });
  const o = vueC(p, 'bilan', (v) => { v.bilan = bilanDe(m.seance, m.avant); });
  const apres = vueC(pluginC({ etat: { seances: m.avant.concat([m.seance]) } }), 'bilan', (v) => { v.bilan = bilanDe(m.seance, m.avant); });
  const lire = (x) => [parClasse(x, 'salle-xp-montee-titre').map((e) => e.textContent), parClasse(x, 'salle-xp-montee-sous').map((e) => e.textContent), parClasse(x, 'salle-xp-fete').length, parClasse(x, 'salle-xp-monte').length];
  egal([lire(o), lire(apres)], [[['Niveau 2 !'], ['Débutant'], 1, 1], [['Niveau 2 !'], ['Débutant'], 1, 1]], 'bilan : la séance qui fait passer un niveau : « Niveau 2 ! » et le titre (avant et après la relecture de la note)');
  const x = L.xpSeance(m.seance, m.avant, P115, reglagesVue(p));
  egal(parClasse(o, 'salle-xp-total').map((e) => e.textContent), [`+${x.total} XP`], 'bilan : la montée : les XP de la séance notée');
  await cliquer(o, 'Bien');
  egal([lire(o), o.erreur()], [[['Niveau 2 !'], ['Débutant'], 0, 1], false], 'bilan : un nouveau dessin (le ressenti) garde « Niveau 2 ! » sans rejouer l\'animation');
});

// 2.2.0 : le titre vient des séances faites (paliers), plus du niveau : la montée de niveau redit seulement le titre ; le
// passage de palier a sa propre carte (tests/r42-paliers.js).
rendu('bilan : la montée de niveau redit le titre du palier, sans « Tu deviens »', async () => {
  simulerDate('2026-11-18T20:00:00');
  const vraie = L.niveau;
  // Le niveau d'avant la séance : 4 (Débutant) ; avec elle : 5 (Régulier).
  L.niveau = (seances) => {
    const n = vraie(seances, P115, reglagesVue(pluginC()), '2026-11-18');
    const avec = seances.indexOf(S18) >= 0;
    return Object.assign({}, n, { niveau: avec ? 5 : 4, titre: avec ? 'Régulier' : 'Débutant', derniere: n.derniere && Object.assign({}, n.derniere, { monte: avec, ancienNiveau: 4 }) });
  };
  let o;
  try { o = vueC(pluginC({ etat: { seances: [S13] } }), 'bilan', (v) => { v.bilan = bilanDu18(); }); } finally { L.niveau = vraie; }
  egal([parClasse(o, 'salle-xp-montee-titre').map((e) => e.textContent), parClasse(o, 'salle-xp-montee-sous').map((e) => e.textContent), o.erreur()],
    [['Niveau 5 !'], ['Régulier'], false], 'bilan : la montée de niveau redit le titre du palier, sans « Tu deviens »');
});

rendu('bilan : un calcul des XP qui échoue : pas de carte XP, le reste du bilan s\'affiche', async () => {
  simulerDate('2026-11-18T20:00:00');
  const vraie = L.niveau;
  L.niveau = () => { throw new Error('donnée inattendue'); };
  let o;
  try { o = vueC(pluginC({ etat: { seances: [S13, S18] } }), 'bilan', (v) => { v.bilan = bilanDu18(); }); } finally { L.niveau = vraie; }
  egal([o.erreur(), parClasse(o, 'salle-xp-bilan').length, parClasse(o, 'salle-alerte').length, parClasse(o, 'salle-tuile-bilan').length, !!o.bouton('Retour à l\'accueil')],
    [false, 0, 0, 3, true], 'bilan : un calcul des XP qui échoue : pas de carte XP, le reste du bilan s\'affiche');
});
