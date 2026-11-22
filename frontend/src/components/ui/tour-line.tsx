// Hairline UI · tour-line · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TextMorph } from "./text-morph";
import { createSpring, type Spring } from "./ui-interaction-motion";

export interface TourStep {
  target: string | (() => Element | null);
  title: string;
  body?: React.ReactNode;
}

export interface TourLineProps {
  steps: TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  color?: string;
  doneLabel?: string;
}

type Rect = { x: number; y: number; w: number; h: number; r: number };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-popover";
const PAD = 6;
const CARD_W = 300;
const GAP = 14;

interface Engine {
  rect: Rect | null;
  frame: number;
  moving: boolean;
  springs: { x: Spring; y: Spring; w: Spring; h: Spring; r: Spring } | null;
}

function springsFor(e: Engine, paint: () => void) {
  if (!e.springs) {
    const make = () => createSpring(0, { stiffness: 190, damping: 24 }, paint, 0.05);
    e.springs = { x: make(), y: make(), w: make(), h: make(), r: make() };
  }
  return e.springs;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);
const subscribeNothing = () => () => {};
const useMounted = () => React.useSyncExternalStore(subscribeNothing, () => true, () => false);

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function resolve(target: TourStep["target"]) {
  if (typeof target === "function") return target();
  return document.querySelector(target);
}

function rectOf(el: Element | null): Rect | null {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return { x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, r: Math.min(radius + PAD, (b.height + PAD * 2) / 2, 24) };
}

const outline = (r: Rect) => {
  const k = Math.max(0, Math.min(r.r, r.w / 2, r.h / 2));
  return `M ${r.x + k} ${r.y} H ${r.x + r.w - k} A ${k} ${k} 0 0 1 ${r.x + r.w} ${r.y + k} V ${r.y + r.h - k} A ${k} ${k} 0 0 1 ${r.x + r.w - k} ${r.y + r.h} H ${r.x + k} A ${k} ${k} 0 0 1 ${r.x} ${r.y + r.h - k} V ${r.y + k} A ${k} ${k} 0 0 1 ${r.x + k} ${r.y} Z`;
};

export function TourLine({
  steps,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  color = "var(--primary)",
  doneLabel = "Done",
}: TourLineProps) {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const [ownStep, setOwnStep] = React.useState(defaultStep);
  const open = openProp ?? ownOpen;
  const index = Math.max(0, Math.min(steps.length - 1, stepProp ?? ownStep));
  const step = steps[index];
  const titleId = React.useId();

  const [shown, setShown] = React.useState(false);
  const [card, setCard] = React.useState<{ x: number; y: number; above: boolean } | null>(null);
  const threadRef = React.useRef<SVGPathElement>(null);
  const dimRef = React.useRef<SVGPathElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const now = React.useRef<Engine>({ rect: null, frame: 0, moving: false, springs: null });

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const goTo = (next: number) => {
    if (next < 0 || next >= steps.length) return;
    if (stepProp === undefined) setOwnStep(next);
    onStepChange?.(next);
  };

  const place = React.useCallback((r: Rect) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(CARD_W, vw - 24);
    const height = cardRef.current?.offsetHeight ?? 150;
    const above = r.y + r.h + GAP + height > vh - 12 && r.y - GAP - height > 12;
    const x = Math.max(12, Math.min(r.x, vw - width - 12));
    const y = above ? r.y - GAP - height : Math.min(r.y + r.h + GAP, vh - height - 12);
    setCard((c) => (c && c.x === x && c.y === y && c.above === above ? c : { x, y, above }));
  }, []);

  const rest = React.useCallback((r: Rect) => {
    const thread = threadRef.current;
    const dim = dimRef.current;
    const svg = svgRef.current;
    if (svg) svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    if (thread) {
      thread.setAttribute("d", outline(r));
      thread.style.strokeDasharray = "none";
    }
    if (dim) dim.setAttribute("d", `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z ${outline(r)}`);
  }, []);

  const paintFrame = React.useCallback(() => {
    const e = now.current;
    const sp = e.springs;
    if (!sp) return;
    const r = { x: sp.x.get(), y: sp.y.get(), w: Math.max(4, sp.w.get()), h: Math.max(4, sp.h.get()), r: Math.max(0, sp.r.get()) };
    const thread = threadRef.current;
    const dim = dimRef.current;
    if (thread) {
      thread.setAttribute("d", outline(r));
      thread.style.strokeDasharray = "none";
    }
    if (dim) {
      dim.setAttribute("d", `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z ${outline(r)}`);
      dim.style.opacity = "1";
    }
    const still = [sp.x, sp.y, sp.w, sp.h, sp.r].every((s) => s.getVelocity() === 0 && s.get() === s.getTarget());
    if (still && e.moving && e.rect) {
      e.moving = false;
      rest(e.rect);
    }
  }, [rest]);

  React.useEffect(() => {
    if (!open) return;
    const e = now.current;
    const el = step ? resolve(step.target) : null;
    if (!el) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const to = rectOf(el);
      if (!to) return;
      const from = e.rect;
      setShown(true);
      place(to);
      cancelAnimationFrame(e.frame);
      const thread = threadRef.current;
      const dim = dimRef.current;
      if (!thread || !dim || reduced) {
        e.rect = to;
        rest(to);
        return;
      }
      svgRef.current?.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
      if (from) {
        const sp = springsFor(e, paintFrame);
        e.moving = true;
        sp.x.set(to.x);
        sp.y.set(to.y);
        sp.w.set(to.w);
        sp.h.set(to.h);
        sp.r.set(to.r);
        e.rect = to;
        return;
      }
      const sp = springsFor(e, paintFrame);
      [sp.x, sp.y, sp.w, sp.h, sp.r].forEach((s, i) => s.jump([to.x, to.y, to.w, to.h, to.r][i]));
      thread.setAttribute("d", outline(to));
      const total = thread.getTotalLength();
      thread.style.strokeDasharray = `0.01 ${total + 20}`;
      dim.style.opacity = "0";
      e.moving = true;
      const start = performance.now();
      const tick = (t: number) => {
        const k = inOut(Math.min(1, (t - start) / 620));
        thread.style.strokeDasharray = `${Math.max(0.01, total * k)} ${total + 20}`;
        dim.style.opacity = String(k);
        if (k < 1) e.frame = requestAnimationFrame(tick);
        else {
          e.moving = false;
          e.rect = to;
          rest(to);
        }
      };
      e.frame = requestAnimationFrame(tick);
    };
    const b = el.getBoundingClientRect();
    const inView = b.top >= 0 && b.bottom <= window.innerHeight && b.left >= 0 && b.right <= window.innerWidth;
    if (inView) run();
    else {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      const timer = window.setTimeout(run, reduced ? 0 : 420);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [open, step, reduced, place, rest, paintFrame]);

  React.useEffect(() => {
    if (open || !shown) return;
    const e = now.current;
    const thread = threadRef.current;
    const dim = dimRef.current;
    cancelAnimationFrame(e.frame);
    if (e.springs) Object.values(e.springs).forEach((sp) => sp.stop());
    e.moving = false;
    if (!thread || !dim || reduced || !e.rect) {
      e.rect = null;
      const t = window.setTimeout(() => setShown(false), 0);
      return () => window.clearTimeout(t);
    }
    const total = thread.getTotalLength();
    const start = performance.now();
    const tick = (t: number) => {
      const k = inOut(Math.min(1, (t - start) / 420));
      thread.style.strokeDasharray = `0 ${total * k} ${Math.max(0.01, total * (1 - k))} ${total + 20}`;
      dim.style.opacity = String(1 - k);
      if (k < 1) e.frame = requestAnimationFrame(tick);
      else {
        e.rect = null;
        setShown(false);
      }
    };
    e.frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(e.frame);
  }, [open, shown, reduced]);

  React.useEffect(() => {
    if (!open) return;
    const follow = () => {
      const e = now.current;
      if (e.moving || !step) return;
      const r = rectOf(resolve(step.target));
      if (!r) return;
      e.rect = r;
      rest(r);
      place(r);
    };
    window.addEventListener("scroll", follow, { passive: true, capture: true });
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, { capture: true });
      window.removeEventListener("resize", follow);
    };
  }, [open, step, rest, place]);

  React.useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const focusPending = React.useRef(false);
  React.useEffect(() => {
    if (open) focusPending.current = true;
  }, [open]);
  React.useEffect(() => {
    if (!open || !card || !focusPending.current) return;
    focusPending.current = false;
    cardRef.current?.focus({ preventScroll: true });
  }, [open, card]);

  React.useEffect(() => {
    const e = now.current;
    return () => {
      cancelAnimationFrame(e.frame);
      if (e.springs) Object.values(e.springs).forEach((sp) => sp.stop());
      e.springs = null;
    };
  }, []);

  if (!mounted || (!open && !shown)) return null;
  const last = index === steps.length - 1;
  const dimFill = `color-mix(in oklab, black ${26}%, transparent)`;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <svg ref={svgRef} aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
        <path ref={dimRef} fillRule="evenodd" style={{ fill: dimFill, opacity: 0 }} />
        <path ref={threadRef} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {step && (
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="pointer-events-auto absolute left-0 top-0 rounded-[16px] bg-popover p-4 text-popover-foreground shadow-[0_0_0_1px_var(--border)] outline-none"
          style={{
            width: `min(${CARD_W}px, calc(100vw - 24px))`,
            transform: card ? `translate3d(${card.x}px, ${card.y}px, 0)` : "translate3d(-9999px,0,0)",
            opacity: open && card ? 1 : 0,
            transition: reduced ? "none" : `transform 620ms ${EASE}, opacity 260ms ${EASE}`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11.5px] font-medium tabular-nums" style={{ color }}>
              <TextMorph>{`Step ${index + 1} of ${steps.length}`}</TextMorph>
            </p>
            <button
              type="button"
              aria-label="Close tour"
              onClick={() => setOpen(false)}
              className={`-m-1 flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <h2 id={titleId} className="mt-1 text-[15px] font-medium tracking-[-0.01em] text-foreground">
            <TextMorph>{step.title}</TextMorph>
          </h2>
          {step.body && (
            <div key={index} className="mt-1 text-[13px] leading-[1.5] text-muted-foreground motion-safe:animate-[ui-fade-in_320ms_ease-out_80ms_backwards]">
              {step.body}
            </div>
          )}
          <div className="mt-3.5 flex items-center justify-between gap-2">
            <div className="flex gap-1" aria-hidden="true">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-[width,background-color] duration-500"
                  style={{ width: i === index ? 14 : 4, background: i <= index ? color : "color-mix(in oklab, var(--foreground) 16%, transparent)", transitionTimingFunction: EASE }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className={`h-8 cursor-pointer rounded-full px-3 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => (last ? setOpen(false) : goTo(index + 1))}
                className={`h-8 cursor-pointer rounded-full bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-[scale] duration-200 active:scale-[0.97] ${FOCUS}`}
              >
                <TextMorph>{last ? doneLabel : "Next"}</TextMorph>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

export default TourLine;
