# Phase 3 performance report

Measured 2026-10-18 on public RPCs (`rpc.mevblocker.io` and the existing fallbacks). No dedicated `ETHEREUM_RPC_URL` was set. Times are wall clock for a full `analyzeToken` call, including pool discovery, T0 search, log reads, and signer reads.

## $SISH launch windows

| Window | Elapsed | Swap logs kept | Notes |
|---|---:|---:|---|
| 1 minute | 6.6s | 10 trades | Known buy matched the receipt |
| 5 minutes | 13.4s | 52 trades | |
| 15 minutes | 12.4s | 167 trades | Same gross buy wei as the phase 2 browser snapshot |
| 30 minutes | 24.5s | 303 trades | |
| 1 hour | 26.2s | 370 trades | |
| 6 hours | 26.1s | 370 trades | Same valued buy wei as 1 hour |
| 24 hours | 26.7s | 370 trades | Wider block span, same valued buy wei |
| 3 days | 25.5s | 371 trades | One extra valued buy |
| 7 days | 37.8s | 371 trades | |
| 14 days | 38.7s | 371 trades | End block is the chain tip |
| 30 days | 37.5s | 371 trades | End block is the chain tip |

A 30-day request for this token is fast because trading after the first hour is almost empty and the 8,000-swap cap is not involved. A token with thousands of swaps per hour would be slower and could hit that cap. That case was not timed.

TURBO, five-minute launch, V2 plus four V3 pools: 24.2s. PEPE, one-minute launch, many pools: 54.3s. Valued PEPE buy volume from that run was 0 wei and is not a throughput sample for a busy minute.

## What changed in the indexer

- V2 and V3 factory reads run with concurrency 4, with three attempts and backoff.
- A zero WETH `getPair` is checked on a second endpoint before the pool is dropped.
- Failed `eth_getLogs` calls fall back to a raw JSON-RPC post on the same URL, then the next provider.
- Block headers fall back to `eth_getBlockByNumber` when the viem client throws.
- Provider successes and failures reorder the URL list for later calls in the process.
- Progress reports scanned blocks, remaining blocks, pools, swaps, routes, wallets, retries, missing ranges, elapsed time, and swaps per second. The percentage still comes from completed stages and the coverage score, not a timer.
- A stored launch snapshot can answer a shorter launch window without a new scan. Rolling snapshots are reused only for two minutes.

## What still limits speed

Public endpoints time out or return empty errors. The session had failed 15-minute and 60-minute runs before the block-header fallback. Those runs are not in the table above. Signer reads are still one request per transaction. There is no websocket head follower in the browser.
