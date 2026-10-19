"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { HelpTip } from './help-tip';
import { analyzeBrand } from '@/lib/brand/score';
import { criterionById } from '@/lib/brand/rubric';
import { editorialReport } from '@/lib/brand/report';
import type { BrandAnalysis, CategoryId, CategoryScore, ComparisonSession, ImprovementSuggestion } from '@/lib/brand/types';

function meter(score: number | null) {
  return score === null ? 0 : Math.max(0, Math.min(100, score * 10));
}

export function ScoreBars({ categories, open, onToggle }: { categories: CategoryScore[]; open: CategoryId | null; onToggle: (id: CategoryId) => void; analysis?: BrandAnalysis }) {
  return <div className="brand-bars">{categories.map((category) => <div key={category.id}><button type="button" className="brand-bar" onClick={() => onToggle(category.id)} aria-expanded={open === category.id}><span>{category.title}</span><span>{category.score === null ? 'Insufficient' : `${category.score.toFixed(1)} · ${category.label}`}</span></button><div className="progress-track" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={category.score ?? undefined} aria-label={`${category.title} ${category.score === null ? 'insufficient information' : `${category.score} out of 10, ${category.label}`}`}><div className="progress-fill" style={{ width: `${meter(category.score)}%` }} /></div></div>)}</div>;
}

export function FactorList({ analysis, categoryId }: { analysis: BrandAnalysis; categoryId?: CategoryId }) {
  const items = analysis.criteria.filter((item) => !categoryId || criterionById(item.id).categoryId === categoryId);
  return <div>{items.map((item) => {
    const definition = criterionById(item.id);
    return <article className="brand-factor" key={item.id}><header><strong>{definition.title}</strong><span>{item.score === null ? item.status : `${item.score}/10`}</span></header><p>{definition.explanation}</p><p>{item.rationale}</p><p>{definition.rubric}</p>{item.riskSeverity !== null && <p>Risk severity {item.riskSeverity}/10. Higher severity lowers the quality score.</p>}<p>{item.advice}</p><p className="panel-desc">{item.evidence} · {item.sufficiency} evidence{item.source ? ` · ${item.source}` : ''}</p></article>;
  })}</div>;
}

export function RadarChart({ categories }: { categories: CategoryScore[] }) {
  const cx = 140;
  const cy = 140;
  const radius = 96;
  const points = categories.map((category, index) => {
    const angle = -Math.PI / 2 + (index / categories.length) * Math.PI * 2;
    const value = category.score === null ? 0 : category.score / 10;
    return `${cx + Math.cos(angle) * radius * value},${cy + Math.sin(angle) * radius * value}`;
  }).join(' ');
  const ring = [0.5, 1].map((scale) => categories.map((_, index) => {
    const angle = -Math.PI / 2 + (index / categories.length) * Math.PI * 2;
    return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
  }).join(' '));
  return <figure className="brand-radar"><svg viewBox="0 0 280 280" role="img" aria-label="Ten category scores. Categories without enough evidence are listed as insufficient and are drawn at the center so they are not read as a zero grade.">{ring.map((poly) => <polygon key={poly} points={poly} fill="none" stroke="rgba(196,181,253,.35)" />)}<polygon points={points} fill="rgba(139,92,246,.28)" stroke="#C4B5FD" />{categories.map((category, index) => {
    const angle = -Math.PI / 2 + (index / categories.length) * Math.PI * 2;
    const x = cx + Math.cos(angle) * (radius + 18);
    const y = cy + Math.sin(angle) * (radius + 18);
    return <text key={category.id} x={x} y={y} textAnchor="middle" fill="#F8F7FF" fontSize="8">{category.score === null ? `${category.title} n/a` : `${category.score.toFixed(1)}`}</text>;
  })}</svg><figcaption>Numbers sit beside the shape. Insufficient categories are marked n/a, not as a failing grade.</figcaption></figure>;
}

export function BrandReportView({ analysis, tab, setTab, open, setOpen, session, suggestions = [] }: { analysis: BrandAnalysis; tab: string; setTab: (tab: string) => void; open: CategoryId | null; setOpen: (id: CategoryId | null) => void; session?: ComparisonSession | null; suggestions?: ImprovementSuggestion[] }) {
  const tabs = ['Overview', 'All factors', 'Name', 'Ticker', 'Narrative', 'Collisions', 'Visual', 'Recommendations', 'Compare', 'Report'];
  const nameIds = analysis.criteria.filter((item) => item.id.startsWith('nq-') || item.id.startsWith('fi-'));
  const tickerIds = analysis.criteria.filter((item) => item.id.startsWith('tq-'));
  return <section className="panel brand-report" data-tour="brand-score">
    <div className="brand-grid">
      <div>
        <div className="panel-eyebrow">{analysis.rubricVersion} · {analysis.profileId}</div>
        <h2>{analysis.input.name || 'Unnamed'} <span>/{analysis.input.ticker || '—'}</span></h2>
        <div className="brand-score-num">{analysis.overall === null ? '—' : analysis.overall.toFixed(1)}<small>/10</small></div>
        <p>{analysis.label} <HelpTip id="brand-score" /></p>
        <p className="panel-desc">Assessment coverage {analysis.coverage}% <HelpTip id="brand-coverage" />. Collision rows {analysis.collisions.length} <HelpTip id="brand-risk" />. Checked {analysis.analyzedAt ? new Date(analysis.analyzedAt).toISOString() : 'at scoring time'}.</p>
        <p className="panel-desc">{analysis.input.metadataSource || (analysis.input.address ? 'Contract supplied' : 'No contract. This is a proposed identity, not a trading history.')}</p>
      </div>
      <ScoreBars categories={analysis.categories} open={open} onToggle={(id) => setOpen(open === id ? null : id)} />
    </div>
    {open && <FactorList analysis={analysis} categoryId={open} />}
    <div className="tabs" role="tablist" aria-label="Brand report">{tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Overview' && <div className="brand-grid"><RadarChart categories={analysis.categories} /><div>{analysis.limitations.map((item) => <p key={item} className="panel-desc">{item}</p>)}</div></div>}
    {tab === 'All factors' && <FactorList analysis={analysis} />}
    {tab === 'Name' && <FactorList analysis={{ ...analysis, criteria: nameIds }} />}
    {tab === 'Ticker' && <FactorList analysis={{ ...analysis, criteria: tickerIds }} />}
    {tab === 'Narrative' && <FactorList analysis={{ ...analysis, criteria: analysis.criteria.filter((item) => item.id.startsWith('mp-') || item.id.startsWith('ns-')) }} />}
    {tab === 'Collisions' && <div>{analysis.research.sources.map((source) => <p key={source.id} className="panel-desc">{source.id}: {source.status}. {source.note}</p>)}{analysis.collisions.length === 0 && <p>No collision was recorded in the sources that ran. That is not a claim the name is unused.</p>}{analysis.collisions.map((item) => <article key={item.id} className="brand-factor"><strong>{item.matchType}</strong> · {item.matchedName} ({item.matchedTicker}) · {item.chain || 'chain unknown'} · {item.confidence}<p>{item.explanation}</p>{item.address && <code>{item.address}</code>}{item.url && <p><a href={item.url} target="_blank" rel="noreferrer">{item.url}</a></p>}<p className="panel-desc">{item.source} · {new Date(item.observedAt).toISOString()}</p></article>)}</div>}
    {tab === 'Visual' && <div><p className="panel-desc">Visual factors are conceptual unless you describe a mascot. ARC does not grade an uploaded image in this version.</p><FactorList analysis={{ ...analysis, criteria: analysis.criteria.filter((item) => item.id.startsWith('bi-')) }} /></div>}
    {tab === 'Recommendations' && <div>{suggestions.length === 0 && <p>Generate 5, 10, or 20 alternatives from the weak scored factors. The original name stays in the form until you choose one.</p>}{suggestions.map((item) => <article key={item.id} className="brand-factor"><header><strong>{item.name} / {item.ticker}</strong><span>{item.overall ?? 'Insufficient'}</span></header><p>{item.changed} {item.why}</p><p>{item.meaning}</p><p>Category changes: {item.categoryDeltas.filter((delta) => delta.delta !== null && delta.delta !== 0).map((delta) => `${delta.title} ${delta.delta && delta.delta > 0 ? '+' : ''}${delta.delta}`).join(' · ') || 'No scored category moved.'}</p><p>{item.collisions.length ? item.collisions.map((hit) => hit.explanation).join(' ') : 'No collision in the sources that ran. That is not a clearance.'}</p><p className="panel-desc">{item.disclaimer}</p></article>)}</div>}
    {tab === 'Report' && <div>{editorialReport(analysis).summary.map((item) => <p key={item}>{item}</p>)}<p>Weights: {analysis.categories.map((item) => `${item.title} ${item.weight}%`).join(' · ')}</p><p className="panel-desc">The advanced view is the factor list. Each sentence above cites a rubric id.</p></div>}
    {tab === 'Compare' && <div>{session ? <ComparisonTable session={session} /> : <p>Add at least two candidates in Compare mode. This tab shows that session. Weight changes do not rewrite collision rows.</p>}</div>}
  </section>;
}

export function BrandEmbed({ name, ticker, address, source, auto }: { name: string; ticker: string; address: string; source: string; auto: boolean }) {
  const [enabled, setEnabled] = useState(auto);
  const analysis = useMemo(() => enabled ? analyzeBrand({ name, ticker, mode: 'existing', address, metadataSource: source }, { now: 0 }) : null, [enabled, name, ticker, address, source]);
  const href = `/brand-intelligence?mode=existing&ca=${encodeURIComponent(address)}&name=${encodeURIComponent(name)}&ticker=${encodeURIComponent(ticker)}`;
  return <section className="panel"><div className="panel-eyebrow">NAME AND TICKER</div><h3>{name} / {ticker}</h3><p className="panel-desc">This editorial score is not added to gross buy, liquidity, wallet, or bot volume. Source: {source}.</p>{!enabled && <button className="btn secondary" type="button" onClick={() => setEnabled(true)}>Run brand rubric</button>}{analysis && <p><strong>{analysis.overall === null ? analysis.label : `${analysis.overall.toFixed(1)} / 10`}</strong> · coverage {analysis.coverage}% · {analysis.collisions.length} bundled collision row(s).</p>}<Link className="btn secondary" href={href}>Open Brand Intelligence</Link></section>;
}

export function ComparisonTable({ session }: { session: ComparisonSession }) {
  return <div className="table-scroll"><p className="panel-desc">{session.rankingNote}</p><table className="data-table"><caption className="sr-only">Name and ticker comparison</caption><thead><tr><th>Rank</th><th>Name</th><th>Ticker</th><th>Score</th><th>Coverage</th><th>Name</th><th>Ticker</th><th>Meme</th><th>Narrative</th><th>Originality</th><th>Brand</th><th>Social</th><th>Flags</th></tr></thead><tbody>{session.rows.map((row) => {
    const cell = (id: CategoryId) => row.categories.find((item) => item.id === id)?.score ?? '—';
    return <tr key={row.candidateId}><td>{row.rank}</td><td>{row.name}</td><td>{row.ticker}</td><td>{row.overall ?? row.label}</td><td>{row.coverage}%</td><td>{cell('name-quality')}</td><td>{cell('ticker-quality')}</td><td>{cell('meme-power')}</td><td>{cell('narrative')}</td><td>{cell('originality')}</td><td>{cell('brand-identity')}</td><td>{cell('social')}</td><td>{row.collisions.length}{row.warning ? ` · ${row.warning}` : ''}</td></tr>;
  })}</tbody></table></div>;
}

