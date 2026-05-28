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

/* ── header hides going down, returns coming up ──────────── */
export function stickyHeader() {
  const head = document.querySelector('.site-head');
  if (!head) return;
  /* Over the black hero the header is just type on the page; past it, it
     becomes a strip of black with a scalloped edge, so the links stay
     readable over paper and colour. It hides going down and returns going up. */
  let last = 0;
  const onScroll = (y) => {
    head.classList.toggle('is-solid', y > innerHeight * 0.6);
    if (y > last + 6 && y > 300) head.classList.add('is-hidden');
    else if (y < last - 6 || y < 200) head.classList.remove('is-hidden');
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);
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
  const hero = document.querySelector('.hero');
  if (!hero || reduced) return;
  /* The badges are pressed onto the board one after another, the banner
     swings up under them, and its two pines grow out of the ground. */
  const tl = gsap.timeline({ delay: 0.35 });
  // fromTo with explicit end values: a plain from() read its end state back
  // off the element and settled on the start pose, so the badges stayed tilted
  tl.fromTo(hero.querySelectorAll('.hero__badge'),
    { scale: 0.6, rotation: (i) => (i ? 6 : -6), opacity: 0 },
    { scale: 1, rotation: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.12, clearProps: 'transform' }, 0.2)
    .from(hero.querySelectorAll('.badge-art .tree'), { scaleY: 0, duration: 1.1, ease: 'back.out(1.4)', stagger: 0.12 }, 0.45)
    .from(hero.querySelector('.banner__art'), { yPercent: 30, rotation: -2, opacity: 0, duration: 1.1, ease: 'expo.out' }, 0.5)
    .from(hero.querySelectorAll('.banner__tree'), { scaleY: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.1 }, 0.85);
}

/* ══════════════════════════════════════════════════════════
   THE REST OF THE MOTION

   Everything below is scroll- or pointer-driven decoration. Each
   piece checks `reduced` first and builds its own markup where it
   needs any, so the HTML carries no empty divs for effects that
   may never run.
   ══════════════════════════════════════════════════════════ */

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

/* ── boot everything a page shares ───────────────────────── */
export function boot() {
  initScroll();
  heroIn();
  stickyHeader();
  reveals();
  magnetic();
  progress();
  exitTransition();
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

/* ── the nav knows where you are ──────────────────────────────
   Whichever section owns the middle of the screen marks its link
   as current, so the header doubles as a map of a short page. */
export function sectionNav() {
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  if (!links.length) return;
  const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === `#${e.target.id}`));
      links.forEach((a) => { if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'location'); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach((t) => io.observe(t));
}

/* ── depth: layers drift at their own rate ────────────────────
   data-depth sets how far an element moves across its section's
   scroll. Negative values move down, so in the hero the clouds and
   far hills lag behind the page — distance, as seen from a moving
   window. The hero measures from the top of the page, so at rest
   every layer sits exactly where it was drawn. */
export function depth(root = document) {
  if (reduced) return;
  root.querySelectorAll('[data-depth]').forEach((el) => {
    const d = Number(el.dataset.depth) || 0;
    const hero = el.closest('.hero');
    gsap.to(el, {
      y: () => -d * Math.min(220, innerHeight * 0.26), ease: 'none',
      scrollTrigger: hero
        ? { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
        : { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
    });
  });
}

/* ── rise: things that arrive in a row arrive one after another ── */
export function rise(root = document) {
  const items = [...root.querySelectorAll('[data-rise]')].filter((el) => !el.closest('.hero'));
  if (!items.length || reduced) return;
  gsap.set(items, { opacity: 0, y: 30 });
  ScrollTrigger.batch(items, {
    start: 'top 90%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }),
  });
}
