import { expect, test } from "@playwright/test";

test.describe("Cart", () => {
  test("adding a product puts it in the cart", async ({ page }) => {
    await page.goto("/products/prod-tea-001");
    await page.getByTestId("add-to-cart").click();

    await page.goto("/cart");
    await expect(page.getByTestId("cart-summary")).toBeVisible();
    await expect(page.getByTestId("quantity-prod-tea-001")).toHaveText("1");
  });

  test("an empty cart says so and hides checkout", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByTestId("empty-cart")).toBeVisible();
    await expect(page.getByTestId("checkout-link")).toHaveCount(0);
  });

  test("shipping is free above the threshold", async ({ page }) => {
    await page.goto("/products/prod-rug-004");
    await page.getByLabel("Quantity").fill("2");
    await page.getByTestId("add-to-cart").click();

    await page.goto("/cart");
    await expect(page.getByTestId("shipping")).toHaveText("$0.00");
  });
});
