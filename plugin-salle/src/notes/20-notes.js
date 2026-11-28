// L : lire et écrire les notes (programme, séance, carnet Forme, réserve, « Pas fait », mesures, guide).
// Lecture tolérante : une ligne illisible est ignorée, jamais d'erreur. Les formats : README.md, « Formats ».
Object.assign(L, {
  // ── Le programme ──
  // « Nom · 3 × 8-12 · repos 2 min · pas 2,5 kg · option » → un exercice. Ce qui manque prend une valeur par défaut.
  lireExercice(ligne) {
    const parts = String(ligne).split(/\s*[·•|]\s*/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    const exo = { nom: parts[0].replace(/\*\*|__|`/g, '').trim(), series: 3, min: 8, max: 12, unite: 'reps', repos: 90, pas: 2.5, option: false, corps: false };
    if (!exo.nom) return null;
    for (const p of parts.slice(1)) {
      const n = L.norm(p);
      let m;
      if ((m = /^(\d+)\s*[x×*]\s*(\d+)(?:\s*(?:-|–|a)\s*(\d+))?\s*(s|sec|secondes?)?$/.exec(n))) {
        exo.series = Math.min(10, Math.max(1, +m[1]));
        exo.min = +m[2];
        exo.max = Math.max(exo.min, m[3] ? +m[3] : +m[2]);
        exo.unite = m[4] ? 's' : 'reps';
      } else if ((m = /^repos\s*(\d+)\s*(min|s)\w*(?:\s*(\d+))?/.exec(n))) {
        exo.repos = m[2] === 'min' ? +m[1] * 60 + (m[3] ? +m[3] : 0) : +m[1];
      } else if ((m = /^pas\s*(\d+(?:[.,]\d+)?)/.exec(n))) {
        exo.pas = L.nombre(m[1]) || 2.5;
      } else if ((m = /^a vide\s*(\d+(?:[.,]\d+)?)/.exec(n))) {
        exo.vide = L.nombre(m[1]) || 0;   // « à vide 12 kg » : le poids de la barre, quand on ne note que les disques (L.aVide)
      } else if (/^(a\s+)?disques?$/.test(n)) {
        exo.disques = true;   // « disques » : un appareil qu'on charge avec des disques, pareil des deux côtés (L.aDisques)
      } else if (n.startsWith('option')) {
        exo.option = true;
      } else if (/^priorites?$/.test(n)) {
        exo.priorite = true;   // « priorité », seul : une série de plus dans une séance longue (L.adapter, D4), où qu'il soit écrit
      } else if (n.startsWith('poids du corps')) {
        exo.corps = true;
      } else if (L.lireEtage(n) != null) {
        exo.etage = L.lireEtage(n);   // « étage 1 », « etage 2 », « 2e étage », « RDC » (0 = RDC)
      } else if (/^(banc|dossier|siege)\b/.test(n)) {
        exo.reglage = p.replace(/\*\*|__|`/g, '').trim();   // « banc 30° (2e ou 3e cran) », « dossier presque droit, 80 à 90° »
      } else if (/^ou\s+\S/.test(n)) {
        // « ou Tractions (poids du corps) / Autre exercice » : les remplaçants quand la machine est prise
        const alts = p.replace(/^\s*ou\s+/i, '').split(/\s*\/\s*/).map((a) => {
          const corps = /\(\s*poids du corps\s*\)/i.test(a);
          return { nom: a.replace(/\(\s*poids du corps\s*\)/i, '').replace(/\*\*|__|`/g, '').trim(), corps };
        }).filter((a) => a.nom);
        if (alts.length) exo.alternatives = alts;
      }
    }
    return exo;
  },
  // « étage 2 », « Etage 2 », « 2e étage », « niveau 1 », « RDC », « rez-de-chaussée » → 0 à 9 ; autre chose → null.
  lireEtage(s) {
    const n = L.norm(s).replace(/-/g, ' ');
    let m;
    if (/^(rdc|rez de chaussee)\b/.test(n)) return 0;
    if ((m = /^(?:etage|niveau)\s*(\d)\b/.exec(n))) return +m[1];
    if ((m = /^(\d)\s*(?:er|e|eme|ieme)?\s*etage\b/.exec(n))) return +m[1];
    return null;
  },
  // La note du programme → [{ nom, exos }]. Un titre « ## » = une séance, une puce = un exercice.
  lireProgramme(texte) {
    const { corps } = L.lireEntete(texte);
    const seances = [];
    let cur = null;
    for (const brute of corps.split(/\r?\n/)) {
      const ligne = brute.trim();
      const t = /^##\s+(.+?)\s*#*$/.exec(ligne);
      if (t) { cur = { nom: t[1].replace(/\*\*/g, '').trim(), exos: [] }; seances.push(cur); continue; }
      if (/^#\s/.test(ligne)) { cur = null; continue; }
      const e = /^[-*+]\s+(?:\[.\]\s+)?(.+)$/.exec(ligne);
      if (e && cur) { const x = L.lireExercice(e[1]); if (x) cur.exos.push(x); }
    }
    return seances.filter((s) => s.exos.length);
  },

  // Une empreinte courte d'un texte : savoir si le programme livré a changé depuis la dernière fois (sur cet appareil).
  empreinteTexte(texte) {
    const s = String(texte == null ? '' : texte);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36) + '-' + s.length.toString(36);
  },
  // 2.38.80 (demande : « si je change l'ordre des exercices chez moi, ça doit aussi le faire chez lui ») : la note du
  // programme d'un utilisateur suit le programme livré par le plugin (celui de l'auteur). → { texte, quoi } :
  //  'rien'     : chaque séance du livré a, dans la note, les mêmes exercices dans le même ordre, avec les mêmes marques
  //               « priorité » ;
  //  'ordre'    : mêmes exercices, mais un autre ordre ou d'autres marques : dans ces séances, les lignes de la note sont
  //               remises dans l'ordre du livré ; chacune garde son contenu (séries, pas, étage, remplaçants…), seule la
  //               marque « priorité » suit le livré ; le reste de la note ne bouge pas ;
  //  'remplace' : d'autres exercices (un programme livré par une version d'avant) : la note devient le programme livré, avec
  //               le matériel de sa salle repris de la note (L.reprendreCrans : cran, disques, étage…).
  suivreProgrammeLivre(texteNote, texteLivre) {
    const note = String(texteNote == null ? '' : texteNote), livre = String(texteLivre == null ? '' : texteLivre);
    const pl = L.lireProgramme(livre), pn = L.lireProgramme(note);
    if (!pl.length) return { texte: note, quoi: 'rien' };
    const cle = (nom) => L.norm(String(nom).replace(/\*\*/g, '').trim());
    const dans = (s) => pn.find((x) => cle(x.nom) === cle(s.nom));
    const noms = (s) => s.exos.map((e) => cle(e.nom));
    const memes = (a, b) => a.slice().sort().join('|') === b.slice().sort().join('|');
    if (!pl.every((s) => dans(s) && memes(noms(dans(s)), noms(s)))) return { texte: L.reprendreCrans(livre, note, livre), quoi: 'remplace' };
    if (pl.every((s) => noms(dans(s)).join('|') === noms(s).join('|') && dans(s).exos.every((e, k) => !!e.priorite === !!s.exos[k].priorite))) {
      return { texte: note, quoi: 'rien' };
    }
    const lignes = note.split('\n');
    const titre = (l) => { const m = /^##\s+(.+?)\s*#*$/.exec(l.trim()); return m ? cle(m[1]) : null; };
    const exoDe = (l) => { const m = /^[-*+]\s+(?:\[.\]\s+)?(.+)$/.exec(l.trim()); return m ? L.lireExercice(m[1]) : null; };
    const marquer = (l, oui) => {
      const sans = l.replace(/\s*[·•|]\s*priorit[eé]s?(?=\s*(?:[·•|]|$))/i, '');
      if (!oui) return sans;
      return /\s[·•|]\s*pas\b/i.test(sans) ? sans.replace(/(\s[·•|]\s*pas\b)/i, ' · priorité$1') : sans.replace(/\s*$/, '') + ' · priorité';
    };
    // Les blocs de séance : leur titre et les numéros de leurs lignes d'exercice.
    const blocs = [];
    let cur = null;
    lignes.forEach((l, i) => {
      const t = titre(l);
      if (t) { cur = { t, puces: [] }; blocs.push(cur); return; }
      if (/^#\s/.test(l.trim())) { cur = null; return; }
      if (cur && exoDe(l)) cur.puces.push(i);
    });
    for (const b of blocs) {
      const s = pl.find((x) => cle(x.nom) === b.t);
      if (!s) continue;
      const libres = b.puces.slice();
      const neuves = s.exos.map((e) => {
        const k = libres.findIndex((i) => { const x = exoDe(lignes[i]); return x && cle(x.nom) === cle(e.nom); });
        const i = libres.splice(k, 1)[0];
        return marquer(lignes[i], !!e.priorite);
      });
      b.puces.forEach((i, k) => { lignes[i] = neuves[k]; });
    }
    return { texte: lignes.join('\n'), quoi: 'ordre' };
  },

  // 2.41.15 (le téléphone de son pote montait les élévations aux haltères de 1 en 1 kg) : quand la note devient le programme
  // livré (« remplace »), elle perdait ce que l'utilisateur avait écrit sur le matériel de SA salle : le cran (« pas 2 kg »),
  // « disques », « à vide … », l'étage, le réglage du banc. → le texte de la note, avec ce matériel repris de l'ancienne note
  // (texteAvant), exercice par exercice (même nom) ; un exercice aux haltères qui n'y était pas prend le cran de ses haltères
  // (le plus gros). On ne touche qu'à ce qui vaut encore ce que dit le programme livré (texteLivre) : un cran changé à la main
  // depuis reste. Rien à reprendre : le même texte.
  reprendreCrans(texteNote, texteAvant, texteLivre) {
    const note = String(texteNote == null ? '' : texteNote);
    const avant = L.lireProgramme(String(texteAvant == null ? '' : texteAvant));
    if (!avant.length) return note;
    const livre = L.lireProgramme(String(texteLivre == null ? '' : texteLivre));
    const cle = (nom) => L.norm(String(nom).replace(/\*\*/g, '').trim());
    const tous = (prog) => [].concat(...prog.map((s) => s.exos));
    const ancien = {};
    tous(avant).forEach((e) => { if (!ancien[cle(e.nom)]) ancien[cle(e.nom)] = e; });
    const livres = {};
    tous(livre).forEach((e) => { if (!livres[cle(e.nom)]) livres[cle(e.nom)] = e; });
    const pasH = tous(avant).filter((e) => /halteres/.test(cle(e.nom)) && e.pas > 0).map((e) => e.pas);
    const halteres = pasH.length ? Math.max(...pasH) : 0;
    const SEP = /\s*[·•|]\s*/;
    const changer = (ligne) => {
      const m = /^(\s*[-*+]\s+(?:\[.\]\s+)?)(.+)$/.exec(ligne);
      const x = m ? L.lireExercice(m[2]) : null;
      if (!x) return ligne;
      const a = ancien[cle(x.nom)], l = livres[cle(x.nom)] || null;
      const intact = (champ, defaut) => (l ? x[champ] === l[champ] : x[champ] === defaut);
      let parts = m[2].split(SEP);
      const ajouter = (morceau) => {
        const k = parts.findIndex((p, i) => i > 0 && /^ou\s+\S/i.test(L.norm(p)));
        if (k > 0) parts.splice(k, 0, morceau); else parts.push(morceau);
      };
      // Seulement un cran plus gros que celui du livré : un cran plus petit dans une vieille note est souvent l'ancien cran
      // livré par défaut (2,5 kg partout), pas celui de sa salle ; et un cran plus gros ne propose jamais une charge plus fine
      // que ce que l'appareil permet.
      const pas = a && a.pas > 0 ? a.pas : !a && /halteres/.test(cle(x.nom)) && halteres ? halteres : 0;
      if (pas > x.pas && intact('pas', 2.5)) {
        const k = parts.findIndex((p, i) => i > 0 && /^pas\s*\d/.test(L.norm(p)));
        if (k > 0) parts[k] = `pas ${L.fmt(pas)} kg`; else ajouter(`pas ${L.fmt(pas)} kg`);
      }
      if (a) {
        if (a.disques && !x.disques) ajouter('disques');
        if (a.vide >= 0 && !(x.vide >= 0)) ajouter(`à vide ${L.fmt(a.vide)} kg`);
        if (a.etage != null && x.etage == null) ajouter(a.etage === 0 ? 'RDC' : `étage ${a.etage}`);
        if (a.reglage && !x.reglage) ajouter(a.reglage);
      }
      const neuve = m[1] + parts.join(' · ');
      return neuve === m[0] ? ligne : neuve;
    };
    return note.split('\n').map((ligne) => (/^\s*[-*+]\s+/.test(ligne) ? changer(ligne) : ligne)).join('\n');
  },

  // ── Les séances ──
  // Une série : { c: charge en kg, r: répétitions } ou { s: secondes }.
  ecrireSerie(x) {
    if (x.s != null) return `${x.s} s`;
    return x.c ? `${L.fmt(x.c)} kg × ${x.r}` : `${x.r} rép.`;
  },
  lireSerie(t) {
    const n = L.norm(t);
    let m;
    if ((m = /^(\d+(?:[.,]\d+)?)\s*kg\s*[x×*]\s*(\d+)/.exec(n))) return { c: L.nombre(m[1]), r: +m[2] };
    if ((m = /^(\d+)\s*s(?:ec\w*)?$/.exec(n))) return { s: +m[1] };
    if ((m = /^(\d+)\s*(?:rep\S*|x)?$/.exec(n))) return { c: 0, r: +m[1] };
    return null;
  },
  ecrireSeance(s) {
    const lignes = ['---', 'salle: seance', `date: ${s.date}`, `nom: ${s.nom}`];
    if (s.dureeMin) lignes.push(`duree_min: ${s.dureeMin}`);
    if (s.ressenti) lignes.push(`ressenti: ${s.ressenti}`);
    if (s.cardioMin > 0) lignes.push(`cardio_min: ${Math.round(s.cardioMin)}`);
    if (s.veloNiveau > 0) lignes.push(`velo_niveau: ${Math.round(s.veloNiveau)}`);
    if (s.bilan) L.clesBilan(s.bilan).forEach(([k, v]) => lignes.push(`${k}: ${v}`));   // le bilan d'avant la séance
    lignes.push('---', `# ${s.nom} · ${L.dateLongue(s.date)}`, '');
    // L'échauffement en une ligne de texte, jamais en « ## » (il ne compte ni dans les progrès ni dans les records).
    const ech = L.ligneEchauffement(s.echauffement);
    if (ech) lignes.push(ech, '');
    const pf = L.lignePasFait(s.pasFait);   // les exercices passés, en une ligne
    if (pf) lignes.push(pf, '');
    for (const e of s.exos) {
      if (!e.series.length) continue;
      lignes.push(`## ${e.nom}`);
      for (const x of e.series) lignes.push('- ' + L.ecrireSerie(x));
      if (e.reserve) lignes.push('', L.ecrireReserve(e.reserve));   // une ligne de texte sous les séries (pas une puce)
      lignes.push('');
    }
    return lignes.join('\n');
  },
  lireSeance(texte) {
    const { cles, corps } = L.lireEntete(texte);
    if (L.norm(cles.salle) !== 'seance') return null;
    const date = (/^\d{4}-\d{2}-\d{2}/.exec(cles.date || '') || [null])[0];
    if (!date || !L.deISO(date)) return null;
    const exos = [], pasFait = [];
    let cur = null, echauffement = null;
    for (const brute of corps.split(/\r?\n/)) {
      const ligne = brute.trim();
      const t = /^##\s+(.+?)\s*#*$/.exec(ligne);
      if (t) { cur = { nom: t[1].trim(), series: [] }; exos.push(cur); continue; }
      const pf = L.lirePasFait(ligne);
      if (pf) { pasFait.push(...pf); continue; }
      // La ligne « Échauffement : … » (avec ou sans puce, avant ou après un « ## ») n'est jamais une série.
      const ech = L.lireEchauffement(ligne);
      if (ech) { if (!echauffement) echauffement = ech; continue; }
      const e = /^[-*+]\s+(.+)$/.exec(ligne);
      if (e && cur) { const x = L.lireSerie(e[1]); if (x) cur.series.push(x); continue; }
      if (cur && /^reserve\s*:/.test(L.norm(ligne))) { const r = L.lireReserve(ligne); if (r) cur.reserve = r; }
    }
    const seance = { date, nom: cles.nom || 'Séance', dureeMin: +cles.duree_min || 0, ressenti: cles.ressenti || '', exos: exos.filter((e) => e.series.length) };
    if (+cles.cardio_min > 0) seance.cardioMin = +cles.cardio_min;
    if (+cles.velo_niveau > 0) seance.veloNiveau = +cles.velo_niveau;
    if (pasFait.length) seance.pasFait = pasFait;
    if (echauffement) seance.echauffement = echauffement;   // { min, nbApproches }, seulement si la ligne existe
    const bilan = L.lireBilanCles(cles, date);
    if (bilan) seance.bilan = bilan;
    return seance;
  },
  // « Échauffement : 5 min, puis approches : Tirage 8 × 20 kg, 4 × 30 kg ; Presse 8 × 30 kg » → { min: 5, nbApproches: 3 }.
  // Lit aussi l'ancienne forme (« 5 min, puis 10 × 17,5 kg ») et les notes à la main (« - Échauffement : 10 min de vélo »).
  // Pas une ligne d'échauffement → null. Le format « 8 × 20 kg » (répétitions d'abord) n'est pas celui d'une série.
  lireEchauffement(ligne) {
    const n = L.norm(String(ligne == null ? '' : ligne).trim().replace(/^[-*+]\s+/, ''));
    if (!/^echauffement\s*:/.test(n)) return null;
    const m = /(\d+)\s*min\b/.exec(n);
    const charges = n.match(/\d+\s*[x×]\s*\d+(?:[.,]\d+)?\s*kg/g) || [];
    const legeres = n.match(/repetitions? tres legeres?/g) || [];
    return { min: m ? +m[1] : 0, nbApproches: charges.length + legeres.length };
  },
  // La réserve après la dernière série (« Il t'en restait combien ? ») : '0', '1-2' ou '3+'.
  lireReserve(s) {
    const n = L.norm(s).replace(/^reserve\s*:?\s*/, '');
    return /^0|fond/.test(n) ? '0' : /^[12]/.test(n) ? '1-2' : /^[3-9]|plus/.test(n) ? '3+' : null;
  },
  ecrireReserve(r) {
    return 'Réserve : ' + ({ 0: '0 (à fond)', '1-2': '1 ou 2', '3+': '3 ou plus' }[r] || r);
  },
  // « Pas fait : Face pull à la poulie (temps), Curl aux haltères » : une ligne de texte dans la note, jamais un exercice.
  lignePasFait(liste) {
    const l = (liste || []).filter((x) => x && x.nom);
    if (!l.length) return '';
    const r = (k) => { const t = L.RAISONS.find((x) => x[0] === k); return t ? ` (${t[1].toLowerCase()})` : ''; };
    return 'Pas fait : ' + l.map((x) => x.nom + r(x.raison)).join(', ');
  },
  lirePasFait(ligne) {
    const m = /^pas fait\s*:\s*(.+)$/i.exec(String(ligne).trim());
    if (!m) return null;
    return m[1].split(/\s*,\s*/).map((t) => {
      const r = /^(.+?)\s*\(([^)]*)\)\s*\.?$/.exec(t);
      const nom = (r ? r[1] : t).replace(/\.$/, '').trim();
      const k = r ? L.norm(r[2]) : '';
      const raison = (L.RAISONS.find((x) => L.norm(x[1]) === k || x[0] === k) || [''])[0];
      return raison ? { nom, raison } : { nom };
    }).filter((x) => x.nom);
  },
  // Un nom de fichier aux conventions des développeurs (2.38.0, demande : pas de lettre accentuée dans les noms des fichiers
  // de données) : minuscules, sans accent, des lettres et des chiffres séparés par des tirets. « Séance A » → « seance-a »,
  // « Ma salle (2) » → « ma-salle-2 ». '' si rien ne reste.
  nomSimple(nom) {
    return String(nom == null ? '' : nom).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  },
  // Le fichier d'une séance : « 2026-11-16-seance-a » (la date d'abord : l'ordre des noms est l'ordre des jours).
  nomFichier(date, nom) {
    return `${date}-${L.nomSimple(nom) || 'seance'}`;
  },
  trier(seances) {
    return seances.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.chemin || '') < String(b.chemin || '') ? -1 : 1));
  },

  // ── Le bilan et le carnet Forme ──
  // Lecture tolérante : « qui tire : coude », « vive, coude », « aucune ».
  lireDouleur(s) {
    const n = L.norm(s).replace(/^douleurs?\s*/, '');
    if (!n || /^:?\s*(aucune|non|rien)/.test(n)) return null;
    const zone = /epaule/.test(n) ? 'epaule' : /coude/.test(n) ? 'coude' : /poignet/.test(n) ? 'poignet' : /dos|lombaire|rein/.test(n) ? 'bas du dos' : /genou/.test(n) ? 'genou' : 'autre';
    return { zone, type: /tire|courbature/.test(n) ? 'tire' : 'vive' };
  },
  lireCourb(s) {
    const n = L.norm(s).replace(/^courbatures?\s*/, '');
    const niveau = /fort/.test(n) ? 'fortes' : /leger/.test(n) ? 'legeres' : 'aucune';
    const zones = niveau === 'aucune' ? [] : Object.keys(ZONES_COURB).filter((z) => ZONES_COURB[z][3].test(n));
    return { niveau, zones };
  },
  // Le carnet Forme : « - 2026-11-16 · courbatures fortes : bras · douleur : aucune · sommeil : moins de 6 h ». Lignes libres
  // ignorées. Les lignes d'avant la 2.1.2 (« forme normale », « fatigué », « repas : plus de 4 h », « 60 min ») se lisent
  // toujours : ces morceaux ne changent plus rien et ne sont pas gardés ; une ligne qui n'a que la forme compte comme un bilan.
  lireForme(texte) {
    const out = [];
    for (const brute of L.lireEntete(texte).corps.split(/\r?\n/)) {
      const m = /^[-*+]\s*(\d{4}-\d{2}-\d{2})\b(.*)$/.exec(brute.trim());
      if (!m || !L.deISO(m[1]) || L.dateISO(L.deISO(m[1])) !== m[1]) continue;   // date impossible : ligne ignorée
      const x = { date: m[1], douleur: null, courb: { niveau: 'aucune', zones: [] } };
      let lu = false;
      for (const p of m[2].split(/\s*[·•|]\s*/)) {
        const n = L.norm(p);
        if (/^courbature/.test(n)) { x.courb = L.lireCourb(p); lu = true; } else if (/^douleur/.test(n)) { x.douleur = L.lireDouleur(p); lu = true; } else if (/^sommeil/.test(n)) { if (/moins|court/.test(n)) x.sommeil = 'court'; } else if (/^forme|fatigu|mal dormi|^en forme/.test(n)) { lu = true; }
      }
      if (lu) out.push(x);
    }
    return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  },
  // La ligne du bilan dans le carnet Forme : les courbatures (fortes, ou aucune), la douleur, et la nuit seulement si elle a été
  // courte (absente = 6 h ou plus).
  ligneForme(b) {
    const c = b.courb && b.courb.niveau === 'fortes' ? `courbatures fortes : ${b.courb.zones.map((z) => ZONES_COURB[z][0]).join(', ')}` : 'courbatures : aucune';
    const d = b.douleur ? `douleur ${b.douleur.type === 'tire' ? 'qui tire' : 'vive'} : ${ZONES_DOULEUR[b.douleur.zone][0]}` : 'douleur : aucune';
    return `- ${b.date} · ${c} · ${d}${b.sommeil === 'court' ? ' · sommeil : moins de 6 h' : ''}`;
  },
  // Les clés du bilan dans l'en-tête de la note de séance (sans accent : douleur, courbatures, puis sommeil s'il compte).
  clesBilan(b) {
    const k = [['douleur', b.douleur ? `${b.douleur.type === 'tire' ? 'qui tire' : 'vive'}, ${b.douleur.zone}` : 'aucune']];
    k.push(['courbatures', b.courb && b.courb.niveau === 'fortes' ? ['fortes'].concat(b.courb.zones).join(', ') : 'aucune']);
    if (b.sommeil === 'court') k.push(['sommeil', 'moins de 6 h']);
    return k;
  },
  // Le bilan relu dans l'en-tête d'une note de séance. Les notes d'avant la 2.1.2 ont aussi « forme » et « repas » (lus, sans
  // effet) et « temps_min » (le temps du jour de cette séance-là : gardé, L.niveau en a besoin pour ses séries prévues).
  lireBilanCles(cles, date) {
    if (cles.forme == null && cles.douleur == null && cles.courbatures == null) return null;
    const b = { date, douleur: L.lireDouleur(cles.douleur || ''), courb: L.lireCourb(cles.courbatures || '') };
    if (+cles.temps_min > 0) b.temps = +cles.temps_min;
    if (/moins|court/.test(L.norm(cles.sommeil))) b.sommeil = 'court';
    return b;
  },

  // ── Les mesures ──
  // « - 2026-11-16 · poids 68 kg · épaules 112 cm · bras 31 cm · poitrine 95 cm · ![[Photos/2026-11-16-palier.jpg]] »
  // Le tour de bras et la photo d'un palier (un lien ![[…]], le dernier de la ligne). Le lien est retiré avant de
  // lire les nombres (une date dans son nom n'est jamais une mesure) ; l'ancien lecteur, qui ne cherche que poids, épaules et
  // poitrine, lit toujours la ligne.
  // Le tour de taille, au nombril (« taille 82 cm », « tour de taille : 82 ») ; un ancien lecteur l'ignore.
  lireMesures(texte) {
    const { corps } = L.lireEntete(texte);
    const out = [];
    for (const brute of corps.split(/\r?\n/)) {
      const m = /^[-*+]\s*(\d{4}-\d{2}-\d{2})\b(.*)$/.exec(brute.trim());
      if (!m) continue;
      const liens = [];
      const sansLiens = m[2].replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (x, lien) => { liens.push(lien.trim()); return ' '; });
      const reste = L.norm(sansLiens);
      const mesure = { date: m[1] };
      for (const k of ['poids', 'epaules', 'bras', 'poitrine', 'taille']) {
        const r = new RegExp('(?:^|[^a-z])' + k + '\\s*:?\\s*(\\d+(?:[.,]\\d+)?)').exec(reste);
        if (r) mesure[k] = L.nombre(r[1]);
      }
      if (liens.length) mesure.photo = liens[liens.length - 1];
      out.push(mesure);
    }
    return out.sort((a, b) => (a.date < b.date ? -1 : 1));
  },
  ligneMesure(m) {
    const parts = [m.date];
    if (m.poids != null) parts.push(`poids ${L.fmt(m.poids)} kg`);
    if (m.epaules != null) parts.push(`épaules ${L.fmt(m.epaules)} cm`);
    if (m.bras != null) parts.push(`bras ${L.fmt(m.bras)} cm`);
    if (m.poitrine != null) parts.push(`poitrine ${L.fmt(m.poitrine)} cm`);
    if (m.taille != null) parts.push(`taille ${L.fmt(m.taille)} cm`);
    if (typeof m.photo === 'string' && m.photo.trim()) parts.push(`![[${m.photo.trim()}]]`);
    return '- ' + parts.join(' · ');
  },
  // Le texte de la note Mesures avec la photo liée à la ligne du jour (la dernière ligne datée de ce jour, sinon une
  // nouvelle ligne à la fin). Rien d'autre ne change dans la note.
  lierPhotoMesure(texte, date, chemin) {
    const lien = `![[${chemin}]]`;
    const lignes = String(texte || '').replace(/\s*$/, '').split(/\r?\n/);
    const motif = new RegExp(`^[-*+]\\s*${date}\\b`);
    let k = -1;
    lignes.forEach((l, i) => { if (motif.test(l.trim())) k = i; });
    if (k >= 0) lignes[k] = lignes[k].replace(/\s*$/, '') + ' · ' + lien;
    else lignes.push(`- ${date} · ${lien}`);
    return lignes.join('\n') + '\n';
  },

  // ── Le guide, et une note découpée pour l'écran ──
  // La note du guide → { nom normalisé : { titre, lignes } }, une section « ## » par exercice.
  lireGuide(texte) {
    const { corps } = L.lireEntete(texte);
    const guide = {};
    let cur = null;
    for (const brute of corps.split(/\r?\n/)) {
      const t = /^##\s+(.+?)\s*#*$/.exec(brute.trim());
      if (t) { cur = { titre: t[1].trim(), lignes: [] }; guide[L.norm(cur.titre)] = cur; continue; }
      if (/^#\s/.test(brute.trim())) { cur = null; continue; }
      if (cur) cur.lignes.push(brute);
    }
    return guide;
  },
  // Une note découpée pour l'écran : l'introduction (titre null), puis une section par titre « ## ».
  sections(texte) {
    const { corps } = L.lireEntete(texte);
    const out = [{ titre: null, lignes: [] }];
    for (const brute of corps.split(/\r?\n/)) {
      const t = /^##\s+(.+?)\s*#*$/.exec(brute.trim());
      if (t) { out.push({ titre: t[1].trim(), lignes: [] }); continue; }
      if (/^#\s/.test(brute.trim())) continue;
      out[out.length - 1].lignes.push(brute);
    }
    return out.filter((x) => x.titre || x.lignes.some((l) => l.trim()));
  },
  // Les plats d'une partie de la note « Manger » (« ## Midi ») : « ### Nom du plat », puis sa recette (ses lignes, jusqu'au plat
  // suivant). → { avant: les lignes d'avant le premier plat, plats: [{ nom, lignes }] } ; sans « ### » : plats = [].
  plats(lignes) {
    const out = { avant: [], plats: [] };
    for (const brute of lignes || []) {
      const t = /^###\s+(.+?)\s*#*$/.exec(String(brute).trim());
      if (t) out.plats.push({ nom: t[1].trim(), lignes: [] });
      else (out.plats.length ? out.plats[out.plats.length - 1].lignes : out.avant).push(brute);
    }
    return out;
  },

});
