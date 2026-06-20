import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as d3 from 'd3';

gsap.registerPlugin(ScrollTrigger);

/* ── LENIS smooth scroll ── */
const lenis = new Lenis({
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ── NAV: scroll class + mobile burger ── */
const nav         = document.getElementById('nav');
const burger      = document.querySelector('.nav-burger');
const drawer      = document.querySelector('.nav-drawer');
const drawerLinks = document.querySelectorAll('.nav-drawer a');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
});

drawerLinks.forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
});

/* ── HERO entrance animation ── */
gsap.from('.hero-text > *', {
  y: 32, opacity: 0, duration: 0.9, stagger: 0.12,
  ease: 'power3.out', delay: 0.2,
});

gsap.from('.hero-card', {
  y: 24, opacity: 0, duration: 0.8, stagger: 0.14,
  ease: 'power3.out', delay: 0.5,
});

/* ── SPARKLINE (D3) ── */
function buildSparkline() {
  const el = document.getElementById('sparkline');
  if (!el) return;

  const data = [420,380,510,470,620,590,680,720,660,800,750,880,920,870,960,1020,980,1100,1060,1200,1150,1350,1280,1420,1520,1480,1650,1720,1800,1847];
  const W = el.clientWidth || 320;
  const H = 48;

  const svg = d3.select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'none')
    .style('width', '100%').style('height', '100%');

  const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, W]);
  const y = d3.scaleLinear().domain([d3.min(data), d3.max(data)]).range([H - 4, 4]);

  const area = d3.area()
    .x((_, i) => x(i)).y0(H).y1(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const line = d3.line()
    .x((_, i) => x(i)).y(d => y(d))
    .curve(d3.curveCatmullRom.alpha(0.5));

  const gradId = 'spark-grad';
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id', gradId).attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',1);
  grad.append('stop').attr('offset','0%').attr('stop-color','#1a6640').attr('stop-opacity',0.18);
  grad.append('stop').attr('offset','100%').attr('stop-color','#1a6640').attr('stop-opacity',0);

  svg.append('path').datum(data).attr('d', area).attr('fill', `url(#${gradId})`);
  const linePath = svg.append('path').datum(data).attr('d', line)
    .attr('fill','none').attr('stroke','#1a6640').attr('stroke-width',1.5);

  const len = linePath.node().getTotalLength();
  linePath.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
    .transition().duration(1600).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
}
buildSparkline();

/* ── COUNTER animation ── */
const counters = document.querySelectorAll('.num[data-to]');

const countUp = el => {
  const target = +el.dataset.to;
  const dur = 1800;
  const start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(step);
};

const numObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); numObs.unobserve(e.target); } });
}, { threshold: 0.4 });
counters.forEach(c => numObs.observe(c));

/* ── GSAP scroll animations ── */

gsap.utils.toArray('.section-hd').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 82%' },
    y: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
  });
});

gsap.from('.problem-left', {
  scrollTrigger: { trigger: '#problem', start: 'top 78%' },
  x: -30, opacity: 0, duration: 0.8, ease: 'power3.out',
});
gsap.from('.problem-right', {
  scrollTrigger: { trigger: '#problem', start: 'top 78%' },
  x: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1,
});

gsap.utils.toArray('.svc-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: 'top 88%' },
    y: 24, opacity: 0, duration: 0.7, ease: 'power3.out',
    delay: (i % 2) * 0.12,
  });
});

gsap.utils.toArray('.step').forEach((step, i) => {
  gsap.from(step, {
    scrollTrigger: { trigger: step, start: 'top 88%' },
    x: -20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: i * 0.07,
  });
});

gsap.utils.toArray('.stack-group').forEach((g, i) => {
  gsap.from(g, {
    scrollTrigger: { trigger: g, start: 'top 86%' },
    y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: i * 0.1,
  });
});

gsap.from('.about-img', {
  scrollTrigger: { trigger: '#about', start: 'top 78%' },
  scale: 0.96, opacity: 0, duration: 1, ease: 'power3.out',
});
gsap.from('.about-text > *', {
  scrollTrigger: { trigger: '#about', start: 'top 78%' },
  x: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.15,
});

gsap.from('.contact-inner > *', {
  scrollTrigger: { trigger: '#contact', start: 'top 80%' },
  y: 28, opacity: 0, duration: 0.75, stagger: 0.1, ease: 'power3.out',
});

/* ── FORMS ── */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button');
    btn.textContent = 'Sent ✓';
    btn.style.background = '#2d8a5a';
    setTimeout(() => { btn.textContent = 'Start a project →'; btn.style.background = ''; contactForm.reset(); }, 3000);
  });
}

const dfForm = document.getElementById('df-form');
if (dfForm) {
  dfForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = dfForm.querySelector('button');
    btn.textContent = 'Applied ✓';
    btn.style.background = '#1a6640';
    setTimeout(() => { btn.textContent = 'Apply'; btn.style.background = ''; dfForm.reset(); }, 3000);
  });
}

/* ── SCROLL PROGRESS BAR ── */
const prog = document.createElement('div');
prog.style.cssText = 'position:fixed;top:0;left:0;height:2px;z-index:9999;background:linear-gradient(90deg,#1a6640,#52b788);width:0;pointer-events:none;transition:width .08s linear;';
document.body.prepend(prog);
lenis.on('scroll', ({ progress }) => { prog.style.width = (progress * 100) + '%'; });

/* ── NAV: active link highlight on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const activeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const link = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => activeObs.observe(s));

/* ── NUMBERS: stagger each cell ── */
gsap.utils.toArray('.num-cell').forEach((cell, i) => {
  gsap.from(cell, {
    scrollTrigger: { trigger: cell, start: 'top 88%' },
    y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: i * 0.1,
  });
});

/* ── CURSOR DOT ── */
const dot = document.createElement('div');
dot.style.cssText = 'position:fixed;width:6px;height:6px;border-radius:50%;background:var(--green);pointer-events:none;z-index:9998;opacity:0;transition:opacity .3s,transform .3s;mix-blend-mode:multiply;transform:translate(-50%,-50%);';
document.body.appendChild(dot);
document.addEventListener('mousemove', e => {
  dot.style.left = e.clientX + 'px';
  dot.style.top = e.clientY + 'px';
  dot.style.opacity = '1';
});
document.addEventListener('mouseleave', () => dot.style.opacity = '0');
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => { dot.style.transform = 'translate(-50%,-50%) scale(3)'; dot.style.opacity = '.4'; });
  el.addEventListener('mouseleave', () => { dot.style.transform = 'translate(-50%,-50%) scale(1)'; dot.style.opacity = '1'; });
});

/* ── ANCHOR LINKS: smooth via Lenis ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
  });
});

/* ── EYEBROW: letter-by-letter reveal ── */
document.querySelectorAll('.eyebrow').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 88%' },
    opacity: 0, y: 12, duration: 0.5, ease: 'power2.out',
  });
});

/* ── CASE STUDY animation ── */
gsap.from('.cs-img', {
  scrollTrigger: { trigger: '#case-study', start: 'top 78%' },
  x: -30, opacity: 0, duration: 0.9, ease: 'power3.out',
});
gsap.from('.cs-body > *', {
  scrollTrigger: { trigger: '#case-study', start: 'top 78%' },
  y: 20, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.2,
});

/* ── CASE STUDY: metric numbers count up ── */
const csMetrics = document.querySelectorAll('.cs-m span');
const csObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const raw = el.textContent;
      const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 1) {
        const prefix = raw.match(/^[^0-9]*/)[0];
        const suffix = raw.match(/[^0-9.]*$/)[0];
        let start = null;
        const dur = 1200;
        const tick = ts => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / dur, 1);
          el.textContent = prefix + (num * (1 - Math.pow(1-p,3))).toFixed(raw.includes('.') ? 1 : 0) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      csObs.unobserve(el);
    }
  });
}, { threshold: 0.6 });
csMetrics.forEach(m => csObs.observe(m));

/* ── HERO: stagger hero headline words ── */
const heroHl = document.querySelector('.hero-hl');
if (heroHl) {
  const words = heroHl.innerHTML.split(/(\s+|<br>)/g);
  heroHl.innerHTML = words.map(w =>
    w === '<br>' ? '<br>' : w.trim() ? `<span class="hl-word" style="display:inline-block;overflow:hidden"><span class="hl-inner" style="display:inline-block">${w}</span></span>` : w
  ).join('');
  gsap.from('.hl-inner', { y: '100%', duration: .8, stagger: .1, ease: 'power3.out', delay: .4 });
}

/* ── TRUSTED: stagger logos ── */
gsap.from('.trusted-logos span', {
  scrollTrigger: { trigger: '#trusted', start: 'top 90%' },
  opacity: 0, y: 12, duration: 0.5, stagger: 0.08, ease: 'power2.out',
});

/* ── MOTION: respect prefers-reduced-motion ── */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(20);
  lenis.destroy();
  document.documentElement.style.scrollBehavior = 'auto';
}

/* ── HERO: animated particle constellation ── */
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:.45;';
document.querySelector('#hero .hero-bg')?.after(canvas);
function initParticles() {
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const W = canvas.width, H = canvas.height;
  const pts = Array.from({ length: 38 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
    r: 1 + Math.random() * 1.5,
  }));
  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(26,102,64,.55)'; ctx.fill();
    });
    pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 100) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(26,102,64,${.12 * (1 - d / 100)})`;
        ctx.lineWidth = .6; ctx.stroke();
      }
    }));
    raf = requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    initParticles();
  }, { passive: true });
}
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) initParticles();

/* ── CONTACT: stagger form fields ── */
gsap.from('.contact-form > *', {
  scrollTrigger: { trigger: '.contact-form', start: 'top 88%' },
  y: 14, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out',
});

/* ── NAV: observe trusted and case-study for active state ── */
['trusted', 'case-study'].forEach(id => {
  const el = document.getElementById(id);
  if (el) activeObs.observe(el);
});
