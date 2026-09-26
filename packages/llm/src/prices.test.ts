import { describe, expect, it } from "vitest";
import { cacheHitRatio, costUsd, pricesFor } from "./prices.js";

describe("pricesFor", () => {
  it("matches a dated model id to its family", () => {
    expect(pricesFor("claude-haiku-4-5-20251001")).toEqual(pricesFor("claude-haiku"));
  });

  it("returns undefined for an unknown model rather than guessing", () => {
    expect(pricesFor("some-other-model")).toBeUndefined();
  });
});

describe("costUsd", () => {
  it("prices input and output tokens per million", () => {
    // sonnet: $3/MTok in, $15/MTok out
    expect(costUsd("claude-sonnet-5", { inputTokens: 1_000_000, outputTokens: 0 })).toBe(3);
    expect(costUsd("claude-sonnet-5", { inputTokens: 0, outputTokens: 100_000 })).toBe(1.5);
  });

  it("charges cache writes above input and cache reads far below", () => {
    const write = costUsd("claude-sonnet-5", {
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 1_000_000,
    })!;
    const read = costUsd("claude-sonnet-5", {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000,
    })!;
    expect(write).toBeGreaterThan(3);
    expect(read).toBeLessThan(3);
  });

  it("halves batch work", () => {
    const usage = { inputTokens: 1_000_000, outputTokens: 0 };
    expect(costUsd("claude-sonnet-5", usage, { batch: true })).toBe(1.5);
  });

  it("rounds to the 5 decimal places the column stores", () => {
    const cost = costUsd("claude-haiku-4-5-20251001", { inputTokens: 1, outputTokens: 1 })!;
    expect(cost).toBe(0.00001);
  });

  it("returns undefined for an unpriced model", () => {
    expect(costUsd("mystery-model", { inputTokens: 100, outputTokens: 100 })).toBeUndefined();
  });
});

describe("cacheHitRatio", () => {
  it("is the cached share of all input tokens", () => {
    expect(cacheHitRatio({ inputTokens: 200, outputTokens: 0, cacheReadTokens: 800 })).toBe(0.8);
    expect(cacheHitRatio({ inputTokens: 0, outputTokens: 0 })).toBe(0);
  });
});
