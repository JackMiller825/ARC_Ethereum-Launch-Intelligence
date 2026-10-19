# Production audit

Checked 2026-10-19 against https://analyze-research-capital.site/ while GitHub `main` was `9820331`. `version.json` on that deploy matched `9820331`. The prompt’s note that `9761e80` was newer is reversed: `9820331` is the later commit.

## Route check

Each URL returned HTTP 200. HTML referenced `/_next/` assets, not `/ARC_Ethereum-Launch-Intelligence/_next/`.

| Route | HTTP | Assets |
|---|---|---|
| `/` | 200 | domain root |
| `/analysis/` | 200 | domain root |
| `/planner/` | 200 | domain root |
| `/bots/` | 200 | domain root |
| `/wallets/` | 200 | domain root |
| `/history/` | 200 | domain root |
| `/laboratory/` | 200 | domain root |
| `/brand-intelligence/` | 200 | domain root |
| `/settings/` | 200 | domain root |
| `/help/` | 200 | domain root |

`https://jackmiller825.github.io/ARC_Ethereum-Launch-Intelligence/` returned 301 to the custom domain on the previous publish.

## Feature matrix

Browser clicks of every control were not executed. Status uses the HTTP check plus the unit tests that ran in this workspace. Live RPC suites stayed skipped.

| Page | Feature | Expected | Actual | Status | Evidence | Fix |
|---|---|---|---|---|---|---|
| All listed routes | Direct load | 200 from domain root | 200, `/_next/` assets | PASS | HTTP fetch 2026-10-19 | None |
| Analyzer ledger | Page footer | Page numbers, no “0–0 of 0” | Scroll window on `9820331` | FAIL on live, fixed in this tree | `components/ui.tsx` before this change | `PremiumPagination` |
| History library | Page footer | Same component | Full table, no pager | FAIL on live, fixed in this tree | `app/history/page.tsx` | Shared pager |
| Laboratory | Replay speeds and seek | Stored events only | Play, pause, block, minute, 1×/4× | PARTIAL on live | `app/laboratory/page.tsx` at `9820331` | Speeds, seek, markers, cutoff |
| Brand | 20 candidates | Cap, duplicates, no invented recall | Compare existed; recall could be saved without consent timing | PARTIAL | `lib/brand/compare.ts`, brand page | CSV parse, recognition workspace |
| Settings | Documentation coverage | Same formula as Help | Not on the settings page | FAIL on live, fixed in this tree | settings page | `CoveragePanel` |
| Live RPC tokens | V2, V3, V4, invalid, non-ERC-20 | Real chain reads | Not run | NOT TESTED | `tests/live.test.ts` skips unless `LIVE=1` | Left skipped |
| Playwright screenshots | Seven widths | Baselines reviewed | Not executed | NOT TESTED | Playwright is not installed | Documented in `docs/UI_VISUAL_REGRESSION.md` |
| Worker | Background indexing | Only if a server is running | `backend: not-deployed-with-pages` | BLOCKED | `version.json` | Labeled unavailable |

## Fixes in this change

Pagination, replay cutoff, recognition records, and the settings coverage panel are in the working tree and covered by `tests/platform.test.ts`. They are not on the live site until this commit is published.
