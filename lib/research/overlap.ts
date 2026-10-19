import type { AnalysisSuccess } from '../types';

export type OverlapRow = {
  wallet: string;
  tokens: string[];
  buyWei: bigint;
  sellWei: bigint;
  firstMinute: number | null;
  classes: string[];
};

export function walletOverlap(snapshots: AnalysisSuccess[]): { rows: OverlapRow[]; note: string } {
  const map = new Map<string, OverlapRow>();
  for (const snapshot of snapshots) {
    const symbol = snapshot.token.symbol || snapshot.token.address;
    for (const trade of snapshot.trades) {
      if (trade.isProject) continue;
      const wallet = trade.wallet.toLowerCase();
      const row = map.get(wallet) || { wallet, tokens: [], buyWei: 0n, sellWei: 0n, firstMinute: null, classes: [] };
      if (!row.tokens.includes(symbol)) row.tokens.push(symbol);
      if (trade.ethWei) {
        const wei = BigInt(trade.ethWei);
        if (trade.side === 'BUY') row.buyWei += wei;
        else row.sellWei += wei;
      }
      if (trade.side === 'BUY' && (row.firstMinute === null || trade.minute < row.firstMinute)) row.firstMinute = trade.minute;
      if (!row.classes.includes(trade.classification)) row.classes.push(String(trade.classification));
      map.set(wallet, row);
    }
  }
  return {
    rows: [...map.values()].filter((row) => row.tokens.length > 1).sort((a, b) => b.tokens.length - a.tokens.length || (b.buyWei > a.buyWei ? 1 : -1)),
    note: 'A repeated signer address appeared in more than one saved index. That is not proof of one person, and funding from the same exchange is not treated as shared control.',
  };
}
