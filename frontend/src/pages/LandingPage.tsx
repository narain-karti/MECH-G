import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Gauge,
  ArrowRight,
  HardDrive,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  GitFork,
  Radio,
  Sparkles,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { IntegrationBeam, BeamTool } from "../components/ui/integration-beam";
import { WorkflowCanvas, WorkflowNode, WorkflowEdge } from "../components/ui/workflow-canvas";
import { NumberRoll } from "../components/ui/number-roll";
import { Badge } from "../components/ui/badge";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Simulated Telemetry Sliders
  const [pressure, setPressure] = useState(210);
  const [temp, setTemp] = useState(68);

  const isPressureCritical = pressure > 280;
  const isPressureDegraded = pressure > 240 && pressure <= 280;
  const isTempHigh = temp > 90;

  // Beam Tools
  const leftBeamTools: BeamTool[] = [
    {
      name: "Optical Defect Vision",
      logo: <Eye className="w-5 h-5 text-cyan-400" />,
    },
    {
      name: "Acoustic Telemetry",
      logo: <Activity className="w-5 h-5 text-emerald-400" />,
    },
    {
      name: "Hydraulic Loop Transducer",
      logo: <Gauge className="w-5 h-5 text-amber-400" />,
    },
  ];

  const rightBeamTools: BeamTool[] = [
    {
      name: "In-Memory OKF Graph",
      logo: <GitFork className="w-5 h-5 text-indigo-400" />,
    },
    {
      name: "OSHA 1910.147 LOTO Gate",
      logo: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      name: "Verified Work Orders",
      logo: <FileText className="w-5 h-5 text-cyan-400" />,
    },
  ];

  // Workflow Canvas Nodes
  const workflowNodes: WorkflowNode[] = [
    {
      id: "node-snap",
      title: "1. SNAP & INGEST",
      subtitle: "Optical & Acoustic capture",
      status: "complete",
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      position: { x: 50, y: 110 },
      description: "High-resolution inspection of PRV-992-B seal face and acoustic cavitation spectrum under 210 bar load.",
    },
    {
      id: "node-lock",
      title: "2. LOCK & ISOLATE",
      subtitle: "OSHA 1910.147 LOTO Gate",
      status: "running",
      icon: <Lock className="w-4 h-4 text-amber-400" />,
      position: { x: 340, y: 110 },
      description: "Mandatory zero-energy state verification. High-pressure accumulator isolated & depressurized to 0 bar.",
    },
    {
      id: "node-fix",
      title: "3. FIX & VERIFY",
      subtitle: "35 Nm Star Torque Pattern",
      status: "pending",
      icon: <Wrench className="w-4 h-4 text-indigo-400" />,
      position: { x: 630, y: 110 },
      description: "FKM 90-durometer seal installation. Torque sequence verified via AST documentation node SEC-4.2.",
    },
  ];

  const workflowEdges: WorkflowEdge[] = [
    { id: "e1-2", from: "node-snap", to: "node-lock" },
    { id: "e2-3", from: "node-lock", to: "node-fix" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0B0B0C] text-[#E4E4E7] flex flex-col font-sans selection:bg-[#22D3EE]/20 selection:text-[#22D3EE]">
      {/* Editorial Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#27272A]/70 bg-[#0B0B0C]/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22D3EE]/20 to-[#3B82F6]/20 border border-[#22D3EE]/40 flex items-center justify-center text-[#22D3EE] group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wider text-white flex items-center gap-2">
                MECH-G
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                  Edge v2.0
                </span>
              </span>
              <span className="text-[10px] text-[#A1A1AA] tracking-tight">Offline Field Diagnostic Engine</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#A1A1AA]">
            <Link
              to="/notebooks"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181A] transition-colors"
            >
              Equipment Notebooks
            </Link>
            <Link
              to="/diagnostics"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181A] transition-colors"
            >
              Field Diagnostic
            </Link>
            <Link
              to="/graph"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181A] transition-colors"
            >
              Knowledge Mindmap
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181A] border border-[#27272A] text-xs font-mono text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEMMA 4 (26B) AIR-GAPPED</span>
          </div>

          <button
            onClick={() => navigate("/notebooks")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-[#0B0B0C] font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/10 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>Launch Workstation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-6xl px-6 pt-16 pb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181A] border border-[#22D3EE]/30 text-xs font-mono text-[#22D3EE] mb-6 shadow-sm">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>OFFLINE MULTIMODAL INTELLIGENCE FOR HEAVY INDUSTRY</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
            Frontline Edge Diagnostics for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#818CF8]">
              Mission-Critical Machinery
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#A1A1AA] max-w-2xl leading-relaxed">
            Diagnose wind turbine nacelles, industrial gas turbines, and heavy mining haul trucks with zero cloud
            dependency. Powered by Google Gemma 4, deterministic OKF knowledge graphs, and OSHA 1910.147 safety interlocks.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate("/notebooks")}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-[#0B0B0C] font-bold text-sm hover:bg-[#F4F4F5] shadow-xl shadow-white/5 active:scale-95 transition-all"
            >
              <span>Explore Equipment Notebooks</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C]" />
            </button>
            <button
              onClick={() => navigate("/diagnostics")}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#18181A] border border-[#27272A] text-white font-medium text-sm hover:border-[#3F3F46] hover:bg-[#202023] active:scale-95 transition-all"
            >
              <Activity className="w-4 h-4 text-[#22D3EE]" />
              <span>Instant Multimodal Field Scan</span>
            </button>
          </div>

          {/* Integration Beam Interactive Flow */}
          <div className="w-full mt-14 p-4 rounded-3xl bg-[#121214] border border-[#27272A]/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-mono text-[#71717A]">
              <Cpu className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>DATA ORCHESTRATION PIPELINE · DETERMINISTIC MULTIMODAL INFERENCE</span>
            </div>
            <div className="pt-6">
              <IntegrationBeam
                left={leftBeamTools}
                right={rightBeamTools}
                center={{
                  name: "MECH-G Core",
                  logo: <Wrench className="w-6 h-6 text-[#22D3EE]" />,
                }}
                className="py-4"
              />
            </div>
          </div>
        </section>

        {/* The 3 Zeros: Value Pillars */}
        <section className="w-full max-w-6xl px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE]">Non-Negotiable Architecture</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The 3 Zeros of Industrial Diagnostic Reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Zero Cloud */}
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#22D3EE]/40 transition-colors flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#18181A] border border-[#27272A] flex items-center justify-center text-[#22D3EE] mb-5 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Cloud</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  100% air-gapped local execution on frontline ruggedized tablets. Zero proprietary telemetry, vibration
                  signatures, or schematics ever leave the job site.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#27272A]/60 flex items-center justify-between text-xs font-mono text-[#71717A]">
                <span>LOCAL GEMMA 4</span>
                <span className="text-emerald-400 font-semibold">AIR-GAPPED</span>
              </div>
            </div>

            {/* Zero Hallucination */}
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#38BDF8]/40 transition-colors flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#18181A] border border-[#27272A] flex items-center justify-center text-[#38BDF8] mb-5 group-hover:scale-105 transition-transform">
                  <GitFork className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Hallucination</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Every torque specification, pinout, and clearance is linked to verifiable OKF markdown source files
                  with AST node paths and document section anchors.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#27272A]/60 flex items-center justify-between text-xs font-mono text-[#71717A]">
                <span>OKF GRAPH ENGINE</span>
                <span className="text-cyan-400 font-semibold">100% GROUNDED</span>
              </div>
            </div>

            {/* Zero Casualties */}
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-[#10B981]/40 transition-colors flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#18181A] border border-[#27272A] flex items-center justify-center text-[#10B981] mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Casualties</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Digital OSHA 1910.147 Lockout/Tagout enforcement blocks dangerous troubleshooting procedures until
                  technicians digitally confirm zero stored energy.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#27272A]/60 flex items-center justify-between text-xs font-mono text-[#71717A]">
                <span>SAFETY INTERLOCK</span>
                <span className="text-emerald-400 font-semibold">OSHA COMPLIANT</span>
              </div>
            </div>
          </div>
        </section>

        {/* Frontline 3-Step Interactive Workflow */}
        <section className="w-full max-w-6xl px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE]">Frontline Execution</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From Optical Defect to Verified Repair in 3 Stages
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121214] border border-[#27272A] shadow-xl overflow-hidden">
            <WorkflowCanvas nodes={workflowNodes} edges={workflowEdges} height={280} />
          </div>
        </section>

        {/* Live Hardware Telemetry Simulator */}
        <section className="w-full max-w-6xl px-6 py-12 mb-12">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#18181A] to-[#121214] border border-[#27272A] shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#22D3EE] mb-2">
                  <Sliders className="w-4 h-4" />
                  <span>INTERACTIVE HARDWARE TELEMETRY RIG</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Live Pitch Manifold Telemetry Simulator</h3>
                <p className="text-sm text-[#A1A1AA] mt-1">
                  Adjust pressure and thermal parameters to evaluate hydraulic relief valve thresholds.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-4 py-2.5 rounded-xl bg-[#0B0B0C] border border-[#27272A] flex flex-col items-center">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase">Hydraulic Status</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      isPressureCritical
                        ? "text-rose-400"
                        : isPressureDegraded
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {isPressureCritical ? "CRITICAL OVERPRESSURE" : isPressureDegraded ? "DEGRADED FLOW" : "NOMINAL 210 BAR"}
                  </span>
                </div>

                <div className="px-4 py-2.5 rounded-xl bg-[#0B0B0C] border border-[#27272A] flex flex-col items-center">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase">Manifold Temp</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      isTempHigh ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {isTempHigh ? "THERMAL WARNING" : "OPTIMAL 68°C"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Pressure Slider */}
              <div className="p-5 rounded-2xl bg-[#0B0B0C] border border-[#27272A]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    System Pressure
                  </span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {pressure} <span className="text-xs font-normal text-[#71717A]">bar</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  value={pressure}
                  onChange={(e) => setPressure(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#27272A] rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-2">
                  <span>50 bar (Idling)</span>
                  <span className="text-cyan-400 font-semibold">210 bar (Target)</span>
                  <span>350 bar (Relief Blowoff)</span>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="p-5 rounded-2xl bg-[#0B0B0C] border border-[#27272A]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Manifold Temperature
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {temp} <span className="text-xs font-normal text-[#71717A]">°C</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-[#27272A] rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-2">
                  <span>20 °C (Ambient)</span>
                  <span className="text-amber-400 font-semibold">68 °C (Nominal)</span>
                  <span>120 °C (Overheat Limit)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() =>
                  navigate(
                    `/diagnostics?pressure=${pressure}&temp=${temp}&machine=Vestas+V112`
                  )
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22D3EE] text-[#0B0B0C] font-semibold text-xs tracking-wide hover:brightness-110 active:scale-95 transition-all"
              >
                <span>Diagnose Live Readings in Field Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#27272A]/70 bg-[#0B0B0C] py-8 px-6 text-xs text-[#71717A]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">MECH-G</span>
            <span>·</span>
            <span>Google Gemma 4 Edge Diagnostic Engine</span>
            <span>·</span>
            <span>OSHA 1910.147 LOTO Verification</span>
          </div>

          <div className="flex items-center gap-6 text-[#A1A1AA]">
            <Link to="/notebooks" className="hover:text-white transition-colors">
              Notebooks
            </Link>
            <Link to="/diagnostics" className="hover:text-white transition-colors">
              Diagnostics
            </Link>
            <Link to="/graph" className="hover:text-white transition-colors">
              Mindmap
            </Link>
            <a
              href="https://github.com/narain-karti/MECH-G"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
