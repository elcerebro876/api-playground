# Graph Report - api-playground  (2026-08-31)

## Corpus Check
- 14 files · ~38,348 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 126 nodes · 123 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8fb11f54`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- devDependencies
- compilerOptions
- dependencies
- include
- package.json
- LoadingState.tsx
- layout.tsx
- README.md
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `include` - 7 edges
3. `scripts` - 5 edges
4. `Home()` - 4 edges
5. `lib` - 4 edges
6. `LoadingState()` - 3 edges
7. `loadStoredData()` - 3 edges
8. `saveStoredData()` - 3 edges
9. `applyStreakOnLoad()` - 3 edges
10. `framer-motion` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `applyStreakOnLoad()`  [EXTRACTED]
  src/app/page.tsx → src/lib/storage.ts
- `Home()` --calls--> `loadStoredData()`  [EXTRACTED]
  src/app/page.tsx → src/lib/storage.ts
- `Home()` --calls--> `saveStoredData()`  [EXTRACTED]
  src/app/page.tsx → src/lib/storage.ts

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.09
Nodes (15): cardContentVariants, cardItemVariants, cardTextSpring, commonKeys, demoRequests, headersPanelTransition, Home(), methodBadgeColors (+7 more)

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 3 - "dependencies"
Cohesion: 0.18
Nodes (11): framer-motion, next, dependencies, framer-motion, next, react, react-dom, react-syntax-highlighter (+3 more)

### Community 4 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 5 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 6 - "LoadingState.tsx"
Cohesion: 0.33
Nodes (6): chevron, LoadingState(), orbit, ORBIT_ORDER, PATTERNS, useElapsed()

### Community 7 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **69 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._