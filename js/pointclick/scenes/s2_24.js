/* Saison 2, chapitre 24 : potion rouge ou potion bleue. Un toit d'immeuble la nuit, sous une pluie de code vert (dessinée par le
   moteur). L'homme au manteau de cuir tend deux fioles : le héros boit les deux. Trois agents au même visage veulent confisquer
   l'inventaire : le Cri « Ralentir le temps », esquive au ralenti… et chute sur le dos. L'enfant à la cuillère : « Le fromage n'existe
   pas » ; le Wabbajack change la cuillère en meule : le fromage existe. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, hit } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

export default {
  id: 's2_24', hd: true, bg: 's2/d_rooftop.webp', music: 's2_24_code', amb: ['night', 0.25], steps: 'stone',
  persp: [170, 0.5, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#a8e0b8', k: 0.22 },
  walk: [[[4, 172], [330, 172], [330, 224], [420, 224], [476, 228], [476, 268], [4, 268]]],
  start: { x: 80, y: 250, dir: 'r' },
  fx: { code: { n: 46, a: 0.32 }, lights: [{ x: 375, y: 120, r: 50, col: '#ffe8c0', a: 0.25, fl: 0.05 }] },
  hot: [
    { id: 's24phone', rect: [330, 40, 420, 218], at: [320, 238], dir: 'r' }, { id: 's24chair', rect: [172, 130, 232, 200], at: [200, 214] },
    { id: 's24tank', rect: [20, 20, 160, 165] }, { id: 's24code', rect: [160, 0, 330, 110] }
  ],
  preload: ['s2:p_guard17', 's2:p_cats24', 's2:p_hens24', 's2:p_vials24'],
  ents: [
    { id: 'morpheus', spr: 's2:morpheus', x: 150, y: 220, hot: true, at: [110, 240], name: 'n.morpheus' },
    { id: 'spoonkid', spr: 's2:spoonkid', x: 262, y: 206, hot: true, at: [246, 226], name: 'n.spoonkid' },
    { id: 'cheese24', spr: 's2:p_cheese24', x: 290, y: 208, scale: 0.26, alpha: 0.55, noShadow: true, hot: true, solid: false, at: [270, 226], name: 'n.cheese24' },
    { id: 'agentm', spr: 's2:agentm', x: 276, y: 240, hot: true, at: [230, 248], block: [22, 6], flip: true, visible: false, name: 'n.agentm' },
    { id: 'agentm2', spr: 's2:agentm', x: 312, y: 236, hot: true, at: [230, 248], block: [22, 6], flip: true, visible: false, name: 'n.agentm2', ph: 1.3 },
    { id: 'agentm3', spr: 's2:agentm', x: 348, y: 244, hot: true, at: [230, 248], block: [22, 6], flip: true, visible: false, name: 'n.agentm3', ph: 2.6 },
    { id: 'cat24', spr: 's2:p_cat24', x: -40, y: 258, scale: 0.22, hot: true, solid: false, at: [200, 256], name: 'n.cat24' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('agents') && !F('dodged')) ['agentm', 'agentm2', 'agentm3'].forEach(i => { g.ent(i).visible = true; });
    if (F('snowcode')) { delete this.fx.code; this.fx.snow = { n: 120 }; } else { this.fx.code = { n: 46, a: 0.32 }; delete this.fx.snow; }
    if (F('cheeseExists')) g.ent('cheese24').visible = false;
    this.catT = g.now + 3;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* le chat noir passe… et repasse, exactement pareil (déjà-vu) */
  tick(g) {
    const C = g.ent('cat24'); if (!C || this.catBusy) return;
    if (g.now >= this.catT) { const u = (g.now - this.catT) / 5; C.x = -40 + 560 * u; C.bob = Math.abs(Math.sin(u * 40)) * 1.2; if (u >= 1) { C.x = -40; this.catT = g.now + 9 + Math.random() * 6; } }
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_matrix.webp', g.T('ch.s2_24'));
    const M = g.ent('morpheus'), h = g.hero; g.face(M.x);
    await g.say('morpheus', 'c24.wake.1'); await g.say('morpheus', 'c24.wake.2'); await g.say('hero', 'c24.wake.3');
    const [x, y] = mid(g, h); twinkle(g, x - 6, y - 10, '#ff4d4d'); twinkle(g, x + 6, y - 10, '#4db8ff'); g.sfx('pop');   /* les deux fioles, cul sec */
    await g.say('morpheus', 'c24.gag.1'); await g.say('hero', 'c24.gag.2'); await g.say('narr', 'c24.wake.narr'); await g.say('morpheus', 'c24.wake.4'); await g.say('hero', 'c24.wake.5');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), M = g.ent('morpheus');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    const isAgent = id === 'agentm' || id === 'agentm2' || id === 'agentm3';
    if (isAgent) {
      if (verb === 'look') { await g.say('hero', 'c24.agents.2'); return true; }
      if (verb === 'talk') { await g.say('agentm', 'c24.agents.5'); return true; }
      if (verb === 'use' && item === 'sweetroll') { g.drop('sweetroll'); twinkle(g, e.x, e.y - 60, '#ffd166'); await g.say('agentm', 'c24.use.sweetroll.agent'); await g.say('hero', 'c24.use.sweetroll.hero'); return true; }
      if (verb === 'use' && item === 'shout') { await g.cut(() => this.slowTime(g)); return true; }
    }
    switch (id) {
      case 'morpheus':
        if (verb === 'look') { await g.say('hero', 'c24.look.morpheus'); return true; }
        if (verb === 'talk') {
          await g.say('morpheus', 'c24.talk.morpheus'); await g.say('hero', 'c24.talk.morpheus.hero');
          if (!F('agents')) await g.cut(() => this.agentsArrive(g)); return true;
        }
        break;
      case 'spoonkid': case 'cheese24':
        if (verb === 'look') { await g.say('hero', 'c24.look.spoonkid'); return true; }
        if (!F('dodged') && F('agents')) { await g.say('hero', 's24.agents.block'); return true; }
        if (verb === 'talk' && id === 'spoonkid') { await g.say('spoonkid', 'c24.talk.spoonkid.1'); await g.say('hero', 'c24.talk.spoonkid.2'); await g.say('spoonkid', 'c24.talk.spoonkid.3'); await g.say('hero', 'c24.talk.spoonkid.4'); return true; }
        if ((verb === 'take' || verb === 'use') && !item && id === 'cheese24') { twinkle(g, e.x, e.y - 8, '#3dff6a'); await g.say('hero', 'c24.use.hand.cheese'); return true; }
        break;
      case 'cat24':
        if (verb === 'look') { if (!F('dejavu')) { g.set('dejavu'); await g.say('hero', 'c24.look.cat'); this.catT = g.now; } else await g.say('hero', 'c24.look.cat.2'); return true; }
        break;
      case 's24phone': if (verb === 'look') { await g.say('hero', 'c24.look.phone'); return true; } break;
      case 's24code': if (verb === 'look') { await g.say('hero', 'c24.look.code'); return true; } break;
      case 's24chair': if (verb === 'look') { await g.say('hero', 'look.s24chair'); return true; } break;
      case 's24tank': if (verb === 'look') { await g.say('hero', 'look.s24tank'); return true; } break;
    }
    return false;
  },

  /* trois agents, le même visage */
  async agentsArrive(g) {
    const As = ['agentm', 'agentm2', 'agentm3'].map(i => g.ent(i)), M = g.ent('morpheus');
    for (const a of As) { await zap(g, a.x, a.y - 40, { peak: () => { a.visible = true; }, cols: ['#3dff6a', '#ffffff', '#0a3a1a'] }); }
    g.chk(); g.set('agents'); g.face(As[0].x);
    await g.say('agentm', 'c24.agents.1'); await g.say('hero', 'c24.agents.2'); await g.say('agentm', 'c24.agents.3'); await g.say('hero', 'c24.agents.4'); await g.say('agentm', 'c24.agents.5');
    g.face(M.x); await g.say('morpheus', 'c24.agents.6');
  },
  /* « Ralentir le temps » : esquive au ralenti… et chute sur le dos */
  async slowTime(g) {
    const h = g.hero, As = ['agentm', 'agentm2', 'agentm3'].map(i => g.ent(i)), M = g.ent('morpheus'), [hx, hy] = mid(g, h);
    g.face(As[0].x); await g.say('hero', 'c24.use.shout'); g.sfx('shout');
    g.parts = g.parts || []; for (let i = 0; i < 6; i++) g.parts.push({ k: 'ring', x: hx, y: hy, r0: 6, r1: 60, t: -i * 0.3, life: 2.4, col: '#3dff6a' });   /* le temps ralentit : ondes lentes */
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 2.2); h.rot = -1.35 * Math.sin(Math.min(1, u * 1.15) * Math.PI / 2); h.bob = Math.sin(u * Math.PI) * 10; return u >= 1; });
    hit(g, hx, h.y - 6, '#cfe4ff'); g.sfx('clang'); await g.say('narr', 'c24.use.shout.narr');
    h.rot = 0; h.bob = 0; await g.say('hero', 'c24.use.shout.hero'); g.face(As[0].x); await g.say('agentm', 'c24.use.shout.agentm');
    for (const a of As) { await zap(g, a.x, a.y - 40, { peak: () => { a.visible = false; }, cols: ['#3dff6a', '#ffffff'] }); }
    g.chk(); g.set('dodged'); g.face(M.x); await g.say('morpheus', 'c24.use.shout.morpheus');
  },

  async wab(g, id) {
    const e = g.ent(id), M = g.ent('morpheus'), K = g.ent('spoonkid');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'spoonkid': case 'cheese24': {   /* la cuillère devient une meule : le fromage existe */
        if (g.flag('cheeseExists')) break;
        if (!g.flag('dodged') && g.flag('agents')) { await g.say('hero', 's24.agents.block'); return; }
        const C = g.ent('cheese24'); await wabZap(g, K, () => { C.alpha = 1; }, ['#ffd166', '#3dff6a', '#ffffff']);
        await g.say('hero', 'c24.use.wab.spoon'); twinkle(g, C.x, C.y - 8, '#ffd166'); g.sfx('pop'); C.visible = false; g.give('cheese24'); g.set('cheeseExists');
        await g.say('spoonkid', 'c24.use.wab.spoon.kid'); g.face(M.x); await g.say('morpheus', 'c24.use.wab.spoon.morpheus'); await g.say('hero', 'c24.use.wab.spoon.hero');
        await g.say('hero', 'c24.end.hero'); await g.say('narr', 'c24.end.narr'); await g.fade(1, 1200); nextChapter(g, 's2_24'); return;
      }
      case 'agentm': case 'agentm2': case 'agentm3': await wabSwap(g, e, 's2:p_guard17', [['agentm', 'c24.wk.agent'], ['hero', 'c24.wk.agent.hero']], 's24.wk.back', { flip: false }); return;
      case 'cat24': {   /* déjà-vu : deux chats, puis deux poules */
        this.catBusy = true; Object.assign(e, { x: 200, y: 258 });
        await wabZap(g, e, () => { e.spr = 's2:p_cats24'; e.scale = 0.3; }, ['#3dff6a', '#ffffff']); await g.wait(400);
        await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:p_hens24'; } }); g.chk(); await g.say('hero', 'c24.wk.cat');
        await sheoPops(g, 'c24.wk.cat.sheo');
        await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:p_cat24'; e.scale = 0.22; e.x = -40; } }); g.chk(); this.catBusy = false; this.catT = g.now + 4; return;
      }
      case 's24code': {   /* la pluie de code devient de la neige */
        if (g.flag('snowcode')) break;
        g.face(240); await zap(g, 240, 40, { from: tip(g), peak: () => { delete this.fx.code; this.fx.snow = { n: 120, t0: g.now }; }, cols: ['#ffffff', '#dff2ff', '#3dff6a'] }); g.chk(); g.set('snowcode');
        await g.say('hero', 'c24.wk.code'); g.face(M.x); await g.say('morpheus', 'c24.wk.code.morpheus'); return;
      }
      case 's24phone': {   /* la sonnerie joue l'air de chez nous */
        await wabZap(g, null, null, ['#ffd166', '#ffffff']); const tw = setInterval(() => { if (!g.alive) return clearInterval(tw); twinkle(g, 375 + (Math.random() - 0.5) * 40, 90 + Math.random() * 60, '#ffd166'); }, 220);
        await g.say('hero', 'c24.wk.phone'); g.face(M.x); await g.say('morpheus', 'c24.wk.phone.morpheus'); clearInterval(tw); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
