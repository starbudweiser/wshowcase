/* Scène 1 : la rue principale de Rivebois. Énigme du seau : aveugler le marchand, voler le rouleau au miel, amadouer le garde du pont. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.rue;
const GUARD_SPOT = [354, 204];

export default {
  id: 'rue', bg: 'rue.png', persp: [198, 0.5, 268, 1.0],
  walk: [[[128, 268], [132, 238], [160, 224], [215, 212], [260, 206], [330, 198], [352, 200], [372, 214], [372, 268]]],
  fg: [[[4, 190], [60, 188], [125, 190], [125, 264], [4, 264]]],   /* le comptoir passe devant le marchand */
  start: { x: 146, y: 262, dir: 'r' },
  hot: [
    { id: 'mountain', rect: [322, 8, 450, 110] }, { id: 'mammoth', rect: [388, 130, 418, 160] }, { id: 'mill', rect: [425, 130, 475, 168] },
    { id: 'house', rect: [0, 20, 100, 135] }, { id: 'inn', rect: [100, 60, 215, 150] }, { id: 'sign', rect: [135, 86, 178, 112] },
    { id: 'door', rect: [158, 150, 182, 195], at: [176, 210] },
    { id: 'stall', rect: [4, 138, 128, 262], at: [136, 240], dir: 'l' },
    { id: 'cart', rect: [128, 182, 160, 228], at: [170, 228], dir: 'l' },
    { id: 'flowers', rect: [372, 222, 480, 268], at: [362, 244] },
    { id: 'bridge', rect: [352, 172, 480, 214], at: [332, 206] },
    { id: 'honey', rect: [88, 190, 124, 208], at: [134, 236], dir: 'l' }
  ],
  /* décor vivant : dragon qui vole, oiseaux, rivière, roue du moulin, mammouth qui respire, fleurs et herbes dans le vent */
  ambient: [
    { type: 'flock', n: 5, y0: 16, y1: 80, speed: 12, seed: 4 },
    { type: 'frames', id: 'rue_river1', fps: 2.2 }, { type: 'frames', id: 'rue_river2', fps: 2, offset: 0.4 },
    { type: 'fish', spots: [[392, 206, 0.55, 1], [424, 208, 0.55, -1]], every: 6, seed: 9 },
    { type: 'wheel3d', cx: 468, cy: 152, rx: 10, ry: 14, speed: 0.6, spokes: 8, paddles: 12 },
    { type: 'frames', id: 'rue_mammoth', fade: false, fps: 0.7, seq: [-1, 0, 0, -1, 1, 1, 2, -1] },
    { type: 'frames', id: 'rue_flowers', fps: 1.3 }, { type: 'frames', id: 'rue_grass', fps: 1.1, offset: 0.7 }
  ],
  ents: [
    { id: 'merchant', spr: 'merchant', x: 72, y: 214, hot: true, hit: [48, 160, 100, 190], at: [136, 238], z: -50 },
    { id: 'guard', spr: 'guard', x: GUARD_SPOT[0], y: GUARD_SPOT[1], hot: true, at: [330, 207] },
    { id: 'hen', spr: 'hen', x: 288, y: 242, hot: true, at: [300, 246] },
    { id: 'bucket', spr: 'bucket', x: 236, y: 224, hot: true, at: [250, 230], z: -3 },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('blind')) g.ent('merchant').spr = 'merchant.bucket';
    if (g.flag('bucketTaken')) g.ents = g.ents.filter(e => e.id !== 'bucket');
    if (g.flag('guardmoved')) { const e = g.ent('guard'); e.x = 306; e.y = 226; g.addWalk([[352, 196], [372, 214], [472, 206], [472, 186], [390, 184]]); }
  },
  tick(g) {
    blindTick(g, BL);
    const h = g.ent('hen'); if (h) { h.bob = Math.max(0, Math.sin(g.now * 3.1)) * 1.6; if (g.now > (h.ck || 4)) { h.ck = g.now + 6 + Math.random() * 6; if (g.started && !g.locked) g.sfx('cluck'); } }
    const m = g.ent('merchant'); if (m && g.flag('blind')) m.bob = Math.abs(Math.sin(g.now * 1.3)) * 1.2;
  },

  async intro(g) {
    const hero = g.hero; await g.walkTo(196, 252); hero.front = true;
    await g.say('hero', 's.intro1'); await g.say('hero', 's.intro2'); await g.say('hero', 's.intro3'); await g.say('hero', 's.intro4'); hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    if (id === 'bridge' && (verb === 'walk' || verb === 'use')) { await this.bridge(g); return true; }
    switch (id) {
      case 'bucket':
        if (verb === 'take') { await g.cut(async () => { await g.say('hero', 's.bucket.take'); g.sfx('pop'); g.ents = g.ents.filter(e => e.id !== 'bucket'); g.set('bucketTaken'); g.give('bucket'); }); return true; }
        break;
      case 'hero':
        if (verb === 'look') { await g.say('hero', 'look.hero'); return true; }
        break;
      case 'merchant': {
        const blind = F('blind');
        if (verb === 'look') { await g.say('hero', blind ? 'look.merchant.blind' : 'look.merchant'); return true; }
        if (verb === 'take' && blind) { await g.say('hero', 'take.merchant.blind'); return true; }
        if (verb === 'talk') { await g.cut(() => (blind ? this.talkBlind(g) : this.talkMerchant(g))); return true; }
        if (verb === 'use' && item === 'bucket') { if (blind) { await g.say('hero', 'use.bucket.merchant.again'); return true; } await g.cut(() => this.bucketGag(g)); return true; }
        break;
      }
      case 'honey':
        if (verb === 'take') {
          if (g.has('honey') || F('honey')) { await g.say('hero', 'take.honey.done'); return true; }
          if (!F('blind')) { await g.cut(async () => { const n = g.count('tries'); await g.say('hero', 's.honey.try'); await g.say('merchant', 's.honey.seen'); if (n % 3 === 0) { await g.say('guard', 's.guard.arrow1'); await g.say('hero', 's.guard.arrow1h'); } else await g.say('hero', 's.honey.retreat'); }); return true; }
          await g.cut(async () => { await g.say('hero', 's.steal1'); g.sfx('pop'); g.set('honey'); g.give('honey'); await g.say('merchant', 's.steal2'); await g.say('hero', 's.steal3'); if (!F('windDone')) { g.set('windDone'); await g.say('guard', 's.guard.wind'); } });
          return true;
        }
        break;
      case 'guard':
        if (verb === 'talk') { await g.cut(() => this.talkGuard(g)); return true; }
        if (verb === 'use' && item === 'honey') { await g.cut(() => this.giveHoney(g)); return true; }
        break;
      case 'dragon':
        if (verb === 'talk' || verb === 'use') { await g.cut(async () => { g.sfx('shout'); g.shake(1100, 3); await g.say('hero', '=FUS... RO... DAH !'); await g.wait(500); await g.say('guard', 's.guard.wind'); }); return true; }
        break;
    }
    return false;
  },

  /* ── le gag du seau : le marchand devient aveugle et amnésique ── */
  async bucketGag(g) {
    const m = g.ent('merchant'), h = g.hero; g.face(m.x);
    await g.say('hero', 's.bucket.use1'); g.drop('bucket');
    await g.fly('bucket', [h.x + 8, h.y - 34], [m.x, m.y - 56], 520, 36, 5.5); g.sfx('clang'); g.shake(350, 2);
    g.set('blind'); m.spr = 'merchant.bucket'; await g.wait(300);
    await g.say('merchant', 's.blind1'); await g.say('merchant', 's.blind2'); await g.say('hero', 's.blind3');
  },
  async talkMerchant(g) {
    await g.say('merchant', 'a.mHi'); g.hero.front = true;
    for (;;) {
      const c = await g.ask(['q.m1', 'q.m2', 'q.m3', 'q.m0']);
      if (c === 0) { await g.say('hero', 'q.m1'); await g.say('merchant', 'a.m1'); await g.say('hero', 'a.m1h'); await g.say('merchant', 'a.m1b'); await g.say('hero', 'a.m1c'); await g.say('merchant', 'a.m1d'); }
      else if (c === 1) { await g.say('hero', 'q.m2'); await g.say('merchant', 'a.m2'); await g.say('hero', 'a.m2h'); }
      else if (c === 2) { await g.say('hero', 'q.m3'); await g.say('merchant', 'a.m3'); await g.say('hero', 'a.m3h'); }
      else { await g.say('hero', 'q.m0'); await g.say('merchant', 'a.mBye'); break; }
    }
    g.hero.front = false;
  },
  async talkBlind(g) {
    const n = g.count('btalk') % 3; g.hero.front = true;
    if (n === 1) { await g.say('merchant', 'b.m1'); await g.say('hero', 'b.m1h'); await g.say('merchant', 'b.m1b'); await g.say('hero', 'b.m1c'); }
    else if (n === 2) { await g.say('merchant', 'b.m2'); await g.say('hero', 'b.m2h'); await g.say('merchant', 'b.m2b'); }
    else { await g.say('merchant', 'b.m3'); await g.say('hero', 'b.m3h'); await g.say('merchant', 's.blind4'); }
    g.hero.front = false;
  },
  async talkGuard(g) {
    g.hero.front = true;
    if (!g.flag('metGuard')) { g.set('metGuard'); await g.say('guard', 'a.gHi'); await g.say('hero', 'a.gHih'); await g.say('guard', 'a.gHib'); }
    for (;;) {
      const c = await g.ask(['q.g1', 'q.g2', 'q.g3', 'q.g0']);
      if (c === 0) { await g.say('hero', 'q.g1'); await g.say('guard', 'a.g1'); await g.say('hero', 'a.g1h'); }
      else if (c === 1) { await g.say('hero', 'q.g2'); await g.say('guard', 'a.g2'); await g.say('hero', 'a.g2h'); await g.say('guard', 'a.g2b'); }
      else if (c === 2) { await g.say('hero', 'q.g3'); await g.say('guard', 'a.g3'); await g.say('hero', 'a.g3h'); }
      else { await g.say('hero', 'q.g0'); break; }
    }
    g.hero.front = false;
  },
  async bridge(g) {
    if (!g.flag('guardmoved')) { await g.cut(async () => { const n = g.count('blocks'); await g.say('guard', n === 1 ? 's.bridge1' : 's.bridge2'); await g.say('hero', n === 1 ? 's.bridge1h' : 's.bridge2h'); }); return; }
    await g.cut(async () => { await g.say('hero', 's.cross'); await g.walkTo(470, 196); await g.fade(1, 800); setTimeout(() => g.goScene('mill', { intro: true }), 0); });
  },
  async giveHoney(g) {
    g.hero.front = false; await g.say('hero', 's.guard.give1'); g.drop('honey'); g.sfx('coin');
    await g.say('guard', 's.guard.eat1'); await g.say('guard', 's.guard.eat2'); await g.say('hero', 's.guard.eat2h');
    await g.say('guard', 's.guard.pass'); await g.say('hero', 's.guard.passh');
    g.set('guardmoved'); g.addWalk([[352, 196], [372, 214], [472, 206], [472, 186], [390, 184]]);
    await g.walkEnt('guard', 306, 226, 36);
  }
};
