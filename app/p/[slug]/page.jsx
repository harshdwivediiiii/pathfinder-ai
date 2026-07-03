import { getPublicPortfolio } from "@/actions/portfolio-builder";
import { notFound } from "next/navigation";
import PortfolioPreview from "../../(main)/portfolio-builder/_components/portfolio-preview";

export async function generateMetadata({ params }) {
  const portfolio = await getPublicPortfolio(params.slug);
  if (!portfolio) {
    return {
      title: "Portfolio Not Found | PathFinder AI",
    };
  }

  return {
    title: `${portfolio.user?.name || "Portfolio"} | PathFinder AI`,
    description: portfolio.content?.hero?.subheadline || "A personal portfolio built with PathFinder AI.",
  };
}

export default async function PublicPortfolioPage({ params }) {
  const portfolio = await getPublicPortfolio(params.slug);

  if (!portfolio) {
    notFound();
  }

  // We reuse the PortfolioPreview component to render the public view
  return (
    <div className="w-full h-screen bg-background">
      <PortfolioPreview 
        data={portfolio.content} 
        theme={portfolio.theme} 
        user={portfolio.user} 
      />
    </div>
  );
}
