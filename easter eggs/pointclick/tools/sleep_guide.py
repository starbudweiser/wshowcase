#!/usr/bin/env python3 -I
"""Toile guide des poses de coucher : le personnage debout (image FLUX sur fond magenta) est posé sur une toile large
de fond magenta uni, à une hauteur et sur une ligne de sol fixes. Chaque pose clé est ensuite calculée par FLUX
à partir de cette toile (même caméra, même échelle), ce qui garde toutes les images d'un personnage dans le même cadre.
Usage : sleep_guide.py source.png sortie.png [--size 1536x1024] [--h 0.66] [--ground 0.93] [--x 0.5] [--like guide.json]
  --like : variante d'un personnage déjà guidé (ex. cavalier à citrouille, même échelle de jeu) : même facteur source -> toile
  et même ligne de sol que ce guide-là.
Écrit à côté un JSON : facteur source -> toile, ligne de sol, rectangle du personnage."""
import sys, json, os
from PIL import Image

a = sys.argv[1:]
def opt(k, d):
    if k in a: i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
    return d
like = opt('--like', None); size = opt('--size', '1536x1024'); fh = float(opt('--h', '0.66')); fg = float(opt('--ground', '0.93')); fx = float(opt('--x', '0.5'))
src, out = a[0], a[1]
W, H = (int(v) for v in size.split('x'))
im = Image.open(src).convert('RGB'); px = im.load(); w, h = im.size
bg = tuple(sum(px[x, y][i] for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))) // 4 for i in range(3))
m = Image.new('L', (w, h), 0); mp = m.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 70: mp[x, y] = 255
bb = m.getbbox()
L = json.load(open(like)) if like else None
sub = im.crop(bb); msk = m.crop(bb)
k = L['k'] if L else H * fh / sub.size[1]          # variante : même facteur source -> toile et même ligne de sol que le guide de référence
if L: fg = L['ground'] / H
nw, nh = round(sub.size[0] * k), round(sub.size[1] * k)
sub = sub.resize((nw, nh), Image.LANCZOS); msk = msk.resize((nw, nh), Image.LANCZOS)
x0 = round(W * fx - nw / 2); y0 = round(H * fg - nh)
cv = Image.new('RGB', (W, H), bg)
cv.paste(sub, (x0, y0), msk)
cv.save(out)
json.dump({'src': os.path.basename(src), 'k': k, 'ground': round(H * fg), 'rect': [x0, y0, x0 + nw, y0 + nh], 'bg': bg, 'size': [W, H]},
          open(os.path.splitext(out)[0] + '.json', 'w'))
print(out, (W, H), 'k=%.4f' % k, 'rect', (x0, y0, x0 + nw, y0 + nh))
