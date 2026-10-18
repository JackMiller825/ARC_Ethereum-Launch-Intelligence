import type { Trade } from '../types';

const z = 0n;

export type RoundTrip = {
  wallet: string;
  holdSeconds: number;
  buyWei: string;
  sellWei: string;
  netWei: string;
  valued: boolean;
};

export type Depth = {
  firstTimeBuyers: number;
  returningBuyers: number;
  averageBuyWei: string | null;
  medianBuyWei: string | null;
  largestBuys: { wallet: string; ethWei: string; txHash: string }[];
  timeToFirstBuySeconds: number | null;
  firstMinuteBuyWei: string;
  firstFiveMinuteBuyWei: string;
  roundTrips: RoundTrip[];
  medianHoldSeconds: number | null;
};

function wei(value: string | null) {
  return value ? BigInt(value) : z;
}

function median(values: bigint[]) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2n;
}

/** Repeat buyers are signers with two or more buys inside this window. That is not proof they traded before T0. */
export function computeDepth(trades: Trade[], t0Timestamp: number | null): Depth {
  const buys = trades.filter((trade) => trade.side === 'BUY' && !trade.isProject);
  const byWallet = new Map<string, Trade[]>();
  for (const trade of buys) {
    const key = trade.wallet.toLowerCase();
    byWallet.set(key, [...(byWallet.get(key) || []), trade]);
  }
  let firstTime = 0;
  let returning = 0;
  for (const rows of byWallet.values()) {
    if (rows.length >= 2) returning += 1;
    else firstTime += 1;
  }
  const valued = buys.filter((trade) => trade.ethWei);
  const amounts = valued.map((trade) => wei(trade.ethWei));
  const average = amounts.length ? amounts.reduce((sum, value) => sum + value, z) / BigInt(amounts.length) : null;
  const ordered = buys.slice().sort((a, b) => a.timestamp - b.timestamp || a.txIndex - b.txIndex);
  const first = ordered[0];
  const sumMinute = (cap: number) => buys.filter((trade) => trade.minute < cap).reduce((sum, trade) => sum + wei(trade.ethWei), z);
  const trips: RoundTrip[] = [];
  const wallets = new Map<string, Trade[]>();
  for (const trade of trades.filter((item) => !item.isProject)) {
    const key = trade.wallet.toLowerCase();
    wallets.set(key, [...(wallets.get(key) || []), trade]);
  }
  for (const [wallet, rows] of wallets) {
    const orderedRows = rows.slice().sort((a, b) => a.timestamp - b.timestamp || a.txIndex - b.txIndex);
    const buy = orderedRows.find((trade) => trade.side === 'BUY');
    const sell = buy ? orderedRows.find((trade) => trade.side === 'SELL' && trade.timestamp >= buy.timestamp) : undefined;
    if (!buy || !sell) continue;
    const buyWei = wei(buy.ethWei);
    const sellWei = wei(sell.ethWei);
    trips.push({
      wallet,
      holdSeconds: Math.max(0, sell.timestamp - buy.timestamp),
      buyWei: buyWei.toString(),
      sellWei: sellWei.toString(),
      netWei: (sellWei - buyWei).toString(),
      valued: Boolean(buy.ethWei && sell.ethWei),
    });
  }
  const holds = trips.map((trip) => BigInt(trip.holdSeconds));
  return {
    firstTimeBuyers: firstTime,
    returningBuyers: returning,
    averageBuyWei: average === null ? null : average.toString(),
    medianBuyWei: median(amounts)?.toString() ?? null,
    largestBuys: valued
      .slice()
      .sort((a, b) => (wei(a.ethWei) > wei(b.ethWei) ? -1 : 1))
      .slice(0, 5)
      .map((trade) => ({ wallet: trade.wallet, ethWei: trade.ethWei || '0', txHash: trade.txHash })),
    timeToFirstBuySeconds: first && t0Timestamp ? Math.max(0, first.timestamp - t0Timestamp) : null,
    firstMinuteBuyWei: sumMinute(1).toString(),
    firstFiveMinuteBuyWei: sumMinute(5).toString(),
    roundTrips: trips,
    medianHoldSeconds: holds.length ? Number(median(holds)) : null,
  };
}
