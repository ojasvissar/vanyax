# vanyax

*van* — the forest. *yax* — the guardian spirits of it.

Site for **vanyax**, a data science and machine learning practice for
biodiversity and ecosystems. Five pages, statically built, no tracking.

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

## Pages

| Page | What it says |
| --- | --- |
| `index.html` | What vanyax does: analysis for people with data, models for people with a question, open publication, own projects |
| `collaborate/` | What to send, what happens, and how data is handled |
| `open-source/` | What will be published and on what terms — honest that nothing is out yet |
| `projects/` | Own work with real statuses (building / exploring / planned) and what each one needs |
| `about/` | The name, why the practice exists, how it works, who runs it |
| `explore/` | **The species explorer** — a working tool, not a description of one |

Nothing on the site claims work that hasn't happened. Keep it that way: add
case studies and numbers when they exist, not before.

## The explorer

`explore/` is the part of this site that does the thing the rest of it talks
about. Type any species and it queries [GBIF](https://www.gbif.org) live and
renders what the world's occurrence data actually says: a hex-binned density map
of every georeferenced record, records per year, month-of-year, publishing
countries, and how each record was made. Drag across the years and every panel —
including the map raster — refetches for that range.

No backend, no API keys, nothing precomputed. It is a static page that talks to
public APIs from the browser, so it deploys to GitHub Pages unchanged.

- **Sources** — `api.gbif.org/v1` for facets, taxonomy and IUCN Red List
  category; `api.gbif.org/v2` for the EPSG:4326 density raster;
  `api.inaturalist.org/v1` for one curated common name (GBIF returns every name
  every source ever used — its first English entry for the monarch is
  "Milkweed").
- **Projection** — equirectangular, cropped to 84°N–58°S. Chosen so GBIF's plate
  carrée raster lands on the coastlines pixel for pixel with no resampling.
- **"What this data cannot tell you"** — the four figures at the bottom are
  computed from the same response as the charts. Occurrence data maps observers,
  not organisms, and a tool that draws the map without saying so is misleading
  people. Every number on the page is live; none is written by hand.
- **Charts** — hand-rolled SVG. Single-hue for one series, a validated
  categorical palette for the six record types, a table view behind every chart,
  and a hover layer on every mark. The categorical hues pass lightness, chroma,
  colour-blind separation, normal-vision separation and contrast against this
  page's surface.

Adding a preset species: find its key with
`api.gbif.org/v1/species/match?name=Genus+species` and add it to `PRESETS` in
[src/explore.js](src/explore.js).

## Design notes

The visual language takes its cues from [Polpis Systems](http://polpissystems.com)
and [Solidroad](https://solidroad.com): a dark cinematic ground with one
luminous phenomenon in it, a hairline frame around the whole page, a large quiet
grotesque set against wide-tracked mono microcopy, and real product UI floating
over the hero rather than a drawing of one.

- **The mark** — the hero is a canvas: a planet whose centre sits below the fold,
  one lit band along its limb, faint bands above it, and a scatter of points.
  That band is the biosphere, which is both the subject and the thing this
  practice exists to measure. Polpis draws heat from the Earth's core the same
  way; ours is the thin layer on the outside. Gradients are baked once per
  resize into an offscreen canvas, so each frame only moves cheap things.
- **Colour** — a green-black ground, one acid (`#c9f24d`) reserved for anything
  you can click, and a bio-green ramp (`#0b3b33 → #9ff5c9`) for the living band
  and for data. One light surface, "bone", for the sections that need to breathe.
- **Type** — four voices, each with one job. The logotype is Instrument Serif,
  a different face from everything else on the page: the Wealthsimple trick of a
  refined serif wordmark over a clean sans interface, so the name reads as a
  mark rather than as a line of UI text. Geist for everything read, Geist Mono
  for everything the machine produced — labels, statuses, counts, the hero note.
  Solidroad uses Geist Mono for the same job.
- **The descent** — Polpis pins a section and drives you sideways while drilling
  into the earth. The same mechanic here goes the other way through what we
  actually measure: orbit → air → canopy → trail → floor → soil, one panel per
  layer, each naming the data that layer produces. The altitude readout and sky
  colour are driven by scroll position, and altitude is interpolated in log
  space — linear would sit at "700 km" for most of the section and then drop
  through everything at the end. Behind the panels a canvas draws the column
  being fallen through: the layers as one tall gradient translated by progress,
  a lit seam where each gives way to the next, and motes that stretch into
  streaks the faster you scroll. Panels lift and brighten as they reach the
  middle of the frame. Vertical motion under the horizontal motion, so it reads
  as a descent rather than a carousel. Without motion it degrades to a plain
  list.
- **Header** — Yummygum's arrangement: the mark sits bare on the page, the links
  are centred, and one filled pill carries the action. The links keep a capsule
  because the page underneath is dark and photographic and they need a surface
  to stay legible on, but its padding is equal on all four sides so the active
  pill nests concentrically inside the capsule's curve instead of fighting it.
  Below 1020px the nav returns to the flow and scrolls. The `van · yax`
  etymology appears only on About, the page that explains it.
- **Motion** — Lenis for scroll and GSAP for everything tied to it, the pairing
  Polpis uses. Headlines split into words and reveal from a mask; anything on
  the first screen animates on load, anything below waits for the scroll;
  buttons are magnetic; the marquee leans with scroll velocity; the header hides
  going down and returns coming up. Every animated element starts visible in the
  markup and is hidden by JS on the first frame, so a blocked script leaves a
  readable page. `prefers-reduced-motion` turns all of it off.
- **Graphics** — generated, and captioned as illustrative:
  [tools/gen_map.py](tools/gen_map.py) (survey map),
  [tools/gen_section.py](tools/gen_section.py) (forest cross-section, numbered
  where data is collected). Regenerate with `python3 tools/gen_*.py`.

## Photographs

From [Unsplash](https://unsplash.com), whose licence allows commercial use
without permission or attribution. Files live in
[src/assets/photos/](src/assets/photos/) and are named for what they show, so
swapping one is a file replacement. Source IDs, if you want the originals or
larger crops:

| File | Unsplash photo ID |
| --- | --- |
| `canopy-aerial.jpg`, `card-aerial.jpg` | `1476231682828-37e571bc172f` |
| `forest-mist.jpg`, `card-mist.jpg` | `1448375240586-882707db888b` |
| `ridges.jpg` | `1500534314209-a25ddb2bd429` |
| `conifers-fog.jpg` | `1418065460487-3e41a6c84dc5` |
| `valley-mist.jpg` | `1542273917363-3b1817f69a2d` |
| `forest-light.jpg`, `plate-light.jpg` | `1441974231531-c6227db76b6e` |

Don't swap these for images off Pinterest or an image search — those are almost
always someone else's copyrighted work, and a public site is exactly where that
gets noticed. Unsplash, Pexels and Wikimedia Commons are all safe sources.

## Stack

- [Vite](https://vitejs.dev/) — multi-page build (`vite.config.js` lists each entry)
- [GSAP](https://gsap.com/) + ScrollTrigger — reveals and the plot draw-in
- Newsreader / Inter / DM Mono via Google Fonts

## Develop

```bash
npm install
npm run dev      # http://localhost:3000/vanyax/
npm run build    # → dist/
npm run preview
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Before this goes public

- Replace `hello@vanyax.org` (footer and every contact section) with a real address.
- Fill in the GitHub and LinkedIn links in the footer.
- Replace the placeholder bio on `about/` (marked with a `TODO` comment).
- Wire the email form: set `GOOGLE_FORM.formId` and `GOOGLE_FORM.emailEntry` in
  [src/main.js](src/main.js). Until then it confirms locally without sending.
