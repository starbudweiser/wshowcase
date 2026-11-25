#!/usr/bin/env python3 -I
"""Voix de la saison 2 d'après le casting mCASTING « Jeu point & click — saison 2 » (25/11/2026).

Même méthode que gen_voices_casting.py (saison 1) : chaque réplique est dite par la voix retenue pour son personnage,
en clonant son extrait (voix clonée : extrait et transcription de mCASTING ; voix de la bibliothèque : échantillon de la
langue) avec le modèle de jeu du casting (Fish Audio Drama 3). Différence : la consigne d'émotion est donnée PAR RÉPLIQUE
(champ « emo » des dialogues, « [emo] » en tête du texte). Voix clonée en français : « un » devient « 1 » pour le modèle
seulement (sinon il dit « une »), comme Engine.speechText de mCASTING. Chaque prise est réécoutée par Whisper : jusqu'à
3 prises, on garde la plus fidèle au texte.

Entrées : crossover/dialogues/chNN.json, crossover/casting.json (write_casting), crossover/casting_s2_retenu.json (id → nom).
Sortie : work/crossover/voices/<fr|en>/<clé>.mp3 (mono 24 kHz 40 kb/s, comme les voix du jeu) + report.jsonl.
Relançable : saute les fichiers déjà faits. Usage (file calcul-lourd, python de mCASTING) :
  calcul-lourd "$HOME/Library/Application Support/mCASTING/engine/venv/bin/python" tools/gen_voices_s2.py 11|17_graal [fr|en] [personnage,…]"""
import sys, os, json, re, glob, shutil, subprocess, tempfile, difflib, unicodedata

P = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))           # easter eggs/pointclick
X = os.path.join(P, 'crossover')
MC = os.path.expanduser('~/Library/Application Support/mCASTING')
chap = sys.argv[1]                                                          # 11, 12… ou 17_kaamelott, 17_graal
langs = [sys.argv[2]] if len(sys.argv) > 2 and sys.argv[2] in ('fr', 'en') else ['fr', 'en']
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
TAKES, GOOD = 3, float(os.environ.get('GOOD', 0.86))
NORM = 'loudnorm=I=-18:TP=-2,alimiter=limit=0.7:level=false'  # même niveau que les voix de la saison 1 (-18 LUFS par réplique)

cast = json.load(open(os.path.join(X, 'casting.json')))
byname = {c['name']: c for c in cast['characters'].values()}
C = {r['id']: byname[r['name']] for r in json.load(open(os.path.join(X, 'casting_s2_retenu.json')))}
voices = json.load(open(os.path.join(MC, 'voices.json')))
voices = voices if isinstance(voices, list) else voices.get('voices', voices)
voices = {v['id']: v for v in (voices.values() if isinstance(voices, dict) else voices)}
SAMPLE = {'fr': ["Bonjour, je m'appelle {}. Il fait beau ce matin, mais je crois qu'un orage arrive avant ce soir.",
                 "Attendez, vous avez entendu ça ? Quelqu'un marche derrière la porte, et je ne suis pas rassuré du tout."],
          'en': ["Hello, my name is {}. It's a lovely morning, but I think a storm is coming before tonight.",
                 "Wait, did you hear that? Someone is walking behind the door, and I'm not reassured at all."]}
def lib_text(vid, lang):       # texte de l'échantillon d'une voix de la bibliothèque (règle de Catalog.sample de mCASTING)
    v = voices[vid]; tone = v.get('tone', '')
    i = 1 if any(t in tone for t in ('nervous', 'mischievous', 'melancholic')) else 0
    return SAMPLE[lang][i].format(v['name'].split(' ')[0]) if i == 0 else SAMPLE[lang][1]

dial = json.load(open(os.path.join(X, 'dialogues', f'ch{chap}.json')))
items = [(l, o) for o in dial['lines'] for l in langs if not only or o['who'] in only]
missing = sorted({o['who'] for _, o in items if o['who'] not in C})
if missing: sys.exit(f'personnages absents du casting : {missing}')
out = os.path.join(P, 'work', 'crossover', 'voices'); refs = os.path.join(out, '_refs')
for l in langs: os.makedirs(os.path.join(out, l), exist_ok=True)
os.makedirs(refs, exist_ok=True)
def ref_wav(vid, sample, tag):
    dst = os.path.join(refs, f'{vid}.{tag}.wav')
    if not os.path.exists(dst): subprocess.run(['/usr/bin/afconvert', '-f', 'WAVE', '-d', 'LEI16@24000', '-c', '1', sample, dst], check=True)
    return dst
def reference(c, lang):        # (extrait wav, transcription, voix clonée ?)
    if c.get('ref_audio'): return ref_wav(c['voice_id'], c['ref_audio'], 'clone'), c['ref_text'], True
    if c['samples'].get(lang): return ref_wav(c['voice_id'], c['samples'][lang], lang), lib_text(c['voice_id'], lang), False
    return ref_wav(c['voice_id'], c['timbre_ref_audio'], 'fr'), c.get('timbre_ref_text') or lib_text(c['voice_id'], 'fr'), False

def norm(t):
    t = unicodedata.normalize('NFKD', t.lower()); t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]+", ' ', t.replace('’', "'").replace("'", ' ')).split()
def score(ref, hyp): return difflib.SequenceMatcher(None, norm(ref), norm(hyp)).ratio()
def speech(text, lang, cloned):
    t = re.sub(r'\s+', ' ', text.replace('*', '')).strip()
    return re.sub(r"(?<![^\W\d_])(?<!\d)[Uu][Nn](?![^\W_])", '1', t) if lang == 'fr' and cloned else t

todo = [(l, o) for l, o in items if not os.path.exists(os.path.join(out, l, o['key'] + '.mp3'))]
print('à faire', len(todo), 'sur', len(items), flush=True)
if not todo: print('done', flush=True); sys.exit(0)

from mlx_audio.tts.utils import load_model
from mlx_audio.tts.generate import generate_audio
from mlx_audio.stt.utils import load_model as load_stt
TTS = load_model(model_path=next(iter(C.values()))['acting_model'])
STT = load_stt('mlx-community/whisper-large-v3-turbo-asr-fp16')
rep = open(os.path.join(out, 'report.jsonl'), 'a')
for n, (lang, o) in enumerate(todo, 1):
    c = C[o['who']]; name = o['key'] + '.mp3'
    wav, rt, cloned = reference(c, lang)
    text = (f"[{o['emo']}] " if o.get('emo') else '') + speech(o[lang], lang, cloned)
    takes = 1 if len(norm(o[lang])) <= 2 else TAKES                    # cris et répliques très courtes : Whisper juge mal
    best, k = (None, -1, ''), 0
    for k in range(takes):
        tmp = tempfile.mkdtemp()
        try:
            generate_audio(text=text, model=TTS, lang_code=lang, ref_audio=wav, ref_text=rt, output_path=tmp, file_prefix='v', join_audio=True, verbose=False)
            f = sorted(glob.glob(os.path.join(tmp, '*.wav')))
            if not f: continue
            hyp = STT.generate(f[0], language=lang).text
            s = score(o[lang], hyp)
            if s > best[1]:
                if best[0]: shutil.rmtree(os.path.dirname(best[0]), ignore_errors=True)
                best = (f[0], s, hyp); tmp = None
        finally:
            if tmp: shutil.rmtree(tmp, ignore_errors=True)
        if best[1] >= GOOD: break
    if best[0]:
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', best[0], '-af', NORM, '-ac', '1', '-ar', '24000', '-b:a', '40k', os.path.join(out, lang, name)])
        shutil.rmtree(os.path.dirname(best[0]), ignore_errors=True)
    rep.write(json.dumps({'file': f'{lang}/{name}', 'who': o['who'], 'emo': o.get('emo', ''), 'score': round(best[1], 3), 'takes': k + 1,
                          'text': o[lang], 'heard': best[2]}, ensure_ascii=False) + '\n'); rep.flush()
    print(f'{n}/{len(todo)} {lang}/{name} {best[1]:.2f} ({k + 1})', flush=True)
print('done', flush=True)
