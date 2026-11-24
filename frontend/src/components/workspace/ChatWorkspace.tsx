import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import mermaid from "mermaid";
import {
  Cpu,
  BookOpen,
  GitBranch,
  Code2,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import { ChatMessage, Citation as CitationType, SourceDocument } from "../../types/workspace";
import { ChatScroll } from "../ui/chat-scroll";
import { PromptComposer } from "../ui/prompt-composer";
import { CodeBlock } from "../ui/code-block";
import { Citation as HairlineCitation } from "../ui/citation";
import { ThinkingIndicator } from "../ui/thinking-indicator";
import { AnswerActions } from "../ui/streaming-answer";
import { ModeSwitcher } from "../ui/mode-switcher";
import { ModelPicker, ModelOption } from "../ui/model-picker";
import { VoiceInput } from "../ui/voice-input";
import { Badge } from "../ui/badge";

// Initialize mermaid with strict suppression of injected error divs
mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: "dark",
  securityLevel: "loose",
  themeVariables: {
    darkMode: true,
    background: "#0E1118",
    primaryColor: "#3B82F6",
    primaryTextColor: "#F5F7FF",
    primaryBorderColor: "#2B2D35",
    lineColor: "#22D3EE",
    secondaryColor: "#18181A",
    tertiaryColor: "#1E2026",
  },
});

function sanitizeMermaid(raw: string): string {
  // Do not rewrite Mermaid nodes or arrows here. The former sanitizer tried to
  // infer graph syntax from prose and regularly corrupted valid labels, which
  // is why diagrams appeared as text. The backend is already instructed to
  // send isolated Mermaid fences; preserve that source and let Mermaid parse it.
  return raw
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

interface MermaidRendererProps {
  code: string;
  isStreaming?: boolean;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, isStreaming = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [hasError, setHasError] = useState(false);

  const cleanCode = sanitizeMermaid(code);

  useEffect(() => {
    let isMounted = true;
    if (isStreaming) return;

    if (containerRef.current) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      mermaid
        .parse(cleanCode, { suppressErrors: true })
        .then(() => mermaid.render(id, cleanCode))
        .then(({ svg }) => {
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
            setHasError(false);
          }
        })
        .catch(() => {
          const errEl = document.querySelectorAll(`[id^="d${id}"], [id^="dmermaid"]`);
          errEl.forEach((el) => el.remove());

          if (isMounted) {
            setHasError(true);
            if (containerRef.current) {
              containerRef.current.innerHTML = "";
            }
          }
        });
    }

    return () => {
      isMounted = false;
      const errEl = document.querySelectorAll(`[id^="dmermaid"]`);
      errEl.forEach((el) => el.remove());
    };
  }, [cleanCode, isStreaming]);

  return (
    <div className="my-4 rounded-[20px] border border-[#2B2D35] bg-[#141519] overflow-hidden shadow-2xl">
      <div className="px-4 py-2.5 bg-[#1A1B20] border-b border-[#2B2D35] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#3B82F6]/20 text-[#60A5FA]">
            <GitBranch className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
            Process & Workflow Flowchart
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] font-mono border border-[#22D3EE]/20 font-bold">
            MECH-G Visual
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
              showRaw
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-[#232326] text-[#9CA3AF] hover:text-white border-[#2E2E33]"
            }`}
            title="Toggle raw code"
          >
            <Code2 className="w-3 h-3" />
            <span>{showRaw ? "Visual View" : "View Code"}</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(cleanCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="p-1.5 rounded-full bg-[#232326] hover:bg-[#2A2A2F] text-[#9CA3AF] hover:text-white border border-[#2E2E33] transition-colors cursor-pointer"
            title="Copy diagram source"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-5 bg-[#0E0F12]">
        {isStreaming ? (
          <div className="flex items-center justify-center py-8 text-[#9CA3AF] text-xs gap-2">
            <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
            <span>Generating workflow diagram...</span>
          </div>
        ) : showRaw || hasError ? (
          <div>
            {hasError && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Rendered as structured flowchart syntax:</span>
              </div>
            )}
            <pre className="p-3.5 rounded-xl bg-[#141519] border border-[#27272A] text-xs font-mono text-[#22D3EE] overflow-x-auto">
              <code>{cleanCode}</code>
            </pre>
          </div>
        ) : (
          <div ref={containerRef} className="flex justify-center overflow-x-auto min-h-[120px] items-center" />
        )}
      </div>
    </div>
  );
};

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingStatus?: string;
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
  onNewChat: () => void;
  selectedSources: SourceDocument[];
  onCitationClick: (citation: CitationType) => void;
  workspaceTitle?: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemma-4-26b-a4b-it",
    name: "Gemma 4 26B (Industrial)",
    description: "Multimodal AST reasoning with deterministic citation auditor",
    reasoning: true,
    speed: 4,
    intelligence: 5,
  },
  {
    id: "gemma-2-9b-it",
    name: "Gemma 2 9B (Edge Fast)",
    description: "Low-latency diagnostic model for rapid field response",
    speed: 5,
    intelligence: 4,
  },
  {
    id: "gemma-7b-offline",
    name: "Gemma 7B (Offline Mesh)",
    description: "Fully air-gapped local model for strict field isolation",
    speed: 3,
    intelligence: 3,
  },
];

const GROUNDING_MODES = [
  {
    value: "strict",
    label: "Strict Closed-World",
    description: "Answers strictly bounded to ingested OKF nodes without speculation",
  },
  {
    value: "balanced",
    label: "Balanced Hybrid",
    description: "Hybrid synthesis combining OKF graph nodes with engineering foundations",
  },
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isStreaming,
  streamingStatus,
  onSendMessage,
  onStopStreaming,
  selectedSources,
  onCitationClick,
  workspaceTitle = "MECH-G Master Documentation",
}) => {
  const [composerInput, setComposerInput] = useState("");
  const [groundingMode, setGroundingMode] = useState<string>("strict");
  const [activeModel, setActiveModel] = useState<string>("gemma-4-26b-a4b-it");
  const [showTuning, setShowTuning] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [streamingStartTime, setStreamingStartTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isStreaming) {
      setStreamingStartTime(Date.now());
    } else {
      setStreamingStartTime(undefined);
    }
  }, [isStreaming]);

  const samplePrompts = [
    "What is the step-by-step procedure for PRV-992-B valve seal replacement?",
    "What are the topics covered in the CAT 2 exam syllabus for probability and statistics?",
    "What are the mandatory OSHA 1910.147 Lockout/Tagout prerequisites for hydraulic servicing?",
    "Explain the Pitch Controller Power Board (PCB-PITCH-CTRL-V1) capacitor discharge safety steps.",
  ];

  const handleComposerSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setComposerInput("");
  };

  return (
    <main className="h-full flex-1 flex flex-col bg-[#0B0B0C] overflow-hidden select-text relative">
      {/* Scrollable Center Content with Hairline ChatScroll */}
      <ChatScroll
        streaming={isStreaming}
        followKey={messages[messages.length - 1]?.id}
        className="flex-1 px-4 lg:px-8 pt-6 pb-36 max-w-4xl w-full mx-auto"
      >
        {messages.length === 0 ? (
          <div className="space-y-6 pt-4 animate-in fade-in duration-500">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[11px] font-mono text-[#22D3EE] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                <span className="font-semibold uppercase tracking-wider">{workspaceTitle}</span>
              </div>

              <h1 className="text-[34px] sm:text-[44px] font-normal text-white tracking-tight leading-tight font-heading">
                Where should we start?
              </h1>

              <div className="flex items-center gap-2 mt-2.5">
                <Badge tone="primary" dot="pulse">
                  {`${selectedSources.length} ${selectedSources.length === 1 ? "source active" : "sources active"}`}
                </Badge>
                <span className="text-xs text-[#9CA3AF]">
                  · MECH-G Knowledge Base & Gemma 4 Multimodal Engine
                </span>
              </div>
            </div>

            <div className="text-[13px] leading-[1.75] text-[#D1D5DB] space-y-4 font-normal">
              <p>
                Welcome to <strong className="text-white font-bold">MECH-G</strong>, an industrial-grade multimodal AI knowledge workspace powered by
                the <strong className="text-white font-bold">Open Knowledge Format (OKF)</strong> knowledge graph and <strong className="text-white font-bold">Google Gemma 4</strong> intelligence.
              </p>
              <p>
                By indexing engineering specifications, curriculum syllabi, torque specs, and <strong className="text-amber-400 font-bold">OSHA 1910.147</strong> safety
                protocols into local AST graph nodes, MECH-G provides verifiable answers backed by deterministic citations.
              </p>
            </div>

            <div className="pt-2 border-t border-[#232328]">
              <p className="text-[11px] font-bold text-[#9CA3AF] mb-3 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                Suggested Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(p)}
                    className="p-3.5 rounded-2xl bg-[#141519] hover:bg-[#1C1D23] border border-[#232328] hover:border-[#383C48] text-left text-xs text-[#E5E7EB] transition-all flex items-start gap-2.5 group cursor-pointer shadow-sm hover:shadow-cyan-500/5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5 group-hover:text-[#22D3EE] transition-colors" />
                    <span className="leading-relaxed group-hover:text-white">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-[#2563EB]/20 border border-[#3B82F6]/30 flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-blue-500/20">
                      <Cpu className="w-3.5 h-3.5 text-[#60A5FA]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? "bg-[#2563EB] text-white shadow-md font-medium"
                        : "bg-[#18181A] border border-[#27272A] text-[#F4F4F5] shadow-lg"
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p({ children }) {
                            return <div className="mb-2 leading-relaxed">{children}</div>;
                          },
                          pre({ children }) {
                            return <div className="my-2">{children}</div>;
                          },
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            const lang = match ? match[1].toLowerCase() : "";
                            const codeString = String(children).replace(/\n$/, "");

                            const isMermaid =
                              lang === "mermaid" ||
                              lang === "graph" ||
                              (!inline && (
                                codeString.trim().startsWith("graph ") ||
                                codeString.trim().startsWith("flowchart ") ||
                                codeString.trim().startsWith("sequenceDiagram") ||
                                codeString.trim().startsWith("stateDiagram") ||
                                codeString.trim().startsWith("classDiagram")
                              ));

                            if (isMermaid) {
                              return <MermaidRenderer code={codeString} isStreaming={isStreaming} />;
                            }

                            if (!inline) {
                              return (
                                <CodeBlock
                                  code={codeString}
                                  language={lang || "plaintext"}
                                  lineNumbers
                                  collapseAfter={25}
                                  className="my-3"
                                />
                              );
                            }

                            return (
                              <code className="bg-[#232326] px-1.5 py-0.5 rounded text-[11px] font-mono text-[#A78BFA]" {...props}>
                                {children}
                              </code>
                            );
                          },
                          table({ children }) {
                            return (
                              <div className="overflow-x-auto my-3 border border-[#27272A] rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">{children}</table>
                              </div>
                            );
                          },
                          th({ children }) {
                            return <th className="bg-[#1E1F23] p-2 font-bold text-white border-b border-[#27272A]">{children}</th>;
                          },
                          td({ children }) {
                            return <td className="p-2 border-b border-[#27272A]/50 text-[#D1D5DB]">{children}</td>;
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Hairline Hover Citations Bar */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-[#27272A] flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-[#9CA3AF] mr-1 uppercase tracking-wider font-heading">
                          Verified Citations:
                        </span>
                        {msg.citations.map((cite, idx) => (
                          <HairlineCitation
                            key={cite.citation_id || idx}
                            index={idx + 1}
                            source={{
                              title: cite.source_name,
                              snippet: cite.excerpt,
                              url: cite.node_path,
                            }}
                            onClick={() => onCitationClick(cite)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Assistant Message Action Bar */}
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-[#27272A]/40 flex justify-between items-center">
                        <AnswerActions
                          copyText={msg.content}
                          sources={msg.citations?.map((c) => ({
                            name: c.source_name,
                          }))}
                          onRegenerate={() => onSendMessage(messages[messages.indexOf(msg) - 1]?.content || "")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Hairline Thinking Indicator during active generation */}
            {isStreaming && (
              <div className="pl-2 pt-2">
                <ThinkingIndicator
                  variant="orbit"
                  status="running"
                  label={streamingStatus || "Gemma 4 synthesizing response..."}
                  startedAt={streamingStartTime}
                />
              </div>
            )}
          </div>
        )}
      </ChatScroll>

      {/* Floating Bottom Composer Bar with Hairline PromptComposer */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto relative">
          {/* Tuning Parameters Popover */}
          {showTuning && (
            <div className="absolute bottom-full mb-3 left-0 w-84 bg-[#18181A] border border-[#27272A] rounded-2xl p-4 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A] mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-heading">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  Reasoning Grounding Controls
                </span>
                <button
                  onClick={() => setShowTuning(false)}
                  className="text-[#9CA3AF] hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-[#9CA3AF] block mb-1">GROUNDING STANDARD</label>
                  <ModeSwitcher
                    modes={GROUNDING_MODES}
                    value={groundingMode}
                    onValueChange={setGroundingMode}
                  />
                </div>

                <div className="pt-2 border-t border-[#27272A]">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#9CA3AF]">Temperature</span>
                    <span className="text-white font-mono">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-[#27272A] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-[#141518] border border-[#27272A] space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-[#9CA3AF]">MODEL:</span>
                    <span className="text-cyan-300 font-bold">{activeModel}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-[#9CA3AF]">CITATION AUDITOR:</span>
                    <span className="text-emerald-400 font-bold">Enforced</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hairline PromptComposer Component */}
          <div className="rounded-[22px] bg-[#141518] border border-[#27272A] shadow-2xl p-2 focus-within:border-cyan-400/50 transition-colors">
            <PromptComposer
              value={composerInput}
              onValueChange={setComposerInput}
              onSubmit={handleComposerSubmit}
              onStop={onStopStreaming}
              status={isStreaming ? "streaming" : "ready"}
              placeholder="Ask MECH-G a question or request equipment diagnostics..."
              toolbar={
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowTuning(!showTuning)}
                    className="p-1.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#2A2B31] transition-colors cursor-pointer"
                    title="Tune reasoning parameters"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#22D3EE]" />
                  </button>

                  <ModelPicker
                    models={AVAILABLE_MODELS}
                    value={activeModel}
                    onValueChange={setActiveModel}
                    side="top"
                    align="start"
                  />

                  <VoiceInput status="idle" />

                  <div className="hidden sm:flex items-center text-[11px] text-[#8E8E93] pl-2 border-l border-[#27272A]">
                    {selectedSources.length} {selectedSources.length === 1 ? "source" : "sources"}
                  </div>
                </div>
              }
            />
          </div>

          <p className="text-[10px] text-center text-[#71717A] mt-2 select-none">
            MECH-G Knowledge Engine verifies assertions against deterministic OKF graph nodes. Always confirm LOTO interlocks.
          </p>
        </div>
      </div>
    </main>
  );
};

export default ChatWorkspace;
