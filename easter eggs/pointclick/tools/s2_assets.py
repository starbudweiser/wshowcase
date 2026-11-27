#!/usr/bin/env python3 -I
"""Saison 2 : prépare les images du jeu (pleine couleur, sans palette, densité 2 = 960 × 540).
  sprite <nom> <source.png|jpg> <hauteur_px> [--flip] [--despill[=all]]  fond magenta -> détouré (bord doux), assets/pointclick/s2/spr/<nom>.webp
  decor  <nom> <source>                                 -> 960 × 540 WebP, assets/pointclick/s2/<nom>.webp
  card   <nom> <source>                                 -> vignette d'ouverture 960 × 540 WebP, assets/pointclick/s2/cards/<nom>.webp
Python de FLUX (PIL + numpy) : "~/Modèles IA/FLUX3-Klein/.venv/bin/python" tools/s2_assets.py …"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(R, 'assets', 'pointclick', 's2')


def key(im):
    """alpha d'après l'écart au fond (moyenne des quatre coins), trous du sujet bouchés (tout ce qui n'est pas relié au bord)"""
    a = np.asarray(im.convert('RGB')).astype(np.int32); h, w, _ = a.shape
    bg = np.mean([a[2, 2], a[2, w - 3], a[h - 3, 2], a[h - 3, w - 3]], axis=0)
    d = np.abs(a - bg).sum(axis=2) + 2 * np.abs((a[..., 2] - a[..., 1]) - (bg[2] - bg[1]))
    al = np.clip((d - 90) / 90, 0, 1)
    # fond = composante reliée au bord parmi les pixels quasi transparents
    from collections import deque
    bgm = al < 0.5; seen = np.zeros_like(bgm); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bgm[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bgm[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bgm[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; q.append((ny, nx))
    hole = ~seen & (al < 0.5)
    al[hole & (d >= 60)] = 1.0        # trous intérieurs d'une autre couleur que le fond (peau rosée…) : sujet ; les vrais jours (entre bras et corps) restent vides
    rgb = a.astype(np.float32)
    # dépollution du magenta sur les bords doux : on retire la part de fond
    m = (al > 0) & (al < 1); k = al[m][:, None]
    rgb[m] = np.clip((rgb[m] - (1 - k) * bg) / np.maximum(k, 0.25), 0, 255)
    if DESPILL:   # frange rose : excès de rouge et de bleu sur le vert retiré (bande du bord, ou toute la silhouette avec --despill=all)
        from scipy.ndimage import binary_erosion
        solid = al > 0; zone = solid if DESPILL == 'all' else solid & ~binary_erosion(solid, iterations=4)
        mg = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]; fix = zone & (mg > (4 if DESPILL == 'all' else 12))
        rgb[fix, 0] -= mg[fix] * 0.85; rgb[fix, 2] -= mg[fix] * 0.85; al[zone & (mg > 60)] *= 0.5
        edge = solid & ~binary_erosion(solid, iterations=5); lum = rgb @ np.array([0.3, 0.59, 0.11]); dk = edge & (lum < 110)   # mèches sombres : rouge résiduel du fond plafonné
        rgb[dk, 0] = np.minimum(rgb[dk, 0], np.maximum(rgb[dk, 1], rgb[dk, 2]) * 1.15 + 6)
    out = np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def sprite(name, src, th, flip=False):
    im = key(Image.open(src))
    alpha = im.split()[3].point(lambda v: 255 if v > 40 else 0)
    im = im.crop(alpha.getbbox())
    f = th / im.size[1]; im = im.resize((max(1, round(im.size[0] * f)), th), Image.LANCZOS)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if VIGNETTE:   # bords fondus en ellipse (vision dans le ciel) : alpha seulement
        a = np.asarray(im).astype(np.float32); h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
        a[..., 3] *= np.clip((1 - np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)) / 0.35, 0, 1); im = Image.fromarray(a.astype(np.uint8), 'RGBA')
    os.makedirs(os.path.join(OUT, 'spr'), exist_ok=True)
    p = os.path.join(OUT, 'spr', name + '.webp'); im.save(p, 'WEBP', quality=90, method=6); print(name, im.size, os.path.getsize(p) // 1024, 'Ko')   # WebP avec transparence : 4 fois plus léger que le PNG


def decor(name, src, sub=''):
    im = Image.open(src).convert('RGB').resize((960, 540), Image.LANCZOS)
    d = os.path.join(OUT, sub); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name + '.webp'); im.save(p, quality=86, method=6); print(name, os.path.getsize(p) // 1024, 'Ko')


DESPILL = next((x.split('=', 1)[1] if '=' in x else 'band' for x in sys.argv if x.startswith('--despill')), None)
VIGNETTE = '--vignette' in sys.argv
a = [x for x in sys.argv[1:] if not x.startswith('--despill') and x != '--vignette']
if a[0] == 'sprite': sprite(a[1], a[2], int(a[3]), '--flip' in a)
elif a[0] == 'decor': decor(a[1], a[2])
elif a[0] == 'card': decor(a[1], a[2], 'cards')
