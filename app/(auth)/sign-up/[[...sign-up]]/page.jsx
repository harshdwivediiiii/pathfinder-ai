import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <SignUp
        fallbackRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
