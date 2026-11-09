/* Réplique interactive de mTRANSLATOR (interface Socle) : traduire les chaînes d'un mod, corriger, valider. */
import { h, brand, wait, reduced } from '../util.js';
import { t, lang } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download } from '../apps.js';

const ROWS = [
  ['WEAP_0001', 'Iron Sword', { fr: 'Épée en fer', es: 'Espada de hierro', it: 'Spada di ferro' }],
  ['WEAP_0001_D', 'A sturdy blade forged in the fires of Whiterun.', { fr: 'Une lame solide forgée dans les feux de Blancherive.', es: 'Una hoja resistente forjada en los fuegos de Carrera Blanca.', it: 'Una lama robusta forgiata nei fuochi di Whiterun.' }],
  ['DLG_0112', 'Dragonborn, your destiny awaits.', { fr: 'Dovahkiin, votre destin vous attend.', es: 'Sangre de Dragón, tu destino te espera.', it: 'Sangue di Drago, il tuo destino ti attende.' }],
  ['PERK_0040', 'Health regenerates 25% faster.', { fr: 'La santé se régénère 25 % plus vite.', es: 'La salud se regenera un 25 % más rápido.', it: 'La salute si rigenera il 25% più in fretta.' }],
  ['MSG_0007', 'You have discovered a new location.', { fr: 'Vous avez découvert un nouveau lieu.', es: 'Has descubierto un nuevo lugar.', it: 'Hai scoperto un nuovo luogo.' }],
  ['MSG_0019', 'The gate is locked. You need a key.', { fr: 'La grille est verrouillée. Il vous faut une clé.', es: 'La verja está cerrada. Necesitas una llave.', it: 'Il cancello è chiuso. Ti serve una chiave.' }],
  ['QUST_0003', '[Quest] Retrieve the Dragonstone', { fr: '[Quête] Récupérer la Pierre du dragon', es: '[Misión] Recuperar la Piedra del dragón', it: '[Missione] Recuperare la Pietra del drago' }],
  ['SHOUT_01', 'Fus Ro Dah!', { fr: 'Fus Ro Dah !', es: '¡Fus Ro Dah!', it: 'Fus Ro Dah!' }]
];
const GLOSS = { fr: ['Whiterun → Blancherive', 'Dragonborn → Dovahkiin'], es: ['Whiterun → Carrera Blanca', 'Dragonborn → Sangre de Dragón'], it: ['Whiterun → Whiterun', 'Dragonborn → Sangue di Drago'] };

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1000, h: 620, minw: 800, minh: 480, bare: true, cls: 'socle tr',
    build: w => {
      let target = ['fr', 'es', 'it'].includes(lang()) ? lang() : 'fr', busy = false;
      const state = ROWS.map(() => ({ s: 'wait', v: '' }));
      const root = h('div', { class: 'skw trw' });
      const prog = h('i'), count = h('span', { class: 'mut' });
      const tbody = h('div', { class: 'ttab' });
      const seg = h('div', { class: 'ssegs' });
      const bar = h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('mTRANSLATOR', app.accent) }), seg,
        h('button', { class: 'sbtn act', onclick: () => translate() }, t('tr.translate')));
      const aside = h('aside', { class: 'sside' }, h('div', { class: 'sh' }, t('tr.project')),
        h('button', { class: 'sit on' }, 'IronholdArmory.esp'), h('button', { class: 'sit' }, 'WinterfellQuests.esp'), h('button', { class: 'sit' }, 'AmberRealm.esm'),
        h('div', { class: 'sh sp' }, t('tr.glossary')), h('div', { class: 'gl' }, ...GLOSS[target].map(g => h('span', { class: 'chip' }, g))));
      const head = h('div', { class: 'shead' }, h('h3', {}, 'IronholdArmory.esp'), h('div', { class: 'tprog' }, h('div', { class: 'sprog' }, prog), count));
      const foot = h('div', { class: 'sfoot' }, h('button', { class: 'sbtn', onclick: () => validate() }, t('tr.validate')), h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download')));
      root.append(bar, aside, h('main', { class: 'smain' }, head, h('div', { class: 'tcols' }, h('span', {}, 'ID'), h('span', {}, 'EN'), h('span', {}, target.toUpperCase()), h('span', {}, t('tr.status'))), tbody, foot));
      const drawSeg = () => { seg.innerHTML = ''; seg.append(h('span', { class: 'mut' }, 'EN →'), ...['fr', 'es', 'it'].map(l => h('button', { class: l === target ? 'on' : '', onclick: () => { if (busy) return; target = l; sfx.tick(); reset(); } }, l.toUpperCase()))); };
      const stat = s => t('tr.' + s);
      function draw() {
        tbody.innerHTML = '';
        ROWS.forEach(([id, src, tr], i) => {
          const st = state[i];
          const cell = h('div', { class: 'tcell' + (st.s === 'wait' ? ' empty' : ''), contenteditable: st.s === 'wait' ? 'false' : 'true', spellcheck: 'false', 'aria-label': target.toUpperCase() }, st.v);
          cell.addEventListener('input', () => { state[i].v = cell.textContent; state[i].s = 'edit'; sfx.tick(); const c = tbody.children[i].querySelector('.chip'); c.className = 'chip s-edit'; c.textContent = stat('edit'); });
          tbody.append(h('div', { class: 'trow' }, h('span', { class: 'mono mut' }, id), h('span', {}, src), cell, h('span', { class: 'chip s-' + st.s }, stat(st.s))));
        });
        const n = state.filter(s => s.s !== 'wait').length; count.textContent = `${n} / ${ROWS.length}`; prog.style.width = (n / ROWS.length * 100) + '%';
      }
      function reset() { state.forEach(s => { s.s = 'wait'; s.v = ''; }); drawSeg(); aside.querySelector('.gl').replaceChildren(...GLOSS[target].map(g => h('span', { class: 'chip' }, g))); root.querySelector('.tcols').children[2].textContent = target.toUpperCase(); draw(); }
      async function translate() {
        if (busy) return; busy = true; sfx.click();
        for (let i = 0; i < ROWS.length; i++) {
          if (state[i].s !== 'wait') continue;
          const txt = ROWS[i][2][target]; state[i].s = 'done'; state[i].v = '';
          draw(); const cell = tbody.children[i].querySelector('.tcell'); cell.classList.remove('empty'); cell.setAttribute('contenteditable', 'false');
          if (reduced()) { cell.textContent = txt; } else for (let c = 1; c <= txt.length; c += 2) { cell.textContent = txt.slice(0, c); if (c % 6 === 1) sfx.tick(); await wait(14); }
          state[i].v = txt; draw(); await wait(reduced() ? 0 : 90);
        }
        busy = false; sfx.done();
      }
      function validate() {
        if (state.some(s => s.s === 'wait')) { translate().then(validate); return; }
        state.forEach(s => { s.s = 'ok'; }); draw(); sfx.pop();
      }
      drawSeg(); draw(); return root;
    } });
}
