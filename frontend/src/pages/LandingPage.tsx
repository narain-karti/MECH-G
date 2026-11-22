import React, { useState, useEffect } from "react";
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
  Check,
  ChevronRight,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { IntegrationBeam, BeamTool } from "../components/ui/integration-beam";
import { WorkflowCanvas, WorkflowNode, WorkflowEdge } from "../components/ui/workflow-canvas";
import { NumberRoll } from "../components/ui/number-roll";
import { TextMorph } from "../components/ui/text-morph";
import { StatsBand, Stat } from "../components/ui/stats-band";
import { LogoMarquee } from "../components/ui/logo-marquee";
import { AnnouncementPill } from "../components/ui/announcement-pill";
import { Sparkline } from "../components/ui/sparkline";
import { UsageMeter } from "../components/ui/usage-meter";
import { Stamp } from "../components/ui/stamp";
import { VoiceOrb } from "../components/ui/voice-orb";

const TARGET_MACHINES = [
  "Mission-Critical Machinery",
  "Offshore Wind Nacelles",
  "Industrial Gas Turbines",
  "Heavy Mining Haul Trucks",
  "High-Pressure Power Skids",
];

const OEM_LOGOS = [
  <div key="vestas" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
    <span>VESTAS WIND SYSTEMS</span>
  </div>,
  <div key="siemens" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
    <span>SIEMENS ENERGY</span>
  </div>,
  <div key="komatsu" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
    <span>KOMATSU MINING</span>
  </div>,
  <div key="cat" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
    <span>CATERPILLAR HEAVY</span>
  </div>,
  <div key="ge" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
    <span>GE VERNOVA</span>
  </div>,
  <div key="parker" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
    <span>PARKER HANNIFIN</span>
  </div>,
  <div key="bosch" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-cyan-300" />
    <span>BOSCH REXROTH</span>
  </div>,
  <div key="liebherr" className="flex items-center gap-2 font-mono font-bold tracking-widest text-sm text-[#A1A1AA]">
    <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
    <span>LIEBHERR MINING</span>
  </div>,
];

const PLATFORM_STATS: Stat[] = [
  {
    value: 0,
    label: "Cloud Latency · 100% Air-Gapped",
    suffix: " ms",
  },
  {
    value: 26,
    label: "Gemma 4 Multimodal Parameters",
    suffix: "B",
  },
  {
    value: 100,
    label: "AST Graph Grounding Accuracy",
    suffix: "%",
  },
  {
    value: 1910,
    label: "OSHA Digital LOTO Standard",
    prefix: "§",
    suffix: ".147",
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Text Morph Index
  const [machineIndex, setMachineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMachineIndex((prev) => (prev + 1) % TARGET_MACHINES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Telemetry Rig State
  const [pressure, setPressure] = useState(210);
  const [temp, setTemp] = useState(68);
  const [isLotoStamped, setIsLotoStamped] = useState(false);

  // Dynamic sparkline data derived from pressure
  const sparklineData = React.useMemo(() => {
    return [
      pressure * 0.94,
      pressure * 0.98,
      pressure * 1.02,
      pressure * 0.97,
      pressure * 1.05,
      pressure * 0.99,
      pressure * 1.03,
      pressure,
    ];
  }, [pressure]);

  const isPressureCritical = pressure > 280;
  const isPressureDegraded = pressure > 240 && pressure <= 280;
  const isTempHigh = temp > 90;

  // Beam Tools
  const leftBeamTools: BeamTool[] = [
    {
      name: "Optical Defect Vision",
      logo: <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />,
    },
    {
      name: "Acoustic Telemetry",
      logo: <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
    },
    {
      name: "Hydraulic Loop Transducer",
      logo: <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
    },
  ];

  const rightBeamTools: BeamTool[] = [
    {
      name: "In-Memory OKF Graph",
      logo: <GitFork className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />,
    },
    {
      name: "OSHA 1910.147 LOTO Gate",
      logo: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
    },
    {
      name: "Verified Work Orders",
      logo: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />,
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
      position: { x: 30, y: 100 },
      description: "High-resolution inspection of PRV-992-B seal face and acoustic cavitation spectrum under 210 bar load.",
    },
    {
      id: "node-lock",
      title: "2. LOCK & ISOLATE",
      subtitle: "OSHA 1910.147 LOTO Gate",
      status: "running",
      icon: <Lock className="w-4 h-4 text-amber-400" />,
      position: { x: 300, y: 100 },
      description: "Mandatory zero-energy state verification. High-pressure accumulator isolated & depressurized to 0 bar.",
    },
    {
      id: "node-fix",
      title: "3. FIX & VERIFY",
      subtitle: "35 Nm Star Torque Pattern",
      status: "pending",
      icon: <Wrench className="w-4 h-4 text-indigo-400" />,
      position: { x: 570, y: 100 },
      description: "FKM 90-durometer seal installation. Torque sequence verified via AST documentation node SEC-4.2.",
    },
  ];

  const workflowEdges: WorkflowEdge[] = [
    { id: "e1-2", from: "node-snap", to: "node-lock" },
    { id: "e2-3", from: "node-lock", to: "node-fix" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0B0B0C] text-[#E4E4E7] flex flex-col font-sans selection:bg-[#22D3EE]/20 selection:text-[#22D3EE] overflow-x-hidden">
      {/* Sticky Responsive Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#27272A]/70 bg-[#0B0B0C]/85 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22D3EE]/20 to-[#3B82F6]/20 border border-[#22D3EE]/40 flex items-center justify-center text-[#22D3EE] group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base tracking-wider text-white flex items-center gap-2">
                MECH-G
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                  Edge v2.0
                </span>
              </span>
              <span className="text-[10px] text-[#A1A1AA] tracking-tight hidden sm:inline">
                Offline Field Diagnostic Engine
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs lg:text-sm font-medium text-[#A1A1AA]">
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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181A] border border-[#27272A] text-xs font-mono text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEMMA 4 (26B) AIR-GAPPED</span>
          </div>

          <button
            onClick={() => navigate("/notebooks")}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-[#0B0B0C] font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/10 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>Launch Workstation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#A1A1AA] hover:text-white rounded-lg border border-[#27272A]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-[#0B0B0C]/95 backdrop-blur-xl border-b border-[#27272A] p-4 flex flex-col gap-2 z-40 animate-in slide-in-from-top-2">
          <Link
            to="/notebooks"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-[#18181A] text-white text-xs font-semibold flex items-center justify-between"
          >
            <span>Equipment Notebooks</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </Link>
          <Link
            to="/diagnostics"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-[#18181A] text-white text-xs font-semibold flex items-center justify-between"
          >
            <span>Field Diagnostic</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </Link>
          <Link
            to="/graph"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-[#18181A] text-white text-xs font-semibold flex items-center justify-between"
          >
            <span>Knowledge Mindmap</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
          </Link>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center w-full">
        {/* Kinetic Hero Section */}
        <section className="w-full max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 pb-10 flex flex-col items-center text-center">
          {/* Hairline Announcement Pill */}
          <div className="mb-6">
            <AnnouncementPill
              badge="AIR-GAPPED v2.0"
              more="OSHA 1910.147 Certified →"
              onClick={() => navigate("/notebooks")}
            >
              Google Gemma 4 Edge Intelligence
            </AnnouncementPill>
          </div>

          {/* Kinetic Headline with Hairline TextMorph */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.18] flex flex-col items-center">
            <span>Frontline Edge Diagnostics for</span>
            <div className="h-[46px] sm:h-[64px] flex items-center justify-center mt-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#818CF8]">
                <TextMorph>{TARGET_MACHINES[machineIndex]}</TextMorph>
              </span>
            </div>
          </h1>

          <p className="mt-5 text-sm sm:text-base md:text-lg text-[#A1A1AA] max-w-2xl leading-relaxed px-2">
            Air-gapped multimodal diagnostic workspace powered by Google Gemma 4 (26B), in-memory OKF AST knowledge
            graph reasoning, and deterministic OSHA safety gate interlocks.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full px-2">
            <button
              onClick={() => navigate("/notebooks")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0B0B0C] font-bold text-sm hover:bg-[#F4F4F5] shadow-xl shadow-white/5 active:scale-95 transition-all"
            >
              <span>Explore Equipment Notebooks</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C]" />
            </button>
            <button
              onClick={() => navigate("/diagnostics")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#18181A] border border-[#27272A] text-white font-medium text-sm hover:border-[#3F3F46] hover:bg-[#202023] active:scale-95 transition-all"
            >
              <Activity className="w-4 h-4 text-[#22D3EE]" />
              <span>Instant Multimodal Field Scan</span>
            </button>
          </div>

          {/* Hairline Integration Beam Data Orchestration Visualization */}
          <div className="w-full mt-12 p-3 sm:p-5 rounded-3xl bg-[#121214] border border-[#27272A]/80 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 px-2 border-b border-[#27272A]/50 text-[10px] sm:text-xs font-mono text-[#71717A]">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span className="truncate">AIR-GAPPED TELEMETRY & AST REASONING PIPELINE</span>
              </div>
              <span className="text-emerald-400 font-semibold hidden sm:inline">ZERO LATENCY</span>
            </div>

            <div className="pt-4 overflow-x-auto scrollbar-none">
              <div className="min-w-[580px] sm:min-w-full">
                <IntegrationBeam
                  left={leftBeamTools}
                  right={rightBeamTools}
                  center={{
                    name: "MECH-G Core",
                    logo: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-[#22D3EE]" />,
                  }}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Industrial OEM Brand Trust Marquee */}
        <section className="w-full border-y border-[#27272A]/70 py-6 bg-[#0B0B0C]/60">
          <div className="max-w-6xl mx-auto px-4">
            <LogoMarquee logos={OEM_LOGOS} speed={38} gap={72} />
          </div>
        </section>

        {/* Hairline Stats Band with Rolling Digits */}
        <section className="w-full max-w-6xl px-4 sm:px-6 py-10">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#121214] border border-[#27272A] shadow-xl">
            <StatsBand stats={PLATFORM_STATS} />
          </div>
        </section>

        {/* "The 3 Zeros" Architecture Cards */}
        <section className="w-full max-w-6xl px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE]">Non-Negotiable Architecture</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The 3 Zeros of Industrial Diagnostic Reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Zero Cloud */}
            <div className="p-6 rounded-3xl bg-[#121214] border border-[#27272A] hover:border-[#22D3EE]/40 transition-colors flex flex-col justify-between group shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#18181A] border border-[#27272A] flex items-center justify-center text-[#22D3EE] mb-5 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Cloud</h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
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
            <div className="p-6 rounded-3xl bg-[#121214] border border-[#27272A] hover:border-[#38BDF8]/40 transition-colors flex flex-col justify-between group shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#18181A] border border-[#27272A] flex items-center justify-center text-[#38BDF8] mb-5 group-hover:scale-105 transition-transform">
                  <GitFork className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Hallucination</h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
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
            <div className="p-6 rounded-3xl bg-[#121214] border border-[#27272A] hover:border-[#10B981]/40 transition-colors flex flex-col justify-between group shadow-lg">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#18181A] border border-[#27272A] flex items-center justify-center text-[#10B981] mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zero Casualties</h3>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
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

        {/* Frontline 3-Stage Interactive Workflow */}
        <section className="w-full max-w-6xl px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE]">Frontline Execution</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From Optical Defect to Verified Repair in 3 Stages
            </p>
          </div>

          <div className="p-4 sm:p-6 rounded-3xl bg-[#121214] border border-[#27272A] shadow-xl overflow-x-auto scrollbar-none">
            <div className="min-w-[620px] sm:min-w-full">
              <WorkflowCanvas nodes={workflowNodes} edges={workflowEdges} height={260} />
            </div>
          </div>
        </section>

        {/* Live Hardware Telemetry Simulator & Acoustic Orb */}
        <section className="w-full max-w-6xl px-4 sm:px-6 py-10 mb-12">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#18181A] to-[#121214] border border-[#27272A] shadow-2xl relative overflow-hidden">
            {/* Stamp Overlay when LOTO triggered */}
            <Stamp
              on={isLotoStamped}
              mark="OSHA LOTO VERIFIED"
              detail="Zero Energy Depressurized · TECH-8842"
              tone="success"
              position="top-right"
              sound={true}
            >
              <div>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#22D3EE] mb-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>INTERACTIVE HARDWARE TELEMETRY RIG</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Pitch Manifold Telemetry & Acoustic Cavitation Simulator
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
                      Adjust hydraulic parameters and observe live acoustic plasma response and pressure sparkline.
                    </p>
                  </div>

                  {/* Acoustic Cavitation Voice Orb & Status Pills */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <VoiceOrb state="listening" tone="ice" size={54} />
                      <span className="text-[9px] font-mono text-[#71717A] mt-1">ACOUSTIC SPECTRUM</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#0B0B0C] border border-[#27272A] flex flex-col">
                        <span className="text-[9px] font-mono text-[#71717A] uppercase">Hydraulic Status</span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            isPressureCritical
                              ? "text-rose-400"
                              : isPressureDegraded
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isPressureCritical
                            ? "CRITICAL OVERPRESSURE"
                            : isPressureDegraded
                            ? "DEGRADED FLOW"
                            : "NOMINAL 210 BAR"}
                        </span>
                      </div>

                      <div className="px-3.5 py-1.5 rounded-xl bg-[#0B0B0C] border border-[#27272A] flex flex-col">
                        <span className="text-[9px] font-mono text-[#71717A] uppercase">Manifold Temp</span>
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
                </div>

                {/* Sliders and Sparklines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Pressure Slider + Sparkline */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0C] border border-[#27272A]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        System Pressure
                      </span>
                      <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                        {pressure} <span className="text-xs font-normal text-[#71717A]">bar</span>
                      </span>
                    </div>

                    {/* Sparkline Trend */}
                    <div className="h-10 my-2">
                      <Sparkline data={sparklineData} color="#22D3EE" height={36} />
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="350"
                      value={pressure}
                      onChange={(e) => setPressure(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#27272A] rounded-lg mt-2"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-2">
                      <span>50 bar (Idling)</span>
                      <span className="text-cyan-400 font-semibold">210 bar (Target)</span>
                      <span>350 bar (Relief Blowoff)</span>
                    </div>
                  </div>

                  {/* Temperature Slider + Usage Meter */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0B0C] border border-[#27272A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-400" />
                          Manifold Temperature
                        </span>
                        <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                          {temp} <span className="text-xs font-normal text-[#71717A]">°C</span>
                        </span>
                      </div>

                      <div className="my-2">
                        <UsageMeter used={temp} limit={120} unit="°C" label="Thermal Dissipation Capacity" />
                      </div>

                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={temp}
                        onChange={(e) => setTemp(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-[#27272A] rounded-lg mt-2"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-[#71717A] mt-2">
                        <span>20 °C (Ambient)</span>
                        <span className="text-amber-400 font-semibold">68 °C (Nominal)</span>
                        <span>120 °C (Trip Limit)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Safety Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#27272A]/70">
                  <button
                    onClick={() => setIsLotoStamped(!isLotoStamped)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181A] hover:bg-[#202024] border border-[#27272A] hover:border-emerald-400/40 text-xs font-semibold text-emerald-400 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isLotoStamped ? "Reset LOTO Simulation" : "Simulate OSHA 1910.147 Stamp"}</span>
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/diagnostics?pressure=${pressure}&temp=${temp}&machine=Vestas+V112`)
                    }
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22D3EE] text-[#0B0B0C] font-semibold text-xs tracking-wide hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span>Diagnose Live Readings in Field Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Stamp>
          </div>
        </section>
      </main>

      {/* Responsive Footer */}
      <footer className="w-full border-t border-[#27272A]/70 bg-[#0B0B0C] py-8 px-4 sm:px-6 text-xs text-[#71717A]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center md:text-left">
            <span className="font-bold text-white">MECH-G</span>
            <span>·</span>
            <span>Google Gemma 4 Edge Diagnostic Engine</span>
            <span>·</span>
            <span>OSHA 1910.147 LOTO Verification</span>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 text-[#A1A1AA]">
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
