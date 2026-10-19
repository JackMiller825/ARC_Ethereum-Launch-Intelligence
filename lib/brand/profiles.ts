import type { CategoryId, CategoryWeights, ProfileId } from './types';
import { CATEGORY_IDS } from './types';

export const DEFAULT_WEIGHTS: CategoryWeights = {
  'first-impression': 12,
  'name-quality': 12,
  'ticker-quality': 12,
  'meme-power': 14,
  narrative: 12,
  originality: 10,
  'brand-identity': 10,
  social: 8,
  audience: 6,
  risk: 4,
};

export const PROFILES: { id: ProfileId; title: string; why: string; weights: CategoryWeights }[] = [
  { id: 'balanced', title: 'Balanced memecoin branding', why: 'Gives meme strength a slight lead while still requiring a readable name and ticker.', weights: DEFAULT_WEIGHTS },
  { id: 'trader', title: 'Ethereum trader recognition', why: 'Emphasizes the ticker, search shape, and confusion risk a trader sees in a feed.', weights: { 'first-impression': 14, 'name-quality': 10, 'ticker-quality': 16, 'meme-power': 8, narrative: 8, originality: 12, 'brand-identity': 6, social: 12, audience: 8, risk: 6 } },
  { id: 'meme', title: 'Meme virality and humor', why: 'Emphasizes joke, remix, and story. A plain but clear name can score lower here on purpose.', weights: { 'first-impression': 14, 'name-quality': 8, 'ticker-quality': 8, 'meme-power': 22, narrative: 16, originality: 8, 'brand-identity': 10, social: 8, audience: 4, risk: 2 } },
  { id: 'long-term', title: 'Long-term brand identity', why: 'Emphasizes a name that can still be said after the joke of the week is gone.', weights: { 'first-impression': 8, 'name-quality': 14, 'ticker-quality': 10, 'meme-power': 6, narrative: 16, originality: 12, 'brand-identity': 16, social: 6, audience: 6, risk: 6 } },
  { id: 'global', title: 'Global readability', why: 'Emphasizes pronunciation, spelling, and readers who are not already in crypto slang.', weights: { 'first-impression': 10, 'name-quality': 20, 'ticker-quality': 14, 'meme-power': 6, narrative: 8, originality: 8, 'brand-identity': 8, social: 10, audience: 12, risk: 4 } },
  { id: 'custom', title: 'Custom', why: 'Your category weights, rescaled so they still add to 100.', weights: DEFAULT_WEIGHTS },
];

export function profileById(id: ProfileId) {
  return PROFILES.find((item) => item.id === id) || PROFILES[0];
}

export function normalizeWeights(weights: Partial<CategoryWeights> | CategoryWeights): CategoryWeights {
  const base = { ...DEFAULT_WEIGHTS };
  for (const id of CATEGORY_IDS) {
    const value = weights[id];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) base[id] = value;
  }
  const sum = CATEGORY_IDS.reduce((total, id) => total + base[id], 0);
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  const next = {} as CategoryWeights;
  let used = 0;
  CATEGORY_IDS.forEach((id, index) => {
    if (index === CATEGORY_IDS.length - 1) next[id] = Math.round((100 - used) * 10) / 10;
    else {
      next[id] = Math.round((base[id] / sum) * 1000) / 10;
      used += next[id];
    }
  });
  return next;
}

export function weightSum(weights: CategoryWeights) {
  return Math.round(CATEGORY_IDS.reduce((total, id) => total + weights[id], 0) * 10) / 10;
}

export function categoryTitle(id: CategoryId) {
  return id;
}
