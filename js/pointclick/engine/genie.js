/* Génie des indices (23/11/2026) : on frotte la vieille lampe de l'inventaire, le génie nordique apparaît d'une des 8 façons
   (tirée au hasard, sans répétition avant d'avoir tout vu), dit l'indice de l'étape en cours, puis repart aspiré dans sa lampe.
   Indices gradués (data/hints.js) : redemander à la même étape donne l'indice suivant, plus clair, jusqu'à la solution exacte.
   Tout se joue dans une cinématique (g.cut) ; les accessoires sont des entités temporaires retirées à la fin, même interrompue. */
import { hintStep } from '../data/hints.js';

const W = 480, H = 270, TAU = Math.PI * 2;
const NAMES = ['cork', 'cabbage', 'cart', 'mole', 'load', 'portal', 'dragon', 'fus'];
const ease = t => 1 - (1 - t) * (1 - t);

/* animation pas à pas : f(t) avec t de 0 à 1 sur ms millisecondes */
async function tw(g, ms, f) { const t0 = g.now, d = ms / 1000; await g.until(() => { const t = Math.min(1, (g.now - t0) / d); f(t); return t >= 1; }); g.chk(); }

export async function rubLamp(g) {
  if (!g.hero || !g.scene) return;
  await g.cut(async () => {
    const F = g.st.flags, step = hintStep(g); let key;
    if (step === 'done') key = 'genie.done';
    else { F.hintLvl = F.hintAt === step ? Math.min(3, (F.hintLvl || 1) + 1) : 1; F.hintAt = step; key = `hint.${step}.${F.hintLvl}`; }
    /* sac des apparitions : les 8 dans le désordre, sans répéter la dernière en le remplissant */
    let bag = Array.isArray(F.genieBag) ? F.genieBag.filter(i => i >= 0 && i < NAMES.length) : [];
    if (!bag.length) { bag = NAMES.map((_, i) => i).sort(() => Math.random() - 0.5); if (bag[0] === F.genieLast && bag.length > 1) bag.push(bag.shift()); }
    const n = bag.shift(); F.genieBag = bag; F.genieLast = n; g.save();

    /* côté du héros le plus dégagé : loin des autres personnages à la même profondeur, sinon vers le centre de l'écran */
    const h = g.hero, y = h.y, near = g.ents.filter(o => o !== h && o.visible !== false && o.spr && Math.abs(o.y - y) < 45);
    const room = sd => { const cx = Math.max(40, Math.min(W - 40, h.x + sd * 58)); return Math.min(70, ...near.map(o => Math.abs(o.x - cx))) + (Math.abs(cx - h.x) > 40 ? 0 : -50) + (sd === (h.x < W / 2 ? 1 : -1) ? 1 : 0); };
    const side = room(1) >= room(-1) ? 1 : -1, x = Math.max(40, Math.min(W - 40, h.x + side * 58));
    const s = g.persp(y), tmp = [];
    const ent = (spr, o) => { const e = { id: 'g_' + tmp.length, spr, x, y, scale: s, visible: true, noHot: true, ...o }; g.ents.push(e); tmp.push(e); return e; };
    const kill = e => { g.ents = g.ents.filter(x => x !== e); };
    const gh = () => (g.spr('genie') ? g.spr('genie').height : 110) * s;
    const puffs = (px, py, k = 6, r = 16, ms = 650) => {
      const ps = Array.from({ length: k }, (_, i) => ent('puff', { x: px, y: py, a: i / k * TAU + Math.random() * 0.6, z: 60, alpha: 1, scale: s * 0.6 }));
      return tw(g, ms, t => ps.forEach(p => { p.x = px + Math.cos(p.a) * r * t; p.y = py + Math.sin(p.a) * r * 0.45 * t - 8 * t; p.scale = s * (0.6 + 1.5 * t); p.alpha = 1 - t; }))
        .finally(() => ps.forEach(kill)).catch(() => {});
    };
    const e = ent('genie', { id: 'genie', who: 'genie', visible: false, float: 0, z: -1 });
    g.face(x, y - 30);
    try {
      g.sfx('squeak');
      await APPEAR[NAMES[n]](g, { e, x, y, s, side, h, ent, kill, puffs, gh });
      e.visible = true; e.rot = 0; e.clipY = null; e.alpha = 1; if (!e.keep) e.spr = 'genie';
      if (!e.float) await tw(g, 400, t => { e.float = 6 * ease(t); });
      await g.say('genie', 'genie.in.' + NAMES[n]);
      await g.say('genie', key);
      await suck(g, { e, x, y, s, h, ent, kill, puffs });
    } finally { tmp.forEach(kill); g.overFx = null; if (g.cinePos) delete g.cinePos.shout; }
  });
}

/* départ commun : la lampe se pose entre le héros et lui, il s'y engouffre en tourbillonnant comme dans un aspirateur */
async function suck(g, { e, y, s, h, ent, kill, puffs }) {
  const lx = (h.x + e.x) / 2, L = ent('lamp', { x: lx, y: y + 2, scale: s * 0.75, z: 2 });
  puffs(lx, y - 4, 4, 8, 400); g.sfx('pop'); await g.wait(250);
  const x0 = e.x, y0 = e.y, f0 = e.float || 0, s0 = e.scale; g.sfx('whoosh');
  await tw(g, 950, t => { const q = t * t; e.x = x0 + (lx - x0) * q; e.y = y0 + (y - 6 - y0) * q; e.float = f0 * (1 - q); e.scale = s0 * (1 - 0.94 * q); e.rot = q * 5 * TAU; L.rot = Math.sin(t * 50) * 0.15 * t; });
  kill(e); g.sfx('pop'); await tw(g, 300, t => { L.rot = Math.sin(t * 30) * 0.2 * (1 - t); L.scale = s * 0.75 * (1 + 0.25 * Math.sin(t * Math.PI)); });
  await g.wait(250); puffs(lx, y - 4, 4, 8, 400); kill(L); await g.wait(300);
}

const APPEAR = {
  /* 1. le bouchon : la lampe tremble et gonfle, il reste coincé aux épaules, puis sort d'un « plop » de bouchon de champagne */
  async cork(g, { e, x, y, s, ent, kill, puffs, gh }) {
    const L = ent('lamp', { x, y: y + 2, scale: s * 0.75, z: 2 }), s0 = L.scale; puffs(x, y - 4, 4, 8, 400); g.sfx('pop'); await g.wait(300);
    await tw(g, 900, t => { L.rot = Math.sin(t * 42) * 0.22; L.scale = s0 * (1 + 0.35 * t + 0.06 * Math.sin(t * 30)); });
    const top = y - 10 * s, hg = gh(); e.visible = true; e.clipY = top; e.y = top + hg * 0.68; g.sfx('squeak');
    await tw(g, 1300, t => { e.x = x + Math.round(Math.sin(t * 38) * 2); L.rot = Math.sin(t * 38) * 0.1; });
    e.x = x; e.clipY = null; g.sfx('pop'); g.shake(200, 2); puffs(x, top, 7, 20, 600);
    const y0 = e.y; await tw(g, 380, t => { e.y = y0 + (y - 34 - y0) * ease(t); L.scale = s0 * (1.35 - 0.35 * t); });
    e.spr = 'genie.tada'; await tw(g, 320, t => { e.y = y - 34 + 34 * t; e.float = 6 * t; }); e.y = y; e.keep = true;
    puffs(x, y - 4, 4, 8, 400); kill(L); await g.wait(700); e.keep = false;
  },
  /* 2. le chou : il tombe du ciel, gonfle, explose en fumée ; le génie est dedans */
  async cabbage(g, { e, x, y, s, ent, kill, puffs }) {
    const C = ent('cabbage', { y: -20, z: 1 });
    await tw(g, 650, t => { C.y = -20 + (y + 20) * t * t; C.rot = t * 4 * TAU; }); C.rot = 0; g.sfx('splat'); g.shake(200, 2);
    await tw(g, 900, t => { C.scale = s * (1 + 2.6 * t * t) * (1 + 0.06 * Math.sin(t * 60)); C.rot = Math.sin(t * 34) * 0.12 * t; });
    kill(C); g.sfx('pop'); g.shake(350, 3); puffs(x, y - 18, 9, 30, 750);
    e.visible = true; e.spr = 'genie.tada'; e.keep = true; e.float = 6; await g.wait(900); e.keep = false;
  },
  /* 3. la charrette : elle s'écrase depuis le ciel (comme au réveil de l'intro), il sort de derrière l'épave */
  async cart(g, { e, x, y, s, ent, kill, puffs }) {
    const C = ent('cart', { y: -60, z: 3 });
    await tw(g, 800, t => { C.y = -60 + (y + 4 + 60) * t * t; C.rot = Math.sin(t * 9) * 0.3 * (1 - t); }); C.rot = 0.12;
    g.sfx('crash'); g.shake(700, 4); puffs(x, y - 8, 9, 34, 900); await g.wait(700);
    e.visible = true; e.alpha = 0; e.float = 6;
    await tw(g, 700, t => { e.alpha = t; C.alpha = 1 - t; }); kill(C);
  },
  /* 4. la taupe : une taupinière file vers le héros en soulevant la terre, il en jaillit casque en premier */
  async mole(g, { e, x, y, s, side, ent, puffs, gh }) {
    const x0 = Math.max(16, Math.min(W - 16, x + side * 150)), M = ent('genie.mound', { x: x0, y: y + 3, z: 2 }); let last = -1;
    g.sfx('rumble');
    await tw(g, 1700, t => { M.x = x0 + (x - x0) * t; M.y = y + 3 - Math.abs(Math.sin(t * 22)) * 2; const k = Math.floor(t * 8); if (k !== last) { last = k; puffs(M.x, y, 3, 8, 380); } });
    M.y = y + 3; g.shake(400, 3); g.sfx('rumble'); await g.wait(350);
    const hg = gh(); e.visible = true; e.clipY = y + 1; e.y = y + hg + 4; g.sfx('pop'); puffs(x, y - 2, 7, 18, 600);
    await tw(g, 650, t => { e.y = y + (hg + 4) * (1 - ease(t)); }); e.clipY = null; e.y = y;
  },
  /* 5. l'écran de chargement : faux écran de jeu de rôle, il y tourne sur lui-même, une astuce absurde, la barre se remplit */
  async load(g, { e, x, y }) {
    await g.fade(1, 450); const tip = g.T('gtip.' + (1 + Math.floor(Math.random() * 4))), title = g.T('gtip.title'), t0 = g.now, D = 3.6;
    const im = g.spr('genie');
    g.overFx = c => {
      const t = Math.min(1, (g.now - t0) / D); c.save(); c.fillStyle = '#0a0a0c'; c.fillRect(0, 0, W, H);
      const gr = c.createRadialGradient(W / 2, 110, 10, W / 2, 110, 170); gr.addColorStop(0, 'rgba(70,80,110,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      if (im) { const k = 150 / im.height, w = im.width * k, hh = im.height * k; c.translate(W / 2, 28 + hh / 2 + Math.sin(g.now * 1.8) * 3); c.scale(Math.cos(g.now * 1.3), 1); c.drawImage(im, -w / 2, -hh / 2, w, hh); c.setTransform(1, 0, 0, 1, 0, 0); }
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(40, 214, W - 80, 1);
      c.font = '13px PCPixel, monospace'; c.fillStyle = '#d8d2c4'; c.textAlign = 'center';
      const words = tip.split(' '), lines = []; let l = ''; words.forEach(wd => { const tl = l ? l + ' ' + wd : wd; if (c.measureText(tl).width > W - 110 && l) { lines.push(l); l = wd; } else l = tl; }); lines.push(l);
      lines.forEach((ln, i) => c.fillText(ln, W / 2, 232 + i * 13));
      c.textAlign = 'right'; c.fillStyle = '#9a947f'; c.fillText(title, W - 18, 22);
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(W - 118, 28, 100, 3); c.fillStyle = '#cfc6a8'; c.fillRect(W - 118, 28, Math.round(100 * ease(t)), 3);
      c.restore();
    };
    await g.fade(0, 400); await g.wait(D * 1000); await g.fade(1, 400);
    g.overFx = null; e.visible = true; e.spr = 'genie.tada'; e.keep = true; e.float = 6; await g.fade(0, 450); await g.wait(600); e.keep = false;
  },
  /* 6. le portail d'Oblivion : un portail de feu s'ouvre et l'éjecte, roussi, la barbe fumante (il le reste jusqu'au départ) */
  async portal(g, { e, x, y, s, side, ent, kill, puffs }) {
    const px = Math.max(30, Math.min(W - 30, x + side * 60)), P = ent('genie.portal', { x: px, y: y + 4, scale: 0.01, z: -3 });
    g.sfx('rumble'); g.shake(500, 2);
    await tw(g, 700, t => { P.scale = s * ease(t); P.rot = Math.sin(t * 20) * 0.04; });
    e.visible = true; e.spr = 'genie.scorch'; e.keep = true; e.float = 6; g.sfx('whoosh');
    await tw(g, 550, t => { e.x = px + (x - px) * t; e.y = y - Math.sin(t * Math.PI) * 30; e.rot = -side * t * TAU; });
    e.rot = 0; e.x = x; e.y = y; g.sfx('farcrash'); g.shake(300, 3); puffs(x, y - 30, 6, 18, 600);
    await tw(g, 500, t => { P.scale = s * (1 - t); }); kill(P);
  },
  /* 7. le dragon : un dragon traverse le ciel et le lâche ; il s'écrase à plat ventre, puis se relève avec dignité */
  async dragon(g, { e, x, y, s, side, ent, kill, puffs }) {
    const dirR = side < 0, x0 = dirR ? -60 : W + 60, x1 = dirR ? W + 60 : -60, D = ent('dragon.up', { x: x0, y: 70, scale: 0.9, z: 200, flip: dirR });
    const FR = ['dragon.up', 'dragon.mid1', 'dragon.down', 'dragon.mid2']; let dropped = false, gy0 = 0; g.sfx('screech');
    await tw(g, 2600, t => {
      D.x = x0 + (x1 - x0) * t; D.y = 70 + Math.sin(t * 7) * 5; D.spr = FR[Math.floor(g.now * 8) % 4];
      if (!dropped && (dirR ? D.x >= x : D.x <= x)) { dropped = true; gy0 = D.y - 20; e.visible = true; e.x = x; e.y = gy0; e.t0 = g.now; }
      if (dropped && e.y < y) { const ft = g.now - e.t0; e.y = Math.min(y, gy0 + 260 * ft * ft); e.rot = ft * 5; if (e.y >= y) { e.rot = 0; e.spr = 'genie.flat'; e.keep = true; g.sfx('crash'); g.shake(500, 4); puffs(x, y - 4, 8, 26, 700); } }
    });
    kill(D); if (!e.keep) { e.y = y; e.rot = 0; e.spr = 'genie.flat'; e.keep = true; }
    await g.wait(1100); e.spr = 'genie'; e.keep = false; g.sfx('whoosh');
  },
  /* 8. le cri : « FUS RO DAH ! » hors champ, il entre en tournoyant et s'arrête pile devant le héros, un peu étourdi */
  async fus(g, { e, x, y, side }) {
    g.cinePos = { ...(g.cinePos || {}), shout: [side > 0 ? W - 60 : 60, 60] };
    const said = g.say('shout', '=FUS RO DAH !'); g.sfx('shout'); g.shake(900, 4); await g.wait(500);
    const x0 = side > 0 ? W + 50 : -50; e.visible = true; e.float = 6; e.x = x0; e.y = y - 20;
    await tw(g, 900, t => { const q = ease(t); e.x = x0 + (x - x0) * q; e.y = y - 20 * (1 - q); e.rot = -side * q * 6 * TAU; });
    e.rot = 0; await said; g.sfx('squeak');
    await tw(g, 700, t => { e.rot = Math.sin(t * 22) * 0.18 * (1 - t); }); e.rot = 0;
  }
};
