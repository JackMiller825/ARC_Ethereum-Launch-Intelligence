# Ultimate upgrade audit

Recorded 2026-10-19 from the working tree. This is an extension of the existing Next.js app, not a replacement.

## Already present

- Token Analyzer for any ERC-20, with empty startup and no shipped example token.
- Uniswap V2, V3, and V4 pool discovery, swap decoding, coverage, and `arc-heuristic-v2` evidence classes.
- Wallet Explorer, Bot Intelligence, Token History, favorites, and T0-aligned comparison.
- Brand Intelligence with 10 categories, 100 criteria, existing, future, compare, and 5/10/20 alternatives.
- Launch Planner checklist and V2 what-if impact.
- Help Center, glossary tips, tours, feature registry, and review-lock test.
- IndexedDB for snapshots, playbooks, labels, brand records, and catalog.
- Docker worker source. GitHub Pages does not run it. `worker.observed` stays false.

## Added in this upgrade

- Forensic summary and research-completeness score from a stored snapshot.
- Rule-based research assistant. The model route returns HTTP 501.
- Launch Laboratory replay, minute comparison, and labeled constant-product simulation.
- Wallet overlap across saved snapshots.
- Operational readiness states on the planner.
- Local notes, backup, and restore that merges instead of wiping.
- Five-second recall using only saved responses.
- Command palette and disambiguated header search.
- Documentation coverage percentage on the Help home.

## Not claimed

- A hosted model provider. No API key is in the client bundle.
- Background monitoring while the tab is closed, or a live tail of many tokens at once. The tail watches the open token.
- V3 or V4 concentrated-liquidity simulation.
- Admin-rights, tax, or holder-distribution decoding.
- A generated PDF file. HTML can be printed by the browser.
- That the live site already serves this tree. It is not committed here.

## Dependencies

Indexed analysis still needs an RPC that can serve the requested logs. Brand collision research still depends on the bundled list plus DexScreener and CoinGecko when the browser can reach them. Domain, trademark, and web search are not configured.
