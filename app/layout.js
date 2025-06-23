import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import ClerkProviderWithTheme from "@/components/Clerkprovider";
import Footer from "@/components/Footer";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PathFinder AI",
  description: "Ypur AI-powered Career assistant",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProviderWithTheme >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWithTheme>
  );
}