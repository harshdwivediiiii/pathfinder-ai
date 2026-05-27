"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileLoader } from "lucide-react";
import { toast } from "sonner";

export default function DownloadPdf({ contentRefId, fileName, label = "Download PDF" }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    const element = document.getElementById(contentRefId);
    if (!element) {
      toast.error("Content not found for PDF generation.");
      return;
    }

    setIsGenerating(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      
      const opt = {
        margin: [15, 15],
        filename: fileName || "document.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload} 
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
