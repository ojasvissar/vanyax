## What is on it

The home page says what the practice does and asks for one thing.

| Section | What it does |
| --- | --- |
| Hero | *Turning field data into answers*, who it is for, two ways in |
| The approach | Why the practice exists, beside a printed vignette |
| What we do | Five services, each with a small printed scene — bioacoustics, camera traps, surveys and counts, satellite and drone, eDNA (in development) |
| Questions | Who we work with, what data we take, how a project runs, what happens to your data |
| The ask | *Ready to put your data to work?* — one form, one address |

`explore/` is the second page: the species explorer, a working tool.

Nothing on the site claims work that hasn't happened. Keep it that way.

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
- **Charts** — hand-rolled SVG with a table view behind every chart and a hover
  layer on every mark. The six categorical colours are named in the stylesheet
  (`--series-1` … `--series-6`) and read by the script, so the charts follow the
  design rather than carrying a palette of their own.
- **Map colour** — the density tiles use GBIF's `green` ramp, and the legend
  under the map is sampled from a real tile, so it is the ramp the map draws.

Adding a preset species: find its key with
`api.gbif.org/v1/species/match?name=Genus+species` and add it to `PRESETS` in
[src/scripts/explore.js](src/scripts/explore.js).

**Play the archive** (explorer). The year facet is already loaded, so the map
can walk forward through time and report a real cumulative count at every step
without one extra request — only the raster is refetched, and each frame is
preloaded before it is shown so the map never blinks. Watching a species fill
in from 1878 onward is mostly a history of who was looking, which is the point
the caveats underneath make in words.

## Design: field print

Modelled on illustrated agricultural-research sites: a landscape printed in a
few flat inks, a soft serif for anything read at a distance, deep forest-green
bands on cream paper, lime for the one thing to press, small rust labels over
each section, and grass where one band meets the next. It should read as a
field station — calm, practical, outdoors.

| Token | Value | Used for |
| --- | --- | --- |
| `--cream` | `#f3eee2` | the page |
| `--forest` | `#1f3b27` | header, bands, headings |
| `--lime` | `#c8d46a` | buttons, the header strip |
| `--sky` | `#b6d8de` | the hero and explorer sky |
| `--rust-ink` | `#963f1d` | section labels (the brighter `--rust` is for artwork only) |

Type is **Fraunces** with its soft axis turned up for headings and **Work Sans**
for text and labels.

### The illustrations

[tools/gen_illustration.py](tools/gen_illustration.py) draws everything in
[src/assets/illo/](src/assets/illo/): the hero in parallax layers (clouds, far
hills, near hills with trees, a meadow with a recording post and a
camera-trapped tree), the grass edges between bands, two circular vignettes,
the five service scenes and the emblem. Hills are hatched along their own
contours like a linocut; grass is drawn blade by blade. Seeded, so a rerun
gives the same pictures:

```bash
python3 tools/gen_illustration.py
```

### Accordion

[src/scripts/accordion.js](src/scripts/accordion.js). Rows ship open and are
closed by the script, so without JS every answer is visible. One open at a time;
arrow keys, Home and End move between rows.

## Motion

Lenis for the scroll, GSAP for everything hung off it, kept slow:

- The hero's layers come up from the back one at a time, the clouds last.
- Scrolling, the clouds and far hills lag behind the page, so distance reads
  as it does from a moving window. Clouds drift; birds cross about once a minute.
- Vignettes and service scenes rise into place in order; headings reveal word
  by word; the header hides going down and returns going up, and marks the
  section you are in.

`prefers-reduced-motion` stills all of it and shows everything finished —
verified under emulation.

## Accessibility

Every line of text on both pages clears WCAG AA, checked by script. The focus
ring is rust. The service and question lists are buttons inside headings with
`aria-expanded` and labelled regions.

## Stack

- [Vite](https://vitejs.dev/) — two-page build, rooted at `src/`
- [GSAP](https://gsap.com/) + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering/)
- d3-geo, topojson-client and world-atlas — the explorer's map
- Fraunces and Work Sans via Google Fonts

## Layout

```
src/
  index.html  explore/
  scripts/    main.js, motion.js, paper.js, accordion.js, explore.js
  styles/     style.css, explore.css
  assets/     photos/, land/ (generated)
tools/        gen_landscape.py
```

