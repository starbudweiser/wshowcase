/* Moteur du jeu d'aventure : scènes, déplacements, verbes, inventaire, dialogues, scripts, sauvegarde.
   Canvas 2D 480×270 (16:9) mis à l'échelle ; l'interface se pose PAR-DESSUS la scène, sans bandeau : pièce des verbes (appui long,
   dessinée en pixel art sur un canvas d'interface à la même résolution), besace et tiroir d'inventaire, étiquette sous le curseur,
   bulles en HTML. Clic court = aller, clic maintenu = pièce des verbes, clic droit = besace (ou reposer l'objet tenu). */
import { Scaler } from './scaler.js';
import { COIN, drawCoin, coinSector, drawCharge, crossCursor, itemCursor, bagCanvas } from './coin.js';
import { updateWinks, drawWinks } from './winks.js';
import { updateGlass, drawGlass } from './glass.js';
import { buildSky, drawSky, startNight, updateNight, drawNight, wakeNight, IDLE_NIGHT } from './night.js';
import { lang } from '../../i18n.js';
import { Walk, hitPoly } from './walk.js';
import { snd } from './sound.js';
import { store } from '../../util.js';
import { light, getAch, BLINDS, reach, reached, award } from './ach.js';
import { CHAPTERS } from '../scenes/index.js';
import { loadLang, makeT } from './lang.js';
import { hasSave, loadSave, writeSave, clearSave } from './save.js';
import { makeAmbient } from './ambient.js';
import { playIntro, preloadIntro } from './intro.js';
import { TitleArt, buildMenu } from './title.js';
import { rubLamp } from './genie.js';
import { updateFx2, drawFx2, drawFxBack, twinkle, shout } from './fx2.js';
import * as SH from '../data/sheets.js';
import * as S2 from '../data/sheets_s2.js';
import { CHAPTERS2 } from '../scenes/index.js';
import { ENVERS } from '../lang/s2_meta.js';
const { SPR, ITEMS } = SH, ANIM = SH.ANIM || {}, HERO = SH.HERO || null, SLEEP = SH.SLEEP || {}, FACE_L = SH.FACE_L || new Set();
Object.assign(ITEMS, S2.ITEMS);

export const W = 480, H = 270;
const HOLD_S = 0.32, CHARGE_S = 0.09, DRAWER_H = 46;   // appui long avant la pièce, délai avant l'anneau de chargement, hauteur du tiroir
const COLORS = { hero: '#ffe08a', rider: '#ffe08a', merchant: '#ffa45c', guard: '#9ad0ff', horse: '#f0c890', hen: '#ffffff', blind_pot: '#e6e0a0', blind_sack: '#e6e0a0', blind_hat: '#e6e0a0', giant: '#ffb070', nazim: '#c9a8ff', farmer: '#9fe08a', pmerchant: '#ffa45c', pguard: '#9ad0ff', pgiant: '#ffb070', phorseman: '#ff9a5c', gguard: '#9ad0ff', horseman: '#ff9a5c', follower: '#ffb0c8', butterfly: '#9ad8ff', blind_cabbage: '#e6e0a0', blind_helmet: '#e6e0a0', blind_basket: '#e6e0a0', blind_boot: '#e6e0a0', blind_mushroom: '#e6e0a0', blind_banner: '#e6e0a0', blind_partyhat: '#e6e0a0', narr: '#cfe0ff', genie: '#8fd3ff' };
Object.assign(COLORS, S2.COLORS);
const ENV = new Set(ENVERS);   /* répliques dites à l'envers (petit homme en rouge) : toujours sous-titrées, animations à l'envers */
/* densité d'une image : 2 pour la saison 2 (960 × 540), 1 sinon ; tailles en unités logiques (480 × 270) */
const dn = im => (im && im.dens) || 1, iw = im => im.width / dn(im), ih = im => im.height / dn(im);
/* saison 2 ouverte : fin de la saison 1 atteinte, ou adresse avec ?s2 (essais en local) */
const s2Open = () => store.get('pc.s1done', false) || /[?&]s2\b/.test(location.search), s2All = () => /[?&]s2\b/.test(location.search);
class Cancel {}
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const AMB = { rue: ['village', 0.5], mill: ['mill', 0.55], meadow: ['camp', 0.5], market: ['market', 0.55], gate: ['gate', 0.45], house: ['house', 0.55], ford: ['swamp', 0.5], wood: ['forest', 0.5], hall: ['hall', 0.45], party: ['party', 0.55] };
export class Game {
  constructor(root) {
    this.root = root; this.imgs = {}; this.st = null; this.scene = null; this.ents = []; this.hot = []; this.waiters = [];
    this.sel = null; this.hover = null; this.hoverItem = null; this.coin = null; this.press = null; this.invOpen = false; this.tok = 0; this.runTok = 0; this.locked = false; this.now = 0; this.fx = {};
    this.wk = null; this.night = null; this.sky = null; this.lastMove = 0; this._mx = null; this._my = null; this.nq = []; this.narr = null; this.lastNarr = -99; this.lastAct = 0; this.idleN = 0; this.sayAu = null; this.voiceOn = store.get('pc.voice', true); this.s2retro = store.get('pc.s2retro', false);
    this.bubbles = []; this.barks = []; this.choice = null; this.skip = false; this.alive = true; this.started = false; this.nextBlip = 0; this.mouse = [0, 0];
  }

  /* ───────── démarrage ───────── */
  async init() {
    await this.setLang(lang(), true);
    this.build();
    await Promise.all(Object.values(SPR).map(n => this.img(`assets/pointclick/spr/${n}.png`)));
    try { this.animIdx = await (await fetch('assets/pointclick/anim/index.json')).json(); } catch { this.animIdx = {}; }
    try { this.sleepIdx = await (await fetch('assets/pointclick/sleep/index.json')).json(); } catch { this.sleepIdx = {}; }
    try { this.s2anim = await (await fetch('assets/pointclick/s2/anim.json')).json(); } catch { this.s2anim = {}; } this.s2ready = {};
    this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.root); this.fit();
    this.last = performance.now(); const tick = t => { if (!this.alive) return; this.raf = requestAnimationFrame(tick); const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; try { this.update(dt); this.draw(); } catch (e) { console.error(e); } };
    this.raf = requestAnimationFrame(tick);
    this.showTitle();
  }
  destroy() { document.removeEventListener('pointermove', this._mv); document.removeEventListener('pointerdown', this._pd); document.removeEventListener('keydown', this._pd); this.alive = false; cancelAnimationFrame(this.raf); this.ro && this.ro.disconnect(); snd.stop(); }
  async setLang(l, first) {
    this.dict = await loadLang(l); this.T = makeT(this.dict); this.lang = l;
    if (this.titleArt) this.titleArt.setLang(l);
    if (!first) { this.renderPanel(); this.renderLine(); if (this.titleEl) { const ig = this.titleIn; this.showTitle(ig, 'opt'); } }
  }
  img(src) { return this.imgs[src] || (this.imgs[src] = new Promise(res => { const i = new Image(); i.onload = () => { if (src.includes('/s2/') && !src.includes('/s2/90/')) i.dens = 2; this.imgs[src] = i; res(i); }; i.onerror = () => res(null); i.src = src; }).then(i => (this.imgs[src] = i))); }
  /* image d'animation d'un personnage selon son état : repos, parole, déplacement */
  /* image du héros : orientation (profil, face, dos) x état (marche, parole, repos) ; les images manquantes sont ignorées */
  heroFrame(h, moving, s) {
    if (this.scene && this.scene.hd) return S2.heroFrame2(this, h, moving, s);
    if (!HERO) return h.front || h.talk ? 'hero.front' : 'hero.side';
    const ok = n => n && this.spr(n), cyc = (arr, i) => { const f = arr.filter(ok); return f.length ? f[((i % f.length) + f.length) % f.length] : null; };
    const view = h.back ? 'b' : h.front ? 'f' : 's', t = this.now;
    if (moving && h.quarter) { const q = cyc(h.quarter === 'qf' ? HERO.walkQF : HERO.walkQB, Math.floor(h.walkD / (7.5 * s))); if (q) return q; }
    if (moving) return (view === 's' ? cyc(HERO.walk, Math.floor(h.walkD / (8 * s))) || cyc(HERO.walkW8 || [], Math.floor(h.walkD / (5.2 * s))) || cyc(HERO.walkOld, Math.floor(h.walkD / (8 * s))) : view === 'f' ? cyc(HERO.walkF, Math.floor(h.walkD / (7 * s))) : cyc(HERO.walkB, Math.floor(h.walkD / (7 * s)))) || HERO.stand;
    if (h.pose && ok(h.pose)) return h.pose;
    if (view === 'b') return ok(HERO.standB) ? HERO.standB : HERO.stand;
    if (view === 'f') { if (h.talk) return cyc(HERO.talk, Math.floor(t * 6)); if (ok(HERO.blink) && t % 4.3 < 0.13) return HERO.blink; return cyc(HERO.idleFront, Math.floor(t * 0.6 + 0.01)); }
    if (h.talk) return cyc(HERO.talkSide, Math.floor(t * 6)) || HERO.stand;
    return t % 6 < 1.1 && ok(HERO.idleSide[1]) ? HERO.idleSide[1] : HERO.stand;
  }
  /* image d'un personnage : repos, parole, ou marche dans la vue de son déplacement (walk = profil, walkF = face, walkB = dos,
     walkQF / walkQB = trois-quarts, repli sur la vue la plus proche) ; avec A.stride, la marche avance à la distance parcourue
     (stride = pixels par image à l'échelle 1), donc les pieds ne glissent pas, quelle que soit la profondeur */
  /* image n d'une boucle S2 prête (toutes ses images chargées), sinon null */
  life(base, n, rev) { const A = this.s2anim && this.s2anim[base]; if (!A || !this.s2ready[base]) return null; const i = ((n % A.n) + A.n) % A.n; return `s2a:${base}/${rev ? (A.n - 1 - i) % A.n : i}`; }
  lifeAt(base, t, rev) { const A = this.s2anim && this.s2anim[base]; return A ? this.life(base, Math.floor(t * (A.fps || 10)), rev) : null; }
  /* repos : la boucle, puis la pose de départ tenue un moment (durée qui varie d'une fois à l'autre) : jamais un mouvement mécanique */
  lifeIdle(base, t, seed = 0, rev) {
    const A = this.s2anim && this.s2anim[base]; if (!A) return null; const D = A.n / (A.fps || 10), P = D + 2.6;
    const k = Math.floor(t / P), u = t - k * P, o = 2.4 * (((Math.sin((k + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1);   /* départ de la boucle décalé au hasard dans la période */
    return this.life(base, u >= o && u < o + D ? Math.floor((u - o) * (A.fps || 10)) : 0, rev);
  }
  /* charge les images d'une boucle S2 ; elle ne joue qu'une fois complète (pas d'image manquante en cours de lecture) */
  loadLife(base) {
    const A = this.s2anim && this.s2anim[base]; if (!A || this.s2ready[base] !== undefined) return; this.s2ready[base] = false; const low = this.s2low;
    Promise.all(Array.from({ length: A.n }, (_, i) => this.img(this.sprPath(`s2a:${base}/${i}`)))).then(r => { if (this.s2low === low) this.s2ready[base] = r.every(Boolean); else this.s2ready[base] = undefined; });
  }
  frame(e) {
    const L = S2.LIFE[e.spr]; if (L && this.scene && this.scene.hd) {   /* e.rev (petit homme en rouge) : toutes ses boucles à l'envers, sauf e.fwd (sous Wabbajack) */
      const t = this.now + (e.ph || 0), r = (e.rev || e.revLine) && !e.fwd;
      if (e.goal && L.walk) { const w = this.lifeAt(L.walk, t, r); if (w) return w; }   /* en marche : sa boucle de marche */
      const f = e.talk && L.talk ? this.lifeAt(L.talk, t, r) || this.lifeIdle(L.idle, t, e.ph, r) : L.idle && this.lifeIdle(L.idle, t, e.ph, r); return f || e.spr;
    }
    const A = ANIM[e.spr]; if (!A) return e.spr;
    const st = e.animState || (e.goal ? 'walk' : e.talk ? 'talk' : 'idle'), fps = (A.fps && A.fps[st]) || 3;
    let fr = A[st] || A.idle;
    if (st === 'walk') {
      /* sans trois-quarts : profil pour une diagonale douce, face ou dos pour une pente forte (e.vr = pente du déplacement) */
      const v = e.view || 's', steep = (e.vr || 0) > 1.1, alt = [...{ s: ['walk'], f: ['walkF', 'walkQF', 'walk'], b: ['walkB', 'walkQB', 'walk'], qf: steep ? ['walkQF', 'walkF', 'walk'] : ['walkQF', 'walk'], qb: steep ? ['walkQB', 'walkB', 'walk'] : ['walkQB', 'walk'] }[v], 'walkOld'];
      const key = alt.find(k => A[k] && A[k].some(n => this.spr(n))); if (key) fr = A[key].filter(n => this.spr(n));
      if (A.stride && e.walkD != null && key && key !== 'walkOld') return fr[Math.floor(e.walkD / (A.stride * this.sc(e))) % fr.length];
    }
    return fr[Math.floor(this.now * fps + (e.ph || 0)) % fr.length];
  }
  /* image d'une zone du décor animée par images (assets/pointclick/anim/<id>_<n>.png), chargée à la demande */
  animImg(id, i) {
    const p = `assets/pointclick/anim/${id}_${i}.png`, im = this.imgs[p]; if (im && im.width) return im;
    this._ld = this._ld || {}; if (!this._ld[p]) { this._ld[p] = 1; Promise.resolve(this.img(p)).catch(() => {}); } return null;
  }
  /* saison 2 en rendu années 90 : mêmes images converties comme celles de la saison 1 (s2/90/, tools/s2_retro.py), canevas 480 × 270 */
  get s2low() { return !!(this.s2retro && this.scene && this.scene.hd); }
  sprPath(name) {
    if (name.startsWith('s2:')) return this.s2low ? `assets/pointclick/s2/90/spr/${name.slice(3)}.png` : `assets/pointclick/s2/spr/${name.slice(3)}.webp`;
    if (name.startsWith('s2a:')) return this.s2low ? `assets/pointclick/s2/90/anim/${name.slice(4)}.png` : `assets/pointclick/s2/anim/${name.slice(4)}.webp`;
    return `assets/pointclick/spr/${SPR[name] || name}.png`;
  }
  bgPath(sc) { return 'assets/pointclick/' + (sc.hd && this.s2retro ? sc.bg.replace('s2/', 's2/90/').replace(/\.webp$/, '.png') : sc.bg); }
  /* bascule années 90 / 2000 en cours de partie : décor et sprites de la scène rechargés dans l'autre rendu */
  async applyLook() {
    const sc = this.scene; if (!sc || !sc.hd) return;
    const bg = await this.img(this.bgPath(sc)); if (bg && this.scene === sc) this.bg = bg;
    await Promise.all([...S2.PRELOAD, ...(sc.preload || []), ...this.ents.map(e => e.spr)].filter(n => n && /^s2a?:/.test(n)).map(n => Promise.resolve(this.img(this.sprPath(n))).catch(() => {})));
    this.s2ready = {}; S2.lifeBases(sc).forEach(b => this.loadLife(b)); this.startVideos(sc);
  }
  /* zones du décor animées par vidéo en boucle (mer, galion…) : HD = vidéo ; années 90 = images converties comme en saison 1 */
  startVideos(sc) {
    (this.vids || []).forEach(v => { v.el.pause(); v.el.removeAttribute('src'); v.el.load(); }); this.vids = [];
    for (const V of sc.video || []) {
      if (this.s2low) { if (V.low && this.animIdx) { this.vids.push({ V, low: true }); for (let i = 0; i < V.low.n; i++) Promise.resolve(this.img(`assets/pointclick/s2/90/anim/${V.low.id}/${i}.png`)).catch(() => {}); } continue; }
      const v = document.createElement('video'); Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', src: V.src }); v.setAttribute('playsinline', ''); v.muted = true;
      const p = v.play(); if (p && p.catch) p.catch(() => {}); this.vids.push({ V, el: v });
    }
  }
  drawVideos(c) {
    for (const o of this.vids || []) {
      const [x, y, w, h] = o.V.rect;
      if (o.low) { const A = o.V.low, im = this.imgs[`assets/pointclick/s2/90/anim/${A.id}/${Math.floor(this.now * (A.fps || 8)) % A.n}.png`]; if (im && im.width) c.drawImage(im, x, y, w, h); continue; }
      const v = o.el; if (v.readyState < 2) continue;
      const k = this.k, sc = this._vsc || (this._vsc = document.createElement('canvas')), vw = Math.round(w * k), vh = Math.round(h * k); if (sc.width !== vw || sc.height !== vh) { sc.width = vw; sc.height = vh; o.mask = null; }
      const x2 = sc.getContext('2d'); x2.globalCompositeOperation = 'source-over'; x2.clearRect(0, 0, vw, vh);
      const [sx, sy, sw, sh] = o.V.crop || [0, 0, v.videoWidth, v.videoHeight]; x2.drawImage(v, sx, sy, sw, sh, 0, 0, vw, vh);
      if (o.V.feather) { if (!o.mask) o.mask = S2.featherMask(vw, vh, o.V.feather * k, o.V.edges); x2.globalCompositeOperation = 'destination-in'; x2.drawImage(o.mask, 0, 0); }
      c.drawImage(sc, x, y, w, h);
    }
  }
  spr(name) { const i = name && this.imgs[this.sprPath(name)]; return i && i.width ? i : null; }
  heroStand() { return this.scene && this.scene.hd ? S2.HERO2.r : HERO ? HERO.stand : 'hero.side'; }
  /* définition du canevas : 1 = 480 × 270 (saison 1, au pixel près), 2 = 960 × 540 (saison 2) ; les coordonnées logiques ne changent pas */
  setRes(k) { this.k = k; this.cv.width = W * k; this.cv.height = H * k; this.ctx.imageSmoothingEnabled = false; this.ctx.imageSmoothingQuality = 'high'; }
  /* coucher de nuit : clé de la planche d'animation du personnage (null s'il n'en a pas encore), planche chargée, réglages */
  sleepKey(e) { const d = SLEEP[e.spr]; return d && this.sleepIdx && this.sleepIdx[d.k] ? d.k : null; }
  sleepSheet(k) { const i = this.imgs[`assets/pointclick/sleep/${k}.png`]; return i && i.width ? i : null; }
  sleepConf(e) { return SLEEP[e.spr] || {}; }
  /* décor brisé (SH.CASSE) : le coin cassé est peint par-dessus le décor ; image prête dès l'arrivée dans la scène */
  async casseBg(id, bg) { const d = SH.CASSE[id]; if (!d || !bg) return bg; const p = await this.img(d.img); return this.st.flags[d.flag] && p ? this.casseCompose(bg, d, p) : bg; }
  casseCompose(bg, d, p) { const cv = Object.assign(document.createElement('canvas'), { width: bg.width, height: bg.height }), x = cv.getContext('2d'); x.drawImage(bg, 0, 0); x.drawImage(p, d.x * bg.width / W, d.y * bg.height / H, p.width * bg.width / W, p.height * bg.height / H); return cv; }
  casseApply(id) { const d = SH.CASSE[id], p = d && this.imgs[d.img]; if (!d) return; this.st.flags[d.flag] = true; this.save(); if (!p || !p.width) return; this.bg = this.casseCompose(this.bg, d, p); if (this.sky && this.sky.occ) this.sky.occ.getContext('2d').drawImage(p, d.x, d.y); }


  /* ───────── interface HTML ───────── */
  build() {
    const r = this.root; r.innerHTML = ''; r.classList.add('pc');
    this.stage = el('div', 'pc-stage'); this.view = this.stage;
    this.cv = el('canvas'); this.cv.width = W; this.cv.height = H; this.ctx = this.cv.getContext('2d'); this.ctx.imageSmoothingEnabled = false; this.k = 1;
    this.ov = el('div', 'pc-ov'); this.askEl = el('div', 'pc-ask');
    this.out = el('canvas', 'pc-out'); this.scaler = Scaler.create(this.cv, this.out); this.filter = store.get('pc.filter', 'sharp'); if (this.scaler) { this.scaler.mode = this.filter; this.cv.classList.add('pc-src'); }
    this.ambient = el('canvas', 'pc-ambient'); this.ambient.width = 48; this.ambient.height = 27; this.actx = this.ambient.getContext('2d'); this.ambT = 0;
    /* canvas d'interface à la résolution du jeu (pièce des verbes, anneau de l'appui long), au-dessus du tiroir */
    this.uiCv = el('canvas', 'pc-ui'); this.uiCv.width = W; this.uiCv.height = H; this.uctx = this.uiCv.getContext('2d'); this.uctx.imageSmoothingEnabled = false; this.uiDirty = false;
    this.labelEl = el('div', 'pc-label'); this.labelEl.hidden = true;
    /* tiroir d'inventaire (monte du bas) : 8 emplacements + boutons système */
    this.drawer = el('div', 'pc-drawer'); this.invEl = el('div', 'pc-inv'); const sys = el('div', 'pc-sys');
    this.menuBtn = el('button', 'pc-menu', '≡'); this.menuBtn.title = 'Menu'; this.menuBtn.onclick = () => this.showTitle(true);
    this.musicBtn = el('button', 'pc-menu pc-music', '♪'); this.musicBtn.onclick = () => this.setMusic(snd.musicOn === false);
    this.voiceBtn = el('button', 'pc-menu pc-voice', '❝'); this.voiceBtn.onclick = () => this.setVoice(!this.voiceOn);
    this.fsBtn = el('button', 'pc-menu pc-fs', '⛶'); this.fsBtn.onclick = () => this.toggleFullscreen();
    this.ambBtn = el('button', 'pc-menu pc-amb', '≈'); this.ambBtn.onclick = () => this.setAmbience(!this.ambOn);
    sys.append(this.voiceBtn, this.musicBtn, this.ambBtn, this.fsBtn, this.menuBtn); this.drawer.append(this.invEl, sys);
    /* besace (coin bas gauche) et menu (coin haut droit), discrets, masqués pendant les cinématiques */
    this.bagBtn = el('button', 'pc-bag'); const bc = el('canvas'); bc.width = 16; bc.height = 16; bc.getContext('2d').drawImage(bagCanvas(), 0, 0); this.bagBtn.append(bc);
    this.bagBtn.onclick = () => { snd.unlock(); if (this.sel && !this.invOpen) { this.toggleInv(true); return; } this.toggleInv(); };
    this.cornerBtn = el('button', 'pc-corner', '≡'); this.cornerBtn.onclick = () => this.showTitle(true);
    this.stage.append(...(this.scaler ? [this.out] : []), this.cv, this.ov, this.askEl, this.drawer, this.bagBtn, this.cornerBtn, this.uiCv, this.labelEl);
    this.setVoice(this.voiceOn, true); this.ambOn = store.get('pc.amb', true); this.setAmbience(this.ambOn, true); this.ambNext = 0; this.ambT = 0;
    this._mv = e => { const d = this._mx === null ? 0 : Math.hypot(e.clientX - this._mx, e.clientY - this._my); this._mx = e.clientX; this._my = e.clientY; if (d > 2) { this.lastMove = this.now; if (this.night) wakeNight(this); } };
    this._pd = () => { this.lastMove = this.now; if (this.night) wakeNight(this); };
    document.addEventListener('pointermove', this._mv); document.addEventListener('pointerdown', this._pd); document.addEventListener('keydown', this._pd); this.setMusic(store.get('pc.music', true), true);
    r.append(this.ambient, this.stage);
    this.renderPanel();
    const cv = this.cv, st = this.stage;
    cv.addEventListener('pointermove', e => { this.mouse = this.pos(e); if (!this.coinOpen() && !this.press) this.setHover(this.pick(...this.mouse)); });
    cv.addEventListener('pointerdown', e => this.onDown(e));
    /* pièce restée ouverte (relâchée sans viser) : le clic suivant choisit un verbe ou la referme, sans rien déclencher dessous */
    st.addEventListener('pointerdown', e => { if (!this.coinOpen() || this.press) return; e.stopPropagation(); e.preventDefault(); this.mouse = this.pos(e); const v = e.button === 2 ? null : coinSector(this.coin, ...this.mouse); if (v) this.coinPick(v); else this.closeCoin(); }, true);
    st.addEventListener('pointermove', e => { this.mouse = this.pos(e); if (this.coinOpen()) this.coinMove(); else if (this.invOpen && this.sel && this.mouse[1] < H - DRAWER_H - 12) this.toggleInv(false); this.placeLabel(); });
    st.addEventListener('pointerup', e => this.onUp(e)); st.addEventListener('pointercancel', e => this.onUp(e));
    st.addEventListener('pointerleave', () => { if (this.press) return; this.hoverItem = null; this.setHover(null); this.renderLine(); });
    st.addEventListener('contextmenu', e => { e.preventDefault(); this.onRight(); });
    this.ov.addEventListener('pointerdown', () => { this.skip = true; });
    /* un balayage dans le jeu ne doit pas changer de bureau du faux Mac */
    ['touchstart', 'touchend'].forEach(n => this.root.addEventListener(n, e => e.stopPropagation(), { passive: true }));
  }
  fit() {
    const rw = this.root.clientWidth, rh = this.root.clientHeight; if (!rw || !rh) return;
    const w = Math.min(rw, rh * 16 / 9), u = w / W;
    this.root.style.setProperty('--u', u.toFixed(4)); this.stage.style.width = w + 'px'; this.stage.style.height = (w * 9 / 16) + 'px';
    if (this.scaler) this.scaler.resize(w, w * 9 / 16);
    const k = clamp(Math.round(u), 1, 4); if (k !== this.curK) { this.curK = k; this.updCursor(); }
  }
  pos(e) { const r = this.stage.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  renderPanel() { this.renderInv(); this.bagBtn.title = this.T('ui.inv'); this.cornerBtn.title = this.menuBtn.title = this.T('ui.menu'); }
  renderInv() {
    this.invEl.innerHTML = ''; const inv = this.st ? this.st.inv : [];
    for (let i = 0; i < 8; i++) {
      const id = inv[i], b = el('button', 'pc-slot' + (id && this.sel === id ? ' held' : '')); b.disabled = !id;
      if (id) {
        const c = document.createElement('canvas'); c.width = 40; c.height = 34; const im = this.spr(ITEMS[id].spr); if (im) { const k = Math.min(38 / im.width, 32 / im.height); const w = im.width * k, h = im.height * k; const x = c.getContext('2d'); x.imageSmoothingEnabled = dn(im) > 1; x.imageSmoothingQuality = 'high'; x.drawImage(im, (40 - w) / 2, 34 - h - 1, w, h); } b.append(c);
        b.addEventListener('pointerdown', e => { e.preventDefault(); this.slotDown(e, id); });
        b.addEventListener('pointerenter', () => { this.hoverItem = id; this.renderLine(); });
        b.addEventListener('pointerleave', () => { if (this.hoverItem === id) { this.hoverItem = null; this.renderLine(); } });
      }
      this.invEl.append(b);
    }
  }
  toggleInv(open = !this.invOpen) {
    if (open === this.invOpen) return; this.invOpen = open; snd.click();
    this.drawer.classList.toggle('open', open); this.bagBtn.classList.toggle('on', open); if (!open) this.hoverItem = null; this.renderLine();
  }
  /* objet tenu : le curseur devient l'objet ; null = le reposer dans la besace */
  setSel(id) { this.sel = id; this.root.classList.toggle('holding', !!id); this.renderInv(); this.updCursor(); this.renderLine(); }
  updCursor() {
    const k = this.curK || 2, it = this.sel && ITEMS[this.sel];
    this.stage.style.cursor = it ? itemCursor(this.spr(it.spr), this.sel, k) : crossCursor(!!this.hover, k);
  }
  /* étiquette sous le curseur : nom de ce qu'on survole, « Utiliser X avec Y », ou le verbe visé sur la pièce */
  renderLine() {
    const T = this.T, L = this.labelEl; if (!L || !T) return;
    const c = this.coinOpen() ? this.coin : null; let s = '';
    if (this.locked || this.titleEl || this.askEl.childElementCount || this.night) s = '';
    else if (c) { const nm = c.item ? T('n.' + c.item) : T(c.tg.name || 'n.' + c.tg.id); s = c.hi ? T('v.' + c.hi) + ' ' + nm : nm; }
    else {
      const nm = this.hoverItem ? T('n.' + this.hoverItem) : this.hover ? T(this.hover.name || 'n.' + this.hover.id) : '';
      s = this.sel ? T('v.use') + ' ' + T('n.' + this.sel) + ' ' + T('ui.with') + (nm && this.hoverItem !== this.sel ? ' ' + nm : '') : nm;
    }
    L.textContent = s; L.hidden = !s; if (s) this.placeLabel();
  }
  placeLabel() {
    const L = this.labelEl; if (!L || L.hidden) return; const sw = this.stage.clientWidth, k = sw / W, c = this.coinOpen() ? this.coin : null;
    let x = c ? c.cx : this.mouse[0], y = c ? c.cy - COIN.R - 3 : this.mouse[1] - 9;
    if (y < 13) y = c ? c.cy + COIN.R + 14 : this.mouse[1] + 24;
    L.style.left = clamp(x * k, L.offsetWidth / 2 + 4, sw - L.offsetWidth / 2 - 4) + 'px'; L.style.top = y * k + 'px';
  }
  setHover(t) { const k = t ? t.id : null; if ((this.hover && this.hover.id) === k) return; this.hover = t; if (!this.sel) this.updCursor(); this.renderLine(); }

  /* ───────── écran-titre et menu (composants Socle) ───────── */
  showTitle(inGame, page) {
    this.hideTitle(); const T = this.T;
    if (!this.titleArt) { this.titleArt = new TitleArt(this); this.titleArt.load(this.lang); } else if (!inGame) this.titleArt.replayLogo();
    this.titleOn = true; this.titleIn = !!inGame;
    if (!inGame) { snd.music(snd.musicOn !== false, 'title'); if (!this.introPre) this.introPre = preloadIntro(this); }
    const rs = reached(), ac = getAch(), n = ac.lit.filter(x => BLINDS.includes(x)).length, L = ['sharp', 'nearest', 'smooth', 'scale2x', 'scale4x'];
    const d = buildMenu(this, {
      inGame: !!inGame, hasSave: hasSave(), page,
      resume: () => this.hideTitle(), cont: () => this.continueGame(), newGame: () => this.newGame(),
      chapters: CHAPTERS.map((x, i) => rs.includes(x.id) ? { id: x.id, label: T('ch.' + x.id), go: () => this.startAt(x) } : { id: x.id, label: (i + 1) + '. ???', locked: true }),   /* scènes pas encore atteintes : grisées, titre caché */
      chapters2: s2Open() ? this.s2Chapters(rs) : null,
      fullscreen: () => this.toggleFullscreen(),
      filter: this.scaler ? () => this.filter : null, nextFilter: () => this.setFilter(L[(L.indexOf(this.filter) + 1) % L.length], true),
      music: () => snd.musicOn !== false, setMusic: v => { this.setMusic(v); if (v && !inGame) snd.music(true, 'title'); },
      voice: () => this.voiceOn, setVoice: v => this.setVoice(v), amb: () => this.ambOn, setAmb: v => this.setAmbience(v),
      retro: s2Open() ? () => this.s2retro : null, setRetro: v => { this.s2retro = !!v; store.set('pc.s2retro', !!v); this.applyLook(); },
      toggleLang: () => this.setLang(this.lang === 'fr' ? 'en' : 'fr'),
      ach: T('ach.menu', { n, t: BLINDS.length }), achDone: ac.done.includes('fiatlux')
    });
    this.stage.append(d); this.titleEl = d;
  }
  /* chapitres de la saison 2 : ceux de la langue du jeu (17 = Kaamelott en français, Sacré Graal en anglais), puis l'autre version en bonus ;
     ouverts quand atteints (le 11 dès la fin de la saison 1), tous avec ?s2 ; chapitres pas encore construits grisés */
  s2Chapters(rs) {
    const T = this.T, l = this.lang === 'fr' ? 'fr' : 'en', main = CHAPTERS2.filter(c => !c.lang || c.lang === l), bonus = CHAPTERS2.filter(c => c.lang && c.lang !== l);
    const open = c => c.built && (s2All() || rs.includes(c.id) || c.id === 's2_11' || (c.bonusOf && rs.includes(c.bonusOf)));
    return [...main, ...bonus.map(c => ({ ...c, bonus: true }))].map(c => open(c) ? { id: c.id, label: (c.bonus ? T('ui.bonus') + ' ' : '') + T('ch.' + c.id), go: () => this.startAt(c) } : { id: c.id, label: (c.bonus ? T('ui.bonus') + ' ' : '') + (c.built ? T('ch.' + c.id).replace(/\. .*/, '. ???') : T('ch.' + c.id) + ' ' + T('ui.soon')), locked: true });
  }
  /* musique remplacée le temps d'un gag (le gyrophare qui joue l'air de chez le héros) ; null = retour à celle de la scène */
  musicOverride(id) { snd.music(snd.musicOn !== false, id || (this.scene && (this.scene.music || this.scene.id))); }
  /* commutateur de musique (bouton ♪ du panneau et bouton du menu), préférence mémorisée */
  setMusic(on, quiet) {
    snd.musicOn = !!on; store.set('pc.music', !!on); if (!quiet) snd.music(!!on);
    this.musicBtn.classList.toggle('off', !on); this.musicBtn.title = this.T ? this.T(on ? 'ui.musicOn' : 'ui.musicOff') : '';
  }
  /* voix : un mp3 par réplique (assets/pointclick/voice/<fr|en>/<clé>[.v<n>].mp3), interrupteur ❝ mémorisé */
  setVoice(on, quiet) {
    this.voiceOn = !!on; store.set('pc.voice', !!on); this.voiceBtn.classList.toggle('off', !on); this.voiceBtn.title = this.T ? this.T(on ? 'ui.voiceOn' : 'ui.voiceOff') : '';
    if (!on && !quiet) { for (const a of [this.sayAu, this.narr && this.narr.au]) if (a) a.pause(); }
  }
  /* une seule voix à la fois : dialogue (haute priorité) > aboiements des aveugles et narrateur (basse priorité, jamais en même temps qu'un dialogue) */
  static playing(a) { return !!a && !a.paused && !a.ended && !a.error; }
  hiBusy() { return Game.playing(this.sayAu) || (this.night && this.night.say && Game.playing(this.night.say.au)); }
  lowBusy() { return (this.narr && Game.playing(this.narr.au)) || this.barks.some(k => Game.playing(k.au)); }
  hushNarr() { const n = this.narr; if (n) { n.b.remove(); if (n.au) n.au.pause(); this.narr = null; this.lastNarr = this.now; } }
  voicePlay(key, idx) {
    if (!this.voiceOn || !key || key[0] === '=') return null;
    try { const a = new Audio(`assets/pointclick/voice/${this.lang === 'fr' ? 'fr' : 'en'}/${key}${idx >= 0 ? '.v' + idx : ''}.mp3`); a.volume = this.vvol ?? 0.95; a.play().catch(() => {}); return a; } catch { return null; }
  }
  /* le narrateur : commentaires sarcastiques qui ne bloquent jamais le jeu (file d'attente, un seul à la fois) */
  narrate(key, o = {}) {
    if (!this.T.has(key) || this.nq.some(q => q.key === key) || this.nq.length > 2) return;
    this.nq.push({ key, force: !!o.force, t: this.now + (o.delay || 0) });
  }
  pumpNarr() {
    if (this.night || (this.gl && this.gl.run) || this.cine) return;
    const n = this.narr;
    if (n && (this.bubbles.length || this.locked || this.hiBusy())) { this.hushNarr(); return; }
    if (n) { const playing = n.au && !n.au.ended && !n.au.error && !n.au.paused; if (this.now > n.end && !playing) { n.b.remove(); this.narr = null; this.lastNarr = this.now; } return; }
    if (!this.started || this.titleEl || this.locked || this.coinOpen() || this.bubbles.length || this.barks.length || this.hiBusy() || this.lowBusy()) return;
    if (!this.nq.length && this.now - this.lastAct > 45) { this.lastAct = this.now; const k = (this.scene && this.scene.idleKey && this.scene.idleKey(this)) || 'nar.' + this.st.scene + '.idle'; this.narrate(this.idleN++ % 3 === 2 || !this.T.has(k) ? 'nar.idle' : k); }
    const q = this.nq[0]; if (!q || this.now < q.t || (!q.force && this.now - this.lastNarr < 8)) return; this.nq.shift();
    const text = this.T(q.key), idx = this.T.idx, b = el('div', 'pc-b pc-narr', text); b.style.color = COLORS.narr; this.ov.append(b); this.placeBubble(b, W / 2, 46);
    this.narr = { b, au: this.voicePlay(q.key, idx), end: this.now + Math.max(3, text.length * 0.065) };
    if (this.narr.au) this.narr.au.addEventListener('loadedmetadata', () => { if (this.narr) this.narr.end = Math.max(this.narr.end, this.now + this.narr.au.duration + 0.3); });
  }
  hideTitle() { if (this.titleEl) { this.titleEl.remove(); this.titleEl = null; } if (this.titleOn) { this.titleOn = false; if (this.titleIn && this.started && this.scene) snd.music(snd.musicOn !== false, this.scene.music || this.scene.id); } }

  /* ───────── parties ───────── */
  async newGame() {
    this.hideTitle(); clearSave(); this.cancelAll(); this.cutN = 0; this.saveLater = false; this.locked = false; this.sel = null; this.fx = {};
    this.st = { scene: 'rue', flags: {}, inv: ['lamp'], hero: null }; this.started = true;
    /* intro « Quinze ans plus tard » (intro.js) : aucune scène chargée pendant qu'elle se joue */
    this.scene = null; this.bg = null; this.ents = []; this.hero = null; this.hot = []; this.amb = null; this.night = null; this.ambId = null; snd.ambStop(); this.clearBarks(); this.hushNarr(); this.renderPanel(); this.renderLine();
    const done = await playIntro(this);
    if (!this.alive) return;
    const go = this.goScene('rue', { intro: done ? 'cart' : true }); this.fade(0, 900); await go;
  }
  /* passe l'intro : plans dessinés (intro.js) ou arrivée de la charrette dans la rue (rue.js) */
  cineSkip() {
    if (this.cine) { this.cine.skipped = true; this.cancelAll(); return; }
    if (this.cineEnd) { const f = this.cineEnd; this.cineEnd = null; this.cancelAll(); f(); }
  }
  /* sélecteur de scène : repart au début d'un chapitre déjà atteint, avec l'état attendu à son entrée */
  async startAt(ch) {
    this.hideTitle(); clearSave(); this.cancelAll(); this.cutN = 0; this.saveLater = false; this.locked = false; this.sel = null; this.fx = {};
    this.st = { scene: ch.id, flags: { ...ch.flags }, inv: ['lamp', ...ch.inv.filter(x => x !== 'lamp')], hero: null }; snd.music(snd.musicOn !== false, ch.music || ch.id); this.started = true;
    await this.goScene(ch.id, { intro: true });
  }
  async continueGame() {
    const s = loadSave(); if (!s) return this.newGame();
    this.hideTitle(); this.cancelAll(); this.cutN = 0; this.saveLater = false; this.locked = false; this.sel = null; this.fx = {}; this.st = { scene: s.scene, flags: s.flags || {}, inv: s.inv || [], hero: s.hero || null }; if (!this.st.inv.includes('lamp')) this.st.inv.unshift('lamp');   /* sauvegardes d'avant le génie */
    snd.music(snd.musicOn !== false); this.started = true; await this.goScene(s.scene, { restored: true });
  }
  /* jamais de sauvegarde au milieu d'une cinématique (objet retiré, drapeau pas encore posé : partie bloquée après rechargement) : elle attend la fin */
  save() { if (this.cutN > 0) { this.saveLater = true; return; } if (this.st && this.started) writeSave({ scene: this.st.scene, flags: this.st.flags, inv: this.st.inv, hero: this.hero ? { x: this.hero.x, y: this.hero.y, dir: this.hero.dir } : null }); }
  async goScene(id, how = {}) {
    const sc = (await import(`../scenes/${id}.js`)).default; this.st.scene = id;
    const bg = await this.casseBg(id, await this.img(this.bgPath(sc))); this.scene = sc; this.bg = bg; this.ambNext = this.now + 4; this.wk = null; this.wkAt = Math.max(this.wkAt ?? 0, this.now + 45); this.night = null; this.sky = sc.interior || sc.hd ? null : buildSky(bg); this.lastMove = this.now;
    if (sc.hd) { await Promise.all([...S2.PRELOAD, ...(sc.preload || []), ...(sc.ents || []).map(e => e.spr)].filter(n => n && /^s2a?:/.test(n)).map(n => Promise.resolve(this.img(this.sprPath(n))).catch(() => {})));
      this.s2ready = {}; S2.lifeBases(sc).forEach(b => this.loadLife(b)); this.startVideos(sc); }
    this.walk = new Walk(sc.walk.map(p => p.slice()), W, H); this.fgExtra = null;
    this.hot = sc.hot || []; this.amb = makeAmbient(sc.ambient);
    await Promise.all((sc.ambient || []).filter(o => o.type === 'frames' && this.animIdx[o.id]).flatMap(o => Array.from({ length: this.animIdx[o.id].n }, (_, i) => Promise.resolve(this.img(`assets/pointclick/anim/${o.id}_${i}.png`)).catch(() => {}))));
    this.ents = (sc.ents || []).map(e => ({ visible: true, ph: Math.random() * 5, ...e }));
    this.ents.forEach(e => { const k = this.sleepKey(e), t = this.sleepConf(e).thr; if (k) Promise.resolve(this.img(`assets/pointclick/sleep/${k}.png`)).catch(() => {}); if (k && t) Promise.resolve(this.img(t.img)).catch(() => {}); });   /* planches du coucher de nuit, prêtes bien avant la nuit */
    const st = how.restored && this.st.hero ? this.st.hero : sc.start;
    this.hero = { id: 'hero', who: 'hero', spr: this.heroStand(), x: st.x, y: st.y, dir: st.dir || 'r', path: [], walkD: 0, hot: true, isHero: true, visible: true };
    this.ents.push(this.hero);
    this.clearBarks(); this.hover = null; this.renderPanel(); this.renderLine();
    if (this.started) snd.music(snd.musicOn !== false, sc.music || id);
    if (this.started) reach(id);
    if (sc.enter) await sc.enter(this, how);
    this.save();
    this.lastAct = this.now; if (how.restored) this.narrate('nar.back', { delay: 1.5, force: true });
    if (how.intro && sc.intro) this.run(async () => { await this.cut(() => sc.intro(this, how)); this.narrate('nar.' + id + '.enter', { force: true, delay: 1.2 }); });
  }

  /* ───────── API pour les scènes ───────── */
  flag(k) { return this.st.flags[k]; }
  set(k, v = true) { this.st.flags[k] = v; this.save(); if (v === true) this.narrate('nar.' + this.st.scene + '.' + k); }
  count(k, d = 1) { this.st.flags[k] = (this.st.flags[k] || 0) + d; this.save(); return this.st.flags[k]; }
  has(id) { return this.st.inv.includes(id); }
  give(id) { if (!this.has(id)) { this.st.inv.push(id); const b = this.bagBtn; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } this.renderInv(); this.save(); }
  drop(id) { this.st.inv = this.st.inv.filter(x => x !== id); if (this.sel === id) this.setSel(null); this.renderInv(); this.save(); }
  ent(id) { return this.ents.find(e => e.id === id); }
  addWalk(poly) { this.walk.add(poly); }
  sfx(n, ...a) { snd[n] && snd[n](...a); }
  chk() { if (this.runTok !== this.tok) throw new Cancel(); }
  until(cond) { return new Promise(res => this.waiters.push({ cond, res })); }
  async wait(ms) { this.chk(); const end = this.now + ms / 1000; await this.until(() => this.now >= end); this.chk(); }
  async cut(fn) { this.cutN = (this.cutN || 0) + 1; this.locked = true; this.renderLine(); try { await fn(); } finally { if (--this.cutN <= 0) { this.cutN = 0; this.locked = false; this.renderLine(); if (this.saveLater) { this.saveLater = false; this.save(); } } } }
  cancelAll() { this.tok++; if (this.sayAu) { this.sayAu.pause(); this.sayAu = null; } this.waiters.splice(0).forEach(w => w.res()); this.clearBubbles(); if (this.hero) this.hero.path = []; this.askEl.innerHTML = ''; this.choice = null; }
  async run(fn) {
    const tok = ++this.tok; this.runTok = tok;
    try { await fn(); } catch (e) { if (!(e instanceof Cancel)) console.error(e); }
    finally { if (this.runTok === tok && !this.locked) { this.clearBubbles(); this.ents.forEach(e => { e.talk = false; }); } }
  }
  input(fn) { this.lastAct = this.now; if (this.night) { wakeNight(this); return; } if (this.locked || !this.started || this.titleEl) return; this.cancelAll(); this.run(fn); }
  persp(y) { const p = this.scene.persp; return clamp(p[1] + (p[3] - p[1]) * (y - p[0]) / (p[2] - p[0]), Math.min(p[1], p[3]) * 0.8, Math.max(p[1], p[3])); }
  /* échelle d'un acteur : fixe (scale), relative à la profondeur (kz × perspective : il grandit en s'approchant), ou perspective seule */
  sc(e) { return e.scale ?? (e.kz ? e.kz * this.persp(e.y) : this.persp(e.y)); }
  /* vue selon la direction du déplacement : profil (s), face (f), dos (b), trois-quarts avant (qf) ou arrière (qb) */
  viewOf(dx, dy) { const ax = Math.abs(dx), ay = Math.abs(dy); return ay > ax * 2.2 ? (dy > 0 ? 'f' : 'b') : ay > ax * 0.45 ? (dy > 0 ? 'qf' : 'qb') : 's'; }
  async walkTo(x, y) { this.chk(); this.hero.path = this.walk.path([this.hero.x, this.hero.y], [x, y], this.blockers()); await this.until(() => !this.hero.path.length); this.chk(); }
  face(x, y) {
    const h = this.hero, dx = x - h.x; h.front = false; h.back = false;
    if (y !== undefined) { const dy = y - h.y; if (dy < -22 && Math.abs(dx) < Math.abs(dy) * 0.9 && this.spr('hero.bStand')) { h.back = true; return; } }
    if (Math.abs(dx) > 3 || y === undefined) h.dir = dx >= 0 ? 'r' : 'l';
  }
  async walkEnt(id, x, y, speed = 40) { const e = this.ent(id); e.goal = [x, y, speed]; await this.until(() => !e.goal); this.chk(); }
  async say(who, key, vars) {
    this.chk(); this.clearBarks(); this.hushNarr();
    if (this.voiceOn && this.hiBusy()) { const w0 = this.now; await this.until(() => !this.hiBusy() || this.now - w0 > 9); this.chk(); }
    const text = key.startsWith('=') ? key.slice(1) : this.T(key, vars), e = who === 'narr' ? null : this.ent(who);
    const b = el('div', 'pc-b', text); b.style.color = COLORS[who] || '#fff'; this.ov.append(b); this.bubbles.push(b);
    const env = ENV.has(key);   /* dite à l'envers : sous-titre façon télévision en bas de l'écran, toujours affiché, et le personnage s'anime à l'envers */
    if (env) { b.classList.add('pc-sub'); this.placeBubble(b, W / 2, H - 8); } else { const [ax, ay] = (this.cinePos && this.cinePos[who]) || (e ? this.headPos(e) : [W / 2, 40]); this.placeBubble(b, ax, ay); }
    if (e) { e.talk = who; e.revLine = env && !e.isHero; }   /* le héros dit sa réplique à l'envers (voix retournée) mais s'anime à l'endroit */
    const au = this.voicePlay(key, key[0] === '=' ? -1 : this.T.idx); this.sayAu = au;
    this.skip = false; const t0 = this.now, end = t0 + Math.max(1.7, text.length * 0.06); this.sayT0 = t0;
    const talking = () => au && !au.ended && !au.error && !au.paused && this.voiceOn;
    await this.until(() => (this.now >= end && !talking()) || (this.skip && this.now - t0 > 0.6)); this.skip = false; if (au) au.pause(); this.sayAu = null;
    b.remove(); this.bubbles = this.bubbles.filter(x => x !== b); if (e) { e.talk = false; e.revLine = false; } this.chk();
  }
  headPos(e) { const im = this.spr(e.spr), s = this.sc(e); return [e.x, e.y - (e.float || 0) - (im ? ih(im) * s : 40) - 3]; }
  placeBubble(b, x, y) {
    const sw = this.stage.clientWidth, k = sw / W; b.style.left = x * k + 'px'; b.style.top = y * k + 'px';
    const w = b.offsetWidth, l = clamp(x * k, w / 2 + 6, sw - w / 2 - 6); b.style.left = l + 'px'; if (y * k - b.offsetHeight < 4) b.style.top = (b.offsetHeight + 6) + 'px';
  }
  clearBubbles() { this.bubbles.forEach(b => b.remove()); this.bubbles = []; }
  /* réplique lancée en passant, sans bloquer le jeu (les aveugles qui répètent « Pourquoi il fait si sombre ? ») */
  bark(who, key, ms = 2800, force = false) {
    const e = this.ent(who); if (!e || (this.locked && !force) || this.titleEl || this.coinOpen() || this.hiBusy() || this.lowBusy() || this.narr) return;
    const b = el('div', 'pc-b', this.T(key)); b.style.color = COLORS[who] || '#fff'; this.ov.append(b);
    const [ax, ay] = this.headPos(e); this.placeBubble(b, ax, ay); const au = this.voicePlay(key, this.T.idx), bk = { b, who, end: this.now + ms / 1000, au }; this.barks.push(bk); if (au) au.addEventListener('loadedmetadata', () => { bk.end = Math.max(bk.end, this.now + au.duration + 0.2); });
  }
  clearBarks() { this.barks.forEach(k => { k.b.remove(); if (k.au) k.au.pause(); }); this.barks = []; }
  toast(title, text, ms = 4200) {
    const t = el('div', 'pc-toast'); t.append(el('b', '', title), el('span', '', text)); this.stage.append(t); snd.jingle();
    setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 600);
  }
  /* vignette d'ouverture d'un chapitre de la saison 2 : l'illustration plein écran (dessinée sur le canevas) et le titre ; un clic
     la passe. En rendu années 90, sa version convertie comme en saison 1. o.upgrade (début de la saison 2) : elle apparaît en rendu
     années 90, puis deux balayages lumineux la font passer aux couleurs puis à la définition des années 2000. Elle s'efface sur la scène. */
  async card(src, title, o = {}) {
    this.chk(); const lowSrc = src.replace('s2/cards/', 's2/90/cards/').replace(/\.webp$/, '.png'), up = o.upgrade && !this.s2low;
    const [hi, lo] = await Promise.all([this.s2low ? null : this.img(src), this.s2low || up ? this.img(lowSrc) : null]);
    const d = el('div', 'pc-s2card'); d.append(el('h2', '', title)); d.onpointerdown = () => { this.skip = true; };
    this.cardFx = { im: this.s2low || up ? lo : hi, a: 0 }; this.stage.append(d);
    try {
      const t0 = this.now; requestAnimationFrame(() => d.classList.add('on'));
      await this.until(() => { this.cardFx.a = Math.min(1, (this.now - t0) / 0.6); return this.cardFx.a >= 1; }); this.chk();
      if (up && lo && hi) { await this.wait(1500); await this.upgradeRender(lo, hi); }
      this.skip = false; const t1 = this.now; await this.until(() => this.now - t1 > (up ? 2.5 : 4.5) || (this.skip && this.now - t1 > 0.6)); this.skip = false; this.chk();
      d.classList.remove('on'); const t2 = this.now; this.fade(0, 800);
      await this.until(() => { this.cardFx.a = Math.max(0, 1 - (this.now - t2) / 0.8); return this.cardFx.a <= 0; });
    } finally { d.remove(); this.cardFx = null; }
  }
  /* années 90 -> années 2000 : 1er balayage, les 16 millions de couleurs (même définition 480 × 270) ; 2e balayage, la définition 960 × 540 ;
     une ligne de lumière descend en semant des étincelles */
  async upgradeRender(lo, hi) {
    const mid = Object.assign(document.createElement('canvas'), { width: W, height: H }), x = mid.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(hi, 0, 0, W, H);
    const C = this.cardFx; for (const [a, b] of [[lo, mid], [mid, hi]]) {
      C.im = a; C.next = b; const t0 = this.now, dur = 1.1; this.sfx('whoosh'); let lastSp = 0;
      await this.until(() => {
        const u = Math.min(1, (this.now - t0) / dur), e = u * u * (3 - 2 * u); C.split = e * 1.03; C.line = Math.sin(u * Math.PI);
        if (this.now - lastSp > 0.05 && u < 1) { lastSp = this.now; for (let i = 0; i < 3; i++) twinkle(this, Math.random() * W, C.split * H, i % 2 ? '#bfe6ff' : '#fff2c0'); }
        return u >= 1;
      }); this.chk();
      C.im = b; C.next = null; C.split = 0; C.line = 0; await this.wait(a === lo ? 450 : 100);
    }
    this.sfx('jingle');
  }
  drawCard(c) {
    const C = this.cardFx; if (!C || !C.im) return;
    const put = im => { c.imageSmoothingEnabled = dn(im) > 1; c.drawImage(im, 0, 0, W, H); };
    c.save(); c.globalAlpha = C.a; put(C.im);
    if (C.next && C.split > 0) { const y = Math.min(H, C.split * H); c.save(); c.beginPath(); c.rect(0, 0, W, y); c.clip(); put(C.next); c.restore();
      if (C.line > 0) { const g = c.createLinearGradient(0, y - 7, 0, y + 7); g.addColorStop(0, 'rgba(160,210,255,0)'); g.addColorStop(0.5, `rgba(235,248,255,${0.85 * C.line})`); g.addColorStop(1, 'rgba(160,210,255,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, y - 7, W, 14); } }
    c.restore();
  }
  /* un aveugle a retrouvé la lumière : compte, toast, succès */
  award(id) { if (award(id)) this.toast(this.T('ach.' + id + '.title'), this.T('ach.' + id + '.text')); }
  lightUp(sceneId) {
    const r = light(sceneId), T = this.T; this.narrate('nar.lit');
    this.toast(T('ach.lit.title'), T('ach.lit', { n: r.count, t: r.total }));
    if (r.first) setTimeout(() => this.toast(T('ach.fiat.title'), T('ach.fiat.text')), 2600);
  }
  /* choix de dialogue : renvoie l'indice choisi */
  async ask(keys) {
    this.chk(); this.askEl.innerHTML = ''; this.choice = null; if (this.sel) this.setSel(null); this.toggleInv(false); this.closeCoin();
    keys.forEach((k, i) => { const b = el('button', 'pc-opt', this.T(k)); b.onclick = () => { this.choice = i; }; this.askEl.append(b); }); this.renderLine();
    await this.until(() => this.choice !== null); const c = this.choice; this.choice = null; this.askEl.innerHTML = ''; this.chk(); return c;
  }
  shake(ms = 500, amp = 3) { this.fx.shake = { end: this.now + ms / 1000, amp }; }
  async fade(to, ms = 600) { const from = this.fx.fade ? this.fx.fade.a : (to ? 0 : 1); this.fx.fade = { from, to, t0: this.now, ms: ms / 1000, a: from }; await this.until(() => !this.fx.fade || this.fx.fade.a === to); }
  /* objet lancé : de (x0,y0) vers (x1,y1) avec un arc */
  async fly(sprName, [x0, y0], [x1, y1], ms = 500, arc = 30, spin = 0, scale = 1) {
    const e = { id: 'fly', spr: sprName, x: x0, y: y0, scale, visible: true, fly: true, rot: 0, noHot: true, flip: FACE_L.has(sprName) && x1 > x0 }; this.ents.push(e);   /* un dragon vole tête en avant */
    const t0 = this.now, d = ms / 1000;
    await this.until(() => { const t = Math.min(1, (this.now - t0) / d); e.x = x0 + (x1 - x0) * t; e.y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * arc; e.rot = spin * t; return t >= 1; });
    this.ents = this.ents.filter(x => x !== e); this.chk();
  }
  async end(pre) { /* fin du jeu : textes `<pre>.title` et `<pre>.sub` */
    if (this.scene && !this.scene.hd) store.set('pc.s1done', true);
    await this.fade(1, 1200); clearSave(); this.started = false; const d = el('div', 'pc-title socle'), c = el('div', 'pc-card'); const T = this.T;
    c.append(el('h1', '', T(pre + '.title')), el('p', '', T(pre + '.sub')), el('p', 'pc-fine', T('end.love')));
    const row = el('div', 'pc-btns'), a = el('button', 'sbtn acc', T('end.again')); a.onclick = () => { d.remove(); this.newGame(); }; row.append(a); c.append(row); d.append(c); this.stage.append(d); this.titleEl = d; snd.jingle();
  }

  /* plein écran (la fenêtre de jeu remplit l'écran, la scène s'agrandit au maximum) et choix de l'agrandisseur d'image */
  toggleFullscreen() {
    const r = this.root, d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (r.requestFullscreen || r.webkitRequestFullscreen || (() => {})).call(r);
  }
  setFilter(f, quiet) {
    this.filter = f; store.set('pc.filter', f); if (this.scaler) this.scaler.mode = f;
    if (!quiet) this.toast(this.T('ui.filter'), this.T('ui.filter.' + f));
  }
  cycleFilter() { const L = ['sharp', 'nearest', 'smooth', 'scale2x', 'scale4x']; this.setFilter(L[(L.indexOf(this.filter) + 1) % L.length]); }
  /* ambiances sonores du décor (boucles + sons ponctuels), interrupteur ≈ mémorisé */
  setAmbience(on, quiet) { this.ambId = null; this.ambOn = !!on; store.set('pc.amb', !!on); this.ambBtn.classList.toggle('off', !on); this.ambBtn.title = this.T ? this.T(on ? 'ui.ambOn' : 'ui.ambOff') : ''; snd.ambSwitch(on); if (!quiet && on) this.ambT = -9; }
  updateAmbience() {
    if (!this.scene || !this.started) return; const n = this.night, deep = n && n.level >= 2 && n.st !== 'wake', sc = this.scene.id, A = deep ? ['night', 0.55] : this.scene.amb || AMB[sc];
    if (A && A[0] !== this.ambId) { this.ambId = A[0]; snd.ambient(A[0], A[1]); } else if (!A && this.ambId) { this.ambId = null; snd.ambStop(); }   /* scène sans ambiance (saison 2) : on coupe celle d'avant */
    if (this.now - this.ambT > 0.3) { this.ambT = this.now; snd.ambVol(this.hiBusy() || this.lowBusy() ? 0.5 : 1); }
    if (this.now >= this.ambNext) { this.ambNext = this.now + 5 + Math.random() * 9; if (!this.hiBusy() && !this.lowBusy() && !this.titleEl) { const k = snd.oneshotFor(sc, deep, !!this.scene.interior); if (k) snd.oneshot(k); } }
  }
  /* centre d'une zone cliquable (rectangle ou polygone) : sert à tourner le héros vers elle */
  center(h) { if (h.rect) return { cx: (h.rect[0] + h.rect[2]) / 2, cy: (h.rect[1] + h.rect[3]) / 2 }; const p = h.poly || [], n = p.length || 1; return { cx: p.reduce((a, q) => a + q[0], 0) / n, cy: p.reduce((a, q) => a + q[1], 0) / n }; }
  /* obstacles mobiles pour la recherche de chemin : les personnages et objets posés au sol */
  blockers() { return this.ents.filter(e => !e.isHero && e.visible !== false && !e.noHot && !e.nhide && e.solid !== false && e.hot).map(e => [e.x, e.y, ...(e.block || this.scene.blockR || [9, 4])]); }   /* e.block : emprise au sol d'un grand objet (voiture, charrette) */

  /* ───────── actions ───────── */
  pick(x, y) {
    for (const a of this.amb || []) if (a.hit && a.hit(x, y)) return { id: a.id, name: 'n.' + a.id };
    const es = this.ents.filter(e => e.visible !== false && e.hot && !e.noHot).sort((a, b) => b.y - a.y);
    for (const e of es) { const r = e.hit || this.entRect(e); if (r && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) return { id: e.id, name: e.name || 'n.' + e.id, at: e.at || [e.x, e.y + 4], isEnt: true, cx: e.x, cy: e.y - 24 }; }
    for (let i = this.hot.length - 1; i >= 0; i--) { const h = this.hot[i], r = h.rect; if (r ? (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) : hitPoly(x, y, h.poly)) return { id: h.id, name: 'n.' + h.id, at: h.at, dir: h.dir, ...this.center(h) }; }
    return null;
  }
  entRect(e) { const im = this.spr(e.spr); if (!im) return null; const s = this.sc(e), w = iw(im) * s, h = ih(im) * s; return [e.x - w / 2, e.y - h, e.x + w / 2, e.y]; }
  /* clic sur la scène : sol = aller (tout de suite) ; objet tenu = l'utiliser ; sinon on attend : relâché vite = aller vers,
     maintenu = pièce des verbes */
  onDown(e) {
    if (this.cine || this.cineEnd) { if (e.button !== 2) this.cineSkip(); return; }
    /* pendant une réplique, un clic ne fait que la passer (et seulement après un court délai de lecture) : il ne lance pas une autre action */
    if (this.bubbles.length && !this.titleEl && e.button !== 2) { if (this.now - (this.sayT0 || 0) > 0.6) this.skip = true; return; }
    if (e.button === 2 || this.locked || this.titleEl) { if (this.locked) this.skip = true; return; }
    snd.unlock(); this.mouse = this.pos(e);
    if (this.night) { wakeNight(this); return; }
    if (!this.started) return;
    const p = this.mouse, tg = this.pick(...p);
    if (this.invOpen) this.toggleInv(false);
    this.setHover(tg);
    if (this.sel) { if (!tg) return this.input(() => this.walkTo(p[0], p[1])); const it = this.sel; this.setSel(null); return this.input(() => this.act('use', tg, it)); }
    if (!tg) return this.input(() => this.walkTo(p[0], p[1]));
    this.startPress(e, tg, null);
  }
  /* clic sur un emplacement du tiroir : objet tenu = « utiliser avec » (ou le reposer) ; sinon relâché vite = le prendre en main,
     maintenu = pièce des verbes de l'objet */
  slotDown(e, id) {
    if (e.button === 2 || this.locked || !this.started || this.titleEl) return; snd.unlock();
    if (this.night) { wakeNight(this); return; }
    if (this.sel) return this.onItem(id);
    this.startPress(e, null, id, this.slotCenter(e.currentTarget));
  }
  slotCenter(b) { const r = this.stage.getBoundingClientRect(), q = b.getBoundingClientRect(); return [(q.left + q.width / 2 - r.left) / r.width * W, (q.top + q.height / 2 - r.top) / r.height * H]; }
  startPress(e, tg, item, anchor) {
    try { e.target.setPointerCapture(e.pointerId); } catch {}
    const p = this.pos(e); this.press = { id: e.pointerId, t0: this.now, tg, item, touch: e.pointerType === 'touch', anchor: anchor || p };
    if (this.press.touch) this.openCoin();                    // au doigt, pas d'attente : la pièce s'ouvre au toucher et reste ouverte
  }
  coinOpen() { return !!this.coin && this.coin.closeT == null; }
  openCoin() {
    const pr = this.press; if (!pr || this.coinOpen()) return; const m = COIN.R + 3, [ax, ay] = pr.anchor;
    this.coin = { cx: clamp(Math.round(ax), m, W - m), cy: clamp(Math.round(ay), m, H - m), t0: this.now, tg: pr.tg, item: pr.item, hi: null, armed: false, ox: this.mouse[0], oy: this.mouse[1] };
    this.clearBarks(); this.hushNarr(); snd.coin(); this.renderLine();
  }
  /* le verbe visé ne s'allume qu'une fois le curseur déplacé depuis l'ouverture (pièce recentrée près d'un bord : pas de choix involontaire) */
  coinMove() {
    const c = this.coin, [x, y] = this.mouse; if (!c.armed && Math.hypot(x - c.ox, y - c.oy) >= 3) c.armed = true;
    const v = c.armed ? coinSector(c, x, y) : null; if (v !== c.hi) { c.hi = v; if (v) snd.click(); this.renderLine(); }
  }
  onUp(e) {
    const pr = this.press; if (!pr || pr.id !== e.pointerId) return; this.press = null;
    if (this.coinOpen()) { const c = this.coin; if (c.hi && e.type !== 'pointercancel') return this.coinPick(c.hi); if (!c.armed) return; return this.closeCoin(); }
    if (e.type === 'pointercancel' || this.locked || this.titleEl) return;
    if (pr.item) return this.onItem(pr.item);
    this.quick(pr.tg);
  }
  /* clic court sur une zone : y aller ; sur le héros ou sur un élément lointain (ciel, montagne), le regarder */
  quick(tg) {
    if (!tg) return;
    if (tg.id === 'hero' || (!tg.at && !tg.isEnt)) return this.input(() => this.act('look', tg));
    this.input(() => this.act('walk', tg));
  }
  coinPick(v) {
    const c = this.coin; if (!c) return; this.closeCoin();
    if (c.item) { if (v === 'use') { if (c.item === 'lamp') return this.input(() => rubLamp(this)); this.setSel(c.item); return; } return this.input(() => this.act(v, { id: c.item, name: 'n.' + c.item, isItem: true })); }
    const tg = c.tg; this.input(() => this.act(tg.id === 'hero' && v === 'use' ? 'look' : v, tg));
  }
  closeCoin() { if (this.coinOpen()) { this.coin.closeT = this.now; this.coin.hi = null; } this.renderLine(); }
  /* clic droit : refermer la pièce, sinon reposer l'objet tenu, sinon ouvrir / fermer la besace */
  onRight() {
    if (this.coinOpen()) return this.closeCoin();
    if (this.locked || this.titleEl || !this.started || this._noUi) { if (this.locked) this.skip = true; return; }
    if (this.sel) return this.setSel(null);
    this.toggleInv();
  }
  onItem(id) {
    snd.click();
    if (this.locked) return;
    if (!this.sel && id === 'lamp') { this.toggleInv(false); return this.input(() => rubLamp(this)); }   // la lampe se frotte d'un clic : le génie des indices
    if (!this.sel) return this.setSel(id);                    // le tiroir reste ouvert : il se referme quand le curseur remonte dans la scène
    if (this.sel === id) return this.setSel(null);
    const it = this.sel; this.setSel(null); this.input(() => this.act('use', { id, name: 'n.' + id, isItem: true }, it));
  }
  faceTg(tg) { const e = tg.isEnt && this.ent(tg.id); if (e) this.face(e.x, e.y - 24); else if (tg.cx !== undefined) this.face(tg.cx, tg.cy); else if (tg.at) this.face(tg.at[0] + (tg.dir === 'l' ? -9 : 9)); }
  /* masque d'opacité d'une image (mis en cache) */
  mask(im) { const c = this.mcache || (this.mcache = new Map()); let m = c.get(im); if (m) return m;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, im.width, im.height).data, a = new Uint8Array(im.width * im.height); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] > 128 ? 1 : 0;
    m = { w: im.width, h: im.height, a }; c.set(im, m); return m; }
  /* part du corps du héros, debout en p, que recouvre le personnage e (au pixel près, d'après la transparence réelle des deux images) */
  cover(p, e) {   /* -> [part du corps, part des pieds (bas du corps)] */
    const hi = this.spr(this.heroStand()), ei = this.spr(this.frame(e)) || this.spr(e.spr); if (!hi || !ei) return [0, 0];
    const hs = this.persp(p[1]) / dn(hi), es = this.sc(e) / dn(ei), Hm = this.mask(hi), Em = this.mask(ei);
    const hx0 = p[0] - hi.width * hs / 2, hy0 = p[1] - hi.height * hs, ex0 = e.x - ei.width * es / 2, ey0 = e.y - (e.bob || 0) - ei.height * es, fy = p[1] - hi.height * hs * 0.2;
    let n = 0, k = 0, nf = 0, kf = 0;
    for (let y = hy0; y < p[1]; y += 1.5) for (let x = hx0; x < hx0 + hi.width * hs; x += 1.5) {
      const u = Math.floor((x - hx0) / hs), v = Math.floor((y - hy0) / hs); if (!Hm.a[v * Hm.w + u]) continue; n++; const foot = y >= fy; if (foot) nf++;
      let eu = Math.floor((x - ex0) / es); const ev = Math.floor((y - ey0) / es); if (e.flip) eu = Em.w - 1 - eu;
      if (eu >= 0 && ev >= 0 && eu < Em.w && ev < Em.h && Em.a[ev * Em.w + eu]) { k++; if (foot) kf++; } }
    return [n ? k / n : 0, nf ? kf / nf : 0];
  }
  /* où se placer pour agir : le point prévu, sauf si le héros y serait caché par un personnage (plus bas à l'écran, donc dessiné devant lui)
     ou fondu dans son corps (même profondeur) ; alors le point libre le plus proche, sur la zone de marche */
  approach(tg) {
    const at = tg.at; if (!at) return at;
    const others = this.ents.filter(e => !e.isHero && e.visible !== false && !e.noHot && e.spr);
    /* gêne visuelle en p : caché par un personnage devant lui (jambes et pieds comptent double), ou fondu dans un personnage juste derrière */
    const over = p => others.reduce((t, e) => { const [f, ff] = this.cover(p, e); return t + (e.y >= p[1] ? f * 3 + ff * 2 : e.y > p[1] - 20 ? f * 1.5 : 0); }, 0);
    if (over(at) < 0.04) return at;
    let best = at, bc = 600 * over(at);
    for (let dy = -8; dy <= 12; dy += 4) for (let dx = -72; dx <= 72; dx += 4) { const p = [at[0] + dx, at[1] + dy], d = Math.abs(dx) + Math.abs(dy) * 2; if (d >= bc || p[0] < 10 || p[0] > W - 10 || !this.walk.inside(p[0], p[1])) continue; const c = d + 600 * over(p); if (c < bc) { bc = c; best = p; } }
    return best;
  }
  async act(verb, tg, item) {
    if (!tg.at && !tg.isItem && !tg.isEnt && verb !== 'look' && verb !== 'walk') { const done = this.scene.on && await this.scene.on(this, verb, tg.id, item); if (!done) await this.fallbackFar(verb, tg, item); return; }
    if (verb === 'walk') { if (!tg.at) { await this.say('hero', 'def.far'); return; } await this.walkTo(...(tg.isEnt ? this.approach(tg) : tg.at));   /* une sortie : on va jusqu'à la porte */ this.faceTg(tg); if (this.scene.on) await this.scene.on(this, 'walk', tg.id); return; }
    if (verb !== 'look' && !tg.isItem && tg.at) { await this.walkTo(...this.approach(tg)); this.faceTg(tg); if ((verb === 'take' || verb === 'use') && this.spr('hero.sReach') && !this.hero.back) { this.hero.pose = 'hero.sReach'; setTimeout(() => { if (this.hero) this.hero.pose = null; }, 1100); } } else if (verb === 'look' && !tg.isItem) this.faceTg(tg);
    const sc = this.scene; let done = false;
    if (sc.on) done = await sc.on(this, verb, tg.id, item);
    if (!done) await this.fallback(verb, tg, item);
    this.save();
  }
  /* cible hors d'atteinte : réplique propre à l'objet tenu (flèche brandie vers la tour), sinon à la cible, sinon « trop loin » */
  async fallbackFar(verb, tg, item) {
    const T = this.T, use = 'use.' + tg.id, k = verb === 'talk' ? ['talk.' + tg.id] : verb === 'take' ? ['take.' + tg.id] : item ? [`use.${item}.${tg.id}`, `use.${tg.id}.${item}`, use] : [use];
    await this.say('hero', k.find(x => T.has(x)) || 'def.far');
  }
  async fallback(verb, tg, item) {
    const T = this.T; let k;
    if (item === 'shout' && this.scene && this.scene.hd) {   /* le Cri sur ce qui n'y réagit pas : l'onde part quand même */
      const e = this.ent(tg.id), h = this.hero, x = e ? e.x : tg.cx ?? h.x + 40, y = e ? e.y - 30 : tg.cy ?? h.y - 40; this.face(x); shout(this, h.x + (h.dir === 'l' ? -14 : 14), h.y - 50, h.dir === 'l' ? -1 : 1); this.shake(400, 3);
      await this.say('hero', [`use.shout.${tg.id}`, 's2.shout.none'].find(x2 => T.has(x2))); return;
    }
    if (verb === 'look') k = ['look.' + tg.id, 'def.look'];
    else if (verb === 'take') k = tg.isItem ? ['def.takeItem'] : ['take.' + tg.id, 'def.take'];
    else if (verb === 'talk') k = ['talk.' + tg.id, 'def.talk'];
    else if (item) k = [`use.${item}.${tg.id}`, `use.${tg.id}.${item}`, item === tg.id ? 'def.useSelf' : 'def.useWith'];
    else k = ['use.' + tg.id, 'def.use'];
    const key = k.find(x => T.has(x)); await this.say('hero', key); if (key.startsWith('def.') && Math.random() < 0.4 && this.now - this.lastNarr > 20) this.narrate('nar.fail');
  }
  key(e) {
    if (this.titleEl) { if (this.titleEl.key) this.titleEl.key(e); return; }
    if (this.cine || this.cineEnd) { if (e.key === 'Escape') this.cineSkip(); else if (e.key === ' ' || e.key === 'Enter') { this.skip = true; e.preventDefault(); } return; }
    const k = e.key;
    if (k === ' ' || k === 'Enter') { this.skip = true; e.preventDefault(); }
    else if (k === 'i' || k === 'I' || k === 'Tab') { e.preventDefault(); if (!this._noUi) this.toggleInv(); }
    else if (k === 'f' || k === 'F') this.toggleFullscreen();
    else if (k === 'g' || k === 'G') this.cycleFilter();
    else if (k === 'Escape') {
      if (this.coinOpen()) this.closeCoin(); else if (this.sel) this.setSel(null); else if (this.invOpen) this.toggleInv(false);
      else if (!(document.fullscreenElement || document.webkitFullscreenElement)) this.showTitle(true);
    }
  }

  /* ───────── mise à jour et rendu ───────── */
  update(dt) {
    this.now += dt; const h = this.hero;
    if (h && this.scene) {
      let moving = false;
      if (h.path.length) {
        const [tx, ty] = h.path[0], dx = tx - h.x, dy = ty - h.y, dist = Math.hypot(dx, dy), s = this.persp(h.y), step = (78 * s * dt + 6 * dt) * (this.scene.walkK || 1); moving = true;
        /* vue selon la direction : profil, trois-quarts (s'il a ces images), face ou dos */
        const q4 = HERO.walkQF && this.spr(HERO.walkQF[0]) && this.spr(HERO.walkQB[0]), v = q4 ? this.viewOf(dx, dy) : (Math.abs(dy) > Math.abs(dx) * 1.6 ? (dy > 0 ? 'f' : 'b') : 's');
        if (Math.abs(dx) > 0.2) h.dir = dx > 0 ? 'r' : 'l';
        if ((v === 'f' || v === 'b') && this.spr('hero.fWalkA') && this.spr('hero.bWalkA')) { h.front = v === 'f'; h.back = v === 'b'; h.quarter = null; }
        else if (v === 'qf' || v === 'qb') { h.front = false; h.back = false; h.quarter = v; }
        else if (Math.abs(dx) > 0.2) { h.front = false; h.back = false; h.quarter = null; }
        if (dist <= step) { h.x = tx; h.y = ty; h.path.shift(); } else { h.x += dx / dist * step; h.y += dy / dist * step; }
        h.walkD += step;
      }
      const s = this.persp(h.y);
      if (!moving) h.quarter = null;   /* à l'arrêt : profil, face ou dos (pas de pose de repos en trois-quarts) */
      h.flip = !this.scene.hd && h.dir === 'l' && !h.front && !h.back;   /* S2 : vues gauche et droite dessinées, pas de miroir */
      if (moving) h.pose = null;
      h.spr = this.heroFrame(h, moving, s);
      if (moving && this.scene.hd) {   /* S2 : le cycle LTX porte le mouvement ; un pas sonore à chaque appui (deux par cycle), selon le sol (scene.steps) */
        h.bob = 0; const A = this.s2anim && this.s2anim[S2.HERO_LIFE.walk[h.back ? 'b' : h.front ? 'f' : h.dir === 'l' ? 'l' : 'r']], ph = A && A.stride ? Math.floor(h.walkD / (A.stride * s * A.n / 2)) : Math.floor(this.now / 0.42);
        if (ph !== h.stepPh) { h.stepPh = ph; if (this.scene.steps) snd.stepFile(this.scene.steps, 6, 0.3 + 0.3 * s); else snd.step(); }
      }   /* S2 : le cycle de marche LTX porte le mouvement */
      else if (moving) { h.bob = Math.abs(Math.sin(h.walkD / (5.2 * s) * Math.PI / 2)) * (this.spr('hero.w1') ? 0.7 : 1.2) * s; if (this.now >= (h.stepT || 0)) { snd.step(); h.stepT = this.now + 0.3; } } else h.bob = 0;
    }
    this.ents.forEach(e => {
      /* déplacement scripté : la vitesse suit la profondeur (plus lent au fond, sauf e.rawSpeed), la vue suit la direction */
      if (e.goal) {
        const [gx, gy, sp] = e.goal, dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy);
        if (e.goalS0 == null) e.goalS0 = this.persp(e.y);
        const st = sp * dt * (e.rawSpeed ? 1 : this.persp(e.y) / e.goalS0);
        if (d <= st) { e.x = gx; e.y = gy; e.goal = null; e.goalS0 = null; } else {
          e.x += dx / d * st; e.y += dy / d * st; e.walkD = (e.walkD || 0) + st;
          const walker = ANIM[e.spr] && ANIM[e.spr].walk;
          if (walker && d > 0.5) { e.view = e.fixView || this.viewOf(dx, dy); e.vr = Math.abs(dy) / Math.max(0.01, Math.abs(dx)); }
          /* il regarde où il va : profil retourné selon le sens de marche et le côté où regarde son image d'origine (FACE_L) ;
             saison 1 : aussi les personnages à une seule image ; saison 2 : vues gauche et droite dessinées, pas de miroir */
          if ((walker || !this.scene.hd) && !e.noTurn && d > 0.5 && Math.abs(dx) > 0.3 && e.view !== 'f' && e.view !== 'b') e.flip = (dx < 0) !== FACE_L.has(e.spr);
        }
      } else if (e.goalS0 != null) e.goalS0 = null;
    });
    for (let i = this.barks.length - 1; i >= 0; i--) { const k = this.barks[i], e = this.ent(k.who); if (!e || this.now > k.end) { k.b.remove(); this.barks.splice(i, 1); } else { const [ax, ay] = this.headPos(e); this.placeBubble(k.b, ax, ay); } }
    if (this.cine) this.cine.update(dt);
    updateFx2(this, dt);
    if (this.titleOn && this.titleArt) this.titleArt.update(dt);
    if (this.scene && this.scene.tick) this.scene.tick(this, dt);
    const s1 = !(this.scene && this.scene.hd);   /* clins d'œil, vitrail et nuit : faits pour la saison 1 */
    if (!this.cine && s1) { updateWinks(this, dt); updateGlass(this, dt); } this.updateAmbience();
    if (this.night) updateNight(this, dt); else if (s1 && this.started && !this.titleEl && this.alive && !this.cine && !this.cineEnd) { if (this.locked || this.bubbles.length || this.barks.length || this.narr) this.lastMove = Math.max(this.lastMove, this.now - IDLE_NIGHT + 25); else if (this.now - this.lastMove > IDLE_NIGHT && !(this.gl && this.gl.run) && document.visibilityState === 'visible' && this.hero) startNight(this); }
    this.pumpNarr(); this.updateUi();
    for (let i = this.waiters.length - 1; i >= 0; i--) { const w = this.waiters[i]; if (w.cond()) { this.waiters.splice(i, 1); w.res(); } }
    const f = this.fx.fade; if (f) { const t = clamp((this.now - f.t0) / f.ms, 0, 1); f.a = f.from + (f.to - f.from) * t; if (t >= 1) { f.a = f.to; if (f.to === 0) delete this.fx.fade; } }
  }
  /* interface par-dessus la scène : masquée hors du jeu libre ; appui long -> pièce ; astuce de la pièce à la première prise en main */
  updateUi() {
    const no = !this.started || this.locked || !!this.titleEl || !!this.titleOn || !!this.cine || !!this.cineEnd || this.askEl.childElementCount > 0 || !!this.night || !!(this.gl && this.gl.run);
    if (no !== this._noUi) { this._noUi = no; this.root.classList.toggle('pc-noui', no); if (no) { this.toggleInv(false); this.closeCoin(); this.press = null; } this.renderLine(); }
    if (this.press && !this.coinOpen() && this.now - this.press.t0 >= HOLD_S) this.openCoin();
    if (!no && this.scene && !this.tipDone) { this.tipDone = true; if (!store.get('pc.coinTip', false)) { store.set('pc.coinTip', true); setTimeout(() => { if (this.alive && !this.titleEl) this.toast(this.T('ui.coin.title'), this.T('ui.coin.tip'), 8000); }, 900); } }
  }
  drawUi() {
    const u = this.uctx, charging = this.press && !this.coin && !this.press.touch && this.now - this.press.t0 > CHARGE_S;
    if (!this.coin && !charging) { if (this.uiDirty) { u.clearRect(0, 0, W, H); this.uiDirty = false; } return; }
    u.clearRect(0, 0, W, H); this.uiDirty = true;
    if (charging) drawCharge(u, this.press.anchor[0], this.press.anchor[1], clamp((this.now - this.press.t0 - CHARGE_S) / (HOLD_S - CHARGE_S), 0, 1));
    if (this.coin && !drawCoin(u, this.coin, this.now)) { this.coin = null; this.renderLine(); }
  }
  draw() {
    this.drawUi();
    const c = this.ctx, k = this.scene && this.scene.hd && !this.s2low && !this.titleOn && !this.cine ? 2 : 1;
    if (k !== this.k) this.setRes(k);
    if (c) c.setTransform(this.k, 0, 0, this.k, 0, 0);
    if (c && this.titleOn && this.titleArt && !this.cine) { this.titleArt.draw(c); if (this.actx && this.now - this.ambT > 0.12) { this.ambT = this.now; this.actx.drawImage(this.cv, 0, 0, 48, 27); } if (this.scaler) this.scaler.render(); return; }
    if (c && this.cine) { this.cine.draw(c); if (this.fx.fade) { c.fillStyle = `rgba(0,0,0,${this.fx.fade.a})`; c.fillRect(0, 0, W, H); } if (this.actx && this.now - this.ambT > 0.12) { this.ambT = this.now; this.actx.drawImage(this.cv, 0, 0, 48, 27); } if (this.scaler) this.scaler.render(); return; }
    if (!c || !this.scene || !this.bg || !this.bg.width) { if (c) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); if (this.scaler) this.scaler.render(); } return; }
    c.save(); const sh = this.fx.shake; if (sh && this.now < sh.end) c.translate(Math.round((Math.random() - .5) * sh.amp * 2), Math.round((Math.random() - .5) * sh.amp * 2));
    if (this.bg) c.drawImage(this.bg, 0, 0, W, H);
    if (this.sky) drawSky(c, this.sky, this.now);
    if (this.amb) this.amb.forEach(a => a.draw(this, c, this.now));
    if (this.scene.hd) { this.drawVideos(c); drawFxBack(this, c); if (this.scene.drawBack) this.scene.drawBack(this, c); }   /* drawBack : dessin d'une scène sur le décor, derrière les acteurs (alphabet du chapitre 21) */
    /* avant-plans du décor : { polys, y } se range en profondeur avec les acteurs (cache ce qui est derrière sa ligne de sol y,
       pas ce qui passe devant) ; un simple polygone reste devant tout le monde ; this.fgExtra : avant-plans posés par un script */
    const fg = [...(this.scene.fg || []), ...(this.fgExtra || [])], occ = fg.filter(o => !Array.isArray(o)).map(o => ({ occ: o, y: o.y, z: 0 }));
    [...this.ents.filter(e => e.visible !== false), ...occ].sort((a, b) => (a.y + (a.z || 0)) - (b.y + (b.z || 0))).forEach(e => (e.occ ? this.drawOcc(e.occ.polys) : this.drawEnt(e)));
    fg.filter(o => Array.isArray(o)).forEach(p => this.drawOcc([p]));
    drawFx2(this, c);
    if (this.scene && this.scene.draw) this.scene.draw(this, c);   /* dessin propre à une scène, par-dessus les acteurs (indicateur « Caché ») */
    c.restore();
    if (!this.scene.hd) { drawWinks(this, c); drawNight(this, c); drawGlass(this, c); }
    if (this.overFx) this.overFx(c);   /* plein écran par-dessus la scène (faux écran de chargement du génie) */
    if (this.fx.fade) { c.fillStyle = `rgba(0,0,0,${this.fx.fade.a})`; c.fillRect(0, 0, W, H); }
    if (this.cardFx) { this.drawCard(c); drawFx2(this, c); }   /* vignette par-dessus le fondu, avec ses étincelles (redessinées devant elle) */
    if (this.actx && this.now - this.ambT > 0.12) { this.ambT = this.now; this.actx.drawImage(this.cv, 0, 0, 48, 27); }
    if (this.scaler) this.scaler.render();
  }
  /* redessine le décor dans ces polygones : ce qu'il contient repasse devant les acteurs déjà dessinés */
  drawOcc(polys) { const c = this.ctx; c.save(); c.beginPath(); polys.forEach(p => { p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }); c.clip(); c.drawImage(this.bg, 0, 0, W, H); c.restore(); }
  drawEnt(e) {
    if (e.sleepF != null) { const k = this.sleepKey(e), sh = k && this.sleepSheet(k); if (sh) return this.drawSleep(e, this.sleepIdx[k], sh); }
    const im = this.spr(this.frame(e)) || this.spr(e.spr); if (!im) return; const c = this.ctx, s = this.sc(e), w = iw(im) * s, h = ih(im) * s;
    if (this.scene && this.scene.hd && !e.fly) return this.drawEnt2(e, im, s, w, h);
    c.save(); c.imageSmoothingEnabled = dn(im) > 1; if (e.alpha !== undefined) c.globalAlpha = e.alpha; if (e.clipY != null) { c.beginPath(); c.rect(0, 0, W, Math.round(e.clipY)); c.clip(); }   /* clipY : caché sous cette ligne (le génie qui sort de terre) */
    c.translate(Math.round(e.x), Math.round(e.y - (e.bob || 0) - (e.float ? e.float + Math.sin(this.now * 2.4) * 2 : 0)));   /* float : flotte au-dessus du sol */
    if (e.nrot) c.translate(0, Math.min(1, Math.abs(e.nrot) / 1.5708) * Math.max(0, h - w) / 2);
    if (e.rot || e.nrot) { c.translate(0, -h / 2); c.rotate((e.rot || 0) + (e.nrot || 0)); c.translate(0, h / 2); }
    if (e.flip) c.scale(-1, 1);
    if (e.talk) c.scale(1, 1 + 0.018 * Math.sin(this.now * 26));
    if (dn(im) > 1) c.drawImage(im, -w / 2, -h, w, h); else c.drawImage(im, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h)); c.restore();
  }
  /* acteur de la saison 2 : ombre douce au sol, puis le sprite éclairé par le décor (scene.light : teinte de nuit, lumière chaude
     d'une lanterne selon la distance) ; e.noLight pour ce qui émet sa propre lumière (fantôme), e.noShadow pour ce qui n'est pas au sol */
  drawEnt2(e, im, s, w, h) {
    const c = this.ctx, a = e.alpha ?? 1, fl = e.float ? e.float + Math.sin(this.now * 2.4) * 2 : 0, low = !(dn(im) > 1);
    if (!e.noShadow && a > 0.05) { const sh = S2.shadowImg(), rx = w * (e.float ? 0.42 : 0.36), ry = rx * 0.24; c.save(); c.globalAlpha = a * (e.float ? 0.16 : 0.42); c.imageSmoothingEnabled = true; c.drawImage(sh, e.x - rx, e.y - ry, rx * 2, ry * 2); c.restore(); }
    let src = im, L = this.scene.light; const dyn = this.ents.filter(o => o.light && o !== e && o.visible !== false && (o.alpha ?? 1) > 0.2);
    if (dyn.length) L = { ...(L || {}), lamps: [...((L && L.lamps) || []), ...dyn.map(o => ({ x: o.x, y: o.y - (o.float || 0), ...o.light }))] };   /* lumière portée par un personnage (fantôme) */
    const scr = this.scratch || (this.scratch = [document.createElement('canvas'), document.createElement('canvas')]);
    if (L && !e.noLight && !low) src = S2.lit(im, L, e, scr);
    if (e.tint) src = S2.tinted(src, e.tint, e.tintK ?? 0.75, scr[1]);   /* couleur imposée (mouton du Wabbajack), luminosité gardée */
    c.save(); c.imageSmoothingEnabled = !low; c.globalAlpha = a;
    if (e.clip) { c.beginPath(); e.clip.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); }   /* e.clip : visible seulement dans ce polygone (serpents au fond d'une fosse) */
    c.translate(low ? Math.round(e.x) : e.x, (low ? Math.round(e.y - (e.bob || 0) - fl) : e.y - (e.bob || 0) - fl));
    if (e.rot) { c.translate(0, -h / 2); c.rotate(e.rot); c.translate(0, h / 2); }
    if (e.flip) c.scale(-1, 1);
    if (low) c.drawImage(src, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h)); else c.drawImage(src, -w / 2, -h, w, h);
    c.restore();
  }
  /* image e.sleepF de la planche du coucher : cadre fixe ancré au sol (ax, ay) ; e.sleepDy l'enfonce (Nazim dans sa fosse), e.sleepClip coupe sous le rebord */
  drawSleep(e, A, sh) {
    const c = this.ctx, s = this.sc(e), i = Math.max(0, Math.min(A.n - 1, e.sleepF | 0)), sx = (i % A.cols) * A.w, sy = Math.floor(i / A.cols) * A.h;
    c.save(); if (e.alpha !== undefined) c.globalAlpha = e.alpha;
    if (e.sleepClip != null) { c.beginPath(); c.rect(0, 0, W, Math.round(e.sleepClip)); c.clip(); }
    c.translate(Math.round(e.x), Math.round(e.y + (e.sleepDy || 0) * s));
    c.drawImage(sh, sx, sy, A.w, A.h, Math.round(-A.ax * s), Math.round(-A.ay * s), Math.round(A.w * s), Math.round(A.h * s)); c.restore();
  }
}
