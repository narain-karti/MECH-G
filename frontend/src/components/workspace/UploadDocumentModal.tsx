import React, { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { DocumentService } from "../../services/documentService";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId?: string;
  onSuccess: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  notebookId,
  onSuccess,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || uploading) return;

    setUploading(true);
    setError(null);

    try {
      await DocumentService.uploadDocuments(files, notebookId);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFiles([]);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to upload and index document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0C]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#18181A] border border-[#27272A] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272A] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload OEM Technical Manual</h3>
              <p className="text-[11px] text-[#A1A1AA]">Index into OKF AST knowledge graph</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#27272A] text-[#71717A] hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border border-dashed border-[#27272A] hover:border-[#22D3EE]/40 rounded-2xl p-6 text-center cursor-pointer bg-[#121214] relative transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.md,.txt,.doc"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
            <p className="text-xs font-semibold text-white mb-1">
              Choose manuals or drag & drop files here
            </p>
            <p className="text-[10px] text-[#71717A]">
              PDF, Markdown, or text service bulletins (up to 50 MB)
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#121214] border border-[#27272A] text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
                    <span className="truncate text-white text-[11px]">{file.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Manual ingested and indexed successfully!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || uploading}
              className="px-5 py-2 rounded-xl bg-[#22D3EE] text-[#0B0B0C] font-semibold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{uploading ? "Extracting & Compiling..." : "Ingest Manual"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
