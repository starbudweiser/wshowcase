/* Scène 5 : la porte de la ville. Le garde « flèche dans le genou » barre la porte : on lui retire la flèche, il repart à l'aventure (et en reprend une). */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.gate;

export default {
  id: 'gate', bg: 'gate.png', persp: [200, 0.45, 268, 0.8],
  walk: [[[30, 268], [48, 240], [170, 228], [300, 226], [410, 236], [450, 268]]],
  fg: [],
  start: { x: 60, y: 256, dir: 'r' },
  hot: [
    { id: 'gdoor', rect: [208, 118, 300, 218], at: [254, 226] }, { id: 'gtowers', rect: [128, 44, 202, 206] }, { id: 'gtowers', rect: [306, 44, 384, 210] },
    { id: 'gbooth', rect: [320, 160, 384, 228], at: [352, 236] }, { id: 'gbarrel', rect: [172, 202, 196, 228], at: [186, 240] },
    { id: 'gtree', rect: [0, 0, 84, 252], at: [92, 246], dir: 'l' }
  ],
  ambient: [
    { type: 'dragon', kind: 'moss', y: 8, period: 48, offset: 6, drop: 6, mode: 'cross', scale: 0.55, flap: 3.2, haze: true },
    { type: 'flock', n: 3, y0: 8, y1: 40, speed: 9, seed: 21 },
    { type: 'frames', id: 'gate_banner_l', fps: 2.4 },
    { type: 'frames', id: 'gate_banner_r', fps: 2.4, offset: 0.7 }
  ],
  ents: [
    { id: 'gguard', spr: 'guard', x: 262, y: 236, hot: true, at: [236, 242] },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('guardGone')) g.ents = g.ents.filter(e => e.id !== 'gguard');
  },
  tick(g) { blindTick(g, BL); },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(172, 254); g.hero.front = true;
    await g.say('hero', 's5.intro1'); await g.say('hero', 's5.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'gguard':
        if (verb === 'talk') { const n = g.count('gguardTalks') - 1; await g.say('gguard', 's5.t' + (1 + (n % 4))); return true; }
        if (verb === 'use' && !item) { await g.cut(() => this.pull(g)); return true; }
        break;
      case 'gdoor':
        if (verb === 'walk' || verb === 'use') {
          if (!F('guardGone')) { await g.say('hero', 's5.door.no'); return true; }
          await g.cut(async () => { await g.say('hero', 's5.door.yes'); await g.walkTo(254, 224); await g.fade(1, 900); setTimeout(() => g.goScene('house', { intro: true }), 0); }); return true;
        }
        break;
    }
    return false;
  },

  /* on retire la flèche du genou : le garde est libre, part vers l'aventure, et se reprend aussitôt une flèche */
  async pull(g) {
    const e = g.ent('gguard'); g.face(e.x);
    await g.say('hero', 's5.pull1'); g.sfx('cluck'); await g.wait(200); g.sfx('pop'); g.give('arrow');
    await g.say('gguard', 's5.pull2'); await g.say('gguard', 's5.pull3');
    const walk = g.walkEnt('gguard', 420, 250, 52); await g.wait(2300);
    g.sfx('whoosh'); await g.fly('arrow', [140, -20], [e.x, e.y - 12], 380, 0, 1, 0.9); g.sfx('clang'); g.shake(300, 3);
    await g.say('gguard', 's5.pull4'); await walk;
    await g.walkEnt('gguard', 520, 262, 40);
    g.ents = g.ents.filter(x => x !== e); g.set('guardGone'); await g.say('hero', 's5.pull5');
  }
};
