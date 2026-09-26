/**
 * Price table used to fill `llm_calls.cost_usd` (section 24). Prices are USD per
 * million tokens. Cache writes cost more than plain input and cache reads cost
 * far less, which is why the pipeline caches the system prompt, overview and
 * glossary rather than resending them (section 4.2).
 */
export interface ModelPrices {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens?: number;
  cacheReadTokens?: number;
}

const MILLION = 1_000_000;

/**
 * Matched by longest prefix, so a dated model id (`claude-haiku-4-5-20251001`)
 * picks up the family price without a table entry per snapshot.
 */
const PRICES: Record<string, ModelPrices> = {
  "claude-haiku": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
  "claude-sonnet": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-opus": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
};

/** Batch API work is half price (section 4.2 uses it for first ingest). */
export const BATCH_DISCOUNT = 0.5;

export function pricesFor(model: string): ModelPrices | undefined {
  let best: { prefix: string; prices: ModelPrices } | undefined;
  for (const [prefix, prices] of Object.entries(PRICES)) {
    if (model.startsWith(prefix) && (!best || prefix.length > best.prefix.length)) {
      best = { prefix, prices };
    }
  }
  return best?.prices;
}

/**
 * Returns `undefined` for an unknown model rather than guessing: a wrong number
 * in the usage page is worse than a blank one, and the budget guard treats an
 * unpriced call as unknown cost.
 */
export function costUsd(
  model: string,
  usage: TokenUsage,
  options: { batch?: boolean } = {},
): number | undefined {
  const prices = pricesFor(model);
  if (!prices) return undefined;

  const total =
    (usage.inputTokens * prices.input +
      usage.outputTokens * prices.output +
      (usage.cacheWriteTokens ?? 0) * prices.cacheWrite +
      (usage.cacheReadTokens ?? 0) * prices.cacheRead) /
    MILLION;

  const discounted = options.batch ? total * BATCH_DISCOUNT : total;
  // numeric(10,5) in the database; round here so the logged number matches.
  return Math.round(discounted * 1e5) / 1e5;
}

/** Share of input tokens served from cache. Reported as a metric (section 24). */
export function cacheHitRatio(usage: TokenUsage): number {
  const cached = usage.cacheReadTokens ?? 0;
  const total = usage.inputTokens + cached;
  return total === 0 ? 0 : cached / total;
}
