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
  duration: 1.3,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothTouch: false,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ── SCROLL PROGRESS ── */
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: s => { document.getElementById('prog').style.width = (s.progress * 100) + '%'; }
});

/* ── NAV SOLID ON SCROLL ── */
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 60,
  onEnter:     () => nav.classList.add('solid'),
  onLeaveBack: () => nav.classList.remove('solid'),
});

/* ── HERO TAG TYPEWRITER ── */
const heroTag = document.querySelector('.hero-tag');
if (heroTag) {
  const text = heroTag.textContent.trim();
  heroTag.textContent = '';
  const cursor = document.createElement('span');
  cursor.style.cssText = 'animation:cursor-blink .7s step-end infinite;color:var(--green);font-style:normal;';
  cursor.textContent = '|';
  heroTag.appendChild(cursor);
  let i = 0;
  setTimeout(() => {
    const iv = setInterval(() => {
      if (i < text.length) {
        heroTag.insertBefore(document.createTextNode(text[i++]), cursor);
      } else {
        clearInterval(iv);
        setTimeout(() => cursor.remove(), 1400);
      }
    }, 46);
  }, 300);
}

/* ── HERO ENTRANCE ── */
const heroTl = gsap.timeline({ delay: 0.1 });
heroTl
  .from('.h-hero',     { opacity: 0, y: 26, duration: 1.0, ease: 'power3.out' }, 0.5)
  .from('.hero-desc',  { opacity: 0, y: 16, duration: 0.8, ease: 'power3.out' }, 0.75)
  .from('.hero-ctas',  { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 0.95)
  .from('.hero-scene', { opacity: 0, y: 18, duration: 1.2, ease: 'power3.out' }, 0.55);

/* ── SCROLL REVEALS ── */
document.querySelectorAll('.svc-card, .eco-card, .pfeat').forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 32 },
    {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      delay: (i % 4) * 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }
  );
});

document.querySelectorAll('.h2, .h2-light, .h-cta').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
  );
});

/* ── STAT COUNTERS ── */
document.querySelectorAll('.stat-n').forEach(el => {
  const target = parseFloat(el.dataset.target);
  const isYear = target > 1000;
  const obj = { v: isYear ? 1990 : 0 };
  gsap.to(obj, {
    v: target, duration: isYear ? 1.5 : 2.4, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    onUpdate() { el.textContent = Math.round(obj.v); }
  });
});

/* ── D3 BIODIVERSITY CHART ── */
function initD3() {
  const container = document.getElementById('d3-chart');
  if (!container) return;

  const data = [
    { year: 1970, v: 1.00 }, { year: 1975, v: 0.97 }, { year: 1980, v: 0.93 },
    { year: 1985, v: 0.88 }, { year: 1990, v: 0.83 }, { year: 1995, v: 0.78 },
    { year: 2000, v: 0.73 }, { year: 2005, v: 0.69 }, { year: 2010, v: 0.65 },
    { year: 2015, v: 0.61 }, { year: 2020, v: 0.57 }, { year: 2022, v: 0.55 },
    { year: 2025, v: 0.56, proj: true }, { year: 2030, v: 0.60, proj: true },
    { year: 2035, v: 0.67, proj: true }, { year: 2040, v: 0.75, proj: true },
  ];

  const W  = container.clientWidth || 460;
  const H  = 210;
  const m  = { t: 14, r: 8, b: 28, l: 32 };
  const iW = W - m.l - m.r;
  const iH = H - m.t - m.b;

  const svg = select(container).append('svg').attr('width', W).attr('height', H);
  const g   = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);

  const x = scaleLinear().domain([1970, 2040]).range([0, iW]);
  const y = scaleLinear().domain([0.4, 1.05]).range([iH, 0]);

  y.ticks(4).forEach(t => {
    g.append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', y(t)).attr('y2', y(t))
      .attr('stroke', 'rgba(201,168,76,0.08)').attr('stroke-width', 1);
  });

  g.append('g').attr('transform', `translate(0,${iH})`).call(axisBottom(x).ticks(7).tickFormat(d3format('d')))
    .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').remove(); })
    .call(ax => ax.selectAll('text').attr('fill', 'rgba(237,229,208,.3)').style('font-family', 'Space Mono').style('font-size', '10px'));

  g.append('g').call(axisLeft(y).ticks(4).tickFormat(d => d.toFixed(2)))
    .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').remove(); })
    .call(ax => ax.selectAll('text').attr('fill', 'rgba(237,229,208,.3)').style('font-family', 'Space Mono').style('font-size', '10px'));

  const hist = data.filter(d => !d.proj);
  const proj = data.filter(d => d.proj || d.year >= 2022);
  const ln   = line().x(d => x(d.year)).y(d => y(d.v)).curve(curveCatmullRom.alpha(0.5));
  const ar   = area().x(d => x(d.year)).y0(iH).y1(d => y(d.v)).curve(curveCatmullRom.alpha(0.5));

  g.append('line')
    .attr('x1', 0).attr('x2', iW).attr('y1', y(1.0)).attr('y2', y(1.0))
    .attr('stroke', 'rgba(201,168,76,.3)').attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3');

  g.append('path').datum(hist).attr('d', ar).attr('fill', 'rgba(201,168,76,0.07)');

  svg.append('defs').append('clipPath').attr('id', 'lc')
    .append('rect').attr('id', 'lcr').attr('x', 0).attr('y', 0).attr('height', H).attr('width', 0);

  g.append('path').datum(hist).attr('d', ln)
    .attr('fill', 'none').attr('stroke', '#c9a84c').attr('stroke-width', 2.2)
    .attr('clip-path', 'url(#lc)');

  g.append('path').datum(proj).attr('d', ln)
    .attr('fill', 'none').attr('stroke', '#c9a84c').attr('stroke-width', 1.8)
    .attr('stroke-dasharray', '5,3').attr('opacity', 0.5)
    .attr('clip-path', 'url(#lc)');

  g.append('circle').attr('cx', x(2022)).attr('cy', y(0.55))
    .attr('r', 3.5).attr('fill', '#c9a84c').attr('clip-path', 'url(#lc)');

  ScrollTrigger.create({
    trigger: container, start: 'top 88%', once: true,
    onEnter: () => select('#lcr').transition().duration(2400).ease(easeLinear).attr('width', W + 20)
  });
}
initD3();

/* ── GLOBE ── */
function initGlobe() {
  const el = document.getElementById('globe-container');
  if (!el) return;

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

  const arcs = [
    { startLat: -3.4, startLng: -62.2, endLat: -15.0, endLng: -47.0 },
    { startLat: -0.7, startLng:  24.0, endLat:  -2.3, endLng:  34.8 },
    { startLat: -2.3, startLng:  34.8, endLat:  -6.0, endLng:  35.0 },
    { startLat: 28.0, startLng:  85.0, endLat:  20.0, endLng:  72.0 },
    { startLat:  1.0, startLng: 114.0, endLat: -18.3, endLng: 147.7 },
    { startLat: 15.9, startLng: 100.2, endLat:   1.0, endLng: 114.0 },
    { startLat: -6.0, startLng:  35.0, endLat: -33.9, endLng:  25.6 },
  ];

  const size = el.clientWidth || 440;

  const world = Globe()(el)
    .width(size).height(size)
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .atmosphereColor('#c9a84c')
    .atmosphereAltitude(0.14)
    .pointsData(hotspots)
    .pointLat('lat').pointLng('lng')
    .pointColor(() => '#c9a84c')
    .pointAltitude(0.04)
    .pointRadius(0.42)
    .pointLabel('label')
    .arcsData(arcs)
    .arcStartLat('startLat').arcStartLng('startLng')
    .arcEndLat('endLat').arcEndLng('endLng')
    .arcColor(() => ['rgba(201,168,76,0)', 'rgba(201,168,76,0.75)', 'rgba(201,168,76,0)'])
    .arcAltitude(0.26)
    .arcStroke(0.4)
    .arcDashLength(0.35)
    .arcDashGap(0.15)
    .arcDashAnimateTime(2600)
    .ringsData(hotspots)
    .ringLat('lat').ringLng('lng')
    .ringColor(() => t => `rgba(201,168,76,${(1 - t) * 0.45})`)
    .ringMaxRadius(3.5)
    .ringPropagationSpeed(1.4)
    .ringRepeatPeriod(1300);

  world.controls().autoRotate = true;
  world.controls().autoRotateSpeed = 0.5;
  world.controls().enableZoom = false;
  world.controls().enablePan = false;
  world.pointOfView({ lat: 12, lng: 22, altitude: 2.3 });

  new ResizeObserver(() => {
    const s = el.clientWidth;
    world.width(s).height(s);
  }).observe(el);

  gsap.set(el, { opacity: 0, scale: 0.94 });
  ScrollTrigger.create({
    trigger: '#globe-sec', start: 'top 72%', once: true,
    onEnter: () => gsap.to(el, { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' })
  });
}
initGlobe();

/* ── CTA FORM ── */
document.getElementById('cta-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Sent ✓';
  btn.style.opacity = '0.7';
  setTimeout(() => { btn.textContent = 'Get in touch →'; btn.style.opacity = '1'; }, 3000);
});

/* ── SMOOTH ANCHORS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80, duration: 1.4 }); }
  });
});
