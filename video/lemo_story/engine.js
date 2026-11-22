// Mid-century Cartoon Engine for MECH-G Story Film
// Hand-drawn 1950s aesthetic: off-register color plates, breathing ink lines on twos, atomic starbursts, character rigs.

export const PAL = {
  paper: '#FAF5ED',
  paperD: '#EDE4D5',
  floor: '#E8DEC8',
  ink: '#2B2420',
  inkSoft: '#5A524D',
  white: '#FFFFFF',
  mascotPurple: '#7C3AED',
  mascotPurpleD: '#5B21B6',
  mascotCyan: '#06B6D4',
  mascotCyanD: '#0891B2',
  yellow: '#FBBF24',
  mustard: '#F59E0B',
  mustardD: '#D97706',
  coral: '#F43F5E',
  coralD: '#E11D48',
  green: '#10B981',
  greenD: '#059669',
  sky: '#38BDF8',
  skyD: '#0284C7',
  skin: '#FCD34D',
  overalls: '#3B82F6',
  overallsD: '#1D4ED8'
};

const TAU = Math.PI * 2;

// Pseudo-random deterministic hash
export function hash(n) {
  let h = (n * 374761393) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 0x27d4eb2d;
  return ((h ^ (h >> 15)) >>> 0) / 4294967296;
}

// Cel registration jitter on twos (12 fps)
export function celJitter(seed, t, amp = 2.5) {
  const step = Math.floor(t * 12);
  const dx = (hash(seed + step * 3) - 0.5) * amp * 2;
  const dy = (hash(seed + step * 7 + 1) - 0.5) * amp * 2;
  return [dx, dy];
}

// Basic easing
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function lerp(a, b, k) { return a + (b - a) * k; }
export function seg(t, t0, t1) { return clamp((t - t0) / (t1 - t0), 0, 1); }
export function easeOutBack(x, c1 = 1.70158) {
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
export function easeInOut(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// Draw a mid-century printed shape with off-register color plate and broken ink line
export function printShape(ctx, drawPathFn, opt = {}) {
  const seed = opt.seed || 1;
  const t = opt.t || 0;
  const fillCol = opt.fill || null;
  const lineCol = opt.lineCol || PAL.ink;
  const lineWidth = opt.lineWidth ?? 3.5;
  const off = opt.off || [3, 2];
  const jitterAmp = opt.jitter ?? 2.0;

  // 1. Off-register color fill plate
  if (fillCol) {
    const [jx, jy] = celJitter(seed, t, jitterAmp);
    ctx.save();
    ctx.translate(off[0] + jx, off[1] + jy);
    ctx.fillStyle = fillCol;
    ctx.beginPath();
    drawPathFn(ctx);
    ctx.fill();
    ctx.restore();
  }

  // 2. Charcoal ink line
  if (lineWidth > 0) {
    ctx.save();
    ctx.strokeStyle = lineCol;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    drawPathFn(ctx);
    ctx.stroke();
    ctx.restore();
  }
}

// 8-point or N-point atomic starburst
export function drawStar(ctx, cx, cy, r, opt = {}) {
  const n = opt.n || 8;
  const inner = opt.inner || 0.42;
  const fill = opt.fill || PAL.mustard;
  const rot = opt.rot || 0;
  const t = opt.t || 0;

  printShape(ctx, (c) => {
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n;
      const rad = i % 2 === 0 ? r : r * inner;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
  }, { fill, lineWidth: 2.5, t, seed: opt.seed || 12 });
}

// Four-finger cartoon glove (pointing, waving, or gripping)
export function drawGlove(ctx, x, y, angle, kind = 'wave', opt = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = opt.scale || 1.0;
  ctx.scale(s, s);

  printShape(ctx, (c) => {
    // Palm
    c.ellipse(0, 0, 22, 18, 0, 0, TAU);
    // Cuff
    c.rect(-20, 10, 40, 12);
  }, { fill: PAL.white, lineWidth: 3.5, t: opt.t || 0, seed: 101 });

  // Fingers based on gesture
  printShape(ctx, (c) => {
    if (kind === 'point') {
      // Extended index finger
      c.ellipse(26, -6, 20, 6, 0, 0, TAU);
      // Curled other fingers
      c.ellipse(10, 4, 10, 6, 0.2, 0, TAU);
      c.ellipse(8, 12, 9, 6, 0.3, 0, TAU);
      // Thumb
      c.ellipse(-8, -14, 12, 6, -0.6, 0, TAU);
    } else if (kind === 'grip') {
      // Closed gripping fist
      c.ellipse(12, -8, 11, 7, 0, 0, TAU);
      c.ellipse(14, 0, 11, 7, 0, 0, TAU);
      c.ellipse(12, 8, 11, 7, 0, 0, TAU);
      c.ellipse(-4, -12, 12, 7, -0.4, 0, TAU);
    } else {
      // Open friendly wave
      c.ellipse(20, -18, 16, 6, -0.6, 0, TAU);
      c.ellipse(28, -6, 17, 6, -0.2, 0, TAU);
      c.ellipse(26, 8, 16, 6, 0.2, 0, TAU);
      c.ellipse(18, 20, 14, 6, 0.6, 0, TAU);
      c.ellipse(-14, -10, 13, 6, -1.2, 0, TAU);
    }
  }, { fill: PAL.white, lineWidth: 3.0, t: opt.t || 0, seed: 102 });

  // 3 decorative stitch lines on back of glove
  ctx.strokeStyle = PAL.inkSoft;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-6, -4); ctx.lineTo(6, -4);
  ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
  ctx.moveTo(-6, 4); ctx.lineTo(6, 4);
  ctx.stroke();

  ctx.restore();
}

// ------------------------------------------------------------- MECH-G Mascot Rig
export function drawMascot(ctx, x, y, opt = {}) {
  const t = opt.t || 0;
  const s = opt.scale || 1.0;
  const bounce = opt.bounce ?? Math.sin(t * 8) * 6;
  const squash = opt.squash ?? 1.0;
  const stretch = opt.stretch ?? 1.0;
  const blink = opt.blink ?? (Math.sin(t * 3.5) > 0.94 ? 0.1 : 1.0);
  const lookX = opt.lookX || 0;
  const lookY = opt.lookY || 0;
  const mouthState = opt.mouth || 'smile'; // 'smile', 'talk', 'grin', 'o'
  const leftArm = opt.leftArm || { angle: 0.2, gesture: 'wave' };
  const rightArm = opt.rightArm || { angle: -0.2, gesture: 'grip' };

  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.scale(s * stretch, s * squash);

  // Soft drop shadow
  ctx.save();
  ctx.fillStyle = 'rgba(43, 36, 32, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 110, 80 * stretch, 18 * squash, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Left arm (behind)
  drawGlove(ctx, -70, -10 + Math.sin(t * 6) * 10, leftArm.angle, leftArm.gesture, { t, scale: 0.9 });

  // Main bean / robot body
  printShape(ctx, (c) => {
    // Smooth rounded pill shape
    c.beginPath();
    c.moveTo(-65, -30);
    c.bezierCurveTo(-65, -110, 65, -110, 65, -30);
    c.bezierCurveTo(75, 80, -75, 80, -65, -30);
    c.closePath();
  }, { fill: PAL.mascotPurple, lineWidth: 4.5, t, seed: 201 });

  // Belly plate (cyan)
  printShape(ctx, (c) => {
    c.ellipse(0, 10, 44, 48, 0, 0, TAU);
  }, { fill: PAL.mascotCyan, lineWidth: 3.5, t, seed: 202 });

  // Shield Emblem on chest
  printShape(ctx, (c) => {
    c.beginPath();
    c.moveTo(0, -12);
    c.lineTo(16, -2);
    c.lineTo(10, 20);
    c.lineTo(0, 26);
    c.lineTo(-10, 20);
    c.lineTo(-16, -2);
    c.closePath();
  }, { fill: PAL.yellow, lineWidth: 2.5, t, seed: 203 });

  // Big White Cartoon Eyes
  const eyeY = -45;
  // Left eye
  printShape(ctx, (c) => {
    c.ellipse(-18, eyeY, 20, 26 * blink, 0, 0, TAU);
  }, { fill: PAL.white, lineWidth: 3.5, t, seed: 204 });

  // Right eye
  printShape(ctx, (c) => {
    c.ellipse(18, eyeY, 20, 26 * blink, 0, 0, TAU);
  }, { fill: PAL.white, lineWidth: 3.5, t, seed: 205 });

  // Pupils (shiny dark)
  if (blink > 0.3) {
    ctx.fillStyle = PAL.ink;
    // Left pupil
    ctx.beginPath();
    ctx.ellipse(-16 + lookX, eyeY + lookY, 9, 12, 0, 0, TAU);
    ctx.fill();
    // Shiny glint
    ctx.fillStyle = PAL.white;
    ctx.beginPath();
    ctx.arc(-18 + lookX, eyeY - 4 + lookY, 3.5, 0, TAU);
    ctx.fill();

    // Right pupil
    ctx.fillStyle = PAL.ink;
    ctx.beginPath();
    ctx.ellipse(18 + lookX, eyeY + lookY, 9, 12, 0, 0, TAU);
    ctx.fill();
    // Shiny glint
    ctx.fillStyle = PAL.white;
    ctx.beginPath();
    ctx.arc(16 + lookX, eyeY - 4 + lookY, 3.5, 0, TAU);
    ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mouthState === 'talk') {
    ctx.fillStyle = PAL.coral;
    ctx.ellipse(0, -10, 14, 10, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else if (mouthState === 'grin') {
    ctx.arc(0, -18, 16, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Cheek ticks
    ctx.moveTo(-16, -14); ctx.lineTo(-12, -8);
    ctx.moveTo(16, -14); ctx.lineTo(12, -8);
    ctx.stroke();
  } else {
    // Cheerful smile
    ctx.arc(0, -14, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // Engineer Hard Hat (Yellow)
  printShape(ctx, (c) => {
    c.beginPath();
    // Dome
    c.arc(0, -82, 46, Math.PI, 0, false);
    // Brim
    c.bezierCurveTo(56, -78, -56, -78, -46, -82);
    c.closePath();
  }, { fill: PAL.mustard, lineWidth: 4.0, t, seed: 206 });

  // Flashlight / Beacon on hat
  printShape(ctx, (c) => {
    c.rect(-10, -102, 20, 14);
  }, { fill: PAL.mascotCyan, lineWidth: 2.5, t, seed: 207 });

  // Right arm (front)
  drawGlove(ctx, 70, 0 + Math.sin(t * 6 + 1) * 8, rightArm.angle, rightArm.gesture, { t, scale: 1.0 });

  ctx.restore();
}

// ------------------------------------------------------------- Technician Presenter
export function drawTechnician(ctx, x, y, opt = {}) {
  const t = opt.t || 0;
  const s = opt.scale || 1.0;
  const panic = opt.panic || false;
  const wave = Math.sin(t * 6);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Legs & Boots
  printShape(ctx, (c) => {
    c.rect(-24, 40, 18, 70); // left leg
    c.rect(6, 40, 18, 70);  // right leg
    c.ellipse(-15, 112, 16, 8, 0, 0, TAU); // left boot
    c.ellipse(15, 112, 16, 8, 0, 0, TAU);  // right boot
  }, { fill: PAL.overallsD, lineWidth: 3.5, t, seed: 301 });

  // Blue Overalls Body
  printShape(ctx, (c) => {
    c.moveTo(-32, -30);
    c.lineTo(32, -30);
    c.lineTo(26, 48);
    c.lineTo(-26, 48);
    c.closePath();
  }, { fill: PAL.overalls, lineWidth: 4.0, t, seed: 302 });

  // Head & Cap
  printShape(ctx, (c) => {
    c.ellipse(0, -60, 24, 28, 0, 0, TAU);
  }, { fill: PAL.skin, lineWidth: 3.5, t, seed: 303 });

  // Eyes
  ctx.fillStyle = PAL.ink;
  if (panic) {
    // Spiral or huge scared dots
    ctx.beginPath();
    ctx.arc(-8, -64, 5, 0, TAU);
    ctx.arc(8, -64, 5, 0, TAU);
    ctx.fill();
    // Sweat drop
    ctx.fillStyle = PAL.sky;
    ctx.beginPath();
    ctx.ellipse(28, -75, 5, 8, 0.4, 0, TAU);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(-8, -62, 3.5, 0, TAU);
    ctx.arc(8, -62, 3.5, 0, TAU);
    ctx.fill();
  }

  // Arms
  if (panic) {
    // Hands on head in shock!
    drawGlove(ctx, -28, -70, -1.8, 'open', { t, scale: 0.85 });
    drawGlove(ctx, 28, -70, 1.8, 'open', { t, scale: 0.85 });
  } else {
    drawGlove(ctx, -38, 0 + wave * 4, -0.4, 'grip', { t, scale: 0.85 });
    drawGlove(ctx, 38, 0 - wave * 4, 0.4, 'point', { t, scale: 0.85 });
  }

  ctx.restore();
}

// ------------------------------------------------------------- Props
export function drawValve(ctx, x, y, opt = {}) {
  const t = opt.t || 0;
  const isLeaking = opt.leaking || false;
  const pressure = opt.pressure ?? (isLeaking ? 210 : 0);
  const s = opt.scale || 1.0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Cast Iron Valve Body
  printShape(ctx, (c) => {
    c.rect(-50, -25, 100, 50); // main block
    c.rect(-70, -35, 20, 70);  // left flange
    c.rect(50, -35, 20, 70);   // right flange
    c.rect(-20, -60, 40, 35);  // neck
  }, { fill: '#64748B', lineWidth: 4.0, t, seed: 401 });

  // Flange bolts
  ctx.fillStyle = PAL.ink;
  [-25, 0, 25].forEach(dy => {
    ctx.beginPath(); ctx.arc(-60, dy, 4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(60, dy, 4, 0, TAU); ctx.fill();
  });

  // Top Rotary Dial / Lever
  printShape(ctx, (c) => {
    c.ellipse(0, -65, 36, 12, 0, 0, TAU);
  }, { fill: PAL.coral, lineWidth: 3.5, t, seed: 402 });

  // Pressure Gauge
  printShape(ctx, (c) => {
    c.ellipse(0, -115, 30, 30, 0, 0, TAU);
  }, { fill: PAL.white, lineWidth: 3.5, t, seed: 403 });

  // Gauge needle
  const needleAngle = lerp(-Math.PI * 0.75, Math.PI * 0.75, pressure / 250);
  ctx.save();
  ctx.translate(0, -115);
  ctx.rotate(needleAngle);
  ctx.strokeStyle = pressure > 50 ? PAL.coral : PAL.green;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -22);
  ctx.stroke();
  ctx.restore();

  // Steam hisses when leaking
  if (isLeaking) {
    for (let i = 0; i < 4; i++) {
      const p = (t * 2 + i * 0.25) % 1.0;
      const sx = 25 + p * 40;
      const sy = -30 - p * 50;
      const r = 8 + p * 16;
      ctx.fillStyle = `rgba(244, 63, 94, ${0.7 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ------------------------------------------------------------- 1950s Caption Card
export function drawCaptionCard(ctx, text, opt = {}) {
  const t = opt.t || 0;
  const alpha = opt.alpha ?? 1.0;
  if (!text || alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  const w = Math.min(1640, Math.max(700, text.length * 18 + 260));
  const h = 76;
  const x = (1920 - w) / 2;
  const y = 1080 - 110;

  // Background plate
  printShape(ctx, (c) => {
    // Rounded slab
    const r = 16;
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }, { fill: PAL.paper, lineWidth: 3.5, t, seed: 501 });

  // Rotating atomic stars on ends
  drawStar(ctx, x + 40, y + h / 2, 14, { fill: PAL.mustard, rot: t * 1.5, t, seed: 502 });
  drawStar(ctx, x + w - 40, y + h / 2, 14, { fill: PAL.mustard, rot: -t * 1.5, t, seed: 503 });

  // Text
  ctx.fillStyle = PAL.ink;
  ctx.font = '600 26px Jost, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 1920 / 2, y + h / 2);

  ctx.restore();
}
