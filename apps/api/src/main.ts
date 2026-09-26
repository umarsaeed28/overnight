import { loadEnv } from "@oqa/core";
import { createAdminPool, createAppPool, createDb } from "@oqa/db";
import { authJsVerifier } from "./plugins/auth.js";
import { buildServer } from "./server.js";

const env = loadEnv();

const appPool = createAppPool({ connectionString: env.DATABASE_URL });
const adminPool = createAdminPool({ connectionString: env.DATABASE_URL });

const app = await buildServer({
  db: createDb(appPool),
  adminDb: createDb(adminPool),
  verifySession: authJsVerifier(env.AUTH_SECRET),
  appUrl: env.APP_URL,
  logger: { level: env.LOG_LEVEL },
});

const port = Number(new URL(env.API_URL).port || 4000);
await app.listen({ port, host: "0.0.0.0" });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    await Promise.all([appPool.end(), adminPool.end()]);
    process.exit(0);
  });
}
