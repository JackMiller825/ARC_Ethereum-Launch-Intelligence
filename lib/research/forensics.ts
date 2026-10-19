import { formatEth } from '../format';
import type { AnalysisSuccess, Trade } from '../types';

export type ResearchEvent = {
  at: number;
  block: number | null;
  label: string;
  detail: string;
  txHash: string | null;
};

export type QualityPart = { id: string; label: string; score: number | null; detail: string };

export type ForensicReport = {
  token: string;
  address: string;
  what: string;
  when: string;
  who: string;
  flow: string;
  automated: string;
  liquidity: string;
  unusual: string;
  unknown: string;
  completeness: string;
  needed: string;
  events: ResearchEvent[];
  quality: { score: number | null; parts: QualityPart[]; note: string };
};

function wei(value: string | null | undefined) {
  if (!value) return 0n;
  try { return BigInt(value); } catch { return 0n; }
}

function largest(trades: Trade[], side: 'BUY' | 'SELL') {
  return trades.filter((trade) => trade.side === side && trade.ethWei).sort((a, b) => (wei(b.ethWei) > wei(a.ethWei) ? 1 : -1))[0] || null;
}

export function researchQuality(snapshot: AnalysisSuccess): ForensicReport['quality'] {
  const parts: QualityPart[] = [
    { id: 'blocks', label: 'Block coverage', score: snapshot.coverage.pct ?? null, detail: snapshot.coverage.pct === undefined ? 'This snapshot has no coverage percentage.' : `${snapshot.coverage.pct}% of the indexed checks passed. Provisional: ${snapshot.coverage.provisional ? 'yes' : 'no'}.` },
    { id: 'pools', label: 'Supported pools', score: snapshot.pools.length ? 100 : 0, detail: snapshot.pools.length ? `${snapshot.pools.length} V2, V3, or V4 pools were stored.` : 'No supported pool was stored.' },
    { id: 'decode', label: 'Swap reconciliation', score: snapshot.coverage.reconciliation.matched ? 100 : 40, detail: snapshot.coverage.reconciliation.matched ? `${snapshot.coverage.reconciliation.economicTrades} economic trades matched the pool WETH total.` : `Raw logs ${snapshot.coverage.reconciliation.rawSwapLogs} and economic trades ${snapshot.coverage.reconciliation.economicTrades} did not match.` },
    { id: 'valuation', label: 'Quote valuation', score: Math.max(0, Math.round(100 - snapshot.kpis.unsupportedValuationPct)), detail: `${snapshot.kpis.unsupportedValuationPct}% of swaps had no reconstructable WETH value.` },
    { id: 'finality', label: 'Reorg status', score: snapshot.coverage.tipHash ? 70 : null, detail: snapshot.coverage.tipHash ? `Tip hash ${snapshot.coverage.tipHash} was stored. The head can still reorganize.` : 'No tip hash was stored.' },
  ];
  const scored = parts.filter((part) => part.score !== null);
  const score = scored.length ? Math.round(scored.reduce((sum, part) => sum + (part.score || 0), 0) / scored.length) : null;
  return { score, parts, note: 'This score measures indexed completeness. It is not a safety rating and not a forecast.' };
}

export function researchTimeline(snapshot: AnalysisSuccess): ResearchEvent[] {
  const events: ResearchEvent[] = [];
  const mark = (at: number | null, label: string, detail: string, txHash: string | null, block: number | null) => {
    if (!at) return;
    events.push({ at, block, label, detail, txHash });
  };
  mark(snapshot.timeline.deployTimestamp, 'Deploy', 'Contract deploy timestamp stored with the snapshot.', null, null);
  mark(snapshot.timeline.poolCreateTimestamp, 'Pool', `${snapshot.pools.length} supported pools were recorded.`, snapshot.pools[0]?.address || null, null);
  mark(snapshot.timeline.firstLiquidityTimestamp, 'First liquidity', `Initial liquidity ${formatEth(snapshot.kpis.initialLiquidityWei)} ETH when the logs support it.`, snapshot.timeline.t0Tx, snapshot.timeline.t0Block);
  mark(snapshot.timeline.t0Timestamp, 'T0', 'First indexed economic swap used as the launch clock.', snapshot.timeline.t0Tx, snapshot.timeline.t0Block);
  for (const item of snapshot.audit) {
    events.push({ at: 0, block: item.blockNumber, label: item.kind, detail: item.reason, txHash: item.txHash });
  }
  const notable = [snapshot.trades[0], largest(snapshot.trades, 'BUY'), largest(snapshot.trades, 'SELL'), snapshot.trades[snapshot.trades.length - 1]].filter((trade): trade is Trade => Boolean(trade));
  const seen = new Set<string>();
  for (const trade of notable) {
    if (seen.has(trade.id)) continue;
    seen.add(trade.id);
    events.push({ at: trade.timestamp, block: trade.blockNumber, label: trade.side, detail: `${trade.wallet} · ${trade.ethWei ? `${formatEth(trade.ethWei)} ETH` : 'unvalued'} · ${trade.classification} ${trade.confidence}`, txHash: trade.txHash });
  }
  return events.sort((a, b) => (a.at || a.block || 0) - (b.at || b.block || 0));
}

export function forensicSummary(snapshot: AnalysisSuccess): ForensicReport {
  const buys = snapshot.trades.filter((trade) => trade.side === 'BUY' && !trade.isProject);
  const buyers = new Set(buys.map((trade) => trade.wallet.toLowerCase()));
  const early = buys.filter((trade) => trade.minute < 5);
  const quality = researchQuality(snapshot);
  const big = largest(snapshot.trades, 'BUY');
  return {
    token: snapshot.token.symbol || snapshot.token.address,
    address: snapshot.token.address,
    what: `${snapshot.trades.length} economic swaps were reconstructed for ${snapshot.token.symbol || 'this token'} in a ${snapshot.window.minutes}-minute ${snapshot.window.mode} window.`,
    when: `T0 ${snapshot.timeline.t0Timestamp ? new Date(snapshot.timeline.t0Timestamp * 1000).toISOString() : 'was not stored'}. Indexed blocks ${snapshot.coverage.fromBlock}–${snapshot.coverage.toBlock}.`,
    who: `${buyers.size} independent buyer signers are in this window. Addresses are signers, not identified people.`,
    flow: `Gross buy ${formatEth(snapshot.kpis.grossBuyWei)} ETH. Gross sell ${formatEth(snapshot.kpis.grossSellWei)} ETH. Net ${formatEth(snapshot.kpis.netWei)} ETH.`,
    automated: snapshot.kpis.botBuyShare === null ? 'Automated share is unknown because there is no valued independent buy.' : `${snapshot.kpis.botBuyShare.toFixed(1)}% of valued independent buys are HIGH or MEDIUM evidence (${snapshot.coverage.heuristicVersion}). LOW and UNKNOWN stay outside that share.`,
    liquidity: `Initial liquidity ${formatEth(snapshot.kpis.initialLiquidityWei)} ETH. ${snapshot.kpis.lpEvents} liquidity events stored.`,
    unusual: big ? `Largest stored buy is ${formatEth(big.ethWei)} ETH in ${big.txHash}. ${early.length} independent buys have a minute index under 5.` : 'No valued buy was stored.',
    unknown: snapshot.warnings.length ? snapshot.warnings.join(' ') : 'Failed swaps are unavailable without a trace endpoint. Wallet identities beyond the signer address are not known.',
    completeness: quality.score === null ? 'Completeness could not be scored.' : `Research completeness ${quality.score}%. ${quality.note}`,
    needed: snapshot.coverage.provisional ? 'Re-index the same window after the listed warnings clear. A wider RPC may fill missing logs. That still will not name the people behind the signers.' : 'The stored window has no provisional flag. Head blocks can still move until they are finalized.',
    events: researchTimeline(snapshot),
    quality,
  };
}
