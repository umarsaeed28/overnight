import { createHmac, timingSafeEqual } from "node:crypto";
import type { ItemRef, WebhookRequest } from "@oqa/connector-shared";

export function verifySignature(secret: string, rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  return a.length === b.length && timingSafeEqual(a, b);
}

interface PushPayload {
  ref?: string;
  after?: string;
  repository?: { full_name?: string };
  commits?: { added?: string[]; modified?: string[]; removed?: string[] }[];
}

interface PullRequestPayload {
  action?: string;
  pull_request?: { number: number; merged?: boolean; html_url?: string; updated_at?: string };
  repository?: { full_name?: string };
}

export interface ParsedWebhook {
  /** `owner/repo`, matched against source configs by the caller. */
  repoFullName: string;
  branch?: string;
  headSha?: string;
  refs: ItemRef[];
  removedPaths: string[];
}

export class WebhookVerificationError extends Error {
  constructor() {
    super("The webhook signature did not verify.");
    this.name = "WebhookVerificationError";
  }
}

/**
 * Section 8.2: `push` on the configured branch and merged pull requests.
 * Anything else verifies but yields nothing to do.
 */
export function parseGithubWebhook(secret: string, req: WebhookRequest): ParsedWebhook | null {
  const signature = req.headers["x-hub-signature-256"] ?? req.headers["X-Hub-Signature-256"];
  if (!verifySignature(secret, req.rawBody, signature)) throw new WebhookVerificationError();

  const event = req.headers["x-github-event"] ?? req.headers["X-GitHub-Event"];
  const payload: unknown = JSON.parse(req.rawBody.toString("utf8"));

  if (event === "push") return parsePush(payload as PushPayload);
  if (event === "pull_request") return parsePullRequest(payload as PullRequestPayload);

  return null;
}

function parsePush(payload: PushPayload): ParsedWebhook | null {
  const repoFullName = payload.repository?.full_name;
  if (!repoFullName || !payload.after) return null;

  const changed = new Set<string>();
  const removed = new Set<string>();

  for (const commit of payload.commits ?? []) {
    for (const path of [...(commit.added ?? []), ...(commit.modified ?? [])]) changed.add(path);
    for (const path of commit.removed ?? []) removed.add(path);
  }
  // A path deleted in one commit and restored in a later one is a change.
  for (const path of changed) removed.delete(path);

  return {
    repoFullName,
    branch: payload.ref?.replace(/^refs\/heads\//, ""),
    headSha: payload.after,
    refs: [...changed].sort().map((path) => ({
      externalId: path,
      pathOrUrl: path,
      version: payload.after as string,
    })),
    removedPaths: [...removed].sort(),
  };
}

function parsePullRequest(payload: PullRequestPayload): ParsedWebhook | null {
  const repoFullName = payload.repository?.full_name;
  const pr = payload.pull_request;
  if (!repoFullName || !pr) return null;
  if (payload.action !== "closed" || !pr.merged) return null;

  return {
    repoFullName,
    refs: [
      {
        externalId: `pr/${pr.number}`,
        pathOrUrl: pr.html_url ?? `https://github.com/${repoFullName}/pull/${pr.number}`,
        version: pr.updated_at ?? String(pr.number),
        meta: { type: "pull_request", number: pr.number },
      },
    ],
    removedPaths: [],
  };
}
