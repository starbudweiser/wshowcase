#!/usr/bin/env python3
"""Incrustation professionnelle des poses sur fond vert (18/11/2026) : Fusion 21 Render Node, sans fenêtre (skill fusion), DeltaKeyer.
  1. Pour chaque image, une matte intérieure pleine (« core matte », entrée Solid Matte) et une image de fond propre (« clean plate ») : le fond vert relié aux bords, prolongé en douceur sous le personnage
     (FLUX laisse un léger dégradé et un vignettage : le keyer compare chaque pixel au fond qui est vraiment derrière lui).
  2. Loader (image) + Loader (fond propre) -> DeltaKeyer (couleur du fond ; sa suppression du reflet vert, qui rougit le blond et rosit la fourrure, est coupée) -> Saver PNG RGBA. Seule la matte (alpha) sert : les couleurs restent celles de l'image d'origine (tools/hero_clean_sprites.py).
usage, avec KEY_SRC="dossier source", KEY_OUT="dossier sortie", KEY_LIST="nom1,nom2,…" (sans .png) :
  python (numpy) key_fusion.py prep                 -> fonds propres + couleurs du fond (KEY_OUT/_plates/)
  ~/.claude/skills/fusion/fu_run.sh key_fusion.py   -> incrustation par le Render Node (python3 du système, sans numpy)"""
import os, sys, json

SRC, OUT, NAMES = os.environ['KEY_SRC'], os.environ['KEY_OUT'], [n for n in os.environ['KEY_LIST'].split(',') if n]


def clean_plate(path, out):
    """fond propre + matte intérieure. Le fond est trouvé par continuité depuis les bords de l'image : lisse et vert (vignettage compris),
    il ne franchit jamais le contour noir épais du personnage ; les poches fermées lisses et vertes (entre le bras et le casque) sont du fond aussi."""
    import numpy as np
    from PIL import Image, ImageFilter
    from scipy import ndimage as nd
    A = np.asarray(Image.open(path).convert('RGB')).astype(np.float32); h, w, _ = A.shape
    Sm = nd.gaussian_filter(A, (1.5, 1.5, 0)); gr = sum(np.hypot(nd.sobel(Sm[..., c], 0), nd.sobel(Sm[..., c], 1)) for c in range(3))
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    smooth_green = (gr < 60) & (g >= np.maximum(r, b) - 4) & (g - np.minimum(r, b) > 18)
    lab, n = nd.label(smooth_green); sz = nd.sum(smooth_green, lab, range(1, n + 1))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); isbg = np.zeros(n + 1, bool); isbg[edge] = True   # relié au bord : toujours du fond
    isbg[0] = False
    yy, xx = np.mgrid[0:h, 0:w]; G = np.stack([np.ones_like(xx), xx / w, yy / h, (xx / w) ** 2, (yy / h) ** 2, xx * yy / (w * h)], -1)

    def fit(mask):                                                          # fond lisse (polynôme de degré 2) ajusté sur le fond visible : il suit le vignettage
        ys, xs = np.nonzero(mask); k = max(1, len(ys) // 40000); ys, xs = ys[::k], xs[::k]
        X = np.stack([np.ones_like(xs), xs / w, ys / h, (xs / w) ** 2, (ys / h) ** 2, xs * ys / (w * h)], 1).astype(np.float64); P = np.zeros((h, w, 3))
        for c in range(3): coef, *_ = np.linalg.lstsq(X, A[ys, xs, c].astype(np.float64), rcond=None); P[..., c] = G @ coef
        return P
    P = fit(nd.binary_erosion(isbg[lab], iterations=4))
    for i in np.nonzero((sz > 1500) & ~isbg[1:])[0] + 1:                    # poches fermées : du fond seulement si c'est le fond attendu à cet endroit (pas la feuille de chou)
        cm = lab == i
        if np.abs(A[cm].mean(0) - P[cm].mean(0)).sum() < 45: isbg[i] = True
    bgm = nd.binary_closing(isbg[lab], iterations=2)                        # le grain du fond ne fait pas de trous
    m = nd.binary_erosion(bgm, iterations=4)                                # fond sûr, loin du personnage
    P = fit(m)
    P = np.where(m[..., None], A, P)                                        # le vrai fond là où il se voit
    Image.fromarray(np.clip(P, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)).save(out)
    subj = ~bgm; lab2, n2 = nd.label(subj)                                  # matte intérieure : le personnage (une seule pièce), rétréci de 3 px
    if n2 > 1: s2 = nd.sum(subj, lab2, range(1, n2 + 1)); subj = lab2 == (1 + int(np.argmax(s2)))
    core = nd.binary_erosion(subj, iterations=3).astype(np.uint8) * 255
    Image.fromarray(np.dstack([core, core, core, core]), 'RGBA').save(out.replace('_plate.png', '_core.png'))
    bg = np.median(A[m], 0)
    return [float(v) / 255 for v in bg]


def prep():
    tmp = os.path.join(OUT, '_plates'); os.makedirs(tmp, exist_ok=True); bgs = {}
    for n in NAMES: bgs[n] = clean_plate(os.path.join(SRC, n + '.png'), os.path.join(tmp, n + '_plate.png'))
    json.dump(bgs, open(os.path.join(tmp, 'bg.json'), 'w'))


def main():
    import fusionscript as fs, shutil, tempfile
    tmp = os.path.join(OUT, '_plates'); bgs = json.load(open(os.path.join(tmp, 'bg.json')))
    W = tempfile.mkdtemp(prefix='keyfu')        # le Loader de Fusion bloque sur un chemin à espaces et parenthèses : on travaille dans un dossier neutre
    app = fs.scriptapp('Fusion')
    for i, n in enumerate(NAMES):
        d = f'{W}/job{i}x'; os.makedirs(d)          # un dossier par image et des noms sans chiffre final : Fusion lirait sinon une séquence
        src, plate, rd, bg = f'{d}/source.png', f'{d}/plate.png', f'{d}/out', bgs[n]
        shutil.copy(os.path.join(SRC, n + '.png'), src); shutil.copy(os.path.join(tmp, n + '_plate.png'), plate); os.makedirs(rd)
        core = f'{d}/core.png'; shutil.copy(os.path.join(tmp, n + '_core.png'), core)
        comp = app.NewComp(True, True, True); comp.Lock()
        comp.SetAttrs({'COMPN_GlobalStart': 0, 'COMPN_GlobalEnd': 0, 'COMPN_RenderStart': 0, 'COMPN_RenderEnd': 0})
        ld = comp.AddTool('Loader', 0, 0); ld.Clip = src
        lp = comp.AddTool('Loader', 0, 1); lp.Clip = plate
        dk = comp.AddTool('DeltaKeyer', 1, 0); dk.SetInput('UseGPU', 0); dk.Input.ConnectTo(ld.Output); dk.Clean.ConnectTo(lp.Output)
        for c, v in zip(('Red', 'Green', 'Blue'), bg): dk.SetInput('Background' + c, v)
        lc = comp.AddTool('Loader', 0, 2); lc.Clip = core
        [v for v in dk.GetInputList().values() if v.GetAttrs()['INPS_ID'] == 'Solid.Matte'][0].ConnectTo(lc.Output)   # intérieur plein
        dk.SetInput('SpillSuppression', 0)       # couleurs d'origine intactes (cheveux, fourrure) ; le reflet vert est retiré au liseré seulement, à l'étape suivante
        sv = comp.AddTool('Saver', 2, 0); sv.Clip = rd + '/k_.png'; sv.Input.ConnectTo(dk.Output)
        comp.Unlock(); ok = comp.Render({'Start': 0, 'End': 0, 'Wait': True, 'Tool': sv}); comp.Close()
        got = [f for f in os.listdir(rd) if f.endswith('.png')]
        if not ok or not got: print('ÉCHEC', n, flush=True); continue
        shutil.move(os.path.join(rd, got[0]), os.path.join(OUT, n + '.png')); print('ok', n, flush=True)
    shutil.rmtree(W)


prep() if sys.argv[1:] == ['prep'] else main()
