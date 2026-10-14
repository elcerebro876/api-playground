-- Harden default and remaining object privileges.
--
-- (a) Belt-and-suspenders for public.rate_limits: like diagnosis_cache it is
--     RLS-protected, but it predates the explicit revoke pattern. Server access
--     goes through the security-definer bump_rate_limit() RPC, so no client role
--     (and not even service_role) needs direct table privileges.
-- (b) Future-proofing: stop new functions in schema public from defaulting to
--     PUBLIC / anon / authenticated EXECUTE. Applies to objects created by the
--     role running this migration (postgres); repeat for any other creating role.

-- (a) rate_limits table: no direct client access.
revoke all on table public.rate_limits from public, anon, authenticated;

-- Re-assert EXECUTE lockdown on the existing RPCs (idempotent; also covers the
-- case where an earlier revoke was skipped).
revoke execute on function public.bump_rate_limit(text, int, int, int) from public, anon, authenticated;
revoke execute on function public.consume_global_daily(text, int) from public, anon, authenticated;
revoke execute on function public.cache_cleanup() from public, anon, authenticated;

-- (b) Default privileges for functions created by this role in schema public.
alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon, authenticated;
