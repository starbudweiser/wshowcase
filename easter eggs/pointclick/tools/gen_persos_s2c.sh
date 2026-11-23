#!/bin/zsh
# Reprises d’après les costumes de référence vérifiés en ligne de la saison 2 (crossover) : un personnage entier par image, fond magenta (détourage ensuite).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P R S
P[c_dog2]="A tall anthropomorphic dog detective walking upright, shaggy brown fur like an Irish wolfhound with a long muzzle and floppy ears, wearing a grey suit with a matching grey fedora hat, a white shirt and a striped tie, calm deadpan expression, hands in his pockets. $SP"
P[c_knight_fat2]="A stout jovial medieval knight with a bushy dark beard, chainmail under a bright red surcoat with a brown leather belt, chewing a big roasted chicken leg held in one hand, crumbs in his beard. $SP"
P[c_paleo2]="A paleontologist with a short beard wearing a long-sleeved blue denim button-up shirt, khaki trousers, a red paisley bandana knotted around his neck on one side, a tan hat with a pinched crown and a short curved brim, holding a big fossil claw, squinting suspiciously. $SP"
P[c_kid2]="A cheerful boy of about twelve with realistic child proportions, curly brown hair sticking out from under a blue and white trucker cap, a toothy gap-toothed grin, a raglan baseball t-shirt, jeans and sneakers, holding a big walkie-talkie with its antenna up. $SP"
P[c_loglady2]="An elderly woman with short grey hair and large red-framed glasses, a thick worn collared wool cardigan over a shirt and a polo neck, a long overcoat, a small wooden brooch, holding a small wooden log in her arms like a baby, solemn expression. $SP"
P[c_ai2]="A large sleek white robotic artificial intelligence hanging down from a black mechanical arm attached to the top of the picture, a smooth white head shell with a single round glowing yellow eye, smug tilt. $SP"
P[c_paleo3]="Full body from the top of the hat down to his boots, with empty magenta space above and below, small figure in the frame: a paleontologist with a short beard wearing a long-sleeved blue denim button-up shirt, khaki trousers, brown boots, a red paisley bandana knotted around his neck on one side, a tan hat with a pinched crown and a short curved brim, holding a big fossil claw. $SP"
P[c_loglady3]="Full body from the top of the head down to her shoes, with empty magenta space above and below, small figure in the frame: an elderly woman with short grey hair and large red-framed glasses, a thick worn collared wool cardigan, a long overcoat, a small wooden brooch, sensible shoes, holding a small wooden log in her arms like a baby, solemn expression. $SP"
ids=("$@")
for id in $ids; do
  out="persos/${id}.png"; [ -f "$out" ] && continue
  sz=${S[$id]:-1024x1280}; refs=(); [ -n "${R[$id]}" ] && refs=(-i "${R[$id]}")
  seed=$(( ${#id} * 1000 + 6161 ))
  flux-image "${P[$id]}" $refs -s $sz --seed $seed -o "$out" >/dev/null 2>&1
  echo "$(date +%H:%M:%S) ok $id"
done
