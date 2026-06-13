import { useEffect } from "react";

/**
 * A custom hook to lock the background scroll when a boolean condition is met.
 * Useful for mobile menus, modals, and overlays.
 *
 * @param {boolean} isLocked - Whether to lock the scroll.
 */
export function useScrollLock(isLocked) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (isLocked) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
}
