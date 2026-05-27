"use client";

import { AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useDebounce } from "use-debounce";
import CitationRenderer from "@/components/chat/citation-renderer";
import React from "react";

/** Custom markdown components with extra spacing on headings */
export const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold mt-5 mb-2.5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold mt-3 mb-1.5">{children}</h4>
  ),
  p: ({ children }) => (
  <p className="mb-3 leading-relaxed">
    <CitationRenderer
      text={React.Children.toArray(children).join("")}
    />
  </p>
),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="text-xs font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-muted-foreground/10 p-3 rounded-md mb-3 overflow-x-auto text-xs font-mono">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-primary/40 pl-4 italic mb-3">
      {children}
    </blockquote>
  ),
};

/**
 * Renders streamed text with a typing effect, blinking cursor, and markdown formatting.
 *
 * @param {object}  props
 * @param {string}  props.text      — The accumulated streamed text
 * @param {boolean} props.isLoading — Whether the stream is still active
 * @param {string}  [props.error]   — Error message to display
 * @param {string}  [props.emptyMessage] — Message shown when no text yet
 */
function StreamedText({
  text,
  isLoading,
  error,
  emptyMessage = "AI response will appear here...",
}) {
  const [debouncedText] = useDebounce(text, 40);
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Generation failed</p>
          <p className="text-destructive/80 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!text && !isLoading) {
    return (
      <p className="text-muted-foreground text-sm">{emptyMessage}</p>
    );
  }

  return (
    <div className="break-words text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {debouncedText}
      </ReactMarkdown>

      {isLoading && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-foreground animate-pulse align-text-bottom" />
      )}
    </div>
  );
}
export default StreamedText;

