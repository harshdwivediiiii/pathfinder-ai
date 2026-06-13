"use client";

import "client-only";

/**
 * Client-side resume file -> plain text extraction for ATS Analyzer
 * Runs fully in browser (no server upload required).
 */

export const ACCEPTED_RESUME_TYPES = ".pdf,.docx,.txt,.md";
export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_USABLE_TEXT_LENGTH = 30;

function getExtension(fileName = "") {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match ? match[1].toLowerCase() : "";
}

/**
 * PDF extraction — uses pdfjs-dist legacy CJS build (Next.js 15 / Webpack safe)
 */
async function extractPdf(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf");

  // Point the worker at the legacy worker bundle via CDN so Webpack
  // never tries to bundle it (avoids "Can't resolve worker" errors).
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText;
}

/**
 * DOCX extraction using mammoth
 */
async function extractDocx(file) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

/**
 * Plain text / markdown extraction
 */
async function extractPlainText(file) {
  return await file.text();
}

/**
 * Main extractor function
 */
export async function extractTextFromFile(file) {
  if (!file) throw new Error("No file selected.");

  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new Error("File too large. Please upload under 5MB.");
  }

  const ext = getExtension(file.name);

  if (!["pdf", "docx", "txt", "md"].includes(ext)) {
    throw new Error(
      "Unsupported file type. Please upload PDF, DOCX, TXT, or MD."
    );
  }

  let text = "";

  try {
    if (ext === "pdf") {
      text = await extractPdf(file);
    } else if (ext === "docx") {
      text = await extractDocx(file);
    } else {
      text = await extractPlainText(file);
    }
  } catch (err) {
    console.error("Extraction error:", err);
    throw new Error(
      "Failed to read file. If it's a scanned PDF, paste text manually."
    );
  }

  // Normalize text
  const cleaned = (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length < MIN_USABLE_TEXT_LENGTH) {
    throw new Error(
      "Could not extract readable text. If it's a scanned PDF, paste manually."
    );
  }

  return cleaned;
}