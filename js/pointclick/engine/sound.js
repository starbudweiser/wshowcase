/* Sons et musique du jeu, entièrement synthétisés (Web Audio) : aucun fichier audio, composition originale. Respecte le réglage de son du site. */
import { sfx } from '../../audio.js';

let ctx = null, master = null, musicTimer = null, musicOn = true;
const ensure = () => {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    master = ctx.createGain(); master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.value = sfx.vol * 0.9;
  return ctx;
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function tone({ f, to, t = 0, d = 0.15, type = 'square', g = 0.1, a = 0.004 }) {
  const c = ensure(); if (!c || !sfx.on) return;
  const o = c.createOscillator(), e = c.createGain(), t0 = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
  e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + a); e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(e); e.connect(master); o.start(t0); o.stop(t0 + d + 0.03);
}
function noise({ d = 0.2, f = 1200, q = 1, g = 0.1, t = 0, type = 'bandpass' }) {
  const c = ensure(); if (!c || !sfx.on) return;
  const n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const e = c.createGain(), t0 = c.currentTime + t; e.gain.setValueAtTime(g, t0); e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl).connect(e).connect(master); s.start(t0);
}

export const snd = {
  unlock: ensure,
  blip(who = 'hero') { const base = { hero: 330, merchant: 190, guard: 150, hen: 520, narr: 260 }[who] || 260; tone({ f: base * (0.9 + Math.random() * 0.3), d: 0.045, g: 0.05, type: 'square' }); },
  step() { noise({ d: 0.06, f: 500 + Math.random() * 300, q: 0.8, g: 0.07, type: 'lowpass' }); },
  click() { tone({ f: 900, to: 600, d: 0.04, g: 0.05, type: 'triangle' }); },
  pop() { tone({ f: 420, to: 1100, d: 0.12, g: 0.1, type: 'triangle' }); tone({ f: 1320, d: 0.16, t: 0.1, g: 0.06, type: 'sine' }); },
  clang() { [196, 311, 523, 831].forEach((f, i) => tone({ f, d: 0.7 - i * 0.1, g: 0.09 / (i + 1), type: 'triangle' })); noise({ d: 0.12, f: 3000, q: 4, g: 0.12, type: 'highpass' }); },
  whoosh() { noise({ d: 0.4, f: 700, q: 0.6, g: 0.1 }); tone({ f: 200, to: 900, d: 0.35, g: 0.04, type: 'sawtooth' }); },
  shout() { [110, 164, 220].forEach(f => tone({ f, to: f * 0.5, d: 1.1, g: 0.12, type: 'sawtooth' })); noise({ d: 0.9, f: 200, q: 0.5, g: 0.18, type: 'lowpass' }); },
  coin() { tone({ f: 1320, d: 0.08, g: 0.07 }); tone({ f: 1760, d: 0.22, t: 0.07, g: 0.07 }); },
  cluck() { tone({ f: 620, to: 380, d: 0.09, g: 0.06 }); tone({ f: 560, to: 340, d: 0.09, t: 0.12, g: 0.05 }); },
  jingle() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, d: 0.3, t: i * 0.11, g: 0.08, type: 'triangle' })); },
  /* musique : danse nordique originale, mode dorien en ré, flûte + bourdon, ~21 s en boucle */
  music(on) {
    musicOn = on; if (!on) { clearInterval(musicTimer); musicTimer = null; return; }
    if (musicTimer || !ensure()) return;
    const mel = [[0, 1], [2, 1], [3, 1], [5, 1], [7, 2], [5, 1], [3, 1], [2, 2], [0, 1], [-2, 1], [0, 2], [2, 1], [3, 1], [5, 3], [7, 1], [9, 1], [10, 2], [9, 1], [7, 1], [5, 2], [3, 1], [2, 1], [0, 3], [-5, 1]];
    const beat = 0.34; let i = 0, tnext = ensure().currentTime + 0.2;
    const sched = () => {
      const c = ensure(); if (!c || !sfx.on || !musicOn) return;
      while (tnext < c.currentTime + 0.6) {
        const [semi, len] = mel[i % mel.length], root = 62; /* ré4 */
        if (semi !== null) {
          const e = c.createOscillator(), g = c.createGain(); e.type = 'triangle'; e.frequency.value = mtof(root + semi + 12);
          g.gain.setValueAtTime(0.0001, tnext); g.gain.exponentialRampToValueAtTime(0.06, tnext + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, tnext + len * beat * 0.95);
          e.connect(g); g.connect(master); e.start(tnext); e.stop(tnext + len * beat);
        }
        if (i % 4 === 0) { const b = c.createOscillator(), bg = c.createGain(); b.type = 'sine'; b.frequency.value = mtof((i % 8 === 0 ? 38 : 45)); bg.gain.setValueAtTime(0.0001, tnext); bg.gain.exponentialRampToValueAtTime(0.07, tnext + 0.05); bg.gain.exponentialRampToValueAtTime(0.0001, tnext + beat * 3.6); b.connect(bg); bg.connect(master); b.start(tnext); b.stop(tnext + beat * 4); }
        tnext += len * beat; i++;
      }
    };
    musicTimer = setInterval(sched, 200); sched();
  },
  stop() { clearInterval(musicTimer); musicTimer = null; }
};
