# ARC / Ethereum Launch Intelligence

Research terminal for any Ethereum ERC-20. Paste a contract, pick a window from 1 minute to 7 days, and read decoded Uniswap V2, V3, and V4 swaps. Wallet labels are evidence scores, not identities. The launch planner compares scenarios with saved history and does not forecast buyers or returns.

## What is live

| Feature | Status |
|---|---|
| Seven ARC pages | Preserved |
| Any mainnet ERC-20 | Indexed from pool logs, not transfer counts |
| Launch, trailing, and absolute windows | 1–10,080 minutes |
| Bot evidence and wallet drilldown | `arc-heuristic-v1` |
| Browser history | IndexedDB |
| Postgres worker | `docker compose` and `npm run worker` |
| Synthetic trades | Settings toggle, off by default |

A verified replay is `tests/fixtures/sish-v2-swap.json`: Uniswap V2 pair `0x37D005660753714C6D3930cA4884B90033e232A9`, buy transaction `0x45027976301cbc566f0d2743b375f184592433fb8f18884cad56c68197c8b504`, block `26131840`, `10931399327655039` wei. `npm run test:live` reads that swap back from mainnet.

## Commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Deployment steps, the Pages URL, and the API map are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The data flow is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Limits

- Public RPCs rate-limit wide `eth_getLogs` ranges. A dedicated `ETHEREUM_RPC_URL` is optional and stays server-side or in the browser’s own settings store.
- Failed swaps are unavailable unless a trace endpoint is added. The UI says so.
- Non-WETH routes without a same-transaction WETH hop are excluded from ETH totals and counted in the unsupported share.
- V4 discovery is a wide `Initialize` scan. If every endpoint refuses it, V2/V3 results still return and the gap is listed.
- GitHub Pages cannot host the Postgres worker. The static site indexes from the browser.

No wallet connection, seed phrase, or automated purchase path is included.
