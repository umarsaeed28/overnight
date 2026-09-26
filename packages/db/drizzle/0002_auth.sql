-- Auth.js v5 storage (spec section 4 names Auth.js but section 7 does not model
-- its tables). Sessions are JWTs, so there is no sessions table: the API decodes
-- the session cookie directly with AUTH_SECRET.

alter table users add column email_verified timestamptz;
alter table users add column image text;

-- Microsoft Entra ID links. Magic-link sign-in creates no account row.
create table auth_accounts (
  user_id uuid not null references users on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,           -- epoch seconds; OAuth tokens are short lived
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);
create index auth_accounts_user_idx on auth_accounts (user_id);

create table auth_verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- Credentials, not tenant data. Only the web app's owner-role pool touches them,
-- so the app role gets nothing, and there is no RLS policy to get wrong.
revoke all on auth_accounts from oqa_app;
revoke all on auth_verification_tokens from oqa_app;
