/* Scène 3 : la prairie des géants. Programme spatial : meule dorée → géant → noble arrogant en orbite. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.meadow;
import { makeAmbient } from '../engine/ambient.js';
const GIANT = [262, 243], NAZ = [398, 192];
const ORBIT = { type: 'orbit', spr: 'nazim', id: 'nazim_orbit', scale: 0.2, y: 44, arc: 8, period: 58, offset: 10, spin: 0.7, x0: 10, x1: 470 };

export default {
  id: 'meadow', bg: 'meadow.png', persp: [185, 0.6, 268, 1.0],
  walk: [[[10, 268], [20, 242], [130, 238], [222, 238], [300, 234], [372, 206], [392, 190], [404, 190], [470, 214], [470, 268]]],
  fg: [],
  start: { x: 30, y: 256, dir: 'r' },
  hot: [
    { id: 'palace', rect: [300, 11, 462, 98] }, { id: 'mountain', rect: [0, 38, 292, 98] },
    { id: 'skull', rect: [10, 124, 114, 222], at: [120, 242], dir: 'l' }, { id: 'tripod', rect: [19, 38, 90, 165], at: [96, 242] },
    { id: 'ramp', rect: [188, 141, 293, 188], at: [236, 238] }, { id: 'circle', rect: [225, 182, 476, 226], at: [320, 236] },
    { id: 'fire', rect: [118, 198, 168, 232], at: [150, 244] }, { id: 'road', rect: [350, 100, 420, 190], at: [378, 206] }
  ],
  ambient: [
    { type: 'dragon', y: 12, period: 46, offset: 22, scale: 0.9, drop: 6 },
    { type: 'flock', n: 4, y0: 14, y1: 80, speed: 12, seed: 11 },
    { type: 'orbit', spr: 'bucket', id: 'satellite', scale: 0.4, y: 30, arc: 10, period: 64, offset: 30, spin: 1.1 },
    { type: 'frames', id: 'meadow_fire', fps: 7, seq: [0, 1, 2, 1] },
    { type: 'puffs', x: 140, y: 212, h: 44, wind: 8, n: 8 }
  ],
  ents: [
    { id: 'giant', spr: 'giant', x: GIANT[0], y: GIANT[1], scale: 0.78, hot: true, at: [GIANT[0] - 52, GIANT[1] + 8] },
    { id: 'nazim', spr: 'nazim', x: NAZ[0], y: NAZ[1], hot: true, at: [372, 212] },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('nazimGone')) { g.ents = g.ents.filter(e => e.id !== 'nazim'); g.amb.push(...makeAmbient([ORBIT])); }
  },
  tick(g) {
    blindTick(g, BL);
    const gi = g.ent('giant'); if (gi && gi.spr === 'giant') gi.bob = (0.5 + 0.5 * Math.sin(g.now * 1.2)) * 0.9;
  },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(78, 252); g.hero.front = true;
    await g.say('hero', 's3.intro1'); await g.say('hero', 's3.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'giant':
        if (verb === 'talk' || (verb === 'use' && item === 'cheese')) {
          if (F('nazimGone')) { await g.say('giant', 's3.giant.talk3'); return true; }
          if (g.has('cheese')) { await g.cut(() => this.deal(g)); return true; }
          await g.say('giant', F('giantMet') ? 's3.giant.talk2' : 's3.giant.talk1'); g.set('giantMet'); return true;
        }
        break;
      case 'nazim':
        if (verb === 'talk') { await this.nazimTalk(g); return true; }
        break;
      case 'road':
        if (verb === 'walk' || verb === 'use') {
          if (!F('nazimGone')) { await g.say('hero', 's3.road.no'); return true; }
          await g.cut(async () => { await g.say('hero', 's3.exit.yes'); await g.walkTo(396, 190); await g.end('end3'); }); return true;
        }
        break;
      case 'circle': case 'ramp':
        if (verb === 'use' && !item) { await g.say('hero', id === 'circle' ? 'use.circle' : 'use.ramp'); return true; }
        break;
    }
    return false;
  },

  async nazimTalk(g) {
    const n = g.count('nazimTalks') - 1;
    await g.say('nazim', 's3.naz.' + (n % 6));
    if (n === 2) await g.say('hero', 's3.naz.hero');
  },

  async deal(g) {
    const gi = g.ent('giant');
    await g.say('hero', 's3.deal1'); await g.say('giant', 's3.deal2');
    for (;;) {
      const c = await g.ask(['s3.ask.self', 's3.ask.nazim', 's3.ask.nobody']);
      if (c === 2) { await g.say('hero', 's3.nobody.say'); await g.say('giant', 's3.giant.sad'); return; }
      if (c === 0) { await this.launchSelf(g); await g.say('giant', 's3.self.again'); continue; }
      await this.launchNazim(g); return;
    }
  },

  /* le héros se fait envoyer en orbite, puis retombe */
  async launchSelf(g) {
    const gi = g.ent('giant'), h = g.hero, x = h.x, y = h.y;
    await g.say('hero', 's3.self1'); await g.say('giant', 's3.self2'); await g.say('hero', 's3.self3');
    gi.spr = 'giant.swing'; g.sfx('shout'); await g.wait(500); g.sfx('whoosh'); g.shake(700, 3); h.visible = false;
    await g.fly('hero.front', [x, y], [x + 30, -150], 1300, 0, 9, 0.8);
    gi.spr = 'giant'; await g.say('narr', 's3.self.sky'); await g.wait(500);
    g.sfx('whoosh'); await g.fly('hero.front', [x - 30, -150], [x, y], 1100, 0, 10, 0.8);
    g.sfx('clang'); g.shake(500, 4); h.visible = true; await g.wait(300); await g.say('hero', 's3.self.back');
  },

  /* le noble arrogant, lancé dans le ciel */
  async launchNazim(g) {
    const gi = g.ent('giant'), nz = g.ent('nazim');
    await g.say('hero', 's3.n1'); await g.say('giant', 's3.n2');
    g.drop('cheese'); g.sfx('coin');
    await g.walkEnt('giant', GIANT[0] + 62, GIANT[1] - 6, 46);
    await g.say('nazim', 's3.n3');
    gi.spr = 'giant.swing'; g.sfx('shout'); await g.wait(450); g.sfx('whoosh'); g.shake(900, 3.5);
    g.ents = g.ents.filter(e => e !== nz);
    await g.fly('nazim', [nz.x, nz.y], [nz.x + 70, -140], 1700, 0, 11, 0.9);
    gi.spr = 'giant'; await g.say('narr', 's3.n4'); await g.wait(300);
    g.set('nazimGone'); g.amb.push(...makeAmbient([ORBIT]));
    await g.say('hero', 's3.n5'); await g.say('giant', 's3.n6'); await g.say('hero', 's3.n7');
  }
};
