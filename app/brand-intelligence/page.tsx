"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrandReportView, ComparisonTable } from '@/components/brand-report';
import { PageHeading, Pill } from '@/components/ui';
import { useWorkspace } from '@/components/workspace';
import { compareBrands } from '@/lib/brand/compare';
import { suggestAlternatives } from '@/lib/brand/improve';
import { DEFAULT_WEIGHTS, PROFILES, normalizeWeights } from '@/lib/brand/profiles';
import { analysisToCsv, analysisToHtml, analysisToJson, comparisonToCsv, editorialReport } from '@/lib/brand/report';
import { clearResearchCache, researchCollisions } from '@/lib/brand/research';
import { resolveOnchainIdentity } from '@/lib/brand/resolve';
import { analyzeBrand } from '@/lib/brand/score';
import type { BrandAnalysis, BrandInput, CategoryId, ComparisonSession, ImprovementSuggestion, ProfileId } from '@/lib/brand/types';
import { CATEGORY_IDS } from '@/lib/brand/types';
import { listBrandAnalyses, rpcList, saveBrandAnalysis, saveBrandComparison } from '@/lib/store/idb';

const STAGES = ['Input validation', 'Linguistic assessment', 'Ticker assessment', 'Narrative assessment', 'Collision research', 'Brand compatibility', 'Final aggregation'];

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCandidates(text: string): BrandInput[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 20).map((line) => {
    const [name, ticker] = line.split(/[|,]/).map((part) => part.trim());
    return { name: name || '', ticker: ticker || '', mode: 'future' as const };
  });
}

function BrandPage() {
  const params = useSearchParams();
  const { settings } = useWorkspace();
  const [mode, setMode] = useState<'existing' | 'future' | 'compare'>(params.get('mode') === 'compare' ? 'compare' : params.get('mode') === 'existing' ? 'existing' : 'future');
  const [name, setName] = useState(params.get('name') || '');
  const [ticker, setTicker] = useState(params.get('ticker') || '');
  const [ca, setCa] = useState(params.get('ca') || '');
  const [narrative, setNarrative] = useState('');
  const [meme, setMeme] = useState('');
  const [mascot, setMascot] = useState('');
  const [audience, setAudience] = useState('');
  const [eth, setEth] = useState('');
  const [keywords, setKeywords] = useState('');
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [x, setX] = useState('');
  const [historical, setHistorical] = useState(false);
  const [profileId, setProfileId] = useState<ProfileId>('balanced');
  const [custom, setCustom] = useState(DEFAULT_WEIGHTS);
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [session, setSession] = useState<ComparisonSession | null>(null);
  const [compareText, setCompareText] = useState(params.get('candidates') || '');
  const [saved, setSaved] = useState<BrandAnalysis[]>([]);
  const [error, setError] = useState('');
  const [researchNote, setResearchNote] = useState('Live directories have not been queried.');
  const [tab, setTab] = useState('Overview');
  const [open, setOpen] = useState<CategoryId | null>(null);
  const [sort, setSort] = useState<'rank' | 'coverage'>('rank');
  const [filter, setFilter] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const researching = researchNote.startsWith('Checking');
  function stageState(index: number) {
    if (!analysis) return 'waiting';
    if (index === 4) return researching ? 'current' : 'done';
    return 'done';
  }

  useEffect(() => { void listBrandAnalyses().then(setSaved).catch(() => setSaved([])); }, []);

  function weights() {
    return profileId === 'custom' ? normalizeWeights(custom) : undefined;
  }

  function buildInput(nextName: string, nextTicker: string, address?: string, source?: string): BrandInput {
    return {
      name: nextName,
      ticker: nextTicker,
      narrative,
      memeOrigin: meme,
      mascot,
      audience,
      ethereumRelevance: eth,
      keywords: keywords.split(',').map((item) => item.trim()).filter(Boolean),
      links: { website, telegram, x },
      imageryDescribed: Boolean(mascot),
      mode: historical ? 'historical' : mode === 'existing' ? 'existing' : 'future',
      address,
      metadataSource: source,
    };
  }

  async function runOne() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError('');
    setSuggestions([]);
    let nextName = name;
    let nextTicker = ticker;
    let address = '';
    let source = '';
    if (mode === 'existing') {
      const resolved = await resolveOnchainIdentity(ca, rpcList(settings));
      if (!resolved.ok) { setError(resolved.error); setAnalysis(null); return; }
      nextName = resolved.name;
      nextTicker = resolved.symbol;
      address = resolved.address;
      source = resolved.source;
      setName(resolved.name);
      setTicker(resolved.symbol);
    } else if (!nextName.trim() && !nextTicker.trim()) {
      setError('Enter a name or a ticker. A contract is not required.');
      return;
    }
    const now = Date.now();
    const input = buildInput(nextName, nextTicker, address, source);
    const local = analyzeBrand(input, { profileId, weights: weights(), now });
    setAnalysis(local);
    setResearchNote('Checking DexScreener and CoinGecko. The editorial score above already used the bundled list.');
    await saveBrandAnalysis(local).then(() => listBrandAnalyses().then(setSaved)).catch(() => undefined);
    const live = await researchCollisions(nextName, nextTicker, { signal: controller.signal, now });
    if (controller.signal.aborted) return;
    const merged = [...local.collisions];
    for (const finding of live.findings) if (!merged.some((item) => item.id === finding.id)) merged.push(finding);
    const next = analyzeBrand(input, { collisions: merged, profileId, weights: weights(), now, researchSources: [{ id: 'bundled-reference', status: 'ok', note: 'Short public list shipped with ARC.', checkedAt: now }, ...live.sources] });
    setAnalysis(next);
    setResearchNote(live.sources.some((item) => item.status === 'ok') ? 'Live directories that responded are included. Domain, trademark, and web search are not configured.' : 'Live directories were unavailable. Uniqueness was not invented.');
    await saveBrandAnalysis(next).catch(() => undefined);
  }

  function runCompare() {
    const inputs = parseCandidates(compareText);
    if (inputs.length < 2) { setError('Enter 2 to 20 lines as Name | TICKER.'); return; }
    setError('');
    const next = compareBrands(inputs, { profileId, weights: weights(), now: Date.now() });
    setSession(next);
    setAnalysis(next.rows[0]?.analysis || null);
    setTab('Compare');
    void saveBrandComparison(next).catch(() => undefined);
  }

  function applyProfile(nextProfile: ProfileId) {
    setProfileId(nextProfile);
    if (!analysis) return;
    const next = analyzeBrand(analysis.input, { collisions: analysis.collisions, profileId: nextProfile, weights: nextProfile === 'custom' ? normalizeWeights(custom) : undefined, now: analysis.analyzedAt, researchSources: analysis.research.sources });
    setAnalysis(next);
    if (session) setSession(compareBrands(session.rows.map((row) => row.analysis.input), { profileId: nextProfile, weights: nextProfile === 'custom' ? normalizeWeights(custom) : undefined, now: session.createdAt }));
  }

  const visibleRows = useMemo(() => {
    if (!session) return [];
    return [...session.rows].filter((row) => `${row.name} ${row.ticker}`.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => sort === 'coverage' ? b.coverage - a.coverage : a.rank - b.rank);
  }, [session, filter, sort]);

  const profile = PROFILES.find((item) => item.id === profileId) || PROFILES[0];
  return <>
    <PageHeading eyebrow="BRAND INTELLIGENCE" title="Name and ticker, explained." description="Score a live contract, a name that is not deployed yet, or up to 20 candidates. The result is an editorial rubric, not a forecast and not a legal clearance." />
    <div className="tabs" role="tablist" aria-label="Brand mode">{(['future', 'existing', 'compare'] as const).map((item) => <button key={item} type="button" className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item === 'future' ? 'Future token' : item === 'existing' ? 'Existing token' : 'Compare'}</button>)}</div>
    <section className="panel">
      {mode === 'existing' && <label>Contract address<div className="input-with-unit"><input aria-label="Contract address" value={ca} onChange={(event) => setCa(event.target.value)} placeholder="0x… optional only in the other modes" spellCheck={false} /></div></label>}
      {mode !== 'compare' && <div className="parameter-grid">
        <label>Name<div className="input-with-unit"><input data-tour="brand-name" aria-label="Token name" value={name} onChange={(event) => setName(event.target.value)} /></div></label>
        <label>Ticker<div className="input-with-unit"><input aria-label="Ticker" value={ticker} onChange={(event) => setTicker(event.target.value)} /></div></label>
        <label>Narrative<div className="input-with-unit"><input aria-label="Narrative" value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Optional. Leave blank and story factors stay unscored." /></div></label>
        <label>Meme origin<div className="input-with-unit"><input aria-label="Meme origin" value={meme} onChange={(event) => setMeme(event.target.value)} /></div></label>
        <label>Mascot concept<div className="input-with-unit"><input aria-label="Mascot concept" value={mascot} onChange={(event) => setMascot(event.target.value)} placeholder="Text only. No image is graded." /></div></label>
        <label>Audience<div className="input-with-unit"><input aria-label="Target audience" value={audience} onChange={(event) => setAudience(event.target.value)} /></div></label>
        <label>Ethereum relevance<div className="input-with-unit"><input aria-label="Ethereum relevance" value={eth} onChange={(event) => setEth(event.target.value)} /></div></label>
        <label>Keywords<div className="input-with-unit"><input aria-label="Marketing keywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Comma separated" /></div></label>
        <label>Website<div className="input-with-unit"><input aria-label="Website" value={website} onChange={(event) => setWebsite(event.target.value)} /></div></label>
        <label>Telegram<div className="input-with-unit"><input aria-label="Telegram" value={telegram} onChange={(event) => setTelegram(event.target.value)} /></div></label>
        <label>X<div className="input-with-unit"><input aria-label="X link" value={x} onChange={(event) => setX(event.target.value)} /></div></label>
      </div>}
      {mode === 'compare' && <label>Candidates<textarea aria-label="Candidate names" rows={8} value={compareText} onChange={(event) => setCompareText(event.target.value)} placeholder={'Pebble Finch | PBLF\nRiver Mint | RVMT'} /></label>}
      <label className="check-row"><input type="checkbox" checked={historical} onChange={(event) => setHistorical(event.target.checked)} /><span>Historical identity. Later trading results are not an input and will not raise the score.</span></label>
      <div className="feature-actions">
        {mode === 'compare' ? <button className="btn primary" type="button" onClick={runCompare}>Compare</button> : <button className="btn primary" type="button" onClick={() => void runOne()}>Analyze name</button>}
        <button className="btn ghost" type="button" onClick={() => { abortRef.current?.abort(); setResearchNote('Cancelled. The last finished score is still shown.'); }}>Cancel research</button>
      </div>
      {error && <p className="error-note">{error}</p>}
    </section>
    <section className="panel">
      <div className="panel-header"><div><div className="panel-eyebrow">PROFILE</div><h3>{profile.title}</h3></div><button className="btn ghost" type="button" onClick={() => { setCustom(DEFAULT_WEIGHTS); applyProfile('balanced'); }}>Restore defaults</button></div>
      <p className="panel-desc">{profile.why}</p>
      <div className="intervals" role="group" aria-label="Scoring profile">{PROFILES.map((item) => <button key={item.id} type="button" className={profileId === item.id ? 'selected' : ''} onClick={() => applyProfile(item.id)}>{item.title}</button>)}</div>
      {profileId === 'custom' && <div className="parameter-grid">{CATEGORY_IDS.map((id) => <label key={id}>{id}<div className="input-with-unit"><input aria-label={`${id} weight`} type="number" min="0" value={custom[id]} onChange={(event) => setCustom({ ...custom, [id]: Math.max(0, Number(event.target.value) || 0) })} /></div></label>)}</div>}
    </section>
    <ol className="stage-list" aria-label="Brand analysis stages">{STAGES.map((stage, index) => <li key={stage} data-state={stageState(index)}>{stage}{stage === 'Collision research' && analysis ? ` — ${researchNote}` : ''}</li>)}</ol>
    {session && <section className="panel"><div className="feature-actions"><label>Filter<input aria-label="Filter candidates" value={filter} onChange={(event) => setFilter(event.target.value)} /></label><button className="btn ghost" type="button" onClick={() => setSort(sort === 'rank' ? 'coverage' : 'rank')}>Sort by {sort === 'rank' ? 'coverage' : 'rank'}</button><button className="btn ghost" type="button" onClick={() => download('arc-brand-comparison.csv', comparisonToCsv({ ...session, rows: visibleRows }), 'text/csv')}>Export CSV</button></div><ComparisonTable session={{ ...session, rows: visibleRows }} /></section>}
    {analysis && <>
      <BrandReportView analysis={analysis} tab={tab} setTab={setTab} open={open} setOpen={setOpen} session={session} suggestions={suggestions} />
      <div className="feature-actions">
        <button className="btn secondary" type="button" onClick={() => { setSuggestions(suggestAlternatives(analysis, 5)); setTab('Recommendations'); }}>5 alternatives</button>
        <button className="btn ghost" type="button" onClick={() => { setSuggestions(suggestAlternatives(analysis, 10)); setTab('Recommendations'); }}>10</button>
        <button className="btn ghost" type="button" onClick={() => { setSuggestions(suggestAlternatives(analysis, 20)); setTab('Recommendations'); }}>20</button>
        <button className="btn ghost" type="button" onClick={() => download(`${analysis.input.ticker || 'brand'}.json`, analysisToJson(analysis), 'application/json')}>JSON</button>
        <button className="btn ghost" type="button" onClick={() => download(`${analysis.input.ticker || 'brand'}.csv`, analysisToCsv(analysis), 'text/csv')}>CSV</button>
        <button className="btn ghost" type="button" onClick={() => download(`${analysis.input.ticker || 'brand'}.html`, analysisToHtml(analysis), 'text/html')}>HTML</button>
        <button className="btn ghost" type="button" onClick={() => clearResearchCache()}>Clear research cache</button>
      </div>
      {tab === 'Report' && <section className="panel"><h3>Advanced explanation</h3>{editorialReport(analysis).advanced.slice(0, 12).map((line) => <p key={line} className="panel-desc">{line}</p>)}<p className="panel-desc">The full factor list is on All factors. These lines cite the same ids.</p></section>}
    </>}
    <section className="panel"><div className="panel-eyebrow">SAVED IN THIS BROWSER</div><h3>Brand records</h3>{saved.length === 0 && <p className="panel-desc">Nothing saved yet. A refresh keeps records that were written to IndexedDB.</p>}{saved.slice(0, 12).map((item) => <button key={item.id} className="coverage-row" type="button" onClick={() => { setAnalysis(item); setName(item.input.name); setTicker(item.input.ticker); }}><span>{item.input.name} / {item.input.ticker}</span><Pill kind="blue">{item.overall ?? item.label}</Pill></button>)}</section>
  </>;
}

export default function BrandIntelligencePage() {
  return <Suspense fallback={<div className="panel">Loading brand intelligence…</div>}><BrandPage /></Suspense>;
}
