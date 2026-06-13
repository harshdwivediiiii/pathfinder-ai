import Link from "next/link";
import {
  BookOpen,
  FileText,
  Mic,
  Mail,
  BarChart2,
  HelpCircle,
  ArrowRight,
  MessageCircle,
  Github,
  Linkedin,
} from "lucide-react";

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    steps: [
      {
        step: "1",
        heading: "Create an account",
        body: "Sign up at the top of the page using your email. Pathfinder AI uses Clerk for secure authentication — your credentials are never stored on our servers.",
      },
      {
        step: "2",
        heading: "Complete onboarding",
        body: "After signing in you will be routed to the onboarding flow. Tell us your industry, experience level, and career goal so the AI can personalise every tool for you.",
      },
      {
        step: "3",
        heading: "Pick a tool and start",
        body: "Head to the Dashboard and choose Resume Builder, Cover Letter Generator, Mock Interviews, or Industry Insights. Each tool walks you through the process step by step.",
      },
    ],
  },
  {
    id: "resume-builder",
    icon: FileText,
    title: "Resume Builder",
    steps: [
      {
        step: "1",
        heading: "Enter your details",
        body: "Fill in your work history, education, and skills. The more detail you provide, the better the AI can tailor bullet points to your target role.",
      },
      {
        step: "2",
        heading: "Choose a template",
        body: "Select from ATS-optimised templates. All templates are designed to pass automated screening systems used by most large employers.",
      },
      {
        step: "3",
        heading: "Review and export",
        body: "The AI scores your resume for ATS compatibility. Tweak any section inline, then download as a PDF when you are happy.",
      },
    ],
  },
  {
    id: "cover-letter",
    icon: Mail,
    title: "Cover Letter Generator",
    steps: [
      {
        step: "1",
        heading: "Paste the job description",
        body: "Copy the full job description into the input field. The AI extracts the key requirements and maps them against your profile.",
      },
      {
        step: "2",
        heading: "Select your tone",
        body: "Choose from Professional, Conversational, or Confident. The generator adjusts language and structure to match the style you need.",
      },
      {
        step: "3",
        heading: "Edit and copy",
        body: "A tailored cover letter is generated in seconds. Edit any paragraph directly in the editor, then copy or download.",
      },
    ],
  },
  {
    id: "mock-interviews",
    icon: Mic,
    title: "Interview Preparation",
    steps: [
      {
        step: "1",
        heading: "Set your role and level",
        body: "Enter the job title you are preparing for and your experience level. The AI generates role-specific questions drawn from real interview patterns.",
      },
      {
        step: "2",
        heading: "Answer and get feedback",
        body: "Type or speak your answers. The AI scores each response for clarity, structure, and impact and gives you concrete suggestions.",
      },
      {
        step: "3",
        heading: "Track improvement",
        body: "Your scores are saved in the dashboard so you can see how your performance improves across sessions.",
      },
    ],
  },
  {
    id: "industry-insights",
    icon: BarChart2,
    title: "Industry Insights",
    steps: [
      {
        step: "1",
        heading: "Select your industry",
        body: "Choose from a list of industries. The platform surfaces real-time salary ranges, in-demand skills, and hiring trends relevant to your field.",
      },
      {
        step: "2",
        heading: "Identify skill gaps",
        body: "The Skill Analysis chart compares your current profile against the market benchmark so you know exactly what to learn next.",
      },
      {
        step: "3",
        heading: "Act on the data",
        body: "Use the insights to update your resume keywords, tailor your cover letter, or focus your interview prep on the skills employers care about most.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#0d0e14]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium mb-4 bg-blue-400/10 px-4 py-1.5 rounded-full border border-blue-400/20">
            <HelpCircle size={14} />
            Help Centre
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How can we help you?
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Everything you need to get the most out of Pathfinder AI — from
            your first sign-in to landing your dream job.
          </p>
        </div>
      </div>

      {/* ── Quick-nav ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {sections.map(({ id, icon: Icon, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/40 transition-all text-sm text-white/70 hover:text-white text-center"
            >
              <Icon size={20} className="text-blue-400" />
              {title}
            </a>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-14">
        {sections.map(({ id, icon: Icon, title, steps }) => (
          <section key={id} id={id} className="scroll-mt-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Icon size={18} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold">{title}</h2>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-4">
              {steps.map(({ step, heading, body }) => (
                <div
                  key={step}
                  className="relative p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-500/30 transition-colors"
                >
                  <span className="absolute top-4 right-4 text-3xl font-black text-white/5 leading-none select-none">
                    {step}
                  </span>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
                    Step {step}
                  </p>
                  <h3 className="font-semibold text-white mb-2">{heading}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── Contact & Support ── */}
        <section id="contact" className="scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <MessageCircle size={18} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold">Contact &amp; Support</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="mailto:harshvardhandwivedi18@gmail.com"
              className="group flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-500/30 transition-colors"
            >
              <Mail size={20} className="text-blue-400" />
              <div>
                <p className="font-semibold mb-1">Email the maintainer</p>
                <p className="text-sm text-white/50">
                  harshvardhandwivedi18@gmail.com
                </p>
              </div>
              <span className="text-blue-400 text-xs flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                Send email <ArrowRight size={12} />
              </span>
            </a>

            <a
              href="https://github.com/harshdwivediiiii/pathfinder-ai/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-500/30 transition-colors"
            >
              <Github size={20} className="text-blue-400" />
              <div>
                <p className="font-semibold mb-1">Open a GitHub issue</p>
                <p className="text-sm text-white/50">
                  Bug reports, feature requests, and general feedback.
                </p>
              </div>
              <span className="text-blue-400 text-xs flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                View issues <ArrowRight size={12} />
              </span>
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-blue-500/30 transition-colors"
            >
              <Linkedin size={20} className="text-blue-400" />
              <div>
                <p className="font-semibold mb-1">Connect on LinkedIn</p>
                <p className="text-sm text-white/50">
                  Reach out for collaborations or professional enquiries.
                </p>
              </div>
              <span className="text-blue-400 text-xs flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                Connect <ArrowRight size={12} />
              </span>
            </a>
          </div>

          <p className="mt-6 text-sm text-white/30 text-center">
            For security vulnerabilities, please follow the responsible
            disclosure process described in{" "}
            <a
              href="https://github.com/harshdwivediiiii/pathfinder-ai/blob/main/SECURITY.md"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              SECURITY.md
            </a>{" "}
            — do not open a public issue.
          </p>
        </section>

        {/* ── Still need help CTA ── */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
          <h3 className="text-xl font-semibold mb2">Still have questions?</h3>
          <p className="text-white/50 text-sm mb-6 mt-2">
            Check the FAQ for quick answers to the most common questions, or
            reach out and we will get back to you within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#question"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <HelpCircle size={15} />
              View FAQ
            </Link>
            <a
              href="mailto:harshvardhandwivedi18@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              <Mail size={15} />
              Email Support
            </a>
          </div>
        </div>

        {/* ── Back to home ── */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
