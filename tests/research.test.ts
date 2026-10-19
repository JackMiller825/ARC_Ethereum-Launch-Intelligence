import { describe, expect, it } from 'vitest';
import { answerResearch } from '../lib/research/assistant';
import { documentationCoveragePct, documentationStatus } from '../lib/features/coverage';
import { FEATURES } from '../lib/features/registry';
import { ARTICLES } from '../lib/help/articles';
import { GLOSSARY } from '../lib/help/glossary';
import { TOURS } from '../lib/help/tours';
import { forensicSummary } from '../lib/research/forensics';
import { resolveLookup } from '../lib/research/lookup';
import { walletOverlap } from '../lib/research/overlap';
import { launchReadiness } from '../lib/research/readiness';
import { frameAt, minuteBuckets, stepBlock } from '../lib/research/replay';
import { simulateConstantProduct } from '../lib/research/simulate';
import { recallStats } from '../lib/brand/recall';
import { dedupeAlerts } from '../lib/analytics/alerts';
import type { AnalysisSuccess, Trade } from '../lib/types';

function trade(partial: Partial<Trade>): Trade {
  return {
    id: partial.id || 't1', minute: partial.minute ?? 0, timestamp: partial.timestamp ?? 100, wallet: partial.wallet || '0xabc', recipient: '0xabc', side: partial.side || 'BUY', eth: 1, ethWei: partial.ethWei || '1000000000000000000', tokenAmount: '1', classification: partial.classification || 'Unknown', confidence: partial.confidence || 'UNKNOWN', evidence: [], score: 1, method: 'swap', isProject: false, assistedExecution: false, valuation: 'weth-pool', protocol: 'v2', pool: '0xpool', txHash: partial.txHash || '0xtx', logIndex: partial.logIndex ?? 0, blockNumber: partial.blockNumber ?? 10, txIndex: partial.txIndex ?? 0, origin: 'chain',
  };
}

function snapshot(trades: Trade[], symbol = 'ONE'): AnalysisSuccess {
  return {
    ok: true, origin: 'chain', token: { address: '0x1111111111111111111111111111111111111111', name: 'One', symbol, decimals: 18, launch: '', status: 'indexed', initialEth: null, holders: null, source: 'chain' }, pools: [], timeline: { deployTimestamp: null, poolCreateTimestamp: null, firstLiquidityTimestamp: null, t0Timestamp: 100, t0Block: 10, t0Tx: '0xtx', t0LogIndex: 0 }, trades, audit: [], kpis: { grossBuyWei: '1000000000000000000', grossSellWei: '0', botBuyWei: '0', botSellWei: '0', otherBuyWei: '1000000000000000000', netWei: '1000000000000000000', botBuyShare: null, bands: { highWei: '0', mediumWei: '0', lowWei: '0', unknownWei: '1000000000000000000' }, buyCount: 1, sellCount: 0, uniqueBuyers: 1, uniqueSellers: 0, uniqueActors: 1, firstBlockBuyers: 1, failedSwaps: null, failedSwapsReason: 'No trace endpoint', priceImpactBps: null, initialLiquidityWei: null, lpEvents: 0, buyerRetention: null, concentrationTop5: null, unsupportedValuationPct: 0, excludedProjectWei: '0', turnover: null }, coverage: { items: [], headBlock: 11, fromBlock: 10, toBlock: 11, indexedAt: 1, heuristicVersion: 'arc-heuristic-v2', logSource: 'rpc', reconciliation: { rawSwapLogs: 1, economicTrades: 1, poolWethWei: '1', economicWethWei: '1', matched: true }, tipHash: '0xabc', pct: 100, provisional: false }, window: { mode: 'launch', minutes: 15 }, warnings: [], projectWallets: [], savedAt: 1,
  };
}

describe('research intelligence', () => {
  it('summarizes stored trades and refuses an unknown assistant question', () => {
    const stored = snapshot([trade({ minute: 1, txHash: '0xabc123' })]);
    const report = forensicSummary(stored);
    expect(report.what).toContain('1 economic');
    expect(report.quality.note).toMatch(/not a safety/i);
    const unknown = answerResearch('What is the CEO name?', { snapshot: stored, peers: [] });
    expect(unknown.unknown).toBe(true);
    expect(unknown.answer).not.toMatch(/0x[a-fA-F0-9]{40}/);
    const early = answerResearch('Which wallets bought in the first five minutes?', { snapshot: stored, peers: [] });
    expect(early.unknown).toBe(false);
    expect(early.citations[0]?.href).toContain('0xabc123');
  });

  it('replays only stored swaps and simulates a constant-product buy', () => {
    const trades = [trade({ id: 'a', blockNumber: 10 }), trade({ id: 'b', blockNumber: 11, minute: 2 })];
    expect(frameAt(trades, 1).visible).toHaveLength(1);
    expect(stepBlock(trades, 1)).toBe(2);
    expect(minuteBuckets(snapshot(trades))).toHaveLength(2);
    const sim = simulateConstantProduct(2_000_000_000_000_000_000n, 1_000_000n, 30n, [{ side: 'BUY', amountIn: 100_000_000_000_000_000n }]);
    expect(sim.ok).toBe(true);
    if (sim.ok) expect(sim.label).toMatch(/Hypothetical/);
    expect(simulateConstantProduct(1n, 1n, 30n, []).ok).toBe(true);
  });

  it('counts shared signers, readiness, recall, lookup, and alert ids', () => {
    const first = snapshot([trade({ wallet: '0xaaa' })], 'ONE');
    const second = snapshot([trade({ wallet: '0xaaa', txHash: '0xother' })], 'TWO');
    second.token.address = '0x2222222222222222222222222222222222222222';
    const overlap = walletOverlap([first, second]);
    expect(overlap.rows).toHaveLength(1);
    expect(overlap.note).toMatch(/exchange/i);
    const states = launchReadiness({ tokenName: '', ticker: '', plannedAddress: 'not-an-address', initialEth: 1, tokenToLp: '', poolType: 'v3' } as never, { snapshot: null, brandCoverage: null, customRpc: false });
    expect(states.find((item) => item.id === 'contract')?.state).toBe('blocked');
    expect(states.find((item) => item.id === 'liquidity')?.state).toBe('needs-review');
    expect(recallStats({ name: 'Pebble', ticker: 'PBL' }, []).nameRate).toBeNull();
    expect(recallStats({ name: 'Pebble', ticker: 'PBL' }, [{ name: 'pebble', ticker: 'PBL', meaning: '' }]).nameRate).toBe(1);
    expect(resolveLookup('ONE', [{ address: first.token.address, symbol: 'ONE', name: 'One' }]).kind).toBe('token');
    expect(dedupeAlerts([{ id: 'a', token: 'ONE', kind: 'buy', at: 1, summary: 'x' }], [{ id: 'a', token: 'ONE', kind: 'buy', at: 2, summary: 'x' }])).toHaveLength(1);
  });

  it('keeps documentation coverage aligned with the registry', () => {
    const rows = documentationStatus(FEATURES, ARTICLES, GLOSSARY, TOURS);
    expect(rows.every((row) => row.complete)).toBe(true);
    expect(documentationCoveragePct(rows)).toBe(100);
  });
});
