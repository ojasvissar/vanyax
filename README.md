# vanyax

*van* — the forest. *yax* — the guardian spirits of it.

A single-page site for **vanyax**, a platform for biodiversity and ecosystem
data science and ML. Designed as a field archive: black slug and nav bands, a
forest-green colour block holding layered paper documents (a survey sheet with
file tabs, a clay excerpt card, a torn field record), an index of active model
lines, a photographic plate, and an email capture framed as a request of entry.

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

## Stack

- [Vite](https://vitejs.dev/) — dev server & build
- [GSAP](https://gsap.com/) + ScrollTrigger — reveals, paper drift, micro-interactions
- Instrument Serif / EB Garamond / DM Mono via Google Fonts

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
index.html           markup — slug, nav, masthead, dossier, index, plate, request
src/style.css        styles
src/main.js          motion + email capture (Google Form POST)
src/assets/bg.jpg    pixel-art jungle, used as Plate 01
```

## Email capture

Submissions POST to a Google Form. Fill in `GOOGLE_FORM.formId` and
`GOOGLE_FORM.emailEntry` in [src/main.js](src/main.js) — until then the form
confirms locally without a network call.
