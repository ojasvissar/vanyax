/* ══════════════════════════════════════════════════════════
   Survey it yourself

   The claim this whole site rests on is that occurrence data maps
   observers, not organisms — that a blank region is usually
   unsurveyed rather than empty. That is easy to assert and hard to
   feel, so here it is as something you do: a patch of forest with a
   population hidden in it, and a survey you have to walk yourself.

   The population is generated, and says so. Nothing here is real
   data; the point it makes about real data is.
   ══════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';
import { reduced, cssVar } from './motion.js';

const SPECIES = 14;
const INDIVIDUALS = 420;
const BRUSH = 48;

/* a deterministic generator, so the same patch of forest greets everyone
   and the copy underneath can describe it honestly */
function rng(seed) {
  let s = seed >>> 0;
  return () => (((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296));
}

export function survey(root) {
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const out = {
    area: root.querySelector('[data-area]'),
    species: root.querySelector('[data-species]'),
    seen: root.querySelector('[data-seen]'),
    verdict: root.querySelector('[data-verdict]'),
    legend: root.querySelector('[data-legend]'),
  };
  const reset = root.querySelector('[data-reset]');
  const all = root.querySelector('[data-all]');

  let w = 0, h = 0, dpr = 1;
  let pop = [];
  let grid = null, cols = 0, rows = 0, cell = 10;
  let trail = null, tctx = null;   // the walked path, painted smoothly
  let found = new Set();
  let detect = [];
  let seen = 0;
  let walkedOver = new Set();
  let drawing = false;

  const chips = [];
  for (let i = 0; i < SPECIES; i++) {
    const chip = document.createElement('i');
    chip.className = 'survey__chip';
    out.legend.append(chip);
    chips.push(chip);
  }

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(w / cell); rows = Math.ceil(h / cell);
    grid = new Uint8Array(cols * rows);

    // the grid is for the arithmetic; the trail is what you see, so the
    // survey looks like ground walked rather than cells ticked
    trail = document.createElement('canvas');
    trail.width = canvas.width; trail.height = canvas.height;
    tctx = trail.getContext('2d');
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Real communities are a few abundant species and a long tail of rare
    // ones, and the tail is what surveys miss — so abundance follows a
    // decaying series rather than being split evenly. Rare species also get
    // tighter clumps: fewer individuals, in fewer places, easy to walk past.
    const rand = rng(20260905);
    const weights = Array.from({ length: SPECIES }, (_, i) => 1 / Math.pow(i + 1, 1.35));
    const total = weights.reduce((a, b) => a + b, 0);

    // Walking over an animal is not the same as seeing it. Each species gets
    // a detection probability, rolled on every pass — which is why a second
    // sweep of the same ground still finds things, and why occupancy models
    // exist at all.
    detect = Array.from({ length: SPECIES }, () => 0.26 + rand() * 0.5);

    pop = [];
    for (let sp = 0; sp < SPECIES; sp++) {
      const n = Math.max(3, Math.round((weights[sp] / total) * INDIVIDUALS));
      const clumps = n > 40 ? 3 : n > 12 ? 2 : 1;
      const spread = n > 40 ? 150 : n > 12 ? 90 : 46;
      const centres = Array.from({ length: clumps }, () => ({
        x: 30 + rand() * (w - 60), y: 26 + rand() * (h - 52),
      }));
      for (let i = 0; i < n; i++) {
        const c = centres[Math.floor(rand() * centres.length)];
        const a = rand() * Math.PI * 2;
        const d = Math.pow(rand(), 0.65) * spread;
        pop.push({
          sp,
          x: Math.max(6, Math.min(w - 6, c.x + Math.cos(a) * d)),
          y: Math.max(6, Math.min(h - 6, c.y + Math.sin(a) * d)),
          hit: false,
        });
      }
    }
    clear();
  }

  function clear() {
    grid.fill(0);
    if (tctx) tctx.clearRect(0, 0, w, h);
    found = new Set();
    walkedOver = new Set();
    seen = 0;
    pop.forEach((p) => { p.hit = false; });
    chips.forEach((c) => c.classList.remove('is-on'));
    update();
    draw();
  }

  function paint(x, y) {
    const g = tctx.createRadialGradient(x, y, 0, x, y, BRUSH);
    // the walked ground is the page's own green, faded at the edge
    const walked = cssVar('--green', '#35695e');
    g.addColorStop(0, walked); g.addColorStop(0.7, walked); g.addColorStop(1, walked);
    tctx.save();
    tctx.globalAlpha = 0.16;
    tctx.fillStyle = g;
    tctx.beginPath();
    tctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    tctx.fill();
    tctx.restore();
  }

  function sweep(x, y) {
    paint(x, y);
    const c0 = Math.max(0, Math.floor((x - BRUSH) / cell));
    const c1 = Math.min(cols - 1, Math.floor((x + BRUSH) / cell));
    const r0 = Math.max(0, Math.floor((y - BRUSH) / cell));
    const r1 = Math.min(rows - 1, Math.floor((y + BRUSH) / cell));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const dx = (c + 0.5) * cell - x, dy = (r + 0.5) * cell - y;
        if (dx * dx + dy * dy <= BRUSH * BRUSH) grid[r * cols + c] = 1;
      }
    }
    for (let i = 0; i < pop.length; i++) {
      const p = pop[i];
      if (p.hit) continue;
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy > BRUSH * BRUSH) continue;
      walkedOver.add(i);
      if (Math.random() > detect[p.sp] * 0.16) continue;   // a chance per pass
      p.hit = true;
      seen += 1;
      if (!found.has(p.sp)) {
        found.add(p.sp);
        chips[p.sp].classList.add('is-on');
      }
    }
  }

  function surveyAll() {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid[r * cols + c] = 1;
    for (let y = 0; y <= h + BRUSH; y += BRUSH * 0.8) for (let x = 0; x <= w + BRUSH; x += BRUSH * 0.8) paint(x, y);
    pop.forEach((p, i) => {
      walkedOver.add(i);
      if (p.hit) return;
      p.hit = true; seen += 1;
      if (!found.has(p.sp)) { found.add(p.sp); chips[p.sp].classList.add('is-on'); }
    });
    update(); draw();
  }

  function areaPct() {
    let on = 0;
    for (let i = 0; i < grid.length; i++) on += grid[i];
    return Math.round((on / grid.length) * 100);
  }

  function update() {
    const a = areaPct();
    const N = pop.length;
    const f = found.size;
    out.area.textContent = `${a}%`;
    out.species.textContent = `${f} of ${SPECIES}`;
    out.seen.textContent = `${seen} of ${N}`;
    const missed = walkedOver.size - seen;
    out.verdict.textContent =
      a === 0
        ? 'Nothing surveyed yet. On a map this patch is blank — and blank is exactly what an unvisited place looks like.'
        : f === SPECIES
          ? `All ${SPECIES} found, for ${a}% of the ground walked. Very few real surveys get near that, and their maps are read as though they did.`
          : `${a}% of the ground walked, ${f} of ${SPECIES} species found${missed > 0 ? `, and ${missed} individuals you passed within a few metres of and did not see` : ''}. The species still missing are the rare ones, in the places you did not go. On an occurrence map they read as absence.`;
  }

  function draw() {
    if (!grid) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (trail) ctx.drawImage(trail, 0, 0, w, h);

    // only what you actually detected is drawn
    for (const p of pop) {
      if (!p.hit) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.1, 0, Math.PI * 2);
      ctx.fillStyle = cssVar('--ink', '#0f2726');
      ctx.fill();
    }
  }

  const at = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (w / r.width), (e.clientY - r.top) * (h / r.height)];
  };

  canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    root.classList.add('is-started');
    sweep(...at(e)); update(); draw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    e.preventDefault();
    sweep(...at(e)); update(); draw();
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('pointerleave', stop);

  reset?.addEventListener('click', () => { clear(); root.classList.remove('is-started'); });
  all?.addEventListener('click', () => { root.classList.add('is-started'); surveyAll(); });

  build();
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

  if (!reduced) {
    gsap.from(canvas, {
      opacity: 0, duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: root, start: 'top 85%', once: true },
    });
  }
}
