// Hairline UI · signature-pad · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { Check, Keyboard, PenLine } from "lucide-react";
import { TextMorph } from "./text-morph";

export interface SignatureResult {
  svg: string;
  dataUrl: string;
  typed?: string;
  signedAt: Date;
}

export interface SignaturePadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  name?: string;
  onSign?: (result: SignatureResult) => Promise<unknown> | void;
  onClear?: () => void;
  label?: string;
  ink?: string;
  locale?: string;
}

type Seg = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; w: number };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const PAD_H = 168;
const SIGNED_H = 96;
const SCRIPT = '"Snell Roundhand", "Segoe Script", "Brush Script MT", "Apple Chancery", cursive';

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);
const subscribeNothing = () => () => {};
const useHydrated = () => React.useSyncExternalStore(subscribeNothing, () => true, () => false);

function readColors(probe: HTMLElement | null, sheen: HTMLElement | null) {
  return {
    ink: probe ? getComputedStyle(probe).color : "#1f2a44",
    sheen: sheen ? getComputedStyle(sheen).color : "#fff",
  };
}

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function SignaturePad({ name, onSign, onClear, label = "Sign here", ink = "color-mix(in oklab, var(--chart-1, var(--primary)) 38%, var(--foreground))", locale, className = "", ...props }: SignaturePadProps) {
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const [phase, setPhase] = React.useState<"empty" | "inked" | "drying" | "signed">("empty");
  const [typing, setTyping] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [result, setResult] = React.useState<SignatureResult | null>(null);
  const [said, setSaid] = React.useState("");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const probeRef = React.useRef<HTMLSpanElement>(null);
  const sheenRef = React.useRef<HTMLSpanElement>(null);
  const ink$ = React.useRef({ segs: [] as Seg[], strokes: [] as number[], wet: 0, frame: 0, length: 0 });
  const pen = React.useRef<{ x: number; y: number; t: number; w: number; mx: number; my: number } | null>(null);
  const from = React.useRef<DOMRect | null>(null);

  const colors = () => readColors(probeRef.current, sheenRef.current);

  const draw = React.useCallback((count: number, dry: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const { ink: inkColor, sheen } = readColors(probeRef.current, sheenRef.current);
    const segs = ink$.current.segs;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = inkColor;
    for (let i = 0; i < Math.min(count, segs.length); i++) {
      const s = segs[i];
      ctx.lineWidth = s.w;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1);
      ctx.stroke();
    }
    ctx.strokeStyle = sheen;
    ctx.globalAlpha = 0.3;
    for (let i = Math.max(0, dry); i < Math.min(count, segs.length); i++) {
      const s = segs[i];
      const o = s.w * 0.16;
      ctx.lineWidth = Math.max(0.4, s.w * 0.2);
      ctx.beginPath();
      ctx.moveTo(s.x0 - o, s.y0 - o);
      ctx.quadraticCurveTo(s.cx - o, s.cy - o, s.x1 - o, s.y1 - o);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw(ink$.current.segs.length, ink$.current.wet));
    observer.observe(canvas);
    const theme = new MutationObserver(() => draw(ink$.current.segs.length, ink$.current.wet));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    return () => {
      observer.disconnect();
      theme.disconnect();
    };
  }, [draw, phase, typing]);

  React.useEffect(() => {
    const I = ink$.current;
    return () => cancelAnimationFrame(I.frame);
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    if (phase === "drying" || phase === "signed" || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = point(e);
    pen.current = { x: p.x, y: p.y, t: e.timeStamp, w: 3, mx: p.x, my: p.y };
    ink$.current.strokes.push(ink$.current.segs.length);
    ink$.current.segs.push({ x0: p.x, y0: p.y, cx: p.x, cy: p.y, x1: p.x + 0.1, y1: p.y, w: 2.6 });
    draw(ink$.current.segs.length, 0);
  };
  const move = (e: React.PointerEvent) => {
    const last = pen.current;
    if (!last) return;
    const events = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [e.nativeEvent];
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist < 1.2) continue;
      const dt = Math.max(1, ev.timeStamp - last.t);
      const speed = dist / dt;
      const target = Math.max(1.1, Math.min(3.6, 3.8 - speed * 1.1));
      const w = last.w + (target - last.w) * 0.35;
      const mx = (last.x + x) / 2;
      const my = (last.y + y) / 2;
      ink$.current.segs.push({ x0: last.mx, y0: last.my, cx: last.x, cy: last.y, x1: mx, y1: my, w });
      ink$.current.length += dist;
      pen.current = { x, y, t: ev.timeStamp, w, mx, my };
    }
    draw(ink$.current.segs.length, 0);
  };
  const up = () => {
    if (!pen.current) return;
    pen.current = null;
    if (ink$.current.length > 30 && phase === "empty") setPhase("inked");
  };

  const clear = (now = false) => {
    const I = ink$.current;
    cancelAnimationFrame(I.frame);
    const total = I.segs.length;
    const finish = () => {
      I.segs = [];
      I.strokes = [];
      I.length = 0;
      I.wet = 0;
      draw(0, 0);
      setPhase("empty");
      setResult(null);
      onClear?.();
    };
    if (now || reduced || !total) return finish();
    const start = performance.now();
    const duration = Math.min(760, 220 + total * 2.4);
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      draw(Math.round(total * (1 - inOut(k))), 0);
      if (k < 1) I.frame = requestAnimationFrame(tick);
      else finish();
    };
    I.frame = requestAnimationFrame(tick);
  };

  const exportInk = (): { svg: string; dataUrl: string } => {
    const segs = ink$.current.segs;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, pad = 0;
    segs.forEach((s) => {
      x0 = Math.min(x0, s.x0, s.x1, s.cx);
      y0 = Math.min(y0, s.y0, s.y1, s.cy);
      x1 = Math.max(x1, s.x0, s.x1, s.cx);
      y1 = Math.max(y1, s.y0, s.y1, s.cy);
      pad = Math.max(pad, s.w);
    });
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const w = Math.max(1, Math.ceil(x1 - x0));
    const h = Math.max(1, Math.ceil(y1 - y0));
    const { ink: inkColor } = colors();
    const paths = segs
      .map((s) => `<path d="M${(s.x0 - x0).toFixed(1)} ${(s.y0 - y0).toFixed(1)}Q${(s.cx - x0).toFixed(1)} ${(s.cy - y0).toFixed(1)} ${(s.x1 - x0).toFixed(1)} ${(s.y1 - y0).toFixed(1)}" stroke-width="${s.w.toFixed(2)}"/>`)
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><g fill="none" stroke="${inkColor}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
    const out = document.createElement("canvas");
    out.width = w * 2; out.height = h * 2;
    const ctx = out.getContext("2d");
    if (ctx) {
      ctx.scale(2, 2);
      ctx.translate(-x0, -y0);
      ctx.strokeStyle = inkColor;
      ctx.lineCap = "round";
      segs.forEach((s) => {
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1);
        ctx.stroke();
      });
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const r = canvas.getBoundingClientRect();
      from.current = new DOMRect(r.left + x0, r.top + y0, w, h);
    }
    return { svg, dataUrl: out.toDataURL("image/png") };
  };

  const exportTyped = (text: string): { svg: string; dataUrl: string } => {
    const { ink: inkColor } = colors();
    const out = document.createElement("canvas");
    const ctx = out.getContext("2d");
    const size = 44;
    let width = 300;
    if (ctx) {
      ctx.font = `${size}px ${SCRIPT}`;
      width = Math.ceil(ctx.measureText(text).width + 16);
      out.width = width * 2; out.height = (size + 24) * 2;
      ctx.scale(2, 2);
      ctx.font = `${size}px ${SCRIPT}`;
      ctx.fillStyle = inkColor;
      ctx.textBaseline = "middle";
      ctx.fillText(text, 8, (size + 24) / 2);
    }
    const esc = text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${size + 24}" width="${width}" height="${size + 24}"><text x="8" y="${(size + 24) / 2}" dominant-baseline="middle" font-size="${size}" font-family='${SCRIPT}' fill="${inkColor}">${esc}</text></svg>`;
    from.current = null;
    return { svg, dataUrl: out.toDataURL("image/png") };
  };

  const accept = () => {
    if (phase !== "inked" && !(typing && typed.trim())) return;
    const signedAt = new Date();
    const finish = (out: { svg: string; dataUrl: string }) => {
      const r: SignatureResult = { ...out, signedAt, ...(typing ? { typed: typed.trim() } : {}) };
      setResult(r);
      setPhase("signed");
      setSaid(`Signed${name ? ` by ${name}` : ""}.`);
      let pending: unknown;
      try {
        pending = onSign?.(r);
      } catch {
        refuse();
        return;
      }
      if (pending && typeof (pending as Promise<unknown>).then === "function") (pending as Promise<unknown>).then(undefined, refuse);
    };
    const refuse = () => {
      setPhase(typing ? "empty" : "inked");
      setResult(null);
      setSaid("Couldn’t save the signature. Try again.");
      if (!reduced) rootRef.current?.animate([{ translate: "0 0" }, { translate: "-4px 0" }, { translate: "4px 0" }, { translate: "-2px 0" }, { translate: "0 0" }], { duration: 380, easing: "ease-out" });
      requestAnimationFrame(() => draw(ink$.current.segs.length, ink$.current.segs.length));
    };
    if (typing) {
      finish(exportTyped(typed.trim()));
      return;
    }
    const I = ink$.current;
    if (reduced) {
      I.wet = I.segs.length;
      draw(I.segs.length, I.segs.length);
      finish(exportInk());
      return;
    }
    setPhase("drying");
    const total = I.segs.length;
    const start = performance.now();
    const duration = Math.min(900, 300 + total * 2);
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      I.wet = Math.round(total * inOut(k));
      draw(total, I.wet);
      if (k < 1) I.frame = requestAnimationFrame(tick);
      else finish(exportInk());
    };
    I.frame = requestAnimationFrame(tick);
  };

  React.useLayoutEffect(() => {
    if (phase !== "signed" || !result || reduced) return;
    const img = imgRef.current;
    const start = from.current;
    from.current = null;
    if (!img || !start) return;
    img.style.opacity = "0";
    let live = true;
    img
      .decode()
      .catch(() => {})
      .then(() => {
        if (!live) return;
        img.style.opacity = "";
        const end = img.getBoundingClientRect();
        if (!end.width || !end.height) return;
        img.animate(
          [
            { transformOrigin: "0 0", transform: `translate(${start.left - end.left}px, ${start.top - end.top}px) scale(${start.width / end.width}, ${start.height / end.height})` },
            { transformOrigin: "0 0", transform: "none" },
          ],
          { duration: 620, easing: EASE },
        );
      });
    return () => {
      live = false;
      img.style.opacity = "";
    };
  }, [phase, result, reduced]);

  const when = result
    ? result.signedAt.toLocaleString(hydrated ? locale : "en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
  const signed = phase === "signed" && result;

  return (
    <div
      ref={rootRef}
      className={`@container w-full overflow-clip rounded-[20px] bg-background shadow-[0_0_0_1px_var(--border)] transition-[height] duration-500 ${className}`}
      style={{ height: (signed ? SIGNED_H : PAD_H) + 52, transitionTimingFunction: EASE }}
      {...props}
    >
      <div aria-hidden="true" data-natural-width className="grid h-0" style={{ gridTemplateColumns: "minmax(0, 420px)" }} />
      <span ref={probeRef} aria-hidden="true" className="hidden" style={{ color: ink }} />
      <span ref={sheenRef} aria-hidden="true" className="hidden text-background" />

      {signed ? (
        <div className="flex h-full flex-col justify-between p-4">
          <div className="relative flex h-[52px] items-end border-b border-dashed" style={{ borderColor: "color-mix(in oklab, var(--foreground) 22%, var(--border))" }}>
            <img ref={imgRef} src={result.dataUrl} alt={name ? `Signature of ${name}` : "Signature"} className="mb-[-6px] h-[52px] w-auto max-w-[70%] object-contain object-left-bottom" />
            <span className="ml-auto mb-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
              Signed
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="min-w-0 text-[12px] leading-snug text-muted-foreground">
              {name && <span className="block truncate font-medium text-foreground">{name}</span>}
              <span className="tabular-nums">{when}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setTyping(false);
                setTyped("");
                clear(true);
              }}
              className={`shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}
            >
              Sign again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative" style={{ height: PAD_H }}>
            {typing ? (
              <div className="flex h-full flex-col justify-center px-5">
                <input
                  ref={(el) => el?.focus({ preventScroll: true })}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && accept()}
                  aria-label="Type your full name"
                  placeholder="Your full name"
                  className="w-full bg-transparent text-[36px] leading-tight outline-none placeholder:text-[16px] placeholder:text-muted-foreground"
                  style={{ fontFamily: SCRIPT, color: ink }}
                />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={phase === "empty" ? "Signature pad, empty" : "Your signature"}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                className="absolute inset-0 size-full cursor-crosshair touch-none"
              />
            )}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-9 flex items-end gap-2">
              <span className="pb-0.5 text-[16px] text-muted-foreground">×</span>
              <span className="mb-1.5 h-px flex-1" style={{ background: "color-mix(in oklab, var(--foreground) 22%, var(--border))" }} />
            </div>
            <p
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11.5px] text-muted-foreground transition-opacity duration-300"
              style={{ opacity: phase === "empty" && !typing ? 1 : 0 }}
            >
              {label}
            </p>
          </div>
          <div className="flex h-[52px] items-center justify-between gap-1 border-t border-border px-2 sm:px-3">
            <button
              type="button"
              onClick={() => {
                setTyping((t) => !t);
                setTyped("");
                if (!typing) clear(true);
              }}
              className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}
            >
              {typing ? <PenLine className="size-3.5" aria-hidden="true" /> : <Keyboard className="size-3.5" aria-hidden="true" />}
              <span className="@[17rem]:hidden">{typing ? "Draw" : "Type"}</span>
              <span className="hidden @[17rem]:inline">
                <TextMorph>{typing ? "Draw instead" : "Type instead"}</TextMorph>
              </span>
            </button>
            <div className="flex items-center gap-1.5">
              {!typing && (
                <button
                  type="button"
                  onClick={() => clear()}
                  disabled={phase === "empty" || phase === "drying"}
                  className={`h-8 cursor-pointer rounded-full px-2.5 text-[12.5px] text-muted-foreground transition-[color,opacity] hover:text-foreground disabled:cursor-default disabled:opacity-40 ${FOCUS}`}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={accept}
                disabled={(phase !== "inked" && !typed.trim()) || phase === "drying"}
                className={`h-8 cursor-pointer rounded-full bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition-[background-color,opacity] hover:bg-primary/90 disabled:cursor-default disabled:opacity-40 ${FOCUS}`}
              >
                Accept
              </button>
            </div>
          </div>
        </>
      )}
      <span className="sr-only" role="status">
        {said}
      </span>
    </div>
  );
}
export default SignaturePad;
