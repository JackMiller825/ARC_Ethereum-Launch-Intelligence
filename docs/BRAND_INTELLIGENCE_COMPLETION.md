# Brand intelligence completion

The name and ticker engine is in the app at `/brand-intelligence`.

A user can score a future name with no contract, or an existing token after ERC-20 `name()` and `symbol()` are read. A failed metadata read does not substitute another token. One hundred factors are evaluated. Missing inputs stay insufficient or unknown. The model id is `arc-brand-v1`. Comparison, HTML/CSV/JSON export, planner linking, the analyzer Brand tab, history links, and a Help article are wired. Saved rows go to IndexedDB.

## Not operational

- Domain availability, trademark databases, and web search. No API is configured.
- A language model. Editorial text comes from the rubric.
- Image grading. A mascot field is text.
- Server-side storage on GitHub Pages. The worker is still not deployed with Pages.
- PDF. The printable file is HTML.
- A claim that any name is globally unused or legally available.

DexScreener and CoinGecko are attempted in the browser and shown as unavailable when the request fails. The editorial score still appears from the local rubric.
