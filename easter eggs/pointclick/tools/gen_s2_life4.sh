#!/bin/zsh
# Saison 2 : reprise de la parole du héros en trois-quarts droit (1re prise : un grand sourire revenait au milieu de la boucle).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
HS="${HS:-work/crossover/hero_s2}"
P="CAMERA: static locked-off full shot, the camera never moves, no zoom. SUBJECT: the character of the image. ACTION: he talks in place with a dry sarcastic deadpan delivery: the mouth opens and closes clearly as if speaking a line, the eyebrows move slightly, one hand makes a small dismissive gesture, then comes back to the starting pose. He never smiles and never grins at any moment: a bored, blasé, unimpressed face for the whole shot, lips never stretched into a smile. He keeps exactly the same viewing angle, the same costume and everything he carries. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
for sd in 2 3; do out="work/s2play/ltx/hero_tqr$sd.mp4"; [ -f "$out" ] || video-locale "$P" -o "$out" -d 2.5 -s 768x960 -i $HS/sel_34_right.png -i $HS/sel_34_right.png --seed $((440+sd)) -- --no-audio >/dev/null 2>&1 && echo "ok hero_tqr$sd"; done
