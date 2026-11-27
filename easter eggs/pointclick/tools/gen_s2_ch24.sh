#!/bin/zsh
# Saison 2, chapitre 24 (potion rouge ou potion bleue) : file de génération (toit d'immeuble la nuit avec cabine téléphonique, meule
# fantôme, fioles, chat noir, deux chats, deux poules, cuillère ; boucles LTX de l'homme au manteau, de l'agent et de l'enfant).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no animals, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="The flat rooftop of a tall skyscraper at night in a big city with a cold greenish tint: an old red telephone booth standing on the right, a big round water tank on metal legs and air vents on the left, a low parapet wall at the back with the lights of other skyscrapers beyond under a dark green-tinted sky, a worn old red leather armchair in the middle; puddles on the roof; the concrete roof fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_rooftop_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_matrix.jpg -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_cheese24 $sd "one round wheel of yellow cheese standing on a little cushion, slightly translucent and ghostly, faint green glowing lines running over its rind like computer code."
  i i_cheese24 $sd "one round wheel of yellow cheese with a shiny rind and tiny green glowing symbols engraved on it."
  i p_cat24 $sd "one sleek black cat walking calmly, seen from the side facing right."
  i p_cats24 $sd "two identical sleek black cats walking one behind the other, seen from the side facing right."
  i p_hens24 $sd "two identical plump white hens walking one behind the other, seen from the side facing right."
  i p_vials24 $sd "two small glass potion vials side by side, one filled with glowing red liquid, the other with glowing blue liquid, corked."
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l morph_i "the calm man in a long black leather coat and small dark glasses of the image." "he stays in place, alive and serene: breathes slowly, tilts his head, a knowing half smile, then comes back to the starting pose." 3 $PS/c_morph2_2.png 2601
l morph_t "the calm man in a long black leather coat and small dark glasses of the image." "he talks in place slowly and solemnly: the mouth opens and closes clearly as if speaking a line, one hand opens, then he comes back to the starting pose." 2.5 $PS/c_morph2_2.png 2602
l agentm_i "the stern government agent in a dark suit and sunglasses of the image." "he stays in place, alive and cold: breathes, tilts his head slightly, touches his earpiece, then comes back to the starting pose." 3 $PS/c_agentm.png 2603
l agentm_t "the stern government agent in a dark suit and sunglasses of the image." "he talks in place coldly: the mouth opens and closes clearly as if speaking a line, no other expression, then he comes back to the starting pose." 2.5 $PS/c_agentm.png 2604
l spoonkid_i "the calm bald boy in a pale robe of the image holding a spoon." "he stays in place, alive and serene: he looks at the spoon in his fingers, the spoon slowly bends and straightens again, he smiles calmly, then comes back to the starting pose." 3 $PS/c_spoonkid2.png 2605
echo fini
