# Graph Report - api-playground  (2026-10-11)

## Corpus Check
- 26 files · ~61,760 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 234 nodes · 349 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dba443e7`
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
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- route.js
- explain/route.ts
- include

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Home()` - 15 edges
3. `callAIJson()` - 14 edges
4. `POST()` - 9 edges
5. `isAIConfigured()` - 9 edges
6. `buildDiagnosisInput()` - 8 edges
7. `POST()` - 7 edges
8. `rateLimit()` - 7 edges
9. `include` - 7 edges
10. `diagnosisCacheKey()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts
- `POST()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/ai.ts
- `POST()` --calls--> `clientIp()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/rate-limit.ts
- `POST()` --calls--> `rateLimit()`  [EXTRACTED]
  src/app/api/diagnose/route.ts → src/lib/rate-limit.ts
- `POST()` --calls--> `isAIConfigured()`  [EXTRACTED]
  src/app/api/explain/route.ts → src/lib/ai.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.06
Nodes (40): BrowseApiSection(), buildCardRequest(), cardBodyPreview(), cardContentVariants, cardItemVariants, cardTextSpring, commonKeys, demoRequests (+32 more)

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 3 - "dependencies"
Cohesion: 0.08
Nodes (23): framer-motion, next, dependencies, framer-motion, next, posthog-js, react, react-dom (+15 more)

### Community 4 - "ai.ts"
Cohesion: 0.11
Nodes (26): GET(), AIJsonOptions, breakerAllows(), breakerCooldownMs(), breakerRecordFailure(), breakerRecordSuccess(), breakers, BreakerState (+18 more)

### Community 5 - "diagnose.ts"
Cohesion: 0.16
Nodes (19): CacheEntry, cacheGet(), cacheSet(), diagnosisCache, POST(), buildDiagnosisInput(), DIAGNOSIS_BODY_LIMIT, DIAGNOSIS_MAX_USES (+11 more)

### Community 6 - "LoadingState.tsx"
Cohesion: 0.33
Nodes (6): chevron, LoadingState(), orbit, ORBIT_ORDER, PATTERNS, useElapsed()

### Community 7 - "layout.tsx"
Cohesion: 0.27
Nodes (6): geistMono, geistSans, metadata, PostHogInit(), initPostHog(), trackToolUsed()

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 13 - "route.js"
Cohesion: 0.43
Nodes (7): ALLOWED_METHODS, assertSafeTarget(), ipToInt(), isPrivateIpv4(), isPrivateIpv6(), POST(), V4_RANGES

### Community 14 - "explain/route.ts"
Cohesion: 0.24
Nodes (13): POST(), requestSignature(), Bucket, buckets, clientIp(), memoryRateLimit(), rateLimit(), RateLimitResult (+5 more)

### Community 16 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

## Knowledge Gaps
- **94 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `callAIJson()` connect `ai.ts` to `diagnose.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05844155844155844 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._