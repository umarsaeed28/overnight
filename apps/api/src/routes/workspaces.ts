import { api, conflict, notFound, type Role } from "@oqa/core";
import { schema } from "@oqa/db";
import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { createWorkspaceForUser } from "../services/workspaces.js";

const workspaceRoutes: FastifyPluginAsyncZod = async (app) => {
  const { adminDb } = app.deps;

  app.get(
    "/workspaces",
    { schema: { response: { 200: api.listWorkspacesResponse } } },
    async (request) => {
      const rows = await request.asUser((tx) =>
        tx
          .select({
            id: schema.workspaces.id,
            name: schema.workspaces.name,
            slug: schema.workspaces.slug,
            budget: schema.workspaces.monthlyLlmBudgetUsd,
            createdAt: schema.workspaces.createdAt,
            role: schema.memberships.role,
          })
          .from(schema.workspaces)
          .innerJoin(
            schema.memberships,
            eq(schema.memberships.workspaceId, schema.workspaces.id),
          )
          .orderBy(schema.workspaces.name),
      );

      return {
        workspaces: rows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          monthly_llm_budget_usd: Number(row.budget ?? 0),
          role: row.role as Role,
          created_at: (row.createdAt ?? new Date()).toISOString(),
        })),
      };
    },
  );

  app.post(
    "/workspaces",
    { schema: { body: api.createWorkspaceBody, response: { 201: api.workspaceSchema } } },
    async (request, reply) => {
      const user = request.requireUser();
      const workspace = await createWorkspaceForUser(adminDb, {
        name: request.body.name,
        userId: user.id,
      });

      reply.code(201);
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        monthly_llm_budget_usd: workspace.monthlyLlmBudgetUsd,
        role: "owner" as const,
        created_at: workspace.createdAt,
      };
    },
  );

  app.get(
    "/workspaces/:ws",
    {
      schema: { params: api.workspaceParams, response: { 200: api.workspaceDetailResponse } },
    },
    async (request) => {
      return request.inWorkspace(request.params.ws, "viewer", async (tx, scope) => {
        const [workspace] = await tx
          .select()
          .from(schema.workspaces)
          .where(eq(schema.workspaces.id, scope.workspaceId));
        if (!workspace) throw notFound("That workspace does not exist.");

        const sources = await tx
          .select({
            id: schema.sources.id,
            kind: schema.sources.kind,
            displayName: schema.sources.displayName,
            status: schema.sources.status,
            lastSyncedAt: schema.sources.lastSyncedAt,
            lastError: schema.sources.lastError,
            documentCount: sql<number>`count(${schema.documents.id})`,
          })
          .from(schema.sources)
          .leftJoin(
            schema.documents,
            and(
              eq(schema.documents.sourceId, schema.sources.id),
              eq(schema.documents.isCurrent, true),
            ),
          )
          .groupBy(schema.sources.id)
          .orderBy(schema.sources.displayName);

        return {
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            monthly_llm_budget_usd: Number(workspace.monthlyLlmBudgetUsd ?? 0),
            role: scope.role,
            created_at: (workspace.createdAt ?? new Date()).toISOString(),
          },
          sources: sources.map((source) => ({
            id: source.id,
            kind: source.kind as never,
            display_name: source.displayName,
            status: source.status as never,
            last_synced_at: source.lastSyncedAt?.toISOString() ?? null,
            last_error: source.lastError ?? null,
            document_count: Number(source.documentCount),
          })),
        };
      });
    },
  );

  app.get(
    "/workspaces/:ws/members",
    { schema: { params: api.workspaceParams, response: { 200: api.listMembersResponse } } },
    async (request) => {
      return request.inWorkspace(request.params.ws, "viewer", async (tx) => {
        const rows = await tx
          .select({
            userId: schema.users.id,
            email: schema.users.email,
            name: schema.users.name,
            role: schema.memberships.role,
          })
          .from(schema.memberships)
          .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
          .orderBy(schema.users.email);

        return {
          members: rows.map((row) => ({
            user_id: row.userId,
            email: row.email,
            name: row.name ?? null,
            role: row.role as Role,
          })),
        };
      });
    },
  );

  app.patch(
    "/workspaces/:ws/members/:userId",
    {
      schema: {
        params: api.workspaceParams.extend({ userId: api.uuidSchema }),
        body: api.updateMemberBody,
        response: { 200: api.memberSchema },
      },
    },
    async (request) => {
      const actor = request.requireUser();
      const { ws, userId } = request.params;

      return request.inWorkspace(ws, "owner", async (tx) => {
        const [updated] = await tx
          .update(schema.memberships)
          .set({ role: request.body.role })
          .where(eq(schema.memberships.userId, userId))
          .returning({ role: schema.memberships.role });
        if (!updated) throw notFound("That member is not in this workspace.");

        const [user] = await tx
          .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, userId));

        await tx.insert(schema.auditLog).values({
          workspaceId: ws,
          userId: actor.id,
          action: "member.role_change",
          target: userId,
          meta: { role: request.body.role },
        });

        return {
          user_id: userId,
          email: user!.email,
          name: user!.name ?? null,
          role: updated.role as Role,
        };
      });
    },
  );

  app.delete(
    "/workspaces/:ws/members/:userId",
    {
      schema: {
        params: api.workspaceParams.extend({ userId: api.uuidSchema }),
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      const actor = request.requireUser();
      const { ws, userId } = request.params;

      await request.inWorkspace(ws, "owner", async (tx) => {
        const owners = await tx
          .select({ userId: schema.memberships.userId })
          .from(schema.memberships)
          .where(eq(schema.memberships.role, "owner"));

        // Losing the last owner would leave the workspace unmanageable: nobody
        // could connect sources, change roles, or delete it.
        if (owners.length === 1 && owners[0]!.userId === userId) {
          throw conflict("This is the only owner. Make someone else an owner first.");
        }

        const removed = await tx
          .delete(schema.memberships)
          .where(eq(schema.memberships.userId, userId))
          .returning({ userId: schema.memberships.userId });
        if (removed.length === 0) throw notFound("That member is not in this workspace.");

        await tx.insert(schema.auditLog).values({
          workspaceId: ws,
          userId: actor.id,
          action: "member.remove",
          target: userId,
        });
      });

      reply.code(204);
      return null;
    },
  );
};

export default workspaceRoutes;
