"use client";
import { useEffect, useMemo, useState } from 'react';
import { PremiumPagination } from '@/components/premium-pagination';
import { LineChart, Play } from '@/components/icons';
import { PageHeading } from '@/components/ui';
import { ResearchAssistant } from '@/components/assistant';
import { useWorkspace } from '@/components/workspace';
import { formatEth, shortAddr } from '@/lib/format';
import { forensicHtml, forensicJson, simulationHtml } from '@/lib/research/reports';
import { forensicSummary } from '@/lib/research/forensics';
import { classCounts, explainCutoff, filterPlayback, frameAt, minuteBuckets, nextMarkerCursor, orderedTrades, playbackIntervalMs, PLAYBACK_SPEEDS, pointAt, prefixAggregates, seekTimestamp, stepBlock, stepMinute, stepTrade, timelineCsv, timelineMarkers, walletSlice, withoutTransactions } from '@/lib/research/replay';
import { concentratedLiquidityLimit, simulateConstantProduct } from '@/lib/research/simulate';
import { pageSlice } from '@/lib/ui/pagination';
import type { ReplayMarker } from '@/lib/research/replay';

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const MARKER_LABEL: Record<ReplayMarker['kind'], string> = {
  'first-swap': 'First swap',
  buy: 'Purchase',
  sell: 'Sale',
  'large-buy': 'Large purchase',
  'large-sell': 'Large sale',
  liquidity: 'Liquidity',
  gap: 'Indexing gap',
  'bot-cluster': 'Heuristic cluster',
};

export default function LaboratoryPage() {
  const { snapshots } = useWorkspace();
  const [address, setAddress] = useState('');
  const [other, setOther] = useState('');
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof PLAYBACK_SPEEDS)[number]>(1);
  const [pool, setPool] = useState('');
  const [showBuys, setShowBuys] = useState(true);
  const [showSells, setShowSells] = useState(true);
  const [seek, setSeek] = useState('');
  const [removed, setRemoved] = useState('');
  const [wallet, setWallet] = useState('');
  const [bookmarks, setBookmarks] = useState<{ label: string; cursor: number }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reserveEth, setReserveEth] = useState('2');
  const [reserveToken, setReserveToken] = useState('1000000');
  const [tradeEth, setTradeEth] = useState('0.5');
  const snapshot = snapshots.find((item) => item.token.address === address) || null;
  const peer = snapshots.find((item) => item.token.address === other) || null;
  const trades = useMemo(() => {
    const ordered = snapshot ? withoutTransactions(orderedTrades(snapshot), removed.split(/\s+/).filter((item) => item.startsWith('0x'))) : [];
    return filterPlayback(ordered, { pool, buys: showBuys, sells: showSells });
  }, [snapshot, pool, showBuys, showSells, removed]);
  const points = useMemo(() => prefixAggregates(trades), [trades]);
  const markers = useMemo(() => snapshot ? timelineMarkers(snapshot, trades) : [], [snapshot, trades]);
  const frame = frameAt(trades, cursor);
  const point = pointAt(points, cursor);
  const visibleFeed = frame.visible.slice().reverse();
  const paged = pageSlice(visibleFeed, page, pageSize);
  const buckets = snapshot ? minuteBuckets(snapshot) : [];
  const peerBuckets = peer ? minuteBuckets(peer) : [];
  const classes = classCounts(frame.visible);
  const notes = explainCutoff(frame.visible);
  const investigation = wallet ? walletSlice(frame.visible, wallet) : null;
  useEffect(() => { setCursor(0); setPlaying(false); setPage(1); }, [address, pool, showBuys, showSells, removed]);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setCursor((value) => {
      const next = Math.min(trades.length, value + 1);
      if (next >= trades.length) setPlaying(false);
      return next;
    }), playbackIntervalMs(speed));
    return () => window.clearInterval(id);
  }, [playing, speed, trades.length]);
  const report = snapshot ? forensicSummary(snapshot) : null;
  const sim = (() => {
    try {
      const eth = BigInt(Math.round(Number(reserveEth) * 1e9)) * 1_000_000_000n;
      const token = BigInt(reserveToken || '0');
      const size = BigInt(Math.round(Number(tradeEth) * 1e9)) * 1_000_000_000n;
      return simulateConstantProduct(eth, token, 30n, [{ side: 'BUY' as const, amountIn: size }]);
    } catch {
      return { ok: false as const, reason: 'Enter numeric reserves and a trade size.' };
    }
  })();
  const implied = frame.visible.filter((trade) => trade.eth && Number(trade.tokenAmount) > 0).at(-1);
  return <>
    <PageHeading eyebrow="RESEARCH / LAUNCH LABORATORY" title="Replay a saved launch." description="Playback walks swaps already stored for a token you indexed. Speed changes how fast the cursor moves. It does not change chain timestamps. Missing minutes stay missing." />
    {snapshots.length === 0 && <div className="data-boundary"><LineChart size={20} /><div><strong>No saved launch is loaded.</strong><p>Index a token first. The laboratory does not generate trades.</p></div></div>}
    <section className="panel"><div className="parameter-grid">
      <label>Saved token<div className="input-with-unit"><select aria-label="Replay token" value={address} onChange={(event) => setAddress(event.target.value)}><option value="">Choose a saved token</option>{snapshots.map((item) => <option key={item.token.address} value={item.token.address}>{item.token.symbol} · {item.window.minutes}m</option>)}</select></div></label>
      <label>Pool<div className="input-with-unit"><select aria-label="Replay pool" value={pool} onChange={(event) => setPool(event.target.value)}><option value="">All stored pools</option>{snapshot?.pools.map((item) => <option key={item.address} value={item.address}>{item.protocol} · {shortAddr(item.address)}</option>)}</select></div></label>
      <label>Seek UTC<div className="input-with-unit"><input aria-label="Seek timestamp" type="datetime-local" value={seek} onChange={(event) => { setSeek(event.target.value); setPlaying(false); const stamp = Date.parse(event.target.value); if (Number.isFinite(stamp)) setCursor(seekTimestamp(trades, Math.floor(stamp / 1000))); }} /></div></label>
      <label>Exclude transaction hashes<div className="input-with-unit"><input aria-label="Excluded transactions" value={removed} onChange={(event) => setRemoved(event.target.value)} placeholder="Local filter. This does not watch a later chain reorganization." /></div></label>
    </div>
      <div className="feature-actions" role="group" aria-label="Event categories">
        <button className={`btn ghost ${showBuys ? 'selected' : ''}`} type="button" onClick={() => setShowBuys((value) => !value)}>Purchases</button>
        <button className={`btn ghost ${showSells ? 'selected' : ''}`} type="button" onClick={() => setShowSells((value) => !value)}>Sales</button>
      </div>
      <div className="feature-actions"><button className="btn primary" type="button" onClick={() => setPlaying((value) => !value)} disabled={!trades.length}><Play size={14} /> {playing ? 'Pause' : 'Play'}</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor((value) => stepTrade(trades, value)); }}>Step trade</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor((value) => stepBlock(trades, value)); }}>Step block</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor((value) => stepMinute(trades, value)); }}>Step minute</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor((value) => nextMarkerCursor(markers, value)); }}>Next marker</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor(0); }}>Reset</button></div>
      <div className="intervals" role="group" aria-label="Playback speed">{PLAYBACK_SPEEDS.map((item) => <button key={item} type="button" className={speed === item ? 'selected' : ''} onClick={() => setSpeed(item)}>{item}×</button>)}</div>
      <p className="panel-desc">{frame.cursor} of {trades.length} stored swaps at {speed}×. Cutoff buy {formatEth(point.buyWei.toString())} ETH, sell {formatEth(point.sellWei.toString())} ETH, net {formatEth(point.netWei.toString())} ETH, signers {point.wallets}. {snapshot?.coverage.provisional ? 'Coverage is provisional. Gaps are marked and are not filled with trades.' : 'Coverage is not marked provisional.'}</p>
      {frame.next && <p className="panel-desc">Next: {frame.next.side} block {frame.next.blockNumber} {frame.next.ethWei ? `${formatEth(frame.next.ethWei)} ETH` : 'unvalued'} <a href={`https://etherscan.io/tx/${frame.next.txHash}`}>transaction</a></p>}
      <div className="feature-actions"><button className="btn ghost" type="button" onClick={() => setBookmarks((rows) => [...rows, { label: `Cutoff ${cursor}`, cursor }])}>Bookmark cutoff</button><button className="btn ghost" type="button" onClick={() => download('arc-replay.csv', timelineCsv(frame.visible), 'text/csv')}>Timeline CSV</button><button className="btn ghost" type="button" onClick={() => download('arc-replay.json', JSON.stringify({ cursor, speed, bookmarks, point: { buyWei: point.buyWei.toString(), sellWei: point.sellWei.toString(), netWei: point.netWei.toString(), wallets: point.wallets }, trades: frame.visible.map((trade) => trade.txHash) }, null, 2), 'application/json')}>Summary JSON</button><button className="btn ghost" type="button" onClick={() => window.print()}>Print</button></div>
      {bookmarks.map((mark) => <button key={`${mark.label}-${mark.cursor}`} className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor(mark.cursor); }}>{mark.label}</button>)}
    </section>
    {snapshot && <section className="panel"><h3>Same cutoff</h3><div className="metric-grid"><div className="metric-tile"><span>Implied swap price</span><strong>{implied ? `${(implied.eth! / Number(implied.tokenAmount)).toPrecision(4)} ETH per token on the last valued swap` : 'No valued swap inside the cutoff'}</strong></div><div className="metric-tile"><span>Cumulative buys</span><strong>{formatEth(point.buyWei.toString())} ETH</strong></div><div className="metric-tile"><span>Cumulative sells</span><strong>{formatEth(point.sellWei.toString())} ETH</strong></div><div className="metric-tile"><span>Net ETH</span><strong>{formatEth(point.netWei.toString())} ETH</strong></div><div className="metric-tile"><span>Signers</span><strong>{point.wallets}</strong></div><div className="metric-tile"><span>Pool reserves</span><strong>Reserve history is not stored on the snapshot, so it is not drawn.</strong></div></div>
      <p className="panel-desc">Evidence classes inside the cutoff: {classes.length ? classes.map((item) => `${item.label} ${item.count}`).join(' · ') : 'none yet'}.</p>
      {notes.map((note) => <p key={note.text} className="panel-desc">{note.text} {note.txHash && <a href={`https://etherscan.io/tx/${note.txHash}`}>source</a>}</p>)}
    </section>}
    {markers.length > 0 && <section className="panel"><h3>Timeline</h3><p className="panel-desc">Each marker names its kind. Color is extra, not the only cue.</p><div className="table-scroll"><table className="data-table"><caption className="sr-only">Replay markers</caption><thead><tr><th>Kind</th><th>Detail</th><th>Block</th></tr></thead><tbody>{markers.slice(0, 40).map((marker) => <tr key={`${marker.kind}-${marker.cursor}-${marker.txHash}`}><td><i className={`marker marker-${marker.kind}`} /> {MARKER_LABEL[marker.kind]}</td><td>{marker.txHash ? <button type="button" className="linkish" onClick={() => { setPlaying(false); setCursor(marker.cursor); }}>{marker.label}</button> : marker.label}</td><td>{marker.blockNumber || '—'}</td></tr>)}</tbody></table></div></section>}
    {paged.rows.length > 0 && <section className="panel"><h3>Transactions through the cutoff</h3><div className="table-scroll"><table className="data-table"><caption className="sr-only">Replay feed</caption><thead><tr><th>Wallet</th><th>Side</th><th>ETH</th><th>Class</th></tr></thead><tbody>{paged.rows.map((trade) => <tr key={trade.id}><td><button type="button" className="linkish" onClick={() => setWallet(trade.wallet)}>{shortAddr(trade.wallet)}</button></td><td>{trade.side}</td><td className="number">{trade.ethWei ? formatEth(trade.ethWei) : '—'}</td><td>{trade.classification} · {trade.confidence}</td></tr>)}</tbody></table><PremiumPagination page={paged.current} pageSize={pageSize} total={visibleFeed.length} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} /></div></section>}
    {investigation && <section className="panel"><h3>Signer {shortAddr(investigation.wallet)}</h3><p className="panel-desc">{investigation.note} Buy {formatEth(investigation.buyWei.toString())} ETH. Sell {formatEth(investigation.sellWei.toString())} ETH.</p>{investigation.rows.map((trade) => <p key={trade.id} className="panel-desc">{trade.side} block {trade.blockNumber} {trade.classification}. <a href={`https://etherscan.io/tx/${trade.txHash}`}>transaction</a></p>)}</section>}
    {report && <section className="panel"><h3>Forensic summary</h3><p>{report.what}</p><p>{report.when}</p><p>{report.who}</p><p>{report.flow}</p><p>{report.automated}</p><p>{report.liquidity}</p><p>{report.unusual}</p><p>{report.unknown}</p><p>{report.completeness}</p><p>{report.needed}</p><p className="panel-desc">Research completeness {report.quality.score ?? '—'}%. {report.quality.note}</p><div className="feature-actions"><button className="btn ghost" type="button" onClick={() => download('arc-forensic.json', forensicJson(report), 'application/json')}>JSON</button><button className="btn ghost" type="button" onClick={() => download('arc-forensic.html', forensicHtml(report), 'text/html')}>HTML</button></div></section>}
    {snapshot && <ResearchAssistant context={{ snapshot, peers: peer ? [peer] : [] }} />}
    <section className="panel"><h3>Hypothetical V2 reserves</h3><p className="panel-desc">{concentratedLiquidityLimit()} This buy is not a historical fill.</p><div className="parameter-grid"><label>ETH reserve<div className="input-with-unit"><input aria-label="ETH reserve" value={reserveEth} onChange={(event) => setReserveEth(event.target.value)} /></div></label><label>Token reserve<div className="input-with-unit"><input aria-label="Token reserve" value={reserveToken} onChange={(event) => setReserveToken(event.target.value)} /></div></label><label>Buy size ETH<div className="input-with-unit"><input aria-label="Buy size" value={tradeEth} onChange={(event) => setTradeEth(event.target.value)} /></div></label></div>{sim.ok ? <p>Impact {sim.steps[0]?.impactBps ?? '—'} bps. Output {sim.steps[0]?.amountOut}. {sim.label}</p> : <p>{sim.reason}</p>}<button className="btn ghost" type="button" onClick={() => download('arc-simulation.html', simulationHtml(sim), 'text/html')}>Export simulation HTML</button></section>
    <section className="panel"><h3>Normalized minutes</h3><div className="parameter-grid"><label>Second saved token<div className="input-with-unit"><select aria-label="Comparison token" value={other} onChange={(event) => setOther(event.target.value)}><option value="">None</option>{snapshots.filter((item) => item.token.address !== address).map((item) => <option key={item.token.address} value={item.token.address}>{item.token.symbol}</option>)}</select></div></label></div><p className="panel-desc">Minutes with no valued swap are left out. Overlapping clocks do not prove one launch caused the other.</p><div className="table-scroll"><table className="data-table"><caption className="sr-only">Minute comparison</caption><thead><tr><th>MINUTE</th><th>BUY</th><th>SELL</th>{peer && <th>{peer.token.symbol} BUY</th>}</tr></thead><tbody>{buckets.map((row) => { const peerRow = peerBuckets.find((item) => item.minute === row.minute); return <tr key={row.minute}><td>{row.minute}</td><td>{formatEth(row.buyWei.toString())}</td><td>{formatEth(row.sellWei.toString())}</td>{peer && <td>{peerRow ? formatEth(peerRow.buyWei.toString()) : '—'}</td>}</tr>; })}</tbody></table></div></section>
  </>;
}
