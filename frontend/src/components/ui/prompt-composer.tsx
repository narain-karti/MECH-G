// Hairline UI · prompt-composer · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { NumberRoll } from "./number-roll";

export type ComposerStatus = "ready" | "submitted" | "streaming" | "error";

export interface PromptComposerProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  status?: ComposerStatus;
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: React.ReactNode;
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  attachments?: React.ReactNode;
  toolbar?: React.ReactNode;
  maxLength?: number;
  allowEmpty?: boolean;
  autoFocus?: boolean;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FADE = 14;

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const swap = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "scale(0.6)",
  filter: on ? "none" : "blur(3px)",
  transition: reduced ? "none" : `opacity 260ms ${MORPH}, transform 380ms ${MORPH}, filter 260ms ${MORPH}`,
});

function Fold({ show, reduced, children }: { show: boolean; reduced: boolean; children: React.ReactNode }) {
  const [last, setLast] = React.useState(children);
  if (show && children !== last) setLast(children);
  return (
    <div
      aria-hidden={!show || undefined}
      inert={!show}
      className="grid"
      style={{
        gridTemplateRows: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        transition: reduced ? "none" : `grid-template-rows 380ms ${MORPH}, opacity ${show ? "280ms" : "140ms"} ${MORPH}`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{show ? children : last}</div>
    </div>
  );
}

export function PromptComposer({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "ready",
  placeholder = "Ask MECH-G a question or analyze hardware...",
  disabled = false,
  disabledReason,
  onFilesSelected,
  accept,
  attachments,
  toolbar,
  maxLength,
  allowEmpty = false,
  autoFocus,
  className = "",
  ...props
}: PromptComposerProps) {
  const reduced = useReducedMotion();
  const [own, setOwn] = React.useState(defaultValue);
  const [dragging, setDragging] = React.useState(false);
  const text = value !== undefined ? value : own;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const thumb = React.useRef<HTMLSpanElement>(null);
  const fadeTimer = React.useRef(0);
  const drag = React.useRef<{ y: number; top: number } | null>(null);
  const [overflows, setOverflows] = React.useState(false);
  const busy = status === "submitted" || status === "streaming";
  const canSend = !disabled && !busy && (allowEmpty || text.trim().length > 0) && (maxLength === undefined || text.length <= maxLength);

  const setText = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const paint = React.useCallback(
    (show: boolean) => {
      const el = textareaRef.current;
      const t = thumb.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      const top = max > 1 ? Math.min(FADE, el.scrollTop) : 0;
      const bottom = max > 1 ? Math.min(FADE, max - el.scrollTop) : 0;
      const mask = `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bottom}px), transparent 100%)`;
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
      if (!t) return;
      if (max <= 1) {
        t.style.opacity = "0";
        return;
      }
      const track = el.clientHeight - 12;
      const size = Math.max(24, (el.clientHeight / el.scrollHeight) * track);
      t.style.height = `${size}px`;
      t.style.transform = `translateY(${6 + (el.scrollTop / max) * (track - size)}px)`;
      if (show) {
        t.style.opacity = "1";
        window.clearTimeout(fadeTimer.current);
        fadeTimer.current = window.setTimeout(() => {
          if (!drag.current && thumb.current) thumb.current.style.opacity = "0";
        }, 900);
      }
    },
    [],
  );

  React.useEffect(() => () => window.clearTimeout(fadeTimer.current), []);

  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextH = Math.min(el.scrollHeight, 180);
    el.style.height = `${nextH}px`;
    const hasOverflow = el.scrollHeight > nextH + 1;
    setOverflows(hasOverflow);
    paint(false);
  }, [text, paint]);

  const submit = () => {
    if (!canSend) return;
    onSubmit(text);
    if (value === undefined) setOwn("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const takeFiles = (list: FileList | null) => {
    if (!list || list.length === 0 || !onFilesSelected) return false;
    onFilesSelected(Array.from(list));
    return true;
  };

  const action = busy ? (status === "streaming" && onStop ? "stop" : "wait") : "send";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onDragOver={(e) => {
        if (!onFilesSelected || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!onFilesSelected) return;
        e.preventDefault();
        setDragging(false);
        takeFiles(e.dataTransfer.files);
      }}
      className={`relative rounded-[22px] border bg-[#141518]/90 backdrop-blur-md transition-all focus-within:border-cyan-400/50 shadow-2xl ${
        dragging ? "border-dashed border-cyan-400" : "border-[#27272A]"
      } ${className}`}
      {...props}
    >
      <Fold show={Boolean(disabled && disabledReason)} reduced={reduced}>
        <div className="border-b border-[#27272A] px-3.5 py-2 text-[11.5px] text-[#9CA3AF]">{disabledReason}</div>
      </Fold>

      <Fold show={Boolean(attachments)} reduced={reduced}>
        <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">{attachments}</div>
      </Fold>

      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            if (takeFiles(e.clipboardData.files) && !e.clipboardData.getData("text")) e.preventDefault();
          }}
          onScroll={() => paint(true)}
          className={`block max-h-[180px] w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[13.5px] leading-relaxed text-white outline-none placeholder:text-[#6B7280] disabled:cursor-not-allowed disabled:opacity-60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            overflows ? "pr-6" : ""
          }`}
        />
        {overflows && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-4 touch-none"
            onPointerDown={(e) => {
              const el = textareaRef.current;
              if (!el) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { y: e.clientY, top: el.scrollTop };
              paint(true);
            }}
            onPointerMove={(e) => {
              const el = textareaRef.current;
              const d = drag.current;
              if (!el || !d) return;
              const size = parseFloat(thumb.current?.style.height ?? "24");
              const track = el.clientHeight - 12 - size;
              el.scrollTop = d.top + ((e.clientY - d.y) / Math.max(1, track)) * (el.scrollHeight - el.clientHeight);
            }}
            onPointerUp={() => {
              drag.current = null;
              paint(true);
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <span
              ref={thumb}
              className="absolute right-1.5 top-0 w-[3px] rounded-full bg-white/20 transition-[opacity,width] duration-300 hover:w-[5px] hover:bg-white/40"
              style={{ opacity: 0 }}
            />
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1">
        {onFilesSelected && (
          <>
            <button
              type="button"
              aria-label="Attach files"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer disabled:cursor-default flex size-7 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#24252B] hover:text-white disabled:opacity-40 ${FOCUS}`}
            >
              <Paperclip className="size-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={(e) => {
                takeFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}
        {toolbar && (
          <div className="flex min-w-0 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {toolbar}
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {maxLength !== undefined && (
            <span
              aria-hidden={text.length <= maxLength * 0.8 || undefined}
              className="grid"
              style={{
                gridTemplateColumns: text.length > maxLength * 0.8 ? "1fr" : "0fr",
                opacity: text.length > maxLength * 0.8 ? 1 : 0,
                transition: reduced ? "none" : `grid-template-columns 380ms ${MORPH}, opacity 260ms ${MORPH}`,
              }}
            >
              <span
                className={`flex min-w-0 items-baseline overflow-hidden whitespace-nowrap font-mono text-[11px] tabular-nums transition-colors duration-300 ${
                  text.length > maxLength ? "text-rose-400" : "text-[#9CA3AF]"
                }`}
              >
                <NumberRoll value={text.length} duration={300} />/{maxLength}
              </span>
            </span>
          )}
          <button
            type={action === "send" ? "submit" : "button"}
            aria-label={action === "stop" ? "Stop" : action === "wait" ? "Sending" : "Send"}
            disabled={action === "send" ? !canSend : action === "wait"}
            onClick={action === "stop" ? onStop : undefined}
            className={`cursor-pointer disabled:cursor-default relative flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
              action === "stop"
                ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
                : canSend
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-[#24252B] text-[#71717A]"
            } ${FOCUS}`}
          >
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(action === "send", reduced)}>
              <ArrowUp className="size-3.5" />
            </span>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(action === "stop", reduced)}>
              <Square fill="currentColor" className="size-2.5" />
            </span>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(action === "wait", reduced)}>
              <span className={`size-3 rounded-full border-[1.5px] border-current/35 border-t-current ${action === "wait" ? "animate-spin" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[22px] bg-[#141518]/90 text-[13px] font-medium text-cyan-300 border-2 border-dashed border-cyan-400"
        style={{ opacity: dragging ? 1 : 0, transition: reduced ? "none" : `opacity 200ms ${MORPH}` }}
      >
        Drop manuals or inspection captures here
      </div>
    </form>
  );
}
export default PromptComposer;
