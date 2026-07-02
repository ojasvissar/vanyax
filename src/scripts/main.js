import { boot, intro, revealHeading, reduced } from './motion.js';
import { heroGlobe } from './globe.js';
import { survey } from './survey.js';
import { gsap } from 'gsap';

/* ── Google Form destination ──────────────────────────────
   Submissions POST to a Google Form, which collects them in its linked
   Sheet. To configure: make a Form with one short-answer Email question,
   ⋮ → "Get pre-filled link", and copy the two ids out of the URL.
   Until both are set the form confirms locally and sends nothing. */
const GOOGLE_FORM = {
  formId: 'REPLACE_WITH_FORM_ID',
  emailEntry: 'entry.REPLACE_WITH_FIELD_ID',
};
const configured = () => !GOOGLE_FORM.formId.includes('REPLACE') && !GOOGLE_FORM.emailEntry.includes('REPLACE');

async function send(email) {
  if (!configured()) return;
  const body = new URLSearchParams();
  body.append(GOOGLE_FORM.emailEntry, email);
  // Google Forms sends no CORS headers; no-cors still records the response
  await fetch(`https://docs.google.com/forms/d/e/${GOOGLE_FORM.formId}/formResponse`,
    { method: 'POST', mode: 'no-cors', body });
}

function capture() {
  const form = document.getElementById('capture');
  if (!form) return;
  const input = document.getElementById('email');
  const note = document.getElementById('note');
  const btn = form.querySelector('.capture__btn');
  const label = btn?.querySelector('span') ?? btn;
  const original = note.textContent;
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  let done = false, sending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending || done) return;
    const value = input.value.trim();
    if (!valid(value)) {
      note.textContent = 'That address doesn’t look right — check it?';
      input.focus();
      return;
    }
    sending = true; btn.disabled = true; label.textContent = 'Sending…';
    try {
      await send(value);
    } catch {
      sending = false; btn.disabled = false; label.textContent = 'Send';
      note.textContent = 'Something went wrong — try again, or email us directly.';
      return;
    }
    sending = false; done = true; btn.disabled = false;
    form.classList.add('is-done');
    label.textContent = 'Sent';
    note.textContent = 'Got it. We’ll write back.';
    if (!reduced) gsap.fromTo(form, { scale: 0.995 }, { scale: 1, duration: 0.5, ease: 'expo.out' });
  });

  input.addEventListener('input', () => {
    if (done) { done = false; form.classList.remove('is-done'); label.textContent = 'Send'; }
    if (note.textContent !== original) note.textContent = original;
  });
}

document.querySelectorAll('[data-globe]').forEach(heroGlobe);
survey(document.querySelector('[data-survey]'));
boot();
capture();

const h1 = document.querySelector('[data-reveal-hero]');
if (h1) revealHeading(h1, { delay: 0.5 });   // lands as the intro veil clears
intro();
