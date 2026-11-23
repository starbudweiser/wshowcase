#!/bin/zsh
# Planches de personnages de la saison 2 (crossover) : un personnage entier par image, fond magenta (détourage ensuite).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P R S
P[c_sheo]="Exactly the same man as in the reference picture, same face, same wild grey hair, same pointed grey goatee, same wild eyes and grin, same extravagant coat split in two halves, deep purple and crimson red, with gold trim. He stands holding a big wheel of yellow cheese under one arm, the other hand raised theatrically. $SP"; R[c_sheo]=p_sheo_2.png
P[c_wabbajack]="A long twisted gnarled wooden magic staff topped with a grinning jester mask, half purple and half red, with little gold bells, purple and orange sparks around the mask, standing upright. $IT"; R[c_wabbajack]=r_wabbajack_1.png
P[c_pirate]="A lanky sneering pirate swordsman with a very long pointed nose, a feathered tricorn hat, a long brown coat, striped trousers and boots, holding a cutlass, ready for a duel of insults. $SP"
P[c_parrot]="A scruffy green and red parrot perched on a small wooden perch stand, beak wide open as if talking, sarcastic half-closed eyes. $SP"
P[c_dog]="A tall anthropomorphic brown dog detective walking upright, wearing a grey suit, a white shirt, a dark tie and a grey fedora hat, calm deadpan expression, hands in his pockets. $SP"
P[c_rabbit]="A small hyperactive white rabbit-like creature standing on its hind legs, long ears, a tiny pink nose, a huge toothy maniac grin, arms spread wide with excitement. $SP"
P[c_villager]="A blocky villager whose body, head and arms are made of square cube shapes, with a very big long nose, one bushy unibrow, a plain brown robe, arms folded together across his belly, painted texture. $SP"
P[c_creeper]="A tall green box-shaped creature built from cubes, standing on four stubby square legs, mottled green painted texture, a small grumpy dark face. $SP"
P[c_archeo]="A rugged weathered middle-aged archaeologist adventurer with a short grey beard, a brown leather jacket, a khaki shirt, a battered brown fedora, a coiled bullwhip at his belt and a canvas satchel. $SP"
P[c_doc]="A wild-haired old scientist with a shock of white hair, wide excited eyes, a white lab coat over a dark shirt, protective goggles pushed up on his forehead, a strange gadget clipped to his belt, both arms raised in excitement. $SP"
P[c_potions]="A gaunt sour potions professor with long greasy black hair down to his shoulders, a pale sneering face, a long black buttoned robe with a high collar, arms folded. $SP"
P[c_hat]="An old patched brown pointed wizard hat with a crumpled wide brim standing on its own, its folds forming two squinting eyes and a frowning mouth, offended expression. $SP"
P[c_king]="A weary medieval king with a short dark beard, a simple gold crown, a red and gold tunic and a long cloak, rubbing his temple with one hand in exasperation. $SP"
P[c_knight_dim]="A lanky dim-witted young medieval knight with a bowl haircut, chainmail and a blue surcoat, a vacant happy stare, mouth half open, a sword hanging at his belt. $SP"
P[c_knight_fat]="A stout jovial medieval knight with a bushy beard, chainmail and a green surcoat, chewing a big roasted chicken leg held in one hand. $SP"
P[c_ni]="A very tall knight in long dark robes wearing an enormous helmet topped with large deer antlers, a long beard visible under the helmet, pointing imperiously with one arm. $SP"
P[c_coconut]="A dignified middle-aged knight king in silver plate armor with a red tunic and a thin crown, walking with a bouncing step as if riding an invisible horse, banging two coconut halves together in his hands. $SP"
P[c_blackknight]="A huge knight in full black plate armor with a black shield and a big sword, standing guard with his feet planted wide, defiant. $SP"
P[c_killerrabbit]="A small fluffy white rabbit sitting on the ground, glowing red eyes and a tiny menacing grin showing two sharp teeth. $SP"
P[c_barbarian]="A massively muscular barbarian with long black hair, a fur loincloth, fur boots, leather wrist guards and a huge sword strapped on his back, stern brooding face. $SP"
P[c_luckdragon]="A long friendly flying dragon with no wings at all, shaped like a snake curled in the air, covered in white fur and pearly pink scales, a big dog-like head with floppy ears and a huge kind smile. $SP"; S[c_luckdragon]=1280x1024
P[c_paleo]="A paleontologist in a beige safari shirt and trousers, a wide-brimmed hat, a red bandana around his neck, holding a big fossil claw, squinting suspiciously. $SP"
P[c_trex]="A huge tyrannosaurus dinosaur seen from the side in full body, mouth open roaring, tiny arms, comical rather than scary. $SP"; S[c_trex]=1280x1024
P[c_girl]="A serious young girl of about twelve with realistic child proportions, a very short buzzcut, an oversized blue jacket over a pink dress, white tube socks and sneakers, an intense stare, holding an iced sweetroll pastry. $SP"
P[c_flower]="A tall slimy grey-green humanoid creature with long thin limbs whose head opens like the petals of a flower around a round mouth, comical rather than gory. $SP"
P[c_kid]="A boy of about twelve with realistic child proportions, a bowl haircut, a 1980s striped t-shirt, jeans and sneakers, holding a big walkie-talkie with its antenna up, excited. $SP"
P[c_redman]="A small man in a red suit, red shirt and red tie with slicked back hair, dancing with snapping fingers and a mysterious smile. $SP"
P[c_loglady]="An elderly woman with big round glasses, short grey hair and a shawl, holding a small wooden log in her arms like a baby, solemn expression. $SP"
P[c_agent]="A clean-cut cheerful FBI agent in a black suit and black tie, neat black hair, holding a small tape recorder near his mouth in one hand and a cup of coffee in the other. $SP"
P[c_analyst]="A neat polite forensic analyst with short dark hair in a short-sleeved patterned shirt and khaki trousers, holding an open box of pink donuts with both hands, a polite blank smile. $SP"
P[c_sister]="A tough police detective woman with dark hair in a ponytail, a police badge clipped to her belt, jeans and a tank top, one hand raised in an angry swearing gesture. $SP"
P[c_morph]="A calm bald man in a long black leather coat and small round dark sunglasses, holding out his two open hands, palms up: one small red potion bottle on one palm, one small blue potion bottle on the other. $SP"
P[c_agentm]="A stern government agent in a dark suit, white shirt, thin black tie, black sunglasses and a curly earpiece wire, slicked hair, one hand adjusting his earpiece. $SP"
P[c_spoonkid]="A calm bald boy of about ten with realistic child proportions in a pale loose robe, holding up a spoon that bends in his fingers, serene smile. $SP"
P[c_wizard]="An old wizard with a long grey beard, a tall pointed grey hat, long grey robes and a gnarled wooden staff, an annoyed expression. $SP"
P[c_demon]="A huge horned demon made of black smoke and flames, glowing eyes, wide smoky wings, holding a whip of fire, comical rather than scary. $SP"; S[c_demon]=1280x1024
P[c_halfling]="A small round-cheeked halfling with curly brown hair, big hairy bare feet, a yellow waistcoat and a green jacket, holding a plate with a second breakfast of eggs and sausages. $SP"
P[c_ai]="A large sleek white robot head hanging down from a black mechanical arm attached to the top of the picture, a single round glowing red eye, smug tilt. $SP"
P[c_turret]="A small cute white egg-shaped security turret standing on three thin black legs, a single round red eye lens in the middle. $SP"
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(c_sheo c_wabbajack c_pirate c_parrot c_dog c_rabbit c_villager c_creeper c_archeo c_doc c_potions c_hat c_king c_knight_dim c_knight_fat c_ni c_coconut c_blackknight c_killerrabbit c_barbarian c_luckdragon c_paleo c_trex c_girl c_flower c_kid c_redman c_loglady c_agent c_analyst c_sister c_morph c_agentm c_spoonkid c_wizard c_demon c_halfling c_ai c_turret)
for id in $ids; do
  out="persos/${id}.png"; [ -f "$out" ] && continue
  sz=${S[$id]:-1024x1280}; refs=(); [ -n "${R[$id]}" ] && refs=(-i "${R[$id]}")
  seed=$(( ${#id} * 1000 + 2026 ))
  flux-image "${P[$id]}" $refs -s $sz --seed $seed -o "$out" >/dev/null 2>&1
  echo "$(date +%H:%M:%S) ok $id"
done
