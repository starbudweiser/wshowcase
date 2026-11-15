#!/usr/bin/env python3 -I
"""Pixelisation à cadre fixe d'une suite d'images d'animation (coucher, sommeil, réveil) calculées sur la même toile guide.
Toutes les images d'un personnage partagent : le même cadre (rectangle englobant commun), le même facteur d'échelle que son
sprite debout, le même point d'ancrage (centre de masse du personnage debout, sur la ligne de sol) et la même palette.
Usage : sleep_pixelize.py <sprite> <dossier_guide> <sortie_dir> <prefixe> img1.png img2.png …
  <sprite> : nom du sprite debout dans work/scales.json (giant, guard…) ; --scale F force le facteur jeu/source.
Écrit <sortie_dir>/<prefixe>_<n>.png et <sortie_dir>/<prefixe>.json : {w, h, ax, ay, n} (ancrage en pixels du jeu)."""
import sys, os, json
from PIL import Image, ImageFilter, ImageDraw, ImageChops, ImageEnhance
from scipy import ndimage as nd
MIN_BG = 120          # surface minimale (pixels de la toile guide) d'une zone retirée par sa teinte de fond

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SC = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'scales.json')


def key(im, loose=None):
    im = im.convert('RGB'); px = im.load(); w, h = im.size
    bg = tuple(sum(px[x, y][i] for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))) // 4 for i in range(3))
    a = Image.new('L', (w, h), 0); ap = a.load(); dm = Image.new('L', (w, h), 0); dp = dm.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; d = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            ap[x, y] = 0 if d < 70 else (255 if d > 150 else int((d - 70) / 80 * 255)); dp[x, y] = 255 if d >= 30 else 0
    al = a.point(lambda v: 255 if v > 120 else 0)
    fl = al.copy(); W, H = fl.size; fp = fl.load()
    for x, y in [(x, 0) for x in range(0, W, 8)] + [(x, H - 1) for x in range(0, W, 8)] + [(0, y) for y in range(0, H, 8)] + [(W - 1, y) for y in range(0, H, 8)]:
        if fp[x, y] == 0: ImageDraw.floodfill(fl, (x, y), 128)
    al = ImageChops.lighter(al, ImageChops.multiply(fl.point(lambda v: 255 if v == 0 else 0), dm))
    return unspill(im, al.filter(ImageFilter.MinFilter(3)), bg, loose)


def unspill(im, al, bg, loose=None):
    """fond de couleur vive (vert ToonCrafter, magenta) : les trous fermés du personnage (entre bras et corps) gardent souvent
    une teinte du fond un peu différente de celle des coins, que le seul écart de couleur laisse passer ; on les retire par la
    direction de leur couleur (même teinte que le fond, quelle que soit la luminosité). Puis, sur le bord du personnage, on retire la composante de la
    couleur du fond qui a bavé sur les pixels (franges vertes ou roses).
    loose = (k, couleur) : sur ce fond-là, tolérance d'angle k propre au personnage (safe_k), qui retire aussi les ombres
    portées teintées du fond que ToonCrafter dessine sous le corps."""
    import numpy as np
    B = np.array(bg, np.float32); ch = B - B.mean()
    if np.linalg.norm(ch) < 60: return im, al                     # fond peu coloré : rien à faire
    A = np.asarray(im).astype(np.float32); sn = ch / np.linalg.norm(ch); C = A - A.mean(2, keepdims=True)
    cn = np.linalg.norm(C, axis=2); pr = (C * sn).sum(2)
    k, sat = 0.92, 25
    if loose and np.abs(B - np.array(loose[1], np.float32)).sum() < 90: k, sat = loose[0], 14
    r = (np.asarray(al) > 0) & (pr > k * cn) & (cn > sat)          # même direction de couleur que le fond, assez saturée
    lab, nl = nd.label(r)                                           # seulement les zones étendues (fond enfermé, ombre portée) : un pixel
    if nl:                                                          # isolé verdâtre dans l'ombre d'un vêtement (bruit ToonCrafter) reste au
        big = np.zeros(nl + 1, bool); big[1:] = nd.sum(r, lab, range(1, nl + 1)) >= MIN_BG   # personnage, sinon l'érosion en ferait un trou
        r = big[lab]
    m = (np.asarray(al) > 0) & ~r
    al = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
    m = np.asarray(al) > 0; core = np.asarray(al.filter(ImageFilter.MinFilter(5))) > 0
    sp = (m & ~core & (pr > 0)) | (m & (pr > k * cn) & (pr > 0))     # bords, et reflets de la teinte du fond peu saturés (pagne en fourrure verdi)
    A[sp] -= pr[sp][:, None] * sn
    return Image.fromarray(np.clip(A, 0, 255).astype(np.uint8)), al


def safe_k(im, al, col, limit=0.0002):
    """tolérance d'angle la plus large qui ne retire (presque) aucun pixel du personnage debout (guide) : ses propres couleurs
    proches de la teinte du fond (broderies dorées de Nazim, par exemple) restent ainsi intactes"""
    import numpy as np
    B = np.array(col, np.float32); c = B - B.mean(); sn = c / np.linalg.norm(c)
    A = np.asarray(im).astype(np.float32); C = A - A.mean(2, keepdims=True); cn = np.linalg.norm(C, axis=2); pr = (C * sn).sum(2)
    m = np.asarray(al) > 0; n = max(1, m.sum())
    for k in (0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9):
        if (m & (pr > k * cn) & (cn > 14)).sum() / n < limit: return k
    return 0.92


def mass_x(al):
    w, h = al.size; px = al.load(); s = t = 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if px[x, y]: s += x; t += 1
    return s / max(t, 1)


def main():
    a = sys.argv[1:]; force = None
    if '--scale' in a: i = a.index('--scale'); force = float(a[i + 1]); del a[i:i + 2]
    name, gdir, out, pre = a[:4]; srcs = a[4:]
    gj = json.load(open(os.path.join(gdir, 'guide.json'))); G = gj['ground']
    f = force or json.load(open(SC))[name] / gj['k']                 # pixels du jeu par pixel de la toile guide
    _, gal = key(Image.open(os.path.join(gdir, 'guide.png'))); AX = mass_x(gal)
    ims = [key(Image.open(s)) for s in srcs]
    bb = None
    for _, al in ims:
        b = al.getbbox(); bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    x0, y0, x1, y1 = bb[0] - 4, bb[1] - 4, bb[2] + 4, max(bb[3], G) + 4
    x0 = min(x0, int(AX) - 4); x1 = max(x1, int(AX) + 4)
    sz = (max(1, round((x1 - x0) * f)), max(1, round((y1 - y0) * f)))
    small = []
    for im, al in ims:
        c = im.crop((x0, y0, x1, y1)).resize(sz, Image.LANCZOS); m = al.crop((x0, y0, x1, y1)).resize(sz, Image.LANCZOS).point(lambda v: 255 if v > 140 else 0)
        small.append((c, m))
    # palette commune : quantification sur la mosaïque de toutes les images (pas de couleurs qui sautent d'une image à l'autre)
    mos = Image.new('RGB', (sz[0], sz[1] * len(small)))
    for i, (c, m) in enumerate(small): mos.paste(c, (0, i * sz[1]))
    pal = mos.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    os.makedirs(out, exist_ok=True)
    for i, (c, m) in enumerate(small):
        q = c.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
        q = ImageEnhance.Contrast(ImageEnhance.Color(q).enhance(1.15)).enhance(1.08)
        o = q.convert('RGBA'); o.putalpha(m); p = o.load(); s = o.copy().load(); w, h = o.size
        for y in range(h):
            for x in range(w):
                if s[x, y][3] == 0 and any(0 <= x + dx < w and 0 <= y + dy < h and s[x + dx, y + dy][3] > 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): p[x, y] = (34, 18, 24, 255)
        o.save(os.path.join(out, f'{pre}_{i}.png'), optimize=True)
    meta = {'w': sz[0], 'h': sz[1], 'ax': round((AX - x0) * f, 1), 'ay': round((G - y0) * f, 1), 'n': len(small)}
    json.dump(meta, open(os.path.join(out, pre + '.json'), 'w')); print(pre, meta)


if __name__ == "__main__": main()
