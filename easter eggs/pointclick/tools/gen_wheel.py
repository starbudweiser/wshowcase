#!/usr/bin/env python3 -I
"""Roue à aubes du moulin qui tourne vraiment, tirée de l'image d'origine (FLUX 1280x720), sans rien peindre par-dessus l'ancienne.

Modèle : la roue est un disque vu de biais (plan tourné autour de la verticale), donc chaque face se projette en ellipse
(centre C, demi-axes rx, ry mesurés sur la jante) ; la face arrière est la même ellipse décalée de D (profondeur du tambour).
- Face avant : la face de l'image d'origine est redressée en disque, puis rendue parfaitement régulière (médiane des NS secteurs
  entre deux rayons, en ignorant ce qui la cache : barrière, herbe, eau) ; son canal alpha sépare le bois (jante, rayons) des jours.
- Face arrière : la même face, assombrie, au fond du tambour.
- Pales : planches entre les deux jantes, couleur prélevée sur les pales de l'image d'origine, triées en profondeur.
- Fond vu à travers les jours : le décor d'origine dont on a retiré le bois clair par une ouverture morphologique (reste l'ombre du mur).
- Ce qui est devant la roue (barrière, herbe, filet d'eau) : pixels d'origine qui diffèrent de la roue reconstruite, gardés fixes devant.
Chaque image est calculée en sur-échantillonnage, réduite à la taille du jeu et ramenée à la palette du décor (sans tramage, pour
qu'aucun pixel ne scintille). La rotation se fait dans le sens horaire ; NF images couvrent l'écart entre deux rayons et bouclent.
Sortie : assets/pointclick/anim/<id>_<n>.png + entrée dans index.json. Usage : gen_wheel.py"""
import os, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates, grey_opening, gaussian_filter, binary_opening, binary_closing, binary_dilation

R0 = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WORK = os.path.join(R0, 'easter eggs', 'pointclick', 'work'); OUT = os.path.join(R0, 'assets', 'pointclick', 'anim')

CFG = {'mill_wheel': dict(scene='mill', src='mill_121.png',
                          cx=167.0, cy=161.0, rx=27.5, ry=35.5,   # jante avant (mesurée sur l'image d'origine)
                          D=(-11.0, 0.0),                         # décalage de la face arrière (profondeur du tambour)
                          NS=11, NP=22, NF=16,                    # rayons, pales, images par écart entre deux rayons
                          rim=0.86, hub=0.2,                      # bord intérieur de la jante, rayon du moyeu (en fraction de ry)
                          hidden=lambda X, Y: Y > 164.5,          # zone de la face où la barrière ou l'herbe peuvent cacher la roue
                          ground=lambda X, Y: Y > 180.5,          # sol devant le pied de la roue
                          hubzone=lambda X, Y: ((X - 168.6) / 8.9) ** 2 + ((Y - 160.5) / 8.3) ** 2 <= 1,   # moyeu (anneau, axe, chapeau)
                          front=lambda X, Y: (X > 166.5) & (X < 170.5) & (Y > 171),                     # poteau de barrière
                          paddle=(131, 147, 136, 153))}            # zone où prélever la couleur des pales

SS = 6          # sur-échantillonnage du rendu
K = 1280 / 480  # image d'origine -> jeu


def run(id_, c):
    hi = np.asarray(Image.open(os.path.join(WORK, c['src'])).convert('RGB'), float)
    bgp = Image.open(os.path.join(R0, 'assets', 'pointclick', c['scene'] + '.png'))
    cx, cy, rx, ry, (dx, dy) = c['cx'], c['cy'], c['rx'], c['ry'], c['D']; a = rx / ry; NS, NP, NF = c['NS'], c['NP'], c['NF']
    samp = lambda X, Y: np.stack([map_coordinates(hi[..., k], [Y * K, X * K], order=1, mode='nearest') for k in range(3)], -1)

    # --- 1. face avant régularisée, en coordonnées polaires (r en fraction de ry ; angle : tour complet échantillonné finement)
    NR, NT = 240, 160; per = 2 * np.pi / NS; NA = NT * NS
    rr = np.linspace(0, 1.06, NR)[:, None]; ta = np.linspace(0, 2 * np.pi, NA, endpoint=False)[None, :]
    Xp = cx + rr * rx * np.cos(ta); Yp = cy - rr * ry * np.sin(ta)
    full = samp(Xp, Yp); okf = ~c['hidden'](Xp, Yp) & ~(rr < c['hub'] + 0.06) & ~c['hubzone'](Xp, Yp)
    # les rayons de l'image d'origine ne sont pas régulièrement espacés : on garde le secteur le plus net (centré sur le rayon le plus
    # proche de la verticale, entièrement visible) et on le répète NS fois ; chaque rayon d'origine est repéré pour savoir où il était
    L = full @ [0.3, 0.55, 0.15]; band = (rr[:, 0] > 0.32) & (rr[:, 0] < 0.82)
    prof = np.where(okf[band], L[band], np.nan); cnt = (~np.isnan(prof)).sum(0); prof = np.nansum(np.nan_to_num(prof), 0) / np.maximum(cnt, 1)
    prof[cnt < band.sum() * 0.8] = np.nan
    sm = np.convolve(np.nan_to_num(np.r_[prof[-20:], prof, prof[:20]], nan=0), np.ones(9) / 9, 'same')[20:-20]
    pk = [i for i in range(NA) if not np.isnan(prof[i]) and sm[i] == sm[max(0, i - NT // 3):i + NT // 3].max() and sm[i] > np.nanmean(prof) + 10]
    ref = min(pk, key=lambda i: abs(i - c.get('ref_angle', 90) / 360 * NA)); shifts = pk
    win0 = (np.arange(NT) - NT // 2 + ref) % NA
    face = full[:, win0].copy()
    win = []
    for k in range(NS):
        e = ref + k * NT; near = [q for q in pk if min(abs(q - e) % NA, NA - abs(q - e) % NA) < NT * 0.4]
        cen = min(near, key=lambda q: min(abs(q - e) % NA, NA - abs(q - e) % NA)) if near else e
        win.append((np.arange(NT) - NT // 2 + cen) % NA)
    lum = face @ [0.3, 0.55, 0.15]
    alpha = np.clip((lum - 55) / 28, 0, 1)                                # bois clair = opaque, jours sombres = transparents
    # seul le rayon du secteur appartient à la face avant : on le suit ligne par ligne depuis son axe (ce qui est clair à côté, ce sont
    # les rayons et pales du fond, rendus par leurs propres couches)
    spoke = np.zeros_like(alpha); mid = NT // 2
    for i in range(NR):
        row = alpha[i]; j0 = mid + int(np.argmax(row[mid - 6:mid + 7])) - 6
        if row[j0] < 0.5: continue
        l = j0; r_ = j0
        lr = np.clip((lum[i] - 40) / 25, 0, 1)                            # bord du rayon : on suit jusqu'à l'ombre franche
        while l > 0 and lr[l - 1] > 0.2: l -= 1
        while r_ < NT - 1 and lr[r_ + 1] > 0.2: r_ += 1
        spoke[i, l:r_ + 1] = np.maximum(row[l:r_ + 1], lr[l:r_ + 1])
    alpha = spoke
    alpha[rr[:, 0] >= c['rim'] - 0.01] = 1; alpha[rr[:, 0] < c['hub']] = 1; alpha[rr[:, 0] > 1.0] = 0
    alpha = gaussian_filter(alpha, (0.6, 0.6), mode=('nearest', 'wrap'))
    # la roue telle qu'elle est posée dans l'image d'origine (secteurs à leur place) : sert à trouver ce qui la cache
    if os.environ.get('WHEEL_DEBUG'):
        Image.fromarray(np.vstack([np.hstack([face]*6), np.hstack([np.repeat(alpha[...,None],3,2)*255]*6), full[:, :NT*6]]).clip(0,255).astype('uint8')[::-1]).resize((NT*6*2, NR*3*2)).save(os.environ['WHEEL_DEBUG'])
        print('shifts', shifts)
    expect = np.zeros((NR, NA, 3)); expA = np.zeros((NR, NA))
    for k in range(NS): expect[:, win[k]] = face; expA[:, win[k]] = alpha

    def face_at(X, Y, ox, rot):
        """couleur et alpha de la face (centre décalé de ox) aux points écran X, Y, roue tournée de rot"""
        u = (X - cx - ox) / a; v = -(Y - cy); r = np.hypot(u, v) / ry; th = (np.arctan2(v, u) - rot) % per
        ri = r / 1.06 * (NR - 1); ti = th / per * NT
        col = np.stack([map_coordinates(face[..., k], [ri, ti], order=1, mode='wrap') for k in range(3)], -1)
        al = map_coordinates(alpha, [ri, ti], order=1, mode='wrap'); al[r > 1.0] = 0
        return col, al

    # --- 2. zone redessinée : tout le tambour (enveloppe des deux faces), un peu élargie pour couvrir l'ancienne roue
    x0, x1 = int(np.floor(cx + dx - rx - 3)), int(np.ceil(cx + rx + 3)); y0, y1 = int(np.floor(cy - ry - 3)), int(np.ceil(min(cy + ry + 3, 270)))
    w, h = x1 - x0, y1 - y0
    gx = x0 + (np.arange(w * SS) + 0.5) / SS; gy = y0 + (np.arange(h * SS) + 0.5) / SS; X, Y = np.meshgrid(gx, gy)
    inside = lambda ox, grow: (((X - cx - ox) / (rx + grow)) ** 2 + ((Y - cy) / (ry + grow)) ** 2) <= 1
    drum = inside(0, 1.2) | inside(dx, 1.4)
    for f in np.linspace(0, 1, 24): drum |= inside(dx * f, 1.2)

    orig = samp(X, Y)
    # fond vu à travers les jours : le bois clair (rayons, jante, pales) retiré par ouverture morphologique
    back = np.stack([grey_opening(orig[..., k], size=(int(4.5 * SS), int(4.5 * SS))) for k in range(3)], -1)
    back = gaussian_filter(back, (SS, SS, 0))

    px0, py0, px1, py1 = c['paddle']; pg = np.mgrid[py0:py1:0.25, px0:px1:0.25]
    pv = samp(pg[1], pg[0]).reshape(-1, 3); pc = np.median(pv[np.argsort(pv @ [0.3, 0.55, 0.15])[len(pv) // 4:3 * len(pv) // 4]], 0)

    def render(rot):
        img = back.copy()
        col, al = face_at(X, Y, dx, rot); img = img * (1 - al[..., None]) + col * 0.45 * al[..., None]    # face arrière, dans l'ombre
        # pales : planches entre les deux jantes, de la plus lointaine à la plus proche
        lay = Image.new('RGBA', (w * SS, h * SS)); dr = ImageDraw.Draw(lay); pads = []
        for i in range(NP):
            th = rot + (i + 0.5) * 2 * np.pi / NP
            P = lambda r, f: ((cx + a * ry * r * np.cos(th) + dx * f - x0) * SS, (cy - ry * r * np.sin(th) + dy * f - y0) * SS)
            q = [P(0.78, 0.06), P(0.98, 0.06), P(0.98, 0.94), P(0.78, 0.94)]
            pads.append((-np.cos(th), th, q))
        for z, th, q in sorted(pads, key=lambda p: -p[0]):
            k = 0.75 + 0.45 * abs(np.sin(th + 0.7)); fc = tuple(int(min(255, v * k)) for v in pc)
            dr.polygon(q, fill=fc + (255,), outline=(30, 18, 10, 255), width=max(1, SS // 3))
        L = np.asarray(lay, float) / 255; la = L[..., 3:4]; img = img * (1 - la) + L[..., :3] * 255 * la
        col, al = face_at(X, Y, 0, rot); img = img * (1 - al[..., None]) + col * al[..., None]             # face avant
        return img

    def down(img):  # sur-échantillonné -> taille du jeu
        return img.reshape(h, SS, w, SS, -1).mean((1, 3))

    # --- 3. ce qui est devant la roue : barrière, herbe, filet d'eau = là où l'image d'origine s'écarte de la roue en place ;
    #        le moyeu (rond, sa rotation ne se voit pas) et le sol sous la roue restent ceux de l'image d'origine
    gxs, gys = np.meshgrid(x0 + np.arange(w) + 0.5, y0 + np.arange(h) + 0.5)
    u = (X - cx) / a; v = -(Y - cy); r = np.hypot(u, v) / ry; j = (np.arctan2(v, u) % (2 * np.pi)) / (2 * np.pi) * NA
    ex = np.stack([map_coordinates(expect[..., k], [r / 1.06 * (NR - 1), j], order=1, mode='wrap') for k in range(3)], -1)
    exa = map_coordinates(expA, [r / 1.06 * (NR - 1), j], order=1, mode='wrap')[..., None]
    ex = down(ex); exa = down(exa)[..., 0]; o0 = down(orig); dm = down(drum[..., None].astype(float))[..., 0] > 0.5
    hz = c['hidden'](gxs, gys) & dm
    diff = np.abs(ex - o0).mean(-1) * (exa > 0.5)                       # comparé seulement là où la roue est en bois (jante, rayons)
    occ = (diff > 40) & hz
    occ = binary_closing(binary_opening(occ, iterations=1), iterations=1) & hz
    occ |= c['ground'](gxs, gys) & dm
    occ |= c['hubzone'](gxs, gys)
    occ |= c['front'](gxs, gys) & dm
    bgrgb = np.asarray(bgp.convert('RGB'))[y0:y1, x0:x1].astype(float)

    pal = bgp.copy(); idx = {'x': x0, 'y': y0, 'w': w, 'h': h, 'n': NF}
    for n in range(NF):
        rot = -n * (2 * np.pi / NS) / NF                                   # sens horaire
        fr = down(render(rot)); fr[occ] = bgrgb[occ]
        q = Image.fromarray(fr.clip(0, 255).astype('uint8')).quantize(palette=pal, dither=Image.Dither.NONE).convert('RGBA')
        A = np.asarray(q).copy(); A[..., 3] = np.where(dm, 255, 0); A[occ, :3] = bgrgb[occ]
        Image.fromarray(A).save(os.path.join(OUT, f'{id_}_{n}.png'), optimize=True)
    for n in range(NF, 40):
        p = os.path.join(OUT, f'{id_}_{n}.png')
        if os.path.exists(p): os.remove(p)
    ip = os.path.join(OUT, 'index.json'); J = json.load(open(ip)); J[id_] = idx; json.dump(J, open(ip, 'w'), indent=1)
    print(id_, idx, 'occultés :', int(occ.sum()), 'px')


if __name__ == '__main__':
    for k, v in CFG.items(): run(k, v)
