import { BUNDLED_DIRECTORY, MEME_ROOTS, type DirectoryEntry } from './directory';
import type { CollisionFinding, CollisionMatchType } from './types';
import { fold, initialsOf, normalizeTicker, similarity, soundex, wordsOf } from './text';

const ORDER: CollisionMatchType[] = ['exact-name', 'exact-ticker', 'normalized', 'word-order', 'abbreviation', 'alias', 'spelling', 'phonetic', 'thematic'];

function confidence(type: CollisionMatchType): CollisionFinding['confidence'] {
  if (type === 'exact-name' || type === 'exact-ticker' || type === 'normalized') return 'high';
  if (type === 'word-order' || type === 'abbreviation' || type === 'spelling' || type === 'alias') return 'medium';
  return 'low';
}

function explain(type: CollisionMatchType, entry: DirectoryEntry) {
  if (type === 'exact-ticker') return `The ticker matches ${entry.name} (${entry.ticker}) in the ${entry.source} list. Duplicate tickers are common in crypto. This row is a confusion warning, not an accusation.`;
  if (type === 'exact-name' || type === 'normalized') return `The name matches ${entry.name} after case and punctuation folding.`;
  if (type === 'word-order') return `The same words appear in a different order than ${entry.name}.`;
  if (type === 'abbreviation') return `The ticker matches initials or the listed ticker of ${entry.name}.`;
  if (type === 'alias') return `The name matches a listed alias of ${entry.name}.`;
  if (type === 'spelling') return `The spelling is close to ${entry.name}, which can be confused at a glance.`;
  if (type === 'phonetic') return `The name sounds similar to ${entry.name}. It is not the same token.`;
  return `Both names share a meme root with ${entry.name}. That is a theme overlap, not proof of copying.`;
}

function matchesFor(entry: DirectoryEntry, name: string, ticker: string): { type: CollisionMatchType; similarity: number }[] {
  const folded = fold(name);
  const entryName = fold(entry.name);
  const entryTicker = normalizeTicker(entry.ticker);
  const compact = folded.replace(/\s/g, '');
  const entryCompact = entryName.replace(/\s/g, '');
  const exact: { type: CollisionMatchType; similarity: number }[] = [];
  if (folded && folded === entryName) exact.push({ type: 'exact-name', similarity: 1 });
  if (ticker && ticker === entryTicker) exact.push({ type: 'exact-ticker', similarity: 1 });
  if (exact.length) return exact;
  if (compact && compact === entryCompact) return [{ type: 'normalized', similarity: 1 }];
  const left = wordsOf(name).map(fold).sort().join(' ');
  const right = wordsOf(entry.name).map(fold).sort().join(' ');
  if (left && left === right && left.includes(' ')) return [{ type: 'word-order', similarity: 0.95 }];
  if (ticker && ticker === initialsOf(entry.name)) return [{ type: 'abbreviation', similarity: 0.9 }];
  if (entryTicker && entryTicker === initialsOf(name)) return [{ type: 'abbreviation', similarity: 0.9 }];
  if ((entry.aliases || []).some((alias) => fold(alias) === folded)) return [{ type: 'alias', similarity: 0.92 }];
  if (folded.length >= 4 && entryName.length >= 4) {
    const ratio = similarity(compact, entryCompact);
    if (ratio >= 0.84) return [{ type: 'spelling', similarity: Math.round(ratio * 100) / 100 }];
    if (soundex(folded) && soundex(folded) === soundex(entryName) && ratio < 0.84) return [{ type: 'phonetic', similarity: 0.7 }];
  }
  const roots = MEME_ROOTS.filter((root) => folded.includes(root) && (entryName.includes(root) || entryTicker.toLowerCase() === root));
  if (roots.length && folded !== entryName) return [{ type: 'thematic', similarity: 0.45 }];
  return [];
}

export function findCollisions(name: string, ticker: string, directory: DirectoryEntry[] = BUNDLED_DIRECTORY, observedAt = 0): CollisionFinding[] {
  const symbol = normalizeTicker(ticker);
  const findings: CollisionFinding[] = [];
  for (const entry of directory) {
    const found = matchesFor(entry, name, symbol);
    for (const match of found) {
      findings.push({
      id: `${entry.source}:${match.type}:${entry.chain}:${entry.ticker}:${entry.address || entry.name}`,
      matchedName: entry.name,
      matchedTicker: entry.ticker,
      source: entry.source,
      address: entry.address,
      chain: entry.chain,
      matchType: match.type,
      similarity: match.similarity,
      url: entry.url,
      observedAt,
      confidence: confidence(match.type),
      explanation: explain(match.type, entry),
    });
    }
  }
  return findings.sort((a, b) => ORDER.indexOf(a.matchType) - ORDER.indexOf(b.matchType) || b.similarity - a.similarity);
}
