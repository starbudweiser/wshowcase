/* Réplique interactive de mFRAMES : relecture de créations par clients et équipes. Projets par client, versions, repères (pin) et zones sur l'image, lecteur vidéo avec repères horodatés,
   fil de commentaires (ouvert / résolu, suppression, réponse), invitation. Tout est en mémoire : rien n'est envoyé. */
import { css, h, T, win, bar, dialog, toast, icon, sfx, wait, reduced, clamp } from './tk.js';
const CSS = 'css/demos/mFRAMES.css';
export function open(app) {
  css(CSS);
  return win(app, 1180, 640, w => {
    const C = (n, k, x, y, t, who, st, ex = {}) => ({ n, k, x, y, t, who, st, ...ex });
    const P = [
      { id: 'a2', cl: 'Boutique Aurore', name: T('Affiche A2', 'A2 poster'), kind: 'img', c: '#ff9f0a', g: '▣', cur: 1, vs: [T('hier', 'yesterday'), T('maintenant', 'now')], cm: [[], [C(1, 'pin', .3, .31, T('Le titre est trop petit, on peut l’agrandir ?', 'The title is too small, can we make it bigger?'), 'Marie', 'open'), C(2, 'zone', .22, .22, T('Cette zone est trop chargée.', 'This area is too busy.'), 'Marie', 'open', { w: .46, h: .24 }), C(3, 'pin', .78, .35, T('Le soleil pourrait être plus petit.', 'The sun could be smaller.'), 'Marie', 'res'), C(4, 'msg', 0, 0, T('Je l’agrandis maintenant, nouvelle version dans 10 s.', 'I’m enlarging it now, new version in 10 s.'), T('Vous', 'You'), 'me')]] },
      { id: 'spot', cl: 'Boutique Aurore', name: T('Spot de lancement 30 s', 'Launch spot 30 s'), kind: 'vid', c: '#5e5ce6', g: '▶', cur: 2, vs: ['', '', ''], cm: [[], [], [C(1, 'pin', .5, .45, T('Ce plan est un peu long, on coupe ?', 'This shot is a bit long, shall we cut?'), 'Marie', 'open', { ts: 3.2 }), C(2, 'pin', .7, .7, T('Le logo arrive trop tard.', 'The logo comes in too late.'), 'Marie', 'open', { ts: 9.4 })]] },
      { id: 'cat', cl: 'Boutique Aurore', name: T('Catalogue', 'Catalogue'), kind: 'cat', c: '#ff453a', g: '▤', cur: 1, vs: ['', ''], cm: [[], []] },
      { id: 'logo', cl: 'Maison Verne', name: 'Logo', kind: 'logo', c: '#2fb7c4', g: '◆', cur: 0, vs: [''], cm: [[]] }
    ];
    const st = { id: 'a2', tool: 'pin', pend: null, hi: null, q: '', play: false, t: 0, sent: false };
    const cur = () => P.find(p => p.id === st.id), cms = () => cur().cm[cur().cur];
    const root = h('div', { class: 'tk' }), pj = h('section', { class: 'mfr-pj' }), cv = h('section', { class: 'mfr-cv' }), fb = h('aside', { class: 'mfr-fb' });
    let timer = 0; const stop = () => { clearInterval(timer); st.play = false; };
    const openCount = p => p.cm[p.cur].filter(c => c.st === 'open').length;
    const drawPj = () => {
      pj.innerHTML = ''; pj.append(h('input', { class: 'tk-in', type: 'search', value: st.q, placeholder: T('Chercher un projet…', 'Search projects…'), 'aria-label': 'search', oninput: e => { st.q = e.target.value; drawPj(); } }));
      const cls = [...new Set(P.map(p => p.cl))];
      cls.forEach(cl => { const L = P.filter(p => p.cl === cl && (!st.q || p.name.toLowerCase().includes(st.q.toLowerCase()))); if (!L.length) return; pj.append(h('div', { class: 'mfr-cl' }, cl.toUpperCase()));
        L.forEach(p => { pj.append(h('button', { class: 'mfr-p' + (st.id === p.id ? ' on' : ''), onclick: () => { stop(); st.id = p.id; st.pend = null; st.t = 0; sfx.tick(); draw(); } }, h('i', { style: { background: p.c } }, p.g), h('div', {}, h('b', {}, p.name), h('small', {}, p.vs.length + ' ' + (p.vs.length > 1 ? T('versions', 'versions') : T('version', 'version')))), openCount(p) ? h('span', { class: 'bd' }, openCount(p)) : null));
          if (st.id === p.id) [...p.vs.keys()].reverse().forEach(i => pj.append(h('button', { class: 'mfr-v' + (p.cur === i ? ' on' : ''), onclick: () => { stop(); p.cur = i; st.pend = null; st.t = 0; sfx.tick(); draw(); } }, h('b', {}, 'V' + (i + 1)), p.vs[i] || '', p.cm[i].filter(c => c.st === 'open').length ? h('span', { class: 'bd' }, p.cm[i].filter(c => c.st === 'open').length) : null))); }); });
      pj.append(h('div', { class: 'mfr-new' }, h('button', { class: 'tk-btn', onclick: newProject }, '+ ' + T('Nouveau projet', 'New project'))));
    };
    const art = () => {
      const p = cur(), a = h('div', { class: 'mfr-art' + (p.cur === 0 && p.id === 'a2' ? ' v1' : '') });
      a.append(p.kind === 'img' ? h('div', { class: 'poster' }, h('div', { class: 'mt' }), h('div', { class: 'sun' }), h('div', { class: 'ttl' }), h('div', { class: 'sub' })) : p.kind === 'vid' ? h('div', { class: 'vid' }, h('i'), '▶') : p.kind === 'cat' ? h('div', { class: 'cat' }, h('div'), h('div'), h('div'), h('div')) : p.kind === 'logo' ? h('div', { class: 'logo' }, h('div')) : h('div', { class: 'empty' }, T('Glissez une image, une vidéo ou un PDF ici.', 'Drop an image, a video or a PDF here.')));
      const show = c => p.kind !== 'vid' || Math.abs(st.t - c.ts) < 1.6;
      cms().forEach(c => { if (c.k === 'msg') return;
        if (c.k === 'zone') a.append(h('div', { class: 'mfr-zone' + (c.st === 'res' ? ' ok' : '') + (st.hi === c.n ? ' hi' : ''), style: { left: c.x * 100 + '%', top: c.y * 100 + '%', width: c.w * 100 + '%', height: c.h * 100 + '%' } }));
        a.append(h('div', { class: 'mfr-pin' + (c.st === 'res' ? ' ok' : '') + (st.hi === c.n ? ' hi' : '') + (show(c) ? '' : ' dim'), style: { left: (c.k === 'zone' ? c.x : c.x) * 100 + '%', top: (c.k === 'zone' ? c.y : c.y) * 100 + '%' }, onclick: e => { e.stopPropagation(); st.hi = c.n; if (c.ts != null) { st.t = c.ts; } sfx.tick(); drawCv(); drawFb(); } }, String(c.n))); });
      if (st.pend) { const q = st.pend; if (q.k === 'zone') a.append(h('div', { class: 'mfr-zone', style: { left: q.x * 100 + '%', top: q.y * 100 + '%', width: q.w * 100 + '%', height: q.h * 100 + '%' } })); a.append(h('div', { class: 'mfr-pin pend', style: { left: q.x * 100 + '%', top: q.y * 100 + '%' } }, String(nextN()))); }
      let drag = null;
      a.addEventListener('pointerdown', e => { if (e.target.closest('.mfr-pin')) return; const r = a.getBoundingClientRect(); const x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp((e.clientY - r.top) / r.height, 0, 1); drag = { x, y, r, moved: false }; a.setPointerCapture(e.pointerId); });
      a.addEventListener('pointermove', e => { if (!drag || st.tool !== 'zone') return; const x = clamp((e.clientX - drag.r.left) / drag.r.width, 0, 1), y = clamp((e.clientY - drag.r.top) / drag.r.height, 0, 1); drag.moved = true; st.pend = { k: 'zone', x: Math.min(x, drag.x), y: Math.min(y, drag.y), w: Math.abs(x - drag.x), h: Math.abs(y - drag.y) }; drawCv(true); });
      a.addEventListener('pointerup', () => { if (!drag) return; if (st.tool === 'pin' || !drag.moved || (st.pend && st.pend.w < .02)) { st.pend = { k: 'pin', x: drag.x, y: drag.y, ts: p.kind === 'vid' ? +st.t.toFixed(1) : undefined }; } else if (st.pend) st.pend.ts = p.kind === 'vid' ? +st.t.toFixed(1) : undefined; drag = null; sfx.tick(); drawCv(); drawFb(); fb.querySelector('.mfr-rep input')?.focus(); });
      return a;
    };
    const nextN = () => Math.max(0, ...cms().filter(c => c.k !== 'msg').map(c => c.n)) + 1;
    const fmtT = s => '00:' + String(Math.floor(s)).padStart(2, '0');
    const drawCv = () => {
      cv.innerHTML = ''; const p = cur();
      cv.append(h('div', { class: 'mfr-tools' }, h('button', { class: st.tool === 'pin' ? 'on' : '', title: T('Repère', 'Pin'), 'aria-label': 'pin', onclick: () => { st.tool = 'pin'; drawCv(); } }, '◉'), h('button', { class: st.tool === 'zone' ? 'on' : '', title: T('Zone', 'Zone'), 'aria-label': 'zone', onclick: () => { st.tool = 'zone'; drawCv(); } }, '▭')), art());
      if (p.kind === 'vid') { const D = 12, tl = h('div', { class: 'tl', onclick: e => { const r = e.currentTarget.getBoundingClientRect(); st.t = clamp((e.clientX - r.left) / r.width, 0, 1) * D; drawCv(); } }, h('i', { style: { width: st.t / D * 100 + '%' } }), ...cms().filter(c => c.ts != null).map(c => h('u', { style: { left: c.ts / D * 100 + '%' } })));
        cv.append(h('div', { class: 'mfr-pl' }, tl, h('div', { class: 'ct' }, h('b', {}, fmtT(st.t)), h('span', { class: 'tk-dim' }, '/ 00:12'), h('span', { class: 'tk-sp' }), h('button', { class: 'tk-ico', onclick: () => { st.t = Math.max(0, st.t - 1); drawCv(); } }, '⏮'), h('button', { class: 'play', 'aria-label': 'play', onclick: () => { if (st.play) { stop(); } else { st.play = true; if (st.t >= D) st.t = 0; timer = setInterval(() => { st.t += .1; if (st.t >= D) { st.t = D; stop(); } if (!root.isConnected) return stop(); drawCv(); }, 100); } drawCv(); } }, st.play ? '❚❚' : '▶'), h('button', { class: 'tk-ico', onclick: () => { st.t = Math.min(D, st.t + 1); drawCv(); } }, '⏭'), h('span', { class: 'tk-sp' }), h('span', { class: 'tk-dim' }, '1×'))));
      }
    };
    const drawFb = () => {
      fb.innerHTML = ''; const L = cms(), op = L.filter(c => c.st === 'open').length;
      fb.append(h('div', { class: 'mfr-fh' }, 'Feedback', h('em', {}, String(op)), h('button', { class: 'tk-btn pri', onclick: send }, '➤ ' + T('Envoyer', 'Send'))));
      const th = h('div', { class: 'mfr-th' });
      if (!L.length) th.append(h('p', { class: 'tk-dim', style: { padding: '10px 4px' } }, T('Cliquez sur l’image pour poser un repère, ou tracez une zone.', 'Click the image to drop a pin, or draw a zone.')));
      L.forEach(c => { const me = c.mine || c.st === 'me';
        th.append(h('div', { class: 'mfr-m' + (me ? ' me' : '') }, h('div', { class: 'who' }, me ? c.who : [h('i', {}, c.who[0]), c.who]), h('div', { class: 'bub' }, c.t),
          c.k === 'msg' ? null : h('div', { class: 'meta' }, h('button', { onclick: () => { st.hi = st.hi === c.n ? null : c.n; if (c.ts != null) st.t = c.ts; sfx.tick(); drawCv(); drawFb(); } }, (c.k === 'zone' ? 'Zone ' : 'Pin ') + c.n + (c.ts != null ? ' · ' + fmtT(c.ts) : '')), h('button', { class: 'tr', 'aria-label': 'delete', onclick: () => { cms().splice(cms().indexOf(c), 1); sfx.tick(); draw(); } }, '🗑'),
            h('button', { class: 'st ' + (c.st === 'res' ? 'res' : 'open'), onclick: () => { c.st = c.st === 'res' ? 'open' : 'res'; sfx.tick(); draw(); } }, c.st === 'res' ? T('Résolu', 'Resolved') : T('Ouvert', 'Open'))))); });
      const inp = h('input', { placeholder: st.pend ? T('Commentaire sur le repère ', 'Comment on pin ') + nextN() + '…' : T('Répondre ou annoter…', 'Reply or annotate…'), 'aria-label': 'reply', onkeydown: e => { if (e.key === 'Enter') reply(inp); } });
      fb.append(th, h('div', { class: 'mfr-hint' }, st.pend ? '◉ ' + (st.pend.k === 'zone' ? 'Zone ' : 'Pin ') + nextN() : ''), h('div', { class: 'mfr-rep' }, inp, h('button', { 'aria-label': 'send', onclick: () => reply(inp) }, '↑')));
      requestAnimationFrame(() => { th.scrollTop = th.scrollHeight; });
    };
    const reply = inp => {
      const v = inp.value.trim(); if (!v) return; const p = st.pend; const L = cms();
      L.push(p ? { n: nextN(), k: p.k, x: p.x, y: p.y, w: p.w, h: p.h, ts: p.ts, t: v, who: T('Vous', 'You'), st: 'open', mine: 1 } : { n: nextN(), k: 'msg', t: v, who: T('Vous', 'You'), st: 'me' });
      const mine = L[L.length - 1]; if (p) { mine.k = p.k; } st.pend = null; sfx.tick(); draw();
      wait(reduced() ? 0 : 1600).then(() => { if (!root.isConnected) return; cms().push({ n: nextN(), k: 'msg', t: T('Parfait, merci !', 'Perfect, thanks!'), who: 'Marie', st: 'her' }); sfx.tick(); drawFb(); });
    };
    const send = () => { sfx.done(); toast({ icon: icon('mFRAMES'), title: 'mFRAMES', body: T(`Feedback envoyé à Marie · ${cur().name} V${cur().cur + 1}.`, `Feedback sent to Marie · ${cur().name} V${cur().cur + 1}.`) }); };
    const invite = () => dialog(root, T('Inviter', 'Invite'), h('div', {}, h('p', {}, T('Partagez ce lien : votre client commente sans compte.', 'Share this link: your client comments without an account.')), h('input', { class: 'tk-in', style: { width: '100%', marginTop: '10px' }, readonly: true, value: 'https://frames.example/r/aurore-a2-v2' })), [T('Fermer', 'Close')], [T('Copier le lien', 'Copy link'), 'pri', () => toast({ icon: icon('mFRAMES'), title: 'mFRAMES', body: T('Lien copié.', 'Link copied.') })]);
    const newProject = () => { let nm = '', kd = 'img'; const f = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, h('input', { class: 'tk-in', placeholder: T('Nom du projet', 'Project name'), oninput: e => nm = e.target.value, 'aria-label': 'name' }), h('select', { class: 'tk-sel', onchange: e => kd = e.target.value, 'aria-label': 'kind' }, h('option', { value: 'img' }, T('Image', 'Image')), h('option', { value: 'vid' }, T('Vidéo', 'Video')), h('option', { value: 'cat' }, 'PDF')));
      dialog(root, T('Nouveau projet', 'New project'), f, [T('Annuler', 'Cancel')], [T('Créer', 'Create'), 'pri', () => { const id = 'n' + Date.now(); P.push({ id, cl: 'Boutique Aurore', name: nm || T('Sans titre', 'Untitled'), kind: kd, c: '#30d158', g: kd === 'vid' ? '▶' : '▣', cur: 0, vs: [''], cm: [[]] }); stop(); st.id = id; st.pend = null; draw(); }]); };
    const draw = () => { drawPj(); drawCv(); drawFb(); };
    root.append(bar(app, w, h('span', { class: 'tk-sp' }), h('button', { class: 'tk-btn pri', onclick: invite }, '＋ ' + T('Inviter', 'Invite'))), h('div', { class: 'mfr', style: { flex: 1 } }, pj, cv, fb));
    draw(); w.el.addEventListener('close', stop); return root;
  });
}
