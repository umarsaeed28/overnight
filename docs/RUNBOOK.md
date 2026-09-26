# Runbook

Operational procedures. Filled in as milestones land (section 27).

## Local development

```bash
docker compose up -d          # postgres (pgvector), redis, minio
cp .env.example .env          # then fill ENCRYPTION_KEY and AUTH_SECRET
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev                      # web :3000, api :4000, worker
```

Generate the two required secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # AUTH_SECRET
```

## Run integration tests

Integration tests need a Postgres 16 with pgvector and pg_trgm. Either let
testcontainers start `pgvector/pgvector:0.8.0-pg16` (needs a container runtime), or
point them at a local server:

```bash
export TEST_DATABASE_URL=postgres://oqa@127.0.0.1:55432/postgres
pnpm test:integration
```

Each test file creates and drops its own database on that server, so it never touches
the development database.

On macOS without a container runtime, a throwaway Postgres 16 with pgvector built from
source:

```bash
brew install postgresql@16
git clone --branch v0.8.0 --depth 1 https://github.com/pgvector/pgvector
cd pgvector && make install PG_CONFIG=/opt/homebrew/opt/postgresql@16/bin/pg_config

export PATH=/opt/homebrew/opt/postgresql@16/bin:$PATH LC_ALL=C   # LC_ALL avoids
initdb -D /tmp/oqa-pgdata -U oqa --auth=trust                    # "postmaster became
pg_ctl -D /tmp/oqa-pgdata -o "-p 55432" -l /tmp/oqa-pg.log start # multithreaded"
```

## Replay a failed build

_Pending M2 (builds page and dead letter queues)._

## Rotate ENCRYPTION_KEY

_Pending M2 (credential sealing is exercised once connectors store tokens)._

## Reset a stuck queue

_Pending M2._

## Delete a workspace manually

_Pending M7 (deletion jobs)._
