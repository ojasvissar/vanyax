#!/usr/bin/env python3
"""Flat badge art for vanyax.

Writes src/assets/wild/*.svg in the style of a national-park brand board:
narrow cut-out pines with stepped tiers, a crescent moon, small stars, and
simple two-colour icons for the five services. Every shape is flat — one
fill, no gradient, no outline — so it sits on the colour tiles the way a
screenprinted patch does. Run from the repo root:
    python3 tools/gen_wild.py
"""
import math
import os

OUT = 'src/assets/wild'
MOCHA, CREAM, PINE, MOSS, MAPLE, BERRY = '#3b3735', '#f4ecd8', '#196555', '#beaa30', '#f16a46', '#6380c0'


def f(n): return f'{n:.1f}'
def poly(pts): return 'M' + ' L'.join(f'{f(x)},{f(y)}' for x, y in pts) + ' Z'


def pine(cx, base, h, w):
    """A narrow spruce: three tiers, each stepping in where the next begins."""
    t = base - h
    p = [(cx, t),
         (cx + w * .22, t + h * .30), (cx + w * .12, t + h * .30),
         (cx + w * .36, t + h * .62), (cx + w * .22, t + h * .62),
         (cx + w * .50, base),
         (cx - w * .50, base),
         (cx - w * .22, t + h * .62), (cx - w * .36, t + h * .62),
         (cx - w * .12, t + h * .30), (cx - w * .22, t + h * .30)]
    return poly(p)


def moon(cx, cy, r):
    """A crescent: the outer arc, then the inner arc cut back across it."""
    # the inner arc needs a radius larger than the outer one: shorter than the
    # half-chord, an SVG arc is scaled up to exactly the outer circle and the
    # crescent encloses nothing
    return (f'M{f(cx)},{f(cy - r)} A{f(r)},{f(r)} 0 0 0 {f(cx)},{f(cy + r)} '
            f'A{f(r * 1.3)},{f(r * 1.3)} 0 0 1 {f(cx)},{f(cy - r)} Z')


def star(cx, cy, r):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * .42
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return poly(pts)


def svg(w, h, body, label=None):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
            + body + '</svg>\n')


def write(name, text):
    with open(os.path.join(OUT, name), 'w') as fh:
        fh.write(text)
    print(f'  {name:20} {len(text):6} B')


def main():
    os.makedirs(OUT, exist_ok=True)
    # the two badge scenes from the hero
    write('night.svg', svg(200, 200, f'<path class="tree" d="{pine(92, 200, 176, 112)}" fill="{MOCHA}"/>'
                                     f'<path class="moon" d="{moon(160, 40, 22)}" fill="{MOCHA}"/>'))
    write('stars.svg', svg(200, 200, f'<path class="tree" d="{pine(100, 200, 170, 104)}" fill="{MOCHA}"/>'
                                     f'<path class="star" d="{star(150, 38, 12)}" fill="{MOCHA}"/>'
                                     f'<circle class="star" cx="40" cy="96" r="4" fill="{MOCHA}"/>'
                                     f'<circle class="star" cx="156" cy="126" r="4" fill="{MOCHA}"/>'))
    # one pine on its own, for the wordmark, the banner and anywhere a tree stands in
    write('pine.svg', svg(60, 100, f'<path d="{pine(30, 100, 100, 58)}" fill="currentColor"/>'))
    # five service icons: mocha shapes with one cream detail
    icons = {
        'audio': f'<path d="{pine(46, 120, 104, 66)}" fill="{MOCHA}"/>'
                 + ''.join(f'<path d="M{78 + i * 14},{50 - i * 8} q{14 + i * 6},{22 + i * 8} 0,{44 + i * 16}" fill="none" stroke="{MOCHA}" stroke-width="7" stroke-linecap="round"/>' for i in range(3)),
        'camera': f'<rect x="22" y="10" width="22" height="110" fill="{MOCHA}"/>'
                  f'<rect x="40" y="48" width="42" height="34" rx="6" fill="{MOCHA}"/><circle cx="61" cy="65" r="9" fill="{CREAM}"/>'
                  + ''.join(f'<path d="M90,{58 + i * 8} l{24 + i * 6},{-8 + i * 8}" stroke="{MOCHA}" stroke-width="5" stroke-linecap="round"/>' for i in range(3)),
        'survey': ''.join(f'<rect x="{x}" y="{y}" width="6" height="64" fill="{MOCHA}"/><path d="M{x + 6},{y} l26,10 l-26,10 Z" fill="{MOCHA}"/>' for x, y in [(14, 46), (64, 38), (114, 50)])
                  + f'<path d="M6,116 L146,112" stroke="{MOCHA}" stroke-width="5" stroke-dasharray="10 8"/>',
        'satellite': f'<g transform="rotate(-28 75 60)"><rect x="18" y="50" width="40" height="22" fill="{MOCHA}"/><rect x="60" y="42" width="30" height="38" rx="5" fill="{MOCHA}"/>'
                     f'<rect x="92" y="50" width="40" height="22" fill="{MOCHA}"/><circle cx="75" cy="61" r="7" fill="{CREAM}"/></g>'
                     f'<path d="M80,86 L50,122 M80,86 L112,122" stroke="{MOCHA}" stroke-width="4" stroke-dasharray="7 6"/>',
        'edna': f'<g transform="rotate(14 75 64)"><rect x="56" y="6" width="38" height="112" rx="19" fill="{MOCHA}"/>'
                f'<rect x="63" y="58" width="24" height="52" rx="12" fill="{CREAM}"/><rect x="48" y="2" width="54" height="14" rx="5" fill="{MOCHA}"/></g>',
    }
    for k, body in icons.items():
        write(f'icon-{k}.svg', svg(150, 130, body))
    # the emblem: a pine under a moon on a maple square
    write('emblem.svg', svg(100, 100, f'<rect width="100" height="100" rx="20" fill="{MAPLE}"/>'
                                      f'<path d="{pine(44, 100, 86, 56)}" fill="{MOCHA}"/><path d="{moon(76, 24, 11)}" fill="{MOCHA}"/>'))


if __name__ == '__main__':
    main()
