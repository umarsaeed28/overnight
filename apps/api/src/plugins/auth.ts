import { decode } from "@auth/core/jwt";
import cookie from "@fastify/cookie";
import { unauthorized } from "@oqa/core";
import type { FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Auth.js v5 issues an encrypted JWE session cookie. The API decrypts it with
 * the shared `AUTH_SECRET` rather than calling back into the web app, so a
 * request costs no extra round trip. Sign-in itself lives entirely in the web
 * app (section 20.1).
 */
export type SessionVerifier = (request: FastifyRequest) => Promise<SessionUser | null>;

const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"] as const;

export function authJsVerifier(secret: string): SessionVerifier {
  return async (request) => {
    for (const name of COOKIE_NAMES) {
      const token = request.cookies[name];
      if (!token) continue;

      // The cookie name is Auth.js's key-derivation salt, so it has to match the
      // cookie the token actually arrived in.
      const payload = await decode({ token, secret, salt: name }).catch(() => null);
      const id = typeof payload?.sub === "string" ? payload.sub : undefined;
      const email = typeof payload?.email === "string" ? payload.email : undefined;
      if (id && email) return { id, email };
    }
    return null;
  };
}

declare module "fastify" {
  interface FastifyRequest {
    user: SessionUser | null;
    requireUser(): SessionUser;
  }
}

export interface AuthPluginOptions {
  verifySession: SessionVerifier;
}

export default fp<AuthPluginOptions>(
  async (app, options) => {
    await app.register(cookie);

    app.decorateRequest("user", null);
    app.decorateRequest("requireUser", function requireUser(this: FastifyRequest) {
      if (!this.user) throw unauthorized();
      return this.user;
    });

    app.addHook("onRequest", async (request) => {
      request.user = await options.verifySession(request);
    });
  },
  { name: "auth" },
);
