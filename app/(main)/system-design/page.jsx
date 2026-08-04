import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import SystemDesignClient from "./_components/system-design-client";

export const metadata = {
  title: "System Design Interview | Pathfinder AI",
  description: "Practice system design interviews with a real-time AI critique on an interactive whiteboard.",
};

export default async function SystemDesignPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirectUrl=/system-design");
  }

  return <SystemDesignClient />;
}
