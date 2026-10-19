"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download, ShieldCheck, Target } from '@/components/icons';
import { PageHeading, Pill } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { liquidityScenarios } from '@/lib/analytics/liquidity';
import { analyzeBrand } from '@/lib/brand/score';
import { saveBrandAnalysis } from '@/lib/store/idb';
import { formatEth } from '@/lib/format';
import { MAX_MINUTES } from '@/lib/intervals';
import { turnoverNote } from '@/lib/chain/kpis';
import type { Playbook } from '@/lib/types';

const steps = [
  { name: 'Brand identity', tag: 'PRE-DEPLOY', items: ['Choose a name and ticker before deployment', 'Review the editorial score and its coverage', 'Read collision findings and their source limits', 'Save the preferred candidate in this plan'] },
  { name: 'Foundation & contract checks', tag: 'PRE-LAUNCH', items: ['Verify deployed contract and ERC-20 metadata', 'Independently test successful buy AND sell paths', 'Identify admin rights, taxes and trading restrictions', 'Disclose project/insider allocations and wallets'] },
  { name: 'Liquidity and execution design', tag: 'PRE-LAUNCH', items: ['Choose pool protocol and initial ETH/token reserves', 'Calculate trade-size slippage scenarios', 'Confirm LP lock/burn method actually applies to this pool', 'Test routing, pricing, fee tiers and gas costs'] },
  { name: 'Discovery readiness', tag: 'T−15', items: ['Publish verified CA and direct router link', 'Prepare accurate website, X and Telegram information', 'Prepare read-only wallet/pool observability', 'Avoid fake buys, fabricated attention and wash trades'] },
  { name: 'Trading open: first successful swap', tag: 'T0', items: ['Capture pool deployment and activation independently', 'Record earliest successful external swap block', 'Confirm receipt, router path and effective price', 'Announce only verified on-chain launch status'] },
  { name: 'Automated buyer monitoring', tag: 'LIVE', items: ['Collect swaps with tx/log indexes and traces', 'Track gross buys, gross sells and unique wallets', 'Flag likely automated behavior with explanatory evidence', 'Check project-associated wallet exclusion and anomalies'] },
  { name: 'Market-responsive review', tag: 'ADAPTIVE', items: ['Review liquidity, failures and concentration on each checkpoint', 'Compare bot buys with subsequent bot sells', 'Publish factual status only; do not imply returns', 'Extend or shorten analysis window as market conditions change'] },
  { name: 'Post-window audit and replay', tag: 'AFTER', items: ['Reconcile raw logs, pool flows and route-level trades', 'Finalize bot confidence labels and unknown share', 'Compare against historical launches under same methodology', 'Export complete evidence-based performance report'] },
];

export default function Planner() {
  const { playbook, updatePlaybook, snapshots, active } = useWorkspace();
  const [draft, setDraft] = useState<Playbook>(playbook);
  const [gas, setGas] = useState<string>('');
  const [ethPrice, setEthPrice] = useState('not read');
  const scenarios = liquidityScenarios(draft.initialEth, Number(draft.tokenToLp) || 0);
  useEffect(() => { setDraft(playbook); }, [playbook]);
  const bot = draft.grossBuyGoal * draft.botShare / 100;
  const botSell = bot * draft.botSellRatio / 100;
  const all = steps.flatMap((step) => step.items);
  const toggle = (item: string) => setDraft((current) => ({ ...current, completed: current.completed.includes(item) ? current.completed.filter((value) => value !== item) : [...current.completed, item] }));
  const baseline = draft.tokenAddress ? snapshots.find((item) => item.token.address.toLowerCase() === draft.tokenAddress.toLowerCase()) || null : null;
  async function readGas() {
    try {
      const response = await fetch('https://rpc.mevblocker.io', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }) });
      const body = await response.json() as { result?: string };
      if (!body.result) throw new Error('Gas price unavailable');
      setGas((Number(BigInt(body.result)) / 1e9).toFixed(2));
    } catch {
      setGas('unavailable');
    }
    try {
      const price = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
      const body = await price.json() as { data?: { amount?: string } };
      setEthPrice(body.data?.amount ? `$${Number(body.data.amount).toFixed(2)}` : 'unavailable');
    } catch {
      setEthPrice('unavailable');
    }
  }
  return <>
    <PageHeading eyebrow="STRATEGY / LAUNCH PLANNER" title="Engineer Your Next Launch." description="A research checklist with editable liquidity scenarios, monitoring assumptions, and an indexed baseline when you have one. These figures are hypothetical inputs, not a forecast."><button className="btn secondary" onClick={() => updatePlaybook(draft)}><Download size={15} /> Save plan</button></PageHeading>
    <div className="stepper" aria-label="Planner steps">{steps.map((step, index) => <button key={step.name} type="button" className={draft.completed.some((item) => step.items.includes(item)) ? 'selected' : ''} onClick={() => document.getElementById(`plan-step-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span>0{index + 1}</span><strong>{['Brand', 'Project', 'Contract', 'Liquidity', 'Comparisons', 'Monitoring', 'Checklist', 'Post-launch'][index]}</strong></button>)}</div>
    <div className="data-boundary"><Target size={20} /><div><strong>Plan, not a purchase-trigger engine</strong><p>Assumptions are scenarios. They do not predict buyers, returns, or a way to manufacture volume. The checklist asks for a verified contract, real liquidity and plain-language risk reporting.</p></div></div>
    <section className="panel"><div className="panel-eyebrow">00 / BRAND IDENTITY</div><h3>{draft.tokenName || 'Name not set'} / {draft.ticker || 'ticker not set'}</h3><p className="panel-desc">This stage runs before a contract exists. It does not create holder data or volume. {draft.brandCandidateId ? `Saved candidate ${draft.brandCandidateId}.` : 'No brand record is linked yet.'}</p><div className="feature-actions"><Link className="btn secondary" href={`/brand-intelligence?mode=future&name=${encodeURIComponent(draft.tokenName)}&ticker=${encodeURIComponent(draft.ticker)}`}>Open full rubric</Link><button className="btn ghost" type="button" onClick={() => { if (!draft.tokenName && !draft.ticker) return; const record = analyzeBrand({ name: draft.tokenName, ticker: draft.ticker, mode: draft.plannedAddress ? 'existing' : 'future', address: draft.plannedAddress, narrative: draft.name }, { now: Date.now() }); void saveBrandAnalysis(record); setDraft({ ...draft, brandCandidateId: record.candidateId }); }}>Score and keep in this plan</button></div>{draft.plannedAddress && <p className="panel-desc">Planned contract {draft.plannedAddress} can be linked later. Earlier editorial scores stay stored and are not rewritten from trading results.</p>}</section>
    <div className="planner-layout"><div>
      <section className="panel planner-parameters"><div className="panel-header"><div><div className="panel-eyebrow">01 / LAUNCH ASSUMPTIONS</div><h3>Configure your scenario</h3></div><Pill kind="blue">Editable</Pill></div>
        <div className="parameter-grid">
          <label>Playbook name<div className="input-with-unit"><input data-tour="planner-name" aria-label="Playbook name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div></label>
          <label>Market regime<div className="input-with-unit"><input aria-label="Market regime" value={draft.regime} onChange={(e) => setDraft({ ...draft, regime: e.target.value })} /></div></label>
          <label>ETH-side initial liquidity<div className="input-with-unit"><input type="number" min=".1" step=".1" value={draft.initialEth} onChange={(e) => setDraft({ ...draft, initialEth: Math.max(0.1, Number(e.target.value) || 0.1) })} /><span>ETH</span></div></label>
          <label>Gross buy goal<div className="input-with-unit"><input type="number" min="0" step="1" value={draft.grossBuyGoal} onChange={(e) => setDraft({ ...draft, grossBuyGoal: Math.max(0, Number(e.target.value) || 0) })} /><span>ETH</span></div></label>
          <label>Analysis window<div className="input-with-unit"><input type="number" min="1" max={MAX_MINUTES} value={draft.windowMinutes} onChange={(e) => setDraft({ ...draft, windowMinutes: Math.max(1, Math.min(MAX_MINUTES, Number(e.target.value) || 1)) })} /><span>MIN</span></div></label>
          <label>Token name<div className="input-with-unit"><input aria-label="Planned token name" value={draft.tokenName} onChange={(e) => setDraft({ ...draft, tokenName: e.target.value })} /></div></label>
          <label>Ticker<div className="input-with-unit"><input aria-label="Planned ticker" value={draft.ticker} onChange={(e) => setDraft({ ...draft, ticker: e.target.value })} /></div></label>
          <label>Planned contract<div className="input-with-unit"><input aria-label="Planned contract" value={draft.plannedAddress} onChange={(e) => setDraft({ ...draft, plannedAddress: e.target.value })} placeholder="Optional 0x address" /></div></label>
          <label>Tokens allocated to the pool<div className="input-with-unit"><input aria-label="Token allocation" value={draft.tokenToLp} onChange={(e) => setDraft({ ...draft, tokenToLp: e.target.value })} placeholder="Whole tokens" /></div></label>
          <label>Planned total supply<div className="input-with-unit"><input aria-label="Planned supply" value={draft.plannedSupply} onChange={(e) => setDraft({ ...draft, plannedSupply: e.target.value })} placeholder="Whole tokens" /></div></label>
          <label>Data-quality threshold<div className="input-with-unit"><input aria-label="Quality threshold" type="number" min="1" max="100" value={draft.qualityThreshold} onChange={(e) => setDraft({ ...draft, qualityThreshold: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} /><span>%</span></div></label>
          <label>Operational budget<div className="input-with-unit"><input aria-label="Operational budget" type="number" min="0" step="0.1" value={draft.operationalBudget} onChange={(e) => setDraft({ ...draft, operationalBudget: Math.max(0, Number(e.target.value) || 0) })} /><span>ETH</span></div></label>
          <label>Pool type<div className="input-with-unit"><select aria-label="Pool type" value={draft.poolType} onChange={(e) => setDraft({ ...draft, poolType: e.target.value as Playbook['poolType'] })} style={{ width: '100%', background: 'transparent', color: 'inherit', border: 0, padding: 12 }}><option value="v2">Uniswap V2</option><option value="v3">Uniswap V3</option><option value="v4">Uniswap V4</option></select></div></label>
          <label>Expected start (local, stored as text)<div className="input-with-unit"><input aria-label="Expected start" type="datetime-local" value={draft.expectedStart} onChange={(e) => setDraft({ ...draft, expectedStart: e.target.value })} /></div></label>
          <label>Automated buy share<div className="input-with-unit"><input type="number" min="0" max="100" value={draft.botShare} onChange={(e) => setDraft({ ...draft, botShare: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} /><span>%</span></div></label>
          <label>Bot sell / bot buy ratio<div className="input-with-unit"><input type="number" min="0" max="250" value={draft.botSellRatio} onChange={(e) => setDraft({ ...draft, botSellRatio: Math.max(0, Math.min(250, Number(e.target.value) || 0)) })} /><span>%</span></div></label>
          <label>Compare with saved token<div className="input-with-unit"><select aria-label="Baseline token" value={draft.tokenAddress} onChange={(e) => setDraft({ ...draft, tokenAddress: e.target.value })} style={{ width: '100%', background: 'transparent', color: 'inherit', border: 0, padding: 12 }}><option value="">None</option>{snapshots.map((item) => <option key={item.token.address} value={item.token.address}>{item.token.symbol}</option>)}</select></div></label>
        </div>
        <label className="check-row" style={{ marginTop: 16 }}><input type="checkbox" checked={draft.openEnded} onChange={(e) => setDraft({ ...draft, openEnded: e.target.checked })} /><span>Open-ended monitoring. Custom minute window is a checkpoint, not a promise the market ends there.</span></label>
      </section>
      <section className="panel plan-steps"><div className="panel-header"><div><div className="panel-eyebrow">02 / EXECUTION</div><h3>Step-by-step launch protocol</h3></div><Pill kind="green">{draft.completed.length}/{all.length} complete</Pill></div>{steps.map((step, index) => <div className="step-section" id={`plan-step-${index}`} key={step.name}><div className="step-heading"><span className="step-num">{String(index + 1).padStart(2, '0')}</span><div><h4>{step.name}</h4><small>{step.tag}</small></div><span>{step.items.filter((item) => draft.completed.includes(item)).length}/{step.items.length}</span></div><div className="step-items">{step.items.map((item) => <label key={item} className="check-row"><input type="checkbox" checked={draft.completed.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}</div></div>)}</section>
    </div><div>
      <section className="panel sticky-plan"><div className="panel-eyebrow">SCENARIO OUTPUT</div><h3>Live plan mathematics</h3><div className="big-scenario"><small>MODELED BOT BUY VOLUME</small><strong>{bot.toFixed(2)} <em>ETH</em></strong><div>Scenario: {draft.botShare}% of a {draft.grossBuyGoal} ETH gross-buy goal</div></div><div className="scenario-row"><span>Assumed bot sells</span><strong>{botSell.toFixed(2)} ETH</strong></div><div className="scenario-row"><span>Modeled net bot flow</span><strong className={bot - botSell >= 0 ? 'positive' : 'negative'}>{(bot - botSell).toFixed(2)} ETH</strong></div><div className="scenario-row"><span>Goal / ETH reserve</span><strong>{(draft.grossBuyGoal / draft.initialEth).toFixed(1)}×</strong></div><div className="scenario-row"><span>Current gas</span><strong>{gas ? `${gas} gwei` : 'not read'}</strong></div><div className="scenario-row"><span>ETH spot</span><strong>{ethPrice}</strong></div><p className="panel-desc">{gas && gas !== 'unavailable' ? `Gas is ${gas} gwei against a 30 gwei reference used only as context. Recent launch counts are unavailable because no launch-index provider is configured.` : 'Market conditions stay unscored until gas is read. No launch minute is recommended.'}</p><button className="btn secondary" type="button" onClick={readGas}>Read gas</button><div className="scenario-note"><ShieldCheck size={16} /> {turnoverNote(draft.initialEth ? draft.grossBuyGoal / draft.initialEth : null)} Scenarios are not forecasts.</div><button className="btn ghost" style={{ marginTop: 12 }} onClick={() => { const a = document.createElement('a'); a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draft, null, 2)); a.download = 'arc-launch-plan.json'; a.click(); }}>Export JSON</button>{scenarios.length > 0 && <div style={{ marginTop: 16 }}><div className="panel-eyebrow">V2 WHAT-IF</div>{scenarios.map((row) => <div className="scenario-row" key={row.eth}><span>{row.eth} ETH buy</span><strong>{row.impactBps === null ? '—' : `${row.impactBps} bps`}</strong></div>)}<p className="panel-desc">Constant-product impact versus the spot reserve ratio, 30 bps fee. Hypothetical. V3 and V4 concentrated liquidity are not simulated with this curve.</p></div>}</section>
      <section className="panel advice-panel"><div className="panel-eyebrow">OBSERVED BASELINE</div><h3>{baseline ? baseline.token.symbol : 'No indexed baseline'}</h3>{baseline ? <><div className="scenario-row"><span>Observed gross buy</span><strong>{formatEth(baseline.kpis.grossBuyWei)} ETH</strong></div><div className="scenario-row"><span>Coverage vs threshold</span><strong>{baseline.coverage.pct ?? '—'}% / {draft.qualityThreshold}%</strong></div><div className="scenario-row"><span>Observed bot share</span><strong>{baseline.kpis.botBuyShare === null ? '—' : `${baseline.kpis.botBuyShare.toFixed(1)}%`}</strong></div><div className="scenario-row"><span>Scenario share</span><strong>{draft.botShare}%</strong></div><p>These observed figures describe {baseline.window.minutes} minutes of indexed history. They are not a prediction for the next token.</p></> : <p>{snapshots.length ? 'Choose a saved token to compare this scenario with an indexed launch.' : 'Index a prior launch to compare depth, gas notes and evidence share with this scenario.'}</p>}<div className="step-items" style={{ marginTop: 12 }}>{draft.milestones.map((item) => <div key={item.id} className="check-row"><span>{item.label} — {item.note}</span></div>)}<label>Milestone<input className="input-with-unit" aria-label="New milestone" placeholder="Add a checkpoint" onKeyDown={(e) => { if (e.key !== 'Enter') return; const value = (e.target as HTMLInputElement).value.trim(); if (!value) return; setDraft({ ...draft, milestones: [...draft.milestones, { id: crypto.randomUUID(), label: value, note: draft.regime }] }); (e.target as HTMLInputElement).value = ''; }} /></label></div></section>
    </div></div>
  </>;
}
