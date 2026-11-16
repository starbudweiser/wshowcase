#!/usr/bin/env python3 -I
"""Coucher de nuit simplifié des personnages secondaires (décision du 15/11/2026) : 4-5 poses clés FLUX par étape, jouées image par
image à l'ancienne (chaque image tenue un moment), sans intervalles. Pendant le sommeil : la pose « dort » fixe, avec les z z z du moteur.
Usage : sleep_simple.py [clé…]   (à lancer avec un Python qui a scipy, ex. celui de ToonCrafter)
Écrit assets/pointclick/sleep/<clé>.png (une ligne d'images) et son entrée dans index.json :
  seg = {down1 : coucher, loop : la pose « dort », up1 : réveil}, hold = durée de chaque image en images du moteur (fps 12)."""
import sys, os, json, subprocess, tempfile
from PIL import Image
T = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(T, '..', 'work', 'sleep'); R = os.path.abspath(os.path.join(T, '..', '..', '..'))
OUT = os.path.join(R, 'assets', 'pointclick', 'sleep'); FPS = 12

# clé : (sprite de work/scales.json, dossier des poses, coucher [(image, durée)], réveil [(image, durée)])
CONF = {
  'guard': ('guard', 'guard', [('guide.png', 3), ('k_yawn_2.png', 12), ('k_sit_2.png', 9), ('k_settle_2.png', 9), ('k_sleep_2.png', 6)],
            [('k_sleep_2.png', 4), ('k_sit_2.png', 12), ('k_rise_1.png', 9), ('guide.png', 6)]),
  'farmer': ('farmer', 'farmer', [('guide.png', 3), ('k_yawn_2.png', 12), ('k_sit_1.png', 9), ('k_settle_1.png', 9), ('k_sleep_2.png', 6)],
             [('k_sleep_2.png', 4), ('k_wake_1.png', 12), ('k_rise_1.png', 9), ('guide.png', 6)]),
  'horse': ('horse', 'horse', [('guide.png', 3), ('k_low_4.png', 9), ('k_kneel_4.png', 8), ('k_fold_2.png', 9), ('k_sleep_1.png', 6)],
            [('k_sleep_1.png', 4), ('k_wake_5.png', 10), ('k_up_2.png', 8), ('guide.png', 6)]),
  'hen': ('hen', 'hen', [('guide.png', 3), ('s_puff_5.png', 9), ('s_sit_5.png', 9), ('s_sleep_5.png', 6)],
          [('s_sleep_5.png', 4), ('s_wake_5.png', 8), ('s_shake_6.png', 10), ('guide.png', 6)]),
  'horseman': ('horseman', 'horseman', [('guide.png', 3), ('k_stretch_2.png', 12), ('k_kneel_6.png', 8), ('k_fold_3.png', 9), ('k_sleep_1.png', 6)],
               [('k_sleep_1.png', 4), ('k_fold_3.png', 9), ('k_kneel_6.png', 8), ('guide.png', 6)]),
}
# cavalier à citrouille (fête) : poses choisies sur sa planche (tools/gen_pumpkin_sleep.sh), réveil = coucher à l'envers
PK = os.path.join(W, 'horseman_pumpkin', 'choix.json')
if os.path.exists(PK):
    c = json.load(open(PK))
    CONF['horseman_pumpkin'] = ('horseman_pumpkin', 'horseman_pumpkin',
                                [('guide.png', 3), (c['stretch'], 12), (c['kneel'], 8), (c['fold'], 9), (c['sleep'], 6)],
                                [(c['sleep'], 4), (c['fold'], 9), (c['kneel'], 8), ('guide.png', 6)])


# Nazim sort d'abord de sa fosse (pit1 : il y est enfoncé de PIT_DEPTH pixels du jeu et remonte au fil de ces images) ; poses recalculées
# le 16/11 à la taille de son sprite (tools/gen_nazim_simple.sh), choix dans work/sleep/nazim/choix.json
NZ = os.path.join(W, 'nazim', 'choix.json'); PIT = {}
if os.path.exists(NZ):
    c = json.load(open(NZ))
    CONF['nazim'] = ('nazim', 'nazim', [('guide.png', 3), (c['yawn'], 12), (c['sit'], 9), (c['settle'], 9), (c['sleep'], 6)],
                     [(c['sleep'], 4), (c['sit'], 12), (c['rise'], 9), ('guide.png', 6)])
    PIT['nazim'] = ([('guide.png', 4), (c['climb'], 10), ('guide.png', 3)], c.get('pit', 67.4))


def build(key):
    spr, sub, down, up = CONF[key]; d = os.path.join(W, sub)
    pit, depth = PIT.get(key, ([], 0))
    seq = pit + down + up; files = []
    for f, _ in seq:
        if f not in files: files.append(f)
    tmp = tempfile.mkdtemp()
    subprocess.run([sys.executable, '-I', os.path.join(T, 'sleep_pixelize.py'), '--holes', spr, d, tmp, 'f'] + [os.path.join(d, f) for f in files], check=True)
    meta = json.load(open(os.path.join(tmp, 'f.json'))); w, h = meta['w'], meta['h']
    sheet = Image.new('RGBA', (w * len(seq), h), (0, 0, 0, 0))
    for i, (f, _) in enumerate(seq): sheet.paste(Image.open(os.path.join(tmp, f'f_{files.index(f)}.png')), (i * w, 0))
    sheet.save(os.path.join(OUT, key + '.png'), optimize=True)
    nd = len(down); np_ = len(pit); sl = Image.open(os.path.join(tmp, f'f_{files.index(down[-1][0])}.png')).getbbox()   # pose « dort » : pour placer les z z z
    ent = {'w': w, 'h': h, 'ax': meta['ax'], 'ay': meta['ay'], 'cols': len(seq), 'n': len(seq), 'fps': FPS,
           'seg': {'down1': [np_, nd], 'loop': [np_ + nd - 1, 1], 'up1': [np_ + nd, len(up)]},
           'hold': {'down1': [t for _, t in down], 'up1': [t for _, t in up]}}
    if pit: ent['seg']['pit1'] = [0, np_]; ent['hold']['pit1'] = [t for _, t in pit]; ent['pit'] = depth
    ip = os.path.join(OUT, 'index.json'); idx = json.load(open(ip)); idx[key] = ent
    json.dump(idx, open(ip, 'w'), indent=1, ensure_ascii=False)
    print(key, f'{len(seq)} images {w}x{h}', 'dort : boîte', sl, 'ancrage', (meta['ax'], meta['ay']),
          'tête (gauche, droite) depuis l\'ancrage :', (round(sl[0] - meta['ax']), round(sl[2] - meta['ax'])), 'haut :', round(sl[1] - meta['ay']))


for k in sys.argv[1:] or list(CONF): build(k)
