#!/usr/bin/env python3 -I
"""Sprites de nuit du héros (vue de face, 15/11/2026) à partir des poses choisies (work/hero_nuit/choix.json) :
détourage du fond vert uni, réduction à cadre fixe (toutes les images d'un groupe gardent le même cadrage, donc se superposent),
et mesure du visage (approche et portrait de repos : centre et largeur, en pixels du sprite) qui sert au moteur à enchaîner l'approche à taille de visage égale.
  portrait et gestes : 1280x1024 -> 304x243 ; approche : 1280x1024 -> 640x512 (elle est affichée plus grande).
Écrit assets/pointclick/spr/hero_n<Nom>.png et assets/pointclick/spr/hero_n.json {nom: [cx, cy, largeur du visage]}."""
import os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
T = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(T, '..', 'work', 'hero_nuit')
OUT = os.path.abspath(os.path.join(T, '..', '..', '..', 'assets', 'pointclick', 'spr'))
NAMES = {'ap1': 'Ap1', 'ap2': 'Ap2', 'ap3': 'Ap3', 'neutral': 'Neutral', 'talk': 'Talk', 'blink': 'Blink', 'pointA': 'PointA', 'point': 'Point',
         'shrugA': 'ShrugA', 'shrug': 'Shrug', 'pleadA': 'PleadA', 'plead': 'Plead', 'thinkA': 'ThinkA', 'think': 'Think', 'waveA': 'WaveA',
         'wave': 'Wave', 'knockA': 'KnockA', 'knockB': 'KnockB', 'knockC': 'KnockC'}


def key(im):
    A = np.asarray(im.convert('RGB')).astype(np.float32); h, w, _ = A.shape
    bg = np.median(np.concatenate([A[:8].reshape(-1, 3), A[:, :8].reshape(-1, 3), A[:, -8:].reshape(-1, 3)]), 0)
    d = np.abs(A - bg).sum(2)
    g = A[..., 1] - np.maximum(A[..., 0], A[..., 2])                 # dominante verte
    al = np.clip((d - 60) / 70, 0, 1) * np.clip(1 - (g - 25) / 50, 0, 1)
    m = al > 0.5; lab, n = nd.label(m)
    if n: sz = nd.sum(m, lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = sz >= 400; al = al * keep[lab]
    ho = nd.binary_fill_holes(al > 0.5) & ~(al > 0.5); hl, hn = nd.label(ho)     # petits trous fermés (rivets à reflet vert) : rebouchés
    if hn: hs = nd.sum(ho, hl, range(1, hn + 1)); small = np.zeros(hn + 1, bool); small[1:] = hs < 300; al = np.where(small[hl], 1.0, al)
    A[..., 1] -= np.clip(g, 0, None) * (al > 0) * (al < 0.98)       # franges vertes : vert ramené au max(rouge, bleu)
    rgba = np.dstack([np.clip(A, 0, 255), al * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def face(im):
    A = np.asarray(im).astype(int); r, g, b, a = A[..., 0], A[..., 1], A[..., 2], A[..., 3]
    sk = (a > 200) & (r > 150) & (r > g + 25) & (g > b + 10) & (r - b > 55)
    ys, xs = np.nonzero(a > 200); top, bot = ys.min(), ys.max()
    sk[int(top + (bot - top) * 0.5):] = False                       # le visage est dans la moitié haute (mains plus bas)
    lab, n = nd.label(sk)
    best = None
    for i in range(1, n + 1):
        yy, xx = np.nonzero(lab == i)
        if len(yy) < 0.0015 * A.shape[0] * A.shape[1]: continue
        if best is None or yy.min() < best[0]: best = (yy.min(), xx.min(), xx.max(), yy.max())
    y0, x0, x1, y1 = best
    return [round(float(x0 + x1) / 2, 1), round(float(y0 + y1) / 2, 1), int(x1 - x0 + 1)]


def main():
    ch = json.load(open(os.path.join(W, 'choix.json'))); meta = {}
    for k, f in ch.items():
        big = k.startswith('ap'); sz = (640, 512) if big else (304, 243)
        im = key(Image.open(os.path.join(W, f + '.png'))).resize(sz, Image.LANCZOS)
        a = np.asarray(im)[..., 3]; im.putalpha(Image.fromarray(np.where(a > 110, 255, 0).astype(np.uint8)))
        name = 'n' + NAMES[k]; im.save(os.path.join(OUT, f'hero_{name}.png'), optimize=True)
        if k.startswith('ap') or k == 'neutral': meta[name] = face(im)
        print(name, sz, 'visage', meta.get(name))
    json.dump(meta, open(os.path.join(OUT, 'hero_n.json'), 'w'))


main()
