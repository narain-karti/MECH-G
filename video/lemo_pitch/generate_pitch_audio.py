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
TOTAL_DUR = 60.0
TOTAL_SAMPLES = int(SR * TOTAL_DUR)

OUT_DIR = r"c:\Users\pnara\Downloads\MECH-G\PROJECT-GEMMA\video\lemo_pitch\audio"
os.makedirs(OUT_DIR, exist_ok=True)

# Brian: Authoritative, energetic, professional presenter
VOICE_PRESENTER = "nPczCjzI2devNBz1zQrb"

LINES = [
    {
        "id": "pitch_01_problem",
        "voice": VOICE_PRESENTER,
        "text": "In high-stakes industrial fields, cloud AI fails. When a two-ten bar hydraulic valve blows a seal at sea, internet does not exist.",
        "start_time": 0.6,
        "stability": 0.65,
        "similarity_boost": 0.90
    },
    {
        "id": "pitch_02_intro",
        "voice": VOICE_PRESENTER,
        "text": "Enter MECH-G. Powered by Google Gemma 4 running entirely on-device, MECH-G brings deterministic intelligence to the edge with zero cloud dependencies.",
        "start_time": 8.2,
        "stability": 0.70,
        "similarity_boost": 0.90
    },
    {
        "id": "pitch_03_graph",
        "voice": VOICE_PRESENTER,
        "text": "Under the hood, our Open Knowledge Format compiler transforms complex OEM manuals into an in-memory directed graph, traversing machine topologies in under five hundred milliseconds.",
        "start_time": 17.2,
        "stability": 0.70,
        "similarity_boost": 0.90
    },
    {
        "id": "pitch_04_auditor",
        "voice": VOICE_PRESENTER,
        "text": "Safety demands zero hallucinations. Our AST Citation Auditor mathematically verifies every claim and torque specification directly against source nodes before streaming.",
        "start_time": 26.2,
        "stability": 0.75,
        "similarity_boost": 0.90
    },
    {
        "id": "pitch_05_loto",
        "voice": VOICE_PRESENTER,
        "text": "Before a single bolt is turned, MECH-G enforces mandatory OSHA nineteen-ten dot one-forty-seven lockout gates. Combined with multimodal vision and acoustic audio telemetry, repairs are certified safe.",
        "start_time": 34.2,
        "stability": 0.70,
        "similarity_boost": 0.90
    },
    {
        "id": "pitch_06_workspace",
        "voice": VOICE_PRESENTER,
        "text": "The engineer workstation pairs a NotebookLM-style workspace with interactive visual graph exploration, putting verified procedures at the technician's fingertips.",
        "start_time": 43.2,
        "stability": 0.70,
        "similarity_boost": 0.90
    },
    {
        "id": "pitch_07_cta",
        "voice": VOICE_PRESENTER,
        "text": "Eighty-four percent faster repairs. Completely offline. When seconds count, trust MECH-G. Star and clone today on GitHub!",
        "start_time": 51.2,
        "stability": 0.65,
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
    print(f"[TTS] Synthesizing {line_info['id']}...")
    with urllib.request.urlopen(req) as resp:
        pcm_bytes = resp.read()
    
    samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    sf.write(cache_path, samples, 48000)
    print(f"[TTS] Saved {cache_path} ({len(samples)/48000:.2f}s)")
    return samples, 48000

# Synthesize all speech
voice_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
speech_envelope = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for item in LINES:
    samples, sr = synthesize_line(item)
    start_idx = int(item["start_time"] * sr)
    end_idx = min(TOTAL_SAMPLES, start_idx + len(samples))
    line_slice = samples[:end_idx - start_idx]
    
    # Broadcast Center-dominant panning
    voice_track[start_idx:end_idx, 0] += line_slice * 0.95
    voice_track[start_idx:end_idx, 1] += line_slice * 0.95
    speech_envelope[start_idx:end_idx] = 1.0

# 2. Sound Effects
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

# Sub Braam Impact
def gen_braam(dur=3.5, freq=40.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    f_bend = freq * (1.0 - 0.2 * (t / dur))
    wave = 0.6 * np.sin(2 * np.pi * np.cumsum(f_bend) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f_bend) / SR)
    env = np.exp(-t * 1.0)
    sos = scipy.signal.butter(2, 240, btype='lowpass', fs=SR, output='sos')
    return scipy.signal.sosfilt(sos, wave * env) * 0.85

# Hydraulic Hiss
def gen_hiss(dur=3.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    noise = np.random.randn(len(t))
    sos = scipy.signal.butter(2, [1400, 3800], btype='bandpass', fs=SR, output='sos')
    return scipy.signal.sosfilt(sos, noise) * np.exp(-t * 1.1) * 0.5

# High-Tech Hologram Whoosh & Scan
def gen_scan():
    dur = 1.2
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    f = 400 + 1600 * (t / dur)
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur)
    return sweep * 0.35

# Padlock Latch
def gen_latch():
    dur = 0.3
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    click = np.sin(2 * np.pi * 120 * t) * np.exp(-t * 30.0) + 0.5 * np.random.randn(len(t)) * np.exp(-t * 70.0)
    return click * 0.7

# Calibrated Torque Clicks
def gen_click(freq=1500):
    dur = 0.12
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 85.0) * 0.7

# Digital Confirmation Double-Beep
def gen_chime():
    dur = 0.5
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    t1 = t[:int(SR*0.12)]
    tone1 = 0.25 * np.sin(2 * np.pi * 1760 * t1) * np.exp(-t1 * 15.0)
    t2 = t[int(SR*0.15):int(SR*0.35)]
    tone2 = 0.35 * np.sin(2 * np.pi * 2637 * (t2 - 0.15)) * np.exp(-(t2 - 0.15) * 12.0)
    out = np.zeros_like(t)
    out[:len(tone1)] += tone1
    out[int(SR*0.15):int(SR*0.15)+len(tone2)] += tone2
    return out

add_sfx(gen_braam(3.5, 42.0), start_time=0.0, gain=0.85)
add_sfx(gen_hiss(3.0), start_time=2.5, pan=0.6, gain=0.65)
add_sfx(gen_scan(), start_time=8.0, pan=0.5, gain=0.6)
add_sfx(gen_braam(3.0, 38.0), start_time=17.0, gain=0.8)
add_sfx(gen_scan(), start_time=26.0, pan=0.5, gain=0.6)
add_sfx(gen_latch(), start_time=36.5, pan=0.5, gain=0.85)
add_sfx(gen_click(1200), start_time=38.5, pan=0.5, gain=0.7)
add_sfx(gen_click(1450), start_time=39.5, pan=0.5, gain=0.75)
add_sfx(gen_click(1700), start_time=40.5, pan=0.5, gain=0.85)
add_sfx(gen_chime(), start_time=41.0, pan=0.5, gain=0.85)
add_sfx(gen_braam(4.5, 35.0), start_time=51.0, gain=0.95)

# 3. Driving Tech BGM (120 BPM Electronic Pulse & Crescendo)
bgm_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
t_arr = np.linspace(0, TOTAL_DUR, TOTAL_SAMPLES, endpoint=False)

# Bassline rhythm on eighth notes
beat_samples = int(SR * 0.25) # eighth note
t_b = np.linspace(0, 0.25, beat_samples, endpoint=False)
synth_pluck = np.sin(2 * np.pi * 65.4 * t_b) * np.exp(-t_b * 12.0) # C2 bass pluck

pulse = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
for idx in range(0, TOTAL_SAMPLES - beat_samples, beat_samples):
    pulse[idx:idx+beat_samples] += synth_pluck * 0.35

# Ambient melodic tension strings
drone = 0.07 * (np.sin(2 * np.pi * 130.8 * t_arr) + 0.5 * np.sin(2 * np.pi * 196.0 * t_arr))

# Climax buildup from 48.0s to 58.0s
climax_env = np.clip((t_arr - 48.0) / 4.0, 0.0, 1.0) * (1.0 - np.clip((t_arr - 58.0) / 2.0, 0.0, 1.0))
climax_brass = 0.22 * np.sin(2 * np.pi * 65.4 * t_arr) + 0.15 * np.sin(2 * np.pi * 98.0 * t_arr)

bgm_left = (pulse + drone + climax_brass * climax_env) * 0.75
bgm_right = (pulse + drone + climax_brass * climax_env) * 0.75

# Fast FFT Sidechain Ducking
duck_kernel = np.ones(int(SR * 0.25), dtype=np.float32) / (SR * 0.25)
smooth_speech = scipy.signal.fftconvolve(speech_envelope, duck_kernel, mode='same')
duck_factor = 1.0 - 0.65 * np.clip(smooth_speech * 2.0, 0.0, 1.0)

bgm_track[:, 0] = bgm_left * duck_factor * 0.65
bgm_track[:, 1] = bgm_right * duck_factor * 0.65

# Master Sum
master_mix = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
master_mix[:, 0] = voice_track[:, 0] * 1.0 + sfx_track[:, 0] * 0.95 + bgm_track[:, 0]
master_mix[:, 1] = voice_track[:, 1] * 1.0 + sfx_track[:, 1] * 0.95 + bgm_track[:, 1]

# Master Fade
fade_start = int((TOTAL_DUR - 0.8) * SR)
fade_len = TOTAL_SAMPLES - fade_start
master_mix[fade_start:, 0] *= np.linspace(1.0, 0.0, fade_len)
master_mix[fade_start:, 1] *= np.linspace(1.0, 0.0, fade_len)

peak = np.max(np.abs(master_mix))
if peak > 0.82:
    master_mix = (master_mix / peak) * 0.82

master_out = os.path.join(OUT_DIR, "mix.wav")
sf.write(master_out, master_mix, SR)
print(f"[PITCH MASTER AUDIO] Generated successfully at {master_out}")
print(f"[STATS] Duration: {len(master_mix)/SR:.3f}s | Peak: {20*np.log10(np.max(np.abs(master_mix))):.2f} dBFS")
