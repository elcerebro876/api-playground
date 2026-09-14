-- AI Explanation caching and build-idea storage for the Playground Discover section.
-- Run this in the Supabase SQL editor (or a migration) on the target project.

create table if not exists public.explanations (
  id uuid primary key default gen_random_uuid(),
  endpoint_url text not null unique,
  api_name text,
  target_users text,
  problem_solved text,
  request_action text,
  expected_outcome text,
  build_idea text,
  call_count integer not null default 1,
  last_requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Row-level security: the service role key bypasses RLS; no anon access needed.
alter table public.explanations enable row level security;