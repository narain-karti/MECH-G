// Hairline UI · status-button · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { TextMorph } from "./text-morph";

export type ActionStatus = "idle" | "pending" | "success" | "error";

export interface StatusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status?: ActionStatus;
  labels?: Partial<Record<ActionStatus, string>>;
  icon?: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm";
  onReset?: () => void;
  resetAfter?: number;
}

const LABELS: Record<ActionStatus, string> = { idle: "Save", pending: "Saving", success: "Saved", error: "Try again" };
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );

function Check({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 420ms ${EASE} 120ms` : "none" }}
      />
    </svg>
  );
}

function Alert() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.75v3.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

export function StatusButton({
  status = "idle",
  labels,
  icon,
  variant = "primary",
  size = "default",
  onReset,
  resetAfter = 1800,
  className = "",
  onClick,
  ...props
}: StatusButtonProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLButtonElement>(null);
  const label = { ...LABELS, ...labels }[status];
  const showIcon = status !== "idle" || Boolean(icon);
  const busy = status === "pending";
  const sm = size === "sm";
  const iconSize = sm ? 14 : 16;

  React.useEffect(() => {
    if (status !== "error" || reduced) return;
    ref.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "none" }],
      { duration: 380, easing: "ease-out" },
    );
  }, [status, reduced]);

  React.useEffect(() => {
    if (status !== "success" || !onReset) return;
    const timer = window.setTimeout(onReset, resetAfter);
    return () => window.clearTimeout(timer);
  }, [status, onReset, resetAfter]);

  const tone =
    status === "error"
      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      : variant === "primary"
        ? "bg-[#22D3EE] text-black hover:bg-[#06B6D4]"
        : variant === "ghost"
          ? `hover:bg-[#24252B] hover:text-white ${status === "idle" ? "text-[#9CA3AF]" : "text-white"}`
          : "text-white border border-[#27272A] bg-[#141518] hover:bg-[#1E1F24]";

  const icons: Record<ActionStatus, React.ReactNode> = {
    idle: icon,
    pending: (
      <span
        className={`${sm ? "size-3" : "size-3.5"} rounded-full border-[1.5px] border-current border-t-transparent opacity-80 ${status === "pending" ? "animate-spin" : ""}`}
      />
    ),
    success: <Check drawn={status === "success"} reduced={reduced} />,
    error: <Alert />,
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-busy={busy || undefined}
        aria-disabled={busy || undefined}
        onClick={(e) => {
          if (busy) return e.preventDefault();
          onClick?.(e);
        }}
        className={`cursor-pointer disabled:cursor-default aria-disabled:cursor-default inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-all duration-200 active:scale-[0.97] ${
          sm ? `h-7 text-[12px] ${variant === "ghost" ? "px-2.5" : "px-3"}` : "h-9 px-4 text-[13px]"
        } ${FOCUS} ${tone} ${className}`}
        {...props}
      >
        <span
          aria-hidden="true"
          className={`relative flex shrink-0 items-center justify-center ${sm ? "h-3.5 [&_svg]:size-3.5" : "h-4 [&_svg]:size-4"}`}
          style={{
            width: showIcon ? iconSize : 0,
            marginRight: showIcon ? (sm ? 5 : 6) : 0,
            transition: reduced ? "none" : `width 380ms ${EASE}, margin 380ms ${EASE}`,
          }}
        >
          {(Object.keys(icons) as ActionStatus[]).map((s) => (
            <span
              key={s}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: s === status ? 1 : 0,
                transform: s === status ? "none" : "scale(0.6)",
                filter: s === status ? "none" : "blur(3px)",
                transition: reduced ? "none" : `opacity 260ms ${EASE}, transform 380ms ${EASE}, filter 260ms ${EASE}`,
              }}
            >
              {icons[s]}
            </span>
          ))}
        </span>
        <TextMorph>{label}</TextMorph>
      </button>
      <span className="sr-only" role="status">
        {status === "idle" ? "" : label}
      </span>
    </>
  );
}
export default StatusButton;
