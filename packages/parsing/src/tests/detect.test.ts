import { describe, expect, it } from "vitest";
import { detectFramework, parseTestSymbols } from "./detect.js";

const PLAYWRIGHT = `import { expect, test } from "@playwright/test";

test.describe("Guest checkout", () => {
  test("guest can checkout @smoke", async ({ page }) => {
    await page.goto("/products/prod-tea-001");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Sam");
    await expect(page.getByTestId("order-confirmation")).toBeVisible();
    await expect(page).toHaveURL(/orders/);
  });

  test.skip("declined card", async ({ page }) => {
    await page.goto("/checkout");
  });
});`;

describe("detectFramework", () => {
  it.each([
    ["tests/e2e/a.spec.ts", 'import { test } from "@playwright/test";', "playwright"],
    ["cypress/integration/a.js", 'describe("x", () => {})', "cypress"],
    ["src/a.test.ts", 'import { describe } from "vitest";', "vitest"],
    ["src/a.test.js", 'import { describe } from "@jest/globals";', "jest"],
    ["src/a.test.js", 'describe("x", () => {})', "unknown"],
  ])("reads %s as %s", (path, content, expected) => {
    expect(detectFramework(path, content)).toBe(expected);
  });
});

describe("parseTestSymbols", () => {
  it("reports a suite and its tests", async () => {
    const { symbols, detectors } = await parseTestSymbols("tests/e2e/checkout.spec.ts", PLAYWRIGHT);

    expect(symbols.map((s) => [s.kind, s.name])).toEqual([
      ["test_suite", "Guest checkout"],
      ["test", "Guest checkout > guest can checkout @smoke"],
      ["test", "Guest checkout > declined card"],
    ]);
    expect(detectors).toEqual(["playwright_tests"]);
  });

  it("keeps the suite title separate from the full name", async () => {
    const { symbols } = await parseTestSymbols("tests/e2e/checkout.spec.ts", PLAYWRIGHT);

    expect(symbols[1]!.meta).toMatchObject({
      title: "guest can checkout @smoke",
      suite: ["Guest checkout"],
    });
  });

  it("extracts tags from the title", async () => {
    const { symbols } = await parseTestSymbols("tests/e2e/checkout.spec.ts", PLAYWRIGHT);
    expect(symbols[1]!.meta.tags).toEqual(["smoke"]);
  });

  it("collects visited paths, selectors and assertion counts", async () => {
    const { symbols } = await parseTestSymbols("tests/e2e/checkout.spec.ts", PLAYWRIGHT);

    expect(symbols[1]!.meta).toMatchObject({
      visited_paths: ["/checkout", "/products/prod-tea-001"],
      selectors: ["Full name", "add-to-cart", "order-confirmation"],
      assertion_count: 2,
    });
  });

  it("treats a skipped test as a test", async () => {
    const { symbols } = await parseTestSymbols("tests/e2e/checkout.spec.ts", PLAYWRIGHT);
    expect(symbols[2]!.kind).toBe("test");
  });

  it("handles Cypress selectors and visits", async () => {
    const { symbols } = await parseTestSymbols(
      "cypress/integration/cart.spec.js",
      `describe("Cart", () => {
         it("adds an item", () => {
           cy.visit("/products/1");
           cy.get("[data-testid=add-to-cart]").click();
           expect(true).to.equal(true);
         });
       });`,
    );

    expect(symbols[1]!.meta).toMatchObject({
      visited_paths: ["/products/1"],
      selectors: ["[data-testid=add-to-cart]"],
      assertion_count: 1,
    });
  });

  it("records API calls made through a request client", async () => {
    const { symbols } = await parseTestSymbols(
      "tests/api/cart.spec.ts",
      `test("adds to cart", async ({ request }) => {
         await request.post("/api/cart/items");
         await request.get("/api/cart");
       });`,
    );

    expect(symbols[0]!.meta.api_calls).toEqual([
      { method: "GET", path: "/api/cart" },
      { method: "POST", path: "/api/cart/items" },
    ]);
  });

  it("does not mistake a Map lookup for a selector", async () => {
    const { symbols } = await parseTestSymbols(
      "src/cart.test.ts",
      `test("totals", () => {
         const value = cache.get("key");
         expect(value).toBe(1);
       });`,
    );

    expect(symbols[0]!.meta.selectors).toEqual([]);
  });

  it("supports nested suites", async () => {
    const { symbols } = await parseTestSymbols(
      "src/cart.test.ts",
      `describe("Cart", () => {
         describe("empty", () => {
           it("says so", () => { expect(1).toBe(1); });
         });
       });`,
    );

    expect(symbols.map((s) => s.name)).toEqual([
      "Cart",
      "Cart > empty",
      "Cart > empty > says so",
    ]);
  });

  it("ignores a call with a non-literal title", async () => {
    const { symbols } = await parseTestSymbols(
      "src/cart.test.ts",
      `for (const name of names) { it(name, () => {}); }`,
    );

    expect(symbols).toEqual([]);
  });

  it("records 1-based line ranges", async () => {
    const { symbols } = await parseTestSymbols(
      "src/cart.test.ts",
      ["// header", 'it("works", () => {', "  expect(1).toBe(1);", "});"].join("\n"),
    );

    expect(symbols[0]).toMatchObject({ lineStart: 2, lineEnd: 4 });
  });
});
