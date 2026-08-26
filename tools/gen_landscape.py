#!/usr/bin/env python3
"""Paper-cut landscape for vanyax.

Writes the mountain ridges, pine forests and small cut-outs in
src/assets/land/ as SVG. Each ridge is a midpoint-displacement profile —
the way real skylines are rough at every scale — pushed down in the middle
so the hero's headline sits in a valley between peaks. Pines are a single
stacked-fir silhouette, scattered along a ridge with their bases sunk into
it, in the ridge's own colour, so a forested slope reads as one cut piece.

Seeded: running it again produces the same landscape. Run from the repo root:
    python3 tools/gen_landscape.py
"""
import math
import os
import random

OUT = 'src/assets/land'
W, H = 1600, 600

FAR, SNOW, MID, NEAR, FRONT = '#56675f', '#e9e6d8', '#3c4f46', '#2a3d33', '#101a15'
PINE, MOSS, CLAY, SAGE, SLATE = '#1f3d2b', '#7f9f6b', '#c48a64', '#c6d2b1', '#6f8a72'


def profile(rng, base, amp, rough=0.55, valley=0.0, n=512, width=W, height=H):
    """Heights by midpoint displacement, then an optional dip in the middle."""
    h = [0.0] * (n + 1)
    h[0], h[n] = rng.uniform(0.3, 1), rng.uniform(0.3, 1)
    step, scale = n, 1.0
    while step > 1:
        half = step // 2
        for i in range(half, n, step):
            h[i] = (h[i - half] + h[i + half]) / 2 + rng.uniform(-scale, scale)
        step, scale = half, scale * rough
    lo, hi = min(h), max(h)
    pts = []
    for i, v in enumerate(h):
        t = i / n
        v = (v - lo) / (hi - lo or 1)
        v *= 1 - valley * math.exp(-((t - 0.5) / 0.17) ** 2)
        pts.append((t * width, height - (base + v * amp)))
    return pts


def fmt(pts):
    return ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)


def area(pts, height=H):
    return f'M0,{height} L{fmt(pts)} L{pts[-1][0]:.1f},{height} Z'


def fir(x, base, h):
    """One stacked fir: three tiers and a stub of trunk."""
    w = h * 0.42
    p = [(x, base - h),
         (x + w * .30, base - h * .66), (x + w * .16, base - h * .66),
         (x + w * .42, base - h * .36), (x + w * .24, base - h * .36),
         (x + w * .50, base - h * .08), (x + w * .06, base - h * .08),
         (x + w * .06, base), (x - w * .06, base), (x - w * .06, base - h * .08),
         (x - w * .50, base - h * .08), (x - w * .24, base - h * .36),
         (x - w * .42, base - h * .36), (x - w * .16, base - h * .66),
         (x - w * .30, base - h * .66)]
    return 'M' + fmt(p) + ' Z'


def y_at(pts, x):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * ((x - x0) / (x1 - x0 or 1))
    return pts[-1][1]


def sunk(pts, x, h):
    """Where a tree's base goes: below the ground line by the height of its
    lowest tier, so the tier meets the ground and no sky shows between trunks."""
    return y_at(pts, x) + h * 0.08 + 2


def snowcaps(rng, pts, line):
    """Paper snow on every peak above the line, with a torn lower edge."""
    caps, run = [], []
    for p in pts + [(W, H)]:
        if p[1] < line:
            run.append(p)
        elif run:
            if len(run) > 3:
                back, x = [], run[-1][0]
                while x > run[0][0]:
                    back.append((x, max(y_at(run, x) + 3, line + rng.uniform(-8, 16))))
                    x -= rng.uniform(8, 18)
                caps.append('M' + fmt(run + back) + ' Z')
            run = []
    return caps


def forest(rng, pts, every, tall, colour):
    trees, x = [], rng.uniform(0, every[0])
    while x < W:
        h = rng.uniform(*tall)
        trees.append(fir(x, sunk(pts, x, h), h))
        x += rng.uniform(*every)
    return f'<path d="{area(pts)}" fill="{colour}"/>' + ''.join(f'<path d="{t}" fill="{colour}"/>' for t in trees)


def svg(body, w=W, h=H, slice_=True):
    par = ' preserveAspectRatio="xMidYMax slice"' if slice_ else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"{par}>{body}</svg>\n'


def write(name, text):
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(text)
    print(f'  {name:18} {len(text) / 1024:5.1f} KB')


def main():
    rng = random.Random(20260712)
    os.makedirs(OUT, exist_ok=True)

    far = profile(rng, 150, 410, 0.58, valley=0.42)
    caps = ''.join(f'<path d="{c}" fill="{SNOW}"/>' for c in snowcaps(rng, far, H - 470))
    write('hero-far.svg', svg(f'<path d="{area(far)}" fill="{FAR}"/>{caps}'))

    mid = profile(rng, 110, 260, 0.6, valley=0.35)
    write('hero-mid.svg', svg(f'<path d="{area(mid)}" fill="{MID}"/>'))

    near = profile(rng, 70, 150, 0.62, valley=0.2)
    write('hero-near.svg', svg(forest(rng, near, (9, 24), (16, 40), NEAR)))

    front = profile(rng, 30, 40, 0.7)
    write('hero-front.svg', svg(forest(rng, front, (7, 16), (46, 118), FRONT)))

    # the edge of the forest the ask sits above
    edge = profile(rng, 16, 30, 0.7, width=W, height=260)
    trees, x = [], 0.0
    while x < W:
        h = rng.uniform(60, 170)
        trees.append(fir(x, sunk(edge, x, h), h))
        x += rng.uniform(10, 26)
    write('cta-forest.svg', svg(f'<path d="{area(edge, 260)}" fill="{FRONT}"/>'
                                + ''.join(f'<path d="{t}" fill="{FRONT}"/>' for t in trees), h=260))

    # small cut-outs for the collages
    peak = [(0, 150), (38, 92), (60, 104), (98, 18), (128, 70), (146, 58), (200, 150)]
    write('peak.svg', svg(
        f'<path d="M{fmt(peak)} Z" fill="{SLATE}"/>'
        f'<path d="M98,18 L128,70 L146,58 L200,150 L104,150 Z" fill="#56705a"/>'
        f'<path d="M98,18 L116,50 L106,46 L98,56 L88,44 L80,50 Z" fill="{SNOW}"/>', 200, 150, False))
    write('pine.svg', svg(f'<path d="{fir(50, 172, 168)}" fill="{PINE}"/>'
                          f'<rect x="46" y="164" width="8" height="14" fill="{CLAY}"/>', 100, 180, False))
    write('pine-moss.svg', svg(f'<path d="{fir(50, 172, 168)}" fill="{MOSS}"/>'
                               f'<rect x="46" y="164" width="8" height="14" fill="{CLAY}"/>', 100, 180, False))
    strip = profile(rng, 20, 90, 0.55, width=300, height=130, n=128)
    caps = ''.join(f'<path d="{c}" fill="{SNOW}"/>' for c in snowcaps(rng, strip, 130 - 92))
    write('ridge.svg', svg(f'<path d="{area(strip, 130)}" fill="{FAR}"/>{caps}', 300, 130, False))

    # a hill as contour lines: one shared wobble, so the rings nest
    phases = [rng.uniform(0, math.tau) for _ in range(4)]
    rings = []
    for k, r in enumerate(range(16, 96, 11)):
        pts = []
        for i in range(73):
            a = i / 72 * math.tau
            wob = sum(math.sin(a * (j + 2) + phases[j]) / (j + 2) for j in range(4))
            rr = r * (1 + 0.22 * wob * (0.6 + k / 10))
            pts.append((100 + rr * math.cos(a), 100 + rr * math.sin(a) * 0.8))
        rings.append('M' + fmt(pts) + ' Z')
    write('contours.svg', svg(''.join(f'<path d="{d}" fill="none" stroke="{PINE}" stroke-width="2.4"/>' for d in rings),
                              200, 200, False))


if __name__ == '__main__':
    main()
