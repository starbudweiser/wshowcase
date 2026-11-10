/* kEYKODES : réplique de l'appli. Appuyez sur une touche (ou cliquez, ou tournez la molette) : code DirectInput pour les .ini de Skyrim,
   ImGuiKey et accord avec les modificateurs tenus, selon la position physique de la touche (comme sous Windows). Tables reprises de l'appli. */
import { S } from '../core.js';
import { h, brand } from '../util.js';
import { sfx } from '../audio.js';
import { T, css, wm, download } from './kit.js';

/* DirectInput : code décimal -> [nom (clé française), nom ImGuiKey]. */
const K = {1:['Échap','Escape'],2:['1','Num1'],3:['2','Num2'],4:['3','Num3'],5:['4','Num4'],6:['5','Num5'],7:['6','Num6'],8:['7','Num7'],9:['8','Num8'],10:['9','Num9'],11:['0','Num0'],12:['Moins','Minus'],13:['Égal','Equal'],14:['Retour arrière','Backspace'],15:['Tab','Tab'],16:['Q','Q'],17:['W','W'],18:['E','E'],19:['R','R'],20:['T','T'],21:['Y','Y'],22:['U','U'],23:['I','I'],24:['O','O'],25:['P','P'],26:['Crochet gauche','LeftBracket'],27:['Crochet droit','RightBracket'],28:['Entrée','Enter'],29:['Ctrl gauche','LeftCtrl'],30:['A','A'],31:['S','S'],32:['D','D'],33:['F','F'],34:['G','G'],35:['H','H'],36:['J','J'],37:['K','K'],38:['L','L'],39:['Point-virgule','Semicolon'],40:['Apostrophe','Apostrophe'],41:['Grave','GraveAccent'],42:['Maj gauche','LeftShift'],43:['Barre oblique inverse','Backslash'],44:['Z','Z'],45:['X','X'],46:['C','C'],47:['V','V'],48:['B','B'],49:['N','N'],50:['M','M'],51:['Virgule','Comma'],52:['Point','Period'],53:['Barre oblique','Slash'],54:['Maj droite','RightShift'],55:['Pavé ×','KeypadMultiply'],56:['Alt gauche (Option)','LeftAlt'],57:['Espace','Space'],58:['Verr. Maj','CapsLock'],59:['F1','F1'],60:['F2','F2'],61:['F3','F3'],62:['F4','F4'],63:['F5','F5'],64:['F6','F6'],65:['F7','F7'],66:['F8','F8'],67:['F9','F9'],68:['F10','F10'],69:['Verr. Num (Clear)','NumLock'],71:['Pavé 7','Keypad7'],72:['Pavé 8','Keypad8'],73:['Pavé 9','Keypad9'],74:['Pavé −','KeypadSubtract'],75:['Pavé 4','Keypad4'],76:['Pavé 5','Keypad5'],77:['Pavé 6','Keypad6'],78:['Pavé +','KeypadAdd'],79:['Pavé 1','Keypad1'],80:['Pavé 2','Keypad2'],81:['Pavé 3','Keypad3'],82:['Pavé 0','Keypad0'],83:['Pavé .','KeypadDecimal'],86:['Touche < >',null],87:['F11','F11'],88:['F12','F12'],100:['F13','F13'],101:['F14','F14'],102:['F15','F15'],141:['Pavé =','KeypadEqual'],156:['Pavé Entrée','KeypadEnter'],157:['Ctrl droit','RightCtrl'],181:['Pavé /','KeypadDivide'],184:['Alt droit (Option)','RightAlt'],199:['Début','Home'],200:['Flèche haut','UpArrow'],201:['Page haut','PageUp'],203:['Flèche gauche','LeftArrow'],205:['Flèche droite','RightArrow'],207:['Fin','End'],208:['Flèche bas','DownArrow'],209:['Page bas','PageDown'],210:['Insert (Help)','Insert'],211:['Suppr','Delete'],219:['Windows gauche (Cmd)','LeftSuper'],220:['Windows droite (Cmd)','RightSuper']};
/* Noms traduits : clé française -> [en, it, es]. */
const TR = {'Échap':['Esc','Esc','Esc'],'Moins':['Minus','Meno','Menos'],'Égal':['Equals','Uguale','Igual'],'Retour arrière':['Backspace','Backspace','Retroceso'],'Crochet gauche':['Left bracket','Parentesi quadra sinistra','Corchete izquierdo'],'Crochet droit':['Right bracket','Parentesi quadra destra','Corchete derecho'],'Entrée':['Enter','Invio','Intro'],'Ctrl gauche':['Left Ctrl','Ctrl sinistro','Ctrl izquierdo'],'Point-virgule':['Semicolon','Punto e virgola','Punto y coma'],'Apostrophe':['Apostrophe','Apostrofo','Apóstrofo'],'Grave':['Grave accent','Accento grave','Acento grave'],'Maj gauche':['Left Shift','Maiusc sinistro','Mayús izquierda'],'Barre oblique inverse':['Backslash','Barra rovesciata','Barra invertida'],'Virgule':['Comma','Virgola','Coma'],'Point':['Period','Punto','Punto'],'Barre oblique':['Slash','Barra','Barra'],'Maj droite':['Right Shift','Maiusc destro','Mayús derecha'],'Pavé ×':['Numpad ×','Tastierino ×','Teclado num. ×'],'Alt gauche (Option)':['Left Alt (Option)','Alt sinistro (Opzione)','Alt izquierdo (Opción)'],'Espace':['Space','Spazio','Espacio'],'Verr. Maj':['Caps Lock','Bloc Maiusc','Bloq Mayús'],'Verr. Num (Clear)':['Num Lock (Clear)','Bloc Num (Clear)','Bloq Num (Clear)'],'Pavé 7':['Numpad 7','Tastierino 7','Teclado num. 7'],'Pavé 8':['Numpad 8','Tastierino 8','Teclado num. 8'],'Pavé 9':['Numpad 9','Tastierino 9','Teclado num. 9'],'Pavé −':['Numpad −','Tastierino −','Teclado num. −'],'Pavé 4':['Numpad 4','Tastierino 4','Teclado num. 4'],'Pavé 5':['Numpad 5','Tastierino 5','Teclado num. 5'],'Pavé 6':['Numpad 6','Tastierino 6','Teclado num. 6'],'Pavé +':['Numpad +','Tastierino +','Teclado num. +'],'Pavé 1':['Numpad 1','Tastierino 1','Teclado num. 1'],'Pavé 2':['Numpad 2','Tastierino 2','Teclado num. 2'],'Pavé 3':['Numpad 3','Tastierino 3','Teclado num. 3'],'Pavé 0':['Numpad 0','Tastierino 0','Teclado num. 0'],'Pavé .':['Numpad .','Tastierino .','Teclado num. .'],'Pavé =':['Numpad =','Tastierino =','Teclado num. ='],'Pavé Entrée':['Numpad Enter','Invio tastierino','Intro teclado num.'],'Ctrl droit':['Right Ctrl','Ctrl destro','Ctrl derecho'],'Pavé /':['Numpad /','Tastierino /','Teclado num. /'],'Alt droit (Option)':['Right Alt (Option)','Alt destro (Opzione)','Alt derecho (Opción)'],'Début':['Home','Home','Inicio'],'Flèche haut':['Up arrow','Freccia su','Flecha arriba'],'Page haut':['Page Up','Pag su','Re Pág'],'Flèche gauche':['Left arrow','Freccia sinistra','Flecha izquierda'],'Flèche droite':['Right arrow','Freccia destra','Flecha derecha'],'Fin':['End','Fine','Fin'],'Flèche bas':['Down arrow','Freccia giù','Flecha abajo'],'Page bas':['Page Down','Pag giù','Av Pág'],'Insert (Help)':['Insert (Help)','Ins (Help)','Insert (Help)'],'Suppr':['Delete','Canc','Supr'],'Windows gauche (Cmd)':['Left Windows (Cmd)','Windows sinistro (Cmd)','Windows izquierda (Cmd)'],'Windows droite (Cmd)':['Right Windows (Cmd)','Windows destro (Cmd)','Windows derecha (Cmd)'],'Touche < >':['< > key','Tasto < >','Tecla < >']};
Object.assign(TR, { 'Clic gauche': ['Left click', 'Clic sinistro', 'Clic izquierdo'], 'Clic droit': ['Right click', 'Clic destro', 'Clic derecho'], 'Clic milieu': ['Middle click', 'Clic centrale', 'Clic central'],
  'Bouton souris 4': ['Mouse button 4', 'Tasto mouse 4', 'Botón del ratón 4'], 'Bouton souris 5': ['Mouse button 5', 'Tasto mouse 5', 'Botón del ratón 5'],
  'Molette haut': ['Wheel up', 'Rotellina su', 'Rueda arriba'], 'Molette bas': ['Wheel down', 'Rotellina giù', 'Rueda abajo'], 'Molette horizontale': ['Horizontal wheel', 'Rotellina orizzontale', 'Rueda horizontal'] });
/* ImGuiKey : les touches nommées commencent à 512 ; la souris est à part. */
const IMG = {}; 'Tab LeftArrow RightArrow UpArrow DownArrow PageUp PageDown Home End Insert Delete Backspace Space Enter Escape LeftCtrl LeftShift LeftAlt LeftSuper RightCtrl RightShift RightAlt RightSuper Menu Num0 Num1 Num2 Num3 Num4 Num5 Num6 Num7 Num8 Num9 A B C D E F G H I J K L M N O P Q R S T U V W X Y Z F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 F13 F14 F15 F16 F17 F18 F19 F20 F21 F22 F23 F24 Apostrophe Comma Minus Period Slash Semicolon Equal LeftBracket Backslash RightBracket GraveAccent CapsLock ScrollLock NumLock PrintScreen Pause Keypad0 Keypad1 Keypad2 Keypad3 Keypad4 Keypad5 Keypad6 Keypad7 Keypad8 Keypad9 KeypadDecimal KeypadDivide KeypadMultiply KeypadSubtract KeypadAdd KeypadEnter KeypadEqual AppBack AppForward'.split(' ').forEach((n, i) => { IMG[n] = 512 + i; });
Object.assign(IMG, { MouseLeft: 655, MouseRight: 656, MouseMiddle: 657, MouseX1: 658, MouseX2: 659, MouseWheelX: 660, MouseWheelY: 661 });
const MODS = [['Ctrl', 4096], ['Shift', 8192], ['Alt', 16384], ['Super', 32768]];
/* event.code (position physique) -> code DirectInput. */
const CODE = { Escape: 1, Minus: 12, Equal: 13, Backspace: 14, Tab: 15, BracketLeft: 26, BracketRight: 27, Enter: 28, ControlLeft: 29, Semicolon: 39, Quote: 40, Backquote: 41, ShiftLeft: 42, Backslash: 43,
  Comma: 51, Period: 52, Slash: 53, ShiftRight: 54, NumpadMultiply: 55, AltLeft: 56, Space: 57, CapsLock: 58, NumLock: 69, NumpadSubtract: 74, NumpadAdd: 78, NumpadDecimal: 83, IntlBackslash: 86,
  NumpadEqual: 141, NumpadEnter: 156, ControlRight: 157, NumpadDivide: 181, AltRight: 184, Home: 199, ArrowUp: 200, PageUp: 201, ArrowLeft: 203, ArrowRight: 205, End: 207, ArrowDown: 208, PageDown: 209,
  Insert: 210, Help: 210, Delete: 211, MetaLeft: 219, MetaRight: 220 };
'QWERTYUIOP'.split('').forEach((c, i) => { CODE['Key' + c] = 16 + i; }); 'ASDFGHJKL'.split('').forEach((c, i) => { CODE['Key' + c] = 30 + i; }); 'ZXCVBNM'.split('').forEach((c, i) => { CODE['Key' + c] = 44 + i; });
for (let i = 1; i <= 9; i++) CODE['Digit' + i] = i + 1; CODE.Digit0 = 11;
for (let i = 1; i <= 10; i++) CODE['F' + i] = 58 + i; CODE.F11 = 87; CODE.F12 = 88; CODE.F13 = 100; CODE.F14 = 101; CODE.F15 = 102;
[7, 8, 9].forEach((n, i) => { CODE['Numpad' + n] = 71 + i; }); [4, 5, 6].forEach((n, i) => { CODE['Numpad' + n] = 75 + i; }); [1, 2, 3].forEach((n, i) => { CODE['Numpad' + n] = 79 + i; }); CODE.Numpad0 = 82;
const MOUSE = { 0: [256, 'Clic gauche', 'MouseLeft'], 2: [257, 'Clic droit', 'MouseRight'], 1: [258, 'Clic milieu', 'MouseMiddle'], 3: [259, 'Bouton souris 4', 'MouseX1'], 4: [260, 'Bouton souris 5', 'MouseX2'] };

/* Langues de l'appli (le drapeau ouvre le menu) : fr, en, it, es dans l'ordre des tables. */
const LANGS = [['fr', 'Français', '🇫🇷'], ['en', 'English', '🇬🇧'], ['es', 'Español', '🇪🇸'], ['it', 'Italiano', '🇮🇹']];
const UI = { // [fr, en, it, es]
  prompt: ['Appuyez sur n’importe quelle touche de votre clavier', 'Press any key on your keyboard', 'Premi un tasto qualsiasi della tastiera', 'Pulsa cualquier tecla del teclado'],
  key: ['Touche détectée : {v}', 'Detected key: {v}', 'Tasto rilevato: {v}', 'Tecla detectada: {v}'],
  char: ['{v} (caractère ‘{c}’)', '{v} (character ‘{c}’)', '{v} (carattere ‘{c}’)', '{v} (carácter ‘{c}’)'],
  nokey: ['non reconnue', 'not recognized', 'non riconosciuto', 'no reconocida'],
  ini: ['Format .ini court : {v}', 'Short .ini format: {v}', 'Formato .ini breve: {v}', 'Formato .ini corto: {v}'],
  dec: ['Code décimal : {v}', 'Decimal code: {v}', 'Codice decimale: {v}', 'Código decimal: {v}'],
  img: ['ImGuiKey : {v}', 'ImGuiKey: {v}', 'ImGuiKey: {v}', 'ImGuiKey: {v}'],
  chord: ['Accord ImGui : {v}', 'ImGui chord: {v}', 'Combinazione ImGui: {v}', 'Combinación ImGui: {v}'],
  none: ['aucun', 'none', 'nessuno', 'ninguno'], nonef: ['aucune', 'none', 'nessuno', 'ninguna'],
  foot: ['Codes DirectInput et ImGuiKey, selon la position physique de la touche (comme sous Windows).', 'DirectInput and ImGuiKey codes, based on the key’s physical position (as on Windows).',
    'Codici DirectInput e ImGuiKey, in base alla posizione fisica del tasto (come su Windows).', 'Códigos DirectInput e ImGuiKey, según la posición física de la tecla (como en Windows).']
};
const LI = { fr: 0, en: 1, it: 2, es: 3 };
const fill = (s, v, c) => s.replace('{v}', v).replace('{c}', c);

/* Détection d'une touche : même logique que l'appli (modificateurs tenus hors la touche elle-même). */
function detectKey(e) {
  const dik = CODE[e.code], info = dik != null ? K[dik] : null;
  const ch = e.key && [...e.key].length === 1 && !/\s/.test(e.key) ? e.key : '';
  if (!info) return { name: null, code: null, im: null, mods: [], ch };
  const own = MODS.find(m => info[1] && info[1].includes(m[0]));
  const held = { Ctrl: e.ctrlKey, Shift: e.shiftKey, Alt: e.altKey, Super: e.metaKey };
  return { name: info[0], code: dik, im: info[1], mods: MODS.filter(m => held[m[0]] && (!own || m[0] !== own[0])), ch };
}
function detectMouse(e) { const m = MOUSE[e.button]; if (!m) return null; return { name: m[1], code: m[0], im: m[2], mods: heldMods(e), ch: '' }; }
function heldMods(e) { const held = { Ctrl: e.ctrlKey, Shift: e.shiftKey, Alt: e.altKey, Super: e.metaKey }; return MODS.filter(m => held[m[0]]); }
function detectWheel(e) {
  const v = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
  const d = v ? (e.deltaY < 0 ? { name: 'Molette haut', code: 264 } : { name: 'Molette bas', code: 265 }) : { name: 'Molette horizontale', code: null };
  return { ...d, im: v ? 'MouseWheelY' : 'MouseWheelX', mods: heldMods(e), ch: '' };
}

/* Texte affiché pour une détection (null : rien de pressé encore). */
function readout(d, li) {
  const u = k => UI[k][li], none = '—';
  if (!d) return { key: fill(u('key'), none), ini: fill(u('ini'), none), dec: fill(u('dec'), none), img: fill(u('img'), none), chord: fill(u('chord'), none), danger: false };
  const name = d.name == null ? u('nokey') : li === 0 ? d.name : (TR[d.name] ? TR[d.name][li - 1] : d.name);
  const r = { key: fill(u('key'), d.ch ? fill(u('char'), name, d.ch) : name), danger: d.code == null };
  r.ini = fill(u('ini'), d.code != null ? '0x' + d.code.toString(16).padStart(2, '0') : u('none'));
  r.dec = fill(u('dec'), d.code != null ? d.code : none);
  if (!d.im || IMG[d.im] == null) { r.img = fill(u('img'), u('nonef')); r.chord = fill(u('chord'), none); return r; }
  const key = IMG[d.im]; r.img = fill(u('img'), d.im + ' = ' + key);
  let chord = none;
  if (d.mods.length) { const v = d.mods.reduce((a, m) => a | m[1], key); chord = d.mods.map(m => m[0]).concat(d.im).join('+') + ' = ' + v + ' (0x' + v.toString(16).padStart(4, '0') + ')'; }
  r.chord = fill(u('chord'), chord);
  return r;
}

export function open(app) {
  css('css/demos/kEYKODES.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 825, h: 476, minw: 600, minh: 400, bare: true, cls: 'socle kkd-win',
    onclose: w => { w.dead = true; removeEventListener('keydown', w.kh, true); removeEventListener('pointerdown', w.away, true); },
    build: w => {
      let li = LI[T('fr', 'en')], last = null, menuOpen = false;
      const root = h('div', { class: 'kkd' });
      const prompt = h('p', { class: 'kkd-prompt' }), caret = h('i', { class: 'kkd-caret' });
      const lines = { key: h('div', { class: 'kkd-key' }), ini: h('div', { class: 'kkd-ini' }), dec: h('div', { class: 'kkd-dec' }), img: h('div', { class: 'kkd-dec' }), chord: h('div', { class: 'kkd-chord' }) };
      const foot = h('p', { class: 'kkd-foot' });
      const flag = h('button', { class: 'kkd-flag', 'aria-label': 'Language', 'aria-haspopup': 'menu' });
      const menu = h('div', { class: 'kkd-menu', role: 'menu', hidden: true });
      const body = h('div', { class: 'kkd-body', tabindex: '0' }, prompt, flag, menu, h('div', { class: 'kkd-mid' }, ...Object.values(lines)), foot);
      root.append(h('div', { class: 'kkd-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('kEYKODES', app.accent) })), body);
      const setMenu = v => { menuOpen = v; menu.hidden = !v; flag.classList.toggle('on', v); };
      const drawMenu = () => { menu.replaceChildren(...LANGS.map(([c, n, f]) => h('button', { class: 'kkd-mi', role: 'menuitemradio', 'aria-checked': LI[c] === li ? 'true' : 'false', onclick: () => { li = LI[c]; sfx.tick(); setMenu(false); draw(true); body.focus({ preventScroll: true }); } }, h('i', {}, LI[c] === li ? '✓' : ''), h('span', {}, n)))); };
      const active = () => S.active === w;
      function draw(flash) {
        const r = readout(last, li);
        prompt.textContent = active() ? UI.prompt[li] : T('Cliquez sur la fenêtre, puis appuyez sur une touche', 'Click the window, then press a key');
        prompt.classList.toggle('idle', !active()); if (!last && active()) prompt.append(caret);
        lines.key.textContent = r.key; lines.ini.textContent = r.ini; lines.dec.textContent = r.dec; lines.img.textContent = r.img; lines.chord.textContent = r.chord;
        lines.ini.classList.toggle('danger', r.danger); foot.textContent = UI.foot[li];
        flag.textContent = LANGS.find(l => LI[l[0]] === li)[2]; drawMenu();
        if (flash) [lines.key, lines.ini].forEach(el => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); });
      }
      const show = d => { if (!d) return; last = d; sfx.tick(); draw(true); };
      flag.onclick = () => { sfx.click(); setMenu(!menuOpen); };
      w.away = e => { if (menuOpen && !menu.contains(e.target) && !flag.contains(e.target)) setMenu(false); };
      addEventListener('pointerdown', w.away, true);
      /* Clavier : tout ce qui arrive à la fenêtre active est une touche à lire (Tab, Échap et ⌘ compris). */
      w.kh = e => {
        if (!active() || w.min) return;
        if (e.key === 'Escape' && menuOpen) { e.preventDefault(); e.stopPropagation(); setMenu(false); return; }
        if (e.metaKey && /^Key[RWTNQLMHP]$/.test(e.code)) return;
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;
        if (menuOpen) setMenu(false);
        show(detectKey(e));
      };
      addEventListener('keydown', w.kh, true);
      /* Souris : boutons 1 à 5 et molette (verticale et horizontale), sur toute la zone de lecture. */
      const inside = e => !e.target.closest('.kkd-flag,.kkd-menu');
      body.addEventListener('mousedown', e => { if (!inside(e)) return; e.preventDefault(); body.focus({ preventScroll: true }); show(detectMouse(e)); });
      body.addEventListener('contextmenu', e => e.preventDefault());
      let wt = 0;
      body.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); if (!inside(e) || e.timeStamp - wt < 90) return; wt = e.timeStamp; show(detectWheel(e)); }, { passive: false });
      const sync = () => { if (!w.dead) draw(false); };
      new MutationObserver(sync).observe(w.el, { attributes: true, attributeFilter: ['class'] });
      draw(false);
      return root;
    } });
}
