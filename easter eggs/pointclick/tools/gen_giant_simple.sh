#!/bin/zsh
# Géant, version simple (16/11/2026) : poses existantes de la série m_ (sans gourdin) gardées, sauf le lancer m_jet, ~20 % trop grand.
# Recalcul entier du lancer avec une boîte réduite à la taille de son sprite (box_sjet.json), 4 graines, choix sur planche.
cd "$(dirname "$0")/../work/sleep/giant" || exit 1
K="Exactly the same character as in the reference picture: same face, same body, same costume and accessories, same hand-painted 1990s point-and-click adventure art style, same colors, same bold dark outlines. Same camera, same scale and same ground level as the reference: the ground is the horizontal line where the feet stand in the reference. His head and his body are exactly the same size as in the reference picture: he is not closer to the camera. Full body entirely visible, plain flat solid magenta background, no shadow, no ground, no text. His skin is the same warm reddish-brown tan as in the reference pictures, not yellow, not olive."
for s in 1 2 3 4; do
  o=s_jet_$s.png; [ -f $o ] || flux-image "$K The giant has just thrown his club far away: standing with his legs apart, leaning forward, his right arm (on the left side of the picture) stretched out toward the upper left of the picture with his hand wide open, following through the throw, satisfied grin. His hands are empty: there is no club and no object anywhere in the picture." -i n_start.png -i guide.png -b box_sjet.json -o $o -s 1536x1024 --seed 942$s >/dev/null 2>&1 && echo "ok $o" || echo "ÉCHEC $o"
done
echo fini
# dort (m_sleep) : trop petit à côté de « assis » et « allongé » -> recalcul entier, boîte agrandie (box_ssleep.json), références guide + m_settle_1 (bonne échelle)
for s in 1 2 3 4; do
  o=s_sleep_$s.png; [ -f $o ] || flux-image "$K His head is exactly the same size as in the second reference picture, where he lies on his side. The giant lies asleep on his back on the ground, his body horizontal across the picture with his head on the left and his bare feet on the right, hands resting on his belly, eyes closed, mouth open snoring. His hands are empty: no club and no object anywhere in the picture." -i guide.png -i m_settle_1.png -b box_ssleep.json -o $o -s 1536x1024 --seed 964$s >/dev/null 2>&1 && echo "ok $o" || echo "ÉCHEC $o"
done
echo fini dort
# réveil (m_wake) : trop petit à côté de « dort » et « à genoux » -> recalcul entier, boîte agrandie (box_swake.json), références guide + m_rise_2 (bonne échelle)
for s in 1 2 3 4; do
  o=s_wake_$s.png; [ -f $o ] || flux-image "$K His head is exactly the same size as in the second reference picture, where he kneels. The giant has just woken up: he sits on the ground with his legs bent in front of him, stretching both arms wide up above his head with open hands, mouth wide open in a big yawn, eyes squeezed shut. His hands are empty: no club and no object anywhere in the picture." -i guide.png -i m_rise_2.png -b box_swake.json -o $o -s 1536x1024 --seed 975$s >/dev/null 2>&1 && echo "ok $o" || echo "ÉCHEC $o"
done
echo fini réveil
