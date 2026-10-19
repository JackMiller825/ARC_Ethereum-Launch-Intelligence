# Help coverage report

Recorded 2026-10-19.

Formula: coverage = complete registered features ÷ registered features.

A feature is complete only when its Help article exists, the article availability matches the registry, every glossary id resolves, and the article date is not older than `lastReviewed`. A missing tour is listed on the Help home and does not change the percentage.

`tests/research.test.ts` expects that percentage to be 100 for the current registry. `tests/neutrality.test.ts` fails if a registered source hash differs from `lib/features/review-lock.json` or if an article, route, or glossary link is missing.

The Help home renders the same percentage. New articles in this upgrade are Launch Laboratory, Research Assistant, and Documentation Coverage. Brand, planner, wallet, history, and the analyzer articles were edited to match the new controls.
