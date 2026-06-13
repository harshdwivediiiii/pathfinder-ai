import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoadmapGenerator from "../_components/roadmap-generator";

export default function GenerateRoadmapPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Button variant="link" className="gap-2 pl-0" asChild>
          <Link href="/roadmap">
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmap
          </Link>
        </Button>

        <div className="pb-6">
          <h1 className="text-6xl font-bold gradient-title">
            Create Roadmap
          </h1>
          <p className="text-muted-foreground">
            Generate a personalized career roadmap based on your profile
          </p>
        </div>
      </div>

      <RoadmapGenerator />
    </div>
  );
}
