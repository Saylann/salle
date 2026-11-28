// VueSalle : « Avant de commencer » (le bilan), « Ta séance d'aujourd'hui », commencer.
// Le bilan : seulement les 3 questions que « La bonne séance » justifie : une douleur (la sécurité), des courbatures
// fortes (alléger la zone [113]), une nuit de moins de 6 h (pas de record [120]). 2.38.91 (demande : « un bouton au même
// moment que pour les courbatures, pour si on a le temps ») : « Ton temps aujourd'hui ? », Normal ou Peu de temps (la
// version 45 min : superséries, toutes les séries gardées, pas de cardio de fin [20, 36]) ; jamais prérempli. Tout est
// prérempli d'après le carnet Forme, donc un seul toucher si tout va bien. L'accueil, « Ta séance d'aujourd'hui » et
// « Commencer » montrent la même séance préparée (this.seancePreparee). « Ta séance d'aujourd'hui » : la séance en carte
// héros, puis la liste, la petite carte « Pour te lancer » (L.boostAvant) et « Commencer ».
{
  // « Peu de temps » au bilan (2.38.91) : la séance prend sa version 45 min (« La bonne séance », partie 2).
  const DUREE_PEU_DE_TEMPS = 45;

  // ── Petits morceaux de ces écrans ──

  // La séance préparée en liste : l'échauffement (vélo, séries d'approche), chaque exercice numéroté (séries, approches,
  // étage quand il change), les deux exercices d'une supersérie ensemble, le cardio de fin. Une ligne par chose.
  const listeSeance = (sj) => {
    const plan = L.planApproches(sj.exos, sj.superseries);
    const nbApproches = typeof sj.approches === 'number' ? sj.approches : plan.reduce((t, x) => t + (x ? x.length : 0), 0);
    const items = [h('li', { cls: 'salle-li-echauffement', icone: 'echauffement' },
      h('span', { text: `Échauffement · ${VELO_MIN} min de vélo${nbApproches ? `, puis ${seriesLegeres(nbApproches)}` : ''}` }))];
    let numero = 0, etage = L.estEtage && L.estEtage(sj.etageEchauffement) ? sj.etageEchauffement : null;
    const ligne = (x, k) => {
      numero++;
      const details = [];
      if (L.estEtage && L.estEtage(x.etage) && x.etage !== etage) { details.push(L.nomEtage(x.etage)); etage = x.etage; }
      if (plan[k]) details.push(`${seriesLegeres(plan[k].length)} avant`);
      return h('div', { cls: 'salle-li-exo' },
        h('span', { cls: 'salle-li-num salle-nombre', text: String(numero) }),
        h('div', { cls: 'salle-li-texte' },
          h('span', { text: `${x.nom} · ${pluriel(L.nbSeries(x), 'série')}${x.courb ? ' · léger' : ''}` }),
          details.length ? h('span', { cls: 'salle-petit', text: details.join(' · ') }) : null));
    };
    const pris = new Set();
    sj.exos.forEach((x, k) => {
      if (pris.has(k)) return;
      const j = x.groupe ? sj.exos.findIndex((y, m) => m > k && y.groupe === x.groupe) : -1;
      if (j < 0) { items.push(h('li', null, ligne(x, k))); return; }
      pris.add(j);
      items.push(h('li', { cls: 'salle-li-superserie' },
        h('span', { cls: 'salle-petit salle-li-titre', text: 'Supersérie', icone: 'superserie' }),
        ligne(x, k), ligne(sj.exos[j], j)));
    });
    if (sj.duree && sj.duree.cardio > 0) items.push(h('li', { cls: 'salle-li-cardio', icone: 'cardio' }, h('span', { text: `Cardio tranquille · ${sj.duree.cardio} min de vélo` })));
    return h('ol', { cls: 'salle-liste salle-liste-seance' }, items);
  };

  // La petite carte de L.boostAvant (« des petits trucs pour booster avant une séance »), juste avant « Commencer » :
  // « Pour te lancer » : la hausse depuis le début (flèche), la semaine, la première fois. Plus de record annoncé d'avance
  // (2.14.2). Rien à dire, ou un calcul qui échoue : rien (le reste de l'écran s'affiche, la séance se lance).
  const ICONES_BOOST = { progres: 'monter', semaine: 'semaine', depart: 'info', calme: 'valider' };
  const carteBoost = (vue, sj, b) => {
    try {
      const e = vue.plugin.etat;
      const bo = L.boostAvant(sj, e.seances, e.programme, vue.aujourdhui(), reglagesVue(vue.plugin), b);
      if (!bo || !Array.isArray(bo.lignes) || !bo.lignes.length) return null;
      return h('div', { cls: 'salle-boost' },
        h('strong', { cls: 'salle-boost-titre', text: bo.titre }),
        bo.lignes.map((l) => texteCourt(l.texte, `salle-boost-ligne salle-boost-${l.type}`, 'p', { icone: ICONES_BOOST[l.type] || null })));
    } catch (err) {
      signalerErreur(err);
      return null;
    }
  };

  Object.assign(VueSalle.prototype, {
    // ── Le bilan avant la séance, la séance préparée ──
    // Le bilan d'aujourd'hui : la ligne du jour du carnet Forme (la vérité), sinon celui gardé dans data.json.
    // 2.14.5 (demande : après une séance annulée, reposer les questions au prochain départ) : une séance annulée marque le bilan du jour « à refaire » (ECRAN_SEANCE.bilanARefaire) : il ne
    // compte plus, les questions se reposent au prochain départ, préremplies comme d'habitude.
    bilanJour() {
      const p = this.plugin, auj = this.aujourdhui();
      const garde = p.donnees.bilan && p.donnees.bilan.date === auj ? p.donnees.bilan : null;
      if (garde && garde.aRefaire) return null;
      // Le carnet Forme ne garde que la santé : « Peu de temps » (2.38.91) vient du bilan gardé du jour.
      const carnet = L.bilanDuJour(p.etat.forme, auj);
      return carnet && garde && garde.temps > 0 ? Object.assign({}, carnet, { temps: garde.temps }) : carnet || garde;
    },
    // La séance du jour prête à faire (L.preparerSeance) : l'ordre, les superséries à 45 min (réglage), les séries
    // d'approche, la durée calée sur son rythme, le cardio de fin. i : la séance choisie (null = celle du plugin) ;
    // normale : sans les changements du bilan (la séance prévue).
    seancePreparee(i, bilan, normale) {
      const p = this.plugin, e = p.etat, auj = this.aujourdhui();
      const b = normale ? null : bilan || null;
      const reglages = reglagesDuJour(p, b);   // 2.38.91 : « Peu de temps » au bilan = la version 45 min de la séance
      const sj = L.seanceDuJour(e.programme, e.seances, reglages, auj, i, b, e.mesures);
      if (!sj) return null;
      return L.preparerSeance(sj, { seances: e.seances, programme: e.programme, reglages, peuDeTemps: !!(b && b.temps > 0 && reglages.duree === b.temps) });
    },
    // « Commencer la séance du jour » (commande, lien obsidian://salle?ecran=seance) : la séance en cours, sinon le bilan
    // d'avant, ou « Ta séance d'aujourd'hui » s'il est déjà fait.
    ouvrirSeanceDuJour() {
      if (this.plugin.donnees.enCours) { this.aller('seance'); return; }
      this.aller(this.bilanJour() ? 'resume' : 'avant');
    },

    // ── « Avant de commencer » : le bilan ──
    ecranAvant(r) {
      const p = this.plugin, auj = this.aujourdhui();
      if (!this.formeSaisie || this.formeSaisie.date !== auj) this.formeSaisie = L.bilanParDefaut(p.etat.forme, auj);
      const b = this.formeSaisie;
      if (!b.courb || !Array.isArray(b.courb.zones)) b.courb = { niveau: 'aucune', zones: [] };   // un bilan 1.x refait (sans courbatures)
      const fortes = () => b.courb.niveau === 'fortes';
      // Le bilan gardé : les 3 réponses. Des courbatures « légères » (bilan refait d'avant la 2.1.2) ne comptent pas : aucune.
      const bilanDe = (x) => {
        const o = { date: auj, douleur: x.douleur && x.douleur.zone ? { zone: x.douleur.zone, type: x.douleur.type } : null,
          courb: x.courb.niveau === 'fortes' ? { niveau: 'fortes', zones: x.courb.zones.slice() } : { niveau: 'aucune', zones: [] } };
        if (x.sommeil === 'court') o.sommeil = 'court';
        if (x.temps > 0) o.temps = x.temps;
        return o;
      };
      // Des boutons à choix : celui qui est choisi est plein (même style que les réglages).
      const choix = (liste, actif, surClic) => h('div', { cls: 'salle-choix' }, liste.map(([v, t]) => h('button', {
        cls: 'salle-bouton salle-mini' + (actif(v) ? ' salle-principal' : ''), text: t, 'aria-pressed': actif(v) ? 'true' : 'false',
        onclick: () => { surClic(v); this.rendre(); },
      })));
      const question = (t) => h('strong', { cls: 'salle-question', text: t });
      this.entete(r, 'Avant de commencer', true, 'note');
      const valider = async (x, direct) => {
        if (x.douleur && !x.douleur.zone) { new obsidian.Notice('Touche la zone de la douleur.'); return; }
        if (x.courb.niveau === 'fortes' && !x.courb.zones.length) { new obsidian.Notice('Touche où sont les courbatures.'); return; }
        const bilan = bilanDe(x);
        p.donnees.bilan = bilan;
        await p.sauver();
        await p.noterForme(bilan);
        this.formeSaisie = null;
        if (direct) {
          const e = p.etat;
          const sj = L.seanceDuJour(e.programme, e.seances, reglagesDuJour(p, bilan), auj, this.iPrevu, bilan, e.mesures);
          if (sj) { await this.commencer(sj.i, bilan); return; }
        }
        this.aller('resume');
      };
      // Tout va bien : un seul toucher commence la séance. Sinon « Valider » mène à « Ta séance d'aujourd'hui ».
      const ok = L.toutVaBien(b);
      const principal = ok ? ['Tout va bien, commencer', 'commencer', true] : ['Valider', 'valider', false];
      r.appendChild(h('div', { cls: 'salle-carte salle-bilan' },
        b.depuis ? h('p', { cls: 'salle-petit salle-prerempli', text: `Prérempli d'après ton carnet Forme du ${L.dateCourte(b.depuis)} : corrige si ça a changé.`, icone: 'info' }) : null,
        question('Une douleur quelque part ?'),
        choix([[false, 'Non'], [true, 'Oui']], (v) => !!b.douleur === v, (v) => { b.douleur = v ? (b.douleur || { zone: null, type: 'tire' }) : null; }),
        b.douleur ? [
          choix(Object.keys(ZONES_DOULEUR).map((z) => [z, ZONES_DOULEUR[z][3]]), (v) => b.douleur.zone === v, (v) => { b.douleur.zone = v; }),
          choix([['tire', 'Ça tire, comme une courbature'], ['vive', 'Douleur vive, ou dans l\'articulation']], (v) => b.douleur.type === v, (v) => { b.douleur.type = v; }),
        ] : null,
        // Courbatures légères : séance normale, on ne les demande pas (« La bonne séance », Courbatures).
        question('Des courbatures fortes ? (tu ne tends pas le bras à fond)'),
        choix([[false, 'Non'], [true, 'Oui']], (v) => fortes() === v, (v) => { b.courb = v ? { niveau: 'fortes', zones: fortes() ? b.courb.zones : [] } : { niveau: 'aucune', zones: [] }; }),
        fortes() ? [
          h('div', { cls: 'salle-petit', text: 'Où ? Plusieurs choix possibles.' }),
          choix(Object.keys(ZONES_COURB).map((z) => [z, ZONES_COURB[z][2]]), (v) => b.courb.zones.indexOf(v) >= 0, (v) => {
            const k = b.courb.zones.indexOf(v);
            if (k >= 0) b.courb.zones.splice(k, 1); else b.courb.zones.push(v);
          }),
        ] : null,
        question('Ta nuit ?'),
        choix([[false, '6 h ou plus'], [true, 'Moins de 6 h']], (v) => (b.sommeil === 'court') === v, (v) => { if (v) b.sommeil = 'court'; else delete b.sommeil; }),
        this.questionTemps(b, question, choix),
        // « Pour te lancer » aussi ici, juste au-dessus du bouton : « Tout va bien, commencer » lance la séance
        // sans passer par « Ta séance d'aujourd'hui ». Recalculée à chaque réponse (nuit courte → la ligne calme).
        (() => {
          try {
            const bl = bilanDe(b);
            const sj = L.seanceDuJour(p.etat.programme, p.etat.seances, reglagesDuJour(p, bl), auj, this.iPrevu, bl, p.etat.mesures);
            return sj ? carteBoost(this, sj, bl) : null;
          } catch (err) { return null; }
        })(),
        h('button', { cls: 'salle-bouton salle-principal salle-grand', text: principal[0], icone: principal[1], onclick: () => valider(b, principal[2]) }),
        ok ? null : h('button', { cls: 'salle-bouton salle-mini', text: 'Tout va bien, commencer', icone: 'commencer', onclick: () => valider(L.bilanParDefaut([], auj), true) })));
    },

    // « Ton temps aujourd'hui ? » (2.38.91) : Normal, ou Peu de temps (la version 45 min). Chaque choix dit sa durée à son
    // rythme (L.preparerSeance), pour choisir d'un coup d'œil. Rien si les réglages sont déjà à 45 min.
    questionTemps(b, question, choix) {
      const p = this.plugin, e = p.etat, auj = this.aujourdhui();
      if (!(reglagesVue(p).duree > DUREE_PEU_DE_TEMPS)) return null;
      const duree = (temps) => {
        try {
          const bl = Object.assign({}, b, { temps: temps || undefined });
          if (!temps) delete bl.temps;
          const sj = this.seancePreparee(this.iPrevu, bl);
          return sj && sj.duree ? ' · ' + L.fmtTemps(Math.max(5, Math.round(sj.duree.totale / 5) * 5)) : '';
        } catch (err) { return ''; }
      };
      return [question('Ton temps aujourd\'hui ?'),
        choix([[false, 'Normal' + duree(null)], [true, 'Peu de temps' + duree(DUREE_PEU_DE_TEMPS)]], (v) => (b.temps > 0) === v, (v) => { if (v) b.temps = DUREE_PEU_DE_TEMPS; else delete b.temps; })];
    },

    // ── « Ta séance d'aujourd'hui » ──
    ecranResume(r) {
      const p = this.plugin, e = p.etat, auj = this.aujourdhui();
      const b = this.bilanJour();
      if (!b) { this.ecran = 'avant'; this.ecranAvant(r); return; }
      const reglages = reglagesVue(p);
      const sj = this.seancePreparee(this.iPrevu, b);
      if (!sj) { this.ecran = 'accueil'; this.ecranAccueil(r); return; }
      const normale = L.seanceDuJour(e.programme, e.seances, reglages, auj, this.iPrevu, null, e.mesures);
      const change = sj.changements.length > 0 || sj.i !== normale.i || (b.temps > 0 && sj.superseries);   // 2.38.91 : « Peu de temps »
      this.entete(r, 'Ta séance d\'aujourd\'hui', true, 'salle');
      if (sj.alertes.length) r.appendChild(h('div', { cls: 'salle-carte salle-alerte' }, sj.alertes.map((t) => texteCourt(t))));
      if (sj.tropVide) {
        const k = L.autreSeance(e.programme, e.seances, reglages, auj, b, sj.i);
        r.appendChild(h('div', { cls: 'salle-carte salle-alerte' },
          h('strong', { text: `Il ne reste que ${pluriel(sj.exos.length, 'exercice')} dans « ${sj.nom} ».` }),
          h('p', { text: k >= 0 ? `« ${e.programme[k].nom} » en garde plus. Ou repos aujourd'hui.` : 'Mieux vaut le repos aujourd\'hui.' }),
          h('div', { cls: 'salle-choix' },
            k >= 0 ? h('button', { cls: 'salle-bouton salle-principal', text: `Faire « ${e.programme[k].nom} »`, icone: 'remplacer', onclick: () => { this.iPrevu = k; this.rendre(); } }) : null,
            h('button', { cls: 'salle-bouton', text: 'Repos aujourd\'hui', icone: 'sombre', onclick: () => { new obsidian.Notice('Repos aujourd\'hui. Ton bilan est noté dans le carnet Forme.'); this.aller('accueil'); } }))));
      }
      const du = sj.duree;
      const meta = [du ? du.texte : null, pluriel(sj.exos.length, 'exercice'), sj.superseries && sj.exos.some((x) => x.groupe) ? 'superséries' : null].filter(Boolean).join(' · ');
      // La séance du jour en carte héros (sombre, comme sur l'accueil : la même séance a la même allure) ; la liste,
      // « Pour te lancer » et « Commencer » dans une seconde carte, juste dessous.
      r.appendChild(h('div', { cls: 'salle-carte salle-vedette salle-heros salle-heros-resume' },
        h('h3', { cls: 'salle-heros-titre', text: sj.nom }),
        h('p', { cls: 'salle-meta salle-nombre', text: meta }),
        texteCourt(sj.raison, 'salle-raison'),
        ligneBilan(b, 'salle-resume-bilan'),
        // Chaque changement en une ligne ; rien à changer : on le dit une fois.
        change ? sj.changements.map((t) => texteCourt(t, 'salle-dose')) : h('p', { cls: 'salle-dose', text: 'Rien à changer : la séance prévue.' }),
        sj.lignes.map((t) => texteCourt(t, 'salle-dose')),
        sj.legere ? h('p', { cls: 'salle-dose', text: 'Semaine légère : moitié moins de séries, mêmes charges.' }) : null));
      r.appendChild(h('div', { cls: 'salle-carte salle-resume-liste' },
        listeSeance(sj),
        carteBoost(this, sj, b),
        h('button', { cls: 'salle-bouton salle-grand' + (sj.tropVide ? '' : ' salle-principal'), text: sj.tropVide ? 'Commencer quand même' : 'Commencer', icone: 'commencer', onclick: () => this.commencer(sj.i, b) }),
        h('div', { cls: 'salle-choix salle-choix-centre' },
          change ? h('button', { cls: 'salle-bouton salle-mini', text: 'Faire la séance normale', onclick: () => this.commencer(normale.i, b, true) }) : null,
          h('button', { cls: 'salle-bouton salle-mini', text: 'Refaire le bilan', icone: 'recreer', onclick: () => { this.formeSaisie = JSON.parse(JSON.stringify(b)); this.aller('avant'); } }))));
    },

    // ── Commencer ──
    // bilan = le bilan du jour (gardé dans la note de séance) ; normale = sans les changements du bilan.
    // La séance qui commence est la séance préparée, celle que montrent l'accueil et « Ta séance d'aujourd'hui ».
    async commencer(i, bilan, normale) {
      const p = this.plugin, e = p.etat;
      if (!e.programme[i]) return;
      // Un toucher : le bon moment pour réveiller le son (iOS ne joue un son qu'après un geste).
      try { appelPlugin(p, 'preparerSon'); } catch (err) { /* sans son, rien ne change */ }
      const sj = this.seancePreparee(i, bilan, normale);
      if (!sj) return;
      // « series » = le nombre de séries prévues ; « faites » = les séries notées. L'échauffement est le premier exercice.
      p.donnees.enCours = L.nouvelleSeance(sj, this.aujourdhui(), Date.now());
      if (bilan) p.donnees.enCours.bilan = bilan;
      this.iPrevu = null;
      this.apercu = null;
      this.changer = false;
      this.saisie = null;
      await p.sauver();
      this.aller('seance');
    },
  });
}
