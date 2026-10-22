-- Harden public.explanations.
--
-- The table had RLS enabled with no policies (db/schema.sql) but no explicit
-- revoke/grant pattern like diagnosis_cache and global_daily_limits got in
-- 20261014_diagnose_cache_and_global_daily.sql. Server access uses the service
-- role key, so no client role needs any direct table privilege.

revoke all on table public.explanations from public, anon, authenticated;
grant select, insert, update, delete on table public.explanations to service_role;
