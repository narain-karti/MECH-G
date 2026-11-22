import React, { useState } from "react";
import { TopToolbar } from "../components/workspace/TopToolbar";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCheck2,
  HardHat,
  Glasses,
  ZapOff,
  Flame,
  Check,
  X,
  Printer,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  CheckSquare,
  Square
} from "lucide-react";
import { Steps } from "../components/ui/steps";
import { HoldToStart } from "../components/ui/hold-to-start";
import { SignaturePad, SignatureResult } from "../components/ui/signature-pad";
import { Stamp } from "../components/ui/stamp";
import { LiquidTabs, LiquidTab } from "../components/ui/liquid-tabs";
import { Badge } from "../components/ui/badge";

interface IsolationPermit {
  id: string;
  asset: string;
  technician: string;
  badgeId: string;
  energyType: string;
  issuedAt: string;
  status: "ACTIVE" | "DE-ISOLATED";
  signature?: string;
}

export const SafetyCompliancePage: React.FC = () => {
  // Active Tab for Right Island
  const [activeTab, setActiveTab] = useState<string>("interlocks");

  // Selected Equipment Asset
  const [selectedAsset, setSelectedAsset] = useState("Vestas V112 Nacelle Pitch System");

  // Energy Category
  const [energyType, setEnergyType] = useState<"electrical" | "hydraulic" | "mechanical">("hydraulic");

  // Hold-to-Start state
  const [isPermitArmed, setIsPermitArmed] = useState(false);

  // Interactive Live LOTO Simulator Steps
  const [lotoSteps, setLotoSteps] = useState([
    { id: "1", title: "Notify Affected Personnel", desc: "Inform control room operator of pitch actuator service outage.", checked: true },
    { id: "2", title: "Emergency Stop Engaged", desc: "Verify turbine e-stop button engaged in base and nacelle.", checked: true },
    { id: "3", title: "Energy Isolation (480V ACB Opened)", desc: "Open main circuit breaker CB-480 and discharge bus capacitors.", checked: true },
    { id: "4", title: "Lockout & Tagout Applied", desc: "Fit Master Lock Series 410 red padlock and Danger tag with Badge ID.", checked: true },
    { id: "5", title: "Zero-Energy Depressurization Verified", desc: "Bleed hydraulic accumulator manifold to < 5 PSI via bleed valve V-02.", checked: false },
    { id: "6", title: "Test Zero Mechanical State", desc: "Attempt manual actuation test to confirm zero mechanical/electrical response.", checked: false },
  ]);

  // OSHA 1910.147 Progression Steps
  const oshaStepsDefinition = [
    { label: "Notification", description: "Affected operators alerted" },
    { label: "E-Stop Shutdown", description: "Controlled power-down" },
    { label: "ACB Isolation", description: "Main circuit disconnect" },
    { label: "Lock & Tag", description: "Padlock & serial placard" },
    { label: "Depressurization", description: "Bleed hydraulic manifold" },
    { label: "Verification", description: "Zero mechanical test" },
  ];

  // PPE Checklist
  const [ppeItems, setPpeItems] = useState([
    { id: "hard_hat", name: "EN 397 Industrial Safety Helmet", checked: true },
    { id: "safety_glasses", name: "ANSI Z87.1 Safety Eyewear (Impact Rated)", checked: true },
    { id: "arc_flash", name: "NFPA 70E Arc Flash Face Shield (Category 2)", checked: true },
    { id: "electrical_gloves", name: "ASTM D120 Class 0 (1000V) Insulated Gloves", checked: false },
    { id: "steel_toe", name: "ASTM F2413 Steel Toe Work Boots (EH Rated)", checked: true },
  ]);

  // Active Permits Registry
  const [permits, setPermits] = useState<IsolationPermit[]>([
    {
      id: "PERMIT-8842-A",
      asset: "Vestas V112 Nacelle Pitch System",
      technician: "Alex Carter",
      badgeId: "TECH-8842-OFFSHORE",
      energyType: "Hydraulic 210 bar",
      issuedAt: "2026-10-31 08:30 UTC",
      status: "ACTIVE",
    },
    {
      id: "PERMIT-7104-E",
      asset: "Siemens SGT-400 Gas Turbine",
      technician: "Elena Vance",
      badgeId: "TECH-3109-ROTATING",
      energyType: "Electrical 480V",
      issuedAt: "2026-10-30 14:15 UTC",
      status: "ACTIVE",
    },
  ]);

  // Modals
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [selectedPermitForView, setSelectedPermitForView] = useState<IsolationPermit | null>(null);

  // New Permit Form Inputs
  const [newTechnicianName, setNewTechnicianName] = useState("Alex Carter");
  const [newBadgeId, setNewBadgeId] = useState("TECH-8842-OFFSHORE");
  const [newPadlockSerial, setNewPadlockSerial] = useState("ML-410-RED-992");
  const [technicianSignature, setTechnicianSignature] = useState<string>("");

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  const toggleLotoStep = (id: string) => {
    setLotoSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const togglePpeItem = (id: string) => {
    setPpeItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p))
    );
  };

  const completedLotoCount = lotoSteps.filter((s) => s.checked).length;
  const isZeroEnergyCertified = completedLotoCount === lotoSteps.length;

  const currentStepIndex = Math.min(
    completedLotoCount,
    oshaStepsDefinition.length - 1
  );

  const handleIssuePermit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPermit: IsolationPermit = {
      id: `PERMIT-${Math.floor(1000 + Math.random() * 9000)}-${energyType.toUpperCase().slice(0, 3)}`,
      asset: selectedAsset,
      technician: newTechnicianName,
      badgeId: newBadgeId,
      energyType:
        energyType === "electrical"
          ? "Electrical 480V"
          : energyType === "hydraulic"
          ? "Hydraulic 210 bar"
          : "Mechanical",
      issuedAt: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      status: "ACTIVE",
      signature: technicianSignature,
    };
    setPermits([newPermit, ...permits]);
    setShowPermitModal(false);
    setIsPermitArmed(false);
  };

  const rightTabs: LiquidTab[] = [
    { value: "interlocks", label: "Interlock Registry" },
    { value: "permits", label: `Active Permits (${permits.length})` },
    { value: "bulletins", label: "OEM Bulletins" },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0B0B0C] text-[#F5F7FF] overflow-hidden select-none">
      {/* Persistent Navigation Toolbar */}
      <TopToolbar activeModule="safety" title="Safety Compliance & LOTO Interlocks" />

      {/* Floating Island Layout */}
      <main className="flex-1 p-3 pt-1 flex flex-col gap-3 min-h-0 overflow-hidden">
        {/* Top KPI Metrics Bar */}
        <section className="bg-[#18181A] rounded-[24px] border border-[#27272A] px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#9CA3AF] uppercase">Compliance Standard</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>OSHA 29 CFR 1910.147 (LOTO)</span>
                  <Badge tone="amber" variant="subtle" size="sm" className="font-mono">
                    Mandatory
                  </Badge>
                </div>
              </div>
            </div>

            <div className="h-7 w-[1px] bg-[#27272A] hidden sm:block" />

            <div className="hidden sm:block">
              <div className="text-[10px] font-mono text-[#9CA3AF] uppercase">Active Isolations</div>
              <div className="text-xs font-bold text-cyan-300 font-mono">
                {permits.filter((p) => p.status === "ACTIVE").length} Active Permits
              </div>
            </div>

            <div className="h-7 w-[1px] bg-[#27272A] hidden md:block" />

            <div className="hidden md:block">
              <div className="text-[10px] font-mono text-[#9CA3AF] uppercase">Zero-Energy Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Interlock Enforcement</span>
              </div>
            </div>
          </div>

          {/* Hairline HoldToStart for arming isolation permit */}
          <div>
            <HoldToStart
              active={isPermitArmed}
              onActiveChange={setIsPermitArmed}
              onHoldComplete={() => setShowPermitModal(true)}
              label="Hold to Arm Permit"
              holdingLabel="Authorizing LOTO..."
              activeLabel="Permit Armed"
              hint="Hold 1s to arm digital isolation"
              holdMs={1000}
              palette="solar"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold px-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Arm Isolation Permit</span>
              </div>
            </HoldToStart>
          </div>
        </section>

        {/* 2-Column Workstation Islands */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          {/* Left Island: Hazardous Energy Isolation Simulator */}
          <section className="w-[450px] lg:w-[490px] flex-shrink-0 bg-[#18181A] rounded-[24px] border border-[#27272A] p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar relative">
            <Stamp
              on={isZeroEnergyCertified}
              mark="LOTO SECURED"
              detail="OSHA 1910.147 CERTIFIED"
              tone="success"
              position="top-right"
              rotate={-12}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="pb-3 border-b border-[#27272A] flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>LOTO Procedure Simulator</span>
                    </h2>
                    <p className="text-[10px] text-[#9CA3AF]">Zero-Energy Verification Protocol</p>
                  </div>
                  <Badge tone="cyan" variant="subtle" size="sm" className="font-mono">
                    {completedLotoCount}/6 Verified
                  </Badge>
                </div>

                {/* OSHA Progression Stepper */}
                <div className="py-2 border-b border-[#27272A]">
                  <Steps
                    steps={oshaStepsDefinition}
                    current={currentStepIndex}
                    className="scale-90 origin-left"
                  />
                </div>

                {/* Asset Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1.5">Target Equipment Asset</label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-[#141518] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22D3EE] transition-colors"
                  >
                    <option value="Vestas V112 Nacelle Pitch System">Vestas V112 Nacelle Pitch System</option>
                    <option value="Hydraulic HPU-350 Primary Loop">Hydraulic HPU-350 Primary Loop</option>
                    <option value="Siemens SGT-400 Gas Turbine">Siemens SGT-400 Gas Turbine</option>
                  </select>
                </div>

                {/* Energy Hazard Tabs */}
                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1.5">Hazardous Energy Source</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setEnergyType("hydraulic")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        energyType === "hydraulic"
                          ? "bg-[#24252B] border-[#22D3EE] text-white"
                          : "bg-[#141518] border-[#27272A] text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      Hydraulic (210 bar)
                    </button>
                    <button
                      onClick={() => setEnergyType("electrical")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        energyType === "electrical"
                          ? "bg-[#24252B] border-[#FBBF24] text-white"
                          : "bg-[#141518] border-[#27272A] text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      Electrical (480V)
                    </button>
                    <button
                      onClick={() => setEnergyType("mechanical")}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-center ${
                        energyType === "mechanical"
                          ? "bg-[#24252B] border-[#8B5CF6] text-white"
                          : "bg-[#141518] border-[#27272A] text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      Mechanical
                    </button>
                  </div>
                </div>

                {/* Interactive LOTO Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#9CA3AF]">
                    <span>Mandatory Isolation Sequence</span>
                    <span className="text-[10px] font-mono text-amber-400">Strict Order</span>
                  </div>

                  {lotoSteps.map((step) => (
                    <div
                      key={step.id}
                      onClick={() => toggleLotoStep(step.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        step.checked
                          ? "bg-emerald-950/15 border-emerald-500/30 text-white"
                          : "bg-[#141518] border-[#27272A] text-[#9CA3AF] hover:border-[#3A3B43]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${
                            step.checked ? "bg-emerald-500 text-black font-bold" : "border border-[#27272A] text-[#9CA3AF]"
                          }`}
                        >
                          {step.checked ? <Check className="w-3 h-3" /> : step.id}
                        </div>
                        <div className="text-xs">
                          <div className={`font-semibold ${step.checked ? "text-white" : "text-[#D1D5DB]"}`}>
                            {step.title}
                          </div>
                          <div className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PPE Mandatory Equipment */}
                <div className="bg-[#141518] border border-[#27272A] rounded-xl p-3 space-y-2">
                  <span className="text-[11px] font-medium text-[#9CA3AF] block mb-1">
                    Mandatory PPE Checklist (OSHA 1910 Subpart I)
                  </span>
                  <div className="space-y-1.5">
                    {ppeItems.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => togglePpeItem(item.id)}
                          className="w-3.5 h-3.5 rounded bg-[#18181A] border-[#27272A] accent-[#22D3EE]"
                        />
                        <span className={item.checked ? "text-white" : "text-[#6B7280]"}>{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Stamp>

            {/* Zero-Energy Status Pill */}
            <div className="pt-3 border-t border-[#27272A]">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                  isZeroEnergyCertified
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-950/20 border-amber-500/30 text-amber-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isZeroEnergyCertified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>
                    {isZeroEnergyCertified
                      ? "Zero-Energy Verified (Ready for Servicing)"
                      : "Zero-Energy Pending Verification"}
                  </span>
                </div>
                <Badge
                  tone={isZeroEnergyCertified ? "emerald" : "amber"}
                  variant="solid"
                  size="sm"
                  className="font-mono"
                >
                  {isZeroEnergyCertified ? "PASS" : "INTERLOCKED"}
                </Badge>
              </div>
            </div>
          </section>

          {/* Right Island: Interlock Registry, OEM Bulletins, and Permits */}
          <section className="flex-1 bg-[#18181A] rounded-[24px] border border-[#27272A] p-5 flex flex-col overflow-hidden">
            {/* Header with LiquidTabs */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div>
                <LiquidTabs
                  label="Safety Views"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  tabs={rightTabs}
                  size="sm"
                />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B7280]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search safety records..."
                  className="bg-[#141518] border border-[#27272A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#22D3EE] transition-colors"
                />
              </div>
            </div>

            {/* Content Based on Active Tab */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mt-3 space-y-3">
              {activeTab === "interlocks" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#141518] border border-[#27272A]">
                    <div className="flex items-center justify-between mb-2">
                      <Badge tone="amber" variant="subtle" size="sm" className="font-mono font-bold">
                        CRITICAL SAFETY INTERLOCK #INT-480-ACB
                      </Badge>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">OKF: lockout_tagout_hydraulics.md</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Main Nacelle 480V ACB Energy Isolation Gate</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                      Requires padlocking main air circuit breaker in open position before opening proportional valve manifold housing. Interlocked via deterministic AST rule.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#141518] border border-[#27272A]">
                    <div className="flex items-center justify-between mb-2">
                      <Badge tone="cyan" variant="subtle" size="sm" className="font-mono font-bold">
                        HYDRAULIC PRESSURE BLEED #INT-HYD-02
                      </Badge>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">OKF: proportional_relief_valve_v2.md</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Proportional Relief Valve Accumulator Depressurization</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                      Accumulator pressure must drop below 5 PSI on manifold gauge G-01 before loosening collar bolts. Calibrated torque wrench required upon reassembly (45 Nm).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#141518] border border-[#27272A]">
                    <div className="flex items-center justify-between mb-2">
                      <Badge tone="purple" variant="subtle" size="sm" className="font-mono font-bold">
                        ARC FLASH GATE #INT-ARC-LVL2
                      </Badge>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">OKF: arc_flash_ppe_level2.md</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Pitch Control PCB Bus Capacitor Isolation</h4>
                    <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                      Capacitors retain lethal 600V DC charge for 10 minutes following main breaker trip. Mandatory 10-minute wait and multimeter zero-voltage check before panel access.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "permits" && (
                <div className="space-y-2.5">
                  {permits.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPermitForView(p)}
                      className="p-3.5 rounded-2xl bg-[#141518] hover:bg-[#1E1F24] border border-[#27272A] hover:border-[#3A3B43] transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">{p.id}</span>
                          <Badge tone="emerald" variant="subtle" size="sm" className="font-mono text-[9px]">
                            {p.status}
                          </Badge>
                        </div>
                        <div className="text-white font-semibold">{p.asset}</div>
                        <div className="text-[10px] font-mono text-[#9CA3AF]">
                          Technician: {p.technician} ({p.badgeId}) • {p.energyType}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-[#6B7280] block">{p.issuedAt}</span>
                        <span className="text-xs text-[#22D3EE] font-medium hover:underline inline-flex items-center gap-1 mt-1">
                          View Details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "bulletins" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-[#141518] border border-[#27272A]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#9CA3AF] mb-1">
                      <span>VESTAS WIND SYSTEMS A/S</span>
                      <Badge tone="emerald" variant="subtle" size="sm">
                        COMPLIANT (REV 4.2)
                      </Badge>
                    </div>
                    <h4 className="font-bold text-white text-sm">V112 Nacelle Pitch Hydraulics Maintenance Standard</h4>
                    <p className="text-[#9CA3AF] mt-1 text-[11px]">
                      Mandates dual mechanical lock on pitch cylinder during hub entry. Validated by H. Bauer, Certified Safety Professional.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#141518] border border-[#27272A]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#9CA3AF] mb-1">
                      <span>PARKER HANNIFIN</span>
                      <Badge tone="emerald" variant="subtle" size="sm">
                        COMPLIANT (TECHBUL-2026A)
                      </Badge>
                    </div>
                    <h4 className="font-bold text-white text-sm">D1FP Proportional Valve Torquing & Seal Integrity Bulletin</h4>
                    <p className="text-[#9CA3AF] mt-1 text-[11px]">
                      Hex collar torque specification calibrated at 45 Nm with Viton fluoroelastomer O-rings only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Issue Digital LOTO Permit Modal with SignaturePad */}
      {showPermitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181A] border border-[#27272A] rounded-[24px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A] mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Issue Digital LOTO Isolation Permit</h3>
              </div>
              <button
                onClick={() => setShowPermitModal(false)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssuePermit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Equipment Asset</label>
                <input
                  type="text"
                  value={selectedAsset}
                  disabled
                  className="w-full bg-[#141518] border border-[#27272A] rounded-xl px-3 py-2 text-white font-medium opacity-80"
                />
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Technician Name</label>
                <input
                  type="text"
                  value={newTechnicianName}
                  onChange={(e) => setNewTechnicianName(e.target.value)}
                  required
                  className="w-full bg-[#141518] border border-[#27272A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#22D3EE]"
                />
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Technician Safety Badge ID</label>
                <input
                  type="text"
                  value={newBadgeId}
                  onChange={(e) => setNewBadgeId(e.target.value)}
                  required
                  className="w-full bg-[#141518] border border-[#27272A] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#22D3EE]"
                />
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Master Lock Padlock Serial #</label>
                <input
                  type="text"
                  value={newPadlockSerial}
                  onChange={(e) => setNewPadlockSerial(e.target.value)}
                  required
                  className="w-full bg-[#141518] border border-[#27272A] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#22D3EE]"
                />
              </div>

              {/* Hairline Signature Pad for Technician Sign-off */}
              <div className="pt-2">
                <SignaturePad
                  label="Technician Safety Permittee Signature"
                  ink="#22D3EE"
                  onSign={(res: SignatureResult) => {
                    setTechnicianSignature(res.dataUrl || res.svg);
                  }}
                  onClear={() => setTechnicianSignature("")}
                />
              </div>

              <div className="p-3 bg-[#141518] rounded-xl border border-[#27272A] text-[#9CA3AF] text-[11px]">
                By issuing this digital permit and signing above, you certify under OSHA 1910.147 that all hazardous energy sources have been mechanically isolated, padlocked, and depressurized.
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowPermitModal(false)}
                  className="px-4 py-2 rounded-full bg-[#1E1F24] hover:bg-[#25262E] text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize & Issue Permit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Permit Modal */}
      {selectedPermitForView && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181A] border border-[#27272A] rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A] mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Digital LOTO Permit Record</h3>
              </div>
              <button
                onClick={() => setSelectedPermitForView(null)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs bg-[#141518] p-4 rounded-2xl border border-[#27272A]">
              <div className="flex justify-between border-b border-[#27272A] pb-2">
                <span className="text-[#9CA3AF]">PERMIT ID:</span>
                <span className="text-cyan-400 font-bold">{selectedPermitForView.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">ASSET:</span>
                <span className="text-white">{selectedPermitForView.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">TECHNICIAN:</span>
                <span className="text-white">
                  {selectedPermitForView.technician} ({selectedPermitForView.badgeId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">ENERGY SOURCE:</span>
                <span className="text-amber-400">{selectedPermitForView.energyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">TIMESTAMP:</span>
                <span className="text-white">{selectedPermitForView.issuedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">INTERLOCK STATUS:</span>
                <span className="text-emerald-400 font-bold">{selectedPermitForView.status}</span>
              </div>
              {selectedPermitForView.signature && (
                <div className="pt-2 border-t border-[#27272A]">
                  <span className="text-[10px] text-[#9CA3AF] block mb-1">ATTACHED SIGNATURE:</span>
                  <img
                    src={selectedPermitForView.signature}
                    alt="Permittee Signature"
                    className="h-12 bg-black/40 rounded border border-[#27272A] p-1"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPermitForView(null)}
                className="px-4 py-2 rounded-full bg-[#1E1F24] hover:bg-[#25262E] text-white text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-full bg-[#22D3EE] hover:bg-[#06B6D4] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Permit Placard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
