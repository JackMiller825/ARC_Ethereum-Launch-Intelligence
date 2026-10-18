"use client";
import { useMemo, useState } from 'react';
import { computeDepth } from '@/lib/analytics/depth';
import { ExternalLink, Search } from '@/components/icons';
import { DemoBadge, PageHeading, Pill } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { syntheticTrades } from '@/lib/data';
import { formatEth, shortAddr } from '@/lib/format';
import { walletRows } from '@/lib/chain/wallets';

export default function Wallets() {
  const { active, settings, updateLabel, snapshots } = useWorkspace();
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState('');
  const demo = settings.demoMode && !active;
  const rows = useMemo(() => walletRows(demo ? syntheticTrades : active?.trades || []).filter((row) => `${row.address} ${row.classification}`.toLowerCase().includes(term.toLowerCase())), [demo, active, term]);
  const current = rows.find((row) => row.address === selected) || rows[0];
  const trip = useMemo(() => current && active ? computeDepth(active.trades, active.timeline.t0Timestamp).roundTrips.find((item) => item.wallet === current.address.toLowerCase()) : null, [current, active]);
  const [balance, setBalance] = useState('not read');
  const [funding, setFunding] = useState('not read');
  const timeline = useMemo(() => current && active ? active.trades.filter((trade) => trade.wallet.toLowerCase() === current.address.toLowerCase()).slice().sort((a, b) => a.blockNumber - b.blockNumber || a.txIndex - b.txIndex) : [], [current, active]);
  const related = useMemo(() => {
    if (!current || !active) return [];
    return snapshots.filter((item) => item.token.address.toLowerCase() !== active.token.address.toLowerCase() && item.trades.some((trade) => trade.wallet.toLowerCase() === current.address.toLowerCase())).map((item) => item.token.symbol);
  }, [current, active, snapshots]);
  async function readBalance() {
    if (!current) return;
    try {
      const response = await fetch('https://rpc.mevblocker.io', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [current.address, 'latest'] }) });
      const body = await response.json() as { result?: string };
      setBalance(body.result ? `${formatEth(BigInt(body.result).toString())} ETH` : 'unavailable');
    } catch {
      setBalance('unavailable');
    }
  }
  async function readFunding() {
    if (!current) return;
    try {
      const response = await fetch(`https://eth.blockscout.com/api/v2/addresses/${current.address}/transactions`);
      const body = await response.json() as { items?: { hash?: string; from?: { hash?: string }; value?: string; timestamp?: string }[] };
      const first = body.items?.[0];
      setFunding(first?.hash ? `${first.from?.hash || 'unknown'} sent ${first.value || '0'} wei in ${first.hash}` : 'Blockscout returned no transaction on the first page.');
    } catch {
      setFunding('Blockscout funding read failed. No funding source was inferred.');
    }
  }
  return <>
    <PageHeading eyebrow="FORENSICS / WALLET EXPLORER" title="Follow the capital." description="Signer, router and evidence stay separate. Funding from a centralized exchange is not treated as shared control." />
    {demo && <DemoBadge />}
    {!demo && !active && <div className="data-boundary"><Search size={20} /><div><strong>No wallet sample loaded</strong><p>Analyze a token first. This page does not invent holders.</p></div></div>}
    <div className="lookup-box"><div className="lookup-form"><Search size={20} /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter by address or class…" aria-label="Filter wallets" /><span className="muted">{rows.length} wallets</span></div></div>
    <div className="dashboard-grid">
      <div className="panel"><div className="panel-header"><div><div className="panel-eyebrow">WALLETS</div><h3>{demo ? 'Synthetic preview' : active ? active.token.symbol : 'Empty'}</h3></div><Pill kind={demo ? 'amber' : 'green'}>{demo ? 'Demo' : 'Chain'}</Pill></div>
        <div className="table-scroll"><table className="data-table"><caption className="sr-only">Wallet evidence</caption><thead><tr><th>SIGNER</th><th>CLASS</th><th>BUY ETH</th><th>EVIDENCE</th></tr></thead><tbody>{rows.slice(0, 40).map((row) => <tr key={row.address} onClick={() => setSelected(row.address)}><td className="mono">{shortAddr(row.address)} {row.isProject && <Pill kind="amber">PROJECT</Pill>}</td><td>{row.classification}</td><td className="number">{row.buyEth.toFixed(4)}</td><td>{row.confidence}</td></tr>)}</tbody></table></div>
      </div>
      <div className="panel">{current ? <><div className="panel-eyebrow">DRILLDOWN</div><h3 className="mono" style={{ fontSize: 16 }}>{current.address}</h3><div className="scenario-row"><span>ETH balance</span><strong>{balance}</strong></div><button className="btn ghost" type="button" onClick={readBalance}>Read balance</button><div className="scenario-row"><span>Round trip</span><strong>{trip ? `${trip.holdSeconds}s hold · net ${formatEth(trip.netWei)} ETH` : 'No later sell in this window'}</strong></div><div className="scenario-row"><span>Priority fee</span><strong>{timeline.find((trade) => trade.maxPriorityFeePerGas)?.maxPriorityFeePerGas ? `${formatEth(timeline.find((trade) => trade.maxPriorityFeePerGas)?.maxPriorityFeePerGas, 6)} ETH` : 'not on the stored trade'}</strong></div><div className="scenario-row"><span>Other saved launches</span><strong>{related.length ? `${related.join(', ')} · weak association, not shared control` : 'none in this browser'}</strong></div><div className="scenario-row"><span>Funding page</span><strong>{funding}</strong></div><button className="btn ghost" type="button" onClick={readFunding}>Read Blockscout activity</button><div className="panel-eyebrow" style={{ marginTop: 12 }}>TIMELINE</div>{timeline.slice(0, 12).map((trade) => <div className="scenario-row" key={trade.id}><a href={`https://etherscan.io/tx/${trade.txHash}`} target="_blank" rel="noreferrer">{trade.side} · block {trade.blockNumber}</a><strong>{trade.eth === null ? 'unvalued' : `${trade.eth.toFixed(4)} ETH`}</strong></div>)}<div className="scenario-row"><span>Method</span><strong>{current.method}</strong></div><div className="scenario-row"><span>Assisted execution</span><strong>{current.assistedExecution ? 'Ambiguous' : 'Not flagged'}</strong></div><div className="scenario-row"><span>Contract code signal</span><strong>{current.isContractSignal ? 'Yes' : 'Not observed'}</strong></div>{current.evidence.map((item) => <div className="evidence-row" key={item}><span>EV</span>{item}</div>)}<div className="feature-actions" style={{ marginTop: 16 }}><a className="btn secondary" href={`https://etherscan.io/address/${current.address}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Etherscan</a>{!demo && <button className="btn ghost" type="button" onClick={() => updateLabel({ address: current.address, role: current.isProject ? 'independent' : 'project', note: 'Workspace label' })}>{current.isProject ? 'Treat as independent' : 'Mark project wallet'}</button>}</div><p className="panel-desc">Labels apply on the next index run. Re-analyze the token after changing one.</p></> : <p>Select a wallet.</p>}</div>
    </div>
  </>;
}
