import "server-only";
import { createRouteMatcher } from "@clerk/nextjs/server";

export const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/dev/status",
  "/explore(.*)",
  "/compare(.*)",
  "/skill-gap-analyzer(.*)",
]);

export const isAuthedAppRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
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
