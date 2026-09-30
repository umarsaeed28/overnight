import { expect, test } from "@playwright/test";

test.describe("Account login", () => {
  test("a wrong password shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("shopper@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("login-error")).toContainText("incorrect");
  });

  test("a valid sign-in lands on order history", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("shopper@example.com");
    await page.getByLabel("Password").fill("correct-horse");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/orders$/);
  });
});