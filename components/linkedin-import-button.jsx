"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { extractResumeText } from "@/lib/resume/extract-text";
import { importLinkedInProfile } from "@/actions/linkedin-import";
import { useRouter } from "next/navigation";

export default function LinkedinImportButton({ className, onImportComplete, variant = "default" }) {
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload your LinkedIn profile as a PDF.");
      return;
    }

    setLoading(true);
    setProgressMsg("Extracting text from PDF...");

    try {
      // 1. Extract text
      const extractedText = await extractResumeText(file, (msg) => setProgressMsg(msg));
      
      if (!extractedText || extractedText.trim().length < 100) {
        throw new Error("Could not extract enough text from the PDF. Make sure it's a valid LinkedIn export.");
      }

      setProgressMsg("Analyzing profile with AI...");
      
      // 2. Call server action
      const res = await importLinkedInProfile(extractedText);
      
      if (res.success) {
        toast.success("Profile imported successfully!");
        if (onImportComplete) {
          onImportComplete(res.data);
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.errors?._form?.[0] || "Failed to import profile");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "An error occurred during import.");
    } finally {
      setLoading(false);
      setProgressMsg("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="application/pdf"
        className="hidden"
      />
      <Button
        variant={variant}
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progressMsg || "Importing..."}
          </>
        ) : (
          <>
            <Linkedin className="mr-2 h-4 w-4" />
            Import from LinkedIn
          </>
        )}
      </Button>
    </>
  );
}
