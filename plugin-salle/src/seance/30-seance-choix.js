// L : la séance du jour. Les étages et l'ordre des exercices (bras et gainage en dernier), le choix de la séance du jour,
// le bilan « Avant de commencer ». Tout est pur : des entrées, une sortie, jamais de note lue ou écrite ici.
// Les chiffres et les conseils viennent de « La bonne séance » (~/Desktop/CLAUDE/Salle-travail/recherche/) ; ce qui n'est qu'un avis est dit « (avis) ».

// ── Les étages et l'ordre des exercices ──
Object.assign(L, {
  nomEtage(e) {
    return e === 0 ? 'RDC' : e > 0 ? `Étage ${e}` : '';
  },
  // Le repère au changement d'étage : « Monte à l'étage 2 : haltères et bancs ». Même étage ou étage inconnu : ''.
  // etages (facultatif) : ceux des réglages, pour dire ce qu'on y trouve (L.libelleEtage).
  repereEtage(avant, apres, etages, nom) {
    if (!(avant >= 0) || !(apres >= 0) || avant === apres) return '';
    const ou = apres === 0 ? 'au RDC' : `à l'étage ${apres}`;
    const quoi = L.libelleEtage(apres, etages, nom) ? ` : ${L.libelleEtage(apres, etages, nom)}` : '';
    return `${apres > avant ? 'Monte' : 'Descends'} ${ou}${quoi}`;
  },
  // Où commencer (2.10.0, demande : dire à quel étage commencer) : l'étage du premier exercice de la séance,
  // échauffement compris : « Commence à l'étage 1 : machines et poulies ». Étage inconnu : ''.
  departEtage(exos, etages) {
    const x = (Array.isArray(exos) ? exos : []).find((e) => e && !e.saute);
    if (!x || !L.estEtage(x.etage)) return '';
    const ou = x.etage === 0 ? 'au RDC' : `à l'étage ${x.etage}`;
    const quoi = L.libelleEtage(x.etage, etages, x.echauffement ? '' : x.nom);
    return `Commence ${ou}${quoi ? ` : ${quoi}` : ''}`;
  },
  // Gros exercices (plusieurs articulations, les plus lourds) : à faire avant les petits du même étage.
  gros(nom) {
    return /^(developpe|tirage|presse|rowing|traction|squat|souleve|hack)/.test(L.norm(nom));
  },
  // Un exercice des bras (curl, triceps, barre au front, biceps). La famille d'abord : « Leg curl assis » n'est pas un bras.
  estBras(nom) {
    return L.famille(nom) !== 'jambes' && /\bcurl\b|triceps|barre au front|biceps/.test(L.norm(nom));
  },
  // La fin de séance (bras et gainage), toujours après le reste, quel que soit l'étage (« La bonne séance », changement 4).
  estFin(nom) {
    return L.estBras(nom) || L.famille(nom) === 'gainage';
  },
  // L'ordre de la séance : l'ordre écrit du programme, sans allers-retours entre étages. Règles (2.36.0) :
  //  O1 l'ordre du programme est l'ordre de passage (2.38.69 : il alterne les muscles). Ce qui compte le plus pour
  //     l'objectif n'est plus dit par la place : c'est la marque « priorité » du programme (L.adapter, D4).
  //  O2 un exercice des bras attend la fin si le gros exercice de la même famille vient juste après lui (un curl juste avant
  //     un tirage, une extension triceps juste avant un développé) : ce gros exercice se ferait avec des bras fatigués.
  //     2.38.71 (demande : les triceps à l'étage 1, avec les tirages) : seulement quand ils s'enchaînent. Les études qui
  //     mesurent une perte enchaînent les deux exercices (Soares 2016 : 8 répétitions au développé au lieu de 10 ; Olsson
  //     2026 ; Vilaça-Alves 2014 pour le curl avant un tirage) ; avec un exercice entre les deux, sur 12 semaines, le
  //     développé progresse dans les deux ordres (Simão 2010, Spineti 2010). Avant : dès qu'un gros exercice venait après.
  //     Le gainage attend toujours la fin.
  //  O3 sans aucun étage indiqué : l'ordre du programme, puis ce qui attend la fin (les bras, puis le gainage).
  //  O4 un exercice sans étage suit l'exercice du programme juste avant lui (ou juste après s'il est en tête).
  //  O5 on commence à l'étage qui a du cardio (pour l'échauffement), le premier dans l'ordre du programme ; sinon à
  //     l'étage du premier exercice. Puis les autres étages, du plus proche au plus loin.
  //  O6 dans un étage : l'ordre du programme, tel qu'il est écrit (2.38.69, demande : alterner les muscles, et après des
  //     élévations latérales faire les jambes, pas les bras). Avant, les exercices d'une même salle (les machines, les
  //     haltères) étaient regroupés : le leg curl ne pouvait pas passer après les haltères. C'est maintenant le programme
  //     qui écrit ensemble ce qui doit le rester (« Ordre des exercices », dossier recherche). L'ordre écrit vaut dans
  //     un même étage : avec les machines et les haltères à deux étages, un étage se finit avant l'autre (O5), et
  //     l'alternance n'est tenue que si le programme écrit « étage N » sur ses lignes.
  //  O7 la fin commence à l'étage où finit le reste, puis du plus proche au plus loin ; dans un étage, les bras puis le gainage.
  //  O8 l'échauffement en premier, sur le cardio de l'étage de départ (ou le cardio le plus proche).
  // Avant la 2.36.0 : dans un étage, les gros exercices passaient avant les petits et les bras toujours en dernier ; les
  // élévations latérales, première priorité de l'objectif, se retrouvaient après les jambes.
  // Rend { exos, etageEchauffement, changements } (changements = changements d'étage le long de la liste, échauffement compris).
  ordonnerParEtage(exos, cardio) {
    const liste = Array.isArray(exos) ? exos.slice() : [];
    const ech = liste.filter((x) => x && x.echauffement), autres = liste.filter((x) => x && !x.echauffement);
    const etages = autres.map((x) => (L.estEtage(x.etage) ? x.etage : null));
    const sansEtage = etages.every((e) => e == null);
    for (let i = 0; i < etages.length; i++) if (etages[i] == null && i > 0) etages[i] = etages[i - 1];
    for (let i = etages.length - 1; i >= 0; i--) if (etages[i] == null) etages[i] = etages[i + 1];
    const idx = autres.map((x, i) => i);
    const gainage = (i) => L.famille(autres[i].nom) === 'gainage';
    const ordreDe = (ids) => { const o = []; ids.forEach((i) => { if (o.indexOf(etages[i]) < 0) o.push(etages[i]); }); return o; };
    // Les étages d'une partie, en partant de d, du plus proche au plus loin (à égalité, l'ordre du programme).
    const depuis = (o, d) => o.slice().sort((a, b) => Math.abs(a - d) - Math.abs(b - d) || o.indexOf(a) - o.indexOf(b));
    // Où s'échauffer : les étages donnés (là où est le cardio), sinon l'étage le plus bas de la séance.
    const c = sansEtage ? [] : Array.isArray(cardio) && cardio.length ? cardio : [Math.min(...etages.filter((e) => e != null))];
    // L'ordre quand ces exercices-là attendent la fin (O3 à O7) → { res (les indices, dans l'ordre), d (l'étage de départ) }.
    const ranger = (attend) => {
      const principal = idx.filter((i) => !attend[i]), finale = idx.filter((i) => attend[i]);
      const enFin = (ids) => [...ids.filter((i) => !gainage(i)), ...ids.filter(gainage)];
      if (sansEtage) return { res: principal.concat(enFin(finale)), d: null };
      const oP = ordreDe(principal), oF = ordreDe(finale);
      const base = oP.length ? oP : oF;
      const dep = base.find((e) => c.indexOf(e) >= 0);
      const d = dep != null ? dep : base[0];
      const res = [];
      for (const e of depuis(oP, d)) res.push(...principal.filter((i) => etages[i] === e));
      // La fin : d'abord les exercices qui attendaient, étage par étage en partant de celui où le reste finit ; puis le
      // gainage, en tout dernier (2.37.0 : même quand il est à un autre étage qu'eux).
      const dernier = () => (res.length ? etages[res[res.length - 1]] : d);
      [finale.filter((i) => !gainage(i)), finale.filter(gainage)].forEach((part) => {
        for (const e of depuis(ordreDe(part), dernier())) res.push(...part.filter((i) => etages[i] === e));
      });
      return { res, d };
    };
    // O2 : le gainage attend la fin ; un exercice des bras aussi, tant que le gros exercice de sa famille vient juste après lui.
    const attend = idx.map(gainage);
    let rang = ranger(attend);
    for (let tour = 0; tour < idx.length; tour++) {
      const p = rang.res.findIndex((i, k) => {
        const j = rang.res[k + 1];
        return !attend[i] && L.estBras(autres[i].nom) && j != null && L.gros(autres[j].nom) && L.famille(autres[j].nom) === L.famille(autres[i].nom);
      });
      if (p < 0) break;
      attend[rang.res[p]] = true;
      rang = ranger(attend);
    }
    const res = rang.res;
    if (sansEtage) return { exos: ech.concat(res.map((i) => autres[i])), etageEchauffement: null, changements: 0 };
    let eEch = null;
    if (c.length) eEch = c.slice().sort((a, b) => Math.abs(a - rang.d) - Math.abs(b - rang.d) || a - b)[0];
    let changements = eEch != null && res.length && eEch !== etages[res[0]] ? 1 : 0;
    for (let k = 1; k < res.length; k++) if (etages[res[k]] !== etages[res[k - 1]]) changements++;
    return { exos: ech.concat(res.map((i) => autres[i])), etageEchauffement: eEch, changements };
  },
  // La séance du jour remise dans cet ordre (le reste de sj ne change pas). null → null.
  ordonnerSeance(sj, cardio) {
    if (!sj) return sj;
    const o = L.ordonnerParEtage(sj.exos, cardio);
    return Object.assign({}, sj, { exos: o.exos, etageEchauffement: o.etageEchauffement });
  },
  // Le réglage écrit sur la ligne de l'exercice dans le programme (« banc 30° (2e ou 3e cran) » → « banc à 30° … »), ou ''.
  reglageProgramme(exo) {
    return exo && exo.reglage ? String(exo.reglage).replace(/^(banc|dossier|siège|siege)\s+(?=\d)/i, '$1 à ') : '';
  },
  // Ses réglages de l'exercice, dans l'ordre : celui écrit dans le programme (« banc à 30° »), puis le sien, noté dans l'aide
  // (exo.monReglage, « siège 4 » → « siège à 4 ») s'il dit autre chose. [] s'il n'y en a pas, ou à l'échauffement.
  reglages(exo) {
    if (!exo || exo.echauffement) return [];
    const a = L.reglageProgramme(exo), b = L.reglageProgramme({ reglage: exo.monReglage });
    return [a, b && b.toLowerCase() !== a.toLowerCase() ? b : ''].filter(Boolean);
  },
  // « Réglage : … » en une ligne, pour annoncer un exercice (la ligne « Ensuite : … » du repos, l'écran du programme).
  // Le champ du programme (« banc 30° ») d'abord, sinon la première phrase de la ligne « **Réglage :** » de la fiche du
  // guide ; sinon ''. Ses réglages d'abord (L.reglages) ; une fiche sans appareil dit « Position : … ».
  texteReglage(exo, guide) {
    if (!exo || exo.echauffement) return '';
    const siens = L.reglages(exo);
    if (siens.length) return 'Réglage : ' + siens.join(' · ');
    const fiche = guide && guide[L.norm(exo.nom)];
    const l = fiche && Array.isArray(fiche.lignes) ? fiche.lignes.find((x) => /\*\*\s*(?:Réglage|Position)\s*:?\s*\*\*/i.test(x)) : null;
    if (!l) return '';
    const titre = /\*\*\s*Position/i.test(l) ? 'Position' : 'Réglage';   // sans appareil à régler, la fiche dit « Position »
    const t = l.replace(/^.*?\*\*\s*(?:Réglage|Position)\s*:?\s*\*\*\s*:?\s*/i, '').trim();
    const phrase = t.split(/[.!?](?:\s+|$)/)[0].trim();
    return phrase ? titre + ' : ' + phrase : '';
  },
});

// ── Le choix de la séance du jour ──
Object.assign(L, {
  // L'alternance : la séance qui suit la dernière séance DU PROGRAMME faite (une séance libre ne compte pas).
  prochaine(programme, seances) {
    if (!programme.length) return -1;
    const der = L.dernierDuProgramme(programme, seances);
    if (!der) return 0;
    return (programme.findIndex((s) => L.norm(s.nom) === L.norm(der.nom)) + 1) % programme.length;
  },
  dansProgramme(programme, seance) {
    return !!seance && programme.some((s) => L.norm(s.nom) === L.norm(seance.nom));
  },
  dernierDuProgramme(programme, seances) {
    for (let k = seances.length - 1; k >= 0; k--) if (L.dansProgramme(programme, seances[k])) return seances[k];
    return null;
  },
  // La famille d'un exercice, d'après son nom. L'ordre compte : « leg curl » est des jambes, pas un curl.
  famille(nom) {
    const n = L.norm(nom);
    if (/gainage|planche|crunch|abdo|releve de (jambes|genoux)|roue/.test(n)) return 'gainage';
    if (/presse|squat|\bleg\b|fente|mollet|souleve de terre|hip thrust|ischio|adducteur|abducteur|cuisse|quadriceps|fessier/.test(n)) return 'jambes';
    if (/tirage|traction|rowing|curl|face pull|pull[ -]?over|oiseau|shrug|haussement|pull down|tirer/.test(n)) return 'tirer';
    if (/developpe|pompe|dips|triceps|elevation|ecarte|butterfly|pec deck|push|pousser|barre au front/.test(n)) return 'pousser';
    return 'autre';
  },
  // La séance du jour : { i, raison }. Toujours l'alternance, celle qui suit la dernière séance du programme (une séance
  // libre ne compte pas). Pas de « celle qui recoupe le moins » après une séance libre ou déséquilibrée (aucune
  // étude pour ses seuils) : à séries égales, la fréquence ne change rien [11, 45] ; A/B tout le corps 3 fois par semaine
  // est le plus pratique [11, 46].
  choisirSeance(programme, seances, aujourdhui) {
    if (!programme.length) return { i: -1, raison: '' };
    const derProg = L.dernierDuProgramme(programme, seances);
    const raison = programme.length === 1 ? 'Ton programme a une seule séance.'
      : !seances.length ? 'Première séance : on suit le programme dans l\'ordre.'
        : !derProg ? 'Première séance du programme : on commence par le début.'
          : `Elle suit « ${derProg.nom} », faite ${L.quand(derProg.date, aujourdhui)}.`;
    return { i: L.prochaine(programme, seances), raison };
  },
  // Reprise après plus de 8 semaines sans salle : les 2 séances qui suivent un trou de plus de 56 jours (entre deux séances,
  // ou entre la dernière et aujourd'hui) → { numero: 1 ou 2 }, sinon null. « La bonne séance », Courbatures : « Plus de 8
  // semaines sans salle : refais 2 à 4 séances à 2 séries » (avis) ; la protection d'une séance légère est partielle à
  // 9 semaines et a disparu à 12 [110, 111]. Sans aucune séance : null (la mise en route s'en charge).
  repriseLongue(seances, aujourdhui) {
    if (!L.deISO(aujourdhui)) return null;
    const dates = (seances || []).map((s) => s && s.date).filter((d) => L.deISO(d) && d <= aujourdhui).sort();
    const D = dates.concat([aujourdhui]);
    for (let j = D.length - 1; j >= 1; j--) {
      if (L.joursEntre(D[j - 1], D[j]) > 56) { const apres = D.length - 1 - j; return apres < 2 ? { numero: apres + 1 } : null; }
    }
    return null;
  },
  // La première séance après une semaine sans salle marquée « malade » (Réglages → Salle, « Cette semaine (malade) » :
  // reglages.malade, des lundis) : vrai si aucune séance n'a été faite depuis le lundi de cette semaine. « La bonne séance »,
  // Décharge et pauses : « Après une maladie : une séance à moitié des séries, puis la normale si tu n'as rien eu pendant
  // l'effort ni dans les 24 h » (avis, à partir du CIO [126]).
  apresMaladie(seances, aujourdhui, reglages) {
    if (!L.deISO(aujourdhui)) return false;
    const l = L.lundi(aujourdhui);
    const malades = (reglages && Array.isArray(reglages.malade) ? reglages.malade : []).filter((x) => L.deISO(x)).map((x) => L.lundi(x)).filter((m) => m <= l).sort();
    if (!malades.length) return false;
    const m = malades[malades.length - 1];
    return !(seances || []).some((s) => s && L.deISO(s.date) && s.date >= m && s.date <= aujourdhui);
  },
  // Tout ce que montre la carte de l'accueil et ce que lance « Commencer » : la séance, la raison, la dose.
  // bilan = le bilan d'avant la séance (L.appliquerBilan), facultatif. La semaine légère et la durée viennent des réglages
  // (3e argument). Les séries gagnées viennent de L.progressionSeries. L'ordre, les superséries et la durée viennent ensuite,
  // de L.preparerSeance.
  seanceDuJour(programme, seances, reglages, aujourdhui, iForce, bilan, mesures) {
    let choix = L.choisirSeance(programme, seances, aujourdhui);
    const b = bilan || null;
    // Zone douloureuse (vive) ou très courbaturée : on prend la séance du programme qui la charge le moins.
    if (b && (iForce == null || !programme[iForce]) && choix.i >= 0 && programme.length > 1) {
      const z = L.zonesAMenager(b);
      if (z.length) {
        const ch = programme.map((s) => L.chargeZones(s.exos, z));
        const mini = Math.min(...ch);
        if (ch[choix.i] > mini + 0.05) {
          let k = choix.i;
          for (let d = 1; d < programme.length; d++) { const x = (choix.i + d) % programme.length; if (ch[x] <= mini + 0.001) { k = x; break; } }
          const pz = L.pourquoiZones(b), t = `${pz} : « ${programme[k].nom} » les charge le moins.`;
          choix = { i: k, raison: t.length <= L.LIGNE_MAX ? t : `« ${programme[k].nom} » charge le moins ces zones.\nPourquoi : ${pz}.` };
        }
      }
    }
    const i = iForce != null && programme[iForce] ? iForce : choix.i;
    if (i < 0) return null;
    // Les séances déjà faites, séance libre comprise (2.38.4, demande : une séance libre est une séance comme les autres) :
    // elles comptent pour les 4 séances de mise en route.
    const nb = Array.isArray(seances) ? seances.length : 0;
    const reprise = L.repriseLongue(seances, aujourdhui);
    const cas = { reprise: !!reprise, malade: L.apresMaladie(seances, aujourdhui, reglages) };
    const a = L.adapter(programme[i].exos, reglages, nb, L.semaineLegere(seances, aujourdhui, reglages), cas);
    const lignes = [];
    if (a.decouverte) lignes.push(`Séance ${nb + 1} sur 4 de mise en route : 2 séries par exercice.`);
    else if (a.reprise) lignes.push(`Reprise après plus de 8 semaines sans salle : séance ${reprise.numero} sur 2 à 2 séries par exercice.`);
    else if (a.malade) lignes.push('Après ta semaine malade : moitié des séries, mêmes charges.\nEt après : la suivante sera normale si tu n\'as rien eu pendant l\'effort ni dans les 24 h.');
    if (a.partiels) lignes.push('2 séances par semaine : 1 série de plus au dos, aux épaules et aux pecs.');
    // Les séries gagnées par un exercice bloqué (L.progressionSeries, avis) ; la première fois, une ligne le dit.
    // 2.31.0 : et celles gagnées par un tour qui ne monte pas (L.seriesParMesures, avis), quand les mesures sont données.
    const gagnent = L.appliquerProgression(a, Object.assign({}, L.seriesParMesures(programme, seances, mesures, aujourdhui), L.progressionSeries(programme, seances, reglages, aujourdhui)), seances, i, programme[i] ? programme[i].nom : null);
    if (gagnent.length) lignes.push(L.avecNoms(gagnent, (n) => `${n} : 1 série de plus à partir d'aujourd'hui.`));
    const sj = Object.assign({ i, choisie: choix.i, raison: choix.raison, nom: programme[i].nom, numero: nb + 1, lignes, changements: [], alertes: [] }, a);
    if (b) L.appliquerBilan(sj, b);
    return sj;
  },
  // Séance trop vidée par le bilan : une autre séance du programme qui garde au moins 3 exercices, sinon -1 (le repos).
  autreSeance(programme, seances, reglages, aujourdhui, bilan, sauf) {
    for (let d = 1; d < programme.length; d++) {
      const k = (sauf + d) % programme.length;
      const sj = L.seanceDuJour(programme, seances, reglages, aujourdhui, k, bilan);
      if (sj && !sj.tropVide) return k;
    }
    return -1;
  },
});

// ── Le bilan « Avant de commencer » ──
Object.assign(L, {
  // Un bilan (les 3 questions que « La bonne séance » justifie) :
  //   { date, douleur: null | { zone, type: 'vive' | 'tire' }, courb: { niveau: 'aucune' | 'fortes', zones: [] },
  //     sommeil: 'court' (nuit de moins de 6 h ; absent = 6 h ou plus) }.
  // Une ancienne note peut dire courb.niveau 'legeres' : lue, sans effet (courbatures légères : séance normale).
  // Les exercices qu'une zone touche, d'après le nom et la famille (L.famille) :
  //   coude, bras → les tirages, tractions, rowing, curls, face pull (famille « tirer ») et l'extension triceps ;
  //   épaule(s) → développés, élévations, face pull, tirages verticaux et tractions ;
  //   poignet → curls, développés aux haltères, extension triceps ;
  //   bas du dos → rowing, tirage horizontal, gainage, presse ; genou → presse, squat, fentes, leg curl, leg extension ;
  //   pectoraux → famille « pousser » ; dos → famille « tirer » ; jambes → famille « jambes » ; autre → aucun (on ne sait pas).
  zoneTouche(zone, nom) {
    const n = L.norm(nom), f = L.famille(nom);
    switch (zone) {
      case 'coude': case 'bras': return f === 'tirer' || /triceps/.test(n);
      case 'epaule': case 'epaules': return /developpe|elevation|face pull|tirage vertical|traction/.test(n);
      case 'poignet': return (f === 'tirer' && /curl/.test(n)) || /developpe.*halteres|triceps/.test(n);
      case 'bas du dos': return /rowing|tirage horizontal|gainage|planche|presse|hip thrust|crunch/.test(n);
      case 'genou': return /presse|squat|fente|leg curl|leg extension/.test(n);
      case 'pectoraux': return f === 'pousser';
      case 'dos': return f === 'tirer';
      case 'jambes': return f === 'jambes';
      default: return false;
    }
  },
  // Les zones à ménager fortement : douleur vive, courbatures fortes.
  zonesAMenager(b) {
    const z = [];
    if (b && b.douleur && b.douleur.type === 'vive' && b.douleur.zone !== 'autre') z.push(b.douleur.zone);
    if (b && b.courb && b.courb.niveau === 'fortes') b.courb.zones.forEach((x) => z.push(x));
    return z;
  },
  // La part des séries d'une séance du programme qui charge ces zones (0 à 1).
  chargeZones(exos, zones) {
    let t = 0, tot = 0;
    exos.forEach((e) => { tot += e.series || 0; if (zones.some((z) => L.zoneTouche(z, e.nom))) t += e.series || 0; });
    return tot ? t / tot : 0;
  },
  pourquoiZones(b) {
    const p = [];
    if (b.douleur && b.douleur.type === 'vive' && b.douleur.zone !== 'autre') p.push('Douleur vive ' + ZONES_DOULEUR[b.douleur.zone][2]);
    if (b.courb && b.courb.niveau === 'fortes' && b.courb.zones.length) p.push('Courbatures fortes ' + L.ouCourb(b.courb.zones));
    return p.join(', ');
  },
  ouCourb(zones) {
    const t = zones.map((z) => (ZONES_COURB[z] || [z, z, z])[1]);
    return t.length > 1 ? t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1] : t[0] || '';
  },
  // Ce que le bilan change à la séance du jour (sj, déjà adaptée par L.adapter). Rien n'est caché : chaque changement a sa phrase.
  // Les règles viennent de « La bonne séance » (Courbatures, Récupération et sommeil) :
  //  1. Douleur vive : les exercices de la zone sont retirés, et leurs remplaçants qui la chargent aussi. Renvoi médecin ou kiné
  //     (« Douleur dans une articulation, ou qui pique pendant un mouvement : arrête l'exercice ; médecin ou kiné »).
  //  2. Courbatures fortes : les exercices de la zone à 2 séries, conseil un tiers plus léger (exo.courb, L.conseilCourbature),
  //     les « option » de la zone retirés (« on est moins fort : alléger 1 à 2 jours » [113]). Alerte « urine foncée… » une
  //     seule fois [118]. Courbatures légères : séance normale (refaire une séance n'aggrave pas les dégâts [112]).
  //  3. Douleur qui tire : séance normale. Pas d'approche très légère en plus (aucune étude ; la note ne fait arrêter
  //     que pour une douleur dans une articulation ou qui pique pendant un mouvement, la règle 1). Aucun record n'est
  //     annoncé d'avance (2.14.2).
  //  4. Nuit de moins de 6 h (−7,56 % de performance [120]) : mêmes charges, sans chercher de record (exo.sansMontee),
  //     mais toutes les séries.
  //  5. Jamais moins d'une série. Moins de 3 exercices : sj.tropVide (l'écran propose l'autre séance ou le repos).
  // 2.5.1 : le renvoi au médecin, sa propre ligne (une alerte de santé reste visible, jamais repliée).
  MEDECIN_SI_CA_DURE: 'Si ça dure plus d\'une semaine ou empire : médecin ou kiné.',
  appliquerBilan(sj, b) {
    const ch = sj.changements, al = sj.alertes;
    let exos = sj.exos;
    const d = b.douleur;
    if (d && d.type === 'vive') {
      if (d.zone === 'autre' || !ZONES_DOULEUR[d.zone]) {
        al.push('Douleur vive : évite tout geste qui la réveille.', L.MEDECIN_SI_CA_DURE);
      } else {
        const out = exos.filter((e) => L.zoneTouche(d.zone, e.nom));
        exos = exos.filter((e) => !L.zoneTouche(d.zone, e.nom));
        exos.forEach((e) => {
          if (!Array.isArray(e.alternatives)) return;
          e.alternatives = e.alternatives.filter((x) => !L.zoneTouche(d.zone, x.nom));
          if (!e.alternatives.length) delete e.alternatives;
        });
        if (out.length) ch.push(L.avecNoms(out, (n) => `${n} : retiré${out.length > 1 ? 's' : ''}, douleur vive ${ZONES_DOULEUR[d.zone][2]}.`));
        al.push(`Pas d'exercice qui charge ${ZONES_DOULEUR[d.zone][1]} aujourd'hui.`, L.MEDECIN_SI_CA_DURE);
      }
    }
    const c = b.courb || { niveau: 'aucune', zones: [] };
    if (c.niveau === 'fortes' && c.zones.length) {
      const touche = (e) => c.zones.some((z) => L.zoneTouche(z, e.nom));
      const opts = exos.filter((e) => e.option && touche(e));
      exos = exos.filter((e) => !(e.option && touche(e)));
      const t = exos.filter(touche);
      t.forEach((e) => { e.series = Math.min(e.series, 2); e.courb = true; });
      // 2.40.9 (vu par les simulations : courbatures à 4 ou 5 endroits, plus de 2 lignes) : trop long, les endroits passent dans
      // « Pourquoi » (replié).
      if (t.length) {
        const ou = L.ouCourb(c.zones), ligne = L.avecNoms(t, (n) => `${n} : 2 séries, léger : courbatures ${ou}.`);
        ch.push(ligne.split('\n').every((l) => l.length <= L.LIGNE_MAX) ? ligne : `${L.avecNoms(t, (n) => `${n} : 2 séries, léger (courbatures fortes).`)}\nPourquoi : courbatures ${ou}.`);
      }
      if (opts.length) ch.push(L.avecNoms(opts, (n) => `${n} : retiré${opts.length > 1 ? 's' : ''} (en option).`));
      al.push('Urine foncée, ou muscle gonflé et dur : médecin le jour même.');
    }
    if (b.sommeil === 'court') {
      exos.forEach((e) => { e.sansMontee = true; });
      ch.push('Nuit de moins de 6 h : mêmes charges que la dernière fois, sans chercher de record.');
    }
    exos.forEach((e) => { e.series = Math.max(1, e.series); });
    sj.exos = exos;
    sj.tropVide = exos.length < 3;
    return sj;
  },
  // Par défaut : rien à signaler (pas de douleur, pas de courbatures fortes, nuit de 6 h ou plus). Si la dernière ligne du
  // carnet Forme date de 3 jours ou moins : sa douleur est proposée, et ses courbatures fortes si elles datent d'hier
  // (« alléger 1 à 2 jours » [113] ; il les confirme ou les retire d'un toucher).
  bilanParDefaut(carnet, aujourdhui) {
    const b = { date: aujourdhui, douleur: null, courb: { niveau: 'aucune', zones: [] }, depuis: null };
    const avant = (carnet || []).filter((x) => x.date < aujourdhui);
    const der = avant[avant.length - 1];
    const j = der ? L.joursEntre(der.date, aujourdhui) : 99;
    if (!der || j > 3) return b;
    if (der.courb && der.courb.niveau === 'fortes' && der.courb.zones.length && j < 2) b.courb = { niveau: 'fortes', zones: der.courb.zones.slice() };
    if (der.douleur) b.douleur = { zone: der.douleur.zone, type: der.douleur.type };
    if (b.douleur || b.courb.niveau !== 'aucune') b.depuis = der.date;
    return b;
  },
  // Le bilan déjà rempli aujourd'hui (la dernière ligne du jour du carnet), ou null.
  bilanDuJour(carnet, aujourdhui) {
    const l = (carnet || []).filter((x) => x.date === aujourdhui);
    return l.length ? l[l.length - 1] : null;
  },
  // Rien qui change la séance : pas de douleur, pas de courbatures fortes, nuit de 6 h ou plus.
  toutVaBien(b) {
    return !b.douleur && !(b.courb && b.courb.niveau === 'fortes') && b.sommeil !== 'court';
  },
  // Ce que le bilan dit en clair (écran « Ta séance d'aujourd'hui »), une partie par question.
  resumeBilan(b) {
    const p = [];
    p.push(b.douleur ? `douleur ${b.douleur.type === 'tire' ? 'qui tire' : 'vive'} ${ZONES_DOULEUR[b.douleur.zone][2] || ''}`.trim() : 'pas de douleur');
    p.push(b.courb && b.courb.niveau === 'fortes' ? `courbatures fortes ${L.ouCourb(b.courb.zones)}` : 'pas de courbatures fortes');
    p.push(b.sommeil === 'court' ? 'nuit de moins de 6 h' : 'nuit de 6 h ou plus');
    if (b.temps > 0) p.push('peu de temps');   // 2.38.91
    const s = p.join(', ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  },
});
