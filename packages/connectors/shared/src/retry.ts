/** Section 8.1: 5 attempts, exponential backoff, on 429 and 5xx. */
export const CONNECTOR_MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 30_000;

export class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly headers: Record<string, string | undefined> = {},
  ) {
    super(message);
    this.name = "HttpStatusError";
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof HttpStatusError) return isRetryableStatus(error.status);

  // Undici surfaces connection problems as a TypeError with a cause.
  return error instanceof TypeError && error.message.includes("fetch failed");
}

/** Provider-supplied wait, from `retry-after` (seconds or HTTP date). */
export function retryAfterMs(
  headers: Record<string, string | undefined>,
  now = Date.now(),
): number | undefined {
  const raw = headers["retry-after"] ?? headers["Retry-After"];
  if (!raw) return undefined;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const at = Date.parse(raw);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now);
}

/** Exponential backoff with full jitter, so retries from many jobs spread out. */
export function backoffMs(attempt: number, random = Math.random): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1));
  return Math.floor(random() * ceiling);
}

export interface RetryOptions {
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
}

export async function withConnectorRetries<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? CONNECTOR_MAX_ATTEMPTS;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const now = options.now ?? Date.now;

  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryable(error)) throw error;

      const advertised =
        error instanceof HttpStatusError ? retryAfterMs(error.headers, now()) : undefined;
      const delayMs = advertised ?? backoffMs(attempt, options.random);

      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }
}
