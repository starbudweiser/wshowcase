#!/bin/zsh
# Saison 2, chapitre 26 (Friends) : planches des 4 personnages (fond magenta, détourage ensuite) et scène du café,
# fidèles à l'allure emblématique des personnages de la série (costumes, coiffures, accessoires), jamais le visage des acteurs.
# FLUX 3 Klein local, file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_s2_friends.sh [id…]  (SEEDS="1 2" par défaut)
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible from the top of the head down to the shoes with empty magenta space above and below, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
ST="hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
H="The hero is exactly the man from the reference picture: same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield strapped on his back, same pleated brown leather kilt with leather pouches, same fur-topped boots, same painted style; NOT a tartan kilt. His usual smirk is gone, no smile at all."
JO="a handsome broad-shouldered Italian-American New York actor in his late twenties with short thick dark brown hair combed back, clean-shaven, a confident flirtatious grin with one eyebrow raised, a brown leather jacket over a plain white t-shirt, dark blue jeans and black boots"
CH="a lean sarcastic New York office worker in his late twenties with short neat dark brown hair, clean-shaven, a wry lopsided smirk, a light blue button-up shirt under a dark green argyle sweater vest, beige chinos and brown loafers"
RO="a tall gangly nervous paleontologist in his late twenties with short dark brown hair, clean-shaven, worried raised eyebrows, a light grey crewneck sweater over a white collared shirt, a brown tweed jacket, dark khaki trousers"
PH="a dreamy quirky hippie folk singer in her late twenties with long wavy honey-blonde hair held by small colorful hair clips, a long flowing purple floral bohemian dress, a short cropped knit cardigan, layers of beaded necklaces, ankle boots"
typeset -A P R S
P[c_charmer]="$JO, holding a huge overstuffed meatball sandwich in one hand, pointing at the viewer with the other with a wink. $SP"
P[c_joker]="$CH, both hands raised in sarcastic air quotes, rolling his eyes. $SP"
P[c_nervpaleo]="$RO, holding a small green plastic toy dinosaur in one hand, the other hand raised with its palm out as if yelling an order, mouth open, panicking. $SP"
P[c_singer]="$PH, holding a wooden acoustic guitar by its neck in one hand, the other hand waving, a serene distracted smile. $SP"
P[r_friends]="The hero, seen in three-quarter view, his chest and face turned toward the RIGHT side of the picture, sits up on the cushions of a big worn orange velvet couch, just woken up, looking around suspiciously over his shoulder as if searching for hidden laughter: one eyebrow raised, lips pressed. $H A cozy 1990s New York coffee house: exposed red brick walls, a big arched window onto the street, eclectic floor lamps, a wooden counter with an espresso machine in the background, mismatched armchairs, a low wooden coffee table with oversized coffee mugs, warm purple, green and amber tones. From left to right: first the hero on the orange couch; second, leaning over the back of the couch toward the hero, $JO; third, sitting in a green armchair, $CH, smirking; fourth, standing, $RO, holding a small green plastic toy dinosaur; fifth, sitting on a tall stool with an acoustic guitar on her lap, $PH. Each person appears only once and wears only their own clothes. $ST"; R[r_friends]=hero_s2/sel_34_right.png; S[r_friends]=1280x720
# 2e passe (26/11) : le café porte une enseigne, clin d'œil à la taverne de Faillaise (choix de Stéphan) : version FR et version EN.
STS="${ST/no text, no letters/no other writing anywhere}"
SIGN='On the brick wall above the counter hangs a large painted wooden tavern sign in green and cream, with a small painted cracked clay jug beside the words, reading exactly in big clear capital letters: '
BASE="${P[r_friends]/$ST/$STS}"
P[r_friendsfr]="${BASE/A cozy 1990s New York coffee house:/A cozy 1990s New York coffee house. ${SIGN}\"LA CRUCHE PERCÉE\".} "; R[r_friendsfr]=${R[r_friends]}; S[r_friendsfr]=1280x720
P[r_friendsen]="${BASE/A cozy 1990s New York coffee house:/A cozy 1990s New York coffee house. ${SIGN}\"THE RAGGED FLAGON\".} "; R[r_friendsen]=${R[r_friends]}; S[r_friendsen]=1280x720
# 3e passe (26/11) : d'après les photos de référence de Stéphan (costumes et décor de la série, jamais les visages).
JO2="a broad-shouldered Italian-American New York actor in his late twenties with short thick dark brown hair styled up in a small quiff, clean-shaven, a confident flirtatious grin with one eyebrow raised, a fitted short-sleeved t-shirt with horizontal dark navy and grey stripes and a black crew collar, black trousers, black shoes"
CH2="a lean sarcastic New York office worker in his late twenties with short spiky dark brown hair, clean-shaven, a wry lopsided smirk, a light blue button-up shirt with a loosened brown patterned tie, charcoal grey trousers, black shoes"
RO2="a tall gangly nervous paleontologist in his late twenties with short dark brown hair and thick dark eyebrows, clean-shaven, worried raised eyebrows, a dark charcoal grey crewneck sweater over a white collared shirt, dark navy trousers, black shoes"
PH2="a dreamy quirky hippie folk singer in her late twenties with very long straight golden-blonde hair parted in the middle, small gold hoop earrings, a long dark brown spaghetti-strap slip dress covered with a big golden leaf and flower print, a few thin bead necklaces, brown ankle boots"
CAFE="the cozy coffee house of the famous 1990s sitcom: warm terracotta and ochre walls, a big worn orange velvet couch facing the viewer, a large faded red and blue Persian rug, a rustic low wooden coffee table with peeling pale green paint and big coffee mugs, a sage green velvet armchair, a tall dark green cast-iron column, a wooden counter with glass jars of pastries and an espresso machine, red velvet curtains, eclectic hanging lamps, colored neon arrows without letters, a big painting of a gorilla on a bright yellow background, potted plants"
P[c_charmer2]="$JO2, holding a huge overstuffed meatball sandwich in one hand, pointing at the viewer with the other with a wink. $SP"
P[c_joker2]="$CH2, both hands raised in sarcastic air quotes, rolling his eyes. $SP"
P[c_nervpaleo2]="$RO2, holding a small green plastic toy dinosaur in one hand, the other hand raised with its palm out as if yelling an order, mouth open, panicking. $SP"
P[c_singer2]="$PH2, holding a wooden acoustic guitar by its neck in one hand, the other hand waving, a serene distracted smile. $SP"
SC2="The hero, seen in three-quarter view, his chest and face turned toward the RIGHT side of the picture, toward the others, sits up on the orange couch, just woken up, looking around suspiciously as if searching for hidden laughter: one eyebrow raised, lips pressed. $H Inside $CAFE. From left to right: first the hero sitting on the orange couch; second, leaning over the back of the couch toward the hero with one hand on his shoulder, $JO2; third, sitting in the sage green armchair, $CH2, smirking; fourth, standing, $RO2, holding a small green plastic toy dinosaur; fifth, sitting on a tall stool with an acoustic guitar on her lap, $PH2. Each person appears only once and wears only their own clothes. ${SIGN/On the brick wall above the counter/On the wall above the counter}"
P[r_friendsfr3]="$SC2\"LA CRUCHE PERCÉE\". $STS"; R[r_friendsfr3]=${R[r_friends]}; S[r_friendsfr3]=1280x720
P[r_friendsen3]="$SC2\"THE RAGGED FLAGON\". $STS"; R[r_friendsen3]=${R[r_friends]}; S[r_friendsen3]=1280x720
# 4e passe (26/11) : les personnages seront animés : chacun entier et séparé des autres, bras, mains et jambes visibles.
SC3="${SC2/second, leaning over the back of the couch toward the hero with one hand on his shoulder, $JO2/second, standing beside the couch and leaning toward the hero with a grin, $JO2}"
SC3="${SC3/From left to right:/The five characters are well apart from each other with clear space between them; nobody hides any part of another, and each one has two arms, two hands and two legs fully visible. From left to right:}"
P[r_friendsfr4]="$SC3\"LA CRUCHE PERCÉE\". $STS"; R[r_friendsfr4]=${R[r_friends]}; S[r_friendsfr4]=1280x720
P[r_friendsen4]="$SC3\"THE RAGGED FLAGON\". $STS"; R[r_friendsen4]=${R[r_friends]}; S[r_friendsen4]=1280x720
# 5e passe (26/11) : l'acteur avait les pieds cachés par le canapé, le blagueur par la table basse : tout le monde vu de la tête aux pieds.
SC4="${SC3/second, standing beside the couch and leaning toward the hero with a grin, $JO2/second, standing on the open floor between the couch and the armchair, in full view from head to shoes, leaning toward the hero with a grin, $JO2}"
SC4="${SC4/From left to right:/The low coffee table stands in the foreground at the far left, in front of the hero's knees only, and hides nobody's legs or feet; every person is seen entirely from head to feet. From left to right:}"
P[r_friendsfr5]="$SC4\"LA CRUCHE PERCÉE\". $STS"; R[r_friendsfr5]=${R[r_friends]}; S[r_friendsfr5]=1280x720
P[r_friendsen5]="$SC4\"THE RAGGED FLAGON\". $STS"; R[r_friendsen5]=${R[r_friends]}; S[r_friendsen5]=1280x720
# 6e passe (26/11) : la table basse cachait encore les bottes du héros : plus de table devant le canapé.
SC5="${SC4/a rustic low wooden coffee table with peeling pale green paint and big coffee mugs/a rustic wooden side table with peeling pale green paint standing against the back wall, holding big coffee mugs}"
SC5="${SC5/The low coffee table stands*legs or feet;/There is NO table in front of the couch: the hero's legs and fur boots rest on the rug in full view;}"
P[r_friendsfr6]="$SC5\"LA CRUCHE PERCÉE\". $STS"; R[r_friendsfr6]=${R[r_friends]}; S[r_friendsfr6]=1280x720
P[r_friendsen6]="$SC5\"THE RAGGED FLAGON\". $STS"; R[r_friendsen6]=${R[r_friends]}; S[r_friendsen6]=1280x720
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(c_charmer c_joker c_nervpaleo c_singer r_friends)
for id in $ids; do
  for s in ${=SEEDS:-1 2}; do
    if [[ $id == r_* ]]; then out="${id}_$s.png"; else out="persos/${id}_$s.png"; fi; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 137 + 6161 )); refs=(); [ -n "${R[$id]}" ] && refs=(-i "${R[$id]}")
    flux-image "${P[$id]}" $refs -s ${S[$id]:-1024x1280} --seed $seed -o "$out" >/dev/null 2>&1
    echo "$(date +%H:%M:%S) ok $out"
  done
done
