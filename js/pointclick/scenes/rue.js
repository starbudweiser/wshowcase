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
    { type: 'fish', water: [386, 192, 476, 224], k: 1, every: 6, seed: 9 },
    { type: 'wheel3d', cx: 468, cy: 152, rx: 10, ry: 14, speed: 0.6, spokes: 8, paddles: 12 },
    { type: 'frames', id: 'rue_mammoth', fade: false, fps: 0.7, seq: [-1, 0, 0, -1, 1, 1, 2, -1] },
    { type: 'frames', id: 'rue_flowers', fps: 1.3, seq: [-1, 0, 2, 0] }, { type: 'frames', id: 'rue_grass', fps: 1.1, offset: 0.7 }
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

  async intro(g, how) {
    const hero = g.hero; if (how && how.intro === 'cart') await this.cartArrival(g);
    await g.walkTo(196, 252); hero.front = true;
    await g.say('hero', 's.intro1'); await g.say('hero', 's.intro2'); await g.say('hero', 's.intro3'); await g.say('hero', 's.intro4'); hero.front = false;
  },

  /* fin de l'intro (intro.js) : la charrette des prisonniers sort de derrière l'étal, pile, éjecte le héros, puis s'éloigne en perspective
     par la route du pont (le garde s'écarte), roule sur le tablier derrière le parapet et sort à droite */
  async cartArrival(g) {
    const hero = g.hero, Y = 257, LAND = [166, 262], k = () => g.persp(cart.y);
    const cart = { id: 'driver', spr: 'intro.cart', x: -80, y: Y, visible: true, noHot: true, solid: false };
    const riders = [['icomp', 'intro.comp_s', -80, 22, 1, 1.3], ['ithief', 'intro.thief_s', -52, 22, 1, 0.4], ['ihero', 'hero.pNeutral', -108, 58, 0.17, 2.1]]
      .map(([id, spr, dx, dy, k0, ph]) => ({ id, spr, dx, dy, k0, ph, x: cart.x, y: Y, scale: k0, visible: true, noHot: true, solid: false }));
    const fence = this.fenceEnt(g), puffs = [];
    const follow = () => { const s = k(); for (const r of riders) { r.scale = r.k0 * s; r.x = cart.x + r.dx * s; r.y = cart.y - r.dy * s; r.bob = cart.goal ? Math.abs(Math.sin(g.now * 6.2 + r.ph)) * 1.2 * s : 0; } return false; };
    const guard = g.ent('guard'), hen = g.ent('hen');
    const drop = () => { g.ents = g.ents.filter(e => e !== cart && e !== fence && !riders.includes(e)); };
    const clean = () => { drop(); g.ents = g.ents.filter(e => !puffs.includes(e)); hero.visible = true; hero.pose = null; hero.x = LAND[0]; hero.y = LAND[1]; hero.front = true;
      if (guard) { guard.goal = null; guard.x = GUARD_SPOT[0]; guard.y = GUARD_SPOT[1]; guard.flip = false; } if (hen) hen.goal = null; };
    g.cineEnd = clean; hero.visible = false; follow(); g.ents.push(...riders, cart); if (fence) g.ents.push(fence);
    try {
      g.sfx('creak'); cart.goal = [262, Y, 58]; await g.until(() => { follow(); return !cart.goal; }); g.chk();
      g.sfx('screech'); g.shake(260, 1.5);
      await g.say('driver', 'intro.driver1');
      const hr = riders.pop(), s = k(); g.ents = g.ents.filter(e => e !== hr);
      g.sfx('whoosh'); await g.fly('hero.fSurprise', [cart.x - 108 * s, Y - 70 * s], LAND, 760, 58, -6.28, 0.95);
      g.sfx('splat'); g.shake(320, 2.5);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; puffs.push({ id: 'puff' + i, spr: 'puff', x: LAND[0] + Math.cos(a) * 12, y: LAND[1] + 3 + Math.sin(a) * 3, vx: Math.cos(a) * (30 + (i % 4) * 7), k0: 0.6 + (i % 3) * 0.2, scale: 0.6, alpha: 0.75, visible: true, noHot: true, solid: false, z: 2 }); }
      g.ents.push(...puffs); hero.visible = true; hero.x = LAND[0]; hero.y = LAND[1]; hero.front = true; hero.pose = 'hero.fShrug';
      this.cartLeave(g, cart, follow, drop, guard, hen);
      const t0 = g.now; await g.until(() => { const t = g.now - t0; for (const p of puffs) { p.x += p.vx * 0.016 * (1 - Math.min(1, t)); p.scale = p.k0 + t * 1.2; p.alpha = Math.max(0, 0.75 - t * 0.6); } return t > 1.25; });
      g.ents = g.ents.filter(e => !puffs.includes(e)); await g.wait(500); hero.pose = null;
    } finally { if (g.cineEnd === clean) g.cineEnd = null; }
  },
  /* le départ continue pendant que le héros parle : route du pont (la poule s'enfuit, le garde s'écarte), tablier, sortie à droite */
  async cartLeave(g, cart, follow, drop, guard, hen) {
    const on = () => g.ents.includes(cart), go = async (x, y, sp) => { cart.goal = [x, y, sp]; await g.until(() => { follow(); return !cart.goal || !on(); }); };
    if (hen) { g.sfx('cluck'); hen.goal = [326, 260, 70]; }
    await go(290, 222, 52); if (!on()) return;
    if (guard) guard.goal = [378, 213, 32];
    await go(330, 196, 40); if (!on()) return;
    await go(352, 188, 30); if (!on()) return;
    await go(420, 184, 26); if (!on()) return;
    if (guard) guard.goal = [GUARD_SPOT[0], GUARD_SPOT[1], 32];
    if (hen) hen.goal = [288, 242, 30];
    await go(545, 177, 26);
    drop();
  },
  /* parapet du pont : calque tiré du décor lui-même (poteaux et lisses sombres, les jours entre eux restent transparents) ;
     il se dessine devant la charrette quand elle roule sur le tablier */
  fenceEnt(g) {
    const bg = g.bg; if (!bg || !bg.width) return null;
    const P = [[344, 172], [480, 163], [480, 194], [344, 199]], X0 = 344, Y0 = 163, X1 = 480, Y1 = 199;
    const c = document.createElement('canvas'); c.width = X1 - X0; c.height = Y1 - Y0; const x = c.getContext('2d');
    x.drawImage(bg, 0, 0, bg.width, bg.height, -X0, -Y0, 480, 270);
    const d = x.getImageData(0, 0, c.width, c.height), inP = (px, py) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) o = !o; } return o; };
    for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
      const i = (py * c.width + px) * 4, r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
      if (!inP(px + X0, py + Y0) || Math.max(r, gg, b) >= 125 || b >= r + 25) d.data[i + 3] = 0;
    }
    x.putImageData(d, 0, 0); g.imgs['assets/pointclick/spr/__rue_fence.png'] = c;
    return { id: 'ifence', spr: '__rue_fence', x: (X0 + X1) / 2, y: Y1, scale: 1, visible: true, noHot: true, solid: false };
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
