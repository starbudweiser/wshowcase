#!/bin/zsh
# Nazim, version simple (16/11/2026) : ses poses clés étaient calculées 15 à 40 % trop grandes (il grossissait puis rétrécissait).
# Recalcul entier de 6 poses avec des boîtes réduites à la taille de son sprite (box_s<pose>.json), 4 graines, choix sur planche des têtes.
cd "$(dirname "$0")/../work/sleep/nazim" || exit 1
K="Exactly the same character as in the reference picture: same face, same body, same costume and accessories, same hand-painted 1990s point-and-click adventure art style, same colors, same bold dark outlines. Same camera, same scale and same ground level as the reference: the ground is the horizontal line where the feet stand in the reference. His head is exactly the same size as in the reference picture: he is not closer to the camera. Full body entirely visible, plain flat solid magenta background, no shadow, no ground, no text."
e(){ out="s_$1_$2.png"; [ -f "$out" ] || flux-image "$K $3" -i guide.png -b "box_s$1.json" -o "$out" -s 1536x1024 --seed $((7700+$2*10+$4)) >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 1 2 3 4; do
  e climb $s "The nobleman climbs up out of a pit: he is bent forward with both palms pressed down at hip height as if pushing himself up onto a ledge, one knee raised high, his long robe hitched up, annoyed grimace." 1
  e sit $s "The nobleman sits down on the ground with exaggerated dignity, legs crossed in front of him, his embroidered robe spread around him, rubbing one eye, drowsy." 2
  e settle $s "The nobleman lies down on his back on the ground, his body horizontal across the picture with his head on the left and his black boots on the right, propped up on both elbows, heavy drooping eyelids." 3
  e sleep $s "The nobleman lies asleep on his back on the ground, his body horizontal across the picture with his head on the left and his black boots on the right, hands folded on his chest like a stone effigy, nose in the air, eyes closed, mouth open snoring, his robe spread neatly around him." 4
  e yawn $s "The nobleman stands and stretches, both arms raised high above his head, his mouth wide open in a big yawn, eyes closed, nose still in the air." 6
  e rise $s "The nobleman gets up from the ground: he kneels on one knee, brushing dust off his robe with one hand, the other hand on his raised knee, annoyed look." 5
done
echo fini
