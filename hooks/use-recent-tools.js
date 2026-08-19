"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recent-tools";
const MAX_RECENT_TOOLS = 5;

function isValidEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.href === "string" &&
    entry.href.length > 0 &&
    typeof entry.accessedAt === "string" &&
    !Number.isNaN(Date.parse(entry.accessedAt))
  );
}

function isValidList(value) {
  return Array.isArray(value) && value.every(isValidEntry);
}

export function useRecentTools() {
  const [recentTools, setRecentTools] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const readStorage = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setRecentTools([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!isValidList(parsed)) {
        window.localStorage.removeItem(STORAGE_KEY);
        setRecentTools([]);
        return;
      }

      setRecentTools(parsed.slice(0, MAX_RECENT_TOOLS));
    } catch (error) {
      console.error("Failed to read recent tools:", error);

      window.localStorage.removeItem(STORAGE_KEY);
      setRecentTools([]);
    }
  }, []);

  useEffect(() => {
    readStorage();
    setIsLoaded(true);

    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY) {
        readStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [readStorage]);

  const writeStorage = useCallback((tools) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tools)
      );

      setRecentTools(tools);

      // Trigger same-tab listeners.
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: JSON.stringify(tools),
          storageArea: window.localStorage,
        })
      );
    } catch (error) {
      console.error("Failed to save recent tools:", error);
    }
  }, []);

  const addRecentTool = useCallback(
    (href) => {
      if (!href) return;

      setRecentTools((currentTools) => {
        const updatedTools = [
          {
            href,
            accessedAt: new Date().toISOString(),
          },
          ...currentTools.filter((tool) => tool.href !== href),
        ].slice(0, MAX_RECENT_TOOLS);

        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedTools)
          );

          window.dispatchEvent(
            new StorageEvent("storage", {
              key: STORAGE_KEY,
              newValue: JSON.stringify(updatedTools),
              storageArea: window.localStorage,
            })
          );
        } catch (error) {
          console.error("Failed to save recent tool:", error);
        }

        return updatedTools;
      });
    },
    []
  );

  const clearRecentTools = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setRecentTools([]);

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: null,
          storageArea: window.localStorage,
        })
      );
    } catch (error) {
      console.error("Failed to clear recent tools:", error);
    }
  }, []);

  return {
    recentTools,
    addRecentTool,
    clearRecentTools,
    isLoaded,
  };
}