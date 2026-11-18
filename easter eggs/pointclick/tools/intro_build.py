#!/usr/bin/env python3 -I
"""Images FLUX de l'intro et de l'écran titre (work/intro/) -> assets/pointclick/intro/ et assets/pointclick/title/, à la taille du jeu.
Décors : réduction + palette indexée tramée (comme bg_pixelize.py) ; personnages et objets : détourage du fond magenta (sprites_pixelize.py).
Le choix des candidats retenus est dans PICK. Usage : intro_build.py [décors|sprites|titre]   (sans argument : tout)"""
import os, sys, subprocess
from PIL import Image, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(D, '..', '..', '..'))
W = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'intro')
OUT = os.path.join(R, 'assets', 'pointclick', 'intro'); TOUT = os.path.join(R, 'assets', 'pointclick', 'title')
os.makedirs(OUT, exist_ok=True); os.makedirs(TOUT, exist_ok=True)
PICK = {
    'p1': 'p1_tall_13', 'p2': 'p2_pano_22', 'rail': 'rail_82',
    'comp': 'comp_32', 'thief': 'thief_42',
    'comp_back': ['comp_back1_312', 'comp_back2_312', 'comp_back3_312', 'comp_back4_312'],   # même baudrier sur les 4 poses
    'thief_cu': ['thief_cu1_321', 'thief_cu2_322', 'thief_cu3_321', 'thief_cu4_321', 'thief_cu5_321'],
    'title_bg': 'tbg_201', 'logo_fr': 'tlogo_fr_221', 'logo_en': 'tlogo_en_233',   # décor 201 choisi par Stéphan le 18/11
}
for a in sys.argv[2:]:   # surcharges : clé=valeur (listes séparées par des virgules)
    k, v = a.split('='); PICK[k] = v.split(',') if ',' in v else v


def bg(src, dst, w, h, n=64, method=Image.Quantize.MEDIANCUT):
    im = Image.open(os.path.join(W, src + '.png')).convert('RGB').resize((w, h), Image.LANCZOS)
    im = ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.12)).enhance(1.05)
    im.quantize(colors=n, method=method, dither=Image.Dither.FLOYDSTEINBERG).save(dst, optimize=True); print(os.path.basename(dst), (w, h))


def spr(name, src, h, *opt, base=OUT):
    rel = os.path.relpath(os.path.join(base, name), os.path.join(R, 'assets', 'pointclick', 'spr'))   # sprites_pixelize écrit dans spr/ : chemin relatif
    subprocess.run([sys.executable, '-I', os.path.join(D, 'sprites_pixelize.py'), rel, os.path.join(W, src + '.png'), str(h), *map(str, opt)], check=True)


what = sys.argv[1] if len(sys.argv) > 1 else 'tout'
if what in ('tout', 'décors'):
    bg(PICK['p1'], os.path.join(OUT, 'p1.png'), 480, 540, 128, Image.Quantize.FASTOCTREE)   # octree : aurore et nuages sans aplats en bandes
    bg(PICK['p2'], os.path.join(OUT, 'p2.png'), 945, 270, 128, Image.Quantize.FASTOCTREE)
if what in ('tout', 'sprites'):
    spr('rail', PICK['rail'], 84, 56)
    for n, h in (('prop_grass', 44), ('prop_rock', 34), ('prop_fence', 48), ('prop_pine', 96)): spr(n, n, h, 48)
    spr('comp_s', PICK['comp'], 74); spr('thief_s', PICK['thief'], 66)
    for i, s in enumerate(PICK['comp_back']): spr(f'comp_back{i + 1}', s, 0 if i else 236, 64, *(['--like', '../intro/comp_back1'] if i else []))
    for i, s in enumerate(PICK['thief_cu']): spr(f'thief_cu{i + 1}', s, 0 if i else 232, 64, *(['--like', '../intro/thief_cu1'] if i else []), '--fill')
if what in ('tout', 'titre'):
    bg(PICK['title_bg'], os.path.join(TOUT, 'bg.png'), 480, 270, 256, Image.Quantize.FASTOCTREE)   # l'octree garde les petites taches de couleur (chou, fromage)
    for l in ('fr', 'en'):
        if os.path.exists(os.path.join(W, PICK['logo_' + l] + '.png')): spr('logo_' + l, PICK['logo_' + l], 58, 64, base=TOUT)
