/* ══════════════════════════════════════════════════════════
   Species explorer — live GBIF, no backend, no keys.

   Everything on the page is fetched when you ask for it. Nothing
   is cached on a server, nothing is precomputed, and no number is
   written by hand: if GBIF doesn't have it, the page says so.

   Data  api.gbif.org/v1  (facets, taxonomy, IUCN category)
         api.gbif.org/v2  (occurrence density raster, EPSG:4326)
   ══════════════════════════════════════════════════════════ */

import { boot as bootMotion, intro } from './motion.js';
import { tears } from './paper.js';
import { geoEquirectangular, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';

const V1 = 'https://api.gbif.org/v1';
const TILES = 'https://api.gbif.org/v2/map/occurrence/density';
const INAT = 'https://api.inaturalist.org/v1';

/* Categorical slots, fixed order, never cycled. Validated against this
   page's surface (#fffcf6): lightness band, chroma floor, CVD separation,
   normal-vision separation and contrast all pass. */
/* the six categories are named in the stylesheet, so the charts follow
   whichever theme is loaded rather than carrying their own palette */
const seriesColour = (i) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--series-${(i % 6) + 1}`).trim() || '#35695e';
const SERIES = new Proxy({ length: 6 }, { get: (t, k) => (/^\d+$/.test(k) ? seriesColour(+k) : t[k]) });

const PRESETS = [
  { key: 5133088, name: 'Danaus plexippus', common: 'Monarch butterfly' },
  { key: 1340503, name: 'Bombus terrestris', common: 'Buff-tailed bumblebee' },
  { key: 5219416, name: 'Panthera tigris', common: 'Tiger' },
  { key: 2417522, name: 'Rhincodon typus', common: 'Whale shark' },
  { key: 2687885, name: 'Ginkgo biloba', common: 'Ginkgo' },
  { key: 5959227, name: 'Ara macao', common: 'Scarlet macaw' },
];

const BASIS = {
  HUMAN_OBSERVATION:   'Seen by a person',
  MACHINE_OBSERVATION: 'Recorded by a machine',
  PRESERVED_SPECIMEN:  'Specimen in a collection',
  MATERIAL_SAMPLE:     'Material sample',
  FOSSIL_SPECIMEN:     'Fossil',
  LIVING_SPECIMEN:     'Living specimen',
  OBSERVATION:         'Observation',
  OCCURRENCE:          'Unspecified',
  LITERATURE:          'From literature',
  MATERIAL_CITATION:   'Cited in literature',
  UNKNOWN:             'Unknown',
};
const label = (code) => BASIS[code] ?? code.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const IUCN = {
  EXTINCT: 'Extinct', EXTINCT_IN_THE_WILD: 'Extinct in the wild',
  CRITICALLY_ENDANGERED: 'Critically endangered', ENDANGERED: 'Endangered',
  VULNERABLE: 'Vulnerable', NEAR_THREATENED: 'Near threatened',
  LEAST_CONCERN: 'Least concern', DATA_DEFICIENT: 'Data deficient',
  NOT_EVALUATED: 'Not evaluated',
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LAND = feature(land110, land110.objects.land);
const GRAT = geoGraticule10();

/* ── formatting ──────────────────────────────────────────── */
const full = (n) => (n ?? 0).toLocaleString('en-GB');
const compact = (n) => new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
/* never print "0%" for something that happened */
const share = (a, b) => (a > 0 && pct(a, b) === 0 ? '<1%' : `${pct(a, b)}%`);
const REGION = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; }
})();
const countryName = (code) => {
  if (code === 'Other') return 'Other';
  try { return REGION?.of(code) ?? code; } catch { return code; }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── fetch: cached, abortable ────────────────────────────── */
const cache = new Map();
let inflight = null;

async function api(path, { signal } = {}) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(V1 + path, { signal });
  if (!res.ok) throw Object.assign(new Error(`GBIF ${res.status}`), { status: res.status });
  const json = await res.json();
  cache.set(path, json);
  return json;
}

/* GBIF returns facets as [{field, counts:[{name,count}]}] — flatten to a map */
const facetMap = (payload, field) =>
  (payload.facets?.find((f) => f.field === field)?.counts ?? []).map((c) => ({ name: c.name, count: c.count }));

/* ── DOM helpers ─────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const NS = 'http://www.w3.org/2000/svg';

function h(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c != null && node.append(c.nodeType ? c : String(c)));
  return node;
}

function s(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c != null && node.append(c.nodeType ? c : String(c)));
  return node;
}

/* one tooltip for the whole page */
const tip = h('div', { class: 'tip', role: 'status', hidden: 'hidden' });
document.body.append(tip);
function showTip(x, y, html) {
  tip.innerHTML = html;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  const left = Math.min(Math.max(8, x - r.width / 2), innerWidth - r.width - 8);
  tip.style.transform = `translate(${left}px, ${Math.max(8, y - r.height - 14)}px)`;
}
const hideTip = () => { tip.hidden = true; };

/* rounded only on the data end — the baseline end stays square */
function barPath(x, y, w, hgt, r = 4) {
  const rr = Math.max(0, Math.min(r, w / 2, hgt));
  return `M${x} ${y + hgt} L${x} ${y + rr} Q${x} ${y} ${x + rr} ${y} L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} L${x + w} ${y + hgt} Z`;
}
function barPathH(x, y, w, hgt, r = 4) {
  const rr = Math.max(0, Math.min(r, hgt / 2, w));
  return `M${x} ${y} L${x + w - rr} ${y} Q${x + w} ${y} ${x + w} ${y + rr} L${x + w} ${y + hgt - rr} Q${x + w} ${y + hgt} ${x + w - rr} ${y + hgt} L${x} ${y + hgt} Z`;
}

/* ── state ───────────────────────────────────────────────── */
const state = {
  key: null,
  meta: null,
  years: null,          // full-history year facet, never re-filtered
  range: null,          // [from, to] year brush, or null
  scoped: null,         // facets for the current range
  total: 0,
  georef: 0,
  common: null,
  iucn: null,
};

/* ── panels ──────────────────────────────────────────────── */
function panel(id, title, sub) {
  const body = h('div', { class: 'panel__body' });
  const extra = h('div', { class: 'panel__extra' });
  const fig = h('figure', { class: 'panel', id },
    h('figcaption', { class: 'panel__head' },
      h('h3', { class: 'panel__title' }, title),
      sub ? h('p', { class: 'panel__sub' }, sub) : null),
    body, extra);
  return { fig, body, extra };
}

/* every chart ships a table — colour and position are never the only encoding */
function numbersTable(rows, headers) {
  const d = h('details', { class: 'numbers' },
    h('summary', {}, 'Show the numbers'),
    h('div', { class: 'numbers__scroll' },
      h('table', {},
        h('thead', {}, h('tr', {}, headers.map((x) => h('th', {}, x)))),
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c))))))));
  return d;
}

/* ── time-lapse ──────────────────────────────────────────────
   The year facet is already in hand, so a play button can walk the
   archive forward and report a real cumulative count at every step
   without a single extra request. Only the raster is refetched, and
   each frame is preloaded before it is shown so the map never blinks.
   What you are watching is the archive filling in, which is mostly a
   history of who was looking — the caveats below the map say so. */
let lapse = null;

function tileURL(x, from, to) {
  const q = new URLSearchParams({ taxonKey: state.key, srs: 'EPSG:4326', style: 'green.poly', bin: 'hex', hexPerTile: '55' });
  if (from != null) q.set('year', `${from},${to}`);
  return `${TILES}/0/${x}/0@2x.png?${q}`;
}

const preload = (url) => new Promise((done) => {
  const img = new Image();
  img.onload = img.onerror = done;
  img.src = url;
});

function stopLapse() {
  if (!lapse) return;
  lapse.cancelled = true;
  lapse = null;
}

async function playLapse(images, badge, btn) {
  const years = state.years;
  if (years.length < 4) return;
  const first = years[0].year, last = years[years.length - 1].year;
  const stride = Math.max(1, Math.ceil((last - first) / 26));
  const run = { cancelled: false };
  lapse = run;
  btn.classList.add('is-playing');
  btn.querySelector('span').textContent = 'Stop';
  badge.hidden = false;

  let running = 0;
  let cursor = 0;
  for (let y = first; y <= last + stride; y += stride) {
    const end = Math.min(y, last);
    while (cursor < years.length && years[cursor].year <= end) running += years[cursor++].count;
    const urls = [tileURL(0, first, end), tileURL(1, first, end)];
    await Promise.all(urls.map(preload));
    if (run.cancelled) break;
    images.forEach((img, i) => img.setAttribute('href', urls[i]));
    badge.innerHTML = `<b>${end}</b><span>${full(running)} records</span>`;
    await new Promise((r) => setTimeout(r, 460));
    if (run.cancelled) break;
  }

  if (!run.cancelled) {
    images.forEach((img, i) => img.setAttribute('href', tileURL(i, state.range?.[0], state.range?.[1])));
    badge.hidden = true;
  }
  btn.classList.remove('is-playing');
  btn.querySelector('span').textContent = 'Play the archive';
  if (lapse === run) lapse = null;
}

/* ── map: land, graticule, and GBIF's density raster on top ── */
function renderMap(host) {
  host.textContent = '';
  const W = host.clientWidth || 900;
  const H = Math.round(W / 2);

  // Equirectangular, because GBIF's EPSG:4326 tiles are plate carrée:
  // the raster lands on the coastlines pixel for pixel with no resampling.
  const proj = geoEquirectangular().fitSize([W, H], { type: 'Sphere' });
  const path = geoPath(proj);

  // Antarctica is 20% of an equirectangular frame and almost none of the data,
  // so the view is cropped to 84°N–58°S rather than the whole sphere.
  const yTop = proj([0, 84])[1];
  const yBot = proj([0, -58])[1];
  const svg = s('svg', { viewBox: `0 ${yTop} ${W} ${yBot - yTop}`, class: 'map', role: 'img',
    'aria-label': `Global density of occurrence records for ${state.meta?.canonicalName ?? 'this species'}` });
  svg.append(s('path', { class: 'map__sphere', d: path({ type: 'Sphere' }) }));
  svg.append(s('path', { class: 'map__grat', d: path(GRAT) }));
  svg.append(s('path', { class: 'map__land', d: path(LAND) }));

  // two tiles cover the world at zoom 0 in EPSG:4326
  const images = [0, 1].map((x) => {
    const img = s('image', {
      href: tileURL(x, state.range?.[0], state.range?.[1]),
      x: x * (W / 2), y: 0, width: W / 2, height: H,
      class: 'map__density', preserveAspectRatio: 'none',
    });
    svg.append(img);
    return img;
  });

  const readout = h('p', { class: 'map__readout mono' }, 'Move over the map for coordinates');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const p = proj.invert([(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)]);
    readout.textContent = p
      ? `${Math.abs(p[1]).toFixed(1)}° ${p[1] >= 0 ? 'N' : 'S'}   ${Math.abs(p[0]).toFixed(1)}° ${p[0] >= 0 ? 'E' : 'W'}`
      : 'Off the sphere';
  });
  svg.addEventListener('pointerleave', () => { readout.textContent = 'Move over the map for coordinates'; });

  const badge = h('div', { class: 'lapse__badge', hidden: 'hidden' });
  const btn = h('button', { class: 'lapse__btn', type: 'button' },
    h('i', { class: 'lapse__icon' }), h('span', {}, 'Play the archive'));
  btn.addEventListener('click', () => {
    if (lapse) { stopLapse(); btn.classList.remove('is-playing'); btn.querySelector('span').textContent = 'Play the archive'; badge.hidden = true;
      images.forEach((img, i) => img.setAttribute('href', tileURL(i, state.range?.[0], state.range?.[1])));
      return; }
    playLapse(images, badge, btn);
  });

  const frame = h('div', { class: 'map__frame' });
  frame.append(svg, badge);

  host.append(frame, h('div', { class: 'map__foot' },
    h('div', { class: 'ramp' },
      h('span', { class: 'ramp__label mono' }, 'fewer'),
      h('span', { class: 'ramp__bar' }),
      h('span', { class: 'ramp__label mono' }, 'more records per cell')),
    btn,
    readout));
}

/* ── timeline: one bar per year, drag to filter everything ── */
function renderYears(host, extra) {
  host.textContent = '';
  extra.textContent = '';
  const data = state.years;
  if (!data.length) { host.append(h('p', { class: 'empty' }, 'No dated records.')); return; }

  const W = host.clientWidth || 900, H = 190;
  const M = { t: 14, r: 8, b: 26, l: 46 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  // A handful of 19th-century specimens would otherwise squash a century of
  // real data into the last inch. Start where the first 1% of records is in,
  // and say how many were left behind.
  const grand = data.reduce((a, b) => a + b.count, 0);
  let run = 0, start = data[0].year;
  for (const d of data) { run += d.count; if (run >= grand * 0.01) { start = d.year; break; } }
  const before = data.filter((d) => d.year < start);
  const shown = data.filter((d) => d.year >= start);
  const dropped = before.reduce((a, b) => a + b.count, 0);
  const y0 = shown[0].year, y1 = shown[shown.length - 1].year;
  const max = Math.max(...shown.map((d) => d.count));
  const xOf = (yr) => M.l + ((yr - y0) / Math.max(1, y1 - y0 + 1)) * iw;
  const bw = Math.max(1.5, iw / (y1 - y0 + 1) - 1.5);

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img',
    'aria-label': 'Records per year' });

  for (const t of [0, 0.5, 1]) {
    const gy = M.t + ih - t * ih;
    svg.append(s('line', { class: 'grid', x1: M.l, x2: W - M.r, y1: gy, y2: gy }));
    svg.append(s('text', { class: 'tick', x: M.l - 8, y: gy + 4, 'text-anchor': 'end' }, compact(Math.round(t * max))));
  }

  const bars = s('g');
  for (const d of shown) {
    const bh = Math.max(1, (d.count / max) * ih);
    const inRange = !state.range || (d.year >= state.range[0] && d.year <= state.range[1]);
    bars.append(s('path', {
      d: barPath(xOf(d.year), M.t + ih - bh, bw, bh, 2),
      class: `bar ${inRange ? '' : 'bar--out'}`,
    }));
  }
  svg.append(bars);

  for (const yr of [y0, Math.round((y0 + y1) / 2), y1]) {
    svg.append(s('text', { class: 'tick', x: xOf(yr) + bw / 2, y: H - 8, 'text-anchor': 'middle' }, yr));
  }

  const cross = s('line', { class: 'crosshair', y1: M.t, y2: M.t + ih, opacity: 0 });
  const sel = s('rect', { class: 'brush', y: M.t, height: ih, opacity: 0 });
  svg.append(sel, cross);

  const yearAt = (clientX) => {
    const r = svg.getBoundingClientRect();
    const px = (clientX - r.left) * (W / r.width);
    return Math.min(y1, Math.max(y0, Math.round(y0 + ((px - M.l) / iw) * (y1 - y0 + 1))));
  };

  let anchor = null;
  svg.addEventListener('pointermove', (e) => {
    const yr = yearAt(e.clientX);
    const d = shown.find((x) => x.year === yr);
    cross.setAttribute('opacity', 1);
    cross.setAttribute('x1', xOf(yr) + bw / 2);
    cross.setAttribute('x2', xOf(yr) + bw / 2);
    showTip(e.clientX, e.clientY, `<b>${yr}</b><span>${full(d?.count ?? 0)} records</span>`);
    if (anchor != null) {
      const [a, b] = [Math.min(anchor, yr), Math.max(anchor, yr)];
      sel.setAttribute('opacity', 1);
      sel.setAttribute('x', xOf(a));
      sel.setAttribute('width', Math.max(2, xOf(b) + bw - xOf(a)));
    }
  });
  svg.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); hideTip(); });
  svg.addEventListener('pointerdown', (e) => { anchor = yearAt(e.clientX); svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointerup', (e) => {
    if (anchor == null) return;
    const yr = yearAt(e.clientX);
    const [a, b] = [Math.min(anchor, yr), Math.max(anchor, yr)];
    anchor = null;
    setRange(b - a < 1 ? null : [a, b]);
  });

  host.append(svg);
  extra.append(
    h('p', { class: 'hint mono' }, [
      state.range ? `Filtered to ${state.range[0]}–${state.range[1]}` : 'Drag across the years to filter every panel',
      dropped ? ` · ${full(dropped)} earlier records (${before[0].year}–${start - 1}) sit left of this view` : '',
    ].join('')),
    numbersTable(data.map((d) => [d.year, full(d.count)]), ['Year', 'Records']));
}

/* ── month, country, basis ───────────────────────────────── */
function renderMonths(host, extra, counts) {
  host.textContent = ''; extra.textContent = '';
  const byMonth = MONTHS.map((label, i) => ({ label, count: counts.find((c) => +c.name === i + 1)?.count ?? 0 }));
  const total = byMonth.reduce((a, b) => a + b.count, 0);
  if (!total) { host.append(h('p', { class: 'empty' }, 'No records carry a month.')); return; }

  const W = host.clientWidth || 340, H = 190;
  const M = { t: 12, r: 6, b: 24, l: 34 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const max = Math.max(...byMonth.map((d) => d.count));
  const step = iw / 12;

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'Records by month of year' });
  svg.append(s('line', { class: 'grid', x1: M.l, x2: W - M.r, y1: M.t + ih, y2: M.t + ih }));
  byMonth.forEach((d, i) => {
    const bh = Math.max(1, (d.count / max) * ih);
    const x = M.l + i * step + 1;
    const w = step - 2;
    const rect = s('path', { d: barPath(x, M.t + ih - bh, w, bh), class: 'bar' });
    rect.addEventListener('pointerenter', (e) =>
      showTip(e.clientX, e.clientY, `<b>${d.label}</b><span>${full(d.count)} records · ${share(d.count, total)}</span>`));
    rect.addEventListener('pointerleave', hideTip);
    svg.append(rect);
    if (i % 2 === 0) svg.append(s('text', { class: 'tick', x: x + w / 2, y: H - 8, 'text-anchor': 'middle' }, d.label[0]));
  });
  svg.append(s('text', { class: 'tick', x: M.l - 8, y: M.t + 10, 'text-anchor': 'end' }, compact(max)));
  host.append(svg);
  extra.append(numbersTable(byMonth.map((d) => [d.label, full(d.count), share(d.count, total)]), ['Month', 'Records', 'Share']));
}

function renderCountries(host, extra, counts, total) {
  host.textContent = ''; extra.textContent = '';
  if (!counts.length) { host.append(h('p', { class: 'empty' }, 'No records carry a country.')); return; }
  const top = counts.slice(0, 8);
  const rest = counts.slice(8).reduce((a, b) => a + b.count, 0);
  const rows = rest ? [...top, { name: 'Other', count: rest }] : top;
  const max = Math.max(...rows.map((d) => d.count));

  const W = host.clientWidth || 340;
  const rowH = 26, H = rows.length * rowH + 8;
  const labelW = 96, valueW = 56;   // wide enough for a country name, not a code
  const iw = W - labelW - valueW;

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'Records by country' });
  rows.forEach((d, i) => {
    const y = i * rowH + 4;
    const bw = Math.max(2, (d.count / max) * iw);
    // fall back to the ISO code when the name won't fit the gutter
    const name = countryName(d.name);
    svg.append(s('text', { class: 'rowlabel', x: 0, y: y + 13, 'dominant-baseline': 'middle' },
      name.length > 13 ? d.name : name));
    const bar = s('path', { d: barPathH(labelW, y + 3, bw, 15), class: 'bar' });
    bar.addEventListener('pointerenter', (e) =>
      showTip(e.clientX, e.clientY, `<b>${countryName(d.name)}</b><span>${full(d.count)} records · ${share(d.count, total)}</span>`));
    bar.addEventListener('pointerleave', hideTip);
    svg.append(bar);
    // direct label: nine rows is few enough that every one can carry its value
    svg.append(s('text', { class: 'rowvalue', x: labelW + bw + 8, y: y + 13, 'dominant-baseline': 'middle' }, compact(d.count)));
  });
  host.append(svg);
  extra.append(
    h('p', { class: 'hint mono' }, 'Country of publication, as recorded'),
    numbersTable(rows.map((d) => [countryName(d.name), full(d.count), share(d.count, total)]), ['Country', 'Records', 'Share']));
}

function renderBasis(host, extra, counts, total) {
  host.textContent = ''; extra.textContent = '';
  if (!counts.length) { host.append(h('p', { class: 'empty' }, 'No records to break down.')); return; }
  const top = counts.slice(0, 6);
  const sum = top.reduce((a, b) => a + b.count, 0);

  const W = host.clientWidth || 340, H = 34;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'How the records were made' });
  let x = 0;
  top.forEach((d, i) => {
    const w = (d.count / sum) * W;
    const seg = s('rect', { x, y: 6, width: Math.max(1, w - 2), height: 20, rx: 2, fill: SERIES[i], class: 'seg' });
    seg.addEventListener('pointerenter', (e) =>
      showTip(e.clientX, e.clientY, `<b>${label(d.name)}</b><span>${full(d.count)} records · ${share(d.count, total)}</span>`));
    seg.addEventListener('pointerleave', hideTip);
    svg.append(seg);
    x += w;
  });
  const legend = h('ul', { class: 'legend' },
    top.map((d, i) => h('li', {},
      h('span', { class: 'legend__dot', style: `background:${SERIES[i]}` }),
      h('span', { class: 'legend__name' }, label(d.name)),
      h('span', { class: 'legend__val mono' }, share(d.count, total)))));
  host.append(svg, legend);
  extra.append(numbersTable(top.map((d) => [label(d.name), full(d.count), share(d.count, total)]),
    ['How it was recorded', 'Records', 'Share']));
}

/* ── the part that makes it data science rather than decoration ── */
function renderCaveats(host, { countries, basis, total, georef }) {
  host.textContent = '';
  const top3 = countries.slice(0, 3).reduce((a, b) => a + b.count, 0);
  const human = basis.find((b) => b.name === 'HUMAN_OBSERVATION')?.count ?? 0;
  const recent = state.years.filter((y) => y.year >= 2015).reduce((a, b) => a + b.count, 0);

  const items = [
    [pct(top3, total) + '%', 'of records come from just three countries',
      'Occurrence data maps observers, not organisms. A blank region may be unsurveyed rather than unoccupied — the commonest mistake made with this dataset.'],
    [pct(human, total) + '%', 'were seen by a person',
      'Human observation is uneven in space and time: near roads, near cities, at weekends, in summer. Machine and specimen records carry different biases, not fewer.'],
    [pct(recent, total) + '%', 'were recorded since 2015',
      'Most growth in these curves is growth in recording effort. A rising line is not evidence of a rising population, and a falling line is not evidence of decline.'],
    [pct(georef, total) + '%', 'carry usable coordinates',
      'Everything on the map is drawn from this subset. Records without coordinates still count in the totals but cannot be placed.'],
  ];
  host.append(
    h('h2', { class: 'caveats__title' }, 'What this data cannot tell you'),
    h('div', { class: 'caveats__grid' },
      items.map(([n, label, why]) => h('div', { class: 'stat' },
        h('p', { class: 'stat__n' }, n),
        h('p', { class: 'stat__label' }, label),
        h('p', { class: 'stat__why' }, why)))));
}

/* ── header ──────────────────────────────────────────────── */
function renderHead(host) {
  const { meta, common, iucn, total } = state;
  host.textContent = '';
  const rank = [meta.kingdom, meta.phylum, meta.class, meta.order, meta.family].filter(Boolean);
  host.append(
    h('div', { class: 'rpt__id' },
      h('p', { class: 'rpt__path mono' }, rank.join('  ›  ')),
      h('h2', { class: 'rpt__name' }, meta.canonicalName ?? meta.scientificName),
      common ? h('p', { class: 'rpt__common' }, common) : null,
      iucn?.category ? h('p', { class: `chip chip--${iucn.category.toLowerCase()}` },
        `IUCN · ${IUCN[iucn.category] ?? iucn.category}`) : null),
    h('div', { class: 'rpt__count' },
      h('p', { class: 'rpt__n' }, full(total)),
      h('p', { class: 'rpt__nlabel mono' },
        state.range ? `records, ${state.range[0]}–${state.range[1]}` : 'occurrence records worldwide'),
      state.range ? h('button', { class: 'clear', onclick: () => setRange(null) }, 'Clear year filter ×') : null));
}

function renderMethod(host) {
  host.textContent = '';
  const q = `${V1}/occurrence/search?taxonKey=${state.key}&limit=0&facet=year&facet=month&facet=country&facet=basisOfRecord${state.range ? `&year=${state.range.join(',')}` : ''}`;
  host.append(
    h('h3', { class: 'method__title' }, 'How this page was made'),
    h('p', {}, 'Every figure above is the response to a query you can run yourself. This is the one behind the current view:'),
    h('a', { class: 'method__q mono', href: q, target: '_blank', rel: 'noopener' }, q),
    h('p', { class: 'method__cite' },
      'Occurrence data and the density raster: GBIF.org, queried live. Taxonomy and IUCN Red List category via the GBIF Species API. ',
      h('a', { href: 'https://www.gbif.org/citation-guidelines', target: '_blank', rel: 'noopener' }, 'Citation guidelines'),
      '. Map is equirectangular so GBIF’s EPSG:4326 raster aligns with the coastlines without resampling.'));
}

/* GBIF's vernacular list is a union of sources, in no order and with no
   preferred flag — the first English entry for the monarch is "Milkweed".
   The name most sources repeat is the one people actually use. */
function commonName(vern) {
  const eng = (vern?.results ?? [])
    .filter((v) => v.language === 'eng' && v.vernacularName && !v.vernacularName.includes('['))
    .map((v) => v.vernacularName.trim());
  if (!eng.length) return null;
  const tally = new Map();
  for (const n of eng) {
    const k = n.toLowerCase();
    tally.set(k, (tally.get(k) ?? 0) + 1);
  }
  const [best] = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0];
  return best.replace(/\b\w/, (c) => c.toUpperCase());
}

/* iNaturalist curates one preferred common name per taxon; GBIF returns every
   name every source ever used. Ask iNat first, keep GBIF's as the fallback.
   Deliberately not awaited with the rest — a common name is not worth delaying
   the page for, so it arrives late and quietly. */
async function refineCommonName(scientific) {
  try {
    const res = await fetch(`${INAT}/taxa?q=${encodeURIComponent(scientific)}&rank=species&per_page=1`);
    const best = (await res.json()).results?.[0];
    if (!best?.preferred_common_name) return;
    if (best.name && best.name.toLowerCase() !== scientific.toLowerCase()) return; // wrong taxon
    state.common = best.preferred_common_name.replace(/\b\w/g, (c) => c.toUpperCase());
    renderHead($('#head'));
  } catch { /* GBIF's guess stands */ }
}

/* ── load ────────────────────────────────────────────────── */
async function facetsFor(key, range) {
  const yearQ = range ? `&year=${range.join(',')}` : '';
  return api(`/occurrence/search?taxonKey=${key}&limit=0&facet=year&facet=month&facet=country&facet=basisOfRecord&facetLimit=300${yearQ}`);
}

function setBusy(on) {
  $('#report').classList.toggle('is-busy', on);
}

async function load(key) {
  stopLapse();
  if (inflight) inflight.abort();
  inflight = new AbortController();
  const { signal } = inflight;
  state.key = key;
  state.range = null;
  setBusy(true);
  $('#report').hidden = false;

  try {
    const [meta, facets, georefRes, vern, iucn] = await Promise.all([
      api(`/species/${key}`, { signal }),
      facetsFor(key, null),
      api(`/occurrence/search?taxonKey=${key}&limit=0&hasCoordinate=true`, { signal }),
      api(`/species/${key}/vernacularNames?limit=60`, { signal }).catch(() => null),
      api(`/species/${key}/iucnRedListCategory`, { signal }).catch(() => null),
    ]);

    state.meta = meta;
    state.total = facets.count;
    state.georef = georefRes.count;
    state.years = facetMap(facets, 'YEAR')
      .map((d) => ({ year: +d.name, count: d.count }))
      .filter((d) => d.year >= 1800 && d.year <= new Date().getFullYear())
      .sort((a, b) => a.year - b.year);
    state.scoped = facets;

    state.common = commonName(vern);
    state.iucn = iucn?.category ? iucn : null;
    document.title = `${meta.canonicalName ?? 'Species'} — vanyax explorer`;
    $('#q').value = meta.canonicalName ?? '';
    sizeInput();
    document.fonts?.ready.then(sizeInput);

    renderHead($('#head'));
    paint();
    refineCommonName(meta.canonicalName ?? '');
  } catch (err) {
    if (err.name === 'AbortError') return;
    $('#report').innerHTML = '';
    $('#report').append(h('div', { class: 'wrap' },
      h('p', { class: 'error' }, `Could not reach GBIF (${err.message}). The page holds no copy of the data, so there is nothing to show until it answers. Try again in a moment.`)));
  } finally {
    setBusy(false);
  }
}

/* re-run only what a year filter changes */
async function setRange(range) {
  stopLapse();
  state.range = range;
  setBusy(true);
  try {
    const facets = await facetsFor(state.key, range);
    state.scoped = facets;
    state.total = facets.count;
    const georef = await api(`/occurrence/search?taxonKey=${state.key}&limit=0&hasCoordinate=true${range ? `&year=${range.join(',')}` : ''}`);
    state.georef = georef.count;
    renderHead($('#head'));
    paint();
  } finally {
    setBusy(false);
  }
}

/* draw every panel from whatever is currently in state */
function paint() {
  const countries = facetMap(state.scoped, 'COUNTRY');
  const basis = facetMap(state.scoped, 'BASIS_OF_RECORD');
  const months = facetMap(state.scoped, 'MONTH');

  renderMap($('#p-map .panel__body'));
  renderYears($('#p-year .panel__body'), $('#p-year .panel__extra'));
  renderMonths($('#p-month .panel__body'), $('#p-month .panel__extra'), months);
  renderCountries($('#p-country .panel__body'), $('#p-country .panel__extra'), countries, state.total);
  renderBasis($('#p-basis .panel__body'), $('#p-basis .panel__extra'), basis, state.total);
  renderCaveats($('#caveats'), { countries, basis, total: state.total, georef: state.georef });
  renderMethod($('#method'));

  $('#p-map .panel__sub').textContent = state.range
    ? `All georeferenced records, ${state.range[0]}–${state.range[1]}, binned`
    : 'All georeferenced records, binned';
}

/* ── search ──────────────────────────────────────────────── */
let mirror;
function sizeInput() {
  const q = $('#q');
  if (!mirror) {
    mirror = h('span', { class: 'ask__mirror', 'aria-hidden': 'true' });
    q.parentNode.append(mirror);
  }
  mirror.textContent = q.value || q.placeholder;
  // the gap after the name has to scale with the display size, or the "?"
  // crowds the last letter at 4rem and floats away at 2rem
  const pad = parseFloat(getComputedStyle(q).fontSize) * 0.14;
  q.style.width = `${Math.min(Math.max(mirror.getBoundingClientRect().width + pad, 120), 620)}px`;
}

// the first measurement happens in the fallback face, which is a different
// width — remeasure once the real one has loaded
document.fonts?.ready.then(() => { if ($('#q')) sizeInput(); });

function initSearch() {
  const q = $('#q');
  const list = $('#suggest');
  let items = [], active = -1, timer, ac;

  const close = () => { list.hidden = true; active = -1; q.setAttribute('aria-expanded', 'false'); };

  const draw = () => {
    list.textContent = '';
    items.forEach((it, i) => {
      list.append(h('li', {
        class: `sug ${i === active ? 'is-active' : ''}`, role: 'option', id: `sug-${i}`,
        'aria-selected': i === active,
        onmousedown: (e) => { e.preventDefault(); choose(i); },
      },
        h('span', { class: 'sug__name' }, it.canonicalName ?? it.scientificName),
        h('span', { class: 'sug__rank mono' }, (it.rank ?? '').toLowerCase())));
    });
    list.hidden = !items.length;
    q.setAttribute('aria-expanded', String(!!items.length));
  };

  const choose = (i) => {
    const it = items[i];
    if (!it) return;
    close();
    q.blur();
    location.hash = `#${it.key}`;
  };

  q.addEventListener('input', () => {
    sizeInput();
    clearTimeout(timer);
    const term = q.value.trim();
    if (term.length < 2) { items = []; return draw(); }
    timer = setTimeout(async () => {
      ac?.abort();
      ac = new AbortController();
      try {
        const res = await fetch(`${V1}/species/suggest?q=${encodeURIComponent(term)}&limit=7`, { signal: ac.signal });
        items = (await res.json()).filter((x) => ['SPECIES', 'SUBSPECIES', 'GENUS'].includes(x.rank));
        active = -1;
        draw();
      } catch (e) { /* aborted or offline — leave the last list up */ }
    }, 160);
  });

  q.addEventListener('keydown', (e) => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      q.setAttribute('aria-activedescendant', `sug-${active}`);
      draw();
    } else if (e.key === 'Enter') { e.preventDefault(); choose(active < 0 ? 0 : active); }
    else if (e.key === 'Escape') close();
  });
  q.addEventListener('blur', () => setTimeout(close, 120));
  sizeInput();
}

function initPresets() {
  $('#presets').append(...PRESETS.map((p) => h('button', {
    class: 'chip chip--btn', onclick: () => { location.hash = `#${p.key}`; },
  }, h('i', {}, p.name), ` ${p.common}`)));
}

async function globalCount() {
  try {
    const d = await api('/occurrence/search?limit=0');
    $('#globalCount').textContent = `${compact(d.count)} occurrence records`;
  } catch { $('#globalCount').textContent = 'GBIF'; }
}

/* ── boot ────────────────────────────────────────────────── */
function fromHash() {
  const key = +location.hash.replace('#', '');
  return Number.isFinite(key) && key > 0 ? key : PRESETS[0].key;
}

intro();
tears();
bootMotion();
initSearch();
initPresets();
document.fonts?.ready.then(sizeInput);
globalCount();
addEventListener('hashchange', () => load(fromHash()));
load(fromHash());

let rt;
addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => { if (state.meta) paint(); }, 220);
});
