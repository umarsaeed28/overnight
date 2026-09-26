import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { features } from "./ingest.js";
import { users } from "./identity.js";

export const knowledgeFiles = pgTable(
  "knowledge_files",
  {
    /** e.g. `flow.checkout-guest`, unique per workspace, not globally. */
    id: text("id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    type: text("type").notNull(),
    path: text("path").notNull(),
    title: text("title").notNull(),
    featureId: uuid("feature_id").references(() => features.id, { onDelete: "set null" }),
    bodyJson: jsonb("body_json").notNull(),
    renderedMd: text("rendered_md").notNull(),
    criticality: text("criticality"),
    /** hash of cited chunk hashes + prompt version; drives incremental rebuild. */
    inputHash: text("input_hash").notNull(),
    promptVersion: text("prompt_version").notNull(),
    model: text("model").notNull(),
    buildId: uuid("build_id"),
    builtAt: timestamp("built_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.id] })],
);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  knowledgeFileId: text("knowledge_file_id").notNull(),
  section: text("section").notNull(),
  ordinal: integer("ordinal").notNull(),
  text: text("text").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("active"),
  statusReason: text("status_reason"),
  statusBy: uuid("status_by").references(() => users.id),
  /** Carries a human confirm/reject across rebuilds. */
  stableKey: text("stable_key").notNull(),
});

export const claimCitations = pgTable(
  "claim_citations",
  {
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    chunkId: text("chunk_id").notNull(),
    /** yes | partial, from the entailment check (14.2). */
    support: text("support"),
  },
  (t) => [primaryKey({ columns: [t.claimId, t.chunkId] })],
);

export const conflicts = pgTable("conflicts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  knowledgeFileId: text("knowledge_file_id").notNull(),
  description: text("description").notNull(),
  docChunkIds: text("doc_chunk_ids").array().notNull(),
  codeChunkIds: text("code_chunk_ids").array().notNull(),
  status: text("status").default("open"),
});

export const edges = pgTable(
  "edges",
  {
    workspaceId: uuid("workspace_id").notNull(),
    fromType: text("from_type").notNull(),
    fromId: text("from_id").notNull(),
    rel: text("rel").notNull(),
    toType: text("to_type").notNull(),
    toId: text("to_id").notNull(),
    weight: real("weight").default(1),
    evidenceChunkIds: text("evidence_chunk_ids").array(),
  },
  (t) => [
    primaryKey({
      columns: [t.workspaceId, t.fromType, t.fromId, t.rel, t.toType, t.toId],
    }),
  ],
);
