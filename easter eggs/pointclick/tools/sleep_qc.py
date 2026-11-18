#!/usr/bin/env python3 -I
"""Contrôle des vidéos de passage : planche de toutes les images (une ligne par vidéo), cadrées sur le personnage.
Usage : sleep_qc.py dossier_des_videos sortie.jpg [images_par_seconde=12]"""
import sys, os, glob, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; fps = float(sys.argv[3]) if len(sys.argv) > 3 else 12
rows = []
for c in sorted(glob.glob(os.path.join(d, '*.mp4'))):
    t = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', c, '-vf', f'fps={fps}', os.path.join(t, 'f%03d.png')], check=True)
    rows.append((os.path.basename(c), [Image.open(f).convert('RGB') for f in sorted(glob.glob(os.path.join(t, 'f*.png')))]))
bb = None
for _, fs in rows:
    for im in fs:
        a = np.asarray(im).astype(int); m = np.abs(a - a[2, 2]).sum(2) > 80; ys, xs = np.where(m)
        if len(xs): b = (xs.min(), ys.min(), xs.max(), ys.max()); bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
bb = (max(0, bb[0] - 6), max(0, bb[1] - 6), bb[2] + 6, bb[3] + 6); th = 150; tw = round(th * (bb[2] - bb[0]) / (bb[3] - bb[1]))
nc = max(len(fs) for _, fs in rows); sh = Image.new('RGB', (tw * nc, (th + 14) * len(rows)), (20, 20, 20)); dr = ImageDraw.Draw(sh)
for r, (n, fs) in enumerate(rows):
    dr.text((4, r * (th + 14)), n, fill=(255, 220, 120))
    for i, im in enumerate(fs): sh.paste(im.crop(bb).resize((tw, th)), (i * tw, r * (th + 14) + 14))
sh.save(out, quality=84); print(out, sh.size)
