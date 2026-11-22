// timeline.js — MECH-G Dark Keynote Master Timeline & Beat Grid (120 BPM)
export const BPM = 120.0;
export const DUR = 48.0;
export const FPS = 24.0;
export const BEAT_DUR = 60.0 / BPM; // 0.500 s

export const CUES = {
  hook_start: 0.0,
  downtime_start: 2.0,
  cloud_drop: 9.8,
  cad_warning: 14.5,
  freeze: 19.5,
  pivot: 20.0,
  snap_turn: 23.4,
  step1_snap: 24.5,
  step2_lock: 28.0,
  step3_fix: 32.5,
  metrics_slam: 37.4,
  lockup_outro: 42.5,
  end: 48.0,
};

export const SUBS = [
  {
    t0: 0.2,
    t1: 9.6,
    text: "A hundred meters high, a hydraulic valve blows. Zero signal, four thousand manual pages, and thirty thousand dollars an hour downtime."
  },
  {
    t0: 10.0,
    t1: 19.5,
    text: "Generic cloud AI drops safety interlocks and hallucinates fifty-five Newton meters instead of thirty-five—risking catastrophic blowout."
  },
  {
    t0: 20.0,
    t1: 23.2,
    text: "Cloud AI is dead out here. Meet MECH-G."
  },
  {
    t0: 23.6,
    t1: 37.0,
    text: "Snap: Gemma vision identifies the valve offline. Lock: OSHA safety gate verifies zero energy. Fix: Calibrated thirty-five Newton meters, backed by exact citations."
  },
  {
    t0: 37.4,
    t1: 47.0,
    text: "Eighty-four percent faster repair. Sub-five-hundred millisecond local graph latency. MECH-G: Mission-critical edge intelligence."
  }
];
