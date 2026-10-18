# Phase 4 audit

Rechecked 2026-10-18 before the phase 4 edits. Local `HEAD` was `b09c27e895a2b1ebd547d6aeb8ac6472850d7960`. The working tree was clean. That commit is after `c4598c1`. The earlier note that GitHub still showed `c4598c1` was stale.

The live site for `b09c27e` already contained the phase-3 settings string. `arc-heuristic-v2` is still the classification model. The sidebar text `v1.0.0` was a hardcoded footer in `components/shell.tsx`. `package.json` `"version": "1.0.0"` is the npm package version. Neither value was the git commit, so source, UI, and a visitor's idea of "the deploy" did not name the same thing.

GitHub Pages serves content-hashed `/_next` files. An open tab keeps the JavaScript it loaded until a reload. There was no published `version.json` to compare with the running bundle.

The worker source and Docker Compose exist. `/api/status` reports `worker.observed: false` because the API process does not supervise the indexer. No Postgres service was reachable in this environment. GitHub Pages does not run the worker.

## Feature status before phase 4

| Feature | Status |
|---|---|
| Seven ARC pages, any ERC-20, 1 minute–30 day windows | Fully implemented and verified on $SISH in phase 3 |
| V2/V3/V4 discovery, multihop WETH accounting, reorg rollback helper | Implemented. V2 and V3 verified on TURBO. V4 Initialize is scanned; a miss stays a warning |
| `arc-heuristic-v2` evidence labels | Implemented and covered by unit tests. Not an identity |
| IndexedDB history, favorites, T0 comparison | Implemented. Browser-checked in earlier phases |
| Coverage under 100% when warnings exist | Verified. $SISH stayed at 95% because of the V4 warning |
| Postgres worker | Implemented in source. Not verified against a database here. Not deployed |
| GitHub Pages | Verified for `b09c27e` |
| Commit SHA in the UI | Missing. Footer said v1.0.0 |
| Live tail of new blocks | Missing |
| Alert center | Missing |
| Batch CA queue | Missing |
| HTML report with methodology | Partial. CSV and JSON existed |
| Correlation with an explicit non-causal note | Missing |
| Stale-bundle check | Missing |

Phase 4 adds the missing rows on top of this code. It does not replace the indexer.
