import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Wrench,
  Layers,
  ShieldAlert,
  UploadCloud,
  HelpCircle,
  PlusCircle,
  FileText,
  Lock,
  Cpu
} from "lucide-react";
import { CommandPalette, CommandItem } from "../ui/command-palette";
import { useTour } from "../../context/TourContext";
import { toast } from "../ui/toast-stack";

export const GlobalCommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { startTour } = useTour();

  const commandItems: CommandItem[] = useMemo(() => [
    {
      id: "nav-workspace",
      label: "Open Knowledge Workspace",
      group: "Navigation & Workspaces",
      description: "Gemma 4 NotebookLM 3-panel AST graph workspace",
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      shortcut: ["G", "W"],
      keywords: ["chat", "workspace", "notebook", "gemma", "sources"],
      onSelect: () => navigate("/workspace"),
    },
    {
      id: "nav-diagnostics",
      label: "Open Field Diagnostics Workstation",
      group: "Navigation & Workspaces",
      description: "Multimodal defect diagnosis, telemetry & sensor hub",
      icon: <Wrench className="w-4 h-4 text-amber-400" />,
      shortcut: ["G", "D"],
      keywords: ["diagnose", "defect", "valve", "hardware", "camera"],
      onSelect: () => navigate("/diagnostics"),
    },
    {
      id: "nav-graph",
      label: "Open OKF Knowledge Graph Explorer",
      group: "Navigation & Workspaces",
      description: "Directed NetworkX concept graph and node dependency tree",
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      shortcut: ["G", "G"],
      keywords: ["graph", "nodes", "networkx", "ast", "relations"],
      onSelect: () => navigate("/graph"),
    },
    {
      id: "nav-safety",
      label: "Open Safety Compliance & LOTO",
      group: "Navigation & Workspaces",
      description: "OSHA 1910.147 zero-energy verification & digital permits",
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      shortcut: ["G", "S"],
      keywords: ["safety", "loto", "lockout", "tagout", "osha", "permit"],
      onSelect: () => navigate("/safety"),
    },
    {
      id: "nav-ingest",
      label: "Open OEM Ingestion & Compiler Studio",
      group: "Navigation & Workspaces",
      description: "Compile PDF/DOCX manuals into structured OKF markdown nodes",
      icon: <UploadCloud className="w-4 h-4 text-emerald-400" />,
      shortcut: ["G", "I"],
      keywords: ["upload", "ingest", "compiler", "manuals", "okf"],
      onSelect: () => navigate("/ingest"),
    },
    {
      id: "action-tour",
      label: "Start Interactive Product Tour",
      group: "Interactive Actions",
      description: "Guided 6-step walkthrough across all MECH-G capabilities",
      icon: <HelpCircle className="w-4 h-4 text-cyan-300" />,
      shortcut: ["?"],
      keywords: ["tour", "guide", "help", "walkthrough", "tutorial"],
      onSelect: () => {
        startTour();
        toast.info("Product tour started. Follow the guided spotlight.");
      },
    },
    {
      id: "action-new-chat",
      label: "Start New Workspace Chat Session",
      group: "Interactive Actions",
      description: "Clear conversation thread and start fresh grounded session",
      icon: <PlusCircle className="w-4 h-4 text-blue-400" />,
      shortcut: ["⌘", "N"],
      keywords: ["new", "reset", "clear", "chat"],
      onSelect: () => {
        navigate("/workspace");
        toast.success("Starting fresh conversation thread...");
      },
    },
    {
      id: "action-eval-hardware",
      label: "Run Hardware Diagnostic Test",
      group: "Industrial Operations",
      description: "Evaluate active telemetry with Gemma Multimodal model",
      icon: <Cpu className="w-4 h-4 text-amber-300" />,
      keywords: ["evaluate", "hardware", "pitch", "valve", "test"],
      onSelect: () => {
        navigate("/diagnostics");
      },
    },
    {
      id: "action-issue-permit",
      label: "Authorize Digital LOTO Permit",
      group: "Industrial Operations",
      description: "Issue certified Lockout/Tagout isolation record",
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      keywords: ["permit", "loto", "sign", "authorize"],
      onSelect: () => {
        navigate("/safety");
      },
    },
  ], [navigate, startTour]);

  return (
    <CommandPalette
      items={commandItems}
      hotkey="k"
      showTrigger={false}
      placeholder="Type a command, search modules, or jump to actions... (⌘K)"
    />
  );
};
