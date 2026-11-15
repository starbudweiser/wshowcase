#!/usr/bin/env python3 -I
"""Planches de contrôle des poses clés du coucher de nuit.
  sleep_sheet.py contact <perso> <sortie.jpg>
      toutes les graines de chaque pose (une ligne par pose), cadre commun : sert à choisir.
  sleep_sheet.py board <perso> <sortie.jpg> <sprite> <scène> <x> <y> <échelle|-> pose=fichier …
      planche de validation : la suite choisie, en grand (cadre fixe) et, dessous, à la taille du jeu dans le vrai décor (x3).
      Les poses sont données dans l'ordre ; « | » sépare le coucher du réveil."""
import sys, os, json, glob, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont
T = os.path.dirname(os.path.abspath(__file__)); PC = os.path.join(T, '..'); W = os.path.join(PC, 'work'); R = os.path.abspath(os.path.join(PC, '..', '..'))
FONT = os.path.join(R, 'assets', 'pointclick', 'VT323-Regular.ttf')
PERSP = {'meadow': [185, .6, 268, 1], 'rue': [198, .5, 268, 1], 'mill': [205, .62, 268, 1], 'party': [180, .62, 268, 1], 'ford': [190, .62, 268, 1], 'market': [170, .55, 268, 1]}
NAMES = {'start': 'départ', 'climb': 'sort de la fosse', 'full': 'debout', 'yawn': 'bâille, s\'étire', 'sit': 'assis', 'settle': 's\'allonge', 'sleep': 'dort',
         'inhale': 'dort (inspire)', 'wake': 'se réveille', 'rise': 'se relève', 'low': 'baisse la tête', 'kneel': 'plie les antérieurs', 'fold': 'couché replié',
         'up': 'antérieurs tendus', 'stretch': 's\'étire', 'puff': 'se gonfle', 'shake': 's\'ébroue'}


def mask(p):
    im = Image.open(p).convert('RGB'); px = im.load(); w, h = im.size
    bg = tuple(sum(px[x, y][i] for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))) // 4 for i in range(3))
    m = Image.new('L', (w, h), 0); mp = m.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 90: mp[x, y] = 255
    return im, m


def union(ps, pad=20):
    bb = None
    for p in ps:
        b = mask(p)[1].getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    return (bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad)


def font(n): return ImageFont.truetype(FONT, n)


def contact(ch, out):
    d = os.path.join(W, 'sleep', ch); poses = []
    for f in sorted(glob.glob(os.path.join(d, 'k_*_*.png'))):
        p = os.path.basename(f)[2:].rsplit('_', 1)[0]
        if p not in poses: poses.append(p)
    rows = [(p, sorted(glob.glob(os.path.join(d, f'k_{p}_*.png')))) for p in poses]
    allp = [os.path.join(d, 'guide.png')] + [f for _, fs in rows for f in fs]
    bb = union(allp); tw = 420; th = round(tw * (bb[3] - bb[1]) / (bb[2] - bb[0])); nc = max(len(fs) for _, fs in rows) + 1
    sh = Image.new('RGB', (tw * nc, (th + 26) * len(rows)), (24, 24, 28)); dr = ImageDraw.Draw(sh); F = font(24)
    for r, (p, fs) in enumerate(rows):
        for c, f in enumerate([os.path.join(d, 'guide.png')] + fs):
            sh.paste(Image.open(f).convert('RGB').crop(bb).resize((tw, th)), (c * tw, r * (th + 26) + 26))
            dr.text((c * tw + 6, r * (th + 26) + 2), ('guide' if c == 0 else f'{p} {os.path.basename(f)[:-4].rsplit("_", 1)[1]}'), fill=(255, 224, 138), font=F)
    sh.save(out, quality=86); print(out, sh.size)


def board(ch, out, spr, scene, x, y, scale, items):
    d = os.path.join(W, 'sleep', ch)
    rows = [[]]
    for it in items:
        if it == '|': rows.append([]); continue
        k, f = it.split('=', 1); rows[-1].append((k, f if os.path.isabs(f) else os.path.join(d, f)))
    files = []
    for r in rows:
        for _, f in r:
            if f not in files: files.append(f)
    bb = union(files)
    tmp = tempfile.mkdtemp()
    subprocess.run([sys.executable, '-I', os.path.join(T, 'sleep_pixelize.py'), spr, d, tmp, 'f'] + files, check=True, capture_output=True)
    meta = json.load(open(os.path.join(tmp, 'f.json')))
    bg = Image.open(os.path.join(R, 'assets', 'pointclick', scene + '.png')).convert('RGBA')
    p = PERSP[scene]; s = float(scale) if scale != '-' else max(min(p[1], p[3]) * .8, min(max(p[1], p[3]), p[1] + (p[3] - p[1]) * (y - p[0]) / (p[2] - p[0])))
    vw = round(max(meta['w'] * s + 40, 120)); vh = round(meta['h'] * s + 30)
    cx0 = max(0, min(480 - vw, round(x - vw / 2))); cy0 = max(0, min(270 - vh, round(y - meta['ay'] * s - 15)))
    pw = vw * 3; ph = vh * 3; tw = max(330, pw); th = round(tw * (bb[3] - bb[1]) / (bb[2] - bb[0])); cw = tw + 12
    nc = max(len(r) for r in rows); F = font(26); FT = font(34)
    sh = Image.new('RGB', (cw * nc + 20, 60 + len(rows) * (th + ph + 50)), (24, 24, 28)); dr = ImageDraw.Draw(sh)
    dr.text((10, 10), f'{ch} : coucher, sommeil, réveil', fill=(255, 255, 255), font=FT)
    for r, row in enumerate(rows):
        y0 = 60 + r * (th + ph + 50)
        for c, (k, f) in enumerate(row):
            x0 = 10 + c * cw
            dr.text((x0 + 4, y0), f'{c + 1}. {NAMES.get(k, k)}', fill=(255, 224, 138), font=F)
            sh.paste(Image.open(f).convert('RGB').crop(bb).resize((tw, th)), (x0, y0 + 30))
            sp = Image.open(os.path.join(tmp, f'f_{files.index(f)}.png')); sp = sp.resize((max(1, round(sp.width * s)), max(1, round(sp.height * s))), Image.NEAREST)
            v = bg.copy(); v.alpha_composite(sp, (round(x - meta['ax'] * s), round(y - meta['ay'] * s)))
            sh.paste(v.crop((cx0, cy0, cx0 + vw, cy0 + vh)).resize((pw, ph), Image.NEAREST).convert('RGB'), (x0, y0 + 34 + th))
    sh.save(out, quality=88); print(out, sh.size)


a = sys.argv[1:]
if a[0] == 'contact': contact(a[1], a[2])
else: board(a[1], a[2], a[3], a[4], float(a[5]), float(a[6]), a[7], a[8:])
