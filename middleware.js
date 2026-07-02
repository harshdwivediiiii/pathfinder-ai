import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAuthDecision } from "./lib/auth/routes";

const clerkHandler = clerkMiddleware(async (auth, req) => {
  // Route protection rules (public routes, protected routes) are defined
  // and evaluated in lib/auth/routes.js using createRouteMatcher.
  const decision = await getAuthDecision(req, auth);

  switch (decision.action) {
    case "public":
    case "next":
      return NextResponse.next();
    case "redirect":
      return NextResponse.redirect(new URL(decision.signInUrl));
    case "deny":
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: decision.status || 401 }
      );
    default:
      return NextResponse.next();
  }
});

export default function middleware(req, event) {
  if (process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "true") {
    return NextResponse.next();
  }

  // Bypass Clerk completely for video-coach on localhost in development
  const isLocalhost = req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";
  if (process.env.NODE_ENV === "development" && isLocalhost && /^\/interview\/video-coach(?:$|\/)/.test(req.nextUrl.pathname)) {
    return NextResponse.next();
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
