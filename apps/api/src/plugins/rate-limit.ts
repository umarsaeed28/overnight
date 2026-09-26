import rateLimit from "@fastify/rate-limit";
import { rateLimited } from "@oqa/core";
import fp from "fastify-plugin";

/**
 * Per-user limits from section 21. Applied per route with
 * `config: { rateLimit: RATE_LIMITS.chat }`; the global default is a backstop
 * for everything else.
 */
export const RATE_LIMITS = {
  chat: { max: 30, timeWindow: "1 minute" },
  search: { max: 120, timeWindow: "1 minute" },
  builds: { max: 6, timeWindow: "1 hour" },
  testGeneration: { max: 20, timeWindow: "1 hour" },
} as const;

export interface RateLimitPluginOptions {
  /** Disabled in tests so a contract suite does not trip the limiter. */
  enabled?: boolean;
}

export default fp<RateLimitPluginOptions>(
  async (app, options) => {
    if (options.enabled === false) {
      // The route-level `config.rateLimit` objects stay harmless without the
      // plugin, so nothing else has to change between test and production.
      return;
    }

    await app.register(rateLimit, {
      global: true,
      max: 600,
      timeWindow: "1 minute",
      // Limits are per user, not per IP: several engineers behind one office
      // NAT must not share a budget.
      keyGenerator: (request) => request.user?.id ?? request.ip,
      errorResponseBuilder: (_request, context) =>
        rateLimited(
          `Too many requests. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        ).toBody(),
    });
  },
  { name: "rate-limit", dependencies: ["auth"] },
);
