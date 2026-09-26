import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Client } from "pg";
import { createAdminPool, createAppPool, createDb, type Database } from "../client.js";
import { runMigrations } from "../migrate.js";

export interface TestDatabase {
  /** Owner connection: bypasses RLS. Use for setup and for "what is really there". */
  admin: Database;
  /** `oqa_app` connection: subject to RLS. Use for anything under test. */
  app: Database;
  connectionString: string;
  close(): Promise<void>;
}

/** Matches the spec's Postgres 16 + pgvector 0.8 target. */
const IMAGE = "pgvector/pgvector:0.8.0-pg16";

let container: StartedPostgreSqlContainer | undefined;

/**
 * Where the throwaway databases are created. Either an existing Postgres 16
 * server with pgvector and pg_trgm available:
 *
 *   TEST_DATABASE_URL=postgres://oqa@localhost:55432/postgres
 *
 * or, when that is unset, a testcontainers-managed `pgvector` container started
 * once per process. The env var exists because a container runtime is not
 * always available on a dev machine.
 */
async function adminUrl(): Promise<string> {
  const fromEnv = process.env.TEST_DATABASE_URL;
  if (fromEnv) return fromEnv;

  container ??= await new PostgreSqlContainer(IMAGE)
    .withDatabase("postgres")
    .withUsername("oqa")
    .withPassword("oqa")
    .start();
  return container.getConnectionUri();
}

let counter = 0;

/**
 * Create a fresh, migrated database. Each test file gets its own so parallel
 * files cannot see each other's rows.
 */
export async function createTestDatabase(label = "test"): Promise<TestDatabase> {
  const url = await adminUrl();
  const name = `oqa_${label.replace(/\W/g, "_")}_${process.pid}_${counter++}`.toLowerCase();
  const bootstrap = new Client({ connectionString: url });
  await bootstrap.connect();
  await bootstrap.query(`drop database if exists ${name}`);
  await bootstrap.query(`create database ${name}`);
  await bootstrap.end();

  const target = new URL(url);
  target.pathname = `/${name}`;
  const connectionString = target.toString();

  const adminPool = createAdminPool({ connectionString });
  await runMigrations(adminPool);

  const appPool = createAppPool({ connectionString });

  return {
    admin: createDb(adminPool),
    app: createDb(appPool),
    connectionString,
    async close() {
      await appPool.end();
      await adminPool.end();
      const cleanup = new Client({ connectionString: url });
      await cleanup.connect();
      await cleanup.query(`drop database if exists ${name} with (force)`);
      await cleanup.end();
    },
  };
}
