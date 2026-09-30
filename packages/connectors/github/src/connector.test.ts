import { describe, expect, it, vi } from "vitest";
import { RateLimiter } from "@oqa/connector-shared";
import type { ItemRef, SourceContext } from "@oqa/connector-shared";
import { GithubClient } from "./api.js";
import { GithubConnector, MERGED_PR_LIMIT } from "./connector.js";

type Route = (url: string, init: RequestInit) => unknown;

/** A fetch stub that answers by URL fragment and records what was asked. */
function stubFetch(routes: Record<string, Route>) {
  const calls: string[] = [];

  const fetchImpl = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push(url);

    const key = Object.keys(routes).find((fragment) => url.includes(fragment));
    if (!key) {
      return new Response("not found", { status: 404, headers: { "content-type": "text/plain" } });
    }

    const body = routes[key]!(url, init);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  return { fetchImpl, calls };
}

function connectorWith(routes: Record<string, Route>) {
  const { fetchImpl, calls } = stubFetch(routes);
  const client = new GithubClient({
    fetchImpl: fetchImpl as unknown as typeof fetch,
    limiter: new RateLimiter({ ratePerSecond: 1000, capacity: 1000 }),
    retry: { sleep: async () => {} },
  });

  return {
    calls,
    fetchImpl,
    connector: new GithubConnector({ clientFor: () => client, webhookSecret: "s3cret" }),
  };
}

const src: SourceContext = {
  sourceId: "11111111-1111-1111-1111-111111111111",
  workspaceId: "22222222-2222-2222-2222-222222222222",
  kind: "github",
  config: { owner: "acme", repo: "shop", branch: "main", includePullRequests: false },
};

async function collect(iterable: AsyncIterable<ItemRef>): Promise<ItemRef[]> {
  const items: ItemRef[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

describe("config", () => {
  it("requires owner, repo and branch", () => {
    const { connector } = connectorWith({});
    expect(() => connector.validateConfig({ owner: "acme", repo: "shop" })).toThrow();
  });

  it("includes pull requests by default", () => {
    const { connector } = connectorWith({});
    expect(
      connector.validateConfig({ owner: "acme", repo: "shop", branch: "main" }).includePullRequests,
    ).toBe(true);
  });
});

describe("testConnection", () => {
  it("reports success when the repository reads", async () => {
    const { connector } = connectorWith({ "/repos/acme/shop": () => ({ id: 1 }) });
    await expect(connector.testConnection(src)).resolves.toEqual({ ok: true });
  });

  it("reports the failure rather than throwing", async () => {
    const { connector } = connectorWith({});
    const result = await connector.testConnection(src);

    expect(result.ok).toBe(false);
  });
});

describe("full sync", () => {
  it("lists blobs from the recursive tree and skips trees", async () => {
    const { connector, calls } = connectorWith({
      "git/trees/main": () => ({
        sha: "head",
        tree: [
          { path: "api", type: "tree", sha: "t1" },
          { path: "api/cart.ts", type: "blob", sha: "b1", size: 120 },
          { path: "README.md", type: "blob", sha: "b2", size: 40 },
        ],
      }),
    });

    const items = await collect(connector.listItems(src));

    expect(items.map((i) => i.externalId)).toEqual(["api/cart.ts", "README.md"]);
    expect(items[0]).toMatchObject({ version: "b1", bytes: 120, meta: { oid: "b1" } });
    expect(calls[0]).toContain("recursive=1");
  });
});

describe("incremental sync", () => {
  it("lists only changed files and flags removals", async () => {
    const { connector, calls } = connectorWith({
      "/compare/": () => ({
        files: [
          { filename: "api/cart.ts", status: "modified", sha: "b9" },
          { filename: "api/old.ts", status: "removed", sha: "b8" },
        ],
      }),
    });

    const items = await collect(connector.listItems(src, { sha: "base123" }));

    expect(calls[0]).toContain("/compare/base123...main");
    expect(items.map((i) => i.externalId)).toEqual(["api/cart.ts", "api/old.ts"]);
    expect(items[0]!.meta?.removed).toBeUndefined();
    expect(items[1]!.meta?.removed).toBe(true);
  });

  it("treats a rename as a removal plus an addition", async () => {
    const { connector } = connectorWith({
      "/compare/": () => ({
        files: [
          {
            filename: "api/cart.ts",
            previous_filename: "api/basket.ts",
            status: "renamed",
            sha: "b9",
          },
        ],
      }),
    });

    const items = await collect(connector.listItems(src, { sha: "base123" }));

    expect(items.map((i) => [i.externalId, i.meta?.removed])).toEqual([
      ["api/basket.ts", true],
      ["api/cart.ts", undefined],
    ]);
  });
});

describe("pull requests", () => {
  const withPulls: SourceContext = {
    ...src,
    config: { ...src.config, includePullRequests: true },
  };

  function pullPage(count: number, page: number, merged = true) {
    return Array.from({ length: count }, (_, i) => {
      const number = (page - 1) * 100 + i + 1;
      return {
        number,
        title: `PR ${number}`,
        body: null,
        merged_at: merged ? "2026-01-01T00:00:00Z" : null,
        updated_at: `2026-01-0${Math.min(9, page)}T00:00:00Z`,
        html_url: `https://github.com/acme/shop/pull/${number}`,
      };
    });
  }

  it("skips pull requests that were closed without merging", async () => {
    const { connector } = connectorWith({
      "git/trees/main": () => ({ sha: "head", tree: [] }),
      "/pulls?": (url) =>
        new URL(url).searchParams.get("page") === "1" ? pullPage(2, 1, false) : [],
    });

    expect(await collect(connector.listItems(withPulls))).toEqual([]);
  });

  it("stops at 200 merged pull requests", async () => {
    const { connector } = connectorWith({
      "git/trees/main": () => ({ sha: "head", tree: [] }),
      "/pulls?": (url) => {
        const page = Number(new URL(url).searchParams.get("page"));
        return page <= 3 ? pullPage(100, page) : [];
      },
    });

    const items = await collect(connector.listItems(withPulls));
    expect(items).toHaveLength(MERGED_PR_LIMIT);
  });

  it("fetches a pull request as a ticket with its changed paths", async () => {
    const { connector } = connectorWith({
      "/pulls/7/files": () => [{ filename: "api/cart.ts" }, { filename: "docs/cart.md" }],
      "/pulls/7": () => ({
        number: 7,
        title: "Clamp cart quantity",
        body: "Fixes SHOP-110.",
        merged_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
        html_url: "https://github.com/acme/shop/pull/7",
        user: { login: "priya.n" },
        labels: [{ name: "cart" }],
      }),
    });

    const item = await connector.fetchItem(src, {
      externalId: "pr/7",
      pathOrUrl: "https://github.com/acme/shop/pull/7",
      version: "2026-01-02T00:00:00Z",
      meta: { type: "pull_request", number: 7 },
    });

    expect(item.kind).toBe("ticket");
    expect(item.content).toContain("Clamp cart quantity");
    expect(item.content).toContain("- api/cart.ts");
    expect(item.meta).toMatchObject({ author: "priya.n", labels: ["cart"] });
  });
});

describe("blob fetching", () => {
  const refs = (count: number): ItemRef[] =>
    Array.from({ length: count }, (_, i) => ({
      externalId: `src/f${i}.ts`,
      pathOrUrl: `src/f${i}.ts`,
      version: `oid${i}`,
      meta: { type: "blob", oid: `oid${i}` },
    }));

  it("batches 50 blobs per GraphQL query", async () => {
    const { connector, calls } = connectorWith({
      "/graphql": (_url, init) => {
        const body = JSON.parse(String(init.body)) as { query: string };
        const aliases = [...body.query.matchAll(/b(\d+): object/g)].map((m) => m[1]);
        const repository = Object.fromEntries(
          aliases.map((alias) => [`b${alias}`, { text: `content ${alias}`, isBinary: false, byteSize: 9 }]),
        );
        return { data: { repository } };
      },
    });

    const items = await connector.fetchBatch(src, refs(120));

    expect(calls.filter((c) => c.includes("/graphql"))).toHaveLength(3);
    expect(items).toHaveLength(120);
  });

  it("labels the language from the path", async () => {
    const { connector } = connectorWith({
      "/graphql": () => ({
        data: { repository: { b0: { text: "export {}", isBinary: false, byteSize: 9 } } },
      }),
    });

    const [item] = await connector.fetchBatch(src, refs(1));
    expect(item).toMatchObject({ language: "typescript", kind: "code", content: "export {}" });
  });

  it("drops blobs GitHub reports as binary", async () => {
    const { connector } = connectorWith({
      "/graphql": () => ({
        data: { repository: { b0: { text: null, isBinary: true, byteSize: 400 } } },
      }),
    });

    expect(await connector.fetchBatch(src, refs(1))).toEqual([]);
  });

  it("surfaces a GraphQL error rather than returning empty content", async () => {
    const { connector } = connectorWith({
      "/graphql": () => ({ errors: [{ message: "Bad credentials" }] }),
    });

    await expect(connector.fetchBatch(src, refs(1))).rejects.toThrow("Bad credentials");
  });
});

describe("nextCursor", () => {
  it("records the branch head sha", async () => {
    const { connector } = connectorWith({
      "/commits/main": () => ({ sha: "head123", commit: { committer: { date: "x" } } }),
    });

    await expect(connector.nextCursor(src)).resolves.toMatchObject({ sha: "head123" });
  });
});
