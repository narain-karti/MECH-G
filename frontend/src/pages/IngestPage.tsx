import React, { useState, useEffect, useRef, useCallback } from "react";
import { TopToolbar } from "../components/workspace/TopToolbar";
import { useProcessing } from "../context/ProcessingContext";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Layers,
  Database,
  Terminal,
  X,
  FileCheck,
  Check,
  Search,
  Sparkles
} from "lucide-react";
import { DropZone } from "../components/ui/drop-zone";
import { TaskProgress, TaskProgressStatus } from "../components/ui/task-progress";
import { LogStream, LogLine } from "../components/ui/log-stream";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/empty-state";
import { foldAway } from "../components/ui/delete-undo";

interface DocumentItem {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  concepts_count: number;
  node_paths: string[];
  created_at: string;
  error?: string | null;
}

export const IngestPage: React.FC = () => {
  // State
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationStatus, setCompilationStatus] = useState<TaskProgressStatus>("running");
  const [compilationPhase, setCompilationPhase] = useState(0);
  const [compilationStartedAt, setCompilationStartedAt] = useState<number | undefined>(undefined);
  const { setProcessing } = useProcessing();

  useEffect(() => {
    setProcessing(isCompiling, "OmniOKF Compiler parsing and generating knowledge nodes...");
  }, [isCompiling, setProcessing]);
  const [searchFilter, setSearchFilter] = useState("");

  // LogStream records
  const [logLines, setLogLines] = useState<LogLine[]>([
    {
      id: "1",
      at: new Date(Date.now() - 30000),
      level: "info",
      source: "engine",
      message: "OmniOKF Ingestion Engine initialized.",
    },
    {
      id: "2",
      at: new Date(Date.now() - 20000),
      level: "info",
      source: "compiler",
      message: "Ready to process raw OEM manuals, schematics & service bulletins.",
    },
    {
      id: "3",
      at: new Date(Date.now() - 10000),
      level: "debug",
      source: "sqlite",
      message: "SQLite provenance store connected: documents.db",
    },
  ]);

  const logPushRef = useRef<((lines: LogLine | LogLine[]) => void) | null>(null);

  const addLog = useCallback((msg: string, level: "info" | "warn" | "error" | "debug" = "info", source = "compiler") => {
    const newLine: LogLine = {
      id: String(Date.now() + Math.random()),
      at: new Date(),
      level,
      source,
      message: msg,
    };
    setLogLines((prev) => [...prev.slice(-100), newLine]);
    if (logPushRef.current) {
      logPushRef.current(newLine);
    }
  }, []);

  // Modals
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Documents
  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.warn("Could not fetch documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFilesAdded = (files: File[]) => {
    setStagedFiles((prev) => [...prev, ...files]);
    addLog(`Staged ${files.length} file(s) for OKF compilation.`, "info", "staging");
  };

  const removeStagedFile = (idx: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const compilationPhases = [
    "MarkItDown Ingestion",
    "AST Concept Segmentation",
    "Vector Embedding Calculation",
    "SQLite Provenance Sync",
    "NetworkX Topology Linkage",
  ];

  const handleCompileStaged = async () => {
    if (stagedFiles.length === 0) return;
    setIsCompiling(true);
    setCompilationStatus("running");
    setCompilationPhase(0);
    setCompilationStartedAt(Date.now());
    addLog(`Uploading and compiling ${stagedFiles.length} file(s)...`, "info", "ingest");

    // Phase transition simulation
    const phaseTimer1 = setTimeout(() => {
      setCompilationPhase(1);
      addLog("Extracting AST structural hierarchy and part numbers...", "debug", "ast");
    }, 800);
    const phaseTimer2 = setTimeout(() => {
      setCompilationPhase(2);
      addLog("Calculating local dense embeddings for concepts...", "debug", "embed");
    }, 1600);
    const phaseTimer3 = setTimeout(() => {
      setCompilationPhase(3);
      addLog("Writing nodes to disk at storage/okf/...", "info", "disk");
    }, 2400);

    try {
      const formData = new FormData();
      stagedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/ingest/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setCompilationPhase(4);
        setCompilationStatus("done");
        addLog(
          `Compilation complete! Processed ${result.total_processed} files into ${result.total_nodes_generated} nodes.`,
          "info",
          "success"
        );
        setStagedFiles([]);
        await fetchDocuments();
      } else {
        setCompilationStatus("error");
        addLog(`Compilation warning: Server returned status ${res.status}`, "warn", "server");
      }
    } catch (err: any) {
      setCompilationStatus("error");
      addLog(`Compilation error: ${err.message || "Failed to reach server"}`, "error", "error");
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      setTimeout(() => {
        setIsCompiling(false);
      }, 3000);
    }
  };

  const handleCompileAllExisting = async () => {
    setIsCompiling(true);
    setCompilationStatus("running");
    setCompilationPhase(0);
    setCompilationStartedAt(Date.now());
    addLog("Re-compiling all stored documents from raw directory...", "info", "batch");
    try {
      const res = await fetch("/api/ingest/compile-all", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setCompilationPhase(4);
        setCompilationStatus("done");
        addLog(`Re-compilation finished! ${result.total_nodes_generated} total OKF nodes generated.`, "info", "batch");
        await fetchDocuments();
      }
    } catch (err: any) {
      setCompilationStatus("error");
      addLog(`Re-compilation error: ${err.message}`, "error", "batch");
    } finally {
      setTimeout(() => setIsCompiling(false), 2000);
    }
  };

  const handleDeleteDocument = async (rowElement?: HTMLElement | null) => {
    if (!docToDelete) return;
    setIsDeleting(true);
    addLog(`Deleting document ${docToDelete.filename} and associated OKF nodes...`, "warn", "delete");

    try {
      if (rowElement) {
        await foldAway(rowElement, { sound: true });
      }

      const res = await fetch(`/api/documents/${docToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        addLog(`Document ${docToDelete.filename} deleted successfully.`, "info", "delete");
        setDocToDelete(null);
        await fetchDocuments();
      }
    } catch (err: any) {
      addLog(`Failed to delete document: ${err.message}`, "error", "delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-[#0B0B0C] text-[#F5F7FF] overflow-hidden select-none">
      {/* Persistent Navigation Toolbar */}
      <TopToolbar activeModule="ingest" title="OEM Ingestion & Compiler Studio" />

      {/* Floating Island Layout */}
      <main className="flex-1 p-3 pt-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left Island: Upload Engine & Compilation Terminal */}
        <section className="w-[440px] lg:w-[480px] flex-shrink-0 bg-[#18181A] rounded-[24px] border border-[#27272A] p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Header */}
            <div className="pb-3 border-b border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 text-[#34D399]" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">OmniOKF Compiler</h2>
                  <p className="text-[10px] text-[#9CA3AF]">MarkItDown + PyMuPDF AST Parser</p>
                </div>
              </div>
              <Badge tone="emerald" variant="subtle" size="sm" className="font-mono">
                Active Edge
              </Badge>
            </div>

            {/* Hairline DropZone */}
            <div>
              <DropZone
                accept=".pdf,.docx,.xlsx,.txt,.md"
                title="Drop OEM Manuals or Schematics"
                hint="Supports PDF, DOCX, XLSX, TXT, and Markdown"
                maxSize={50 * 1024 * 1024}
                onFilesChange={handleFilesAdded}
                className="bg-[#141518] hover:bg-[#1A1B20] border-[#27272A] hover:border-[#34D399]/50 transition-all rounded-2xl"
              />
            </div>

            {/* Staged Files Queue */}
            {stagedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#9CA3AF] mb-1.5">
                  <span>Compilation Staging Queue ({stagedFiles.length})</span>
                  <button
                    onClick={() => setStagedFiles([])}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {stagedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#141518] border border-[#27272A] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[300px]">
                        <FileText className="w-3.5 h-3.5 text-[#34D399] flex-shrink-0" />
                        <span className="truncate text-white text-[11px]">{file.name}</span>
                        <span className="text-[10px] font-mono text-[#6B7280]">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        onClick={() => removeStagedFile(idx)}
                        className="text-[#6B7280] hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TaskProgress Indicator during active compilation */}
            {isCompiling && (
              <div className="p-3 bg-[#141518] rounded-2xl border border-[#27272A]">
                <TaskProgress
                  title="Compiling OEM Knowledge Bundle"
                  status={compilationStatus}
                  phases={compilationPhases}
                  phase={compilationPhase}
                  startedAt={compilationStartedAt}
                  message="Parsing tables, headings, and cross-references into atomic nodes."
                  stats={[
                    { label: "Staged Files", value: stagedFiles.length || documents.length },
                    { label: "Parser", value: "PyMuPDF" },
                  ]}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCompileStaged}
                disabled={isCompiling || stagedFiles.length === 0}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#10B981] via-[#22D3EE] to-[#3B82F6] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
              >
                {isCompiling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compiling into OKF Bundles...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compile Staged Files ({stagedFiles.length})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCompileAllExisting}
                disabled={isCompiling}
                className="w-full py-2 rounded-full bg-[#1E1F24] hover:bg-[#25262E] text-[#9CA3AF] hover:text-white border border-[#27272A] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Compile All Stored Manuals</span>
              </button>
            </div>

            {/* Hairline LogStream Component */}
            <div className="rounded-2xl border border-[#27272A] overflow-hidden bg-[#101114]">
              <LogStream
                defaultValue={logLines}
                height={160}
                title="OmniOKF Parser Stream"
                subscribe={(push) => {
                  logPushRef.current = push;
                  return () => {
                    logPushRef.current = null;
                  };
                }}
              />
            </div>
          </div>
        </section>

        {/* Right Island: Ingested Knowledge Catalog Table */}
        <section className="flex-1 bg-[#18181A] rounded-[24px] border border-[#27272A] p-5 flex flex-col overflow-hidden">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#34D399]" />
                <span>Ingested Source Catalog ({documents.length} Manuals)</span>
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Processed into linked Open Knowledge Format markdown nodes with SQLite provenance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B7280]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter manuals..."
                  className="bg-[#141518] border border-[#27272A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#22D3EE] transition-colors"
                />
              </div>

              <button
                onClick={fetchDocuments}
                className="p-2 rounded-xl bg-[#141518] border border-[#27272A] text-[#9CA3AF] hover:text-white hover:bg-[#1E1F24] transition-colors cursor-pointer"
                title="Refresh List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? "animate-spin text-[#22D3EE]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mt-3">
            {isLoadingDocs ? (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-[#9CA3AF]">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span>Loading Knowledge Catalog...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  scene="inbox"
                  title="No Documents Ingested"
                  description="Drop your OEM manuals, technical bulletins, or hydraulic schematics in the left panel to compile them into OKF nodes."
                />
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] font-mono text-[#6B7280] uppercase border-b border-[#27272A]">
                  <tr>
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Concepts</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      id={`doc-row-${doc.id}`}
                      className="hover:bg-[#141518]/60 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="truncate max-w-[280px]">{doc.filename}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                          ID: {doc.id}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge tone="neutral" variant="subtle" size="sm" className="font-mono uppercase">
                          {doc.filename.split(".").pop()}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 font-mono text-[#9CA3AF] text-[11px]">
                        {formatFileSize(doc.file_size)}
                      </td>

                      <td className="py-3 px-3">
                        <Badge tone="cyan" variant="subtle" size="sm" className="font-mono font-bold">
                          {doc.concepts_count} nodes
                        </Badge>
                      </td>

                      <td className="py-3 px-3">
                        <Badge
                          tone={doc.status === "READY" ? "emerald" : "amber"}
                          variant="subtle"
                          size="sm"
                          className="font-mono font-medium"
                        >
                          {doc.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectDoc(doc)}
                            className="px-2.5 py-1 rounded-lg bg-[#1E1F24] hover:bg-[#25262E] text-[#22D3EE] border border-[#27272A] hover:border-[#22D3EE] text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Inspect Nodes
                          </button>
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1 rounded-lg text-[#6B7280] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Generated Nodes Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181A] border border-[#27272A] rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A] mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-[340px]">
                  Generated OKF Nodes ({inspectDoc.filename})
                </h3>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#9CA3AF] leading-relaxed">
                The OmniOKF parser segmented this manual into {inspectDoc.node_paths.length || inspectDoc.concepts_count} discrete, cross-referenced Markdown concepts:
              </p>

              <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {inspectDoc.node_paths && inspectDoc.node_paths.length > 0 ? (
                  inspectDoc.node_paths.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#141518] border border-[#27272A] font-mono text-[11px] text-[#22D3EE] flex items-center justify-between"
                    >
                      <span className="truncate">{p}</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-[#141518] rounded-xl border border-[#27272A] text-[#9CA3AF] text-center">
                    Nodes generated and linked directly into in-memory NetworkX graph.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-5 py-2 rounded-full bg-[#22D3EE] hover:bg-[#06B6D4] text-black text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#18181A] border border-[#27272A] rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-bold text-white">Confirm Document Deletion</h3>
            </div>

            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Are you sure you want to delete <span className="text-white font-semibold">{docToDelete.filename}</span>?
              This will fold away the raw document and un-index its generated OKF nodes from the active knowledge graph.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-full bg-[#1E1F24] hover:bg-[#25262E] text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById(`doc-row-${docToDelete.id}`);
                  handleDeleteDocument(el);
                }}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete & Fold Away"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
