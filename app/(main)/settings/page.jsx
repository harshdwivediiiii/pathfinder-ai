import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserSettings } from "@/actions/settings";
import SettingsClient from "./_components/settings-client";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const settings = await getUserSettings(userId);

  return <SettingsClient userId={userId} settings={settings} />;
}
