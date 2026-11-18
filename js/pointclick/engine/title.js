/* Écran titre « Le Seau de Rivebois » : tableau de nuit (assets/pointclick/title/bg.png) animé sur le canevas (neige, étoiles, aurore,
   fenêtres du village, dragon qui passe à l'envers), logo par langue qui tombe puis brille, menu HTML (souris, flèches + Entrée, Échap).
   Images : tools/intro_build.py (titre). */
import { snd } from './sound.js';

const W = 480, H = 270;
const R = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export class TitleArt {
  constructor(g) {
    this.g = g; this.t = 0; this.logoT = 0; this.ready = false;
    this.snow = Array.from({ length: 90 }, () => ({ x: R(0, W), y: R(0, H), v: R(9, 22), s: Math.random() < 0.25 ? 2 : 1, ph: R(0, 6) }));
    this.stars = Array.from({ length: 28 }, () => ({ x: R(4, W - 4), y: R(3, 58), ph: R(0, 6), f: R(0.6, 1.8) }));
    this.dragonAt = 6; this.dragon = null;
  }
  async load(lang) {
    const g = this.g; this.bg = await g.img('assets/pointclick/title/bg.png');
    await this.setLang(lang);
    if (this.bg) this.lights = this.findLights(this.bg);
    this.ready = true;
  }
  async setLang(lang) { this.logo = await this.g.img(`assets/pointclick/title/logo_${lang === 'fr' ? 'fr' : 'en'}.png`); this.shineCv = null; }
  /* fenêtres éclairées du village : pixels orangés de la moitié basse, qui scintilleront doucement */
  findLights(im) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), o = x.createImageData(c.width, c.height);
    let n = 0;
    for (let y = Math.floor(c.height * 0.45); y < c.height * 0.85; y++) for (let i = 0; i < c.width; i++) {
      const k = (y * c.width + i) * 4, r = d.data[k], gg = d.data[k + 1], b = d.data[k + 2];
      if (r > 190 && gg > 120 && gg < 215 && b < 110 && r - b > 110) { o.data[k] = 255; o.data[k + 1] = 196; o.data[k + 2] = 90; o.data[k + 3] = 255; n++; }
    }
    if (n < 4 || n > 1500) return null;
    x.clearRect(0, 0, c.width, c.height); x.putImageData(o, 0, 0); return c;
  }
  replayLogo() { this.logoT = 0; }
  update(dt) {
    this.t += dt; this.logoT += dt;
    for (const f of this.snow) { f.y += f.v * dt; f.x += Math.sin(this.t * 0.8 + f.ph) * 6 * dt + 3 * dt; if (f.y > H) { f.y = -2; f.x = R(-10, W); } if (f.x > W + 2) f.x = -2; }
    if (!this.dragon && this.t > this.dragonAt) { const l = Math.random() < 0.5; this.dragon = { t: 0, dir: l ? 1 : -1, y: R(26, 70), k: R(0.32, 0.42), sp: ['dragon', 'ember', 'frost', 'moss'][Math.floor(R(0, 4))] }; }
    if (this.dragon) { this.dragon.t += dt; if (this.dragon.t > 9) { this.dragon = null; this.dragonAt = this.t + R(10, 18); } }
  }
  draw(c) {
    const t = this.t;
    if (!this.bg) { c.fillStyle = '#0c1220'; c.fillRect(0, 0, W, H); } else c.drawImage(this.bg, 0, 0);
    /* aurore : voiles verts qui ondulent (mélange additif léger) */
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = ((i * 83 + t * (6 + i)) % (W + 120)) - 60, a = 0.05 + 0.04 * Math.sin(t * 0.7 + i * 1.7);
      const gr = c.createLinearGradient(0, 0, 0, 70); gr.addColorStop(0, `rgba(80,255,170,0)`); gr.addColorStop(0.45, `rgba(80,255,170,${a})`); gr.addColorStop(1, 'rgba(80,255,170,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= 70; y += 10) c.lineTo(x + Math.sin(y * 0.06 + t * 0.9 + i) * 10, y); for (let y = 70; y >= 0; y -= 10) c.lineTo(x + 26 + Math.sin(y * 0.06 + t * 0.9 + i + 0.6) * 10, y); c.closePath(); c.fill();
    }
    c.restore();
    /* étoiles qui scintillent */
    for (const s of this.stars) { const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * s.f + s.ph)); c.fillStyle = `rgba(255,255,240,${a})`; c.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    /* fenêtres du village */
    if (this.lights) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 + 0.14 * Math.sin(t * 2.3) * Math.sin(t * 0.7 + 1); c.drawImage(this.lights, 0, 0); c.restore(); }
    /* un dragon traverse le ciel… à l'envers (on ne corrige pas les bugs, on les célèbre) */
    const d = this.dragon;
    if (d) {
      const nm = d.sp === 'dragon' ? 'dragon' : d.sp, frames = ['up', 'mid1', 'down', 'mid2'].map(q => this.g.spr(nm + '.' + q)), im = frames[Math.floor(t * 8) % 4];
      if (im) { const p = d.t / 9, x = d.dir > 0 ? -40 + p * (W + 80) : W + 40 - p * (W + 80), y = d.y + Math.sin(p * 9) * 5; c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(d.dir > 0 ? -d.k : d.k, -d.k); c.drawImage(im, -im.width / 2, -im.height / 2); c.restore(); }
    }
    /* neige */
    c.fillStyle = 'rgba(240,246,255,0.85)'; for (const f of this.snow) c.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
    this.drawLogo(c);
  }
  /* logo : chute avec rebond à l'arrivée, puis un reflet passe toutes les 6 s */
  drawLogo(c) {
    const L = this.logo; if (!L) return;
    const T = this.logoT, fall = clamp(T / 0.9, 0, 1), b = 1 - fall, bounce = fall < 1 ? -Math.abs(Math.cos(fall * Math.PI * 2.5)) * b * b * 70 : 0;
    const x = Math.round(W / 2 - L.width / 2), y = Math.round(40 - L.height / 2 + 34 + bounce);
    c.drawImage(L, x, y);
    const p = ((T - 1.2) % 6) / 1.1; if (T < 1.2 || p > 1) return;
    if (!this.shineCv || this.shineCv.width !== L.width) { this.shineCv = document.createElement('canvas'); this.shineCv.width = L.width; this.shineCv.height = L.height; }
    const s = this.shineCv.getContext('2d'); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, L.width, L.height); s.drawImage(L, 0, 0);
    s.globalCompositeOperation = 'source-atop'; const sx = -60 + p * (L.width + 120), gr = s.createLinearGradient(sx - 30, 0, sx + 30, L.height);
    gr.addColorStop(0, 'rgba(255,255,230,0)'); gr.addColorStop(0.5, 'rgba(255,255,230,0.75)'); gr.addColorStop(1, 'rgba(255,255,230,0)'); s.fillStyle = gr; s.fillRect(0, 0, L.width, L.height);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(this.shineCv, x, y); c.restore();
  }
}

/* menu de l'écran titre : liste verticale ; o = { inGame, hasSave, chapters: [{id,label,go}], items callbacks } */
export function buildMenu(g, o) {
  const T = g.T, root = el('div', 'pc-title pc-tmenu');
  const box = el('div', 'pc-tm'), foot = el('div', 'pc-tfoot');
  root.append(box, foot);
  let list = [], sel = 0, page = o.page || 'main';
  const render = () => {
    box.innerHTML = ''; list = [];
    const add = (label, fn, cls) => { const b = el('button', 'pc-ti' + (cls ? ' ' + cls : ''), label); b.onclick = () => { snd.unlock(); snd.click(); fn(b); }; b.onmouseenter = () => focus(list.indexOf(b)); box.append(b); list.push(b); return b; };
    if (page === 'main') {
      if (o.inGame) add(T('ui.resume'), o.resume);
      if (!o.inGame && o.hasSave) add(T('ui.continue'), o.cont);
      add(T('ui.new'), o.newGame);
      if (o.chapters.length > 1) add(T('ui.chapters'), () => { page = 'chap'; sel = 0; render(); });
      add(T('ui.options'), () => { page = 'opt'; sel = 0; render(); });
    } else if (page === 'opt') {
      add(T('ui.fullscreen'), o.fullscreen);
      if (o.filter) add(T('ui.filter') + ' : ' + T('ui.filter.' + o.filter()), b => { o.nextFilter(); b.textContent = T('ui.filter') + ' : ' + T('ui.filter.' + o.filter()); });
      const tog = (k, get, set) => add(T(get() ? k + 'On' : k + 'Off'), b => { set(!get()); b.textContent = T(get() ? k + 'On' : k + 'Off'); });
      tog('ui.music', o.music, o.setMusic); tog('ui.voice', o.voice, o.setVoice); tog('ui.amb', o.amb, o.setAmb);
      add(g.lang === 'fr' ? 'English' : 'Français', o.toggleLang);
      add(T('ui.back'), () => { page = 'main'; sel = 0; render(); }, 'back');
    } else if (page === 'chap') {
      o.chapters.forEach(c => add(c.label, c.go));
      add(T('ui.back'), () => { page = 'main'; sel = 0; render(); }, 'back');
    }
    focus(Math.min(sel, list.length - 1));
    foot.innerHTML = ''; foot.append(el('span', 'pc-tach' + (o.achDone ? ' done' : ''), o.ach), el('span', '', T('ui.credits')));
  };
  const focus = i => { sel = Math.max(0, i); list.forEach((b, k) => b.classList.toggle('on', k === sel)); };
  root.key = e => {
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); focus((sel + (k === 'ArrowDown' ? 1 : list.length - 1)) % list.length); snd.click(); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); if (list[sel]) list[sel].click(); }
    else if (k === 'Escape') { if (page !== 'main') { page = 'main'; sel = 0; render(); } else if (o.inGame) o.resume(); }
  };
  root.rerender = render;
  render();
  return root;
}
