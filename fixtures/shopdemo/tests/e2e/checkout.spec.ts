import { expect, test } from "@playwright/test";

test.describe("Guest checkout", () => {
  test("guest can checkout", async ({ page }) => {
    await page.goto("/products/prod-tea-001");
    await page.getByTestId("add-to-cart").click();

    await page.goto("/checkout");
    await expect(page.getByTestId("guest-email")).toBeVisible();

    await page.getByTestId("guest-email").fill("shopper@example.com");
    await page.getByLabel("Full name").fill("Sam Shopper");
    await page.getByLabel("Address").fill("1 Test Street");
    await page.getByLabel("City").fill("Testville");
    await page.getByLabel("Postcode").fill("12345");
    await page.getByTestId("card-input").fill("tok_visa");

    await page.getByTestId("place-order").click();

    await expect(page.getByTestId("order-confirmation")).toContainText("PENDING_PAYMENT");
  });

  test("checkout redirects to the cart when the cart is empty", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByTestId("empty-cart")).toBeVisible();
  });

  test("invalid email shows a validation message", async ({ page }) => {
    await page.goto("/products/prod-tea-001");
    await page.getByTestId("add-to-cart").click();

    await page.goto("/checkout");
    await page.getByTestId("guest-email").fill("not-an-email");
    await page.getByTestId("place-order").click();

    await expect(page.getByRole("alert")).toContainText("Enter a valid email");
  });

  test("declined payment keeps the order unpaid", async ({ page }) => {
    await page.goto("/products/prod-tea-001");
    await page.getByTestId("add-to-cart").click();

    await page.goto("/checkout");
    await page.getByTestId("guest-email").fill("shopper@example.com");
    await page.getByLabel("Full name").fill("Sam Shopper");
    await page.getByLabel("Address").fill("1 Test Street");
    await page.getByLabel("City").fill("Testville");
    await page.getByLabel("Postcode").fill("12345");
    await page.getByTestId("card-input").fill("tok_declined");

    await page.getByTestId("place-order").click();

    await expect(page.getByTestId("payment-error")).toContainText("declined");
  });
});
