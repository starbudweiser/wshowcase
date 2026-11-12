/* Témoignage rapide : envoie un message sur le Discord du kit via un webhook (salon dédié). Garde-fous : champ piège, délai, plafond par jour, aucune mention possible. */
import { h } from './util.js';
import * as wm from './wm.js';
import { lang } from './i18n.js';
import { S } from './core.js';

const T = (fr, en) => (lang() === 'fr' ? fr : en);
const MAX = 800, GAP = 60e3, PER_DAY = 3;
const KEY = 'wsc.discord.sent';
const sent = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]').filter(t => Date.now() - t < 864e5); } catch { return []; } };
const remember = () => { try { localStorage.setItem(KEY, JSON.stringify([...sent(), Date.now()])); } catch {} };
let CFG = null;

export async function open() {
  if (!CFG) { try { CFG = await (await fetch('data/discord.json')).json(); } catch { CFG = {}; } }
  let root, rating = 0, state = 'form';
  const w = wm.open({
    id: 'discord', appId: 'discord', title: T('Témoignage', 'Testimonial'), w: 520, h: 600, cls: 'dcw', space: 'skyrim',
    build: () => { root = h('div', { class: 'dc' }); draw(); return root; },
    onclose: () => { if (root) root.innerHTML = ''; }
  });
  function draw() {
    root.innerHTML = '';
    if (state === 'done') {
      root.append(h('div', { class: 'dc-done' }, h('div', { class: 'dc-ok' }, '✓'), h('b', {}, T('Merci pour votre témoignage !', 'Thank you for your testimonial!')),
        h('p', {}, T('Il vient d’arriver sur notre Discord.', 'It just landed on our Discord.')),
        CFG.invite ? h('a', { href: CFG.invite, target: '_blank', rel: 'noopener', 'data-nodrag': '' }, T('Rejoindre le Discord', 'Join the Discord') + ' ↗') : null,
        h('button', { class: 'dc-btn ghost', 'data-nodrag': '', onclick: () => { state = 'form'; rating = 0; draw(); } }, T('Écrire un autre message', 'Write another'))));
      return;
    }
    const name = h('input', { type: 'text', maxlength: 32, placeholder: T('Votre pseudo (facultatif)', 'Your name (optional)'), 'data-nodrag': '' });
    const app = h('select', { 'data-nodrag': '' }, h('option', { value: '' }, T('— Application concernée (facultatif)', '— App concerned (optional)')), ...S.apps.map(a => h('option', { value: a.id }, a.id)));
    const msg = h('textarea', { maxlength: MAX, rows: 6, placeholder: T('Ce que vous avez aimé, ce que vous faites avec le kit…', 'What you liked, what you do with the kit…'), 'data-nodrag': '' });
    const trap = h('input', { type: 'text', tabindex: -1, autocomplete: 'off', class: 'dc-trap', 'aria-hidden': 'true' });
    const cnt = h('span', { class: 'dc-cnt' }, `0/${MAX}`), err = h('div', { class: 'dc-err' });
    const stars = h('div', { class: 'dc-stars', role: 'radiogroup' }, [1, 2, 3, 4, 5].map(n => h('button', { type: 'button', class: 'dc-st', 'aria-label': `${n}/5`, 'data-nodrag': '', onclick: () => { rating = rating === n ? 0 : n; paint(); } }, '★')));
    const paint = () => [...stars.children].forEach((b, i) => b.classList.toggle('on', i < rating));
    const btn = h('button', { class: 'dc-btn', type: 'button', 'data-nodrag': '' }, T('Envoyer', 'Send'));
    msg.addEventListener('input', () => { cnt.textContent = `${msg.value.length}/${MAX}`; });
    btn.onclick = async () => {
      err.textContent = '';
      const text = msg.value.trim();
      if (trap.value) return;
      if (!CFG.webhook) { err.textContent = T('L’envoi n’est pas encore activé sur ce site.', 'Sending is not enabled on this site yet.'); return; }
      if (text.length < 10) { err.textContent = T('Votre message est un peu court (10 caractères minimum).', 'Your message is a bit short (10 characters minimum).'); return; }
      const log = sent();
      if (log.length >= PER_DAY) { err.textContent = T('Limite atteinte : 3 messages par jour.', 'Limit reached: 3 messages per day.'); return; }
      if (log.length && Date.now() - Math.max(...log) < GAP) { err.textContent = T('Patientez une minute avant un nouvel envoi.', 'Please wait a minute before sending again.'); return; }
      btn.disabled = true; btn.textContent = T('Envoi…', 'Sending…');
      const fields = [];
      if (app.value) fields.push({ name: T('Application', 'App'), value: app.value, inline: true });
      if (rating) fields.push({ name: T('Note', 'Rating'), value: '★'.repeat(rating) + '☆'.repeat(5 - rating), inline: true });
      fields.push({ name: T('Langue', 'Language'), value: lang().toUpperCase(), inline: true });
      try {
        const r = await fetch(CFG.webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          username: 'wSHOWCASE', allowed_mentions: { parse: [] },
          embeds: [{ title: T('Nouveau témoignage', 'New testimonial'), description: text.slice(0, MAX), color: 0x5865f2, fields, footer: { text: (name.value.trim() || T('Anonyme', 'Anonymous')).slice(0, 32) + ' · wSHOWCASE' } }]
        }) });
        if (!r.ok) throw new Error(r.status);
        remember(); state = 'done'; draw();
      } catch { err.textContent = T('L’envoi a échoué. Réessayez dans un instant.', 'Sending failed. Please try again shortly.'); btn.disabled = false; btn.textContent = T('Envoyer', 'Send'); }
    };
    root.append(
      h('div', { class: 'dc-head' }, h('img', { src: 'assets/icons/discord.png', alt: '' }), h('div', {}, h('b', {}, T('Laissez un témoignage', 'Leave a testimonial')), h('span', {}, T('Votre message arrive directement sur notre Discord.', 'Your message goes straight to our Discord.')))),
      h('label', {}, T('Pseudo', 'Name'), name), h('label', {}, T('Application', 'App'), app),
      h('label', {}, T('Note', 'Rating'), stars),
      h('label', {}, T('Message', 'Message'), msg, cnt), trap, err,
      h('div', { class: 'dc-foot' }, h('small', {}, T('Le message est public sur le salon des témoignages. N’indiquez aucune donnée personnelle.', 'The message is shown in our testimonials channel. Do not include personal data.')), btn));
  }
  w.render = draw;
  return w;
}
