#!/bin/zsh
# Saison 2 : vie des scènes et des personnages par vidéo LTX en boucle (même image au début et à la fin, méthode validée le 24/11).
# - décor : mer qui ondule, navire qui tangue (caméra fixe, la terre ne bouge pas) ;
# - héros : marches (profils, face, dos ; caméra qui suit) ; repos et parole par vue ;
# - personnages : repos vivant et parole, depuis leur fiche validée (fond magenta).
# LTX-2.5 local (file calcul-lourd), relançable (saute ce qui existe). Sorties work/s2play/ltx/<id>.mp4.
# Usage : gen_s2_life.sh [id…] ; sources : variables PS (fiches) et HS (vues du héros), dossier work de la production.
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
TRK="CAMERA: locked-off tracking shot that follows the character at exactly his speed, so he stays at the same place and at the same size in the center of the frame for the whole shot."
MAG="He keeps exactly the same viewing angle, the same costume and everything he holds for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
IDLE="stays in place, alive: breathes calmly, blinks, small natural movements of the head, shoulders and hands, a slight shift of weight, then comes back to the starting pose."
TALK="talks in place: the mouth opens and closes clearly as if speaking a line, the eyebrows move, small expressive hand gestures, then comes back to the starting pose."
NOSMILE="His usual smirk is gone, no smile at all, a blasé deadpan face."
WALK="he walks with a steady natural walking gait: heel strike, the legs alternating regularly, the knees bending, the arms swinging opposite to the legs, every step the same length."
typeset -A P I S D Z
v(){ P[$1]="$2"; I[$1]="$3"; S[$1]="$4"; D[$1]="$5"; Z[$1]="${6:-768x960}"; }
v sea "$FIX SUBJECT: the moonlit pirate harbour of the image. ACTION: the old pirate ship anchored on the left gently rocks and pitches on the swell, its hull rising and falling, its masts swaying slowly from side to side; small waves roll continuously across the dark sea and lap against the dock posts; the moonlight glitters and shimmers on the water; the night clouds drift very slowly. The wooden dock, the barrels, the tavern, the palm tree, the perch and everything on land stay perfectly still. Night, nobody." work/s2play/d_monkey_retenu.png 401 4 1024x576
v hero_wr "$TRK SUBJECT: the character of the image. ACTION: $WALK He walks to the right in strict side profile. $NOSMILE $MAG" $HS/sel_profile_right.png 411 2.5
v hero_wl "$TRK SUBJECT: the character of the image. ACTION: $WALK He walks to the left in strict side profile. $NOSMILE $MAG" $HS/sel_profile_left.png 412 2.5
v hero_wf "$TRK SUBJECT: the character of the image. ACTION: $WALK He walks straight toward the viewer, facing the viewer. $NOSMILE $MAG" $HS/sel_front.png 413 2.5
v hero_wb "$TRK SUBJECT: the character of the image. ACTION: $WALK He walks straight away from the viewer, his back to the viewer. $MAG" $HS/sel_back.png 414 2.5
v hero_iql "$FIX SUBJECT: the character of the image. ACTION: he $IDLE He glances around with a bored look. $NOSMILE $MAG" $HS/sel_34_left.png 421 3
v hero_iqr "$FIX SUBJECT: the character of the image. ACTION: he $IDLE He glances around with a bored look. $NOSMILE $MAG" $HS/sel_34_right.png 422 3
v hero_tql "$FIX SUBJECT: the character of the image. ACTION: he $TALK A sarcastic dry delivery. $NOSMILE $MAG" $HS/sel_34_left.png 423 2.5
v hero_tqr "$FIX SUBJECT: the character of the image. ACTION: he $TALK A sarcastic dry delivery. $NOSMILE $MAG" $HS/sel_34_right.png 424 2.5
v hero_if "$FIX SUBJECT: the character of the image. ACTION: he $IDLE $NOSMILE $MAG" $HS/sel_front.png 425 3
v hero_tf "$FIX SUBJECT: the character of the image. ACTION: he $TALK $NOSMILE $MAG" $HS/sel_front.png 426 2.5
v guybrush_i "$FIX SUBJECT: the character of the image. ACTION: he keeps waving his raised hand cheerfully in a slow rhythm, bobbing a little on his feet with an eager grin, blinking, then comes back to the starting pose. $MAG" $PS/c_guybrush_1.png 431 3
v guybrush_t "$FIX SUBJECT: the character of the image. ACTION: he $TALK Eager and excited, still waving his raised hand. $MAG" $PS/c_guybrush_1.png 432 2.5
v swordmaster_i "$FIX SUBJECT: the character of the image. ACTION: he $IDLE An arrogant sneer, his fingers tapping on his belt. $MAG" $PS/c_pirate.png 433 3
v swordmaster_t "$FIX SUBJECT: the character of the image. ACTION: he $TALK Contemptuous and mocking. $MAG" $PS/c_pirate.png 434 2.5
v lechuck_i "$FIX SUBJECT: the ghost pirate of the image. ACTION: the ghost floats menacingly in place, his raised clawed hand slowly flexing its fingers, his coat and beard drifting gently as if underwater, the ghostly glow pulsing, then comes back to the starting pose. $MAG" $PS/c_lechuck_1.png 435 3
v lechuck_t "$FIX SUBJECT: the ghost pirate of the image. ACTION: he $TALK Roaring menacingly, the mouth opening wide. $MAG" $PS/c_lechuck_1.png 436 2.5
v sheo_i "$FIX SUBJECT: the character of the image. ACTION: he $IDLE A mad grin, the cheese wheel bouncing slightly in his hand, his other hand waving theatrically. $MAG" $PS/c_sheo.png 437 3
v sheo_t "$FIX SUBJECT: the character of the image. ACTION: he $TALK Theatrical and mad, eyes wide. $MAG" $PS/c_sheo.png 438 2.5
v parrot_i "$FIX SUBJECT: the parrot of the image. ACTION: the parrot stays on its stick, bobs its head, ruffles its feathers and shifts its feet, then comes back to the starting pose. ENV: plain flat solid magenta background, perfectly uniform." $PS/c_parrot.png 439 3
v parrot_t "$FIX SUBJECT: the parrot of the image. ACTION: the parrot squawks, its beak opening and closing clearly, flapping its wings a little, then comes back to the starting pose. ENV: plain flat solid magenta background, perfectly uniform." $PS/c_parrot.png 440 2.5
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(sea hero_wr hero_wl hero_wf hero_wb hero_iql hero_iqr hero_tql hero_tqr hero_if hero_tf guybrush_i guybrush_t swordmaster_i swordmaster_t lechuck_i lechuck_t sheo_i sheo_t parrot_i parrot_t)
for id in $ids; do
  out="work/s2play/ltx/$id.mp4"; [ -f "$out" ] && continue
  video-locale "${P[$id]}" -o "$out" -d ${D[$id]} -s ${Z[$id]} -i "${I[$id]}" -i "${I[$id]}" --seed ${S[$id]} -- --no-audio >/dev/null 2>&1 && echo "ok $id" || echo "ÉCHEC $id"
done
echo fini
