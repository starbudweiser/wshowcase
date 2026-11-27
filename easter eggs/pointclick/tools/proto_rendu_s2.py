#!/usr/bin/env python3 -I
"""Prototypes de rendu de la saison 2 : une illustration FLUX 1280x720 rendue à plusieurs définitions.
s1  = rendu saison 1 (480x270, 64 couleurs tramées, comme bg_pixelize.py)
640 / 800 / 960 = saison 2, 16 millions de couleurs, réduction Lanczos sans palette.
Usage : proto_rendu_s2.py dossier_sortie image1.png [image2.png …]   (nom de sortie = nom de l'image sans _1/_2)"""
import sys, os, re
from PIL import Image, ImageEnhance
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for src in sys.argv[2:]:
    name = re.sub(r'_\d$', '', os.path.splitext(os.path.basename(src))[0])
    im = Image.open(src).convert('RGB')
    s1 = im.resize((480, 270), Image.LANCZOS)
    s1 = ImageEnhance.Contrast(ImageEnhance.Color(s1).enhance(1.12)).enhance(1.05)
    s1.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(f'{out}/{name}_s1.png', optimize=True)
    for w in (640, 800, 960):
        im.resize((w, w * 9 // 16), Image.LANCZOS).save(f'{out}/{name}_{w}.png', optimize=True)
    im.save(f'{out}/{name}_hd.jpg', quality=90)
    print('ok', name)
