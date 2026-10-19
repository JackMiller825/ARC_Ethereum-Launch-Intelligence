# Brand laboratory

Route `/brand-intelligence`. The rubric remains `arc-brand-v1` in `lib/brand/score.ts`. This pass does not add a second scoring engine.

Compare accepts 2 to 20 candidates. Optional columns are narrative, audience, meme origin, mascot, and one link. A header row is skipped only when the first cells are `name` and `ticker` or `symbol`. Duplicate normalized name and ticker pairs are reported and skipped. Lines after 20 unique candidates are counted as overflow and are not scored.

Profiles still rescale category weights to 100. Changing a profile rescores the editorial result. Collision rows are not rewritten by a weight change. The table pages with the shared footer and keeps the editorial score separate from the collision count. The page states that a higher score is not a forecast of buying volume.

Suggestions still come from `lib/brand/improve.ts`. The saved candidate changes only when the user selects one.

Recognition is a separate workspace described in `docs/RECOGNITION_TEST_METHODOLOGY.md`.
