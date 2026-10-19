# Token-agnostic audit

Recorded 2026-10-19.

## What was user-facing

The analyzer had a button that filled one contract and started an index. Help, the first-analysis tour, and the help homepage printed that same address. History’s empty state named it. Demo cards included it. `lib/data.ts` exported it as `REFERENCE_CA`. The token API could fall back to that sample name if Blockscout was thin. Docker Compose started the worker with that address. `.env.example` commented it in as the worker example.

## What remains on purpose

`tests/fixtures/sish-v2-swap.json` is a captured mainnet log for replay. Live tests under `tests/` still call that address when `LIVE=1`. Those files are not imported by `app/` or `components/`. Historical notes in `docs/PHASE*.md` still describe those lab runs. They are not bundled into the site.

`scripts/probe.mjs` and `scripts/probe-swaps.mjs` now require `INDEX_TOKEN` (and a pair address for the swap capture). `scripts/probe-rpcs.mjs` still names one pool from the old capture and is not imported by the app.

The brand collision list still includes well-known assets such as PEPE and WETH. Those are directory rows for confusion checks, not a selected token.

## Startup

Overview, the analyzer address field, the planner name and ticker, and Brand Intelligence start empty. The analyzer placeholder asks for a contract address. Saved IndexedDB rows still appear after the person who saved them comes back. Demo mode stays off.

## Still present outside the interface

These are lab notes or replay inputs. They are not imported by `app/`, `components/`, or Help:

- `tests/fixtures/sish-v2-swap.json` and the live tests that replay it.
- `docs/PHASE2_*.md`, `docs/PHASE3_*.md`, `docs/PHASE4_*.md`, `docs/TEST_REPORT.md`, `docs/CURSOR_PROMPT.md`, and `cursor prompt v2.txt` still name that fixture.
- `scripts/probe-rpcs.mjs` still names the captured pool. It is a developer probe.
- `previews/` screenshots are earlier design captures. No page imports them.
- `README.md` names the fixture path and says the interface does not import it.

`docs/DEPLOYMENT.md` no longer says Compose starts the worker on that contract. `docs/HELP_CENTER_CONTENT_MAP.md` no longer describes Getting Started as that example.
