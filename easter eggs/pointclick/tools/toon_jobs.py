#!/usr/bin/env python3
"""Intervalles ToonCrafter de toute la chaîne d'un personnage : pour chaque passage de CLIPS (sleep_clips.py), sauf la boucle de
respiration, prépare la paire de poses clés (toon_prep.py) et écrit la ligne de calcul.
Usage : toon_jobs.py perso… [--fs 10] [--skip giant:down4,…]  -> work/sleep/<perso>/toon/<début>-<fin>/ (nommé par ses deux poses : insérer une pose ne décale rien){a,b,crop}.png|json
et work/sleep/toon_jobs.tsv, à lancer ensuite par :
  calcul-lourd "$HOME/Modèles IA/ToonCrafter/.venv/bin/python" tools/toon_interp.py --batch work/sleep/toon_jobs.tsv"""
import sys, os, argparse, subprocess
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
from sleep_clips import KEYS, CLIPS, S


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('perso', nargs='+'); ap.add_argument('--fs', default='10'); ap.add_argument('--skip', default='')
    o = ap.parse_args(); skip = set(filter(None, o.skip.split(','))); lines = []
    for ch in o.perso:
        for n, a, b, dur, act in CLIPS[ch]:
            if n == 'loop' or f'{ch}:{n}' in skip: continue
            d = os.path.join(S, ch, 'toon', f'{a}-{b}')
            if not os.path.exists(os.path.join(d, 'crop.json')):
                subprocess.run([sys.executable, os.path.join(D, 'toon_prep.py'), ch, KEYS[ch][a], KEYS[ch][b], d], check=True, stdout=subprocess.DEVNULL)
            lines.append('\t'.join([os.path.join(d, 'a.png'), os.path.join(d, 'b.png'), d, act.rstrip('.') + ', hand-painted cartoon', o.fs]))
    out = os.path.join(S, 'toon_jobs.tsv'); open(out, 'w').write('\n'.join(lines) + '\n'); print(len(lines), 'passages ->', out)


if __name__ == '__main__': main()
