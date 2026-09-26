import { z } from "zod";

export const roleSchema = z.enum(["owner", "editor", "viewer"]);
export type Role = z.infer<typeof roleSchema>;

/** owner ⊃ editor ⊃ viewer */
const ROLE_RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };

export function roleSatisfies(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export const sourceKindSchema = z.enum([
  "github",
  "ado_repo",
  "ado_wiki",
  "ado_boards",
  "confluence",
  "jira",
  "fixture",
]);
export type SourceKind = z.infer<typeof sourceKindSchema>;

export const sourceStatusSchema = z.enum(["pending", "syncing", "ready", "error", "paused"]);
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const documentKindSchema = z.enum(["code", "doc", "ticket", "test", "config"]);
export type DocumentKind = z.infer<typeof documentKindSchema>;

export const symbolKindSchema = z.enum([
  "route",
  "page",
  "component",
  "handler",
  "model",
  "schema",
  "flag",
  "env_read",
  "test",
  "test_suite",
]);
export type SymbolKind = z.infer<typeof symbolKindSchema>;

export const chunkKindSchema = z.enum(["code", "doc", "ticket", "test", "config", "knowledge"]);
export type ChunkKind = z.infer<typeof chunkKindSchema>;

export const claimKindSchema = z.enum(["stated", "derived", "inferred"]);
export type ClaimKind = z.infer<typeof claimKindSchema>;

export const claimStatusSchema = z.enum(["active", "dropped", "confirmed", "rejected"]);
export type ClaimStatus = z.infer<typeof claimStatusSchema>;

export const knowledgeFileTypeSchema = z.enum([
  "overview",
  "feature",
  "flow",
  "api",
  "data_model",
  "rules",
  "coverage",
  "glossary",
  "conflicts",
]);
export type KnowledgeFileType = z.infer<typeof knowledgeFileTypeSchema>;

export const criticalitySchema = z.enum(["high", "medium", "low"]);
export type Criticality = z.infer<typeof criticalitySchema>;

/** Gap score weights from section 16. */
export const CRITICALITY_WEIGHT: Record<Criticality, number> = { high: 3, medium: 2, low: 1 };

export const conflictStatusSchema = z.enum(["open", "acknowledged", "resolved", "not_a_conflict"]);
export type ConflictStatus = z.infer<typeof conflictStatusSchema>;

export const edgeRelSchema = z.enum([
  "implements",
  "tested_by",
  "documented_in",
  "tracked_by",
  "calls",
  "renders",
  "reads",
  "writes",
  "part_of",
]);
export type EdgeRel = z.infer<typeof edgeRelSchema>;

export const coverageMethodSchema = z.enum(["route_match", "selector_match", "semantic"]);
export type CoverageMethod = z.infer<typeof coverageMethodSchema>;

export const prioritySchema = z.enum(["p0", "p1", "p2", "p3"]);
export type Priority = z.infer<typeof prioritySchema>;

export const testCaseStatusSchema = z.enum(["draft", "approved", "rejected"]);
export type TestCaseStatus = z.infer<typeof testCaseStatusSchema>;

export const testFocusSchema = z.enum([
  "happy_path",
  "edge_cases",
  "negative",
  "regression_for_conflict",
]);
export type TestFocus = z.infer<typeof testFocusSchema>;

export const buildModeSchema = z.enum(["full", "incremental"]);
export type BuildMode = z.infer<typeof buildModeSchema>;

export const buildTriggerSchema = z.enum(["manual", "webhook", "schedule"]);
export type BuildTrigger = z.infer<typeof buildTriggerSchema>;

export const buildStatusSchema = z.enum(["queued", "running", "succeeded", "failed", "partial"]);
export type BuildStatus = z.infer<typeof buildStatusSchema>;

export const buildStageSchema = z.enum([
  "sync",
  "fetch",
  "scrub",
  "parse",
  "chunk",
  "summarize",
  "embed",
  "cluster",
  "extract",
  "validate",
  "link",
  "coverage",
  "render_globals",
  "finalize",
]);
export type BuildStage = z.infer<typeof buildStageSchema>;

export const chatRoleSchema = z.enum(["user", "assistant", "tool"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low", "not_found"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const supportSchema = z.enum(["yes", "partial", "no"]);
export type Support = z.infer<typeof supportSchema>;

/** Reasons the validator (section 14) gives when it changes a claim. */
export const validationReasonSchema = z.enum([
  "unknown_chunk",
  "not_in_input",
  "kind_mismatch",
  "number_not_in_source",
  "duplicate_step",
  "conflict_side_mismatch",
  "entailment_no",
  "entailment_partial",
  "citation_unsupported",
]);
export type ValidationReason = z.infer<typeof validationReasonSchema>;

/** A single cited factual statement. The unit that principle 1 protects. */
export const claimSchema = z.object({
  text: z.string().min(1).max(400),
  kind: claimKindSchema,
  chunk_ids: z.array(z.string()).min(1),
});
export type Claim = z.infer<typeof claimSchema>;
