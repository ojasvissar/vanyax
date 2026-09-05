/* ══════════════════════════════════════════════════════════
   Motion system

   Lenis for scroll, GSAP for everything tied to it — the same
   pairing the reference sites use. Every animated element starts
   visible in the markup and is hidden by JS on the first frame,
   so a blocked script leaves a readable page rather than a blank
   one.
   ══════════════════════════════════════════════════════════ */

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis = null;

/* ── smooth scroll ───────────────────────────────────────── */
export function initScroll() {
  if (reduced) return null;
  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // in-page anchors have to go through Lenis or they fight it
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
    });
  });
  return lenis;
}

/* ── headline: split to words, mask each line ────────────── */
export function splitWords(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.word')];
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  el.dataset.split = '1';
  const line = document.createElement('span');
  line.className = 'line';
  words.forEach((w, i) => {
    const word = document.createElement('span');
    word.className = 'word';
    word.textContent = i === words.length - 1 ? w : `${w} `;
    line.append(word);
  });
  el.append(line);
  return [...el.querySelectorAll('.word')];
}

export function revealHeading(el, { delay = 0, trigger = null } = {}) {
  const words = splitWords(el);
  if (reduced) return;
  gsap.set(words, { yPercent: 118, opacity: 0 });
  gsap.to(words, {
    yPercent: 0, opacity: 1, duration: 1.05, ease: 'expo.out', stagger: 0.045, delay,
    scrollTrigger: trigger ? { trigger: trigger === true ? el : trigger, start: 'top 88%', once: true } : undefined,
  });
}

/* ── generic reveals ─────────────────────────────────────── */
export function reveals(root = document) {
  const items = [...root.querySelectorAll('[data-anim]')];
  if (!items.length || reduced) return;
  items.forEach((el) => {
    const kind = el.dataset.anim;
    const from = kind === 'scale'
      ? { opacity: 0, scale: 0.965, transformOrigin: '50% 60%' }
      : { opacity: 0, y: 26 };
    gsap.set(el, from);
    const inView = el.getBoundingClientRect().top < innerHeight * 0.95;
    gsap.to(el, {
      opacity: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out',
      delay: +(el.dataset.delay || 0) + (inView ? 0.35 : 0),
      // below the fold it waits for the scroll; on the first screen it just plays,
      // otherwise a hero that fits the viewport never animates at all
      scrollTrigger: inView ? undefined : { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/* ── parallax ────────────────────────────────────────────── */
export function parallax(root = document) {
  if (reduced) return;
  root.querySelectorAll('[data-parallax]').forEach((el) => {
    const amount = +(el.dataset.parallax || 12);
    gsap.to(el, {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ── magnetic buttons ────────────────────────────────────── */
export function magnetic(root = document) {
  if (reduced || matchMedia('(hover: none)').matches) return;
  root.querySelectorAll('[data-magnet], .btn').forEach((el) => {
    const strength = +(el.dataset.magnet || 0.28);
    const move = (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * strength,
        y: (e.clientY - (r.top + r.height / 2)) * strength,
        duration: 0.6, ease: 'power3.out',
      });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ── counters ────────────────────────────────────────────── */
export function counters(root = document) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = end.toLocaleString('en-GB') + suffix; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-GB') + suffix; },
    });
  });
}

/* ── marquee: drifts on its own, leans with scroll ───────── */
export function marquee(root = document) {
  root.querySelectorAll('.marquee').forEach((wrap) => {
    const track = wrap.querySelector('.marquee__track');
    if (!track) return;
    track.innerHTML += track.innerHTML;          // duplicate for a seamless loop
    const width = track.scrollWidth / 2;
    if (reduced) return;
    let offset = 0, dir = 1, speed = 0.4;
    const tick = () => {
      offset -= speed * dir;
      if (offset <= -width) offset += width;
      if (offset > 0) offset -= width;
      track.style.transform = `translate3d(${offset}px,0,0)`;
    };
    gsap.ticker.add(tick);
    if (lenis) lenis.on('scroll', ({ velocity }) => {
      dir = velocity < -0.1 ? -1 : 1;
      speed = Math.min(6, 0.4 + Math.abs(velocity) * 0.22);
    });
  });
}

/* ── header hides going down, returns coming up ──────────── */
export function stickyHeader() {
  const head = document.querySelector('.site-head');
  if (!head) return;
  let last = 0;
  const onScroll = (y) => {
    if (y > 140 && y > last + 4) head.classList.add('is-hidden');
    else if (y < last - 4 || y < 140) head.classList.remove('is-hidden');
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
}

/* ══════════════════════════════════════════════════════════
   Hero: the biosphere as a lit band on a dark limb.

   The subject drawn as a phenomenon, the way the reference site
   draws heat. A planet whose centre sits below the fold, one
   luminous atmosphere along its edge, faint bands above it, and
   a scatter of points — records, in the only place they occur.

   The expensive parts (gradients) are baked once per resize into
   an offscreen canvas; each frame only moves cheap things.
   ══════════════════════════════════════════════════════════ */
export function heroCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  let w = 0, h = 0, dpr = 1, base = null, R = 0, cx = 0, cy = 0, stars = [];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function bake() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Anchor the horizon at 62% of the height whatever the viewport is:
    // pick the radius first, then push the centre down so the limb lands there.
    cx = w * 0.5;
    R = Math.max(h * 1.35, w * 0.85);
    cy = h * 0.62 + R;

    base = document.createElement('canvas');
    base.width = canvas.width; base.height = canvas.height;
    const b = base.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);

    b.fillStyle = '#06100c';
    b.fillRect(0, 0, w, h);

    // atmosphere: the glow that sits above the limb
    const glow = b.createRadialGradient(cx, cy, R * 0.965, cx, cy, R * 1.24);
    glow.addColorStop(0.00, 'rgba(206, 255, 231, 0.95)');
    glow.addColorStop(0.04, 'rgba(53, 216, 155, 0.62)');
    glow.addColorStop(0.16, 'rgba(18, 138, 106, 0.30)');
    glow.addColorStop(0.48, 'rgba(11, 59, 51, 0.14)');
    glow.addColorStop(1.00, 'rgba(6, 16, 12, 0)');
    b.fillStyle = glow;
    b.fillRect(0, 0, w, h);

    // the body: darker than the sky, so the limb reads as an edge
    const body = b.createRadialGradient(cx, cy - R * 0.35, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#0c1c16');
    body.addColorStop(0.75, '#081410');
    body.addColorStop(1, '#050d0a');
    b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.fillStyle = body; b.fill();

    // a bright rim right on the edge
    b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2);
    b.strokeStyle = 'rgba(214, 255, 235, 0.75)'; b.lineWidth = 1.3; b.stroke();

    stars = Array.from({ length: 140 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const d = R * (1.02 + Math.random() * 0.42);
      return {
        x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
        r: 0.5 + Math.random() * 1.4, p: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 1.6,
      };
    });
  }

  function frame(t) {
    if (!base) return;
    const time = t / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(base, 0, 0, w, h);

    ctx.save();
    ctx.translate(pointer.x * 16, pointer.y * 10);

    // bands above the limb, breathing slowly out of phase
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const off = R * (1.012 + i * 0.045) + Math.sin(time * 0.32 + i * 1.1) * (5 + i * 4);
      ctx.beginPath();
      ctx.arc(cx, cy, off, Math.PI * 1.06, Math.PI * 1.94);
      ctx.strokeStyle = `rgba(53, 216, 155, ${0.2 - i * 0.03})`;
      ctx.lineWidth = 1 + i * 0.35;
      ctx.stroke();
    }

    // records, scattered in the sky over the limb
    for (const s of stars) {
      const a = 0.25 + Math.sin(time * s.s + s.p) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 242, 77, ${Math.max(0, a) * 0.5})`;
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  }

  bake();
  if (!reduced) gsap.ticker.add(frame);
  else frame(0);

  addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { bake(); if (reduced) frame(0); }, 200);
  });
}

/* ══════════════════════════════════════════════════════════
   The descent: pin, drive sideways, and report altitude.
   ══════════════════════════════════════════════════════════ */
const ALT = [700000, 120, 25, 1.5, 0, -0.3];        // metres, one per panel
const SKY = ['#050a12', '#071620', '#0a2019', '#0a1712', '#0a120e', '#140f09'];

function formatAlt(m) {
  if (m >= 1000) return `${Math.round(m / 1000).toLocaleString('en-GB')} km`;
  if (m >= 10) return `${Math.round(m)} m`;
  if (m > 0.05) return `${m.toFixed(1)} m`;
  if (m > -0.005) return '0 m';
  return `${Math.round(m * 100)} cm`;
}

/* Altitude spans five orders of magnitude, so the big part of the fall is
   interpolated in log space — otherwise the readout sits at "700 km" for
   most of the section and then drops through everything at the end. */
function lerpAlt(a, b, t) {
  if (a > 0 && b > 0) return Math.exp(gsap.utils.interpolate(Math.log(a), Math.log(b), t));
  return gsap.utils.interpolate(a, b, t);
}

export function strata() {
  const section = document.querySelector('.strata');
  if (!section) return;
  const sticky = section.querySelector('.strata__sticky');
  const rail = section.querySelector('.strata__rail');
  const sky = section.querySelector('.strata__sky');
  const value = section.querySelector('[data-alt]');
  const label = section.querySelector('[data-layer-name]');
  const bar = section.querySelector('.strata__bar i');
  const panels = [...section.querySelectorAll('.strata__panel')];

  if (reduced || !panels.length) { section.classList.add('is-static'); return; }

  const distance = () => Math.max(0, rail.scrollWidth - innerWidth + 40);

  gsap.to(rail, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance() + innerHeight * 0.5}`,
      pin: sticky,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const span = (ALT.length - 1) * p;
        const i = Math.min(ALT.length - 2, Math.floor(span));
        const t = span - i;
        if (value) value.textContent = formatAlt(lerpAlt(ALT[i], ALT[i + 1], t));
        if (label) label.textContent = panels[Math.round(span)]?.dataset.layer ?? '';
        if (bar) bar.style.width = `${p * 100}%`;
        if (sky) sky.style.background = gsap.utils.interpolate(SKY[i], SKY[i + 1], t);
      },
    },
  });
}

/* ── page intro: a single wipe, then hand over to scroll ──── */
export function intro() {
  const veil = document.querySelector('.intro');
  if (!veil) return;
  if (reduced) { veil.remove(); return; }
  gsap.to(veil, {
    yPercent: -101, duration: 1.05, ease: 'expo.inOut', delay: 0.12,
    onComplete: () => veil.remove(),
  });
}

/* ── boot everything a page shares ───────────────────────── */
export function boot() {
  initScroll();
  stickyHeader();
  reveals();
  parallax();
  magnetic();
  counters();
  marquee();
  strata();
  document.querySelectorAll('[data-reveal-heading]').forEach((el) => revealHeading(el, { trigger: true }));

  const refresh = () => ScrollTrigger.refresh();

  // Deep links: the browser has already jumped by the time this runs, so the
  // job is only to re-measure — pinning inserts a spacer that changes the
  // document height, and anything measured before that is wrong. Scrolling
  // again here just fights the jump that already happened.
  requestAnimationFrame(refresh);
  document.fonts?.ready.then(refresh);
  addEventListener('load', () => {
    refresh();
    // ScrollTrigger.refresh() restores the scroll position it had before
    // measuring, so the re-seat has to come last or it is immediately undone.
    const target = location.hash && document.querySelector(location.hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView());
  });
}
