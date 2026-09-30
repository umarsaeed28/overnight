import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import TreeSitter from "web-tree-sitter";

// web-tree-sitter 0.24 ships CommonJS with everything hanging off the default
// export, so the named exports are unpacked here rather than at each use.
const Parser = (TreeSitter as unknown as { default?: typeof TreeSitter }).default ?? TreeSitter;
type ParserInstance = InstanceType<typeof Parser>;
type LanguageInstance = Awaited<ReturnType<typeof Parser.Language.load>>;
export type SyntaxNode = ReturnType<ParserInstance["parse"]>["rootNode"];

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const QUERY_DIR = resolve(here, "../../code/queries");

/** The languages M2 parses. More arrive in M6 (section 28). */
export const SUPPORTED_LANGUAGES = ["typescript", "tsx", "javascript"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const WASM_FILES: Record<SupportedLanguage, string> = {
  typescript: "tree-sitter-wasms/out/tree-sitter-typescript.wasm",
  tsx: "tree-sitter-wasms/out/tree-sitter-tsx.wasm",
  javascript: "tree-sitter-wasms/out/tree-sitter-javascript.wasm",
};

/** All three grammars share one query file; see code/queries/typescript. */
const QUERY_DIALECT: Record<SupportedLanguage, string> = {
  typescript: "typescript",
  tsx: "typescript",
  javascript: "typescript",
};

export function languageForPath(path: string): SupportedLanguage | undefined {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) return "tsx";
  if (lower.endsWith(".ts") || lower.endsWith(".mts") || lower.endsWith(".cts")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "javascript";
  return undefined;
}

let initialised: Promise<void> | undefined;
const languages = new Map<SupportedLanguage, Promise<LanguageInstance>>();
const queries = new Map<string, Promise<string>>();

async function init(): Promise<void> {
  initialised ??= Parser.init();
  return initialised;
}

export async function loadLanguage(language: SupportedLanguage): Promise<LanguageInstance> {
  await init();

  let loading = languages.get(language);
  if (!loading) {
    loading = Parser.Language.load(require.resolve(WASM_FILES[language]));
    languages.set(language, loading);
  }
  return loading;
}

export async function createParser(language: SupportedLanguage): Promise<ParserInstance> {
  const loaded = await loadLanguage(language);

  const parser = new Parser();
  parser.setLanguage(loaded);
  return parser;
}

export async function loadQuerySource(language: SupportedLanguage, name: string): Promise<string> {
  const key = `${QUERY_DIALECT[language]}/${name}`;

  let loading = queries.get(key);
  if (!loading) {
    loading = readFile(resolve(QUERY_DIR, `${key}.scm`), "utf8");
    queries.set(key, loading);
  }
  return loading;
}
