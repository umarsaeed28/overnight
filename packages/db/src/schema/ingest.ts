import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { EMBEDDING_DIMENSIONS } from "@oqa/core/models";
import { bytea, tsvector } from "./columns.js";
import { workspaces } from "./identity.js";

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  displayName: text("display_name").notNull(),
  config: jsonb("config").notNull(),
  /** Sealed tokens. Decrypted only in the worker, at use time. */
  credentialsEnc: bytea("credentials_enc"),
  status: text("status").notNull().default("pending"),
  cursor: jsonb("cursor"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastError: text("last_error"),
});

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id").notNull(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    pathOrUrl: text("path_or_url").notNull(),
    title: text("title"),
    kind: text("kind").notNull(),
    language: text("language"),
    version: text("version").notNull(),
    /** sha256 of the *scrubbed* content. */
    contentHash: text("content_hash").notNull(),
    s3Key: text("s3_key").notNull(),
    bytes: integer("bytes"),
    isCurrent: boolean("is_current").notNull().default(true),
    skippedReason: text("skipped_reason"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("documents_source_external_version_key").on(t.sourceId, t.externalId, t.version),
    index("documents_workspace_current_idx").on(t.workspaceId, t.isCurrent),
  ],
);

export const symbols = pgTable(
  "symbols",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    signature: text("signature"),
    lineStart: integer("line_start"),
    lineEnd: integer("line_end"),
    meta: jsonb("meta"),
  },
  (t) => [index("symbols_workspace_kind_idx").on(t.workspaceId, t.kind)],
);

export const chunks = pgTable(
  "chunks",
  {
    /** `c_` + per-workspace base36 counter. Reused across builds (section 7.2). */
    id: text("id").primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    symbolId: uuid("symbol_id").references(() => symbols.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    breadcrumb: text("breadcrumb"),
    lineStart: integer("line_start"),
    lineEnd: integer("line_end"),
    section: text("section"),
    content: text("content").notNull(),
    summary: text("summary"),
    tokenCount: integer("token_count").notNull(),
    contentHash: text("content_hash").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embedModel: text("embed_model"),
    tsv: tsvector("tsv"),
    featureId: uuid("feature_id"),
    isCurrent: boolean("is_current").notNull().default(true),
  },
  (t) => [index("chunks_workspace_document_idx").on(t.workspaceId, t.documentId)],
);

/**
 * One row per workspace, locked `for update` while allocating chunk ids so the
 * base36 counter stays gapless under concurrent chunk jobs.
 */
export const chunkIdCounters = pgTable("chunk_id_counters", {
  workspaceId: uuid("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  nextValue: integer("next_value").notNull().default(0),
});

export const features = pgTable(
  "features",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    origin: text("origin").notNull().default("auto"),
    /** Human renames, merges, splits, locks. Reapplied on every build. */
    humanOverride: jsonb("human_override"),
  },
  (t) => [unique("features_workspace_slug_key").on(t.workspaceId, t.slug)],
);
