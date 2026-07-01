/* ══════════════════════════════════════════════════════════
   Pulling back from the Amazon

   The section is one continuous zoom out, from close enough to
   see individual crowns to far enough to see the basin from
   orbit. It is drawn as three scenes, each painted once into an
   offscreen canvas and then composited with a scale and a fade:
   the canopy from directly above, the forest and its river, and
   the Earth itself.

   Each scene starts larger than the frame — you are inside it —
   shrinks through the frame as you scroll, and hands over to the
   next one, which covers a span roughly eight times wider. That
   overlap is what makes a handful of bitmaps read as one
   uninterrupted pull-back.
   ══════════════════════════════════════════════════════════ */

import { geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import { gsap } from 'gsap';
import { reduced } from './motion.js';

const WORLD = feature(land110, land110.objects.land);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* how visible a scene is, and how big, at a given scroll position */
const ramp = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));

/* ── 1. the canopy, from directly above ────────────────────────
   Crowns of a few species' worth of greens, packed the way closed
   canopy packs: no ground visible, only the shadow between one
   crown and the next, with a few emergents standing over them. */
function paintCanopy(c, w, h) {
  c.fillStyle = '#0b1f12';
  c.fillRect(0, 0, w, h);

  const GREENS = ['#2c6b39', '#357a41', '#40894a', '#4f9a55', '#245c34', '#5aa860', '#6cb45f', '#1d4b2a'];

  /* A crown is not a sphere. Drawn from above it is a few dozen clumps of
     leaves around a centre, lighter where the sun reaches them and dropping
     into shadow at the edge — so each one is built out of little leaf blobs
     rather than filled with a smooth gradient, which is what made the first
     version look like a bag of balloons. */
  const crown = (x, y, R, base, lift) => {
    const clumps = Math.round(R * 1.5);
    for (let i = 0; i < clumps; i++) {
      const a = rand(0, Math.PI * 2);
      const d = R * Math.sqrt(Math.random());
      const lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d;
      // lit toward the upper left, dark toward the rim
      const shade = (1 - d / R) * 0.55 + (Math.cos(a + 2.4) * 0.5 + 0.5) * 0.45;
      c.globalAlpha = 0.5 + shade * 0.5;
      c.fillStyle = shade > 0.62 ? lift : base;
      c.save();
      c.translate(lx, ly); c.rotate(a * 0.6);
      c.beginPath(); c.ellipse(0, 0, rand(2.4, R * 0.2), rand(1.8, R * 0.14), 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    // the shadow gap that separates one crown from the next
    c.globalAlpha = 0.5;
    c.strokeStyle = 'rgba(5, 18, 10, 0.85)'; c.lineWidth = rand(1.5, 3.5);
    c.beginPath(); c.arc(x, y, R * 0.98, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  };

  for (let i = 0; i < 900; i++) {
    const R = rand(11, 34);
    crown(rand(-30, w + 30), rand(-30, h + 30), R, pick(GREENS), pick(['#7cbe72', '#8ecb79', '#a3d98a']));
  }
  // emergents: the trees that stand clear of the rest, casting a shadow
  for (let i = 0; i < 30; i++) {
    const x = rand(0, w), y = rand(0, h), R = rand(34, 58);
    c.globalAlpha = 0.45; c.fillStyle = '#04140a';
    c.beginPath(); c.ellipse(x + R * 0.3, y + R * 0.34, R * 1.05, R, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    crown(x, y, R, '#3f8b4a', '#a8dc8d');
  }
  // gaps where a tree has come down, and the light that gets in
  for (let i = 0; i < 9; i++) {
    const x = rand(0, w), y = rand(0, h), R = rand(24, 70);
    const g = c.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(6, 20, 12, 0.9)');
    g.addColorStop(1, 'rgba(6, 20, 12, 0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < 10; i++) {
    const x = rand(0, w), y = rand(0, h), R = rand(50, 170);
    const g = c.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(228, 242, 226, 0.16)');
    g.addColorStop(1, 'rgba(228, 242, 226, 0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
  }
}

/* ── 2. the forest, and the river through it ───────────────────
   Far enough back that a crown is a speck: the canopy becomes a
   texture and the water becomes the subject, which is what the
   basin looks like from a few kilometres up. */
function paintForest(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1b482a');
  g.addColorStop(0.55, '#22532f');
  g.addColorStop(1, '#173f25');
  c.fillStyle = g; c.fillRect(0, 0, w, h);

  /* Relief first: from a kilometre up the canopy is not flat green but a
     mottle of slopes, older and younger growth, and shadowed valleys. Broad
     soft patches do that far more convincingly than fine noise. */
  for (let i = 0; i < 150; i++) {
    const x = rand(0, w), y = rand(0, h), r = rand(w * 0.04, w * 0.16);
    const shade = pick(['#2b6236', '#1a4527', '#356e3d', '#143a21', '#3d7a44']);
    const mg = c.createRadialGradient(x, y, 0, x, y, r);
    mg.addColorStop(0, shade);
    mg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.globalAlpha = rand(0.25, 0.6);
    c.fillStyle = mg;
    c.save(); c.translate(x, y); c.scale(1, rand(0.5, 1)); c.rotate(rand(0, Math.PI));
    c.translate(-x, -y);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.globalAlpha = 1;

  // the canopy itself: crowns as clusters of specks, not an even stipple
  for (let i = 0; i < 1400; i++) {
    const cx = rand(0, w), cy = rand(0, h), spread = rand(6, 26);
    const tone = pick(['#2f6b3a', '#3b7f45', '#4a9152', '#1a4527', '#57a05c', '#66ad5f']);
    for (let k = 0; k < 14; k++) {
      c.globalAlpha = rand(0.1, 0.42);
      c.fillStyle = tone;
      c.beginPath();
      c.arc(cx + rand(-spread, spread), cy + rand(-spread, spread), rand(1.4, 4.2), 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalAlpha = 1;

  /* The river: narrow for its length, silt-pale against the forest, with
     sandbars in the channel and tributaries joining it from both sides. */
  const river = (x0, y0, x1, y1, width, wobble) => {
    const pts = [];
    const steps = 30;
    /* a channel meanders in proportion to its size: giving a thin tributary
       the same swing as the main river turned it into a zigzag */
    const swing = Math.min(h * 0.07, width * 2.6);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wob = Math.sin(t * Math.PI * rand(1.6, 2.6) + wobble) * swing
                + Math.sin(t * Math.PI * 5 + wobble) * swing * 0.16;
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + wob]);
    }
    const trace = () => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2;
        c.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
      }
    };
    c.lineCap = 'round'; c.lineJoin = 'round';
    trace(); c.strokeStyle = 'rgba(20, 46, 30, 0.55)'; c.lineWidth = width * 1.5; c.stroke();  // wet bank
    trace(); c.strokeStyle = '#6f8b84'; c.lineWidth = width; c.stroke();                        // water
    trace(); c.strokeStyle = 'rgba(198, 202, 176, 0.45)'; c.lineWidth = width * 0.35; c.stroke(); // silt
    return pts;
  };

  const main = river(-60, h * 0.62, w + 60, h * 0.4, h * 0.026, 0);
  // sandbars sitting in the channel
  for (let i = 4; i < main.length - 4; i += 3) {
    if (Math.random() < 0.45) continue;
    const [x, y] = main[i];
    c.globalAlpha = 0.75; c.fillStyle = '#c2c3a4';
    c.save(); c.translate(x, y); c.rotate(rand(-0.5, 0.5));
    c.beginPath(); c.ellipse(0, 0, rand(8, 26), rand(2, 5), 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 6; i++) {
    const anchor = main[Math.floor(rand(3, main.length - 3))];
    const up = Math.random() < 0.5 ? -1 : 1;
    river(anchor[0], anchor[1], anchor[0] + rand(-w * 0.45, w * 0.45),
      anchor[1] + up * h * rand(0.35, 0.8), h * rand(0.005, 0.012), rand(0, 6));
  }
  // oxbow lakes, cut off from the meander
  for (let i = 0; i < 6; i++) {
    const x = rand(0, w), y = rand(0, h);
    c.strokeStyle = 'rgba(111, 139, 132, 0.85)'; c.lineWidth = h * 0.008;
    c.beginPath(); c.arc(x, y, rand(14, 44), rand(0, 3), rand(3.6, 6)); c.stroke();
  }

  // low cloud, sitting on the canopy with its own shadow under it
  for (let i = 0; i < 18; i++) {
    const x = rand(0, w), y = rand(0, h), r = rand(w * 0.02, w * 0.075);
    c.globalAlpha = 0.22; c.fillStyle = '#0d2716';
    c.save(); c.translate(x + r * 0.3, y + r * 0.35); c.scale(1, 0.5); c.translate(-x, -y);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
    c.globalAlpha = 1;
    const cg = c.createRadialGradient(x, y, 0, x, y, r);
    cg.addColorStop(0, `rgba(246, 250, 246, ${rand(0.5, 0.85)})`);
    cg.addColorStop(1, 'rgba(246, 250, 246, 0)');
    c.fillStyle = cg;
    c.save(); c.translate(x, y); c.scale(1, rand(0.45, 0.7)); c.translate(-x, -y);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
  }
}

/* ── 3. the Earth, centred on the basin ───────────────────────
   Real coastlines, turned so that the Amazon is under you, drawn
   the way it looks from a few hundred kilometres up: the limb
   curving out of the frame with space above it. */
function paintPlanet(c, w, h) {
  c.fillStyle = '#05070e';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    c.globalAlpha = rand(0.25, 0.95);
    c.fillStyle = Math.random() < 0.1 ? '#cfe0ff' : '#ffffff';
    c.beginPath(); c.arc(rand(0, w), rand(0, h * 0.75), rand(0.4, 1.5), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;

  /* The sphere sits low and small enough that its limb curves through the
     upper third with space above it, and the projection's centre — the basin —
     stays in frame. Pushed any lower it fills the whole frame and you are
     looking at a patch of the Caribbean instead of at the Earth. */
  const R = h * 0.30;
  const cx = w / 2, cy = h * 0.62;
  const proj = geoOrthographic()
    .rotate([60, 5])                                    // the Amazon, under you
    .scale(R).translate([cx, cy]).clipAngle(90);
  const path = geoPath(proj, c);

  const sea = c.createRadialGradient(cx - R * 0.4, cy - R * 0.6, R * 0.1, cx, cy, R);
  sea.addColorStop(0, '#3f8cbe');
  sea.addColorStop(0.6, '#1d5a86');
  sea.addColorStop(1, '#0b3050');
  c.beginPath(); path({ type: 'Sphere' }); c.fillStyle = sea; c.fill();

  c.beginPath(); path(WORLD); c.fillStyle = '#2f6b3f'; c.fill();
  c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#dff0e4'; c.lineWidth = 1.2; c.stroke(); c.restore();

  // weather over the tropics, clipped to the planet
  c.save();
  c.beginPath(); path({ type: 'Sphere' }); c.clip();
  for (let i = 0; i < 90; i++) {
    const x = rand(cx - R, cx + R), y = rand(cy - R, cy + R), r = rand(R * 0.03, R * 0.13);
    const cg = c.createRadialGradient(x, y, 0, x, y, r);
    cg.addColorStop(0, `rgba(255, 255, 255, ${rand(0.3, 0.8)})`);
    cg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    c.fillStyle = cg;
    c.save(); c.translate(x, y); c.scale(1, rand(0.45, 0.75)); c.translate(-x, -y);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
  }
  // and the sphere falling into shadow at the edges
  const shade = c.createRadialGradient(cx - R * 0.35, cy - R * 0.5, R * 0.15, cx, cy, R);
  shade.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  shade.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
  shade.addColorStop(1, 'rgba(2, 14, 30, 0.6)');
  c.fillStyle = shade; c.fillRect(0, 0, w, h);
  c.restore();

  // atmosphere, on the limb
  const air = c.createRadialGradient(cx, cy, R * 0.985, cx, cy, R * 1.06);
  air.addColorStop(0, 'rgba(150, 205, 245, 0.65)');
  air.addColorStop(1, 'rgba(150, 205, 245, 0)');
  c.fillStyle = air; c.beginPath(); c.arc(cx, cy, R * 1.08, 0, Math.PI * 2); c.fill();
}

/* ── the composite ──────────────────────────────────────────── */
export function amazonZoom(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, sw = 0, sh = 0, dpr = 1;
  const scenes = [];

  /* Each scene is painted onto a bitmap twice the size of the frame. That
     spare margin is what lets a scene shrink to half its size and still cover
     the frame — without it, the edge of the bitmap slides into view as the
     camera pulls back and the whole illusion goes with it. */
  const OVER = 2;
  const MAX = 2400;

  /* what paints it, when it is on screen, how big at either end, and the
     point it pulls back from — the planet holds on the basin rather than the
     middle of the canvas, which is several thousand kilometres north of it */
  /* windows are in altitude, not scroll: 25 m at one end, 700 km at the other,
     read on a log scale so each scene owns a decade of height */
  const LO = Math.log10(25), HI = Math.log10(700000);
  const height = () => {
    const a = Math.max(1, state.alt || 25);
    return Math.max(0, Math.min(1, (Math.log10(a) - LO) / (HI - LO)));
  };
  const PLAN = [
    { paint: paintCanopy, from: 0.00, to: 0.34, big: 2.0, small: 0.52, focus: 0.5 },
    { paint: paintForest, from: 0.22, to: 0.74, big: 2.1, small: 0.52, focus: 0.5 },
    { paint: paintPlanet, from: 0.68, to: 1.00, big: 2.0, small: 0.52, focus: 0.62 },
  ];

  function bake() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // the scenes are drawn at 1:1 — they are textures, and softening one under
    // magnification costs far less than three retina-sized bitmaps
    sw = Math.min(Math.round(w * OVER), MAX);
    sh = Math.round(sw * (h / w));

    scenes.length = 0;
    for (const step of PLAN) {
      const off = document.createElement('canvas');
      off.width = sw; off.height = sh;
      const c = off.getContext('2d');
      step.paint(c, sw, sh);
      scenes.push(off);
    }
  }

  function frame() {
    if (!scenes.length || !w) return;
    const p = height();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = p < 0.78 ? '#0b1f12' : '#05070e';
    ctx.fillRect(0, 0, w, h);

    PLAN.forEach((step, i) => {
      if (p < step.from - 0.05 || p > step.to + 0.05) return;
      const t = Math.max(0, Math.min(1, (p - step.from) / (step.to - step.from)));
      const span = step.to - step.from;
      const fadeIn = Math.max(0, Math.min(1, (p - step.from) / (span * 0.22)));
      const fadeOut = i === PLAN.length - 1
        ? 1
        : 1 - Math.max(0, Math.min(1, (p - (step.to - span * 0.28)) / (span * 0.28)));
      const alpha = Math.min(fadeIn, fadeOut);
      if (alpha <= 0.01) return;

      // the frame's width, in scene pixels, at this moment
      const scale = (step.big + (step.small - step.big) * t) * (w / sw);
      const fx = w / 2, fy = h * step.focus;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(fx, fy);
      ctx.scale(scale, scale);
      ctx.drawImage(scenes[i], -sw * 0.5, -sh * step.focus, sw, sh);
      ctx.restore();
    });
  }

  bake();
  frame();
  if (!reduced) gsap.ticker.add(frame);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { bake(); frame(); }, 200); });
}
