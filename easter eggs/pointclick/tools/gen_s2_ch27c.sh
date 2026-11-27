#!/bin/zsh
# Saison 2, chapitre 27 : 2es prises de la marche du héros dessiné (1res : jambes floues et franges roses de profil ; de dos, il pivotait).
cd "$(dirname "$0")/.." || exit 1; T=work/s2play/toon
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same cartoon drawing style with flat colors and thick black outlines, crisp clean lines on every frame, no motion blur, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l toon_wr2 "the cartoon Viking of the image, seen in strict side profile facing right." "he walks slowly in place like on a treadmill, two calm and clear steps, a simple cartoon walk cycle: one leg forward then the other, arms swing gently, the body stays exactly at the same spot and stays in profile, then he is back in the starting pose." 3 $T/sel_toon_pr.png 2991
l toon_wb2 "the cartoon Viking of the image, seen from behind with his round shield on his back." "he walks slowly in place away from us like on a treadmill, two calm and clear steps: one leg then the other, only the legs and boots move, the shield and the body never turn and always keep facing away from us, then he is back in the starting pose." 3 $T/sel_toon_b.png 2992
echo fini
