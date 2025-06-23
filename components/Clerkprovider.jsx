"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function ClerkProviderWithTheme({ children }) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "#6366f1", // Tailwind indigo-500 (optional)
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
