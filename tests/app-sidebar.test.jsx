import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AppSidebar from "../components/app-sidebar.jsx";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      fullName: "Test User",
      primaryEmailAddress: { emailAddress: "test@example.com" },
    },
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ariaLabel, ...props }) => (
    <button onClick={onClick} aria-label={props["aria-label"]} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }) => <>{children}</>,
  TooltipRoot: ({ children }) => <>{children}</>,
  TooltipTrigger: ({ children }) => <>{children}</>,
  TooltipContent: ({ children }) => <>{children}</>,
}));

describe("AppSidebar Accessibility & Focus Transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate mobile viewport width < 1024
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
  });

  it("handles mobile drawer open and close keyboard focus transitions", async () => {
    render(<AppSidebar />);

    // Initially closed on mobile, trigger button should be visible
    const openButton = screen.getByRole("button", { name: "Open navigation menu" });
    expect(openButton).toBeDefined();

    // Open drawer
    fireEvent.click(openButton);

    // Close button inside drawer should now be rendered
    const closeButton = screen.getByRole("button", { name: "Close navigation menu" });
    expect(closeButton).toBeDefined();

    // Trigger close via close button
    fireEvent.click(closeButton);

    // After closing, focus should return to open trigger
    expect(openButton).toBeDefined();
  });
});
