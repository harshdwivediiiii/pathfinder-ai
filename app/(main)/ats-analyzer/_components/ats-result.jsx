"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Download,
  RotateCcw,
  TrendingUp,
  Award,
  FileText,
} from "lucide-react";

import DOMPurify from "dompurify";
import { normalizeAtsSuggestions } from "@/lib/ats";

/* ───────────────── helpers ───────────────── */

function getScoreColor(score) {
  if (score >= 75) {
    return {
      ring: "#22c55e",
      text: "text-green-500",
      label: "Strong Match",
    };
  }

  if (score >= 50) {
    return {
      ring: "#f59e0b",
      text: "text-amber-500",
      label: "Fair Match",
    };
  }

  return {
    ring: "#ef4444",
    text: "text-red-500",
    label: "Needs Work",
  };
}

function ScoreRing({ score }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const { ring, text, label } = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 160 160"
        >
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
          />

          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={ring}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold ${text}`}>
            {Math.round(score)}
          </span>

          <span className="text-xs text-muted-foreground font-medium">
            / 100
          </span>
        </div>
      </div>

      <span className={`text-lg font-bold ${text}`}>
        {label}
      </span>
    </div>
  );
}

function KeywordBadge({ word, type }) {
  return type === "matched" ? (
    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/25 gap-1">
      <CheckCircle2 className="h-3 w-3" />
      {word}
    </Badge>
  ) : (
    <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 gap-1">
      <XCircle className="h-3 w-3" />
      {word}
    </Badge>
  );
}

/* ───────────────── Highlight Logic ───────────────── */

function getHighlightedSegments(text, highlights, matchedKeywords) {
  if (!text) return [];

  const segments = [];

  // 1. Process highlights from AI (weak_impact or keyword_insertion)
  if (Array.isArray(highlights)) {
    highlights.forEach((h, index) => {
      if (!h.text || h.text.trim().length === 0) return;
      
      let pos = text.indexOf(h.text);
      while (pos !== -1) {
        segments.push({
          start: pos,
          end: pos + h.text.length,
          type: h.type || "weak_impact",
          suggestion: h.tip || h.suggestion || "",
          text: h.text,
          key: `ai-hl-${index}-${pos}`
        });
        pos = text.indexOf(h.text, pos + 1);
      }
    });
  }

  // 2. Process matched keywords
  if (Array.isArray(matchedKeywords)) {
    matchedKeywords.forEach((word, index) => {
      if (!word || word.length < 2) return;
      
      // Escape word for regex safety
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedWord}\\b`, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        segments.push({
          start: match.index,
          end: match.index + match[0].length,
          type: "matched_keyword",
          text: match[0],
          key: `kw-${index}-${match.index}`
        });
      }
    });
  }

  // 3. Sort segments by start index ascending, and by length descending on tie
  segments.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return (b.end - b.start) - (a.end - a.start);
  });

  // 4. Filter out overlapping segments (longest wins, or first wins)
  const activeSegments = [];
  let lastEnd = 0;
  for (const seg of segments) {
    if (seg.start >= lastEnd) {
      activeSegments.push(seg);
      lastEnd = seg.end;
    }
  }

  return activeSegments;
}

function RenderedResume({ resumeText, highlights, matchedKeywords }) {
  const segments = getHighlightedSegments(resumeText, highlights, matchedKeywords);
  
  if (segments.length === 0) {
    return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{resumeText}</div>;
  }

  const elements = [];
  let currentIndex = 0;

  segments.forEach((seg, i) => {
    // Add text before the segment
    if (seg.start > currentIndex) {
      elements.push(
        <span key={`text-${currentIndex}`}>
          {resumeText.slice(currentIndex, seg.start)}
        </span>
      );
    }

    // Add highlighted segment
    if (seg.type === "weak_impact") {
      elements.push(
        <span
          key={seg.key}
          className="group relative border-b-2 border-dashed border-destructive bg-destructive/10 cursor-help transition-all hover:bg-destructive/20 px-0.5 rounded-sm"
        >
          {seg.text}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-80 -translate-x-1/2 scale-95 rounded-lg bg-popover p-3 text-popover-foreground shadow-lg border opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 font-sans text-xs">
            <span className="block font-bold uppercase tracking-wider text-destructive mb-1 font-sans">
              ⚠️ Weak Impact Bullet
            </span>
            <span className="block leading-relaxed text-muted-foreground font-medium font-sans">
              {seg.suggestion}
            </span>
            <span className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-popover border-b border-r rotate-45" />
          </span>
        </span>
      );
    } else if (seg.type === "keyword_insertion") {
      elements.push(
        <span
          key={seg.key}
          className="group relative border-b-2 border-dashed border-violet-500 bg-violet-500/10 cursor-help transition-all hover:bg-violet-500/20 px-0.5 rounded-sm"
        >
          {seg.text}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-80 -translate-x-1/2 scale-95 rounded-lg bg-popover p-3 text-popover-foreground shadow-lg border opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 font-sans text-xs">
            <span className="block font-bold uppercase tracking-wider text-violet-500 mb-1 font-sans">
              💡 Keyword Insertion Spot
            </span>
            <span className="block leading-relaxed text-muted-foreground font-medium font-sans">
              {seg.suggestion}
            </span>
            <span className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-popover border-b border-r rotate-45" />
          </span>
        </span>
      );
    } else if (seg.type === "matched_keyword") {
      elements.push(
        <span
          key={seg.key}
          className="bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20 px-1 py-0.5 rounded font-semibold text-xs inline-block"
        >
          {seg.text}
        </span>
      );
    }

    currentIndex = seg.end;
  });

  // Add any remaining text
  if (currentIndex < resumeText.length) {
    elements.push(
      <span key={`text-end`}>
        {resumeText.slice(currentIndex)}
      </span>
    );
  }

  return (
    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed select-text">
      {elements}
    </div>
  );
}

/* ───────────────── PDF ───────────────── */

async function downloadReport(result) {
  const { default: html2pdf } = await import("html2pdf.js");

  const {
    atsScore,
    jobTitle,
    companyName,
    matchedKeywords,
    missingKeywords,
    suggestions,
    overallFeedback,
    createdAt,
  } = result || {};

  const normalizedSuggestions = normalizeAtsSuggestions(suggestions);
  const generalSuggestions = normalizedSuggestions.filter(s => s.category !== "highlight" && !s.isHighlight);

  const safeScore = Number.isFinite(Number(atsScore)) ? Math.min(100, Math.max(0, Number(atsScore))) : 0;
  const safeMatchedKeywords = Array.isArray(matchedKeywords) ? matchedKeywords : [];
  const safeMissingKeywords = Array.isArray(missingKeywords) ? missingKeywords : [];
  const { label } = getScoreColor(safeScore);

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 32px; color: #111; max-width: 800px; margin: 0 auto;">

      <h1 style="font-size: 28px; margin-bottom: 4px; color: #1e293b;">
        ATS Analysis Report
      </h1>

      <p style="color: #64748b; margin: 0 0 24px;">
        Generated by PathFinder AI · ${new Date(
          createdAt
        ).toLocaleDateString()}
      </p>

      ${
        jobTitle || companyName
          ? `
        <p style="color:#475569; margin-bottom:24px;">
          <strong>Role:</strong>
          ${jobTitle || "N/A"}
          ${companyName ? `@ ${companyName}` : ""}
        </p>
      `
          : ""
      }

      <div style="background:#f8fafc; border-radius:12px; padding:24px; text-align:center; margin-bottom:24px;">
        <div style="font-size:64px; font-weight:900; color:${
          safeScore >= 75
            ? "#22c55e"
            : safeScore >= 50
            ? "#f59e0b"
            : "#ef4444"
        };">
          ${Math.round(safeScore)}
        </div>

        <div style="font-size:18px; font-weight:700; color:#475569;">
          ATS Score — ${label}
        </div>
      </div>

      ${
        overallFeedback
          ? `
        <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:16px; border-radius:6px; margin-bottom:24px;">
          <strong>Overall Feedback</strong>
          <p style="margin:8px 0 0;">
            ${overallFeedback}
          </p>
        </div>
      `
          : ""
      }

      <h2 style="font-size:18px; color:#16a34a; margin-bottom:8px;">
        Matched Keywords (${safeMatchedKeywords.length})
      </h2>

      <p style="margin-bottom:20px;">
        ${safeMatchedKeywords.join(", ")}
      </p>

      <h2 style="font-size:18px; color:#dc2626; margin-bottom:8px;">
        Missing Keywords (${safeMissingKeywords.length})
      </h2>

      <p style="margin-bottom:20px;">
        ${safeMissingKeywords.join(", ")}
      </p>

      <h2 style="font-size:18px; margin-bottom:12px;">
        Improvement Suggestions
      </h2>

      ${generalSuggestions.map((s) => `
        <div style="border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin-bottom:10px;">
          <strong style="color:#6d28d9;">
            ${s.category}
          </strong>

          <p style="margin:6px 0 0;">
            ${s.tip}
          </p>
        </div>
      `
        )
        .join("")}

      <p style="margin-top:32px; color:#94a3b8; font-size:12px; text-align:center;">
        PathFinder AI — Smart Careers Start Here.
      </p>
    </div>
  `;

  const el = document.createElement("div");

  el.innerHTML = DOMPurify.sanitize(html);

  document.body.appendChild(el);

  await html2pdf()
    .set({
      margin: 0,
      filename: `ATS-Report-${
        jobTitle || "resume"
      }-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    })
    .from(el)
    .save();

  document.body.removeChild(el);
}

/* ── main component ───────────────────────────────────── */
export default function ATSResult({ result, onAnalyzeAgain }) {
  const {
    atsScore,
    jobTitle,
    companyName,
    matchedKeywords,
    missingKeywords,
    suggestions,
    overallFeedback,
    resumeContent,
  } = result || {};

  const safeScore = Number.isFinite(Number(atsScore)) ? Math.min(100, Math.max(0, Number(atsScore))) : 0;
  const safeMatchedKeywords = Array.isArray(matchedKeywords) ? matchedKeywords : [];
  const safeMissingKeywords = Array.isArray(missingKeywords) ? missingKeywords : [];
  const normalizedSuggestions = normalizeAtsSuggestions(suggestions);

  // Separate visual highlights from general suggestions
  const highlights = normalizedSuggestions.filter(s => s.category === "highlight" || s.isHighlight);
  const generalSuggestions = normalizedSuggestions.filter(s => s.category !== "highlight" && !s.isHighlight);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            Analysis Results
          </h2>

          {(jobTitle || companyName) && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {jobTitle}
              {jobTitle && companyName ? " @ " : ""}
              {companyName}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyzeAgain}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Analyze Again
          </Button>

          <Button
            size="sm"
            onClick={() => downloadReport(result)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Interactive Resume Overlay */}
        <Card className="lg:col-span-6 flex flex-col lg:h-[calc(100vh-180px)] min-h-[500px] shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="h-5 w-5 text-blue-500" />
              Interactive Resume Overlay
            </CardTitle>
            <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-medium">
              💡 Hover highlighted sections for advice
            </span>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-muted">
            <RenderedResume 
              resumeText={resumeContent || ""} 
              highlights={highlights} 
              matchedKeywords={safeMatchedKeywords} 
            />
          </CardContent>
        </Card>

        {/* Right Pane: Detailed feedback, keywords, and general suggestions */}
        <div className="lg:col-span-6 space-y-6 lg:h-[calc(100vh-180px)] lg:overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
          {/* Score & Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 flex items-center justify-center py-6 shadow-sm">
              <ScoreRing score={safeScore} />
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Overall Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {overallFeedback || "No overall feedback provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Keywords Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Keywords */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  Matched Keywords ({safeMatchedKeywords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeMatchedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {safeMatchedKeywords.map((word) => (
                      <KeywordBadge key={word} word={word} type="matched" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No matched keywords found.</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Keywords */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-4.5 w-4.5" />
                  Missing Keywords ({safeMissingKeywords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safeMissingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {safeMissingKeywords.map((word) => (
                      <KeywordBadge key={word} word={word} type="missing" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No missing keywords found.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* General AI Improvement Suggestions */}
          {generalSuggestions.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  AI Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generalSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {i + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-violet-600 uppercase mb-1">
                          {s.category}
                        </p>
                        <p className="text-sm">
                          {s.tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}