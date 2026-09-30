import { expect, test } from "@playwright/test";

test.describe("Browsing products", () => {
  test("the product list shows a grid", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("product-grid")).toBeVisible();
  });

  test("search with no matches shows an empty message", async ({ page }) => {
    await page.goto("/?q=zzzznotaproduct");
    await expect(page.getByTestId("no-products")).toBeVisible();
  });

  test("an out of stock product cannot be added", async ({ page }) => {
    await page.goto("/products/prod-lamp-009");
    await expect(page.getByTestId("out-of-stock")).toBeVisible();
    await expect(page.getByTestId("add-to-cart")).toHaveCount(0);
  });
});
