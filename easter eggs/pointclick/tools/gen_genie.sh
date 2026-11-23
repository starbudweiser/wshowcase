#!/bin/zsh
# Génie des indices (22/11/2026) : planche de propositions du personnage à faire valider avant toute pose ou animation.
# Génie de lampe version Bordeciel, même style peint que le héros (référence ch2_hero.png), fond magenta uni pour l'incrustation.
# FLUX 3 Klein local, gratuit, relançable (saute ce qui existe), passe de lui-même par la file calcul-lourd.
cd "$(dirname "$0")/../work/genie" || exit 1
P="Full body character design of a comic Nordic lamp genie for a hand-painted 1990s point-and-click adventure game, exactly the same detailed painted cartoon illustration style, line work and colors as the reference image. An adult man, a big muscular blue-skinned genie whose body ends below the waist in a swirling tail of blue magic smoke instead of legs, floating. Long braided white beard with iron rings, bushy eyebrows, a horned iron Viking helmet slightly too small for his head, heavy gold bracelets on both wrists, a fur mantle over his shoulders, a leather belt with a big gold buckle. Bored, slightly grumpy, sarcastic expression, arms crossed. Plain flat magenta background, no shadow, no text, the whole character visible with a margin around it."
g(){ out="$1"; seed="$2"; shift 2; [ -f "$out" ] || flux-image "$@" -o "$out" --seed $seed >/dev/null 2>&1; echo "ok $out"; }
for s in 1 2 3 4 5 6 7 8; do g genie_$s.png $((1300+s)) "$P" -i ../ch2_hero.png -s 1024x1280; done
echo done
