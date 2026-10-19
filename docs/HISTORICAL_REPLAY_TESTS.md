# Historical replay tests

`tests/platform.test.ts` ran inside `npm test` on 2026-10-19.

| Check | Result |
|---|---|
| Step one trade | Pass |
| Seek to a timestamp between two stored swaps | Pass. Cursor lands on the later swap. |
| 30× delay is shorter than 1× | Pass |
| Prefix buy wei after the first valued buy | Pass |
| Drop one transaction hash | Pass |
| Hide sells | Pass |
| Provisional coverage adds one gap marker and does not change the trade count | Pass |
| Live RPC replay of a V2, V3, or V4 pool | Not run. `tests/live.test.ts` and `tests/phase3-live.test.ts` skip unless `LIVE=1`. |

`tests/research.test.ts` still checks block stepping and that a constant-product buy is labeled hypothetical.
