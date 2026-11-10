/* Réplique interactive de sKYCRASH (interface Socle) : choisir un journal, analyser, lire le verdict. */
import { h, brand, wait, reduced } from '../util.js';
import { t } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download } from '../apps.js';
import { stream, aiBadge } from './ai.js';

const LOGS = [
  { f: 'crash-2026-11-08-21-14-07.log', k: 1, sev: 'dg', culprit: 4, raw: [
    'Skyrim SE v1.6.1170 · CrashLoggerSSE v1.14.0', 'Unhandled exception "EXCEPTION_ACCESS_VIOLATION" at 0x7FF6A4D4A2F0', 'SkyrimSE.exe+0xD4A2F0', 'PROBABLE CALL STACK:',
    '  [0] 0x7FF6A4D4A2F0 SkyrimSE.exe+0xD4A2F0  BSTextureDB::Load', '  [1] 0x7FFA11C04C21 d3d11.dll+0x4C21', '  [2] 0x7FF6A4D1B6C0 SkyrimSE.exe+0xD1B6C0', 'MODULES:', '  Textures\\terrain\\hd_ultra_4k.dds  (4096 x 4096 x 2)', '  Textures\\terrain\\hd_ultra_8k.dds  (8192 x 8192)', 'VRAM: 7 982 / 8 192 Mo' ],
    frames: [['SkyrimSE.exe+0xD4A2F0', 'dg'], ['d3d11.dll+0x4C21', 'wn'], ['EngineFixes.dll+0x1B80', 'ok']], chips: ['VRAM', '2 textures', 'BSA'] },
  { f: 'crash-2026-11-08-20-02-51.log', k: 2, sev: 'wn', culprit: 3, raw: [
    'Skyrim SE v1.6.1170 · CrashLoggerSSE v1.14.0', 'Unhandled exception "EXCEPTION_ACCESS_VIOLATION" at 0x7FFB2C1A9E40', 'PROBABLE CALL STACK:', '  [0] 0x7FFB2C1A9E40 ENBSeries.dll+0x9E40', '  [1] 0x7FF6A4C0F120 SkyrimSE.exe+0xC0F120',
    'PLUGINS:', '  [FE:0A3] RealisticWaterTwo.esp', '  [FE:0A4] CommunityShaders.esp', 'ENB: d3d11.dll 0.505 · Community Shaders 1.1.4' ],
    frames: [['ENBSeries.dll+0x9E40', 'dg'], ['SkyrimSE.exe+0xC0F120', 'wn'], ['CommunityShaders.dll+0x31A0', 'wn']], chips: ['ENB', 'Community Shaders', 'DLL'] },
  { f: 'crash-2026-11-07-18-40-12.log', k: 3, sev: 'wn', culprit: 3, raw: [
    'Skyrim SE v1.6.1170 · CrashLoggerSSE v1.14.0', 'Unhandled exception "EXCEPTION_ACCESS_VIOLATION" at 0x7FF6A4B0A9D0', 'PROBABLE CALL STACK:', '  [0] 0x7FF6A4B0A9D0 SkyrimSE.exe+0xB0A9D0  Actor::UpdateAI',
    '  [1] 0x7FF6A4B09C30 SkyrimSE.exe+0xB09C30', 'FORM: 000A2C94 "Dremora Lord" · script SummonController.pex', 'Stack depth: 14 235 frames (limite 15 000)' ],
    frames: [['SkyrimSE.exe+0xB0A9D0', 'dg'], ['SummonController.pex', 'wn'], ['PapyrusUtil.dll+0x2210', 'ok']], chips: ['Papyrus', 'Script', 'AI'] }
];
const FR = { dg: 'sk.crash', wn: 'sk.suspect', ok: 'sk.sound' };

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 980, h: 620, minw: 760, minh: 480, bare: true, cls: 'socle sk', onclose: w => { w.dead = true; },
    build: w => {
      const wcur = w; let cur = 0, busy = false, done = {};
      const root = h('div', { class: 'skw' });
      const bar = h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('sKYCRASH', app.accent) }),
        h('button', { class: 'sbtn act', onclick: () => analyze() }, t('sk.analyze')));
      const aside = h('aside', { class: 'sside' });
      const rawBox = h('pre', { class: 'sraw', 'aria-label': t('sk.raw') });
      const res = h('div', { class: 'sres' });
      const main = h('main', { class: 'smain' }, h('div', { class: 'shead' }, h('h3', { class: 'sfile' }), h('span', { class: 'mut', id: 'smeta' })),
        h('div', { class: 'scols' }, h('section', { class: 'sraws' }, h('div', { class: 'sh' }, t('sk.raw')), rawBox), res));
      root.append(bar, aside, main);
      const drawSide = () => {
        aside.innerHTML = ''; aside.append(h('div', { class: 'sh' }, t('sk.logs')));
        LOGS.forEach((l, i) => aside.append(h('button', { class: 'sit' + (i === cur ? ' on' : ''), onclick: () => pick(i) }, h('span', {}, l.f.replace('crash-2026-', '').replace('.log', '')), done[i] ? h('i', { class: l.sev }, '●') : null)));
        aside.append(h('div', { class: 'sh sp' }, t('sk.hint')));
      };
      const empty = () => { res.innerHTML = ''; res.append(h('div', { class: 'scard center' }, h('p', { class: 'mut' }, t('sk.empty')), h('button', { class: 'sbtn act', onclick: () => analyze() }, t('sk.analyze')))); };
      function pick(i) {
        if (busy) return; cur = i; sfx.tick(); const l = LOGS[i];
        main.querySelector('.sfile').textContent = l.f; main.querySelector('#smeta').textContent = `${l.raw.length} ${t('sk.lines')}`;
        rawBox.textContent = l.raw.join('\n'); drawSide(); done[i] ? showResult(i, true) : empty();
      }
      async function analyze() {
        if (busy) return; busy = true; const l = LOGS[cur];
        res.innerHTML = ''; const bar2 = h('i'); const stg = h('p', { class: 'mut' }, t('sk.s1'));
        res.append(h('div', { class: 'scard center' }, stg, h('div', { class: 'sprog' }, bar2))); sfx.click();
        rawBox.innerHTML = ''; const quick = reduced() ? 0 : 1;
        for (let i = 0; i < l.raw.length; i++) {
          const ln = h('span', { class: 'rl' }, l.raw[i] + '\n'); rawBox.append(ln); rawBox.scrollTop = rawBox.scrollHeight;
          bar2.style.width = ((i + 1) / l.raw.length * 100) + '%'; stg.textContent = t(i < l.raw.length * 0.35 ? 'sk.s1' : i < l.raw.length * 0.7 ? 'sk.s2' : 'sk.s3');
          if (quick) { sfx.tick(); await wait(150); }
        }
        rawBox.children[l.culprit] && rawBox.children[l.culprit].classList.add('hit');
        await wait(quick ? 250 : 0); done[cur] = true; busy = false; showResult(cur); drawSide(); sfx.done();
      }
      function showResult(i, instant) {
        const l = LOGS[i]; res.innerHTML = '';
        rawBox.innerHTML = ''; l.raw.forEach((x, j) => rawBox.append(h('span', { class: 'rl' + (j === l.culprit ? ' hit' : '') }, x + '\n')));
        const verdict = h('div', { class: 'scard' }, h('div', { class: 'vtop' }, h('span', { class: 'pill ' + l.sev }, t(l.sev === 'dg' ? 'sk.high' : 'sk.medium')), h('b', {}, t(`sk.v${l.k}.t`))),
          h('p', { class: 'acc' }, t('sk.cause')), h('p', {}, t(`sk.v${l.k}.d`)), h('div', { class: 'chips' }, l.chips.map(c => h('span', { class: 'chip' }, c))),
          h('p', { class: 'mut adv' }, t(`sk.v${l.k}.a`)));
        const fr = h('div', { class: 'scard tight' }, h('div', { class: 'sh' }, t('sk.frames')), l.frames.map(([n, s]) => h('div', { class: 'frow' }, h('span', { class: 'mono' }, n), h('span', { class: s }, t(FR[s])))));
        const aiCard = h('div', { class: 'aicard hid' }, h('div', { class: 'aihd' }, aiBadge(t('sk.aiTitle')), h('span', { class: 'mut' }, 'Claude')), h('p', {}));
        const aiBtn = h('button', { class: 'sbtn acc', onclick: async () => { aiBtn.disabled = true; sfx.click(); aiCard.classList.remove('hid'); await stream(aiCard.querySelector('p'), t('sk.ai' + l.k), { alive: () => !wcur.dead }); aiBtn.disabled = false; sfx.done(); } }, t('sk.aiBtn'));
        res.append(verdict, fr, aiCard, h('div', { class: 'sact' }, aiBtn, h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download'))));
        if (!instant) [verdict, fr].forEach((e, n) => e.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: n * 110, fill: 'backwards', easing: 'ease-out' }));
      }
      pick(0); return root;
    } });
}
