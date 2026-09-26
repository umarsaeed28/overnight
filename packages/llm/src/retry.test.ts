import { describe, expect, it, vi } from "vitest";
import { backoffMs, isRetryable, retryAfterMs, withRetries } from "./retry.js";

const apiError = (status: number, headers: Record<string, string> = {}) =>
  Object.assign(new Error(`status ${status}`), { status, headers });

describe("isRetryable", () => {
  it("retries the statuses the spec names", () => {
    for (const status of [429, 500, 529]) expect(isRetryable(apiError(status))).toBe(true);
  });

  it("does not retry client mistakes", () => {
    for (const status of [400, 401, 403, 404, 422]) expect(isRetryable(apiError(status))).toBe(false);
  });

  it("retries network failures", () => {
    expect(isRetryable(Object.assign(new Error("reset"), { code: "ECONNRESET" }))).toBe(true);
    expect(isRetryable(Object.assign(new Error("down"), { name: "APIConnectionError" }))).toBe(true);
  });

  it("ignores non-errors", () => {
    expect(isRetryable(undefined)).toBe(false);
    expect(isRetryable("boom")).toBe(false);
  });
});

describe("retryAfterMs", () => {
  it("reads a seconds value", () => {
    expect(retryAfterMs(apiError(429, { "retry-after": "12" }))).toBe(12_000);
  });

  it("reads an HTTP date", () => {
    const now = Date.parse("2026-09-26T21:00:00Z");
    const error = apiError(429, { "retry-after": "Sat, 26 Sep 2026 21:00:30 GMT" });
    expect(retryAfterMs(error, now)).toBe(30_000);
  });

  it("never returns a negative delay for a date in the past", () => {
    const now = Date.parse("2026-09-26T21:01:00Z");
    const error = apiError(429, { "retry-after": "Sat, 26 Sep 2026 21:00:00 GMT" });
    expect(retryAfterMs(error, now)).toBe(0);
  });

  it("is undefined when the header is absent or junk", () => {
    expect(retryAfterMs(apiError(429))).toBeUndefined();
    expect(retryAfterMs(apiError(429, { "retry-after": "soon" }))).toBeUndefined();
  });
});

describe("backoffMs", () => {
  it("grows exponentially and is fully jittered", () => {
    expect(backoffMs(0, { baseMs: 500, random: () => 1 })).toBe(500);
    expect(backoffMs(1, { baseMs: 500, random: () => 1 })).toBe(1000);
    expect(backoffMs(3, { baseMs: 500, random: () => 1 })).toBe(4000);
    expect(backoffMs(3, { baseMs: 500, random: () => 0 })).toBe(0);
  });

  it("is capped", () => {
    expect(backoffMs(20, { baseMs: 500, maxMs: 30_000, random: () => 1 })).toBe(30_000);
  });
});

describe("withRetries", () => {
  it("returns the first success without sleeping", async () => {
    const sleep = vi.fn();
    const result = await withRetries(async () => "ok", { sleep });
    expect(result).toBe("ok");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries up to 3 times then throws the last error", async () => {
    const sleep = vi.fn(async () => {});
    const fn = vi.fn(async () => {
      throw apiError(529);
    });

    await expect(withRetries(fn, { sleep, random: () => 0.5 })).rejects.toThrow("status 529");
    expect(fn).toHaveBeenCalledTimes(4); // initial attempt + 3 retries
    expect(sleep).toHaveBeenCalledTimes(3);
  });

  it("gives up immediately on a non-retryable error", async () => {
    const sleep = vi.fn();
    const fn = vi.fn(async () => {
      throw apiError(400);
    });

    await expect(withRetries(fn, { sleep })).rejects.toThrow("status 400");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("prefers retry-after over computed backoff", async () => {
    const delays: number[] = [];
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls === 1) throw apiError(429, { "retry-after": "7" });
      return "ok";
    };

    await withRetries(fn, {
      sleep: async (ms) => {
        delays.push(ms);
      },
      random: () => 1,
    });
    expect(delays).toEqual([7000]);
  });

  it("succeeds after a transient failure", async () => {
    let calls = 0;
    const result = await withRetries(
      async () => {
        calls += 1;
        if (calls < 3) throw apiError(500);
        return calls;
      },
      { sleep: async () => {}, random: () => 0 },
    );
    expect(result).toBe(3);
  });
});
