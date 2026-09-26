import { badRequest, slugify } from "@oqa/core";
import { schema, type Database } from "@oqa/db";
import { eq } from "drizzle-orm";

/**
 * Workspace creation and user upsert are the only operations that run on the
 * admin pool. They cannot run under RLS: the row that grants access does not
 * exist yet, so no `app.workspace_id` can satisfy the policy. Everything else in
 * the API goes through `request.inWorkspace`.
 */
export async function createWorkspaceForUser(
  adminDb: Database,
  input: { name: string; userId: string },
): Promise<{ id: string; name: string; slug: string; monthlyLlmBudgetUsd: number; createdAt: string }> {
  const name = input.name.trim();
  if (!name) throw badRequest("Give the workspace a name.");

  return adminDb.transaction(async (tx) => {
    const slug = await uniqueSlug(tx, name);

    const [workspace] = await tx
      .insert(schema.workspaces)
      .values({ name, slug })
      .returning();

    await tx
      .insert(schema.memberships)
      .values({ workspaceId: workspace!.id, userId: input.userId, role: "owner" });

    await tx.insert(schema.auditLog).values({
      workspaceId: workspace!.id,
      userId: input.userId,
      action: "workspace.create",
      target: workspace!.id,
      meta: { name, slug },
    });

    return {
      id: workspace!.id,
      name: workspace!.name,
      slug: workspace!.slug,
      monthlyLlmBudgetUsd: Number(workspace!.monthlyLlmBudgetUsd ?? 0),
      createdAt: (workspace!.createdAt ?? new Date()).toISOString(),
    };
  });
}

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** `checkout`, then `checkout-2`, `checkout-3`. */
async function uniqueSlug(tx: Tx, name: string): Promise<string> {
  const base = slugify(name) || "workspace";
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    const taken = await tx
      .select({ slug: schema.workspaces.slug })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, candidate));
    if (taken.length === 0) return candidate;
  }
  throw badRequest("Too many workspaces with that name. Pick a different one.");
}

/** Called after a successful sign-in, before any workspace exists. */
export async function upsertUser(
  adminDb: Database,
  input: { email: string; name?: string | null },
): Promise<{ id: string; email: string }> {
  const [user] = await adminDb
    .insert(schema.users)
    .values({ email: input.email.toLowerCase(), name: input.name ?? null })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { name: input.name ?? null },
    })
    .returning({ id: schema.users.id, email: schema.users.email });
  return user!;
}
