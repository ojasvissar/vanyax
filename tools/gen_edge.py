"""Section dividers: a torn, ink-bled edge instead of a ruled line.

Straight rules make a page feel like a form. Every boundary in this subject —
coast, canopy, catchment — is ragged, so the bands are separated by a ragged
edge with a little splatter past it, the way a wash dries on paper.
"""
import math, random

def edge(seed, name, w=1440, h=120):
    random.seed(seed)
    ph = [random.uniform(0, 6.28) for _ in range(4)]
    pts = []
    n = 90
    for i in range(n + 1):
        x = w * i / n
        t = i / n * math.pi * 2
        y = (h * 0.55
             + 13 * math.sin(t*1.3 + ph[0])
             + 8 * math.sin(t*2.7 + ph[1])
             + 5 * math.sin(t*5.1 + ph[2])
             + 3 * math.sin(t*9.3 + ph[3])
             + random.uniform(-2.2, 2.2))
        pts.append((x, max(6, min(h - 8, y))))

    d = [f"M0 {h} L0 {pts[0][1]:.1f}"]
    for i in range(len(pts) - 1):
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        d.append(f"Q{x0:.1f} {y0:.1f} {(x0+x1)/2:.1f} {(y0+y1)/2:.1f}")
    d.append(f"L{w} {pts[-1][1]:.1f} L{w} {h} Z")

    # splatter: droplets that ran ahead of the edge
    blobs = []
    for _ in range(26):
        x = random.uniform(0, w)
        i = min(len(pts) - 1, int(x / w * n))
        y = pts[i][1] + random.uniform(6, 34)
        blobs.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{random.uniform(0.9, 3.4):.1f}"/>')

    svg = (f'<svg class="bleed__svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none" '
           f'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
           f'<path d="{" ".join(d)}"/>{"".join(blobs)}</svg>')
    open(f"src/assets/{name}.svg", "w").write(svg)
    print(name, len(svg), "bytes")

edge(4, "edge-a")
edge(19, "edge-b")
