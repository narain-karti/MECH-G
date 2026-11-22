// Hairline UI · integration-beam · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

export type BeamTool = {
  name: string;
  logo: ReactNode;
};

export type BeamCenter = {
  name: string;
  logo?: ReactNode;
};

export type IntegrationBeamProps = {
  left?: BeamTool[];
  right?: BeamTool[];
  center?: BeamCenter;
  className?: string;
  label?: string;
};

const TRAVEL = 1500;
const STAGGER = 280;
const REST = 1500;
const MORPH = 460;
const FLASH = 1400;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const easeOut = (t: number) => 1 - (1 - t) ** 5;
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Point = { x: number; y: number };
type Curve = number[];

export function IntegrationBeam({
  left = DEFAULT_LEFT,
  right = DEFAULT_RIGHT,
  center = DEFAULT_CENTER,
  className,
  label,
}: IntegrationBeamProps) {
  const uid = "ui-ib" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tools = [...left, ...right];
  const n = tools.length;
  const nLeft = left.length;

  const [off, setOff] = useState<ReadonlySet<number>>(() => new Set());
  const [focus, setFocus] = useState<number | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const centerRingRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const chipInnerRef = useRef<HTMLSpanElement>(null);
  const toolRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const pulseRefs = useRef<(SVGGElement | null)[]>([]);
  const gradRefs = useRef<(SVGLinearGradientElement | null)[]>([]);
  const flashTimer = useRef(0);
  const offRef = useRef(off);
  useIsoLayoutEffect(() => {
    offRef.current = off;
  }, [off]);

  const connected = n - off.size;
  const status = connected === 0 ? "All paused" : syncing ? "Live Telemetry Flow…" : `${connected} streams active`;

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    const svg = svgRef.current;
    const hub = centerRef.current;
    if (!root || !scene || !svg || !hub) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let shown: Curve[] = [];
    let from: Curve[] = [];
    let to: Curve[] = [];
    let morphStart = 0;
    let lastPos: Point[] | null = null;
    let lastStack: boolean | null = null;
    const lengths: number[] = [];

    const centerOf = (el: HTMLElement): Point => ({
      x: el.offsetLeft + el.offsetWidth / 2,
      y: el.offsetTop + el.offsetHeight / 2,
    });

    const curve = (a: Point, b: Point, stack: boolean): Curve => {
      if (stack) {
        const my = (a.y + b.y) / 2;
        return [a.x, a.y, a.x, my, b.x, my, b.x, b.y];
      }
      const mx = (a.x + b.x) / 2;
      return [a.x, a.y, mx, a.y, mx, b.y, b.x, b.y];
    };

    const draw = (curves: Curve[]) => {
      shown = curves;
      curves.forEach((c, i) => {
        const d = `M${c[0]} ${c[1]}C${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]} ${c[7]}`;
        const line = lineRefs.current[i];
        if (!line) return;
        line.setAttribute("d", d);
        pulseRefs.current[i]?.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
        lengths[i] = line.getTotalLength();
      });
    };

    const measure = () => {
      svg.setAttribute("viewBox", `0 0 ${root.clientWidth} ${root.clientHeight}`);
      const stack = getComputedStyle(scene).getPropertyValue("--ui-ib-stack").trim() === "1";
      const els = [...toolRefs.current.slice(0, n), hub];
      if (els.some((el) => !el)) return;
      const pos = els.map((el) => centerOf(el!));
      const c = pos[n];
      const target = pos.slice(0, n).map((p, i) => (i < nLeft ? curve(p, c, stack) : curve(c, p, stack)));

      if (lastPos && lastStack !== null && stack !== lastStack && !reduce) {
        els.forEach((el, i) => {
          const dx = lastPos![i].x - pos[i].x;
          const dy = lastPos![i].y - pos[i].y;
          if (dx || dy) {
            el!.animate?.([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
              duration: MORPH,
              easing: EASE,
            });
          }
        });
        from = shown.length === n ? shown : target;
        to = target;
        morphStart = performance.now();
        kick();
      } else if (morphStart) {
        to = target;
      } else {
        draw(target);
      }
      lastPos = pos;
      lastStack = stack;
    };

    const pulseStart: (number | null)[] = Array(n).fill(null);
    let queue: { beam: number; at: number }[] = [];
    let nextCycle = 0;
    let syncFrom = 0;
    let syncTo = 0;
    let wasSyncing = false;
    let visible = false;
    let raf = 0;

    const hide = (i: number) => {
      pulseStart[i] = null;
      const g = pulseRefs.current[i];
      if (g) g.style.opacity = "0";
    };

    const ring = (el: HTMLElement | null | undefined) =>
      el?.animate?.(
        [
          { opacity: 0, transform: "scale(0.96)" },
          { opacity: 1, transform: "scale(1)", offset: 0.3 },
          { opacity: 0, transform: "scale(1.14)" },
        ],
        { duration: 760, easing: "ease-out" },
      );

    const planCycle = (now: number) => {
      const ins = Array.from({ length: nLeft }, (_, i) => i).filter((i) => !offRef.current.has(i));
      const outs = Array.from({ length: n - nLeft }, (_, i) => nLeft + i).filter((i) => !offRef.current.has(i));
      if (!ins.length && !outs.length) {
        nextCycle = now + REST;
        return;
      }
      const t0 = now;
      const tOut = ins.length ? t0 + TRAVEL : t0;
      queue = [
        ...ins.map((beam, k) => ({ beam, at: t0 + k * STAGGER })),
        ...outs.map((beam, k) => ({ beam, at: tOut + k * STAGGER })),
      ];
      const end = Math.max(...queue.map((q) => q.at)) + TRAVEL;
      syncFrom = ins.length ? tOut : t0;
      syncTo = end;
      nextCycle = end + REST;
    };

    const paint = (i: number, t: number) => {
      const line = lineRefs.current[i];
      const g = pulseRefs.current[i];
      const grad = gradRefs.current[i];
      if (!line || !g || !grad) return;
      const L = lengths[i] || 0;
      const seg = Math.min(84, L * 0.42);
      const head = easeInOut(t) * (L + seg);
      g.querySelectorAll("path").forEach((p) => {
        p.style.strokeDasharray = `${seg} ${L + seg}`;
        p.style.strokeDashoffset = `${seg - head}`;
      });
      const a = line.getPointAtLength(Math.max(0, Math.min(L, head - seg)));
      const b = line.getPointAtLength(Math.max(0, Math.min(L, head)));
      grad.setAttribute("x1", `${a.x}`);
      grad.setAttribute("y1", `${a.y}`);
      grad.setAttribute("x2", `${b.x + (b.x === a.x && b.y === a.y ? 0.01 : 0)}`);
      grad.setAttribute("y2", `${b.y}`);
      g.style.opacity = "1";
    };

    const frame = (now: number) => {
      raf = 0;
      if (morphStart) {
        const t = Math.min(1, (now - morphStart) / MORPH);
        const e = easeOut(t);
        draw(to.map((c, i) => c.map((v, k) => (from[i]?.[k] ?? v) + (v - (from[i]?.[k] ?? v)) * e)));
        if (t >= 1) morphStart = 0;
      }
      if (visible && !reduce) {
        if (now >= nextCycle) planCycle(now);
        queue = queue.filter((q) => {
          if (q.at > now) return true;
          if (!offRef.current.has(q.beam) && pulseStart[q.beam] === null) pulseStart[q.beam] = q.at;
          return false;
        });
        for (let i = 0; i < n; i++) {
          const start = pulseStart[i];
          if (start === null) continue;
          if (offRef.current.has(i)) {
            hide(i);
            continue;
          }
          const t = (now - start) / TRAVEL;
          if (t >= 1) {
            hide(i);
            ring(i < nLeft ? centerRingRef.current : ringRefs.current[i]);
            continue;
          }
          paint(i, t);
        }
        const isSyncing = now >= syncFrom && now < syncTo;
        if (isSyncing !== wasSyncing) {
          wasSyncing = isSyncing;
          setSyncing(isSyncing);
        }
      }
      if (morphStart || (visible && !reduce)) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) {
              nextCycle = performance.now() + 400;
              kick();
            } else {
              queue = [];
              for (let i = 0; i < n; i++) hide(i);
              syncTo = 0;
              if (wasSyncing) setSyncing((wasSyncing = false));
            }
          });
    io?.observe(root);

    return () => {
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n, nLeft]);

  useIsoLayoutEffect(() => {
    const chip = chipRef.current;
    const inner = chipInnerRef.current;
    if (chip && inner) chip.style.width = `${inner.offsetWidth}px`;
  }, [status]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const toggle = (i: number) => {
    const pausing = !off.has(i);
    const next = new Set(off);
    if (pausing) next.add(i);
    else next.delete(i);
    setOff(next);
    offRef.current = next;
    setAnnounce(`${tools[i].name} ${pausing ? "paused" : "connected"}. ${n - next.size} of ${n} connected.`);
    setFlash(i);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH);
  };

  const onEnter = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse") setFocus(i);
  };
  const onFocus = (i: number) => (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(":focus-visible")) setFocus(i);
  };

  const tile = (t: BeamTool, i: number) => (
    <button
      key={i}
      ref={(el) => {
        toolRefs.current[i] = el;
      }}
      type="button"
      className="ui-ib__tool"
      aria-pressed={!off.has(i)}
      aria-label={`${t.name}, ${off.has(i) ? "paused" : "connected"}`}
      data-off={off.has(i) || undefined}
      data-tip={focus === i || flash === i || undefined}
      onClick={() => toggle(i)}
      onPointerEnter={onEnter(i)}
      onPointerLeave={() => setFocus(null)}
      onFocus={onFocus(i)}
      onBlur={() => setFocus(null)}
    >
      <span
        className="ui-ib__ring"
        ref={(el) => {
          ringRefs.current[i] = el;
        }}
      />
      <span className="ui-ib__logo" aria-hidden="true">
        {t.logo}
      </span>
      <span className="ui-ib__tip" aria-hidden="true">
        {t.name}
        {off.has(i) && <span className="ui-ib__tip-state"> · Paused</span>}
      </span>
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={["ui-ib", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label ?? `${center.name} connected to ${tools.map((t) => t.name).join(", ")}`}
      data-focus={focus !== null || undefined}
    >
      <style href="ui-integration-beam" precedence="default">
        {css}
      </style>

      <svg ref={svgRef} className="ui-ib__beams" aria-hidden="true">
        <defs>
          <filter id={`${uid}-blur`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="10000" height="10000">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          {tools.map((_, i) => (
            <linearGradient
              key={i}
              id={`${uid}-g${i}`}
              gradientUnits="userSpaceOnUse"
              ref={(el) => {
                gradRefs.current[i] = el;
              }}
            >
              <stop offset="0" className="ui-ib__stop-tail" />
              <stop offset="0.6" className="ui-ib__stop-mid" />
              <stop offset="1" className="ui-ib__stop-head" />
            </linearGradient>
          ))}
        </defs>
        {tools.map((_, i) => (
          <path
            key={i}
            className="ui-ib__line"
            data-off={off.has(i) || undefined}
            data-focus={focus === i || undefined}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
          />
        ))}
        {tools.map((_, i) => (
          <g
            key={i}
            className="ui-ib__pulse"
            data-focus={focus === i || undefined}
            ref={(el) => {
              pulseRefs.current[i] = el;
            }}
          >
            <path className="ui-ib__glow" stroke={`url(#${uid}-g${i})`} filter={`url(#${uid}-blur)`} />
            <path className="ui-ib__core" stroke={`url(#${uid}-g${i})`} />
          </g>
        ))}
      </svg>

      <div ref={sceneRef} className="ui-ib__scene">
        <div className="ui-ib__group ui-ib__group--in">{left.map((t, i) => tile(t, i))}</div>

        <div ref={centerRef} className="ui-ib__center" data-syncing={(syncing && connected > 0) || undefined}>
          <span className="ui-ib__ring ui-ib__ring--center" ref={centerRingRef} />
          <span className="ui-ib__mark" aria-hidden="true">
            {center.logo ?? <ProductMark />}
          </span>
          <span ref={chipRef} className="ui-ib__chip">
            <span ref={chipInnerRef} className="ui-ib__chip-inner">
              <span className="ui-ib__dot" data-idle={connected === 0 || undefined} />
              <span className="ui-ib__status" key={status}>
                {status}
              </span>
            </span>
          </span>
        </div>

        <div className="ui-ib__group ui-ib__group--out">{right.map((t, i) => tile(t, nLeft + i))}</div>
      </div>

      <span className="ui-ib__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

export function ProductMark() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#22D3EE] to-[#8B5CF6] p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
      <div className="w-full h-full bg-[#0B0B0C] rounded-[10px] flex items-center justify-center">
        <span className="text-sm font-black text-[#22D3EE] tracking-tighter">M</span>
      </div>
    </div>
  );
}

export const DEFAULT_CENTER: BeamCenter = { name: "MECH-G Core" };

export const DEFAULT_LEFT: BeamTool[] = [
  {
    name: "Optical Vision (26B)",
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    ),
  },
  {
    name: "Acoustic FFT Telemetry",
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5v14M7 8v8M22 10v4M2 10v4"/>
      </svg>
    ),
  },
  {
    name: "Hydraulic Loop Sensors",
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 14 4-4"/>
        <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
      </svg>
    ),
  },
];

export const DEFAULT_RIGHT: BeamTool[] = [
  {
    name: "NetworkX AST Graph",
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
  },
  {
    name: "OSHA 1910.147 LOTO",
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    name: "Calibrated Work Order",
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
];

const css = /* css */ `
.ui-ib {
  --ui-ib-ink: #FFFFFF;
  --ui-ib-text: #A1A1AA;
  --ui-ib-muted: #71717A;
  --ui-ib-faint: #27272A;
  --ui-ib-line: #27272A;
  --ui-ib-line-hi: #22D3EE;
  --ui-ib-card: #18181A;
  --ui-ib-tray: #141518;
  --ui-ib-accent: #22D3EE;
  --ui-ib-pulse: #22D3EE;
  --ui-ib-tip-color: #67E8F9;
  --ui-ib-ring: rgba(34, 211, 238, 0.25);
  --ui-ib-glow: rgba(34, 211, 238, 0.35);
  --ui-ib-hub: #18181A;
  --ui-ib-hub-mark: #FFFFFF;
  --ui-ib-hub-edge: rgba(39, 39, 42, 0.9);
  --ui-ib-tooltip: #27272A;
  --ui-ib-tooltip-text: #FFFFFF;
  --ui-ib-shadow: 0 0 0 1px #27272A, 0 8px 18px -10px rgba(0, 0, 0, 0.5);
  --ui-ib-focus: rgba(34, 211, 238, 0.4);
  --ui-ib-ease: ${EASE};
  position: relative;
  width: 100%;
  container-type: inline-size;
  font-family: inherit;
  font-size: 13px;
  color: var(--ui-ib-text);
  -webkit-tap-highlight-color: transparent;
}
.ui-ib *, .ui-ib *::before, .ui-ib *::after { box-sizing: border-box; }

.ui-ib__beams {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.ui-ib__line {
  fill: none;
  stroke: var(--ui-ib-line);
  stroke-width: 1.5;
  stroke-linecap: round;
  transition: stroke 300ms var(--ui-ib-ease), opacity 300ms var(--ui-ib-ease);
}
.ui-ib__line[data-off] { stroke: var(--ui-ib-faint); stroke-dasharray: 2 5; opacity: 0.5; }
.ui-ib[data-focus] .ui-ib__line:not([data-focus]) { opacity: 0.25; }
.ui-ib__line[data-focus]:not([data-off]) { stroke: var(--ui-ib-line-hi); }

.ui-ib__pulse { opacity: 0; transition: opacity 240ms ease; }
.ui-ib__pulse path { fill: none; stroke-linecap: round; transition: opacity 300ms var(--ui-ib-ease); }
.ui-ib__core { stroke-width: 2.5; }
.ui-ib__glow { stroke-width: 8; opacity: 0.6; }
.ui-ib[data-focus] .ui-ib__pulse:not([data-focus]) path { opacity: 0.2; }
.ui-ib__pulse[data-focus] .ui-ib__glow { opacity: 0.9; }
.ui-ib__stop-tail { stop-color: var(--ui-ib-pulse); stop-opacity: 0; }
.ui-ib__stop-mid { stop-color: var(--ui-ib-pulse); stop-opacity: 0.95; }
.ui-ib__stop-head { stop-color: var(--ui-ib-tip-color); stop-opacity: 1; }

.ui-ib__scene {
  --ui-ib-stack: 0;
  display: grid;
  grid-template-columns: auto minmax(40px, 1fr) auto minmax(40px, 1fr) auto;
  grid-template-areas: "in . hub . out";
  align-items: center;
  padding: 6px 0;
}
.ui-ib__group { display: flex; flex-direction: column; gap: 26px; }
.ui-ib__group--in { grid-area: in; }
.ui-ib__group--out { grid-area: out; }

.ui-ib__tool {
  position: relative;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  padding: 0;
  border: 1px solid #27272A;
  border-radius: 18px;
  background: var(--ui-ib-card);
  box-shadow: var(--ui-ib-shadow);
  color: var(--ui-ib-ink);
  font: inherit;
  cursor: pointer;
  transition: background-color 300ms var(--ui-ib-ease), border-color 300ms var(--ui-ib-ease);
}
.ui-ib__tool:hover { border-color: #22D3EE; }
.ui-ib__tool:focus-visible { outline: 2px solid var(--ui-ib-focus); outline-offset: 3px; }
.ui-ib__logo {
  display: grid;
  width: 28px;
  height: 28px;
  transition: transform 300ms var(--ui-ib-ease);
}
.ui-ib__logo > svg { width: 100%; height: 100%; }
@media (hover: hover) {
  .ui-ib__tool:hover .ui-ib__logo { transform: scale(1.1); }
}
.ui-ib__tool[data-off] { background: var(--ui-ib-tray); opacity: 0.6; }

.ui-ib__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 3px var(--ui-ib-ring), 0 0 22px 2px var(--ui-ib-glow);
  opacity: 0;
  pointer-events: none;
}

.ui-ib__tip {
  --ui-ib-tip-from: translate(-4px, -50%);
  position: absolute;
  z-index: 3;
  top: 50%;
  left: calc(100% + 10px);
  padding: 5px 10px;
  border-radius: 8px;
  background: #18181A;
  border: 1px solid #27272A;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: var(--ui-ib-tip-from);
  transition: opacity 180ms ease, transform 260ms var(--ui-ib-ease);
}
.ui-ib__group--out .ui-ib__tip { --ui-ib-tip-from: translate(4px, -50%); left: auto; right: calc(100% + 10px); }
.ui-ib__tip-state { opacity: 0.6; font-weight: 400; color: #F87171; }
.ui-ib__tool[data-tip] .ui-ib__tip { opacity: 1; transform: translate(0, -50%); }

.ui-ib__center {
  grid-area: hub;
  position: relative;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 26px;
  background: #141518;
  border: 1px solid #27272A;
  box-shadow: 0 0 25px rgba(34, 211, 238, 0.15);
  color: var(--ui-ib-hub-mark);
}
.ui-ib__mark { display: grid; width: 40px; height: 40px; fill: currentColor; }
.ui-ib__ring--center { inset: -1px; }

.ui-ib__chip {
  position: absolute;
  top: calc(100% + 12px);
  left: 50%;
  translate: -50% 0;
  display: block;
  height: 26px;
  overflow: hidden;
  border-radius: 999px;
  background: #18181A;
  border: 1px solid #27272A;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  transition: width 320ms var(--ui-ib-ease);
}
.ui-ib__chip-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 10px;
  white-space: nowrap;
}
.ui-ib__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #10B981;
  box-shadow: 0 0 6px #10B981;
}
.ui-ib__dot[data-idle] { background: #71717A; box-shadow: none; }
.ui-ib__status {
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
  color: #FFFFFF;
}
.ui-ib__sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
`;
