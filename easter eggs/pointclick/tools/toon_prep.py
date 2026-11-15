#!/usr/bin/env python3
"""Prépare une paire d'images clés pour ToonCrafter (toon_interp.py) : fond uni vert (bleu pour la fermière), cadre commun aux deux poses,
au format 512x320 du modèle. Le cadre est enregistré (crop.json, coordonnées de la toile guide 1536x1024) pour replacer ensuite les
images calculées dans la planche à cadre fixe.
Usage : toon_prep.py perso debut.png fin.png dossier [--pad 28]  (images prises dans work/sleep/<perso>/, ou chemins complets)
Écrit dossier/a.png, dossier/b.png, dossier/crop.json."""
import sys, os, json, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sleep_clips import green, subject_box, S, GREEN, BG

TW, TH = 512, 320


def frame(box, GW=1536, GH=1024):
    """rectangle du personnage élargi au format 512x320, centré, sans sortir de la toile"""
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    if w / h < TW / TH: w = h * TW / TH
    else: h = w * TH / TW
    w, h = min(w, GW), min(h, GH)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    x0 = min(max(0, cx - w / 2), GW - w); y0 = min(max(0, cy - h / 2), GH - h)
    return {'box': [round(x0), round(y0), round(x0 + w), round(y0 + h)], 'size': [TW, TH]}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('perso'); ap.add_argument('a'); ap.add_argument('b'); ap.add_argument('out'); ap.add_argument('--pad', type=int, default=28)
    o = ap.parse_args()
    src = [p if os.path.isabs(p) else os.path.join(S, o.perso, p) for p in (o.a, o.b)]
    os.makedirs(o.out, exist_ok=True)
    crop = frame(subject_box(src, o.pad))
    json.dump(crop, open(os.path.join(o.out, 'crop.json'), 'w'))
    for p, n in zip(src, ('a.png', 'b.png')):
        dst = os.path.join(o.out, n)
        if os.path.exists(dst): os.remove(dst)
        green(p, dst, BG.get(o.perso, GREEN), crop)
    print(o.out, crop)


if __name__ == '__main__': main()
