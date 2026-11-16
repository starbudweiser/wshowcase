/* Scène 8 : le bois des papillons. Le mur est trop haut ; un papillon géant, bug de collision à ailes, propulse le héros par-dessus. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.wood;
const PERCH = [160, 114];   /* chapeau du petit champignon où le papillon dort (coordonnées du jeu, vérifiées en jeu le 16/11) */

export default {
  id: 'wood', bg: 'wood.png', persp: [200, 0.64, 268, 1.0],
  walk: [[[130, 268], [150, 240], [230, 218], [300, 204], [360, 198], [440, 226], [470, 268]]],
  fg: [],
  start: { x: 190, y: 258, dir: 'r' },
  hot: [
    { id: 'wwall', rect: [268, 62, 446, 194], at: [318, 206] }, { id: 'wmush', rect: [0, 30, 190, 262], at: [196, 244], dir: 'l' },
    { id: 'wpond', rect: [380, 206, 480, 262], at: [404, 240] }, { id: 'wlight', rect: [150, 0, 290, 112] }
  ],
  ambient: [
    { type: 'flock', n: 3, y0: 10, y1: 50, speed: 7, seed: 41 },
    { type: 'frames', id: 'wood_pond', fps: 2.2 },
    { type: 'frames', id: 'wood_rays', fps: 1.2 },
    { type: 'frames', id: 'wood_spark', fps: 1.6, offset: 0.5 }
  ],
  ents: [
    { id: 'butterfly', spr: 'butterfly', x: 230, y: 150, hot: true, at: [228, 226], z: 400 },
    blindEnt(BL)
  ],

  async enter(g) { blindEnter(g, BL); },
  tick(g) {
    blindTick(g, BL);
    const b = g.ent('butterfly'); if (!b || !b.visible) return;
    /* la nuit, il va se poser sur le chapeau du petit champignon (PERCH) avant de se coucher ; il ne revole qu'après son réveil */
    const n = g.night, perch = n && (n.st !== 'wake' || b.sleepF != null);
    let tx = 230 + Math.sin(g.now * 0.7) * 46, ty = 140 + Math.sin(g.now * 1.3) * 16;
    if (perch) { tx = PERCH[0]; ty = PERCH[1]; }
    const k = perch || b.glide ? Math.min(1, (g.now - (b.gt ?? g.now)) * 2.2) : 1;
    b.gt = g.now; b.glide = perch || (b.glide && Math.hypot(tx - b.x, ty - b.y) > 1.5);
    b.x += (tx - b.x) * k; b.y += (ty - b.y) * k;
    if (b.sleepF == null) b.spr = Math.floor(g.now * 3.5) % 2 ? 'butterfly' : 'butterfly.2';
  },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(214, 252); g.hero.front = true;
    await g.say('hero', 's8.intro1'); await g.say('hero', 's8.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'butterfly':
        if (verb === 'use' || verb === 'take') { await g.cut(() => this.catchIt(g)); return true; }
        break;
      case 'wwall':
        if (verb === 'walk' || verb === 'use') { await g.say('hero', 's8.wall.no'); return true; }
        break;
    }
    return false;
  },

  /* première tentative : il esquive ; seconde : il se pose sur le nez, bat une fois des ailes… et propulse le héros */
  async catchIt(g) {
    if (!g.flag('bfTry')) { await g.say('hero', 's8.b1'); g.set('bfTry'); return; }
    const h = g.hero, x = h.x, y = h.y;
    await g.say('hero', 's8.b2'); g.sfx('pop'); await g.say('hero', 's8.b3');
    g.sfx('whoosh'); g.shake(500, 3); h.visible = false; g.ent('butterfly').visible = false;
    await g.fly('hero.front', [x, y], [452, 150], 1500, 150, 9, 0.8);
    await g.say('narr', 's8.b4'); g.sfx('clang'); await g.say('hero', 's8.b5'); await g.fade(1, 900);
    setTimeout(() => g.goScene('hall', { intro: true }), 0);
  }
};
