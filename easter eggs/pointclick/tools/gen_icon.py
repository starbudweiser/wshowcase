#!/usr/bin/env python3 -I
"""Icône du bureau : un seau à cornes (création originale). Sortie : assets/pointclick/icon.png (256 px)."""
import os
from PIL import Image, ImageDraw, ImageFilter
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
S = 1024
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
# fond : carré arrondi dégradé nuit → braise
bg = Image.new('RGBA', (S, S)); px = bg.load()
for y in range(S):
    t = y / S; c = (int(34 + 70 * t * t), int(30 + 20 * t), int(58 - 10 * t), 255)
    for x in range(S): px[x, y] = c
m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, S - 1, S - 1), 230, fill=255)
im.paste(bg, (0, 0), m)
d = ImageDraw.Draw(im)
# soleil couchant derrière
d.ellipse((250, 380, 774, 904), fill=(245, 158, 11, 255)); d.ellipse((300, 430, 724, 854), fill=(251, 191, 36, 255))
# cornes
horn = (250, 236, 196, 255); horn2 = (206, 176, 124, 255)
for sgn in (-1, 1):
    cx = 512 + sgn * 250
    pts = [(cx - sgn * 70, 470), (cx + sgn * 40, 430), (cx + sgn * 140, 330), (cx + sgn * 150, 190), (cx + sgn * 90, 150), (cx + sgn * 90, 300), (cx + sgn * 10, 380), (cx - sgn * 70, 400)]
    d.polygon(pts, fill=horn, outline=(40, 24, 30, 255), width=14)
    d.polygon([pts[2], pts[3], pts[4], (cx + sgn * 105, 250), (cx + sgn * 110, 330)], fill=horn2)
# seau
wood = (176, 112, 60, 255); wood2 = (124, 76, 40, 255); steel = (176, 184, 200, 255)
d.polygon([(250, 440), (774, 440), (700, 860), (324, 860)], fill=wood, outline=(40, 24, 30, 255), width=14)
for x in (400, 512, 624): d.line([(x - (512 - x) // 12, 450), (x - (512 - x) // 6, 850)], fill=wood2, width=12)
d.polygon([(250, 440), (330, 440), (370, 860), (324, 860)], fill=wood2)
d.rectangle((262, 520, 762, 560), fill=steel, outline=(40, 24, 30, 255), width=8)
d.rectangle((298, 740, 726, 780), fill=steel, outline=(40, 24, 30, 255), width=8)
d.ellipse((240, 400, 784, 490), fill=wood2, outline=(40, 24, 30, 255), width=14); d.ellipse((280, 414, 744, 474), fill=(70, 44, 30, 255))
# reflet
d.polygon([(420, 560), (450, 560), (470, 740), (440, 740)], fill=(255, 255, 255, 60))
im.resize((256, 256), Image.LANCZOS).save(os.path.join(R, 'assets', 'pointclick', 'icon.png'), optimize=True)
