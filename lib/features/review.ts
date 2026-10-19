import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { FEATURES } from './registry';

export type ReviewDecision = { hash: string; decision: 'updated' | 'unchanged'; note: string };

export function hashSources(paths: string[]) {
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) hash.update(path).update('\0').update(readFileSync(path));
  return hash.digest('hex');
}

export function currentReview() {
  return Object.fromEntries(FEATURES.map((feature) => [feature.id, { hash: hashSources(feature.sources), decision: 'updated' as const, note: 'Reviewed with the token-neutral empty start.' }]));
}
