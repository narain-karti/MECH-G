import React, { useState, useEffect } from "react";
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from "lucide-react";
import { MachineIssue, NotebookService } from "../../services/notebookService";

interface MachineIssueTrackerPanelProps {
  notebookId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onTroubleshoot?: (issue: MachineIssue) => void;
}

export const MachineIssueTrackerPanel: React.FC<MachineIssueTrackerPanelProps> = ({
  notebookId,
  isCollapsed = false,
  onToggleCollapse,
  onTroubleshoot,
}) => {
  const [issues, setIssues] = useState<MachineIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New issue form fields
  const [title, setTitle] = useState("");
  const [component, setComponent] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [defect, setDefect] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical" | "warning">("critical");
  const [torque, setTorque] = useState("");
  const [creating, setCreating] = useState(false);

  const loadIssues = async () => {
    if (!notebookId) return;
    setLoading(true);
    try {
      const data = await NotebookService.listIssues(notebookId);
      setIssues(data);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [notebookId]);

  const handleToggleStatus = async (issue: MachineIssue) => {
    const nextStatus = issue.status === "fixed" || issue.status === "resolved" ? "open" : "fixed";
    try {
      const updated = await NotebookService.updateIssue(notebookId, issue.id, {
        status: nextStatus,
        technician_id: issue.technician_id || "TECH-8842-OFFSHORE",
      });
      setIssues((prev) => prev.map((item) => (item.id === issue.id ? { ...item, ...updated } : item)));
    } catch (err) {
      console.error("Failed to update issue status:", err);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      await NotebookService.deleteIssue(notebookId, issueId);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;

    setCreating(true);
    try {
      const created = await NotebookService.createIssue(notebookId, {
        title,
        component,
        part_number: partNumber,
        defect,
        severity,
        verified_torque: torque,
        status: "open",
        technician_id: "TECH-8842-OFFSHORE",
      });
      setIssues((prev) => [created, ...prev]);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error("Failed to log issue:", err);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setComponent("");
    setPartNumber("");
    setDefect("");
    setSeverity("critical");
    setTorque("");
  };

  const openIssues = issues.filter((i) => i.status !== "fixed" && i.status !== "resolved");
  const fixedIssues = issues.filter((i) => i.status === "fixed" || i.status === "resolved");

  if (isCollapsed) {
    return (
      <div className="h-full w-12 bg-[#121214] border-l border-[#27272A] flex flex-col items-center py-4 select-none">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg text-[#71717A] hover:text-white hover:bg-[#18181A] flex items-center justify-center transition-colors mb-4"
          title="Expand Issues"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          className="flex-1 flex flex-col items-center justify-center gap-6 cursor-pointer"
          onClick={onToggleCollapse}
        >
          <div className="rotate-90 whitespace-nowrap text-xs font-mono font-bold tracking-wider text-[#A1A1AA] flex items-center gap-2">
            <span>DEFECT REGISTER</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#121214] flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#27272A] flex items-center justify-between bg-[#18181A]/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Equipment Defect Register
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {openIssues.length} OPEN
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 text-[11px] font-semibold transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Log Defect</span>
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-6 h-6 rounded-md text-[#71717A] hover:text-white hover:bg-[#27272A] flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add Issue Form Inline */}
      {showAddForm && (
        <form onSubmit={handleCreateIssue} className="p-3.5 bg-[#18181A] border-b border-[#27272A] space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
              New Defect Entry
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#71717A] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            required
            placeholder="Issue title (e.g. PRV-992-B Seal Weepage)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Component name"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="w-full bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
            />
            <input
              type="text"
              placeholder="Part number (PRV-992-B)"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className="w-full bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#22D3EE]/50"
            >
              <option value="critical">Critical (Immediate LOTO)</option>
              <option value="warning">Warning (Degraded)</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="text"
              placeholder="Torque Spec (35 Nm)"
              value={torque}
              onChange={(e) => setTorque(e.target.value)}
              className="w-full bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
            />
          </div>

          <textarea
            rows={2}
            placeholder="Observed defect symptoms, pressure or vibration readings..."
            value={defect}
            onChange={(e) => setDefect(e.target.value)}
            className="w-full bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 rounded text-xs text-[#71717A] hover:bg-[#27272A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-3 py-1 rounded bg-[#22D3EE] text-[#0B0B0C] text-xs font-bold hover:brightness-110 disabled:opacity-50"
            >
              {creating ? "Logging..." : "Log Defect"}
            </button>
          </div>
        </form>
      )}

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs font-mono text-[#71717A]">
            Loading machine issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-[#27272A] rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-white">No active defects logged</p>
            <p className="text-[11px] text-[#71717A] mt-1">
              Machine is currently operating within nominal OEM tolerances.
            </p>
          </div>
        ) : (
          issues.map((issue) => {
            const isFixed = issue.status === "fixed" || issue.status === "resolved";
            const isCritical = issue.severity === "critical";

            return (
              <div
                key={issue.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isFixed
                    ? "bg-[#18181A]/30 border-[#27272A]/50 opacity-75"
                    : "bg-[#18181A] border-[#27272A] hover:border-[#3F3F46]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(issue)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                        isFixed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : isCritical
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                      title="Click to toggle OPEN / FIXED"
                    >
                      {isFixed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FIXED</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>OPEN</span>
                        </>
                      )}
                    </button>

                    {issue.component && (
                      <span className="text-[11px] font-mono text-[#A1A1AA]">
                        {issue.component}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteIssue(issue.id)}
                    className="text-[#71717A] hover:text-rose-400 transition-colors p-1"
                    title="Remove issue"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <h4
                  className={`text-xs font-bold mb-1.5 ${
                    isFixed ? "line-through text-[#71717A]" : "text-white"
                  }`}
                >
                  {issue.title}
                </h4>

                {issue.defect && (
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-2.5">
                    {issue.defect}
                  </p>
                )}

                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#27272A]/50 text-[10px] font-mono">
                  {issue.verified_torque && (
                    <span className="px-2 py-0.5 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 flex items-center gap-1">
                      <Wrench className="w-2.5 h-2.5" />
                      {issue.verified_torque}
                    </span>
                  )}
                  {issue.part_number && (
                    <span className="px-2 py-0.5 rounded bg-[#27272A] text-[#E4E4E7]">
                      PN: {issue.part_number}
                    </span>
                  )}
                  {issue.citation_anchor && (
                    <span className="px-2 py-0.5 rounded bg-[#27272A] text-cyan-400">
                      Ref: {issue.citation_anchor}
                    </span>
                  )}
                </div>

                {/* Troubleshoot with Gemma action */}
                {onTroubleshoot && !isFixed && (
                  <button
                    onClick={() => onTroubleshoot(issue)}
                    className="mt-2.5 w-full py-1.5 px-2.5 rounded-xl bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#22D3EE]/20"
                  >
                    <Sparkles className="w-3 h-3 text-[#22D3EE]" />
                    <span>Troubleshoot Defect in Chat</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
