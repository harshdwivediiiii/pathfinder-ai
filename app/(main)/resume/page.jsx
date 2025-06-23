import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";
import InteractiveBackground from "@/components/Background";

export default async function ResumePage() {
  const resume = await getResume();

  return (
    <div>
      <InteractiveBackground isDarkMode={false} />

      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-6xl font-bold gradient-title">My Resume</h1>
        </div>
        <ResumeBuilder initialContent={resume?.content} />
      </div>
    </div>
  );
}
