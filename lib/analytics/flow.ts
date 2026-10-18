import type { Trade } from '../types';

const z = 0n;

export type Flow = {
  confirmedBuyWei: string;
  heuristicBuyWei: string;
  unclassifiedBuyWei: string;
  botNetWei: string;
  unvaluedBuys: number;
  largestSells: { wallet: string; ethWei: string; txHash: string }[];
  earlyExitBuyers: { within1m: number; within5m: number; within15m: number; within30m: number; within60m: number };
  duplicateIds: number;
};

function wei(value: string | null) {
  return value ? BigInt(value) : z;
}

/** Early exit counts buyers whose first sell is within N seconds of their own first buy. */
export function computeFlow(trades: Trade[], botBuyWei: string, botSellWei: string): Flow {
  const independent = trades.filter((trade) => !trade.isProject);
  const buys = independent.filter((trade) => trade.side === 'BUY');
  const sells = independent.filter((trade) => trade.side === 'SELL');
  const sum = (rows: Trade[]) => rows.reduce((total, trade) => total + wei(trade.ethWei), z);
  const ids = independent.map((trade) => trade.id);
  const byWallet = new Map<string, Trade[]>();
  for (const trade of independent) {
    const key = trade.wallet.toLowerCase();
    byWallet.set(key, [...(byWallet.get(key) || []), trade]);
  }
  const exits = { within1m: 0, within5m: 0, within15m: 0, within30m: 0, within60m: 0 };
  for (const rows of byWallet.values()) {
    const ordered = rows.slice().sort((a, b) => a.timestamp - b.timestamp || a.txIndex - b.txIndex);
    const buy = ordered.find((trade) => trade.side === 'BUY');
    const sell = buy ? ordered.find((trade) => trade.side === 'SELL' && trade.timestamp >= buy.timestamp) : undefined;
    if (!buy || !sell) continue;
    const gap = sell.timestamp - buy.timestamp;
    if (gap <= 60) exits.within1m += 1;
    if (gap <= 300) exits.within5m += 1;
    if (gap <= 900) exits.within15m += 1;
    if (gap <= 1800) exits.within30m += 1;
    if (gap <= 3600) exits.within60m += 1;
  }
  return {
    confirmedBuyWei: sum(buys.filter((trade) => trade.confidence === 'HIGH' && trade.ethWei)).toString(),
    heuristicBuyWei: sum(buys.filter((trade) => trade.confidence === 'MEDIUM' && trade.ethWei)).toString(),
    unclassifiedBuyWei: sum(buys.filter((trade) => (trade.confidence === 'LOW' || trade.confidence === 'UNKNOWN') && trade.ethWei)).toString(),
    botNetWei: (BigInt(botBuyWei || '0') - BigInt(botSellWei || '0')).toString(),
    unvaluedBuys: buys.filter((trade) => !trade.ethWei).length,
    largestSells: sells
      .filter((trade) => trade.ethWei)
      .slice()
      .sort((a, b) => (wei(a.ethWei) > wei(b.ethWei) ? -1 : 1))
      .slice(0, 5)
      .map((trade) => ({ wallet: trade.wallet, ethWei: trade.ethWei || '0', txHash: trade.txHash })),
    earlyExitBuyers: exits,
    duplicateIds: ids.length - new Set(ids).size,
  };
}
