import { readFileSync } from 'node:fs';
import { encodeAbiParameters, encodeEventTopics, parseAbiParameters } from 'viem';
import { describe, expect, it } from 'vitest';
import { swapV3, swapV4, TOPIC } from '../lib/chain/constants';
import { decodeSwap } from '../lib/chain/decode';
import type { ChainLog } from '../lib/chain/logs';
import { perspective, reconcileTransaction } from '../lib/chain/economics';
import type { RawSwap } from '../lib/chain/decode';
import { classifyTrades } from '../lib/chain/heuristics';
import { computeKpis, turnoverNote } from '../lib/chain/kpis';
import { reorgStatus } from '../lib/chain/reorg';
import { clampMinutes, tradesInView } from '../lib/intervals';
import { parseWindow } from '../lib/validate';
import type { PoolInfo, Trade } from '../lib/types';
import fixture from './fixtures/sish-v2-swap.json';

const pool: PoolInfo = {
  protocol: 'v2',
  address: fixture.pair,
  token0: fixture.token0,
  token1: fixture.token1,
  quote: fixture.token0,
  discovery: 'test',
};

function logFromFixture(): ChainLog {
  return {
    address: fixture.pair,
    topics: fixture.topics as `0x${string}`[],
    data: fixture.data as `0x${string}`,
    blockNumber: fixture.blockNumber,
    blockHash: fixture.blockHash,
    transactionHash: fixture.txHash as `0x${string}`,
    transactionIndex: fixture.txIndex,
    logIndex: fixture.logIndex,
    source: 'rpc',
  };
}

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
    pool: fixture.pair,
    txHash: '0x' + 'ab'.repeat(32),
    logIndex: 1,
    blockNumber: 10,
    txIndex: 1,
    origin: 'chain',
    ...partial,
  };
}

describe('real SISH swap replay', () => {
  it('decodes the captured mainnet V2 buy', () => {
    const decoded = decodeSwap(logFromFixture(), pool);
    expect(decoded).toBeTruthy();
    const view = perspective(decoded!, fixture.token);
    expect(view?.side).toBe('BUY');
    expect(view?.quoteAbs.toString()).toBe(fixture.args.amount0In);
    expect(decoded?.txHash).toBe(fixture.txHash);
    expect(decoded?.blockNumber).toBe(26131840);
  });
});

describe('signed pool deltas', () => {
  it('treats a negative V3 amount as a buy of that token', () => {
    const sender = '0x00000000000000000000000000000000000000a1';
    const recipient = '0x00000000000000000000000000000000000000b1';
    const topics = encodeEventTopics({ abi: [swapV3], eventName: 'Swap', args: { sender, recipient } });
    const data = encodeAbiParameters(parseAbiParameters('int256, uint160, uint128, int24'), [-5n, 1n, 1n, 1]);
    const wrong = encodeAbiParameters(parseAbiParameters('int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick'), [-5n, 9n, 1n, 1n, 1]);
    expect(data).not.toBe(wrong);
    const v3Pool: PoolInfo = { ...pool, protocol: 'v3', token0: fixture.token, token1: fixture.token0 };
    const decoded = decodeSwap({ ...logFromFixture(), topics: topics as `0x${string}`[], data: wrong }, v3Pool);
    expect(decoded?.amount0).toBe(-5n);
    expect(perspective(decoded!, fixture.token)?.side).toBe('BUY');
  });

  it('ignores a V4 swap for a different pool id', () => {
    const id = `0x${'11'.repeat(32)}` as `0x${string}`;
    const other = `0x${'22'.repeat(32)}` as `0x${string}`;
    const topics = encodeEventTopics({ abi: [swapV4], eventName: 'Swap', args: { id, sender: fixture.from as `0x${string}` } });
    const data = encodeAbiParameters(parseAbiParameters('int128, int128, uint160, uint128, int24, uint24'), [-1n, 2n, 1n, 1n, 1, 3000]);
    const v4Pool: PoolInfo = { ...pool, protocol: 'v4', poolId: other, address: '0x000000000004444c5dc75cB358380D2e3dE08A90' };
    expect(decodeSwap({ ...logFromFixture(), topics: topics as `0x${string}`[], data }, v4Pool)).toBeNull();
    expect(TOPIC.swapV4.startsWith('0x')).toBe(true);
  });
});

describe('route economics', () => {
  it('counts WETH once when the token hop is quoted in USDC', () => {
    const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const weth = fixture.token0;
    const token = fixture.token;
    const hop = (logIndex: number, token0: string, token1: string, amount0: bigint, amount1: bigint): RawSwap => ({
      protocol: 'v2', pool: `0x${logIndex.toString(16).padStart(40, '0')}`, token0, token1,
      blockNumber: 1, blockHash: '0x1', txHash: fixture.txHash as `0x${string}`, txIndex: 1, logIndex,
      sender: fixture.from, recipient: fixture.from, amount0, amount1, source: 'rpc',
    });
    const drafts = reconcileTransaction([
      hop(1, weth, usdc, 5n * 10n ** 17n, -(10n ** 6n)),
      hop(2, usdc, token, 10n ** 6n, -100n),
    ], { from: fixture.from, to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' }, token);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].side).toBe('BUY');
    expect(drafts[0].ethWei).toBe(5n * 10n ** 17n);
    expect(drafts[0].valuation).toBe('multihop-weth');
  });
});

describe('kpis and labels', () => {
  it('excludes project buys and keeps unknown out of the bot total', () => {
    const rows = [
      trade({ id: 'a', side: 'BUY', wallet: '0x00000000000000000000000000000000000000aa', confidence: 'HIGH', classification: 'Sniper', ethWei: '2000000000000000000' }),
      trade({ id: 'b', side: 'BUY', wallet: '0x00000000000000000000000000000000000000bb', confidence: 'UNKNOWN', ethWei: '1000000000000000000' }),
      trade({ id: 'c', side: 'BUY', wallet: '0x00000000000000000000000000000000000000cc', isProject: true, ethWei: '9000000000000000000' }),
    ];
    const kpis = computeKpis(rows, { initialLiquidityWei: 2n * 10n ** 18n, lpEvents: 1, t0Block: 10 });
    expect(kpis.grossBuyWei).toBe('3000000000000000000');
    expect(kpis.botBuyWei).toBe('2000000000000000000');
    expect(kpis.excludedProjectWei).toBe('9000000000000000000');
    expect(kpis.failedSwaps).toBeNull();
  });

  it('caps an EOA router sniper at medium confidence', () => {
    const row = trade({ id: 's', side: 'BUY', wallet: fixture.from, blockNumber: 10, assistedExecution: true, txIndex: 2 });
    const [labeled] = classifyTrades([row], { t0Block: 10, contracts: new Set(), priorLaunches: new Map() });
    expect(labeled.classification).toBe('Sniper');
    expect(labeled.confidence).toBe('MEDIUM');
    expect(labeled.evidence.join(' ')).toContain('assisted execution');
  });

  it('explains turnover without promising a result', () => {
    expect(turnoverNote(4)).toContain('4.00×');
    expect(clampMinutes(99999)).toBe(43200);
    expect(() => parseWindow({ mode: 'launch', minutes: 0 })).toThrow();
  });

  it('keeps the closing second when the view matches the indexed window', () => {
    const rows = [{ minute: 0 }, { minute: 14 }, { minute: 15 }];
    expect(tradesInView(rows, 60, 15)).toEqual(rows);
    expect(tradesInView(rows, 15, 15)).toEqual(rows);
    expect(tradesInView(rows, 5, 15).map((row) => row.minute)).toEqual([0]);
  });
});

describe('reorgs and the synthetic boundary', () => {
  it('rolls back when the hash at the checkpoint changes', () => {
    const status = reorgStatus({ chainId: 1, blockNumber: 100, blockHash: '0xabc' }, '0xdef');
    expect(status.status).toBe('reorg');
    expect(status.rollbackTo).toBe(36);
    expect(reorgStatus({ chainId: 1, blockNumber: 100, blockHash: '0xabc' }, '0xabc').status).toBe('confirmed');
  });

  it('does not reference synthetic trades from the live analyzer', () => {
    const source = readFileSync('lib/chain/analyze.ts', 'utf8');
    expect(source.includes('syntheticTrades')).toBe(false);
    expect(source.includes('selectTrades')).toBe(false);
  });
});
