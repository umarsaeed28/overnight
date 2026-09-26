import { loadEnv } from "./env.js";

/**
 * The only place in the codebase allowed to name a model. Every caller asks for
 * a *role*; the concrete model id comes from env (section 4.1).
 */
export const MODEL_ROLES = ["EXTRACT", "CHAT", "FAST", "JUDGE"] as const;
export type ModelRole = (typeof MODEL_ROLES)[number];

export const EMBEDDING_DIMENSIONS = 1024;

export function modelFor(role: ModelRole): string {
  const env = loadEnv();
  switch (role) {
    case "EXTRACT":
      return env.CLAUDE_MODEL_EXTRACT;
    case "CHAT":
      return env.CLAUDE_MODEL_CHAT;
    case "FAST":
      return env.CLAUDE_MODEL_FAST;
    case "JUDGE":
      return env.CLAUDE_MODEL_JUDGE;
  }
}

/** Voyage embedding model, chosen by the kind of chunk being embedded. */
export function embeddingModelFor(chunkKind: "code" | "test" | "config" | "doc" | "ticket" | "knowledge"): string {
  const env = loadEnv();
  const isCode = chunkKind === "code" || chunkKind === "test" || chunkKind === "config";
  return isCode ? env.VOYAGE_MODEL_CODE : env.VOYAGE_MODEL_TEXT;
}

export function rerankModel(): string {
  return loadEnv().VOYAGE_MODEL_RERANK;
}

/** Hard limits from section 4.2, applied by the LLM wrapper. */
export const LLM_CALL_TIMEOUT_MS = 120_000;
export const LLM_MAX_RETRIES = 3;
/** Above this input size, use the SDK token counting endpoint instead of the local estimate. */
export const TOKEN_COUNT_ENDPOINT_THRESHOLD = 50_000;
/** Queue depth at which first-ingest work moves to the Message Batches API. */
export const BATCH_API_THRESHOLD = 200;
