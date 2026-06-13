"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Briefcase, MapPin, DollarSign, Link as LinkIcon, Calendar, Sparkles } from "lucide-react";
import { createJobApplication } from "@/actions/job-tracker";
import { getATSAnalyses, analyzeATS } from "@/actions/ats";
import { getCoverLetters } from "@/actions/cover-letter";
import { getResume } from "@/actions/resume";
import { parseJobUrl } from "@/actions/job-scraper";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JOB_STATUSES } from "@/lib/schemas/forms";

export default function AddJobModal({ isOpen, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [atsAnalyses, setAtsAnalyses] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [baseResume, setBaseResume] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  
  const [formData, setFormData] = useState({
    companyName: "",
    jobTitle: "",
    status: "Saved",
    location: "",
    salary: "",
    url: "",
    atsAnalysisId: "",
    coverLetterId: "",
    interviewDate: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setMatchScore(null);
    }
  }, [isOpen]);

  async function loadData() {
    try {
      const [atsRes, clRes, resumeRes] = await Promise.all([
        getATSAnalyses(),
        getCoverLetters(),
        getResume(),
      ]);
      if (atsRes.success) {
        setAtsAnalyses(atsRes.data);
      }
      if (clRes) {
        setCoverLetters(clRes);
      }
      if (resumeRes) {
        setBaseResume(resumeRes);
      }
    } catch (err) {
      console.error("Failed to load modal details:", err);
    }
  }

  const handleParseUrl = async () => {
    if (!formData.url) return toast.error("Please enter a URL first.");
    setParsing(true);
    try {
      const res = await parseJobUrl(formData.url);
      if (res.success) {
        toast.success("Job parsed successfully!");
        const { companyName, jobTitle, location, salary, jobDescription } = res.data;
        
        let newNotes = formData.notes;
        if (jobDescription) {
          const checkDesc = jobDescription.slice(0, 100);
          if (!formData.notes || !formData.notes.includes(checkDesc)) {
            newNotes = formData.notes ? formData.notes + "\n\n" + jobDescription : jobDescription;
          }
        }

        setFormData(p => ({
          ...p,
          companyName: companyName || p.companyName,
          jobTitle: jobTitle || p.jobTitle,
          location: location || p.location,
          salary: salary || p.salary,
          notes: newNotes,
        }));

        if (baseResume && jobDescription) {
          const existingAnalysis = atsAnalyses.find(a => 
            a.jobDescription === jobDescription || 
            (a.companyName === companyName && a.jobTitle === jobTitle)
          );

          if (existingAnalysis) {
            setFormData(p => ({ ...p, atsAnalysisId: existingAnalysis.id }));
            setMatchScore(existingAnalysis.atsScore);
            toast.success("Using existing ATS Match Score!", { id: "ats" });
          } else {
            toast.loading("Analyzing ATS Match...", { id: "ats" });
            const atsRes = await analyzeATS({
              resumeContent: baseResume.content,
              jobDescription,
              jobTitle: jobTitle || "Target Role",
              companyName: companyName || "Target Company",
            });
            if (atsRes.success) {
              toast.success("Match Score calculated!", { id: "ats" });
              setAtsAnalyses(prev => [atsRes.data, ...prev]);
              setFormData(p => ({ ...p, atsAnalysisId: atsRes.data.id }));
              setMatchScore(atsRes.data.atsScore);
            } else {
              toast.error("ATS analysis failed.", { id: "ats" });
            }
          }
        }
      } else {
        toast.error(res.errors?._form?.[0] || "Parsing failed.");
      }
    } catch (error) {
      toast.error("Failed to parse URL.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };
      if (payload.status !== "Interview") {
        delete payload.interviewDate;
      }
      const res = await createJobApplication(payload);
      if (res.success) {
        toast.success("Application added successfully!");
        onAdd(res.data);
        setFormData({
          companyName: "",
          jobTitle: "",
          status: "Saved",
          location: "",
          salary: "",
          url: "",
          atsAnalysisId: "",
          coverLetterId: "",
          interviewDate: "",
          notes: "",
        });
        onClose();
      } else {
        toast.error(res.errors?._form?.[0] || "Failed to add application");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/30">
            <h2 className="text-xl font-bold text-foreground">Add Application</h2>
            <button
              onClick={onClose}
              className="p-2 bg-background rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-4">
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Job Posting URL"
                    className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                    value={formData.url}
                    onChange={e => setFormData(p => ({ ...p, url: e.target.value }))}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleParseUrl}
                  disabled={parsing}
                  className="h-12 px-4 rounded-xl flex items-center gap-2"
                >
                  {parsing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                  Auto-fill
                </Button>
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="Job Title"
                  className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                  value={formData.jobTitle}
                  onChange={e => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                />
              </div>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="Company Name"
                  className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                  value={formData.companyName}
                  onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Location"
                    className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Salary"
                    className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                    value={formData.salary}
                    onChange={e => setFormData(p => ({ ...p, salary: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {JOB_STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, status: s }))}
                      className={`py-2 text-[11px] font-bold rounded-lg border transition-all truncate px-1 ${
                        formData.status === s 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {formData.status === "Interview" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    Interview Date & Time
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                      value={formData.interviewDate}
                      onChange={e => setFormData(p => ({ ...p, interviewDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {coverLetters.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    Link Cover Letter (Optional)
                  </label>
                  <select
                    className="w-full h-12 px-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={formData.coverLetterId}
                    onChange={e => setFormData(p => ({ ...p, coverLetterId: e.target.value }))}
                  >
                    <option value="">-- None --</option>
                    {coverLetters.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.jobTitle} @ {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {atsAnalyses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                    Link ATS Analysis (Optional)
                  </label>
                  <select
                    className="w-full h-12 px-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={formData.atsAnalysisId}
                    onChange={e => setFormData(p => ({ ...p, atsAnalysisId: e.target.value }))}
                  >
                    <option value="">-- None --</option>
                    {atsAnalyses.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.jobTitle || "Untitled"} @ {a.companyName || "Unknown"} (Score: {a.atsScore})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {matchScore !== null && (
              <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary">ATS Match Score</span>
                  <span className="text-xs text-primary/80 font-medium">Compared to your base resume</span>
                </div>
                <span className="text-3xl font-extrabold text-primary">{matchScore}%</span>
              </div>
            )}

            <div className="pt-4 border-t border-border/50">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold text-md"
              >
                {loading ? "Adding..." : "Add to Tracker"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
