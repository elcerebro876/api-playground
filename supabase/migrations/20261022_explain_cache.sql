-- Shared cache for the Explorer explainer. Rows hold only the three generated
-- sections ({who, what, build}); credentialed requests never read or write it,
-- so there is no credentialed column. Expired rows are ignored on read.

create table if not exists public.explain_cache (
  key text primary key,
  result jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  call_count int not null default 0
);

create index if not exists explain_cache_expires_at_idx
  on public.explain_cache (expires_at);

alter table public.explain_cache enable row level security;

revoke all on table public.explain_cache from public, anon, authenticated;
grant select, insert, update, delete on table public.explain_cache to service_role;
