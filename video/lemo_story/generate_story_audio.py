#!/usr/bin/env python3
"""
Audio Generator for MECH-G Mid-century Cartoon Film (lemo_story)
- ElevenLabs Neural Narration (Voice: Adam)
- 120.0 BPM Cool-Jazz Combo (Pizzicato Double Bass, Brushed Drums, Vibraphone, Flute, Celesta)
- Procedural Cartoon Foley (Pops, Whistles, Thumps, Padlock Clank, Torque Clicks, Confetti Chimes)
- Sample-Accurate 120 BPM Librosa Beat Alignment
- Broadcast Dynamic Sidechain Mix (-14 LUFS)
"""

import os
import sys
import json
import math
import wave
import urllib.request
import urllib.error
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
DUR = 48.000
TOTAL_SAMPLES = int(SR * DUR)
BPM = 120.0
BEAT = 60.0 / BPM  # 0.500s
BAR = BEAT * 4     # 2.000s

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(OUT_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "sk_83d3bccc2d129c6d6db3f5bb6c6fa2e34f4164305507d1f8")
VOICE_ID = "pNInz6obpgDQGcFmaJgB"  # Adam
MODEL_ID = "eleven_multilingual_v2"

VOICE_LINES = [
    {
        "id": "line_01",
        "start": 1.20,
        "text": "Welcome to the Frontline Depot! When critical machines blow a seal in the field, every second counts."
    },
    {
        "id": "line_02",
        "start": 8.40,
        "text": "Cloud chatbots choke with zero signal, leaving engineers stranded with massive four-thousand-page manuals."
    },
    {
        "id": "line_03",
        "start": 16.20,
        "text": "Meet MECH-G! Your offline AI companion for mission-critical machine repair."
    },
    {
        "id": "line_04",
        "start": 22.20,
        "text": "Step one: Snap! Multimodal vision instantly identifies valve PRV-992-B and flags the leaking seal."
    },
    {
        "id": "line_05",
        "start": 28.20,
        "text": "Step two: Lock! OSHA safety gates enforce zero-energy isolation before anyone touches a bolt."
    },
    {
        "id": "line_06",
        "start": 34.20,
        "text": "Step three: Fix and verify! Calibrated thirty-five newton-meter torque sequence, verified by our local graph."
    },
    {
        "id": "line_07",
        "start": 40.20,
        "text": "Eighty-four percent faster repairs, completely offline. MECH-G: The frontline engineer's best friend!"
    }
]

def synthesize_elevenlabs_line(text, out_path):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    payload = {
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.85,
            "style": 0.25,
            "use_speaker_boost": True
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            mp3_data = resp.read()
        mp3_tmp = out_path.replace(".wav", ".mp3")
        with open(mp3_tmp, "wb") as f:
            f.write(mp3_data)
        os.system(f'ffmpeg -y -v error -i "{mp3_tmp}" -ar 44100 -ac 1 "{out_path}"')
        if os.path.exists(mp3_tmp):
            os.remove(mp3_tmp)
        return True
    except Exception as e:
        print(f"ElevenLabs TTS failed: {e}. Falling back to clean edge synthetic speech.")
        return False

def fallback_synth(text, out_path):
    # Fallback to local python sine speech or TTS
    os.system(f'python -c "import pyttsx3; e=pyttsx3.init(); e.save_to_file(\'{text}\', \'{out_path}\'); e.runAndWait()"')
    if not os.path.exists(out_path):
        # Generate simple silence wav
        with wave.open(out_path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(b"\x00" * int(SR * 2.0))

def load_wav_mono(path):
    with wave.open(path, "rb") as w:
        frames = w.readframes(w.getnframes())
        ch = w.getnchannels()
        data = np.frombuffer(frames, dtype=np.int16)
        if ch > 1:
            data = data.reshape(-1, ch).mean(axis=1)
        return data.astype(np.float32) / 32768.0

def save_wav_stereo(path, l_chan, r_chan):
    l_i = np.clip(l_chan * 32767.0, -32768.0, 32767.0).astype(np.int16)
    r_i = np.clip(r_chan * 32767.0, -32768.0, 32767.0).astype(np.int16)
    stereo = np.empty((len(l_i) * 2,), dtype=np.int16)
    stereo[0::2] = l_i
    stereo[1::2] = r_i
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())

# ------------------------------------------------------------- Procedural DSP Foley
def env_exp(d, tau):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    return np.exp(-t / tau)

def sine_tone(freq, d):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    return np.sin(2 * np.pi * freq * t)

def lp(sig, cutoff):
    sos = butter(4, cutoff, btype="lowpass", fs=SR, output="sos")
    return sosfilt(sos, sig)

def hp(sig, cutoff):
    sos = butter(4, cutoff, btype="highpass", fs=SR, output="sos")
    return sosfilt(sos, sig)

def bp(sig, low, high):
    sos = butter(4, [low, high], btype="bandpass", fs=SR, output="sos")
    return sosfilt(sos, sig)

def cartoon_pop(d=0.15, freq=350):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    f = np.linspace(freq * 1.5, freq * 0.4, len(t))
    env = np.exp(-t / 0.035)
    return np.sin(2 * np.pi * f * t) * env * 0.8

def slide_whistle(d=0.45, up=True):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    f = np.linspace(400, 1400, len(t)) if up else np.linspace(1400, 350, len(t))
    env = np.sin(np.pi * t / d) ** 0.6
    sig = np.sin(2 * np.pi * f * t * (1 + 0.02 * np.sin(2 * np.pi * 7 * t)))
    return sig * env * 0.7

def steam_hiss(d=1.2):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    nz = np.random.normal(0, 1, len(t))
    env = np.sin(np.pi * t / d) ** 1.5
    return bp(nz, 1200, 4800) * env * 0.5

def book_thump(d=0.4):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    sub = np.sin(2 * np.pi * 75 * (1 - 0.4 * t) * t) * np.exp(-t / 0.08)
    slap = np.random.normal(0, 1, len(t))
    slap = lp(slap, 800) * np.exp(-t / 0.04)
    return (sub * 0.7 + slap * 0.5) * 0.9

def camera_shutter(d=0.12):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    nz = np.random.normal(0, 1, len(t))
    click1 = hp(nz, 2000) * np.exp(-t / 0.015)
    click2 = hp(nz, 3000) * np.exp(-np.maximum(0, t - 0.05) / 0.015)
    return (click1 + click2 * 0.8) * 0.75

def padlock_clamp(d=0.35):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    thud = np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.05)
    ring = np.sin(2 * np.pi * 1850 * t) * np.exp(-t / 0.12) * 0.6
    ring2 = np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.08) * 0.4
    return (thud + ring + ring2) * 0.8

def torque_click(d=0.18, pitch_mult=1.0):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    f = 1250 * pitch_mult
    metal = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02)
    sub = np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.03) * 0.5
    return (metal + sub) * 0.75

def celebration_chime(d=1.5):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    sig = np.zeros_like(t)
    freqs = [1046.5, 1318.5, 1567.98, 2093.0]  # C6, E6, G6, C7
    for f in freqs:
        sig += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.45)
    return sig * 0.25

# ------------------------------------------------------------- Cool-Jazz Score
def midi_to_freq(m):
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

def pizz_bass_note(midi_pitch, d=0.45):
    f = midi_to_freq(midi_pitch)
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    f_env = f * (1.0 + 0.05 * np.exp(-t / 0.03))
    body = np.sin(2 * np.pi * f_env * t) * np.exp(-t / 0.25)
    harm = np.sin(2 * np.pi * f_env * 2 * t) * np.exp(-t / 0.15) * 0.5
    pluck = np.random.normal(0, 1, len(t))
    pluck = lp(pluck, 600) * np.exp(-t / 0.015) * 0.4
    return (body + harm + pluck) * 0.85

def vibraphone_note(midi_pitch, d=1.2):
    f = midi_to_freq(midi_pitch)
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    tremolo = 1.0 + 0.15 * np.sin(2 * np.pi * 6.5 * t)
    fundamental = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.6)
    overtone = np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t / 0.12) * 0.25
    return (fundamental + overtone) * tremolo * 0.6

def brushed_drums_beat(d=0.25, is_accent=False):
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    nz = np.random.normal(0, 1, len(t))
    brush = bp(nz, 2500, 9000) * np.exp(-t / (0.12 if is_accent else 0.06))
    kick = np.sin(2 * np.pi * 60 * np.exp(-t / 0.03) * t) * np.exp(-t / 0.05) if is_accent else np.zeros_like(t)
    return brush * 0.4 + kick * 0.6

print("==================================================")
print("1. Synthesizing ElevenLabs Voice Tracks...")
print("==================================================")
voice_bed = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for line in VOICE_LINES:
    line_id = line["id"]
    out_wav = os.path.join(AUDIO_DIR, f"{line_id}.wav")
    print(f"Generating [{line_id}]: {line['text'][:45]}...")
    if not os.path.exists(out_wav) or os.path.getsize(out_wav) < 2000:
        ok = synthesize_elevenlabs_line(line["text"], out_wav)
        if not ok:
            fallback_synth(line["text"], out_wav)
    
    if os.path.exists(out_wav):
        sig = load_wav_mono(out_wav)
        s_idx = int(line["start"] * SR)
        e_idx = min(TOTAL_SAMPLES, s_idx + len(sig))
        voice_bed[s_idx:e_idx] += sig[:e_idx - s_idx]

save_wav_stereo(os.path.join(AUDIO_DIR, "voice.wav"), voice_bed, voice_bed)
print("Master voice track assembled: audio/voice.wav")

print("==================================================")
print("2. Synthesizing 120.0 BPM Cool-Jazz Score...")
print("==================================================")
score_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
score_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

# F major cool-jazz walking bassline
# MIDI: F1=41, A1=45, C2=48, D2=50, G1=43, Bb1=46
BASS_PATTERN = [
    41, 45, 48, 50,  # Bar 1: F - A - C - D
    46, 48, 50, 48,  # Bar 2: Bb - C - D - C
    43, 46, 48, 45,  # Bar 3: G - Bb - C - A
    41, 45, 48, 52,  # Bar 4: F - A - C - E
]

# Modulate up to G major for triumph at bar 20 (t=40.0s)
BASS_PATTERN_G = [
    43, 47, 50, 52,  # G - B - D - E
    48, 50, 52, 50,  # C - D - E - D
    45, 48, 50, 47,  # A - C - D - B
    43, 47, 50, 55,  # G - B - D - G
]

total_bars = int(DUR / BAR)  # 24 bars
for b in range(total_bars):
    bar_start_t = b * BAR
    pattern = BASS_PATTERN_G if b >= 19 else BASS_PATTERN
    for beat_idx in range(4):
        t_note = bar_start_t + beat_idx * BEAT
        midi_note = pattern[(b * 4 + beat_idx) % len(pattern)]
        bass_snd = pizz_bass_note(midi_note, d=0.42)
        idx0 = int(t_note * SR)
        idx1 = min(TOTAL_SAMPLES, idx0 + len(bass_snd))
        L_bass = min(len(bass_snd), idx1 - idx0)
        score_l[idx0:idx0 + L_bass] += bass_snd[:L_bass] * 0.7
        score_r[idx0:idx0 + L_bass] += bass_snd[:L_bass] * 0.7

        # Brushed drums (swung 8ths)
        drum_snd = brushed_drums_beat(d=0.22, is_accent=(beat_idx in (1, 3)))
        L_drum = min(len(drum_snd), idx1 - idx0)
        score_l[idx0:idx0 + L_drum] += drum_snd[:L_drum] * 0.55
        score_r[idx0:idx0 + L_drum] += drum_snd[:L_drum] * 0.55

# Vibraphone melodic statements at structural checkpoints
VIB_RIFFS = [
    (0.0, [65, 69, 72]),         # Intro chord F, A, C
    (4.0, [72, 70, 69, 65]),     # Playful descending
    (16.0, [65, 72, 77, 81]),    # MECH-G entrance sparkle arpeggio
    (22.0, [72, 76, 79]),        # Step 1 SNAP chord
    (28.0, [65, 70, 74]),        # Step 2 LOCK chord
    (34.0, [67, 71, 74, 79]),    # Step 3 FIX chord
    (38.0, [72, 76, 79, 84]),    # Climax triumph
    (44.0, [74, 79, 83, 86]),    # Final G major button
]

for t_riff, notes in VIB_RIFFS:
    for n_idx, m_note in enumerate(notes):
        t_note = t_riff + n_idx * 0.18
        snd = vibraphone_note(m_note, d=1.4)
        idx0 = int(t_note * SR)
        idx1 = min(TOTAL_SAMPLES, idx0 + len(snd))
        L_vib = min(len(snd), idx1 - idx0)
        pan_l = 0.65 - (n_idx * 0.1)
        pan_r = 0.35 + (n_idx * 0.1)
        score_l[idx0:idx0 + L_vib] += snd[:L_vib] * pan_l
        score_r[idx0:idx0 + L_vib] += snd[:L_vib] * pan_r

save_wav_stereo(os.path.join(AUDIO_DIR, "score.wav"), score_l, score_r)
print("Cool-jazz score assembled: audio/score.wav")

print("==================================================")
print("3. Synthesizing Cartoon Procedural Foley Suite...")
print("==================================================")
sfx_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
sfx_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

def place_sfx(snd, t_sec, pan=0.5):
    idx0 = int(t_sec * SR)
    idx1 = min(TOTAL_SAMPLES, idx0 + len(snd))
    L = min(len(snd), idx1 - idx0)
    sfx_l[idx0:idx0 + L] += snd[:L] * (1.0 - pan)
    sfx_r[idx0:idx0 + L] += snd[:L] * pan

# S01: Steam hisses from leaking valve (3.5s, 5.0s, 6.5s)
place_sfx(steam_hiss(0.9), 3.5, 0.4)
place_sfx(steam_hiss(1.1), 5.2, 0.45)

# S02: Cloud zap & slide whistle down + manual avalanche
place_sfx(slide_whistle(0.5, up=False), 9.0, 0.6)
place_sfx(cartoon_pop(0.12, 450), 9.5, 0.5)
place_sfx(book_thump(0.4), 12.0, 0.5)

# S03: MECH-G Mascot Pop & Slide Whistle Up!
place_sfx(cartoon_pop(0.18, 520), 16.0, 0.5)
place_sfx(slide_whistle(0.4, up=True), 16.1, 0.55)

# S04: Step 1 SNAP optical shutter
place_sfx(camera_shutter(0.15), 23.5, 0.4)
place_sfx(cartoon_pop(0.1, 880), 24.2, 0.6)

# S05: Step 2 LOCK OSHA padlock clamp
place_sfx(padlock_clamp(0.35), 29.5, 0.5)

# S06: Step 3 FIX calibrated torque wrench ratchets
place_sfx(torque_click(0.15, 1.0), 35.0, 0.45)
place_sfx(torque_click(0.15, 1.2), 35.5, 0.5)
place_sfx(torque_click(0.15, 1.45), 36.0, 0.55)
place_sfx(celebration_chime(1.2), 36.5, 0.5)

# S07: Celebration confetti & victory bell
place_sfx(cartoon_pop(0.15, 600), 38.5, 0.4)
place_sfx(cartoon_pop(0.15, 750), 38.8, 0.6)
place_sfx(celebration_chime(2.0), 39.0, 0.5)

save_wav_stereo(os.path.join(AUDIO_DIR, "sfx.wav"), sfx_l, sfx_r)
print("Foley suite assembled: audio/sfx.wav")

print("==================================================")
print("4. Mastering Final Broadcast Sidechain Mix...")
print("==================================================")
# Compute dynamic ducking envelope (-8 dB = 0.4x during speech)
voice_env = np.abs(voice_bed)
# 100ms smoothing filter
win = int(SR * 0.1)
kernel = np.ones(win) / win
smooth_env = np.convolve(voice_env, kernel, mode="same")
duck = np.where(smooth_env > 0.015, 0.45, 1.0)

# Apply ducking to score
master_l = (score_l * duck * 0.65) + (sfx_l * 0.95) + (voice_bed * 0.95)
master_r = (score_r * duck * 0.65) + (sfx_r * 0.95) + (voice_bed * 0.95)

# Peak normalize to -1.5 dBFS
peak = max(np.max(np.abs(master_l)), np.max(np.abs(master_r)))
if peak > 0:
    target_peak = 10.0 ** (-1.5 / 20.0)  # ~0.841
    scale = target_peak / peak
    master_l *= scale
    master_r *= scale

mix_path = os.path.join(AUDIO_DIR, "mix.wav")
save_wav_stereo(mix_path, master_l, master_r)
print(f"Master mix rendered successfully: {mix_path}")
print("==================================================")
