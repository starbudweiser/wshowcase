#!/bin/zsh
# Génie des indices (23/11/2026) : poses du génie n° 2 retenu par Stéphan (work/genie/genie_2.png = pose de base, bras croisés),
# 4 graines par pose, choix sur planche avant tout montage. Plus les accessoires de ses apparitions : lampe (inventaire),
# taupinière, portail d'Oblivion. FLUX 3 Klein local, gratuit, relançable (saute ce qui existe), file calcul-lourd d'elle-même.
cd "$(dirname "$0")/../work/genie" || exit 1
K="Exactly the same character as in the reference picture: the same blue-skinned Nordic lamp genie with the same face, the same long braided white beard with iron rings, the same horned iron Viking helmet, the same fur mantle, the same gold bracelets, the same leather belt with a big gold buckle and the same swirling blue magic smoke tail instead of legs, same hand-painted 1990s point-and-click adventure art style, same colors, same bold dark outlines, same size in the picture. Whole character visible with a margin around it, plain flat solid magenta background, no shadow, no ground, no text."
p(){ out="pose_$1_$2.png"; [ -f "$out" ] || flux-image "$K $3" -i genie_2.png -o "$out" -s 1024x1280 --seed $((5200+$2*10+$4)) >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 1 2 3 4; do
  p idle2 $s "Exactly the same floating pose as the reference, arms crossed, but he rolls his eyes up to the sky with a long weary theatrical sigh, mouth closed, utterly bored." 1
  p talk $s "Exactly the same floating pose as the reference, arms crossed, but his mouth is wide open as if speaking, one bushy eyebrow raised, sarcastic look." 2
  p tada $s "He has just appeared in a theatrical burst: both arms flung wide open above his shoulders, palms up, chest out, a big smug showman grin, eyes half closed with self-satisfaction." 3
  p flat $s "He has just crashed down and lies flat on his belly, his body horizontal across the picture as if on an invisible floor, his head on the left resting on his chin, his arms spread out flat, his blue smoke tail lying limp on the right, his helmet knocked crooked, dizzy eyes, deadpan annoyed expression." 4
  p scorch $s "Exactly the same floating pose as the reference, arms crossed, but he has just been blasted out of a fire portal: his blue skin is smudged with black soot, his white beard is singed, frizzy and smoking with thin wisps of grey smoke, his fur mantle is scorched, his helmet is blackened, deadpan furious stare." 5
done
S="hand-painted 1990s adventure game art, bold dark outlines, saturated warm colors, detailed painterly shading, centered on a plain flat solid magenta background, no shadow, no text, no characters, no faces"
o(){ out="$1_$2.png"; [ -f "$out" ] || flux-image "$3 $S" -o "$out" -s $4 --seed $((5300+$2*10+$5)) >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
for s in 1 2 3; do
  o lamp $s "Inventory item icon: a single battered old brass oil lamp, a genie lamp with a long curved spout and a small lid, dented, tarnished, with Nordic knotwork engraved on its belly, seen from the side." 1024x1024 1
  o mound $s "A fresh molehill of dark brown earth with small stones and a few tufts of grass, seen from the side, a small heap of freshly dug soil." 1024x1024 2
  o portal $s "A round fiery Oblivion gate portal from a dark fantasy game, a tall oval of swirling red and orange fire framed by black jagged volcanic stone spikes, seen from the front." 1024x1280 3
done
echo fini
