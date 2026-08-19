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

// ─── Crypto helpers for localStorage encryption ──────────────────────────
const STORAGE_KEY_PREFIX = "_enc_";
const AUTH_KEY_PATTERNS = [/^__clerk/, /^__session/, /auth/];

function shouldEncrypt(key) {
  return AUTH_KEY_PATTERNS.some((p) => p.test(key));
}

async function getEncryptionKey() {
  const existing = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}master`);
  if (existing) {
    const keyData = Uint8Array.from(atob(existing), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const exported = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  window.localStorage.setItem(`${STORAGE_KEY_PREFIX}master`, btoa(String.fromCharCode(...exported)));
  return key;
}

async function encryptValue(plain) {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptValue(encoded) {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

// ─── Exported helpers ─────────────────────────────────────────────────────
export const storageCrypto = {
  encrypt: encryptValue,
  decrypt: decryptValue,
  shouldEncrypt,
  resetKey() {
    window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}master`);
  },
};

/** Safe localStorage wrapper — never throws during SSR. Supports transparent AES-GCM encryption for auth tokens. */
export const safeLocalStorage = {
  async getItem(key) {
    if (!hasWebStorage()) return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return null;
      if (shouldEncrypt(key) && raw.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = raw.slice(STORAGE_KEY_PREFIX.length);
        const decrypted = await decryptValue(stored);
        return decrypted;
      }
      return raw;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    if (!hasWebStorage()) return;
    try {
      if (shouldEncrypt(key)) {
        const encrypted = await encryptValue(String(value));
        window.localStorage.setItem(key, STORAGE_KEY_PREFIX + encrypted);
      } else {
        window.localStorage.setItem(key, value);
      }
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
