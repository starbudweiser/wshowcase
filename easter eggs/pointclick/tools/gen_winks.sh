#!/bin/zsh
# Personnages des clins d'œil (scénettes aléatoires) : 2 images par personnage (marche A / B ou deux poses). FLUX local, gratuit, relançable.
cd "$(dirname "$0")/../work" || exit 1
SP="full body game sprite, hand-painted 1990s PC point-and-click adventure game art, sarcastic cartoon style with realistic adult proportions, detailed painterly shading, bold dark outlines, saturated warm colors, plain flat solid magenta background, no shadow, no text"
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body, no shadow."
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" -s 1024x1024 >/dev/null 2>&1; echo "ok $out"; }
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
n=2000
walker(){ k="$1"; desc="$2"; n=$((n+10)); g wk_${k}_a.png "$desc, walking to the right in full right side profile, left foot forward. $SP" --seed $n; e wk_${k}_b.png wk_${k}_a.png $((n+1)) "$K The character walking to the right in full right side profile, right foot forward, mid-stride, arms swinging the other way."; }
walker explorer "An adventurous archaeologist in a brown fedora, leather jacket, khaki trousers, a coiled whip on his belt and a satchel, running in panic"
g wk_boulder.png "A gigantic perfectly round grey stone boulder with cracks and moss, like a giant ball, seen from the side. $SP" --seed 2025 -s 1024x1024
walker buster "A paranormal exterminator in a tan khaki jumpsuit with patches, wearing a big grey nuclear-style backpack with a flexible cable connected to a glowing handheld wand, goggles and a utility belt, running"
g wk_ghost_a.png "A cute fat green slimy ghost with a huge open mouth, little stubby arms, no legs, dripping slime, floating, mischievous. $SP" --seed 2051
e wk_ghost_b.png wk_ghost_a.png 2052 "$K The same ghost, floating with its mouth wide open laughing, arms raised, tilted body, slime flying."
g wk_racer_a.png "A flying reptilian creature like a winged lizard with a long beak, big leathery gray-brown wings raised up, screeching, seen in full side profile facing left. $SP" --seed 2061
e wk_racer_b.png wk_racer_a.png 2062 "Exactly the same creature, same style and colors, same magenta background, wings swept down below its body, same side profile facing left."
g wk_tentacle_a.png "A bouncing purple tentacle creature standing upright like a fat worm, one big cartoon eye, a mischievous toothy grin, tiny arms, glossy purple skin. $SP" --seed 2071
e wk_tentacle_b.png wk_tentacle_a.png 2072 "$K The same purple tentacle creature, stretched tall and thin while jumping, grin wider."
g wk_owl_a.png "A big white and brown owl flying with wings spread wide, seen in full side profile facing right. $SP" --seed 2081
e wk_owl_b.png wk_owl_a.png 2082 "Exactly the same owl, same style, same magenta background, wings swept down, same side profile facing right."
e wk_owl_f.png wk_owl_a.png 2083 "The same owl seen from the front, staring directly at the viewer with huge round yellow eyes, wings folded, perched in the air, same style, same magenta background, full body, no shadow."
walker kids "A group of three kids in 1980s clothes with bandanas and backpacks, one with glasses, running together side by side"
walker barbarian "A muscular barbarian warrior with long black hair, fur loincloth, leather straps, a huge broadsword over his shoulder, grim face"
walker wizard "A tall old wizard in a long grey cloak and a pointed grey hat, long white beard, holding a wooden staff"
walker halfling "A short cheerful halfling with curly brown hair, big bare hairy feet, green vest, holding a fruit pie"
walker handyman "A man with a long 1990s mullet haircut, denim jacket, a swiss army knife in one hand and a roll of duct tape in the other, resourceful grin"
walker simon "A grumpy teenage wizard in a purple pointed hat, jeans and sneakers, earring, a small wand, sulking with a frown"
walker pirate "A young pirate with a blond ponytail, white puffy shirt, blue coat, thin sword at his belt, cheeky grin"
walker graham "A friendly young knight-adventurer wearing a floppy adventurer cap with a long red feather, a blue tunic with white collar, brown leggings and boots, a small satchel, cheerful smile"
walker agent "A serious FBI-style agent in a black suit and tie, dark hair swept up, holding a small tape recorder to his mouth, deadpan"
g wk_troll_a.png "A small green bridge troll peeking up from below, only head, big nose, tusks and wide eyes and two hands holding a small club visible, grumpy. $SP" --seed 2201
e wk_troll_b.png wk_troll_a.png 2202 "$K The same troll, now laughing with mouth wide open, club raised."
e wk_horsearmor.png ch2_horse.png 2210 "$K The same horse, same side profile, now wearing absurd shiny silver plate armor over its body and head, silly and proud."
echo done
