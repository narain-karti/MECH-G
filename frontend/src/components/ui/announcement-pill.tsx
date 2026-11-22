// Hairline UI · announcement-pill · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";

export interface AnnouncementPillProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  badge?: string;
  children: React.ReactNode;
  more?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="w-3 h-3 shrink-0 text-[#71717A] transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-[#22D3EE]"
    >
      <path
        d="M2.5 6h7M6.5 3l3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AnnouncementPill({
  badge = "New",
  children,
  more,
  href,
  onClick,
  className = "",
  ...props
}: AnnouncementPillProps) {
  const content = (
    <div
      className={`group inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#18181A]/90 hover:bg-[#202024] border border-[#27272A] hover:border-[#22D3EE]/40 shadow-sm transition-all text-xs font-mono select-none cursor-pointer ${className}`}
      onClick={onClick}
      {...props}
    >
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 text-[10px] font-bold uppercase tracking-wider">
          {badge}
        </span>
      )}
      <span className="text-[#E4E4E7] tracking-tight">{children}</span>
      {more && <span className="text-[#A1A1AA] hidden sm:inline">{more}</span>}
      <Arrow />
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}
