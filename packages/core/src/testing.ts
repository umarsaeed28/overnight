import { resetEnvCache } from "./env.js";

/**
 * Minimal valid environment for tests in any package. Keeps every suite from
 * inventing its own set of placeholder credentials.
 */
export const TEST_ENV: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://oqa:oqa@localhost:5432/oqa_test",
  REDIS_URL: "redis://localhost:6379",
  ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
  S3_ENDPOINT: "http://localhost:9000",
  S3_ACCESS_KEY: "test-access",
  S3_SECRET_KEY: "test-secret",
  ANTHROPIC_API_KEY: "sk-ant-test",
  VOYAGE_API_KEY: "pa-test",
  AUTH_SECRET: "test-auth-secret-0123456789",
};

export function applyTestEnv(overrides: Record<string, string> = {}): void {
  Object.assign(process.env, TEST_ENV, overrides);
  resetEnvCache();
}
