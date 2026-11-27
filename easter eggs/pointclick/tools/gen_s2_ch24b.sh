#!/bin/zsh
# Saison 2, chapitre 24 : agent en pied (la planche s'arrête aux genoux), puis ses boucles LTX d'après la nouvelle image.
cd "$(dirname "$0")/.." || exit 1; PS="${PS:-work/crossover/persos}"; P=work/s2play/persos
for sd in 1 2; do out="$P/agentm24_$sd.png"; [ -f "$out" ] || flux-image "Exactly the same stern government agent as in the reference picture, same face, same slicked black hair, same black sunglasses and curly earpiece wire, same dark suit, white shirt and thin black tie, one hand touching his earpiece, standing straight; the whole figure from the top of the head down to his black shoes fits in the picture with empty magenta space above and below. Full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, bold dark outlines, plain flat solid magenta background, no shadow, no ground, no text." -i $PS/c_agentm.png -s 1024x1280 --seed $(( 2610 + sd )) -o "$out"; done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l agentm_i2 "the stern government agent in a dark suit and sunglasses of the image, full body." "he stays in place, alive and cold: breathes, tilts his head slightly, touches his earpiece, then comes back to the starting pose." 3 $P/agentm24_1.png 2613
l agentm_t2 "the stern government agent in a dark suit and sunglasses of the image, full body." "he talks in place coldly: the mouth opens and closes clearly as if speaking a line, no other expression, then he comes back to the starting pose." 2.5 $P/agentm24_1.png 2614
echo fini
