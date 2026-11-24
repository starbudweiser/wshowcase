#!/usr/bin/env python3 -I
"""Aperçu animé des cycles de marche à valider (24/11/2026) : chaque cycle joue sur place, à la taille du jeu (facteur --like de
scales.json) agrandie x2, pieds sur une même ligne, centré sur le haut du corps (comme dans le jeu). Usage :
cycle_gif.py sortie.gif 'titre:like:dossier/f1.png,f2.png,...' ...   (fichiers relatifs au dossier donné)"""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
T = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sprites_pixelize.py'); ns = {'__file__': T}; exec(open(T).read().replace('\nmain()', '\n'), ns)
SC = json.load(open(os.path.join(os.path.dirname(T), '..', 'work', 'scales.json')))
def cut(f, sc):
    im, a, _ = ns['key'](Image.open(f)); fl = ns['flood_bg'](a); px = fl.load(); al = a.load(); w, h = a.size
    for y in range(h):
        for x in range(w):
            if px[x, y] == 128: al[x, y] = 0
    r = im.convert('RGBA'); r.putalpha(a); r = r.resize((max(1, round(w * sc)), max(1, round(h * sc))), Image.LANCZOS)
    A = np.asarray(r)[..., 3] > 100; ys, xs = np.nonzero(A); y1 = ys.max(); top = ys.min(); up = A[top:top + int((y1 - top) * 0.55)]
    cx = np.nonzero(up)[1].mean()
    return r, cx, y1
out = sys.argv[1]; groups = []
for g in sys.argv[2:]:
    title, like, files = g.split(':', 2); d = os.path.dirname(files.split(',')[0]); fs = [files.split(',')[0]] + [os.path.join(d, x) for x in files.split(',')[1:]]
    groups.append((title, [cut(f, SC[like]) for f in fs]))
cw = max(r.width for _, c in groups for r, _, _ in c) + 10; ch = max(r.height for _, c in groups for r, _, _ in c) + 16
n = max(len(c) for _, c in groups); frames = []
for i in range(n * 3):
    B = Image.new('RGBA', (cw * len(groups), ch), (96, 104, 96, 255)); D = ImageDraw.Draw(B)
    for j, (title, c) in enumerate(groups):
        r, cx, y1 = c[i % len(c)]; B.alpha_composite(r, (round(j * cw + cw / 2 - cx), round(ch - 3 - y1))); D.text((j * cw + 3, 2), title, fill=(255, 230, 120))
        D.line([(j * cw, ch - 3), (j * cw + cw, ch - 3)], fill=(70, 76, 70))
    frames.append(B.convert('RGB').resize((B.width * 2, B.height * 2), Image.NEAREST))
frames[0].save(out, save_all=True, append_images=frames[1:], duration=160, loop=0); print(out, frames[0].size)
