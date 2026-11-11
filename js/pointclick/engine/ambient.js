/* Décor vivant : zones du décor animées (eau, roue, herbes), respiration des animaux, fumée, oiseaux, dragon qui vole, lueurs.
   Chaque scène déclare `ambient: [...]`. Tout est dessiné par-dessus le décor, avant les personnages. */
import { hitPoly } from './walk.js';

const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const bbox = p => { const xs = p.map(q => q[0]), ys = p.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const clipPoly = (c, p) => { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); };

const KINDS = {
  /* rivière : chaque ligne du décor glisse un peu de côté (ondulation) + éclats de lumière */
  water(o) {
    const poly = o.poly, [x0, y0, x1, y1] = bbox(poly), w = x1 - x0 + 4, amp = o.amp ?? 1.3, sp = o.speed ?? 2.2, R = rnd(o.seed || 3);
    const glints = Array.from({ length: o.glints ?? 14 }, () => ({ x: x0 + R() * (x1 - x0), y: y0 + R() * (y1 - y0), p: R() * 6.28, s: 1.5 + R() * 2 })).filter(g => hitPoly(g.x, g.y, poly));
    return {
      draw(g, c, t) {
        c.save(); clipPoly(c, poly);
        for (let y = Math.floor(y0); y < y1; y++) {
          const off = Math.round(Math.sin(t * sp + y * 0.62) * amp * (0.55 + 0.45 * Math.sin(y * 0.17 + t * 0.4)) + ((t * (o.flow ?? 0)) % 1));
          if (off) c.drawImage(g.bg, x0, y, w, 1, x0 + off, y, w, 1);
        }
        c.restore();
        glints.forEach(q => { const v = Math.sin(t * q.s + q.p); if (v > 0.86) { c.fillStyle = v > 0.95 ? 'rgba(255,248,214,.95)' : 'rgba(255,236,170,.7)'; c.fillRect(Math.round(q.x), Math.round(q.y), v > 0.95 ? 2 : 1, 1); } });
      }
    };
  },
  /* roue de moulin : un disque du décor qui tourne */
  wheel(o) {
    const { cx, cy, r } = o, sp = o.speed ?? 0.9;
    return { draw(g, c, t) { c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.clip(); c.translate(cx, cy); c.rotate(t * sp); c.drawImage(g.bg, cx - r, cy - r, 2 * r, 2 * r, -r, -r, 2 * r, 2 * r); c.restore(); } };
  },
  /* herbes, fleurs, roseaux : le haut de la zone se balance plus que le bas */
  sway(o) {
    const [x0, y0, x1, y1] = o.rect, amp = o.amp ?? 1.6, sp = o.speed ?? 1.5;
    return { draw(g, c, t) { for (let y = y0; y < y1; y++) { const k = (y1 - y) / (y1 - y0), off = Math.round(Math.sin(t * sp + y * 0.11 + (o.phase || 0)) * amp * k); if (off) c.drawImage(g.bg, x0, y, x1 - x0, 1, x0 + off, y, x1 - x0, 1); } } };
  },
  /* animal qui respire / broute : la zone s'étire un peu depuis ses pieds */
  bob(o) {
    const [x0, y0, x1, y1] = o.rect, amp = o.amp ?? 0.035, sp = o.speed ?? 1.4;
    return { draw(g, c, t) { const k = 1 + amp * (0.5 + 0.5 * Math.sin(t * sp + (o.phase || 0))), h = (y1 - y0) * k; c.drawImage(g.bg, x0, y0, x1 - x0, y1 - y0, x0, Math.round(y1 - h), x1 - x0, Math.round(h)); } };
  },
  /* fumée de cheminée */
  smoke(o) {
    const n = o.n ?? 9;
    return { draw(g, c, t) { for (let i = 0; i < n; i++) { const ph = (t * (o.speed ?? 0.3) + i / n) % 1, x = o.x + Math.sin(ph * 5 + i) * 2 + ph * (o.wind ?? 10), y = o.y - ph * (o.h ?? 28), r = 1.2 + ph * 3.2; c.fillStyle = `rgba(236,230,220,${(0.5 * (1 - ph)).toFixed(2)})`; c.fillRect(Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2)); } } };
  },
  /* lueur vacillante (fenêtre, lanterne, forge) */
  glow(o) {
    return { draw(g, c, t) { const f = 0.75 + 0.25 * Math.sin(t * 7 + (o.phase || 0)) * Math.sin(t * 3.3); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 3; k >= 1; k--) { c.fillStyle = `rgba(255,${150 + k * 20},70,${(0.05 * f * (4 - k)).toFixed(3)})`; c.beginPath(); c.arc(o.x, o.y, o.r * k / 3, 0, 6.2832); c.fill(); } c.restore(); } };
  },
  /* oiseaux : petits « v » qui battent des ailes et traversent le ciel */
  birds(o) {
    const n = o.n ?? 4, R = rnd(o.seed || 5), bs = Array.from({ length: n }, (_, i) => ({ y: (o.y0 ?? 18) + R() * ((o.y1 ?? 70) - (o.y0 ?? 18)), sp: (o.speed ?? 14) * (0.8 + R() * 0.5), off: R() * 600, ph: R() * 6, dir: o.dir ?? (R() > 0.5 ? 1 : -1) }));
    return {
      draw(g, c, t) {
        bs.forEach(b => {
          const span = 480 + 80, x = ((t * b.sp + b.off) % span) - 40, X = b.dir > 0 ? x : 480 - x, Y = Math.round(b.y + Math.sin(t * 0.8 + b.ph) * 4), up = Math.sin(t * 9 + b.ph) > 0;
          c.fillStyle = '#2a1c1c'; const px = Math.round(X);
          if (up) { c.fillRect(px - 3, Y - 2, 2, 1); c.fillRect(px - 1, Y - 1, 2, 1); c.fillRect(px + 1, Y - 1, 2, 1); c.fillRect(px + 3, Y - 2, 2, 1); }
          else { c.fillRect(px - 3, Y, 2, 1); c.fillRect(px - 1, Y - 1, 2, 1); c.fillRect(px + 1, Y - 1, 2, 1); c.fillRect(px + 3, Y, 2, 1); }
        });
      }
    };
  },
  /* dragon qui traverse le ciel, ailes battantes, de façon répétée ; cliquable */
  dragon(o) {
    const period = o.period ?? 34, y0 = o.y ?? 26, id = o.id || 'dragon';
    let pos = null;
    return {
      id,
      hit(x, y) { return !!pos && x >= pos[0] - pos[2] / 2 && x <= pos[0] + pos[2] / 2 && y >= pos[1] - pos[3] && y <= pos[1]; },
      draw(g, c, t) {
        const tt = t + (o.offset ?? 6), cyc = (tt % period) / period, travel = o.travel ?? 0.7;
        if (cyc > travel) { pos = null; return; }
        const p = cyc / travel, dirL = (o.dir ?? -1) < 0, flap = Math.floor(tt * 2.4) % 2 === 0, im = g.spr(flap ? 'dragon.up' : 'dragon.down'); if (!im) return;
        const s = o.scale ?? 1, w = im.width * s, h = im.height * s, x = dirL ? 480 + w / 2 - p * (480 + w) : -w / 2 + p * (480 + w);
        const y = y0 + h / 2 + Math.sin(tt * 0.9) * 7 + (flap ? 0 : 2) + p * (o.drop ?? 14);
        pos = [x, y + h / 2, w, h];
        c.save(); c.translate(Math.round(x), Math.round(y)); if (!dirL) c.scale(-1, 1); c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); c.restore();
      }
    };
  }
};

export function makeAmbient(list) { return (list || []).map(o => KINDS[o.type](o)).filter(Boolean); }
