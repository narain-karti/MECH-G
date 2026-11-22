// Hairline UI · hold-to-start · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";

export type LightPaletteName = "azure" | "solar" | "prism" | "dusk";

export interface LightPalette {
  outerFringe: string;
  core: string;
  innerFringe: string;
  ambient: string;
  sparkle: readonly [string, string, string];
  rimPrimary: string;
  rimSecondary: string;
  rimAccent: string;
  ink: string;
  strength: number;
}

export const LIGHT_PALETTES: Record<LightPaletteName, LightPalette> = {
  azure: {
    outerFringe: "rgba(56, 189, 248, 0.94)",
    core: "rgba(240, 249, 255, 0.98)",
    innerFringe: "rgba(37, 99, 235, 0.88)",
    ambient: "rgba(14, 165, 233, 0.38)",
    sparkle: ["#FFFFFF", "#BAE6FD", "#93C5FD"],
    rimPrimary: "rgba(96, 185, 255, 0.64)",
    rimSecondary: "rgba(59, 130, 246, 0.58)",
    rimAccent: "rgba(186, 230, 253, 0.46)",
    ink: "#3b82f6",
    strength: 0.95,
  },
  solar: {
    outerFringe: "rgba(244, 114, 146, 0.68)",
    core: "rgba(255, 250, 234, 0.92)",
    innerFringe: "rgba(251, 166, 92, 0.76)",
    ambient: "rgba(251, 191, 96, 0.36)",
    sparkle: ["#FFFFFF", "#FCD9A4", "#FBB6C8"],
    rimPrimary: "rgba(251, 178, 102, 0.7)",
    rimSecondary: "rgba(238, 126, 162, 0.62)",
    rimAccent: "rgba(251, 204, 116, 0.54)",
    ink: "#f59e0b",
    strength: 0.86,
  },
  prism: {
    outerFringe: "rgba(246, 146, 196, 0.72)",
    core: "rgba(255, 250, 236, 0.92)",
    innerFringe: "rgba(96, 195, 248, 0.64)",
    ambient: "rgba(251, 200, 114, 0.36)",
    sparkle: ["#FFFFFF", "#FDE6B0", "#FFD6E8"],
    rimPrimary: "rgba(250, 204, 116, 0.68)",
    rimSecondary: "rgba(240, 140, 190, 0.66)",
    rimAccent: "rgba(104, 188, 248, 0.5)",
    ink: "#ec4899",
    strength: 0.88,
  },
  dusk: {
    outerFringe: "rgba(240, 150, 200, 0.5)",
    core: "rgba(255, 246, 250, 0.7)",
    innerFringe: "rgba(120, 160, 248, 0.48)",
    ambient: "rgba(230, 150, 200, 0.22)",
    sparkle: ["#FFFFFF", "#FFE4F0", "#D8E4FF"],
    rimPrimary: "rgba(240, 150, 200, 0.6)",
    rimSecondary: "rgba(120, 160, 248, 0.56)",
    rimAccent: "rgba(250, 210, 228, 0.42)",
    ink: "#6b8af6",
    strength: 0.64,
  },
};

export type LightDirection = "radial" | "horizontal" | "diagonal";
export type LightPoint = { x: number; y: number };

export interface LightWaveOptions {
  origin?: LightPoint;
  direction?: LightDirection;
  palette?: LightPaletteName | LightPalette;
  duration?: number;
  onMidpoint?: () => void;
  onComplete?: () => void;
}

export interface LightSurfaceHandle {
  wave: (options?: LightWaveOptions) => void;
  charge: (level: number, origin?: LightPoint) => void;
  busy: () => boolean;
  element: () => HTMLDivElement | null;
}

export const resolvePalette = (p: LightPaletteName | LightPalette | undefined, fallback: LightPaletteName = "azure") =>
  typeof p === "object" ? p : LIGHT_PALETTES[p ?? fallback] ?? LIGHT_PALETTES[fallback];

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const easeOutCubic = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 3;
export const easeOutQuart = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 4;

const reducedQuery = "(prefers-reduced-motion: reduce)";
export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(reducedQuery).matches;
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
export const useLightReducedMotion = () => React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

export function opticsAt(progress: number) {
  const p = clamp(progress, 0, 1);
  const swap = 0.36;
  const focus = p < swap ? Math.sin((p / swap) * (Math.PI / 2)) : p < 0.86 ? Math.cos(((p - swap) / (0.86 - swap)) * (Math.PI / 2)) ** 1.35 : 0;
  const wave = p < 0.16 ? Math.sin((p / 0.16) * (Math.PI / 2)) : (1 - (p - 0.16) / 0.84) ** 1.9;
  const dust = p < 0.18 ? p / 0.18 : p < 0.5 ? 1 : (1 - (p - 0.5) / 0.5) ** 1.75;
  return { blur: focus * 7.8, scale: 1 - focus * 0.01, swapped: p >= swap, wave: clamp(wave, 0, 1), dust: clamp(dust, 0, 1), veil: focus * 0.24 };
}

let probe: CanvasRenderingContext2D | null = null;
export function isLightSurface(el: Element) {
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return false;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#fff";
  probe.fillStyle = getComputedStyle(el).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

const DURATION: Record<LightDirection, number> = { radial: 1400, horizontal: 1180, diagonal: 1360 };
const DUST = 195;

type Dust = { x: number; y: number; size: number; phase: number; twinkle: number; tone: 0 | 1 | 2; star: boolean };
const makeDust = (): Dust[] =>
  Array.from({ length: DUST }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.5 + Math.random() * 1.15,
    phase: Math.random() * Math.PI * 2,
    twinkle: 5 + Math.random() * 8,
    tone: (i % 3) as 0 | 1 | 2,
    star: i % 10 === 0,
  }));

const inkFor = (p: LightPalette, light: boolean): LightPalette =>
  light ? { ...p, core: p.outerFringe, sparkle: [p.sparkle[2], p.sparkle[1], p.sparkle[2]], strength: p.strength * 0.9 } : p;

function starGlint(ctx: CanvasRenderingContext2D, x: number, y: number, arm: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x - arm, y);
  ctx.lineTo(x + arm, y);
  ctx.moveTo(x, y - arm);
  ctx.lineTo(x, y + arm);
  ctx.stroke();
  ctx.restore();
}

type Wave = Required<Pick<LightWaveOptions, "origin" | "direction" | "duration">> & {
  palette: LightPalette;
  start: number;
  swapped: boolean;
  onMidpoint?: () => void;
  onComplete?: () => void;
};

type Settings = { palette: LightPalette; direction: LightDirection; duration: number };

function createEngine(get: { root: () => HTMLDivElement | null; content: () => HTMLDivElement | null; veil: () => HTMLDivElement | null; canvas: () => HTMLCanvasElement | null; settings: () => Settings; settle: (on: boolean) => void }) {
  let raf = 0;
  let wave: Wave | null = null;
  let level = 0;
  let target = 0;
  let chargeOrigin: LightPoint = { x: 0.5, y: 0.88 };
  let last = 0;
  let dust = makeDust();
  let light = false;
  let settleTimer = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;

  const measure = () => {
    const root = get.root();
    const canvas = get.canvas();
    if (!root || !canvas) return false;
    w = root.offsetWidth;
    h = root.offsetHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.max(1, Math.round(w * dpr));
    const ph = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    light = isLightSurface(root);
    return w > 0 && h > 0;
  };

  const idle = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    const canvas = get.canvas();
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    const content = get.content();
    if (content) {
      content.style.filter = "";
      content.style.transform = "";
      content.style.willChange = "";
    }
    const veil = get.veil();
    if (veil) veil.style.opacity = "0";
  };

  const frame = (now: number) => {
    const canvas = get.canvas();
    const ctx = canvas?.getContext("2d");
    const content = get.content();
    if (!canvas || !ctx) return idle();
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    level = target >= level ? target : Math.max(target, level - dt / 220);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = light ? "source-over" : "lighter";

    if (level > 0.01 && !wave) drawCharge(ctx, now, content);
    if (wave) drawWave(ctx, now, wave, content);

    ctx.restore();
    if (wave || level > 0.005) raf = requestAnimationFrame(frame);
    else idle();
  };

  const drawCharge = (ctx: CanvasRenderingContext2D, now: number, content: HTMLDivElement | null) => {
    const p = inkFor(get.settings().palette, light);
    const cx = chargeOrigin.x * w;
    const cy = chargeOrigin.y * h;
    const lv = clamp(level, 0, 1);
    const ring = Math.hypot(w, h) * 0.54 * (1 - lv * 0.72) + 26;
    const band = 44 * (0.7 + lv * 0.35);
    const g = ctx.createRadialGradient(cx, cy, Math.max(0, ring - band), cx, cy, ring + band);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.32, p.innerFringe);
    g.addColorStop(0.54, p.core);
    g.addColorStop(0.76, p.outerFringe);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = (0.16 + lv * 0.38) * p.strength;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const coreR = 20 + lv * 72;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    cg.addColorStop(0, p.core);
    cg.addColorStop(0.5, p.outerFringe);
    cg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.16 + lv * 0.42;
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
    for (const d of dust) {
      const px = d.x * w;
      const py = d.y * h;
      const dx = cx - px;
      const dy = cy - py;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = lv * lv * 0.34;
      const x = px + dx * pull;
      const y = py + dy * pull;
      ctx.globalAlpha = lv * (0.4 + 0.6 * Math.sin(now * 0.011 + d.phase)) * 0.68;
      ctx.fillStyle = p.sparkle[d.tone];
      ctx.beginPath();
      ctx.arc(x, y, d.size * (0.7 + lv * 0.4), 0, Math.PI * 2);
      ctx.fill();
      if (lv > 0.5 && d.star) {
        ctx.strokeStyle = p.sparkle[0];
        ctx.lineWidth = 0.7;
        ctx.globalAlpha = (lv - 0.5) * 0.55;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - (dx / dist) * 7 * lv, y - (dy / dist) * 7 * lv);
        ctx.stroke();
      }
    }
    if (content) {
      content.style.willChange = "transform, filter";
      content.style.transform = `scale(${(1 - lv * 0.012).toFixed(4)})`;
      content.style.filter = `blur(${(lv * 1.1).toFixed(2)}px)`;
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D, now: number, wv: Wave, content: HTMLDivElement | null) => {
    const raw = clamp((now - wv.start) / wv.duration, 0, 1);
    const o = opticsAt(raw);
    if (o.swapped && !wv.swapped) {
      wv.swapped = true;
      wv.onMidpoint?.();
    }
    if (content) {
      content.style.willChange = "transform, filter";
      content.style.filter = o.blur > 0.05 ? `blur(${o.blur.toFixed(2)}px)` : "";
      content.style.transform = Math.abs(o.scale - 1) > 0.0005 ? `scale(${o.scale.toFixed(4)})` : "";
    }
    const veil = get.veil();
    if (veil) veil.style.opacity = o.veil.toFixed(3);
    const p = inkFor(wv.palette, light);

    if (wv.direction === "horizontal") {
      const x = -w * 0.14 + easeOutCubic(raw) * w * 1.28;
      const half = Math.max(46, w * 0.14);
      const g = ctx.createLinearGradient(x - half * 1.7, 0, x + half * 1.1, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.28, p.innerFringe);
      g.addColorStop(0.56, p.core);
      g.addColorStop(0.76, p.outerFringe);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = o.wave * p.strength;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (const [edgeY, top] of [[0, true], [h, false]] as const) {
        const e = ctx.createRadialGradient(x, edgeY, 2, x, edgeY, half * 1.35);
        e.addColorStop(0, p.core);
        e.addColorStop(0.5, p.outerFringe);
        e.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = o.wave * 0.85;
        ctx.fillStyle = e;
        ctx.fillRect(0, top ? 0 : h * 0.5, w, h * 0.5);
      }
      for (const d of dust) {
        const px = d.x * w;
        const py = d.y * h;
        const behind = x - px;
        if (behind <= -22 || behind >= w * 0.95) continue;
        const fresh = clamp(1 - Math.abs(behind) / (w * 0.65), 0.15, 1);
        const a = o.dust * fresh * (0.35 + 0.65 * Math.sin(now * 0.01 * d.twinkle * 0.2 + d.phase)) * 0.88;
        if (a <= 0.02) continue;
        const sx = px + clamp(behind * 0.04, 0, 12);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.sparkle[d.tone];
        ctx.beginPath();
        ctx.arc(sx, py, d.size * (0.75 + fresh * 0.45), 0, Math.PI * 2);
        ctx.fill();
        if (d.star && a > 0.4) starGlint(ctx, sx, py, d.size * 3, p.sparkle[0], a * 0.78);
      }
    } else if (wv.direction === "diagonal") {
      const e = easeOutQuart(raw);
      const x = -w * 0.35 + e * w * 1.7;
      const r = Math.max(w * 0.46, 260);
      const cy = h * 0.45 + (e - 0.5) * h * 0.18;
      ctx.save();
      ctx.translate(x, cy);
      ctx.scale(1.45, 0.85);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, p.core);
      g.addColorStop(0.28, p.outerFringe);
      g.addColorStop(0.58, p.innerFringe);
      g.addColorStop(0.82, p.ambient);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = o.wave * p.strength * 0.78;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      for (const d of dust) {
        const px = d.x * w;
        const py = d.y * h;
        const behind = x - px;
        if (behind <= -r * 0.45) continue;
        const fresh = clamp(1 - Math.abs(behind) / (w * 0.85), 0.14, 1);
        const a = o.dust * fresh * (0.3 + 0.7 * Math.sin(now * 0.008 + d.phase)) * 0.58;
        if (a <= 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.sparkle[d.tone];
        ctx.beginPath();
        ctx.arc(px + clamp(behind * 0.02, 0, 10), py, d.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const ox = wv.origin.x * w;
      const oy = wv.origin.y * h;
      const far = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy));
      const radius = easeOutQuart(raw) * (far * 1.16 + 44);
      const ring = Math.max(64, far * 0.22);
      const g = ctx.createRadialGradient(ox, oy, Math.max(0, radius - ring * 0.92), ox, oy, radius + ring * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.22, p.innerFringe);
      g.addColorStop(0.42, p.ambient);
      g.addColorStop(0.54, p.core);
      g.addColorStop(0.7, p.outerFringe);
      g.addColorStop(0.88, p.ambient);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = o.wave * p.strength;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const wash = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(10, radius * 0.9));
      wash.addColorStop(0, "rgba(0,0,0,0)");
      wash.addColorStop(0.66, p.ambient);
      wash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = o.wave * 0.44;
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);
      for (const d of dust) {
        const px = d.x * w;
        const py = d.y * h;
        const dx = px - ox;
        const dy = py - oy;
        const dist = Math.hypot(dx, dy) || 1;
        const behind = radius - dist;
        if (behind <= -22) continue;
        const fresh = clamp(1 - behind / (far * 1.05), 0.14, 1);
        const a = o.dust * fresh * (0.35 + 0.65 * Math.sin(now * 0.01 + d.phase)) * 0.78;
        if (a <= 0.02) continue;
        const drift = clamp(behind * 0.03, 0, 12);
        const sx = px + (dx / dist) * drift;
        const sy = py + (dy / dist) * drift;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.sparkle[d.tone];
        ctx.beginPath();
        ctx.arc(sx, sy, d.size * (0.72 + fresh * 0.45), 0, Math.PI * 2);
        ctx.fill();
        if (d.star && a > 0.36) starGlint(ctx, sx, sy, d.size * 3.1, p.sparkle[0], a * 0.75);
      }
    }

    if (raw >= 1) {
      wave = null;
      wv.onComplete?.();
    }
  };

  const run = () => {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  return {
    wave(options: LightWaveOptions = {}) {
      const s = get.settings();
      if (wave && !wave.swapped) {
        wave.swapped = true;
        wave.onMidpoint?.();
      }
      const previous = wave;
      wave = null;
      previous?.onComplete?.();
      if (prefersReducedMotion() || !measure()) {
        options.onMidpoint?.();
        options.onComplete?.();
        return;
      }
      const direction = options.direction ?? s.direction;
      const duration = options.duration ?? (options.direction ? DURATION[direction] : s.duration);
      dust = makeDust();
      target = 0;
      level = 0;
      wave = {
        start: performance.now(),
        duration,
        origin: options.origin ?? { x: 0.5, y: 0.88 },
        direction,
        palette: resolvePalette(options.palette ?? s.palette),
        swapped: false,
        onMidpoint: options.onMidpoint,
        onComplete: options.onComplete,
      };
      window.clearTimeout(settleTimer);
      get.settle(true);
      settleTimer = window.setTimeout(() => get.settle(false), duration * 0.85);
      run();
    },
    charge(next: number, origin?: LightPoint) {
      if (prefersReducedMotion()) return;
      if (origin) chargeOrigin = origin;
      if (next > 0.005 && !raf && !measure()) return;
      target = clamp(next, 0, 1);
      if (target > 0.005 || level > 0.005) run();
    },
    busy: () => wave !== null,
    dispose() {
      window.clearTimeout(settleTimer);
      cancelAnimationFrame(raf);
      raf = 0;
      wave = null;
    },
  };
}

type Engine = ReturnType<typeof createEngine>;

const MASK_EDGE: React.CSSProperties = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

export interface LightSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: React.ReactNode;
  ref?: React.Ref<LightSurfaceHandle>;
  palette?: LightPaletteName | LightPalette;
  direction?: LightDirection;
  duration?: number;
  lit?: boolean;
  shape?: "card" | "capsule";
  veil?: string;
  cascadeKey?: string;
}

export function LightSurface({
  children,
  ref,
  palette = "azure",
  direction = "radial",
  duration,
  lit = false,
  shape = "card",
  veil = "var(--background)",
  cascadeKey,
  className = "",
  onPointerMove,
  onPointerLeave,
  ...props
}: LightSurfaceProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const veilRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sheenRef = React.useRef<HTMLDivElement>(null);
  const engineRef = React.useRef<Engine | null>(null);
  const [settling, setSettling] = React.useState(false);
  const pal = resolvePalette(palette);
  const live = React.useRef<Settings>({ palette: pal, direction, duration: duration ?? DURATION[direction] });
  React.useLayoutEffect(() => {
    live.current = { palette: pal, direction, duration: duration ?? DURATION[direction] };
  });

  const engine = React.useCallback(
    () =>
      (engineRef.current ??= createEngine({
        root: () => rootRef.current,
        content: () => contentRef.current,
        veil: () => veilRef.current,
        canvas: () => canvasRef.current,
        settings: () => live.current,
        settle: (on: boolean) => setSettling(on),
      })),
    [],
  );

  React.useEffect(
    () => () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      wave: (o) => engine().wave(o),
      charge: (l, o) => engine().charge(l, o),
      busy: () => engineRef.current?.busy() ?? false,
      element: () => rootRef.current,
    }),
    [engine],
  );

  void cascadeKey;
  const capsule = shape === "capsule";
  const rim = !lit ? 0 : capsule || settling ? 0.92 : 0.72;
  const bezel = !lit ? 0 : capsule ? 0.95 : settling ? 0.96 : 0.84;
  const card = (a: number) => `color-mix(in oklab, var(--card) ${a}%, transparent)`;

  return (
    <div
      ref={rootRef}
      className={`relative isolate overflow-clip border border-border bg-card text-card-foreground ${className}`}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        const sheen = sheenRef.current;
        const root = rootRef.current;
        if (e.pointerType !== "mouse" || !sheen || !root) return;
        const r = root.getBoundingClientRect();
        sheen.style.background = `radial-gradient(240px circle at ${Math.round(e.clientX - r.left)}px ${Math.round(e.clientY - r.top)}px, color-mix(in oklab, var(--foreground) 24%, transparent), transparent 68%)`;
        sheen.style.opacity = "1";
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        if (sheenRef.current) sheenRef.current.style.opacity = "0";
      }}
      {...props}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--foreground) 3.5%, transparent) 0%, transparent 26%)" }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-[1400ms] ease-out"
        style={{
          opacity: rim,
          background: capsule
            ? `radial-gradient(62% 38% at 10% 6%, ${pal.rimPrimary}, transparent 68%), radial-gradient(68% 42% at 90% 96%, ${pal.rimSecondary}, transparent 68%), radial-gradient(50% 34% at 92% 8%, ${pal.rimAccent}, transparent 72%)`
            : `radial-gradient(52% 29% at 8% 4%, ${pal.rimPrimary}, transparent 66%), radial-gradient(54% 31% at 92% 96%, ${pal.rimSecondary}, transparent 67%), radial-gradient(44% 25% at 92% 5%, ${pal.rimAccent}, transparent 69%), radial-gradient(46% 23% at 16% 97%, ${pal.rimSecondary}, transparent 67%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-[1400ms] ease-out"
        style={{
          opacity: lit ? 1 : 0,
          background: capsule
            ? `radial-gradient(76% 68% at 50% 50%, ${card(88)} 0%, ${card(52)} 66%, transparent 100%)`
            : `radial-gradient(82% 77% at 50% 50%, ${card(96)} 0%, ${card(82)} 70%, ${card(20)} 90%, transparent 100%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-[1200ms] ease-out"
        style={{
          ...MASK_EDGE,
          padding: capsule ? 1.5 : 1.25,
          opacity: bezel,
          background: `linear-gradient(135deg, ${pal.rimPrimary} 0%, color-mix(in oklab, var(--foreground) 26%, transparent) 28%, color-mix(in oklab, var(--foreground) 6%, transparent) 54%, ${pal.rimSecondary} 100%)`,
        }}
      />
      <div ref={sheenRef} aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300" style={{ ...MASK_EDGE, padding: 1 }} />
      <div ref={contentRef} className="relative z-10 h-full w-full">
        {children}
      </div>
      <div ref={veilRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0" style={{ background: veil }} />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-30 size-full rounded-[inherit]" />
    </div>
  );
}

export function useLightHeld<T>(next: T, key: string | number | boolean, surface: React.RefObject<LightSurfaceHandle | null>, wave: () => LightWaveOptions | null) {
  const [held, setHeld] = React.useState<{ key: typeof key; value: T }>({ key, value: next });
  const latest = React.useRef({ next, key });
  React.useLayoutEffect(() => {
    latest.current = { next, key };
  });
  const pending = held.key !== key;
  React.useEffect(() => {
    if (!pending) return;
    const s = surface.current;
    const options = wave();
    const land = () => setHeld({ key: latest.current.key, value: latest.current.next });
    if (!s || !options || s.busy()) {
      const id = requestAnimationFrame(land);
      return () => cancelAnimationFrame(id);
    }
    s.wave({ ...options, onMidpoint: land });
  }, [pending, key]);
  return pending ? held.value : next;
}
export default LightSurface;
