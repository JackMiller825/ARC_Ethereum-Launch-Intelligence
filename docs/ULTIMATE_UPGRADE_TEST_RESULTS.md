# Ultimate upgrade test results

Recorded 2026-10-19.

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | Pass. |
| `npm test` | 56 passed, 3 skipped. 8 files passed and 2 live files skipped. |
| `npm run build:pages` | Not passed locally. Two attempts ran out of memory during static generation. The export is not counted. GitHub Actions runs the same command on the push. |

The skipped tests are the live RPC suites. They were not marked passed.

`tests/research.test.ts` covered a forensic summary, an assistant question that stays unknown, replay stepping, a constant-product buy labeled hypothetical, wallet overlap, a blocked contract address, an empty recall rate, lookup, alert deduplication, and documentation coverage at 100% for the current registry.

`tests/neutrality.test.ts` still rejects the retired example token in the shipped trees and checks the review lock.

The Pages export was not treated as successful. Both local attempts ran out of memory during static generation. GitHub Actions runs `npm run build:pages` on the push to `main`.
