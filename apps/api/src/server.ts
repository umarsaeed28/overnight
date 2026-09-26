import { HttpError, type ErrorCode } from "@oqa/core";
import type { Database } from "@oqa/db";
import Fastify, { type FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import authPlugin, { type SessionVerifier } from "./plugins/auth.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import rlsPlugin from "./plugins/rls.js";
import ssePlugin from "./plugins/sse.js";
import workspaceRoutes from "./routes/workspaces.js";

export interface ServerDeps {
  /** RLS-bound pool. Everything tenant-scoped uses this. */
  db: Database;
  /** Owner pool. Only workspace creation and user upsert (see services/workspaces.ts). */
  adminDb: Database;
}

declare module "fastify" {
  interface FastifyInstance {
    deps: ServerDeps;
  }
}

export interface BuildServerOptions extends ServerDeps {
  verifySession: SessionVerifier;
  logger?: boolean | object;
  rateLimit?: boolean;
  /** Allowed browser origin for the web app. */
  appUrl?: string;
}

export const API_PREFIX = "/api/v1";

export async function buildServer(options: BuildServerOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
    // The web app and worker both attach one, and it ties logs to traces.
    requestIdHeader: "x-request-id",
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate("deps", { db: options.db, adminDb: options.adminDb });

  app.addHook("onSend", async (_request, reply, payload) => {
    // Section 23. The API serves JSON only, so the policy can be maximally
    // restrictive; the web app sets its own.
    reply.header("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
    reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "no-referrer");
    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      // 4xx is the client's problem and is expected traffic; only log the body.
      if (error.statusCode >= 500) request.log.error({ err: error }, "request failed");
      return reply.code(error.statusCode).send(error.toBody());
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send(
        new HttpError(
          "bad_request",
          "That request was not valid.",
          error.validation.map((issue) => ({
            path: issue.instancePath,
            message: issue.message,
          })),
        ).toBody(),
      );
    }

    if (isResponseSerializationError(error)) {
      // A response that does not match its schema is our bug, not the caller's.
      request.log.error({ err: error }, "response failed its own schema");
      return reply
        .code(500)
        .send(new HttpError("internal", "Something went wrong. Try again.").toBody());
    }

    const fastifyError = error as { statusCode?: number; message?: string };
    const status = typeof fastifyError.statusCode === "number" ? fastifyError.statusCode : 500;
    if (status >= 500) request.log.error({ err: error }, "unhandled error");

    const code: ErrorCode =
      status === 429 ? "rate_limited" : status >= 500 ? "internal" : "bad_request";
    return reply.code(status).send(
      new HttpError(
        code,
        // Never surface an internal message or stack trace to a user (section 25).
        status >= 500 ? "Something went wrong. Try again." : (fastifyError.message ?? "Bad request."),
      ).toBody(),
    );
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send(new HttpError("not_found", "Not found.").toBody()),
  );

  await app.register(authPlugin, { verifySession: options.verifySession });
  await app.register(rlsPlugin, { db: options.db });
  await app.register(ssePlugin);
  await app.register(rateLimitPlugin, { enabled: options.rateLimit ?? true });

  app.get("/health", { schema: { response: {} } }, async () => ({ ok: true }));

  await app.register(
    async (scoped) => {
      // Everything under the versioned prefix needs a signed-in user; routes
      // then narrow further by workspace role.
      scoped.addHook("onRequest", async (request) => {
        request.requireUser();
      });
      await scoped.register(workspaceRoutes);
    },
    { prefix: API_PREFIX },
  );

  return app;
}
