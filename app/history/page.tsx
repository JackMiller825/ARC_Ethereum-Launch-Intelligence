"use client";
import Link from 'next/link';
import { ArrowUpRight, History, Plus } from '@/components/icons';
import { DemoBadge, PageHeading, Pill } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { formatEth, shortAddr, utcStamp } from '@/lib/format';
import { sampleTokens } from '@/lib/data';

export default function HistoryPage() {
  const { snapshots, settings } = useWorkspace();
  return <>
    <PageHeading eyebrow="WORKSPACE / TOKEN HISTORY" title="One place for every launch." description="Snapshots stay in this browser’s IndexedDB, one per contract, with the window and evidence model that produced them."><Link className="btn primary" href="/analysis"><Plus size={16} /> Analyze new CA</Link></PageHeading>
    {settings.demoMode && <><DemoBadge /><div className="history-grid">{sampleTokens.map((token, index) => <div className="history-card" key={token.address}><div className="history-head"><span className={`history-token logo-${index}`}>{token.symbol.slice(0, 2)}</span><Pill kind="amber">Synthetic card</Pill></div><h3>{token.name}</h3><div className="history-ticker">${token.symbol}</div><div className="history-meta"><span>Contract</span><code>{shortAddr(token.address)}</code></div><div className="history-foot">Not an indexed result</div></div>)}</div></>}
    {snapshots.length === 0 && <div className="data-boundary"><History size={20} /><div><strong>History is empty</strong><p>$SISH can be indexed from the analyzer as a real reference contract. Example Alpha and Beta are not stored as if they traded.</p></div></div>}
    <div className="history-grid">{snapshots.map((item, index) => <Link href={`/analysis?ca=${item.token.address}`} className="history-card" key={item.token.address}><div className="history-head"><span className={`history-token logo-${index % 3}`}>{item.token.symbol.slice(0, 2)}</span><Pill kind="green">{item.window.mode}</Pill></div><h3>{item.token.name}</h3><div className="history-ticker">${item.token.symbol}</div><div className="history-meta"><span>Contract</span><code>{shortAddr(item.token.address)}</code></div><div className="history-meta"><span>Gross buy</span><strong>{formatEth(item.kpis.grossBuyWei)} ETH</strong></div><div className="history-meta"><span>Window</span><strong>{item.window.minutes} min</strong></div><div className="history-meta"><span>T0</span><code>{utcStamp(item.timeline.t0Timestamp)}</code></div><div className="history-foot">Open analysis <ArrowUpRight size={17} /></div></Link>)}</div>
    {snapshots.length > 1 && <section className="panel" style={{ marginTop: 18 }}><div className="panel-eyebrow">COMPARISON</div><h3>Same methodology, different launches</h3><div className="table-scroll"><table className="data-table"><caption className="sr-only">Launch comparison</caption><thead><tr><th>TOKEN</th><th>MINUTES</th><th>GROSS BUY</th><th>BUY / MIN</th><th>BOT SHARE</th><th>BUYERS</th></tr></thead><tbody>{snapshots.map((item) => <tr key={item.token.address}><td>{item.token.symbol}</td><td>{item.window.minutes}</td><td>{formatEth(item.kpis.grossBuyWei)}</td><td>{formatEth((BigInt(item.kpis.grossBuyWei) / BigInt(Math.max(1, item.window.minutes))).toString())}</td><td>{item.kpis.botBuyShare === null ? '—' : `${item.kpis.botBuyShare.toFixed(1)}%`}</td><td>{item.kpis.uniqueBuyers}</td></tr>)}</tbody></table></div><p className="panel-desc">Per-minute buy ETH is a normalized comparison. Windows still differ, so read the minute column before ranking launches.</p></section>}
  </>;
}
