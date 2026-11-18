#!/usr/bin/env python3 -I
"""Sprites du nettoyage de la vitre (18/11/2026) : le héros ENTIER, de face, frotte l'écran avec sa main ou un ustensile (poses FLUX de
tools/gen_hero_clean.sh, choisies dans work/hero_clean/choix.json {nom du sprite: image}).

- Incrustation : Fusion 21 DeltaKeyer (tools/key_fusion.py : fond propre + matte intérieure pleine), résultats dans work/hero_clean/key/.
  Le reflet vert n'est retiré que sur le liseré du bord. (SAM + MatAnyone2 essayés le 18/11 : fond pris pour le sujet, bouclier perdu, trous.)
- Échelle : chaque image est réduite pour que la largeur du visage soit FW pixels (celle du portrait de nuit à l'écran), donc toutes les poses
  se superposent à taille égale, à l'échelle 1 (pixels nets).
- Mesures, en pixels du sprite : centre et largeur du visage, point de contact de la main (ou de l'ustensile) sur la vitre.
Écrit assets/pointclick/spr/hc_<nom>.png et js/pointclick/data/clean.js (CLEAN = {nom: [visage x, visage y, contact x, contact y]})."""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '..', 'work', 'hero_clean')
ROOT = os.path.abspath(os.path.join(T, '..', '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'pointclick', 'spr'); JS = os.path.join(ROOT, 'js', 'pointclick', 'data', 'clean.js')
FW = 61                                                    # largeur du visage à l'écran (portrait de nuit : 54 px x 1,133)


def matte(src):
    """matte de Fusion (tools/key_fusion.py) + couleurs de l'image d'origine -> (RGB sans frange, masque du héros)"""
    kp = os.path.join(WK, 'key', src + '.png')
    if not os.path.exists(kp): sys.exit(f'incrustation manquante : {kp} (lancer tools/key_fusion.py)')
    al = np.asarray(Image.open(kp).convert('RGBA'))[..., 3].astype(np.float32) / 255     # du keyer, on ne prend QUE la matte :
    A = np.asarray(Image.open(os.path.join(WK, src + '.png')).convert('RGB')).astype(np.float32)   # la couleur vient de l'image d'origine (le keyer verdit moins la feuille de chou)
    fg = al > 0.5; lab, n = nd.label(fg)
    if n > 1: sz = nd.sum(fg, lab, range(1, n + 1)); fg = lab == (1 + int(np.argmax(sz)))     # une seule silhouette
    band = fg & ((al < 0.98) | ~nd.binary_erosion(fg, iterations=2))                          # liseré : reflet vert ramené au max(rouge, bleu)
    gx = A[..., 1] - np.maximum(A[..., 0], A[..., 2]); A[..., 1] -= np.clip(gx, 0, None) * band
    idx = nd.distance_transform_edt(~fg, return_distances=False, return_indices=True); A = A[idx[0], idx[1]]   # pas de frange à la réduction
    return np.clip(A, 0, 255).astype(np.uint8), fg


def face(A, fg):
    h, w = fg.shape; r, g, b = [A[..., i].astype(int) for i in range(3)]
    sk = fg & (r > 150) & (r > g + 25) & (g > b + 10) & (r - b > 55)
    lab, n = nd.label(sk); best = None
    for i in range(1, n + 1):
        yy, xx = np.nonzero(lab == i)
        cx, cy = (xx.min() + xx.max()) / 2, (yy.min() + yy.max()) / 2
        if not (0.3 * w < cx < 0.7 * w and 0.22 * h < cy < 0.55 * h) or len(yy) < 0.004 * h * w: continue
        if best is None or len(yy) > best[0]: best = (len(yy), xx, yy)
    _, xx, yy = best
    rows = np.unique(yy); widths = [xx[yy == y].max() - xx[yy == y].min() + 1 for y in rows]
    fw = float(np.percentile(widths, 90))                  # largeur des joues (le cou, plus étroit, ne compte pas)
    return float(np.median(xx)), float(yy.min() + (yy.max() - yy.min()) * 0.42), fw


def contact(A, fg, box, kind):
    """point de contact sur la vitre : centre des pixels de la main ou de l'ustensile dans la boîte FLUX élargie ; à défaut, centre de la boîte"""
    h, w = fg.shape; y0, x0, y1, x1 = box; my, mx = (y1 - y0) * 0.25, (x1 - x0) * 0.25
    Y0, Y1, X0, X1 = [int(np.clip(v, 0, 1) * s) for v, s in ((y0 - my, h), (y1 + my, h), (x0 - mx, w), (x1 + mx, w))]
    r, g, b = [A[Y0:Y1, X0:X1, i].astype(int) for i in range(3)]; f = fg[Y0:Y1, X0:X1]
    skin = (r > 150) & (r > g + 25) & (g > b + 10) & (r - b > 55)
    mx_, mn_ = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    tool = {'rag': (mx_ - mn_ < 30) & (mx_ > 95) & (mx_ < 215), 'leaf': (g > r) & (g > b + 30), 'duster': (mx_ - mn_ > 90) & ~skin,
            'sleeve': (r > g + 15) & (g > b) & (mx_ < 150)}.get(kind)
    m = f & (skin | tool) if kind not in ('sleeve',) and tool is not None else f & tool if kind == 'sleeve' else f & skin
    if m.sum() < 200: return (x0 + x1) / 2 * w, (y0 + y1) / 2 * h
    yy, xx = np.nonzero(m)
    if kind == 'finger':                                   # le bout de l'index : le petit halo blanc de la tache qu'il frotte, sinon la peau la plus haute
        halo = f & (mn_ > 190) & (mx_ - mn_ < 35)
        if halo.sum() > 150: hy, hx = np.nonzero(halo); return X0 + float(np.median(hx)), Y0 + float(np.median(hy))
        top = yy <= yy.min() + max(6, (yy.max() - yy.min()) * 0.06); return X0 + float(np.median(xx[top])), Y0 + float(yy.min()) + 8
    return X0 + float(np.median(xx)), Y0 + float(np.median(yy))


def main():
    ch = json.load(open(os.path.join(WK, 'choix.json'))); meta = {}
    for name, src in ch.items():
        kind = name.split('_')[0]
        raw = np.asarray(Image.open(os.path.join(WK, src + '.png')).convert('RGB'))
        fx, fy, fw = face(raw, np.ones(raw.shape[:2], bool))
        bj = os.path.join(WK, src + '.box.json'); box = json.load(open(bj))[1]['bbox'] if os.path.exists(bj) and kind != 'breath' else None
        A, fg = matte(src)
        cx, cy = contact(A, fg, box, kind) if box else (fx, fy + fw * 0.55)    # buée : la bouche
        s = FW / fw; H, W = fg.shape; sz = (round(W * s), round(H * s))
        rgba = np.dstack([A, fg.astype(np.uint8) * 255])
        im = Image.fromarray(rgba, 'RGBA').resize(sz, Image.LANCZOS)
        a = np.asarray(im)[..., 3]; im.putalpha(Image.fromarray(np.where(a > 110, 255, 0).astype(np.uint8)))
        bb = im.getbbox(); im = im.crop(bb)                  # rogné au plus juste ; les mesures suivent le rognage
        im.save(os.path.join(OUT, f'hc_{name}.png'), optimize=True)
        meta[name] = [round(fx * s - bb[0], 1), round(fy * s - bb[1], 1), round(cx * s - bb[0], 1), round(cy * s - bb[1], 1)]
        print(name, im.size, meta[name])
    with open(JS, 'w') as f:
        f.write('/* nettoyage de la vitre (tools/hero_clean_sprites.py, généré) : sprite hc_<nom>.png -> [visage x, visage y, contact x, contact y],\n'
                '   en pixels du sprite, à l\'échelle 1 (largeur du visage = %d px pour toutes les poses) */\nexport const CLEAN = %s;\n' % (FW, json.dumps(meta)))


if __name__ == '__main__':
    main()
