"use client";

import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

// Initialize PDF.js worker using UNPKG to avoid Next.js bundling issues with web workers
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Extracts text from a PDF file using pdfjs-dist.
 * If the extracted text is very short (e.g. less than 50 chars), it might be a scanned PDF.
 */
async function extractTextFromPDF(file, onProgress) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (onProgress) {
        onProgress(`Parsing PDF Page ${pageNum} of ${pdf.numPages}...`);
      }
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n\n";
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to parse PDF file.");
  }
}

/**
 * Renders the first page of a PDF to a data URL (image) to pass to Tesseract for OCR.
 */
async function renderPDFToImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const page = await pdf.getPage(1); // Roast usually cares most about the first page anyway
  const scale = 2.0; // Higher scale for better OCR accuracy
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return canvas.toDataURL("image/png");
}

/**
 * Extracts text from an image file (or rendered PDF data URL) using Tesseract.js.
 */
async function extractTextFromImage(fileOrUrl, onProgress) {
  try {
    let imageUrl = fileOrUrl;
    
    // If it's a File object, create a local URL
    if (fileOrUrl instanceof File) {
      imageUrl = URL.createObjectURL(fileOrUrl);
    }
    
    const worker = await Tesseract.createWorker("eng", 1, {
      logger: m => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(`Extracting Text (OCR): ${Math.round(m.progress * 100)}%`);
        } else if (onProgress && m.status) {
          onProgress(`OCR Status: ${m.status}`);
        }
      }
    });
    
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();
    
    if (fileOrUrl instanceof File) {
      URL.revokeObjectURL(imageUrl);
    }
    
    return text.trim();
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw new Error("Failed to extract text from image.");
  }
}

/**
 * Main export to extract text from an uploaded resume.
 * Intelligently handles PDFs vs Images.
 * @param {File} file - The uploaded file.
 * @param {Function} onProgress - Callback for loading states.
 * @returns {Promise<string>} - Extracted text.
 */
export async function extractResumeText(file, onProgress) {
  const isPDF = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  
  if (!isPDF && !isImage) {
    throw new Error("Unsupported file format.");
  }
  
  if (isImage) {
    return await extractTextFromImage(file, onProgress);
  }
  
  if (isPDF) {
    onProgress?.("Reading PDF...");
    const parsedText = await extractTextFromPDF(file, onProgress);
    
    // If the PDF is basically empty (e.g., < 100 characters), it's likely a scanned PDF image.
    if (parsedText.length < 100) {
      onProgress?.("Detected scanned PDF. Switching to OCR...");
      const imageUrl = await renderPDFToImage(file);
      const ocrText = await extractTextFromImage(imageUrl, onProgress);
      return ocrText;
    }
    
    return parsedText;
  }
}
