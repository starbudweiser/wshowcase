#!/usr/bin/env python3
"""Clin d'œil du vélo qui vole devant la pleine lune, en ombre chinoise : animation pixel art dessinée image par image.
Le garçon pédale (jambes calculées hanche-genou-pédale sur un pédalier qui tourne), les roues tournent (rayons), la petite créature
est dans le panier. 8 images par tour de pédalier, et 3 inclinaisons pré-dessinées (le vélo monte vers le haut à droite) pour ne
jamais faire pivoter du pixel art dans le jeu (flou). Dessin sur-échantillonné x8 puis réduit et seuillé : pixels nets, une seule couleur.
Sortie : assets/pointclick/spr/bike_fly.png, planche de 8 colonnes (phases) x 3 lignes (inclinaisons 6°, 12°, 18°), images de FW x FH."""
import os, math
from PIL import Image, ImageDraw, ImageChops
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(R, 'assets', 'pointclick', 'spr', 'bike_fly.png')
S, FW, FH, N = 8, 34, 32, 8
TILTS = (6, 12, 18)
INK = (6, 7, 16)
CX, CY = 17.5, 19.0          # position, dans l'image, de l'origine du dessin (axe du pédalier, légèrement relevé)


def frame(phase, tilt):
    im = Image.new('L', (FW * S, FH * S), 0); d = ImageDraw.Draw(im)
    P = lambda x, y: ((CX + x) * S, (CY + y) * S)
    line = lambda pts, w: d.line([P(*p) for p in pts], fill=255, width=max(1, round(w * S)), joint='curve')
    disc = lambda x, y, rx, ry=None: d.ellipse([P(x - rx, y - (ry or rx)), P(x + rx, y + (ry or rx))], fill=255)
    poly = lambda pts: d.polygon([P(*p) for p in pts], fill=255)
    th = phase / N * 2 * math.pi                       # angle du pédalier
    BB, RW, FWc, RAD = (-1.0, 2.5), (-9.0, 2.0), (9.0, 2.0), 4.6
    # roues : pneu net + 3 rayons fins (6 demi-rayons) sur un calque à part, semi-transparents comme sur les ombres chinoises du film ;
    # 22,5° par image -> boucle parfaite (180° en 8 images = 3 périodes de rayons), sens de la marche
    sp = Image.new('L', im.size, 0); ds = ImageDraw.Draw(sp)
    wa = phase * math.radians(22.5)
    for cx, cy in (RW, FWc):
        d.ellipse([P(cx - RAD, cy - RAD), P(cx + RAD, cy + RAD)], outline=255, width=round(1.15 * S))
        for k in range(3):
            a = wa + k * math.pi / 3
            ds.line([P(cx - math.cos(a) * RAD, cy - math.sin(a) * RAD), P(cx + math.cos(a) * RAD, cy + math.sin(a) * RAD)], fill=255, width=round(0.6 * S))
        disc(cx, cy, 0.55)
    # cadre (type BMX) et guidon
    seat, head, grip = (-4.6, -4.4), (6.2, -4.6), (4.8, -8.4)
    line([RW, BB, head, FWc], 1.1); line([RW, seat, BB], 1.0); line([seat, head], 1.0)
    line([head, (6.6, -7.6), grip], 1.0); line([(-6.0, -4.9), (-3.0, -4.9)], 1.2)        # selle
    # panier sur le guidon (bas et évasé), et la petite créature emmitouflée dans sa couverture : grosse tête allongée vers l'avant sur un cou fin
    poly([(6.3, -10.2), (12.6, -10.2), (12.0, -5.8), (6.9, -5.8)])
    disc(9.2, -11.0, 2.7, 1.6)
    line([(9.4, -11.6), (10.2, -13.8)], 0.9); disc(11.0, -15.0, 2.5, 1.5)
    # le garçon : hanche sur la selle, dos rond penché vers le guidon, tête ronde sous une capuche qui pointe vers l'arrière
    hip, sh = (-4.4, -5.8), (0.2, -12.2)
    line([hip, (-2.4, -10.0), sh], 3.3); disc(1.4, -14.9, 2.35); poly([(-0.3, -16.6), (-1.9, -14.4), (0.2, -13.4)])
    line([sh, (3.0, -10.3), grip], 1.25)
    # jambes : la proche (pédale à th) et la lointaine (th + pi), genou vers l'avant
    for a in (th + math.pi, th):
        p = (BB[0] + math.cos(a) * 2.3, BB[1] + math.sin(a) * 2.3)
        line([BB, p], 0.8)
        L1, L2 = 5.7, 5.5
        dx, dy = p[0] - hip[0], p[1] - hip[1]; dd = min(math.hypot(dx, dy), L1 + L2 - 0.05)
        aa = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd); h = math.sqrt(max(0.0, L1 * L1 - aa * aa))
        bx, by = hip[0] + aa * dx / dd, hip[1] + aa * dy / dd
        k1, k2 = (bx - h * dy / dd, by + h * dx / dd), (bx + h * dy / dd, by - h * dx / dd)
        knee = k1 if k1[0] > k2[0] else k2
        line([hip, knee], 1.9); line([knee, p], 1.5); line([(p[0] - 0.4, p[1]), (p[0] + 1.4, p[1] + 0.1)], 1.0)
    rot = lambda m: m.rotate(tilt, resample=Image.BICUBIC, center=(CX * S, CY * S)).resize((FW, FH), Image.BOX)
    a, b = rot(im).point(lambda v: 255 if v > 104 else 0), rot(sp).point(lambda v: 110 if v > 70 else 0)
    out = Image.new('RGBA', (FW, FH), INK + (0,)); out.putalpha(ImageChops.lighter(a, b)); return out


sheet = Image.new('RGBA', (FW * N, FH * len(TILTS)), (0, 0, 0, 0))
for r, t in enumerate(TILTS):
    for c in range(N): sheet.paste(frame(c, t), (c * FW, r * FH))
sheet.save(OUT, optimize=True); print('ok', OUT, sheet.size)
