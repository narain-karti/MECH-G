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
TOTAL_DUR = 52.0
TOTAL_SAMPLES = int(SR * TOTAL_DUR)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(OUT_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "en-US-ChristopherNeural"

LINES = [
    {
        "id": "line_01",
        "text": "A hundred meters offshore, two hundred bar of oil is rupturing a turbine valve.",
        "start": 0.80
    },
    {
        "id": "line_02",
        "text": "Cloud AI gives a timeout. At two hundred bar, latency is fatal.",
        "start": 7.20
    },
    {
        "id": "line_03",
        "text": "MECH-G runs offline on Gemma 4, traversing the machine graph in five hundred milliseconds.",
        "start": 13.80
    },
    {
        "id": "line_04",
        "text": "Step one: SNAP defect. Step two: LOCK. The OSHA safety padlock clamps shut.",
        "start": 21.00
    },
    {
        "id": "line_05",
        "text": "Step three: FIX. Star torque pass: fifteen, twenty-five, thirty-five Newton-meters. Green LEDs verified.",
        "start": 30.20
    },
    {
        "id": "line_06",
        "text": "Eighty-four percent faster. Zero cloud risk. Zero casualties. MECH-G: Frontline intelligence for critical machines.",
        "start": 41.20
    }
]

async def synth_line(line):
    out_mp3 = os.path.join(AUDIO_DIR, f"{line['id']}.mp3")
    out_wav = os.path.join(AUDIO_DIR, f"{line['id']}.wav")
    
    communicate = edge_tts.Communicate(line["text"], VOICE, rate="+8%", pitch="+0Hz")
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
    print("[1/4] Synthesizing Crisp Voice Tracks via Edge-TTS...")
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
    
    print("[2/4] Synthesizing Sketchnote Foley...")
    foley_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    foley_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    # A. Continuous fineliner paper scratching (rhythmic bursts across active drawing)
    np.random.seed(42)
    pen_scratch = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    for t_sec in np.arange(0.1, TOTAL_DUR - 1.2, 0.38):
        burst_len = int(SR * np.random.uniform(0.14, 0.28))
        if int(t_sec * SR) + burst_len >= TOTAL_SAMPLES:
            break
        t_b = np.linspace(0, burst_len / SR, burst_len, endpoint=False)
        noise = np.random.randn(burst_len)
        sos = scipy.signal.butter(2, [2200, 6400], btype='bandpass', fs=SR, output='sos')
        filtered = scipy.signal.sosfilt(sos, noise) * np.sin(np.pi * t_b / (burst_len / SR))
        pen_scratch[int(t_sec * SR):int(t_sec * SR) + burst_len] += filtered * 0.14
    
    foley_left += pen_scratch * 0.45
    foley_right += pen_scratch * 0.45
    
    # B. Padlock Snap (at 29.5s)
    t_pad = np.linspace(0, 0.22, int(SR * 0.22), endpoint=False)
    thud = 0.5 * np.sin(2 * np.pi * 130 * t_pad) * np.exp(-t_pad * 40.0)
    click = 0.5 * np.random.randn(len(t_pad)) * np.exp(-t_pad * 80.0)
    sos_click = scipy.signal.butter(2, [1800, 4800], btype='bandpass', fs=SR, output='sos')
    padlock_snd = (thud + scipy.signal.sosfilt(sos_click, click)) * 0.70
    p_idx = int(29.5 * SR)
    foley_left[p_idx:p_idx + len(padlock_snd)] += padlock_snd * 0.85
    foley_right[p_idx:p_idx + len(padlock_snd)] += padlock_snd * 0.55
    
    # C. Ratchet clicks (at 37.0s, 38.2s, 39.4s)
    for r_t, freq in [(37.0, 1300), (38.2, 1500), (39.4, 1750)]:
        t_r = np.linspace(0, 0.10, int(SR * 0.10), endpoint=False)
        r_snd = 0.6 * np.sin(2 * np.pi * freq * t_r) * np.exp(-t_r * 75.0)
        idx_r = int(r_t * SR)
        foley_left[idx_r:idx_r + len(r_snd)] += r_snd * 0.65
        foley_right[idx_r:idx_r + len(r_snd)] += r_snd * 0.65
        
    # D. Verification Chime (at 40.2s)
    t_c = np.linspace(0, 1.6, int(SR * 1.6), endpoint=False)
    chime = (0.2 * np.sin(2 * np.pi * 587.33 * t_c) + 
             0.2 * np.sin(2 * np.pi * 880.00 * t_c) + 
             0.3 * np.sin(2 * np.pi * 1174.66 * t_c)) * np.exp(-t_c * 2.5)
    c_idx = int(40.2 * SR)
    foley_left[c_idx:c_idx + len(chime)] += chime * 0.55
    foley_right[c_idx:c_idx + len(chime)] += chime * 0.55

    print("[3/4] Synthesizing Sketchnote Acoustic Score...")
    # 120.0 BPM = 0.5s per beat, 2.0s per 4-beat bar (26 bars = 52.0s)
    score_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    score_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    chords = [
        [146.83, 220.00, 293.66, 349.23], # Dm
        [116.54, 233.08, 293.66, 349.23], # Bb
        [174.61, 220.00, 261.63, 349.23], # F
        [130.81, 196.00, 261.63, 329.63]  # C
    ]
    
    note_dur = int(SR * 0.25)
    t_n = np.linspace(0, 0.25, note_dur, endpoint=False)
    
    bar_idx = 0
    for bar_start in np.arange(0.0, TOTAL_DUR - 1.0, 2.0):
        chord = chords[bar_idx % len(chords)]
        for eighth in range(8):
            f0 = chord[eighth % len(chord)] * (2.0 if eighth >= 4 else 1.0)
            strike = (np.sin(2 * np.pi * f0 * t_n) * 0.7 + 
                      np.sin(2 * np.pi * f0 * 2.76 * t_n) * 0.25 +
                      np.sin(2 * np.pi * f0 * 5.4 * t_n) * 0.1) * np.exp(-t_n * 22.0)
            
            n_idx = int((bar_start + eighth * 0.25) * SR)
            if n_idx + note_dur < TOTAL_SAMPLES:
                pan_val = 0.4 + 0.2 * (eighth % 2)
                score_left[n_idx:n_idx + note_dur] += strike * pan_val * 0.35
                score_right[n_idx:n_idx + note_dur] += strike * (1.0 - pan_val) * 0.35
        bar_idx += 1
        
    # Ducking during voice
    duck_kernel = np.ones(int(SR * 0.25), dtype=np.float32) / (SR * 0.25)
    smooth_mask = scipy.signal.fftconvolve(voice_mask, duck_kernel, mode='same')
    duck_gain = 1.0 - 0.62 * np.clip(smooth_mask * 1.5, 0.0, 1.0)
    
    score_left *= duck_gain
    score_right *= duck_gain

    print("[4/4] Summing, Normalizing & Mastering...")
    mix_left = voice_track * 1.0 + foley_left * 0.85 + score_left * 0.75
    mix_right = voice_track * 1.0 + foley_right * 0.85 + score_right * 0.75
    
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
