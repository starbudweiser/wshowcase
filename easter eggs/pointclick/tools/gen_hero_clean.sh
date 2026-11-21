#!/bin/zsh
# Nettoyage de la vitre par le héros ENTIER (17/11/2026) : plus d'avant-bras découpé. Poses clés FLUX à partir de sa vue de face choisie
# par Stéphan (pv_front_9, copiée en work/hero_clean/v_front.png), même échelle que le portrait de nuit, avec de la place au-dessus du casque
# pour les gestes hauts. La main (ou l'outil) est plaquée contre la vitre, à une position imposée par boîte ; le moteur fait glisser le héros
# entier sous les salissures et choisit la pose dont la main tombe au bon endroit (toujours la main droite ; l'autre côté = scène en miroir).
# Planche 1 (validation) : paume à 6 positions, chaque autre outil à une position, souffle de buée. Plusieurs graines, choix sur planche.
cd "$(dirname "$0")/../work/hero_clean" || exit 1
B="Exactly the same character as in the reference picture: same face, same horned iron helmet, same blond hair, same fur collar, same riveted armor and leather straps, same round wooden shield strapped on his back centered behind him, same bare hands and leather bracers, same hand-painted 1990s point-and-click adventure art style, same colors, same bold outlines. Seen from the front at exactly the same scale as the reference, from the waist up, with empty green space above his helmet. He stands right behind a clear window pane that faces the viewer and he is cleaning it, focused frown, the tip of his tongue poking out of the corner of his mouth. Plain flat solid green background, no window frame, no text."
BODY='{"id":1,"desc":"the viking hero seen from the front from the waist up","bbox":[0.22,0.0,1.0,1.0]}'
typeset -A HB=( hl '[0.02,0.10,0.22,0.32]' hc '[0.0,0.40,0.18,0.60]' ml '[0.24,0.02,0.46,0.24]' mr '[0.26,0.62,0.48,0.84]' ll '[0.55,0.05,0.78,0.28]' lc '[0.55,0.38,0.78,0.60]' )
typeset -A WH=( hl "his right arm raised high on the left side of the picture, the hand high above and to the left of his helmet" hc "his right arm raised straight up, the hand right above his helmet" ml "his right arm bent, the hand beside his head on the left side of the picture, at the height of his face" mr "his right arm crossing in front of his chest, the hand beside his head on the right side of the picture, at the height of his face" ll "his right hand low on the left side of the picture, in front of his shoulder and chest" lc "his right hand low in front of the middle of his chest" )
typeset -A TOOL=( palm "his bare right palm pressed flat against the glass, fingers spread, the skin of the palm squashed flat on the pane" rag "his right hand rubbing the glass with a crumpled old grey cloth rag squashed flat against the pane" leaf "his right hand rubbing the glass with a big crinkled green cabbage leaf squashed flat against the pane like a sponge" duster "his right hand brushing the glass with a feather duster, a short wooden stick with a fluffy tuft of colorful feathers squashed against the pane" sleeve "his right forearm bent and pressed flat against the glass, rubbing the pane with the riveted leather sleeve of his armor and his bracer" finger "his right index finger scraping the glass with its fingernail, the fingertip pressed against the pane, the other fingers folded" )
p(){ out="$1"; seed="$2"; box="$3"; shift 3; [ -f "$out" ] && return; echo "[$BODY,{\"id\":2,\"desc\":\"his right hand pressed against the glass\",\"bbox\":$box}]" > "${out%.png}.box.json"
  flux-image "$B $*" -i v_front.png -b "${out%.png}.box.json" -o "$out" -s 1280x1280 --seed $seed >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 1 2; do
  for pos in hl hc ml mr ll lc; do p cl_palm_${pos}_$s.png $((700+s)) "$HB[$pos]" "Cleaning the glass with ${TOOL[palm]}; ${WH[$pos]}."; done
  for t in rag leaf duster sleeve finger; do p cl_${t}_ml_$s.png $((720+s)) "$HB[ml]" "Cleaning the glass with ${TOOL[$t]}; ${WH[ml]}."; done
  [ -f cl_breath_$s.png ] || { echo "[$BODY]" > cl_breath.box.json; flux-image "$B Leaning his face close to the glass and blowing on it to fog it up: cheeks puffed out, lips rounded in a small O, both hands resting on the bottom of the pane, eyes looking at the fog." -i v_front.png -b cl_breath.box.json -o cl_breath_$s.png -s 1280x1280 --seed $((740+s)) >/dev/null 2>&1 && echo "ok cl_breath_$s.png" || echo "ÉCHEC cl_breath_$s.png"; }
done
# Passe 2 : manche (avant-bras à plat), ongle (bout du doigt écrasé qui gratte), buée sans cadre de fenêtre, paume au-dessus du casque (3e graine)
F="No window frame, no window sill, no glass edges, nothing but the hero on the flat green background."
q(){ out="$1"; seed="$2"; box="$3"; shift 3; [ -f "$out" ] && return; echo "[$BODY,{\"id\":2,\"desc\":\"$HD\",\"bbox\":$box}]" > "${out%.png}.box.json"
  flux-image "$B $* $F" -i v_front.png -b "${out%.png}.box.json" -o "$out" -s 1280x1280 --seed $seed >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 3 4 5; do
  HD="his right forearm lying horizontally against the glass"; q cl_sleeve_ml_$s.png $((760+s)) '[0.27,0.02,0.45,0.52]' "Rubbing the glass with his right forearm: his right arm bent and held horizontally in front of his upper face, the outer side of the forearm and its leather bracer pressed flat against the glass, his fist on the right of his face, his elbow out on the left side of the picture, rubbing hard."
  HD="his right index fingertip pressed against the glass"; q cl_finger_ml_$s.png $((770+s)) "$HB[ml]" "Scratching a dried spot off the glass with his fingernail: his right hand seen from the palm side beside his head on the left side of the picture, the index fingertip squashed flat against the pane, the other fingers curled into his palm, squinting at the spot."
  [ -f cl_breath_$s.png ] || { echo "[$BODY]" > cl_breath.box.json; flux-image "$B Leaning his face forward toward the viewer and blowing a puff of breath onto the glass to fog it up: cheeks puffed out, lips pursed in a small round O, eyes looking at the spot in front of his mouth, both arms down at his sides. $F" -i v_front.png -b cl_breath.box.json -o cl_breath_$s.png -s 1280x1280 --seed $((780+s)) >/dev/null 2>&1 && echo "ok cl_breath_$s.png" || echo "ÉCHEC cl_breath_$s.png"; }
done
p cl_palm_hc_3.png 703 "$HB[hc]" "Cleaning the glass with ${TOOL[palm]}; ${WH[hc]}. Only his own two hands, no other hand."

# Passe 3 (18/11/2026, remarque de Stéphan) : on regarde À TRAVERS la vitre, depuis l'autre côté. L'ustensile est donc coincé entre la main
# et le verre, écrasé à plat devant la main (on ne voit jamais le dos de la main) ; la paume nue est aplatie et blanchie contre le verre,
# un peu plus grande car plus proche ; main droite à l'anatomie juste (paume vers nous = pouce du côté de son visage).
V="We look at him THROUGH the window glass from the other side: the clear pane is right in front of the viewer, between him and us, and he cleans it from his side, so whatever touches the glass is pressed flat against it right in front of the viewer, closer to us than his face and a little bigger."
typeset -A T3=(
 palm "his bare right palm squashed flat against the glass: we see the inside of his palm and of his flattened fingers pressed on the pane, the skin pale and whitened where it touches the glass, fingers slightly spread, his thumb on the side toward his face, like a hand pressed on a shop window seen from the street"
 rag "a crumpled old grey cloth rag squashed flat against the glass, BETWEEN his hand and us: the rag covers his whole palm and hides most of his hand, only his fingertips and the tip of his thumb show around the edges of the rag, pressing it; we never see the back of his hand"
 leaf "a big crinkled green cabbage leaf squashed flat against the glass, BETWEEN his hand and us: the leaf covers his whole palm and hides most of his hand, its veins flattened on the pane, only his fingertips and the tip of his thumb show around the edges of the leaf, pressing it; we never see the back of his hand"
 duster "the fluffy colorful feathers of a feather duster squashed and splayed flat against the glass, BETWEEN the duster handle and us: the feathers fan out on the pane in front of his hand, his right hand holds the short wooden handle behind the feathers, seen from the palm side"
 finger "the tip of his right index fingernail scraping a dried spot off the glass: his index finger is bent toward the pane so that only its fingernail touches the glass, we see the fingernail and the back of the fingertip pressed on the pane, the other fingers curled"
)
r(){ out="$1"; seed="$2"; box="$3"; hd="$4"; shift 4; [ -f "$out" ] && return; echo "[$BODY,{\"id\":2,\"desc\":\"$hd\",\"bbox\":$box}]" > "${out%.png}.box.json"
  flux-image "$B $V $* $F" -i v_front.png -b "${out%.png}.box.json" -o "$out" -s 1280x1280 --seed $seed >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 1 2 3; do
  for t in rag leaf duster finger; do r cl3_${t}_ml_$s.png $((800+s)) "$HB[ml]" "what he presses against the glass" "Cleaning the glass with ${T3[$t]}; ${WH[ml]}."; done
  r cl3_sleeve_$s.png $((810+s)) '[0.48,0.04,0.66,0.62]' "his right forearm pressed flat against the glass" "Rubbing the glass with his right forearm: his right arm bent and held horizontally in front of his chest, the outer side of the forearm and its leather bracer squashed flat against the glass, closer to us than his body, his fist on the right, his elbow on the left side of the picture."
  r cl3_palm_ml_$s.png $((820+s)) "$HB[ml]" "his right palm pressed flat against the glass" "Cleaning the glass with ${T3[palm]}; ${WH[ml]}."
done
for pos in hl hc mr ll lc; do r cl3_palm_${pos}_1.png 831 "$HB[$pos]" "his right palm pressed flat against the glass" "Cleaning the glass with ${T3[palm]}; ${WH[$pos]}."; done
# Passe 4 : le texte seul ne suffit pas (dos de main gauche, plumeau brandi, cadres). On donne à FLUX une pose JUSTE comme 2e référence :
# cl3_leaf_ml_1 (feuille plaquée devant la paume, bouts des doigts qui dépassent) pour le chiffon et le plumeau, cl3_palm_ml_2 (paume plaquée,
# main droite, pouce côté visage) pour les autres positions de la paume et pour l'index.
N="No window frame, no frame lines, no borders, no glass edges anywhere in the picture."
k(){ out="$1"; seed="$2"; box="$3"; hd="$4"; ref="$5"; shift 5; [ -f "$out" ] && return; echo "[$BODY,{\"id\":2,\"desc\":\"$hd\",\"bbox\":$box}]" > "${out%.png}.box.json"
  flux-image "Exactly the same character as in the first picture, same art style and colors. $* $N" -i v_front.png -i "$ref" -b "${out%.png}.box.json" -o "$out" -s 1280x1280 --seed $seed >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 1 2 3 4; do
  k cl4_rag_ml_$s.png $((900+s)) "$HB[ml]" "a grey rag pressed flat on the glass, his fingertips peeking over it" cl3_leaf_ml_1.png "Exactly the same picture as the second picture: same pose, same framing, same arm, same hand position. Only change: instead of the cabbage leaf, his palm presses a crumpled old grey cloth rag flat against the glass in front of the viewer. The rag covers his palm, only his four fingertips peek over its top edge and the tip of his thumb at its right side, exactly like the leaf in the second picture. We never see the back of his hand."
  k cl4_duster_ml_$s.png $((910+s)) "$HB[ml]" "the feathers of a feather duster squashed flat on the glass in front of his hand" cl3_leaf_ml_1.png "Exactly the same picture as the second picture: same pose, same framing, same arm, same hand position. Only change: instead of the cabbage leaf, his palm presses the fluffy colorful feathers of a feather duster flat against the glass in front of the viewer; the feathers fan out squashed on the pane and hide his palm, only his fingertips peek over them and a short wooden handle sticks out below his wrist."
done
for s in 1 2 3; do
  k cl4_finger_ml_$s.png $((920+s)) "$HB[ml]" "his index fingertip squashed flat on the glass" cl3_palm_ml_2.png "Same pose, same framing, same arm and same hand side as in the second picture (palm toward the viewer, thumb toward his face), but now he scrubs a dried spot off the glass with only the tip of his index finger: the pad of his index fingertip squashed flat and whitened against the glass, his other three fingers curled into his palm, his thumb resting on them, squinting at the spot."
  k cl4_sleeve_$s.png $((930+s)) '[0.48,0.04,0.66,0.62]' "his right forearm pressed flat on the glass" cl3_palm_ml_2.png "Same character and framing as the second picture, but now he rubs the glass with his right forearm: his right arm bent at a right angle and held horizontally across his chest, the outer side of the forearm and its leather bracer squashed flat against the glass in front of the viewer, his right hand clenched in a tight fist at the right end of the forearm, his elbow on the left side of the picture, his left arm down out of sight, rubbing hard with a grimace."
done
typeset -A W4=( hl "high above and to the left of his helmet, his right arm raised high" hc "right above his helmet, his right arm raised straight up" mr "beside his head on the right side of the picture, his right arm crossing in front of his chest" ll "low on the left side of the picture, in front of his shoulder" )
for pos in hl hc mr ll; do for s in 1 2; do
  k cl4_palm_${pos}_$s.png $((940+s)) "$HB[$pos]" "his right palm pressed flat on the glass" cl3_palm_ml_2.png "Same character, same framing and exactly the same pressed hand as in the second picture (palm squashed flat and whitened against the glass, fingers slightly spread, thumb toward his face, palm toward the viewer), but his hand is now ${W4[$pos]}. Only his own two hands."
done; done
# Passe 5 : paume milieu gauche et en bas au centre, même méthode que la passe 4 (celles de la passe 3 avaient un cadre de fenêtre)
W4[ml]="beside his head on the left side of the picture, at the height of his face"; W4[lc]="low in front of the middle of his chest"
for pos in ml lc; do for s in 1 2 3; do
  k cl4_palm_${pos}_$s.png $((950+s)) "$HB[$pos]" "his right palm pressed flat on the glass" cl3_palm_ml_2.png "Same character, same framing and exactly the same pressed hand as in the second picture (palm squashed flat and whitened against the glass, fingers slightly spread, thumb toward his face, palm toward the viewer), but his hand is now ${W4[$pos]}. Only his own two hands."
done; done
# Production (18/11/2026, planche validée par Stéphan) : chaque outil reste dans la MAIN DROITE, 5 positions par rapport au corps (le héros entier
# glisse sous les taches, l'autre côté = scène en miroir). Référence = la pose validée de l'outil : même main, même physique, même expression.
typeset -A PREF=( palm cl4_palm_ml_1.png rag cl4_rag_ml_1.png leaf cl3_leaf_ml_1.png duster cl4_duster_ml_1.png finger cl4_finger_ml_1.png )
typeset -A PHY=(
 palm "his bare right palm squashed flat and whitened against the glass, fingers slightly spread, thumb toward his face"
 rag "his right palm pressing the crumpled grey rag flat against the glass in front of the viewer, the rag covering his palm, only his fingertips peeking over its top edge and the tip of his thumb at its side"
 leaf "his right palm pressing the cabbage leaf flat against the glass in front of the viewer, the leaf covering his palm, only his fingertips peeking over its edge"
 duster "his right palm pressing the feathers of the feather duster flat against the glass in front of the viewer, the feathers fanned out over his palm, only his fingertips peeking over them, the short wooden handle below his wrist"
 finger "only the pad of his right index fingertip squashed flat against the glass, the other fingers curled into his palm, palm toward the viewer, thumb toward his face"
)
typeset -A W6=( hl "high above and to the left of his helmet, his right arm raised high" hc "right above his helmet, his right arm raised straight up, the whole arm visible" ml "beside his head on the left side of the picture, at the height of his face" ll "low on the left side of the picture, in front of his shoulder, the forearm visible" lc "low in front of the middle of his chest, his right forearm crossing in front of his body" )
for t in rag leaf duster finger palm; do for pos in hl hc ml ll lc; do
  [ $t = palm ] && [ $pos = ml -o $pos = hl ] && continue          # paumes déjà validées à ces positions (même expression que la référence)
  for s in 1 2; do
    k cp_${t}_${pos}_$s.png $((1000+s)) "$HB[$pos]" "what his right hand presses against the glass" "${PREF[$t]}" "Same character, same framing, same facial expression, same right hand and the same object as in the second picture, with exactly the same physics: ${PHY[$t]}. Only change: his right hand is now ${W6[$pos]}. His left arm hangs down at his side. Only his own two hands."
  done
done; done
for pos in hi lo; do for s in 1 2; do
  [ $pos = hi ] && { box='[0.04,0.06,0.20,0.66]'; where="held horizontally just above his helmet"; } || { box='[0.48,0.04,0.66,0.62]'; where="held horizontally across his chest"; }
  k cp_sleeve_${pos}_$s.png $((1100+s)) "$box" "his right forearm pressed flat on the glass" cl4_sleeve_1.png "Same character, same framing, same facial expression and exactly the same forearm pose as in the second picture: the outer side of his right forearm and its leather bracer squashed flat against the glass, his right hand clenched in a fist at the right end of the forearm, his elbow on the left. Only change: the forearm is now ${where}. His left arm hangs down out of sight."
done; done
# Index, 2e production : la 1re a perdu le contact (doigt levé = geste « attends »). Le contact est décrit : la pulpe aplatie et pâlie contre le verre,
# et la petite tache sèche qu'il frotte, juste sous le bout du doigt (comme dans la référence).
for pos in hl hc ml ll lc; do for s in 3 4; do
  k cp_finger_${pos}_$s.png $((1200+s)) "$HB[$pos]" "his right index fingertip pressed flat on the glass, rubbing a small dried smudge" cl4_finger_ml_1.png "Same character, same framing, same facial expression and exactly the same hand gesture as in the second picture: palm toward the viewer, thumb toward his face, the other three fingers curled into his palm, the index finger straight with the pad of its tip squashed flat and paler against the glass, rubbing a small white dried smudge on the glass right under the fingertip, exactly like the second picture. Only change: his right hand is now ${W6[$pos]}. His left arm hangs down at his side. Only his own two hands."
done; done
echo fini
