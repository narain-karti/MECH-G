// film.js — Master Visual Assembly of MECH-G Dark Keynote Pitch Film
import * as E from './engine.js';
import { CUES, SUBS, DUR } from './timeline.js';

const { W, H, PAL, clamp, lerp, seg, ss, eo, ei, eio, rr, panel, pill, grid, bg, pressureGauge, hudReticle, subtitleToast } = E;

export { DUR };

export function renderFilm(g, t, opts = {}) {
  // Clear canvas
  g.setTransform(1, 0, 0, 1, 0, 0);
  
  // 1. Dynamic Background & Grid
  const isFreeze = (t >= CUES.freeze && t < CUES.pivot);
  const darkVal = isFreeze ? 0.35 : 0.0;
  bg(g, 1.0, darkVal);
  
  // Grid follows subtle camera pan
  const gridOx = (t * 12) % 48;
  grid(g, gridOx, 0, 1.0, isFreeze ? 0.4 : 1.0);
  
  // 2. Active Scene Rendering
  if (t < CUES.cloud_drop) {
    drawScene1_Hook(g, t);
  } else if (t < CUES.freeze) {
    drawScene2_Failure(g, t);
  } else if (t < CUES.snap_turn) {
    drawScene3_FreezePivot(g, t);
  } else if (t < CUES.metrics_slam) {
    drawScene4_Mnemonic(g, t);
  } else {
    drawScene5_MetricsLockup(g, t);
  }
  
  // 3. Subtitle Toasts
  if (!opts.nosub) {
    const curSub = SUBS.find(s => t >= s.t0 && t <= s.t1);
    if (curSub) {
      const fadeIn = seg(t, curSub.t0, curSub.t0 + 0.16);
      const fadeOut = seg(t, curSub.t1 - 0.16, curSub.t1);
      const subAlpha = clamp(fadeIn * (1 - fadeOut));
      subtitleToast(g, curSub.text, subAlpha);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Scene 1: Frontline Peril & Nacelle Reality (0.0s – 9.8s)
// ─────────────────────────────────────────────────────────────
function drawScene1_Hook(g, t) {
  g.save();
  // Header Overline
  pill(g, 90, 70, 420, 36, "OFFSHORE WIND TURBINE NACELLE · 100M ALTITUDE", { stroke: PAL.line, color: PAL.dim });
  
  // Left Panel: Pressure Telemetry & Live Gauge
  const p1X = 90, p1Y = 130, p1W = 560, p1H = 760;
  panel(g, p1X, p1Y, p1W, p1H, { fill: PAL.surf });
  
  g.fillStyle = PAL.text;
  g.font = `600 22px Inter, sans-serif`;
  g.textAlign = 'left';
  g.fillText("HYDRAULIC MANIFOLD PRESSURE", p1X + 32, p1Y + 54);
  
  g.fillStyle = PAL.red;
  g.font = `600 13px "JetBrains Mono", monospace`;
  g.fillText("STATUS: SEVERE PRESSURE ANOMALY", p1X + 32, p1Y + 82);
  
  // Quivering gauge needle
  const jitter = Math.sin(t * 40) * 2.5 + Math.cos(t * 70) * 1.5;
  const psiVal = 210 + jitter;
  pressureGauge(g, p1X + p1W / 2, p1Y + 280, 160, psiVal, 250, true);
  
  // Hydraulic Weepage Warning Card inside panel
  const alertY = p1Y + 480;
  panel(g, p1X + 32, alertY, p1W - 64, 210, { fill: PAL.surf2, stroke: 'rgba(239, 68, 68, 0.4)' });
  
  pill(g, p1X + 54, alertY + 24, 210, 28, "CRITICAL DEFECT DETECTED", { stroke: PAL.red, color: PAL.red });
  
  g.fillStyle = PAL.text;
  g.font = `600 16px Inter, sans-serif`;
  g.fillText("Valve PRV-992-B Extruded Viton Seal", p1X + 54, alertY + 84);
  
  g.fillStyle = PAL.dim;
  g.font = `400 14px Inter, sans-serif`;
  g.fillText("Active high-pressure fluid seep at 210 bar.", p1X + 54, alertY + 114);
  g.fillText("Immediate shutdown & recalibration required.", p1X + 54, alertY + 138);
  
  // Right Panel 1: Downtime Escalation Ticker
  const p2X = 690, p2Y = 130, p2W = 1140, p2H = 340;
  panel(g, p2X, p2Y, p2W, p2H, { fill: PAL.surf });
  
  pill(g, p2X + 36, p2Y + 36, 260, 32, "FINANCIAL DOWNTIME RUNRATE", { stroke: PAL.red, color: PAL.red });
  
  // Escalating ticker
  const hours = (t / 3.0) + 0.15;
  const cost = Math.round(hours * 30000);
  
  g.fillStyle = PAL.red;
  g.font = `700 84px "Inter Tight", sans-serif`;
  g.textAlign = 'left';
  g.fillText(`$${cost.toLocaleString()}`, p2X + 36, p2Y + 160);
  
  g.fillStyle = PAL.dim;
  g.font = `500 18px Inter, sans-serif`;
  g.fillText("Escalating at $30,000/hr · 0 Offshore Cell Connectivity · 4,000 Manual Pages", p2X + 36, p2Y + 220);
  
  // Right Panel 2: Manual Flipping Burden
  const p3X = 690, p3Y = 510, p3W = 1140, p3H = 380;
  panel(g, p3X, p3Y, p3W, p3H, { fill: PAL.surf });
  
  g.fillStyle = PAL.text;
  g.font = `600 24px Inter, sans-serif`;
  g.fillText("The Frontline Maintenance Dilemma", p3X + 36, p3Y + 54);
  
  // 3 Feature Cards
  const cards = [
    { title: "Zero Connectivity", desc: "Nacelle steel Faraday cage blocks 100% of 4G/5G signals.", icon: "🛰️" },
    { title: "4,000-Page PDF Bloat", desc: "Technicians flipping greasy binders while dangling in harness.", icon: "📖" },
    { title: "Catastrophic Pressure", desc: "210 bar hydraulic oil transforms small leaks into cutting jets.", icon: "⚠️" }
  ];
  
  cards.forEach((c, i) => {
    const cx = p3X + 36 + i * 360;
    const cy = p3Y + 90;
    panel(g, cx, cy, 330, 240, { fill: PAL.surf2, stroke: PAL.line });
    g.font = `32px sans-serif`;
    g.fillText(c.icon, cx + 24, cy + 50);
    g.fillStyle = PAL.text;
    g.font = `600 18px Inter, sans-serif`;
    g.fillText(c.title, cx + 24, cy + 104);
    g.fillStyle = PAL.dim;
    g.font = `400 14px Inter, sans-serif`;
    wrapText(g, c.desc, cx + 24, cy + 138, 280, 22);
  });
  
  g.restore();
}

// ─────────────────────────────────────────────────────────────
// Scene 2: Generic Cloud RAG Failure & Hallucination (9.8s – 19.5s)
// ─────────────────────────────────────────────────────────────
function drawScene2_Failure(g, t) {
  g.save();
  pill(g, 90, 70, 360, 36, "THE FAILURE OF GENERIC VECTOR RAG", { stroke: PAL.red, color: PAL.red });
  
  // Left Error Panel: Cloud Connection Severed
  const p1X = 90, p1Y = 130, p1W = 840, p1H = 760;
  panel(g, p1X, p1Y, p1W, p1H, { stroke: 'rgba(239, 68, 68, 0.4)' });
  
  pill(g, p1X + 36, p1Y + 36, 280, 32, "HTTP 504 GATEWAY TIMEOUT", { stroke: PAL.red, color: PAL.red });
  
  g.fillStyle = PAL.text;
  g.font = `700 36px Inter, sans-serif`;
  g.textAlign = 'left';
  g.fillText("Cloud SaaS AI Is Dead Out Here", p1X + 36, p1Y + 120);
  
  g.fillStyle = PAL.dim;
  g.font = `400 18px Inter, sans-serif`;
  g.fillText("When connection drops, cloud-only LLMs hang indefinitely,", p1X + 36, p1Y + 160);
  g.fillText("leaving technicians with unresponsive spinners.", p1X + 36, p1Y + 190);
  
  // Red Terminal Failure Card
  const termY = p1Y + 230;
  panel(g, p1X + 36, termY, p1W - 72, 470, { fill: '#0A0607', stroke: 'rgba(239, 68, 68, 0.3)' });
  
  g.fillStyle = PAL.red;
  g.font = `600 14px "JetBrains Mono", monospace`;
  const termLines = [
    "[FATAL] Connection to api.cloud-vector-rag.com lost.",
    "[WARN] Accumulator safety interlock context severed by chunker.",
    "[WARN] Missing upstream parent chapter: lockout_tagout_hydraulics.md",
    "[ERROR] Fallback to nearest vector similarity embedding...",
    "[HALLUCINATION WARNING] Extracted torque value has no safety check.",
    "--> GUESSING VALUE FROM SIMILAR THREADS: 55 Nm",
    "[CRITICAL] 55 Nm EXCEEDS MAXIMUM TENSILE LIMIT (35 Nm) BY 57%!",
    "[RESULT] ALUMINUM THREAD STRIPPING & FLUID ERUPTION IMMINENT."
  ];
  termLines.forEach((tl, i) => {
    g.fillText(tl, p1X + 56, termY + 45 + i * 50);
  });
  
  // Right Panel: Catastrophic 55 Nm CAD Rupture Diagram
  const p2X = 970, p2Y = 130, p2W = 860, p2H = 760;
  panel(g, p2X, p2Y, p2W, p2H, { stroke: 'rgba(239, 68, 68, 0.6)' });
  
  pill(g, p2X + 36, p2Y + 36, 320, 32, "CRITICAL RISK: 55 Nm OVER-TORQUE", { stroke: PAL.red, color: PAL.red });
  
  g.fillStyle = PAL.text;
  g.font = `700 32px Inter, sans-serif`;
  g.fillText("Catastrophic Pressure Blowout", p2X + 36, p2Y + 115);
  
  // CAD Rupture Illustration
  const cadX = p2X + 36, cadY = p2Y + 150, cadW = p2W - 72, cadH = 550;
  panel(g, cadX, cadY, cadW, cadH, { fill: '#0A0D14', stroke: PAL.line });
  
  // CAD Grid lines
  grid(g, cadX, cadY, 0.5, 0.3);
  
  // Manifold Box Outline
  g.strokeStyle = PAL.red;
  g.lineWidth = 3;
  g.shadowColor = PAL.red;
  g.shadowBlur = 12;
  rr(g, cadX + 180, cadY + 120, 420, 280, 12);
  g.stroke();
  g.shadowBlur = 0;
  
  // Hydraulic Rupture Leak Lines
  g.strokeStyle = 'rgba(239, 68, 68, 0.8)';
  g.lineWidth = 4;
  for (let k = 0; k < 6; k++) {
    const rx = cadX + 390 + Math.sin(t * 15 + k) * 60;
    const ry = cadY + 120 - k * 18;
    g.beginPath();
    g.moveTo(cadX + 390, cadY + 120);
    g.lineTo(rx, ry);
    g.stroke();
  }
  
  g.fillStyle = PAL.red;
  g.font = `700 24px "JetBrains Mono", monospace`;
  g.textAlign = 'center';
  g.fillText("55 Nm = THREAD STRIP AT 210 BAR", cadX + cadW / 2, cadY + 450);
  
  g.fillStyle = PAL.dim;
  g.font = `500 16px Inter, sans-serif`;
  g.fillText("OEM Engineering Specification strictly requires 35 Nm.", cadX + cadW / 2, cadY + 490);
  
  g.restore();
}

// ─────────────────────────────────────────────────────────────
// Scene 3: The Freeze & Pivot (19.5s – 23.4s)
// ─────────────────────────────────────────────────────────────
function drawScene3_FreezePivot(g, t) {
  g.save();
  // Centered dramatic reveal card
  const cx = W / 2, cy = H / 2;
  const pw = 1100, ph = 460;
  panel(g, cx - pw / 2, cy - ph / 2, pw, ph, { fill: '#0A0C12', stroke: PAL.accent, shadow: 2 });
  
  pill(g, cx - 180, cy - ph / 2 + 40, 360, 36, "THE EDGE INTELLIGENCE MANDATE", { stroke: PAL.accent, color: PAL.accent });
  
  g.fillStyle = PAL.text;
  g.font = `700 56px Inter, sans-serif`;
  g.textAlign = 'center';
  g.fillText("Cloud AI Is Dead Out Here.", cx, cy - 30);
  
  g.fillStyle = PAL.accent;
  g.shadowColor = PAL.accent;
  g.shadowBlur = 20;
  g.font = `700 68px "Inter Tight", sans-serif`;
  g.fillText("Meet MECH-G.", cx, cy + 55);
  g.shadowBlur = 0;
  
  g.fillStyle = PAL.dim;
  g.font = `500 20px Inter, sans-serif`;
  g.fillText("Offline-First · Closed-World AST Citations · OSHA 1910.147 Enforced", cx, cy + 130);
  
  g.restore();
}

// ─────────────────────────────────────────────────────────────
// Scene 4: The 3-Step Mnemonic: SNAP, LOCK, FIX (23.4s – 37.2s)
// ─────────────────────────────────────────────────────────────
function drawScene4_Mnemonic(g, t) {
  g.save();
  pill(g, 90, 60, 480, 36, "THE 3-STEP MNEMONIC · VERIFIED OFFLINE WORKFLOW", { stroke: PAL.accent, color: PAL.accent });
  
  const stepT = t - 23.4;
  
  // Card 1: 1. SNAP (Gemma Multimodal Vision)
  const c1X = 90, c1Y = 120, c1W = 550, c1H = 770;
  const isSnapActive = stepT >= 0.0;
  panel(g, c1X, c1Y, c1W, c1H, { stroke: isSnapActive ? PAL.accent : PAL.line });
  
  pill(g, c1X + 32, c1Y + 32, 220, 32, "STEP 1: SNAP", { stroke: PAL.accent, color: PAL.accent });
  
  g.fillStyle = PAL.text;
  g.font = `700 26px Inter, sans-serif`;
  g.textAlign = 'left';
  g.fillText("Gemma Multimodal Vision", c1X + 32, c1Y + 105);
  
  // HUD Camera Reticle Box
  const retX = c1X + 32, retY = c1Y + 140, retW = c1W - 64, retH = 340;
  panel(g, retX, retY, retW, retH, { fill: '#0B0F16', stroke: PAL.line });
  hudReticle(g, retX + 40, retY + 40, retW - 80, retH - 80, "VALVE PRV-992-B", 0.96, Math.sin(t * 6) * 0.3 + 0.7);
  
  g.fillStyle = PAL.text;
  g.font = `600 16px Inter, sans-serif`;
  g.fillText("Part Identified: PRV-992-B", c1X + 32, c1Y + 520);
  g.fillStyle = PAL.dim;
  g.font = `400 14px Inter, sans-serif`;
  wrapText(g, "Identified offline with 96% confidence. Bounding box maps weepage to Viton O-ring seal collar.", c1X + 32, c1Y + 550, c1W - 64, 22);
  
  // Card 2: 2. LOCK (OSHA 1910.147 Safety Gate)
  const c2X = 680, c2Y = 120, c2W = 550, c2H = 770;
  const isLockActive = stepT >= 4.0;
  panel(g, c2X, c2Y, c2W, c2H, { stroke: isLockActive ? PAL.amber : PAL.line });
  
  pill(g, c2X + 32, c2Y + 32, 220, 32, "STEP 2: LOCK", { stroke: PAL.amber, color: PAL.amber });
  
  g.fillStyle = PAL.text;
  g.font = `700 26px Inter, sans-serif`;
  g.fillText("OSHA 1910.147 LOTO Gate", c2X + 32, c2Y + 105);
  
  // OSHA Safety Simulator Box
  const lotoX = c2X + 32, lotoY = c2Y + 140, lotoW = c2W - 64, lotoH = 340;
  panel(g, lotoX, lotoY, lotoW, lotoH, { fill: '#141008', stroke: 'rgba(245, 158, 11, 0.4)' });
  
  // Zero Energy Gauge inside LOTO card
  pressureGauge(g, lotoX + lotoW / 2, lotoY + 170, 110, 0, 250, false);
  
  g.fillStyle = PAL.green;
  g.font = `700 18px "JetBrains Mono", monospace`;
  g.textAlign = 'center';
  g.fillText("ZERO ENERGY CONFIRMED: 0 PSI", lotoX + lotoW / 2, lotoY + 310);
  
  g.textAlign = 'left';
  g.fillStyle = PAL.text;
  g.font = `600 16px Inter, sans-serif`;
  g.fillText("Mechanical Interlock Enforced", c2X + 32, c2Y + 520);
  g.fillStyle = PAL.dim;
  g.font = `400 14px Inter, sans-serif`;
  wrapText(g, "Technician badge TECH-8842 signed off. Procedural repair instructions remain locked until zero energy is verified.", c2X + 32, c2Y + 550, c2W - 64, 22);
  
  // Card 3: 3. FIX & VERIFY (Calibrated 35 Nm Torque + Evidence Drawer)
  const c3X = 1270, c3Y = 120, c3W = 560, c3H = 770;
  const isFixActive = stepT >= 8.5;
  panel(g, c3X, c3Y, c3W, c3H, { stroke: isFixActive ? PAL.green : PAL.line });
  
  pill(g, c3X + 32, c3Y + 32, 260, 32, "STEP 3: FIX & VERIFY", { stroke: PAL.green, color: PAL.green });
  
  g.fillStyle = PAL.text;
  g.font = `700 26px Inter, sans-serif`;
  g.fillText("Calibrated 35 Nm Sequence", c3X + 32, c3Y + 105);
  
  // Checklist inside Card 3
  const chkX = c3X + 32, chkY = c3Y + 140, chkW = c3W - 64, chkH = 340;
  panel(g, chkX, chkY, chkW, chkH, { fill: '#09120E', stroke: 'rgba(16, 185, 129, 0.4)' });
  
  const steps = [
    { num: "PASS 1", torque: "15 Nm", status: "VERIFIED [OK]" },
    { num: "PASS 2", torque: "25 Nm", status: "VERIFIED [OK]" },
    { num: "FINAL", torque: "35 Nm", status: "LOCK TIGHT [OK]" }
  ];
  
  steps.forEach((s, idx) => {
    const sy = chkY + 35 + idx * 95;
    panel(g, chkX + 20, sy, chkW - 40, 75, { fill: PAL.surf2, stroke: PAL.green });
    g.fillStyle = PAL.green;
    g.font = `700 16px "JetBrains Mono", monospace`;
    g.fillText(`✓ ${s.num}: ${s.torque}`, chkX + 40, sy + 44);
    g.fillStyle = PAL.text;
    g.font = `600 14px "JetBrains Mono", monospace`;
    g.fillText(s.status, chkX + chkW - 180, sy + 44);
  });
  
  g.fillStyle = PAL.text;
  g.font = `600 16px Inter, sans-serif`;
  g.fillText("Evidence Drawer AST Anchors", c3X + 32, c3Y + 520);
  g.fillStyle = PAL.dim;
  g.font = `400 14px Inter, sans-serif`;
  wrapText(g, "Every instruction grounded in deterministic markdown AST nodes. Zero hallucination tolerance.", c3X + 32, c3Y + 550, c3W - 64, 22);
  
  g.restore();
}

// ─────────────────────────────────────────────────────────────
// Scene 5: Big Numbers Slam & Shield Mascot Lockup (37.2s – 48.0s)
// ─────────────────────────────────────────────────────────────
function drawScene5_MetricsLockup(g, t) {
  g.save();
  const subT = t - 37.2;
  
  if (subT < 5.3) {
    // 37.2s – 42.5s: Giant Rolling Statistics
    pill(g, W / 2 - 200, 70, 400, 36, "MEASURED FRONTLINE OPERATIONAL IMPACT", { stroke: PAL.accent, color: PAL.accent });
    
    // Giant Stat 1: 84% MTTR Reduction (Center Hero)
    const heroX = 90, heroY = 130, heroW = 700, heroH = 750;
    panel(g, heroX, heroY, heroW, heroH, { stroke: PAL.accent });
    
    pill(g, heroX + 36, heroY + 36, 260, 32, "PRIMARY METRIC", { stroke: PAL.accent, color: PAL.accent });
    
    // Rolling number
    const targetNum = 84;
    const curNum = Math.min(targetNum, Math.round(seg(subT, 0.0, 1.2) * targetNum));
    
    g.fillStyle = PAL.accent;
    g.shadowColor = PAL.accent;
    g.shadowBlur = 30;
    g.font = `700 160px "Inter Tight", sans-serif`;
    g.textAlign = 'left';
    g.fillText(`${curNum}%`, heroX + 36, heroY + 240);
    g.shadowBlur = 0;
    
    g.fillStyle = PAL.text;
    g.font = `700 36px Inter, sans-serif`;
    g.fillText("MTTR Reduction", heroX + 36, heroY + 320);
    
    g.fillStyle = PAL.dim;
    g.font = `400 18px Inter, sans-serif`;
    wrapText(g, "Mean Time to Repair cut from 4.8 hours down to 45 minutes on offshore nacelle hydraulic and pitch controller faults.", heroX + 36, heroY + 370, heroW - 72, 28);
    
    // Sub-Stat 1: < 500 ms Local Graph Latency
    const s1X = 830, s1Y = 130, s1W = 1000, s1H = 350;
    panel(g, s1X, s1Y, s1W, s1H, { stroke: PAL.line });
    pill(g, s1X + 36, s1Y + 36, 240, 32, "IN-MEMORY GRAPH RAM", { stroke: PAL.dim, color: PAL.dim });
    
    g.fillStyle = PAL.text;
    g.font = `700 84px "Inter Tight", sans-serif`;
    g.fillText("< 500 ms", s1X + 36, s1Y + 160);
    
    g.fillStyle = PAL.dim;
    g.font = `500 20px Inter, sans-serif`;
    g.fillText("Sub-millisecond NetworkX directed traversal of OEM component nodes.", s1X + 36, s1Y + 220);
    
    // Sub-Stat 2: 100% Offline Capable
    const s2X = 830, s2Y = 530, s2W = 1000, s2H = 350;
    panel(g, s2X, s2Y, s2W, s2H, { stroke: PAL.line });
    pill(g, s2X + 36, s2Y + 36, 240, 32, "ZERO CLOUD DEPENDENCIES", { stroke: PAL.dim, color: PAL.dim });
    
    g.fillStyle = PAL.green;
    g.font = `700 84px "Inter Tight", sans-serif`;
    g.fillText("100% OFFLINE", s2X + 36, s2Y + 160);
    
    g.fillStyle = PAL.dim;
    g.font = `500 20px Inter, sans-serif`;
    g.fillText("Closed-world AST citation auditor validates all manual references locally.", s2X + 36, s2Y + 220);
  } else {
    // 42.5s – 48.0s: Final MECH-G Mascot Shield & Logo Lockup
    const lockT = subT - 5.3;
    const collapse = eo(seg(lockT, 0.0, 1.0));
    
    const cx = W / 2, cy = H / 2;
    
    // Shield Emblem (Procedural vector drawing)
    const sr = lerp(120, 140, Math.sin(t * 4) * 0.5 + 0.5);
    
    g.save();
    g.translate(cx, cy - 60);
    
    // Glow behind shield
    const sGlow = g.createRadialGradient(0, 0, 0, 0, 0, sr * 2);
    sGlow.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
    sGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    g.fillStyle = sGlow;
    g.beginPath();
    g.arc(0, 0, sr * 2, 0, Math.PI * 2);
    g.fill();
    
    // Outer shield polygon
    g.fillStyle = PAL.surf;
    g.strokeStyle = PAL.accent;
    g.lineWidth = 4;
    g.shadowColor = PAL.accent;
    g.shadowBlur = 24;
    
    g.beginPath();
    g.moveTo(0, -sr);
    g.lineTo(sr * 0.9, -sr * 0.5);
    g.lineTo(sr * 0.9, sr * 0.3);
    g.lineTo(0, sr * 1.1);
    g.lineTo(-sr * 0.9, sr * 0.3);
    g.lineTo(-sr * 0.9, -sr * 0.5);
    g.closePath();
    g.fill();
    g.stroke();
    g.shadowBlur = 0;
    
    // Stylized "G" glyph inside shield
    g.fillStyle = PAL.accent;
    g.font = `700 110px "Inter Tight", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText("G", 0, 5);
    g.restore();
    
    // Brand Wordmark
    g.fillStyle = PAL.text;
    g.font = `700 72px "Inter Tight", sans-serif`;
    g.textAlign = 'center';
    g.fillText("MECH-G", cx, cy + 150);
    
    // Tagline
    g.fillStyle = PAL.accent;
    g.font = `600 24px "JetBrains Mono", monospace`;
    g.fillText("MISSION-CRITICAL EDGE INTELLIGENCE", cx, cy + 205);
    
    g.fillStyle = PAL.dim;
    g.font = `400 16px Inter, sans-serif`;
    g.fillText("Powered by Google Gemma Multimodal & Open Knowledge Format", cx, cy + 245);
  }
  
  g.restore();
}

function wrapText(g, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = g.measureText(testLine);
    if (metrics.width > maxW && n > 0) {
      g.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineH;
    } else {
      line = testLine;
    }
  }
  g.fillText(line, x, y);
}
