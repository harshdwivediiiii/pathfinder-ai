import { getPortfolio } from "@/actions/portfolio-builder";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import PortfolioBuilderPage from "./_components/portfolio-builder-page";
import { Presentation, Sparkles } from "lucide-react";

export const metadata = {
  title: "Portfolio Builder | PathFinder AI",
  description: "Generate a beautiful personal portfolio website from your resume.",
};

export default async function PortfolioBuilderRoute() {
  const { isOnboarded, user } = await getUserOnboardingStatus();

  if (!user) redirect("/sign-in");
  if (!isOnboarded) redirect("/onboarding");

  const portfolio = await getPortfolio();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            AI-Powered Showcase
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              <Presentation className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              Portfolio <span className="text-gradient-primary">Generator</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium mt-2 max-w-2xl">
              Turn your resume into a stunning, public-ready portfolio website in seconds. Customize your theme and share your link with recruiters.
            </p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-4 md:p-8">
            <PortfolioBuilderPage initialPortfolio={portfolio} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
