  import "server-only";
  import { createRouteMatcher } from "@clerk/nextjs/server";
  import { validateVideoCoachBypass } from "./dev-bypass";

export const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/dev/status",
  // Inngest requires this route to be public so its cloud/dev server
  // can invoke background jobs without Clerk authentication.
  "/api/inngest",
  "/explore(.*)",
  "/compare(.*)",
  "/skill-gap-analyzer(.*)",
]);

  export const isAuthedAppRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/onboarding(.*)",
    "/workspace(.*)",
    "/resume(.*)",
    "/ai-cover-letter(.*)",
    "/ai-assistant(.*)",
    "/interview(.*)",
    "/ats-analyzer(.*)",
    "/settings(.*)",
    "/job-tracker(.*)",
    "/linkedin-optimizer(.*)",
    "/networking(.*)",
    "/project-ideas(.*)",
    "/roadmap(.*)",
    "/side-hustle(.*)",
    "/remote-work(.*)",
    "/manager-readme(.*)",
    "/imposter-syndrome(.*)",
    "/founder-readiness(.*)",
    "/executive-presence(.*)",
  ]);

  const isApiRoute = createRouteMatcher([
    "/api/(.*)",
  ]);

  export const isProtectedApiRoute = (req) => isApiRoute(req) && !isPublicRoute(req);

  /**
   * Determines the auth decision for a given request.
   * 
   * @param {import("next/server").NextRequest} req 
   * @param {Function} auth - Clerk's auth function (or an async function/thunk returning { userId })
   * @returns {Promise<{ action: 'public' | 'redirect' | 'deny' | 'next', signInUrl?: string, status?: number }>}
   */
  export async function getAuthDecision(req, auth) {
    if (isPublicRoute(req)) {
      return { action: "public" };
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
        return { action: "next" };
      }

      // Not allowed (e.g. production) -> fall through to normal auth checks.
    }

    // Get userId only when evaluating protected routes (app or API)
    const { userId } = await auth();

    if (isAuthedAppRoute(req)) {
      if (!userId) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
        return { action: "redirect", signInUrl: signInUrl.toString() };
      }
      return { action: "next" };
    }

    if (isProtectedApiRoute(req)) {
      if (!userId) {
        return { action: "deny", status: 401 };
      }
      return { action: "next" };
    }

    return { action: "next" };
  }
