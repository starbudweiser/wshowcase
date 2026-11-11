/* « Pourquoi il fait si sombre ? » : dans chaque scène, un personnage aux yeux couverts répète sa plainte. Une action drôle du héros
   lui retire l'objet, il s'émerveille, s'enfuit en dansant et ne revient jamais. Les révéler tous débloque le succès « Fiat lux ». */
const GAGS = {
  /* casserole : on frappe comme à une porte, puis on la soulève comme la cloche d'un plat */
  pot: async (g, e) => { await g.say('hero', 'blind.pot.1'); g.sfx('clang'); await g.wait(350); await g.say(e.id, 'blind.pot.2'); await g.say('hero', 'blind.pot.3'); g.sfx('pop'); g.sfx('coin'); },
  /* sac de farine : coup de casque à cornes */
  sack: async (g, e) => { await g.say('hero', 'blind.sack.1'); g.sfx('whoosh'); await g.wait(280); g.sfx('clang'); g.shake(500, 4); await g.wait(200); g.sfx('pop'); await g.say('hero', 'blind.sack.2'); },
  /* chapeau en fourrure : un Cri pour l'envoyer valser */
  hat: async (g, e) => { await g.say('hero', 'blind.hat.1'); g.sfx('shout'); g.shake(1000, 3.5); await g.say('hero', 'blind.hat.2'); await g.wait(200); g.sfx('pop'); }
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
  meadow: { id: 'blind_hat', scene: 'meadow', spr: 'blind.hat', lit: 'lit.hat', gag: 'hat', sing: 'blind.sing.hat', x: 336, y: 256, at: [312, 260], exit: [470, 330] }
};
