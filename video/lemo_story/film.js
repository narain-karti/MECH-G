// Film Scene Director for MECH-G Mid-century Cartoon Film
import { PAL, printShape, drawStar, drawGlove, drawMascot, drawTechnician, drawValve, drawCaptionCard, lerp, seg, easeOutBack, clamp } from './engine.js';
import { getSubtitle, BPM, BEAT, BAR } from './timeline.js';

const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;

// Draw workshop background
function drawWorkshopBackground(ctx, t) {
  // 1. Warm cream paper wall
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(0, 0, W, H);

  // 2. Warm workshop floor band
  printShape(ctx, (c) => {
    c.rect(0, 720, W, 360);
  }, { fill: PAL.floor, lineWidth: 4.0, t, seed: 10 });

  // 3. Wall baseboard stripe
  printShape(ctx, (c) => {
    c.rect(0, 705, W, 18);
  }, { fill: PAL.mustardD, lineWidth: 2.5, t, seed: 11 });

  // 4. Workshop Pegboard / Tool Rack (left side)
  printShape(ctx, (c) => {
    c.rect(60, 220, 240, 360);
  }, { fill: PAL.paperD, lineWidth: 3.5, t, seed: 12 });

  // Pegboard holes
  ctx.fillStyle = PAL.inkSoft;
  for (let r = 0; r < 6; r++) {
    for (let col = 0; col < 4; col++) {
      ctx.beginPath();
      ctx.arc(95 + col * 55, 260 + r * 55, 3.5, 0, TAU);
      ctx.fill();
    }
  }

  // Hanging wrench silhouette on tool rack
  printShape(ctx, (c) => {
    c.rect(130, 290, 16, 130);
    c.ellipse(138, 290, 20, 20, 0, 0, TAU);
  }, { fill: PAL.coral, lineWidth: 2.5, t, seed: 13 });

  // 5. Depot Store Signboard Header (Top Center)
  printShape(ctx, (c) => {
    c.rect(560, 40, 800, 75);
  }, { fill: PAL.mustard, lineWidth: 4.0, t, seed: 14 });

  ctx.fillStyle = PAL.ink;
  ctx.font = '700 36px "Alfa Slab One", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("MECH-G FRONTLINE DEPOT", 960, 80);

  // Small atomic stars on sign
  drawStar(ctx, 600, 77, 18, { fill: PAL.white, rot: t, t, seed: 15 });
  drawStar(ctx, 1320, 77, 18, { fill: PAL.white, rot: -t, t, seed: 16 });
}

// Draw step indicator badge (1, 2, 3)
function drawStepBadge(ctx, num, label, x, y, t) {
  // Gold starburst
  drawStar(ctx, x, y, 52, { fill: PAL.mustard, rot: t * 0.5, t, seed: 60 + num });

  // White inner disc
  printShape(ctx, (c) => {
    c.ellipse(x, y, 36, 36, 0, 0, TAU);
  }, { fill: PAL.white, lineWidth: 3.5, t, seed: 61 + num });

  // Number
  ctx.fillStyle = PAL.ink;
  ctx.font = '700 38px "Alfa Slab One", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${num}`, x, y + 2);

  // Label slab
  printShape(ctx, (c) => {
    c.rect(x + 50, y - 24, 260, 48);
  }, { fill: PAL.paper, lineWidth: 3.0, t, seed: 62 + num });

  ctx.font = '700 24px Jost, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 65, y + 2);
}

// Confetti particles for celebration
function drawConfetti(ctx, t) {
  const colors = [PAL.coral, PAL.mustard, PAL.mascotPurple, PAL.mascotCyan, PAL.green];
  for (let i = 0; i < 40; i++) {
    const p = (t * 1.5 + i * 0.17) % 2.0;
    const x = (i * 47) % W;
    const y = -50 + p * (H + 100);
    const rot = t * 4 + i;
    const col = colors[i % colors.length];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = col;
    ctx.fillRect(-8, -4, 16, 8);
    ctx.restore();
  }
}

// Master scene renderer called for each frame at time t
export function renderScene(ctx, t) {
  // 1. Draw universal bright workshop background
  drawWorkshopBackground(ctx, t);

  // ----------------------------------------------------------- SCENE 1: Store Intro (0-8s)
  if (t < 8.0) {
    const k = seg(t, 0.0, 3.0);
    const techX = lerp(-120, 650, easeOutBack(Math.min(1.0, k * 1.2)));

    // Technician running in holding valve
    drawTechnician(ctx, techX, 580, { t, scale: 1.15, panic: true });
    drawValve(ctx, techX + 90, 580, { t, scale: 0.9, leaking: true, pressure: 210 });

    // Warning alert callout above valve
    const alertY = 400 + Math.sin(t * 8) * 8;
    printShape(ctx, (c) => {
      c.rect(techX + 30, alertY, 180, 48);
    }, { fill: PAL.coral, lineWidth: 3.0, t, seed: 71 });

    ctx.fillStyle = PAL.white;
    ctx.font = '700 22px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("210 BAR BLOWOUT!", techX + 120, alertY + 24);

    // Kicker title card in first 4s
    if (t < 4.0) {
      const titlePop = easeOutBack(seg(t, 0.2, 1.2));
      ctx.save();
      ctx.translate(W / 2, 280);
      ctx.scale(titlePop, titlePop);
      printShape(ctx, (c) => {
        c.rect(-340, -50, 680, 100);
      }, { fill: PAL.white, lineWidth: 4.5, t, seed: 72 });
      ctx.fillStyle = PAL.ink;
      ctx.font = '700 48px "Alfa Slab One", serif';
      ctx.textAlign = 'center';
      ctx.fillText("MECH-G TO THE RESCUE!", 0, 15);
      ctx.restore();
    }
  }

  // ----------------------------------------------------------- SCENE 2: Cloud Crash & Manual Tumble (8-16s)
  else if (t < 16.0) {
    const sTime = t - 8.0;
    // Panicked technician in center
    drawTechnician(ctx, 750, 580, { t, scale: 1.2, panic: true });
    drawValve(ctx, 980, 620, { t, scale: 0.85, leaking: true, pressure: 210 });

    // Cartoon storm cloud forming above (8-12s)
    const cloudScale = easeOutBack(seg(sTime, 0.2, 1.5));
    ctx.save();
    ctx.translate(750, 240);
    ctx.scale(cloudScale, cloudScale);

    // Cloud bubbles
    printShape(ctx, (c) => {
      c.arc(-70, 0, 60, 0, TAU);
      c.arc(0, -35, 75, 0, TAU);
      c.arc(70, 0, 60, 0, TAU);
      c.arc(0, 30, 50, 0, TAU);
    }, { fill: '#475569', lineWidth: 4.5, t, seed: 81 });

    // Lightning bolt
    printShape(ctx, (c) => {
      c.moveTo(0, 50);
      c.lineTo(-18, 90);
      c.lineTo(-2, 90);
      c.lineTo(-20, 135);
      c.lineTo(15, 80);
      c.lineTo(0, 80);
      c.closePath();
    }, { fill: PAL.yellow, lineWidth: 2.5, t, seed: 82 });

    // Error banner
    printShape(ctx, (c) => {
      c.rect(-170, -25, 340, 50);
    }, { fill: PAL.coral, lineWidth: 3.5, t, seed: 83 });

    ctx.fillStyle = PAL.white;
    ctx.font = '700 24px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("HTTP 504: NO SIGNAL!", 0, 0);
    ctx.restore();

    // Giant 4,000-page manual tumbling down (12-16s)
    if (sTime > 3.5) {
      const dropP = seg(sTime, 3.5, 4.8);
      const bookY = lerp(-200, 620, dropP);
      const bookRot = lerp(-0.4, 0.05, dropP);

      ctx.save();
      ctx.translate(450, bookY);
      ctx.rotate(bookRot);
      // Giant book block
      printShape(ctx, (c) => {
        c.rect(-120, -140, 240, 280);
      }, { fill: '#94A3B8', lineWidth: 5.0, t, seed: 84 });

      // Book title
      ctx.fillStyle = PAL.ink;
      ctx.font = '700 28px "Alfa Slab One", serif';
      ctx.textAlign = 'center';
      ctx.fillText("4,000 PAGE", 0, -50);
      ctx.fillText("OEM BIBLE", 0, 0);

      // Flying paper pages around
      for (let i = 0; i < 5; i++) {
        const px = -180 + i * 85 + Math.sin(t * 3 + i) * 20;
        const py = -80 + Math.cos(t * 4 + i) * 30;
        ctx.fillStyle = PAL.white;
        ctx.strokeStyle = PAL.ink;
        ctx.lineWidth = 2.0;
        ctx.fillRect(px, py, 45, 60);
        ctx.strokeRect(px, py, 45, 60);
      }
      ctx.restore();
    }
  }

  // ----------------------------------------------------------- SCENE 3: Enter MECH-G Mascot! (16-22s)
  else if (t < 22.0) {
    const sTime = t - 16.0;
    const pop = easeOutBack(seg(sTime, 0.1, 1.2));

    // Big atomic starburst backdrop behind mascot
    drawStar(ctx, 960, 480, 320 * pop, { fill: PAL.yellow, rot: t * 0.4, t, seed: 91 });

    // MECH-G Mascot jumping in center!
    drawMascot(ctx, 960, 520, {
      t,
      scale: 1.5 * pop,
      squash: 1.0 + Math.sin(t * 10) * 0.08,
      stretch: 1.0 - Math.sin(t * 10) * 0.08,
      mouth: 'grin',
      leftArm: { angle: 0.6, gesture: 'wave' },
      rightArm: { angle: -0.6, gesture: 'point' }
    });

    // Intro ribbon banner
    const ribbonScale = easeOutBack(seg(sTime, 0.8, 1.8));
    ctx.save();
    ctx.translate(960, 210);
    ctx.scale(ribbonScale, ribbonScale);
    printShape(ctx, (c) => {
      c.rect(-380, -42, 760, 84);
    }, { fill: PAL.mascotCyan, lineWidth: 4.0, t, seed: 92 });

    ctx.fillStyle = PAL.white;
    ctx.font = '700 42px "Alfa Slab One", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("MEET MECH-G: 100% OFFLINE!", 0, 3);
    ctx.restore();

    // Relieved technician on right
    drawTechnician(ctx, 1550, 590, { t, scale: 1.0, panic: false });
  }

  // ----------------------------------------------------------- SCENE 4: Step 1 SNAP! (22-28s)
  else if (t < 28.0) {
    const sTime = t - 22.0;

    // Step 1 Badge
    drawStepBadge(ctx, 1, "SNAP: GEMMA VISION", 380, 175, t);

    // Mascot on left holding scanner
    drawMascot(ctx, 500, 540, {
      t,
      scale: 1.25,
      mouth: 'talk',
      lookX: 10,
      lookY: 0,
      leftArm: { angle: -0.3, gesture: 'grip' },
      rightArm: { angle: 0.1, gesture: 'point' }
    });

    // Optical scanner cone (cyan)
    const scanAlpha = 0.35 + Math.sin(t * 12) * 0.2;
    ctx.save();
    ctx.fillStyle = `rgba(6, 182, 212, ${scanAlpha})`;
    ctx.beginPath();
    ctx.moveTo(560, 520);
    ctx.lineTo(1050, 360);
    ctx.lineTo(1050, 680);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Valve being scanned on right
    drawValve(ctx, 1150, 530, { t, scale: 1.3, leaking: true, pressure: 210 });

    // Target reticle box locking onto valve
    const reticleScale = easeOutBack(seg(sTime, 0.5, 1.4));
    ctx.save();
    ctx.translate(1150, 510);
    ctx.scale(reticleScale, reticleScale);
    ctx.strokeStyle = PAL.green;
    ctx.lineWidth = 4.0;
    ctx.strokeRect(-120, -100, 240, 200);

    // Scan result card
    printShape(ctx, (c) => {
      c.rect(-150, 120, 300, 65);
    }, { fill: PAL.paper, lineWidth: 3.5, t, seed: 101 });

    ctx.fillStyle = PAL.ink;
    ctx.font = '700 22px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("PART: PRV-992-B (96%)", 0, 145);
    ctx.fillStyle = PAL.coral;
    ctx.font = '700 18px Jost, sans-serif';
    ctx.fillText("DEFECT: VITON SEAL WEEP", 0, 172);
    ctx.restore();
  }

  // ----------------------------------------------------------- SCENE 5: Step 2 LOCK! (28-34s)
  else if (t < 34.0) {
    const sTime = t - 28.0;

    // Step 2 Badge
    drawStepBadge(ctx, 2, "LOCK: OSHA 1910.147", 380, 175, t);

    // Mascot on left clamping padlock
    drawMascot(ctx, 500, 540, {
      t,
      scale: 1.25,
      mouth: 'grin',
      lookX: 10,
      lookY: 0,
      leftArm: { angle: 0.4, gesture: 'point' },
      rightArm: { angle: 0.2, gesture: 'grip' }
    });

    // Valve in center, pressure dropping to 0!
    const pressDrop = 210 * (1.0 - seg(sTime, 0.5, 1.8));
    drawValve(ctx, 1150, 530, { t, scale: 1.3, leaking: false, pressure: pressDrop });

    // Huge OSHA 1910.147 Padlock clamping onto valve handle
    const lockDrop = easeOutBack(seg(sTime, 0.2, 1.2));
    ctx.save();
    ctx.translate(1150, 420);
    ctx.scale(lockDrop, lockDrop);

    // Shackle (chrome)
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, -35, 45, Math.PI, 0);
    ctx.stroke();

    // Padlock body (bright red)
    printShape(ctx, (c) => {
      c.rect(-60, -25, 120, 95);
    }, { fill: PAL.coral, lineWidth: 4.0, t, seed: 111 });

    // Keyhole
    ctx.fillStyle = PAL.ink;
    ctx.beginPath();
    ctx.arc(0, 15, 12, 0, TAU);
    ctx.rect(-5, 15, 10, 22);
    ctx.fill();

    // Lockout tag
    printShape(ctx, (c) => {
      c.rect(45, 10, 95, 130);
    }, { fill: PAL.yellow, lineWidth: 3.0, t, seed: 112 });
    ctx.fillStyle = PAL.ink;
    ctx.font = '700 16px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("DANGER", 92, 35);
    ctx.font = '600 13px Jost, sans-serif';
    ctx.fillText("DO NOT", 92, 60);
    ctx.fillText("OPERATE", 92, 80);
    ctx.fillText("0 PSI OK", 92, 115);
    ctx.restore();

    // "ZERO ENERGY VERIFIED" starburst badge
    if (sTime > 1.8) {
      drawStar(ctx, 1540, 420, 80, { fill: PAL.green, rot: t, t, seed: 113 });
      ctx.fillStyle = PAL.white;
      ctx.font = '700 20px "Alfa Slab One", serif';
      ctx.textAlign = 'center';
      ctx.fillText("ZERO", 1540, 410);
      ctx.fillText("ENERGY!", 1540, 435);
    }
  }

  // ----------------------------------------------------------- SCENE 6: Step 3 FIX & VERIFY! (34-40s)
  else if (t < 40.0) {
    const sTime = t - 34.0;

    // Step 3 Badge
    drawStepBadge(ctx, 3, "FIX: 35 Nm TORQUE", 380, 175, t);

    // Mascot tightening wrench
    drawMascot(ctx, 500, 540, {
      t,
      scale: 1.25,
      mouth: 'grin',
      lookX: 10,
      lookY: 0,
      leftArm: { angle: 0.1, gesture: 'grip' },
      rightArm: { angle: -0.2, gesture: 'point' }
    });

    // Repaired Valve
    drawValve(ctx, 1150, 530, { t, scale: 1.3, leaking: false, pressure: 0 });

    // Calibrated Torque Wrench turning
    const wrenchRot = Math.sin(sTime * 6) * 0.15;
    ctx.save();
    ctx.translate(1150, 450);
    ctx.rotate(wrenchRot);
    // Wrench shaft
    printShape(ctx, (c) => {
      c.rect(-240, -14, 240, 28);
      c.rect(-260, -20, 28, 40); // handle grip
      c.ellipse(0, 0, 32, 32, 0, 0, TAU); // socket head
    }, { fill: '#CBD5E1', lineWidth: 4.0, t, seed: 121 });

    // Digital readout box
    printShape(ctx, (c) => {
      c.rect(-150, -32, 90, 26);
    }, { fill: PAL.ink, lineWidth: 2.0, t, seed: 122 });
    ctx.fillStyle = PAL.green;
    ctx.font = '700 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("35.0 Nm", -105, -14);
    ctx.restore();

    // In-memory Graph Citation Card popping up
    const notePop = easeOutBack(seg(sTime, 0.6, 1.5));
    ctx.save();
    ctx.translate(1480, 340);
    ctx.scale(notePop, notePop);
    printShape(ctx, (c) => {
      c.rect(-170, -75, 340, 150);
    }, { fill: PAL.paper, lineWidth: 3.5, t, seed: 123 });

    ctx.fillStyle = PAL.ink;
    ctx.font = '700 20px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("OKF DETERMINISTIC GRAPH", 0, -45);
    ctx.font = '600 16px Jost, sans-serif';
    ctx.fillText("Pass 1: 15 Nm  |  Pass 2: 25 Nm", 0, -15);
    ctx.fillText("Pass 3: 35 Nm (Calibrated)", 0, 15);
    ctx.fillStyle = PAL.green;
    ctx.fillText("VERIFIED BY LOCAL GRAPH", 0, 45);
    ctx.restore();
  }

  // ----------------------------------------------------------- SCENE 7: Celebration & Metric Slam (40-48s)
  else {
    const sTime = t - 40.0;

    // Confetti explosion!
    drawConfetti(ctx, t);

    // Repaired valve humming smoothly with green ripple rings
    drawValve(ctx, 960, 680, { t, scale: 1.1, leaking: false, pressure: 0 });
    for (let i = 0; i < 3; i++) {
      const ringP = (t * 2 + i * 0.33) % 1.0;
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.8 * (1 - ringP)})`;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.ellipse(960, 680, 120 + ringP * 120, 60 + ringP * 60, 0, 0, TAU);
      ctx.stroke();
    }

    // Celebrating Mascot (Jumping with double thumbs up!)
    const jumpY = 480 - Math.abs(Math.sin(sTime * 6)) * 60;
    drawMascot(ctx, 700, jumpY, {
      t,
      scale: 1.4,
      squash: 1.0 + Math.sin(t * 8) * 0.1,
      stretch: 1.0 - Math.sin(t * 8) * 0.1,
      mouth: 'grin',
      leftArm: { angle: 0.8, gesture: 'point' },
      rightArm: { angle: -0.8, gesture: 'point' }
    });

    // Celebrating Technician on right
    drawTechnician(ctx, 1220, 520, { t, scale: 1.3, panic: false });

    // Three Huge Metric Medallions Slamming Down!
    const medals = [
      { text: "84% FASTER", sub: "MTTR Reduction", col: PAL.coral, x: 420 },
      { text: "< 500 ms", sub: "Graph Latency", col: PAL.mustard, x: 960 },
      { text: "100%", sub: "Offline Edge AI", col: PAL.green, x: 1500 }
    ];

    medals.forEach((m, idx) => {
      const mDrop = easeOutBack(seg(sTime, 0.4 + idx * 0.3, 1.4 + idx * 0.3));
      ctx.save();
      ctx.translate(m.x, 220);
      ctx.scale(mDrop, mDrop);

      // Starburst outer
      drawStar(ctx, 0, 0, 95, { fill: m.col, rot: t * 0.5 + idx, t, seed: 130 + idx });
      // White inner disc
      printShape(ctx, (c) => {
        c.ellipse(0, 0, 72, 72, 0, 0, TAU);
      }, { fill: PAL.white, lineWidth: 4.0, t, seed: 131 + idx });

      ctx.fillStyle = PAL.ink;
      ctx.font = '700 24px "Alfa Slab One", serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.text, 0, -8);
      ctx.font = '700 16px Jost, sans-serif';
      ctx.fillText(m.sub, 0, 20);
      ctx.restore();
    });

    // Final Outro Tagline in last 3 seconds
    if (sTime > 4.0) {
      const tagPop = easeOutBack(seg(sTime, 4.0, 5.0));
      ctx.save();
      ctx.translate(W / 2, 850);
      ctx.scale(tagPop, tagPop);
      printShape(ctx, (c) => {
        c.rect(-440, -45, 880, 90);
      }, { fill: PAL.mascotPurple, lineWidth: 4.5, t, seed: 140 });

      ctx.fillStyle = PAL.white;
      ctx.font = '700 36px "Alfa Slab One", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("MECH-G: MISSION-CRITICAL EDGE AI", 0, 2);
      ctx.restore();
    }
  }

  // ----------------------------------------------------------- Universal Mid-century Subtitle Card
  const sub = getSubtitle(t);
  if (sub) {
    const subAlpha = Math.min(
      seg(t, sub.t0, sub.t0 + 0.16),
      1.0 - seg(t, sub.t1 - 0.16, sub.t1)
    );
    drawCaptionCard(ctx, sub.text, { t, alpha: subAlpha });
  }
}
