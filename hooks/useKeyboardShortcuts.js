"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const useKeyboardShortcuts = () => {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            router.push("/dashboard");
            break;
          case "2":
            e.preventDefault();
            router.push("/resume");
            break;
          case "3":
            e.preventDefault();
            router.push("/ai-cover-letter");
            break;
          case "4":
            e.preventDefault();
            router.push("/interview-prep");
            break;
          case "5":
            e.preventDefault();
            router.push("/insights");
            break;
          case "6":
            e.preventDefault();
            router.push("/roadmap");
            break;
          case "h":
          case "H":
            e.preventDefault();
            router.push("/ai-assistant");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
};

export default useKeyboardShortcuts;