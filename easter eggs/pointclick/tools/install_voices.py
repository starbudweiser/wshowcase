#!/usr/bin/env python3 -I
"""Pose les voix de work/voice_new/<fr|en>/ dans assets/pointclick/voice/<fr|en>/ (remplace les anciennes) en égalisant le volume :
gain fixe par fichier pour un niveau moyen de -19,5 dB (celui des anciennes voix), limiteur seulement si une crête dépasse -1 dB.
Usage : install_voices.py"""
import os, re, glob, subprocess, concurrent.futures as cf
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SRC = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'voice_new'); DST = os.path.join(R, 'assets', 'pointclick', 'voice')
TARGET = -19.5
def one(f):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean, peak = float(re.search(r'mean_volume: ([-\d.]+)', o)[1]), float(re.search(r'max_volume: ([-\d.]+)', o)[1])
    g = TARGET - mean; af = f'volume={g:.2f}dB' + (',alimiter=limit=0.89:level=false' if peak + g > -1 else '')
    dst = os.path.join(DST, os.path.relpath(f, SRC))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f, '-af', af, '-ac', '1', '-ar', '24000', '-b:a', '40k', dst], check=True)
    return g
files = sorted(glob.glob(os.path.join(SRC, 'fr', '*.mp3')) + glob.glob(os.path.join(SRC, 'en', '*.mp3')))
import sys
if len(sys.argv) > 1 and sys.argv[1].startswith('who='):   # seulement ces personnages : who=hero,narr (d'après work/voices.json)
    import json; who = set(sys.argv[1][4:].split(','))
    keep = {f"{o['lang']}/{o['key']}{'' if o['idx'] < 0 else '.v' + str(o['idx'])}.mp3" for o in json.load(open(os.path.join(SRC, '..', 'voices.json'))) if o['who'] in who}
    files = [f for f in files if os.path.relpath(f, SRC) in keep]
elif len(sys.argv) > 1: files = [f for f in files if os.path.basename(f).startswith(tuple(sys.argv[1].split(',')))]   # seulement ces clés : hint.,genie.
with cf.ThreadPoolExecutor(10) as ex: gains = list(ex.map(one, files))
print(len(files), 'voix posées ; gain de', round(min(gains), 1), 'à', round(max(gains), 1), 'dB')
