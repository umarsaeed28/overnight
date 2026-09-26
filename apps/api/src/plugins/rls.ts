import { forbidden, notFound, roleSatisfies, type Role } from "@oqa/core";
import { schema, withUser, withWorkspace, type Database, type Transaction } from "@oqa/db";
import { and, eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export interface WorkspaceScope {
  workspaceId: string;
  role: Role;
}

declare module "fastify" {
  interface FastifyRequest {
    /**
     * Runs `fn` inside a transaction with `app.workspace_id` and `app.user_id`
     * set, after checking the caller's membership role.
     */
    inWorkspace<T>(
      workspaceId: string,
      requiredRole: Role,
      fn: (tx: Transaction, scope: WorkspaceScope) => Promise<T>,
    ): Promise<T>;
    /** For the reads that precede workspace selection (the workspace list). */
    asUser<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
  }
}

export interface RlsPluginOptions {
  db: Database;
}

export default fp<RlsPluginOptions>(
  async (app, { db }) => {
    app.decorateRequest(
      "inWorkspace",
      async function inWorkspace<T>(
        this: FastifyRequest,
        workspaceId: string,
        requiredRole: Role,
        fn: (tx: Transaction, scope: WorkspaceScope) => Promise<T>,
      ): Promise<T> {
        const user = this.requireUser();

        const rows = await withUser(db, user.id, (tx) =>
          tx
            .select({ role: schema.memberships.role })
            .from(schema.memberships)
            .where(
              and(
                eq(schema.memberships.workspaceId, workspaceId),
                eq(schema.memberships.userId, user.id),
              ),
            ),
        );

        // A workspace the caller is not a member of is indistinguishable from
        // one that does not exist (section 23).
        const role = rows[0]?.role as Role | undefined;
        if (!role) throw notFound("That workspace does not exist.");

        if (!roleSatisfies(role, requiredRole)) {
          throw forbidden(
            `This action needs the ${requiredRole} role. Ask a workspace owner to change your role.`,
          );
        }

        return withWorkspace(db, { workspaceId, userId: user.id }, (tx) =>
          fn(tx, { workspaceId, role }),
        );
      },
    );

    app.decorateRequest(
      "asUser",
      async function asUser<T>(this: FastifyRequest, fn: (tx: Transaction) => Promise<T>) {
        const user = this.requireUser();
        return withUser(db, user.id, fn);
      },
    );
  },
  { name: "rls", dependencies: ["auth"] },
);
