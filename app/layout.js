import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getEnv } from "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

// Validate env at startup (throws in production if misconfigured)
getEnv();

export const metadata = {
  title: "PathFinder AI",
  description: "Your AI-powered Career Assistant",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Providers>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
            <Footer />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
