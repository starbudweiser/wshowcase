/* wCLAUDE : un navigateur que l'IA pilote. Démo : l'agent navigue, tape et clique tout seul sur un site fictif, avec son journal d'outils. */
import { icon } from '../core.js';
import { h, brand, wait, reduced } from '../util.js';
import { t, lang } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download } from '../apps.js';

const T = (fr, en) => (lang() === 'fr' ? fr : en);

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1080, h: 640, minw: 820, minh: 480, bare: true, cls: 'socle',
    build: w => {
      let busy = false;
      const root = h('div', { class: 'wcl' });
      const url = h('div', { class: 'wurl' }, 'https://');
      const field = h('div', { class: 'wfield' }, h('span', { class: 'ph' }, T('Rechercher un produit…', 'Search a product…'))), btn = h('div', { class: 'wbtn' }, T('Chercher', 'Search'));
      const results = h('div', { class: 'wres' }), cursor = h('i', { class: 'acur' });
      const page = h('div', { class: 'wpage' }, h('div', { class: 'wsite' }, h('b', {}, 'Example Shop'), h('span', {}, T('Accueil · Offres · Panier', 'Home · Deals · Cart'))),
        h('h4', {}, T('Trouvez le bon clavier', 'Find the right keyboard')), h('div', { class: 'wsearch' }, field, btn), results, cursor);
      const log = h('div', { class: 'wlog' }), prog = h('i');
      const side = h('aside', { class: 'wagent' }, h('div', { class: 'sh' }, T('AGENT IA', 'AI AGENT')), h('p', { class: 'wtask' }, T('« Trouve un clavier mécanique à moins de 100 € et ouvre la fiche. »', '“Find a mechanical keyboard under $100 and open its page.”')),
        h('div', { class: 'sprog' }, prog), log, h('button', { class: 'sbtn act', onclick: () => go() }, T('LANCER LA TÂCHE', 'RUN THE TASK')));
      root.append(h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('wCLAUDE', app.accent) }), h('div', { class: 'wtabs' }, h('span', { class: 'on' }, 'Example Shop'), h('span', {}, '+')), h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download'))),
        h('div', { class: 'wbody' }, h('div', { class: 'wchrome' }, url), page), side);
      const say = (tool, arg) => { log.append(h('div', { class: 'wl' }, h('b', {}, tool), h('span', { class: 'mono mut' }, arg))); log.scrollTop = log.scrollHeight; sfx.tick(); };
      const moveTo = async el => {
        const pr = page.getBoundingClientRect(), r = el.getBoundingClientRect(), s = w.el.getBoundingClientRect().width / w.w;
        const x = (r.left - pr.left + r.width / 2) / s, y = (r.top - pr.top + r.height / 2) / s;
        cursor.style.opacity = 1; cursor.style.transform = `translate(${x}px,${y}px)`; await wait(reduced() ? 0 : 650);
      };
      const click = async el => { await moveTo(el); cursor.classList.add('click'); sfx.click(); await wait(180); cursor.classList.remove('click'); };
      async function go() {
        if (busy) return; busy = true; log.innerHTML = ''; results.innerHTML = ''; field.innerHTML = ''; field.append(h('span', { class: 'ph' }, T('Rechercher un produit…', 'Search a product…'))); prog.style.width = '0%'; url.textContent = 'https://';
        const p = n => { prog.style.width = n + '%'; };
        say('browser_navigate', 'example.shop'); url.textContent = 'https://example.shop'; p(15); await wait(reduced() ? 0 : 500);
        say('browser_snapshot', T('lit la page', 'reads the page')); p(30); await wait(reduced() ? 0 : 450);
        say('browser_click', 'ref=e7 · ' + T('champ de recherche', 'search field')); await click(field); p(45);
        const q = T('clavier mécanique', 'mechanical keyboard'); field.innerHTML = ''; const txt = h('span', {}); field.append(txt);
        say('browser_type', '"' + q + '"'); for (let i = 1; i <= q.length; i++) { txt.textContent = q.slice(0, i); sfx.tick(); await wait(reduced() ? 0 : 55); } p(60);
        say('browser_click', 'ref=e9 · ' + T('Chercher', 'Search')); await click(btn); p(72);
        [['Keyboard K2', 79], ['Keyboard Pro 65', 94], ['Keyboard TKL Wireless', 129]].forEach(([n, pr], i) => { const c = h('div', { class: 'wcard' }, h('i', {}), h('b', {}, n), h('span', {}, pr + (lang() === 'fr' ? ' €' : ' $'))); results.append(c); c.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 90, fill: 'backwards' }); });
        await wait(reduced() ? 0 : 450); say('browser_snapshot', T('3 résultats', '3 results')); p(84);
        say('browser_click', 'ref=e12 · Keyboard K2'); await click(results.children[0]); results.children[0].classList.add('pick'); p(100);
        sfx.done(); await wait(400); say('✓', T('Fiche ouverte : Keyboard K2, 79 €', 'Page opened: Keyboard K2, $79')); cursor.style.opacity = 0; busy = false;
      }
      return root;
    } });
}
