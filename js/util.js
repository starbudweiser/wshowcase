export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [a, b] of Object.entries(v)) a.startsWith('--') ? e.style.setProperty(a, b) : (e.style[a] = b);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
export const store = {
  get(k, d) { try { const v = localStorage.getItem('wsc.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('wsc.' + k, JSON.stringify(v)); } catch {} }
};
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Nom d'appli : lettres minuscules colorées (règle Socle), sauf dans les menus déroulants */
export const brand = (name, color) => esc(name).replace(/[a-z]+/g, m => `<span class="lc" style="--lc:${color || 'var(--accent)'}">${m}</span>`);
export const APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85-.75 0-1.85-.8-3.05-.8-1.55.02-3 .9-3.8 2.3-1.65 2.85-.42 7 1.15 9.3.8 1.1 1.7 2.35 2.9 2.3 1.15-.05 1.6-.75 3-.75s1.8.75 3.05.72c1.25-.02 2.05-1.1 2.8-2.25.9-1.3 1.25-2.55 1.27-2.6-.03-.02-2.43-.93-2.45-3.7zM14.1 5.9c.65-.8 1.1-1.9.97-3-.95.04-2.1.64-2.77 1.43-.6.7-1.13 1.84-1 2.9 1.05.08 2.1-.53 2.8-1.33z"/></svg>';
