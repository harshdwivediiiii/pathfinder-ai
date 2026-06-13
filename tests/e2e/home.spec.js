import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Launch Your Career" })).toBeVisible();
  await expect(page.getByText("AI-Powered Career Platform")).toBeVisible();
});