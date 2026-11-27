#!/bin/zsh
# Saison 2 : reprise du repos du héros de face (1re prise : un léger sourire satisfait revenait, yeux mi-clos).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
HS="${HS:-work/crossover/hero_s2}"
P="CAMERA: static locked-off full shot, the camera never moves, no zoom. SUBJECT: the character of the image. ACTION: he stays in place, alive: breathes calmly, blinks, glances slowly to the left then to the right with a bored look, small natural movements of the shoulders and hands, a slight shift of weight, then comes back to the starting pose. He never smiles and never smirks at any moment: a bored, blasé, unimpressed face for the whole shot, mouth closed and relaxed, eyes open. He keeps exactly the same viewing angle, the same costume and everything he carries. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
for sd in 2 3; do out="work/s2play/ltx/hero_if$sd.mp4"; [ -f "$out" ] || video-locale "$P" -o "$out" -d 3 -s 768x960 -i $HS/sel_front.png -i $HS/sel_front.png --seed $((450+sd)) -- --no-audio >/dev/null 2>&1 && echo "ok hero_if$sd"; done
