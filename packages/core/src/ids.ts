import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Chunk ids are `c_` + a per-workspace base36 counter (section 7). They are
 * short enough for a model to copy without error and stable across rebuilds.
 */
export function chunkId(counter: number): string {
  if (!Number.isInteger(counter) || counter < 0) {
    throw new RangeError(`chunk counter must be a non-negative integer, got ${counter}`);
  }
  return `c_${counter.toString(36)}`;
}

const CHUNK_ID_RE = /^c_[0-9a-z]+$/;

export function isChunkId(value: string): boolean {
  return CHUNK_ID_RE.test(value);
}

/**
 * Identity of a chunk's *content and location*. Two chunks with the same
 * identity across builds are the same chunk and reuse the id (section 7.2).
 */
export function chunkIdentity(input: {
  externalId: string;
  breadcrumb: string | null;
  contentHash: string;
}): string {
  return sha256([input.externalId, input.breadcrumb ?? "", input.contentHash].join("\u0000"));
}

/**
 * Claim identity that survives rebuilds, so a human confirm/reject sticks even
 * when the model rewords nothing but whitespace (section 7).
 */
export function claimStableKey(input: { knowledgeFileId: string; text: string }): string {
  return sha256(`${input.knowledgeFileId}\u0000${normalizeClaimText(input.text)}`);
}

/** Lowercase, collapse whitespace, drop trailing punctuation. */
export function normalizeClaimText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.;,:]+$/, "");
}

/**
 * A feature is re-extracted only when this hash changes (section 9.3).
 */
export function featureInputHash(input: {
  chunks: readonly { id: string; contentHash: string }[];
  promptVersion: string;
  model: string;
}): string {
  const chunks = [...input.chunks]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((c) => `${c.id}:${c.contentHash}`)
    .join("\n");
  return sha256([chunks, input.promptVersion, input.model].join("\u0000"));
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const SLUG_RE = /^[a-z0-9-]+$/;

export function isSlug(value: string): boolean {
  return SLUG_RE.test(value) && !value.startsWith("-") && !value.endsWith("-");
}

/**
 * Knowledge file ids are `{type}.{slug}` (e.g. `flow.checkout-guest`), except
 * the singleton globals which are bare names (`overview`, `glossary`, ...).
 */
export const GLOBAL_KNOWLEDGE_FILE_IDS = [
  "overview",
  "glossary",
  "data-model",
  "conflicts",
  "coverage",
  "rules",
] as const;

export type GlobalKnowledgeFileId = (typeof GLOBAL_KNOWLEDGE_FILE_IDS)[number];

export function knowledgeFileId(type: "feature" | "flow" | "api", slug: string): string {
  if (!isSlug(slug)) throw new Error(`invalid slug for knowledge file id: ${slug}`);
  return `${type}.${slug}`;
}

export function parseKnowledgeFileId(
  id: string,
): { type: "feature" | "flow" | "api"; slug: string } | { type: GlobalKnowledgeFileId; slug: null } {
  const global = GLOBAL_KNOWLEDGE_FILE_IDS.find((g) => g === id);
  if (global) return { type: global, slug: null };

  const dot = id.indexOf(".");
  const type = id.slice(0, dot);
  const slug = id.slice(dot + 1);
  if (type !== "feature" && type !== "flow" && type !== "api") {
    throw new Error(`unknown knowledge file id: ${id}`);
  }
  if (!isSlug(slug)) throw new Error(`invalid slug in knowledge file id: ${id}`);
  return { type, slug };
}
