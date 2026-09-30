import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDocument } from "./parse.js";

const SHOPDEMO = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../fixtures/shopdemo");
const read = (path: string) => readFile(resolve(SHOPDEMO, path), "utf8");

describe("parseDocument on the ShopDemo fixture", () => {
  it("finds the cart routes", async () => {
    const result = await parseDocument({
      path: "api/routes/cart.ts",
      kind: "code",
      content: await read("api/routes/cart.ts"),
    });

    const routes = result.symbols.filter((s) => s.kind === "route").map((s) => s.name);
    expect(routes).toEqual(["GET /cart", "POST /cart/items", "DELETE /cart/items/:productId"]);
  });

  it("finds the validation schemas and their fields", async () => {
    const result = await parseDocument({
      path: "api/lib/validation.ts",
      kind: "code",
      content: await read("api/lib/validation.ts"),
    });

    const schema = result.symbols.find((s) => s.name === "addToCartSchema");
    expect(schema).toMatchObject({ kind: "schema", meta: { fields: ["productId", "quantity"] } });
  });

  it("reads the storefront product page as a page with its route", async () => {
    const result = await parseDocument({
      path: "app/products/[id]/page.tsx",
      kind: "code",
      content: await read("app/products/[id]/page.tsx"),
    });

    expect(result.symbols[0]).toMatchObject({
      kind: "page",
      name: "ProductPage",
      meta: { path: "/products/:id" },
    });
  });

  it("reads the Prisma schema as models", async () => {
    const result = await parseDocument({
      path: "prisma/schema.prisma",
      kind: "code",
      content: await read("prisma/schema.prisma"),
    });

    const names = result.symbols.map((s) => s.name);
    expect(names).toContain("Order");
    expect(names).toContain("OrderStatus");

    const order = result.symbols.find((s) => s.name === "Order");
    expect(order!.meta.fields).toContain("guestEmail");
  });

  it("reads the docs into sections", async () => {
    const result = await parseDocument({
      path: "docs/04-cart-rules.md",
      kind: "doc",
      content: await read("docs/04-cart-rules.md"),
      breadcrumbRoot: "ShopDemo",
    });

    expect(result.sections.map((s) => s.title)).toContain("Expiry");
    const expiry = result.sections.find((s) => s.title === "Expiry");
    expect(expiry!.breadcrumb).toBe("ShopDemo > Cart rules > Expiry");
    expect(expiry!.content).toContain("24 hours");
  });

  it("normalises a ticket from its connector meta", async () => {
    const raw = JSON.parse(await read("tickets/SHOP-103.json")) as Record<string, unknown>;

    const result = await parseDocument({
      path: "tickets/SHOP-103.json",
      kind: "ticket",
      content: "",
      meta: {
        key: raw.key,
        summary: raw.summary,
        type: raw.type,
        status: raw.status,
        labels: raw.labels,
        epic: raw.epic,
        description: raw.description,
        acceptanceCriteria: raw.acceptance_criteria,
        links: raw.links,
      },
    });

    expect(result.normalized).toContain("# SHOP-103:");
    expect(result.normalized).toContain("## Acceptance criteria");
  });

  it("reads the Playwright suite as tests", async () => {
    const result = await parseDocument({
      path: "tests/e2e/cart.spec.ts",
      kind: "test",
      content: await read("tests/e2e/cart.spec.ts"),
    });

    expect(result.detectors).toEqual(["playwright_tests"]);
    expect(result.symbols.filter((s) => s.kind === "test")).toHaveLength(3);
    expect(result.symbols[1]!.meta.visited_paths).toContain("/cart");
  });
});
