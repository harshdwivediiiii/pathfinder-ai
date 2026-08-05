import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // The Navbar "Start Free" CTA is visible immediately; hero section has been
  // replaced by CareerScrollWrapper scrollytelling, update assertion accordingly.
  await expect(page.getByRole("link", { name: /Start Free/i })).toBeVisible({ timeout: 20000 });
  // Verify Features nav link is present (always visible in Navbar)
  await expect(page.getByRole("link", { name: /Features/i })).toBeVisible({ timeout: 10000 });
});