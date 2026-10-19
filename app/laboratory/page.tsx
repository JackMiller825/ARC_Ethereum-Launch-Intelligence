"use client";
import { useEffect, useMemo, useState } from 'react';
import { LineChart, Play } from '@/components/icons';
import { PageHeading } from '@/components/ui';
import { ResearchAssistant } from '@/components/assistant';
import { useWorkspace } from '@/components/workspace';
import { formatEth } from '@/lib/format';
import { forensicHtml, forensicJson, simulationHtml } from '@/lib/research/reports';
import { forensicSummary } from '@/lib/research/forensics';
import { frameAt, minuteBuckets, orderedTrades, stepBlock, stepMinute } from '@/lib/research/replay';
import { concentratedLiquidityLimit, simulateConstantProduct } from '@/lib/research/simulate';

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function LaboratoryPage() {
  const { snapshots } = useWorkspace();
  const [address, setAddress] = useState('');
  const [other, setOther] = useState('');
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reserveEth, setReserveEth] = useState('2');
  const [reserveToken, setReserveToken] = useState('1000000');
  const [tradeEth, setTradeEth] = useState('0.5');
  const snapshot = snapshots.find((item) => item.token.address === address) || null;
  const peer = snapshots.find((item) => item.token.address === other) || null;
  const trades = useMemo(() => snapshot ? orderedTrades(snapshot) : [], [snapshot]);
  const frame = frameAt(trades, cursor);
  const buckets = snapshot ? minuteBuckets(snapshot) : [];
  const peerBuckets = peer ? minuteBuckets(peer) : [];
  useEffect(() => { setCursor(0); setPlaying(false); }, [address]);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setCursor((value) => Math.min(trades.length, value + 1)), Math.max(80, 400 / speed));
    return () => window.clearInterval(id);
  }, [playing, speed, trades.length]);
  const report = snapshot ? forensicSummary(snapshot) : null;
  const sim = (() => {
    try {
      const eth = BigInt(Math.round(Number(reserveEth) * 1e9)) * 1_000_000_000n;
      const token = BigInt(reserveToken || '0');
      const size = BigInt(Math.round(Number(tradeEth) * 1e9)) * 1_000_000_000n;
      return simulateConstantProduct(eth, token, 30n, [{ side: 'BUY', amountIn: size }]);
    } catch {
      return { ok: false as const, reason: 'Enter numeric reserves and a trade size.' };
    }
  })();
  return <>
    <PageHeading eyebrow="RESEARCH / LAUNCH LABORATORY" title="Replay a saved launch." description="Playback uses swaps already stored for a token you indexed. Quiet minutes are omitted. A missing minute is not filled with a zero." />
    {snapshots.length === 0 && <div className="data-boundary"><LineChart size={20} /><div><strong>No saved launch is loaded.</strong><p>Index a token first. The laboratory does not generate trades.</p></div></div>}
    <section className="panel"><label>Saved token<select aria-label="Replay token" value={address} onChange={(event) => setAddress(event.target.value)}><option value="">Choose a saved token</option>{snapshots.map((item) => <option key={item.token.address} value={item.token.address}>{item.token.symbol} · {item.window.minutes}m</option>)}</select></label>
      <div className="feature-actions"><button className="btn primary" type="button" onClick={() => setPlaying((value) => !value)} disabled={!trades.length}><Play size={14} /> {playing ? 'Pause' : 'Play'}</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor((value) => stepBlock(trades, value)); }}>Step block</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor((value) => stepMinute(trades, value)); }}>Step minute</button><button className="btn ghost" type="button" onClick={() => setSpeed((value) => value === 1 ? 4 : 1)}>Speed {speed}×</button><button className="btn ghost" type="button" onClick={() => { setPlaying(false); setCursor(0); }}>Reset</button></div>
      <p className="panel-desc">{frame.cursor} of {trades.length} stored swaps. {snapshot?.coverage.provisional ? 'Coverage is provisional, so gaps in the log are not quiet markets.' : 'Coverage is not marked provisional.'} {snapshot?.warnings.join(' ')}</p>
      {frame.next && <p className="panel-desc">Next: {frame.next.side} block {frame.next.blockNumber} {frame.next.ethWei ? `${formatEth(frame.next.ethWei)} ETH` : 'unvalued'} <a href={`https://etherscan.io/tx/${frame.next.txHash}`}>transaction</a></p>}
    </section>
    {report && <section className="panel"><h3>Forensic summary</h3><p>{report.what}</p><p>{report.when}</p><p>{report.who}</p><p>{report.flow}</p><p>{report.automated}</p><p>{report.liquidity}</p><p>{report.unusual}</p><p>{report.unknown}</p><p>{report.completeness}</p><p>{report.needed}</p><p className="panel-desc">Research completeness {report.quality.score ?? '—'}%. {report.quality.note}</p><div className="feature-actions"><button className="btn ghost" type="button" onClick={() => download('arc-forensic.json', forensicJson(report), 'application/json')}>JSON</button><button className="btn ghost" type="button" onClick={() => download('arc-forensic.html', forensicHtml(report), 'text/html')}>HTML</button></div></section>}
    {snapshot && <ResearchAssistant context={{ snapshot, peers: peer ? [peer] : [] }} />}
    <section className="panel"><h3>Hypothetical V2 reserves</h3><p className="panel-desc">{concentratedLiquidityLimit()} This buy is not a historical fill.</p><div className="parameter-grid"><label>ETH reserve<input aria-label="ETH reserve" value={reserveEth} onChange={(event) => setReserveEth(event.target.value)} /></label><label>Token reserve<input aria-label="Token reserve" value={reserveToken} onChange={(event) => setReserveToken(event.target.value)} /></label><label>Buy size ETH<input aria-label="Buy size" value={tradeEth} onChange={(event) => setTradeEth(event.target.value)} /></label></div>{sim.ok ? <p>Impact {sim.steps[0]?.impactBps ?? '—'} bps. Output {sim.steps[0]?.amountOut}. {sim.label}</p> : <p>{sim.reason}</p>}<button className="btn ghost" type="button" onClick={() => download('arc-simulation.html', simulationHtml(sim), 'text/html')}>Export simulation HTML</button></section>
    <section className="panel"><h3>Normalized minutes</h3><label>Second saved token<select aria-label="Comparison token" value={other} onChange={(event) => setOther(event.target.value)}><option value="">None</option>{snapshots.filter((item) => item.token.address !== address).map((item) => <option key={item.token.address} value={item.token.address}>{item.token.symbol}</option>)}</select></label><p className="panel-desc">Minutes with no valued swap are left out. Overlapping clocks do not prove one launch caused the other.</p><div className="table-scroll"><table className="data-table"><caption className="sr-only">Minute comparison</caption><thead><tr><th>MINUTE</th><th>BUY</th><th>SELL</th>{peer && <th>{peer.token.symbol} BUY</th>}</tr></thead><tbody>{buckets.map((row) => { const peerRow = peerBuckets.find((item) => item.minute === row.minute); return <tr key={row.minute}><td>{row.minute}</td><td>{formatEth(row.buyWei.toString())}</td><td>{formatEth(row.sellWei.toString())}</td>{peer && <td>{peerRow ? formatEth(peerRow.buyWei.toString()) : '—'}</td>}</tr>; })}</tbody></table></div></section>
  </>;
}
