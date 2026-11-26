#!/bin/zsh
# Saison 2, chapitre 27 (Rick et Morty) : seul chapitre hors du rendu peint, tout est dans le style du dessin animé,
# le héros compris (demande de Stéphan du 25/11). Essai de rendu : scène du garage. FLUX 3 Klein local, file calcul-lourd.
# Relançable : saute ce qui existe. Usage : gen_s2_rick.sh [id…]   (SEEDS="1 2" par défaut)
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p rick
TS="flat 2D adult animated sitcom cartoon style, flat solid colors with almost no shading, thick uniform black outlines, slightly wobbly hand-drawn lines, simple round white eyes with tiny black dot pupils, lanky simple bodies, acid saturated palette with bright toxic portal green, wide composition, no logo, no watermark, no frame, no text, no letters"
HT="The hero is the man from the reference picture, completely redrawn in this flat cartoon style, not painted: same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same pleated brown leather kilt, same fur-topped boots, but with round white cartoon eyes with dot pupils, a thick black outline and flat colors"
HD="The hero is a burly Nordic warrior with a blond ponytail, a horned iron Viking helmet, fur-collared studded brown leather armor, a round wooden shield on his back, a pleated brown leather kilt and fur-topped boots, round white cartoon eyes with dot pupils"
SCI="a tall skinny old mad scientist with spiky pale blue-grey hair, a single long unibrow, half-closed bored eyes, a bit of drool at the corner of his mouth, a white lab coat over a light blue sweater, brown trousers, holding a small silver flask"
KID="an anxious skinny teenage boy of about fourteen with short brown hair, a plain yellow t-shirt and blue jeans, a nervous wavy mouth, sweat drops, hands raised"
BLU="a tall skinny bright light-blue creature with a big cheerful grin and big round eyes, one hand raised, springing out of a small grey box with a big round button on the workbench"
GAR="A cluttered suburban garage at night: a messy workbench covered with gadgets, wires and beakers, tools hanging on a pegboard, an old car under a sheet, a flying-saucer-shaped vehicle in the corner, and on the back wall a swirling bright green portal"
typeset -A P R
P[r_rick]="$GAR. From left to right: first $SCI, leaning toward the hero; second, in the centre, the hero, holding an old wooden bucket of water, looking down at his own round cartoon hand with a baffled frown; third $BLU; fourth $KID. $HT. Each person appears only once. $TS"; R[r_rick]=hero_s2/sel_34_left.png
P[r_rickd]="$GAR. From left to right: first $SCI, leaning toward the hero; second, in the centre, the hero, holding an old wooden bucket of water, looking down at his own round cartoon hand with a baffled frown; third $BLU; fourth $KID. $HD. Each person appears only once. $TS"
# 2e passe (26/11) : Stéphan garde le héros de r_rickd_1 (aplats) et les personnages de r_rick_2. Image entière recalculée
# avec les deux images en référence : le héros recadré de r_rickd_1, puis la scène r_rick_2.
P[r_rickm]="The first picture shows the hero; the second picture shows the scene. Draw the whole scene of the second picture again: same cluttered garage at night, same swirling green portal, same covered car, same flying saucer, same old mad scientist with spiky blue-grey hair and white lab coat, same tall bright light-blue creature springing out of its grey box with a round button, same anxious boy in a yellow t-shirt and blue jeans, same drawing of these characters. But the Viking hero in the centre is exactly the flat cartoon Viking of the first picture: same simple flat-colored face with round white eyes and dot pupils, same blond ponytail, same iron helmet with cream horns, same fur collar, same brown studded leather tunic, same round wooden shield on his back, same brown kilt, same fur-topped boots, drawn in flat colors with a thick black outline, no painted texture on him. He holds the old wooden bucket of water by its handle in one hand himself and looks at his other round cartoon hand with a baffled frown. The scientist holds a glass flask in one hand and does not touch the bucket. From left to right: the scientist, the hero, the blue creature, the boy. Each person appears only once. $TS"; R[r_rickm]="rick/ref_heros_toon.png rick/r_rick_2.png"
# 3e passe (26/11) : les personnages seront animés : chacun entier, bien séparé, deux bras et deux mains visibles (le savant
# avait un bras caché derrière le bouclier du héros).
P[r_rickn]="${P[r_rickm]/From left to right:/The four characters stand well apart from each other with clear empty floor between them; nobody hides any part of another, and each one has two arms and two hands fully visible, the scientist's right hand resting on his hip with the elbow out. From left to right:}"; R[r_rickn]=${R[r_rickm]}
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(r_rick r_rickd)
for id in $ids; do
  for s in ${=SEEDS:-1 2}; do
    out="rick/${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 137 + 6161 )); refs=(); for r in ${=R[$id]}; do refs+=(-i "$r"); done
    flux-image "${P[$id]}" $refs -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1
    echo "$(date +%H:%M:%S) ok $out"
  done
done
