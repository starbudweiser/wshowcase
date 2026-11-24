#!/usr/bin/env python3 -I
"""Cycle de pas du cheval et de la charrette : vidéo LTX sur fond magenta (work/intro/cart/ltx_<graine>.mp4) -> 12 images bouclées
assets/pointclick/intro/cart/NN.png + index.json. Détourage par écart au fond, cadre commun à toutes les images (aucun glissement),
dérive horizontale compensée, palette commune (pas de scintillement), boucle choisie là où deux images se ressemblent le plus.
Usage : intro_cart.py <graine> [hauteur_px=112] [n=12] [--sheet]   (--sheet : planche de contrôle work/intro/cart/sheet_<graine>.png)
24/11/2026 : --src=<vidéo> (autre vidéo que work/intro/cart/ltx_<graine>.mp4), --out=<dossier> (sous assets/pointclick/intro/, au lieu de cart),
--xy (dérive compensée aussi en hauteur : vue de dos, la charrette s'éloigne)."""
import os, sys, subprocess, json, glob, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import binary_fill_holes, label, mean, binary_erosion
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(D, '..', '..', '..'))
W = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'intro', 'cart'); OUT = os.path.join(R, 'assets', 'pointclick', 'intro', 'cart')
args = [a for a in sys.argv[1:] if not a.startswith('--')]; seed = args[0]; HPX = int(args[1]) if len(args) > 1 else 112; N = int(args[2]) if len(args) > 2 else 12
opt = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a); XY = '--xy' in sys.argv
if 'out' in opt: OUT = os.path.join(R, 'assets', 'pointclick', 'intro', opt['out'])
SRC = opt.get('src') or os.path.join(W, f'ltx_{seed}.mp4')

tmp = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, os.path.join(tmp, '%03d.png')], check=True)
frames = [np.asarray(Image.open(f).convert('RGB')).astype(np.int16) for f in sorted(glob.glob(os.path.join(tmp, '*.png')))]
h, w, _ = frames[0].shape


def alpha(a):
    """fond = couleur des bords (magenta) ; écart fort = sujet, puis on bouche les trous intérieurs"""
    edge = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    bg = np.median(edge, axis=0); d = np.abs(a - bg).sum(axis=2)
    m = Image.fromarray(((d > 95) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(3))
    m = np.asarray(m) > 0; holes = binary_fill_holes(m) & ~m; lab, n = label(holes)
    # 24/11 : la peau et la robe du cheval, proches du magenta, faisaient des trous dans le sujet ; on bouche les trous intérieurs
    # dont la couleur n'est pas celle du fond (les vrais jours, entre les rayons ou sous les rênes, restent transparents)
    if n:
        mg = (a[..., 0] + a[..., 2]) / 2 - a[..., 1]          # teinte magenta : fort pour le fond, faible pour la peau ou le cheval
        for i, v in enumerate(mean(mg, lab, range(1, n + 1)), 1):
            if v < 40: m = m | (lab == i)   # fond ombré près du sujet : ~60 ; peau, cheval : < 30
    return m


masks = [alpha(a) for a in frames]
# dérive horizontale : centre de la charrette (moitié gauche du sujet, sans les pattes) suivi d'image en image
cx = []
for m in masks:
    ys, xs = np.nonzero(m[: int(h * 0.62)]); cx.append(np.median(xs) if len(xs) else w / 2)
cx = np.array(cx); shift = np.round(cx - cx[0]).astype(int)
masks = [np.roll(m, -s, axis=1) for m, s in zip(masks, shift)]; frames = [np.roll(a, -s, axis=1) for a, s in zip(frames, shift)]
if XY:   # vue de dos : le bas du sujet (roues, sabots) ramené à la même hauteur
    by = np.array([np.nonzero(m.any(1))[0].max() for m in masks]); vs = by - by[0]
    masks = [np.roll(m, -v, axis=0) for m, v in zip(masks, vs)]; frames = [np.roll(a, -v, axis=0) for a, v in zip(frames, vs)]
# boucle : paire (i, j) la plus semblable, j - i entre 0,7 s et 1,8 s (24 i/s), en évitant le début (l'image fixe de départ)
small = [np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((w // 6, h // 6), Image.BILINEAR)).astype(np.float32) for m in masks]
best = None
for i in range(8, len(small) - 18):
    for j in range(i + 17, min(len(small), i + 44)):
        e = float(np.abs(small[i] - small[j]).mean())
        if best is None or e < best[0]: best = (e, i, j)
e, i0, j0 = best; print(f'boucle {i0}→{j0} ({(j0 - i0) / 24:.2f} s), écart {e:.2f}, dérive {shift.min()}..{shift.max()} px')
idx = [i0 + round(k * (j0 - i0) / N) for k in range(N)]
# 24/11 : pour chaque phase, l'image voisine la plus nette (le flou de mouvement mêle le fond magenta aux pieds et aux mains)
def blur(k):
    a = frames[k].astype(int); mg = (a[..., 0] + a[..., 2]) / 2 - a[..., 1]; return int(((mg > 28) & masks[k]).sum())
idx = [min([k for k in (c - 1, c, c + 1) if 0 <= k < len(frames)], key=blur) for c in idx]
# cadre commun (union des masques retenus), facteur d'échelle commun, palette commune
U = np.zeros_like(masks[0])
for k in idx: U |= masks[k]
ys, xs = np.nonzero(U); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
f = HPX / (y1 - y0); size = (max(1, round((x1 - x0) * f)), HPX)
imgs = []
for k in idx:
    a = Image.fromarray(frames[k].astype(np.uint8)).crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS)
    m = Image.fromarray((masks[k][y0:y1, x0:x1] * 255).astype(np.uint8)).resize(size, Image.LANCZOS).point(lambda v: 255 if v > 140 else 0)
    imgs.append((a, m))
pal = imgs[0][0].quantize(colors=int(opt.get('colors', 56)), method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)   # --colors=N (24/11)
os.makedirs(OUT, exist_ok=True); [os.remove(p) for p in glob.glob(os.path.join(OUT, '*.png'))]
outs = []
for n, (a, m) in enumerate(imgs):
    q = a.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGBA'); q.putalpha(m)
    qa = np.asarray(q).copy(); r_, g_, b_ = qa[..., 0].astype(int), qa[..., 1].astype(int), qa[..., 2].astype(int)
    spill = (qa[..., 3] > 0) & ((r_ + b_) // 2 - g_ > 45) & (b_ > g_ + 25)          # frange magenta laissée par le fond : ramenée vers le brun
    qa[..., 2][spill] = np.minimum(b_, g_ + 10)[spill]; qa[..., 0][spill] = np.minimum(r_, g_ + 60)[spill]
    band = (qa[..., 3] > 0) & ~binary_erosion(qa[..., 3] > 0, iterations=2)          # 24/11 : liseré du bord, frange rose plus sombre (cheval noir, bottes)
    sp2 = (band & ((r_ + b_) // 2 - g_ > 18) & (b_ > g_ + 8)) | ((qa[..., 3] > 0) & (b_ > g_ + 20) & (r_ > g_ + 40))   # + reflets magenta (pas les rouges ni les bleus)
    qa[..., 2][sp2] = np.minimum(b_, g_ + 4)[sp2]; qa[..., 0][sp2] = np.minimum(r_, g_ + 30)[sp2]; q = Image.fromarray(qa).copy()
    px = q.load(); src = q.copy().load(); ow, oh = q.size
    for y in range(oh):
        for x in range(ow):
            if src[x, y][3] == 0 and any(0 <= x + dx < ow and 0 <= y + dy < oh and src[x + dx, y + dy][3] > 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): px[x, y] = (34, 18, 24, 255)
    q.save(os.path.join(OUT, f'{n:02d}.png'), optimize=True); outs.append(q)
json.dump({'n': N, 'w': size[0], 'h': size[1], 'src': f'ltx_{seed}', 'loop': [i0, j0]}, open(os.path.join(OUT, 'index.json'), 'w'))
print('images', N, size)
if '--sheet' in sys.argv:
    sh = Image.new('RGBA', (size[0] * 4 + 30, (size[1] + 10) * ((N + 3) // 4)), (60, 60, 70, 255))
    for n, q in enumerate(outs): sh.alpha_composite(q, ((n % 4) * (size[0] + 10), (n // 4) * (size[1] + 10)))
    sh = sh.resize((sh.width * 2, sh.height * 2), Image.NEAREST); sh.save(os.path.join(W, f'sheet_{seed}.png'))
