import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ClerkProviderWithTheme from "@/components/Clerkprovider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PathFinder AI",
  description: "Ypur AI-powered Career assistant",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProviderWithTheme >
      <html lang="en" suppressHydrationWarning>
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