// Hairline UI · hold-to-start · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { LightSurface, clamp, useLightReducedMotion, type LightPalette, type LightPaletteName, type LightPoint, type LightSurfaceHandle } from "./light-surface";
import { TextMorph } from "./text-morph";
import { INTERACTION_FOCUS } from "./ui-interaction-motion";

export interface HoldToStartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  active: boolean;
  onActiveChange: (active: boolean) => void;
  onHoldComplete?: () => void;
  children: React.ReactNode;
  label?: string;
  activeLabel?: string;
  holdingLabel?: string;
  hint?: string;
  holdMs?: number;
  holdToEnd?: boolean;
  palette?: LightPaletteName | LightPalette;
}

const GRACE = 140;

export function HoldToStart({
  active,
  onActiveChange,
  onHoldComplete,
  children,
  label = "Start",
  activeLabel = "End",
  holdingLabel = "Keep holding",
  hint = "Hold to start",
  holdMs = 900,
  holdToEnd = false,
  palette = "prism",
  className = "",
  ...props
}: HoldToStartProps) {
  const surface = React.useRef<LightSurfaceHandle>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const fill = React.useRef<HTMLSpanElement>(null);
  const hold = React.useRef<{ start: number; origin: LightPoint; raf: number; fired: boolean } | null>(null);
  const hintTimer = React.useRef(0);
  const reduced = useLightReducedMotion();
  const [phase, setPhase] = React.useState<"rest" | "holding" | "hint">("rest");
  const needsHold = !active || holdToEnd;
  const live = React.useRef({ active, onActiveChange, onHoldComplete });
  React.useLayoutEffect(() => {
    live.current = { active, onActiveChange, onHoldComplete };
  });

  React.useEffect(
    () => () => {
      if (hold.current) cancelAnimationFrame(hold.current.raf);
      window.clearTimeout(hintTimer.current);
    },
    [],
  );

  const setFill = (p: number, animate: boolean) => {
    const el = fill.current;
    if (!el) return;
    el.style.transition = animate && !reduced ? "transform 260ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease-out" : "none";
    el.style.transform = `scaleX(${p})`;
    el.style.opacity = p > 0 ? "1" : "0";
  };

  const originOf = (clientX?: number, clientY?: number): LightPoint => {
    const card = surface.current?.element();
    const btn = button.current;
    if (!card) return { x: 0.5, y: 0.88 };
    const c = card.getBoundingClientRect();
    let x = clientX;
    let y = clientY;
    if (x === undefined || y === undefined || (x === 0 && y === 0)) {
      const b = btn?.getBoundingClientRect();
      x = b ? b.left + b.width / 2 : c.left + c.width / 2;
      y = b ? b.top + b.height / 2 : c.bottom;
    }
    return { x: clamp((x - c.left) / c.width, 0.06, 0.94), y: clamp((y - c.top) / c.height, 0.06, 0.96) };
  };

  const fire = (origin: LightPoint) => {
    const next = !live.current.active;
    surface.current?.charge(0);
    setFill(0, true);
    setPhase("rest");
    const s = surface.current;
    if (!s) return live.current.onActiveChange(next);
    s.wave({ direction: "radial", origin, onMidpoint: () => live.current.onActiveChange(next) });
  };

  const begin = (origin: LightPoint) => {
    if (hold.current) return;
    window.clearTimeout(hintTimer.current);
    const h = { start: performance.now(), origin, raf: 0, fired: false };
    hold.current = h;
    const step = (now: number) => {
      if (hold.current !== h) return;
      const elapsed = now - h.start;
      if (elapsed > GRACE) {
        const p = clamp((elapsed - GRACE) / (holdMs - GRACE), 0, 1);
        setPhase("holding");
        surface.current?.charge(p, h.origin);
        setFill(p, false);
        if (p >= 1) {
          h.fired = true;
          hold.current = null;
          live.current.onHoldComplete?.();
          fire(h.origin);
          return;
        }
      }
      h.raf = requestAnimationFrame(step);
    };
    h.raf = requestAnimationFrame(step);
  };

  const end = (commitTap: boolean) => {
    const h = hold.current;
    if (!h) return;
    hold.current = null;
    cancelAnimationFrame(h.raf);
    if (h.fired) return;
    surface.current?.charge(0);
    setFill(0, true);
    const tap = performance.now() - h.start <= GRACE + 60;
    if (!commitTap) return setPhase("rest");
    if (!needsHold) return fire(h.origin);
    if (tap) {
      setPhase("hint");
      surface.current?.charge(0.22, h.origin);
      window.setTimeout(() => surface.current?.charge(0), 120);
      hintTimer.current = window.setTimeout(() => setPhase("rest"), 1400);
      return;
    }
    setPhase("rest");
  };

  const text = phase === "holding" ? holdingLabel : phase === "hint" ? hint : active ? activeLabel : label;

  return (
    <LightSurface ref={surface} palette={palette} direction="radial" lit={active} className={`flex flex-col rounded-[30px] ${className}`} {...props}>
      <div className="flex h-full flex-col px-6 pb-6 pt-7">
        <div className="flex-1">{children}</div>
        <button
          ref={button}
          type="button"
          aria-pressed={active}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            begin(originOf(e.clientX, e.clientY));
          }}
          onPointerUp={() => end(true)}
          onPointerCancel={() => end(false)}
          onLostPointerCapture={() => end(false)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
              e.preventDefault();
              begin(originOf());
            }
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              end(true);
            }
          }}
          onBlur={() => end(false)}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.detail === 0 && !hold.current) fire(originOf());
          }}
          className={`relative mt-6 flex h-[50px] w-full cursor-pointer touch-none select-none items-center justify-center overflow-clip rounded-full bg-primary px-6 text-[15px] font-medium tracking-[-0.01em] text-primary-foreground [-webkit-touch-callout:none] transition-[scale] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] motion-reduce:active:scale-100 ${INTERACTION_FOCUS}`}
        >
          <span
            ref={fill}
            aria-hidden
            className="pointer-events-none absolute inset-0 origin-left opacity-0"
            style={{ transform: "scaleX(0)", background: "linear-gradient(90deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.3))" }}
          />
          <TextMorph className="relative">{text}</TextMorph>
          {needsHold && <span className="sr-only">. Press and hold to {active ? "end" : "start"}.</span>}
        </button>
      </div>
    </LightSurface>
  );
}
export default HoldToStart;
