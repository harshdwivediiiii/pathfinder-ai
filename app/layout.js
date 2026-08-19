import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import PropTypes from "prop-types";
import { Providers } from "@/components/providers";
import { BackgroundEngine } from "@/components/backgrounds";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { getEnv } from "@/lib/security/env";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings } from "@/actions/settings";
import AIMentorChat from "@/components/chat/ai-mentor-chat";

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
export default async function RootLayout(props) {
  const { children } = props;
  
  let userId = null;
  try {
    const authResult = await auth();
    userId = authResult?.userId;
  } catch (error) {
    // Clerk throws if middleware is bypassed; ignore safely for local bypass
    console.warn("Clerk auth bypassed or unavailable in layout.");
  }
  
  let settings = null;
  if (userId) {
    try {
      settings = await getUserSettings();
    } catch (e) {
      console.error("Failed to load settings in layout", e);
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
          afterSignOutUrl="/"
        >
          <Providers initialAccessibilitySettings={settings}>
            <BackgroundEngine />
            <ScrollProgress />
            <CursorGlow />
            <main className="min-h-screen">{children}</main>
            {userId && <AIMentorChat />}
            <Toaster richColors />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
