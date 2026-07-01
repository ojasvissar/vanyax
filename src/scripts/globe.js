/* ══════════════════════════════════════════════════════════
   The Earth, built out of points

   The site's argument is that a record is a point with a place on
   it, and that the pattern those points make is a map of who was
   looking rather than of what lives where. So the globe is not a
   picture of the Earth with data on top: the Earth *is* points.
   Every land dot is one sample of the coastline geometry, lit from
   the upper left; every amber dot is an occurrence record, landing
   over the first few seconds with a ring behind it.

   None of it goes through a projection library at draw time. Each
   point is stored once as a unit vector, rotated with two angles,
   and thrown away before projection if it faces away — which is
   what lets several thousand of them run at sixty frames without
   the main thread noticing.
   ══════════════════════════════════════════════════════════ */

import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { gsap } from 'gsap';
import { reduced, cssVar } from './motion.js';

const WORLD = feature(land110, land110.objects.land);
const RAD = Math.PI / 180;

/* Is this coordinate on land?

   Asking d3 that question point by point means a polygon test against every
   landmass, and sampling the sphere finely enough to look good meant tens of
   thousands of those — seconds of blocked main thread before the first frame.
   So the land is drawn once into a small equirectangular bitmap and the
   question becomes a single array lookup. */
const MASK_W = 1024, MASK_H = 512;
let mask = null;
function landMask() {
  if (mask) return mask;
  const c = document.createElement('canvas');
  c.width = MASK_W; c.height = MASK_H;
  const g = c.getContext('2d', { willReadFrequently: true });
  const proj = geoEquirectangular().fitSize([MASK_W, MASK_H], { type: 'Sphere' });
  const path = geoPath(proj, g);
  g.fillStyle = '#fff';
  g.beginPath(); path(WORLD); g.fill();
  const px = g.getImageData(0, 0, MASK_W, MASK_H).data;
  mask = new Uint8Array(MASK_W * MASK_H);
  for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] > 100 ? 1 : 0;
  return mask;
}
const onLand = (lon, lat) => {
  const m = landMask();
  const x = Math.min(MASK_W - 1, Math.max(0, Math.round(((lon + 180) / 360) * MASK_W)));
  const y = Math.min(MASK_H - 1, Math.max(0, Math.round(((90 - lat) / 180) * MASK_H)));
  return m[y * MASK_W + x] === 1;
};

/* ── the sphere, sampled evenly ───────────────────────────────
   A naive lat/lon grid crowds the poles, so the number of samples
   on each parallel is scaled by its circumference. */
function landPoints(stepDeg) {
  const pts = [];
  for (let lat = -84; lat <= 84; lat += stepDeg) {
    const ring = Math.max(4, Math.round((360 / stepDeg) * Math.cos(lat * RAD)));
    for (let i = 0; i < ring; i++) {
      const lon = -180 + (360 * i) / ring;
      if (!onLand(lon, lat)) continue;
      const φ = lat * RAD, λ = lon * RAD;
      pts.push({
        x: Math.cos(φ) * Math.sin(λ),
        y: Math.sin(φ),
        z: Math.cos(φ) * Math.cos(λ),
        lat, lon,
      });
    }
  }
  return pts;
}

/* the records: real coordinates, weighted the way collection effort
   actually is — heavy over Europe and North America, thin elsewhere.
   That bias is the point the section next to it makes in words. */
const EFFORT = [
  { box: [-10, 35, 30, 62], w: 34 },     // Europe
  { box: [-125, 30, -70, 50], w: 26 },   // North America
  { box: [110, -40, 155, -12], w: 10 },  // Australia
  { box: [-80, -35, -35, 5], w: 8 },     // South America
  { box: [10, -33, 40, 5], w: 6 },       // Africa
  { box: [70, 8, 140, 45], w: 10 },      // Asia
  { box: [-180, -55, 180, 70], w: 6 },   // and everywhere else
];

function records(n) {
  const total = EFFORT.reduce((s, r) => s + r.w, 0);
  const out = [];
  for (let guard = 0; out.length < n && guard < n * 60; guard++) {
    let pick = Math.random() * total, region = EFFORT[0];
    for (const r of EFFORT) { if ((pick -= r.w) <= 0) { region = r; break; } }
    const [w, s, e, nn] = region.box;
    const lon = w + Math.random() * (e - w);
    const lat = s + Math.random() * (nn - s);
    if (!onLand(lon, lat)) continue;
    const φ = lat * RAD, λ = lon * RAD;
    out.push({
      x: Math.cos(φ) * Math.sin(λ), y: Math.sin(φ), z: Math.cos(φ) * Math.cos(λ),
      lat, lon,
      at: 0.15 + Math.pow(Math.random(), 0.7) * 5.5,   // when it lands, in seconds
      big: Math.random() > 0.82,
    });
  }
  return out;
}

/* the mean direction of a set of points on the sphere — averaging their unit
   vectors rather than their degrees, so it behaves across the date line */
function centroid(pts) {
  let x = 0, y = 0, z = 0;
  for (const p of pts) { x += p.x; y += p.y; z += p.z; }
  const n = pts.length || 1;
  x /= n; y /= n; z /= n;
  return { lon: Math.atan2(x, z), lat: Math.atan2(y, Math.hypot(x, z)) };
}

const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;

/* Real records, fetched on load.

   The set above is weighted the way collection effort actually is, which is
   honest as an illustration but is still a drawing of the argument rather than
   the argument itself. GBIF will hand over the real thing, so the globe asks
   for it: a few hundred georeferenced occurrences of one species, plotted
   where they were actually recorded. If the request fails — offline, rate
   limited, whatever — the illustration stays up and the caption keeps saying
   so, because the page should never claim data it does not have. */
const LIVE = [
  { name: 'Danaus plexippus', common: 'monarch' },
  { name: 'Bombus terrestris', common: 'buff-tailed bumblebee' },
  { name: 'Turdus merula', common: 'blackbird' },
  { name: 'Quercus robur', common: 'pedunculate oak' },
  { name: 'Vulpes vulpes', common: 'red fox' },
];

async function liveRecords(limit = 300) {
  const pick = LIVE[Math.floor(Math.random() * LIVE.length)];
  const query = (n, offset) => 'https://api.gbif.org/v1/occurrence/search'
    + `?scientificName=${encodeURIComponent(pick.name)}`
    + `&hasCoordinate=true&hasGeospatialIssue=false&limit=${n}&offset=${offset}`;

  /* One page of results is whatever GBIF returns first, which is usually a
     single publisher's dataset in a single country — a misleading picture of
     where a species has been recorded. Deep offsets would spread the sample
     but GBIF pages them slowly enough to hang the hero, so instead this takes
     several shallow pages at once from a random starting point: fast, and
     drawn from more than one dataset. */
  /* Two large pages, a beat apart, rather than a burst of small ones: GBIF
     answers a page in about four seconds and returns 429 if you ask for
     several at once. The deadline is generous because the illustration is
     already on screen — a late swap costs nothing, an early give-up costs the
     real data — and a rate-limited page is retried once. */
  const PAGES = 2;
  const per = Math.min(300, Math.ceil(limit / PAGES));
  const base = Math.floor(Math.random() * 900);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const deadline = () => (AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined);

  async function page(offset, attempt = 0) {
    try {
      const res = await fetch(query(per, offset), { signal: deadline() });
      if (res.status === 429 && attempt === 0) { await wait(1500); return page(offset, 1); }
      return res.ok ? await res.json() : { results: [] };
    } catch { return { results: [] }; }
  }

  const pages = await Promise.all(
    Array.from({ length: PAGES }, async (_, i) => {
      await wait(i * 250);                    // staggered, so it is never a burst
      return page(base + i * 700);
    }),
  );

  const pts = [];
  const seen = new Set();
  for (const page of pages) {
    for (const r of page.results || []) {
      const lat = r.decimalLatitude, lon = r.decimalLongitude;
      if (typeof lat !== 'number' || typeof lon !== 'number') continue;
      const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (seen.has(key)) continue;                  // the very same spot, twice
      seen.add(key);
      const f = lat * RAD, l = lon * RAD;
      pts.push({
        x: Math.cos(f) * Math.sin(l), y: Math.sin(f), z: Math.cos(f) * Math.cos(l),
        lat, lon,
        at: 0.1 + Math.pow(Math.random(), 0.7) * 4.5,
        big: Math.random() > 0.85,
      });
    }
  }
  if (pts.length < 12) throw new Error('too few georeferenced records');
  return { pts, species: pick };
}

export function heroGlobe(root) {
  if (!root) return;
  const canvas = root.querySelector('.globe__canvas');
  if (!canvas) return;
  const posEl = root.querySelector('[data-globe-pos]');
  const countEl = root.querySelector('[data-globe-count]');
  const ctx = canvas.getContext('2d');

  const DOTS = +(root.dataset.dots || 2);          // degrees between samples
  const MARKS = +(root.dataset.records || 150);
  const land = landPoints(DOTS);
  const marks = records(MARKS);

  const buckets = Array.from({ length: 7 }, () => []);

  /* the palette is read from the stylesheet, but not sixty times a second */
  let colours = { ink: '#0f2726', hot: '#f2ab63' }, colourAge = 1e9;
  function palette() {
    if (colourAge++ > 90) {
      colours = { ink: cssVar('--ink', '#0f2726'), hot: cssVar('--accent', '#f2ab63') };
      colourAge = 0;
    }
    return colours;
  }

  let w = 0, h = 0, r = 0, cx = 0, cy = 0, dpr = 1;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    r = Math.min(w, h) / 2 - Math.min(w, h) * 0.06;
    cx = w / 2; cy = h / 2;
  }

  // yaw and pitch, in radians; the drag carries momentum
  const rot = { yaw: 0.31, pitch: -0.28, vy: 0, vp: 0 };
  const SPIN = 0.0016;
  let dragging = false, px = 0, py = 0, moved = false, steering = false;

  const LIGHT = { x: -0.45, y: 0.42, z: 0.79 };      // from the upper left

  function draw(t) {
    if (!w) return;
    ctx.clearRect(0, 0, w, h);

    const cosY = Math.cos(rot.yaw), sinY = Math.sin(rot.yaw);
    const cosP = Math.cos(rot.pitch), sinP = Math.sin(rot.pitch);

    /* No milky disc behind the dots: it hazed the whole thing over. The sphere
       is read from the dots alone, with one soft shadow inside the limb to
       give it a far side, and a thin atmosphere outside it. */
    const shadow = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.34, r * 0.2, cx, cy, r);
    shadow.addColorStop(0, 'rgba(15, 39, 38, 0)');
    shadow.addColorStop(0.72, 'rgba(15, 39, 38, 0.02)');
    shadow.addColorStop(1, 'rgba(15, 39, 38, 0.09)');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = shadow; ctx.fill();

    const air = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.09);
    air.addColorStop(0, 'rgba(120, 170, 200, 0.22)');
    air.addColorStop(1, 'rgba(120, 170, 200, 0)');
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2); ctx.fillStyle = air; ctx.fill();

    const { ink, hot } = palette();

    /* rotate: about the vertical axis first, then tip toward the viewer.
       Anything with z' <= 0 is on the far side and never gets drawn. */
    const put = (p) => {
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y2 = p.y * cosP - z1 * sinP;
      const z2 = p.y * sinP + z1 * cosP;
      return { sx: cx + x1 * r, sy: cy - y2 * r, z: z2, nx: x1, ny: y2 };
    };

    /* Four thousand dots cannot each have their own fill() — that ran at ten
       frames a second. Instead the brightness is quantised into a handful of
       steps, every dot is added to its step's path, and each step is filled
       once: six fills a frame instead of four thousand. */
    const STEPS = 7;
    for (const b of buckets) { b.length = 0; }
    for (const p of land) {
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y2 = p.y * cosP - z1 * sinP;
      const z2 = p.y * sinP + z1 * cosP;
      if (z2 <= 0.02) continue;
      const lit = x1 * LIGHT.x + y2 * LIGHT.y + z2 * LIGHT.z;
      const a = 0.2 + Math.max(0, lit) * 0.78 * (0.36 + z2 * 0.64);
      const step = Math.min(STEPS - 1, Math.max(0, Math.round(((a - 0.2) / 0.78) * (STEPS - 1))));
      const bucket = buckets[step];
      bucket.push(cx + x1 * r, cy - y2 * r, 0.95 + z2 * 1.35);
    }
    ctx.fillStyle = ink;
    for (let i = 0; i < STEPS; i++) {
      const bucket = buckets[i];
      if (!bucket.length) continue;
      ctx.globalAlpha = 0.2 + (i / (STEPS - 1)) * 0.78;
      ctx.beginPath();
      for (let j = 0; j < bucket.length; j += 3) {
        const x = bucket[j], y = bucket[j + 1], rad = bucket[j + 2];
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // the records, landing one after another with a ring behind them
    const centre = [-(rot.yaw / RAD), rot.pitch / RAD];
    let visible = 0;
    for (const m of marks) {
      const age = t - m.at;
      if (age < 0) continue;
      const q = put(m);
      if (q.z <= 0.03) continue;
      visible++;
      const land0 = Math.min(1, age / 0.55);
      const ease = 1 - Math.pow(1 - land0, 3);
      const rad = (m.big ? 4.2 : 3) * (0.45 + q.z * 0.55) * ease;

      if (age < 1.1) {                                   // the arrival ring
        ctx.globalAlpha = (1 - age / 1.1) * 0.55;
        ctx.strokeStyle = hot; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(q.sx, q.sy, rad + (age / 1.1) * 20, 0, Math.PI * 2); ctx.stroke();
      }
      // a little heat around each one, so they sit above the land rather than in it
      ctx.globalAlpha = 0.16 * q.z;
      ctx.fillStyle = hot;
      ctx.beginPath(); ctx.arc(q.sx, q.sy, rad * 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.6 + q.z * 0.4;
      ctx.beginPath(); ctx.arc(q.sx, q.sy, rad, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (posEl) posEl.textContent = `${fmt(centre[1], 'N', 'S')} ${fmt(((centre[0] + 540) % 360) - 180, 'E', 'W')}`;
    if (countEl) countEl.textContent = `${visible} of ${marks.length}`;
  }

  let t = 0;
  function frame() {
    t += 1 / 60;
    if (!dragging && !steering) {
      rot.yaw += SPIN + rot.vy;
      rot.pitch += rot.vp;
      rot.vy *= 0.94; rot.vp *= 0.94;                   // momentum, bleeding off
      rot.pitch = Math.max(-1.1, Math.min(1.1, rot.pitch));
    }
    draw(t);
  }

  size();
  draw(reduced ? 99 : 0);                               // still, but fully arrived
  if (!reduced) gsap.ticker.add(frame);

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; moved = false; px = e.clientX; py = e.clientY;
    rot.vy = rot.vp = 0;
    canvas.setPointerCapture(e.pointerId);
    root.classList.add('is-held');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = 2.4 / canvas.clientWidth;
    rot.vy = (e.clientX - px) * k;
    rot.vp = -(e.clientY - py) * k;
    rot.yaw += rot.vy;
    rot.pitch = Math.max(-1.1, Math.min(1.1, rot.pitch + rot.vp));
    px = e.clientX; py = e.clientY; moved = true;
    if (reduced) draw(99);
  });
  const release = () => {
    dragging = false;
    root.classList.remove('is-held');
    if (moved) root.classList.add('is-touched');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(t); }, 150); });

  /* swap the illustration for the real thing as soon as GBIF answers */
  const sourceEl = root.querySelector('[data-globe-source]');
  if (sourceEl) sourceEl.textContent = 'Illustrative distribution';
  liveRecords(+(root.dataset.records || 300))
    .then(({ pts, species }) => {
      marks.length = 0;
      for (const p of pts) marks.push(p);
      t = 0;                                   // let them land again, for real

      /* Turn to face them. A species recorded only in Europe would otherwise
         arrive on the far side of a globe pointed at the Pacific, and the hero
         would sit there looking empty. */
      const c = centroid(pts);
      let yaw = -c.lon;
      while (yaw - rot.yaw > Math.PI) yaw -= Math.PI * 2;
      while (yaw - rot.yaw < -Math.PI) yaw += Math.PI * 2;
      if (!reduced) {
        steering = true;
        gsap.to(rot, {
          yaw, pitch: Math.max(-0.85, Math.min(0.85, c.lat)),
          duration: 1.8, ease: 'power2.inOut',
          onComplete: () => { steering = false; rot.vy = 0; rot.vp = 0; },
        });
      } else {
        rot.yaw = yaw; rot.pitch = Math.max(-0.85, Math.min(0.85, c.lat));
      }
      if (sourceEl) {
        sourceEl.innerHTML = '';
        const i = document.createElement('i');
        i.textContent = species.name;
        sourceEl.append(i, document.createTextNode(` · live from GBIF`));
      }
      if (reduced) draw(99);
    })
    .catch(() => { /* the illustration stays, and the caption still says so */ });
}
