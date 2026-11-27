#!/bin/zsh
# Saison 2, chapitre 26 (celui qui cherchait la meule) : file de génération (café au grand canapé, cage d'escalier, appartement au
# frigo ; canapé orange, banc de taverne, canapé coincé, grande tasse, meule du sandwich ; paléontologue au dragon, chanteuse au luth ;
# boucles LTX de l'acteur, du blagueur, du paléontologue et de la chanteuse).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no logo, no watermark, no frame, no text, no letters, no writing, no numbers"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="A cosy 1990s New York coffee house, warm and colorful: exposed red brick walls, a big framed painting of a gorilla on a bright yellow background on the left wall, green plants, hanging lamps, a wooden counter with a big coffee machine and shelves of cups on the right, a large window with a door on the far right, a blank wooden sign board hanging high on the back wall with nothing written on it; in the middle of the room an open empty floor with a red oriental rug and a low wooden coffee table, no sofa; wooden floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_cafe26_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_friends_fr.jpg -s 1280x720 --seed $sd -o "$out"; done
B="The narrow stairwell of an old New York apartment building seen from the ground floor hallway: a wooden staircase with a banister climbs straight up away from us in the middle of the picture toward an upper landing at the back, worn patterned wallpaper, a hanging light bulb, mailboxes without any writing on the left wall, a radiator on the right; the ground floor hallway with old tiles fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no furniture on the stairs. $ST"
for sd in 1 2 3; do out="work/s2play/d_stairs26_$sd.png"; [ -f "$out" ] || flux-image "$B" -s 1280x720 --seed $sd -o "$out"; done
C="A colorful 1990s New York apartment: purple walls, white wooden window frames with a view of brick buildings, an open kitchen area on the right with a big old white fridge with one small blank paper note stuck on its door, a kitchen counter, a round table with mismatched chairs in the middle, an apartment door on the left, a plant, framed posters without any writing; wooden floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no sofa. $ST"
for sd in 1 2 3; do out="work/s2play/d_flat26_$sd.png"; [ -f "$out" ] || flux-image "$C" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_sofa26 $sd "one big comfortable orange velvet three-seat sofa with plump cushions, seen from the front."
  i p_bench26 $sd "one rough old wooden tavern bench from a medieval Nordic inn, crude planks, a few splinters, seen from the front."
  i p_couch26 $sd "one big brown leather three-seat couch tilted diagonally at a steep angle, as if being carried up a staircase, seen from the side."
  i p_mug26 $sd "one huge oversized white coffee mug full of steaming coffee, as big as a bucket."
  i i_cheese26 $sd "one small round wheel of yellow cheese with a few bread crumbs and a lettuce leaf stuck on it."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f nervpaleo_dragon26 $sd "Exactly the same nervous man as in the reference picture, same face, same dark sweater and white collar, same trousers and shoes, but instead of the plastic dinosaur he holds a tiny live red dragon that bites his finger, he looks thrilled and hurt at the same time." $PS/c_nervpaleo2_1.png 2800
  f singer_lute26 $sd "Exactly the same young woman as in the reference picture, same face, same long blond hair, same long brown dress with golden leaves and same boots, same pose, but instead of the guitar she holds an old medieval wooden lute." $PS/c_singer2_1.png 2810
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l charmer_i "the charming young actor in a striped shirt of the image holding a sandwich." "he stays in place, alive and smug: breathes, raises one eyebrow, looks at his sandwich lovingly, then comes back to the starting pose." 3 $PS/c_charmer2_2.png 2821
l charmer_t "the charming young actor in a striped shirt of the image holding a sandwich." "he talks in place with a confident smile: the mouth opens and closes clearly as if speaking a line, a little nod, then he comes back to the starting pose." 2.5 $PS/c_charmer2_2.png 2822
l joker_i "the sarcastic man in a shirt and tie of the image." "he stays in place, alive and awkward: breathes, shrugs, makes a little awkward face, then comes back to the starting pose." 3 $PS/c_joker2_1.png 2823
l joker_t "the sarcastic man in a shirt and tie of the image." "he talks in place sarcastically: the mouth opens and closes clearly as if speaking a line, both hands gesture, then he comes back to the starting pose." 2.5 $PS/c_joker2_1.png 2824
l nervpaleo_i "the nervous man in a dark sweater of the image holding a small plastic dinosaur." "he stays in place, alive and anxious: breathes, fidgets, glances at his plastic dinosaur, then comes back to the starting pose." 3 $PS/c_nervpaleo2_1.png 2825
l nervpaleo_t "the nervous man in a dark sweater of the image holding a small plastic dinosaur." "he talks in place nervously: the mouth opens and closes clearly as if speaking a line, eyebrows raised, then he comes back to the starting pose." 2.5 $PS/c_nervpaleo2_1.png 2826
l singer_i "the dreamy young woman with long blond hair of the image holding a guitar." "she stays in place, alive and dreamy: breathes, sways gently, smiles at nothing, then comes back to the starting pose." 3 $PS/c_singer2_1.png 2827
l singer_t "the dreamy young woman with long blond hair of the image holding a guitar." "she talks in place cheerfully: the mouth opens and closes clearly as if speaking a line, then she comes back to the starting pose." 2.5 $PS/c_singer2_1.png 2828
echo fini
