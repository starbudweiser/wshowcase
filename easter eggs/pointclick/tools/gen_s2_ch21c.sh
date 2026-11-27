#!/bin/zsh
# Saison 2, chapitre 21 : 2e passe du frigo à l'envers (1re : on aurait dit un four) et de la boîte de gaufres vide (1re : pleine).
cd "$(dirname "$0")/.." || exit 1
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
for sd in 3 4; do
  out="work/s2play/items/p_fridge21_$sd.png"; [ -f "$out" ] || flux-image "one tall cream-colored 1980s two-door refrigerator turned completely upside down: it stands on its top, its little feet and its base in the air at the top, the freezer door now at the bottom, the chrome handles upside down, seen in three-quarter view. $IT" -s 1024x1280 --seed $sd -o "$out"
  out="work/s2play/items/p_waffles21_$sd.png"; [ -f "$out" ] || flux-image "one empty open cardboard box of frozen waffles, completely empty inside, only a few crumbs, lying on a little wooden side table. $IT" -s 1024x768 --seed $sd -o "$out"
done
echo fini
