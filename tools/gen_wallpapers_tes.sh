#!/bin/zsh
# Fonds d'écran dans le lore de The Elder Scrolls (bureau Skyrim Mac Toolkit), générés localement avec FLUX 3 Klein.
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/wallpapers"; TMP="${TMPDIR:-/tmp}/wp_gen_tes"; mkdir -p "$TMP" "$OUT/thumbs"
gen(){ id="$1"; prompt="$2"; [ -f "$OUT/$id.jpg" ] && return
  flux-image "$prompt" -o "$TMP/$id.png" -s 1792x1008 --seed 11 && sips -s format jpeg -s formatOptions 82 "$TMP/$id.png" --out "$OUT/$id.jpg" >/dev/null && sips -Z 360 -s formatOptions 70 "$OUT/$id.jpg" --out "$OUT/thumbs/$id.jpg" >/dev/null && echo "ok $id"; }
S="no text, no characters, epic Nordic fantasy matte painting, cinematic lighting, high detail, 16:9 desktop wallpaper"
gen tes_whiterun   "Whiterun plains at golden dawn with the wooden palace Dragonsreach on its hill, rolling tundra, warm light, $S"
gen tes_hrothgar   "A long stone staircase climbing a snowy mountain to a distant monastery in the clouds, misty blue light, $S"
gen tes_rift       "Autumn forest of golden birch trees with a wooden fishing town by a lake at dusk, falling leaves, $S"
gen tes_winterhold "Ruined stone college tower on an icy cliff above a frozen sea under green aurora, night, $S"
gen tes_solitude   "A huge natural stone arch bridge with a white imperial palace on a sea cliff at sunset, $S"
gen tes_markarth   "A city of ancient bronze-colored carved stone built into a rock cliff with a waterfall, evening mist, $S"
gen tes_dwemer     "Vast ancient steampunk bronze ruins with giant gears, glowing amber lights and steam, dark atmosphere, $S"
gen tes_moons      "Two huge moons, one pale white and one small reddish, rising over a snowy tundra with a lone watchtower, night, $S"
gen tes_oblivion   "A burning red portal gate with spiked black towers on a dark plain, glowing lava light and smoke, ominous, $S"
gen tes_sovngarde  "A misty heavenly hall of heroes with a long whalebone bridge and golden light breaking through clouds, $S"
echo done
