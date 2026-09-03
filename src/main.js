import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import sceneSvg from './assets/forest.svg?raw';
import badgeSprite from './assets/badges.svg?raw';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Inline the vector art ────────────────────
   Both files ship as markup so the forest can be
   parallaxed layer by layer and the badges can be
   referenced with <use>.                            */
function inlineArt() {
  document.getElementById('sprite').innerHTML = badgeSprite;
  const scene = document.getElementById('scene');
  if (scene) scene.innerHTML = sceneSvg;
}

/* ── Reveals ─────────────────────────────────── */
function reveals() {
  if (reduceMotion) return;
  const all = gsap.utils.toArray('[data-reveal]');
  gsap.set(all, { opacity: 0, y: 20 });

  const hero = gsap.utils.toArray('.hero [data-reveal]');
  gsap.to(hero, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.15 });

  all.forEach((el) => {
    if (hero.includes(el)) return;
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ── Hero forest: depth parallax ──────────────
   Every layer in the illustration carries a depth;
   the pointer nudges it and the scroll pushes it,
   both scaled by that depth.                        */
function forestDepth() {
  const layers = gsap.utils.toArray('#scene [data-scene-layer]');
  if (!layers.length || reduceMotion) return;

  const tuned = layers.map((el) => ({
    depth: parseFloat(el.dataset.depth) || 0.3,
    x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
  }));

  window.addEventListener('pointermove', (e) => {
    const px = e.clientX / window.innerWidth - 0.5;
    for (const l of tuned) l.x(px * -44 * l.depth);
  });

  layers.forEach((el) => {
    const depth = parseFloat(el.dataset.depth) || 0.3;
    gsap.to(el, {
      yPercent: -6 * depth,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  });
}

/* ── Ticker ───────────────────────────────────
   Duplicated once so the loop has something to
   slide in behind the original.                    */
function ticker() {
  const track = document.getElementById('ticker');
  if (!track) return;
  track.innerHTML += track.innerHTML;
  if (reduceMotion) return;
  gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
}

/* ── Badges: slow float, and rotation on scroll ── */
function badges() {
  const list = gsap.utils.toArray('.badge');
  if (!list.length || reduceMotion) return;

  list.forEach((el, i) => {
    const weight = parseFloat(el.dataset.float) || 1;
    gsap.to(el, {
      y: -14 * weight,
      duration: 2.6 + i * 0.3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.2,
    });
    gsap.to(el, {
      rotate: (i % 2 ? -1 : 1) * 26 * weight,
      ease: 'none',
      scrollTrigger: { trigger: '.mission', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    });
  });
}

/* ── Spectrogram ──────────────────────────────
   A night of audio: quiet background, two calls the
   classifier caught, one it could not name.        */
function spectrogram() {
  const host = document.getElementById('spectro');
  if (!host) return;

  const COLS = 64;
  const calls = [
    { at: 14, width: 7, gain: 0.95, hue: 'var(--neon)' },
    { at: 38, width: 6, gain: 0.82, hue: 'var(--gold)' },
    { at: 53, width: 3, gain: 0.55, hue: 'var(--coral)' },
  ];

  // deterministic noise so the panel looks the same on every load
  let seed = 20260902;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  const bars = [];
  for (let i = 0; i < COLS; i++) {
    let v = 0.10 + rand() * 0.16;
    let colour = 'rgba(246, 239, 228, 0.22)';
    for (const c of calls) {
      const d = Math.abs(i - c.at);
      if (d <= c.width) {
        const fall = 1 - d / (c.width + 1);
        const lift = c.gain * fall * fall;
        if (lift > v) { v = lift + rand() * 0.08; colour = c.hue; }
      }
    }
    bars.push(`<i style="height:${(v * 100).toFixed(1)}%;background:${colour}"></i>`);
  }
  host.innerHTML = bars.join('');

  if (reduceMotion) return;
  gsap.from(host.children, {
    scaleY: 0,
    transformOrigin: 'bottom',
    duration: 0.7,
    ease: 'power2.out',
    stagger: { each: 0.012, from: 'start' },
    scrollTrigger: { trigger: host, start: 'top 85%', once: true },
  });
}

/* ── Interaction network ──────────────────────
   Hand-placed so it reads as an ecosystem rather
   than a hairball; the keystone node is the one
   everything else hangs off.                       */
function graph() {
  const svg = document.getElementById('graph');
  if (!svg) return;

  const nodes = [
    { id: 'keystone', x: 258, y: 150, r: 26, fill: 'var(--neon)', label: 'Fig tree' },
    { id: 'a', x: 116, y: 74,  r: 13, fill: 'var(--sky)',   label: 'Toucan' },
    { id: 'b', x: 92,  y: 176, r: 11, fill: 'var(--cream)' },
    { id: 'c', x: 160, y: 246, r: 14, fill: 'var(--gold)',  label: 'Peccary' },
    { id: 'd', x: 300, y: 44,  r: 12, fill: 'var(--cream)' },
    { id: 'e', x: 396, y: 96,  r: 16, fill: 'var(--coral)', label: 'Fig wasp' },
    { id: 'f', x: 432, y: 200, r: 12, fill: 'var(--sky)' },
    { id: 'g', x: 342, y: 258, r: 14, fill: 'var(--cream)', label: 'Agouti' },
    { id: 'h', x: 210, y: 62,  r: 9,  fill: 'var(--cream)' },
    { id: 'i', x: 486, y: 148, r: 9,  fill: 'var(--cream)' },
    { id: 'j', x: 44,  y: 116, r: 9,  fill: 'var(--cream)' },
    { id: 'k', x: 250, y: 286, r: 9,  fill: 'var(--cream)' },
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = [
    ['keystone', 'a', 1], ['keystone', 'c', 1], ['keystone', 'e', 1], ['keystone', 'g', 1],
    ['keystone', 'd', 1], ['keystone', 'b', 1],
    ['a', 'h', 0], ['a', 'j', 0], ['b', 'j', 0], ['c', 'k', 0], ['g', 'k', 0],
    ['e', 'i', 0], ['e', 'd', 0], ['f', 'i', 0], ['f', 'g', 0], ['e', 'f', 0],
  ];

  const parts = edges.map(([s, t, hot]) => {
    const a = byId[s], b = byId[t];
    return `<line class="graph__edge${hot ? ' graph__edge--hot' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  });
  for (const n of nodes) {
    parts.push(`<circle class="graph__node" cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.fill}"/>`);
    if (n.label) parts.push(`<text class="graph__label" x="${n.x + n.r + 7}" y="${n.y + 4}">${n.label}</text>`);
  }
  svg.innerHTML = parts.join('');

  if (reduceMotion) return;
  gsap.from(svg.querySelectorAll('.graph__node'), {
    scale: 0, transformOrigin: 'center', duration: 0.6, ease: 'back.out(2)',
    stagger: 0.05,
    scrollTrigger: { trigger: svg, start: 'top 85%', once: true },
  });
  gsap.to(svg.querySelector('.graph__node'), {
    scale: 1.08, transformOrigin: 'center', duration: 1.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
  });
}

/* ── Counters ─────────────────────────────────── */
function counters() {
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const write = (v) => {
      el.textContent = v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;
    };
    if (reduceMotion) { write(target); return; }
    const state = { v: 0 };
    gsap.to(state, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: () => write(state.v),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/* ── Google Form destination ──────────────────────
   Submissions are POSTed to a Google Form, which collects them in its
   linked Google Sheet (Responses tab). To configure:
     1. Make a Google Form with one short-answer "Email" question.
     2. ⋮ menu → "Get pre-filled link", type test@test.com, copy the link.
        It looks like:
        .../forms/d/e/FORM_ID/viewform?...&entry.1234567890=test@test.com
     3. Paste FORM_ID and the entry.NNNN number below.
   Until both are filled in, the form still confirms locally (no network). */
const GOOGLE_FORM = {
  formId: 'REPLACE_WITH_FORM_ID',            // the /d/e/<THIS>/ part of the URL
  emailEntry: 'entry.REPLACE_WITH_FIELD_ID', // e.g. 'entry.1234567890'
};

function isFormConfigured() {
  return !GOOGLE_FORM.formId.includes('REPLACE') && !GOOGLE_FORM.emailEntry.includes('REPLACE');
}

async function sendToGoogleForm(email) {
  if (!isFormConfigured()) return; // not wired up yet — local-only
  const url = `https://docs.google.com/forms/d/e/${GOOGLE_FORM.formId}/formResponse`;
  const body = new URLSearchParams();
  body.append(GOOGLE_FORM.emailEntry, email);
  // Google Forms doesn't send CORS headers; no-cors lets the POST record
  // the response even though we can't read the (opaque) reply.
  await fetch(url, { method: 'POST', mode: 'no-cors', body });
}

/* ── Email capture ───────────────────────────── */
function capture() {
  const form = document.getElementById('capture');
  const input = document.getElementById('email');
  const note = document.getElementById('note');
  const btnEl = form?.querySelector('.capture__btn');
  const btn = btnEl?.querySelector('span');
  if (!form) return;

  const field = form.querySelector('.capture__field');
  const defaultNote = note.textContent;
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  let done = false;
  let sending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || done) return;
    const v = input.value.trim();

    if (!valid(v)) {
      note.textContent = 'Hmm — that address doesn’t look right.';
      gsap.fromTo(field, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      input.focus();
      return;
    }

    sending = true;
    btnEl.disabled = true;
    if (btn) btn.textContent = 'Sending…';

    try {
      await sendToGoogleForm(v);
    } catch (_) {
      sending = false;
      btnEl.disabled = false;
      if (btn) btn.textContent = 'Send it';
      note.textContent = 'Something went wrong — please try again.';
      return;
    }

    sending = false;
    done = true;
    btnEl.disabled = false;
    form.classList.add('is-done');
    if (btn) btn.textContent = 'Sent ✓';
    note.textContent = 'You’re on the list. We’ll be in touch.';
    gsap.fromTo(field, { scale: 1 }, { scale: 1.015, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });

    try { localStorage.setItem('vanyax:email', v); } catch (_) {}
  });

  input.addEventListener('input', () => {
    if (done) {
      done = false;
      form.classList.remove('is-done');
      if (btn) btn.textContent = 'Send it';
    }
    if (note.textContent !== defaultNote) note.textContent = defaultNote;
  });
}

/* ── boot ────────────────────────────────────── */
inlineArt();
reveals();
forestDepth();
ticker();
badges();
spectrogram();
graph();
counters();
capture();
