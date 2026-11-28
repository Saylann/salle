// L : les jours de salle et les progrès. Rien ici ne lit ni n'écrit de note : des entrées, une sortie.
// Le conseil du jour, les records par type (une montée de charge est un record), les courbes, le volume par muscle (séries
// indirectes à ½), la régularité qui pardonne, la semaine légère, « Bon retour », les 5 cases de la semaine, le bilan de fin
// comparé à la fois d'avant, « Tes progrès » sur l'accueil, « Pour te lancer » avant la séance (L.boostAvant).
// Sources : « La bonne séance » (parties 3 et 4), ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-interfaces.md.
{
  // ── Petits outils de ce fichier (dans ce bloc : ils ne gênent aucun autre fichier) ──
  const exosDe = (s) => (s && Array.isArray(s.exos) ? s.exos.filter((e) => e && !e.echauffement) : []);
  const lundiDe = (iso) => (L.deISO(iso) ? L.lundi(iso) : null);   // null si la date est illisible (rien ne plante)
  const auTemps = (x) => !!x && x.s != null;
  const chargeDe = (x) => (x && x.c > 0 ? x.c : 0);
  const egaux = (a, b) => Math.abs(a - b) < 1e-9;                  // deux charges (17,5 lu dans une note) égales
  const maxDe = (liste) => liste.reduce((m, v) => (v > m ? v : m), -Infinity);
  const demi = (x) => Math.round(x * 2) / 2;
  const sur = (f) => { try { return f(); } catch (e) { return null; } };   // une partie qui échoue rend null, rien d'autre
  const kg = (c) => (c > 0 ? L.fmt(c) : 'sans charge');
  // Les séances de la semaine de « aujourdhui », du lundi à aujourd'hui.
  const deLaSemaine = (seances, aujourdhui) => {
    const l = lundiDe(aujourdhui);
    return l ? (seances || []).filter((s) => s && lundiDe(s.date) === l && s.date <= aujourdhui) : [];
  };
  // Les séances jusqu'à aujourd'hui (s'il est une date), lisibles, triées.
  const seancesJusqua = (seances, auj) => L.trier((Array.isArray(seances) ? seances : [])
    .filter((s) => s && Array.isArray(s.exos) && L.deISO(s.date) && (!auj || s.date <= auj)));
  // L'index par exercice d'une liste de séances : nom normalisé → [{ s, series }], une entrée par séance où l'exercice a des
  // séries (toutes ses sections mises bout à bout), dans l'ordre des séances. Gardé le temps d'un dessin (L.memoListe) :
  // chaque exercice ne relit plus toutes les séances.
  const indexDe = (seances) => L.memoListe(seances, 'index', () => {
    const index = new Map();
    (seances || []).forEach((s) => {
      const ici = new Map();
      exosDe(s).forEach((e) => {
        if (!Array.isArray(e.series)) return;
        const n = L.norm(e.nom);
        e.series.forEach((x) => {
          if (!x) return;
          if (!ici.has(n)) ici.set(n, []);
          ici.get(n).push(x);
        });
      });
      ici.forEach((series, n) => {
        if (!index.has(n)) index.set(n, []);
        index.get(n).push({ s, series });
      });
    });
    return index;
  });
  const entreesDe = (seances, nom) => indexDe(seances).get(L.norm(nom)) || [];
  // Toutes les séries notées d'un exercice (même nom, sans tenir compte des accents ni des majuscules), dans l'ordre.
  const seriesDe = (seances, nom) => {
    const out = [];
    entreesDe(seances, nom).forEach((x) => x.series.forEach((serie) => out.push(serie)));
    return out;
  };
  // b est-elle meilleure que a ? Plus lourde, puis plus de répétitions ; au temps, plus longue.
  const mieux = (b, a) => {
    if (auTemps(a) || auTemps(b)) return (b.s || 0) > (a.s || 0);
    if (!egaux(chargeDe(b), chargeDe(a))) return chargeDe(b) > chargeDe(a);
    return (b.r || 0) > (a.r || 0);
  };
  // x vaut-elle au moins autant que serie ? (charge ≥ et répétitions ≥, ou secondes ≥)
  const vautAutant = (x, serie) => (auTemps(serie)
    ? auTemps(x) && x.s >= serie.s
    : !auTemps(x) && chargeDe(x) >= chargeDe(serie) - 1e-9 && (x.r || 0) >= (serie.r || 0));
  // Le record d'une série face aux séries notées avant (h). Voir L.recordSerie.
  const recordContre = (h, serie, faitesAvant) => {
    if (!serie || !h.length) return null;                                        // jamais au premier essai
    if (auTemps(serie) ? !(serie.s > 0) : !(serie.r > 0)) return null;           // une série vide n'est pas un record
    if ((Array.isArray(faitesAvant) ? faitesAvant : []).some((x) => x && (x.record || vautAutant(x, serie)))) return null;   // déjà fêté aujourd'hui
    if (auTemps(serie)) {
      const hs = h.filter(auTemps);
      if (!hs.length) return null;
      const max = maxDe(hs.map((x) => x.s));
      if (!(serie.s > max)) return null;
      return { type: 'temps', avant: { s: max }, apres: { s: serie.s }, texte: `Record : ${serie.s} s, avant ${max} s` };
    }
    const hr = h.filter((x) => !auTemps(x));
    if (!hr.length) return null;
    const c = chargeDe(serie), r = serie.r;
    const maxC = maxDe(hr.map(chargeDe));
    if (c > maxC + 1e-9) return { type: 'charge', avant: { c: maxC }, apres: { c, r }, texte: `Nouvelle charge : ${L.fmt(c)} kg, avant ${kg(maxC)}` };
    const ici = hr.filter((x) => egaux(chargeDe(x), c));                          // déjà faites à cette charge
    if (!ici.length) return null;
    const maxR = maxDe(ici.map((x) => x.r || 0));
    if (!(r > maxR)) return null;
    return { type: 'reps', avant: { c, r: maxR }, apres: { c, r },
      texte: `Record : ${L.pluriel(r, 'répétition')}${c > 0 ? ` à ${L.fmt(c)} kg` : ''}, avant ${maxR}` };
  };
  // Le record d'un exercice sur une séance : celui de la meilleure série, sinon le premier qu'une série a battu en direct
  // (même règle que pendant la séance : une série plus lourde faite avant l'empêche). Le bilan, la courbe et la ligne dorée
  // de la séance disent ainsi la même chose.
  const recordDuJour = (h, series) => {
    const liste = (series || []).filter(Boolean);
    const r = recordContre(h, L.meilleureSerie(liste), []);
    if (r) return r;
    for (let k = 0; k < liste.length; k++) {
      const x = recordContre(h, liste[k], liste.slice(0, k));
      if (x) return x;
    }
    return null;
  };
  // La hausse d'un exercice de sa première à sa dernière séance (la meilleure série de chacune, comme L.pointsCourbe) :
  // { texte, gain, depuis } ou null (moins de 2 séances, unités différentes, pas de hausse : jamais de baisse).
  // « 35 → 42,5 kg » ; à charge égale, les répétitions « 4 kg × 15 → 4 kg × 20 » ; au temps « 30 s → 45 s » ; au poids du
  // corps « 12 → 15 rép. ». gain sert seulement à trier (L.valeur, comme le reste du plugin) ; depuis = la première date.
  // Partagé par « Tes progrès » (L.progresAccueil) et la carte d'avant la séance (L.boostAvant).
  const hausse = (liste, nom) => {
    const pts = L.pointsCourbe(liste, nom);
    if (pts.length < 2) return null;
    const a = pts[0], z = pts[pts.length - 1];
    if (a.unite !== z.unite) return null;
    let texte = null;
    if (z.unite === 's') texte = z.y > a.y ? `${a.y} s → ${z.y} s` : null;
    else if (z.unite === 'rép.') texte = z.y > a.y ? `${a.y} → ${z.y} rép.` : null;
    else if (z.y > a.y + 1e-9) texte = `${L.fmt(a.y)} → ${L.fmt(z.y)} kg`;
    else if (egaux(z.y, a.y) && (z.serie.r || 0) > (a.serie.r || 0)) texte = `${L.fmt(a.y)} kg × ${a.serie.r} → ${L.fmt(z.y)} kg × ${z.serie.r}`;
    return texte ? { texte, gain: L.valeur(z.serie) / Math.max(1e-9, L.valeur(a.serie)) - 1, depuis: a.date } : null;
  };
  // La semaine légère : les lundis du réglage, sinon ceux d'origine (REGLAGES_DEFAUT, la semaine de ses finaux).
  const lundisLegers = (reglages) => {
    const r = reglages && Array.isArray(reglages.semainesLegeres) ? reglages.semainesLegeres
      : (Array.isArray(REGLAGES_DEFAUT.semainesLegeres) ? REGLAGES_DEFAUT.semainesLegeres : []);
    return r.map(lundiDe).filter(Boolean);
  };

  // ── Les morceaux de « Tes progrès » (L.progresAccueil) : chacun rend sa ligne, ou null ──
  // Les exercices de la carrure du programme (remplaçants compris) en hausse, les plus fortes d'abord, puis l'ordre du programme.
  const hausseCarrure = (liste, programme) => {
    const vus = new Set(), noms = [];
    const ajouter = (n) => {
      const k = L.norm(n);
      if (k && !vus.has(k) && L.MUSCLES_CARRURE.indexOf(L.musclePrincipal(n)) >= 0) { vus.add(k); noms.push(n); }
    };
    (Array.isArray(programme) ? programme : []).forEach((sea) => (sea && Array.isArray(sea.exos) ? sea.exos : []).forEach((x) => {
      if (!x) return;
      ajouter(x.nom);
      (Array.isArray(x.alternatives) ? x.alternatives : []).forEach((a) => a && ajouter(a.nom));
    }));
    const out = [];
    noms.forEach((nom, rang) => {
      const x = hausse(liste, nom);
      if (x) out.push({ nom, texte: x.texte, gain: x.gain, rang });
    });
    return out.sort((x, y) => y.gain - x.gain || x.rang - y.rang);
  };
  // Les records de la dernière séance : « Vendredi : 2 records ».
  const ligneRecords = (liste, auj) => {
    const der = liste[liste.length - 1];
    const n = der ? L.recordsDetail(der, liste.slice(0, -1)).length : 0;
    return n ? { texte: `${auj ? L.quand(der.date, auj, true) : 'Dernière séance'} : ${L.pluriel(n, 'record')}`, type: 'records' } : null;
  };
  // Le tour d'épaules, s'il a grandi entre la première et la dernière mesure, à au moins L.JOURS_COMPARER jours d'écart.
  const ligneEpaules = (mesures, auj) => {
    const pts = (Array.isArray(mesures) ? mesures : []).filter((m) => m && m.epaules > 0 && L.deISO(m.date) && (!auj || m.date <= auj))
      .slice().sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
    if (pts.length < 2 || L.joursEntre(pts[0].date, pts[pts.length - 1].date) < L.JOURS_COMPARER) return null;
    const a = pts[0].epaules, z = pts[pts.length - 1].epaules;
    return z > a + 1e-9 ? { texte: `Épaules : ${L.fmt(a)} → ${L.fmt(z)} cm`, type: 'mesure' } : null;
  };
  // La série de semaines (L.regularite), à partir de 2.
  const ligneRegularite = (liste, auj, reg) => {
    if (!auj) return null;
    const obj = L.objectifSemaine(reg);
    const r = L.regularite(liste, auj, obj, reg.pauses);
    if (!(r.serie >= 2)) return null;
    // Les semaines comptées (de l'actuelle vers le passé) : toutes à l'objectif, ou une rattrapée parmi elles ?
    let rattrapee = false;
    for (let k = r.semaines.length - 1; k >= 0; k--) {
      const e = r.semaines[k].etat;
      if (e === 'avant' || e === 'manque') break;
      if (e === 'rattrapee') rattrapee = true;
    }
    return { texte: rattrapee ? `${r.serie} semaines de suite` : `${r.serie} semaines de suite à ${L.pluriel(obj, 'séance')}`, type: 'regularite' };
  };

  // ── Les morceaux de « Pour te lancer » (L.boostAvant) ──
  // ctx = { sj, exos (sans l'échauffement), liste (les séances jusqu'à aujourd'hui), programme, auj, reg, nomsSeance }.
  // Le nom court en minuscules (« développé incliné ») ; un seul mot (« presse ») : le nom entier.
  const courtMinuscule = (n) => { const c = L.nomCourt(n); return /\s/.test(c) ? c : String(n).toLowerCase(); };
  // Les noms à afficher : un nom court partagé avec un autre exercice de autres (par défaut ceux de la séance) garde son nom
  // entier (comme « Tes progrès »).
  const nomsDe = (ctx, noms, autres) => noms.map((n) => {
    const c = courtMinuscule(n), k = L.norm(n);
    return (autres || ctx.nomsSeance).some((m) => L.norm(m) !== k && courtMinuscule(m) === c) ? String(n).toLowerCase() : c;
  });
  // 1. La plus forte hausse depuis le début, sur un exercice de la séance.
  const meilleureHausse = (ctx) => {
    let meilleur = null;
    ctx.exos.forEach((x) => sur(() => {
      const hs = hausse(ctx.liste, x.nom);
      if (hs && (!meilleur || hs.gain > meilleur.gain + 1e-9)) meilleur = Object.assign({ nom: x.nom }, hs);   // à égalité : l'ordre de la séance
    }));
    return meilleur && L.deISO(meilleur.depuis)
      ? { texte: `Depuis le ${L.dateCourte(meilleur.depuis)} : ${nomsDe(ctx, [meilleur.nom])[0]} ${meilleur.texte}`, type: 'progres' } : null;
  };
  // 2. La semaine, cette séance comprise.
  const ligneSemaine = (ctx) => {
    if (!ctx.auj) return null;
    const obj = L.objectifSemaine(ctx.reg);
    const l = L.lundi(ctx.auj);
    if ((Array.isArray(ctx.reg.pauses) ? ctx.reg.pauses : []).some((x) => L.deISO(x) && L.lundi(x) === l)) return null;
    const n = deLaSemaine(ctx.liste, ctx.auj).length + 1;
    if (n === obj) return { texte: `Cette séance complète ta semaine (${n} sur ${obj})`, type: 'semaine', complete: true };
    return n >= 2 && n < obj ? { texte: `${n}e séance de la semaine (${n} sur ${obj})`, type: 'semaine' } : null;
  };
  // 3. Les exercices jamais faits : leur point de départ. « Première fois » doit être vrai pour tout l'historique : un nom
  // court partagé avec un exercice du programme ou déjà noté (tirage vertical prise neutre, après la prise large) garde
  // son nom entier.
  const ligneDepart = (ctx) => {
    const { exos, liste, sj } = ctx;
    const nouveaux = exos.filter((x) => !L.derniere(liste, x.nom));
    if (!nouveaux.length) return null;
    // 2.5.1 : la consigne visible (2 séries), le « point de départ » replié ; la phrase trop longue dit le nombre d'exercices.
    const depart = 'ce que tu notes aujourd\'hui sera ton point de départ.';
    const fin = nouveaux.every((x) => !(x.series > 2)) ? ` : 2 séries, sans aller au bout.\nPourquoi : ${depart}` : ` : ${depart}`;
    const texte = (quoi) => `Première fois pour ${quoi}${fin}`;
    if (nouveaux.length === exos.length) return { texte: texte(sj.nom ? `« ${sj.nom} »` : 'cette séance'), type: 'depart' };
    const connus = ctx.nomsSeance.slice();
    (Array.isArray(ctx.programme) ? ctx.programme : []).forEach((s) => (s && Array.isArray(s.exos) ? s.exos : []).forEach((x) => {
      if (x && x.nom) connus.push(x.nom);
      (x && Array.isArray(x.alternatives) ? x.alternatives : []).forEach((a) => { if (a && a.nom) connus.push(a.nom); });
    }));
    liste.forEach((s) => exosDe(s).forEach((e) => { if (e.nom) connus.push(e.nom); }));
    const noms = nomsDe(ctx, nouveaux.map((x) => x.nom), connus);
    const enMots = noms.length > 1 ? `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}` : noms[0];
    if (noms.length <= 3 && texte(enMots).split('\n')[0].length <= L.LIGNE_MAX) return { texte: texte(enMots), type: 'depart' };
    const [tete, ...plis] = texte(`${noms.length} exercices`).split('\n');
    return { texte: [tete, `Lesquels : ${enMots}.`].concat(plis).join('\n'), type: 'depart' };
  };

  // Les séances par semaine et l'état de chaque semaine (L.regularite).
  // → { obj, actuel (le lundi d'aujourd'hui), debut (le lundi de la 1re séance), n(lundi), etat(lundi) } ; null sans date.
  // États : 'avant' (avant la 1re séance), 'ok' (objectif atteint), 'pause' (semaine sans salle), 'en cours' (l'actuelle),
  // 'rattrapee' (sous l'objectif, mais la suivante en a plus que l'objectif), 'en attente' (sous l'objectif, la suivante est
  // l'actuelle : elle peut encore rattraper), sinon 'manque'. Une semaine à l'objectif compte même si elle est en pause.
  const compterSemaines = (seances, aujourdhui, objectif, pauses) => {
    const obj = objectif > 0 ? Math.round(objectif) : 3;
    const actuel = lundiDe(aujourdhui);
    if (!actuel) return null;
    const parSemaine = {};
    let premier = null;
    (seances || []).forEach((s) => {
      const l = s && s.date <= aujourdhui ? lundiDe(s.date) : null;
      if (!l) return;
      parSemaine[l] = (parSemaine[l] || 0) + 1;
      if (!premier || l < premier) premier = l;
    });
    const enPause = {};
    (Array.isArray(pauses) ? pauses : []).map(lundiDe).forEach((l) => { if (l) enPause[l] = true; });
    const debut = premier || actuel;
    const n = (l) => parSemaine[l] || 0;
    const etat = (l) => {
      if (l < debut) return 'avant';
      if (n(l) >= obj) return 'ok';
      if (enPause[l]) return 'pause';
      if (l === actuel) return 'en cours';
      const suivante = L.plusJours(l, 7);
      if (n(suivante) > obj) return 'rattrapee';
      return suivante === actuel ? 'en attente' : 'manque';
    };
    return { obj, actuel, debut, n, etat };
  };

  Object.assign(L, {
    // ── Jours de salle et conseil du jour ──
    // Les jours de salle : ceux choisis dans les réglages, sinon un modèle selon le nombre de séances (0 = dimanche … 6 = samedi).
    // Pas de modèle à 4 (lundi-mardi, jeudi-vendredi) : 3 séances, au moins 48 h entre deux [26] ; 2 ou 3 séances
    // donnent le même résultat [47].
    joursConseilles(reglages) {
      const r = reglages || {};
      if (Array.isArray(r.jours) && r.jours.length) return r.jours.filter((j) => j >= 0 && j <= 6).sort();
      return ({ 2: [1, 4], 3: [1, 3, 5] })[r.parSemaine] || [1, 3, 5];
    },
    // Deux jours choisis se suivent-ils (samedi puis dimanche compris) ? Les réglages le disent en une ligne : A et B
    // travaillent les mêmes muscles. Rien d'autre ne change : 48 h entre deux séances dans tous les cas.
    joursSeSuivent(jours) {
      const js = Array.isArray(jours) ? jours.filter((j) => j >= 0 && j <= 6) : [];
      return js.some((j) => js.indexOf((j + 1) % 7) >= 0);
    },
    // Les n prochaines séances conseillées : les jours de salle, dans l'ordre du programme. Jamais le jour d'une séance déjà
    // faite, ni le lendemain : au moins 48 h entre deux séances, même si deux jours choisis se suivent (A et B travaillent le
    // dos, les épaules et les cuisses ; des séries dures ralentissent la récupération de 24 à 48 h [26, 54]).
    plan(programme, seances, aujourdhui, jours, n) {
      if (!programme.length || !jours.length) return [];
      const der = seances[seances.length - 1];
      let avant = der ? der.date : null;   // la dernière séance, faite puis prévue
      const out = [];
      let i = L.choisirSeance(programme, seances, aujourdhui).i;
      for (let k = 0; k < 60 && out.length < (n || 3); k++) {
        const date = L.plusJours(aujourdhui, k);
        if (jours.indexOf(L.deISO(date).getDay()) < 0) continue;
        if (avant && L.joursEntre(avant, date) < 2) continue;
        out.push({ date, i });
        avant = date;
        i = (i + 1) % programme.length;
      }
      return out;
    },
    // La semaine est-elle en retard ? Combien de séances il
    // manquerait dimanche soir s'il ne venait pas aujourd'hui : l'objectif, moins les séances déjà faites cette semaine (lundi
    // → aujourd'hui), moins les jours de salle qui restent après aujourd'hui (48 h entre deux séances [26]). 0 : pas en retard.
    // objectif absent ou 0 (semaine sans salle) : 0.
    retardSemaine(seances, aujourdhui, jours, objectif) {
      const obj = objectif > 0 ? Math.round(objectif) : 0;
      const l = lundiDe(aujourdhui);
      if (!obj || !l) return 0;
      const js = Array.isArray(jours) && jours.length ? jours.filter((j) => j >= 0 && j <= 6) : [0, 1, 2, 3, 4, 5, 6];
      const faites = deLaSemaine(seances, aujourdhui).length;
      let der = null;
      (seances || []).forEach((s) => { if (s && L.deISO(s.date) && s.date <= aujourdhui && (!der || s.date > der)) der = s.date; });
      let places = 0;
      for (let d = L.plusJours(aujourdhui, 1); d <= L.plusJours(l, 6); d = L.plusJours(d, 1)) {
        if (js.indexOf(L.deISO(d).getDay()) < 0 || (der && L.joursEntre(der, d) < 2)) continue;
        places++;
        der = d;
      }
      return Math.max(0, obj - faites - places);
    },
    // Le jour décidé, pas suggéré : { repos, texte }. Au moins 48 h entre deux séances, toujours [26, 54].
    // jours = les jours de salle (0 = dimanche) ; vide ou absent : tous les jours sont permis.
    // objectif (facultatif, les séances de la semaine) : un jour qui n'est pas un jour de salle n'est pas un repos si la
    // semaine est en retard (L.retardSemaine) : le repos proposé servait d'excuse. Sans objectif : seulement les jours de
    // salle et les 48 h. objectif 0 (semaine sans salle, malade compris) : repos, avant même « il y a 4 jours ou plus » (pas
    // de séance avec fièvre, frissons, courbatures partout, gêne pour respirer [126] ; une semaine sans salle ne fait rien
    // perdre [123, 124]).
    conseilDuJour(seances, aujourdhui, jours, objectif) {
      const pause = { repos: true, texte: 'Semaine sans salle : repos.' };
      const der = seances[seances.length - 1];
      if (!der) return objectif === 0 ? pause : { repos: false, texte: 'Aujourd\'hui : séance.' };
      const j = L.joursEntre(der.date, aujourdhui);
      const js = Array.isArray(jours) && jours.length ? jours : [0, 1, 2, 3, 4, 5, 6];
      const jourDeSalle = js.indexOf(L.deISO(aujourdhui).getDay()) >= 0;
      if (j <= 0) return { repos: true, texte: 'Aujourd\'hui : séance faite. Demain : repos.' };
      if (objectif === 0) return pause;
      if (j === 1) return { repos: true, texte: 'Aujourd\'hui : repos (séance hier). Le muscle se construit pendant le repos.' };
      if (j >= 4) return { repos: false, texte: `Aujourd'hui : séance. Dernière séance il y a ${j} jours : même courte, elle compte.` };
      if (jourDeSalle) return { repos: false, texte: 'Aujourd\'hui : séance.' };
      if (objectif > 0 && L.retardSemaine(seances, aujourdhui, jours, objectif) > 0) {
        const manque = Math.round(objectif) - deLaSemaine(seances, aujourdhui).length;
        return { repos: false, retard: true, texte: `Aujourd'hui : séance. Il t'en manque ${manque} pour faire tes ${Math.round(objectif)} de la semaine.` };
      }
      let k = 1;
      while (k < 7 && js.indexOf(L.deISO(L.plusJours(aujourdhui, k)).getDay()) < 0) k++;
      return { repos: true, texte: `Aujourd'hui : repos (pas un de tes jours de salle). Prochaine : ${k === 1 ? 'demain' : JOURS[L.deISO(L.plusJours(aujourdhui, k)).getDay()]}.` };
    },
    // Le nombre de séances de la semaine (lundi → dimanche).
    cetteSemaine(seances, aujourdhui) {
      const l = L.lundi(aujourdhui);
      return seances.filter((s) => L.lundi(s.date) === l).length;
    },

    // ── Records par type et courbes ──
    // Ce que vaut une série, pour trier : charge maximale estimée (formule d'Epley), sinon répétitions ou secondes.
    // Jamais affichée comme « ton max ».
    valeur(x) {
      if (x.s != null) return x.s;
      return x.c ? x.c * (1 + (x.r || 0) / 30) : (x.r || 0);
    },
    // La meilleure série : la plus lourde (à égalité, le plus de répétitions) ; au temps, la plus longue. [] → null.
    meilleureSerie(series) {
      const liste = (Array.isArray(series) ? series : []).filter(Boolean);
      return liste.length ? liste.reduce((a, b) => (mieux(b, a) ? b : a)) : null;
    },
    // La série bat-elle ce qui est noté pour cet exercice ? null, ou { type, avant, apres, texte } :
    // 'temps' (plus long), 'charge' (plus lourd que jamais : une montée de charge est un record), 'reps' (plus de répétitions
    // à une charge déjà faite). Jamais au premier essai. faitesAvant = les séries du jour déjà faites sur cet exercice :
    // si l'une est déjà un record, ou vaut au moins autant, rien (un record par exercice et par séance).
    // Le 1RM estimé (Epley, L.valeur) n'est jamais affiché comme un « max ».
    recordSerie(seances, nom, serie, faitesAvant) {
      return recordContre(seriesDe(seances, nom), serie, faitesAvant);
    },
    // Les records d'une séance face aux séances d'avant : au plus un par exercice. [{ nom, type, avant, apres, texte }]
    recordsDetail(seance, avant) {
      const out = [], vus = {};
      exosDe(seance).forEach((e) => {
        const k = L.norm(e.nom);
        if (vus[k] || !Array.isArray(e.series) || !e.series.length) return;
        const r = recordDuJour(seriesDe(avant, e.nom), e.series);
        if (r) { vus[k] = true; out.push(Object.assign({ nom: e.nom }, r)); }
      });
      return out;
    },
    // Les records des exercices d'une séance face à des séries d'avant déjà mises à plat (h) : comme L.recordsDetail quand
    // tous ces exercices ont le même nom, sans relire l'histoire à chaque séance (L.niveau tient h à jour).
    recordsFaceA(seance, h) {
      const out = [], vus = {};
      exosDe(seance).forEach((e) => {
        const k = L.norm(e.nom);
        if (vus[k] || !Array.isArray(e.series) || !e.series.length) return;
        const r = recordDuJour(h, e.series);
        if (r) { vus[k] = true; out.push(Object.assign({ nom: e.nom }, r)); }
      });
      return out;
    },
    // Les noms des exercices qui ont un record.
    records(seance, avant) {
      return L.recordsDetail(seance, avant).map((x) => x.nom);
    },
    // Les records d'un exercice, par type : la série la plus lourde (à égalité, le plus de répétitions, puis la plus récente),
    // celle au plus de répétitions (à égalité, la plus lourde, puis la plus récente), le plus long temps.
    recordsExo(seances, nom) {
      let charge = null, reps = null, temps = null;
      entreesDe(seances, nom).forEach(({ s, series }) => {
        series.forEach((x) => {
          const date = s.date;
          if (auTemps(x)) {
            if (x.s > 0 && (!temps || x.s > temps.s || (x.s === temps.s && date >= temps.date))) temps = { s: x.s, date };
            return;
          }
          const c = chargeDe(x), r = x.r || 0;
          if (!(r > 0)) return;
          if (c > 0 && (!charge || c > charge.c + 1e-9 || (egaux(c, charge.c) && (r > charge.r || (r === charge.r && date >= charge.date))))) charge = { c, r, date };
          if (!reps || r > reps.r || (r === reps.r && (c > reps.c + 1e-9 || (egaux(c, reps.c) && date >= reps.date)))) reps = { c, r, date };
        });
      });
      return { charge, reps, temps };
    },
    // La courbe d'un exercice : un point par séance, la charge de la meilleure série (pas Epley : la courbe ne baisse pas
    // le jour d'une montée de charge), sinon les répétitions, sinon les secondes. record = ce jour-là a battu l'avant.
    pointsCourbe(seances, nom) {
      const h = [], out = [];
      entreesDe(seances, nom).forEach(({ s, series }) => {
        const m = L.meilleureSerie(series);
        const unite = auTemps(m) ? 's' : chargeDe(m) > 0 ? 'kg' : 'rép.';
        const y = unite === 's' ? m.s : unite === 'kg' ? m.c : (m.r || 0);
        out.push({ date: s.date, y, unite, serie: m, record: !!recordDuJour(h, series) });
        series.forEach((x) => h.push(x));   // l'historique grandit au fil des séances (un seul passage)
      });
      return out;
    },

    // ── Muscles et volume ──
    // « La bonne séance », partie 3, Volume : 1 série pour le muscle qui fait le gros du travail, ½ pour ceux qui aident.
    // Le premier motif qui correspond au nom (sans accents) gagne : l'ordre compte (« leg curl » avant « curl »).
    MUSCLES: [
      [/incline/, { pecs: 1, haut_pecs: 1, triceps: 0.5 }],                      // développé incliné : le haut des pecs
      [/developpe (epaules|militaire)/, { epaules: 0.5, triceps: 0.5 }],
      [/developpe|chest press|pompe|dips|ecarte|butterfly|pec deck/, { pecs: 1, triceps: 0.5 }],
      [/elevation/, { epaules: 1 }],
      [/face pull|oiseau|arriere d/, { arriere_epaules: 1, dos: 0.5 }],
      [/leg curl|ischio/, { ischios: 1 }],
      [/hip thrust|pont fessier|releve de bassin/, { fessiers: 1, ischios: 0.5 }],          // 2.32.0 : les fessiers, comptés
      [/leg extension/, { quadriceps: 1 }],
      // 2.36.0 : la presse fait grossir le grand fessier (+15,4 % en 12 semaines à l'IRM, Kinoshita 2026), le squat autant
      // que le hip thrust (Plotkin 2023) : les fessiers comptés en plein. Pas l'arrière des cuisses (0 dans ces études).
      [/presse|squat|hack|fente/, { quadriceps: 1, fessiers: 1 }],
      // Les avant-bras : tenir la barre d'un tirage ou d'un curl les fait travailler (avis) ; le curl à la barre en Z les
      // active plus que le curl aux haltères (activité mesurée sur 12 personnes, Marcolin 2018 : preuve faible).
      [/tirage|traction|rowing|pull ?down/, { dos: 1, biceps: 0.5, avant_bras: 0.5 }],
      [/\bcurl\b/, { biceps: 1, avant_bras: 0.5 }],
      [/triceps|barre au front/, { triceps: 1 }],
      [/gainage|planche|crunch|abdo|releve de/, { abdos: 1 }],
    ],
    NOMS_MUSCLES: { dos: 'Dos', epaules: 'Côté des épaules', arriere_epaules: 'Arrière des épaules', pecs: 'Pecs', quadriceps: 'Quadriceps', ischios: 'Arrière des cuisses', fessiers: 'Fessiers', biceps: 'Biceps', avant_bras: 'Avant-bras', triceps: 'Triceps', abdos: 'Abdos' },
    // Les repères de la semaine : 10 à 15 séries pour le dos, le côté des épaules et les pecs ; au plus 20 ; au plus 8 séries
    // directes pour un même muscle dans une séance.
    // (Les nombres et les muscles viennent de l'objectif : objectifs/<objectif>/objectif.json.)
    REPERES_VOLUME: { zone: OBJECTIF.seriesParSemaine.zone, max: OBJECTIF.seriesParSemaine.max, parSeance: OBJECTIF.seriesParSemaine.parSeance, avecZone: OBJECTIF.musclesPrioritaires },
    // Les muscles d'un exercice : { muscle: 1 (direct) ou 0.5 (indirect) }. Exercice inconnu : d'après sa famille.
    musclesExo(nom) {
      const n = L.norm(nom);
      const trouve = L.MUSCLES.find(([motif]) => motif.test(n));
      if (trouve) return Object.assign({}, trouve[1]);
      return Object.assign({}, ({ tirer: { dos: 1, biceps: 0.5 }, pousser: { pecs: 1, triceps: 0.5 }, jambes: { quadriceps: 1 }, gainage: { abdos: 1 } })[L.famille(nom)] || {});
    },
    // 2.41.16 : « Comment faire » par muscle. → [{ cle, nom, directs: [titres], appui: [titres] }], dans l'ordre du corps
    // (ORDRE_GUIDE), sans muscle vide ; dans chaque muscle, les exercices de son programme d'abord (auProgramme : noms
    // normalisés), puis l'ordre du guide. Un exercice sans muscle connu va dans « Autres ».
    ORDRE_GUIDE: ['pecs', 'dos', 'epaules', 'arriere_epaules', 'biceps', 'triceps', 'avant_bras', 'quadriceps', 'ischios', 'fessiers', 'abdos'],
    guideParMuscle(titres, auProgramme) {
      const prog = auProgramme instanceof Set ? auProgramme : new Set();
      const liste = (Array.isArray(titres) ? titres : []).filter(Boolean);
      const trier = (a) => a.slice().sort((x, y) => (prog.has(L.norm(y)) ? 1 : 0) - (prog.has(L.norm(x)) ? 1 : 0) || liste.indexOf(x) - liste.indexOf(y));
      const out = L.ORDRE_GUIDE.map((cle) => {
        // Un exercice sans muscle travaillé en direct (le développé épaules : ½ épaules, ½ triceps) va sous son muscle principal.
        const directs = liste.filter((t) => L.musclesExo(t)[cle] === 1 || (!Object.values(L.musclesExo(t)).some((v) => v === 1) && L.musclePrincipal(t) === cle));
        const appui = liste.filter((t) => L.musclesExo(t)[cle] > 0 && L.musclesExo(t)[cle] < 1);
        return { cle, nom: L.NOMS_MUSCLES[cle] || cle, directs: trier(directs), appui: trier(appui) };
      }).filter((gr) => gr.directs.length);
      const autres = liste.filter((t) => !out.some((gr) => gr.directs.indexOf(t) >= 0));
      if (autres.length) out.push({ cle: 'autres', nom: 'Autres', directs: trier(autres), appui: [] });
      return out;
    },
    // Le muscle qui travaille le plus (le haut des pecs compte dans les pecs), ou null.
    musclePrincipal(nom) {
      const m = L.musclesExo(nom);
      let best = null;
      Object.keys(m).forEach((k) => { if (k !== 'haut_pecs' && (best == null || m[k] > m[best])) best = k; });
      return best;
    },
    // Les séries par muscle, indirectes à ½. Séance notée (series = liste) ou séance du programme (series = nombre).
    // haut_pecs est compté DANS pecs (un développé incliné ajoute aux deux).
    volume(seances) {
      const v = { dos: 0, epaules: 0, arriere_epaules: 0, pecs: 0, haut_pecs: 0, quadriceps: 0, ischios: 0, fessiers: 0, biceps: 0, avant_bras: 0, triceps: 0, abdos: 0 };
      (seances || []).forEach((s) => exosDe(s).forEach((e) => {
        const n = L.nbSeries(e);
        if (!n) return;
        const m = L.musclesExo(e.nom);
        Object.keys(m).forEach((k) => { if (k in v) v[k] += n * m[k]; });
      }));
      return v;
    },
    // La semaine (lundi → aujourd'hui), un muscle par ligne : séries arrondies à ½, la zone 10-15 (les muscles prioritaires de l'objectif),
    // l'état ('sous' < 10, 'dans', 'plus' 15 à 20, 'trop' > 20) et le plus de séries directes dans une même séance.
    volumeSemaine(seances, aujourdhui) {
      const sem = deLaSemaine(seances, aujourdhui);
      const v = L.volume(sem);
      const R = L.REPERES_VOLUME;
      return Object.keys(L.NOMS_MUSCLES).map((cle) => {
        const series = demi(v[cle]);
        const o = { cle, nom: L.NOMS_MUSCLES[cle], series };
        if (cle === 'pecs') o.dont = demi(v.haut_pecs);
        o.zone = R.avecZone.indexOf(cle) >= 0 ? R.zone.slice() : null;
        o.etat = series > R.max ? 'trop' : series < R.zone[0] ? 'sous' : !o.zone || series <= o.zone[1] ? 'dans' : 'plus';
        // Le plus de séries directes de ce muscle dans une même séance (au-delà de 8, l'écran le dit en petit).
        o.maxSeance = 0;
        sem.forEach((s) => {
          const directes = exosDe(s).reduce((t, e) => t + (L.musclesExo(e.nom)[cle] === 1 ? L.nbSeries(e) : 0), 0);
          if (directes > o.maxSeance) o.maxSeance = directes;
        });
        return o;
      });
    },

    // ── Le mètre ruban ──
    // Recherche « Le physique qui plaît » (~/Desktop/CLAUDE/Salle-travail/recherche/La bonne séance.md) : ce qui plaît le plus, c'est une taille fine par
    // rapport aux épaules et à la poitrine [161, 164, 165] ; la balance ne dit pas si tu prends du gras ou du muscle. D'où :
    // le 1er dimanche du mois, tour de taille au nombril et tour d'épaules au plus large (changement 2 de la recherche, avis).
    // Le rappel de l'accueil : vrai seulement le 1er dimanche du mois, s'il n'a pas encore mesuré sa taille ce mois-ci.
    rappelRuban(mesures, aujourdhui) {
      const d = L.deISO(aujourdhui);
      if (!d || d.getDay() !== 0 || d.getDate() > 7) return false;
      const mois = aujourdhui.slice(0, 7);
      return !(Array.isArray(mesures) ? mesures : []).some((m) => m && m.taille > 0 && typeof m.date === 'string' && m.date.slice(0, 7) === mois && m.date <= aujourdhui);
    },
    // L'avis de la taille : la taille monte 2 mois de suite (3 mois qui se suivent, chacun plus haut d'au moins
    // L.RUBAN.hausse cm) et les épaules ne bougent pas (moins de L.RUBAN.epaules cm de plus sur ces 2 mois) → tu prends
    // surtout du gras : enlève la collation [30] (« Manger simple »). La dernière mesure de chaque mois compte ; le dernier
    // mois doit être celui-ci ou le précédent (un vieil avis ne revient pas). Les seuils sont un avis : le mètre ruban se
    // trompe d'environ 1 cm d'une fois à l'autre. → null, ou { texte }.
    RUBAN: { hausse: 0.5, epaules: 1 },
    // Le rapport épaules ÷ taille (2.31.0, demande : les mesures servent à atteindre l'objectif) : le repère de la forme en V.
    // En vraies rencontres, c'est ce rapport qui compte, plus que les épaules seules ; la taille seule ne joue pas [161].
    // Pas de valeur à atteindre : aucune étude solide n'en donne une. La dernière mesure qui a les deux tours, et la
    // première pour dire le chemin fait. → null, ou { valeur (au centième), date, debut: { valeur, date } | null }
    rapportV(mesures) {
      const avec = (Array.isArray(mesures) ? mesures : []).filter((m) => m && m.epaules > 0 && m.taille > 0 && L.deISO(m.date))
        .slice().sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
      if (!avec.length) return null;
      const v = (m) => Math.round((m.epaules / m.taille) * 100) / 100;
      const der = avec[avec.length - 1], pre = avec[0];
      return { valeur: v(der), date: der.date, debut: avec.length > 1 ? { valeur: v(pre), date: pre.date } : null };
    },
    avisTaille(mesures, aujourdhui) {
      if (!L.deISO(aujourdhui)) return null;
      const parMois = {};
      (Array.isArray(mesures) ? mesures : []).filter((m) => m && L.deISO(m.date) && m.date <= aujourdhui)
        .slice().sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0))
        .forEach((m) => {
          const k = m.date.slice(0, 7), o = parMois[k] || (parMois[k] = {});
          if (m.taille > 0) o.taille = m.taille;
          if (m.epaules > 0) o.epaules = m.epaules;
        });
      const mois = Object.keys(parMois).filter((k) => parMois[k].taille != null).sort().slice(-3);
      if (mois.length < 3) return null;
      const suivant = (k) => { const a = +k.slice(0, 4), b = +k.slice(5, 7); return b === 12 ? `${a + 1}-01` : `${a}-${String(b + 1).padStart(2, '0')}`; };
      if (suivant(mois[0]) !== mois[1] || suivant(mois[1]) !== mois[2]) return null;
      const ici = aujourdhui.slice(0, 7);
      if (mois[2] !== ici && suivant(mois[2]) !== ici) return null;
      const t = mois.map((k) => parMois[k].taille);
      if (!(t[1] - t[0] >= L.RUBAN.hausse - 1e-9 && t[2] - t[1] >= L.RUBAN.hausse - 1e-9)) return null;
      const e0 = parMois[mois[0]].epaules, e2 = parMois[mois[2]].epaules;
      if (e0 == null || e2 == null || e2 - e0 >= L.RUBAN.epaules - 1e-9) return null;
      return { texte: `Avis : ta taille monte, tes épaules non : enlève la collation.\nPourquoi : taille ${L.fmt(t[0])} → ${L.fmt(t[2])} cm en 2 mois, épaules qui ne bougent pas : tu prends sans doute surtout du gras.` };
    },

    // ── La balance ──
    // « La bonne séance », Calories et poids : pour un débutant mince, un léger surplus ; cible +0,25 à 0,5 % du poids par
    // semaine (avis d'experts) [30], soit +0,18 à 0,35 kg pour 70 kg. Une pesée par semaine, le dimanche matin à jeun
    // (le même jour que le mètre ruban) ; plusieurs dans une semaine : leur moyenne. La tendance : la pente (moindres carrés)
    // des moyennes des POIDS_SEMAINES dernières semaines (l'actuelle comprise), à la date moyenne de chaque semaine ; il en
    // faut 3 sur au moins POIDS_ECART_MIN jours : une pesée seule varie d'environ 1 kg d'un jour à l'autre (avis).
    // Le conseil (avis) : sous la cible, ajoute une collation ; au-dessus, enlève-la si ta taille monte vite.
    POIDS_JOUR: 0,                       // dimanche
    POIDS_SEMAINES: 4,
    POIDS_ECART_MIN: 12,
    POIDS_CIBLE_PCT: OBJECTIF.priseDePoidsParSemaine,   // en % du poids, par semaine (objectif.json)
    // La cible en kg par semaine pour un poids : { min, max } au centième (70 kg → 0,18 et 0,35).
    cibleParSemaine(poids) {
      if (!(poids > 0)) return null;
      return { min: Math.round(poids * L.POIDS_CIBLE_PCT.min) / 100, max: Math.round(poids * L.POIDS_CIBLE_PCT.max) / 100 };
    },
    // → null (pas assez de pesées), ou { pente (kg par semaine, au centième), semaines, cible, etat: 'sous'|'dans'|'au-dessus',
    // tendance, conseil, ligne } : tendance et conseil pour Mesures, ligne (une seule) pour l'accueil.
    suiviPoids(mesures, aujourdhui) {
      if (!L.deISO(aujourdhui)) return null;
      const debut = L.plusJours(L.lundi(aujourdhui), -7 * (L.POIDS_SEMAINES - 1));
      const parSemaine = {};
      (Array.isArray(mesures) ? mesures : []).forEach((m) => {
        if (!m || !(m.poids > 0) || !L.deISO(m.date) || m.date > aujourdhui || m.date < debut) return;
        const l = L.lundi(m.date), o = parSemaine[l] || (parSemaine[l] = { jours: 0, poids: 0, n: 0 });
        o.jours += L.joursEntre(debut, m.date); o.poids += m.poids; o.n++;
      });
      const pts = Object.keys(parSemaine).sort().map((l) => ({ x: parSemaine[l].jours / parSemaine[l].n, y: parSemaine[l].poids / parSemaine[l].n }));
      if (pts.length < 3 || pts[pts.length - 1].x - pts[0].x < L.POIDS_ECART_MIN) return null;
      const mx = pts.reduce((t, q) => t + q.x, 0) / pts.length, my = pts.reduce((t, q) => t + q.y, 0) / pts.length;
      const den = pts.reduce((t, q) => t + (q.x - mx) * (q.x - mx), 0);
      if (!(den > 0)) return null;
      const pente = Math.round((pts.reduce((t, q) => t + (q.x - mx) * (q.y - my), 0) / den) * 7 * 100) / 100;
      const cible = L.cibleParSemaine(pts[pts.length - 1].y);
      const etat = pente < cible.min - 1e-9 ? 'sous' : pente > cible.max + 1e-9 ? 'au-dessus' : 'dans';
      const signe = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${L.fmt(Math.abs(v))}`;
      const tendance = `${signe(pente)} kg par semaine (${L.pluriel(pts.length, 'semaine')}).`;
      const fourchette = `+${L.fmt(cible.min)} à ${L.fmt(cible.max)} kg`;
      const conseil = {
        sous: `Sous la cible (${fourchette}) : ajoute une collation (avis).\nComment : 25 cl de lait, 2 cuillères à soupe de beurre de cacahuète, 1 banane.`,
        dans: `Dans la cible (${fourchette}) : continue comme ça.`,
        'au-dessus': `Au-dessus de la cible (${fourchette}) : enlève la collation si ta taille monte vite (avis).\nPourquoi : trop vite, c'est surtout du gras ; le mètre ruban le dit.`,
      }[etat];
      const ligne = {
        sous: `**Poids** : ${signe(pente)} kg par semaine, sous la cible : ajoute une collation (avis).`,
        dans: `**Poids** : ${signe(pente)} kg par semaine, dans la cible.`,
        'au-dessus': `**Poids** : ${signe(pente)} kg par semaine : enlève la collation si ta taille monte vite (avis).`,
      }[etat];
      return { pente, semaines: pts.length, cible, etat, tendance, conseil, ligne };
    },
    // La ligne de l'accueil (ou null) : le jour où il s'est pesé, la tendance et le conseil (ou « dans 3 semaines » s'il
    // n'y a pas encore assez de pesées) ; le dimanche sans pesée cette semaine, le rappel. Le 1er dimanche du mois, la carte
    // du mètre ruban dit déjà de se peser : pas de rappel ici. → { texte, bouton } (bouton : ouvrir Mesures).
    lignePesee(mesures, aujourdhui) {
      const d = L.deISO(aujourdhui);
      if (!d) return null;
      const liste = Array.isArray(mesures) ? mesures : [];
      const pese = (m) => m && m.poids > 0 && typeof m.date === 'string';
      if (liste.some((m) => pese(m) && m.date === aujourdhui)) {
        const s = L.suiviPoids(liste, aujourdhui);
        return { texte: s ? s.ligne : '**Pesée notée** : ta tendance s\'affiche après 3 semaines de pesées.', bouton: false };
      }
      if (d.getDay() !== L.POIDS_JOUR || L.rappelRuban(liste, aujourdhui)) return null;
      const lundi = L.lundi(aujourdhui);
      if (liste.some((m) => pese(m) && m.date >= lundi && m.date <= aujourdhui)) return null;
      return { texte: '**Pesée** ce matin, à jeun, après les toilettes.', bouton: true };
    },

    // ── Régularité qui pardonne ──
    // Les 12 dernières semaines (de la plus ancienne à l'actuelle) : { lundi, faites, objectif, etat } (les états :
    // compterSemaines, en tête de fichier).
    // serie : de l'actuelle vers le passé, +1 par 'ok' ou 'rattrapee' ; pause, en cours, en attente ne cassent rien ; on
    // s'arrête au premier 'manque'. Jamais « série cassée » : « Nouvelle série : semaine 1 ».
    regularite(seances, aujourdhui, objectif, pauses) {
      const c = compterSemaines(seances, aujourdhui, objectif, pauses);
      if (!c) return { semaines: [], serie: 0, texte: 'Nouvelle série : semaine 1' };
      const semaines = [];
      for (let k = 11; k >= 0; k--) {
        const l = L.plusJours(c.actuel, -7 * k);
        semaines.push({ lundi: l, faites: c.n(l), objectif: c.obj, etat: c.etat(l) });
      }
      let serie = 0;
      for (let l = c.actuel, k = 0; k < 1000; k++, l = L.plusJours(l, -7)) {   // la série peut dépasser les 12 semaines
        const e = c.etat(l);
        if (e === 'avant' || e === 'manque') break;
        if (e === 'ok' || e === 'rattrapee') serie++;
      }
      const texte = serie >= 2 ? `${serie} semaines de suite` : serie === 1 ? '1 semaine de suite' : 'Nouvelle série : semaine 1';
      return { semaines, serie, texte };
    },
    // ── Semaine légère ──
    // Vrai pendant une semaine légère du réglage (semainesLegeres : des lundis ; par défaut, celle de ses finaux, le
    // 18/01/2027). Pas de règle fixe des 8 semaines (la 8e tombait en vacances). seances : gardé pour la signature.
    semaineLegere(seances, aujourdhui, reglages) {
      const l = lundiDe(aujourdhui);
      return !!l && lundisLegers(reglages).indexOf(l) >= 0;
    },
    // Après 8 semaines sans semaine légère (depuis la 1re séance ou la dernière semaine légère), le plugin la propose (les
    // entraîneurs experts placent une décharge toutes les 4 à 8 semaines [34], avis ; aucun bénéfice prouvé [35]) :
    // { lundi, texte }, sinon null. Jamais imposée ; rien si une est prévue dans les 3 semaines, ni dans les 4 semaines qui
    // suivent un « non » (reglages.legereRefus : le lundi du non). Le nombre de semaines du texte est le vrai.
    proposerSemaineLegere(seances, aujourdhui, reglages) {
      const actuel = lundiDe(aujourdhui);
      const lundis = (seances || []).map((s) => (s && s.date <= aujourdhui ? lundiDe(s.date) : null)).filter(Boolean);
      if (!actuel || !lundis.length) return null;
      const legeres = lundisLegers(reglages);
      if (legeres.some((l) => { const d = L.joursEntre(actuel, l); return d >= 0 && d <= 21; })) return null;
      let depuis = lundis.reduce((a, b) => (b < a ? b : a));
      legeres.filter((l) => l < actuel).forEach((l) => { const apres = L.plusJours(l, 7); if (apres > depuis) depuis = apres; });
      const refus = lundiDe((reglages || REGLAGES_DEFAUT).legereRefus);
      if (refus && L.joursEntre(refus, actuel) < 28) return null;
      const jours = L.joursEntre(depuis, actuel);
      if (jours < 56) return null;
      return { lundi: actuel, texte: `${Math.floor(jours / 7)} semaines sans semaine légère : en faire une cette semaine ?\nComment : séries divisées par deux, mêmes charges. C'est un avis, pas une obligation.` };
    },

    // ── Bon retour ──
    // Dernière séance (libre comprise) il y a plus de 4 jours : une carte sans reproche. De 7 à 56 jours, une phrase de plus :
    // une semaine sans salle ne fait rien perdre, 10 semaines d'arrêt sont vite rattrapées [123, 124]. Au-delà de 8 semaines,
    // les 2 séances de reprise à 2 séries (L.repriseLongue ; avis, [110, 111]).
    bonRetour(seances, aujourdhui) {
      if (!L.deISO(aujourdhui)) return null;
      let der = null;
      (seances || []).forEach((s) => { if (s && L.deISO(s.date) && s.date <= aujourdhui && (!der || s.date > der)) der = s.date; });
      if (!der) return null;
      const jours = L.joursEntre(der, aujourdhui);
      if (jours <= 4) return null;
      // 2.5.1 : au-delà de 8 semaines, la carte du jour dit déjà « Reprise … à 2 séries » : ici, seulement le pourquoi, replié.
      const rien = jours > 56 ? '\nPourquoi : après 8 semaines sans salle, tes 2 prochaines séances à 2 séries évitent les grosses courbatures.'
        : jours >= 7 ? ' Rien de perdu : garde tes charges d\'avant.' : '';
      return { jours, texte: `Bon retour ! Dernière séance il y a ${jours} jours.${rien}` };
    },

    // ── Les protéines ──
    // Repère courant en nutrition sportive pour prendre du muscle : environ 1,6 g de protéines par kg et par jour.
    proteines(poids) {
      return poids ? Math.round((poids * OBJECTIF.proteines.parKg) / 5) * 5 : null;
    },
    // L'essentiel pour manger, sur l'accueil (2.15.0, demande : l'essentiel pour manger sous la semaine, d'après les études, avec le détail au toucher). Les deux leviers aux
    // preuves les plus solides de « La bonne séance » : le total de protéines du jour (preuve forte : au moins 1,6 g par kg
    // [29, 132]) ; manger assez pour que le poids monte (preuve moyenne : en déficit on gagne moins de muscle [142], surplus
    // prudent [143] ; la vitesse, +0,25 à 0,5 % du poids par semaine, est un avis d'experts [30]). → 2 lignes courtes.
    mangerEssentiel(reglages) {
      const g = Math.max(OBJECTIF.proteines.minimum, L.proteines(reglages && reglages.poids) || 0);
      // 2.22.0 : la prise de poids visée vient aussi de son poids (L.cibleParSemaine, sur un mois de 4,33 semaines), plus d'un chiffre écrit pour 70 kg.
      const sem = L.cibleParSemaine(reglages && reglages.poids);
      const mois = (x) => L.fmt(Math.round(x * 4.33 * 10) / 10);
      return [`**Protéines** : ${g} g par jour, au moins.`,
        sem ? `**Assez manger** : ton poids doit monter de ${mois(sem.min)} à ${mois(sem.max)} kg par mois.` : '**Assez manger** : ton poids doit monter un peu chaque mois.'];
    },
    // L'eau, sur la carte « Manger » de l'accueil (2.20.0, demande : rappeler de boire sur la carte Manger de l'accueil). Les
    // études donnent une quantité, pas une heure : 2,5 L d'eau en tout par jour pour un homme, boissons et eau des aliments,
    // par temps et activité modérés [196] ; arriver hydraté à l'effort en buvant dans les heures d'avant [146] ; déshydraté,
    // 8,3 % de répétitions en moins [147]. Le moment est un choix pratique (avis) : un grand verre à chaque repas (4 verres,
    // son lait et la gourde de la séance font environ 2 L de boissons). avecRepas : la carte montre le seul repas du moment.
    boireRepas(avecRepas) {
      return avecRepas ? '**Bois** : un grand verre d\'eau avec ce repas.' : '**Bois** : un grand verre d\'eau à chaque repas.';
    },
    // Le repas du moment (2.19.0, demande : présenter le repas du moment selon l'heure). repas = L.repasDuJour ; heure = l'heure de l'horloge (0 à 23). Les plages (L.MOMENTS_REPAS, un choix
    // pratique, pas une étude) : le matin de 4 h à 11 h, le midi de 11 h à 15 h, le goûter de 15 h à 18 h, le soir de 18 h à 4 h.
    // → { repas, quoi, quand } : le repas de la note dont le nom est celui de la plage (« Soir »), et « Ce soir » ; null si la
    // note n'a pas ce repas (l'accueil montre alors tous les repas).
    MOMENTS_REPAS: [['matin', 4, 11, 'Ce matin'], ['midi', 11, 15, 'Ce midi'], ['gouter', 15, 18, 'Au goûter'], ['soir', 18, 28, 'Ce soir']],
    repasDuMoment(repas, heure) {
      const h = Number.isFinite(heure) ? ((Math.floor(heure) % 24) + 24) % 24 : -1;
      const hh = h >= 0 && h < 4 ? h + 24 : h;   // de minuit à 4 h : encore le soir
      const moment = L.MOMENTS_REPAS.find((m) => hh >= m[1] && hh < m[2]);
      const r = moment ? (Array.isArray(repas) ? repas : []).find((x) => x && L.norm(x.repas || '') === moment[0]) : null;
      return r ? { repas: r.repas, quoi: r.quoi, quand: moment[3] } : null;
    },
    // Les repas de chaque jour, pour la carte « Manger » de l'accueil (2.16.0, demande : les repas du jour sur l'accueil, les choix séparés par ou). Ils viennent de la note « Manger ».
    // 2.18.0 (courses et recettes liées) : chaque partie de la note qui a des plats (« ## Midi », puis « ### Poulet et riz »…) donne une
    // ligne : → [{ repas, quoi }], le nom de la partie et ses plats reliés par « ou » (sans la « Collation », qui n'est pas de
    // tous les jours). Une note à l'ancienne forme (section « Ta journée », une puce par repas, « - **Matin** : quoi. Le
    // détail… ») : le nom du repas et sa première phrase. Note absente ou sans rien de lisible : [].
    repasDuJour(texte) {
      if (!texte) return [];
      const parties = L.sections(String(texte));
      const repas = [];
      parties.forEach((s) => {
        const noms = s.titre ? L.plats(s.lignes).plats.map((p) => p.nom).filter((n) => !/^collation/i.test(n)) : [];
        if (noms.length) repas.push({ repas: s.titre, quoi: noms.map((n) => n.charAt(0).toLowerCase() + n.slice(1)).join(', ou ') });
      });
      if (repas.length) return repas;
      const sec = parties.find((s) => L.norm(s.titre || '') === 'ta journee');
      const out = [];
      (sec ? sec.lignes : []).forEach((brute) => {
        const m = /^[-*+]\s+\*\*(.+?)\*\*\s*:\s*(.+)$/.exec(String(brute).trim());
        if (!m || /^collation/i.test(m[1].trim())) return;
        const quoi = m[2].split(/[.!?](?:\s+|$)/)[0].trim();
        if (quoi) out.push({ repas: m[1].trim(), quoi });
      });
      return out;
    },

    // ── Bilan de fin comparé ──
    // L'écart en % : '+6 %', '−4 %', '=' ; null sans référence.
    ecart(v, ref) {
      if (v == null || !isFinite(v) || !(ref > 0)) return { ecart: null, sens: null };
      const p = Math.round((v / ref - 1) * 100);
      if (p === 0) return { ecart: '=', sens: 'egal' };
      return p > 0 ? { ecart: `+${p} %`, sens: 'plus' } : { ecart: `−${-p} %`, sens: 'moins' };
    },
    // Un exercice face à la dernière fois qu'il a été fait (der = L.derniere) : { signe, texte }.
    // 'charge' (plus lourd), 'plus', 'egal', 'moins' (jamais en rouge à l'écran), 'nouveau'. À même charge, on compare les
    // répétitions série par série, sur le nombre de séries faites les deux fois : le leg curl à 3 séries (B) après 2 séries
    // (A) n'est pas « +10 répétitions » (une série de plus se voit dans la tuile « Séries »). Au temps, les secondes.
    compareExo(series, der) {
      const auj = (Array.isArray(series) ? series : []).filter(Boolean);
      const avant = der && Array.isArray(der.series) ? der.series.filter(Boolean) : [];
      if (!avant.length) return { signe: 'nouveau', texte: 'Première fois' };
      if (!auj.length) return { signe: 'moins', texte: 'Pas fait cette fois' };
      const egal = { signe: 'egal', texte: 'Comme la dernière fois' };
      const ecartCommun = (a, b) => {   // somme de a moins somme de b, sur les premières séries communes
        const m = Math.min(a.length, b.length), somme = (l) => l.slice(0, m).reduce((t, v) => t + v, 0);
        return somme(a) - somme(b);
      };
      if (auj.some(auTemps) || avant.some(auTemps)) {
        const d = ecartCommun(auj.filter(auTemps).map((x) => x.s), avant.filter(auTemps).map((x) => x.s));
        return d > 0 ? { signe: 'plus', texte: `+${d} s en tout` } : d < 0 ? { signe: 'moins', texte: `${-d} s de moins en tout` } : egal;
      }
      const cA = maxDe(auj.map(chargeDe)), cB = maxDe(avant.map(chargeDe));
      if (cA > cB + 1e-9) return { signe: 'charge', texte: `Nouvelle charge : ${L.fmt(cA)} kg, avant ${kg(cB)}` };
      if (cA < cB - 1e-9) return { signe: 'moins', texte: `Plus léger : ${kg(cA)}${cA > 0 ? ' kg' : ''}, avant ${L.fmt(cB)}` };
      const aCharge = (liste) => liste.filter((x) => egaux(chargeDe(x), cA)).map((x) => x.r || 0);
      const d = ecartCommun(aCharge(auj), aCharge(avant));
      return d > 0 ? { signe: 'plus', texte: `+${L.pluriel(d, 'répétition')}` } : d < 0 ? { signe: 'moins', texte: `${L.pluriel(-d, 'répétition')} de moins` } : egal;
    },
    // Le bilan de fin : 3 tuiles (durée, séries, charge totale) comparées à la dernière séance du même nom, une ligne par
    // exercice comparée à la dernière fois qu'il a été fait, le résumé, les records. avant = les séances d'avant celle-ci.
    bilanCompare(seance, avant) {
      seance = seance || { exos: [] };
      const liste = L.trier((avant || []).filter((s) => s && s !== seance && Array.isArray(s.exos) && L.deISO(s.date)));
      const nom = L.norm(seance && seance.nom);
      let ref = null;
      liste.forEach((s) => { if (L.norm(s.nom) === nom && s.date <= seance.date && (!ref || s.date >= ref.date)) ref = s; });
      const chiffres = (s) => ({ duree: s.dureeMin > 0 ? Math.round(s.dureeMin) : null, series: exosDe(s).reduce((t, e) => t + L.nbSeries(e), 0), charge: L.tonnage(s) });
      const v = chiffres(seance), r = ref ? chiffres(ref) : {};
      const tuile = (cle, titre, texte) => Object.assign({ cle, titre, valeur: v[cle], texte }, L.ecart(v[cle], r[cle]));
      const tuiles = [
        tuile('duree', 'Durée', v.duree ? `${v.duree} min` : '—'),
        tuile('series', 'Séries', String(v.series)),
        tuile('charge', 'Charge totale', `${L.fmtMilliers(v.charge)} kg`),   // en 3e : jamais en vedette
      ];
      const records = L.recordsDetail(seance, liste);
      const exos = [];
      exosDe(seance).forEach((e) => {
        if (!Array.isArray(e.series) || !e.series.length) return;
        const c = L.compareExo(e.series, L.derniere(liste, e.nom));
        const rec = records.find((x) => L.norm(x.nom) === L.norm(e.nom));
        exos.push({ nom: e.nom, signe: c.signe, texte: c.texte, record: rec ? rec.type : null });
      });
      const hausse = exos.filter((x) => x.signe === 'charge' || x.signe === 'plus').length;
      const pareil = exos.filter((x) => x.signe === 'egal').length;
      const resume = [hausse ? `${hausse} en hausse` : '', pareil ? `${pareil} comme la dernière fois` : ''].filter(Boolean).join(', ');
      return { reference: ref ? { date: ref.date, nom: ref.nom } : null, tuiles, exos, resume, records };
    },
    // Les succès de la séance, pour féliciter à la fin (2.14.2, demande : féliciter à la fin de la séance, comme un succès obtenu). Seulement du vrai, dans cet ordre :
    //  'seance'  toujours : « Séance complète » si tous les exercices prévus sont finis (plan.complete), sinon « Séance faite »
    //            (« 7 exercices sur 8 », plan.prevus) ; sans plan (un bilan rouvert) : complète si aucun exercice n'a été passé ;
    //  'records' les records battus (cmp.records de L.bilanCompare), avec leurs noms courts ;
    //  'progres' les exercices en hausse face à la dernière fois (une charge ou une répétition de plus) ;
    //  'semaine' l'objectif de la semaine atteint avec cette séance (faites = les séances de la semaine, celle-ci comprise).
    // seance = la séance notée ; cmp = L.bilanCompare (ou null) ; faites, objectif : la semaine ; plan (facultatif) =
    // { prevus, complete }, posé par l'écran de séance à la fin. → [{ cle, titre, detail }].
    succesSeance(seance, cmp, faites, objectif, plan) {
      const s = seance && Array.isArray(seance.exos) ? seance : { exos: [] };
      const n = s.exos.filter((e) => e && Array.isArray(e.series) && e.series.length).length;
      const passes = Array.isArray(s.pasFait) ? s.pasFait.length : 0;
      const prevus = plan && plan.prevus > 0 ? plan.prevus : n + passes;
      const complete = plan ? !!plan.complete : !passes;
      const out = [];
      if (n > 0) out.push(complete ? { cle: 'seance', titre: 'Séance complète', detail: L.pluriel(n, 'exercice') } : { cle: 'seance', titre: 'Séance faite', detail: `${L.pluriel(n, 'exercice')} sur ${Math.max(prevus, n)}` });
      const records = cmp && Array.isArray(cmp.records) ? cmp.records : [];
      const noms = records.map((r) => L.nomCourt(r.nom)).join(', ');
      if (records.length) out.push({ cle: 'records', titre: L.pluriel(records.length, 'record'), detail: noms.charAt(0).toUpperCase() + noms.slice(1) });
      const hausse = cmp && Array.isArray(cmp.exos) ? cmp.exos.filter((x) => x.signe === 'charge' || x.signe === 'plus').length : 0;
      if (hausse) out.push({ cle: 'progres', titre: `${L.pluriel(hausse, 'exercice')} en progrès`, detail: 'Une charge ou une répétition de plus' });
      if (objectif > 0 && faites >= objectif) out.push({ cle: 'semaine', titre: 'Semaine complète', detail: `${L.pluriel(faites, 'séance')} sur ${objectif}` });
      return out;
    },
    // Le poids total soulevé dans une séance : charge × répétitions, toutes séries confondues (jamais en vedette).
    tonnage(seance) {
      return Math.round(exosDe(seance).reduce((t, e) => t + (Array.isArray(e.series) ? e.series : []).reduce((u, x) => u + (x ? chargeDe(x) * (x.r || 0) : 0), 0), 0));
    },

    // ── « Tes progrès » sur l'accueil ──
    // Les muscles de la carrure : ceux qui ont la zone 10-15 (L.REPERES_VOLUME.avecZone : dos, côté des épaules, pecs ;
    // consigne de l'écran Progrès : « Dos, côté des épaules et pecs font ta carrure »). Tirages, développés, élévations.
    MUSCLES_CARRURE: OBJECTIF.musclesPrioritaires,   // objectif.json
    // Seulement du vrai, au plus 4 lignes : { lignes: [{ texte, type }], vide }. Dans l'ordre :
    //  - 'exercice' : 2 ou 3 exercices de la carrure du programme (remplaçants compris), faits dans au moins 2 séances, de la
    //    première à la dernière (la meilleure série de chacune, comme les courbes de L.pointsCourbe) : « Tirage vertical :
    //    35 → 42,5 kg » ; à charge égale, les répétitions : « Élévations latérales : 4 kg × 15 → 4 kg × 20 » ; au temps,
    //    « 30 s → 45 s » ; au poids du corps, « 12 → 15 rép. ». Sans progrès : pas montré (jamais de baisse). Les plus fortes
    //    hausses d'abord (L.valeur sert seulement à trier, comme dans le reste du plugin), à égalité l'ordre du programme ;
    //  - 'records' : les records de la dernière séance (L.recordsDetail) : « Vendredi : 2 records » ;
    //  - 'mesure' : le tour d'épaules, s'il a grandi entre la première et la dernière mesure, à au moins 84 jours d'écart
    //    (L.JOURS_COMPARER : « Juge tes progrès sur 12 semaines, pas sur 2 » ; les premières séances font gonfler le muscle
    //    d'eau [108, 109]) : « Épaules : 112 → 113 cm » ;
    //  - 'regularite' : la série de semaines (L.regularite) à partir de 2 : « 2 semaines de suite à 3 séances » (« 2 semaines
    //    de suite » si une semaine rattrapée y compte).
    // Au moins 2 exercices s'il y en a ; les autres lignes ensuite, dans cet ordre, jusqu'à 4. Rien à montrer : une seule ligne
    // et vide = true : 'depart' (aucune séance), 'bientot' (une séance), 'prochaine' (des séances, pas encore de hausse).
    // Chaque partie est calculée à part : une donnée abîmée retire sa ligne, jamais la carte.
    progresAccueil(seances, programme, mesures, aujourdhui, reglages) {
      const reg = reglages || {};
      const auj = L.deISO(aujourdhui) ? aujourdhui : null;
      const liste = seancesJusqua(seances, auj);
      const exercices = sur(() => hausseCarrure(liste, programme)) || [];
      const autres = [sur(() => ligneRecords(liste, auj)), sur(() => ligneEpaules(mesures, auj)), sur(() => ligneRegularite(liste, auj, reg))].filter(Boolean);
      const choisis = exercices.slice(0, Math.min(3, Math.max(2, 4 - autres.length)));
      // Le nom court (« Tirage vertical ») ; deux exercices au même nom court gardent leur nom entier.
      const courts = choisis.map((x) => L.noms([{ nom: x.nom }]));
      const lignes = choisis.map((x, k) => ({ texte: `${courts.filter((c) => c === courts[k]).length > 1 ? x.nom : courts[k]} : ${x.texte}`, type: 'exercice' }))
        .concat(autres).slice(0, 4);
      if (lignes.length) return { lignes, vide: false };
      const n = liste.length;
      if (!n) return { lignes: [{ texte: 'Ta prochaine séance sera ton point de départ.', type: 'depart' }], vide: true };
      if (n === 1) return { lignes: [{ texte: 'Encore une séance et tu verras tes premiers progrès.', type: 'bientot' }], vide: true };
      return { lignes: [{ texte: 'À ta prochaine séance : 1 répétition ou 1 cran de plus. Tu le verras ici.', type: 'prochaine' }], vide: true };
    },

    // ── Avant la séance : « Pour te lancer » ──
    // Quelques lignes vraies juste avant « Commencer » (demandé le 15/11 : quelques mots d'encouragement avant la séance). 2.14.2 (demande du 16/11 : ne pas annoncer les records à portée, féliciter à la fin) : plus aucun record annoncé d'avance ; les
    // records se disent quand ils arrivent (pendant le repos) et au bilan (L.felicitations).
    // sj = la séance préparée (L.preparerSeance) ; bilan = celui du jour (facultatif).
    // → { titre: 'Pour te lancer', lignes: [{ texte, type }] }, au plus 3 lignes, dans cet ordre :
    //  - 'progres' : la plus forte hausse depuis le début sur un exercice de la séance (le calcul de « Tes progrès ») :
    //    « Depuis le 13/11 : élévations latérales 4 kg × 15 → 4 kg × 20 ». Jamais de baisse ;
    //  - 'semaine' : « Cette séance complète ta semaine (3 sur 3) », « 2e séance de la semaine (2 sur 3) » ; rien pour la 1re,
    //    au-delà de l'objectif, ni pendant une semaine sans salle ;
    //  - 'depart' : les exercices jamais faits : « Première fois pour développé assis et gainage planche : ce que tu notes
    //    aujourd'hui sera ton point de départ : 2 séries, sans aller au bout. » (plus de 3 : « pour 4 exercices ») ; aucun de
    //    connu : « Première fois pour « Séance A » : … ». « 2 séries » seulement si tous ces exercices en ont 2 au plus (« Exercice
    //    nouveau : la première fois en 2 séries, sans aller au bout », avis [110]).
    // Jour allégé (semaine légère, nuit courte, retour de maladie) : une seule ligne 'calme' : « Aujourd'hui, on garde tes
    // charges : ça compte aussi. ». Courbatures fortes sur tous les exercices : « Aujourd'hui, plus léger là où tu as des
    // courbatures : ça compte aussi. »
    // Rien à dire : { titre: '', lignes: [] }. Chaque partie est calculée à part (un exercice ou une donnée abîmée retire sa
    // ligne, jamais la carte). programme : seulement pour les noms de la ligne 'depart' (les exercices viennent de sj).
    boostAvant(sj, seances, programme, aujourdhui, reglages, bilan) {
      const rien = { titre: '', lignes: [] };
      const exos = sj && Array.isArray(sj.exos) ? sj.exos.filter((x) => x && x.nom && !x.echauffement) : [];
      if (!exos.length) return rien;
      const b = bilan && typeof bilan === 'object' ? bilan : null;
      const auj = L.deISO(aujourdhui) ? aujourdhui : null;
      // Jour allégé : une seule ligne calme.
      const calme = (texte) => ({ titre: 'Pour te lancer', lignes: [{ texte, type: 'calme' }] });
      if (sj.legere || (b && b.sommeil === 'court') || exos.some((x) => x.sansMontee || x.legere)) return calme('Aujourd\'hui, on garde tes charges : ça compte aussi.');
      if (exos.every((x) => x.courb)) return calme('Aujourd\'hui, plus léger là où tu as des courbatures : ça compte aussi.');
      const ctx = { sj, exos, liste: seancesJusqua(seances, auj), programme, auj, reg: reglages || {}, nomsSeance: exos.map((x) => x.nom) };
      const lignes = [meilleureHausse(ctx), sur(() => ligneSemaine(ctx)), sur(() => ligneDepart(ctx))].filter(Boolean).map((l) => ({ texte: l.texte, type: l.type }));
      return lignes.length ? { titre: 'Pour te lancer', lignes } : rien;
    },
  });
}
