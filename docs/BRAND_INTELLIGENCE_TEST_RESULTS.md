# Brand intelligence test results

Recorded 2026-10-18.

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass |
| `npm test` | 47 passed, 3 skipped. The skipped tests are the existing live RPC suites. |
| `tests/brand.test.ts` | 15 passed |

The brand tests cover a future name with no contract, a withheld score when the name and ticker are blank, narrative factors left unscored instead of zero, repeated scores, emoji and non-Latin text, ticker length that does not reward a 2-character symbol, an exact Pepe ticker hit, Pepper not matching Pepe, risk severity moving quality in the opposite direction, profile changes that keep collision ids, comparison rank when coverage is under 40%, an invalid address with no ticker substitute, exports, a model note blocked on a length factor, historical linking, suggestions, DexScreener exact-match parsing, and an unavailable provider.

No live DexScreener or CoinGecko call is part of CI. The parsers are tested with fixtures. Playwright screenshots were not added.

`npm run build:pages` exported `/brand-intelligence` and restored `app/api/analyze/route.ts`. The static HTML uses the `/ARC_Ethereum-Launch-Intelligence/_next` asset prefix.
