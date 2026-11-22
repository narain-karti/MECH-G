// Hairline UI · notification-bell · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { INTERACTION_FOCUS, INTERACTION_PRESS, MATERIAL_LIFT, createSpring, useInteractionReducedMotion, type Spring } from "./ui-interaction-motion";

export interface NotificationBellProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  count?: number;
  max?: number;
  variant?: "count" | "dot";
  size?: number;
  label?: string;
  ringKey?: string | number;
}

const SWING = { stiffness: 150, damping: 3.4 };
const CLAPPER = { stiffness: 210, damping: 8 };
const BADGE = { stiffness: 420, damping: 15 };
const HIT = 210;
const HIT_MOST = 360;
const FASTEST = 480;
const CLAPPER_LAG = 0.058;
const CLAPPER_MOST = 24;
const BADGE_LEAN = 0.11;

const BELL = "M12 2.2a1.35 1.35 0 0 0-1.33 1.59C7.87 4.42 6 6.87 6 9.9v2.72c0 1.1-.46 2.16-1.27 2.91l-.52.48c-.84.78-.29 2.19.86 2.19h13.86c1.15 0 1.7-1.41.86-2.19l-.52-.48A3.97 3.97 0 0 1 18 12.62V9.9c0-3.03-1.87-5.48-4.67-6.11A1.35 1.35 0 0 0 12 2.2Z";

const clamp = (n: number, limit: number) => Math.max(-limit, Math.min(limit, n));
const ROLL_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 0, useGrouping: false };

export function NotificationBell({ count = 0, max = 99, variant = "count", size = 44, label = "Notifications", ringKey, className = "", style, onPointerEnter, ...props }: NotificationBellProps) {
  const reduced = useInteractionReducedMotion();
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

  const bodyRef = React.useRef<SVGGElement>(null);
  const clapperRef = React.useRef<SVGGElement>(null);
  const badgeRef = React.useRef<HTMLSpanElement>(null);
  const shineId = React.useId();
  const springs = React.useRef<{ swing: Spring; clapper: Spring; badge: Spring } | null>(null);

  const [shown, setShown] = React.useState(total);
  if (total > 0 && total !== shown) setShown(total);

  const previous = React.useRef(total);

  React.useLayoutEffect(() => {
    const paint = () => {
      const s = springs.current;
      if (!s) return;
      const swing = s.swing.get();
      bodyRef.current?.setAttribute("transform", `rotate(${swing.toFixed(2)} 12 3.4)`);
      s.clapper.set(clamp(-s.swing.getVelocity() * CLAPPER_LAG, CLAPPER_MOST));
      clapperRef.current?.setAttribute("transform", `rotate(${s.clapper.get().toFixed(2)} 12 17)`);
      const badge = badgeRef.current;
      if (badge) {
        const scale = Math.max(0, s.badge.get());
        badge.style.transform = `translate3d(${(-swing * BADGE_LEAN).toFixed(2)}px, 0, 0) scale(${scale.toFixed(3)})`;
        badge.style.opacity = `${Math.min(1, scale * 2.5)}`;
      }
    };
    const s = {
      swing: createSpring(0, SWING, paint, 0.02),
      clapper: createSpring(0, CLAPPER, paint, 0.02),
      badge: createSpring(previous.current > 0 ? 1 : 0, BADGE, paint, 0.002),
    };
    springs.current = s;
    paint();
    return () => {
      s.swing.stop();
      s.clapper.stop();
      s.badge.stop();
      springs.current = null;
    };
  }, []);

  const hit = React.useCallback((strength: number) => {
    const s = springs.current;
    if (!s) return;
    const moving = s.swing.getVelocity();
    const along = moving === 0 ? (s.swing.get() > 0 ? -1 : 1) : Math.sign(moving);
    s.swing.push(clamp(moving + along * strength, FASTEST) - moving);
  }, []);

  React.useEffect(() => {
    const s = springs.current;
    const delta = total - previous.current;
    previous.current = total;
    if (!s) return;
    if (reduced) {
      s.badge.jump(total > 0 ? 1 : 0);
      return;
    }
    s.badge.set(total > 0 ? 1 : 0);
    if (delta <= 0) return;
    hit(HIT + (HIT_MOST - HIT) * (Math.min(delta, 5) / 5));
    s.badge.push(Math.min(delta, 5) * 0.9 + 2.4);
  }, [total, reduced, hit]);

  const lastRing = React.useRef(ringKey);
  React.useEffect(() => {
    if (lastRing.current === ringKey) return;
    lastRing.current = ringKey;
    if (!reduced) hit(HIT);
  }, [ringKey, reduced, hit]);

  const dot = variant === "dot";
  const name = total > 0 ? `${label}, ${total} unread` : label;
  const over = shown > max;
  const badgeSize = size * (dot ? 0.24 : 0.42);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={name}
        {...props}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.pointerType === "mouse" && !reduced && Math.abs(springs.current?.swing.getVelocity() ?? 0) < 40) hit(46);
        }}
        className={`relative grid cursor-pointer place-items-center rounded-full bg-[linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--foreground)_4%,var(--background)))] text-foreground ${MATERIAL_LIFT} ${INTERACTION_PRESS} ${INTERACTION_FOCUS} ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="overflow-visible [contain:layout]" style={{ width: size * 0.58, height: size * 0.58 }}>
          <defs>
            <linearGradient id={shineId} x1="0" x2="1" y1="0" y2="0.18">
              <stop offset="0.08" stopColor="var(--background)" stopOpacity="0.06" />
              <stop offset="0.3" stopColor="var(--background)" stopOpacity="0.5" />
              <stop offset="0.5" stopColor="var(--background)" stopOpacity="0.12" />
              <stop offset="1" stopColor="var(--background)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g ref={bodyRef}>
            <g ref={clapperRef}>
              <path d="M12 16.5v3.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              <circle cx="12" cy="20.6" r="1.95" fill="var(--primary)" />
            </g>
            <path fill="currentColor" d={BELL} />
            <path fill={`url(#${shineId})`} d={BELL} />
            <path d="M5.2 16.3c1.6.5 3.9.8 6.8.8s5.2-.3 6.8-.8" fill="none" stroke="var(--background)" strokeOpacity="0.34" strokeWidth="0.7" strokeLinecap="round" />
          </g>
        </svg>
      </button>

      <span
        ref={badgeRef}
        aria-hidden="true"
        className="pointer-events-none absolute grid origin-center place-items-center rounded-full bg-primary font-semibold leading-none text-primary-foreground will-change-transform"
        style={{
          right: dot ? size * 0.15 : size * 0.02,
          top: dot ? size * 0.13 : size * -0.04,
          height: badgeSize,
          minWidth: badgeSize,
          padding: dot ? 0 : `0 ${size * 0.08}px`,
          fontSize: size * 0.235,
          boxShadow: "0 0 0 2px var(--background)",
          transform: "scale(0)",
        }}
      >
        {!dot && <NumberRoll value={Math.min(shown, max)} format={ROLL_FORMAT} suffix={over ? "+" : ""} duration={620} />}
      </span>

      <span role="status" className="sr-only">
        {total > 0 ? `${total} unread` : ""}
      </span>
    </span>
  );
}

export default NotificationBell;
