"use client";

import { useState, useRef, useEffect } from "react";
import { generateResumeContent, getResumeHistory } from "@/actions/resume-builder";
import { FileText, Download, Sparkles, Building, Briefcase } from "lucide-react";
import { isValidResume } from "@/lib/auth/type-guards";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RESUME_TEMPLATES, DEFAULT_TEMPLATE } from "@/components/resume-templates";
import DownloadPdf from "@/components/Download-pdf";

export default function ResumeBuilderPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);

  const resumeRef = useRef(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await getResumeHistory();

        if (res.success && res.data.length > 0) {
          setHistory(res.data);
          setActiveResume(res.data[0].content);
        }
      } catch (error) {
        console.error("Failed to load resume history:", error);
        toast.error("Failed to load resume history");
      }
    }

    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateResumeContent(jobDescription);
    if (res.success) {
      if (isValidResume(res.data.content)) {
        toast.success("Resume generated successfully!");
        setHistory((prev) => [res.data, ...prev]);
        setActiveResume(res.data.content);
      } else {
        toast.error("Generated resume has an invalid format.");
      }
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate resume");
    }
    setLoading(false);
  };

  const downloadPDF = async () => {
    if (typeof window === "undefined" || !resumeRef.current || !isValidResume(activeResume)) return;
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = resumeRef.current;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right
        filename: `${(activeResume.personalInfo?.name || "Resume").replace(/ /g, '_')}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <FileText className="h-3 w-3" />
              Resume Builder
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              ATS <span className="text-gradient-primary">Generator</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Paste a job description and the AI will craft a perfectly tailored, downloadable PDF resume.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Target Job</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Job Description
                  </label>
                  <Textarea
                    placeholder="Paste the full job description here..."
                    className="min-h-[300px] rounded-xl resize-none bg-background focus-visible:ring-primary text-sm"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || jobDescription.length < 50}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {loading ? "Crafting Resume..." : "Generate Resume"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeResume ? (
              !isValidResume(activeResume) ? (
                <div className="h-full flex items-center justify-center p-12 border border-destructive/20 bg-destructive/5 rounded-3xl text-center">
                  <div className="max-w-md space-y-4">
                    <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold text-destructive">Invalid Resume Format</h3>
                    <p className="text-muted-foreground text-sm">
                      The loaded or generated resume data contains invalid fields or is corrupted. Please try generating a new one.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                <div className="flex justify-end">
                  <Button onClick={downloadPDF} className="bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                </div>

               <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="flex gap-2">
                  {Object.entries(RESUME_TEMPLATES).map(([key, tpl]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        selectedTemplate === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <DownloadPdf
                  contentRefId="resume-preview-content"
                  fileName={`${(activeResume.personalInfo?.name || "Resume").replace(/ /g, "_")}_Resume.pdf`}
                />
              </div>

              <div className="bg-white text-black p-8 md:p-12 rounded-lg shadow-xl overflow-x-auto print:shadow-none print:p-0">
                <div id="resume-preview-content">
                  {(() => {
                    const ActiveTemplate = RESUME_TEMPLATES[selectedTemplate].component;
                    return <ActiveTemplate resume={activeResume} />;
                  })()}
                </div>
              </div>
              </motion.div>
             )
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Resume Generated</h3>
                  <p className="text-muted-foreground text-sm">
                    Paste a job description on the left to instantly generate an ATS-optimized PDF resume based on your profile.
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
