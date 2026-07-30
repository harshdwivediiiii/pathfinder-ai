import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAuthDecision } from "./lib/auth/routes";
import { validateDevBypass, validateVideoCoachBypass } from "./lib/auth/dev-bypass";
import { checkUser } from "./lib/auth/checkUser";

function addSecureHeaders(response) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.pathfinder.ai https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://clerk.pathfinder.ai https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.googleapis.com https://analytics.google.com https://www.google-analytics.com https://o4508291182551040.ingest.us.sentry.io https://sentry.io https://api.anthropic.com https://api-inference.huggingface.co https://inngest.com https://*.inngest.com wss://ws-us2.gitpod.io wss://*.gitpod.io",
    "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://accounts.google.com https://www.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie && process.env.NODE_ENV === "production") {
    response.headers.set(
      "Set-Cookie",
      setCookie.replace(/;\s*Secure(?=;|$)/gi, "").replace(/;\s*$/g, "") + "; Secure"
    );
  }

  return response;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  // Route protection rules (public routes, protected routes) are defined
  // and evaluated in lib/auth/routes.js using createRouteMatcher.
  const decision = await getAuthDecision(req, auth);

  // Auto-provision user on authenticated requests
  if (decision.action === "next") {
    try {
      await checkUser();
    } catch (error) {
      console.error("[middleware] checkUser failed:", error?.message ?? error);
    }
  }

  let response;
  switch (decision.action) {
    case "public":
    case "next":
      response = NextResponse.next();
      break;
    case "redirect":
      response = NextResponse.redirect(new URL(decision.signInUrl));
      break;
    case "deny":
      response = NextResponse.json(
        { error: "Unauthorized" },
        { status: decision.status || 401 }
      );
      break;
    default:
      response = NextResponse.next();
  }

  return addSecureHeaders(response);
});

export default function middleware(req, event) {
  /**
   * Development Authentication Bypass
   * 
   * This allows bypassing Clerk authentication during local development when:
   * - NODE_ENV is "development"
   * - SKIP_AUTH is set to "true"
   * - The request originates from localhost or 127.0.0.1
   * 
   * SECURITY: This bypass is validated with multiple safety checks to prevent
   * accidental deployment with disabled authentication. Unsafe configurations
   * will throw errors rather than silently continuing.
   */
  const skipAuthEnabled = process.env.SKIP_AUTH === "true";
  
  if (skipAuthEnabled) {
    const validation = validateDevBypass({
      hostname: req.nextUrl.hostname,
      skipAuthEnabled: true,
      reason: "SKIP_AUTH=true",
    });

    if (validation.allowed) {
      return addSecureHeaders(NextResponse.next());
    }

    // If validation failed with an error, throw it to fail fast
    if (validation.error) {
      throw validation.error;
    }
  }

  /**
   * Video-Coach Route Development Bypass
   * 
   * The video-coach feature bypasses authentication on localhost in development
   * to facilitate local development without requiring Clerk setup.
   * 
   * SECURITY: This bypass is validated to ensure it only works on localhost
   * in development mode. It will throw an error if used in production or
   * on non-localhost hosts.
   */
  if (/^\/interview\/video-coach(?:$|\/)/.test(req.nextUrl.pathname)) {
    const validation = validateVideoCoachBypass({
      hostname: req.nextUrl.hostname,
    });

    if (validation.allowed) {
      return addSecureHeaders(NextResponse.next());
    }

    // If validation failed with an error, throw it to fail fast
    if (validation.error) {
      throw validation.error;
    }
  }

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    // Always run for API/TRPC routes
    '/(api|trpc)(.*)',
  ],
};
