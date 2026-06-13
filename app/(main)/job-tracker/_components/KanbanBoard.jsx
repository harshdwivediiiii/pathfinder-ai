"use client";

import { useState } from "react";
import JobCard from "./JobCard";
import AddJobModal from "./AddJobModal";
import { updateJobApplicationStatus } from "@/actions/job-tracker";
import { Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { JOB_STATUSES } from "@/lib/schemas/forms";

const COLUMN_CONFIG = {
  "Saved": { label: "Saved", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  "Applied": { label: "Applied", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  "Online Assessment (OA)": { label: "Online Assessment", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  "Interview": { label: "Interview", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  "Offer": { label: "Offer Received", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  "Rejected": { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const COLUMNS = JOB_STATUSES.map(status => ({
  id: status,
  label: COLUMN_CONFIG[status]?.label || status,
  color: COLUMN_CONFIG[status]?.color || "bg-gray-500/10 text-gray-500 border-gray-500/20"
}));

export default function KanbanBoard({ initialJobs, setJobs }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedJobId, setDraggedJobId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedJobId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Make the drag image slightly transparent
    setTimeout(() => {
      e.target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedJobId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/plain");
    if (!jobId) return;

    const job = initialJobs.find(j => j.id === jobId);
    if (job && job.status !== targetStatus) {
      // Optimistic update
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: targetStatus } : j));
      
      const res = await updateJobApplicationStatus(jobId, targetStatus);
      if (!res.success) {
        toast.error("Failed to update status");
        // Revert
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: job.status } : j));
      } else {
        toast.success("Job status updated");
      }
    }
  };

  const handleAddJob = (newJob) => {
    setJobs(prev => [newJob, ...prev]);
  };

  const handleDeleteJob = (id) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Application
        </button>
      </div>

      <div className="flex h-full overflow-x-auto gap-6 pb-4 custom-scrollbar snap-x">
        {COLUMNS.map(column => {
          const columnJobs = initialJobs.filter(j => 
            j.status === column.id || (column.id === "Saved" && j.status === "Wishlist")
          );
          
          return (
            <div 
              key={column.id} 
              className="flex flex-col flex-shrink-0 w-80 bg-muted/20 rounded-3xl border border-border overflow-hidden snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 border-b border-border/50 bg-muted/30 backdrop-blur-sm flex items-center justify-between">
                <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${column.color}`}>
                  {column.label}
                </div>
                <span className="text-muted-foreground text-sm font-medium bg-background px-2.5 py-0.5 rounded-full border border-border">
                  {columnJobs.length}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {columnJobs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground text-sm">
                    Drop applications here
                  </div>
                ) : (
                  columnJobs.map(job => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <JobCard job={job} onDelete={handleDeleteJob} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddJobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddJob} 
      />
    </div>
  );
}
