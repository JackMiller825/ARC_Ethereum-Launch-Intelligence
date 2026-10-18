import { describe, expect, it } from 'vitest';
import { analyzeToken } from '../lib/chain/analyze';
import fixture from './fixtures/sish-v2-swap.json';

const live = process.env.LIVE === '1';

describe.skipIf(!live)('ethereum mainnet', () => {
  it('reconstructs the known SISH buy from chain logs', async () => {
    const result = await analyzeToken({ address: fixture.token, window: { mode: 'launch', minutes: 15 } });
    expect(result.ok, result.ok ? '' : result.reason).toBe(true);
    if (!result.ok) return;
    expect(result.origin).toBe('chain');
    expect(result.pools.some((pool) => pool.address.toLowerCase() === fixture.pair.toLowerCase())).toBe(true);
    const trade = result.trades.find((item) => item.txHash.toLowerCase() === fixture.txHash.toLowerCase());
    expect(trade?.side).toBe('BUY');
    expect(trade?.ethWei).toBe(fixture.args.amount0In);
    expect(trade?.origin).toBe('chain');
    expect(result.kpis.grossBuyWei).not.toBe('0');
    expect(result.kpis.initialLiquidityWei).toBe('700000000000000000');
    expect(result.timeline.firstLiquidityTimestamp).toBe(result.timeline.t0Timestamp);
    expect(result.coverage.heuristicVersion).toBe('arc-heuristic-v1');
  }, 180_000);
});
