# CURSOR MASTER BUILD PROMPT — ARC / ETHEREUM LAUNCH INTELLIGENCE

You are the lead engineering team completing an existing, visual-quality Next.js Ethereum on-chain analytics platform. Use the **repo in this ZIP** as the working codebase, not a reference to recreate loosely.

## 0. Mandatory inspection
Before edits inspect README.md, package.json, tsconfig.json, app routes, components, lib/types.ts, lib/data.ts, docs/INDEXER_SPEC.md, .env.example and visual screenshots in previews/. Run `npm install`, `npm run lint`, and `npm run build`. Fix any failures. Retain the established Next.js 15 App Router + React 19 + TypeScript architecture and the dark mint/blue ARC visual system. Preserve the existing responsive seven-screen interface; improve it, do not replace it with generic Tailwind admin templates.

## 1. Business purpose
Build a permanent, multi-token Ethereum mainnet research tool. User enters any ERC-20 CA to reconstruct **real** launch activity, early trader categories, wallet patterns, liquidity and net flow, not just SISH. They can select any window (5m/15m/30m/1h/2h/6h/12h/24h/3d/7d/custom 1–10,080 minutes), launch-relative or calendar UTC start/end, saved per token. No fixed one-hour assumption. Separately provide a step-by-step, adaptive, ethical plan for the next token based on prior observed data, user-set risk/liquidity assumptions and measurable milestones. Never forecast guaranteed buyers or returns.

## 2. Existing delivered pages — preserve pixel-level aesthetic
- `/`: command-center hero, overview KPI cards, trend chart, token watchlist, configurable window.
- `/analysis`: reusable address-input workflow, metadata, on-chain pool explorer, reconstructed timeline, event feed and exports.
- `/planner`: launch assumptions, progress checklist, liquidity sensitivity and market-responsive stages.
- `/bots`: taxonomy and evidence-driven bot behavior.
- `/wallets`: wallet profiles, funding, prior-launch activity, traces, confidence evidence, not unverifiable identity.
- `/history`: durable multi-token portfolio, comparisons, saved snapshots.
- `/settings`: RPC/indexer/storage status, API tokens and confidence-methodology audit.

Use supplied page previews as visual intent. Use components in components/ui.tsx, app/globals.css, public/assets/ assets. Keep semantic accessible elements, keyboard nav, responsive side panel and large-screen density.

## 3. CRITICAL: Synthetic/live boundary
Right now Blockscout `/api/token` can retrieve LIVE contract metadata. `lib/data.ts` includes synthetic trade fixtures used to demonstrate UI. `/api/analyze` purposely returns 501. DO NOT pass synthetic trades off as contract-specific data. Replace demo source with real indexed trades before claiming live analysis; when unavailable show placeholders, exact missing status and action to retry. Clearly mark archival third-party reports as reports rather than exact chain analysis. Real $SISH CA is `0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b`; use only as test case and DO NOT hardcode token-specific logic.

## 4. Production ingestion: implement completely
Follow docs/INDEXER_SPEC.md point by point. Support Uniswap V2, V3 and V4 and expandable other pools; discover canonical contracts and events, detect genuine T0, decode logs, handle signed pool deltas, V4 PoolId, ETH/WETH unwrap, multi-hop routes, economic actor analysis, exclude LP events/project-controlled transfers and double counting. Store chain/block/tx/log provenance and API freshness. Build PostgreSQL schema and migrations, background worker with backfill and reorg handling, checkpoint/queue management, RPC provider fallback and cached API. Never calculate swaps by naive ERC20 Transfer counts.

## 5. Bot inference and ethics
Provide explainable evidence scores, not identity certainty. Distinguish sniper, new-pair scanner, copy-trader, momentum, arbitrage, sandwich and unknown; annotate manually executed trades through bot interfaces as ambiguous. Include wallet funding histories, repeated launches, intra-block position, timing and round-trip patterns, wallet cluster evidence. Version heuristic models. Avoid exposing actions for artificial buys, wash trading, misleading volume or manipulative momentum. Project wallets must be labeled and excluded from independent bot KPI.

## 6. KPI suite
Gross independent buyer ETH; bot-attributed buys and sells with confidence bands; net bot flow; other buys; buy/sell counts and unique wallets; first-block buyers, failures, price impact, initial liquidity and LP events; buyer retention and concentration; available data coverage. Initial planning scenario is 2 ETH ETH-side pool, 20 ETH gross-buy goal, 40% bot assumption, 70% bot sell/buy ratio. Values are editable SCENARIOS only, never hard-coded empirical facts. Explain how volume can exceed reserves through turnover.

## 7. Adaptive launch planning
The user should be able to save playbooks per token and market regime, set open-ended monitoring or custom end conditions, compare current market depth/gas/momentum to prior launches, build step-by-step launch checklists and export plans. Recommend transparent contract safety, verified CA, legitimate liquidity and effective risk reporting, not attempts to trick automated systems.

## 8. Product engineering
Implement comprehensive feature tests, replay-based integration tests for real known swap receipts, visual regression tests matching previews, migration seed fixtures explicitly marked synthetic, accessibility audit, responsive screenshots, caching, rate limits, pagination, CSV/JSON exports and wallet drilldowns. Provide .env.example without secrets and production Docker deployment guide. Never require user wallet seed phrases or signing. Prefer viem for EVM decode, Drizzle + PostgreSQL, a worker/queue, React charts, and SSR API endpoints. Use Zod input validation.

## 9. Deliver in this execution, not an endless TODO
Run all checks and repair. Provide clear commands for development and production, architecture diagram, exact live feature coverage, known limitations and a test report. Keep demo fixtures available only through an explicit demo toggle; default real-CA analysis to real data or clear `not yet indexed`, NEVER silent synthetic fallback. Preserve ARC aesthetics and page layouts with coherent polish across every page.
