"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Terminal, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useDebounce } from "use-debounce";
import CitationRenderer from "@/components/chat/citation-renderer";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6">
      <div className="absolute right-4 top-4 z-20">
        <button
          onClick={onCopy}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 border-x border-t border-border rounded-t-xl bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Terminal className="h-3 w-3" />
        Code Snippet
      </div>
      <pre className="p-4 rounded-b-xl border border-border bg-muted/30 overflow-x-auto text-[13px] font-mono leading-relaxed custom-scrollbar">
        {children}
      </pre>
    </div>
  );
};

export const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-black tracking-tight text-foreground mt-8 mb-4 border-b border-border pb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold tracking-tight text-foreground mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-foreground mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <div className="mb-4 leading-relaxed text-muted-foreground last:mb-0">
      <CitationRenderer text={React.Children.toArray(children).join("")} />
    </div>
  ),
  ul: ({ children }) => (
    <ul className="list-none mb-6 space-y-2 mt-2">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 items-start text-muted-foreground leading-relaxed">
      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[13px] font-mono font-bold">
          {children}
        </code>
      );
    }
    return <CodeBlock>{children}</CodeBlock>;
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/20 bg-primary/5 pl-6 py-4 rounded-r-2xl italic mb-6 text-foreground font-medium">
      {children}
    </blockquote>
  ),
};

function StreamedText({
  text,
  isLoading,
  error,
  emptyMessage = "AI response will appear here...",
}) {
  const [debouncedText] = useDebounce(text, 20);
  
  if (error) {
    return (
      <div className="flex items-start gap-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive shadow-sm">
        <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="font-black uppercase tracking-widest text-[10px] mb-1">Neural Engine Error</p>
          <p className="text-destructive/80 leading-relaxed font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!text && !isLoading) {
    return (
      <p className="text-muted-foreground text-sm font-medium animate-pulse">{emptyMessage}</p>
    );
  }

  return (
    <div className="break-words leading-relaxed relative">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {debouncedText}
      </ReactMarkdown>

      {isLoading && (
        <motion.span 
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2.5 h-5 ml-1 bg-primary rounded-sm align-middle" 
        />
      )}
    </div>
  );
}

export default StreamedText;
