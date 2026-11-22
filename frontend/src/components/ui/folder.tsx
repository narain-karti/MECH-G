// Hairline UI · folder · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { INTERACTION_FOCUS, createSpring, useInteractionReducedMotion, type Spring } from "./ui-interaction-motion";

export interface FolderFile {
  id: string;
  name: string;
  image?: string;
  tint?: string;
}

export interface FolderHandle {
  addFiles: (files: File[]) => void;
}

export interface FolderProps {
  name: string;
  files: FolderFile[];
  count?: number;
  noun?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFileOpen?: (file: FolderFile) => void;
  onDropFiles?: (files: File[]) => Promise<unknown> | unknown;
  color?: string;
  foreground?: string;
  size?: number;
  className?: string;
  ref?: React.Ref<FolderHandle>;
}

const WIDTH = 240;
const ROOM = 76;
const BODY = 176;
const SHEET_W = 112;
const SHEET_H = 144;
const SHOWN = 3;
const BACK = "M0 14a14 14 0 0 1 14-14h82c5 0 8 2 11 6l5 6c2 2 4 2 6 2h108a14 14 0 0 1 14 14v124a24 24 0 0 1-24 24H24a24 24 0 0 1-24-24Z";

type Mood = "rest" | "hover" | "open" | "over";
type Pose = { x: number; y: number; r: number };

const POSES: Record<Mood, [Pose, Pose, Pose]> = {
  rest: [{ x: 2, y: 12, r: -1.5 }, { x: 30, y: 4, r: 6 }, { x: -32, y: 7, r: -7 }],
  hover: [{ x: -2, y: -8, r: -2 }, { x: 46, y: -20, r: 10 }, { x: -46, y: -14, r: -11 }],
  open: [{ x: 0, y: -66, r: -2 }, { x: 72, y: -46, r: 12 }, { x: -72, y: -52, r: -13 }],
  over: [{ x: 0, y: -2, r: 0 }, { x: 62, y: -14, r: 13 }, { x: -62, y: -14, r: -13 }],
};
const PARKED: Pose = { x: 0, y: 16, r: 0 };
const ANGLE: Record<Mood, number> = { rest: 7, hover: 21, open: 31, over: 40 };

const WEIGHTS = [
  { stiffness: 210, damping: 16 },
  { stiffness: 150, damping: 14 },
  { stiffness: 115, damping: 13 },
];
const HINGE = { stiffness: 170, damping: 15 };
const GIVE = { stiffness: 320, damping: 12 };
const SHAKE = { stiffness: 900, damping: 16 };
const LEAN = [11, 7, 5];
const LENS = 620;
const FRONT_H = BODY - 34;

const CHARTS = ["var(--chart-1, #22D3EE)", "var(--chart-2, #3B82F6)", "var(--chart-3, #8B5CF6)", "var(--chart-5, #10B981)"];
const COUNT_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const LINE_WIDTHS = ["92%", "78%", "86%", "64%", "90%", "72%"];

function hashTint(id: string) {
  let n = 0;
  for (const char of id) n = (n + char.charCodeAt(0)) % CHARTS.length;
  return CHARTS[n];
}

const Sheet = React.memo(function Sheet({ file, actionable, onOpen }: { file: FolderFile; actionable: boolean; onOpen?: (file: FolderFile) => void }) {
  const inner = (
    <>
      <div className="truncate px-2.5 pb-2 pt-2.5 text-left text-[10.5px] font-medium leading-none text-white">{file.name}</div>
      {file.image ? (
        <img src={file.image} alt="" draggable={false} className="mx-2.5 h-[104px] w-[calc(100%_-_20px)] rounded-[6px] object-cover" />
      ) : (
        <div className="px-2.5">
          <div className="h-[22px] rounded-[5px]" style={{ background: file.tint ?? hashTint(file.id) }} />
          <div className="mt-2 grid gap-[5px]">
            {LINE_WIDTHS.map((width) => (
              <div key={width} className="h-[3.5px] rounded-full bg-white/20" style={{ width }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
  const base = "relative block size-full overflow-hidden rounded-[12px] bg-[#18181A] border border-[#27272A]";
  return actionable ? (
    <button type="button" onClick={() => onOpen?.(file)} className={`${base} cursor-pointer ${INTERACTION_FOCUS}`} aria-label={`Open ${file.name}`}>
      {inner}
    </button>
  ) : (
    <div className={base}>{inner}</div>
  );
});

type Entry = { node: HTMLElement; x: Spring; y: Spring; r: Spring; falling: boolean };

export function Folder({ name, files, count, noun = "files", open, defaultOpen = false, onOpenChange, onFileOpen, onDropFiles, color = "#22D3EE", foreground = "#0B0B0C", size = WIDTH, className = "", ref }: FolderProps) {
  const reduced = useInteractionReducedMotion();
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const [hovering, setHovering] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const [added, setAdded] = React.useState<(FolderFile & { url?: string; leaving?: boolean })[]>([]);
  const [note, setNote] = React.useState<string | null>(null);
  const nextId = React.useRef(0);

  const mood: Mood = over ? "over" : isOpen ? "open" : hovering ? "hover" : "rest";

  const rootRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const flapRef = React.useRef<HTMLDivElement>(null);
  const glassRef = React.useRef<HTMLDivElement>(null);
  const nodes = React.useRef(new Map<string, HTMLElement>());
  const entries = React.useRef(new Map<string, Entry>());
  const falling = React.useRef(new Set<string>());
  const moodRef = React.useRef(mood);
  const leanRef = React.useRef(0);
  const whole = React.useRef<{ hinge: Spring; give: Spring; shake: Spring } | null>(null);

  const visibleAdded = added.filter((a) => !files.some((f) => f.id === a.id));
  const all = React.useMemo(() => [...files, ...added.filter((a) => !files.some((f) => f.id === a.id))], [files, added]);
  const settled = all.filter((f) => !("leaving" in f && f.leaving));
  const shown = all.slice(-(SHOWN + 1));
  const total = (count ?? files.length) + visibleAdded.filter((a) => !a.leaving).length;

  const paint = React.useCallback(() => {
    const w = whole.current;
    if (!w) return;
    const give = w.give.get();
    if (bodyRef.current) bodyRef.current.style.transform = `translate3d(${w.shake.get().toFixed(2)}px,0,0) scale(${(1 + give * 0.035).toFixed(4)},${(1 - give * 0.05).toFixed(4)})`;
    const angle = w.hinge.get();
    if (flapRef.current) flapRef.current.style.transform = `perspective(${LENS}px) rotateX(${(-angle).toFixed(2)}deg)`;
    if (glassRef.current) {
      const radians = (angle * Math.PI) / 180;
      const seen = (Math.cos(radians) * LENS) / (LENS - FRONT_H * Math.sin(radians));
      glassRef.current.style.transform = `scaleY(${seen.toFixed(4)})`;
    }
    entries.current.forEach((entry) => {
      const y = entry.y.get();
      entry.node.style.transform = `translate3d(${entry.x.get().toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${entry.r.get().toFixed(2)}deg)`;
      if (entry.falling && entry.y.getVelocity() > 0 && y > entry.y.getTarget() - 6) {
        entry.falling = false;
        const speed = entry.y.getVelocity();
        w.give.push(Math.min(9, speed * 0.016));
        entry.y.jump(entry.y.getTarget());
        entry.y.push(-speed * 0.1);
      }
    });
  }, []);

  const poseOf = React.useCallback((depth: number, m: Mood): Pose => (depth >= SHOWN ? PARKED : POSES[m][depth]), []);

  const aim = React.useCallback(() => {
    const ids = [...nodes.current.keys()];
    entries.current.forEach((entry, id) => {
      const depth = ids.length - 1 - ids.indexOf(id);
      const pose = poseOf(depth, moodRef.current);
      const lean = moodRef.current === "hover" ? leanRef.current * (LEAN[depth] ?? 0) : 0;
      entry.x.set(pose.x + lean);
      entry.y.set(pose.y);
      entry.r.set(pose.r + lean * 0.25);
    });
  }, [poseOf]);

  React.useLayoutEffect(() => {
    const s = { hinge: createSpring(ANGLE[moodRef.current], HINGE, paint, 0.02), give: createSpring(0, GIVE, paint, 0.002), shake: createSpring(0, SHAKE, paint, 0.02) };
    whole.current = s;
    paint();
    const sheets = entries.current;
    return () => {
      s.hinge.stop();
      s.give.stop();
      s.shake.stop();
      whole.current = null;
      sheets.forEach((entry) => {
        entry.x.stop();
        entry.y.stop();
        entry.r.stop();
      });
      sheets.clear();
    };
  }, [paint]);

  const shownKey = shown.map((f) => f.id).join("\n");
  React.useLayoutEffect(() => {
    const ids = shownKey ? shownKey.split("\n") : [];
    moodRef.current = mood;
    entries.current.forEach((entry, id) => {
      if (ids.includes(id)) return;
      entry.x.stop();
      entry.y.stop();
      entry.r.stop();
      entries.current.delete(id);
    });
    const ordered = new Map<string, HTMLElement>();
    ids.forEach((id, index) => {
      const node = nodes.current.get(id);
      if (!node) return;
      ordered.set(id, node);
      if (entries.current.has(id)) return;
      const arrives = falling.current.delete(id) && !reduced;
      const depth = ids.length - 1 - index;
      const rest = poseOf(depth, mood);
      const start = arrives ? { x: rest.x * 0.3, y: -ROOM - SHEET_H * 0.5, r: 7 } : rest;
      const weight = WEIGHTS[Math.min(depth, WEIGHTS.length - 1)];
      entries.current.set(id, { node, x: createSpring(start.x, weight, paint, 0.02), y: createSpring(start.y, weight, paint, 0.02), r: createSpring(start.r, weight, paint, 0.02), falling: arrives });
    });
    nodes.current = ordered;
    if (reduced) {
      const list = [...ordered.keys()];
      entries.current.forEach((entry, id) => {
        const pose = poseOf(list.length - 1 - list.indexOf(id), mood);
        entry.x.jump(pose.x);
        entry.y.jump(pose.y);
        entry.r.jump(pose.r);
      });
      whole.current?.hinge.jump(ANGLE[mood]);
    } else {
      aim();
      whole.current?.hinge.set(ANGLE[mood]);
    }
    paint();
  }, [shownKey, mood, reduced, aim, paint, poseOf]);

  const setOpenState = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setOwnOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenState(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenState(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setOpenState]);

  const noteTimer = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const receive = React.useCallback(
    async (dropped: File[]) => {
      if (!dropped.length) return;
      const items = dropped.map((file) => {
        const id = `incoming-${nextId.current++}`;
        falling.current.add(id);
        return { id, name: file.name, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined };
      });
      const sheets = items.map((item) => ({ id: item.id, name: item.name, image: item.url, url: item.url }));
      setAdded((list) => [...list, ...sheets]);
      setNote(dropped.length > 1 ? `Adding ${dropped.length}` : "Adding");
      const release = () => {
        setAdded((list) => list.filter((a) => !items.some((i) => i.id === a.id)));
        items.forEach((item) => item.url && URL.revokeObjectURL(item.url));
      };
      try {
        await onDropFiles?.(dropped);
        release();
        setNote(null);
      } catch {
        setAdded((list) => list.map((a) => (items.some((i) => i.id === a.id) ? { ...a, leaving: true } : a)));
        items.forEach((item) => {
          const entry = entries.current.get(item.id);
          entry?.y.set(-ROOM - SHEET_H);
          if (entry) entry.falling = false;
        });
        whole.current?.shake.push(reduced ? 0 : 240);
        setNote(dropped.length > 1 ? `Couldn't add ${dropped.length} files` : `Couldn't add ${dropped[0].name}`);
        window.clearTimeout(noteTimer.current);
        noteTimer.current = window.setTimeout(() => setNote(null), 2600);
        window.setTimeout(release, reduced ? 0 : 520);
      }
    },
    [onDropFiles, reduced],
  );

  React.useImperativeHandle(ref, () => ({ addFiles: (list: File[]) => void receive(list) }), [receive]);

  const droppable = Boolean(onDropFiles);
  const dropProps = droppable
    ? {
        onDragEnter: (event: React.DragEvent) => {
          if (event.dataTransfer.types.includes("Files")) setOver(true);
        },
        onDragOver: (event: React.DragEvent) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: (event: React.DragEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
        },
        onDrop: (event: React.DragEvent) => {
          event.preventDefault();
          setOver(false);
          void receive(Array.from(event.dataTransfer.files));
        },
      }
    : {};

  const scale = size / WIDTH;
  const message = over ? "Drop to add" : note;
  const front = `color-mix(in oklab, ${color} 88%, transparent)`;
  const seen = settled.slice(-SHOWN).map((f) => f.id);

  return (
    <div
      ref={rootRef}
      {...dropProps}
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: (ROOM + BODY) * scale }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => {
        setHovering(false);
        leanRef.current = 0;
        aim();
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || reduced) return;
        const box = event.currentTarget.getBoundingClientRect();
        leanRef.current = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2));
        aim();
      }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: WIDTH, height: ROOM + BODY, transform: scale === 1 ? undefined : `scale(${scale})` }}>
        <div ref={bodyRef} className="absolute inset-x-0 bottom-0 origin-bottom will-change-transform" style={{ height: BODY }}>
          <svg aria-hidden="true" viewBox={`0 0 ${WIDTH} ${BODY}`} className="absolute inset-0 size-full overflow-visible" style={{ filter: "drop-shadow(0 14px 14px rgb(0 0 0 / 0.16))" }}>
            <path
              d={BACK}
              style={{ fill: `color-mix(in oklab, ${color} 45%, #18181A)` }}
            />
          </svg>

          <div className="absolute" style={{ left: (WIDTH - SHEET_W) / 2, top: 12, width: SHEET_W, height: SHEET_H }}>
            {shown.map((file, index) => {
              const raised = isOpen && seen.includes(file.id);
              const gone = ("leaving" in file && file.leaving) || shown.length - 1 - index >= SHOWN;
              return (
                <div
                  key={file.id}
                  ref={(node) => {
                    if (node) {
                      if (!nodes.current.has(file.id)) nodes.current.set(file.id, node);
                    } else nodes.current.delete(file.id);
                  }}
                  inert={!raised}
                  className="absolute inset-0 origin-bottom rounded-[12px] bg-[#18181A] will-change-transform"
                  style={{ boxShadow: "0 0 0 0.5px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.14), 0 5px 12px -3px rgb(0 0 0 / 0.2)", opacity: gone ? 0 : 1, transition: "opacity 320ms ease-out 120ms" }}
                >
                  <Sheet file={file} actionable={Boolean(onFileOpen)} onOpen={onFileOpen} />
                </div>
              );
            })}
          </div>

          <div ref={glassRef} aria-hidden="true" className="absolute inset-x-0 bottom-0 origin-bottom rounded-[22px] will-change-transform [-webkit-backdrop-filter:blur(7px)] [backdrop-filter:blur(7px)] bg-black/20" style={{ height: FRONT_H }} />

          <div
            ref={flapRef}
            className="absolute inset-x-0 bottom-0 origin-bottom overflow-hidden rounded-[22px] will-change-transform border border-white/10"
            style={{
              height: FRONT_H,
              background: `linear-gradient(to bottom, color-mix(in oklab, ${front} 50%, #18181A), #141518)`,
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.15), inset 0 -1px 0 rgb(0 0 0 / 0.5), 0 -1px 3px rgb(0 0 0 / 0.3)",
              color: "#FFFFFF",
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={`${name}, ${total} ${noun}`}
              onClick={() => setOpenState(!isOpen)}
              onPointerDown={() => !reduced && whole.current?.give.set(0.55)}
              onPointerUp={() => whole.current?.give.set(0)}
              onPointerCancel={() => whole.current?.give.set(0)}
              onPointerLeave={() => whole.current?.give.set(0)}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) setHovering(true);
              }}
              onBlur={() => setHovering(false)}
              className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
            />
            <div className="pointer-events-none absolute inset-x-4 bottom-3.5">
              <div className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-white">{name}</div>
              <div className="relative mt-1 h-[16px] text-[11px] font-mono font-medium leading-[16px] text-[#9CA3AF]">
                <span className="absolute inset-x-0 top-0 flex gap-1 whitespace-nowrap transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" style={{ opacity: message ? 0 : 1, transform: message ? "translateY(-6px)" : "none" }}>
                  <NumberRoll value={total} format={COUNT_FORMAT} duration={620} />
                  <span>{total === 1 ? noun.replace(/s$/, "") : noun}</span>
                </span>
                <span className="absolute inset-x-0 top-0 truncate transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none text-cyan-400" style={{ opacity: message ? 1 : 0, transform: message ? "none" : "translateY(6px)" }}>
                  {message}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <span role="status" className="sr-only">
        {note ?? ""}
      </span>
    </div>
  );
}

export default Folder;
