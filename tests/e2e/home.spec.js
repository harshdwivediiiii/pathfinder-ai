import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /Start Building Free/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/PathFinder AI helps you create ATS-optimized resumes/i)).toBeVisible({ timeout: 15000 });
});