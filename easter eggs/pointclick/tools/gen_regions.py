#!/usr/bin/env python3
"""Décor animé par images (sprites) : pour chaque zone mouvante du décor (rivière, roue, mammouth, flammes, herbes...), FLUX 3 Klein (édition,
local et gratuit) redessine la zone en 3 variantes ; elles sont réduites à la taille du jeu, ramenées à la palette du décor et détourées par un
masque adouci. Sortie : assets/pointclick/anim/<id>_<n>.png + index.json (position et taille). Relançable : saute les images déjà calculées.
Usage : gen_regions.py [scène ...]"""
import sys, os, json, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = os.path.join(R, 'easter eggs', 'pointclick', 'work'); REGW = os.path.join(WORK, 'reg'); os.makedirs(REGW, exist_ok=True)
OUT = os.path.join(R, 'assets', 'pointclick', 'anim'); os.makedirs(OUT, exist_ok=True)
S = 1280 / 480
rect = lambda x0, y0, x1, y1: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
WATER = ['the river water with its ripples in slightly different positions and small sparkling light glints elsewhere', 'the river water with the ripples shifted further downstream and new sparkling glints', 'the river water with long soft ripples and glints in yet other places']
WHEEL = ['the wooden water wheel turned by about 20 degrees, the paddles and spokes in new positions', 'the wooden water wheel turned by about 40 degrees, the paddles and spokes in new positions', 'the wooden water wheel turned by about 60 degrees, the paddles and spokes in new positions']
WIND = ['the grass and flowers bending slightly to the right in the wind', 'the grass and flowers bending slightly to the left in the wind', 'the grass and flowers bending strongly to the right in the wind']
FIRE = ['the campfire flames flickering: one tall flame leaning left with a few sparks', 'the campfire flames flickering low and wide with sparks and glowing embers', 'the campfire flames tall and narrow leaning right with sparks']
CFG = {
  'rue': {'src': 'sky_22_nodragon.png', 'items': [
    {'id': 'rue_river1', 'poly': [[395, 198], [420, 190], [450, 192], [470, 198], [470, 218], [450, 226], [420, 228], [400, 218]], 'desc': WATER},
    {'id': 'rue_river2', 'poly': [[330, 158], [352, 156], [385, 158], [392, 166], [360, 168], [335, 166]], 'desc': WATER},
    {'id': 'rue_wheel', 'poly': rect(452, 138, 480, 166), 'desc': WHEEL},
    {'id': 'rue_mammoth', 'poly': rect(386, 128, 421, 162), 'desc': ['the mammoth lowering its head and trunk to graze on the grass', 'the mammoth raising its head high with the trunk lifted', 'the mammoth turning its head slightly with the ears flapping']},
    {'id': 'rue_flowers', 'poly': rect(380, 226, 480, 268), 'desc': WIND},
    {'id': 'rue_grass', 'poly': rect(270, 238, 380, 268), 'desc': WIND}]},
  'mill': {'src': 'mill_121.png', 'items': [
    {'id': 'mill_wheel', 'poly': rect(126, 114, 198, 186), 'desc': WHEEL},
    {'id': 'mill_river', 'poly': [[300, 190], [345, 182], [420, 180], [480, 192], [480, 228], [440, 224], [395, 214], [345, 206], [310, 200]], 'desc': WATER},
    {'id': 'mill_garden', 'poly': rect(0, 188, 116, 216), 'desc': WIND},
    {'id': 'mill_grass', 'poly': rect(100, 236, 300, 268), 'desc': WIND}]},
  'meadow': {'src': 'meadow_141.png', 'items': [
    {'id': 'meadow_fire', 'poly': rect(112, 196, 172, 234), 'desc': FIRE},
    {'id': 'meadow_grass', 'poly': rect(0, 238, 480, 268), 'desc': WIND}]}
}


def build(scene, cfg, idx):
    hi = Image.open(os.path.join(WORK, cfg['src'])).convert('RGB'); bgp = Image.open(os.path.join(R, 'assets', 'pointclick', scene + '.png'))
    for it in cfg['items']:
        xs = [p[0] for p in it['poly']]; ys = [p[1] for p in it['poly']]
        x0, y0, x1, y1 = int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)); w, h = x1 - x0, y1 - y0
        cw = max(384, int(w * S * 3)); ch = max(384, int(h * S * 3)); cx, cy = (x0 + x1) / 2 * S, (y0 + y1) / 2 * S
        l = int(min(max(cx - cw / 2, 0), 1280 - cw)); t = int(min(max(cy - ch / 2, 0), 720 - ch)); cw = min(cw, 1280); ch = min(ch, 720)
        ctx = hi.crop((l, t, l + cw, t + ch)); k = 768 / max(cw, ch); gw, gh = max(16, round(cw * k / 16) * 16), max(16, round(ch * k / 16) * 16)
        ref = os.path.join(REGW, it['id'] + '_ctx.png'); ctx.resize((gw, gh), Image.LANCZOS).save(ref)
        mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).polygon([(p[0] - x0, p[1] - y0) for p in it['poly']], fill=255); mask = mask.filter(ImageFilter.GaussianBlur(1.3))
        for n, d in enumerate(it['desc']):
            raw = os.path.join(REGW, f"{it['id']}_{n}.png")
            if not os.path.exists(raw):
                p = f"Exactly the same image, same composition, same painting style, same colors and lighting everywhere. Only change this: {d}."
                subprocess.run(['flux-image', p, '-i', ref, '-o', raw, '-s', f'{gw}x{gh}', '--seed', str(500 + n * 7 + len(it['id']))], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if not os.path.exists(raw): print('MANQUE', raw); continue
            g = Image.open(raw).convert('RGB').resize((cw, ch), Image.LANCZOS)
            reg = g.crop((round(x0 * S - l), round(y0 * S - t), round(x1 * S - l), round(y1 * S - t))).resize((w, h), Image.LANCZOS)
            reg = ImageEnhance.Contrast(ImageEnhance.Color(reg).enhance(1.12)).enhance(1.05)
            q = reg.quantize(palette=bgp, dither=Image.Dither.FLOYDSTEINBERG).convert('RGBA'); q.putalpha(mask)
            q.save(os.path.join(OUT, f"{it['id']}_{n}.png"), optimize=True)
        idx[it['id']] = {'x': x0, 'y': y0, 'w': w, 'h': h, 'n': len(it['desc'])}; print('ok', it['id'], flush=True)


def main():
    sel = sys.argv[1:] or list(CFG); ip = os.path.join(OUT, 'index.json'); idx = json.load(open(ip)) if os.path.exists(ip) else {}
    for s in sel:
        build(s, CFG[s], idx); json.dump(idx, open(ip, 'w'), indent=1)


main()
