#!/usr/bin/env python3
"""Torches de la grande salle (24/11/2026) : les 3 images de la torche de gauche faites par gen_regions.py redessinaient la torche
à des places différentes (elle sautait d'une image à l'autre, clignotement). Ici, pour chaque variante de flamme, FLUX 3 Klein calcule
plusieurs graines avec une consigne qui fige la torche et le mur ; on garde, entière, la prise dont le bas (manche, support, mur) colle
le mieux au décor. Aucune retouche : chaque image retenue est une génération complète, traitée comme dans gen_regions.py.
Sortie : assets/pointclick/anim/<id>_<n>.png + planche work/reg/<id>_board.png. Usage : gen_torch_frames.py [hall_torch_l ...]"""
import sys, os, json, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops, ImageStat
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = os.path.join(R, 'easter eggs', 'pointclick', 'work'); REGW = os.path.join(WORK, 'reg', 'torch'); os.makedirs(REGW, exist_ok=True)
OUT = os.path.join(R, 'assets', 'pointclick', 'anim')
S = 1280 / 480
ITEMS = {'hall_torch_l': (30, 70, 64, 150), 'hall_torch_r': (414, 92, 444, 150)}
TORCH = ['the torch flame flickering tall and leaning slightly left', 'the torch flame a little lower and wider with a few embers', 'the torch flame tall and leaning slightly right with a spark']
SEEDS = 4
bgp = Image.open(os.path.join(R, 'assets', 'pointclick', 'hall.png')); bgr = bgp.convert('RGB')
hi = Image.open(os.path.join(WORK, 'hall.png')).convert('RGB')
for iid in (sys.argv[1:] or ['hall_torch_l']):
    x0, y0, x1, y1 = ITEMS[iid]; w, h = x1 - x0, y1 - y0
    cw = max(384, int(w * S * 3)); ch = max(384, int(h * S * 3)); cx, cy = (x0 + x1) / 2 * S, (y0 + y1) / 2 * S
    l = int(min(max(cx - cw / 2, 0), 1280 - cw)); t = int(min(max(cy - ch / 2, 0), 720 - ch))
    ctx = hi.crop((l, t, l + cw, t + ch)); k = 768 / max(cw, ch); gw, gh = round(cw * k / 16) * 16, round(ch * k / 16) * 16
    ref = os.path.join(REGW, iid + '_ctx.png'); ctx.resize((gw, gh), Image.LANCZOS).save(ref)
    base = bgr.crop((x0, y0, x1, y1)); cut = int(h * 0.5)          # bas de la zone : manche, support et mur, qui ne doivent pas bouger
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rectangle([0, 0, w - 1, h - 1], fill=255); mask = mask.filter(ImageFilter.GaussianBlur(1.3))
    keep = []
    for n, d in enumerate(TORCH):
        best = None
        for s in range(SEEDS):
            raw = os.path.join(REGW, f'{iid}_{n}_{s}.png')
            if not os.path.exists(raw):
                p = (f"Exactly the same image, same composition, same painting style, same colors and lighting everywhere. The wooden torch, its "
                     f"iron bracket, the wooden beam and the stone wall stay exactly in the same place, same size and same shape, not moved at all. Only change this: {d}.")
                subprocess.run(['flux-image', p, '-i', ref, '-o', raw, '-s', f'{gw}x{gh}', '--seed', str(9100 + n * 10 + s)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if not os.path.exists(raw): print('MANQUE', raw, flush=True); continue
            g = Image.open(raw).convert('RGB').resize((cw, ch), Image.LANCZOS)
            reg = g.crop((round(x0 * S - l), round(y0 * S - t), round(x1 * S - l), round(y1 * S - t))).resize((w, h), Image.LANCZOS)
            reg = ImageEnhance.Contrast(ImageEnhance.Color(reg).enhance(1.12)).enhance(1.05)
            q = reg.quantize(palette=bgp, dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')
            err = sum(ImageStat.Stat(ImageChops.difference(q.crop((0, cut, w, h)), base.crop((0, cut, w, h)))).mean) / 3
            print(iid, n, s, round(err, 1), flush=True)
            if best is None or err < best[0]: best = (err, q, s)
        if best:
            q = best[1].convert('RGBA'); q.putalpha(mask); q.save(os.path.join(OUT, f'{iid}_{n}.png'), optimize=True); keep.append(best[1])
            print('retenu', iid, n, 'graine', best[2], 'écart', round(best[0], 1), flush=True)
    ims = [base] + keep; board = Image.new('RGB', (len(ims) * (w + 4), h), 'white')
    for i, im in enumerate(ims): board.paste(im, (i * (w + 4), 0))
    board.resize((board.width * 5, board.height * 5), Image.NEAREST).save(os.path.join(WORK, 'reg', f'{iid}_board.png'))
print('fini', flush=True)
