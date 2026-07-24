"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pin, Trash2, Edit2, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNote, updateNote, deleteNote, togglePin } from "@/actions/workspace";
import { toast } from "sonner";
import { cn } from "@/lib/misc/utils";

export function NoteList({ workspaceId, notes = [] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [inFlightDeletes, setInFlightDeletes] = useState(new Set());
  const [inFlightPins, setInFlightPins] = useState(new Set());

  // Sorting: Pinned first, then newest
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    setLoadingAdd(true);
    try {
      await createNote(workspaceId, newNoteContent);
      toast.success("Note added");
      setNewNoteContent("");
      setIsAdding(false);
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return;
    setLoadingEdit(true);
    try {
      await updateNote(id, editContent);
      toast.success("Note updated");
      setEditingNoteId(null);
    } catch (error) {
      toast.error("Failed to update note");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    setInFlightDeletes(prev => new Set(prev).add(id));
    try {
      await deleteNote(id);
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    } finally {
      setInFlightDeletes(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleTogglePin = async (id) => {
    setInFlightPins(prev => new Set(prev).add(id));
    try {
      await togglePin("note", id);
    } catch (error) {
      toast.error("Failed to toggle pin");
    } finally {
      setInFlightPins(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notes</h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            Add Note
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 border rounded-xl bg-card space-y-4">
          <Textarea
            placeholder="Write your note here..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddNote} disabled={loadingAdd || !newNoteContent.trim()}>
              {loadingAdd && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Note
            </Button>
          </div>
        </div>
      )}

      {sortedNotes.length === 0 && !isAdding ? (
        <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20">
          <p className="text-muted-foreground">No notes added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "p-4 border rounded-xl bg-card flex flex-col group relative overflow-hidden transition-all",
                note.isPinned ? "border-amber-500/50 bg-amber-500/5 shadow-sm" : "hover:border-primary/50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(note.id)}
                    disabled={inFlightPins.has(note.id)}
                    aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                    title={note.isPinned ? "Unpin note" : "Pin note"}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      note.isPinned
                        ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100",
                      inFlightPins.has(note.id) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {inFlightPins.has(note.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pin className={cn("w-4 h-4", note.isPinned && "fill-current")} />
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit note"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setEditContent(note.content);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete note"
                    disabled={inFlightDeletes.has(note.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(note.id)}
                  >
                    {inFlightDeletes.has(note.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <div className="space-y-3 flex-1 flex flex-col">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 min-h-[100px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingNoteId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={loadingEdit || !editContent.trim()}
                    >
                      {loadingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap flex-1 text-foreground/90">
                  {note.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
