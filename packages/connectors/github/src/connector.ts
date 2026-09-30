import { z } from "zod";
import {
  languageOf,
  type ConnectionResult,
  type Connector,
  type Cursor,
  type ItemRef,
  type RawItem,
  type SourceContext,
  type WebhookRequest,
} from "@oqa/connector-shared";
import { GithubClient } from "./api.js";
import { parseGithubWebhook } from "./webhook.js";

export const githubConfigSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  /** Defaults to the repository's own default branch at connect time. */
  branch: z.string().min(1),
  installationId: z.string().min(1).optional(),
  includePullRequests: z.boolean().default(true),
});
export type GithubConfig = z.infer<typeof githubConfigSchema>;

/** Section 8.2: blobs are fetched 50 at a time through GraphQL. */
export const BLOB_BATCH_SIZE = 50;
/** Section 8.2: the last 200 merged pull requests. */
export const MERGED_PR_LIMIT = 200;

interface TreeResponse {
  sha: string;
  truncated?: boolean;
  tree: { path: string; type: string; sha: string; size?: number }[];
}

interface CompareResponse {
  files?: { filename: string; status: string; sha: string; previous_filename?: string }[];
}

interface PullSummary {
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  updated_at: string;
  html_url: string;
  user?: { login?: string } | null;
  labels?: { name: string }[];
}

interface BlobNode {
  text: string | null;
  isBinary: boolean | null;
  byteSize: number | null;
}

function isBlobRef(ref: ItemRef): boolean {
  return ref.meta?.type !== "pull_request";
}

export interface GithubConnectorOptions {
  /** Builds a client for a source; the worker supplies the installation token. */
  clientFor: (src: SourceContext) => GithubClient | Promise<GithubClient>;
  webhookSecret?: string;
}

export class GithubConnector implements Connector {
  readonly kind = "github" as const;

  constructor(private readonly options: GithubConnectorOptions) {}

  validateConfig(config: unknown): GithubConfig {
    return githubConfigSchema.parse(config);
  }

  async testConnection(src: SourceContext): Promise<ConnectionResult> {
    const config = this.validateConfig(src.config);

    try {
      const client = await this.options.clientFor(src);
      await client.rest(`/repos/${config.owner}/${config.repo}`);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async *listItems(src: SourceContext, cursor?: Cursor): AsyncIterable<ItemRef> {
    const config = this.validateConfig(src.config);
    const client = await this.options.clientFor(src);
    const base = typeof cursor?.sha === "string" ? cursor.sha : undefined;

    if (base) {
      yield* this.#listChanged(client, config, base);
    } else {
      yield* this.#listTree(client, config);
    }

    if (config.includePullRequests) {
      yield* this.#listMergedPulls(client, config, base ? cursor : undefined);
    }
  }

  async *#listTree(client: GithubClient, config: GithubConfig): AsyncIterable<ItemRef> {
    const tree = await client.rest<TreeResponse>(
      `/repos/${config.owner}/${config.repo}/git/trees/${encodeURIComponent(config.branch)}?recursive=1`,
    );

    if (tree.truncated) {
      // The caller still gets what we have; the file cap would very likely
      // have cut this source anyway.
      console.warn(
        `GitHub truncated the tree for ${config.owner}/${config.repo}; some files were not listed`,
      );
    }

    for (const entry of tree.tree) {
      if (entry.type !== "blob") continue;

      yield {
        externalId: entry.path,
        pathOrUrl: entry.path,
        version: entry.sha,
        bytes: entry.size,
        meta: { type: "blob", oid: entry.sha },
      };
    }
  }

  async *#listChanged(
    client: GithubClient,
    config: GithubConfig,
    base: string,
  ): AsyncIterable<ItemRef> {
    const head = encodeURIComponent(config.branch);
    const comparison = await client.rest<CompareResponse>(
      `/repos/${config.owner}/${config.repo}/compare/${base}...${head}`,
    );

    for (const file of comparison.files ?? []) {
      const removed = file.status === "removed";
      // A rename removes the old path and adds the new one.
      if (file.status === "renamed" && file.previous_filename) {
        yield {
          externalId: file.previous_filename,
          pathOrUrl: file.previous_filename,
          version: file.sha,
          meta: { type: "blob", removed: true },
        };
      }

      yield {
        externalId: file.filename,
        pathOrUrl: file.filename,
        version: file.sha,
        meta: { type: "blob", oid: file.sha, ...(removed ? { removed: true } : {}) },
      };
    }
  }

  async *#listMergedPulls(
    client: GithubClient,
    config: GithubConfig,
    cursor?: Cursor,
  ): AsyncIterable<ItemRef> {
    const since = typeof cursor?.pullsUpdatedAt === "string" ? cursor.pullsUpdatedAt : undefined;
    let yielded = 0;

    for (let page = 1; yielded < MERGED_PR_LIMIT; page += 1) {
      const pulls = await client.rest<PullSummary[]>(
        `/repos/${config.owner}/${config.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}&base=${encodeURIComponent(config.branch)}`,
      );

      if (pulls.length === 0) return;

      for (const pull of pulls) {
        if (!pull.merged_at) continue;
        // The list is newest-updated first, so the first old one ends the scan.
        if (since && pull.updated_at <= since) return;

        yield {
          externalId: `pr/${pull.number}`,
          pathOrUrl: pull.html_url,
          version: pull.updated_at,
          meta: { type: "pull_request", number: pull.number },
        };

        yielded += 1;
        if (yielded >= MERGED_PR_LIMIT) return;
      }
    }
  }

  async fetchItem(src: SourceContext, ref: ItemRef): Promise<RawItem> {
    const [item] = await this.fetchBatch(src, [ref]);
    if (!item) throw new Error(`GitHub returned nothing for ${ref.externalId}`);
    return item;
  }

  /**
   * Batched because a repository is thousands of blobs and GitHub charges a
   * request each. Pull requests are fetched individually; there are at most
   * 200 of them.
   */
  async fetchBatch(src: SourceContext, refs: ItemRef[]): Promise<RawItem[]> {
    const config = this.validateConfig(src.config);
    const client = await this.options.clientFor(src);

    const blobs = refs.filter(isBlobRef);
    const pulls = refs.filter((ref) => !isBlobRef(ref));

    const items: RawItem[] = [];

    for (let i = 0; i < blobs.length; i += BLOB_BATCH_SIZE) {
      items.push(...(await this.#fetchBlobs(client, config, blobs.slice(i, i + BLOB_BATCH_SIZE))));
    }

    for (const ref of pulls) {
      items.push(await this.#fetchPull(client, config, ref));
    }

    return items;
  }

  async #fetchBlobs(
    client: GithubClient,
    config: GithubConfig,
    refs: ItemRef[],
  ): Promise<RawItem[]> {
    const fields = refs
      .map((ref, index) => {
        const oid = typeof ref.meta?.oid === "string" ? ref.meta.oid : ref.version;
        return `b${index}: object(oid: ${JSON.stringify(oid)}) { ... on Blob { text isBinary byteSize } }`;
      })
      .join("\n");

    const data = await client.graphql<{ repository: Record<string, BlobNode | null> }>(
      `query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          ${fields}
        }
      }`,
      { owner: config.owner, repo: config.repo },
    );

    return refs.flatMap((ref, index) => {
      const node = data.repository[`b${index}`];
      // GraphQL returns null text for binary blobs; the filter chain drops
      // them anyway, so there is nothing to store.
      if (!node || node.isBinary || node.text === null) return [];

      return [
        {
          externalId: ref.externalId,
          pathOrUrl: ref.pathOrUrl,
          title: ref.pathOrUrl,
          kind: "code" as const,
          language: languageOf(ref.pathOrUrl),
          version: ref.version,
          content: node.text,
          meta: { ...ref.meta, bytes: node.byteSize ?? undefined },
        },
      ];
    });
  }

  async #fetchPull(client: GithubClient, config: GithubConfig, ref: ItemRef): Promise<RawItem> {
    const number = ref.meta?.number ?? ref.externalId.replace("pr/", "");

    const [pull, files] = await Promise.all([
      client.rest<PullSummary>(`/repos/${config.owner}/${config.repo}/pulls/${number}`),
      client.rest<{ filename: string }[]>(
        `/repos/${config.owner}/${config.repo}/pulls/${number}/files?per_page=100`,
      ),
    ]);

    const paths = files.map((file) => file.filename);
    const content = [
      `# PR #${pull.number}: ${pull.title}`,
      pull.body?.trim() ? pull.body.trim() : "_No description._",
      "## Changed files",
      ...paths.map((path) => `- ${path}`),
    ].join("\n\n");

    return {
      externalId: ref.externalId,
      pathOrUrl: pull.html_url,
      title: `PR #${pull.number}: ${pull.title}`,
      // A merged PR describes intent, so it is read as a ticket, not as code.
      kind: "ticket",
      version: pull.updated_at,
      content,
      meta: {
        type: "pull_request",
        number: pull.number,
        author: pull.user?.login ?? null,
        labels: pull.labels?.map((label) => label.name) ?? [],
        mergedAt: pull.merged_at,
        changedPaths: paths,
      },
    };
  }

  async nextCursor(src: SourceContext): Promise<Cursor> {
    const config = this.validateConfig(src.config);
    const client = await this.options.clientFor(src);

    const commit = await client.rest<{ sha: string; commit: { committer?: { date?: string } } }>(
      `/repos/${config.owner}/${config.repo}/commits/${encodeURIComponent(config.branch)}`,
    );

    return { sha: commit.sha, pullsUpdatedAt: new Date().toISOString() };
  }

  async parseWebhook(req: WebhookRequest): Promise<{ sourceIds: string[]; refs: ItemRef[] }> {
    if (!this.options.webhookSecret) throw new Error("No GitHub webhook secret is configured");

    const parsed = parseGithubWebhook(this.options.webhookSecret, req);
    if (!parsed) return { sourceIds: [], refs: [] };

    // The caller resolves `owner/repo` (plus branch) to its own source ids.
    return { sourceIds: [parsed.repoFullName], refs: parsed.refs };
  }
}
