import { NextRequest, NextResponse } from 'next/server';
import { analyzeToken } from '../chain/analyze';
import { walletRows } from '../chain/wallets';
import { formatEth } from '../format';
import type { AnalysisResult, AnalysisSuccess, WindowSpec } from '../types';
import { addressSchema, parseWindow } from '../validate';

const cache = new Map<string, { at: number; value: AnalysisSuccess }>();
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

export function tooMany(req: NextRequest) {
  const now = Date.now();
  const ip = clientIp(req);
  const recent = (hits.get(ip) || []).filter((stamp) => now - stamp < 60_000);
  if (recent.length >= 20) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function runAnalysis(address: string, window: WindowSpec) {
  const key = `${address.toLowerCase()}:${JSON.stringify(window)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 120_000) return hit.value;
  const result = await analyzeToken({ address, window });
  if (result.ok) cache.set(key, { at: Date.now(), value: result });
  return result;
}

export function windowFrom(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return parseWindow({ mode: q.get('mode'), minutes: q.get('minutes'), start: q.get('start'), end: q.get('end') });
}

export function jsonError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Request failed.';
  return NextResponse.json({ error: message }, { status });
}

export async function handleTokenResource(req: NextRequest, ca: string, resource: string) {
  if (tooMany(req)) return NextResponse.json({ error: 'Rate limit: 20 requests per minute.' }, { status: 429 });
  const parsed = addressSchema.safeParse(ca);
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid 0x-prefixed Ethereum address.' }, { status: 400 });
  let window: WindowSpec;
  try {
    window = windowFrom(req);
  } catch (error) {
    return jsonError(error);
  }
  if (resource === 'metadata') {
    const result = await runAnalysis(parsed.data, { mode: 'launch', minutes: 5 });
    if (!result.ok) return NextResponse.json({ status: 'unavailable', reason: result.reason, warnings: result.warnings }, { status: 404 });
    return NextResponse.json({ token: result.token, source: result.token.source, disclaimer: 'Metadata is read from the contract and Blockscout. Trade KPIs are a separate indexed result.' });
  }
  const result = await runAnalysis(parsed.data, window);
  if (!result.ok) return NextResponse.json({ status: 'unavailable', reason: result.reason, warnings: result.warnings }, { status: 404 });
  return NextResponse.json(shape(resource, result, req));
}

function shape(resource: string, result: AnalysisSuccess, req: NextRequest) {
  if (resource === 'pools') return { pools: result.pools, warnings: result.warnings };
  if (resource === 'launch') return { timeline: result.timeline, projectWallets: result.projectWallets, heuristicVersion: result.coverage.heuristicVersion };
  if (resource === 'metrics') return { kpis: presentKpis(result), coverage: result.coverage, window: result.window, warnings: result.warnings };
  if (resource === 'trades') {
    const page = pageItems(result.trades, req.nextUrl.searchParams.get('cursor'), 50);
    return { trades: page.items, next: page.next, total: page.total, origin: 'chain' };
  }
  if (resource === 'wallets') {
    const klass = req.nextUrl.searchParams.get('class');
    const rows = walletRows(result.trades).filter((row) => !klass || row.classification.toLowerCase() === klass.toLowerCase());
    const page = pageItems(rows, req.nextUrl.searchParams.get('cursor'), 50);
    return { wallets: page.items, next: page.next, total: page.total };
  }
  if (resource === 'comparisons') {
    return { baseline: req.nextUrl.searchParams.get('baseline'), current: { address: result.token.address, symbol: result.token.symbol, kpis: presentKpis(result) }, note: 'Server comparisons need both tokens in the warm cache or Postgres history. The browser history page compares every saved snapshot.' };
  }
  return { error: 'Unknown resource.' };
}

export function presentKpis(result: AnalysisSuccess) {
  const k = result.kpis;
  return {
    grossBuyEth: formatEth(k.grossBuyWei),
    grossSellEth: formatEth(k.grossSellWei),
    botBuyEth: formatEth(k.botBuyWei),
    botSellEth: formatEth(k.botSellWei),
    otherBuyEth: formatEth(k.otherBuyWei),
    netEth: formatEth(k.netWei),
    botBuyShare: k.botBuyShare,
    bands: { highEth: formatEth(k.bands.highWei), mediumEth: formatEth(k.bands.mediumWei), lowEth: formatEth(k.bands.lowWei), unknownEth: formatEth(k.bands.unknownWei) },
    buyCount: k.buyCount,
    sellCount: k.sellCount,
    uniqueBuyers: k.uniqueBuyers,
    uniqueSellers: k.uniqueSellers,
    firstBlockBuyers: k.firstBlockBuyers,
    failedSwaps: k.failedSwaps,
    failedSwapsReason: k.failedSwapsReason,
    priceImpactBps: k.priceImpactBps,
    initialLiquidityEth: formatEth(k.initialLiquidityWei),
    buyerRetention: k.buyerRetention,
    concentrationTop5: k.concentrationTop5,
    unsupportedValuationPct: k.unsupportedValuationPct,
    turnover: k.turnover,
  };
}

export function pageItems<T>(items: T[], cursor: string | null, limit = 50) {
  const start = cursor ? Number(Buffer.from(cursor, 'base64url').toString('utf8')) : 0;
  const safe = Number.isFinite(start) && start > 0 ? start : 0;
  const slice = items.slice(safe, safe + limit);
  const next = safe + limit < items.length ? Buffer.from(String(safe + limit)).toString('base64url') : null;
  return { items: slice, next, total: items.length };
}

export function cachedStatus(): { entries: number } {
  return { entries: cache.size };
}

export type { AnalysisResult };
