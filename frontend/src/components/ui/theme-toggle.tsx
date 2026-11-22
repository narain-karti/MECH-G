// Hairline UI · theme-toggle · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { TextMorph } from "./text-morph";

export type Theme = "light" | "dark" | "system";

export interface ThemeToggleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  variant?: "icon" | "pill" | "segmented";
  value?: Theme;
  defaultValue?: Theme;
  onValueChange?: (theme: Theme) => void;
  storageKey?: string;
  attribute?: "class" | "data-theme";
  reveal?: boolean;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40";
const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
];

const reducedQuery = "(prefers-reduced-motion: reduce)";
const darkQuery = "(prefers-color-scheme: dark)";
const subscribeQuery = (q: string) => (onChange: () => void) => {
  const query = window.matchMedia(q);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useMedia = (q: string) =>
  React.useSyncExternalStore(subscribeQuery(q), () => window.matchMedia(q).matches, () => false);

function SunMoon({ dark, reduced, className = "size-[16px]" }: { dark: boolean; reduced: boolean; className?: string }) {
  const id = React.useId().replace(/:/g, "");
  const t = (ms: number, ease = EASE) => (reduced ? "none" : `transform ${ms}ms ${ease}, opacity ${Math.round(ms * 0.6)}ms ${EASE}`);
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <mask id={`${id}-shadow`}>
        <rect width="24" height="24" fill="white" />
        <circle cx="12" cy="12" r="8" fill="black" style={{ transform: dark ? "translate(5px,-5px)" : "translate(14px,-14px)", transition: t(560) }} />
      </mask>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="currentColor"
        mask={`url(#${id}-shadow)`}
        style={{ transformOrigin: "12px 12px", transform: dark ? "scale(1.05)" : "scale(0.55)", transition: t(560, THROW) }}
      />
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        style={{ transformOrigin: "12px 12px", transform: dark ? "rotate(-90deg) scale(0.4)" : "none", opacity: dark ? 0 : 1, transition: t(520) }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
      <rect x="3" y="4.5" width="18" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 20.5h6M12 17v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function withReveal(from: HTMLElement | null, apply: () => void, enabled: boolean) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (!enabled || !from || !doc.startViewTransition) {
    const hold = document.createElement("style");
    hold.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(hold);
    apply();
    void document.body.offsetHeight;
    requestAnimationFrame(() => hold.remove());
    return;
  }
  const r = from.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const style = document.createElement("style");
  style.textContent = "::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}";
  document.head.appendChild(style);
  const transition = doc.startViewTransition(() => flushSync(apply));
  transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 620, easing: "cubic-bezier(0.65,0,0.35,1)", pseudoElement: "::view-transition-new(root)" }
      )
    )
    .catch(() => {});
  transition.finished.finally(() => style.remove());
}

const subscribeSaved = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
const readSaved = (key: string): Theme | null => {
  try {
    const saved = localStorage.getItem(key);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : null;
  } catch {
    return null;
  }
};

export function ThemeToggle({
  variant = "icon",
  value,
  defaultValue = "dark",
  onValueChange,
  storageKey = "theme",
  attribute = "class",
  reveal = true,
  className = "",
  ...props
}: ThemeToggleProps) {
  const reduced = useMedia(reducedQuery);
  const systemDark = useMedia(darkQuery);
  const controlled = value !== undefined;
  const saved = React.useSyncExternalStore(subscribeSaved, () => readSaved(storageKey), () => null);
  const [picked, setPicked] = React.useState<Theme | null>(null);
  const [ready, setReady] = React.useState(false);
  const theme = value ?? picked ?? saved ?? defaultValue;
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  const dark = resolved === "dark";
  const rootRef = React.useRef<HTMLDivElement>(null);
  const segRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = React.useState({ left: 0, width: 0, ready: false });

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    if (controlled) return;
    const root = document.documentElement;
    if (attribute === "class") root.classList.toggle("dark", dark);
    else root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;
  }, [controlled, dark, resolved, attribute]);

  const choose = (next: Theme) => {
    if (next === theme) return;
    const nextDark = (next === "system" ? systemDark : next === "dark") !== dark;
    const apply = () => {
      if (!controlled) {
        setPicked(next);
        try {
          localStorage.setItem(storageKey, next);
        } catch {}
        const root = document.documentElement;
        const r = next === "system" ? (systemDark ? "dark" : "light") : next;
        if (attribute === "class") root.classList.toggle("dark", r === "dark");
        else root.setAttribute("data-theme", r);
        root.style.colorScheme = r;
      }
      onValueChange?.(next);
    };
    withReveal(rootRef.current, apply, reveal && !reduced && nextDark);
  };

  const index = Math.max(0, OPTIONS.findIndex((o) => o.value === theme));
  React.useLayoutEffect(() => {
    if (variant !== "segmented") return;
    const measure = () => {
      const el = segRefs.current[index];
      if (!el) return;
      setThumb((t) => (t.left === el.offsetLeft && t.width === el.offsetWidth ? t : { left: el.offsetLeft, width: el.offsetWidth, ready: t.width > 0 }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    segRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [variant, index]);

  const motion = reduced || !ready;
  const label = dark ? "Dark" : "Light";

  if (variant === "segmented") {
    return (
      <div
        ref={rootRef}
        role="radiogroup"
        aria-label="Theme"
        onKeyDown={(e) => {
          const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: OPTIONS.length - 1 };
          if (!(e.key in moves)) return;
          e.preventDefault();
          const next = (moves[e.key] + OPTIONS.length) % OPTIONS.length;
          choose(OPTIONS[next].value);
          segRefs.current[next]?.focus();
        }}
        className={`relative inline-flex h-8 items-center rounded-full bg-[#141518] border border-[#27272A] p-0.5 ${className}`}
        {...props}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 left-0 rounded-full bg-[#24252B] border border-[#3A3B43]"
          style={{
            width: thumb.width,
            transform: `translateX(${thumb.left}px)`,
            opacity: thumb.width ? 1 : 0,
            transition: thumb.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none",
          }}
        />
        {OPTIONS.map((o, i) => {
          const selected = o.value === theme;
          return (
            <button
              key={o.value}
              ref={(el) => {
                segRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={o.label}
              tabIndex={selected ? 0 : -1}
              onClick={() => choose(o.value)}
              className={`cursor-pointer relative flex h-7 w-9 items-center justify-center rounded-full transition-colors duration-200 ${FOCUS} ${selected ? "text-white" : "text-[#9CA3AF] hover:text-white"}`}
            >
              {o.value === "system" ? <SystemIcon /> : <SunMoon dark={o.value === "dark"} reduced={motion} className="size-3.5" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`inline-flex ${className}`} {...props}>
      <button
        type="button"
        aria-label={variant === "pill" ? `${label} theme, switch to ${dark ? "light" : "dark"}` : `Switch to ${dark ? "light" : "dark"} theme`}
        aria-pressed={dark}
        onClick={() => choose(dark ? "light" : "dark")}
        className={`cursor-pointer inline-flex h-8 items-center justify-center rounded-full text-white border border-[#27272A] bg-[#141518] hover:bg-[#1E1F24] transition-all active:scale-[0.96] ${FOCUS} ${
          variant === "pill" ? "gap-2 pl-2.5 pr-3 text-[12px] font-medium" : "w-8"
        }`}
      >
        <SunMoon dark={dark} reduced={motion} />
        {variant === "pill" && <TextMorph>{label}</TextMorph>}
      </button>
    </div>
  );
}

export default ThemeToggle;
