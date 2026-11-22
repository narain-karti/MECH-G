import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  Plus,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  UploadCloud,
  X,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { Folder, FolderFile } from "../components/ui/folder";
import { NumberRoll } from "../components/ui/number-roll";
import { EquipmentNotebook, NotebookService } from "../services/notebookService";
import { DocumentService } from "../services/documentService";

const CATEGORIES = [
  "All",
  "Wind Energy",
  "Turbomachinery",
  "Heavy Mining",
  "Hydraulics",
];

export const NotebookGalleryPage: React.FC = () => {
  const navigate = useNavigate();

  const [notebooks, setNotebooks] = useState<EquipmentNotebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("Wind Energy");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const loadNotebooks = async () => {
    setLoading(true);
    try {
      const data = await NotebookService.listNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error("Failed to load equipment notebooks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotebooks();
  }, []);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const created = await NotebookService.createNotebook({
        title,
        model,
        category,
        location,
        description,
        status: "operational",
      });

      // Upload directly into the newly-created notebook. The ingest endpoint
      // compiles the file to OKF and persists the notebook/document link.
      for (const file of droppedFiles) {
        try {
          await DocumentService.uploadDocument(file, created.id);
        } catch (uploadErr) {
          console.warn("Failed to attach initial file:", uploadErr);
        }
      }

      setShowCreateModal(false);
      resetModal();
      navigate(`/notebook/${created.id}`);
    } catch (err) {
      console.error("Failed to create notebook:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setTitle("");
    setModel("");
    setCategory("Wind Energy");
    setLocation("");
    setDescription("");
    setDroppedFiles([]);
  };

  // KPI Calculations
  const totalMachines = notebooks.length;
  const openIssuesCount = notebooks.reduce((acc, nb) => acc + (nb.open_issue_count || 0), 0);
  const resolvedIssuesCount = notebooks.reduce(
    (acc, nb) => acc + Math.max(0, (nb.issue_count || 0) - (nb.open_issue_count || 0)),
    0
  );
  const degradedCount = notebooks.filter((nb) => nb.status === "degraded" || nb.status === "maintenance").length;

  const filteredNotebooks = notebooks.filter((nb) => {
    const matchesCat = selectedCategory === "All" || nb.category === selectedCategory;
    const matchesQuery =
      nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nb.model && nb.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (nb.location && nb.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Helper to generate sample sheets for Hairline Folder
  const getFolderFiles = (nb: EquipmentNotebook): FolderFile[] => {
    return [
      { id: `${nb.id}-f1`, name: "OEM Field Manual.pdf" },
      { id: `${nb.id}-f2`, name: "Hydraulic Schematics.pdf" },
      { id: `${nb.id}-f3`, name: "OSHA LOTO Checklist.pdf" },
    ];
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0B0C] text-[#E4E4E7] flex flex-col font-sans selection:bg-[#22D3EE]/20 selection:text-[#22D3EE]">
      {/* Top Navigation */}
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
                  Notebooks
                </span>
              </span>
              <span className="text-[10px] text-[#A1A1AA] tracking-tight">Industrial Fleet Management</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-[#A1A1AA]">
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181A] transition-colors">
              Overview
            </Link>
            <Link
              to="/notebooks"
              className="px-3 py-1.5 rounded-lg text-white bg-[#18181A] border border-[#27272A] transition-colors"
            >
              Equipment Notebooks
            </Link>
            <Link
              to="/diagnostics"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181A] transition-colors"
            >
              Diagnostics
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] text-[#0B0B0C] font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/10 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Machine Notebook</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Fleet KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-[#121214] border border-[#27272A] shadow-xl">
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#18181A]/60 border border-[#27272A]/50">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-white">
                <NumberRoll value={totalMachines} />
              </div>
              <div className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide">
                Total Machinery
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#18181A]/60 border border-[#27272A]/50">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-amber-400">
                <NumberRoll value={degradedCount} />
              </div>
              <div className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide">
                Active LOTO / Service
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#18181A]/60 border border-[#27272A]/50">
            <div className="w-10 h-10 rounded-xl bg-rose-400/10 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-rose-400">
                <NumberRoll value={openIssuesCount} />
              </div>
              <div className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide">
                Open Defects
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#18181A]/60 border border-[#27272A]/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                <NumberRoll value={resolvedIssuesCount} />
              </div>
              <div className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide">
                Verified Fixes
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#22D3EE] text-[#0B0B0C] font-semibold shadow-md shadow-cyan-500/10"
                    : "bg-[#18181A] text-[#A1A1AA] border border-[#27272A] hover:text-white hover:border-[#3F3F46]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search machinery, model, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181A] border border-[#27272A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50 transition-colors"
            />
          </div>
        </div>

        {/* Notebook Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs font-mono text-[#71717A]">
            <Radio className="w-4 h-4 text-cyan-400 animate-spin mr-2" />
            Loading industrial equipment notebooks...
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#27272A] rounded-3xl p-8 text-center">
            <Cpu className="w-12 h-12 text-[#3F3F46] mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No machinery notebooks found</h4>
            <p className="text-xs text-[#71717A] max-w-sm mb-6">
              Create an equipment-scoped notebook to organize technical manuals, schematics, and grounded diagnostic chat.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-[#22D3EE] text-[#0B0B0C] text-xs font-bold hover:brightness-110 transition-all"
            >
              + Create Machine Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((nb) => {
              const statusColor =
                nb.status === "operational"
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
                  : nb.status === "degraded"
                  ? "bg-amber-400/10 text-amber-400 border-amber-400/30"
                  : "bg-rose-400/10 text-rose-400 border-rose-400/30";

              return (
                <div
                  key={nb.id}
                  onClick={() => navigate(`/notebook/${nb.id}`)}
                  className="p-6 rounded-3xl bg-[#121214] border border-[#27272A] hover:border-[#22D3EE]/50 transition-all cursor-pointer flex flex-col justify-between group shadow-xl hover:shadow-cyan-500/5 relative overflow-hidden"
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${statusColor} font-semibold`}
                      >
                        ● {nb.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">{nb.category}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#22D3EE] transition-colors mb-1 line-clamp-1">
                      {nb.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] mb-4">
                      <span>{nb.model || "MODEL N/A"}</span>
                      <span>·</span>
                      <span>{nb.location || "FIELD STATION"}</span>
                    </div>

                    <p className="text-xs text-[#71717A] line-clamp-2 mb-6 leading-relaxed">
                      {nb.description || "Field documentation and grounded diagnostic workspace."}
                    </p>
                  </div>

                  {/* 3D Hairline Folder Tile */}
                  <div className="flex items-center justify-center py-2 scale-90 -my-2 group-hover:scale-95 transition-transform">
                    <Folder
                      name={nb.title}
                      files={getFolderFiles(nb)}
                      count={nb.source_count || 3}
                      noun="Manuals"
                      color="#18181A"
                      foreground="#22D3EE"
                    />
                  </div>

                  {/* Bottom Stats */}
                  <div className="mt-4 pt-4 border-t border-[#27272A]/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-[#A1A1AA] flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        {nb.source_count || 1} docs
                      </span>
                      <span
                        className={`font-mono font-medium ${
                          (nb.open_issue_count || 0) > 0 ? "text-amber-400" : "text-[#71717A]"
                        }`}
                      >
                        {nb.open_issue_count || 0} open defects
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-[#22D3EE] group-hover:translate-x-0.5 transition-transform">
                      <span>Enter Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Machine Notebook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0C]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181A] border border-[#27272A] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272A] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Equipment Notebook</h3>
                  <p className="text-[11px] text-[#A1A1AA]">Register machine model & service documentation</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#27272A] text-[#71717A] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotebook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Machine Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vestas V112 Nacelle Pitch System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Model Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. V112-3.45MW"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#22D3EE]/50"
                  >
                    <option value="Wind Energy">Wind Energy</option>
                    <option value="Turbomachinery">Turbomachinery</option>
                    <option value="Heavy Mining">Heavy Mining</option>
                    <option value="Hydraulics">Hydraulics</option>
                    <option value="Industrial Power">Industrial Power</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Station / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Offshore Horns Rev 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Subsystems, critical valves, sensors, and operational parameters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#22D3EE]/50"
                />
              </div>

              {/* Initial File Attachment */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Attach Initial Service Manual / PDF
                </label>
                <div className="border border-dashed border-[#27272A] hover:border-[#22D3EE]/40 rounded-xl p-4 text-center cursor-pointer bg-[#121214] relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.md,.txt,.doc"
                    onChange={(e) => {
                      if (e.target.files) {
                        setDroppedFiles(Array.from(e.target.files));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-5 h-5 text-[#71717A] mx-auto mb-1" />
                  <p className="text-[11px] text-[#A1A1AA]">
                    {droppedFiles.length > 0
                      ? `${droppedFiles.length} file(s) selected: ${droppedFiles.map((f) => f.name).join(", ")}`
                      : "Drag & drop PDF / markdown manuals or click to browse"}
                  </p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#22D3EE] text-[#0B0B0C] font-semibold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {submitting ? "Creating..." : "Create & Launch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
