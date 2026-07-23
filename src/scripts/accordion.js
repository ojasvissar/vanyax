/* ══════════════════════════════════════════════════════════
   Accordions

   One component for both lists on the page — what we do, and the
   questions. The markup is a heading holding a button, and a
   region; it ships open, and this file closes it on load, so a
   visitor without JS simply sees every answer.
   ══════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setOpen(item, open, instant = false) {
  const btn = item.querySelector('.acc__btn');
  const panel = item.querySelector('.acc__panel');
  if (!btn || !panel) return;
  btn.setAttribute('aria-expanded', String(open));
  item.classList.toggle('is-open', open);
  gsap.killTweensOf(panel);

  if (instant || reduced) {
    panel.hidden = !open;
    gsap.set(panel, { clearProps: 'height,opacity' });
    return;
  }
  if (open) {
    panel.hidden = false;
    gsap.fromTo(panel, { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.6, ease: 'expo.out', clearProps: 'height' });
  } else {
    gsap.to(panel, {
      height: 0, opacity: 0, duration: 0.38, ease: 'power3.inOut',
      onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity' }); },
    });
  }
}

export function accordions(root = document) {
  root.querySelectorAll('[data-accordion]').forEach((acc) => {
    const items = [...acc.querySelectorAll('.acc__item')];
    items.forEach((item) => {
      setOpen(item, false, true);
      const btn = item.querySelector('.acc__btn');
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        // a single-open list closes the rest, so the page never becomes the
        // wall of text the accordion was there to avoid
        if (open && acc.dataset.accordion === 'single') {
          items.forEach((other) => other !== item && other.classList.contains('is-open') && setOpen(other, false));
        }
        setOpen(item, open);
      });
    });

    // the arrow keys move between rows, Home and End to either end — the
    // pattern a screen-reader user expects of a list of disclosure headings
    const buttons = items.map((i) => i.querySelector('.acc__btn'));
    acc.addEventListener('keydown', (e) => {
      const i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      buttons[(to + buttons.length) % buttons.length].focus();
    });
  });
}

/* ── the rows arrive one after another ────────────────────────
   Each strip of colour slides in from the spine, the way you would
   lay coloured paper down one sheet at a time. */
export function rowsIn(root = document) {
  if (reduced) return;
  root.querySelectorAll('[data-accordion]').forEach((acc) => {
    const items = acc.querySelectorAll('.acc__item');
    gsap.from(items, {
      xPercent: -12, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09,
      scrollTrigger: { trigger: acc, start: 'top 82%', once: true },
    });
  });
}
