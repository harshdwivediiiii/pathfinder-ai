import InteractiveBackground from "@/components/Background";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <>
      <InteractiveBackground isDarkMode={false} />
      <SignIn />
    </>
  );
}