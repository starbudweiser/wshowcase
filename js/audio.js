/* Sons d'interface synthétisés dans le navigateur : aucun fichier audio, aucun son tiers. */
import { store } from './util.js';
let ctx, master, verb, enabled = store.get('sound', true), vol = store.get('vol', 0.7);
const ensure = () => {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = ir(2.6);
    const g = ctx.createGain(); g.gain.value = 0.42; verb.connect(g).connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
function ir(sec) {
  const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  return b;
}
function tone({ f, to, t = 0, d = 0.2, type = 'sine', g = 0.2, a = 0.006, wet = 0, det = 0 }) {
  const c = ensure(); if (!c || !enabled) return;
  const o = c.createOscillator(), e = c.createGain(), t0 = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = det;
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
  e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + a); e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(e); e.connect(master); if (wet) { const w = c.createGain(); w.gain.value = wet; e.connect(w).connect(verb); }
  o.start(t0); o.stop(t0 + d + 0.05);
}
function swoosh({ d = 0.3, f0 = 400, f1 = 2400, g = 0.12, t = 0 }) {
  const c = ensure(); if (!c || !enabled) return;
  const n = c.sampleRate * d, b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  const t0 = c.currentTime + t; bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + d);
  const e = c.createGain(); e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + d * 0.4); e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(bp).connect(e).connect(master); s.start(t0);
}
export const sfx = {
  get on() { return enabled; },
  get vol() { return vol; },
  set(v) { enabled = !!v; store.set('sound', enabled); if (enabled) { ensure(); sfx.click(); } },
  setVol(v) { vol = v; store.set('vol', v); if (master) master.gain.value = v; },
  unlock: ensure,
  /* Accord de démarrage : triade de fa# majeur sur plusieurs octaves, attaque douce, longue réverbération (composition originale). */
  chime() {
    [[92.5, .26], [185, .2], [277.2, .17], [370, .17], [466.2, .12], [554.4, .1], [740, .07], [932.3, .04]].forEach(([f, g], i) => {
      tone({ f, d: 4.8, g, a: 0.05 + i * 0.012, type: i < 2 ? 'triangle' : 'sine', wet: .9, det: -4 });
      tone({ f: f * 1.0035, d: 4.4, g: g * .7, a: 0.07 + i * 0.012, type: 'sine', wet: .9, det: 5 });
    });
    swoosh({ d: 1.6, f0: 120, f1: 900, g: 0.05 });
  },
  click() { tone({ f: 1500, to: 900, d: 0.05, g: 0.07, type: 'triangle' }); },
  tick() { tone({ f: 2200, to: 1800, d: 0.025, g: 0.035, type: 'square' }); },
  open() { tone({ f: 520, to: 700, d: 0.16, g: 0.1, wet: .3 }); tone({ f: 780, to: 1040, d: 0.2, t: 0.07, g: 0.08, wet: .4 }); },
  close() { tone({ f: 640, to: 360, d: 0.14, g: 0.09 }); },
  min() { swoosh({ d: 0.32, f0: 2400, f1: 500, g: 0.09 }); },
  swap() { swoosh({ d: 0.42, f0: 300, f1: 3000, g: 0.12 }); },
  wall() { [880, 1175, 1568].forEach((f, i) => tone({ f, d: 0.7, t: i * 0.06, g: 0.07, wet: .7 })); },
  notif() { tone({ f: 1568, d: 0.9, g: 0.12, wet: .8 }); tone({ f: 2349, d: 0.7, t: 0.01, g: 0.05, wet: .8 }); },
  pop() { tone({ f: 420, to: 1100, d: 0.12, g: 0.12 }); [1760, 2349, 2794].forEach((f, i) => tone({ f, d: 0.35, t: .1 + i * .05, g: .04, wet: .6 })); },
  done() { [659, 880, 1319].forEach((f, i) => tone({ f, d: 0.5, t: i * 0.09, g: 0.08, wet: .6 })); },
  off() { [554, 370, 277, 185].forEach((f, i) => tone({ f, d: 1.6, t: i * 0.16, g: 0.09, wet: .9 })); }
};
