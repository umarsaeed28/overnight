import { loadEnv } from "@oqa/core";
import { createAdminPool, createDb, type Database } from "@oqa/db";

/**
 * The web app's only database use is Auth.js (users, accounts, verification
 * tokens), which runs before any workspace is in scope and so cannot go through
 * RLS. All tenant data reaches the UI through the API.
 */
let cached: Database | undefined;

export function authDb(): Database {
  if (!cached) {
    const env = loadEnv();
    cached = createDb(createAdminPool({ connectionString: env.DATABASE_URL }));
  }
  return cached;
}
