# Graph Report - api-playground  (2026-11-18)

## Corpus Check
- 86 files · ~260,949 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 655 nodes · 1168 edges · 44 communities (38 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff2a0c50`
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
- app/layout.tsx
- curl.ts
- Security roadmap — Task D
- explain-key.ts
- storage-saved-explains.test.ts
- proxy-client.ts
- WhatItDoesSection.tsx
- play/layout.tsx
- record-landing-demo.mjs
- TryItHereSection.tsx
- MobileWhatItDoesSection.tsx
- ExplainStrip
- MobileHowItWorksSection.tsx
- MobileLandingMenu.tsx
- Working with Replume
- Working with Replume
- LandingFooter.tsx
- MobileLandingFooter.tsx
- app/page.tsx
- HowItWorksSection.tsx
- MobilePrivacySection.tsx
- PrivacySection.tsx
- getCachedExplain
- icons.tsx

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
  src/app/play/page.tsx → src/lib/explain-key.test.ts
- `buildCandidates()` --indirect_call--> `key()`  [INFERRED]
  src/lib/explain-candidates.ts → src/lib/explain-key.test.ts
- `parsePostmanCollection()` --indirect_call--> `key()`  [INFERRED]
  src/lib/postman.ts → src/lib/explain-key.test.ts
- `GET()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts
- `POST()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts

## Import Cycles
- None detected.

## Communities (44 total, 6 thin omitted)

### Community 0 - "HeroSection.tsx"
Cohesion: 0.19
Nodes (9): geist, getVisibleLandingSection(), HERO_TEXT_REVEAL, HeroSectionProps, LANDING_NAV, LandingHeader(), scrollToSection(), geist (+1 more)

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
Cohesion: 0.08
Nodes (38): GET(), AIJsonOptions, breakerAllows(), breakerCooldownMs(), breakerRecordFailure(), breakerRecordSuccess(), breakers, BreakerState (+30 more)

### Community 5 - "diagnose.ts"
Cohesion: 0.08
Nodes (37): curlErrorCopy(), fallbackHintText(), MainContent(), pathnameOf(), plainText(), AUTH_HINTS_LAST_REVIEWED, AuthHint, authHintForUrl() (+29 more)

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
Cohesion: 0.11
Nodes (25): ALLOWED_METHODS, POST(), safeLookup(), PROXY_ERROR_MESSAGES, ProxyError, proxyErrorResponse(), targetSuccessResponse(), CODES (+17 more)

### Community 14 - "explain-route.ts"
Cohesion: 0.06
Nodes (55): POST(), POST(), onRequestError(), CacheEntry, cacheGet(), cacheGetFromStore(), cachePut(), lru (+47 more)

### Community 16 - "storage.ts"
Cohesion: 0.09
Nodes (38): Home(), isDiagnosableErrorBody(), parseRetryAfter(), applyStreakOnLoad(), CachedExplainRecord, CardTestMap, CardTestRecord, DEFAULTS (+30 more)

### Community 17 - "explain-candidates.ts"
Cohesion: 0.19
Nodes (15): sameOrigin(), asToken(), buildCandidates(), Candidate, CandidateInput, CandidateSource, dedupeKey(), findHeader() (+7 more)

### Community 18 - "postman.ts"
Cohesion: 0.18
Nodes (25): PostmanImportModal(), asString(), bodyFromRequest(), collectFolder(), folderFits(), hasUnresolvedVariables(), headersFromRequest(), isRecord() (+17 more)

### Community 19 - "BrowseApiSection"
Cohesion: 0.22
Nodes (10): BrowseApiSection(), buildCardRequest(), cardBodyPreview(), explainKeyFor(), ExplainPopupPreview(), extractAuthScheme(), hasCredentialInput(), jsonHighlight() (+2 more)

### Community 20 - "app/layout.tsx"
Cohesion: 0.21
Nodes (8): geistMono, geistSans, metadata, PostHogInit(), AnalyticsEvent, initPostHog(), track(), trackToolUsed()

### Community 21 - "curl.ts"
Cohesion: 0.24
Nodes (11): addHeader(), ARGLESS_FLAGS, base64(), curlHeader(), CurlImport, CurlParseFailure, CurlParseResult, looksLikeCurlCommand() (+3 more)

### Community 22 - "Security roadmap — Task D"
Cohesion: 0.20
Nodes (9): D1 — Pin validated IP to the connection (SSRF DNS-rebinding), D2 — Trustworthy client IP for rate limiting, D3 — Stop leaking full target URL to PostHog, D4 — Close masking gaps, D5 — Rate-limit the proxy (open relay), D6 — `explanations` explicit revoke, D7 — Header/hop-by-hop + userinfo (Low/Unknown), Decisions (resolved) (+1 more)

### Community 23 - "explain-key.ts"
Cohesion: 0.26
Nodes (11): SECRET_HEADER_RE, SECRET_QUERY_RE, explainCacheKey(), ExplainCacheKeyInput, hasSecretHeader(), leafType(), pathTemplate(), structureSignature() (+3 more)

### Community 24 - "storage-saved-explains.test.ts"
Cohesion: 0.33
Nodes (4): ExplainResult, result, SavedExplain, savedExplainKey()

### Community 25 - "proxy-client.ts"
Cohesion: 0.53
Nodes (4): isProxyErrorEnvelope(), PROXY_ERROR_COPY, proxyErrorCopy(), ProxyErrorEnvelope

### Community 26 - "WhatItDoesSection.tsx"
Cohesion: 0.09
Nodes (9): DemoPanel(), FEATURE_IDS, FeatureId, featureSwitch(), geist, getStickyTop(), WHAT_IT_DOES_SECTIONS, WhatItDoesDemoCard() (+1 more)

### Community 28 - "record-landing-demo.mjs"
Cohesion: 0.29
Nodes (6): analyze, OUT_DIR, POSTER_PATH, RAW_WEBM, sizeKb, VIDEO_PATH

### Community 29 - "TryItHereSection.tsx"
Cohesion: 0.13
Nodes (8): geist, LANDING_EXPLAIN, LANDING_SAMPLE_GET_URL, LANDING_SAMPLE_RESPONSE, responseReveal, REVEAL_EASE, TryItHereSection(), TryItHereSectionProps

### Community 30 - "MobileWhatItDoesSection.tsx"
Cohesion: 0.17
Nodes (3): geist, MOBILE_FEATURES, MobileWhatItDoesSection()

### Community 31 - "ExplainStrip"
Cohesion: 0.29
Nodes (7): ExplainStrip(), formatFreshness(), formatSavedAge(), NOW, explainDayKey(), loadExplainUses(), saveExplainUses()

### Community 32 - "MobileHowItWorksSection.tsx"
Cohesion: 0.20
Nodes (3): geist, MobileHowItWorksSection(), STEP_TWO_SAMPLE_RESPONSE

### Community 33 - "MobileLandingMenu.tsx"
Cohesion: 0.40
Nodes (4): geist, MOBILE_NAV, MobileLandingMenu(), scrollToSection()

### Community 34 - "Working with Replume"
Cohesion: 0.40
Nodes (4): Commands, Rules, When Replume answers, Working with Replume

### Community 35 - "Working with Replume"
Cohesion: 0.40
Nodes (4): Commands, Rules, When Replume answers, Working with Replume

### Community 36 - "LandingFooter.tsx"
Cohesion: 0.40
Nodes (4): geist, LandingFooter(), LandingFooterProps, SITEMAP_LINKS

### Community 37 - "MobileLandingFooter.tsx"
Cohesion: 0.40
Nodes (4): geist, MobileLandingFooter(), MobileLandingFooterProps, SITEMAP_LINKS

### Community 38 - "app/page.tsx"
Cohesion: 0.67
Nodes (3): LandingPage(), HeroSection(), savePlaygroundEntered()

### Community 39 - "HowItWorksSection.tsx"
Cohesion: 0.50
Nodes (3): geist, HOW_IT_WORKS_STEPS, HowItWorksSection()

### Community 40 - "MobilePrivacySection.tsx"
Cohesion: 0.50
Nodes (3): geist, MobilePrivacySection(), PRIVACY_POINTS

### Community 41 - "PrivacySection.tsx"
Cohesion: 0.50
Nodes (3): geist, PRIVACY_POINTS, PrivacySection()

### Community 42 - "getCachedExplain"
Cohesion: 0.50
Nodes (4): getCachedExplain(), hasCachedExplain(), loadExplainCacheMap(), saveCachedExplain()

## Knowledge Gaps
- **196 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `callAIJson()` connect `ai.ts` to `diagnose.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `ExplainResult` connect `storage-saved-explains.test.ts` to `storage.ts`, `ai.ts`, `explain-route.ts`, `play/page.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08350951374207188 - nodes in this community are weakly interconnected._