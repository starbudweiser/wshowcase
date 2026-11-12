#!/bin/zsh
# Animations détaillées du héros (qualité supérieure aux autres personnages) : marche de profil en 8 phases, marche de face et de dos,
# repos, parole, gestes, portrait en gros plan pour la nuit. FLUX 3 Klein local, gratuit, relançable (saute ce qui existe).
cd "$(dirname "$0")/../work" || exit 1
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body, no shadow."
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
R=ch2_hero.png; P="in full right side profile facing right"
# marche de profil : 8 phases (contact, descente, passage, montée, puis l'autre jambe)
e hw_1.png $R 801 "$K The character walking $P, contact pose: right leg stretched far forward with the heel touching the ground, left leg far behind on its toes, arms swinging opposite, body leaning slightly forward."
e hw_2.png $R 802 "$K The character walking $P, down pose: front knee bent, body at its lowest point, weight on the front foot, back leg trailing."
e hw_3.png $R 803 "$K The character walking $P, passing pose: standing on one straight leg, the other leg passing under the body with the knee lifted, arms close to the body."
e hw_4.png $R 804 "$K The character walking $P, up pose: body at its highest, rising on the toes of the front foot, back leg lifted behind."
e hw_5.png $R 805 "$K The character walking $P, contact pose: left leg stretched far forward with the heel touching the ground, right leg far behind on its toes, arms swinging opposite, body leaning slightly forward."
e hw_6.png $R 806 "$K The character walking $P, down pose: left front knee bent, body at its lowest point, weight on the front foot, back leg trailing."
e hw_7.png $R 807 "$K The character walking $P, passing pose: standing on one straight leg, the other leg passing under the body with the knee lifted, arms close to the body."
e hw_8.png $R 808 "$K The character walking $P, up pose: body at its highest, rising on the toes of the front foot, back leg lifted behind."
# profil : repos, parole, gestes
e hs_idle2.png $R 811 "$K The character standing $P, relaxed, chest expanded breathing in, shoulders slightly raised, wry smirk."
e hs_talk1.png $R 812 "$K The character standing $P, mouth open talking, one hand raised gesturing, eyebrows raised."
e hs_talk2.png $R 813 "$K The character standing $P, mouth half open talking, hand lowered, head tilted."
e hs_reach.png $R 814 "$K The character $P reaching forward with one arm stretched out to grab something, body leaning forward, other leg behind."
e hs_pick.png $R 815 "$K The character $P crouching down with knees bent, one hand reaching to the ground to pick something up."
# de face : marche vers l'écran, repos, clignement, gestes
e hf_walkA.png $R 821 "$K The character walking straight toward the viewer, seen from the front, left foot stepping forward, arms swinging."
e hf_walkP.png $R 822 "$K The character walking straight toward the viewer, seen from the front, passing step with feet together, arms at his sides."
e hf_walkB.png $R 823 "$K The character walking straight toward the viewer, seen from the front, right foot stepping forward, arms swinging."
e hf_blink.png $R 824 "$K The character standing facing the viewer, eyes closed blinking, wry smirk."
e hf_talk2.png $R 825 "$K The character standing facing the viewer, mouth wide open shouting, both hands raised."
e hf_shrug.png $R 826 "$K The character standing facing the viewer, shrugging with both palms up, eyebrows raised, awkward grin."
e hf_surprise.png $R 827 "$K The character standing facing the viewer, eyes wide open, mouth open in shock, hands raised, body leaning back."
# de dos : marche en s'éloignant, immobile
e hb_stand.png $R 831 "$K The character standing seen from behind, back to the viewer, shield on his back, horned helmet seen from behind."
e hb_walkA.png $R 832 "$K The character walking away from the viewer, seen from behind, left foot stepping forward, arms swinging."
e hb_walkB.png $R 833 "$K The character walking away from the viewer, seen from behind, right foot stepping forward, arms swinging."
# portrait en gros plan (nuit) : neutre, parole, clignement
F="close-up bust portrait of the same character, head and shoulders filling the frame, same horned iron helmet, same face, same painting style, plain flat solid magenta background, no text."
e hp_neutral.png $R 841 "$F Looking straight at the viewer with a wry smirk, eyebrows slightly raised."
e hp_talk.png hp_neutral.png 842 "The same close-up portrait, same style, same magenta background, mouth wide open talking, eyebrows raised."
e hp_blink.png hp_neutral.png 843 "The same close-up portrait, same style, same magenta background, eyes closed, wry smirk."
e hp_sleepy.png hp_neutral.png 844 "The same close-up portrait, same style, same magenta background, half-closed tired eyes, a yawning wide open mouth."
echo done
