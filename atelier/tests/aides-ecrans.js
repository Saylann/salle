// Les aides des tests d'écran r60 à r67, chargées une fois par tests/rendu.js (après tests/dom-factice.js) : un plugin pour
// ces écrans (pluginC), une vue rendue (vueC), toucher un bouton (cliquer), les éléments d'une classe (parClasse), des
// séances notées (seanceNotee, seanceDuProgramme), les bilans du contrat 2.0 (S13, S18). Les exemples chiffrés sont ceux de
// ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-contrat-2.0.md, sur le programme 1.15.0 figé : ils ne bougent pas quand Programme.md change.

const P115 = L.lireProgramme(PROGRAMME_115);   // le programme 1.15.0 figé (tests/programme-115.js)

// ── Aides du fichier ──
// Un plugin pour ces écrans : le programme 1.15.0, un habitué (1 h, 3 séances), et les méthodes du plugin
// (déjà vu sur l'appareil, pause, semaine légère, 5e case, son, ressenti, mesure, suppression) notées dans « appels ».
function pluginC(o) {
  o = o || {};
  const p = fauxPlugin({
    etat: Object.assign({ programme: P115 }, o.etat || {}),
    donnees: Object.assign({ reglages: { niveau: 'regulier', parSemaine: 3, duree: 60 } }, o.donnees || {}),
  });
  p.appels = [];
  const vus = new Set(o.vus || []);
  p.dejaVu = (cle) => vus.has(cle);
  p.marquerVu = (cle) => { vus.add(cle); p.appels.push(['marquerVu', cle]); };
  p.basculerPause = async (lundi, malade) => {   // 2.3.0 : malade (la semaine en cours) est noté
    p.appels.push(malade ? ['basculerPause', lundi, true] : ['basculerPause', lundi]);
    const r = p.donnees.reglages;
    r.pauses = L.basculerDate(r.pauses || [], lundi);
    r.malade = L.basculerDate(r.malade || [], lundi, r.pauses.indexOf(lundi) >= 0 && !!malade);
  };
  p.choisirSemaineLegere = async (lundi, oui) => { p.appels.push(['choisirSemaineLegere', lundi, oui]); };
  p.cocherRecup = async (lundi, oui) => { p.appels.push(['cocherRecup', lundi, oui]); };
  p.preparerSon = () => { p.appels.push(['preparerSon']); };
  p.noterRessenti = async (chemin, v) => { p.appels.push(['noterRessenti', chemin, v]); };
  p.ajouterMesure = async (m) => { p.appels.push(['ajouterMesure', m]); };
  p.supprimerSeance = async (chemin) => { p.appels.push(['supprimerSeance', chemin]); };
  return p;
}

// Une vue rendue sur un écran, avec les outils de tests/dom-factice.js.
function vueC(p, ecran, avant) {
  const v = nouvelleVue(p);
  v.ecran = ecran || 'accueil';
  if (avant) avant(v);
  v.rendre();
  return Object.assign({ v }, outilsEcran(v));
}

// Toucher un bouton sans compter de vérification (absent : le test s'arrête en erreur, donc en échec).
async function cliquer(o, texte) {
  const b = o.bouton(texte);
  if (!b) throw new Error(`bouton « ${texte} » absent`);
  for (const f of b.ev.click || []) await f({ target: b });
}

// Les éléments dont la classe contient c (dans l'ordre de l'écran).
const parClasse = (o, c) => o.r().tous((e) => (' ' + (e.className || '') + ' ').indexOf(' ' + c + ' ') >= 0);

const texte = (o) => o.r().textContent;

// Une séance notée, relue comme une vraie note. exos : [[nom, '20×12, 20×10', réserve ?], …].
function seanceNotee(date, nom, exos, plus) {
  const s = Object.assign({ date, nom, exos: exos.map(([n, series, reserve]) => {
    const e = { nom: n, series: series.split(',').map((t) => { const m = /([\d.]+)\s*×\s*(\d+)/.exec(t); return m ? { c: +m[1], r: +m[2] } : null; }).filter(Boolean) };
    if (reserve) e.reserve = reserve;
    return e;
  }) }, plus || {});
  return Object.assign(L.lireSeance(L.ecrireSeance(s)), { chemin: `Séances/${date} ${nom}.md` });
}

// Une séance du programme 1.15.0 faite en entier (20 kg au bas de la fourchette, 40 s au gainage) ; regler la modifie.
function seanceDuProgramme(date, k, regler) {
  const s = { date, nom: P115[k].nom, exos: P115[k].exos.map((x) => ({ nom: x.nom, series: Array.from({ length: x.series }, () => (x.unite === 's' ? { s: 40 } : { c: 20, r: x.min })) })) };
  if (regler) regler(s);
  return Object.assign(L.lireSeance(L.ecrireSeance(s)), { chemin: `Séances/${date} ${s.nom}.md` });
}

// Le bilan du 13/11 et celui du 18/11 de la partie 1.2 du contrat (bilan de fin comparé).
const S13 = seanceNotee('2026-11-13', 'Séance B', [['Développé épaules aux haltères', '8×12, 8×12'], ['Presse à cuisses', '60×10, 60×10'], ['Élévations latérales aux haltères', '4×20, 4×15']], { dureeMin: 80 });

const S18 = seanceNotee('2026-11-18', 'Séance B', [['Développé épaules aux haltères', '10×9, 10×8'], ['Presse à cuisses', '60×11, 60×10'], ['Élévations latérales aux haltères', '4×18, 4×15'], ['Leg curl assis', '25×10']], { dureeMin: 64 });

const bilanDu18 = () => ({ seance: S18, records: L.records(S18, [S13]), compare: L.bilanCompare(S18, [S13]), premiere: false, chemin: S18.chemin, series: 7, ressenti: '' });

const BILAN_OK = (date) => ({ date, douleur: null, courb: { niveau: 'aucune', zones: [] } }); // 2.1.2 : ni forme ni temps

// La séance B du 13/11 (S13) : le mercredi 18/11, la cible du développé épaules monte à 10 kg (plus lourd que jamais) et la
// presse vise 60 × 11 (plus de répétitions à 60 kg). La liste est sur « Ta séance d'aujourd'hui », juste avant « Commencer » ;
// l'accueil n'en dit qu'une ligne.
const boostDe = (o) => parClasse(o, 'salle-boost')[0] || null;

// ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-niveaux-contrat.md, « Pour l'affichage » : les écrans montrent ce que calculent L.niveau, L.xpSeance et
// L.conseilNiveau (leurs règles sont testées dans t42-niveau.js). Ici : où, quoi, et rien ne bloque si le calcul échoue.
const pcNiveau = (part) => `${Math.round(Math.min(1, Math.max(0, part)) * 1000) / 10}%`;
