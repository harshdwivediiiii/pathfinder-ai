import { expect, test } from "@playwright/test";

test("landing page renders successfully", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/AI Career Intelligence Suite/i).first()).toBeVisible({ timeout: 15000 });
});
