# Deployment verification

Production domain: https://analyze-research-capital.site/

Before this change, `version.json` reported commit `982033102e1e3e74630d0da91398ff80705ea9ff`. HTML assets were `/_next/…`. `public/CNAME` is `analyze-research-capital.site`. `next.config.ts` sets an empty base path and `output: 'export'` when `GITHUB_PAGES=true`.

`.github/workflows/pages.yml` runs the documentation vitest files, then `npm test`, then `npm run build:pages`, then uploads `out` and deploys Pages.

The PostgreSQL worker is not part of that workflow. The version file keeps `backend` as `not-deployed-with-pages`.

This document does not claim the commit that adds these notes is already live. Confirm `https://analyze-research-capital.site/version.json` after the Pages run.
