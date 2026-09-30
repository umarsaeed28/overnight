import { describe, expect, it } from "vitest";
import { documentKey, sourcePrefix, workspacePrefix } from "./keys.js";

const workspaceId = "11111111-1111-1111-1111-111111111111";
const sourceId = "22222222-2222-2222-2222-222222222222";

describe("documentKey", () => {
  it("is content addressed, so identical content reuses one object", () => {
    const a = documentKey({ workspaceId, sourceId, contentHash: "abc" });
    const b = documentKey({ workspaceId, sourceId, contentHash: "abc" });

    expect(a).toBe(b);
  });

  it("changes when the content changes", () => {
    expect(documentKey({ workspaceId, sourceId, contentHash: "abc" })).not.toBe(
      documentKey({ workspaceId, sourceId, contentHash: "def" }),
    );
  });

  it("sits under both the workspace and the source prefix", () => {
    const key = documentKey({ workspaceId, sourceId, contentHash: "abc" });

    expect(key.startsWith(workspacePrefix(workspaceId))).toBe(true);
    expect(key.startsWith(sourcePrefix(workspaceId, sourceId))).toBe(true);
  });

  it("keeps one workspace's objects out of another's prefix", () => {
    const other = "33333333-3333-3333-3333-333333333333";
    const key = documentKey({ workspaceId, sourceId, contentHash: "abc" });

    expect(key.startsWith(workspacePrefix(other))).toBe(false);
  });
});
