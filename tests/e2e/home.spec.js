import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Start Building Free" })).toBeVisible();
  await expect(page.getByText("AI Career Intelligence Suite")).toBeVisible();
});