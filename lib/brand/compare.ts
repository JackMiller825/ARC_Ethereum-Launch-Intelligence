import { analyzeBrand } from './score';
import type { BrandInput, ComparisonSession, ProfileId } from './types';
import { RUBRIC_VERSION } from './types';

export function compareBrands(inputs: BrandInput[], options?: { profileId?: ProfileId; weights?: ComparisonSession['weights']; now?: number }): ComparisonSession {
  if (inputs.length < 2 || inputs.length > 20) throw new Error('Compare 2 to 20 name and ticker pairs.');
  const now = options?.now ?? 0;
  const profileId = options?.profileId || 'balanced';
  const analyzed = inputs.map((input) => analyzeBrand(input, { profileId, weights: options?.weights, now }));
  const coverages = analyzed.map((item) => item.coverage);
  const spread = Math.max(...coverages) - Math.min(...coverages);
  const ranked = [...analyzed].sort((a, b) => {
    if (a.overall === null && b.overall === null) return b.coverage - a.coverage;
    if (a.overall === null) return 1;
    if (b.overall === null) return -1;
    return b.overall - a.overall || b.coverage - a.coverage;
  });
  const rows = ranked.map((analysis, index) => ({
    rank: index + 1,
    candidateId: analysis.candidateId,
    name: analysis.input.name,
    ticker: analysis.input.ticker,
    overall: analysis.overall,
    coverage: analysis.coverage,
    label: analysis.label,
    categories: analysis.categories,
    collisions: analysis.collisions,
    analysis,
    warning: analysis.overall === null
      ? 'Coverage is below 40%, so this row is not given an overall score and is not ranked above scored names.'
      : spread >= 25 ? 'Evidence coverage differs across this set by 25 points or more. A higher score with thinner evidence is not a stronger finding.' : '',
  }));
  return {
    id: `compare:${now}:${rows.map((row) => row.candidateId).join('|')}`,
    rubricVersion: RUBRIC_VERSION,
    profileId,
    weights: analyzed[0].weights,
    rows,
    rankingNote: spread >= 25
      ? 'Ranks use the editorial score only when coverage is at least 40%. Rows with less evidence stay below scored rows, and the coverage gap is shown because the set is uneven.'
      : 'Ranks use the same rubric version, profile, and evidence. Collision records do not change when only the weights change.',
    createdAt: now,
  };
}
