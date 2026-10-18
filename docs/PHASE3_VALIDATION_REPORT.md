# Phase 3 validation report

Recorded 2026-10-18 from `LIVE=1 npx vitest run tests/phase3-live.test.ts`.

The SISH window test passed. The TURBO and PEPE test passed. Offline tests do not prove these RPC results. Earlier attempts in the same session failed when public RPCs returned a viem transport error or when two analyses ran together. Those failures are not counted as passes.

## $SISH

Contract `0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b`.

Known V2 pool `0x37D005660753714C6D3930cA4884B90033e232A9`.

T0 was block `26131840` at `2026-10-06T07:27:23Z` on every window. The first-minute run included buy `0x45027976301cbc566f0d2743b375f184592433fb8f18884cad56c68197c8b504` for `10931399327655039` wei. That matches the stored receipt fixture.

Every window reported one V2 pool, coverage 95%, and `provisional: true`. The score stays at 95 because a V4 Initialize scan returned no match, which is a warning. None of these windows hit the 8,000-swap cap. The largest trade count was 371.

Gross valued buy ETH rose through the first hour and then almost stopped. Duplicate economic ids were rejected by the test on every window.

| Window | Blocks | Trades | Buys | Buyer signers | Gross buy wei | Elapsed |
|---|---:|---:|---:|---:|---:|---:|
| 1 minute | 26131840–26131845 | 10 | 10 | 10 | 145456941580741593 | 6.6s |
| 5 minutes | 26131840–26131865 | 52 | 44 | 44 | 1144656426942396820 | 13.4s |
| 15 minutes | 26131840–26131915 | 167 | 138 | 129 | 3816783105824628504 | 12.4s |
| 30 minutes | 26131840–26131990 | 303 | 209 | 194 | 6980695907959557638 | 24.5s |
| 1 hour | 26131840–26132138 | 370 | 265 | 211 | 10607486414568414870 | 26.2s |
| 6 hours | 26131840–26133628 | 370 | 265 | 212 | 10607486414568414870 | 26.1s |
| 24 hours | 26131840–26139011 | 370 | 265 | 212 | 10607486414568414870 | 26.7s |
| 3 days | 26131840–26153351 | 371 | 266 | 211 | 10607496389568414870 | 25.5s |
| 7 days | 26131840–26182069 | 371 | 266 | 211 | 10607496389568414870 | 37.8s |
| 14 days | 26131840–26220902 | 371 | 266 | 211 | 10607496389568414870 | 38.7s |
| 30 days | 26131840–26220905 | 371 | 266 | 213 | 10607496389568414870 | 37.5s |

The 3-day gross buy is `9975000000000` wei above the 24-hour gross buy. That is one extra valued buy of about `0.000009975` ETH. Six hours and 24 hours match the 1-hour total exactly, so the wider scans did not invent activity and did not drop the first-hour buys.

14-day and 30-day ends sit on the chain tip because those durations run past the current head. The indexer stops at the tip. A warning added after this run states that future minutes are not filled in as zero. The measured totals above were produced before that warning string existed. The block ends already show the clip.

An absolute window from `2026-10-06T07:27:00Z` to `2026-10-06T07:28:30Z` returned the same `145456941580741593` wei and 10 trades, on blocks `26131840–26131846`.

Buyer-signer counts moved by one or two on otherwise identical trade counts (6 hours versus 1 hour, and 30 days versus 7 days). Gross wei and trade counts did not move. A failed signer read keeps the recipient, so the wallet count is less stable than the ETH total.

## TURBO

Contract `0xA35923162C49cF95e6BF26623385eb431ad920D3`.

Five-minute launch window, 24.2s. T0 `2023-04-29T06:27:11Z`.

Pools verified in that run:

- V2 `0x455d4d19aCA31C7530D75a32f98cf28d98365587`
- V3 `0x8107fcA5494375Fc743A9Fc4d4844353a1AF3D94`
- V3 `0x7baecE5d47f1BC5E1953FBE0E9931D54DAB6D810`
- V3 `0x69704957fb66F66A6a6Cf7480117470f0B248196`
- V3 `0x3A49De76496d1769ad4c92e76DF398e47FB5D28C`

Gross valued buy `84939759376984614436` wei (about 84.94 ETH). Coverage was provisional. An earlier run in this session found only two V3 pools and a later T0 (`2023-05-01T19:32:47Z` from unix `1682969567`) with about 3.06 ETH. That earlier T0 is what happens when the V2 pool read fails. The later run is the one recorded as the pass. A zero `getPair` from one endpoint is now checked again on WETH quotes before the pool is treated as absent.

## PEPE

Contract `0x6982508145454ce325ddbe47a25d4ec3d2311933`.

One-minute launch window, 54.3s. T0 `2023-04-14T17:34:47Z`. The run found V2 and V3 pools, including V2 `0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f`. Valued gross buy was `0` wei. The test checked pool discovery, a non-null T0, and unique trade ids. It did not prove a valued buy total. A follow-up breakdown of that zero did not finish. PEPE is not used as a volume benchmark.

## What was not treated as proof

DexScreener was not used as the judge. Third-party sites can count transfers, failed routes, or different quote assets. Agreement was checked against the known SISH receipt and against monotonic block ranges from the same decoder.
