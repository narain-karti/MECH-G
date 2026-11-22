"""generate_lemo_audio.py - Studio Audio Suite for MECH-G Lemo-Opuscar Pitch Film
- ElevenLabs Adam Voiceover (5 scenes timed to 45.0s timeline)
- 120.0 BPM Dark Keynote Score (45.0s)
- Procedural Foley SFX placed on exact beat grid frames
- Broadcast sidechain mix to target -14 LUFS
"""

import os
import wave
import json
import urllib.request
import urllib.error
import numpy as np
import scipy.signal as signal

SR = 44100
DUR = 48.0
TOTAL_SAMPLES = int(DUR * SR)
BPM = 120.0
BEAT_DUR = 60.0 / BPM # 0.500s

API_KEY = "sk_83d3bccc2d129c6d6db3f5bb6c6fa2e34f4164305507d1f8"
VOICE_ID = "pNInz6obpgDQGcFmaJgB" # Adam

AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

LINES = [
    {
        "id": "line_01",
        "start": 0.2,
        "text": "A hundred meters high, a hydraulic valve blows. Zero signal, four thousand manual pages, and thirty thousand dollars an hour downtime."
    },
    {
        "id": "line_02",
        "start": 10.0,
        "text": "Generic cloud AI drops safety interlocks and hallucinates fifty-five Newton meters instead of thirty-five—risking catastrophic blowout."
    },
    {
        "id": "line_03",
        "start": 20.0,
        "text": "Cloud AI is dead out here. Meet MECH-G."
    },
    {
        "id": "line_04",
        "start": 23.6,
        "text": "Snap: Gemma vision identifies the valve offline. Lock: OSHA safety gate verifies zero energy. Fix: Calibrated thirty-five Newton meters, backed by exact citations."
    },
    {
        "id": "line_05",
        "start": 37.4,
        "text": "Eighty-four percent faster repair. Sub-five-hundred millisecond local graph latency. MECH-G: Mission-critical edge intelligence."
    }
]

def synthesize_line(line_id: str, text: str, out_wav: str):
    print(f"Synthesizing [{line_id}] with ElevenLabs (Adam)...")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.85,
            "style": 0.05,
            "use_speaker_boost": True
        }
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
    mp3_tmp = out_wav.replace(".wav", ".mp3")
    with urllib.request.urlopen(req) as resp:
        with open(mp3_tmp, "wb") as f:
            f.write(resp.read())
            
    # Transcode to 44.1 kHz stereo 16-bit WAV
    import subprocess
    cmd = ["ffmpeg", "-y", "-i", mp3_tmp, "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", out_wav]
    subprocess.run(cmd, check=True, capture_output=True)
    if os.path.exists(mp3_tmp):
        os.remove(mp3_tmp)
        
    with wave.open(out_wav, "rb") as wf:
        actual_dur = wf.getnframes() / wf.getframerate()
    print(f"  [{line_id}] Generated: {actual_dur:.2f}s")
    return actual_dur

def build_voice_track():
    voice_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
    for item in LINES:
        wav_path = os.path.join(AUDIO_DIR, f"{item['id']}.wav")
        if not os.path.exists(wav_path):
            synthesize_line(item["id"], item["text"], wav_path)
            
        with wave.open(wav_path, "rb") as wf:
            frames = wf.readframes(wf.getnframes())
            data = np.frombuffer(frames, dtype=np.int16).reshape(-1, 2).astype(np.float32) / 32768.0
            
        start_idx = int(item["start"] * SR)
        end_idx = min(start_idx + data.shape[0], TOTAL_SAMPLES)
        act_len = end_idx - start_idx
        voice_track[start_idx:end_idx] += data[:act_len]
        
    # Peak normalization to -1.5 dBFS
    v_peak = np.max(np.abs(voice_track))
    if v_peak > 0:
        voice_track = voice_track * (0.841 / v_peak)
        
    out_path = os.path.join(AUDIO_DIR, "voice.wav")
    int16_data = (voice_track * 32767.0).astype(np.int16)
    with wave.open(out_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(int16_data.tobytes())
    print(f"Master voice track assembled: {out_path} ({DUR}s)")
    return voice_track

def build_score():
    print("Synthesizing 120.0 BPM Dark Keynote Score...")
    t = np.linspace(0, DUR, TOTAL_SAMPLES, endpoint=False)
    left = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    
    # -------------------------------------------------------------
    # 1. Analog D Minor Atmospheric Pad
    # -------------------------------------------------------------
    f_D1 = 36.71
    f_D2 = 73.42
    f_A2 = 110.00
    f_F3 = 174.61
    f_A3 = 220.00
    f_Bb2 = 116.54 # Tension chord
    
    pad_L = (
        0.35 * np.sin(2 * np.pi * (f_D2 * 0.998) * t) +
        0.30 * np.sin(2 * np.pi * (f_A2 * 1.002) * t) +
        0.20 * np.sin(2 * np.pi * (f_F3 * 0.997) * t)
    )
    pad_R = (
        0.35 * np.sin(2 * np.pi * (f_D2 * 1.002) * t) +
        0.30 * np.sin(2 * np.pi * (f_A2 * 0.998) * t) +
        0.20 * np.sin(2 * np.pi * (f_F3 * 1.003) * t)
    )
    
    # Tension addition between 9.5s and 19.5s
    tension_env = np.clip((t - 9.5) / 2.0, 0, 1) * np.clip((19.5 - t) / 1.0, 0, 1)
    pad_L += 0.30 * tension_env * np.sin(2 * np.pi * f_Bb2 * t)
    pad_R += 0.30 * tension_env * np.sin(2 * np.pi * (f_Bb2 * 1.005) * t)
    
    # Filter
    sos_pad = signal.butter(2, 450, 'low', fs=SR, output='sos')
    pad_L = signal.sosfilt(sos_pad, pad_L)
    pad_R = signal.sosfilt(sos_pad, pad_R)
    
    # Digital Silence Mute Gate between 19.5s and 20.0s (The Freeze)
    mute_gate = np.ones_like(t)
    mute_mask = (t >= 19.5) & (t < 20.0)
    fade_down = np.clip((19.6 - t) / 0.1, 0, 1)
    fade_up = np.clip((t - 19.9) / 0.1, 0, 1)
    mute_gate = np.where(t < 19.5, 1.0, np.where(t >= 20.0, 1.0, np.maximum(fade_down, fade_up)))
    
    left += pad_L * mute_gate * 0.35
    right += pad_R * mute_gate * 0.35
    
    # -------------------------------------------------------------
    # 2. 120 BPM Pulsing Sub-Bass
    # -------------------------------------------------------------
    beat_phase = (t % BEAT_DUR) / BEAT_DUR
    pump = 0.25 + 0.75 * (1.0 - np.exp(-beat_phase * 6.0))
    sub_raw = 0.65 * np.sin(2 * np.pi * f_D1 * t) + 0.35 * np.sin(2 * np.pi * f_D2 * t)
    
    sub_env = np.zeros_like(t)
    sub_env[(t >= 0.0) & (t < 19.5)] = 0.25 + 0.20 * (t[(t >= 0.0) & (t < 19.5)] / 19.0)
    sub_env[(t >= 23.4) & (t < 37.0)] = 0.55
    sub_env[(t >= 37.0) & (t < 44.0)] = 0.65
    sub_env[t >= 44.0] = 0.65 * np.clip((47.5 - t[t >= 44.0]) / 3.5, 0, 1)
    
    sub = sub_raw * pump * sub_env * mute_gate
    left += sub * 0.45
    right += sub * 0.45
    
    # -------------------------------------------------------------
    # 3. 120 BPM Industrial Sub-Kick
    # -------------------------------------------------------------
    kick_samples = int(0.20 * SR)
    kick_t = np.linspace(0, 0.20, kick_samples, endpoint=False)
    kick_f = 45.0 + (130.0 - 45.0) * np.exp(-kick_t / 0.030)
    kick_p = 2 * np.pi * np.cumsum(kick_f) / SR
    single_kick = np.tanh(1.8 * np.sin(kick_p) * np.exp(-kick_t / 0.055)) * 0.65
    
    total_beats = int(DUR / BEAT_DUR)
    for b in range(total_beats):
        bt = b * BEAT_DUR
        if (bt >= 19.5 and bt < 23.4) or bt > 46.5:
            continue
            
        k_vel = 0.0
        if bt < 9.5:
            if b % 4 == 0: k_vel = 0.35 # beat 1 only
        elif 9.5 <= bt < 19.5:
            if b % 2 == 0: k_vel = 0.45 # beats 1 & 3
        elif 23.4 <= bt < 37.0:
            k_vel = 0.65 # driving 4-on-the-floor
        elif 37.0 <= bt < 44.0:
            k_vel = 0.70 # peak energy
        elif 44.0 <= bt < 46.5:
            k_vel = 0.40 * (46.5 - bt) / 2.5
            
        if k_vel > 0:
            idx = int(bt * SR)
            end_idx = min(idx + kick_samples, TOTAL_SAMPLES)
            act_k = end_idx - idx
            left[idx:end_idx] += single_kick[:act_k] * k_vel
            right[idx:end_idx] += single_kick[:act_k] * k_vel
            
    # -------------------------------------------------------------
    # 4. Cyber Synth Arpeggio in Act 2 & 3 (23.4s to 44s)
    # -------------------------------------------------------------
    sixteenth_dur = BEAT_DUR / 4.0
    n_sixteenths = int(DUR / sixteenth_dur)
    arp_notes = [146.83, 174.61, 220.00, 293.66] # D3, F3, A3, D4
    
    for s_i in range(n_sixteenths):
        st = s_i * sixteenth_dur
        if 23.4 <= st < 44.0:
            note_freq = arp_notes[s_i % len(arp_notes)]
            arp_len = int(0.09 * SR)
            arp_t = np.linspace(0, 0.09, arp_len, endpoint=False)
            tone = signal.sawtooth(2 * np.pi * note_freq * arp_t) * np.exp(-arp_t / 0.035)
            sos_arp = signal.butter(2, 1400, 'low', fs=SR, output='sos')
            tone = signal.sosfilt(sos_arp, tone)
            
            idx = int(st * SR)
            end_idx = min(idx + arp_len, TOTAL_SAMPLES)
            act_l = end_idx - idx
            gain = 0.18 if st < 37.0 else 0.24
            pan = 0.25 * np.sin(s_i * 1.3)
            left[idx:end_idx] += tone[:act_l] * gain * (0.5 - pan)
            right[idx:end_idx] += tone[:act_l] * gain * (0.5 + pan)
            
    # Soft limiter & normalize score
    left = np.tanh(1.1 * left) * 0.707
    right = np.tanh(1.1 * right) * 0.707
    
    out_score = os.path.join(AUDIO_DIR, "score.wav")
    score_stereo = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    score_stereo[0::2] = np.int16(np.clip(left, -1.0, 1.0) * 32767.0)
    score_stereo[1::2] = np.int16(np.clip(right, -1.0, 1.0) * 32767.0)
    with wave.open(out_score, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(score_stereo.tobytes())
    print(f"Master score generated: {out_score}")
    return left, right

def build_sfx():
    print("Synthesizing procedural Foley SFX...")
    sfx_L = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    sfx_R = np.zeros(TOTAL_SAMPLES, dtype=np.float64)
    
    # SFX 1: 0.0s Nacelle Wind & Sub Braam
    t1 = np.linspace(0, 3.0, int(3.0 * SR), endpoint=False)
    braam = (signal.sawtooth(2 * np.pi * 40 * t1) + 1.2 * np.sin(2 * np.pi * 36.7 * t1)) * np.exp(-t1 / 1.2)
    sfx_L[:len(braam)] += braam * 0.6
    sfx_R[:len(braam)] += braam * 0.6
    
    # SFX 2: 10.0s Cloud 504 Timeout Error Glitch
    idx2 = int(10.0 * SR)
    t2 = np.linspace(0, 0.8, int(0.8 * SR), endpoint=False)
    glitch = np.sin(2 * np.pi * 1200 * t2 + 6.0 * np.sin(2 * np.pi * 80 * t2)) * np.exp(-t2 / 0.3)
    sfx_L[idx2:idx2+len(glitch)] += glitch * 0.5
    sfx_R[idx2:idx2+len(glitch)] += glitch * 0.5
    
    # SFX 3: 14.5s 55 Nm CAD Danger Warning Alert
    idx3 = int(14.5 * SR)
    t3 = np.linspace(0, 1.0, int(1.0 * SR), endpoint=False)
    beep = (np.sin(2 * np.pi * 880 * t3) + 0.5 * np.sin(2 * np.pi * 1320 * t3)) * np.exp(-t3 / 0.25)
    sfx_L[idx3:idx3+len(beep)] += beep * 0.5
    sfx_R[idx3:idx3+len(beep)] += beep * 0.5
    
    # SFX 4: 23.4s Cyan Energy Snap & Bass Drop (The Turn)
    idx4 = int(23.4 * SR)
    t4 = np.linspace(0, 2.5, int(2.5 * SR), endpoint=False)
    sub_drop = np.sin(2 * np.pi * (70 - 30 * np.clip(t4 / 0.5, 0, 1)) * t4) * np.exp(-t4 / 0.8) * 1.4
    sfx_L[idx4:idx4+len(sub_drop)] += sub_drop * 0.7
    sfx_R[idx4:idx4+len(sub_drop)] += sub_drop * 0.7
    
    # SFX 5: 24.5s Optical Camera Shutter Click (SNAP)
    idx5 = int(24.5 * SR)
    t5 = np.linspace(0, 0.15, int(0.15 * SR), endpoint=False)
    click = np.random.uniform(-1, 1, len(t5)) * np.exp(-t5 / 0.008)
    sos_c = signal.butter(2, [1800, 8000], 'bandpass', fs=SR, output='sos')
    shutter = signal.sosfilt(sos_c, click)
    sfx_L[idx5:idx5+len(shutter)] += shutter * 0.7
    sfx_R[idx5:idx5+len(shutter)] += shutter * 0.7
    
    # SFX 6: 28.0s OSHA Pneumatic Solenoid Gate Clamp (LOCK)
    idx6 = int(28.0 * SR)
    t6 = np.linspace(0, 0.6, int(0.6 * SR), endpoint=False)
    clamp = (np.sin(2 * np.pi * 85 * t6) + 0.6 * np.sin(2 * np.pi * 380 * t6)) * np.exp(-t6 / 0.08)
    sfx_L[idx6:idx6+len(clamp)] += clamp * 0.75
    sfx_R[idx6:idx6+len(clamp)] += clamp * 0.75
    
    # SFX 7: 32.5s Calibrated 35 Nm Torque Wrench Click & OEM Chime (FIX)
    idx7 = int(32.5 * SR)
    t7 = np.linspace(0, 1.2, int(1.2 * SR), endpoint=False)
    ratchet = (np.sin(2 * np.pi * 2400 * t7) + np.sin(2 * np.pi * 4800 * t7)) * np.exp(-t7 / 0.006)
    chime = (0.5 * np.sin(2 * np.pi * 587.33 * t7) + 0.5 * np.sin(2 * np.pi * 880.0 * t7)) * np.exp(-t7 / 0.35)
    sfx_L[idx7:idx7+len(t7)] += ratchet * 0.7 + chime * 0.4
    sfx_R[idx7:idx7+len(t7)] += ratchet * 0.7 + chime * 0.4
    
    # SFX 8: 37.4s Kinetic Metric Slam & Digital Ticker
    idx8 = int(37.4 * SR)
    t8 = np.linspace(0, 2.0, int(2.0 * SR), endpoint=False)
    slam = np.sin(2 * np.pi * 42 * t8) * np.exp(-t8 / 0.5) * 1.3
    sfx_L[idx8:idx8+len(slam)] += slam * 0.8
    sfx_R[idx8:idx8+len(slam)] += slam * 0.8
    
    # SFX 9: 42.5s Shield Mascot Lockup Impact & Shimmer
    idx9 = int(42.5 * SR)
    t9 = np.linspace(0, 4.5, int(4.5 * SR), endpoint=False)
    sub_hit = np.sin(2 * np.pi * 36.7 * t9) * np.exp(-t9 / 1.5)
    shimmer = (0.4 * np.sin(2 * np.pi * 587 * t9) + 0.4 * np.sin(2 * np.pi * 1174 * t9)) * np.exp(-t9 / 2.0)
    sfx_L[idx9:idx9+len(t9)] += sub_hit * 0.7 + shimmer * 0.4
    sfx_R[idx9:idx9+len(t9)] += sub_hit * 0.7 + shimmer * 0.4
    
    out_sfx = os.path.join(AUDIO_DIR, "sfx.wav")
    sfx_stereo = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    sfx_stereo[0::2] = np.int16(np.clip(sfx_L, -1.0, 1.0) * 32767.0)
    sfx_stereo[1::2] = np.int16(np.clip(sfx_R, -1.0, 1.0) * 32767.0)
    with wave.open(out_sfx, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(sfx_stereo.tobytes())
    print(f"Master SFX track generated: {out_sfx}")
    return sfx_L, sfx_R

def mix_master():
    voice_track = build_voice_track()
    score_L, score_R = build_score()
    sfx_L, sfx_R = build_sfx()
    
    print("\nMastering final broadcast mix with sidechain ducking (-14 LUFS)...")
    # Dynamic sidechain ducking: when voice energy > 0.05, score is ducked by -10 dB (x0.316)
    vox_env = np.maximum(np.abs(voice_track[:, 0]), np.abs(voice_track[:, 1]))
    sos_env = signal.butter(1, 10, 'low', fs=SR, output='sos')
    vox_smoothed = signal.sosfilt(sos_env, vox_env)
    
    duck_gain = 1.0 - 0.68 * np.clip(vox_smoothed / 0.15, 0.0, 1.0)
    
    mix_L = voice_track[:, 0] * 1.0 + score_L * duck_gain * 0.55 + sfx_L * 0.70
    mix_R = voice_track[:, 1] * 1.0 + score_R * duck_gain * 0.55 + sfx_R * 0.70
    
    # Normalize peak to -1.5 dBFS
    m_peak = max(np.max(np.abs(mix_L)), np.max(np.abs(mix_R)))
    if m_peak > 0:
        gain = 0.841 / m_peak
        mix_L *= gain
        mix_R *= gain
        
    out_mix = os.path.join(AUDIO_DIR, "mix.wav")
    mix_stereo = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    mix_stereo[0::2] = np.int16(np.clip(mix_L, -1.0, 1.0) * 32767.0)
    mix_stereo[1::2] = np.int16(np.clip(mix_R, -1.0, 1.0) * 32767.0)
    with wave.open(out_mix, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(mix_stereo.tobytes())
    print(f"Master broadcast mix exported: {out_mix} ({DUR}s)")

if __name__ == "__main__":
    mix_master()
