# Credits & Production Notes

**Project**: The Turbine & The Mascot (A Sketchnote Adventure)  
**Style**: Sketchnote (`sketchnote`) — Lemo-Opuscar Library  
**Target Duration**: 48.000s @ 24 fps CFR (1,152 frames)  
**Resolution**: 1920×1080 Full HD  

### Cast & Voice Synthesis
- **Alex (Field Engineer)**: ElevenLabs Neural TTS (Laura `FGY2WhTYpPnrIDTdsKH5`)
- **MECH-G (The Helpful Mascot)**: ElevenLabs Neural TTS (Brian `nPczCjzI2devNBz1zQrb`)

### Production Engine
- **Visuals**: HTML5 Canvas 2D with dynamic stroke-by-stroke fineliner jitter, multi-layer marker multiply blending, dot-grid rendering, and smooth camera interpolation.
- **Audio & SFX**: Procedural pen scratches, marker sweeps, mechanical ratchets, spring boings, and acoustic marimba score synthesized via Python (`numpy`, `scipy`).
- **Rendering**: Playwright headless browser rendering via `lemo-opuscar` core tools.
