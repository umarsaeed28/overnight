# Overnight QA — Context Builder

Connects to a customer's code, docs and tickets with read-only access, reverse engineers
what the application does, and produces a **cited knowledge layer** that humans and
downstream QA agents can trust. Every factual claim carries a citation to a source chunk;
"not found in sources" is a valid answer.

The UI is three panes: **Explorer** (knowledge tree, sources, coverage, tests), **Viewer**
(knowledge files and source, with clickable citations), **Chat** (grounded Q&A and test
generation).

## Status

| Milestone | State |
|---|---|
| M1 Foundations | done |
| M2 Ingest (fixture + GitHub) | not started |
| M3 Knowledge | not started |
| M4 Chat | not started |
| M5 Coverage and tests | not started |
| M6 More connectors, incremental builds | not started |
| M7 Evals and hardening | not started |

## Layout

```
apps/web        Next.js UI (three-pane shell, Auth.js sign-in)
apps/api        Fastify API (auth, RLS, SSE, rate limits)
apps/worker     BullMQ pipeline processors            (M2)
packages/core   zod schemas, env validation, model roles, id helpers
packages/db     Drizzle schema, migrations, RLS policies, seed
packages/llm    Claude wrapper: forced tool use, caching, retries, cost, record/replay
prompts/        versioned prompt files with frontmatter
docs/           DECISIONS, BACKLOG, RUNBOOK
```

## Quick start

```bash
docker compose up -d          # postgres (pgvector), redis, minio
cp .env.example .env          # fill ENCRYPTION_KEY and AUTH_SECRET (see docs/RUNBOOK.md)
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test:unit          # no services needed; Claude responses are replayed from cassettes
pnpm test:integration   # needs Postgres 16 + pgvector (see docs/RUNBOOK.md)
```
