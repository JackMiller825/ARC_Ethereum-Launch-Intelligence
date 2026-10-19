import type { AnalysisSuccess, Trade } from '../types';

export type MinuteBucket = { minute: number; buyWei: bigint; sellWei: bigint; trades: number };

export function orderedTrades(snapshot: AnalysisSuccess) {
  return snapshot.trades.slice().sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex || a.logIndex - b.logIndex);
}

export function minuteBuckets(snapshot: AnalysisSuccess): MinuteBucket[] {
  const map = new Map<number, MinuteBucket>();
  for (const trade of snapshot.trades) {
    if (trade.isProject || !trade.ethWei) continue;
    const row = map.get(trade.minute) || { minute: trade.minute, buyWei: 0n, sellWei: 0n, trades: 0 };
    const wei = BigInt(trade.ethWei);
    if (trade.side === 'BUY') row.buyWei += wei;
    else row.sellWei += wei;
    row.trades += 1;
    map.set(trade.minute, row);
  }
  return [...map.values()].sort((a, b) => a.minute - b.minute);
}

export function frameAt(trades: Trade[], index: number) {
  const cursor = Math.max(0, Math.min(index, trades.length));
  return { cursor, visible: trades.slice(0, cursor), next: trades[cursor] || null };
}

export function stepBlock(trades: Trade[], cursor: number) {
  const current = trades[Math.max(0, cursor - 1)];
  if (!current) return Math.min(1, trades.length);
  const next = trades.findIndex((trade, index) => index >= cursor && trade.blockNumber !== current.blockNumber);
  return next === -1 ? trades.length : next + 1;
}

export function stepMinute(trades: Trade[], cursor: number) {
  const current = trades[Math.max(0, cursor - 1)];
  if (!current) return Math.min(1, trades.length);
  const next = trades.findIndex((trade, index) => index >= cursor && trade.minute !== current.minute);
  return next === -1 ? trades.length : next + 1;
}
