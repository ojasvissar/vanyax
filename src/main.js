import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Clock,
  SphereGeometry, MeshBasicMaterial, Mesh,
  BufferGeometry, BufferAttribute, Float32BufferAttribute,
  PointsMaterial, Points, LineBasicMaterial, LineSegments,
  TorusGeometry, AdditiveBlending, Vector3
} from 'three';
import { select, scaleLinear, line, area, axisBottom, axisLeft, easeLinear, curveCatmullRom, format } from 'd3';

gsap.registerPlugin(ScrollTrigger);

/* ── SMOOTH SCROLL ── */
const lenis = new Lenis({
  duration: 1.25,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothTouch: false,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ── CUSTOM CURSOR ── */
const cur = document.getElementById('cur');
const curRing = document.getElementById('cur-ring');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let rx = mx, ry = my;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

gsap.ticker.add(() => {
  rx += (mx - rx) * 0.14;
  ry += (my - ry) * 0.14;
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
  curRing.style.left = rx + 'px';
  curRing.style.top  = ry + 'px';
});

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => curRing.classList.add('on'));
  el.addEventListener('mouseleave', () => curRing.classList.remove('on'));
});

/* ── SCROLL PROGRESS ── */
const prog = document.getElementById('prog');
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => { prog.style.width = (self.progress * 100) + '%'; }
});

/* ── HERO ENTRANCE ── */
gsap.timeline({ delay: 0.15 })
  .from('.hero-frame', { opacity: 0, y: 20, duration: 1.0, ease: 'power3.out' })
  .from('.eyebrow',    { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out' }, '-=0.4')
  .from('.h-hero',     { opacity: 0, y: 28, duration: 0.9, ease: 'power3.out' }, '-=0.5')
  .from('.hero-desc, .hero-ctas, .hero-trust',
    { opacity: 0, y: 18, stagger: 0.12, duration: 0.7, ease: 'power3.out' }, '-=0.55')
  .from('.hero-badge', { opacity: 0, y: 10, duration: 0.6, ease: 'power3.out' }, '-=0.4');

/* ── HERO IMAGE PARALLAX ── */
gsap.to('.hero-img', {
  yPercent: 18, ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
});

/* ── SCROLL REVEALS ── */
const revealEls = document.querySelectorAll('.svc-card, .pfeat, .testi, .proj-card:not(.proj-large)');
revealEls.forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 36 },
    {
      opacity: 1, y: 0,
      duration: 0.75,
      ease: 'power3.out',
      delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }
  );
});

gsap.fromTo('.proj-large',
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.proj-large', start: 'top 88%', once: true } }
);

/* ── SECTION TITLE REVEALS ── */
document.querySelectorAll('.h2, .h-cta').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
  );
});

/* ── STAT COUNTERS ── */
document.querySelectorAll('.stat-n').forEach(el => {
  const target = parseFloat(el.dataset.target);
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target, duration: 2.2, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    onUpdate() { el.textContent = Math.round(obj.v); }
  });
});

/* ── D3 CHART ── */
function initD3() {
  const container = document.getElementById('d3-chart');
  if (!container) return;

  const data = [
    { year: 1990, v: 1.00, proj: false },
    { year: 1995, v: 0.96, proj: false },
    { year: 2000, v: 0.91, proj: false },
    { year: 2005, v: 0.87, proj: false },
    { year: 2010, v: 0.81, proj: false },
    { year: 2015, v: 0.76, proj: false },
    { year: 2020, v: 0.71, proj: false },
    { year: 2025, v: 0.68, proj: false },
    { year: 2030, v: 0.72, proj: true  },
    { year: 2035, v: 0.79, proj: true  },
    { year: 2040, v: 0.86, proj: true  },
  ];

  const W = container.clientWidth || 460;
  const H = 200;
  const m = { t: 16, r: 10, b: 28, l: 32 };
  const w = W - m.l - m.r;
  const h = H - m.t - m.b;

  const svg = select(container).append('svg').attr('width', W).attr('height', H);
  const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);

  const x = scaleLinear().domain([1990, 2040]).range([0, w]);
  const y = scaleLinear().domain([0.55, 1.05]).range([h, 0]);

  // Grid
  y.ticks(4).forEach(tick => {
    g.append('line')
      .attr('x1', 0).attr('x2', w).attr('y1', y(tick)).attr('y2', y(tick))
      .attr('stroke', 'rgba(255,255,255,0.05)').attr('stroke-width', 1);
  });

  // Axes
  const xAxis = axisBottom(x).ticks(6).tickFormat(format('d'));
  g.append('g').attr('transform', `translate(0,${h})`).call(xAxis)
    .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').remove(); })
    .call(ax => ax.selectAll('text')
      .attr('fill', 'rgba(242,237,226,0.38)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '10px'));

  const yAxis = axisLeft(y).ticks(4);
  g.append('g').call(yAxis)
    .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').remove(); })
    .call(ax => ax.selectAll('text')
      .attr('fill', 'rgba(242,237,226,0.38)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '10px'));

  const historical = data.filter(d => !d.proj);
  const projected  = data.filter(d => d.proj || d.year >= 2025);

  const ln = line().x(d => x(d.year)).y(d => y(d.v)).curve(curveCatmullRom.alpha(0.5));
  const ar = area().x(d => x(d.year)).y0(h).y1(d => y(d.v)).curve(curveCatmullRom.alpha(0.5));

  // Baseline
  g.append('line')
    .attr('x1', 0).attr('x2', w).attr('y1', y(1.0)).attr('y2', y(1.0))
    .attr('stroke', '#6b9b6b').attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4').attr('opacity', 0.45);

  // Area fill
  g.append('path').datum(historical).attr('d', ar)
    .attr('fill', 'rgba(200,241,53,0.07)');

  // Clip path for animation
  const clipId = 'chart-clip';
  svg.append('defs').append('clipPath').attr('id', clipId)
    .append('rect').attr('x', 0).attr('y', 0).attr('height', H).attr('width', 0)
    .attr('id', 'clip-rect');

  // Historical line
  g.append('path').datum(historical).attr('d', ln)
    .attr('fill', 'none').attr('stroke', '#c8f135').attr('stroke-width', 2.5)
    .attr('clip-path', `url(#${clipId})`);

  // Projected line
  g.append('path').datum(projected).attr('d', ln)
    .attr('fill', 'none').attr('stroke', '#c8f135').attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,4').attr('opacity', 0.65)
    .attr('clip-path', `url(#${clipId})`);

  // Dot at 2025
  g.append('circle')
    .attr('cx', x(2025)).attr('cy', y(0.68))
    .attr('r', 4).attr('fill', '#c8f135')
    .attr('clip-path', `url(#${clipId})`);

  // Animate on scroll
  ScrollTrigger.create({
    trigger: container, start: 'top 88%', once: true,
    onEnter: () => {
      select('#clip-rect').transition().duration(2000).ease(easeLinear).attr('width', W + 20);
    }
  });
}

initD3();

/* ── THREE.JS GLOBE ── */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  const size = canvas.clientWidth || 480;
  const dpr  = Math.min(window.devicePixelRatio, 2);

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);

  const scene  = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.6;

  const R = 1.52;

  // Wireframe sphere
  scene.add(new Mesh(
    new SphereGeometry(R, 34, 34),
    new MeshBasicMaterial({ color: 0xc8f135, wireframe: true, transparent: true, opacity: 0.028 })
  ));

  // Fibonacci points
  const N = 320;
  const pos = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const θ = golden * i;
    pos[i*3]   = Math.cos(θ) * r * R;
    pos[i*3+1] = y * R;
    pos[i*3+2] = Math.sin(θ) * r * R;
  }
  const ptGeo = new BufferGeometry();
  ptGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  const pts = new Points(ptGeo, new PointsMaterial({
    color: 0xc8f135, size: 0.046,
    transparent: true, opacity: 0.78,
    blending: AdditiveBlending, depthWrite: false
  }));
  scene.add(pts);

  // Connection lines between nearby points
  const arcVerts = [];
  for (let i = 0; i < 120; i++) {
    const a = Math.floor(Math.random() * N);
    const b = Math.floor(Math.random() * N);
    const pa = new Vector3(pos[a*3], pos[a*3+1], pos[a*3+2]);
    const pb = new Vector3(pos[b*3], pos[b*3+1], pos[b*3+2]);
    if (pa.distanceTo(pb) < 0.95) {
      arcVerts.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }
  }
  const arcGeo = new BufferGeometry();
  arcGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(arcVerts), 3));
  scene.add(new LineSegments(arcGeo, new LineBasicMaterial({
    color: 0xc8f135, transparent: true, opacity: 0.1, blending: AdditiveBlending
  })));

  // Equator ring
  const ringMesh = new Mesh(
    new TorusGeometry(R, 0.006, 8, 100),
    new MeshBasicMaterial({ color: 0xc8f135, transparent: true, opacity: 0.22 })
  );
  scene.add(ringMesh);

  // Second ring tilted
  const ring2 = new Mesh(
    new TorusGeometry(R, 0.004, 8, 100),
    new MeshBasicMaterial({ color: 0xc8f135, transparent: true, opacity: 0.1 })
  );
  ring2.rotation.x = Math.PI / 3.5;
  scene.add(ring2);

  // Mouse parallax
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => {
    tx = (e.clientX / window.innerWidth  - 0.5) * 1.2;
    ty = (e.clientY / window.innerHeight - 0.5) * 0.6;
  });

  const clock = new Clock();

  // Fade in on scroll
  ScrollTrigger.create({
    trigger: '#globe-sec', start: 'top 80%', once: true,
    onEnter: () => gsap.fromTo(canvas,
      { opacity: 0, scale: 0.88 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }
    )
  });

  let animFrame;
  function animate() {
    animFrame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    cx += (tx - cx) * 0.045;
    cy += (ty - cy) * 0.045;

    pts.rotation.y = t * 0.09 + cx;
    pts.rotation.x = cy * 0.5;
    ringMesh.rotation.y = t * 0.06;
    ring2.rotation.y = -t * 0.04;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  const ro = new ResizeObserver(() => {
    const s = canvas.clientWidth;
    renderer.setSize(s, s);
  });
  ro.observe(canvas);
}

initGlobe();

/* ── CTA FORM ── */
document.getElementById('cta-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Sent! ✓';
  btn.style.opacity = '0.7';
  setTimeout(() => { btn.textContent = 'Get in touch →'; btn.style.opacity = '1'; }, 3000);
});

/* ── SMOOTH ANCHOR SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = document.querySelector(id);
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80, duration: 1.4 }); }
  });
});
