// L : les réglages (data.json du plugin) et deux appareils pour un data.json. Des fonctions pures : rien ici ne lit ni
// n'écrit de fichier. Le lien obsidian://salle et le fichier d'état : 04-liens.js ; l'index des notes : 22-index.js.

// ── Les réglages par défaut ──
// Un ancien data.json sans les clés récentes les reçoit par L.fusionReglages.
// Règle : personne ne modifie un tableau en place, on le remplace (reg.pauses = reg.pauses.concat([lundi])).
const REGLAGES_DEFAUT = {
  niveau: 'jamais', parSemaine: 3, duree: 60, poids: null, chronoIphone: false,   // les premières questions, le minuteur de l'iPhone
  pasHalteres: null,               // les haltères de sa salle : 1 ou 2 kg (premières questions) ; null : le pas du programme
  hauteur: null,                   // sa taille en cm (premières questions) ; les tours vont dans la note Mesures
  age: null, ageLe: null,          // 2.39.3 : son âge et le jour où il l'a donné (Réglages → Appli, « Calories du jour »)
  sexe: null,                      // 2.39.3 : 'h' ou 'f' (Réglages → Appli) : l'équation des besoins en dépend
  salle: null,                     // sa salle (premières questions) : { nom, adresse, trajet }, ou null
  etages: null,                    // où sont les appareils (premières questions) : { machines, halteres } (0 = RDC), ou null (un seul étage)
  son: true,                       // bip à la fin du repos et à la cible du chrono (si l'appareil sait)
  vibration: true,                 // petite vibration au toucher de « Série faite » (interrupteur iOS 18)
  pauses: [],                      // lundis (AAAA-MM-JJ) des semaines sans salle (Réglages → Salle) : la régularité ne casse pas
  malade: [],                      // parmi elles, les lundis des semaines « malade » (L.apresMaladie : reprise à moitié des séries)
  semainesLegeres: ['2027-01-18'], // lundis des semaines légères (ses finaux du 18 au 20/01/2027)
  legereRefus: null,               // lundi où il a dit non à la proposition (pas de nouvelle question avant 4 semaines)
  recup: [],                       // lundis où il a coché la 5e case (protéines et sommeil)
  appareils: {},                   // { mobile: {…}, bureau: {…} } : résultats de « Tester cet appareil »
  machines: {},                    // { nom normalisé de l'exercice: « siège 4 » } : son réglage de chaque machine, noté dans l'aide
};
// Les réglages qui sont des listes de lundis : deux appareils peuvent y ajouter chacun une date (L.fusionDonnees).
const LISTES_DE_LUNDIS = ['pauses', 'malade', 'semainesLegeres', 'recup'];

Object.assign(L, {
  // ── Lire les réglages ──
  // Un data.json de n'importe quelle version → des réglages complets. null si lu n'est pas un objet (« premières questions »).
  // Les tableaux sont copiés (jamais ceux du défaut) ; une date illisible dans une liste est ignorée (rien ne bloque).
  // 3 séances par semaine au plus (un ancien « 4 » devient 3) : au moins 48 h entre deux séances, une semaine qui se
  // répète n'en tient pas plus de 3 [26] ; 2 ou 3 séances donnent le même résultat [47].
  fusionReglages(lu) {
    if (!lu || typeof lu !== 'object' || Array.isArray(lu)) return null;
    const r = Object.assign({}, REGLAGES_DEFAUT, lu);
    const date = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
    for (const k of LISTES_DE_LUNDIS) r[k] = Array.isArray(r[k]) ? r[k].filter(date) : REGLAGES_DEFAUT[k].slice();
    if (typeof r.parSemaine === 'number' && r.parSemaine > 3) r.parSemaine = 3;
    if (!date(r.legereRefus)) r.legereRefus = null;
    const a = r.appareils;
    r.appareils = {};
    if (a && typeof a === 'object' && !Array.isArray(a)) {
      for (const cle of Object.keys(a)) if (a[cle] && typeof a[cle] === 'object') r.appareils[cle] = Object.assign({}, a[cle]);
    }
    for (const k of ['son', 'vibration', 'chronoIphone']) if (typeof r[k] !== 'boolean') r[k] = REGLAGES_DEFAUT[k];
    if ([1, 2].indexOf(r.pasHalteres) < 0) r.pasHalteres = null;
    if (!(typeof r.hauteur === 'number' && r.hauteur >= 120 && r.hauteur <= 230)) r.hauteur = null;
    if (!(typeof r.age === 'number' && r.age >= 10 && r.age <= 100)) r.age = null;
    if (!date(r.ageLe)) r.ageLe = null;
    if (['h', 'f'].indexOf(r.sexe) < 0) r.sexe = null;
    const mm = r.machines;
    r.machines = {};
    if (mm && typeof mm === 'object' && !Array.isArray(mm)) {
      Object.keys(mm).forEach((k) => { const t = typeof mm[k] === 'string' ? mm[k].replace(/\s+/g, ' ').trim().slice(0, 60) : ''; if (t) r.machines[k] = t; });
    }
    r.salle = L.salleLue(r.salle);
    r.etages = L.etagesLus(r.etages);
    return r;
  },
  // ── Sa salle et ses étages (2.22.0, demande : la salle demandée par le questionnaire, rien d'écrit en dur hors du fichier des réglages, le code lit la variable) ──
  // La salle des réglages, propre : { nom, adresse, trajet } (des textes courts, vides permis), ou null sans nom.
  salleLue(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    const t = (x) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, 120) : '');
    const o = { nom: t(s.nom), adresse: t(s.adresse), trajet: t(s.trajet) };
    return o.nom ? o : null;
  },
  // Les étages des réglages, propres : { machines, halteres } (0 = RDC, 0 à 9), ou null (un seul étage, ou pas répondu).
  etagesLus(e) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
    const n = (x) => (Number.isInteger(x) && x >= 0 && x <= 9 ? x : null);
    const o = { machines: n(e.machines), halteres: n(e.halteres) };
    return o.machines == null || o.halteres == null || o.machines === o.halteres ? null : o;
  },
  // Où se fait un exercice : 'halteres' (haltères, barres, bancs) ou 'machines' (machines, poulies, tapis, le reste).
  lieuExercice(nom) {
    return /haltere|\bbarre\b|\bbanc\b/.test(L.norm(nom)) ? 'halteres' : 'machines';
  },
  // L'étage d'un exercice : celui écrit sur sa ligne du programme (« étage 2 »), sinon celui de son lieu dans les réglages.
  etageExercice(exo, etages) {
    if (exo && L.estEtage(exo.etage)) return exo.etage;
    const e = etages && exo && exo.nom ? etages[L.lieuExercice(exo.nom)] : null;
    return L.estEtage(e) ? e : null;
  },
  // Les exercices avec leur étage : ceux qui n'en ont pas sur leur ligne reçoivent celui des réglages (des copies ; les
  // autres, l'échauffement et les exercices sans lieu connu restent tels quels).
  situer(exos, etages) {
    return (Array.isArray(exos) ? exos : []).map((x) => {
      const e = x && !x.echauffement && !L.estEtage(x.etage) ? L.etageExercice(x, etages) : null;
      return e != null ? Object.assign({}, x, { etage: e }) : x;
    });
  },
  // « au RDC », « au 1er », « au 2e » : pour dire où sont les appareils.
  ouEtage(n) {
    return n === 0 ? 'au RDC' : n === 1 ? 'au 1er' : `au ${n}e`;
  },
  // Ce que l'écran « Ma salle » dit d'après les réglages (rien n'est écrit dans le code) : le nom et l'adresse, le trajet,
  // les étages. → des lignes courtes, mot clé en gras ; [] sans salle ni étages.
  lignesSalle(reglages) {
    const r = reglages || {}, s = L.salleLue(r.salle), e = L.etagesLus(r.etages);
    const out = [];
    if (s) out.push(`**${s.nom}**${s.adresse ? ` : ${s.adresse}` : ''}`);
    if (s && s.trajet) out.push(`**Y aller** : ${s.trajet}`);
    if (e) out.push(`**Les étages** : machines ${L.ouEtage(e.machines)}, haltères et bancs ${L.ouEtage(e.halteres)}`);
    return out;
  },
  // L'adresse d'une recherche Google Maps de la salle (son nom et son adresse) : rien n'est envoyé tant qu'il ne touche pas le lien.
  urlCarte(salle) {
    const s = L.salleLue(salle);
    return s ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([s.nom, s.adresse].filter(Boolean).join(' ')) : '';
  },
  // Ce qu'on trouve à un étage, d'après les réglages : « machines et poulies », « haltères et bancs », ou ''.
  libelleEtage(n, etages, nom) {
    if (!etages || !L.estEtage(n)) return '';
    const lieu = etages.machines === n ? 'machines' : etages.halteres === n ? 'halteres' : '';
    // 2.35.0 : une machine rangée à l'étage des haltères (étage écrit sur sa ligne du programme) : on ne dit pas « haltères et bancs ».
    if (!lieu || (nom && L.lieuExercice(nom) !== lieu)) return '';
    return lieu === 'machines' ? 'machines et poulies' : 'haltères et bancs';
  },
  // Les réponses du questionnaire (premier lancement ou « Réinitialiser ») → des réglages neufs. Seul l'onglet Appli est
  // gardé (son, vibration, minuteur, test de l'appareil, lecture seule) ; semaines sans salle, malade et refus repartent à zéro.
  // Une réponse qui manque reprend la valeur d'avant, sinon celle par défaut.
  reglagesDesReponses(avant, reponses, poids) {
    const a = avant && typeof avant === 'object' ? avant : {};
    const rep = reponses || {};
    const neuf = {};
    // (check-up 2.38.64) les cases « Protéines et sommeil » cochées (recup, des XP) restent aussi.
    for (const k of ['son', 'vibration', 'chronoIphone', 'appareils', 'lectureSeule', 'machines', 'recup']) if (k in a) neuf[k] = a[k];
    for (const k of ['niveau', 'duree']) neuf[k] = k in rep ? rep[k] : (k in a ? a[k] : REGLAGES_DEFAUT[k]);
    const jours = Array.isArray(rep.jours) && rep.jours.length ? rep.jours.slice().sort() : (Array.isArray(a.jours) ? a.jours.slice() : null);
    neuf.jours = jours;
    neuf.parSemaine = jours ? Math.min(3, jours.length) : (a.parSemaine || REGLAGES_DEFAUT.parSemaine);
    neuf.pasHalteres = 'pasHalteres' in rep ? (rep.pasHalteres || null) : (a.pasHalteres || null);
    neuf.semainesLegeres = Array.isArray(rep.semainesLegeres) ? rep.semainesLegeres.slice() : (Array.isArray(a.semainesLegeres) ? a.semainesLegeres.slice() : REGLAGES_DEFAUT.semainesLegeres.slice());
    neuf.hauteur = rep.hauteur != null ? rep.hauteur : (a.hauteur || null);
    neuf.salle = 'salle' in rep ? rep.salle : (a.salle || null);
    neuf.etages = 'etages' in rep ? rep.etages : (a.etages || null);
    neuf.poids = poids != null ? poids : (a.poids || null);
    return L.fusionReglages(neuf);
  },
  // Les dernières valeurs connues, pour pré-remplir « Ton corps aujourd'hui » : la taille des réglages, et pour chaque tour
  // (et le poids) la dernière mesure qui l'a. → { hauteur, poids, taille, epaules, bras } (null si inconnu).
  dernieresMesures(mesures, reglages) {
    const out = { hauteur: reglages && typeof reglages.hauteur === 'number' ? reglages.hauteur : null, poids: null, taille: null, epaules: null, bras: null };
    const liste = (Array.isArray(mesures) ? mesures : []).filter((m) => m && typeof m.date === 'string').slice().sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
    for (const m of liste) for (const k of ['poids', 'taille', 'epaules', 'bras']) if (typeof m[k] === 'number' && m[k] > 0) out[k] = m[k];
    if (out.poids == null && reglages && typeof reglages.poids === 'number') out.poids = reglages.poids;
    return out;
  },
  // Ce qui a changé depuis les dernières valeurs (poids et tours ; la taille reste dans les réglages) → { poids?, … } ou null.
  mesuresChangees(corps, avant) {
    const m = {};
    for (const k of ['poids', 'taille', 'epaules', 'bras']) if (typeof corps[k] === 'number' && corps[k] !== avant[k]) m[k] = corps[k];
    return Object.keys(m).length ? m : null;
  },
  // Les données lues au démarrage : data.json = { reglages, enCours, bilan }. La séance en cours est vérifiée
  // (SallePlugin.verifierEnCours), puis migrée à la forme actuelle (L.migrerEnCours, copie profonde) ; le bilan du jour est gardé.
  // ── La note « Réglages » (2.25.0, demande : les réponses au questionnaire dans le dossier des données) ──
  // Les réponses au questionnaire vivent dans le dossier des données, dans une note reconnue à « salle: reglages » : deux
  // lignes pour l'utilisateur, puis les réglages en JSON. data.json (dossier du plugin) ne garde que la séance en cours et
  // le bilan du jour.
  ecrireNoteReglages(reglages) {
    return ['---', 'salle: reglages', '---', '# Réglages', '',
      '- **Tes réponses au questionnaire**, écrites par le plugin.',
      '- **Pour les changer** : Salle → Réglages. Ne modifie pas cette note à la main.', '',
      '```json', JSON.stringify(reglages, null, 2), '```', ''].join('\n');
  },
  // Le texte de la note → l'objet des réglages (tel qu'écrit, à passer par L.fusionReglages), ou null si elle est illisible.
  lireNoteReglages(texte) {
    const m = typeof texte === 'string' ? /```json[ \t]*\n([\s\S]*?)\n```/.exec(texte) : null;
    if (!m) return null;
    try {
      const o = JSON.parse(m[1]);
      return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
    } catch (e) { return null; }
  },
  lireDonnees(lu, verifier) {
    const d = lu && typeof lu === 'object' ? lu : {};
    let enCours = typeof verifier === 'function' ? verifier(d.enCours) : null;
    if (enCours) {
      try { enCours = L.migrerEnCours(enCours); } catch (e) { /* migrerEnCours ne lève jamais d'erreur ; par sûreté, on garde l'entrée */ }
    }
    const bilan = d.bilan && typeof d.bilan === 'object' && typeof d.bilan.date === 'string' ? d.bilan : null;
    return { reglages: d.reglages ? L.fusionReglages(d.reglages) : null, enCours: enCours || null, bilan };
  },

  // ── Les résultats de « Tester cet appareil », et les listes de lundis ──
  // La clé de l'appareil dans reglages.appareils : le data.json est partagé par le Mac et l'iPhone (iCloud).
  cleAppareil(mobile) {
    return mobile ? 'mobile' : 'bureau';
  },
  // Ce que « Tester cet appareil » a trouvé : true, false, ou null (pas testé ; on essaie alors, sans risque).
  resultatAppareil(reglages, cleApp, quoi) {
    const a = reglages && reglages.appareils && reglages.appareils[cleApp];
    const v = a ? a[quoi] : null;
    return v === true || v === false ? v : null;
  },
  // Les réglages avec un résultat de test de plus (copie : ni les réglages ni leurs tableaux ne sont modifiés en place).
  avecAppareil(reglages, cleApp, resultats, aujourdhui) {
    const r = Object.assign({}, reglages);
    const avant = (reglages && reglages.appareils) || {};
    const base = Object.assign({ ecran: null, son: null, vibration: null, obsidian: null, shortcuts: null }, avant[cleApp] || {});
    for (const k of TESTS_APPAREIL) if (resultats && (resultats[k] === true || resultats[k] === false || resultats[k] === null)) base[k] = resultats[k];
    base.date = aujourdhui;
    r.appareils = Object.assign({}, avant, { [cleApp]: base });
    return r;
  },
  // L'objectif de la semaine (séances) : celui des réglages, sinon celui d'origine.
  objectifSemaine(reglages) {
    return reglages && reglages.parSemaine > 0 ? Math.round(reglages.parSemaine) : REGLAGES_DEFAUT.parSemaine;
  },
  // Les lundis d'une liste de dates des réglages (une date illisible est ignorée).
  lundisDe(liste) {
    return (Array.isArray(liste) ? liste : []).filter((x) => L.deISO(x)).map((x) => L.lundi(x));
  },
  // Met ou retire une date dans une liste de lundis (une nouvelle liste, triée).
  basculerDate(liste, date, oui) {
    const l = Array.isArray(liste) ? liste.filter((x) => x !== date) : [];
    const mettre = oui == null ? !(Array.isArray(liste) && liste.indexOf(date) >= 0) : !!oui;
    return mettre ? l.concat([date]).sort() : l;
  },

  // ── Deux appareils, un seul data.json (iCloud) ──
  // L'empreinte de données lues ou écrites : une chaîne JSON par morceau (la séance en cours, le bilan, chaque réglage, chaque
  // appareil testé). C'est la « base » de la fusion à trois : ce que cet appareil savait du disque la dernière fois.
  empreinteDonnees(d) {
    const j = (x) => JSON.stringify(x === undefined ? null : x);
    const e = { enCours: j(d && d.enCours), bilan: j(d && d.bilan), reglages: null, appareils: null };
    const reg = d && d.reglages;
    if (reg && typeof reg === 'object') {
      e.reglages = {};
      Object.keys(reg).forEach((k) => { if (k !== 'appareils') e.reglages[k] = j(reg[k]); });
      e.appareils = {};
      const a = reg.appareils && typeof reg.appareils === 'object' ? reg.appareils : {};
      Object.keys(a).forEach((k) => { e.appareils[k] = j(a[k]); });
    }
    return e;
  },
  // Ce qu'une séance en cours a d'avancé : séries faites (échauffement compris), approches cochées, exercices passés, réponses
  // à « Il t'en restait combien ? ».
  avancementSeance(sc) {
    if (!sc || !Array.isArray(sc.exos)) return 0;
    return sc.exos.reduce((t, x) => t + (!x ? 0 : (Array.isArray(x.faites) ? x.faites.length : 0) + (x.saute ? 1 : 0) + (x.reserve ? 1 : 0)
      + (Array.isArray(x.approches) ? x.approches.filter((a) => a && a.faite).length : 0)), 0);
  },
  // La séance en cours changée sur les deux appareils depuis la base : laquelle garder, 'ici' ou 'disque'.
  //  - finie ou abandonnée sur l'autre appareil (rien sur le disque), alors qu'ici c'est la même qu'à la base : elle l'est ici
  //    aussi (sa note est déjà écrite) ;
  //  - finie ici : on le reste, sauf si l'autre appareil en a commencé une autre ;
  //  - deux séances différentes : celle d'ici ; la même : celle qui a le plus avancé (à égalité, celle d'ici).
  seanceGagnante(ici, disque, baseTexte) {
    let b = null;
    try { b = baseTexte ? JSON.parse(baseTexte) : null; } catch (e) { b = null; }
    const meme = (x, y) => !!x && !!y && x.debut === y.debut && x.date === y.date && x.nom === y.nom;
    if (!disque) return ici && meme(ici, b) ? 'disque' : 'ici';
    if (!ici) return meme(disque, b) ? 'ici' : 'disque';
    if (!meme(ici, disque)) return 'ici';
    return L.avancementSeance(disque) > L.avancementSeance(ici) ? 'disque' : 'ici';
  },
  // La fusion à trois : local = en mémoire, base = L.empreinteDonnees de la dernière lecture ou écriture, disque = data.json
  // relu (passé par L.lireDonnees). Un morceau qui n'a pas changé ici et a changé sur le disque est repris du disque ; un
  // morceau changé ici est gardé. Changé des deux côtés : les listes de lundis (pauses, malade, semaines légères, 5e case) gardent
  // les ajouts et les retraits des deux appareils ; la séance en cours suit L.seanceGagnante ; le reste, celui d'ici.
  // Les résultats de « Tester cet appareil » se fusionnent appareil par appareil (le Mac n'efface pas ceux de l'iPhone).
  // Modifie local en place (les écrans gardent leurs objets). Rend { change, enCours, bilan, reglages: [clés reprises] }.
  fusionDonnees(local, base, disque) {
    const r = { change: false, enCours: false, bilan: false, reglages: [] };
    if (!local || typeof local !== 'object' || !base || !disque || typeof disque !== 'object') return r;
    const j = (x) => JSON.stringify(x === undefined ? null : x);
    const copie = (x) => (x == null ? null : JSON.parse(JSON.stringify(x)));
    const de = (o, k) => (o && o[k] != null ? o[k] : 'null');   // l'empreinte d'un morceau absent de la base
    const ici = (k) => j(local[k]) !== de(base, k), la = (k) => j(disque[k]) !== de(base, k);
    if (la('enCours') && (!ici('enCours') || L.seanceGagnante(local.enCours, disque.enCours, base.enCours) === 'disque')) {
      local.enCours = copie(disque.enCours);
      r.enCours = true;
    }
    if (la('bilan') && !ici('bilan')) { local.bilan = copie(disque.bilan); r.bilan = true; }
    const lR = local.reglages, dR = disque.reglages;
    if (!lR && dR && !base.reglages) {
      local.reglages = copie(dR);   // l'autre appareil a répondu aux premières questions
      r.reglages.push('*');
    } else if (lR && dR) {
      const bR = base.reglages || {};
      const cles = Object.keys(lR).concat(Object.keys(dR)).filter((k, n, t) => k !== 'appareils' && t.indexOf(k) === n);
      cles.forEach((k) => {
        const b = de(bR, k), iciK = j(lR[k]) !== b, laK = j(dR[k]) !== b;
        if (!laK) return;
        if (!iciK) {
          if (dR[k] === undefined) delete lR[k]; else lR[k] = copie(dR[k]);
          r.reglages.push(k);
        } else if (LISTES_DE_LUNDIS.indexOf(k) >= 0 && Array.isArray(lR[k]) && Array.isArray(dR[k])) {
          let avant = [];
          try { avant = JSON.parse(b) || []; } catch (e) { avant = []; }
          if (!Array.isArray(avant)) avant = [];
          const ajouts = lR[k].filter((x) => avant.indexOf(x) < 0), retraits = avant.filter((x) => lR[k].indexOf(x) < 0);
          const fusion = dR[k].filter((x) => retraits.indexOf(x) < 0).concat(ajouts).filter((x, n, t) => t.indexOf(x) === n).sort();
          if (j(fusion) !== j(lR[k])) { lR[k] = fusion; r.reglages.push(k); }
        }
      });
      const lA = lR.appareils || {}, dA = dR.appareils || {}, bA = base.appareils || {};
      const repris = Object.keys(dA).concat(Object.keys(lA)).filter((k, n, t) => t.indexOf(k) === n)
        .filter((k) => j(dA[k]) !== de(bA, k) && j(lA[k]) === de(bA, k));
      if (repris.length) {
        const n = Object.assign({}, lA);
        repris.forEach((k) => { if (dA[k] == null) delete n[k]; else n[k] = copie(dA[k]); });
        lR.appareils = n;
        r.reglages.push('appareils');
      }
    }
    r.change = r.enCours || r.bilan || r.reglages.length > 0;
    return r;
  },
});
