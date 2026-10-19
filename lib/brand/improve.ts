import { findCollisions } from './collision';
import { analyzeBrand } from './score';
import type { BrandAnalysis, BrandInput, ImprovementSuggestion } from './types';
import { CATEGORY_IDS } from './types';
import { fold, initialsOf, normalizeTicker, wordsOf } from './text';

const DISCLAIMER = 'These alternatives are rubric experiments. They are not cleared for trademark, exchange, or domain use, and the original name is left unchanged.';

function variant(input: BrandInput, name: string, ticker: string, meaning: string, why: string, changed: string): BrandInput & { meaning: string; why: string; changed: string } {
  return { ...input, name, ticker, mode: input.mode === 'existing' ? 'future' : input.mode, address: undefined, meaning, why, changed };
}

export function suggestAlternatives(analysis: BrandAnalysis, count = 5, now = analysis.analyzedAt): ImprovementSuggestion[] {
  const input = analysis.input;
  const name = input.name;
  const ticker = input.ticker;
  const words = wordsOf(name);
  const initials = initialsOf(name);
  const drafts: (BrandInput & { meaning: string; why: string; changed: string })[] = [];
  if (words.length >= 2 && initials.length >= 2 && initials !== ticker) {
    drafts.push(variant(input, name, initials.slice(0, 5), 'Initials of the current name.', 'The ticker becomes guessable from the name.', `Ticker ${ticker || '—'} → ${initials.slice(0, 5)}`));
  }
  if (words.length >= 2 && words[0].length >= 3 && words[0].length <= 12) {
    const nextTicker = normalizeTicker(words[0]).slice(0, 5);
    drafts.push(variant(input, words[0], nextTicker, 'The first word standing alone.', 'A shorter name is easier to say and type.', `Name shortened to “${words[0]}”.`));
  }
  const stripped = name.replace(/\s+(coin|token|inu)$/i, '').trim();
  if (stripped && stripped !== name) {
    drafts.push(variant(input, stripped, initialsOf(stripped).slice(0, 5) || normalizeTicker(stripped).slice(0, 5), 'Generic suffix removed.', 'Coin, token, and inu are common and weak as differentiators.', `Removed a generic suffix from “${name}”.`));
  }
  if (analysis.collisions.some((item) => item.matchType === 'exact-ticker') && name) {
    const extra = (fold(name).replace(/[^a-z]/g, '').split('').find((char) => !ticker.toLowerCase().includes(char)) || 'x').toUpperCase();
    const next = `${ticker}${extra}`.slice(0, 6);
    drafts.push(variant(input, name, next, 'One letter added to a colliding ticker.', 'The extra letter reduces the exact ticker match. It does not prove the new ticker is unused.', `Ticker ${ticker} → ${next}`));
  }
  if (name.length > 18) {
    const short = words.slice(0, 2).join(' ');
    drafts.push(variant(input, short, initialsOf(short).slice(0, 5), 'Long name cut to two words.', 'Shorter names are easier to repeat.', `Trimmed “${name}”.`));
  }
  const seen = new Set<string>();
  const original = `${fold(name)}:${normalizeTicker(ticker)}`;
  const suggestions: ImprovementSuggestion[] = [];
  for (const draft of drafts) {
    const key = `${fold(draft.name)}:${normalizeTicker(draft.ticker)}`;
    if (!draft.name || !draft.ticker || key === original || seen.has(key)) continue;
    seen.add(key);
    const next = analyzeBrand(draft, { profileId: analysis.profileId, weights: analysis.weights, now, collisions: findCollisions(draft.name, draft.ticker, undefined, now) });
    const weak = next.criteria.filter((item) => item.status === 'scored' && item.score !== null && item.score < 6).slice(0, 3).map((item) => item.rationale);
    const strong = next.criteria.filter((item) => item.status === 'scored' && item.score !== null && item.score >= 8).slice(0, 3).map((item) => item.rationale);
    suggestions.push({
      id: `suggestion:${key}`,
      name: draft.name,
      ticker: draft.ticker,
      meaning: draft.meaning,
      why: draft.why,
      changed: draft.changed,
      strengths: strong,
      weaknesses: weak,
      collisions: next.collisions,
      categoryDeltas: CATEGORY_IDS.map((id) => {
        const before = analysis.categories.find((item) => item.id === id)?.score ?? null;
        const after = next.categories.find((item) => item.id === id)?.score ?? null;
        return { id, title: next.categories.find((item) => item.id === id)?.title || id, delta: before === null || after === null ? null : Math.round((after - before) * 10) / 10 };
      }),
      overall: next.overall,
      coverage: next.coverage,
      disclaimer: DISCLAIMER,
    });
  }
  return suggestions.slice(0, Math.max(1, Math.min(20, count)));
}
