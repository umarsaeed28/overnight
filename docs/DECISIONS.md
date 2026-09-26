# Decisions

Spec-silent choices, recorded per section 0 of the build spec.

## 2026-09-26

- **Node 24 tolerated locally, `engines: >=22`.** Spec calls for Node 22 LTS. The dev
  machine has 24.5.0; nothing in the stack needs 22 specifically, so `engines` allows
  `>=22` and CI pins 22. Reason: simplest option that keeps the spec's floor.
- **Package scope `@oqa/*`.** Spec names directories, not packages. Reason: short,
  collision-free, matches the `oqa` database user in the spec's config.
- **ESM everywhere (`"type": "module"`).** Reason: Next 15, Vitest, and the Anthropic
  SDK are all ESM-first; a single module system avoids dual-build tooling.
- **Packages consumed from source, not built `dist/`.** Internal packages export
  `./src/index.ts` directly and TypeScript path-maps resolve them. Reason: removes a
  build step from the inner dev loop; apps bundle or transpile at their own boundary.
- **Vitest projects `unit` and `integration` split by filename.** `*.integration.test.ts`
  runs only in the integration project. Reason: unit tests must stay runnable without
  Postgres, Redis, or MinIO.
- **`chunks.id` counter lives in its own table (`chunk_id_counters`).** Spec requires a
  per-workspace base36 counter but does not say where the counter is stored. Reason: a
  dedicated row per workspace can be locked with `for update` inside the chunk
  transaction, which keeps ids gapless and race-free.
- **RLS uses two Postgres roles, `oqa_migrator` and `oqa_app`.** Spec says migrations
  bypass RLS and the app role does not. Reason: role separation is the only way to make
  that difference enforceable and testable.
- **`current_setting('app.workspace_id', true)` (missing_ok) in policies.** Reason: a
  connection with no workspace set must return zero rows rather than raise, so a
  forgotten `set local` is a silent-empty bug caught by tests, not a 500.
- **The app pool selects `oqa_app` with the `-c role=` startup parameter,** not a
  `set role` after connecting. Reason: a post-connect `SET ROLE` leaves a window in
  which a query can run as the table owner and silently bypass RLS.
- **`workspaces` and `memberships` get a second policy arm keyed on `app.user_id`.**
  Reason: `GET /workspaces` has to run before any workspace is in scope, so strict
  `workspace_id = app_workspace_id()` would make the workspace list always empty.
- **`users` gets RLS too, scoped to self plus co-members of the workspace in scope.**
  Spec section 7 says only that `users` has no `workspace_id`. Reason: without a
  policy, any app connection could read every customer's email address.
- **Integration tests take `TEST_DATABASE_URL` when set and fall back to
  testcontainers.** Reason: the spec names testcontainers, but a container runtime is
  not always present on a dev machine; pointing at a local Postgres 16 with pgvector
  keeps the tests runnable either way. CI uses the container path.
- **Initial migration is hand-written SQL, not drizzle-kit generated.** Reason: the
  schema needs a generated `tsvector` column, a partial HNSW index, RLS policies, and
  role grants, none of which the Drizzle schema DSL can express. The Drizzle schema
  still defines every table for typed queries, and the runtime migrator applies the
  SQL through the normal journal.
