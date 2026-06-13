/**
 * @file browser.js
 * @description Browser-only utilities. Marked with "client-only" to prevent imports in server-only/SSR environments.
 */
import "client-only";

/** True when running in a browser environment. */
export function isBrowser() {
  return typeof window !== "undefined";
}

/** True when Web Storage is fully functional (not a Node.js stub). */
export function hasWebStorage() {
  if (!isBrowser()) {
    return false;
  }

  try {
    const { localStorage } = window;
    return (
      localStorage != null &&
      typeof localStorage.getItem === "function" &&
      typeof localStorage.setItem === "function"
    );
  } catch {
    return false;
  }
}

/** Safe localStorage wrapper — never throws during SSR. */
export const safeLocalStorage = {
  getItem(key) {
    if (!hasWebStorage()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (!hasWebStorage()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or private browsing — ignore
    }
  },
  removeItem(key) {
    if (!hasWebStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/** Safe sessionStorage wrapper — never throws during SSR. */
export const safeSessionStorage = {
  getItem(key) {
    if (!isBrowser()) return null;
    try {
      const { sessionStorage } = window;
      if (sessionStorage == null || typeof sessionStorage.getItem !== "function") {
        return null;
      }
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (!isBrowser()) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key) {
    if (!isBrowser()) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
