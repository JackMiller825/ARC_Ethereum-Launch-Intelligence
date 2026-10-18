# Phase 3 completion report

Recorded 2026-10-18. Status labels mean what was actually run.

## Verified

- Any mainnet ERC-20 still enters through the same analyzer. $SISH is a fixture. TURBO (`0xA35923162C49cF95e6BF26623385eb431ad920D3`) analyzed on a five-minute launch window with one V2 pool and four V3 pools.
- $SISH launch windows from 1 minute through 30 days, plus an absolute two-minute window around the known buy. Gross valued buy wei is monotonic. The known buy wei matches `tests/fixtures/sish-v2-swap.json`. Details are in `docs/PHASE3_VALIDATION_REPORT.md`.
- Duplicate economic ids were absent in those runs.
- Windows longer than the chain tip stop at the tip. A warning now says later minutes are not filled in as zero.
- Coverage stayed at 95% and provisional on every SISH window because the V4 scan reported no Initialize match. The UI does not call that 100%.
- Offline tests cover flow splits (HIGH, MEDIUM, unclassified), early exits, snapshot reuse, provider ranking, and the EOA sniper contradiction line.
- `arc-heuristic-v2` is unchanged as a version. Phase 3 adds contradictory evidence for an EOA first-block buy. It does not add a new probability.

## Implemented and checked in unit tests or by build

- Shared progress fields: scanned, remaining, scheduled blocks, routes, wallets, retries, gaps, elapsed time, swaps per second.
- Index reuse for a shorter stored launch window.
- Wallet timeline, priority fee when the transaction carried one, Blockscout activity read, and weak cross-launch association text that does not claim shared control.
- Comparison columns for net flow, first-minute buy, and five-minute exits, with JSON export and methodology text.
- Planner inputs for planned supply and a data-quality threshold. The threshold is compared with stored coverage. It does not approve a launch.
- Chart hover readout on the cumulative buy and sell chart.
- Settings shows `phase-3 · arc-heuristic-v2 · windows 1–43200 minutes` from source.

## Partially verified

- PEPE `0x6982508145454ce325ddbe47a25d4ec3d2311933` returned pools and a T0 for the first minute. Valued gross buy was 0 wei. That run is not evidence of PEPE's launch volume.
- Buyer counts on $SISH moved by one or two signers across identical trade totals when a signer read failed. ETH totals were stable.
- An earlier TURBO run missed the V2 pool and reported a later T0. The passing run found the V2 pool. Incomplete discovery changes T0. The WETH `getPair` zero-check was added because of that.
- Browser rendering of the new panels is checked after the production build in the completion commands. A full click-through of every export on GitHub Pages is not a substitute for the local live RPC runs above.

## Unavailable in this environment

- PostgreSQL was not running. Migrations were not applied. `/api/status` still reports the worker as not observed unless a process is actually up.
- No hosted launch-activity feed. The planner still says launch crowding is unscored.
- No same-actor wallet proof, funding graph, or priority-fee histogram beyond the fee on a decoded transaction.
- No Sankey diagram. Capital flow is the numeric split in `lib/analytics/flow.ts`. A drawing would repeat those sums.
- No artificial trading, wash-trading, or volume-generation path.

## Commands

| Check | Result |
|---|---|
| `tsc --noEmit --incremental false` | Pass |
| `npm test` with `LIVE` unset | 21 passed, 3 skipped |
| `LIVE=1` SISH window test (`-t "known buy"`) | 1 passed, 1 skipped. About 320s. |
| `LIVE=1` TURBO and PEPE test (`-t "unrelated"`) | 1 passed, 1 skipped |
| `npm run build` | Pass. The viem tempo dependency warning remains. |
| Local `next start` on port 3010 | Settings showed `phase-3 · arc-heuristic-v2 · windows 1–43200 minutes`. Analyzer listed 1m through 30d. Planner showed planned supply and a 90% quality threshold. |
| `npm run build:pages` | Pass. `out/index.html` uses the Pages asset prefix and `app/api` was restored. |
| Postgres migrate | Not run. No database was available. |

The two live tests were run separately so they would not share one RPC client at the same time. A single vitest invocation of both tests was not the passing run.
