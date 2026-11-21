#!/usr/bin/env python3 -I
"""Poses clés du coucher de nuit (lot 1) : écrit les toiles guides, les boîtes de cadrage et la liste des calculs FLUX.
Chaque pose est calculée à partir de la toile guide du personnage (même caméra, même échelle, même ligne de sol) et
d'une boîte qui fixe la place et la taille du corps dans la pose (assis = environ la moitié de la hauteur debout, etc.).
Usage : sleep_keys.py [perso…] [--poses p1,p2] [--out jobs_x.tsv]  -> work/sleep/<perso>/{guide.png, box_<pose>.json} et work/sleep/jobs.tsv
Le calcul lui-même : tools/gen_sleep_keys.sh (lit jobs.tsv, saute les images déjà faites)."""
import sys, os, json, subprocess
D = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(D, '..', 'work'); S = os.path.join(W, 'sleep')

K_HUM = ("Exactly the same character as in the reference picture: same face, same body, same costume and accessories, "
         "same hand-painted 1990s point-and-click adventure art style, same colors, same bold dark outlines. Same camera, same scale "
         "and same ground level as the reference: the ground is the horizontal line where the feet stand in the reference. "
         "Full body entirely visible, plain flat solid magenta background, no shadow, no ground, no text.")
K_ANI = ("Exactly the same animal as in the reference picture: same breed, same colors and markings, same tack and accessories, "
         "same hand-painted 1990s point-and-click adventure art style, same bold dark outlines. Same camera, same scale and same ground "
         "level as the reference: the ground is the horizontal line where the hooves or feet stand in the reference. Whole body entirely "
         "visible, plain flat solid magenta background, no shadow, no ground, no text.")

# boîtes : (gauche, droite, haut) en unités de la hauteur du corps debout (Hb) pour les humains, ou de la largeur (Wb) / hauteur (Hb)
# du personnage debout pour les animaux ; le bas de la boîte est toujours la ligne de sol.
HUM_BOX = {'crouch': (.38, .38, .90), 'lean': (.46, .46, .44), 'prop': (.48, .48, .42), 'climb': (.36, .36, .98), 'yawn': (.36, .36, 1.22), 'sit': (.40, .40, .56), 'settle': (.52, .52, .36), 'sleep': (.52, .52, .25),
           'wake': (.40, .40, .80), 'rise': (.34, .34, .76)}
HORSE_BOX = {'low': (.5, .5, .86), 'kneel': (.5, .5, .80), 'fold': (.48, .48, .64), 'sleep': (.50, .50, .46), 'wake': (.53, .53, .66), 'up': (.46, .46, .96)}
RIDER_BOX = {'stretch': (.5, .5, 1.06), 'kneel': (.5, .5, .90), 'fold': (.5, .5, .76), 'sleep': (.52, .52, .58), 'wake': (.52, .52, .86), 'up': (.48, .48, 1.0)}
HEN_BOX = {'puff': (.50, .50, .96), 'sit': (.42, .42, .62), 'sleep': (.40, .40, .56), 'wake': (.42, .42, .76), 'shake': (.52, .52, .98)}   # resserrées : la poule sortait 1,4 fois trop grande

CHARS = {
  'giant': dict(src='ch_giant.png', kind='hum', body=.95, who='The giant', boxes=HUM_BOX, poses={
    'yawn': "The giant stands and stretches, both arms raised high above his head, the club held up in one fist, his mouth wide open in a huge yawn, eyes squeezed shut.",
    'sit': "The giant sits heavily on the ground, legs stretched forward, the club resting across his lap, rubbing one eye with his fist, drowsy half-closed eyes.",
    'settle': "The giant lies down on his side on the ground, propped up on one elbow, his body horizontal across the picture with his head on the left and his bare feet on the right, his club laid on the ground under his head, heavy drooping eyelids, about to fall asleep. Exactly one club.",
    'sleep': "The giant lies asleep on his back on the ground, his body horizontal across the picture with his head on the left and his bare feet on the right, his head resting on his club used as a pillow, exactly one club, one hand on his belly, the other arm along his body, eyes closed, mouth open snoring.",
    'wake': "The giant sits up on the ground just woken, legs stretched forward, both arms stretched wide above his head, big yawn, eyes still half closed, his club lying on the ground beside him. Exactly one club.",
    'rise': "The giant gets up from the ground: he kneels on one knee, one hand pushing on his raised knee, the other hand gripping his club planted upright on the ground, groggy face. Exactly one club.",
    'crouch': "The giant bends his knees deeply, lowering himself toward the ground to sit down, his club held over his shoulder with one hand, his other hand reaching down toward the ground, sleepy eyes. Exactly one club.",
    'lean': "The giant leans back toward the left of the picture, propped on one elbow on the ground, his legs stretched forward toward the right, his club lying on the ground under his elbow, drowsy eyelids. Exactly one club.",
    'prop': "The giant lifts his upper body from the ground, propped up on both elbows, his head on the left and his legs stretched forward toward the right, eyes blinking awake, his club lying on the ground beside him. Exactly one club."}),
  'nazim': dict(src='sleep/nazim/full_603.png', kind='hum', body=1.0, boxes=HUM_BOX, poses={
    'climb': "The nobleman climbs up out of a pit: he is bent forward with both palms pressed down at hip height as if pushing himself up onto a ledge, one knee raised high, his long robe hitched up, annoyed grimace.",
    'yawn': "The nobleman stands and stretches, both arms raised high above his head, his mouth wide open in a big yawn, eyes closed, nose still in the air.",
    'sit': "The nobleman sits down on the ground with exaggerated dignity, legs crossed in front of him, his embroidered robe spread around him, rubbing one eye, drowsy.",
    'settle': "The nobleman lies down on his back on the ground, his body horizontal across the picture with his head on the left and his black boots on the right, propped up on both elbows, heavy drooping eyelids.",
    'sleep': "The nobleman lies asleep on his back on the ground, his body horizontal across the picture with his head on the left and his black boots on the right, hands folded on his chest like a stone effigy, nose in the air, eyes closed, mouth open snoring, his robe spread neatly around him.",
    'wake': "The nobleman sits up on the ground just woken, legs stretched forward, one hand rubbing his eyes and the other arm stretched up, outraged sleepy frown, hair messy.",
    'rise': "The nobleman gets up from the ground: he kneels on one knee, brushing dust off his robe with one hand, the other hand on his raised knee, annoyed look.",
    'lean': "The nobleman leans back toward the left of the picture, propped on both elbows on the ground, his legs still crossed in front of him toward the right, his robe spread around him, heavy eyelids.",
    'prop': "The nobleman lifts his upper body from the ground, propped up on both elbows, his head on the left and his black boots stretched toward the right, blinking awake, hair messy."}),
  'guard': dict(src='ch2_guard.png', kind='hum', body=.94, boxes=HUM_BOX, poses={
    'yawn': "The guard stands and stretches, both arms raised high above his head, the spear held up in one fist, the round shield still strapped on his other arm, his mouth wide open in a huge yawn, eyes squeezed shut. Keep the small arrow stuck in his knee.",
    'sit': "The guard sits down on the ground, legs stretched forward, his spear laid across his knees, his round shield leaning against his side, his helmet tilted, drowsy half-closed eyes. Keep the small arrow stuck in his knee.",
    'settle': "The guard lies down on his side on the ground, his body horizontal across the picture with his head on the right and his boots on the left, his round shield lying flat under his head as a pillow, his spear laid on the ground along his body, heavy drooping eyelids. Exactly one spear and one shield.",
    'sleep': "The guard lies asleep on his back on the ground, his body horizontal across the picture with his head on the right and his boots on the left, his head resting on his round shield used as a pillow, his helmet tipped down over his eyes, his spear laid on the ground along his body, hands folded on his belly, mouth open snoring. Exactly one spear and one shield.",
    'wake': "The guard sits up on the ground just woken, legs stretched forward, pushing his helmet back up from his eyes with one hand, the other arm stretching, groggy face, his spear and his round shield lying on the ground beside him. Exactly one spear and one shield.",
    'rise': "The guard gets up from the ground: he kneels on one knee, leaning on his spear planted upright on the ground, the round shield on his other arm, groggy face. Keep the small arrow stuck in his knee."}),
  'farmer': dict(src='ch_farmer.png', kind='hum', body=.95, boxes=HUM_BOX, poses={
    'yawn': "The farmer woman stands and stretches, both arms raised high above her head, the pitchfork held up in one fist, her mouth wide open in a huge yawn, eyes squeezed shut.",
    'sit': "The farmer woman sits down on the ground, legs stretched forward, her skirt and apron spread around her, the pitchfork laid on the ground beside her, rubbing one eye, drowsy. Exactly one pitchfork.",
    'settle': "The farmer woman lies down on her side on the ground, her body horizontal across the picture with her head on the left and her shoes on the right, her head resting on her folded hands, the pitchfork laid on the ground behind her, heavy drooping eyelids. Exactly one pitchfork.",
    'sleep': "The farmer woman lies asleep on her side on the ground, her body horizontal across the picture with her head on the left and her shoes on the right, her cheek resting on her folded hands, knees slightly bent, a contented smile, eyes closed, mouth open snoring, the pitchfork laid on the ground behind her. Exactly one pitchfork.",
    'wake': "The farmer woman sits up on the ground just woken, legs stretched forward, both arms stretched wide above her head, big yawn, eyes half closed, the pitchfork lying on the ground beside her. Exactly one pitchfork.",
    'rise': "The farmer woman gets up from the ground: she kneels on one knee, leaning on her pitchfork planted upright on the ground, the other hand on her hip, groggy smile. Exactly one pitchfork."}),
  'horse': dict(src='ch2_horse.png', kind='ani', boxes=HORSE_BOX, poses={
    'low': "The horse lowers its head and neck down toward its front hooves, nose almost touching the empty ground, about to lie down, all four legs straight, same side profile facing right. No grass, no ground, nothing under its hooves.",
    'kneel': "The horse is halfway through lying down, like a horse bowing: both front legs are folded with the front knees resting on the ground and the chest low, while the two hind legs are still straight and the rump is high in the air, same side profile facing right.",
    'fold': "The horse lies on the ground resting, all four legs folded under its body, head and neck raised, same side profile facing right, the saddle still on its back.",
    'sleep': "The horse lies asleep on the ground, all four legs folded under its body, its neck stretched forward and its muzzle resting on the ground, eyes closed, ears relaxed, same side profile facing right, the saddle still on its back.",
    'wake': "The horse is still lying on its belly on the ground with its hind legs folded under it, but it has stretched both front legs straight out forward on the ground in front of its chest, head raised high, ready to get up, same side profile facing right. Its body stays low on the ground.",
    'up': "The horse stands up: its front legs are straight and its front half is raised, its hindquarters still sitting on the ground with the hind legs folded under, same side profile facing right."}),
  'horseman': dict(src='ch_horseman.png', kind='ani', boxes=RIDER_BOX, poses={
    'stretch': "The black horse lowers its head toward the ground while the headless rider in the saddle stretches both arms high above his shoulders. The rider has no head at all: only the hollow armored collar at his neck. Same side profile facing right.",
    'kneel': "The black horse is halfway through lying down, like a horse bowing: both front legs are folded with the front knees resting on the ground and the chest low, while the two hind legs are still straight and the rump is high in the air; the headless rider leans back in the saddle holding the reins. The rider has no head at all. Same side profile facing right.",
    'fold': "The black horse lies on the ground, all four legs folded under its body, head raised; the headless rider still sits upright in the saddle. The rider has no head at all. Same side profile facing right.",
    'sleep': "The black horse lies asleep on the ground, legs folded under its body, its muzzle resting on the ground, eyes closed; the headless rider has fallen asleep slumped forward over the horse's neck, his arms dangling down on both sides of the neck, his tattered cape draped over the horse's back. The rider has no head at all. Same side profile facing right.",
    'wake': "The black horse lies on the ground with its head raised high and its front legs stretched straight forward; the headless rider sits up straight in the saddle stretching both arms wide. The rider has no head at all. Same side profile facing right.",
    'up': "The black horse is getting up: its front legs are straight and its front half is raised, its hindquarters still sitting on the ground with the hind legs folded under, all hooves on the ground, never rearing; the headless rider leans forward in the saddle gripping the mane. The rider has no head at all. Same side profile facing right."}),
  'hen': dict(src='ch_hen_74.png', kind='ani', boxes=HEN_BOX, poses={
    'puff': "The hen fluffs up all her feathers into a round ball of white feathers, eyes half closed, sleepy, same side view facing right.",
    'sit': "The hen settles down to sleep: she squats down on the ground, her legs and feet hidden under her fluffed body, as if sitting on a nest, eyes half closed, same side view facing right.",
    'sleep': "The hen sleeps sitting on the ground, legs and feet hidden under her fluffed round body, her head turned back and tucked into the feathers of her back, eyes closed, only her red comb peeking out, same side view.",
    'wake': "The hen has just woken up, still sitting on the ground with her legs hidden, her head raised high and turned forward, blinking, her feathers ruffled, same side view facing right.",
    'shake': "The hen stands up on her feet and shakes herself, all her feathers ruffled and standing out, wings slightly raised, same side view facing right."}),
}
SEEDS = (1, 2, 3)


# lot 2 (16/11/2026), version simple : le marchand (rue, fête) et la compagne d'armes de la grande salle ; tête de même taille que debout
HS = " His head is exactly the same size as in the reference picture: he is not closer to the camera."
HSF = " Her head is exactly the same size as in the reference picture: she is not closer to the camera."
FOL_BOX = {'yawn': (.40, .40, 1.18), 'sit': (.46, .46, .60), 'sleep': (.46, .46, .56), 'rise': (.40, .40, .80)}
MER_BOX = dict(HUM_BOX, sit=(.46, .46, .70), rise=(.40, .40, .90), sleep=(.60, .60, .30))   # assis et à genoux sortaient trop petits (tête 0,8 fois celle de debout)
CHARS['merchant'] = dict(src='ch2_merchant.png', kind='hum', body=.95, boxes=MER_BOX, poses={
    'yawn': "The stout bald merchant stands and stretches, both arms raised high above his head, his mouth wide open in a huge yawn under his big moustache, eyes squeezed shut, his round belly pushed forward." + HS,
    'sit': "The stout bald merchant sits down on the ground, legs stretched forward, his fur-trimmed coat and leather apron spread around him, both hands patting his round belly, drowsy half-closed eyes." + HS,
    'settle': "The stout bald merchant lies down on his back on the ground, his body horizontal across the picture with his head on the left and his boots on the right, propped up on one elbow, heavy drooping eyelids." + HS,
    'sleep': "The stout bald merchant lies asleep on his back on the ground, his body horizontal across the picture with his head on the left and his boots on the right, both hands folded on his round belly, his big moustache fluttering, eyes closed, mouth open snoring." + HS,
    'rise': "The stout bald merchant gets up from the ground: he kneels on one knee, one hand on his raised knee, the other rubbing the small of his back, grumpy face." + HS})
CHARS['follower'] = dict(src='ch_follower.png', kind='hum', body=.80, boxes=FOL_BOX, poses={
    'yawn': "The armored woman stands and stretches, both arms raised high above her head, her mouth wide open in a big yawn, eyes squeezed shut, her huge overloaded backpack still on her back with all its swords, the cheese wheel and the hen." + HSF,
    'sit': "The armored woman sits down on the ground, legs stretched forward, leaning back against her huge overloaded backpack which stands upright on the ground behind her, with all its swords, the cheese wheel and the hen, arms crossed, drowsy half-closed eyes." + HSF,
    'sleep': "The armored woman sleeps sitting on the ground, legs stretched forward, slumped back against her huge overloaded backpack which stands upright on the ground behind her, with all its swords, the cheese wheel and the hen asleep on top, her chin dropped on her chest, arms crossed, eyes closed, mouth open snoring." + HSF,
    'rise': "The armored woman gets up from the ground: she kneels on one knee, one hand pushing on her raised knee, her huge overloaded backpack on her back with all its swords, the cheese wheel and the hen, groggy face." + HSF})


# lot 3 (16/11/2026) : les 10 clins d'œil « Pourquoi il fait si sombre ? » (scenes/blind.js) ; ils gardent leur objet sur les yeux pour dormir
BL_BOX = dict(HUM_BOX, sit=(.44, .44, .64), rise=(.40, .40, .86), sleep=(.58, .58, .30))
BLIND = {  # clé : (qui, il/elle, objet gardé)
  'pot': ("The stocky villager in brown clothes", 'm', "the big dented iron cooking pot still pulled down over his whole face"),
  'sack': ("The peasant woman in a grey dress and apron", 'f', "the burlap sack still pulled down over her head and eyes"),
  'hat': ("The bearded hunter in furs", 'm', "his huge shaggy fur hat still pulled down over his eyes, his spear laid on the ground beside him (exactly one spear)"),
  'cabbage': ("The villager in brown clothes", 'm', "his whole head still hidden inside the giant cabbage"),
  'helmet': ("The man in a brown leather coat", 'm', "the iron helmet still pulled down over his whole face"),
  'basket': ("The stout man in a white shirt", 'm', "the wicker basket still upside down over his head and eyes"),
  'boot': ("The ragged jester bard in colorful patched clothes", 'm', "the old leather boot still stuck over his head, his lute still on his back"),
  'mushroom': ("The old bearded man in a green robe", 'm', "the giant red spotted mushroom cap still pulled down over his eyes"),
  'banner': ("The woman in a long white dress", 'f', "the long red embroidered banner still draped over her head"),
  'partyhat': ("The laughing man in a blue jacket", 'm', "the striped party hat still pulled down over his eyes, his drum still strapped at his side"),
}
for n, (who, sx, obj) in BLIND.items():
    his, he = ('her', 'she') if sx == 'f' else ('his', 'he')
    hs = f" {his.capitalize()} head is exactly the same size as in the reference picture: {he} is not closer to the camera. Keep {obj}."
    CHARS['blind_' + n] = dict(src=f'blind_{n}.png', kind='hum', body=.95, boxes=BL_BOX, poses={
      'yawn': f"{who} stands and stretches, both arms raised high above {his} head, mouth wide open in a big yawn." + hs,
      'sit': f"{who} sits down on the ground, legs stretched forward, both hands resting on {his} knees, nodding off." + hs,
      'sleep': f"{who} lies asleep on {his} back on the ground, {his} body horizontal across the picture with {his} head on the left and {his} feet on the right, hands folded on {his} belly, snoring." + hs,
      'rise': f"{who} gets up from the ground: {he} kneels on one knee, one hand on {his} raised knee, groggy." + hs})
# le chou : FLUX le grossit assis et à genoux (1er passage) -> boîtes réduites de 40 %
CHARS['blind_cabbage']['boxes'] = dict(BL_BOX, sit=(.27, .27, .40), rise=(.24, .24, .52))


# papillon géant (bois, 16/11) : il se pose sur un chapeau de champignon, s'enveloppe dans ses ailes et dort ; vue de face comme son sprite
BF_BOX = {'land': (.42, .42, .90), 'fold': (.40, .40, .80), 'sleep': (.34, .34, .70), 'stretch': (.55, .55, 1.0)}
BF = " Same front view, same size as in the reference picture: its body is exactly as big as in the reference."
CHARS['butterfly'] = dict(src='ch_butterfly.png', kind='ani', boxes=BF_BOX, poses={
  'land': "The giant butterfly lands, seen from the front: its wings half raised and drawn up above its body, its thin legs stretched down to touch the ground, big cute eyes half closed, sleepy." + BF,
  'fold': "The giant butterfly sits on the ground seen from the front, its wings lowered and drooping down on both sides of its body like a cloak, yawning with its mouth wide open, eyes half closed, antennae bent." + BF,
  'sleep': "The giant butterfly sleeps sitting on the ground seen from the front, its wings wrapped around its body like a blanket, eyes closed, antennae drooping, peaceful smile." + BF,
  'stretch': "The giant butterfly stretches, seen from the front: its wings spread wide open and raised high, yawning, blinking its big cute eyes." + BF})

# dragons perchés (17/11) : ils replient leurs ailes, se couchent sur leur perchoir et dorment enroulés ; profil gauche comme leurs sprites
DR_BOX = {'yawn': (.40, .40, 1.0), 'curl': (.46, .46, .62), 'sleep': (.42, .42, .52)}
DRS = " Same side profile facing left, same size as in the reference picture: its head is exactly as big as in the reference."
for k in ('ember', 'frost', 'moss', 'gold'):
    CHARS['dragon_' + k] = dict(src=f'dr_{k}_down.png', kind='ani', boxes=DR_BOX, poses={
      'yawn': "The dragon is perched standing on its four legs, its wings folded against its sides, head raised, yawning with its jaws wide open, sleepy." + DRS,
      'curl': "The dragon lies down on its belly, legs tucked under its body, wings folded flat along its back, head lowered towards its front paws, eyes half closed." + DRS,
      'sleep': "The dragon sleeps lying on its belly, curled up, wings folded flat along its back, its tail curled around its body, its chin resting on its front paws, eyes closed." + DRS})
# braise : au 1er passage, ailes restées déployées couché -> consigne plus stricte (ailes fermées)
WF = " Its tattered wings are completely closed and folded tight against its body, wing tips pointing back, not spread, not raised."
CHARS['dragon_ember']['poses'] = dict(CHARS['dragon_ember']['poses'], curl=CHARS['dragon_ember']['poses']['curl'] + WF, sleep=CHARS['dragon_ember']['poses']['sleep'] + WF)

def main():
    a = sys.argv[1:]; only = None; out = 'jobs.tsv'
    if '--poses' in a: i = a.index('--poses'); only = a[i + 1].split(','); del a[i:i + 2]
    if '--out' in a: i = a.index('--out'); out = a[i + 1]; del a[i:i + 2]
    global SEEDS
    if '--seeds' in a: i = a.index('--seeds'); SEEDS = tuple(int(v) for v in a[i + 1].split(',')); del a[i:i + 2]
    names = a or list(CHARS)
    jobs = []
    for ci, n in enumerate(names):
        c = CHARS[n]; d = os.path.join(S, n); os.makedirs(d, exist_ok=True)
        g = os.path.join(d, 'guide.png')
        if not os.path.exists(g): subprocess.run([sys.executable, '-I', os.path.join(D, 'sleep_guide.py'), os.path.join(W, c['src']), g], check=True)
        gj = json.load(open(os.path.join(d, 'guide.json'))); GW, GH = gj['size']; x0, y0, x1, y1 = gj['rect']; G = gj['ground']; X = (x0 + x1) / 2
        Hb = (y1 - y0) * c.get('body', 1.0); Wb = x1 - x0
        for pi, (p, txt) in enumerate(c['poses'].items()):
            if only and p not in only: continue
            l, r, t = c['boxes'][p]
            if c['kind'] == 'hum': L, R, T = X - l * Hb, X + r * Hb, G - t * Hb
            else: L, R, T = X - l * Wb, X + r * Wb, G - t * (y1 - y0)
            bb = [round(max(0, T) / GH, 3), round(max(0, L) / GW, 3), round(min(GH, G + 6) / GH, 3), round(min(GW, R) / GW, 3)]
            bf = os.path.join(d, f'box_{p}.json')
            json.dump([{'id': 1, 'desc': txt.split(':')[0].split(',')[0], 'bbox': bb}], open(bf, 'w'))
            K = K_HUM if c['kind'] == 'hum' else K_ANI
            for s in SEEDS:
                jobs.append((os.path.join(d, f'k_{p}_{s}.png'), str(7000 + ci * 100 + pi * 10 + s), g, bf, K + ' ' + txt))
    with open(os.path.join(S, out), 'w') as f:
        for j in jobs: f.write('\t'.join(j) + '\n')
    print(len(jobs), 'calculs')


main()
