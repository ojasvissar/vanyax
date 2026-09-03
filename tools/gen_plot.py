"""Hero graphic: an occurrence plot.

Biodiversity data mostly arrives as points — a record of a species, at a
place, on a date. This draws that: a graticule, a study boundary, clustered
observations, a transect line. It is illustrative, not real data, so it
carries no labels that would imply otherwise.
"""
import math
import random

random.seed(23)

W, H = 1200, 640
MOSS = "#6FA383"
SAND = "#D9B65A"
SKY  = "#7FA8C4"

out = []
el = out.append

# ── study boundary: an organic closed curve ──────────
def boundary(cx, cy, rx, ry, wobble=0.16, n=13):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + random.uniform(-wobble, wobble)
        pts.append((cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k))
    d = [f"M{(pts[0][0]+pts[1][0])/2:.1f} {(pts[0][1]+pts[1][1])/2:.1f}"]
    for i in range(1, n + 1):
        p0, p1 = pts[i % n], pts[(i + 1) % n]
        mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
        d.append(f"Q{p0[0]:.1f} {p0[1]:.1f} {mx:.1f} {my:.1f}")
    return " ".join(d) + " Z"

REGION = boundary(600, 320, 430, 232)

def inside(x, y, cx=600, cy=320, rx=430, ry=232):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.9

el(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="plot" '
   f'role="img" aria-label="An illustrative occurrence plot: clustered observation '
   f'points inside a study boundary, crossed by a transect line">')

el('<g class="plot__grid">')
for x in range(100, W, 100):
    el(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
for y in range(80, H, 80):
    el(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
el('</g>')

el(f'<path class="plot__region" d="{REGION}"/>')

# ── observations: five clusters plus a sparse background ──
el('<g class="plot__points">')
clusters = [(330, 250, 78), (520, 400, 96), (760, 240, 86), (880, 420, 70), (610, 180, 64)]
dots = []
for cx, cy, spread in clusters:
    for _ in range(74):
        x, y = random.gauss(cx, spread), random.gauss(cy, spread * 0.72)
        if inside(x, y):
            dots.append((x, y, random.random()))
for _ in range(150):
    x, y = random.uniform(60, W - 60), random.uniform(60, H - 60)
    if inside(x, y):
        dots.append((x, y, random.random()))

for x, y, r in dots:
    if r > 0.94:
        fill, rad, op = SAND, 4.6, 0.95
    elif r > 0.86:
        fill, rad, op = SKY, 4.2, 0.9
    else:
        fill, rad, op = MOSS, 3.0 + r * 2.2, 0.45 + r * 0.45
    el(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rad:.1f}" fill="{fill}" opacity="{op:.2f}"/>')
el('</g>')

# ── transect: the walked line the records hang off ───
el('<path class="plot__transect" d="M196 452 C360 372 430 300 574 286 '
   'C712 272 792 214 968 196"/>')
for t in (0.08, 0.3, 0.52, 0.74, 0.95):
    x = 196 + (968 - 196) * t
    y = 452 - (452 - 196) * (t ** 0.86)
    el(f'<line class="plot__tick" x1="{x:.1f}" y1="{y-7:.1f}" x2="{x:.1f}" y2="{y+7:.1f}"/>')

# ── three ringed records ─────────────────────────────
for cx, cy in ((520, 396), (762, 236), (334, 258)):
    el(f'<circle class="plot__ring" cx="{cx}" cy="{cy}" r="17"/>')
    el(f'<circle cx="{cx}" cy="{cy}" r="4" fill="{SAND}"/>')

el('</svg>')

svg = "".join(out)
open("src/assets/occurrence.svg", "w").write(svg)
print(f"{len(svg)/1024:.1f} KB")
