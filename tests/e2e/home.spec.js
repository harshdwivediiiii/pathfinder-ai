import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Start Building Free")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("AI Career Intelligence Suite")).toBeVisible();
});
