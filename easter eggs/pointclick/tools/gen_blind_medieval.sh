#!/bin/zsh
# 27/11/2026 : quatre aveugles de la saison 1 avaient des habits modernes (chemise à col boutonnée, casque militaire en guise de casserole).
# Nouvelles poses clés en tenue nordique médiévale, calculées en entier (aucune retouche) : aveugle puis version éclairée (danse).
# Sortie work/bm/ ; planche à valider avant les poses 2, les cycles LTX et le coucher de nuit.
cd "$(dirname "$0")/../work" || exit 1; mkdir -p bm
SP="full body game sprite, hand-painted 1990s PC point-and-click adventure game art, sarcastic cartoon style with realistic adult proportions, detailed painterly shading, bold dark outlines, saturated warm colors, plain flat solid magenta background, no shadow, no text"
MED="Medieval Nordic peasant clothing from a fantasy Skyrim village: a rough undyed wool tunic without collar and without buttons, belted with a plain leather belt, loose wool trousers with cloth leg wrappings, simple leather turnshoes. Nothing modern: no shirt collar, no buttons, no pockets, no jeans, no jacket, no metal helmet."
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" >/dev/null 2>&1; echo "ok $out"; }
LIT="The same man, same medieval clothes, same art style and colors, same magenta background, but with nothing covering his face at all: his whole face is visible with wide open amazed delighted eyes and a huge joyful open-mouth smile, both arms raised up in celebration, dancing."
for s in 1 2; do
  g bm/blind_pot_$s.png "A stocky middle-aged Nordic villager. $MED A big old black cast-iron cooking pot with a thin iron bail handle, clearly a kitchen cauldron, is pulled down over his whole face covering his eyes. Both arms stretched out in front groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed $((2210+s))
  g bm/blind_cabbage_$s.png "A thin young Nordic farm boy. $MED A huge green cabbage is pulled down over his whole head covering his eyes. Both arms stretched out in front groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed $((2220+s))
  g bm/blind_basket_$s.png "A chubby Nordic villager. $MED A big woven wicker laundry basket turned upside down is pulled down over his whole head covering his eyes. Both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed $((2230+s))
  g bm/blind_partyhat_$s.png "A cheerful Nordic village drummer carrying a big round hand drum made of wood and hide on a strap. $MED A giant striped conical party hat made of painted cloth is pulled down over his whole face covering his eyes. Both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed $((2240+s))
done
[ -n "$LITS" ] && for k in pot cabbage basket partyhat; do g bm/lit_$k.png "$LIT" -i bm/blind_$k.png -s 1024x1024 --seed 2299; done
echo done
