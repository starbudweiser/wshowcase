#!/usr/bin/env python3 -I
"""Repère dans une musique Flow l'entrée du groove complet (fin de l'intro), le tempo exact et la plus longue boucle d'un
multiple de 8 mesures qui tient avant l'outro, pour music_loop_bars.sh.
Tempo : autocorrélation du flux spectral sur tout le groove (pas de 2 ms), pics à 1, 4, 8 et 16 temps affinés par
interpolation parabolique ; on garde la mesure déduite du pic à 16 temps (erreur divisée par 16).
Usage : music_groove.py source.wav [bpm de la consigne]  (python avec numpy, par ex. celui de mCASTING)
Sortie : « <début_s> <mesure_s> <mesures> » sur la dernière ligne."""
import sys, subprocess, numpy as np

f = sys.argv[1]; hint = float(sys.argv[2]) if len(sys.argv) > 2 else None
def pcm(sr, af=None, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error'] + (['-ss', str(ss)] if ss is not None else []) + (['-to', str(to)] if to is not None else [])
    return np.frombuffer(subprocess.run(cmd + ['-i', f, '-ac', '1', '-ar', str(sr)] + (['-af', af] if af else []) + ['-f', 'f32le', '-'],
                                        capture_output=True).stdout, np.float32)
# 1. Groove : secondes où les basses sont au niveau du morceau (à 6 dB près)
SR = 4000; y = pcm(SR, 'lowpass=f=150'); h = int(SR * 0.005); fps = SR / h
e = np.sqrt(np.mean(y[:len(y) // h * h].reshape(-1, h) ** 2, 1))
sec = 20 * np.log10(np.array([e[int(i * fps):int((i + 1) * fps)].mean() for i in range(int(len(e) / fps))]) + 1e-9)
full = sec > np.median(sec) - 6
start_s = next(i for i in range(len(full) - 3) if full[i:i + 4].all())
end_s = len(full) - next(i for i in range(len(full)) if full[len(full) - 1 - i])
on = np.maximum(np.diff(e), 0); w0, w1 = int(max(start_s - 1, 0) * fps), int((start_s + 1) * fps)
t0 = (w0 + int(np.argmax(on[w0:w1] > on[w0:w1].max() * 0.5))) / fps          # premier coup de grosse caisse du groove
# 2. Tempo exact
SR2, h2 = 8000, 16; fps2 = SR2 / h2; z = pcm(SR2, ss=t0, to=end_s)
S = np.abs(np.fft.rfft(np.lib.stride_tricks.sliding_window_view(z, 256)[::h2] * np.hanning(256), axis=1))
flux = np.maximum(np.diff(np.log1p(S), axis=0), 0).sum(1); flux -= flux.mean()
F = np.fft.rfft(flux, 2 * len(flux)); ac = np.fft.irfft(F * np.conj(F))[:len(flux)]
def peak(lo, hi):
    a, b = int(lo * fps2), int(hi * fps2); i = a + int(np.argmax(ac[a:b]))
    return (i + 0.5 * (ac[i - 1] - ac[i + 1]) / (ac[i - 1] - 2 * ac[i] + ac[i + 1])) / fps2
lo, hi = (60 / hint / 1.15, 60 / hint / 0.87) if hint else (0.4, 1.0)
beat = peak(lo, hi); beat = peak(beat * 15.6, beat * 16.4) / 16                # affinage sur 16 temps
bar = 4 * beat; n = int((end_s - t0) / bar) // 8 * 8
print(f'groove de {t0:.2f} s à ~{end_s} s, {60 / beat:.2f} bpm, mesure {bar:.4f} s, boucle de {n} mesures ({n * bar:.1f} s)')
print(f'{t0:.2f} {bar:.4f} {n}')
