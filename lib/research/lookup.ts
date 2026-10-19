import { isAddress } from 'viem';

export type LookupToken = { address: string; symbol: string; name: string };

export type LookupResult =
  | { kind: 'empty' }
  | { kind: 'token'; address: string }
  | { kind: 'address'; address: string }
  | { kind: 'many'; tokens: LookupToken[] }
  | { kind: 'text'; query: string };

export function resolveLookup(query: string, tokens: LookupToken[]): LookupResult {
  const text = query.trim();
  if (!text) return { kind: 'empty' };
  if (isAddress(text)) {
    const match = tokens.find((token) => token.address.toLowerCase() === text.toLowerCase());
    return match ? { kind: 'token', address: match.address } : { kind: 'address', address: text };
  }
  const hits = tokens.filter((token) => token.symbol.toLowerCase() === text.toLowerCase() || token.name.toLowerCase() === text.toLowerCase());
  if (hits.length === 1) return { kind: 'token', address: hits[0].address };
  if (hits.length > 1) return { kind: 'many', tokens: hits };
  return { kind: 'text', query: text };
}
