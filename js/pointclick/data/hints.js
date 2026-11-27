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
  /* saison 2 */
  s2_12: [['s2_12.car', g => g.flag('carWab')]],
  s2_13: [['s2_13.wood', g => g.has('wood13') || g.flag('wallOpen')], ['s2_13.wall', g => g.flag('wallOpen')], ['s2_13.stairs', () => false]],
  s2_13b: [['s2_13b.cheese', g => g.has('cheesecube')], ['s2_13b.jump', () => false]],
  s2_14: [['s2_14.pit', g => g.flag('sausages')], ['s2_14.idol', g => g.flag('idolSwap')], ['s2_14.boulder', () => false]],
  s2_16: [['s2_16.hat', g => g.flag('sorted')]],
  s2_16b: [['s2_16b.flower', g => g.has('flower16') || g.flag('potion')], ['s2_16b.potion', () => false]],
  s2_17k: [['s2_17k.table', g => g.flag('banquet')], ['s2_17k.table', () => false]],
  s2_17kb: [['s2_17kb.grail', () => false]],
  s2_17g: [['s2_17g.shrub', g => g.flag('shrub')], ['s2_17g.topiary', () => false]],
  s2_17gb: [['s2_17gb.bk', g => g.flag('bkSat')], ['s2_17gb.rabbit', g => g.flag('rabbitFed')], ['s2_17gb.grail', () => false]],
  s2_18: [['s2_18.wheel', () => false]],
  s2_18b: [['s2_18b.name', g => g.flag('flight')], ['s2_18b.nothing', () => false]],
  s2_19: [['s2_19.sandwich', () => false]],
  s2_20: [['s2_20.crouch', g => g.flag('crouched')], ['s2_20.monster', () => false]],
  s2_20b: [['s2_20b.small', g => g.flag('rolls')], ['s2_20b.fridge', () => false]],
  s2_21: [['s2_21.wall', g => g.flag('lights')], ['s2_21.flower', g => g.flag('daffodil')], ['s2_21.girl', () => false]],
  s2_22: [['s2_22.sheo', g => g.flag('sheoAsk')], ['s2_22.pie', () => false]],
  s2_22b: [['s2_22b.agent', g => g.flag('order')], ['s2_22.pie', () => false]],
  s2_23: [['s2_23.door', g => g.flag('doorOpen')], ['s2_23.donuts', () => false]],
  s2_24: [['s2_24.agents', g => g.flag('dodged')], ['s2_24.spoon', () => false]],
  s2_25: [['s2_25.demon', g => g.flag('crab')]],
  s2_25b: [['s2_25b.eat', g => g.flag('ate')]],
  s2_15: [['s2_15.cart', g => g.flag('cartSteel')], ['s2_15.horse', g => g.flag('cartUp')], ['s2_15.cable', g => g.flag('cableOn')], ['s2_15.storm', () => false]],
  s2_12b: [['s2_12b.roll', g => g.has('sweetroll') || g.flag('traded')], ['s2_12b.cheese', g => g.flag('traded')]],
  s2_11: [['s2_11.cracker', g => g.has('cracker') || g.flag('learned')], ['s2_11.parrot', g => g.flag('learned')], ['s2_11.duel', g => g.flag('duelWon')],
    ['s2_11.crate', g => g.flag('crateOpen')], ['s2_11.grog', g => g.has('rootbeer') || g.flag('ghostGone')], ['s2_11.ghost', g => g.flag('ghostGone')]],
};
/* étape en cours ; 'done' quand la partie est finie */
export function hintStep(g) {
  if (!g.started || g.flag('lit')) return 'done';
  const s = STEPS[g.st.scene]; if (!s) return 'done';
  const cur = s.find(([, ok]) => !ok(g)); return cur ? cur[0] : 'done';
}
