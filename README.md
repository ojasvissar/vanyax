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

Nothing on the site claims work that hasn't happened. Keep it that way: add
case studies and numbers when they exist, not before.

## Design notes

Every choice here should be defensible in a sentence.

- **Colour** — ink is near-black shifted green (night forest, not void); paper
  is a warm off-white (field notebook). One structural accent, moss green — a
  plant colour, not a neon one. Sand and sky appear only inside data graphics,
  where a second and third category need telling apart.
- **Type** — Bricolage Grotesque, set large and tight, carries the pages; a
  neutral UI face at the same sizes reads as a template. Inter for reading,
  JetBrains Mono for anything an instrument would have printed: labels,
  statuses, metadata. Newsreader italic survives in one role only — the
  naturalist note: the name, the etymology in the footer.
- **Photography** — every page opens on a real place, because the subject is
  one. All frames get the same grade (darkened, desaturated, tinted toward the
  moss green) so a set of stock images still reads as one publication, and the
  scrim is built into the component so text never lands on an untreated photo.
- **Surface** — a fine grain over everything, pale washes bleeding in from the
  margins of the paper bands, and torn edges between bands instead of ruled
  lines. No boundary in this subject — coast, canopy, catchment — is straight.
- **Graphics** — all generated, all captioned as illustrative:
  - [tools/gen_map.py](tools/gen_map.py) — the hero survey map: halftone sea,
    study boundary with contours, clustered records, a transect, three stations.
    Inlined (not an `<img>`) so it inherits the palette and the records can be
    drawn in one at a time.
  - [tools/gen_section.py](tools/gen_section.py) — the forest cross-section,
    numbered where data is collected. It answers the question people arrive
    with: *is what I collect the kind of thing you work with?*
  - [tools/gen_edge.py](tools/gen_edge.py) — the torn band edges.

  Regenerate any of them with `python3 tools/gen_*.py` from the repo root.

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
