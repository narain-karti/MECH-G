// Hairline UI · logo-marquee · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";

export interface LogoMarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  logos: React.ReactNode[];
  speed?: number;
  gap?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

export function LogoMarquee({
  logos,
  speed = 40,
  gap = 64,
  direction = "left",
  pauseOnHover = true,
  className = "",
  ...props
}: LogoMarqueeProps) {
  const reduced = useReducedMotion();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const animation = React.useRef<Animation | null>(null);
  const tween = React.useRef(0);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced) return;
    const set = () => track.scrollWidth / 2;
    const keyframes =
      direction === "left"
        ? [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }]
        : [{ transform: "translateX(-50%)" }, { transform: "translateX(0)" }];
    const a = track.animate(keyframes, {
      duration: (set() / speed) * 1000,
      iterations: Infinity,
      easing: "linear",
    });
    animation.current = a;
    const observer = new ResizeObserver(() => a.effect?.updateTiming({ duration: (set() / speed) * 1000 }));
    observer.observe(track);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(tween.current);
      a.cancel();
      animation.current = null;
    };
  }, [speed, direction, reduced, logos.length]);

  const easeTo = (target: number) => {
    const a = animation.current;
    if (!a) return;
    cancelAnimationFrame(tween.current);
    const from = a.playbackRate;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      const eased = 1 - Math.pow(1 - t, 3);
      a.playbackRate = t < 1 ? Math.max(0, from + (target - from) * eased) : target;
      if (t < 1) tween.current = requestAnimationFrame(step);
    };
    tween.current = requestAnimationFrame(step);
  };

  const items = (copy: number) =>
    logos.map((logo, i) => (
      <li
        key={`${copy}-${i}`}
        aria-hidden={copy > 0 || undefined}
        className="flex shrink-0 items-center text-[#71717A] hover:text-[#22D3EE] transition-colors duration-300"
        style={{ marginRight: gap }}
      >
        {logo}
      </li>
    ));

  if (reduced) {
    return (
      <div className={`w-full ${className}`} {...props}>
        <ul className="flex flex-wrap items-center justify-center gap-y-6" style={{ columnGap: gap }}>
          {logos.map((logo, i) => (
            <li key={i} className="flex items-center text-[#71717A]">
              {logo}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={`group/marquee w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] ${className}`}
      onPointerEnter={() => pauseOnHover && easeTo(0)}
      onPointerLeave={() => pauseOnHover && easeTo(1)}
      {...props}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        <ul className="flex shrink-0 items-center">{items(0)}</ul>
        <ul aria-hidden="true" className="flex shrink-0 items-center">
          {items(1)}
        </ul>
      </div>
    </div>
  );
}
