import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import PropTypes from "prop-types";
import { Providers } from "@/components/providers";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { BackgroundEngine } from "@/components/backgrounds";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { getEnv } from "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PathFinder AI",
  description: "Your AI-powered Career Assistant",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout(props) {
  const { children } = props;

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignOutUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Providers>
            <BackgroundEngine />
            <ScrollProgress />
            <CursorGlow />
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

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
