#!/usr/bin/env python3
"""Voix des personnages (tout sauf le narrateur, voir gen_narr.py) : Chatterbox multilingue (mlx-audio, local et gratuit), choisi par
Stéphan le 12/11/2026. Chatterbox clone une voix de référence ; celle de chaque personnage est conçue sur description, en français
(ou anglais) natif, avec Qwen3-TTS VoiceDesign, comme celle du narrateur (work/refs_vd/<langue>/<personnage>.wav : étape --design).
Les anciennes références tirées des voix prêtes de Qwen (accent étranger) ne servent plus. L'intonation se règle par l'intensité
(exaggeration), déduite de la consigne de jeu de chaque réplique (gen_voices.py).
Usage : gen_cast.py fr|en --design     puis     gen_cast.py fr|en [--force] [personnage]"""
import os, sys, json, subprocess, tempfile, glob
import numpy as np, soundfile as sf
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
lang = sys.argv[1]; force = '--force' in sys.argv; refs_only = '--refs' in sys.argv; design_only = '--design' in sys.argv
only = next((a for a in sys.argv[2:] if not a.startswith('--')), None)
# tables de personnages et de consignes de jeu de gen_voices.py (sans lancer sa génération)
NS = {'__name__': 'gv', '__file__': os.path.join(os.path.dirname(__file__), 'gen_voices.py')}; _argv = sys.argv; sys.argv = ['gen_voices.py', lang]
exec(open(NS['__file__']).read().split('\nitems = [')[0], NS); sys.argv = _argv
V, BD, BDB, BDS, blind_style = NS['V'], NS['BD'], NS['BDB'], NS['BDS'], NS['blind_style']
ALIAS = {'pmerchant': 'merchant', 'gguard': 'guard', 'pguard': 'guard', 'pgiant': 'giant', 'phorseman': 'horseman'}
REFS = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'refs_vd', lang); os.makedirs(REFS, exist_ok=True)
OUT = os.path.join(R, 'assets', 'pointclick', 'voice', lang)
items = [o for o in json.load(open(os.path.join(R, 'easter eggs', 'pointclick', 'work', 'voices.json'))) if o['lang'] == lang and o['who'] != 'narr']
fname = lambda o: o['key'] + ('' if o['idx'] < 0 else f".v{o['idx']}") + '.mp3'


def style(o):
    w = o['who']
    if w.startswith('bd_'): sc = w[3:]; return BDB[sc] + ', ' + BDS[o['idx'] % 6]
    if w == 'blind': return blind_style(o['key'])
    v = V.get(ALIAS.get(w, w)) or V['hero']; return v[1]


def tone(s):
    """intensité Chatterbox d'après la consigne : (exaggeration, cfg_weight)"""
    s = s.lower()
    if any(k in s for k in ('shout', 'scream', 'angry', 'booming', 'panick', 'overjoyed', 'ecstatic', 'excited', 'singing', 'menacing')): return 0.85, 0.3
    if any(k in s for k in ('whisper', 'half-asleep', 'groggy', 'monotone', 'deadpan', 'tired', 'calm', 'hollow', 'sad', 'resigned', 'low')): return 0.35, 0.5
    if any(k in s for k in ('mocking', 'whining', 'snobbish', 'grumpy', 'sarcastic', 'cocky', 'cheerful', 'squeaky')): return 0.6, 0.4
    return 0.5, 0.45


FEMALE = {'serena', 'vivian'}


def persona(w):
    """description de la voix d'un personnage (pour VoiceDesign), d'après la voix prête et la consigne de gen_voices.py"""
    if w.startswith('bd_'): sc = w[3:]; return ('A woman' if BD[sc] in FEMALE else 'A man') + ', ' + BDB[sc]
    if w == 'blind': return 'A man in his thirties, confused and grumbling'
    v = V.get(w) or V['hero']; return ('A woman' if v[0] in FEMALE else 'A man') + ', ' + v[1]


def design_refs():
    """une voix de référence par personnage, conçue sur description, prononcée en langue native, ton posé (l'intensité vient ensuite)"""
    from mlx_audio.tts.utils import load_model
    m = None; L = {'fr': ('French', 'french'), 'en': ('English', 'english')}[lang]
    for w in sorted({ALIAS.get(o['who'], o['who']) for o in items}):
        dst = os.path.join(REFS, w + '.wav')
        if os.path.exists(dst): continue
        lines = sorted({o['text'] for o in items if ALIAS.get(o['who'], o['who']) == w}, key=len, reverse=True)
        txt = next((t for t in lines if len(t) <= 170), lines[-1])
        if len(txt) < 110: txt = {'fr': "Bonjour à vous, voyageur. Le chemin est long jusqu'au village, alors asseyez-vous un instant et écoutez bien ce que j'ai à vous dire.",
                                 'en': "Well met, traveller. The road to the village is a long one, so sit down for a moment and listen carefully to what I have to say."}[lang]   # référence d'au moins ~8 s
        if m is None: m = load_model('mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit')
        ins = f"{persona(w)}. Native {L[0]} speaker with a natural {L[0]} accent, clear diction, steady natural delivery."
        res = list(m.generate(text=txt, instruct=ins, lang_code=L[1]))
        y = np.concatenate([np.array(r.audio, dtype=np.float32) for r in res]); sf.write(dst, y, res[0].sample_rate)
        print('voix conçue', w, f'{len(y) / res[0].sample_rate:.1f} s', flush=True)


def make_refs():
    """référence de chaque personnage : ses plus longues répliques actuelles (Qwen3-TTS), mises bout à bout jusqu'à ~10 s"""
    whos = sorted({ALIAS.get(o['who'], o['who']) for o in items})
    for w in whos:
        dst = os.path.join(REFS, w + '.wav')
        if os.path.exists(dst): continue
        fs = [os.path.join(OUT, fname(o)) for o in items if ALIAS.get(o['who'], o['who']) == w]
        other = os.path.join(os.path.dirname(OUT), 'en' if lang == 'fr' else 'fr')                 # peu de répliques : on complète avec l'autre langue (même voix)
        fs += [os.path.join(other, fname(o)) for o in items if ALIAS.get(o['who'], o['who']) == w]
        fs = [(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout or 0), f) for f in fs if os.path.exists(f)]
        fs = [x for x in sorted(fs, reverse=True) if x[0] <= 12]
        pick, tot = [], 0
        for d, f in fs:
            if tot >= 9 or len(pick) >= 3: break
            pick.append(f); tot += d
        if not pick: print('sans référence', w); continue
        parts = []
        for f in pick:
            tmp = tempfile.mktemp(suffix='.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-ac', '1', '-ar', '24000', tmp])
            y, sr = sf.read(tmp, dtype='float32'); os.remove(tmp); parts += [y, np.zeros(int(0.25 * sr), np.float32)]
        sf.write(dst, np.concatenate(parts), 24000); print('référence', w, f'{tot:.1f} s', flush=True)


def expressiveness(y, sr):
    import librosa
    y16 = librosa.resample(y, orig_sr=sr, target_sr=16000); f0, _, _ = librosa.pyin(y16, fmin=60, fmax=400, sr=16000, frame_length=1024)
    f = f0[~np.isnan(f0)]
    if len(f) < 10: return 0.0
    st = 12 * np.log2(f / np.median(f)); return float(np.std(st)) + 0.5 * float(np.percentile(st, 95) - np.percentile(st, 5))


def generate():
    from mlx_audio.tts.utils import load_model
    m = None
    for o in items:
        if only and o['who'] != only: continue
        dst = os.path.join(OUT, fname(o)); w = ALIAS.get(o['who'], o['who']); ref = os.path.join(REFS, w + '.wav')
        if not os.path.exists(ref): print('sans référence', w); continue
        if os.path.exists(dst) and not force: continue
        if m is None: m = load_model('mlx-community/chatterbox-fp16')
        ex, cfg = tone(style(o)); best, bs = None, -1e9
        for take in range(2):
            res = list(m.generate(text=o['text'], ref_audio=ref, lang_code=lang, exaggeration=ex, cfg_weight=cfg))
            y = np.concatenate([np.array(r.audio, dtype=np.float32) for r in res]); sr = res[0].sample_rate
            cps = len(o['text']) / max(len(y) / sr, 0.01)
            sc = expressiveness(y, sr) - (0 if 6 <= cps <= 24 else 100)
            if sc > bs: bs, best = sc, (y, sr)
        tmp = tempfile.mktemp(suffix='.wav'); sf.write(tmp, best[0], best[1])
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-18:TP=-2', '-ac', '1', '-ar', '24000', '-b:a', '48k', dst]); os.remove(tmp)
        print('ok', fname(o), flush=True)
    print('done', lang, flush=True)


design_refs() if design_only else make_refs() if refs_only else generate()
