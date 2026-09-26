import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { recordingTransport, requestHash } from "./recordings.js";
import type { Message, MessageCreateParamsNonStreaming, Transport } from "./transport.js";

const params: MessageCreateParamsNonStreaming = {
  model: "claude-sonnet-5",
  max_tokens: 100,
  messages: [{ role: "user", content: "hello" }],
};

const response = {
  id: "msg_1",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-5",
  content: [{ type: "text", text: "hi" }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 5, output_tokens: 2 },
} as Message;

const live = (): Transport => ({
  create: vi.fn(async () => response),
  countTokens: vi.fn(async () => 5),
});

describe("requestHash", () => {
  it("is stable for an identical request", () => {
    expect(requestHash(params)).toBe(requestHash({ ...params }));
  });

  it("changes with anything that changes the response", () => {
    expect(requestHash({ ...params, model: "claude-opus-5-5" })).not.toBe(requestHash(params));
    expect(requestHash({ ...params, max_tokens: 200 })).not.toBe(requestHash(params));
    expect(
      requestHash({ ...params, messages: [{ role: "user", content: "different" }] }),
    ).not.toBe(requestHash(params));
  });
});

describe("recordingTransport", () => {
  it("records in record mode and replays without touching the inner transport", async () => {
    const dir = await mkdtemp(join(tmpdir(), "oqa-rec-"));
    const inner = live();

    const recorder = recordingTransport(inner, { dir, record: true });
    await recorder.create(params);
    expect(inner.create).toHaveBeenCalledTimes(1);
    expect(await readdir(dir)).toEqual([`${requestHash(params)}.json`]);

    const replayer = recordingTransport(inner, { dir, record: false });
    const replayed = await replayer.create(params);
    expect(replayed).toEqual(response);
    expect(inner.create).toHaveBeenCalledTimes(1);
  });

  it("explains how to re-record when a cassette is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "oqa-rec-"));
    const replayer = recordingTransport(live(), { dir, record: false });

    await expect(replayer.create(params)).rejects.toThrow(/RECORD=1/);
  });
});
