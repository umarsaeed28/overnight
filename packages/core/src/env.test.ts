import { describe, expect, it } from "vitest";
import { EnvError, parseEnv, REQUIRED_ENV_KEYS } from "./env.js";

const valid = {
  DATABASE_URL: "postgres://oqa:oqa@localhost:5432/oqa",
  REDIS_URL: "redis://localhost:6379",
  ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  S3_ENDPOINT: "http://localhost:9000",
  S3_ACCESS_KEY: "key",
  S3_SECRET_KEY: "secret",
  ANTHROPIC_API_KEY: "sk-ant-test",
  VOYAGE_API_KEY: "pa-test",
  AUTH_SECRET: "0123456789abcdef0123",
};

describe("parseEnv", () => {
  it("applies spec defaults for omitted optional values", () => {
    const env = parseEnv(valid);
    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.CLAUDE_MODEL_FAST).toBe("claude-haiku-4-5-20251001");
    expect(env.MAX_FILE_BYTES).toBe(512_000);
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("coerces numeric limits to numbers", () => {
    const env = parseEnv({ ...valid, MAX_FILES_PER_SOURCE: "500" });
    expect(env.MAX_FILES_PER_SOURCE).toBe(500);
  });

  it("treats empty strings as absent, the way a .env file writes them", () => {
    const env = parseEnv({ ...valid, ENTRA_TENANT_ID: "", LOG_LEVEL: "" });
    expect(env.ENTRA_TENANT_ID).toBeUndefined();
    expect(env.LOG_LEVEL).toBe("info");
  });

  it.each(REQUIRED_ENV_KEYS)("fails when %s is missing", (key) => {
    const source: Record<string, string | undefined> = { ...valid };
    delete source[key];
    expect(() => parseEnv(source)).toThrow(EnvError);
    try {
      parseEnv(source);
    } catch (error) {
      expect((error as EnvError).issues.join()).toContain(key);
    }
  });

  it("reports every problem in one throw", () => {
    try {
      parseEnv({});
      expect.unreachable();
    } catch (error) {
      expect((error as EnvError).issues).toHaveLength(REQUIRED_ENV_KEYS.length);
    }
  });

  it("rejects an ENCRYPTION_KEY that is not 32 bytes", () => {
    const short = Buffer.alloc(16, 1).toString("base64");
    expect(() => parseEnv({ ...valid, ENCRYPTION_KEY: short })).toThrow(/32 bytes/);
  });

  it("rejects a non-url APP_URL", () => {
    expect(() => parseEnv({ ...valid, APP_URL: "localhost:3000" })).toThrow(EnvError);
  });
});
