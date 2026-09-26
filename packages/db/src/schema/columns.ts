import { customType } from "drizzle-orm/pg-core";

/** Sealed credential blobs (libsodium secretbox output). */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * Generated full-text column. Read-only from the app's point of view: Postgres
 * maintains it, so it is never part of an insert.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType: () => "tsvector",
});
