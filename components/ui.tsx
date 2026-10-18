"use client";
import { Clock3, Download } from './icons';
import { shortAddr } from '@/lib/format';
import type { Confidence, Interval, Trade, WindowMode } from '@/lib/types';

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{children && <div className="heading-actions">{children}</div>}</div>;
}
export function Pill({ children, kind = 'muted' }: { children: React.ReactNode; kind?: 'muted' | 'green' | 'amber' | 'blue' | 'red' }) {
  return <span className={`pill pill-${kind}`}>{children}</span>;
}
const intervals: Interval[] = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '24h', '3d', '7d', 'custom'];
export function IntervalPicker({ value, onChange, custom, onCustomChange }: { value: Interval; onChange: (v: Interval) => void; custom: number; onCustomChange: (n: number) => void }) {
  return <div className="interval-wrap"><div className="intervals" role="group" aria-label="Analysis interval">{intervals.map((item) => <button key={item} type="button" className={value === item ? 'selected' : ''} onClick={() => onChange(item)}>{item === 'custom' ? 'Custom' : item}</button>)}</div>{value === 'custom' && <label className="custom-minutes">Minutes: <input aria-label="Custom minutes" type="number" min="1" max="10080" value={custom} onChange={(e) => onCustomChange(Math.max(1, Math.min(10080, Number(e.target.value) || 1)))} /></label>}</div>;
}
export function WindowControls({ interval, setInterval, custom, setCustom, mode = 'launch', setMode }: { interval: Interval; setInterval: (v: Interval) => void; custom: number; setCustom: (v: number) => void; mode?: WindowMode; setMode?: (mode: WindowMode) => void }) {
  return <div className="window-controls"><div><span className="control-title"><Clock3 size={15} /> Analysis window</span><div className="small-muted">{mode === 'launch' ? 'From first public swap · UTC' : mode === 'trailing' ? 'Trailing clock from the chain tip' : 'Absolute UTC range'}</div></div><div className="interval-wrap">{setMode && <div className="intervals" role="group" aria-label="Window mode">{(['launch', 'trailing', 'absolute'] as WindowMode[]).map((item) => <button key={item} type="button" className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item}</button>)}</div>}<IntervalPicker value={interval} onChange={setInterval} custom={custom} onCustomChange={setCustom} /></div></div>;
}
export function MetricTile({ label, value, sub, icon: Icon, tone = 'neutral' }: { label: string; value: string; sub: string; icon: React.ComponentType<{ size?: number }>; tone?: 'green' | 'red' | 'blue' | 'neutral' }) {
  return <div className="metric-tile"><div className="metric-top"><span>{label}</span><div className={`metric-icon tone-${tone}`}><Icon size={17} /></div></div><div className="metric-value">{value}</div><div className="metric-foot"><span className={`metric-indicator tone-${tone}`} />{sub}</div></div>;
}
export function TrendChart({ trades, label = 'Cumulative buy and sell volume' }: { trades: Trade[]; label?: string }) {
  const bins = Array.from({ length: 12 }, (_, i) => {
    const max = Math.max(1, ...trades.map((t) => t.minute)) + 1;
    const arr = trades.filter((t) => t.minute >= i * max / 12 && t.minute < (i + 1) * max / 12 && !t.isProject);
    return { b: arr.filter((t) => t.side === 'BUY').reduce((s, t) => s + (t.eth || 0), 0), s: arr.filter((t) => t.side === 'SELL').reduce((s, t) => s + (t.eth || 0), 0) };
  });
  let cb = 0, cs = 0;
  const buys = bins.map((x) => (cb += x.b));
  const sells = bins.map((x) => (cs += x.s));
  const peak = Math.max(1, ...buys, ...sells);
  const path = (arr: number[]) => arr.map((x, i) => `${i ? 'L' : 'M'} ${48 + i * 57} ${177 - (x / peak) * 150}`).join(' ');
  return <div className="trend-chart"><div className="chart-legend"><span><i className="legend-buy" /> Gross buys</span><span><i className="legend-sell" /> Gross sells</span></div><svg viewBox="0 0 740 215" role="img" aria-label={label} preserveAspectRatio="none">{[27, 77, 127, 177].map((y, i) => <g key={y}><line x1="48" y1={y} x2="697" y2={y} stroke="#29344a" strokeDasharray="4 5" /><text x="8" y={y + 4} fill="#74839b" fontSize="12">{(peak * (3 - i) / 3).toFixed(1)}</text></g>)}<path d={`${path(buys)} L 675 177 L 48 177 Z`} fill="url(#areaGreen)" opacity=".22" /><defs><linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6cecaa" /><stop offset="1" stopColor="#6cecaa" stopOpacity="0" /></linearGradient></defs><path d={path(buys)} stroke="#65e6aa" strokeWidth="3" fill="none" strokeLinejoin="round" /><path d={path(sells)} stroke="#fbab7a" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeDasharray="6 6" />{['T0', '25%', '50%', '75%', 'End'].map((n, i) => <text key={n} x={48 + i * 156} y="205" fill="#74839b" fontSize="12" textAnchor="middle">{n}</text>)}</svg></div>;
}
const bar: Record<Confidence, number> = { HIGH: 100, MEDIUM: 66, LOW: 33, UNKNOWN: 8 };
export function TradeTable({ trades, max = 9 }: { trades: Trade[]; max?: number }) {
  const rows = trades.slice(0, max);
  return <div className="table-scroll"><table className="data-table"><caption className="sr-only">Swap ledger with signer, side, evidence class and ETH</caption><thead><tr><th>WALLET / ACTOR</th><th>TYPE</th><th>CLASSIFICATION</th><th>ETH</th><th>EVIDENCE</th><th>TIME</th></tr></thead><tbody>{rows.length === 0 && <tr><td colSpan={6}>No trades in this window.</td></tr>}{rows.map((t) => <tr key={t.id}><td className="mono"><a href={`https://etherscan.io/address/${t.wallet}`} target="_blank" rel="noreferrer">{shortAddr(t.wallet)}</a> {t.isProject && <Pill kind="amber">PROJECT</Pill>}</td><td><span className={t.side === 'BUY' ? 'buy-label' : 'sell-label'}>{t.side === 'BUY' ? '↗' : '↘'} {t.side}</span></td><td>{t.classification}</td><td className="number">{t.eth === null ? '—' : t.eth.toFixed(4)}</td><td><div className="confidence" title="Ordinal evidence weight, not a probability"><div className="confidence-track"><div style={{ width: `${bar[t.confidence] || t.score}%` }} /></div>{t.confidence}</div></td><td className="mono muted">{t.timestamp ? new Date(t.timestamp * 1000).toISOString().slice(11, 19) : `+${t.minute}m`}</td></tr>)}</tbody></table></div>;
}
export function ExportButton({ trades, filename = 'arc-trades.csv' }: { trades: Trade[]; filename?: string }) {
  function download() {
    const header = 'origin,tx_hash,log_index,block_number,wallet,side,eth_wei,classification,confidence,valuation,is_project,evidence';
    const csv = [header, ...trades.map((t) => [t.origin, t.txHash, t.logIndex, t.blockNumber, t.wallet, t.side, t.ethWei || '', t.classification, t.confidence, t.valuation, t.isProject, `"${t.evidence.join(' | ').replace(/"/g, "'")}"`].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return <button className="btn secondary" onClick={download}><Download size={16} /> Export CSV</button>;
}
export function DemoBadge() {
  return <span className="demo-banner"><span /> SYNTHETIC DEMO DATA · Not actual market activity</span>;
}
export function StatProgress({ label, value, percentage, color = 'green' }: { label: string; value: string; percentage: number; color?: 'green' | 'orange' | 'purple' | 'blue' }) {
  return <div className="stat-progress"><div><span>{label}</span><strong>{value}</strong></div><div className="progress-track"><div className={`progress-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div></div>;
}
