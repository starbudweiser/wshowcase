#!/usr/bin/env python3 -I
"""Scénario illustré de l'intro « Quinze ans plus tard » et de l'écran titre -> PDF (A4 paysage).
Chaque plan a un visuel composé avec les images du jeu (assets/pointclick/intro, title, spr), aux positions du moteur (engine/intro.js),
avec les bulles de dialogue ; le texte (fiche du plan, répliques fr/en) vient de lang/fr.js et en.js.
Usage : intro_pdf.py  -> easter eggs/pointclick/docs/intro_scenario.pdf (+ visuels dans work/intro/pdf/)"""
import os, sys, math, json, re, subprocess, base64, io, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(D, '..', '..', '..'))
A = os.path.join(R, 'assets', 'pointclick'); WK = os.path.join(R, 'easter eggs', 'pointclick', 'work', 'intro', 'pdf'); os.makedirs(WK, exist_ok=True)
DOC = os.path.join(R, 'easter eggs', 'pointclick', 'docs'); os.makedirs(DOC, exist_ok=True)
W, H, K = 480, 270, 2
VT = ImageFont.truetype(os.path.join(A, 'VT323-Regular.ttf'), 24)
CAP = ImageFont.truetype(os.path.join(A, 'VT323-Regular.ttf'), 38)


def lang(code):
    """lit les clés intro.* d'un fichier de langue (objet JS simple)"""
    s = open(os.path.join(R, 'js', 'pointclick', 'lang', code + '.js'), encoding='utf-8').read()
    return {m.group(1): m.group(2) for m in re.finditer(r"'((?:intro|ui)\.[\w.]+)':\s*'((?:[^'\\]|\\.)*)'", s)}


FR, EN = lang('fr'), lang('en')
img = lambda p: Image.open(os.path.join(A, p)).convert('RGBA') if os.path.exists(os.path.join(A, p)) else None
hero = lambda n: img(f'spr/hero_{n}.png')
COL = {'hero': (255, 224, 138), 'comp': (154, 208, 255), 'thief': (159, 224, 138), 'driver': (255, 164, 92), 'narr': (207, 224, 255)}


def put(c, s, x, y, k=1.0, anchor='bottom', flipy=False, rot=0, alpha=1.0):
    if s is None: return
    s = s.resize((max(1, round(s.width * k)), max(1, round(s.height * k))), Image.NEAREST)
    if flipy: s = s.transpose(Image.FLIP_TOP_BOTTOM)
    if rot: s = s.rotate(rot, expand=True, resample=Image.NEAREST)
    if alpha < 1: s.putalpha(s.getchannel('A').point(lambda v: int(v * alpha)))
    c.alpha_composite(s, (round(x - s.width / 2), round(y - s.height if anchor == 'bottom' else y - s.height / 2)))


def blur(im, k=4):
    s = im.resize((max(1, im.width // k), max(1, im.height // k)), Image.LANCZOS); return s.resize(im.size, Image.BICUBIC)


def bubble(c2, x, y, text, col, maxw=270):
    """bulle du jeu : texte coloré cerné de noir, centré au-dessus de (x, y) (coordonnées 480x270), retour à la ligne"""
    d = ImageDraw.Draw(c2); words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=VT) / K > maxw and cur: lines.append(cur); cur = w
        else: cur = t
    lines.append(cur); lh = 11
    y0 = max(4 + len(lines) * lh, y) - len(lines) * lh
    for i, l in enumerate(lines):
        tw = d.textlength(l, font=VT) / K; xx = min(max(x, tw / 2 + 6), W - tw / 2 - 6)
        for dx in (-2, -1, 0, 1, 2):
            for dy in (-2, -1, 0, 1, 2):
                if dx or dy: d.text(((xx) * K + dx, (y0 + i * lh) * K + dy), l, font=VT, fill=(0, 0, 0), anchor='ma')
        d.text((xx * K, (y0 + i * lh) * K), l, font=VT, fill=col, anchor='ma')


def up(c): return c.resize((W * K, H * K), Image.NEAREST)


CART = [img(f'intro/cart/{i:02d}.png') for i in range(12)] if os.path.exists(os.path.join(A, 'intro', 'cart', 'index.json')) else [img('spr/cart.png')]
P2 = img('intro/p2.png'); P2B = blur(P2.convert('RGB'), 5).convert('RGBA') if P2 else None


def riders(c, x, y, k, heroN):   # mêmes décalages que drawRiders (engine/intro.js) et cartArrival (scenes/rue.js)
    put(c, img('intro/thief_s.png'), x - 52 * k, y - 22 * k, k); put(c, img('intro/comp_s.png'), x - 80 * k, y - 22 * k, k)
    if heroN: put(c, hero(heroN), x - 108 * k, y - 58 * k, k * 0.17)


def inside(c, railY=150):
    if P2B: c.alpha_composite(P2B.crop((120, 0, 120 + W, H)).resize((W, H + 20)), (0, -10))
    r = img('intro/rail.png')
    if r: c.alpha_composite(r.resize((W, round(r.height * W / r.width)), Image.NEAREST), (0, railY))


def comp_back(c, i=1):
    s = img(f'intro/comp_back{i}.png')
    if s: s = blur(s, 3); c.alpha_composite(s, (-30, H - s.height + 24))


def shot(name, fn):
    c = Image.new('RGBA', (W, H), (0, 0, 0, 255)); fn(c); c2 = up(c)
    if hasattr(fn, 'bubbles'):
        for b in fn.bubbles: bubble(c2, *b)
    c2.convert('RGB').save(os.path.join(WK, name + '.png')); return os.path.join(WK, name + '.png')


def with_b(f, *bs): f.bubbles = bs; return f


V = {}
p1 = img('intro/p1.png'); DR = [img(f'spr/dragon_{q}.png') for q in ('mid1', 'up')]
def f_p1a(c):
    if p1: c.alpha_composite(p1, (0, 0))
    put(c, DR[0], 150, 60, 0.55, 'center')
V['p1a'] = shot('p1a', with_b(f_p1a))
d = ImageDraw.Draw(Image.open(V['p1a']))
im = Image.open(V['p1a']); dd = ImageDraw.Draw(im)
for i, l in enumerate(FR['intro.card'].split('. ', 1)):
    l = l if l.endswith('.') else l + '.'
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            if dx or dy: dd.text((480 + dx, 200 + i * 44 + dy), l, font=CAP, fill=(0, 0, 0), anchor='ma')
    dd.text((480, 200 + i * 44), l, font=CAP, fill=(244, 234, 214), anchor='ma')
im.save(V['p1a'])
def f_p1b(c):
    if p1: c.alpha_composite(p1, (0, H - p1.height))
    put(c, CART[0], 120, H - 32, 0.16)
V['p1b'] = shot('p1b', with_b(f_p1b))
PROPS = [img(f'intro/prop_{n}.png') for n in ('grass', 'rock', 'fence', 'pine')]
def f_p2(c):
    if P2: c.alpha_composite(P2.crop((180, 0, 180 + W, H)), (0, 0))
    riders(c, 240, 258, 1, 'pSleepy'); put(c, CART[3], 240, 258, 1)
    put(c, PROPS[0], 60, H + 6); put(c, PROPS[2], 400, H + 6)
V['p2'] = shot('p2', with_b(f_p2))
def f_p3a(c): inside(c); put(c, hero('pBlink'), 300, H + 6, 0.86); comp_back(c, 1)
V['p3a'] = shot('p3a', with_b(f_p3a, (150, 46, FR['intro.comp1'], COL['comp'])))
def f_p3b(c): inside(c); put(c, hero('pNeutral'), 300, H + 6, 0.86); comp_back(c, 2)
V['p3b'] = shot('p3b', with_b(f_p3b, (160, 46, FR['intro.comp2'], COL['comp'])))
def f_p4(c): inside(c, 176); put(c, img('intro/thief_cu1.png'), W / 2, H + 4, 1)
V['p4'] = shot('p4', with_b(f_p4, (W / 2, 34, FR['intro.thief1'], COL['thief'])))
def f_p5a(c): inside(c); put(c, hero('pShrugT'), 300, H + 6, 0.86); comp_back(c, 1)
V['p5a'] = shot('p5a', with_b(f_p5a, (300, 40, FR['intro.hero1'], COL['hero'])))
def f_p5b(c): inside(c); put(c, hero('pThink'), 300, H + 6, 0.86); comp_back(c, 3)
V['p5b'] = shot('p5b', with_b(f_p5b, (160, 46, FR['intro.comp4'], COL['comp'])))
def f_p5c(c):
    t = Image.new('RGBA', (W, H)); inside(t); put(t, hero('pPoint'), 300, H + 6, 0.86)
    z = 1.5; t = t.resize((round(W * z), round(H * z)), Image.NEAREST); c.alpha_composite(t.crop((round(300 * z - 300), round(108 * z - 108), round(300 * z - 300) + W, round(108 * z - 108) + H)), (0, 0))
V['p5c'] = shot('p5c', with_b(f_p5c, (300, 30, FR['intro.hero2'], COL['hero'])))
RUE = img('rue.png')
def f_p6a(c):
    c.alpha_composite(RUE.resize((W, H)), (0, 0)); riders(c, 262, 257, 0.92, 'pNeutral'); put(c, CART[0], 262, 257, 0.92)
V['p6a'] = shot('p6a', with_b(f_p6a, (262, 140, FR['intro.driver1'], COL['driver'])))
def f_p6b(c):
    c.alpha_composite(RUE.resize((W, H)), (0, 0)); riders(c, 262, 257, 0.92, None); put(c, CART[0], 262, 257, 0.92)
    put(c, hero('fSurprise'), 205, 205, 0.95, rot=120)
V['p6b'] = shot('p6b', with_b(f_p6b))
def fence_layer():
    bg = RUE.resize((W, H)); px = bg.load(); out = Image.new('RGBA', (W, H)); op = out.load(); m = Image.new('L', (W, H)); ImageDraw.Draw(m).polygon([(344, 172), (480, 163), (480, 194), (344, 199)], fill=255); mp = m.load()
    for y in range(163, 200):
        for x in range(344, 480):
            r, g, b, a = px[x, y]
            if mp[x, y] and max(r, g, b) < 125 and b < r + 25: op[x, y] = (r, g, b, 255)
    return out
def f_p6c(c):
    c.alpha_composite(RUE.resize((W, H)), (0, 0)); random.seed(3)
    put(c, hero('fShrug'), 166, 262, 1.0)
    for i in range(14): a = i / 14 * math.tau; put(c, img('spr/puff.png'), 166 + math.cos(a) * (20 + i % 4 * 5), 266 + math.sin(a) * 3, 1.0 + (i % 3) * 0.25, alpha=0.5)
    riders(c, 425, 184, 0.4, None); put(c, CART[5], 425, 184, 0.4)
    c.alpha_composite(fence_layer(), (0, 0))   # parapet du pont devant les roues (même règle que fenceEnt dans scenes/rue.js)
V['p6c'] = shot('p6c', with_b(f_p6c))
TB, TL = img('title/bg.png'), img('title/logo_fr.png')
def f_t(c):
    if TB: c.alpha_composite(TB, (0, 0))
    if TL: c.alpha_composite(TL, (round(W / 2 - TL.width / 2), round(40 - TL.height / 2 + 34)))
items = [FR.get('ui.new', 'Nouvelle partie'), FR.get('ui.options', 'Options')]
V['title'] = shot('title', with_b(f_t, *[(W / 2, 188 + i * 13, t, (255, 246, 207) if i == 0 else (233, 196, 106)) for i, t in enumerate(['Continuer', 'Nouvelle partie', 'Chapitres', 'Options'])]))

# ───── fiches ─────
PL = [
    ('P1', '9 s', 'Très grand plan d’ensemble · légère plongée · #28 révélation en grue (descente sur le décor haut)', ['p1a', 'p1b'],
     'Ciel du matin, aurore, la Gorge du Monde ; un dragon traverse. Le narrateur lit le carton. Le regard descend jusqu’à la route où avance une charrette minuscule.', [('narr', 'intro.card')],
     'Musique : ouverture épique (cor, chœur, timbales), 0 à 19 s.'),
    ('P2', '10 s', 'Plan d’ensemble · niveau des yeux · #37 travelling latéral (la charrette reste au centre, le décor défile, accessoires du premier plan plus rapides)', ['p2'],
     'La charrette des prisonniers : cocher, cheval au pas, compagnon, voleur, et le héros qui dort, la tête qui ballotte.', [],
     'Cheval et charrette : cycle de pas en 12 images. La musique passe au thème du trajet à 19 s.'),
    ('P3', '≈ 12 s', 'Plan rapproché · niveau des yeux · #7 par-dessus l’épaule (amorce floue du compagnon) + roulis de charrette', ['p3a', 'p3b'],
     'Le héros dort (des « z » s’envolent). Le compagnon le réveille ; le héros bâille puis ouvre les yeux.', [('comp', 'intro.comp1'), ('comp', 'intro.comp2')],
     'Forêt floue qui défile derrière le bord de la charrette.'),
    ('P4', '≈ 5 s', 'Gros plan · légère contre-plongée · fixe', ['p4'],
     'Le voleur panique et gesticule (5 poses).', [('thief', 'intro.thief1')], 'Annonce les aveugles à seau du jeu.'),
    ('P5', '≈ 14 s', 'Plan rapproché, puis #26 zoom éclair sur le héros', ['p5a', 'p5b', 'p5c'],
     'Le héros hausse les épaules, le compagnon résume quinze ans de Bordeciel et parle du rouleau au miel ; le héros réfléchit, puis zoom éclair : il pointe le doigt.', [('hero', 'intro.hero1'), ('comp', 'intro.comp3'), ('comp', 'intro.comp4'), ('hero', 'intro.hero2')],
     'Fondu au noir après la réplique.'),
    ('P6', '≈ 8 s', 'Plan d’ensemble de la rue de Rivebois · fixe (la vraie scène du jeu, animée)', ['p6a', 'p6b', 'p6c'],
     'La charrette sort de derrière l’étal et pile. Le cocher annonce le terminus ; le héros est éjecté en vol plané, atterrit dans un nuage de poussière. La charrette repart en perspective par la route du pont (la poule s’enfuit, le garde s’écarte puis reprend son poste), roule sur le tablier derrière le parapet et sort à droite. La partie commence : le héros marche et dit son monologue sur le rouleau au miel.', [('driver', 'intro.driver1')],
     'Musique : celle de la rue.'),
]
WHO = {'hero': 'Héros', 'comp': 'Compagnon', 'thief': 'Voleur', 'driver': 'Cocher', 'narr': 'Narrateur'}
b64 = lambda p: 'data:image/jpeg;base64,' + base64.b64encode((lambda b: (Image.open(p).convert('RGB').save(b, 'JPEG', quality=88), b.getvalue())[1])(io.BytesIO())).decode()
css = """@page{size:A4 landscape;margin:12mm}body{font:10.5pt/1.45 -apple-system,'Helvetica Neue',Arial,sans-serif;color:#1d1a17;margin:0}
h1{font-size:24pt;margin:0 0 4px}h2{font-size:14pt;margin:0 0 6px;color:#8a3d18}.sub{color:#6b625a;margin:0 0 14px}
.page{page-break-after:always}.plan{display:grid;grid-template-columns:62% 1fr;gap:14px;page-break-inside:avoid;margin-bottom:10px}
.imgs img{width:100%;display:block;border-radius:4px;margin-bottom:6px;image-rendering:pixelated}.imgs.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.imgs.grid img{margin:0}
.tech{font-size:9pt;color:#6b625a}.l{margin:3px 0}.l b{font-weight:600}.en{color:#6b625a;font-style:italic}
table{border-collapse:collapse;width:100%;font-size:10pt}td{padding:4px 6px;border-bottom:1px solid #e5ded5;vertical-align:top}"""
html = [f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{css}</style></head><body>']
html.append(f'<div class="page"><h1>Le Seau de Rivebois · intro « Quinze ans plus tard »</h1><p class="sub">Scénario illustré · parodie du réveil dans la charrette · durée ≈ 60 s · clic ou Échap : passer l’intro</p>'
            f'<div class="plan"><div class="imgs"><img src="{b64(V["title"])}"></div><div><h2>Écran titre</h2><p>Le tableau de nuit de Rivebois : le héros assis sur une caisse serre un chou et une meule de fromage, le garde assis dans la neige montre la flèche dans son genou, la poule effarée sur le blason au seau, la charrette renversée. Animations : neige, étoiles, aurore, fenêtres du village, un dragon qui passe à l’envers. Le logo tombe et rebondit, puis un reflet le traverse.</p>'
            f'<p class="l"><b>Titre :</b> {FR.get("ui.title", "Le Seau de Rivebois")} — <span class="en">The Bucket of Riverwood</span></p><p class="l"><b>Sous-titre :</b> {FR["ui.tagline"]} — <span class="en">{EN["ui.tagline"]}</span></p>'
            f'<p class="tech">Menu : Continuer, Nouvelle partie, Chapitres, Options (plein écran, agrandissement, musique, voix, ambiance, langue). Musique : thème de titre en boucle (Flow Music, MIDI années 90).</p>'
            '<table><tr><td><b>Personnages</b></td><td>Héros (portraits du jeu) · Compagnon blond (parodie du compagnon de charrette) · Voleur chauve · Cocher</td></tr>'
            '<tr><td><b>Voix</b></td><td>Chatterbox, en français et en anglais ; narrateur pour le carton</td></tr><tr><td><b>Musique</b></td><td>Thème d’intro : ouverture épique 0–19 s, puis trajet en charrette, calme sous les dialogues</td></tr></table></div></div></div>')
for n, (pl, dur, cam, ims, act, lines, son) in enumerate(PL):
    cls = 'imgs grid' if len(ims) > 1 else 'imgs'
    lt = ''.join(f'<p class="l"><b>{WHO[w]} :</b> « {FR[k]} »<br><span class="en">“{EN[k]}”</span></p>' for w, k in lines)
    html.append(f'<div class="plan"><div class="{cls}">' + ''.join(f'<img src="{b64(V[i])}">' for i in ims) + f'</div><div><h2>{pl} · {dur}</h2><p class="tech">{cam}</p><p>{act}</p>{lt}<p class="tech">{son}</p></div></div>')
html.append('</body></html>')
hp = os.path.join(WK, 'scenario.html'); open(hp, 'w', encoding='utf-8').write(''.join(html))
CH = os.path.expanduser('~/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')
out = os.path.join(DOC, 'intro_scenario.pdf')
subprocess.run([CH, '--headless', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={out}', 'file://' + hp], check=True, capture_output=True)
print(out)
