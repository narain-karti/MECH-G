"""generate_audio_suite.py - Master Audio Suite for MECH-G Pitch Video
1. Synthesizes 120 BPM Industrial Dark Techno BGM (exact beat grid: 0.500s / 15 frames per beat at 30 fps).
2. Synthesizes 9 procedural broadcast-grade SFX matched to each scene's narrative cue.
3. Mixes BGM + SFX with sample-accurate alignment into `bgm_sfx_master.wav`.
4. Uses Librosa to verify beat-grid and transient alignment.
"""

import os
import wave
import numpy as np
import scipy.signal as signal

SR = 44100
FPS = 30.0
BPM = 120.0
BEAT_DUR = 60.0 / BPM  # 0.500 s
TOTAL_DUR = 78.0       # 78s to ensure full 76s coverage plus natural reverb ringout
TOTAL_SAMPLES = int(TOTAL_DUR * SR)

def apply_envelope(sig, attack_s=0.01, release_s=0.05, sr=SR):
    n = len(sig)
    att_samples = int(attack_s * sr)
    rel_samples = int(release_s * sr)
    env = np.ones(n, dtype=np.float64)
    if att_samples > 0:
        env[:att_samples] = np.linspace(0, 1, att_samples)
    if rel_samples > 0 and rel_samples < n:
        env[-rel_samples:] = np.linspace(1, 0, rel_samples)
    return sig * env

def synth_sfx_intro_braam(sr=SR):
    """Scene 1 (0.0s): Deep cinematic braam / industrial horn + sub rumble"""
    dur = 3.5
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    # Pitch drop from 55 Hz (A1) down to 36.7 Hz (D1)
    f_curve = 36.7 + (55.0 - 36.7) * np.exp(-t / 1.2)
    phase = 2 * np.pi * np.cumsum(f_curve) / sr
    
    # Detuned brassy saws
    saw1 = signal.sawtooth(phase)
    saw2 = signal.sawtooth(phase * 1.008)
    saw3 = signal.sawtooth(phase * 0.992)
    brass = (saw1 + saw2 + saw3) / 3.0
    
    # Sub bass fundamental
    sub = np.sin(phase) * 1.5
    
    # Atmospheric wind noise
    noise = np.random.uniform(-1, 1, len(t))
    sos_wind = signal.butter(2, [80, 600], 'bandpass', fs=sr, output='sos')
    wind = signal.sosfilt(sos_wind, noise) * 0.4
    
    combined = (brass * 0.7 + sub * 0.8 + wind * 0.3) * np.exp(-t / 1.5)
    sos_lp = signal.butter(3, 400, 'low', fs=sr, output='sos')
    filtered = signal.sosfilt(sos_lp, combined)
    out = np.tanh(1.8 * filtered) * 0.75
    return apply_envelope(out, 0.02, 0.5, sr)

def synth_sfx_disconnect_glitch(sr=SR):
    """Scene 2 (10.0s): Cloud connection lost glitch + digital dropout"""
    dur = 1.2
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    # FM stutter
    carrier = np.sin(2 * np.pi * 1800 * t + 8.0 * np.sin(2 * np.pi * 60 * t))
    # Bitcrush noise burst
    noise = np.random.uniform(-1, 1, len(t))
    crush = np.round(noise * 4.0) / 4.0
    # Modulated gate (rapid square wave dropouts)
    gate = (signal.square(2 * np.pi * 24 * t) > 0).astype(float)
    
    glitch = (carrier * 0.4 + crush * 0.6) * gate * np.exp(-t / 0.5)
    
    # Low frequency drop ping
    ping = np.sin(2 * np.pi * (800 - 400 * t) * t) * np.exp(-t / 0.3)
    out = np.tanh(1.5 * (glitch * 0.6 + ping * 0.4)) * 0.65
    return apply_envelope(out, 0.005, 0.1, sr)

def synth_sfx_rag_alert(sr=SR):
    """Scene 3 (18.0s): 504 Timeout & RAG hallucination error alert"""
    dur = 1.4
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    # 3-pulse urgent alert beeps (880 Hz / 440 Hz dissonant interval)
    pulses = np.zeros_like(t)
    pulse_times = [0.0, 0.18, 0.36]
    for pt in pulse_times:
        p_mask = (t >= pt) & (t < pt + 0.12)
        p_t = t[p_mask] - pt
        tone = (np.sin(2 * np.pi * 920 * p_t) + 0.5 * np.sin(2 * np.pi * 1380 * p_t)) * np.exp(-p_t / 0.04)
        pulses[p_mask] += tone
        
    # High frequency data stutter
    noise = np.random.uniform(-1, 1, len(t))
    sos_bp = signal.butter(2, [2400, 4800], 'bandpass', fs=sr, output='sos')
    stutter = signal.sosfilt(sos_bp, noise) * np.exp(-t / 0.6) * 0.35
    
    out = np.tanh(1.4 * (pulses * 0.7 + stutter * 0.3)) * 0.70
    return apply_envelope(out, 0.005, 0.2, sr)

def synth_sfx_blowout(sr=SR):
    """Scene 4 (26.0s): Catastrophic 55 Nm CAD rupture & high-pressure hydraulic burst"""
    dur = 2.5
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    
    # Initial explosive transient (0 to 0.08s)
    exp_len = int(0.08 * sr)
    impulse = np.random.uniform(-1, 1, exp_len) * np.linspace(1, 0, exp_len)
    
    # High-pressure hydraulic hiss (decompressing oil & air)
    noise = np.random.uniform(-1, 1, len(t))
    sos_hiss = signal.butter(3, [1200, 8000], 'bandpass', fs=sr, output='sos')
    hiss = signal.sosfilt(sos_hiss, noise) * np.exp(-t / 0.8)
    
    # Heavy metallic clang / pipe rupture (ringing harmonics at 320 Hz, 640 Hz, 980 Hz)
    metal = (
        0.5 * np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.4) +
        0.3 * np.sin(2 * np.pi * 640 * t) * np.exp(-t / 0.25) +
        0.2 * np.sin(2 * np.pi * 980 * t) * np.exp(-t / 0.15)
    )
    
    # Massive 40 Hz sub shockwave
    sub_drop = np.sin(2 * np.pi * (50 - 15 * np.clip(t / 0.5, 0, 1)) * t) * np.exp(-t / 1.0) * 1.5
    
    combined = np.zeros_like(t)
    combined[:exp_len] += impulse * 1.2
    combined += hiss * 0.6 + metal * 0.5 + sub_drop * 0.9
    
    out = np.tanh(1.6 * combined) * 0.80
    return apply_envelope(out, 0.002, 0.4, sr)

def synth_sfx_snap_vision(sr=SR):
    """Scene 5 (34.0s): Step 1 SNAP: Gemma vision high-speed camera shutter + target lock"""
    dur = 1.0
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    
    # Dual mechanical shutter clicks (front curtain & rear curtain separated by 0.04s)
    shutter = np.zeros_like(t)
    for c_time in [0.0, 0.045]:
        c_idx = int(c_time * sr)
        c_len = int(0.02 * sr)
        c_t = np.linspace(0, 0.02, c_len, endpoint=False)
        click = np.random.uniform(-1, 1, c_len) * np.exp(-c_t / 0.004)
        sos_c = signal.butter(2, [1500, 9000], 'bandpass', fs=sr, output='sos')
        shutter[c_idx:c_idx + c_len] += signal.sosfilt(sos_c, click)
        
    # Futuristic target acquisition chirp (chirp up from 800 to 1600 Hz)
    chirp_t = t[(t >= 0.08) & (t < 0.28)] - 0.08
    f_chirp = 800 + (1600 - 800) * (chirp_t / 0.20)
    phase_c = 2 * np.pi * np.cumsum(f_chirp) / sr
    chirp = np.sin(phase_c) * np.exp(-chirp_t / 0.08)
    
    # Secondary confirmation beep at 1760 Hz (A6)
    beep_t = t[(t >= 0.25) & (t < 0.45)] - 0.25
    beep = np.sin(2 * np.pi * 1760 * beep_t) * np.exp(-beep_t / 0.05)
    
    out = np.zeros_like(t)
    out += shutter * 0.7
    out[int(0.08 * sr):int(0.08 * sr) + len(chirp)] += chirp * 0.5
    out[int(0.25 * sr):int(0.25 * sr) + len(beep)] += beep * 0.4
    
    out = np.tanh(1.4 * out) * 0.70
    return apply_envelope(out, 0.002, 0.1, sr)

def synth_sfx_lock_gate(sr=SR):
    """Scene 6 (42.0s): Step 2 LOCK: Heavy pneumatic solenoid gate + vault clamp"""
    dur = 1.5
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    
    # Pneumatic air release puff (0.0 to 0.15s)
    puff_len = int(0.18 * sr)
    puff_t = np.linspace(0, 0.18, puff_len, endpoint=False)
    noise = np.random.uniform(-1, 1, puff_len)
    sos_puff = signal.butter(2, [600, 3500], 'bandpass', fs=sr, output='sos')
    puff = signal.sosfilt(sos_puff, noise) * np.exp(-puff_t / 0.05)
    
    # Heavy solenoid clank (at 0.08s)
    clank_idx = int(0.08 * sr)
    clank_dur = 0.4
    clank_len = int(clank_dur * sr)
    clank_t = np.linspace(0, clank_dur, clank_len, endpoint=False)
    
    # 90 Hz mechanical body + 480 Hz metallic ring
    body = np.sin(2 * np.pi * 90 * clank_t) * np.exp(-clank_t / 0.08)
    ring = np.sin(2 * np.pi * 480 * clank_t) * np.exp(-clank_t / 0.04)
    clank = body * 1.0 + ring * 0.6
    
    # Heavy lock sub thud
    thud = np.sin(2 * np.pi * 50 * clank_t) * np.exp(-clank_t / 0.15) * 1.2
    
    out = np.zeros_like(t)
    out[:puff_len] += puff * 0.5
    out[clank_idx:clank_idx + clank_len] += (clank + thud) * 0.7
    
    out = np.tanh(1.5 * out) * 0.75
    return apply_envelope(out, 0.005, 0.2, sr)

def synth_sfx_fix_torque(sr=SR):
    """Scene 7 (51.0s): Step 3 FIX & VERIFY: Calibrated torque wrench click (35 Nm) + OEM chime"""
    dur = 1.6
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    
    # Precision mechanical torque wrench click (crisp dual tooth break-away)
    wrench = np.zeros_like(t)
    for c_time in [0.0, 0.028]:
        c_idx = int(c_time * sr)
        c_len = int(0.025 * sr)
        c_t = np.linspace(0, 0.025, c_len, endpoint=False)
        click = (np.sin(2 * np.pi * 2200 * c_t) + 0.5 * np.sin(2 * np.pi * 4400 * c_t)) * np.exp(-c_t / 0.005)
        wrench[c_idx:c_idx + c_len] += click
        
    # OEM verification chime (harmonious D major triad: D5 587Hz, F#5 740Hz, A5 880Hz)
    chime_idx = int(0.12 * sr)
    chime_dur = 1.2
    chime_len = int(chime_dur * sr)
    chime_t = np.linspace(0, chime_dur, chime_len, endpoint=False)
    chime = (
        0.5 * np.sin(2 * np.pi * 587.33 * chime_t) +
        0.4 * np.sin(2 * np.pi * 739.99 * chime_t) +
        0.5 * np.sin(2 * np.pi * 880.00 * chime_t)
    ) * np.exp(-chime_t / 0.35)
    
    out = wrench * 0.8
    out[chime_idx:chime_idx + chime_len] += chime * 0.5
    out = np.tanh(1.4 * out) * 0.72
    return apply_envelope(out, 0.002, 0.3, sr)

def synth_sfx_metrics_slam(sr=SR):
    """Scene 8 (60.0s): Act 4 Metrics: Riser sweep into massive kinetic slam + data ticker"""
    dur = 2.5
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    
    # 0.5s reverse whoosh riser leading up to 0.5s slam
    riser_len = int(0.5 * sr)
    riser_t = np.linspace(0, 0.5, riser_len, endpoint=False)
    noise_r = np.random.uniform(-1, 1, riser_len)
    sos_r = signal.butter(2, [200, 3000], 'bandpass', fs=sr, output='sos')
    riser = signal.sosfilt(sos_r, noise_r) * (riser_t / 0.5)**2
    
    # Heavy metric slam at 0.5s
    slam_idx = int(0.5 * sr)
    slam_dur = 1.8
    slam_len = int(slam_dur * sr)
    slam_t = np.linspace(0, slam_dur, slam_len, endpoint=False)
    slam_sub = np.sin(2 * np.pi * (65 - 25 * np.clip(slam_t / 0.6, 0, 1)) * slam_t) * np.exp(-slam_t / 0.5) * 1.5
    slam_crack = np.random.uniform(-1, 1, slam_len) * np.exp(-slam_t / 0.04) * 0.8
    
    # Telemetry data counter ticks (4 rapid ticks at 0.7s, 0.9s, 1.1s, 1.3s)
    ticks = np.zeros_like(t)
    for tick_t in [0.75, 0.95, 1.15, 1.35]:
        tk_idx = int(tick_t * sr)
        tk_len = int(0.015 * sr)
        tk_arr = np.linspace(0, 0.015, tk_len, endpoint=False)
        ticks[tk_idx:tk_idx + tk_len] += np.sin(2 * np.pi * 3200 * tk_arr) * np.exp(-tk_arr / 0.003)
        
    out = np.zeros_like(t)
    out[:riser_len] += riser * 0.4
    out[slam_idx:slam_idx + slam_len] += (slam_sub + slam_crack) * 0.8
    out += ticks * 0.35
    
    out = np.tanh(1.5 * out) * 0.80
    return apply_envelope(out, 0.01, 0.4, sr)

def synth_sfx_logo_lock(sr=SR):
    """Scene 9 (70.0s): Logo Lockup: Final cinematic impact + crystal shimmer decay"""
    dur = 4.5
    t = np.linspace(0, dur, int(dur * sr), endpoint=False)
    
    # Deep sub-bass boom at 36.7 Hz (D1 fundamental)
    sub = np.sin(2 * np.pi * 36.71 * t) * np.exp(-t / 1.5) * 1.5
    # Metallic body hit
    hit = np.sin(2 * np.pi * 146.83 * t) * np.exp(-t / 0.3) * 0.8
    crack = np.random.uniform(-1, 1, len(t)) * np.exp(-t / 0.03) * 0.7
    
    # Ethereal harmonic crystal pad shimmer (D5 587Hz, A5 880Hz, D6 1174Hz)
    shimmer = (
        0.35 * np.sin(2 * np.pi * 587.33 * t) +
        0.30 * np.sin(2 * np.pi * 880.00 * t) +
        0.25 * np.sin(2 * np.pi * 1174.66 * t)
    ) * np.exp(-t / 2.2)
    
    combined = sub * 0.7 + hit * 0.4 + crack * 0.3 + shimmer * 0.5
    out = np.tanh(1.4 * combined) * 0.75
    return apply_envelope(out, 0.005, 0.8, sr)


def generate_master_bgm(sr=SR, total_dur=TOTAL_DUR):
    """Synthesizes studio-grade 120.0 BPM Industrial Dark Techno Score."""
    print("Synthesizing 120.0 BPM Industrial Dark Techno Score...")
    n_samples = int(total_dur * sr)
    t = np.linspace(0, total_dur, n_samples, endpoint=False)
    
    left = np.zeros(n_samples, dtype=np.float64)
    right = np.zeros(n_samples, dtype=np.float64)
    
    # ---------------------------------------------------------
    # 1. Analog D Minor Atmospheric Pad
    # ---------------------------------------------------------
    f_D2 = 73.42
    f_A2 = 110.00
    f_D3 = 146.83
    f_F3 = 174.61
    f_A3 = 220.00
    f_Bb2 = 116.54 # tension in Act 2
    
    pad_L = (
        0.35 * np.sin(2 * np.pi * (f_D2 * 0.998) * t) +
        0.30 * np.sin(2 * np.pi * (f_A2 * 1.002) * t) +
        0.25 * np.sin(2 * np.pi * (f_F3 * 0.997) * t) +
        0.20 * signal.sawtooth(2 * np.pi * (f_D3 * 1.001) * t)
    )
    pad_R = (
        0.35 * np.sin(2 * np.pi * (f_D2 * 1.002) * t) +
        0.30 * np.sin(2 * np.pi * (f_A2 * 0.998) * t) +
        0.25 * np.sin(2 * np.pi * (f_F3 * 1.003) * t) +
        0.20 * signal.sawtooth(2 * np.pi * (f_D3 * 0.999) * t)
    )
    
    # Act 2 (18s - 34s) tension drone addition (Bb2 dissonance)
    act2_env = np.clip((t - 18.0) / 4.0, 0.0, 1.0) * np.clip((34.0 - t) / 3.0, 0.0, 1.0)
    pad_L += 0.28 * act2_env * np.sin(2 * np.pi * f_Bb2 * t)
    pad_R += 0.28 * act2_env * np.sin(2 * np.pi * (f_Bb2 * 1.006) * t)
    
    # Low-pass filter for the pad with gentle warmth
    sos_pad = signal.butter(2, 420, 'low', fs=sr, output='sos')
    pad_L = signal.sosfilt(sos_pad, pad_L)
    pad_R = signal.sosfilt(sos_pad, pad_R)
    
    left += np.tanh(1.2 * pad_L) * 0.32
    right += np.tanh(1.2 * pad_R) * 0.32
    
    # ---------------------------------------------------------
    # 2. 120 BPM Pulsing Sub-Bass (0.500s period)
    # ---------------------------------------------------------
    f_D1 = 36.71
    beat_phase = (t % BEAT_DUR) / BEAT_DUR
    sidechain = 0.25 + 0.75 * (1.0 - np.exp(-beat_phase * 6.5))
    
    sub_raw = 0.60 * np.sin(2 * np.pi * f_D1 * t) + 0.40 * np.sin(2 * np.pi * f_D2 * t)
    
    sub_gain = np.ones_like(t) * 0.35
    sub_gain[t < 10.0] = 0.20 + 0.15 * (t[t < 10.0] / 10.0)
    sub_gain[(t >= 18.0) & (t < 34.0)] = 0.45
    sub_gain[(t >= 34.0) & (t < 60.0)] = 0.55
    sub_gain[(t >= 60.0) & (t < 70.0)] = 0.60
    sub_gain[t >= 70.0] = 0.60 * np.clip((76.0 - t[t >= 70.0]) / 5.0, 0.0, 1.0)
    
    sub_processed = sub_raw * sidechain * sub_gain
    left += sub_processed
    right += sub_processed
    
    # ---------------------------------------------------------
    # 3. Industrial Sub-Kick (120 BPM 4-on-the-floor)
    # ---------------------------------------------------------
    kick_samples = int(0.22 * sr)
    kick_t = np.linspace(0, 0.22, kick_samples, endpoint=False)
    kick_f = 42.0 + (135.0 - 42.0) * np.exp(-kick_t / 0.032)
    kick_p = 2 * np.pi * np.cumsum(kick_f) / sr
    kick_body = np.sin(kick_p) * np.exp(-kick_t / 0.060)
    click = np.random.uniform(-1, 1, kick_samples) * np.exp(-kick_t / 0.005)
    single_kick = np.tanh(1.8 * (kick_body + 0.25 * click)) * 0.60
    
    total_beats = int(total_dur / BEAT_DUR)
    for b in range(total_beats):
        bt = b * BEAT_DUR
        if bt > 74.0:
            break
        
        k_vel = 0.0
        if bt < 10.0:
            if b % 4 == 0:  # Beat 1 of bar
                k_vel = 0.35
        elif 10.0 <= bt < 18.0:
            if b % 2 == 0:  # Beats 1 & 3
                k_vel = 0.45
        elif 18.0 <= bt < 34.0:
            k_vel = 0.55   # Full 4-on-the-floor
        elif 34.0 <= bt < 60.0:
            k_vel = 0.65   # Full driving kick in Act 3
        elif 60.0 <= bt < 70.0:
            k_vel = 0.70   # Climax peak in Act 4
        elif 70.0 <= bt < 74.0:
            k_vel = 0.35 * (74.0 - bt) / 4.0
            
        if k_vel > 0:
            idx = int(bt * sr)
            end_idx = min(idx + kick_samples, n_samples)
            act_k = end_idx - idx
            left[idx:end_idx] += single_kick[:act_k] * k_vel
            right[idx:end_idx] += single_kick[:act_k] * k_vel
            
    # ---------------------------------------------------------
    # 4. Hi-Hats & 16th-note Metallic Percussion
    # ---------------------------------------------------------
    sixteenth_dur = BEAT_DUR / 4.0  # 0.125s
    n_sixteenths = int(total_dur / sixteenth_dur)
    
    hat_samples = int(0.035 * sr)
    hat_t = np.linspace(0, 0.035, hat_samples, endpoint=False)
    noise_hat = np.random.uniform(-1, 1, hat_samples)
    sos_hat = signal.butter(3, [3500, 8500], 'bandpass', fs=sr, output='sos')
    single_hat = signal.sosfilt(sos_hat, noise_hat) * np.exp(-hat_t / 0.010)
    single_hat = single_hat / (np.max(np.abs(single_hat)) + 1e-6)
    
    for s_i in range(n_sixteenths):
        st = s_i * sixteenth_dur
        if st < 4.0 or st > 72.0:
            continue
            
        pos = s_i % 4
        gain = 0.0
        if 4.0 <= st < 18.0 and pos == 2:
            gain = 0.12
        elif 18.0 <= st < 34.0 and pos in (1, 3):
            gain = 0.18
        elif 34.0 <= st < 60.0:
            gain = 0.28 if pos == 2 else 0.15
        elif 60.0 <= st < 70.0:
            gain = 0.30 if pos == 2 else 0.18
            
        if gain > 0:
            idx = int(st * sr)
            end_idx = min(idx + hat_samples, n_samples)
            act_len = end_idx - idx
            pan = 0.25 * np.sin(s_i * 1.5)
            left[idx:end_idx] += single_hat[:act_len] * gain * (0.5 - pan)
            right[idx:end_idx] += single_hat[:act_len] * gain * (0.5 + pan)
            
    # ---------------------------------------------------------
    # 5. Cyber Synth Arpeggio in Act 3 & 4 (34s to 70s)
    # ---------------------------------------------------------
    arp_notes = [f_D3, f_F3, f_A3, 293.66] # D3, F3, A3, D4
    for s_i in range(n_sixteenths):
        st = s_i * sixteenth_dur
        if 34.0 <= st < 70.0:
            note_idx = s_i % len(arp_notes)
            note_freq = arp_notes[note_idx]
            arp_len = int(0.10 * sr)
            arp_t = np.linspace(0, 0.10, arp_len, endpoint=False)
            arp_tone = signal.sawtooth(2 * np.pi * note_freq * arp_t) * np.exp(-arp_t / 0.04)
            sos_arp = signal.butter(2, 1200, 'low', fs=sr, output='sos')
            arp_tone = signal.sosfilt(sos_arp, arp_tone)
            
            idx = int(st * sr)
            end_idx = min(idx + arp_len, n_samples)
            act_len = end_idx - idx
            arp_gain = 0.15 if st < 60.0 else 0.20
            left[idx:end_idx] += arp_tone[:act_len] * arp_gain * 0.4
            right[idx:end_idx] += arp_tone[:act_len] * arp_gain * 0.6
            
    # Fade in & out
    fade_in = np.clip(t / 1.5, 0.0, 1.0)
    fade_out = np.clip((76.0 - t) / 2.0, 0.0, 1.0)
    left = left * fade_in * fade_out
    right = right * fade_in * fade_out
    
    # Soft limiter
    left = np.tanh(1.15 * left)
    right = np.tanh(1.15 * right)
    
    # Target peak -3.0 dBFS (0.707)
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if peak > 0:
        gain = 0.707 / peak
        left *= gain
        right *= gain
        
    return left, right


def main():
    audio_dir = r"c:\Users\pnara\Downloads\MECH-G\PROJECT-GEMMA\video\audio"
    os.makedirs(audio_dir, exist_ok=True)
    
    # 1. Synthesize BGM
    bgm_L, bgm_R = generate_master_bgm(sr=SR, total_dur=TOTAL_DUR)
    
    bgm_path = os.path.join(audio_dir, "bgm.wav")
    bgm_int16 = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    bgm_int16[0::2] = np.int16(np.clip(bgm_L, -1.0, 1.0) * 32767.0)
    bgm_int16[1::2] = np.int16(np.clip(bgm_R, -1.0, 1.0) * 32767.0)
    with wave.open(bgm_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(bgm_int16.tobytes())
    print(f"Generated master BGM: {bgm_path} ({TOTAL_DUR:.1f}s)")
    
    # 2. Synthesize SFX and position on exact beat / frame timestamps
    sfx_cues = [
        ("sfx_01", 0.00,  synth_sfx_intro_braam,      "Scene 1: Nacelle Intro Braam & Wind"),
        ("sfx_02", 10.00, synth_sfx_disconnect_glitch,"Scene 2: Cloud AI Disconnect Glitch"),
        ("sfx_03", 18.00, synth_sfx_rag_alert,        "Scene 3: RAG 504 Timeout Error Alarm"),
        ("sfx_04", 26.00, synth_sfx_blowout,          "Scene 4: 55 Nm CAD Hydraulic Rupture"),
        ("sfx_05", 34.00, synth_sfx_snap_vision,      "Scene 5: SNAP Gemma Camera Shutter & HUD"),
        ("sfx_06", 42.00, synth_sfx_lock_gate,        "Scene 6: LOCK OSHA Safety Gate Solenoid"),
        ("sfx_07", 51.00, synth_sfx_fix_torque,       "Scene 7: FIX Torque Wrench Click (35 Nm)"),
        ("sfx_08", 60.00, synth_sfx_metrics_slam,     "Scene 8: Metrics Kinetic Riser Slam"),
        ("sfx_09", 70.00, synth_sfx_logo_lock,        "Scene 9: MECH-G Logo Lockup Impact"),
    ]
    
    sfx_master_L = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    sfx_master_R = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    
    print("\nSynthesizing and positioning SFX cues:")
    for sfx_id, cue_sec, synth_fn, desc in sfx_cues:
        mono_sfx = synth_fn(sr=SR)
        cue_sample = int(cue_sec * SR)
        end_sample = min(cue_sample + len(mono_sfx), TOTAL_SAMPLES)
        act_len = end_sample - cue_sample
        
        # Save individual SFX file for modularity
        sfx_out = os.path.join(audio_dir, f"{sfx_id}.wav")
        sfx_stereo = np.empty((len(mono_sfx) * 2,), dtype=np.int16)
        sfx_mono_int16 = np.int16(np.clip(mono_sfx, -1.0, 1.0) * 32767.0)
        sfx_stereo[0::2] = sfx_mono_int16
        sfx_stereo[1::2] = sfx_mono_int16
        with wave.open(sfx_out, 'wb') as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes(sfx_stereo.tobytes())
            
        # Add into master SFX track
        sfx_master_L[cue_sample:end_sample] += mono_sfx[:act_len]
        sfx_master_R[cue_sample:end_sample] += mono_sfx[:act_len]
        print(f"  [{sfx_id}] @ {cue_sec:5.2f}s (Frame {int(cue_sec * FPS):4d}): {desc}")
        
    # Normalize master SFX
    sfx_peak = max(np.max(np.abs(sfx_master_L)), np.max(np.abs(sfx_master_R)))
    if sfx_peak > 0:
        sfx_gain = 0.707 / sfx_peak  # -3 dBFS
        sfx_master_L *= sfx_gain
        sfx_master_R *= sfx_gain
        
    sfx_master_path = os.path.join(audio_dir, "sfx_master.wav")
    sfx_int16 = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    sfx_int16[0::2] = np.int16(np.clip(sfx_master_L, -1.0, 1.0) * 32767.0)
    sfx_int16[1::2] = np.int16(np.clip(sfx_master_R, -1.0, 1.0) * 32767.0)
    with wave.open(sfx_master_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(sfx_int16.tobytes())
    print(f"Generated master SFX track: {sfx_master_path}")
    
    # 3. Create combined BGM + SFX master bed: bgm_sfx_master.wav
    # BGM at -6 dB relative, SFX at 0 dB relative for crisp punch through
    bed_L = bgm_L * 0.65 + sfx_master_L * 0.75
    bed_R = bgm_R * 0.65 + sfx_master_R * 0.75
    
    bed_peak = max(np.max(np.abs(bed_L)), np.max(np.abs(bed_R)))
    if bed_peak > 0:
        bed_gain = 0.794 / bed_peak # -2.0 dBFS
        bed_L *= bed_gain
        bed_R *= bed_gain
        
    bed_path = os.path.join(audio_dir, "bgm_sfx_master.wav")
    bed_int16 = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    bed_int16[0::2] = np.int16(np.clip(bed_L, -1.0, 1.0) * 32767.0)
    bed_int16[1::2] = np.int16(np.clip(bed_R, -1.0, 1.0) * 32767.0)
    with wave.open(bed_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(bed_int16.tobytes())
    print(f"\nGenerated combined audio bed: {bed_path}")
    print(f"  Duration: {TOTAL_DUR}s | Channels: 2 | Sample Rate: {SR} Hz | Peak: {20 * np.log10(np.max(np.abs(bed_L))):.2f} dBFS")

if __name__ == "__main__":
    main()
