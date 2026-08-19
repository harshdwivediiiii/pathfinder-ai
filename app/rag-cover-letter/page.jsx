import RagCoverLetterEngine from "@/components/RagCoverLetterEngine";

export const metadata = {
  title: "RAG Cover Letter Engine",
  description: "Generate highly personalized cover letters using Retrieval-Augmented Generation.",
};

export default function RagCoverLetterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-10">
        <RagCoverLetterEngine />
      </div>
    </div>
  );
}
