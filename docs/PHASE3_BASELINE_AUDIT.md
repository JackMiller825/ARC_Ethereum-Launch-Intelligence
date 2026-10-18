# Phase 3 baseline audit

Recorded 2026-10-18 before the phase 3 behavior changes, then checked again against the published site.

## Repository and live site

| Item | Result |
|---|---|
| Local HEAD at audit start | `c4598c12e30ac2eab67d6981d710c624b1be3e08` |
| Working tree | Clean at that commit. Phase 3 edits came after this audit. |
| GitHub `main` | Same commit. Latest Pages workflow run completed with conclusion `success` for that SHA. |
| Live site | https://jackmiller825.github.io/ARC_Ethereum-Launch-Intelligence/ and `/settings/` returned HTTP 200. |
| Live bundle | The published script contains `arc-heuristic-v2`. |

## The reported version discrepancy

The live Settings page showing `arc-heuristic-v2` and windows up to 30 days matches the source at `c4598c1`. `README.md` in that commit already says the same. The older wording (`arc-heuristic-v1`, seven-day cap) was documentation from before that commit, not a second deployed build and not uncommitted local code.

Settings reads `HEURISTIC_VERSION` from `lib/chain/constants.ts` at build time. It is not a separate cached label. Phase 3 adds an explicit build line on Settings: `phase-3 · arc-heuristic-v2 · windows 1–43200 minutes`.

## What already worked

- Seven pages, ARC dark theme, GitHub Pages export, browser IndexedDB history.
- Uniswap V2/V3/V4 discovery, swap decoding, multihop WETH accounting, project-wallet exclusion.
- `arc-heuristic-v2` with sniper, scanner, copy, momentum, arbitrage, sandwich, MEV, and market-maker labels.
- Shared time presets from 1 minute through 30 days, launch / rolling / absolute modes.
- Coverage stays under 100% when a warning, the 8,000-swap cap, or a reconciliation gap is present.
- `/api/status` reports `worker.observed: false` unless a worker process is actually supervised. Postgres was not running.

## Gaps found in the audit

- Progress percentages were stage estimates. Block counts appeared only after a pool finished.
- Changing to a shorter window always re-scanned the chain.
- Provider order did not learn from failures.
- Pool factory reads were sequential, then the first phase 3 pass made them parallel without retry. A follow-up live run lost the SISH pool on the second window and was fixed with bounded retries before the validation rerun.
- Wallet drilldown had no timeline, gas, or funding read.
- Capital flow did not separate HIGH, MEDIUM, and unclassified buy wei, or early-exit buckets.
- Chart had no hover readout.
- Comparison export and planned-supply / quality-threshold planner inputs were absent.
- `findEarliestLog` could return an unsorted log from a chunk.

## Baseline commands

| Check | Result |
|---|---|
| `npm test` with `LIVE` unset | 17 passed, 1 skipped |
| `tsc --noEmit --incremental false` | Pass |
| Lint script | `npm run lint` is `tsc --noEmit`. Pass on the baseline. |
| Postgres migrate | Not run. No database was available. |
| Production build and Pages export | Passed for `c4598c1` in the previous phase. Re-run after phase 3 edits is recorded in the completion report. |

The skipped test is `tests/live.test.ts`. A passing offline suite is not evidence that RPC indexing works.
