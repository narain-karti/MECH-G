// engine.js — Dark Tech Keynote Drawing Engine for MECH-G
export const W = 1920;
export const H = 1080;

export const PAL = {
  bg0: '#07080B',
  bg1: '#0F1218',
  surf: '#121620',
  surf2: '#181E2B',
  surf3: '#20283A',
  line: 'rgba(255,255,255,0.08)',
  hi: 'rgba(255,255,255,0.12)',
  text: '#F4F4F6',
  dim: '#9CA3AF',
  mute: '#6B7280',
  accent: '#22D3EE',      // MECH-G Electric Cyan
  glow: 'rgba(34,211,238,0.35)',
  red: '#EF4444',         // 55 Nm CAD blowout danger
  amber: '#F59E0B',       // LOTO caution
  green: '#10B981',       // Verified zero energy
};

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = t => t * t * (3 - 2 * t);
export const eo = t => 1 - Math.pow(1 - t, 3);
export const ei = t => Math.pow(t, 3);
export const eio = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

export function bg(g, lift = 1.0, dark = 0.0) {
  g.save();
  g.fillStyle = PAL.bg0;
  g.fillRect(0, 0, W, H);
  
  const cx = W * 0.5, cy = H * 0.35;
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.8);
  gr.addColorStop(0, `rgba(16, 22, 32, ${0.9 * lift})`);
  gr.addColorStop(0.5, `rgba(10, 13, 18, ${0.6 * lift})`);
  gr.addColorStop(1, PAL.bg0);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  
  // Cool cyan ambient glow in upper-center
  const glow = g.createRadialGradient(W * 0.5, H * 0.15, 0, W * 0.5, H * 0.15, 600);
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  
  if (dark > 0) {
    g.fillStyle = `rgba(5, 6, 8, ${dark})`;
    g.fillRect(0, 0, W, H);
  }
  g.restore();
}

export function grid(g, ox = 0, oy = 0, scale = 1.0, alpha = 1.0) {
  const step = 48 * scale;
  if (step < 4 || alpha <= 0) return;
  g.save();
  g.lineWidth = 1;
  const i0 = Math.floor(-ox / step), i1 = Math.ceil((W - ox) / step);
  const j0 = Math.floor(-oy / step), j1 = Math.ceil((H - oy) / step);
  
  // Minor grid lines
  g.strokeStyle = `rgba(255, 255, 255, ${0.03 * alpha})`;
  g.beginPath();
  for (let i = i0; i <= i1; i++) {
    const x = Math.round(ox + i * step) + 0.5;
    g.moveTo(x, 0); g.lineTo(x, H);
  }
  for (let j = j0; j <= j1; j++) {
    const y = Math.round(oy + j * step) + 0.5;
    g.moveTo(0, y); g.lineTo(W, y);
  }
  g.stroke();
  
  // Major grid lines (every 4th module)
  g.strokeStyle = `rgba(34, 211, 238, ${0.06 * alpha})`;
  g.beginPath();
  for (let i = i0; i <= i1; i++) {
    if (i % 4 !== 0) continue;
    const x = Math.round(ox + i * step) + 0.5;
    g.moveTo(x, 0); g.lineTo(x, H);
  }
  for (let j = j0; j <= j1; j++) {
    if (j % 4 !== 0) continue;
    const y = Math.round(oy + j * step) + 0.5;
    g.moveTo(0, y); g.lineTo(W, y);
  }
  g.stroke();
  g.restore();
}

export function panel(g, x, y, w, h, o = {}) {
  const { r = 16, fill = PAL.surf, stroke = PAL.line, shadow = 1, alpha = 1, hi = true } = o;
  g.save();
  g.globalAlpha *= alpha;
  
  if (shadow > 0) {
    g.shadowColor = 'rgba(0, 0, 0, 0.65)';
    g.shadowBlur = 40;
    g.shadowOffsetY = 14;
    g.fillStyle = fill;
    rr(g, x, y, w, h, r);
    g.fill();
    g.shadowColor = 'transparent';
  }
  
  // Top-lit gradient fill
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, '#1A2232');
  gr.addColorStop(0.15, fill);
  gr.addColorStop(1, fill);
  g.fillStyle = gr;
  rr(g, x, y, w, h, r);
  g.fill();
  
  // Border stroke
  g.lineWidth = 1;
  g.strokeStyle = stroke;
  rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r);
  g.stroke();
  
  // Top specular highlight line
  if (hi) {
    g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    g.beginPath();
    g.moveTo(x + r, y + 1.5);
    g.lineTo(x + w - r, y + 1.5);
    g.stroke();
  }
  g.restore();
}

export function pill(g, x, y, w, h, text, o = {}) {
  const { fill = PAL.surf2, stroke = PAL.accent, color = PAL.accent, dot = true, icon = '' } = o;
  g.save();
  rr(g, x, y, w, h, h / 2);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 1;
  g.stroke();
  
  let tx = x + 16;
  if (dot) {
    g.fillStyle = color;
    g.shadowColor = color;
    g.shadowBlur = 8;
    g.beginPath();
    g.arc(tx, y + h / 2, 4, 0, Math.PI * 2);
    g.fill();
    g.shadowColor = 'transparent';
    tx += 14;
  }
  
  g.fillStyle = PAL.text;
  g.font = `600 13px "JetBrains Mono", monospace`;
  g.textBaseline = 'middle';
  g.fillText(text, tx, y + h / 2);
  g.restore();
}

export function pressureGauge(g, cx, cy, r, psi, maxPsi = 250, isDanger = false) {
  g.save();
  // Outer bezel
  g.shadowColor = 'rgba(0,0,0,0.8)';
  g.shadowBlur = 30;
  g.fillStyle = PAL.surf;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.shadowColor = 'transparent';
  
  g.strokeStyle = isDanger ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255,255,255,0.12)';
  g.lineWidth = 2;
  g.stroke();
  
  // Dial Arc (from -140 deg to +140 deg)
  const startAng = (-140 * Math.PI) / 180;
  const endAng = (140 * Math.PI) / 180;
  const totalAng = endAng - startAng;
  
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  g.lineWidth = 8;
  g.beginPath();
  g.arc(cx, cy, r - 20, startAng, endAng);
  g.stroke();
  
  // Active Pressure Arc
  const frac = clamp(psi / maxPsi, 0, 1);
  const curAng = startAng + frac * totalAng;
  
  g.strokeStyle = isDanger ? PAL.red : (psi === 0 ? PAL.green : PAL.accent);
  g.lineWidth = 8;
  g.beginPath();
  g.arc(cx, cy, r - 20, startAng, curAng);
  g.stroke();
  
  // Value label
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = isDanger ? PAL.red : PAL.text;
  g.font = `700 48px Inter, sans-serif`;
  g.fillText(`${Math.round(psi)}`, cx, cy - 10);
  
  g.fillStyle = PAL.dim;
  g.font = `600 14px "JetBrains Mono", monospace`;
  g.fillText(isDanger ? "BAR (HIGH RISK)" : (psi === 0 ? "PSI (ZERO ENERGY)" : "BAR PRESSURE"), cx, cy + 30);
  
  // Needle
  g.strokeStyle = isDanger ? PAL.red : PAL.accent;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + (r - 28) * Math.cos(curAng), cy + (r - 28) * Math.sin(curAng));
  g.stroke();
  
  // Center cap
  g.fillStyle = PAL.text;
  g.beginPath();
  g.arc(cx, cy, 6, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function hudReticle(g, x, y, w, h, label, conf, pulse = 1.0) {
  g.save();
  // Corner brackets
  const len = 24;
  g.strokeStyle = PAL.accent;
  g.lineWidth = 2;
  g.shadowColor = PAL.accent;
  g.shadowBlur = 10 * pulse;
  
  // Top-left
  g.beginPath(); g.moveTo(x, y + len); g.lineTo(x, y); g.lineTo(x + len, y); g.stroke();
  // Top-right
  g.beginPath(); g.moveTo(x + w - len, y); g.lineTo(x + w, y); g.lineTo(x + w, y + len); g.stroke();
  // Bottom-left
  g.beginPath(); g.moveTo(x, y + h - len); g.lineTo(x, y + h); g.lineTo(x + len, y + h); g.stroke();
  // Bottom-right
  g.beginPath(); g.moveTo(x + w - len, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + h - len); g.stroke();
  
  // Target crosshairs
  const cx = x + w / 2, cy = y + h / 2;
  g.beginPath();
  g.moveTo(cx - 10, cy); g.lineTo(cx + 10, cy);
  g.moveTo(cx, cy - 10); g.lineTo(cx, cy + 10);
  g.stroke();
  
  // Floating HUD Badge
  g.shadowBlur = 0;
  const tagH = 32;
  const tagW = 230;
  panel(g, x, y - tagH - 8, tagW, tagH, { r: 6, fill: PAL.surf2, stroke: PAL.accent });
  g.fillStyle = PAL.accent;
  g.font = `600 12px "JetBrains Mono", monospace`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(`TARGET: ${label}`, x + 10, y - tagH / 2 - 8);
  
  g.fillStyle = PAL.green;
  g.fillText(`${Math.round(conf * 100)}% MATCH`, x + tagW - 75, y - tagH / 2 - 8);
  g.restore();
}

export function subtitleToast(g, text, alpha = 1.0) {
  if (!text || alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha;
  
  g.font = `500 22px Inter, sans-serif`;
  const textWidth = g.measureText(text).width;
  const pw = Math.max(500, Math.min(1500, textWidth + 80));
  const ph = 56;
  const px = (W - pw) / 2;
  const py = H - 90;
  
  // Glass pill
  g.shadowColor = 'rgba(0, 0, 0, 0.7)';
  g.shadowBlur = 30;
  g.fillStyle = 'rgba(15, 18, 26, 0.88)';
  rr(g, px, py, pw, ph, 28);
  g.fill();
  g.shadowColor = 'transparent';
  
  g.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  g.lineWidth = 1;
  rr(g, px + 0.5, py + 0.5, pw - 1, ph - 1, 28);
  g.stroke();
  
  // Cyan speaking dot
  g.fillStyle = PAL.accent;
  g.shadowColor = PAL.accent;
  g.shadowBlur = 8;
  g.beginPath();
  g.arc(px + 28, py + ph / 2, 4.5, 0, Math.PI * 2);
  g.fill();
  g.shadowColor = 'transparent';
  
  // Subtitle text
  g.fillStyle = PAL.text;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(text, px + 48, py + ph / 2 + 1);
  g.restore();
}
