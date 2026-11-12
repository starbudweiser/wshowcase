#!/usr/bin/env python3
"""Herbes et fleurs au vent : FLUX a redessiné toute la zone (neige, terre, pierres comprises), si bien qu'en enchaînant les variantes
le sol paraissait bouger. On ne garde des images animées que les pixels qui sont de la végétation dans le décor d'origine
(herbe verte ou olive, fleurs bleues saturées) : la neige, la terre et les pierres restent celles du décor, immobiles.
Usage : veg_mask.py [id ...]   (par défaut : toutes les zones d'herbe, de fleurs et de jardin)"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy.ndimage import binary_opening, binary_dilation
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); A = os.path.join(R, 'assets', 'pointclick', 'anim')
IDS = sys.argv[1:] or ['mill_grass', 'mill_garden', 'rue_grass', 'rue_flowers']
J = json.load(open(os.path.join(A, 'index.json')))
for id_ in IDS:
    j = J[id_]; scene = id_.split('_')[0]
    bg = np.asarray(Image.open(os.path.join(R, 'assets', 'pointclick', scene + '.png')).convert('RGB'), int)[j['y']:j['y'] + j['h'], j['x']:j['x'] + j['w']]
    r, g, b = bg[..., 0], bg[..., 1], bg[..., 2]; mx = bg.max(-1); mn = bg.min(-1)
    green = (g > r + 3) & (g >= b - 4) & (mx < 215)                       # herbe, feuilles
    flower = (b > r + 30) & (b > g + 8) & (mx - mn > 60) & (mx < 225)       # fleurs bleues (pas la neige, pâle et peu saturée)
    veg = binary_opening(green | flower, iterations=1)
    veg = binary_dilation(veg, iterations=1) & ~((mn > 150) & (mx - mn < 70))   # jamais la neige
    for n in range(j['n']):
        p = os.path.join(A, f'{id_}_{n}.png'); im = np.asarray(Image.open(p).convert('RGBA')).copy()
        im[..., 3] = np.where(veg, im[..., 3], 0)
        Image.fromarray(im).save(p, optimize=True)
    print(id_, f'végétation : {veg.mean() * 100:.0f} % de la zone')
