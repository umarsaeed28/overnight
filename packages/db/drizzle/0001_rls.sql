-- Row Level Security (spec section 7.1 and 23).
--
-- Two roles: the migration/owner role (whatever DATABASE_URL connects as) and
-- `oqa_app`. The API and worker pools `set role oqa_app` on connect, so they are
-- not the table owner and policies bind to them. Migrations and seeds stay as
-- the owner and bypass RLS.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'oqa_app') then
    create role oqa_app nologin;
  end if;
end
$$;

grant usage on schema public to oqa_app;
grant select, insert, update, delete on all tables in schema public to oqa_app;
grant usage, select on all sequences in schema public to oqa_app;
alter default privileges in schema public
  grant select, insert, update, delete on tables to oqa_app;
alter default privileges in schema public grant usage, select on sequences to oqa_app;

-- `missing_ok = true`: a connection that forgot `set local app.workspace_id`
-- must see zero rows rather than raise, so the mistake shows up as an empty
-- result in tests instead of a 500 in production.
create or replace function app_workspace_id() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.workspace_id', true), '')::uuid $$;

create or replace function app_user_id() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

-- Tables scoped by a plain `workspace_id` column.
do $$
declare
  t text;
  tables text[] := array[
    'sources','documents','symbols','chunks','chunk_id_counters','features',
    'knowledge_files','claims','conflicts','edges','coverage_links','test_cases',
    'chat_sessions','chat_messages','builds','job_events','validation_events',
    'llm_calls','eval_datasets','eval_runs','audit_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy workspace_isolation on %I using (workspace_id = app_workspace_id()) with check (workspace_id = app_workspace_id())',
      t
    );
  end loop;
end
$$;

-- `workspaces` is keyed by `id`, and the workspace list must be readable before
-- a workspace is selected, so membership is the second way in.
alter table workspaces enable row level security;
create policy workspace_isolation on workspaces
  using (
    id = app_workspace_id()
    or exists (
      select 1 from memberships m
      where m.workspace_id = workspaces.id and m.user_id = app_user_id()
    )
  );

-- A user can always see their own memberships; that is what GET /workspaces
-- reads before any workspace is in scope.
alter table memberships enable row level security;
create policy workspace_isolation on memberships
  using (workspace_id = app_workspace_id() or user_id = app_user_id())
  with check (workspace_id = app_workspace_id());

-- `users` has no workspace_id. Visibility is self plus co-members of the
-- workspace in scope, which is exactly what the members page needs.
alter table users enable row level security;
create policy user_visibility on users
  using (
    id = app_user_id()
    or exists (
      select 1 from memberships m
      where m.user_id = users.id and m.workspace_id = app_workspace_id()
    )
  );

-- Child tables without their own workspace_id inherit isolation through the
-- parent, whose own policy is enforced inside these subqueries.
alter table claim_citations enable row level security;
create policy workspace_isolation on claim_citations
  using (exists (select 1 from claims c where c.id = claim_citations.claim_id))
  with check (exists (select 1 from claims c where c.id = claim_citations.claim_id));

alter table eval_dataset_items enable row level security;
create policy workspace_isolation on eval_dataset_items
  using (exists (select 1 from eval_datasets d where d.id = eval_dataset_items.dataset_id))
  with check (exists (select 1 from eval_datasets d where d.id = eval_dataset_items.dataset_id));

alter table eval_results enable row level security;
create policy workspace_isolation on eval_results
  using (exists (select 1 from eval_runs r where r.id = eval_results.run_id))
  with check (exists (select 1 from eval_runs r where r.id = eval_results.run_id));
