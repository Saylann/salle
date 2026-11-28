// L : l'index des notes. Une note du coffre analysée une fois (L.analyserNote), puis l'état du plugin assemblé. Pur.

Object.assign(L, {
  // ── L'index des notes (performance) ──
  // Une note du coffre → null (pas une note du plugin) ou { type, seance | programme | guide | mesures | forme }.
  // Une note abîmée n'arrête rien : { type, abime: true }, et la valeur d'origine prend le relais.
  analyserNote(texte) {
    let type = '';
    try { type = L.norm(L.lireEntete(texte).cles.salle); } catch (e) { return null; }
    if (!type) return null;
    const a = { type };
    try {
      if (type === 'seance') a.seance = L.lireSeance(texte);
      else if (type === 'programme') a.programme = L.lireProgramme(texte);
      else if (type === 'guide') a.guide = L.lireGuide(texte);
      else if (type === 'mesures') a.mesures = L.lireMesures(texte);
      else if (type === 'forme') a.forme = L.lireForme(texte);
      else if (type === 'repas') a.repas = L.lireRepas(texte);   // 2.40.0 : le journal des repas (93-calories.js)
    } catch (e) {
      a.abime = true;
    }
    return a;
  },
  // Les notes analysées (dans l'ordre du coffre) → plugin.etat : le premier programme lisible gagne,
  // la première note de chaque autre type gagne, les séances sont triées. Les objets analysés ne sont pas
  // modifiés (une séance reçoit son chemin dans une copie) : l'index peut les garder d'une fois sur l'autre.
  // Les fiches du guide livré avec le plugin, analysées une fois (personne ne modifie l'objet rendu).
  guideDuPlugin() {
    if (!L.guideLu) L.guideLu = L.lireGuide(GUIDE_DEFAUT);
    return L.guideLu;
  },
  assemblerEtat(entrees, programmeDefaut) {
    const e = { programme: null, programmeSecours: false, seances: [], guide: {}, mesures: [], forme: [], repas: [], fichiers: {}, textes: {} };
    for (const x of entrees || []) {
      const a = x && x.a, f = x && x.f;
      if (!a || !a.type || !f) continue;
      if (a.type === 'seance') {
        if (a.seance) e.seances.push(Object.assign({}, a.seance, { chemin: f.path }));
      } else if (a.type === 'programme') {
        const prog = Array.isArray(a.programme) ? a.programme : [];
        if (prog.length && !e.programme) { e.programme = prog; e.fichiers.programme = f; e.textes.programme = x.texte; }
        else if (!e.fichiers.programme) { e.fichiers.programme = f; e.textes.programme = x.texte; }
      } else if (!e.fichiers[a.type]) {
        e.fichiers[a.type] = f;
        e.textes[a.type] = x.texte;
        if (a.type === 'guide') e.guide = a.guide || {};
        if (a.type === 'mesures') e.mesures = a.mesures || [];
        if (a.type === 'forme') e.forme = a.forme || [];
        if (a.type === 'repas') e.repas = a.repas || [];
      }
    }
    e.seances = L.trier(e.seances);
    if (!e.programme) { e.programme = L.lireProgramme(programmeDefaut); e.programmeSecours = true; }
    // 2.23.0 : sans note « guide » ou « manger » dans le coffre, le texte du plugin (analysé une seule fois pour le guide).
    if (!e.fichiers.guide) { e.guide = L.guideDuPlugin(); e.textes.guide = GUIDE_DEFAUT; }
    if (!e.fichiers.manger) e.textes.manger = MANGER_DEFAUT;
    return e;
  },
});
