/* kEYKODES : appuyez sur une touche, la démo affiche son code DirectInput (scan code) et son code ImGui (1.89 et suivants). */
import { S } from '../core.js';
import { h, brand } from '../util.js';
import { t } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download } from '../apps.js';

const DIK = { Escape: 1, Digit1: 2, Digit2: 3, Digit3: 4, Digit4: 5, Digit5: 6, Digit6: 7, Digit7: 8, Digit8: 9, Digit9: 10, Digit0: 11, Minus: 12, Equal: 13, Backspace: 14, Tab: 15, KeyQ: 16, KeyW: 17, KeyE: 18, KeyR: 19, KeyT: 20, KeyY: 21, KeyU: 22, KeyI: 23, KeyO: 24, KeyP: 25, BracketLeft: 26, BracketRight: 27, Enter: 28, ControlLeft: 29, KeyA: 30, KeyS: 31, KeyD: 32, KeyF: 33, KeyG: 34, KeyH: 35, KeyJ: 36, KeyK: 37, KeyL: 38, Semicolon: 39, Quote: 40, Backquote: 41, ShiftLeft: 42, Backslash: 43, KeyZ: 44, KeyX: 45, KeyC: 46, KeyV: 47, KeyB: 48, KeyN: 49, KeyM: 50, Comma: 51, Period: 52, Slash: 53, ShiftRight: 54, NumpadMultiply: 55, AltLeft: 56, Space: 57, CapsLock: 58, F1: 59, F2: 60, F3: 61, F4: 62, F5: 63, F6: 64, F7: 65, F8: 66, F9: 67, F10: 68, NumLock: 69, ScrollLock: 70, Numpad7: 71, Numpad8: 72, Numpad9: 73, NumpadSubtract: 74, Numpad4: 75, Numpad5: 76, Numpad6: 77, NumpadAdd: 78, Numpad1: 79, Numpad2: 80, Numpad3: 81, Numpad0: 82, NumpadDecimal: 83, F11: 87, F12: 88, NumpadEnter: 156, ControlRight: 157, NumpadDivide: 181, AltRight: 184, Home: 199, ArrowUp: 200, PageUp: 201, ArrowLeft: 203, ArrowRight: 205, End: 207, ArrowDown: 208, PageDown: 209, Insert: 210, Delete: 211 };
const IMG = { Tab: 512, ArrowLeft: 513, ArrowRight: 514, ArrowUp: 515, ArrowDown: 516, PageUp: 517, PageDown: 518, Home: 519, End: 520, Insert: 521, Delete: 522, Backspace: 523, Space: 524, Enter: 525, Escape: 526, ControlLeft: 527, ShiftLeft: 528, AltLeft: 529, MetaLeft: 530, ControlRight: 531, ShiftRight: 532, AltRight: 533, MetaRight: 534, ContextMenu: 535, Quote: 596, Comma: 597, Minus: 598, Period: 599, Slash: 600, Semicolon: 601, Equal: 602, BracketLeft: 603, Backslash: 604, BracketRight: 605, Backquote: 606, CapsLock: 607, ScrollLock: 608, NumLock: 609, PrintScreen: 610, Pause: 611, NumpadDecimal: 622, NumpadDivide: 623, NumpadMultiply: 624, NumpadSubtract: 625, NumpadAdd: 626, NumpadEnter: 627 };
for (let i = 0; i < 10; i++) { IMG['Digit' + i] = 536 + i; IMG['Numpad' + i] = 612 + i; }
for (let i = 0; i < 26; i++) IMG['Key' + String.fromCharCode(65 + i)] = 546 + i;
for (let i = 1; i <= 12; i++) IMG['F' + i] = 571 + i;

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 880, h: 580, minw: 700, minh: 460, bare: true, cls: 'socle',
    onclose: w => removeEventListener('keydown', w.kh, true),
    build: w => {
      const root = h('div', { class: 'skw nosb' }), main = h('main', { class: 'smain' });
      const cap = h('div', { class: 'kcap' }, t('kk.press')), codes = h('div', { class: 'kcodes' });
      const big = h('div', { class: 'kbig' }, cap, codes), hist = h('div', { class: 'khist' });
      root.append(h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('kEYKODES', app.accent) }),
        h('button', { class: 'sbtn', style: { marginLeft: 'auto' }, onclick: () => download(app), disabled: !app.download }, t('f.download'))), main);
      main.append(big, h('div', { class: 'sh' }, t('kk.history')), hist, h('p', { class: 'mut small' }, t('kk.note')));
      const rows = [];
      w.kh = e => {
        if (S.active !== w || (e.target.closest && e.target.closest('input,[contenteditable]'))) return;
        if (e.metaKey && e.code !== 'MetaLeft' && e.code !== 'MetaRight') return;
        e.preventDefault(); e.stopPropagation();
        const dik = DIK[e.code], img = IMG[e.code];
        const name = e.code.startsWith('Key') ? e.code.slice(3) : e.code.startsWith('Digit') ? e.code.slice(5) : e.code;
        cap.textContent = name;
        codes.replaceChildren(
          h('div', { class: 'kc' }, h('small', { class: 'mut' }, t('kk.di')), h('b', {}, dik ?? '—'), h('span', { class: 'mono mut' }, dik != null ? '0x' + dik.toString(16).toUpperCase().padStart(2, '0') : '')),
          h('div', { class: 'kc' }, h('small', { class: 'mut' }, t('kk.imgui')), h('b', {}, img ?? '—'), h('span', { class: 'mono mut' }, img != null ? 'ImGuiKey_' + name : '')));
        big.animate([{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 160 }); sfx.tick();
        rows.unshift([name, dik, img]); rows.length = Math.min(rows.length, 8);
        hist.replaceChildren(...rows.map(([n, d, i]) => h('div', { class: 'hrow' }, h('b', {}, n), h('span', { class: 'mono mut' }, 'DIK ' + (d ?? '—')), h('span', { class: 'mono mut' }, 'ImGui ' + (i ?? '—')))));
      };
      addEventListener('keydown', w.kh, true);
      return root;
    } });
}
