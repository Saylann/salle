// L : la séance en cours (data.json → enCours) : création, reprise, enchaînement, passer, remplacer. Pur.

// ── La séance en cours (data.json → enCours) : création, reprise, enchaînement, passer, remplacer ──
Object.assign(L, {
  derniere(seances, nomExo) {
    const n = L.norm(nomExo);
    for (let i = seances.length - 1; i >= 0; i--) {
      const e = seances[i].exos.find((x) => L.norm(x.nom) === n && x.series.length);
      if (e) return e.reserve ? { date: seances[i].date, series: e.series, reserve: e.reserve } : { date: seances[i].date, series: e.series };
    }
    return null;
  },
  // La fois d'avant (l'avant-dernière), avec dans .avant celle d'avant encore s'il y en a une : pour « bloqué depuis
  // 3 séances » (L.conseil). Même forme que L.derniere.
  avantDerniere(seances, nomExo) {
    const n = L.norm(nomExo), fois = [];
    for (let k = seances.length - 1; k >= 0 && fois.length < 3; k--) {
      const e = seances[k].exos.find((x) => L.norm(x.nom) === n && x.series.length);
      if (e) fois.push(e.reserve ? { date: seances[k].date, series: e.series, reserve: e.reserve } : { date: seances[k].date, series: e.series });
    }
    if (fois.length < 2) return null;
    return fois[2] ? Object.assign({}, fois[1], { avant: fois[2] }) : fois[1];
  },
  // Le prochain exercice : le premier pas fini de la séance, autre que « courant », ou -1.
  // 2.38.72 (demande : machine prise, il fait un autre exercice ; un exercice fait passe en bas de la liste) : le premier
  // pas fini depuis le début, comme le haut de la liste « La séance » : après l'exercice fait à la place, on revient à celui
  // laissé (« tu reviendras au premier »). Avant : le premier pas fini APRÈS « courant » (le laissé pouvait être sauté).
  // 2.40.7 (demande : « une logique où, en fonction de l'exo qu'on vient de faire, on choisit l'exo suivant » ; machine prise,
  // il avait enchaîné deux exercices du même muscle) : après un exercice où des séries ont été faites, si le premier pas fini
  // partage un muscle avec lui (L.musclesExo), le suivant est le premier qui n'en partage aucun, à l'étage où il est (celui
  // de l'exercice fait), sinon à un autre étage ; s'il n'y en a pas, le premier pas fini (comme en 2.38.72).
  // Sa règle 2.38.78 (deux exercices qui se suivent ne partagent aucun muscle) et Zhang 2025 : deux exercices du même
  // muscle enchaînés font perdre du volume (preuve faible : 2 études, sans repos entre les deux).
  suivantPasFini(exos, courant) {
    const reste = [];
    for (let j = 0; j < exos.length; j++) {
      if (j !== courant && !exos[j].echauffement && !exos[j].saute && exos[j].faites.length < exos[j].series) reste.push(j);
    }
    if (!reste.length) return -1;
    const fait = exos[courant];
    if (!fait || fait.echauffement || !fait.nom || !(fait.faites || []).length) return reste[0];
    const m = L.musclesExo(fait.nom);
    const partage = (j) => Object.keys(L.musclesExo(exos[j].nom || '')).some((k) => m[k]);
    if (!partage(reste[0])) return reste[0];
    const ici = reste.find((j) => exos[j].etage === fait.etage && !partage(j));
    if (ici != null) return ici;
    // Pas d'autre muscle à cet étage : un autre étage, plutôt que 7 séries de suite sur le même muscle (« ordre des
    // exercices » : la version retenue les sépare toujours).
    const ailleurs = reste.find((j) => !partage(j));
    return ailleurs != null ? ailleurs : reste[0];
  },
  // Un exercice passé (« Ne pas le faire aujourd'hui ») compte comme fini pour la séance, sans compter de série.
  fini(x) {
    return !!(x.echauffement || x.saute || x.faites.length >= x.series);
  },
  toutFait(exos) {
    return exos.every((x) => x.echauffement || L.fini(x));
  },
  // Les séries qui comptent dans l'avancement : un exercice passé ne compte que ce qui a été fait.
  seriesPrevues(x) {
    return x.saute ? x.faites.length : x.series;
  },
  RAISONS: [['douleur', 'Douleur'], ['fatigue', 'Fatigue'], ['temps', 'Pas le temps'], ['autre', 'Autre']],
  // Les remplaçants d'un exercice : ses variantes (« · ou … »), puis les exercices du programme du même étage (ou sans étage)
  // qui travaillent le même muscle principal (L.musclePrincipal), sauf un geste déjà dans la séance du jour (L.geste).
  // 2.40.7 (capture : pour « Élévations latérales à la machine », il proposait « Développé incliné », déjà fait le même jour
  // aux haltères) : avant, la même famille (« pousser » met ensemble élévations et développés) ; maintenant, le même muscle.
  remplacants(exo, programme, dejaLa) {
    const vus = new Set((dejaLa || []).map((n) => L.norm(n)).concat([L.norm(exo.nom)]));
    // Le même geste avec un autre matériel (machine prise → haltères) est le meilleur remplaçant ; seuls les gestes des AUTRES
    // exercices du jour sont exclus.
    const gestes = new Set((dejaLa || []).filter((n) => L.norm(n) !== L.norm(exo.nom)).map((n) => L.geste(n)));
    const out = [];
    const ajouter = (a) => { const k = L.norm(a.nom); if (!vus.has(k)) { vus.add(k); out.push(a); } };
    (Array.isArray(exo.alternatives) ? exo.alternatives : []).forEach(ajouter);
    const muscle = L.musclePrincipal(exo.nom);
    (programme || []).forEach((sea) => sea.exos.forEach((x) => {
      if (!muscle || L.musclePrincipal(x.nom) !== muscle || gestes.has(L.geste(x.nom))) return;
      if (exo.etage >= 0 && x.etage >= 0 && x.etage !== exo.etage) return;
      ajouter({ nom: x.nom, corps: !!x.corps, programme: x });
    }));
    return out;
  },
  // Le geste d'un exercice, sans le matériel : « Développé incliné à la machine » et « … aux haltères » → « developpe incline ».
  geste(nom) {
    return L.norm(nom).replace(/\([^)]*\)/g, ' ').replace(/\s+(a la|aux|au|a|avec)\s+(machine|halteres?|poulie|barre|cable|disques?|smith|elastique)\b.*$/, '').replace(/\s+/g, ' ').trim();
  },
  // Remplacer un exercice (machine prise), sans rien modifier : une copie avec le nouveau nom et « poids du corps » ;
  // fourchette, unité, repos, pas et réglage de l'exercice du programme qui porte ce nom s'il y en a un, sinon ceux de l'ancien
  // (le réglage du banc de l'ancien ne suit jamais). L'ancien rejoint les remplaçants, avec son réglage, pour pouvoir revenir.
  // Groupe, étage, drapeaux du bilan et approches (décochées) sont gardés. La cible suit : elle se calcule sur le nouveau nom.
  // seances (facultatif) : un remplaçant jamais fait part à 2 séries (« la première fois en 2 séries »).
  // poids (facultatif) : celui des réglages, pour la charge de départ du remplaçant.
  remplacer(exo, alt, programme, seances, poids) {
    const n = Object.assign({}, exo);
    if (!alt || !alt.nom) return n;
    const k = L.norm(alt.nom);
    let src = alt.programme || null;
    (programme || []).forEach((s) => (s && Array.isArray(s.exos) ? s.exos : []).forEach((x) => { if (!src && L.norm(x.nom) === k) src = x; }));
    const ancien = Object.assign({ nom: exo.nom, corps: !!exo.corps }, exo.reglage ? { reglage: exo.reglage } : {});
    n.alternatives = (Array.isArray(exo.alternatives) ? exo.alternatives : []).filter((x) => x && L.norm(x.nom) !== k).concat([ancien]);
    n.nom = alt.nom;
    n.corps = !!alt.corps;
    // 2.37.0 : les mots de la ligne de l'exercice remplacé (« disques », « à vide ») ne valent pas pour le remplaçant.
    delete n.vide;
    delete n.disques;
    if (src) ['min', 'max', 'unite', 'repos', 'pas', 'vide', 'disques'].forEach((c) => { if (src[c] != null) n[c] = src[c]; });
    else if (/halteres/.test(k)) {
      // Un remplaçant aux haltères sans ligne à lui dans le programme : le pas des haltères du programme (le plus gros), pas
      // celui de l'appareil remplacé : jamais une charge qui n'existe pas.
      const pasH = [];
      (programme || []).forEach((s) => (s && Array.isArray(s.exos) ? s.exos : []).forEach((x) => { if (/halteres/.test(L.norm(x.nom)) && x.pas > 0) pasH.push(x.pas); }));
      if (pasH.length) n.pas = Math.max(...pasH);
    } else if (/poulie/.test(k)) {
      // 2.40.8 (« ou Élévations latérales à la poulie » en B) : un remplaçant à la poulie sans ligne à lui : le plus petit pas
      // des poulies du programme (la poulie d'un bras, comme l'extension triceps), pas celui de la machine remplacée.
      const pasP = [];
      (programme || []).forEach((s) => (s && Array.isArray(s.exos) ? s.exos : []).forEach((x) => { if (/poulie/.test(L.norm(x.nom)) && x.pas > 0) pasP.push(x.pas); }));
      if (pasP.length) n.pas = Math.min(...pasP);
    }
    const reg = src ? src.reglage : alt.reglage;
    if (reg) n.reglage = reg; else delete n.reglage;
    delete n.monReglage;   // noté pour l'exercice remplacé, pas pour celui-ci
    if (Array.isArray(exo.faites)) n.faites = exo.faites.slice();
    // (check-up 2.38.64) un remplaçant au poids du corps ou au temps n'a pas de séries légères (le plan n'en donne pas, 32-dose).
    if (n.corps || n.unite === 's') delete n.approches;
    else if (Array.isArray(exo.approches)) n.approches = exo.approches.map((a) => { const x = Object.assign({}, a, { faite: false }); delete x.c; return x; });
    if (Array.isArray(seances) && seances.length && n.series > 2 && !L.derniere(seances, n.nom)) n.series = Math.max(2, (n.faites || []).length);
    // La charge de départ suit le nouveau nom (L.chargeDepart, d'après le poids des réglages).
    const depart = L.chargeDepart(n, poids, seances);
    if (depart) n.depart = depart; else delete n.depart;
    return n;
  },
  // La séance en cours, au départ : l'échauffement (le vélo), puis les exercices, chacun avec ses séries d'approche
  // (L.planApproches) et son groupe de supersérie. Prend une séance préparée (L.preparerSeance) ou brute (sans groupe).
  nouvelleSeance(sj, date, debut) {
    const source = (sj.exos || []).filter((x) => x && !x.echauffement);
    const plan = L.planApproches(source, !!sj.superseries);
    const exos = source.map((x, j) => {
      const e = Object.assign({}, x, { faites: [] });
      delete e.echauffeSerie;
      delete e.approches;
      if (plan[j]) e.approches = plan[j].map((a) => Object.assign({}, a, { faite: false }));
      if (sj.legere) e.legere = true;
      return e;
    });
    const ech = L.exoEchauffement();
    if (L.estEtage(sj.etageEchauffement)) ech.etage = sj.etageEchauffement;   // L.ordonnerSeance
    return {
      version: 2, nom: sj.nom, date, debut, decouverte: !!sj.decouverte, legere: !!sj.legere, superseries: !!sj.superseries,
      courant: 0, reposFin: 0, reposTotal: 0, echauffeFin: 0, chronoDebut: 0,
      cardio: sj.duree ? sj.duree.cardio : null, dureePrevue: sj.duree ? sj.duree.totale : null,
      tempsJour: sj.duree ? sj.duree.temps : null,   // pour décider du cardio à la fin (L.cardioAuBout)
      exos: [ech].concat(exos),
    };
  },
  // Une séance en cours écrite par la 1.14.0 ou la 1.15.0 (data.json), remise à la forme actuelle (version: 2), sans
  // toucher l'original (copie profonde). La série d'échauffement (echauffeSerie) devient une approche (10 répétitions à 50 %) ; « une série
  // d'échauffement en plus » (echauffePlus) devient une approche très légère s'il n'a encore rien fait. Le reste est gardé tel quel.
  // Déjà à la forme actuelle : une copie. null → null. Jamais d'erreur : en cas de problème, l'entrée telle quelle.
  migrerEnCours(x) {
    if (x == null) return null;
    try {
      const sc = JSON.parse(JSON.stringify(x));
      if (sc.version >= 2) return sc;
      (Array.isArray(sc.exos) ? sc.exos : []).forEach((e) => {
        if (!e || typeof e !== 'object' || e.echauffement) return;
        let ap = Array.isArray(e.approches) ? e.approches : [];
        const es = e.echauffeSerie;
        if (es && typeof es === 'object') {
          ap = ap.concat([es.faite ? { pct: 50, r: es.r || 10, faite: true, c: es.c != null ? es.c : null } : { pct: 50, r: 10, faite: false }]);
        }
        delete e.echauffeSerie;
        if (e.echauffePlus && !(Array.isArray(e.faites) && e.faites.length) && !ap.some((a) => a && a.plus)) {
          ap = [{ pct: 30, r: 10, plus: true, faite: false }].concat(ap);
        }
        if (ap.length) e.approches = ap; else delete e.approches;
      });
      sc.version = 2;
      sc.superseries = false;
      return sc;
    } catch (err) {
      return x;
    }
  },
  // Où aller après une série (à appeler APRÈS l'avoir ajoutée à exo.faites ; sc.courant = l'exercice qui vient d'être fait).
  // Tout fait → fin. Supersérie : le partenaire pas fini qui a fait moins de séries, sans repos (on marche à l'autre machine) ;
  // sinon le premier exercice pas fini du groupe, après 1 min 30 (la fin du tour) ; groupe fini → l'exercice suivant pas fini,
  // avec le repos de l'exercice. Exercice seul : pas fini → lui-même, son repos ; fini → le suivant pas fini, son repos.
  apresSerie(sc) {
    const exos = sc && Array.isArray(sc.exos) ? sc.exos : [];
    const i = sc && sc.courant >= 0 ? sc.courant : 0;
    const x = exos[i];
    if (L.toutFait(exos)) return { courant: i, repos: 0, fin: true };
    const repos = x && x.repos > 0 && !x.echauffement ? x.repos : 0;
    if (x && x.groupe && !x.echauffement) {
      const g = [];
      exos.forEach((e, j) => { if (e.groupe === x.groupe) g.push(j); });
      const p = g.find((j) => j !== i);
      if (p != null && !L.fini(exos[p]) && exos[p].faites.length < x.faites.length) return { courant: p, repos: 0, fin: false };
      const k = g.find((j) => !L.fini(exos[j]));
      if (k != null) return { courant: k, repos: L.DUREE.tour, fin: false };
    } else if (x && !x.echauffement && !L.fini(x)) {
      return { courant: i, repos, fin: false };
    }
    const j = L.suivantPasFini(exos, i);
    return { courant: j >= 0 ? j : i, repos, fin: false };
  },
  // La ligne du repos qui annonce la suite (à appeler après L.apresSerie, sc.courant déjà mis à jour) : { index, texte }.
  //  même exercice → « Ensuite : série 2 · 60 kg × 11 » ; partenaire → « Ensuite : Leg curl assis (supersérie) · 25 kg × 10 » ;
  //  autre exercice → « Ensuite : Leg curl assis · Étage 1 · l'axe en face du genou », et à part, en gros (cible) : « 25 kg × 10 · 3 séries »
  //  (2.38.49, demande : pas besoin d'écrire « Réglage » : le réglage sans son étiquette)
  //  (2.38.1, demande : voir la charge et le nombre de séries pendant le repos) ; tout fait → « Ensuite : cardio tranquille, puis c'est fini. »
  // depuis (facultatif) = l'index de l'exercice qui vient d'être fait ; sans lui, on le déduit des séries faites.
  suite(sc, seances, guide, depuis) {
    const exos = sc && Array.isArray(sc.exos) ? sc.exos : [];
    const i = sc ? sc.courant : -1;
    const x = exos[i];
    if (!x || L.toutFait(exos)) return { index: i, texte: sc && sc.cardio === 0 ? 'Ensuite : c\'est fini.' : 'Ensuite : cardio tranquille, puis c\'est fini.' };
    if (x.echauffement) return { index: i, texte: 'Ensuite : l\'échauffement.' };
    const ss = Array.isArray(seances) ? seances : [];
    const p = x.groupe ? exos.findIndex((e, j) => j !== i && e.groupe === x.groupe) : -1;
    let vient;
    if (depuis != null && depuis >= 0) vient = depuis === i ? 'meme' : depuis === p ? 'partenaire' : 'autre';
    else if (p >= 0 && (exos[p].faites.length > x.faites.length || (exos[p].faites.length === x.faites.length && x.faites.length > 0 && i < p))) vient = 'partenaire';
    else vient = x.faites.length ? 'meme' : 'autre';
    const cible = () => {
      const der = L.derniere(ss, x.nom);
      return L.cibleSerie(x, L.conseil(x, der, L.avantDerniere(ss, x.nom)), der, x.faites).gros;
    };
    if (vient === 'meme') {
      const der = L.derniere(ss, x.nom);
      const legere = L.legereAFaire(x, L.cibleSerie(x, L.conseil(x, der, L.avantDerniere(ss, x.nom)), der, []).charge);
      // 2.38.53 (demande : réécrire « Ensuite : série 2 · 7,5 kg × 10 » plus beau) : la série en petit (« série 2 sur 3 »),
      // la charge à part, en gros (cible), comme avant un nouvel exercice.
      if (legere) return { index: i, texte: `Ensuite : série légère ${legere.n} sur ${legere.sur}`, cible: legere.gros };
      return { index: i, texte: `Ensuite : série ${x.faites.length + 1}${x.series > 0 ? ` sur ${x.series}` : ''}`, cible: cible() };
    }
    if (vient === 'partenaire') return { index: i, texte: `Ensuite : ${x.nom} (supersérie)`, cible: cible() };
    const morceaux = [x.nom];
    if (L.estEtage(x.etage)) morceaux.push(L.nomEtage(x.etage));
    const reglage = L.texteReglage(x, guide);
    if (reglage) morceaux.push(reglage.replace(/^(?:Réglage|Position) : /, ''));
    const n = x.series > 0 ? ` · ${x.series} série${x.series > 1 ? 's' : ''}` : '';
    return { index: i, texte: 'Ensuite : ' + morceaux.join(' · '), cible: cible() + n };
  },
});
