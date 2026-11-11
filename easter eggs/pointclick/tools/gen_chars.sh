#!/bin/zsh
# Personnages et accessoires du jeu (FLUX 3 Klein local, gratuit), fond magenta uni pour le détourage.
# Style : cartoon peint à la main, ironique, proportions adultes réalistes (esprit des aventures britanniques des années 90).
cd "$(dirname "$0")/../work" || exit 1
STYLE="full body game character sprite, hand-painted 1990s PC point-and-click adventure game art, sarcastic cartoon style with realistic adult proportions, expressive face, detailed painterly shading, bold dark outlines, saturated warm colors, 256-color VGA look, standing on a plain flat solid magenta background, no shadow, no text"
g(){ n="$1"; d="$2"; s="$3"; z="${4:-1024x1024}"; [ -f "ch_${n}_$s.png" ] || flux-image "$d. $STYLE" -o "ch_${n}_$s.png" -s $z --seed $s >/dev/null 2>&1; echo "ok $n $s"; }
g merchant "A fat sly Nordic market merchant with a huge bushy handlebar mustache, bald head with side tufts, greedy suspicious squint, stained apron over a red shirt, rubbing his hands, seen from the front" 51
g merchant "A fat sly Nordic market merchant with a huge bushy handlebar mustache, bald head with side tufts, greedy suspicious squint, stained apron over a red shirt, rubbing his hands, seen from the front" 52
g guard "A tired sarcastic Nordic town guard in a steel helmet with cheek guards, yellow-brown tabard over chainmail, leaning on a spear, bored deadpan expression, a small arrow sticking out of his knee, seen from the front" 61
g guard "A tired sarcastic Nordic town guard in a steel helmet with cheek guards, yellow-brown tabard over chainmail, leaning on a spear, bored deadpan expression, a small arrow sticking out of his knee, seen from the front" 62
g hen "A plump white chicken pecking at the ground, side view" 71 1024x1024
g bucket "A single old wooden bucket with iron bands and a rope handle, side view" 72
g honey "A single golden sweet roll pastry spiral with honey glaze dripping, side view" 73
echo done
