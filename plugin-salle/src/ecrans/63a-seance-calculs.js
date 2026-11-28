// L'écran de séance, ses petits calculs purs (ECRAN_SEANCE, testés dans tests/r63-seance.js). L'écran : 63b-seance.js,
// la carte de l'exercice : 63c-seance-carte.js. ECRAN_SEANCE n'est lu qu'à l'appel : l'ordre des fichiers ne gêne pas.

// ── Petits calculs de l'écran (purs, testés dans tests/r63-seance.js) ──
// La première lettre en minuscule, le reste tel quel (2.38.8 : « … épaules. aide : … » avait perdu sa majuscule).
const minuscule = (t) => String(t || '').charAt(0).toLowerCase() + String(t || '').slice(1);
const ECRAN_SEANCE = {
  // Les consignes vertes de la séance, toujours affichées (2.13.1) : des puces d'une ligne, le mot clé en gras.
  CONSIGNES: {
    // Revenue en 2.13.2 (l'ancienne « b-approches », retirée en 2.12.0) : on ne les coche plus, le gros bouton les valide.
    legere: '**Série légère** : elle prépare la charge, elle ne compte pas dans tes séries.',
    superserie: '**Supersérie** : enchaîne les deux exercices sans repos, puis 1 min 30 de repos après le tour.',
    ordre: '**Machine prise** : touche un autre exercice, tu reviendras au premier.',
    // Quand consulter (« La bonne séance », Courbatures) ; le chemin du menu « … » pour passer l'exercice.
    douleur: ['**Douleur vive, qui pique, ou dans une articulation** : arrête l\'exercice.',
      '**Pour le passer** : touche « … », puis « Ne pas le faire aujourd\'hui », puis « Douleur ».'],
    // Quand consulter, pendant l'effort (« La bonne séance », Courbatures, « Quand consulter »).
    malaise: '**Douleur dans la poitrine, malaise ou palpitations** : arrête la séance et consulte.',
    // Les règles de la salle (pas une étude), montrées pendant le repos. 2.14.0 : en très court (il les lit à bout de souffle).
    repos: ['**Quelqu\'un attend** : propose d\'alterner.', '**Après l\'exercice** : range haltères et disques.'],
  },
  // Sur la carte de l'échauffement, à chaque séance (« La bonne séance », Eau, Musique, Échauffement et étirements) : arriver
  // avec de l'eau [146, 147] ; sa musique préférée fait faire plus de répétitions [194, 195] ; s'étirer 60 s ou plus juste
  // avant fait perdre de la force, moins de 60 s presque rien [9].
  PREPARER: ['**Avant de pédaler** : remplis ta gourde, mets ta musique.', '**Pas d\'étirement** de plus de 30 s avant tes séries.'],
  REPERES_MAX: 7,       // les repères lus dans une fiche, au plus (2 à 5 mots chacun)
  REPOS_MAX: 10,        // les lignes montrées pendant un repos, au plus (2.38.10 : 3 ; 2.38.42, demande : tous les repères au repos)
  RETENIR_MAX: 3,       // les repères « à faire » lus dans « À retenir », au plus
  EVITER_MAX: 2,        // les erreurs à éviter, au plus
  BIENTOT: 10,          // les 10 dernières secondes du repos : la couleur change, sans clignoter
  HORLOGE_MS: 500,      // l'horloge de l'écran (repos, chrono, temps) se met à jour à ce rythme
  VERT_MS: 1500,        // à 0 : « C'est reparti » et « GO » en vert pendant 1,5 s, puis le repos part (2.38.47, demande : la page
                        // du GO restait trop longtemps ; 5 s avant)
  DEPART_MS: 3000,      // le chrono du gainage part 3 s après le toucher (le temps de se mettre en place)
  DUREE_MAX_MIN: 240,   // la durée notée d'une séance, au plus (une séance oubliée ouverte ne compte pas 10 h)
  CARDIO_MAX_MIN: 120,  // le cardio noté, au plus
  VELO_MS: VELO_MIN * MS_MINUTE,   // le vélo de l'échauffement

  // Une série en court, pour la colonne « la dernière fois » : « 35 × 10 », « 12 rép. », « 40 s » ; rien : « — ».
  court(x) {
    if (!x) return '—';
    if (x.s != null) return `${x.s} s`;
    return x.c > 0 ? `${L.fmt(x.c)} × ${x.r}` : `${x.r} rép.`;
  },
  // Une série faite face à la même série de la fois d'avant : 'nouvelle charge', '+1', '+5 s' ou ''. 2.38.62 (demande : le « = »
  // n'est pas une info utile) : pareil qu'avant, rien.
  // Moins bien qu'avant : rien du tout (jamais de rouge, jamais de reproche).
  ecart(f, d) {
    if (!f || !d) return '';
    if (f.s != null || d.s != null) {
      if (!(f.s >= 0) || !(d.s >= 0)) return '';
      const e = f.s - d.s;
      return e > 0 ? `+${e} s` : '';
    }
    const fc = f.c || 0, dc = d.c || 0;
    if (fc > dc + 1e-9) return 'nouvelle charge';
    if (Math.abs(fc - dc) > 1e-9) return '';
    const e = (f.r || 0) - (d.r || 0);
    return e > 0 ? `+${e}` : '';
  },
  // Pour l'exercice affiché : la fois d'avant, le conseil, la cible de la série en cours et celle de la série 1 (pour les
  // approches). Semaine légère d'une séance 1.x (sc.legere sans exo.legere) : l'exercice est traité comme léger.
  cibles(exo, seances, legere) {
    const e = legere && !exo.legere ? Object.assign({}, exo, { legere: true }) : exo;
    const ss = Array.isArray(seances) ? seances : [];
    const der = L.derniere(ss, exo.nom);
    const conseil = L.conseil(e, der, L.avantDerniere(ss, exo.nom));
    return { exo: e, der, conseil, cible: L.cibleSerie(e, conseil, der, exo.faites), premiere: L.cibleSerie(e, conseil, der, []) };
  },
  // 2.38.59 (demande : mettre en valeur un changement de poids ou de répétitions, il n'y fait pas forcément attention) : ce
  // qui change par rapport à ce qu'il vient de faire (la série d'avant, aujourd'hui) ou, à la 1re série, à la même série la
  // fois d'avant. { poids: { avant, apres } | null, reps: { avant, apres } | null }, ou null si rien ne change (ou rien à
  // comparer, ou un exercice au temps).
  changement(exo, cible, der) {
    if (!exo || exo.unite === 's' || !cible) return null;
    const f = (Array.isArray(exo.faites) ? exo.faites : []).filter(Boolean);
    const ref = f.length ? f[f.length - 1] : (der && Array.isArray(der.series) ? der.series[0] : null);
    if (!ref) return null;
    const poids = cible.charge > 0 && ref.c > 0 && Math.abs(cible.charge - ref.c) > 0.01 ? { avant: ref.c, apres: cible.charge } : null;
    const reps = cible.valeur > 0 && ref.r > 0 && cible.valeur !== ref.r ? { avant: ref.r, apres: cible.valeur } : null;
    // 2.38.64 (sa question : « pourquoi plus de rép. pour après descendre ? ») : la même série la fois d'avant, au même poids,
    // pour dire le progrès (« 22 rép. : +1 depuis le 19/11 ») plutôt qu'une baisse due à la fatigue entre deux séries.
    const d = der && Array.isArray(der.series) ? der.series[f.length] : null;
    const fois = d && d.r > 0 && Math.abs((d.c || 0) - (cible.charge || 0)) < 0.01 ? { r: d.r, date: der.date } : null;
    return poids || reps ? { poids, reps, fois } : null;
  },
  // Le texte de la pastille du changement : « Plus lourd : 7,5 → 10 kg · 14 → 15 rép. » ; et si ça monte (son icône).
  texteChangement(ch) {
    if (!ch) return null;
    const f = ch.reps && ch.fois ? ch.fois : null, ecart = f ? ch.reps.apres - f.r : 0;
    const monte = ch.poids ? ch.poids.apres > ch.poids.avant : f ? ecart >= 0 : ch.reps.apres > ch.reps.avant;
    const repsDit = !ch.reps ? '' : !f ? `${ch.reps.avant} → ${ch.reps.apres} rép.`
      : `${ch.reps.apres} rép.${ecart ? ` : ${ecart > 0 ? '+' : '−'}${Math.abs(ecart)} depuis le ${L.dateCourte(f.date)}` : `, comme le ${L.dateCourte(f.date)}`}`;
    if (ch.poids) return { texte: `${monte ? 'Plus lourd' : 'Plus léger'} : ${[`${L.fmt(ch.poids.avant)} → ${L.fmt(ch.poids.apres)} kg`, repsDit].filter(Boolean).join(' · ')}`, monte };
    return { texte: f ? repsDit : `${monte ? 'Plus de rép.' : 'Moins de rép.'} : ${repsDit}`, monte };
  },
  // La cible en gros découpée pour l'affichage : les nombres en très gros, les unités et « × » plus petits
  // (« 20 kg × 12 » → [20][kg][×][12]). Le texte reste le même, mot pour mot ; seule la taille change.
  morceauxCible(texte) {
    // « 12+ » (la dernière série, ouverte) est un nombre aussi : en gros, pas en petit (2.38.7).
    return String(texte || '').split(/\s+/).filter(Boolean).map((m) => ({ texte: m, nombre: /^[\d.,:]+\+?$/.test(m) }));
  },
  // 2.38.59 : les rangs (dans morceauxCible) des nombres qui changent : le premier nombre est le poids s'il y a « kg », le
  // dernier les répétitions.
  nombresChanges(morceaux, change) {
    const s = new Set();
    if (!change) return s;
    const idx = morceaux.map((m, j) => (m.nombre ? j : -1)).filter((j) => j >= 0);
    const aKg = morceaux.some((m) => m.texte === 'kg');
    if (change.poids && aKg && idx.length) s.add(idx[0]);
    if (change.reps && idx.length) s.add(idx[idx.length - 1]);
    return s;
  },
  // La largeur des nombres de la cible, en chiffres (le « + » compte comme un chiffre, une virgule ou un point moins) : la taille des
  // chiffres en dépend (63-seance.css, --n), pour qu'ils soient le plus gros possible sur une seule ligne (2.38.7).
  largeurCible(texte) {
    return ECRAN_SEANCE.morceauxCible(texte).filter((m) => m.nombre).reduce((t, m) =>
      t + Array.from(m.texte).reduce((s, c) => s + (/[\d+]/.test(c) ? 1 : 0.4), 0), 0);
  },
  // L'autre exercice de la supersérie, ou -1.
  partenaire(sc, i) {
    const x = sc && Array.isArray(sc.exos) ? sc.exos[i] : null;
    if (!x || !x.groupe) return -1;
    return sc.exos.findIndex((e, j) => j !== i && e && e.groupe === x.groupe);
  },
  // Le tour de supersérie en cours : { n, sur } (sur = le plus grand nombre de séries des deux), ou null.
  tour(sc, i) {
    const j = ECRAN_SEANCE.partenaire(sc, i);
    if (j < 0) return null;
    const x = sc.exos[i];
    const sur = Math.max(x.series, sc.exos[j].series);
    return { n: Math.min(sur, x.faites.length + 1), sur };
  },
  // Le gros bouton du bas : { texte, icone, quoi }. Un exercice fini (ou passé) touché dans la liste : « Exercice suivant »
  // (le programme donne le nombre de séries : jamais une série en plus).
  barre(sc, i, maintenant) {
    const exos = sc.exos, x = exos[i];
    const fin = { texte: 'Terminer et enregistrer', icone: 'terminer', quoi: 'terminer' };
    const suivant = { texte: 'Exercice suivant', icone: 'passer', quoi: 'suivant' };
    if (!x || L.toutFait(exos)) return fin;
    if (x.echauffement) return x.faites.length ? suivant : { texte: 'Fait', icone: 'valider', quoi: 'echauffement' };
    if (L.fini(x)) return suivant;
    // Une série légère d'abord : validée comme une série, par ce même bouton.
    const legere = L.legereAFaire(x);
    if (legere) return { texte: `Série légère ${legere.n} sur ${legere.sur} faite`, icone: 'valider', quoi: 'legere' };
    if (x.unite === 's') {
      if (!(sc.chronoDebut > 0)) return { texte: 'Lancer le chrono', icone: 'chrono', quoi: 'chrono' };
      const e = (maintenant - sc.chronoDebut) / 1000;
      return { texte: e < 0 ? `Départ dans ${Math.ceil(-e)} s` : `Fait · ${L.fmtDuree(e)}`, icone: 'valider', quoi: 'serie' };
    }
    return { texte: `Série ${x.faites.length + 1} sur ${x.series} faite`, icone: 'valider', quoi: 'serie' };
  },
  // Le temps sous le titre : « 23 min sur environ 1 h 10 » (la durée prévue arrondie à 5 min), ou « commencée le 13/11 ».
  temps(sc, aujourdhui, maintenant) {
    if (sc.date !== aujourdhui) return `commencée le ${L.dateCourte(sc.date)}`;
    const min = Math.max(0, Math.floor(L.minutesDepuis(sc.debut, maintenant)));
    const prevue = sc.dureePrevue > 0 ? Math.max(5, Math.round(sc.dureePrevue / 5) * 5) : 0;
    return prevue ? `${min} min sur environ ${L.fmtTemps(prevue)}` : `${min} min`;
  },
  // « Exercice 2 sur 7 », sans compter l'échauffement (comme « Ta séance d'aujourd'hui », qui annonce 7 exercices).
  // L'échauffement lui-même : « Pour commencer ».
  rang(sc, i) {
    const x = sc.exos[i];
    if (!x || x.echauffement) return 'Pour commencer';
    const vrais = sc.exos.filter((e) => e && !e.echauffement);
    return `Exercice ${vrais.indexOf(x) + 1} sur ${vrais.length}`;
  },
  // Le nombre de séries faites (l'échauffement et les approches ne comptent pas).
  seriesFaites(sc) {
    return sc.exos.reduce((t, x) => t + (x.echauffement || !Array.isArray(x.faites) ? 0 : x.faites.length), 0);
  },
  // Une série pour la note : { c, r } ou { s } (le champ « record » de la séance en cours ne va pas dans la note).
  nettoyer(x) {
    return x.s != null ? { s: x.s } : { c: x.c, r: x.r };
  },
  // Les consignes vertes de la carte d'un exercice, dans une seule bulle, toujours là : pendant une série légère, à quoi
  // elle sert ; sinon la réserve (L.AVERTISSEMENT_RESERVE, pas pour un exercice au temps) ; la supersérie s'il en fait partie ;
  // puis la douleur et le malaise. fini : l'exercice est fini (plus rien à faire, donc ni réserve ni douleur) ; enGroupe : il
  // fait partie d'une supersérie ; legere : une série légère est à faire. → les lignes de la bulle, [] s'il n'y en a pas.
  consignesCarte(exo, fini, enGroupe, legere) {
    const C = ECRAN_SEANCE.CONSIGNES, lignes = [];
    if (legere) lignes.push(C.legere);
    else if (!fini && exo.unite !== 's') lignes.push(L.AVERTISSEMENT_RESERVE);
    if (enGroupe) lignes.push(C.superserie);
    if (!fini) lignes.push(...C.douleur, C.malaise);
    return lignes;
  },
  // Les repères à relire pendant le repos, pour la série qui vient (demande : y mettre des repères utiles : ce qu'on doit sentir, comment se placer, puis, 2.14.0 : un texte lisible à bout de souffle). Des lignes de 2 à 5 mots, sans phrase : → [{ type, texte }], dans l'ordre :
  //  'boire'  avant un nouvel exercice (nouveau, L.BOIRE) ;
  //  'sentir' le muscle auquel penser sur un petit exercice du haut du corps (L.penseAuMuscle), sinon ce qu'il faut sentir ;
  //  'fais'   les repères du champ « À retenir » de la fiche (« a · b · c », RETENIR_MAX au plus) ; sans ce champ, le
  //           réglage entier ; puis le ventre dur, debout (L.estDebout, L.VENTRE) ;
  //  'evite'  les premières erreurs de « À éviter » (EVITER_MAX au plus), sans leur explication (après « : »).
  // REPERES_MAX lignes au plus ; [] s'il n'y a rien à dire. exo et nouveau sont facultatifs : sans eux, la fiche seule.
  reperes(lignes, exo, nouveau) {
    const E = ECRAN_SEANCE;
    const l = (Array.isArray(lignes) ? lignes : []).map((x) => String(x).trim());
    const nom = exo && exo.nom ? exo.nom : '';
    const court = (t) => { const x = String(t).replace(/\*\*/g, '').replace(/[.\s]+$/, '').trim(); return x.charAt(0).toUpperCase() + x.slice(1); };
    const out = [];
    if (nouveau) out.push({ type: 'boire', texte: L.BOIRE });
    // 2.38.54 (demande : une phrase plus naturelle, « pense à tes triceps ») : la 1re phrase de « Muscles », son 1er muscle en
    // gras avec « Pense à tes … » (les), « Pense au … » (le), « Pense à … » (l', la) ; le reste après la virgule.
    const penser = (m) => {
      const p = minuscule(court(String(m).split(/\.\s/)[0]));
      const k = p.indexOf(','), tete = k >= 0 ? p.slice(0, k) : p, reste = k >= 0 ? p.slice(k) : '';
      return `**Pense ${/^les /.test(tete) ? 'à tes ' + tete.slice(4) : /^le /.test(tete) ? 'au ' + tete.slice(3) : 'à ' + tete}**${reste}`;
    };
    if (nom && L.penseAuMuscle(nom) && L.champFiche(l, 'Muscles')) out.push({ type: 'sentir', texte: penser(L.champFiche(l, 'Muscles')) });
    else if (L.champFiche(l, 'Tu dois sentir')) out.push({ type: 'sentir', texte: '**Sens** : ' + court(L.champFiche(l, 'Tu dois sentir')).toLowerCase() });
    const retenir = L.champFiche(l, 'À retenir').split('·').map((x) => x.trim()).filter(Boolean).slice(0, E.RETENIR_MAX);
    if (retenir.length) retenir.forEach((x) => out.push({ type: 'fais', texte: court(x) }));
    else if (L.champFiche(l, 'Réglage') || L.champFiche(l, 'Position')) out.push({ type: 'fais', texte: court(L.champFiche(l, 'Réglage') || L.champFiche(l, 'Position')) });
    if (nom && L.estDebout(nom)) out.push({ type: 'fais', texte: L.VENTRE });
    const k = l.findIndex((x) => /^\*\*À éviter\s*:\*\*/.test(x));
    for (let m = k + 1, n = 0; k >= 0 && m < l.length && n < E.EVITER_MAX && /^[-*+]\s+/.test(l[m]); m++, n++) {
      out.push({ type: 'evite', texte: court(l[m].replace(/^[-*+]\s+/, '').split(/\s:\s/)[0]) });
    }
    return out.slice(0, E.REPERES_MAX);
  },
  // La sécurité, en bas de l'aide de la séance (2.38.25, en deux lignes courtes ; 2.38.28 : sous la fiche détaillée).
  SECURITE_AIDE: ['**Douleur vive** : arrête l\'exercice', '**Poitrine, malaise** : arrête et consulte'],
  // L'icône de chaque sorte de repère du repos (ICONES) : une goutte, une cible, ✓ à faire, ✕ à éviter.
  ICONE_REPERE: { boire: 'eau', effort: 'terminer', sentir: 'sentir', fais: 'valider', evite: 'annuler' },
  // Un exercice pas encore commencé : ni série, ni série légère faite. Le repos qui le précède annonce un nouvel exercice
  // (on boit, on voit son image).
  pasCommence(exo) {
    return !!exo && !(Array.isArray(exo.faites) && exo.faites.length) && !(Array.isArray(exo.approches) ? exo.approches : []).some((a) => a && a.faite);
  },
  // Le bilan du jour après une séance annulée : « à refaire ». Gardé à la place du bilan dans data.json (même clé, partagée
  // par le Mac et l'iPhone) ; un bilan rempli le remplace (62-avant.js).
  bilanARefaire(aujourdhui) {
    return { date: aujourdhui, aRefaire: true };
  },
  // Le petit signe de la liste des exercices : passé, fini, commencé, à faire (des formes, pas des émojis).
  signe(x) {
    return x.saute ? '⊘' : L.fini(x) && x.faites.length ? '●' : x.faites.length ? '◐' : '○';
  },
  // La séance à écrire dans la note (pure). L'échauffement : le vélo (5 min s'il est fait) et les approches cochées, en une
  // seule ligne (L.ligneEchauffement) ; rien s'il n'y a rien. Le cardio : les minutes notées, 0 si aucune.
  // sc.cardio est rempli dès le départ (le cardio prévu, L.cardioFin). Il ne compte que si tous les exercices sont faits
  // ou passés (la carte du cardio a été montrée) : une séance arrêtée avant la fin
  // n'écrit pas un cardio qui n'a pas eu lieu (sinon la note, et L.dureeNote, le compteraient).
  seanceNote(sc, aujourdhui, maintenant) {
    const seance = {
      nom: sc.nom, date: sc.date,
      dureeMin: sc.date === aujourdhui ? Math.min(ECRAN_SEANCE.DUREE_MAX_MIN, Math.max(1, Math.round(L.minutesDepuis(sc.debut, maintenant)))) : 0,
      cardioMin: sc.cardio > 0 && L.toutFait(sc.exos) ? Math.min(ECRAN_SEANCE.CARDIO_MAX_MIN, Math.round(sc.cardio)) : 0,
      exos: sc.exos.filter((x) => !x.echauffement && x.faites.length).map((x) => {
        const o = { nom: x.nom, series: x.faites.map(ECRAN_SEANCE.nettoyer) };
        if (x.reserve) o.reserve = x.reserve;
        return o;
      }),
    };
    const pasFait = sc.exos.filter((x) => x.saute && !x.echauffement && !x.faites.length).map((x) => ({ nom: x.nom, raison: x.saute.raison }));
    if (pasFait.length) seance.pasFait = pasFait;
    const velo = sc.exos.some((x) => x.echauffement && x.faites.length);
    if (sc.veloNiveau > 0 && velo) seance.veloNiveau = sc.veloNiveau;
    if (sc.bilan) seance.bilan = sc.bilan;   // le bilan d'avant la séance, dans l'en-tête de la note
    const approches = sc.exos.filter((x) => !x.echauffement && Array.isArray(x.approches))
      .map((x) => ({ nom: x.nom, series: x.approches.filter((a) => a && a.faite).map((a) => ({ c: a.c != null ? a.c : null, r: a.r })) }))
      .filter((a) => a.series.length);
    if (velo || approches.length) seance.echauffement = { min: velo ? VELO_MIN : 0, approches };
    return seance;
  },
};
