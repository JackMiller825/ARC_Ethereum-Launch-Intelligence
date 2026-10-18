# Phase 4 deployment

## Frontend

GitHub Actions workflow `.github/workflows/pages.yml` runs `npm test` and `npm run build:pages` on every push to `main`. The export uses base path `/ARC_Ethereum-Launch-Intelligence`. The live site is https://jackmiller825.github.io/ARC_Ethereum-Launch-Intelligence/

Each build writes `version.json` at the site root:

- `commit`: full git SHA
- `builtAt`: ISO time
- `packageVersion`: `1.0.0`
- `heuristic`: `arc-heuristic-v2`
- `backend`: `not-deployed-with-pages`

Settings → Check published version compares that file with the SHA baked into the JavaScript. Reload if they differ.

Pages does not run Node, Postgres, or the worker. A green Pages deploy means the static frontend is published.

## Backend

Local API and worker:

```bash
docker compose up --build
```

Or, with `DATABASE_URL` set and Postgres already migrated by the worker:

```bash
npm run build
npm start
npm run worker
```

Environment variables are listed in `.env.example`: `BLOCKSCOUT_BASE_URL`, `ETHEREUM_RPC_URL`, `DATABASE_URL`, `INDEX_TOKEN`, `INDEX_MINUTES`, `INDEX_MODE`. Do not commit secrets.

`GET /api/status` reports RPC reachability and whether `DATABASE_URL` answered `select 1`. `worker.observed` stays false. A database ping is not a running indexer.

Rollback of the SQL indexes remains `DROP INDEX` on the names in `db/migrations/002_indexes.sql`. Migrations were not applied in this environment because Postgres was not running.

## What is not deployed

No hosted worker, no alert webhook, and no always-on tail. Live monitoring is the browser tab that has a token open.
