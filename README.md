# vanyax

*van* — the forest. *yax* — the guardian spirits of it.

Site for **vanyax**, a data science and machine learning practice for
biodiversity and ecosystems. Five pages, statically built, no tracking.

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

## Pages

| Page | Source | What it says |
| --- | --- | --- |
| `/` | `src/index.html` | What vanyax does: analysis for people with data, models for people with a question, open publication, own projects |
| `/collaborate/` | `src/collaborate/index.html` | What to send, what happens, and how data is handled |
| `/open-source/` | `src/open-source/index.html` | What will be published and on what terms — honest that nothing is out yet |
| `/projects/` | `src/projects/index.html` | Own work with real statuses (building / exploring / planned) and what each one needs |
| `/about/` | `src/about/index.html` | The name, why the practice exists, how it works, who runs it |
| `/explore/` | `src/explore/index.html` | **The species explorer** — a working tool, not a description of one |

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
[src/scripts/explore.js](src/scripts/explore.js).

## Two interactive pieces

**Survey it yourself** (home page). The claim the whole site rests on — that
occurrence data maps observers, not organisms — is easy to assert and hard to
feel. So it is also something you do: a patch of forest with a generated
population hidden in it, which you have to walk. Species abundance follows a
decaying series, because real communities are a few common species and a long
tail of rare ones, and the tail is what surveys miss. Detection is a chance
rolled on every pass, not a certainty, which is the reason occupancy models
exist at all. A typical transect covers about a quarter of the ground, finds
five to seven of the fourteen species, and walks within a couple of metres of a
hundred individuals without seeing them. The population is generated with a
fixed seed and the page says so.

**Play the archive** (explorer). The year facet is already loaded, so the map
can walk forward through time and report a real cumulative count at every step
without one extra request — only the raster is refetched, and each frame is
preloaded before it is shown so the map never blinks. Watching a species fill
in from 1878 onward is mostly a history of who was looking, which is the point
the caveats underneath make in words.

## Design notes

Two references, one system. [Integrated Biosciences](https://integratedbio.com)
puts a single rounded media block inside a warm off-white page and reverses a
huge light grotesque out of it, with mono uppercase labels and a lime circle
carrying the arrow. Spora sets a cut-out photograph against a quiet ground with
white stat cards and a black pill. The rules that follow: the page is a sheet;
content sits in rounded blocks with generous radii; type is one geometric sans
set large and tracked tight; anything the machine produced is mono, uppercase
and small; and there is one accent, a lime, used only where you can click.

- **The hero is one block** — a rounded media panel inset from the trim on all
  four sides, the wordmark ghosted across it, the headline reversed out at the
  bottom left, and two stat cards at the bottom right. The page opens by
  unmasking that block from an inset while the photograph settles out of a slow
  push-in; nothing else moves until it lands. Leaving it, the picture drifts
  and grows while the block scales down and rounds off. `heroIn` and
  `heroScroll` in [src/scripts/motion.js](src/scripts/motion.js).
- **The globe is built out of points** — the world in its own section, and the
  points are the argument: every pale dot samples the coastline geometry, lit
  from the upper left, and every amber dot is a real occurrence record fetched
  from GBIF when the page loads, landing with a ring behind it. When they
  arrive the globe turns to face them, because a species recorded only in
  Europe would otherwise sit on the far side of a globe pointed at the Pacific.
  Drag it; the spin carries momentum.
  [src/scripts/globe.js](src/scripts/globe.js).
- **What it costs to draw** — three things keep it at sixty frames. Nothing
  goes through a projection at draw time: each point is stored once as a unit
  vector, rotated with two angles, and discarded before projection if it faces
  away. Brightness is quantised into seven steps, so several thousand dots are
  filled seven times a frame rather than several thousand. And "is this
  coordinate on land?" is a lookup in a bitmap of the world drawn once at
  startup, not a polygon test per point — that alone was seconds of blocked
  main thread.
- **When GBIF is slow or down** — the globe draws immediately from a set
  weighted the way collection effort actually is, captioned *illustrative
  distribution*, and swaps to the real records when they arrive, captioned with
  the species name and *live from GBIF*. The page never claims data it does not
  have. Requests go two pages at a time, staggered, with a generous deadline
  and one retry on a rate limit — GBIF answers a page in about four seconds and
  refuses a burst.
- **Colour** — sand (`#f0ece3`), a deep teal ink (`#0f2726`) rather than a
  black, ivory cards (`#fffcf6`), and one amber accent (`#f2ab63`) reserved for
  interactive things: the current nav item, the circular arrows, the send key,
  the live records on the globe. The reasoning is that every photograph on the
  site is green, so the page is warm rather than neutral and the accent is the
  complement of the pictures rather than another green competing with them; the
  teal ink gives the dark blocks and the pills depth that a flat black loses.
  Five palettes were rendered on the real page and compared before this one —
  a lime, a bone-and-ochre, a cool mint, this, and a stone-and-sky.
  Both muted inks are set at the alpha that clears 4.5:1 on the paper and on
  the cards, because the small mono labels are text too; hierarchy comes from
  size, case and tracking rather than from fading them out.
- **Type** — Onest carries everything read, a low-contrast geometric sans that
  holds up at 6rem with the tracking pulled to -0.035em. Roboto Mono carries
  everything measured: labels, counts, statuses, the coordinates under the
  globe — the same division the reference makes. Instrument Serif appears
  italic and once per page at most, wherever the writing turns personal: the
  species name in the explorer, the etymology in the footer.
- **The globe** — a real orthographic projection of real coastlines, the same
  land geometry the explorer draws its density map on, but drawn in the world's
  own colours rather than the page's: a lit ocean, land banded by latitude the
  way the biomes actually run — ice, taiga, the arid belts, the tropics — the
  sphere falling into shadow toward the limb, and a rim of atmosphere outside
  it. The equator tracks the current rotation, so the ice stays on the poles as
  you drag. Only the records take the page's accent, so the one thing that is
  data still reads as data. It turns on its own and you can drag it; both
  readouts are the projection's own state.
  [src/scripts/globe.js](src/scripts/globe.js).
- **A dark tone** — built and kept, but not the default:
  `:root[data-theme="dark"]` holds a deep-teal version of the same palette, and
  adding `data-theme="dark"` to `<html>` switches the site to it. Two pairs have
  to stay semantic for that to work, which rendering the naive inversion is what
  surfaced — the hero headline went dark on the photograph. `--on-dark` means
  "text on a dark surface", so it stays light in both themes; and anything that
  fills with `--ink` — the pills, the closing block — takes the page colour for
  its label rather than `--on-dark`. Anything drawn on a canvas now reads its
  colours out of the stylesheet through `cssVar`, so the charts, the survey and
  the explorer's map follow whichever theme is loaded.
- **Motion** — every picture wipes up into its own frame on approach
  (`mediaReveals`), headlines split to words and reveal from a mask, counters
  run on entry (the hero's carries a decimal, so 3.9bn counts as 3.9bn), the
  marquee leans with scroll velocity, and the descent pins and drives sideways.
  The mark reverses to white only while a dark media block is under the header
  and inks up the moment the page scrolls onto the paper.

- **The pull-back** — the pinned section is one continuous zoom out of the
  Amazon: from close enough to see individual crowns, through the forest and
  the river meandering across it, to the basin seen from orbit. It is three
  scenes, each painted once into an offscreen bitmap and composited with a
  scale and a fade — each starts larger than the frame, shrinks through it,
  and hands over to the next, which covers a span several times wider. Two
  details make it hold together: every scene is baked at twice the frame so it
  can shrink without its own edge sliding into view, and each has a focal
  point, because magnifying the planet about the middle of the canvas puts you
  over the Caribbean rather than the Amazon. The scenes are keyed to the
  altitude readout rather than to scroll position — the readout runs on a log
  scale between stops, so a linear hand-off had the whole planet on screen
  while the number still said five kilometres.
  [src/scripts/canopy.js](src/scripts/canopy.js).
- **What sits under it** — only three of the six layers can be seen from
  above, so the canopy, the drone and the satellite ride the zoom while the
  camera traps, the transects and the soil sit in cards underneath. With three
  panels the rail has little to travel, so the pin is given a floor of a couple
  of viewports and the rail simply crosses it more slowly.
- **Header** — the mark sits bare on the media block; the links and the one
  action share a single frosted capsule at the right, with the current page
  marked in lime. Below 900px the links scroll inside that capsule and the edge
  fades to say so. The `van · yax` etymology appears only on About, the page
  that explains it.
- **Motion** — Lenis for scroll and GSAP for everything tied to it, the pairing
  Polpis uses. Headlines split into words and reveal from a mask; anything on
  the first screen animates on load, anything below waits for the scroll;
  buttons are magnetic; the marquee leans with scroll velocity; the header hides
  going down and returns coming up. Every animated element starts visible in the
  markup and is hidden by JS on the first frame, so a blocked script leaves a
  readable page. `prefers-reduced-motion` turns all of it off.

## Photographs

From [Unsplash](https://unsplash.com), whose licence allows commercial use
without permission or attribution. Files live in
[src/assets/photos/](src/assets/photos/) and are named for what they show, so
swapping one is a file replacement. Source IDs, if you want the originals or
larger crops:

| File | Unsplash photo ID |
| --- | --- |
| `card-aerial.jpg` | `1476231682828-37e571bc172f` |
| `forest-mist.jpg`, `card-mist.jpg` | `1448375240586-882707db888b` |
| `ridges.jpg` | `1500534314209-a25ddb2bd429` |
| `conifers-fog.jpg` | `1418065460487-3e41a6c84dc5` |
| `valley-mist.jpg` | `1542273917363-3b1817f69a2d` |
| `forest-light.jpg`, `plate-light.jpg` | `1441974231531-c6227db76b6e` |

Don't swap these for images off Pinterest or an image search — those are almost
always someone else's copyrighted work, and a public site is exactly where that
gets noticed. Unsplash, Pexels and Wikimedia Commons are all safe sources.

## Stack

- [Vite](https://vitejs.dev/) — multi-page build, rooted at `src/` (`vite.config.js` lists each entry)
- [GSAP](https://gsap.com/) + ScrollTrigger — reveals and the plot draw-in
- Newsreader / Inter / DM Mono via Google Fonts

## Layout

```
src/
  index.html  about/  collaborate/  explore/  open-source/  projects/
  scripts/    main.js, motion.js, survey.js, explore.js
  styles/     style.css, explore.css
  assets/     photos/ (Unsplash), generated/ (tool output), screenshots/
tools/        gen_section.py
```

`src/` is the Vite root, so a page's path inside it is its URL: the file
`src/about/index.html` is served at `/about/`. Moving a page directory moves
the live URL with it.

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
  [src/scripts/main.js](src/scripts/main.js). Until then it confirms locally without sending.
