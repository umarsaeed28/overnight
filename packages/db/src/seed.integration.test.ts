import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withUser } from "./client.js";
import { memberships, sources, workspaces } from "./schema/index.js";
import { seed, FIXTURE_WORKSPACE_SLUG } from "./seed.js";
import { createTestDatabase, type TestDatabase } from "./testing/pg.js";

let db: TestDatabase;

beforeAll(async () => {
  db = await createTestDatabase("seed");
});

afterAll(async () => {
  await db?.close();
});

describe("seed", () => {
  it("creates the demo user, fixture workspace, owner membership and fixture source", async () => {
    const { userId, workspaceId } = await seed(db.admin);

    const visible = await withUser(db.app, userId, (tx) =>
      tx.select({ slug: workspaces.slug }).from(workspaces),
    );
    expect(visible.map((w) => w.slug)).toEqual([FIXTURE_WORKSPACE_SLUG]);

    const [membership] = await db.admin.select({ role: memberships.role }).from(memberships);
    expect(membership!.role).toBe("owner");

    const [source] = await db.admin.select({ kind: sources.kind }).from(sources);
    expect(source!.kind).toBe("fixture");
    expect(workspaceId).toBeTruthy();
  });

  it("is idempotent, so `pnpm db:seed` can run on every boot", async () => {
    const first = await seed(db.admin);
    const second = await seed(db.admin);
    expect(second).toEqual(first);

    const allSources = await db.admin.select({ id: sources.id }).from(sources);
    expect(allSources).toHaveLength(1);
  });
});
