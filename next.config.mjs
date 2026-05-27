/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  // Clerk and Prisma should not be bundled into edge/server unnecessarily
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    //optimizePackageImports: ["lucide-react", "framer-motion", "@clerk/nextjs"],
  },
};

export default nextConfig;
