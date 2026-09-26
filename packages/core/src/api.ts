import { z } from "zod";
import { buildModeSchema, roleSchema, sourceKindSchema, sourceStatusSchema } from "./domain.js";

export const uuidSchema = z.string().uuid();

/* ---------- workspaces ---------- */

export const workspaceSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  monthly_llm_budget_usd: z.number(),
  role: roleSchema,
  created_at: z.string(),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const createWorkspaceBody = z.object({
  name: z.string().min(1).max(120),
});

export const listWorkspacesResponse = z.object({
  workspaces: z.array(workspaceSchema),
});

export const sourceSummarySchema = z.object({
  id: uuidSchema,
  kind: sourceKindSchema,
  display_name: z.string(),
  status: sourceStatusSchema,
  last_synced_at: z.string().nullable(),
  last_error: z.string().nullable(),
  document_count: z.number().int(),
});

export const workspaceDetailResponse = z.object({
  workspace: workspaceSchema,
  sources: z.array(sourceSummarySchema),
});

/* ---------- members ---------- */

export const memberSchema = z.object({
  user_id: uuidSchema,
  email: z.string().email(),
  name: z.string().nullable(),
  role: roleSchema,
});

export const listMembersResponse = z.object({ members: z.array(memberSchema) });

export const inviteMemberBody = z.object({
  email: z.string().email(),
  role: roleSchema,
});

export const updateMemberBody = z.object({ role: roleSchema });

/* ---------- builds ---------- */

export const createBuildBody = z.object({ mode: buildModeSchema });

/* ---------- path params ---------- */

export const workspaceParams = z.object({ ws: uuidSchema });
