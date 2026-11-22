// Hairline UI · delete-undo · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

"use client";

/* ─────────────────────────────────────────────────────────
 * DELETE WITH UNDO: fold it away
 *
 * One call on any element: `await foldAway(element)`. The
 * element is folded like a print in your hands, picture side
 * out, in half and in half again, each fold a little quicker,
 * until it's a small square; then the square turns edge-on and
 * is gone, because paper has no thickness. The promise resolves
 * and your code removes the item the way it already does.
 * `unfold(element)` plays it back, for your own Undo.
 *
 * Nothing about your app is taken over: no list, no toast, no
 * timer, no API. The fold is a copy of the element drawn over
 * the page (clipped clones hinged in 3D); the element itself is
 * only hidden, so it keeps its place in the layout and the copy
 * follows it every frame, through scrolling and resizing.
 * ───────────────────────────────────────────────────────── */

import { playSound } from "./ui-sounds";

export interface FoldAwayOptions {
  /** Play a soft crease for each fold and a tick as it goes (synthesised, no files). */
  sound?: boolean;
  /** The colour of the paper's back, any CSS background. */
  back?: string;
}

const PAPER = "linear-gradient(140deg, var(--card, #fff), color-mix(in oklab, var(--muted, #f4f4f5) 80%, var(--foreground, #000) 6%))";
const MAX_FOLDS = 4;
const SMALLEST = 56;
const FIRST = 480;
const QUICKER = 0.84;
const EDGE = 460;

type Rect = { x: number; y: number; w: number; h: number };
type Corners = [number, number, number, number]; // top-left, top-right, bottom-right, bottom-left

interface Step {
  root: HTMLDivElement;
  duration: number;
  /** f is the fold, 0 flat to 1 folded; e is the final turn edge-on, used on the last step only. */
  set(f: number, e: number): void;
  /** Where the middle of the paper sits, inside the step, at fold f. */
  centre(f: number): [number, number];
  shown: boolean;
}

interface Run {
  steps: Step[];
  t: number;
  total: number;
  dir: 1 | -1;
  last: number;
  frame: number;
  step: number;
  sound: boolean;
  visibility: string;
  waiting: { dir: 1 | -1; resolve: (done: boolean) => void }[];
}

const runs = new WeakMap<HTMLElement, Run>();
const gone = new WeakMap<HTMLElement, { visibility: string; options: FoldAwayOptions }>();

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smooth = (n: number) => (1 - Math.cos(Math.PI * clamp01(n))) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

let layer: HTMLDivElement | null = null;
function topLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000;contain:layout style;";
  document.body.appendChild(layer);
  return layer;
}

function reducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** One piece of the paper: a clipped clone of the element in front, the paper's back behind, a shade for turning away. */
function piece(source: HTMLElement, W: number, H: number, part: Rect, local: Rect, back: string) {
  const face = document.createElement("div");
  face.style.cssText = `position:absolute;left:${local.x}px;top:${local.y}px;width:${local.w}px;height:${local.h}px;transform-style:preserve-3d;`;
  const front = document.createElement("div");
  front.style.cssText = "position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;";
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  clone.setAttribute("inert", "");
  clone.style.cssText += `;position:absolute;left:${-part.x}px;top:${-part.y}px;width:${W}px;height:${H}px;margin:0;transform:none;translate:none;scale:none;rotate:none;opacity:1;visibility:visible;animation:none;transition:none;`;
  const shade = document.createElement("div");
  shade.style.cssText = "position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;";
  front.append(clone, shade);
  const rear = document.createElement("div");
  rear.style.cssText = `position:absolute;inset:0;background:${back};transform:rotateX(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;`;
  face.append(front, rear);
  const round = (c: Corners) => {
    const r = c.map((v) => `${v.toFixed(2)}px`).join(" ");
    front.style.borderRadius = r;
    rear.style.borderRadius = r;
  };
  return { face, shade, round };
}

function build(source: HTMLElement, options: FoldAwayOptions): Run {
  const W = source.offsetWidth || 1;
  const H = source.offsetHeight || 1;
  const computed = getComputedStyle(source);
  const corner = parseFloat(computed.borderTopLeftRadius) || 0;
  // Rounding follows the size: a small folded square can't keep a big photo's corners.
  const radius = (r: Rect) => Math.min(Math.max(corner, 6), 0.16 * Math.min(r.w, r.h));
  const back = options.back ?? PAPER;

  const steps: Step[] = [];
  let region: Rect = { x: 0, y: 0, w: W, h: H };
  let duration = FIRST;
  for (let i = 0; i < MAX_FOLDS; i++) {
    const R = region;
    const down = R.h >= R.w;
    const near = down
      ? Math.abs(R.y + R.h / 4 - H / 2) <= Math.abs(R.y + (3 * R.h) / 4 - H / 2) + 0.01
      : Math.abs(R.x + R.w / 4 - W / 2) <= Math.abs(R.x + (3 * R.w) / 4 - W / 2) + 0.01;
    const hw = R.w / 2, hh = R.h / 2;
    const kept: Rect = down ? { x: R.x, y: near ? R.y : R.y + hh, w: R.w, h: hh } : { x: near ? R.x : R.x + hw, y: R.y, w: hw, h: R.h };
    const folded: Rect = down
      ? { x: R.x, y: near ? R.y + hh - 1 : R.y, w: R.w, h: hh + 1 }
      : { x: near ? R.x + hw - 1 : R.x, y: R.y, w: hw + 1, h: R.h };
    const keptCrease = down ? (near ? [2, 3] : [0, 1]) : near ? [1, 2] : [0, 3];
    const foldCrease = down ? (near ? [0, 1] : [2, 3]) : near ? [0, 3] : [1, 2];
    const origin = down ? (near ? "50% 0" : "50% 100%") : near ? "0 50%" : "100% 50%";
    const swing = (f: number) => (down ? `rotateX(${(near ? -1 : 1) * f * 180}deg)` : `rotateY(${(near ? 1 : -1) * f * 180}deg)`);
    const local = (r: Rect): Rect => ({ x: r.x - R.x, y: r.y - R.y, w: r.w, h: r.h });
    const last = i === MAX_FOLDS - 1 || Math.max(kept.w, kept.h) <= SMALLEST;

    const root = document.createElement("div");
    root.style.cssText = `position:absolute;left:0;top:0;width:${R.w}px;height:${R.h}px;display:none;will-change:transform;color:${computed.color};font:${computed.font};`;
    const k = local(kept);
    const stage = document.createElement("div");
    stage.style.cssText = `position:absolute;inset:0;perspective:${Math.max(500, Math.max(W, H) * 2.4)}px;perspective-origin:${k.x + k.w / 2}px ${k.y + k.h / 2}px;`;
    const turn = document.createElement("div");
    turn.style.cssText = `position:absolute;inset:0;transform-style:preserve-3d;transform-origin:${k.x + k.w / 2}px ${k.y + k.h / 2}px;`;
    const f0 = local(folded);
    const hinge = document.createElement("div");
    hinge.style.cssText = `position:absolute;left:${f0.x}px;top:${f0.y}px;width:${f0.w}px;height:${f0.h}px;transform-origin:${origin};transform-style:preserve-3d;`;
    const away = piece(source, W, H, folded, { x: 0, y: 0, w: f0.w, h: f0.h }, back);
    hinge.appendChild(away.face);
    const stay = piece(source, W, H, kept, k, back);
    turn.append(hinge, stay.face);
    stage.appendChild(turn);
    root.appendChild(stage);
    topLayer().appendChild(root);

    const from = radius(R), to = radius(kept);
    const corners = (crease: number[], onCrease: number, elsewhere: number) =>
      [0, 1, 2, 3].map((c) => (crease.includes(c) ? onCrease : elsewhere)) as Corners;
    away.round(corners(foldCrease, 0, from));
    let tuckedAway = false;
    steps.push({
      root,
      duration,
      shown: false,
      set(f, e) {
        hinge.style.transform = `translateZ(${-f * 0.8}px) ${swing(f)}`;
        away.shade.style.opacity = String(Math.min(1, f * 1.8) * 0.42);
        const tucked = f >= 0.999;
        if (tucked !== tuckedAway) {
          tuckedAway = tucked;
          hinge.style.display = tucked ? "none" : "";
        }
        stay.round(corners(keptCrease, to * f, lerp(from, to, f)));
        if (last) {
          const wind = smooth(e / 0.3);
          const spin = clamp01((e - 0.3) / 0.7) ** 2;
          const angle = -12 * wind + 102 * spin;
          turn.style.transform = e > 0 ? `rotateY(${angle}deg) scale(${1 + 0.05 * wind - 0.17 * spin})` : "";
          stay.shade.style.opacity = String(Math.max(0, angle / 90) * 0.4);
        }
      },
      centre(f) {
        return [lerp(R.w / 2, k.x + k.w / 2, f), lerp(R.h / 2, k.y + k.h / 2, f)];
      },
    });
    if (last) break;
    region = kept;
    duration = Math.round(duration * QUICKER);
  }

  const total = steps.reduce((sum, s) => sum + s.duration, 0) + EDGE;
  return { steps, t: 0, total, dir: 1, last: 0, frame: 0, step: -1, sound: !!options.sound, visibility: source.style.visibility, waiting: [] };
}

function draw(source: HTMLElement, run: Run) {
  const box = source.getBoundingClientRect();
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  let t = run.t;
  let active = run.steps.length - 1;
  let f = 1, e = 0;
  for (let i = 0; i < run.steps.length; i++) {
    const d = run.steps[i].duration;
    if (t < d || i === run.steps.length - 1) {
      active = i;
      f = smooth(t / d);
      e = i === run.steps.length - 1 ? clamp01((t - d) / EDGE) : 0;
      break;
    }
    t -= d;
  }
  if (active !== run.step) {
    if (run.sound && run.dir > 0 && active > run.step) playSound("fold", Math.max(0.15, 0.5 - active * 0.07));
    run.step = active;
  }
  run.steps.forEach((step, i) => {
    const show = i === active;
    if (show !== step.shown) {
      step.shown = show;
      step.root.style.display = show ? "" : "none";
    }
  });
  const step = run.steps[active];
  step.set(f, e);
  const [mx, my] = step.centre(f);
  step.root.style.transform = `translate3d(${cx - mx}px, ${cy - my}px, 0)`;
}

function settle(run: Run, dir: 1 | -1, done: boolean) {
  run.waiting = run.waiting.filter((w) => {
    if (w.dir !== dir) return true;
    w.resolve(done);
    return false;
  });
}

function destroy(run: Run) {
  cancelAnimationFrame(run.frame);
  run.steps.forEach((s) => s.root.remove());
  if (layer && !layer.childElementCount) {
    layer.remove();
    layer = null;
  }
}

function play(source: HTMLElement, run: Run, dir: 1 | -1) {
  if (run.dir !== dir) settle(run, run.dir, false);
  run.dir = dir;
  cancelAnimationFrame(run.frame);
  run.last = performance.now();
  const finish = (done: boolean) => {
    destroy(run);
    runs.delete(source);
    settle(run, run.dir, done);
  };
  const tick = (now: number) => {
    const dt = Math.min(64, now - run.last) * (run.dir > 0 ? 1 : 1.25);
    run.last = now;
    run.t = Math.min(run.total, Math.max(0, run.t + dt * run.dir));
    if (!source.isConnected) return finish(run.dir > 0);
    draw(source, run);
    if (run.dir > 0 && run.t >= run.total) {
      if (run.sound) playSound("tick", 0.35);
      finish(true);
    } else if (run.dir < 0 && run.t <= 0) {
      source.style.visibility = run.visibility;
      finish(true);
    } else {
      run.frame = requestAnimationFrame(tick);
    }
  };
  draw(source, run);
  run.frame = requestAnimationFrame(tick);
}

export function foldAway(element: HTMLElement | null | undefined, options: FoldAwayOptions = {}): Promise<boolean> {
  if (!element || typeof window === "undefined") return Promise.resolve(false);
  if (gone.has(element)) return Promise.resolve(true);
  if (reducedMotion() && !runs.has(element)) {
    const visibility = element.style.visibility;
    return element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-out" }).finished.then(() => {
      element.style.visibility = "hidden";
      gone.set(element, { visibility, options });
      return true;
    });
  }
  let run = runs.get(element);
  if (!run) {
    run = build(element, options);
    runs.set(element, run);
    element.style.visibility = "hidden";
  }
  const current = run;
  return new Promise<boolean>((resolve) => {
    current.waiting.push({
      dir: 1,
      resolve: (done) => {
        if (done) gone.set(element, { visibility: current.visibility, options });
        resolve(done);
      },
    });
    play(element, current, 1);
  });
}

export function unfold(element: HTMLElement | null | undefined): Promise<boolean> {
  if (!element || typeof window === "undefined") return Promise.resolve(false);
  const folded = gone.get(element);
  let run = runs.get(element);
  if (!run && !folded) return Promise.resolve(false);
  gone.delete(element);
  if (!run && folded) {
    if (reducedMotion()) {
      element.style.visibility = folded.visibility;
      return element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" }).finished.then(() => true);
    }
    run = build(element, folded.options);
    run.visibility = folded.visibility;
    run.t = run.total;
    runs.set(element, run);
  }
  const current = run!;
  if (current.sound) playSound("unfold", 0.4);
  return new Promise<boolean>((resolve) => {
    current.waiting.push({ dir: -1, resolve });
    play(element, current, -1);
  });
}

export function isFoldedAway(element: HTMLElement | null | undefined) {
  return !!element && gone.has(element);
}
