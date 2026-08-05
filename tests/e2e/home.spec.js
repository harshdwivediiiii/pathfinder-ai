import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  await expect(page.getByRole("link", { name: /Start Building Free/i })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/PathFinder AI helps you create ATS-optimized resumes/i)).toBeVisible({ timeout: 20000 });
});