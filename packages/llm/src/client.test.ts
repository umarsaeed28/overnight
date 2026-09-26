import { applyTestEnv } from "@oqa/core/testing";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { LlmCallRecord, LlmCallSink } from "./accounting.js";
import { estimateInputTokens, LlmClient, TokenBudgetError, ToolUseError } from "./client.js";
import { parsePrompt } from "./prompts.js";
import type { Message, MessageCreateParamsNonStreaming, Transport } from "./transport.js";

applyTestEnv();

const prompt = parsePrompt(`---
id: extract
version: 1
model_role: EXTRACT
max_input_tokens: 1000
max_tokens: 8000
---
Extract knowledge from the chunks.
`);

const tool: Tool = {
  name: "emit_knowledge",
  description: "Emit knowledge for one feature.",
  input_schema: {
    type: "object",
    required: ["unknowns"],
    properties: { unknowns: { type: "array", items: { type: "string" } } },
  },
};

const schema = z.object({ unknowns: z.array(z.string()) });

function toolUseMessage(input: unknown, name = "emit_knowledge"): Message {
  return {
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-5",
    content: [{ type: "tool_use", id: "tu_1", name, input }],
    stop_reason: "tool_use",
    stop_sequence: null,
    usage: {
      input_tokens: 1200,
      output_tokens: 300,
      cache_read_input_tokens: 800,
      cache_creation_input_tokens: 100,
    },
  } as Message;
}

interface Fake extends Transport {
  calls: MessageCreateParamsNonStreaming[];
}

function fakeTransport(responses: (Message | Error)[], tokenCount = 10): Fake {
  const calls: MessageCreateParamsNonStreaming[] = [];
  const queue = [...responses];
  return {
    calls,
    async create(params) {
      calls.push(structuredClone(params));
      const next = queue.shift();
      if (!next) throw new Error("fake transport ran out of responses");
      if (next instanceof Error) throw next;
      return next;
    },
    async countTokens() {
      return tokenCount;
    },
  };
}

function recordingSink(): LlmCallSink & { records: LlmCallRecord[] } {
  const records: LlmCallRecord[] = [];
  return {
    records,
    async write(record) {
      records.push(record);
    },
  };
}

const request = {
  prompt,
  purpose: "extract",
  tool,
  schema,
  messages: [{ role: "user" as const, content: "chunk c_1: checkout page" }],
  workspaceId: "11111111-1111-1111-1111-111111111111",
  buildId: "22222222-2222-2222-2222-222222222222",
};

let sink: ReturnType<typeof recordingSink>;

beforeEach(() => {
  sink = recordingSink();
});

describe("LlmClient.callTool", () => {
  it("forces the tool and returns its validated input", async () => {
    const transport = fakeTransport([toolUseMessage({ unknowns: ["payment timeout"] })]);
    const client = new LlmClient({ transport, sink });

    const result = await client.callTool({ ...request });

    expect(result.value).toEqual({ unknowns: ["payment timeout"] });
    expect(result.attempts).toBe(1);
    expect(transport.calls[0]!.tool_choice).toEqual({ type: "tool", name: "emit_knowledge" });
    expect(transport.calls[0]!.model).toBe("claude-sonnet-5");
    expect(transport.calls[0]!.max_tokens).toBe(8000);
  });

  it("caches the prompt, the workspace context blocks and the tool definitions", async () => {
    const transport = fakeTransport([toolUseMessage({ unknowns: [] })]);
    const client = new LlmClient({ transport, sink });

    await client.callTool({
      ...request,
      cachedContext: ["# Overview\nShopDemo sells things.", "# Glossary\nCart: ...", "   "],
    });

    const system = transport.calls[0]!.system as { text: string; cache_control?: unknown }[];
    expect(system).toHaveLength(3); // prompt + overview + glossary; the blank block is dropped
    expect(system.every((block) => block.cache_control)).toBe(true);
    expect(system[0]!.text).toContain("Extract knowledge");
    expect(transport.calls[0]!.tools![0]).toMatchObject({ cache_control: { type: "ephemeral" } });
  });

  it("writes one llm_calls row with tokens, cost and latency", async () => {
    const transport = fakeTransport([toolUseMessage({ unknowns: [] })]);
    const client = new LlmClient({ transport, sink });

    await client.callTool({ ...request });

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]).toMatchObject({
      workspaceId: request.workspaceId,
      buildId: request.buildId,
      purpose: "extract",
      promptId: "extract",
      promptVersion: "extract@1",
      model: "claude-sonnet-5",
      inputTokens: 1200,
      outputTokens: 300,
      cacheReadTokens: 800,
      cacheWriteTokens: 100,
      status: "ok",
    });
    expect(sink.records[0]!.costUsd).toBeGreaterThan(0);
    expect(sink.records[0]!.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("repairs one invalid response by sending the validation error back", async () => {
    const transport = fakeTransport([
      toolUseMessage({ unknowns: "not an array" }),
      toolUseMessage({ unknowns: ["ok now"] }),
    ]);
    const client = new LlmClient({ transport, sink });

    const result = await client.callTool({ ...request });

    expect(result.value).toEqual({ unknowns: ["ok now"] });
    expect(result.attempts).toBe(2);

    const repair = transport.calls[1]!.messages;
    expect(repair).toHaveLength(3);
    expect(repair[2]).toMatchObject({ role: "user" });
    expect(String(repair[2]!.content)).toContain("was rejected");

    expect(sink.records.map((r) => r.status)).toEqual(["ok", "invalid_output", "ok"]);
  });

  it("fails the item after a second invalid response", async () => {
    const transport = fakeTransport([
      toolUseMessage({ unknowns: 1 }),
      toolUseMessage({ unknowns: 2 }),
    ]);
    const client = new LlmClient({ transport, sink });

    await expect(client.callTool({ ...request })).rejects.toThrow(ToolUseError);
    expect(sink.records.filter((r) => r.status === "invalid_output")).toHaveLength(2);
  });

  it("treats a missing tool_use block as an invalid response", async () => {
    const textOnly = {
      ...toolUseMessage({ unknowns: [] }),
      content: [{ type: "text", text: "Here is some prose instead." }],
    } as Message;
    const transport = fakeTransport([textOnly, toolUseMessage({ unknowns: ["recovered"] })]);
    const client = new LlmClient({ transport, sink });

    const result = await client.callTool({ ...request });
    expect(result.value.unknowns).toEqual(["recovered"]);
  });

  it("refuses to send input over the prompt's max_input_tokens", async () => {
    const transport = fakeTransport([toolUseMessage({ unknowns: [] })]);
    const client = new LlmClient({ transport, sink });

    await expect(
      client.callTool({ ...request, messages: [{ role: "user", content: "x".repeat(20_000) }] }),
    ).rejects.toThrow(TokenBudgetError);

    expect(transport.calls).toHaveLength(0);
    expect(sink.records[0]).toMatchObject({ status: "budget_exceeded" });
  });

  it("consults the counting endpoint only above the threshold", async () => {
    const big = "x".repeat(20_000);
    const transport = fakeTransport([toolUseMessage({ unknowns: [] })], 12);
    const countTokens = vi.spyOn(transport, "countTokens");
    const client = new LlmClient({ transport, sink, countTokensThreshold: 100 });

    // The endpoint reports 12 tokens, under the 1000 budget the local estimate
    // would have blown, so the call goes through.
    await client.callTool({ ...request, messages: [{ role: "user", content: big }] });
    expect(countTokens).toHaveBeenCalledTimes(1);

    const small = fakeTransport([toolUseMessage({ unknowns: [] })]);
    const smallCount = vi.spyOn(small, "countTokens");
    await new LlmClient({ transport: small, sink }).callTool({ ...request });
    expect(smallCount).not.toHaveBeenCalled();
  });

  it("retries a 529 and records both the failure and the success", async () => {
    const overloaded = Object.assign(new Error("overloaded"), { status: 529 });
    const transport = fakeTransport([overloaded, toolUseMessage({ unknowns: ["after retry"] })]);
    const client = new LlmClient({
      transport,
      sink,
      retry: { sleep: async () => {}, random: () => 0 },
    });

    const result = await client.callTool({ ...request });
    expect(result.value.unknowns).toEqual(["after retry"]);
    expect(sink.records.map((r) => r.status)).toEqual(["ok"]);
    expect(transport.calls).toHaveLength(2);
  });

  it("records an error row when the call fails for good", async () => {
    const fatal = Object.assign(new Error("bad request"), { status: 400 });
    const transport = fakeTransport([fatal]);
    const client = new LlmClient({ transport, sink });

    await expect(client.callTool({ ...request })).rejects.toThrow("bad request");
    expect(sink.records[0]).toMatchObject({ status: "error", error: "bad request" });
  });
});

describe("estimateInputTokens", () => {
  it("counts system blocks, messages and tool definitions", () => {
    const withoutTools = estimateInputTokens({
      model: "claude-sonnet-5",
      max_tokens: 100,
      system: [{ type: "text", text: "x".repeat(350) }],
      messages: [{ role: "user", content: "y".repeat(350) }],
    });
    expect(withoutTools).toBe(200);

    const withTools = estimateInputTokens({
      model: "claude-sonnet-5",
      max_tokens: 100,
      messages: [{ role: "user", content: "y".repeat(350) }],
      tools: [tool],
    });
    expect(withTools).toBeGreaterThan(100);
  });
});
