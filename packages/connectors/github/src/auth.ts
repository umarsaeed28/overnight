import { createPrivateKey } from "node:crypto";
import { SignJWT } from "jose";
import { assertReadOnlyPermissions } from "@oqa/connector-shared";
import type { GithubClient } from "./api.js";

/** GitHub rejects app JWTs older than 10 minutes; 9 leaves room for clock skew. */
const APP_JWT_TTL_SECONDS = 9 * 60;
/** Refresh an installation token this long before it actually expires. */
const RENEW_MARGIN_MS = 5 * 60_000;

export interface AppCredentials {
  appId: string;
  privateKeyPem: string;
}

export async function createAppJwt(
  credentials: AppCredentials,
  now = Math.floor(Date.now() / 1000),
): Promise<string> {
  const key = createPrivateKey(credentials.privateKeyPem);

  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    // Backdate by a minute so a slightly fast clock does not invalidate it.
    .setIssuedAt(now - 60)
    .setExpirationTime(now + APP_JWT_TTL_SECONDS)
    .setIssuer(credentials.appId)
    .sign(key);
}

interface InstallationTokenResponse {
  token: string;
  expires_at: string;
  permissions?: Record<string, string>;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * Mints installation tokens on demand and holds them in memory only. Section
 * 8.2: installation tokens are never stored.
 */
export class InstallationTokenProvider {
  readonly #cache = new Map<string, CachedToken>();

  constructor(
    private readonly credentials: AppCredentials,
    private readonly clientFor: (appJwt: string) => GithubClient,
    private readonly now: () => number = Date.now,
  ) {}

  async tokenFor(installationId: string): Promise<string> {
    const cached = this.#cache.get(installationId);
    if (cached && cached.expiresAt - RENEW_MARGIN_MS > this.now()) return cached.token;

    const appJwt = await createAppJwt(this.credentials, Math.floor(this.now() / 1000));
    const client = this.clientFor(appJwt);

    const response = await client.rest<InstallationTokenResponse>(
      `/app/installations/${installationId}/access_tokens`,
      { method: "POST" },
    );

    // A token that can write is a configuration error, not something to use
    // carefully.
    if (response.permissions) assertReadOnlyPermissions(response.permissions);

    this.#cache.set(installationId, {
      token: response.token,
      expiresAt: Date.parse(response.expires_at),
    });

    return response.token;
  }

  forget(installationId: string): void {
    this.#cache.delete(installationId);
  }
}
