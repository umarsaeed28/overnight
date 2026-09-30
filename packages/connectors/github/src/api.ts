import {
  HttpStatusError,
  RateLimiter,
  withConnectorRetries,
  type RetryOptions,
} from "@oqa/connector-shared";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface GithubClientOptions {
  /** Absent for public repositories read anonymously. */
  token?: string;
  baseUrl?: string;
  graphqlUrl?: string;
  fetchImpl?: FetchLike;
  limiter?: RateLimiter;
  retry?: RetryOptions;
  userAgent?: string;
}

const DEFAULT_BASE_URL = "https://api.github.com";
const DEFAULT_GRAPHQL_URL = "https://api.github.com/graphql";
/** Authenticated apps get 5,000 requests an hour; stay comfortably under it. */
const DEFAULT_RATE_PER_SECOND = 8;

function headersToRecord(headers: Headers): Record<string, string | undefined> {
  const record: Record<string, string | undefined> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

export class GithubClient {
  readonly #options: GithubClientOptions;
  readonly #fetch: FetchLike;
  readonly limiter: RateLimiter;

  constructor(options: GithubClientOptions = {}) {
    this.#options = options;
    this.#fetch = options.fetchImpl ?? ((url, init) => fetch(url, init));
    this.limiter =
      options.limiter ?? new RateLimiter({ ratePerSecond: DEFAULT_RATE_PER_SECOND, capacity: 20 });
  }

  #headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": this.#options.userAgent ?? "overnight-qa-context-builder",
      ...(this.#options.token ? { authorization: `Bearer ${this.#options.token}` } : {}),
      ...extra,
    };
  }

  /**
   * GitHub tells us when it will forgive us again. Honouring
   * `x-ratelimit-reset` keeps the whole source paused rather than having every
   * in-flight request discover the wall separately.
   */
  #observeRateLimit(headers: Record<string, string | undefined>): void {
    if (headers["x-ratelimit-remaining"] !== "0") return;

    const reset = Number(headers["x-ratelimit-reset"]);
    if (Number.isFinite(reset)) this.limiter.pauseUntil(reset * 1000);
  }

  async #send(url: string, init: RequestInit): Promise<{ body: unknown; status: number }> {
    return withConnectorRetries(async () => {
      await this.limiter.acquire();

      const response = await this.#fetch(url, init);
      const headers = headersToRecord(response.headers);
      this.#observeRateLimit(headers);

      if (!response.ok) {
        const text = await response.text();
        throw new HttpStatusError(
          response.status,
          `GitHub ${init.method ?? "GET"} ${url} failed with ${response.status}: ${text.slice(0, 200)}`,
          headers,
        );
      }

      return { body: await response.json(), status: response.status };
    }, this.#options.retry);
  }

  async rest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const base = this.#options.baseUrl ?? DEFAULT_BASE_URL;
    const url = path.startsWith("http") ? path : `${base}${path}`;

    const { body } = await this.#send(url, { ...init, headers: this.#headers() });
    return body as T;
  }

  async graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const url = this.#options.graphqlUrl ?? DEFAULT_GRAPHQL_URL;

    const { body } = await this.#send(url, {
      method: "POST",
      headers: this.#headers({ "content-type": "application/json" }),
      body: JSON.stringify({ query, variables }),
    });

    const payload = body as { data?: T; errors?: { message: string }[] };
    if (payload.errors?.length) {
      throw new Error(`GitHub GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`);
    }
    if (!payload.data) throw new Error("GitHub GraphQL returned no data");

    return payload.data;
  }
}
