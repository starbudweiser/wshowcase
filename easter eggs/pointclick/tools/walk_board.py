#!/usr/bin/env python3 -I
"""Planche de choix des poses de marche (24/11/2026) : une ligne par pose, une colonne par graine, sprite détouré à la taille du jeu
(même réduction que sprites_pixelize, facteur --like) agrandi x3 sur fond gris, numéro de graine. Usage :
walk_board.py sortie.jpg like dossier préfixe pose1,pose2,... [graines=1,2,3]   ex. : walk_board.py b.jpg hero_front work/h34 fr a,p,b,q"""
import sys, os, json, glob
from PIL import Image, ImageDraw
import types
SPX = types.SimpleNamespace(); _src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sprites_pixelize.py')).read().replace('\nmain()', '\n')
_ns = {'__file__': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sprites_pixelize.py')}; exec(_src, _ns); SPX.key, SPX.flood_bg = _ns['key'], _ns['flood_bg']
out, like, d, pre, poses = sys.argv[1:6]; seeds = (sys.argv[6] if len(sys.argv) > 6 else '1,2,3').split(',')
sc = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'work', 'scales.json')))[like]
cells = []
for p in poses.split(','):
    row = []
    for s in seeds:
        f = os.path.join(d, f'{pre}_{p}_{s}.png')
        if not os.path.exists(f): row.append((p, s, None)); continue
        im, a, _ = SPX.key(Image.open(f)); fl = SPX.flood_bg(a); px = fl.load(); al = a.load(); w, h = a.size
        for y in range(h):
            for x in range(w):
                if px[x, y] == 128: al[x, y] = 0
        rgba = im.convert('RGBA'); rgba.putalpha(a); bb = a.getbbox() or (0, 0, w, h); rgba = rgba.crop(bb)
        rgba = rgba.resize((max(1, round(rgba.width * sc)), max(1, round(rgba.height * sc))), Image.LANCZOS)
        row.append((p, s, rgba))
    cells.append(row)
cw = max([c[2].width for r in cells for c in r if c[2]] + [40]) * 3 + 16; ch = max([c[2].height for r in cells for c in r if c[2]] + [40]) * 3 + 22
B = Image.new('RGB', (cw * len(seeds), ch * len(cells)), (96, 104, 96)); D = ImageDraw.Draw(B)
for j, r in enumerate(cells):
    for i, (p, s, im) in enumerate(r):
        x0, y0 = i * cw, j * ch; D.rectangle([x0, y0, x0 + cw - 1, y0 + ch - 1], outline=(60, 66, 60)); D.text((x0 + 4, y0 + 3), f'{pre}_{p}_{s}', fill=(255, 230, 120))
        if im: big = im.resize((im.width * 3, im.height * 3), Image.NEAREST); B.paste(big, (x0 + (cw - big.width) // 2, y0 + ch - big.height - 4), big)
B.save(out, quality=88); print(out, B.size)
