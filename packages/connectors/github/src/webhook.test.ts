import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WebhookVerificationError, parseGithubWebhook, verifySignature } from "./webhook.js";

const SECRET = "s3cret";

function signed(event: string, payload: unknown) {
  const rawBody = Buffer.from(JSON.stringify(payload));
  return {
    headers: {
      "x-github-event": event,
      "x-hub-signature-256": `sha256=${createHmac("sha256", SECRET).update(rawBody).digest("hex")}`,
    },
    rawBody,
  };
}

describe("verifySignature", () => {
  it("accepts a correct signature", () => {
    const { headers, rawBody } = signed("push", { a: 1 });
    expect(verifySignature(SECRET, rawBody, headers["x-hub-signature-256"])).toBe(true);
  });

  it("rejects a tampered body", () => {
    const { headers } = signed("push", { a: 1 });
    expect(verifySignature(SECRET, Buffer.from('{"a":2}'), headers["x-hub-signature-256"])).toBe(
      false,
    );
  });

  it("rejects a missing signature", () => {
    expect(verifySignature(SECRET, Buffer.from("{}"), undefined)).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    expect(verifySignature(SECRET, Buffer.from("{}"), "sha256=short")).toBe(false);
  });
});

describe("parseGithubWebhook", () => {
  it("refuses an unsigned request", () => {
    expect(() =>
      parseGithubWebhook(SECRET, { headers: { "x-github-event": "push" }, rawBody: Buffer.from("{}") }),
    ).toThrow(WebhookVerificationError);
  });

  it("collects added and modified paths from a push", () => {
    const parsed = parseGithubWebhook(
      SECRET,
      signed("push", {
        ref: "refs/heads/main",
        after: "head9",
        repository: { full_name: "acme/shop" },
        commits: [
          { added: ["a.ts"], modified: ["b.ts"], removed: ["c.ts"] },
          { modified: ["b.ts"], removed: ["d.ts"] },
        ],
      }),
    );

    expect(parsed).toMatchObject({ repoFullName: "acme/shop", branch: "main", headSha: "head9" });
    expect(parsed!.refs.map((r) => r.externalId)).toEqual(["a.ts", "b.ts"]);
    expect(parsed!.removedPaths).toEqual(["c.ts", "d.ts"]);
  });

  it("treats a path deleted then restored as a change", () => {
    const parsed = parseGithubWebhook(
      SECRET,
      signed("push", {
        ref: "refs/heads/main",
        after: "head9",
        repository: { full_name: "acme/shop" },
        commits: [{ removed: ["a.ts"] }, { added: ["a.ts"] }],
      }),
    );

    expect(parsed!.refs.map((r) => r.externalId)).toEqual(["a.ts"]);
    expect(parsed!.removedPaths).toEqual([]);
  });

  it("yields a ref for a merged pull request", () => {
    const parsed = parseGithubWebhook(
      SECRET,
      signed("pull_request", {
        action: "closed",
        repository: { full_name: "acme/shop" },
        pull_request: { number: 12, merged: true, updated_at: "2026-01-01T00:00:00Z" },
      }),
    );

    expect(parsed!.refs[0]!.externalId).toBe("pr/12");
  });

  it("ignores a pull request closed without merging", () => {
    const parsed = parseGithubWebhook(
      SECRET,
      signed("pull_request", {
        action: "closed",
        repository: { full_name: "acme/shop" },
        pull_request: { number: 12, merged: false },
      }),
    );

    expect(parsed).toBeNull();
  });

  it("ignores events it does not handle", () => {
    expect(parseGithubWebhook(SECRET, signed("issues", { action: "opened" }))).toBeNull();
  });
});
