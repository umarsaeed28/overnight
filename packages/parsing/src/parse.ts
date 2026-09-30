import type { DocumentKind } from "@oqa/core";
import type { DocSection, ParsedFile } from "./types.js";
import { parseCodeSymbols } from "./code/symbols.js";
import { parsePrismaSchema } from "./code/prisma.js";
import { parseTestSymbols } from "./tests/detect.js";
import { splitMarkdownSections } from "./docs/markdown.js";
import { normalizeTicket } from "./tickets/normalize.js";

export interface ParseInput {
  path: string;
  kind: DocumentKind;
  content: string;
  /** Ticket connectors put the structured fields here. */
  meta?: Record<string, unknown>;
  /** Prefixes doc breadcrumbs, e.g. `Space > Page`. */
  breadcrumbRoot?: string;
}

export interface ParseResult extends ParsedFile {
  /** Present for docs; chunking splits these further (section 11.2). */
  sections: DocSection[];
  /** Present for tickets: the 10.4 normalised markdown. */
  normalized?: string;
}

/** The single entry point the worker's parse stage calls. */
export async function parseDocument(input: ParseInput): Promise<ParseResult> {
  if (input.kind === "ticket") {
    return {
      symbols: [],
      detectors: ["ticket"],
      sections: [],
      normalized: input.meta ? normalizeTicket(input.meta) : input.content,
    };
  }

  if (input.kind === "doc") {
    return {
      symbols: [],
      detectors: ["markdown"],
      sections: splitMarkdownSections(input.content, input.breadcrumbRoot),
    };
  }

  if (input.path.endsWith(".prisma")) {
    return { ...parsePrismaSchema(input.content), sections: [] };
  }

  if (input.kind === "test") {
    return { ...(await parseTestSymbols(input.path, input.content)), sections: [] };
  }

  return { ...(await parseCodeSymbols(input.path, input.content)), sections: [] };
}
