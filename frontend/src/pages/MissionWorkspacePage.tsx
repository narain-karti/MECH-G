import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, BookOpen, Check, ChevronDown, CircleAlert, Download, FileUp, GitBranch, LoaderCircle, MessageSquareText, Plus, ShieldCheck, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChatMessage, Citation, Conversation, SourceDocument } from "../types/workspace";
import { MissionIssue, MissionNotebook } from "../types/mission";
import { ChatService } from "../services/chatService";
import { DocumentService } from "../services/documentService";
import { MissionService } from "../services/missionService";
import { GraphService } from "../services/graphService";
import { MarkdownAnswer } from "../components/mission/MarkdownAnswer";

type View = "chat" | "sources" | "graph" | "issues" | "report";

const views: Array<{ id: View; label: string }> = [{ id: "chat", label: "Mission chat" }, { id: "sources", label: "Sources" }, { id: "graph", label: "Knowledge graph" }, { id: "issues", label: "Issues" }, { id: "report", label: "Report" }];

export function MissionWorkspacePage() {
  const { notebookId = "" } = useParams();
  const navigate = useNavigate();
  const uploadInput = useRef<HTMLInputElement>(null);
  const [notebook, setNotebook] = useState<MissionNotebook | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [issues, setIssues] = useState<MissionIssue[]>([]);
  const [view, setView] = useState<View>("chat");
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [graphNodes, setGraphNodes] = useState<Array<{ relative_path: string; title: string; category: string; description: string }>>([]);
  const [addingIssue, setAddingIssue] = useState(false);

  const refreshMission = async () => {
    const [mission, sourceList, issueList] = await Promise.all([MissionService.get(notebookId), DocumentService.listDocuments(notebookId), MissionService.issues(notebookId)]);
    setNotebook(mission); setDocuments(sourceList); setIssues(issueList);
    const conversationId = mission.default_conversation_id;
    if (conversationId) { const loaded = await ChatService.getConversation(conversationId); setConversation(loaded); setMessages(loaded.messages || []); }
  };
  useEffect(() => { refreshMission().catch(() => setError("This mission could not be opened.")); }, [notebookId]);
  useEffect(() => { if (view === "graph") GraphService.searchGraph("").then(() => {}).catch(() => {}); }, [view]);

  const readySources = documents.filter(doc => doc.status === "READY");
  const selectedDocumentIds = readySources.map(doc => doc.id);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || streaming || !conversation) return;
    const text = prompt.trim(); setPrompt(""); setError(""); setStreaming(true);
    const localUser: ChatMessage = { id: `local-user-${Date.now()}`, conversation_id: conversation.id, role: "user", content: text, citations: [], related_nodes: [] };
    const localAssistant: ChatMessage = { id: `local-assistant-${Date.now()}`, conversation_id: conversation.id, role: "assistant", content: "", citations: [], related_nodes: [], status: "streaming" };
    setMessages(current => [...current, localUser, localAssistant]);
    await ChatService.streamChat(conversation.id, text, selectedDocumentIds, {
      onToken: token => setMessages(current => current.map(message => message.id === localAssistant.id ? { ...message, content: message.content + token } : message)),
      onCitation: citation => setMessages(current => current.map(message => message.id === localAssistant.id ? { ...message, citations: [...message.citations, citation] } : message)),
      onDone: result => { setMessages(current => current.map(message => message.id === localAssistant.id ? { ...message, id: result.message_id, status: "completed" } : message)); setStreaming(false); MissionService.issues(notebookId).then(setIssues); },
      onError: message => { setStreaming(false); setError(message || "The answer could not be completed."); setMessages(current => current.map(item => item.id === localAssistant.id ? { ...item, status: "error" } : item)); },
    });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []); if (!files.length) return;
    setUploading(true); setError("");
    try { await DocumentService.uploadDocuments(files, notebookId); await refreshMission(); setView("sources"); }
    catch { setError("Those files could not be compiled. Check their type and try again."); }
    finally { setUploading(false); if (uploadInput.current) uploadInput.current.value = ""; }
  }

  async function addIssue() {
    const title = window.prompt("What issue should this mission track?");
    if (!title?.trim()) return;
    const issue = await MissionService.createIssue(notebookId, title.trim()); setIssues(current => [issue, ...current]); setAddingIssue(false);
  }

  async function toggleIssue(issue: MissionIssue) {
    const status = issue.status === "resolved" ? "open" : "resolved";
    const updated = await MissionService.updateIssue(notebookId, issue.id, { status });
    setIssues(current => current.map(item => item.id === updated.id ? updated : item));
  }

  async function exportReport() {
    const report = await MissionService.report(notebookId);
    const markdown = [`# ${report.notebook.title}`, report.notebook.description, `Generated: ${new Date(report.generated_at).toLocaleString()}`, "\n## Sources", ...report.sources.map(source => `- ${source.filename} — ${source.status}`), "\n## Issue register", ...report.issues.map(issue => `- [${issue.status}] ${issue.title}`), "\n## Mission conversation", ...report.messages.map(message => `### ${message.role}\n${message.content}`)].join("\n");
    const href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" })); const anchor = document.createElement("a"); anchor.href = href; anchor.download = `${report.notebook.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.md`; anchor.click(); URL.revokeObjectURL(href);
  }

  if (!notebook && !error) return <div className="mission-loading"><LoaderCircle className="spin"/> Opening mission notebook…</div>;
  if (!notebook) return <div className="mission-loading">{error}<Link to="/notebooks">Return to mission library</Link></div>;
  return <main className="mission-page">
    <header className="mission-header"><Link to="/notebooks" className="mission-back"><ArrowLeft size={16}/> Missions</Link><div className="mission-title"><span>Mission notebook</span><h1>{notebook.title}</h1></div><div className="mission-state"><span><BookOpen size={15}/>{readySources.length} sources</span><span className={issues.some(issue => issue.status !== "resolved") ? "state-alert" : ""}><CircleAlert size={15}/>{issues.filter(issue => issue.status !== "resolved").length} open</span></div></header>
    <nav className="mission-tabs" aria-label="Mission areas">{views.map(item => <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => setView(item.id)}>{item.label}{item.id === "issues" && issues.filter(issue => issue.status !== "resolved").length > 0 ? <b>{issues.filter(issue => issue.status !== "resolved").length}</b> : null}</button>)}</nav>
    {error && <div className="mission-error"><CircleAlert size={15}/>{error}<button onClick={() => setError("")}><X size={14}/></button></div>}
    {view === "chat" && <section className="chat-view"><div className="chat-context"><span><ShieldCheck size={15}/> Grounded in {readySources.length ? `${readySources.length} mission source${readySources.length > 1 ? "s" : ""}` : "no sources yet"}</span>{readySources.length === 0 && <button onClick={() => setView("sources")}>Add sources</button>}</div><div className="message-stream">{messages.length === 0 && <div className="chat-empty"><MessageSquareText size={28}/><h2>What needs attention?</h2><p>Ask from the evidence in this mission. New fault signals are added to the issue register automatically; explicit repairs close their issue.</p><div><button onClick={() => setPrompt("What safety checks are required before work begins?")}>Find safety prerequisites</button><button onClick={() => setPrompt("Summarize the most relevant repair procedure.")}>Prepare a repair plan</button></div></div>}{messages.map(message => <article className={`mission-message ${message.role}`} key={message.id}>{message.role === "user" ? <p>{message.content}</p> : <><MarkdownAnswer content={message.content || "Preparing a grounded response…"}/>{message.citations.length > 0 && <div className="citation-row">{message.citations.filter((citation: Citation) => citation.verification_status === "verified").map(citation => <span key={citation.citation_id}>Verified · {citation.source_name}</span>)}</div>}</>}</article>)}</div><form className="mission-composer" onSubmit={sendMessage}><textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={readySources.length ? "Ask about this mission…" : "Add mission sources first, or ask a general question…"} rows={2}/><button className="ink-button" disabled={!prompt.trim() || streaming}>{streaming ? <LoaderCircle className="spin" size={17}/> : <ArrowUp size={17}/>}<span>{streaming ? "Working" : "Send"}</span></button></form></section>}
    {view === "sources" && <section className="workspace-panel sources-view"><div className="panel-title"><div><p className="eyebrow">Mission evidence</p><h2>Sources become the mission’s knowledge graph.</h2></div><button className="ink-button" onClick={() => uploadInput.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle className="spin" size={16}/> : <FileUp size={16}/>} {uploading ? "Compiling…" : "Add documents"}</button><input ref={uploadInput} type="file" multiple hidden onChange={upload} accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.md,.txt,.html" /></div><p className="panel-copy">Add manuals, procedures, incident reports, schematics, spreadsheets, or field notes. Every uploaded source is compiled to OKF and scoped to this mission notebook.</p><div className="source-table">{documents.length === 0 ? <div className="empty-panel">No evidence yet. Upload the source material that defines this mission.</div> : documents.map(doc => <div className="source-row" key={doc.id}><FileUp size={17}/><div><strong>{doc.filename}</strong><small>{doc.concepts_count} OKF concepts · {new Date(doc.updated_at).toLocaleDateString()}</small></div><span className={`source-status ${doc.status.toLowerCase()}`}>{doc.status.replaceAll("_", " ")}</span></div>)}</div></section>}
    {view === "graph" && <GraphPanel documents={documents} setGraphNodes={setGraphNodes} graphNodes={graphNodes} />}
    {view === "issues" && <section className="workspace-panel issues-view"><div className="panel-title"><div><p className="eyebrow">Mission issue register</p><h2>What the mission has surfaced.</h2></div><button className="outline-button" onClick={addIssue}><Plus size={16}/> Add issue</button></div><p className="panel-copy">Chat identifies fault signals in new prompts and closes matching entries when a repair is explicitly resolved. Review remains visible and editable here.</p><div className="issues-list">{issues.length === 0 ? <div className="empty-panel">No issues have been recorded. When a prompt names a fault, leak, alarm, error, or problem, it will appear here.</div> : issues.map(issue => <article className={`issue-row ${issue.status}`} key={issue.id}><button onClick={() => toggleIssue(issue)} aria-label={issue.status === "resolved" ? "Reopen issue" : "Mark issue resolved"}>{issue.status === "resolved" ? <Check size={15}/> : <span/>}</button><div><div className="issue-heading"><h3>{issue.title}</h3><span>{issue.severity}</span></div><p>{issue.description || "Created manually"}</p><small>{issue.status === "resolved" ? "Resolved" : "Open for investigation"} · {new Date(issue.updated_at).toLocaleString()}</small></div></article>)}</div></section>}
    {view === "report" && <section className="workspace-panel report-view"><p className="eyebrow">Mission report</p><h2>Hand over the evidence, issue trail, and conversation.</h2><p className="panel-copy">Create a portable Markdown report for the active mission. It includes its sources, issue register, and full chat history—never another mission’s information.</p><div className="report-summary"><span><strong>{documents.length}</strong> sources</span><span><strong>{issues.length}</strong> issues</span><span><strong>{messages.length}</strong> chat messages</span></div><button className="ink-button" onClick={exportReport}><Download size={17}/> Download mission report</button></section>}
  </main>;
}

function GraphPanel({ documents, graphNodes, setGraphNodes }: { documents: SourceDocument[]; graphNodes: Array<{ relative_path: string; title: string; category: string; description: string }>; setGraphNodes: (nodes: Array<{ relative_path: string; title: string; category: string; description: string }>) => void }) {
  useEffect(() => { GraphService.searchGraph("a").then(result => setGraphNodes(result.slice(0, 18))).catch(() => setGraphNodes([])); }, [setGraphNodes]);
  return <section className="workspace-panel graph-view"><div className="panel-title"><div><p className="eyebrow">Mission knowledge graph</p><h2>Trace the working context.</h2></div><GitBranch size={22}/></div><p className="panel-copy">The OKF graph connects components, procedures, safety requirements, and tools. This mission currently contributes {documents.reduce((sum, doc) => sum + doc.concepts_count, 0)} compiled concepts.</p><div className="graph-list">{graphNodes.length ? graphNodes.map((node, index) => <article key={node.relative_path}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{node.title}</strong><small>{node.category} · {node.relative_path}</small></div></article>) : <div className="empty-panel">Compile sources to populate the knowledge graph.</div>}</div></section>;
}
