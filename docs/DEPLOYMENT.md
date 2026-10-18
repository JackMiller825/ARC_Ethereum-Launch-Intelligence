# Deployment

## Local UI

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Leave `ETHEREUM_RPC_URL` empty to use the public fallbacks (`rpc.mevblocker.io`, Tenderly, `0xrpc.io`, dRPC, publicnode). Paste a dedicated archive URL in Settings if a public endpoint rate-limits you. The value stays in IndexedDB.

## Checks

```bash
npm test          # unit tests and the captured SISH log replay
npm run lint      # tsc --noEmit
npm run build     # Next.js server build
$env:LIVE='1'; npm run test:live   # PowerShell: real mainnet read
```

## GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`. The pages build copies `app/api` outside the App Router, exports a static site, and restores the API routes. The published site is:

https://jackmiller825.github.io/ARC_Ethereum-Launch-Intelligence/

Indexing on that site happens in the browser. There is no Postgres there.

## Docker

```bash
docker compose up --build
```

- Web UI: http://localhost:3000
- Postgres: `postgres://arc:arc@localhost:5432/arc`
- Worker: indexes the `INDEX_TOKEN` argument (the compose file passes the SISH reference CA for a 60 minute launch window)

Run another token from the host:

```bash
DATABASE_URL=postgres://arc:arc@localhost:5432/arc npm run worker -- 0xYourToken
```

The image does not contain a wallet, a seed phrase, or a trading key.

## API

These routes exist on the Docker / `next start` deployment. They are not part of the static Pages export.

- `GET /api/status`
- `GET /api/tokens/:ca/metadata`
- `GET /api/tokens/:ca/pools`
- `GET /api/tokens/:ca/launch`
- `GET /api/tokens/:ca/metrics?mode=launch&minutes=60`
- `GET /api/tokens/:ca/trades?cursor=`
- `GET /api/tokens/:ca/wallets?class=Sniper`
- `GET /api/tokens/:ca/comparisons?baseline=`
- `GET /api/analyze?ca=&mode=&minutes=`

`mode` is `launch`, `trailing`, or `absolute` (`start` and `end` as ISO timestamps). Responses are `unavailable` with a reason when logs cannot be read. They do not invent numbers.
