/**
 * Retry policy from section 4.2: 3 retries, exponential backoff with jitter, on
 * 429, 500, 529 and network errors, honouring `retry-after`.
 */
export const RETRYABLE_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

export interface RetryableError {
  status?: number;
  headers?: Record<string, string | undefined> | Headers;
  code?: string;
}

const NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

export function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as RetryableError & { name?: string };

  if (typeof candidate.status === "number") return RETRYABLE_STATUSES.has(candidate.status);
  if (candidate.code && NETWORK_CODES.has(candidate.code)) return true;
  // The SDK surfaces transport failures as APIConnectionError with no status.
  return candidate.name === "APIConnectionError" || candidate.name === "APIConnectionTimeoutError";
}

function header(error: unknown, name: string): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const headers = (error as RetryableError).headers;
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const record = headers as Record<string, string | undefined>;
  return record[name] ?? record[name.toLowerCase()];
}

/**
 * `retry-after` is seconds or an HTTP date. Returns milliseconds, or undefined
 * when the header is absent or unparseable.
 */
export function retryAfterMs(error: unknown, now = Date.now()): number | undefined {
  const value = header(error, "retry-after");
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - now);
}

export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  /** Injected in tests; defaults to Math.random. */
  random?: () => number;
}

/**
 * Full jitter: a uniform draw from [0, exponential window]. Avoids a thundering
 * herd when a whole fan-out stage is rate limited at once.
 */
export function backoffMs(attempt: number, options: BackoffOptions = {}): number {
  const { baseMs = 500, maxMs = 30_000, random = Math.random } = options;
  const window = Math.min(maxMs, baseMs * 2 ** attempt);
  return Math.round(random() * window);
}

export interface RetryOptions extends BackoffOptions {
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * `retry-after` wins over computed backoff when the provider sent one: the
 * provider knows when it will accept traffic again and we do not.
 */
export async function withRetries<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, sleep = defaultSleep, onRetry } = options;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries || !isRetryable(error)) throw error;
      const delayMs = retryAfterMs(error) ?? backoffMs(attempt, options);
      onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
      attempt += 1;
    }
  }
}
