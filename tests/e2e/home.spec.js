import { expect, test } from "@playwright/test";

test("landing page loads without errors", async ({ page }) => {
  // Set up console listener BEFORE navigating to capture all errors
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  // Navigate and wait for load event (not networkidle which is unreliable in CI)
  const response = await page.goto("/", { waitUntil: "load", timeout: 60000 });
  // Verify the page loaded successfully
  expect(response?.status()).toBeLessThan(400);
  // Verify the page title or body is present (universal check)
  await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  // Give the page 2 seconds to render and collect any console errors
  await page.waitForTimeout(2000);
  // Filter out known non-critical errors (external resource failures, CSP/network errors, Clerk dev-mode)
  const criticalErrors = consoleErrors.filter(
    (e) =>
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR") &&
      !e.includes("ClerkJS") &&
      !e.includes("Content Security Policy") &&
      !e.includes("connect-src") &&
      !e.includes("clerk.pathfin")
  );
  expect(criticalErrors).toHaveLength(0);
});