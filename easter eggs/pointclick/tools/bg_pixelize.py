#!/usr/bin/env python3 -I
"""Décor FLUX 1280x720 -> 480x270, palette indexée. Usage : bg_pixelize.py entrée.png sortie.png [couleurs]"""
import sys
from PIL import Image, ImageEnhance
src, dst = sys.argv[1], sys.argv[2]; n = int(sys.argv[3]) if len(sys.argv) > 3 else 64
im = Image.open(src).convert('RGB').resize((480, 270), Image.LANCZOS)
im = ImageEnhance.Color(im).enhance(1.12); im = ImageEnhance.Contrast(im).enhance(1.05)
q = im.quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
q.save(dst, optimize=True)
