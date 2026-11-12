#!/usr/bin/env python3
"""Voix du narrateur : Chatterbox multilingue (mlx-audio, local et gratuit), choisi par Stéphan le 12/11/2026 après comparaison avec
Qwen3-TTS, VoxCPM2, Fish Audio S2 Pro et ElevenLabs. La voix est celle du « comédien de théâtre, la soixantaine » (référence
~/.claude/skills/voix-locale/voix/narrateur_theatre.wav), clonée pour chaque réplique ; l'intonation se règle par l'intensité
(exaggeration) selon le type de réplique. Deux prises par réplique, on garde la plus expressive dont le débit est naturel.
Usage : gen_narr.py fr|en [--force]   (relançable : saute les fichiers existants, sauf --force)"""
import os, sys, json, subprocess, tempfile
import numpy as np, soundfile as sf
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
lang = sys.argv[1]; force = '--force' in sys.argv
REF = os.path.expanduser('~/.claude/skills/voix-locale/voix/narrateur_theatre.wav')
MODEL = 'mlx-community/chatterbox-fp16'


def tone(k):
    """(intensité, cfg) : bas = posé et solennel, haut = moqueur et appuyé"""
    if k.endswith('.enter'): return 0.4, 0.5          # annonce de scène, grandiloquente
    if k.startswith('nar.fail'): return 0.75, 0.35    # moquerie déçue
    if k.startswith('nar.idle') or k.endswith('.idle'): return 0.85, 0.3   # ennui traînant
    if k.startswith('nar.lit'): return 0.5, 0.45      # admiration à contrecœur
    if k.startswith('nar.back'): return 0.6, 0.4
    if k == 'wink.dexter': return 0.3, 0.5            # murmure inquiétant
    if k.startswith('wink.'): return 0.6, 0.4         # complice, chute sèche
    return 0.55, 0.45


def expressiveness(y, sr):
    import librosa
    y16 = librosa.resample(y, orig_sr=sr, target_sr=16000); f0, _, _ = librosa.pyin(y16, fmin=60, fmax=320, sr=16000, frame_length=1024)
    f = f0[~np.isnan(f0)]
    if len(f) < 10: return 0.0
    st = 12 * np.log2(f / np.median(f)); return float(np.std(st)) + 0.5 * float(np.percentile(st, 95) - np.percentile(st, 5))


def main():
    from mlx_audio.tts.utils import load_model
    items = [o for o in json.load(open(os.path.join(R, 'easter eggs', 'pointclick', 'work', 'voices.json'))) if o['lang'] == lang and o['who'] == 'narr']
    out = os.path.join(R, 'assets', 'pointclick', 'voice', lang); os.makedirs(out, exist_ok=True)
    m = None
    for o in items:
        name = o['key'] + ('' if o['idx'] < 0 else f".v{o['idx']}") + '.mp3'; dst = os.path.join(out, name)
        if os.path.exists(dst) and not force: continue
        if m is None: m = load_model(MODEL)
        ex, cfg = tone(o['key']); best, bs = None, -1e9
        for take in range(2):
            res = list(m.generate(text=o['text'], ref_audio=REF, lang_code=lang, exaggeration=ex, cfg_weight=cfg))
            y = np.concatenate([np.array(r.audio, dtype=np.float32) for r in res]); sr = res[0].sample_rate
            cps = len(o['text']) / max(len(y) / sr, 0.01)
            sc = expressiveness(y, sr) - (0 if 7 <= cps <= 22 else 100)        # débit aberrant (coupure, bégaiement) : écarté
            if sc > bs: bs, best = sc, (y, sr)
        tmp = tempfile.mktemp(suffix='.wav'); sf.write(tmp, best[0], best[1])
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-18:TP=-2', '-ac', '1', '-ar', '24000', '-b:a', '48k', dst]); os.remove(tmp)
        print('ok', name, flush=True)
    print('done', lang, flush=True)


main()
