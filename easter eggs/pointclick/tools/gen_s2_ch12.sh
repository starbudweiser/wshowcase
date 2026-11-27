#!/bin/zsh
# Saison 2, chapitre 12 : file de génération de la nuit (décors, objets, accessoires, métamorphoses du Wabbajack, boucles LTX).
cd "$(dirname "$0")/.." || exit 1
PS="${PS:-work/crossover/persos}"
tools/gen_s2_decors.sh d_sammax_a:1 d_sammax_a:2 d_sammax_a:3 d_sammax_b:1 d_sammax_b:2 d_sammax_b:3
tools/gen_s2_items.sh i_sweetroll i_cheese12 p_car12 p_car12:2 p_cart12 p_cart12:2 p_cheesegiant p_cheesegiant:2 p_twinebuckets p_twinebuckets:2
mkdir -p work/s2play/persos
K="the whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text."
f(){ out="work/s2play/persos/$1.png"; [ -f "$out" ] || flux-image "$2 $K" -i "$3" -s 1024x1280 --seed $4 -o "$out"; }
for sd in 1 2; do
  f max_calm_$sd "Exactly the same white rabbit character as in the reference picture, same face, same proportions, same painted style, but completely calm and serene: sitting cross-legged, eyes half closed, holding a small cup of herbal tea with both paws, a peaceful small smile." $PS/c_rabbit2_1.png $((710+sd))
  f sam_wolf_$sd "Exactly the same dog detective character as in the reference picture, same suit, same tie, same hat, same painted style, but transformed into a huge hairy werewolf: wolf head with fangs, clawed hands, bushy grey fur bursting out of his collar and sleeves, still wearing his suit, tie and hat, standing, a sheepish embarrassed look." $PS/c_dog3_2.png $((720+sd))
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle and the same costume for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: the character of the image. ACTION: $2 $MAG" -o "$out" -d $3 -s 768x960 -i "$4" -i "$4" --seed $5 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l max_i "the hyperactive rabbit can't stay still: hops on the spot, twitches his ears, looks around with a crazy grin, then comes back to the starting pose." 3 $PS/c_rabbit2_1.png 731
l max_t "he talks in place, hyper excited: the mouth opens and closes clearly as if speaking a line, ears twitching, little hops, then comes back to the starting pose." 2.5 $PS/c_rabbit2_1.png 732
l sam_i "stays in place, alive: breathes calmly, blinks, adjusts his tie, small polite movements of the head and hands, then comes back to the starting pose." 3 $PS/c_dog3_2.png 733
l sam_t "he talks in place politely: the mouth opens and closes clearly as if speaking a line, the eyebrows move, small courteous hand gestures, then comes back to the starting pose." 2.5 $PS/c_dog3_2.png 734
echo fini
