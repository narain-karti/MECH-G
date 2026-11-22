import os
import sys
import json
import math
import urllib.request
import numpy as np
import scipy.signal
import soundfile as sf

API_KEY = "sk_83d3bccc2d129c6d6db3f5bb6c6fa2e34f4164305507d1f8"
SR = 48000
TOTAL_DUR = 48.0
TOTAL_SAMPLES = int(SR * TOTAL_DUR)

OUT_DIR = r"c:\Users\pnara\Downloads\MECH-G\PROJECT-GEMMA\video\lemo_cinema\audio"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. ElevenLabs Speech Synthesis
# Voices:
# High-pitch field technician (urgent, strained, energetic): Laura (FGY2WhTYpPnrIDTdsKH5)
# Low-pitch MECH-G Mascot / Command Core (deep, authoritative, calm baritone): Brian (nPczCjzI2devNBz1zQrb)
VOICE_TECH = "FGY2WhTYpPnrIDTdsKH5"
VOICE_MECHG = "nPczCjzI2devNBz1zQrb"

LINES = [
    {
        "id": "line_01_tech",
        "voice": VOICE_TECH,
        "text": "Mayday base! Hydraulic manifold ruptured at two-ten bar! Nacelle pressure collapsing!",
        "start_time": 0.8,
        "speaker": "tech",
        "stability": 0.35, # more expressive/urgent
        "similarity_boost": 0.85
    },
    {
        "id": "line_02_tech",
        "voice": VOICE_TECH,
        "text": "Cloud RAG timed out! Five-zero-four gateway error! The pitch cylinder is slipping!",
        "start_time": 8.8,
        "speaker": "tech",
        "stability": 0.30, # peak urgency
        "similarity_boost": 0.85
    },
    {
        "id": "line_03_mechg",
        "voice": VOICE_MECHG,
        "text": "Echo-Seven, this is MECH-G local core. Visual acquisition engaged. I have your back.",
        "start_time": 16.2,
        "speaker": "mechg",
        "stability": 0.75, # calm, steady, authoritative
        "similarity_boost": 0.90
    },
    {
        "id": "line_04_tech",
        "voice": VOICE_TECH,
        "text": "Confirmed PRV-992-B! Clamping OSHA lock on safety gate now!",
        "start_time": 22.5,
        "speaker": "tech",
        "stability": 0.40,
        "similarity_boost": 0.85
    },
    {
        "id": "line_05_mechg",
        "voice": VOICE_MECHG,
        "text": "Zero energy verified. Execute three-pass torque to thirty-five Newton meters.",
        "start_time": 28.5,
        "speaker": "mechg",
        "stability": 0.80, # precise, firm command
        "similarity_boost": 0.90
    },
    {
        "id": "line_06_tech",
        "voice": VOICE_TECH,
        "text": "Click! Click! Thirty-five Nm confirmed! Manifold sealed! We saved the turbine!",
        "start_time": 34.5,
        "speaker": "tech",
        "stability": 0.35, # triumphant relief
        "similarity_boost": 0.85
    },
    {
        "id": "line_07_mechg",
        "voice": VOICE_MECHG,
        "text": "Eighty-four percent downtime reduced. Fully offline. When seconds count, trust MECH-G.",
        "start_time": 40.8,
        "speaker": "mechg",
        "stability": 0.70, # heroic closing statement
        "similarity_boost": 0.95
    }
]

def synthesize_line(line_info):
    cache_path = os.path.join(OUT_DIR, f"{line_info['id']}.wav")
    if os.path.exists(cache_path):
        print(f"[CACHE] {line_info['id']} exists")
        data, sr = sf.read(cache_path)
        return data, sr

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{line_info['voice']}?output_format=pcm_48000"
    payload = {
        "text": line_info["text"],
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": line_info["stability"],
            "similarity_boost": line_info["similarity_boost"]
        }
    }
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    print(f"[TTS] Synthesizing {line_info['id']} ({line_info['speaker']})...")
    with urllib.request.urlopen(req) as resp:
        pcm_bytes = resp.read()
    
    # 48kHz 16-bit PCM mono
    samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    sf.write(cache_path, samples, 48000)
    print(f"[TTS] Saved {cache_path} ({len(samples)/48000:.2f}s)")
    return samples, 48000

def create_radio_squelch(sr=48000, duration=0.08):
    # Authentic aviation/tactical radio mic click: 1200Hz beep + short burst of white noise
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    tone = 0.2 * np.sin(2 * np.pi * 1200 * t)
    noise = 0.15 * np.random.randn(len(t))
    env = np.exp(-t * 40.0)
    return (tone + noise) * env

def apply_radio_filter(audio, sr=48000):
    # Tactical 300 - 3400 Hz bandpass filter + subtle non-linear distortion
    sos = scipy.signal.butter(4, [300, 3400], btype='bandpass', fs=sr, output='sos')
    filtered = scipy.signal.sosfilt(sos, audio)
    # Mild saturation
    distorted = np.tanh(filtered * 1.6) * 0.9
    return distorted

def apply_deep_bass_voice(audio, sr=48000):
    # Reassuring low-pitch enhancement: boost 80-150 Hz sub-harmonics and crisp air presence
    sos_bass = scipy.signal.butter(2, 160, btype='lowpass', fs=sr, output='sos')
    bass = scipy.signal.sosfilt(sos_bass, audio)
    return audio * 0.9 + bass * 0.35

# Build Master Voice Track
voice_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
speech_envelope = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for item in LINES:
    samples, sr = synthesize_line(item)
    if item["speaker"] == "tech":
        processed = apply_radio_filter(samples, sr)
        squelch = create_radio_squelch(sr)
        full_line = np.concatenate([squelch, processed, squelch])
        pan = 0.45 # slightly left of center
    else:
        processed = apply_deep_bass_voice(samples, sr)
        full_line = processed
        pan = 0.50 # dead center

    start_idx = int(item["start_time"] * sr)
    end_idx = min(TOTAL_SAMPLES, start_idx + len(full_line))
    line_slice = full_line[:end_idx - start_idx]
    
    # Stereo panning
    left_gain = math.cos(pan * math.pi / 2)
    right_gain = math.sin(pan * math.pi / 2)
    voice_track[start_idx:end_idx, 0] += line_slice * left_gain
    voice_track[start_idx:end_idx, 1] += line_slice * right_gain

    # Mark envelope for sidechain ducking
    speech_envelope[start_idx:end_idx] = 1.0

# 2. Sound Effects (Foley, Braams, Alarms, Locks, Torque Clicks)
sfx_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

def add_sfx(sound, start_time, pan=0.5, gain=1.0):
    start_idx = int(start_time * SR)
    end_idx = min(TOTAL_SAMPLES, start_idx + len(sound))
    dur_len = end_idx - start_idx
    if dur_len <= 0: return
    snd = sound[:dur_len] * gain
    left_gain = math.cos(pan * math.pi / 2)
    right_gain = math.sin(pan * math.pi / 2)
    sfx_track[start_idx:end_idx, 0] += snd * left_gain
    sfx_track[start_idx:end_idx, 1] += snd * right_gain

# SFX A: Cinematic Sub Braam (35Hz brass drop with rich harmonics)
def gen_braam(duration=3.5, base_f=38.0):
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)
    # Pitch bend slightly down
    freq = base_f * (1.0 - 0.15 * (t / duration))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    # Rich sawtooth / brass waveform
    wave = 0.6 * np.sin(phase) + 0.3 * np.sin(2 * phase) + 0.15 * np.sin(3 * phase) + 0.1 * np.sin(4 * phase)
    env = np.exp(-t * 0.9)
    # Lowpass filter sweep
    sos = scipy.signal.butter(2, 220, btype='lowpass', fs=SR, output='sos')
    filtered = scipy.signal.sosfilt(sos, wave * env)
    return filtered * 0.85

# SFX B: Hydraulic Fluid Rupture / High-Pressure Spray
def gen_rupture(duration=3.5):
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)
    noise = np.random.randn(len(t))
    # Resonant bandpass filter around 1800 Hz
    sos = scipy.signal.butter(3, [1200, 3200], btype='bandpass', fs=SR, output='sos')
    hiss = scipy.signal.sosfilt(sos, noise)
    env = (1.0 - np.exp(-t * 15.0)) * np.exp(-t * 0.8)
    return hiss * env * 0.6

# SFX C: Industrial Warning Alarm Beeps
def gen_alarm_pulse(duration=6.5):
    total = np.zeros(int(SR * duration), dtype=np.float32)
    beep_len = int(SR * 0.12)
    t_beep = np.linspace(0, 0.12, beep_len, endpoint=False)
    beep = 0.3 * np.sin(2 * np.pi * 880 * t_beep) * np.sin(np.pi * t_beep / 0.12)
    # Beep doublets every 0.75s
    for t_sec in np.arange(0.0, duration - 0.5, 0.75):
        idx1 = int(t_sec * SR)
        idx2 = idx1 + int(0.18 * SR)
        if idx1 + beep_len < len(total): total[idx1:idx1+beep_len] += beep
        if idx2 + beep_len < len(total): total[idx2:idx2+beep_len] += beep * 0.85
    return total

# SFX D: OSHA Padlock Clamp Snap
def gen_padlock_snap():
    duration = 0.35
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)
    # Metal thud (120 Hz) + sharp mechanical latch transient (2400 Hz)
    thud = 0.5 * np.sin(2 * np.pi * 110 * t) * np.exp(-t * 30.0)
    click = 0.4 * np.random.randn(len(t)) * np.exp(-t * 80.0)
    sos = scipy.signal.butter(2, [1800, 4500], btype='bandpass', fs=SR, output='sos')
    filtered_click = scipy.signal.sosfilt(sos, click)
    return (thud + filtered_click) * 0.9

# SFX E: Calibrated Torque Wrench Ratchet Clicks + Digital Beep
def gen_torque_click(freq=1400):
    duration = 0.15
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)
    pawl = 0.6 * np.sin(2 * np.pi * freq * t) * np.exp(-t * 90.0)
    noise = 0.3 * np.random.randn(len(t)) * np.exp(-t * 120.0)
    return (pawl + noise) * 0.8

def gen_success_chime():
    duration = 0.6
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)
    # Pleasant two-tone confirmation: 1760 Hz (A6) -> 2637 Hz (E7)
    tone1 = 0.25 * np.sin(2 * np.pi * 1760 * t[:int(SR*0.15)]) * np.exp(-t[:int(SR*0.15)] * 15.0)
    t2 = t[int(SR*0.12):]
    tone2 = 0.35 * np.sin(2 * np.pi * 2637 * t2) * np.exp(-(t2 - 0.12) * 8.0)
    out = np.zeros_like(t)
    out[:len(tone1)] += tone1
    out[int(SR*0.12):int(SR*0.12)+len(tone2)] += tone2
    return out

# Place SFX across timeline
add_sfx(gen_braam(3.5, 42.0), start_time=0.0, gain=0.85)
add_sfx(gen_rupture(3.8), start_time=1.2, pan=0.7, gain=0.75)
add_sfx(gen_alarm_pulse(6.5), start_time=8.5, pan=0.4, gain=0.6)
add_sfx(gen_braam(4.0, 36.0), start_time=15.5, gain=0.9) # MECH-G Core activation
add_sfx(gen_padlock_snap(), start_time=26.5, pan=0.5, gain=0.85)
add_sfx(gen_torque_click(1200), start_time=35.0, pan=0.6, gain=0.75) # 15 Nm
add_sfx(gen_torque_click(1450), start_time=36.2, pan=0.6, gain=0.80) # 25 Nm
add_sfx(gen_torque_click(1700), start_time=37.5, pan=0.6, gain=0.90) # 35 Nm
add_sfx(gen_success_chime(), start_time=38.0, pan=0.5, gain=0.85)
add_sfx(gen_braam(5.0, 34.0), start_time=40.5, gain=1.0) # Verdict lockup impact

# 3. Trailer Background Music (120 BPM Tension Pulse & Climax)
bgm_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
t_arr = np.linspace(0, TOTAL_DUR, TOTAL_SAMPLES, endpoint=False)

# 120 BPM: beat = 0.5s, bar = 2.0s
# D minor: D1 (36.7 Hz), D2 (73.4 Hz), A2 (110 Hz), F2 (87.3 Hz)
bass_pulse = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
beat_samples = int(SR * 0.25) # eighth note pulse
t_beat = np.linspace(0, 0.25, beat_samples, endpoint=False)
synth_pluck = np.sin(2 * np.pi * 73.4 * t_beat) * np.exp(-t_beat * 14.0)

for b_idx in range(0, TOTAL_SAMPLES - beat_samples, beat_samples):
    bass_pulse[b_idx:b_idx+beat_samples] += synth_pluck * 0.35

# Build dramatic crescendo & percussion hits
bgm_left = bass_pulse * 0.7
bgm_right = bass_pulse * 0.7

# Add tension string drone (220 Hz / 293.6 Hz D4)
drone = 0.08 * (np.sin(2 * np.pi * 146.8 * t_arr) + 0.5 * np.sin(2 * np.pi * 220.0 * t_arr))
bgm_left += drone
bgm_right += drone

# Climax swell from 38.0s to 46.0s
climax_env = np.clip((t_arr - 38.0) / 4.0, 0.0, 1.0) * (1.0 - np.clip((t_arr - 45.5) / 2.5, 0.0, 1.0))
climax_brass = 0.25 * np.sin(2 * np.pi * 73.4 * t_arr) + 0.15 * np.sin(2 * np.pi * 110.0 * t_arr)
bgm_left += climax_brass * climax_env
bgm_right += climax_brass * climax_env

# 4. Sidechain Ducking & Master Sum
# Smooth speech envelope using fast FFT convolution
duck_kernel = np.ones(int(SR * 0.25), dtype=np.float32) / (SR * 0.25)
smooth_speech = scipy.signal.fftconvolve(speech_envelope, duck_kernel, mode='same')
duck_factor = 1.0 - 0.65 * np.clip(smooth_speech * 2.0, 0.0, 1.0) # ducks BGM by ~8 dB during dialogue

bgm_track[:, 0] = bgm_left * duck_factor * 0.55
bgm_track[:, 1] = bgm_right * duck_factor * 0.55

master_mix = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
master_mix[:, 0] = voice_track[:, 0] * 1.0 + sfx_track[:, 0] * 0.95 + bgm_track[:, 0]
master_mix[:, 1] = voice_track[:, 1] * 1.0 + sfx_track[:, 1] * 0.95 + bgm_track[:, 1]

# Apply smooth master fade out in last 0.8s
fade_start = int((TOTAL_DUR - 0.8) * SR)
fade_len = TOTAL_SAMPLES - fade_start
master_mix[fade_start:, 0] *= np.linspace(1.0, 0.0, fade_len)
master_mix[fade_start:, 1] *= np.linspace(1.0, 0.0, fade_len)

# Master peak limiting to -0.5 dBFS
peak = np.max(np.abs(master_mix))
if peak > 0.94:
    master_mix = (master_mix / peak) * 0.94

master_out_path = os.path.join(OUT_DIR, "mix.wav")
sf.write(master_out_path, master_mix, SR)
print(f"[MASTER AUDIO] Generated successfully at {master_out_path}")
print(f"[STATS] Duration: {len(master_mix)/SR:.3f}s | Peak: {20*np.log10(np.max(np.abs(master_mix))):.2f} dBFS")
