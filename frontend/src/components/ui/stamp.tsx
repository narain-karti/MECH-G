// Hairline UI · stamp · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { playSound } from "./ui-sounds";

export interface StampProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: React.ReactNode;
  on: boolean;
  mark: string;
  detail?: string;
  shape?: "rect" | "seal";
  tone?: "success" | "danger" | "warning" | "primary" | "neutral";
  color?: string;
  position?: "center" | "top-right" | "bottom-right";
  rotate?: number;
  size?: number;
  seed?: string;
  sound?: boolean;
}

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const DRY_MS = 1500;
const LIFT_MS = 520;

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () => React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const outBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

type RGB = [number, number, number];
let probe: CanvasRenderingContext2D | null = null;
function toRgb(color: string, fallback: RGB): RGB {
  if (typeof document === "undefined" || !color) return fallback;
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return fallback;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return a === 0 ? fallback : [r, g, b];
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function valueNoise(w: number, h: number, cell: number, rand: () => number) {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const g = new Float32Array(gw * gh).map(() => rand());
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / cell;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    const sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < w; x++) {
      const fx = x / cell;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const sx = tx * tx * (3 - 2 * tx);
      const a = g[y0 * gw + x0];
      const b = g[y0 * gw + x0 + 1];
      const c = g[(y0 + 1) * gw + x0];
      const d = g[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}

type Ink = { w: number; h: number; dpr: number; wet: HTMLCanvasElement; dry: HTMLCanvasElement; dryAlpha: Uint8ClampedArray; lift: Float32Array; color: RGB };

function inkFor(opts: { mark: string; detail?: string; shape: "rect" | "seal"; size: number; color: RGB; seed: string; dpr: number }): Ink {
  const { mark, detail, shape, size, color, seed, dpr } = opts;
  const word = mark.toUpperCase();
  const small = (detail ?? "").toUpperCase();
  const big = (shape === "seal" ? 24 : 30) * size;
  const tiny = 10.5 * size;
  const measure = document.createElement("canvas").getContext("2d")!;
  const spaced = (text: string, px: number, weight: number, spacing: number) => {
    measure.font = `${weight} ${px}px ${FONT}`;
    let w = 0;
    for (const ch of text) w += measure.measureText(ch).width + spacing;
    return w - spacing;
  };
  const wordW = spaced(word, big, 800, big * 0.06);
  const smallW = small ? spaced(small, tiny, 700, tiny * 0.14) : 0;
  let W: number;
  let H: number;
  if (shape === "seal") {
    W = H = Math.ceil(Math.max(wordW + 78 * size, 136 * size));
  } else {
    W = Math.ceil(Math.max(wordW, smallW) + 44 * size);
    H = Math.ceil(big * 1.05 + (small ? tiny + 10 * size : 0) + 30 * size);
  }
  const pw = Math.ceil(W * dpr);
  const ph = Math.ceil(H * dpr);
  const base = document.createElement("canvas");
  base.width = pw;
  base.height = ph;
  const ctx = base.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = ctx.strokeStyle = "#000";
  const drawSpaced = (text: string, cx: number, y: number, px: number, weight: number, spacing: number) => {
    ctx.font = `${weight} ${px}px ${FONT}`;
    ctx.textBaseline = "alphabetic";
    let x = cx - spaced(text, px, weight, spacing) / 2;
    for (const ch of text) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + spacing;
    }
  };
  if (shape === "seal") {
    const r = W / 2;
    ctx.lineWidth = 3.2 * size;
    ctx.beginPath();
    ctx.arc(r, r, r - 2.4 * size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.2 * size;
    ctx.beginPath();
    ctx.arc(r, r, r - 8 * size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r, r, r - 24 * size, 0, Math.PI * 2);
    ctx.stroke();
    if (small) {
      const ring = `${small} · ${small} · `;
      ctx.font = `700 ${tiny}px ${FONT}`;
      const rr = r - 16 * size;
      const total = Math.PI * 2;
      const chars = [...ring];
      const widths = chars.map((ch) => ctx.measureText(ch).width + tiny * 0.12);
      const sum = widths.reduce((a, b) => a + b, 0);
      let a = -Math.PI / 2 - (total * 0.5 * Math.min(1, sum / (rr * total)));
      for (let i = 0; i < chars.length; i++) {
        const step = (widths[i] / sum) * Math.min(total, sum / rr);
        ctx.save();
        ctx.translate(r + Math.cos(a + step / 2) * rr, r + Math.sin(a + step / 2) * rr);
        ctx.rotate(a + step / 2 + Math.PI / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
        a += step;
      }
    }
    drawSpaced(word, r, r + big * 0.36, big, 800, big * 0.06);
  } else {
    const round = 7 * size;
    const rrect = (inset: number, rad: number) => {
      ctx.beginPath();
      ctx.roundRect(inset, inset, W - inset * 2, H - inset * 2, rad);
    };
    ctx.lineWidth = 3.4 * size;
    rrect(2 * size, round);
    ctx.stroke();
    ctx.lineWidth = 1.1 * size;
    rrect(7.5 * size, round - 4 * size);
    ctx.stroke();
    const top = 15 * size;
    drawSpaced(word, W / 2, top + big * 0.86, big, 800, big * 0.06);
    if (small) {
      const y = top + big * 1.05 + tiny + 3 * size;
      drawSpaced(small, W / 2, y, tiny, 700, tiny * 0.14);
    }
  }

  const src = ctx.getImageData(0, 0, pw, ph).data;
  const rand = rng(seed);
  const coarse = valueNoise(pw, ph, 9 * dpr, rand);
  const fine = valueNoise(pw, ph, 2.2 * dpr, rand);
  const lift = valueNoise(pw, ph, 3.5 * dpr, rand);
  const tilt = rand() < 0.5 ? 1 : -1;
  const dryA = new Uint8ClampedArray(pw * ph);
  const wetData = new ImageData(pw, ph);
  const dryData = new ImageData(pw, ph);
  for (let i = 0; i < pw * ph; i++) {
    const a = src[i * 4 + 3] / 255;
    if (a === 0) continue;
    const x = (i % pw) / pw;
    const y = Math.floor(i / pw) / ph;
    const pressure = 0.74 + 0.26 * (tilt > 0 ? 1 - x : x) * (0.75 + 0.25 * y) + (coarse[i] - 0.5) * 0.22;
    const grain = fine[i] * 0.6 + coarse[i] * 0.4;
    const voids = clamp((grain - (0.62 - pressure * 0.32)) * 7, 0, 1);
    const edge = a < 0.9 ? 0.55 + 0.45 * fine[i] : 1;
    const dry = a * clamp(pressure, 0, 1) * (0.25 + 0.75 * voids) * edge;
    const wet = a * clamp(0.9 + (coarse[i] - 0.5) * 0.12, 0, 1);
    dryA[i] = Math.round(dry * 255);
    for (const [data, alpha] of [
      [wetData.data, wet],
      [dryData.data, dry],
    ] as const) {
      data[i * 4] = color[0];
      data[i * 4 + 1] = color[1];
      data[i * 4 + 2] = color[2];
      data[i * 4 + 3] = Math.round(alpha * 255);
    }
  }
  const wetC = document.createElement("canvas");
  wetC.width = pw;
  wetC.height = ph;
  const wctx = wetC.getContext("2d")!;
  wctx.putImageData(wetData, 0, 0);
  wctx.globalCompositeOperation = "source-atop";
  const sheen = wctx.createLinearGradient(0, 0, pw, ph);
  sheen.addColorStop(0.2, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.28)");
  sheen.addColorStop(0.6, "rgba(255,255,255,0)");
  wctx.fillStyle = sheen;
  wctx.fillRect(0, 0, pw, ph);
  const dryC = document.createElement("canvas");
  dryC.width = pw;
  dryC.height = ph;
  dryC.getContext("2d")!.putImageData(dryData, 0, 0);
  return { w: W, h: H, dpr, wet: wetC, dry: dryC, dryAlpha: dryA, lift, color };
}

const TONES: Record<NonNullable<StampProps["tone"]>, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  primary: "text-primary",
  neutral: "text-foreground",
};

export function Stamp({
  children,
  on,
  mark,
  detail,
  shape = "rect",
  tone = "success",
  color,
  position = "center",
  rotate = -9,
  size = 1,
  seed,
  sound = false,
  className = "",
  ...props
}: StampProps) {
  const reduced = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const probeRef = React.useRef<HTMLSpanElement>(null);
  const bgRef = React.useRef<HTMLSpanElement>(null);
  const state = React.useRef({ ink: null as Ink | null, phase: "off" as "off" | "press" | "dry" | "on" | "lift", t0: 0, frame: 0, dark: false, first: true });
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null);
  const [announce, setAnnounce] = React.useState("");

  const paint = React.useCallback((now: number) => {
    const s = state.current;
    const canvas = canvasRef.current;
    const ink = s.ink;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !ink) return false;
    const pw = ink.wet.width;
    const ph = ink.wet.height;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.clearRect(0, 0, pw, ph);
    const t = now - s.t0;
    let busy = false;
    if (s.phase === "press" || s.phase === "dry" || s.phase === "on") {
      const wetness = s.phase === "on" ? 0 : 1 - inOut(clamp(t / DRY_MS, 0, 1));
      if (wetness > 0) busy = true;
      if (wetness < 1) {
        ctx.globalAlpha = 1 - wetness;
        ctx.drawImage(ink.dry, 0, 0);
      }
      if (wetness > 0) {
        ctx.globalAlpha = wetness;
        ctx.drawImage(ink.wet, 0, 0);
      }
      ctx.globalAlpha = 1;
      const k = clamp(t / 170, 0, 1);
      const scale = s.phase === "on" ? 1 : 1.07 - 0.07 * outBack(k);
      canvas.style.opacity = s.phase === "on" ? "1" : String(clamp(t / 40, 0, 1));
      canvas.style.scale = String(scale);
      const root = rootRef.current;
      if (root) {
        const give = s.phase === "on" ? 0 : Math.sin(Math.PI * clamp(t / 180, 0, 1)) * (1 - k * 0.5);
        root.style.scale = give > 0.001 ? String(1 - 0.012 * give) : "";
      }
      if (t < 200) busy = true;
      if (!busy && s.phase !== "on") s.phase = "on";
    } else if (s.phase === "lift") {
      const p = inOut(clamp(t / LIFT_MS, 0, 1));
      const img = ctx.createImageData(pw, ph);
      const d = img.data;
      const [r, g, b] = ink.color;
      for (let i = 0; i < pw * ph; i++) {
        const a = ink.dryAlpha[i];
        if (!a) continue;
        const keep = ink.lift[i] * 0.7 + (a / 255) * 0.3;
        if (keep < p) continue;
        d[i * 4] = r;
        d[i * 4 + 1] = g;
        d[i * 4 + 2] = b;
        d[i * 4 + 3] = a * clamp((keep - p) * 6, 0, 1) * (1 - p * 0.5);
      }
      ctx.putImageData(img, 0, 0);
      canvas.style.scale = "1";
      if (p < 1) busy = true;
      else {
        s.phase = "off";
        canvas.style.opacity = "0";
      }
    } else {
      canvas.style.opacity = "0";
    }
    return busy;
  }, []);

  const run = React.useCallback(() => {
    const s = state.current;
    if (s.frame) return;
    const tick = (now: number) => {
      s.frame = 0;
      if (paint(now)) s.frame = requestAnimationFrame(tick);
    };
    s.frame = requestAnimationFrame(tick);
  }, [paint]);

  React.useEffect(() => {
    const s = state.current;
    const build = () => {
      const c = toRgb(probeRef.current ? getComputedStyle(probeRef.current).color : "", [5, 150, 105]);
      const bg = toRgb(bgRef.current ? getComputedStyle(bgRef.current).color : "", [255, 255, 255]);
      s.dark = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255 < 0.5;
      s.ink = inkFor({ mark, detail, shape, size, color: c, seed: seed ?? `${mark}|${detail ?? ""}`, dpr: Math.min(3, window.devicePixelRatio || 1) });
      setBox((was) => (was && was.w === s.ink!.w && was.h === s.ink!.h ? was : { w: s.ink!.w, h: s.ink!.h }));
      paint(performance.now());
    };
    build();
    const observer = new MutationObserver(build);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", build);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", build);
    };
  }, [mark, detail, shape, size, seed, tone, color, paint]);

  React.useEffect(() => {
    const s = state.current;
    const now = performance.now();
    const first = s.first;
    s.first = false;
    if (on) {
      if (s.phase === "on" || s.phase === "press" || s.phase === "dry") return;
      s.phase = first || reduced ? "on" : "press";
      s.t0 = now;
      if (!first) {
        setAnnounce(`${mark}${detail ? `, ${detail}` : ""}`);
        if (sound) playSound("drop", 0.45);
      }
    } else {
      if (s.phase === "off" || s.phase === "lift") return;
      s.phase = reduced ? "off" : "lift";
      s.t0 = now;
      if (!first) setAnnounce(`${mark} removed`);
    }
    paint(now);
    run();
  }, [on, reduced, mark, detail, sound, paint, run]);

  React.useEffect(() => {
    paint(performance.now());
    run();
  }, [box, paint, run]);

  React.useEffect(() => {
    const s = state.current;
    return () => {
      cancelAnimationFrame(s.frame);
      s.frame = 0;
    };
  }, []);

  const place: React.CSSProperties =
    position === "top-right"
      ? { top: 12, right: 12 }
      : position === "bottom-right"
        ? { bottom: 12, right: 12 }
        : { left: "50%", top: "50%", translate: "-50% -50%" };

  return (
    <div ref={rootRef} className={`relative ${className}`} {...props}>
      <span ref={probeRef} hidden className={color ? undefined : TONES[tone]} style={color ? { color } : undefined} />
      <span ref={bgRef} hidden className="text-background" />
      {children}
      {box && (
        <div aria-hidden className="pointer-events-none absolute z-10" style={{ ...place, width: box.w, height: box.h, rotate: `${rotate}deg` }}>
          <canvas
            ref={canvasRef}
            className="size-full mix-blend-multiply dark:mix-blend-normal"
            style={{ opacity: 0, transformOrigin: "50% 50%", willChange: "scale, opacity" }}
          />
        </div>
      )}
      {on && <span className="sr-only">{`Stamped: ${mark}${detail ? `, ${detail}` : ""}`}</span>}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
export default Stamp;
