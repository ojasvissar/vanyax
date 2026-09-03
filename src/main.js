import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import occurrenceSvg from './assets/occurrence.svg?raw';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Hero plot ────────────────────────────────
   Inlined rather than <img> so the records can be
   drawn in one by one — the plot fills the way a
   survey does.                                     */
function plot() {
  const host = document.getElementById('plot');
  if (!host) return;
  host.innerHTML = occurrenceSvg;
  if (reduceMotion) return;

  const dots = host.querySelectorAll('.plot__points circle');
  gsap.from(dots, {
    opacity: 0,
    scale: 0.4,
    transformOrigin: 'center',
    duration: 0.5,
    ease: 'power2.out',
    stagger: { each: 0.0035, from: 'random' },
    delay: 0.25,
  });
  gsap.from(host.querySelectorAll('.plot__transect, .plot__tick, .plot__ring'), {
    opacity: 0,
    duration: 0.9,
    ease: 'power2.out',
    delay: 1.1,
  });
}

/* ── Reveals ──────────────────────────────────
   Hidden from JS, never from CSS, so a blocked or
   broken script can't leave a blank page.          */
function reveals() {
  if (reduceMotion) return;
  const all = gsap.utils.toArray('[data-reveal]');
  if (!all.length) return;
  gsap.set(all, { opacity: 0, y: 16 });

  const first = all.filter((el) => el.getBoundingClientRect().top < window.innerHeight);
  gsap.to(first, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.07, delay: 0.1 });

  all.forEach((el) => {
    if (first.includes(el)) return;
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
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
  if (!form) return;
  const input = document.getElementById('email');
  const note = document.getElementById('note');
  const btnEl = form.querySelector('.capture__btn');
  const btn = btnEl?.querySelector('span');

  const defaultNote = note.textContent;
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  let done = false;
  let sending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || done) return;
    const v = input.value.trim();

    if (!valid(v)) {
      note.textContent = 'That address doesn’t look right — check it?';
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
      if (btn) btn.textContent = 'Send';
      note.textContent = 'Something went wrong — please try again, or email us directly.';
      return;
    }

    sending = false;
    done = true;
    btnEl.disabled = false;
    form.classList.add('is-done');
    if (btn) btn.textContent = 'Sent';
    note.textContent = 'Got it. We’ll write back.';

    try { localStorage.setItem('vanyax:email', v); } catch (_) {}
  });

  input.addEventListener('input', () => {
    if (done) {
      done = false;
      form.classList.remove('is-done');
      if (btn) btn.textContent = 'Send';
    }
    if (note.textContent !== defaultNote) note.textContent = defaultNote;
  });
}

/* ── boot ────────────────────────────────────── */
plot();
reveals();
capture();
