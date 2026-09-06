"""Figure: a forest cross-section, annotated with the places data comes from.

Two jobs. It gives the page a real illustration instead of a decorative one,
and it answers the question people arrive with — "is what I collect the kind
of thing you work with?" — by drawing the answer: satellites above, drones
below them, recorders in the canopy, camera traps at knee height, a transect
on the ground, samples under it. Numbered pins keep the labels out of the
picture; the legend is HTML so it stays readable and selectable.
"""
import math, random

random.seed(7)
W, H = 1400, 760
GROUND = 636          # 0 m
TOP_M  = 45           # metres at y=178
def m2y(m): return GROUND - (m / TOP_M) * (GROUND - 178)

SKY_1, SKY_2 = "#E4EBE5", "#F2F0E9"
BACK, MID, FRONT = "#B9CDB4", "#86A98C", "#4F7C61"
TRUNK_B, TRUNK_F = "#7C9481", "#3B5D4A"
SOIL, SOIL_2 = "#CBBBA0", "#B0997C"
INK, LEAD = "#26332B", "#6E7C70"

o = []
a = o.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
  f'role="img" aria-label="Cross-section of a forest showing where ecological data is '
  f'collected: satellite imagery and drone survey above the canopy, an acoustic recorder '
  f'at 25 metres, a camera trap near the ground, a transect walked along the floor, and '
  f'soil or eDNA samples below it">')
a('<defs>'
  f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
  f'<stop offset="0" stop-color="{SKY_1}"/><stop offset="1" stop-color="{SKY_2}"/></linearGradient>'
  '<pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">'
  f'<circle cx="1" cy="1" r="0.6" fill="{INK}" opacity="0.16"/></pattern>'
  '</defs>')
a(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')

# ── distant ridgeline ──────────────────────────────────────────
def ridge(base, amp, seed, fill, op):
    random.seed(seed)
    pts = []
    for i in range(41):
        x = W * i / 40
        pts.append((x, base - amp * (0.55 + 0.45 * math.sin(i * 0.42 + seed)) - random.uniform(0, amp * 0.22)))
    d = [f"M0 {H} L0 {pts[0][1]:.0f}"]
    for i in range(40):
        x0, y0 = pts[i]; x1, y1 = pts[i+1]
        d.append(f"Q{x0:.0f} {y0:.0f} {(x0+x1)/2:.0f} {(y0+y1)/2:.0f}")
    d.append(f"L{W} {H} Z")
    a(f'<path d="{" ".join(d)}" fill="{fill}" opacity="{op}"/>')

ridge(GROUND - 40, 96, 3, "#C9D6C6", 0.85)
ridge(GROUND - 16, 58, 9, "#B4C8B1", 0.9)

# ── trees ──────────────────────────────────────────────────────
random.seed(21)

def crown(cx, top, w, h, fill):
    """A broadleaf crown: overlapping ellipses in one flat colour."""
    parts = [f'<ellipse cx="{cx}" cy="{top + h*0.55:.0f}" rx="{w*0.5:.0f}" ry="{h*0.45:.0f}"/>']
    for _ in range(6):
        ex = cx + random.uniform(-w*0.34, w*0.34)
        ey = top + h * random.uniform(0.18, 0.78)
        er = random.uniform(w*0.20, w*0.34)
        parts.append(f'<ellipse cx="{ex:.0f}" cy="{ey:.0f}" rx="{er:.0f}" ry="{er*0.86:.0f}"/>')
    a(f'<g fill="{fill}">' + "".join(parts) + '</g>')

def conifer(cx, top, w, h, fill):
    steps, d = 5, []
    for i in range(steps):
        f = i / steps
        y0 = top + h * f
        y1 = top + h * (f + 1.0 / steps) + h * 0.04
        hw = w * (0.16 + 0.42 * (f + 0.35))
        d.append(f"M{cx:.0f} {y0:.0f} L{cx-hw:.0f} {y1:.0f} L{cx+hw:.0f} {y1:.0f} Z")
    a(f'<path fill="{fill}" d="{" ".join(d)}"/>')

def tree(cx, base, height, w, crown_fill, trunk_fill, kind=None):
    top = base - height
    tw = max(4, w * 0.055)
    # distance rows get no trunk — at that depth the understorey closes over it,
    # and drawn ones read as loose rectangles between the crowns
    if trunk_fill:
        a(f'<path fill="{trunk_fill}" d="M{cx-tw:.0f} {base:.0f} L{cx-tw*0.62:.0f} {top+height*0.28:.0f} '
          f'L{cx+tw*0.62:.0f} {top+height*0.28:.0f} L{cx+tw:.0f} {base:.0f} Z"/>')
    kind = kind or random.choice(["broad", "broad", "broad", "conifer"])
    (conifer if kind == "conifer" else crown)(cx, top, w, height * 0.72, crown_fill)

# back row
for x in range(120, W + 60, 118):
    tree(x + random.randint(-22, 22), GROUND - 8, random.randint(150, 210),
         random.randint(108, 150), BACK, None)
# middle row
for x in range(70, W + 60, 152):
    tree(x + random.randint(-26, 26), GROUND + 2, random.randint(215, 285),
         random.randint(130, 178), MID, TRUNK_B)
# emergents, front row — the two that carry instruments
FRONT_TREES = [(430, 452, 190), (980, 470, 205), (170, 330, 150), (1270, 350, 165), (700, 300, 140)]
for cx, hgt, w in FRONT_TREES:
    tree(cx, GROUND + 10, hgt, w, FRONT, TRUNK_F, "broad")
for x in (300, 560, 850, 1120):
    tree(x, GROUND + 10, random.randint(190, 240), random.randint(96, 124), FRONT, TRUNK_F)

# ── ground ─────────────────────────────────────────────────────
a(f'<rect x="0" y="{GROUND}" width="{W}" height="{H-GROUND}" fill="{SOIL}"/>')
a(f'<rect x="0" y="{GROUND+62}" width="{W}" height="{H-GROUND-62}" fill="{SOIL_2}" opacity="0.55"/>')
a(f'<line x1="0" y1="{GROUND}" x2="{W}" y2="{GROUND}" stroke="{INK}" stroke-width="1.4" opacity="0.45"/>')
random.seed(5)
a(f'<g fill="{INK}" opacity="0.18">')
for _ in range(240):
    a(f'<circle cx="{random.uniform(0,W):.0f}" cy="{random.uniform(GROUND+6,H):.0f}" r="{random.uniform(0.7,1.9):.1f}"/>')
a('</g>')

# ── height axis ────────────────────────────────────────────────
a(f'<g stroke="{LEAD}" stroke-width="1" opacity="0.75">')
a(f'<line x1="58" y1="{m2y(45):.0f}" x2="58" y2="{GROUND}"/>')
for m in (0, 10, 25, 45):
    a(f'<line x1="52" y1="{m2y(m):.0f}" x2="64" y2="{m2y(m):.0f}"/>')
a('</g>')
for m in (0, 10, 25, 45):
    a(f'<text x="44" y="{m2y(m)+4:.0f}" text-anchor="end" font-family="DM Mono, ui-monospace, monospace" '
      f'font-size="13" fill="{LEAD}">{m} m</text>')

# ── instruments ────────────────────────────────────────────────
def pin(n, x, y, to=None):
    if to:
        a(f'<line x1="{x}" y1="{y}" x2="{to[0]}" y2="{to[1]}" stroke="{INK}" stroke-width="1.2" opacity="0.55"/>')
    a(f'<circle cx="{x}" cy="{y}" r="15" fill="{SKY_2}" stroke="{INK}" stroke-width="1.3"/>')
    a(f'<text x="{x}" y="{y+4.5}" text-anchor="middle" font-family="DM Mono, ui-monospace, monospace" '
      f'font-size="13" fill="{INK}">{n}</text>')

# 01 satellite
a(f'<g stroke="{INK}" stroke-width="1.4" fill="none" opacity="0.9">'
  f'<rect x="1128" y="78" width="30" height="22" rx="3" fill="{SKY_2}"/>'
  f'<rect x="1096" y="82" width="26" height="14" rx="2" fill="{SKY_2}"/>'
  f'<rect x="1164" y="82" width="26" height="14" rx="2" fill="{SKY_2}"/>'
  f'<path d="M1143 100 L1143 128" stroke-dasharray="5 5"/></g>')
pin("01", 1236, 89, (1196, 89))

# 02 drone
a(f'<g stroke="{INK}" stroke-width="1.4" fill="none" opacity="0.9">'
  f'<rect x="836" y="176" width="26" height="11" rx="3" fill="{SKY_2}"/>'
  f'<path d="M812 172 L836 180 M862 180 L886 172"/>'
  f'<ellipse cx="808" cy="170" rx="14" ry="3.5" fill="{SKY_2}"/>'
  f'<ellipse cx="890" cy="170" rx="14" ry="3.5" fill="{SKY_2}"/></g>')
pin("02", 762, 178, (800, 178))

# 03 acoustic recorder, 25 m
a(f'<g stroke="{INK}" stroke-width="1.3" opacity="0.95">'
  f'<rect x="418" y="{m2y(25)-13:.0f}" width="26" height="30" rx="4" fill="{SKY_2}"/>'
  f'<circle cx="431" cy="{m2y(25)-1:.0f}" r="5" fill="none"/></g>')
a(f'<line x1="58" y1="{m2y(25):.0f}" x2="410" y2="{m2y(25):.0f}" stroke="{LEAD}" '
  f'stroke-width="1" stroke-dasharray="4 6" opacity="0.6"/>')
pin("03", 350, m2y(25) - 52, (424, m2y(25) - 20))

# 04 camera trap
a(f'<g stroke="{INK}" stroke-width="1.3" opacity="0.95">'
  f'<rect x="968" y="{GROUND-72}" width="30" height="22" rx="4" fill="{SKY_2}"/>'
  f'<circle cx="983" cy="{GROUND-61}" r="5.5" fill="none"/></g>')
pin("04", 1074, GROUND - 96, (1004, GROUND - 68))

# 05 transect on the floor
a(f'<path d="M150 {GROUND+30} L1250 {GROUND+30}" stroke="{INK}" stroke-width="1.5" '
  f'stroke-dasharray="12 9" opacity="0.65"/>')
for x in range(210, 1250, 130):
    a(f'<line x1="{x}" y1="{GROUND+23}" x2="{x}" y2="{GROUND+37}" stroke="{INK}" stroke-width="1.3" opacity="0.5"/>')
pin("05", 1310, GROUND + 30, (1258, GROUND + 30))

# 06 soil / eDNA core
a(f'<g stroke="{INK}" stroke-width="1.3" opacity="0.9" fill="none">'
  f'<path d="M560 {GROUND+8} L560 {GROUND+86}"/>'
  f'<rect x="548" y="{GROUND+86}" width="24" height="30" rx="3" fill="{SOIL}"/></g>')
pin("06", 470, GROUND + 96, (540, GROUND + 100))

a(f'<rect width="{W}" height="{H}" fill="url(#grain)" opacity="0.5"/>')
a('</svg>')

svg = "".join(o)
open("src/assets/generated/cross-section.svg", "w").write(svg)
print("cross-section", round(len(svg)/1024, 1), "KB")
