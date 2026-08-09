"use client";

import { useState, useEffect } from "react";
import { getEvidenceItems, deleteEvidenceItem } from "@/actions/evidence";
import { Lock, Plus, Link as LinkIcon, Trash2, Edit, Tag, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EvidenceFormDialog } from "./_components/EvidenceFormDialog";

export default function EvidenceLockerPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    async function loadItems() {
      const res = await getEvidenceItems();
      if (res.success) {
        setItems(res.data);
      }
      setLoading(false);
    }
    loadItems();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this evidence item?")) return;
    
    const res = await deleteEvidenceItem(id);
    if (res.success) {
      setItems(items.filter((item) => item.id !== id));
      toast.success("Item deleted");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to delete item");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleSuccess = (savedItem) => {
    if (editingItem) {
      setItems(items.map((i) => (i.id === savedItem.id ? savedItem : i)));
    } else {
      setItems([savedItem, ...items]);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      GITHUB: "bg-gray-500/10 text-gray-500",
      CERTIFICATE: "bg-yellow-500/10 text-yellow-500",
      PROJECT: "bg-blue-500/10 text-blue-500",
      METRIC: "bg-green-500/10 text-green-500",
      ARTICLE: "bg-purple-500/10 text-purple-500",
      RECOMMENDATION: "bg-orange-500/10 text-orange-500",
      OTHER: "bg-slate-500/10 text-slate-500"
    };
    return colors[category] || colors.OTHER;
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
              <Lock className="h-3 w-3" />
              Career Assets
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Impact <span className="text-gradient-primary">Evidence Locker</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl">
              Build a verified career proof library. Save links to PRs, metrics dashboards, and certificates to back up your resume claims and interview stories.
            </p>
          </div>
          <Button onClick={handleAdd} className="rounded-full shadow-lg h-12 px-6">
            <Plus className="mr-2 h-4 w-4" /> Add Evidence
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse h-8 w-8 bg-primary rounded-full"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center bg-card/50 backdrop-blur-sm">
            <div className="max-w-md space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Your locker is empty</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Start adding proof items like GitHub PRs, performance dashboards, or certificates. PathFinder AI will suggest using them in your resumes and STAR stories.
              </p>
              <Button onClick={handleAdd} variant="outline" className="rounded-full">
                Add your first item
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-start justify-between mb-3 pr-16">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold mb-2 line-clamp-2">{item.title}</h3>
                
                {item.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>
                )}

                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-4">
                    <ExternalLink className="mr-1 h-3 w-3" /> View Source
                  </a>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/50">
                    {item.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        <Tag className="mr-1 h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <EvidenceFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        initialData={editingItem} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}
