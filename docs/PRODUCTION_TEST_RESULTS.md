# Production test results

Recorded 2026-10-19 after the pagination, replay, recognition, and coverage changes.

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | Pass, before the final candidate-header tweak. That tweak only changed a string comparison. |
| `npm test` | 59 passed, 3 skipped. 9 files passed. 2 live files skipped. |
| `tests/platform.test.ts` | Pagination bounds, replay seek and gap marker, 20-candidate cap, duplicate skip, empty recognition rate. Pass. |
| `tests/neutrality.test.ts` | Pass after `lib/features/review-lock.json` was regenerated. |
| `tests/live.test.ts`, `tests/phase3-live.test.ts` | Skipped. Not a pass. |
| Playwright screenshots | Not run. Playwright is not installed. |
| Local `npm run build:pages` | Not run in this pass. An earlier export on this machine ran out of memory. GitHub Actions runs the export on push. |

The skipped tests are the live RPC suites.
