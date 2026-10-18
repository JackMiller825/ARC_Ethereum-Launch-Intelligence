"use client";
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, History, Plus } from '@/components/icons';
import { DemoBadge, PageHeading, Pill } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { alignLaunch } from '@/lib/analytics/session';
import { formatEth, shortAddr, utcStamp } from '@/lib/format';
import { sampleTokens } from '@/lib/data';

const comparePresets = [1, 5, 15, 30, 60, 360, 1440];

export default function HistoryPage() {
  const { snapshots, settings, catalog, toggleFavorite } = useWorkspace();
  const [minutes, setMinutes] = useState(15);
  const [picked, setPicked] = useState<string[]>([]);
  const chosen = picked.length ? snapshots.filter((item) => picked.includes(item.token.address.toLowerCase())) : snapshots;
  const rows = useMemo(() => chosen.map((item) => alignLaunch(item, minutes)), [chosen, minutes]);
  return <>
    <PageHeading eyebrow="WORKSPACE / TOKEN HISTORY" title="One place for every launch." description="Snapshots stay in this browser’s IndexedDB, one per contract, with the window and evidence model that produced them."><Link className="btn primary" href="/analysis"><Plus size={16} /> Analyze new CA</Link></PageHeading>
    {settings.demoMode && <><DemoBadge /><div className="history-grid">{sampleTokens.map((token, index) => <div className="history-card" key={token.address}><div className="history-head"><span className={`history-token logo-${index}`}>{token.symbol.slice(0, 2)}</span><Pill kind="amber">Synthetic card</Pill></div><h3>{token.name}</h3><div className="history-ticker">${token.symbol}</div><div className="history-meta"><span>Contract</span><code>{shortAddr(token.address)}</code></div><div className="history-foot">Not an indexed result</div></div>)}</div></>}
    {snapshots.length === 0 && <div className="data-boundary"><History size={20} /><div><strong>History is empty</strong><p>$SISH can be indexed from the analyzer as a real reference contract. Example Alpha and Beta are not stored as if they traded.</p></div></div>}
    {catalog.recents.length > 0 && <p className="panel-desc">Recent contracts: {catalog.recents.map((item) => shortAddr(item)).join(' · ')}</p>}
    <div className="history-grid">{snapshots.map((item, index) => <div className="history-card" key={item.token.address}><div className="history-head"><span className={`history-token logo-${index % 3}`}>{item.token.symbol.slice(0, 2)}</span><Pill kind="green">{item.window.mode}</Pill></div><h3>{item.token.name}</h3><div className="history-ticker">${item.token.symbol}</div><div className="history-meta"><span>Contract</span><code>{shortAddr(item.token.address)}</code></div><div className="history-meta"><span>Gross buy</span><strong>{formatEth(item.kpis.grossBuyWei)} ETH</strong></div><div className="history-meta"><span>Window</span><strong>{item.window.minutes} min</strong></div><div className="history-meta"><span>T0</span><code>{utcStamp(item.timeline.t0Timestamp)}</code></div><div className="feature-actions"><button type="button" className="btn ghost" onClick={() => toggleFavorite(item.token.address)}>{catalog.favorites.includes(item.token.address.toLowerCase()) ? 'Favorited' : 'Favorite'}</button><button type="button" className="btn ghost" onClick={() => setPicked((current) => current.includes(item.token.address.toLowerCase()) ? current.filter((id) => id !== item.token.address.toLowerCase()) : [...current, item.token.address.toLowerCase()])}>{picked.includes(item.token.address.toLowerCase()) ? 'In comparison' : 'Compare'}</button></div><Link href={`/analysis?ca=${item.token.address}`} className="history-foot">Open analysis <ArrowUpRight size={17} /></Link></div>)}</div>
    {snapshots.length > 0 && <section className="panel" style={{ marginTop: 18 }}><div className="panel-eyebrow">COMPARISON</div><h3>Aligned from each token&apos;s own T0</h3><div className="intervals" role="group" aria-label="Comparison interval" style={{ margin: '12px 0' }}>{comparePresets.map((value) => <button key={value} type="button" className={minutes === value ? 'selected' : ''} onClick={() => setMinutes(value)}>{value < 60 ? `${value}m` : `${value / 60}h`}</button>)}</div><div className="table-scroll"><table className="data-table"><caption className="sr-only">Launch comparison aligned to T0</caption><thead><tr><th>TOKEN</th><th>COVERAGE</th><th>GROSS BUY</th><th>GROSS SELL</th><th>BOT SHARE</th><th>BUYERS</th><th>TOP 5</th></tr></thead><tbody>{rows.map((item) => <tr key={item.address}><td>{item.symbol}</td><td>{item.covered ? `${item.requestedMinutes}m` : `Partial ${item.storedMinutes}m`}</td><td>{formatEth(item.grossBuyWei)}</td><td>{formatEth(item.grossSellWei)}</td><td>{item.botBuyShare === null ? '—' : `${item.botBuyShare.toFixed(1)}%`}</td><td>{item.uniqueBuyers}</td><td>{item.concentrationTop5 === null ? '—' : `${item.concentrationTop5.toFixed(1)}%`}</td></tr>)}</tbody></table></div>{rows.map((item) => <p className="panel-desc" key={item.address}>{item.symbol}: {item.note}</p>)}<p className="panel-desc">Differences are observations. They are not attributed to a single cause, and a shorter index is not ranked as if it covered the full preset.</p></section>}
  </>;
}
