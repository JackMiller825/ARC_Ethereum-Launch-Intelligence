import { describe, expect, it } from 'vitest';
import { coverageScore, backoffMs } from '../lib/analytics/coverage';
import { computeDepth } from '../lib/analytics/depth';
import { v2ImpactBps, v2TokensOut } from '../lib/analytics/liquidity';
import { alignLaunch, canonicalAddress, rememberToken, saveGroup, toggleFavorite, tokenIdentity, emptyCatalog } from '../lib/analytics/session';
import { classifyTrades } from '../lib/chain/heuristics';
import { migrationFiles } from '../lib/db/persist';
import { absoluteMinutes, durations, MAX_MINUTES } from '../lib/intervals';
import { parseWindow } from '../lib/validate';
import type { AnalysisSuccess, Trade } from '../lib/types';

function trade(partial: Partial<Trade> & Pick<Trade, 'id' | 'side' | 'wallet'>): Trade {
  return {
    minute: 0,
    timestamp: 1_000,
    recipient: partial.wallet,
    eth: 1,
    ethWei: '1000000000000000000',
    tokenAmount: '1',
    classification: 'Unknown',
    confidence: 'UNKNOWN',
    evidence: [],
    score: 8,
    method: 'test',
    isProject: false,
    assistedExecution: false,
    valuation: 'weth-pool',
    protocol: 'v2',
    pool: '0x0000000000000000000000000000000000000001',
    txHash: `0x${partial.id.padStart(64, 'a')}`,
    logIndex: 1,
    blockNumber: 10,
    txIndex: 1,
    origin: 'chain',
    ...partial,
  };
}

describe('phase 2 intervals', () => {
  it('covers one minute through thirty days', () => {
    expect(durations['1m']).toBe(1);
    expect(durations['30d']).toBe(43200);
    expect(MAX_MINUTES).toBe(43200);
    expect(parseWindow({ mode: 'launch', minutes: 43200 }).minutes).toBe(43200);
    expect(() => absoluteMinutes('2026-01-01T00:00:00Z', '2026-02-15T00:00:00Z')).toThrow(/30 days/);
  });
});

describe('phase 2 coverage and retries', () => {
  it('refuses a perfect score when a warning or cap remains', () => {
    expect(coverageScore({ warnings: 0, truncated: false, kept: 10, raw: 10, matched: true })).toEqual({ pct: 100, provisional: false, reasons: [] });
    const warned = coverageScore({ warnings: 1, truncated: false, kept: 10, raw: 10, matched: true });
    expect(warned.pct).toBeLessThan(100);
    expect(warned.provisional).toBe(true);
    expect(coverageScore({ warnings: 0, truncated: true, kept: 80, raw: 100, matched: true }).pct).toBe(80);
    expect(backoffMs(0)).toBe(250);
    expect(backoffMs(8)).toBe(8000);
  });
});

describe('phase 2 depth and liquidity', () => {
  it('separates repeat buyers and values only reconstructed round trips', () => {
    const rows = [
      trade({ id: '1', side: 'BUY', wallet: '0x00000000000000000000000000000000000000aa', minute: 0, timestamp: 1000, ethWei: '2000000000000000000' }),
      trade({ id: '2', side: 'BUY', wallet: '0x00000000000000000000000000000000000000aa', minute: 2, timestamp: 1120, ethWei: '1000000000000000000', txIndex: 2 }),
      trade({ id: '3', side: 'SELL', wallet: '0x00000000000000000000000000000000000000aa', minute: 4, timestamp: 1300, ethWei: '500000000000000000', txIndex: 3 }),
      trade({ id: '4', side: 'BUY', wallet: '0x00000000000000000000000000000000000000bb', minute: 0, timestamp: 1010, ethWei: '3000000000000000000' }),
    ];
    const depth = computeDepth(rows, 1000);
    expect(depth.returningBuyers).toBe(1);
    expect(depth.firstTimeBuyers).toBe(1);
    expect(depth.firstMinuteBuyWei).toBe('5000000000000000000');
    expect(depth.timeToFirstBuySeconds).toBe(0);
    expect(depth.roundTrips).toHaveLength(1);
    expect(depth.roundTrips[0].holdSeconds).toBe(300);
    expect(depth.roundTrips[0].valued).toBe(true);
  });

  it('prices a V2 buy from reserves without inventing a zero-reserve quote', () => {
    const eth = 10n * 10n ** 18n;
    const token = 1000n * 10n ** 18n;
    const small = v2ImpactBps(eth, token, 10n ** 17n);
    const large = v2ImpactBps(eth, token, 10n ** 18n);
    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    expect(large!).toBeGreaterThan(small!);
    expect(v2TokensOut(0n, token, 10n ** 18n)).toBeNull();
  });
});

describe('phase 2 sessions and labels', () => {
  it('dedupes checksums and keeps a shorter index out of a longer ranking', () => {
    const mixed = '0xe6f94f305ce2a00219fd4d476aa79f37304ffe8b';
    const key = canonicalAddress(mixed);
    expect(tokenIdentity(key)).toBe(`1:${key.toLowerCase()}`);
    expect(canonicalAddress(key.toLowerCase())).toBe(key);
    let catalog = rememberToken(emptyCatalog(), mixed);
    catalog = rememberToken(catalog, key);
    expect(catalog.recents).toHaveLength(1);
    catalog = toggleFavorite(catalog, mixed);
    expect(catalog.favorites).toEqual([key.toLowerCase()]);
    catalog = saveGroup(catalog, 'Reference', [mixed, key]);
    expect(catalog.groups[0].addresses).toHaveLength(1);
    const snapshot = {
      token: { address: key, symbol: 'SISH' },
      window: { mode: 'launch', minutes: 15 },
      trades: [trade({ id: 's', side: 'BUY', wallet: '0x00000000000000000000000000000000000000aa', minute: 1, ethWei: '1000000000000000000' })],
      kpis: { initialLiquidityWei: '700000000000000000', lpEvents: 1 },
      timeline: { t0Block: 10 },
    } as unknown as AnalysisSuccess;
    const aligned = alignLaunch(snapshot, 60);
    expect(aligned.covered).toBe(false);
    expect(aligned.note).toContain('shorter');
    expect(aligned.grossBuyWei).toBe('1000000000000000000');
  });

  it('labels a same-block flip as MEV and a slow two-sided wallet as a market-maker hint', () => {
    const wallet = '0x00000000000000000000000000000000000000cc';
    const [mev] = classifyTrades([
      trade({ id: 'b', side: 'BUY', wallet, blockNumber: 20, txIndex: 1, timestamp: 500 }),
      trade({ id: 's', side: 'SELL', wallet, blockNumber: 20, txIndex: 3, timestamp: 500 }),
    ], { t0Block: 1, contracts: new Set(), priorLaunches: new Map() });
    expect(mev.classification).toBe('MEV');
    expect(mev.confidence).toBe('LOW');
    const makerRows = [0, 200, 400, 600].map((offset, index) => trade({
      id: `m${index}`,
      side: index % 2 ? 'SELL' : 'BUY',
      wallet,
      blockNumber: 30 + index,
      txIndex: index,
      timestamp: 1000 + offset,
    }));
    const labeled = classifyTrades(makerRows, { t0Block: 1, contracts: new Set(), priorLaunches: new Map() });
    expect(labeled.every((row) => row.classification === 'Market-maker')).toBe(true);
    expect(labeled.every((row) => row.confidence === 'LOW')).toBe(true);
  });

  it('lists the index migration without requiring a database connection', () => {
    expect(migrationFiles()).toEqual(['001_init.sql', '002_indexes.sql']);
  });
});
