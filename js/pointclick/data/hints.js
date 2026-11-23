/* Génie des indices : l'étape où le joueur en est, d'après l'état seul (drapeaux, inventaire, scène).
   Chaque étape a trois indices de plus en plus clairs : textes `hint.<étape>.1|2|3` (lang/fr2.js, en2.js).
   Ordre et conditions relevés dans le code des scènes (22/11/2026) ; les aveugles, facultatifs, ne comptent pas. */
const STEPS = {
  rue: [['rue.bucket', g => g.flag('bucketTaken')], ['rue.blind', g => g.flag('blind')], ['rue.honey', g => g.flag('honey')],
    ['rue.guard', g => g.flag('guardmoved')], ['rue.exit', () => false]],
  mill: [['mill.carrot', g => g.flag('hasCarrot')], ['mill.friend', g => g.flag('friend')],
    ['mill.ride', g => g.flag('onLedge') || g.flag('cheese')], ['mill.cheese', g => g.flag('cheese')], ['mill.exit', () => false]],
  meadow: [['meadow.nazim', g => g.flag('nazimGone')], ['meadow.exit', () => false]],
  market: [['market.cabbage', g => g.has('cabbage') || g.flag('cartGone')], ['market.load', g => g.flag('cartGone')], ['market.exit', () => false]],
  gate: [['gate.guard', g => g.flag('guardGone')], ['gate.exit', () => false]],
  house: [['house.armor', g => g.flag('armorMoved')], ['house.exit', () => false]],
  ford: [['ford.pumpkin', g => g.has('pumpkin') || g.flag('horsemanHappy')], ['ford.horseman', g => g.flag('horsemanHappy')], ['ford.exit', () => false]],
  wood: [['wood.try', g => g.flag('bfTry')], ['wood.exit', () => false]],
  hall: [['hall.anvil', g => g.has('anvil') || g.flag('followerGone')], ['hall.follower', g => g.flag('followerGone')], ['hall.exit', () => false]],
  party: [['party.finale', g => g.flag('lit')]],
};
/* étape en cours ; 'done' quand la partie est finie */
export function hintStep(g) {
  if (!g.started || g.flag('lit')) return 'done';
  const s = STEPS[g.st.scene]; if (!s) return 'done';
  const cur = s.find(([, ok]) => !ok(g)); return cur ? cur[0] : 'done';
}
