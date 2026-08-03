#!/usr/bin/env python3
"""Screenprint illustrations for vanyax.

Writes src/assets/illo/*.svg: the hero landscape in parallax layers, grass
edges for the joins between bands, two circular vignettes, five small scenes
for the services, and the emblem. The look is a two- or three-colour print:
flat fills, hatching that follows the land, grass drawn blade by blade.
Seeded, so a rerun gives the same pictures. Run from the repo root:
    python3 tools/gen_illustration.py
"""
import math
import os
import random

OUT = 'src/assets/illo'
C = dict(forest='#1f3b27', forest2='#2a4a31', ink='#1b281e', cream='#f3eee2', cream2='#faf7ef',
         lime='#c8d46a', limelt='#e4eab2', sky='#b6d8de', sky2='#d9edf0', sand='#d9b98f', tan='#b98a5c',
         rust='#b6552c', brown='#6f4b32', grass='#87a94a', grassdk='#557f34', grassxd='#3d6328', olive='#a3b65a')
rng = random.Random(4207)


def f(n): return f'{n:.1f}'
def poly(pts): return 'M' + ' L'.join(f'{f(x)},{f(y)}' for x, y in pts) + ' Z'
def line(pts): return 'M' + ' L'.join(f'{f(x)},{f(y)}' for x, y in pts)


def rolling(w, base, amp, waves, phase=None):
    """A smooth prairie skyline: a few sines added together."""
    ph = phase or [rng.uniform(0, math.tau) for _ in waves]
    def y(x):
        return base - sum(a * math.sin(x / w * math.tau * k + p) for (k, a), p in zip(waves, ph)) * amp
    return y


def hill(w, h, yf, fill, hatch=None, rows=0, gap=11, step=8):
    pts = [(x, yf(x)) for x in range(0, w + step, step)]
    out = f'<path d="{poly([(0, h)] + pts + [(w, h)])}" fill="{fill}"/>'
    if hatch:   # linocut lines that follow the land, thinning out as they go down
        for r in range(1, rows + 1):
            off = r * gap
            seg, d = [], ''
            for x, y in pts:
                if rng.random() < 0.08 * r / rows + 0.02:
                    if len(seg) > 2: d += line(seg)
                    seg = []
                else:
                    seg.append((x, y + off + math.sin(x / 37 + r) * 2))
            if len(seg) > 2: d += line(seg)
            out += f'<path d="{d}" fill="none" stroke="{hatch}" stroke-width="{max(0.8, 2.2 - r * 0.25):.1f}" stroke-linecap="round"/>'
    return out


def blade(x, base, h, lean, w=3.2):
    tip = (x + lean, base - h)
    return poly([(x - w, base), (x + lean * 0.45, base - h * 0.55), tip, (x + lean * 0.35 + 0.6, base - h * 0.5), (x + w, base)])


def grass(w, base, n, hmin, hmax, colours, wmin=2.2, wmax=4.2):
    by = {c: [] for c in colours}
    for _ in range(n):
        x = rng.uniform(-10, w + 10)
        c = rng.choice(colours)
        by[c].append(blade(x, base + rng.uniform(0, 6), rng.uniform(hmin, hmax), rng.uniform(-14, 14), rng.uniform(wmin, wmax)))
    return ''.join(f'<path d="{"".join(v)}" fill="{c}"/>' for c, v in by.items() if v)


def tree_round(x, base, h, light, dark, trunk):
    r = h * 0.34
    cy = base - h + r
    out = f'<rect x="{f(x - h * 0.035)}" y="{f(cy)}" width="{f(h * 0.07)}" height="{f(base - cy)}" fill="{trunk}"/>'
    out += f'<circle cx="{f(x)}" cy="{f(cy)}" r="{f(r)}" fill="{light}"/>'
    out += f'<path d="M{f(x)},{f(cy - r)} A{f(r)},{f(r)} 0 0 1 {f(x)},{f(cy + r)} Z" fill="{dark}"/>'
    return out


def fir(x, base, h, fill):
    w = h * 0.42
    p = [(x, base - h), (x + w * .3, base - h * .66), (x + w * .16, base - h * .66), (x + w * .42, base - h * .36),
         (x + w * .24, base - h * .36), (x + w * .5, base - h * .06), (x - w * .5, base - h * .06), (x - w * .24, base - h * .36),
         (x - w * .42, base - h * .36), (x - w * .16, base - h * .66), (x - w * .3, base - h * .66)]
    return f'<path d="{poly(p)}" fill="{fill}"/>'


def cloud(x, y, s, fill):
    bumps = [(0, 0, 1), (0.9, -0.35, 1.15), (1.9, -0.1, 0.95), (2.7, 0.15, 0.7), (-0.8, 0.2, 0.7)]
    out = ''.join(f'<circle cx="{f(x + bx * s)}" cy="{f(y + by * s)}" r="{f(r * s)}" fill="{fill}"/>' for bx, by, r in bumps)
    return out + f'<rect x="{f(x - 1.4 * s)}" y="{f(y + 0.1 * s)}" width="{f(4.4 * s)}" height="{f(0.9 * s)}" rx="{f(0.45 * s)}" fill="{fill}"/>'


def bird(x, y, s, c):
    return f'<path d="M{f(x - s)},{f(y)} Q{f(x - s * .45)},{f(y - s * .55)} {f(x)},{f(y)} Q{f(x + s * .45)},{f(y - s * .55)} {f(x + s)},{f(y)}" fill="none" stroke="{c}" stroke-width="{f(max(1.6, s * .16))}" stroke-linecap="round"/>'


def svg(body, w, h, par='xMidYMax slice'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="{par}">{body}</svg>\n'


def write(name, text):
    with open(os.path.join(OUT, name), 'w') as fh: fh.write(text)
    print(f'  {name:22} {len(text) / 1024:6.1f} KB')


def main():
    os.makedirs(OUT, exist_ok=True)
    W = 1600

    # ── hero, back to front ──
    write('hero-clouds.svg', svg(cloud(230, 120, 34, C['cream2']) + cloud(1210, 80, 40, C['cream2']) + cloud(1460, 210, 20, C['sky2']), W, 300, 'xMidYMin slice'))
    far = rolling(W, 300, 34, [(1, 1), (2.3, .55), (4.1, .25)])
    write('hero-far.svg', svg(hill(W, 520, far, C['sand'], C['tan'], 5, 13), W, 520))
    mid = rolling(W, 330, 40, [(1.4, 1), (3.2, .5), (5.3, .2)])
    body = hill(W, 520, mid, C['grass'], C['olive'], 7, 14)
    for _ in range(9):
        x = rng.uniform(40, W - 40)
        body += tree_round(x, mid(x) + 6, rng.uniform(40, 70), C['grassdk'], C['grassxd'], C['brown'])
    for _ in range(14):
        x = rng.uniform(0, W)
        body += fir(x, mid(x) + 8, rng.uniform(34, 62), C['grassxd'])
    write('hero-mid.svg', svg(body, W, 520))
    near = rolling(W, 400, 22, [(2, 1), (4.6, .4)])
    body = hill(W, 520, near, C['grassdk'], None)
    body += grass(W, near(W / 2) + 4, 900, 22, 70, [C['grassxd'], C['grass'], C['olive'], C['grassdk']])
    # a recording post on the left and a camera-trapped tree on the right
    body += f'<rect x="250" y="300" width="9" height="130" fill="{C["brown"]}"/><rect x="236" y="300" width="37" height="30" rx="4" fill="{C["forest"]}"/><circle cx="254" cy="315" r="6" fill="{C["lime"]}"/>'
    body += tree_round(1440, 432, 210, C['grassdk'], C['grassxd'], C['brown'])
    body += f'<rect x="1426" y="372" width="20" height="25" rx="3" fill="{C["forest"]}"/><circle cx="1436" cy="384" r="4.5" fill="{C["sky"]}"/>'
    for _ in range(26):
        x, y = rng.uniform(0, W), rng.uniform(410, 470)
        body += f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rng.uniform(3, 5.5))}" fill="{rng.choice([C["cream2"], C["rust"], C["lime"]])}"/>'
    body += f'<rect x="0" y="470" width="{W}" height="60" fill="{C["grassxd"]}"/>'
    write('hero-near.svg', svg(body, W, 520))
    write('hero-birds.svg', svg(bird(20, 30, 14, C['forest']) + bird(60, 16, 10, C['forest']) + bird(92, 36, 8, C['forest']), 120, 50, 'xMidYMid meet'))

    # ── grass edges: blades rising out of a band into the one above ──
    for name, col in [('forest', C['forest']), ('cream', C['cream']), ('lime', C['limelt']), ('ink', C['ink'])]:
        body = f'<rect x="0" y="54" width="{W}" height="20" fill="{col}"/>' + grass(W, 60, 520, 12, 52, [col], 2.4, 4.6)
        write(f'edge-{name}.svg', svg(body, W, 74, 'xMidYMax slice'))

    # ── circular vignettes: a scene inside a disc, grass spilling out of the bottom ──
    def vignette(name, extras):
        S = 400
        body = f'<defs><clipPath id="c"><circle cx="200" cy="190" r="168"/></clipPath></defs><g clip-path="url(#c)">'
        body += f'<rect width="{S}" height="{S}" fill="{C["sky"]}"/>' + cloud(110, 90, 16, C['cream2'])
        hy = rolling(S, 230, 16, [(1, 1), (2.5, .4)])
        body += hill(S, S, hy, C['sand'], C['tan'], 3, 10, 6)
        gy = rolling(S, 275, 12, [(1.3, 1), (3, .4)])
        body += hill(S, S, gy, C['grass'], C['olive'], 5, 12, 6) + extras + '</g>'
        body += grass(S, 352, 170, 14, 46, [C['grassdk'], C['grassxd'], C['olive']], 2, 4)
        write(f'vignette-{name}.svg', svg(body, S, S + 10, 'xMidYMid meet'))
    vignette('approach', tree_round(290, 285, 120, C['grassdk'], C['grassxd'], C['brown'])
             + f'<rect x="120" y="230" width="7" height="70" fill="{C["brown"]}"/><rect x="108" y="226" width="31" height="24" rx="3" fill="{C["forest"]}"/><circle cx="124" cy="238" r="5" fill="{C["lime"]}"/>'
             + bird(250, 120, 12, C['forest']))
    vignette('questions', ''.join(fir(x, 290, h, C['grassxd']) for x, h in [(90, 90), (130, 120), (300, 100), (335, 70)])
             + f'<path d="M150,330 Q200,300 260,330" fill="none" stroke="{C["sky2"]}" stroke-width="10" stroke-linecap="round"/>' + bird(210, 110, 11, C['forest']))

    # ── five small scenes for the services ──
    def card(name, scene):
        S = 300
        body = f'<rect width="{S}" height="220" rx="18" fill="{C["sky2"]}"/>'
        gy = rolling(S, 165, 8, [(1, 1)])
        body += hill(S, 220, gy, C['grass'], C['olive'], 3, 10, 6) + scene
        body += grass(S, 220, 110, 8, 26, [C['grassdk'], C['grassxd']], 1.6, 3)
        write(f'service-{name}.svg', svg(f'<defs><clipPath id="r"><rect width="{S}" height="220" rx="18"/></clipPath></defs><g clip-path="url(#r)">{body}</g>', S, 220, 'xMidYMid meet'))
    waves = ''.join(f'<path d="M{170 + r * 14},{70 - r * 6} q{8 + r * 4},{18 + r * 4} 0,{36 + r * 12}" fill="none" stroke="{C["rust"]}" stroke-width="3" stroke-linecap="round"/>' for r in range(3))
    card('audio', tree_round(110, 185, 150, C['grassdk'], C['grassxd'], C['brown'])
         + f'<rect x="138" y="96" width="26" height="30" rx="3" fill="{C["forest"]}"/><circle cx="151" cy="110" r="6" fill="{C["lime"]}"/>' + waves)
    card('camera', f'<rect x="70" y="40" width="36" height="160" fill="{C["brown"]}"/>'
         + f'<rect x="96" y="104" width="40" height="34" rx="4" fill="{C["forest"]}"/><circle cx="116" cy="121" r="8" fill="{C["sky"]}"/><circle cx="116" cy="121" r="3.5" fill="{C["ink"]}"/>'
         + ''.join(f'<path d="M140,{112 + i * 8} l{30 + i * 6},{-10 + i * 10}" stroke="{C["lime"]}" stroke-width="3" stroke-linecap="round"/>' for i in range(3)))
    flags = ''.join(f'<rect x="{x}" y="{y}" width="3" height="46" fill="{C["brown"]}"/><path d="M{x + 3},{y} l20,7 l-20,7 Z" fill="{C["rust"]}"/>' for x, y in [(60, 122), (130, 118), (200, 124), (262, 120)])
    card('survey', f'<path d="M20,170 L280,166" stroke="{C["cream2"]}" stroke-width="3" stroke-dasharray="7 7"/>' + flags)
    card('satellite', cloud(60, 60, 12, C['cream2'])
         + f'<g transform="rotate(-24 190 70)"><rect x="150" y="62" width="34" height="18" fill="{C["sky"]}" stroke="{C["forest"]}" stroke-width="3"/><rect x="184" y="56" width="22" height="30" rx="3" fill="{C["forest"]}"/><rect x="206" y="62" width="34" height="18" fill="{C["sky"]}" stroke="{C["forest"]}" stroke-width="3"/></g>'
         + f'<path d="M195,96 L150,160 M195,96 L240,160" stroke="{C["lime"]}" stroke-width="2.5" stroke-dasharray="5 6"/>')
    card('edna', f'<path d="M0,182 Q80,168 150,184 T300,180 L300,220 L0,220 Z" fill="{C["sky"]}"/>'
         + f'<g transform="rotate(12 160 110)"><rect x="146" y="50" width="28" height="96" rx="14" fill="{C["cream2"]}" stroke="{C["forest"]}" stroke-width="4"/><rect x="149" y="104" width="22" height="38" rx="11" fill="{C["sky"]}"/><rect x="140" y="44" width="40" height="12" rx="4" fill="{C["rust"]}"/></g>')

    # ── the emblem: a square print of a field with a sun and a bird ──
    body = f'<rect x="3" y="3" width="94" height="94" rx="10" fill="{C["cream"]}" stroke="{C["cream"]}" stroke-width="6"/>'
    body += f'<rect x="9" y="9" width="82" height="82" rx="6" fill="{C["sky"]}"/><circle cx="68" cy="30" r="9" fill="{C["cream2"]}"/>'
    body += f'<path d="M9,60 Q40,46 91,58 L91,91 L9,91 Z" fill="{C["sand"]}"/><path d="M9,72 Q50,60 91,70 L91,91 L9,91 Z" fill="{C["grass"]}"/>'
    body += fir(30, 86, 30, C['grassxd']) + fir(44, 86, 20, C['grassdk']) + f'<path d="M9,84 L91,80" stroke="{C["lime"]}" stroke-width="3"/>' + bird(30, 26, 7, C['forest'])
    write('emblem.svg', svg(body, 100, 100, 'xMidYMid meet'))


if __name__ == '__main__':
    main()
