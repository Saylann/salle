// L : les petits outils (texte, nombres, dates, durées, le coffre et l'en-tête « --- » des notes, pour l'écran).
// Rien ici ne lit ni n'écrit de note : des entrées, une sortie.
{
  // Les textes déjà normalisés (L.norm) : les noms d'exercices reviennent des milliers de fois par écran. La mémoire est
  // vidée quand elle devient grande (les lignes de notes, toutes différentes, passent aussi par L.norm).
  const NORMES = new Map();
  const NORMES_MAX = 5000;
  const normaliser = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  // Pendant un dessin d'écran (VueSalle.rendre), les calculs déjà faits sur une liste de séances : rien ne change les notes
  // pendant un dessin. null hors d'un dessin : tout est recalculé, comme avant.
  let DESSIN = null;

  Object.assign(L, {
    // ── Texte et nombres ──
    // Sans accents ni majuscules, les espaces réduits : la clé de comparaison des noms.
    norm(s) {
      const t = String(s == null ? '' : s);
      let n = NORMES.get(t);
      if (n === undefined) {
        if (NORMES.size >= NORMES_MAX) NORMES.clear();
        n = normaliser(t);
        NORMES.set(t, n);
      }
      return n;
    },
    nombre(s) {
      const n = parseFloat(String(s == null ? '' : s).replace(',', '.'));
      return isFinite(n) ? n : null;
    },
    // Arrondi au centième (les charges : 17,5 ; 2,25).
    arrondi2(x) {
      return Math.round(x * 100) / 100;
    },
    fmt(n) {
      return String(L.arrondi2(n)).replace('.', ',');
    },
    // « 1 série », « 3 séries » ; L.s(n) seul pour les accords (« notée », « notées »).
    pluriel(n, mot) {
      return `${n} ${mot}${L.s(n)}`;
    },
    s(n) {
      return n > 1 ? 's' : '';
    },
    fmtMilliers(n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },
    // La valeur du milieu d'une liste de nombres (moyenne des deux du milieu si leur nombre est pair) ; liste vide → null.
    mediane(liste) {
      const l = (liste || []).filter((x) => typeof x === 'number' && isFinite(x)).sort((a, b) => a - b);
      if (!l.length) return null;
      const m = Math.floor(l.length / 2);
      return l.length % 2 ? l[m] : (l[m - 1] + l[m]) / 2;
    },
    // Un étage connu (0 = RDC, 1, 2…). Attention : en JavaScript, « null >= 0 » est vrai ; ici, null n'est pas un étage.
    estEtage(e) {
      return typeof e === 'number' && isFinite(e) && e >= 0;
    },
    // Le nombre de séries d'un exercice : la liste des séries notées, ou le nombre prévu.
    nbSeries(e) {
      return Array.isArray(e.series) ? e.series.length : Math.max(0, Math.floor(+e.series || 0));
    },
    // La charge la plus lourde d'une liste de séries (0 sans charge ; -Infinity pour une liste vide, comme Math.max).
    chargeMax(series) {
      return Math.max(...series.map((x) => x.c || 0));
    },
    // Le pas de charge d'un exercice (1 kg s'il n'en a pas).
    pasDe(exo) {
      return exo.pas > 0 ? exo.pas : 1;
    },
    nomCourt(nom) {
      return String(nom).toLowerCase().split(/\s(?:à|a|aux|au|prise|en|de|du|des|sur)\s/)[0].trim();
    },
    // 2.40.9 (vu par les simulations : « Extension triceps au-dessus de la tête à la poulie : Record : 15 répétitions… », 92
    // signes) : « Nom : texte » ; trop long pour 2 lignes, le nom court, avec une majuscule (« Extension triceps au-dessus »).
    nomEtTexte(nom, texte) {
      const t = `${nom} : ${texte}`;
      if (t.length <= L.LIGNE_MAX) return t;
      const c = L.nomCourt(nom);
      return `${c.charAt(0).toUpperCase() + c.slice(1)} : ${texte}`;
    },
    // Le nom à montrer à côté d'un texte (même règle, sans le « : ») : le nom entier s'il tient, sinon le nom court.
    nomPour(nom, texte) {
      if (`${nom} ${texte}`.length <= L.LIGNE_MAX) return nom;
      const c = L.nomCourt(nom);
      return c.charAt(0).toUpperCase() + c.slice(1);
    },
    // « Tirage vertical, face pull » : les noms courts, le premier avec une majuscule.
    noms(exos) {
      const t = [];
      exos.forEach((e) => { const c = L.nomCourt(e.nom); if (t.indexOf(c) < 0) t.push(c); });
      const s = t.join(', ');
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    // 2.5.1 : un texte d'écran tient en 2 lignes à 375 px (environ 90 signes ; tests/textes-courts.js). Au-delà, l'écran
    // replie la suite (texteCourt, src/50-ui.js : « Phrase courte.\nPourquoi : … »).
    LIGNE_MAX: 90,
    // Une phrase sur des exercices : phrase(L.noms(exos)) si elle tient en 2 lignes ; sinon phrase(« 5 exercices »), et les
    // noms repliés dessous (« \nLesquels : … »).
    avecNoms(exos, phrase) {
      const noms = L.noms(exos), t = phrase(noms);
      if (t.length <= L.LIGNE_MAX || exos.length < 2) return t;
      return `${phrase(`${exos.length} exercices`)}\nLesquels : ${noms}.`;
    },

    // ── La mémoire d'un dessin (performance) ──
    // Lance f, en gardant les calculs de L.memoListe jusqu'à la fin (un dessin dans un dessin garde la même mémoire).
    pendantDessin(f) {
      const avant = DESSIN;
      DESSIN = avant || new Map();
      try { return f(); } finally { DESSIN = avant; }
    },
    // Un calcul sur une liste, gardé le temps d'un dessin : la même liste, avec les mêmes éléments, le redonne sans le refaire
    // (une liste qui grandit ou change d'élément est recalculée). Hors d'un dessin : calcul() à chaque fois.
    memoListe(liste, cle, calcul) {
      if (!DESSIN || !Array.isArray(liste)) return calcul();
      let parCle = DESSIN.get(liste);
      if (!parCle) { parCle = new Map(); DESSIN.set(liste, parCle); }
      const x = parCle.get(cle);
      if (x && x.elements.length === liste.length && x.elements.every((e, i) => e === liste[i])) return x.valeur;
      const valeur = calcul();
      parCle.set(cle, { elements: liste.slice(), valeur });
      return valeur;
    },

    // ── Dates ──
    dateISO(d) {
      const p = (x) => String(x).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    },
    deISO(iso) {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
      return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    },
    dateLongue(iso) {
      const d = L.deISO(iso);
      return d ? `${JOURS[d.getDay()]} ${d.getDate() === 1 ? '1er' : d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}` : String(iso || '');
    },
    dateCourte(iso) {
      const d = L.deISO(iso);
      return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : '';
    },
    joursEntre(a, b) {
      const x = L.deISO(a), y = L.deISO(b);
      return x && y ? Math.round((y - x) / MS_JOUR) : 0;
    },
    plusJours(iso, n) {
      const d = L.deISO(iso);
      d.setDate(d.getDate() + n);
      return L.dateISO(d);
    },
    lundi(iso) {
      const d = L.deISO(iso);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return L.dateISO(d);
    },
    // Les minutes écoulées depuis un horodatage (en ms), sans arrondi.
    minutesDepuis(debut, maintenant) {
      return (maintenant - debut) / MS_MINUTE;
    },
    quand(date, aujourdhui, debutPhrase) {
      const j = L.joursEntre(date, aujourdhui);
      const t = j === 0 ? 'aujourd\'hui' : j === 1 ? 'hier' : j <= 6 ? JOURS[L.deISO(date).getDay()] : 'le ' + L.dateCourte(date);
      return debutPhrase ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    },

    // ── Durées ──
    fmtDuree(sec) {
      const s = Math.max(0, Math.round(sec));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    },
    // 45 → « 45 min », 60 → « 1 h », 75 → « 1 h 15 », 65 → « 1 h 05 » (les minutes sur 2 chiffres après « h »).
    fmtTemps(min) {
      return min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ' ' + String(min % 60).padStart(2, '0') : ''}` : `${min} min`;
    },

    // ── Le coffre et l'en-tête « --- » des notes ──
    // Un chemin du coffre rangé dans un dossier d'archives (un dossier nommé « archives » ou « .archives », à n'importe quel niveau).
    estArchive(chemin) {
      return String(chemin || '').split('/').slice(0, -1).some((d) => /^\.?archives?$/i.test(d));
    },
    // En-tête « --- clé: valeur --- » d'une note. Clés sans accent ni majuscule.
    lireEntete(texte) {
      const t = String(texte == null ? '' : texte).replace(/^﻿/, '');
      const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(t);
      const cles = {};
      if (!m) return { cles, corps: t };
      for (const ligne of m[1].split(/\r?\n/)) {
        const k = /^([^:#]+):\s*(.*)$/.exec(ligne);
        if (k) cles[L.norm(k[1])] = k[2].trim().replace(/^["']|["']$/g, '');
      }
      return { cles, corps: t.slice(m[0].length) };
    },
    // Ajoute ou remplace une clé de l'en-tête (texte inchangé s'il n'y a pas d'en-tête).
    poserCle(texte, cle, valeur) {
      const m = /^(---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n|$))/.exec(texte);
      if (!m) return texte;
      const lignes = m[2].split(/\r?\n/).filter((l) => L.norm(l.split(':')[0]) !== L.norm(cle));
      lignes.push(`${cle}: ${valeur}`);
      return m[1] + lignes.join('\n') + m[3] + texte.slice(m[0].length);
    },

    // ── Pour l'écran ──
    // Le nom Lucide d'une icône du plugin, ou '' si la clé est inconnue.
    icone(cle) {
      return typeof cle === 'string' && Object.prototype.hasOwnProperty.call(ICONES, cle) ? ICONES[cle] : '';
    },
    // La part du repos qui reste (1 = tout juste commencé, 0 = fini), pour la jauge du minuteur.
    fractionRepos(reste, total) {
      if (!(total > 0) || !(reste > 0)) return 0;
      return Math.min(1, reste / total);
    },
    // L'adresse qui lance le raccourci « Repos salle » de l'iPhone avec le repos en secondes, puis revient dans Obsidian.
    urlChrono(secondes, coffre) {
      const retour = encodeURIComponent('obsidian://open?vault=' + encodeURIComponent(coffre));
      return `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(RACCOURCI)}&input=text&text=${Math.round(secondes)}&x-success=${retour}&x-cancel=${retour}&x-error=${retour}`;
    },
  });
}
