#!/bin/zsh
# Saison 2, chapitre 13 : paysage changé en fromage par le Wabbajack (image entière recalculée d'après le décor du pied de la tour),
# icônes du Cri et des septims.
cd "$(dirname "$0")/.." || exit 1
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, empty scene with no people, no animals, no logo, no watermark, no frame, no text, no letters"
P="Exactly the same picture as the reference, same composition, same places and same shapes, but absolutely everything is made of yellow cheese with round holes: the cubic trees are blocks of cheese, the grass hills are cheese, the stone tower and its walled doorway are built of cheese blocks, the round well is cheese, the waterfall is flowing melted cheese, the clouds are cheese and the square sun is a glowing cube of cheese. $ST"
for sd in 1 2; do out="work/s2play/d_mine_cheese_$sd.png"; [ -f "$out" ] || flux-image "$P" -i work/s2play/d_mine_a_1.png -s 1280x720 --seed $sd -o "$out"; done
tools/gen_s2_items.sh i_shout i_shout:2 i_septims
echo fini
