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

  experimental: {
    // optimizePackageImports: ["lucide-react", "framer-motion", "@clerk/nextjs"],
  },
  output: "standalone",
};

export default nextConfig;