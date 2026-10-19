# Full site audit

This file records the same inspection as `docs/PRODUCTION_AUDIT.md`.

The deployed site at the start of this pass was commit `9820331`, which is newer than `9761e80`. Routes listed in the production audit returned 200 with root-relative assets.

Code review of the repository found:

- Replay already ordered stored swaps and could step a block or minute. It did not seek, expose the full speed set, or keep charts on one cutoff.
- Brand comparison already accepted 2 to 20 names. The form sliced extra lines quietly and did not report duplicates.
- The five-second recall control stored whatever was typed. It did not record consent, measured display time, or interruption.
- Trade tables used a scroll window. There was no shared pagination footer.
- Documentation coverage was on Help only. `npm test` already failed a drifted review lock. The workflow did not name that check separately.
- GitHub Pages does not run the PostgreSQL worker. `version.json` says `not-deployed-with-pages`.

No production default token was added. Live chain suites were not run.
