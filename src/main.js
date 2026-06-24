import { gsap } from 'gsap';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Entrance reveal ─────────────────────────── */
function reveal() {
  if (reduceMotion) return;
  document.documentElement.classList.add('js'); // hide reveal items now that we'll animate them
  const items = gsap.utils.toArray('[data-reveal]');
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.35,
  });
}

/* ── Mouse / device parallax on the background ── */
function parallax() {
  if (reduceMotion) return;
  const layer = document.querySelector('.bg__image');
  if (!layer) return;

  const move = (px, py) => {
    gsap.to(layer, {
      x: px * 26,
      y: py * 18,
      duration: 1.2,
      ease: 'power2.out',
    });
  };

  window.addEventListener('pointermove', (e) => {
    move((e.clientX / window.innerWidth - 0.5) * -1, (e.clientY / window.innerHeight - 0.5) * -1);
  });
}

/* ── Canvas rain (matches the scene) ─────────── */
function rain() {
  const canvas = document.querySelector('.bg__rain');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h, drops, raf;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function size() {
    w = canvas.width = innerWidth * DPR;
    h = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const count = Math.floor((innerWidth * innerHeight) / 9000);
    drops = Array.from({ length: count }, () => spawn());
  }

  function spawn() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      len: (8 + Math.random() * 16) * DPR,
      vy: (6 + Math.random() * 7) * DPR,
      a: 0.06 + Math.random() * 0.18,
    };
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.strokeStyle = `rgba(200, 220, 230, ${d.a})`;
      ctx.lineWidth = DPR * 0.8;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - DPR, d.y + d.len);
      ctx.stroke();
      d.y += d.vy;
      d.x -= DPR * 0.4;
      if (d.y > h) { d.y = -d.len; d.x = Math.random() * w; }
    }
    raf = requestAnimationFrame(frame);
  }

  size();
  addEventListener('resize', size);
  frame();

  // pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else frame();
  });
}

/* ── Typewriter 'about' line ──────────────────── */
function typewriter() {
  const el = document.querySelector('[data-typewriter]');
  if (!el) return;
  const full = el.textContent.trim();

  if (reduceMotion) { el.textContent = full; return; }

  el.textContent = '';
  el.classList.add('is-typing');

  let i = 0;
  const base = 16; // ms per character

  const tick = () => {
    el.textContent = full.slice(0, i);
    i += 1;
    if (i <= full.length) {
      const prev = full[i - 2];
      const pause = /[.,—]/.test(prev) ? 180 : base + Math.random() * 24;
      setTimeout(tick, pause);
    } else {
      // keep caret blinking a moment, then settle
      setTimeout(() => el.classList.remove('is-typing'), 2600);
    }
  };

  setTimeout(tick, 1500); // start after the entrance reveal
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
  const btn = form?.querySelector('.capture__btn span');
  const btnEl = form?.querySelector('.capture__btn');
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
      note.textContent = 'Hmm — that email doesn’t look right.';
      gsap.fromTo(field, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      input.focus();
      return;
    }

    // sending state
    sending = true;
    if (btnEl) btnEl.disabled = true;
    if (btn) btn.textContent = 'Sending…';

    try {
      await sendToGoogleForm(v);
    } catch (_) {
      // network failed — let them retry
      sending = false;
      if (btnEl) btnEl.disabled = false;
      if (btn) btn.textContent = 'Notify me';
      note.textContent = 'Something went wrong — please try again.';
      return;
    }

    // success — the field stays fully editable
    sending = false;
    done = true;
    if (btnEl) btnEl.disabled = false;
    form.classList.add('is-done');
    if (btn) btn.textContent = 'Added ✓';
    note.textContent = 'You’re on the list. We’ll be in touch.';
    gsap.fromTo(field, { scale: 1 }, { scale: 1.015, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });

    try { localStorage.setItem('vanyax:email', v); } catch (_) {}
  });

  // editing after submit (or after an error) resets the UI back to default
  input.addEventListener('input', () => {
    if (done) {
      done = false;
      form.classList.remove('is-done');
      if (btn) btn.textContent = 'Notify me';
    }
    if (note.textContent !== defaultNote) note.textContent = defaultNote;
  });
}

/* ── boot ────────────────────────────────────── */
reveal();
parallax();
rain();
typewriter();
capture();
