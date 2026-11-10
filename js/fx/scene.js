/* Plein écran : chargement du moteur 3D, boucle de rendu adaptative, entrées souris et clavier, son synthétisé. */
import { sfx } from '../audio.js';
import { lang } from '../i18n.js';

/* ---------- son : vent, chœur grave qui change d'accord, rugissement, souffle, voix ---------- */
class Sound {
  constructor() {
    try { this.c = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.c = null; return; }
    const c = this.c; this.m = c.createGain(); this.m.gain.value = 0; this.m.gain.linearRampToValueAtTime(.9, c.currentTime + 3);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; this.m.connect(comp).connect(c.destination);
    const n = c.sampleRate * 3.2, b = c.createBuffer(2, n, c.sampleRate); for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.3); }
    this.v = c.createConvolver(); this.v.buffer = b; const vg = c.createGain(); vg.gain.value = .6; this.v.connect(vg).connect(this.m);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.nb = nb;
    const wind = c.createBufferSource(); wind.buffer = nb; wind.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7; bp.frequency.value = 380;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .09; lg.gain.value = 200; lfo.connect(lg).connect(bp.frequency); lfo.start();
    const wg = c.createGain(); wg.gain.value = .2; wind.connect(bp).connect(wg).connect(this.m); wg.connect(this.v); wind.start();
    /* chœur : cinq voix en octaves et quintes, accord changé toutes les 9 s (ré mineur, si bémol, fa, do) */
    this.voices = []; const gains = [.1, .08, .07, .055, .035];
    gains.forEach((g, i) => [-6, 7].forEach(dt => { const o = c.createOscillator(), og = c.createGain(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.detune.value = dt; lp.type = 'lowpass'; lp.frequency.value = 560;
      og.gain.value = 0; og.gain.linearRampToValueAtTime(g * .5, c.currentTime + 4 + i); const l2 = c.createOscillator(), l2g = c.createGain(); l2.frequency.value = .05 + i * .013; l2g.gain.value = g * .25; l2.connect(l2g).connect(og.gain); l2.start();
      o.connect(lp).connect(og).connect(this.m); og.connect(this.v); o.start(); this.voices.push({ o, i }); }));
    this.chords = [[73.4, 110, 146.8, 174.6, 220], [58.3, 87.3, 116.5, 146.8, 174.6], [87.3, 130.8, 174.6, 220, 261.6], [65.4, 98, 130.8, 164.8, 196]]; this.ci = 0; this.setChord();
    this.iv = setInterval(() => { this.ci = (this.ci + 1) % 4; this.setChord(); }, 9000);
  }
  setChord() { const c = this.c, ch = this.chords[this.ci]; this.voices.forEach(v => v.o.frequency.setTargetAtTime(ch[v.i], c.currentTime, 1.4)); }
  noise(dur, f0, f1, g, t = 0, type = 'lowpass') { const c = this.c, s = c.createBufferSource(); s.buffer = this.nb; const f = c.createBiquadFilter(); f.type = type; const t0 = c.currentTime + t; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const e = c.createGain(); e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + dur * .12); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); s.connect(f).connect(e).connect(this.m); e.connect(this.v); s.start(t0, 0, Math.min(dur, 1.9)); }
  tone(f0, f1, dur, g, type = 'sawtooth', t = 0, lpf = 900) { const c = this.c, o = c.createOscillator(), e = c.createGain(), lp = c.createBiquadFilter(), t0 = c.currentTime + t; o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    lp.type = 'lowpass'; lp.frequency.value = lpf; e.gain.setValueAtTime(.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + dur * .1); e.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(lp).connect(e).connect(this.m); e.connect(this.v); o.start(t0); o.stop(t0 + dur + .1); }
  roar() { if (!this.c) return; this.tone(92, 34, 2.8, .55, 'sawtooth', 0, 760); this.tone(138, 52, 2.5, .28, 'square', .05, 520); this.noise(2.4, 1500, 90, .55); this.tone(46, 26, 3, .7, 'sine'); this.tone(184, 70, 2, .16, 'sawtooth', .1, 1200); }
  breath() { if (!this.c) return; this.noise(1.9, 500, 1400, .5); this.noise(1.9, 700, 300, .45, 1.8); this.noise(1.9, 400, 200, .35, 3.6); for (let i = 0; i < 26; i++) this.noise(.06, 3500 + Math.random() * 3000, 2000, .1, 1 + Math.random() * 6, 'highpass'); }
  shout(i) { if (!this.c) return; const base = [98, 110, 123.5][i % 3]; this.tone(base * .5, base * .25, 1.9, .75, 'sine'); this.noise(1.7, 1000, 60, .55 + i * .1);
    [1, 1.5, 2].forEach((m, k) => this.tone(base * m, base * m * .94, 1.6, .17, 'sawtooth', k * .02, 1200 + i * 300)); this.noise(.9, 4200, 300, .2, 0, 'highpass'); this.tone(60, 24, 1.4, .8, 'sine'); }
  close() { if (!this.c) return; clearInterval(this.iv); const c = this.c; this.m.gain.cancelScheduledValues(c.currentTime); this.m.gain.setValueAtTime(this.m.gain.value, c.currentTime); this.m.gain.linearRampToValueAtTime(0, c.currentTime + 1.3); setTimeout(() => c.close(), 1500); }
}

let active = null;
export function enter(x = innerWidth / 2, y = innerHeight / 2) {
  if (active) return active;
  const T = (fr, en) => (lang() === 'fr' ? fr : en);
  const css = document.createElement('style'); css.textContent = `
.fx9{position:fixed;inset:0;z-index:5000;background:#000;overflow:hidden;cursor:crosshair;clip-path:circle(0px at var(--x) var(--y));animation:fx9in 1.4s cubic-bezier(.6,0,.2,1) forwards;font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif;color:#fff}
@keyframes fx9in{to{clip-path:circle(160vmax at var(--x) var(--y))}}
.fx9 .ld{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px;border-radius:50%;border:2px solid rgba(255,255,255,.12);border-top-color:#fff;animation:fx9sp 1s linear infinite;transition:opacity .8s}.fx9 .ld.off{opacity:0}
@keyframes fx9sp{to{transform:rotate(360deg)}}
.fx9 .bar{position:absolute;left:0;right:0;height:0;background:#000;z-index:3;animation:fx9bar 2.4s .6s cubic-bezier(.3,.8,.2,1) forwards}.fx9 .bar.t{top:0}.fx9 .bar.b{bottom:0}
@keyframes fx9bar{to{height:7.5vh}}
.fx9 .word{position:absolute;left:0;right:0;bottom:17vh;z-index:4;text-align:center;font-size:clamp(34px,7vw,112px);font-weight:800;letter-spacing:.28em;color:#eef7ff;opacity:0;text-shadow:0 0 30px #6fd3ff,0 0 90px #2a7bff;pointer-events:none;padding-left:.28em}
.fx9 .word.go{animation:fx9word 1.9s ease-out}
@keyframes fx9word{0%{opacity:0;transform:scale(.7);filter:blur(14px)}12%{opacity:1;transform:scale(1);filter:blur(0)}70%{opacity:1}100%{opacity:0;transform:scale(1.25);filter:blur(6px)}}
.fx9 .hint{position:absolute;left:0;right:0;bottom:10.4vh;z-index:4;text-align:center;font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:rgba(255,235,215,.75);opacity:0;animation:fx9hint 2s 7s ease forwards;pointer-events:none}
@keyframes fx9hint{to{opacity:1}}
.fx9 .x{position:absolute;right:22px;top:calc(7.5vh + 16px);z-index:5;border:0;background:rgba(255,255,255,.14);backdrop-filter:blur(14px);color:#fff;font-size:13px;border-radius:999px;padding:8px 16px;cursor:pointer;opacity:0;transition:opacity .4s}
.fx9:hover .x{opacity:.8}.fx9 .x:hover{opacity:1;background:rgba(255,255,255,.24)}
.fx9.out{animation:none;clip-path:circle(160vmax at var(--x) var(--y));transition:opacity 1.1s;opacity:0}`;
  const el = (c, tag = 'div') => { const d = document.createElement(tag); d.className = c; return d; };
  const root = el('fx9'); root.style.setProperty('--x', x + 'px'); root.style.setProperty('--y', y + 'px');
  const stage = el('stage'); stage.style.cssText = 'position:absolute;inset:0';
  const ld = el('ld'), word = el('word'), hint = el('hint'), bt = el('x', 'button'); hint.textContent = T('Cliquez · Espace', 'Click · Space'); bt.textContent = 'Esc ✕';
  root.append(css, stage, ld, el('bar t'), el('bar b'), word, hint, bt); document.body.append(root);
  let world = null, raf = 0, dead = false, count = 0, au = null;
  const key = e => { if (e.key === 'Escape') close(); else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); shout(); } };
  const move = e => world && world.setMouse((e.clientX / innerWidth - .5) * 2, -(e.clientY / innerHeight - .5) * 2);
  const size = () => world && world.resize(innerWidth, innerHeight);
  const shout = () => { if (!world) return; const i = count++ % 3; world.thuum(.6 + i * .35); au && au.shout(i); word.textContent = ['FUS', 'RO', 'DAH'][i]; word.classList.remove('go'); void word.offsetWidth; word.classList.add('go'); hint.style.animation = 'none'; hint.style.opacity = 0; };
  function close() { if (dead) return; dead = true; active = null; removeEventListener('keydown', key, true); removeEventListener('pointermove', move); removeEventListener('resize', size); cancelAnimationFrame(raf); root.classList.add('out'); au && au.close(); setTimeout(() => { world && world.dispose(); root.remove(); }, 1200); }
  root.addEventListener('pointerdown', e => { if (e.target === bt) return; shout(); });
  bt.onclick = close; addEventListener('keydown', key, true); addEventListener('pointermove', move); addEventListener('resize', size);
  active = { close };
  (async () => {
    try {
      await new Promise(r => setTimeout(r, 400));
      const { createWorld } = await import('./world.js'); if (dead) return;
      world = await createWorld(stage, { roar: () => au && au.roar(), breath: () => au && au.breath() }); if (dead) { world.dispose(); return; }
      au = sfx.on ? new Sound() : null; ld.classList.add('off');
      let last = performance.now(), acc = 0, fr = 0, pr = world.pr; const base = pr;
      const loop = now => {
        raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; acc += dt; fr++;
        if (fr % 45 === 0) { const avg = acc / 45; acc = 0; if (avg > .024 && pr > base * .45) { pr = Math.max(base * .45, pr * .86); world.setPR(pr); } else if (avg < .0125 && pr < base) { pr = Math.min(base, pr * 1.1); world.setPR(pr); } }
        world.step(dt); world.render();
      };
      window.__fx = world; raf = requestAnimationFrame(loop);
    } catch (e) { console.error(e); close(); }
  })();
  return active;
}
