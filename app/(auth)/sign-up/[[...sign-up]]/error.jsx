"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpError({ error, reset }) {
  useEffect(() => {
    console.error("[sign-up/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-xl font-semibold">Sign Up Error</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        {error?.message || "Please try again in a moment."}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Retry</Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
