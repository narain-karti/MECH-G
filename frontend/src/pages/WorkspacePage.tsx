import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TopToolbar } from "../components/workspace/TopToolbar";
import { SourceSidebar } from "../components/workspace/SourceSidebar";
import { ChatWorkspace } from "../components/workspace/ChatWorkspace";
import { KnowledgeGraphPanel } from "../components/workspace/KnowledgeGraphPanel";
import { MachineIssueTrackerPanel } from "../components/workspace/MachineIssueTrackerPanel";
import { SourcePreviewModal } from "../components/workspace/SourcePreviewModal";
import { UploadDocumentModal } from "../components/workspace/UploadDocumentModal";
import { DocumentService } from "../services/documentService";
import { ChatService } from "../services/chatService";
import { EquipmentNotebook, MachineIssue, NotebookService } from "../services/notebookService";
import { useProcessing } from "../context/ProcessingContext";
import { SourceDocument, ChatMessage, Conversation, Citation } from "../types/workspace";
import { Layers, AlertCircle, Wrench, ShieldCheck, Cpu } from "lucide-react";

export const WorkspacePage: React.FC = () => {
  const { notebookId: rawNotebookId } = useParams<{ notebookId?: string }>();
  const navigate = useNavigate();
  const activeNotebookId = rawNotebookId || "nb-vestas-v112";

  const { setProcessing } = useProcessing();

  // Active Notebook state
  const [notebook, setNotebook] = useState<EquipmentNotebook | null>(null);

  // Sources state
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<SourceDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Chat & Conversation state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Right Island Tab: 'graph' (Mindmap) vs 'issues' (Defect Register)
  const [rightTab, setRightTab] = useState<"graph" | "issues">("graph");

  // Knowledge Graph synchronization state
  const [highlightedNodePaths, setHighlightedNodePaths] = useState<string[]>([]);
  const [focusNodePath, setFocusNodePath] = useState<string | null>(null);

  // Panel sizing & collapse state
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    return Number(localStorage.getItem("pg_left_width")) || 280;
  });
  const [rightWidth, setRightWidth] = useState<number>(() => {
    return Number(localStorage.getItem("pg_right_width")) || 380;
  });
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("pg_left_collapsed") === "true";
  });
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("pg_right_collapsed") === "true";
  });

  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  // Load active notebook details
  const loadNotebook = useCallback(async () => {
    try {
      const data = await NotebookService.getNotebook(activeNotebookId);
      if (data) {
        setNotebook(data);
      }
    } catch (err) {
      console.error("Could not load notebook details:", err);
    }
  }, [activeNotebookId]);

  // Load documents scoped to active notebook
  const loadDocuments = useCallback(async () => {
    try {
      const docs = await DocumentService.listDocuments(activeNotebookId);
      setDocuments(docs);
      setSelectedDocIds((prev) => {
        if (prev.length === 0 && docs.length > 0) {
          return docs.map((d) => d.id);
        }
        return prev;
      });
    } catch (err) {
      console.error("Could not load documents:", err);
    }
  }, [activeNotebookId]);

  const loadOrCreateConversation = useCallback(async () => {
    try {
      const convs = await ChatService.listConversations();
      const notebookConvs = convs.filter((c) => c.notebook_id === activeNotebookId);
      if (notebookConvs.length > 0) {
        const active = await ChatService.getConversation(notebookConvs[0].id);
        setConversation(active);
        setMessages(active.messages || []);
        if (active.selected_document_ids && active.selected_document_ids.length > 0) {
          setSelectedDocIds(active.selected_document_ids);
        }
      } else {
        const newConv = await ChatService.createConversation(
          notebook?.title || "Equipment Field Consultation",
          undefined,
          activeNotebookId
        );
        setConversation(newConv);
        setMessages([]);
      }
    } catch (err) {
      console.error("Could not initialize conversation:", err);
    }
  }, [activeNotebookId, notebook?.title]);

  useEffect(() => {
    loadNotebook();
    loadDocuments();
  }, [loadNotebook, loadDocuments]);

  useEffect(() => {
    loadOrCreateConversation();
  }, [loadOrCreateConversation]);

  // Persist panel layout
  useEffect(() => {
    localStorage.setItem("pg_left_width", String(leftWidth));
    localStorage.setItem("pg_right_width", String(rightWidth));
    localStorage.setItem("pg_left_collapsed", String(leftCollapsed));
    localStorage.setItem("pg_right_collapsed", String(rightCollapsed));
  }, [leftWidth, rightWidth, leftCollapsed, rightCollapsed]);

  // Mouse drag handlers for resizing
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        const newW = Math.max(220, Math.min(450, e.clientX));
        setLeftWidth(newW);
      } else if (isDraggingRight.current) {
        const newW = Math.max(280, Math.min(550, window.innerWidth - e.clientX));
        setRightWidth(newW);
      }
    };

    const onMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id];
      if (conversation) {
        ChatService.updateConversation(conversation.id, undefined, next);
      }
      return next;
    });
  };

  const handleSelectAllDocs = (selectAll: boolean) => {
    const next = selectAll ? documents.map((d) => d.id) : [];
    setSelectedDocIds(next);
    if (conversation) {
      ChatService.updateConversation(conversation.id, undefined, next);
    }
  };

  // Chat message sending with SSE stream
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let convId = conversation?.id;
    if (!convId) {
      const newConv = await ChatService.createConversation(
        text.slice(0, 35),
        selectedDocIds,
        activeNotebookId
      );
      setConversation(newConv);
      convId = newConv.id;
    }

    const tempUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      conversation_id: convId,
      role: "user",
      content: text,
      citations: [],
      related_nodes: [],
    };

    const tempAssistantMsgId = `asst-${Date.now()}`;
    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      conversation_id: convId,
      role: "assistant",
      content: "",
      citations: [],
      related_nodes: [],
      status: "streaming",
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);
    setStreamingStatus("Retrieving context from OKF knowledge graph...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await ChatService.streamChat(
      convId,
      text,
      selectedDocIds,
      {
        onStatus: (stage) => {
          if (stage === "retrieving_context") {
            setStreamingStatus("Querying OKF knowledge graph...");
          } else if (stage === "generating") {
            setStreamingStatus("Gemma 4 is synthesizing grounded response...");
          }
        },
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMsgId ? { ...m, content: m.content + token } : m
            )
          );
        },
        onCitation: (citation) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === tempAssistantMsgId) {
                const exists = m.citations.some(
                  (c) => c.citation_id === citation.citation_id || c.node_path === citation.node_path
                );
                return exists ? m : { ...m, citations: [...m.citations, citation] };
              }
              return m;
            })
          );
        },
        onGraphUpdate: (nodeIds) => {
          setHighlightedNodePaths(nodeIds);
        },
        onDone: (data) => {
          setIsStreaming(false);
          setStreamingStatus(undefined);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMsgId ? { ...m, id: data.message_id, status: "completed" } : m
            )
          );
        },
        onError: (err) => {
          setIsStreaming(false);
          setStreamingStatus(undefined);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMsgId
                ? { ...m, content: m.content + `\n\n*(Error: ${err})*`, status: "error" }
                : m
            )
          );
        },
      },
      controller.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingStatus(undefined);
    }
  };

  const handleNewChat = async () => {
    handleStopStreaming();
    try {
      const newConv = await ChatService.createConversation(
        notebook ? `${notebook.title} Session` : "Equipment Field Consultation",
        selectedDocIds,
        activeNotebookId
      );
      setConversation(newConv);
      setMessages([]);
      setHighlightedNodePaths([]);
      setFocusNodePath(null);
    } catch (err) {
      console.error("Could not create new conversation:", err);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    setFocusNodePath(citation.node_path);
    setRightTab("graph");
    if (rightCollapsed) {
      setRightCollapsed(false);
    }
  };

  const handleTroubleshootIssue = (issue: MachineIssue) => {
    const prompt = `Troubleshoot defect: ${issue.title}. Component: ${issue.component} (PN: ${issue.part_number || "N/A"}). Observed symptom: ${issue.defect}. Detail verified torque specifications, required LOTO steps, and re-assembly checklist.`;
    handleSendMessage(prompt);
  };

  const selectedSources = documents.filter((d) => selectedDocIds.includes(d.id));

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0B0C] overflow-hidden select-none relative z-10">
      {/* Top Application Toolbar with Machine Context */}
      <TopToolbar
        title={notebook?.title || "Equipment Field Workspace"}
        notebookModel={notebook?.model}
        sourceCount={documents.length}
        onNewChat={handleNewChat}
        onOpenUpload={() => setShowUploadModal(true)}
      />

      {/* Main 3-Column Floating Islands Layout matching NotebookLM */}
      <div className="flex-1 flex overflow-hidden p-3 pt-1 gap-3 relative">
        {/* Left Floating Island: Technical Manuals & Bulletins */}
        <div
          data-tour="sources"
          style={{ width: leftCollapsed ? 48 : leftWidth }}
          className="h-full shrink-0 flex flex-col min-h-0 transition-[width] duration-150 ease-out relative"
        >
          <SourceSidebar
            documents={documents}
            selectedDocIds={selectedDocIds}
            onToggleSelectDoc={handleToggleSelectDoc}
            onSelectAllDocs={handleSelectAllDocs}
            onRefreshDocs={loadDocuments}
            onPreviewDoc={(doc) => setPreviewDoc(doc)}
            isCollapsed={leftCollapsed}
            onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          />

          {!leftCollapsed && (
            <div
              onMouseDown={() => (isDraggingLeft.current = true)}
              className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-20"
              title="Drag to resize sources"
            />
          )}
        </div>

        {/* Center Column: Gemma Conversational Canvas */}
        <div data-tour="chat" className="flex-1 h-full min-h-0 flex flex-col overflow-hidden relative">
          <ChatWorkspace
            messages={messages}
            isStreaming={isStreaming}
            streamingStatus={streamingStatus}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            onNewChat={handleNewChat}
            selectedSources={selectedSources}
            onCitationClick={handleCitationClick}
            workspaceTitle={notebook ? `${notebook.title} (${notebook.model || "Station"})` : "MECH-G Workspace"}
          />
        </div>

        {/* Right Floating Island: Dual-Mode Island (Mindmap vs Issue Register) */}
        <div
          data-tour="graph"
          style={{ width: rightCollapsed ? 48 : rightWidth }}
          className="h-full shrink-0 flex flex-col min-h-0 transition-[width] duration-150 ease-out relative bg-[#121214] rounded-3xl border border-[#27272A] overflow-hidden"
        >
          {!rightCollapsed && (
            <div
              onMouseDown={() => (isDraggingRight.current = true)}
              className="absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-20"
              title="Drag to resize right island"
            />
          )}

          {!rightCollapsed && (
            <div className="flex items-center gap-1 p-1 bg-[#18181A] border-b border-[#27272A] shrink-0">
              <button
                onClick={() => setRightTab("graph")}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  rightTab === "graph"
                    ? "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 shadow-sm"
                    : "text-[#71717A] hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Knowledge Mindmap</span>
              </button>

              <button
                onClick={() => setRightTab("issues")}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  rightTab === "issues"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm"
                    : "text-[#71717A] hover:text-white"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Defect Register</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden min-h-0 relative">
            {rightTab === "graph" ? (
              <KnowledgeGraphPanel
                highlightedNodePaths={highlightedNodePaths}
                focusNodePath={focusNodePath}
                onClearFocusNode={() => setFocusNodePath(null)}
                isCollapsed={rightCollapsed}
                onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
                sourceCount={selectedSources.length || 1}
              />
            ) : (
              <MachineIssueTrackerPanel
                notebookId={activeNotebookId}
                isCollapsed={rightCollapsed}
                onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
                onTroubleshoot={handleTroubleshootIssue}
              />
            )}
          </div>
        </div>
      </div>

      {/* Source Preview Modal */}
      <SourcePreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onSelectGraphNode={(nodePath) => {
          setFocusNodePath(nodePath);
          setRightTab("graph");
          if (rightCollapsed) setRightCollapsed(false);
        }}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        notebookId={activeNotebookId}
        onSuccess={() => loadDocuments()}
      />
    </div>
  );
};
