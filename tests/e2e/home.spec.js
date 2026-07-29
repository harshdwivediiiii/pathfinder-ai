import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /Start Building Free/i })).toBeVisible();
  await expect(page.getByText(/AI Career Intelligence Suite/i)).toBeVisible();
});