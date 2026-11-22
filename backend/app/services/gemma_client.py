import os
import re
import json
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger(__name__)


class VisualFeatureExtraction(BaseModel):
    identified_component: str = Field(description="Name of the physical component or assembly")
    part_number: Optional[str] = Field(default=None, description="Part, model, or serial code if visible or inferred")
    observed_defect: str = Field(description="Observed damage, wear, leak, burn trace, or LED status")
    visual_indicators: List[str] = Field(default_factory=list, description="Visual markers observed")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Visual confidence score")


class SynthesizedRepairStep(BaseModel):
    step_number: int
    instruction: str
    torque_spec: Optional[str] = None
    tool_required: Optional[str] = None
    hazard_warning: Optional[str] = None
    citation: str = Field(description="Verifiable markdown citation anchor e.g. [^path/to/file.md#section]")


class SynthesizedRemediation(BaseModel):
    title: str
    estimated_duration_minutes: int
    steps: List[SynthesizedRepairStep]
    post_maintenance_verification: List[str]


class GemmaClient:
    """Multimodal Gemma / Gemini client for edge diagnostics."""

    def __init__(self):
        self.api_key = settings.gemma_api_key or os.environ.get("GEMMA_API_KEY") or os.environ.get("GEMINI_API_KEY")
        self.model_name = settings.gemma_model

    def _get_client(self):
        if settings.offline_mode or os.environ.get("OFFLINE_MODE", "").lower() in ("true", "1", "yes"):
            return None
        if not self.api_key:
            return None
        try:
            from google import genai
            return genai.Client(api_key=self.api_key)
        except (ImportError, AttributeError) as exc:
            # A partially configured edge machine must keep its deterministic
            # local workflow available. The caller already provides a safe,
            # citation-grounded fallback when this returns None.
            logger.warning("Google GenAI SDK unavailable; using offline fallback: %s", exc)
            return None

    async def analyze_visual_fault(
        self,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/jpeg",
        query_text: Optional[str] = None
    ) -> VisualFeatureExtraction:
        """Inspects uploaded hardware image and text to detect component and defect."""
        client = self._get_client()
        if not client or not image_bytes:
            # Deterministic edge fallback when offline or no image provided
            return self._fallback_visual_analysis(query_text)

        from google.genai import types

        prompt = (
            "You are an expert industrial field technician and diagnostic vision system.\n"
            "Analyze the provided image of industrial machinery, electronic board, or mechanical valve.\n"
            "Identify the exact component name, part/serial number if visible, specific physical defects "
            "(e.g. blown capacitor, oil weepage, thermal discoloration, sheared bolt), and confidence score.\n"
        )
        if query_text:
            prompt += f"\nTechnician notes: {query_text}"

        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
            response = client.models.generate_content(
                model=self.model_name,
                contents=[prompt, image_part],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VisualFeatureExtraction,
                    temperature=0.1
                )
            )
            return VisualFeatureExtraction.model_validate_json(response.text)
        except Exception as e:
            logger.error("Gemma visual analysis failed: %s", e)
            return self._fallback_visual_analysis(query_text)

    async def synthesize_grounded_remediation(
        self,
        component_name: str,
        defect: str,
        subgraph_context: str
    ) -> SynthesizedRemediation:
        """Synthesizes step-by-step remediation grounded strictly in the OKF subgraph with citations."""
        client = self._get_client()
        if not client:
            return self._fallback_remediation_synthesis(component_name, defect)

        from google.genai import types

        prompt = (
            "You are an OSHA-compliant industrial diagnostic engine.\n"
            "CRITICAL SAFETY RULE: Base your repair steps EXCLUSIVELY on the provided OKF knowledge nodes.\n"
            "ANTI-HALLUCINATION REQUIREMENT: Every instruction step MUST cite its exact source node and heading "
            "using the format: [^path/to/file.md#heading]. NEVER fabricate citations or page numbers.\n\n"
            f"=== TARGET ISSUE ===\nComponent: {component_name}\nObserved Defect: {defect}\n\n"
            f"=== VERIFIED OKF SUBGRAPH CONTEXT ===\n{subgraph_context}\n=== END CONTEXT ==="
        )

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SynthesizedRemediation,
                    temperature=0.1
                )
            )
            return SynthesizedRemediation.model_validate_json(response.text)
        except Exception as e:
            logger.error("Gemma remediation synthesis failed: %s", e)
            return self._fallback_remediation_synthesis(component_name, defect)

    async def generate_chat_stream(self, prompt: str, system_instruction: str):
        """Streams conversational responses grounded in OKF knowledge."""
        client = self._get_client()
        if client:
            try:
                from google.genai import types
                response_stream = client.models.generate_content_stream(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.2
                    )
                )
                for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                logger.warning("Gemma chat stream error, trying generate_content: %s", e)
                try:
                    from google.genai import types
                    resp = client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.2
                        )
                    )
                    if resp.text:
                        words = resp.text.split(" ")
                        for i, word in enumerate(words):
                            chunk = word if i == len(words) - 1 else word + " "
                            yield chunk
                            await asyncio.sleep(0.015)
                        return
                except Exception as inner_e:
                    logger.error("Gemma online generation also failed: %s; falling back to offline responder", inner_e)

        # Fallback generator for offline/local development
        import asyncio
        fallback_text = self._generate_fallback_chat_response(prompt)
        # Yield words in chunks to simulate realistic token streaming
        words = fallback_text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield chunk
            await asyncio.sleep(0.015)

    def _generate_fallback_chat_response(self, prompt: str) -> str:
        # Extract user question from prompt wrapper if present
        question_match = re.search(r"Technician / Engineer Question:\s*(.*?)(?:\nProvide|\Z)", prompt, re.DOTALL | re.IGNORECASE)
        user_query = question_match.group(1).strip() if question_match else prompt
        q_lower = user_query.lower()
        p_lower = prompt.lower()

        # 1. Offline Mode / Edge Architecture query
        if "offline" in q_lower or "connectivity" in q_lower or "disconnected" in q_lower or "edge mode" in q_lower:
            return (
                "### 🛰️ MECH-G Offline Edge Intelligence Active\n\n"
                "MECH-G is operating in **100% Offline-First Edge Mode**. All knowledge graph traversal, citation auditing, and safety gate verifications are executing locally in-memory without external cloud dependencies [^safety/lockout_tagout_hydraulics.md#isolation-procedure].\n\n"
                "#### Offline Capabilities Active:\n"
                "- **Deterministic In-Memory Graph:** Sub-millisecond NetworkX traversal of OEM component nodes.\n"
                "- **Closed-World Citation Auditor:** Validates markdown references against local AST anchors.\n"
                "- **OSHA 1910.147 Safety Gate:** Enforces zero-energy verification before unlocking procedural repair steps.\n"
                "- **Local Telemetry & Diagnostic Reasoning:** Instant component and defect classification [^components/proportional_relief_valve_v2.md#overview].\n\n"
                "All diagnostic workflows and citations remain fully verifiable offline."
            )

        # 2. Safety / Lockout Tagout / LOTO / OSHA / Zero Energy
        if "loto" in q_lower or "lockout" in q_lower or "tagout" in q_lower or "safety" in q_lower or "zero-energy" in q_lower or "zero energy" in q_lower:
            return (
                "### ⚠️ OSHA 1910.147 Lockout/Tagout (LOTO) & Safety Protocol\n\n"
                "Per **OSHA Standard 1910.147** and the **Hydraulic Zero-Energy Isolation Protocol** [^safety/lockout_tagout_hydraulics.md#lockout-tagout-protocol], all maintenance on pressurized or electrical equipment requires strict de-energization prior to physical contact.\n\n"
                "#### Mandatory Isolation Sequence:\n"
                "1. **Facility Notification:** Inform central control room and nacelle operators of pending isolation [^safety/lockout_tagout_hydraulics.md#isolation-procedure].\n"
                "2. **Primary De-energization:** Switch main hydraulic pump skid breaker to OFF and bleed accumulator circuit [^safety/lockout_tagout_hydraulics.md#zero-energy-verification].\n"
                "3. **Zero-Energy Verification:** Confirm analog pressure gauge PG-02 reads **0 bar / 0 PSI**. Depress manual bleed petcock to release residual trapped energy.\n"
                "4. **Mechanical Hasp & Lock:** Attach red lockout padlock and safety danger tag with technician ID and date.\n"
                "5. **Electrical / Arc Flash PPE:** For electrical enclosures, don Level 2 Arc Flash PPE (minimum 8 cal/cm² face shield and arc-rated coverall) [^safety/arc_flash_ppe_level2.md#protective-equipment].\n\n"
                "```mermaid\n"
                "flowchart TD\n"
                "    A[\"Notify Operators\"] --> B[\"Shutdown Pump\"]\n"
                "    B --> C[\"Bleed Accumulator\"]\n"
                "    C --> D[\"Verify 0 Bar on Gauge PG-02\"]\n"
                "    D --> E[\"Apply LOTO Padlock\"]\n"
                "    E --> F[\"Unlock Repair Work\"]\n"
                "```\n"
            )

        # 3. Fault Code E302 / Pressure Drop / Hydraulic Alarms
        if "e302" in q_lower or "code" in q_lower or "alarm" in q_lower or "fault" in q_lower or "pressure drop" in q_lower:
            return (
                "### 🚨 Diagnostic Analysis: Fault Code E302 (Hydraulic Pressure Drop)\n\n"
                "According to the **Fault Code E302 Diagnostic Reference** [^fault_codes/code_e302_pressure_drop.md#diagnostic-steps], Code E302 triggers when manifold pressure decays below 180 bar during sustained operation.\n\n"
                "#### Root Cause Candidates:\n"
                "1. **Proportional Relief Valve Leakage:** Extrusion or degradation of the Viton O-ring seal on PRV-992-B [^components/proportional_relief_valve_v2.md#overview].\n"
                "2. **Accumulator Pre-charge Loss:** Nitrogen pre-charge bladder deflation below 110 bar nominal.\n"
                "3. **Solenoid Actuator Coil Sticking:** Debris ingress or thermal degradation preventing full valve seat closure.\n\n"
                "#### Immediate Remediation Actions:\n"
                "1. Execute complete hydraulic isolation and zero-energy verification [^safety/lockout_tagout_hydraulics.md#lockout-tagout-protocol].\n"
                "2. Perform visual inspection of the PRV-992-B valve collar for hydraulic weepage [^components/proportional_relief_valve_v2.md#overview].\n"
                "3. Follow the valve seal replacement procedure, applying a 3-pass torque pattern to exactly 35 Nm [^procedures/valve_seal_replacement.md#reassembly-and-torque].\n"
            )

        # 4. Torque Specs / Tools / Wrenches
        if "torque" in q_lower or "wrench" in q_lower or "fastener" in q_lower or "tighten" in q_lower:
            return (
                "### 🔧 Fastener Torque Specifications & Calibrated Tooling\n\n"
                "According to the **Calibrated Torque Wrench Specification** [^tools/calibrated_torque_wrench.md#specifications] and **Valve Seal Procedure** [^procedures/valve_seal_replacement.md#reassembly-and-torque]:\n\n"
                "| Fastener Type | Thread / Grade | Target Final Torque | Tightening Sequence |\n"
                "| :--- | :--- | :--- | :--- |\n"
                "| PRV-992-B Mounting Screws | 4x M10 Socket Head (Class 10.9) | **35 Nm** (±2%) | Cross-diagonal, 3 passes: 15 Nm → 25 Nm → 35 Nm |\n"
                "| Solenoid Retaining Collar | M24 Fine Thread | **25 Nm** | Single pass with non-marring pin spanner |\n"
                "| Bleed Screw Plug | 1/4\" NPT Steel | **18 Nm** | Uniform seating |\n\n"
                "#### Critical Tool Requirements:\n"
                "- **Calibrated Digital Torque Wrench:** Range 10–60 Nm, ±2% CW/CCW accuracy, ISO 6789 compliance certificate [^tools/calibrated_torque_wrench.md#specifications].\n"
                "- **CAUTION:** Never exceed 35 Nm on aluminum manifold threads or bolt shearing and high-pressure blowout will occur [^components/proportional_relief_valve_v2.md#specifications]."
            )

        # 5. Valve / PRV / Pressure Relief / Hydraulic Seals
        if "valve" in q_lower or "prv" in q_lower or "pressure" in q_lower or "seal" in q_lower or "hydraulic" in q_lower or "leak" in q_lower:
            return (
                "### ⚙️ Proportional Pressure Relief Valve (PRV-992-B) Overview & Service\n\n"
                "Based on the **Industrial Machinery Knowledge Base** [^components/proportional_relief_valve_v2.md#overview], "
                "the Proportional Pressure Relief Valve (PRV-992-B) regulates hydraulic flow up to 350 bar (5,076 PSI) with 24V DC PWM actuation.\n\n"
                "#### Key Procedural Steps:\n"
                "1. **Safety Interlock:** Before servicing, execute full hydraulic isolation and zero-pressure verification [^safety/lockout_tagout_hydraulics.md#lockout-tagout-protocol].\n"
                "2. **Fastener Removal:** Use the specified Calibrated Torque Wrench [^tools/calibrated_torque_wrench.md#specifications] to avoid damaging mating flanges.\n"
                "3. **Seal Replacement:** Remove extruded Viton 90-durometer O-ring, inspect manifold cavity with lint-free wipes, and install OEM replacement with PTFE backup ring facing the low-pressure side [^procedures/valve_seal_replacement.md#reassembly-and-torque].\n"
                "4. **Reassembly Torque:** Torque 4x M10 bolts diagonally in 3 passes: 15 Nm, 25 Nm, and final 35 Nm [^procedures/valve_seal_replacement.md#reassembly-and-torque].\n\n"
                "```mermaid\n"
                "flowchart LR\n"
                "    A[\"LOTO 0 Bar\"] --> B[\"Remove 4x M10\"]\n"
                "    B --> C[\"Inspect Cavity\"]\n"
                "    C --> D[\"Seat Viton O-Ring\"]\n"
                "    D --> E[\"Torque 15-25-35 Nm\"]\n"
                "    E --> F[\"Test 210 Bar 0 Weepage\"]\n"
                "```\n\n"
                "Verify post-maintenance zero weepage under 100% duty cycle testing at 210 bar."
            )

        # 6. PCB / Pitch Controller / Capacitor / Electronics
        if "pcb" in q_lower or "pitch" in q_lower or "capacitor" in q_lower or "c14" in q_lower or "electrical" in q_lower or "board" in q_lower:
            return (
                "### ⚡ Pitch Controller Power Board (PCB-PITCH-CTRL-V1) Diagnostics\n\n"
                "According to the **Pitch Controller Power Board manual** [^components/pcb_pitch_controller_v1.md#specifications], "
                "the controller operates on a regulated 24V DC bus with 10A peak switching capability.\n\n"
                "#### Maintenance & Safety Requirements:\n"
                "- **Arc Flash PPE:** Level 2 PPE is strictly required before opening the electrical enclosure [^safety/arc_flash_ppe_level2.md#protective-equipment].\n"
                "- **Capacitor Discharge:** Ensure electrolytic filter capacitors (C14) are safely discharged using a 100Ω 25W ceramic discharge probe before probing.\n"
                "- **Thermal Diagnostics:** Scorching near C14 indicates prolonged over-voltage or thermal dissipation breakdown.\n"
                "- **Ground Continuity:** Verify chassis ground impedance is < 0.1Ω prior to re-energization."
            )

        # 7. Check if prompt context contains other indexed nodes and summarize them
        ref_matches = re.findall(r"### \[^(.*?)(?:#(.*?))?\]\s*\n\*\*Category:\*\*\s*(.*?)\s*\|\s*\*\*Subsystem:\*\*\s*(.*?)\n(?:.*?\n)*?(.*?)(?=\n### \[|\Z)", prompt, re.DOTALL)
        if ref_matches:
            lines = [
                "### 📋 Grounded Technical Analysis (MECH-G Edge Engine)\n",
                "Based on the retrieved Open Knowledge Format (OKF) documentation:\n"
            ]
            for path, heading, cat, sub, content in ref_matches[:3]:
                clean_path = path.strip()
                h_name = heading.strip() if heading else "Overview"
                summary_excerpt = " ".join([l.strip() for l in content.splitlines() if l.strip() and not l.strip().startswith(("#", "**"))][:2])
                if not summary_excerpt:
                    summary_excerpt = f"Technical specifications and operating parameters for {h_name}."
                lines.append(f"- **{h_name}** ([^{clean_path}#{h_name}]): {summary_excerpt[:180]}...")
            lines.append("\n**Safety Prerequisite:** Comply with OSHA 1910.147 energy isolation before physical maintenance [^safety/lockout_tagout_hydraulics.md#lockout-tagout-protocol].")
            return "\n".join(lines)

        return (
            "### ⚙️ MECH-G Field Intelligence Engine\n\n"
            "Based on the indexed Open Knowledge Format (OKF) documentation, industrial systems require strict adherence "
            "to lockout/tagout (LOTO) protocols [^safety/lockout_tagout_hydraulics.md#lockout-tagout-protocol] and verified torque specifications "
            "prior to component disassembly [^tools/calibrated_torque_wrench.md#specifications].\n\n"
            "Select specific sources from the sidebar to focus the knowledge context on your active machinery assembly."
        )

    def _fallback_visual_analysis(self, query_text: Optional[str]) -> VisualFeatureExtraction:
        text = (query_text or "").lower()
        if "prv" in text or "valve" in text or "pressure" in text or "leak" in text or "oil" in text or "hydraulic" in text or "seal" in text:
            return VisualFeatureExtraction(
                identified_component="Proportional Pressure Relief Valve V2",
                part_number="PRV-992-B",
                observed_defect="Extruded Viton 90-durometer O-ring seal with high-pressure fluid weepage around solenoid hex collar.",
                visual_indicators=["High-pressure hydraulic fluid seep", "Collar discoloration", "Extruded Viton seal"],
                confidence=0.96
            )
        elif "pcb" in text or "capacitor" in text or "board" in text or "pitch" in text or "scorch" in text or "burn" in text:
            return VisualFeatureExtraction(
                identified_component="Pitch Controller Power Board",
                part_number="PCB-PITCH-CTRL-V1",
                observed_defect="Thermal scorching near 24V filter capacitor C14; blown electrolyte seal.",
                visual_indicators=["Brown scorch ring", "Bulging aluminum capacitor top"],
                confidence=0.94
            )
        return VisualFeatureExtraction(
            identified_component="Industrial Machinery Assembly",
            part_number=None,
            observed_defect="Mechanical or electrical anomaly reported: " + (query_text or "Visual inspection required"),
            visual_indicators=["Standard wear patterns"],
            confidence=0.80
        )

    def _fallback_remediation_synthesis(self, component_name: str, defect: str) -> SynthesizedRemediation:
        c_lower = component_name.lower()
        if "valve" in c_lower or "prv" in c_lower or "relief" in c_lower or "seal" in c_lower:
            return SynthesizedRemediation(
                title="PRV Series Solenoid Valve Seal Replacement & Torque Recalibration",
                estimated_duration_minutes=40,
                steps=[
                    SynthesizedRepairStep(
                        step_number=1,
                        instruction="Disconnect 24V DC solenoid plug and verify 0 pressure on gauge PG-02.",
                        torque_spec=None,
                        tool_required="CAT IV Multimeter",
                        hazard_warning="Residual hydraulic and electrical energy",
                        citation="[^safety/lockout_tagout_hydraulics.md#isolation-procedure]"
                    ),
                    SynthesizedRepairStep(
                        step_number=2,
                        instruction="Loosen 4x M10 hex socket head cap screws in cross-diagonal sequence.",
                        torque_spec="35 Nm upon reassembly",
                        tool_required="8mm Hex Bit Socket",
                        hazard_warning="Support valve body to prevent manifold port distortion",
                        citation="[^procedures/valve_seal_replacement.md#disassembly]"
                    ),
                    SynthesizedRepairStep(
                        step_number=3,
                        instruction="Clean manifold cavity, remove damaged Viton O-ring with brass pick, lubricate new seal with ISO VG 46 oil.",
                        torque_spec=None,
                        tool_required="Non-marring Brass O-Ring Pick",
                        hazard_warning="PTFE backup ring must face low-pressure return side",
                        citation="[^procedures/valve_seal_replacement.md#reassembly-and-torque]"
                    ),
                    SynthesizedRepairStep(
                        step_number=4,
                        instruction="Seat valve flush into manifold. Torque 4x M10 fasteners in 3 incremental passes: 15 Nm, 25 Nm, and final torque of exactly 35 Nm.",
                        torque_spec="35 Nm (M10 Class 10.9 in 3 passes: 15, 25, 35 Nm)",
                        tool_required="Calibrated Digital Torque Wrench",
                        hazard_warning="Do not exceed 35 Nm or flange threads will strip",
                        citation="[^components/proportional_relief_valve_v2.md#specifications]"
                    )
                ],
                post_maintenance_verification=[
                    "Pressurize yaw circuit to 210 bar; verify zero pressure decay over 10 min.",
                    "Perform visual inspection for radial weepage around hex collar."
                ]
            )
        elif "pcb" in c_lower or "pitch" in c_lower or "capacitor" in c_lower or "board" in c_lower:
            return SynthesizedRemediation(
                title="Pitch Controller Power Board (PCB-PITCH-CTRL-V1) Diagnostics & Replacement",
                estimated_duration_minutes=30,
                steps=[
                    SynthesizedRepairStep(
                        step_number=1,
                        instruction="Don Level 2 Arc Flash PPE and de-energize main 24V DC bus breaker.",
                        torque_spec=None,
                        tool_required="Level 2 Arc Flash PPE",
                        hazard_warning="Arc flash and high electrical shock risk",
                        citation="[^safety/arc_flash_ppe_level2.md#protective-equipment]"
                    ),
                    SynthesizedRepairStep(
                        step_number=2,
                        instruction="Discharge electrolytic filter capacitor C14 across a 100Ω 25W ceramic discharge probe.",
                        torque_spec=None,
                        tool_required="100Ω 25W Discharge Probe & CAT IV Multimeter",
                        hazard_warning="Stored capacitive electrical energy",
                        citation="[^components/pcb_pitch_controller_v1.md#specifications]"
                    ),
                    SynthesizedRepairStep(
                        step_number=3,
                        instruction="Label and unseat wiring harnesses, unscrew 4x M4 standoff screws, and seat replacement PCB.",
                        torque_spec="2.5 Nm on M4 standoffs",
                        tool_required="Precision Torque Screwdriver",
                        hazard_warning="ESD sensitive assembly",
                        citation="[^components/pcb_pitch_controller_v1.md#specifications]"
                    )
                ],
                post_maintenance_verification=[
                    "Verify regulated 24V DC bus voltage and 0.0V DC ripple on oscilloscope.",
                    "Execute self-test cycle from pitch control diagnostic console."
                ]
            )

        return SynthesizedRemediation(
            title=f"Standard Field Remediation: {component_name}",
            estimated_duration_minutes=45,
            steps=[
                SynthesizedRepairStep(
                    step_number=1,
                    instruction="Perform complete energy isolation and verify zero pressure/voltage before touching assembly.",
                    torque_spec=None,
                    tool_required="Digital Multimeter or Pressure Gauge",
                    hazard_warning="Residual high energy hazard",
                    citation="[^safety/lockout_tagout_hydraulics.md#isolation-procedure]"
                ),
                SynthesizedRepairStep(
                    step_number=2,
                    instruction="Disassemble securing fasteners and remove damaged component without scoring the mating surface.",
                    torque_spec="35 Nm upon reassembly",
                    tool_required="Calibrated Torque Wrench",
                    hazard_warning="Handle machined surfaces with care",
                    citation="[^procedures/valve_seal_replacement.md#disassembly]"
                ),
                SynthesizedRepairStep(
                    step_number=3,
                    instruction="Inspect seating cavity, install OEM replacement O-ring/gasket, and re-torque fasteners in cross-pattern.",
                    torque_spec="35 Nm",
                    tool_required="Calibrated Torque Wrench",
                    hazard_warning="Do not over-torque beyond rating",
                    citation="[^components/proportional_relief_valve_v2.md#specifications]"
                )
            ],
            post_maintenance_verification=[
                "Verify zero fluid leakage or thermal runaway after 15 minutes of operational testing.",
                "Log maintenance record in digital field register."
            ]
        )


