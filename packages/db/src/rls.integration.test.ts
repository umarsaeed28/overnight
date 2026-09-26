import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withUser, withWorkspace } from "./client.js";
import {
  chunks,
  claimCitations,
  claims,
  documents,
  memberships,
  sources,
  users,
  workspaces,
} from "./schema/index.js";
import { createTestDatabase, type TestDatabase } from "./testing/pg.js";

let db: TestDatabase;

/** Two tenants that must never see each other, plus an outsider. */
const fixture = {
  alphaWorkspace: "",
  betaWorkspace: "",
  alphaUser: "",
  betaUser: "",
  alphaChunk: "c_a1",
  betaChunk: "c_b1",
  alphaClaim: "",
};

beforeAll(async () => {
  db = await createTestDatabase("rls");

  const [alphaUser, betaUser] = await db.admin
    .insert(users)
    .values([{ email: "alpha@example.com" }, { email: "beta@example.com" }])
    .returning({ id: users.id });
  fixture.alphaUser = alphaUser!.id;
  fixture.betaUser = betaUser!.id;

  const [alpha, beta] = await db.admin
    .insert(workspaces)
    .values([
      { name: "Alpha", slug: "alpha" },
      { name: "Beta", slug: "beta" },
    ])
    .returning({ id: workspaces.id });
  fixture.alphaWorkspace = alpha!.id;
  fixture.betaWorkspace = beta!.id;

  await db.admin.insert(memberships).values([
    { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser, role: "owner" },
    { workspaceId: fixture.betaWorkspace, userId: fixture.betaUser, role: "owner" },
  ]);

  for (const [workspaceId, chunkId, slug] of [
    [fixture.alphaWorkspace, fixture.alphaChunk, "alpha"],
    [fixture.betaWorkspace, fixture.betaChunk, "beta"],
  ] as const) {
    const [source] = await db.admin
      .insert(sources)
      .values({
        workspaceId,
        kind: "fixture",
        displayName: `${slug} fixture`,
        config: { root: `fixtures/${slug}` },
      })
      .returning({ id: sources.id });

    const [document] = await db.admin
      .insert(documents)
      .values({
        workspaceId,
        sourceId: source!.id,
        externalId: "app/checkout/page.tsx",
        pathOrUrl: "app/checkout/page.tsx",
        kind: "code",
        language: "ts",
        version: "sha-1",
        contentHash: "hash-1",
        s3Key: `${slug}/app/checkout/page.tsx`,
      })
      .returning({ id: documents.id });

    await db.admin.insert(chunks).values({
      id: chunkId,
      workspaceId,
      documentId: document!.id,
      kind: "code",
      breadcrumb: `${slug}:app/checkout/page.tsx > CheckoutPage`,
      content: "export default function CheckoutPage() { return <Checkout /> }",
      summary: "Renders the checkout page.",
      tokenCount: 20,
      contentHash: "hash-1",
    });
  }

  const [claim] = await db.admin
    .insert(claims)
    .values({
      workspaceId: fixture.alphaWorkspace,
      knowledgeFileId: "flow.checkout-guest",
      section: "steps",
      ordinal: 1,
      text: "User opens /checkout while logged out.",
      kind: "derived",
      stableKey: "stable-1",
    })
    .returning({ id: claims.id });
  fixture.alphaClaim = claim!.id;

  await db.admin
    .insert(claimCitations)
    .values({ claimId: fixture.alphaClaim, chunkId: fixture.alphaChunk, support: "yes" });
});

afterAll(async () => {
  await db?.close();
});

describe("migrations", () => {
  it("installs pgvector and pg_trgm", async () => {
    const result = await db.admin.execute<{ extname: string }>(
      sql`select extname from pg_extension where extname in ('vector', 'pg_trgm') order by extname`,
    );
    expect(result.rows.map((r) => r.extname)).toEqual(["pg_trgm", "vector"]);
  });

  it("maintains the generated tsvector from breadcrumb, summary and content", async () => {
    const result = await db.admin.execute<{ tsv: string }>(
      sql`select tsv::text as tsv from chunks where id = ${fixture.alphaChunk}`,
    );
    expect(result.rows[0]!.tsv).toContain("checkout");
  });

  it("creates the retrieval indexes the search pipeline depends on", async () => {
    const result = await db.admin.execute<{ indexname: string }>(
      sql`select indexname from pg_indexes where tablename = 'chunks' order by indexname`,
    );
    const names = result.rows.map((r) => r.indexname);
    expect(names).toContain("chunks_embedding_idx");
    expect(names).toContain("chunks_tsv_idx");
    expect(names).toContain("chunks_breadcrumb_trgm_idx");
  });
});

describe("row level security", () => {
  it("runs app queries as oqa_app, not the table owner", async () => {
    const result = await db.app.execute<{ current_user: string }>(sql`select current_user`);
    expect(result.rows[0]!.current_user).toBe("oqa_app");
  });

  it("returns zero rows when no workspace is set", async () => {
    const result = await db.app.select().from(chunks);
    expect(result).toEqual([]);
  });

  it("returns only the current workspace's chunks", async () => {
    const rows = await withWorkspace(
      db.app,
      { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser },
      (tx) => tx.select({ id: chunks.id }).from(chunks),
    );
    expect(rows.map((r) => r.id)).toEqual([fixture.alphaChunk]);
  });

  it("hides another tenant's row even when its primary key is known", async () => {
    const rows = await withWorkspace(
      db.app,
      { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser },
      (tx) => tx.select().from(chunks).where(sql`id = ${fixture.betaChunk}`),
    );
    expect(rows).toEqual([]);
  });

  it("hides another tenant's documents and sources", async () => {
    const rows = await withWorkspace(
      db.app,
      { workspaceId: fixture.betaWorkspace, userId: fixture.betaUser },
      async (tx) => ({
        documents: await tx.select({ id: documents.id }).from(documents),
        sources: await tx.select({ id: sources.id }).from(sources),
      }),
    );
    expect(rows.documents).toHaveLength(1);
    expect(rows.sources).toHaveLength(1);
  });

  it("refuses an insert that claims a different workspace", async () => {
    await expect(
      withWorkspace(
        db.app,
        { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser },
        (tx) =>
          tx.insert(claims).values({
            workspaceId: fixture.betaWorkspace,
            knowledgeFileId: "flow.smuggled",
            section: "steps",
            ordinal: 1,
            text: "Planted in another tenant.",
            kind: "inferred",
            stableKey: "stable-smuggled",
          }),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("refuses an update that moves a row into another workspace", async () => {
    await expect(
      withWorkspace(
        db.app,
        { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser },
        (tx) =>
          tx
            .update(claims)
            .set({ workspaceId: fixture.betaWorkspace })
            .where(sql`id = ${fixture.alphaClaim}`),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("isolates claim_citations through its parent claim", async () => {
    const visible = await withWorkspace(
      db.app,
      { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser },
      (tx) => tx.select().from(claimCitations),
    );
    expect(visible).toHaveLength(1);

    const hidden = await withWorkspace(
      db.app,
      { workspaceId: fixture.betaWorkspace, userId: fixture.betaUser },
      (tx) => tx.select().from(claimCitations),
    );
    expect(hidden).toEqual([]);
  });
});

describe("pre-workspace reads", () => {
  it("lists only the workspaces the user belongs to", async () => {
    const rows = await withUser(db.app, fixture.alphaUser, (tx) =>
      tx.select({ slug: workspaces.slug }).from(workspaces),
    );
    expect(rows.map((r) => r.slug)).toEqual(["alpha"]);
  });

  it("lets a user see their own memberships and no one else's", async () => {
    const rows = await withUser(db.app, fixture.betaUser, (tx) =>
      tx.select({ workspaceId: memberships.workspaceId }).from(memberships),
    );
    expect(rows.map((r) => r.workspaceId)).toEqual([fixture.betaWorkspace]);
  });

  it("shows co-members of the workspace in scope, but not strangers", async () => {
    const inScope = await withWorkspace(
      db.app,
      { workspaceId: fixture.alphaWorkspace, userId: fixture.alphaUser },
      (tx) => tx.select({ email: users.email }).from(users),
    );
    expect(inScope.map((r) => r.email)).toEqual(["alpha@example.com"]);
  });
});
