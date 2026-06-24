# vanyax

A single-page landing site for **vanyax** — AI for biodiversity. Full-bleed
pixel-art jungle background, a centered email capture, and a few subtle motion
touches (entrance reveal, mouse parallax, canvas rain, and a typewriter "about"
line).

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

## Stack

- [Vite](https://vitejs.dev/) — dev server & build
- [GSAP](https://gsap.com/) — entrance reveal, parallax, micro-interactions
- Vanilla HTML/CSS/JS — no framework

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
index.html           markup
src/style.css        styles
src/main.js          motion + email capture
src/assets/bg.jpg    optimized background (from a 2449×1163 pixel-art original)
```
