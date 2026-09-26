-- Overnight QA initial schema (spec section 7).
-- Hand-written rather than drizzle-kit generated because it needs a generated
-- tsvector column, a partial HNSW index, and Row Level Security, none of which
-- the Drizzle schema DSL can express.

create extension if not exists vector;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- identity ---

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  monthly_llm_budget_usd numeric default 300,
  created_at timestamptz default now()
);

create table memberships (
  workspace_id uuid not null references workspaces on delete cascade,
  user_id uuid not null references users on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  primary key (workspace_id, user_id)
);

-- --------------------------------------------------- sources and documents ---

create table sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  kind text not null check (kind in ('github','ado_repo','ado_wiki','ado_boards','confluence','jira','fixture')),
  display_name text not null,
  config jsonb not null,
  credentials_enc bytea,
  status text not null default 'pending' check (status in ('pending','syncing','ready','error','paused')),
  cursor jsonb,
  last_synced_at timestamptz,
  last_error text
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  source_id uuid not null references sources on delete cascade,
  external_id text not null,
  path_or_url text not null,
  title text,
  kind text not null check (kind in ('code','doc','ticket','test','config')),
  language text,
  version text not null,
  content_hash text not null,
  s3_key text not null,
  bytes int,
  is_current boolean not null default true,
  skipped_reason text,
  updated_at timestamptz default now(),
  constraint documents_source_external_version_key unique (source_id, external_id, version)
);
create index documents_workspace_current_idx on documents (workspace_id, is_current);

create table symbols (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  document_id uuid not null references documents on delete cascade,
  kind text not null check (kind in ('route','page','component','handler','model','schema','flag','env_read','test','test_suite')),
  name text not null,
  signature text,
  line_start int,
  line_end int,
  meta jsonb
);
create index symbols_workspace_kind_idx on symbols (workspace_id, kind);

-- ------------------------------------------------------------------ chunks ---

create table chunks (
  id text primary key,
  workspace_id uuid not null,
  document_id uuid not null references documents on delete cascade,
  symbol_id uuid references symbols on delete set null,
  kind text not null check (kind in ('code','doc','ticket','test','config','knowledge')),
  breadcrumb text,
  line_start int,
  line_end int,
  section text,
  content text not null,
  summary text,
  token_count int not null,
  content_hash text not null,
  embedding vector(1024),
  embed_model text,
  tsv tsvector generated always as (
    to_tsvector('english', coalesce(breadcrumb,'') || ' ' || coalesce(summary,'') || ' ' || content)
  ) stored,
  feature_id uuid,
  is_current boolean not null default true
);
create index chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops) where is_current;
create index chunks_tsv_idx on chunks using gin (tsv);
create index chunks_breadcrumb_trgm_idx on chunks using gin (breadcrumb gin_trgm_ops);
create index chunks_workspace_document_idx on chunks (workspace_id, document_id);

-- Per-workspace base36 counter behind chunk ids. Locked `for update` while
-- allocating so ids stay gapless under concurrent chunk jobs (section 7.2).
create table chunk_id_counters (
  workspace_id uuid primary key references workspaces on delete cascade,
  next_value int not null default 0
);

-- --------------------------------------------------- features and knowledge ---

create table features (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  slug text not null,
  title text not null,
  description text,
  origin text not null default 'auto' check (origin in ('auto','human')),
  human_override jsonb,
  constraint features_workspace_slug_key unique (workspace_id, slug)
);

create table knowledge_files (
  id text not null,
  workspace_id uuid not null,
  type text not null check (type in ('overview','feature','flow','api','data_model','rules','coverage','glossary','conflicts')),
  path text not null,
  title text not null,
  feature_id uuid references features on delete set null,
  body_json jsonb not null,
  rendered_md text not null,
  criticality text,
  input_hash text not null,
  prompt_version text not null,
  model text not null,
  build_id uuid,
  built_at timestamptz default now(),
  primary key (workspace_id, id)
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  knowledge_file_id text not null,
  section text not null,
  ordinal int not null,
  text text not null,
  kind text not null check (kind in ('stated','derived','inferred')),
  status text not null default 'active' check (status in ('active','dropped','confirmed','rejected')),
  status_reason text,
  status_by uuid references users,
  stable_key text not null
);
create index claims_workspace_file_idx on claims (workspace_id, knowledge_file_id);
create index claims_workspace_stable_key_idx on claims (workspace_id, stable_key);

create table claim_citations (
  claim_id uuid not null references claims on delete cascade,
  chunk_id text not null,
  support text check (support in ('yes','partial')),
  primary key (claim_id, chunk_id)
);

create table conflicts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  knowledge_file_id text not null,
  description text not null,
  doc_chunk_ids text[] not null,
  code_chunk_ids text[] not null,
  status text default 'open' check (status in ('open','acknowledged','resolved','not_a_conflict'))
);

-- ------------------------------------------------------------------- graph ---

create table edges (
  workspace_id uuid not null,
  from_type text not null,
  from_id text not null,
  rel text not null check (rel in ('implements','tested_by','documented_in','tracked_by','calls','renders','reads','writes','part_of')),
  to_type text not null,
  to_id text not null,
  weight real default 1,
  evidence_chunk_ids text[],
  primary key (workspace_id, from_type, from_id, rel, to_type, to_id)
);

-- -------------------------------------------------------- coverage and tests ---

create table coverage_links (
  workspace_id uuid not null,
  flow_id text not null,
  test_symbol_id uuid not null,
  step_ordinals int[],
  confidence real not null,
  method text not null check (method in ('route_match','selector_match','semantic')),
  primary key (workspace_id, flow_id, test_symbol_id)
);

create table test_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  flow_id text not null,
  title text not null,
  focus text not null check (focus in ('happy_path','edge_cases','negative','regression_for_conflict')),
  preconditions jsonb not null,
  steps jsonb not null,
  expected jsonb not null,
  priority text not null check (priority in ('p0','p1','p2','p3')),
  source_claim_ids uuid[] not null,
  needs_confirmation boolean not null default false,
  playwright_spec text,
  compile_status text check (compile_status in ('passed','failed')),
  compile_error text,
  status text not null default 'draft' check (status in ('draft','approved','rejected')),
  status_reason text,
  status_by uuid references users,
  created_at timestamptz default now()
);
create index test_cases_workspace_flow_idx on test_cases (workspace_id, flow_id);

-- -------------------------------------------------------------------- chat ---

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references users,
  title text,
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  session_id uuid not null references chat_sessions on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  content jsonb not null,
  citations jsonb,
  confidence text check (confidence in ('high','medium','low','not_found')),
  feedback text check (feedback in ('up','down')),
  feedback_note text,
  created_at timestamptz default now()
);
create index chat_messages_session_idx on chat_messages (workspace_id, session_id, created_at);

-- -------------------------------------------------------- builds and jobs ---

create table builds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  mode text not null check (mode in ('full','incremental')),
  trigger text not null check (trigger in ('manual','webhook','schedule')),
  status text not null check (status in ('queued','running','succeeded','failed','partial')),
  stats jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  error text
);
create index builds_workspace_started_idx on builds (workspace_id, started_at desc);

create table job_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  build_id uuid,
  stage text not null,
  status text not null,
  item_ref text,
  message text,
  created_at timestamptz default now()
);
create index job_events_build_idx on job_events (workspace_id, build_id, created_at);

create table validation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  build_id uuid,
  knowledge_file_id text,
  claim_text text not null,
  reason text not null,
  created_at timestamptz default now()
);

-- --------------------------------------------------------- llm accounting ---

create table llm_calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  build_id uuid,
  purpose text not null,
  prompt_id text not null,
  prompt_version text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  cache_read_tokens int,
  cache_write_tokens int,
  cost_usd numeric(10,5),
  latency_ms int,
  status text,
  error text,
  created_at timestamptz default now()
);
create index llm_calls_workspace_created_idx on llm_calls (workspace_id, created_at desc);

-- ------------------------------------------------------------------- evals ---

create table eval_datasets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  suite text not null,
  version int not null,
  frozen_at timestamptz,
  item_count int,
  constraint eval_datasets_workspace_suite_version_key unique (workspace_id, suite, version)
);

create table eval_dataset_items (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references eval_datasets on delete cascade,
  input jsonb not null,
  expected jsonb not null,
  origin text not null check (origin in ('generated','human'))
);

create table eval_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  suite text not null,
  dataset_id uuid,
  git_sha text,
  prompt_versions jsonb,
  models jsonb,
  metrics jsonb,
  passed boolean,
  created_at timestamptz default now()
);

create table eval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references eval_runs on delete cascade,
  item_id uuid,
  actual jsonb,
  scores jsonb,
  notes text
);

-- ------------------------------------------------------------------- audit ---

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  user_id uuid,
  action text not null,
  target text,
  meta jsonb,
  created_at timestamptz default now()
);
