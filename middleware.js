import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAuthDecision } from "./lib/auth/routes";
import { validateDevBypass, validateE2EBypass, validateVideoCoachBypass } from "./lib/auth/dev-bypass";

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

  const cookies = [...response.headers.entries()]
    .filter(([key]) => key.toLowerCase() === "set-cookie")
    .map(([, value]) => value);
  if (cookies.length && process.env.NODE_ENV === "production") {
    response.headers.delete("Set-Cookie");
    for (const cookie of cookies) {
      response.headers.append(
        "Set-Cookie",
        cookie.replace(/;\s*Secure(?=;|$)/gi, "").replace(/;\s*$/g, "") + "; Secure"
      );
    }
  }

  return response;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  // Route protection rules (public routes, protected routes) are defined
  // and evaluated in lib/auth/routes.js using createRouteMatcher.
  // Note: user auto-provisioning is handled by the Clerk webhook
  // (app/api/webhooks/clerk/route.js), keeping the Edge middleware lean.
  const decision = await getAuthDecision(req, auth);

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
  const isE2ETest = process.env.E2E_TEST === "true";

  /**
   * E2E Test Authentication Bypass
   *
   * The Playwright end-to-end suite bypasses Clerk authentication when
   * E2E_TEST is set to "true". This bypass is validated with the same safety
   * checks used for SKIP_AUTH: it is never allowed in production and only
   * works on localhost/127.0.0.1. Unsafe configurations throw instead of
   * silently disabling authentication.
   */
  const e2eValidation = validateE2EBypass({
    hostname: req.nextUrl.hostname,
    e2eTestEnabled: isE2ETest,
  });

  if (e2eValidation.allowed) {
    return addSecureHeaders(NextResponse.next());
  }

  // If validation failed with an error, throw it to fail fast
  if (e2eValidation.error) {
    throw e2eValidation.error;
  }
  
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

    // Not allowed (e.g. production) -> fall through to normal Clerk auth.
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
