/* ══════════════════════════════════════════════════════════
   Paper

   What makes the page read as cut paper rather than as coloured
   boxes is that its edges are torn instead of ruled. Each tear is
   drawn here at the element's real width, so it never stretches,
   and from a seeded generator, so it is the same tear on every
   load rather than a new one each time.
   ══════════════════════════════════════════════════════════ */

/* a small seeded generator: same seed, same rip */
export function seeded(seed) {
  let s = (seed * 2654435761) % 4294967296;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

/* A torn edge is two ragged lines close together: the band's own colour,
   and just past it the white core of the paper — which is what a real rip
   exposes, and the one detail that sells it.
   data-tear="down" tears the bottom of a band, hanging over the next one;
   data-tear="up" tears the top of a band, reaching over the one before. */
function paintTear(el, index) {
  const w = Math.max(1, Math.round(el.clientWidth));
  const h = Math.max(1, Math.round(el.clientHeight));
  const down = el.dataset.tear !== 'up';
  const rand = seeded(index + 1 + (Number(el.dataset.seed) || 0) * 97);

  const pts = [];
  let x = 0;
  while (x < w) {
    pts.push([x, h * (0.3 + rand() * 0.42)]);
    x += 5 + rand() * 17;
  }
  pts.push([w, h * (0.3 + rand() * 0.42)]);

  const toLine = (shift) =>
    pts.map(([px, py]) => `${px.toFixed(1)},${(py + shift()).toFixed(1)}`).join(' L');
  const edge = toLine(() => 0);
  const core = toLine(() => (down ? 1 : -1) * (2 + rand() * 4));
  const area = (line) => (down ? `M0,0 L${line} L${w},0 Z` : `M0,${h} L${line} L${w},${h} Z`);

  el.innerHTML =
    `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">` +
    `<path class="tear__rim" d="${area(core)}"/><path class="tear__fill" d="${area(edge)}"/></svg>`;
}

export function tears(root = document) {
  const els = [...root.querySelectorAll('[data-tear]')];
  if (!els.length) return;
  const paint = () => els.forEach(paintTear);
  paint();
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(paint, 150); });
}

/* ── highlights draw themselves in ────────────────────────────
   Each mark starts empty and fills left to right once its sentence
   is on screen, one after another within the sentence, the way you
   would mark a page. The class goes on <html> before anything
   paints, so without JS the marks are simply there. */
export function highlights(root = document) {
  const marks = [...root.querySelectorAll('.hl')];
  if (!marks.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    marks.forEach((m) => m.classList.add('is-on'));
    return;
  }
  // stagger within each sentence, not across the page
  const byParent = new Map();
  marks.forEach((m) => {
    const list = byParent.get(m.parentElement) || [];
    m.style.transitionDelay = `${0.25 + list.length * 0.32}s`;
    list.push(m);
    byParent.set(m.parentElement, list);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-on');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -18% 0px' });
  marks.forEach((m) => io.observe(m));
}
