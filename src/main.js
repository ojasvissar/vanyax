import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Globe from 'globe.gl';
import {
  select, scaleLinear, line, area,
  axisBottom, axisLeft, easeLinear,
  curveCatmullRom, format as d3format
} from 'd3';

gsap.registerPlugin(ScrollTrigger);

/* ── SMOOTH SCROLL ── */
const lenis = new Lenis({
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothTouch: false,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ── CURSOR ── */
const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let rx = mx, ry = my;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
gsap.ticker.add(() => {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cur.style.left  = mx + 'px';
  cur.style.top   = my + 'px';
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
});
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('on'));
  el.addEventListener('mouseleave', () => ring.classList.remove('on'));
});

/* ── SCROLL PROGRESS ── */
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: s => { document.getElementById('prog').style.width = (s.progress * 100) + '%'; }
});

/* ── TERMINAL TYPEWRITER ── */
const lines = [
  { id: 'tl-1', text: 'Connecting to satellite feeds... <span class="t-ok">[OK]</span>' },
  { id: 'tl-2', text: 'Loading species database...     <span class="t-ok">[OK]</span>' },
  { id: 'tl-3', text: 'ML models online...             <span class="t-ok">[OK]</span>' },
];
let i = 0;
function typeNext() {
  if (i >= lines.length) return;
  const el = document.getElementById(lines[i].id);
  if (!el) return;
  const raw = lines[i].text;
  // strip HTML for char-by-char, then set full HTML
  const stripped = raw.replace(/<[^>]+>/g, '');
  let c = 0;
  const iv = setInterval(() => {
    el.textContent = stripped.slice(0, ++c);
    if (c >= stripped.length) {
      clearInterval(iv);
      el.innerHTML = raw;
      i++;
      setTimeout(typeNext, 300);
    }
  }, 28);
}
setTimeout(typeNext, 800);

/* ── HERO ENTRANCE ── */
gsap.timeline({ delay: 0.1 })
  .from('.hero-frame',     { opacity: 0, y: 16, duration: 0.8, ease: 'power3.out' })
  .from('.eyebrow',        { opacity: 0, y: 12, duration: 0.6, ease: 'power3.out' }, '-=0.3')
  .from('.h-hero',         { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.4')
  .from('.hero-desc, .hero-ctas, .hero-trust',
    { opacity: 0, y: 14, stagger: 0.1, duration: 0.6, ease: 'power3.out' }, '-=0.5');

/* ── HERO PARALLAX ── */
gsap.to('.hero-img', {
  yPercent: 16, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});

/* ── SCROLL REVEALS ── */
document.querySelectorAll('.svc-card, .pfeat, .eco-card').forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0, duration: 0.65, ease: 'power3.out',
      delay: (i % 4) * 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }
  );
});

document.querySelectorAll('.h2, .h-cta').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
  );
});

/* ── STAT COUNTERS ── */
document.querySelectorAll('.stat-n').forEach(el => {
  const target = parseFloat(el.dataset.target);
  const isYear = target > 1000;
  const obj = { v: isYear ? 1990 : 0 };
  gsap.to(obj, {
    v: target, duration: isYear ? 1.5 : 2.2, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    onUpdate() { el.textContent = Math.round(obj.v); }
  });
});

/* ── D3 BIODIVERSITY CHART ── */
function initD3() {
  const container = document.getElementById('d3-chart');
  if (!container) return;

  // Real-ish data approximating global Living Planet Index decline + projected recovery target
  const data = [
    { year: 1970, v: 1.00 }, { year: 1975, v: 0.97 }, { year: 1980, v: 0.93 },
    { year: 1985, v: 0.88 }, { year: 1990, v: 0.83 }, { year: 1995, v: 0.78 },
    { year: 2000, v: 0.73 }, { year: 2005, v: 0.69 }, { year: 2010, v: 0.65 },
    { year: 2015, v: 0.61 }, { year: 2020, v: 0.57 }, { year: 2022, v: 0.55 },
    // Kunming-Montreal target trajectory
    { year: 2025, v: 0.56, proj: true }, { year: 2030, v: 0.60, proj: true },
    { year: 2035, v: 0.67, proj: true }, { year: 2040, v: 0.75, proj: true },
  ];

  const W  = container.clientWidth || 480;
  const H  = 210;
  const m  = { t: 14, r: 8, b: 28, l: 30 };
  const iW = W - m.l - m.r;
  const iH = H - m.t - m.b;

  const svg = select(container).append('svg').attr('width', W).attr('height', H);
  const g   = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);

  const x = scaleLinear().domain([1970, 2040]).range([0, iW]);
  const y = scaleLinear().domain([0.4, 1.05]).range([iH, 0]);

  // Grid
  y.ticks(4).forEach(t => {
    g.append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', y(t)).attr('y2', y(t))
      .attr('stroke', 'rgba(200,241,53,0.06)').attr('stroke-width', 1);
  });

  // Axes
  g.append('g').attr('transform', `translate(0,${iH})`).call(axisBottom(x).ticks(8).tickFormat(d3format('d')))
    .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').remove(); })
    .call(ax => ax.selectAll('text').attr('fill', 'rgba(232,232,232,.3)').style('font-family', 'JetBrains Mono').style('font-size', '10px'));

  g.append('g').call(axisLeft(y).ticks(4).tickFormat(d => d.toFixed(2)))
    .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').remove(); })
    .call(ax => ax.selectAll('text').attr('fill', 'rgba(232,232,232,.3)').style('font-family', 'JetBrains Mono').style('font-size', '10px'));

  const hist = data.filter(d => !d.proj);
  const proj = data.filter(d => d.proj || d.year >= 2022);

  const ln = line().x(d => x(d.year)).y(d => y(d.v)).curve(curveCatmullRom.alpha(0.5));
  const ar = area().x(d => x(d.year)).y0(iH).y1(d => y(d.v)).curve(curveCatmullRom.alpha(0.5));

  // Baseline
  g.append('line')
    .attr('x1', 0).attr('x2', iW).attr('y1', y(1.0)).attr('y2', y(1.0))
    .attr('stroke', '#6b9b6b').attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3').attr('opacity', 0.4);

  // Area under historical
  g.append('path').datum(hist).attr('d', ar).attr('fill', 'rgba(200,241,53,0.06)');

  // Clip for animation
  svg.append('defs').append('clipPath').attr('id', 'lc')
    .append('rect').attr('id', 'lcr').attr('x', 0).attr('y', 0).attr('height', H).attr('width', 0);

  // Historical line
  g.append('path').datum(hist).attr('d', ln)
    .attr('fill', 'none').attr('stroke', '#c8f135').attr('stroke-width', 2.2)
    .attr('clip-path', 'url(#lc)');

  // Projected
  g.append('path').datum(proj).attr('d', ln)
    .attr('fill', 'none').attr('stroke', '#c8f135').attr('stroke-width', 1.8)
    .attr('stroke-dasharray', '5,3').attr('opacity', 0.55)
    .attr('clip-path', 'url(#lc)');

  // Point at 2022
  g.append('circle').attr('cx', x(2022)).attr('cy', y(0.55))
    .attr('r', 3.5).attr('fill', '#c8f135').attr('clip-path', 'url(#lc)');

  // Animate on scroll
  ScrollTrigger.create({
    trigger: container, start: 'top 88%', once: true,
    onEnter: () => {
      select('#lcr').transition().duration(2200).ease(easeLinear).attr('width', W + 20);
    }
  });
}
initD3();

/* ── REAL EARTH GLOBE (globe.gl) ── */
function initGlobe() {
  const wrap = document.getElementById('globe-wrap');
  const el   = document.getElementById('globe-container');
  if (!el) return;

  // Real biodiversity hotspot coordinates
  const hotspots = [
    { lat: -3.4,  lng: -62.2, label: 'Amazon Basin' },
    { lat: -0.7,  lng:  24.0, label: 'Congo Basin' },
    { lat: -2.3,  lng:  34.8, label: 'Serengeti' },
    { lat: 15.9,  lng: 100.2, label: 'Mekong Region' },
    { lat: 28.0,  lng:  85.0, label: 'Himalayan Foothills' },
    { lat: -18.3, lng: 147.7, label: 'Great Barrier Reef' },
    { lat:  1.0,  lng: 114.0, label: 'Borneo' },
    { lat: 60.2,  lng:-107.0, label: 'Boreal Canada' },
    { lat:-33.9,  lng:  25.6, label: 'Cape Floristic' },
    { lat: 12.0,  lng:  15.0, label: 'Sahel' },
    { lat: -6.0,  lng:  35.0, label: 'Rift Valley' },
    { lat: 20.0,  lng:  72.0, label: 'Western Ghats' },
    { lat:-15.0,  lng: -47.0, label: 'Cerrado' },
    { lat: 52.0,  lng:  82.0, label: 'West Siberia' },
    { lat:-41.0,  lng: 172.0, label: 'New Zealand' },
  ];

  // Data corridors between nearby hotspots
  const arcs = [
    { startLat: -3.4, startLng: -62.2, endLat: -15.0, endLng: -47.0 },
    { startLat: -0.7, startLng:  24.0, endLat:  -2.3, endLng:  34.8 },
    { startLat: -2.3, startLng:  34.8, endLat:  -6.0, endLng:  35.0 },
    { startLat: 28.0, startLng:  85.0, endLat:  20.0, endLng:  72.0 },
    { startLat:  1.0, startLng: 114.0, endLat: -18.3, endLng: 147.7 },
    { startLat: 15.9, startLng: 100.2, endLat:   1.0, endLng: 114.0 },
  ];

  const size = el.clientWidth || 460;

  const world = Globe()(el)
    .width(size).height(size)
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .atmosphereColor('#c8f135')
    .atmosphereAltitude(0.12)
    .pointsData(hotspots)
    .pointLat('lat').pointLng('lng')
    .pointColor(() => '#c8f135')
    .pointAltitude(0.04)
    .pointRadius(0.45)
    .pointLabel('label')
    .arcsData(arcs)
    .arcStartLat('startLat').arcStartLng('startLng')
    .arcEndLat('endLat').arcEndLng('endLng')
    .arcColor(() => ['rgba(200,241,53,0.0)', 'rgba(200,241,53,0.7)', 'rgba(200,241,53,0.0)'])
    .arcAltitude(0.28)
    .arcStroke(0.4)
    .arcDashLength(0.35)
    .arcDashGap(0.15)
    .arcDashAnimateTime(2400)
    .ringsData(hotspots)
    .ringLat('lat').ringLng('lng')
    .ringColor(() => t => `rgba(200,241,53,${(1 - t) * 0.5})`)
    .ringMaxRadius(3.5)
    .ringPropagationSpeed(1.5)
    .ringRepeatPeriod(1200);

  // Start slightly tilted, auto-rotate
  world.controls().autoRotate = true;
  world.controls().autoRotateSpeed = 0.55;
  world.controls().enableZoom = false;
  world.controls().enablePan = false;
  world.pointOfView({ lat: 10, lng: 20, altitude: 2.2 });

  // Resize
  const ro = new ResizeObserver(() => {
    const s = el.clientWidth;
    world.width(s).height(s);
  });
  ro.observe(el);

  // Fade in on scroll
  gsap.set(el, { opacity: 0 });
  ScrollTrigger.create({
    trigger: '#globe-sec', start: 'top 75%', once: true,
    onEnter: () => gsap.to(el, { opacity: 1, duration: 1.4, ease: 'power2.out' })
  });
}
initGlobe();

/* ── CTA FORM ── */
document.getElementById('cta-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = '[SENT]';
  btn.style.opacity = '0.7';
  setTimeout(() => { btn.textContent = 'Send →'; btn.style.opacity = '1'; }, 3000);
});

/* ── SMOOTH ANCHORS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80, duration: 1.3 }); }
  });
});
