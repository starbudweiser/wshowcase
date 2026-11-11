#!/bin/zsh
# Objets du jeu (FLUX 3 Klein local), fond magenta uni.
cd "$(dirname "$0")/../work" || exit 1
S="hand-painted 1990s adventure game inventory item icon, bold dark outlines, saturated warm colors, detailed painterly shading, centered on a plain flat solid magenta background, no shadow, no text, no characters, no faces"
flux-image "A single old wooden bucket with iron bands, seen slightly from above, empty. $S" -o item_bucket.png -s 1024x1024 --seed 91 >/dev/null 2>&1; echo ok bucket
flux-image "A single golden sweet roll pastry, a spiral bun glazed with dripping honey. $S" -o item_honey.png -s 1024x1024 --seed 92 >/dev/null 2>&1; echo ok honey
