/* Réplique interactive de mSPACES : chaque séparateur est un élément de la barre des menus. Un clic ouvre son menu (Nouveau, Supprimer, style, ouverture de session,
   mises à jour, À propos, Quitter) ; ⌘ + glisser (ou Alt / Ctrl hors Mac) le déplace entre les icônes. Quelques icônes d'exemple (Wi-Fi, batterie…) permettent de former des groupes. */
import { S, h, $, sfx, toast, icon, T, css } from './kit.js';
import { emit, on } from '../core.js';
import { macMenu, macMenuOpen, closeMacMenu, macAlert, aboutWin } from './mDESK.js';

const CSS = 'css/demos/mSPACES.css';
const STYLES = ['space', 'tab', 'dot', 'bar', 'dash', 'long'];
const GLYPH = { space: '', tab: '', dot: '.', bar: '|', dash: '–', long: '—' };
const WIDTH = { space: 10, tab: 34, dot: 10, bar: 10, dash: 14, long: 20 };
const LABEL = { space: ['espace', 'space'], tab: ['tabulation', 'tab'], dot: ['.', '.'], bar: ['|', '|'], dash: ['–', '–'], long: ['—', '—'] };
const sv = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>`;
const IC = [
  ['wifi', ['Wi-Fi', 'Wi-Fi'], sv('<path d="M1.6 6.2a9 9 0 0 1 12.8 0M3.8 8.6a5.8 5.8 0 0 1 8.4 0M6.1 11a2.5 2.5 0 0 1 3.8 0"/><circle cx="8" cy="13.1" r=".7" fill="currentColor"/>')],
  ['bt', ['Bluetooth', 'Bluetooth'], sv('<path d="M4.4 5.2 11 11 8 14V2l3 3-6.6 5.8"/>')],
  ['bat', ['Batterie', 'Battery'], sv('<rect x="1.4" y="4.6" width="11.2" height="6.8" rx="2"/><rect x="3" y="6.2" width="6.2" height="3.6" rx=".7" fill="currentColor" stroke="none"/><path d="M14.3 7v2"/>'), '78 %'],
  ['vpn', ['VPN', 'VPN'], sv('<path d="M8 1.8 13 3.6v4c0 3-2.1 5-5 6.2-2.9-1.2-5-3.2-5-6.2v-4Z"/><path d="m5.8 8 1.7 1.7 3-3.1"/>')],
  ['cloud', ['Synchronisation', 'Sync'], sv('<path d="M4.8 12.2h6.1a3 3 0 0 0 .5-5.9A4 4 0 0 0 3.7 7.3a2.5 2.5 0 0 0 1.1 4.9Z"/>')],
  ['vol', ['Son', 'Sound'], sv('<path d="M2.4 6.2h2.2L8 3.4v9.2L4.6 9.8H2.4Z"/><path d="M10.4 5.8a3.2 3.2 0 0 1 0 4.4M12.3 4.2a5.6 5.6 0 0 1 0 7.6"/>')]
];
let M = null;
on('lang', () => M && M.relang());

export function open(app) {
  css(CSS);
  if (M) return M.hint();
  M = start(app);
}

function start(app) {
  const st = { seps: [{ id: 1, style: 'bar' }], next: 2, login: false, auto: true };
  let gone = false, hinted = false; const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!gone) fn(); }, ms); timers.add(t); };
  const keyOf = id => 'mSPACES:' + id;
  const hintTxt = () => T('Cmd + glisser pour déplacer', 'Hold Cmd and drag to move');

  /* ---------- glisser (⌘ + glisser) : réordonne les éléments de la barre ---------- */
  function drag(el, startEv) {
    const bar = el.parentElement, sx = startEv.clientX; let moved = false;
    const items = () => [...bar.children].filter(c => c.classList.contains('extra') && c !== el && !c.hidden);
    const mv = e => {
      if (!moved && Math.abs(e.clientX - sx) < 4) return; moved = true; el.classList.add('mspaces-drag');
      const sibs = items(), ref = sibs.find(c => { const r = c.getBoundingClientRect(); return e.clientX < r.left + r.width / 2; });
      if (ref) { if (el.nextElementSibling !== ref) bar.insertBefore(el, ref); }
      else { const last = sibs[sibs.length - 1]; if (last && last.nextElementSibling !== el) last.after(el); }
      el.style.transition = 'none'; el.style.transform = ''; const r = el.getBoundingClientRect();
      el.style.transform = `translateX(${(e.clientX - (r.left + r.width / 2)) / S.scale}px)`;
    };
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      el.classList.remove('mspaces-drag'); el.style.transition = 'transform .18s ease'; el.style.transform = ''; later(() => { el.style.transition = ''; }, 220);
      if (!moved) return; el._moved = true; setTimeout(() => { el._moved = false; }, 60);
      const ents = [...S.extras], els = [...bar.children].filter(c => c.classList.contains('extra')), ordered = els.map(c => ents.find(([, v]) => v.el === c)).filter(Boolean);
      const rest = ents.filter(e => !ordered.includes(e)); S.extras.clear(); [...rest, ...ordered].forEach(([k, v]) => S.extras.set(k, v)); sfx.click();
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  function arm(el, nudge) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (e.metaKey || e.altKey || e.ctrlKey) { e.preventDefault(); closeMacMenu(); drag(el, e); return; }
      if (!nudge) return; const sx = e.clientX, sy = e.clientY;
      const t = ev => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { off(); tip(); } }, off = () => { removeEventListener('pointermove', t); removeEventListener('pointerup', off); };
      addEventListener('pointermove', t); addEventListener('pointerup', off);
    });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  let tipped = false;
  const tip = () => { if (tipped) return; tipped = true; toast({ icon: icon('mSPACES'), title: 'mSPACES', body: T('Pour déplacer un séparateur, maintenez ⌘ (Alt ou Ctrl hors Mac) et faites-le glisser.', 'To move a separator, hold ⌘ (Alt or Ctrl off a Mac) and drag it.') }); };

  /* ---------- éléments ---------- */
  function sepEl(s) {
    const el = h('button', { class: 'mb extra mspaces-sep in', type: 'button', 'aria-label': T('Séparateur', 'Separator'), title: hintTxt() });
    el.dataset.id = s.id; paintSep(el, s); arm(el, true);
    el.onclick = () => { if (el._moved) return; macMenuOpen(el) ? closeMacMenu() : (sfx.click(), macMenu(el, menu(s))); };
    later(() => el.classList.remove('in'), 450);
    return el;
  }
  const paintSep = (el, s) => { el.textContent = GLYPH[s.style]; el.style.setProperty('--w', WIDTH[s.style] + 'px'); el.title = hintTxt(); };
  const sepBy = id => st.seps.find(x => x.id === id);
  function add(near) {
    const s = { id: st.next++, style: 'bar' }; st.seps.push(s);
    const el = sepEl(s); el.classList.add('hint');
    const ents = [...S.extras], i = ents.findIndex(([, v]) => v.el === near.el);
    S.extras.clear(); ents.forEach(([k, v], j) => { if (j === i) S.extras.set(keyOf(s.id), { el, quit }); S.extras.set(k, v); });
    if (i < 0) S.extras.set(keyOf(s.id), { el, quit });
    emit('extras'); sfx.pop(); later(() => el.classList.remove('hint'), 3800);
    if (!hinted) { hinted = true; later(tip, 500); }
  }
  function remove(s) {
    if (st.seps.length < 2) { const e = S.extras.get(keyOf(s.id)); if (e) { e.el.classList.remove('mspaces-nudge'); void e.el.offsetWidth; e.el.classList.add('mspaces-nudge'); } return; }
    const e = S.extras.get(keyOf(s.id)); st.seps = st.seps.filter(x => x !== s); S.extras.delete(keyOf(s.id)); emit('extras'); sfx.close(); e && e.el.remove();
  }
  function setStyle(s, style) { s.style = style; const e = S.extras.get(keyOf(s.id)); e && paintSep(e.el, s); sfx.tick(); }
  function menu(s) {
    const e = S.extras.get(keyOf(s.id));
    return [
      { l: T('Nouveau', 'New'), fn: () => add(e) },
      { l: T('Supprimer', 'Remove'), fn: () => remove(s) },
      { sep: 1 }, { head: T('Séparateur', 'Separator') },
      ...STYLES.map(x => ({ l: LABEL[x][T(0, 1)], check: s.style === x, fn: () => setStyle(s, x) })),
      { sep: 1 },
      { l: T('Lancer à l’ouverture de session', 'Launch at Login'), check: st.login, fn: () => { st.login = !st.login; } },
      { l: T('Installer automatiquement les mises à jour', 'Install Updates Automatically'), check: st.auto, fn: () => { st.auto = !st.auto; } },
      { l: T('Rechercher une mise à jour…', 'Check for Updates…'), fn: () => macAlert({ app, title: T('mSPACES est à jour.', 'mSPACES is up to date.') }) },
      { l: T('À propos de mSPACES', 'About mSPACES'), fn: about },
      { sep: 1 },
      { l: T('Quitter mSPACES', 'Quit mSPACES'), fn: quit }
    ];
  }
  function about() {
    aboutWin(app, { h: 420, version: () => T('Version 1.0.0', 'Version 1.0.0'), lines: () => [
      [T('Organisez les icônes de votre barre des menus en groupes grâce à des séparateurs.', 'Organize your menu bar items into groups with separators.')],
      [T('Cliquez sur un séparateur et choisissez « Nouveau séparateur » pour en ajouter un. Pour en déplacer un, maintenez Cmd et faites-le glisser.', 'Click a separator and choose “New Separator” to add another one. To move a separator, hold Command and drag it.'), 'mut']] });
  }

  /* ---------- démarrage ---------- */
  const token = h('i', { hidden: true });
  function quit() {
    if (gone) return; gone = true; closeMacMenu(); timers.forEach(clearTimeout);
    [...S.extras.keys()].filter(k => k === 'mSPACES' || k.startsWith('mSPACES:')).forEach(k => S.extras.delete(k));
    emit('extras'); M = null; sfx.close();
  }
  S.extras.set('mSPACES', { el: token, quit });
  const mk = ([id, name, svg, label]) => {
    const el = h('button', { class: 'mb extra mspaces-ic', type: 'button', tabindex: '-1', title: name[T(0, 1)], 'aria-label': name[T(0, 1)], html: svg }); label && el.append(h('span', { class: 'mspaces-bt' }, label));
    arm(el, false); S.extras.set('mSPACES:ic:' + id, { el, quit }); return el;
  };
  IC.slice(0, 3).forEach(mk);
  const first = sepEl(st.seps[0]); S.extras.set(keyOf(1), { el: first, quit });
  IC.slice(3).forEach(mk);
  emit('extras'); sfx.open();
  first.classList.add('hint'); later(() => first.classList.remove('hint'), 3800);
  toast({ icon: icon('mSPACES'), title: 'mSPACES', body: T('Le séparateur « | » est dans la barre des menus : cliquez dessus pour en ajouter ou changer son style.', 'The “|” separator is in the menu bar: click it to add another or change its style.'), ms: 7000 });
  return {
    hint: () => { const e = S.extras.get(keyOf(st.seps[0].id)); if (e) { e.el.classList.add('hint'); later(() => e.el.classList.remove('hint'), 3800); e.el.click(); } },
    relang: () => { closeMacMenu(); st.seps.forEach(s => { const e = S.extras.get(keyOf(s.id)); e && (e.el.setAttribute('aria-label', T('Séparateur', 'Separator')), paintSep(e.el, s)); });
      IC.forEach(([id, name]) => { const e = S.extras.get('mSPACES:ic:' + id); e && (e.el.title = name[T(0, 1)]); }); }
  };
}
