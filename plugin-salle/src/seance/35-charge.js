// L : les charges qui existent sur un appareil, ce qu'on peut y faire (les répétitions prévues à une autre charge), où
// monter et où redescendre, les disques à mettre de chaque côté. Pur. Le conseil qui s'en sert : 36-conseil.js.
// Les sources : objectifs/esthetique/recherche/Sources du programme.md, « 2.37.0 ».

Object.assign(L, {
  // Les nombres du calcul.
  //  PENTE : à l'échec, on fait à peu près (100 − % du maximum) / 2 répétitions (méta-régression de 269 études et 7 289
  //    personnes [Nuzzo 2024] ; cet ajustement colle à 0,5 répétition près entre 50 et 90 % du maximum). D'une charge à une
  //    autre : prévues = 50 − (nouvelle / ancienne) × (50 − capacité). C'est une moyenne : d'une personne à l'autre, environ
  //    3 répétitions d'écart, et personne n'a testé ce calcul sur une même personne qui change de charge : la séance
  //    suivante corrige, et la dernière série, toujours ouverte (L.cibleSerie), donne la vraie mesure.
  //  RESERVE : ce que sa réponse ajoute aux répétitions faites. La borne basse de chaque réponse : on a en général plus de
  //    réserve qu'on ne le dit (0,95 répétition en moyenne [Halperin 2022]). Sans réponse : rien.
  //  MARGE : une répétition de sécurité au-dessus du bas de la fourchette (choix de prudence).
  //  PLAFOND : jamais plus de 20 % de hausse d'un coup en plusieurs crans (choix de prudence : le plus gros ajustement du
  //    tableau de [Helms 2018]).
  //  REPS_MAX : l'ajustement ne colle au tableau de [Nuzzo 2024] que jusqu'à 26 répétitions (50 % du maximum) ; au-delà,
  //    ni le calcul ni les preuves ne valent.
  CHARGE: { PENTE: 50, RESERVE: { 0: 0, '1-2': 1, '3+': 3 }, MARGE: 1, PLAFOND: 1.2, REPS_MAX: 26 },

  // Le poids qui s'ajoute à la charge notée (la barre, quand on ne note que les disques). Il compte dans la taille d'un saut :
  // 5 kg de disques sur une barre de 10 kg, passer à 7,5 kg fait +17 %, pas +50 %. Écrit sur la ligne du programme
  // (« à vide 12 kg ») ; sinon une barre en Z : 10 kg (7 à 12 kg selon les barres), une autre barre : 20 kg ; sinon 0 (le bras
  // d'une machine à disques, le chariot d'une presse : inconnus, et 0 rend le calcul prudent).
  aVide(exo) {
    if (!exo) return 0;
    if (exo.vide >= 0) return exo.vide;
    const n = L.norm(exo.nom || '');
    if (/barre (fixe|de traction)/.test(n)) return 0;
    return /barre (en z|ez)\b/.test(n) ? 10 : /\bbarre\b/.test(n) ? 20 : 0;
  },
  // Le bas de la fourchette avec sa tolérance : un quart dessous (8 → 6, 10 → 8, 12 → 9). Entre les deux, on garde la charge et
  // on regagne des répétitions ; plus bas, c'était trop lourd. Sans cette marge, une prévision fausse de 2 répétitions fait
  // monter, redescendre, remonter sans fin (vu en simulation, tests/t35-charge.js) : le calcul vaut à 3 répétitions près
  // d'une personne à l'autre [Nuzzo 2024], et un peu sous la fourchette le muscle grossit autant [Schoenfeld 2017]. Avis.
  plancher(exo) {
    return Math.ceil(exo.min * 0.75);
  },
  // Une charge ramenée à une charge qui existe sur l'appareil : le cran du dessous (une charge notée hors de la grille,
  // 42,5 kg sur une pile de 5 en 5, redevient 40), jamais sous un cran.
  cranDessous(exo, c) {
    const pas = L.pasDe(exo);
    return Math.max(pas, L.arrondi2(Math.floor((c + 1e-9) / pas) * pas));
  },
  // Les répétitions qu'il peut faire à cette charge en allant à l'échec, d'après la dernière série (celle dont il a dit la
  // réserve) : ce qu'il a fait, plus sa réserve (3 au plus). Les répétitions sont un fait, la réserve un avis.
  capacite(reps, reserve) {
    const faites = Array.isArray(reps) && reps.length ? reps[reps.length - 1] || 0 : 0;
    return Math.min(L.CHARGE.REPS_MAX, faites + (L.CHARGE.RESERVE[reserve] || 0));
  },
  // Les répétitions prévues à l'échec à une autre charge (L.CHARGE.PENTE), le poids à vide compté.
  repsPrevues(exo, charge, capacite, autre) {
    const v = L.aVide(exo), P = L.CHARGE.PENTE;
    return P - ((autre + v) / (charge + v)) * (P - capacite);
  },
  // La capacité à atteindre à cette charge pour passer au cran du dessus sans tomber sous le bas de la fourchette.
  passage(exo, charge, cran) {
    const v = L.aVide(exo), P = L.CHARGE.PENTE;
    return Math.ceil(P - ((P - (exo.min + L.CHARGE.MARGE)) * (charge + v)) / (cran + v) - 1e-9);
  },
  // Où monter : le cran du dessus s'il y fera au moins le bas de la fourchette (plus la marge) ; puis les crans suivants
  // tant qu'il y ferait encore le milieu de la fourchette, sans dépasser le plafond (une charge beaucoup trop légère se
  // rattrape en deux séances). Le cran du dessus est encore trop haut : la charge elle-même.
  chargeMontee(exo, charge, capacite) {
    const pas = L.pasDe(exo), C = L.CHARGE, v = L.aVide(exo);
    const prevu = (c) => L.repsPrevues(exo, charge, capacite, c);
    const cran = L.arrondi2(L.cranDessous(exo, charge) + pas);
    if (prevu(cran) < exo.min + C.MARGE) return charge;
    const milieu = Math.ceil((exo.min + exo.max) / 2);
    let c = cran;
    for (let n = L.arrondi2(c + pas); prevu(n) >= milieu && n + v <= C.PLAFOND * (charge + v) + 1e-9; n = L.arrondi2(n + pas)) c = n;
    return c;
  },
  // Où redescendre quand c'était trop lourd : le cran du dessous ; un de plus si, d'après le calcul, il n'y ferait pas
  // encore le bas de la fourchette. Jamais sous un cran.
  chargeBaissee(exo, charge, capacite) {
    const pas = L.pasDe(exo);
    const base = L.cranDessous(exo, charge);
    let c = base < charge ? base : Math.max(pas, L.arrondi2(charge - pas));
    if (c > pas && L.repsPrevues(exo, charge, capacite, c) < exo.min + L.CHARGE.MARGE) c = Math.max(pas, L.arrondi2(c - pas));
    return c;
  },
  // Sa dernière charge sur le même appareil avec une autre prise (deux noms qui ne diffèrent que par « prise … » : « Tirage
  // vertical prise large » et « prise neutre »), ou 0. D'une prise à l'autre, la charge est la même à 5 % près [Andersen 2014].
  chargeJumeau(seances, nom) {
    const base = (n) => L.norm(n || '').replace(/\s+prise\s+\S+$/, '');
    const moi = L.norm(nom || ''), b = base(nom);
    const ss = Array.isArray(seances) ? seances : [];
    for (let i = ss.length - 1; i >= 0; i--) {
      const e = (ss[i].exos || []).find((x) => L.norm(x.nom) !== moi && base(x.nom) === b && Array.isArray(x.series) && x.series.length);
      const c = e ? L.chargeMax(e.series) : 0;
      if (c > 0) return c;
    }
    return 0;
  },

  // ── Les disques ──
  // Un appareil qu'on charge avec des disques, pareil des deux côtés : écrit sur sa ligne du programme (« disques »), ou dit
  // par son nom (« … à disques », une barre).
  aDisques(exo) {
    if (!exo || exo.echauffement || exo.corps) return false;
    const n = L.norm(exo.nom || '');
    return !/barre (fixe|de traction)/.test(n) && (!!exo.disques || /disques|\bbarre\b/.test(n));
  },
  // Les disques d'une salle, du plus facile au plus difficile à trouver : les gros sont les plus nombreux (dotation conseillée
  // par machine : six de 20 kg, quatre de 10, quatre de 5 ; les petits viennent des râteliers de barres).
  DISQUES: [20, 10, 5, 2.5, 1.25],
  // Les disques à mettre de chaque côté pour une charge totale, les plus gros d'abord : 25 → [10, 2,5]. Une charge qui ne se
  // fait pas avec ces disques : [].
  parCote(total) {
    let reste = Math.round((total / 2) * 100);   // en centièmes de kilo, pour compter juste
    const out = [];
    for (const d of L.DISQUES) {
      const k = Math.round(d * 100);
      while (reste >= k) { out.push(d); reste -= k; }
    }
    return reste === 0 ? out : [];
  },
  // « Par côté : 10 + 2,5 » (« 2 × 20 + 5 » quand un disque revient), ou '' : pas un appareil à disques, pas de charge.
  texteParCote(exo, charge) {
    if (!(charge > 0) || !L.aDisques(exo)) return '';
    const groupes = [];
    L.parCote(charge).forEach((d) => {
      const g = groupes[groupes.length - 1];
      if (g && g.d === d) g.n++; else groupes.push({ d, n: 1 });
    });
    return groupes.length ? 'Par côté : ' + groupes.map((g) => (g.n > 1 ? `${g.n} × ` : '') + L.fmt(g.d)).join(' + ') : '';
  },
  // 2.41.15 : aux haltères, la charge notée est celle d'un haltère : « Dans chaque main : 8 kg » (un seul bras à la fois,
  // « … à un bras » : « Un haltère de 8 kg ») ; '' sinon.
  texteParMain(exo, charge) {
    if (!(charge > 0) || !exo || exo.corps || exo.echauffement || L.aDisques(exo)) return '';
    const n = L.norm(exo.nom || '');
    if (!/halteres?\b/.test(n)) return '';
    return /un bras|unilateral/.test(n) ? `Un haltère de ${L.fmt(charge)} kg` : `Dans chaque main : ${L.fmt(charge)} kg`;
  },
});
