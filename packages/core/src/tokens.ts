/**
 * Local token estimate used for chunk sizing and budget pre-checks (11.4).
 * Deliberately cheap and deliberately approximate: the SDK counting endpoint is
 * only consulted for extraction inputs above TOKEN_COUNT_ENDPOINT_THRESHOLD.
 */
const CHARS_PER_TOKEN = 3.5;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateTokensForAll(texts: readonly string[]): number {
  return texts.reduce((sum, t) => sum + estimateTokens(t), 0);
}
