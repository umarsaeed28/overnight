import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit.js";

/** A clock the test drives, so no test waits on real time. */
function fakeClock() {
  let now = 0;
  const slept: number[] = [];

  return {
    now: () => now,
    slept,
    sleep: async (ms: number) => {
      slept.push(ms);
      now += ms;
    },
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("RateLimiter", () => {
  it("serves the burst without waiting", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 2, capacity: 3, ...clock });

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    expect(clock.slept).toEqual([]);
  });

  it("waits once the burst is spent", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 2, capacity: 1, ...clock });

    await limiter.acquire();
    await limiter.acquire();

    expect(clock.slept).toHaveLength(1);
    expect(clock.slept[0]).toBeGreaterThan(0);
  });

  it("refills over time", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 10, capacity: 2, ...clock });

    await limiter.acquire();
    await limiter.acquire();
    clock.advance(1000);
    await limiter.acquire();

    expect(clock.slept).toEqual([]);
  });

  it("honours a provider pause", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 100, capacity: 100, ...clock });

    limiter.pauseUntil(5_000);
    await limiter.acquire();

    expect(clock.slept).toEqual([5_000]);
  });

  it("never exceeds its capacity however long it idles", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 5, capacity: 5, ...clock });

    await limiter.acquire();
    clock.advance(60_000);
    await limiter.acquire();

    expect(limiter.availableTokens).toBeLessThanOrEqual(5);
  });

  it("rejects a non-positive rate", () => {
    expect(() => new RateLimiter({ ratePerSecond: 0 })).toThrow(/positive/);
  });

  it("runs a function behind the limiter", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 1, capacity: 1, ...clock });

    await expect(limiter.run(async () => "done")).resolves.toBe("done");
  });

  it("keeps serving after a caller's work throws", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ ratePerSecond: 10, capacity: 10, ...clock });

    await expect(
      limiter.run(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(limiter.run(async () => "ok")).resolves.toBe("ok");
  });
});
