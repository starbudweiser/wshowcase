#!/usr/bin/env python3 -I
"""Aperçu animé des cycles LTX installés (24/11/2026) : chaque cycle spr/lw_<nom>_<n>.png joue sur place, pieds alignés, x2.
Usage : lw_preview.py sortie.gif nom1 nom2 ...   (cycles de 8 images ; 12 pour les charrettes : nom = ../intro/cart3 etc.)"""
import sys, os
from PIL import Image, ImageDraw
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); SPR = os.path.join(R, 'assets', 'pointclick', 'spr')
out, names = sys.argv[1], sys.argv[2:]
def frames(n):
    if n.startswith('../'): d = os.path.join(SPR, n); return [Image.open(os.path.join(d, f'{i:02d}.png')).convert('RGBA') for i in range(12)]
    return [Image.open(os.path.join(SPR, f'lw_{n}_{i}.png')).convert('RGBA') for i in range(8)]
cyc = [(n.split('/')[-1], frames(n)) for n in names]
cw = max(f.width for _, c in cyc for f in c) + 8; ch = max(f.height for _, c in cyc for f in c) + 14
L = max(len(c) for _, c in cyc) * 2; imgs = []
for t in range(L):
    B = Image.new('RGBA', (cw * len(cyc), ch), (96, 104, 96, 255)); D = ImageDraw.Draw(B)
    for j, (n, c) in enumerate(cyc):
        f = c[t % len(c)]; B.alpha_composite(f, (j * cw + (cw - f.width) // 2, ch - 2 - f.height)); D.text((j * cw + 2, 1), n, fill=(255, 230, 120))
    imgs.append(B.convert('RGB').resize((B.width * 2, B.height * 2), Image.NEAREST))
imgs[0].save(out, save_all=True, append_images=imgs[1:], duration=110, loop=0); print(out, imgs[0].size)
