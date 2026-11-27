#!/usr/bin/env python3 -I
"""Saison 2 en « rendu années 90 » : chaque image de la saison 2 convertie EXACTEMENT comme celles de la saison 1
(décors : tools/bg_pixelize.py ; personnages et objets : tools/sprites_pixelize.py), dans assets/pointclick/s2/90/.
  decor <nom> <source>   480 × 270, couleurs +12 %, contraste +5 %, 64 couleurs (coupe médiane) en tramage Floyd-Steinberg
  card  <nom> <source>   idem pour une vignette d'ouverture (s2/90/cards/<nom>.png)
  sprites                tous les sprites HD (s2/spr/*.png) : moitié de taille, 56 couleurs sans tramage, couleurs +15 %,
                         contraste +8 %, contour sombre d'un pixel ; même point d'ancrage (bas, centre) que la version HD
  anim <base>            images d'une animation (s2/anim/<base>/*.webp), palette commune à toute l'animation (aucun scintillement)
  all                    sprites + toutes les animations
Python de FLUX (PIL + numpy) : "~/Modèles IA/FLUX3-Klein/.venv/bin/python" tools/s2_retro.py …"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageEnhance
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); S2 = os.path.join(R, 'assets', 'pointclick', 's2'); LO = os.path.join(S2, '90')
OUTLINE = (34, 18, 24)


def decor(name, src, sub=''):
    im = Image.open(src).convert('RGB').resize((480, 270), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.12); im = ImageEnhance.Contrast(im).enhance(1.05)
    q = im.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    d = os.path.join(LO, sub); os.makedirs(d, exist_ok=True); p = os.path.join(d, name + '.png'); q.save(p, optimize=True); print(p, os.path.getsize(p) // 1024, 'Ko')


def half(im):
    """moitié de taille, alpha net (comme la saison 1), toile agrandie d'un pixel de chaque côté pour le contour"""
    w, h = im.size; sz = (max(1, round(w / 2)), max(1, round(h / 2)))
    rgb = im.convert('RGB').resize(sz, Image.LANCZOS); al = im.split()[3].resize(sz, Image.LANCZOS).point(lambda v: 255 if v > 140 else 0)
    c = Image.new('RGB', (sz[0] + 2, sz[1] + 1)); c.paste(rgb, (1, 0)); a = Image.new('L', c.size, 0); a.paste(al, (1, 0))
    return c, a


def finish(q, al):
    q = ImageEnhance.Contrast(ImageEnhance.Color(q.convert('RGB')).enhance(1.15)).enhance(1.08)
    out = np.dstack([np.asarray(q), np.asarray(al)]).copy(); op = out[..., 3] > 0
    nb = np.zeros_like(op); nb[1:] |= op[:-1]; nb[:-1] |= op[1:]; nb[:, 1:] |= op[:, :-1]; nb[:, :-1] |= op[:, 1:]
    ring = nb & ~op; out[ring] = (*OUTLINE, 255)            # contour sombre d'un pixel (style de la saison 1)
    return Image.fromarray(out, 'RGBA')


def sprite_file(src, dst, pal=None):
    c, a = half(Image.open(src).convert('RGBA'))
    q = c.quantize(palette=pal, dither=Image.Dither.NONE) if pal else c.quantize(colors=56, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    os.makedirs(os.path.dirname(dst), exist_ok=True); finish(q, a).save(dst, optimize=True)


def sprites():
    for f in sorted(glob.glob(os.path.join(S2, 'spr', '*.png'))):
        sprite_file(f, os.path.join(LO, 'spr', os.path.basename(f)))
    print('sprites', len(glob.glob(os.path.join(LO, 'spr', '*.png'))))


def anim(base):
    fs = sorted(glob.glob(os.path.join(S2, 'anim', base, '*.webp')), key=lambda p: int(os.path.basename(p).split('.')[0]))
    if not fs: return
    # palette commune : coupe médiane sur toutes les images de l'animation mises bout à bout
    hs = [half(Image.open(f).convert('RGBA')) for f in fs]
    strip = Image.new('RGB', (sum(c.width for c, _ in hs), max(c.height for c, _ in hs))); x = 0
    for c, a in hs: bg = Image.new('RGB', c.size, tuple(np.asarray(c)[np.asarray(a) > 0].mean(axis=0).astype(int)) if (np.asarray(a) > 0).any() else (0, 0, 0)); strip.paste(Image.composite(c, bg, a), (x, 0)); x += c.width
    pal = strip.quantize(colors=56, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    for f in fs: sprite_file(f, os.path.join(LO, 'anim', base, os.path.basename(f).replace('.webp', '.png')), pal)
    print('anim', base, len(fs))


a = sys.argv[1:]
if a[0] == 'decor': decor(a[1], a[2])
elif a[0] == 'card': decor(a[1], a[2], 'cards')
elif a[0] == 'sprites': sprites()
elif a[0] == 'anim': anim(a[1])
elif a[0] == 'all':
    sprites()
    for d in sorted(glob.glob(os.path.join(S2, 'anim', '*'))): anim(os.path.basename(d))
