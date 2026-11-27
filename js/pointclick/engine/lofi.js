/* Voix de la saison 1 « façon années 90 » : rendu d'une carte son 8 bits à 11 kHz, calculé en temps réel à la lecture
   (aucun fichier réenregistré). Chaîne : coupe des graves -> échantillonnage bloqué à ~11 kHz et quantification 8 bits
   (crénelage et grain numériques) -> coupe des aigus vers 4,5 kHz (son étouffé) -> légère saturation. */
let ctx = null, ready = null;
const CRUSH = `class Crush extends AudioWorkletProcessor {
  constructor(){ super(); this.h = 0; this.v = 0; this.step = sampleRate / 11025; }
  process(inp, out){ const i = inp[0], o = out[0]; if (!i || !i[0]) return true; const a = i[0];
    for (let n = 0; n < a.length; n++) { this.h += 1; if (this.h >= this.step) { this.h -= this.step; this.v = Math.round(a[n] * 127) / 127; }
      for (let c = 0; c < o.length; c++) o[c][n] = this.v; }
    return true; } }
registerProcessor('pc-crush', Crush);`;
function ensure() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    ready = ctx.audioWorklet ? ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([CRUSH], { type: 'application/javascript' }))).then(() => true, () => false) : Promise.resolve(false);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
const sat = (() => { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); } return c; })();
/* branche l'élément audio sur la chaîne « années 90 » ; vol = volume des voix. Sans Web Audio : lecture normale. */
export function lofi(a, vol) {
  const c = ensure(); if (!c) return false;
  try {
    const src = c.createMediaElementSource(a), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), lp2 = c.createBiquadFilter(), ws = c.createWaveShaper(), g = c.createGain();
    hp.type = 'highpass'; hp.frequency.value = 280; lp.type = 'lowpass'; lp.frequency.value = 4600; lp.Q.value = 0.9; lp2.type = 'lowpass'; lp2.frequency.value = 5200;
    ws.curve = sat; g.gain.value = vol; a.volume = 1;
    src.connect(hp);
    const tail = node => { node.connect(lp); lp.connect(lp2); lp2.connect(ws); ws.connect(g); g.connect(c.destination); };
    ready.then(ok => { if (ok) { const cr = new AudioWorkletNode(c, 'pc-crush'); hp.connect(cr); tail(cr); } else tail(hp); });
    return true;
  } catch { return false; }
}
