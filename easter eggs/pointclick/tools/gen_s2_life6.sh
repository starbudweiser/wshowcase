#!/bin/zsh
# Saison 2 : reprises des boucles du lapin (1res prises : son visage dérivait vers un lapin mignon au milieu de la boucle).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
PS="${PS:-work/crossover/persos}"; K=$PS/c_rabbit2_1.png
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
ID="He keeps exactly the same face for the whole shot: the same huge manic grin full of teeth, the same wide crazy eyes, the same long pink ears, the same body; he never turns into another rabbit. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: the white rabbit of the image. ACTION: $2 $ID" -o "$out" -d $3 -s 768x960 -i $K -i $K --seed $4 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
for sd in 2 3; do
  l max_i$sd "he fidgets in place with nervous energy: small quick bounces on the spot, his arms waving a little, his ears twitching, looking left and right with his manic grin, then comes back to the starting pose." 3 $((760+sd))
  l max_t$sd "he talks in place, hyper excited: the toothy mouth opens and closes clearly as if speaking a line, his ears twitching, small bounces, then comes back to the starting pose." 2.5 $((770+sd))
done
