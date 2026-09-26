import { z } from "zod";

export const errorCodeSchema = z.enum([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "budget_exceeded",
  "internal",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  budget_exceeded: 402,
  internal: 500,
};

/**
 * Errors thrown anywhere in the API layer. `message` is user-facing: a plain
 * sentence with a next action, never a stack trace (section 25).
 */
export class HttpError extends Error {
  readonly statusCode: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = STATUS[code];
  }

  toBody(): ApiError {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details === undefined ? {} : { details: this.details }),
      },
    };
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError("bad_request", message, details);
export const unauthorized = (message = "Sign in to continue.") =>
  new HttpError("unauthorized", message);
/**
 * Tenant isolation: a workspace the caller cannot see must be indistinguishable
 * from one that does not exist (section 23).
 */
export const notFound = (message = "Not found.") => new HttpError("not_found", message);
export const forbidden = (message: string) => new HttpError("forbidden", message);
export const rateLimited = (message = "Too many requests. Try again shortly.") =>
  new HttpError("rate_limited", message);
