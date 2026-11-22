import os
import sys
import json
import math
import asyncio
import numpy as np
import scipy.signal
import soundfile as sf
import edge_tts

SR = 48000
TOTAL_DUR = 55.0
TOTAL_SAMPLES = int(SR * TOTAL_DUR)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(OUT_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "en-US-ChristopherNeural"

LINES = [
    {
        "id": "line_01",
        "text": "Meet Alex. A hundred meters up a wind turbine, a two-hundred-bar valve blows a seal.",
        "start": 0.80
    },
    {
        "id": "line_02",
        "text": "Cloud AI gives a timeout. No reception, and paper manuals take hours.",
        "start": 7.80
    },
    {
        "id": "line_03",
        "text": "Alex deploys MECH-G: fully offline intelligence powered by Google Gemma 4.",
        "start": 14.30
    },
    {
        "id": "line_04",
        "text": "Step one: SNAP. Computer vision locks onto valve PRV-992-B in four hundred milliseconds.",
        "start": 20.20
    },
    {
        "id": "line_05",
        "text": "Step two: LOCK. The OSHA safety padlock clamps shut. Pressure drops to zero.",
        "start": 28.90
    },
    {
        "id": "line_06",
        "text": "Step three: FIX. Star torque pass: fifteen, twenty-five, thirty-five Newton-meters. Verified.",
        "start": 36.70
    },
    {
        "id": "line_07",
        "text": "Eighty-four percent faster. Zero cloud risk. Zero casualties. MECH-G.",
        "start": 46.00
    }
]

async def synth_line(line):
    out_mp3 = os.path.join(AUDIO_DIR, f"{line['id']}.mp3")
    out_wav = os.path.join(AUDIO_DIR, f"{line['id']}.wav")
    
    # Natural proper pitch, crisp professional delivery
    communicate = edge_tts.Communicate(line["text"], VOICE, rate="+10%", pitch="+0Hz")
    await communicate.save(out_mp3)
    
    cmd = f'ffmpeg -v error -y -i "{out_mp3}" -ar 48000 -ac 1 "{out_wav}"'
    ret = os.system(cmd)
    if ret != 0:
        raise RuntimeError(f"FFmpeg conversion failed for {out_mp3}")
    
    data, sr = sf.read(out_wav)
    return data

def build_srt(line_timings):
    def fmt(t):
        hrs = int(t // 3600)
        mins = int((t % 3600) // 60)
        secs = int(t % 60)
        msec = int(round((t - int(t)) * 1000))
        return f"{hrs:02d}:{mins:02d}:{secs:02d},{msec:03d}"
    
    srt_lines = []
    for idx, item in enumerate(line_timings, 1):
        st = item["start"]
        en = min(TOTAL_DUR - 0.2, item["start"] + item["dur"] + 0.3)
        srt_lines.append(f"{idx}\n{fmt(st)} --> {fmt(en)}\n{item['text']}\n")
    
    srt_path = os.path.join(OUT_DIR, "subtitles_en.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    print(f"[SRT] Written to {srt_path}")

async def main():
    print("[1/4] Synthesizing Clean Pitch Voiceover via Edge-TTS...")
    voice_track = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    voice_mask = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    line_timings = []
    
    for item in LINES:
        data = await synth_line(item)
        dur = len(data) / SR
        st_idx = int(item["start"] * SR)
        en_idx = min(TOTAL_SAMPLES, st_idx + len(data))
        seg_len = en_idx - st_idx
        
        voice_track[st_idx:en_idx] += data[:seg_len] * 0.95
        voice_mask[st_idx:en_idx] = 1.0
        line_timings.append({
            "id": item["id"],
            "text": item["text"],
            "start": item["start"],
            "dur": dur
        })
        print(f"  - {item['id']}: [{item['start']:.2f}s -> {item['start']+dur:.2f}s] ({dur:.2f}s) '{item['text'][:35]}...'")
    
    build_srt(line_timings)
    
    print("[2/4] Synthesizing Foley & Sound Effects (ZERO SCRATCHING NOISE)...")
    foley_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    foley_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    # 1. Hydraulic Steam / Oil Spray Hiss (Scene 1: 0.8s - 4.5s)
    hiss_dur = 3.2
    t_hiss = np.linspace(0, hiss_dur, int(SR * hiss_dur), endpoint=False)
    noise_hiss = np.random.randn(len(t_hiss))
    sos_hiss = scipy.signal.butter(2, [1800, 5200], btype='bandpass', fs=SR, output='sos')
    hiss = scipy.signal.sosfilt(sos_hiss, noise_hiss) * (0.15 + 0.05 * np.sin(2 * np.pi * 3.0 * t_hiss))
    h_idx = int(1.0 * SR)
    foley_left[h_idx:h_idx + len(hiss)] += hiss * 0.4
    foley_right[h_idx:h_idx + len(hiss)] += hiss * 0.25
    
    # 2. Cartoon Disconnect Error Buzz (Scene 2: 8.2s)
    t_buzz = np.linspace(0, 0.45, int(SR * 0.45), endpoint=False)
    buzz = (0.3 * np.sin(2 * np.pi * 150 * t_buzz) + 0.3 * np.sin(2 * np.pi * 225 * t_buzz)) * np.exp(-t_buzz * 8.0)
    b_idx = int(8.2 * SR)
    foley_left[b_idx:b_idx + len(buzz)] += buzz * 0.5
    foley_right[b_idx:b_idx + len(buzz)] += buzz * 0.5
    
    # 3. Clean Tech Tablet Boot Chime (Scene 3: 14.5s)
    t_boot = np.linspace(0, 1.2, int(SR * 1.2), endpoint=False)
    boot_chord = (0.2 * np.sin(2 * np.pi * 523.25 * t_boot) + 
                  0.2 * np.sin(2 * np.pi * 659.25 * t_boot) + 
                  0.25 * np.sin(2 * np.pi * 783.99 * t_boot) + 
                  0.3 * np.sin(2 * np.pi * 1046.50 * t_boot)) * np.exp(-t_boot * 3.5)
    bt_idx = int(14.5 * SR)
    foley_left[bt_idx:bt_idx + len(boot_chord)] += boot_chord * 0.6
    foley_right[bt_idx:bt_idx + len(boot_chord)] += boot_chord * 0.6
    
    # 4. Camera Shutter Click (Scene 4: 20.8s)
    t_sh = np.linspace(0, 0.12, int(SR * 0.12), endpoint=False)
    shutter = 0.5 * np.random.randn(len(t_sh)) * np.exp(-t_sh * 70.0)
    sos_sh = scipy.signal.butter(2, [2500, 6000], btype='bandpass', fs=SR, output='sos')
    sh_snd = scipy.signal.sosfilt(sos_sh, shutter) * 0.8
    sh_idx = int(20.8 * SR)
    foley_left[sh_idx:sh_idx + len(sh_snd)] += sh_snd * 0.7
    foley_right[sh_idx:sh_idx + len(sh_snd)] += sh_snd * 0.7
    
    # 5. Heavy Padlock Snap "CLACK" (Scene 5: 29.5s)
    t_pad = np.linspace(0, 0.22, int(SR * 0.22), endpoint=False)
    thud = 0.6 * np.sin(2 * np.pi * 120 * t_pad) * np.exp(-t_pad * 35.0)
    click = 0.6 * np.random.randn(len(t_pad)) * np.exp(-t_pad * 85.0)
    sos_click = scipy.signal.butter(2, [1600, 4500], btype='bandpass', fs=SR, output='sos')
    padlock_snd = (thud + scipy.signal.sosfilt(sos_click, click)) * 0.85
    p_idx = int(29.5 * SR)
    foley_left[p_idx:p_idx + len(padlock_snd)] += padlock_snd * 0.9
    foley_right[p_idx:p_idx + len(padlock_snd)] += padlock_snd * 0.6
    
    # 6. Ratchet Clicks (Scene 6: 38.0s, 39.8s, 41.5s)
    for r_t, freq in [(38.0, 1300), (39.8, 1500), (41.5, 1750)]:
        t_r = np.linspace(0, 0.10, int(SR * 0.10), endpoint=False)
        r_snd = 0.6 * np.sin(2 * np.pi * freq * t_r) * np.exp(-t_r * 75.0)
        idx_r = int(r_t * SR)
        foley_left[idx_r:idx_r + len(r_snd)] += r_snd * 0.75
        foley_right[idx_r:idx_r + len(r_snd)] += r_snd * 0.75
        
    # 7. Verification Chime (42.5s)
    t_c = np.linspace(0, 1.8, int(SR * 1.8), endpoint=False)
    chime = (0.2 * np.sin(2 * np.pi * 587.33 * t_c) + 
             0.2 * np.sin(2 * np.pi * 880.00 * t_c) + 
             0.35 * np.sin(2 * np.pi * 1174.66 * t_c)) * np.exp(-t_c * 2.2)
    c_idx = int(42.5 * SR)
    foley_left[c_idx:c_idx + len(chime)] += chime * 0.65
    foley_right[c_idx:c_idx + len(chime)] += chime * 0.65

    print("[3/4] Synthesizing Clean Pitch Soundtrack (Marimba, Rhodes, Electric Bass)...")
    # 120.0 BPM = 0.5s per beat, 2.0s per 4-beat bar (26 bars = 52.0s)
    score_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    score_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    # Modern uplifting tech pitch progression: C - Am - F - G
    chords = [
        [261.63, 329.63, 392.00, 523.25], # C major
        [220.00, 261.63, 329.63, 440.00], # A minor
        [174.61, 220.00, 261.63, 349.23], # F major
        [196.00, 246.94, 293.66, 392.00]  # G major
    ]
    
    note_dur = int(SR * 0.25)
    t_n = np.linspace(0, 0.25, note_dur, endpoint=False)
    
    bar_idx = 0
    for bar_start in np.arange(0.0, TOTAL_DUR - 1.0, 2.0):
        chord = chords[bar_idx % len(chords)]
        for eighth in range(8):
            f0 = chord[eighth % len(chord)] * (1.5 if eighth >= 4 else 1.0)
            # Crisp marimba/wood mallet sound
            strike = (np.sin(2 * np.pi * f0 * t_n) * 0.75 + 
                      np.sin(2 * np.pi * f0 * 2.76 * t_n) * 0.20 + 
                      np.sin(2 * np.pi * f0 * 5.4 * t_n) * 0.08) * np.exp(-t_n * 20.0)
            
            # Subtle electric bass on beats 1 and 3
            if eighth in [0, 4]:
                bass_f = chord[0] * 0.5
                strike += 0.4 * np.sin(2 * np.pi * bass_f * t_n) * np.exp(-t_n * 8.0)
                
            n_idx = int((bar_start + eighth * 0.25) * SR)
            if n_idx + note_dur < TOTAL_SAMPLES:
                pan_val = 0.45 + 0.1 * (eighth % 2)
                score_left[n_idx:n_idx + note_dur] += strike * pan_val * 0.38
                score_right[n_idx:n_idx + note_dur] += strike * (1.0 - pan_val) * 0.38
        bar_idx += 1
        
    # Smooth ducking during voice (-8 dB)
    duck_kernel = np.ones(int(SR * 0.25), dtype=np.float32) / (SR * 0.25)
    smooth_mask = scipy.signal.fftconvolve(voice_mask, duck_kernel, mode='same')
    duck_gain = 1.0 - 0.65 * np.clip(smooth_mask * 1.5, 0.0, 1.0)
    
    score_left *= duck_gain
    score_right *= duck_gain

    print("[4/4] Summing, Normalizing & Mastering...")
    mix_left = voice_track * 1.0 + foley_left * 0.85 + score_left * 0.70
    mix_right = voice_track * 1.0 + foley_right * 0.85 + score_right * 0.70
    
    fade_start = int((TOTAL_DUR - 1.0) * SR)
    fade_len = TOTAL_SAMPLES - fade_start
    fade_curve = np.linspace(1.0, 0.0, fade_len)
    mix_left[fade_start:] *= fade_curve
    mix_right[fade_start:] *= fade_curve
    
    master_mix = np.stack([mix_left, mix_right], axis=1)
    
    peak = np.max(np.abs(master_mix))
    if peak > 0:
        target_peak = 0.84
        master_mix = (master_mix / peak) * target_peak
        
    out_wav = os.path.join(AUDIO_DIR, "mix.wav")
    sf.write(out_wav, master_mix, SR)
    print(f"[SUCCESS] Master mix saved to {out_wav}")
    print(f"  Duration: {len(master_mix)/SR:.3f}s | Channels: 2 | Peak: {20*np.log10(np.max(np.abs(master_mix))):.2f} dBFS")

if __name__ == "__main__":
    asyncio.run(main())
