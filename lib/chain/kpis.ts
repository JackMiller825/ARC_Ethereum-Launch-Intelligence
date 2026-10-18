import { formatEth } from '../format';
import type { Kpis, Trade } from '../types';

const z = 0n;
function wei(value: string | null) {
  return value ? BigInt(value) : z;
}
function add(map: Map<string, bigint>, key: string, value: bigint) {
  map.set(key, (map.get(key) || z) + value);
}

export function computeKpis(trades: Trade[], extras: { initialLiquidityWei: bigint | null; lpEvents: number; t0Block: number | null }): Kpis {
  const eligible = trades.filter((trade) => !trade.isProject);
  const buys = eligible.filter((trade) => trade.side === 'BUY');
  const sells = eligible.filter((trade) => trade.side === 'SELL');
  const sum = (rows: Trade[]) => rows.reduce((total, trade) => total + wei(trade.ethWei), z);
  const grossBuy = sum(buys.filter((trade) => trade.ethWei));
  const grossSell = sum(sells.filter((trade) => trade.ethWei));
  const band = (confidence: Trade['confidence']) => sum(buys.filter((trade) => trade.confidence === confidence && trade.ethWei));
  const high = band('HIGH');
  const medium = band('MEDIUM');
  const low = band('LOW');
  const unknown = band('UNKNOWN');
  const botBuy = high + medium;
  const botSell = sum(sells.filter((trade) => (trade.confidence === 'HIGH' || trade.confidence === 'MEDIUM') && trade.ethWei));
  const buyers = new Set(buys.map((trade) => trade.wallet.toLowerCase()));
  const sellers = new Set(sells.map((trade) => trade.wallet.toLowerCase()));
  const retained = [...buyers].filter((wallet) => !sellers.has(wallet)).length;
  const byBuyer = new Map<string, bigint>();
  for (const trade of buys) if (trade.ethWei) add(byBuyer, trade.wallet.toLowerCase(), wei(trade.ethWei));
  const top = [...byBuyer.values()].sort((a, b) => (a > b ? -1 : 1)).slice(0, 5).reduce((total, value) => total + value, z);
  const valued = buys.filter((trade) => trade.ethWei);
  const unsupported = buys.length ? ((buys.length - valued.length) / buys.length) * 100 : 0;
  const firstBlockBuyers = extras.t0Block === null ? 0 : new Set(buys.filter((trade) => trade.blockNumber === extras.t0Block).map((trade) => trade.wallet.toLowerCase())).size;
  const initial = extras.initialLiquidityWei;
  const firstBuy = buys.slice().sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex)[0];
  const priceImpactBps = initial && initial > z && firstBuy?.ethWei ? Number((wei(firstBuy.ethWei) * 10000n) / initial) : null;
  const turnover = initial && initial > z ? Number(grossBuy) / Number(initial) : null;
  const excluded = trades.filter((trade) => trade.isProject).reduce((total, trade) => total + wei(trade.ethWei), z);
  return {
    grossBuyWei: grossBuy.toString(),
    grossSellWei: grossSell.toString(),
    botBuyWei: botBuy.toString(),
    botSellWei: botSell.toString(),
    otherBuyWei: (grossBuy - botBuy).toString(),
    netWei: (grossBuy - grossSell).toString(),
    botBuyShare: grossBuy > z ? Number((botBuy * 10000n) / grossBuy) / 100 : null,
    bands: { highWei: high.toString(), mediumWei: medium.toString(), lowWei: low.toString(), unknownWei: unknown.toString() },
    buyCount: buys.length,
    sellCount: sells.length,
    uniqueBuyers: buyers.size,
    uniqueSellers: sellers.size,
    uniqueActors: new Set(eligible.map((trade) => trade.wallet.toLowerCase())).size,
    firstBlockBuyers,
    failedSwaps: null,
    failedSwapsReason: 'Failed swaps emit no logs. This RPC path does not assume a debug_traceTransaction endpoint, so the failure count stays unavailable instead of being estimated.',
    priceImpactBps,
    initialLiquidityWei: initial ? initial.toString() : null,
    lpEvents: extras.lpEvents,
    buyerRetention: buyers.size ? (retained / buyers.size) * 100 : null,
    concentrationTop5: grossBuy > z ? Number((top * 10000n) / grossBuy) / 100 : null,
    unsupportedValuationPct: unsupported,
    excludedProjectWei: excluded.toString(),
    turnover,
  };
}

export function ethLabel(wei: string | null | undefined, digits = 3) {
  return formatEth(wei, digits);
}

export function turnoverNote(turnover: number | null) {
  if (turnover === null) return 'Turnover is unavailable until initial ETH liquidity and valued buys are both known.';
  return `Gross buy volume is ${turnover.toFixed(2)}× the opening ETH reserve. The same liquidity can be bought and sold repeatedly, so volume can exceed the ETH sitting in the pool.`;
}

export function shareOrDash(value: number | null, digits = 1) {
  return value === null ? '—' : `${value.toFixed(digits)}%`;
}

export function numOrDash(value: number | null) {
  return value === null ? '—' : String(value);
}
