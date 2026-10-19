import type { ForensicReport } from './forensics';
import type { SimResult } from './simulate';

export function reportStamp(now = Date.now()) {
  return new Date(now).toISOString();
}

export function forensicJson(report: ForensicReport, now = Date.now()) {
  return JSON.stringify({ generatedAt: reportStamp(now), kind: 'forensic', hypothetical: false, ...report }, null, 2);
}

export function forensicCsv(report: ForensicReport) {
  const lines = ['section,text', ...['what', 'when', 'who', 'flow', 'automated', 'liquidity', 'unusual', 'unknown', 'completeness', 'needed'].map((key) => `${key},"${String(report[key as keyof ForensicReport]).replace(/"/g, '""')}"`)];
  return lines.join('\n');
}

export function forensicHtml(report: ForensicReport, now = Date.now()) {
  const rows = report.events.slice(0, 40).map((event) => `<li>${event.label}: ${event.detail}${event.txHash ? ` <a href="https://etherscan.io/tx/${event.txHash}">${event.txHash}</a>` : ''}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>ARC research ${report.token}</title></head><body><h1>${report.token}</h1><p>Generated ${reportStamp(now)}. Chain evidence from the stored snapshot. Not a forecast.</p><p>${report.what}</p><p>${report.flow}</p><p>${report.completeness}</p><ol>${rows}</ol><p>${report.unknown}</p></body></html>`;
}

export function simulationHtml(result: SimResult, now = Date.now()) {
  if (!result.ok) return `<!doctype html><html><body><p>Generated ${reportStamp(now)}. ${result.reason}</p></body></html>`;
  const rows = result.steps.map((step) => `<li>${step.side} in ${step.amountIn} out ${step.amountOut} impact ${step.impactBps ?? '—'} bps</li>`).join('');
  return `<!doctype html><html><body><h1>Hypothetical liquidity</h1><p>${result.label} Generated ${reportStamp(now)}.</p><ol>${rows}</ol></body></html>`;
}
