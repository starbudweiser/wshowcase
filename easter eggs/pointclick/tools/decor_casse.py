#!/usr/bin/env python3
"""État « cassé » d'un élément de décor (coucher du géant : son gourdin lancé abat la tour de guet de la prairie, fait tomber une
guirlande de la fête). Comme dans les point & click classiques, seul l'objet qui change est remplacé : l'état « après » calculé par
FIBO (work/sleep/decor/<scène>_apres_<n>.png, coin du décor agrandi) est ramené à la résolution et à la palette du décor, puis on n'en
garde que la zone où il diffère vraiment du décor d'origine (l'objet et ses débris) ; le reste du tableau reste l'original.
Usage : decor_casse.py <scène> <n> x0 y0  → assets/pointclick/sleep/casse_<scène>.png (RGBA) + .json {x, y}"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
P = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(P, '..', 'work', 'sleep', 'decor'); R = os.path.join(P, '..', '..', '..')
n, k, x0, y0 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
scene = Image.open(os.path.join(R, 'assets', 'pointclick', n + '.png')).convert('RGB')
av = Image.open(os.path.join(W, f'{n}_avant.png')).convert('RGB')
ap = Image.open(os.path.join(W, f'{n}_apres_{k}.png')).convert('RGB').resize(av.size, Image.LANCZOS)
pal = scene.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)    # palette du décor
ap = ap.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
A, B = np.asarray(av).astype(int), np.asarray(ap).astype(int)
m = np.abs(A - B).sum(2) > 90
m = nd.binary_closing(nd.binary_opening(m, iterations=1), iterations=3)
lab, nl = nd.label(m); sz = nd.sum(m, lab, range(1, nl + 1))
m = np.isin(lab, 1 + np.nonzero(sz >= 25)[0])                 # zone de l'objet et de ses débris, sans les petits écarts épars
m = nd.binary_fill_holes(nd.binary_dilation(m, iterations=2))
out = np.dstack([B, m * 255]).astype(np.uint8)
dst = os.path.join(R, 'assets', 'pointclick', 'sleep', f'casse_{n}.png')
Image.fromarray(out).save(dst, optimize=True); json.dump({'x': x0, 'y': y0, 'w': av.width, 'h': av.height}, open(dst[:-4] + '.json', 'w'))
print(n, 'zone remplacée', int(m.sum()), 'px sur', m.size)
