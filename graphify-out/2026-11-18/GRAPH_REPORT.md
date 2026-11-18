# Graph Report - api-playground  (2026-11-16)

## Corpus Check
- 70 files · ~163,681 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 548 nodes · 1045 edges · 29 communities (24 shown, 5 thin omitted)
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
- BrowseApiSection
- ExplainStrip
- curl.ts
- Security roadmap — Task D
- explain-key.ts
- storage-saved-explains.test.ts
- proxy-client.ts
- MainContent
- play/layout.tsx
- record-landing-demo.mjs

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

## Communities (29 total, 5 thin omitted)

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
Cohesion: 0.08
Nodes (40): GET(), POST(), onRequestError(), AUTH_HINTS_LAST_REVIEWED, AuthHint, authHintForUrl(), ExpectedAuth, HINTS (+32 more)

### Community 6 - "LoadingState.tsx"
Cohesion: 0.33
Nodes (6): chevron, LoadingState(), orbit, ORBIT_ORDER, PATTERNS, useElapsed()

### Community 7 - "play/page.tsx"
Cohesion: 0.04
Nodes (17): cardContentVariants, cardItemVariants, cardTextSpring, commonKeys, CurlState, demoRequests, ExplainStripState, headersPanelTransition (+9 more)

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 13 - "route.js"
Cohesion: 0.10
Nodes (26): ALLOWED_METHODS, POST(), safeLookup(), defaultBurstLimit(), defaultDailyLimit(), PROXY_ERROR_MESSAGES, ProxyError, proxyErrorResponse() (+18 more)

### Community 14 - "explain-route.ts"
Cohesion: 0.06
Nodes (53): POST(), CacheEntry, cacheGetFromStore(), cachePut(), lru, maskUrlSecrets(), buildExplainPrompt(), buildExplainSectionsPrompt() (+45 more)

### Community 16 - "storage.ts"
Cohesion: 0.09
Nodes (42): Home(), isDiagnosableErrorBody(), parseRetryAfter(), applyStreakOnLoad(), CachedExplainRecord, CardTestMap, CardTestRecord, DEFAULTS (+34 more)

### Community 17 - "explain-candidates.ts"
Cohesion: 0.19
Nodes (15): sameOrigin(), asToken(), buildCandidates(), Candidate, CandidateInput, CandidateSource, dedupeKey(), findHeader() (+7 more)

### Community 18 - "postman.ts"
Cohesion: 0.18
Nodes (25): PostmanImportModal(), asString(), bodyFromRequest(), collectFolder(), folderFits(), hasUnresolvedVariables(), headersFromRequest(), isRecord() (+17 more)

### Community 19 - "BrowseApiSection"
Cohesion: 0.22
Nodes (10): BrowseApiSection(), buildCardRequest(), cardBodyPreview(), explainKeyFor(), ExplainPopupPreview(), extractAuthScheme(), hasCredentialInput(), jsonHighlight() (+2 more)

### Community 20 - "ExplainStrip"
Cohesion: 0.12
Nodes (15): geistMono, geistSans, metadata, ExplainStrip(), PostHogInit(), formatFreshness(), formatSavedAge(), NOW (+7 more)

### Community 21 - "curl.ts"
Cohesion: 0.24
Nodes (11): addHeader(), ARGLESS_FLAGS, base64(), curlHeader(), CurlImport, CurlParseFailure, CurlParseResult, looksLikeCurlCommand() (+3 more)

### Community 22 - "Security roadmap — Task D"
Cohesion: 0.20
Nodes (9): D1 — Pin validated IP to the connection (SSRF DNS-rebinding), D2 — Trustworthy client IP for rate limiting, D3 — Stop leaking full target URL to PostHog, D4 — Close masking gaps, D5 — Rate-limit the proxy (open relay), D6 — `explanations` explicit revoke, D7 — Header/hop-by-hop + userinfo (Low/Unknown), Decisions (resolved) (+1 more)

### Community 23 - "explain-key.ts"
Cohesion: 0.24
Nodes (12): SECRET_HEADER_RE, SECRET_QUERY_RE, contentTypeFamily(), explainCacheKey(), ExplainCacheKeyInput, hasSecretHeader(), leafType(), pathTemplate() (+4 more)

### Community 24 - "storage-saved-explains.test.ts"
Cohesion: 0.33
Nodes (4): ExplainResult, result, SavedExplain, savedExplainKey()

### Community 25 - "proxy-client.ts"
Cohesion: 0.53
Nodes (4): isProxyErrorEnvelope(), PROXY_ERROR_COPY, proxyErrorCopy(), ProxyErrorEnvelope

### Community 26 - "MainContent"
Cohesion: 0.26
Nodes (10): curlErrorCopy(), fallbackHintText(), MainContent(), pathnameOf(), plainText(), jsonBodyRequired(), formatByteSize(), isBodyTooLarge() (+2 more)

### Community 28 - "record-landing-demo.mjs"
Cohesion: 0.29
Nodes (6): analyze, OUT_DIR, POSTER_PATH, RAW_WEBM, sizeKb, VIDEO_PATH

## Knowledge Gaps
- **157 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `callAIJson()` connect `ai.ts` to `diagnose.ts`, `explain-route.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `structureSignature()` connect `explain-key.ts` to `ExplainStrip`, `explain-route.ts`, `play/page.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._