// 2.5.1 : des textes courts dans les sources (l'utilisateur lit sur iPhone, 375 px : « tu continues à me faire des longs
// paragraphes, j'aime pas ça »). Chaque chaîne de main.js qui contient une espace (un texte, pas un nom de classe) : sa partie
// visible, avant « \n », tient en L.LIGNE_MAX signes (environ 2 lignes à 375 px), sans compter les ** du gras ; un ${…}
// compte pour 3. La suite après « \n », ou une chaîne qui commence par « Pourquoi : » (« Lesquels », « Comment »…), va dans
// un détail repliable (texteCourt, texteListe : src/50-ui.js). Hors compte : les notes livrées (PROGRAMME_DEFAUT,
// FORME_DEFAUT, le texte de modeles/) et les commentaires. Le même contrôle sur les écrans dessinés : tests/textes-courts.js.

// Les chaînes d'un texte JavaScript : [{ texte, ligne }] (ligne : 1 = la première). Les commentaires et les expressions
// régulières sont sautés.
function chainesJs(src) {
  const out = [];
  let i = 0, ligne = 1, dernier = '';
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '\n') { ligne++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (src.startsWith('//', i)) { const j = src.indexOf('\n', i); i = j < 0 ? n : j; continue; }
    if (src.startsWith('/*', i)) { const j = src.indexOf('*/', i + 2); ligne += src.slice(i, j).split('\n').length - 1; i = j + 2; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      let j = i + 1, prof = 0, t = '';
      while (j < n) {
        const d = src[j];
        if (d === '\\') { t += src[j + 1] === 'n' ? '\n' : src[j + 1]; j += 2; continue; }
        if (c === '`' && src.startsWith('${', j)) { prof++; t += prof === 1 ? '\u0000' : ''; j += 2; continue; }
        if (c === '`' && prof && d === '{') { prof++; j++; continue; }
        if (c === '`' && prof && d === '}') { prof--; j++; continue; }
        if (!prof && d === c) break;
        if (!prof) t += d;
        j++;
      }
      out.push({ texte: t.replace(/\u0000/g, 'xxx'), ligne });
      ligne += src.slice(i, j).split('\n').length - 1;
      i = j + 1; dernier = 'x';
      continue;
    }
    if (c === '/' && (!dernier || /[(,=:[!&|?{};+\-*%<>~^]/.test(dernier) || /\b(return|typeof|case)$/.test(src.slice(Math.max(0, i - 8), i).trimEnd()))) {
      let j = i + 1, classe = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') classe = true; else if (src[j] === ']') classe = false;
        else if (src[j] === '/' && !classe) break;
        j++;
      }
      i = j + 1; dernier = 'x';
      continue;
    }
    dernier = c;
    i++;
  }
  return out;
}

// 2.5.1 : chaque texte des sources tient en 2 lignes à 375 px, le reste replié.
{
  const main = readFile(FABRIQUE + '/main.js').split('\n');
  // Les morceaux de src/ (repère « // ── src/… ── » de construire.py), sans les notes livrées insérées par MODELE().
  const morceaux = [];
  let courant = null;
  main.forEach((l, k) => {
    const m = /^\/\/ ── (src\/\S+\.js) ──$/.exec(l);
    if (m) { courant = { fichier: m[1], debut: k + 1, lignes: [] }; morceaux.push(courant); return; }
    if (courant) courant.lignes.push(/^const (PROGRAMME_DEFAUT|FORME_DEFAUT) = /.test(l) ? '' : l);
  });
  vrai(morceaux.length >= 20, `main.js découpé en morceaux de src/ (${morceaux.length})`);
  const titres = new RegExp(`^(${TITRES_REPLIABLES.join('|')})\\s*:`);
  const longs = [];
  for (const m of morceaux) {
    for (const c of chainesJs(m.lignes.join('\n'))) {
      if (c.texte.indexOf(' ') < 0 || titres.test(c.texte)) continue;
      const visible = c.texte.split('\n')[0].replace(/\*\*/g, '');
      if (visible.length > L.LIGNE_MAX) longs.push(`${m.fichier}, ligne ${c.ligne} : [${visible.length}] ${visible}`);
    }
  }
  longs.forEach((t) => print('  ' + t));
  egal(longs.length, 0, 'aucun texte des sources de plus de 2 lignes hors « Pourquoi »');
  vrai(L.LIGNE_MAX === 90, 'L.LIGNE_MAX : 90 signes, environ 2 lignes à 375 px');
}
