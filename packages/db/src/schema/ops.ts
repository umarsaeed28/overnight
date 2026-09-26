import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const builds = pgTable("builds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  mode: text("mode").notNull(),
  trigger: text("trigger").notNull(),
  status: text("status").notNull(),
  stats: jsonb("stats"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  error: text("error"),
});

export const jobEvents = pgTable("job_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  buildId: uuid("build_id"),
  stage: text("stage").notNull(),
  status: text("status").notNull(),
  itemRef: text("item_ref"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Every claim the validator changed, and why (section 14.3). */
export const validationEvents = pgTable("validation_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  buildId: uuid("build_id"),
  knowledgeFileId: text("knowledge_file_id"),
  claimText: text("claim_text").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Metadata only. Never prompt or completion content (section 23). */
export const llmCalls = pgTable("llm_calls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id"),
  buildId: uuid("build_id"),
  purpose: text("purpose").notNull(),
  promptId: text("prompt_id").notNull(),
  promptVersion: text("prompt_version").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cacheReadTokens: integer("cache_read_tokens"),
  cacheWriteTokens: integer("cache_write_tokens"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 5 }),
  latencyMs: integer("latency_ms"),
  status: text("status"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const evalDatasets = pgTable(
  "eval_datasets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id").notNull(),
    suite: text("suite").notNull(),
    version: integer("version").notNull(),
    frozenAt: timestamp("frozen_at", { withTimezone: true }),
    itemCount: integer("item_count"),
  },
  (t) => [unique("eval_datasets_workspace_suite_version_key").on(t.workspaceId, t.suite, t.version)],
);

export const evalDatasetItems = pgTable("eval_dataset_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: uuid("dataset_id")
    .notNull()
    .references(() => evalDatasets.id, { onDelete: "cascade" }),
  input: jsonb("input").notNull(),
  expected: jsonb("expected").notNull(),
  /** generated | human. Human labels are appended on the next dataset version. */
  origin: text("origin").notNull(),
});

export const evalRuns = pgTable("eval_runs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  suite: text("suite").notNull(),
  datasetId: uuid("dataset_id"),
  gitSha: text("git_sha"),
  promptVersions: jsonb("prompt_versions"),
  models: jsonb("models"),
  metrics: jsonb("metrics"),
  passed: boolean("passed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const evalResults = pgTable("eval_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: uuid("run_id")
    .notNull()
    .references(() => evalRuns.id, { onDelete: "cascade" }),
  itemId: uuid("item_id"),
  actual: jsonb("actual"),
  scores: jsonb("scores"),
  notes: text("notes"),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id"),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  target: text("target"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
