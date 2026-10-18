# UI redesign checks

Recorded 2026-10-18 against the uncommitted violet shell, then updated after the history and wallet loading gates.

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass, including the loading gates on history and wallets. |
| `npm run build:pages` | Pass. `app/api` restored. First-load JavaScript is about 216–225 kB per page. |
| `npm test` | 27 passed, 3 skipped. The skipped tests are the live RPC suites. |
| Browser, desktop | Overview, analyzer, bots, wallets, history, planner, and settings rendered on `http://127.0.0.1:3010`. |
| Analyzer | Search hero, six network buttons, seven tabs. Transactions tab showed Export CSV and an empty ledger before a new index. |
| Planner | Stepper, assumption fields, checklist, save, gas read, and JSON export were present. |
| Settings | RPC test/save, demo toggle, version check, and alert thresholds 0.5 / 0.5 / 90 were present. The page states that alerts stop when the tab closes. |
| Overflow | At a 1440px layout, `scrollWidth` equaled `clientWidth` (1425). At a 390px layout both were 390. |
| Playwright | Not added. No pixel baseline is stored in the repo. |

The dev server warned that `127.0.0.1` is a cross-origin request to the Next dev assets. That warning is local only and is not part of the GitHub Pages build.

Chain indexing formulas were not changed and were not re-run for this visual pass.
