/* « Pourquoi il fait si sombre ? » : dans chaque scène, un personnage aux yeux couverts répète sa plainte. Une action drôle du héros
   lui retire l'objet, il s'émerveille, s'enfuit en dansant et ne revient jamais. Les révéler tous débloque le succès « Fiat lux ». */
const GAGS = {
  /* casserole : on frappe comme à une porte, puis on la soulève comme la cloche d'un plat */
  pot: async (g, e) => { await g.say('hero', 'blind.pot.1'); g.sfx('clang'); await g.wait(350); await g.say(e.id, 'blind.pot.2'); await g.say('hero', 'blind.pot.3'); g.sfx('pop'); g.sfx('coin'); },
  /* sac de farine : coup de casque à cornes */
  sack: async (g, e) => { await g.say('hero', 'blind.sack.1'); g.sfx('whoosh'); await g.wait(280); g.sfx('clang'); g.shake(500, 4); await g.wait(200); g.sfx('pop'); await g.say('hero', 'blind.sack.2'); },
  /* chapeau en fourrure : un Cri pour l'envoyer valser */
  hat: async (g, e) => { await g.say('hero', 'blind.hat.1'); g.sfx('shout'); g.shake(1000, 3.5); await g.say('hero', 'blind.hat.2'); await g.wait(200); g.sfx('pop'); },
  /* scènes 4 à 10 : un geste = une phrase du héros, un bruitage, puis la seconde phrase */
  cabbage: async (g, e) => { await g.say('hero', 'blind.cabbage.1'); g.sfx('pop'); await g.wait(250); g.sfx('pop'); await g.say('hero', 'blind.cabbage.2'); },
  helmet: async (g, e) => { await g.say('hero', 'blind.helmet.1'); for (let i = 0; i < 3; i++) { g.sfx('clang'); await g.wait(420); } await g.say('hero', 'blind.helmet.2'); g.sfx('pop'); },
  basket: async (g, e) => { await g.say('hero', 'blind.basket.1'); g.sfx('whoosh'); await g.wait(300); g.sfx('pop'); await g.say('hero', 'blind.basket.2'); },
  boot: async (g, e) => { await g.say('hero', 'blind.boot.1'); g.sfx('cluck'); await g.wait(300); g.sfx('pop'); await g.say('hero', 'blind.boot.2'); },
  mushroom: async (g, e) => { await g.say('hero', 'blind.mushroom.1'); g.sfx('pop'); await g.wait(300); await g.say('hero', 'blind.mushroom.2'); },
  banner: async (g, e) => { await g.say('hero', 'blind.banner.1'); g.sfx('whoosh'); await g.wait(250); g.sfx('clang'); g.shake(400, 3); await g.say('hero', 'blind.banner.2'); g.sfx('pop'); },
  partyhat: async (g, e) => { await g.say('hero', 'blind.partyhat.1'); g.sfx('pop'); g.sfx('jingle'); await g.wait(400); await g.say('hero', 'blind.partyhat.2'); }
};

export const blindEnt = c => ({ id: c.id, spr: c.spr, x: c.x, y: c.y, hot: true, at: c.at });

export function blindEnter(g, c) {
  if (g.flag('lit_' + c.scene)) g.ents = g.ents.filter(e => e.id !== c.id);
  g.blindNext = g.now + 3.5;
}

/* à appeler dans le tick de la scène : tâtonne, se plaint régulièrement, ou danse une fois éclairé */
export function blindTick(g, c) {
  const e = g.ent(c.id); if (!e) return;
  if (e.dance) { e.bob = Math.abs(Math.sin(g.now * 9)) * 5; e.rot = Math.sin(g.now * 7) * 0.2; return; }
  e.rot = Math.sin(g.now * 1.3) * 0.035;
  if (g.now >= (g.blindNext || 0)) {
    if (!g.locked && !g.bubbles.length && !g.barks.length) { g.bark(c.id, 'blind.dark'); g.blindNext = g.now + 7 + Math.random() * 4; } else g.blindNext = g.now + 1.5;
  }
}

export async function blindOn(g, c, verb, id, item) {
  if (id !== c.id || !g.ent(c.id)) return false;
  if (verb === 'talk') { g.clearBarks(); await g.say(c.id, 'blind.dark'); await g.say('hero', 'blind.talk.h'); await g.say(c.id, 'blind.talk.n'); return true; }
  if (verb === 'use' && !item) { await g.cut(() => reveal(g, c)); return true; }
  return false;
}

async function reveal(g, c) {
  const e = g.ent(c.id); g.clearBarks(); g.face(e.x);
  await GAGS[c.gag](g, e);
  e.spr = c.lit; e.rot = 0; g.sfx('jingle');
  await g.say(c.id, 'blind.wow1'); await g.say(c.id, 'blind.wow2');
  g.set('lit_' + c.scene); e.dance = true;
  const walk = g.walkEnt(c.id, c.exit[0], c.exit[1], 34); let done = false; walk.then(() => { done = true; }, () => { done = true; });
  for (const k of [1, 2, 3]) { if (done) break; g.bark(c.id, c.sing + '.' + k, 2000, true); await g.wait(2000); }
  await walk;
  g.ents = g.ents.filter(x => x !== e); g.clearBarks();
  g.lightUp(c.scene); await g.say('hero', 'blind.after');
}

export const BLINDS = {
  rue: { id: 'blind_pot', scene: 'rue', spr: 'blind.pot', lit: 'lit.pot', gag: 'pot', sing: 'blind.sing.pot', x: 262, y: 256, at: [240, 262], exit: [150, 330] },
  mill: { id: 'blind_sack', scene: 'mill', spr: 'blind.sack', lit: 'lit.sack', gag: 'sack', sing: 'blind.sing.sack', x: 188, y: 240, at: [166, 246], exit: [100, 330] },
  market: { id: 'blind_cabbage', scene: 'market', spr: 'blind.cabbage', lit: 'lit.cabbage', gag: 'cabbage', sing: 'blind.sing.cabbage', x: 402, y: 242, at: [378, 246], exit: [470, 330] },
  gate: { id: 'blind_helmet', scene: 'gate', spr: 'blind.helmet', lit: 'lit.helmet', gag: 'helmet', sing: 'blind.sing.helmet', x: 112, y: 250, at: [138, 254], exit: [-30, 300] },
  house: { id: 'blind_basket', scene: 'house', spr: 'blind.basket', lit: 'lit.basket', gag: 'basket', sing: 'blind.sing.basket', x: 262, y: 256, at: [292, 262], exit: [-30, 300] },
  ford: { id: 'blind_boot', scene: 'ford', spr: 'blind.boot', lit: 'lit.boot', gag: 'boot', sing: 'blind.sing.boot', x: 440, y: 254, at: [414, 258], exit: [540, 300] },
  wood: { id: 'blind_mushroom', scene: 'wood', spr: 'blind.mushroom', lit: 'lit.mushroom', gag: 'mushroom', sing: 'blind.sing.mushroom', x: 120, y: 258, at: [148, 262], exit: [-30, 300] },
  hall: { id: 'blind_banner', scene: 'hall', spr: 'blind.banner', lit: 'lit.banner', gag: 'banner', sing: 'blind.sing.banner', x: 176, y: 250, at: [202, 254], exit: [-30, 300] },
  party: { id: 'blind_partyhat', scene: 'party', spr: 'blind.partyhat', lit: 'lit.partyhat', gag: 'partyhat', sing: 'blind.sing.partyhat', x: 176, y: 254, at: [204, 258], exit: [-30, 300] },
  meadow: { id: 'blind_hat', scene: 'meadow', spr: 'blind.hat', lit: 'lit.hat', gag: 'hat', sing: 'blind.sing.hat', x: 336, y: 256, at: [312, 260], exit: [470, 330] }
};
