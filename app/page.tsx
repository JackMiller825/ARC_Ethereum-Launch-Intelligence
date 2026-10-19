"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Bot, Droplets, Plus, Search, ShieldCheck, TrendingDown, TrendingUp, Wallet } from '@/components/icons';
import { DemoBadge, MetricTile, PageHeading, Pill, StatProgress, TradeTable, TrendChart, WindowControls } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { aggregate, durations, selectTrades } from '@/lib/data';
import { formatEth, shortAddr } from '@/lib/format';
import { KPI_HINTS } from '@/lib/analytics/formulas';
import { computeKpis } from '@/lib/chain/kpis';
import { tradesInView } from '@/lib/intervals';
import type { Interval } from '@/lib/types';

export default function Overview() {
  const router = useRouter();
  const { ready, active, snapshots, settings } = useWorkspace();
  const [ca, setCa] = useState('');
  const [interval, setInterval] = useState<Interval>('1h');
  const [custom, setCustom] = useState(90);
  const minutes = interval === 'custom' ? custom : durations[interval];
  const demo = settings.demoMode && !active;
  const trades = useMemo(() => {
    if (demo) return selectTrades(minutes);
    if (!active) return [];
    return tradesInView(active.trades, minutes, active.window.minutes);
  }, [demo, active, minutes]);
  const live = useMemo(() => active ? computeKpis(trades, { initialLiquidityWei: active.kpis.initialLiquidityWei ? BigInt(active.kpis.initialLiquidityWei) : null, lpEvents: active.kpis.lpEvents, t0Block: active.timeline.t0Block }) : null, [active, trades]);
  const demoAgg = demo ? aggregate(trades) : null;
  const buy = live ? formatEth(live.grossBuyWei) : demoAgg ? `${demoAgg.buys.toFixed(2)}` : '—';
  const bot = live ? formatEth(live.botBuyWei) : demoAgg ? `${demoAgg.botBuys.toFixed(2)}` : '—';
  const net = live ? formatEth(live.netWei) : demoAgg ? `${demoAgg.net >= 0 ? '+' : ''}${demoAgg.net.toFixed(2)}` : '—';
  const buyers = live ? String(live.uniqueBuyers) : demoAgg ? String(demoAgg.buyers) : '—';
  const share = live?.botBuyShare ?? demoAgg?.botShare ?? 0;
  const partial = Boolean(active && minutes > active.window.minutes);
  const showDashboard = Boolean(active || demo);
  return <>
    <PageHeading eyebrow="COMMAND CENTER / OVERVIEW" title="Analyze Any Ethereum Token." description="Enter a contract address to investigate an existing token, or evaluate a name and ticker before deployment."><Link href="/analysis" className="btn primary"><Plus size={16} /> Analyze Existing Token</Link></PageHeading>
    <form className="hero-search overview-search" onSubmit={(event) => { event.preventDefault(); const next = ca.trim(); router.push(next ? `/analysis?ca=${encodeURIComponent(next)}` : '/analysis'); }}>
      <Search size={18} />
      <input aria-label="Contract address" value={ca} onChange={(event) => setCa(event.target.value)} placeholder="Paste an Ethereum contract address" spellCheck={false} />
      <button className="btn primary" type="submit">Analyze Existing Token <ArrowRight size={15} /></button>
    </form>
    <div className="feature-actions"><Link href="/analysis" className="btn secondary">Analyze Existing Token</Link><Link href="/brand-intelligence?mode=future" className="btn secondary">Analyze Future Token</Link></div>
    {snapshots.length > 0 && <div className="recent-row">{snapshots.slice(0, 6).map((token) => <Link key={token.token.address} className="pill" href={`/analysis?ca=${token.token.address}`}>{token.token.symbol} · {shortAddr(token.token.address)}</Link>)}</div>}
    {demo && <DemoBadge />}
    {!ready && <div className="panel">Loading the local workspace…</div>}
    {ready && !showDashboard && <section className="search-hero"><div className="search-hero-copy"><div className="feature-kicker"><span className="live-dot" /> NO TOKEN SELECTED</div><h2>Analyze Any Ethereum Token.</h2><p>Enter a contract address to investigate an existing token, or evaluate a name and ticker before deployment. Saved analyses appear only after you run them in this browser.</p><div className="feature-actions"><Link href="/analysis" className="btn primary">Analyze Existing Token</Link><Link href="/brand-intelligence?mode=future" className="btn secondary">Analyze Future Token</Link></div></div></section>}
    {showDashboard && <>
    <WindowControls interval={interval} setInterval={setInterval} custom={custom} setCustom={setCustom} />
    {partial && <div className="data-boundary"><ShieldCheck size={20} /><div><strong>Stored window is shorter than this selection</strong><p>This snapshot covers {active?.window.minutes} minutes, and the figures use that full window. Open the analyzer to index a longer interval.</p></div></div>}
    <div className="metrics-grid">
      <MetricTile href="/analysis" helpId="gross-buy" hint={KPI_HINTS.grossBuy} label="GROSS ETH BUY VOLUME" value={buy === '—' ? '—' : `${buy} ETH`} sub={demo ? 'Synthetic fixtures' : 'Independent wallets · valued WETH routes'} icon={TrendingUp} tone="green" />
      <MetricTile href="/bots" helpId="automated-buy" hint={KPI_HINTS.botBuy} label="AUTOMATED BUY ESTIMATE" value={bot === '—' ? '—' : `${bot} ETH`} sub={share ? `${share.toFixed(1)}% high+medium evidence` : 'No attributed buys'} icon={Bot} tone="blue" />
      <MetricTile href="/analysis" helpId="gross-sell" hint={KPI_HINTS.grossSell} label="GROSS ETH SELL VOLUME" value={live ? `${formatEth(live.grossSellWei)} ETH` : demoAgg ? `${demoAgg.sells.toFixed(2)} ETH` : '—'} sub="Project wallets excluded" icon={TrendingDown} tone="red" />
      <MetricTile href="/analysis" helpId="net-flow" hint={KPI_HINTS.net} label="NET ETH FLOW" value={net === '—' ? '—' : `${net} ETH`} sub="Valued buys minus valued sells" icon={Activity} tone="green" />
      <MetricTile href="/wallets" helpId="buyers" hint={KPI_HINTS.buyers} label="UNIQUE BUYING WALLETS" value={buyers} sub="Signers, not unique humans" icon={Wallet} />
      <MetricTile href="/analysis" label="TRADING ACTIVITY" value={live ? String(live.buyCount + live.sellCount) : demoAgg ? String(demoAgg.buyCount + demoAgg.sellCount) : '—'} sub={live ? `${live.buyCount} buys · ${live.sellCount} sells` : 'Economic trades in view'} icon={Activity} />
      <MetricTile href="/analysis" helpId="liquidity" label="ACTIVE LIQUIDITY" value={live?.initialLiquidityWei ? `${formatEth(live.initialLiquidityWei)} ETH` : '—'} sub={live ? `${live.lpEvents} liquidity events stored` : 'Not reconstructed'} icon={Droplets} tone="blue" />
      <MetricTile href="/settings" helpId="coverage" label="COVERAGE CONFIDENCE" value={active?.coverage.pct === undefined ? '—' : `${active.coverage.pct}%`} sub={active?.coverage.provisional ? 'Provisional' : active ? 'Stored snapshot' : 'Demo has no chain coverage'} icon={ShieldCheck} />
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-header"><div><div className="panel-eyebrow">CAPITAL FLOW</div><h3>{active ? active.token.symbol : 'Cumulative trading activity'}</h3></div><Pill kind={demo ? 'amber' : active ? 'green' : 'muted'}>{demo ? 'Illustrative' : active ? 'Chain logs' : 'Empty'}</Pill></div><TrendChart trades={trades} label={demo ? 'Demo cumulative volume' : 'Indexed cumulative volume'} /></section>
      <section className="panel insight-panel"><div className="panel-header"><div><div className="panel-eyebrow">ATTRIBUTION</div><h3>Strategy pulse</h3></div><Bot size={18} className="subtle-icon" /></div><p className="panel-desc">High and medium evidence are the automated estimate. Low and unknown stay outside that total.</p><StatProgress label="Automated share of valued buys" value={share ? `${share.toFixed(1)}%` : '—'} percentage={share} /><StatProgress label="Gross buys vs 20 ETH scenario" value={live ? `${Math.min(100, Number(live.grossBuyWei) / 1e18 / 20 * 100).toFixed(0)}%` : '—'} percentage={live ? Number(live.grossBuyWei) / 1e18 / 20 * 100 : 0} color="blue" /><div className="insight-note"><ShieldCheck size={17} /><span>Evidence labels are ordinal. They are not a probability that a wallet is a bot.</span></div></section>
    </div>
    <div className="dashboard-grid lower">
      <section className="panel"><div className="panel-header"><div><div className="panel-eyebrow">RECENT ACTIVITY</div><h3>Transactions</h3></div><Link href="/analysis" className="text-link">Full analysis <ArrowUpRight size={15} /></Link></div><TradeTable trades={trades.slice(0, 8)} /></section>
      <section className="panel tokens-panel"><div className="panel-header"><div><div className="panel-eyebrow">WATCHLIST</div><h3>Token workspace</h3></div><Link href="/history" className="text-link">View all <ArrowUpRight size={15} /></Link></div>{snapshots.length === 0 && <div className="token-list-row"><div className="token-badge">CA</div><div><strong>No saved tokens</strong><small>Analyze any ERC-20 to pin it here</small></div></div>}{snapshots.map((token, i) => <Link className="token-list-row" href={`/analysis?ca=${token.token.address}`} key={token.token.address}><div className={`token-badge badge-${i % 3}`}>{token.token.symbol.slice(0, 2)}</div><div><strong>{token.token.symbol}</strong><small>{shortAddr(token.token.address)}</small></div><span className="token-demo">{token.window.minutes}m</span><ArrowUpRight size={16} /></Link>)}</section>
    </div>
    </>}
  </>;
}
