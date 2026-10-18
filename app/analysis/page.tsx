"use client";
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Activity, ArrowRight, Bot, Copy, ExternalLink, ShieldCheck, TrendingUp, Wallet } from '@/components/icons';
import { LiveMonitor } from '@/components/monitor';
import { DemoBadge, ExportButton, ExportJson, MetricTile, PageHeading, Pill, TradeTable, TrendChart, WindowControls } from '@/components/ui';
import { ContractSearchHero } from '@/components/visual';
import { useWorkspace } from '@/components/workspace';
import { durations, REFERENCE_CA, selectTrades, aggregate } from '@/lib/data';
import { formatEth, shortAddr, utcStamp } from '@/lib/format';
import { computeDepth } from '@/lib/analytics/depth';
import { computeFlow } from '@/lib/analytics/flow';
import { reportHtml } from '@/lib/analytics/report';
import { KPI_HINTS } from '@/lib/analytics/formulas';
import { computeKpis, turnoverNote } from '@/lib/chain/kpis';
import { absoluteMinutes, tradesInView } from '@/lib/intervals';
import type { Interval, WindowMode, WindowSpec } from '@/lib/types';

function Analyzer() {
  const qs = useSearchParams();
  const { ready, active, setActive, snapshots, analyze, progress, error, cancel, settings } = useWorkspace();
  const [ca, setCa] = useState(qs.get('ca') || '');
  const [interval, setInterval] = useState<Interval>('1h');
  const [custom, setCustom] = useState(90);
  const [mode, setMode] = useState<WindowMode>('launch');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [localError, setLocalError] = useState('');
  const [tab, setTab] = useState<'overview' | 'transactions' | 'liquidity' | 'wallets' | 'bots' | 'contract' | 'quality'>('overview');
  const minutes = interval === 'custom' ? custom : durations[interval];
  const viewing = active && ca && active.token.address.toLowerCase() === ca.toLowerCase() ? active : null;
  const demoTrades = settings.demoMode && !viewing ? selectTrades(minutes) : [];
  const trades = useMemo(() => viewing ? tradesInView(viewing.trades, viewing.window.mode === 'absolute' ? viewing.window.minutes : minutes, viewing.window.minutes) : demoTrades, [viewing, minutes, demoTrades]);
  const kpis = useMemo(() => viewing ? computeKpis(trades, { initialLiquidityWei: viewing.kpis.initialLiquidityWei ? BigInt(viewing.kpis.initialLiquidityWei) : null, lpEvents: viewing.kpis.lpEvents, t0Block: viewing.timeline.t0Block }) : null, [viewing, trades]);
  const depth = useMemo(() => viewing ? computeDepth(trades, viewing.timeline.t0Timestamp) : null, [viewing, trades]);
  const flow = useMemo(() => kpis ? computeFlow(trades, kpis.botBuyWei, kpis.botSellWei) : null, [kpis, trades]);
  const demo = settings.demoMode && !viewing ? aggregate(demoTrades) : null;

  useEffect(() => {
    const query = qs.get('ca');
    if (!query || !ready) return;
    setCa(query);
    const saved = snapshots.find((item) => item.token.address.toLowerCase() === query.toLowerCase());
    if (saved) {
      setActive(saved);
      const match = (Object.entries(durations) as [Exclude<Interval, 'custom'>, number][]).find(([, value]) => value === saved.window.minutes);
      setInterval(match ? match[0] : 'custom');
      if (!match) setCustom(saved.window.minutes);
      setMode(saved.window.mode);
    }
  }, [qs, ready, snapshots, setActive]);

  async function run(input = ca) {
    setLocalError('');
    let spec: WindowSpec;
    try {
      spec = mode === 'absolute' ? { mode, startIso: new Date(start).toISOString(), endIso: new Date(end).toISOString(), minutes: absoluteMinutes(start, end) } : { mode, minutes };
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Invalid window.');
      return;
    }
    await analyze(input, spec);
  }

  return <>
    <PageHeading eyebrow="RESEARCH / TOKEN ANALYZER" title="Investigate any token." description="Paste an Ethereum contract address. The indexer reads pool events for the window you choose and keeps every gap explicit." />
    <ContractSearchHero value={ca} onChange={setCa} onSubmit={() => { void run(); }} busy={Boolean(progress)} recent={snapshots.slice(0, 4).map((item) => item.token.address)} onNode={(id) => setTab(id === 'flow' ? 'overview' : id === 'liquidity' ? 'liquidity' : id === 'bots' ? 'bots' : id === 'wallets' ? 'wallets' : id === 'quality' ? 'quality' : 'overview')} />
    {(error || localError) && <div className="error-note">{localError || error}</div>}
    {viewing && <div className="token-identity"><div className="identity-icon">{viewing.token.symbol.slice(0, 2)}</div><div className="identity-main"><div className="eyebrow">IDENTIFIED TOKEN</div><h2>{viewing.token.name} <span>/{viewing.token.symbol}</span></h2><div className="identity-address"><code>{viewing.token.address}</code><button type="button" onClick={() => navigator.clipboard.writeText(viewing.token.address)} aria-label="Copy address"><Copy size={15} /></button></div></div><div className="identity-right"><Pill kind="green">{viewing.token.source === 'chain' ? 'On-chain metadata' : 'Blockscout + chain'}</Pill>{viewing.token.verified && <Pill kind="green">Verified</Pill>}<a href={`https://etherscan.io/token/${viewing.token.address}`} target="_blank" rel="noreferrer" className="btn secondary"><ExternalLink size={15} /> Etherscan</a></div></div>}
    {!viewing && !progress && <div className="quick-start"><span>QUICK RESEARCH</span><button type="button" onClick={() => { setCa(REFERENCE_CA); run(REFERENCE_CA); }}>Index $SISH reference <ArrowRight size={15} /></button></div>}
    <div className="data-boundary"><ShieldCheck size={20} /><div><strong>{viewing ? 'Chain reconstruction' : progress ? 'Indexing chain logs' : 'Waiting for an index run'}</strong><p>{viewing ? `T0 ${utcStamp(viewing.timeline.t0Timestamp)} · deploy ${utcStamp(viewing.timeline.deployTimestamp)} · first liquidity ${utcStamp(viewing.timeline.firstLiquidityTimestamp)}. ${turnoverNote(kpis?.turnover ?? null)}` : progress ? progress.detail : 'No synthetic ledger is substituted for a contract. Run Analyze to read Uniswap V2, V3 and V4 logs.'}</p></div></div>
    {settings.demoMode && !viewing && <DemoBadge />}
    <LiveMonitor />
    <WindowControls interval={interval} setInterval={setInterval} custom={custom} setCustom={setCustom} mode={mode} setMode={setMode} />
    {mode === 'absolute' && <div className="parameter-grid" style={{ marginBottom: 16 }}><label>Start (converted to UTC)<div className="input-with-unit"><input aria-label="Window start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div></label><label>End (converted to UTC)<div className="input-with-unit"><input aria-label="Window end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div></label></div>}
    <div className="tabs" role="tablist" aria-label="Analysis sections">{(['overview', 'transactions', 'liquidity', 'wallets', 'bots', 'contract', 'quality'] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item === 'bots' ? 'Bot Activity' : item === 'quality' ? 'Data Quality' : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    {progress && <section className="panel"><div className="panel-eyebrow">INDEXER</div><h3>{progress.stage}</h3><p className="panel-desc">{progress.detail}</p><div className="progress-track"><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><div className="coverage-row"><span>Scanned</span><strong>{progress.blocksScanned ?? '—'}</strong><span>Remaining</span><strong>{progress.blocksRemaining ?? '—'}</strong><span>Scheduled</span><strong>{progress.targetBlocks ?? '—'}</strong></div><div className="coverage-row"><span>Pools</span><strong>{progress.pools ?? '—'}</strong><span>Swaps</span><strong>{progress.swaps ?? '—'}</strong><span>Routes</span><strong>{progress.routes ?? '—'}</strong><span>Wallets</span><strong>{progress.wallets ?? '—'}</strong></div><div className="coverage-row"><span>Retries</span><strong>{progress.retries ?? 0}</strong><span>Gaps</span><strong>{progress.missingRanges ?? 0}</strong><span>Elapsed</span><strong>{progress.elapsedMs ? `${(progress.elapsedMs / 1000).toFixed(1)}s` : '—'}</strong><span>Swap/s</span><strong>{progress.swapsPerSecond ?? '—'}</strong></div><p className="panel-desc">{progress.provisional ? 'Provisional. Unresolved gaps are not shown as complete.' : 'Stage progress comes from completed reads, not a timer.'}</p><button className="btn ghost" type="button" onClick={cancel} style={{ marginTop: 14 }}>Cancel</button></section>}
    {(tab === 'overview' || tab === 'bots') && flow && <div className="metrics-grid"><MetricTile hint={KPI_HINTS.confirmed} label="HIGH-EVIDENCE BUY" value={`${formatEth(flow.confirmedBuyWei)} ETH`} sub="Confirmed pattern volume" icon={ShieldCheck} tone="green" /><MetricTile hint={KPI_HINTS.heuristic} label="MEDIUM-EVIDENCE BUY" value={`${formatEth(flow.heuristicBuyWei)} ETH`} sub="Heuristic, still in the automated total" icon={Bot} tone="blue" /><MetricTile hint={KPI_HINTS.unclassified} label="UNCLASSIFIED BUY" value={`${formatEth(flow.unclassifiedBuyWei)} ETH`} sub={`${flow.unvaluedBuys} buys have no ETH value`} icon={Activity} /><MetricTile hint={KPI_HINTS.net} label="BOT NET FLOW" value={`${formatEth(flow.botNetWei)} ETH`} sub={`Early exits ≤5m: ${flow.earlyExitBuyers.within5m}`} icon={Wallet} tone="red" /></div>}
    {(tab === 'overview' || tab === 'liquidity') && depth && <div className="metrics-grid"><MetricTile label="FIRST MINUTE" value={`${formatEth(depth.firstMinuteBuyWei)} ETH`} sub="Valued buys with minute index 0" icon={Activity} /><MetricTile label="FIRST 5 MINUTES" value={`${formatEth(depth.firstFiveMinuteBuyWei)} ETH`} sub="Valued buys before minute 5" icon={TrendingUp} tone="green" /><MetricTile label="REPEAT BUYERS" value={String(depth.returningBuyers)} sub={`${depth.firstTimeBuyers} single-buy signers in this window`} icon={Wallet} /><MetricTile label="MEDIAN BUY" value={depth.medianBuyWei ? `${formatEth(depth.medianBuyWei)} ETH` : '—'} sub={depth.timeToFirstBuySeconds === null ? 'T0 gap unavailable' : `${depth.timeToFirstBuySeconds}s from T0 to first buy`} icon={Bot} tone="blue" /></div>}
    {tab === 'overview' && <div className="metrics-grid">
      <MetricTile hint={KPI_HINTS.grossBuy} label="GROSS BUY VOLUME" value={kpis ? `${formatEth(kpis.grossBuyWei)} ETH` : demo ? `${demo.buys.toFixed(2)} ETH` : '—'} sub={kpis ? `${kpis.buyCount} economic buys` : demo ? 'Synthetic fixtures' : 'Not indexed'} icon={TrendingUp} tone="green" />
      <MetricTile hint={KPI_HINTS.botBuy} label="BOT-ATTRIBUTED" value={kpis ? `${formatEth(kpis.botBuyWei)} ETH` : demo ? `${demo.botBuys.toFixed(2)} ETH` : '—'} sub={kpis?.botBuyShare !== null && kpis ? `${kpis.botBuyShare.toFixed(1)}% high+medium` : 'Unknown remainder excluded'} icon={Bot} tone="blue" />
      <MetricTile hint={KPI_HINTS.grossSell} label="GROSS SELL VOLUME" value={kpis ? `${formatEth(kpis.grossSellWei)} ETH` : demo ? `${demo.sells.toFixed(2)} ETH` : '—'} sub="Project wallets excluded" icon={Activity} tone="red" />
      <MetricTile hint={KPI_HINTS.buyers} label="BUYER WALLETS" value={kpis ? String(kpis.uniqueBuyers) : demo ? String(demo.buyers) : '—'} sub={kpis ? `${kpis.firstBlockBuyers} in the T0 block` : 'Signers, not humans'} icon={Wallet} />
    </div>}
    {(tab === 'overview' || tab === 'quality') && <div className="dashboard-grid">
      <div className="panel chart-panel"><div className="panel-header"><div><div className="panel-eyebrow">{viewing ? 'INDEXED TIMELINE' : 'TIMELINE'}</div><h3>Flow reconstruction</h3></div><Pill kind={viewing ? 'green' : 'amber'}>{viewing ? viewing.coverage.logSource : 'Not indexed'}</Pill></div><TrendChart trades={trades} /></div>
      <div className="panel insight-panel"><div className="panel-header"><div><div className="panel-eyebrow">COVERAGE</div><h3>Analysis checklist</h3></div></div>{(viewing ? viewing.coverage.items : ['Discover V2, V3 and V4 pools', 'Determine first tradable swap (T0)', 'Decode canonical swap logs', 'Reconstruct ETH purchase routes', 'Exclude liquidity & project self-trades', 'Score automation with evidence', 'Reconcile final transaction counts'].map((label) => ({ id: label, label, state: 'unavailable' as const, detail: 'Not run' }))).map((item) => <div className="coverage-row" key={item.id}><span className="coverage-number">{item.state === 'done' ? 'OK' : item.state === 'partial' ? 'GAP' : '—'}</span>{item.label}<span className="coverage-pending">{item.detail}</span></div>)}{kpis && <p className="panel-desc">{kpis.failedSwapsReason}</p>}</div>
    </div>}
    {viewing && (tab === 'liquidity' || tab === 'contract') && <div className="panel" style={{ marginBottom: 18 }}><div className="panel-header"><div><div className="panel-eyebrow">POOLS</div><h3>Verified venues</h3></div><Pill kind="blue">{viewing.pools.length}</Pill></div>{viewing.pools.map((pool) => <div className="coverage-row" key={`${pool.protocol}-${pool.poolId || pool.address}`}><span className="coverage-number">{pool.protocol}</span><code>{shortAddr(pool.poolId || pool.address)}</code><span className="coverage-pending">{pool.discovery}</span></div>)}{viewing.warnings.length > 0 && <div className="warn-list">{viewing.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}</div>}
      {(tab === 'transactions' || tab === 'wallets') && <div className="panel"><div className="panel-header"><div><div className="panel-eyebrow">TRANSACTION FORENSICS</div><h3>{viewing ? 'Economic trades' : 'Ledger'}</h3></div><div className="feature-actions"><ExportButton trades={trades} filename={viewing ? `${viewing.token.symbol.toLowerCase()}-trades.csv` : 'arc-synthetic-trades.csv'} />{kpis && <ExportJson filename={viewing ? `${viewing.token.symbol.toLowerCase()}-summary.json` : 'arc-summary.json'} payload={{ kpis, flow, depth, duplicateIds: flow?.duplicateIds ?? 0 }} />}{viewing && <button className="btn secondary" type="button" onClick={() => { const blob = new Blob([reportHtml(viewing)], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${viewing.token.symbol.toLowerCase()}-report.html`; a.click(); URL.revokeObjectURL(url); }}>Export HTML</button>}</div></div>{viewing?.coverage.provisional && <p className="panel-desc">Coverage {viewing.coverage.pct}% — incomplete ranges stay visible and are not filled with estimates.</p>}<TradeTable trades={trades} /></div>}
  </>;
}

export default function Analysis() {
  return <Suspense fallback={<div className="panel">Loading analyzer…</div>}><Analyzer /></Suspense>;
}
