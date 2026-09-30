import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { documentKey, workspacePrefix } from "./keys.js";
import { ObjectStore } from "./store.js";

const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const bucket = `oqa-test-${randomUUID().slice(0, 8)}`;

const store = new ObjectStore({
  endpoint,
  region: process.env.S3_REGION ?? "us-east-1",
  bucket,
  accessKeyId: process.env.S3_ACCESS_KEY ?? "oqa",
  secretAccessKey: process.env.S3_SECRET_KEY ?? "oqasecret",
});

const workspaceId = randomUUID();
const sourceId = randomUUID();

beforeAll(async () => {
  await store.ensureBucket();
});

afterAll(async () => {
  await store.deletePrefix("");
});

describe("ObjectStore against MinIO", () => {
  it("creates the bucket idempotently", async () => {
    await expect(store.ensureBucket()).resolves.toBeUndefined();
  });

  it("round-trips document text", async () => {
    const key = documentKey({ workspaceId, sourceId, contentHash: "hash-a" });
    await store.putText(key, "export const CART_TTL_DAYS = 7;");

    await expect(store.getText(key)).resolves.toBe("export const CART_TTL_DAYS = 7;");
  });

  it("preserves non-ascii content", async () => {
    const key = documentKey({ workspaceId, sourceId, contentHash: "hash-utf8" });
    await store.putText(key, "prix : 12 € — déjà");

    await expect(store.getText(key)).resolves.toBe("prix : 12 € — déjà");
  });

  it("returns undefined for a key that is not there", async () => {
    await expect(store.getText(`${workspacePrefix(workspaceId)}missing`)).resolves.toBeUndefined();
    await expect(store.exists(`${workspacePrefix(workspaceId)}missing`)).resolves.toBe(false);
  });

  it("lists only the keys under a prefix", async () => {
    const otherWorkspace = randomUUID();
    await store.putText(documentKey({ workspaceId, sourceId, contentHash: "hash-b" }), "b");
    await store.putText(
      documentKey({ workspaceId: otherWorkspace, sourceId, contentHash: "hash-c" }),
      "c",
    );

    const keys: string[] = [];
    for await (const key of store.listKeys(workspacePrefix(workspaceId))) keys.push(key);

    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(keys.every((key) => key.startsWith(workspacePrefix(workspaceId)))).toBe(true);
  });

  it("deletes a whole workspace prefix and leaves other workspaces alone", async () => {
    const doomed = randomUUID();
    const survivor = randomUUID();

    await store.putText(documentKey({ workspaceId: doomed, sourceId, contentHash: "x" }), "x");
    await store.putText(documentKey({ workspaceId: survivor, sourceId, contentHash: "y" }), "y");

    const deleted = await store.deletePrefix(workspacePrefix(doomed));

    expect(deleted).toBe(1);
    await expect(
      store.getText(documentKey({ workspaceId: doomed, sourceId, contentHash: "x" })),
    ).resolves.toBeUndefined();
    await expect(
      store.getText(documentKey({ workspaceId: survivor, sourceId, contentHash: "y" })),
    ).resolves.toBe("y");
  });
});
