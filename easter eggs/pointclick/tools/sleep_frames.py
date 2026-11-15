#!/usr/bin/env python3 -I
"""Intervalles du coucher -> animation du jeu : une planche de sprites par personnage. Source de chaque passage : les 16 images
ToonCrafter (work/sleep/<perso>/toon/<début>-<fin>/, tools/toon_jobs.py) ; la boucle de respiration vient de la vidéo LTX (clips/*_loop.mp4).
Toutes les images d'un personnage (coucher, boucle de respiration, réveil) partagent le même cadre, la même échelle que son sprite
debout, le même point d'ancrage au sol et la même palette ; contour sombre de 1 px ; les grains isolés (poussière) sont retirés.
Usage : sleep_frames.py <perso> [--sprite nom_dans_scales] [--fps 12] [--pit part_cachée]
  -> assets/pointclick/sleep/<perso>.png (grille) et l'entrée <perso> de assets/pointclick/sleep/index.json :
     {w, h, ax, ay, cols, n, seg: {nom: [première image, nombre]}, fps}"""
import sys, os, json, subprocess, tempfile, glob, importlib.util
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
T = os.path.dirname(os.path.abspath(__file__)); PC = os.path.join(T, '..'); R = os.path.abspath(os.path.join(PC, '..', '..'))
S = os.path.join(PC, 'work', 'sleep'); OUT = os.path.join(R, 'assets', 'pointclick', 'sleep'); SC = os.path.join(PC, 'work', 'scales.json')


def load(name):
    sp = importlib.util.spec_from_file_location(name, os.path.join(T, name + '.py')); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m


PX = load('sleep_pixelize'); CL = load('sleep_clips')


def frames(clip, fps, size, crop=None):
    """images de la vidéo, replacées dans les coordonnées de la toile guide (la vidéo est un recadrage fixe du personnage : crop.json)"""
    tmp = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-v', 'error', '-i', clip, '-vf', f'fps={fps}', os.path.join(tmp, 'f%04d.png')], check=True)
    out = []
    for f in sorted(glob.glob(os.path.join(tmp, 'f*.png'))):
        im = Image.open(f).convert('RGB')
        if crop:
            x0, y0, x1, y1 = crop['box']; px = im.load(); w, h = im.size
            bg = tuple(sum(px[x, y][i] for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))) // 4 for i in range(3))
            cv = Image.new('RGB', tuple(size), bg); cv.paste(im.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0)); im = cv
        else: im = im.resize(tuple(size), Image.LANCZOS)
        out.append(im)
    return out


def place(im, crop, size):
    """image d'un recadrage fixe (crop.json) replacée dans les coordonnées de la toile guide, fond uni prolongé"""
    x0, y0, x1, y1 = crop['box']; px = im.load(); w, h = im.size
    bg = tuple(sum(px[x, y][i] for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))) // 4 for i in range(3))
    cv = Image.new('RGB', tuple(size), bg); cv.paste(im.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0)); return cv


QB = 16   # côté des blocs du contrôle d'images (pixels de la sortie ToonCrafter 512x320)


def _blocks(x):
    h, w = x.shape[:2]; x = x[:h // QB * QB, :w // QB * QB]
    return x.reshape(h // QB, QB, w // QB, QB, *x.shape[2:]).mean((1, 3))


def bad_frames(A):
    """images ratées d'un passage ToonCrafter, à ne jamais montrer : un morceau qui s'écarte à la fois de l'image d'avant et de celle
    d'après bien plus qu'elles ne s'écartent entre elles (objet ou motif de vêtement qui apparaît une ou deux images puis disparaît,
    gourdin dédoublé), ou qui devient nettement plus flou que ses deux voisines (visage brouillé). Mesuré par blocs de 16 px sur le
    personnage, pour une image seule et pour deux images de suite. Note par image = nombre de blocs fautifs ; écartées : note >= 20,
    ou >= 8 si l'accident ne dure qu'une ou deux images (au-delà, c'est le plus souvent un vrai mouvement rapide)."""
    from scipy.ndimage import laplace
    bg = A[0][2, 2]; fg = [_blocks((np.abs(a - bg).sum(2) > 60).astype(np.float32)) > 0.15 for a in A]
    S = [_blocks(laplace(a.mean(2)) ** 2) for a in A]
    D = lambda i, j: _blocks(np.abs(A[i] - A[j]).sum(2))
    sc = {}
    for w in (1, 2):
        for i in range(1, 16 - w):
            p, q = i - 1, i + w
            ref = D(p, q); m = fg[p] | fg[q]; fl = np.ones_like(ref, bool); bl = np.ones_like(ref, bool)
            for k in range(i, i + w):
                m = m | fg[k]
                fl &= np.minimum(D(k, p), D(k, q)) > 1.8 * ref + 40
                bl &= (S[k] < 0.45 * np.minimum(S[p], S[q])) & (np.minimum(S[p], S[q]) > 150)
            n = int((fl & m).sum()) + int((bl & m).sum())
            for k in range(i, i + w): sc[k] = max(sc.get(k, 0), n)
    bad = set()
    for k in range(1, 15):
        if sc.get(k, 0) >= 20: bad.add(k)
        elif sc.get(k, 0) >= 8:
            a = k
            while a - 1 >= 1 and sc.get(a - 1, 0) >= 8: a -= 1
            b = k
            while b + 1 <= 14 and sc.get(b + 1, 0) >= 8: b += 1
            if b - a + 1 <= 2: bad.add(k)
    return bad


# images ToonCrafter écartées à la main, passage par passage (choix d'images, aucune retouche) : ce que bad_frames ne voit pas.
# giant dos-dsc : le gourdin arrive du haut de l'écran (images 1 à 6) au lieu de sortir de derrière son dos ; on garde celles où il
# sort de derrière sa tête.
# giant jet-yawn : images 4 et 5, son avant-bras s'allonge en bâton sombre (on croirait qu'il tient encore son gourdin lancé).
SKIP = {('giant', 'dos-dsc'): set(range(1, 7)), ('giant', 'jet-yawn'): {4, 5}}


def toon_frames(dirp, n, size):
    """les 16 images ToonCrafter d'un passage, recalées dans le temps : ToonCrafter garde souvent la pose de départ longtemps puis
    bouge vite. On mesure le mouvement entre images successives (sur le personnage seulement) et on choisit n images réparties
    selon le mouvement accumulé, avec une entrée et une sortie adoucies (lent, rapide, lent) : les poses tenues sont raccourcies,
    les images en mouvement gardées. Pas de fondu entre deux images : on reprend toujours une image dessinée, jamais une image
    ratée (bad_frames)."""
    ims = [Image.open(os.path.join(dirp, f'f{i:02d}.png')).convert('RGB') for i in range(16)]
    A = [np.asarray(im).astype(np.int16) for im in ims]; bg = A[0][2, 2]
    fg = [np.abs(a - bg).sum(2) > 60 for a in A]
    d = [0.0] + [float(np.abs(A[i] - A[i - 1]).sum(2)[fg[i] | fg[i - 1]].mean()) for i in range(1, 16)]
    d = [max(0.0, v - 8.0) for v in d]                   # bruit de décodage (mesuré : 7 à 9 sur une pose tenue) d'une image à l'autre : pas un mouvement
    C = np.cumsum(d); M = C[-1]
    skip = SKIP.get((os.path.basename(os.path.dirname(os.path.dirname(dirp))), os.path.basename(dirp)), set())
    ok = [i for i in range(16) if i not in bad_frames(A) and i not in skip]   # jamais d'image ratée (flou, objet fantôme)
    if M < 1: pick = [min(ok, key=lambda j: abs(j - i * 15 / max(1, n - 1))) for i in range(n)]
    else:
        pick = []
        for k in range(n):
            t = k / max(1, n - 1); e = 0.5 - 0.5 * np.cos(np.pi * t)
            pick.append(min(ok, key=lambda j: abs(C[j] - e * M)))
    crop = json.load(open(os.path.join(dirp, 'crop.json')))
    return [place(ims[i], crop, size) for i in pick]


def despeckle(alpha, minpx=6):
    """retire les petits morceaux détachés du personnage (grains de poussière, restes de fond)"""
    a = alpha.copy(); h, w = a.shape; seen = np.zeros_like(a, bool)
    for y in range(h):
        for x in range(w):
            if a[y, x] and not seen[y, x]:
                st = [(y, x)]; seen[y, x] = True; comp = []
                while st:
                    cy, cx = st.pop(); comp.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; st.append((ny, nx))
                if len(comp) < minpx:
                    for cy, cx in comp: a[cy, cx] = False
    return a


def main():
    a = sys.argv[1:]; ch = a[0]; spr = ch; fps = 12
    if '--sprite' in a: spr = a[a.index('--sprite') + 1]
    if '--fps' in a: fps = float(a[a.index('--fps') + 1])
    pit = float(a[a.index('--pit') + 1]) if '--pit' in a else 0     # part du corps cachée dans la fosse au départ (Nazim)
    d = os.path.join(S, ch); gj = json.load(open(os.path.join(d, 'guide.json'))); GW, GH = gj['size']; G = gj['ground']
    f = json.load(open(SC))[spr] / gj['k']
    _, gal = PX.key(Image.open(os.path.join(d, 'guide.png'))); AX = PX.mass_x(gal)
    tb = CL.BG.get(ch, CL.GREEN); loose = (PX.safe_k(*PX.key(Image.open(os.path.join(d, 'guide.png'))), tb), tb)   # fond des images ToonCrafter
    seq, seg = [], {}
    clips = CL.CLIPS[ch]
    cf = os.path.join(d, 'clips', 'crop.json'); crop = json.load(open(cf)) if os.path.exists(cf) else None
    for i, (n, a0, b0, dur, act) in enumerate(clips):
        td = os.path.join(d, 'toon', f'{a0}-{b0}')
        if n != 'loop' and os.path.exists(os.path.join(td, 'f15.png')): fs = toon_frames(td, max(2, round(dur * fps)) + 1, (GW, GH))
        elif n == 'loop': fs = frames(glob.glob(os.path.join(d, 'clips', '*_loop.mp4'))[0], fps * 0.75, (GW, GH), crop)
        else: sys.exit(f'{ch} {n} ({a0} -> {b0}) : intervalles ToonCrafter manquants ({td}) ; lancer toon_jobs.py puis toon_interp.py')
        fs = fs[:-1]                      # la dernière image = première du passage suivant (ou de la boucle)
        seg[n] = [len(seq), len(fs)]; seq += fs
    seq.append(Image.open(os.path.join(d, 'guide.png'))); seg['end'] = [len(seq) - 1, 1]
    ims = [PX.key(im, loose) for im in seq]; print('tolérance de teinte du fond', loose[0])
    bb = None
    for _, al in ims:
        b = al.getbbox(); bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    x0, y0, x1, y1 = bb[0] - 4, bb[1] - 4, bb[2] + 4, max(bb[3], G) + 4
    x0 = min(x0, int(AX) - 4); x1 = max(x1, int(AX) + 4)
    sz = (max(1, round((x1 - x0) * f)), max(1, round((y1 - y0) * f)))
    small = []
    for im, al in ims:
        rgba = im.crop((x0, y0, x1, y1)).convert('RGBA'); rgba.putalpha(al.crop((x0, y0, x1, y1)))
        c = rgba.convert('RGBa').resize(sz, Image.LANCZOS).convert('RGBA').convert('RGB')   # réduction prémultipliée : le fond n'entre pas dans les pixels du bord
        m = np.asarray(al.crop((x0, y0, x1, y1)).resize(sz, Image.LANCZOS)) > 140
        small.append((c, despeckle(m)))
    mos = Image.new('RGB', (sz[0], sz[1] * len(small)))
    for i, (c, m) in enumerate(small): mos.paste(c, (0, i * sz[1]))
    pal = mos.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    cols = int(np.ceil(np.sqrt(len(small)))); rows = int(np.ceil(len(small) / cols))
    sheet = Image.new('RGBA', (cols * sz[0], rows * sz[1]), (0, 0, 0, 0))
    for i, (c, m) in enumerate(small):
        q = ImageEnhance.Contrast(ImageEnhance.Color(c.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')).enhance(1.15)).enhance(1.08)
        A = np.dstack([np.asarray(q), (m * 255).astype(np.uint8)]).copy()
        nb = np.zeros_like(m); nb[1:] |= m[:-1]; nb[:-1] |= m[1:]; nb[:, 1:] |= m[:, :-1]; nb[:, :-1] |= m[:, 1:]
        A[nb & ~m] = (34, 18, 24, 255)
        sheet.paste(Image.fromarray(A), ((i % cols) * sz[0], (i // cols) * sz[1]))
    os.makedirs(OUT, exist_ok=True); sheet.save(os.path.join(OUT, ch + '.png'), optimize=True)
    ip = os.path.join(OUT, 'index.json'); idx = json.load(open(ip)) if os.path.exists(ip) else {}
    idx[ch] = {'w': sz[0], 'h': sz[1], 'ax': round((AX - x0) * f, 1), 'ay': round((G - y0) * f, 1), 'cols': cols, 'n': len(small), 'seg': seg, 'fps': fps, 'lfps': fps * 0.75}
    if pit: idx[ch]['pit'] = round((gj['rect'][3] - gj['rect'][1]) * f * pit, 1)
    json.dump(idx, open(ip, 'w'), indent=1)
    print(ch, idx[ch], 'planche', sheet.size, os.path.getsize(os.path.join(OUT, ch + '.png')) // 1024, 'Ko')


if __name__ == '__main__': main()
