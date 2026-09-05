"""Hero graphic: an annotated survey map.

Biodiversity data arrives as points — a species, a place, a date. This draws
what that looks like on paper: a halftone sea, a study boundary with contours,
clustered records, a walked transect, and a few stations called out with leader
lines. Illustrative, and captioned as such wherever it appears.
"""
import math, random

random.seed(11)
W = H = 1000
CX, CY, SX, SY = 560, 500, 300, 340

# ── shape: a radial function, so "inside", contours and halftone
#    falloff can all be derived from the same curve ──────────────
PH = [random.uniform(0, 6.28) for _ in range(3)]
def rad(t):
    return 1 + 0.11*math.sin(3*t+PH[0]) + 0.07*math.sin(5*t+PH[1]) + 0.045*math.sin(8*t+PH[2])

def pt(t, k=1.0):
    r = rad(t) * k
    return CX + math.cos(t)*r*SX, CY + math.sin(t)*r*SY

def ring(k=1.0, n=190):
    p = [pt(2*math.pi*i/n, k) for i in range(n)]
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in p) + " Z"

def depth(x, y):
    """<1 inside the boundary, >1 outside — how far out to sea."""
    u, v = (x-CX)/SX, (y-CY)/SY
    d = math.hypot(u, v)
    return d / rad(math.atan2(v, u)) if d else 0

o = []
a = o.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" class="map" role="img" '
  f'aria-label="An illustrative survey map: a study area with contour lines, clustered '
  f'observation records, a transect and three labelled stations">')

# ── halftone: dot size falls off with distance from the coast,
#    the way a printed bathymetric chart fades ───────────────────
a('<g class="map__sea">')
step = 25
for iy in range(-1, H//step + 2):
    for ix in range(-1, W//step + 2):
        x = ix*step + (step/2 if iy % 2 else 0)
        y = iy*step
        d = depth(x, y)
        if d < 1.04:
            continue
        f = max(0.0, 1 - (d - 1.04) / 0.85)
        if f <= 0.02:
            continue
        a(f'<circle cx="{x}" cy="{y}" r="{0.7 + f*2.9:.2f}" opacity="{0.10 + f*0.5:.2f}"/>')
a('</g>')

# ── land: boundary, then contours stepping inward ──────────────
a(f'<path class="map__land" d="{ring(1.0)}"/>')
for k in (0.82, 0.63, 0.44, 0.25):
    a(f'<path class="map__contour" d="{ring(k)}"/>')

# ── records ────────────────────────────────────────────────────
a('<g class="map__records">')
clusters = [(430, 330, 62), (620, 430, 78), (500, 660, 70), (700, 640, 56), (660, 260, 48)]
buckets = {"#83B898": [], "#7FA8C4": [], "#D9B65A": []}
def add(x, y, r, fill, op):
    buckets[fill].append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" opacity="{op:.2f}"/>')

for cx, cy, s in clusters:
    for _ in range(46):
        x, y = random.gauss(cx, s), random.gauss(cy, s*0.85)
        if depth(x, y) < 0.94:
            r = random.random()
            if r > 0.93:   add(x, y, 4.2, "#D9B65A", 0.95)
            elif r > 0.85: add(x, y, 3.9, "#7FA8C4", 0.9)
            else:          add(x, y, 2.6+r*2.0, "#83B898", 0.42+r*0.45)
for _ in range(70):
    x, y = random.uniform(0, W), random.uniform(0, H)
    if depth(x, y) < 0.9:
        add(x, y, 1.8+random.random()*1.4, "#83B898", 0.3)
for fill, circles in buckets.items():
    a(f'<g fill="{fill}">' + "".join(circles) + '</g>')
a('</g>')

# ── transect, with a distance pill the way a field map carries one ──
TRANSECT = "M352 700 C452 610 470 520 570 470 C672 418 700 330 760 240"
a(f'<path class="map__transect" d="{TRANSECT}"/>')
for x, y in ((352, 700), (760, 240)):
    a(f'<circle class="map__cap" cx="{x}" cy="{y}" r="4.5"/>')
a('<g class="map__pill"><rect x="404" y="546" rx="11" width="86" height="23"/>'
  '<text class="map__label" x="447" y="562" text-anchor="middle">4.2 km</text></g>')

# ── stations: short elbow, label set beside it.
#    Long leader lines out to the margin get clipped when the map
#    bleeds off the page, so the callouts stay next to their point.
for (sx, sy), dx, dy, label in (
        ((430, 330), 34, -46, "STATION 01"),
        ((500, 660), 34, 44, "RECORDER 04"),
        ((700, 640), 34, -52, "PLOT 12")):
    ex, ey = sx + dx, sy + dy
    a(f'<path class="map__leader" d="M{sx} {sy} L{ex} {ey} L{ex+46} {ey}"/>')
    a(f'<circle class="map__ring" cx="{sx}" cy="{sy}" r="14"/>')
    a(f'<circle cx="{sx}" cy="{sy}" r="4.5" fill="#D9B65A"/>')
    a(f'<text class="map__label" x="{ex+56}" y="{ey+4.5}">{label}</text>')

a('</svg>')
svg = "".join(o)
open("src/assets/field-map.svg", "w").write(svg)
print("map", round(len(svg)/1024, 1), "KB")
