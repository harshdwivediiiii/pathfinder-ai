import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/actions/settings";
import { getUserOnboardingStatus } from "@/actions/user";
import SettingsClient from "./_components/settings-client";

export const dynamic = "force-dynamic";
import { Sparkles, Settings } from "lucide-react";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [{ user }, settings] = await Promise.all([
    getUserOnboardingStatus(),
    getUserSettings(),
  ]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            System Preferences
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              <Settings className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              User <span className="text-gradient-primary">Settings</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium mt-2">
              Manage your profile preferences, privacy settings, and AI engine parameters.
            </p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-4 md:p-8">
            <SettingsClient userId={userId} user={user} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}
