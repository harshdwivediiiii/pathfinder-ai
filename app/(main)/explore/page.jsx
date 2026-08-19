import { getExploreCareers } from "@/actions/explore";
import { ExploreContent } from "./_components/explore-content";

export const metadata = { title: "Explore Careers - Pathfinder AI" };

export default async function ExploreCareersPage() {
  const careers = await getExploreCareers();
  return <ExploreContent careers={careers} />;
}
