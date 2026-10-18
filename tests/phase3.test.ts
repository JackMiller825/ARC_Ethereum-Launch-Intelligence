import { describe, expect, it } from 'vitest';
import { computeFlow } from '../lib/analytics/flow';
import { snapshotCovers, viewFromSnapshot } from '../lib/analytics/reuse';
import { classifyTrades } from '../lib/chain/heuristics';
import { noteProvider, providerScore, rankUrls } from '../lib/chain/providers';
import type { AnalysisSuccess, Trade } from '../lib/types';

function trade(partial: Partial<Trade> & Pick<Trade, 'id' | 'side' | 'wallet'>): Trade {
  return {
    minute: 0,
    timestamp: 1_700_000_000,
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
    txHash: `0x${partial.id}`,
    logIndex: 1,
    blockNumber: 10,
    txIndex: 1,
    origin: 'chain',
    ...partial,
  };
}

const snapshot = {
  ok: true,
  origin: 'chain',
  token: { address: '0x00000000000000000000000000000000000000aa', name: 'A', symbol: 'A', decimals: 18, launch: '', status: '', initialEth: 1, holders: null, source: 'chain' },
  pools: [],
  timeline: { deployTimestamp: null, poolCreateTimestamp: null, firstLiquidityTimestamp: null, t0Timestamp: 1_700_000_000, t0Block: 10, t0Tx: null, t0LogIndex: null },
  trades: [trade({ id: 'aa', side: 'BUY', wallet: '0x00000000000000000000000000000000000000bb', minute: 0, timestamp: 1_700_000_000 }), trade({ id: 'bb', side: 'BUY', wallet: '0x00000000000000000000000000000000000000cc', minute: 20, timestamp: 1_700_001_200 })],
  audit: [],
  kpis: { grossBuyWei: '2000000000000000000', grossSellWei: '0', botBuyWei: '0', botSellWei: '0', otherBuyWei: '0', netWei: '0', botBuyShare: null, bands: { highWei: '0', mediumWei: '0', lowWei: '0', unknownWei: '0' }, buyCount: 2, sellCount: 0, uniqueBuyers: 2, uniqueSellers: 0, uniqueActors: 2, firstBlockBuyers: 0, failedSwaps: null, failedSwapsReason: '', priceImpactBps: null, initialLiquidityWei: null, lpEvents: 0, buyerRetention: null, concentrationTop5: null, unsupportedValuationPct: 0, excludedProjectWei: '0', turnover: null },
  coverage: { items: [], headBlock: 1, fromBlock: 1, toBlock: 2, indexedAt: 1, heuristicVersion: 'arc-heuristic-v2', logSource: 'ethereum-rpc', reconciliation: { rawSwapLogs: 2, economicTrades: 2, poolWethWei: '0', economicWethWei: '0', matched: true }, tipHash: '0x', pct: 90, provisional: true },
  window: { mode: 'launch', minutes: 60 },
  warnings: [],
  projectWallets: [],
  savedAt: Date.now(),
} as AnalysisSuccess;

describe('phase 3 forensics', () => {
  it('splits confirmed, heuristic and unclassified buy wei and counts a 4 minute exit inside 5 minutes', () => {
    const trades = [
      trade({ id: 'h', side: 'BUY', wallet: '0x0000000000000000000000000000000000000011', confidence: 'HIGH', ethWei: '3000000000000000000' }),
      trade({ id: 'm', side: 'BUY', wallet: '0x0000000000000000000000000000000000000022', confidence: 'MEDIUM', ethWei: '2000000000000000000', timestamp: 100 }),
      trade({ id: 'u', side: 'BUY', wallet: '0x0000000000000000000000000000000000000033', confidence: 'LOW', ethWei: '1000000000000000000', timestamp: 100 }),
      trade({ id: 's', side: 'SELL', wallet: '0x0000000000000000000000000000000000000022', confidence: 'MEDIUM', ethWei: '1000000000000000000', timestamp: 340 }),
    ];
    const flow = computeFlow(trades, '5000000000000000000', '1000000000000000000');
    expect(flow.confirmedBuyWei).toBe('3000000000000000000');
    expect(flow.heuristicBuyWei).toBe('2000000000000000000');
    expect(flow.unclassifiedBuyWei).toBe('1000000000000000000');
    expect(flow.botNetWei).toBe('4000000000000000000');
    expect(flow.earlyExitBuyers.within5m).toBe(1);
    expect(flow.earlyExitBuyers.within1m).toBe(0);
    expect(flow.duplicateIds).toBe(0);
  });

  it('reuses a longer launch snapshot for a shorter window and refuses a wider one', () => {
    expect(snapshotCovers(snapshot, { mode: 'launch', minutes: 15 })).toBe(true);
    expect(snapshotCovers(snapshot, { mode: 'launch', minutes: 120 })).toBe(false);
    expect(snapshotCovers(snapshot, { mode: 'trailing', minutes: 15 }, snapshot.savedAt)).toBe(false);
    const view = viewFromSnapshot(snapshot, { mode: 'launch', minutes: 15 });
    expect(view.trades).toHaveLength(1);
    expect(view.kpis.grossBuyWei).toBe('1000000000000000000');
    expect(view.warnings.some((item) => item.includes('did not rescan'))).toBe(true);
  });

  it('ranks a healthy provider ahead of a failing one', () => {
    noteProvider('https://slow.example', false, 4000);
    noteProvider('https://fast.example', true, 20);
    expect(providerScore('https://fast.example')).toBeGreaterThan(providerScore('https://slow.example'));
    expect(rankUrls(['https://slow.example', 'https://fast.example'])[0]).toBe('https://fast.example');
  });

  it('records contradictory evidence for an EOA first-block buy', () => {
    const labeled = classifyTrades([
      trade({ id: 'snipe', side: 'BUY', wallet: '0x00000000000000000000000000000000000000aa', blockNumber: 10, assistedExecution: true }),
    ], { t0Block: 10, contracts: new Set(), priorLaunches: new Map() })[0];
    expect(labeled.classification).toBe('Sniper');
    expect(labeled.confidence).toBe('MEDIUM');
    expect(labeled.evidence.join(' ')).toContain('Contradictory evidence');
  });
});
