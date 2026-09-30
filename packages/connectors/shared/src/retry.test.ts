import { describe, expect, it, vi } from "vitest";
import {
  HttpStatusError,
  backoffMs,
  isRetryable,
  isRetryableStatus,
  retryAfterMs,
  withConnectorRetries,
} from "./retry.js";
import { assertReadOnlyPermissions, assertReadOnlyScopes, findWriteScopes } from "./scopes.js";

const noSleep = async () => {};

describe("isRetryableStatus", () => {
  it.each([429, 500, 502, 503])("retries %i", (status) => {
    expect(isRetryableStatus(status)).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])("does not retry %i", (status) => {
    expect(isRetryableStatus(status)).toBe(false);
  });
});

describe("isRetryable", () => {
  it("retries a network failure", () => {
    expect(isRetryable(new TypeError("fetch failed"))).toBe(true);
  });

  it("does not retry an ordinary error", () => {
    expect(isRetryable(new Error("bad config"))).toBe(false);
  });
});

describe("retryAfterMs", () => {
  it("reads seconds", () => {
    expect(retryAfterMs({ "retry-after": "3" })).toBe(3000);
  });

  it("reads an HTTP date", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(retryAfterMs({ "retry-after": "Thu, 01 Jan 2026 00:00:10 GMT" }, now)).toBe(10_000);
  });

  it("never returns a negative wait", () => {
    const now = Date.parse("2026-01-01T00:00:30Z");
    expect(retryAfterMs({ "retry-after": "Thu, 01 Jan 2026 00:00:10 GMT" }, now)).toBe(0);
  });

  it("returns undefined when the header is absent or unparseable", () => {
    expect(retryAfterMs({})).toBeUndefined();
    expect(retryAfterMs({ "retry-after": "soon" })).toBeUndefined();
  });
});

describe("backoffMs", () => {
  it("grows exponentially at the ceiling", () => {
    expect(backoffMs(1, () => 1)).toBe(500);
    expect(backoffMs(2, () => 1)).toBe(1000);
    expect(backoffMs(3, () => 1)).toBe(2000);
  });

  it("is capped", () => {
    expect(backoffMs(20, () => 1)).toBe(30_000);
  });

  it("jitters down to zero", () => {
    expect(backoffMs(5, () => 0)).toBe(0);
  });
});

describe("withConnectorRetries", () => {
  it("returns the first success", async () => {
    const fn = vi.fn(async () => "ok");
    await expect(withConnectorRetries(fn, { sleep: noSleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after five attempts", async () => {
    const fn = vi.fn(async () => {
      throw new HttpStatusError(503, "unavailable");
    });

    await expect(withConnectorRetries(fn, { sleep: noSleep })).rejects.toThrow("unavailable");
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("does not retry a 404", async () => {
    const fn = vi.fn(async () => {
      throw new HttpStatusError(404, "missing");
    });

    await expect(withConnectorRetries(fn, { sleep: noSleep })).rejects.toThrow("missing");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("prefers the provider's retry-after over backoff", async () => {
    const slept: number[] = [];
    let calls = 0;

    await withConnectorRetries(
      async () => {
        calls += 1;
        if (calls === 1) throw new HttpStatusError(429, "slow down", { "retry-after": "7" });
        return "ok";
      },
      {
        sleep: async (ms) => {
          slept.push(ms);
        },
        now: () => 0,
      },
    );

    expect(slept).toEqual([7000]);
  });

  it("reports each retry", async () => {
    const onRetry = vi.fn();
    let calls = 0;

    await withConnectorRetries(
      async () => {
        calls += 1;
        if (calls < 3) throw new HttpStatusError(500, "boom");
        return "ok";
      },
      { sleep: noSleep, onRetry },
    );

    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});

describe("read-only scope enforcement", () => {
  it.each([
    "repo:write",
    "write:page:confluence",
    "admin:org",
    "manage:jira-project",
    "contents.readwrite",
  ])("rejects %s", (scope) => {
    expect(findWriteScopes([scope])).toEqual([scope]);
    expect(() => assertReadOnlyScopes([scope])).toThrow(/read-only/);
  });

  it.each(["read:page:confluence", "read:jira-work", "offline_access", "metadata"])(
    "accepts %s",
    (scope) => {
      expect(() => assertReadOnlyScopes([scope])).not.toThrow();
    },
  );

  it("names every offending scope", () => {
    expect(() => assertReadOnlyScopes(["read:jira-work", "write:jira-work", "delete:issue"]))
      .toThrow(/write:jira-work, delete:issue/);
  });

  it("rejects a GitHub App permission above read", () => {
    expect(() => assertReadOnlyPermissions({ contents: "read", pull_requests: "write" })).toThrow(
      /pull_requests:write/,
    );
  });

  it("accepts read-only GitHub App permissions", () => {
    expect(() =>
      assertReadOnlyPermissions({ contents: "read", metadata: "read", pull_requests: "read" }),
    ).not.toThrow();
  });
});
