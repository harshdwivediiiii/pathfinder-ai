"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2, ExternalLink, FileText, ScanSearch, MapPin, DollarSign, Calendar, Clock, AlertCircle, Wand2 } from "lucide-react";
import { deleteJobApplication, updateJobApplicationInterviewDate } from "@/actions/job-tracker";
import { toast } from "sonner";
import Link from "next/link";

export default function JobCard({ job, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [interviewDate, setInterviewDate] = useState(() => {
    if (!job.interviewDate) return "";
    const d = new Date(job.interviewDate);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  });
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this application?")) {
      setIsDeleting(true);
      const res = await deleteJobApplication(job.id);
      if (res.success) {
        toast.success("Application deleted");
        onDelete(job.id);
      } else {
        toast.error("Failed to delete application");
        setIsDeleting(false);
      }
    }
  };

  const handleUpdateDate = async (e) => {
    e.preventDefault();
    setIsUpdatingDate(true);
    const res = await updateJobApplicationInterviewDate(job.id, interviewDate);
    if (res.success) {
      toast.success("Interview date updated");
      const newDate = interviewDate ? new Date(interviewDate) : null;
      if (newDate && !isNaN(newDate.getTime())) {
        job.interviewDate = newDate;
      }
      setShowDatePicker(false);
    } else {
      toast.error("Failed to update interview date");
    }
    setIsUpdatingDate(false);
  };

  const handleCalendarLink = () => {
    if (!job.interviewDate) return "";
    const title = `Interview: ${job.jobTitle} at ${job.companyName}`;
    const details = `Interview for the ${job.jobTitle} position at ${job.companyName}.\nNotes: ${job.notes || ""}`;
    const start = new Date(job.interviewDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(start)}/${formatDate(end)}&details=${encodeURIComponent(details)}`;
  };

  const updateDate = new Date(job.updatedAt);
  const isValidDate = !isNaN(updateDate.getTime());
  const daysSinceUpdate = isValidDate ? Math.floor((new Date() - updateDate) / (1000 * 60 * 60 * 24)) : 0;
  const needsFollowUp = job.status === "Applied" && isValidDate && daysSinceUpdate >= 7;

  return (
    <div className="group relative bg-background border border-border p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="pr-10">
        <h3 className="font-bold text-foreground text-base leading-tight mb-1 truncate">
          {job.jobTitle}
        </h3>
        <p className="text-sm text-primary font-semibold truncate mb-3">
          {job.companyName}
        </p>
      </div>

      {needsFollowUp && (
        <div className="mb-3 px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-lg flex items-center gap-1.5 w-fit">
          <AlertCircle className="h-3 w-3" />
          Follow-up Required ({daysSinceUpdate} days)
        </div>
      )}

      <div className="space-y-2 mb-4">
        {job.location && (
          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.salary && (
          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="truncate">{job.salary}</span>
          </div>
        )}
      </div>

      {job.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-xl border border-border/50 mb-4 font-medium">
          {job.notes}
        </p>
      )}

      {job.status === "Interview" && (
        <>
          {job.interviewDate ? (
            <div className="mt-3 p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-amber-500 font-bold">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Interview Scheduled
                </span>
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="text-[10px] hover:underline"
                >
                  Reschedule
                </button>
              </div>
              <div className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(job.interviewDate).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <a
                href={handleCalendarLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-1.5 px-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-bold text-[11px] mt-1 flex items-center justify-center gap-1 shadow-sm"
              >
                Add to Google Calendar
              </a>
            </div>
          ) : (
            <div className="mt-3">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full py-1.5 px-3 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all font-bold text-xs flex items-center justify-center gap-1"
              >
                <Calendar className="h-3.5 w-3.5" />
                Schedule Interview
              </button>
            </div>
          )}
        </>
      )}

      {showDatePicker && (
        <form onSubmit={handleUpdateDate} className="mt-3 p-3 bg-muted/50 rounded-xl border border-border flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">
            Interview Date & Time
          </label>
          <input
            type="datetime-local"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDatePicker(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingDate}
              className="px-2.5 py-1 text-[11px] font-bold bg-primary text-white hover:bg-primary/90 rounded-md disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
        
        {/* Tailored Generation Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Link
            href={`/resume-builder?jobTitle=${encodeURIComponent(job.jobTitle || 'unknown')}&company=${encodeURIComponent(job.companyName || 'unknown')}`}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 rounded-lg text-[10px] font-bold transition-colors"
          >
            <Wand2 className="h-3 w-3" />
            Tailor Resume
          </Link>
          <Link
            href={`/ai-cover-letter?jobTitle=${encodeURIComponent(job.jobTitle || 'unknown')}&company=${encodeURIComponent(job.companyName || 'unknown')}`}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20 rounded-lg text-[10px] font-bold transition-colors"
          >
            <Wand2 className="h-3 w-3" />
            Write Letter
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {job.url && (
              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                title="Job Posting URL"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            
            <Link 
              href="/resume"
              className="p-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
              title="View Resume"
            >
              <FileText className="h-3.5 w-3.5 text-blue-500" />
            </Link>

            {job.coverLetterId && (
              <Link 
                href={`/ai-cover-letter?id=${job.coverLetterId}`}
                className="p-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
                title="View Linked Cover Letter"
              >
                <FileText className="h-3.5 w-3.5 text-purple-500" />
              </Link>
            )}

            {job.atsAnalysisId && (
              <Link 
                href={`/ats-analyzer?id=${job.atsAnalysisId}`}
                className="p-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
                title="View ATS Analysis"
              >
                <ScanSearch className="h-3.5 w-3.5 text-green-500" />
                {job.atsAnalysis?.atsScore && (
                  <span className="text-[10px] font-bold text-green-500">{job.atsAnalysis.atsScore}</span>
                )}
              </Link>
            )}
          </div>
          
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isValidDate ? formatDistanceToNow(updateDate, { addSuffix: true }) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
