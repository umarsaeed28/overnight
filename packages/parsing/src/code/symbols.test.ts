import { describe, expect, it } from "vitest";
import { parseCodeSymbols } from "./symbols.js";

const byName = (symbols: { name: string }[]) => symbols.map((s) => s.name).sort();

describe("parseCodeSymbols", () => {
  it("returns nothing for a language it does not parse", async () => {
    await expect(parseCodeSymbols("main.go", "package main")).resolves.toEqual({
      symbols: [],
      detectors: [],
    });
  });

  it("finds Express routes with their method and path", async () => {
    const { symbols, detectors } = await parseCodeSymbols(
      "api/routes/cart.ts",
      `const router = Router();
       router.get("/cart", async (req, res) => res.json({}));
       router.post("/cart/items", handler);
       export default router;`,
    );

    const routes = symbols.filter((s) => s.kind === "route");
    expect(byName(routes)).toEqual(["GET /cart", "POST /cart/items"]);
    expect(routes[0]!.meta).toMatchObject({ method: "GET", path: "/cart" });
    expect(detectors).toContain("express_route");
  });

  it("does not report a route's inline handler as a separate function", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/routes/cart.ts",
      `router.get("/cart", async (req, res) => res.json({}));`,
    );

    expect(symbols).toHaveLength(1);
  });

  it("reads a Next App Router page path from its folders", async () => {
    const { symbols } = await parseCodeSymbols(
      "app/(shop)/products/[id]/page.tsx",
      `export default function ProductPage({ params }) { return <main>{params.id}</main>; }`,
    );

    expect(symbols[0]).toMatchObject({
      kind: "page",
      name: "ProductPage",
      meta: { path: "/products/:id", props: ["params"] },
    });
  });

  it("reads App Router verb exports as routes", async () => {
    const { symbols } = await parseCodeSymbols(
      "app/api/cart/route.ts",
      `export async function GET() { return Response.json({}); }
       export async function POST() { return Response.json({}); }`,
    );

    expect(byName(symbols)).toEqual(["GET /api/cart", "POST /api/cart"]);
    expect(symbols.every((s) => s.kind === "route")).toBe(true);
  });

  it("reads Pages Router paths, including the api prefix", async () => {
    const page = await parseCodeSymbols(
      "pages/products/[id].tsx",
      `export default function P() { return <div />; }`,
    );
    const api = await parseCodeSymbols(
      "pages/api/cart.ts",
      `export default function handler(req, res) { res.end(); }`,
    );

    expect(page.symbols[0]).toMatchObject({ kind: "page", meta: { path: "/products/:id" } });
    expect(api.symbols[0]).toMatchObject({ kind: "route", meta: { path: "/api/cart" } });
  });

  it("treats index as the parent path", async () => {
    const { symbols } = await parseCodeSymbols(
      "pages/index.tsx",
      `export default function Home() { return <div />; }`,
    );

    expect(symbols[0]!.meta.path).toBe("/");
  });

  it("recognises a React component by its JSX and capitalised name", async () => {
    const { symbols, detectors } = await parseCodeSymbols(
      "components/ProductCard.tsx",
      `export function ProductCard({ product, onAdd }) { return <article>{product.name}</article>; }`,
    );

    expect(symbols[0]).toMatchObject({
      kind: "component",
      name: "ProductCard",
      meta: { props: ["product", "onAdd"], exported: true },
    });
    expect(detectors).toContain("react_component");
  });

  it("does not call a lowercase JSX helper a component", async () => {
    const { symbols } = await parseCodeSymbols(
      "components/helpers.tsx",
      `function renderBadge() { return <span />; }`,
    );

    expect(symbols[0]!.kind).toBe("handler");
  });

  it("captures zod schemas with their field names", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/lib/validation.ts",
      `export const addToCartSchema = z.object({ productId: z.string(), quantity: z.number() });`,
    );

    expect(symbols[0]).toMatchObject({
      kind: "schema",
      name: "addToCartSchema",
      meta: { library: "zod", fields: ["productId", "quantity"] },
    });
  });

  it("captures env reads by variable name", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/lib/payments.ts",
      `const url = process.env.PAYMENTS_URL ?? "";
       const key = process.env.PAYMENTS_API_KEY;`,
    );

    const envReads = symbols.filter((s) => s.kind === "env_read");
    expect(byName(envReads)).toEqual(["PAYMENTS_API_KEY", "PAYMENTS_URL"]);
  });

  it("captures feature flag calls with their key", async () => {
    const { symbols } = await parseCodeSymbols(
      "app/flags.ts",
      `const on = isEnabled("new-checkout");`,
    );

    expect(symbols.find((s) => s.kind === "flag")).toMatchObject({
      name: "new-checkout",
      meta: { key: "new-checkout", via: "isEnabled" },
    });
  });

  it("falls back to handler symbols for plain functions and methods", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/lib/rules.ts",
      `export function shippingFor(subtotalCents) { return 0; }
       class Cart { total() { return 0; } }`,
    );

    expect(byName(symbols)).toEqual(["Cart.total", "shippingFor"]);
    expect(symbols.every((s) => s.kind === "handler")).toBe(true);
  });

  it("records 1-based inclusive line ranges", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/lib/rules.ts",
      ["// a comment", "export function shippingFor() {", "  return 0;", "}"].join("\n"),
    );

    expect(symbols[0]).toMatchObject({ lineStart: 2, lineEnd: 4 });
  });

  it("keeps symbols in source order", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/routes/orders.ts",
      `router.post("/orders", a);
       router.get("/orders", b);`,
    );

    expect(symbols.map((s) => s.name)).toEqual(["POST /orders", "GET /orders"]);
  });

  it("parses javascript as well as typescript", async () => {
    const { symbols } = await parseCodeSymbols(
      "api/legacy.js",
      `module.exports.shippingFor = function shippingFor() { return 0; };`,
    );

    expect(symbols.some((s) => s.name === "shippingFor")).toBe(true);
  });

  it("survives a file that does not parse cleanly", async () => {
    const { symbols } = await parseCodeSymbols("api/broken.ts", "export function oops( {");
    expect(Array.isArray(symbols)).toBe(true);
  });
});
