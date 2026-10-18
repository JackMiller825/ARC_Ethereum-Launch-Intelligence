import { HEURISTIC_VERSION } from '../chain/constants';
import type { AnalysisSuccess } from '../types';

export function buildReport(snapshot: AnalysisSuccess, generatedAt = new Date().toISOString()) {
  return {
    chainId: 1,
    token: snapshot.token.address,
    name: snapshot.token.name,
    symbol: snapshot.token.symbol,
    period: snapshot.window,
    t0Definition: 'First independent public swap after liquidity, when that swap was found. Same-transaction liquidity is excluded.',
    t0Timestamp: snapshot.timeline.t0Timestamp,
    t0Block: snapshot.timeline.t0Block,
    t0Tx: snapshot.timeline.t0Tx,
    providers: snapshot.coverage.logSource,
    fromBlock: snapshot.coverage.fromBlock,
    toBlock: snapshot.coverage.toBlock,
    headBlock: snapshot.coverage.headBlock,
    coveragePct: snapshot.coverage.pct ?? null,
    provisional: snapshot.coverage.provisional ?? false,
    methodology: HEURISTIC_VERSION,
    limitations: [
      'HIGH and MEDIUM labels are ordinal evidence, not identities.',
      'LOW and UNKNOWN volume is excluded from the automated ETH total.',
      'Routes without a WETH hop stay out of ETH totals.',
      'Failed swaps are unavailable without a trace API.',
      'A signer read failure can change the wallet count without changing ETH totals.',
    ],
    generatedAt,
    kpis: snapshot.kpis,
    warnings: snapshot.warnings,
    evidence: snapshot.trades.slice(0, 50).map((trade) => ({
      txHash: trade.txHash,
      side: trade.side,
      ethWei: trade.ethWei,
      wallet: trade.wallet,
      classification: trade.classification,
      confidence: trade.confidence,
      etherscan: `https://etherscan.io/tx/${trade.txHash}`,
    })),
  };
}

export function reportHtml(snapshot: AnalysisSuccess) {
  const report = buildReport(snapshot);
  const rows = report.evidence.map((item) => `<tr><td>${item.side}</td><td>${item.ethWei || 'unvalued'}</td><td>${item.classification} / ${item.confidence}</td><td><a href="${item.etherscan}">${item.txHash}</a></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${report.symbol} ARC report</title><style>body{font-family:Georgia,serif;background:#fff;color:#111;margin:32px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ccc;text-align:left;padding:6px;font-size:12px}code{font-family:monospace}</style></head><body><h1>${report.name} (${report.symbol})</h1><p>Chain ${report.chainId}. Contract <code>${report.token}</code>.</p><p>Period ${JSON.stringify(report.period)}. T0 ${report.t0Definition}</p><p>Blocks ${report.fromBlock}–${report.toBlock}. Head ${report.headBlock}. Coverage ${report.coveragePct ?? 'n/a'}%. Provisional: ${report.provisional}.</p><p>Providers: ${report.providers}. Methodology ${report.methodology}. Generated ${report.generatedAt}.</p><h2>Limitations</h2><ul>${report.limitations.map((item) => `<li>${item}</li>`).join('')}</ul><h2>Gross buy wei</h2><p>${report.kpis.grossBuyWei}</p><h2>Evidence sample</h2><table><thead><tr><th>Side</th><th>ETH wei</th><th>Label</th><th>Transaction</th></tr></thead><tbody>${rows}</tbody></table><p>Bot labels are not verified identities.</p></body></html>`;
}
