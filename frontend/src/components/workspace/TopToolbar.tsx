import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Share2,
  Settings as SettingsIcon,
  Plus,
  ChevronDown,
  Layers,
  Wrench,
  ShieldAlert,
  UploadCloud,
  Sparkles,
  Check,
  HelpCircle,
  Bell,
  X,
  ListCheck
} from "lucide-react";
import { useTour } from "../../context/TourContext";
import { LiquidTabs, LiquidTab } from "../ui/liquid-tabs";
import { NotificationBell } from "../ui/notification-bell";
import { Badge } from "../ui/badge";
import { OnboardingChecklist, OnboardingTask } from "../ui/onboarding-checklist";

interface TopToolbarProps {
  title?: string;
  sourceCount?: number;
  onNewChat?: () => void;
  activeModule?: "workspace" | "diagnostics" | "graph" | "safety" | "ingest";
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  title = "MECH-G Master Documentation",
  onNewChat,
  activeModule: propActiveModule,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startTour } = useTour();
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Automatically detect active module if not explicitly provided
  const activeModule =
    propActiveModule ||
    (location.pathname.startsWith("/diagnostic")
      ? "diagnostics"
      : location.pathname.startsWith("/graph")
      ? "graph"
      : location.pathname.startsWith("/safety")
      ? "safety"
      : location.pathname.startsWith("/ingest")
      ? "ingest"
      : "workspace");

  const [alerts, setAlerts] = useState([
    {
      id: "a1",
      title: "OSHA 1910.147 Interlock Active",
      message: "Vestas V112 Pitch System hydraulic loop locked out by TECH-8842.",
      time: "10m ago",
      type: "safety",
    },
    {
      id: "a2",
      title: "OKF Knowledge Graph Updated",
      message: "11 discrete component nodes and 6 AST directed edges verified.",
      time: "24m ago",
      type: "graph",
    },
    {
      id: "a3",
      title: "Gemma 4 Multimodal Ready",
      message: "Local edge vision and text telemetry orchestrator online.",
      time: "1h ago",
      type: "system",
    },
  ]);

  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    {
      id: "t1",
      title: "Review Knowledge Workspace",
      description: "Ask Gemma about component schemas, torque specs, or troubleshooting steps.",
      done: true,
      action: {
        label: "Open Workspace",
        onClick: () => navigate("/workspace"),
      },
    },
    {
      id: "t2",
      title: "Run Field Diagnostic Evaluation",
      description: "Upload optical imagery or acoustic noise and trigger Gemma's diagnostic engine.",
      done: false,
      action: {
        label: "Open Diagnostics",
        onClick: () => navigate("/diagnostics"),
      },
    },
    {
      id: "t3",
      title: "Verify OSHA 1910.147 LOTO Gate",
      description: "Perform zero-energy checklist and digitally sign an equipment isolation permit.",
      done: false,
      action: {
        label: "Open Safety",
        onClick: () => navigate("/safety"),
      },
    },
    {
      id: "t4",
      title: "Inspect OKF Directed Topology",
      description: "Explore the interactive React Flow mindmap and verified citation provenance.",
      done: false,
      action: {
        label: "Open Graph",
        onClick: () => navigate("/graph"),
      },
    },
  ]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navTabs: LiquidTab[] = [
    {
      value: "workspace",
      label: "Workspace",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />,
    },
    {
      value: "diagnostics",
      label: "Diagnostics",
      icon: <Wrench className="w-3.5 h-3.5 text-[#FBBF24]" />,
    },
    {
      value: "graph",
      label: "Graph",
      icon: <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />,
    },
    {
      value: "safety",
      label: "Safety",
      icon: <ShieldAlert className="w-3.5 h-3.5 text-[#FB7185]" />,
    },
    {
      value: "ingest",
      label: "Ingest",
      icon: <UploadCloud className="w-3.5 h-3.5 text-[#34D399]" />,
    },
  ];

  return (
    <header className="h-[52px] bg-[#0B0B0C] px-4 flex items-center justify-between z-20 select-none border-b border-[#18181A]">
      {/* Left: Brand Icon & Master Documentation Title */}
      <div className="flex items-center gap-3">
        <Link to="/workspace" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#3B82F6] via-[#22D3EE] to-[#8B5CF6] p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-[#0B0B0C] rounded-full flex items-center justify-center group-hover:bg-[#141720] transition-colors">
              <span className="text-[11px] font-black tracking-tighter text-[#22D3EE]">M</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] font-semibold text-white tracking-tight hover:text-[#22D3EE] transition-colors">
              {title}
            </h1>
            <Badge tone="cyan" variant="subtle" size="sm" className="font-mono">
              MECH-G
            </Badge>
          </div>
        </Link>
      </div>

      {/* Center: LiquidTabs Navigation */}
      <div className="hidden md:flex items-center">
        <LiquidTabs
          label="MECH-G Navigation"
          value={activeModule}
          onValueChange={(val) => {
            navigate(val === "workspace" ? "/workspace" : `/${val}`);
          }}
          tabs={navTabs}
          size="sm"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Switch Views Dropdown for Mobile / Compact Screens */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowNavMenu(!showNavMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#9CA3AF] hover:text-white hover:bg-[#1E1F24] transition-colors border border-[#27272A]"
          >
            <span>Modules</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showNavMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#18181A] border border-[#27272A] rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in">
              {navTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    navigate(tab.value === "workspace" ? "/workspace" : `/${tab.value}`);
                    setShowNavMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                    activeModule === tab.value ? "bg-[#24252B] text-white" : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Onboarding Checklist Button */}
        <button
          onClick={() => setShowChecklist(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-[#E5E7EB] hover:text-white hover:bg-[#1E1F24] border border-[#27272A] transition-colors shadow-sm cursor-pointer"
          title="Onboarding & Setup Checklist"
        >
          <ListCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span className="hidden sm:inline">Checklist</span>
        </button>

        {/* + New Session */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-[#E5E7EB] hover:text-white hover:bg-[#1E1F24] border border-[#27272A] transition-colors shadow-sm cursor-pointer"
          title="Start fresh conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Session</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-[#E5E7EB] hover:text-white hover:bg-[#1E1F24] border border-[#27272A] transition-colors cursor-pointer"
          title="Copy link to clipboard"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
        </button>

        {/* Tour / Guide Button */}
        <button
          onClick={startTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-[#22D3EE] hover:text-white bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 transition-all cursor-pointer"
          title="Start interactive walkthrough"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Tour</span>
        </button>

        {/* Hairline UI Notification Bell with Rolling Badge */}
        <div className="relative">
          <NotificationBell
            count={alerts.length}
            size={36}
            onClick={() => setShowAlerts(!showAlerts)}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          />

          {/* Floating Alerts Flyout */}
          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-[#18181A] border border-[#27272A] rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#22D3EE]" />
                  System & Safety Interlocks
                </span>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-[#9CA3AF] hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-xl bg-[#141518] border border-[#27272A] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-[11px]">{alert.title}</span>
                      <span className="text-[10px] font-mono text-[#6B7280]">{alert.time}</span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#27272A] flex justify-between items-center text-[10px]">
                <button
                  onClick={() => setAlerts([])}
                  className="text-[#9CA3AF] hover:text-white cursor-pointer"
                >
                  Clear all notifications
                </button>
                <span className="text-emerald-400 font-mono">Telemetry sync: Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#1E1F24] transition-colors border border-transparent hover:border-[#27272A] cursor-pointer"
          title="MECH-G System Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* MECH-G Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white shadow-sm ml-1">
          M
        </div>
      </div>

      {/* Onboarding Checklist Modal */}
      {showChecklist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181A] border border-[#27272A] rounded-[24px] p-6 shadow-2xl relative">
            <button
              onClick={() => setShowChecklist(false)}
              className="absolute top-5 right-5 text-[#9CA3AF] hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <OnboardingChecklist
              title="MECH-G Field Engineering Checklist"
              tasks={onboardingTasks}
              onTaskComplete={(id) => {
                setOnboardingTasks((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
                );
              }}
              onDismiss={() => setShowChecklist(false)}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181A] border border-[#27272A] rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
                MECH-G Workspace Configuration
              </h3>
              <span className="text-[10px] font-mono text-[#9CA3AF] bg-[#232326] px-2 py-0.5 rounded">
                v2.4
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Active Multimodal Model</label>
                <div className="text-white font-mono bg-[#1E1F23] border border-[#2E3036] rounded-xl px-3 py-2">
                  gemma-4-26b-a4b-it (Official Google Gemma 4 Multimodal)
                </div>
              </div>
              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Knowledge Graph Engine</label>
                <div className="text-white font-mono bg-[#1E1F23] border border-[#2E3036] rounded-xl px-3 py-2">
                  NetworkX Directed Graph + SQLite Provenance
                </div>
              </div>
              <div>
                <label className="block text-[#9CA3AF] mb-1 font-medium">Safety Interlock Standards</label>
                <div className="text-white font-mono bg-[#1E1F23] border border-[#2E3036] rounded-xl px-3 py-2">
                  OSHA 1910.147 LOTO + Zero-Energy Verification Gate
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-1.5 rounded-full bg-[#232326] hover:bg-[#2A2A2F] text-white text-xs font-medium border border-[#2E2E33] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
