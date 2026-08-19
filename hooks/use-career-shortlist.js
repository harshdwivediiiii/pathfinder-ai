"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  getShortlistOwnerId,
  readShortlistForOwner,
  writeShortlistPayload,
} from "@/lib/misc/career-shortlist";

const STORAGE_KEY = "career-shortlist";

export function useCareerShortlist() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [shortlist, setShortlist] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const ownerId = getShortlistOwnerId(userId);

  useEffect(() => {
    if (!isAuthLoaded) {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = readShortlistForOwner(stored, ownerId);
      setShortlist(items ?? []);

      if (stored && items === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else if (items && items.length > 0) {
        localStorage.setItem(STORAGE_KEY, writeShortlistPayload(ownerId, items));
      }
    } catch (e) {
      console.error("Failed to load shortlist", e);
      setShortlist([]);
    } finally {
      setIsLoaded(true);
    }
  }, [isAuthLoaded, ownerId]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== STORAGE_KEY) {
        return;
      }

      try {
        if (e.newValue) {
          setShortlist(readShortlistForOwner(e.newValue, ownerId) ?? []);
        } else {
          setShortlist([]);
        }
      } catch (error) {
        console.error("Error syncing shortlist across tabs", error);
        setShortlist([]);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [ownerId]);

  const saveToStorage = (newShortlist) => {
    setShortlist(newShortlist);
    try {
      const payload = writeShortlistPayload(ownerId, newShortlist);
      if (newShortlist.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, payload);
      }
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: newShortlist.length === 0 ? null : payload,
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
    isLoaded: isLoaded && isAuthLoaded,
  };
}
