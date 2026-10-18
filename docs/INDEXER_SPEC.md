# Production Ethereum Indexer Specification

## Objective
Use verified on-chain event data to analyze **any** ERC-20 token over user-selected windows. Never derive trade KPI from unverified transfer counts or make identity claims from wallet behavior alone.

## Modes and intervals
Allow launch-relative windows: 5m, 15m, 30m, 1h, 2h, 6h, 12h, 24h, 3d, 7d, custom 1 minute–10,080 minutes. Also support absolute UTC start and end, recent trailing N minutes, and editable milestone bookmarks. Keep launch T0, pool-create timestamp, first-liquidity timestamp, and contract deploy timestamp separate.

## Source and architecture
- Ethereum L1 RPC with `eth_getLogs`, transaction receipts, block headers and debug/trace API if available; retry, rate-limit and archive resolved events.
- Enumerate Uniswap v2 PairCreated, V3 PoolCreated and V4 PoolManager pool initialization; expand via verified canonical factory registries. Optional alternative DEX adapters.
- Decode V2 Swap and Mint/Burn, V3 Swap and Mint/Burn, V4 PoolManager Swap and ModifyLiquidity; ERC20 Transfer alone is NOT a swap.
- In V4 use correct PoolId, currency ordering, fee and hooks. Do not equate PoolManager as unique pool.
- Detect first successful independently executable public swap after active liquidity as canonical `T0` and store its block/log order.
- Trace multihop transaction routes and reconcile ETH/WETH entry, token output and intermediate hops. Deduplicate unique acquisitions; count ETH consideration once. Separate directly WETH-paired token buys from cross-asset buys if route valuation is insufficient.
- Exclude LP actions, transfers, mints, burns and project self-trades from PRIMARY independent-trader buy KPI. Preserve every excluded event and explanation in raw audit stream.

## Data model
Tables (Postgres recommended): launches, contracts, token_metadata, pools, raw_blocks, raw_logs, decoded_swaps, economic_trades, trading_actors, wallet_features, actor_labels, launch_windows, minute_kpis, annotation_events, ingestion_offsets. PK on chain_id/tx_hash/log_index for raw swap log; a route-level trade id must deduplicate same economic trade across multiple pools.

## Wallet and automation evidence
- Separate tx signer / executing contract / recipient / beneficial controller whenever confidently inferred.
- Features: first swap relative block, deterministic cadence, prior launches, documented contract provenance, funding patterns, copy source leader-lag, round trip duration, arbitration traces.
- Confidence labels: HIGH / MEDIUM / LOW / UNKNOWN; do not invent calibrated probabilities. Repeated related wallets require high standard of evidence; centralized exchange funders are not proof of shared control.
- Keep authenticated project-owned wallets excluded from independent bot buying. Audit every exclusion.
- Human pressing a trading bot = assisted execution, not verified autonomous bot decision.

## KPI equations
Gross buy ETH = sum ETH-equivalent economic consideration paid to acquire target token by eligible external actors in window. For non-WETH paths derive from execution traces or publish an explicit unsupported percentage. Bot-attributed gross buys = sum buys attributable to automation with confidence and unknown remainder. Gross sell ETH = proceeds of target-token sales. Net = buys minus sells (fees/liquidity deposits tracked separately). Share = automated gross buy / all gross buy. Count distinct trade IDs, signer wallets and inferred economic actors independently.

## Correctness and reliability
- Block hash / chain_id / tx_index / log_index ordering.
- Provisional vs confirmed vs finalized status. Handle reorg rollbacks and full replays.
- Recover missed websocket updates by polling.
- High precision integers internally, decimal formatting only at presentation.
- Explicit data freshness / indexer progress / gap metrics.
- Compare actual ETH/WETH token transfer balances and net reserve movements for validation.
- Rate limits, durable queues, backfill, API key handling, public health endpoint, timeout and error reporting.
- E2E fixtures for V2, V3, V4, multihop, multi-pool arb, failed tx, LP operations, project trades, reorgs.

## REST/API targets
- GET /api/tokens/:ca/metadata
- GET /api/tokens/:ca/pools
- GET /api/tokens/:ca/launch?pool=...
- GET /api/tokens/:ca/metrics?mode=launch&minutes=...
- GET /api/tokens/:ca/trades?cursor=...
- GET /api/tokens/:ca/wallets?class=...
- GET /api/tokens/:ca/comparisons?baseline=...
- GET /api/status

On insufficient data, show `unavailable` and reason, never generate plausible numerical substitutes.
