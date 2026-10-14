-- Additive migration for the diagnose L2 cache and the global daily ceiling.
-- It does NOT touch the existing rate_limits table or bump_rate_limit() from
-- 20261009_rate_limit_backstop.sql; those stay as-is and keep serving per-IP
-- burst + daily limiting.

-- ---------------------------------------------------------------------------
-- L2 diagnosis cache: shared across instances so a repeat of the same failing
-- request resolves without a cold, per-instance AI call.
-- ---------------------------------------------------------------------------
create table if not exists public.diagnosis_cache (
  key text primary key,
  result jsonb not null,
  identifiable boolean not null default false,
  expires_at timestamptz not null
);

create index if not exists diagnosis_cache_expires_at_idx
  on public.diagnosis_cache (expires_at);

-- RLS on with no policies: only the security-definer function / service role
-- may touch the cache; anon/authenticated clients cannot read or write it.
alter table public.diagnosis_cache enable row level security;

revoke all on table public.diagnosis_cache from public, anon, authenticated;
grant select, insert, update, delete on table public.diagnosis_cache to service_role;

-- ---------------------------------------------------------------------------
-- Global daily ceiling: one shared counter across every client, so total
-- model spend per day is bounded regardless of how many distinct IPs appear.
-- ---------------------------------------------------------------------------
create table if not exists public.global_daily_limits (
  key text primary key,
  count int not null default 0,
  reset_at timestamptz not null
);

alter table public.global_daily_limits enable row level security;

revoke all on table public.global_daily_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.global_daily_limits to service_role;

-- consume_global_daily: atomically decide-and-count against max_count within a
-- UTC-day window. The upsert takes the row lock so concurrent callers serialise.
create or replace function public.consume_global_daily(
  k text,
  max_count int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  day_end timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc' + interval '1 day';
  row public.global_daily_limits%rowtype;
  allowed boolean;
  retry_after int;
begin
  -- Upsert that returns the current row (and takes its row lock). No-op update
  -- on conflict keeps the existing counter and window.
  insert into public.global_daily_limits (key, count, reset_at)
  values (k, 0, day_end)
  on conflict (key) do update set key = public.global_daily_limits.key
  returning * into row;

  -- Roll an expired window forward before deciding this request.
  if row.reset_at <= now_ts then
    row.count := 0;
    row.reset_at := day_end;
  end if;

  -- Decide BEFORE counting so a blocked request never reads as allowed once the
  -- counter pins at max.
  allowed := row.count < max_count;
  if allowed then
    row.count := row.count + 1;
  end if;

  update public.global_daily_limits
  set count = row.count,
      reset_at = row.reset_at
  where key = k;

  retry_after := greatest(
    ceil(extract(epoch from (row.reset_at - now_ts)))::int,
    1
  );

  return jsonb_build_object(
    'ok', allowed,
    'remaining', greatest(max_count - row.count, 0),
    'retry_after', retry_after
  );
end;
$$;

revoke execute on function public.consume_global_daily(text, int) from public, anon, authenticated;
grant execute on function public.consume_global_daily(text, int) to service_role;

-- ---------------------------------------------------------------------------
-- cache_cleanup: drop expired cache rows. Called opportunistically from the app.
-- ---------------------------------------------------------------------------
create or replace function public.cache_cleanup()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.diagnosis_cache where expires_at < now();
end;
$$;

revoke execute on function public.cache_cleanup() from public, anon, authenticated;
grant execute on function public.cache_cleanup() to service_role;
