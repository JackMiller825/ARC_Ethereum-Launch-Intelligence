import type { AnalysisSuccess } from '../types';

export type ResearchAlert = {
  id: string;
  token: string;
  kind: 'buy' | 'sell' | 'buyers' | 'coverage' | 'liquidity' | 'index';
  at: number;
  summary: string;
  txHash?: string;
};

export type AlertRules = { minBuyEth: number; minSellEth: number; coverageFloor: number; buyerBurst: number };

export const defaultAlertRules: AlertRules = { minBuyEth: 0.5, minSellEth: 0.5, coverageFloor: 90, buyerBurst: 5 };

function meets(value: string | null, eth: number) {
  if (!value || eth <= 0) return false;
  const micro = BigInt(Math.round(eth * 1_000_000));
  return BigInt(value) >= micro * 1_000_000_000_000n;
}

export function diffAlerts(previous: AnalysisSuccess, next: AnalysisSuccess, rules: AlertRules, now = Date.now()): ResearchAlert[] {
  const token = next.token.symbol || next.token.address;
  const seen = new Set(previous.trades.map((trade) => trade.id));
  const fresh = next.trades.filter((trade) => !seen.has(trade.id) && !trade.isProject);
  const alerts: ResearchAlert[] = [];
  for (const trade of fresh) {
    if (trade.side === 'BUY' && meets(trade.ethWei, rules.minBuyEth)) {
      alerts.push({ id: `${token}:buy:${trade.txHash}:${trade.logIndex}`, token, kind: 'buy', at: now, summary: `Buy of at least ${rules.minBuyEth} ETH`, txHash: trade.txHash });
    }
    if (trade.side === 'SELL' && meets(trade.ethWei, rules.minSellEth)) {
      alerts.push({ id: `${token}:sell:${trade.txHash}:${trade.logIndex}`, token, kind: 'sell', at: now, summary: `Sell of at least ${rules.minSellEth} ETH`, txHash: trade.txHash });
    }
  }
  const newBuyers = new Set(fresh.filter((trade) => trade.side === 'BUY').map((trade) => trade.wallet.toLowerCase()));
  if (newBuyers.size >= rules.buyerBurst) {
    alerts.push({ id: `${token}:buyers:${next.coverage.toBlock}`, token, kind: 'buyers', at: now, summary: `${newBuyers.size} new buyer signers in the tail` });
  }
  const pct = next.coverage.pct ?? 100;
  if (pct < rules.coverageFloor) {
    alerts.push({ id: `${token}:coverage:${next.coverage.toBlock}:${pct}`, token, kind: 'coverage', at: now, summary: `Coverage ${pct}% is under the ${rules.coverageFloor}% floor` });
  }
  const prevLp = previous.audit.filter((item) => item.kind === 'mint' || item.kind === 'burn').length;
  const nextLp = next.audit.filter((item) => item.kind === 'mint' || item.kind === 'burn').length;
  if (nextLp > prevLp) {
    alerts.push({ id: `${token}:liquidity:${next.coverage.toBlock}:${nextLp}`, token, kind: 'liquidity', at: now, summary: `${nextLp - prevLp} new liquidity mint or burn logs` });
  }
  return alerts;
}

export function dedupeAlerts(existing: ResearchAlert[], incoming: ResearchAlert[]) {
  const ids = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !ids.has(item.id))].slice(-100);
}
