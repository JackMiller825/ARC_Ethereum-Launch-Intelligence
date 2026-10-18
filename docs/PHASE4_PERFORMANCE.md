# Phase 4 performance

No new mainnet throughput run was executed for phase 4. The numbers below are the phase 3 measurements on public RPCs, still the latest timed full indexes.

| Window | $SISH elapsed | Trades |
|---|---:|---:|
| 1 minute | 6.6s | 10 |
| 15 minutes | 12.4s | 167 |
| 1 hour | 26.2s | 370 |
| 24 hours | 26.7s | 370 |
| 7 days | 37.8s | 371 |
| 30 days, clipped at the chain tip | 37.5s | 371 |

TURBO's five-minute launch window, one V2 pool and four V3 pools, took 24.2s. PEPE's one-minute discovery took 54.3s and is not a volume benchmark.

The live tail caps one pass at 2,000 blocks so a refresh does not rescan from T0. That cap was unit-tested. It was not timed against a token that actually had 2,000 new blocks of swaps. A busy token can still be slow inside that span because each new transaction asks for its signer.

Batch jobs in the browser are sequential on purpose. Ten tokens therefore take about the sum of their individual indexes, not a tenth of that.
