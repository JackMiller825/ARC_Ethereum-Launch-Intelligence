# UI refinement

Recorded 2026-10-18. The violet shell, routes, and chain math were kept.

## Issues found before the edits

- Overview rendered eight em-dash KPI cards and an empty chart before any token was indexed.
- Every interval from 1 minute to 30 days was a button in one wrapping strip.
- The trade table told the user to scroll when the ledger was empty.
- There was no in-app explanation of gross versus net, or of why a bot label is an estimate.
- Indexer progress was one percentage bar. The percentage comes from the indexer, but the eight research steps were not listed.
- Help did not exist. A new user had to infer the workflow from the pages.

## What changed

- Overview leads with a contract search and saved-token chips. With no open token and demo mode off, the page shows a first-use panel instead of empty market cards. A stored snapshot restores the dashboard. Demo mode still shows a badge and synthetic fixtures only.
- Frequent presets stay visible: 5m, 15m, 1h, 24h, 7d. More holds 1m, 3m, 10m, 30m, 2h, 3h, 6h, 12h, 3d, 14d, 30d, and Custom. Since launch, rolling, and absolute ranges are unchanged. The view still recomputes from stored trades, and a short snapshot is labeled partial.
- The indexer lists eight stages mapped to the real stage names (`RPC` through `Analytics`). The percentage on screen is the indexer’s completed-work marker. Cancel does not invent trades. Retry is a new submit.
- Metric cards can show a shared glossary tooltip: summary, formula, limitation, and a link into Help.
- Empty trade tables no longer mention scrolling or pagination.

## Checks

`tsc --noEmit` passed. `npm test` passed 32 tests and skipped 3 live RPC tests. `npm run build:pages` exported all eleven routes, including `/help`, and restored the API route afterward. The browser showed Help in the sidebar, the More menu, glossary buttons, and the getting-started article. At 390px, Help `scrollWidth` equaled `clientWidth`.

## Limits

Playwright is not installed, so there is no committed pixel baseline. Chart zoom is still hover-bin readout, not a brush. Market cap and FDV are documented as not computed. The worker is still not part of GitHub Pages.
