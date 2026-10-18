import { describe, expect, it } from 'vitest';
import { dedupeAlerts, diffAlerts } from '../lib/analytics/alerts';
import { parseAddressList } from '../lib/analytics/batch';
import { buildReport, reportHtml } from '../lib/analytics/report';
import { pearson, percentile } from '../lib/analytics/stats';
import { planTail } from '../lib/analytics/tail-plan';
import { versionMismatch } from '../lib/analytics/version-check';
import type { AnalysisSuccess, Trade } from '../lib/types';

function trade(partial: Partial<Trade> & Pick<Trade, 'id' | 'side'>): Trade {
  return {
    minute: 0,
    timestamp: 1,
    wallet: '0x00000000000000000000000000000000000000aa',
    recipient: '0x00000000000000000000000000000000000000aa',
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
    txHash: `0x${partial.id.padEnd(64, '0')}`,
    logIndex: 1,
    blockNumber: 10,
    txIndex: 1,
    origin: 'chain',
    ...partial,
  };
}

function snapshot(trades: Trade[]): AnalysisSuccess {
  return {
    ok: true,
    origin: 'chain',
    token: { address: '0x00000000000000000000000000000000000000bb', name: 'Example', symbol: 'EX', decimals: 18, launch: '', status: '', initialEth: null, holders: null, source: 'chain' },
    pools: [],
    timeline: { deployTimestamp: null, poolCreateTimestamp: null, firstLiquidityTimestamp: null, t0Timestamp: 1, t0Block: 10, t0Tx: null, t0LogIndex: null },
    trades,
    audit: [],
    kpis: { grossBuyWei: '0', grossSellWei: '0', botBuyWei: '0', botSellWei: '0', otherBuyWei: '0', netWei: '0', botBuyShare: null, bands: { highWei: '0', mediumWei: '0', lowWei: '0', unknownWei: '0' }, buyCount: 0, sellCount: 0, uniqueBuyers: 0, uniqueSellers: 0, uniqueActors: 0, firstBlockBuyers: 0, failedSwaps: null, failedSwapsReason: '', priceImpactBps: null, initialLiquidityWei: null, lpEvents: 0, buyerRetention: null, concentrationTop5: null, unsupportedValuationPct: 0, excludedProjectWei: '0', turnover: null },
    coverage: { items: [], headBlock: 20, fromBlock: 10, toBlock: 12, indexedAt: 1, heuristicVersion: 'arc-heuristic-v2', logSource: 'ethereum-rpc', reconciliation: { rawSwapLogs: 0, economicTrades: trades.length, poolWethWei: '0', economicWethWei: '0', matched: true }, tipHash: '0xabc', pct: 80, provisional: true },
    window: { mode: 'launch', minutes: 15 },
    warnings: [],
    projectWallets: [],
    savedAt: 1,
  };
}

describe('phase 4 operations', () => {
  it('treats package version text as distinct from a commit mismatch', () => {
    expect(versionMismatch('unknown', 'abc')).toBe(false);
    expect(versionMismatch('abc', 'ABC')).toBe(false);
    expect(versionMismatch('aaa', 'bbb')).toBe(true);
  });

  it('plans a bounded tail and stays idle at the tip', () => {
    expect(planTail(100, 100).idle).toBe(true);
    const wide = planTail(100, 5000, 2000);
    expect(wide.start).toBe(101);
    expect(wide.end).toBe(2100);
    expect(wide.remaining).toBe(2900);
  });

  it('dedupes a repeated large buy and ignores a buy under the threshold', () => {
    const before = snapshot([]);
    const after = snapshot([
      trade({ id: 'a', side: 'BUY', ethWei: '1000000000000000000' }),
      trade({ id: 'b', side: 'BUY', ethWei: '100000000000000000' }),
    ]);
    const rules = { minBuyEth: 0.5, minSellEth: 0.5, coverageFloor: 50, buyerBurst: 5 };
    const first = diffAlerts(before, after, rules, 10);
    expect(first.filter((item) => item.kind === 'buy')).toHaveLength(1);
    expect(dedupeAlerts(first, diffAlerts(before, after, rules, 11)).filter((item) => item.kind === 'buy')).toHaveLength(1);
  });

  it('parses a csv of addresses and drops a header', () => {
    const parsed = parseAddressList('address\n0x0000000000000000000000000000000000000001, not-an-address');
    expect(parsed.ok).toEqual(['0x0000000000000000000000000000000000000001']);
    expect(parsed.bad).toEqual(['not-an-address']);
  });

  it('withholds correlation below three observations', () => {
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(pearson([1, 2], [3, 4]).r).toBeNull();
    expect(pearson([1, 2, 3], [1, 2, 3]).r).toBeCloseTo(1);
  });

  it('puts the contract, coverage and identity limitation in the html report', () => {
    const report = buildReport(snapshot([trade({ id: 'a', side: 'BUY' })]));
    const html = reportHtml(snapshot([trade({ id: 'a', side: 'BUY' })]));
    expect(report.chainId).toBe(1);
    expect(report.limitations.join(' ')).toContain('not identities');
    expect(html).toContain(report.token);
    expect(html).toContain('not verified identities');
    expect(html).toContain('etherscan.io/tx/');
  });
});
