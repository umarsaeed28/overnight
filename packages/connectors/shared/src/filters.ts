import type { DocumentKind } from "@oqa/core";
import type { FilterLimits, FilterOutcome, ItemRef, SkipReason } from "./types.js";

/** Directory segments that never contain source worth reading. */
const EXCLUDED_DIRS = [
  "node_modules",
  "dist",
  "build",
  "out",
  ".next",
  "vendor",
  "bin",
  "obj",
  "coverage",
  ".git",
  "__pycache__",
];

const EXCLUDED_FILE_PATTERNS = [/\.min\.js$/i, /\.map$/i];

const LOCKFILE_NAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "poetry.lock",
  "Cargo.lock",
]);

const BINARY_EXTENSIONS = new Set([
  "png","jpg","jpeg","gif","bmp","ico","webp","avif","tiff",
  "pdf","zip","gz","tar","bz2","xz","7z","rar",
  "woff","woff2","ttf","otf","eot",
  "mp3","mp4","mov","avi","webm","wav","ogg",
  "so","dylib","dll","exe","class","jar","wasm","bin","dat",
  "pyc","pyo","o","a","lib","node",
  "xlsx","xls","docx","doc","pptx","ppt","sqlite","db",
]);

const GENERATED_MARKERS = ["@generated", "auto-generated", "DO NOT EDIT"];

const CONFIG_EXTENSIONS = new Set(["json", "yaml", "yml", "toml"]);
const DOC_EXTENSIONS = new Set(["md", "mdx", "rst", "txt"]);

const CONFIG_FILENAMES = new Set([
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env.example",
  "env.example",
  "makefile",
  "procfile",
]);

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export function basename(path: string): string {
  return segments(path).at(-1) ?? path;
}

export function extensionOf(path: string): string {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isExcludedPath(path: string): boolean {
  const parts = segments(path);
  // The last segment is the filename, so directory checks stop before it.
  if (parts.slice(0, -1).some((part) => EXCLUDED_DIRS.includes(part))) return true;
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(path));
}

export function isLockfile(path: string): boolean {
  const name = basename(path);
  return LOCKFILE_NAMES.has(name) || name.endsWith(".lock");
}

/** Binary by extension, or a null byte anywhere in the first 8 KB. */
export function isBinary(path: string, content: Buffer | string): boolean {
  if (BINARY_EXTENSIONS.has(extensionOf(path))) return true;

  const head = typeof content === "string" ? Buffer.from(content.slice(0, 8192)) : content.subarray(0, 8192);
  return head.includes(0);
}

export function isGenerated(content: string): boolean {
  const head = content.split("\n", 20).join("\n");
  return GENERATED_MARKERS.some((marker) => head.includes(marker));
}

/** Section 8.6 kind classification. Path-based; parsers may refine it later. */
export function classifyKind(path: string): DocumentKind {
  const name = basename(path).toLowerCase();
  const extension = extensionOf(path);
  const parts = segments(path);

  const inTestDir = parts.some(
    (part) => part === "tests" || part === "__tests__" || part === "e2e" || part === "cypress",
  );
  const testFilename = /\.(spec|test)\.[^.]+$/i.test(name);
  if (inTestDir || testFilename) return "test";

  if (
    CONFIG_EXTENSIONS.has(extension) ||
    CONFIG_FILENAMES.has(name) ||
    name.startsWith("dockerfile") ||
    parts.includes(".github")
  ) {
    return "config";
  }

  if (DOC_EXTENSIONS.has(extension)) return "doc";

  return "code";
}

/**
 * The per-item half of the filter chain. The file-count cap is a per-source
 * decision and lives in `prioritize`.
 */
export function filterItem(
  input: { path: string; content: Buffer | string; bytes: number },
  limits: Pick<FilterLimits, "maxFileBytes">,
): FilterOutcome {
  const skip = (reason: SkipReason): FilterOutcome => ({ keep: false, reason });

  if (isExcludedPath(input.path)) return skip("path_excluded");
  if (isLockfile(input.path)) return skip("lockfile");
  if (input.bytes > limits.maxFileBytes) return skip("too_large");
  if (isBinary(input.path, input.content)) return skip("binary");

  const text = typeof input.content === "string" ? input.content : input.content.toString("utf8");
  if (isGenerated(text)) return skip("generated");

  return { keep: true, kind: classifyKind(input.path) };
}

/**
 * Priority when a source has more files than we will read: routes, pages and
 * handlers first, then tests, then everything else shallowest first. Lower
 * sorts earlier.
 */
export function priorityOf(path: string): number {
  const lower = path.toLowerCase();
  const parts = segments(lower);

  const isRouteish =
    parts.includes("routes") ||
    parts.includes("route") ||
    parts.includes("pages") ||
    parts.includes("app") ||
    parts.includes("handlers") ||
    parts.includes("controllers") ||
    /\b(route|page|handler|controller)s?\.[^.]+$/.test(basename(lower));
  if (isRouteish) return 0;

  if (classifyKind(path) === "test") return 1;

  return 2;
}

export interface PrioritizeResult<T> {
  kept: T[];
  cut: T[];
}

/**
 * Keep at most `maxFilesPerSource` items. Ties inside a priority band break on
 * path depth ascending, then on path, so the cut is deterministic.
 */
export function prioritize<T extends Pick<ItemRef, "pathOrUrl">>(
  items: T[],
  limits: Pick<FilterLimits, "maxFilesPerSource">,
): PrioritizeResult<T> {
  const ordered = [...items].sort((a, b) => {
    const byPriority = priorityOf(a.pathOrUrl) - priorityOf(b.pathOrUrl);
    if (byPriority !== 0) return byPriority;

    const byDepth = segments(a.pathOrUrl).length - segments(b.pathOrUrl).length;
    if (byDepth !== 0) return byDepth;

    return a.pathOrUrl < b.pathOrUrl ? -1 : a.pathOrUrl > b.pathOrUrl ? 1 : 0;
  });

  return {
    kept: ordered.slice(0, limits.maxFilesPerSource),
    cut: ordered.slice(limits.maxFilesPerSource),
  };
}
