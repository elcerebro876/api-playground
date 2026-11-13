# Graph Report - api-playground  (2026-11-13)

## Corpus Check
- 66 files · ~131,499 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 523 nodes · 1016 edges · 28 communities (22 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc3f8012`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- devDependencies
- compilerOptions
- dependencies
- ai.ts
- diagnose.ts
- LoadingState.tsx
- layout.tsx
- README.md
- This is NOT the Next.js you know
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- route.js
- explain-route.ts
- storage.ts
- explain-candidates.ts
- postman.ts
- MainContent
- ExplainStrip
- curl.ts
- Security roadmap — Task D
- explain-eligibility.ts
- storage-saved-explains.test.ts
- proxy-client.ts
- icons.tsx
- methodBadgeStyle

## God Nodes (most connected - your core abstractions)
1. `Home()` - 37 edges
2. `MainContent()` - 20 edges
3. `callAIJson()` - 17 edges
4. `POST()` - 16 edges
5. `compilerOptions` - 16 edges
6. `handleExplain()` - 14 edges
7. `buildCandidates()` - 13 edges
8. `explainCacheKey()` - 11 edges
9. `parsePostmanCollection()` - 11 edges
10. `getSupabase()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PostmanImportModal()` --indirect_call--> `key()`  [INFERRED]
  src/app/page.tsx → src/lib/explain-key.test.ts
- `parsePostmanCollection()` --indirect_call--> `key()`  [INFERRED]
  src/lib/postman.ts → src/lib/explain-key.test.ts
- `GET()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts
- `POST()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts
- `POST()` --calls--> `buildDiagnosisInput()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/diagnose.ts

## Import Cycles
- None detected.

## Communities (28 total, 6 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.04
Nodes (14): cardContentVariants, cardItemVariants, cardTextSpring, commonKeys, CurlState, demoRequests, ExplainStripState, headersPanelTransition (+6 more)

### Community 1 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (28): framer-motion, next, dependencies, framer-motion, next, posthog-js, posthog-node, react (+20 more)

### Community 4 - "ai.ts"
Cohesion: 0.14
Nodes (26): GET(), AIJsonOptions, breakerAllows(), breakerCooldownMs(), breakerRecordFailure(), breakerRecordSuccess(), breakers, BreakerState (+18 more)

### Community 5 - "diagnose.ts"
Cohesion: 0.07
Nodes (40): AUTH_HINTS_LAST_REVIEWED, AuthHint, authHintForUrl(), ExpectedAuth, HINTS, applyAuthGuards(), buildDiagnosisInput(), DIAGNOSIS_BODY_LIMIT (+32 more)

### Community 6 - "LoadingState.tsx"
Cohesion: 0.33
Nodes (6): chevron, LoadingState(), orbit, ORBIT_ORDER, PATTERNS, useElapsed()

### Community 7 - "layout.tsx"
Cohesion: 0.32
Nodes (5): geistMono, geistSans, metadata, PostHogInit(), initPostHog()

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 13 - "route.js"
Cohesion: 0.11
Nodes (25): ALLOWED_METHODS, POST(), safeLookup(), PROXY_ERROR_MESSAGES, ProxyError, proxyErrorResponse(), targetSuccessResponse(), CODES (+17 more)

### Community 14 - "explain-route.ts"
Cohesion: 0.07
Nodes (51): POST(), POST(), onRequestError(), CacheEntry, cacheGet(), cacheGetFromStore(), cachePut(), lru (+43 more)

### Community 16 - "storage.ts"
Cohesion: 0.09
Nodes (40): Home(), isDiagnosableErrorBody(), parseRetryAfter(), applyStreakOnLoad(), CachedExplainRecord, CardTestMap, CardTestRecord, DEFAULTS (+32 more)

### Community 17 - "explain-candidates.ts"
Cohesion: 0.11
Nodes (27): sameOrigin(), SECRET_HEADER_RE, SECRET_QUERY_RE, asToken(), buildCandidates(), Candidate, CandidateInput, CandidateSource (+19 more)

### Community 18 - "postman.ts"
Cohesion: 0.18
Nodes (25): PostmanImportModal(), asString(), bodyFromRequest(), collectFolder(), folderFits(), hasUnresolvedVariables(), headersFromRequest(), isRecord() (+17 more)

### Community 19 - "MainContent"
Cohesion: 0.13
Nodes (18): BrowseApiSection(), buildCardRequest(), cardBodyPreview(), curlErrorCopy(), explainKeyFor(), ExplainPopupPreview(), extractAuthScheme(), fallbackHintText() (+10 more)

### Community 20 - "ExplainStrip"
Cohesion: 0.19
Nodes (10): ExplainStrip(), formatFreshness(), formatSavedAge(), NOW, AnalyticsEvent, track(), trackToolUsed(), explainDayKey() (+2 more)

### Community 21 - "curl.ts"
Cohesion: 0.24
Nodes (11): addHeader(), ARGLESS_FLAGS, base64(), curlHeader(), CurlImport, CurlParseFailure, CurlParseResult, looksLikeCurlCommand() (+3 more)

### Community 22 - "Security roadmap — Task D"
Cohesion: 0.20
Nodes (9): D1 — Pin validated IP to the connection (SSRF DNS-rebinding), D2 — Trustworthy client IP for rate limiting, D3 — Stop leaking full target URL to PostHog, D4 — Close masking gaps, D5 — Rate-limit the proxy (open relay), D6 — `explanations` explicit revoke, D7 — Header/hop-by-hop + userinfo (Low/Unknown), Decisions (resolved) (+1 more)

### Community 23 - "explain-eligibility.ts"
Cohesion: 0.32
Nodes (6): contentTypeOf(), EXPLAIN_INPUT_LIMIT, ExplainEligibility, ExplainEligibilityInput, isExplainEligible(), jsonHeaders

### Community 24 - "storage-saved-explains.test.ts"
Cohesion: 0.33
Nodes (4): ExplainResult, result, SavedExplain, savedExplainKey()

### Community 25 - "proxy-client.ts"
Cohesion: 0.53
Nodes (4): isProxyErrorEnvelope(), PROXY_ERROR_COPY, proxyErrorCopy(), ProxyErrorEnvelope

## Knowledge Gaps
- **147 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `structureSignature()` connect `explain-candidates.ts` to `page.tsx`, `ExplainStrip`, `explain-route.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `callAIJson()` connect `ai.ts` to `diagnose.ts`, `explain-route.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._