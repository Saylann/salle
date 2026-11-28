// Les rendus du plugin avec le faux DOM (tests/dom-factice.js) : un vrai SallePlugin chargé par onload dans un faux
// Obsidian (commandes, lien obsidian://salle, retour dans l'app), la vue de base (transitions, entrée en séance, écran allumé,
// carte d'erreur, consigne verte, compteur) et l'écran « Tester cet appareil ». Une règle = une vérification.
simulerDate('2026-11-16T18:00:00');

// Un faux Obsidian juste assez grand pour onload : un coffre en mémoire, un espace de travail qui fabrique les vues.
function fauxObsidian(notes, donnees) {
  const fichiers = {}, fabriques = {}, feuilles = [], ecrits = {}, prets = [];
  let horloge = 1;
  for (const p of Object.keys(notes)) fichiers[p] = { path: p, name: p.split('/').pop(), stat: { mtime: ++horloge, size: notes[p].length }, _t: notes[p] };
  const app = {
    _donnees: donnees, _fabriques: fabriques, _prets: prets, _ecrits: ecrits,
    vault: {
      getMarkdownFiles: () => Object.values(fichiers), cachedRead: async (f) => f._t, read: async (f) => f._t,
      modify: async (f, t) => { f._t = t; f.stat = { mtime: ++horloge, size: t.length }; },
      create: async (p, t) => { fichiers[p] = { path: p, name: p, stat: { mtime: ++horloge, size: t.length }, _t: t }; return fichiers[p]; },
      getAbstractFileByPath: (p) => fichiers[p] || null, getName: () => 'Coffre Test', on: () => ({}),
      adapter: { write: async (p, t) => { ecrits[p] = t; }, read: async (p) => { if (!fichiers[p]) throw new Error('absent'); return fichiers[p]._t; } },
    },
    workspace: {
      onLayoutReady: (cb) => { prets.push(cb()); },
      getLeavesOfType: (t) => feuilles.filter((l) => l.view && l.view.getViewType() === t),
      getMostRecentLeaf: () => null,
      getLeaf: () => {
        const leaf = { view: null, getViewState: () => ({}), async setViewState({ type }) { leaf.view = fabriques[type](leaf); feuilles.push(leaf); await leaf.view.onOpen(); } };
        return leaf;
      },
      revealLeaf() {}, setActiveLeaf() {}, on: () => ({}), activeLeaf: null,
    },
  };
  return app;
}
class PluginRendu extends SallePlugin {
  constructor(app) { super(); this.app = app; this.manifest = { dir: '.obsidian/plugins/salle' }; this.inscrit = { commandes: [], liens: {}, dom: [] }; }
  async loadData() { return this.app._donnees; }
  async saveData(d) { this.app._donnees = JSON.parse(JSON.stringify(d)); }
  registerView(t, f) { this.app._fabriques[t] = f; }
  addRibbonIcon() {}
  addCommand(c) { this.inscrit.commandes.push(c); }
  registerObsidianProtocolHandler(action, f) { this.inscrit.liens[action] = f; }
  registerDomEvent(el, type, f) { this.inscrit.dom.push({ el, type, f }); }
  registerEvent() {}
  registerInterval(id) { return id; }
}
const NOTES = { 'Programme.md': SP.PROGRAMME_DEFAUT, 'Forme.md': SP.FORME_DEFAUT };
const DONNEES = { reglages: { niveau: 'un peu', parSemaine: 3, duree: 60, jours: [0, 1, 2, 3, 4, 5, 6] }, enCours: null, bilan: { date: '2026-11-16', forme: 'normale', temps: 45 } };
async function demarrer(donnees, mobile) {
  const app = fauxObsidian(NOTES, donnees === undefined ? JSON.parse(JSON.stringify(DONNEES)) : donnees);
  const p = new PluginRendu(app);
  if (mobile) p.mobile = () => true;
  await p.onload();
  await Promise.all(app._prets);
  return { p, app, v: p.vues()[0] };
}
const tic = async () => { for (let i = 0; i < 20; i++) await null; };
const texte = (v) => v.contentEl.textContent;
const cartes = (v) => v.contentEl.tous((e) => e.classList && e.classList.contains('salle-diag'));
const carte = (v, titre) => cartes(v).find((c) => c.textContent.indexOf(titre) >= 0);
const boutonDans = (el, t) => el && el.tous((e) => e.tagName === 'button' && e.textContent.indexOf(t) >= 0)[0];
const cliquer = async (b, ev) => { ok(b, 'élément à toucher présent'); if (b) for (const f of b.ev.click || []) await f(ev || { target: b }); await tic(); };
// Pose des propriétés sur un objet le temps d'un test, puis remet ce qu'il y avait.
async function avecProps(obj, props, fn) {
  const avant = {};
  for (const k of Object.keys(props)) { avant[k] = Object.prototype.hasOwnProperty.call(obj, k) ? { v: obj[k] } : null; obj[k] = props[k]; }
  try { return await fn(); } finally { for (const k of Object.keys(props)) { if (avant[k]) obj[k] = avant[k].v; else delete obj[k]; } }
}

// ── Le plugin : chargement, lien obsidian://salle ──
rendu('onload : commandes, lien obsidian://salle, retour dans l\'app, data.json repris', async () => {
  const { p, v } = await demarrer();
  ok(v && v.ecran === 'accueil' && v.contentEl.classList.contains('salle'), 'onload : la vue s\'ouvre, sur l\'accueil');
  egal(p.inscrit.commandes.map((c) => c.name), ['Ouvrir la salle', 'Commencer la séance du jour', 'Série faite', 'Lancer le repos', 'Tester cet appareil'], 'onload : les commandes');
  ok(typeof p.inscrit.liens.salle === 'function', 'onload : le lien obsidian://salle est inscrit (registerObsidianProtocolHandler)');
  ok(p.inscrit.dom.some((d) => d.el === document && d.type === 'visibilitychange'), 'onload : le retour dans l\'app est écouté sur document (registerDomEvent)');
  egal([p.donnees.bilan && p.donnees.bilan.temps, p.donnees.reglages.son, p.donnees.reglages.semainesLegeres], [45, true, ['2027-01-18']], 'onload : bilan du jour gardé, réglages 2.0 complétés');
  egal(Object.keys(p.app._ecrits).filter((c) => c.indexOf('.obsidian/') === 0), [], 'onload : rien n\'est écrit dans le dossier du plugin (plus de fichier d\'état, 2.26.0)');
  const lien = p.inscrit.liens.salle;
  await lien({ action: 'salle', ecran: 'progres' });
  ok(v.ecran === 'progres' && texte(v).indexOf('Le plugin a rencontré une erreur') < 0, 'lien ?ecran=progres : l\'écran Progrès');
  await lien({ action: 'salle', ecran: 'diagnostic' });
  ok(v.ecran === 'diagnostic' && texte(v).indexOf('Tester cet appareil') >= 0, 'lien ?ecran=diagnostic : l\'écran de test');
  egal([v.getState().ecran, !!p.session && v.getState().session === p.session], ['diagnostic', true], 'getState : Obsidian garde l\'écran de test, avec la session du plugin');
  // 2.18.2 (demande : « chaque fois que je ferme, sur mon téléphone ça ouvre sur Progrès au lieu de l'accueil ») : l'écran gardé
  // ne compte que pendant la même ouverture d'Obsidian.
  v.ecran = 'accueil';
  await v.setState({ ecran: 'progres' }, {});
  const sansSession = v.ecran;
  await v.setState({ ecran: 'progres', session: 'une-autre-fois' }, {});
  const autreSession = v.ecran;
  await v.setState({ ecran: 'progres', session: p.session }, {});
  egal([sansSession, autreSession, v.ecran], ['accueil', 'accueil', 'progres'], 'setState : un écran gardé d\'une autre ouverture est ignoré (l\'accueil) ; celui de cette ouverture est repris');
  v.ecran = 'diagnostic'; v.rendre();
  await lien({ action: 'salle', ecran: 'nimporte' });
  ok(v.ecran === 'accueil', 'lien : un écran inconnu donne l\'accueil');
  await lien({ action: 'salle', ecran: 'seance' });
  ok(['avant', 'resume', 'accueil'].indexOf(v.ecran) >= 0, 'lien ?ecran=seance sans séance en cours : la séance du jour commence (bilan d\'avant, ou l\'accueil tant que ouvrirSeanceDuJour manque)');
  await lien({ action: 'salle' });
  ok(['avant', 'resume', 'accueil'].indexOf(v.ecran) >= 0, 'lien obsidian://salle seul : ouvre la vue sans changer d\'écran');
});

rendu('premier lancement : le lien attend les premières questions', async () => {
  const { p, v } = await demarrer(null);
  ok(v.ecran === 'questions', 'sans data.json : les premières questions');
  await p.inscrit.liens.salle({ action: 'salle', ecran: 'progres' });
  ok(v.ecran === 'questions' && p.donnees.reglages === null, 'lien ?ecran=progres : on reste sur les questions, rien n\'est créé');
});

// ── La vue de base ──
rendu('aller : transition douce si l\'appareil sait, jamais sous « moins de mouvement »', async () => {
  const { v } = await demarrer();
  let n = 0, enAttente = null;
  await avecProps(document, { startViewTransition: (cb) => { n++; cb(); return {}; } }, async () => {
    await avecProps(window, { matchMedia: () => ({ matches: false }) }, async () => {
      v.aller('progres');
      ok(n === 1 && v.ecran === 'progres' && texte(v).indexOf('Progrès') >= 0, 'aller : View Transition utilisée, l\'écran dessiné');
    });
    await avecProps(window, { matchMedia: (q) => ({ matches: /reduced-motion/.test(q) }) }, async () => {
      v.aller('guide');
      ok(n === 1 && v.ecran === 'guide', 'aller : « réduire les animations » → dessin direct, sans transition');
    });
    await avecProps(document, { visibilityState: 'hidden' }, async () => {
      v.aller('mesures');
      ok(n === 1 && v.ecran === 'mesures', 'aller : page cachée → dessin direct');
    });
  });
  await avecProps(document, { startViewTransition: (cb) => { enAttente = cb; return {}; } }, async () => {
    v.aller('progres');
    ok(v.ecran === 'progres' && texte(v).indexOf('Mesures') >= 0, 'aller : l\'état change tout de suite ; l\'ancien écran reste jusqu\'à la transition');
    enAttente();
    ok(texte(v).indexOf('Progrès') >= 0, 'aller : le dessin arrive avec la transition');
  });
  v.aller('accueil');
  ok(v.ecran === 'accueil', 'aller : sans View Transitions (Mac ancien, tests), dessin direct');
});

// 2.38.13 (demande : la séance apparaît comme le centre de notifications d'Apple, avec un flou derrière).
rendu('aller : la séance descend du haut, et remonte en la quittant ; les autres écrans gardent le fondu', async () => {
  const { v } = await demarrer();
  v.entrerSeance = () => {};
  v.ecranSeance = (r) => r.appendChild(h('div', { text: 'écran de séance' }));
  const html = document.createElement('html');
  const vus = [];
  let finir = null;
  await avecProps(document, { documentElement: html, startViewTransition: (cb) => { vus.push(html.className.trim()); cb(); return { finished: { then: (a) => { finir = a; } } }; } }, async () => {
    await avecProps(window, { matchMedia: () => ({ matches: false }) }, async () => {
      v.aller('seance');
      const pendant = html.className.trim();
      finir();
      const apres = html.className.trim();
      v.ecran = 'seance';   // sans séance en cours, le dessin renvoie à l'accueil ; ici, on y est encore
      v.aller('accueil');
      finir();
      v.aller('progres');
      finir();
      egal([vus, pendant, apres, html.className.trim()], [['salle-vt-descend', 'salle-vt-remonte', ''], 'salle-vt-descend', '', ''],
        'entrer : « descend » le temps de la transition ; quitter : « remonte » ; ailleurs : rien (le fondu)');
    });
  });
});
rendu('aller : entrer dans la séance (entrerSeance une fois, à l\'entrée)', async () => {
  const { p, v } = await demarrer();
  let entrees = 0;
  v.entrerSeance = () => { entrees++; };
  v.ecranSeance = (r) => r.appendChild(h('div', { text: 'écran de séance' }));
  p.donnees.enCours = { nom: 'Séance A', date: '2026-11-16', debut: 1, exos: [{ nom: 'Échauffement', series: 1, echauffement: true, faites: [] }], courant: 0 };
  v.aller('seance');
  v.aller('seance');
  ok(entrees === 1 && v.ecran === 'seance', 'aller(\'seance\') : entrerSeance à l\'entrée seulement');
  v.aller('accueil');
  v.passer = true; v.aide = true; v.confirmerLe = 2; v.annulerLe = 1;
  v.aller('seance');
  ok(entrees === 2 && v.passer === false && v.aide === false && v.confirmerLe === 0 && v.annulerLe === 0, 'aller : les champs de la séance (passer, aide, confirmer, annuler) remis à zéro');
  const sc = { nom: 'x', date: '2026-11-16', exos: [{ nom: 'Échauffement', series: 1, echauffement: true, faites: [] }, { nom: 'Presse', series: 3, faites: [] }], courant: 1 };
  p.donnees.enCours = sc;
  v.saisie = { pour: 1, c: 60, v: 10 };
  v.reprendreEchauffement();
  ok(sc.courant === 0 && v.saisie === null, 'repli 1.15.0 (sans entrerSeance) : on reprend à l\'échauffement pas fait');
  p.donnees.enCours = null;
});

rendu('écran allumé : demandé une fois, relâché à la fin, redemandé au retour dans l\'app', async () => {
  const { p, v } = await demarrer();
  const verrous = [];
  await avecProps(navigator, { wakeLock: { request: async () => {
    const s = { released: false, ecoute: null, addEventListener(t, f) { if (t === 'release') s.ecoute = f; }, async release() { s.released = true; s.relache = true; } };
    verrous.push(s);
    return s;
  } } }, async () => {
    v.ecranSeance = (r) => r.appendChild(h('div', { text: 'écran de séance' }));
    v.entrerSeance = () => {};
    p.donnees.enCours = { nom: 'Séance A', date: '2026-11-16', debut: 1, exos: [], courant: 0 };
    v.aller('seance');
    v.rendre();
    await tic();
    ok(verrous.length === 1 && v.verrou === verrous[0], 'séance : une seule demande, même si l\'écran se redessine pendant qu\'elle part');
    verrous[0].released = true;
    verrous[0].ecoute();
    ok(v.verrou === null, 'séance : iOS relâche le verrou (app cachée) → la vue le sait');
    p.surVisibilite();
    await tic();
    ok(verrous.length === 2 && v.verrou === verrous[1], 'retour dans l\'app (visibilitychange) : le verrou est redemandé pendant la séance');
    p.donnees.enCours = null;
    v.aller('accueil');
    await tic();
    ok(verrous[1].relache && v.verrou === null, 'fin de séance : le verrou est relâché');
    p.surVisibilite();
    await tic();
    ok(verrous.length === 2, 'hors séance : rien n\'est demandé au retour dans l\'app');
    p.donnees.reglages.appareils = { bureau: { ecran: false } };
    p.donnees.enCours = { nom: 'Séance A', date: '2026-11-16', debut: 1, exos: [], courant: 0 };
    v.aller('seance');
    await tic();
    ok(verrous.length === 2, '« Tester cet appareil » a dit non : le plugin ne demande plus');
    p.donnees.enCours = null;
    v.aller('accueil');
  });
});

rendu('carte d\'erreur, consigne verte, en-tête, compteur', async () => {
  const { p, v } = await demarrer();
  v.ecranProgres = () => { throw new Error('boum'); };
  v.aller('progres');
  ok(texte(v).indexOf('Le plugin a rencontré une erreur.') >= 0 && texte(v).indexOf('boum') >= 0, 'erreur d\'affichage : une carte d\'erreur, jamais un écran blanc');
  await cliquer(boutonDans(v.contentEl, 'Revenir à l\'accueil'));
  ok(v.ecran === 'accueil' && texte(v).indexOf('boum') < 0, 'carte d\'erreur : « Revenir à l\'accueil » marche');
  delete v.ecranProgres;
  // 2.13.1 (changement voulu) : la consigne verte est toujours là, sans bouton « Compris ».
  const c = v.consigne('Une consigne.');
  ok(c && c.textContent.indexOf('Une consigne.') >= 0 && !boutonDans(c, 'Compris') && !!v.consigne('Une consigne.'), 'consigne : toujours montrée, sans « Compris »');
  const liste = v.consigne(['**Un** : premier.', '**Deux** : second.']);
  ok(liste.tous((e) => e.tagName === 'li').length === 2, 'consigne : un tableau donne des puces');
  const r = new El('div');
  let fait = 0;
  v.entete(r, 'Titre', { texte: 'Réglages', faire: () => { fait++; } }, 'diagnostic');
  await cliquer(boutonDans(r, 'Réglages'));
  ok(fait === 1, 'entete : un retour autre que l\'accueil (« Réglages »)');
  const vals = [];
  const cpt = v.compteur(20, 2.5, 'kg', true, (x) => vals.push(x));
  const champ = cpt.tous((e) => e.tagName === 'input')[0];
  champ.value = '20';   // le faux DOM ne relie pas l'attribut value à la propriété
  await cliquer(cpt.tous((e) => e.tagName === 'button')[1]);
  await cliquer(cpt.tous((e) => e.tagName === 'button')[0]);
  ok(vals.join() === '22.5,20' && /salle-nombre/.test(champ.className), 'compteur : − et + au pas de la machine, chiffres arrondis (salle-nombre)');
});

rendu('donneesChangees : pas de redessin pendant la séance, les questions, les mesures, avant et le test', async () => {
  const { v } = await demarrer();
  let n = 0;
  const vrai1 = v.rendre;
  v.rendre = function () { n++; return vrai1.call(this); };
  for (const e of ['seance', 'questions', 'mesures', 'avant', 'diagnostic']) { v.ecran = e; v.donneesChangees(); }
  ok(n === 0, 'donneesChangees : ces écrans ne sont pas redessinés sous les doigts');
  v.ecran = 'progres';
  v.donneesChangees();
  ok(n === 1, 'donneesChangees : les autres écrans suivent les notes');
  delete v.rendre;
});

rendu('vibreur : l\'interrupteur iOS 18 caché, ou rien', async () => {
  const { p } = await demarrer();
  const el = p.vibreur();
  ok(el && el.tagName === 'input' && el.attrs.type === 'checkbox' && el.attrs.switch === '' && el.attrs.tabindex === '-1' && el.attrs['aria-hidden'] === 'true' && /salle-vibre/.test(el.className),
    'vibreur : <input type="checkbox" switch class="salle-vibre" tabindex="-1" aria-hidden="true">');
  p.donnees.reglages.vibration = false;
  ok(p.vibreur() === null, 'vibreur : rien si la vibration est coupée dans les réglages');
  p.donnees.reglages.vibration = true;
  p.donnees.reglages.appareils = { bureau: { vibration: false } };
  ok(p.vibreur() === null, 'vibreur : rien si le test a dit que l\'appareil ne vibre pas');
});

// ── Tester cet appareil ──
rendu('Tester cet appareil : chaque test, ce qui marche est gardé', async () => {
  const { p, v } = await demarrer(undefined, true);
  v.aller('diagnostic');
  ok(cartes(v).length === 5 && texte(v).split('Pas testé').length - 1 === 5 && texte(v).indexOf('Le plugin a rencontré une erreur') < 0, 'diagnostic : 5 tests, tous « Pas testé » au début');
  ok(v.contentEl.tous((e) => e.tagName === 'button').every((b) => (b.ev.click || []).length), 'diagnostic : chaque bouton a une action');
  ok(!boutonDans(v.contentEl, 'Compris') && texte(v).indexOf('cet iPhone') >= 0, 'diagnostic : la consigne (sur iPhone), sans « Compris »');
  v.rendre();
  ok(texte(v).indexOf('Touche chaque test sur cet iPhone') >= 0, 'diagnostic : la consigne est toujours là');

  // 1. Écran allumé (calculé)
  await avecProps(navigator, { wakeLock: { request: async () => ({ async release() {} }) } }, async () => {
    await cliquer(boutonDans(carte(v, 'Écran allumé'), 'Tester'));
  });
  ok(p.peut('ecran') === true && carte(v, 'Écran allumé').textContent.indexOf('Marche') >= 0, 'écran allumé : un toucher, le résultat, gardé (Marche)');
  // 2.25.0 : les réglages (dont les tests de l'appareil) sont dans la note « Réglages », plus dans data.json.
  const noteReglages = () => p.app.vault.getAbstractFileByPath(p.app._donnees.noteReglages)._t;
  egal([L.lireNoteReglages(noteReglages()).appareils.mobile.ecran, 'reglages' in p.app._donnees], [true, false], 'écran allumé : le résultat est dans la note « Réglages », pour cet appareil');

  // 2. Bip : sans Web Audio, non tout de suite ; avec, « Tu as entendu le bip ? »
  await cliquer(boutonDans(carte(v, 'Bip'), 'Faire un bip'));
  ok(p.peut('son') === false && carte(v, 'Bip').textContent.indexOf('Ne marche pas') >= 0, 'bip : pas de Web Audio → « Ne marche pas », sans question');
  const osc = [];
  class FauxAudio { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { const o = { frequency: {}, connect() {}, start() {}, stop() {} }; osc.push(o); return o; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } createBuffer() { return {}; } createBufferSource() { return { connect() {}, start() {} }; } resume() { return Promise.resolve(); } }
  await avecProps(window, { AudioContext: FauxAudio }, async () => {
    await cliquer(boutonDans(carte(v, 'Bip'), 'Faire un bip'));
    ok(osc.length === 1 && texte(v).indexOf('Tu as entendu le bip ?') >= 0, 'bip : joué pour le test, même si le test d\'avant a dit non ; puis la question');
    await cliquer(boutonDans(carte(v, 'Bip'), 'Oui'));
  });
  ok(p.peut('son') === true && texte(v).indexOf('Tu as entendu le bip ?') < 0, 'bip : « Oui » → Marche, la question part');
  await cliquer(boutonDans(carte(v, 'Bip'), 'Bip allumé'));
  ok(p.donnees.reglages.son === false && boutonDans(carte(v, 'Bip'), 'Bip coupé'), 'bip : le réglage oui / non, à côté du test');

  // 3. Vibration : le « bouton » est un label qui contient l'interrupteur ; le clic transmis à l'input est ignoré
  const label = () => carte(v, 'Vibration').tous((e) => e.tagName === 'label')[0];
  ok(label() && label().attrs.role === 'button' && label().tous((e) => e.tagName === 'input' && /salle-vibre/.test(e.className) && e.attrs.switch === '').length === 1,
    'vibration : un label role="button" qui contient l\'interrupteur caché');
  const avantClic = JSON.stringify([p.app._donnees, noteReglages()]);
  await cliquer(label(), { target: { tagName: 'INPUT' } });
  ok(JSON.stringify([p.app._donnees, noteReglages()]) === avantClic && texte(v).indexOf('Tu as senti') < 0, 'vibration : le second clic (celui de l\'interrupteur) ne compte pas');
  await cliquer(label());
  ok(p.peut('vibration') === false && carte(v, 'Vibration').textContent.indexOf('Ne marche pas') >= 0, 'vibration : pas d\'interrupteur qui vibre ici → « Ne marche pas », sans question');
  await avecProps(globalThis, { HTMLInputElement: Object.assign(function () {}, { prototype: { switch: false } }) }, async () => {
    await cliquer(label());
    ok(texte(v).indexOf('Tu as senti une petite vibration ?') >= 0, 'vibration : iOS 18 → « Tu as senti une petite vibration ? »');
    await cliquer(boutonDans(carte(v, 'Vibration'), 'Oui'));
  });
  ok(p.peut('vibration') === true, 'vibration : « Oui » → Marche');

  // 4. Lien obsidian://salle (calculé : le plugin reçoit son propre lien)
  const ouverts = [], attentes = [];
  await avecProps(window, { open: (u) => { ouverts.push(u); }, setTimeout: (f, ms) => { attentes.push({ f, ms }); return attentes.length; } }, async () => {
    await cliquer(boutonDans(carte(v, 'Lien obsidian'), 'Tester'));
    ok(ouverts[0] === 'obsidian://salle?vault=Coffre%20Test&ecran=diagnostic&test=obsidian' && boutonDans(carte(v, 'Lien obsidian'), 'Test en cours'), 'lien : le test ouvre obsidian://salle…&test=obsidian');
    await p.inscrit.liens.salle({ action: 'salle', vault: 'Coffre Test', ecran: 'diagnostic', test: 'obsidian' });
    ok(p.peut('obsidian') === true && v.ecran === 'diagnostic' && carte(v, 'Lien obsidian').textContent.indexOf('Marche') >= 0, 'lien : reçu → « Marche », on reste sur le test');

    // 5. Raccourci « Repos salle » (iPhone) : parti dans Raccourcis, revenu sans réponse → non
    await cliquer(boutonDans(carte(v, 'Raccourci « Repos salle »'), 'Tester'));
    ok(/^shortcuts:\/\/x-callback-url\/run-shortcut\?name=Repos%20salle&input=text&text=3/.test(ouverts[1]), 'raccourci : le test lance « Repos salle » (3 s)');
    await avecProps(document, { visibilityState: 'hidden' }, async () => { p.surVisibilite(); });
    p.surVisibilite();
    const attente = attentes.find((a) => a.ms === 2500);
    ok(attente, 'raccourci : de retour dans Obsidian, on attend la réponse 2,5 s');
    await attente.f();
    await tic();
    ok(p.peut('shortcuts') === false && carte(v, 'Raccourci « Repos salle »').textContent.indexOf('Ne marche pas') >= 0, 'raccourci : pas de réponse → « Ne marche pas » (le plugin ne lancera plus le raccourci)');
  });
  let copie = null;
  await avecProps(navigator, { clipboard: { writeText: async (t) => { copie = t; } } }, async () => {
    await cliquer(boutonDans(carte(v, 'Lien obsidian'), 'Copier le lien de la séance'));
  });
  egal(copie, 'obsidian://salle?vault=Coffre%20Test&ecran=seance', 'lien : « Copier le lien de la séance » (pour le bouton de l\'écran verrouillé)');
  ok(texte(v).indexOf('Dernier test le 16/11 sur cet iPhone.') >= 0, 'diagnostic : la date du dernier test');
  await cliquer(boutonDans(v.contentEl, 'Réglages'));
  ok(v.ecran === 'questions', 'diagnostic : « Réglages » ramène aux réglages');
});

rendu('Tester cet appareil sur le Mac : le raccourci de l\'iPhone ne se teste pas ici', async () => {
  const { v } = await demarrer();
  v.aller('diagnostic');
  ok(carte(v, 'Raccourci « Repos salle »').textContent.indexOf('À tester sur l\'iPhone.') >= 0 && !boutonDans(carte(v, 'Raccourci « Repos salle »'), 'Tester') && texte(v).indexOf('ce Mac') >= 0,
    'diagnostic (Mac) : « À tester sur l\'iPhone », pas de bouton');
});

// ── L'onglet du plugin dans les réglages d'Obsidian ──
// Le réglage d'Obsidian (Settings → Salle) garde ses lignes et reçoit le minuteur de l'iPhone :
// le même réglage (reglages.chronoIphone) que l'onglet Appli de la vue. Un faux PluginSettingTab et un faux Setting, le
// temps du test (le faux Obsidian des tests n'en a pas : sans eux, l'onglet n'est pas créé).
rendu('réglages d\'Obsidian : le minuteur de l\'iPhone, le même réglage que l\'onglet Appli', async () => {
  const { p, v } = await demarrer();
  const lignes = [];
  class Setting {
    constructor(el) { this.l = { nom: '', bascule: null }; lignes.push(this.l); el.appendChild(new El('div')); }
    setName(n) { this.l.nom = n; return this; }
    setDesc() { return this; }
    addButton(f) { f({ setButtonText() { return this; }, onClick() { return this; } }); return this; }
    addToggle(f) { const l = this.l; const t = { setValue(x) { l.valeur = x; return t; }, onChange(g) { l.bascule = g; return t; } }; f(t); return this; }
  }
  let onglet = null;
  obsidian.PluginSettingTab = class { constructor(app, plugin) { this.app = app; this.plugin = plugin; this.containerEl = new El('div'); } };
  obsidian.Setting = Setting;
  p.addSettingTab = (o) => { onglet = o; };
  try { p.ongletReglages(); onglet.display(); } finally { delete obsidian.PluginSettingTab; delete obsidian.Setting; }
  const minuteur = lignes.find((l) => /Minuteur de l'iPhone/.test(l.nom));
  const avant = minuteur && minuteur.valeur;
  await minuteur.bascule(true);
  v.ongletReglages = 'appli'; v.aller('questions');
  const ligneVue = v.contentEl.tous((e) => /salle-reglage-ligne/.test(e.className || '') && e.textContent.indexOf('Minuteur de l\'iPhone') >= 0)[0];
  egal([lignes.map((l) => l.nom), avant, p.donnees.reglages.chronoIphone, ligneVue && ligneVue.textContent.indexOf('Activé') >= 0],
    [['Tester cet appareil', 'Minuteur de l\'iPhone (« Repos salle »)', 'Bip à la fin du repos', 'Vibration à « Série faite »', 'Lien de la séance'], false, true, true],
    'réglages d\'Obsidian : le minuteur de l\'iPhone, le même réglage que l\'onglet Appli');
});
