import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import CodeEditorClient from "./_components/code-editor-client";

export const metadata = {
  title: "Coding Practice | Pathfinder AI",
  description: "Practice coding algorithms with zero-latency local execution using WebAssembly.",
};

export default async function CodingPracticePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirectUrl=/coding-practice");
  }

  return <CodeEditorClient />;
}
