// Hairline UI · badge · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";
import { EASE_OUT, useInteractionReducedMotion } from "./ui-interaction-motion";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "cyan" | "emerald" | "purple" | "blue" | "rose" | "amber";

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  children?: React.ReactNode;
  tone?: BadgeTone;
  variant?: "solid" | "subtle";
  outline?: boolean;
  dot?: boolean | "pulse";
  count?: number;
  max?: number;
  showZero?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

const FILL: Record<BadgeTone, string> = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/14 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  cyan: "bg-cyan-500/12 text-cyan-400",
  emerald: "bg-emerald-500/12 text-emerald-400",
  purple: "bg-purple-500/12 text-purple-400",
  blue: "bg-blue-500/12 text-blue-400",
  rose: "bg-rose-500/12 text-rose-400",
  amber: "bg-amber-500/14 text-amber-400",
};
const LINE: Record<BadgeTone, string> = {
  neutral: "text-foreground shadow-[inset_0_0_0_1px_var(--border)]",
  primary: "text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]",
  success: "text-emerald-700 dark:text-emerald-400 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-emerald-500)_40%,transparent)]",
  warning: "text-amber-700 dark:text-amber-400 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-amber-500)_45%,transparent)]",
  danger: "text-red-600 dark:text-red-400 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-red-500)_40%,transparent)]",
  cyan: "text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]",
  emerald: "text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]",
  purple: "text-purple-400 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.35)]",
  blue: "text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]",
  rose: "text-rose-400 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.35)]",
  amber: "text-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.35)]",
};
const DOT: Record<BadgeTone, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  cyan: "bg-cyan-400",
  emerald: "bg-emerald-400",
  purple: "bg-purple-400",
  blue: "bg-blue-400",
  rose: "bg-rose-400",
  amber: "bg-amber-400",
};

export function Badge({ children, tone = "neutral", outline, dot, count, max = 99, showZero, icon, size = "md", className = "", ...props }: BadgeProps) {
  const reduced = useInteractionReducedMotion();
  const isCount = count !== undefined;
  const hidden = isCount && count <= 0 && !showZero;
  const sm = size === "sm";

  const badge = (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-medium tabular-nums transition-[background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [&_svg]:size-3 ${
        sm ? "h-5 gap-1 px-1.5 text-[11px]" : "h-6 gap-1.5 px-2 text-[12px]"
      } ${isCount ? (sm ? "min-w-5 justify-center" : "min-w-6 justify-center") : ""} ${outline ? LINE[tone] : FILL[tone]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex size-1.5 shrink-0">
          {dot === "pulse" && !reduced && <span className={`absolute inset-0 rounded-full ${DOT[tone]} [animation:ui-ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite]`} />}
          <span className={`relative size-1.5 rounded-full transition-colors duration-300 ${DOT[tone]}`} />
        </span>
      )}
      {icon}
      {isCount ? (
        count > max ? (
          <span>
            <NumberRoll value={max} />+
          </span>
        ) : (
          <NumberRoll value={Math.max(0, count)} />
        )
      ) : (
        children && (typeof children === "string" ? <TextMorph>{children}</TextMorph> : children)
      )}
    </span>
  );

  if (!isCount) return badge;
  return (
    <span
      className="inline-grid"
      aria-hidden={hidden || undefined}
      style={{
        gridTemplateColumns: hidden ? "0fr" : "1fr",
        opacity: hidden ? 0 : 1,
        scale: hidden && !reduced ? "0.6" : "1",
        transition: reduced ? "none" : `grid-template-columns 320ms ${EASE_OUT}, opacity 200ms ${EASE_OUT}, scale 320ms ${EASE_OUT}`,
      }}
    >
      <span className="min-w-0 overflow-hidden">{badge}</span>
    </span>
  );
}

export default Badge;
