/* ══════════════════════════════════════════════════════════
   Accordions

   One component for both lists on the page — what we do, and the
   questions. The markup is a heading holding a button, and a
   region; it ships open, and this file closes it on load, so a
   visitor without JS simply sees every answer.
   ══════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';

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
      btn.addEventListener('click', () => setOpen(item, btn.getAttribute('aria-expanded') !== 'true'));
    });
  });
}
