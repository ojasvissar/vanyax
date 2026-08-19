# vanyax

*van* — the forest. *yax* — the spirits that keep it.

Site for **vanyax**, a data science and machine learning practice for
biodiversity and ecosystems. Two pages, statically built, no tracking.

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

## What is on it

The home page says what the practice does and asks for one thing — and nothing
else, because everything else was in the way.

| Section | What it does |
| --- | --- |
| Hero | One line: *We turn field data into answers.* Who it is for, two ways in |
| Statement | Two sentences: what we do, and what you keep |
| What we do | Five services as a row each — bioacoustics, camera traps, surveys and counts, satellite and drone, eDNA (in development) |
| Questions | Who we work with, what data we take, how a project runs, what happens to your data |
| The ask | *Ready to put your data to work?* — one form, one address |

`explore/` is the second page: the species explorer, a working tool.

The old collaborate, about, open-source and projects pages were folded into
those sections and removed; their content is in the git history.

Nothing on the site claims work that hasn't happened. The four answers are
condensed from what the old pages already committed to, and eDNA is marked as in
development because it was planned, not built. Keep it that way.

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
- **Map colour** — the density tiles use GBIF's `purpleYellow` ramp, which runs
  from deep purple through coral to pale yellow — the collage palette — and the
  legend under the map is sampled from the tiles themselves.

Adding a preset species: find its key with
`api.gbif.org/v1/species/match?name=Genus+species` and add it to `PRESETS` in
[src/scripts/explore.js](src/scripts/explore.js).

**Play the archive** (explorer). The year facet is already loaded, so the map
can walk forward through time and report a real cumulative count at every step
without one extra request — only the raster is refetched, and each frame is
preloaded before it is shown so the map never blinks. Watching a species fill
in from 1878 onward is mostly a history of who was looking, which is the point
the caveats underneath make in words.

## Design: cut paper

The inspiration was a studio site built as a collage: black and oat bands torn
across and laid edge to edge, pieces cut from loud patterned papers, scraps of
black-and-white photograph, and services as rows of flat colour.

Two rules keep it from becoming noise:

- **Colour lives only in the pieces and the service rows.** Type and ground stay
  ink and paper, so the loudness belongs to the page, never to a sentence.
- **One thing per section.** The copy says what we do, once.

| Token | Value | Used for |
| --- | --- | --- |
| `--paper` | `#ece5d3` | the oat ground |
| `--ink` | `#151515` | type, black sheets |
| `--violet` | `#6a22e6` | the services spine, the ask, the page veil |
| `--lilac` `--pink` `--orange` `--yellow` `--green` | | the five cut-paper colours |

Type is **Bricolage Grotesque** for anything read at a distance — the
irregularity of a cut-out is in its letters — and **Figtree** for reading size.

The pieces of the system, in [src/scripts/paper.js](src/scripts/paper.js) unless
noted:

- **Torn edges** — `tears()` draws each `[data-tear]` at its real width as two
  ragged lines, the band's colour and the paper's white core behind it, from a
  seeded generator, so a tear never stretches and never changes between loads.
- **Patterned papers** — six pattern fills (stripes, zigzag, waves, dots) defined
  once in an inline `<svg class="defs">` and used by `url(#id)`.
- **Cut-outs** — a `.piece` is placed by four custom properties set inline
  (`--x`, `--y`, `--w`, `--r`), so a collage is composed in the markup. Photo
  scraps (`.cutout`) get a torn clip-path from `cutouts()` and a white paper rim.
  Their frames keep a 5:4 ratio, because pieces are sized by width and placed by
  height and would otherwise hang out on narrow screens.
- **Accordion** — [src/scripts/accordion.js](src/scripts/accordion.js). Rows
  ship open and are closed by the script, so without JS every answer is visible.
  One open at a time; arrow keys, Home and End move between rows.

## Motion

Lenis for the scroll, GSAP for everything hung off it.

- The hero's collage **assembles itself** on load — each piece thrown onto the
  table, turning as it lands.
- Pieces **bob and sway** on the `translate` and `rotate` properties, not
  `transform`, so the idle motion composes with the scroll parallax instead of
  overwriting it.
- Every piece has a **depth** and drifts at its own rate as you scroll.
- Patterned strips **pop up** from behind their torn edge; marker highlights
  **fill in**; squiggles **draw themselves**; service rows **slide in** from the
  spine and the plus **spins** into a cross.
- A yellow **ticker** of the five services is laid across the seam under the
  hero; the footer's **stamp** turns; the wordmark's letters **drop in** like
  cut-outs and lift on hover.
- The header becomes a **scalloped black strip** past the hero and marks the
  section you are in; the cursor names what it is over; a violet **veil** covers
  the page on the way out.

`prefers-reduced-motion` stills all of it and shows everything in its finished
state — verified under emulation, including that the idle animations stop rather
than loop at a 0.01ms period (which jitters).

## Accessibility

Every line of text on both pages clears WCAG AA, checked by script. The focus
ring is violet on paper and yellow on the black and violet sheets, where violet
cannot be seen. The service and question lists are buttons inside headings with
`aria-expanded` and labelled regions.

## Photographs

Three, from [Unsplash](https://unsplash.com), whose licence allows commercial
use without permission or attribution. They appear as torn black-and-white
scraps; files are in [src/assets/photos/](src/assets/photos/).

| File | Unsplash photo ID |
| --- | --- |
| `card-aerial.jpg` | `1476231682828-37e571bc172f` |
| `conifers-fog.jpg` | `1418065460487-3e41a6c84dc5` |
| `valley-mist.jpg` | `1542273917363-3b1817f69a2d` |

Don't swap these for images off Pinterest or an image search — those are almost
always someone else's copyrighted work, and a public site is exactly where that
gets noticed. Unsplash, Pexels and Wikimedia Commons are all safe sources.

## Stack

- [Vite](https://vitejs.dev/) — two-page build, rooted at `src/`
- [GSAP](https://gsap.com/) + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering/)
- d3-geo, topojson-client and world-atlas — the explorer's map
- Bricolage Grotesque and Figtree via Google Fonts

## Layout

```
src/
  index.html  explore/
  scripts/    main.js, motion.js, paper.js, accordion.js, explore.js
  styles/     style.css, explore.css
  assets/     photos/
```

`src/` is the Vite root, so a page's path inside it is its URL: the file
`src/explore/index.html` is served at `/explore/`.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000/vanyax/
npm run build    # → dist/
npm run preview
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Before this goes public

- Replace `hello@vanyax.org` (the ask and the footer) with a real address.
- Wire the email form: set `GOOGLE_FORM.formId` and `GOOGLE_FORM.emailEntry` in
  [src/scripts/main.js](src/scripts/main.js). Until then it confirms locally
  without sending.
