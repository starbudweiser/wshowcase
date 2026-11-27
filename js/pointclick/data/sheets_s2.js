/* Saison 2 (scènes `hd` : canevas 960 × 540, coordonnées logiques 480 × 270 inchangées).
   Sprites pleine couleur à densité 2 (1 pixel d'image = ½ unité logique = 1 pixel du canevas) : assets/pointclick/s2/spr/<nom>.png,
   nommés « s2:<nom> » dans les scènes. Détourage : easter eggs/pointclick/tools/s2_assets.py. */

/* couleur des bulles par personnage (id = « who » des dialogues de crossover/dialogues) */
export const COLORS = {
  sheo: '#e9a2ff', guybrush: '#ffe9a8', swordmaster: '#ff9a7a', parrot: '#9cf08f', lechuck: '#7dffb6',
  max: '#ffffff', sam: '#c8b48a', villager: '#c9a77a', creeper: '#8de07a', indy: '#e0b070', doc: '#e6f0ff', hat: '#c0a070', potions: '#b8c0d0',
  coconut: '#e0d0a0', ni: '#c8e0a0', blackknight: '#b0b0c0', perceval: '#9fc8ff', arthur: '#ffb070', karadoc: '#ff8a80',
  barbarian: '#ffb080', luckdragon: '#f4e8ff', house: '#cfe0ff', paleo: '#f0d090', trex: '#a0e070', kid: '#ffd080', girl: '#ffb0c8',
  flower: '#ff8070', redman: '#ff6060', agent: '#d0d8ff', loglady: '#e0c8a0', dexter: '#ffa070', sister: '#ffc0a0', morpheus: '#90e0a0',
  agentm: '#a0ffb0', spoonkid: '#e0ffe0', wizard: '#e8e8f8', demon: '#ff7040', halfling: '#c0e890', charmer: '#ffd0a0', joker: '#ffe080',
  nervpaleo: '#d0c0ff', singer: '#ffc0e0', madsci: '#b8f0ff', grandson: '#ffe870', bluegenie: '#8fd8ff', ai: '#fff0a0', turret: '#ffffff'
};

/* objets de la saison 2 (icône de besace et curseur) ; noms `n.<id>` dans lang/s2x_*.js */
export const ITEMS = {
  wabbajack: { spr: 's2:i_wabbajack' },
  cracker: { spr: 's2:i_cracker' }, map: { spr: 's2:i_map' }, grog: { spr: 's2:i_grog' }, rootbeer: { spr: 's2:i_rootbeer' }, cheese_nl: { spr: 's2:i_cheese_nl' }
};

/* héros S2 : six vues en pied (maquette : poses fixes ; cycles de marche LTX et expressions à venir) */
export const HERO2 = { l: 's2:hero_pl', r: 's2:hero_pr', ql: 's2:hero_ql', qr: 's2:hero_qr', f: 's2:hero_f', b: 's2:hero_b' };
export function heroFrame2(h, moving) {
  if (h.back || h.quarter === 'qb') return HERO2.b;
  if (h.front) return HERO2.f;
  if (moving && !h.quarter) return h.dir === 'l' ? HERO2.l : HERO2.r;
  return h.dir === 'l' ? HERO2.ql : HERO2.qr;   /* à l'arrêt et quand il parle : trois-quarts tourné vers son interlocuteur */
}
export const PRELOAD = [...Object.values(HERO2), ...Object.values(ITEMS).map(i => i.spr)];
