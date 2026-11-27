/* Saison 2, chapitre 22 (1/2) : la chambre rouge. Rideaux rouges, sol en zigzag ; le petit homme en rouge parle à l'envers (répliques
   `envers` : voix retournée et sous-titre forcé ; `rev: true` : toutes ses boucles à l'envers). Sous Wabbajack il parle enfin à
   l'endroit (`fwd: true` le temps de sa réplique)… et c'est le héros qui parle à l'envers (ses animations restent à l'endroit).
   Sheogorath est chez lui : sa meule contre un bon café et une part de tarte aux cerises (le café de la ville, s2_22b).
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, nextChapter, mid, tip } from './s2_common.js';

export default {
  id: 's2_22', hd: true, bg: 's2/d_redroom.webp', music: 's2_22_foret', amb: ['night', 0.15], steps: 'wood',
  persp: [176, 0.5, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffb0a0', k: 0.2, lamps: [{ x: 34, y: 70, r: 120, col: '#ffc070', k: 0.45 }, { x: 177, y: 72, r: 110, col: '#ffc070', k: 0.4 }] },
  walk: [[[180, 178], [460, 178], [476, 268], [4, 268], [4, 228], [180, 216]]],
  start: { x: 120, y: 250, dir: 'r' },
  fx: { lights: [{ x: 34, y: 66, r: 22, col: '#ffc070', a: 0.7, fl: 0.06 }, { x: 177, y: 68, r: 20, col: '#ffc070', a: 0.7, fl: 0.06 }, { x: 346, y: 172, r: 16, col: '#ff3030', a: 0.5, fl: 0, breathe: 0.8 }] },
  hot: [
    { id: 's22exit', rect: [324, 90, 368, 182], at: [346, 192], dir: 'r' }, { id: 's22curtains', rect: [370, 0, 480, 170] }, { id: 's22curtains', rect: [180, 0, 320, 160] },
    { id: 's22floor', rect: [180, 200, 470, 268] }, { id: 's22lamp', rect: [22, 60, 50, 220] }, { id: 's22lamp', rect: [164, 62, 192, 186] }
  ],
  ents: [
    { id: 'redman', spr: 's2:redman', x: 236, y: 214, rev: true, hot: true, at: [196, 232], name: 'n.redman' },
    { id: 'sheo', spr: 's2:sheo', x: 392, y: 224, hot: true, at: [348, 238], flip: true, name: 'n.sheo22', aura: { col: '#c77dff', r: 0.6, a: 0.25, wisps: 2 } }
  ],

  async enter(g, how) {
    this.dance = 0;
    if (how.back) { Object.assign(g.hero, { x: 340, y: 200, dir: 'l' }); g.fade(0, 600); }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* la danse : Sheogorath et le petit homme, chacun dans son sens */
  tick(g) {
    if (!this.dance || g.now > this.dance) { if (this.dance) { const R = g.ent('redman'), S = g.ent('sheo'); R.bob = 0; S.bob = 0; R.flip = false; S.flip = true; this.dance = 0; } return; }
    const R = g.ent('redman'), S = g.ent('sheo'), t = g.now * 3.2;
    R.bob = Math.abs(Math.sin(t)) * 4; S.bob = Math.abs(Math.cos(t)) * 4; R.flip = Math.sin(t * 0.5) > 0; S.flip = Math.sin(t * 0.5) < 0;
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_twinpeaks.webp', g.T('ch.s2_22'));
    const R = g.ent('redman'); g.face(R.x);
    await g.say('redman', 'c22.wake.1'); await g.say('hero', 'c22.wake.2'); await g.say('narr', 'c22.wake.3');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'redman':
        if (verb === 'look') { await g.say('hero', 'c22.look.redman'); return true; }
        if (verb === 'talk') { await g.say('redman', 'c22.talk.redman.1'); await g.say('hero', 'c22.talk.redman.2'); return true; }
        if (verb === 'use' && item === 'shout') { await g.cut(() => this.shoutBack(g)); return true; }
        break;
      case 'sheo':
        if (verb === 'look') { await g.say('hero', 'look.sheo'); return true; }
        if (verb === 'talk') { await g.cut(() => (F('sheoAsk') ? this.danceGag(g) : this.sheoTalk(g))); return true; }
        if (verb === 'use' && item === 'sweetroll') { await g.say('sheo', 'c22.use.sweetroll.sheo'); return true; }
        if (verb === 'use' && (item === 'pie22' || item === 'coffee22')) {
          if (!(g.has('pie22') && g.has('coffee22'))) { await g.say('hero', 's22.need.both'); return true; }
          await g.cut(() => this.pay(g)); return true;
        }
        break;
      case 's22exit':
        if (verb === 'look') { await g.say('hero', 'look.s22exit'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.fade(1, 600); setTimeout(() => g.goScene('s2_22b', { intro: true }), 0); return true; }
        break;
      case 's22curtains': if (verb === 'look') { await g.say('hero', 'c22.look.curtains'); return true; } break;
      case 's22floor': if (verb === 'look') { await g.say('hero', 'c22.look.floor'); return true; } break;
      case 's22lamp': if (verb === 'look') { await g.say('hero', 'look.s22lamp'); return true; } break;
    }
    return false;
  },

  async sheoTalk(g) {
    const S = g.ent('sheo'), R = g.ent('redman'); g.face(S.x);
    await g.say('sheo', 'c22.sheo.1'); g.face(R.x); await g.say('redman', 'c22.sheo.2'); await g.say('hero', 'c22.sheo.3');
    g.face(S.x); await g.say('hero', 'c22.sheo.4'); await g.say('sheo', 'c22.sheo.5'); await g.say('hero', 'c22.sheo.6'); g.set('sheoAsk');
  },
  async danceGag(g) {
    this.dance = g.now + 7; await g.say('narr', 'c22.gag.narr'); await g.say('redman', 'c22.gag.redman'); await g.say('hero', 'c22.gag.hero');
  },
  /* le Cri à l'envers : il aspire au lieu de repousser */
  async shoutBack(g) {
    const R = g.ent('redman'), h = g.hero, [hx, hy] = mid(g, h); g.face(R.x);
    await g.say('hero', 'c22.use.shout.redman'); g.sfx('shout');
    g.parts = g.parts || []; for (let i = 0; i < 4; i++) g.parts.push({ k: 'ring', x: hx, y: hy, r0: 70 - i * 8, r1: 4, t: -i * 0.12, life: 0.7, col: '#ff6060' });   /* ondes qui se referment */
    await g.wait(900); await g.say('hero', 'c22.use.shout.redman.2'); await g.say('redman', 'c22.use.shout.redman.3');
  },
  /* la meule contre un café et une part de tarte */
  async pay(g) {
    const S = g.ent('sheo'), R = g.ent('redman'); g.face(S.x); g.drop('pie22'); g.drop('coffee22'); twinkle(g, S.x, S.y - 60, '#ff6b6b');
    await g.say('sheo', 'c22.use.pie.sheo'); twinkle(g, S.x - 10, S.y - 50, '#ffd166'); g.sfx('pop'); g.give('cheese22'); await g.say('hero', 'c22.use.pie.hero');
    g.face(R.x); await g.say('redman', 'c22.end.redman'); await g.say('hero', 'c22.end.hero'); await g.say('narr', 'c22.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_22');
  },

  async wab(g, id) {
    const e = g.ent(id), R = g.ent('redman');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    if (id === 'redman') {   /* il parle à l'endroit, le héros à l'envers */
      await wabZap(g, R, () => { R.fwd = true; }, ['#ff3030', '#ffffff', '#202020']);
      await g.say('redman', 'c22.use.wab.redman'); R.fwd = false;
      await g.say('hero', 'c22.use.wab.redman.hero'); await g.say('narr', 'c22.use.wab.redman.narr');
      await zap(g, ...mid(g, R), { cols: ['#ff3030', '#ffffff'] }); g.chk(); await g.say('hero', 's22.wk.back'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
