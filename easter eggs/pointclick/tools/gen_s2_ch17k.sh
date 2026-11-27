#!/bin/zsh
# Saison 2, chapitre 17 (version française, la Table ronde) : file de génération (salle de la table ronde, clairière de la grotte
# du Graal, banquet, dés, épée dans le rocher, Graal-seau, fromage breton, jambon, boucles LTX du roi et des deux chevaliers).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no logo, no coat of arms, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
H="The same rustic medieval castle hall as in the reference picture, seen wider and emptier: in the middle of the room a big round wooden table with simple wooden chairs around it, the table top is bare and clean; rough stone walls with wooden beams, burning torches on the walls, red and ochre cloth banners without any emblem, a big stone fireplace on the right, a wooden door on the left, straw on the floor; the flagstone floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no food on the table. $ST"
for sd in 1 2 3; do out="work/s2play/d_round_$sd.png"; [ -f "$out" ] || flux-image "$H" -i crossover/img/r_kaamelott.jpg -s 1280x720 --seed $sd -o "$out"; done
C="A sunny green forest clearing in medieval Brittany: on the right, a mossy rocky hillside with a big dark cave entrance, faint golden light glowing deep inside the cave; on the left, old oak trees and ferns; in the middle of the clearing, a big flat grey boulder; a dirt path crosses the clearing; blue sky with small white clouds; the grass and dirt ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_cave17_$sd.png"; [ -f "$out" ] || flux-image "$C" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_banquet17 $sd "one big medieval banquet heap on a large round silver platter: a whole roast boar with an apple in its mouth, hams, roast chicken legs, round loaves of bread, sausages, grapes and a jug of wine, seen slightly from above."
  i p_dice17 $sd "two old wooden six-sided dice with black dots, side by side."
  i p_dicecheese17 $sd "two small round wheels of yellow cheese side by side, each one with black dots painted on its rind like dice."
  i p_sword17 $sd "one old sword stuck point down into a big grey rock, its golden cross-guard and leather grip shining."
  i p_spoon17 $sd "one big wooden spoon stuck upright into a huge round wheel of golden cheese."
  i p_grail17 $sd "one old wooden bucket with iron bands glowing with a holy golden light, golden rays of light around it, as if it were the holy grail."
  i i_cheese17k $sd "one round soft cheese with a washed orange rind wrapped in a wooden ribbon band, a sprig of heather tied on top, from medieval Brittany."
  i p_ham17 $sd "one big slice of pink ham with a white fat border, standing upright, with a tiny round chubby human face on it with a black beard, looking at itself greedily and licking its lips."
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same face and the same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l arthur_i "the tired medieval king of the image." "he stays in place, alive and weary: breathes, sighs, rubs his forehead with one hand, shakes his head slightly, then comes back to the starting pose." 3 $PS/c_king2_2.png 1801
l arthur_t "the tired medieval king of the image." "he talks in place with exasperation: the mouth opens and closes clearly as if speaking a line, one hand gestures, the eyebrows rise, then he comes back to the starting pose." 2.5 $PS/c_king2_2.png 1802
l perceval_i "the slow medieval knight of the image." "he stays in place, alive and lost in thought: breathes, blinks slowly, looks up at nothing with a vague smile, scratches his head, then comes back to the starting pose." 3 $PS/c_knight_dim2_2.png 1803
l perceval_t "the slow medieval knight of the image." "he talks in place slowly: the mouth opens and closes clearly as if speaking a line, a vague happy look, then he comes back to the starting pose." 2.5 $PS/c_knight_dim2_2.png 1804
l karadoc_i "the fat medieval knight of the image." "he stays in place, alive and greedy: breathes, looks at the food in his hand, takes a bite and chews with his mouth full, then comes back to the starting pose." 3 $PS/c_knight_fat4_2.png 1805
l karadoc_t "the fat medieval knight of the image." "he talks in place with his mouth half full: the mouth opens and closes clearly as if speaking a line, he waves the food in his hand, then he comes back to the starting pose." 2.5 $PS/c_knight_fat4_2.png 1806
echo fini
