// Hairline UI · citation · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { Globe, BookOpen } from "lucide-react";

export interface CitationSource {
  title: string;
  url?: string;
  snippet?: string;
  icon?: React.ReactNode;
}

export interface CitationProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  index: number;
  source?: CitationSource;
  status?: "available" | "unavailable";
  onClick?: () => void;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40";
const CARD_WIDTH = 288;
const MORPH = "cubic-bezier(0.16,1,0.3,1)";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function hostname(url?: string) {
  if (!url) return "MECH-G Knowledge Base";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function Citation({ index, source, status = "available", onClick, className = "", ...props }: CitationProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  if (open && !mounted) setMounted(true);
  if (!open && reduced && mounted) setMounted(false);
  const [place, setPlace] = React.useState<{ above: boolean; shift: number }>({ above: false, shift: 0 });
  const triggerRef = React.useRef<HTMLAnchorElement>(null);
  const cardRef = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const id = React.useId();
  const unavailable = status === "unavailable" || !source;

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), delay);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current || !cardRef.current) return;
    const t = triggerRef.current.getBoundingClientRect();
    const h = cardRef.current.offsetHeight;
    const overflowRight = t.left + CARD_WIDTH - (window.innerWidth - 12);
    setPlace({ above: t.bottom + h + 12 > window.innerHeight && t.top > h + 12, shift: Math.max(0, overflowRight) });
  }, [open]);

  React.useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el || reduced) return;
    const from = `translateY(${place.above ? 4 : -4}px)`;
    if (open) {
      const enter = el.animate(
        [
          { opacity: 0, transform: from, filter: "blur(2px)" },
          { opacity: 1, transform: "none", filter: "blur(0px)" },
        ],
        { duration: 220, easing: MORPH }
      );
      return () => enter.cancel();
    }
    const leave = el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: from }], { duration: 140, easing: "ease-out", fill: "forwards" });
    leave.onfinish = () => setMounted(false);
    return () => leave.cancel();
  }, [open, mounted, place.above, reduced]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span className={`relative inline-block align-baseline ${className}`} onMouseEnter={() => show(120)} onMouseLeave={() => hide(150)} {...props}>
      <a
        ref={triggerRef}
        href={source?.url || "#"}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        target={source?.url ? "_blank" : undefined}
        rel="noreferrer"
        aria-describedby={open ? id : undefined}
        aria-label={`Source ${index}${source ? `: ${source.title}` : ""}`}
        onFocus={() => show(0)}
        onBlur={() => hide(0)}
        className={`mx-0.5 inline-flex h-[1.25em] min-w-[1.25em] -translate-y-[0.1em] items-center justify-center rounded-[5px] px-1 font-mono text-[10.5px] leading-none no-underline transition-all cursor-pointer ${FOCUS} ${
          unavailable
            ? "bg-[#1E1F23] text-[#71717A] line-through"
            : open
              ? "bg-[#22D3EE] text-black font-bold shadow-sm"
              : "bg-[#232326] text-[#22D3EE] hover:bg-[#2A2A2F] border border-[#2E2E33]"
        }`}
      >
        {index}
      </a>

      {mounted && (
        <span
          ref={cardRef}
          id={id}
          role="tooltip"
          aria-hidden={!open || undefined}
          className={`absolute z-50 block rounded-xl border border-[#27272A] bg-[#18181A] p-3 text-left shadow-2xl ${place.above ? "bottom-full mb-1.5" : "top-full mt-1.5"} ${
            open ? "" : "pointer-events-none"
          }`}
          style={{ width: CARD_WIDTH, left: -place.shift }}
        >
          {unavailable ? (
            <span className="block text-[12px] text-[#9CA3AF]">This source couldn’t be loaded.</span>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono font-medium">
                <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  {source.icon ?? <BookOpen className="size-3 text-cyan-400" />}
                </span>
                <span className="truncate">{hostname(source.url)}</span>
              </span>
              <span className="mt-1 line-clamp-2 block text-[12.5px] font-semibold leading-snug text-white">{source.title}</span>
              {source.snippet && <span className="mt-1 line-clamp-3 block text-[11.5px] leading-relaxed text-[#9CA3AF]">{source.snippet}</span>}
            </>
          )}
        </span>
      )}
    </span>
  );
}
export default Citation;
