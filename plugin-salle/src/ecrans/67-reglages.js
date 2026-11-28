// VueSalle : les premières questions (sans réglages) et les réglages en deux onglets, Salle et Appli.
// Ce qui peut servir d'excuse pour ne pas y aller (« Semaines sans salle ») est ici, pas sur l'accueil.
{
  // ── Petits morceaux des réglages ──
  // « Semaine du 18 janvier » (d'après son lundi), ou « Cette semaine ».
  const nomSemaine = (lundi, lundiAuj) => {
    if (lundi === lundiAuj) return 'Cette semaine';
    const d = L.deISO(lundi);
    return d ? `Semaine du ${d.getDate() === 1 ? '1er' : d.getDate()} ${MOIS[d.getMonth()]}` : String(lundi);
  };

  // Une ligne de réglage : le nom, et un bouton qui dit l'état (« Activé » plein, « Coupé » vide).
  const interrupteur = (texte, actif, surClic) => h('div', { cls: 'salle-ligne salle-entre salle-reglage-ligne' },
    h('span', { text: texte }),
    h('button', { cls: 'salle-bouton salle-mini' + (actif ? ' salle-principal' : ''), text: actif ? 'Activé' : 'Coupé', 'aria-pressed': actif ? 'true' : 'false', onclick: surClic }));

  // Les questions du premier lancement et de « Réinitialiser ». Rien n'est écrit avant la dernière réponse : quitter en
  // route ne change rien. Types : choix (un toucher), jours (à cocher), semaine (une liste de lundis), poids (un nombre).
  const QUESTIONS = [
    { cle: 'niveau', titre: 'Tu as déjà fait de la musculation en salle ?', choix: [['jamais', 'Jamais'], ['un peu', 'Quelques fois'], ['regulier', 'Régulièrement']] },
    // 3 séances au plus, avec un jour de repos entre deux [26] ; 2 ou 3 : même résultat [47].
    { cle: 'jours', type: 'jours', titre: 'Quels jours tu vas à la salle ?', note: 'Conseillé : 3 jours, avec un jour de repos entre deux.' },
    { cle: 'duree', titre: 'Combien de temps par séance ?', choix: [[45, '45 min'], [60, '1 h'], [75, '1 h 15']], note: 'Sans compter le trajet.' },
    // Le plus petit ajout aux haltères (L.adapter) : de 2 en 2, aucun exercice aux haltères ne monte de moins de 2 kg.
    { cle: 'pasHalteres', titre: 'Les haltères de ta salle vont de combien en combien ?', choix: [[1, 'De 1 en 1 kg'], [2, 'De 2 en 2 kg'], [0, 'Je ne sais pas']] },
    // La semaine légère de ses examens [34, 35].
    { cle: 'semainesLegeres', type: 'semaine', titre: 'Ta prochaine semaine d\'examens ?', note: 'Cette semaine-là, tes séances seront plus légères.' },
    // Sa salle (L.salleLue), pour l'écran « Ma salle » ; facultatif. 2.22.0 : plus rien de sa salle n'est écrit dans le code.
    { cle: 'salle', type: 'salle', titre: 'Ta salle ?', note: 'Tu peux laisser vide.' },
    // Où sont les appareils (L.etagesLus) : la séance est rangée par étage, pour monter et descendre le moins possible.
    { cle: 'etages', type: 'etages', titre: 'Ta salle a plusieurs étages ?', note: 'La séance sera rangée pour monter et descendre le moins possible.' },
    // Le point de départ des paliers : taille, poids, tours (« La bonne séance », Mesures) et la photo, tout facultatif.
    { cle: 'corps', type: 'corps', titre: 'Ton corps aujourd\'hui ?', note: 'Le matin, à jeun. Tours au plus large, bras contracté. Photo de face et de profil.' },
  ];
  // Les champs de « Ton corps aujourd'hui » : [clé, nom, unité, min, max]. hauteur va dans les réglages ; le reste dans Mesures.
  const CHAMPS_CORPS = [['hauteur', 'Taille', 'cm', 120, 230], ['poids', 'Poids', 'kg', 30, 200], ['taille', 'Tour de taille', 'cm', 40, 200],
    ['epaules', 'Tour d\'épaules', 'cm', 60, 200], ['bras', 'Tour de bras', 'cm', 15, 70]];
  // Ce que « Réinitialiser » garde : l'onglet Appli (rien n'y règle l'entraînement).
  const GARDES_A_LA_REMISE = ['son', 'vibration', 'chronoIphone', 'appareils', 'lectureSeule', 'age', 'ageLe', 'sexe'];

  Object.assign(VueSalle.prototype, {
    // ── L'écran « questions » : les réglages, ou le questionnaire (premier lancement, ou après « Réinitialiser ») ──
    // Réglages : deux onglets. « Salle » règle l'entraînement (jours, semaines sans salle, semaines légères, « Réinitialiser ») ;
    // « Appli » garde le technique (minuteur de l'iPhone, bip, vibration, test de l'appareil, lien, thème, lecture seule,
    // séances notées, note du programme). L'onglet choisi reste celui de la vue (this.ongletReglages), Salle au départ.
    ecranQuestions(r) {
      const reg = this.plugin.donnees.reglages;
      if (reg && !this.questionnaire) {
        this.entete(r, 'Réglages', true, 'reglages');
        const onglet = this.ongletReglages === 'appli' ? 'appli' : 'salle';
        r.appendChild(this.ongletsReglages(onglet));
        if (onglet === 'appli') this.reglagesAppli(r, reg);
        else this.reglagesSalle(r, reg);
        return;
      }
      this.entete(r, reg ? 'Réinitialiser' : 'Bienvenue', !!reg, 'reglages');
      const n = Math.min(this.question, QUESTIONS.length - 1);
      const q = QUESTIONS[n];
      const suivante = () => { this.question = n + 1; this.rendre(); };
      const carte = h('div', { cls: 'salle-carte' },
        h('div', { cls: 'salle-petit', text: `Question ${n + 1} sur ${QUESTIONS.length}` }),
        h('h3', { text: q.titre }));
      if (q.type === 'jours') carte.appendChild(this.questionJours(reg, suivante));
      else if (q.type === 'semaine') carte.appendChild(this.questionSemaine(reg, suivante));
      else if (q.type === 'salle') carte.appendChild(this.questionSalle(reg, suivante));
      else if (q.type === 'etages') carte.appendChild(this.questionEtages(reg, suivante));
      else if (q.type === 'corps') carte.appendChild(this.questionCorps(reg));
      else {
        // La réponse actuelle est déjà pleine : refaire les questions va vite.
        const actuel = (v) => (q.cle in this.reponses ? this.reponses[q.cle] === v : !!reg && (reg[q.cle] || 0) === v);
        carte.appendChild(h('div', { cls: 'salle-choix' }, q.choix.map(([v, t]) => h('button', {
          cls: 'salle-bouton' + (actuel(v) ? ' salle-principal' : ''), text: t, 'aria-pressed': actuel(v) ? 'true' : 'false',
          onclick: () => { this.reponses[q.cle] = v; suivante(); },
        }))));
      }
      if (q.note) carte.appendChild(h('p', { cls: 'salle-petit', text: q.note }));
      r.appendChild(carte);
      if (n > 0) r.appendChild(h('div', { cls: 'salle-choix' }, h('button', { cls: 'salle-bouton salle-mini', text: 'Question d\'avant', icone: 'retour', onclick: () => { this.question = n - 1; this.rendre(); } })));
    },
    // Les jours à cocher, puis « Valider ». Au départ : ses jours actuels, sinon lundi, mercredi, vendredi.
    questionJours(reg, suivante) {
      if (!Array.isArray(this.reponses.jours)) this.reponses.jours = reg ? L.joursConseilles(reg).slice() : [1, 3, 5];
      const jours = this.reponses.jours;
      const boite = h('div', null,
        h('div', { cls: 'salle-choix' }, [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Jeu'], [5, 'Ven'], [6, 'Sam'], [0, 'Dim']].map(([j, nom]) => h('button', {
          cls: 'salle-bouton salle-mini' + (jours.indexOf(j) >= 0 ? ' salle-principal' : ''), text: nom, 'aria-pressed': jours.indexOf(j) >= 0 ? 'true' : 'false',
          onclick: () => { this.reponses.jours = (jours.indexOf(j) >= 0 ? jours.filter((x) => x !== j) : jours.concat([j])).sort(); this.rendre(); },
        }))),
        // Le nombre de séances par semaine que ça fait (3 au plus : un jour de repos entre deux).
        h('p', { cls: 'salle-jours-nombre' }, enGras(`**${pluriel(Math.min(3, jours.length), 'séance')} par semaine**${jours.length > 3 ? ' (3 au plus)' : ''}`)),
        L.joursSeSuivent(jours) ? h('p', { cls: 'salle-petit salle-attention', text: 'Garde au moins un jour entre deux séances.' }) : null,
        h('div', { cls: 'salle-choix' }, h('button', {
          cls: 'salle-bouton salle-principal', text: 'Valider', icone: 'valider',
          onclick: () => { if (!jours.length) { new obsidian.Notice('Choisis au moins un jour.'); return; } suivante(); },
        })));
      return boite;
    },
    // La semaine d'examens : les 26 lundis qui viennent, ou aucune.
    questionSemaine(reg, suivante) {
      const lundiAuj = L.lundi(this.aujourdhui());
      // (check-up 2.38.64) « Changer mes réponses » en gardant tout : la semaine légère de cette semaine n'est plus repoussée à la
      // suivante, et les autres semaines légères à venir (les finaux) restent.
      const futures = (reg && Array.isArray(reg.semainesLegeres) ? reg.semainesLegeres : []).filter((l) => L.deISO(l) && L.lundi(l) >= lundiAuj).sort();
      const avant = futures[0];
      const choisie = Array.isArray(this.reponses.semainesLegeres) ? this.reponses.semainesLegeres[0] : avant;
      const lundis = Array.from({ length: 27 }, (x, k) => L.plusJours(lundiAuj, 7 * k));
      let valeur = lundis.indexOf(choisie) >= 0 ? choisie : lundis[0];   // suivie au changement : sûr partout
      const menu = h('select', { cls: 'dropdown salle-choix-semaine', 'aria-label': 'Semaine d\'examens' },
        lundis.map((l) => h('option', { value: l, text: nomSemaine(l, lundiAuj), selected: l === valeur ? 'selected' : null })));
      menu.addEventListener('change', () => { if (L.deISO(menu.value)) valeur = menu.value; });
      return h('div', null, menu,
        h('div', { cls: 'salle-choix' },
          h('button', { cls: 'salle-bouton salle-principal', text: 'Valider', icone: 'valider', onclick: () => { this.reponses.semainesLegeres = [valeur].concat(futures.filter((l) => l !== avant && l !== valeur)); suivante(); } }),
          h('button', { cls: 'salle-bouton', text: 'Pas d\'examens prévus', onclick: () => { this.reponses.semainesLegeres = []; suivante(); } })));
    },
    // Sa salle : son nom, son adresse ou sa ville, comment il y va (pré-remplis). « Chercher sur Google Maps » ouvre la
    // recherche de ce qu'il a écrit, pour retrouver l'adresse ; rien n'est envoyé sans ce toucher. Sans nom : pas de salle.
    questionSalle(reg, suivante) {
      const avant = 'salle' in this.reponses ? this.reponses.salle : (reg ? reg.salle : null);
      const champ = (cle, nom, exemple) => h('input', { type: 'text', cls: 'salle-champ salle-champ-texte', placeholder: exemple, 'aria-label': nom, value: avant && avant[cle] ? avant[cle] : null });
      const champs = { nom: champ('nom', 'Nom de la salle', 'Nom de la salle'), adresse: champ('adresse', 'Adresse ou ville', 'Adresse ou ville'), trajet: champ('trajet', 'Comment tu y vas', 'Comment tu y vas (bus, à pied…)') };
      const lue = () => L.salleLue({ nom: champs.nom.value, adresse: champs.adresse.value, trajet: champs.trajet.value });
      return h('div', null,
        h('div', { cls: 'salle-salle-champs' }, champs.nom, champs.adresse, champs.trajet),
        h('button', {
          cls: 'salle-lien', type: 'button', text: 'Chercher sur Google Maps', icone: 'club',
          onclick: () => { const url = L.urlCarte(lue()); if (!url) { new obsidian.Notice('Écris d\'abord le nom de ta salle.'); return; } try { window.open(url); } catch (e) { console.error('Salle :', e); } },
        }),
        h('div', { cls: 'salle-choix' }, h('button', { cls: 'salle-bouton salle-principal', text: 'Valider', icone: 'valider', onclick: () => { this.reponses.salle = lue(); suivante(); } })));
    },
    // Les étages : celui des machines et celui des haltères (RDC, 1, 2, 3), ou « Un seul étage ».
    questionEtages(reg, suivante) {
      if (!('etages' in this.reponses)) this.reponses.etages = reg && reg.etages ? Object.assign({}, reg.etages) : null;
      const e = this.reponses.etages || {};
      const rang = (cle, nom) => h('div', { cls: 'salle-etages-rang' },
        h('span', { cls: 'salle-petit', text: nom }),
        h('div', { cls: 'salle-choix' }, [[0, 'RDC'], [1, '1'], [2, '2'], [3, '3']].map(([n, t]) => h('button', {
          cls: 'salle-bouton salle-mini' + (e[cle] === n ? ' salle-principal' : ''), text: t, 'aria-pressed': e[cle] === n ? 'true' : 'false',
          onclick: () => { this.reponses.etages = Object.assign({}, e, { [cle]: n }); this.rendre(); },
        }))));
      return h('div', null,
        rang('machines', 'Les machines et les poulies'),
        rang('halteres', 'Les haltères et les bancs'),
        h('div', { cls: 'salle-choix' },
          h('button', {
            cls: 'salle-bouton salle-principal', text: 'Valider', icone: 'valider',
            onclick: () => {
              if (!L.etagesLus(this.reponses.etages)) { new obsidian.Notice('Choisis deux étages différents, ou « Un seul étage ».'); return; }
              this.reponses.etages = L.etagesLus(this.reponses.etages);
              suivante();
            },
          }),
          h('button', { cls: 'salle-bouton', text: 'Un seul étage', onclick: () => { this.reponses.etages = null; suivante(); } })));
    },
    // La dernière question : taille, poids, tours (pré-remplis avec les dernières valeurs) et la photo de départ. « Valider »
    // écrit les réglages (L.reglagesDesReponses) ; seules les valeurs changées vont dans Mesures.
    questionCorps(reg) {
      const p = this.plugin;
      const avant = L.dernieresMesures(p.etat.mesures, reg);
      const champs = CHAMPS_CORPS.map(([cle, nom, unite]) => [cle, h('input', {
        type: 'number', inputmode: 'decimal', step: '0.5', placeholder: unite, cls: 'salle-champ salle-nombre', 'aria-label': nom,
        // (check-up 2.38.64) ce qui est tapé reste après la photo (l'écran est redessiné).
        value: this.reponses.tape && cle in this.reponses.tape ? this.reponses.tape[cle] : avant[cle] != null ? String(avant[cle]) : null,
      })]);
      const finir = () => {
        const corps = {};
        for (const [cle, champ] of champs) {   // un champ vide ne note rien
          const v = L.nombre(champ.value), def = CHAMPS_CORPS.find((c) => c[0] === cle);
          if (champ.value === '' || champ.value == null) continue;
          if (v == null || v < def[3] || v > def[4]) { new obsidian.Notice(`${def[1]} : écris un nombre en ${def[2]}, ou laisse vide.`); return; }
          corps[cle] = v;
        }
        if (this.reponses.photo) corps.photo = this.reponses.photo;
        return this.finirQuestions(corps, avant);
      };
      const photoOk = typeof p.peutPhoto === 'function' && p.peutPhoto();
      return h('div', null,
        h('div', { cls: 'salle-corps-champs' }, champs.map(([cle, champ]) => {
          const def = CHAMPS_CORPS.find((c) => c[0] === cle);
          return h('label', { cls: 'salle-corps-champ' }, h('span', { cls: 'salle-petit', text: def[1] }), h('span', { cls: 'salle-ligne' }, champ, h('span', { text: def[2] })));
        })),
        photoOk ? champPhoto(this.reponses.photo ? 'Photo prise : la reprendre' : 'Photo de départ', false, async (octets) => { this.reponses.photo = octets; this.reponses.tape = Object.fromEntries(champs.map(([c, e]) => [c, e.value])); this.rendre(); }) : null,
        h('div', { cls: 'salle-choix' }, h('button', { cls: 'salle-bouton salle-principal', text: 'Valider', icone: 'valider', onclick: () => finir() })),
        reg ? h('p', { cls: 'salle-petit', text: 'Tes réglages repartent de ces réponses. Tes séances et tes anciennes mesures restent.' }) : null);
    },
    // Les réponses → les réglages, écrits en une fois ; les mesures changées dans « Mesures » (une ligne du jour), puis la photo.
    async finirQuestions(corps, avant) {
      const p = this.plugin, c = corps || {}, auj = this.aujourdhui();
      p.donnees.reglages = L.reglagesDesReponses(p.donnees.reglages, Object.assign({}, this.reponses, { hauteur: c.hauteur }), c.poids != null ? c.poids : null);
      await p.sauver();
      const m = L.mesuresChangees(c, avant || {});
      if (m) await p.ajouterMesure(Object.assign({ date: auj }, m));
      if (c.photo && typeof p.ajouterPhoto === 'function') await p.ajouterPhoto(c.photo, auj);
      if (typeof p.creerDonnees === 'function') await p.creerDonnees();   // le dossier des données au complet (ce qui manque)
      this.questionnaire = false;
      this.question = 0;
      this.reponses = {};
      this.aller('accueil');
    },

    // Le sélecteur des deux onglets des réglages, en haut de l'écran.
    ongletsReglages(onglet) {
      return h('div', { cls: 'salle-onglets', role: 'tablist', 'aria-label': 'Réglages' },
        [['salle', 'Salle', 'salle'], ['appli', 'Appli', 'reglages']].map(([cle, texte, ic]) => h('button', {
          cls: 'salle-bouton salle-mini salle-onglet' + (cle === onglet ? ' salle-principal' : ''), role: 'tab', 'aria-selected': cle === onglet ? 'true' : 'false',
          text: texte, icone: ic,
          onclick: () => {
            if (cle === onglet) return;
            this.ongletReglages = cle;
            this.rendre();
            if (this.contentEl) this.contentEl.scrollTop = 0;
            this.dernierY = 0;   // (check-up 2.38.64) pas une remontée du doigt : la barre d'Obsidian reste cachée
          },
        })));
    },

    // ── Onglet Salle : ce qui règle l'entraînement ──
    reglagesSalle(r, reg) {
      const p = this.plugin;
      const lundiAuj = L.lundi(this.aujourdhui());
      // Les jours de salle (le plus utile en premier). Une nouvelle liste à chaque fois : jamais modifiée en place.
      partieSure(r, () => {
        const mesJours = L.joursConseilles(reg);
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: 'Mes jours de salle', icone: 'jours' }),
          h('div', { cls: 'salle-choix' }, [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Jeu'], [5, 'Ven'], [6, 'Sam'], [0, 'Dim']].map(([j, nom]) => h('button', {
            cls: 'salle-bouton salle-mini' + (mesJours.indexOf(j) >= 0 ? ' salle-principal' : ''), text: nom, 'aria-pressed': mesJours.indexOf(j) >= 0 ? 'true' : 'false',
            onclick: async () => {
              const neuf = mesJours.indexOf(j) >= 0 ? mesJours.filter((x) => x !== j) : mesJours.concat([j]);
              if (!neuf.length) { new obsidian.Notice('Garde au moins un jour.'); return; }
              reg.jours = neuf.sort();
              reg.parSemaine = Math.min(3, neuf.length);   // 48 h entre deux séances : 3 au plus [26]
              await p.sauver();
              this.rendre();
            },
          }))),
          // « La bonne séance » : au moins 48 h entre deux séances (A et B travaillent les mêmes muscles) [26]. L'accueil ne propose
          // jamais une séance le lendemain d'une autre ; plus de 3 jours cochés : 3 séances au plus.
          L.joursSeSuivent(mesJours)
            ? h('p', { cls: 'salle-petit salle-attention', text: 'Garde au moins un jour entre deux séances.' })
            : h('p', { cls: 'salle-petit', text: mesJours.length > 3 ? 'L\'accueil te propose 3 séances au plus ces jours-là, avec un jour de repos entre deux.' : `${pluriel(mesJours.length, 'séance')} par semaine, ces jours-là.` }));
      });
      partieSure(r, () => this.carteSansSalle(reg, lundiAuj));
      // Les semaines légères prévues (par défaut, celle des finaux). Retirer remplace la liste (jamais modifiée en place).
      partieSure(r, () => {
        const legeres = (Array.isArray(reg.semainesLegeres) ? reg.semainesLegeres : []).filter((l) => L.deISO(l) && L.lundi(l) >= lundiAuj).sort();
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: 'Semaines légères', icone: 'semaine' }),
          legeres.length ? legeres.map((l) => h('div', { cls: 'salle-ligne salle-entre salle-reglage-ligne' },
            h('span', { text: nomSemaine(L.lundi(l), lundiAuj) }),
            h('button', {
              cls: 'salle-bouton salle-mini', text: 'Retirer', icone: 'annuler',
              onclick: async () => { reg.semainesLegeres = reg.semainesLegeres.filter((x) => x !== l); await p.sauver(); this.rendre(); },
            })))
            : h('p', { cls: 'salle-petit', text: 'Aucune de prévue. Après 8 semaines sans, l\'accueil t\'en proposera une.' }),
          h('p', { cls: 'salle-petit', text: 'Séries divisées par deux, mêmes charges.' }));
      });
      const questionnaire = () => { this.questionnaire = true; this.question = 0; this.reponses = {}; this.effacer = false; this.rendre(); if (this.contentEl) this.contentEl.scrollTop = 0; this.dernierY = 0; };
      // Changer ses réponses : les questions du premier lancement, déjà remplies (rien n'est écrit avant la dernière réponse).
      partieSure(r, () => h('div', { cls: 'salle-carte' },
        h('strong', { text: 'Changer mes réponses', icone: 'modifier' }),
        h('p', { cls: 'salle-petit', text: `${QUESTIONS.length} questions, déjà remplies. Tes séances et tes mesures restent.` }),
        h('button', { cls: 'salle-bouton', text: 'Changer mes réponses', icone: 'modifier', onclick: questionnaire })));
      // Réinitialiser (2.28.0) : le dossier des données part à la corbeille, puis le questionnaire le recrée en entier.
      // Deux touchers, comme pour supprimer une séance ; la corbeille n'est dite qu'au moment d'effacer.
      partieSure(r, () => h('div', { cls: 'salle-carte' },
        h('strong', { text: 'Réinitialiser', icone: 'defaire' }),
        h('p', { cls: 'salle-petit', text: 'Efface tes séances, tes mesures et tes réponses, puis repose les questions.' }),
        this.effacer ? h('p', { cls: 'salle-petit salle-alerte-texte', text: 'Tout ira dans la corbeille du Mac ou de l\'iPhone : tu pourras le récupérer.' }) : null,
        h('div', { cls: 'salle-choix' },
          h('button', {
            cls: 'salle-bouton' + (this.effacer ? ' salle-danger' : ''), text: this.effacer ? 'Toucher encore : tout effacer' : 'Réinitialiser', icone: 'defaire',
            onclick: async () => {
              if (!this.effacer) { this.effacer = true; this.rendre(); return; }
              if (typeof p.effacerDonnees === 'function' && await p.effacerDonnees()) questionnaire(); else { this.effacer = false; this.rendre(); }
            },
          }),
          this.effacer ? h('button', { cls: 'salle-bouton salle-mini', text: 'Annuler', icone: 'annuler', onclick: () => { this.effacer = false; this.rendre(); } }) : null)));
    },
    // « Semaines sans salle » : l'ancienne « Pause cette semaine » de l'accueil, prévue à l'avance. Même stockage
    // (reglages.pauses, des lundis ; plugin.basculerPause) : L.regularite et l'écran Progrès ne changent pas. Le choix propose
    // les 12 semaines qui viennent, puis la semaine en cours, en dernier (s'il est malade : marquée aussi dans reglages.malade,
    // pour reprendre à moitié des séries, L.apresMaladie).
    carteSansSalle(reg, lundiAuj) {
      const p = this.plugin;
      const prevues = L.lundisDe(reg.pauses).filter((l, n, t) => l >= lundiAuj && t.indexOf(l) === n).sort();
      const retirer = async (l) => {
        const brutes = (Array.isArray(reg.pauses) ? reg.pauses : []).filter((x) => L.deISO(x) && L.lundi(x) === l);
        if (typeof p.basculerPause === 'function' && brutes.length === 1 && brutes[0] === l) await p.basculerPause(l);
        else {
          const garder = (liste) => (Array.isArray(liste) ? liste : []).filter((x) => !(L.deISO(x) && L.lundi(x) === l));
          reg.pauses = garder(reg.pauses);
          reg.malade = garder(reg.malade);
          await p.sauver();
        }
        this.rendre();
      };
      const choix = [];
      for (let k = 1; k <= 12; k++) { const l = L.plusJours(lundiAuj, 7 * k); if (prevues.indexOf(l) < 0) choix.push([l, nomSemaine(l, lundiAuj)]); }
      if (prevues.indexOf(lundiAuj) < 0) choix.push([lundiAuj, 'Cette semaine (malade)']);
      let menu = null;
      if (typeof p.basculerPause === 'function' && choix.length) {
        menu = h('select', { cls: 'dropdown salle-choix-semaine', 'aria-label': 'Ajouter une semaine sans salle' },
          h('option', { value: '', text: 'Ajouter une semaine…' }),
          choix.map(([l, t]) => h('option', { value: l, text: t })));
        menu.addEventListener('change', async () => {
          const l = menu.value;
          if (!l || !L.deISO(l)) return;
          await p.basculerPause(L.lundi(l), L.lundi(l) === lundiAuj);
          this.rendre();
        });
      }
      // Juste au-dessus du choix « Cette semaine (malade) » : quand le choisir, et les signes sans séance [126] (pas sur
      // l'accueil : ce serait une excuse). La reprise à moitié des séries, c'est « Avant de commencer » qui la dit.
      const malade = menu && prevues.indexOf(lundiAuj) < 0
        ? puces(['**Fièvre, frissons, courbatures partout** : choisis « Cette semaine (malade) ».', '**Mal à respirer, douleur dans la poitrine** : pas de séance, va voir un médecin.'], 'salle-petit salle-malade')
        : null;
      return h('div', { cls: 'salle-carte salle-sans-salle' },
        h('strong', { text: 'Semaines sans salle', icone: 'pause' }),
        // « Semaine de partiels : 2 séances, avec 1 série de plus aux exercices de dos, d'épaules et de pecs » (L.adapter, D5).
        puces(['**Vacances** : prévois-la ici.', '**Partiels** : plutôt 2 séances, avec 1 série de plus au dos, aux épaules et aux pecs.'], 'salle-petit'),
        prevues.map((l) => h('div', { cls: 'salle-ligne salle-entre salle-reglage-ligne' },
          h('span', { text: nomSemaine(l, lundiAuj) }),
          h('button', { cls: 'salle-bouton salle-mini', text: 'Retirer', icone: 'annuler', 'aria-label': `Retirer : ${nomSemaine(l, lundiAuj).toLowerCase()}`, onclick: () => retirer(l) }))),
        malade, menu);
    },

    // ── Onglet Appli : le technique (rien ici ne change l'entraînement) ──
    reglagesAppli(r, reg) {
      const p = this.plugin, e = p.etat;
      // Pendant la séance : le minuteur de l'iPhone, le bip, la vibration, puis le test de l'appareil.
      partieSure(r, () => {
        const basculer = (cle) => async () => { reg[cle] = reg[cle] === false; await p.sauver(); this.rendre(); };
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: 'Pendant la séance', icone: 'repos' }),
          interrupteur(`Minuteur de l'iPhone (« ${RACCOURCI} »)`, !!reg.chronoIphone, async () => { reg.chronoIphone = !reg.chronoIphone; await p.sauver(); this.rendre(); }),
          texteCourt(`Il reste sur l'écran verrouillé et sonne à la fin du repos.\nComment : à créer une fois dans l'app Raccourcis : « ${RACCOURCI} », une seule action « Lancer le minuteur », réglée sur « Entrée du raccourci » secondes.`, 'salle-petit'),
          interrupteur('Bip à la fin du repos', reg.son !== false, basculer('son')),
          interrupteur('Vibration à « Série faite »', reg.vibration !== false, basculer('vibration')),
          h('div', { cls: 'salle-choix' },
            typeof this.ecranDiagnostic === 'function' ? h('button', { cls: 'salle-bouton salle-mini', text: 'Tester cet appareil', icone: 'diagnostic', onclick: () => this.aller('diagnostic') }) : null),
          typeof this.ecranDiagnostic === 'function' ? h('p', { cls: 'salle-petit', text: 'Le test dit ce qui marche sur cet appareil.' }) : null);
      });
      // Le lien de la séance (raccourci, widget, bouton de l'écran verrouillé), comme dans les réglages d'Obsidian.
      partieSure(r, () => {
        const lien = L.lienSalle(typeof p.nomCoffre === 'function' ? p.nomCoffre() : '', 'seance');
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: 'Lien de la séance', icone: 'lien' }),
          h('p', { cls: 'salle-petit', text: 'Pour un raccourci ou un widget : il ouvre ta séance du jour.' }),
          h('div', { cls: 'salle-petit salle-diag-lien', text: lien }),
          typeof p.copier === 'function' ? h('div', { cls: 'salle-choix' }, h('button', { cls: 'salle-bouton salle-mini', text: 'Copier le lien', icone: 'lien', onclick: () => p.copier(lien, 'Lien copié.') })) : null);
      });
      // La clé de « Calories d'un plat » (66b-calories.js).
      partieSure(r, () => this.carteCleIA());
      partieSure(r, () => this.carteBesoins());   // 2.39.3 : taille, âge, sexe → les calories du jour
      partieSure(r, () => {
        const sombre = typeof document !== 'undefined' && document.body && document.body.classList.contains('theme-dark');
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: sombre ? 'Apparence : mode sombre' : 'Apparence : mode clair', icone: sombre ? 'sombre' : 'clair' }),
          h('div', { cls: 'salle-choix' }, h('button', {
            cls: 'salle-bouton', text: sombre ? 'Passer en mode clair' : 'Passer en mode sombre', icone: sombre ? 'clair' : 'sombre',
            onclick: () => { appelPlugin(p, 'basculerTheme', !sombre); plusTard(() => this.rendre(), 250); },
          })),
          h('p', { cls: 'salle-petit', text: 'Le réglage vaut pour tout Obsidian sur cet appareil.' }));
      });
      partieSure(r, () => {
        const seule = reg.lectureSeule !== false;
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: seule ? 'Notes en lecture seule' : 'Notes modifiables', icone: seule ? 'verrou' : 'libre' }),
          texteCourt(`En lecture seule, une note ne passe plus en mode édition par erreur.\nComment : « Modifier la note » ouvre quand même l'édition pendant ${EDITION_PERMISE_MIN} minutes.`, 'salle-petit'),
          h('button', { cls: 'salle-bouton', text: seule ? 'Autoriser l\'édition' : 'Remettre la lecture seule', onclick: async () => { reg.lectureSeule = !seule; await p.sauver(); this.rendre(); } }));
      });
      partieSure(r, () => h('div', { cls: 'salle-carte' },
        h('strong', { text: 'Séances notées', icone: 'seances' }),
        h('p', { cls: 'salle-petit', text: 'Relire une séance, ou supprimer une séance d\'essai (elle va à la corbeille).' }),
        h('button', { cls: 'salle-bouton', text: 'Voir ou supprimer des séances', icone: 'seances', onclick: () => this.aller('seances') })));
      // La note du programme : le bouton seulement quand elle manque ou qu'elle est illisible (sinon il ferait une copie en
      // double, et l'accueil le propose déjà dans ce cas).
      partieSure(r, () => {
        const f = e.fichiers && e.fichiers.programme;
        return h('div', { cls: 'salle-carte' },
          h('strong', { text: 'Note du programme', icone: 'programme' }),
          e.programmeSecours
            ? [h('p', { cls: 'salle-petit', text: f ? 'Elle est illisible : le plugin utilise le programme d\'origine en attendant.' : 'Elle est introuvable : le plugin utilise le programme d\'origine en attendant.' }),
              boutonRecreerProgramme(p)]
            : h('p', { cls: 'salle-petit', text: `« ${f && f.path ? f.path : 'Programme'} » est lisible : rien à recréer.` }));
      });
    },
  });
}
