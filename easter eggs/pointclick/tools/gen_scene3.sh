#!/bin/zsh
# Images de la scène 3 « La prairie des géants » (FLUX 3 Klein local, gratuit). Relançable : saute ce qui existe.
cd "$(dirname "$0")/../work" || exit 1
SP="full body game sprite, hand-painted 1990s PC point-and-click adventure game art, sarcastic cartoon style with realistic adult proportions, detailed painterly shading, bold dark outlines, saturated warm colors, plain flat solid magenta background, no shadow, no text"
SC="hand-painted cartoon 1990s PC adventure game background, VGA 256-color look with dithering, bold dark outlines, warm saturated colors, golden hour, humorous storybook fantasy, no text, no people, no animals"
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" >/dev/null 2>&1; echo "ok $out"; }
P3="Wide grassy tundra meadow in a Nordic fantasy valley in the style of Skyrim: a giants' camp in the foreground with a smoking campfire, huge mammoth skull and bones, a big flat scorched stone launch circle with a crude wooden ramp pointing at the sky, tall wooden tripod frames, in the far distance on the right a walled city on a hill with a grand wooden palace on top (Whiterun-like), a dirt road winding to it, snowy mountains, big golden clouds. $SC"
for s in 141 142 143; do g "meadow_$s.png" "$P3" -s 1280x720 --seed $s; done
g ch_giant.png "A towering Nordic giant, bald, muscular, bare-chested with tribal tattoos and a fur loincloth, holding a huge wooden club resting on his shoulder, bored sleepy grumpy expression, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 151
g var_giant_swing.png "The same giant from the image, same style and colors, same magenta background, now swinging the huge club upwards over his head with both hands, angry shouting, dynamic pose." -i ch_giant.png -s 1024x1024 --seed 152
g ch_nazim.png "An arrogant snobbish middle-aged nobleman in rich blue and gold embroidered fancy robes, long dark hair, thin mustache, nose in the air, one hand on his hip, sneering condescending expression, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 161
echo done
