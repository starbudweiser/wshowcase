#!/bin/zsh
# Saison 2, chapitre 27 (Rick et Morty) : planches des personnages dans le style retenu par Stéphan (scène r_rickm_2 :
# héros en aplats, personnages du dessin animé), chacun d'après son recadrage dans cette scène. Fond magenta (détourage ensuite).
# FLUX 3 Klein local, file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_s2_rick_persos.sh [id…]  (SEEDS="1 2")
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos hero_s2
TP="Redraw exactly this character from the reference picture, same design, same colors, same flat 2D adult animated sitcom cartoon style with thick black outlines and flat colors, as a full body game character sprite: the whole figure visible from the top of the head down to the feet with empty magenta space above and below, three-quarter view, plain flat solid magenta background, no shadow, no ground, no other object, no text"
typeset -A P R
P[c_madsci]="An old mad scientist with spiky pale blue-grey hair, a unibrow, half-closed bored eyes, a white lab coat over a light blue sweater, brown trousers and brown shoes, holding a glass flask, one eyebrow raised. $TP"; R[c_madsci]=rick/ref_madsci.png
P[c_grandson]="An anxious teenage boy with short brown hair, a plain yellow t-shirt, blue jeans and brown shoes, hands raised nervously, sweat drop. $TP"; R[c_grandson]=rick/ref_grandson.png
P[c_bluegenie]="A tall skinny bright light-blue creature with big round eyes and a huge cheerful open grin, one hand waving, standing on its two feet, without its box. $TP"; R[c_bluegenie]=rick/ref_bluegenie.png
P[h_toon]="The cartoon Viking hero: blond ponytail, iron helmet with cream horns, fur collar, brown studded leather tunic, round wooden shield on his back, brown pleated kilt, fur-topped boots, round white eyes with dot pupils, a baffled frown, holding nothing. $TP"; R[h_toon]=rick/ref_toon.png
# 2e passe (26/11) : le savant avait un bras coupé (bras caché derrière la blouse sur la référence) : les deux bras visibles.
P[c_madsci2]="An old mad scientist with spiky pale blue-grey hair, a unibrow, half-closed bored eyes, a white lab coat over a light blue sweater, brown trousers and brown shoes. He has TWO arms and TWO hands, both clearly visible on each side of his body: his left hand holds a glass flask at chest height, his right hand rests on his hip with the elbow pointing out. $TP"; R[c_madsci2]=rick/ref_madsci.png
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(c_madsci c_grandson c_bluegenie h_toon)
for id in $ids; do
  for s in ${=SEEDS:-1 2}; do
    out="persos/${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 137 + 6161 ))
    flux-image "${P[$id]}" -i "${R[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    echo "$(date +%H:%M:%S) ok $out"
  done
done
