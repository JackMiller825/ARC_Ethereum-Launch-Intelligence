import { analyzeToken } from '../lib/chain/analyze';
import { migrate, openPool, persistAnalysis } from '../lib/db/persist';
import { parseWindow } from '../lib/validate';

const token = process.argv[2] || process.env.INDEX_TOKEN || '';
const minutes = Number(process.env.INDEX_MINUTES || 60);
const mode = process.env.INDEX_MODE || 'launch';

async function main() {
  if (!token) {
    console.log('Usage: INDEX_TOKEN=0x... npm run worker');
    console.log('The worker backfills one ERC-20, writes Postgres, and exits. It does not invent trades when the RPC has no logs.');
    process.exit(1);
  }
  const pool = await openPool();
  await migrate(pool);
  const window = parseWindow({ mode, minutes });
  console.log(`Indexing ${token} ${window.mode} ${window.minutes}m`);
  const result = await analyzeToken({
    address: token,
    window,
    onProgress: (update) => console.log(`${update.pct}% ${update.stage}: ${update.detail}`),
  });
  if (!result.ok) {
    console.error(result.reason);
    await pool.end();
    process.exit(2);
  }
  await persistAnalysis(pool, result);
  console.log(`Stored ${result.trades.length} economic trades. Gross buy wei ${result.kpis.grossBuyWei}. Log source ${result.coverage.logSource}.`);
  await pool.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
