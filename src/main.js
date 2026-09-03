import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Reveals ─────────────────────────────────
   Masthead items animate on load; everything below
   the fold waits for its section to scroll in.      */
function reveals() {
  if (reduceMotion) return;
  document.documentElement.classList.add('js');

  const above = gsap.utils.toArray('.masthead [data-reveal]');
  gsap.to(above, {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.25,
  });

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (above.includes(el)) return;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ── Layered paper drift ─────────────────────
   Each document in the dossier stack carries a
   data-layer weight; the stack answers the pointer
   and the scroll position with different amounts.   */
function stack() {
  const scene = document.querySelector('[data-parallax-scene]');
  if (!scene || reduceMotion) return;

  const layers = gsap.utils.toArray('[data-layer]', scene);
  const setters = layers.map((el) => ({
    el,
    weight: parseFloat(el.dataset.layer) || 1,
    x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
  }));

  window.addEventListener('pointermove', (e) => {
    const px = e.clientX / window.innerWidth - 0.5;
    const py = e.clientY / window.innerHeight - 0.5;
    for (const l of setters) {
      l.x(px * 14 * l.weight);
      l.y(py * 10 * l.weight);
    }
  });

  // slow vertical spread as the block passes through the viewport
  layers.forEach((el) => {
    const weight = parseFloat(el.dataset.layer) || 1;
    gsap.fromTo(
      el,
      { yPercent: 2.5 * weight },
      {
        yPercent: -2.5 * weight,
        ease: 'none',
        scrollTrigger: { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      }
    );
  });
}

/* ── Ledger rows rule in one at a time ───────── */
function ledger() {
  if (reduceMotion) return;
  const rows = gsap.utils.toArray('[data-row]');
  if (!rows.length) return;
  gsap.from(rows, {
    opacity: 0,
    y: 14,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.07,
    scrollTrigger: { trigger: rows[0].parentElement, start: 'top 85%', once: true },
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
  formId: 'REPLACE_WITH_FORM_ID',          // the /d/e/<THIS>/ part of the URL
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

    // sending state
    sending = true;
    btnEl.disabled = true;
    if (btn) btn.textContent = 'Filing…';

    try {
      await sendToGoogleForm(v);
    } catch (_) {
      // network failed — let them retry
      sending = false;
      btnEl.disabled = false;
      if (btn) btn.textContent = 'File it';
      note.textContent = 'Something went wrong — please try again.';
      return;
    }

    // success — the field stays fully editable
    sending = false;
    done = true;
    btnEl.disabled = false;
    form.classList.add('is-done');
    if (btn) btn.textContent = 'Filed ✓';
    note.textContent = 'Entered into the record. We’ll be in touch.';
    gsap.fromTo(field, { scale: 1 }, { scale: 1.012, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });

    try { localStorage.setItem('vanyax:email', v); } catch (_) {}
  });

  // editing after submit (or after an error) resets the UI back to default
  input.addEventListener('input', () => {
    if (done) {
      done = false;
      form.classList.remove('is-done');
      if (btn) btn.textContent = 'File it';
    }
    if (note.textContent !== defaultNote) note.textContent = defaultNote;
  });
}

/* ── boot ────────────────────────────────────── */
reveals();
stack();
ledger();
capture();
