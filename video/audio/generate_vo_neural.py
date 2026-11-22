#!/usr/bin/env python3
"""
generate_vo_neural.py - Studio Neural AI Voiceover Generator for MECH-G Pitch Video
Uses Microsoft Edge TTS with en-US-ChristopherNeural at a natural, unhurried speaking rate (+3%).
Generates 9 scene voiceover WAV tracks formatted to 44.1 kHz, 16-bit PCM stereo.
"""

import asyncio
import os
import subprocess
import edge_tts

AUDIO_DIR = os.path.dirname(os.path.abspath(__file__))

SCENES = [
    ("vo_01", "Hundred meters high, a hydraulic valve blows. No signal, four thousand manual pages, and thirty thousand dollars an hour downtime."),
    ("vo_02", "Cloud AI is dead out here. And generic vector RAG is a dangerous gamble."),
    ("vo_03", "It drops safety interlocks and hallucinates torque specs—guessing fifty-five Newton meters instead of thirty-five."),
    ("vo_04", "Under two hundred bars of hydraulic pressure, that mistake causes catastrophic blowout."),
    ("vo_05", "Meet MECH-G. Step one: SNAP. Gemma vision identifies the leaking valve and part number offline."),
    ("vo_06", "Step two: LOCK. The OSHA safety gate hard-blocks wrenching until zero energy is verified."),
    ("vo_07", "Step three: FIX AND VERIFY. Follow the thirty-five Newton-meter checklist, backed by exact OEM citations."),
    ("vo_08", "Eighty-four percent faster repair. Sub-five-hundred millisecond local graph latency. Zero cloud dependencies."),
    ("vo_09", "MECH-G: Mission-critical edge intelligence for frontline engineering.")
]

async def generate_all():
    print("=" * 60)
    print("Generating 9 Studio Neural AI Voiceover WAVs (en-US-ChristopherNeural)")
    print("=" * 60)
    for vid, text in SCENES:
        mp3_tmp = os.path.join(AUDIO_DIR, f"{vid}_temp.mp3")
        wav_out = os.path.join(AUDIO_DIR, f"{vid}.wav")
        
        # 1. Edge-TTS neural speech synthesis
        comm = edge_tts.Communicate(text, "en-US-ChristopherNeural", rate="+3%", pitch="+0Hz")
        await comm.save(mp3_tmp)
        
        # 2. Transcode to broadcast 44.1 kHz, 16-bit stereo PCM WAV
        cmd = ["ffmpeg", "-y", "-i", mp3_tmp, "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", wav_out]
        subprocess.run(cmd, check=True, capture_output=True)
        if os.path.exists(mp3_tmp):
            os.remove(mp3_tmp)
        print(f"[OK] Generated {vid}.wav")

if __name__ == "__main__":
    asyncio.run(generate_all())
