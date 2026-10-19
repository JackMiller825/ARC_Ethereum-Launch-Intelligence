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

export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 5, 10, 30] as const;

export function stepTrade(trades: Trade[], cursor: number) {
  return Math.min(trades.length, Math.max(0, cursor) + 1);
}

/** Cursor is the first trade whose timestamp is after the seek point. Missing minutes are not filled. */
export function seekTimestamp(trades: Trade[], timestamp: number) {
  if (!Number.isFinite(timestamp)) return 0;
  const index = trades.findIndex((trade) => trade.timestamp > timestamp);
  return index === -1 ? trades.length : index;
}

export type PrefixPoint = { buyWei: bigint; sellWei: bigint; netWei: bigint; wallets: number; count: number };

export function prefixAggregates(trades: Trade[]): PrefixPoint[] {
  let buyWei = 0n;
  let sellWei = 0n;
  const wallets = new Set<string>();
  return trades.map((trade, index) => {
    if (!trade.isProject && trade.ethWei) {
      const wei = BigInt(trade.ethWei);
      if (trade.side === 'BUY') buyWei += wei;
      else sellWei += wei;
      wallets.add(trade.wallet.toLowerCase());
    }
    return { buyWei, sellWei, netWei: buyWei - sellWei, wallets: wallets.size, count: index + 1 };
  });
}

export function pointAt(points: PrefixPoint[], cursor: number): PrefixPoint {
  if (cursor <= 0 || points.length === 0) return { buyWei: 0n, sellWei: 0n, netWei: 0n, wallets: 0, count: 0 };
  return points[Math.min(cursor, points.length) - 1];
}

export function playbackIntervalMs(speed: number) {
  const safe = PLAYBACK_SPEEDS.includes(speed as (typeof PLAYBACK_SPEEDS)[number]) ? speed : 1;
  return Math.round(800 / safe);
}

export function filterPlayback(trades: Trade[], options: { pool?: string; buys?: boolean; sells?: boolean }) {
  return trades.filter((trade) => {
    if (options.pool && trade.pool.toLowerCase() !== options.pool.toLowerCase()) return false;
    if (options.buys === false && trade.side === 'BUY') return false;
    if (options.sells === false && trade.side === 'SELL') return false;
    return true;
  });
}

export function withoutTransactions(trades: Trade[], hashes: string[]) {
  const removed = new Set(hashes.map((hash) => hash.toLowerCase()));
  return trades.filter((trade) => !removed.has(trade.txHash.toLowerCase()));
}

export type ReplayMarker = {
  kind: 'first-swap' | 'buy' | 'sell' | 'large-buy' | 'large-sell' | 'liquidity' | 'gap' | 'bot-cluster';
  label: string;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  cursor: number;
};

export function timelineMarkers(snapshot: AnalysisSuccess, trades: Trade[]): ReplayMarker[] {
  const valued = trades.filter((trade) => !trade.isProject && trade.ethWei);
  const amounts = valued.map((trade) => BigInt(trade.ethWei || '0')).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const largeCut = amounts.length ? amounts[Math.min(amounts.length - 1, Math.floor(amounts.length * 0.9))] : 0n;
  const markers: ReplayMarker[] = [];
  trades.forEach((trade, index) => {
    if (trade.isProject || !trade.ethWei) return;
    const wei = BigInt(trade.ethWei);
    const large = largeCut > 0n && wei >= largeCut && amounts.length >= 5;
    const kind = index === trades.findIndex((item) => !item.isProject && item.ethWei)
      ? 'first-swap'
      : large
        ? trade.side === 'BUY' ? 'large-buy' : 'large-sell'
        : trade.side === 'BUY' ? 'buy' : 'sell';
    markers.push({
      kind,
      label: kind === 'first-swap' ? 'First valued swap' : `${trade.side} ${trade.classification}`,
      txHash: trade.txHash,
      timestamp: trade.timestamp,
      blockNumber: trade.blockNumber,
      cursor: index + 1,
    });
  });
  const seen = new Set<string>();
  for (let index = 0; index < trades.length; index += 1) {
    const trade = trades[index];
    if (trade.confidence !== 'HIGH' && trade.confidence !== 'MEDIUM') continue;
    const cluster = trades.filter((item, itemIndex) => itemIndex <= index && itemIndex > index - 5 && item.blockNumber === trade.blockNumber && (item.confidence === 'HIGH' || item.confidence === 'MEDIUM'));
    if (cluster.length >= 3 && !seen.has(String(trade.blockNumber))) {
      seen.add(String(trade.blockNumber));
      markers.push({ kind: 'bot-cluster', label: `${cluster.length} heuristic rows share block ${trade.blockNumber}`, txHash: trade.txHash, timestamp: trade.timestamp, blockNumber: trade.blockNumber, cursor: index + 1 });
    }
  }
  snapshot.audit.filter((event) => event.kind === 'mint' || event.kind === 'burn').forEach((event) => {
    const cursor = trades.findIndex((trade) => trade.blockNumber > event.blockNumber || (trade.blockNumber === event.blockNumber && trade.logIndex > event.logIndex));
    markers.push({
      kind: 'liquidity',
      label: event.kind === 'mint' ? 'Liquidity addition' : 'Liquidity removal',
      txHash: event.txHash,
      timestamp: 0,
      blockNumber: event.blockNumber,
      cursor: cursor === -1 ? trades.length : cursor,
    });
  });
  if (snapshot.coverage.provisional) {
    markers.push({
      kind: 'gap',
      label: snapshot.coverage.items.filter((item) => item.state !== 'done').map((item) => item.detail).join(' ') || 'Coverage is provisional. Missing ranges were not filled with trades.',
      txHash: '',
      timestamp: 0,
      blockNumber: snapshot.coverage.toBlock,
      cursor: trades.length,
    });
  }
  return markers;
}

export function nextMarkerCursor(markers: ReplayMarker[], cursor: number) {
  const next = markers.find((marker) => marker.cursor > cursor && marker.kind !== 'buy' && marker.kind !== 'sell');
  return next ? next.cursor : cursor;
}

export function walletSlice(trades: Trade[], wallet: string) {
  const rows = trades.filter((trade) => trade.wallet.toLowerCase() === wallet.toLowerCase());
  let buyWei = 0n;
  let sellWei = 0n;
  for (const trade of rows) {
    if (!trade.ethWei || trade.isProject) continue;
    const wei = BigInt(trade.ethWei);
    if (trade.side === 'BUY') buyWei += wei;
    else sellWei += wei;
  }
  return {
    wallet,
    rows,
    buyWei,
    sellWei,
    netWei: buyWei - sellWei,
    note: rows.length ? 'These rows are the stored swaps for this signer. Funding and later hops that were not indexed are not shown.' : 'This signer has no stored swap in the current playback filter.',
  };
}

export function classCounts(trades: Trade[]) {
  const counts = new Map<string, number>();
  for (const trade of trades) counts.set(trade.classification, (counts.get(trade.classification) || 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

export function explainCutoff(trades: Trade[]) {
  const valued = trades.filter((trade) => !trade.isProject && trade.eth && trade.eth >= 1);
  const buys = valued.filter((trade) => trade.side === 'BUY');
  const sells = valued.filter((trade) => trade.side === 'SELL');
  const lines: { text: string; txHash: string }[] = [];
  if (buys.length >= 3) lines.push({ text: `${buys.length} purchases of at least 1 ETH are inside the current cutoff. That count is not a cause.`, txHash: buys[0].txHash });
  if (sells.length >= 1) lines.push({ text: `${sells.length} sale${sells.length === 1 ? '' : 's'} of at least 1 ETH ${sells.length === 1 ? 'is' : 'are'} inside the current cutoff.`, txHash: sells[0].txHash });
  if (!lines.length) lines.push({ text: 'No purchase or sale of at least 1 ETH is inside this cutoff. Smaller swaps stay in the feed.', txHash: trades.at(-1)?.txHash || '' });
  return lines;
}

export function timelineCsv(trades: Trade[]) {
  const header = 'block,tx_index,log_index,timestamp,tx_hash,wallet,side,eth_wei,classification,confidence,pool,origin';
  const rows = trades.map((trade) => [trade.blockNumber, trade.txIndex, trade.logIndex, trade.timestamp, trade.txHash, trade.wallet, trade.side, trade.ethWei || '', trade.classification, trade.confidence, trade.pool, trade.origin].join(','));
  return [header, ...rows].join('\n');
}
