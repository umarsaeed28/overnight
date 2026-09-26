import type {
  MessageParam,
  TextBlockParam,
  Tool,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { estimateTokens } from "@oqa/core";
import { LLM_CALL_TIMEOUT_MS, modelFor, TOKEN_COUNT_ENDPOINT_THRESHOLD } from "@oqa/core/models";
import type { z } from "zod";
import { nullSink, type LlmCallSink } from "./accounting.js";
import { costUsd } from "./prices.js";
import { renderPrompt, type Prompt } from "./prompts.js";
import { withRetries, type RetryOptions } from "./retry.js";
import type { Message, MessageCreateParamsNonStreaming, Transport } from "./transport.js";

export class TokenBudgetError extends Error {
  constructor(
    readonly promptId: string,
    readonly estimated: number,
    readonly limit: number,
  ) {
    super(
      `Input for ${promptId} is about ${estimated} tokens, over its ${limit} token budget. Split the input and try again.`,
    );
    this.name = "TokenBudgetError";
  }
}

export class ToolUseError extends Error {
  constructor(
    readonly toolName: string,
    readonly detail: string,
  ) {
    super(`Claude did not return valid ${toolName} input: ${detail}`);
    this.name = "ToolUseError";
  }
}

export interface ToolCallRequest<T> {
  prompt: Prompt;
  /** Pipeline stage this call belongs to; written to `llm_calls.purpose`. */
  purpose: string;
  tool: Tool;
  /** Validates the tool input. Structured output never comes from free text. */
  schema: z.ZodType<T>;
  messages: MessageParam[];
  /**
   * Extra system blocks appended after the prompt body and cached: workspace
   * `overview.md`, then the glossary (section 4.2). Order matters, because a
   * cache breakpoint only helps when everything before it is unchanged.
   */
  cachedContext?: string[];
  values?: Record<string, string | number>;
  workspaceId?: string | null;
  buildId?: string | null;
  maxTokens?: number;
}

export interface ToolCallResult<T> {
  value: T;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  };
  costUsd: number | undefined;
  latencyMs: number;
  /** 1 on the happy path, 2 when the first response failed schema validation. */
  attempts: number;
}

export interface LlmClientOptions {
  transport: Transport;
  sink?: LlmCallSink;
  retry?: RetryOptions;
  logger?: { warn(o: object, msg: string): void; error(o: object, msg: string): void };
  /** Test seam for the local-vs-endpoint token counting decision. */
  countTokensThreshold?: number;
}

const CACHE: TextBlockParam["cache_control"] = { type: "ephemeral" };

export class LlmClient {
  private readonly transport: Transport;
  private readonly sink: LlmCallSink;
  private readonly retry: RetryOptions;
  private readonly logger: LlmClientOptions["logger"];
  private readonly countTokensThreshold: number;

  constructor(options: LlmClientOptions) {
    this.transport = options.transport;
    this.sink = options.sink ?? nullSink;
    this.retry = options.retry ?? {};
    this.logger = options.logger;
    this.countTokensThreshold = options.countTokensThreshold ?? TOKEN_COUNT_ENDPOINT_THRESHOLD;
  }

  /**
   * The only way to get structured output from Claude in this codebase: a forced
   * tool call whose input is validated by a zod schema (section 4.2).
   */
  async callTool<T>(request: ToolCallRequest<T>): Promise<ToolCallResult<T>> {
    const model = modelFor(request.prompt.modelRole);
    const params = this.buildParams(request, model);
    await this.enforceBudget(request, params);

    const messages = [...params.messages];
    let attempts = 0;
    let lastDetail = "";

    // Two passes at most: one repair attempt with the validation error appended
    // (section 25), then the item fails.
    while (attempts < 2) {
      attempts += 1;
      const response = await this.send({ ...params, messages }, request, model);
      const block = findToolUse(response, request.tool.name);

      if (block) {
        const parsed = request.schema.safeParse(block.input);
        if (parsed.success) {
          return {
            value: parsed.data,
            model,
            usage: response.usage,
            costUsd: response.costUsd,
            latencyMs: response.latencyMs,
            attempts,
          };
        }
        lastDetail = parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ");
      } else {
        lastDetail = `no ${request.tool.name} tool_use block in the response`;
      }

      await this.sink.write({
        workspaceId: request.workspaceId ?? null,
        buildId: request.buildId ?? null,
        purpose: request.purpose,
        promptId: request.prompt.id,
        promptVersion: request.prompt.versionTag,
        model,
        status: "invalid_output",
        error: lastDetail,
      });
      this.logger?.warn(
        { promptId: request.prompt.id, tool: request.tool.name, attempt: attempts },
        "invalid tool output, retrying once",
      );

      messages.push(
        { role: "assistant", content: response.raw.content },
        {
          role: "user",
          content: `Your ${request.tool.name} call was rejected: ${lastDetail}. Call ${request.tool.name} again with valid input. Change nothing else.`,
        },
      );
    }

    throw new ToolUseError(request.tool.name, lastDetail);
  }

  private buildParams<T>(
    request: ToolCallRequest<T>,
    model: string,
  ): MessageCreateParamsNonStreaming {
    const system: TextBlockParam[] = [
      { type: "text", text: renderPrompt(request.prompt.body, request.values), cache_control: CACHE },
      ...(request.cachedContext ?? [])
        .filter((text) => text.trim().length > 0)
        .map((text): TextBlockParam => ({ type: "text", text, cache_control: CACHE })),
    ];

    return {
      model,
      max_tokens: request.maxTokens ?? request.prompt.maxTokens,
      system,
      messages: request.messages,
      // Tool definitions are the last cached prefix block, so the cache survives
      // a change in the user message but not a change in the tool schema.
      tools: [{ ...request.tool, cache_control: CACHE }],
      tool_choice: { type: "tool", name: request.tool.name },
    };
  }

  /**
   * Enforce `max_input_tokens` before sending. The local estimate is enough for
   * small inputs; above the threshold the SDK counting endpoint decides, because
   * that is where a wrong guess costs real money (section 4.2).
   */
  private async enforceBudget<T>(
    request: ToolCallRequest<T>,
    params: MessageCreateParamsNonStreaming,
  ): Promise<void> {
    const limit = request.prompt.maxInputTokens;
    if (limit === undefined) return;

    let estimate = estimateInputTokens(params);
    if (estimate > this.countTokensThreshold) {
      try {
        estimate = await this.transport.countTokens(params);
      } catch (error) {
        this.logger?.warn(
          { promptId: request.prompt.id, error: String(error) },
          "token counting failed, falling back to local estimate",
        );
      }
    }

    if (estimate > limit) {
      await this.sink.write({
        workspaceId: request.workspaceId ?? null,
        buildId: request.buildId ?? null,
        purpose: request.purpose,
        promptId: request.prompt.id,
        promptVersion: request.prompt.versionTag,
        model: params.model,
        inputTokens: estimate,
        status: "budget_exceeded",
      });
      throw new TokenBudgetError(request.prompt.id, estimate, limit);
    }
  }

  private async send<T>(
    params: MessageCreateParamsNonStreaming,
    request: ToolCallRequest<T>,
    model: string,
  ) {
    const startedAt = Date.now();
    try {
      const raw = await withRetries(
        () => this.transport.create(params, { timeout: LLM_CALL_TIMEOUT_MS }),
        {
          ...this.retry,
          onRetry: (info) => {
            this.logger?.warn(
              { promptId: request.prompt.id, attempt: info.attempt, delayMs: info.delayMs },
              "retrying Claude call",
            );
            this.retry.onRetry?.(info);
          },
        },
      );

      const usage = {
        inputTokens: raw.usage.input_tokens ?? 0,
        outputTokens: raw.usage.output_tokens ?? 0,
        cacheReadTokens: raw.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: raw.usage.cache_creation_input_tokens ?? 0,
      };
      const cost = costUsd(model, usage);
      const latencyMs = Date.now() - startedAt;

      await this.sink.write({
        workspaceId: request.workspaceId ?? null,
        buildId: request.buildId ?? null,
        purpose: request.purpose,
        promptId: request.prompt.id,
        promptVersion: request.prompt.versionTag,
        model,
        ...usage,
        ...(cost === undefined ? {} : { costUsd: cost }),
        latencyMs,
        status: "ok",
      });

      return { raw, usage, costUsd: cost, latencyMs };
    } catch (error) {
      await this.sink.write({
        workspaceId: request.workspaceId ?? null,
        buildId: request.buildId ?? null,
        purpose: request.purpose,
        promptId: request.prompt.id,
        promptVersion: request.prompt.versionTag,
        model,
        latencyMs: Date.now() - startedAt,
        status: "error",
        error: errorMessage(error),
      });
      throw error;
    }
  }
}

function findToolUse(
  response: { raw: Message },
  name: string,
): ToolUseBlock | undefined {
  return response.raw.content.find(
    (block): block is ToolUseBlock => block.type === "tool_use" && block.name === name,
  );
}

export function estimateInputTokens(params: MessageCreateParamsNonStreaming): number {
  const parts: string[] = [];

  if (typeof params.system === "string") parts.push(params.system);
  else if (Array.isArray(params.system)) {
    for (const block of params.system) if (block.type === "text") parts.push(block.text);
  }

  for (const message of params.messages) {
    if (typeof message.content === "string") parts.push(message.content);
    else {
      for (const block of message.content) {
        if (block.type === "text") parts.push(block.text);
        else if (block.type === "tool_result" && typeof block.content === "string") {
          parts.push(block.content);
        } else parts.push(JSON.stringify(block));
      }
    }
  }

  for (const tool of params.tools ?? []) parts.push(JSON.stringify(tool));

  return parts.reduce((sum, text) => sum + estimateTokens(text), 0);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
