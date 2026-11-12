#!/usr/bin/env python3 -I
"""Sprites FLUX (fond magenta) -> PNG détourés, à la taille du jeu, couleurs réduites.
Usage : sprites_pixelize.py nom source.png hauteur_px [couleurs]   -> assets/pointclick/spr/<nom>.png
Plusieurs images d'un même personnage : même facteur d'échelle via l'option --like <nom déjà traité>."""
import sys, os, json
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageChops
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(R, 'assets', 'pointclick', 'spr'); os.makedirs(OUT, exist_ok=True)
SC = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'scales.json')


def key(im, hue=False):
    """hue : portraits sur fond rose-rouge, proche de la peau ; l'écart bleu-vert (positif pour le fond, négatif pour la peau) départage"""
    im = im.convert('RGB'); px = im.load(); w, h = im.size
    bg = tuple(sum(px[x, y][i] for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))) // 4 for i in range(3))
    a = Image.new('L', (w, h), 255); ap = a.load(); dm = Image.new('L', (w, h), 0); dp = dm.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; d = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) + (2 * abs((b - g) - (bg[2] - bg[1])) if hue else 0)
            ap[x, y] = 0 if d < 70 else (255 if d > 150 else int((d - 70) / 80 * 255)); dp[x, y] = 255 if d >= 30 else 0
    return im, a, dm


def main():
    a = sys.argv[1:]; like = None; bright = 1.0
    if '--bright' in a: i = a.index('--bright'); bright = float(a[i + 1]); del a[i:i + 2]
    if '--like' in a: i = a.index('--like'); like = a[i + 1]; del a[i:i + 2]
    mul = 1.0
    if '--mul' in a: i = a.index('--mul'); mul = float(a[i + 1]); del a[i:i + 2]
    fill = '--fill' in a
    if fill: a.remove('--fill')
    name, src, th = a[0], a[1], int(a[2]); ncol = int(a[3]) if len(a) > 3 else 56
    im, al, dm = key(Image.open(src), fill)
    al = al.point(lambda v: 255 if v > 120 else 0)
    # comble les trous du masque (peau proche du fond magenta) : sinon le contour sombre dessine des « nervures » noires dans le corps
    fl = al.copy(); ImageDraw.floodfill(fl, (0, 0), 128); al = ImageChops.lighter(al, ImageChops.multiply(fl.point(lambda v: 255 if v == 0 else 0), dm))   # seuls les trous qui ne sont pas du fond
    if fill:   # portraits : tout ce qui n'est pas relié au bord est le sujet (langue rose, dents...), même de couleur proche du fond
        fl = al.copy(); ImageDraw.floodfill(fl, (0, 0), 128); al = ImageChops.lighter(al, fl.point(lambda v: 255 if v == 0 else 0))
    al = al.filter(ImageFilter.MinFilter(3))                                                   # rogne la frange magenta
    bb = al.getbbox(); im = im.crop(bb); al = al.crop(bb)
    sc = json.load(open(SC)) if os.path.exists(SC) else {}
    f = (sc[like] if like else th / im.size[1]) * mul
    sc[name] = f; json.dump(sc, open(SC, 'w'))
    sz = (max(1, round(im.size[0] * f)), max(1, round(im.size[1] * f)))
    im = im.resize(sz, Image.LANCZOS); al = al.resize(sz, Image.LANCZOS).point(lambda v: 255 if v > 140 else 0)
    q = im.quantize(colors=ncol, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    q = ImageEnhance.Contrast(ImageEnhance.Color(q).enhance(1.15)).enhance(1.08)
    if bright != 1.0: q = ImageEnhance.Brightness(q).enhance(bright)
    out = q.convert('RGBA'); out.putalpha(al)
    pa = out.load(); ow, oh = out.size; src = out.copy().load()          # contour sombre de 1 px (style dessin animé)
    for y in range(oh):
        for x in range(ow):
            if src[x, y][3] == 0 and any(0 <= x+dx < ow and 0 <= y+dy < oh and src[x+dx, y+dy][3] > 0 for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))): pa[x, y] = (34, 18, 24, 255)
    # recentre horizontalement sur le centre de masse : les images d'une animation ne « glissent » pas d'une pose à l'autre
    ap = out.split()[3]; ow, oh = out.size; cols = [sum(1 for y in range(oh) if ap.getpixel((x, y)) > 0) for x in range(ow)]; tot = sum(cols) or 1
    cx = sum(i * c for i, c in enumerate(cols)) / tot; half = int(max(cx, ow - cx)) + 1
    canvas = Image.new('RGBA', (half * 2, oh), (0, 0, 0, 0)); canvas.paste(out, (int(round(half - cx)), 0)); out = canvas
    out.save(os.path.join(OUT, name + '.png'), optimize=True); print(name, out.size)


main()
