// SallePlugin, les noms des fichiers : au démarrage, ce que le plugin avait nommé à l'ancienne reçoit son nom d'aujourd'hui
// (2.38.0, demande : des noms aux conventions des développeurs, sans lettre accentuée ; et ne rien avoir à refaire à la
// main, ni dans son coffre ni dans celui où le dossier des données a déjà été copié).
//   « Données/Réglages.md »                    → « donnees/reglages.md »
//   « Données/Ma salle.md »                    → « donnees/ma-salle.md »
//   « Données/Séances/2026-11-16 Séance A.md » → « donnees/seances/2026-11-16-seance-a.md »
//   « Données/Brouillon.json »                 → « donnees/brouillon.json »
// Les règles, pour ne rien casser :
//  - on renomme sur place, on ne crée ni ne copie jamais : sur deux appareils reliés par iCloud, le même renommage fait des
//    deux côtés donne le même résultat, pas deux dossiers ;
//  - seulement un nom que le plugin a donné (le même nom une fois simplifié par L.nomSimple, avec ou sans numéro de
//    doublon) : une note ou un dossier que l'utilisateur a nommé à sa façon garde son nom ;
//  - jamais par-dessus un autre fichier, jamais pendant une séance ; un renommage qui échoue ne casse rien : les notes se
//    reconnaissent à leur en-tête, pas à leur nom, et l'essai reprend au démarrage suivant.

Object.assign(SallePlugin.prototype, {
  // → le nombre de changements (fichiers et dossiers renommés, brouillon en double mis à la corbeille). Ne jette jamais.
  async rangerNoms() {
    const v = this.app && this.app.vault;
    if (!v || typeof v.rename !== 'function' || !this.etat || (this.donnees && this.donnees.enCours)) return 0;
    let faits = 0;
    try {
      const fichiers = this.etat.fichiers || {};
      const parentDe = (f) => (f && f.parent && Array.isArray(f.parent.children) ? f.parent : null);
      const parents = new Set(), sous = new Set();
      // 1. Les séances, puis les notes : chacune sous son nom d'aujourd'hui.
      for (const s of (this.etat.seances || []).slice()) {
        const f = s.chemin ? v.getAbstractFileByPath(s.chemin) : null;
        if (!f) continue;
        if (parentDe(f)) sous.add(parentDe(f));
        if (await this.rangerNom(f, L.nomFichier(s.date, s.nom))) faits++;
      }
      for (const type of ['programme', 'mesures', 'forme', 'club', 'reglages']) {
        const f = fichiers[type];
        if (!f) continue;
        if (parentDe(f)) parents.add(parentDe(f));
        if (await this.rangerNom(f, NOMS_FICHIERS[type])) faits++;
      }
      // 2. Le brouillon, à côté de la note « Réglages ».
      faits += await this.rangerBrouillon();
      // 3. Les sous-dossiers (séances, photos), puis le dossier des données lui-même. Un dossier « Photos » ou « Séances »
      //    n'est celui du plugin que s'il contient ses photos de palier ou ses séances (ou s'il est encore vide, dans le
      //    dossier des données) : un dossier du même nom rangé là par l'utilisateur garde son nom.
      const photoDePalier = (x) => /^\d{4}-\d{2}-\d{2}-palier(-\d+)?\.jpe?g$/i.test(x.name || '');
      for (const p of parents) {
        for (const x of p.children) {
          if (!Array.isArray(x.children)) continue;
          const simple = L.nomSimple(x.name || '');
          if (simple === NOMS_FICHIERS.photos ? x.children.some(photoDePalier)
            : simple === NOMS_FICHIERS.seances && !x.children.length && L.nomSimple(p.name || '') === DOSSIER_DONNEES) sous.add(x);
        }
      }
      for (const d of sous) {
        const simple = L.nomSimple(d.name || '');
        if ((simple === NOMS_FICHIERS.seances || simple === NOMS_FICHIERS.photos) && await this.rangerNom(d, simple)) faits++;
      }
      for (const p of parents) if (await this.rangerNom(p, DOSSIER_DONNEES)) faits++;
    } catch (e) {
      if (typeof console !== 'undefined') console.error('Salle :', e);
    }
    if (faits) {
      // Les nouveaux chemins : l'index des notes, puis les réglages et le brouillon relus là où ils sont, et data.json qui
      // garde le chemin de la note « Réglages ».
      try {
        await this.recharger();
        await this.suivreReglages();
        await this.sauver();
      } catch (e) {
        if (typeof console !== 'undefined') console.error('Salle :', e);
      }
    }
    return faits;
  },
  // Donne à f (note, fichier ou dossier) son nom aux conventions si c'est bien le plugin qui l'avait nommé : son nom, une
  // fois simplifié, est « attendu » (ou « attendu-2 », un doublon). → true s'il a été renommé.
  async rangerNom(f, attendu) {
    const nom = String((f && f.name) || (f && f.path ? f.path.split('/').pop() : ''));
    const point = f && Array.isArray(f.children) ? -1 : nom.lastIndexOf('.');
    const base = point > 0 ? nom.slice(0, point) : nom, ext = point > 0 ? nom.slice(point).toLowerCase() : '';
    const simple = L.nomSimple(base);
    if (!attendu || !simple || nom === simple + ext) return false;
    if (simple !== attendu && !(simple.indexOf(attendu + '-') === 0 && /^\d+$/.test(simple.slice(attendu.length + 1)))) return false;
    return this.renommerSurPlace(f, simple + ext);
  },
  // Renomme sur place (même dossier), jamais par-dessus un autre fichier. Un nom qui ne change que par ses majuscules, sur un
  // disque qui ne les distingue pas (Mac, Windows, certains Android) : par un nom relais si le renommage direct est refusé ;
  // si la 2e étape échoue, l'ancien nom est remis. → true si c'est fait.
  async renommerSurPlace(f, nom) {
    const v = this.app.vault, avant = f.path, i = avant.lastIndexOf('/'), dossier = i >= 0 ? avant.slice(0, i + 1) : '';
    const cible = dossier + nom;
    if (cible === avant) return false;
    const pris = v.getAbstractFileByPath(cible);
    if (pris && pris !== f) return false;
    try { await v.rename(f, cible); return true; } catch (e) { /* refusé : essai par un nom relais, juste dessous */ }
    if (f.path !== avant) return f.path === cible;
    const relais = dossier + 'renommage-' + nom;
    if (v.getAbstractFileByPath(relais)) return false;
    try { await v.rename(f, relais); } catch (e) { return false; }
    try { await v.rename(f, cible); return true; } catch (e) {
      try { await v.rename(f, avant); } catch (e2) { if (typeof console !== 'undefined') console.error('Salle :', e2); }
      return false;
    }
  },
  // Le brouillon : « Brouillon.json » → « brouillon.json ». S'il y en a plusieurs (un appareil resté sur une version d'avant
  // a réécrit l'ancien nom, ou iCloud a gardé deux copies), le plus récent est le bon ; les autres partent à la corbeille
  // (jamais de suppression définitive). → le nombre de changements.
  async rangerBrouillon() {
    const v = this.app.vault, reg = this.etat.fichiers ? this.etat.fichiers.reglages : null;
    const parent = reg && reg.parent && Array.isArray(reg.parent.children) ? reg.parent : null;
    if (!parent) return 0;
    const date = (x) => (x.stat && x.stat.mtime) || 0;
    const candidats = parent.children.filter((x) => !Array.isArray(x.children) && /\.json$/i.test(x.name || '')
      && /^brouillon(-\d+)?$/.test(L.nomSimple(String(x.name).replace(/\.json$/i, ''))));
    if (!candidats.length) return 0;
    const bon = candidats.reduce((a, b) => (date(b) > date(a) || (date(b) === date(a) && b.name === FICHIER_BROUILLON) ? b : a));
    let faits = 0;
    for (const x of candidats) {
      if (x === bon || typeof v.trash !== 'function') continue;
      try { await v.trash(x, true); faits++; } catch (e) { if (typeof console !== 'undefined') console.error('Salle :', e); }
    }
    if (bon.name !== FICHIER_BROUILLON && await this.renommerSurPlace(bon, FICHIER_BROUILLON)) faits++;
    return faits;
  },
});
