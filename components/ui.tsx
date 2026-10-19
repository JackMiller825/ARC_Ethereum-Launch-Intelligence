"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HelpTip } from './help-tip';
import { Clock3, Download } from './icons';
import { shortAddr } from '@/lib/format';
import { durations, INTERVALS, MAX_MINUTES } from '@/lib/intervals';
import type { Confidence, Interval, Trade, WindowMode } from '@/lib/types';

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{children && <div className="heading-actions">{children}</div>}</div>;
}
export function Pill({ children, kind = 'muted' }: { children: React.ReactNode; kind?: 'muted' | 'green' | 'amber' | 'blue' | 'red' }) {
  return <span className={`pill pill-${kind}`}>{children}</span>;
}
const intervals: Interval[] = [...INTERVALS, 'custom'];
const PRIMARY: Interval[] = ['5m', '15m', '1h', '24h', '7d'];
function intervalLabel(item: Interval) { return item === 'custom' ? 'Custom' : item; }
export function IntervalPicker({ value, onChange, custom, onCustomChange }: { value: Interval; onChange: (v: Interval) => void; custom: number; onCustomChange: (n: number) => void }) {
  const [more, setMore] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const visible = PRIMARY.includes(value) ? PRIMARY : [...PRIMARY, value];
  const hidden = intervals.filter((item) => !visible.includes(item));
  useEffect(() => {
    if (!more) return;
    function close(event: MouseEvent) { if (!menu.current?.contains(event.target as Node)) setMore(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [more]);
  return <div className="interval-wrap" data-tour="interval"><div className="intervals" role="group" aria-label="Analysis interval">{visible.map((item) => <button key={item} type="button" className={value === item ? 'selected' : ''} onClick={() => onChange(item)}>{intervalLabel(item)}</button>)}<div className="more-menu" ref={menu}><button type="button" aria-expanded={more} onClick={() => setMore((open) => !open)}>More</button>{more && <div className="more-panel" role="menu">{hidden.map((item) => <button key={item} type="button" role="menuitem" className={value === item ? 'selected' : ''} onClick={() => { onChange(item); setMore(false); }}>{intervalLabel(item)}</button>)}</div>}</div></div>{value === 'custom' && <label className="custom-minutes">Minutes: <input aria-label="Custom minutes" type="number" min={1} max={MAX_MINUTES} value={custom} onChange={(e) => onCustomChange(Math.max(1, Math.min(MAX_MINUTES, Number(e.target.value) || 1)))} /></label>}</div>;
}
export function TimeRangeSelector({ interval, setInterval, custom, setCustom, mode = 'launch', setMode }: { interval: Interval; setInterval: (v: Interval) => void; custom: number; setCustom: (v: number) => void; mode?: WindowMode; setMode?: (mode: WindowMode) => void }) {
  const caption = mode === 'launch' ? 'Since the first public swap · UTC' : mode === 'trailing' ? 'Rolling window from the chain tip' : 'Absolute UTC start and end';
  return <div className="window-controls"><div><span className="control-title"><Clock3 size={15} /> Time range <HelpTip id="coverage" /></span><div className="small-muted">{caption}. Every preset from {durations['1m']} to {durations['30d']} minutes is still available.</div></div><div className="interval-wrap">{setMode && <div className="intervals" role="group" aria-label="Window mode">{(['launch', 'trailing', 'absolute'] as WindowMode[]).map((item) => <button key={item} type="button" className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item === 'launch' ? 'Since launch' : item === 'trailing' ? 'Rolling' : 'Absolute'}</button>)}</div>}<IntervalPicker value={interval} onChange={setInterval} custom={custom} onCustomChange={setCustom} /></div></div>;
}
export const WindowControls = TimeRangeSelector;
export function MetricTile({ label, value, sub, icon: Icon, tone = 'neutral', hint, href, helpId }: { label: string; value: string; sub: string; icon: React.ComponentType<{ size?: number }>; tone?: 'green' | 'red' | 'blue' | 'neutral'; hint?: string; href?: string; helpId?: string }) {
  return <div className="metric-tile" title={hint}><div className="metric-top"><span>{label}{helpId && <HelpTip id={helpId} />}</span><div className={`metric-icon tone-${tone}`}><Icon size={16} /></div></div>{href ? <Link className="metric-value-link" href={href}><div className="metric-value">{value}</div></Link> : <div className="metric-value">{value}</div>}<div className="metric-foot"><span className={`metric-indicator tone-${tone}`} />{sub}</div></div>;
}
export function TrendChart({ trades, label = 'Cumulative buy and sell volume' }: { trades: Trade[]; label?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showBuys, setShowBuys] = useState(true);
  const [showSells, setShowSells] = useState(true);
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
  const x = hover === null ? null : 48 + hover * 57;
  return <div className="trend-chart"><div className="chart-legend"><button type="button" className={showBuys ? '' : 'legend-off'} onClick={() => setShowBuys((value) => !value)}><i className="legend-buy" /> Gross buys</button><button type="button" className={showSells ? '' : 'legend-off'} onClick={() => setShowSells((value) => !value)}><i className="legend-sell" /> Gross sells</button>{hover !== null && <span>{`Bin ${hover + 1}: buy ${buys[hover].toFixed(4)} ETH · sell ${sells[hover].toFixed(4)} ETH cumulative`}</span>}</div><svg viewBox="0 0 740 215" role="img" aria-label={label} preserveAspectRatio="none" onMouseLeave={() => setHover(null)} onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const ratio = (event.clientX - rect.left) / rect.width; const vx = ratio * 740; const index = Math.max(0, Math.min(11, Math.round((vx - 48) / 57))); setHover(index); }}>{[27, 77, 127, 177].map((y, i) => <g key={y}><line x1="48" y1={y} x2="697" y2={y} stroke="rgba(179,163,255,.16)" strokeDasharray="4 5" /><text x="8" y={y + 4} fill="#74748E" fontSize="12">{(peak * (3 - i) / 3).toFixed(1)}</text></g>)}{showBuys && <path d={`${path(buys)} L 675 177 L 48 177 Z`} fill="url(#areaGreen)" opacity=".22" />}{showBuys && <path d={path(buys)} stroke="#36D6A0" strokeWidth="3" fill="none" strokeLinejoin="round" />}{showSells && <path d={path(sells)} stroke="#FB7185" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeDasharray="6 6" />}{x !== null && <line x1={x} y1="20" x2={x} y2="177" stroke="#A78BFA" strokeDasharray="3 3" />}{['T0', '25%', '50%', '75%', 'End'].map((n, i) => <text key={n} x={48 + i * 156} y="205" fill="#74748E" fontSize="12" textAnchor="middle">{n}</text>)}<defs><linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#36D6A0" /><stop offset="1" stopColor="#36D6A0" stopOpacity="0" /></linearGradient></defs></svg></div>;
}
const bar: Record<Confidence, number> = { HIGH: 100, MEDIUM: 66, LOW: 33, UNKNOWN: 8 };
export function TradeTable({ trades }: { trades: Trade[] }) {
  const [start, setStart] = useState(0);
  const [side, setSide] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const filtered = trades.filter((trade) => side === 'ALL' || trade.side === side);
  const windowSize = 24;
  const rows = filtered.slice(start, start + windowSize);
  return <div><div className="intervals" role="group" aria-label="Trade side filter" style={{ marginBottom: 10 }}>{(['ALL', 'BUY', 'SELL'] as const).map((item) => <button key={item} type="button" className={side === item ? 'selected' : ''} onClick={() => { setSide(item); setStart(0); }}>{item}</button>)}</div><div className="table-scroll virtual-table" onScroll={(event) => setStart(Math.min(Math.max(0, filtered.length - windowSize), Math.floor(event.currentTarget.scrollTop / 52)))}><table className="data-table"><caption className="sr-only">Swap ledger with signer, side, evidence class and ETH</caption><thead><tr><th>WALLET / ACTOR</th><th>TYPE</th><th>CLASSIFICATION</th><th>ETH</th><th>EVIDENCE</th><th>TIME</th></tr></thead><tbody>{rows.length === 0 && <tr><td colSpan={6}>No qualifying swaps were found in the selected interval.</td></tr>}{rows.map((t) => <tr key={t.id}><td className="mono"><a href={`https://etherscan.io/address/${t.wallet}`} target="_blank" rel="noreferrer">{shortAddr(t.wallet)}</a> {t.isProject && <Pill kind="amber">PROJECT</Pill>}</td><td><span className={t.side === 'BUY' ? 'buy-label' : 'sell-label'}>{t.side === 'BUY' ? '↗' : '↘'} {t.side}</span></td><td>{t.classification}</td><td className="number">{t.eth === null ? '—' : t.eth.toFixed(4)}</td><td><div className="confidence" title={t.evidence.join(' ')}><div className="confidence-track"><div style={{ width: `${bar[t.confidence] || t.score}%` }} /></div>{t.confidence}</div></td><td className="mono muted"><a href={`https://etherscan.io/tx/${t.txHash}`} target="_blank" rel="noreferrer">{t.timestamp ? new Date(t.timestamp * 1000).toISOString().slice(11, 19) : `+${t.minute}m`}</a></td></tr>)}</tbody></table>{filtered.length > 0 && <p className="panel-desc">Showing {start + 1}–{start + rows.length} of {filtered.length}. Scroll the table to move the window.</p>}</div></div>;
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
export function ExportJson({ payload, filename }: { payload: unknown; filename: string }) {
  function download() {
    const blob = new Blob([JSON.stringify({ methodology: 'ARC economic trades. ETH totals exclude project wallets and routes without a WETH hop. Bot totals are HIGH plus MEDIUM evidence only.', generatedAt: new Date().toISOString(), payload }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return <button className="btn secondary" type="button" onClick={download}><Download size={16} /> Export JSON</button>;
}
export function DemoBadge() {
  return <span className="demo-banner"><span /> SYNTHETIC DEMO DATA · Not actual market activity</span>;
}
export function StatProgress({ label, value, percentage, color = 'green' }: { label: string; value: string; percentage: number; color?: 'green' | 'orange' | 'purple' | 'blue' }) {
  return <div className="stat-progress"><div><span>{label}</span><strong>{value}</strong></div><div className="progress-track"><div className={`progress-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div></div>;
}
