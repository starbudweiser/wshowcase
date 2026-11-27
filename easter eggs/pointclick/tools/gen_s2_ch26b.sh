#!/bin/zsh
# Saison 2, chapitre 26 : 2e prise du repos du blagueur (1re : mains floues et orangées quand il baisse les bras).
cd "$(dirname "$0")/.." || exit 1; PS="${PS:-work/crossover/persos}"
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
out=work/s2play/ltx/joker_i2.mp4; [ -f "$out" ] || video-locale "$FIX SUBJECT: the sarcastic man in a shirt and tie of the image, both hands raised at shoulder height. ACTION: he stays in place, his hands stay raised in the same position the whole time: breathes, a small shrug of the shoulders, raises his eyebrows, makes a little awkward smile, then comes back to the starting pose. $MAG" -o "$out" -d 3 -s 768x960 -i $PS/c_joker2_1.png -i $PS/c_joker2_1.png --seed 2830 -- --no-audio >/dev/null 2>&1 && echo "ok joker_i2"
