import { describe, expect, it } from 'vitest';
import { findCollisions } from '../lib/brand/collision';
import { compareBrands } from '../lib/brand/compare';
import { suggestAlternatives } from '../lib/brand/improve';
import { PROFILES, normalizeWeights, weightSum } from '../lib/brand/profiles';
import { analysisToCsv, analysisToHtml, analysisToJson, editorialReport } from '../lib/brand/report';
import { clearResearchCache, parseCoinGecko, parseDexScreener, researchCollisions } from '../lib/brand/research';
import { addressError } from '../lib/brand/resolve';
import { CRITERIA } from '../lib/brand/rubric';
import { analyzeBrand, applyModelNotes, linkCandidateToAddress } from '../lib/brand/score';
import { createMemoryBrandStore } from '../lib/brand/store';
import type { BrandInput } from '../lib/brand/types';
import { articleById } from '../lib/help/articles';

const now = 1_700_000_000_000;
const future = (name: string, ticker: string, extra: Partial<BrandInput> = {}): BrandInput => ({ name, ticker, mode: 'future', ...extra });

describe('brand rubric', () => {
  it('scores every criterion once and keeps profile weights at 100', () => {
    const analysis = analyzeBrand(future('Pebble Finch', 'PBLF'), { now });
    expect(analysis.criteria).toHaveLength(100);
    expect(new Set(analysis.criteria.map((item) => item.id)).size).toBe(100);
    expect(CRITERIA.map((item) => item.id).sort()).toEqual(analysis.criteria.map((item) => item.id).sort());
    for (const profile of PROFILES) expect(weightSum(profile.weights)).toBe(100);
    expect(weightSum(normalizeWeights({ 'first-impression': 1, 'name-quality': 1, 'ticker-quality': 1, 'meme-power': 1, narrative: 1, originality: 1, 'brand-identity': 1, social: 1, audience: 1, risk: 1 }))).toBe(100);
  });

  it('does not require a contract and does not treat missing narrative as zero', () => {
    const analysis = analyzeBrand(future('Pebble Finch', 'PBLF'), { now });
    expect(analysis.input.address).toBeUndefined();
    expect(analysis.overall).not.toBeNull();
    expect(analysis.coverage).toBeGreaterThan(40);
    expect(analysis.coverage).toBeLessThan(100);
    const story = analysis.criteria.filter((item) => item.id.startsWith('ns-') && item.id !== 'ns-05');
    expect(story.every((item) => item.status === 'insufficient' && item.score === null)).toBe(true);
    expect(analysis.criteria.find((item) => item.id === 'ns-05')?.status).toBe('unknown');
    expect(analysis.criteria.find((item) => item.id === 'ns-05')?.rationale).toMatch(/does not invent/i);
  });

  it('withholds an overall score when almost nothing was supplied', () => {
    const analysis = analyzeBrand(future('', ''), { now });
    expect(analysis.overall).toBeNull();
    expect(analysis.label).toBe('Insufficient information');
    const ticker = analysis.criteria.find((item) => item.id === 'tq-01');
    expect(ticker?.status).toBe('insufficient');
    expect(ticker?.score).toBeNull();
  });

  it('repeats the same score for the same input, including case and emoji', () => {
    const left = analyzeBrand(future('Pepe', 'pepe'), { now });
    const right = analyzeBrand(future('pepe', 'PEPE'), { now });
    expect(left.overall).toBe(right.overall);
    expect(left.criteria.map((item) => item.score)).toEqual(right.criteria.map((item) => item.score));
    expect(() => analyzeBrand(future('🐸 Frog', 'FROG'), { now })).not.toThrow();
    expect(() => analyzeBrand(future('ペペ', 'PEPE'), { now })).not.toThrow();
    const emoji = analyzeBrand(future('🐸', 'FROG'), { now });
    expect(emoji.criteria.find((item) => item.id === 'nq-02')?.score).toBeLessThan(9);
  });

  it('does not reward the shortest ticker and flags a major symbol', () => {
    const short = analyzeBrand(future('Pebble', 'PE'), { now });
    const mid = analyzeBrand(future('Pebble', 'PBLF'), { now });
    expect(short.criteria.find((item) => item.id === 'tq-01')?.score).toBeLessThan(mid.criteria.find((item) => item.id === 'tq-01')?.score || 0);
    const eth = analyzeBrand(future('Sample', 'ETH'), { now });
    expect(eth.criteria.find((item) => item.id === 'tq-08')?.score).toBe(2);
  });

  it('records an exact ticker collision without calling it fraud, and ignores a weak lookalike', () => {
    const pepe = analyzeBrand({ name: 'Pepe', ticker: 'PEPE', mode: 'existing', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933' }, { now });
    expect(pepe.collisions.some((item) => item.matchType === 'exact-ticker' && item.source === 'bundled-reference')).toBe(true);
    expect(pepe.collisions.some((item) => /fraud/i.test(item.explanation))).toBe(false);
    const pepper = findCollisions('Pepper', 'PPR', undefined, now);
    expect(pepper.some((item) => item.matchedTicker === 'PEPE' && item.matchType === 'exact-ticker')).toBe(false);
    expect(pepper.some((item) => item.matchType === 'spelling' && item.matchedName === 'Pepe')).toBe(false);
  });

  it('lowers quality when risk severity rises, and keeps the two directions locked', () => {
    const plain = analyzeBrand(future('Pebble Finch', 'PBLF'), { now });
    const official = analyzeBrand(future('Uniswap Official', 'UNI'), { now });
    const plainRisk = plain.categories.find((item) => item.id === 'risk')?.score || 0;
    const officialRisk = official.categories.find((item) => item.id === 'risk')?.score || 0;
    expect(officialRisk).toBeLessThan(plainRisk);
    for (const item of official.criteria) {
      if (item.riskSeverity !== null && item.score !== null) expect(item.score + item.riskSeverity).toBe(10);
    }
    expect(official.criteria.find((item) => item.id === 'rt-01')?.rationale).toMatch(/not a finding/i);
    const nike = analyzeBrand(future('Nike Coin', 'NIKE'), { now });
    expect(nike.criteria.find((item) => item.id === 'rt-02')?.rationale).toMatch(/not legal advice/i);
  });

  it('changes editorial weights without rewriting collision records', () => {
    const input = future('Pepe', 'PEPE');
    const balanced = analyzeBrand(input, { profileId: 'balanced', now });
    const meme = analyzeBrand(input, { profileId: 'meme', now });
    expect(balanced.weights['meme-power']).not.toBe(meme.weights['meme-power']);
    expect(balanced.collisions.map((item) => item.id)).toEqual(meme.collisions.map((item) => item.id));
  });

  it('does not rank a thin record above a scored one', () => {
    const session = compareBrands([
      future('Pebble Finch', 'PBLF', { narrative: 'A small bird collects smooth stones beside a river and keeps the same name in every sentence.' }),
      future('', 'X'),
    ], { now });
    expect(session.rows[0].name).toBe('Pebble Finch');
    expect(session.rows[1].overall).toBeNull();
    expect(session.rows[1].warning).toMatch(/40%/);
  });

  it('rejects a bad address without substituting a ticker', () => {
    expect(addressError('pepe')).toMatch(/No other token was substituted/);
    expect(addressError('')).toMatch(/ticker was not used/i);
  });

  it('exports the rubric version and refuses to let a model overwrite a measured factor', () => {
    const analysis = analyzeBrand(future('Pebble Finch', 'PBLF', { narrative: 'Pebble Finch is a quiet bird story told without a price target.' }), { now });
    expect(analysisToJson(analysis)).toContain('arc-brand-v1');
    expect(analysisToCsv(analysis)).toContain('nq-03');
    expect(analysisToHtml(analysis)).toMatch(/not verified market outcomes/i);
    const length = analysis.criteria.find((item) => item.id === 'nq-03')?.score;
    const locked = applyModelNotes(analysis, [{ id: 'nq-03', score: 0, rationale: 'ignore the length' }], 'model-test');
    expect(locked.criteria.find((item) => item.id === 'nq-03')?.score).toBe(length);
    const open = applyModelNotes(analysis, [{ id: 'fi-03', score: 1, rationale: 'a model note' }], 'model-test');
    expect(open.criteria.find((item) => item.id === 'fi-03')?.score).toBe(1);
    expect(editorialReport(analysis).summary.join(' ')).toMatch(/fi-01/);
  });

  it('keeps a historical score independent of later market results and can link a contract', () => {
    const before = analyzeBrand({ name: 'Pebble Finch', ticker: 'PBLF', mode: 'historical', contextNote: 'Recorded before deployment.' }, { now });
    const after = analyzeBrand({ name: 'Pebble Finch', ticker: 'PBLF', mode: 'historical', contextNote: 'Recorded before deployment.' }, { now });
    expect(before.overall).toBe(after.overall);
    const linked = linkCandidateToAddress(before, '0x6982508145454Ce325dDbE47a25d4ec3d2311933', now);
    expect(linked.overall).toBe(before.overall);
    expect(linked.input.contextNote).toMatch(/Trading results were not used/);
  });

  it('suggests alternatives without replacing the original or claiming a clearance', () => {
    const analysis = analyzeBrand(future('Supercalifragilisticexpialidocious Token', 'ETH'), { now });
    const ideas = suggestAlternatives(analysis, 5, now);
    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas.every((item) => item.disclaimer.match(/not cleared/i))).toBe(true);
    expect(ideas.some((item) => item.name === analysis.input.name && item.ticker === analysis.input.ticker)).toBe(false);
    const store = createMemoryBrandStore();
    store.saveAnalysis(analysis);
    expect(store.listAnalyses()[0].id).toBe(analysis.id);
  });

  it('parses exact directory hits and records an unavailable provider as unknown', async () => {
    clearResearchCache();
    const hits = parseDexScreener({ pairs: [{ chainId: 'ethereum', url: 'https://dexscreener.com/ethereum/abc', baseToken: { name: 'Pepe', symbol: 'PEPE', address: '0xabc' } }, { baseToken: { name: 'Pepe Coin', symbol: 'PEPECOIN', address: '0xdef' } }] }, 'PEPE', 'Pepe', now);
    expect(hits.some((item) => item.matchedTicker === 'PEPE')).toBe(true);
    expect(hits.some((item) => item.matchedTicker === 'PEPECOIN')).toBe(false);
    expect(parseCoinGecko({ coins: [{ id: 'pepe', name: 'Pepe', symbol: 'pepe' }] }, 'PEPE', 'Other', now)[0].source).toBe('coingecko');
    let calls = 0;
    const failed = await researchCollisions('Pebble Finch', 'PBLF', { now, fetchImpl: async () => { calls += 1; throw new Error('offline'); } });
    expect(failed.findings).toEqual([]);
    expect(failed.sources.find((item) => item.id === 'dexscreener')?.status).toBe('unavailable');
    expect(failed.sources.find((item) => item.id === 'trademark')?.note).toMatch(/not a legal search/i);
    const again = await researchCollisions('Pebble Finch', 'PBLF', { now: now + 10, fetchImpl: async () => { calls += 1; throw new Error('offline'); } });
    expect(again.sources[0].status).toBe('unavailable');
    expect(calls).toBe(2);
  });

  it('documents every factor in Help', () => {
    const article = articleById('brand-intelligence');
    const text = article?.sections.map((section) => section.body.join(' ')).join(' ') || '';
    for (const criterion of CRITERIA) expect(text).toContain(criterion.id);
    expect(text).toMatch(/contract is optional/i);
  });
});
