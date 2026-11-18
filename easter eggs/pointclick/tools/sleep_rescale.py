#!/usr/bin/env python3 -I
"""Remet une pose clé à la bonne échelle quand FLUX l'a dessinée trop grande (mesure faite sur un repère fixe du personnage,
par exemple la crête de la poule) : le personnage est agrandi ou réduit autour de son point d'appui au sol (bas, centre),
sans être redessiné, et reposé sur un fond uni de la couleur du fond d'origine.
Usage : sleep_rescale.py source.png sortie.png facteur"""
import sys
import numpy as np
from PIL import Image, ImageFilter
src, out, f = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src).convert('RGB'); A = np.asarray(im).astype(int); h, w = A.shape[:2]
bg = np.array([A[2, 2], A[2, -3], A[-3, 2], A[-3, -3]]).mean(0)
m = Image.fromarray(np.where(np.abs(A - bg).sum(2) > 45, 255, 0).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
x0, y0, x1, y1 = m.getbbox(); x0, y0, x1, y1 = max(0, x0 - 6), max(0, y0 - 6), min(w, x1 + 6), min(h, y1 + 6)
sub = im.crop((x0, y0, x1, y1)); sm = m.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(0.8))
nw, nh = round(sub.width * f), round(sub.height * f)
sub = sub.resize((nw, nh), Image.LANCZOS); sm = sm.resize((nw, nh), Image.LANCZOS)
cv = Image.new('RGB', (w, h), tuple(int(v) for v in bg)); cx = (x0 + x1) / 2
cv.paste(sub, (round(cx - nw / 2), y1 - nh), sm); cv.save(out); print(out, f)
