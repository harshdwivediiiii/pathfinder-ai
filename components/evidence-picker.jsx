"use client";

import { useState, useEffect } from "react";
import { getEvidenceItems, suggestEvidenceForText } from "@/actions/evidence";
import { Check, Sparkles, Lock, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EvidencePicker({ textContext, selectedIds = [], onSelect }) {
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getEvidenceItems();
      if (res.success) {
        setItems(res.data);
      }
      setLoading(false);
    }
    if (open) {
      load();
    }
  }, [open]);

  const handleSuggest = async () => {
    if (!textContext) {
      toast.error("No context provided for suggestions.");
      return;
    }
    setSuggesting(true);
    const res = await suggestEvidenceForText(textContext, items);
    if (res.success) {
      setSuggestions(res.data);
      toast.success("Suggestions loaded!");
    } else {
      toast.error("Failed to load suggestions.");
    }
    setSuggesting(false);
  };

  const toggleSelect = (id) => {
    let newSelected;
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter(i => i !== id);
    } else {
      newSelected = [...selectedIds, id];
    }
    onSelect(newSelected);
  };

  const getSuggestionReason = (id) => {
    const sug = suggestions.find(s => s.id === id);
    return sug ? sug.reason : null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full">
          <Lock className="h-3 w-3" />
          <span className="text-xs">Attach Evidence</span>
          {selectedIds.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {selectedIds.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Attach Evidence
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center py-2 border-b">
          <p className="text-sm text-muted-foreground">
            Select items from your Evidence Locker to back up this claim.
          </p>
          <Button 
            onClick={handleSuggest} 
            disabled={suggesting || items.length === 0} 
            variant="secondary" 
            size="sm"
          >
            <Sparkles className="mr-2 h-3 w-3 text-amber-500" />
            {suggesting ? "Analyzing..." : "Auto-Suggest"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse h-6 w-6 bg-primary rounded-full"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p className="mb-4">Your Evidence Locker is empty.</p>
              <Button asChild variant="outline">
                <a href="/evidence-locker" target="_blank" rel="noopener noreferrer">
                  Go to Evidence Locker
                </a>
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const reason = getSuggestionReason(item.id);

              return (
                <div 
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : reason 
                        ? "border-amber-500/50 bg-amber-500/5 hover:border-amber-500" 
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                    <div className="shrink-0 ml-4">
                      {isSelected ? (
                        <div className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 border-2 border-muted-foreground/30 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {item.category}
                  </span>
                  
                  {reason && (
                    <div className="mt-2 p-2 bg-amber-500/10 rounded-lg text-xs flex items-start gap-2">
                      <Sparkles className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-700 dark:text-amber-300 leading-relaxed">{reason}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
