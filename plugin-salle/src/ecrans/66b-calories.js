// VueSalle : « Calories d'un plat », dans « Manger » (et la clé dans Réglages → Appli).
// Demande : prendre un plat en photo et avoir une estimation des calories (comme Welmi). L'estimation : SallePlugin.estimerPlat
// (93-calories.js). Rien n'est noté : le résultat reste à l'écran jusqu'à la photo suivante (this.calories).
{
  // Le champ de la clé et son bouton « Enregistrer ». La clé n'est jamais affichée (champ mot de passe, vide au départ).
  const champCle = (vue) => {
    const champ = h('input', { type: 'password', cls: 'salle-champ salle-champ-texte salle-cle-champ', placeholder: 'Colle ta clé ici', 'aria-label': 'Clé', autocomplete: 'off' });
    const garder = async () => {
      const cle = String(champ.value || '').trim();
      if (!cle) return;
      await vue.plugin.garderCleIA(cle);
      vue.cleOuverte = false;
      vue.rendre();
    };
    return h('div', { cls: 'salle-cle' }, champ, h('button', { cls: 'salle-bouton salle-principal', type: 'button', text: 'Enregistrer', icone: 'valider', onclick: garder }));
  };
  // Les 3 étapes pour avoir la clé (gratuite, une seule fois), puis le champ.
  const etapesCle = (vue) => [
    h('ol', { cls: 'salle-cle-etapes' },
      h('li', null, h('button', { cls: 'salle-lien', type: 'button', text: 'Ouvre la page de Groq', icone: 'lien', onclick: () => { try { window.open(IA_PAGE_CLE); } catch (e) { console.error('Salle :', e); } } })),
      h('li', { text: 'Crée un compte (e-mail ou GitHub), « Create API Key », puis copie la clé.' }),
      h('li', { text: 'Colle-la ici :' })),
    champCle(vue),
    h('p', { cls: 'salle-petit', text: 'Gratuit, sans carte bancaire.' }),
  ];

  // 2.39.3 : ce que le repas du moment demande : le poids (la dernière pesée, sinon les réglages), les besoins du jour en prise de
  // masse (L.besoinsJour), le nombre de repas et la liste des aliments de la note « Manger ».
  const contexteRepas = (vue) => {
    const p = vue.plugin, reg = reglagesVue(p), texte = (p.etat.textes || {}).manger;
    const poids = poidsVue(p, reg);
    const objectif = Math.max(OBJECTIF.proteines.minimum, L.proteines(poids) || 0);
    return { poids, objectif, besoins: L.besoinsJour(reg, poids, vue.aujourdhui()), aliments: L.alimentsProteines(texte), noms: L.repasDuJour(texte).map((x) => L.norm(x.repas)),
      jour: L.totalJour(p.etat.repas, L.jourRepas()) };
  };
  // 2.41.0 : les repas notés de la journée des repas (elle commence à 4 h : L.jourRepas).
  const repasDuJour = (vue) => (vue.plugin.etat.repas || []).filter((r) => r && r.date === L.jourRepas());

  // 2.41.0 (demande : « un truc pour taper, qui passe au relais et dit le nombre de kcal, par exemple si je tape pain au
  // chocolat, car ça peut arriver d'oublier [la photo] ») : le plat écrit, puis « Calculer » ou Entrée : VueSalle.ecrirePlat.
  // 2.41.4 (demande : « redesigne tout ça, que ce soit plus opti, plus beau » ; maquette validée le 27/11) : ajouter un repas
  // tient en une ligne : le moment (Matin, Midi… ; celui de l'heure d'avance, un autre pour un repas oublié), puis Photo ·
  // Galerie · Écrire. « Écrire » ouvre le champ ; son texte sert aussi d'indice à la photo qui suit (2.41.2). Le texte, le
  // moment et le champ ouvert tiennent jusqu'au calcul (vue.texteEcrit, vue.momentEcrit, vue.ecritOuvert).
  const NOM_MOMENT = { matin: 'Matin', midi: 'Midi', gouter: 'Goûter', soir: 'Soir' };
  const blocAjout = (vue) => {
    const choisi = vue.momentEcrit || L.momentCle(new Date().getHours());
    const ouvert = !!L.RELAIS_CALORIES && (!!vue.ecritOuvert || !!vue.texteEcrit);
    // Le moment de l'heure est en couleur d'avance (2.41.6 : « il fallait garder en fonction de l'heure pour midi »).
    const moments = L.MOMENTS_REPAS.map((m) => h('button', { cls: 'salle-ajout-moment' + (choisi === m[0] ? ' salle-ajout-choisi' : ''), type: 'button', text: NOM_MOMENT[m[0]] || m[3], 'aria-pressed': choisi === m[0] ? 'true' : 'false',
      onclick: () => { vue.momentEcrit = m[0]; vue.rendre(); } }));
    const photo = (galerie) => h('label', { cls: 'salle-ajout-bouton salle-photo-bouton' + (galerie ? ' salle-photo-galerie' : ' salle-ajout-principal'), role: 'button', icone: galerie ? null : 'photo' },
      h('span', { text: galerie ? 'Galerie' : 'Photo' }),
      entreePhoto((octets) => vue.photoPlat(octets, vue.momentEcrit || null, vue.texteEcrit), 'Cette photo ne se lit pas. Réessaie.', galerie));
    const ecrire = L.RELAIS_CALORIES ? h('button', { cls: 'salle-ajout-bouton' + (ouvert ? ' salle-ajout-actif' : ''), type: 'button', text: 'Écrire', icone: 'modifier', 'aria-expanded': ouvert ? 'true' : 'false',
      onclick: () => { vue.ecritOuvert = !ouvert; if (ouvert) vue.texteEcrit = ''; vue.rendre(); } }) : null;
    const bloc = h('div', { cls: 'salle-ajout' },
      h('div', { cls: 'salle-ajout-moments salle-ecrit-moments', role: 'group', 'aria-label': 'Quand' }, moments),
      h('div', { cls: 'salle-ajout-boutons' + (ecrire ? '' : ' salle-ajout-deux') }, photo(false), photo(true), ecrire));
    if (!ouvert) return bloc;
    const champ = h('input', { type: 'text', cls: 'salle-champ salle-champ-texte salle-ecrit-champ', placeholder: 'gnocchis, 2 steaks, œufs', 'aria-label': 'Ce que tu as mangé', autocomplete: 'off', enterkeyhint: 'done', value: vue.texteEcrit || null });
    champ.addEventListener('input', () => { vue.texteEcrit = champ.value; });
    const lancer = () => vue.ecrirePlat(champ.value, choisi);
    champ.addEventListener('keydown', (ev) => { if (ev && ev.key === 'Enter') { if (ev.preventDefault) ev.preventDefault(); lancer(); } });
    bloc.appendChild(h('div', { cls: 'salle-ecrit-ligne' }, champ, h('button', { cls: 'salle-bouton salle-principal salle-mini', type: 'button', text: 'Calculer', onclick: lancer })));
    bloc.appendChild(h('p', { cls: 'salle-petit salle-ecrit-aide', text: '« Calculer » donne ses kcal ; avant une photo, ce texte l\'aide.' }));
    return bloc;
  };
  // Le poids pour les besoins du jour : la dernière pesée, sinon celui des réglages.
  const poidsVue = (p, reg) => L.dernieresMesures(p.etat.mesures, reg).poids || reg.poids;
  // Les champs de « Calories du jour » (Réglages → Appli et la feuille de l'accueil) : taille, âge, le poids s'il manque, le
  // sexe (choisi sur place), puis « Enregistrer », qui garde tout d'un coup (2.40.6 : un champ vide ou faux le dit).
  const formBesoins = (vue) => {
    const p = vue.plugin, reg = reglagesVue(p), stock = p.donnees.reglages;
    const champ = (nom, unite, valeur) => {
      const el = h('input', { type: 'number', inputmode: 'numeric', cls: 'salle-champ salle-nombre', placeholder: unite, 'aria-label': nom, value: valeur != null ? String(valeur) : null });
      return [el, h('label', { cls: 'salle-corps-champ' }, h('span', { cls: 'salle-petit', text: nom }), h('span', { cls: 'salle-ligne' }, el, h('span', { text: unite })))];
    };
    const [taille, ligneTaille] = champ('Taille', 'cm', reg.hauteur);
    const [age, ligneAge] = champ('Âge', 'ans', L.ageAujourdhui(reg, vue.aujourdhui()));
    const sansPoids = !poidsVue(p, reg);
    const [poids, lignePoids] = sansPoids ? champ('Poids', 'kg', null) : [null, null];
    let sexe = reg.sexe === 'h' || reg.sexe === 'f' ? reg.sexe : null;
    const boutons = [['h', 'Homme'], ['f', 'Femme']].map(([cle, nom]) => {
      const b = h('button', { cls: 'salle-bouton salle-mini' + (sexe === cle ? ' salle-principal' : ''), type: 'button', text: nom, 'aria-pressed': sexe === cle ? 'true' : 'false' });
      b.addEventListener('click', () => {
        sexe = cle;
        boutons.forEach(([x, bt]) => { bt.className = 'salle-bouton salle-mini' + (x === cle ? ' salle-principal' : ''); bt.setAttribute('aria-pressed', x === cle ? 'true' : 'false'); });
      });
      return [cle, b];
    });
    const garder = async () => {
      const t = L.nombre(taille.value), a = L.nombre(age.value), kg = poids ? L.nombre(poids.value) : null;
      if (t == null || t < 120 || t > 230) { new obsidian.Notice('Taille : écris un nombre en cm.'); return; }
      if (a == null || a < 10 || a > 100) { new obsidian.Notice('Âge : écris un nombre en années.'); return; }
      if (poids && (kg == null || kg < 30 || kg > 250)) { new obsidian.Notice('Poids : écris un nombre en kg.'); return; }
      if (!sexe) { new obsidian.Notice('Choisis Homme ou Femme.'); return; }
      Object.assign(stock, { hauteur: t, age: Math.round(a), ageLe: vue.aujourdhui(), sexe }, poids ? { poids: kg } : {});
      await p.sauver();
      vue.rendre();
    };
    return [h('div', { cls: 'salle-corps-champs' }, ligneTaille, ligneAge, lignePoids),
      h('div', { cls: 'salle-choix' }, boutons.map((x) => x[1])),
      h('div', { cls: 'salle-choix' }, h('button', { cls: 'salle-bouton salle-principal', type: 'button', text: 'Enregistrer', icone: 'valider', onclick: garder }))];
  };
  // 2.40.4 : les attendus des repas qui restent (L.attendus), d'après les repas du jour en photo.
  const attendusDu = (vue, ctx) => L.attendus({ repas: repasDuJour(vue), heure: new Date().getHours(),
    cible: ctx.besoins ? ctx.besoins.cible : null, noms: ctx.noms });

  // 2.40.1 (demande : « fais une vraie présentation, pas un bricolage ; sur la page d'accueil, le suivi de la barre ») : les
  // jauges du jour, une seule pièce pour l'accueil et « Manger » : une ligne par objectif (le nom, « fait / objectif », la barre
  // des niveaux, barreNiveau) ; une jauge pleine passe en couleur « faite ». Calories : seulement si les besoins sont connus
  // (« Calories du jour ») ; sinon le total seul.
  const jauges = (ctx) => {
    const j = ctx.jour, cible = ctx.besoins ? ctx.besoins.cible : null;
    const ligne = (nom, v, max, unite) => h('div', { cls: 'salle-jauge' + (max && v >= max ? ' salle-jauge-faite' : '') },
      h('div', { cls: 'salle-jauge-tete' }, h('span', { text: nom }), h('span', { cls: 'salle-nombre', text: max ? `${L.fmtMilliers(v)} / ${L.fmtMilliers(max)} ${unite}` : `${L.fmtMilliers(v)} ${unite}` })),
      max ? barreNiveau(v / max, { label: nom }) : null);
    return h('div', { cls: 'salle-jauges' }, ligne('Calories', j.kcal, cible, 'kcal'), ligne('Protéines', j.proteines, ctx.objectif, 'g'));
  };

  // Le résultat de la dernière photo (ou du plat écrit).
  // 2.41.8 (demande : « quand je prends en photo, mets plus en valeur que c'est en train de chercher ; le résultat n'est pas
  // évident à lire, on ne sait pas quoi lire ») : pendant l'analyse, un bloc qui tourne (« Analyse de ta photo… ») ; le
  // résultat, dans l'ordre de lecture : « Ajouté à ton midi » (et « Retirer »), le plat, deux chiffres côte à côte (les kcal et
  // les protéines de ce repas), la fourchette, puis ce qui a été vu, aliment par aliment (grammes et kcal alignés), et « Il
  // manque quelque chose ? ». Les glucides et lipides restent notés dans le journal, plus affichés ici.
  const AJOUTE_A = { matin: 'ton matin', midi: 'ton midi', gouter: 'ton goûter', soir: 'ton soir' };
  const resultat = (vue, c) => {
    if (c.etat === 'attente') return h('div', { cls: 'salle-calories-attente', role: 'status' },
      h('span', { cls: 'salle-calories-roue', 'aria-hidden': 'true' }),
      h('strong', { text: c.ecrit ? 'Calcul du plat…' : 'Analyse de ta photo…' }),
      h('span', { cls: 'salle-petit', text: 'Quelques secondes.' }));
    if (c.etat === 'erreur') return h('p', { cls: 'salle-calories-erreur', text: c.message });
    const x = c.plat;
    const tete = c.ligne ? h('div', { cls: 'salle-resultat-tete' },
      h('span', { cls: 'salle-resultat-ajoute', icone: 'valider', text: `Ajouté à ${AJOUTE_A[c.cle] || 'ta journée'}` }),
      h('button', { cls: 'salle-lien', type: 'button', text: 'Retirer', onclick: async () => { if (await appelPlugin(vue.plugin, 'retirerRepas', c.ligne)) { c.ligne = null; c.retire = true; vue.rendre(); } } }))
      : c.retire ? h('div', { cls: 'salle-resultat-tete' }, h('span', { cls: 'salle-petit', text: 'Retiré de ta journée.' })) : null;
    const chiffre = (valeur, nom) => h('div', { cls: 'salle-resultat-chiffre' }, h('span', { cls: 'salle-resultat-valeur salle-nombre', text: valeur }), h('span', { cls: 'salle-petit', text: nom }));
    const vus = (x.aliments || []).map((a) => {
      const m = /^(.*) : (\d+) g, (\d+) kcal$/.exec(String(a));
      return m ? h('div', { cls: 'salle-resultat-aliment' }, h('span', { text: m[1] }), h('span', { cls: 'salle-nombre salle-petit', text: `${m[2]} g` }), h('span', { cls: 'salle-nombre', text: `${m[3]} kcal` }))
        : h('div', { cls: 'salle-resultat-aliment', text: String(a) });
    });
    return h('div', { cls: 'salle-calories-resultat' },
      tete,
      x.plat ? h('strong', { cls: 'salle-calories-plat', text: x.plat }) : null,
      h('div', { cls: 'salle-resultat-chiffres' }, chiffre(`≈ ${L.fmtMilliers(x.kcal)} kcal`, 'pour ce repas'), x.proteines ? chiffre(`${x.proteines} g`, 'de protéines') : null),
      h('p', { cls: 'salle-petit salle-nombre', text: (x.min && x.max ? `entre ${L.fmtMilliers(x.min)} et ${L.fmtMilliers(x.max)} kcal · ` : '') + 'une estimation, souvent un peu basse' }),
      // 2.41.2 (« les erreurs arrivent trop souvent ») : ce qui a été vu, toujours affiché, pour voir tout de suite un oubli ;
      // « Il manque quelque chose ? » mène au plat écrit, au moment de ce repas : ce qui manque s'ajoute au même repas.
      vus.length ? h('div', { cls: 'salle-calories-aliments salle-resultat-vu' }, h('div', { cls: 'salle-petit salle-resultat-vu-titre', text: 'Ce qui a été vu' }), vus) : null,
      c.ligne ? h('button', { cls: 'salle-lien salle-calories-manque-lien', type: 'button', text: 'Il manque quelque chose ?', icone: 'plus', onclick: () => {
        vue.momentEcrit = c.cle || null; vue.ecritOuvert = true; vue.rendre();
        const champ = vue.contentEl && vue.contentEl.querySelector ? vue.contentEl.querySelector('.salle-ecrit-champ') : null;
        if (champ && champ.focus) champ.focus();
      } }) : null);
  };

  Object.assign(VueSalle.prototype, {
    // ── La carte de « Manger » ──
    // 2.40.1 : la carte « Aujourd'hui », en tête de « Manger » : le titre (« Validée » quand les deux objectifs sont atteints),
    // les jauges du jour, ce qu'il reste (et, le soir ou quand il reste peu, quoi ajouter : L.bilanJour), les repas notés
    // aujourd'hui, puis la photo du plat et son résultat.
    carteCalories() {
      const p = this.plugin, c = this.calories, ctx = contexteRepas(this);
      const b = L.bilanJour(ctx.jour, ctx.besoins ? ctx.besoins.cible : null, ctx.objectif, ctx.aliments, new Date().getHours());
      const carte = h('div', { cls: 'salle-carte salle-calories' + (b.valide ? ' salle-suivi-ok' : '') },
        h('div', { cls: 'salle-suivi-titre' }, h('strong', { text: 'Aujourd\'hui', icone: 'manger' }),
          b.valide ? h('span', { cls: 'salle-suivi-badge', text: 'Validée', icone: 'valider' }) : null),
        jauges(ctx));
      const phrases = b.valide ? ['Calories et protéines atteintes.'] : L.phraseJour(b);
      if (phrases.length) carte.appendChild(h('div', { cls: 'salle-suivi-reste' }, phrases.map((l) => h('p', null, enGras(l)))));
      if (!ctx.besoins) carte.appendChild(h('button', { cls: 'salle-lien', type: 'button', text: 'Pour la jauge des calories : ta taille et ton âge', icone: 'reglages', onclick: () => this.allerBesoins() }));
      // Les repas notés aujourd'hui : l'heure, le plat, ses calories ; 2.40.4 : puis l'attendu de chaque repas qui reste
      // (« si le matin je n'ai pas mangé, il doit faire un attendu pour le midi, et de même pour le soir »).
      const du = repasDuJour(this), att = attendusDu(this, ctx);
      const liste = !du.length && !att.length ? null : h('div', { cls: 'salle-suivi-repas' },
        // 2.41.3 (« il n'y a pas de bouton pour annuler ») : × sur chaque repas, puis « Retirer » ou « Garder » (deux touchers :
        // pas de retrait par erreur).
        du.map((r) => {
          const cle = [r.date, r.heure, r.quand, r.plat, r.kcal].join('|');
          if (this.retraitRepas === cle) return h('div', { cls: 'salle-suivi-repas-ligne salle-suivi-retrait' },
            h('span', { text: `Retirer « ${r.plat || r.quand} » ?` }),
            h('span', { cls: 'salle-suivi-repas-droite' },
              h('button', { cls: 'salle-lien', type: 'button', text: 'Retirer', onclick: async () => {
                this.retraitRepas = null;
                if (await appelPlugin(p, 'retirerRepasDe', r) && this.calories && this.calories.ligne === L.ligneRepas(r)) this.calories = null;
                this.rendre();
              } }),
              h('button', { cls: 'salle-lien', type: 'button', text: 'Garder', onclick: () => { this.retraitRepas = null; this.rendre(); } })));
          return h('div', { cls: 'salle-suivi-repas-ligne' },
            h('span', { text: `${r.heure} · ${r.plat || r.quand}` }),
            h('span', { cls: 'salle-suivi-repas-droite' }, h('span', { cls: 'salle-nombre', text: `${L.fmtMilliers(r.kcal)} kcal` }),
              h('button', { cls: 'salle-suivi-retirer', type: 'button', text: '×', 'aria-label': 'Retirer ce repas', onclick: () => { this.retraitRepas = cle; this.rendre(); } })));
        }),
        att.map((a) => h('div', { cls: 'salle-suivi-repas-ligne salle-suivi-attendu' },
          h('span', { text: `${a.quand} · ${a.entame ? 'encore' : 'à manger'}` }), h('span', { cls: 'salle-nombre', text: `≈ ${L.fmtMilliers(a.kcal)} kcal` }))));
      // 2.39.2 : sans clé ni relais, un lien vers Réglages → Appli, où se met la clé (carteCleIA).
      if (!appelPlugin(p, 'peutEstimer')) {
        if (liste) carte.appendChild(liste);
        carte.appendChild(h('p', { cls: 'salle-petit', text: 'Il faut une clé gratuite, une seule fois.' }));
        carte.appendChild(h('button', { cls: 'salle-lien', type: 'button', text: 'Mettre la clé dans les Réglages', icone: 'reglages', onclick: () => this.allerCle() }));
        return carte;
      }
      // 2.41.4 : ajouter (le moment, Photo · Galerie · Écrire), le résultat juste dessous, puis les repas du jour.
      carte.appendChild(blocAjout(this));
      if (c) carte.appendChild(resultat(this, c));
      if (liste) carte.appendChild(liste);
      return carte;
    },
    // Les jauges du jour pour l'accueil (61-accueil.js, carte « Manger ») : la même pièce que dans « Manger ».
    // 2.40.2 (demande : « tu vois comment on a poussé “Tes progrès” ; manger est tout aussi important, il faut faire pareil ») :
    // pour la carte « Manger » de l'accueil, le même creux que le niveau de « Tes progrès » : « Aujourd'hui » et ce qu'il reste
    // à droite (comme « encore 1 250 XP »), puis les jauges. Pas de phrase de coach (« pas besoin : je voulais dire que l'appli
    // devient un vrai suivi »). 2.40.3 : plus d'échelle Matin-Midi-Goûter-Soir (« ça m'arrive de ne pas manger le goûter ou le
    // matin ») : la carte liste les repas en photo. → { bloc, du (les repas du jour), attendus (L.attendus, 2.40.4), valides
    // (jours validés de la semaine) }.
    suiviAccueil() {
      const ctx = contexteRepas(this), auj = L.jourRepas();
      const cible = ctx.besoins ? ctx.besoins.cible : null;
      const du = repasDuJour(this);
      const b = L.bilanJour(ctx.jour, cible, ctx.objectif, ctx.aliments, new Date().getHours());
      // 2.40.5 (« compte en kcal et non en grammes ») : à droite, ce qu'il reste en kcal ; calories atteintes : les protéines ;
      // sans besoins, un lien vers « Calories du jour » (taille, âge), qui n'ouvre pas aussi la carte.
      const arreter = (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); };
      const droite = b.valide ? h('span', { cls: 'salle-repas-reste salle-repas-ok', text: 'validée', icone: 'valider' })
        : !cible ? h('button', { cls: 'salle-lien salle-repas-besoins', type: 'button', text: 'Ta taille et ton âge', icone: 'reglages', onclick: (ev) => { arreter(ev); this.allerBesoins(); } })
          : h('span', { cls: 'salle-repas-reste salle-nombre', text: b.resteKcal ? `encore ${L.fmtMilliers(b.resteKcal)} kcal` : `encore ${b.resteProt} g de protéines` });
      const bloc = h('div', { cls: 'salle-repas-bloc' + (b.valide ? ' salle-repas-valide' : '') },
        h('div', { cls: 'salle-repas-haut' }, h('span', { cls: 'salle-repas-nom', text: 'Aujourd\'hui' }), droite),
        jauges(ctx));
      return { bloc, du, attendus: attendusDu(this, ctx), valides: L.joursValides(this.plugin.etat.repas, auj, cible, ctx.objectif) };
    },

    // ── L'appareil photo de la carte « Manger » de l'accueil (2.39.1) ──
    // Avec la clé : un toucher ouvre l'appareil photo ; la photo prise, « Manger » s'ouvre sur « Calories d'un plat », qui
    // analyse le plat. Sans clé : un toucher ouvre Réglages → Appli, sur la clé (2.39.2).
    boutonPhotoPlat() {
      const p = this.plugin;
      // 2.39.1 (précision : « pas forcément un appareil photo, mais qui lance directement pour avoir le nombre de kcal ») :
      // l'appareil photo et « kcal », pour dire ce qu'il donne.
      const contenu = () => [icone('photo'), h('span', { text: 'kcal' })];
      // 2.39.7 : il est dans la carte « Manger », qui s'ouvre au toucher : son toucher à lui ne remonte pas jusqu'à elle.
      const arreter = (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); };
      if (!appelPlugin(p, 'peutEstimer')) return h('button', { cls: 'salle-manger-photo', type: 'button', 'aria-label': 'Calories d\'un plat : mettre la clé', onclick: (ev) => { arreter(ev); this.allerCle(); } }, contenu());
      const champ = entreePhoto((octets) => this.photoPlat(octets), 'Cette photo ne se lit pas. Réessaie.');
      champ.addEventListener('click', arreter);   // le clic du champ (l'appareil photo) remonte aussi : arrêté
      return h('label', { cls: 'salle-manger-photo', role: 'button', 'aria-label': 'Prendre un plat en photo pour ses calories', onclick: arreter }, contenu(), champ);
    },

    // Une photo de plat (depuis « kcal » de l'accueil ou la carte de « Manger ») : « Manger » s'ouvre sur la carte, « Analyse du
    // plat… », puis le résultat ; 2.40.0 : un plat reconnu est ajouté à la journée (SallePlugin.noterRepas).
    // 2.41.1 : cle (« matin »…) : la photo d'un repas d'avant (la galerie), notée à son moment (L.HEURE_MOMENT).
    // 2.41.2 : indice : ce qu'il a écrit de l'assiette (le champ du plat écrit), envoyé avec la photo, puis effacé.
    async photoPlat(octets, cle, indice) {
      const p = this.plugin;
      this.calories = { etat: 'attente' };
      if (this.ecran !== 'note' || this.noteType !== 'manger') {
        this.noteType = 'manger'; this.sectionOuverte = null; this.platOuvert = null; this.enVue = '.salle-calories'; this.aller('note');
      } else this.rendre();
      const ind = L.platEcrit(indice || '');
      const r = await p.estimerPlat(octets, ind);
      this.calories = r.ok ? { etat: 'fait', plat: r.plat } : { etat: 'erreur', message: r.message };
      if (r.ok) {
        const d = new Date(), deux = (n) => String(n).padStart(2, '0'), x = r.plat, ici = L.momentCle(d.getHours());
        const m = (cle && L.MOMENTS_REPAS.find((y) => y[0] === cle)) || L.MOMENTS_REPAS.find((y) => y[0] === ici);
        const heure = m[0] === ici ? `${deux(d.getHours())}:${deux(d.getMinutes())}` : L.HEURE_MOMENT[m[0]];
        const ligne = await appelPlugin(p, 'noterRepas', { date: L.jourRepas(d), heure, quand: m[3],
          plat: x.plat, kcal: x.kcal, proteines: x.proteines, glucides: x.glucides, lipides: x.lipides });
        if (typeof ligne === 'string') this.calories.ligne = ligne;
        this.calories.cle = m[0];
        if (cle) this.momentEcrit = null;
        if (ind) { this.texteEcrit = ''; this.ecritOuvert = false; }
      }
      if (this.ecran === 'note' && this.noteType === 'manger') { this.enVue = r.ok ? '.salle-calories-resultat' : '.salle-calories'; this.rendre(); this.allerCarte(); }
    },

    // 2.41.0 : un plat écrit (formEcrit) : « Analyse du plat… », puis le résultat, ajouté à la journée comme une photo, au moment
    // choisi (cle : « matin »…) ; un repas oublié (un autre moment que celui de l'heure) prend l'heure du milieu de son moment
    // (L.HEURE_MOMENT).
    async ecrirePlat(texte, cle) {
      const p = this.plugin;
      if (this.calories && this.calories.etat === 'attente') return;
      if (!L.platEcrit(texte)) { new obsidian.Notice('Écris le plat en quelques mots.'); return; }
      this.texteEcrit = String(texte);
      this.calories = { etat: 'attente', ecrit: true };
      this.enVue = '.salle-calories-attente';
      this.rendre();
      const r = await appelPlugin(p, 'estimerTexte', texte);
      this.calories = r && r.ok ? { etat: 'fait', plat: r.plat } : { etat: 'erreur', message: (r && r.message) || L.erreurPlat(-1) };
      if (r && r.ok) {
        const d = new Date(), deux = (n) => String(n).padStart(2, '0'), x = r.plat, ici = L.momentCle(d.getHours());
        const m = L.MOMENTS_REPAS.find((y) => y[0] === cle) || L.MOMENTS_REPAS.find((y) => y[0] === ici);
        const heure = m[0] === ici ? `${deux(d.getHours())}:${deux(d.getMinutes())}` : L.HEURE_MOMENT[m[0]];
        const ligne = await appelPlugin(p, 'noterRepas', { date: L.jourRepas(d), heure, quand: m[3], plat: x.plat, kcal: x.kcal, proteines: x.proteines, glucides: x.glucides, lipides: x.lipides });
        if (typeof ligne === 'string') this.calories.ligne = ligne;
        this.calories.cle = m[0];
        this.texteEcrit = ''; this.momentEcrit = null; this.ecritOuvert = false;
      }
      if (this.ecran === 'note' && this.noteType === 'manger') { this.enVue = r && r.ok ? '.salle-calories-resultat' : '.salle-calories'; this.rendre(); this.allerCarte(); }
    },

    // Réglages → Appli, sur la carte de la clé (le lien de « Manger » et « kcal » sans clé, 2.39.2).
    allerCle() {
      this.ongletReglages = 'appli';
      this.enVue = '.salle-cle-carte';
      this.ouvrirReglages();
    },

    // Réglages → Appli, sur « Calories du jour » (le lien sous le résultat, 2.39.3).
    allerBesoins() {
      this.ongletReglages = 'appli';
      this.enVue = '.salle-besoins-carte';
      this.ouvrirReglages();
    },

    // ── Réglages → Appli : « Calories du jour » (2.39.3) : la taille (la même que celle du questionnaire), l'âge, le sexe ──
    // Ce qu'ils donnent : les calories du jour en prise de masse (L.besoinsJour) ; 2.40.3 : plus de part par repas.
    carteBesoins() {
      const p = this.plugin, reg = reglagesVue(p), stock = p.donnees && p.donnees.reglages;
      const b = L.besoinsJour(reg, poidsVue(p, reg), this.aujourdhui());
      const carte = h('div', { cls: 'salle-carte salle-besoins-carte' }, h('strong', { text: 'Calories du jour', icone: 'manger' }),
        h('p', { cls: 'salle-petit' }, enGras(b ? `Pour prendre du muscle : **environ ${b.cible} kcal par jour**.` : 'Pour la jauge des calories : ta taille, ton âge et ton sexe.')));
      if (!stock) return carte;   // pas encore de réglages (premier lancement) : le questionnaire d'abord
      formBesoins(this).forEach((x) => carte.appendChild(x));
      return carte;
    },
    // 2.40.6 (demande : « si les infos manquent, il faut un pop-up pour forcer à répondre, et dire que c'est modifiable dans les
    // réglages ») : sur l'accueil, tant que la taille, l'âge, le sexe (ou le poids) manquent, une feuille par-dessus l'écran (la
    // même que « La séance », salle-panneau), sans croix ni toucher à côté pour la fermer : elle part une fois enregistrée.
    // Pas pendant une séance, ni avant le premier questionnaire. → la feuille, ou null.
    fenetreBesoins() {
      const p = this.plugin, reg = reglagesVue(p), d = p.donnees;
      if (!d || !d.reglages || d.enCours || L.besoinsJour(reg, poidsVue(p, reg), this.aujourdhui())) return null;
      const panneau = h('div', { cls: 'salle-panneau salle-besoins-fenetre', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Tes calories du jour' },
        h('strong', { cls: 'salle-besoins-titre', text: 'Tes calories du jour', icone: 'manger' }),
        h('p', { cls: 'salle-petit', text: 'Pour compter tes kcal : ta taille, ton âge et ton sexe.' }),
        formBesoins(this),
        h('p', { cls: 'salle-petit salle-besoins-plus-tard', text: 'Tu pourras les modifier dans Réglages → Appli → Calories du jour.' }));
      return h('div', { cls: 'salle-panneau-fond salle-besoins-fond' }, panneau);
    },

    // ── Réglages → Appli : la clé (le seul endroit où elle se met, 2.39.2) ──
    carteCleIA() {
      const p = this.plugin, a = appelPlugin(p, 'aCleIA'), relais = !!L.RELAIS_CALORIES;
      const carte = h('div', { cls: 'salle-carte salle-cle-carte' }, h('strong', { text: a ? 'Calories d\'un plat : clé enregistrée' : relais ? 'Calories d\'un plat : ta clé (facultatif)' : 'Calories d\'un plat : pas de clé', icone: 'photo' }));
      // 2.39.5 : avec le relais, la clé n'est plus obligatoire ; elle donne sa propre limite.
      if (!a && relais) carte.appendChild(h('p', { cls: 'salle-petit', text: 'Sans clé, ça marche déjà : des centaines de photos par jour, pour tous.' }));
      if (!a) { etapesCle(this).forEach((el) => carte.appendChild(el)); return carte; }
      if (this.cleOuverte) carte.appendChild(champCle(this));
      carte.appendChild(h('div', { cls: 'salle-choix' },
        this.cleOuverte ? null : h('button', { cls: 'salle-bouton salle-mini', type: 'button', text: 'Changer la clé', icone: 'modifier', onclick: () => { this.cleOuverte = true; this.rendre(); } }),
        h('button', { cls: 'salle-bouton salle-mini', type: 'button', text: 'Retirer la clé', icone: 'supprimer', onclick: async () => { await p.garderCleIA(''); this.cleOuverte = false; this.calories = null; this.rendre(); } })));
      return carte;
    },
  });
}
