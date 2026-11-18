#!/usr/bin/env python3
"""Gourdin en vol du géant (il le lance dans le décor avant de dormir) : sprite pixel art tiré de l'image FLUX du gourdin seul
(work/sleep/giant/m_club_1.png), au même facteur d'échelle que la planche du coucher du géant, même détourage et même contour.
→ assets/pointclick/sleep/gourdin.png (+ .json : w, h, centre de rotation)"""
import os, sys, json
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sleep_pixelize import key, SC, R
G = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'sleep', 'giant')
f = json.load(open(SC))['giant'] / json.load(open(os.path.join(G, 'guide.json')))['k']
im, al = key(Image.open(os.path.join(G, 'm_club_1.png')))
b = al.getbbox(); im, al = im.crop(b), al.crop(b)
import numpy as np
ys, xs = np.nonzero(np.asarray(al) > 0); P = np.stack([xs, ys], 1).astype(float); P -= P.mean(0)
L = np.ptp(P @ np.linalg.svd(P, full_matrices=False)[2][0])      # longueur du gourdin le long de son axe
f *= 512 / L                                                      # même longueur que le gourdin du sprite debout (512 px de la toile guide)
sz = (max(1, round(im.width * f)), max(1, round(im.height * f)))
c = im.resize(sz, Image.LANCZOS); m = al.resize(sz, Image.LANCZOS).point(lambda v: 255 if v > 140 else 0)
q = c.quantize(colors=24, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGBA'); q.putalpha(m)
o = Image.new('RGBA', (sz[0] + 2, sz[1] + 2)); o.paste(q, (1, 1)); p = o.load(); s = o.copy().load()
for y in range(o.height):
    for x in range(o.width):
        if s[x, y][3] == 0 and any(0 <= x + dx < o.width and 0 <= y + dy < o.height and s[x + dx, y + dy][3] > 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): p[x, y] = (34, 18, 24, 255)
dst = os.path.join(R, 'assets', 'pointclick', 'sleep', 'gourdin.png'); o.save(dst, optimize=True)
json.dump({'w': o.width, 'h': o.height, 'cx': round(o.width * 0.55, 1), 'cy': round(o.height / 2, 1)}, open(dst[:-4] + '.json', 'w'))
print('gourdin', o.size, 'facteur', round(f, 4))
