import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./identity.js";

export const coverageLinks = pgTable(
  "coverage_links",
  {
    workspaceId: uuid("workspace_id").notNull(),
    flowId: text("flow_id").notNull(),
    testSymbolId: uuid("test_symbol_id").notNull(),
    stepOrdinals: integer("step_ordinals").array(),
    confidence: real("confidence").notNull(),
    method: text("method").notNull(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.flowId, t.testSymbolId] })],
);

export const testCases = pgTable("test_cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull(),
  flowId: text("flow_id").notNull(),
  title: text("title").notNull(),
  focus: text("focus").notNull(),
  preconditions: jsonb("preconditions").notNull(),
  steps: jsonb("steps").notNull(),
  expected: jsonb("expected").notNull(),
  priority: text("priority").notNull(),
  sourceClaimIds: uuid("source_claim_ids").array().notNull(),
  /** True when an expected line rests only on inferred claims (19.3). */
  needsConfirmation: boolean("needs_confirmation").notNull().default(false),
  playwrightSpec: text("playwright_spec"),
  compileStatus: text("compile_status"),
  compileError: text("compile_error"),
  status: text("status").notNull().default("draft"),
  statusReason: text("status_reason"),
  statusBy: uuid("status_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
