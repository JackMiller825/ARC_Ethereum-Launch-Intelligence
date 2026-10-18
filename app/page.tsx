"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Bot, Plus, ShieldCheck, TrendingUp, Wallet } from '@/components/icons';
import { DemoBadge, MetricTile, PageHeading, Pill, StatProgress, TradeTable, TrendChart, WindowControls } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { aggregate, durations, selectTrades } from '@/lib/data';
import { formatEth, shortAddr } from '@/lib/format';
import { KPI_HINTS } from '@/lib/analytics/formulas';
import { computeKpis } from '@/lib/chain/kpis';
import { tradesInView } from '@/lib/intervals';
import type { Interval } from '@/lib/types';

export default function Overview() {
  const { ready, active, snapshots, settings } = useWorkspace();
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
  return <>
    <PageHeading eyebrow="COMMAND CENTER / OVERVIEW" title="See the whole launch." description="One intelligence layer for every Ethereum token you launch. Understand buying behavior, automated traders and the actual flow of capital."><Link href="/analysis" className="btn primary"><Plus size={16} /> Analyze token</Link></PageHeading>
    {demo && <DemoBadge />}
    <div className="feature-hero"><div><div className="feature-kicker"><span className="live-dot" /> MULTI-TOKEN INTELLIGENCE</div><h2>Every launch has a story.<br /><em>Read the on-chain truth.</em></h2><p>Reconstruct trades, investigate wallets, compare launches and plan the next move with evidence—not guesswork.</p><div className="feature-actions"><Link href="/analysis" className="btn bright">Explore a token <ArrowRight size={16} /></Link><Link href="/planner" className="btn ghost">Open launch planner</Link></div></div><div className="hero-art"><div className="halo halo-1" /><div className="halo halo-2" /><div className="halo halo-3" /><div className="hero-glow" /><div className="orbit-core"><Activity size={46} /></div><span className="orbit-dot orbit-a" /><span className="orbit-dot orbit-b" /><span className="orbit-dot orbit-c" /></div></div>
    <WindowControls interval={interval} setInterval={setInterval} custom={custom} setCustom={setCustom} />
    {!ready && <div className="panel">Loading the local workspace…</div>}
    {ready && !active && !demo && <div className="data-boundary"><ShieldCheck size={20} /><div><strong>No indexed token yet</strong><p>Overview figures stay blank until you analyze a contract. Synthetic trades are not shown unless demo mode is enabled in Data &amp; settings.</p></div></div>}
    {partial && <div className="data-boundary"><ShieldCheck size={20} /><div><strong>Stored window is shorter than this selection</strong><p>This snapshot covers {active?.window.minutes} minutes, and the figures use that full window. Open the analyzer to index a longer interval.</p></div></div>}
    <div className="metrics-grid">
      <MetricTile hint={KPI_HINTS.grossBuy} label="GROSS BUY VOLUME" value={buy === '—' ? '—' : `${buy} ETH`} sub={demo ? 'Synthetic fixtures' : active ? 'Independent wallets · valued WETH routes' : 'Not indexed'} icon={TrendingUp} tone="green" />
      <MetricTile hint={KPI_HINTS.botBuy} label="AUTOMATED BUY ESTIMATE" value={bot === '—' ? '—' : `${bot} ETH`} sub={share ? `${share.toFixed(1)}% high+medium evidence` : 'No attributed buys'} icon={Bot} tone="blue" />
      <MetricTile hint={KPI_HINTS.net} label="NET ETH FLOW" value={net === '—' ? '—' : `${net} ETH`} sub="Valued buys minus valued sells" icon={Activity} tone="green" />
      <MetricTile hint={KPI_HINTS.buyers} label="UNIQUE BUYER WALLETS" value={buyers} sub="Signers, not unique humans" icon={Wallet} />
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-header"><div><div className="panel-eyebrow">CAPITAL FLOW</div><h3>{active ? active.token.symbol : 'Cumulative trading activity'}</h3></div><Pill kind={demo ? 'amber' : active ? 'green' : 'muted'}>{demo ? 'Illustrative' : active ? 'Chain logs' : 'Empty'}</Pill></div><TrendChart trades={trades} label={demo ? 'Demo cumulative volume' : 'Indexed cumulative volume'} /></section>
      <section className="panel insight-panel"><div className="panel-header"><div><div className="panel-eyebrow">ATTRIBUTION</div><h3>Strategy pulse</h3></div><Bot size={18} className="subtle-icon" /></div><p className="panel-desc">High and medium evidence are the automated estimate. Low and unknown stay outside that total.</p><StatProgress label="Automated share of valued buys" value={share ? `${share.toFixed(1)}%` : '—'} percentage={share} /><StatProgress label="Gross buys vs 20 ETH scenario" value={live ? `${Math.min(100, Number(live.grossBuyWei) / 1e18 / 20 * 100).toFixed(0)}%` : '—'} percentage={live ? Number(live.grossBuyWei) / 1e18 / 20 * 100 : 0} color="blue" /><div className="insight-note"><ShieldCheck size={17} /><span>Evidence labels are ordinal. They are not a probability that a wallet is a bot.</span></div></section>
    </div>
    <div className="dashboard-grid lower">
      <section className="panel"><div className="panel-header"><div><div className="panel-eyebrow">RECENT ACTIVITY</div><h3>Transactions</h3></div><Link href="/analysis" className="text-link">Full analysis <ArrowUpRight size={15} /></Link></div><TradeTable trades={trades.slice(0, 8)} /></section>
      <section className="panel tokens-panel"><div className="panel-header"><div><div className="panel-eyebrow">WATCHLIST</div><h3>Token workspace</h3></div><Link href="/history" className="text-link">View all <ArrowUpRight size={15} /></Link></div>{snapshots.length === 0 && <div className="token-list-row"><div className="token-badge">CA</div><div><strong>No saved tokens</strong><small>Analyze any ERC-20 to pin it here</small></div></div>}{snapshots.map((token, i) => <Link className="token-list-row" href={`/analysis?ca=${token.token.address}`} key={token.token.address}><div className={`token-badge badge-${i % 3}`}>{token.token.symbol.slice(0, 2)}</div><div><strong>{token.token.symbol}</strong><small>{shortAddr(token.token.address)}</small></div><span className="token-demo">{token.window.minutes}m</span><ArrowUpRight size={16} /></Link>)}</section>
    </div>
  </>;
}
