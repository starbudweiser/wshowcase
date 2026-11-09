#!/bin/zsh
# Génère les fonds d'écran du site avec FLUX 3 Klein (local, gratuit). Usage : tools/gen_wallpapers.sh
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/wallpapers"; TMP="${TMPDIR:-/tmp}/wp_gen"; mkdir -p "$TMP" "$OUT"
gen(){ id="$1"; prompt="$2"; [ -f "$OUT/$id.jpg" ] && return
  flux-image "$prompt" -o "$TMP/$id.png" -s 1792x1008 --seed 7 && sips -s format jpeg -s formatOptions 82 "$TMP/$id.png" --out "$OUT/$id.jpg" >/dev/null && echo "ok $id"; }
S="no text, no people, ultra smooth, minimal, macOS desktop wallpaper, 16:9, high detail, soft depth"
gen aurore   "Silky flowing translucent waves in soft pastel blue, lilac and peach, gentle glow, abstract fabric folds, bright airy light, $S"
gen dune     "Minimal sunlit desert dunes at sunrise, smooth sand curves, warm cream and apricot tones, long soft shadows, $S"
gen brume    "Layered misty mountain ridges fading into pale blue haze, soft pastel morning light, serene, $S"
gen ocean    "Aerial view of calm turquoise ocean with gentle white foam lines on pale sand, bright, clean, $S"
gen prairie  "Rolling green hills at golden hour with soft warm light and tiny wildflowers, gentle fog in valleys, $S"
gen nuit     "Deep navy and violet smooth nebula gradient with a few faint stars, elegant, dark, $S"
gen nordique "Aurora borealis green and teal ribbons over snowy mountain peaks and a still lake at night, dark, $S"
gen braises  "Glowing ember orange and crimson silky ribbons flowing across a pure black background, dark, elegant, $S"
gen verre    "Dark glossy abstract glass shapes with teal and violet reflections, soft studio light, dark background, $S"
gen dragon   "A distant dragon silhouette flying over dark snowy mountains at dawn, cold blue and amber sky, epic Nordic fantasy, cinematic, dark, $S"
echo done
