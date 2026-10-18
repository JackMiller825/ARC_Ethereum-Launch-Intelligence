# Phase 2 results

Recorded 2026-10-18 after the phase 2 changes.

## 1. Architecture changes

The Next.js app, seven pages, and chain pipeline stay in place. New pure modules live under `lib/analytics/`: depth, liquidity what-if, coverage score, and session identity. `arc-heuristic-v2` adds MEV and market-making labels. IndexedDB version 2 stores a catalog of favorites, recents, and comparison groups. Migrations now run every file in `db/migrations/`, including `002_indexes.sql`.

GitHub Pages remains the static frontend. The worker still runs only where `DATABASE_URL` and `npm run worker` or Docker Compose are started.

## 2. Implemented features

- Shared `TimeRangeSelector` with presets from 1 minute through 30 days, plus since-launch, rolling, and absolute UTC modes.
- Repeat-buyer split, median buy, first-minute and first-five-minute ETH, and valued round trips.
- Buy/sell filter and a scrolling trade window with Etherscan transaction links.
- KPI tooltips for the headline formulas.
- Progress reports blocks, pools, and swaps. A warning, swap cap, or reconciliation gap keeps coverage under 100%.
- History favorites and T0-aligned comparison. A 15-minute snapshot asked for 24 hours is labeled partial.
- Planner fields for name, ticker, planned contract, pool type, token allocation, and expected start. V2 what-if impact for 0.5, 1, 2, 3, 5, and 10 ETH. Gas and ETH spot are read on demand.
- Wallet balance read and round-trip hold for the selected signer.
- `/api/status` reports `worker.observed: false` unless a separate process is actually running. This machine's status call showed the database was not configured.

## 3. Tests executed

| Check | Result |
|---|---|
| Baseline `npm test` before edits | 10 passed, 1 skipped (`LIVE` unset) |
| Baseline `tsc --noEmit` | Pass |
| `npm test` after edits | 17 passed, 1 skipped |
| `LIVE=1 npx vitest run tests/live.test.ts` | Pass in 16.25s |
| `npm run build` | Pass |
| Browser on `http://127.0.0.1:3010` | Analysis showed the stored SISH snapshot: 3.8167 ETH gross buy, first minute 0.1081 ETH, median buy 0.0221 ETH, 8 repeat buyers. The buy filter narrowed 167 rows to 138. History at 24 hours said the stored index is 15 minutes. The mobile menu gained `sidebar-open`. The planner rendered the V2 what-if note after a token allocation was entered. |
| `GET /api/status/` | HTTP 200. RPC ok at block 26220630. `database.configured` false. `worker.observed` false. Heuristic `arc-heuristic-v2`. |
| Postgres migrate | Not run. No database was available. `migrationFiles()` asserts `001_init.sql` and `002_indexes.sql` are the ordered list. |
| `npm run build:pages` | Pass. `out/index.html` was written and `app/api` was restored. |

The offline suite does not prove the live RPC path. The live test does, for the SISH fixture only.

## 4. Real transactions

`tests/fixtures/sish-v2-swap.json` and the live test:

- Token `0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b`
- Pair `0x37D005660753714C6D3930cA4884B90033e232A9`
- Buy `0x45027976301cbc566f0d2743b375f184592433fb8f18884cad56c68197c8b504` for `10931399327655039` wei
- Opening liquidity `700000000000000000` wei
- First liquidity timestamp equal to T0

## 5. Supported protocols

Uniswap V2 (and Sushi factory discovery), Uniswap V3 fee tiers, and Uniswap V4 `Initialize` / swap logs when an endpoint returns them. Quotes: WETH, USDC, USDT, DAI. ETH totals use WETH pool deltas or one same-transaction WETH hop.

## 6. Known unsupported cases

- Failed swaps without a trace API.
- Routes with no WETH hop stay in the unsupported share.
- V4 `ModifyLiquidity` amounts are not treated as ETH reserves.
- Interactive analyses keep the earliest 8,000 swaps and mark coverage partial.
- V3 and V4 concentrated liquidity are not used in the planner curve.
- Funding-source clustering and "same actor" claims are not inferred.
- A launch-activity feed is not configured, so the planner does not score launch crowding.

## 7. Indexing performance

The 15-minute SISH live regression completed in 16.25 seconds on public RPCs. A 30-day backfill was not timed. Wide ranges still depend on endpoint limits and the 8,000-swap cap.

## 8. Backend deployment

See `docs/DEPLOYMENT.md`. Docker Compose is the local backend. GitHub Pages does not run it. Rollback for the new indexes is `DROP INDEX` on the four names in `002_indexes.sql`.

## 9. Environment variables

`BLOCKSCOUT_BASE_URL`, `ETHEREUM_RPC_URL`, `DATABASE_URL`, `INDEX_TOKEN`, `INDEX_MINUTES`, `INDEX_MODE`. Documented in `.env.example`. No secrets are committed.

## 10. Remaining risks

Public RPCs can refuse wide `eth_getLogs` ranges. The browser catalog is per browser, not a shared database. Heuristic labels remain evidence, not identities. A 30-day window can return a provisional result without failing the request.
