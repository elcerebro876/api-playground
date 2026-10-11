-- Server-side AI-cost backstop: shared Postgres rate-limit counters for
-- /api/diagnose and /api/explain, keyed by client IP. Applied as an atomic
-- single-statement bump inside one function so concurrent requests cannot both
-- slip past the caps (the row lock serialises them).

create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 0,
  daily_count int not null default 0,
  burst_reset_at timestamptz not null,
  daily_reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- RLS on with no policies: only the security-definer function below can touch
-- the table; anon/authenticated clients cannot read or write counters directly.
alter table public.rate_limits enable row level security;

create or replace function public.bump_rate_limit(
  k text,
  burst_max int,
  burst_window_secs int,
  daily_max int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.rate_limits%rowtype;
  now_ts timestamptz := now();
  allowed boolean;
  retry_after int;
begin
  -- Upsert that returns the current row (and takes its row lock). No-op update
  -- on conflict keeps the existing counters and windows.
  insert into public.rate_limits (key, count, daily_count, burst_reset_at, daily_reset_at)
  values (
    k,
    0,
    0,
    now_ts + make_interval(secs => burst_window_secs),
    now_ts + make_interval(secs => 86400)
  )
  on conflict (key) do update set key = public.rate_limits.key
  returning * into b;

  -- Roll an expired window forward before deciding this request.
  if b.burst_reset_at <= now_ts then
    b.count := 0;
    b.burst_reset_at := now_ts + make_interval(secs => burst_window_secs);
  end if;
  if b.daily_reset_at <= now_ts then
    b.daily_count := 0;
    b.daily_reset_at := now_ts + make_interval(secs => 86400);
  end if;

  -- Decide BEFORE counting: a request may only pass when its window has
  -- headroom (max is inclusive), and the decision must not depend on the
  -- post-increment value or a blocked request would read as "allowed" once
  -- the counter pinned at max.
  allowed := b.count < burst_max and b.daily_count < daily_max;
  if allowed then
    b.count := b.count + 1;
    b.daily_count := b.daily_count + 1;
  end if;

  update public.rate_limits
  set count = b.count,
      daily_count = b.daily_count,
      burst_reset_at = b.burst_reset_at,
      daily_reset_at = b.daily_reset_at,
      updated_at = now_ts
  where key = k;

  -- Retry-After: once the blocker (burst and/or daily) rolls forward.
  if b.count >= burst_max and b.daily_count >= daily_max then
    retry_after := greatest(
      ceil(extract(epoch from (b.burst_reset_at - now_ts)))::int,
      ceil(extract(epoch from (b.daily_reset_at - now_ts)))::int
    );
  elsif b.count >= burst_max then
    retry_after := ceil(extract(epoch from (b.burst_reset_at - now_ts)))::int;
  else
    retry_after := ceil(extract(epoch from (b.daily_reset_at - now_ts)))::int;
  end if;

  return jsonb_build_object(
    'ok',
    allowed,
    'remaining',
    greatest(burst_max - b.count, 0),
    'retry_after',
    greatest(retry_after, 1)
  );
end;
$$;

-- Only the server's service-role key may execute the function, not anon/authenticated.
revoke execute on function public.bump_rate_limit(text, int, int, int) from public, anon, authenticated;
grant execute on function public.bump_rate_limit(text, int, int, int) to service_role;