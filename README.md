# vanyax

*van* — the forest. *yax* — the guardian spirits of it.

A single-page site for **vanyax**, data science and machine learning for
biodiversity and ecosystems. Flat colour blocks, heavy grotesque type and an
original vector forest: a full-viewport hero over a layered panorama, a neon
ticker, hand-drawn emblem badges, three case studies with real visuals (canopy
time series, spectrogram with detections, species interaction network), a
numbers band and a contact block.

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

## Stack

- [Vite](https://vitejs.dev/) — dev server & build
- [GSAP](https://gsap.com/) + ScrollTrigger — reveals, depth parallax, ticker, counters
- Archivo + DM Mono via Google Fonts

## Develop

```bash
npm install
npm run dev      # http://localhost:3000/vanyax/
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Structure

```
index.html              markup — nav, hero, ticker, mission, work, numbers, contact, footer
src/style.css           design system + sections
src/main.js             art inlining, motion, visuals, email capture
src/assets/forest.svg   hero panorama, grouped into parallax layers
src/assets/badges.svg   emblem sprite, referenced with <use href="#badge-…">
```

### The artwork

Both SVGs are generated, not licensed from stock. The generators live in
[tools/](tools/) — run them from the repo root to redraw the art:

```bash
python3 tools/gen_forest.py    # → src/assets/forest.svg
python3 tools/gen_badges.py    # → src/assets/badges.svg
```

The panorama's
`<g data-scene-layer>` groups each carry a `data-depth`, which
[src/main.js](src/main.js) uses to move them at different rates against the
pointer and the scroll.

## Email capture

Submissions POST to a Google Form. Fill in `GOOGLE_FORM.formId` and
`GOOGLE_FORM.emailEntry` in [src/main.js](src/main.js) — until then the form
confirms locally without a network call.
