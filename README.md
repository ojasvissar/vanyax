# Vanyax

A high-fidelity conservation-tech landing page built with pixel art aesthetics, interactive data visualizations, and immersive scroll animations. Vanyax presents biodiversity restoration as a technology-driven mission — merging ecological data with a design language that feels both ancient and futuristic.

Live: [ojasvissar.github.io/vanyax](https://ojasvissar.github.io/vanyax/)

---

## Stack

| Layer | Technology |
|---|---|
| Build | Vite 5 |
| Animations | GSAP 3 + ScrollTrigger |
| Smooth scroll | Lenis |
| Globe | globe.gl (Three.js) |
| Charts | D3 v7 |
| Fonts | Pixelify Sans · DM Sans · Space Mono · Courier Prime |

---

## Project Structure

```
vanyax/
├── index.html          # Full single-page markup
├── src/
│   ├── main.js         # GSAP timelines, globe init, D3 chart, Lenis scroll
│   └── style.css       # Design tokens, layout, animations
├── vite.config.js
├── package.json
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages auto-deploy on push to main
```

---

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
```

```bash
npm run build     # output → dist/
npm run preview   # preview the production build locally
```

---

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that builds the site and deploys it to GitHub Pages automatically. No manual steps required.

```
push to main → npm ci + npm run build → deploy to gh-pages
```

---

## Design Decisions

**Pixel art + data viz** — The site uses custom SVG pixel art (shape-rendering: crispEdges) alongside real biodiversity data and a 3D globe. The tension between low-fi pixel aesthetics and high-fi data communicates that conservation is both ancient wisdom and cutting-edge science.

**Color palette** — Two-register system: sage green (#d5e8c4 hero, #f0ece0 light sections) for ecological warmth; near-black (#0a0906) with amber (#c9a84c) for data and globe sections. No pure white or pure black — everything is slightly warm.

**Typography** — Pixelify Sans for all display headings to reinforce the pixel theme; DM Sans for body text to keep readability high; Space Mono for data labels and monospaced contexts.

**Performance** — All scroll animations use ScrollTrigger's `once: true` so they fire exactly once. The globe is only initialized when its container exists in the DOM. Lenis is synced to GSAP's ticker so there is a single rAF loop.

---

## Data Sources

| Metric | Source |
|---|---|
| Biodiversity index chart | Living Planet Index (WWF / ZSL), 2022 report |
| Species at risk stat | IUCN Red List, 2023 |
| Habitat restored stat | illustrative projection based on restoration targets |
| Founding year | 2024 |

---

## License

MIT
