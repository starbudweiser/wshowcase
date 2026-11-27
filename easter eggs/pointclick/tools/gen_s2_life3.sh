#!/bin/zsh
# Saison 2 : boucles LTX du capitaine fantôme depuis son sprite de jeu sans halo (work/s2play/persos/lechuck_clean_1.png).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle and the same costume for the whole shot, no glow, no smoke, no mist around him. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
K=work/s2play/persos/lechuck_clean_1.png
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: the ghost pirate captain of the image. ACTION: $2 $MAG" -o "$out" -d $3 -s 768x960 -i $K -i $K --seed $4 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l lechuck2_i "he floats menacingly in place, breathing heavily, his raised clawed hand slowly flexing its fingers, his coat tails and beard drifting gently as if underwater, a slight sway of the body, then comes back to the starting pose." 3 451
l lechuck2_t "he talks menacingly in place: the mouth opens wide and closes clearly as if roaring a line, the eyebrows frown, his raised clawed hand shaking with rage, then comes back to the starting pose." 2.5 452
echo fini
