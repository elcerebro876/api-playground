# Security roadmap — Task D

Recorded from the Explorer proxy / diagnosis-pipeline audit. Task D runs **after**
Task B (deterministic 429) and Task C (explorer stacking). Each sub-task follows
`AGENTS.md` working rules: one change, one `npx tsc --noEmit`, stop for commit.

Priority order: D1–D3 (High), D4–D5 (Medium), D6–D7 (Low). D4 before D7 (shared
masking surface in `src/lib/diagnose.ts`).

## D1 — Pin validated IP to the connection (SSRF DNS-rebinding)
- **Finding:** `src/app/api/proxy/route.js:82` validates a resolved address, then
  `:114` lets `fetch` resolve again — a TTL-0 rebinding host returns a
  private/metadata IP on the second lookup.
- **Change:** Resolve once via `assertSafeTarget`, then pass an undici `Agent` as
  the `dispatcher` whose `connect.lookup` returns only the pre-validated address
  (re-asserting the private-range check at connect time). Keep `redirect:"manual"`
  so every hop re-validates.
- **Files:** `src/app/api/proxy/route.js`
- **Verify:** known-public host still works; `localhost`, `[::1]`,
  `169.254.169.254`, and a `.nip.io`/rebinding probe all fail.

## D2 — Trustworthy client IP for rate limiting
- **Finding:** `src/lib/rate-limit.ts:102-109` trusts client-controllable
  `x-real-ip` off-Vercel; first-XFF-entry on Vercel may be spoofable if the
  platform appends rather than overwrites.
- **Change:** First-entry XFF only while `process.env.VERCEL` is set. Off-Vercel,
  stop reading `x-real-ip` from the request: use a configured trusted-proxy header
  (`TRUSTED_PROXY`) or fall back to a single shared bucket. Document the trust
  assumption.
- **Files:** `src/lib/rate-limit.ts` (behavior inherited by
  `src/app/api/diagnose/route.ts:30-31`, `src/app/api/explain/route.ts:20-21`)
- **Verify:** unit-test `clientIp` with crafted headers → identical hash off-Vercel
  regardless of `x-real-ip`.

## D3 — Stop leaking full target URL to PostHog
- **Finding:** `src/app/page.tsx:502` sends the raw URL (query string included) to
  `trackToolUsed` → `src/lib/posthog.ts:20-22`.
- **Change:** Pass `maskUrlSecrets(u)` (exported, `src/lib/diagnose.ts:90`).
  Sanitize/truncate `e.message` before `captureServerError`
  (`diagnose/route.ts:106-107`, `explain/route.ts:108`). Decide on
  `autocapture: true` (`src/lib/posthog.ts:14`).
- **Files:** `src/app/page.tsx`, `src/app/api/diagnose/route.ts`,
  `src/app/api/explain/route.ts`, possibly `src/lib/posthog.ts`
- **Verify:** manual — a `?api_key=…` run yields `****` in the PostHog event.

## D4 — Close masking gaps
- **Finding:** `src/lib/diagnose.ts:108-113` (`maskSensitiveStrings`) and
  `:87-106` (`maskUrlSecrets`) miss bare JWTs, long hex/base64, `?jwt=`, `?code=`,
  `?sessionid=`, URL-path and userinfo secrets, and non-matching header names.
- **Change:** Add a value-shape pass (JWT `eyJ…`, ≥N-char hex/base64) to
  `maskSensitiveStrings`; extend `SECRET_QUERY_RE` (`jwt|code|sas|sig|session`);
  mask userinfo in `maskUrlSecrets`; add path-segment heuristics. Keep it
  deterministic so browser and route compute identical cache keys
  (`diagnose.ts:140-157` contract).
- **Files:** `src/lib/diagnose.ts`, `src/lib/diagnose.test.ts`
- **Verify:** new unit tests; existing cache-key parity test still passes.

## D5 — Rate-limit the proxy (open relay)
- **Finding:** `src/app/api/proxy/route.js:92-200` has no auth/limit.
- **Change:** Apply `rateLimit(await hashKey("proxy", clientIp(request)))` at the
  top of `POST`, mirroring `diagnose/route.ts:30-43` (429/503). Pick limits that
  don't break normal explorer use.
- **Files:** `src/app/api/proxy/route.js`
- **Verify:** manual burst → 429 after cap.

## D6 — `explanations` explicit revoke
- **Finding:** `db/schema.sql:4-19` enables RLS with no policies (deny-all) but
  never revokes anon/authenticated grants, unlike the other three tables.
- **Change:** Add
  `revoke all on table public.explanations from public, anon, authenticated;`
  in a **new** migration (migrations are already applied):
  `supabase/migrations/20261015_harden_explanations.sql`.
- **Files:** new `supabase/migrations/20261015_harden_explanations.sql`
- **Verify:** apply; confirm anon GET is denied.

## D7 — Header/hop-by-hop + userinfo (Low/Unknown)
- **Finding:** `src/app/api/proxy/route.js:106` forwards client headers verbatim;
  undici `Host` override behavior is unverified.
- **Change:** Strip hop-by-hop headers (`host`, `connection`, `transfer-encoding`,
  `te`, `upgrade`, `proxy-*`) before forwarding; add userinfo masking (overlaps
  D4).
- **Files:** `src/app/api/proxy/route.js`, `src/lib/diagnose.ts`
- **Verify:** targeted manual test against a local echo target.

## Decisions (resolved)
1. **Deployment target (D2): Vercel.** Keep first-entry XFF while
   `process.env.VERCEL` is set; off-Vercel fall back to a single shared bucket and
   never read client-supplied `x-real-ip`.
2. **D5 limits: separate, generous bucket.** Own namespace `proxy`, sized so
   normal explorer use is unaffected (distinct from the diagnosis/explain buckets).
3. **D3 autocapture: disable.** Set `autocapture: false` in `src/lib/posthog.ts`;
   keep only explicit events, and mask the explicit target URL.
