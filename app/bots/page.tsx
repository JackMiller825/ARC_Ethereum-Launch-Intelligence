"use client";
import { useState } from 'react';
import { Bot, ShieldCheck } from '@/components/icons';
import { DemoBadge, MetricTile, PageHeading, Pill, StatProgress, TrendChart } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { formatEth } from '@/lib/format';
import { HEURISTIC_VERSION } from '@/lib/chain/constants';

const bots = [
  { name: 'Liquidity snipers', type: 'NEW POOL', key: 'Sniper', notes: 'Buys in the T0 block or the next block. Speed is evidence, not proof of an operator.' },
  { name: 'New-pair scanners', type: 'DISCOVERY', key: 'New-pair scanner', notes: 'Early buys in the first minutes. Timing alone stays a low-confidence signal.' },
  { name: 'Copy-trading automation', type: 'FOLLOWER', key: 'Copy-trading', notes: 'Repeated buys within two blocks of the same leader wallet.' },
  { name: 'Momentum strategies', type: 'SIGNAL', key: 'Momentum', notes: 'Several buys from one signer across the window, without a faster pattern.' },
  { name: 'Arbitrage searchers', type: 'MEV / ARB', key: 'Arbitrage', notes: 'A round trip inside 120 seconds. Often inventory-neutral rather than new demand.' },
  { name: 'Sandwich searchers', type: 'ADVERSARIAL', key: 'Sandwich', notes: 'A same-block buy and sell surrounding another buy. The label is a pattern, not an identity.' },
  { name: 'MEV searchers', type: 'SAME BLOCK', key: 'MEV', notes: 'A same-block inventory flip without a surrounded victim. Contract code raises the ordinal label. It still does not name an operator.' },
  { name: 'Market-making flow', type: 'TWO-SIDED', key: 'Market-maker', notes: 'Both sides, at least four trades, and more than three minutes. This is a weak hint, kept at LOW so it stays out of the automated KPI.' },
];

export default function Bots() {
  const { active, settings } = useWorkspace();
  const [selected, setSelected] = useState(0);
  const chosen = bots[selected];
  const matched = (active?.trades || []).filter((trade) => trade.classification === chosen.key && !trade.isProject && trade.side === 'BUY');
  const wei = matched.reduce((sum, trade) => sum + BigInt(trade.ethWei || 0), 0n);
  return <>
    <PageHeading eyebrow="RESEARCH / AUTOMATION" title="Understand the Machines Behind the Market." description={`Explainable classes from ${HEURISTIC_VERSION}. A router call by an EOA is assisted execution, not an autonomous bot. These labels are evidence, not an operator identity.`} />
    {settings.demoMode && !active && <DemoBadge />}
    <div className="metrics-grid">
      <MetricTile helpId="automated-buy" label="AUTOMATED GROSS BUY" value={active ? `${formatEth(active.kpis.botBuyWei)} ETH` : '—'} sub="HIGH and MEDIUM evidence" icon={Bot} tone="blue" />
      <MetricTile helpId="automated-sell" label="AUTOMATED GROSS SELL" value={active ? `${formatEth(active.kpis.botSellWei)} ETH` : '—'} sub="Same evidence bands" icon={Bot} tone="red" />
      <MetricTile label="ESTIMATED SHARE" value={active?.kpis.botBuyShare === null || !active ? '—' : `${active.kpis.botBuyShare.toFixed(1)}%`} sub="Of valued independent buys" icon={ShieldCheck} tone="green" />
      <MetricTile label="UNCLASSIFIED BUY" value={active?.kpis.bands ? `${formatEth(active.kpis.bands.unknownWei)} ETH` : '—'} sub="Unknown band stays outside the automated total" icon={ShieldCheck} />
    </div>
    <div className="bots-layout"><div className="bot-cards" data-tour="bot-list">{bots.map((bot, index) => <button key={bot.name} onClick={() => setSelected(index)} className={`bot-card ${selected === index ? 'chosen' : ''}`}><span className="bot-icon"><Bot size={19} /></span><span className="bot-card-text"><small>{bot.type}</small><strong>{bot.name}</strong><span>{bot.key}</span></span></button>)}</div>
      <div className="panel bot-detail"><div className="panel-eyebrow">STRATEGY DEEP DIVE</div><div className="bot-detail-head"><div className="bot-detail-icon"><Bot size={32} /></div><Pill kind={chosen.key === 'Sandwich' ? 'amber' : 'green'}>{chosen.type}</Pill></div><h2>{chosen.name}</h2><p>{chosen.notes}</p>
        <StatProgress label={active ? `Valued buys on ${active.token.symbol}` : 'Indexed evidence'} value={active ? `${formatEth(wei.toString())} ETH` : '—'} percentage={active && BigInt(active.kpis.grossBuyWei) > 0n ? Number((wei * 100n) / BigInt(active.kpis.grossBuyWei)) : 0} />
        <TrendChart trades={matched} label={`${chosen.name} chronology`} />
        <div className="detail-divider" />
        <h4>{matched.length ? `${matched.length} supporting trades` : 'No qualifying swaps were found in the selected interval.'}</h4>
        {(matched[0]?.evidence || ['First execution block and swap ordering', 'Contract code versus EOA router calls', 'Repeated leader-lag', 'Round-trip timing', 'Model version on every row']).slice(0, 6).map((item, index) => <div className="evidence-row" key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</div>)}
        <div className="data-boundary nested"><ShieldCheck size={18} /><div><strong>Unknown is a real bucket.</strong><p>High and medium evidence enter the automated KPI. Low and unknown remain visible and are not relabeled to fill a target share.</p></div></div>
      </div></div>
  </>;
}
