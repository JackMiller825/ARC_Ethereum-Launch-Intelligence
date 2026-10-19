# Brand intelligence audit

Recorded before the name and ticker engine was added. Date: 2026-10-18.

## What the app already did

ARC is a Next.js 15 static app. Token Analyzer indexes Ethereum mainnet ERC-20 pools and swaps. Launch Planner stores a playbook in IndexedDB, including optional `tokenName` and `ticker` strings. Token History compares saved launch snapshots. Help is a typed article list.

`readErc20` in `lib/chain/metadata.ts` reads `name()`, `symbol()`, and `decimals()` from a contract. If that read fails, the analyzer stops. It does not search a ticker and substitute another token.

There was no branding score, no name rubric, and no collision research. The uploaded reference of an overall score plus ten category bars was not implemented. Trading KPIs do not include a name score.

## Constraints that stay in place

GitHub Pages serves the frontend only. The worker is not deployed with Pages. No API secret belongs in the client. Bot labels stay evidence. The planner does not predict buyers. Brand scores must not be added to gross buy, liquidity, wallet, or automated-volume math.

IndexedDB is version 2, with stores for snapshots, playbooks, settings, labels, checkpoints, and the catalog.

## Gap

A user could not judge a proposed name without a contract, could not compare candidate names on one rubric, and had no sourced collision record. That is the gap this engine fills.
