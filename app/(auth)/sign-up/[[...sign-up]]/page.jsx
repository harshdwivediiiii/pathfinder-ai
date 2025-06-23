import { SignUp } from "@clerk/nextjs";
import InteractiveBackground from "@/components/Background";

export default function Page() {
  return (
    <div className="relative min-h-screen">
      <InteractiveBackground />
      <div className="relative z-10 flex justify-center items-center h-full">
        <SignUp />
      </div>
    </div>
  );
}