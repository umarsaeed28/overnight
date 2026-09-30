export interface TokenBucketOptions {
  /** Steady-state requests per second. */
  ratePerSecond: number;
  /** Burst size. Defaults to one second of rate, minimum 1. */
  capacity?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Per-source token bucket. Providers also tell us when to stop: `pauseUntil`
 * lets a caller honour `Retry-After` or `x-ratelimit-reset` without throwing
 * away the bucket.
 */
export class RateLimiter {
  readonly #ratePerSecond: number;
  readonly #capacity: number;
  readonly #now: () => number;
  readonly #sleep: (ms: number) => Promise<void>;

  #tokens: number;
  #lastRefill: number;
  #pausedUntil = 0;
  /** Serialises waiters so tokens are handed out in call order. */
  #queue: Promise<void> = Promise.resolve();

  constructor(options: TokenBucketOptions) {
    if (options.ratePerSecond <= 0) throw new Error("ratePerSecond must be positive");

    this.#ratePerSecond = options.ratePerSecond;
    this.#capacity = Math.max(1, options.capacity ?? Math.ceil(options.ratePerSecond));
    this.#now = options.now ?? Date.now;
    this.#sleep = options.sleep ?? defaultSleep;
    this.#tokens = this.#capacity;
    this.#lastRefill = this.#now();
  }

  /** Stop issuing tokens until `timestamp`, as instructed by the provider. */
  pauseUntil(timestamp: number): void {
    this.#pausedUntil = Math.max(this.#pausedUntil, timestamp);
  }

  get availableTokens(): number {
    return this.#tokens;
  }

  async acquire(): Promise<void> {
    const wait = this.#queue.then(() => this.#take());
    // Failures must not wedge the queue for everyone behind us.
    this.#queue = wait.then(
      () => undefined,
      () => undefined,
    );
    return wait;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }

  async #take(): Promise<void> {
    for (;;) {
      const now = this.#now();

      if (now < this.#pausedUntil) {
        await this.#sleep(this.#pausedUntil - now);
        continue;
      }

      this.#refill(now);

      if (this.#tokens >= 1) {
        this.#tokens -= 1;
        return;
      }

      await this.#sleep(Math.ceil(((1 - this.#tokens) / this.#ratePerSecond) * 1000));
    }
  }

  #refill(now: number): void {
    const elapsed = now - this.#lastRefill;
    if (elapsed <= 0) return;

    this.#tokens = Math.min(this.#capacity, this.#tokens + (elapsed / 1000) * this.#ratePerSecond);
    this.#lastRefill = now;
  }
}
