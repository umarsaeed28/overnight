import { describe, expect, it } from "vitest";
import { estimateTokens, estimateTokensForAll } from "./tokens.js";

describe("estimateTokens", () => {
  it("uses the chars/3.5 rule, rounded up", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("x".repeat(35))).toBe(10);
    expect(estimateTokens("x".repeat(36))).toBe(11);
  });

  it("sums over a batch", () => {
    expect(estimateTokensForAll(["x".repeat(35), "y".repeat(70)])).toBe(30);
  });
});
