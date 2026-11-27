#!/usr/bin/env python3
"""Portraits du héros, 3e version (27/11/2026) : toutes les poses calculées en entier depuis work/hp3/base.png, avec un contrôle
automatique du bouclier. Le bouclier dépasse de chaque côté du personnage, au-dessus des épaules : la silhouette mesurée à trois
hauteurs (bords gauche et droit) doit rester celle de la base. Une main ou un bras peut élargir un côté, jamais le rétrécir ; un
côté au moins doit coller à la base. Pose hors tolérance : recalculée avec une autre graine (jusqu'à TRIES essais), meilleure gardée.
Aucune retouche d'image. Usage (python de FLUX) : gen_portraits3.py [pose…]   ;   gen_portraits3.py --mesure fichier.png"""
import sys, os, subprocess, json
import numpy as np
from PIL import Image

W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'work', 'hp3')
ROWS = (0.56, 0.62, 0.68)          # hauteurs de mesure : bord du bouclier de part et d'autre des épaules (base 1211)
TOL = 0.022                        # tolérance, en fraction de la largeur de l'image (~28 px sur 1280)
TRIES = int(os.environ.get('TRIES', 4))
SH = ("Exactly the same MODEST round wooden shield as in the reference, same size, same position, strapped flat and centered on his back: "
      "only its upper edge peeks out behind his neck and a little beyond each shoulder. Same camera distance and framing as the reference.")
B = ("No border, no frame, full-bleed flat solid magenta background. The same close-up portrait, same framing, same horned helmet and face, "
     "same painting style. " + SH)
HB = B + " Both hands fully inside the picture."
POSES = [  # nom, référence, graine de départ, consigne
    ('talk', 'base', 3100, B + " Mouth wide open talking, eyebrows raised."),
    ('blink', 'base', 3110, B + " Eyes closed, wry smirk."),
    ('sleepy', 'base', 3120, B + " Half-closed tired eyes, a yawning wide open mouth."),
    ('knock1', 'base', 3130, B + " His armored gloved fist is raised in the foreground very close to the viewer, knuckles huge, knocking on a glass screen, his face slightly behind it looking at the viewer expectantly with raised eyebrows."),
    ('knock2', 'base', 3540, HB + " His right hand, wearing a steel plated armored gauntlet, is a clenched fist raised beside his shoulder after knocking, head tilted, eyebrows raised, listening with a questioning look."),
    ('point', 'base', 3150, HB + " He is pointing his index finger straight at the viewer, eyebrows raised, mouth closed."),
    ('shrug', 'base', 3560, B + " He is shrugging: both palms turned up at the height of his collar, just above his shoulders, elbows tucked in, awkward smile, mouth closed. Same close-up camera distance as the reference: the head is exactly as big as in the reference, the hands are cropped at the picture edges if needed."),
    ('plead', 'base', 3170, HB + " Both of his hands are pressed palm to palm in front of his chest in a pleading gesture, big puppy eyes, mouth closed."),
    ('think', 'base', 3180, HB + " He holds his right hand up to his face, fingers and thumb touching his chin, thinking hard, one eyebrow raised, mouth closed."),
    ('wave', 'base', 3190, HB + " His right hand is raised beside his head, open palm facing the viewer, fingers spread, waving hello, friendly grin, mouth closed."),
    ('lean', 'base', 3200, B + " He leans his head forward toward the viewer, squinting suspiciously, mouth closed."),
]
for k in ('point', 'shrug', 'plead', 'think', 'wave', 'lean'):
    POSES.append((k + '_t', k, 3300 + len(POSES) * 10, B + " Exactly the same pose and gesture, same hands, but his mouth is wide open talking."))

# images de la nuit (27/11) : intermédiaires des gestes et poing écrasé contre la vitre
POSES += [
    ('pointA', 'base', 3700, HB + " He is raising his right hand toward the viewer at chest height, the index finger starting to point, halfway through the gesture, mouth closed."),
    ('shrugA', 'base', 3710, B + " He is starting to shrug: both hands rising on each side at the bottom of the picture, palms beginning to turn up, eyebrows rising, mouth closed. The head is exactly as big as in the reference."),
    ('pleadA', 'base', 3720, B + " He is bringing both hands together in front of his chest at the bottom of the picture, about to press them together, eyebrows rising, mouth closed."),
    ('thinkA', 'base', 3730, B + " He is raising his right hand toward his chin, halfway through the gesture, the hand at the bottom of the picture, eyes starting to look up, mouth closed."),
    ('waveA', 'base', 3740, HB + " He is raising his open right hand at shoulder height, halfway through a wave, smile widening, mouth closed."),
    ('knockC', 'knock1', 3750, B + " Exactly the same pose, same armored gauntlet, but his fist is now pressed flat against the glass of the screen right in front of the viewer, the steel knuckles squashed against the window pane, wincing grimace."),
]

def mesure(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(int); h, w, _ = a.shape
    bg = np.median(np.concatenate([a[:20, :20].reshape(-1, 3), a[:20, -20:].reshape(-1, 3)]), axis=0)
    m = np.sqrt(((a - bg) ** 2).sum(2)) > 70
    out = []
    for r in ROWS:
        row = m[int(r * h) - 3:int(r * h) + 4].any(0); xs = np.where(row)[0]
        out.append((xs[0] / w, xs[-1] / w) if len(xs) else (0.5, 0.5))
    return out

def ecart(ref, cur):
    """0 = identique ; grand = bouclier d'une autre taille. Un côté peut s'élargir (bras), pas rétrécir."""
    worst = 0
    for (l0, r0), (l, r) in zip(ref, cur):
        dl, dr = l - l0, r0 - r                      # > 0 : ce côté est plus étroit que la base
        if dl > TOL or dr > TOL: worst = max(worst, 10 + max(dl, dr)); continue   # rétréci : bouclier plus petit
        worst = max(worst, min(abs(dl), abs(dr)))    # le côté qui colle le mieux doit coller
    return worst

def gen(name, ref, seed, prompt):
    out = os.path.join(W, f'hp_{name}.png')
    subprocess.run(['flux-image', prompt, '-i', ref, '-o', out, '-s', '1280x1024', '--seed', str(seed)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out

if __name__ == '__main__':
    if sys.argv[1:2] == ['--mesure']:
        for p in sys.argv[2:]: print(p, [(round(l, 3), round(r, 3)) for l, r in mesure(p)])
        sys.exit()
    base = os.path.join(W, 'base.png'); ref = mesure(base)
    only = set(sys.argv[1:]); rep = {}
    for name, rk, seed0, prompt in POSES:
        if only and name not in only: continue
        dst = os.path.join(W, f'hp_{name}.png')
        if os.path.exists(dst) and not only: continue
        rpath = base if rk == 'base' else os.path.join(W, f'hp_{rk}.png')
        best = (9e9, None)
        for t in range(TRIES):
            tmp = gen(f'{name}_try{t}', rpath, seed0 + t, prompt)
            if not os.path.exists(tmp): continue
            e = ecart(ref, mesure(tmp)); print(f'{name} essai {t} : écart {e:.3f}', flush=True)
            if e < best[0]:
                if best[1]: os.replace(best[1], best[1].replace('.png', '_rejet.png'))
                best = (e, tmp)
            else: os.replace(tmp, tmp.replace('.png', '_rejet.png'))
            if e <= TOL * 0.6: break
        if best[1]: os.replace(best[1], dst); rep[name] = round(best[0], 3); print(f'{name} retenu, écart {best[0]:.3f}', flush=True)
    json.dump(rep, open(os.path.join(W, 'controle.json'), 'w'), indent=1)
    print('done', rep)
