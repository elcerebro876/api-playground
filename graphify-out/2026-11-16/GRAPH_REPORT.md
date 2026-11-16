# Graph Report - api-playground  (2026-11-16)

## Corpus Check
- 70 files · ~279,786 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 546 nodes · 1043 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f023a6b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- HeroSection.tsx
- devDependencies
- compilerOptions
- dependencies
- ai.ts
- diagnose.ts
- LoadingState.tsx
- play/page.tsx
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
- app/layout.tsx
- curl.ts
- Security roadmap — Task D
- explain-freshness.test.ts
- storage-saved-explains.test.ts
- proxy-client.ts
- icons.tsx
- play/layout.tsx
- record-landing-demo.mjs
- ExplainStrip

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
- `GET()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts
- `PostmanImportModal()` --indirect_call--> `key()`  [INFERRED]
  src/app/play/page.tsx → src/lib/explain-key.test.ts
- `buildCandidates()` --indirect_call--> `key()`  [INFERRED]
  src/lib/explain-candidates.ts → src/lib/explain-key.test.ts
- `parsePostmanCollection()` --indirect_call--> `key()`  [INFERRED]
  src/lib/postman.ts → src/lib/explain-key.test.ts
- `POST()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts

## Import Cycles
- None detected.

## Communities (30 total, 6 thin omitted)

### Community 0 - "HeroSection.tsx"
Cohesion: 0.24
Nodes (4): LandingPage(), HeroSection(), HeroSectionProps, savePlaygroundEntered()

### Community 1 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, @ffmpeg-installer/ffmpeg, devDependencies, eslint, eslint-config-next, @ffmpeg-installer/ffmpeg, playwright (+17 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (29): framer-motion, next, dependencies, framer-motion, next, posthog-js, posthog-node, react (+21 more)

### Community 4 - "ai.ts"
Cohesion: 0.15
Nodes (25): AIJsonOptions, breakerAllows(), breakerCooldownMs(), breakerRecordFailure(), breakerRecordSuccess(), breakers, BreakerState, breakerThreshold() (+17 more)

### Community 5 - "diagnose.ts"
Cohesion: 0.06
Nodes (55): GET(), POST(), AUTH_HINTS_LAST_REVIEWED, AuthHint, authHintForUrl(), ExpectedAuth, HINTS, applyAuthGuards() (+47 more)

### Community 6 - "LoadingState.tsx"
Cohesion: 0.33
Nodes (6): chevron, LoadingState(), orbit, ORBIT_ORDER, PATTERNS, useElapsed()

### Community 7 - "play/page.tsx"
Cohesion: 0.04
Nodes (16): cardContentVariants, cardItemVariants, cardTextSpring, commonKeys, CurlState, demoRequests, ExplainStripState, headersPanelTransition (+8 more)

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 13 - "route.js"
Cohesion: 0.08
Nodes (35): ALLOWED_METHODS, POST(), safeLookup(), defaultBurstLimit(), defaultDailyLimit(), PROXY_ERROR_MESSAGES, ProxyError, proxyErrorResponse() (+27 more)

### Community 14 - "explain-route.ts"
Cohesion: 0.07
Nodes (45): POST(), onRequestError(), SECRET_HEADER_RE, SECRET_QUERY_RE, captureServerError(), getClient(), resolveConfig(), ServerErrorProperties (+37 more)

### Community 16 - "storage.ts"
Cohesion: 0.09
Nodes (38): Home(), isDiagnosableErrorBody(), parseRetryAfter(), applyStreakOnLoad(), CachedExplainRecord, CardTestMap, CardTestRecord, DEFAULTS (+30 more)

### Community 17 - "explain-candidates.ts"
Cohesion: 0.19
Nodes (15): sameOrigin(), asToken(), buildCandidates(), Candidate, CandidateInput, CandidateSource, dedupeKey(), findHeader() (+7 more)

### Community 18 - "postman.ts"
Cohesion: 0.18
Nodes (25): PostmanImportModal(), asString(), bodyFromRequest(), collectFolder(), folderFits(), hasUnresolvedVariables(), headersFromRequest(), isRecord() (+17 more)

### Community 19 - "MainContent"
Cohesion: 0.12
Nodes (20): BrowseApiSection(), buildCardRequest(), cardBodyPreview(), curlErrorCopy(), explainKeyFor(), ExplainPopupPreview(), extractAuthScheme(), fallbackHintText() (+12 more)

### Community 20 - "app/layout.tsx"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, metadata, PostHogInit(), AnalyticsEvent, initPostHog(), trackToolUsed()

### Community 21 - "curl.ts"
Cohesion: 0.24
Nodes (11): addHeader(), ARGLESS_FLAGS, base64(), curlHeader(), CurlImport, CurlParseFailure, CurlParseResult, looksLikeCurlCommand() (+3 more)

### Community 22 - "Security roadmap — Task D"
Cohesion: 0.20
Nodes (9): D1 — Pin validated IP to the connection (SSRF DNS-rebinding), D2 — Trustworthy client IP for rate limiting, D3 — Stop leaking full target URL to PostHog, D4 — Close masking gaps, D5 — Rate-limit the proxy (open relay), D6 — `explanations` explicit revoke, D7 — Header/hop-by-hop + userinfo (Low/Unknown), Decisions (resolved) (+1 more)

### Community 23 - "explain-freshness.test.ts"
Cohesion: 0.47
Nodes (3): formatFreshness(), formatSavedAge(), NOW

### Community 24 - "storage-saved-explains.test.ts"
Cohesion: 0.33
Nodes (4): ExplainResult, result, SavedExplain, savedExplainKey()

### Community 25 - "proxy-client.ts"
Cohesion: 0.53
Nodes (4): isProxyErrorEnvelope(), PROXY_ERROR_COPY, proxyErrorCopy(), ProxyErrorEnvelope

### Community 28 - "record-landing-demo.mjs"
Cohesion: 0.40
Nodes (4): analyze, GIF_PATH, OUT_DIR, VIDEO_PATH

### Community 29 - "ExplainStrip"
Cohesion: 0.50
Nodes (5): ExplainStrip(), track(), explainDayKey(), loadExplainUses(), saveExplainUses()

## Knowledge Gaps
- **155 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+150 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `callAIJson()` connect `ai.ts` to `diagnose.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `structureSignature()` connect `explain-route.ts` to `ExplainStrip`, `play/page.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _155 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._