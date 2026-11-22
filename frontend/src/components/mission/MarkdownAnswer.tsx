import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import { AlertCircle, Copy, Check } from "lucide-react";

let rendererNumber = 0;
let initialized = false;

function configureMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    themeVariables: {
      background: "#ffffff",
      primaryColor: "#ffffff",
      primaryBorderColor: "#111111",
      primaryTextColor: "#111111",
      secondaryColor: "#f3f3f1",
      tertiaryColor: "#ffffff",
      lineColor: "#111111",
      textColor: "#111111",
      fontSize: "14px",
    },
    flowchart: { curve: "basis", htmlLabels: false, useMaxWidth: true },
  });
  initialized = true;
}

function MermaidDiagram({ value }: { value: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let disposed = false;
    const render = async () => {
      try {
        configureMermaid();
        const code = value.trim();
        await mermaid.parse(code, { suppressErrors: true });
        const { svg } = await mermaid.render(`mission-diagram-${++rendererNumber}`, code);
        if (!disposed && host.current) {
          host.current.replaceChildren();
          host.current.insertAdjacentHTML("afterbegin", svg);
          setError(false);
        }
      } catch (renderError) {
        console.warn("Mermaid diagram rejected", renderError);
        if (!disposed) setError(true);
      }
    };
    render();
    return () => { disposed = true; };
  }, [value]);

  return (
    <figure className="mission-diagram">
      <figcaption>
        <span>Verified workflow</span>
        <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }} aria-label="Copy Mermaid source">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </figcaption>
      {error ? (
        <div className="diagram-error"><AlertCircle size={16} /><span>This workflow could not be drawn. Its source is available to copy.</span></div>
      ) : <div ref={host} className="mermaid-host" aria-label="Workflow diagram" />}
    </figure>
  );
}

export function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div className="mission-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const language = /language-(\w+)/.exec(className || "")?.[1];
            const value = String(children).replace(/\n$/, "");
            if (language === "mermaid") return <MermaidDiagram value={value} />;
            if (!className) return <code {...props}>{children}</code>;
            return <pre><code className={className} {...props}>{children}</code></pre>;
          },
          a({ href, children }) { return <a href={href} target="_blank" rel="noreferrer">{children}</a>; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
