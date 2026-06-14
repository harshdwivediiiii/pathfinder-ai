"use client";

import { useState } from "react";
import { generateResumeRoast } from "@/actions/resume-roast";
import { Flame, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import { extractResumeText } from "@/lib/extract-text";

export default function ResumeRoastPage() {
  const [loading, setLoading] = useState(false);
  const [resumeContent, setResumeContent] = useState("");
  const [roastData, setRoastData] = useState(null);
  
  // Upload States
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleRoast = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateResumeRoast(resumeContent);
    if (res.success) {
      toast.success("Resume roasted!");
      setRoastData(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to roast resume");
    }
    setLoading(false);
  };

  const handleFileSelect = async (file) => {
    try {
      setIsExtracting(true);
      setUploadSuccess(false);
      setExtractionProgress("Initializing extraction...");

      const extractedText = await extractResumeText(file, (progress) => {
        setExtractionProgress(progress);
      });

      if (extractedText && extractedText.trim().length > 0) {
        setResumeContent(extractedText);
        setUploadSuccess(true);
        toast.success("Text extracted successfully!");
      } else {
        toast.error("Could not extract meaningful text from this file.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to extract text. Please try pasting it manually.");
    } finally {
      setIsExtracting(false);
      setExtractionProgress("");
    }
  };

  const handleClearFile = () => {
    setResumeContent("");
    setUploadSuccess(false);
    setExtractionProgress("");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-[0.2em]">
              <Flame className="h-3 w-3" />
              Brutal Feedback
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Resume <span className="text-red-500">Roast</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Get brutally honest, witty feedback from our AI hiring manager. Not for the faint of heart.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Submit for Roasting</h3>
              
              <form onSubmit={handleRoast} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Upload Resume
                    </label>
                    <FileUpload 
                      onFileSelect={handleFileSelect}
                      isExtracting={isExtracting}
                      extractionProgress={extractionProgress}
                      success={uploadSuccess}
                      onClear={handleClearFile}
                    />
                  </div>
                  
                  <div className="relative py-2 flex items-center">
                    <div className="flex-grow border-t border-border/50"></div>
                    <span className="shrink-0 px-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      or paste text
                    </span>
                    <div className="flex-grow border-t border-border/50"></div>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste the text of your resume here. Let's see what you've got..."
                      className="min-h-[200px] rounded-xl resize-none bg-background focus-visible:ring-red-500 text-sm leading-relaxed"
                      value={resumeContent}
                      onChange={(e) => {
                        setResumeContent(e.target.value);
                        if (uploadSuccess && e.target.value === "") {
                          setUploadSuccess(false);
                        }
                      }}
                      required
                      disabled={isExtracting}
                    />
                    {uploadSuccess && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        * Please review and edit the extracted text above before submitting. OCR can occasionally make mistakes.
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || resumeContent.length < 50}
                  className="w-full h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                >
                  {loading ? "Igniting..." : "Roast Me"} <Flame className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {roastData ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-8"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <h2 className="text-3xl font-black text-red-500">The Verdict</h2>
                  <div className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-black text-2xl">
                    {roastData.score}/100
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground bg-red-500/5 p-6 rounded-2xl border border-red-500/20 text-lg leading-relaxed font-medium">
                  {roastData.roast}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-500" /> How to actually fix it
                  </h3>
                  <div className="space-y-3">
                    {roastData.fixes?.map((fix, idx) => (
                      <div key={idx} className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-sm font-medium flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{fix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Flame className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Ready for the heat?</h3>
                  <p className="text-muted-foreground text-sm">
                    Paste your resume on the left and prepare for some brutally honest, Gordon Ramsay-style feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
