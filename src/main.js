import { gsap } from 'gsap';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Entrance reveal ─────────────────────────── */
function reveal() {
  if (reduceMotion) return;
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

/* ── Email capture ───────────────────────────── */
function capture() {
  const form = document.getElementById('capture');
  const input = document.getElementById('email');
  const note = document.getElementById('note');
  const btn = form?.querySelector('.capture__btn span');
  if (!form) return;

  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;

    if (!valid(v)) {
      note.textContent = 'Hmm — that email doesn’t look right.';
      gsap.fromTo(form.querySelector('.capture__field'),
        { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      input.focus();
      return;
    }

    // success
    form.classList.add('is-done');
    btn && (btn.textContent = 'Added ✓');
    form.querySelector('.capture__btn').disabled = true;
    input.disabled = true;
    note.textContent = 'You’re on the list. We’ll be in touch.';

    gsap.fromTo(form.querySelector('.capture__field'),
      { scale: 1 }, { scale: 1.015, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });

    // persist locally so refresh keeps the confirmed state
    try { localStorage.setItem('vanyax:email', v.trim()); } catch (_) {}
  });
}

/* ── boot ────────────────────────────────────── */
reveal();
parallax();
rain();
capture();
