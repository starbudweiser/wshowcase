#!/usr/bin/env python3
"""Casting des voix de la saison 2 dans mCASTING (demande de Stéphan du 24/11/2026).

Écrit crossover/casting_s2_import.json (format mcasting-project/1) et crossover/casting_s2_choix.json
(voix proposée et voix de rechange par personnage, résolues dans la bibliothèque de mCASTING).
Usage : casting_s2.py <export de search_voices (json)> <export du projet saison 1 (json)>
Choix de Stéphan : House garde la voix du narrateur (gag), clones de la bibliothèque là où ils existent
(Doc Brown, Indiana Jones, Sam Neill VF, Schwarzenegger), voix de la saison 1 reprises pour Arthur,
Perceval, Karadoc et le magicien gris. Monstres : cris générés par mCASTING (kind creature).
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'crossover')

# id, nom, rôle (anglais, pour la voix), kind, notes, répliques fr, répliques en, specs de voix (proposée puis rechange)
# Une spec : identifiant de voix ('=id') ou filtre (genre, âge, hauteur, ton, morceau de recette).
C = [
 ('hero', 'Héros', 'dry sarcastic young adventurer, deadpan humor (same voice as season 1)', 'human', 'Voix de la saison 1.',
  ['Chez nous, ça appartient à celui qui l’a dans son inventaire.', 'Vous n’avez jamais vu mon inventaire.'],
  ['Where I’m from, it belongs to whoever has it in their inventory.', 'You’ve never seen my inventory.'],
  ['=clone-69b43c3c']),
 ('narr', 'Narrateur', 'sarcastic theatrical narrator (same voice as season 1)', 'human',
  'Voix de la saison 1. Le Dr House a la même voix : le narrateur s’en offusque.',
  ['Deux blonds à queue de cheval sur le même quai. Je ne sais plus lequel suivre.', 'Hé ! C’est ma voix, ça. Rendez-la-moi.'],
  ['Two blond ponytails on the same dock. I no longer know which one to follow.', 'Hey! That’s my voice. Give it back.'],
  ['=clone-ca7cfe8c']),
 ('sheo', 'Sheogorath', 'Daedric prince of madness, manic theatrical old man, wild swings between whisper and shout, delighted by chaos', 'human', 'Fil rouge de la saison.',
  ['Une poule ! Classique. Je ne m’en lasse pas.', 'Un seau-portail, mon petit. Rapporte-moi du fromage, de chaque monde !'],
  ['A chicken! A classic. Never gets old.', 'A portal bucket, my boy. Bring me cheese, from every world!'],
  [('man', 'senior', None, 'pompous and theatrical'), '=clone-7896f5d8']),
 ('guybrush', 'Apprenti pirate', 'skinny eager young wannabe pirate, goofy, hopeful, talks a lot', 'human', 'Chapitre 11.',
  ['Hé, toi. T’es enfin réveillé. Toi aussi tu veux devenir pirate ?', 'Je peux retenir ma respiration dix minutes !'],
  ['Hey, you. You’re finally awake. You want to be a pirate too?', 'I can hold my breath for ten minutes!'],
  [('man', 'young', 'high', 'cheerful and bright'), '=man-x20']),
 ('lechuck', 'Capitaine fantôme', 'hulking evil ghost pirate captain, booming menacing laugh', 'creature', 'Chapitre 11.',
  ['Ce trésor est à moi ! Personne ne vole le capitaine fantôme !', 'Une bière de racine ? Non… pas ça !'],
  ['That treasure is mine! Nobody robs the ghost captain!', 'Root beer? No… not that!'],
  ['=creature-ghost-5', '=creature-ghost-1']),
 ('swordmaster', 'Maître d’armes', 'lanky sneering pirate swordsman, smug, theatrical insults', 'human', 'Chapitre 11.',
  ['Mes insultes ont fait pleurer des amiraux.', 'Tu te bats comme un garde de Bordeciel.'],
  ['My insults have made admirals weep.', 'You fight like a Skyrim guard.'],
  [('man', 'adult', None, 'pompous and theatrical'), ('man', 'adult', None, 'mischievous')]),
 ('parrot', 'Perroquet', 'scruffy sarcastic tavern parrot', 'animal', 'Chapitre 11.',
  ['Coco veut un biscuit. Coco veut le trésor.', 'FUS RO DAH !'],
  ['Polly wants a cracker. Polly wants the treasure.', 'FUS RO DAH!'],
  ['=animal-parrot-1', '=animal-parrot-3']),
 ('sam', 'Chien détective', 'tall calm dog detective, polite, verbose, deadpan', 'animal', 'Chapitre 12.',
  ['Range ce bâton.', 'Je ne le reconnais plus. C’est affreux.'],
  ['Put that stick away.', 'I don’t recognise him. It’s horrible.'],
  ['=animal-dog-2', ('man', 'adult', 'low', 'dry and deadpan')]),
 ('max', 'Lapin surexcité', 'small hyperactive rabbit-like creature, manic, gleefully violent', 'animal', 'Chapitre 12.',
  ['Hé, toi ! T’es enfin réveillé ! On peut le garder, Sam ?', 'C’est pas un bâton, c’est le mien maintenant !'],
  ['Hey, you! You’re finally awake! Can we keep him, Sam?', 'It’s not a stick, it’s mine now!'],
  ['=animal-rabbit-3', '=animal-rabbit-1']),
 ('villager', 'Villageois carré', 'blocky villager who only grunts hmm between words', 'human', 'Chapitre 13.',
  ['Hmm. Hé, toi. Hmm. T’es enfin réveillé. Hmm.', 'Hmm. Une émeraude ? Hmm. Hmm.'],
  ['Hmm. Hey, you. Hmm. You’re finally awake. Hmm.', 'Hmm. An emerald? Hmm. Hmm.'],
  [('man', 'senior', 'low', 'dry and deadpan'), ('man', 'mature', 'low', 'gruff and tired')]),
 ('creeper', 'Créature verte', 'green blocky creature, only a rising hiss before it explodes', 'creature', 'Chapitre 13. Cri seulement.',
  ['Ssssssss…'], ['Ssssssss…'], ['=creature-golem-4']),
 ('indy', 'Archéologue', 'rugged adventurous archaeologist', 'human', 'Chapitre 14. Clone de la bibliothèque.',
  ['Hé, toi. T’es enfin réveillé ? Ne bouge plus. Tu es sur une dalle piégée.', 'Ça appartient à un musée !', 'Pourquoi des serpents ?'],
  ['Hey, you. You’re finally awake? Don’t move. You’re on a pressure plate.', 'It belongs in a museum!', 'Why did it have to be snakes?'],
  ['=clone-f626a1b0']),
 ('doc', 'Savant', 'wild-haired excitable old scientist', 'human', 'Chapitre 15. Clone de la bibliothèque.',
  ['Hé, toi ! T’es enfin réveillé ! On est en quelle année ?', 'Un fromage de 1955, très affiné !'],
  ['Hey, you! You’re finally awake! What year is it?', 'A cheese from 1955, nicely aged!'],
  ['=clone-be1ce514']),
 ('potions', 'Professeur de potions', 'pale potions master, slow contemptuous drawl, long pauses', 'human', 'Chapitre 16.',
  ['C’est quoi, ta baguette ?', 'Moins dix points pour… tout.'],
  ['What’s your wand?', 'Ten points from… everything.'],
  [('man', 'mature', 'low', 'dry and deadpan'), ('man', 'mature', 'low', 'authoritative')]),
 ('hat', 'Chapeau parlant', 'old patched talking hat, raspy, cheeky, takes its time', 'human', 'Chapitre 16.',
  ['Hé, toi. T’es enfin réveillé. C’est ton tour.', 'Courageux, pas très malin, aime le fromage… RIVEBOIS !'],
  ['Hey, you. You’re finally awake. It’s your turn.', 'Brave, not too bright, likes cheese… RIVERWOOD!'],
  [('man', 'senior', 'medium', 'mischievous'), ('man', 'senior', 'high', 'mischievous')]),
 ('arthur', 'Le roi (Kaamelott)', 'weary exasperated king (same voice as season 1 wink)', 'human', 'Chapitre 17, version française. Voix de la saison 1.',
  ['Le Graal, c’est un seau ?', 'Bon, on va pas y passer la nuit. Le Graal, c’est par où ?'],
  ['The Grail is a bucket?', 'Right, we’re not spending the night on this. Which way is the Grail?'],
  ['=man-mature-medium-3']),
 ('perceval', 'Le chevalier lent', 'naive slow clueless young knight (same voice as season 1 wink)', 'human', 'Chapitre 17, version française. Voix de la saison 1.',
  ['Hé, toi. T’es enfin réveillé. … C’est pas faux.', 'Le Cri ? Ah oui. Non.'],
  ['Hey, you. You’re finally awake. … That’s not wrong.', 'The Shout? Ah, yes. No.'],
  ['=man-young-low-7']),
 ('karadoc', 'Le chevalier gourmand', 'jovial greedy knight, mouth full (same voice as season 1 wink)', 'human', 'Chapitre 17, version française. Voix de la saison 1.',
  ['Le gras, c’est la vie.', 'On part pas le ventre vide. C’est une question de principe.'],
  ['Fat is life.', 'We don’t leave on an empty stomach. It’s a matter of principle.'],
  ['=man-x10']),
 ('ni', 'Chevalier qui dit « Ni ! »', 'giant booming knight with antlers who shouts Ni', 'human', 'Chapitre 17, version anglaise.',
  ['Ni ! Apporte-nous… un buisson !', 'Un plus joli. Avec un petit chemin. Ni !'],
  ['Ni! Bring us… a shrubbery!', 'A nicer one. With a little path. Ni!'],
  [('man', 'adult', 'low', 'authoritative'), ('man', 'mature', 'low', 'pompous and theatrical')]),
 ('coconut', 'Chevalier aux noix de coco', 'earnest regal knight on a quest, very serious', 'human', 'Chapitre 17, version anglaise.',
  ['Hé, toi. T’es enfin réveillé. Tu n’aurais pas vu un Graal ?', 'Nous sommes les chevaliers de la Table ronde. Enfin, de la table.'],
  ['Hey, you. You’re finally awake. Seen a Grail, by any chance?', 'We are the knights of the Round Table. Well, of the table.'],
  [('man', 'mature', 'medium', 'authoritative'), ('man', 'mature', 'medium', 'pompous and theatrical')]),
 ('blackknight', 'Chevalier noir', 'stubborn black knight who never gives up, proud and absurd', 'human', 'Chapitre 17, version anglaise.',
  ['Ce n’est qu’une flèche dans le genou.', 'Reviens ! Je vais te mordre les chevilles !'],
  ['’Tis but an arrow in the knee.', 'Come back! I’ll bite your ankles!'],
  [('man', 'adult', 'medium', 'pompous and theatrical'), ('man', 'adult', 'low', 'gruff and tired')]),
 ('barbarian', 'Barbare', 'huge stoic barbarian, few words, heavy accent', 'human', 'Chapitre 18. Clone de la bibliothèque.',
  ['Hé, toi. T’es enfin réveillé. Pousse.', 'Le mieux dans la vie ? Le fromage, le voir fondre, et entendre les lamentations de Sheogorath.'],
  ['Hey, you. You’re finally awake. Push.', 'What is best in life? Cheese, to see it melt before you, and to hear the lamentations of Sheogorath.'],
  ['=clone-1c82458d']),
 ('luckdragon', 'Dragon porte-bonheur', 'huge gentle furry luck dragon, warm laugh, kind and old', 'creature', 'Chapitre 18.',
  ['Ha ha ! Un voyageur ! Monte sur mon dos, la chance fera le reste.', 'N’abandonne jamais. Surtout pas un fromage.'],
  ['Ha ha! A traveller! Climb on my back, luck will do the rest.', 'Never give up. Especially not on a cheese.'],
  ['=creature-dragon-0', '=creature-dragon-2']),
 ('house', 'Docteur House', 'misanthropic doctor with a cane, dry and biting (narrator’s voice, on purpose)', 'human',
  'Chapitre 19 et finale. Même voix que le narrateur : gag voulu.',
  ['Tout le monde ment.', 'C’est jamais le lupus.', 'Quinze ans, et personne n’a pensé à l’enlever.'],
  ['Everybody lies.', 'It’s never lupus.', 'Fifteen years, and nobody thought of taking it out.'],
  ['=clone-ca7cfe8c']),
 ('paleo', 'Paléontologue', 'grumpy paleontologist in a hat, whispers urgently', 'human', 'Chapitre 20. Clone de la bibliothèque (Sam Neill VF).',
  ['Hé, toi. T’es enfin réveillé ? Ne bouge plus. Il ne voit que ce qui bouge.', 'Je l’avais dit, ce sont des oiseaux !'],
  ['Hey, you. You’re finally awake? Don’t move. It only sees movement.', 'I told you, they’re birds!'],
  ['=clone-65b1b55e']),
 ('trex', 'Le monstre', 'giant prehistoric reptile, only deep roars', 'creature', 'Chapitre 20. Cri seulement.',
  ['ROOOAAAR !'], ['ROOOAAAR!'], ['=creature-giant-5']),
 ('girl', 'Fille aux pouvoirs', 'shaven-headed girl with powers, few words, flat, intense', 'human', 'Chapitre 21.',
  ['Les amis ne mentent pas.', 'Il est… gentil ? Il sent le fromage.'],
  ['Friends don’t lie.', 'Is he… nice? He smells like cheese.'],
  [('child', 'A girl aged 12', None, 'melancholic'), ('child', 'A girl aged 10', None, 'authoritative')]),
 ('kid', 'Garçon au talkie-walkie', 'nervous excited boy on a walkie-talkie', 'human', 'Chapitre 21.',
  ['Hé, toi. T’es enfin réveillé ? Tu viens du monde à l’envers ?', 'Je répète : un Viking dans le sous-sol, à vous !'],
  ['Hey, you. You’re finally awake? Are you from the Upside Down?', 'I repeat: a Viking in the basement, over!'],
  [('child', 'A boy aged 11', None, 'nervous and fast-talking'), ('child', 'A boy aged 11', None, 'cheerful and bright')]),
 ('flower', 'Créature à tête de fleur', 'faceless monster whose head opens like a flower, only shrieks', 'creature', 'Chapitre 21. Cri seulement.',
  ['Hiiiiiiik !'], ['Hiiiiiiik!'], ['=creature-demon-3']),
 ('redman', 'Petit homme en rouge', 'small strange man in red, odd sing-song voice (speech played backwards in the game)', 'human',
  'Chapitre 22. La réplique sera jouée à l’envers au montage.',
  ['Hé, toi. T’es enfin réveillé.', 'Ma résidence secondaire. Les rideaux, c’est moi.'],
  ['Hey, you. You’re finally awake.', 'My holiday home. I did the curtains.'],
  [('man', 'adult', 'high', 'mischievous'), ('man', 'young', 'high', 'pompous and theatrical')]),
 ('loglady', 'Dame à la bûche', 'old cryptic lady holding a log, quiet and certain', 'human', 'Chapitre 22.',
  ['Ma bûche a vu quelque chose. Elle ne veut pas en parler.', 'Les hiboux ne sont pas ce qu’ils semblent.'],
  ['My log saw something. It doesn’t want to talk about it.', 'The owls are not what they seem.'],
  [('woman', 'senior', None, 'calm and soothing'), ('woman', 'senior', None, 'melancholic')]),
 ('agent', 'Agent du FBI', 'upbeat precise FBI agent, enthusiastic about coffee and pie', 'human', 'Chapitre 22.',
  ['Ce café est sacrément bon.', 'Diane, il est onze heures, et il y a un Viking dans la forêt.'],
  ['This is a damn fine cup of coffee.', 'Diane, it’s eleven o’clock, and there’s a Viking in the woods.'],
  [('man', 'adult', 'medium', 'cheerful and bright'), '=woman-x9']),
 ('dexter', 'Expert scientifique', 'calm forensic analyst, soft dark inner voice', 'human', 'Chapitre 23.',
  ['Hé, toi. T’es enfin réveillé. Tu as de la confiture partout.', 'Enfin quelqu’un de plus inquiétant que moi.'],
  ['Hey, you. You’re finally awake. You’ve got jam all over you.', 'Finally someone more unsettling than me.'],
  [('man', 'adult', 'low', 'calm and soothing'), ('man', 'adult', 'medium', 'dry and deadpan')]),
 ('sister', 'Sœur policière', 'brash foul-mouthed police detective, fast and loud', 'human', 'Chapitre 23.',
  ['Bordel, Dex, c’est qui ce Viking ?', 'Personne ne touche à rien. Surtout pas à la confiture.'],
  ['Jesus, Dex, who the hell is this Viking?', 'Nobody touches anything. Especially not the jam.'],
  [('woman', 'adult', None, 'nervous and fast-talking'), ('woman', 'adult', None, 'gruff and tired')]),
 ('morpheus', 'Homme au manteau de cuir', 'deep solemn mentor in a leather coat, slow and grave', 'human', 'Chapitre 24.',
  ['Hé, toi. T’es enfin réveillé. Ou pas. Choisis.', 'Personne ne prend les deux.'],
  ['Hey, you. You’re finally awake. Or are you? Choose.', 'Nobody takes both.'],
  ['=man-mature-low-4', '=man-senior-medium-5']),
 ('agentm', 'L’agent', 'cold measured agent in a suit, contemptuous', 'human', 'Chapitre 24.',
  ['Monsieur… Rivebois. Nous vous attendions.', 'L’inventaire est inévitable.'],
  ['Mister… Riverwood. We’ve been expecting you.', 'The inventory is inevitable.'],
  ['=man-mature-medium-0', '=man-adult-medium-5']),
 ('spoonkid', 'Enfant à la cuillère', 'calm serene little boy bending a spoon', 'human', 'Chapitre 24.',
  ['Le fromage n’existe pas.', 'N’essaie pas de plier la meule. C’est impossible.'],
  ['There is no cheese.', 'Do not try to bend the cheese. That’s impossible.'],
  [('child', 'A boy aged 7', None, 'calm and soothing'), ('child', 'A boy aged 9', None, 'calm and soothing')]),
 ('wizard', 'Magicien gris', 'very tall old wizard, calm and powerful (same voice as season 1 wink)', 'human', 'Chapitre 25. Voix de la saison 1.',
  ['Hé, toi. T’es enfin réveillé ? Pas maintenant, j’ai une réplique à dire.', 'Vous ne passerez pas !'],
  ['Hey, you. You’re finally awake? Not now, I have a line to say.', 'You shall not pass!'],
  ['=man-mature-low-6']),
 ('demon', 'Démon de feu', 'huge fire and shadow demon, only roars', 'creature', 'Chapitre 25. Cri seulement.',
  ['GRAAAOOOH !'], ['GRAAAOOOH!'], ['=creature-demon-5']),
 ('halfling', 'Petit être aux pieds poilus', 'cheerful hungry little fellow with hairy feet', 'human', 'Chapitre 25.',
  ['Pourquoi pas les aigles ?', 'Et le deuxième petit-déjeuner ?'],
  ['Why not the eagles?', 'What about second breakfast?'],
  [('man', 'young', 'high', 'warm and friendly'), '=woman-mature-medium-7']),
 ('ai', 'L’IA', 'cold passive-aggressive female AI running tests, calm synthetic voice', 'human', 'Chapitre 26. Effet robotique à ajouter au montage.',
  ['Hé, toi. Tu es enfin réveillé. Il y aura du gâteau à la fin du test.', 'Bravo. Tu as poussé un fromage sur un bouton. Je note : intelligence, faible.'],
  ['Hey, you. You’re finally awake. There will be cake at the end of the test.', 'Well done. You pushed a cheese onto a button. Noted: intelligence, low.'],
  [('woman', 'adult', None, 'calm and soothing'), '=creature-robot-4']),
 ('turret', 'La tourelle', 'small cute polite security turret, high childlike synthetic voice', 'creature', 'Chapitre 26.',
  ['Je suis là pour porter vos fardeaux.', 'Tu es toujours là ?'],
  ['I am sworn to carry your burdens.', 'Are you still there?'],
  ['=creature-robot-2', '=creature-robot-5']),
]


def main():
    voices = json.load(open(sys.argv[1]))
    s1 = json.load(open(sys.argv[2]))
    by_id = {v['id']: v for v in voices}
    reused = {'man-x20', 'man-mature-medium-3', 'man-young-low-7', 'man-x10', 'man-mature-low-6', 'woman-x9', 'woman-mature-medium-7'}
    used = {c.get('cast', {}).get('voice_id') for c in s1['characters']} - reused
    taken = set()

    def resolve(spec):
        if isinstance(spec, str):
            vid = spec[1:]
            assert vid in by_id, vid
            return vid
        g, age, pitch, tone = spec
        return pick(g, age, pitch, tone) or pick(g, age, None, tone) or pick(g, age, None, None, any_tone=True) \
            or (_ for _ in ()).throw(SystemExit(f'aucune voix pour {spec}'))

    def pick(g, age, pitch, tone, any_tone=False):
        for v in voices:
            if not any_tone and v.get('tone') != tone:
                continue
            if v['gender'] != g or v['id'] in used or v['id'] in taken:
                continue
            if g == 'child':
                if not v['recipe'].startswith(age):
                    continue
            elif v.get('age') != age:
                continue
            if pitch and v.get('pitch') != pitch:
                continue
            return v['id']
        return None

    chars, choix = [], []
    for cid, name, role, kind, notes, fr, en, specs in C:
        ids = []
        for s in specs:
            vid = resolve(s)
            ids.append(vid)
            if not vid.startswith('clone-') and vid not in reused:
                taken.add(vid)
        chars.append(dict(id=cid, name=name, role=role, kind=kind, notes=notes, lines={'fr': fr, 'en': en}))
        choix.append(dict(id=cid, name=name, voix=ids[0], rechange=ids[1] if len(ids) > 1 else None,
                          noms=[by_id[i]['name'] for i in ids], recettes=[by_id[i]['recipe'] for i in ids]))
    folder = os.path.realpath(OUT)
    proj = {'format': 'mcasting-project/1', 'name': 'Jeu point & click — saison 2', 'languages': ['fr', 'en'],
            'folder': folder, 'characters': chars}
    json.dump(proj, open(os.path.join(OUT, 'casting_s2_import.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(choix, open(os.path.join(OUT, 'casting_s2_choix.json'), 'w'), ensure_ascii=False, indent=1)
    for c in choix:
        print(f"{c['id']:12} {c['voix']:24} {c['rechange'] or '':24} {' / '.join(c['noms'])}")


if __name__ == '__main__':
    main()
