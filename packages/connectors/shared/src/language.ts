import { basename, extensionOf } from "./filters.js";

const BY_EXTENSION: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  cs: "csharp",
  java: "java",
  go: "go",
  rb: "ruby",
  php: "php",
  rs: "rust",
  kt: "kotlin",
  swift: "swift",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  css: "css",
  scss: "scss",
  html: "html",
  vue: "vue",
  svelte: "svelte",
  md: "markdown",
  mdx: "markdown",
  rst: "restructuredtext",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  prisma: "prisma",
  graphql: "graphql",
  gql: "graphql",
};

const BY_FILENAME: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "make",
};

/** Best-effort language label for a path. `undefined` when we cannot tell. */
export function languageOf(path: string): string | undefined {
  const name = basename(path).toLowerCase();
  if (name in BY_FILENAME) return BY_FILENAME[name];
  if (name.startsWith("dockerfile")) return "dockerfile";

  return BY_EXTENSION[extensionOf(path)];
}
