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

/* Canvases can't inherit, so anything drawn in one reads its colours out of
   the stylesheet instead of hard-coding them. One place to change a palette,
   and the drawings follow the theme. */
export const cssVar = (name, fallback = '#000') =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
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
      lenis.scrollTo(target, { offset: -56 });
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
  gsap.set(words, { yPercent: 118, opacity: 0, rotateX: -55, transformOrigin: '50% 100%' });
  gsap.to(words, {
    yPercent: 0, opacity: 1, rotateX: 0, duration: 1.05, ease: 'expo.out', stagger: 0.045, delay,
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
  root.querySelectorAll('[data-magnet], .btn, .icon-btn, .capture__btn').forEach((el) => {
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
    const dp = +(el.dataset.decimals || 0);
    const show = (v) => (dp
      ? v.toFixed(dp)
      : Math.round(v).toLocaleString('en-GB')) + suffix;
    if (reduced) { el.textContent = show(end); return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = show(obj.v); },
    });
  });
}

/* ── marquee: drifts on its own, leans with scroll ───────── */
export function marquee(root = document) {
  root.querySelectorAll('.marquee').forEach((wrap) => {
    const track = wrap.querySelector('.marquee__track');
    if (!track) return;
    track.innerHTML += track.innerHTML;          // duplicate for a seamless loop
    let held = false;                            // and hold still while read
    wrap.addEventListener('pointerenter', () => { held = true; });
    wrap.addEventListener('pointerleave', () => { held = false; });
    const width = track.scrollWidth / 2;
    if (reduced) return;
    let offset = 0, dir = 1, speed = 0.4;
    const tick = () => {
      if (held) return;
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
  // the mark sits on the media block while that is under it, and flips to ink
  // once the page has scrolled onto the paper
  const media = document.querySelector('[data-hero-media], .hero--sub');
  const onScroll = (y) => {
    if (y > 140 && y > last + 4) head.classList.add('is-hidden');
    else if (y < last - 4 || y < 140) head.classList.remove('is-hidden');
    head.classList.toggle('is-over', !!media && media.getBoundingClientRect().bottom > 90);
    last = y;
  };
  onScroll(lenis ? 0 : scrollY);        // set the right state on the first frame
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
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

/* ── the opening ─────────────────────────────────────────────
   The hero is one rounded block, so the page opens by unmasking it
   from the bottom up while the photograph settles out of a slow
   push-in. Nothing else moves until the block has landed — the
   sequence reads as one gesture rather than six.
   ══════════════════════════════════════════════════════════ */
export function heroIn() {
  const media = document.querySelector('[data-hero-media], .hero--sub .hero__bg');
  if (!media || reduced) return;
  const img = media.querySelector('img');
  const tl = gsap.timeline({ delay: 0.15 });
  tl.fromTo(media,
    { clipPath: 'inset(18% 12% 30% 12% round 40px)' },
    { clipPath: 'inset(0% 0% 0% 0% round 40px)', duration: 1.5, ease: 'expo.inOut' });
  if (img) tl.fromTo(img, { scale: 1.22 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0);
  const ghost = document.querySelector('.hero__ghost');
  if (ghost) tl.from(ghost, { opacity: 0, scale: 1.12, duration: 1.6, ease: 'expo.out' }, 0.3);
  const cards = document.querySelectorAll('.stat-card');
  if (cards.length) tl.from(cards, { y: 34, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 0.75);
  return tl;
}

/* ── media: every picture wipes up into its own frame ────── */
export function mediaReveals(root = document) {
  if (reduced) return;
  root.querySelectorAll('.shot, .figure__plate, .plate, .card__img').forEach((el) => {
    gsap.fromTo(el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
  });
}

/* ══════════════════════════════════════════════════════════
   THE REST OF THE MOTION

   Everything below is scroll- or pointer-driven decoration. Each
   piece checks `reduced` first and builds its own markup where it
   needs any, so the HTML carries no empty divs for effects that
   may never run.
   ══════════════════════════════════════════════════════════ */

/* ── the hero leaves as one block ─────────────────────────────
   The picture drifts and grows while the ghost climbs out of the
   top, the copy fades back, and the whole block scales down and
   rounds off — so the hero reads as an object being set down as
   you scroll past it rather than a background sliding away. */
export function heroScroll() {
  const media = document.querySelector('[data-hero-media]');
  if (!media || reduced) return;
  const img = media.querySelector('img');
  const ghost = media.querySelector('.hero__ghost');
  const inner = media.querySelector('.hero__inner');
  const tl = gsap.timeline({
    scrollTrigger: { trigger: media, start: 'top top', end: 'bottom top', scrub: 0.5 },
  });
  if (img) tl.to(img, { yPercent: 10, scale: 1.12, ease: 'none' }, 0);
  if (ghost) tl.to(ghost, { yPercent: -60, opacity: 0, ease: 'none' }, 0);
  if (inner) tl.to(inner, { y: -70, opacity: 0.15, ease: 'none' }, 0);
  tl.to(media, { scale: 0.93, borderRadius: 64, ease: 'none' }, 0);
}

/* ── how far down the page you are ───────────────────────── */
export function progress() {
  if (reduced) return;
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  const set = gsap.quickSetter(bar, 'scaleX');
  const update = (y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    set(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => update(scroll));
  else addEventListener('scroll', () => update(scrollY), { passive: true });
  update(0);
}

/* ── a cursor that names what it is over ──────────────────────
   A dot that trails the pointer, swells over anything you can
   press, and turns into a labelled pill over the things whose
   affordance is not obvious — the globe you can drag, the patch
   you can survey. The native cursor is left alone: taking it away
   costs more than this adds. */
export function cursor() {
  if (reduced || !matchMedia('(pointer: fine)').matches) return;
  const root = document.createElement('div');
  root.className = 'cursor';
  root.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('div');
  dot.className = 'cursor__dot';
  const label = document.createElement('span');
  label.className = 'cursor__label';
  dot.append(label); root.append(dot); document.body.append(root);

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const to = { ...pos };
  const setX = gsap.quickSetter(root, 'x', 'px');
  const setY = gsap.quickSetter(root, 'y', 'px');
  addEventListener('pointermove', (e) => { to.x = e.clientX; to.y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    pos.x += (to.x - pos.x) * 0.2;
    pos.y += (to.y - pos.y) * 0.2;
    setX(pos.x); setY(pos.y);
  });

  const NAMES = [
    ['.globe__canvas', 'drag'],
    ['.survey__canvas', 'survey'],
    ['.shot', 'open'],
    ['[data-cursor]', null],
  ];
  addEventListener('pointerover', (e) => {
    const t = e.target;
    let text = null, on = !!t.closest('a, button, input, summary, [role="button"]');
    for (const [sel, name] of NAMES) {
      const hit = t.closest(sel);
      if (hit) { text = hit.dataset?.cursor || name; on = true; break; }
    }
    root.classList.toggle('is-on', on && !text);
    root.classList.toggle('is-label', !!text);
    label.textContent = text || '';
  }, { passive: true });
}

/* ── lists and cards arrive in sequence ──────────────────── */
export function batchIn(rootEl = document) {
  if (reduced) return;
  const sets = ['.card', '.steps li', '.ticks li', '.survey__hud > div', '.caveats .stat', '.legend li'];
  sets.forEach((sel) => {
    const items = [...rootEl.querySelectorAll(sel)].filter((el) => !el.hasAttribute('data-anim'));
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 26 });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out', overwrite: true }),
      once: true,
    });
  });
}

/* ── cards lean toward the pointer ───────────────────────── */
export function tilt(rootEl = document) {
  if (reduced || matchMedia('(hover: none)').matches) return;
  rootEl.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = +(el.dataset.tilt || 5);
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      rx((0.5 - (e.clientY - r.top) / r.height) * max * 2);
      ry(((e.clientX - r.left) / r.width - 0.5) * max * 2);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ── leaving a page ───────────────────────────────────────────
   The paper slides up over the page and the next one opens under
   its own paper wipe, so a navigation reads as one movement
   across two documents. Anything the browser should handle on its
   own — new tabs, modified clicks, downloads, in-page anchors —
   is left alone. */
export function exitTransition() {
  if (reduced) return;
  const veil = document.createElement('div');
  veil.className = 'leave';
  veil.setAttribute('aria-hidden', 'true');
  document.body.append(veil);

  addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;   // same page, anchor
    e.preventDefault();
    gsap.to(veil, {
      yPercent: -100, duration: 0.6, ease: 'expo.inOut',
      onComplete: () => { location.href = url.href; },
    });
  });

  // a page restored from the back/forward cache still has the veil up
  addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(veil, { yPercent: 100 }); });
}

/* ── the mark at the foot of the page ─────────────────────────
   A last, large statement of the name, wiped up out of its own
   line as the footer arrives and drifting slightly as you finish
   scrolling — the counterweight to the ghost in the hero. */
export function footMark() {
  const mark = document.querySelector('.foot-mark');
  if (!mark || reduced) return;
  gsap.fromTo(mark,
    { yPercent: 24, opacity: 0 },
    {
      yPercent: 0, opacity: 1, duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: mark, start: 'top 96%', once: true },
    });
  gsap.to(mark, {
    yPercent: -8, ease: 'none',
    scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom bottom', scrub: 0.5 },
  });
}

/* ── boot everything a page shares ───────────────────────── */
export function boot() {
  initScroll();
  heroIn();
  heroScroll();
  mediaReveals();
  stickyHeader();
  reveals();
  parallax();
  magnetic();
  counters();
  marquee();
  progress();
  cursor();
  batchIn();
  tilt();
  exitTransition();
  footMark();
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
    // The explorer puts a GBIF key in the hash (#5133088), which is a valid
    // fragment and an invalid CSS selector — querySelector throws on it and
    // takes the rest of this handler with it.
    let target = null;
    try {
      if (/^#[A-Za-z][\w-]*$/.test(location.hash)) target = document.querySelector(location.hash);
    } catch { target = null; }
    if (target) requestAnimationFrame(() => target.scrollIntoView());
  });
}
