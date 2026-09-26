import { type Database, schema, withWorkspace } from "@oqa/db";

/**
 * One row per Claude API attempt (section 4.2). Metadata only: no prompt text,
 * no completion text, no token contents (section 23).
 */
export interface LlmCallRecord {
  workspaceId?: string | null;
  buildId?: string | null;
  purpose: string;
  promptId: string;
  promptVersion: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costUsd?: number;
  latencyMs?: number;
  status: "ok" | "error" | "invalid_output" | "budget_exceeded";
  error?: string;
}

export interface LlmCallSink {
  write(record: LlmCallRecord): Promise<void>;
}

/** Discards records. For unit tests and one-off scripts. */
export const nullSink: LlmCallSink = { async write() {} };

export function createLlmCallSink(db: Database): LlmCallSink {
  return {
    async write(record) {
      const values = {
        workspaceId: record.workspaceId ?? null,
        buildId: record.buildId ?? null,
        purpose: record.purpose,
        promptId: record.promptId,
        promptVersion: record.promptVersion,
        model: record.model,
        inputTokens: record.inputTokens ?? null,
        outputTokens: record.outputTokens ?? null,
        cacheReadTokens: record.cacheReadTokens ?? null,
        cacheWriteTokens: record.cacheWriteTokens ?? null,
        costUsd: record.costUsd === undefined ? null : String(record.costUsd),
        latencyMs: record.latencyMs ?? null,
        status: record.status,
        error: record.error ?? null,
      };

      if (record.workspaceId) {
        await withWorkspace(db, { workspaceId: record.workspaceId }, (tx) =>
          tx.insert(schema.llmCalls).values(values),
        );
      } else {
        await db.insert(schema.llmCalls).values(values);
      }
    },
  };
}

/**
 * Accounting must never break the pipeline: a failed insert is logged and
 * swallowed, because losing a cost row is cheaper than losing extraction work.
 */
export function tolerantSink(inner: LlmCallSink, onError: (error: unknown) => void): LlmCallSink {
  return {
    async write(record) {
      try {
        await inner.write(record);
      } catch (error) {
        onError(error);
      }
    },
  };
}
