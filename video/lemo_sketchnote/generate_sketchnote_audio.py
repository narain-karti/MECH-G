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

OUT_DIR = r"c:\Users\pnara\Downloads\MECH-G\PROJECT-GEMMA\video\lemo_sketchnote\audio"
os.makedirs(OUT_DIR, exist_ok=True)

# Voice configuration:
# Alex (frantic, high-pitch field tech): Laura (FGY2WhTYpPnrIDTdsKH5)
# MECH-G Mascot (deep, calm, charming baritone): Brian (nPczCjzI2devNBz1zQrb)
VOICE_ALEX = "FGY2WhTYpPnrIDTdsKH5"
VOICE_MECHG = "nPczCjzI2devNBz1zQrb"

LINES = [
    {
        "id": "sketch_01_alex",
        "voice": VOICE_ALEX,
        "text": "Help! I'm trapped a hundred meters up this turbine! Valve PRV-992 is blowing oil, and the cloud AI says 'no internet'!",
        "start_time": 0.6,
        "speaker": "alex",
        "stability": 0.35,
        "similarity_boost": 0.85
    },
    {
        "id": "sketch_02_mechg",
        "voice": VOICE_MECHG,
        "text": "Hold on, Alex! MECH-G is here! I live right on this tablet—no cloud, no lag, pure offline genius!",
        "start_time": 7.2,
        "speaker": "mechg",
        "stability": 0.75,
        "similarity_boost": 0.90
    },
    {
        "id": "sketch_03_mechg",
        "voice": VOICE_MECHG,
        "text": "Look at our knowledge graph! In three clicks, I mapped the entire hydraulic circuit right down to the exact M12 bolt!",
        "start_time": 13.8,
        "speaker": "mechg",
        "stability": 0.80,
        "similarity_boost": 0.90
    },
    {
        "id": "sketch_04_alex",
        "voice": VOICE_ALEX,
        "text": "Whoa! It says: step one, lock the OSHA safety gate! Clamping the red padlock now... 210 bar drops to zero!",
        "start_time": 20.6,
        "speaker": "alex",
        "stability": 0.40,
        "similarity_boost": 0.85
    },
    {
        "id": "sketch_05_mechg",
        "voice": VOICE_MECHG,
        "text": "Step two: grab the torque wrench! Three star-pattern passes: fifteen, twenty-five, thirty-five Newton-meters!",
        "start_time": 27.2,
        "speaker": "mechg",
        "stability": 0.80,
        "similarity_boost": 0.90
    },
    {
        "id": "sketch_06_alex",
        "voice": VOICE_ALEX,
        "text": "Click! Click! Click! Dual green LEDs! The gasket is sealed! MECH-G, you're an absolute lifesaver!",
        "start_time": 34.0,
        "speaker": "alex",
        "stability": 0.35,
        "similarity_boost": 0.85
    },
    {
        "id": "sketch_07_mechg",
        "voice": VOICE_MECHG,
        "text": "Eighty-four percent faster repairs, zero cloud risk! MECH-G: The frontline engineer's best friend!",
        "start_time": 40.8,
        "speaker": "mechg",
        "stability": 0.70,
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
    
    # Gentle stereo panning
    pan = 0.45 if item["speaker"] == "alex" else 0.55
    left_gain = math.cos(pan * math.pi / 2)
    right_gain = math.sin(pan * math.pi / 2)
    
    voice_track[start_idx:end_idx, 0] += line_slice * left_gain
    voice_track[start_idx:end_idx, 1] += line_slice * right_gain
    speech_envelope[start_idx:end_idx] = 1.0

# 2. Sketchnote Foley & Sound Effects
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

# A: Continuous Paper Pen Scratching (organic drawing rhythm)
pen_scratch = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
for t_sec in np.arange(0.1, TOTAL_DUR - 1.5, 0.45):
    burst_len = int(SR * np.random.uniform(0.12, 0.28))
    t_b = np.linspace(0, burst_len / SR, burst_len, endpoint=False)
    noise = np.random.randn(burst_len)
    sos = scipy.signal.butter(2, [2400, 5800], btype='bandpass', fs=SR, output='sos')
    scratch = scipy.signal.sosfilt(sos, noise) * np.sin(np.pi * t_b / (burst_len / SR))
    idx = int(t_sec * SR)
    if idx + burst_len < TOTAL_SAMPLES:
        pen_scratch[idx:idx+burst_len] += scratch * 0.12

add_sfx(pen_scratch, start_time=0.0, gain=0.6)

# B: Mascot Spring Pop ("Boing!")
def gen_boing():
    dur = 0.45
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    # FM synthesis: rising pitch 200 Hz -> 550 Hz with 25 Hz vibrato
    freq = 220.0 + 320.0 * (t / dur) + 40.0 * np.sin(2 * np.pi * 24.0 * t)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    wave = np.sin(phase) * np.exp(-t * 6.0)
    return wave * 0.5

# C: Knowledge Graph Sparkle / Twinkle
def gen_twinkle():
    dur = 1.2
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    out = np.zeros_like(t)
    pitches = [1046, 1318, 1567, 2093, 2637]
    for i, p in enumerate(pitches):
        sub_t = t[int(i * 0.15 * SR):]
        if len(sub_t) > 0:
            env = np.exp(-sub_t * 12.0)
            tone = 0.15 * np.sin(2 * np.pi * p * sub_t) * env
            out[int(i * 0.15 * SR):int(i * 0.15 * SR)+len(tone)] += tone
    return out

# D: Padlock Snap
def gen_padlock():
    dur = 0.25
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    thud = 0.5 * np.sin(2 * np.pi * 140 * t) * np.exp(-t * 35.0)
    click = 0.4 * np.random.randn(len(t)) * np.exp(-t * 80.0)
    sos = scipy.signal.butter(2, [1500, 4000], btype='bandpass', fs=SR, output='sos')
    return (thud + scipy.signal.sosfilt(sos, click)) * 0.75

# E: Torque Ratchet Clicks
def gen_ratchet(freq=1500):
    dur = 0.12
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    click = 0.6 * np.sin(2 * np.pi * freq * t) * np.exp(-t * 85.0)
    return click * 0.7

# F: Victory Chime
def gen_fanfare():
    dur = 1.8
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    chord = (0.2 * np.sin(2 * np.pi * 523.25 * t) +
             0.2 * np.sin(2 * np.pi * 659.25 * t) +
             0.25 * np.sin(2 * np.pi * 783.99 * t) +
             0.3 * np.sin(2 * np.pi * 1046.50 * t)) * np.exp(-t * 2.2)
    return chord

add_sfx(gen_boing(), start_time=7.0, pan=0.6, gain=0.8)
add_sfx(gen_twinkle(), start_time=14.2, pan=0.5, gain=0.85)
add_sfx(gen_padlock(), start_time=24.5, pan=0.45, gain=0.85)
add_sfx(gen_ratchet(1200), start_time=34.8, pan=0.5, gain=0.75)
add_sfx(gen_ratchet(1450), start_time=35.5, pan=0.5, gain=0.80)
add_sfx(gen_ratchet(1700), start_time=36.2, pan=0.5, gain=0.85)
add_sfx(gen_fanfare(), start_time=38.2, pan=0.5, gain=0.85)

# 3. Acoustic Sketchnote Score (Plucked Marimba, Pizzicato Cello & Kalimba)
# 120.0 BPM: 0.5s beat, 2.0s bar
bgm_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
t_arr = np.linspace(0, TOTAL_DUR, TOTAL_SAMPLES, endpoint=False)

# C major progression: C - Am - F - G
chords = [
    [261.63, 329.63, 392.00], # C
    [220.00, 261.63, 329.63], # Am
    [174.61, 220.00, 261.63], # F
    [196.00, 246.94, 293.66]  # G
]

music = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
note_len = int(SR * 0.25) # eighth note
t_n = np.linspace(0, 0.25, note_len, endpoint=False)

beat_idx = 0
for bar_t in np.arange(0.0, TOTAL_DUR - 1.0, 2.0):
    c = chords[(beat_idx // 4) % len(chords)]
    # 4 eighth-note arpeggios per bar
    for step in range(8):
        freq = c[step % len(c)] * (2.0 if step >= 4 else 1.0)
        pluck = np.sin(2 * np.pi * freq * t_n) * np.exp(-t_n * 16.0)
        idx = int((bar_t + step * 0.25) * SR)
        if idx + note_len < TOTAL_SAMPLES:
            music[idx:idx+note_len] += pluck * 0.18
    beat_idx += 1

# Sidechain ducking (-8 dB during speech)
duck_kernel = np.ones(int(SR * 0.25), dtype=np.float32) / (SR * 0.25)
smooth_speech = scipy.signal.fftconvolve(speech_envelope, duck_kernel, mode='same')
duck_factor = 1.0 - 0.65 * np.clip(smooth_speech * 2.0, 0.0, 1.0)

bgm_track[:, 0] = music * duck_factor * 0.8
bgm_track[:, 1] = music * duck_factor * 0.8

# Master Sum
master_mix = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
master_mix[:, 0] = voice_track[:, 0] * 1.0 + sfx_track[:, 0] * 0.95 + bgm_track[:, 0]
master_mix[:, 1] = voice_track[:, 1] * 1.0 + sfx_track[:, 1] * 0.95 + bgm_track[:, 1]

# Smooth fade out in final 0.8s
fade_start = int((TOTAL_DUR - 0.8) * SR)
fade_len = TOTAL_SAMPLES - fade_start
master_mix[fade_start:, 0] *= np.linspace(1.0, 0.0, fade_len)
master_mix[fade_start:, 1] *= np.linspace(1.0, 0.0, fade_len)

# Peak normalization to -2.0 dBFS
peak = np.max(np.abs(master_mix))
if peak > 0.80:
    master_mix = (master_mix / peak) * 0.80

master_out = os.path.join(OUT_DIR, "mix.wav")
sf.write(master_out, master_mix, SR)
print(f"[SKETCHNOTE AUDIO] Generated successfully at {master_out}")
print(f"[STATS] Duration: {len(master_mix)/SR:.3f}s | Peak: {20*np.log10(np.max(np.abs(master_mix))):.2f} dBFS")
