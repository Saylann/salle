// VueSalle : le bilan de fin de séance. De haut en bas : la séance et ses trois tuiles en carte héros (durée, séries, charge
// totale, comparées à la dernière séance du même nom : « +6 % », « = », jamais de rouge) ; « Bravo ! », les succès de la séance ; les XP de la séance (« +190 XP »,
// une ligne par vraie action, L.xpSeance) et la barre du niveau qui avance (« Niveau 2 ! » et le titre si la séance fait
// passer un niveau, une animation courte une seule fois) ; les records (avant → après) ; une ligne par exercice (↑, =,
// nouvelle charge) ; la semaine et la prochaine séance ; ce soir (et sa bulle verte, toujours là) ; le
// ressenti. La comparaison vient de this.bilan.compare (posée par l'écran de séance, L.bilanCompare), sinon elle est
// recalculée. Les XP sont calculés avant que l'index relise la note (~/Desktop/CLAUDE/Salle-travail/recherche/2026-11-15-niveaux-contrat.md) : la séance
// notée (b.seance) ajoutée aux séances d'avant, le double écarté. Un calcul qui échoue : pas de carte, le reste s'affiche.
// Une séance qui fait passer un palier (atteint par les XP, L.palier) : une carte plus forte que le niveau, juste
// sous la carte de la séance (« Palier : Régulier ! », la phrase des études, « Me mesurer et prendre la photo », qui ouvre
// Mesures en mode palier).
{
  // ── Petits morceaux du bilan ──
  // Le signe d'un exercice face à la dernière fois : une flèche ou « = », et le sens pour la couleur (le mot reste toujours).
  // « moins » n'a ni flèche ni rouge : gris, sans reproche.
  // L'icône de chaque succès de la carte « Bravo ! » (L.succesSeance).
  const ICONES_SUCCES = { seance: 'valider', records: 'record', progres: 'monter', semaine: 'semaine' };
  const SIGNES = { charge: ['↑', 'plus'], plus: ['↑', 'plus'], egal: ['=', 'egal'], moins: ['', 'moins'], nouveau: ['', 'egal'] };
  // « La bonne séance », Protéines, Récupération et sommeil, Courbatures : le total de protéines du jour [21, 29], 7 à 9 h de
  // sommeil [1, 2], ni bain froid [22] ni ibuprofène [23].
  const CE_SOIR = 'Ce soir : 30 à 40 g de protéines au dîner et 8 h de sommeil. Ni bain froid ni ibuprofène.';
  // En puces d'une ligne, dans la bulle verte sous « Ce soir », toujours là. Courbatures : le massage et la récupération
  // active sont ce qui soulage le plus [114].
  const CE_SOIR_POURQUOI = [
    '**Bain froid, ibuprofène** : ils freinent la prise de muscle.',
    '**Pas besoin de shaker** : c\'est le total de protéines de la journée qui compte.',
    '**Ce soir aussi** : pas d\'alcool, et finis ta séance au moins 1 h avant de dormir.',
    '**Courbatures demain** : marche ou vélo léger 10 à 20 min, masse le muscle 1 à 2 min.',
  ];

  // Les XP de la séance et le niveau, calculés une fois par bilan (b.xp : un nouveau dessin, comme le ressenti, ne refait ni le
  // calcul ni l'animation). → { total, lignes, niv, avant: { niveau, part }, monte, palier } ou null (rien à montrer).
  // palier : le palier que cette séance fait passer (L.palier), ou null.
  const xpDuBilan = (b, avant, programme, reglages, auj) => {
    const x = L.xpSeance(b.seance, avant, programme, reglages);
    if (!x || !(x.total > 0)) return null;
    const niv = L.niveau(avant.concat([b.seance]), programme, reglages, auj);
    const d = niv.derniere;
    // La séance du bilan est la dernière comptée (le cas normal) : son « monte » et son « ancienNiveau » ; sinon (une séance
    // reprise d'un autre jour, une autre notée après), le niveau d'avant elle se recalcule.
    const ici = d && d.date === b.seance.date && L.norm(d.nom) === L.norm(b.seance.nom);
    const sans = ici ? null : L.niveau(avant, programme, reglages, auj);
    const ancien = ici ? d.ancienNiveau : sans.niveau;
    const ancienPalier = ici ? d.ancienPalier : sans.palier && sans.palier.rang;
    const palier = niv.palier && typeof ancienPalier === 'number' && ancienPalier < niv.palier.rang ? niv.palier : null;
    const xpAvant = Math.max(0, niv.xp - (ici ? d.xp : x.total));
    const monte = ancien < niv.niveau;
    // La barre part d'où elle était avant la séance ; après une montée, elle repart de 0 dans le nouveau niveau.
    const depart = monte ? 0 : Math.min(1, Math.max(0, (xpAvant - niv.xpNiveau) / Math.max(1, niv.xpSuivant - niv.xpNiveau)));
    // La séance du bilan est la dernière : ses XP tels que le niveau les compte (« Muscle retrouvé » après un arrêt compris).
    return { total: ici ? d.xp : x.total, lignes: ici ? d.lignes : x.lignes, niv, avant: { niveau: ancien, part: depart }, monte, palier, anime: false };
  };
  // Le palier passé : carte héros, plus forte que la montée de niveau (une fois animée, au premier dessin, comme elle).
  const cartePalier = (vue, b) => {
    const pa = b.xp.palier;
    return h('div', { cls: 'salle-carte salle-heros salle-palier-fete' + (b.xp.anime ? '' : ' salle-palier-anime'), role: 'status' },
      h('span', { cls: 'salle-palier-surtitre salle-nombre', text: `${L.fmtMilliers(pa.xp)} XP` }),
      h('strong', { cls: 'salle-palier-titre', text: `Palier : ${pa.titre} !` }),
      texteCourt(pa.phrase, 'salle-palier-phrase'),
      h('p', { cls: 'salle-petit salle-palier-quoi', text: 'Mesure-toi et prends une photo : au palier suivant, tu compareras.' }),
      h('button', {
        cls: 'salle-bouton salle-principal salle-grand', text: 'Me mesurer et prendre la photo', icone: 'mesures',
        onclick: () => { vue.modePalier = pa.rang; vue.aller('mesures'); },
      }));
  };
  const carteXp = (b) => {
    const x = b.xp, n = x.niv;
    const premiere = !x.anime;   // l'animation seulement au premier dessin du bilan
    x.anime = true;
    return h('div', { cls: 'salle-carte salle-xp-bilan' + (x.monte ? ' salle-xp-monte' : '') + (x.monte && premiere ? ' salle-xp-fete' : '') },
      x.monte ? h('div', { cls: 'salle-xp-montee', role: 'status' },
        h('span', { cls: 'salle-xp-montee-rond salle-nombre', 'aria-hidden': 'true', text: String(n.niveau) }),
        h('span', { cls: 'salle-xp-montee-texte' },
          h('span', { cls: 'salle-xp-montee-titre', text: `Niveau ${n.niveau} !` }),
          h('span', { cls: 'salle-xp-montee-sous', text: n.titre }))) : null,
      h('div', { cls: 'salle-xp-tete' },
        h('span', { cls: 'salle-xp-total salle-nombre', text: `+${L.fmtMilliers(x.total)} XP` }),
        // Après une montée, le bandeau dit déjà le niveau : pas de pastille en double (vu dans l'aperçu).
        x.monte ? null : h('span', { cls: 'salle-pastille salle-pastille-accent salle-xp-niveau', text: `Niveau ${n.niveau} · ${n.titre}` })),
      h('ul', { cls: 'salle-xp-lignes' }, x.lignes.map((l) => h('li', { cls: 'salle-xp-ligne salle-xp-' + l.cle },
        h('span', { cls: 'salle-xp-texte', text: l.texte }), h('span', { cls: 'salle-xp-gain salle-nombre', text: `+${L.fmtMilliers(l.xp)}` })))),
      barreNiveau(n.part, { depart: premiere ? x.avant.part : null, label: `Niveau ${n.niveau} : ${L.fmtMilliers(n.xp - n.xpNiveau)} XP sur ${L.fmtMilliers(n.xpSuivant - n.xpNiveau)}` }),
      h('div', { cls: 'salle-niveau-bornes salle-nombre' },
        h('span', { text: `${L.fmtMilliers(n.xp)} XP` }),
        h('span', { text: `encore ${L.fmtMilliers(n.reste)} XP pour le niveau ${n.niveau + 1}` })));
  };

  Object.assign(VueSalle.prototype, {
    // Le bilan, carte par carte, dans cet ordre : la séance, le palier passé, les XP, les records, exercice par exercice,
    // la suite (la semaine, la prochaine séance, ce soir), le ressenti, le retour à l'accueil.
    ecranBilan(r) {
      const b = this.bilan, p = this.plugin, e = p.etat;
      const auj = this.aujourdhui();
      const reglages = reglagesVue(p);
      const ici = (s) => s === b.seance || (!!b.chemin && s.chemin === b.chemin);
      const avant = (e.seances || []).filter((s) => !ici(s));
      let cmp = b.compare || null;
      if (!cmp) { try { cmp = L.bilanCompare(b.seance, avant); } catch (err) { cmp = null; } }
      this.entete(r, 'Séance enregistrée', false, 'valider');
      r.appendChild(this.carteHerosBilan(b, cmp));
      // Les succès de la séance, juste sous elle (L.succesSeance) : ce qui a été accompli, dit à la fin, jamais annoncé avant.
      partieSure(r, () => this.carteSucces(b, cmp, ici, auj, reglages));
      // Les XP de la séance et le niveau (une seule fois calculés ; null = rien à montrer).
      if (b.xp === undefined) {
        try { b.xp = xpDuBilan(b, avant, e.programme, reglages, auj); } catch (err) {
          b.xp = null;
          signalerErreur(err);
        }
      }
      if (b.xp && b.xp.palier) partieSure(r, () => cartePalier(this, b));
      if (b.xp) partieSure(r, () => carteXp(b));
      // Les records (en or, avec le trophée, avant → après), puis une ligne par exercice.
      const records = cmp ? cmp.records : (b.records || []).map((nom) => ({ nom, texte: 'Record' }));
      if (records.length) r.appendChild(this.carteRecordsBilan(records));
      if (cmp && cmp.exos.length) r.appendChild(this.carteExosBilan(cmp));
      if (!records.length) {
        r.appendChild(h('p', { cls: 'salle-petit salle-titre-section', text: b.premiere ? 'Première séance notée : la prochaine fois, le plugin te dira quoi viser.' : 'Pas de record aujourd\'hui : c\'est normal, ça ne monte pas à chaque séance.' }));
      }
      r.appendChild(this.carteSuiteBilan(b, ici, auj, reglages));
      r.appendChild(this.carteRessenti(b));
      r.appendChild(h('button', { cls: 'salle-bouton salle-grand salle-bouton-carte', text: 'Retour à l\'accueil', icone: 'accueil', onclick: () => { this.bilan = null; this.aller('accueil'); } }));
    },

    // La séance en carte héros : les tuiles et la comparaison (la charge totale en 3e, plus discrète : jamais en vedette).
    carteHerosBilan(b, cmp) {
      const carte = h('div', { cls: 'salle-carte salle-vedette salle-heros salle-heros-bilan' },
        h('h3', { cls: 'salle-heros-titre', text: b.seance.nom }),
        h('div', { cls: 'salle-petit salle-heros-date', text: L.dateLongue(b.seance.date) }));
      if (cmp) {
        carte.appendChild(h('div', { cls: 'salle-tuiles-bilan' }, cmp.tuiles.map((t) => h('div', { cls: 'salle-tuile-bilan' + (t.cle === 'charge' ? ' salle-tuile-discrete' : '') },
          h('div', { cls: 'salle-petit', text: t.titre }),
          h('div', { cls: 'salle-tuile-valeur salle-nombre', text: t.texte }),
          t.ecart ? h('div', { cls: `salle-ecart salle-ecart-${t.sens} salle-nombre`, text: t.ecart }) : null))));
        carte.appendChild(h('p', { cls: 'salle-petit', text: cmp.reference ? `Comparé à « ${cmp.reference.nom} » du ${L.dateCourte(cmp.reference.date)}.` : `Première « ${b.seance.nom} » notée : la prochaine fois, tu verras l'écart.` }));
      } else {
        carte.appendChild(h('p', { cls: 'salle-nombre', text: `${L.pluriel(b.series, 'série')}${b.seance.dureeMin ? ` · ${b.seance.dureeMin} min` : ''}` }));
      }
      if (b.seance.cardioMin) carte.appendChild(h('p', { cls: 'salle-petit', text: `Dont ${b.seance.cardioMin} min de cardio.` }));
      return carte;
    },
    // « Bravo ! » : les succès de la séance, un par ligne, chacun avec son icône dans une pastille (le trophée en or).
    // null s'il n'y a rien à fêter (une séance sans série).
    carteSucces(b, cmp, ici, auj, reglages) {
      const e = this.plugin.etat;
      const seances = (e.seances || []).some(ici) ? e.seances : L.trier((e.seances || []).concat([b.seance]));
      const succes = L.succesSeance(b.seance, cmp, L.cetteSemaine(seances, auj), L.objectifSemaine(reglages), b.plan);
      if (!succes.length) return null;
      return h('div', { cls: 'salle-carte salle-succes', role: 'status' },
        h('strong', { cls: 'salle-succes-titre', text: 'Bravo !' }),
        h('ul', { cls: 'salle-succes-liste' }, succes.map((s) => h('li', { cls: 'salle-succes-ligne salle-succes-' + s.cle, icone: ICONES_SUCCES[s.cle] },
          h('span', { cls: 'salle-succes-texte' }, h('strong', { text: s.titre }), s.detail ? h('span', { cls: 'salle-petit', text: s.detail }) : null)))));
    },
    // Les records de la séance : le nom, et « avant → après ».
    carteRecordsBilan(records) {
      return h('div', { cls: 'salle-carte salle-records salle-etat-record' },
        h('strong', { cls: 'salle-titre-carte', text: records.length > 1 ? `${records.length} records` : 'Un record', icone: 'record' }),
        h('ul', { cls: 'salle-liste-records' }, records.map((x) => h('li', null,
          h('span', { cls: 'salle-record-nom', text: L.nomPour(x.nom, x.texte) }), h('span', { cls: 'salle-nombre', text: x.texte })))));
    },
    // Exercice par exercice : une flèche ou « = », jamais de rouge.
    carteExosBilan(cmp) {
      return h('div', { cls: 'salle-carte salle-bilan-exos' },
        h('div', { cls: 'salle-ligne salle-entre' }, h('strong', { cls: 'salle-titre-carte', text: 'Exercice par exercice' }), cmp.resume ? h('span', { cls: 'salle-petit salle-pastille', text: cmp.resume }) : null),
        cmp.exos.map((x) => {
          const [fleche, sens] = SIGNES[x.signe] || ['', 'egal'];
          return h('div', { cls: 'salle-ligne salle-entre salle-bilan-exo' + (x.record ? ' salle-bilan-exo-record' : '') },
            h('span', { cls: 'salle-bilan-exo-nom', text: x.nom, icone: x.record ? 'record' : null }),
            h('span', { cls: `salle-ecart salle-ecart-${sens}`, text: `${fleche ? fleche + ' ' : ''}${x.texte}` }));
        }));
    },
    // La suite : la semaine (cette séance comprise), la prochaine séance, ce soir.
    carteSuiteBilan(b, ici, auj, reglages) {
      const e = this.plugin.etat;
      const seances = (e.seances || []).some(ici) ? e.seances : L.trier((e.seances || []).concat([b.seance]));
      const faites = L.cetteSemaine(seances, auj);
      let prochaine = null;
      try { prochaine = e.programme.length ? L.plan(e.programme, seances, auj, L.joursConseilles(reglages), 1)[0] : null; } catch (err) { prochaine = null; }
      let texteProchaine = '';
      if (prochaine && e.programme[prochaine.i]) {
        const j = L.joursEntre(auj, prochaine.date);
        const quand = j === 0 ? 'aujourd\'hui' : j === 1 ? 'demain' : L.dateLongue(prochaine.date).replace(/ \d{4}$/, '');
        texteProchaine = `${j > 1 ? 'Demain : repos. ' : ''}Prochaine séance : « ${e.programme[prochaine.i].nom} », ${quand}.`;
      }
      return h('div', { cls: 'salle-carte salle-bilan-suite' },
        h('div', { cls: 'salle-ligne salle-entre' }, h('strong', { cls: 'salle-titre-carte', text: 'Cette semaine', icone: 'semaine' }), rondsSemaine(faites, reglages.parSemaine)),
        texteProchaine ? h('p', { cls: 'salle-conseil', text: texteProchaine }) : null,
        h('p', { cls: 'salle-apres', text: CE_SOIR, icone: 'manger' }),
        consigneVerte(this, CE_SOIR_POURQUOI));
    },
    // Le ressenti (écrit dans l'en-tête de la note de séance).
    carteRessenti(b) {
      const p = this.plugin;
      return h('div', { cls: 'salle-carte' },
        h('strong', { cls: 'salle-titre-carte', text: 'Comment c\'était ?' }),
        h('div', { cls: 'salle-choix salle-ressenti' }, [['facile', 'Facile'], ['bien', 'Bien'], ['dur', 'Dur']].map(([v, t]) => h('button', {
          cls: 'salle-bouton' + (b.ressenti === v ? ' salle-principal' : ''), text: t, 'aria-pressed': b.ressenti === v ? 'true' : 'false',
          onclick: async () => { b.ressenti = v; await appelPlugin(p, 'noterRessenti', b.chemin, v); this.rendre(); },
        }))));
    },
  });
}
