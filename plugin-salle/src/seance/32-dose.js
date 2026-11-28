// L : la dose (séries) et les superséries, la progression des séries, l'échauffement et les séries d'approche, la durée
// calée sur son rythme, le cardio de fin, la séance préparée. Pur, comme 30-seance-choix.js.

// ── La dose (séries) et les superséries ──
Object.assign(L, {
  // La séance du jour selon les réglages et la période (nbFaites = les séances DU PROGRAMME déjà faites ; cas = { reprise,
  // malade }, de L.repriseLongue et L.apresMaladie). Les règles, de « La bonne séance » :
  //  D1 mise en route (sauf « Régulièrement ») : les séances 1 à 4 du programme à 2 séries, sans les « option » [110].
  //  D2 reprise après plus de 8 semaines sans salle (cas.reprise) : pareil, 2 séances (avis) [110, 111].
  //  D3 45 min : sans les « option » ; L.preparerSeance groupe en superséries, toutes les séries gardées [20, 36].
  //  D4 1 h 15 : une série de plus aux 3 premiers exercices, 4 au plus (« les 3 premiers exercices à 4 séries, le 4e à 3 »,
  //     avis ; 4 à 6 séries par exercice ne font pas nettement mieux que 2 ou 3 [11, 12]). Dès la fin de la mise en
  //     route (plus de « rodage » des séances 5 à 8 : aucune étude). 2.38.69 : l'ordre de la séance alterne maintenant les
  //     muscles, il ne dit plus ce qui compte le plus. Si des exercices de la séance sont marqués « priorité » dans le
  //     programme, ce sont eux (les 3 premiers marqués) qui reçoivent la série ; sans aucune marque, les 3 premiers écrits.
  //  D5 2 séances par semaine (partiels) : une série de plus aux exercices du dos, des épaules et des pecs
  //     (L.MUSCLES_CARRURE), 4 au plus [11, 12], sans dépasser 8 séries directes par muscle dans la séance [28] (« Semaine de
  //     partiels : 2 séances, avec 1 série de plus » ; à séries égales, 1, 2 ou 3 fois par semaine donnent le même muscle [11, 45]).
  //  D6 première séance après une semaine malade (cas.malade) : séries divisées par deux, mêmes charges (exo.sansMontee)
  //     (avis, à partir du CIO [126]).
  //  D7 semaine légère : séries divisées par deux, mêmes charges [34, 35].
  // D1 et D2 passent avant tout le reste ; D5 et D6 ne s'ajoutent pas à une semaine légère, D5 ni au retour de maladie.
  adapter(exos, reglages, nbFaites, legere, cas) {
    const r = Object.assign({}, REGLAGES_DEFAUT, reglages || {});
    const c = cas || {};
    const D = OBJECTIF.dose, MAX_EXO = D.seriesMaxParExercice;   // les nombres du dosage : la fiche de l'objectif (objectif.json)
    let liste = exos.map((e) => Object.assign({}, e));
    // Les haltères de sa salle (premières questions) : de 2 en 2 kg, un exercice aux haltères ne monte pas de moins de 2 kg.
    if (r.pasHalteres > 0) liste.forEach((e) => { if (/halt[eè]res/i.test(e.nom) && !(e.pas >= r.pasHalteres)) e.pas = r.pasHalteres; });
    const decouverte = r.niveau !== 'regulier' && nbFaites < D.seancesDeDecouverte;
    const reprise = !decouverte && !!c.reprise;
    const deux = decouverte || reprise;
    if (r.duree <= D.dureeCourte || deux) liste = liste.filter((e) => !e.option);
    if (deux) liste.forEach((e) => { e.series = Math.min(e.series, D.seriesEnDecouverte); });
    else if (r.duree >= D.dureeLongue) {
      const marques = liste.filter((e) => e.priorite);
      (marques.length ? marques : liste).slice(0, D.exercicesRenforces).forEach((e) => { e.series = Math.max(e.series, Math.min(MAX_EXO, e.series + 1)); });
    }
    const leg = !!legere && !deux;
    const malade = !deux && !leg && !!c.malade;
    let partiels = false;
    if (r.parSemaine === 2 && !deux && !leg && !malade) {
      const directes = {};
      const compter = (e, n) => { const m = L.musclesExo(e.nom); Object.keys(m).forEach((k) => { if (m[k] === 1) directes[k] = (directes[k] || 0) + n; }); };
      liste.forEach((e) => compter(e, e.series));
      liste.forEach((e) => {
        if (e.unite === 's' || e.series >= MAX_EXO || L.MUSCLES_CARRURE.indexOf(L.musclePrincipal(e.nom)) < 0) return;
        const m = L.musclesExo(e.nom);
        if (Object.keys(m).some((k) => m[k] === 1 && directes[k] + 1 > L.REPERES_VOLUME.parSeance)) return;
        e.series += 1;
        compter(e, 1);
        partiels = true;
      });
    }
    if (leg || malade) liste.forEach((e) => { e.series = Math.max(1, Math.ceil(e.series / 2)); });
    if (malade) liste.forEach((e) => { e.sansMontee = true; });
    return { exos: liste, decouverte, reprise, malade, partiels, legere: leg, superseries: r.duree <= D.dureeCourte };
  },
  // Deux exercices peuvent-ils s'enchaîner en supersérie ? 0 = non, 1 = oui, 2 = oui et c'est le mieux (muscles opposés).
  // Non : l'échauffement ou un exercice au temps ; deux étages différents (deux étages inconnus = même étage) ; le même muscle
  // principal (L.musclePrincipal) ; deux gros exercices de la même famille (deux de jambes, deux développés, deux tirages) ;
  // un exercice de fin (bras, gainage) avec un autre qui ne l'est pas (les bras restent en fin, entre eux).
  // Le mieux : tirer avec pousser, ou l'avant avec l'arrière des cuisses (« La bonne séance », Méthodes pour gagner du temps).
  scorePaire(a, b) {
    if (!a || !b || a.echauffement || b.echauffement || a.unite === 's' || b.unite === 's') return 0;
    const etage = (x) => (L.estEtage(x.etage) ? x.etage : null);
    if (etage(a) !== etage(b)) return 0;
    const muscle = (x) => L.musclePrincipal(x.nom);
    const mA = muscle(a), mB = muscle(b);
    if (mA && mA === mB) return 0;
    // 2.38.91 (ses règles de l'ordre, 24/11 : « on doit pouvoir faire le mouvement de l'exo d'après » ; après les élévations,
    // pas de développé) : une supersérie enchaîne les deux exercices dans les deux sens : aucun muscle en commun
    // (L.musclesExo, même à moitié), et jamais un développé avec des élévations (les épaules) [Soares 2016, Olsson 2026].
    const mesA = L.musclesExo(a.nom), mesB = L.musclesExo(b.nom);
    if (Object.keys(mesA).some((k) => k in mesB)) return 0;
    const nA = L.norm(a.nom), nB = L.norm(b.nom);
    if ((/developpe/.test(nA) && /elevation/.test(nB)) || (/developpe/.test(nB) && /elevation/.test(nA))) return 0;
    const fA = L.famille(a.nom), fB = L.famille(b.nom);
    if (L.gros(a.nom) && L.gros(b.nom) && fA === fB) return 0;
    if (L.estFin(a.nom) !== L.estFin(b.nom)) return 0;
    if ((fA === 'tirer' && fB === 'pousser') || (fA === 'pousser' && fB === 'tirer')) return 2;
    if ((mA === 'quadriceps' && mB === 'ischios') || (mA === 'ischios' && mB === 'quadriceps')) return 2;
    return 1;
  },
  // Les superséries d'une séance déjà ordonnée, en deux passes : d'abord les meilleures paires (score 2, muscles opposés),
  // puis les paires à 1 parmi les exercices restants ; dans chaque passe, dans l'ordre, chaque exercice pas encore pris
  // prend le premier partenaire qui convient parmi les suivants (ainsi « presse + leg curl », la paire de « La bonne séance »,
  // partie 2, n'est pas cassée par « tirage + presse »).
  // Le partenaire vient juste après le premier des deux ; les deux reçoivent le même groupe (« g1 », « g2 »… dans l'ordre de la
  // liste). Sans partenaire, l'exercice reste seul. Rend une nouvelle liste de copies.
  grouperSuperseries(exos) {
    const l = (Array.isArray(exos) ? exos : []).filter(Boolean).map((x) => { const c = Object.assign({}, x); delete c.groupe; return c; });
    const avec = l.map(() => -1);
    [2, 1].forEach((voulu) => {
      for (let i = 0; i < l.length; i++) {
        if (avec[i] >= 0) continue;
        for (let j = i + 1; j < l.length; j++) {
          if (avec[j] < 0 && L.scorePaire(l[i], l[j]) === voulu) { avec[i] = j; avec[j] = i; break; }
        }
      }
    });
    const out = [], vus = new Set();
    let n = 0;
    l.forEach((a, i) => {
      if (vus.has(i)) return;
      vus.add(i);
      out.push(a);
      const j = avec[i];
      if (j < 0) return;
      vus.add(j);
      n++;
      a.groupe = l[j].groupe = 'g' + n;
      out.push(l[j]);
    });
    return out;
  },
});

// ── La progression des séries : 1 série de plus sur un exercice bloqué (avis) ──
Object.assign(L, {
  // Le plugin décide aussi le nombre de séries. Aucune étude ne donne la règle : plus de séries donne plus de muscle, avec un
  // gain qui diminue [37] ; au plus 20 % de séries en plus par bloc d'environ 4 semaines (avis d'experts) [32] ; 4 à 6 séries
  // par exercice ne font pas nettement mieux que 2 ou 3 [11, 12] ; au-delà de 20 séries par semaine et par muscle le gain est
  // petit et incertain [27, 41, 42] ; 8 séries directes au plus par muscle et par séance [28]. La règle (avis) :
  //  P1 à partir de 12 semaines après la première séance notée (« juge tes progrès sur 12 semaines ») ;
  //  P2 un exercice du dos, des épaules ou des pecs (L.MUSCLES_CARRURE), compté en répétitions ;
  //  P3 bloqué 3 semaines : rien gagné (ni charge ni répétition, L.compareExo) face à sa meilleure fois, pendant 21 jours au
  //     moins, avec des essais sur 3 semaines différentes (une semaine sans salle ne compte pas) ;
  //  P4 il reçoit 1 série de plus, pour de bon, et son horloge repart ;
  //  P5 limites : 4 séries par exercice ; 20 par semaine et par muscle (indirectes à ½) ; 8 directes par muscle et par
  //     séance ; +20 % par muscle sur 4 semaines.
  // Rien n'est gardé dans data.json : tout se recalcule depuis les notes (les deux appareils disent pareil ; une série gagnée
  // reste quand l'exercice reprogresse).
  PROGRESSION: OBJECTIF.progressionDesSeries,   // les seuils sont dans la fiche de l'objectif (objectif.json)
  // ── Les mesures pilotent le programme (2.31.0, demande : « si tu as mes mesures, elles doivent être prises en compte
  // pour atteindre l'objectif ») ──
  // À 12 semaines d'écart ou plus (L.JOURS_COMPARER), un tour qui n'a pas gagné son seuil (bras : L.RUBAN.hausse ; épaules :
  // L.RUBAN.epaules) alors qu'il a été régulier (2 séances par semaine en moyenne [47]) : les exercices de ce muscle gagnent
  // une série (4 au plus par exercice, L.appliquerProgression). Une série gagnée reste. Un avis : aucune étude ne donne cette
  // règle ; elle suit « plus de séries, plus de muscle » dans la zone [11, 12].
  TOURS_SUIVIS: { bras: ['biceps', 'triceps'], epaules: ['epaules'] },
  mesuresTriees(mesures, aujourdhui) {
    return (Array.isArray(mesures) ? mesures : []).filter((m) => m && L.deISO(m.date) && (!aujourdhui || m.date <= aujourdhui))
      .slice().sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  },
  // → { [nom normalisé]: { plus: 1, depuis, mesure: 'bras' | 'epaules' } }
  seriesParMesures(programme, seances, mesures, aujourdhui) {
    const out = {}, ms = L.mesuresTriees(mesures, aujourdhui);
    Object.keys(L.TOURS_SUIVIS).forEach((tour) => {
      const seuil = tour === 'epaules' ? L.RUBAN.epaules : L.RUBAN.hausse;
      const avec = ms.filter((m) => m[tour] > 0);
      let depuis = null;
      for (let k = 1; k < avec.length && !depuis; k++) {
        const z = avec[k];
        const a = avec.slice(0, k).filter((m) => L.joursEntre(m.date, z.date) >= L.JOURS_COMPARER).pop();
        if (!a || z[tour] - a[tour] >= seuil - 1e-9) continue;
        const faites = (seances || []).filter((s) => s && s.date > a.date && s.date <= z.date).length;
        if (faites >= Math.floor(L.joursEntre(a.date, z.date) / 7) * 2) depuis = z.date;
      }
      if (!depuis) return;
      (programme || []).forEach((s) => (s.exos || []).forEach((e) => {
        if (e.unite === 's' || L.TOURS_SUIVIS[tour].indexOf(L.musclePrincipal(e.nom)) < 0) return;
        out[L.norm(e.nom)] = { plus: 1, depuis, mesure: tour };
      }));
    });
    return out;
  },
  // Ce que les mesures changeront, pour l'écran Mesures : une ligne par tour suivi, avec la date du contrôle (12 semaines
  // après la première mesure). → des lignes courtes, mot clé en gras ; [] sans mesure.
  controlesMesures(mesures, aujourdhui) {
    const ms = L.mesuresTriees(mesures, aujourdhui), NOMS = { bras: ['Bras', 'tes bras gagnent'], epaules: ['Épaules', 'tes épaules gagnent'] };
    return Object.keys(L.TOURS_SUIVIS).map((tour) => {
      const premiere = ms.filter((m) => m[tour] > 0)[0];
      if (!premiere) return null;
      const seuil = tour === 'epaules' ? L.RUBAN.epaules : L.RUBAN.hausse;
      return `**${NOMS[tour][0]}** : contrôle le ${L.dateCourte(L.plusJours(premiere.date, L.JOURS_COMPARER))}. Sans ${L.fmt(seuil)} cm de plus, ${NOMS[tour][1]} une série (avis).`;
    }).filter(Boolean);
  },
  // → { [nom normalisé]: { plus, depuis } } : les exercices qui ont gagné des séries, et la date de la dernière gagnée.
  progressionSeries(programme, seances, reglages, aujourdhui) {
    const R = L.PROGRESSION, V = L.REPERES_VOLUME, out = {};
    const prog = (Array.isArray(programme) ? programme : []).filter((s) => s && Array.isArray(s.exos));
    if (!prog.length || !L.deISO(aujourdhui)) return out;
    const notes = (Array.isArray(seances) ? seances : []).filter((s) => s && L.deISO(s.date) && s.date <= aujourdhui && Array.isArray(s.exos))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (!notes.length || L.joursEntre(notes[0].date, aujourdhui) < R.apresJours) return out;   // P1
    const debut = notes[0].date;
    const reg = Object.assign({}, REGLAGES_DEFAUT, reglages || {});
    // Les séances du programme telles qu'il les fait (durée, 2 séances par semaine), hors mise en route et semaines spéciales.
    const adaptees = prog.map((s) => L.adapter(s.exos, reg, Infinity, false, {}).exos);
    const parSemaine = reg.parSemaine / prog.length;
    // 2.36.1 : un exercice écrit dans plusieurs séances gagne sa série dans une seule, la première du programme qui le
    // contient. Avant, la série comptait dans chaque séance : le plafond de +20 % par bloc la refusait toujours.
    const premiere = {}, plusieurs = {};   // nom normalisé → rang de sa première séance ; → vrai s'il est dans plusieurs
    adaptees.forEach((exos, k) => exos.forEach((e) => {
      const n = L.norm(e.nom);
      if (premiere[n] == null) premiere[n] = k;
      else if (premiere[n] !== k) plusieurs[n] = true;
    }));
    const candidats = {};   // P2 : { nom, plus, ref (sa meilleure fois), depuis, semaines (les lundis des essais sans gain) }
    adaptees.forEach((exos, k) => exos.forEach((e) => {
      if (premiere[L.norm(e.nom)] !== k) return;
      if (e.unite === 's' || e.series >= R.parExo || L.MUSCLES_CARRURE.indexOf(L.musclePrincipal(e.nom)) < 0) return;
      candidats[L.norm(e.nom)] = { nom: e.nom, plus: 0, ref: null, depuis: null, semaines: {}, gagneLe: null };
    }));
    if (!Object.keys(candidats).length) return out;
    // Le programme avec des séries gagnées (plus = { nom normalisé: n }), le volume par semaine, les séries directes par séance.
    const avec = (plus) => adaptees.map((exos, k) => ({ exos: exos.map((e) => Object.assign({}, e, { series: Math.min(R.parExo, e.series + (premiere[L.norm(e.nom)] === k ? plus[L.norm(e.nom)] || 0 : 0)) })) }));
    const hebdo = (plus) => { const v = L.volume(avec(plus)); Object.keys(v).forEach((m) => { v[m] *= parSemaine; }); return v; };
    const directes = (plus, muscle) => Math.max(...avec(plus).map((s) => s.exos.reduce((t, e) => t + (L.musclesExo(e.nom)[muscle] === 1 ? e.series : 0), 0)));
    const gagnees = [];   // { cle, date }, dans l'ordre
    const compte = (liste) => liste.reduce((o, g) => { o[g.cle] = (o[g.cle] || 0) + 1; return o; }, {});
    const peutGagner = (cle) => adaptees[premiere[cle]].some((e) => L.norm(e.nom) === cle && e.series + candidats[cle].plus < R.parExo);
    const permis = (cle, date) => {   // P5
      const apres = compte(gagnees.concat([{ cle, date }])), v = hebdo(apres);
      const muscles = L.musclesExo(candidats[cle].nom), principal = L.musclePrincipal(candidats[cle].nom);
      if (Object.keys(muscles).some((m) => m !== 'haut_pecs' && v[m] > V.max + 1e-9)) return false;
      if (Object.keys(muscles).some((m) => muscles[m] === 1 && directes(apres, m) > V.parSeance)) return false;
      const debutBloc = hebdo(compte(gagnees.filter((g) => L.joursEntre(g.date, date) >= R.blocJours)));
      return v[principal] <= debutBloc[principal] * (1 + R.partBloc) + 1e-9;
    };
    notes.forEach((s) => s.exos.forEach((e) => {
      const cle = L.norm(e.nom), c = candidats[cle];
      if (!c || !Array.isArray(e.series) || !e.series.length) return;
      const mieux = !c.ref || ['plus', 'charge'].indexOf(L.compareExo(e.series, { series: c.ref }).signe) >= 0;
      if (mieux) { c.ref = e.series; c.depuis = s.date; c.semaines = {}; return; }
      c.semaines[L.lundi(s.date)] = true;
      const bloque = L.joursEntre(c.depuis, s.date) >= R.bloqueJours && Object.keys(c.semaines).length >= R.bloqueSemaines;   // P3
      if (!bloque || L.joursEntre(debut, s.date) < R.apresJours || !peutGagner(cle) || !permis(cle, s.date)) return;
      c.plus += 1;   // P4
      c.gagneLe = c.depuis = s.date;
      c.semaines = {};
      gagnees.push({ cle, date: s.date });
    }));
    // La séance qui reçoit la série (son rang dans le programme donné), quand l'exercice est écrit dans plusieurs.
    const rangs = [];
    (Array.isArray(programme) ? programme : []).forEach((s, k) => { if (s && Array.isArray(s.exos)) rangs.push(k); });
    Object.keys(candidats).forEach((cle) => {
      if (!candidats[cle].plus) return;
      out[cle] = { plus: candidats[cle].plus, depuis: candidats[cle].gagneLe };
      if (plusieurs[cle]) out[cle].seance = rangs[premiere[cle]];
    });
    return out;
  },
  // Les séries gagnées posées sur la séance du jour (a, de L.adapter) : jamais pendant la mise en route, une reprise, un
  // retour de maladie ni une semaine légère (leurs séries sont réduites exprès). → les exercices dont c'est la première
  // séance avec leur série de plus (exo.seriePlus : la carte le dit une fois, « Ta séance d'aujourd'hui » aussi).
  // i (facultatif) : le rang de la séance du jour dans le programme ; une série gagnée pour une autre séance (g.seance)
  // n'est pas posée ici ; nom (facultatif) : le nom de cette séance, pour retrouver sa dernière fois à elle.
  appliquerProgression(a, gagnees, seances, i, nom) {
    const nouveaux = [];
    if (!a || a.decouverte || a.reprise || a.malade || a.legere) return nouveaux;
    a.exos.forEach((e) => {
      const g = gagnees && gagnees[L.norm(e.nom)];
      if (!g || e.series >= L.PROGRESSION.parExo) return;
      if (g.seance != null && i != null && g.seance !== i) return;
      e.series = Math.min(L.PROGRESSION.parExo, e.series + g.plus);
      // Sa dernière fois : dans cette séance-ci (nom) quand la série n'est gagnée que pour elle ; sinon l'autre séance, faite
      // entre-temps sans la série en plus, ferait taire l'annonce.
      const ss = g.seance != null && nom ? (seances || []).filter((s) => s && L.norm(s.nom || '') === L.norm(nom)) : seances || [];
      const der = L.derniere(ss, e.nom);
      if (der && der.date <= g.depuis) { e.seriePlus = true; nouveaux.push(e); }
    });
    return nouveaux;
  },
});

// ── L'échauffement : le vélo, puis les séries d'approche ──
Object.assign(L, {
  // L'échauffement, premier exercice de chaque séance (pas de charge : un minuteur de VELO_MIN minutes et « Fait »).
  exoEchauffement() {
    return { nom: 'Échauffement', echauffement: true, series: 1, min: VELO_MIN, max: VELO_MIN, unite: 'min', repos: 0, pas: 1, option: false, corps: true, faites: [] };
  },
  // Le vélo de l'échauffement : niveau 8 par défaut, sinon le dernier niveau noté.
  niveauVelo(seances) {
    for (let i = (seances || []).length - 1; i >= 0; i--) if (seances[i].veloNiveau > 0) return seances[i].veloNiveau;
    return 8;
  },
  // Une charge arrondie au pas de la machine ou des haltères, jamais sous un pas.
  arrondiPas(x, pas) {
    const p = pas > 0 ? pas : 1;
    return Math.max(p, L.arrondi2(Math.round(x / p) * p));
  },
  // Les séries d'approche (« La bonne séance », Échauffement), un tableau parallèle à exos : null ou [{ pct, r, plus? }].
  //  - le premier exercice avec charge : 8 répétitions à environ 50 % de la charge de travail, puis 4 à environ 75 % ;
  //  - avant la première presse, puis avant le premier développé, s'ils ne sont pas ce premier exercice : 8 à 50 % ;
  //  - en superséries (45 min), seulement 8 à 50 % sur le premier exercice.
  // Elles ne comptent nulle part (ni records, ni historique) et ne bloquent jamais la série 1.
  planApproches(exos, superseries) {
    const l = Array.isArray(exos) ? exos : [];
    const plan = l.map(() => null);
    const avecCharge = (x) => !!x && !x.echauffement && x.unite !== 's' && !x.corps;
    const k = l.findIndex(avecCharge);
    if (k >= 0) plan[k] = superseries ? [{ pct: 50, r: 8 }] : [{ pct: 50, r: 8 }, { pct: 75, r: 4 }];
    if (!superseries) {
      ['presse', 'developpe'].forEach((debut) => {
        const j = l.findIndex((x) => avecCharge(x) && L.norm(x.nom).indexOf(debut) === 0);
        if (j >= 0 && j !== k) plan[j] = [{ pct: 50, r: 8 }];
      });
    }
    return plan;
  },
  // Les approches d'un exercice avec leur charge. Cochée : la charge notée ; sinon le pourcentage de la charge de travail
  // (la cible de la série 1), arrondi au pas. Charge inconnue : « 8 répétitions très légères ».
  chargesApproches(exo, chargeTravail) {
    const pas = exo && exo.pas;
    return (exo && Array.isArray(exo.approches) ? exo.approches : []).filter(Boolean).map((a) => {
      const c = a.faite && a.c != null ? a.c : chargeTravail > 0 ? L.arrondiPas((chargeTravail * a.pct) / 100, pas) : null;
      const o = { pct: a.pct, r: a.r, c, faite: !!a.faite };
      if (a.plus) o.plus = true;
      o.texte = c > 0 ? `${a.r} × ${L.fmt(c)} kg` : `${a.r} répétitions très légères`;
      return o;
    });
  },
  // La série légère à faire maintenant (2.11.0, demande : un échauffement utile est une étape comme les autres, le programme est catégorique) : une étape comme une autre, dans l'ordre, avant la série 1. Des séries de plus en
  // plus lourdes avant le travail améliorent la performance [7, 8] (rien n'est établi sur les blessures [7]).
  // → { n (à partir de 1), sur, r, c, gros (« 22,5 kg × 8 »), index (dans exo.approches) } ; null s'il n'en reste pas, ou dès
  // qu'une vraie série est faite.
  // Le repos après une série légère [8] (texte intégral relu le 15/11/2026) : 1 min entre deux séries d'échauffement ; après la
  // dernière, le repos habituel de l'exercice avant la série 1 (dans l'étude : 3 min, son repos entre les séries).
  REPOS_LEGERE: 60,
  legereAFaire(exo, chargeTravail) {
    if (!exo || !Array.isArray(exo.approches) || (Array.isArray(exo.faites) && exo.faites.length)) return null;
    const index = [];
    exo.approches.forEach((a, k) => { if (a) index.push(k); });
    const liste = L.chargesApproches(exo, chargeTravail);
    const n = liste.findIndex((a) => !a.faite);
    if (n < 0) return null;
    const a = liste[n];
    return { n: n + 1, sur: liste.length, r: a.r, c: a.c, gros: a.c > 0 ? `${L.fmt(a.c)} kg × ${a.r}` : `${a.r} rép. légères`, index: index[n] };
  },
  // La ligne de la note, toujours une seule ligne de texte (jamais un « ## » ni une puce). Rien de fait : ''.
  //  { min, approches: [{ nom, series: [{ c, r }] }] } → « Échauffement : 5 min, puis approches : Tirage 8 × 20 kg, 4 × 30 kg ;
  //        Presse à cuisses 8 × 30 kg » ; sans vélo : « Échauffement : approches : … ».
  //  ancienne forme : { min: 5, serie: { c: 17.5, r: 10 } } → « Échauffement : 5 min, puis 10 × 17,5 kg ».
  ligneEchauffement(e) {
    if (!e) return '';
    const parts = [];
    if (e.min > 0) parts.push(`${Math.round(e.min)} min`);
    if (Array.isArray(e.approches)) {
      const exos = e.approches.filter((a) => a && a.nom && Array.isArray(a.series) && a.series.length)
        .map((a) => `${a.nom} ${a.series.map((s) => (s.c > 0 ? `${s.r} × ${L.fmt(s.c)} kg` : `${s.r} répétitions très légères`)).join(', ')}`);
      if (exos.length) parts.push('approches : ' + exos.join(' ; '));
    } else if (e.serie) {
      parts.push(e.serie.c > 0 ? `10 × ${L.fmt(e.serie.c)} kg` : '10 répétitions très légères');
    }
    return parts.length ? 'Échauffement : ' + parts.join(', puis ') : '';
  },
});

// ── La durée de la séance et le cardio de fin ──
Object.assign(L, {
  // L'estimation simple : 5 min, puis séries × (45 s + repos), arrondi à 5 min. Elle sert à l'écran Guide (« environ X min »,
  // 66-notes.js) ; la passer à L.dureeModele changerait le texte affiché.
  dureeEstimee(exos) {
    const sec = 300 + exos.reduce((t, e) => t + e.series * (45 + e.repos), 0);
    return Math.max(5, Math.round(sec / 300) * 5);
  },
  // Le modèle de « La bonne séance » (partie 2), en secondes : 45 s par série, 30 s pour passer d'une machine à l'autre
  // en supersérie, 1 min 30 par changement d'exercice et après chaque tour de supersérie, 1 min par changement d'étage,
  // 5 min de vélo, 45 s par série d'approche.
  DUREE: { serie: 45, machine: 30, exo: 90, tour: 90, etage: 60, velo: VELO_MIN * 60, approche: 45 },
  // La durée prévue en minutes (sans le cardio de fin). opts = { velo (s), approches (nombre), etageEchauffement }.
  // Exercice seul : n × 45 + (n − 1) × repos + 90. Supersérie (A puis B, tours = le plus grand nombre de séries) :
  // (nA + nB) × 45 + tours × 30 + (tours − 1) × 90 + 90. Plus 60 par changement d'étage (celui de l'échauffement compris).
  dureeModele(exos, opts) {
    const o = opts || {}, D = L.DUREE;
    const liste = (Array.isArray(exos) ? exos : []).filter((x) => x && !x.echauffement);
    const nb = (x) => (Array.isArray(x.series) ? x.series.length : Math.max(0, +x.series || 0));
    let sec = (o.velo != null ? o.velo : D.velo) + D.approche * (o.approches || 0);
    for (let i = 0; i < liste.length; i++) {
      const a = liste[i], b = liste[i + 1];
      if (a.groupe && b && b.groupe === a.groupe) {
        const nA = nb(a), nB = nb(b), tours = Math.max(nA, nB);
        sec += (nA + nB) * D.serie + tours * D.machine + Math.max(0, tours - 1) * D.tour + D.exo;
        i++;
      } else {
        const n = nb(a);
        if (n) sec += n * D.serie + (n - 1) * (typeof a.repos === 'number' && a.repos >= 0 ? a.repos : 90) + D.exo;
      }
    }
    let ici = L.estEtage(o.etageEchauffement) ? o.etageEchauffement : null;
    liste.forEach((x) => {
      if (!L.estEtage(x.etage)) return;
      if (ici != null && x.etage !== ici) sec += D.etage;
      ici = x.etage;
    });
    return Math.round(sec / 60);
  },
  // Le repos (et l'étage) d'un exercice d'après le programme : l'exercice de ce nom, sinon celui dont c'est un remplaçant
  // (« ou … ») ; inconnu : 1 min pour le gainage, 2 min pour un gros exercice, 1 min 30 sinon.
  reposDe(nom, programme) {
    const n = L.norm(nom), tous = [];
    (programme || []).forEach((s) => (s && Array.isArray(s.exos) ? s.exos : []).forEach((e) => tous.push(e)));
    const e = tous.find((x) => L.norm(x.nom) === n) || tous.find((x) => (x.alternatives || []).some((a) => L.norm(a.nom) === n));
    if (e) return L.estEtage(e.etage) ? { repos: e.repos, etage: e.etage } : { repos: e.repos };
    return { repos: L.famille(nom) === 'gainage' ? 60 : L.gros(nom) ? 120 : 90 };
  },
  // La durée qu'aurait dû prendre une séance notée, d'après ce qui est écrit dans la note (exercices, séries, vélo et
  // approches de la ligne « Échauffement : … »), cardio compris. Les superséries ne se voient pas dans la note : comptées seules.
  dureeNote(seance, programme) {
    if (!seance || !Array.isArray(seance.exos)) return 0;
    const ech = seance.echauffement;
    const exos = seance.exos.filter((e) => e && Array.isArray(e.series) && e.series.length)
      .map((e) => Object.assign({ nom: e.nom, series: e.series.length }, L.reposDe(e.nom, programme)));
    const velo = ech && ech.min > 0 ? ech.min * 60 : 0;
    return L.dureeModele(exos, { velo, approches: ech && ech.nbApproches > 0 ? ech.nbApproches : 0 }) + (seance.cardioMin > 0 ? Math.round(seance.cardioMin) : 0);
  },
  // Son rythme = la durée réelle / la durée du modèle, sur ses 5 dernières séances chronométrées. La médiane, bornée
  // entre 0,8 et 2,5, à 2 décimales ; 1 par défaut (aucune mesure). Le 13/11 : 80 min pour 48 prévues.
  // 2.35.0 : la borne haute passe de 1,5 à 2,5. À 1,5, l'appli annonçait moins que la vraie durée (deux séances
  // mesurées à 1,67 et 1,86 fois le modèle) : la durée dite doit être celle qu'il met vraiment.
  // Une seule mesure suffit (bornée comme les autres) ; la suivante corrige : la médiane de deux, c'est leur moyenne.
  rythme(seances, programme) {
    const mesures = [];
    for (let k = (seances || []).length - 1; k >= 0 && mesures.length < 5; k--) {
      const s = seances[k];
      if (!s || !(s.dureeMin > 0) || !Array.isArray(s.exos) || !s.exos.length) continue;
      const d = L.dureeNote(s, programme);
      if (d > 0) mesures.push(s.dureeMin / d);
    }
    if (!mesures.length) return 1;
    return L.arrondi2(Math.min(2.5, Math.max(0.8, L.mediane(mesures))));
  },
  // Le cardio de fin, en minutes : 5 min de vélo tranquille par défaut ; 10 ou 15 s'il reste au moins autant de temps ;
  // rien les jours à 45 min ou moins s'il reste moins de 5 min.
  cardioFin(temps, prevue) {
    const reste = temps - prevue;
    if (reste >= 15) return 15;
    if (reste >= 10) return 10;
    if (temps <= 45 && reste < 5) return 0;
    return 5;
  },
  // Le cardio de fin, décidé quand toutes les séries sont faites, d'après le temps vraiment passé depuis le
  // début (sc.debut) et son temps du jour (sc.tempsJour ; une séance en cours de la 1.x : le temps de son bilan ; sinon les réglages) : le plugin connaît l'heure, il
  // n'a pas à garder l'estimation du départ (« 5 min par défaut ; plus seulement s'il reste du temps »). Séance reprise un
  // autre jour, ou début inconnu : le cardio prévu au départ (5 min s'il manque).
  cardioAuBout(sc, duree, maintenant, aujourdhui) {
    const prevu = sc && sc.cardio != null ? sc.cardio : 5;
    if (!sc || !(sc.debut > 0) || !(maintenant >= sc.debut) || (aujourdhui && sc.date !== aujourdhui)) return prevu;
    const temps = sc.tempsJour > 0 ? sc.tempsJour : sc.bilan && sc.bilan.temps > 0 ? sc.bilan.temps : duree > 0 ? duree : 60;
    return L.cardioFin(temps, Math.round(L.minutesDepuis(sc.debut, maintenant)));
  },
  // La séance du jour prête à faire, le seul point d'entrée des écrans (accueil, « Ta séance d'aujourd'hui », Commencer).
  // ctx = { seances, programme, reglages, temps (par défaut la durée des réglages ; L.niveau y met celui d'une ancienne séance),
  //         cardio (étages du cardio), peuDeTemps (2.38.91 : « Peu de temps » au bilan, le texte des superséries le dit) }.
  // (1) l'ordre par étage ; (2) des superséries si le temps est de 45 min ou moins ; (3) le nombre de séries d'approche ;
  // (4) la durée du modèle, calée sur son rythme ; (5) le cardio de fin ; (6) le texte « environ 1 h 10 à ton rythme ».
  // Rend une copie de sj avec exos, etageEchauffement, superseries, approches, duree ; sj n'est pas modifié. On ne coupe
  // jamais de séries pour tenir : si ça dépasse, duree.depasse le dit (l'écran le dit en une ligne).
  preparerSeance(sj, ctx) {
    if (!sj) return sj;
    const c = ctx || {};
    const reg = Object.assign({}, REGLAGES_DEFAUT, c.reglages || {});
    const temps = c.temps > 0 ? c.temps : reg.duree;
    // L'étage de chaque exercice : celui de sa ligne du programme, sinon celui de son lieu dans les réglages (L.situer).
    // L'échauffement se fait là où est le cardio : l'étage des machines (réglages), sinon le plus bas de la séance.
    const o = L.ordonnerParEtage(L.situer(sj.exos, reg.etages), c.cardio || (reg.etages ? [reg.etages.machines] : null));
    const superseries = temps <= 45;
    // Un exercice jamais fait, alors qu'il y a déjà des séances notées : 2 séries la première fois (« La bonne
    // séance », Courbatures : « Exercice nouveau : la première fois en 2 séries, sans aller au bout »). Sans aucune séance
    // notée, c'est la mise en route qui s'en charge (L.adapter).
    const ss = Array.isArray(c.seances) ? c.seances : [];
    const nouveaux = [];
    const base = ss.length ? o.exos.map((x) => {
      if (!x || x.echauffement || !(x.series > 2) || L.derniere(ss, x.nom)) return x;
      nouveaux.push(x);
      return Object.assign({}, x, { series: 2 });
    }) : o.exos;
    const exos = superseries ? L.grouperSuperseries(base) : base.map((x) => Object.assign({}, x));
    // La charge de départ de chaque exercice (pour sa première fois) : sa charge sur le même appareil avec une autre prise,
    // sinon une part du poids des réglages (L.chargeDepart).
    exos.forEach((x) => { const d = x ? L.chargeDepart(x, reg.poids, ss) : null; if (d) x.depart = d; });
    // 2.34.0 : son réglage de la machine, noté dans l'aide (réglages), se redit partout. 2.36.3 : il ne remplace plus celui
    // du programme (l'angle du banc reste dit) : les deux se lisent ensemble (L.reglages).
    exos.forEach((x) => { const r = x && reg.machines ? reg.machines[L.norm(x.nom)] : null; if (r) x.monReglage = r; });
    const approches = L.planApproches(exos, superseries).reduce((t, p) => t + (p ? p.length : 0), 0);
    const modele = L.dureeModele(exos, { approches, etageEchauffement: o.etageEchauffement });
    const rythme = L.rythme(c.seances || [], c.programme || []);
    const prevue = Math.round(modele * rythme);
    const cardio = L.cardioFin(temps, prevue);
    const totale = prevue + cardio;
    const texte = 'environ ' + L.fmtTemps(Math.max(5, Math.round(totale / 5) * 5)) + (rythme !== 1 ? ' à ton rythme' : '');
    const lignes = (sj.lignes || []).slice();
    if (nouveaux.length) lignes.push(L.avecNoms(nouveaux, (n) => `${n} : première fois, 2 séries sans aller au bout.`));
    if (superseries && exos.some((x) => x.groupe)) lignes.push(`${c.peuDeTemps ? 'Peu de temps' : '45 min'} : des superséries, toutes les séries gardées.\nComment : 2 exercices enchaînés, 1 min 30 de repos après le tour.`);
    return Object.assign({}, sj, {
      exos, etageEchauffement: o.etageEchauffement, superseries, approches, lignes,
      duree: { modele, rythme, prevue, cardio, totale, temps, depasse: Math.max(0, totale - temps), texte },
    });
  },
});
