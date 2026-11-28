// L : le lien obsidian://salle, la dernière version publiée. Pur.

Object.assign(L, {
  // ── Le lien obsidian://salle ──
  // obsidian://salle?vault=…&ecran=… (le coffre d'abord : sur iPhone, Obsidian rouvre sinon le dernier coffre ouvert).
  lienSalle(coffre, ecran, plus) {
    const q = [];
    if (coffre) q.push('vault=' + encodeURIComponent(coffre));
    if (ecran) q.push('ecran=' + encodeURIComponent(ecran));
    for (const k of Object.keys(plus || {})) q.push(k + '=' + encodeURIComponent(plus[k]));
    return `obsidian://${ACTION_LIEN}` + (q.length ? '?' + q.join('&') : '');
  },
  // Que faire d'un lien reçu ? { faire: 'ouvrir' | 'seance' | 'aller', ecran?, test }. Sans réglages : ouvrir (les premières questions).
  routeLien(params, regle) {
    const p = params || {};
    const test = ['obsidian', 'raccourci-ok', 'raccourci-erreur'].indexOf(p.test) >= 0 ? p.test : null;
    if (!regle) return { faire: 'ouvrir', test };
    if (test) return { faire: 'aller', ecran: 'diagnostic', test };
    const e = L.norm(p.ecran);
    if (!e) return { faire: 'ouvrir', test: null };
    if (e === 'seance') return { faire: 'seance', test: null };
    if (ECRANS_LIEN.indexOf(e) >= 0) return { faire: 'aller', ecran: e, test: null };
    return { faire: 'aller', ecran: 'accueil', test: null };
  },
  // ── La dernière version publiée (2.38.85, demande : à côté de la date, dire si la version est à jour) ──
  // Les adresses du manifeste publié, d'après l'adresse du dépôt écrite dans le manifeste du plugin (« authorUrl »,
  // https://github.com/compte/depot) → [la dernière publication, le manifeste du dépôt en secours], ou [] sans dépôt GitHub.
  // 2.38.88 (demande : « ça affichait à jour mais il n'était pas à jour ») : d'abord le manifeste de la dernière publication
  // (celle que BRAT installe ; github.com la calcule à chaque demande) : le manifeste du dépôt (raw.githubusercontent.com)
  // reste en cache 5 minutes, il annonçait encore la version d'avant juste après une publication. Ni l'une ni l'autre ne
  // passe par l'API de GitHub (60 demandes par heure et par adresse internet). Vérifié le 25/11/2026 : la première répond
  // « no-cache » ; le secours garde son cache de 5 minutes même avec un « ?t=… » ajouté (il l'ignore).
  adressesManifestePublie(depot) {
    const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)\/?$/.exec(String(depot || '').trim());
    return m ? [`https://github.com/${m[1]}/${m[2]}/releases/latest/download/manifest.json`, `https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/manifest.json`] : [];
  },
  // Deux versions « 2.38.84 » : -1 (a plus ancienne), 0, 1 ; null si l'une est illisible.
  comparerVersions(a, b) {
    const lire = (v) => (typeof v === 'string' && /^\d+(\.\d+)*$/.test(v.trim()) ? v.trim().split('.').map(Number) : null);
    const x = lire(a), y = lire(b);
    if (!x || !y) return null;
    for (let k = 0; k < Math.max(x.length, y.length); k++) {
      const d = (x[k] || 0) - (y[k] || 0);
      if (d) return d < 0 ? -1 : 1;
    }
    return 0;
  },
  // La version installée face à la publiée : 'a-jour' (la même, ou plus récente : le coffre où le plugin est fabriqué),
  // 'en-retard', ou null (pas encore su : hors ligne, pas de dépôt).
  etatVersion(installee, publiee) {
    const c = L.comparerVersions(installee, publiee);
    return c == null ? null : c < 0 ? 'en-retard' : 'a-jour';
  },
  // Le test du raccourci « Repos salle » : un minuteur de 3 s, puis le retour dit si le raccourci a marché ou non.
  urlTestRaccourci(coffre) {
    const ok = encodeURIComponent(L.lienSalle(coffre, 'diagnostic', { test: 'raccourci-ok' }));
    const ko = encodeURIComponent(L.lienSalle(coffre, 'diagnostic', { test: 'raccourci-erreur' }));
    return `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(RACCOURCI)}&input=text&text=3&x-success=${ok}&x-cancel=${ko}&x-error=${ko}`;
  },
});
