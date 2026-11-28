// VueSalle : l'écran « Tester cet appareil » (écran allumé, bip, vibration, liens obsidian:// et shortcuts://).
// Ce qui se calcule se teste d'un seul bouton ; on ne pose une question que si le plugin ne peut pas savoir (un son entendu,
// une vibration sentie). Les résultats vont dans reglages.appareils (mobile ou bureau) : le plugin n'utilise que ce qui marche.
Object.assign(VueSalle.prototype, {
  // ── L'écran ──
  ecranDiagnostic(r) {
    const p = this.plugin, reg = p.donnees.reglages, mobile = p.mobile();
    const app = reg.appareils && reg.appareils[L.cleAppareil(mobile)];
    this.diag = this.diag || {};
    this.entete(r, 'Tester cet appareil', { texte: 'Réglages', faire: () => this.ouvrirReglages() }, 'diagnostic');
    const intro = this.consigne(`Touche chaque test sur ${mobile ? 'cet iPhone' : 'ce Mac'}. Le plugin garde ce qui marche, et n'utilise que ça ici.`);
    if (intro) r.appendChild(intro);

    // 1. L'écran allumé : calculé (la demande réussit ou non).
    r.appendChild(this.carteDiag('ecran', 'clair', 'Écran allumé pendant la séance', {
      oui: 'Pas de veille pendant la séance, même après un passage dans une autre app.',
      non: 'Cet appareil refuse. L\'écran suit le réglage de veille du téléphone.',
      rien: '',
    }, h('button', { cls: 'salle-bouton salle-mini', text: 'Tester', icone: 'diagnostic', onclick: async () => { await p.testerAppareil(); this.rendre(); } })));

    // 2. Le bip : joué, puis « Tu l'as entendu ? » (le plugin ne sait pas si le son est coupé).
    const reponse = (cle, question) => h('div', { cls: 'salle-diag-question' }, h('strong', { text: question }),
      h('div', { cls: 'salle-choix' },
        h('button', { cls: 'salle-bouton salle-mini salle-principal', text: 'Oui', onclick: async () => { this.diag[cle] = false; await p.noterAppareil({ [cle]: true }); this.rendre(); } }),
        h('button', { cls: 'salle-bouton salle-mini', text: 'Non', onclick: async () => { this.diag[cle] = false; await p.noterAppareil({ [cle]: false }); this.rendre(); } })));
    r.appendChild(this.carteDiag('son', 'son', 'Bip à la fin du repos', {
      oui: 'Le bip marche, quand Obsidian est à l\'écran et que le mode silencieux est coupé.',
      non: `Pas de bip ici. Sur iPhone, le minuteur lancé par « ${RACCOURCI} » sonne à la place.`,
      rien: '',
    }, this.diag.son ? reponse('son', 'Tu as entendu le bip ?') : h('button', {
      cls: 'salle-bouton salle-mini', text: 'Faire un bip', icone: 'son',
      onclick: async () => {
        p.preparerSon(true);
        if (p.jouerBip(1)) this.diag.son = true;
        else await p.noterAppareil({ son: false });   // pas de Web Audio : rien à demander
        this.rendre();
      },
    }), this.interrupteurReglage('son', 'Bip allumé', 'Bip coupé')));

    // 3. La vibration : l'interrupteur iOS 18 caché dans un « bouton » (un vrai toucher), puis « Tu l'as sentie ? ».
    const toucher = h('label', { cls: 'salle-bouton salle-mini', role: 'button', tabindex: '0', icone: 'vibration' }, p.creerVibreur(), h('span', { text: 'Toucher ici' }));
    toucher.addEventListener('click', (ev) => {
      if (ev && ev.target && ev.target.tagName === 'INPUT') return;   // le clic transmis à l'interrupteur : déjà compté
      // Le dessin attend un peu : l'interrupteur doit encore être là quand iOS le bascule (c'est ce qui vibre).
      plusTard(async () => {
        if (!SallePlugin.saitVibrer()) await p.noterAppareil({ vibration: false });   // l'interrupteur n'existe pas ici
        else this.diag.vibration = true;
        this.rendre();
      }, 80);
    });
    r.appendChild(this.carteDiag('vibration', 'vibration', 'Vibration à « Série faite »', {
      oui: 'Une petite vibration quand tu valides une série (pendant le toucher).',
      non: 'Pas de vibration ici. Rien ne change ailleurs.',
      rien: '',
    }, this.diag.vibration ? reponse('vibration', 'Tu as senti une petite vibration ?') : toucher, this.interrupteurReglage('vibration', 'Vibration allumée', 'Vibration coupée')));

    // 4. Le lien obsidian://salle : le plugin s'ouvre lui-même ; s'il reçoit le lien, ça marche (calculé).
    const lienSeance = L.lienSalle(p.nomCoffre(), 'seance');
    const enCours = p.testEnCours && p.testEnCours.cle;
    r.appendChild(this.carteDiag('obsidian', 'lien', 'Lien obsidian://salle', {
      oui: 'Le lien ouvre la salle.\nPourquoi : il sert au bouton de l\'écran verrouillé.',
      non: 'Le lien n\'est pas revenu jusqu\'ici : refais le test.\nPourquoi : s\'il échoue encore, les raccourcis de l\'iPhone ne marcheront pas.',
      rien: '',
    }, h('div', { cls: 'salle-choix' },
      h('button', { cls: 'salle-bouton salle-mini', text: enCours === 'obsidian' ? 'Test en cours…' : 'Tester', icone: 'lien', onclick: () => { p.lancerTestLien('obsidian'); this.rendre(); } }),
      h('button', { cls: 'salle-bouton salle-mini', text: 'Copier le lien de la séance', onclick: () => p.copier(lienSeance, 'Lien copié. Colle-le dans l\'action « Ouvrir les URL » du raccourci.') })),
    h('div', { cls: 'salle-petit salle-diag-lien', text: lienSeance })));

    // 5. Le raccourci « Repos salle » (iPhone) : un minuteur de 3 s ; le retour dit si le raccourci existe (calculé).
    r.appendChild(this.carteDiag('shortcuts', 'repos', `Raccourci « ${RACCOURCI} »`, {
      // Le nom exact de la ligne des Réglages (61-accueil.js).
      oui: `Le minuteur de l'iPhone se lance après chaque série.\nComment : dans Réglages → Appli, « Minuteur de l'iPhone (« ${RACCOURCI} ») » doit être activé.`,
      non: `Pas de réponse : crée « ${RACCOURCI} » dans l'app Raccourcis, puis refais le test.`,
      rien: mobile ? 'Le test lance un minuteur de 3 s, puis revient ici.' : 'À tester sur l\'iPhone.',
    }, mobile ? h('button', { cls: 'salle-bouton salle-mini', text: enCours === 'shortcuts' ? 'Test en cours…' : 'Tester', icone: 'repos', onclick: () => { p.lancerTestLien('shortcuts'); this.rendre(); } }) : null));

    if (app && app.date) r.appendChild(h('p', { cls: 'salle-petit salle-bas', text: `Dernier test le ${L.dateCourte(app.date)} sur ${mobile ? 'cet iPhone' : 'ce Mac'}.` }));
  },

  // ── Ses morceaux : une carte de test, un interrupteur de réglage ──
  // Une carte de test : le titre, le résultat (un mot, jamais la couleur seule), une phrase (pas avant le test : le mot suffit),
  // puis les boutons.
  carteDiag(cle, ic, titre, textes, ...actions) {
    const v = this.plugin.peut(cle);
    const etat = v === true ? 'fait' : 'pale';
    const phrase = v === true ? textes.oui : v === false ? textes.non : textes.rien;
    return h('div', { cls: 'salle-carte salle-diag' },
      h('div', { cls: 'salle-diag-tete' }, h('strong', { text: titre, icone: ic }),
        h('span', { cls: `salle-badge salle-etat-${etat}`, text: v === true ? 'Marche' : v === false ? 'Ne marche pas' : 'Pas testé' })),
      phrase ? texteCourt(phrase, 'salle-petit') : null,
      actions.filter(Boolean));
  },
  // Le réglage oui / non à côté d'un test (son, vibration) : ce que l'utilisateur veut, quel que soit l'appareil.
  interrupteurReglage(cle, texteOui, texteNon) {
    const reg = this.plugin.donnees.reglages, oui = reg[cle] !== false;
    return h('button', {
      cls: 'salle-bouton salle-mini', text: oui ? texteOui : texteNon, icone: oui ? 'valider' : 'annuler', 'aria-pressed': oui ? 'true' : 'false',
      onclick: async () => { reg[cle] = !oui; await this.plugin.sauver(); this.rendre(); },
    });
  },
});
