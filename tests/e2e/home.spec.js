import { expect, test } from "@playwright/test";

test("landing page loads without errors", async ({ page }) => {
  // Navigate and wait for load event (not networkidle which is unreliable in CI)
  const response = await page.goto("/", { waitUntil: "load", timeout: 60000 });
  // Verify the page loaded successfully
  expect(response?.status()).toBeLessThan(400);
  // Verify the page title or body is present (universal check)
  await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  // Verify no console errors at Error level (excluding expected warnings)
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  // Give the page 2 seconds to render and collect any console errors
  await page.waitForTimeout(2000);
  // Filter out known non-critical errors (external resource failures, etc.)
  const criticalErrors = consoleErrors.filter(
    (e) => !e.includes("Failed to load resource") && !e.includes("net::ERR")
  );
  expect(criticalErrors).toHaveLength(0);
});