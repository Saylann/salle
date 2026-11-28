// Le calcul des charges (35-charge.js, 36-conseil.js) à l'épreuve : des pratiquants simulés, séance après séance, sur
// plusieurs appareils ; puis des entrées abîmées. Ce qu'on vérifie : jamais une charge hors de la grille, jamais d'erreur,
// pas d'allers-retours, et la charge finit par monter quand la force monte.

// Un tirage au sort qui donne toujours la même suite (les tests doivent se rejouer à l'identique).
const hasard = (graine) => { let g = graine; return () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; }; };

// Un pratiquant : son maximum (kg) monte un peu à chaque séance. Ses répétitions à l'échec suivent une autre loi que celle du
// moteur (Epley, pour que le moteur ne soit pas jugé sur sa propre règle), avec un peu d'aléa et une répétition de fatigue par
// série. Il s'arrête à 2 en réserve, à 1 à la dernière série ; quand la cible est fermée, il ne la dépasse pas de plus de 2.
function simuler(exo, depart, max0, gain, graine, seances) {
  const alea = hasard(graine), vide = L.aVide(exo);
  let max = max0, der = null, avant = null;
  const charges = [], bas = [];
  for (let s = 0; s < seances; s++) {
    const conseil = L.conseil(Object.assign({}, exo, der ? {} : { depart }), der, avant);
    const faites = [];
    for (let k = 0; k < exo.series; k++) {
      const cible = L.cibleSerie(Object.assign({}, exo, der ? {} : { depart }), conseil, der, faites);
      const echec = Math.max(0, Math.floor(30 * ((max + vide) / (cible.charge + vide) - 1) - k + (alea() * 2 - 1)));
      const ouverte = /\+$/.test(cible.gros);
      const voulu = Math.max(0, echec - (k === exo.series - 1 ? 1 : 2));
      faites.push({ c: cible.charge, r: ouverte ? voulu : Math.min(voulu, cible.valeur + 2) });
      if (!(cible.charge > 0) || Math.abs(cible.charge / exo.pas - Math.round(cible.charge / exo.pas)) > 1e-6 || !(cible.valeur >= 1)) return { erreur: `séance ${s + 1}, série ${k + 1} : ${cible.gros}` };
    }
    charges.push(L.chargeMax(faites));
    if (faites[0].r < exo.min) bas.push(s);
    avant = der ? Object.assign({}, der, avant ? { avant: { date: 'x', series: avant.series } } : {}) : null;
    der = { date: 'x', series: faites.filter((f) => f.c === L.chargeMax(faites)), reserve: '1-2' };
    max *= 1 + gain;
  }
  let demiTours = 0;
  for (let i = 2; i < charges.length; i++) if ((charges[i] - charges[i - 1]) * (charges[i - 1] - charges[i - 2]) < 0) demiTours++;
  return { charges, bas: bas.length, demiTours, fin: charges[charges.length - 1], debut: charges[0] };
}

{
  const APPAREILS = [
    ['pile de 5 en 5', { nom: 'Tirage vertical prise large', series: 3, min: 8, max: 12, unite: 'reps', pas: 5 }, 40, 62],
    ['haltères de 2 en 2', { nom: 'Développé épaules aux haltères', series: 3, min: 8, max: 12, unite: 'reps', pas: 2 }, 8, 12],
    ['haltères légers de 2 en 2', { nom: 'Élévations latérales aux haltères', series: 4, min: 12, max: 20, unite: 'reps', pas: 2 }, 4, 8],
    ['presse de 10 en 10', { nom: 'Presse à cuisses', series: 3, min: 10, max: 15, unite: 'reps', pas: 10 }, 60, 150],
    ['barre en Z', { nom: 'Curl à la barre en Z', series: 3, min: 10, max: 15, unite: 'reps', pas: 2.5 }, 5, 12],
    ['poulie de 2,5 en 2,5', { nom: 'Extension triceps au-dessus de la tête à la poulie', series: 3, min: 10, max: 15, unite: 'reps', pas: 2.5 }, 7.5, 16],
    ['départ beaucoup trop léger', { nom: 'Leg curl assis', series: 3, min: 10, max: 15, unite: 'reps', pas: 5 }, 25, 75],
    ['départ trop lourd', { nom: 'Développé incliné à la machine', series: 3, min: 8, max: 12, unite: 'reps', pas: 5 }, 40, 36],
  ];
  const bilans = APPAREILS.map(([nom, exo, depart, max0], i) => [nom, simuler(exo, depart, max0, 0.012, 17 + i, 36)]);
  egal(bilans.filter(([, b]) => b.erreur).map(([nom, b]) => `${nom} : ${b.erreur}`), [], 'simulation : 36 séances sur 8 appareils, jamais une charge hors de la grille ni une cible vide');
  egal(bilans.filter(([, b]) => !b.erreur && b.demiTours > 4).map(([nom, b]) => `${nom} : ${b.demiTours} demi-tours (${b.charges.join(' ')})`), [], 'simulation : pas d\'allers-retours de charge (4 changements de sens au plus en 36 séances)');
  egal(bilans.filter(([, b]) => !b.erreur && b.bas > 6).map(([nom, b]) => `${nom} : ${b.bas} séances sous le bas de la fourchette (${b.charges.join(' ')})`), [], 'simulation : la 1re série tombe rarement sous le bas de la fourchette (6 séances sur 36 au plus)');
  egal(bilans.filter(([nom, b]) => !b.erreur && nom !== 'départ trop lourd' && !(b.fin > b.debut)).map(([nom, b]) => `${nom} : ${b.charges.join(' ')}`), [], 'simulation : la force monte de 1,2 % par séance, la charge finit par monter');
  const lourd = bilans.find(([nom]) => nom === 'départ trop lourd')[1];
  vrai(!lourd.erreur && Math.min(...lourd.charges) < 40, 'simulation : un départ trop lourd redescend');

  // Des entrées abîmées : le conseil et la cible répondent toujours, avec des nombres.
  const alea = hasard(5);
  const tire = (l) => l[Math.floor(alea() * l.length)];
  const fautes = [];
  for (let n = 0; n < 600; n++) {
    const exo = { nom: tire(['Tirage vertical prise large', 'Curl à la barre en Z', 'Tractions', 'Presse à cuisses', '']), series: tire([1, 2, 3, 4]), min: tire([8, 10, 12]), max: tire([12, 15, 20]), unite: 'reps', pas: tire([0, 1, 2, 2.5, 5, 10, undefined, -1]), corps: tire([false, false, true]) };
    const charge = tire([0, 1.25, 4, 7.5, 40, 42.5, 43, 200]);
    const series = Array.from({ length: tire([1, 2, 3, 4]) }, () => ({ c: charge, r: tire([0, 1, 5, 8, 12, 15, 20, 40]) }));
    const der = tire([null, { date: 'x', series, reserve: tire(['0', '1-2', '3+', undefined, 'x']) }]);
    try {
      const c = L.conseil(exo, der, null);
      const cible = L.cibleSerie(exo, c, der, tire([[], [{ c: charge, r: tire([0, 3, 9, 14, 30]) }]]));
      const ok = (x) => x == null || (typeof x === 'number' && isFinite(x) && x >= 0);
      if (!ok(c.charge) || !ok(c.valeur) || !ok(cible.charge) || !ok(cible.valeur) || typeof cible.gros !== 'string' || /NaN|undefined|Infinity/.test(cible.gros + c.texte + cible.texte)) fautes.push(JSON.stringify({ exo, der, c, cible }).slice(0, 300));
    } catch (e) { fautes.push(String(e).slice(0, 80) + ' ' + JSON.stringify({ exo, der }).slice(0, 220)); }
  }
  egal(fautes.slice(0, 3), [], 'entrées abîmées : 600 tirages, le conseil et la cible répondent toujours avec des nombres');
}

// 2.41.15 : aux haltères, la charge notée est celle d'un haltère.
egal([L.texteParMain({ nom: 'Élévations latérales aux haltères' }, 6), L.texteParMain({ nom: 'Rowing à un bras aux haltères' }, 20), L.texteParMain({ nom: 'Presse à cuisses', disques: true }, 100),
  L.texteParMain({ nom: 'Tirage vertical prise large' }, 40), L.texteParMain({ nom: 'Curl aux haltères' }, 0)],
  ['Dans chaque main : 6 kg', 'Un haltère de 20 kg', '', '', ''], 'texteParMain : le poids de chaque haltère ; rien pour une machine, des disques ou sans charge');
