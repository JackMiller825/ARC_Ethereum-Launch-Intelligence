# Phase 4 test results

Recorded 2026-10-18.

| Check | Result |
|---|---|
| `tsc --noEmit --incremental false` | Pass |
| `npm test` with `LIVE` unset | 27 passed, 3 skipped |
| `npm run build` | Pass. Sidebar and Settings showed commit `b09c27e` from that local build. Check published version reported a match and `backend: not-deployed-with-pages`. |
| Analyzer | Live tail controls rendered, including the note that a closed tab is not 24/7 monitoring. |
| `npm run build:pages` | Pass. `app/api` restored. `out/index.html` references `/ARC_Ethereum-Launch-Intelligence/_next`. `out/version.json` includes `not-deployed-with-pages`. |

The three skipped tests are `tests/live.test.ts` and the two tests in `tests/phase3-live.test.ts`. They call public RPCs only when `LIVE=1`.

New offline cases in `tests/phase4.test.ts`:

- Commit mismatch, including case-insensitive equality and an unknown SHA.
- Tail plan idle at the tip, and a 2,000-block cap with a remaining count.
- Large-buy alert, sub-threshold buy ignored, duplicate alert id dropped.
- CSV address parse with a header and one invalid cell.
- Median percentile, correlation withheld below 3 points, perfect correlation on three points.
- HTML report contains the contract, an Etherscan link, and the sentence that labels are not verified identities.

`extendAnalysis` was not executed against mainnet in this session. The phase 3 live window timings remain the measured chain runs. A passing offline suite does not prove the live tail.
