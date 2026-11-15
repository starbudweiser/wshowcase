#!/usr/bin/env python3 -I
"""Intervalles du coucher de nuit : pour chaque passage d'une pose clé validée à la suivante, LTX (video-locale, local, gratuit)
calcule une courte vidéo à caméra fixe, image de début et image de fin imposées, sur fond vert uni (meilleur détourage que le rose).
La respiration du sommeil est une boucle : même image au début et à la fin.
Usage : sleep_clips.py [perso…]   -> work/sleep/<perso>/clips/<n>_<nom>.mp4 (relançable : saute les vidéos déjà faites)."""
import sys, os, subprocess, json, shutil
from PIL import Image, ImageChops, ImageFilter, ImageDraw
D = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(D, '..', 'work', 'sleep')
GREEN = (0, 190, 70); SIZE = (768, 512)
BG = {'farmer': (30, 70, 210)}
ES = 1.0                           # force de l'image d'arrivée (une fin souple + départ enchaîné salissait le fond : abandonné)
CHAIN = False   # fond bleu pour la fermière en robe verte
CAM = "Static locked-off camera, no camera movement, no zoom, the character stays at the same size and place. Plain flat solid uniform background color, unchanged. Hand-painted 1990s point-and-click adventure game art, same character, same costume, same colors throughout."

# poses clés validées par Stéphan (13/11/2026) ; « guide » = le personnage debout
KEYS = {
  'giant': {'start': 'guide.png', 'elan': 'm_elan_3.png', 'jet': 'm_jet_1.png', 'yawn': 'm_yawn_3.png', 'crouch': 'm_crouch_3.png', 'sit': 'm_sit_1.png',
            'piv': 'm_piv_2.png', 'lean': 'm_lean_2.png', 'settle': 'm_settle_1.png', 'mss': 'm_mss_3.png', 'sleep': 'm_sleep_1.png', 'prop': 'm_prop_2.png',
            'pmp': 'm_pmp_1.png', 'mpw': 'm_mpw2_2.png', 'wake': 'm_wake_2.png', 'rise': 'm_rise_2.png', 'vide': 'n_start.png', 'dos': 'm_dos_2.png',
            'ycr': 'm_ycr5_2.png', 'spv': 'm_spv4_1.png', 'mwk': 'm_mwk4_3.png', 'wkr': 'm_wkr4_2.png', 'rsv': 'm_rsv4_3.png', 'dsc': 'm_dsc5_2.png',
            'yw2': 'm_yw2_1.png', 'mtw': 'm_mtw_1.png'},
  'nazim': {'start': 'guide.png', 'climb': 'k_climb_2.png', 'yawn': 'k_yawn_3.png', 'sit': 'k_sit_2.png', 'msl': 'mid_sitlean_2.png', 'lean': 'k_lean_2.png',
            'mls': 'mid_leansettle_1.png', 'settle': 'k_settle_2.png', 'sleep': 'k_sleep_3.png', 'prop': 'k_prop_1.png', 'pmp': 'bd_propmpw_2.png', 'mpw': 'mid_propwake_2.png',
            'wake': 'k_wake_2.png', 'wr': 'bd_wakerise_2.png', 'rise': 'k_rise_3.png'},
}
# passages : (nom, pose de départ, pose d'arrivée, durée s, action). Les grands changements de posture passent par des poses intermédiaires
# (crouch, lean, prop) et des poses à mi-chemin (msl, mss, mls, mpw : tools/gen_sleep_mids.sh) : sans elles, LTX fait le changement d'un coup.
CLIPS = {
  'giant': [   # 15/11 : il lance son gourdin dans le décor (le moteur fait voler le gourdin à la fin de down2), dort mains vides, en sort un neuf de son dos
    ('down1', 'start', 'elan', 0.9, "The giant takes his wooden club off his shoulder and cocks it back high behind his head, twisting his body, ready to throw it."),
    ('down2', 'elan', 'jet', 0.6, "The giant hurls his club far away toward the upper left: his arm whips forward and the club leaves his open hand; his hand is now empty."),
    ('down3', 'jet', 'yawn', 1.2, "The giant lowers his throwing arm, then raises both empty fists high above his head, stretching, opening his mouth in a huge yawn."),
    ('down4', 'yawn', 'yw2', 0.45, "The giant lowers his arms, stretching them out sideways at shoulder height, still yawning."),
    ('down5', 'yw2', 'vide', 0.45, "The giant lets his arms drop along his body, closing his mouth after the yawn."),
    ('down6', 'vide', 'ycr', 0.45, "The giant bends his knees and leans forward, his hands moving to his hips."),
    ('down7', 'ycr', 'crouch', 0.6, "The giant bends his knees deeply, one hand on his knee, his other hand reaching down toward the ground."),
    ('down8', 'crouch', 'sit', 1.0, "The giant sits down heavily on the ground, stretching his legs forward, then rubs one eye with his fist."),
    ('down9', 'sit', 'spv', 0.5, "The giant lowers his fist from his eye to his lap, looking drowsily toward the viewer."),
    ('down10', 'spv', 'piv', 0.6, "The giant draws his knees up and puts one hand behind him on the ground."),
    ('down11', 'piv', 'lean', 1.0, "The giant leans back onto one elbow, stretching his legs out to the other side."),
    ('down12', 'lean', 'settle', 1.0, "The giant lowers himself onto his side, resting his head in his hand, his eyelids drooping."),
    ('down13', 'settle', 'mss', 1.0, "The giant slowly rolls from his side onto his back, his head lowering to the ground."),
    ('down14', 'mss', 'sleep', 1.0, "The giant finishes rolling onto his back, his head resting on the ground, puts one hand on his belly and falls asleep, mouth open."),
    ('loop', 'sleep', 'sleep', 3.0, "The giant sleeps peacefully flat on his back, his head on the ground: only his big chest and belly slowly rise and fall as he breathes deeply, his open mouth snoring. Nothing else moves."),
    ('up1', 'sleep', 'prop', 1.2, "The giant wakes up and lifts his upper body onto his elbows, blinking."),
    ('up2', 'prop', 'pmp', 0.7, "The giant pushes himself up on his hands, his shoulders and chest lifting off the ground."),
    ('up3', 'pmp', 'mpw', 0.7, "The giant sits up halfway, both hands on the ground behind him, his mouth starting to open in a yawn."),
    ('up4', 'mpw', 'mtw', 0.6, "The giant sits up straighter and turns his upper body toward the viewer, his legs still stretched out to the side, yawning."),
    ('up5', 'mtw', 'mwk', 0.5, "The giant swings his legs around in front of him and puts his hands on his knees, mouth wide open."),
    ('up6', 'mwk', 'wake', 0.6, "The giant raises both arms wide above his head with a huge yawn."),
    ('up7', 'wake', 'wkr', 0.8, "The giant lowers his arms and leans forward onto his hands, one knee on the ground."),
    ('up8', 'wkr', 'rise', 0.7, "The giant straightens up on one knee and puts both hands on his raised knee."),
    ('up9', 'rise', 'rsv', 0.7, "The giant pushes on his thighs and rises from his knee, half standing."),
    ('up10', 'rsv', 'vide', 0.7, "The giant stands up straight, his arms hanging at his sides."),
    ('up11', 'vide', 'dos', 0.8, "The giant reaches back over his right shoulder and grabs the handle of a club hidden behind his back."),
    ('up12', 'dos', 'dsc', 0.5, "The giant pulls a big wooden club up from behind his back."),
    ('up13', 'dsc', 'start', 0.6, "The giant swings the club onto his shoulder, with a grumpy frown."),
  ],
  'nazim': [
    ('pit1', 'start', 'climb', 1.2, "The nobleman bends one knee high and leans forward, pressing his hands on his knees as if stepping up onto a high ledge."),
    ('pit2', 'climb', 'start', 1.2, "The nobleman straightens up and stands tall, one hand on his hip, nose in the air, smoothing his robe."),
    ('down1', 'start', 'yawn', 1.4, "The nobleman raises both arms high above his head, stretching, and opens his mouth in a big yawn, eyes closed."),
    ('down2', 'yawn', 'sit', 1.8, "The nobleman lowers his arms and sits down on the ground with exaggerated dignity, crossing his legs, spreading his robe around him, then rubs one eye."),
    ('down3', 'sit', 'msl', 1.0, "The nobleman uncrosses his legs and starts to lean back, his hands moving behind him toward the ground."),
    ('down4', 'msl', 'lean', 1.0, "The nobleman leans back onto both elbows, his legs stretched forward."),
    ('down5', 'lean', 'mls', 1.0, "The nobleman lowers himself from his elbows toward the ground, his shoulders going down, knees bent."),
    ('down6', 'mls', 'settle', 1.0, "The nobleman lies down on his back, his head resting on the ground, his eyelids heavy."),
    ('down7', 'settle', 'sleep', 1.8, "Staying flat on his back the whole time, never sitting up, the nobleman slowly stretches his legs out, folds his hands on his chest like a stone effigy and falls asleep, his mouth open."),
    ('loop', 'sleep', 'sleep', 3.0, "The nobleman sleeps on his back with his hands folded on his chest: only his chest slowly rises and falls as he breathes, his open mouth snoring. Nothing else moves."),
    ('up1', 'sleep', 'prop', 1.2, "The nobleman wakes up and lifts his upper body onto his elbows, blinking."),
    ('up2', 'prop', 'pmp', 0.7, "The nobleman pushes himself up on both hands, his shoulders lifting off the ground, blinking."),
    ('up3', 'pmp', 'mpw', 0.7, "The nobleman sits up halfway, both hands on the ground behind him, blinking."),
    ('up4', 'mpw', 'wake', 1.0, "The nobleman sits up, rubbing his eyes with one hand and raising the other arm, with an outraged sleepy frown."),
    ('up5', 'wake', 'wr', 0.9, "The nobleman lowers his arms, leans forward and puts both hands flat on the ground, kneeling."),
    ('up6', 'wr', 'rise', 0.9, "The nobleman straightens up onto one knee and brushes the dust off his robe with one hand."),
    ('up7', 'rise', 'start', 1.4, "The nobleman stands up straight, puts one hand on his hip and lifts his nose in the air, arrogant."),
  ],
}
# passages déjà calculés et contrôlés (fin imposée exacte), repris tels quels : (perso, départ, arrivée) -> vidéo
REUSE = {
  ('nazim', 'start', 'climb'): 'clips_v5src/00_pit1.mp4', ('nazim', 'climb', 'start'): 'clips_v5src/01_pit2.mp4', ('nazim', 'start', 'yawn'): 'clips_v5src/02_down1.mp4',
  ('nazim', 'yawn', 'sit'): 'clips_v5src/03_down2.mp4', ('nazim', 'settle', 'sleep'): 'clips_v3bad/06_down5.mp4', ('nazim', 'sleep', 'sleep'): 'clips_v5src/07_loop.mp4',
  ('nazim', 'sleep', 'prop'): 'clips_v5src/08_up1.mp4', ('nazim', 'wake', 'rise'): 'clips_v3bad/10_up3.mp4', ('nazim', 'rise', 'start'): 'clips_v3bad/11_up4.mp4',
}


def green(src, dst, col=GREEN, crop=None):
    """image clé (fond magenta) -> même image sur fond uni (vert, ou bleu pour la fermière), réduite à la taille de la vidéo.
    Fond = toute zone d'au moins 5x5 px aux couleurs très proches du fond relevé aux coins, reliée au bord ou enfermée (entre un bras
    et le corps) ; tout le reste est le personnage, opaque (la peau, proche du rose, ne doit jamais devenir transparente)."""
    if os.path.exists(dst): return
    import numpy as np
    im = Image.open(src).convert('RGB'); A = np.asarray(im).astype(int); h, w = A.shape[:2]
    bg = np.array([A[2, 2], A[2, -3], A[-3, 2], A[-3, -3]]).mean(0)
    d = np.abs(A - bg).sum(2)
    nrm = A / np.maximum(A.sum(2, keepdims=True), 1); nb = bg / max(bg.sum(), 1)
    shadow = (np.abs(nrm - nb).sum(2) < 0.07) & (d < 170)          # ombre portée : même teinte que le fond, plus sombre
    B = Image.fromarray(np.where((d < 45) | shadow, 255, 0).astype(np.uint8))
    B = B.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))          # ouverture : les grains isolés restent au personnage
    sub = B.point(lambda v: 0 if v else 255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    # franges roses (fond magenta mêlé aux bords effilochés : cape, crinière, queue) : sur une bande de 4 px au bord du personnage,
    # un pixel proche de la teinte du fond perd cette teinte (ramené au gris sombre de même luminosité) ; partout ailleurs, seulement
    # s'il a presque exactement la teinte du fond (petits trous entre les lambeaux ; la peau, plus orangée, n'est jamais touchée)
    edge = np.asarray(sub.filter(ImageFilter.MinFilter(9))) < 128; hd = np.abs(nrm - nb).sum(2)
    pink = (((hd < 0.25) & edge) | (hd < 0.12)) & (np.asarray(sub) > 0)
    if pink.any():
        A2 = A.copy(); g = (A[..., :3].min(2) * 0.8).astype(int); A2[pink] = np.stack([g, g, g], -1)[pink]
        im = Image.fromarray(A2.astype(np.uint8))
    out = Image.new('RGB', (w, h), col); out.paste(im, (0, 0), sub)
    if crop: out = out.crop(tuple(crop['box'])).resize(tuple(crop['size']), Image.LANCZOS)
    else: out = out.resize(SIZE, Image.LANCZOS)
    out.save(dst)


def subject_box(paths, pad=28):
    """rectangle englobant le personnage dans toutes ses poses clés (coordonnées de la toile guide)"""
    import numpy as np
    bb = None
    for p in paths:
        A = np.asarray(Image.open(p).convert('RGB')).astype(int); bg = np.array([A[2, 2], A[2, -3], A[-3, 2], A[-3, -3]]).mean(0)
        m = Image.fromarray(np.where(np.abs(A - bg).sum(2) > 60, 255, 0).astype(np.uint8)).filter(ImageFilter.MinFilter(5)); b = m.getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    return [bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad]


def crop_for(box, GW=1536, GH=1024, side=768):
    """cadre fixe du personnage pour les vidéos : son rectangle, élargi au format d'une taille vidéo multiple de 64 (plus grand côté 768)"""
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0; k = side / max(w, h)
    vw, vh = max(64, round(w * k / 64) * 64), max(64, round(h * k / 64) * 64)
    if vw / vh > w / h: w = h * vw / vh
    else: h = w * vh / vw
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    x0 = min(max(0, cx - w / 2), GW - w); y0 = min(max(0, cy - h / 2), GH - h)
    return {'box': [round(x0), round(y0), round(x0 + w), round(y0 + h)], 'size': [vw, vh]}


def main():
    a = sys.argv[1:]; only = None
    if '--seul' in a: i = a.index('--seul'); only = set(a[i + 1].split(',')); del a[i:i + 2]
    for ch in a or list(CLIPS):
        d = os.path.join(S, ch); c = os.path.join(d, 'clips'); os.makedirs(c, exist_ok=True)
        cf = os.path.join(c, 'crop.json')
        if os.path.exists(cf): crop = json.load(open(cf))
        else: crop = crop_for(subject_box([os.path.join(d, f) for f in KEYS[ch].values()])); json.dump(crop, open(cf, 'w'))
        for k, f in KEYS[ch].items(): green(os.path.join(d, f), os.path.join(c, f'g_{k}.png'), BG.get(ch, GREEN), crop)
        prev = None
        for i, (n, a, b, dur, act) in enumerate(CLIPS[ch]):
            out = os.path.join(c, f'{i:02d}_{n}.mp4')
            # départ : la dernière image du passage précédent s'il finit sur cette pose (raccord exact), sinon l'image clé ;
            # arrivée imposée souplement (sinon LTX saute d'un coup à la pose finale), sauf sur les poses qui doivent être exactes :
            # endormi (raccord de la boucle de respiration) et debout (retour au sprite de jour)
            st = os.path.join(c, f'g_{a}.png')
            if CHAIN and prev and prev[1] == a and n != 'loop' and a != 'sleep':
                st = os.path.join(c, f'last_{i - 1:02d}.png')
                if not os.path.exists(st): subprocess.run(['ffmpeg', '-v', 'error', '-sseof', '-0.05', '-i', prev[0], '-frames:v', '1', '-update', '1', st], check=True)
            es = 1.0 if (b in ('sleep', 'start') or n == 'loop') else ES
            prev = (out, b)
            src = REUSE.get((ch, a, b))
            if not os.path.exists(out) and src and os.path.exists(os.path.join(d, src)): shutil.copy(os.path.join(d, src), out); print('repris', ch, os.path.basename(out), flush=True)
            if os.path.exists(out) or (only and n not in only): continue
            cmd = ['video-locale', f'{CAM} {act}', '-o', out, '-d', str(dur), '-s', f'{crop["size"][0]}x{crop["size"][1]}', '-i', st, '--seed', str(900 + i), '--', '--no-audio',
                   '--image', os.path.join(c, f'g_{b}.png'), 'last', str(es)]
            r = subprocess.run(cmd, capture_output=True, text=True)
            print(('ok ' if r.returncode == 0 else 'ÉCHEC ') + f'{ch}/{os.path.basename(out)}', '' if r.returncode == 0 else r.stderr[-400:], flush=True)


if __name__ == "__main__": main()
