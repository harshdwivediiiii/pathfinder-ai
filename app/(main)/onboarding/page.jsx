import { redirect } from "next/navigation";
import { industries } from "@/data/industries";
import OnboardingForm from "./_components/onboarding-form";
import { getUserOnboardingStatus } from "@/actions/user";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { isOnboarded, isSignedIn } = await getUserOnboardingStatus();

  if (!isSignedIn) {
    redirect("/sign-in");
  }

  if (isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  );
}
