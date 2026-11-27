#!/bin/zsh
# Saison 2, chapitre 27, 2e file : boucles LTX du héros en dessin animé (marche de profil, de face, de dos ; repos et parole) et des
# personnages du garage (savant, petit-fils, créature bleue). Vues clés retenues : work/s2play/toon/sel_toon_*.png.
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
PS="${PS:-work/crossover/persos}"; T=work/s2play/toon
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same cartoon drawing style with flat colors and thick black outlines, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
V="the cartoon Viking of the image"
l toon_wr "$V, seen in side profile facing right." "he walks in place like on a treadmill, a regular cartoon walk cycle: legs swing forward and back, arms swing opposite, the body stays at the same spot and never turns, then he is back in the starting pose." 2 $T/sel_toon_pr.png 2971
l toon_wf "$V, seen from the front." "he walks in place toward us like on a treadmill, a regular cartoon walk cycle: legs step alternately, arms swing, the body stays at the same spot and keeps facing us, then he is back in the starting pose." 2 $T/sel_toon_f.png 2972
l toon_wb "$V, seen from behind." "he walks in place away from us like on a treadmill, a regular cartoon walk cycle: legs step alternately, arms swing, the body stays at the same spot and keeps his back to us, then he is back in the starting pose." 2 $T/sel_toon_b.png 2973
l toon_iqr "$V, seen in three-quarter view." "he stays in place, alive and nervous: breathes, blinks his big round eyes, a drop of sweat, shifts his weight, then comes back to the starting pose." 3 $T/sel_toon_qr.png 2974
l toon_if "$V, seen from the front." "he stays in place, alive and nervous: breathes, blinks his big round eyes, looks around, then comes back to the starting pose." 3 $T/sel_toon_f.png 2975
l toon_tqr "$V, seen in three-quarter view." "he talks in place: the mouth opens and closes clearly as if speaking a line, eyebrows move, then he comes back to the starting pose." 2.5 $T/sel_toon_qr.png 2976
l toon_tf "$V, seen from the front." "he talks in place: the mouth opens and closes clearly as if speaking a line, eyebrows move, then he comes back to the starting pose." 2.5 $T/sel_toon_f.png 2977
l madsci_i "the old cartoon scientist with spiky grey hair and a lab coat of the image holding a flask." "he stays in place, alive and drunk: sways a little, burps, squints, takes a sip from his flask, then comes back to the starting pose." 3 $PS/c_madsci2_1.png 2981
l madsci_t "the old cartoon scientist with spiky grey hair and a lab coat of the image holding a flask." "he talks in place grumpily: the mouth opens and closes clearly as if speaking a line, one burp, then he comes back to the starting pose." 2.5 $PS/c_madsci2_1.png 2982
l grandson_i "the anxious cartoon boy in a yellow t-shirt of the image." "he stays in place, alive and anxious: breathes fast, wrings his hands, glances left and right, a drop of sweat, then comes back to the starting pose." 3 $PS/c_grandson_2.png 2983
l grandson_t "the anxious cartoon boy in a yellow t-shirt of the image." "he talks in place nervously: the mouth opens and closes clearly as if speaking a line, hands shaking, then he comes back to the starting pose." 2.5 $PS/c_grandson_2.png 2984
l bluegenie_i "the tall blue cartoon creature of the image waving." "it stays in place, alive and eager: bounces a little, waves its arm, a huge grin, then comes back to the starting pose." 3 $PS/c_bluegenie_1.png 2985
l bluegenie_t "the tall blue cartoon creature of the image waving." "it talks in place cheerfully: the big mouth opens and closes clearly as if speaking a line, then it comes back to the starting pose." 2.5 $PS/c_bluegenie_1.png 2986
echo fini
