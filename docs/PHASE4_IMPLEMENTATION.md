# Phase 4 implementation

## Version identity

`next.config.ts` reads `GITHUB_SHA` or `git rev-parse HEAD`, writes `public/version.json`, and inlines `NEXT_PUBLIC_COMMIT_SHA` and `NEXT_PUBLIC_BUILD_TIME`. The sidebar shows the short SHA. Settings shows the full SHA, the package version `1.0.0`, and a button that fetches `version.json` with `cache: 'no-store'`. If the published commit differs from the bundle, the page offers a reload.

`1.0.0` remains the npm package version. It is no longer the deploy identity.

GitHub Pages still cannot set `Cache-Control` on `version.json`. The check adds a timestamp query. Hashed Next chunks change when the build changes.

## Live tail

`extendAnalysis` reads logs from the stored tip forward, at most 2,000 blocks per pass. The remainder is a warning, and coverage stays provisional. A hash mismatch at the stored tip uses the existing reorg helper and does not append swaps. Refresh choices are manual, about one block (12 seconds), 15 seconds, 30 seconds, 1 minute, and 5 minutes. The copy states that the interval does not change block production or finality.

Watching runs in the open tab. Closing the tab stops it. That is not a 24/7 worker.

## Alerts

New buys and sells at or above the ETH thresholds, a burst of 5 new buyer signers, coverage under the floor, and new mint or burn logs create alerts. Ids include the token, kind, and transaction or block, so the same event is not added twice. Dismiss removes one row. Browser notifications require permission and an open tab.

## Batch and comparison

History accepts a list or CSV, skips non-addresses, and indexes up to 10 contracts one at a time so one request cannot abort another. A failed token does not delete earlier rows. Pearson correlation of gross buy and buyer count is shown only for 3 or more tokens, with a note that it is not causation.

## Reports and planner

HTML export includes the contract, chain id 1, window, T0 definition, log source, block range, coverage, `arc-heuristic-v2`, limitations, timestamp, and Etherscan links. It says bot labels are not verified identities. The planner adds an operational budget field. Liquidity scenarios remain the existing constant-product what-if.

## Backend

Unchanged deployment boundary. `docs/PHASE4_DEPLOYMENT.md` is the operator note. The status route still refuses to call the worker online.
