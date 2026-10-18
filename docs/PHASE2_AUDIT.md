# Phase 2 audit

Recorded before the phase 2 code changes, on 2026-10-18.

## Baseline checks

| Check | Result |
|---|---|
| `npm test` | 10 passed, 1 skipped. The skipped test is `tests/live.test.ts`, which runs only when `LIVE=1`. |
| `npx tsc --noEmit --incremental false` | Pass |

The passing offline suite is not evidence that a live RPC read still works. The previous live read of the SISH fixture had passed on 2026-10-18 before this audit, against `arc-heuristic-v1`.

## What already worked

- Seven ARC pages, dark mint/blue shell, and the existing components.
- Any mainnet ERC-20 can be indexed from Uniswap V2, V3, and V4 logs. $SISH is a fixture, not a hardcoded analyzer.
- Launch, trailing, and absolute windows, previously capped at 7 days (10,080 minutes).
- Economic reconstruction that ignores raw ERC-20 transfers, counts a multihop WETH hop once, and leaves non-WETH routes unvalued.
- `arc-heuristic-v1` evidence labels. HIGH and MEDIUM enter the automated total.
- IndexedDB snapshots, playbooks, settings, and wallet labels.
- Postgres schema `db/migrations/001_init.sql`, worker `worker/indexer.ts`, and Docker Compose.
- GitHub Pages static export. The API is copied out of `app/` during that build.
- `/api/status` reports RPC and database health and does not invent a synthetic fallback.

## Gaps found

- Interval presets skipped 1m, 3m, 10m, 3h, 14d, and 30d. The cap was 7 days.
- Time controls were duplicated as `IntervalPicker` and `WindowControls`, without one shared selector name.
- Progress was a stage percentage without blocks, pools, or swap counts, and the final step always reported 100.
- Bot classes had no separate MEV or market-making bucket.
- Wallet drilldown had no balance read, round-trip hold, or repeat-buyer split.
- History compared snapshots with different windows by dividing by stored minutes, which can rank a short index as if it were a long one.
- Favorites, recents, and comparison groups were not stored.
- The planner had no token identity fields and no reserve what-if.
- Market context was a gas button only.
- KPI tiles had no formula tooltips.
- The trade table rendered a fixed prefix of rows.
- Migrations loaded only `001_init.sql`.
- No public host is running the worker. GitHub Pages cannot.

## Decisions

- Keep the Next.js pages, chain modules, and IndexedDB store. Extend them.
- Raise the window cap to 30 days and keep the 8,000-swap interactive cap, with coverage marked provisional.
- Version the labeler as `arc-heuristic-v2`. Market-making stays LOW so it does not enter the automated ETH total.
- Store favorites and recents in IndexedDB. Deduplicate with chain id 1 plus a checksum-normalized lowercase address.
- Leave the worker local. `/api/status` says the API process does not observe a worker.
- Do not add a hosted launch-feed. The planner says that count is unavailable.
