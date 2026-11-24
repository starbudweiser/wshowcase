#!/usr/bin/env python3 -I
"""Sélection des planches de personnages de la saison 2 : copie l'image retenue de chaque personnage
(work/crossover/persos, fond magenta) en JPEG léger dans crossover/persos/<id>.jpg, pour la page et la bible PDF.
Les reprises (…2, …3) remplacent l'essai d'origine ; l'original reste dans work/ pour mémoire."""
import os, sys
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
import s2_content as C
P = os.path.abspath(os.path.join(D, '..')); SRC = os.path.join(P, 'work', 'crossover', 'persos'); DST = os.path.join(P, 'crossover', 'persos')
os.makedirs(DST, exist_ok=True)
CHOIX = {  # personnage -> image retenue après contrôle (sinon <id>.png)
    'c_doc': 'c_doc2', 'c_potions': 'c_potions2', 'c_sister': 'c_sister4_2',
    'c_spoonkid': 'c_spoonkid2', 'c_analyst': 'c_analyst3_1', 'c_dog': 'c_dog3_2', 'c_rabbit': 'c_rabbit2_1', 'c_barbarian': 'c_barbarian2_2', 'c_knight_fat': 'c_knight_fat4_2', 'c_knight_dim': 'c_knight_dim2_2',
    'c_paleo': 'c_paleo4_1', 'c_kid': 'c_kid2', 'c_loglady': 'c_loglady3', 'c_ai': 'c_ai2',
    'c_morph': 'c_morph2_2', 'c_wizard': 'c_wizard2_2', 'c_king': 'c_king2_2', 'c_archeo': 'c_archeo2_1', 'c_redman': 'c_redman3_1', 'c_guybrush': 'c_guybrush_1', 'c_lechuck': 'c_lechuck_1', 'c_house': 'c_house7_2',  # prise de canne et proportions d'après la référence de Stéphan (canne = moitié de sa taille)  # 23/11 : Morpheus est noir, Gandalf très grand (remarques de Stéphan)
}
n = 0
for _, items in C.PERSOS:
    for cid, _, _ in items:
        src = os.path.join(SRC, CHOIX.get(cid, cid) + '.png')
        if cid.startswith('h_'): src = os.path.join(P, 'work', 'crossover', 'hero_s2', 'sel_' + cid[2:] + '.png')   # vues du héros S2
        if not os.path.exists(src): print('manque', cid, src); continue
        im = Image.open(src).convert('RGB'); im.thumbnail((640, 640), Image.LANCZOS)
        im.save(os.path.join(DST, cid + '.jpg'), quality=86); n += 1
print(n, 'personnages exportés')
