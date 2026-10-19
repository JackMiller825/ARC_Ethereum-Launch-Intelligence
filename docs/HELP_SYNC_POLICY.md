# Help sync policy

Help is part of the change, not a follow-up.

1. Match the change to a feature in `lib/features/registry.ts`.
2. Edit that feature’s `helpArticleId` article, and the glossary entry if a number or definition changed.
3. Set `updated` on the article and `lastReviewed` on the feature.
4. Recompute `lib/features/review-lock.json`. Use `updated` when the article changed. Use `unchanged` with a sentence when the source edit does not change what a person should read.
5. `npm test` fails if a registered source hash drifts from the lock, if an article id is missing, or if Help text contains the retired example contract.

GitHub Pages runs `npm test` before `build:pages`, so the check is on the deploy path.

Do not add a sentence to Help only to touch the file. A lock note is enough when the behavior people see did not change.
