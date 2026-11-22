// Hairline UI · stats-band · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";

export interface Stat {
  value: number;
  label: string;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
}

export interface StatsBandProps extends React.HTMLAttributes<HTMLDListElement> {
  stats: Stat[];
  stagger?: number;
  numberClassName?: string;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

export function StatsBand({
  stats,
  stagger = 140,
  numberClassName = "text-[26px] sm:text-[32px] md:text-[38px] lg:text-[42px] font-extrabold leading-[1.15] tracking-tight font-mono text-white",
  className = "",
  ...props
}: StatsBandProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDListElement>(null);
  const [seen, setSeen] = React.useState(false);
  const [revealed, setRevealed] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!seen || reduced) return;
    const timers = stats.map((_, i) =>
      window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 200 + i * stagger)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [seen, reduced, stats, stagger]);

  return (
    <div className="w-full">
      <dl
        ref={ref}
        className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 ${className}`}
        {...props}
      >
        {stats.map((stat, i) => {
          const shown = i < (seen && reduced ? stats.length : revealed);
          return (
            <div
              key={stat.label}
              className="relative flex flex-col justify-end px-3 py-4 sm:px-6 sm:py-5 border-t border-[#27272A]/50 md:border-t-0"
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 hidden w-px origin-center bg-[#27272A]/70 md:block"
                  style={{
                    transform: seen || reduced ? "none" : "scaleY(0)",
                    transition: reduced ? "none" : `transform 700ms ${EASE} ${i * 80}ms`,
                  }}
                />
              )}
              <dt
                className="mt-2 text-xs sm:text-sm font-medium text-[#A1A1AA]"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "none" : "translateY(6px)",
                  transition: reduced ? "none" : `opacity 500ms ${EASE} 120ms, transform 600ms ${EASE} 120ms`,
                }}
              >
                {stat.label}
              </dt>
              <dd>
                <span className="sr-only">
                  {stat.prefix}
                  {stat.value}
                  {stat.suffix}
                </span>
                <span aria-hidden="true">
                  <NumberRoll
                    value={shown ? stat.value : 0}
                    format={stat.format}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={1200}
                    className={numberClassName}
                  />
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
