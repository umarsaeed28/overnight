import { z } from "zod";
import { documentKindSchema, type DocumentKind, type SourceKind } from "@oqa/core";

/**
 * Opaque per-connector sync position. `github` stores `{ sha }`, ticket
 * connectors store `{ updatedAt }`. Never interpreted outside its connector.
 */
export type Cursor = Record<string, unknown>;

/** Enough to fetch an item without listing again. */
export interface ItemRef {
  externalId: string;
  pathOrUrl: string;
  /** Provider version: blob sha, page version, issue updated stamp. */
  version: string;
  /** Known before fetching; the filter chain uses it to skip early. */
  bytes?: number;
  meta?: Record<string, unknown>;
}

export const rawItemSchema = z.object({
  externalId: z.string().min(1),
  pathOrUrl: z.string().min(1),
  title: z.string().optional(),
  kind: documentKindSchema,
  language: z.string().optional(),
  version: z.string().min(1),
  content: z.string(),
  meta: z.record(z.unknown()),
});
export type RawItem = z.infer<typeof rawItemSchema>;

/** What a connector is handed at call time. Credentials are already unsealed. */
export interface SourceContext {
  sourceId: string;
  workspaceId: string;
  kind: SourceKind;
  config: SourceConfig;
  credentials?: Record<string, string>;
}

/** Discriminated by `kind`; each connector narrows it in `validateConfig`. */
export type SourceConfig = Record<string, unknown>;

export interface WebhookRequest {
  headers: Record<string, string | undefined>;
  rawBody: Buffer;
}

export type ConnectionResult = { ok: true } | { ok: false; error: string };

export interface Connector {
  kind: SourceKind;
  validateConfig(config: unknown): SourceConfig;
  testConnection(src: SourceContext): Promise<ConnectionResult>;
  listItems(src: SourceContext, cursor?: Cursor): AsyncIterable<ItemRef>;
  fetchItem(src: SourceContext, ref: ItemRef): Promise<RawItem>;
  nextCursor(src: SourceContext): Promise<Cursor>;
  parseWebhook?(req: WebhookRequest): Promise<{ sourceIds: string[]; refs: ItemRef[] }>;
}

export interface FilterLimits {
  maxFileBytes: number;
  maxFilesPerSource: number;
}

export type SkipReason =
  | "path_excluded"
  | "lockfile"
  | "binary"
  | "too_large"
  | "generated"
  | "over_file_limit";

export type FilterOutcome = { keep: true; kind: DocumentKind } | { keep: false; reason: SkipReason };
