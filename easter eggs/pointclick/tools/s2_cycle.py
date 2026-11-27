#!/usr/bin/env python3 -I
"""Saison 2 : boucle d'images d'un personnage tirée d'une vidéo LTX sur fond magenta (tools/gen_s2_life.sh), pleine couleur, densité 2.
  s2_cycle.py <vidéo.mp4> <base> <pose_clé.png> <hauteur_px> [--n=24] [--walk] [--stride=…]
- même échelle et même point d'ancrage (bas, centre) que le sprite fixe fait par s2_assets.py depuis la même pose clé : passer de la
  pose fixe à la boucle, ou du repos à la parole, ne fait jamais sauter le personnage ;
- repos / parole (vidéo qui finit sur son image de départ) : n images régulières sur toute la vidéo, boucle parfaite ;
- marche (--walk, caméra qui suit) : période du pas détectée (image la plus proche de la première), dérive horizontale compensée,
  `stride` = unités logiques parcourues par image à l'échelle 1 (≈ 0,8 hauteur du corps par cycle de deux pas) ;
- sorties : assets/pointclick/s2/anim/<base>/<i>.webp, entrée <base> de assets/pointclick/s2/anim.json (n, fps, stride),
  planche de contrôle work/s2play/ltx/sheet_<base>.jpg.
Python de FLUX : "~/Modèles IA/FLUX3-Klein/.venv/bin/python" tools/s2_cycle.py …"""
import sys, os, json, glob, subprocess, tempfile
import numpy as np
from PIL import Image
from scipy.ndimage import label
P = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); R = os.path.abspath(os.path.join(P, '..', '..'))
AN = os.path.join(R, 'assets', 'pointclick', 's2', 'anim'); IDX = os.path.join(R, 'assets', 'pointclick', 's2', 'anim.json')


def key(a, bg=None):
    """alpha (0-1) d'après l'écart au fond magenta ; trous intérieurs d'une autre couleur que le fond bouchés ; magenta retiré des bords"""
    a = a.astype(np.float32); h, w, _ = a.shape
    if bg is None: bg = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)]), axis=0)
    d = np.abs(a - bg).sum(axis=2) + 2 * np.abs((a[..., 2] - a[..., 1]) - (bg[2] - bg[1]))
    al = np.clip((d - 90) / 90, 0, 1)
    lab, n = label(al < 0.5); border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    outside = np.isin(lab, list(border)); al[~outside & (al < 0.5) & (d >= 60)] = 1.0
    m = (al > 0) & (al < 1); k = al[m][:, None]; a[m] = np.clip((a[m] - (1 - k) * bg) / np.maximum(k, 0.25), 0, 255)
    # bande du bord (3 px) : le flou de mouvement y mêle le magenta du fond ; on retire l'excès de rouge et de bleu sur le vert
    from scipy.ndimage import binary_erosion
    solid = al > 0.5; band = solid & ~binary_erosion(solid, iterations=3)
    mg = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]; fix = band & (mg > 12)
    a[fix, 0] -= mg[fix] * 0.85; a[fix, 2] -= mg[fix] * 0.85; al[band & (mg > 60)] *= 0.5
    return np.dstack([np.clip(a, 0, 255), al * 255]).astype(np.uint8), bg


def bbox(al, thr=40):
    ys, xs = np.where(al > thr); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]; opt = dict(x[2:].split('=', 1) if '=' in x else (x[2:], '1') for x in sys.argv[1:] if x.startswith('--'))
    vid, base, keyimg, th = args[0], args[1], args[2], int(args[3]); N = int(opt.get('n', 24)); walk = 'walk' in opt
    K, bg = key(np.asarray(Image.open(keyimg).convert('RGB')))
    kx0, ky0, kx1, ky1 = bbox(K[..., 3]); f = th / (ky1 - ky0); cx = (kx0 + kx1) / 2   # échelle et ancrage du sprite fixe
    tmp = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, os.path.join(tmp, '%04d.png')], check=True)
    files = sorted(glob.glob(os.path.join(tmp, '*.png'))); L = len(files)
    fr0 = Image.open(files[0]); vs = K.shape[1] / fr0.width        # vidéo -> coordonnées de la pose clé
    if walk:
        # premier cycle de pas pris en pleine marche (ni le départ arrêté, ni la fin où LTX tend à tourner le personnage) :
        # départ s et période p qui rendent les images s et s+p les plus semblables
        small = [np.asarray(Image.open(p).convert('L').resize((96, 120))).astype(np.float32) for p in files]
        best = None
        for st in range(5, max(6, L // 3)):
            for per in range(12, min(40, L - st - 3)):
                dd = np.abs(small[st] - small[st + per]).mean() + 0.02 * per
                if best is None or dd < best[0]: best = (dd, st, per)
        _, st, per = best
        # pour chaque pas, l'image la plus nette parmi ses voisines (le flou de mouvement salit les pieds)
        def sharp(i): g = small[min(L - 1, max(0, i))][60:]; return np.abs(np.diff(g, axis=0)).mean() + np.abs(np.diff(g, axis=1)).mean()
        idx = []
        for i in range(N):
            c = st + round(i * per / N); idx.append(max((c - 1, c, c + 1), key=sharp))
        dur = per / 24
    else:
        idx = [round(i * (L - 1) / N) for i in range(N)]; dur = (L - 1) / 24
    frames = []
    for i in idx:
        A, _ = key(np.asarray(Image.open(files[i]).convert('RGB')), bg)
        im = Image.fromarray(A, 'RGBA').resize((round(A.shape[1] * vs), round(A.shape[0] * vs)), Image.LANCZOS); frames.append(np.asarray(im))
    if walk:   # dérive horizontale : chaque image recentrée sur le centre de masse du haut du corps
        for j, a in enumerate(frames):
            al = a[..., 3].astype(np.float32); ys, xs = np.where(al > 128); top = ys < np.percentile(ys, 55); mx = xs[top].mean()
            frames[j] = np.roll(a, int(round(cx - mx)), axis=1)
        feet = max(bbox(a[..., 3])[3] for a in frames)
    else: feet = ky1
    ux0 = min(bbox(a[..., 3])[0] for a in frames); ux1 = max(bbox(a[..., 3])[2] for a in frames); uy0 = min(bbox(a[..., 3])[1] for a in frames)
    half = max(cx - ux0, ux1 - cx) + 2; box = (int(cx - half), int(uy0), int(cx + half), int(feet))
    od = os.path.join(AN, base); os.makedirs(od, exist_ok=True)
    for p in glob.glob(os.path.join(od, '*.webp')): os.remove(p)
    outs = []
    for j, a in enumerate(frames):
        im = Image.fromarray(a, 'RGBA').crop(box); im = im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.LANCZOS)
        im.save(os.path.join(od, f'{j}.webp'), quality=88, method=6); outs.append(im)
    idx_all = json.load(open(IDX)) if os.path.exists(IDX) else {}
    e = {'n': N, 'fps': round(N / dur, 2)}
    if walk: e['stride'] = round(float(opt.get('stride', 0.8 * (th / 2) / N)), 2)
    idx_all[base] = e; json.dump(idx_all, open(IDX, 'w'), indent=1, sort_keys=True)
    cols = 8; rows = (N + cols - 1) // cols; tw, thh = outs[0].width, outs[0].height
    sheet = Image.new('RGB', (cols * tw, rows * thh), (70, 90, 70))
    for j, im in enumerate(outs): sheet.paste(im, ((j % cols) * tw, (j // cols) * thh), im)
    os.makedirs(os.path.join(P, 'work', 's2play', 'ltx'), exist_ok=True); sheet.thumbnail((1600, 1600)); sheet.save(os.path.join(P, 'work', 's2play', 'ltx', f'sheet_{base}.jpg'), quality=85)
    # pivot du buste : variation de la largeur de la silhouette à hauteur de poitrine (un cycle propre garde la même vue)
    wd = []
    for im in outs:
        al = np.asarray(im)[..., 3]; hh = al.shape[0]; band = al[int(hh * 0.22):int(hh * 0.45)] > 128; cols = band.any(axis=0); wd.append(cols.sum())
    piv = float(np.std(wd) / max(1, np.mean(wd)))
    print(base, 'images', N, 'cadre', outs[0].size, e, 'période' if walk else 'boucle', len(idx), '/', L, 'pivot %.3f' % piv)


main()
