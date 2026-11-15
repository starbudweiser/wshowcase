#!/bin/zsh
# 14/11 : géant recalculé entièrement par FLUX, mains vides (il a rangé son gourdin dans sa poche avant de se coucher ; choix de
# Stéphan : aucune retouche, toutes les poses calculées). Étape « debout » : la pose debout mains vides (n_start), qui sert ensuite de
# référence à toutes les poses ; étape « poses » : les poses clés ; étape « mids » : les poses intermédiaires. Relançable.
# Usage : gen_giant_vide.sh debout|poses|mids|…|mids3
cd "$(dirname "$0")/../work/sleep/giant" || exit 1
K="Exactly the same character as in the reference picture: same face, same body, same costume and accessories, same hand-painted 1990s point-and-click adventure art style, same colors, same bold dark outlines. Same camera, same scale and same ground level as the reference: the ground is the horizontal line where the feet stand in the reference. Full body entirely visible, plain flat solid magenta background, no shadow, no ground, no text."
E="His hands are empty: he holds nothing, there is no club, no weapon and no object anywhere in the picture."
f1(){ out="$1"; seed="$2"; box="$3"; shift 3; [ -f "$out" ] || flux-image "$K $E $*" -i n_start.png -b "box_$box.json" -o "$out" -s 1536x1024 --seed $seed >/dev/null 2>&1 || echo "ECHEC $out"; echo "ok $out"; }
f2(){ out="$1"; a="$2"; b="$3"; seed="$4"; box="$5"; shift 5; [ -f "$out" ] || flux-image "$K $E $*" -i "$a" -i "$b" -b "box_$box.json" -o "$out" -s 1536x1024 --seed $seed >/dev/null 2>&1 || echo "ECHEC $out"; echo "ok $out"; }
case "$1" in
debout)
  for s in 1 2 3 4; do
    o=n_start_$s.png; [ -f $o ] || flux-image "$K The giant stands in exactly the same pose as in the reference picture, but he has put his club away: his hands are empty, there is no club and no object anywhere in the picture. His right arm (on the left side of the picture) now hangs relaxed straight down along his body, his open hand beside his thigh, like his other arm." -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 880$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
poses)
  for s in 1 2 3; do
    f1 n_yawn_$s.png 871$s yawn "The giant stands and stretches, both arms raised high above his head, both hands empty fists, his mouth wide open in a huge yawn, eyes squeezed shut."
    f1 n_crouch_$s.png 872$s crouch "The giant bends his knees deeply, lowering himself toward the ground to sit down, one hand on his knee, his other hand reaching down toward the ground, sleepy eyes."
    f1 n_sit_$s.png 873$s sit "The giant sits heavily on the ground, legs stretched forward, one hand resting on his thigh, rubbing one eye with his other fist, drowsy half-closed eyes."
    f1 n_lean_$s.png 874$s lean "The giant leans back toward the left of the picture, propped on one elbow on the ground, his elbow and forearm resting flat on the ground, his legs stretched forward toward the right, drowsy eyelids."
    f1 n_settle_$s.png 875$s settle "The giant lies down on his side on the ground, propped up on one elbow resting flat on the ground, his head resting in his hand, his body horizontal across the picture with his head on the left and his bare feet on the right, heavy drooping eyelids, about to fall asleep."
    f1 n_sleep_$s.png 876$s sleep "The giant lies asleep flat on his back on the ground, his body horizontal across the picture with his head on the left and his bare feet on the right, the back of his head resting directly on the ground with nothing under it, one hand on his belly, the other arm along his body, eyes closed, mouth open snoring."
    f1 n_prop_$s.png 877$s prop "The giant lifts his upper body from the ground, propped up on both elbows resting on the ground, his head on the left and his legs stretched forward toward the right, eyes blinking awake."
    f1 n_wake_$s.png 878$s wake "The giant sits up on the ground just woken, legs stretched forward, both arms stretched wide above his head, big yawn, eyes still half closed."
    f1 n_rise_$s.png 879$s rise "The giant gets up from the ground: he kneels on one knee, both hands pushing on his raised knee, groggy face."
  done;;
poche)
  # gag de la poche : il enfonce le gros bout de son gourdin dans la ceinture de son pagne, à la hanche droite (côté gauche de
  # l'image), comme dans une poche sans fond ; joué à l'envers au réveil, il le ressort. Référence 1 = lui mains vides, 2 = son gourdin.
  C="The same big rough wooden club as in the second picture, thick and heavy at one end, a thin handle with a round knob at the other end."
  for s in 1 2 3; do
    o=n_poche1_$s.png; [ -f $o ] || flux-image "$K The giant stands exactly like in the first picture. $C His right hand (on the left side of the picture) holds the club by the end of its handle, the club pointing straight down along his right hip, its heavy end pushed down inside the waistband of his fur loincloth as if into a bottomless pocket: the lower half of the club has already disappeared inside the loincloth, only its upper half and the handle stick out above his belt. Nothing on his shoulders. His other arm hangs relaxed. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 890$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
    o=n_poche2_$s.png; [ -f $o ] || flux-image "$K The giant stands exactly like in the first picture. $C The club has almost completely disappeared inside the waistband of his fur loincloth at his right hip (on the left side of the picture), as if into a bottomless pocket: only the round knob at the very end of its handle still sticks out above his belt, and his right palm presses it down. Nothing on his shoulders. His other arm hangs relaxed. Satisfied grin. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 891$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
couleur)
  # essai : la teinte de peau dérive vers le jaune ; A = consigne de couleur seule, B = consigne + le sprite d'origine en 2e référence
  T="His skin is the same warm reddish-brown tan as in the reference pictures, not yellow, not olive."
  SIT="The giant sits directly on the ground, his buttocks on the ground, both legs stretched out forward along the ground, not on a seat, one hand resting on his thigh, rubbing one eye with his other fist, drowsy half-closed eyes."
  SLP="The giant lies asleep flat on his back on the ground, his body horizontal across the picture with his head on the left and his bare feet on the right, the back of his head resting directly on the ground with nothing under it, one hand on his belly, the other arm along his body, eyes closed, mouth open snoring."
  for s in 1 2; do
    f1 t_sitA_$s.png 892$s sit "$T $SIT"
    f1 t_sleepA_$s.png 893$s sleep "$T $SLP"
    f2 t_sitB_$s.png n_start.png guide.png 892$s sit "$T Ignore the club of the second picture: it is only a color reference. $SIT"
    f2 t_sleepB_$s.png n_start.png guide.png 893$s sleep "$T Ignore the club of the second picture: it is only a color reference. $SLP"
  done;;
poses2)
  # méthode retenue (essai « couleur ») : référence 1 = lui mains vides, référence 2 = le sprite d'origine pour les couleurs, consigne
  # de teinte ; 3 essais par pose (les essais t_sitB / t_sleepB comptent aussi).
  T="His skin is the same warm reddish-brown tan as in the reference pictures, not yellow, not olive. Ignore the club of the second picture: it is only a color reference."
  g(){ out="$1"; seed="$2"; box="$3"; shift 3; f2 "$out" n_start.png guide.png "$seed" "$box" "$T $*"; }
  for s in 1 2 3; do
    g m_yawn_$s.png 901$s yawn "The giant stands and stretches, both arms raised high above his head, both hands empty fists, his mouth wide open in a huge yawn, eyes squeezed shut."
    g m_crouch_$s.png 902$s crouch "The giant bends his knees deeply, lowering himself toward the ground to sit down, one hand on his knee, his other hand reaching down toward the ground, sleepy eyes."
    g m_sit_$s.png 903$s sit "The giant sits directly on the ground, his buttocks on the ground, both legs stretched out forward along the ground, not on a seat, one hand resting on his thigh, rubbing one eye with his other fist, drowsy half-closed eyes."
    g m_lean_$s.png 904$s lean "The giant leans back toward the left of the picture, propped on one elbow on the ground, his elbow and forearm resting flat on the ground, his legs stretched forward toward the right, drowsy eyelids."
    g m_settle_$s.png 905$s settle "The giant lies down on his side on the ground, propped up on one elbow resting flat on the ground, his head resting in his hand, his body horizontal across the picture with his head on the left and his bare feet on the right, heavy drooping eyelids, about to fall asleep."
    g m_sleep_$s.png 906$s sleep "The giant lies asleep flat on his back on the ground, his body horizontal across the picture with his head on the left and his bare feet on the right, the back of his head resting directly on the ground with nothing under it, one hand on his belly, the other arm along his body, eyes closed, mouth open snoring."
    g m_prop_$s.png 907$s prop "The giant lifts his upper body from the ground, propped up on both elbows resting on the ground, his head on the left and his legs stretched forward toward the right, eyes blinking awake."
    g m_wake_$s.png 908$s wake "The giant sits up on the ground just woken, legs stretched forward, both arms stretched wide above his head, big yawn, eyes still half closed."
    g m_rise_$s.png 909$s rise "The giant gets up from the ground: he kneels on one knee, both hands pushing on his raised knee, groggy face."
  done
  T2="His skin is the same warm reddish-brown tan as in the reference pictures, not yellow, not olive."
  C="The club is exactly the club of the second picture: the same big, thick, rough-hewn wooden club with a heavy knotted end and a handle with a round knob, same size, same wood color."
  for s in 1 2 3 4; do
    o=m_poche1_$s.png; [ -f $o ] || flux-image "$K $T2 The giant stands exactly like in the first picture. $C His right hand (on the left side of the picture) holds the club by the end of its handle, the club pointing straight down along his right hip, its heavy end pushed down inside the waistband of his fur loincloth as if into a bottomless pocket: the heavy lower half of the club has already disappeared inside the loincloth, only its upper half and the handle stick out above his belt. Nothing on his shoulders. His other arm hangs relaxed. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 910$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
    o=m_poche2_$s.png; [ -f $o ] || flux-image "$K $T2 The giant stands exactly like in the first picture. $C The club has almost completely disappeared inside the waistband of his fur loincloth at his right hip (on the left side of the picture), as if into a bottomless pocket: only the round knob at the very end of its handle still sticks out above his belt, and his right palm presses it down. Nothing on his shoulders. His other arm hangs relaxed. Satisfied grin. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 911$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
mids1)
  # poses intermédiaires entre les poses clés retenues (m_*), sans cadre comme à l'origine : FLUX place le corps à mi-chemin
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  H="The giant in the in-between pose exactly halfway between the two pictures:"
  mm(){ out="$1"; a="$2"; b="$3"; seed="$4"; shift 4; [ -f "$out" ] || flux-image "$K $E $T $*" -i "$a" -i "$b" -o "$out" -s 1536x1024 --seed $seed >/dev/null 2>&1 || echo "ECHEC $out"; echo "ok $out"; }
  for s in 1 2 3; do
    mm m_msl_$s.png m_sit_1.png m_lean_2.png 920$s "$H still sitting on the ground, leaning back, his legs still stretched out, both hands moving behind him toward the ground, heavy eyelids."
    mm m_mss_$s.png m_settle_1.png m_sleep_1.png 921$s "$H rolling from his side onto his back, his head lowering to rest directly on the ground, one hand moving toward his belly, eyes nearly closed."
    mm m_mpw_$s.png m_prop_2.png m_wake_2.png 922$s "$H sitting up halfway, his upper body tilted back at forty-five degrees, both hands pressed on the ground behind him, his arms still low, his mouth starting to open in a yawn."
  done
  T2="His skin is the same warm reddish-brown tan as in the reference pictures, not yellow, not olive."
  C="The club is exactly the club of the second picture: the same big, thick, rough-hewn wooden club, thin handle with a round knob at one end, heavy knotted end at the other, same wood color."
  for s in 1 2 3 4 5 6; do
    o=m_poche1b_$s.png; [ -f $o ] || flux-image "$K $T2 The giant stands exactly like in the first picture. $C His right hand (on the left side of the picture), raised at chest height, firmly grips the handle of the club just below its round knob. The club hangs vertically beside his right hip; its heavy end is already pushed down inside the side of his fur loincloth and hidden there, as if into a bottomless pocket: the visible part of the club goes from his fist down to his belt. Nothing on his shoulders. His other arm hangs relaxed. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 923$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
    o=m_poche2b_$s.png; [ -f $o ] || flux-image "$K $T2 The giant stands exactly like in the first picture. $C The club has disappeared inside the side of his fur loincloth at his right hip (on the left side of the picture), as if into a bottomless pocket: only the round knob and the end of its handle still stick out of the waistband, and his right hand, lowered at belt height, presses down on the knob with its palm. Nothing on his shoulders. His other arm hangs relaxed. Satisfied grin. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 924$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
mids2)
  # pivot (assis jambes vers la gauche → appuyé sur le coude jambes vers la droite) et redressement (sur les coudes → assis à demi)
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  H="The giant in the in-between pose exactly halfway between the two pictures:"
  for s in 1 2 3; do
    f2 m_piv_$s.png m_sit_1.png m_lean_2.png 925$s sit "$T $H sitting on the ground, swinging his legs around, both knees bent and raised in front of his chest, his feet flat on the ground pointing toward the viewer, leaning back slightly with one hand behind him on the ground."
    f2 m_pmp_$s.png m_prop_2.png m_mpw_2.png 926$s propmpw "$T $H still lying on his side, pushing himself up on his elbow and his other hand, his shoulders and chest lifting off the ground, his legs still stretched out on the ground."
  done;;
lancer)
  # nouvelle idée de Stéphan : avant de dormir, il jette son gourdin dans le décor (vers le haut à gauche, il casse quelque chose),
  # bâille et se couche ; au réveil, debout, il sort un nouveau gourdin de derrière son dos.
  T="His skin is the same warm reddish-brown tan as in the reference pictures, not yellow, not olive."
  C="The club is exactly the club of the second picture: the same big, thick, rough-hewn wooden club with a heavy knotted end and a handle with a round knob."
  for s in 1 2 3; do
    o=m_elan_$s.png; [ -f $o ] || flux-image "$K $T $C The giant winds up to throw his club far away toward the upper left of the picture: standing with his legs apart, his body twisted, his right arm (on the left side of the picture) cocked back high behind his head holding the club by its handle, the heavy end of the club pointing behind him, his other arm stretched forward to aim, fierce grin. Exactly one club." -i n_start.png -i guide.png -b box_yawn.json -o $o -s 1536x1024 --seed 930$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
    o=m_jet_$s.png; [ -f $o ] || flux-image "$K $T The giant has just thrown his club far away: standing with his legs apart, leaning forward, his right arm (on the left side of the picture) stretched out toward the upper left of the picture with his hand wide open, following through the throw, satisfied grin. His hands are empty: there is no club and no object anywhere in the picture." -i n_start.png -i guide.png -b box_throw.json -o $o -s 1536x1024 --seed 931$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
    o=m_dos1_$s.png; [ -f $o ] || flux-image "$K $T $C The giant stands like in the first picture and reaches with his right hand (on the left side of the picture) over his right shoulder behind his back, grabbing the handle of a club hidden behind his back: only the round knob and the end of the handle stick out above his shoulder, the rest of the club is hidden behind his back. His other arm hangs relaxed. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 932$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
    o=m_dos2_$s.png; [ -f $o ] || flux-image "$K $T $C The giant stands like in the first picture and pulls his club out from behind his back over his right shoulder with his right hand (on the left side of the picture): his fist is raised above his shoulder holding the handle, the club comes up from behind his back, its heavy end still behind his shoulder. His other arm hangs relaxed. Satisfied grin. Exactly one club." -i n_start.png -i guide.png -b box_stand.json -o $o -s 1536x1024 --seed 933$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
dos)
  # sorti du dos : sans le sprite en référence (FLUX recopiait sa pose, gourdin sur l'épaule) ; gourdin en vol : seul, d'après le sprite
  T="His skin is the same warm reddish-brown tan as in the reference picture, not yellow, not olive."
  for s in 1 2 3 4; do
    o=m_dos_$s.png; [ -f $o ] || flux-image "$K $T The giant stands like in the reference picture and reaches back with his right hand (on the left side of the picture): his right elbow is raised high beside his head and his fist, just above and behind his right shoulder, grips the round knob at the end of the handle of a big wooden club hidden behind his back. Only the knob and the top of the handle stick out above his shoulder; the rest of the club is hidden behind his back. His other arm hangs relaxed, his hand empty. Exactly one club." -i n_start.png -b box_stand.json -o $o -s 1536x1024 --seed 950$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done
  for s in 1 2; do
    o=m_club_$s.png; [ -f $o ] || flux-image "Only the wooden club of the reference picture, alone, lying horizontally in the middle of the picture, its heavy knotted end on the right and its handle with the round knob on the left: same club, same size, same rough-hewn wood, same colors, same hand-painted 1990s point-and-click adventure art style, bold dark outlines. No character, no hand, nothing else. Plain flat solid magenta background, no shadow, no text." -i guide.png -b box_club.json -o $o -s 1536x1024 --seed 951$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
mids3)
  # 15/11 : ToonCrafter déforme les grands écarts (bâillement→accroupi, assis→pivot, redressé→bras levés→à genoux→debout, dos→gourdin
  # sur l'épaule) : une pose intermédiaire calculée entière entre chaque paire, à partir des deux poses voisines.
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  H="The giant in the in-between pose exactly halfway between the two pictures, his face turned toward the viewer:"
  mm(){ out="$1"; a="$2"; b="$3"; seed="$4"; shift 4; [ -f "$out" ] || flux-image "$K $E $T $*" -i "$a" -i "$b" -o "$out" -s 1536x1024 --seed $seed >/dev/null 2>&1 || echo "ECHEC $out"; echo "ok $out"; }
  for s in 1 2 3; do
    mm m_ycr_$s.png m_yawn_3.png m_crouch_3.png 930$s "$H still standing, his knees starting to bend, his arms coming down to shoulder height, his mouth closing after the yawn, sleepy eyes."
    mm m_spv_$s.png m_sit_1.png m_piv_2.png 931$s "$H sitting on the ground, his fist lowered from his eye, starting to draw his knees up toward his chest, one hand moving behind him toward the ground, drowsy eyes."
    mm m_mwk_$s.png m_mpw_2.png m_wake_2.png 932$s "$H sitting upright on the ground, legs stretched forward, both arms rising from his sides up to shoulder height, his mouth opening in a big yawn."
    mm m_wkr_$s.png m_wake_2.png m_rise_2.png 933$s "$H sitting on the ground, his arms lowered, one leg bent with its foot drawn back under him, both hands on the ground beside his hips ready to push himself up, groggy face."
    mm m_rsv_$s.png m_rise_2.png n_start.png 934$s "$H rising from one knee: half standing, both legs bent, both hands pushing on his thighs, his upper body leaning slightly forward, groggy face."
    o=m_dsc_$s.png; [ -f $o ] || flux-image "$K $T The club is exactly the club of the second picture: the same big, thick, rough-hewn wooden club with a heavy knotted end and a handle with a round knob. The giant stands like in the first picture and pulls the club out from behind his back with his right hand (on the left side of the picture): his right fist is raised just above his right shoulder gripping the handle, the club sticks up diagonally behind his head, its heavy knotted end still behind his back. His other arm hangs relaxed. Grumpy frown." -i m_dos_2.png -i guide.png -o $o -s 1536x1024 --seed 935$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
mids4)
  # mids3 refait avec un cadre (sans cadre, FLUX faisait flotter les pieds au-dessus du sol) et des consignes qui ne recopient plus
  # la pose voisine (bras levés, à genoux).
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  for s in 1 2 3; do
    f2 m_ycr4_$s.png m_yawn_3.png m_crouch_3.png 940$s ycr "$T The giant stands with his knees half bent, his feet flat on the ground, both arms lowered in front of him, his hands at hip height, his mouth closing after a yawn, sleepy eyes, his face turned toward the viewer."
    f2 m_spv4_$s.png m_sit_1.png m_piv_2.png 941$s sit "$T The giant sits directly on the ground, his face turned toward the viewer, drowsy eyes, both fists lowered in his lap, his knees half raised, his feet flat on the ground."
    f2 m_mwk4_$s.png m_wake_2.png m_mpw_2.png 942$s mwk "$T The giant sits upright on the ground, his legs stretched forward along the ground, both arms down, his hands resting flat on his thighs, his mouth starting to open in a yawn, eyes half closed."
    f2 m_wkr4_$s.png m_wake_2.png m_rise_2.png 943$s wkr "$T The giant sits on the ground with his legs folded, his buttocks on the ground, one knee bent up, both hands flat on the ground beside his hips ready to push himself up, groggy face."
    f2 m_rsv4_$s.png n_start.png m_rise_2.png 944$s rsv "$T The giant is getting up: he is almost standing, both feet flat on the ground, his knees slightly bent, no knee on the ground, both hands pushing on his thighs just above his knees, his upper body leaning a little forward, groggy face."
  done;;
dsc)
  # gourdin qui sort du dos (entre m_dos_2 et le sprite) : référence 2 = le gourdin seul (m_club_1), pour qu'il ne recopie pas la
  # pose du sprite (essais mids3 : double gourdin ou gourdin déjà sur l'épaule)
  T="His skin is the same warm reddish-brown tan as in the first picture, not yellow, not olive."
  for s in 1 2 3 4; do
    o=m_dsc5_$s.png; [ -f $o ] || flux-image "$K $T There is exactly one club: the wooden club of the second picture, same size, same rough-hewn wood. The giant stands like in the first picture, his right fist (on the left side of the picture) raised just above his right shoulder gripping the club by its handle just below the round knob; the club rises diagonally behind his head and shoulders, half pulled out from behind his back, its heavy knotted end sticking up above his left shoulder (on the right side of the picture). His other arm hangs relaxed. Grumpy frown." -i m_dos_2.png -i m_club_1.png -b box_stand.json -o $o -s 1536x1024 --seed 950$s >/dev/null 2>&1 || echo "ECHEC $o"; echo "ok $o"
  done;;
ycr5)
  # mids4 : la pose genoux à demi pliés sortait 10 % trop grande (cadre trop haut) ; cadre ramené à la hauteur d'un homme debout plié
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  for s in 1 2 3; do
    f2 m_ycr5_$s.png m_yawn_3.png m_crouch_3.png 945$s ycr5 "$T The giant stands with his knees half bent, his feet flat on the ground, both arms lowered in front of him, his hands at hip height, his mouth closing after a yawn, sleepy eyes, his face turned toward the viewer."
  done;;
mids5)
  # ToonCrafter saute encore deux écarts : couché sur le côté → assis face à nous (mpw → mwk4_3), bras levés → bras baissés
  # (yawn → ycr5_2) : une pose de plus entre chaque paire
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  for s in 1 2 3; do
    f2 m_mtw_$s.png m_mpw_2.png m_mwk4_3.png 960$s mtw "$T The giant sits up on the ground, his upper body upright and turning toward the viewer, both legs still stretched out along the ground toward the right of the picture, one hand flat on the ground beside his hip, the other hand on his thigh, his mouth open in a yawn, eyes half closed."
    f2 m_yw2_$s.png m_yawn_3.png m_ycr5_2.png 961$s yw2 "$T The giant stands straight on both legs, both arms lowering, stretched out sideways at shoulder height, his hands open, his mouth still wide open at the end of a huge yawn, eyes squeezed shut."
  done;;
mpw2)
  # m_mpw_2 (mids1, sans cadre) flotte 56 px au-dessus du sol : recalculée avec un cadre, entre m_pmp_1 et la nouvelle m_mtw_1
  T="His skin is the same warm reddish-brown tan as in both reference pictures, not yellow, not olive."
  for s in 1 2 3; do
    f2 m_mpw2_$s.png m_pmp_1.png m_mtw_1.png 962$s mpw "$T The giant sits up halfway on the ground, his buttocks and legs on the ground, his legs stretched out toward the right of the picture, his upper body tilted back at forty-five degrees, both hands pressed flat on the ground behind him, his mouth starting to open in a yawn."
  done;;
esac
echo fini $1
