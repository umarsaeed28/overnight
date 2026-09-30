import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { z } from "zod";
import {
  classifyKind,
  languageOf,
  type ConnectionResult,
  type Connector,
  type Cursor,
  type ItemRef,
  type RawItem,
  type SourceContext,
} from "@oqa/connector-shared";
import type { DocumentKind } from "@oqa/core";

/**
 * Reads a folder on disk as if it were a remote source, so the whole pipeline
 * can be exercised offline. `flavour` decides how the folder is interpreted:
 * a repository, a docs space, or a ticket project.
 */
export const fixtureConfigSchema = z.object({
  root: z.string().min(1),
  flavour: z.enum(["repo", "docs", "tickets"]),
  /** Shown in the UI and used as the breadcrumb prefix. */
  label: z.string().min(1).optional(),
});
export type FixtureConfig = z.infer<typeof fixtureConfigSchema>;

const ticketSchema = z.object({
  key: z.string().min(1),
  summary: z.string().min(1),
  type: z.string(),
  status: z.string(),
  priority: z.string().optional(),
  labels: z.array(z.string()).default([]),
  epic: z.string().nullable().optional(),
  reporter: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  description: z.string().default(""),
  acceptance_criteria: z.array(z.string()).default([]),
  links: z.array(z.object({ relation: z.string(), key: z.string() })).default([]),
});

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function* walk(root: string, current = root): AsyncGenerator<string> {
  const entries = await readdir(current, { withFileTypes: true });

  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) {
      yield* walk(root, full);
    } else if (entry.isFile()) {
      yield relative(root, full).split(sep).join("/");
    }
  }
}

function resolveRoot(config: FixtureConfig): string {
  return isAbsolute(config.root) ? config.root : resolve(process.cwd(), config.root);
}

function kindFor(config: FixtureConfig, path: string): DocumentKind {
  if (config.flavour === "tickets") return "ticket";
  if (config.flavour === "docs") return "doc";
  return classifyKind(path);
}

export class FixtureConnector implements Connector {
  readonly kind = "fixture" as const;

  validateConfig(config: unknown): FixtureConfig {
    return fixtureConfigSchema.parse(config);
  }

  async testConnection(src: SourceContext): Promise<ConnectionResult> {
    const config = this.validateConfig(src.config);
    const root = resolveRoot(config);

    try {
      const info = await stat(root);
      if (!info.isDirectory()) return { ok: false, error: `${root} is not a directory` };
    } catch {
      return { ok: false, error: `Cannot read ${root}` };
    }

    return { ok: true };
  }

  async *listItems(src: SourceContext, cursor?: Cursor): AsyncIterable<ItemRef> {
    const config = this.validateConfig(src.config);
    const root = resolveRoot(config);
    const since = typeof cursor?.mtime === "number" ? cursor.mtime : undefined;

    for await (const path of walk(root)) {
      if (config.flavour === "tickets" && !path.endsWith(".json")) continue;

      const info = await stat(join(root, path));
      // An incremental run only re-reads what changed on disk.
      if (since !== undefined && info.mtimeMs <= since) continue;

      const content = await readFile(join(root, path));

      yield {
        externalId: path,
        pathOrUrl: path,
        version: sha256(content.toString("utf8")).slice(0, 16),
        bytes: info.size,
        meta: { mtime: info.mtimeMs },
      };
    }
  }

  async fetchItem(src: SourceContext, ref: ItemRef): Promise<RawItem> {
    const config = this.validateConfig(src.config);
    const root = resolveRoot(config);
    const raw = await readFile(join(root, ref.externalId), "utf8");

    if (config.flavour === "tickets") return ticketItem(ref, raw);

    return {
      externalId: ref.externalId,
      pathOrUrl: ref.pathOrUrl,
      title: ref.pathOrUrl,
      kind: kindFor(config, ref.pathOrUrl),
      language: languageOf(ref.pathOrUrl),
      version: ref.version,
      content: raw,
      meta: { ...ref.meta, flavour: config.flavour },
    };
  }

  async nextCursor(src: SourceContext): Promise<Cursor> {
    const config = this.validateConfig(src.config);
    const root = resolveRoot(config);

    let newest = 0;
    for await (const path of walk(root)) {
      const info = await stat(join(root, path));
      newest = Math.max(newest, info.mtimeMs);
    }

    return { mtime: newest };
  }
}

/**
 * Ticket JSON becomes a ticket item whose meta carries the structured fields,
 * the same shape the Jira connector produces. Normalising to markdown is the
 * parser's job (section 10.4).
 */
function ticketItem(ref: ItemRef, raw: string): RawItem {
  const ticket = ticketSchema.parse(JSON.parse(raw));

  return {
    externalId: ticket.key,
    pathOrUrl: ref.pathOrUrl,
    title: `${ticket.key}: ${ticket.summary}`,
    kind: "ticket",
    version: ref.version,
    content: raw,
    meta: {
      key: ticket.key,
      summary: ticket.summary,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      labels: ticket.labels,
      epic: ticket.epic ?? null,
      reporter: ticket.reporter ?? null,
      assignee: ticket.assignee ?? null,
      created: ticket.created,
      updated: ticket.updated,
      description: ticket.description,
      acceptanceCriteria: ticket.acceptance_criteria,
      links: ticket.links,
    },
  };
}

export const fixtureConnector = new FixtureConnector();
