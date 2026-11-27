#!/bin/zsh
# Reprises des planches de personnages de la saison 2 (crossover) : un personnage entier par image, fond magenta (détourage ensuite).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P R S
P[c_doc2]="A tall lanky old scientist with realistic adult proportions and a normal-sized head, a shock of wild white hair, wide excited eyes, a white lab coat over a dark shirt, protective goggles pushed up on his forehead, a strange gadget clipped to his belt, both arms raised in excitement, standing on his two feet. $SP"
P[c_potions2]="A gaunt sour potions professor with long greasy black hair down to his shoulders, a pale sneering face, a long black buttoned robe with a high collar reaching his ankles, black boots visible under the robe, arms folded, standing; the whole figure from the top of the head to the boots fits in the picture with empty magenta space above and below. $SP"
P[c_redman2]="A small man in a red suit, red shirt and red tie with slicked back hair, dancing a slow strange dance, both arms bent at the elbows with his hands loose and open at shoulder height, palms facing forward, swaying, mysterious smile. $SP"
P[c_sister2]="A tough police detective woman with dark hair in a ponytail, a police badge clipped to her belt, jeans and a tank top, both fists planted on her hips, an angry scowl, mouth open as if yelling. $SP"
P[c_sister3]="Full body from the top of the head down to her boots, with empty magenta space above the head and below the boots: a tough police detective woman with dark hair, a grey tank top, a police badge and a holster on her belt, jeans and black boots, both fists planted on her hips, an angry scowl, mouth open as if yelling. $SP"
P[c_spoonkid2]="Full body from the top of the head down to his bare feet, with empty magenta space above and below: a calm bald boy of about ten with realistic child proportions in a pale loose robe, holding up a spoon whose handle is visibly bent in a curve, serene smile. $SP"
ids=("$@")
for id in $ids; do
  out="persos/${id}.png"; [ -f "$out" ] && continue
  sz=${S[$id]:-1024x1280}; refs=(); [ -n "${R[$id]}" ] && refs=(-i "${R[$id]}")
  seed=$(( ${#id} * 1000 + 4242 ))
  flux-image "${P[$id]}" $refs -s $sz --seed $seed -o "$out" >/dev/null 2>&1
  echo "$(date +%H:%M:%S) ok $id"
done
