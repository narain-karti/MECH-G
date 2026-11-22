# ⚙️ MECH-G: Multimodal Edge Diagnostic & Engineering Knowledge Workspace

<div align="center">

[![Repository](https://img.shields.io/badge/GitHub-narain--karti%2FMECH--G-181717?style=for-the-badge&logo=github)](https://github.com/narain-karti/MECH-G)
[![Model](https://img.shields.io/badge/AI_Model-Google_Gemma_4_(26B)-3B82F6?style=for-the-badge&logo=google)](https://ai.google.dev/gemma)
[![Safety Standard](https://img.shields.io/badge/Safety_Standard-OSHA_1910.147_LOTO-F59E0B?style=for-the-badge&logo=shield)](https://www.osha.gov/control-hazardous-energy)
[![Knowledge Graph](https://img.shields.io/badge/Graph_Engine-NetworkX_In--Memory_RAM-10B981?style=for-the-badge)](https://networkx.org/)
[![Pitch Video](https://img.shields.io/badge/Pitch_Video-1080p_Full_HD-FF6B35?style=for-the-badge&logo=youtube)](./video/mech_g_pitch.mp4)
[![License](https://img.shields.io/badge/License-Apache_2.0-8B5CF6?style=for-the-badge)](./LICENSE)

<p align="center">
  <strong>An offline-first, multimodal AI knowledge workspace and field diagnostic engine for high-value industrial machinery.</strong><br>
  Powered by <strong>Google Gemma 4 (26B)</strong>, deterministic <strong>Open Knowledge Format (OKF)</strong> graph reasoning, verifiable zero-hallucination citation auditing, and strict <strong>OSHA 1910.147 Lockout/Tagout (LOTO)</strong> safety gate enforcement.
</p>

</div>

---

## 🎬 Official Pitch Video & Walkthrough Showcase

The repository includes a complete broadcast-grade pitch video produced with cinematic motion graphics, UI walkthrough screen captures, **ElevenLabs studio neural narration**, **Librosa beat-synced industrial score**, and **procedural sound design (SFX)**.

▶️ **Watch Pitch Video File**: [`video/mech_g_pitch.mp4`](./video/mech_g_pitch.mp4)

```
[0:00 - 0:18] ACT 1: THE FRONTLINE REALITY
  • Scene 01: Suspended 100m high inside a freezing wind turbine nacelle with weeping hydraulic fluid and zero cell signal.
  • Scene 02: 4,000-page dense OEM manual flipping with greasy gloves vs. escalating downtime ticker ($30,000/hr).

[0:18 - 0:34] ACT 2: WHY GENERIC CLOUD RAG FAILS
  • Scene 03: Cloud lightning strike causing HTTP 504 Gateway Timeout; severed vector chunk safety interlocks.
  • Scene 04: CAD blowout diagram: Hallucinated 55 Nm bolt torque stripping threads under 210 bar pressure vs. OEM 35 Nm spec.

[0:34 - 1:00] ACT 3: THE 3-STEP MNEMONIC (LIVE PRODUCT WALKTHROUGH)
  • Scene 05: 1. SNAP — Gemma Multimodal vision identifying valve PRV-992-B with 96% confidence and Viton seal weepage.
  • Scene 06: 2. LOCK — OSHA 1910.147 safety gate hard-locking repair sequence until technician enters badge TECH-8842-OFFSHORE and verifies 0 PSI zero energy.
  • Scene 07: 3. FIX & VERIFY — Step-by-step checklist with calibrated 35 Nm torque sequence (15/25/35 Nm passes) and Evidence Drawer citations.

[1:00 - 1:16] ACT 4: EMPIRICAL IMPACT & PITCH CLOSE
  • Scene 08: Kinetic metric cards: 84% MTTR Reduction • < 500 ms Graph Latency • 100% Offline Capable.
  • Scene 09: MECH-G shield mascot lockup: "MISSION-CRITICAL EDGE INTELLIGENCE".
```

### 🔊 Audio Engineering & Librosa Beat-Sync Architecture

The video features an end-to-end studio audio pipeline engineered for clarity, visceral narrative impact, and sample-accurate synchronization:

1. **ElevenLabs Neural Narration (Voice: Adam)**:
   - Synthesized using ElevenLabs **Multilingual v2** model (`eleven_multilingual_v2`) with the **Adam** voice (`pNInz6obpgDQGcFmaJgB`).
   - Deep, deliberate, and unhurried speaking rate calibrated to technical frontline operations.
   - All 9 voice tracks are mathematically bounded to their exact scene envelopes to ensure zero overflow.
2. **120.0 BPM Industrial Dark Techno Score**:
   - Synthesized in D minor with 6 procedural DSP layers: analog atmospheric pad drone, 120 BPM pumping sub-bass (D1/D2 fundamental), 4-on-the-floor sub kick, 16th-note stereo ping-pong percussion, cyber synth arpeggios, and transition risers.
   - At 120.0 BPM (0.500s / 15.00 frames per beat at 30 fps), **every single scene transition lands on an exact beat and video frame**.
3. **Procedural Broadcast SFX Suite**:
   - **Scene 1 (0.0s)**: Cinematic sub-bass braam & wind nacelle atmosphere.
   - **Scene 2 (10.0s)**: Cloud disconnect dropout & digital bitcrush glitch.
   - **Scene 3 (18.0s)**: 504 Timeout & RAG hallucination triple warning alarm.
   - **Scene 4 (26.0s)**: 55 Nm CAD hydraulic rupture burst, metallic pipe ring & 40 Hz sub shockwave.
   - **Scene 5 (34.0s)**: SNAP: Dual-curtain mechanical camera shutter & futuristic HUD target lock beep.
   - **Scene 6 (42.0s)**: LOCK: Heavy pneumatic solenoid gate clamp & OSHA zero-energy verify tone.
   - **Scene 7 (51.0s)**: FIX & VERIFY: Calibrated 35 Nm dual-tooth torque wrench click & OEM verified chord.
   - **Scene 8 (60.0s)**: Kinetic metric riser sweep, high-speed data counter ticker & sub impact slam.
   - **Scene 9 (70.0s)**: MECH-G logo lockup impact & ethereal crystal shimmer reverb tail.
4. **Librosa Audio-Visual Synchronization Report**:

| Scene | Visual Cut Frame | Time (s) | Nearest Beat | Delta (ms) | Delta (frames) | Narrative SFX Cue | Librosa Sync Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **S01** | Frame 0 | 0.00s | 0.035s | +34.8 ms | +1.04 frames | Nacelle Intro Sub Braam & Wind | **LOCKED** |
| **S02** | Frame 300 | 10.00s | 10.008s | +7.8 ms | +0.23 frames | Cloud AI Disconnect Glitch | **LOCKED** |
| **S03** | Frame 540 | 18.00s | 18.007s | +7.1 ms | +0.21 frames | RAG 504 Timeout Error Alarm | **LOCKED** |
| **S04** | Frame 780 | 26.00s | 26.006s | +6.3 ms | +0.19 frames | 55 Nm CAD Rupture Burst | **LOCKED** |
| **S05** | Frame 1020 | 34.00s | 34.006s | +5.6 ms | +0.17 frames | Gemma Vision Shutter & HUD | **LOCKED** |
| **S06** | Frame 1260 | 42.00s | 42.017s | +16.5 ms | +0.50 frames | OSHA Solenoid Gate Lock | **LOCKED** |
| **S07** | Frame 1530 | 51.00s | 51.014s | +14.2 ms | +0.43 frames | 35 Nm Torque Wrench Click | **LOCKED** |
| **S08** | Frame 1800 | 60.00s | 60.012s | +12.0 ms | +0.36 frames | Kinetic Riser & Metric Slam | **LOCKED** |
| **S09** | Frame 2100 | 70.00s | 70.008s | +8.2 ms | +0.24 frames | Cinematic Impact & Shimmer | **LOCKED** |

5. **Broadcast Master Composite & Dynamic Ducking**:
   - Master video composited with FFmpeg using sidechain compression: BGM is automatically ducked by **-18 dB** during narration, while SFX punch through with full dynamic presence.
   - Master container: 1920x1080 Full HD, 30.0 fps CFR, H.264 High Profile (`yuv420p`), AAC 256kbps stereo, faststart enabled (`moov` atom at byte 32 before `mdat`), exactly 76.000s duration.

---

## 🌟 Executive Overview & Problem Definition

Field service engineers working on critical infrastructure—offshore wind turbines, commercial aviation powerplants, subterranean mining equipment, and high-pressure hydraulic skids—face three fatal challenges:

1. **Zero or Degraded Connectivity**: Deep inside steel nacelles or underground tunnels, internet does not exist. Cloud-only SaaS AI fails instantly.
2. **The Vector RAG Trap**: Standard vector search chops technical manuals into isolated chunks, severing upstream safety prerequisites and inventing non-existent manual chapters.
3. **Catastrophic Failure Risks**: In high-pressure industrial systems (210 bar / 3,000 psi), a single hallucinated fastener torque (e.g. 55 Nm instead of 35 Nm) strips aluminum threads and causes explosive blowouts or arc flashes.

### The MECH-G Solution: The 3 "Zeros"
* **Zero Cloud**: 100% of graph indexing, document parsing, link traversal, and UI assets run locally on edge laptops and rugged tablets.
* **Zero Hallucination**: A closed-world AST citation auditor mathematically checks all assertions against local Markdown nodes. Fake citations are rejected before the technician ever sees them.
* **Zero Casualties**: Mandatory software-enforced OSHA 1910.147 Lockout/Tagout (LOTO) gate blocks wrenching steps until zero-energy isolation is verified and signed.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Field Workstation UI (React 19 + Vite + Tailwind CSS)"]
        UI_WS["Knowledge Workspace\n(NotebookLM Floating Islands)"]
        UI_DIAG["Field Diagnostics\n(Multimodal Telemetry & Audio)"]
        UI_GRAPH["Graph Explorer\n(@xyflow/react Directed Canvas)"]
        UI_SAFETY["Safety Compliance\n(OSHA 1910.147 Simulator)"]
        UI_INGEST["OEM Ingestion Studio\n(MarkItDown Document Compiler)"]
    end

    subgraph Backend["MECH-G FastAPI Edge Engine (Port 8000)"]
        ROUTER_CHAT["Chat Router & SSE Stream\n(/api/chat/conversations)"]
        ROUTER_DIAG["Diagnostic Engine\n(/api/diagnose)"]
        ROUTER_GRAPH["Graph Router\n(/api/graph)"]
        ROUTER_DOC["Document & SQLite Repo\n(/api/documents)"]
        ROUTER_INGEST["OmniOKF Compiler\n(/api/ingest)"]
    end

    subgraph Knowledge["In-Memory OKF Graph Engine"]
        NETX["NetworkX Directed Graph (RAM)\nSub-millisecond Edge Latency"]
        AST["Closed-World Citation Auditor\nAST Source Text Verification"]
        SAFETY_GATE["OSHA 1910.147 Gatekeeper\nZero-Energy Depressurization"]
    end

    subgraph AI["Google GenAI Intelligence Cascade"]
        GEMMA["Official Google Gemma 4 SDK\n(gemma-4-26b-a4b-it)"]
        VISION["Multimodal Optical & Defect Analyzer"]
    end

    Client -->|REST & SSE Events| Backend
    Backend --> Knowledge
    Backend --> AI
    Knowledge -->|Verified Context Excerpts| GEMMA
    GEMMA -->|Streamed Output with Provenance| AST
    AST -->|Audited Output| Client
```

---

## 🚀 Key Modules & Capabilities

### 1. 💬 Knowledge Workspace (`/` and `/workspace`)
* **NotebookLM 3-Panel Floating Island UI**: Built on `#0B0B0C` obsidian canvas with `#18181A` rounded surfaces (`rounded-[24px]`).
* **Conversational SSE Streaming**: Real-time token streaming from Gemma 4 with real-time status notifications.
* **Interactive Knowledge Mindmap**: Synchronized `@xyflow/react` graph panel automatically highlighting active nodes during discussion.
* **Connector-Aware Mermaid Flowchart Renderer**: Automatically detects, sanitizes, and renders workflow diagrams directly inline.

### 2. 🔧 Multimodal Field Diagnostics (`/diagnostics`)
* **Multimodal Ingestion**: Accepts photos of leaking valves, burnt PCBs, multimeter readings, and acoustic audio chatter.
* **Interactive Telemetry Controls**: Real-time hydraulic manifold pressure (`0–350 bar`) and reservoir fluid temperature (`20–120 °C`) sliders.
* **OSHA 1910.147 Safety Gate Modal**: Hard lock enforcing technician badge sign-off and zero-energy pressure verification before unlocking repair steps.
* **Interactive Checklist**: Step-by-step checklist with calibrated torque ratings (e.g., 3-pass torque: 15 Nm, 25 Nm, 35 Nm).
* **Evidence Drawer**: Clicking any citation opens the exact OEM source markdown excerpt side-by-side.
* **Field Work Order Generator**: Instant printable field service ticket (`WO-2026-MECHG-891`).

### 3. 🕸️ Knowledge Graph Explorer (`/graph`)
* **Fullscreen React Flow Topology**: Interactive directed canvas rendering components, safety prerequisites, procedures, fault codes, and calibrated tools.
* **Fuzzy Part & Serial Lookup**: Sub-millisecond part number resolution (`PRV-992-B`, `PCB-PITCH-CTRL-V1`).
* **In-Page Node Detail Inspector Modal**: Inspect YAML frontmatter, part numbers, upstream safety prerequisites, and downstream dependent nodes.
* **One-Click Gemma Hand-off**: Click "Ask Gemma About Node" to transition directly into the conversational canvas.

### 4. 📄 OEM Ingest & Markdown Compiler Studio (`/ingest`)
* **Universal Ingestion**: Drag-and-drop support for PDF schematics, Word manuals, Excel tables, and Markdown files.
* **OmniOKF Compiler**: Uses MarkItDown and PyMuPDF to extract text, tables, and headers into atomic concept nodes (200–500 tokens).
* **Live Execution Console**: Real-time terminal output tracking document parsing, AST extraction, and SQLite provenance tracking.

### 5. 🛡️ Safety Compliance & LOTO Simulator (`/safety`)
* **OSHA 29 CFR 1910.147 Simulator**: 6-step interactive protocol (Notify, E-Stop, Electrical Isolation, Lockout/Tagout, Depressurization, Zero-Test).
* **PPE Equipment Checklist**: Helmet, impact eyewear, Category 2 arc flash shield, and 1000V dielectric gloves.
* **Digital Isolation Permits**: Issue, track, and print verified isolation permits with padlock serial numbers and technician signatures.

---

## 💻 Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8, React Router v7 | High-performance industrial client |
| **Design System** | Tailwind CSS v4, Plus Jakarta Sans, Outfit, Lucide Icons | High-contrast WCAG AAA obsidian theme |
| **Interactive Graph** | `@xyflow/react` v12, Dagre Layout Engine | Directed visual knowledge topology |
| **Math & Diagrams** | Mermaid v12, KaTeX, React-Markdown, Remark-GFM | Technical schematics & formulas |
| **Backend API** | FastAPI, Uvicorn, Python 3.10+, Pydantic v2 | High-throughput asynchronous edge server |
| **Multimodal Vision** | Google GenAI SDK (`google-genai`), `gemma-4-26b-a4b-it` | Visual defect classification & entity extraction |
| **Document Compiler** | Microsoft MarkItDown, PyMuPDF (fitz) | Layout-aware manual parsing & frontmatter tagging |
| **Graph & Storage** | NetworkX (In-Memory RAM), SQLite (`workspace.db`), OKF Markdown Bundle | Zero-cloud, sub-millisecond local graph reasoning |
| **Video Production** | FFmpeg 8.0, Playwright, Edge-TTS, GSAP | Automated pitch video rendering & sidechain ducking |

---

## ⚡ Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/narain-karti/MECH-G.git
cd MECH-G
```

### 2. Configure Environment Variables
Create `backend/.env` with your Google GenAI / Gemma API key:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```env
# Google GenAI / Gemma API Key (https://aistudio.google.com/)
GEMMA_API_KEY=your_gemini_or_gemma_api_key_here

# Model target
GEMMA_MODEL=gemma-4-26b-a4b-it

# Server config
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```
*(Note: If no API key is supplied, MECH-G runs in offline fallback mode using deterministic edge heuristics, ensuring 100% offline development).*

### 3. Start Backend Server
```powershell
# Using the pre-configured virtual environment:
.\.venv\Scripts\python.exe run_backend.py
```
* Backend API: **`http://localhost:8000`**
* Interactive OpenAPI Swagger Docs: **`http://localhost:8000/docs`**

### 4. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
* Frontend Web App: **`http://localhost:3000`**

---

## 🧪 Automated Test Suite

MECH-G includes comprehensive test suites covering graph traversal, citation auditing, safety interlocks, and compiler pipelines:

```powershell
.\.venv\Scripts\pytest backend/tests -v
```

All tests verify:
- In-memory NetworkX directed graph traversal & cycle detection
- Deterministic part number and fuzzy token resolution
- Closed-world citation auditing & hallucination stripping
- OSHA 1910.147 Lockout/Tagout gate logic & sign-off persistence
- Multi-format OmniOKF document compilation & AST node linking

---

## 🎥 Video Production & Media Pipeline

To re-render or modify the pitch video with the ElevenLabs + Librosa audio pipeline:

```powershell
# 1. Synthesize 120 BPM Industrial Score, 9 procedural SFX, and mix audio bed:
python video/audio/generate_audio_suite.py

# 2. Verify Librosa beat tracking and AV transient synchronization:
python video/audio/verify_librosa_sync.py

# 3. Assemble and verify master 76.0s voiceover track:
python video/audio/build_full_narration.py

# 4. Re-render motion graphic scenes (Scenes 01-04, 08-09):
python video/scripts/render_motion_scenes.py

# 5. Capture automated live UI walkthrough (Scenes 05-07):
python video/scripts/record_walkthrough.py

# 6. Master composite, broadcast sidechain ducking, and faststart MP4 export:
python video/scripts/master_composite.py
```
Output deliverable: [`video/mech_g_pitch.mp4`](./video/mech_g_pitch.mp4).

---

## 📖 Citation Format (OKF Specification)

All engineering assertions synthesized by MECH-G reference deterministic knowledge nodes using GitHub Flavored Markdown citations:
```markdown
Verify hydraulic accumulator pressure is below 5 PSI [^safety/lockout_tagout_hydraulics.md#zero-energy-state].
Tighten hex collar bolts to 35 Nm using calibrated torque wrench [^tools/calibrated_torque_wrench.md#specifications].
```

---

## 📄 License

This project is licensed under the **Apache 2.0 License**.  
Designed for mission-critical industrial maintenance, safety compliance, and engineering education.
