"use client";

import { useEffect } from "react";

type ShortcutMap = {
  [key: string]: () => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Build key identifier (e.g., "alt+1", "ctrl+k")
      const keyParts: string[] = [];
      if (e.altKey) keyParts.push("alt");
      if (e.ctrlKey || e.metaKey) keyParts.push("ctrl");
      if (e.shiftKey) keyParts.push("shift");
      keyParts.push(e.key.toLowerCase());

      const keyCombination = keyParts.join("+");

      const shortcut = shortcuts[keyCombination];
      if (shortcut) {
        e.preventDefault();
        shortcut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
