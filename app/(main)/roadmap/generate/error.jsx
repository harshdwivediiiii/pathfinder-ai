"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GenerateRoadmapError({ error, reset }) {
  useEffect(() => {
    console.error("[roadmap/generate/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-xl font-semibold">Roadmap Generation Error</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        {error?.message || "Please try again in a moment."}
      </p>
      <Button onClick={() => reset()}>Retry</Button>
    </div>
  );
}
