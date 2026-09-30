import type { SymbolKind } from "@oqa/core";

export interface ParsedSymbol {
  kind: SymbolKind;
  name: string;
  signature?: string;
  /** 1-based, inclusive. */
  lineStart: number;
  lineEnd: number;
  meta: Record<string, unknown>;
}

export interface ParsedFile {
  symbols: ParsedSymbol[];
  /**
   * Which detectors fired, recorded in build stats (section 10.1) so a
   * workspace can see what the parser recognised.
   */
  detectors: string[];
}

export interface DocSection {
  /** `H1 > H2 > H3`, empty for content before the first heading. */
  breadcrumb: string;
  title: string;
  depth: number;
  lineStart: number;
  lineEnd: number;
  content: string;
}
