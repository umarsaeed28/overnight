import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Message, MessageCreateParamsNonStreaming, Transport } from "./transport.js";

const here = dirname(fileURLToPath(import.meta.url));
export const RECORDINGS_DIR = resolve(here, "../__recordings__");

/**
 * Request identity for record/replay (section 26). Everything that can change
 * the response is in the hash; nothing that cannot is, so an unrelated edit does
 * not invalidate the whole cassette directory.
 */
export function requestHash(params: MessageCreateParamsNonStreaming): string {
  const canonical = JSON.stringify({
    model: params.model,
    max_tokens: params.max_tokens,
    temperature: params.temperature ?? null,
    system: params.system ?? null,
    messages: params.messages,
    tools: params.tools ?? null,
    tool_choice: params.tool_choice ?? null,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export interface RecordingOptions {
  dir?: string;
  /** `RECORD=1` refreshes cassettes against the live API. */
  record?: boolean;
}

/**
 * Wraps a transport so unit tests replay recorded responses by request hash and
 * never touch the network. In record mode the live response is written back.
 */
export function recordingTransport(inner: Transport, options: RecordingOptions = {}): Transport {
  const dir = options.dir ?? RECORDINGS_DIR;
  const record = options.record ?? process.env.RECORD === "1";

  return {
    async create(params, callOptions) {
      const hash = requestHash(params);
      const file = join(dir, `${hash}.json`);

      if (!record) {
        let raw: string;
        try {
          raw = await readFile(file, "utf8");
        } catch {
          throw new Error(
            `No recorded Claude response for request ${hash}.\n` +
              `Re-record with: RECORD=1 ANTHROPIC_API_KEY=... pnpm test\n` +
              `Expected file: ${file}`,
          );
        }
        return (JSON.parse(raw) as { response: Message }).response;
      }

      const response = await inner.create(params, callOptions);
      await mkdir(dir, { recursive: true });
      await writeFile(
        file,
        `${JSON.stringify({ request: params, response }, null, 2)}\n`,
        "utf8",
      );
      return response;
    },

    async countTokens(params) {
      // Counting is deterministic enough to estimate offline; only the live path
      // consults the endpoint.
      if (!record) throw new Error("countTokens is not recorded; use the local estimate");
      return inner.countTokens(params);
    },
  };
}
