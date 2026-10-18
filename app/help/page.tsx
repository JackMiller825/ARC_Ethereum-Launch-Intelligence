"use client";
import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search, X } from '@/components/icons';
import { PageHeading, Pill } from '@/components/ui';
import { ARTICLES, CATEGORIES, articleById, type Article } from '@/lib/help/articles';
import { highlightParts, searchArticles } from '@/lib/help/search';
import { resetTour, TOURS } from '@/lib/help/tours';
import { REFERENCE_CA } from '@/lib/data';

function Parts({ text, query }: { text: string; query: string }) {
  return <>{highlightParts(text, query).map((part, index) => part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>)}</>;
}

function HelpCenter() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get('article') || '';
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(initial);
  const [cursor, setCursor] = useState(0);
  const hits = useMemo(() => searchArticles(ARTICLES, query), [query]);
  const active = articleById(activeId) || (query ? hits[cursor]?.article : undefined);
  function open(article: Article) {
    setActiveId(article.id);
    setQuery('');
    router.replace(`/help?article=${article.id}`);
  }
  function onKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!hits.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setCursor((value) => Math.min(hits.length - 1, value + 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setCursor((value) => Math.max(0, value - 1)); }
    if (event.key === 'Enter') { event.preventDefault(); open(hits[Math.min(cursor, hits.length - 1)].article); }
  }
  return <>
    <PageHeading eyebrow="SYSTEM / HELP" title="Master Ethereum Launch Intelligence." description="Everything you need to investigate tokens, understand trading activity, analyze automated strategies, and plan future launches." />
    <div className="lookup-box help-search">
      <div className="lookup-form">
        <Search size={18} />
        <input aria-label="Search documentation" value={query} onChange={(event) => { setQuery(event.target.value); setCursor(0); }} onKeyDown={onKey} placeholder="Search guides, metrics, and troubleshooting" />
        {query && <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
      </div>
      {query && <ul className="search-hits" role="listbox" aria-label="Documentation results">
        {hits.length === 0 && <li className="panel-desc">No articles match “{query}”. Try coverage, sniper, or RPC.</li>}
        {hits.map((hit, index) => <li key={hit.article.id}><button type="button" className={index === cursor ? 'selected' : ''} onClick={() => open(hit.article)}><strong><Parts text={hit.article.title} query={query} /></strong><span><Parts text={hit.snippet} query={query} /></span></button></li>)}
      </ul>}
    </div>
    {!active && <>
      <div className="history-grid help-cards">{CATEGORIES.map((category) => {
        const article = ARTICLES.find((item) => item.category === category);
        if (!article) return null;
        return <button key={category} type="button" className="history-card help-card" onClick={() => open(article)}><BookOpen size={18} /><h3>{category}</h3><p>{article.description}</p><Pill kind={article.availability === 'available' ? 'green' : article.availability === 'limited' ? 'amber' : 'muted'}>{article.availability}</Pill></button>;
      })}</div>
      <section className="panel"><div className="panel-eyebrow">GUIDES</div><h3>Restart a walkthrough</h3><p className="panel-desc">Guides open on the real page. They do not start again on their own. Finish stores completion in this browser.</p><div className="feature-actions">{TOURS.map((tour) => <Link key={tour.id} className="btn secondary" href={`${tour.steps[0].href}?tour=${tour.id}&step=0`} onClick={() => resetTour(tour.id)}>{tour.title}</Link>)}</div><p className="panel-desc">Example contract for the first analysis: <code>{REFERENCE_CA}</code>. Live totals still require an RPC that can serve the logs.</p></section>
    </>}
    {active && <div className="help-layout">
      <nav className="help-nav" aria-label="Documentation">
        {CATEGORIES.map((category) => <div key={category}><div className="nav-caption">{category}</div>{ARTICLES.filter((item) => item.category === category).map((item) => <button key={item.id} type="button" className={item.id === active.id ? 'selected' : ''} onClick={() => open(item)}>{item.title}</button>)}</div>)}
      </nav>
      <article className="panel help-article">
        <div className="feature-actions"><Pill kind={active.availability === 'available' ? 'green' : 'amber'}>{active.availability}</Pill><button type="button" className="btn ghost" onClick={() => { const url = `${window.location.origin}${window.location.pathname}?article=${active.id}`; void navigator.clipboard.writeText(url); }}>Copy link</button><button type="button" className="btn ghost" onClick={() => { setActiveId(''); router.replace('/help'); }}>All topics</button></div>
        <h2>{active.title}</h2>
        <p className="panel-desc">Updated {active.updated}. {active.description}</p>
        {active.id === 'coverage' && <svg className="pipeline" viewBox="0 0 760 70" role="img" aria-label="Data path from chain to dashboard">{['Chain', 'RPC', 'Pools', 'Swaps', 'Trades', 'Wallets', 'Evidence', 'Dashboard'].map((label, index) => <g key={label}><rect x={index * 95} y="8" width="86" height="36" rx="10" fill="#17172F" stroke="rgba(196,181,253,.4)" /><text x={index * 95 + 43} y="30" textAnchor="middle" fill="#F8F7FF" fontSize="10">{label}</text></g>)}</svg>}
        {active.sections.map((section) => <section key={section.heading} id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}><h3>{section.heading}</h3>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
        {active.related.length > 0 && <p className="panel-desc">Related: {active.related.map((id) => <Link key={id} href={`/help?article=${id}`}>{articleById(id)?.title || id}</Link>)}</p>}
      </article>
    </div>}
  </>;
}

export default function HelpPage() {
  return <Suspense fallback={<div className="panel">Loading help…</div>}><HelpCenter /></Suspense>;
}
