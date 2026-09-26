import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { MODEL_ROLES, type ModelRole } from "@oqa/core/models";

/**
 * Prompt frontmatter. Every prompt carries an id and a version, and both are
 * logged on every call so an eval run can be tied back to exact prompt text
 * (principle 9).
 */
const frontmatterSchema = z.object({
  id: z.string().min(1),
  version: z.coerce.number().int().positive(),
  model_role: z.enum(MODEL_ROLES),
  max_input_tokens: z.coerce.number().int().positive().optional(),
  max_tokens: z.coerce.number().int().positive(),
});

export interface Prompt {
  id: string;
  version: number;
  /** `extract@1`, the value written to `llm_calls.prompt_version`. */
  versionTag: string;
  modelRole: ModelRole;
  maxInputTokens: number | undefined;
  maxTokens: number;
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Deliberately not a YAML parser: prompt frontmatter is a flat list of scalars,
 * and a real YAML dependency would invite structure the loader does not support.
 */
export function parseFrontmatter(source: string): { data: Record<string, string>; body: string } {
  const match = FRONTMATTER_RE.exec(source);
  if (!match) return { data: {}, body: source };

  const data: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) throw new Error(`Malformed prompt frontmatter line: ${line}`);
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
    data[key] = value;
  }

  return { data, body: source.slice(match[0].length).trimStart() };
}

export function parsePrompt(source: string, expectedId?: string): Prompt {
  const { data, body } = parseFrontmatter(source);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid prompt frontmatter${expectedId ? ` in ${expectedId}` : ""}: ${issues}`);
  }
  if (expectedId && parsed.data.id !== expectedId) {
    throw new Error(`Prompt file ${expectedId}.md declares id "${parsed.data.id}"`);
  }
  if (body.trim().length === 0) {
    throw new Error(`Prompt ${parsed.data.id} has no body`);
  }

  return {
    id: parsed.data.id,
    version: parsed.data.version,
    versionTag: `${parsed.data.id}@${parsed.data.version}`,
    modelRole: parsed.data.model_role,
    maxInputTokens: parsed.data.max_input_tokens,
    maxTokens: parsed.data.max_tokens,
    body,
  };
}

const here = dirname(fileURLToPath(import.meta.url));
export const PROMPTS_DIR = resolve(here, "../../../prompts");

const cache = new Map<string, Prompt>();

/** Prompts are immutable at runtime, so one read per process is enough. */
export async function loadPrompt(id: string, dir = PROMPTS_DIR): Promise<Prompt> {
  const key = `${dir}:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const source = await readFile(join(dir, `${id}.md`), "utf8");
  const prompt = parsePrompt(source, id);
  cache.set(key, prompt);
  return prompt;
}

export function clearPromptCache(): void {
  cache.clear();
}

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

/**
 * Fills `{{name}}` placeholders. Throws on an unknown or missing placeholder:
 * a prompt silently containing the literal `{{count}}` is a prompt bug that
 * would otherwise only show up as a bad model response.
 */
export function renderPrompt(body: string, values: Record<string, string | number> = {}): string {
  const missing: string[] = [];
  const rendered = body.replace(PLACEHOLDER_RE, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) {
      missing.push(name);
      return "";
    }
    return String(value);
  });

  if (missing.length > 0) {
    throw new Error(`Prompt is missing values for: ${[...new Set(missing)].join(", ")}`);
  }
  return rendered;
}
