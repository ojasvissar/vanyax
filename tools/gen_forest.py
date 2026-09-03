"""Hero panorama for vanyax — flat vector forest valley, layered for parallax.

Composition is placed by hand rather than scattered: ridges across the top,
a lake at the horizon, a river opening the centre, forest clumps framing the
sides, and the field props (tent, canoe, recorder, deer) in the clearing.
"""
import random

random.seed(11)

W, H = 1600, 620
STROKE, SW = "#06180f", 3.0

CREAM, SKY, CORAL, GOLD = "#f6efe4", "#8fd3e8", "#ef7a56", "#f2c94c"
WATER, WATER_D = "#4a9fd0", "#3a86b5"
RIDGE_F, RIDGE_M = "#2f7f6b", "#1d6350"
TREE_B, TREE_M, TREE_F = "#0f4b2c", "#18703c", "#0c4028"
NEON, BARK, LEAF = "#35e05f", "#a4552f", "#2f9e4f"

out = []
el = out.append

def path(d, fill="none", stroke=STROKE, sw=SW):
    return (f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" '
            f'stroke-linejoin="round" stroke-linecap="round"/>')

def circle(cx, cy, r, fill, stroke=STROKE, sw=SW):
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

# ── trees ────────────────────────────────────────────
def conifer(x, base, h, fill, snow=False, accent=None):
    w = h * 0.54
    g, tw = [], max(3.0, w * 0.14)
    g.append(path(f"M{x-tw/2:.1f} {base:.1f} h{tw:.1f} v{-h*0.18:.1f} h{-tw:.1f} Z", BARK, sw=2.4))
    for i in range(3):
        f = i / 3
        ty = base - h * 0.18 - (h * 0.82) * f
        tw_i = w * (1 - f * 0.40)
        apex = ty - h * 0.46 if i < 2 else base - h
        g.append(path(
            f"M{x:.1f} {apex:.1f} L{x+tw_i/2:.1f} {ty:.1f} L{x+tw_i*0.20:.1f} {ty:.1f} "
            f"L{x+tw_i*0.28:.1f} {ty+h*0.045:.1f} L{x-tw_i*0.28:.1f} {ty+h*0.045:.1f} "
            f"L{x-tw_i*0.20:.1f} {ty:.1f} L{x-tw_i/2:.1f} {ty:.1f} Z", fill))
        if snow and i == 2:
            g.append(path(f"M{x:.1f} {apex:.1f} L{x+tw_i*0.19:.1f} {apex+h*0.19:.1f} "
                          f"L{x:.1f} {apex+h*0.13:.1f} L{x-tw_i*0.19:.1f} {apex+h*0.19:.1f} Z",
                          CREAM, sw=2.2))
    if accent:
        g.append(path(f"M{x-w*0.17:.1f} {base-h*0.40:.1f} l{w*0.21:.1f} {-h*0.10:.1f}", "none", accent, 2.8))
    return "".join(g)

def broadleaf(x, base, h, fill, accent=None):
    """Rounded canopy tree — breaks up the conifer rhythm."""
    r = h * 0.34
    g = [path(f"M{x-h*0.045:.1f} {base:.1f} v{-h*0.46:.1f} h{h*0.09:.1f} v{h*0.46:.1f} Z", BARK, sw=2.4),
         path(f"M{x-h*0.03:.1f} {base-h*0.34:.1f} l{-h*0.16:.1f} {-h*0.12:.1f} "
              f"m{h*0.06:.1f} {h*0.06:.1f} l{h*0.18:.1f} {-h*0.14:.1f}", "none", BARK, 2.4)]
    for dx, dy, k in ((0, -h * 0.72, 1.0), (-r * 0.78, -h * 0.55, 0.72), (r * 0.78, -h * 0.55, 0.72)):
        g.append(circle(x + dx, base + dy, r * k, fill))
    if accent:
        g.append(circle(x + r * 0.4, base - h * 0.78, 4.5, accent, sw=2))
    return "".join(g)

def clump(spans, base, hmin, hmax, fill, count, snow=False, accent=None, broad_every=0):
    """Trees placed only inside the given x spans, short ones drawn first."""
    picks = []
    for _ in range(count):
        lo, hi = random.choice(spans)
        picks.append((random.uniform(lo, hi), random.uniform(hmin, hmax)))
    picks.sort(key=lambda p: p[1])
    parts = []
    for i, (x, h) in enumerate(picks):
        b = base + random.uniform(-5, 7)
        if broad_every and i % broad_every == broad_every - 1:
            parts.append(broadleaf(x, b, h * 0.92, LEAF, accent=CORAL if random.random() < 0.4 else None))
        else:
            parts.append(conifer(x, b, h, fill,
                                 snow=snow and random.random() < 0.35,
                                 accent=accent if random.random() < 0.3 else None))
    return "".join(parts)

# ── ridges ───────────────────────────────────────────
def ridge(base, peaks, fill, snow=True):
    pts, caps = [f"M-40 {base:.1f}"], []
    for px, ph, pw in peaks:
        pts.append(f"L{px-pw:.1f} {base:.1f} L{px:.1f} {base-ph:.1f} L{px+pw:.1f} {base:.1f}")
        if snow:
            k = 0.32
            caps.append(path(
                f"M{px:.1f} {base-ph:.1f} L{px+pw*k:.1f} {base-ph*(1-k):.1f} "
                f"L{px+pw*k*0.45:.1f} {base-ph*(1-k*0.7):.1f} L{px:.1f} {base-ph*(1-k*0.48):.1f} "
                f"L{px-pw*k*0.45:.1f} {base-ph*(1-k*0.7):.1f} L{px-pw*k:.1f} {base-ph*(1-k):.1f} Z",
                CREAM, sw=2.4))
    pts.append(f"L{W+40} {base:.1f} Z")
    return path(" ".join(pts), fill) + "".join(caps)

# ── props ────────────────────────────────────────────
def cloud(x, y, s, fill=SKY):
    return (path(f"M{x:.1f} {y:.1f} h{60*s:.1f} a{13*s:.1f} {13*s:.1f} 0 0 1 0 {26*s:.1f} "
                 f"h{-60*s:.1f} a{13*s:.1f} {13*s:.1f} 0 0 1 0 {-26*s:.1f} Z", fill)
            + path(f"M{x+22*s:.1f} {y-20*s:.1f} h{40*s:.1f} a{10*s:.1f} {10*s:.1f} 0 0 1 0 {20*s:.1f} "
                   f"h{-40*s:.1f} a{10*s:.1f} {10*s:.1f} 0 0 1 0 {-20*s:.1f} Z", fill))

def birds(x, y, s):
    return "".join(path(f"M{x+dx-14*s*k:.1f} {y+dy:.1f} q{14*s*k:.1f} {-11*s*k:.1f} {14*s*k:.1f} 0 "
                        f"q0 {-11*s*k:.1f} {14*s*k:.1f} 0", "none", STROKE, 2.6)
                   for dx, dy, k in ((0, 0, 1), (36, 18, 0.8), (66, -10, 0.66)))

def log_pile(x, y, s):
    g = []
    rows = ((-2, -1, 0, 1, 2), (-1.5, -0.5, 0.5, 1.5), (-1, 0, 1))
    for r, cols in enumerate(rows):
        for c in cols:
            cx, cy = x + c * 27 * s, y - (13 + r * 25) * s
            g.append(circle(cx, cy, 13 * s, BARK))
            g.append(circle(cx, cy, 5.5 * s, CORAL, sw=2))
    return "".join(g)

def tent(x, y, s):
    return (path(f"M{x:.1f} {y-58*s:.1f} L{x+48*s:.1f} {y:.1f} L{x-48*s:.1f} {y:.1f} Z", CORAL)
            + path(f"M{x:.1f} {y-58*s:.1f} L{x+15*s:.1f} {y:.1f} L{x-15*s:.1f} {y:.1f} Z", "#d9542f", sw=2.4)
            + path(f"M{x-58*s:.1f} {y:.1f} h{116*s:.1f}", "none", STROKE, SW)
            + path(f"M{x+74*s:.1f} {y:.1f} l{-9*s:.1f} {-20*s:.1f} m{18*s:.1f} 0 l{-9*s:.1f} {20*s:.1f}",
                   "none", BARK, 3)
            + path(f"M{x+74*s:.1f} {y-22*s:.1f} q{-9*s:.1f} {-16*s:.1f} {2*s:.1f} {-24*s:.1f} "
                   f"q{12*s:.1f} {10*s:.1f} {2*s:.1f} {24*s:.1f} Z", GOLD, sw=2.4))

def canoe(x, y, s):
    return (path(f"M{x-62*s:.1f} {y:.1f} q{62*s:.1f} {36*s:.1f} {124*s:.1f} 0 "
                 f"q{-62*s:.1f} {13*s:.1f} {-124*s:.1f} 0 Z", CORAL)
            + path(f"M{x-58*s:.1f} {y+3*s:.1f} q{58*s:.1f} {26*s:.1f} {116*s:.1f} 0", "none", "#d9542f", 2.4)
            + path(f"M{x-6*s:.1f} {y-34*s:.1f} l{20*s:.1f} {40*s:.1f}", "none", STROKE, 3)
            + circle(x - 12 * s, y - 44 * s, 9 * s, CREAM, sw=2.4))

def deer(x, y, s):
    """Standing deer: legs, body above them, neck, head, antlers."""
    COAT, DARK = "#c8874a", "#8f5526"
    g = []
    for dx in (-20, -9, 9, 20):
        g.append(path(f"M{x+dx*s:.1f} {y:.1f} v{-32*s:.1f}", "none", DARK, 5.5 * s))
    g.append(path(f"M{x-26*s:.1f} {y-56*s:.1f} h{48*s:.1f} a{13*s:.1f} {13*s:.1f} 0 0 1 0 {26*s:.1f} "
                  f"h{-48*s:.1f} a{13*s:.1f} {13*s:.1f} 0 0 1 0 {-26*s:.1f} Z", COAT))
    g.append(path(f"M{x-30*s:.1f} {y-52*s:.1f} l{-10*s:.1f} {-9*s:.1f} l{2*s:.1f} {13*s:.1f} Z", COAT, sw=2.4))
    g.append(path(f"M{x+14*s:.1f} {y-56*s:.1f} l{14*s:.1f} {-26*s:.1f} l{13*s:.1f} {6*s:.1f} "
                  f"l{-13*s:.1f} {26*s:.1f} Z", COAT, sw=2.6))
    g.append(path(f"M{x+27*s:.1f} {y-84*s:.1f} q{14*s:.1f} {-4*s:.1f} {19*s:.1f} {6*s:.1f} "
                  f"q{2*s:.1f} {8*s:.1f} {-9*s:.1f} {10*s:.1f} l{-14*s:.1f} {1*s:.1f} Z", COAT, sw=2.6))
    g.append(path(f"M{x+29*s:.1f} {y-86*s:.1f} l{-4*s:.1f} {-10*s:.1f} l{11*s:.1f} {5*s:.1f} Z", COAT, sw=2.2))
    g.append(path(f"M{x+34*s:.1f} {y-90*s:.1f} l{3*s:.1f} {-17*s:.1f} m{-3*s:.1f} {9*s:.1f} l{-10*s:.1f} {-7*s:.1f} "
                  f"m{13*s:.1f} {-2*s:.1f} l{11*s:.1f} {-8*s:.1f}", "none", DARK, 2.8))
    g.append(circle(x + 42 * s, y - 78 * s, 2.0 * s, STROKE, STROKE, 0))
    return "".join(g)


def recorder_post(x, y, s):
    """Passive acoustic recorder on a post — vanyax's own instrument."""
    return (path(f"M{x-4*s:.1f} {y:.1f} v{-72*s:.1f} h{8*s:.1f} v{72*s:.1f} Z", BARK, sw=2.6)
            + path(f"M{x-16*s:.1f} {y-80*s:.1f} h{32*s:.1f} v{25*s:.1f} h{-32*s:.1f} Z", CREAM)
            + circle(x, y - 67 * s, 5.5 * s, NEON, sw=2.2)
            + path(f"M{x+24*s:.1f} {y-88*s:.1f} q{11*s:.1f} {21*s:.1f} 0 {42*s:.1f}", "none", NEON, 2.8)
            + path(f"M{x+36*s:.1f} {y-98*s:.1f} q{18*s:.1f} {31*s:.1f} 0 {62*s:.1f}", "none", NEON, 2.2))

def camera_trap(x, y, s):
    """Strap-mounted camera trap on a trunk."""
    return (path(f"M{x-9*s:.1f} {y:.1f} v{-96*s:.1f} h{18*s:.1f} v{96*s:.1f} Z", BARK, sw=2.6)
            + path(f"M{x+7*s:.1f} {y-74*s:.1f} h{26*s:.1f} v{20*s:.1f} h{-26*s:.1f} Z", CREAM, sw=2.4)
            + circle(x + 27 * s, y - 64 * s, 5 * s, STROKE, CREAM, 2))

def fern(x, y, s):
    return "".join(path(d, "none", NEON, 3) for d in (
        f"M{x:.1f} {y:.1f} q{-4*s:.1f} {-27*s:.1f} {-23*s:.1f} {-39*s:.1f}",
        f"M{x:.1f} {y:.1f} q{2*s:.1f} {-31*s:.1f} {-2*s:.1f} {-46*s:.1f}",
        f"M{x:.1f} {y:.1f} q{6*s:.1f} {-27*s:.1f} {23*s:.1f} {-37*s:.1f}"))

def mushroom(x, y, s):
    return (path(f"M{x-4*s:.1f} {y:.1f} v{-14*s:.1f} h{8*s:.1f} v{14*s:.1f} Z", CREAM, sw=2)
            + path(f"M{x-14*s:.1f} {y-13*s:.1f} a{14*s:.1f} {12*s:.1f} 0 0 1 {28*s:.1f} 0 Z", CORAL, sw=2))

def reeds(x, y, s):
    return "".join(path(f"M{x+i*9*s:.1f} {y:.1f} q{(2 if i%2 else -2)*s:.1f} {-16*s:.1f} {(4 if i%2 else -4)*s:.1f} {-26*s:.1f}",
                        "none", TREE_M, 3) for i in range(4))

# ══ assemble ═════════════════════════════════════════
HORIZON, SHORE = 300, 372
TOP = 128   # the panorama is shown as a wide band; crop the empty sky above this
el(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {TOP} {W} {H-TOP}" '
   f'preserveAspectRatio="xMidYMax slice" class="scene" role="img" '
   f'aria-label="A forest valley: snow-capped ridges, a lake feeding a river, '
   f'conifers, a camp, a canoe, a deer and an acoustic recorder on a post">')

el('<g data-scene-layer="sky" data-depth="0.08">')
el(circle(1196, 214, 52, GOLD))
el(cloud(140, 176, 1.2))
el(cloud(176, 202, 0.85, CORAL))
el(cloud(1286, 164, 1.0))
el(cloud(556, 158, 0.8, CORAL))
el(cloud(900, 186, 0.9))
el(birds(690, 196, 1.05))
el('</g>')

el('<g data-scene-layer="ridge-far" data-depth="0.18">')
el(ridge(HORIZON, [(120, 116, 156), (420, 156, 196), (742, 120, 164),
                   (1052, 162, 206), (1372, 126, 174), (1596, 104, 152)], RIDGE_F))
el('</g>')

el('<g data-scene-layer="ridge-mid" data-depth="0.28">')
el(ridge(HORIZON + 18, [(40, 84, 128), (286, 106, 150), (596, 80, 138),
                        (886, 112, 162), (1204, 88, 148), (1498, 106, 158)], RIDGE_M))
el('</g>')

# far shoreline trees, kept off the water's mouth
el('<g data-scene-layer="forest-far" data-depth="0.36">')
el(clump([(-30, 640), (960, 1630)], HORIZON + 8, 40, 74, TREE_B, 30, snow=True))
el('</g>')

# the valley floor — gives the scene a ground plane instead of raw backdrop
el('<g data-scene-layer="ground" data-depth="0.46">')
el(path(f"M-40 {SHORE} h{W+80} v{H-SHORE+40} h{-(W+80)} Z", "#0b2f1d", sw=0))
el(path(f"M-40 {SHORE} h{W+80}", "none", STROKE, SW))
for rx, ry, rs in ((236, 560, 1.0), (1330, 540, 0.8), (742, 402, 0.7)):
    el(path(f"M{rx-17*rs:.1f} {ry:.1f} q{4*rs:.1f} {-19*rs:.1f} {17*rs:.1f} {-19*rs:.1f} "
            f"q{14*rs:.1f} 0 {17*rs:.1f} {19*rs:.1f} Z", "#123f27"))
el('</g>')

el('<g data-scene-layer="water" data-depth="0.42">')
el(path(f"M-40 {HORIZON+14} h{W+80} v{SHORE-HORIZON} h{-(W+80)} Z", WATER, sw=0))
el(path(f"M-40 {HORIZON+14} h{W+80}", "none", STROKE, SW))
# river: lake mouth widening to the foreground
# river: one channel, banks stroked exactly along the polygon edges
LB = f"M706 {SHORE-6} q36 76 -8 136 q-50 70 -84 152"     # left bank, ends near (614, 620)
RB = f"M962 {SHORE-6} q-30 62 10 130 q34 66 76 158"      # right bank, ends near (1048, 620)
el(path(f"{LB} L1048 {H} L962 {SHORE-6} Z", WATER, sw=0))
el(path(f"{RB} L1048 {H} L614 {H} Z", WATER, sw=0))
el(path(LB, "none", STROKE, SW))
el(path(RB, "none", STROKE, SW))
for rx, ry, rw in ((150, 330, 96), (318, 352, 68), (1090, 334, 112), (1330, 356, 78), (1470, 326, 62)):
    el(path(f"M{rx} {ry} h{rw}", "none", WATER_D, 4))
el(reeds(1002, SHORE + 6, 1.0))
el(reeds(634, SHORE + 8, 1.0))
el(canoe(838, 452, 0.92))
el('</g>')

# banks — the clearing where the field work happens
el('<g data-scene-layer="clearing" data-depth="0.55">')
el(clump([(60, 300), (1120, 1560)], 420, 84, 132, TREE_M, 15, accent=NEON, broad_every=5))
el(tent(398, 486, 1.06))
el(deer(1258, 486, 1.06))
el(camera_trap(556, 500, 0.95))
el('</g>')

el('<g data-scene-layer="forest-front" data-depth="0.82">')
el(clump([(-70, 286), (1268, 1670)], H, 196, 306, TREE_F, 9, accent=NEON))
el(log_pile(322, 606, 0.9))
el(recorder_post(1096, 612, 1.2))
el(fern(96, 610, 1.25))
el(fern(1544, 606, 1.15))
el(fern(486, 612, 1.0))
el(mushroom(1180, 606, 1.05))
el(mushroom(1212, 610, 0.78))
el(mushroom(600, 610, 0.95))
el('</g>')

el('</svg>')

svg = "".join(out)
open("src/assets/forest.svg", "w").write(svg)
print(f"{len(svg)/1024:.1f} KB")
