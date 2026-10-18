import { describe, expect, it } from 'vitest';
import { analyzeToken } from '../lib/chain/analyze';

const live = process.env.LIVE === '1';
const SISH = '0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b';
const KNOWN_TX = '0x45027976301cbc566f0d2743b375f184592433fb8f18884cad56c68197c8b504';
const KNOWN_WEI = 10931399327655039n;
const WINDOWS = [1, 5, 15, 30, 60, 360, 1440, 4320, 10080, 20160, 43200];
const OTHERS = [
  { symbol: 'TURBO', address: '0xA35923162C49cF95e6BF26623385eb431ad920D3', minutes: 5 },
  { symbol: 'PEPE', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', minutes: 1 },
];

async function analyzeRetry(options: Parameters<typeof analyzeToken>[0]) {
  let last = await analyzeToken(options);
  for (let attempt = 1; attempt < 4 && !last.ok && /rpc|refused|unknown|timeout|failed|finish|could not be read/i.test(last.reason); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    last = await analyzeToken(options);
  }
  return last;
}

describe.skipIf(!live)('phase 3 live validation', () => {
  it('checks SISH ranges against the known buy and keeps gross buy monotonic', async () => {
    let previous = 0n;
    let truncated = false;
    for (const minutes of WINDOWS) {
      const started = Date.now();
      const result = await analyzeRetry({ address: SISH, window: { mode: 'launch', minutes } });
      const elapsed = Date.now() - started;
      expect(result.ok, `${minutes}m ${result.ok ? '' : result.reason}`).toBe(true);
      if (!result.ok) return;
      const buy = BigInt(result.kpis.grossBuyWei);
      expect(buy >= previous, `${minutes}m buy ${buy} < ${previous}`).toBe(true);
      previous = buy;
      const ids = result.trades.map((trade) => trade.id);
      expect(new Set(ids).size).toBe(ids.length);
      if (result.warnings.some((item) => item.includes('8,000'))) truncated = true;
      if (truncated) expect(result.coverage.provisional).toBe(true);
      if (minutes === 1) {
        const known = result.trades.find((trade) => trade.txHash.toLowerCase() === KNOWN_TX);
        expect(known?.side).toBe('BUY');
        expect(known ? BigInt(known.ethWei || 0) : 0n).toBe(KNOWN_WEI);
        expect(result.timeline.t0Tx?.toLowerCase()).toBe(KNOWN_TX);
      }
      console.log(JSON.stringify({ token: 'SISH', minutes, elapsedMs: elapsed, grossBuyWei: result.kpis.grossBuyWei, buys: result.kpis.buyCount, buyers: result.kpis.uniqueBuyers, trades: result.trades.length, pools: result.pools.map((pool) => pool.protocol), provisional: result.coverage.provisional, pct: result.coverage.pct, fromBlock: result.coverage.fromBlock, toBlock: result.coverage.toBlock, t0: result.timeline.t0Timestamp }));
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    const absolute = await analyzeRetry({
      address: SISH,
      window: { mode: 'absolute', startIso: '2026-10-06T07:27:00.000Z', endIso: '2026-10-06T07:28:30.000Z', minutes: 2 },
    });
    expect(absolute.ok).toBe(true);
    if (absolute.ok) {
      expect(absolute.trades.some((trade) => trade.txHash.toLowerCase() === KNOWN_TX && trade.side === 'BUY')).toBe(true);
      console.log(JSON.stringify({ token: 'SISH', minutes: 'absolute', trades: absolute.trades.length, grossBuyWei: absolute.kpis.grossBuyWei, fromBlock: absolute.coverage.fromBlock, toBlock: absolute.coverage.toBlock }));
    }
  }, 1_500_000);

  it('indexes two unrelated tokens on short launch windows', async () => {
    for (const token of OTHERS) {
      const started = Date.now();
      const result = await analyzeRetry({ address: token.address, window: { mode: 'launch', minutes: token.minutes } });
      console.log(JSON.stringify({ token: token.symbol, ok: result.ok, elapsedMs: Date.now() - started, reason: result.ok ? undefined : result.reason, pools: result.ok ? result.pools.map((pool) => `${pool.protocol}:${pool.address}`) : [], grossBuyWei: result.ok ? result.kpis.grossBuyWei : null, provisional: result.ok ? result.coverage.provisional : null, t0: result.ok ? result.timeline.t0Timestamp : null }));
      expect(result.ok, result.ok ? '' : result.reason).toBe(true);
      if (!result.ok) return;
      expect(result.pools.length).toBeGreaterThan(0);
      expect(result.timeline.t0Timestamp).not.toBeNull();
      const ids = result.trades.map((trade) => trade.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  }, 600_000);
});
