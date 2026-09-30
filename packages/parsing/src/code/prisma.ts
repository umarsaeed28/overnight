import type { ParsedFile, ParsedSymbol } from "../types.js";

const BLOCK = /^(model|enum)\s+(\w+)\s*\{/;

/**
 * Prisma schemas are their own small language. A hand-rolled reader is enough
 * for what section 10.1 wants from a model: its name, its fields, and where it
 * sits in the file.
 */
export function parsePrismaSchema(content: string): ParsedFile {
  const lines = content.split("\n");
  const symbols: ParsedSymbol[] = [];

  let open: { kind: "model" | "enum"; name: string; lineStart: number; fields: string[] } | null =
    null;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (!open) {
      const match = BLOCK.exec(trimmed);
      if (match) {
        open = {
          kind: match[1] as "model" | "enum",
          name: match[2] as string,
          lineStart: lineNumber,
          fields: [],
        };
      }
      return;
    }

    if (trimmed === "}") {
      symbols.push({
        kind: "model",
        name: open.name,
        signature: `${open.kind} ${open.name}`,
        lineStart: open.lineStart,
        lineEnd: lineNumber,
        meta: { orm: "prisma", block: open.kind, fields: open.fields },
      });
      open = null;
      return;
    }

    if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("@@")) return;

    const field = trimmed.split(/\s+/)[0];
    if (field) open.fields.push(field);
  });

  return {
    symbols,
    detectors: symbols.length > 0 ? ["prisma_model"] : [],
  };
}
