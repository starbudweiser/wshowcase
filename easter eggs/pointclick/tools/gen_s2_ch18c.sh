#!/bin/zsh
# Saison 2, chapitre 18 : boucles du dragon blanc, 2es prises en plan large (1res : gros plan sur la tête, cadrage différent du sprite).
cd "$(dirname "$0")/.." || exit 1; PS="${PS:-work/crossover/persos}"
FIX="CAMERA: static locked-off wide full shot from far away, the whole long body of the dragon is visible inside the frame with a wide magenta margin all around, the camera never moves, never zooms in."
MAG="It keeps exactly the same viewing angle, the same framing, the same size in the frame and the same look for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 960x768 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l luckdragon_i2 "the white furry dragon with a dog-like head of the image, its long body coiled." "it stays in place, alive and happy: its coiled furry body breathes gently, it blinks, smiles, its ears twitch, then it comes back to the starting pose." 3 $PS/c_luckdragon.png 2013
l luckdragon_t2 "the white furry dragon with a dog-like head of the image, its long body coiled." "it talks in place with a warm happy laugh: the mouth opens and closes clearly as if speaking a line, the ears move, then it comes back to the starting pose." 2.5 $PS/c_luckdragon.png 2014
echo fini
