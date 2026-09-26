import { applyTestEnv } from "@oqa/core/testing";
import { schema } from "@oqa/db";
import { createTestDatabase, type TestDatabase } from "@oqa/db/testing";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { SessionUser } from "./plugins/auth.js";
import { API_PREFIX, buildServer } from "./server.js";

applyTestEnv();

let db: TestDatabase;
let app: FastifyInstance;

/** Swapped per test to act as a different signed-in user. */
let currentUser: SessionUser | null = null;

const users = {
  alpha: { id: "", email: "alpha@example.com" },
  beta: { id: "", email: "beta@example.com" },
  viewer: { id: "", email: "viewer@example.com" },
};
let alphaWorkspace = "";
let betaWorkspace = "";

const get = (url: string) => app.inject({ method: "GET", url: `${API_PREFIX}${url}` });
const post = (url: string, payload?: unknown) =>
  app.inject({ method: "POST", url: `${API_PREFIX}${url}`, payload });
const patch = (url: string, payload?: unknown) =>
  app.inject({ method: "PATCH", url: `${API_PREFIX}${url}`, payload });
const del = (url: string) => app.inject({ method: "DELETE", url: `${API_PREFIX}${url}` });

beforeAll(async () => {
  db = await createTestDatabase("api");

  const inserted = await db.admin
    .insert(schema.users)
    .values([
      { email: users.alpha.email },
      { email: users.beta.email },
      { email: users.viewer.email },
    ])
    .returning({ id: schema.users.id, email: schema.users.email });
  for (const row of inserted) {
    const key = Object.keys(users).find(
      (k) => users[k as keyof typeof users].email === row.email,
    ) as keyof typeof users;
    users[key].id = row.id;
  }

  const workspaces = await db.admin
    .insert(schema.workspaces)
    .values([
      { name: "Alpha App", slug: "alpha-app" },
      { name: "Beta App", slug: "beta-app" },
    ])
    .returning({ id: schema.workspaces.id, slug: schema.workspaces.slug });
  alphaWorkspace = workspaces.find((w) => w.slug === "alpha-app")!.id;
  betaWorkspace = workspaces.find((w) => w.slug === "beta-app")!.id;

  await db.admin.insert(schema.memberships).values([
    { workspaceId: alphaWorkspace, userId: users.alpha.id, role: "owner" },
    { workspaceId: alphaWorkspace, userId: users.viewer.id, role: "viewer" },
    { workspaceId: betaWorkspace, userId: users.beta.id, role: "owner" },
  ]);

  const [source] = await db.admin
    .insert(schema.sources)
    .values({
      workspaceId: alphaWorkspace,
      kind: "fixture",
      displayName: "ShopDemo fixture",
      config: { root: "fixtures/shopdemo" },
      status: "ready",
    })
    .returning({ id: schema.sources.id });

  await db.admin.insert(schema.documents).values({
    workspaceId: alphaWorkspace,
    sourceId: source!.id,
    externalId: "app/page.tsx",
    pathOrUrl: "app/page.tsx",
    kind: "code",
    version: "sha1",
    contentHash: "hash1",
    s3Key: "alpha/app/page.tsx",
  });

  app = await buildServer({
    db: db.app,
    adminDb: db.admin,
    verifySession: async () => currentUser,
    logger: false,
    rateLimit: false,
  });
});

afterAll(async () => {
  await app?.close();
  await db?.close();
});

beforeEach(() => {
  currentUser = users.alpha;
});

describe("auth", () => {
  it("serves health without a session", async () => {
    currentUser = null;
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
  });

  it("rejects an unauthenticated API request with the standard error shape", async () => {
    currentUser = null;
    const response = await get("/workspaces");

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: "unauthorized", message: "Sign in to continue." },
    });
  });

  it("sets restrictive security headers", async () => {
    const response = await get("/workspaces");
    expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("GET /workspaces", () => {
  it("lists only the caller's workspaces, with their role", async () => {
    const response = await get("/workspaces");
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.workspaces).toHaveLength(1);
    expect(body.workspaces[0]).toMatchObject({
      id: alphaWorkspace,
      name: "Alpha App",
      slug: "alpha-app",
      role: "owner",
      monthly_llm_budget_usd: 300,
    });
  });

  it("shows a different user a different list", async () => {
    currentUser = users.beta;
    const body = (await get("/workspaces")).json();
    expect(body.workspaces.map((w: { slug: string }) => w.slug)).toEqual(["beta-app"]);
  });
});

describe("POST /workspaces", () => {
  it("creates a workspace with the caller as owner", async () => {
    currentUser = users.beta;
    const response = await post("/workspaces", { name: "Checkout Service" });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ slug: "checkout-service", role: "owner" });

    const list = (await get("/workspaces")).json();
    expect(list.workspaces.map((w: { slug: string }) => w.slug)).toContain("checkout-service");
  });

  it("disambiguates a duplicate name instead of failing", async () => {
    currentUser = users.beta;
    const again = await post("/workspaces", { name: "Checkout Service" });
    expect(again.json().slug).toBe("checkout-service-2");
  });

  it("rejects an empty name", async () => {
    const response = await post("/workspaces", { name: "" });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("bad_request");
  });

  it("writes an audit log row", async () => {
    currentUser = users.beta;
    await post("/workspaces", { name: "Audited Workspace" });

    const rows = await db.admin.select().from(schema.auditLog);
    expect(rows.some((r) => r.action === "workspace.create")).toBe(true);
  });
});

describe("GET /workspaces/:ws", () => {
  it("returns the workspace with its source summary", async () => {
    const response = await get(`/workspaces/${alphaWorkspace}`);
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.workspace.slug).toBe("alpha-app");
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0]).toMatchObject({
      kind: "fixture",
      status: "ready",
      document_count: 1,
    });
  });

  it("returns 404, not 403, for another tenant's workspace id", async () => {
    const response = await get(`/workspaces/${betaWorkspace}`);
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("not_found");
  });

  it("returns 404 for a workspace that does not exist", async () => {
    const response = await get("/workspaces/00000000-0000-0000-0000-000000000000");
    expect(response.statusCode).toBe(404);
  });

  it("rejects a malformed workspace id", async () => {
    const response = await get("/workspaces/not-a-uuid");
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("bad_request");
  });
});

describe("members", () => {
  it("lists members with their roles", async () => {
    const body = (await get(`/workspaces/${alphaWorkspace}/members`)).json();
    expect(body.members).toEqual([
      { user_id: users.alpha.id, email: users.alpha.email, name: null, role: "owner" },
      { user_id: users.viewer.id, email: users.viewer.email, name: null, role: "viewer" },
    ]);
  });

  it("lets an owner change a role", async () => {
    const response = await patch(
      `/workspaces/${alphaWorkspace}/members/${users.viewer.id}`,
      { role: "editor" },
    );
    expect(response.statusCode).toBe(200);
    expect(response.json().role).toBe("editor");
  });

  it("refuses a viewer trying to change roles", async () => {
    currentUser = users.viewer;
    const response = await patch(
      `/workspaces/${alphaWorkspace}/members/${users.alpha.id}`,
      { role: "viewer" },
    );
    expect(response.statusCode).toBe(403);
    expect(response.json().error.message).toContain("owner role");
  });

  it("refuses to remove the only owner", async () => {
    const response = await del(`/workspaces/${alphaWorkspace}/members/${users.alpha.id}`);
    expect(response.statusCode).toBe(409);
    expect(response.json().error.message).toContain("only owner");
  });

  it("removes a non-owner member", async () => {
    const response = await del(`/workspaces/${alphaWorkspace}/members/${users.viewer.id}`);
    expect(response.statusCode).toBe(204);

    const body = (await get(`/workspaces/${alphaWorkspace}/members`)).json();
    expect(body.members).toHaveLength(1);
  });

  it("cannot reach another tenant's members", async () => {
    const response = await get(`/workspaces/${betaWorkspace}/members`);
    expect(response.statusCode).toBe(404);
  });
});
