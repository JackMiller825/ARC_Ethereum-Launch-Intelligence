import type { BrandInput } from './types';

export type ParsedCandidates = {
  inputs: BrandInput[];
  duplicates: string[];
  overflow: number;
  empty: number;
};

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseCandidateList(text: string, limit = 20): ParsedCandidates {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0]?.split(/[|,]/).map((cell) => cell.trim().toLowerCase()) || [];
  const header = first[0] === 'name' && (first[1] === 'ticker' || first[1] === 'symbol') ? lines.slice(1) : lines;
  const inputs: BrandInput[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  let empty = 0;
  let overflow = 0;
  for (const line of header) {
    const cells = line.split(/[|,]/).map((cell) => cell.trim());
    const [name, ticker, narrative, audience, memeOrigin, mascot, link] = cells;
    if (!name && !ticker) { empty += 1; continue; }
    const key = `${norm(name)}|${norm(ticker)}`;
    if (seen.has(key)) { duplicates.push(`${name} / ${ticker}`); continue; }
    seen.add(key);
    if (inputs.length >= limit) { overflow += 1; continue; }
    inputs.push({
      name: name || '',
      ticker: ticker || '',
      narrative: narrative || undefined,
      audience: audience || undefined,
      memeOrigin: memeOrigin || undefined,
      mascot: mascot || undefined,
      links: link ? { website: link } : undefined,
      imageryDescribed: Boolean(mascot),
      mode: 'future',
    });
  }
  return { inputs, duplicates, overflow, empty };
}
