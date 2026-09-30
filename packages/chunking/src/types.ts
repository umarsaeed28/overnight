import type { ChunkKind } from "@oqa/core";

/** A chunk before it has an id or an embedding. */
export interface DraftChunk {
  kind: ChunkKind;
  breadcrumb: string;
  /** Null for chunks that are not tied to one symbol, such as module chunks. */
  symbolName: string | null;
  section: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  content: string;
  tokenCount: number;
  contentHash: string;
}

export const CODE_LIMITS = {
  /** Above this a symbol is split (section 11.1). */
  symbolMaxTokens: 1_200,
  partMinTokens: 600,
  partMaxTokens: 1_000,
  /** A module chunk below this is not worth storing. */
  moduleMinTokens: 50,
} as const;

export const DOC_LIMITS = {
  targetMinTokens: 400,
  targetMaxTokens: 800,
  overlapTokens: 80,
} as const;

export const TICKET_LIMITS = {
  splitAboveTokens: 1_500,
} as const;
