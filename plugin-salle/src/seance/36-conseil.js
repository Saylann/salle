// L : le conseil de charge, l'effort, la cible de la série en cours. Pur.

// ── Le conseil de charge, l'effort, la cible de la série en cours ──
Object.assign(L, {
  // Double progression : d'abord plus de répétitions, puis plus lourd [31, 62, 63].
  // avant = la fois d'avant (L.avantDerniere, avec la fois d'avant encore dans avant.avant), pour « bloqué ». Ordre :
  // courbatures fortes, semaine légère, sans montée (nuit courte, retour de maladie), au temps, première fois, puis la
  // progression. Pas de « famille fatiguée » (aucune étude : seules les courbatures fortes allègent [113]).
  conseil(exo, der, avant) {
    const auTemps = exo.unite === 's';
    if (exo.courb && !auTemps) return L.conseilCourbature(exo, L.conseil(Object.assign({}, exo, { courb: false, sansMontee: false }), der), der);
    if (exo.legere && der && !auTemps) return L.conseilLegere(exo, der);
    if (exo.sansMontee && !auTemps) return L.conseilSansMontee(exo, L.conseil(Object.assign({}, exo, { sansMontee: false }), der, avant), der);
    if (auTemps) return L.conseilAuTemps(exo, der);
    if (!der) return L.conseilPremiereFois(exo);
    return L.conseilProgression(exo, der, avant);
  },
  // Semaine légère : la charge et les répétitions de la dernière fois.
  conseilLegere(exo, der) {
    const ch = L.chargeMax(der.series);
    const v = (der.series.find((x) => (x.c || 0) === ch) || {}).r || exo.min;
    // 2.37.0 : la charge au cran de l'appareil ; les répétitions d'une fourchette allongée restent permises (plafond).
    return { charge: ch > 0 ? L.cranDessous(exo, ch) : ch, valeur: v, plafond: Math.max(exo.max, v), legere: true, texte: 'Semaine légère : même charge et mêmes répétitions que la dernière fois. Le corps récupère.' };
  },
  // Au temps (gainage) : 5 s de plus, jusqu'au haut de la fourchette ; tenu partout : une version plus dure.
  conseilAuTemps(exo, der) {
    if (!der) return { charge: null, valeur: exo.min, texte: `Première fois : tiens ${exo.min} s, le corps bien droit.` };
    const temps = der.series.map((x) => x.s || 0);
    const tous = temps.length >= Math.min(2, exo.series) && temps.every((t) => t >= exo.max);
    return {
      charge: null, valeur: Math.min(exo.max, Math.max(exo.min, (temps[0] || exo.min) + (tous ? 0 : 5))),
      texte: tous ? `Tu tiens ${exo.max} s partout : passe à une version plus dure (voir « Comment faire »).` : `La dernière fois : ${temps.join(', ')} s. Gagne 5 s.`,
    };
  },
  // La charge de départ d'un exercice jamais fait : une part du poids du corps (DEPARTS_PAR_KG), arrondie au pas de
  // l'exercice. poids = celui des réglages (data.json). Poids inconnu, exercice au poids du corps ou sans repère : null
  // (l'écran dit alors « prends léger »).
  chargeDepart(exo, poids, seances) {
    if (!exo || exo.corps) return null;
    // 2.37.0 : le même appareil déjà fait avec une autre prise : sa charge d'ici (L.chargeJumeau), au cran du dessous.
    const jumeau = L.chargeJumeau(seances, exo.nom);
    if (jumeau > 0) return L.cranDessous(exo, jumeau);
    const part = DEPARTS_PAR_KG[L.norm(exo.nom)];
    if (!part || !(poids > 0)) return null;
    const pas = exo.pas > 0 ? exo.pas : 2.5;
    return Math.max(pas, Math.round((part * poids) / pas) * pas);
  },
  // Première fois : la charge de départ de l'exercice (exo.depart, posée par L.preparerSeance d'après le poids des réglages),
  // sinon « prends léger ». Pas de « encore 2 ou 3 » : pour un débutant, ça fait souvent 5 ou plus en vrai (« La bonne
  // séance », changement 3).
  conseilPremiereFois(exo) {
    const depart = exo.corps ? null : exo.depart;
    if (depart) {
      // 2.5.1 : « arrête la série quand il t'en reste 2 » est dit par la ligne d'effort, juste dessous (L.effort).
      return { charge: depart, valeur: exo.min, depart: true, texte: `Première fois : essaie ${L.fmt(depart)} kg (une estimation), ajuste avec − et +.` };
    }
    if (exo.corps) return { charge: null, valeur: exo.min, texte: 'Première fois : fais des répétitions propres et arrête la série quand il t\'en reste 2.' };
    return { charge: null, valeur: exo.min, texte: 'Première fois : prends léger, puis ajuste avec − et +.' };
  },
  // La double progression (d'abord des répétitions, puis plus lourd), réglée sur ce qu'il a fait et sur sa réserve, avec les
  // charges qui existent sur l'appareil (2.37.0, 35-charge.js) ; et « bloqué depuis 3 séances ».
  conseilProgression(exo, der, avant) {
    const charge = L.chargeMax(der.series);
    const reps = der.series.filter((x) => (x.c || 0) === charge).map((x) => x.r || 0);
    const resume = der.series.map((x) => x.r).join(', ');
    const partout = reps.length >= Math.min(2, exo.series) && reps.every((r) => r >= exo.max);
    // Bloqué : rien gagné (ni charge ni répétition, L.compareExo) les deux dernières fois, donc 3 séances au même niveau.
    // « Un exercice bloqué 3 séances : regarde d'abord ton sommeil, ce que tu manges et ta réserve. »
    const gagne = (series, ref) => ['plus', 'charge'].indexOf(L.compareExo(series, ref).signe) >= 0;
    const bloque = !!(avant && avant.avant && !gagne(der.series, avant) && !gagne(avant.series, avant.avant));
    const siBloque = bloque ? '\nConseil : Bloqué depuis 3 séances : regarde ton sommeil, ce que tu manges et ta réserve.' : '';
    if (!charge) {
      // Tractions au haut de la fourchette à toutes les séries : sans progression, la réserve dérive et les séries deviennent
      // trop faciles [61] ; on grossit environ deux fois moins [31]. Le tirage vertical se charge de 2,5 kg en 2,5 kg.
      if (partout && /traction/.test(L.norm(exo.nom))) {
        return { charge: 0, valeur: exo.max, texte: `${exo.max} répétitions partout : passe au tirage vertical à la machine.\nPourquoi : tu pourras monter de 2,5 kg.` };
      }
      return { charge: 0, valeur: Math.min(exo.max, (reps[0] || exo.min) + 1), texte: `La dernière fois : ${resume} répétitions. Gagne une répétition.${siBloque}` };
    }
    // 2.37.0 : la charge de la séance suivante se règle sur ce qu'il a fait et sur sa réserve (L.capacite), avec les charges
    // qui existent sur l'appareil (L.pasDe). Dans l'ordre : trop lourd, monter, rester.
    const C = L.CHARGE, pas = L.pasDe(exo);
    // Seules comptent les séries faites à la charge la plus lourde ; la réserve aussi, si c'est bien celle de la dernière série.
    const faits = reps.join(', ');
    const reserveLa = (der.series[der.series.length - 1].c || 0) === charge ? der.reserve : undefined;
    const assez = reps.length >= Math.min(2, exo.series);
    const cap = L.capacite(reps, reserveLa);
    const base = L.cranDessous(exo, charge), cran = L.arrondi2(base + pas);
    const garde = base < charge ? base : charge;   // une charge notée hors de la grille : le cran du dessous
    // 1. Trop lourd : la première série, fraîche, nettement sous le bas de la fourchette (L.plancher) → le cran du dessous
    //    (un de plus si le calcul le dit). Jamais sur la seule foi de la réserve, ni pour une série suivante (c'est la
    //    fatigue). Un peu sous le bas : on garde la charge et on regagne des répétitions (règle 3).
    //    À la plus petite charge de l'appareil, rien à baisser : on reste (règle 3).
    const moins = reps[0] < L.plancher(exo) ? L.chargeBaissee(exo, charge, Math.max(reps[0], cap)) : charge;
    if (moins < charge) return { charge: moins, valeur: exo.min, texte: `${L.fmt(charge)} kg était trop lourd (${faits} répétitions) : redescends à ${L.fmt(moins)} kg.` };
    // Après une montée, le plus de répétitions propres (avis, preuve faible), pas « repars de 8 ».
    // 2.5.1 : la phrase visible dit la montée ; « le plus de répétitions propres » est replié (la cible en gros dit « × 8+ »).
    const apresMontee = (c) => `monte à ${L.fmt(c)} kg.\nComment : le plus de répétitions propres, au moins ${exo.min} (avis).`;
    const reserve = reserveLa === '3+' ? ', 3 ou plus en réserve' : reserveLa === '1-2' ? ', 1 ou 2 en réserve' : '';
    // 2. Monter : le haut de la fourchette est là (partout, ou la capacité le dépasse d'une répétition [ACSM 2009]), aucune
    //    série sous le bas, et le calcul dit qu'au cran du dessus il fera encore le bas de la fourchette (L.chargeMontee).
    //    Les débutants prennent trop léger [Steele 2022] : c'est au carnet de monter.
    //    R1 : « 3 ou plus » en réserve et le haut de la fourchette à la 1re série suffisent aussi (c'est trop léger [Robinson 2024]).
    //    Il faut au moins deux séries à cette charge : une seule ne fait pas monter.
    const r1 = reserveLa === '3+' && reps[0] >= exo.max;
    if (reps.every((r) => r >= exo.min) && (partout || (assez && (cap >= exo.max + 1 || r1)))) {
      const c = L.chargeMontee(exo, charge, cap);
      if (c > charge) {
        const quoi = partout ? `${exo.max} répétitions partout à ${L.fmt(charge)} kg`
          : r1 ? `${exo.max} à la 1re série, 3 ou plus en réserve` : `${faits} répétitions à ${L.fmt(charge)} kg${reserve}`;
        return { charge: c, valeur: exo.min, monte: true, texte: `${quoi} : ${apresMontee(c)}` };
      }
    }
    // 3. Rester : même charge, plus de répétitions. Quand le cran du dessus est gros (une pile de 5 en 5, des haltères de
    //    2 en 2), la fourchette s'allonge jusqu'au nombre qui permet de monter (L.passage) : ajouter des répétitions fait
    //    autant progresser qu'ajouter de la charge [Plotkin 2022, Chaves 2024], et le muscle grossit pareil avec une charge
    //    plus légère si la série va près de l'échec [Schoenfeld 2017].
    const passage = L.passage(exo, charge, cran);
    const plafond = Math.min(C.REPS_MAX, Math.max(exo.max, passage));
    // La 1re série ne dépasse le haut de la fourchette que quand toutes les séries y sont : d'ici là, on gagne sur les suivantes.
    const haut1 = partout ? plafond : exo.max;
    const etApres = !(partout && passage > exo.max) ? '' : passage > C.REPS_MAX
      ? `\nEt après : ${L.fmt(cran)} kg est trop haut pour l'instant. Cherche un cran plus fin sur l'appareil.`
      : `\nEt après : ${L.fmt(cran)} kg quand tu en fais environ ${passage}.`;
    // La réserve « 3 ou plus » : c'est trop léger [Robinson 2024], 2 répétitions de plus d'un coup (R1 bis).
    if (reserveLa === '3+' && Math.min(haut1, reps[0] + 2) > reps[0]) {
      const v = Math.min(haut1, reps[0] + 2);
      return { charge: garde, valeur: v, plafond, texte: `Il t'en restait 3 ou plus : garde ${L.fmt(garde)} kg et vise ${v} (${v - reps[0]} de plus).${etApres}` };
    }
    // Une répétition de plus qu'à la 1re série ; au moins autant que sa meilleure série à cette charge (8 puis 12 : il sait
    // en faire 12).
    const v = Math.min(haut1, Math.max(reps[0] + 1, ...reps));
    const fin = v === reps[0] + 1 ? 'Gagne une répétition.' : v > reps[0] ? `Vise ${v} dès la 1re série.` : `Refais ${v} à la 1re série, gagne sur les suivantes.`;
    // 2.40.9 (vu par les simulations : 97 caractères avec 3 ou 4 séries à deux chiffres) : trop long pour 2 lignes, la fin passe
    // à la ligne (L.LIGNE_MAX).
    const debut = `Garde ${L.fmt(garde)} kg (la dernière fois : ${faits}).`;
    return { charge: garde, valeur: v, plafond, texte: `${debut}${(debut + ' ' + fin).length > L.LIGNE_MAX ? '\n' : ' '}${fin}${etApres}${siBloque}` };
  },
  // Courbatures fortes : environ un tiers de moins que la dernière charge (arrondi au pas), le bas de la fourchette, pas de progression.
  conseilCourbature(exo, base, der) {
    const ref = der ? L.chargeMax(der.series) : base.charge;
    const charge = ref > 0 ? L.arrondiPas((ref * 2) / 3, exo.pas) : base.charge;
    const quoi = charge > 0 ? `${L.fmt(charge)} kg, ${exo.min} répétitions` : `${exo.min} répétitions`;
    return { charge, valeur: exo.min, leger: true, texte: `Courbatures : un tiers de moins, ${quoi} propres, sans aller au bout.\nPourquoi : avec des courbatures fortes, on est moins fort. Pas de record aujourd'hui.` };
  },
  // Sans montée (nuit courte [120], retour de maladie [126]) : la charge de la dernière fois au plus.
  conseilSansMontee(exo, base, der) {
    const avant = der ? L.chargeMax(der.series) : 0;
    if (!(avant > 0) || !(base.charge > avant)) return base;
    // 2.37.0 : au cran de l'appareil, et sans raboter les répétitions d'une fourchette allongée.
    const garde = L.cranDessous(exo, avant);
    const v = Math.max(exo.max, (der.series.find((x) => (x.c || 0) === avant) || {}).r || 0);
    return { charge: garde, valeur: v, plafond: v, texte: `Pas de record aujourd'hui : garde ${L.fmt(garde)} kg, comme la dernière fois.` };
  },
  // La mise en garde de « La bonne séance » (Intensité) : une ligne de la bulle verte de l'exercice (ECRAN_SEANCE.consignesCarte).
  AVERTISSEMENT_RESERVE: '**Ta réserve** : quand tu crois qu\'il t\'en reste 2, il t\'en reste souvent 4 ou 5.',
  // La dernière série peut aller jusqu'à 0 en réserve : machines, poulies, élévations et curls ; jamais les développés aux haltères.
  zeroPermis(nom) {
    const n = L.norm(nom);
    return /machine|poulie|presse|leg curl|leg extension|tirage|elevation|curl|face pull|pec deck|butterfly/.test(n) && !/developpe.*halteres/.test(n);
  },
  // L'effort de la série k (0 = la 1re), en une ligne (« La bonne séance », Intensité). Séries 1 et 2 : il doit t'en rester 2 ;
  // dernière série : 1, ou 0 sur machine, poulie, élévations et curl ; jamais l'échec aux développés aux haltères.
  // der = la fois d'avant (L.derniere) ; null = jamais fait : « la première fois en 2 séries, sans aller au bout » (« La bonne
  // séance », Courbatures) : 2 en réserve à chaque série, la dernière comprise. Sans 3e argument : la règle habituelle.
  effort(exo, k, der) {
    if (!exo || exo.echauffement) return '';
    if (exo.unite === 's') return 'Tiens le corps bien droit ; arrête quand il ne l\'est plus.';
    if (exo.legere || exo.courb) return 'Sans aller au bout : garde 2 ou 3 en réserve.';
    if (der === null) return 'Première fois : arrête-toi quand il t\'en reste 2, même à la dernière série.';
    const n = Array.isArray(exo.series) ? exo.series.length : +exo.series || 1;
    if (k < n - 1) return 'Arrête-toi quand il t\'en reste 2.';
    if (/developpe.*halteres/.test(L.norm(exo.nom))) return 'Dernière série : garde 1 ou 2 en réserve, jamais l\'échec.';
    return L.zeroPermis(exo.nom) ? 'Dernière série : va jusqu\'à 1, ou 0.' : 'Dernière série : va jusqu\'à 1.';
  },
  // Le tempo, sur la carte : 1 s pour l'effort, 2 s pour revenir [18, 75]. Le souffle : la consigne de l'ancienne note « Débuter », sans étude.
  // 2.10.0 (demande : dire clairement s'il faut pousser ou tirer) : le verbe de l'exercice, d'après son nom (L.effortDe) :
  // [le motif, l'ordre, « quand tu … », le retour]. L'ordre des lignes compte : « leg curl » avant « curl ». Au tirage
  // vertical ou au leg curl assis, les mains ou les pieds descendent pendant l'effort : jamais « monte » pour eux.
  EFFORTS: [
    [/leg curl|ischio/, 'Plie les jambes', 'plies les jambes', 'reviens'],
    [/leg extension/, 'Tends les jambes', 'tends les jambes', 'reviens'],
    [/tirage|traction|rowing|face pull|pull[ -]?over|oiseau|shrug|haussement/, 'Tire', 'tires', 'reviens'],
    [/crunch|abdo|releve de (jambes|genoux)/, 'Enroule', 'enroules', 'reviens'],
    [/curl|elevation/, 'Monte', 'montes', 'redescends'],
    [/presse|squat|fente|hip thrust|mollet|developpe|pompe|dips|triceps|ecarte|butterfly|pec deck/, 'Pousse', 'pousses', 'reviens'],
  ],
  // L'effort d'un exercice : { ordre (« Tire »), tu (« tires »), retour (« reviens ») } ; nom inconnu : « Pousse ou tire ».
  effortDe(nom) {
    const n = L.norm(nom);
    const e = L.EFFORTS.find((x) => x[0].test(n));
    return e ? { ordre: e[1], tu: e[2], retour: e[3] } : { ordre: 'Pousse ou tire', tu: 'pousses ou tires', retour: 'reviens' };
  },
  // La ligne du tempo et de la respiration d'un exercice : toujours là, à chaque exercice et à chaque série (2.12.0, demande :
  // tous les repères, la respiration entre les deux traits) ; pas au temps (gainage) ni à l'échauffement : ''.
  ligneTempo(exo, seances, ficheDitTempo) {
    if (!exo || exo.echauffement || exo.unite === 's') return '';
    // ficheDitTempo : la fiche du guide est à l'écran et dit déjà le tempo : le souffle seul (pas de texte répété).
    const e = L.effortDe(exo.nom);
    // On expire pendant l'effort, on inspire au retour (la consigne habituelle des entraîneurs ; « La bonne séance »,
    // Respiration : un blocage bref est inévitable sur une série lourde ou menée au bout, ses risques ne sont pas confirmés [189]).
    return ficheDitTempo ? `**Expire** quand tu ${e.tu}, **inspire** au retour.` : `**${e.ordre} en 1 s** en expirant, **${e.retour} en 2 s** en inspirant.`;
  },
  // ── Les repères du geste (« La bonne séance », Amplitude, Attention, Gainage du tronc, Eau) ──
  // Une ligne « **Nom :** texte » de la fiche du guide (lignes) : son texte, ou ''. Le nom exact : « Dernière série » ne lit
  // pas « Dernière série à la poulie ».
  champFiche(lignes, nom) {
    const debut = new RegExp(`^\\*\\*${nom}\\s*:\\*\\*\\s*`);
    const l = (Array.isArray(lignes) ? lignes : []).map((x) => String(x).trim()).find((x) => debut.test(x));
    return l ? l.replace(debut, '').trim() : '';
  },
  // La vidéo du geste d'une fiche (ligne « **Vidéo :** https://www.youtube.com/watch?v=ID · 9:16 », 2.38.81) →
  // { url, id, format } (format : la forme de l'image, « 9:16 », « 1:1 » ou « 16:9 » par défaut, pour le lecteur), ou null.
  videoDeFiche(lignes) {
    // 2.41.11 : sa durée en plus (« · 31 s »), pour que « Avec le son » reprenne où elle en est.
    const m = /^(https:\/\/\S+)(?:\s*·\s*(\d+):(\d+))?(?:\s*·\s*(\d+)\s*s)?\s*$/.exec(L.champFiche(lignes, 'Vidéo'));
    if (!m) return null;
    const id = /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([\w-]{11})(?:[&#?]|$)/.exec(m[1]);
    return { url: m[1], id: id ? id[1] : null, format: m[2] ? `${m[2]}:${m[3]}` : '16:9', duree: m[4] ? Number(m[4]) : 0 };
  },
  // Aller au bout du côté étiré : le mouvement complet fait mieux que la moitié contractée [19, 76], la moitié étirée fait
  // autant que le complet [77-79]. Le bout vient de la fiche du guide : ce qui suit « en 2 secondes » (le retour) dans sa
  // ligne « Geste » (« Remonte en 2 secondes, bras presque tendus. » → « bras presque tendus »). Rien à dire : ''.
  amplitude(lignes) {
    const m = /\b2 s(?:econdes)?\b[\s,]*([^.!?]*)/.exec(L.champFiche(lignes, 'Geste'));
    const bout = m ? m[1].trim() : '';
    return bout ? `**Va au bout** : ${bout}.` : '';
  },
  // À la fin de la dernière série, quand elle va jusqu'à 1 ou 0 (pas la première fois, pas un jour allégé, pas aux développés
  // aux haltères) : la ligne « Dernière série » de la fiche (leg curl : des demi-répétitions du côté étiré [81]). Sinon ''.
  pourFinir(exo, k, der, lignes) {
    if (!exo || exo.echauffement || exo.unite === 's' || exo.legere || exo.courb || der === null) return '';
    const n = Array.isArray(exo.series) ? exo.series.length : +exo.series || 1;
    const fin = k === n - 1 && L.zeroPermis(exo.nom) ? L.champFiche(lignes, 'Dernière série') : '';
    return fin ? `**Pour finir** : ${fin}` : '';
  },
  // Les petits exercices du haut du corps (bras, côté et arrière des épaules) : penser au muscle pendant la série a donné
  // plus de biceps chez des débutants (+12,4 % contre +6,9 %), rien de plus aux cuisses [96] ; l'effet sur l'activité du
  // muscle s'arrête entre 60 et 80 % du maximum [97]. Sur les gros exercices, penser à la charge fait faire plus de
  // répétitions sur une séance [190, 191], sans gain de muscle mesuré : rien n'est dit (« Tu dois sentir » contrôle le geste).
  penseAuMuscle(nom) {
    return L.famille(nom) !== 'jambes' && /\bcurl\b|biceps|triceps|barre au front|elevation|face pull|oiseau/.test(L.norm(nom));
  },
  // Debout avec des haltères, une barre ou une poulie (pas assis, pas sur une machine) : serrer le ventre (tous les
  // abdominaux, sans le rentrer) raidit le tronc ; le rentrer ne sert à rien [192, 193]. Mesures de laboratoire sur 11 et
  // 8 hommes : aucun essai sur les blessures ni sur le muscle.
  estDebout(nom) {
    const n = L.norm(nom);
    return L.famille(nom) !== 'jambes' && /\bcurl\b|elevation|triceps|face pull|oiseau|shrug|haussement/.test(n) && !/assis|machine|pupitre|allonge|incline/.test(n);
  },
  // 2.14.0 : l'image de l'utilisateur (une canette pleine résiste à la presse, une vide s'écrase) : la pression dans le ventre
  // raidit le tronc, +21 % et +42 % en flexion à 40 % et 80 % de la pression maximale (10 personnes, laboratoire) [196].
  VENTRE: 'Ventre dur, comme une canette pleine',
  // Déshydraté, on fait 8,3 % de répétitions en moins et on perd 5,5 % de force (plus chez les non-entraînés) [147] ;
  // boire pendant l'effort sert à ne pas perdre plus de 2 % de son poids [146]. Dit au repos qui précède un nouvel exercice.
  BOIRE: 'Bois un peu d\'eau',
  // La cible de la série en cours, d'après le conseil ET les séries déjà faites aujourd'hui (faites = exo.faites) :
  // après une série à 20 kg, elle ne dit plus « Garde 17,5 kg ».
  //  série 1 : le conseil ;
  //  ensuite, d'après la série d'avant (d) : 1. poids du corps : la série de la fois d'avant + 1, sinon autant que d ;
  //  2. nettement sous le bas de la fourchette (L.plancher) : un cran de moins ; 2 bis. jamais fait et le haut atteint : un cran de plus ;
  //  3. la charge du conseil, et la même série de la fois d'avant à cette
  //  charge : une répétition de plus qu'elle ; 4. sinon : garder la charge de d et refaire autant.
  // → { charge, valeur, gros (« 20 kg × 12 », « 45 s », « 12 rép. »), texte, direct (vient des séries du jour) }.
  cibleSerie(exo, conseil, der, faites) {
    const f = Array.isArray(faites) ? faites.filter(Boolean) : [];
    const k = f.length;
    const cs = conseil || { charge: null, valeur: exo.min, texte: '' };
    // Le haut de la fourchette, allongé quand le cran du dessus est gros (conseil.plafond, L.conseilProgression).
    const haut = Math.max(exo.max, cs.plafond || 0);
    const borne = (v) => Math.min(haut, Math.max(exo.min, v));
    // 2.37.0 : la dernière série est toujours ouverte (« 12+ ») : au moins la cible, puis tant que le geste est propre. Les
    // répétitions faites sont la seule mesure sûre ; la réserve déclarée ne l'est pas (on a plus de réserve qu'on ne le dit
    // [Halperin 2022], et un débutant prend trop léger [Steele 2022]). Jamais fait : chaque série est un test, ouverte aussi.
    // Pas les séries allégées (semaine légère, courbatures).
    const nSeries = Array.isArray(exo.series) ? exo.series.length : +exo.series || 1;
    const ouverte = !(exo.legere || exo.courb || cs.leger || cs.legere) && (der === null || k >= nSeries - 1);
    const gros = (c, v, plus) => (c > 0 ? `${L.fmt(c)} kg × ${v}${ouverte || plus ? '+' : ''}` : `${v} rép.`);
    if (exo.unite === 's') {
      return { charge: null, valeur: cs.valeur, gros: `${cs.valeur} s`, texte: k ? `Série ${k + 1} : tiens ${cs.valeur} s.` : cs.texte, direct: false };
    }
    // Après une montée : « 45 kg × 8+ », le plus de répétitions propres, pas le bas de la fourchette seul (avis) [61] ; les
    // débutants s'arrêtent bien trop tôt [15].
    if (!k) return { charge: cs.charge, valeur: cs.valeur, gros: gros(cs.charge, cs.valeur, cs.monte), texte: cs.texte, direct: false };
    const d = f[k - 1];
    const c = d.c > 0 ? d.c : cs.charge;
    const avant = der && Array.isArray(der.series) ? der.series[k] : null;
    const leger = !!(exo.legere || exo.courb || cs.leger || cs.legere);
    const premiere = der === null;   // jamais fait, pas de « ou plus » (sans aller au bout)
    const rend = (charge, valeur, texte) => ({ charge, valeur, gros: gros(charge, valeur), texte, direct: true });
    if (exo.corps || !(c > 0)) {
      const v = borne(avant && avant.r > 0 && !leger ? avant.r + 1 : d.r || exo.min);
      return rend(c > 0 ? c : (cs.charge != null ? cs.charge : 0), v, `Série ${k + 1} : vise ${v} répétitions.`);
    }
    if (d.r < L.plancher(exo)) {   // nettement sous le bas de la fourchette ; un peu dessous, on garde la charge
      const bas = L.chargeBaissee(exo, c, d.r);   // le cran du dessous ; un de plus si le calcul le dit
      if (bas < c) return rend(bas, exo.min, `${d.r} répétitions, c'est sous ${exo.min} : baisse à ${L.fmt(bas)} kg.`);   // à la plus petite charge : rien à baisser
    }
    // 2.37.0 : jamais fait : la série d'avant sert de test (débuter, c'est ne pas connaître la bonne charge). Le haut de la
    // fourchette atteint en gardant 2 en réserve : la charge de départ était trop légère, on monte tout de suite
    // (L.chargeMontee, capacité = ses répétitions + 2). Assemblage de règles de manuels, pas un protocole testé (avis).
    if (premiere && !leger && d.r >= exo.max) {
      const plus = L.chargeMontee(exo, c, Math.min(L.CHARGE.REPS_MAX, d.r + 2));
      // Jamais vers une charge déjà essayée dans la séance (elle était trop lourde).
      if (plus > c && !f.some((x) => (x.c || 0) >= plus)) return rend(plus, exo.min, `${d.r} répétitions : trop léger. Monte à ${L.fmt(plus)} kg.`);
    }
    if (c === cs.charge && avant && (avant.c || 0) === c && avant.r > 0 && !leger) {
      const v = borne(avant.r + 1);
      return rend(c, v, `Série ${k + 1} : ${L.fmt(c)} kg, la dernière fois ${avant.r}. ${v > avant.r ? 'Gagne une répétition.' : v < avant.r ? `Vise ${v}.` : `Refais ${v}.`}`);   // (check-up 2.38.64) pas « Refais 16 » après 19
    }
    const v = borne(d.r);
    return rend(c, v, leger || premiere ? `Garde ${L.fmt(c)} kg et refais ${v}.` : `Garde ${L.fmt(c)} kg et refais ${v}, ou plus si c'est propre.`);
  },
});
