import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },

  // Clerk and Prisma should not be bundled into edge/server unnecessarily
  serverExternalPackages: ["@prisma/client"],

  experimental: {},
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "tancodex",
  project: "pathfinder-ai",
});