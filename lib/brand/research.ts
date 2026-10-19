import type { CollisionFinding, ResearchSource } from './types';
import { fold, normalizeTicker } from './text';

export type LiveResearch = { findings: CollisionFinding[]; sources: ResearchSource[] };

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

const cache = new Map<string, { at: number; value: LiveResearch }>();
const inflight = new Map<string, Promise<LiveResearch>>();

function unavailable(id: string, note: string, now: number): ResearchSource {
  return { id, status: 'unavailable', note, checkedAt: now };
}

export function parseDexScreener(body: unknown, ticker: string, name: string, now: number): CollisionFinding[] {
  const pairs = (body as { pairs?: unknown })?.pairs;
  if (!Array.isArray(pairs)) return [];
  const symbol = normalizeTicker(ticker);
  const folded = fold(name);
  const findings: CollisionFinding[] = [];
  for (const pair of pairs) {
    const token = (pair as { baseToken?: { name?: string; symbol?: string; address?: string }; chainId?: string; url?: string }).baseToken;
    if (!token?.symbol && !token?.name) continue;
    const matchedTicker = normalizeTicker(token.symbol || '');
    const matchedName = token.name || matchedTicker;
    const exactTicker = Boolean(symbol) && matchedTicker === symbol;
    const exactName = Boolean(folded) && fold(matchedName) === folded;
    if (!exactTicker && !exactName) continue;
    findings.push({
      id: `dexscreener:${exactName ? 'exact-name' : 'exact-ticker'}:${pair && (pair as { chainId?: string }).chainId}:${matchedTicker}:${token.address || matchedName}`,
      matchedName,
      matchedTicker,
      source: 'dexscreener',
      address: token.address,
      chain: (pair as { chainId?: string }).chainId,
      matchType: exactName ? 'exact-name' : 'exact-ticker',
      similarity: 1,
      url: (pair as { url?: string }).url,
      observedAt: now,
      confidence: 'high',
      explanation: exactTicker
        ? `DexScreener listed ${matchedName} with the same ticker. A shared ticker is not a fraud finding.`
        : `DexScreener listed an exact name match for ${matchedName}.`,
    });
  }
  return findings;
}

export function parseCoinGecko(body: unknown, ticker: string, name: string, now: number): CollisionFinding[] {
  const coins = (body as { coins?: unknown })?.coins;
  if (!Array.isArray(coins)) return [];
  const symbol = normalizeTicker(ticker);
  const folded = fold(name);
  const findings: CollisionFinding[] = [];
  for (const coin of coins) {
    const row = coin as { id?: string; name?: string; symbol?: string };
    const matchedTicker = normalizeTicker(row.symbol || '');
    const matchedName = row.name || matchedTicker;
    const exactTicker = Boolean(symbol) && matchedTicker === symbol;
    const exactName = Boolean(folded) && fold(matchedName) === folded;
    if (!exactTicker && !exactName) continue;
    findings.push({
      id: `coingecko:${exactName ? 'exact-name' : 'exact-ticker'}:${row.id || matchedName}`,
      matchedName,
      matchedTicker,
      source: 'coingecko',
      matchType: exactName ? 'exact-name' : 'exact-ticker',
      similarity: 1,
      url: row.id ? `https://www.coingecko.com/en/coins/${row.id}` : undefined,
      observedAt: now,
      confidence: 'medium',
      explanation: `CoinGecko search returned ${matchedName} (${matchedTicker}). This is a directory hit, not a legal status.`,
    });
  }
  return findings;
}

export async function researchCollisions(name: string, ticker: string, options?: { fetchImpl?: FetchLike; signal?: AbortSignal; now?: number; ttlMs?: number }): Promise<LiveResearch> {
  const now = options?.now ?? Date.now();
  const key = `${fold(name)}:${normalizeTicker(ticker)}`;
  const ttl = options?.ttlMs ?? 6 * 60 * 60 * 1000;
  const cached = cache.get(key);
  if (cached && now - cached.at < ttl) return cached.value;
  const pending = inflight.get(key);
  if (pending) return pending;
  const fetchImpl = options?.fetchImpl || ((input: string, init?: { signal?: AbortSignal }) => fetch(input, { signal: init?.signal }));
  const job = (async () => {
    const sources: ResearchSource[] = [];
    const findings: CollisionFinding[] = [];
    const tasks = [
      ['dexscreener', `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(normalizeTicker(ticker) || name)}`, parseDexScreener],
      ['coingecko', `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker || name)}`, parseCoinGecko],
    ] as const;
    await Promise.all(tasks.map(async ([id, url, parse]) => {
      try {
        const response = await fetchImpl(url, { signal: options?.signal });
        if (!response.ok) {
          sources.push(unavailable(id, `HTTP failed. No availability was invented.`, now));
          return;
        }
        const body = await response.json();
        const rows = parse(body, ticker, name, now);
        findings.push(...rows);
        sources.push({ id, status: 'ok', note: rows.length ? `${rows.length} exact match(es).` : 'No exact name or ticker match in this response.', checkedAt: now });
      } catch {
        sources.push(unavailable(id, 'The provider could not be reached. Result is unknown, not unique.', now));
      }
    }));
    sources.push(unavailable('domain', 'No domain API is configured.', now));
    sources.push(unavailable('trademark', 'No trademark API is configured. Screened names are not a legal search.', now));
    sources.push(unavailable('web-search', 'No web-search API is configured.', now));
    const value = { findings, sources };
    cache.set(key, { at: now, value });
    return value;
  })();
  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

export function clearResearchCache() {
  cache.clear();
  inflight.clear();
}
