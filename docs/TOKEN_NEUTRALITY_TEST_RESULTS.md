# Token neutrality test results

Recorded 2026-10-19 after the empty-start change. Commands were run in this working tree. Live RPC tests were not started.

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | Pass. No diagnostics. |
| `npm test` | 52 passed, 3 skipped. 7 files passed and 2 live files skipped. |
| `npm run build:pages` | Pass. 12 static routes, including `/`, `/analysis`, `/brand-intelligence`, and `/help`. |
| Export scan | `out/` has no match for the retired example name or contract. |
| API restore | `app/api/analyze/route.ts` is present after the export. |

The skipped tests are `tests/live.test.ts` and `tests/phase3-live.test.ts`. They still replay the captured mainnet log when `LIVE=1`. They were not marked passed.

`tests/neutrality.test.ts` checks that `app/`, `components/`, `lib/`, `docker-compose.yml`, and `.env.example` do not contain the retired example; that the default playbook and settings start empty with demo mode off; that a mismatched address does not keep the previous snapshot; that a future brand score needs no contract; that every registered feature has an article, a shell route, glossary entries, and a matching availability label; that every `HelpTip` and `helpId` resolves; and that `lib/features/review-lock.json` matches the current source hashes.

## Browser on the local Pages export

Served `out/` at `http://127.0.0.1:3011/ARC_Ethereum-Launch-Intelligence/`.

- Overview showed “Analyze Any Ethereum Token.” with an empty contract field and both actions. No saved token appeared.
- Analyzer showed an empty address and the line that no contract is prefilled.
- Future-token mode started with empty name and ticker. Submitting blanks showed “Add a proposed name and ticker to evaluate its branding.” A filled name and ticker produced a score and the line “No contract. This is a proposed identity, not a trading history.”
- The editorial-score help tip opened the glossary text and a “Read full guide” link.
- Help home listed the category cards and the registered-feature list. Opening the Token Analyzer row showed the article dated 2026-10-19. `?article=getting-started` showed the empty-start section.

Client-side link transitions did not change the URL on this file server, because it does not answer Next flight requests. Full page loads did. Playwright was not used. There is no stored pixel baseline.

The published site was not updated by this run. The sidebar SHA in the export is still the last committed revision until this tree is committed.
