#!/usr/bin/env python3 -I
"""Saison 2 : zone de décor animée (vidéo LTX en boucle d'une bande du décor, ex. mer + galion du chapitre 11) -> fichiers du jeu.
  s2_video.py <vidéo.mp4> <id> <largeur_logique> <hauteur_logique> <décor_90.png> [x_logique y_logique]
- HD : assets/pointclick/s2/v_<id>.mp4 (H.264, 2 px par unité logique, dernière image retirée : boucle sans à-coup) ;
- années 90 : assets/pointclick/s2/90/anim/<id>/<i>.png, 24 images à 480 × 270, palette du décor converti (aucune couleur étrangère)."""
import sys, os, glob, subprocess, tempfile
from PIL import Image
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); S2 = os.path.join(R, 'assets', 'pointclick', 's2')
vid, vid_id, lw, lh, lo = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
x0, y0 = (float(sys.argv[6]), float(sys.argv[7])) if len(sys.argv) > 7 else (0.0, 0.0)
n = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', vid], capture_output=True, text=True).stdout.strip())
W2, H2 = round(lw * 2 / 2) * 2, round(lh * 2 / 2) * 2
out = os.path.join(S2, f'v_{vid_id}.mp4')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-frames:v', str(n - 1), '-vf', f'scale={W2}:{H2}:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', '-an', out], check=True)
print(out, os.path.getsize(out) // 1024, 'Ko', n - 1, 'images')
pal = Image.open(lo); assert pal.mode == 'P'
tmp = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-frames:v', str(n - 1), os.path.join(tmp, '%04d.png')], check=True)
fs = sorted(glob.glob(os.path.join(tmp, '*.png'))); od = os.path.join(S2, '90', 'anim', vid_id); os.makedirs(od, exist_ok=True)
for p in glob.glob(os.path.join(od, '*.png')): os.remove(p)
from PIL import ImageEnhance
for j in range(24):
    im = Image.open(fs[round(j * len(fs) / 24) % len(fs)]).convert('RGB').resize((round(lw), round(lh)), Image.LANCZOS)
    im = ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.12)).enhance(1.05)
    im.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG).save(os.path.join(od, f'{j}.png'), optimize=True)
print('90', od, 24)
