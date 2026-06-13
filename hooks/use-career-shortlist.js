"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useCareerShortlist() {
  const [shortlist, setShortlist] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("career-shortlist");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(c => c && typeof c === 'object' && c.id && c.title)) {
          setShortlist(parsed);
        } else {
          setShortlist([]);
          localStorage.removeItem("career-shortlist");
        }
      }
    } catch (e) {
      console.error("Failed to load shortlist", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "career-shortlist") {
        try {
          if (e.newValue) {
            setShortlist(JSON.parse(e.newValue));
          } else {
            setShortlist([]);
          }
        } catch (error) {
          console.error("Error syncing shortlist across tabs", error);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveToStorage = (newShortlist) => {
    setShortlist(newShortlist);
    try {
      localStorage.setItem("career-shortlist", JSON.stringify(newShortlist));
      // Dispatch a custom event so other components in the same tab can update
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "career-shortlist",
          newValue: JSON.stringify(newShortlist),
        })
      );
    } catch (e) {
      console.error("Failed to save shortlist", e);
    }
  };

  const toggleShortlist = (career) => {
    const isSaved = shortlist.some((c) => c.id === career.id);

    if (isSaved) {
      saveToStorage(shortlist.filter((c) => c.id !== career.id));
      toast.info(`Removed ${career.title} from comparison`);
    } else {
      if (shortlist.length >= 3) {
        toast.error("You can only compare up to 3 careers at once.");
        return;
      }
      saveToStorage([...shortlist, career]);
      toast.success(`Added ${career.title} to comparison`);
    }
  };

  const clearShortlist = () => {
    saveToStorage([]);
    toast.info("Comparison list cleared");
  };

  const isShortlisted = (careerId) => {
    return shortlist.some((c) => c.id === careerId);
  };

  return {
    shortlist,
    toggleShortlist,
    clearShortlist,
    isShortlisted,
    isLoaded,
  };
}
