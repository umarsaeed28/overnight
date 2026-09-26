import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema/index.js";

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export const APP_ROLE = "oqa_app";

export interface PoolOptions extends PoolConfig {
  connectionString: string;
}

/**
 * Pool for the API and worker. Every connection switches to `oqa_app` on
 * checkout so the session is not the table owner and RLS policies bind. A bug
 * that forgets `withWorkspace` then returns zero rows instead of another
 * tenant's data.
 */
export function createAppPool(options: PoolOptions): Pool {
  // Applied as a startup parameter rather than a `set role` after connecting,
  // so there is no window in which a query could run as the owner.
  return new Pool({ ...options, options: `-c role=${APP_ROLE}` });
}

/** Pool for migrations and seeds. Owner role, bypasses RLS. */
export function createAdminPool(options: PoolOptions): Pool {
  return new Pool(options);
}

export function createDb(pool: Pool): Database {
  return drizzle(pool, { schema });
}

export interface WorkspaceContext {
  workspaceId: string;
  userId?: string | null;
}

/**
 * Run `fn` inside a transaction with `app.workspace_id` / `app.user_id` set
 * locally, which is what every RLS policy reads. All tenant data access goes
 * through here: the API request plugin and worker jobs both call it.
 */
export async function withWorkspace<T>(
  db: Database,
  context: WorkspaceContext,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.workspace_id', ${context.workspaceId}, true)`);
    await tx.execute(sql`select set_config('app.user_id', ${context.userId ?? ""}, true)`);
    return fn(tx);
  });
}

/**
 * For the few reads that precede workspace selection (the workspace list).
 * Only `app.user_id` is set, so the workspace-scoped policies match nothing and
 * the user sees exactly their own memberships.
 */
export async function withUser<T>(
  db: Database,
  userId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    return fn(tx);
  });
}
