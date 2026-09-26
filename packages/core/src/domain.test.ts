import { describe, expect, it } from "vitest";
import { claimSchema, CRITICALITY_WEIGHT, roleSatisfies } from "./domain.js";

describe("roleSatisfies", () => {
  it("treats owner as a superset of editor and viewer", () => {
    expect(roleSatisfies("owner", "editor")).toBe(true);
    expect(roleSatisfies("owner", "viewer")).toBe(true);
    expect(roleSatisfies("editor", "viewer")).toBe(true);
  });

  it("does not promote", () => {
    expect(roleSatisfies("viewer", "editor")).toBe(false);
    expect(roleSatisfies("editor", "owner")).toBe(false);
  });
});

describe("claimSchema", () => {
  it("requires at least one citation", () => {
    const uncited = { text: "Orders are capped at $500.", kind: "stated", chunk_ids: [] };
    expect(claimSchema.safeParse(uncited).success).toBe(false);
  });

  it("accepts a cited claim", () => {
    const cited = { text: "Cart has at least one item.", kind: "derived", chunk_ids: ["c_4410"] };
    expect(claimSchema.parse(cited).chunk_ids).toEqual(["c_4410"]);
  });

  it("rejects claim kinds outside the three labels", () => {
    expect(
      claimSchema.safeParse({ text: "x", kind: "guessed", chunk_ids: ["c_1"] }).success,
    ).toBe(false);
  });

  it("caps claim text so one claim stays one fact", () => {
    expect(
      claimSchema.safeParse({ text: "x".repeat(401), kind: "derived", chunk_ids: ["c_1"] }).success,
    ).toBe(false);
  });
});

describe("CRITICALITY_WEIGHT", () => {
  it("matches the gap score weights in section 16", () => {
    expect(CRITICALITY_WEIGHT).toEqual({ high: 3, medium: 2, low: 1 });
  });
});
