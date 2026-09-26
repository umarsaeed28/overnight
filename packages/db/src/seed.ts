import { eq } from "drizzle-orm";
import { createAdminPool, createDb, type Database } from "./client.js";
import { memberships, sources, users, workspaces } from "./schema/index.js";

export const DEMO_USER_EMAIL = "demo@overnight.local";
export const FIXTURE_WORKSPACE_SLUG = "shopdemo";

/** Idempotent: safe to run on every `pnpm db:seed`. */
export async function seed(db: Database): Promise<{ userId: string; workspaceId: string }> {
  const [user] = await db
    .insert(users)
    .values({ email: DEMO_USER_EMAIL, name: "Demo User" })
    .onConflictDoUpdate({ target: users.email, set: { name: "Demo User" } })
    .returning({ id: users.id });

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: "ShopDemo", slug: FIXTURE_WORKSPACE_SLUG })
    .onConflictDoUpdate({ target: workspaces.slug, set: { name: "ShopDemo" } })
    .returning({ id: workspaces.id });

  const userId = user!.id;
  const workspaceId = workspace!.id;

  await db
    .insert(memberships)
    .values({ workspaceId, userId, role: "owner" })
    .onConflictDoUpdate({
      target: [memberships.workspaceId, memberships.userId],
      set: { role: "owner" },
    });

  const existing = await db
    .select({ id: sources.id })
    .from(sources)
    .where(eq(sources.workspaceId, workspaceId));

  if (existing.length === 0) {
    await db.insert(sources).values({
      workspaceId,
      kind: "fixture",
      displayName: "ShopDemo fixture",
      config: { root: "fixtures/shopdemo" },
      status: "pending",
    });
  }

  return { userId, workspaceId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
    process.exit(1);
  }
  const pool = createAdminPool({ connectionString });
  try {
    const { workspaceId } = await seed(createDb(pool));
    console.log(`Seeded ${DEMO_USER_EMAIL} and workspace ${workspaceId} (${FIXTURE_WORKSPACE_SLUG}).`);
  } finally {
    await pool.end();
  }
}
