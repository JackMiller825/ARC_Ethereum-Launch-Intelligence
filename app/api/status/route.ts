import { NextResponse } from 'next/server';
import { cachedStatus } from '@/lib/api/service';
import { HEURISTIC_VERSION } from '@/lib/chain/constants';
import { createChainClient, resolveRpcUrls } from '@/lib/chain/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = resolveRpcUrls()[0];
  let rpc: { ok: boolean; url: string; block?: string; error?: string } = { ok: false, url };
  try {
    const block = await createChainClient(url).getBlockNumber();
    rpc = { ok: true, url, block: block.toString() };
  } catch (error) {
    rpc = { ok: false, url, error: error instanceof Error ? error.message : 'RPC failed' };
  }
  let database: { configured: boolean; ok?: boolean; error?: string } = { configured: Boolean(process.env.DATABASE_URL) };
  if (process.env.DATABASE_URL) {
    try {
      const { openPool } = await import('@/lib/db/persist');
      const pool = await openPool();
      await pool.query('select 1');
      await pool.end();
      database = { configured: true, ok: true };
    } catch (error) {
      database = { configured: true, ok: false, error: error instanceof Error ? error.message : 'Database failed' };
    }
  }
  return NextResponse.json({
    network: 'ethereum-mainnet',
    chainId: 1,
    heuristicVersion: HEURISTIC_VERSION,
    rpc,
    database,
    cache: cachedStatus(),
    syntheticFallback: false,
  });
}
