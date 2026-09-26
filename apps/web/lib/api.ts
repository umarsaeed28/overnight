import { loadEnv } from "@oqa/core";
import { cookies } from "next/headers";

export const API_BASE = `${loadEnv().API_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Server-side API call. Forwards the browser's session cookie so the API can
 * authenticate the same user; nothing tenant-scoped is read from the database
 * directly by the web app.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieHeader = (await cookies()).toString();

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new ApiError(
      response.status,
      body?.error?.message ?? "The API did not respond as expected. Try again.",
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
