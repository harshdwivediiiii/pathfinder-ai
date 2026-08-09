"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createEvidenceItem, updateEvidenceItem } from "@/actions/evidence";

const CATEGORIES = ["GITHUB", "CERTIFICATE", "PROJECT", "METRIC", "ARTICLE", "RECOMMENDATION", "OTHER"];

export function EvidenceFormDialog({ open, onOpenChange, initialData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "PROJECT",
    description: "",
    tags: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        url: initialData.url || "",
        category: initialData.category || "PROJECT",
        description: initialData.description || "",
        tags: initialData.tags?.join(", ") || "",
      });
    } else {
      setFormData({
        title: "",
        url: "",
        category: "PROJECT",
        description: "",
        tags: "",
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const tagsArray = formData.tags
      ? formData.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    const payload = {
      ...formData,
      tags: tagsArray,
    };

    let res;
    if (initialData?.id) {
      res = await updateEvidenceItem(initialData.id, payload);
    } else {
      res = await createEvidenceItem(payload);
    }

    if (res.success) {
      toast.success(initialData ? "Evidence updated!" : "Evidence added!");
      onSuccess(res.data);
      onOpenChange(false);
    } else {
      const err = res.errors?._form?.[0] || res.errors?.title?.[0] || res.errors?.url?.[0] || "Something went wrong";
      toast.error(err);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Evidence" : "Add Evidence"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              required 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. Improved API Latency by 40%" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">URL (Optional)</Label>
            <Input 
              id="url" 
              type="url" 
              value={formData.url} 
              onChange={(e) => setFormData({ ...formData, url: e.target.value })} 
              placeholder="https://github.com/pull/123" 
            />
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Briefly describe what this proves..." 
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Comma-separated)</Label>
            <Input 
              id="tags" 
              value={formData.tags} 
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })} 
              placeholder="React, Performance, API" 
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
