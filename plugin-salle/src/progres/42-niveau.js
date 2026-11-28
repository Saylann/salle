// L : le niveau, ses XP (gagnés, et perdus après un long arrêt) et les paliers atteints par les XP (mesures et photo à chaque palier). Pur : les
// mesures arrivent lues.
// Le contrat et ses raisons : ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-niveaux-contrat.md ; les règles, en tête de chaque partie ci-dessous.
{
  // ── Petits outils de ce fichier (dans ce bloc : ils ne gênent aucun autre fichier) ──
  const estNombre = (v) => typeof v === 'number' && isFinite(v);   // un nombre fini (ni NaN ni l'infini)
  // Une copie profonde d'un résultat (objets, tableaux, valeurs simples) : celui qui le reçoit peut le modifier sans toucher
  // la mémoire de L.niveau.
  const copie = (x) => {
    if (Array.isArray(x)) return x.map(copie);
    if (!x || typeof x !== 'object') return x;
    const o = {};
    Object.keys(x).forEach((k) => { o[k] = copie(x[k]); });
    return o;
  };
  // Les derniers niveaux calculés : { cle (les entrées en JSON), valeur }, le plus récent d'abord, 4 au plus.
  const MEMOIRE_NIVEAU = [];
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  // Une vraie date du calendrier (« 2026-02-30 » n'en est pas une), ou null.
  const dateDe = (d) => {
    const iso = (/^\d{4}-\d{2}-\d{2}/.exec(typeof d === 'string' ? d : '') || [null])[0];
    return iso && L.deISO(iso) && L.dateISO(L.deISO(iso)) === iso ? iso : null;
  };
  // Une série faite : des répétitions (charge nulle ou positive), ou des secondes. Recopiée sans rien d'autre (pas de drapeau).
  const serieDe = (x) => {
    if (!x || typeof x !== 'object') return null;
    if (x.s != null) return estNombre(x.s) && x.s > 0 ? { s: x.s } : null;
    if (!estNombre(x.r) || !(x.r > 0)) return null;
    if (x.c != null && !(estNombre(x.c) && x.c >= 0)) return null;
    return { c: x.c > 0 ? x.c : 0, r: x.r };
  };
  // Une séance lisible, recopiée : date vraie, exercices avec au moins une série faite (l'échauffement et les approches ne
  // sont jamais des séries), la réserve si elle est connue. Rien de fait (ni série ni cardio) : null. La séance en cours
  // (data.json, exos avec « faites ») n'a pas de séries : elle ne compte pas tant qu'elle n'est pas notée.
  const propre = (s) => {
    if (!s || typeof s !== 'object' || !Array.isArray(s.exos)) return null;
    const date = dateDe(s.date);
    if (!date) return null;
    const exos = [];
    s.exos.forEach((e) => {
      if (!e || typeof e !== 'object' || e.echauffement || typeof e.nom !== 'string' || !e.nom.trim() || !Array.isArray(e.series)) return;
      const series = e.series.map(serieDe).filter(Boolean);
      if (!series.length) return;
      const o = { nom: e.nom.trim(), series };
      if (RESERVES.some((r) => r[0] === e.reserve)) o.reserve = e.reserve;
      exos.push(o);
    });
    const cardio = estNombre(+s.cardioMin) && +s.cardioMin > 0;
    if (!exos.length && !cardio) return null;
    const o = { date, nom: typeof s.nom === 'string' && s.nom.trim() ? s.nom.trim() : 'Séance', exos };
    if (cardio) o.cardioMin = +s.cardioMin;
    if (estNombre(+s.dureeMin) && +s.dureeMin > 0) o.dureeMin = +s.dureeMin;
    if (s.bilan && typeof s.bilan === 'object') o.bilan = s.bilan;
    if (typeof s.chemin === 'string') o.chemin = s.chemin;
    return o;
  };
  const seriesSeance = (s) => s.exos.reduce((t, e) => t + e.series.length, 0);
  const cleDouble = (s) => `${s.date}|${L.norm(s.nom)}`;
  // Un ordre total, pour que l'ordre des notes ne change rien : date, chemin, nom, puis le contenu.
  const ordre = (a, b) => cmp(a.date, b.date) || cmp(String(a.chemin || ''), String(b.chemin || '')) || cmp(L.norm(a.nom), L.norm(b.nom))
    || cmp(JSON.stringify(a.exos), JSON.stringify(b.exos));
  // Les séances qui comptent, triées, sans double : même date et même nom = la même séance notée deux fois (copie iCloud,
  // note recopiée) ; on garde la plus complète. Seulement jusqu'à « jusqua » (s'il est une date).
  const nettoyer = (seances, jusqua) => {
    const fin = dateDe(jusqua);
    const liste = (Array.isArray(seances) ? seances : []).map(propre).filter((s) => s && (!fin || s.date <= fin)).sort(ordre);
    const garde = {};
    liste.forEach((s) => { const k = cleDouble(s); if (!garde[k] || seriesSeance(s) > seriesSeance(garde[k])) garde[k] = s; });
    return liste.filter((s) => garde[cleDouble(s)] === s);
  };
  // Une mesure lisible : date vraie ; les tours et le poids seulement s'ils sont des nombres > 0 ; la photo si c'est un texte.
  const CORPS = [['epaules', 'Épaules', 'cm'], ['bras', 'Bras', 'cm'], ['poids', 'Poids', 'kg']];
  const mesuresPropres = (mesures) => (Array.isArray(mesures) ? mesures : []).filter((m) => m && typeof m === 'object' && dateDe(m.date))
    .map((m, k) => ({ m, k })).sort((a, b) => cmp(a.m.date, b.m.date) || a.k - b.k).map((x) => x.m);
  const aUneValeur = (m) => CORPS.some(([k]) => estNombre(m[k]) && m[k] > 0) || (estNombre(m.poitrine) && m.poitrine > 0);
  const aUnePhoto = (m) => typeof m.photo === 'string' && !!m.photo.trim();
  // Les séries prévues ce jour-là : la séance du programme du même nom, telle que le plugin l'a proposée (mise en route,
  // semaine légère, bilan du jour, première fois en 2 séries : L.seanceDuJour puis L.preparerSeance). Séance libre : null.
  // Une note d'avant la 2.1.2 peut garder le temps du jour de cette séance (temps_min) : il remplace la durée des réglages.
  // Si ce calcul échoue (donnée abîmée), les séries du programme sans les options.
  const prevues = (s, avant, programme, reglages) => {
    const i = programme.findIndex((p) => p && L.norm(p.nom) === L.norm(s.nom));
    if (i < 0 || !Array.isArray(programme[i].exos)) return null;
    const somme = (exos) => (exos || []).reduce((t, x) => t + (x && !x.echauffement && x.series > 0 ? Math.floor(x.series) : 0), 0);
    try {
      const b = s.bilan && typeof s.bilan === 'object' ? s.bilan : null;
      const reg = b && b.temps > 0 ? Object.assign({}, reglages || {}, { duree: b.temps }) : reglages;
      const sj = L.seanceDuJour(programme, avant, reg, s.date, i, b);
      const prep = L.preparerSeance(sj, { seances: avant, programme, reglages: reg });
      const n = somme(prep && prep.exos);
      if (n > 0) return n;
    } catch (e) { /* le calcul de secours ci-dessous */ }
    const n = somme(programme[i].exos.filter((x) => x && !x.option));
    return n > 0 ? n : null;
  };

  // Les XP d'une séance déjà propre, face aux séances d'avant (propres, triées). Voir L.xpSeance. parNom (facultatif, tenu à
  // jour par L.niveau) : nom normalisé → les séries d'avant de cet exercice, à plat et dans l'ordre. Les records ne lisent
  // que les séries du même nom : un appel par nom avec sa seule histoire (L.recordsFaceA) donne le même résultat que
  // L.recordsDetail, sans relire toute l'histoire à chaque séance.
  const xpPropre = (s, avant, programme, reglages, parNom) => {
    const R = L.XP_NIVEAU, lignes = [];
    const ajouter = (cle, texte, xp, n) => { if (xp > 0) lignes.push({ texte, xp, cle, n: n > 0 ? n : 1 }); };
    const n = seriesSeance(s);
    // 1. Venir : séance complète (au moins 70 % des séries prévues, ou au moins 10 séries faites), sinon séance courte.
    let complete = n >= R.seriesMin;
    if (!complete && n > 0) {
      let p = null;
      try { p = prevues(s, avant, programme, reglages); } catch (e) { p = null; }
      complete = p > 0 && n >= R.part * p - 1e-9;
    }
    ajouter('seance', 'Séance faite', complete ? R.faite : R.courte);
    // 2. Assez de séries : au plus 8 par muscle (le muscle principal de chaque exercice, L.musclePrincipal) : au-delà
    // d'environ 8 séries directes pour un même muscle dans une séance, une de plus ne rapporte rien de mesurable [28]
    // (L.REPERES_VOLUME.parSeance). Un exercice sans muscle connu est compté comme son propre muscle.
    const parMuscle = {};
    let comptees = 0;
    s.exos.forEach((e) => {
      const m = L.musclePrincipal(e.nom) || 'exercice ' + L.norm(e.nom);
      const deja = parMuscle[m] || 0, ici = Math.max(0, Math.min(e.series.length, L.REPERES_VOLUME.parSeance - deja));
      parMuscle[m] = deja + e.series.length;
      comptees += ici;
    });
    ajouter('series', L.pluriel(comptees, 'série'), comptees * R.serie, comptees);
    // 3. Progresser : chaque exercice en hausse face à la fois d'avant (L.compareExo : une répétition, un cran, plus lourd),
    // une fois par nom ; et les records de la séance (L.recordsDetail : au plus un par exercice).
    let progres = 0;
    const vus = {};
    s.exos.forEach((e) => {
      const k = L.norm(e.nom);
      if (vus[k]) return;
      vus[k] = true;
      try {
        const c = L.compareExo(e.series, L.derniere(avant, e.nom));
        if (c.signe === 'plus' || c.signe === 'charge') progres++;
      } catch (err) { /* cet exercice ne compte pas */ }
    });
    progres = Math.min(R.maxProgres, progres);
    ajouter('progres', `${progres} progrès`, progres * R.progres, progres);
    let records = 0;
    try {
      if (parNom) {
        const groupes = new Map();   // les exercices de la séance par nom (deux sections du même nom : un seul record)
        s.exos.forEach((e) => { const n = L.norm(e.nom); if (!groupes.has(n)) groupes.set(n, []); groupes.get(n).push(e); });
        groupes.forEach((exos, n) => { records += L.recordsFaceA({ date: s.date, nom: s.nom, exos }, parNom.get(n) || []).length; });
      } else records = L.recordsDetail(s, avant).length;
    } catch (e) { records = 0; }
    records = Math.min(R.maxRecords, records);
    ajouter('records', L.pluriel(records, 'record'), records * R.record, records);
    // 4. Des séries dures : la réserve de la dernière série, « 0 » ou « 1 ou 2 », une fois par exercice.
    const dures = {};
    s.exos.forEach((e) => { if (e.reserve === '0' || e.reserve === '1-2') dures[L.norm(e.nom)] = true; });
    const nd = Object.keys(dures).length;
    ajouter('dures', nd > 1 ? `${nd} séries dures` : '1 série dure', nd * R.dure, nd);
    // 5. Revenir : plus de 4 jours sans séance (L.bonRetour, la même règle que la carte de l'accueil).
    let retour = null;
    try { retour = avant.length ? L.bonRetour(avant, s.date) : null; } catch (e) { retour = null; }
    if (retour) ajouter('retour', 'Bon retour', R.retour);
    // 6. La semaine (L.regularite, qui pardonne) : la séance qui atteint l'objectif rapporte le bonus de la semaine ; celle qui
    // le dépasse d'une rattrape la semaine d'avant (« rattrapee »). Pause : 0, rien de perdu. Une semaine en pause n'est jamais
    // « rattrapee » pour L.regularite : si elle l'aurait été sans la pause, le bonus compte quand même (prévoir une pause ne
    // coûte jamais d'XP).
    try {
      const reg = reglages || {};
      const obj = L.objectifSemaine(reg);
      const avec = avant.concat([s]);
      const r = L.regularite(avec, s.date, obj, reg.pauses);
      const ici = r.semaines[r.semaines.length - 1], prec = r.semaines[r.semaines.length - 2];
      const rattrape = () => {
        if (prec.etat === 'rattrapee') return true;
        if (prec.etat !== 'pause') return false;
        const sans = L.regularite(avec, s.date, obj, []).semaines;
        return sans[sans.length - 2].etat === 'rattrapee';
      };
      if (ici && ici.etat === 'ok' && ici.faites === obj) ajouter('semaine', 'Semaine à l\'objectif', R.semaine);
      else if (ici && prec && ici.faites === obj + 1 && rattrape()) ajouter('rattrapee', 'Semaine rattrapée', R.rattrapee);
    } catch (e) { /* pas de bonus de semaine */ }
    return { total: lignes.reduce((t, l) => t + l.xp, 0), lignes };
  };

  Object.assign(L, {
    // ── Les règles : XP, titres, seuils ──
    // Des XP pour ce qui fait progresser, lu dans les notes de séance (la vérité) : venir, assez de séries, progresser, des
    // séries dures, tenir la semaine, revenir après une absence (« La bonne séance », partie 4 ;
    // ~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-14-interfaces.md, partie 4 : des points sans lien avec une vraie action
    // s'usent vite, Mazeas 2022, Milkman 2021 ; récompenser le retour marche, Milkman 2021). Rien n'est stocké : tout se
    // recalcule, même résultat sur le Mac et sur l'iPhone.
    // 2.11.0 (demande du 15/11 : des XP qui suivent les études, pas un jeu : une séance ratée en fait perdre) : les XP suivent ce que les études disent d'un arrêt (résumés relus sur PubMed le 15/11/2026).
    //  - Une séance manquée : rien de perdu, seulement moins de gagné (moins de séries, moins de muscle [11, 12]).
    //  - Jusqu'à 3 semaines sans séance : rien de perdu. 3 semaines d'arrêt toutes les 6 semaines donnent le même muscle et la
    //    même force sur 24 semaines que sans arrêt [123] (14 hommes, un seul exercice).
    //  - Au-delà, le muscle et la force baissent [124] ; à 20 semaines d'arrêt, le muscle est revenu au départ [125]. Entre
    //    les deux, la baisse est supposée régulière (estimation) : chaque semaine de la 4e à la 20e coûte 1/17 des XP qu'il
    //    avait à sa dernière séance (ARRET : sans = 21 jours, fin = 140 jours).
    //  - Au retour, ce qui est perdu revient vite : 10 semaines d'arrêt puis 10 de reprise font autant que 20 de suite [124].
    //    Chaque séance rend donc, en plus de ses XP, autant d'XP perdus qu'elle en gagne (« Muscle retrouvé »), jusqu'à tout
    //    rendre. ([125] ne voit pas de reprise plus rapide : sur une jambe, 19 personnes.)
    // Une semaine prévue sans salle ou non : le corps ne fait pas la différence. Le total ne passe pas sous 0. « Protéines et
    // sommeil » cochée rapporte aussi (avis : c'est ce qui compte le plus pour lui, mince, mais c'est lui qui le dit).
    // Les XP de chaque action. Les plafonds : au plus 6 progrès et 4 records comptés par séance. recup : par semaine cochée ;
    // type : une séance bien faite (pour dire « environ 18 séances »).
    XP_NIVEAU: { faite: 100, courte: 50, part: 0.7, seriesMin: 10, serie: 5, progres: 25, maxProgres: 6, record: 40, maxRecords: 4, dure: 10, semaine: 150, rattrapee: 100, retour: 50,
      recup: 50, type: 550 },
    ARRET: { sans: 21, fin: 140 },
    // Les paliers, là où les études disent que le corps change (« La bonne séance »). Les études durent 8 à 12 semaines ; à
    // 3 séances par semaine : 18 séances ≈ 6 semaines, 36 ≈ 12 semaines, 72 ≈ 6 mois, 144 ≈ 1 an. Un palier s'atteint par les
    // XP : xp = ces séances × une séance bien faite (L.XP_NIVEAU.type, environ 550 XP, bonus de la semaine compris), arrondi.
    // Bien faire les choses y mène plus vite ; un long arrêt fait redescendre. Chaque phrase dit ce que les études annoncent
    // à ce moment-là, sans promesse chiffrée de muscle (« 0,5 à 1 kg de muscle par mois » est trop optimiste [66]).
    // Les 5 paliers (titre, séances, XP, phrase) sont dans la fiche de l'objectif (objectifs/<objectif>/objectif.json).
    // Leurs sources, dans l'ordre :
    // [108, 109] : les premières séances abîment le muscle et le font gonfler (de l'eau).
    // [108, 109] : « La vraie prise de muscle se voit vers 18 séances. »
    // [33, 66] et « Juge tes progrès sur 12 semaines (charges, tour d'épaules, photos), pas sur 2 » : la durée des études.
    // Épaules et taille font les proportions qui plaisent le plus (« Le physique qui plaît » [161, 164, 165]).
    // [65] : la force ralentit, puis plafonne vers 1 à 2 ans.
    // [65, 66] : le plus gros des gains du débutant la première année (de l'ordre de 3 à 6 kg de masse maigre, estimation).
    PALIERS: OBJECTIF.paliers,
    // L'XP total pour atteindre le niveau n : base × (n − 1)^1,5, arrondi à 50 (niveau 1 = 0).
    // La base 600 vient d'un essai sur ses notes (16 semaines simulées, environ 1 800 XP par semaine à 3 séances) : niveau
    // 2 = 600 (sa 3e séance), 5 = 4 800 (environ un niveau par semaine au début), 10 = 16 200 (9 semaines régulières),
    // 20 = 49 700 (environ 6 mois). Avec 250, « Confirmé » arrivait en 12 semaines.
    COURBE_NIVEAU: { base: 600, puissance: 1.5, arrondi: 50 },
    seuilNiveau(n) {
      const k = Math.max(1, Math.floor(+n || 1)), C = L.COURBE_NIVEAU;
      return Math.round((C.base * Math.pow(k - 1, C.puissance)) / C.arrondi) * C.arrondi;
    },
    // Le niveau d'un total d'XP (1 au moins).
    niveauDe(xp) {
      const x = estNombre(+xp) ? +xp : 0;
      let n = 1;
      while (n < 10000 && L.seuilNiveau(n + 1) <= x) n++;
      return n;
    },
    // Le palier d'un total d'XP → { rang (0 à 4), titre, xp (où ce palier commence), seances (le repère des études), prochain:
    // { titre, a (les XP où il commence), reste (les XP qui manquent), seances (environ, en séances bien faites) } | null (au
    // dernier), phrase }. Le palier suit les XP : un long arrêt le fait redescendre, comme le corps [125].
    palier(xp) {
      const x = estNombre(+xp) && +xp > 0 ? +xp : 0;
      const P = L.PALIERS;
      let rang = 0;
      P.forEach((p, k) => { if (x >= p.xp) rang = k; });
      const suite = P[rang + 1] || null;
      const reste = suite ? Math.max(0, suite.xp - x) : 0;
      return { rang, titre: P[rang].titre, xp: P[rang].xp, seances: P[rang].seances,
        prochain: suite ? { titre: suite.titre, a: suite.xp, reste, seances: Math.max(1, Math.ceil(reste / L.XP_NIVEAU.type)) } : null, phrase: P[rang].phrase };
    },

    // ── Les XP d'une séance, le niveau du jour ──
    // Les XP d'une séance : { total, lignes: [{ texte, xp, cle }] }, une ligne par action qui rapporte, dans cet ordre :
    // 'seance' « Séance faite » (+100 si au moins 70 % des séries prévues ou au moins 10 séries, séance libre comprise ;
    // sinon +50), 'series' « 18 séries » (+5 chacune, approches et échauffement exclus), 'progres' « 3 progrès » (+25 par
    // exercice en hausse face à la fois d'avant, au plus 6), 'records' « 2 records » (+40, au plus 4), 'dures' « 3 séries
    // dures » (+10 par exercice dont la réserve est « 0 » ou « 1 ou 2 »), 'retour' « Bon retour » (+50 après plus de 4 jours
    // sans séance), 'semaine' « Semaine à l'objectif » (+150, la séance qui atteint parSemaine) ou 'rattrapee' « Semaine
    // rattrapée » (+100, la séance qui rattrape la semaine d'avant). Une ligne à 0 n'est pas montrée.
    // seance : une séance notée (L.lireSeance) ou celle que le plugin va écrire (ECRAN_SEANCE.seanceNote) ; avant : les
    // séances d'avant (dans n'importe quel ordre ; celles d'après, la séance elle-même et ses doubles sont écartés).
    // Séance illisible ou vide : { total: 0, lignes: [] }.
    xpSeance(seance, seancesAvant, programme, reglages) {
      const s = propre(seance);
      if (!s) return { total: 0, lignes: [] };
      const k = cleDouble(s);
      const avant = nettoyer(seancesAvant, s.date).filter((x) => cleDouble(x) !== k && ordre(x, s) < 0);
      return xpPropre(s, avant, Array.isArray(programme) ? programme : [], reglages || {});
    },
    // Le niveau d'aujourd'hui, recalculé sur toutes les séances notées jusqu'à aujourdhui (sans double, sans séance abîmée ;
    // l'ordre des notes ne change rien). → { niveau, titre, xp, xpNiveau, xpSuivant, reste, part, prochainTitre,
    // prochainPalier, seances, moyenne, derniere, faites, palier, paliers, objectif, pertes, semaine }.
    //  xpNiveau / xpSuivant : l'XP total où commence ce niveau / le suivant ; reste = xpSuivant − xp ; part : 0 à 1 dans le
    //  niveau ; seances : le nombre de séances comptées ; moyenne : l'XP moyen des 6 dernières (0 sans séance) ; derniere :
    //  null, ou { date, nom, xp, lignes, monte, ancienNiveau, nouveauPalier, ancienPalier } (monte : cette séance a fait
    //  passer au moins un niveau ; ancienNiveau : le niveau d'avant elle ; nouveauPalier : elle a fait passer un palier ;
    //  ancienPalier : le rang du palier d'avant elle).
    //  Titre, prochainTitre, prochainPalier sont ceux des paliers (L.palier) : prochainPalier = les XP où commence le
    //  palier suivant (null au dernier). faites : les séances qui ont rapporté des XP ; palier = L.palier(xp) ; paliers : [{ rang, titre, a (ses XP), date }] (date : le jour où il a été atteint, la première séance
    //  pour le départ ; null s'il n'est pas atteint).
    //  objectif : les séances par semaine ; pertes : [{ date, semaines, xp }] (les semaines d'arrêt au-delà de la 3e) ;
    //  aRegagner : les XP perdus que les prochaines séances rendront ; semaine : { lundi, total (les XP de la semaine en
    //  cours, pertes comprises), lignes: { cle: { n, xp } }, recup, perte: { semaines, xp } | null, arret: { jours, perte } | null }.
    // Le calcul est gardé (MEMOIRE_NIVEAU) : les mêmes séances, le même programme, les mêmes réglages et le même jour
    // redonnent le même niveau sans tout refaire (l'accueil, Progrès et Mesures le demandent à chaque dessin).
    niveau(seances, programme, reglages, aujourdhui) {
      let cle = null;
      try { cle = JSON.stringify([seances, programme, reglages, aujourdhui]); } catch (e) { cle = null; }
      const deja = cle === null ? null : MEMOIRE_NIVEAU.find((x) => x.cle === cle);
      if (deja) return copie(deja.valeur);
      const valeur = L.calculerNiveau(seances, programme, reglages, aujourdhui);
      if (cle !== null) {
        MEMOIRE_NIVEAU.unshift({ cle, valeur: copie(valeur) });
        MEMOIRE_NIVEAU.length = Math.min(MEMOIRE_NIVEAU.length, 4);
      }
      return valeur;
    },
    // Le calcul de L.niveau, sans mémoire. Les XP se rejouent dans l'ordre du calendrier : chaque séance (ses gains, et ce
    // qu'elle rend d'un arrêt), chaque semaine d'arrêt au-delà de la 3e (sa perte, L.ARRET), chaque semaine « protéines et
    // sommeil » cochée (son lundi). Le total ne passe jamais sous 0 ; le palier suit le total.
    calculerNiveau(seances, programme, reglages, aujourdhui) {
      const prog = Array.isArray(programme) ? programme : [];
      const reg = reglages || {};
      const R = L.XP_NIVEAU, A = L.ARRET;
      const liste = nettoyer(seances, aujourdhui);
      const fin = dateDe(aujourdhui) || (liste.length ? liste[liste.length - 1].date : null);
      const lundiIci = fin ? L.lundi(fin) : null;
      const debut = liste.length ? L.lundi(liste[0].date) : null;
      // Les événements datés : les séances (leurs gains face aux séances d'avant) et les semaines cochées, dans l'ordre.
      const evenements = [];      // { date, ordre (1 semaine cochée, 2 séance), xp, seance?, lignes? }
      const parNom = new Map();   // nom normalisé → les séries d'avant de cet exercice, à plat
      liste.forEach((s, k) => {
        let x = { total: 0, lignes: [] };
        try { x = xpPropre(s, liste.slice(0, k), prog, reg, parNom); } catch (e) { /* cette séance ne rapporte rien */ }
        s.exos.forEach((e) => {
          const n = L.norm(e.nom);
          if (!parNom.has(n)) parNom.set(n, []);
          const h = parNom.get(n);
          e.series.forEach((y) => h.push(y));
        });
        evenements.push({ date: s.date, ordre: 2, xp: x.total, seance: s, lignes: x.lignes.slice() });
      });
      const cochees = [];
      (Array.isArray(reg.recup) ? reg.recup : []).forEach((d) => {
        const l = dateDe(d) ? L.lundi(dateDe(d)) : null;
        if (l && debut && l >= debut && l <= lundiIci && cochees.indexOf(l) < 0) cochees.push(l);
      });
      cochees.forEach((l) => evenements.push({ date: l, ordre: 1, xp: R.recup }));
      evenements.sort((a, b) => cmp(a.date, b.date) || a.ordre - b.ordre);   // tri stable : les séances gardent leur ordre

      // Le total, pas à pas.
      let xp = 0, rang = 0, derniere = null;
      let depuis = null, base = 0, etape = 0;   // l'arrêt en cours : la dernière séance, ses XP ce jour-là, les semaines déjà comptées
      let aRegagner = 0;                        // les XP perdus dans un arrêt, que les séances rendent
      const dates = [liste.length ? liste[0].date : null];   // le jour où chaque palier a été atteint (le départ : la 1re séance)
      const totaux = [], pertes = [];
      const semaine = { lundi: lundiIci, total: 0, lignes: {}, recup: !!lundiIci && cochees.indexOf(lundiIci) >= 0, perte: null, arret: null };
      const bouger = (date, delta, lignes) => {
        const avant = xp;
        xp = Math.max(0, xp + delta);
        const r = L.palier(xp).rang;
        for (let k = rang + 1; k <= r; k++) dates[k] = date;
        rang = r;
        if (lundiIci && L.lundi(date) === lundiIci) {
          semaine.total += xp - avant;
          (lignes || []).forEach((l) => {
            const c = semaine.lignes[l.cle] || (semaine.lignes[l.cle] = { n: 0, xp: 0 });
            c.n += l.n;
            c.xp += l.xp;
          });
        }
        return xp - avant;
      };
      // Les semaines d'arrêt échues avant « jusqua » (ou ce jour-là compris) : de la 4e à la 20e, 1/17 des XP de la dernière séance.
      const arret = (jusqua, compris) => {
        if (!depuis) return;
        const semaines = Math.round(A.fin / 7), premiere = Math.round(A.sans / 7) + 1;
        for (let k = Math.max(etape + 1, premiere); k <= semaines; k++) {
          const d = L.plusJours(depuis, 7 * k);
          if (d > jusqua || (d === jusqua && !compris)) break;
          etape = k;
          const perdu = -bouger(d, -Math.round(base / (semaines - premiere + 1)));
          if (!(perdu > 0)) continue;
          aRegagner += perdu;
          pertes.push({ date: d, semaines: k, xp: perdu });
          if (lundiIci && L.lundi(d) === lundiIci) semaine.perte = { semaines: k, xp: (semaine.perte ? semaine.perte.xp : 0) + perdu };
        }
      };
      evenements.forEach((ev) => {
        if (!ev.seance) { arret(ev.date, true); bouger(ev.date, ev.xp); return; }
        arret(ev.date, false);
        const xpAvant = xp, rangAvant = rang;
        // Ce qu'un arrêt a fait perdre revient vite [124] : la séance rend autant d'XP perdus qu'elle en gagne.
        const rendu = Math.min(aRegagner, ev.xp);
        if (rendu > 0) { ev.lignes.push({ texte: 'Muscle retrouvé', xp: rendu, cle: 'memoire', n: 1 }); aRegagner -= rendu; }
        bouger(ev.date, ev.xp + rendu, ev.lignes);
        totaux.push(ev.xp + rendu);
        const ancien = L.niveauDe(xpAvant);
        derniere = { date: ev.seance.date, nom: ev.seance.nom, xp: ev.xp + rendu, lignes: ev.lignes, monte: ancien < L.niveauDe(xp), ancienNiveau: ancien,
          nouveauPalier: rangAvant < rang, ancienPalier: rangAvant };
        depuis = ev.seance.date; base = xp; etape = 0;
      });
      if (fin) arret(fin, true);
      // L'arrêt qui approche : à partir de 2 semaines sans séance, tant que rien n'est encore perdu cette semaine.
      const jours = depuis && fin ? L.joursEntre(depuis, fin) : 0;
      if (jours >= 14 && jours < A.fin && xp > 0 && !semaine.perte) semaine.arret = { jours, perte: Math.round(base / 17) };
      const niveau = L.niveauDe(xp);
      const xpNiveau = L.seuilNiveau(niveau), xpSuivant = L.seuilNiveau(niveau + 1);
      const palier = L.palier(xp);
      const recents = totaux.slice(-6);
      return {
        niveau, titre: palier.titre, xp, xpNiveau, xpSuivant, reste: xpSuivant - xp,
        part: Math.min(1, Math.max(0, (xp - xpNiveau) / Math.max(1, xpSuivant - xpNiveau))),
        prochainTitre: palier.prochain ? palier.prochain.titre : null, prochainPalier: palier.prochain ? palier.prochain.a : null,
        seances: liste.length, moyenne: recents.length ? Math.round(recents.reduce((t, v) => t + v, 0) / recents.length) : 0,
        derniere, faites: totaux.filter((v) => v > 0).length, palier, objectif: L.objectifSemaine(reg), pertes, aRegagner, semaine,
        paliers: L.PALIERS.map((p, k) => ({ rang: k, titre: p.titre, a: p.xp, date: k <= rang ? (dates[k] || null) : null })),
      };
    },

    // ── La semaine en lignes (la carte « Cette semaine » de Progrès) ──
    // Ce que la semaine a rapporté et coûté, une ligne par chose qui compte : [{ cle, titre, detail, gain (le texte de
    // droite : « +340 », « +25 chacun », « −100 »), fait, manuel?, alerte?, perte? }]. niv = L.niveau(…).
    //  seances (les séances et leurs séries, le retour, la semaine rattrapée, le muscle retrouvé), dures, progres, records,
    //  semaine (les séances de l'objectif faites), recup (la seule qu'il coche lui-même : reglages.recup), puis, seulement
    //  s'il y en a : arret (2 semaines ou plus sans séance : ce que la 4e semaine coûtera) et perte (ce que l'arrêt a coûté
    //  cette semaine).
    lignesSemaine(niv, reglages) {
      const R = L.XP_NIVEAU, reg = reglages || {};
      const s = niv && niv.semaine ? niv.semaine : { lignes: {}, recup: false, perte: null, arret: null };
      const obj = L.objectifSemaine(reg);
      const de = (cle) => s.lignes[cle] || { n: 0, xp: 0 };
      const plus = (xp) => `+${L.fmtMilliers(xp)}`;
      const nb = de('seance').n;
      const xpSeances = ['seance', 'series', 'retour', 'rattrapee', 'memoire'].reduce((t, k) => t + de(k).xp, 0);
      // Gagné : « 3 exercices · +10 chacun » et le total à droite ; pas encore : quoi faire, et « +10 chacun » à droite.
      const ligne = (cle, titre, n, chacun, fait, attente) => ({ cle, titre, detail: n > 0 ? `${fait} · +${chacun} chacun` : attente, gain: de(cle).xp > 0 ? plus(de(cle).xp) : `+${chacun} chacun`, fait: de(cle).xp > 0 });
      const complete = de('semaine').xp > 0 || nb >= obj;
      const lignes = [
        { cle: 'seances', titre: 'Séances', detail: `${nb} sur ${obj} · +${R.faite} par séance, +${R.serie} par série`, gain: xpSeances > 0 ? plus(xpSeances) : `+${R.faite} chacune`, fait: xpSeances > 0 },
        ligne('dures', 'Séries dures', de('dures').n, R.dure, L.pluriel(de('dures').n, 'exercice'), 'À la dernière série, il t\'en reste 2 ou moins.'),
        ligne('progres', 'Exercices en progrès', de('progres').n, R.progres, L.pluriel(de('progres').n, 'exercice'), '1 répétition ou 1 cran de plus que la dernière fois.'),
        ligne('records', 'Records', de('records').n, R.record, L.pluriel(de('records').n, 'record'), 'Ta meilleure série sur un exercice.'),
        { cle: 'semaine', titre: `Les ${obj} séances de la semaine`, detail: complete ? 'Fait.' : `Encore ${L.pluriel(obj - nb, 'séance')}.`, gain: plus(R.semaine), fait: complete },
        { cle: 'recup', titre: 'Protéines et sommeil', detail: `${Math.max(110, L.proteines(reg.poids) || 0)} g de protéines par jour, 7 h 30 de sommeil`, gain: plus(R.recup), fait: !!s.recup, manuel: true },
      ];
      if (s.arret) {
        lignes.push({ cle: 'arret', titre: `Dernière séance il y a ${s.arret.jours} jours`, detail: 'Plus de 3 semaines sans séance : tu perds des XP.',
          gain: `−${L.fmtMilliers(s.arret.perte)} par semaine`, fait: false, alerte: true });
      }
      if (s.perte) {
        lignes.push({ cle: 'perte', titre: `${s.perte.semaines} semaines sans séance`, detail: 'Tes prochaines séances te les rendent.',
          gain: `−${L.fmtMilliers(s.perte.xp)}`, fait: false, perte: true });
      }
      return lignes;
    },

    // ── La phrase du niveau ──
    // Une phrase courte et vraie : comment passer le niveau suivant avec de vraies séances. niv = L.niveau(…) ; sj
    // (facultatif) = la séance du jour préparée (L.preparerSeance), pour le minimum sûr d'une séance complète (+100 et +5 par
    // série prévue, sans compter progrès, records ni bonus).
    //  - ce minimum suffit : « Ta prochaine séance complète te fait passer niveau 5. » (plus de titre ici, les titres
    //    viennent des paliers) ;
    //  - sinon, avec la moyenne de ses 6 dernières séances (le minimum s'il n'en a pas) : « Une séance comme tes dernières et
    //    tu passes niveau 5. », « Encore 2 séances et tu passes niveau 5. », plus de 3 : « Encore environ 6 séances … » ;
    //    sans séance : « 2 séances complètes et tu passes niveau 2. » ;
    //  - rien pour estimer : « Ta première séance lance ton niveau. » (sans séance), sinon ''.
    // Jamais de reproche ni d'injonction : pas de « tu dois », pas de retard compté.
    conseilNiveau(niv, sj) {
      if (!niv || !(niv.niveau >= 1) || !estNombre(niv.reste)) return '';
      const vers = `niveau ${niv.niveau + 1}`;
      const exos = sj && Array.isArray(sj.exos) ? sj.exos.filter((x) => x && !x.echauffement) : [];
      const series = exos.reduce((s, x) => s + (estNombre(+x.series) && +x.series > 0 ? Math.floor(+x.series) : 0), 0);
      const mini = series > 0 ? L.XP_NIVEAU.faite + series * L.XP_NIVEAU.serie : 0;
      if (mini > 0 && mini >= niv.reste) return `Ta prochaine séance complète te fait passer ${vers}.`;
      const moy = niv.seances > 0 && niv.moyenne > 0 ? niv.moyenne : mini;
      if (!(moy > 0)) return niv.seances > 0 ? '' : 'Ta première séance lance ton niveau.';
      const n = Math.max(1, Math.ceil(niv.reste / moy));
      if (!(niv.seances > 0)) return `${n} séance${n > 1 ? 's' : ''} complète${n > 1 ? 's' : ''} et tu passes ${vers}.`;
      if (n === 1) return `Une séance comme tes dernières et tu passes ${vers}.`;
      return `Encore ${n > 3 ? 'environ ' : ''}${n} séances et tu passes ${vers}.`;
    },

    // ── Les paliers sur le corps : mesures et photos ──
    // On ne compare deux mesures qu'à au moins 84 jours d'écart (12 semaines : « Juge tes progrès sur 12 semaines
    // (charges, tour d'épaules, photos), pas sur 2 » ; les premières séances font gonfler le muscle d'eau, la vraie prise se
    // voit vers 18 séances [108, 109]). Avant, la mesure est gardée, sans écart affiché.
    JOURS_COMPARER: 84,
    TEXTE_ATTENDRE: 'Mesure gardée : tu compareras à 12 semaines.\nPourquoi : avant, l\'eau dans le muscle fausse la mesure.',
    // Ce que le corps a changé depuis une date : { epaules, bras, poids }, en différences (cm, cm, kg, arrondies au dixième).
    // Pour chacun : la référence est la dernière valeur au plus tard depuisDate (sinon la première d'après : la mesure de
    // départ prise juste après la première séance), la fin est la dernière valeur (au plus tard jusqua, s'il est donné).
    // null : pas deux mesures à au moins 84 jours d'écart (L.JOURS_COMPARER). 0 : pas de différence.
    corpsDepuis(mesures, depuisDate, jusqua) {
      const depuis = dateDe(depuisDate), fin = dateDe(jusqua);
      const liste = mesuresPropres(mesures).filter((m) => !fin || m.date <= fin);
      const out = {};
      CORPS.forEach(([k]) => {
        const pts = liste.filter((m) => estNombre(m[k]) && m[k] > 0);
        let i = 0;
        if (depuis) pts.forEach((m, j) => { if (m.date <= depuis) i = j; });
        const a = pts[i], z = pts[pts.length - 1];
        out[k] = a && z && L.joursEntre(a.date, z.date) >= L.JOURS_COMPARER ? Math.round((z[k] - a[k]) * 10) / 10 : null;
      });
      return out;
    },
    // « Épaules +1,5 cm · Bras +1 cm · Poids +1,2 kg » : seulement ce qui a changé ; '' si rien.
    texteCorps(ecarts) {
      const e = ecarts || {};
      return CORPS.filter(([k]) => estNombre(e[k]) && e[k] !== 0)
        .map(([k, nom, unite]) => `${nom} ${e[k] > 0 ? '+' : '−'}${L.fmt(Math.abs(e[k]))} ${unite}`).join(' · ');
    },
    // Chaque palier, pour l'échelle de Progrès : [{ rang, titre, a (ses XP), phrase, etat: 'fait' | 'ici' | 'avenir', reste (les XP
    // qui manquent, 0 si atteint), date, mesure (une mesure prise à ce palier), photo (le chemin de la dernière photo de ce
    // palier, ou null), ecarts (L.corpsDepuis depuis le départ, null sans mesure), texte }].
    // Les mesures d'un palier : celles prises entre la séance qui l'a fait atteindre et celle du palier suivant (le départ :
    // tout ce qui précède le palier Régulier). texte : « ton point de départ (10/11) », « pas de mesure à ce palier »,
    // L.TEXTE_ATTENDRE (moins de 84 jours depuis la première mesure : la mesure et la photo sont gardées, sans écart ; le
    // palier Régulier, vers 6 semaines, est dans ce cas), « pas encore de différence mesurable : normal, ça se voit surtout
    // plus tard », ou L.texteCorps. Jamais de baisse en reproche.
    paliersCorps(niv, mesures) {
      const P = niv && Array.isArray(niv.paliers) ? niv.paliers : L.PALIERS.map((p, rang) => ({ rang, titre: p.titre, a: p.xp, date: null }));
      const ici = niv && niv.palier ? niv.palier.rang : 0;
      const xp = niv && estNombre(niv.xp) ? niv.xp : 0;
      const liste = mesuresPropres(mesures);
      const debut = P[0] && P[0].date;
      const fenetre = (k) => {
        const de = k === 0 ? null : P[k].date, a = k < ici ? P[k + 1].date : null;
        return liste.filter((m) => (!de || m.date >= de) && (!a || m.date < a));
      };
      return P.map((p, k) => {
        const o = { rang: k, titre: p.titre, a: p.a, phrase: (L.PALIERS[k] || {}).phrase || '', etat: k < ici ? 'fait' : k === ici ? 'ici' : 'avenir',
          reste: Math.max(0, p.a - xp), date: k <= ici ? p.date : null, mesure: false, photo: null, ecarts: null, texte: '' };
        if (k > ici) return o;
        const dedans = fenetre(k);
        const avecValeur = dedans.filter(aUneValeur);
        const photos = dedans.filter(aUnePhoto);
        o.mesure = avecValeur.length > 0;
        o.photo = photos.length ? photos[photos.length - 1].photo.trim() : null;
        if (k === 0) {
          o.texte = o.mesure ? `ton point de départ (${L.dateCourte(avecValeur[0].date)})` : 'pas de mesure à ce palier';
          return o;
        }
        if (!o.mesure) { o.texte = 'pas de mesure à ce palier'; return o; }
        // Le départ et ce palier seulement : une mesure d'un palier entre les deux ne compte pas pour celui-ci.
        const utiles = fenetre(0).concat(dedans);
        const premiere = utiles.find(aUneValeur), derniere = avecValeur[avecValeur.length - 1];
        if (!premiere || L.joursEntre(premiere.date, derniere.date) < L.JOURS_COMPARER) { o.texte = L.TEXTE_ATTENDRE; return o; }
        o.ecarts = L.corpsDepuis(utiles, debut, derniere.date);
        o.texte = L.texteCorps(o.ecarts) || 'pas encore de différence mesurable : normal, ça se voit surtout plus tard';
        return o;
      });
    },
    // Le palier d'aujourd'hui s'il lui manque la mesure ou la photo : null (tout est fait), ou { rang, titre, phrase, date,
    // mesure, photo } (mesure / photo : déjà prise à ce palier, depuis la séance qui l'a fait atteindre ; le départ : depuis
    // toujours). L'écran Mesures dit « Palier Régulier atteint : mesure-toi » (une fois par palier) ; sans photo possible sur
    // l'appareil, la mesure suffit (c'est l'écran qui le sait).
    palierAMesurer(niv, mesures) {
      const pa = niv && niv.palier ? niv.palier : L.palier(0);
      const info = niv && Array.isArray(niv.paliers) ? niv.paliers[pa.rang] : null;
      const date = pa.rang > 0 && info ? info.date : null;
      const depuis = mesuresPropres(mesures).filter((m) => !date || m.date >= date);
      const mesure = depuis.some(aUneValeur), photo = depuis.some(aUnePhoto);
      if (mesure && photo) return null;
      return { rang: pa.rang, titre: pa.titre, phrase: pa.phrase, date, mesure, photo };
    },
    // Les photos du départ et de la dernière, pour les voir côte à côte : { depart: { date, photo } | null, derniere: … | null }
    // (derniere : null s'il n'y a qu'une photo).
    photosCorps(mesures) {
      const ph = mesuresPropres(mesures).filter(aUnePhoto).map((m) => ({ date: m.date, photo: m.photo.trim() }));
      return { depart: ph[0] || null, derniere: ph.length > 1 ? ph[ph.length - 1] : null };
    },

  });
}
