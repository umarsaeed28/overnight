import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ItemRef, SourceContext } from "@oqa/connector-shared";
import { fixtureConnector } from "./connector.js";

const SHOPDEMO = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../fixtures/shopdemo");

function context(flavour: "repo" | "docs" | "tickets", subdir = ""): SourceContext {
  return {
    sourceId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    kind: "fixture",
    config: { root: subdir ? resolve(SHOPDEMO, subdir) : SHOPDEMO, flavour },
  };
}

async function collect(iterable: AsyncIterable<ItemRef>): Promise<ItemRef[]> {
  const items: ItemRef[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

describe("fixture connector config", () => {
  it("requires a root and a flavour", () => {
    expect(() => fixtureConnector.validateConfig({})).toThrow();
    expect(() => fixtureConnector.validateConfig({ root: "/tmp", flavour: "nope" })).toThrow();
  });

  it("accepts a valid config", () => {
    expect(fixtureConnector.validateConfig({ root: "/tmp", flavour: "repo" })).toEqual({
      root: "/tmp",
      flavour: "repo",
    });
  });
});

describe("testConnection", () => {
  it("succeeds for a real directory", async () => {
    await expect(fixtureConnector.testConnection(context("repo"))).resolves.toEqual({ ok: true });
  });

  it("explains a missing directory instead of throwing", async () => {
    const src = { ...context("repo"), config: { root: "/no/such/place", flavour: "repo" } };
    await expect(fixtureConnector.testConnection(src)).resolves.toMatchObject({ ok: false });
  });
});

describe("listItems", () => {
  it("walks the repository deterministically", async () => {
    const first = await collect(fixtureConnector.listItems(context("repo")));
    const second = await collect(fixtureConnector.listItems(context("repo")));

    expect(first.map((i) => i.externalId)).toEqual(second.map((i) => i.externalId));
    expect(first.some((i) => i.externalId === "api/routes/cart.ts")).toBe(true);
  });

  it("gives every item a content-derived version and a byte count", async () => {
    const items = await collect(fixtureConnector.listItems(context("docs", "docs")));

    for (const item of items) {
      expect(item.version).toMatch(/^[0-9a-f]{16}$/);
      expect(item.bytes).toBeGreaterThan(0);
    }
  });

  it("lists only json under the tickets flavour", async () => {
    const items = await collect(fixtureConnector.listItems(context("tickets", "tickets")));

    expect(items).toHaveLength(40);
    expect(items.every((i) => i.externalId.endsWith(".json"))).toBe(true);
  });

  it("skips everything unchanged since the cursor", async () => {
    const cursor = await fixtureConnector.nextCursor(context("docs", "docs"));
    const items = await collect(fixtureConnector.listItems(context("docs", "docs"), cursor));

    expect(items).toEqual([]);
  });
});

describe("fetchItem", () => {
  it("returns code with its language", async () => {
    const src = context("repo");
    const ref = (await collect(fixtureConnector.listItems(src))).find(
      (i) => i.externalId === "api/routes/cart.ts",
    );

    const item = await fixtureConnector.fetchItem(src, ref!);

    expect(item.kind).toBe("code");
    expect(item.language).toBe("typescript");
    expect(item.content).toContain("CART_TTL_DAYS");
  });

  it("classifies a spec file as a test", async () => {
    const src = context("repo");
    const ref = (await collect(fixtureConnector.listItems(src))).find(
      (i) => i.externalId === "tests/e2e/cart.spec.ts",
    );

    await expect(fixtureConnector.fetchItem(src, ref!)).resolves.toMatchObject({ kind: "test" });
  });

  it("treats everything under the docs flavour as a doc", async () => {
    const src = context("docs", "docs");
    const ref = (await collect(fixtureConnector.listItems(src))).find(
      (i) => i.externalId === "04-cart-rules.md",
    );

    const item = await fixtureConnector.fetchItem(src, ref!);
    expect(item.kind).toBe("doc");
    expect(item.content).toContain("expires 24 hours");
  });

  it("lifts ticket fields into meta and keys the item by ticket key", async () => {
    const src = context("tickets", "tickets");
    const ref = (await collect(fixtureConnector.listItems(src))).find(
      (i) => i.externalId === "SHOP-103.json",
    );

    const item = await fixtureConnector.fetchItem(src, ref!);

    expect(item.externalId).toBe("SHOP-103");
    expect(item.kind).toBe("ticket");
    expect(item.title).toContain("SHOP-103:");
    expect(item.meta).toMatchObject({ status: "Open", type: "Bug" });
    expect(item.meta.acceptanceCriteria).toHaveLength(3);
  });
});

describe("nextCursor", () => {
  it("returns the newest modification time in the tree", async () => {
    const cursor = await fixtureConnector.nextCursor(context("tickets", "tickets"));
    expect(typeof cursor.mtime).toBe("number");
    expect(cursor.mtime as number).toBeGreaterThan(0);
  });
});
