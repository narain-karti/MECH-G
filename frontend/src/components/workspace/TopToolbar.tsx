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
  ListCheck,
  FolderKanban,
  Home,
  Cpu,
} from "lucide-react";
import { useTour } from "../../context/TourContext";
import { LiquidTabs, LiquidTab } from "../ui/liquid-tabs";
import { NotificationBell } from "../ui/notification-bell";
import { Badge } from "../ui/badge";
import { OnboardingChecklist, OnboardingTask } from "../ui/onboarding-checklist";

interface TopToolbarProps {
  title?: string;
  notebookModel?: string;
  sourceCount?: number;
  onNewChat?: () => void;
  activeModule?: "home" | "notebooks" | "workspace" | "diagnostics" | "graph" | "safety" | "ingest";
  onOpenUpload?: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  title = "MECH-G Master Documentation",
  notebookModel,
  onNewChat,
  activeModule: propActiveModule,
  onOpenUpload,
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
    (location.pathname === "/"
      ? "home"
      : location.pathname.startsWith("/notebooks")
      ? "notebooks"
      : location.pathname.startsWith("/diagnostic")
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
        onClick: () => navigate("/notebooks"),
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
      value: "home",
      label: "Home",
      icon: <Home className="w-3.5 h-3.5 text-[#22D3EE]" />,
    },
    {
      value: "notebooks",
      label: "Equipment",
      icon: <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      value: "workspace",
      label: "Machine Chat",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />,
    },
    {
      value: "diagnostics",
      label: "Field Diagnostic",
      icon: <Wrench className="w-3.5 h-3.5 text-[#FBBF24]" />,
    },
  ];

  return (
    <header className="h-[52px] bg-[#0B0B0C] px-4 flex items-center justify-between z-20 select-none border-b border-[#18181A]">
      {/* Left: Brand Icon & Breadcrumb Context */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#22D3EE] to-[#8B5CF6] p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-[#0B0B0C] rounded-lg flex items-center justify-center group-hover:bg-[#141720] transition-colors">
              <span className="text-[11px] font-black tracking-tighter text-[#22D3EE]">M</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider text-white hidden sm:inline">
              MECH-G
            </span>
            <span className="text-xs text-[#71717A] hidden sm:inline">/</span>
            <h1 className="text-xs sm:text-sm font-semibold text-white tracking-tight hover:text-[#22D3EE] transition-colors max-w-[220px] sm:max-w-xs truncate">
              {title}
            </h1>
            {notebookModel && (
              <Badge tone="primary" size="sm" className="font-mono text-[10px]">
                {notebookModel}
              </Badge>
            )}
          </div>
        </Link>
      </div>

      {/* Center: LiquidTabs Navigation */}
      <div className="hidden lg:flex items-center">
        <LiquidTabs
          label="MECH-G Navigation"
          value={activeModule}
          onValueChange={(val) => {
            if (val === "home") navigate("/");
            else if (val === "notebooks") navigate("/notebooks");
            else if (val === "workspace") navigate("/notebook/nb-vestas-v112");
            else navigate(`/${val}`);
          }}
          tabs={navTabs}
          size="sm"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Nav Dropdown for Mobile */}
        <div className="relative lg:hidden">
          <button
            onClick={() => setShowNavMenu(!showNavMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#9CA3AF] hover:text-white hover:bg-[#1E1F24] transition-colors border border-[#27272A]"
          >
            <span>Nav</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showNavMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#18181A] border border-[#27272A] rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in">
              {navTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    if (tab.value === "home") navigate("/");
                    else if (tab.value === "notebooks") navigate("/notebooks");
                    else if (tab.value === "workspace") navigate("/notebook/nb-vestas-v112");
                    else navigate(`/${tab.value}`);
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

        {/* Upload Manual CTA if in workspace */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-[#22D3EE] hover:text-white bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 transition-all cursor-pointer"
            title="Upload Manual / PDF to this machine"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Manual</span>
          </button>
        )}

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
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#1E1F24] rounded-full transition-colors cursor-pointer"
            title="System Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-64 bg-[#18181A] border border-[#27272A] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <span className="text-xs font-bold text-white">System Runtime</span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF]">Edge Model</span>
                  <span className="text-white font-mono text-[11px]">Gemma 4 (26B)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF]">Graph Mode</span>
                  <span className="text-cyan-400 font-mono text-[11px]">In-Memory AST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9CA3AF]">OSHA Interlock</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Enforced</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Checklist Modal */}
      {showChecklist && (
        <div className="fixed bottom-4 right-4 z-50 w-96">
          <OnboardingChecklist
            tasks={onboardingTasks}
            onDismiss={() => setShowChecklist(false)}
            onTaskComplete={(id) => {
              setOnboardingTasks((prev) =>
                prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
              );
            }}
          />
        </div>
      )}
    </header>
  );
};
