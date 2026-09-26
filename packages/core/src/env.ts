import { z } from "zod";

/**
 * A base64 string that decodes to exactly `bytes` bytes.
 */
const base64Key = (bytes: number) =>
  z
    .string()
    .min(1)
    .refine(
      (v) => {
        try {
          return Buffer.from(v, "base64").length === bytes;
        } catch {
          return false;
        }
      },
      { message: `must be ${bytes} bytes encoded as base64` },
    );

/**
 * `z.string().url()` accepts anything the URL constructor parses, including
 * `localhost:3000` (protocol `localhost:`). These values get concatenated into
 * links and redirect targets, so require an explicit http(s) origin.
 */
const url = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//.test(v), { message: "must start with http:// or https://" });
const intFromEnv = (fallback: number) => z.coerce.number().int().positive().default(fallback);

export const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: url.default("http://localhost:3000"),
  API_URL: url.default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ENCRYPTION_KEY: base64Key(32),

  // Object storage
  S3_ENDPOINT: url,
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(1).default("oqa-raw"),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),

  // Models
  ANTHROPIC_API_KEY: z.string().min(1),
  CLAUDE_MODEL_EXTRACT: z.string().min(1).default("claude-sonnet-5"),
  CLAUDE_MODEL_CHAT: z.string().min(1).default("claude-sonnet-5"),
  CLAUDE_MODEL_FAST: z.string().min(1).default("claude-haiku-4-5-20251001"),
  CLAUDE_MODEL_JUDGE: z.string().min(1).default("claude-opus-5-5"),
  VOYAGE_API_KEY: z.string().min(1),
  VOYAGE_MODEL_CODE: z.string().min(1).default("voyage-code-3"),
  VOYAGE_MODEL_TEXT: z.string().min(1).default("voyage-3.5"),
  VOYAGE_MODEL_RERANK: z.string().min(1).default("rerank-2.5"),

  // Auth
  AUTH_SECRET: z.string().min(16),
  AUTH_EMAIL_FROM: z.string().email().optional(),
  SMTP_URL: z.string().optional(),
  ENTRA_TENANT_ID: z.string().optional(),
  ENTRA_CLIENT_ID: z.string().optional(),
  ENTRA_CLIENT_SECRET: z.string().optional(),

  // Connectors
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_SLUG: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  ADO_TENANT_ID: z.string().optional(),
  ADO_CLIENT_ID: z.string().optional(),
  ADO_CLIENT_SECRET: z.string().optional(),
  ATLASSIAN_CLIENT_ID: z.string().optional(),
  ATLASSIAN_CLIENT_SECRET: z.string().optional(),
  ATLASSIAN_WEBHOOK_SECRET: z.string().optional(),

  // Limits
  MAX_FILES_PER_SOURCE: intFromEnv(20_000),
  MAX_FILE_BYTES: intFromEnv(512_000),
  MAX_TICKET_AGE_DAYS: intFromEnv(365),
  MONTHLY_LLM_BUDGET_USD_DEFAULT: intFromEnv(300),

  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Keys that must be present in `process.env`. Everything else either has a
 * default or is genuinely optional (per-provider connector credentials).
 */
export const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "ENCRYPTION_KEY",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "VOYAGE_API_KEY",
  "AUTH_SECRET",
] as const satisfies readonly (keyof Env)[];

export class EnvError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
    this.name = "EnvError";
  }
}

/**
 * Validate a raw environment. Pure: takes the source, returns the parsed env,
 * throws `EnvError` listing every problem at once.
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // Treat empty strings as absent; `.env` files are full of `KEY=`.
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== "") cleaned[key] = value;
  }

  const result = envSchema.safeParse(cleaned);
  if (result.success) return result.data;

  throw new EnvError(
    result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  );
}

let cached: Env | undefined;

/**
 * Load and validate `process.env` once per process. Startup fails loudly on
 * missing required values (principle: fail at boot, not at first use).
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  cached ??= parseEnv(source);
  return cached;
}

/** Test helper: drop the memoised env so the next `loadEnv` re-parses. */
export function resetEnvCache(): void {
  cached = undefined;
}
