// Timeline Definition for MECH-G Mid-century Cartoon Film (48.00s @ 24 fps CFR)
export const DURATION = 48.0;
export const FPS = 24.0;
export const TOTAL_FRAMES = 1152;
export const BPM = 120.0;
export const BEAT = 60.0 / BPM; // 0.500s
export const BAR = BEAT * 4;     // 2.000s

export const SCENES = [
  { id: 'store_intro', name: 'Frontline Tech Store', t0: 0.0, t1: 8.0, frame0: 0, frame1: 192 },
  { id: 'cloud_fail', name: 'Cloud AI Crash & Manual Tumble', t0: 8.0, t1: 16.0, frame0: 192, frame1: 384 },
  { id: 'mascot_intro', name: 'Meet MECH-G Mascot', t0: 16.0, t1: 22.0, frame0: 384, frame1: 528 },
  { id: 'step_snap', name: 'Step 1: SNAP Vision Scan', t0: 22.0, t1: 28.0, frame0: 528, frame1: 672 },
  { id: 'step_lock', name: 'Step 2: LOCK OSHA Safety Gate', t0: 28.0, t1: 34.0, frame0: 672, frame1: 816 },
  { id: 'step_fix', name: 'Step 3: FIX Calibrated Torque', t0: 34.0, t1: 40.0, frame0: 816, frame1: 960 },
  { id: 'celebration', name: 'Celebration & Metric Slam', t0: 40.0, t1: 48.0, frame0: 960, frame1: 1152 }
];

export const SUBTITLES = [
  { t0: 1.20, t1: 7.50, text: "Welcome to the Frontline Depot! When critical machines blow a seal in the field, every second counts." },
  { t0: 8.40, t1: 15.00, text: "Cloud chatbots choke with zero signal, leaving engineers stranded with massive four-thousand-page manuals." },
  { t0: 16.20, t1: 21.50, text: "Meet MECH-G! Your offline AI companion for mission-critical machine repair." },
  { t0: 22.20, t1: 27.50, text: "Step one: Snap! Multimodal vision instantly identifies valve PRV-992-B and flags the leaking seal." },
  { t0: 28.20, t1: 33.50, text: "Step two: Lock! OSHA safety gates enforce zero-energy isolation before anyone touches a bolt." },
  { t0: 34.20, t1: 39.50, text: "Step three: Fix and verify! Calibrated thirty-five newton-meter torque sequence, verified by our local graph." },
  { t0: 40.20, t1: 47.50, text: "Eighty-four percent faster repairs, completely offline. MECH-G: The frontline engineer's best friend!" }
];

export function getScene(t) {
  return SCENES.find(s => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1];
}

export function getSubtitle(t) {
  return SUBTITLES.find(s => t >= s.t0 && t < s.t1);
}
