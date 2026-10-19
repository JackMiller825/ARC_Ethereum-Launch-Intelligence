import { formatEth } from '../format';
import type { AnalysisSuccess } from '../types';
import { forensicSummary } from './forensics';

export type AssistantCitation = { label: string; href?: string };
export type AssistantAnswer = {
  source: 'rules';
  unknown: boolean;
  answer: string;
  citations: AssistantCitation[];
};

export type AssistantContext = {
  snapshot: AnalysisSuccess | null;
  peers: AnalysisSuccess[];
  brand?: { name: string; ticker: string; overall: number | null; coverage: number };
};

function tx(hash: string): AssistantCitation {
  return { label: hash, href: `https://etherscan.io/tx/${hash}` };
}

export function answerResearch(question: string, context: AssistantContext): AssistantAnswer {
  const ask = question.toLowerCase();
  const snapshot = context.snapshot;
  if (!snapshot && !context.brand) {
    return { source: 'rules', unknown: true, answer: 'No snapshot or brand record is open. No figure was estimated.', citations: [] };
  }
  if (snapshot && /bot|automated|uncertain|unknown share/.test(ask)) {
    const report = forensicSummary(snapshot);
    return { source: 'rules', unknown: snapshot.kpis.botBuyShare === null, answer: report.automated, citations: snapshot.trades.filter((trade) => trade.confidence === 'HIGH' || trade.confidence === 'MEDIUM').slice(0, 3).map((trade) => tx(trade.txHash)) };
  }
  if (snapshot && /first five|first 5|early/.test(ask)) {
    const rows = snapshot.trades.filter((trade) => trade.side === 'BUY' && !trade.isProject && trade.minute < 5);
    const wallets = [...new Set(rows.map((trade) => trade.wallet))];
    if (!rows.length) return { source: 'rules', unknown: true, answer: 'No qualifying independent buys were stored before minute 5.', citations: [] };
    return { source: 'rules', unknown: false, answer: `${wallets.length} independent buyer signers have a minute index under 5. ${rows.length} buys are in that slice.`, citations: rows.slice(0, 5).map((trade) => tx(trade.txHash)) };
  }
  if (snapshot && /liquid/.test(ask)) {
    return { source: 'rules', unknown: snapshot.kpis.initialLiquidityWei === null, answer: forensicSummary(snapshot).liquidity, citations: snapshot.audit.filter((item) => item.kind === 'mint' || item.kind === 'burn').slice(0, 3).map((item) => tx(item.txHash)) };
  }
  if (snapshot && /sold|sell|exit/.test(ask)) {
    const sells = snapshot.trades.filter((trade) => trade.side === 'SELL' && !trade.isProject);
    return { source: 'rules', unknown: sells.length === 0, answer: sells.length ? `${sells.length} independent sells are stored. Gross sell ${formatEth(snapshot.kpis.grossSellWei)} ETH.` : 'No qualifying independent sells were stored in this window.', citations: sells.slice(0, 3).map((trade) => tx(trade.txHash)) };
  }
  if (snapshot && /compar|other saved|versus/.test(ask)) {
    if (!context.peers.length) return { source: 'rules', unknown: true, answer: 'No other saved snapshot is loaded. A comparison was not invented.', citations: [] };
    const lines = context.peers.slice(0, 5).map((item) => `${item.token.symbol || item.token.address} gross buy ${formatEth(item.kpis.grossBuyWei)} ETH over ${item.window.minutes} minutes`);
    return { source: 'rules', unknown: false, answer: `${lines.join('. ')}. Different windows and coverage are not the same experiment. A difference is not a cause.`, citations: [] };
  }
  if (/brand|name|ticker|clarity/.test(ask)) {
    if (!context.brand) return { source: 'rules', unknown: true, answer: 'No brand record was passed in. A name score was not invented.', citations: [] };
    return { source: 'rules', unknown: context.brand.overall === null, answer: `${context.brand.name} / ${context.brand.ticker} editorial coverage ${context.brand.coverage}%. Overall ${context.brand.overall === null ? 'withheld below 40% coverage' : context.brand.overall.toFixed(1)}. This is not a buyer-conversion forecast.`, citations: [] };
  }
  if (snapshot && /buy|flow|increase|happen|summary/.test(ask)) {
    const report = forensicSummary(snapshot);
    const ordered = snapshot.trades.filter((trade) => trade.side === 'BUY' && trade.ethWei).sort((a, b) => a.timestamp - b.timestamp);
    const mid = Math.floor(ordered.length / 2);
    const sum = (rows: typeof ordered) => rows.reduce((total, trade) => total + BigInt(trade.ethWei || '0'), 0n);
    const change = ordered.length >= 2 ? ` Earlier half ${formatEth(sum(ordered.slice(0, mid)).toString())} ETH, later half ${formatEth(sum(ordered.slice(mid)).toString())} ETH, split by stored timestamp.` : '';
    return { source: 'rules', unknown: false, answer: `${report.what} ${report.flow}${change}`, citations: ordered.slice(-3).map((trade) => tx(trade.txHash)) };
  }
  return { source: 'rules', unknown: true, answer: 'This question is not answered from the open records. No transaction, address, or number was estimated.', citations: [] };
}
