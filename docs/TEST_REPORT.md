# Test report

Ran on 2026-10-18.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm test` | 10 passed when `LIVE` is unset. Covers the captured SISH V2 log, V3 signed deltas, V4 pool-id filtering, multihop WETH counted once, project-wallet exclusion, EOA sniper capped at MEDIUM, reorg rollback, the analyzer’s refusal to import synthetic trades, and keeping the indexed window’s closing second in the headline totals |
| `npm run test:live` | Pass in about 36 seconds. Mainnet read of SISH `0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b` includes pair `0x37D005660753714C6D3930cA4884B90033e232A9`, buy `0x45027976301cbc566f0d2743b375f184592433fb8f18884cad56c68197c8b504` for `10931399327655039` wei, opening liquidity `700000000000000000` wei, and a first-liquidity timestamp equal to T0 |
| `npm run build` | Pass. Webpack prints a viem/ox dynamic-import warning and still completes |
| `npm run build:pages` | Pass. Static export includes the seven pages and restores `app/api` afterward |

`npm test` skips the live test unless `LIVE=1`.

The starter images in `previews/` remain the design reference. This run checked the seven routes in a browser against a live 15-minute SISH index: gross buy 3.8167 ETH, opening liquidity 0.7 ETH, first liquidity equal to T0, and the same gross-buy figure on overview, analysis, history, and the planner baseline.
