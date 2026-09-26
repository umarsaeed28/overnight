import { describe, expect, it } from "vitest";
import {
  chunkId,
  chunkIdentity,
  claimStableKey,
  featureInputHash,
  isChunkId,
  isSlug,
  knowledgeFileId,
  normalizeClaimText,
  parseKnowledgeFileId,
  slugify,
} from "./ids.js";

describe("chunkId", () => {
  it("encodes the counter in base36", () => {
    expect(chunkId(0)).toBe("c_0");
    expect(chunkId(35)).toBe("c_z");
    expect(chunkId(4415)).toBe("c_3en");
  });

  it("round-trips through the recogniser", () => {
    expect(isChunkId(chunkId(123456))).toBe(true);
    expect(isChunkId("c_")).toBe(false);
    expect(isChunkId("c_ABC")).toBe(false);
    expect(isChunkId("4415")).toBe(false);
  });

  it("rejects non-integer counters", () => {
    expect(() => chunkId(-1)).toThrow(RangeError);
    expect(() => chunkId(1.5)).toThrow(RangeError);
  });
});

describe("chunkIdentity", () => {
  const base = { externalId: "app/checkout/page.tsx", breadcrumb: "repo > Checkout", contentHash: "abc" };

  it("is stable for unchanged content", () => {
    expect(chunkIdentity(base)).toBe(chunkIdentity({ ...base }));
  });

  it("changes when content, location, or breadcrumb changes", () => {
    expect(chunkIdentity({ ...base, contentHash: "def" })).not.toBe(chunkIdentity(base));
    expect(chunkIdentity({ ...base, externalId: "other.tsx" })).not.toBe(chunkIdentity(base));
    expect(chunkIdentity({ ...base, breadcrumb: "repo > Cart" })).not.toBe(chunkIdentity(base));
  });

  it("distinguishes a null breadcrumb from an empty one only by content", () => {
    expect(chunkIdentity({ ...base, breadcrumb: null })).toBe(
      chunkIdentity({ ...base, breadcrumb: "" }),
    );
  });
});

describe("claimStableKey", () => {
  const file = "flow.checkout-guest";

  it("survives reformatting that does not change the fact", () => {
    const a = claimStableKey({ knowledgeFileId: file, text: "Cart has at least one item." });
    const b = claimStableKey({ knowledgeFileId: file, text: "cart  has at least one item" });
    expect(a).toBe(b);
  });

  it("differs across files", () => {
    const text = "Cart has at least one item.";
    expect(claimStableKey({ knowledgeFileId: file, text })).not.toBe(
      claimStableKey({ knowledgeFileId: "flow.checkout-saved-card", text }),
    );
  });

  it("differs when the fact changes", () => {
    expect(claimStableKey({ knowledgeFileId: file, text: "Min length is 8." })).not.toBe(
      claimStableKey({ knowledgeFileId: file, text: "Min length is 12." }),
    );
  });
});

describe("normalizeClaimText", () => {
  it("collapses whitespace and strips trailing punctuation", () => {
    expect(normalizeClaimText("  Order   is\ncreated.  ")).toBe("order is created");
  });
});

describe("featureInputHash", () => {
  const chunks = [
    { id: "c_2", contentHash: "h2" },
    { id: "c_1", contentHash: "h1" },
  ];
  const args = { chunks, promptVersion: "extract@1", model: "claude-sonnet-5" };

  it("ignores chunk ordering", () => {
    expect(featureInputHash(args)).toBe(
      featureInputHash({ ...args, chunks: [...chunks].reverse() }),
    );
  });

  it("changes when a chunk's content changes", () => {
    expect(
      featureInputHash({ ...args, chunks: [{ id: "c_1", contentHash: "h1" }, { id: "c_2", contentHash: "CHANGED" }] }),
    ).not.toBe(featureInputHash(args));
  });

  it("changes when the prompt version or model changes", () => {
    expect(featureInputHash({ ...args, promptVersion: "extract@2" })).not.toBe(featureInputHash(args));
    expect(featureInputHash({ ...args, model: "claude-opus-5-5" })).not.toBe(featureInputHash(args));
  });

  it("changes when a chunk joins or leaves the feature", () => {
    expect(featureInputHash({ ...args, chunks: [chunks[0]!] })).not.toBe(featureInputHash(args));
  });
});

describe("slugify", () => {
  it("produces feature slugs the emit_features pattern accepts", () => {
    expect(slugify("Guest checkout")).toBe("guest-checkout");
    expect(slugify("Account / Settings!")).toBe("account-settings");
    expect(slugify("  Café  Orders  ")).toBe("cafe-orders");
    expect(isSlug(slugify("Password reset (v2)"))).toBe(true);
  });
});

describe("knowledge file ids", () => {
  it("builds and parses typed ids", () => {
    const id = knowledgeFileId("flow", "checkout-guest");
    expect(id).toBe("flow.checkout-guest");
    expect(parseKnowledgeFileId(id)).toEqual({ type: "flow", slug: "checkout-guest" });
  });

  it("parses global singletons", () => {
    expect(parseKnowledgeFileId("overview")).toEqual({ type: "overview", slug: null });
    expect(parseKnowledgeFileId("data-model")).toEqual({ type: "data-model", slug: null });
  });

  it("rejects unknown types and bad slugs", () => {
    expect(() => knowledgeFileId("flow", "Checkout Guest")).toThrow();
    expect(() => parseKnowledgeFileId("thing.whatever")).toThrow();
    expect(() => parseKnowledgeFileId("flow.Checkout")).toThrow();
  });
});
