#!/usr/bin/env python3 -I
"""Saison 2 : textes du jeu tirés des dialogues (crossover/dialogues/*.json) -> js/pointclick/lang/s2_fr.js et s2_en.js.
Mêmes clés que les voix (cNN.*), plus les titres de chapitre `ch.s2_NN` (17 : s2_17k Kaamelott, s2_17g Sacré Graal).
À relancer après chaque changement de dialogue. Usage : python3 tools/s2_lang.py"""
import json, os, glob
P = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); R = os.path.abspath(os.path.join(P, '..', '..'))
out = {'fr': {}, 'en': {}}; envers = []
for f in sorted(glob.glob(os.path.join(P, 'crossover', 'dialogues', 'ch*.json'))):
    d = json.load(open(f)); b = os.path.basename(f)[2:-5]
    cid = 's2_' + {'17_kaamelott': '17k', '17_graal': '17g'}.get(b, b)
    for l in ('fr', 'en'):
        t = d['title'][l]
        if b == '17_kaamelott': t = 'Kaamelott' if l == 'fr' else 'The Round Table (French version)'
        if b == '17_graal': t = 'Le Sacré Graal (version anglaise)' if l == 'fr' else 'The Holy Grail'
        out[l]['ch.' + cid] = f"{d['chapter']}. {t}"
        for x in d['lines']:
            out[l][x['key']] = x[l]
            if x.get('envers') and l == 'fr': envers.append(x['key'])
for l, dct in out.items():
    p = os.path.join(R, 'js', 'pointclick', 'lang', f's2_{l}.js')
    with open(p, 'w') as o:
        o.write(f"/* Saison 2 : textes tirés des dialogues (easter eggs/pointclick/crossover/dialogues), généré par tools/s2_lang.py : ne pas modifier à la main. */\nexport default {{\n")
        o.write(',\n'.join(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in dct.items()))
        o.write('\n};\n')
    print(p, len(dct))
p = os.path.join(R, 'js', 'pointclick', 'lang', 's2_meta.js')
with open(p, 'w') as o:
    o.write('/* Saison 2 : répliques dites à l\'envers (voix retournée, « envers » dans les dialogues), généré par tools/s2_lang.py.\n   Le moteur les sous-titre toujours et joue à l\'envers les animations de qui les dit. */\n')
    o.write('export const ENVERS = ' + json.dumps(envers) + ';\n')
print(p, len(envers))
