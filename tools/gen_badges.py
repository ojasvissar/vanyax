"""Circular emblems — one sprite of <symbol>s, used with <use href="#badge-x">."""

STROKE = "#06180f"
CREAM, NEON, CORAL, GOLD, SKY = "#f6efe4", "#35e05f", "#ef7a56", "#f2c94c", "#8fd3e8"
DEEP, MID, WATER, BARK = "#0d2b1c", "#18703c", "#4a9fd0", "#a4552f"

def ring(fill, text, scene, ring_fill):
    """A badge: coloured ring carrying curved text, a scene in the middle."""
    return f'''
  <circle cx="100" cy="100" r="94" fill="{ring_fill}" stroke="{STROKE}" stroke-width="4"/>
  <circle cx="100" cy="100" r="70" fill="{fill}" stroke="{STROKE}" stroke-width="4"/>
  <text class="badge__text" fill="{STROKE}">
    <textPath href="#badgeArc" startOffset="50%" text-anchor="middle">{text}</textPath>
  </text>
  <g clip-path="url(#badgeClip)">{scene}</g>
  <circle cx="100" cy="100" r="70" fill="none" stroke="{STROKE}" stroke-width="4"/>'''

# ── scenes (drawn inside r=70, centred on 100,100) ────
peaks = ('<path d="M30 138 L64 86 L92 138 Z" fill="#2f7f6b" stroke="'+STROKE+'" stroke-width="3.5" stroke-linejoin="round"/>'
         '<path d="M64 86 L74 102 L64 98 L54 102 Z" fill="'+CREAM+'" stroke="'+STROKE+'" stroke-width="2.5"/>'
         '<path d="M78 138 L112 78 L146 138 Z" fill="#1d6350" stroke="'+STROKE+'" stroke-width="3.5" stroke-linejoin="round"/>'
         '<path d="M112 78 L124 98 L112 93 L100 98 Z" fill="'+CREAM+'" stroke="'+STROKE+'" stroke-width="2.5"/>'
         f'<circle cx="132" cy="72" r="15" fill="{GOLD}" stroke="{STROKE}" stroke-width="3.5"/>'
         f'<path d="M30 138 h140" stroke="{STROKE}" stroke-width="3.5"/>')

stump = (f'<path d="M74 150 h52 v-40 h-52 Z" fill="{BARK}" stroke="{STROKE}" stroke-width="3.5"/>'
         f'<ellipse cx="100" cy="110" rx="26" ry="10" fill="#c1703f" stroke="{STROKE}" stroke-width="3.5"/>'
         f'<ellipse cx="100" cy="110" rx="12" ry="4.5" fill="none" stroke="{STROKE}" stroke-width="2.5"/>'
         f'<path d="M100 106 q-4 -26 -24 -34 q10 24 20 34" fill="{NEON}" stroke="{STROKE}" stroke-width="3"/>'
         f'<path d="M104 104 q6 -22 26 -26 q-12 20 -22 28" fill="{NEON}" stroke="{STROKE}" stroke-width="3"/>')

waves = (f'<path d="M62 148 v-34 h14 v34 Z" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>'
         f'<circle cx="69" cy="106" r="7" fill="{NEON}" stroke="{STROKE}" stroke-width="3"/>'
         f'<path d="M92 78 q22 32 0 64" fill="none" stroke="{NEON}" stroke-width="4" stroke-linecap="round"/>'
         f'<path d="M110 66 q32 44 0 88" fill="none" stroke="{NEON}" stroke-width="3.5" stroke-linecap="round"/>'
         f'<path d="M128 56 q42 54 0 108" fill="none" stroke="{CREAM}" stroke-width="3" stroke-linecap="round"/>')

leafnet = (f'<circle cx="72" cy="82" r="11" fill="{NEON}" stroke="{STROKE}" stroke-width="3.5"/>'
           f'<circle cx="132" cy="72" r="9" fill="{CORAL}" stroke="{STROKE}" stroke-width="3.5"/>'
           f'<circle cx="142" cy="126" r="11" fill="{SKY}" stroke="{STROKE}" stroke-width="3.5"/>'
           f'<circle cx="86" cy="140" r="9" fill="{GOLD}" stroke="{STROKE}" stroke-width="3.5"/>'
           f'<circle cx="104" cy="104" r="14" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>'
           f'<path d="M83 88 L94 98 M124 79 L116 94 M132 120 L117 111 M93 133 L99 117" stroke="{STROKE}" stroke-width="3"/>')

paw = (f'<circle cx="100" cy="126" r="24" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>'
       f'<circle cx="70" cy="98" r="10" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>'
       f'<circle cx="90" cy="80" r="10" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>'
       f'<circle cx="112" cy="80" r="10" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>'
       f'<circle cx="132" cy="98" r="10" fill="{CREAM}" stroke="{STROKE}" stroke-width="3.5"/>')

badges = [
    ("field-first",  "FIELD FIRST · FIELD FIRST ·",           peaks,   DEEP,  NEON),
    ("count",        "COUNT WHAT MATTERS ·",                  leafnet, DEEP,  GOLD),
    ("listen",       "MODELS THAT LISTEN ·",                  waves,   MID,   SKY),
    ("regrow",       "LEAVE IT GROWING ·",                    stump,   CREAM, NEON),
    ("open",         "OPEN BY DEFAULT ·",                     paw,     MID,   CORAL),
]

sym = "\n".join(
    f'<symbol id="badge-{name}" viewBox="0 0 200 200">{ring(fill, text, scene, rf)}\n  </symbol>'
    for name, text, scene, fill, rf in badges)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
<defs>
  <path id="badgeArc" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"/>
  <clipPath id="badgeClip"><circle cx="100" cy="100" r="70"/></clipPath>
</defs>
{sym}
</svg>'''
open("src/assets/badges.svg", "w").write(svg)
print(f"{len(svg)/1024:.1f} KB, {len(badges)} badges")
