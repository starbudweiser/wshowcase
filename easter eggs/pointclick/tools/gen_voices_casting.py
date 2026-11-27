#!/usr/bin/env python3 -I
"""Voix du jeu d'après le casting de mCASTING (22/11/2026) : chaque réplique est dite par la voix choisie pour son personnage,
en clonant l'échantillon de cette voix dans la langue de la réplique avec le modèle de jeu du casting (Fish Audio Drama 3),
comme le fait mCASTING lui-même (balise d'émotion « [style] » en tête du texte). Chaque prise est réécoutée par Whisper :
jusqu'à 3 prises, on garde la plus fidèle au texte.

Entrées : work/voices.json (voices_manifest.mjs), casting.json et projects.json de mCASTING.
Sortie : work/voice_new/<fr|en>/<clé>[.v<n>].mp3 (mono 24 kHz 40 kb/s, comme les voix du jeu) + work/voice_new/report.jsonl.
Relançable : saute les fichiers déjà faits. Les personnages absents du casting (intro : comp, thief, driver) gardent leurs voix.
Usage (file calcul-lourd, python de mCASTING) : calcul-lourd "$PY" -I gen_voices_casting.py [fr|en] [limite] [personnage]"""
import sys, os, json, re, glob, shutil, subprocess, tempfile, difflib, unicodedata

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
W = os.path.join(R, 'easter eggs', 'pointclick', 'work')
MC = os.path.expanduser('~/Library/Application Support/mCASTING')
CASTING = os.environ.get('CASTING', '/Volumes/OWC 6To/TAF/DEV/wSHOWCASE (WEBSITE)/easter eggs/pointclick/casting.json')
langs = [sys.argv[1]] if len(sys.argv) > 1 and sys.argv[1] in ('fr', 'en') else ['fr', 'en']
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10**9
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None   # un ou plusieurs personnages : genie,comp
TAKES, GOOD = 3, float(os.environ.get('GOOD', 0.86))   # prises au plus ; score Whisper jugé bon (GOOD=1 : toujours 3 prises)

# --- casting : nom du personnage -> clé du jeu (projects.json de mCASTING garde la clé d'origine)
cast = json.load(open(CASTING))
proj = json.load(open(os.path.join(MC, 'projects.json')))
proj = proj if isinstance(proj, list) else proj.get('projects', proj)
proj = list(proj.values()) if isinstance(proj, dict) else proj
p = next(x for x in proj if x.get('name') == cast['project'])
name2key = {c['name']: c['key'] for c in p['characters']}
voices = json.load(open(os.path.join(MC, 'voices.json')))
voices = voices if isinstance(voices, list) else voices.get('voices', voices)
voices = {v['id']: v for v in (voices.values() if isinstance(voices, dict) else voices)}
SAMPLE = {'fr': ["Bonjour, je m'appelle {}. Il fait beau ce matin, mais je crois qu'un orage arrive avant ce soir.",
                 "Attendez, vous avez entendu ça ? Quelqu'un marche derrière la porte, et je ne suis pas rassuré du tout."],
          'en': ["Hello, my name is {}. It's a lovely morning, but I think a storm is coming before tonight.",
                 "Wait, did you hear that? Someone is walking behind the door, and I'm not reassured at all."]}
def ref_text(vid, lang):       # texte de l'échantillon, même règle que Catalog.sample de mCASTING
    v = voices[vid]; tone = v.get('tone', '')
    i = 1 if any(t in tone for t in ('nervous', 'mischievous', 'melancholic')) else 0
    return SAMPLE[lang][i].format(v['name'].split(' ')[0]) if i == 0 else SAMPLE[lang][1]
C = {name2key[c['name']]: c for c in cast['characters'].values()}

items = [o for o in json.load(open(os.path.join(W, 'voices.json'))) if o['lang'] in langs and o['who'] in C and (not only or o['who'] in only)]
out = os.path.join(W, 'voice_new'); refs = os.path.join(out, '_refs')
for l in langs: os.makedirs(os.path.join(out, l), exist_ok=True)
os.makedirs(refs, exist_ok=True)
def ref_wav(vid, sample, lang):
    dst = os.path.join(refs, f'{vid}.{lang}.wav')
    if not os.path.exists(dst): subprocess.run(['/usr/bin/afconvert', '-f', 'WAVE', '-d', 'LEI16@24000', '-c', '1', sample, dst], check=True)
    return dst

def norm(t):
    t = unicodedata.normalize('NFKD', t.lower()); t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]+", ' ', t.replace('’', "'").replace("'", ' ')).split()
def score(ref, hyp): return difflib.SequenceMatcher(None, norm(ref), norm(hyp)).ratio()

GAME = os.path.join(R, 'assets', 'pointclick', 'voice')   # déjà livrées au jeu : on ne les refait pas (27/11)
fname = lambda o: o['key'] + ('' if o['idx'] < 0 else f".v{o['idx']}") + '.mp3'
todo = [o for o in items if not os.path.exists(os.path.join(out, o['lang'], fname(o))) and not os.path.exists(os.path.join(GAME, o['lang'], fname(o)))][:limit]
print('à faire', len(todo), 'sur', len(items), flush=True)
if not todo: print('done', flush=True); sys.exit(0)

from mlx_audio.tts.utils import load_model
from mlx_audio.tts.generate import generate_audio
from mlx_audio.stt.utils import load_model as load_stt
TTS = load_model(model_path=cast['characters'][next(iter(cast['characters']))]['acting_model'])
STT = load_stt('mlx-community/whisper-large-v3-turbo-asr-fp16')
rep = open(os.path.join(out, 'report.jsonl'), 'a')
for n, o in enumerate(todo, 1):
    c = C[o['who']]; lang = o['lang']; name = o['key'] + ('' if o['idx'] < 0 else f".v{o['idx']}") + '.mp3'
    if c.get('ref_audio'): wav, rt = ref_wav(c['voice_id'], c['ref_audio'], 'clone'), c['ref_text']   # voix clonée dans mCASTING : son extrait et sa transcription
    else:
        sample = c['samples'].get(lang) or c['timbre_ref_audio']; slang = lang if c['samples'].get(lang) else 'fr'
        wav, rt = ref_wav(c['voice_id'], sample, slang), ref_text(c['voice_id'], slang)
    said = re.sub(r'\s+', ' ', o['text'].replace('*', '')).strip()      # « *croc croc* » : bruitage dit, sans les astérisques
    mood = (c.get('style') or '').split(',')[0].strip(); text = (f'[{mood}] ' if mood else '') + said
    takes = 1 if len(norm(said)) <= 4 else TAKES                        # cris et onomatopées : Whisper ne sait pas les juger
    best = (None, -1, '')
    for k in range(takes):
        tmp = tempfile.mkdtemp()
        try:
            generate_audio(text=text, model=TTS, lang_code=lang, ref_audio=wav, ref_text=rt, output_path=tmp, file_prefix='v', join_audio=True, verbose=False)
            f = sorted(glob.glob(os.path.join(tmp, '*.wav')))
            if not f: continue
            hyp = STT.generate(f[0], language=lang).text
            s = score(o['text'], hyp)
            if s > best[1]:
                if best[0]: shutil.rmtree(os.path.dirname(best[0]), ignore_errors=True)
                best = (f[0], s, hyp); tmp = None
        finally:
            if tmp: shutil.rmtree(tmp, ignore_errors=True)
        if best[1] >= GOOD: break
    if best[0]:
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', best[0], '-ac', '1', '-ar', '24000', '-b:a', '40k', os.path.join(out, lang, name)])
        shutil.rmtree(os.path.dirname(best[0]), ignore_errors=True)
    rep.write(json.dumps({'file': f'{lang}/{name}', 'who': o['who'], 'score': round(best[1], 3), 'takes': k + 1, 'text': o['text'], 'heard': best[2]}, ensure_ascii=False) + '\n'); rep.flush()
    print(f'{n}/{len(todo)} {lang}/{name} {best[1]:.2f} ({k + 1})', flush=True)
print('done', flush=True)
