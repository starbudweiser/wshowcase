#!/bin/zsh
# Tenues d'esprit Skyrim (étape A) puis images d'animation de chaque personnage (étape B). FLUX 3 Klein local, gratuit, un calcul à la fois.
# Relançable : saute ce qui existe. Les sorties : work/ch2_*.png (nouvelles tenues) et work/an_<perso>_<image>.png.
cd "$(dirname "$0")/../work" || exit 1
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body, no shadow."
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
# ───── A. tenues du lore de Skyrim ─────
R="Exactly the same character, same face, same pose, same art style, same plain flat magenta background, full body, no shadow."
e ch2_hero.png ch_hero_32.png 301 "$R Re-dress him in authentic Skyrim Nord iron armor: a horned iron helmet, a studded iron cuirass over a fur-trimmed leather tunic, a thick fur mantle over the shoulders, leather bracers, a belt with pouches, heavy hide boots, a round wooden shield with an iron boss on his back."
e ch2_merchant.png ch_merchant_51.png 302 "$R Re-dress him as an authentic Skyrim Nord shopkeeper: a fur-trimmed red-brown linen tunic under a leather apron, a wide belt with coin pouches and keys, a fur collar, fur-lined boots. Keep the bushy handlebar mustache and the bald head with side tufts."
e ch2_guard.png ch_guard_62.png 303 "$R Re-dress him as an authentic Whiterun-style hold guard of Skyrim: an iron helmet with open face and cheek guards, a chainmail shirt under a long yellow-brown tabard with a white horse emblem, leather bracers, a round shield on his arm. Keep the spear, the deadpan face and the small arrow in his knee."
e ch2_horse.png ch_horse.png 304 "$R Add authentic Skyrim Nord horse tack: a brown leather saddle with a thick fur blanket, a bridle with iron fittings, a braided mane with leather ties. Same horse, same side profile."
# ───── B. poses d'animation ─────
# héros : marche de profil (3 images), debout de profil, parole, repos
e an_hero_walkA.png ch2_hero.png 311 "$K The character walking to the right in full right side profile, right leg stepping far forward, left arm swinging forward, mouth closed, wry smirk."
e an_hero_walkP.png ch2_hero.png 312 "$K The character walking to the right in full right side profile, passing step with legs close together and the back knee raised, arms swinging, wry smirk."
e an_hero_walkB.png ch2_hero.png 313 "$K The character walking to the right in full right side profile, left leg stepping far forward, right arm swinging forward, wry smirk."
e an_hero_stand.png ch2_hero.png 314 "$K The character standing in full right side profile, feet together, relaxed, wry smirk."
e an_hero_talk.png ch2_hero.png 315 "$K The character standing facing the viewer, mouth wide open talking, one hand raised gesturing."
e an_hero_idle2.png ch2_hero.png 316 "$K The character standing facing the viewer relaxed, head tilted up looking at the sky, one hand on the belt."
# marchand
e an_merchant_idle2.png ch2_merchant.png 321 "$K The character with both arms spread wide presenting his goods, greedy grin."
e an_merchant_talk1.png ch2_merchant.png 322 "$K The character talking, mouth wide open, one finger raised, eyebrows raised."
e an_merchant_talk2.png ch2_merchant.png 323 "$K The character talking, mouth wide open, leaning forward with both palms open, sly look."
e an_merchant_bucket.png ch2_merchant.png 324 "$K A wooden bucket with iron bands is stuck over his entire head, covering his eyes and nose, only the mustache and chin stick out below the bucket, arms raised in panic."
# garde
e an_guard_idle2.png ch2_guard.png 331 "$K The character shifting his weight to the other leg, eyes rolled to the side with a bored look."
e an_guard_talk.png ch2_guard.png 332 "$K The character talking, mouth open, one hand raised in a lazy gesture, deadpan eyes."
e an_guard_walkA.png ch2_guard.png 333 "$K The character walking to the right in full right side profile, right leg stepping far forward, carrying the spear."
e an_guard_walkB.png ch2_guard.png 334 "$K The character walking to the right in full right side profile, left leg stepping far forward, carrying the spear."
# poule, cheval
e an_hen_peck.png ch_hen_74.png 341 "Exactly the same hen, same art style, same magenta background, no shadow. The hen bending forward with her head down pecking at the ground."
e an_hen_walk.png ch_hen_74.png 342 "Exactly the same hen, same art style, same magenta background, no shadow. The hen walking to the right, one foot raised, head held high."
e an_horse_idle2.png ch2_horse.png 351 "$K The horse with its head lowered grazing, tail swishing."
e an_horse_walkA.png ch2_horse.png 352 "$K The horse walking to the right in full side profile, front right leg lifted high."
e an_horse_walkB.png ch2_horse.png 353 "$K The horse walking to the right in full side profile, front left leg lifted high."
e var_horse_ride2.png ch2_hero.png 354 "The horned-helmet hero from the first image sitting in the saddle of the horse from the second image, riding to the right in full side profile, same art style, same plain flat magenta background, no shadow." -i ch2_horse.png
# géant, Nazim
e an_giant_idle2.png ch_giant.png 361 "$K The giant standing with his eyes closed sleeping, head tilted, chest expanded breathing in."
e an_giant_talk.png ch_giant.png 362 "$K The giant shouting, mouth wide open, angry eyebrows, club on shoulder."
e an_giant_walkA.png ch_giant.png 363 "$K The giant walking to the right in full right side profile, right leg far forward, club on shoulder."
e an_giant_walkB.png ch_giant.png 364 "$K The giant walking to the right in full right side profile, left leg far forward, club on shoulder."
e an_nazim_idle2.png ch_nazim.png 371 "$K The nobleman with his nose raised high, one hand on his chest, eyes closed in disdain."
e an_nazim_talk.png ch_nazim.png 372 "$K The nobleman talking haughtily, mouth open, one finger raised, eyebrows raised."
# aveugles : tâtonnement (2e image) et danse (2e image)
e an_pot_grope2.png blind_pot.png 381 "$K The character with the pot on his head groping blindly, arms stretched out to the other side, body twisted."
e an_pot_dance2.png lit_pot.png 382 "$K The character dancing wildly, one leg kicked high, arms flung up to the other side, huge joyful smile."
e an_sack_grope2.png blind_sack.png 383 "$K The character with the sack on his head groping blindly, arms stretched out to the other side, body twisted."
e an_sack_dance2.png lit_sack.png 384 "$K The character dancing wildly, one leg kicked high, arms flung up to the other side, huge joyful smile."
e an_hat_grope2.png blind_hat.png 385 "$K The character with the fur hat over his eyes groping blindly with his free hand to the other side, spear tilted."
e an_hat_dance2.png lit_hat.png 386 "$K The character dancing wildly, one leg kicked high, arms flung up to the other side, huge joyful smile."
echo done
