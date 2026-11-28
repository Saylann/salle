// VueSalle : l'accueil. De haut en bas : la séance du jour en carte héros (la même séance préparée que « Ta séance
// d'aujourd'hui »), « Bon retour » après plus de 4 jours, la proposition de semaine légère, « Tes progrès » avec le niveau
// en tête (dans la même carte), la semaine en 7 jours, puis les tuiles. La règle du carnet (« est-ce que c'est utile ? Le
// but, c'est de me faire progresser. ») : ce qui peut servir d'excuse pour ne pas y aller est dans les réglages
// (67-reglages.js). Un calcul du niveau qui échoue retire le niveau, rien d'autre.
{
  // ── Petits morceaux de l'accueil ──
  const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  // Les icônes des lignes de « Tes progrès » (L.progresAccueil). Les lignes « rien encore » n'en ont pas.
  const ICONES_PROGRES = { exercice: 'monter', records: 'record', mesure: 'mesures', regularite: 'jours' };

  // Une ligne de « Tes progrès » en deux parties, le nom puis le chiffre en gras (« Tirage vertical » · « 35 → 42,5 kg »).
  // Le texte reste le même (le « : » est gardé, caché à l'écran). Une phrase (« rien encore », couper faux) ou une ligne sans
  // « : » reste d'un seul tenant.
  const ligneProgres = (texte, couper) => {
    const t = String(texte || ''), i = couper ? t.indexOf(' : ') : -1;
    if (i <= 0) return h('span', { cls: 'salle-progres-texte' }, h('span', { cls: 'salle-progres-valeur', text: t }));
    return h('span', { cls: 'salle-progres-texte' },
      h('span', { cls: 'salle-progres-nom', text: t.slice(0, i) }),
      h('span', { cls: 'salle-progres-valeur salle-nombre' }, h('span', { cls: 'salle-progres-deux', text: ':' }), t.slice(i + 3)));
  };

  // Le niveau (L.niveau), ou null si le calcul échoue (une note abîmée ne casse pas l'accueil).
  const niveauSur = (seances, programme, reglages, auj) => {
    try {
      const n = L.niveau(seances, programme, reglages, auj);
      return n && n.niveau >= 1 ? n : null;
    } catch (err) {
      signalerErreur(err);
      return null;
    }
  };
  // Le bloc du niveau en tête de « Tes progrès » : « Niveau 1 · Débutant », « encore 250 XP » sur une ligne (tient à 375 px),
  // la barre lime, puis la phrase de L.conseilNiveau en petit ; dessous, l'échelle des paliers (2.9.0 : l'utilisateur ne voyait pas
  // la ligne « Prochain palier » ; les paliers viennent des séances faites, L.palier). Que des <span> : il est dans le bouton
  // de la carte (un toucher ouvre Progrès).
  const blocNiveau = (niv, phrase) => {
    if (!niv) return null;
    let corps = null;
    try { corps = L.paliersCorps(niv, []); } catch (e) { corps = null; }
    return h('span', { cls: 'salle-niveau-accueil' },
      h('span', { cls: 'salle-niveau-haut' },
        h('span', { cls: 'salle-niveau-nom', text: `Niveau ${niv.niveau} · ${niv.titre}` }),
        h('span', { cls: 'salle-niveau-reste salle-nombre', text: `encore ${L.fmtMilliers(niv.reste)} XP` })),
      barreNiveau(niv.part, { muette: true }),
      phrase ? h('span', { cls: 'salle-niveau-phrase', text: phrase }) : null,
      corps ? echellePaliers(corps, true) : null);
  };

  // La bande de la semaine, du lundi au dimanche : fait (disque plein, coche), prévu (la lettre de la séance), repos
  // (petit point), aujourd'hui (trait épais). Les jours passés sans séance sont du repos : jamais de reproche.
  // nomAuj : la séance proposée aujourd'hui alors que ce n'est pas un jour de salle (semaine en retard), ou ''.
  const bandeSemaine = (programme, seances, auj, jours, nomAuj) => {
    const lundi = L.lundi(auj);
    let plan = [];
    try { plan = L.plan(programme, seances, auj, jours, 7); } catch (e) { plan = []; }   // rien ne bloque l'accueil
    const cases = [];
    for (let k = 0; k < 7; k++) {
      const date = L.plusJours(lundi, k);
      const faites = seances.filter((s) => s && s.date === date);
      const prevu = plan.find((x) => x.date === date);
      const nomPrevu = prevu && programme[prevu.i] ? programme[prevu.i].nom : date === auj && nomAuj ? nomAuj : '';
      const etat = faites.length ? 'fait' : nomPrevu && date >= auj ? 'prevu' : 'repos';
      const dit = etat === 'fait' ? faites.map((s) => s.nom).join(', ') + ' faite' : etat === 'prevu' ? nomPrevu + ' prévue' : 'repos';
      const marque = etat === 'fait' ? (icone('fait') || '✓') : etat === 'prevu' ? lettreSeance(nomPrevu) : '';
      const jour = L.deISO(date).getDate();
      cases.push(h('div', {
        cls: `salle-jour salle-jour-${etat}${date === auj ? ' salle-jour-auj' : ''}`, role: 'listitem',
        'aria-label': `${JOURS[(k + 1) % 7]} ${jour}${date === auj ? ', aujourd\'hui' : ''} : ${dit}`,
      }, h('span', { cls: 'salle-jour-nom', text: LETTRES[k] }), h('span', { cls: 'salle-jour-marque' }, marque),
      h('span', { cls: 'salle-jour-date salle-nombre', text: String(jour) })));
    }
    return h('div', { cls: 'salle-semaine', role: 'list', 'aria-label': 'Ta semaine' }, cases);
  };

  Object.assign(VueSalle.prototype, {
    // ── L'accueil ──
    // De haut en bas : l'en-tête, l'alerte du programme, la séance en cours (ou la semaine légère proposée et la séance du
    // jour), « Tes progrès », le mètre ruban, la pesée, la semaine, « Manger », les tuiles. Chaque carte est sûre (partieSure) : une carte qui
    // échoue disparaît, l'écran reste.
    ecranAccueil(r) {
      const p = this.plugin, e = p.etat, d = p.donnees;
      const reglages = reglagesVue(p);
      const auj = this.aujourdhui();
      const jours = L.joursConseilles(reglages);
      const enPause = L.lundisDe(reglages.pauses).indexOf(L.lundi(auj)) >= 0;
      // Le conseil du jour. Une semaine sans salle ne pousse pas à rattraper (objectif 0).
      const conseil = () => L.conseilDuJour(e.seances, auj, jours, enPause ? 0 : reglages.parSemaine);
      r.appendChild(this.enteteAccueil(auj));
      if (e.programmeSecours) r.appendChild(this.alerteProgramme());
      const leg = this.questionLegCurl();
      if (leg) r.appendChild(leg);
      let sjJour = null;   // la séance du jour préparée (carte du jour), pour la phrase du niveau
      if (d.enCours) r.appendChild(this.carteEnCours(d.enCours, auj));
      else if (e.programme.length) {
        partieSure(r, () => this.carteSemaineLegere(auj, reglages));
        // Le plugin décide la séance du jour et dit pourquoi ; « Changer de séance » reste possible, en petit.
        // La séance préparée (this.seancePreparee) : la même que « Ta séance d'aujourd'hui » et que celle qui commence.
        partieSure(r, () => {
          const jour = conseil();
          const bj = this.bilanJour();
          const sj = this.seancePreparee(this.apercu, bj);
          sjJour = sj;
          return sj ? this.carteDuJour(sj, jour, bj, reglages) : null;
        });
      }
      // « Tes progrès » : juste sous la séance du jour, visible sans faire défiler. Un toucher ouvre l'écran Progrès.
      // Le niveau en tête de la carte (L.niveau, recalculé des notes), la phrase de L.conseilNiveau avec la séance du jour.
      // Un calcul du niveau qui échoue : pas de niveau, la carte et le reste de l'écran restent.
      const niv = niveauSur(e.seances, e.programme, reglages, auj);
      let phrase = '';
      if (niv) { try { phrase = L.conseilNiveau(niv, sjJour) || ''; } catch (err) { phrase = ''; } }
      partieSure(r, () => this.carteProgres(L.progresAccueil(e.seances, e.programme, e.mesures, auj, reglages), niv, phrase));
      partieSure(r, () => this.carteRuban(auj));
      partieSure(r, () => this.lignePesee(auj));
      partieSure(r, () => this.ligneSemaineAccueil(auj, reglages, jours, enPause, conseil));
      partieSure(r, () => this.carteManger(reglages));
      r.appendChild(this.tuilesAccueil());
      // 2.40.6 : sans taille, âge ou sexe, la feuille « Tes calories du jour » par-dessus l'accueil (66b-calories.js).
      partieSure(r, () => (typeof this.fenetreBesoins === 'function' ? this.fenetreBesoins() : null));
      this.animerAccueil(r);
    },

    // L'en-tête : « Salle » en très gros, la date en petit (2.38.58 : plus de bouton plein écran, il l'est d'office).
    enteteAccueil(auj) {
      // 2.38.66 (demande : un bouton en haut à gauche pour ouvrir le volet des fichiers d'Obsidian) : sur téléphone, l'en-tête
      // d'Obsidian (et son bouton du volet) est caché dans le plugin ; ce bouton rond le remplace (téléphone seulement : sur le
      // Mac, l'en-tête d'Obsidian reste, avec son bouton ; il l'a confirmé).
      const volet = this.plugin.mobile() ? h('button', { cls: 'salle-bouton-volet', type: 'button', icone: 'volet', 'aria-label': 'Ouvrir le volet des fichiers', onclick: () => this.ouvrirVolet() }, h('span', { cls: 'salle-repli', text: 'Fichiers' })) : null;
      return h('div', { cls: 'salle-entete salle-entete-accueil' + (volet ? ' salle-avec-volet' : '') }, volet, h('div', { cls: 'salle-titre-seance' }, h('h2', { text: 'Salle', icone: 'salle' }), h('div', { cls: 'salle-petit salle-date-ligne' }, h('span', { text: L.dateLongue(auj) }), this.ligneVersion())));
    },
    // 2.38.85 (demande : à côté de la date, un point et un « ok » pour dire si on est à jour) : « · À jour », ou « · Mettre à
    // jour » (un toucher ouvre la mise à jour) ; rien tant que la version publiée n'est pas connue (hors ligne).
    ligneVersion() {
      const p = this.plugin, etat = L.etatVersion(p.manifest && p.manifest.version, p.versionPubliee);
      if (!etat) return null;
      // « Mettre à jour » est une action : sur sa ligne, sous la date (à côté, elle coupait la date sur un téléphone).
      return etat === 'a-jour'
        ? [h('span', { cls: 'salle-point', text: ' · ' }), h('span', { cls: 'salle-version salle-version-ok', text: 'À jour', icone: 'fait' })]
        : h('button', { cls: 'salle-lien salle-version salle-version-maj', type: 'button', text: 'Mettre à jour', icone: 'monter', onclick: () => appelPlugin(p, 'ouvrirMiseAJour') });
    },
    // La note du programme illisible ou introuvable : rien n'est cassé, le programme d'origine prend le relais.
    // 2.41.10 (« pour mon pote aussi, il faut changer ça » ; puis « on était tout le temps ensemble, c'est oui ») : si des
    // séances d'avant le 27/11/2026 ont un « Leg curl assis », c'était le leg extension (assis, en montant les jambes) :
    // l'historique est corrigé tout seul, une fois (corrigerLegCurl), et une notice le dit. Plus jamais ensuite
    // (reglages.legCurlVu). → rien à afficher (null).
    questionLegCurl() {
      const p = this.plugin, d = p.donnees, e = p.etat;
      if (!d || !d.reglages || d.reglages.legCurlVu || d.enCours || p.legCurlLance) return null;
      if (!(e.seances || []).some((s) => s.date < L.LEG_CURL_AVANT && (s.exos || []).some((x) => x && x.nom === 'Leg curl assis'))) return null;
      p.legCurlLance = true;
      Promise.resolve(appelPlugin(p, 'corrigerLegCurl')).then((n) => {
        new obsidian.Notice(`Ancien « leg curl » = leg extension : ${n || 0} séance${n > 1 ? 's' : ''} corrigée${n > 1 ? 's' : ''}.`, 12000);
        this.rendre();
      }).catch((err) => console.error('Salle :', err));
      return null;
    },
    alerteProgramme() {
      return h('div', { cls: 'salle-carte salle-alerte' },
        h('strong', { text: this.plugin.etat.fichiers.programme ? 'La note du programme est illisible.' : 'La note du programme est introuvable.' }),
        h('p', { text: 'Rien n\'est cassé : j\'utilise le programme d\'origine en attendant.' }),
        boutonRecreerProgramme(this.plugin));
    },
    // La séance en cours, en carte héros (sombre, dégradée), comme la séance du jour.
    carteEnCours(sc, auj) {
      const faites = ECRAN_SEANCE.seriesFaites({ exos: sc.exos || [] });
      return h('div', { cls: 'salle-carte salle-vedette salle-heros salle-en-cours' },
        h('div', { cls: 'salle-petit salle-heros-surtitre', text: sc.date === auj ? 'Séance en cours' : `Séance commencée le ${L.dateCourte(sc.date)}, pas terminée` }),
        h('h3', { cls: 'salle-heros-titre', text: sc.nom }),
        h('p', { cls: 'salle-nombre', text: `${L.pluriel(faites, 'série')} notée${L.s(faites)}.` }),
        h('button', { cls: 'salle-bouton salle-principal salle-grand', text: 'Reprendre la séance', icone: 'commencer', onclick: () => this.aller('seance') }),
        h('button', { cls: 'salle-bouton salle-mini', text: faites ? 'Terminer et enregistrer' : 'Annuler cette séance', icone: faites ? 'terminer' : 'annuler', onclick: () => this.terminer() }));
    },
    // La proposition de semaine légère (L.proposerSemaineLegere) : un avis, jamais imposé. Oui ou non, d'un toucher. Ou null.
    carteSemaineLegere(auj, reglages) {
      const p = this.plugin;
      const legere = L.proposerSemaineLegere(p.etat.seances, auj, reglages);
      if (!legere || typeof p.choisirSemaineLegere !== 'function') return null;
      return h('div', { cls: 'salle-carte salle-proposition' },
        h('strong', { text: 'Semaine légère ?', icone: 'semaine' }),
        texteCourt(legere.texte),
        h('div', { cls: 'salle-choix' },
          h('button', { cls: 'salle-bouton salle-principal', text: 'Oui, cette semaine', icone: 'valider', onclick: async () => { await p.choisirSemaineLegere(legere.lundi, true); this.rendre(); } }),
          h('button', { cls: 'salle-bouton', text: 'Non, pas maintenant', onclick: async () => { await p.choisirSemaineLegere(legere.lundi, false); this.rendre(); } })));
    },
    // Le mètre ruban, le 1er dimanche du mois, tant qu'il n'a pas mesuré sa taille ce mois-ci (L.rappelRuban). Ou null.
    carteRuban(auj) {
      if (!L.rappelRuban(this.plugin.etat.mesures, auj)) return null;
      return h('div', { cls: 'salle-carte salle-rappel-ruban', role: 'status' },
        h('strong', { cls: 'salle-titre-carte', text: 'Mètre ruban et pesée aujourd\'hui', icone: 'mesures' }),
        texteCourt('Poids à jeun, taille au nombril, épaules au plus large.\nPourquoi : c\'est le 1er dimanche du mois, et la balance ne dit pas si tu prends du muscle ou du gras.', 'salle-petit'),
        h('button', { cls: 'salle-bouton', text: 'Mesurer', icone: 'mesures', onclick: () => this.aller('mesures') }));
    },
    // La pesée de la semaine, en une ligne (L.lignePesee) : le jour où il s'est pesé, la tendance et le conseil ; le dimanche
    // sans pesée, le rappel et « Peser ». Ou null.
    lignePesee(auj) {
      const l = L.lignePesee(this.plugin.etat.mesures, auj);
      if (!l) return null;
      return h('div', { cls: 'salle-carte salle-ligne-pesee', role: 'status' },
        texteCourt(l.texte, 'salle-petit'),
        l.bouton ? h('button', { cls: 'salle-bouton salle-mini', text: 'Peser', icone: 'mesures', onclick: () => this.aller('mesures') }) : null);
    },
    // La semaine en 7 jours et l'objectif, en une ligne fine (pas une carte : « le gros bloc semaine, il est pas un peu
    // gros ? » ; comme Motra, Gymkee). La série de semaines est dans « Tes progrès » (à partir de 2) et dans Progrès ; une
    // semaine sans salle prévue le dit en une ligne, sans bouton (elle se prévoit dans Réglages → Salle).
    ligneSemaineAccueil(auj, reglages, jours, enPause, conseil) {
      const e = this.plugin.etat, d = this.plugin.donnees;
      const lundi = L.lundi(auj);
      const faites = (e.seances || []).filter((s) => s && L.deISO(s.date) && s.date <= auj && L.lundi(s.date) === lundi).length;
      let nomAuj = '';
      try {
        if (!d.enCours && conseil().retard) {
          const i = this.apercu != null && e.programme[this.apercu] ? this.apercu : L.choisirSeance(e.programme, e.seances, auj).i;
          nomAuj = e.programme[i] ? e.programme[i].nom : '';
        }
      } catch (x) { nomAuj = ''; }
      return h('div', { cls: 'salle-semaine-fine salle-carte-semaine', 'aria-label': 'Cette semaine' },
        bandeSemaine(e.programme, e.seances, auj, jours, nomAuj),
        rondsSemaine(faites, reglages.parSemaine, true),
        enPause ? h('p', { cls: 'salle-petit salle-pause-ligne', text: 'Semaine sans salle : ta série ne casse pas.' }) : null);
    },
    // Les tuiles. Chacune a sa classe (salle-tuile-guide…) : la teinte de sa pastille (61-accueil.css).
    tuilesAccueil() {
      const note = (type, titre) => h('button', { cls: 'salle-tuile salle-tuile-' + type, text: titre, icone: type, onclick: () => { this.noteType = type; this.sectionOuverte = null; this.aller('note'); } });
      return h('div', { cls: 'salle-tuiles' },
        h('button', { cls: 'salle-tuile salle-tuile-guide', text: 'Comment faire', icone: 'guide', onclick: () => this.aller('guide') }),
        h('button', { cls: 'salle-tuile salle-tuile-mesures', text: 'Mesures', icone: 'mesures', onclick: () => this.aller('mesures') }),
        note('programme', 'Programme'), note('club', 'Ma salle'),   // « Manger » : la carte au-dessus des tuiles (carteManger)
        h('button', { cls: 'salle-tuile salle-tuile-reglages', text: 'Réglages', icone: 'reglages', onclick: () => this.ouvrirReglages() }));
    },
    // À l'ouverture de la vue seulement, les cartes apparaissent en fondu court, l'une après l'autre (salle-apparait, rien si
    // l'appareil demande moins de mouvement). Pas à chaque nouveau dessin (une note qui change) : ça clignoterait ; entre deux
    // écrans, le fondu de la vue suffit (VueSalle.transition).
    animerAccueil(r) {
      if (this.accueilAnime) return;
      this.accueilAnime = true;
      let k = 0;
      for (const el of r.childNodes) {
        if (!el || !el.classList || / salle-entete /.test(' ' + el.className + ' ')) continue;
        el.classList.add('salle-apparait');
        if (el.style) el.style.animationDelay = `${Math.min(k++, 4) * 40}ms`;
      }
    },

    // « Manger », juste sous la semaine. Toute la carte est un bouton : un toucher ouvre la note « Manger » en entier (les
    // aliments, les repas, les courses). Ses lignes : l'objectif de protéines (L.mangerEssentiel), puis le repas lu dans la
    // note (L.repasDuJour). Sans repas lisibles dans la note : l'essentiel d'après les études, en 2 lignes.
    // 2.19.0 : le repas du moment seulement (L.repasDuMoment, d'après l'heure : « Ce soir : … ou … ») ; un toucher ouvre
    // « Manger » sur ce repas, déjà déplié (ses plats). Si la note n'a pas ce repas : tous les repas, comme avant.
    // 2.20.0 : puis quand boire (« Bois : un grand verre d'eau avec ce repas. »).
    carteManger(reglages) {
      const essentiel = L.mangerEssentiel(reglages);
      const texte = (this.plugin.etat.textes || {}).manger;
      const repas = L.repasDuJour(texte);
      // 2.40.2 (demande : « tu vois comment on a poussé “Tes progrès” ; manger est tout aussi important, il faut faire pareil ») :
      // la carte sur le modèle de « Tes progrès » : le creux du jour (VueSalle.suiviAccueil, 66b-calories.js : « Aujourd'hui »,
      // ce qu'il reste, les jauges), puis des lignes à pastille.
      // 2.40.3 (« ça m'arrive de ne pas manger le goûter ou le matin ») : rien ne suppose 4 repas. Les lignes : le prochain
      // repas ; les repas en photo aujourd'hui, avec leurs kcal (comme les exercices de « Tes progrès ») ; l'eau ; les jours
      // validés de la semaine (dès le premier).
      // 2.40.4 (« si le matin je n'ai pas mangé, il doit faire un attendu pour le midi, et de même pour le soir ») : le prochain
      // repas est le premier des attendus (L.attendus : le reste du jour partagé entre les repas qui restent), avec son attendu
      // à droite et ses plats dessous. Journée atteinte : le repas du moment, s'il n'est pas en photo, sans attendu.
      let suivi = null;
      try { suivi = typeof this.suiviAccueil === 'function' ? this.suiviAccueil() : null; } catch (err) { signalerErreur(err); suivi = null; }
      const du = suivi ? suivi.du : [], prochain = suivi && suivi.attendus.length ? suivi.attendus[0] : null;
      const debut = prochain ? L.MOMENTS_REPAS.find((m) => m[0] === prochain.cle)[1] : new Date().getHours();
      const momentVu = L.repasDuMoment(repas, debut);
      const moment = momentVu && (prochain || !du.some((r) => r.quand === momentVu.quand)) ? momentVu : null;
      const ligne = (cls, ic, nom, valeur) => h('span', { cls: 'salle-repas-ligne ' + cls, icone: ic },
        h('span', { cls: 'salle-repas-texte' }, h('span', { cls: 'salle-repas-ligne-nom', text: nom }),
          valeur ? h('span', { cls: 'salle-repas-ligne-valeur salle-nombre', text: valeur }) : null));
      const majuscule = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
      // Le repas à venir : son nom et son attendu sur une ligne, ses plats (reliés par « ou ») dessous.
      const lignePlats = (nom, valeur, quoi) => h('span', { cls: 'salle-repas-ligne salle-repas-plats', icone: 'manger' },
        h('span', { cls: 'salle-repas-texte' },
          h('span', { cls: 'salle-repas-plats-haut' }, h('span', { cls: 'salle-repas-ligne-nom', text: nom }),
            valeur ? h('span', { cls: 'salle-repas-ligne-valeur salle-nombre', text: valeur }) : null),
          quoi ? h('span', { cls: 'salle-repas-quoi', text: majuscule(quoi) + '.' }) : null));
      const lignes = prochain ? [lignePlats(prochain.quand, L.texteAttendu(prochain), moment ? moment.quoi : '')]
        : moment ? [lignePlats(moment.quand, '', moment.quoi)]
          : du.length || momentVu ? []
            : repas.length ? repas.map((x) => lignePlats(x.repas, '', x.quoi))
              : essentiel.slice(1).map((l) => h('span', { cls: 'salle-repas-ligne salle-repas-seule' }, enGras(l)));
      du.forEach((r) => lignes.push(ligne('salle-repas-mange', 'valider', r.plat || r.quand, `${L.fmtMilliers(r.kcal)} kcal`)));
      lignes.push(ligne('salle-repas-eau', 'eau', 'Bois', moment || prochain ? '1 grand verre d\'eau' : '1 grand verre par repas'));
      if (suivi && suivi.valides > 0) lignes.push(ligne('salle-repas-records', 'record', 'Cette semaine', `${L.pluriel(suivi.valides, 'jour')} ${suivi.valides > 1 ? 'validés' : 'validé'}`));
      // La partie de la note à déplier en arrivant : celle du repas montré (son rang dans L.sections), sinon aucune.
      const rang = moment ? L.sections(String(texte)).findIndex((s) => s.titre === moment.repas) : -1;
      // 2.39.1 (demande : « un appareil photo à la place de la flèche, qui ouvre l'appareil photo pour les calories ») : dans la
      // ligne du titre, à la place du ›, « kcal » de « Calories d'un plat » (boutonPhotoPlat, 66b-calories.js).
      // 2.39.7 (capture de l'iPhone : « kcal » tombait sous la carte, à gauche) : il n'est plus posé par-dessus la carte (en
      // position absolue), il est dans sa ligne de titre. La carte n'est donc plus un <button> (un bouton ne peut pas en
      // contenir un autre) mais un bloc qui se touche (rôle « button », Entrée ou Espace au clavier) ; « kcal » arrête son toucher.
      const ouvrir = () => { this.noteType = 'manger'; this.sectionOuverte = rang >= 0 ? rang : null; this.platOuvert = null; this.aller('note'); };
      return h('div', { cls: 'salle-carte salle-manger-accueil', role: 'button', tabindex: '0', onclick: ouvrir,
        onkeydown: (ev) => { if (ev && (ev.key === 'Enter' || ev.key === ' ')) { if (ev.preventDefault) ev.preventDefault(); ouvrir(); } } },
        h('span', { cls: 'salle-progres-tete' }, h('strong', { text: 'Manger', icone: 'manger' }), this.boutonPhotoPlat()),
        suivi ? suivi.bloc : null,
        h('span', { cls: 'salle-repas-lignes' }, lignes));
    },
    // « Tes progrès » : au plus 4 lignes de L.progresAccueil (que du vrai, jamais une baisse). Toute la carte est un bouton.
    // niv (L.niveau, ou null) et phrase (L.conseilNiveau) : le bloc du niveau sous le titre.
    carteProgres(pa, niv, phrase) {
      const lignes = pa && Array.isArray(pa.lignes) ? pa.lignes : [];
      return h('button', { cls: 'salle-carte salle-progres-accueil' + (pa && pa.vide ? ' salle-progres-vide' : ''), type: 'button', onclick: () => this.aller('progres') },
        h('span', { cls: 'salle-progres-tete' },
          h('strong', { text: 'Tes progrès', icone: 'progres' }),
          h('span', { cls: 'salle-progres-ouvrir', 'aria-hidden': 'true' }, icone('ouvrir') || '›')),
        blocNiveau(niv, phrase),
        h('span', { cls: 'salle-progres-lignes' }, lignes.map((l) => h('span', {
          cls: `salle-progres-ligne salle-progres-${l.type}`, icone: ICONES_PROGRES[l.type] || null,
        }, ligneProgres(l.texte, !(pa && pa.vide) && !!ICONES_PROGRES[l.type])))));
    },

    // La grande carte de la séance du jour : « Séance B », « environ 1 h 10 · 8 exercices », le bouton « Commencer ».
    // Au-dessus, « Bon retour » (plus de 4 jours sans séance) ou ce que dit le jour (repos, séance, semaine en retard) ;
    // dessous, ce qui change aujourd'hui, une ligne par chose, et une ligne quand la séance dépasse le temps du jour.
    carteDuJour(sj, jour, bj, reglages) {
      const e = this.plugin.etat, auj = this.aujourdhui();
      const autre = sj.i !== sj.choisie;
      const du = sj.duree;
      // « Bon retour » seulement un jour de séance : une semaine sans salle (malade comprise) dit le repos (L.conseilDuJour).
      const retour = !jour.repos ? L.bonRetour(e.seances, auj) : null;
      const aller = (ecran) => { this.iPrevu = autre ? sj.i : null; this.apercu = null; this.changer = false; this.aller(ecran); };
      const nb = sj.exos.length;
      const meta = [du ? du.texte : null, L.pluriel(nb, 'exercice'), sj.superseries && sj.exos.some((x) => x.groupe) ? 'superséries' : null, sj.legere ? 'semaine légère' : null].filter(Boolean).join(' · ');
      return h('div', { cls: 'salle-carte salle-vedette salle-du-jour salle-heros' + (jour.repos ? ' salle-heros-repos' : '') },
        // « Bon retour » : sans reproche (L.bonRetour).
        retour ? h('div', { cls: 'salle-bon-retour' },
          h('div', { cls: 'salle-bon-retour-texte', icone: 'bonretour' }, h('span', { text: decouper(retour.texte).tete })),
          replis(retour.texte)) : null,
        !retour && jour.texte !== 'Aujourd\'hui : séance.' ? h('div', { cls: 'salle-decision' + (jour.repos ? ' salle-decision-repos' : ''), text: jour.texte, icone: jour.repos ? 'sombre' : 'salle' }) : null,
        // « Aujourd'hui » en petit au-dessus, le nom de la séance en très gros.
        autre ? null : h('div', { cls: 'salle-heros-surtitre', text: jour.repos ? 'Prochaine séance' : 'Aujourd\'hui' }),
        h('h3', { cls: 'salle-heros-titre', text: sj.nom }),
        h('p', { cls: 'salle-meta salle-nombre', text: meta }),
        // 2.5.1 : chaque ligne tient en 2 lignes à 375 px ; la raison du plugin, quand il a choisi de changer, est repliée.
        texteCourt(autre ? `Tu as choisi de changer. Le plugin conseillait « ${e.programme[sj.choisie].nom} ».\nPourquoi : ${decouper(sj.raison).tete}` : sj.raison, 'salle-raison'),
        sj.lignes.map((t) => texteCourt(t, 'salle-dose')),
        sj.legere ? h('p', { cls: 'salle-dose', text: 'Semaine légère : moitié moins de séries, mêmes charges.' }) : null,
        bj ? ligneBilan(bj) : null,
        sj.changements.map((t) => texteCourt(t, 'salle-dose')),
        // L'étage où commencer, juste avant « Commencer » (L.departEtage).
        L.departEtage(sj.exos, reglages.etages) ? h('p', { cls: 'salle-dose salle-depart', text: L.departEtage(sj.exos, reglages.etages) + '.', icone: 'club' }) : null,
        h('button', {
          cls: 'salle-bouton salle-grand' + (jour.repos ? '' : ' salle-principal'), text: jour.repos ? 'Y aller quand même' : 'Commencer', icone: 'commencer',
          // D'abord le bilan (« Avant de commencer »). Déjà fait aujourd'hui et rien à décider (ni alerte, ni changement) : la
          // séance commence tout de suite (2.10.0, demande : le bouton Commencer doit commencer tout de suite) ; sinon
          // « Ta séance d'aujourd'hui » montre ce qui change.
          onclick: () => {
            const direct = bj && typeof this.commencer === 'function' && !sj.alertes.length && !sj.tropVide && !sj.changements.length;
            if (!direct) return aller(bj ? 'resume' : 'avant');
            this.apercu = null;
            this.changer = false;
            return this.commencer(sj.i, bj);
          },
        }),
        // « Changer de séance » (il l'a demandé) : un lien discret sous « Commencer », jamais en avant.
        e.programme.length > 1 ? h('div', { cls: 'salle-choix salle-autres' },
          this.changer || autre
            ? [autre ? h('button', { cls: 'salle-bouton salle-mini', text: `Revenir à « ${e.programme[sj.choisie].nom} »`, icone: 'retour', onclick: () => { this.apercu = null; this.changer = false; this.rendre(); } }) : null]
              .concat(e.programme.map((x, i) => (i === sj.i || i === sj.choisie ? null : h('button', { cls: 'salle-bouton salle-mini', text: x.nom, onclick: () => { this.apercu = i; this.changer = false; this.rendre(); } }))))
            : h('button', { cls: 'salle-lien', text: 'Changer de séance', onclick: () => { this.changer = true; this.rendre(); } })) : null);
    },
  });
}
