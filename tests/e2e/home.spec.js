import { expect, test } from "@playwright/test";

test("landing page renders the primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();
  await expect(page.getByText("AI-Powered Career Companion")).toBeVisible();
});