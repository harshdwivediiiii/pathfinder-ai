import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
      tracesSampleRate: 1,
      debug: false,
    });

    sanitizeBrokenWebStorage("localStorage");
    sanitizeBrokenWebStorage("sessionStorage");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
      tracesSampleRate: 1,
      debug: false,
    });
  }
}

function sanitizeBrokenWebStorage(name) {
  const storage = globalThis[name];

  if (storage === undefined || storage === null) {
    return;
  }

  if (typeof storage.getItem !== "function") {
    try {
      delete globalThis[name];
    } catch {
      globalThis[name] = undefined;
    }
  }
}
