/* Scène 10 : la fête des quinze ans. Le dragon allume les quinze bougies ; déclaration d'amour à Skyrim ; fin du jeu. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.party, CAKE = [242, 214];

export default {
  id: 'party', bg: 'party.png', persp: [180, 0.62, 268, 1.0],
  walk: [[[10, 268], [14, 246], [150, 246], [160, 254], [322, 254], [332, 246], [466, 240], [470, 268]]],
  fg: [],
  start: { x: 60, y: 258, dir: 'r' },
  hot: [
    { id: 'ptable', rect: [158, 178, 332, 252], at: [242, 258] }, { id: 'pcastle', rect: [100, 14, 346, 100] },
    { id: 'plantern', rect: [0, 70, 480, 122] }, { id: 'pfeast', rect: [0, 122, 160, 200] }, { id: 'pfeast', rect: [330, 130, 480, 205] }
  ],
  ambient: [
    { type: 'dragon', kind: 'frost', y: 36, period: 44, offset: 22, drop: 8, mode: 'glide', scale: 0.7, dir: 1 },
    { type: 'dragon', kind: 'gold', y: 26, period: 36, offset: 8, drop: 6, mode: 'swoop', amp: 20, fire: true, scale: 0.8 },
    { type: 'flock', n: 3, y0: 40, y1: 90, speed: 8, seed: 51 },
    { type: 'frames', id: 'party_fw_l', fps: 1.6 },
    { type: 'frames', id: 'party_fw_r', fps: 1.6, offset: 0.5 },
    { type: 'frames', id: 'party_lamp', fps: 4, seq: [0, 1, 2, 1] }
  ],
  ents: [
    { id: 'cake', spr: 'cake', x: CAKE[0], y: CAKE[1], hot: true, at: [CAKE[0], 258], scale: 0.9, z: 2 },
    { id: 'pmerchant', spr: 'merchant', x: 408, y: 246, hot: true, at: [382, 252] },
    { id: 'pguard', spr: 'guard', x: 360, y: 238, hot: true, at: [338, 246] },
    { id: 'pgiant', spr: 'giant', x: 452, y: 214, scale: 0.58, hot: true, at: [430, 232] },
    { id: 'phorseman', spr: 'horseman.pumpkin', x: 52, y: 238, hot: true, at: [86, 250] },
    blindEnt(BL)
  ],

  async enter(g) { blindEnter(g, BL); },
  tick(g) {
    blindTick(g, BL);
    for (const id of ['pmerchant', 'pguard', 'phorseman']) { const e = g.ent(id); if (e) e.bob = Math.abs(Math.sin(g.now * 3 + e.x)) * 1.3; }
    const gi = g.ent('pgiant'); if (gi) gi.bob = Math.abs(Math.sin(g.now * 2.2)) * 1.6;
  },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(110, 258); g.hero.front = true;
    await g.say('hero', 's10.intro1'); await g.say('hero', 's10.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'pmerchant': case 'pguard': case 'phorseman': case 'pgiant':
        if (verb === 'talk') { await g.say(id, 's10.' + id); return true; }
        break;
      case 'cake':
        if (verb === 'use' && item === 'arrow') { await g.say('hero', 's10.cake.arrow'); return true; }
        if (verb === 'use' && !item && !g.flag('lit')) { await g.say('hero', 's10.cake.nofire'); return true; }
        break;
      case 'dragon':
        if ((verb === 'talk' || verb === 'use') && !g.flag('lit')) { await g.cut(() => this.finale(g)); return true; }
        if (g.flag('lit')) { await g.say('hero', 's10.dragon.after'); return true; }
        break;
    }
    return false;
  },

  /* le dragon allume les bougies, puis la déclaration d'amour, puis la fin */
  async finale(g) {
    await g.say('hero', 's10.call1'); await g.say('hero', 's10.call2');
    g.sfx('shout'); g.shake(900, 2.5); await g.fly('dragon.up', [-40, -30], [CAKE[0] - 30, 70], 1500, 0, 0, 1.3);
    await g.wait(300); g.sfx('whoosh'); g.shake(1400, 3); g.ent('cake').spr = 'cake.lit'; g.sfx('jingle'); g.set('lit');
    await g.fly('dragon.down', [CAKE[0] - 30, 70], [520, -20], 1400, 0, 0, 1.3);
    await g.say('pgiant', 's10.pgiant.b'); await g.say('pmerchant', 's10.bday');
    g.hero.front = true;
    for (let i = 1; i <= 5; i++) await g.say('hero', 's10.love' + i);
    g.sfx('jingle'); await g.wait(500); g.sfx('coin'); await g.wait(800);
    await g.end('end10');
  }
};
