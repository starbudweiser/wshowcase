#!/usr/bin/env python3 -I
"""Bible de développement de la saison 2 (crossover) -> PDF A4, en français et en anglais.
Contenu : tools/s2_content.py ; images : crossover/img (visuels 960×540), work/crossover/rendu (prototypes),
work/crossover/persos (planches de personnages). Rendu HTML -> PDF par Chrome sans interface (comme intro_pdf.py).
Usage : saison2_pdf.py  -> easter eggs/pointclick/docs/saison2_bible_fr.pdf et saison2_bible_en.pdf"""
import os, sys, html, subprocess
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
import s2_content as C
P = os.path.abspath(os.path.join(D, '..'))
IMG = os.path.join(P, 'crossover', 'img'); WK = os.path.join(P, 'work', 'crossover'); OUT = os.path.join(WK, 'pdf')
DOC = os.path.join(P, 'docs'); os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(OUT, 'persos'), exist_ok=True)
CH = os.path.expanduser('~/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')
u = lambda p: 'file://' + p.replace(' ', '%20').replace('(', '%28').replace(')', '%29')
e = html.escape


def loupe_strip():
    """bande de comparaison des cinq rendus (même détail, agrandi pixel pour pixel)"""
    tiles = []
    for lv, ext in (('s1', 'png'), ('640', 'png'), ('800', 'png'), ('960', 'png'), ('hd', 'jpg')):
        f = os.path.join(WK, 'rendu', f'r_portal_{lv}.{ext}')
        if not os.path.exists(f): return None
        im = Image.open(f).convert('RGB'); W, H = im.size
        c = im.crop((int(.34 * W), int(.06 * H), int(.56 * W), int(.40 * H)))
        tiles.append(c.resize((360, round(360 * c.height / c.width)), Image.NEAREST))
    sh = Image.new('RGB', (sum(t.width for t in tiles) + 16 * 4, tiles[0].height), (255, 255, 255)); x = 0
    for t in tiles: sh.paste(t, (x, 0)); x += t.width + 16
    p = os.path.join(OUT, 'loupe.jpg'); sh.save(p, quality=90); return p


def thumb(cid):
    """personnage retenu, exporté par l'étape de sélection dans crossover/persos/<id>.jpg"""
    f = os.path.join(P, 'crossover', 'persos', cid + '.jpg')
    return f if os.path.exists(f) else None


CSS = """
@page{size:A4;margin:14mm 14mm 16mm}
*{box-sizing:border-box}
body{margin:0;font:10.5pt/1.45 "Helvetica Neue",Helvetica,Arial,sans-serif;color:#1d1d22}
h1{font-size:26pt;line-height:1.15;margin:0 0 6pt;color:#111}
h2{font-size:16pt;margin:0 0 8pt;color:#111;border-bottom:2px solid #c9874a;padding-bottom:3pt}
h3{font-size:12.5pt;margin:0 0 4pt;color:#111}
.kick{font-size:8.5pt;letter-spacing:.08em;text-transform:uppercase;color:#9a5a22;font-weight:700}
.page{page-break-after:always}
.cover{height:265mm;display:flex;flex-direction:column;justify-content:space-between}
.cover img{width:100%;border-radius:4pt}
.muted{color:#555}
ul{margin:4pt 0 0;padding-left:15pt}li{margin:2pt 0}
ol{margin:4pt 0 0;padding-left:16pt}
.chap img{width:100%;border-radius:3pt;margin:4pt 0 6pt}
.quote{font-style:italic;border-left:2.5pt solid #c9874a;padding-left:7pt;margin:4pt 0}
.lab{font-size:8.5pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9a5a22;margin-top:6pt}
.tag{display:inline-block;font-size:7.5pt;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:1pt 5pt;border-radius:3pt;background:#eee;color:#555;margin-left:4pt;vertical-align:middle}
.num{color:#c9874a;font-weight:800;margin-right:5pt}
.small{font-size:9.5pt;color:#444}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10pt}
.chips span{display:inline-block;background:#f1ece6;border-radius:9pt;padding:1.5pt 7pt;margin:2pt 3pt 2pt 0;font-size:9pt}
table{border-collapse:collapse;width:100%;font-size:9pt}
th,td{border-bottom:1px solid #ddd;padding:4pt 5pt;text-align:left}
th{font-size:7.5pt;text-transform:uppercase;letter-spacing:.05em;color:#777}
td.n{text-align:center}
.grp{break-inside:avoid;margin-bottom:9pt}
.grid{display:flex;flex-wrap:wrap;gap:8pt}
.cell{width:40mm;text-align:center;font-size:8.5pt}
.cell img{width:40mm;height:50mm;object-fit:contain;background:#d63a8c;border-radius:3pt;display:block}
.cell .ph{width:40mm;height:50mm;border:1px dashed #bbb;border-radius:3pt;display:flex;align-items:center;justify-content:center;color:#999;font-size:8pt;padding:4pt}
.foot{position:fixed;bottom:0;left:0;right:0;font-size:7.5pt;color:#999;text-align:center}
.strip{width:100%;margin:6pt 0 2pt}
.caps{display:grid;grid-template-columns:repeat(5,1fr);gap:4pt;font-size:7.5pt;color:#555;text-align:center}
"""


def chapter(ch, L, T, alt_key=None):
    d = C.ALT[alt_key] if alt_key else ch
    n = ch['n'] if not alt_key else 17
    typ = T[{'jeu': 'game', 'film': 'film', 'films': 'films', 'serie': 'serie'}[d['t']]]
    s = [f'<div class="chap page"><div class="kick">{e(T["s_ch"])}</div>',
         f'<h3><span class="num">{n}</span>{e(d["title"][L])}<span class="tag">{e(d["ref"][L])}</span><span class="tag">{e(typ)}</span></h3>',
         (f'<img src="{u(os.path.join(IMG, d["img"] + ".jpg"))}">' if os.path.exists(os.path.join(IMG, d["img"] + ".jpg")) else f'<div class="ph">{e(T["per_wait"])}</div>'),
         f'<div class="lab">{e(T["wake"])}</div><p class="quote">{e(d["wake"][L])}</p>',
         f'<div class="lab">{e(T["steps"])}</div><ol>' + ''.join(f'<li>{e(x)}</li>' for x in d['steps'][L]) + '</ol>',
         f'<div class="lab">{e(T["wabon"])}</div><ul>' + ''.join(f'<li>{e(x)}</li>' for x in d['wab'][L]) + '</ul>',
         f'<p class="small"><b>{e(T["gag"])} :</b> {e(d["gag"][L])}<br><b>{e(T["bridge"])} :</b> {e(d["bridge"][L])}'
         + (f'<br><b>{e(T["note"])} :</b> {e(d["note"][L])}' if d.get('note') else '') + '</p></div>']
    return ''.join(s).replace(' :</b>', ':</b>') if L == 'en' else ''.join(s)


def build(L):
    T = C.UI[L]; o = []
    o.append(f'<!doctype html><html lang="{L}"><head><meta charset="utf-8"><title>{e(T["title"])}</title><style>{CSS}</style></head><body>')
    o.append(f'<div class="foot">{e(T["foot"])}</div>')
    # couverture
    o.append(f'<div class="cover page"><div><div class="kick">{e(T["date"])}</div><h1>{e(T["title"])}</h1><p class="muted">{e(T["sub"])}</p></div>'
             f'<img src="{u(os.path.join(IMG, "p_sheo.jpg"))}"><div><h3>{e(T["toc"])}</h3><ol>'
             + ''.join(f'<li>{e(T[k])}</li>' for k in ('s_dec', 's_pir', 's_wab', 's_ren', 's_ch', 's_alt', 's_per', 's_bank', 's_plan')) + '</ol></div></div>')
    # décisions + pirouette
    o.append(f'<div class="page"><h2>1. {e(T["s_dec"])}</h2><ul>' + ''.join(f'<li>{e(x)}</li>' for x in C.DECISIONS[L]) + '</ul>')
    o.append(f'<h2 style="margin-top:14pt">2. {e(T["s_pir"])}</h2><div class="two"><img style="width:100%;border-radius:3pt" src="{u(os.path.join(IMG, "p_sheo.jpg"))}">'
             f'<img style="width:100%;border-radius:3pt" src="{u(os.path.join(IMG, "p_charrette.jpg"))}"></div>'
             + ''.join(f'<p><b>{e(a)}.</b> {e(b)}</p>' for a, b in C.PIROUETTE[L]) + '</div>')
    # Wabbajack
    W = C.WABBAJACK[L]
    o.append(f'<div class="page"><h2>3. {e(T["s_wab"])}</h2><img style="width:100%;border-radius:3pt;margin-bottom:6pt" src="{u(os.path.join(IMG, "r_wabbajack.jpg"))}">'
             + ''.join(f'<p>{x}</p>' for x in W['paras'])
             + f'<div class="lab">{e(W["pool_t"])}</div><div class="chips">' + ''.join(f'<span>{e(x)}</span>' for x in W['pool']) + '</div></div>')
    # rendu
    st = loupe_strip()
    o.append(f'<div class="page"><h2>4. {e(T["s_ren"])}</h2>' + ''.join(f'<p>{x}</p>' for x in C.RENDU[L])
             + (f'<img class="strip" src="{u(st)}"><div class="caps">' + ''.join(f'<div>{e(c)}</div>' for c in T['ren_cap']) + '</div>' if st else '')
             + f'<img style="width:100%;border-radius:3pt;margin-top:10pt" src="{u(os.path.join(IMG, "r_portal.jpg"))}"></div>')
    # chapitres
    o.append(f'<div><h2>5. {e(T["s_ch"])}</h2></div>')
    for ch in C.CHAPTERS:
        o.append(chapter(ch, L, T, ('graal' if L == 'en' else 'kaamelott') if ch.get('alt') else None))
    # rechange
    other = 'kaamelott' if L == 'en' else 'graal'
    o.append(f'<div><h2>6. {e(T["s_alt"])}</h2><p>{e(C.ALT_TEXT[L])}</p></div>')
    o.append(chapter({'n': 17}, L, T, other))
    # personnages
    o.append(f'<div class="page"><h2>7. {e(T["s_per"])}</h2><p class="small">{e(T["per_note"])}</p>')
    for (gfr, gen), items in C.PERSOS:
        o.append(f'<div class="grp"><h3>{e(gfr if L == "fr" else gen)}</h3><div class="grid">')
        for cid, nfr, nen in items:
            t = thumb(cid)
            o.append(f'<div class="cell">' + (f'<img src="{u(t)}">' if t else f'<div class="ph">{e(T["per_wait"])}</div>') + f'<div>{e(nfr if L == "fr" else nen)}</div></div>')
        o.append('</div></div>')
    o.append('</div>')
    # banque
    TY = {'jeu': T['game'], 'film': T['film'], 'films': T['films'], 'serie': T['serie']}
    o.append(f'<div class="page"><h2>8. {e(T["s_bank"])}</h2><table><tr><th>{e(T["ref"])}</th><th>{e(T["type"])}</th><th>{e(T["hum"])}</th><th>{e(T["notor"])}</th><th>{e(T["feas"])}</th><th>{e(T["tot"])}</th><th>{e(T["status"])}</th></tr>'
             + ''.join(f'<tr><td><b>{e(fr if L == "fr" else en)}</b></td><td>{e(TY[ty])}</td><td class="n">{h}</td><td class="n">{nn}</td><td class="n">{f}</td><td class="n"><b>{h + nn + f}</b></td><td>{e(sfr if L == "fr" else sen)}</td></tr>'
                       for fr, en, ty, h, nn, f, sfr, sen in C.BANK) + '</table></div>')
    # plan
    o.append(f'<div><h2>9. {e(T["s_plan"])}</h2><ol>' + ''.join(f'<li>{x}</li>' for x in C.PLAN[L]) + '</ol></div>')
    o.append('</body></html>')
    hp = os.path.join(OUT, f'bible_{L}.html'); open(hp, 'w', encoding='utf-8').write(''.join(o))
    pdf = os.path.join(DOC, f'saison2_bible_{L}.pdf')
    subprocess.run([CH, '--headless', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files', f'--print-to-pdf={pdf}', u(hp)], check=True, capture_output=True)
    print('ok', pdf, os.path.getsize(pdf) // 1024, 'Ko')


for L in ('fr', 'en'): build(L)
