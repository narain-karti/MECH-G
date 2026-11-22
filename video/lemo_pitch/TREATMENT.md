# TREATMENT: MECH-G Architecture & Product Pitch

**Format**: 1920×1080 Full HD, 24.0 fps CFR, exactly 60.000s duration (1,440 frames, 30 bars @ 120.0 BPM)  
**Tone**: High-energy, authoritative, crisp developer pitch & technical deep dive.

---

## 1. Executive Summary & Codebase Scope

MECH-G is an offline-first, multimodal AI knowledge workspace and field diagnostic engine engineered for high-value industrial machinery (wind turbines, aerospace powerplants, heavy mining skids).

This pitch video takes developers and engineering leaders through the complete technical stack:
- **Backend Architecture**: FastAPI asynchronous engine (`backend/app/main.py`), Pydantic v2 schemas, SQLite in-memory persistence.
- **Local AI Core**: Google Gemma 4 (26B) on-device reasoning (`backend/app/services/gemma_client.py`).
- **Deterministic Knowledge Compiler**: Open Knowledge Format (`backend/app/services/okf_compiler/`) parser, linker, and indexer.
- **In-Memory Graph Engine**: NetworkX directed graph (`backend/app/services/graph_engine.py`) storing machine topologies and safety dependencies with `< 500ms` traversal latency.
- **Zero-Hallucination Citation Auditor**: AST closed-world verifier (`backend/app/services/citation_auditor.py`).
- **OSHA 1910.147 LOTO Gate**: Cryptographically verified zero-energy safety interlock (`frontend/src/pages/SafetyCompliancePage.tsx`).
- **Multimodal Field Triage**: Optical computer vision + acoustic FFT audio spectrogram diagnostics (`backend/app/services/diagnostic_service.py`).
- **NotebookLM-Inspired Workspace**: React 19 + Tailwind CSS + `@xyflow/react` graph explorer (`frontend/src/pages/WorkspacePage.tsx`).

---

## 2. Shot-by-Shot Timeline (60.000s)

| Time | Title | Code / Visual Focus | Audio / Voiceover Narrative |
|:---|:---|:---|:---|
| **0.0 - 8.0s** | **The Industrial Edge Crisis** | Offshore wind turbine nacelle weeping oil at 210 bar; cloud tablet flashing HTTP 504 Timeout. | *"In high-stakes industrial fields, cloud AI fails. When a 210-bar hydraulic valve blows a seal in the middle of the sea, internet does not exist."* |
| **8.0 - 17.0s** | **Meet MECH-G & Architecture** | Full-stack architecture schematic: FastAPI backend (`port 8000`), React 19 UI (`port 3000`), local Gemma 4 (26B) core. | *"Enter MECH-G. Powered by Google Gemma 4 running entirely on-device, MECH-G brings deterministic intelligence to the edge with zero cloud dependencies."* |
| **17.0 - 26.0s** | **OKF Compiler & In-Memory Graph** | `services/okf_compiler/` & `services/graph_engine.py`: 4,000-page OEM manual parsed into NetworkX directed graph. | *"Under the hood, our Open Knowledge Format compiler transforms complex OEM manuals into an in-memory directed graph, traversing machine topologies in under 500 milliseconds."* |
| **26.0 - 34.0s** | **Zero-Hallucination Citation Auditor** | `services/citation_auditor.py`: AST closed-world validator catching torque discrepancies; exact manual chapter links. | *"Safety demands zero hallucinations. Our AST Citation Auditor mathematically verifies every claim and torque specification directly against source nodes before streaming."* |
| **34.0 - 43.0s** | **OSHA LOTO Gate & Multimodal Triage** | OSHA 1910.147 lockout padlock clamp + digital signature pad; optical valve detection (PRV-992-B) & FFT spectrogram. | *"Before a single bolt is turned, MECH-G enforces mandatory OSHA 1910.147 lockout gates. Combined with multimodal vision and acoustic audio telemetry, repairs are certified safe."* |
| **43.0 - 51.0s** | **NotebookLM-Inspired Workspace** | `frontend/src/pages/WorkspacePage.tsx`: Floating source panels, slide-over citation previews, `@xyflow/react` interactive canvas. | *"The engineer workstation pairs a NotebookLM-style workspace with interactive visual graph exploration, putting verified procedures at the technician's fingertips."* |
| **51.0 - 60.0s** | **The Verdict & Call to Action** | Kinetic metric slam (84% MTTR • < 500ms Graph • 100% Offline) + GitHub repository banner + friendly mascot lockup. | *"Eighty-four percent faster repairs. Completely offline. When seconds count, trust MECH-G. Star and clone today on GitHub."* |

---

## 3. Audio & Music Specifications

* **Voice**: Brian (`nPczCjzI2devNBz1zQrb`, ElevenLabs) — authoritative, energetic, charismatic technical presenter.
* **Music**: High-energy cinematic tech-pulse at 120.0 BPM (analog synth arpeggios, driving kick & bass, building into an epic brass crescendo).
* **Foley**: UI clicks, data streams, pneumatic hiss, OSHA lock snap, 35 Nm torque clicks, sub impacts.
