/* ESSAI Codixel (27/11/2026) : cycle de marche du héros (profil droit) par rigging d'UNE image (s2/spr/hero_pr), hors du jeu. */
const P = require('./vendor/pixel.js');
const src = P.load('hero_pr.png');
const rig = new P.Rig(src)
  .bone('torso', null, 76, 272, 80, 96, 1)
  .bone('head', 'torso', 80, 100, 82, 20, 2)
  .bone('legB', 'torso', 62, 272, 62, 322, 0)      /* jambe arrière (gauche de l'image) */
  .bone('shinB', 'legB', 62, 322, 56, 384, 0)
  .bone('legF', 'torso', 88, 272, 90, 322, 3)      /* jambe avant */
  .bone('shinF', 'legF', 90, 322, 100, 384, 3)
  .bone('arm', 'torso', 62, 138, 66, 192, 4)
  .bone('fore', 'arm', 66, 192, 92, 248, 4);
rig.bind({ joint: 2, paint: {
  torso: [[20, 196], [133, 196], [133, 286], [20, 286]],
  arm: [[38, 118], [88, 118], [88, 196], [44, 196]],
  fore: [[48, 186], [94, 182], [104, 250], [72, 254]],
  legB: [[40, 284], [77, 284], [77, 326], [40, 326]],
  shinB: [[30, 326], [77, 326], [79, 400], [30, 400]],
  legF: [[77, 284], [125, 284], [125, 326], [77, 326]],
  shinF: [[77, 326], [133, 326], [133, 400], [79, 400]]
}});
P.save(rig.ownerMap(), 'owners.png');
const N = 12, frames = [];
for (let i = 0; i < N; i++) {
  const t = (i / N) * Math.PI * 2, s = Math.sin(t), c = Math.cos(t);
  const pose = {
    torso: { a: 0.02 * Math.sin(2 * t), dy: -3 * Math.abs(Math.cos(t)) + 2 },
    head: -0.02 * Math.sin(2 * t),
    legF: -0.38 * s, shinF: 0.45 * Math.max(0, c) ** 1.5 + 0.08,
    legB: 0.38 * s, shinB: 0.45 * Math.max(0, -c) ** 1.5 + 0.08,
    arm: 0.16 * s, fore: 0.06 + 0.08 * Math.max(0, s)
  };
  const b = new P.Buf(170, 410); rig.draw(b, 18, 4, pose); frames.push(b);
  P.save(b, `frames/cx_${String(i).padStart(2, '0')}.png`);
}
const dbg = new P.Buf(170, 410); rig.draw(dbg, 18, 4, {}); rig.drawBones(dbg, 18, 4, {}); P.save(dbg, 'bones.png');
console.log('ok', frames.length);
