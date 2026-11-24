#!/usr/bin/env python3 -I
"""Choix mesuré d'un cycle de marche (24/11/2026) : pour éviter l'effet « il boite », les deux contacts doivent avoir la même foulée
(écart des pieds) et la même hauteur, les deux passages la même hauteur et une foulée étroite. Mesures sur le détourage (fond magenta) :
hauteur du sujet, foulée = largeur du sujet dans le bas des jambes (12 % inférieurs). Usage :
walk_pick.py dossier A=fichier.png B=prefixe P=prefixe Q=prefixe [graines=1,2,3,4]  -> affiche les mesures et le meilleur jeu"""
import sys, os, itertools
import numpy as np
from PIL import Image
def meas(f):
    a = np.asarray(Image.open(f).convert('RGB')).astype(int); bg = a[2:6, 2:6].reshape(-1, 3).mean(0)
    m = np.abs(a - bg).sum(2) > 90; ys, xs = np.where(m); y0, y1 = ys.min(), ys.max(); h = y1 - y0
    low = m[int(y1 - h * 0.12):y1 + 1]; cols = np.where(low.any(0))[0]
    return h, (cols.max() - cols.min()) if len(cols) else 0
d = sys.argv[1]; kw = dict(x.split('=', 1) for x in sys.argv[2:] if '=' in x and not x.startswith('graines')); seeds = next((x.split('=')[1] for x in sys.argv[2:] if x.startswith('graines')), '1,2,3,4').split(',')
A = meas(os.path.join(d, kw['A'])); print('A', kw['A'], 'hauteur', A[0], 'foulée', A[1])
M = {k: {s: meas(os.path.join(d, f'{kw[k]}_{s}.png')) for s in seeds if os.path.exists(os.path.join(d, f'{kw[k]}_{s}.png'))} for k in 'BPQ'}
for k in 'BPQ': print(k, {s: v for s, v in M[k].items()})
best = None
for b, p, q in itertools.product(M['B'], M['P'], M['Q']):
    (hb, sb), (hp, sp), (hq, sq) = M['B'][b], M['P'][p], M['Q'][q]
    cost = abs(sb - A[1]) * 1.5 + abs(hb - A[0]) + abs(hp - hq) * 1.5 + abs((hp + hq) / 2 - max(A[0], hb)) + 0.3 * (sp + sq)
    if best is None or cost < best[0]: best = (cost, b, p, q)
print('meilleur : B', best[1], 'P', best[2], 'Q', best[3], 'coût', round(best[0], 1))
