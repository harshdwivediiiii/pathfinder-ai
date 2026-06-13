import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";
import DownloadPdf from "@/components/Download-pdf";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Button variant="link" className="gap-2 pl-0" asChild>
          <Link href="/ai-cover-letter">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-6xl font-bold gradient-title mb-6">
            {coverLetter?.jobTitle} at {coverLetter?.companyName}
          </h1>
          <DownloadPdf
            contentRefId="cover-letter-content"
            fileName={`cover-letter-${coverLetter?.companyName?.toLowerCase().replace(/\s+/g, "-")}-${coverLetter?.jobTitle?.toLowerCase().replace(/\s+/g, "-")}.pdf`}
            label="Download PDF"
          />
        </div>
      </div>

      <CoverLetterPreview content={coverLetter?.content} />
    </div>
  );
}
