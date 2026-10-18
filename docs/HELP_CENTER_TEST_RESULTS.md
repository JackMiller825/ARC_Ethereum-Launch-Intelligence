# Help center test results

Recorded 2026-10-18.

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass |
| `npm test` | 32 passed, 3 skipped. The new file is `tests/help.test.ts` (5 tests). Skipped tests are the live RPC suites. |
| Article integrity | Every category has an article. Related ids resolve. Glossary entries point at articles. |
| Search | “getting started” ranks the getting-started article first. “sniper” opens bot intelligence. “dexscreener” opens the FAQ. An unknown term returns no hits. |
| Highlight | The matched slice is marked and the surrounding words stay in order. |
| Intervals | The interval article contains every preset key and Custom. |
| Tours | Every step href starts with `/`. |
| Browser | `/help` rendered the twelve cards. Opening Getting Started showed the $SISH example and related links. The URL became `/help/?article=getting-started`. |
| More menu | Analyzer showed 5m, 15m, 1h, 24h, 7d, and a More menu with 1m through 30d plus Custom. |
| Mobile | At 390px, Help did not widen the page (`scrollWidth` 390). The menu button was present. |
| Playwright screenshots | Not added. There is no stored pixel baseline. |

`npm run build:pages` compiled and exported 11 static routes, including `/help`. `out/help/index.html` exists. The title is in the client chunk because the page is a client component. `app/api/analyze/route.ts` was restored after the export. GitHub Pages does not run the worker.
